/**
 * 壁纸层注入。
 *
 * 用 `body::before/::after` 伪元素做壁纸层（负 z-index、不拦截输入），
 * 通过 CSS 变量驱动；图片用 data/blob URL，视频由 `<video>` 元素承担。
 */
import type { InterfaceSettings } from './settings.ts'

/** 注入壁纸（图片/视频）。 */
export function applyWallpaperLayer(settings: InterfaceSettings): void {
  if (settings.wallpaper === null) {
    document.body.style.removeProperty('--dsh-wallpaper-url')
    return
  }
  document.body.style.setProperty('--dsh-wallpaper-url', `url("${settings.wallpaper}")`)
  document.body.style.setProperty('--dsh-wallpaper-blur', `${settings.wallpaperBlur}px`)
  document.body.style.setProperty('--dsh-wallpaper-panel-alpha', String(settings.panelAlpha))
  document.body.style.setProperty('--dsh-wallpaper-code-alpha', String(settings.codeAlpha))
  injectWallpaperCss()
}

let injected = false

/** 幂等注入壁纸与玻璃 CSS（只注入一次，变量后续变化即时生效）。 */
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
  `
  document.head.appendChild(style)
}
