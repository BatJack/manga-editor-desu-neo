// Gallery — folder image browser with subfolder grouping + auto-watch
// Opens a folder via webkitdirectory input, groups images by subfolder.
// Click a thumbnail → load onto canvas as a small reference.
// Watch mode (showDirectoryPicker) detects new files in real time.

var galleryState = {
    groups: null,         // { groupKey: { name, files: [], gridEl } } | null
    entryMap: null,       // { pathKey: { name, pathKey, file, objectUrl, groupKey } } | null
    rootName: '',
    dirHandle: null,      // FileSystemDirectoryHandle (watch mode)
    watchTimer: null,
    watchActive: false
};

// ── helpers ────────────────────────────────────────────────

function galleryPathKey(file) {
    return file.webkitRelativePath || file.name;
}

function galleryGroupKey(file) {
    var rel = file.webkitRelativePath || '';
    var idx = rel.lastIndexOf('/');
    return idx > 0 ? rel.substring(0, idx) : '';
}

function galleryGroupName(key) {
    if (!key) return '(root)';
    var parts = key.split('/');
    return parts[parts.length - 1];
}

function galleryToggleSection(header) {
    var section = header.parentElement;
    var isCollapsed = section.classList.toggle('collapsed');
    section.classList.toggle('expanded');
    var chevron = header.querySelector('.gallery-chevron');
    if (chevron) chevron.textContent = isCollapsed ? '▶' : '▼';
}

function galleryRevokeAll() {
    if (!galleryState.entryMap) return;
    for (var k in galleryState.entryMap) {
        var e = galleryState.entryMap[k];
        if (e.objectUrl) URL.revokeObjectURL(e.objectUrl);
    }
}

function galleryClear() {
    if (galleryState.watchTimer) {
        clearInterval(galleryState.watchTimer);
        galleryState.watchTimer = null;
    }
    galleryState.watchActive = false;
    galleryRevokeAll();
    galleryState.groups = null;
    galleryState.entryMap = null;
    galleryState.rootName = '';
    galleryState.dirHandle = null;
    var container = document.getElementById('gallery-sections');
    if (container) container.innerHTML = '';
    var info = document.getElementById('gallery-info');
    if (info) info.textContent = '';
    var watchBtn = document.getElementById('gallery-watch-btn');
    if (watchBtn) { watchBtn.style.display = 'none'; watchBtn.textContent = 'Watch'; watchBtn.classList.remove('active'); }
}

// ── chunked render ─────────────────────────────────────────

