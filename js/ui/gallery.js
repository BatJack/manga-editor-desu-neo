// Gallery — multi-folder image browser with flat section grouping + auto-watch
// Opens folders via webkitdirectory input. Every opened folder stays loaded and is
// rendered as its own top-level section; sub-folders become flat sibling sections
// named "root/sub". Other roots are never touched when a folder is added or refreshed.
// Click a thumbnail → load onto canvas as a small reference.
// Watch mode (showDirectoryPicker) watches exactly one folder for new files.

var galleryState = {
    roots: {},           // rootId -> { id: rootId, name, sectionIds: [] }
    rootOrder: [],       // [rootId, ...] in folder-open order
    sections: {},        // sectionId -> { id, rootId, key, isRoot, name, files: [], sectionEl, gridEl }
    sectionOrder: [],    // [sectionId, ...] DOM render order (flat)
    entryMap: {},        // entryId -> { name, entryId, file, objectUrl, sectionId, itemEl }
    activeRootId: null,  // most recently opened / refreshed folder
    savedPaths: [],      // remembered folder names, most-recent first
    activePath: '',      // path currently shown in the path bar
    watchedRootId: null, // the single folder currently watched (null when off)
    dirHandle: null,     // FileSystemDirectoryHandle (watch mode)
    watchTimer: null,
    watchActive: false,
    sourceMode: 'input',  // 'handle' | 'server' | 'input'
    serverToken: null,     // token handed out by the local Python bridge
    pickerPath: ''         // absolute path currently listed in the folder picker
};

// ── server bridge (local Python API) ─────────────────────────
//
// Brave disables the File System Access API entirely, so when no handle source
// is available the gallery falls back to the loopback server in 99_server.py.
// Server mode stores absolute paths as plain strings, which sidesteps the
// handle-serialization problem that only applies to FileSystemHandle objects.

var GALLERY_API_BASE = '/api/fs/';

// Keys saved server paths by FULL path: two folders can share a leaf name
// (D:\a\shots and D:\b\shots) and must not collapse into one entry.
function galleryServerPathKey(absPath) {
    return 'path::' + absPath;
}

