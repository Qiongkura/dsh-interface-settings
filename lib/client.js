window.__ModuleLoader__.load({
	id: "dsh-interface-settings",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/settings.ts
		/** 桌面端桥可用（运行在 dsh-desktop 壳内时）。 */
		const hasDesktopBridge = () => typeof window !== "undefined" && typeof window.dshInterfaceSettings === "object" && window.dshInterfaceSettings !== null;
		const KEY = "dsh.interface-settings.v1";
		const DEFAULT_SETTINGS = {
			wallpaper: null,
			wallpaperBlur: 18,
			codeAlpha: .45,
			sidebarWallpaper: null,
			transparent: {
				newSession: true,
				input: true,
				sidebar: true,
				main: true
			},
			glassBlur: 10,
			panelAlpha: .55,
			toolGray: 50,
			splashMode: "default",
			splashFile: null,
			splashDuration: 0,
			splashFade: .5,
			videoWallpaper: null,
			videoSound: false
		};
		/** 合并默认值（含嵌套 transparent）。 */
		function merge(raw) {
			return {
				...DEFAULT_SETTINGS,
				...raw,
				transparent: {
					...DEFAULT_SETTINGS.transparent,
					...raw.transparent ?? {}
				}
			};
		}
		function loadSettings() {
			if (hasDesktopBridge()) try {
				const bridge = window.dshInterfaceSettings;
				if (bridge) return merge(bridge.get());
			} catch {}
			try {
				const raw = localStorage.getItem(KEY);
				if (raw === null) return { ...DEFAULT_SETTINGS };
				return merge(JSON.parse(raw));
			} catch {
				return { ...DEFAULT_SETTINGS };
			}
		}
		function saveSettings(settings) {
			if (hasDesktopBridge()) {
				window.dshInterfaceSettings?.commit(settings);
				return;
			}
			localStorage.setItem(KEY, JSON.stringify(settings));
		}
		/** 预览（应用但不保存）；桌面端由主进程应用，纯 web 由调用方 DOM 应用。 */
		function previewSettings(settings) {
			if (hasDesktopBridge()) window.dshInterfaceSettings?.preview(settings);
		}
		//#endregion
		//#region src/client/wallpaper.ts
		/** 注入壁纸与面板变量。 */
		function applyWallpaperLayer(settings) {
			if (settings.wallpaper === null) document.body.style.removeProperty("--dsh-wallpaper-url");
			else document.body.style.setProperty("--dsh-wallpaper-url", `url("${settings.wallpaper}")`);
			if (settings.sidebarWallpaper === null) document.body.style.removeProperty("--dsh-wallpaper-url-sidebar");
			else document.body.style.setProperty("--dsh-wallpaper-url-sidebar", `url("${settings.sidebarWallpaper}")`);
			injectWallpaperCss();
		}
		let injected = false;
		/** 幂等注入壁纸与面板 CSS（只注入一次，变量后续变化即时生效）。 */
		function injectWallpaperCss() {
			if (injected) return;
			injected = true;
			const style = document.createElement("style");
			style.id = "dsh-interface-settings";
			style.textContent = `
    html { background: transparent !important; }
    body { background: transparent !important; }
    body::before, body::after {
      content: '' !important;
      position: fixed !important;
      top: 0 !important;
      height: 100vh !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background-position: center !important;
      background-size: cover !important;
      background-repeat: no-repeat !important;
    }
    body::before {
      left: 0 !important;
      right: 0 !important;
      background-image: var(--dsh-wallpaper-url) !important;
      filter: blur(var(--dsh-wallpaper-blur, 18px)) !important;
    }
    /* 侧栏独立壁纸（共用主图时不显示这层） */
    body::after {
      left: 0 !important;
      width: 280px !important;
      background-image: var(--dsh-wallpaper-url-sidebar, none) !important;
      filter: blur(var(--dsh-wallpaper-blur, 18px)) !important;
    }
    /* 面板半透明 + 区域透明变量 */
    #root [data-slot='root'] > div,
    #root [data-slot='root'] > div > div { background: transparent !important; }
    #root [data-slot='root'] > div > div > [data-slot] > div {
      background: var(--dsh-wallpaper-panel, rgba(255,255,255,0.55)) !important;
    }
    #root [data-slot='root'] > div > div:first-child > [data-slot] > div {
      background: var(--dsh-wallpaper-panel-sidebar, var(--dsh-wallpaper-panel, rgba(255,255,255,0.55))) !important;
    }
  `;
			document.head.appendChild(style);
		}
		//#endregion
		//#region src/client/glass.ts
		function applyGlassAndTransparency(settings) {
			applyVars(settings);
			injectGlassCss();
			startTrajectoryTransparentizer();
		}
		/** 重新应用全部透明/颜色变量（设置面板保存后调用，可重复执行）。 */
		function applyVars(settings) {
			const isDark = document.body.hasAttribute("data-ds-dark-theme") || (getComputedStyle(document.documentElement).colorScheme || "light") === "dark";
			const T = settings.transparent;
			const alphaRaw = settings.codeAlpha;
			const alpha = Number.isFinite(alphaRaw) ? Math.max(.08, Math.min(1, alphaRaw)) : .45;
			const paRaw = settings.panelAlpha;
			const pa = Number.isFinite(paRaw) ? Math.max(0, Math.min(1, paRaw)) : .55;
			const panelColor = isDark ? `rgba(12,15,22,${pa})` : `rgba(255,255,255,${pa})`;
			document.body.style.setProperty("--dsh-wallpaper-blur", `${settings.wallpaperBlur}px`);
			document.body.style.setProperty("--dsh-wallpaper-panel-alpha", `${pa}`);
			document.body.style.setProperty("--dsh-wallpaper-code-alpha", `${alpha}`);
			document.body.style.setProperty("--dsh-glass-blur", `${Math.max(0, Math.min(64, settings.glassBlur))}px`);
			const tgRaw = settings.toolGray;
			const tg = Number.isFinite(tgRaw) ? Math.max(0, Math.min(100, tgRaw)) : 50;
			document.body.style.setProperty("--dsh-tool-gray", `${tg}%`);
			document.body.style.setProperty("--dsh-wallpaper-panel", T.main ? panelColor : "var(--dsw-alias-bg-base)");
			document.body.style.setProperty("--dsh-wallpaper-panel-sidebar", T.sidebar ? panelColor : isDark ? "var(--dsw-static-neutral-bluish-900)" : "var(--dsw-static-neutral-bluish-50)");
			document.documentElement.style.setProperty("--dsh-wallpaper-panel-fg", isDark ? "rgba(249,250,251,0.92)" : "rgba(15,17,21,0.92)");
			document.documentElement.style.setProperty("--dsh-wallpaper-panel-border", isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)");
			document.documentElement.style.setProperty("--dsh-wallpaper-panel-hover", isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)");
			document.body.style.setProperty("--dsw-specific-input-major", T.input ? "transparent" : isDark ? "var(--dsw-static-neutral-bluish-850)" : "var(--dsw-static-neutral-bluish-00)");
			document.body.style.setProperty("--dsh-t-new-session", T.newSession ? "transparent" : "var(--dsw-alias-button-elevated-fill)");
			document.body.style.setProperty("--dsw-specific-sidebar-fill", "transparent");
			document.body.style.setProperty("--dsw-alias-markdown-code-block", isDark ? `rgba(12,15,22,${alpha})` : `rgba(255,255,255,${alpha})`);
			document.body.style.setProperty("--dsw-alias-markdown-code-block-banner", isDark ? `rgba(20,24,34,${alpha})` : `rgba(250,251,252,${alpha})`);
			document.body.style.setProperty("--dsw-alias-markdown-inline-code", isDark ? `rgba(35,38,43,${alpha})` : `rgba(239,240,243,${alpha})`);
		}
		let glassInjected = false;
		function injectGlassCss() {
			if (glassInjected) return;
			glassInjected = true;
			const style = document.createElement("style");
			style.id = "dsh-interface-settings-glass";
			style.textContent = `
    /* 输入框液态玻璃 */
    #root [class*='composerSeat'] {
      background: transparent !important;
    }
    #root [class*='composerSeat']::before {
      content: '' !important;
      position: absolute !important;
      top: 0 !important;
      bottom: 0 !important;
      left: 50% !important;
      right: auto !important;
      width: min(800px, calc(100% - 32px)) !important;
      transform: translateX(-50%) !important;
      border-radius: 22px !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background: linear-gradient(to bottom,
        transparent 0px,
        rgba(255,255,255,calc(var(--dsh-wallpaper-panel-alpha, 0.55))) 20px) !important;
      backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
      -webkit-backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
    }
    /* 侧栏新对话按钮透明开关 */
    #root [class*='newSession'] {
      background: var(--dsh-t-new-session, transparent) !important;
    }
    /* 文字颜色跟随滑杆：覆盖工具行/思考/产物；error态保留红色 */
    #root [data-tool] *,
    #root [data-variant="think"] *,
    #root [data-produced-files-row] * {
      color: hsl(0, 0%, calc(100% - var(--dsh-tool-gray, 50%))) !important;
    }
    #root [data-tool][data-state="error"] *,
    #root [data-variant][data-state="error"] * {
      color: var(--dsw-alias-state-error-primary, #e53935) !important;
    }
    /* 轨迹视图液态玻璃（根元素 + 面板色 22% 低透明） */
    #root [data-conversation-composer-overlay] {
      background: linear-gradient(to bottom,
        transparent 0px,
        rgba(255,255,255,0.22) 24px) !important;
      backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
      -webkit-backdrop-filter: blur(var(--dsh-glass-blur, 10px)) !important;
    }
  `;
			document.head.appendChild(style);
		}
		/** 轨迹内部中性背景智能透明（轮询处理新渲染元素）。 */
		function startTrajectoryTransparentizer() {
			const isNeutral = (bg) => {
				const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg);
				if (m === null) return false;
				const r = +(m[1] ?? 0), g = +(m[2] ?? 0), b = +(m[3] ?? 0);
				const max = Math.max(r, g, b);
				return max === 0 ? true : (max - Math.min(r, g, b)) / max < .22;
			};
			const apply = () => {
				const root = document.querySelector("[data-conversation-composer-overlay]");
				if (root === null) return;
				for (const el of root.querySelectorAll("*")) {
					const el2 = el;
					if (el2.__dshT) continue;
					const bg = getComputedStyle(el2).backgroundColor;
					if (bg !== "rgba(0, 0, 0, 0)" && isNeutral(bg)) {
						el2.style.setProperty("background-color", "transparent", "important");
						el2.__dshT = true;
					}
				}
			};
			apply();
			setInterval(apply, 1500);
		}
		//#endregion
		//#region src/client/splash.ts
		function applySplashLayer(settings) {
			const start = Date.now();
			const minMs = Math.max(0, settings.splashDuration * 1e3);
			const fadeMs = Math.max(0, settings.splashFade * 1e3);
			const media = settings.splashMode === "custom" ? settings.splashFile : settings.wallpaper;
			const tryInject = () => {
				if (!document.documentElement) {
					setTimeout(tryInject, 5);
					return;
				}
				const isVideo = media !== null && /\.(mp4|m4v|webm|mov|ogv)(\?|#|$)/i.test(media);
				const el = document.createElement(isVideo ? "video" : "div");
				el.id = "dsh-splash-layer";
				el.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#101318";
				if (isVideo) {
					const v = el;
					v.src = media;
					v.autoplay = true;
					v.loop = true;
					v.muted = true;
					v.playsInline = true;
					v.style.cssText += ";width:100%;height:100%;object-fit:cover";
				} else if (media !== null) el.style.background = `#101318 url("${media}") center/cover no-repeat`;
				document.documentElement.appendChild(el);
				let skip = false;
				el.addEventListener("click", () => {
					skip = true;
				});
				let tries = 0;
				let fading = false;
				const iv = setInterval(() => {
					tries++;
					const ready = document.querySelector("[class*=\"composerSeat\"]") !== null || document.querySelector("textarea") !== null || document.querySelector("[contenteditable=\"true\"]") !== null;
					const elapsed = Date.now() - start;
					if (!fading && (ready && (elapsed >= minMs || skip) || tries > 400)) {
						clearInterval(iv);
						fading = true;
						el.style.transition = `opacity ${fadeMs}ms ease`;
						el.style.opacity = "0";
						setTimeout(() => {
							el.remove();
						}, fadeMs);
					}
				}, 50);
			};
			tryInject();
		}
		//#endregion
		//#region \0dsh-css:G:\deepseek-harness\packages\client\interface-settings\src\client\SettingsPanel.module.css.mjs
		const css = ".X1sy8G_panel{--label-primary:#0f1115;--label-secondary:#61666b;--border-l2:#0f111524;--hover-bg:#0f11150f;--btn-primary-bg:#0f1115;--btn-primary-fg:#f9fafb;--btn-primary-hover:#2a2e37;color:var(--label-primary);flex-direction:column;padding:18px 20px 20px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,PingFang SC,Hiragino Sans GB,Microsoft YaHei,Helvetica Neue,Arial,sans-serif;font-size:12px;display:flex}body[data-ds-dark-theme] .X1sy8G_panel{--label-primary:#f9fafb;--label-secondary:#81858c;--border-l2:#ffffff1f;--hover-bg:#ffffff14;--btn-primary-bg:#f9fafb;--btn-primary-fg:#0f1115;--btn-primary-hover:#ebecf2}.X1sy8G_row,.X1sy8G_imgrow{align-items:center;gap:12px;margin-top:16px;display:flex}.X1sy8G_imgrow{gap:8px}.X1sy8G_row .X1sy8G_label,.X1sy8G_imgrow .X1sy8G_label{width:92px;color:var(--label-secondary);flex:none;font-size:12px}.X1sy8G_imgname{color:var(--label-primary);white-space:nowrap;text-overflow:ellipsis;flex:1;min-width:0;font-size:12px;overflow:hidden}.X1sy8G_panel input[type=range]{accent-color:#4d6bfe;flex:1;min-width:0}.X1sy8G_val{text-align:right;min-width:52px;color:var(--label-primary);font-variant-numeric:tabular-nums;font-size:13px}.X1sy8G_smallbtn{border:1px solid var(--border-l2);height:26px;color:var(--label-primary);cursor:pointer;background:0 0;border-radius:13px;flex:none;padding:0 12px;font-family:inherit;font-size:12px}.X1sy8G_smallbtn:hover{background:var(--hover-bg)}.X1sy8G_seg{flex:1;gap:6px;min-width:0;display:flex}.X1sy8G_segbtn{border:1px solid var(--border-l2);height:26px;color:var(--label-secondary);cursor:pointer;white-space:nowrap;text-overflow:ellipsis;background:0 0;border-radius:13px;flex:1;padding:0 8px;font-family:inherit;font-size:12px;overflow:hidden}.X1sy8G_segbtn.X1sy8G_on{color:#4d6bfe;background:#4d6bfe2e;border-color:#4d6bfe}.X1sy8G_segbtn:hover{background:var(--hover-bg)}.X1sy8G_segbtn.X1sy8G_on:hover{background:#4d6bfe42}.X1sy8G_checks{flex-wrap:wrap;flex:1;gap:6px 14px;min-width:0;display:flex}.X1sy8G_check{color:var(--label-secondary);cursor:pointer;white-space:nowrap;align-items:center;gap:4px;font-size:12px;display:inline-flex}.X1sy8G_check input{accent-color:#4d6bfe;cursor:pointer;width:13px;height:13px;margin:0}.X1sy8G_desc{color:var(--label-secondary);margin-top:6px;padding-left:104px;font-size:12px}.X1sy8G_footer{justify-content:flex-end;align-items:center;gap:10px;margin-top:24px;display:flex}.X1sy8G_btn{height:32px;color:var(--label-primary);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:16px;padding:0 16px;font-family:inherit;font-size:12px;font-weight:500}.X1sy8G_btnGhost{border-color:var(--border-l2)}.X1sy8G_btnGhost:hover{background:var(--hover-bg)}.X1sy8G_btnPrimary{background:var(--btn-primary-bg);color:var(--btn-primary-fg);font-weight:600}.X1sy8G_btnPrimary:hover{background:var(--btn-primary-hover)}";
		const tagId = "dsh-interface-settings/SettingsPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-interface-settings";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SettingsPanel_module_css_default = {
			"footer": "X1sy8G_footer",
			"check": "X1sy8G_check",
			"btnGhost": "X1sy8G_btnGhost",
			"btnPrimary": "X1sy8G_btnPrimary",
			"checks": "X1sy8G_checks",
			"imgname": "X1sy8G_imgname",
			"on": "X1sy8G_on",
			"smallbtn": "X1sy8G_smallbtn",
			"panel": "X1sy8G_panel",
			"row": "X1sy8G_row",
			"desc": "X1sy8G_desc",
			"segbtn": "X1sy8G_segbtn",
			"imgrow": "X1sy8G_imgrow",
			"val": "X1sy8G_val",
			"seg": "X1sy8G_seg",
			"btn": "X1sy8G_btn",
			"label": "X1sy8G_label"
		};
		//#endregion
		//#region src/client/SettingsPanel.tsx
		/**
		* 界面设置插件 —— 设置面板组件。
		*
		* 布局与功能对齐桌面端「界面设置」对话框：壁纸（主/侧栏）、模糊、
		* 输入框玻璃、面板透明度、代码块透明度、区域透明开关、启动画面
		* （模式/素材/时长/淡出）。改动即时预览，确定后持久化。
		*/
		function SettingsPanel({ t, close }) {
			const [settings, setSettings] = (0, react.useState)(() => loadSettings());
			const [names, setNames] = (0, react.useState)({
				main: null,
				video: null,
				sidebar: null,
				splash: null
			});
			const [durationMax, setDurationMax] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!hasDesktopBridge()) {
					setDurationMax(null);
					return;
				}
				let cancelled = false;
				window.dshInterfaceSettings?.splashDurationMax().then((max) => {
					if (!cancelled) setDurationMax(max);
				}).catch(() => {
					if (!cancelled) setDurationMax(null);
				});
				return () => {
					cancelled = true;
				};
			}, [
				settings.splashFile,
				settings.videoWallpaper,
				settings.splashMode
			]);
			(0, react.useEffect)(() => {
				if (durationMax !== null && settings.splashDuration > durationMax) update({ splashDuration: durationMax });
			}, [durationMax]);
			const applyAll = (0, react.useCallback)((s) => {
				if (hasDesktopBridge()) {
					previewSettings(s);
					return;
				}
				applyWallpaperLayer(s);
				applyGlassAndTransparency(s);
				if (s.splashMode !== "default") applySplashLayer(s);
			}, []);
			const update = (0, react.useCallback)((patch) => {
				setSettings((prev) => {
					const next = {
						...prev,
						...patch
					};
					if (hasDesktopBridge()) previewSettings(next);
					else {
						applyWallpaperLayer(next);
						applyGlassAndTransparency(next);
					}
					return next;
				});
			}, []);
			const updateTransparent = (key, checked) => {
				update({ transparent: {
					...settings.transparent,
					[key]: checked
				} });
			};
			/** 选择本地素材：桌面端走主进程原生对话框（返回文件路径，支持视频）；
			*  纯 web 用 FileReader 转 data URL 持久化。 */
			const pickFile = async (kind, accept, onPick) => {
				if (hasDesktopBridge()) {
					const picked = await window.dshInterfaceSettings?.pick(kind).catch(() => null);
					if (!picked) return;
					onPick({
						value: picked.file,
						name: picked.name,
						isVideo: picked.isVideo
					});
					return;
				}
				const input = document.createElement("input");
				input.type = "file";
				input.accept = accept;
				input.onchange = () => {
					const file = input.files?.[0];
					if (!file) return;
					const reader = new FileReader();
					reader.onload = () => onPick({
						value: String(reader.result),
						name: file.name,
						isVideo: false
					});
					reader.readAsDataURL(file);
				};
				input.click();
			};
			const ok = () => {
				saveSettings(settings);
				if (!hasDesktopBridge()) applyAll(settings);
				close();
			};
			const cancel = () => {
				const saved = loadSettings();
				if (hasDesktopBridge()) previewSettings(saved);
				else applyAll(saved);
				close();
			};
			const reset = () => {
				setNames({
					main: null,
					video: null,
					sidebar: null,
					splash: null
				});
				setSettings(DEFAULT_SETTINGS);
				if (hasDesktopBridge()) previewSettings(DEFAULT_SETTINGS);
				else applyAll(DEFAULT_SETTINGS);
			};
			const cls = (on) => on ? `${SettingsPanel_module_css_default.segbtn ?? ""} ${SettingsPanel_module_css_default.on ?? ""}` : SettingsPanel_module_css_default.segbtn ?? "";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: SettingsPanel_module_css_default.panel,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.imgrow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("mainImage")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.imgname,
								children: names.main ?? (settings.wallpaper === null ? t("none") : t("set"))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => pickFile("wallpaper", "image/*", ({ value, name, isVideo }) => {
									setNames((p) => ({
										...p,
										main: isVideo ? null : name
									}));
									if (isVideo) update({
										videoWallpaper: value,
										wallpaper: null
									});
									else update({
										wallpaper: value,
										videoWallpaper: null
									});
								}),
								children: t("choose")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => {
									setNames((p) => ({
										...p,
										main: null
									}));
									update({
										wallpaper: null,
										videoWallpaper: null
									});
								},
								children: t("clear")
							})
						]
					}),
					hasDesktopBridge() && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.imgrow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("videoWallpaper")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.imgname,
								children: names.video ?? (settings.videoWallpaper === null ? t("none") : t("set"))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => pickFile("wallpaper-video", "video/*", ({ value, name }) => {
									setNames((p) => ({
										...p,
										video: name
									}));
									update({
										videoWallpaper: value,
										wallpaper: null
									});
								}),
								children: t("choose")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => {
									setNames((p) => ({
										...p,
										video: null
									}));
									update({ videoWallpaper: null });
								},
								children: t("clear")
							})
						]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.row,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SettingsPanel_module_css_default.check,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: settings.videoSound,
								onChange: (e) => update({ videoSound: e.target.checked })
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("videoSound") })]
						})
					})] }),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SettingsPanel_module_css_default.label,
							children: t("sidebarMode")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SettingsPanel_module_css_default.seg,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: cls(settings.sidebarWallpaper === null),
								onClick: () => update({ sidebarWallpaper: null }),
								children: t("sidebarShared")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: cls(settings.sidebarWallpaper !== null),
								onClick: () => update({ sidebarWallpaper: settings.wallpaper }),
								children: t("sidebarSep")
							})]
						})]
					}),
					settings.sidebarWallpaper !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.imgrow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("sidebarImage")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.imgname,
								children: names.sidebar ?? t("set")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => pickFile("sidebar", "image/*", ({ value, name }) => {
									setNames((p) => ({
										...p,
										sidebar: name
									}));
									update({ sidebarWallpaper: value });
								}),
								children: t("choose")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => {
									setNames((p) => ({
										...p,
										sidebar: null
									}));
									update({ sidebarWallpaper: null });
								},
								children: t("clear")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("sidebarDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("blur")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 64,
								step: 1,
								value: settings.wallpaperBlur,
								onChange: (e) => update({ wallpaperBlur: Number(e.target.value) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsPanel_module_css_default.val,
								children: [settings.wallpaperBlur, "px"]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("blurDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("glassBlur")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 64,
								step: 1,
								value: settings.glassBlur,
								onChange: (e) => update({ glassBlur: Number(e.target.value) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsPanel_module_css_default.val,
								children: [settings.glassBlur, "px"]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("glassBlurDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("panelAlpha")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 90,
								step: 1,
								value: Math.round(settings.panelAlpha * 100),
								onChange: (e) => update({ panelAlpha: Number(e.target.value) / 100 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsPanel_module_css_default.val,
								children: [Math.round(settings.panelAlpha * 100), "%"]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("panelAlphaDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("codeAlpha")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 8,
								max: 100,
								step: 1,
								value: Math.round(settings.codeAlpha * 100),
								onChange: (e) => update({ codeAlpha: Number(e.target.value) / 100 })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsPanel_module_css_default.val,
								children: [Math.round(settings.codeAlpha * 100), "%"]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("codeAlphaDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("toolGray")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 100,
								step: 1,
								value: settings.toolGray,
								onChange: (e) => update({ toolGray: Number(e.target.value) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsPanel_module_css_default.val,
								children: [settings.toolGray, "%"]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("toolGrayDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SettingsPanel_module_css_default.label,
							children: t("transparent")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SettingsPanel_module_css_default.checks,
							children: [
								"newSession",
								"input",
								"sidebar",
								"main"
							].map((key) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: SettingsPanel_module_css_default.check,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: settings.transparent[key],
									onChange: (e) => updateTransparent(key, e.target.checked)
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t(`transparent.${key}`) })]
							}, key))
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SettingsPanel_module_css_default.label,
							children: t("splashMode")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: SettingsPanel_module_css_default.seg,
							children: [
								"default",
								"follow",
								"custom"
							].map((mode) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: cls(settings.splashMode === mode),
								onClick: () => update({ splashMode: mode }),
								children: t(`splashMode.${mode}`)
							}, mode))
						})]
					}),
					settings.splashMode === "custom" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.imgrow,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("splashPick")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.imgname,
								children: names.splash ?? (settings.splashFile === null ? t("none") : t("set"))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => pickFile("splash", "image/*", ({ value, name }) => {
									setNames((p) => ({
										...p,
										splash: name
									}));
									update({ splashFile: value });
								}),
								children: t("pick")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: SettingsPanel_module_css_default.smallbtn,
								onClick: () => {
									setNames((p) => ({
										...p,
										splash: null
									}));
									update({ splashFile: null });
								},
								children: t("clear")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("duration")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: durationMax ?? 10,
								step: .5,
								value: Math.min(settings.splashDuration, durationMax ?? 10),
								onChange: (e) => update({ splashDuration: Number(e.target.value) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.val,
								children: settings.splashDuration === 0 ? t("durationZero") : `${settings.splashDuration} 秒`
							})
						]
					}),
					durationMax !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("durationMaxDesc", { seconds: durationMax })
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("durationDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.label,
								children: t("fade")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "range",
								min: 0,
								max: 2,
								step: .1,
								value: settings.splashFade,
								onChange: (e) => update({ splashFade: Number(e.target.value) })
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsPanel_module_css_default.val,
								children: settings.splashFade === 0 ? t("fadeZero") : `${settings.splashFade} 秒`
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SettingsPanel_module_css_default.desc,
						children: t("fadeDesc")
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: SettingsPanel_module_css_default.footer,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: `${SettingsPanel_module_css_default.btn} ${SettingsPanel_module_css_default.btnGhost}`,
								onClick: reset,
								children: t("reset")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: `${SettingsPanel_module_css_default.btn} ${SettingsPanel_module_css_default.btnGhost}`,
								onClick: cancel,
								children: t("cancel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: `${SettingsPanel_module_css_default.btn} ${SettingsPanel_module_css_default.btnPrimary}`,
								onClick: ok,
								children: t("ok")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/**
		* 界面设置插件 —— 文案（中/英）。
		*/
		const NS = "interface-settings";
		const zh = {
			title: "界面设置",
			mainImage: "壁纸图片",
			videoWallpaper: "视频壁纸",
			videoSound: "视频声音",
			sidebarMode: "侧栏壁纸",
			sidebarShared: "与主界面共用",
			sidebarSep: "单独设置",
			sidebarImage: "侧栏图片",
			sidebarDesc: "单独设置时侧栏用独立图片。",
			choose: "更换…",
			pick: "选择…",
			clear: "清除",
			none: "（无）",
			set: "（已设置）",
			blur: "模糊程度",
			blurDesc: "侧栏与主界面壁纸无缝衔接为一张图。",
			glassBlur: "输入框模糊",
			glassBlurDesc: "输入框液态玻璃的模糊强度（独立于壁纸模糊）。",
			panelAlpha: "面板透明度",
			panelAlphaDesc: "面板半透明强度：越低壁纸越鲜艳，越高越接近纯色。",
			toolGray: "工具调用文字渐变",
			toolGrayDesc: "主界面工具调用行（pwsh/read/edit/write 等）文字颜色从白到黑的渐变位置。",
			codeAlpha: "代码块透明度",
			codeAlphaDesc: "数值越大越不透明（越实）。",
			transparent: "透明区域",
			"transparent.newSession": "新对话",
			"transparent.input": "输入框",
			"transparent.sidebar": "左边栏",
			"transparent.main": "主界面",
			splashMode: "启动画面",
			"splashMode.default": "默认",
			"splashMode.follow": "跟随主题",
			"splashMode.custom": "自定义",
			splashPick: "启动素材",
			duration: "动画时长",
			durationZero: "0 秒（不等待）",
			durationMaxDesc: "启动素材为视频：上限自动设为视频完整时长（{seconds} 秒）。",
			durationDesc: "启动画面至少展示的秒数；0 = 不强制，加载完成即进入主界面（仅默认外的模式生效）。",
			fade: "淡出时长",
			fadeZero: "0 秒（直接切换）",
			fadeDesc: "启动画面结束时的渐隐时长；0 = 直接切换。",
			reset: "恢复默认",
			cancel: "取消",
			ok: "确定"
		};
		const en = {
			title: "Interface Settings",
			mainImage: "Wallpaper",
			videoWallpaper: "Video wallpaper",
			videoSound: "Video sound",
			sidebarMode: "Sidebar wallpaper",
			sidebarShared: "Share main",
			sidebarSep: "Separate",
			sidebarImage: "Sidebar image",
			sidebarDesc: "Uses an independent image for the sidebar.",
			choose: "Change…",
			pick: "Choose…",
			clear: "Clear",
			none: "(none)",
			set: "(set)",
			blur: "Blur",
			blurDesc: "Sidebar and main wallpaper blend into one seamless image.",
			glassBlur: "Composer blur",
			glassBlurDesc: "Liquid-glass blur strength of the composer (independent of wallpaper blur).",
			panelAlpha: "Panel opacity",
			panelAlphaDesc: "Lower shows more wallpaper, higher looks closer to solid.",
			toolGray: "Tool text gradient",
			toolGrayDesc: "Gradient position of tool-call row text (pwsh/read/edit/write) from white to black.",
			codeAlpha: "Code block opacity",
			codeAlphaDesc: "Higher is more opaque (more solid).",
			transparent: "Transparent areas",
			"transparent.newSession": "New session",
			"transparent.input": "Composer",
			"transparent.sidebar": "Sidebar",
			"transparent.main": "Main",
			splashMode: "Splash screen",
			"splashMode.default": "Default",
			"splashMode.follow": "Follow theme",
			"splashMode.custom": "Custom",
			splashPick: "Splash asset",
			duration: "Duration",
			durationZero: "0s (no wait)",
			durationMaxDesc: "Video splash asset: the upper limit is set to the full video duration ({seconds}s).",
			durationDesc: "Minimum splash display time; 0 = enter immediately when ready (only applies outside Default).",
			fade: "Fade out",
			fadeZero: "0s (switch instantly)",
			fadeDesc: "Fade-out duration at the end of the splash; 0 = switch instantly.",
			reset: "Reset",
			cancel: "Cancel",
			ok: "OK"
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services for locale registration and the settings section. */
		const inject = ["slots", "locale"];
		/**
		* Client plugin body: apply appearance from persisted settings and
		* contribute a settings section ("界面设置").
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "interface-settings: dictionaries");
			const t = ctx.locale.bind(NS);
			const settings = loadSettings();
			if (!hasDesktopBridge()) {
				applyWallpaperLayer(settings);
				applyGlassAndTransparency(settings);
				if (settings.splashMode !== "default") applySplashLayer(settings);
			}
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "interface-settings",
				order: 20,
				label: () => t("title"),
				locale: NS,
				/* v8 ignore next -- the inject face runs only at render time */
				inject: () => ({ t })
			}, SettingsPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map