function galleryRenderGroups(imageFiles, infoEl) {
    var container = document.getElementById('gallery-sections');
    if (!container) return;
    container.innerHTML = '';

    // Group files by subfolder
    var groups = {};
    var entryMap = {};
    for (var i = 0; i < imageFiles.length; i++) {
        var f = imageFiles[i];
        var gk = galleryGroupKey(f);
        if (!groups[gk]) groups[gk] = { name: galleryGroupName(gk), files: [], gridEl: null };
        groups[gk].files.push(f);
        entryMap[galleryPathKey(f)] = { name: f.name, pathKey: galleryPathKey(f), file: f, objectUrl: null, groupKey: gk };
    }

    galleryState.groups = groups;
    galleryState.entryMap = entryMap;

    // Sort groups: root first, then alphabetical
    var groupKeys = Object.keys(groups).sort(function (a, b) {
        if (!a) return -1; if (!b) return 1;
        return a.localeCompare(b);
    });

    // Create section DOM for each group
    var totalCount = imageFiles.length;
    var loadedCount = 0;

    groupKeys.forEach(function (gk) {
        var section = document.createElement('div');
        var isRoot = !gk;
        section.className = 'gallery-section' + (isRoot ? ' expanded' : ' collapsed');
        section.dataset.group = gk;

        var header = document.createElement('div');
        header.className = 'gallery-section-header';
        header.onclick = function () { galleryToggleSection(this); };
        header.innerHTML = '<span class="gallery-chevron">' + (isRoot ? '▼' : '▶') + '</span><i class="material-icons">folder</i><span>' + galleryState.groups[gk].name + '</span><span class="gallery-section-count">' + groups[gk].files.length + '</span>';
        section.appendChild(header);

        var grid = document.createElement('div');
        grid.className = 'gallery-grid';
        grid.dataset.group = gk;
        groups[gk].gridEl = grid;
        section.appendChild(grid);
        container.appendChild(section);
    });

    // Populate grids in chunks
    var allEntries = [];
    for (var pk in entryMap) allEntries.push({ pathKey: pk, entry: entryMap[pk] });
    var chunkSize = 60;
    var idx = 0;

    function processChunk() {
        var end = Math.min(idx + chunkSize, allEntries.length);
        for (var ci = idx; ci < end; ci++) {
            var entry = allEntries[ci].entry;
            var objectUrl = URL.createObjectURL(entry.file);
            entry.objectUrl = objectUrl;
            var gk = entry.groupKey;
            var grid = groups[gk] ? groups[gk].gridEl : null;
            if (!grid) continue;

            var item = document.createElement('div');
            item.className = 'gallery-item';
            item.dataset.pathKey = entry.pathKey;

            var img = document.createElement('img');
            img.className = 'gallery-thumb';
            img.loading = 'lazy';
            img.alt = entry.name;
            img.onload = (function (im) { return function () { im.style.aspectRatio = im.naturalWidth / im.naturalHeight; }; })(img);
            img.src = objectUrl;

            var nameSpan = document.createElement('span');
            nameSpan.className = 'gallery-item-name';
            nameSpan.textContent = entry.name;

            item.appendChild(img);
            item.appendChild(nameSpan);
            (function (url, nm) {
                item.addEventListener('click', function () { loadGalleryImageToCanvas(url, nm); });
            })(objectUrl, entry.name);
            grid.appendChild(item);
            loadedCount++;
        }

        idx = end;
        if (infoEl) infoEl.textContent = loadedCount + ' / ' + totalCount + ' images';

        if (idx < allEntries.length) {
            setTimeout(processChunk, 0);
        } else {
            galleryLogger.info('Gallery render complete: ' + totalCount + ' images in ' + groupKeys.length + ' group(s)');
            // Show watch button if showDirectoryPicker available
            var watchBtn = document.getElementById('gallery-watch-btn');
            if (watchBtn && typeof showDirectoryPicker !== 'undefined') watchBtn.style.display = 'inline-flex';
        }
    }

    if (infoEl) infoEl.textContent = '0 / ' + totalCount + ' images';
    setTimeout(processChunk, 50);
}

// ── diff-based update (re-select same folder) ──────────────

