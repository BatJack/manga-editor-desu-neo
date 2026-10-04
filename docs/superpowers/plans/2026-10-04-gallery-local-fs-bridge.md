# Gallery Local Filesystem Bridge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the gallery working folder browsing, path memory, and watch mode in Brave — which disables the File System Access API entirely — by bridging to the existing local Python server, without regressing Chrome/Edge or breaking `file://`.

**Architecture:** `99_server.py` gains two read-only loopback endpoints that list a directory and stream a single image, hardened from its current `0.0.0.0` + `Access-Control-Allow-Origin: *` posture. The frontend probes for that bridge and, when reachable, uses a `server` source mode that stores absolute paths as plain strings and polls for changes. Chrome/Edge keep the existing `handle` mode; `file://` degrades to the existing `input` mode with a visible notice.

**Tech Stack:** Python 3.13 stdlib (`http.server`, `secrets`, `unittest`), vanilla JS with globals (no modules), CSS custom properties, existing in-browser `TestRunner`.

**Spec:** `docs/superpowers/specs/2026-10-04-gallery-local-fs-bridge-design.md`

## Global Constraints

- Loopback only: bind `127.0.0.1`. Never `0.0.0.0`.
- No `Access-Control-Allow-Origin` header on any response, static or API.
- Read-only. No write, delete, move, or rename endpoint.
- Python: stdlib only. Do not add `pytest` or any dependency.
- Python files live at repo root or in `99_tests/`. Do **not** create `test/` — `CLAUDE.md` excludes it from search and edit, and `test/` is a feature sandbox.
- JS: no ES modules, no bundler. Globals only, dependency order set by `<script>` order in `index.html`.
- JS: no `console.log`. Use `galleryLogger` / `uiLogger`.
- JS: never assign `innerHTML` to an element built from filesystem names — use `createElement` + `textContent`.
- JS: new UI strings need both `en` and `zh` in `js/ui/third/base-translation/base-en.js` and `base-zh.js`. Keys are flat and descriptive (e.g. `gallery-watch`), **not** timestamped — timestamped keys go in `js/ui/third/i18next.js` only.
- JS: new code must be written **unindented** (project formatter strips all leading whitespace).
- `file://` must keep working for basic folder browsing. Never remove the `webkitdirectory` fallback.
- `npm run lint` must stay at 0 errors.

## Verification Commands

```bash
# Python (automated, real TDD loop)
python -m unittest discover -s 99_tests -v

# JS (no headless browser in this repo — TestRunner is manual)
cmd /c "npm run lint"
cmd /c "npm run check-translations"
```

To run the JS suite: serve the app (`python 99_server.py`), open `http://localhost:8000`, run `await window.runAllTests()` in the console.

## Review Focus

Five failure modes a reasonable person would expect to be handled, which the spec implies but no task's happy-path test covers:

1. **Windows paths with spaces / non-ASCII / `#` and `?`** — a folder named `漫画 #1` must list and stream correctly. Percent-encoding is the likely breakage point.
2. **Two different folders sharing a leaf name** (`D:\a\shots` and `D:\b\shots`) — `file://` already cannot distinguish these; `server` mode can and must, since it stores real paths. The picker keys saved paths by full path, not leaf name.
3. **Token absent, stale (after server restart), or wrong** — must fail closed with a clear message, never fall back to an unauthenticated read.
4. **Folder deleted or renamed on disk between listing and image fetch** — must surface an error, not hang or show a broken thumbnail forever.
5. **A saved path pointing at a directory the user no longer has access to** — must be removable from the path bar rather than trapping the user in a retry loop.

Each is pinned to a task below.

---

### Task 1: Harden the server and add token auth

Removes the two latent vulnerabilities that would otherwise become a file-exfiltration hole the moment Task 2 lands.

