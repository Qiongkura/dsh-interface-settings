/**
 * 界面设置插件 —— 持久化配置。
 * 桌面端（dsh-desktop 壳内）：配置由 Electron 主进程持有并应用，经
 * `window.dshInterfaceSettings` 桥读写（含视频壁纸/视频声音）；
 * 纯 web 环境：使用 localStorage 保存（浏览器端无主进程配置通道）。
 */

/** 桌面端桥（dsh-desktop preload 注入）。 */
export interface DesktopBridge {
  /** 读取当前配置（同步）。 */
  get(): InterfaceSettings
  /** 预览（应用但不保存）。 */
  preview(settings: InterfaceSettings): void
  /** 确定（应用并保存）。 */
  commit(settings: InterfaceSettings): void
  /** 原生文件选择：wallpaper / wallpaper-video / sidebar / splash。 */
  pick(kind: 'wallpaper' | 'wallpaper-video' | 'sidebar' | 'splash'):
  Promise<{ file: string; name: string; isVideo: boolean } | null>
  /** 清除某项（壁纸 / 视频壁纸 / 侧栏 / 启动素材）。 */
  clear(kind: 'wallpaper' | 'wallpaper-video' | 'sidebar' | 'splash'): void
  /** 启动画面视频时长上限（秒）；当前启动素材不是视频时返回 null。 */
  splashDurationMax(): Promise<number | null>
}

declare global {
  interface Window {
    dshInterfaceSettings?: DesktopBridge
  }
}

/** 桌面端桥可用（运行在 dsh-desktop 壳内时）。 */
export const hasDesktopBridge = (): boolean =>
  typeof window !== 'undefined' && typeof window.dshInterfaceSettings === 'object'
    && window.dshInterfaceSettings !== null

export interface InterfaceSettings {
  /** 壁纸图片路径（桌面端：文件路径；纯 web：data: URL） */
  wallpaper: string | null
  /** 壁纸模糊 px */
  wallpaperBlur: number
  /** 代码块透明度 0.08-1 */
  codeAlpha: number
  /** 侧栏独立壁纸（共用主图时为 null） */
  sidebarWallpaper: string | null
  /** 区域透明开关 */
  transparent: {
    newSession: boolean
    input: boolean
    sidebar: boolean
    main: boolean
  }
  /** 输入框/轨迹玻璃模糊 px（最低 10） */
  glassBlur: number
  /** 面板透明度 0-1 */
  panelAlpha: number
  /** 工具调用行渐变 0-100（0=全黑，50=半白半黑，100=全白） */
  toolGray: number
  /** 启动画面模式：default / follow / custom */
  splashMode: 'default' | 'follow' | 'custom'
  /** 自定义启动素材（图片） */
  splashFile: string | null
  /** 启动画面最小展示秒数 */
  splashDuration: number
  /** 启动画面淡出秒数 */
  splashFade: number
  /** 视频壁纸路径（桌面端独有；纯 web 环境恒 null） */
  videoWallpaper: string | null
  /** 视频壁纸声音开关（桌面端独有） */
  videoSound: boolean
}

const KEY = 'dsh.interface-settings.v1'

export const DEFAULT_SETTINGS: InterfaceSettings = {
  wallpaper: null,
  wallpaperBlur: 18,
  codeAlpha: 0.45,
  sidebarWallpaper: null,
  transparent: { newSession: true, input: true, sidebar: true, main: true },
  glassBlur: 10,
  panelAlpha: 0.55,
  toolGray: 50,
  splashMode: 'default',
  splashFile: null,
  splashDuration: 0,
  splashFade: 0.5,
  videoWallpaper: null,
  videoSound: false,
}

/** 合并默认值（含嵌套 transparent）。 */
function merge(raw: Partial<InterfaceSettings>): InterfaceSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    transparent: { ...DEFAULT_SETTINGS.transparent, ...(raw.transparent ?? {}) },
  }
}

export function loadSettings(): InterfaceSettings {
  if (hasDesktopBridge()) {
    try {
      const bridge = window.dshInterfaceSettings
      if (bridge) return merge(bridge.get() as Partial<InterfaceSettings>)
    } catch { /* 主进程未就绪时回退 localStorage */ }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }
    return merge(JSON.parse(raw) as Partial<InterfaceSettings>)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: InterfaceSettings): void {
  if (hasDesktopBridge()) {
    window.dshInterfaceSettings?.commit(settings)
    return
  }
  localStorage.setItem(KEY, JSON.stringify(settings))
}

/** 预览（应用但不保存）；桌面端由主进程应用，纯 web 由调用方 DOM 应用。 */
export function previewSettings(settings: InterfaceSettings): void {
  if (hasDesktopBridge()) window.dshInterfaceSettings?.preview(settings)
}
