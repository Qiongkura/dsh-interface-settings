/**
 * 界面设置插件 —— 设置面板组件。
 *
 * 布局与功能对齐桌面端「界面设置」对话框：壁纸（主/侧栏）、模糊、
 * 输入框玻璃、面板透明度、代码块透明度、区域透明开关、启动画面
 * （模式/素材/时长/淡出）。改动即时预览，确定后持久化。
 */
import { useCallback, useEffect, useState } from 'react'
import { type InterfaceSettingsKey } from './locales.ts'
import {
  DEFAULT_SETTINGS, hasDesktopBridge, loadSettings, previewSettings, saveSettings, type InterfaceSettings,
} from './settings.ts'
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
  video: string | null
  sidebar: string | null
  splash: string | null
}

export function SettingsPanel({ t, close }: SettingsPanelProps) {
  const [settings, setSettings] = useState<InterfaceSettings>(() => loadSettings())
  const [names, setNames] = useState<PickedNames>({ main: null, video: null, sidebar: null, splash: null })
  // 启动画面视频时长上限（秒）；无视频素材时为 null（滑块保持默认 10 秒上限）
  const [durationMax, setDurationMax] = useState<number | null>(null)

  // 启动素材/模式变化时向主进程查询视频完整时长，动画时长滑块上限自动扩容
  useEffect(() => {
    if (!hasDesktopBridge()) {
      setDurationMax(null)
      return
    }
    let cancelled = false
    window.dshInterfaceSettings?.splashDurationMax()
      .then((max) => { if (!cancelled) setDurationMax(max) })
      .catch(() => { if (!cancelled) setDurationMax(null) })
    return () => { cancelled = true }
  }, [settings.splashFile, settings.videoWallpaper, settings.splashMode])

  // 素材切换后若当前时长超过新上限，自动钳制
  useEffect(() => {
    if (durationMax !== null && settings.splashDuration > durationMax) {
      update({ splashDuration: durationMax })
    }
  }, [durationMax])

  const applyAll = useCallback((s: InterfaceSettings) => {
    if (hasDesktopBridge()) {
      // 桌面端：由主进程应用（含视频壁纸/视频声音），插件不做 DOM 注入
      previewSettings(s)
      return
    }
    applyWallpaperLayer(s)
    applyGlassAndTransparency(s)
    if (s.splashMode !== 'default') applySplashLayer(s)
  }, [])

  const update = useCallback((patch: Partial<InterfaceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      // 即时预览（启动画面在确定时应用，避免拖动过程叠层）
      if (hasDesktopBridge()) {
        previewSettings(next)
      } else {
        applyWallpaperLayer(next)
        applyGlassAndTransparency(next)
      }
      return next
    })
  }, [])

  const updateTransparent = (key: keyof InterfaceSettings['transparent'], checked: boolean) => {
    update({ transparent: { ...settings.transparent, [key]: checked } })
  }

  /** 选择本地素材：桌面端走主进程原生对话框（返回文件路径，支持视频）；
   *  纯 web 用 FileReader 转 data URL 持久化。 */
  const pickFile = async (
    kind: 'wallpaper' | 'wallpaper-video' | 'sidebar' | 'splash',
    accept: string,
    onPick: (payload: { value: string | null; name: string; isVideo: boolean }) => void,
  ) => {
    if (hasDesktopBridge()) {
      const picked = await window.dshInterfaceSettings?.pick(kind).catch(() => null)
      if (!picked) return
      onPick({ value: picked.file, name: picked.name, isVideo: picked.isVideo })
      return
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => onPick({ value: String(reader.result), name: file.name, isVideo: false })
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const ok = () => {
    saveSettings(settings)
    if (!hasDesktopBridge()) applyAll(settings)
    close()
  }

  const cancel = () => {
    // 丢弃草稿：恢复已保存的设置（撤销预览）
    const saved = loadSettings()
    if (hasDesktopBridge()) previewSettings(saved)
    else applyAll(saved)
    close()
  }

  const reset = () => {
    setNames({ main: null, video: null, sidebar: null, splash: null })
    setSettings(DEFAULT_SETTINGS)
    if (hasDesktopBridge()) previewSettings(DEFAULT_SETTINGS)
    else applyAll(DEFAULT_SETTINGS)
  }

  const cls = (on: boolean): string => (on ? `${css.segbtn ?? ''} ${css.on ?? ''}` : css.segbtn ?? '')

  return (
    <div className={css.panel}>
      <div className={css.imgrow}>
        <span className={css.label}>{t('mainImage')}</span>
        <span className={css.imgname}>{names.main ?? (settings.wallpaper === null ? t('none') : t('set'))}</span>
        <button className={css.smallbtn} onClick={() => pickFile(
          'wallpaper',
          'image/*',
          ({ value, name, isVideo }) => {
            setNames(p => ({ ...p, main: isVideo ? null : name }))
            if (isVideo) update({ videoWallpaper: value, wallpaper: null })
            else update({ wallpaper: value, videoWallpaper: null })
          },
        )}>
          {t('choose')}
        </button>
        <button className={css.smallbtn} onClick={() => {
          setNames(p => ({ ...p, main: null }))
          update({ wallpaper: null, videoWallpaper: null })
        }}>
          {t('clear')}
        </button>
      </div>

      {hasDesktopBridge() && (
        <>
          <div className={css.imgrow}>
            <span className={css.label}>{t('videoWallpaper')}</span>
            <span className={css.imgname}>{names.video ?? (settings.videoWallpaper === null ? t('none') : t('set'))}</span>
            <button className={css.smallbtn} onClick={() => pickFile(
              'wallpaper-video',
              'video/*',
              ({ value, name }) => {
                setNames(p => ({ ...p, video: name }))
                update({ videoWallpaper: value, wallpaper: null })
              },
            )}>
              {t('choose')}
            </button>
            <button className={css.smallbtn} onClick={() => {
              setNames(p => ({ ...p, video: null }))
              update({ videoWallpaper: null })
            }}>
              {t('clear')}
            </button>
          </div>
          <div className={css.row}>
            <label className={css.check}>
              <input type="checkbox" checked={settings.videoSound}
                onChange={e => update({ videoSound: e.target.checked })} />
              <span>{t('videoSound')}</span>
            </label>
          </div>
        </>
      )}

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
            'sidebar',
            'image/*',
            ({ value, name }) => {
              setNames(p => ({ ...p, sidebar: name }))
              update({ sidebarWallpaper: value })
            },
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
        <span className={css.label}>{t('toolGray')}</span>
        <input type="range" min={0} max={100} step={1} value={settings.toolGray}
          onChange={e => update({ toolGray: Number(e.target.value) })} />
        <span className={css.val}>{settings.toolGray}%</span>
      </div>
      <div className={css.desc}>{t('toolGrayDesc')}</div>

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
            'splash',
            'image/*',
            ({ value, name }) => {
              setNames(p => ({ ...p, splash: name }))
              update({ splashFile: value })
            },
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
        <input type="range" min={0} max={durationMax ?? 10} step={0.5} value={Math.min(settings.splashDuration, durationMax ?? 10)}
          onChange={e => update({ splashDuration: Number(e.target.value) })} />
        <span className={css.val}>{settings.splashDuration === 0 ? t('durationZero') : `${settings.splashDuration} 秒`}</span>
      </div>
      {durationMax !== null && (
        <div className={css.desc}>{t('durationMaxDesc', { seconds: durationMax })}</div>
      )}
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
