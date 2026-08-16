/**
 * 液态玻璃与区域透明。
 *
 * 输入框玻璃：composerSeat::before + backdrop-filter + 面板色渐变（最低 10px 保证文字必糊）。
 * 轨迹玻璃：按颜色饱和度智能透明——中性色（白/灰）背景透明让壁纸透出，
 * 彩色元素（时间线色条/状态标签）按饱和度判断保留（插件类名是编译随机前缀，不可依赖）。
 */
import type { InterfaceSettings } from './settings.ts'

export function applyGlassAndTransparency(settings: InterfaceSettings): void {
  const t = settings.transparent
  document.body.style.setProperty('--dsh-glass-blur', `${Math.max(10, settings.glassBlur)}px`)
  document.body.style.setProperty('--dsh-t-new-session', t.newSession ? 'transparent' : '')
  document.body.style.setProperty('--dsh-t-input', t.input ? 'transparent' : '')
  document.body.style.setProperty('--dsh-t-sidebar', t.sidebar ? 'transparent' : '')
  document.body.style.setProperty('--dsh-t-main', t.main ? 'transparent' : '')

  injectGlassCss()
  startTrajectoryTransparentizer()
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