function galleryDiffUpdate(newFiles) {
    var oldEntryMap = galleryState.entryMap || {};
    var oldGroups = galleryState.groups || {};
    var newEntryMap = {};
    var changed = false;
    var addedEntries = [];

    // Build new entry map
    for (var i = 0; i < newFiles.length; i++) {
        var f = newFiles[i];
        var pk = galleryPathKey(f);
        newEntryMap[pk] = { name: f.name, pathKey: pk, file: f, objectUrl: null, groupKey: galleryGroupKey(f) };
    }

    // Find removed entries
    for (var oldPk in oldEntryMap) {
        if (!newEntryMap[oldPk]) {
            var oldEntry = oldEntryMap[oldPk];
            if (oldEntry.objectUrl) URL.revokeObjectURL(oldEntry.objectUrl);
            // Remove DOM item — iterate to avoid CSS.escape compat issues
            var allItems = document.querySelectorAll('.gallery-item[data-path-key]');
            for (var ii = 0; ii < allItems.length; ii++) {
                if (allItems[ii].dataset.pathKey === oldPk) {
                    allItems[ii].remove();
                    break;
                }
            }
            changed = true;
            galleryLogger.info('Gallery: removed ' + oldPk);
        }
    }

    // Find added entries
    for (var newPk in newEntryMap) {
        if (!oldEntryMap[newPk]) {
            addedEntries.push(newEntryMap[newPk]);
            changed = true;
            galleryLogger.info('Gallery: new file ' + newPk);
        }
    }

    if (!changed) {
        galleryLogger.info('Gallery: no changes detected');
        return false;
    }

    // Merge new entries
    for (var pk in oldEntryMap) {
        if (newEntryMap[pk]) {
            newEntryMap[pk].objectUrl = oldEntryMap[pk].objectUrl;
        }
    }

    // Rebuild groups with new files
    var newGroups = {};
    for (var npk in newEntryMap) {
        var ne = newEntryMap[npk];
        var gk = ne.groupKey;
        if (!newGroups[gk]) newGroups[gk] = { name: galleryGroupName(gk), files: [], gridEl: null };
        newGroups[gk].files.push(ne.file);
    }

    galleryState.entryMap = newEntryMap;
    galleryState.groups = newGroups;

    // Render only the newly added entries
    if (addedEntries.length > 0) {
        var chunkSize = 60;
        var idx = 0;
        function processAdditions() {
            var end = Math.min(idx + chunkSize, addedEntries.length);
            for (var ci = idx; ci < end; ci++) {
                var entry = addedEntries[ci];
                var objectUrl = URL.createObjectURL(entry.file);
                entry.objectUrl = objectUrl;
                var gk = entry.groupKey;
                // Ensure grid element exists for this group
                var grid = galleryState.groups[gk] && galleryState.groups[gk].gridEl;
                if (!grid) {
                    // Group section might not exist yet — create it
                    var container = document.getElementById('gallery-sections');
                    if (!container) continue;
                    var section = document.createElement('div');
                    var isRoot = !gk;
                    section.className = 'gallery-section' + (isRoot ? ' expanded' : ' collapsed');
                    section.dataset.group = gk;
                    var header = document.createElement('div');
                    header.className = 'gallery-section-header';
                    header.onclick = function () { galleryToggleSection(this); };
                    header.innerHTML = '<span class="gallery-chevron">' + (isRoot ? '▼' : '▶') + '</span><i class="material-icons">folder</i><span>' + galleryGroupName(gk) + '</span><span class="gallery-section-count">1</span>';
                    section.appendChild(header);
                    grid = document.createElement('div');
                    grid.className = 'gallery-grid';
                    grid.dataset.group = gk;
                    section.appendChild(grid);
                    container.appendChild(section);
                    if (!galleryState.groups[gk]) galleryState.groups[gk] = { name: galleryGroupName(gk), files: [], gridEl: grid };
                    galleryState.groups[gk].gridEl = grid;
                }
                var item = document.createElement('div');
                item.className = 'gallery-item';
                item.dataset.pathKey = entry.pathKey;
                var img = document.createElement('img');
                img.className = 'gallery-thumb';
                img.loading = 'lazy';
                img.alt = entry.name;
                img.onload = (function (im) { return function () { im.style.aspectRatio = im.naturalWidth / im.naturalHeight; }; })(img);
                img.src = objectUrl;
                var nameSpan = document.createElement('span');
                nameSpan.className = 'gallery-item-name';
                nameSpan.textContent = entry.name;
                item.appendChild(img);
                item.appendChild(nameSpan);
                (function (url, nm) {
                    item.addEventListener('click', function () { loadGalleryImageToCanvas(url, nm); });
                })(objectUrl, entry.name);
                grid.appendChild(item);
                // Update group count
                var sec = grid.closest('.gallery-section');
                if (sec) {
                    var cnt = sec.querySelector('.gallery-section-count');
                    if (cnt) cnt.textContent = galleryState.groups[gk].files.length;
                }
            }
            idx = end;
            var totalEl = document.getElementById('gallery-info');
            var total = Object.keys(galleryState.entryMap).length;
            if (totalEl) totalEl.textContent = total + ' images';
            if (idx < addedEntries.length) setTimeout(processAdditions, 0);
        }
        setTimeout(processAdditions, 0);
    }

    return true;
}

// ── watch mode (showDirectoryPicker) ──────────────────────

