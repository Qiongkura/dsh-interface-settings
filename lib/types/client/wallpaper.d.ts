/**
 * 壁纸层注入。
 *
 * 用 `body::before/::after` 伪元素做壁纸层（负 z-index、不拦截输入），
 * 通过 CSS 变量驱动；图片用 data URL（浏览器端安全限制内）。
 */
import type { InterfaceSettings } from './settings.ts';
/** 注入壁纸与面板变量。 */
export declare function applyWallpaperLayer(settings: InterfaceSettings): void;
/** 幂等注入壁纸与面板 CSS（只注入一次，变量后续变化即时生效）。 */
export declare function injectWallpaperCss(): void;
//# sourceMappingURL=wallpaper.d.ts.map