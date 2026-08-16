# dsh-interface-settings

A **DeepSeek Harness front-end plugin** that brings wallpaper, area transparency, liquid-glass blur and splash screen together into one interface-settings panel.

- **No DSH source changes**: everything is injected via CSS variables and rules;
- **One settings panel**: wallpaper blur, glass blur, panel opacity, code-block opacity, transparency toggles, splash screen;
- **Same technique as the desktop shell** ([dsh-desktop](https://github.com/Qiongkura/dsh-desktop)): this plugin is the browser-side port of the desktop interface customization.

## Features

| Feature | Description |
| --- | --- |
| Wallpaper | Image wallpaper via `body::before` pseudo-element (negative z-index, non-blocking) |
| Sidebar wallpaper | Share main image, or set an independent image |
| Wallpaper blur | Slider (0-64px) |
| Composer liquid glass | `composerSeat::before` + `backdrop-filter`, own blur slider (0-64px) |
| Trajectory glass | Shares the same slider; smart saturation-based transparency (keeps timeline bars / status tags) |
| Panel opacity | Slider (0-90%) |
| Code block opacity | Slider (8-100%), including banner and inline code |
| Transparent areas | New session / Composer / Sidebar / Main toggles |
| Splash screen | Default / Follow theme / Custom (image); min duration, fade, click to skip |

## Install (no npm required, verified)

Copy the plugin into the DSH profile directory:

```bash
# 1) Copy the whole plugin directory (including lib/client.js, lib/index.js, package.json) to:
#    ~/.dsh/profiles/node_modules/dsh-interface-settings/

# 2) Append to ~/.dsh/profiles/web/cordis.patch.yml:
#    - insert:
#        - id: dsh-interface-settings
#          name: 'dsh-interface-settings'

# 3) Restart dsh web (or the desktop app; patch edits also hot-reload)
```

> ⚠️ Do **not** manually replace DSH-managed workspace links (junction/symlink) — that stalls the backend assembly. Workspace packages inside the DSH repo can simply be enabled via the patch above.

Then open **Settings → Interface Settings** to adjust the appearance. This path is verified: the plugin appears in the manifest and its bundle is served (HTTP 200).

## Developer (build inside the DSH monorepo)

This plugin is a DSH workspace plugin (peer deps are workspace packages):

```bash
# 1) Put this project at packages/client/interface-settings
# 2) Build the browser bundle
pnpm --filter dsh-interface-settings bundle
# 3) Enable the plugin in the host cordis.yml / plugin manifest
```

## License

[MIT](LICENSE)

## Contact

- GitHub: https://github.com/Qiongkura
- WeChat: Qiongkura