function galleryToggleWatch() {
    var btn = document.getElementById('gallery-watch-btn');
    if (!btn) return;

    if (galleryState.watchActive) {
        // Stop watching
        if (galleryState.watchTimer) {
            clearInterval(galleryState.watchTimer);
            galleryState.watchTimer = null;
        }
        galleryState.watchActive = false;
        galleryState.dirHandle = null;
        btn.textContent = 'Watch';
        btn.classList.remove('active');
        galleryLogger.info('Gallery watch stopped');
        return;
    }

    // Start watching — request directory handle
    if (typeof showDirectoryPicker === 'undefined') {
        galleryLogger.warn('showDirectoryPicker not available');
        return;
    }

    showDirectoryPicker({ mode: 'read' }).then(function (handle) {
        galleryState.dirHandle = handle;
        galleryState.watchActive = true;
        btn.textContent = 'Watching';
        btn.classList.add('active');
        galleryLogger.info('Gallery watch started for: ' + handle.name);

        // Poll every 4 seconds
        if (galleryState.watchTimer) clearInterval(galleryState.watchTimer);
        galleryState.watchTimer = setInterval(function () {
            galleryWatchPoll();
        }, 4000);
    }).catch(function (err) {
        galleryLogger.warn('Gallery watch setup cancelled or failed: ' + err);
    });
}

function galleryWatchPoll() {
    if (!galleryState.dirHandle || !galleryState.watchActive) return;
    var currentMap = galleryState.entryMap || {};
    var newFiles = [];

    galleryState.dirHandle.values().then(function (iterator) {
        function readNext() {
            iterator.next().then(function (result) {
                if (result.done) {
                    // Check for new files
                    if (newFiles.length > 0) {
                        galleryLogger.info('Watch: ' + newFiles.length + ' new file(s) detected');
                        galleryDiffUpdate(mergeFileLists(currentMap, newFiles));
                    }
                    return;
                }
                var entry = result.value;
                if (entry.kind === 'file') {
                    var pathKey = entry.name;
                    // Check if already in map or if it's an image
                    if (!currentMap[pathKey] && /\.(jpg|jpeg|png|gif|bmp|webp|avif|tiff?)$/i.test(entry.name)) {
                        entry.getFile().then(function (file) {
                            Object.defineProperty(file, 'webkitRelativePath', { value: entry.name, writable: true });
                            newFiles.push(file);
                        });
                    }
                }
                readNext();
            });
        }
        readNext();
    });
}

function mergeFileLists(oldMap, newFiles) {
    var result = [];
    for (var pk in oldMap) {
        result.push(oldMap[pk].file);
    }
    for (var i = 0; i < newFiles.length; i++) {
        result.push(newFiles[i]);
    }
    return result;
}

// ── main entry ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    var folderInput = document.getElementById('folderInput');
    if (!folderInput) return;

    folderInput.addEventListener('change', function (e) {
        var files = e.target.files;
        if (!files || files.length === 0) return;

        galleryLogger.info('Gallery folder selected: ' + files.length + ' files');

        var infoEl = document.getElementById('gallery-info');

        // If we already have content, do a diff update
        if (galleryState.entryMap) {
            var imageFiles = [];
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                if (f.type && f.type.startsWith('image/')) imageFiles.push(f);
            }
            if (imageFiles.length === 0) {
                if (infoEl) infoEl.textContent = 'No image files';
                return;
            }
            galleryDiffUpdate(imageFiles);
            // Update root name
            if (files.length > 0) {
                var firstRel = files[0].webkitRelativePath || '';
                var slashIdx = firstRel.indexOf('/');
                galleryState.rootName = slashIdx > 0 ? firstRel.substring(0, slashIdx) : '';
            }
            return;
        }

        // First-time load
        galleryClear();

        var imageFiles = [];
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            if (f.type && f.type.startsWith('image/')) imageFiles.push(f);
        }

        if (imageFiles.length === 0) {
            if (infoEl) infoEl.textContent = 'No image files found';
            galleryLogger.warn('No image files found');
            return;
        }

        // Store root name from first file's webkitRelativePath
        if (files.length > 0) {
            var firstRel = files[0].webkitRelativePath || '';
            var slashIdx = firstRel.indexOf('/');
            galleryState.rootName = slashIdx > 0 ? firstRel.substring(0, slashIdx) : 'folder';
        }

        galleryLogger.info('Loading ' + imageFiles.length + ' images via ObjectURL');
        galleryRenderGroups(imageFiles, infoEl);
    });
});

function openGalleryFolder() {
    var input = document.getElementById('folderInput');
    if (input) {
        galleryLogger.info('Opening folder picker');
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