function galleryServerApiUrl(apiPath, params) {
    var url = GALLERY_API_BASE + apiPath;
    if (!params) return url;
    var parts = [];
    for (var key in params) {
        if (!Object.prototype.hasOwnProperty.call(params, key)) continue;
        if (params[key] === undefined || params[key] === null) continue;
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
    return parts.length ? url + '?' + parts.join('&') : url;
}

// Rejects with the HTTP status attached so callers can tell 400 (bad path)
// from 404 (folder gone) from 403 (token rejected) and never retry blindly.
function galleryServerRequest(apiPath, params) {
    var headers = {};
    if (galleryState.serverToken) headers['X-Gallery-Token'] = galleryState.serverToken;
    return fetch(galleryServerApiUrl(apiPath, params), { headers: headers, cache: 'no-store' })
    .then(function (res) {
        if (!res.ok) {
            var err = new Error('gallery api ' + apiPath + ' failed: ' + res.status);
            err.status = res.status;
            throw err;
        }
        return res;
    });
}

function galleryServerList(absPath) {
    return galleryServerRequest('list', { path: absPath }).then(function (res) { return res.json(); });
}

function galleryServerReadImage(absPath, name) {
    return galleryServerRequest('image', { path: absPath, name: name }).then(function (res) { return res.blob(); });
}

// Resolves true only when the bridge answered with a usable token.
function galleryProbeServerBridge() {
    return fetch(GALLERY_API_BASE + 'session', { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('bridge session status ' + res.status);
        return res.json();
    }).then(function (data) {
        if (!data || typeof data.token !== 'string' || !data.token) throw new Error('bridge returned no token');
        galleryState.serverToken = data.token;
        galleryLogger.info('Gallery bridge available, server mode enabled');
        return true;
    }).catch(function (err) {
        galleryState.serverToken = null;
        galleryLogger.warn('Gallery bridge unavailable: ' + err);
        return false;
    });
}

function gallerySelectSourceMode() {
    if (typeof showDirectoryPicker === 'function') {
        galleryState.sourceMode = 'handle';
        return Promise.resolve('handle');
    }
    return galleryProbeServerBridge().then(function (ok) {
        galleryState.sourceMode = ok ? 'server' : 'input';
        galleryLogger.info('Gallery source mode: ' + galleryState.sourceMode);
        return galleryState.sourceMode;
    });
}

// ── server-mode folder picker ───────────────────────────────

// Brave has no native directory dialog, so server mode lists directories over
// the bridge. The picker starts at the parent of the folder the user last used,
// so "up" can never walk out of the chosen subtree.

function galleryPickerParentOf(absPath) {
    if (!absPath) return '';
    var normalized = String(absPath).replace(/[\\/]+$/, '');
    var idx = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
    if (idx <= 0) return '';
    return normalized.substring(0, idx);
}

// True only when the parent of currentPath lies strictly inside startPath.
function galleryPickerShouldShowUp(currentPath, startPath) {
    if (!currentPath || !startPath) return false;
    var parent = galleryPickerParentOf(currentPath);
    if (!parent) return false;
    var start = String(startPath).replace(/[\\/]+$/, '');
    return parent === start || parent.indexOf(start + '/') === 0 || parent.indexOf(start + '\\') === 0;
}

function galleryCloseFolderPicker() {
    var panel = document.getElementById('gallery-fs-picker');
    if (panel) panel.style.display = 'none';
    galleryState.pickerStart = '';
}

function galleryOpenFolderPicker() {
    var panel = document.getElementById('gallery-fs-picker');
    if (!panel) return;
    // Start one level above the active folder so the user can still go up.
    var start = galleryState.activePath && galleryState.sourceMode === 'server'
        ? galleryPickerParentOf(galleryState.activePath)
        : '';
    galleryState.pickerStart = start;
    panel.style.display = 'flex';
    if (start) {
        galleryFolderPickerRender(start);
    } else {
        galleryFolderPickerRender('');
    }
}

function galleryFolderPickerGoUp() {
    if (!galleryPickerShouldShowUp(galleryState.pickerPath, galleryState.pickerStart)) {
        galleryLogger.info('Gallery picker: refusing to leave the start directory');
        return;
    }
    galleryFolderPickerRender(galleryPickerParentOf(galleryState.pickerPath));
}

// path === '' lists drives/roots the bridge reports as available entry points.
function galleryFolderPickerRender(absPath) {
    galleryState.pickerPath = absPath || '';
    var pathEl = document.getElementById('gallery-fs-picker-path');
    var listEl = document.getElementById('gallery-fs-picker-list');
    var upBtn = document.getElementById('gallery-fs-picker-up');
    var confirmBtn = document.getElementById('gallery-fs-picker-confirm');
    if (!listEl) return;

    if (pathEl) pathEl.textContent = absPath || getText('gallery-picker-roots');
    if (upBtn) upBtn.style.display = galleryPickerShouldShowUp(absPath, galleryState.pickerStart) ? 'inline-flex' : 'none';
    if (confirmBtn) confirmBtn.style.display = absPath ? 'inline-flex' : 'none';

    listEl.innerHTML = '';

    var render = function (folders) {
        if (!folders.length) {
            var empty = document.createElement('div');
            empty.className = 'gallery-fs-picker-empty';
            empty.textContent = getText('gallery-picker-empty');
            listEl.appendChild(empty);
            return;
        }
        folders.forEach(function (folder) {
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'gallery-fs-picker-item';
            var icon = document.createElement('i');
            icon.className = 'material-icons';
            icon.textContent = 'folder';
            var name = document.createElement('span');
            // Folder names come from disk and may contain <, & or ".
            name.textContent = folder.name;
            item.appendChild(icon);
            item.appendChild(name);
            item.addEventListener('click', function () {
                galleryFolderPickerRender(folder.path);
            });
            listEl.appendChild(item);
        });
    };

    if (!absPath) {
        render(galleryState.pickerRoots || []);
        return;
    }

    galleryServerList(absPath).then(function (data) {
        render(data.folders || []);
    }).catch(function (err) {
        galleryLogger.warn('Gallery picker list failed for ' + absPath + ': ' + err);
        galleryState.pickerStart = '';
        var panel = document.getElementById('gallery-fs-picker');
        if (panel) panel.style.display = 'none';
    });
}

function galleryFolderPickerConfirm() {
    var absPath = galleryState.pickerPath;
    if (!absPath) return;
    galleryServerList(absPath).then(function (data) {
        var images = data.images || [];
        if (!images.length) {
            galleryLogger.warn('Gallery picker: no images in ' + absPath);
            return;
        }
        // Reuse the existing section/grouping code by handing it File-like
        // objects that carry webkitRelativePath, exactly as the input and
        // handle paths already do.
        var rootId = galleryServerLeafName(absPath);
        var files = images.map(function (image) {
            return galleryServerFileLike(absPath, rootId, image);
        });
        galleryCloseFolderPicker();
        galleryLoadFolder(rootId, files, document.getElementById('gallery-info'));
        galleryAddServerPath(absPath, rootId);
        galleryUpdateWatchButton();
    }).catch(function (err) {
        galleryLogger.warn('Gallery picker confirm failed for ' + absPath + ': ' + err);
    });
}

function galleryServerLeafName(absPath) {
    var normalized = String(absPath).replace(/[\\/]+$/, '');
    var idx = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
    return idx >= 0 ? normalized.substring(idx + 1) : normalized;
}

function galleryServerFileLike(absPath, rootId, image) {
    // The gallery only needs name/type/webkitRelativePath until the image is
    // materialised, so a lightweight stand-in avoids reading every file up
    // front. webkitRelativePath drives the existing section/grouping code.
    return {
        name: image.name,
        size: image.size,
        lastModified: image.mtime,
        type: 'image/' + (image.name.split('.').pop() || 'png').toLowerCase(),
        webkitRelativePath: rootId + '/' + image.name,
        __galleryServerPath: absPath,
        __galleryServerName: image.name
    };
}

function galleryAddServerPath(absPath, rootId) {
    var key = galleryServerPathKey(absPath);
    galleryState.serverPaths = galleryState.serverPaths || {};
    galleryState.serverPaths[key] = { path: absPath, rootId: rootId };
    try {
        localStorage.setItem('galleryServerPaths', JSON.stringify(galleryState.serverPaths));
    } catch (err) {
        galleryLogger.warn('Failed to save server paths: ' + err);
    }
    galleryAddSavedPath(rootId);
}
// Entry keys always contain "::", so they can never collide with Object.prototype
// members. entryMap still uses a null prototype so for-in iteration is exact.
function galleryNewEntryMap() {
    return Object.create(null);
}

// ── identity helpers ───────────────────────────────────────

function galleryGroupKey(file) {
    var rel = file.webkitRelativePath || '';
    var idx = rel.lastIndexOf('/');
    return idx > 0 ? rel.substring(0, idx) : '';
}

// Root id is the root folder name. NOTE: webkitdirectory exposes no absolute path,
// so two different folders that share a leaf name are indistinguishable and will be
// treated as the same root. This is an inherent platform limitation, not a bug here.
function galleryRootIdFromFiles(files) {
    if (!files || !files.length) return 'folder';
    var rel = files[0].webkitRelativePath || '';
    var idx = rel.indexOf('/');
    var name = idx > 0 ? rel.substring(0, idx) : '';
    return name || 'folder';
}

// Sub-folder key relative to its root ('' for files sitting directly in the root)
function gallerySubKey(rootId, file) {
    var groupKey = galleryGroupKey(file);
    if (groupKey === rootId) return '';
    var prefix = rootId + '/';
    if (groupKey.indexOf(prefix) === 0) return groupKey.substring(prefix.length);
    return groupKey;
}

function gallerySectionId(rootId, subKey) {
    return rootId + '::' + subKey;
}

function gallerySectionName(rootId, subKey) {
    return subKey ? rootId + '/' + subKey : rootId;
}

function gallerySectionPrefix(rootId) {
    return rootId + '::';
}

function galleryToggleSection(header) {
    var section = header.parentElement;
    var isCollapsed = section.classList.toggle('collapsed');
    section.classList.toggle('expanded');
    var chevron = header.querySelector('.gallery-chevron');
    if (chevron) chevron.textContent = isCollapsed ? '▶' : '▼';
}

// ── revoke / teardown ──────────────────────────────────────

function galleryRevokeAll() {
    for (var entryId in galleryState.entryMap) {
        var entry = galleryState.entryMap[entryId];
        if (entry && entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    }
}

// The Watch button holds an icon plus a localized label span. Assigning to
// textContent would delete the icon, so only the label span is ever updated.
function gallerySetWatchLabel(isWatching) {
    var watchBtn = document.getElementById('gallery-watch-btn');
    if (!watchBtn) return;
    var label = watchBtn.querySelector('[data-i18n]');
    if (!label) return;
    var key = isWatching ? 'gallery-watching' : 'gallery-watch';
    label.textContent = getText(key);
    label.setAttribute('data-i18n', key);
    watchBtn.setAttribute('aria-label', getText(key));
}

function galleryStopWatch() {
    if (galleryState.watchTimer) {
        clearInterval(galleryState.watchTimer);
        galleryState.watchTimer = null;
    }
    if (galleryState.watchActive) {
        galleryLogger.info('Gallery watch stopped for: ' + galleryState.watchedRootId);
    }
    galleryState.watchActive = false;
    galleryState.watchedRootId = null;
    galleryState.dirHandle = null;
    var watchBtn = document.getElementById('gallery-watch-btn');
    if (watchBtn) {
        gallerySetWatchLabel(false);
        watchBtn.classList.remove('active');
    }
}

// Removes one folder (all of its sections). Other folders stay fully loaded.
function galleryRemoveRoot(rootId) {
    var root = galleryState.roots[rootId];
    if (!root) return;

    var sectionIds = root.sectionIds.slice();
    for (var i = 0; i < sectionIds.length; i++) {
        var section = galleryState.sections[sectionIds[i]];
        if (!section) continue;
        galleryDropSectionEntries(section.id);
        galleryDetachSection(section);
    }

    delete galleryState.roots[rootId];
    var rootIdx = galleryState.rootOrder.indexOf(rootId);
    if (rootIdx > -1) galleryState.rootOrder.splice(rootIdx, 1);

    if (galleryState.watchedRootId === rootId) galleryStopWatch();
    if (galleryState.activeRootId === rootId) {
        galleryState.activeRootId = galleryState.rootOrder.length
            ? galleryState.rootOrder[galleryState.rootOrder.length - 1]
            : null;
    }

    galleryLogger.info('Gallery: removed folder ' + rootId);
    galleryUpdateInfo();
}

// Removes a single sub-folder section. Root sections delegate to galleryRemoveRoot.
function galleryRemoveSection(sectionId) {
    var section = galleryState.sections[sectionId];
    if (!section) return;
    if (section.isRoot) {
        galleryRemoveRoot(section.rootId);
        return;
    }
    galleryDropSectionEntries(sectionId);
    galleryDetachSection(section);
    galleryLogger.info('Gallery: removed sub-folder ' + section.name);
    galleryUpdateInfo();
}

function galleryDropSectionEntries(sectionId) {
    var entryIds = [];
    for (var entryId in galleryState.entryMap) {
        if (galleryState.entryMap[entryId].sectionId === sectionId) entryIds.push(entryId);
    }
    for (var i = 0; i < entryIds.length; i++) galleryDropEntry(entryIds[i]);
}

function galleryDropEntry(entryId) {
    var entry = galleryState.entryMap[entryId];
    if (!entry) return;
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
    if (entry.itemEl) entry.itemEl.remove();
    var section = galleryState.sections[entry.sectionId];
    if (section) {
        var fileIdx = section.files.indexOf(entry.file);
        if (fileIdx > -1) section.files.splice(fileIdx, 1);
        galleryUpdateSectionCount(section);
    }
    delete galleryState.entryMap[entryId];
}

function galleryDetachSection(section) {
    var root = galleryState.roots[section.rootId];
    if (root) {
        var rootIdx = root.sectionIds.indexOf(section.id);
        if (rootIdx > -1) root.sectionIds.splice(rootIdx, 1);
    }
    var orderIdx = galleryState.sectionOrder.indexOf(section.id);
    if (orderIdx > -1) galleryState.sectionOrder.splice(orderIdx, 1);
    if (section.sectionEl) section.sectionEl.remove();
    delete galleryState.sections[section.id];
}

function galleryClearAll() {
    galleryStopWatch();
    galleryRevokeAll();
    var container = document.getElementById('gallery-sections');
    if (container) container.innerHTML = '';
    galleryState.roots = {};
    galleryState.rootOrder = [];
    galleryState.sections = {};
    galleryState.sectionOrder = [];
    galleryState.entryMap = galleryNewEntryMap();
    galleryState.activeRootId = null;
    galleryLogger.info('Gallery cleared');
    galleryUpdateInfo();
}

// ── saved paths persistence ────────────────────────────────

var GALLERY_PATHS_KEY = 'galleryPaths';
var GALLERY_LAST_PATH_KEY = 'galleryLastPath'; // legacy single-path key, migrated on read

// Remembered folder list, most-recent first. Migrates the legacy single-path value.
function galleryGetSavedPaths() {
    var paths = [];
    try {
        var raw = localStorage.getItem(GALLERY_PATHS_KEY);
        var parsed = raw ? JSON.parse(raw) : null;
        if (Array.isArray(parsed)) paths = parsed;
    } catch (err) {
        galleryLogger.warn('Failed to read saved gallery paths: ' + err);
    }
    try {
        var legacy = localStorage.getItem(GALLERY_LAST_PATH_KEY);
        if (legacy && paths.indexOf(legacy) === -1) paths.unshift(legacy);
    } catch (err) {
        galleryLogger.warn('Failed to read legacy gallery path: ' + err);
    }
    return paths.filter(function (p) { return typeof p === 'string' && p; });
}

function gallerySetSavedPaths(paths) {
    galleryState.savedPaths = paths;
    try {
        localStorage.setItem(GALLERY_PATHS_KEY, JSON.stringify(paths));
    } catch (err) {
        galleryLogger.warn('Failed to save gallery paths: ' + err);
    }
}

// New folders go to the top; already-remembered ones keep their position.
function galleryAddSavedPath(path) {
    if (!path) return;
    var paths = (galleryState.savedPaths || []).slice();
    if (paths.indexOf(path) === -1) paths.unshift(path);
    gallerySetSavedPaths(paths);
    galleryState.activePath = path;
    galleryUpdatePathBar();
}

function galleryUpdatePathBar() {
    var bar = document.getElementById('gallery-path-bar');
    var text = document.getElementById('gallery-path-text');
    if (!bar || !text) return;
    var paths = galleryState.savedPaths || [];
    if (!paths.length) {
        bar.style.display = 'none';
        galleryClosePathMenu();
        return;
    }
    if (paths.indexOf(galleryState.activePath) === -1) galleryState.activePath = paths[0];
    text.textContent = galleryState.activePath;
    bar.style.display = 'flex';
    galleryRenderPathMenu();
}

// Directory handles are persisted with raw IndexedDB, NOT localforage.
// localforage JSON-serializes any value that is not an ArrayBuffer/Blob, and
// FileSystemDirectoryHandle keeps name/kind on its prototype — JSON.stringify
// reduces it to {}. Every saved path would then fail the handle check and fall
// back to openGalleryFolder(), whose OS dialog always starts at the last-used
// location. IndexedDB stores the handle through the structured clone algorithm,
// which preserves it across sessions.
var GALLERY_HANDLE_DB = 'galleryHandleDb';
var GALLERY_HANDLE_STORE = 'handles';

function galleryHandleDb() {
    return new Promise(function (resolve, reject) {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB unavailable'));
            return;
        }
        var req = indexedDB.open(GALLERY_HANDLE_DB, 1);
        req.onupgradeneeded = function () {
            var db = req.result;
            if (!db.objectStoreNames.contains(GALLERY_HANDLE_STORE)) {
                db.createObjectStore(GALLERY_HANDLE_STORE);
            }
        };
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
        req.onblocked = function () { reject(new Error('IndexedDB upgrade blocked')); };
    });
}

function galleryHandleStoreSet(key, value) {
    return galleryHandleDb().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(GALLERY_HANDLE_STORE, 'readwrite');
            tx.objectStore(GALLERY_HANDLE_STORE).put(value, key);
            tx.oncomplete = function () { resolve(); };
            tx.onerror = function () { reject(tx.error); };
            tx.onabort = function () { reject(tx.error); };
        });
    });
}

