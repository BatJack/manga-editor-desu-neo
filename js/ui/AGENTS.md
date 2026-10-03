# js/ui/ — UI Components

**Generated:** 2026-09-12
**File count:** 25+ JS files across 12 subdirectories

## OVERVIEW
UI components: toast notifications, modals, overlays, control panels, i18n, event delegation, prompt management, and third-party lib wrappers.

## STRUCTURE
```
ui/
├── toast.js                    # createToast() / createToastError() — Bootstrap Toast API
├── tutorial.js                 # Onboarding tutorial (intro.js wrapper)
├── gallery.js                  # Image gallery, drag-drop import
├── bottom-bar.js               # Bottom toolbar, multi-page nav (btmProjectsMap, 12 addEventListener)
├── canvas-object-menu.js       # Right-click context menu (628 lines, 14 funcs)
├── prompt-manager.js           # Prompt preset management
├── overlay-progress.js         # Progress overlay for AI generation
├── glfx-ui.js                  # glfx WebGL effect UI (21 console.log violations)
├── custom-html-component.js    # setupSlider() — auto-attaches up/down buttons + labels
├── control/                    # Control panels
│   ├── common-control.js       # Shared controls
│   ├── image-control-manager.js# Image-specific controls
│   ├── information.js          # Info panel
│   └── glfx-control.js         # glfx effect controls
├── imagePromptHelper/          # AI prompt tag picker
│   ├── prompt-helper.js
│   ├── hc-image-prompt-helper.js
│   └── image-prompt-helper.js  # 582 lines, 26 funcs, category navigation
├── font/
│   └── user-font-manager.js    # User font upload/management
├── ai/
│   └── auto-prompt-ui.js       # Auto-prompt generation UI
├── util/                       # Core UI utilities
│   ├── ui-util.js              # $(), hideById(), showById(), toggleVisibility()
│   ├── event-delegator.js      # data-action click delegation system
│   ├── mode-manager.js         # ModeManager: SELECT/FREEHAND/POINT/KNIFE/CROP/PEN
│   ├── mode-change.js          # Mode switching UI
│   ├── focus-trap.js           # Accessibility focus trapping
│   └── tagify-util.js          # Tag input utility
└── third/                      # Third-party lib wrappers
    ├── i18next.js              # i18n init, getText(), 8-language resources (4517 lines)
    ├── intro.js                # Onboarding tour wrapper
    └── base-translation/       # 8 translation dictionaries (~500 lines each)
        ├── base-ja.js, base-en.js, base-ko.js, base-fr.js
        └── base-zh.js, base-ru.js, base-es.js, base-de.js
```

## WHERE TO LOOK
| Task | File | Notes |
|------|------|-------|
| Toast notifications | `toast.js` | `createToast(title, msgs, time)`, `createToastError()` |
| Event delegation | `util/event-delegator.js` | `EventDelegator.register('action', handler)` |
| Mode switching | `util/mode-manager.js` | `ModeManager.getCurrent()`, `ModeManager.MODE.SELECT` |
| Right-click menu | `canvas-object-menu.js` | Dynamic menu from object properties, 628 lines |
| i18n init + getText | `third/i18next.js` | Timestamp keys `yyyyMMddHHmmss_SSS`, 8 languages |
| Translation files | `third/base-translation/base-*.js` | 10 languages, ~500 lines each |
| Prompt presets | `prompt-manager.js` | localStorage-backed preset management |
| AI prompt picker | `imagePromptHelper/image-prompt-helper.js` | Category nav, tag selection, 26 functions |
| Bottom bar / pages | `bottom-bar.js` | `btmProjectsMap`, page nav, 12 direct addEventListener calls |
| Slider component | `custom-html-component.js` | `setupSlider(slider, classname, addButton)` |
| Focus trapping | `util/focus-trap.js` | Accessibility for modals |

## CONVENTIONS
- EventDelegator (`data-action`) preferred over direct `addEventListener` for UI events
- ModeManager is the single source of truth for current editing mode
- i18n keys are flat, timestamped: `getText('yyyyMMddHHmmss_SSS')`
- Toast uses Bootstrap Toast API with custom themes (`toast-nier` success, `toast-dbd` error)
- CSS variables from `css/root.css` for theming (dark/light mode)
- HTML attributes: `data-i18n="keyName"` for text, `data-i18n-placeholder="keyName"` for inputs

## ANTI-PATTERNS
- **Direct addEventListener** — `bottom-bar.js` (12 calls), `canvas-object-menu.js` — should use EventDelegator where possible
- **console.log violations** — `glfx-ui.js` has 21 active calls (worst in codebase)
- **Large files** — `canvas-object-menu.js` (628 lines), `image-prompt-helper.js` (582 lines), `i18next.js` (4517 lines, third-party)
