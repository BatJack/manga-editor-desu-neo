# 画廊本地文件系统桥接 — 设计文档

**日期:** 2026-10-04
**状态:** 已批准，待实施
**分类:** 架构级（新增本地服务端点 + 前端后端抽象 + 新增 UI 组件）

---

## 1. 背景与问题

画廊当前使用 File System Access API（`showDirectoryPicker`）访问本地目录。该 API 的可用性因浏览器而异：

| 浏览器 | `showDirectoryPicker` |
|---|---|
| Chrome / Edge | 可用 |
| Brave | **不可用** —— Brave 默认禁用整个 File System Access API（Brave issue #11407「Remove support for native file system API」，出于隐私考量） |

Brave 中该函数为 `undefined`（不是调用失败）。现有代码 `js/ui/gallery.js` 中 `typeof showDirectoryPicker === 'function'` 的判断已能正确降级到 `<input webkitdirectory>`。

**问题：** 降级路径只能「选文件夹看图」，无法「记住路径自动恢复」和「Watch 监控新图」。原因是 `webkitdirectory` 不暴露绝对路径（见 `gallery.js:37` 注释），无法在下次会话重新访问，也无法轮询变更。

**目标：** 让 Chrome、Edge、Brave 三个浏览器行为一致，都支持选目录浏览、路径记忆自动恢复、Watch 监控。

**非目标：** 本期不支持写入（用户已确认只读）。

---

## 2. 关键约束与决策

### 2.1 渐进增强，不放弃 `file://`

**重要：** 本方案**不要求**放弃 `file://` 直接打开。`CLAUDE.md` 与 `llm_doc/review-checklist.md` #10 的「`file://` 必须可用」要求继续满足。

| 打开方式 | 可用能力 |
|---|---|
| `http://localhost:8000` | 全部三项（三浏览器一致） |
| 双击 `index.html`（`file://`） | 仅浏览；路径记忆与 Watch 不可用，界面明确提示原因 |

降级**明示**而非静默 —— 符合项目「禁止 fallback 造成用户误解」的规则。

### 2.2 安全模型（已确认：仅本机 + 随机 token，只读）

现有 `99_server.py` 存在两个问题，在新增文件系统端点后会变成严重漏洞：

- 第 38 行 `ADDRESS = ""` → 绑定**全部网卡**（0.0.0.0），局域网可访问
- 第 11 行 `Access-Control-Allow-Origin: '*'` → 任意网站可跨源读取响应

若新增「按请求读取任意路径」的端点，攻击者只需诱导用户访问一个恶意网页，即可经 `http://localhost:8000` 静默窃取本机文件。

**四层防护：**

1. 绑定 `127.0.0.1`，仅本机可连接
2. API 响应**不发送** `Access-Control-Allow-Origin`（静态资源亦移除；已验证应用无跨源请求指向 8000）
3. 校验 `Host` / `Origin` 请求头 —— 阻断 DNS rebinding（此时 `attacker.com` 与 `localhost:8000` 同源，仅靠 CORS 不足以防御）
4. 启动时生成随机 token 打印至控制台，所有 API 请求需带 `X-Gallery-Token` 头（纵深防御，阻止其他本机进程调用）

### 2.3 昨日修复的关联

`2026-10-04` 修复的「画廊路径只记住最近一次」根因是 localforage 用 `JSON.stringify` 序列化导致 `FileSystemDirectoryHandle` 变成 `{}`，已改为原生 IndexedDB（结构化克隆）。

**该修复在服务端模式下自然不适用**：绝对路径是普通字符串，不存在序列化问题。两种模式并存不冲突。

---

## 3. 服务端设计（`99_server.py`）

### 3.1 安全改造

- `ADDRESS = "127.0.0.1"`（替换 `""`）
- 移除 `Access-Control-Allow-Origin: *`
- 新增 `Host` 校验：仅接受 `localhost`、`127.0.0.1`（含端口）；`Origin` 若存在且非本机则拒绝
- `secrets.token_urlsafe(32)` 生成 token，启动时打印

### 3.2 新增端点（均需 `X-Gallery-Token`）

**`GET /api/fs/list?path=<绝对路径>`**

```json
{
  "path": "D:\\Manga\\raw",
  "parent": "D:\\Manga",
  "folders": [{ "name": "ch01", "path": "D:\\Manga\\raw\\ch01" }],
  "images":  [{ "name": "p001.png", "path": "D:\\Manga\\raw\\p001.png",
                "mtime": 1735689600000, "size": 204800 }]
}
```

- 目录不存在或不可读 → HTTP 404 + JSON `{error}`
- 非目录 → HTTP 400
- 仅列出图片文件（按现有 `accept="image/*"` 语义，以扩展名 + MIME 判断）
- 按名称排序；文件夹在前

**`GET /api/fs/image?path=<绝对路径>&name=<文件名>`**

- 返回图片二进制，`Content-Type` 由 `mimetypes` 推断
- `Cache-Control: no-store`

### 3.3 路径安全校验（所有端点共用）

```
1. 拒绝空路径、非绝对路径
2. 拼接后 os.path.realpath() 规范化，消除 .. 与符号链接
3. 校验 name 不含路径分隔符（防目录穿越）
4. 规范化后重新校验为绝对路径
```

### 3.4 保持不变

`SimpleHTTPRequestHandler` 的静态文件服务、`Service-Worker-Allowed` 头、`ThreadedTCPServer` 配置均不变。

---

## 4. 前端设计

### 4.1 后端模式抽象

`js/ui/gallery.js` 新增统一接口，三种模式各自实现：

