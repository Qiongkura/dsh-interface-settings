/**
 * 界面设置插件（浏览器端）：壁纸 / 区域透明 / 输入框与轨迹玻璃模糊 / 启动画面。
 *
 * 所有外观都通过注入 CSS 变量与规则实现（不修改 DSH 源码）：
 *  - 壁纸：`body::before/::after` 伪元素 + `--dsh-wallpaper-url`；
 *  - 区域透明：`--dsh-t-new-session/input/sidebar/main` 变量 + 选择器规则；
 *  - 液态玻璃：`composerSeat::before` 等 + `--dsh-glass-blur`；
 *  - 轨迹玻璃：按颜色饱和度智能透明（不依赖易变的插件类名）；
 *  - 启动画面：boot 就绪后立即注入全屏启动层，主界面渲染完成后淡出移除。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { SettingsPanel, type SettingsPanelInjected } from './SettingsPanel.tsx'
import { loadSettings, type InterfaceSettings } from './settings.ts'
import { applyWallpaperLayer } from './wallpaper.ts'
import { applyGlassAndTransparency } from './glass.ts'
import { applySplashLayer } from './splash.ts'
import { en, NS, zh, type InterfaceSettingsKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Interface settings copy. */
    'interface-settings': InterfaceSettingsKey
  }
}

export type { InterfaceSettings, InterfaceSettingsKey } from './settings.ts'

/** Required services for locale registration and the settings section. */
export const inject = ['slots', 'locale']

/**
 * Client plugin body: apply appearance from persisted settings and
 * contribute a settings section ("界面设置").
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'interface-settings: dictionaries')
  const t = ctx.locale.bind(NS) as SettingsPanelInjected['t']

  // 1) 应用持久化的外观设置（壁纸 / 透明 / 玻璃 / 启动画面）
  const settings: InterfaceSettings = loadSettings()
  applyWallpaperLayer(settings)
  applyGlassAndTransparency(settings)
  if (settings.splashMode !== 'default') applySplashLayer(settings)

  // 2) 设置分区：注册到 settings.section（由 ui-settings-general 声明的
  //    sidebar.settings 子 slot），出现在设置面板的导航里
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'interface-settings',
    order: 20,
    label: () => t('title'),
    locale: NS,
    /* v8 ignore next -- the inject face runs only at render time */
    inject: (): SettingsPanelInjected => ({ t }),
  }, SettingsPanel))
}
