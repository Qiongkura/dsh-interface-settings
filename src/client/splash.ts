/**
 * 启动画面层（浏览器端实现）。
 *
 * boot 就绪（插件加载）后立即注入全屏启动层（z-index 最大）：
 *  - 自定义图片：全屏 div + 背景图（主色兜底，无黑屏）；
 *  - 自定义视频：全屏 <video>（自动播放）；
 *  - 跟随主题：复用壁纸层。
 * 主界面渲染完成（输入框出现）且满足最小展示时长后淡出移除；点击可跳过。
 */
import type { InterfaceSettings } from './settings.ts'

export function applySplashLayer(settings: InterfaceSettings): void {
  const start = Date.now()
  const minMs = Math.max(0, settings.splashDuration * 1000)
  const fadeMs = Math.max(0, settings.splashFade * 1000)
  const media = settings.splashMode === 'custom'
    ? settings.splashFile
    : settings.wallpaper

  const tryInject = (): void => {
    if (!document.documentElement) {
      setTimeout(tryInject, 5)
      return
    }
    const isVideo = media !== null && /\.(mp4|m4v|webm|mov|ogv)(\?|#|$)/i.test(media)
    const el = document.createElement(isVideo ? 'video' : 'div')
    el.id = 'dsh-splash-layer'
    el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#101318'
    if (isVideo) {
      const v = el as HTMLVideoElement
      v.src = media as string
      v.autoplay = true
      v.loop = true
      v.muted = true
      v.playsInline = true
      v.style.cssText += ';width:100%;height:100%;object-fit:cover'
    } else if (media !== null) {
      el.style.background = `#101318 url("${media}") center/cover no-repeat`
    }
    document.documentElement.appendChild(el)

    let skip = false
    el.addEventListener('click', () => { skip = true })

    let tries = 0
    let fading = false
    const iv = setInterval(() => {
      tries++
      const ready = document.querySelector('[class*="composerSeat"]') !== null
        || document.querySelector('textarea') !== null
        || document.querySelector('[contenteditable="true"]') !== null
      const elapsed = Date.now() - start
      if (!fading && ((ready && (elapsed >= minMs || skip)) || tries > 400)) {
        clearInterval(iv)
        fading = true
        el.style.transition = `opacity ${fadeMs}ms ease`
        el.style.opacity = '0'
        setTimeout(() => { el.remove() }, fadeMs)
      }
    }, 50)
  }
  tryInject()
}
