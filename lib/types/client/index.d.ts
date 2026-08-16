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
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type InterfaceSettingsKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Interface settings copy. */
        'interface-settings': InterfaceSettingsKey;
    }
}
export type { InterfaceSettings } from './settings.ts';
/** Required services for locale registration and the settings section. */
export declare const inject: string[];
/**
 * Client plugin body: apply appearance from persisted settings and
 * contribute a settings section ("界面设置").
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
//# sourceMappingURL=index.d.ts.map