**Files:**
- Create: `gallery_fs_api.py`
- Modify: `99_server.py:1-48`
- Test: `99_tests/test_gallery_fs_api.py`

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `gallery_fs_api.new_token() -> str`
  - `gallery_fs_api.check_host(headers: email.message.Message) -> bool` — true only for `localhost` / `127.0.0.1` (with optional port)
  - `gallery_fs_api.is_api_request(headers) -> bool` — true when `Sec-Fetch-Site` is `same-origin` or `none`

- [ ] **Step 1: Write the failing test**

Create `99_tests/test_gallery_fs_api.py`:

```python
import unittest
from email.message import Message
import gallery_fs_api


def headers(host=None, fetch_site=None):
    m = Message()
    if host is not None:
        m['Host'] = host
    if fetch_site is not None:
        m['Sec-Fetch-Site'] = fetch_site
    return m


class TestHostCheck(unittest.TestCase):
    def test_allows_localhost_and_loopback(self):
        for host in ('localhost', 'localhost:8000', '127.0.0.1', '127.0.0.1:8000'):
            self.assertTrue(gallery_fs_api.check_host(headers(host)), host)

    def test_rejects_foreign_host(self):
        for host in ('evil.com', 'attacker.com:8000', '192.168.0.5:8000'):
            self.assertFalse(gallery_fs_api.check_host(headers(host)), host)

    def test_rejects_missing_host(self):
        self.assertFalse(gallery_fs_api.check_host(headers()))


class TestFetchSite(unittest.TestCase):
    def test_same_origin_and_none_allowed(self):
        self.assertTrue(gallery_fs_api.is_api_request(headers(fetch_site='same-origin')))
        self.assertTrue(gallery_fs_api.is_api_request(headers(fetch_site='none')))

    def test_cross_site_and_same_site_rejected(self):
        self.assertFalse(gallery_fs_api.is_api_request(headers(fetch_site='cross-site')))
        self.assertFalse(gallery_fs_api.is_api_request(headers(fetch_site='same-site')))


class TestToken(unittest.TestCase):
    def test_token_is_urlsafe_and_long(self):
        t = gallery_fs_api.new_token()
        self.assertGreaterEqual(len(t), 32)
        self.assertTrue(all(c.isalnum() or c in '-_' for c in t), t)


if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest discover -s 99_tests -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'gallery_fs_api'`

- [ ] **Step 3: Create `gallery_fs_api.py`**

```python
"""Read-only local filesystem bridge for the gallery.

Isolated from 99_server.py so the path and request logic is unit-testable
without opening a socket.
"""
import secrets

LOCAL_HOSTS = ('localhost', '127.0.0.1')
ALLOWED_FETCH_SITES = ('same-origin', 'none')


def new_token():
    return secrets.token_urlsafe(32)


def check_host(headers):
    host = (headers.get('Host') or '').strip().lower()
    if not host:
        return False
    if ':' in host:
        host = host.rsplit(':', 1)[0]
    return host in LOCAL_HOSTS


def is_api_request(headers):
    return (headers.get('Sec-Fetch-Site') or '').strip().lower() in ALLOWED_FETCH_SITES
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest discover -s 99_tests -v`
Expected: PASS, 9 tests

- [ ] **Step 5: Rewire `99_server.py`**

Replace `ADDRESS = ""` with `ADDRESS = "127.0.0.1"`.
Delete the `Access-Control-Allow-Origin` line from `end_headers`; keep the no-cache, keep-alive, and `Service-Worker-Allowed` headers.
Add to `__main__`: `token = gallery_fs_api.new_token()` and print it together with the URL, on its own clearly-labelled line.
Add `import gallery_fs_api` at the top.

- [ ] **Step 6: Verify manually**

Run: `python 99_server.py`
Expected: prints the URL and a token line. From another machine on the LAN, `http://<your-ip>:8000/` must **fail to connect**.

- [ ] **Step 7: Commit**

