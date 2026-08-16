# dsh-interface-settings（DSH 界面设置插件）

<div align="center">

**中文** | [English](README.en.md)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Star](https://img.shields.io/github/stars/Qiongkura/dsh-interface-settings.svg)](https://github.com/Qiongkura/dsh-interface-settings/stargazers)
[![Issues](https://img.shields.io/github/issues/Qiongkura/dsh-interface-settings.svg)](https://github.com/Qiongkura/dsh-interface-settings/issues)

</div>

一个 **DeepSeek Harness 前端插件**：把「壁纸 / 区域透明 / 输入框与轨迹毛玻璃 / 模糊程度 / 启动画面」做成一站式界面设置，作为独立插件项目上传、分享，装进 DSH 即可使用。

- **不修改 DSH 源码**：所有外观都通过注入 CSS 变量与规则实现；
- **一个设置面板**：壁纸模糊、玻璃模糊、面板透明度、区域透明开关、启动画面模式；
- **与桌面端同一套技术方案**：本插件是桌面端（[dsh-desktop](https://github.com/Qiongkura/dsh-desktop)）界面定制能力的浏览器端移植。

## 功能

| 功能 | 说明 |
| --- | --- |
| 壁纸 | 图片/视频壁纸（`body::before` 伪元素层，负 z-index 不拦截输入） |
| 壁纸模糊 | 独立滑块（0-100px） |
| 输入框液态玻璃 | `composerSeat::before` + `backdrop-filter`，独立模糊滑块（最低 10px 保证文字必糊） |
| 轨迹毛玻璃 | 与输入框共用滑块；按颜色饱和度智能透明（保留时间线色条/状态标签） |
| 面板透明度 | 滑块（0-90%） |
| 区域透明开关 | 新对话 / 输入框 / 左边栏 / 主界面 |
| 启动画面 | 默认 / 跟随主题 / 自定义（图片或视频）；最小展示时长、淡出、点击跳过 |

## 开发过程

整个界面定制能力是在**真实使用场景中逐轮迭代**出来的。以下是完整过程。

### 第 1 轮：桌面端起步

最初形态是 Electron 桌面壳（[dsh-desktop](https://github.com/Qiongkura/dsh-desktop)）：
主进程探测/拉起后端（`http://127.0.0.1:3080`）、托盘常驻、关闭询问、单实例，
并把 `@deepseek-ai/dsh` 的运行时闭包打进安装包实现「双击即用」。

在这一轮，界面定制全部由**主进程注入 CSS**（`webContents.insertCSS` + `executeJavaScript`）。

### 第 2 轮：壁纸系统

需求：界面太素，想换成自己的壁纸。

- 壁纸层用 `body::before/::after` 伪元素（负 z-index、不拦截输入、不创建 JS 层）；
- `--dsh-wallpaper-url` 变量注入图片（data URL——http 页面不能直接加载 `file://`）；
- 大图先缩放到最长边 3840px 再编码（4K 屏清晰、不拖死渲染器）；
- 壁纸模糊 `filter: blur(var(--dsh-wallpaper-blur))`，独立滑块；
- 代码块透明度、四个区域透明开关、侧栏独立壁纸。

**踩坑**：
- **CSS 变量作用域**：引用主题变量（`var(--dsw-alias-*)`）的变量必须设在
  `document.body`（主题变量在 body），设在 `documentElement` 会解析失败——
  表现为「透明开关没效果」；
- **`Number(0) || 0.55` 假值**：面板透明度设 0 被 fallback 吞掉，改 `Number.isFinite`；
- **类名选择器**：`[class$='treeBody']` 不匹配 `_6-zohW_treeBody _6-zohW_wide`
  （带额外类），必须 `[class*='treeBody']`。

### 第 3 轮：视频壁纸

手机视频做壁纸（实际是视频不是图片）——注册 `dsh-wallpaper://` 特权协议：
流式返回本地文件（支持 Range，`<video>` 可 seek），
`bypassCSP/fetch/streaming` 特权让 http 页面能加载。

### 第 4 轮：液态玻璃（输入框）

输入框要有毛玻璃质感：壁纸透出 + 模糊 + 面板色，文字滚入被盖住。

- `composerSeat::before` 伪元素玻璃层：
  `backdrop-filter: blur(var(--dsh-glass-blur))` + 透明→面板色渐变（顶部 20px 丝滑过渡）；
- **专用模糊滑块**（输入框模糊）：独立于壁纸模糊——壁纸模糊 4px 时文字不糊，
  玻璃模糊最低 10px 保证文字必糊；
- 图片壁纸与视频壁纸**统一走同一套玻璃**。

### 第 5 轮：启动画面

从「启动到主界面之间空白/加载界面」到可控的启动动画，迭代了多个版本：

1. **splash 页面 + 覆盖层**：先显示独立 splash（file://），再 loadURL 切换、
   页面加载期间用覆盖层盖住 HARNESS 加载界面；
2. **问题**：`executeJavaScript` 注入覆盖层 IPC 往返 + 渲染主线程忙，
   实测比页面加载晚 600-900ms——**加载界面必然露出来**；
3. **正解**：**preload 注入**——preload 在页面脚本执行前运行，
   `documentElement` 一出现（11ms 内）就能注入，彻底盖住加载界面；
4. **单步流程**：去掉独立 splash 页（避免「视频播两遍」），
   窗口出现即由启动层承担（视频层/图片层，z-index 最大），
   主界面渲染完成 + 满足时长后淡出；
5. **时长与淡出**：滑块可调；选视频时上限自动 = 视频完整时长（ffmpeg 读 metadata）；
6. **点击跳过**：启动层点击任意位置，主界面就绪后立即进入。

**踩坑**：
- Electron 版本里 `did-dom-ready` **从不触发**，必须用 `dom-ready`；
- 覆盖层传大 data URL 慢（几百 ms），改用协议 URL（几十字节）；
- 视频素材当 CSS 背景**不能播放**——必须 `<video>` 元素；
- 启动层 z-index 必须最大（`2147483647`），否则主界面壁纸盖住它，时长形同虚设；
- 旧配置兼容：4 模式合并为 3 模式时，`image/animation` 归一化为 `custom`。

### 第 6 轮：HEVC 自动转码

手机视频（HEVC/H.265）在 Chromium 里没有可靠硬解，全屏播放卡顿。

- 读文件头尾采样识别编码（`hvc1/hev1/avc1`）；
- HEVC → ffmpeg 转 H.264（`libx264 -crf 17 -preset medium`，**画质视觉无损**），
  完成后自动使用转码版；
- 启动时也自动优先已有转码版，没有则后台转码。

### 第 7 轮：轨迹毛玻璃

轨迹视图（运行时插件，类名是 tsdown 编译的随机前缀 `rrWaNW_root` 之类）——
**类名选择器不可靠**：

- 放弃类名方案，改为**按颜色饱和度智能透明**：轮询轨迹子树，
  中性色（白/灰）背景透明让壁纸透出，彩色元素（时间线色条、状态标签）按
  饱和度判断保留；
- 教训：`* { background: transparent }` 全透明会把时间线色条也弄没。

### 第 8 轮：插件化

把以上能力从 Electron 主进程移植为**浏览器端插件**（本项目）：

- `body::before` 壁纸层、玻璃伪元素、透明变量——**同一套 CSS**，浏览器端直接注入；
- 配置从「主进程 config.json」改为浏览器端 `localStorage`；
- 启动画面从「preload 注入」改为「插件 boot 后注入」（主界面就绪后淡出）；
- 设置界面从「独立 Electron 对话框」改为「插件设置面板」（slots 注入）；
- 不依赖任何 DSH 源码修改，独立打包上传。

## 插件结构

```
src/
├── index.ts               node 侧插件入口（空 apply，注册到 Loader）
└── client/
    ├── index.ts           浏览器端 apply：读配置 → 注入壁纸/玻璃/启动层 → 注册设置面板
    ├── settings.ts        配置类型 + localStorage 持久化
    ├── wallpaper.ts       壁纸层注入（body::before + 变量）
    ├── glass.ts           液态玻璃 CSS + 区域透明变量 + 轨迹饱和度透明
    ├── splash.ts          启动画面层（视频/图片，时长/淡出/点击跳过）
    ├── SettingsPanel.tsx  设置面板组件
    ├── SettingsPanel.module.css
    └── locales.ts         中英文案
```

## 📦 环境依赖

```bash
Node.js >= 20
pnpm >= 9
DSH 仓库 checkout（deepseek-ai/deepseek-harness）
```

## 安装与使用

### 用户安装（无需 npm/pnpm，已验证）

像用量统计插件一样，把插件**拷贝**到 DSH 的 profile 目录即可（不需要 npm）：

```bash
# 1) 把整个插件目录（含 lib/client.js、lib/index.js、package.json）拷贝到：
#    ~/.dsh/profiles/node_modules/dsh-interface-settings/

# 2) 在 ~/.dsh/profiles/web/cordis.patch.yml 追加：
#    - insert:
#        - id: dsh-interface-settings
#          name: 'dsh-interface-settings'

# 3) 重启 dsh web（或重启桌面端应用；改 patch 也会热重载）
```

> ⚠️ 注意：**不要**手动替换 DSH 管理的 workspace 链接（junction/symlink），
> 否则后端装配会卡住。如果插件包在 DSH 仓库里（workspace 包），用上面的
> patch 方式启用即可；独立拷贝的包直接放进 node_modules 也行。

重启后打开「设置 → 界面设置」即可调整外观。此路径已实测：
插件进入 manifest 且 bundle 正常服务（HTTP 200）。

### 开发者（在 DSH 仓库内构建）

本插件是 DSH monorepo 的 workspace 插件（peer 依赖为 workspace 包）：

```bash
# 1) 把本项目放入 packages/client/interface-settings（或作为 workspace 包引入）
# 2) 构建浏览器端 bundle
pnpm --filter dsh-interface-settings bundle
# 3) 在 host 的 cordis.yml / 插件清单中启用该插件
```

启用后：

- 打开「设置 → 界面设置」面板调整壁纸 / 壁纸模糊 / 玻璃模糊 / 面板透明度 /
  区域透明 / 启动画面；
- 所有改动即时预览，保存后持久化（localStorage）。

## 📝 使用示例

```ts
// 浏览器端 apply：读配置 → 注入外观
const settings: InterfaceSettings = loadSettings()          // 读 localStorage
applyWallpaperLayer(settings)                               // 壁纸层
applyGlassAndTransparency(settings)                         // 玻璃 + 透明
if (settings.splashMode !== 'default') applySplashLayer(settings)  // 启动画面

// 设置面板改动即时预览并保存
saveSettings(next)
```

## ⚙️ 配置说明

配置保存在浏览器 `localStorage`（键 `dsh.interface-settings.v1`）：

| 配置项 | 说明 | 默认 |
| --- | --- | --- |
| `wallpaper` | 壁纸图片/视频（data/blob URL） | null |
| `wallpaperBlur` | 壁纸模糊 px | 18 |
| `codeAlpha` | 代码块透明度 | 0.45 |
| `transparent.*` | 新对话/输入框/侧栏/主界面 透明开关 | true |
| `glassBlur` | 输入框/轨迹玻璃模糊 px（最低 10） | 10 |
| `panelAlpha` | 面板透明度 | 0.55 |
| `splashMode` | 启动画面 default/follow/custom | default |
| `splashFile` | 自定义启动素材 | null |
| `splashDuration` | 动画时长（秒） | 0 |
| `splashFade` | 淡出时长（秒） | 0.5 |

## 🧪 测试

```bash
# 在 DSH 仓库内运行插件测试
pnpm --filter dsh-interface-settings test
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/xxx`)
3. 提交你的修改 (`git commit -m 'feat: 新增xxx功能'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 📮 联系方式

- GitHub：https://github.com/Qiongkura

## 已知限制

- 配置保存在浏览器 localStorage（无主进程配置通道）；
- 启动画面在插件加载后才出现（浏览器端无 preload 时机），首次渲染前仍是
  原生加载界面；
- 壁纸视频的编码兼容性依赖 Chromium 解码能力（HEVC 建议先转 H.264）；
- 轨迹饱和度透明每 1.5s 轮询一次，超大轨迹下有一定开销。

## 与相关项目的关系

- 桌面端完整版（含视频壁纸协议、托盘、自动转码、启动动画 preload 版）：
  [Qiongkura/dsh-desktop](https://github.com/Qiongkura/dsh-desktop)
- 底层平台：[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness)
