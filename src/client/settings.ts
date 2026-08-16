/**
 * 界面设置插件 —— 持久化配置。
 * 使用 localStorage 保存（浏览器端无主进程配置通道）。
 */

export interface InterfaceSettings {
  /** 壁纸图片/视频路径（blob: URL 或 data: URL） */
  wallpaper: string | null
  /** 壁纸模糊 px */
  wallpaperBlur: number
  /** 代码块透明度 0.08-1 */
  codeAlpha: number
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
  /** 启动画面模式：default / follow / custom */
  splashMode: 'default' | 'follow' | 'custom'
  /** 自定义启动素材（图片或视频） */
  splashFile: string | null
  /** 启动画面最小展示秒数 */
  splashDuration: number
  /** 启动画面淡出秒数 */
  splashFade: number
}

const KEY = 'dsh.interface-settings.v1'

export const DEFAULT_SETTINGS: InterfaceSettings = {
  wallpaper: null,
  wallpaperBlur: 18,
  codeAlpha: 0.45,
  transparent: { newSession: true, input: true, sidebar: true, main: true },
  glassBlur: 10,
  panelAlpha: 0.55,
  splashMode: 'default',
  splashFile: null,
  splashDuration: 0,
  splashFade: 0.5,
}

export function loadSettings(): InterfaceSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<InterfaceSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      transparent: { ...DEFAULT_SETTINGS.transparent, ...(parsed.transparent ?? {}) },
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: InterfaceSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings))
}
