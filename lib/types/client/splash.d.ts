/**
 * 启动画面层（浏览器端实现）。
 *
 * boot 就绪（插件加载）后立即注入全屏启动层（z-index 最大）：
 *  - 自定义图片：全屏 div + 背景图（主色兜底，无黑屏）；
 *  - 自定义视频：全屏 <video>（自动播放）；
 *  - 跟随主题：复用壁纸层。
 * 主界面渲染完成（输入框出现）且满足最小展示时长后淡出移除；点击可跳过。
 */
import type { InterfaceSettings } from './settings.ts';
export declare function applySplashLayer(settings: InterfaceSettings): void;
//# sourceMappingURL=splash.d.ts.map