```bash
git add gallery_fs_api.py 99_server.py 99_tests/
git commit -m "feat(server): bind loopback only, drop CORS, add host check and token"
```

---

### Task 2: Read-only filesystem endpoints with path hardening

**Files:**
- Modify: `gallery_fs_api.py`
- Modify: `99_server.py`
- Test: `99_tests/test_gallery_fs_api.py`

**Interfaces:**
- Consumes: `gallery_fs_api.new_token()`, `check_host()`, `is_api_request()` from Task 1
- Produces:
  - `gallery_fs_api.normalize_path(raw: str) -> str` — raises `ValueError` on non-absolute, empty, or traversing paths
  - `gallery_fs_api.validate_name(name: str) -> str` — raises `ValueError` if `name` contains a separator or is `.`/`..`
  - `gallery_fs_api.scan_dir(path: str) -> dict` — returns `{'path', 'parent', 'folders', 'images'}`; `images` entries are `{'name','path','mtime','size'}`
  - `gallery_fs_api.find_image(scanned: dict, name: str) -> dict` — returns the image entry or raises `KeyError`
  - `99_server.py` routes `GET /api/fs/session`, `GET /api/fs/list`, `GET /api/fs/image`

- [ ] **Step 1: Write the failing test**

Append to `99_tests/test_gallery_fs_api.py`, adding `import os` and `import tempfile` to the imports:

```python
class TestNormalizePath(unittest.TestCase):
    def test_accepts_absolute(self):
        d = tempfile.mkdtemp()
        self.assertEqual(gallery_fs_api.normalize_path(d), os.path.realpath(d))

    def test_rejects_empty_and_relative(self):
        for bad in ('', '   ', 'relative/path', 'C:relative'):
            with self.assertRaises(ValueError):
                gallery_fs_api.normalize_path(bad)

    def test_rejects_traversal(self):
        with self.assertRaises(ValueError):
            gallery_fs_api.normalize_path(os.path.join(tempfile.gettempdir(), '..', 'etc'))


class TestValidateName(unittest.TestCase):
    def test_accepts_plain_name(self):
        self.assertEqual(gallery_fs_api.validate_name('a.png'), 'a.png')

    def test_rejects_separators_and_dotnames(self):
        for bad in ('../x', 'a/b', 'a\\b', '.', '..', ''):
            with self.assertRaises(ValueError):
                gallery_fs_api.validate_name(bad)


class TestScanDir(unittest.TestCase):
    def setUp(self):
        self.root = tempfile.mkdtemp()
        os.makedirs(os.path.join(self.root, 'sub'))
        for n in ('b.png', 'a.jpg', 'notes.txt'):
            open(os.path.join(self.root, n), 'w').close()

    def test_folders_and_images_sorted(self):
        out = gallery_fs_api.scan_dir(self.root)
        self.assertEqual([f['name'] for f in out['folders']], ['sub'])
        self.assertEqual([i['name'] for i in out['images']], ['a.jpg', 'b.png'])

    def test_parent_present_for_nested_dir(self):
        out = gallery_fs_api.scan_dir(os.path.join(self.root, 'sub'))
        self.assertIsNotNone(out['parent'])

    def test_non_ascii_and_space_names(self):
        d = os.path.join(self.root, '漫画 #1')
        os.makedirs(d)
        open(os.path.join(d, '画像 01.png'), 'w').close()
        out = gallery_fs_api.scan_dir(d)
        self.assertEqual([i['name'] for i in out['images']], ['画像 01.png'])

    def test_rejects_file_and_missing(self):
        f = os.path.join(self.root, 'a.png')
        with self.assertRaises(ValueError):
            gallery_fs_api.scan_dir(f)
        with self.assertRaises(ValueError):
            gallery_fs_api.scan_dir(os.path.join(self.root, 'nope'))

    def test_find_image(self):
        out = gallery_fs_api.scan_dir(self.root)
        self.assertEqual(gallery_fs_api.find_image(out, 'b.png')['name'], 'b.png')
        with self.assertRaises(KeyError):
            gallery_fs_api.find_image(out, 'missing.png')
```

