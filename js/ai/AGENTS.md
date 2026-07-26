# AI GENERATION SUBSYSTEM

## OVERVIEW

Provider-based routing for AI image generation. 4 backends (ComfyUI, SD WebUI, Forge, Fal.ai). ~45 files across 11 subdirs. Abstract base class + registry pattern.

## STRUCTURE

```
js/ai/
├── ai-management.js      # ROUTER — T2I/I2I/rembg/upscale/inpaint/AngleGenerate dispatchers
├── ai-settings.js        # Settings persistence for AI backends
├── provider/
│   ├── ai-provider.js       # Abstract base class (AIProvider), 7 execute*() methods
│   ├── provider-registry.js # Singleton IIFE — register/get providers by id
│   ├── local-comfyui-provider.js   # ComfyUI (SD1.5/SDXL/Pony/Flux1)
│   ├── local-sdwebui-provider.js   # A1111 WebUI + Forge
│   ├── runpod-comfyui-provider.js  # RunPod cloud
│   └── falai-provider.js          # Fal.ai cloud
├── comfyui/
│   ├── comfyui-management.js  # Core API orchestration, WebSocket, v1 entry point
│   ├── v2/                    # Workflow repository, editor, object-info cache, util
│   └── util/                  # Workflow builder, utility helpers
├── sdwebui/
│   ├── sdwebui-settings.js
│   ├── sdwebui-multi-call-api.js
│   └── sdwebui-single-call-api.js
├── queue/
│   ├── task-queue.js              # Concurrency control (3 singletons in ai-management)
│   ├── spinner.js                 # Progress state UI
│   └── generation-task-manager.js # aiTaskMap — tracks in-flight generations
├── prompt/
│   ├── base-event-listener.js     # Prompt event wiring
│   └── auto/                      # Auto-prompt generation (story structure, maps)
├── inpainting/               # inpaint-workflow.js, inpaint-mask.js, inpaint-editor.js
├── angle/                    # camera-widget.js, angle-editor.js
├── role/                     # ai-roles.js (AI_ROLES enum), role-assignment-ui.js
└── ui/                       # unified-settings-window.js, model-settings-window.js, ai-ui-util.js
```

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Provider routing / dispatch | `ai-management.js` | T2I/I2I/rembg/upscale/AngleGenerate — routes via `_comfyUIExecProvider` |
| Abstract base class | `provider/ai-provider.js` | 7 execute*() methods, heartbeat, fetchModels/Samplers |
| Provider registration | `provider/provider-registry.js` | Singleton IIFE, register()/get() by id |
| Task queue | `queue/task-queue.js` | Concurrency=1, 3 singletons (sdQueue/comfyuiQueue/falaiQueue) |
| ComfyUI core | `comfyui/comfyui-management.js` | API calls, WebSocket, v1 entry — delegates to v2 |
| ComfyUI v2 workflows | `comfyui/v2/comfyui-workflow-repository.js` | Default workflow library, editor, object-info cache |
| SD WebUI | `sdwebui/sdwebui-single-call-api.js` | A1111/Forge single and multi-call modes |
| Auto-prompt | `prompt/auto/auto-prompt-util.js` | Story structure generation (opening/early/late/sex/finish) |

## CONVENTIONS

- `_comfyUIExecProvider` global variable controls which provider receives T2I/I2I dispatch
- Legacy `comfyuiHandleProcessQueue` delegates to `comfyui_put_queue_v2` for v2 workflow execution
- 3 `TaskQueue(1)` singletons (sdQueue, comfyuiQueue, falaiQueue) — one per backend family
- WebSocket-based progress for ComfyUI; polling for SD WebUI
- Provider must capture `serverAddress`/`authHeaders` before `await` (race condition risk)
- `AI_ROLES` enum in `role/ai-roles.js` — role-based prompt template switching
- Settings persisted via `ai-settings.js` (localStorage)

## ANTI-PATTERNS

- **Global variable fallback** — `_comfyUIExecProvider || default` pattern (regression source, see review-checklist.md #9/#21)
- **Empty catch blocks** — 2 in `queue/task-queue.js`, 1 in `provider/falai-provider.js`
- **Async global capture** — `serverAddress`/`authHeaders` MUST be captured before `await` (known race, see llm_doc/ai-system.md)
- **TODO markers** — 2 in `ai-management.js` for ComfyUI model/clip handler stubs
