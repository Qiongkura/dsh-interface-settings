import { type InterfaceSettingsKey } from './locales.ts';
/** 翻译函数（locale 绑定）。 */
export type Translate = (key: InterfaceSettingsKey, params?: Record<string, string | number>) => string;
export interface SettingsPanelInjected {
    t: Translate;
}
export type SettingsPanelProps = SettingsPanelInjected & {
    /** 关闭设置面板（settings.section owner props 提供） */
    close: () => void;
};
export declare function SettingsPanel({ t, close }: SettingsPanelProps): import("react").JSX.Element;
//# sourceMappingURL=SettingsPanel.d.ts.map