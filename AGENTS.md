# PROJECT KNOWLEDGE BASE

Vanilla JS manga editor with AI image generation. Fabric.js canvas + AI backends.
No build tooling, no bundler, no ES modules — everything is globals loaded by
`<script>` order in `index.html`. ~165 JS files in `js/`, 38 CSS files, 71 help
pages in `html/`.

## COMMANDS

```bash
npm install                  # only needed for eslint (devDependencies only)
npm run lint                 # ESLint, js/ only, .eslintrc.json (NOT eslint.config.mjs)
npm run lint:fix
npm run format               # scripts/remove-spaces.cjs — rewrites js/ IN PLACE
npm run check-translations   # en/zh key parity in js/ui/third/i18next.js
python 99_server.py          # dev server on :8000, CORS + no-cache + SW headers
```

- `npm run format` only walks `js/` (hardcoded `targetDir`), skips `*.min.js` and
  the excluded dirs. It strips ALL leading indentation and spaces around
  operators/braces/brackets. **New code must be written unindented** — do not
  write indented code and rely on the formatter.
- There is no typecheck, no test runner, and no CI workflow. `package-lock.json`
  is gitignored.

## TESTING (in-browser only)

`js/core/debug.js` ships a runtime test suite. Run it from the browser console:

```js
await window.runAllTests();   // loggers, js-util, fabric-util, deepCopy,
                              // colorConversion, arrayBufferUtils, taskQueue
window.TestRunner.assert(...)
```

`console.log` inside `debug.js` and `logger.js` is legitimate output, not a
style violation — do not "clean it up".

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Canvas init/zoom | `js/canvas-manager.js` | `initResizeCanvas()`, `blendScale=3`, container CSS zoom |
| Canvas events | `js/fabric/fabric-management.js` | 35+ handlers, perf counters, shift-key mode override |
| Project save/load | `js/project-management.js` | LZ4 compressed `.json` files |
| Shortcuts | `js/shortcut.js` | hotkey table lives here |
| Globals (canvas, basePrompt, t2iInit/i2iInit, commonProperties) | `js/core/settings.js` | `commonProperties` = custom fabric serialization keys |
| i18n | `js/ui/third/i18next.js` | only `en` + `zh`; timestamp keys `yyyyMMddHHmmss_SSS` |
| Logger | `js/core/logger.js` | ~42 centrally-defined loggers |
| Auto-save | `js/core/auto-save.js` | 60s IndexedDB via localforage |
| PWA/SW | `js/core/service/worker-register.js` + `service-worker.js` | cache-first |
| Type checks | `js/core/util/fabric-util.js` | **HIGHEST CENTRALITY** — 940 lines, 54 funcs, 25+ dependent files |
| Undo/redo | `js/layer/image-history-management.js` | `stateStack`, `currentStateIndex`, `imageMap` (SHA-256 dedup) |
| Layer panel | `js/layer/layer-management.js` | hierarchical render, 60ms debounce |
| Blend modes | `js/layer/blend/blend.js` | 25 Photoshop modes via PixiJS GPU |
| Multi-page state | `btmProjectsMap` + `chengeCanvasByGuid()` | pages keyed by GUID |

## NESTED INSTRUCTION FILES

Subdirectory `AGENTS.md` files exist and are authoritative for their area —
read the one for the directory you are editing instead of relying on this file:

- `js/core/AGENTS.md` — logger, settings, compression, font, util
- `js/ui/AGENTS.md` — UI components, prompt helper, control
- `js/sidebar/AGENTS.md` — pen/text/bubble/tone/effect/panel tools
- `js/ai/AGENTS.md` — providers, queues, ComfyUI workflows

## SCRIPT LOAD ORDER IS AUTHORITATIVE

`index.html` has ~192 `<script>` tags (158 from `js/`, 23 from `third/`) plus 52
stylesheet links. Load order is the dependency graph. Reordering, bundling,
adding `type="module"`, or introducing `import` will break the app.

`third/` is vendored (Fabric.js, PixiJS, LZ4/WASM, i18next, Bootstrap, Tagify,
Tippy, Chart.js). Do not edit vendored files.

## KEY ARCHITECTURAL PATTERNS

