# プロジェクト構造

## ディレクトリ構成
```
manga-editor-desu/
├── index.html          メインHTML（script/CSS読み込み順が重要）
├── js/
│   ├── core/           基盤（logger, settings, auto-save, compression, font, util）
│   ├── fabric/         fabric.js Canvas管理（fabric-management.js）
│   ├── layer/          レイヤー管理（layer-management.js, blend, floating-window）
│   ├── ui/             UI部品（toast, overlay, control, event-delegator, prompt-manager, gallery）
│   ├── sidebar/        サイドバーツール
│   │   ├── pen/        ブラシ（crayon, ink, marker, spray, drip, stroke）
│   │   ├── text/       テキスト（vertical-text, custom effects 10種）
│   │   ├── speechBubble/ 吹き出し
│   │   ├── tone/       トーン（speedline, focusline, snow, noise）
│   │   ├── effect/     エフェクト（c2bw, c2c）
│   │   └── panel/      コマ割り（panel-manager, knife/）
│   ├── ai/             AI生成系（→ ai-system.md参照）
│   ├── db/             永続化（user-font-repository）
│   ├── dashboard/      ダッシュボード（統計、プロンプト頻度）
│   ├── svg/            SVGテンプレート（コマ割り、吹き出し）
│   ├── canvas-manager.js    キャンバスリサイズ・ズーム
│   ├── project-management.js プロジェクト保存/読み込み
│   └── shortcut.js     キーボードショートカット
├── css/
│   ├── root.css        CSS変数（カラー、z-index）
│   ├── layout.css      メインレイアウト
│   ├── layout-layer.css レイヤーパネル
│   ├── components.css  共通コンポーネント
│   ├── form.css        フォーム
│   ├── responsive.css  レスポンシブ
│   └── ui/             機能別CSS
├── html/               HTMLテンプレート
├── llm_doc/            LLM向けドキュメント
├── scripts/            ユーティリティスクリプト（format, translation check）
├── 99_server.py        開発サーバ（127.0.0.1:8000）。静的ファイル配信のみ
├── browser_launcher.py Chrome → Edge → 既定ブラウザの検出と起動
└── 99_tests/           Pythonユニットテスト（test/は機能サンドボックスなので使わない）
```

## サーバー（99_server.py）
静的ファイルを配信するだけの開発サーバ。APIエンドポイントは存在しない。

- バインドは`127.0.0.1`のみ。`Access-Control-Allow-Origin`は付与しない
- 起動時に`browser_launcher.py`でブラウザを検出して自動オープンする
- 検証: `python -m unittest discover -s 99_tests -v`

## ブラウザ起動（browser_launcher.py）
ギャラリーのフル機能には`File System Access API`が必要で、Chromium系のみ対応。
そのため起動時に対応ブラウザを優先して開く。

1. レジストリ`App Paths`（HKLM → HKCU）
2. 常见安装路径（`ProgramFiles` / `ProgramFiles(x86)` / `LocalAppData`）
3. どちらも無ければ既定ブラウザで開き、ギャラリー機能受限の警告を出力

## ギャラリーのソースモード
`js/ui/gallery.js`の`galleryState.sourceMode`で2形態を切り替える。

| モード | 条件 | パス記憶 | Watch |
|---|---|---|---|
| `handle` | `showDirectoryPicker`あり（Chrome/Edge） | 可（IndexedDBにハンドル保存） | 可 |
| `input` | それ以外（Firefox/Safari/Brave等） | 不可（webkitdirectoryは絶対パスを持たない） | 不可 |

- `input`モードでは画面に非対応ブラウザの注意書きを表示する
- ハンドルの保存にはlocalforageではなくIndexedDBを直接使う（localforageは
  JSON直列化するため`FileSystemDirectoryHandle`が`{}`になる）
- `FileSystemDirectoryHandle.values()`は`next()`はあるが`then()`を持たない。
  `galleryEachHandleEntry()`を使うこと

## 主要グローバル変数
| 変数 | 説明 |
|------|------|
| `canvas` | fabric.js Canvasインスタンス |
| `stateStack` / `currentStateIndex` | Undo/Redo履歴 |
| `ModeManager` | 操作モード管理（SELECT, FREEHAND, KNIFE, PEN等） |
| `providerRegistry` | AIプロバイダ登録・ロール割り当て |
| `aiTaskMap` | AI生成タスク状態（generation-task-manager.js） |
| `sdQueue` / `comfyuiQueue` / `runpodEndpointQueue` / `falaiQueue` | プロバイダ別TaskQueue |

## Canvas初期化
```javascript
new fabric.Canvas("mangaImageCanvas",{
  enableRetinaScaling:true,
  renderOnAddRemove:false,
  renderer:fabric.isWebglSupported?"webgl":"canvas"
});
```
- 最小サイズ: 600x400
- `blendScale=3`（fabric→HTMLキャンバス変換倍率）

## モジュール間通信
1. **DOM Events** - `addEventListener`/`dispatchEvent`
2. **fabric.js Canvas Events** - `canvas.on('selection:created')`等
3. **EventDelegator** - `data-action`属性によるクリック委譲
4. **グローバル変数** - `canvas`, `stateStack`, `ModeManager`等

## script読み込み順（index.html）
1. サードパーティ（fabric.js, i18next, hotkeys等）
2. core（logger, settings, error handler）
3. fabric管理
4. UI（toast, overlay, mode管理）
5. プロジェクト・キャンバス管理
6. レイヤー
7. サイドバーツール
8. AI系
9. auto-save, compression
10. font, service worker
