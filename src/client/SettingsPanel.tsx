/**
 * 界面设置插件 —— 设置面板组件。
 * 滑块/开关直接改本地配置并即时应用（预览），保存持久化。
 */
import { useCallback, useState } from 'react'
import { type InterfaceSettingsKey } from './locales.ts'
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type InterfaceSettings } from './settings.ts'
import { applyWallpaperLayer } from './wallpaper.ts'
import { applyGlassAndTransparency } from './glass.ts'
import { applySplashLayer } from './splash.ts'
import css from './SettingsPanel.module.css'

/** 翻译函数（locale 绑定）。 */
export type Translate = (key: InterfaceSettingsKey, params?: Record<string, string | number>) => string

export interface SettingsPanelInjected {
  t: Translate
}

export type SettingsPanelProps = SettingsPanelInjected & {
  /** 关闭设置面板（settings.section owner props 提供） */
  close: () => void
}

export function SettingsPanel({ t }: SettingsPanelProps) {
  const [settings, setSettings] = useState<InterfaceSettings>(() => loadSettings())

  const update = useCallback((patch: Partial<InterfaceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      // 即时预览
      applyWallpaperLayer(next)
      applyGlassAndTransparency(next)
      if (next.splashMode !== 'default') applySplashLayer(next)
      return next
    })
  }, [])

  const save = () => saveSettings(settings)

  /** 选择本地图片作为壁纸（转 data URL 持久化，浏览器端安全限制内）。 */
  const pickWallpaper = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => update({ wallpaper: String(reader.result) })
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const wallpaperName = settings.wallpaper === null
    ? ''
    : `${settings.wallpaper.slice(0, 24)}…`

  return (
    <div className={css.panel}>
      <h3>{t('title')}</h3>
      <div className={css.row}>
        <span>{t('wallpaperPick')}</span>
        <button onClick={pickWallpaper}>{t('choose')}</button>
        {settings.wallpaper !== null && (
          <button onClick={() => update({ wallpaper: null })}>{t('clear')}</button>
        )}
        <span className={css.name}>{wallpaperName}</span>
      </div>
      <label className={css.row}>
        <span>{t('wallpaper')}</span>
        <input type="range" min={0} max={100} value={settings.wallpaperBlur}
          onChange={e => update({ wallpaperBlur: Number(e.target.value) })} />
        <span>{settings.wallpaperBlur}px</span>
      </label>
      <label className={css.row}>
        <span>{t('glassBlur')}</span>
        <input type="range" min={10} max={60} value={settings.glassBlur}
          onChange={e => update({ glassBlur: Number(e.target.value) })} />
        <span>{settings.glassBlur}px</span>
      </label>
      <label className={css.row}>
        <span>{t('panelAlpha')}</span>
        <input type="range" min={0} max={90} value={Math.round(settings.panelAlpha * 100)}
          onChange={e => update({ panelAlpha: Number(e.target.value) / 100 })} />
        <span>{Math.round(settings.panelAlpha * 100)}%</span>
      </label>
      <div className={css.row}>
        <span>{t('transparent')}</span>
        {(['newSession', 'input', 'sidebar', 'main'] as const).map(key => (
          <label key={key} className={css.check}>
            <input type="checkbox" checked={settings.transparent[key]}
              onChange={e => update({
                transparent: { ...settings.transparent, [key]: e.target.checked },
              })} />
            {t(`transparent.${key}`)}
          </label>
        ))}
      </div>
      <div className={css.row}>
        <span>{t('splashMode')}</span>
        {(['default', 'follow', 'custom'] as const).map(mode => (
          <button key={mode} className={settings.splashMode === mode ? css.on : undefined}
            onClick={() => update({ splashMode: mode })}>
            {t(`splashMode.${mode}`)}
          </button>
        ))}
      </div>
      <button className={css.save} onClick={save}>{t('save')}</button>
    </div>
  )
}

void DEFAULT_SETTINGS