| Pattern | Location | Purpose |
|---------|----------|---------|
| Abstract base + registry | `js/ai/provider/ai-provider.js` + `provider-registry.js` | polymorphic dispatch; `register()` at file bottom |
| Role-based routing | `provider-registry.js` + `js/ai/role/ai-roles.js` | different backends handle different capabilities |
| Per-provider queues | `js/ai/ai-management.js` | `sdQueue`, `comfyuiQueue`, `falaiQueue` — all `TaskQueue(1)`. (Note: `llm_doc/project-structure.md` mentions a `runpodEndpointQueue` that does not exist.) |
| Hash dedup | `imageMap` + SHA-256 | prevents duplicate image storage in undo stack |
| Container CSS zoom | `canvas-manager.js` | zoom via transform, not Fabric.js zoom |
| EventDelegator | `js/ui/util/event-delegator.js` | `data-action` attribute-based click delegation |
| ModeManager | `js/ui/util/mode-manager.js` | SELECT/FREEHAND/POINT/KNIFE/CROP/PEN |
| `isSaveHistory` flag | `image-history-management.js` | wraps batch ops to suppress undo entries |

Provider files: `local-comfyui-provider.js`, `local-sdwebui-provider.js`
(handles both A1111 and Forge), `falai-provider.js`, `runpod-comfyui-provider.js`.

## CONVENTIONS

- **No ES modules** — all globals, dependency by `<script>` order.
- **camelCase** locals; API response property names stay as the API sends them
  (`response.prompt_id` → `var promptId = response.prompt_id;`).
- `npm run format` strips ALL indentation (see above).
- **Logging:** use a logger from `js/core/logger.js`. `SimpleLogger` is a global
  **factory function**, not a class — call `SimpleLogger('tag', LogLevel.WARN)`.
  (`CONTRIBUTING.md` shows `new SimpleLogger(...)`, which is wrong.) To add a
  logger, append to the central list at the bottom of `logger.js`; never create
  one per file.
- **UI events:** prefer `EventDelegator` with `data-action` over direct
  `addEventListener`.
- **No JSDoc**; comments generally unnecessary.
- **`file://` must keep working** — no fetch of local assets that requires a
  server, no ES module imports.
- **No fixed pixel widths** — layout must stay flexible/responsive.
- **No silent fallbacks** (`_x || default`) — a visible error beats a wrong
  default.
- UI strings must be added to i18n in **both** `en` and `zh`.
- `llm_doc/*.md` are written in **Japanese**; match existing terminology rather
  than inventing synonyms.

## ANTI-PATTERNS (this project)

- `console.log` in feature code — BANNED, use a logger.
- **Empty `catch` blocks** — swallow-hides failures.
- **`JSON.stringify(error)`** — Error serializes to `{}`. Use
  `error.name + ': ' + error.message`.
- **Global variable fallback** (`_comfyUIExecProvider || default`) — a known
  regression source (`llm_doc/review-checklist.md` #9, #21).
- **Async global capture** — capture `serverAddress` / `authHeaders` *before*
  `await`; they can change underneath you (review-checklist #20).
- **`canvas.renderAll()` inside a loop** — freeze. Call once after.
- **`saveStateByManual()` inside a loop** — memory pressure. Wrap in
  `changeDoNotSaveHistory()` / `changeDoSaveHistory()`.
- **`blob:` URLs into `imageMap`** — invalid after session ends. Use `data:`
  URLs or JSON strings (`convertImageMapBlobUrls()`).
- Reordering `index.html` scripts, editing `third/`, or writing ES modules.

## EXCLUDED FROM SEARCH/EDITS

`json_js/`, `test/`, `third/`, `01_build/`, `02_images_svg/`, `03_images/`,
`99_doc/`, `font/`, `node_modules/`. `test/` is a feature sandbox, not tests.

## OTHER GOTCHAS

- Single global `fabric.Canvas("mangaImageCanvas")` bound to `canvas`. Min size
  600×400; `renderOnAddRemove:false`.
- `image-history-management.js` overrides
  `fabric.Object.prototype.toObject` globally.
- AI tasks carry `canvasGuid`; results apply via an offscreen canvas if the user
  navigated to another page mid-generation.
- Cross-page-safe: never assume the active canvas is the one the task started on.
- `.claude/settings.local.json` contains stale absolute paths from another
  machine — ignore its path entries.