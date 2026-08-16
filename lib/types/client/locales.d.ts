/**
 * 界面设置插件 —— 文案（中/英）。
 */
export declare const NS = "interface-settings";
declare const zh: {
    readonly title: "界面设置";
    readonly mainImage: "壁纸图片";
    readonly sidebarMode: "侧栏壁纸";
    readonly sidebarShared: "与主界面共用";
    readonly sidebarSep: "单独设置";
    readonly sidebarImage: "侧栏图片";
    readonly sidebarDesc: "单独设置时侧栏用独立图片。";
    readonly choose: "更换…";
    readonly pick: "选择…";
    readonly clear: "清除";
    readonly none: "（无）";
    readonly set: "（已设置）";
    readonly blur: "模糊程度";
    readonly blurDesc: "侧栏与主界面壁纸无缝衔接为一张图。";
    readonly glassBlur: "输入框模糊";
    readonly glassBlurDesc: "输入框液态玻璃的模糊强度（独立于壁纸模糊）。";
    readonly panelAlpha: "面板透明度";
    readonly panelAlphaDesc: "面板半透明强度：越低壁纸越鲜艳，越高越接近纯色。";
    readonly codeAlpha: "代码块透明度";
    readonly codeAlphaDesc: "数值越大越不透明（越实）。";
    readonly transparent: "透明区域";
    readonly 'transparent.newSession': "新对话";
    readonly 'transparent.input': "输入框";
    readonly 'transparent.sidebar': "左边栏";
    readonly 'transparent.main': "主界面";
    readonly splashMode: "启动画面";
    readonly 'splashMode.default': "默认";
    readonly 'splashMode.follow': "跟随主题";
    readonly 'splashMode.custom': "自定义";
    readonly splashPick: "启动素材";
    readonly duration: "动画时长";
    readonly durationZero: "0 秒（不等待）";
    readonly durationDesc: "启动画面至少展示的秒数；0 = 不强制，加载完成即进入主界面（仅默认外的模式生效）。";
    readonly fade: "淡出时长";
    readonly fadeZero: "0 秒（直接切换）";
    readonly fadeDesc: "启动画面结束时的渐隐时长；0 = 直接切换。";
    readonly reset: "恢复默认";
    readonly cancel: "取消";
    readonly ok: "确定";
};
declare const en: Record<keyof typeof zh, string>;
export type InterfaceSettingsKey = keyof typeof zh;
export { zh, en };
//# sourceMappingURL=locales.d.ts.map