```javascript
// 统一接口
{
  kind: 'handle' | 'server' | 'input',
  list(): Promise<Array<{name, mtime, size}>>,   // 列出目录下图片
  readImage(name): Promise<Blob>,
  capabilities: { remember: bool, watch: bool }
}
```

| 模式 | 触发条件 | remember | watch |
|---|---|---|---|
| `handle` | `showDirectoryPicker` 可用 | ✅ | ✅ |
| `server` | `/api/fs/list` 可达 | ✅ | ✅ |
| `input` | 以上均不可用（`file://`） | ❌ | ❌ |

**探测时机：** `DOMContentLoaded` 时探测 `/api/fs/list`（不传 path，返回 400 即代表可达）。探测结果缓存于 `galleryState.sourceKind`。

`file://` 下对 `http://localhost:8000` 的跨源 fetch 会失败（CORS），自然降级，无需特殊判断协议。

### 4.2 服务端目录选择器（新增 UI 组件）

Brave 无原生选择器，需自建文件夹浏览面板：

- 复用现有 `createElement` + `textContent` 风格（**禁止 `innerHTML`**，目录名可能含 `<`、`&`）
- 列出当前目录的子文件夹，点击逐级进入
- 提供「上一级」（`parent` 非空时）
- 底部「使用此文件夹」确认
- 路径显示在面板顶部
- 遵循项目规范：无固定像素宽度，flexible 布局

### 4.3 路径记忆（服务端模式）

- 绝对路径存 `localStorage`，复用现有 `galleryPaths` / `galleryLastPath` 键
- 与现有 `savedPaths` 机制合并：`handle` 模式存句柄，`server` 模式存路径字符串
- `galleryFindUsableHandle` 相应扩展为按模式分派

### 4.4 Watch（服务端模式）

- 复用现有 `galleryWatchPoll` 的 4 秒轮询与差分逻辑
- 数据源改为 `serverSource.list()`
- 按 `name` + `mtime` 差分识别新增/变更文件

### 4.5 降级提示

`file://` 下降级时，在画廊区域显示提示条（走 i18n，`en` + `zh` 双语）：

> 当前为浏览模式。路径记忆与目录监控需要通过本地服务器访问。
> 启动命令：`python 99_server.py`，然后打开 http://localhost:8000

### 4.6 国际化

新增文案按项目规范加入 `js/ui/third/i18next.js`，时间戳键格式 `yyyyMMddHHmmss_SSS`，`en` 与 `zh` 必须同时添加。完成后运行 `npm run check-translations`。

---

## 5. 测试策略

### 5.1 服务端（Python）

- 路径穿越：`?path=../../etc/passwd`、`name=../secret` 必须被拒绝
- 非绝对路径、目录不存在、非目录 → 正确的 HTTP 状态码
- 无 token / 错误 token → 401
- 非法 `Host` 头 → 拒绝（DNS rebinding）
- 正常列目录：文件夹在前、图片按扩展名过滤、排序正确

### 5.2 前端（`js/core/debug.js` TestRunner）

沿用既有模式（`await window.runAllTests()`），新增：

- `testGalleryPathSafety` — 路径规范化与拒绝逻辑
- 后端模式探测：mock 三种环境，断言选中正确的 `sourceKind` 与 `capabilities`

`testGalleryHandleStore`（昨日新增）保持不变，`handle` 模式继续有效。

### 5.3 手动验证

- Brave + `localhost:8000`：选目录 → 刷新页面 → 路径自动恢复 → Watch 生效
- Chrome + `file://`：浏览可用，提示条正确显示
- Chrome + `localhost:8000`：三种能力全可用（回归）

---

## 6. 影响范围

| 文件 | 改动 |
|---|---|
| `99_server.py` | 安全改造 + 2 个端点 |
| `js/ui/gallery.js` | 后端抽象、目录选择器 UI、模式探测 |
| `index.html` | 提示条容器 + 目录选择器面板容器 |
| `js/core/debug.js` | 新增测试 |
| `js/ui/third/i18next.js` | 新增文案 |
| `css/`（画廊相关） | 提示条与选择器样式 |
| `AGENTS.md` / `llm_doc/` | 架构文档同步 |
| `CLAUDE.md` | `file://` 约束补充说明（能力降级，非破坏） |

---

## 7. 已知限制

1. **服务端模式要求用户信任本机 Python 进程** —— 服务可读取本机任意路径，这是本地工具的固有信任模型
2. **token 在控制台显示** —— 共享屏幕或录制时需注意
3. **Brave 用户仍看不到原生选择器** —— 自建面板是网页实现，交互不如原生对话框
4. **大目录性能** —— 列出大目录（数万文件）时 `list()` 响应可能较慢；本期不优化，需要时再加分页
5. **符号链接** —— `realpath` 会解析符号链接，跨盘符的链接行为未专门测试

---

## 8. 决策记录

| 决策 | 选择 | 理由 |
|---|---|---|
| 安全模型 | 仅本机 + 随机 token | 用户确认；现有 `0.0.0.0` + CORS `*` 在新增端点后是文件泄露漏洞 |
| 写入能力 | 只读 | 用户确认；本期不需写回，缩小攻击面与错误处理复杂度 |
| `file://` 支持 | 保留，渐进降级 | 满足 `CLAUDE.md` 硬性要求 |
| 目录选择 UI | 自建面板 | Brave 无原生选择器，必须自建 |
| 降级提示 | 界面显示 + 启动命令 | 用户确认；符合「禁止静默 fallback」 |