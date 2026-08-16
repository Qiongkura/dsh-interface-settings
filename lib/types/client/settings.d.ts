/**
 * 界面设置插件 —— 持久化配置。
 * 使用 localStorage 保存（浏览器端无主进程配置通道）。
 */
export interface InterfaceSettings {
    /** 壁纸图片路径（data: URL） */
    wallpaper: string | null;
    /** 壁纸模糊 px */
    wallpaperBlur: number;
    /** 代码块透明度 0.08-1 */
    codeAlpha: number;
    /** 侧栏独立壁纸（共用主图时为 null） */
    sidebarWallpaper: string | null;
    /** 区域透明开关 */
    transparent: {
        newSession: boolean;
        input: boolean;
        sidebar: boolean;
        main: boolean;
    };
    /** 输入框/轨迹玻璃模糊 px（最低 10） */
    glassBlur: number;
    /** 面板透明度 0-1 */
    panelAlpha: number;
    /** 启动画面模式：default / follow / custom */
    splashMode: 'default' | 'follow' | 'custom';
    /** 自定义启动素材（图片） */
    splashFile: string | null;
    /** 启动画面最小展示秒数 */
    splashDuration: number;
    /** 启动画面淡出秒数 */
    splashFade: number;
}
export declare const DEFAULT_SETTINGS: InterfaceSettings;
export declare function loadSettings(): InterfaceSettings;
export declare function saveSettings(settings: InterfaceSettings): void;
//# sourceMappingURL=settings.d.ts.map