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
| 壁纸 | 图片壁纸（`body::before` 伪元素层，负 z-index 不拦截输入） |
| 视频壁纸 | 桌面端独有：主进程经 `dsh-wallpaper://` 协议流式播放（HEVC 自动转 H.264） |
| 视频声音 | 可选播放壁纸视频的声音 |
| 侧栏壁纸 | 与主界面共用 / 单独设置独立图片 |
| 壁纸模糊 | 独立滑块（0-64px） |
| 输入框液态玻璃 | `composerSeat::before` + `backdrop-filter`，独立模糊滑块（0-64px） |
| 轨迹毛玻璃 | 与输入框共用滑块；按颜色饱和度智能透明（保留时间线色条/状态标签） |
| 面板透明度 | 滑块（0-90%） |
| 代码块透明度 | 滑块（8-100%），含代码块标题栏与行内代码 |
| 区域透明开关 | 新对话 / 输入框 / 左边栏 / 主界面 |
| 启动画面 | 默认 / 跟随主题 / 自定义（图片或视频）；最小展示时长、淡出、点击跳过 |

## 桌面端桥接（dsh-desktop 0.2.0）

在 [dsh-desktop](https://github.com/Qiongkura/dsh-desktop) 壳内运行时，插件自动启用桌面端桥
（`window.dshInterfaceSettings`，由桌面 preload 注入）：

- 设置面板与主进程共用同一份 Electron 配置，由主进程应用（含视频壁纸/视频声音等桌面独有能力）；
- 文件选择走原生对话框（支持视频；HEVC 自动转码）；
- 启动素材为视频时，动画时长滑块上限自动 = 视频完整时长；
- 纯 web 环境自动回退为插件自管（localStorage + DOM 注入），功能不变。

## 开发过程

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

> 也可直接下载 [Release 包](https://github.com/Qiongkura/dsh-interface-settings/releases/latest)
> （`dsh-interface-settings-0.2.0.tgz`），解压后按上面 1) 拷贝
> `package/` 目录内容即可，同样无需 npm。

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
| `wallpaper` | 壁纸图片（纯 web：data URL；桌面端：路径） | null |
| `videoWallpaper` | 视频壁纸路径（桌面端独有） | null |
| `videoSound` | 视频壁纸声音 | false |
| `wallpaperBlur` | 壁纸模糊 px | 18 |
| `sidebarWallpaper` | 侧栏独立壁纸（null = 共用主图） | null |
| `codeAlpha` | 代码块透明度 | 0.45 |
| `transparent.*` | 新对话/输入框/侧栏/主界面 透明开关 | true |
| `glassBlur` | 输入框/轨迹玻璃模糊 px（0-64） | 10 |
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
- 微信：Qiongkura

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