function galleryHandleStoreGet(key) {
    return galleryHandleDb().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(GALLERY_HANDLE_STORE, 'readonly');
            var req = tx.objectStore(GALLERY_HANDLE_STORE).get(key);
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    });
}

function galleryHandleStoreDelete(key) {
    return galleryHandleDb().then(function (db) {
        return new Promise(function (resolve, reject) {
            var tx = db.transaction(GALLERY_HANDLE_STORE, 'readwrite');
            tx.objectStore(GALLERY_HANDLE_STORE).delete(key);
            tx.oncomplete = function () { resolve(); };
            tx.onerror = function () { reject(tx.error); };
            tx.onabort = function () { reject(tx.error); };
        });
    });
}

function galleryDirHandleKey(path) {
    return 'handle::' + path;
}

function galleryPersistDirHandle(handle) {
    if (!handle || !handle.name) return;
    galleryHandleStoreSet(galleryDirHandleKey(handle.name), handle).catch(function (err) {
        galleryLogger.warn('Failed to persist directory handle: ' + err);
    });
}

function galleryRemoveDirHandle(path) {
    galleryHandleStoreDelete(galleryDirHandleKey(path)).catch(function (err) {
        galleryLogger.warn('Failed to remove persisted directory handle: ' + err);
    });
}