This covers Review Focus #1 (non-ASCII, spaces, `#`).

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest discover -s 99_tests -v`
Expected: FAIL with `AttributeError: module 'gallery_fs_api' has no attribute 'normalize_path'`

- [ ] **Step 3: Implement path hardening and scanning in `gallery_fs_api.py`**

Add `import os`. Implement per the signatures above. Pin these decisions:

- `normalize_path`: reject empty/blank; reject unless `os.path.isabs`; build `realpath`; reject if the `realpath` result is not absolute; reject when the *original* string contains a `..` path segment (compare `os.path.normpath(raw)` against the raw before resolving, so a symlink cannot be used to smuggle traversal).
- `validate_name`: reject empty, `.`, `..`, and any name containing `/` or `os.sep` or `os.altsep`.
- `scan_dir`: raise `ValueError` if the path is not an existing directory. Use `os.scandir`. Folder entries: `{'name', 'path'}`. Image entries: `{'name', 'path', 'mtime' (int ms), 'size' (int)}`, filtered by extension in `{'.png','.jpg','.jpeg','.gif','.webp','.bmp','.avif'}`. Sort folders and images each by `name`. `parent` is the normalized parent, or `None` at a drive/root boundary.
- `find_image`: scan `scanned['images']` for an exact `name` match, else raise `KeyError`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest discover -s 99_tests -v`
Expected: PASS, all tests

- [ ] **Step 5: Write the failing handler test**

Append to `99_tests/test_gallery_fs_api.py`:

```python
class TestAuthGate(unittest.TestCase):
    def test_session_requires_same_origin(self):
        self.assertFalse(gallery_fs_api.may_serve_api(
            headers(host='localhost', fetch_site='cross-site'), 'right', 'right'))

    def test_api_requires_matching_token(self):
        same_origin = headers(host='localhost', fetch_site='same-origin')
        self.assertFalse(gallery_fs_api.may_serve_api(same_origin, 'wrong', 'right'))
        self.assertTrue(gallery_fs_api.may_serve_api(same_origin, 'right', 'right'))

    def test_missing_token_rejected(self):
        same_origin = headers(host='localhost', fetch_site='same-origin')
        self.assertFalse(gallery_fs_api.may_serve_api(same_origin, None, 'right'))

    def test_foreign_host_never_served(self):
        self.assertFalse(gallery_fs_api.may_serve_api(
            headers(host='evil.com', fetch_site='same-origin'), 'right', 'right'))
```

- [ ] **Step 6: Run test to verify it fails**

Run: `python -m unittest discover -s 99_tests -v`
Expected: FAIL with `AttributeError: ... has no attribute 'may_serve_api'`

- [ ] **Step 7: Implement the auth gate and routes**

Add to `gallery_fs_api.py`:

- `may_serve_api(headers, presented_token, expected_token) -> bool` — requires `check_host(headers)` to be true and, whenever `expected_token` is not `None`, a constant-time `secrets.compare_digest(presented_token, expected_token)` match. All three parameters are explicit so the function stays pure and testable; `99_server.py` reads `X-Gallery-Token` off the request and passes it in as `presented_token`.
- `parse_query(url) -> dict` — percent-decodes keys and values from a `urllib.parse.urlsplit` query string. This is what makes non-ASCII and `#` folder names survive Review Focus #1.

In `99_server.py`, inside `do_GET`, before delegating to `SimpleHTTPRequestHandler`:

- Path starts with `/api/fs/` → handle locally, never fall through to static file serving.
- `/api/fs/session` → `check_host` + `is_api_request`; on success return `{"token": token}`, else `403`.
- `/api/fs/list` → require `may_serve_api`; `normalize_path(query['path'])` then `scan_dir`; `ValueError` → `400`, missing `path` → `400`. Return JSON.
- `/api/fs/image` → require `may_serve_api`; `normalize_path(query['path'])`, `validate_name(query['name'])`, `scan_dir`, `find_image`; `KeyError` → `404` (this is Review Focus #4), `ValueError` → `400`. Stream bytes with the `Content-Type` from the extension.
- Any `ValueError`/`KeyError` body must be `{"error": "<reason>"}` so the frontend can distinguish 400 from 404.

All API responses send `Cache-Control: no-store` and no CORS header.

- [ ] **Step 8: Run test to verify it passes**

Run: `python -m unittest discover -s 99_tests -v`
Expected: PASS, all tests

- [ ] **Step 9: Verify the endpoints by hand**

Run `python 99_server.py`, note the printed token, then:

```bash
curl -H "Sec-Fetch-Site: same-origin" http://127.0.0.1:8000/api/fs/session
curl -H "Sec-Fetch-Site: same-origin" -H "X-Gallery-Token: <token>" "http://127.0.0.1:8000/api/fs/list?path=<abs>"
curl -H "Sec-Fetch-Site: cross-site" http://127.0.0.1:8000/api/fs/session
```

Expected: session returns the token; list returns JSON; the third returns `403`. This is Review Focus #3 — a wrong token must be refused, never silently downgraded.

- [ ] **Step 10: Commit**

```bash
git add gallery_fs_api.py 99_server.py 99_tests/
git commit -m "feat(server): add read-only /api/fs/list and /api/fs/image with path hardening"
```

---

### Task 3: Frontend source abstraction and mode detection

**Files:**
- Modify: `js/ui/gallery.js`
- Test: `js/core/debug.js`

**Interfaces:**
- Consumes: Task 2 endpoints and the token printed by `99_server.py`
- Produces:
  - `galleryState.sourceMode` — `'handle' | 'server' | 'input'`, default `'input'`
  - `galleryState.serverToken` — string or `null`
  - `galleryProbeServerBridge() -> Promise<boolean>` — resolves true only when `/api/fs/session` returns 200 **and** sets `galleryState.serverToken`
  - `galleryServerRequest(apiPath, params) -> Promise<object>` — sends `Sec-Fetch-Site`-equivalent same-origin request plus `X-Gallery-Token`
  - `galleryServerList(absPath) -> Promise<{folders: Array, images: Array}>`
  - `galleryServerReadImage(absPath, name) -> Promise<Blob>`
  - `gallerySelectSourceMode() -> Promise<'handle'|'server'|'input'>`

- [ ] **Step 1: Write the failing test**

Add to `js/core/debug.js` and register it in `runAllTests()` next to the other `await`ed suites:

```javascript
// Folder-name keys must stay distinct by FULL path, not leaf name:
// D:\a\shots and D:\b\shots are different folders with the same leaf.
function testGalleryServerPathKeys(){
if(typeof galleryServerPathKey!=='undefined'){
TestRunner.reset();
TestRunner.assertEquals('path::D:\\a\\shots',galleryServerPathKey('D:\\a\\shots'),'Key uses the full path');
TestRunner.assert(galleryServerPathKey('D:\\a\\shots')!==galleryServerPathKey('D:\\b\\shots'),'Same leaf name, different parents stay distinct');
TestRunner.assert(galleryServerPathKey('D:\\a\\shots')!==galleryServerPathKey('D:\\A\\SHOTS'),'Key comparison is case-sensitive');
return TestRunner.printResults('Gallery Server Path Keys');
}
console.warn('[Test Skip] gallery server source not loaded');
return false;
}
```

This pins Review Focus #2.

- [ ] **Step 2: Run the suite to verify it fails**

Serve the app, open `http://localhost:8000`, run `await window.runAllTests()`.
Expected: `Gallery Server Path Keys` reports FAIL / `[Test Skip]`

- [ ] **Step 3: Implement the server source in `gallery.js`**

Add `galleryServerPathKey(absPath) -> 'path::' + absPath` (string concatenation only — do **not** lowercase or normalize; the server owns normalization).

Add the request helper. Send the token as `X-Gallery-Token`. Treat any non-2xx as a rejection carrying the status so callers can distinguish 400 (bad path) from 404 (gone) from 403 (bad token). Use `galleryLogger.warn` on failure, never `console.log`.

`galleryProbeServerBridge()` fetches `/api/fs/session`, reads `token` from the JSON, stores it in `galleryState.serverToken`, and returns true. On any error it logs once and returns false.

`gallerySelectSourceMode()` returns, in order: `'handle'` when `typeof showDirectoryPicker === 'function'`, else `'server'` when the probe succeeds, else `'input'`. Store the result in `galleryState.sourceMode`.

Write all of it **unindented**.

- [ ] **Step 4: Run the suite to verify it passes**

Run `await window.runAllTests()`.
Expected: `Gallery Server Path Keys` PASS; all pre-existing suites still PASS.

- [ ] **Step 5: Verify mode detection by hand**

| Condition | Expected `galleryState.sourceMode` |
|---|---|
| Chrome/Edge on `http://localhost:8000` | `handle` |
| Brave on `http://localhost:8000` | `server` |
| Any browser on `file://` | `input` |

Check in the console: `await galleryProbeServerBridge()`.

- [ ] **Step 6: Commit**

```bash
git add js/ui/gallery.js js/core/debug.js
git commit -m "feat(gallery): add server source mode and bridge probing"
```

---

### Task 4: Server-mode folder picker

Brave has no native picker, so the user needs a web folder browser.

**Files:**
- Modify: `index.html` (add panel markup inside `#gallery-content`)
- Modify: `css/ui/gallery.css`
- Modify: `js/ui/gallery.js`
- Modify: `js/ui/third/base-translation/base-en.js`, `base-zh.js`
- Test: `js/core/debug.js`

**Interfaces:**
- Consumes: `galleryServerList(absPath)`, `galleryServerReadImage(absPath, name)`, `galleryState.serverToken` from Task 3
- Produces:
  - `galleryOpenFolderPicker() -> void` — opens the panel at the parent of the active path, or a root list
  - `galleryFolderPickerGoUp() -> void`
  - `galleryFolderPickerConfirm() -> void` — loads the currently listed directory as a gallery folder
  - `galleryState.pickerPath` — absolute path currently listed

- [ ] **Step 1: Write the failing test**

Add to `js/core/debug.js` and register it:

```javascript
function testGalleryPickerModel(){
if(typeof galleryPickerShouldShowUp!=='undefined'){
TestRunner.reset();
TestRunner.assert(galleryPickerShouldShowUp('D:\\a\\b','D:\\a'),'Up is offered below the start directory');
TestRunner.assert(!galleryPickerShouldShowUp('D:\\a','D:\\a'),'Up is hidden at the start directory');
TestRunner.assert(!galleryPickerShouldShowUp('D:\\a','C:\\other'),'Up is hidden when the parent is outside the start directory');
return TestRunner.printResults('Gallery Picker Model');
}
console.warn('[Test Skip] gallery folder picker not loaded');
return false;
}
```

- [ ] **Step 2: Run the suite to verify it fails**

Expected: FAIL / `[Test Skip]`

- [ ] **Step 3: Add the markup**

Inside `#gallery-content`, after the toolbar and before `#gallery-info`, add a hidden panel `#gallery-fs-picker` containing: a path display `#gallery-fs-picker-path`, a `#gallery-fs-picker-up` button, a `#gallery-fs-picker-list` container, a `#gallery-fs-picker-confirm` button, and a `#gallery-fs-picker-cancel` button. Follow the existing button conventions in that file (material icon + `data-i18n` span).

- [ ] **Step 4: Add the styles**

Append to `css/ui/gallery.css`. Reuse the existing custom properties (`--bg-2`, `--border-default`, `--text-1`, `--text-2`, `--radius-lg`, `--color-accent`, `--hover-strong`, `--dur-2`, `--ease`). **No fixed pixel widths** — use `flex: 1` / `min-width: 0` so the panel works in the 170px sidebar.

- [ ] **Step 5: Implement the picker logic**

Build the folder list with `createElement` + `textContent` only. Never `innerHTML` — folder names come from the filesystem and may contain `<`, `&`, or `"`.

Implement `galleryPickerShouldShowUp(currentPath, startPath)` — true only when the normalized parent of `currentPath` is strictly inside `startPath`, per the assertions above.

On confirm, call `galleryLoadFolder` with the leaf name as `rootId` and build the image list from `galleryServerList(absPath).images`, mapping each to a `File`-like object carrying `webkitRelativePath` so the existing section/grouping code is unchanged. Store the absolute path via `galleryAddSavedPath`, but under a key that includes the full path (Review Focus #2).

Route `openGalleryFolder()` so that in `server` mode it opens the picker instead of calling `showDirectoryPicker`.

- [ ] **Step 6: Add translations**

Add to `base-en.js` and `base-zh.js`, both languages, e.g. `gallery-picker-title`, `gallery-picker-up`, `gallery-picker-confirm`, `gallery-picker-cancel`, `gallery-picker-empty`.

- [ ] **Step 7: Verify**

Run: `cmd /c "npm run check-translations"` → must report equal key counts.
Run: `await window.runAllTests()` → `Gallery Picker Model` PASS.
In Brave on `http://localhost:8000`, click the open-folder button, navigate two levels deep, confirm, and check the gallery populates.

- [ ] **Step 8: Commit**

```bash
git add index.html css/ui/gallery.css js/ui/gallery.js js/core/debug.js js/ui/third/base-translation/
git commit -m "feat(gallery): add web folder picker for server mode"
```

---

### Task 5: Path memory and watch in server mode

**Files:**
- Modify: `js/ui/gallery.js`
- Test: `js/core/debug.js`

**Interfaces:**
- Consumes: `galleryServerList()` from Task 3; the picker path key from Task 4
- Produces:
  - `galleryServerRestorePaths() -> Promise<void>` — reopens every saved server path on startup
  - `galleryServerWatchPoll() -> Promise<void>` — one poll cycle, adding images whose `name`+`mtime` are new

- [ ] **Step 1: Write the failing test**

Add to `js/core/debug.js` and register it:

```javascript
function testGalleryWatchDiff(){
if(typeof galleryDiffImages!=='undefined'){
TestRunner.reset();
const before=[{name:'a.png',mtime:1000,size:1},{name:'b.png',mtime:1000,size:1}];
const after=[{name:'a.png',mtime:1000,size:1},{name:'b.png',mtime:2000,size:9},{name:'c.png',mtime:3000,size:3}];
const added=galleryDiffImages(before,after);
TestRunner.assertEquals(1,added.filter(x=>x.name==='c.png').length,'New file detected');
TestRunner.assertEquals(0,added.filter(x=>x.name==='a.png').length,'Unchanged file not re-added');
TestRunner.assert(galleryDiffImages([],after).length===2,'Empty baseline yields everything');
return TestRunner.printResults('Gallery Watch Diff');
}
console.warn('[Test Skip] gallery watch diff not loaded');
return false;
}
```

- [ ] **Step 2: Run the suite to verify it fails**

Expected: FAIL / `[Test Skip]`

- [ ] **Step 3: Implement**

`galleryDiffImages(before, after)` returns entries from `after` that are absent from `before` by `name`, or present with a different `mtime`. Key on `name` **and** `mtime` so an overwritten file is treated as changed.

`galleryServerRestorePaths()` runs on startup in `server` mode: for each saved server path, call `galleryServerList`; on success load it, on `404` mark it stale and leave it in the list so the user can remove it (Review Focus #5); on `403` clear `galleryState.serverToken`, re-probe once, and stop.

`galleryServerWatchPoll()` runs every 4000ms on the watched path, matching the existing `galleryWatchPoll` cadence, and appends only the diff.

- [ ] **Step 4: Run the suite to verify it passes**

Expected: `Gallery Watch Diff` PASS; no regression in other suites.

- [ ] **Step 5: Verify in Brave**

Open `http://localhost:8000` in Brave, load a folder, start watch, drop a new image into that folder on disk. Expected: it appears within ~4s without a reload. Then restart the app and confirm the folder is restored automatically.

- [ ] **Step 6: Commit**

```bash
git add js/ui/gallery.js js/core/debug.js
git commit -m "feat(gallery): restore and watch server-mode paths"
```

---

### Task 6: Degradation notice

**Files:**
- Modify: `index.html`
- Modify: `css/ui/gallery.css`
- Modify: `js/ui/gallery.js`
- Modify: `js/ui/third/base-translation/base-en.js`, `base-zh.js`

**Interfaces:**
- Consumes: `galleryState.sourceMode` from Task 3
- Produces: `galleryUpdateModeNotice() -> void`

- [ ] **Step 1: Add the markup and styles**

Add a hidden `#gallery-mode-notice` inside `#gallery-content`, above the toolbar. Style it with existing custom properties. No fixed widths.

- [ ] **Step 2: Add translations**

Add `gallery-mode-degraded` to `base-en.js` and `base-zh.js`, stating that path memory and watch need `http://localhost:8000` and giving the start command `python 99_server.py`.

- [ ] **Step 3: Implement `galleryUpdateModeNotice()`**

Show the notice only when `galleryState.sourceMode === 'input'`. Hide it otherwise. Never hide the notice silently on an error path — the project's "no silent fallback" rule applies, so if the probe fails for a reason other than `file://`, log the reason via `galleryLogger.warn`.

- [ ] **Step 4: Verify**

Run: `cmd /c "npm run check-translations"` and `cmd /c "npm run lint"` → 0 errors.
Open `index.html` via `file://` → notice visible with the start command. Open via `http://localhost:8000` in Chrome → notice hidden.

- [ ] **Step 5: Commit**

```bash
git add index.html css/ui/gallery.css js/ui/gallery.js js/ui/third/base-translation/
git commit -m "feat(gallery): explain degraded mode when the local bridge is unreachable"
```

---

### Task 7: Documentation sync

**Files:**
- Modify: `AGENTS.md`
- Modify: `llm_doc/project-structure.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `llm_doc/project-structure.md`**

Add `gallery_fs_api.py` and `99_tests/` to the directory tree, and document the two API endpoints alongside the existing global-variable table. Write in Japanese to match the file.

- [ ] **Step 2: Update `CLAUDE.md`**

The `file://` rule currently reads as an absolute constraint. Amend it to state that `file://` keeps folder browsing but loses path memory and watch, and point at the spec. Do not delete the rule.

- [ ] **Step 3: Update `AGENTS.md`**

Add a line to the commands block for `python -m unittest discover -s 99_tests -v`, and note in "Other Gotchas" that the gallery has three source modes.

- [ ] **Step 4: Verify and commit**

Run: `cmd /c "npm run lint"` → 0 errors.
```bash
git add AGENTS.md llm_doc/project-structure.md CLAUDE.md
git commit -m "docs: document the gallery local filesystem bridge"
```

---

## Out of Scope

Explicitly **not** in this plan, per the spec:

- Writing files back to the chosen directory (`mode: 'readwrite'`) — read-only was confirmed.
- Polyfilling the File System Access API for Firefox/Safari.
- Paginating `list()` for directories with tens of thousands of files.
- Packaging the Python server as an executable or adding auto-start.