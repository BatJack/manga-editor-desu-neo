# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-26
**Commit:** b3e79b9
**Branch:** neo_dev_branch

## OVERVIEW

Vanilla JS manga editor with AI image generation. Fabric.js canvas + 4 AI backends (ComfyUI/SD WebUI/Forge/Fal.ai). No build tooling, no modules — ~95 global `<script>` tags in strict load order.

## STRUCTURE

```
manga-editor-desu-neo/
├── js/               # 157 JS files, ~53K LOC — all application logic
│   ├── core/         # Foundation layer (see js/core/AGENTS.md)
│   ├── ai/           # AI generation subsystem (see js/ai/AGENTS.md)
│   ├── sidebar/      # Tool system — pen/text/bubble/tone/panel (see js/sidebar/AGENTS.md)
│   ├── ui/           # UI components — toast/overlay/menu/prompt-helper/i18n
│   ├── fabric/       # fabric-management.js — canvas event orchestration
│   ├── layer/        # Layer stack + blend modes (PixiJS GPU blend)
│   ├── dashboard/    # Usage analytics (Chart.js/WordCloud)
│   ├── svg/          # SVG panel/bubble templates
│   ├── panel/        # Grid overlay + random-cut
│   └── db/           # IndexedDB font repository
├── css/              # 38 files — root variables + layout + 18 feature-specific UI
├── html/             # Help pages, manual, policy docs
├── llm_doc/          # AI-agent architecture docs (9 files)
├── roadmap/          # Feature plans (28 markdown files)
├── scripts/          # Format/translation-check utilities
└── index.html        # SPA entry — 2000+ line shell with boot animation
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Canvas init/zoom | `js/canvas-manager.js` | `initResizeCanvas()`, `blendScale=3` |
| Canvas events | `js/fabric/fabric-management.js` | 35+ event handlers (selection/object/mouse) |
| Project save/load | `js/project-management.js` | LZ4 compressed `.json` files |
| Shortcuts | `js/shortcut.js` | hotkeys.js bindings |
| Global settings | `js/core/settings.js` | Canvas instance, basePrompt, commonProperties |
| i18n | `js/ui/third/i18next.js` | 8 languages, `getText(key)` |
| Logger | `js/core/logger.js` | 20+ named loggers, `SimpleLogger('tag', level)` |
| Console → logger | NO console.log — USE SimpleLogger | BANNED in coding-rules.md |
| CSS variables | `css/root.css` | `--color-base`, `--color-accent`, dark-mode vars |
| CSS layout | `css/layout.css` + `css/layout-layer.css` | Main layout + layer panel |
| State/Undo | `js/layer/image-history-management.js` | `stateStack`, `currentStateIndex`, `imageMap` |
| Auto-save | `js/core/auto-save.js` | 60s IndexedDB auto-save |
| PWA/SW | `js/core/service/worker-register.js` | Cache-first, install prompt |

## CONVENTIONS

- **No ES modules** — all globals, dependency by `<script>` order in `index.html`
- **camelCase** variables, API responses keep original casing (snake_case OK)
- **Format:** `npm run format` runs custom `remove-spaces.cjs` (strips ALL indentation, keeps comments/strings)
- **Lint:** `npm run lint` — ESLint with `no-undef: off`, `camelcase: warn` (allow t2_/sd_/comfyui_ prefixes)
- **Logging:** `SimpleLogger('tag', LogLevel.WARN)` — min TRACE < DEBUG < INFO < WARN < ERROR < SILENT
- **UI patterns:** EventDelegator (`data-action`), ModeManager, CSS variables, Fabric.js events
- **Communication:** DOM events > EventDelegator > Fabric events > global variables
- **No JSDoc** — inline comments generally not needed
- **file:// protocol** — app must work when opened directly, not just via HTTP server

## ANTI-PATTERNS (THIS PROJECT)

- **console.log** — FORBIDDEN. Use `SimpleLogger` (14 violations in active code: debug.js, speech-bubble-text.js, panel-template.js, etc.)
- **Empty catch blocks** — 13 occurrences across 12 files (sidebar-ui.js, task-queue.js, 9 optimized text effects, falai-provider.js)
- **`JSON.stringify(error)`** — Error objects serialize to `{}` (1 hit in lz4.js)
- **Global variable fallback** — `_comfyUIExecProvider || default` pattern is a known regression source (review-checklist.md items #9, #21)
- **Async global capture** — MUST capture `serverAddress`/`authHeaders` before `await` (review-checklist.md item #20, 2 hits)

## COMMANDS

```bash
npm run lint              # ESLint on js/
npm run lint:fix          # ESLint auto-fix
npm run format            # Custom space-removal formatter
npm run check-translations # i18n key consistency across 8 languages
python 99_server.py       # Dev server on port 8000 (CORS + SW headers)
```

## NOTES

- Single `fabric.Canvas("mangaImageCanvas")` — global `canvas` variable
- Minimum canvas size: 600×400; `blendScale=3` for canvas conversion
- i18n keys are timestamps: `yyyyMMddHHmmss_SSS`, always 8 languages (ja/en/ko/fr/zh/ru/es/de)
- `test/` directory is a feature sandbox, NOT automated tests (zero test infrastructure)
- Script loading order in `index.html`: 3rd-party → core → fabric → UI → project → layer → sidebar → AI → auto-save → font → SW
- Excluded from search/editing: `json_js/`, `test/`, `third/`, `01_build/`, `02_images_svg/`, `03_images/`, `99_doc/`, `font/`
