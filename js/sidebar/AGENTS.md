# js/sidebar/ — Tool System

**Generated:** 2026-07-26
**File count:** 51 JS files across 6 tool categories + 2 entry files

## STRUCTURE

```
sidebar/
├── sidebar.js              # Tool registry, mode switching, tool lifecycle
├── sidebar-ui.js           # DOM bindings, event delegation, tool panel rendering
├── pen/                    # Drawing tools
│   ├── pen-tools.js        # Tool definitions for all brushes
│   ├── original-brush.js   # Base brush factory
│   └── fabric/brushes/     # 7 brush implementations: crayon, ink, marker, spray, drip, stroke, sample
├── text/                   # Text tools (vertical CJK + 12 effect types)
│   ├── vertical-textbox.js # 588-line custom fabric.IText subclass for CJK RTL
│   ├── vertical-text.js    # Vertical text entry integration
│   ├── text-effect.js      # Effect application orchestrator
│   ├── text-2-manager.js   # Text-to-manager bridge
│   └── custom/             # 12 optimized text effects + custom-text-util.js
├── speechBubble/           # Bubble creation & editing
│   ├── speech-bubble-freehand.js  # 868-line JSTS geometry, point-by-point drawing
│   ├── speech-bubble-text.js      # Bubble text placement & metrics
│   └── speech-bubble-effect.js    # Bubble style & filter effects
├── tone/                   # Manga tone filters
│   ├── tone.js, tone-manager.js   # Core tone processing
│   ├── speedline.js, focusline.js # Action line generators
│   ├── tone-noise.js, snow-tone.js# Noise-based tones
├── effect/                 # Image color effects
│   ├── effect-manager.js   # Effect pipeline
│   ├── c2bw_tone.js        # Color-to-BW conversion
│   └── c2c.js              # Color-to-color conversion
└── panel/                  # Panel layout & manipulation
    ├── panel-manager.js    # 756-line SVG loading, image-in-frame, vertex editing
    ├── panel-template.js   # Pre-built grid templates
    └── knife/              # 7 files: split engine, geometry, state, rendering, constants, mode
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Tool activation/switch | `sidebar.js` | Mode registry, `activateTool(name)` |
| UI event wiring | `sidebar-ui.js` | `data-action` delegates, panel DOM |
| Custom brushes | `pen/fabric/brushes/*.js` | 7 standalone brush classes |
| CJK vertical text | `text/vertical-textbox.js` | Fabric IText subclass, RTL shaping |
| Text effects (12) | `text/custom/optimized-*-text.js` | Each effect = 1 file |
| Freehand bubble | `speechBubble/speech-bubble-freehand.js` | JSTS polygon geometry |
| Tone effects | `tone/speedline.js`, `focusline.js`, etc. | 6 tone types |
| Panel split | `panel/knife/*.js` | 7-file knife module |
| Vertex editing | `panel/panel-manager.js` | fabric.Polygon custom controls |

## CONVENTIONS

- `sb_` prefix for freehand bubble functions
- Fabric brushes extend `fabric.BaseBrush`, registered in `pen-tools.js`
- knife module uses `FPanelKnife` namespace pattern
- Text effects follow `optimized-{name}-text.js` naming, same option signature
- fabric.Polygon with custom `_getControlPositions` for vertex handles
- Namespaced by subdirectory — no cross-tool globals

## ANTI-PATTERNS

- **Empty catch blocks** — 10 total: 9 across `text/custom/optimized-{aurora,broken,cloud,scratch,mesh,shadow,thrill,water,zebra}-text.js`, 1 in `sidebar-ui.js`
- **Commented console.log** — 20 hits across 7 files (all commented, none active). Cleanup pending in speech-bubble-text.js, panel-template.js, panel-manager.js, tone-manager.js, optimized-shadow-text.js, speech-bubble-effect.js, c2bw_tone.js
- **Large single files** — `speech-bubble-freehand.js` (868 loc), `panel-manager.js` (756 loc), `vertical-textbox.js` (588 loc)
