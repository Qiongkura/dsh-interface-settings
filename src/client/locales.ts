/**
 * 界面设置插件 —— 文案（中/英）。
 */

export const NS = 'interface-settings'

const zh = {
  title: '界面设置',
  wallpaperPick: '壁纸图片',
  choose: '选择…',
  clear: '清除',
  wallpaper: '壁纸模糊',
  glassBlur: '输入框/轨迹模糊',
  panelAlpha: '面板透明度',
  transparent: '区域透明',
  'transparent.newSession': '新对话',
  'transparent.input': '输入框',
  'transparent.sidebar': '左边栏',
  'transparent.main': '主界面',
  splashMode: '启动画面',
  'splashMode.default': '默认',
  'splashMode.follow': '跟随主题',
  'splashMode.custom': '自定义',
  save: '保存',
} as const

const en: Record<keyof typeof zh, string> = {
  title: 'Interface Settings',
  wallpaperPick: 'Wallpaper image',
  choose: 'Choose…',
  clear: 'Clear',
  wallpaper: 'Wallpaper blur',
  glassBlur: 'Glass blur',
  panelAlpha: 'Panel opacity',
  transparent: 'Transparency',
  'transparent.newSession': 'New session',
  'transparent.input': 'Composer',
  'transparent.sidebar': 'Sidebar',
  'transparent.main': 'Main',
  splashMode: 'Splash screen',
  'splashMode.default': 'Default',
  'splashMode.follow': 'Follow theme',
  'splashMode.custom': 'Custom',
  save: 'Save',
}

export type InterfaceSettingsKey = keyof typeof zh

export { zh, en }