// Forget one saved folder — loaded images and watch mode stay untouched
function galleryRemoveSavedPath(path, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    var paths = (galleryState.savedPaths || []).filter(function (p) { return p !== path; });
    gallerySetSavedPaths(paths);
    galleryRemoveDirHandle(path);
    try {
        localStorage.removeItem(GALLERY_LAST_PATH_KEY);
    } catch (err) {
        galleryLogger.warn('Failed to remove legacy gallery path: ' + err);
    }
    if (galleryState.activePath === path) galleryState.activePath = paths.length ? paths[0] : '';
    galleryUpdatePathBar();
    galleryLogger.info('Gallery saved path removed: ' + path);
}

// Forget every saved folder — loaded images and watch mode stay untouched
function galleryClearSavedPath(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    (galleryState.savedPaths || []).forEach(function (p) { galleryRemoveDirHandle(p); });
    gallerySetSavedPaths([]);
    try {
        localStorage.removeItem(GALLERY_LAST_PATH_KEY);
    } catch (err) {
        galleryLogger.warn('Failed to remove legacy gallery path: ' + err);
    }
    galleryState.activePath = '';
    galleryUpdatePathBar();
    galleryLogger.info('Gallery saved paths cleared');
}

// ── saved-path dropdown ────────────────────────────────────

function galleryRenderPathMenu() {
    var menu = document.getElementById('gallery-path-menu');
    if (!menu) return;
    menu.innerHTML = '';
    var paths = galleryState.savedPaths || [];
    paths.forEach(function (path) {
        var item = document.createElement('div');
        item.className = 'gallery-path-item';
        if (path === galleryState.activePath) item.classList.add('active');
        item.setAttribute('role', 'menuitem');
        item.setAttribute('tabindex', '0');
        item.title = path;

        var icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = 'folder';

        var name = document.createElement('span');
        name.className = 'gallery-path-item-name';
        name.textContent = path;

        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'gallery-path-item-remove';
        removeBtn.setAttribute('data-i18n-title', 'gallery-remove-folder');
        removeBtn.setAttribute('aria-label', getText('gallery-remove-folder'));
        removeBtn.title = getText('gallery-remove-folder');
        var removeIcon = document.createElement('i');
        removeIcon.className = 'material-icons';
        removeIcon.textContent = 'close';
        removeBtn.appendChild(removeIcon);

        item.appendChild(icon);
        item.appendChild(name);
        item.appendChild(removeBtn);

        item.addEventListener('click', function (ev) {
            if (ev.target.closest('.gallery-path-item-remove')) return;
            galleryRefreshFromPath(path, ev);
        });
        item.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                galleryRefreshFromPath(path, ev);
            }
        });
        removeBtn.addEventListener('click', function (ev) {
            galleryRemoveSavedPath(path, ev);
        });

        menu.appendChild(item);
    });

    if (paths.length > 1) {
        var sep = document.createElement('div');
        sep.className = 'gallery-path-menu-sep';
        var clearAll = document.createElement('div');
        clearAll.className = 'gallery-path-item gallery-path-item-danger';
        clearAll.setAttribute('role', 'menuitem');
        clearAll.setAttribute('tabindex', '0');
        clearAll.textContent = getText('gallery-clear-all');
        clearAll.addEventListener('click', function (ev) { galleryClearSavedPath(ev); });
        clearAll.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault();
                galleryClearSavedPath(ev);
            }
        });
        menu.appendChild(sep);
        menu.appendChild(clearAll);
    }
}

