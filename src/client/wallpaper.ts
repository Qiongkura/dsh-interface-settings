/**
 * 壁纸层注入。
 *
 * 用 `body::before/::after` 伪元素做壁纸层（负 z-index、不拦截输入），
 * 通过 CSS 变量驱动；图片用 data URL（浏览器端安全限制内）。
 */
import type { InterfaceSettings } from './settings.ts'

/** 注入壁纸与面板变量。 */
export function applyWallpaperLayer(settings: InterfaceSettings): void {
  // 数值类变量（模糊/透明度/面板色/代码块等）统一由 glass.ts applyVars 设置
  if (settings.wallpaper === null) {
    document.body.style.removeProperty('--dsh-wallpaper-url')
  } else {
    document.body.style.setProperty('--dsh-wallpaper-url', `url("${settings.wallpaper}")`)
  }
  if (settings.sidebarWallpaper === null) {
    document.body.style.removeProperty('--dsh-wallpaper-url-sidebar')
  } else {
    document.body.style.setProperty('--dsh-wallpaper-url-sidebar', `url("${settings.sidebarWallpaper}")`)
  }
  injectWallpaperCss()
}

let injected = false

/** 幂等注入壁纸与面板 CSS（只注入一次，变量后续变化即时生效）。 */
export function injectWallpaperCss(): void {
  if (injected) return
  injected = true
  const style = document.createElement('style')
  style.id = 'dsh-interface-settings'
  style.textContent = `
    html { background: transparent !important; }
    body { background: transparent !important; }
    body::before, body::after {
      content: '' !important;
      position: fixed !important;
      top: 0 !important;
      height: 100vh !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background-position: center !important;
      background-size: cover !important;
      background-repeat: no-repeat !important;
    }
    body::before {
      left: 0 !important;
      right: 0 !important;
      background-image: var(--dsh-wallpaper-url) !important;
      filter: blur(var(--dsh-wallpaper-blur, 18px)) !important;
    }
    /* 侧栏独立壁纸（共用主图时不显示这层） */
    body::after {
      left: 0 !important;
      width: 280px !important;
      background-image: var(--dsh-wallpaper-url-sidebar, none) !important;
      filter: blur(var(--dsh-wallpaper-blur, 18px)) !important;
    }
    /* 面板半透明 + 区域透明变量 */
    #root [data-slot='root'] > div,
    #root [data-slot='root'] > div > div { background: transparent !important; }
    #root [data-slot='root'] > div > div > [data-slot] > div {
      background: var(--dsh-wallpaper-panel, rgba(255,255,255,0.55)) !important;
    }
    #root [data-slot='root'] > div > div:first-child > [data-slot] > div {
      background: var(--dsh-wallpaper-panel-sidebar, var(--dsh-wallpaper-panel, rgba(255,255,255,0.55))) !important;
    }
  `
  document.head.appendChild(style)
}
