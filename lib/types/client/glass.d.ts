/**
 * 液态玻璃、区域透明与代码块透明度 —— 与桌面端 applyVars 同源逻辑。
 *
 * 所有变量必须设在 document.body 上：值里引用 var(--dsw-alias-*) 等主题变量，
 * 主题变量定义在 body，设在 html 上会解析失败导致开关失效。
 *
 * 输入框玻璃：composerSeat::before + backdrop-filter + 面板色渐变（最低 10px 保证文字必糊）。
 * 轨迹玻璃：按颜色饱和度智能透明——中性色（白/灰）背景透明让壁纸透出，
 * 彩色元素（时间线色条/状态标签）按饱和度判断保留（插件类名是编译随机前缀，不可依赖）。
 */
import type { InterfaceSettings } from './settings.ts';
export declare function applyGlassAndTransparency(settings: InterfaceSettings): void;
/** 重新应用全部透明/颜色变量（设置面板保存后调用，可重复执行）。 */
export declare function applyVars(settings: InterfaceSettings): void;
//# sourceMappingURL=glass.d.ts.map