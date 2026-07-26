# js/core/ — Foundation Layer

## OVERVIEW
Global wiring: logger, settings, error handler, auto-save, debug tools, and shared utilities that everything depends on.

## STRUCTURE
- `*.js` (root): logger.js (SimpleLogger factory + 30+ named instances), settings.js (canvas, basePrompt, t2iInit, i2iInit, commonProperties), global-error-handler.js (window.onerror + unhandledrejection), auto-save.js (60s IndexedDB via localforage), debug.js (TestRunner + DEBUG_FLAGS)
- `compression/`: lz4.js (WASM FileCompressor), project-compression.js
- `font/`: font-manager-core.js (FontManager), font-dropdown.js (FontSelector + FontSelectorManager)
- `service/`: worker-register.js (PWA service worker registration)
- `svg/`: google-icon-helper.js, google-icon-names.js
- `util/`: 10 files — fabric-util.js (940 lines), image-util.js, html-canvas-util.js, array-buffer-utils.js, js-util.js, log-util.js, load-util.js, anime-util.js, image-analyzer-util.js, share-util.js

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Add a logger | `logger.js` | `SimpleLogger('tag', LogLevel.WARN)` — 30+ already defined |
| Canvas instance | `settings.js` | `var canvas = new fabric.Canvas(...)` — global singleton |
| Prompt defaults | `settings.js` | `basePrompt`, `t2iInit`, `i2iInit` objects |
| Object serialization keys | `settings.js` | `commonProperties` array — add custom fabric props here |
| Error monitoring | `global-error-handler.js` | 17 lines, catches both sync and promise errors |
| Auto-save config | `auto-save.js` | `AutoSaveManager` — interval, enable/disable, restore |
| Debug flags | `debug.js` | `DEBUG_FLAGS.settingsHighlight` |
| LZ4 compression | `compression/lz4.js` | `lz4Compressor` global, `JSON.stringify(error)` bug here |
| Font system | `font/font-manager-core.js` | `fontManager.init()` before font-dropdown usage |
| Utility heavy-lift | `util/fabric-util.js` | 940 lines of Fabric.js helpers |

## CONVENTIONS
- SimpleLogger is a factory function (never `new` per file). Pass method name as last arg for caller attribution.
- Global objects defined here: `canvas`, `basePrompt`, `t2iInit`, `i2iInit`, `commonProperties`, `lz4Compressor`
- No ES modules — all globals, dependency via `<script>` load order in index.html
- Comments and JSDoc are not needed

## ANTI-PATTERNS
- **console.log** — BANNED. `debug.js` has 19 remaining active calls (known violation).
- **`JSON.stringify(error)`** — `compression/lz4.js` serializes Error objects to `{}`.
- **Empty `catch` blocks** — check all catch handlers for swallowed errors.
- **Global fallback pattern** — `_someVar || default` causes regressions (review-checklist.md items #9, #21).