function galleryTogglePathMenu(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    var menu = document.getElementById('gallery-path-menu');
    if (!menu) return;
    var willOpen = menu.style.display !== 'block';
    if (willOpen) galleryRenderPathMenu();
    menu.style.display = willOpen ? 'block' : 'none';
    var toggle = document.getElementById('gallery-path-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

function galleryClosePathMenu() {
    var menu = document.getElementById('gallery-path-menu');
    if (menu) menu.style.display = 'none';
    var toggle = document.getElementById('gallery-path-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

function galleryOnDocumentClick(e) {
    var bar = document.getElementById('gallery-path-bar');
    if (bar && !bar.contains(e.target)) galleryClosePathMenu();
}

// ── info line ──────────────────────────────────────────────

function galleryUpdateInfo(progressText) {
    var infoEl = document.getElementById('gallery-info');
    if (!infoEl) return;
    if (progressText) {
        infoEl.textContent = progressText;
        return;
    }
    var rootCount = galleryState.rootOrder.length;
    if (rootCount === 0) {
        infoEl.textContent = '';
        return;
    }
    var imageCount = Object.keys(galleryState.entryMap).length;
    var folders = rootCount + (rootCount === 1 ? ' folder · ' : ' folders · ');
    infoEl.textContent = folders + imageCount + (imageCount === 1 ? ' image' : ' images');
}

function galleryUpdateSectionCount(section) {
    if (!section || !section.sectionEl) return;
    var countEl = section.sectionEl.querySelector('.gallery-section-count');
    if (countEl) countEl.textContent = String(section.files.length);
}

function galleryUpdateWatchButton() {
    var watchBtn = document.getElementById('gallery-watch-btn');
    if (!watchBtn) return;
    // Watch needs a re-pollable source: a handle, or the loopback bridge.
    // Plain input mode has neither.
    if (galleryState.sourceMode === 'input') {
        watchBtn.style.display = 'none';
        return;
    }
    watchBtn.style.display = 'inline-flex';
}

// ── section DOM ────────────────────────────────────────────

// Built with createElement + textContent (never innerHTML) because folder and file
// names come from the filesystem and may contain <, & or " characters.
function galleryCreateSectionEl(section) {
    var isRoot = section.isRoot;

    var sectionEl = document.createElement('div');
    sectionEl.className = 'gallery-section ' + (isRoot ? 'expanded' : 'collapsed');
    sectionEl.dataset.section = section.id;
    sectionEl.dataset.root = isRoot ? '1' : '0';

    var header = document.createElement('div');
    header.className = 'gallery-section-header' + (isRoot ? ' gallery-root-header' : '');

    var chevron = document.createElement('span');
    chevron.className = 'gallery-chevron';
    chevron.textContent = isRoot ? '▼' : '▶';

    var icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.textContent = 'folder';

    var nameSpan = document.createElement('span');
    nameSpan.className = 'gallery-section-name';
    nameSpan.textContent = section.name;

    var countSpan = document.createElement('span');
    countSpan.className = 'gallery-section-count';
    countSpan.textContent = String(section.files.length);

    var removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'gallery-section-remove';
    removeBtn.setAttribute('data-i18n-title', 'gallery-remove-folder');
    removeBtn.setAttribute('aria-label', getText('gallery-remove-folder'));
    removeBtn.title = getText('gallery-remove-folder');
    var removeIcon = document.createElement('i');
    removeIcon.className = 'material-icons';
    removeIcon.textContent = 'close';
    removeBtn.appendChild(removeIcon);
    removeBtn.addEventListener('click', (function (secId, rootLevel) {
        return function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (rootLevel) galleryRemoveRoot(secId);
            else galleryRemoveSection(secId);
        };
    })(section.rootId, isRoot));

    header.appendChild(chevron);
    header.appendChild(icon);
    header.appendChild(nameSpan);
    header.appendChild(countSpan);
    header.appendChild(removeBtn);
    header.addEventListener('click', function () { galleryToggleSection(this); });

    var grid = document.createElement('div');
    grid.className = 'gallery-grid';
    grid.dataset.section = section.id;

    sectionEl.appendChild(header);
    sectionEl.appendChild(grid);

    section.sectionEl = sectionEl;
    section.gridEl = grid;
    return sectionEl;
}

function galleryCreateItemEl(entry, objectUrl) {
    var item = document.createElement('div');
    item.className = 'gallery-item';
    item.dataset.entryId = entry.entryId;

    var img = document.createElement('img');
    img.className = 'gallery-thumb';
    img.loading = 'lazy';
    img.alt = entry.name;
    img.addEventListener('load', function () {
        if (img.naturalWidth && img.naturalHeight) {
            img.style.aspectRatio = img.naturalWidth / img.naturalHeight;
        }
    });
    img.src = objectUrl;

    var nameSpan = document.createElement('span');
    nameSpan.className = 'gallery-item-name';
    nameSpan.textContent = entry.name;

    item.appendChild(img);
    item.appendChild(nameSpan);
    item.addEventListener('click', (function (url, nm) {
        return function () { loadGalleryImageToCanvas(url, nm); };
    })(objectUrl, entry.name));

    entry.objectUrl = objectUrl;
    entry.itemEl = item;
    return item;
}

// ── section registration ───────────────────────────────────

function galleryEnsureSection(root, rootId, subKey, container) {
    var sectionId = gallerySectionId(rootId, subKey);
    var section = galleryState.sections[sectionId];
    if (section) return section;
    section = {
        id: sectionId,
        rootId: rootId,
        key: subKey,
        isRoot: subKey === '',
        name: gallerySectionName(rootId, subKey),
        files: [],
        sectionEl: null,
        gridEl: null
    };
    galleryState.sections[sectionId] = section;
    galleryState.sectionOrder.push(sectionId);
    root.sectionIds.push(sectionId);
    container.appendChild(galleryCreateSectionEl(section));
    return section;
}

// ── chunked render ─────────────────────────────────────────

function galleryRenderEntries(entries, infoEl) {
    if (!entries.length) {
        galleryUpdateInfo();
        galleryUpdateWatchButton();
        return;
    }
    var chunkSize = 60;
    var idx = 0;
    var loaded = 0;

    function processChunk() {
        var end = Math.min(idx + chunkSize, entries.length);
        for (var i = idx; i < end; i++) {
            var entry = entries[i];
            var section = galleryState.sections[entry.sectionId];
            if (!section || !section.gridEl) continue;
            var objectUrl = URL.createObjectURL(entry.file);
            section.gridEl.appendChild(galleryCreateItemEl(entry, objectUrl));
            loaded++;
        }
        idx = end;
        if (infoEl) infoEl.textContent = loaded + ' / ' + entries.length + ' images';

        if (idx < entries.length) {
            setTimeout(processChunk, 0);
        } else {
            galleryLogger.info('Gallery render complete: ' + loaded + ' image(s)');
            galleryUpdateInfo();
            galleryUpdateWatchButton();
        }
    }

    if (infoEl) infoEl.textContent = '0 / ' + entries.length + ' images';
    setTimeout(processChunk, 50);
}

function galleryRootFiles(rootId) {
    var root = galleryState.roots[rootId];
    var result = [];
    if (!root) return result;
    for (var i = 0; i < root.sectionIds.length; i++) {
        var section = galleryState.sections[root.sectionIds[i]];
        if (!section) continue;
        for (var j = 0; j < section.files.length; j++) result.push(section.files[j]);
    }
    return result;
}

// ── add a brand new folder (appended, never replaces) ──────

function galleryAddRoot(rootId, imageFiles, infoEl) {
    var container = document.getElementById('gallery-sections');
    if (!container) return;

    var root = galleryState.roots[rootId];
    if (!root) {
        root = { id: rootId, name: rootId, sectionIds: [] };
        galleryState.roots[rootId] = root;
        galleryState.rootOrder.push(rootId);
    }
    galleryState.activeRootId = rootId;
    galleryLogger.info('Gallery: adding folder ' + rootId + ' (' + imageFiles.length + ' images)');

    // bucket the folder's files by sub-folder
    var buckets = {};
    for (var i = 0; i < imageFiles.length; i++) {
        var file = imageFiles[i];
        var subKey = gallerySubKey(rootId, file);
        if (!buckets[subKey]) buckets[subKey] = [];
        buckets[subKey].push(file);
    }

    // root files first, then sub-folders alphabetically
    var subKeys = Object.keys(buckets).sort(function (a, b) {
        if (!a) return -1;
        if (!b) return 1;
        return a.localeCompare(b);
    });

    var entries = [];
    for (var s = 0; s < subKeys.length; s++) {
        var key = subKeys[s];
        var section = galleryEnsureSection(root, rootId, key, container);
        var files = buckets[key];
        for (var f = 0; f < files.length; f++) {
            var entryId = gallerySectionId(rootId, key) + '::' + files[f].name;
            if (galleryState.entryMap[entryId]) continue;
            var entry = {
                name: files[f].name,
                entryId: entryId,
                file: files[f],
                objectUrl: null,
                sectionId: section.id,
                itemEl: null
            };
            galleryState.entryMap[entryId] = entry;
            section.files.push(files[f]);
            entries.push(entry);
        }
        galleryUpdateSectionCount(section);
    }

    galleryRenderEntries(entries, infoEl);
}

// ── refresh an already loaded folder (scoped diff) ─────────

function gallerySyncRoot(rootId, imageFiles, infoEl) {
    var root = galleryState.roots[rootId];
    if (!root) return galleryAddRoot(rootId, imageFiles, infoEl);

    var container = document.getElementById('gallery-sections');
    if (!container) return;

    galleryState.activeRootId = rootId;
    galleryLogger.info('Gallery: refreshing folder ' + rootId + ' (' + imageFiles.length + ' images)');

    // entryId -> File, plus entryId -> subKey. The sub-key is carried alongside
    // instead of re-parsed out of the entryId, because a file name may itself
    // contain "::" and would break lastIndexOf() parsing.
    var newEntryIds = {};
    var newEntrySubKeys = {};
    for (var i = 0; i < imageFiles.length; i++) {
        var subKey = gallerySubKey(rootId, imageFiles[i]);
        var sectionId = gallerySectionId(rootId, subKey);
        var entryId = sectionId + '::' + imageFiles[i].name;
        newEntryIds[entryId] = imageFiles[i];
        newEntrySubKeys[entryId] = subKey;
    }

    // removed = entries of THIS root only; other roots are never inspected or touched
    var prefix = gallerySectionPrefix(rootId);
    var removedIds = [];
    for (var oldId in galleryState.entryMap) {
        var existing = galleryState.entryMap[oldId];
        if (existing.sectionId.indexOf(prefix) !== 0) continue;
        if (!newEntryIds[oldId]) removedIds.push(oldId);
    }
    for (var r = 0; r < removedIds.length; r++) {
        galleryDropEntry(removedIds[r]);
        galleryLogger.info('Gallery: removed ' + removedIds[r]);
    }

    // drop sections that lost all their files (root section survives while any
    // sub-folder of the same folder still has images)
    var rootHasFiles = false;
    for (var k = 0; k < root.sectionIds.length; k++) {
        var live = galleryState.sections[root.sectionIds[k]];
        if (live && live.files.length > 0) {
            rootHasFiles = true;
            break;
        }
    }
    var staleSections = [];
    for (var m = 0; m < root.sectionIds.length; m++) {
        var sec = galleryState.sections[root.sectionIds[m]];
        if (!sec || sec.files.length > 0) continue;
        if (sec.isRoot && rootHasFiles) continue;
        staleSections.push(sec.id);
    }
    for (var d = 0; d < staleSections.length; d++) galleryDetachSection(galleryState.sections[staleSections[d]]);

    // added
    var addedEntries = [];
    for (var newId in newEntryIds) {
        if (galleryState.entryMap[newId]) continue;
        var target = galleryEnsureSection(root, rootId, newEntrySubKeys[newId], container);
        var newEntry = {
            name: newEntryIds[newId].name,
            entryId: newId,
            file: newEntryIds[newId],
            objectUrl: null,
            sectionId: target.id,
            itemEl: null
        };
        galleryState.entryMap[newId] = newEntry;
        target.files.push(newEntryIds[newId]);
        addedEntries.push(newEntry);
    }
    for (var u = 0; u < root.sectionIds.length; u++) {
        galleryUpdateSectionCount(galleryState.sections[root.sectionIds[u]]);
    }

    if (!removedIds.length && !addedEntries.length) {
        galleryLogger.info('Gallery: no changes detected in ' + rootId);
    } else {
        galleryLogger.info('Gallery: ' + rootId + ' +' + addedEntries.length + ' / -' + removedIds.length);
    }
    galleryRenderEntries(addedEntries, infoEl);
}

// Shared by the folder picker, the remembered-path refresh and watch mode
function galleryLoadFolder(rootId, imageFiles, infoEl) {
    if (galleryState.roots[rootId]) gallerySyncRoot(rootId, imageFiles, infoEl);
    else galleryAddRoot(rootId, imageFiles, infoEl);
}

// ── watch mode (showDirectoryPicker) — one folder only ─────

function galleryToggleWatch() {
    var btn = document.getElementById('gallery-watch-btn');
    if (!btn) return;

    if (galleryState.watchActive) {
        galleryStopWatch();
        return;
    }

    if (typeof showDirectoryPicker === 'undefined') {
        galleryLogger.warn('showDirectoryPicker not available');
        return;
    }

    showDirectoryPicker({ mode: 'read' }).then(function (handle) {
        var rootId = handle.name || 'folder';
        galleryState.dirHandle = handle;
        galleryState.watchedRootId = rootId;
        galleryState.watchActive = true;
        gallerySetWatchLabel(true);
        btn.classList.add('active');
        galleryPersistDirHandle(handle);
        galleryAddSavedPath(rootId);
        galleryLogger.info('Gallery watch started for: ' + rootId);

        if (galleryState.roots[rootId]) {
            galleryState.activeRootId = rootId;
            galleryUpdateInfo();
        } else {
            galleryWalkHandle(handle, rootId + '/', []).then(function (imageFiles) {
                if (imageFiles.length > 0) {
                    galleryAddRoot(rootId, imageFiles, document.getElementById('gallery-info'));
                } else {
                    galleryLogger.warn('No image files found in ' + rootId);
                }
            }).catch(function (err) {
                galleryLogger.warn('Failed to read watched folder "' + rootId + '": ' + err);
            });
        }

        if (galleryState.watchTimer) clearInterval(galleryState.watchTimer);
        galleryState.watchTimer = setInterval(galleryWatchPoll, 4000);
    }).catch(function (err) {
        galleryLogger.warn('Gallery watch setup cancelled or failed: ' + err);
    });
}

// Polls only the watched folder's top level and writes only into that folder's sections.
function galleryWatchPoll() {
    if (!galleryState.dirHandle || !galleryState.watchActive) return;
    var rootId = galleryState.watchedRootId;
    var handle = galleryState.dirHandle;
    if (!rootId || !galleryState.roots[rootId]) return;

    var known = {};
    var rootFiles = galleryRootFiles(rootId);
    for (var i = 0; i < rootFiles.length; i++) {
        known[gallerySectionId(rootId, '') + '::' + rootFiles[i].name] = true;
    }

    var newFiles = [];
    handle.values().then(function (iterator) {
        function readNext() {
            iterator.next().then(function (result) {
                if (result.done) {
                    if (newFiles.length > 0) {
                        galleryLogger.info('Watch: ' + newFiles.length + ' new file(s) in ' + rootId);
                        gallerySyncRoot(rootId, rootFiles.concat(newFiles), document.getElementById('gallery-info'));
                    }
                    return;
                }
                var entry = result.value;
                if (entry.kind !== 'file' || !/\.(jpg|jpeg|png|gif|bmp|webp|avif|tiff?)$/i.test(entry.name)) {
                    readNext();
                    return;
                }
                if (known[gallerySectionId(rootId, '') + '::' + entry.name]) {
                    readNext();
                    return;
                }
                entry.getFile().then(function (file) {
                    try {
                        Object.defineProperty(file, 'webkitRelativePath', {
                            value: rootId + '/' + entry.name,
                            writable: true,
                            configurable: true
                        });
                    } catch (err) {
                        galleryLogger.warn('Failed to set relative path for ' + entry.name + ': ' + err);
                    }
                    newFiles.push(file);
                    readNext();
                }).catch(function (err) {
                    galleryLogger.warn('Failed to read file "' + entry.name + '": ' + err);
                    readNext();
                });
            }).catch(function (err) {
                galleryLogger.warn('Watch iteration failed for ' + rootId + ': ' + err);
            });
        }
        readNext();
    }).catch(function (err) {
        galleryLogger.warn('Watch poll failed for ' + rootId + ': ' + err);
    });
}

// ── refresh from remembered path ────────────────────────────

function galleryRefreshFromPath(targetPath, e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    var path = (typeof targetPath === 'string' && targetPath) ? targetPath : galleryState.activePath;
    if (!path) {
        openGalleryFolder();
        return;
    }
    galleryState.activePath = path;
    galleryClosePathMenu();
    galleryUpdatePathBar();
    galleryLogger.info('Gallery refresh requested for: ' + path);

    galleryFindUsableHandle(path).then(function (handle) {
        if (handle) {
            galleryReadFromHandle(handle, path);
        } else {
            openGalleryFolder();
        }
    }).catch(function (err) {
        galleryLogger.warn('Handle refresh failed, opening folder picker: ' + err);
        openGalleryFolder();
    });
}

function galleryFindUsableHandle(lastPath) {
    if (galleryState.dirHandle && galleryState.dirHandle.name === lastPath) {
        return Promise.resolve(galleryState.dirHandle);
    }

    return galleryHandleStoreGet(galleryDirHandleKey(lastPath)).then(function (handle) {
        if (!handle || handle.name !== lastPath) return null;
        if (!handle.queryPermission || !handle.requestPermission) return null;
        return handle.queryPermission({ mode: 'read' }).then(function (perm) {
            if (perm === 'granted') return handle;
            if (perm === 'prompt') {
                return handle.requestPermission({ mode: 'read' }).then(function (result) {
                    return result === 'granted' ? handle : null;
                });
            }
            return null;
        });
    }).catch(function (err) {
        galleryLogger.warn('Stored directory handle unavailable: ' + err);
        return null;
    });
}

function galleryWalkHandle(dirHandle, prefix, out) {
    return new Promise(function (resolve, reject) {
        var iterator;
        try {
            iterator = dirHandle.values();
        } catch (err) {
            reject(err);
            return;
        }
        function step() {
            iterator.next().then(function (result) {
                if (result.done) {
                    resolve(out);
                    return;
                }
                var entry = result.value;
                if (entry.kind === 'file') {
                    entry.getFile().then(function (file) {
                        if (file.type && file.type.indexOf('image/') === 0) {
                            try {
                                Object.defineProperty(file, 'webkitRelativePath', {
                                    value: prefix + file.name,
                                    writable: true,
                                    configurable: true
                                });
                            } catch (err) {
                                galleryLogger.warn('Failed to set relative path for ' + file.name + ': ' + err);
                            }
                            out.push(file);
                        }
                        step();
                    }).catch(function (err) {
                        galleryLogger.warn('Failed to read file "' + entry.name + '": ' + err);
                        step();
                    });
                    return;
                }
                if (entry.kind === 'directory') {
                    galleryWalkHandle(entry, prefix + entry.name + '/', out).then(step).catch(function (err) {
                        galleryLogger.warn('Failed to read subdirectory "' + entry.name + '": ' + err);
                        step();
                    });
                    return;
                }
                step();
            }).catch(reject);
        }
        step();
    });
}

// Refreshes one folder in place — never duplicates it, never touches other folders.
function galleryReadFromHandle(handle, rootName) {
    galleryLogger.info('Refreshing gallery from directory handle: ' + rootName);
    var infoEl = document.getElementById('gallery-info');
    galleryWalkHandle(handle, rootName + '/', []).then(function (imageFiles) {
        if (imageFiles.length === 0) {
            galleryUpdateInfo();
            galleryLogger.warn('No image files found in ' + rootName);
            return;
        }
        galleryLoadFolder(rootName, imageFiles, infoEl);
        galleryAddSavedPath(rootName);
    }).catch(function (err) {
        galleryLogger.warn('Directory read failed, opening folder picker: ' + err);
        openGalleryFolder();
    });
}

// ── main entry ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    var folderInput = document.getElementById('folderInput');
    if (!folderInput) return;

    galleryState.entryMap = galleryNewEntryMap();

    // Restore remembered folder list from previous session
    gallerySetSavedPaths(galleryGetSavedPaths());
    if (galleryState.savedPaths.length) galleryState.activePath = galleryState.savedPaths[0];
    galleryUpdatePathBar();

    // Pick the source before anything reads a folder: handle mode in
    // Chrome/Edge, server mode in Brave, input mode on file://.
    gallerySelectSourceMode().then(function () {
        galleryUpdateWatchButton();
    });

    var pathToggle = document.getElementById('gallery-path-toggle');
    if (pathToggle) {
        pathToggle.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                galleryTogglePathMenu(e);
            }
        });
    }
    document.addEventListener('click', galleryOnDocumentClick);

    // Every selection is added as its own folder section. Selecting a folder that is
    // already loaded refreshes it in place instead of duplicating it.
    folderInput.addEventListener('change', function (e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;

        var infoEl = document.getElementById('gallery-info');
        var imageFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.type && f.type.indexOf('image/') === 0) imageFiles.push(f);
        }
        if (imageFiles.length === 0) {
            if (infoEl) infoEl.textContent = 'No image files found';
            galleryLogger.warn('Gallery: selection contained no image files');
            return;
        }

        var rootId = galleryRootIdFromFiles(imageFiles);
        galleryLogger.info('Gallery folder selected: ' + rootId + ' (' + imageFiles.length + ' images)');
        galleryLoadFolder(rootId, imageFiles, infoEl);
        galleryAddSavedPath(rootId);
    });
});

