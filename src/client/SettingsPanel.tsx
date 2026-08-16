/**
 * 界面设置插件 —— 设置面板组件。
 *
 * 布局与功能对齐桌面端「界面设置」对话框：壁纸（主/侧栏）、模糊、
 * 输入框玻璃、面板透明度、代码块透明度、区域透明开关、启动画面
 * （模式/素材/时长/淡出）。改动即时预览，确定后持久化。
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

/** 浏览器端选择的文件只保留展示名（内容以 data URL 持久化）。 */
interface PickedNames {
  main: string | null
  sidebar: string | null
  splash: string | null
}

export function SettingsPanel({ t, close }: SettingsPanelProps) {
  const [settings, setSettings] = useState<InterfaceSettings>(() => loadSettings())
  const [names, setNames] = useState<PickedNames>({ main: null, sidebar: null, splash: null })

  const applyAll = useCallback((s: InterfaceSettings) => {
    applyWallpaperLayer(s)
    applyGlassAndTransparency(s)
    if (s.splashMode !== 'default') applySplashLayer(s)
  }, [])

  const update = useCallback((patch: Partial<InterfaceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      // 即时预览（启动画面在确定时应用，避免拖动过程叠层）
      applyWallpaperLayer(next)
      applyGlassAndTransparency(next)
      return next
    })
  }, [])

  const updateTransparent = (key: keyof InterfaceSettings['transparent'], checked: boolean) => {
    update({ transparent: { ...settings.transparent, [key]: checked } })
  }

  /** 选择本地图片（转 data URL 持久化，浏览器端安全限制内）。 */
  const pickFile = (accept: string, onData: (dataUrl: string) => void, onName: (name: string) => void) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      onName(file.name)
      const reader = new FileReader()
      reader.onload = () => onData(String(reader.result))
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const ok = () => {
    saveSettings(settings)
    applyAll(settings)
    close()
  }

  const cancel = () => {
    // 丢弃草稿：恢复已保存的设置（撤销预览）
    applyAll(loadSettings())
    close()
  }

  const reset = () => {
    setNames({ main: null, sidebar: null, splash: null })
    setSettings(DEFAULT_SETTINGS)
    applyAll(DEFAULT_SETTINGS)
  }

  const cls = (on: boolean): string => (on ? `${css.segbtn ?? ''} ${css.on ?? ''}` : css.segbtn ?? '')

  return (
    <div className={css.panel}>
      <div className={css.imgrow}>
        <span className={css.label}>{t('mainImage')}</span>
        <span className={css.imgname}>{names.main ?? (settings.wallpaper === null ? t('none') : t('set'))}</span>
        <button className={css.smallbtn} onClick={() => pickFile(
          'image/*',
          d => update({ wallpaper: d }),
          n => setNames(p => ({ ...p, main: n })),
        )}>
          {t('choose')}
        </button>
        <button className={css.smallbtn} onClick={() => {
          setNames(p => ({ ...p, main: null }))
          update({ wallpaper: null })
        }}>
          {t('clear')}
        </button>
      </div>

      <div className={css.row}>
        <span className={css.label}>{t('sidebarMode')}</span>
        <div className={css.seg}>
          <button className={cls(settings.sidebarWallpaper === null)}
            onClick={() => update({ sidebarWallpaper: null })}>
            {t('sidebarShared')}
          </button>
          <button className={cls(settings.sidebarWallpaper !== null)}
            onClick={() => update({ sidebarWallpaper: settings.wallpaper })}>
            {t('sidebarSep')}
          </button>
        </div>
      </div>
      {settings.sidebarWallpaper !== null && (
        <div className={css.imgrow}>
          <span className={css.label}>{t('sidebarImage')}</span>
          <span className={css.imgname}>{names.sidebar ?? t('set')}</span>
          <button className={css.smallbtn} onClick={() => pickFile(
            'image/*',
            d => update({ sidebarWallpaper: d }),
            n => setNames(p => ({ ...p, sidebar: n })),
          )}>
            {t('choose')}
          </button>
          <button className={css.smallbtn} onClick={() => {
            setNames(p => ({ ...p, sidebar: null }))
            update({ sidebarWallpaper: null })
          }}>
            {t('clear')}
          </button>
        </div>
      )}
      <div className={css.desc}>{t('sidebarDesc')}</div>

      <div className={css.row}>
        <span className={css.label}>{t('blur')}</span>
        <input type="range" min={0} max={64} step={1} value={settings.wallpaperBlur}
          onChange={e => update({ wallpaperBlur: Number(e.target.value) })} />
        <span className={css.val}>{settings.wallpaperBlur}px</span>
      </div>
      <div className={css.desc}>{t('blurDesc')}</div>

      <div className={css.row}>
        <span className={css.label}>{t('glassBlur')}</span>
        <input type="range" min={0} max={64} step={1} value={settings.glassBlur}
          onChange={e => update({ glassBlur: Number(e.target.value) })} />
        <span className={css.val}>{settings.glassBlur}px</span>
      </div>
      <div className={css.desc}>{t('glassBlurDesc')}</div>

      <div className={css.row}>
        <span className={css.label}>{t('panelAlpha')}</span>
        <input type="range" min={0} max={90} step={1} value={Math.round(settings.panelAlpha * 100)}
          onChange={e => update({ panelAlpha: Number(e.target.value) / 100 })} />
        <span className={css.val}>{Math.round(settings.panelAlpha * 100)}%</span>
      </div>
      <div className={css.desc}>{t('panelAlphaDesc')}</div>

      <div className={css.row}>
        <span className={css.label}>{t('codeAlpha')}</span>
        <input type="range" min={8} max={100} step={1} value={Math.round(settings.codeAlpha * 100)}
          onChange={e => update({ codeAlpha: Number(e.target.value) / 100 })} />
        <span className={css.val}>{Math.round(settings.codeAlpha * 100)}%</span>
      </div>
      <div className={css.desc}>{t('codeAlphaDesc')}</div>

      <div className={css.row}>
        <span className={css.label}>{t('transparent')}</span>
        <div className={css.checks}>
          {(['newSession', 'input', 'sidebar', 'main'] as const).map(key => (
            <label key={key} className={css.check}>
              <input type="checkbox" checked={settings.transparent[key]}
                onChange={e => updateTransparent(key, e.target.checked)} />
              <span>{t(`transparent.${key}`)}</span>
            </label>
          ))}
        </div>
      </div>

      <div className={css.row}>
        <span className={css.label}>{t('splashMode')}</span>
        <div className={css.seg}>
          {(['default', 'follow', 'custom'] as const).map(mode => (
            <button key={mode} className={cls(settings.splashMode === mode)}
              onClick={() => update({ splashMode: mode })}>
              {t(`splashMode.${mode}`)}
            </button>
          ))}
        </div>
      </div>
      {settings.splashMode === 'custom' && (
        <div className={css.imgrow}>
          <span className={css.label}>{t('splashPick')}</span>
          <span className={css.imgname}>{names.splash ?? (settings.splashFile === null ? t('none') : t('set'))}</span>
          <button className={css.smallbtn} onClick={() => pickFile(
            'image/*',
            d => update({ splashFile: d }),
            n => setNames(p => ({ ...p, splash: n })),
          )}>
            {t('pick')}
          </button>
          <button className={css.smallbtn} onClick={() => {
            setNames(p => ({ ...p, splash: null }))
            update({ splashFile: null })
          }}>
            {t('clear')}
          </button>
        </div>
      )}

      <div className={css.row}>
        <span className={css.label}>{t('duration')}</span>
        <input type="range" min={0} max={10} step={0.5} value={settings.splashDuration}
          onChange={e => update({ splashDuration: Number(e.target.value) })} />
        <span className={css.val}>{settings.splashDuration === 0 ? t('durationZero') : `${settings.splashDuration} 秒`}</span>
      </div>
      <div className={css.desc}>{t('durationDesc')}</div>

      <div className={css.row}>
        <span className={css.label}>{t('fade')}</span>
        <input type="range" min={0} max={2} step={0.1} value={settings.splashFade}
          onChange={e => update({ splashFade: Number(e.target.value) })} />
        <span className={css.val}>{settings.splashFade === 0 ? t('fadeZero') : `${settings.splashFade} 秒`}</span>
      </div>
      <div className={css.desc}>{t('fadeDesc')}</div>

      <div className={css.footer}>
        <button className={`${css.btn} ${css.btnGhost}`} onClick={reset}>{t('reset')}</button>
        <button className={`${css.btn} ${css.btnGhost}`} onClick={cancel}>{t('cancel')}</button>
        <button className={`${css.btn} ${css.btnPrimary}`} onClick={ok}>{t('ok')}</button>
      </div>
    </div>
  )
}
