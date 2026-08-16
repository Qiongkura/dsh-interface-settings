/**
 * 液态玻璃、区域透明与代码块透明度 —— 与桌面端 applyVars 同源逻辑。
 *
 * 所有变量必须设在 document.body 上：值里引用 var(--dsw-alias-*) 等主题变量，
 * 主题变量定义在 body，设在 html 上会解析失败导致开关失效。
 *
 * 输入框玻璃：composerSeat::before + backdrop-filter + 面板色渐变（最低 10px 保证文字必糊）。
 * 轨迹玻璃：按颜色饱和度智能透明——中性色（白/灰）背景透明让壁纸透出，
 * 彩色元素（时间线色条/状态标签）按饱和度判断保留（插件类名是编译随机前缀，不可依赖）。
 */
import type { InterfaceSettings } from './settings.ts'

export function applyGlassAndTransparency(settings: InterfaceSettings): void {
  applyVars(settings)
  injectGlassCss()
  startTrajectoryTransparentizer()
}

/** 重新应用全部透明/颜色变量（设置面板保存后调用，可重复执行）。 */
export function applyVars(settings: InterfaceSettings): void {
  const isDark =
    document.body.hasAttribute('data-ds-dark-theme') ||
    (getComputedStyle(document.documentElement).colorScheme || 'light') === 'dark'
  const T = settings.transparent

  const alphaRaw = settings.codeAlpha
  const alpha = Number.isFinite(alphaRaw) ? Math.max(0.08, Math.min(1, alphaRaw)) : 0.45
  const paRaw = settings.panelAlpha
  const pa = Number.isFinite(paRaw) ? Math.max(0, Math.min(1, paRaw)) : 0.55
  const panelColor = isDark ? `rgba(12,15,22,${pa})` : `rgba(255,255,255,${pa})`

  // 壁纸模糊与面板半透明强度
  document.body.style.setProperty('--dsh-wallpaper-blur', `${settings.wallpaperBlur}px`)
  document.body.style.setProperty('--dsh-wallpaper-panel-alpha', `${pa}`)
  document.body.style.setProperty('--dsh-wallpaper-code-alpha', `${alpha}`)
  // 输入框液态玻璃专用模糊（独立滑杆控制，0-64 与桌面端一致）
  document.body.style.setProperty('--dsh-glass-blur', `${Math.max(0, Math.min(64, settings.glassBlur))}px`)

  // 主界面面板：透明=半透明面板色；不透明=主题基底色
  document.body.style.setProperty('--dsh-wallpaper-panel', T.main ? panelColor : 'var(--dsw-alias-bg-base)')
  // 侧栏面板：独立开关
  document.body.style.setProperty(
    '--dsh-wallpaper-panel-sidebar',
    T.sidebar ? panelColor : isDark ? 'var(--dsw-static-neutral-bluish-900)' : 'var(--dsw-static-neutral-bluish-50)',
  )
  // 面板前景（标题栏文字/边框/悬停）：跟随外观明暗，与面板色同源
  document.documentElement.style.setProperty('--dsh-wallpaper-panel-fg', isDark ? 'rgba(249,250,251,0.92)' : 'rgba(15,17,21,0.92)')
  document.documentElement.style.setProperty('--dsh-wallpaper-panel-border', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')
  document.documentElement.style.setProperty('--dsh-wallpaper-panel-hover', isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)')
  // 输入框卡片（含"新会话"英雄卡片）
  document.body.style.setProperty(
    '--dsw-specific-input-major',
    T.input ? 'transparent' : isDark ? 'var(--dsw-static-neutral-bluish-850)' : 'var(--dsw-static-neutral-bluish-00)',
  )
  // 侧栏"新对话"按钮
  document.body.style.setProperty('--dsh-t-new-session', T.newSession ? 'transparent' : 'var(--dsw-alias-button-elevated-fill)')
  // 侧栏滚动渐隐终点色：保持透明（让背景透出），不随开关恢复
  document.body.style.setProperty('--dsw-specific-sidebar-fill', 'transparent')
  // 代码块/行内代码透明度
  document.body.style.setProperty('--dsw-alias-markdown-code-block', isDark ? `rgba(12,15,22,${alpha})` : `rgba(255,255,255,${alpha})`)
  document.body.style.setProperty(
    '--dsw-alias-markdown-code-block-banner',
    isDark ? `rgba(20,24,34,${alpha})` : `rgba(250,251,252,${alpha})`,
  )
  document.body.style.setProperty('--dsw-alias-markdown-inline-code', isDark ? `rgba(35,38,43,${alpha})` : `rgba(239,240,243,${alpha})`)
}

let glassInjected = false

function injectGlassCss(): void {
  if (glassInjected) return
  glassInjected = true
  const style = document.createElement('style')
  style.id = 'dsh-interface-settings-glass'
  style.textContent = `
    /* 输入框液态玻璃 */
    #root [class*='composerSeat'] {
      background: transparent !important;
    }
    #root [class*='composerSeat']::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      bottom: 0 !important;
      left: 50% !important;
      right: auto !important;
      width: min(800px, calc(100% - 32px)) !important;
      transform: translateX(-50%) !important;
      border-radius: 22px !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background: linear-gradient(to bottom,
        transparent 0px,
        rgba(255,255,255,calc(var(--dsh-wallpaper-panel-alpha, 0.55))) 20px) !important;
      backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
      -webkit-backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
    }
    /* 侧栏新对话按钮透明开关 */
    #root [class*='newSession'] {
      background: var(--dsh-t-new-session, transparent) !important;
    }
    /* 轨迹视图液态玻璃（根元素 + 面板色 22% 低透明） */
    #root [data-conversation-composer-overlay] {
      background: linear-gradient(to bottom,
        transparent 0px,
        rgba(255,255,255,0.22) 24px) !important;
      backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
      -webkit-backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
    }
  `
  document.head.appendChild(style)
}

/** 轨迹内部中性背景智能透明（轮询处理新渲染元素）。 */
function startTrajectoryTransparentizer(): void {
  const isNeutral = (bg: string): boolean => {
    const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg)
    if (m === null) return false
    const r = +(m[1] ?? 0), g = +(m[2] ?? 0), b = +(m[3] ?? 0)
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    return max === 0 ? true : (max - min) / max < 0.22
  }
  const apply = (): void => {
    const root = document.querySelector('[data-conversation-composer-overlay]')
    if (root === null) return
    for (const el of root.querySelectorAll('*')) {
      const el2 = el as HTMLElement
      if ((el2 as unknown as Record<string, boolean>).__dshT) continue
      const bg = getComputedStyle(el2).backgroundColor
      if (bg !== 'rgba(0, 0, 0, 0)' && isNeutral(bg)) {
        el2.style.setProperty('background-color', 'transparent', 'important')
        ;(el2 as unknown as Record<string, boolean>).__dshT = true
      }
    }
  }
  apply()
  setInterval(apply, 1500)
}