// Prefer the File System Access API: it hands back a persistable directory
// handle, which is what lets a saved path reopen its own folder later without
// the OS dialog falling back to the last-used location. Brave has no such API,
// so server mode uses the loopback bridge instead.
function openGalleryFolder() {
    if (galleryState.sourceMode === 'server') {
        galleryOpenFolderPicker();
        return;
    }
    if (typeof showDirectoryPicker === 'function') {
        showDirectoryPicker({ mode: 'read' }).then(function (handle) {
            var rootId = handle.name || 'folder';
            // Keep watch mode's handle intact; the fast-path cache only applies otherwise
            if (!galleryState.watchActive) galleryState.dirHandle = handle;
            galleryPersistDirHandle(handle);
            galleryLogger.info('Folder picked via File System Access: ' + rootId);
            galleryReadFromHandle(handle, rootId);
        }).catch(function (err) {
            // User cancelled, or the API was blocked — never chain a second dialog
            galleryLogger.warn('Folder picker cancelled or failed: ' + err);
        });
        return;
    }

    // Fallback: browsers without showDirectoryPicker cannot produce a reopenable
    // handle, so this path is remembered by name only.
    var input = document.getElementById('folderInput');
    if (input) {
        galleryLogger.info('Opening folder picker (input fallback)');
        input.value = '';
        input.click();
    }
}

// ── canvas import ──────────────────────────────────────────

function loadGalleryImageToCanvas(imgUrl, fileName) {
    galleryLogger.info('Loading gallery image to canvas: ' + fileName);
    fabric.Image.fromURL(imgUrl, function (img) {
        if (!img) {
            galleryLogger.error('Failed to load image: ' + fileName);
            return;
        }
        try {
            var thumbSize = 150;
            var scaleFactor = Math.min(thumbSize / img.width, thumbSize / img.height);
            img.scale(scaleFactor);
            img.set({
                left: img.left + 10 + Math.random() * 30,
                top: img.top + 10 + Math.random() * 30
            });
            canvas.add(img);
            canvas.renderAll();
            canvas.setActiveObject(img);
            galleryLogger.info('Gallery image loaded as thumbnail: ' + fileName + ' (scale: ' + scaleFactor.toFixed(3) + ')');
        } catch (err) {
            galleryLogger.error('Error adding gallery image to canvas: ' + err);
        }
    });
}
