<div align="center">

<img width="196px" src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/logo.png" alt="Logo">

# Glaze

**Subtle, automatic color tints for your VS Code windows.**

[![Latest Release](https://img.shields.io/github/release/jimeh/vscode-glaze.svg)](https://github.com/jimeh/vscode-glaze/releases)
[![VSCode](https://img.shields.io/badge/Marketplace-blue.svg?logoColor=white&logo=data:image/svg%2bxml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtOTkuOTkgOS41NXY4My4zM3MtMjMuOCA5LjUxLTIzLjggOS41MWwtNDEuNjktNDAuNDYtMjUuMDIgMTkuMDUtOS40OC00Ljc1di01MHM5LjUzLTQuNzkgOS41My00Ljc5bDI1LjA0IDE5LjA2IDQxLjYtNDAuNSAyMy44MyA5LjU1em0tMjYuMjYgMjMuODgtMjMuOCAxNy43OSAyMy44MSAxNy45M3YtMzUuNzJ6bS02MS45NCA3LjA3djIxLjRzMTEuOS0xMC43NyAxMS45LTEwLjc3bC0xMS45MS0xMC42M3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=)][vscode-ext]
[![OpenVSX](https://img.shields.io/badge/OpenVSX-purple.svg?logoColor=white&logo=data:image/svg%2bxml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTMxIDEzMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmIj48cGF0aCBkPSJtNDIuOCA0My4zNSAyMi42LTM5LjJoLTQ1LjN6bS0yNS40IDQ0LjNoNDUuM2wtMjIuNy0zOS4xem01MSAwIDIyLjYgMzkuMiAyMi42LTM5LjJ6Ii8+PHBhdGggZD0ibTY1LjQgNC4xNS0yMi42IDM5LjJoNDUuMnptLTI1LjQgNDQuNCAyMi43IDM5LjEgMjIuNi0zOS4xem01MSAwLTIyLjYgMzkuMWg0NS4yeiIvPjwvZz48L3N2Zz4=)][openvsx-ext]
[![GitHub Issues](https://img.shields.io/github/issues/jimeh/vscode-glaze.svg)](https://github.com/jimeh/vscode-glaze/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/jimeh/vscode-glaze.svg)](https://github.com/jimeh/vscode-glaze/pulls)
[![License](https://img.shields.io/github/license/jimeh/vscode-glaze.svg)](https://github.com/jimeh/vscode-glaze/blob/main/LICENSE)

</div>

[vscode-ext]: https://marketplace.visualstudio.com/items?itemName=jimeh.glaze
[openvsx-ext]: https://open-vsx.org/extension/jimeh/glaze
[workspace-config-plus]: https://marketplace.visualstudio.com/items?itemName=swellaby.workspace-config-plus

Ever lost track of which VS Code window is which? Glaze attempts to solve this
by giving each workspace a unique color tint derived from its directory path.
The colors blend with your current theme's colors, so your editor still looks
great, just subtly different per project.

![dark](https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/titlebar-dark.png)
![light](https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/titlebar-light.png)

## How It Works

Glaze generates a stable color from a hash of your workspace's directory path,
meaning the same project always gets the same tint. These colors are
intelligently blended with your active VS Code theme's color, so they look
natural with both light and dark themes in all manners of colors. When you
switch themes, Glaze automatically re-adapts.

## Important: Workspace Settings

> [!CAUTION]
>
> **Glaze modifies your project/workspace `.vscode/settings.json` file.**

To apply color tints, Glaze writes to the `workbench.colorCustomizations`
section of your workspace's `.vscode/settings.json`. This is the only mechanism
VS Code provides for programmatic color customization.

A few things to know:

- **Non-destructive** — Glaze only manages its own specific color keys.
  Existing color customizations are left untouched.
- **Disabled by default** — Because of the settings file modification, Glaze
  ships disabled. You must explicitly enable it after installation.
- **Fully reversible** — Disabling Glaze cleanly removes all of its color
  entries from your workspace settings.

If your `.vscode/settings.json` is checked into version control, consider using
the [Workspace Config+][workspace-config-plus] extension. It lets you split
workspace settings into a `settings.shared.json` and `settings.local.json`
files, which get automatically merged into `settings.json`. Then add both
`settings.json` and `settings.local.json` to your `.gitignore`.

## Getting Started

### 1. Install

Search for **"Glaze"** in the VS Code Extensions view (<kbd>Cmd+Shift+X</kbd> /
<kbd>Ctrl+Shift+X</kbd>), install from the [VS Code Marketplace][vscode-ext] /
[OpenVSX Registry][openvsx-ext], or via the command line:

```bash
code --install-extension jimeh.glaze
```

### 2. Enable

Open the Command Palette (<kbd>Cmd+Shift+P</kbd> / <kbd>Ctrl+Shift+P</kbd>)
and run one of:

- **`Glaze: Enable Globally`**: Enables Glaze for all workspaces.
- **`Glaze: Enable for This Workspace`**: Enables Glaze only for the
  current workspace.

That's it, your title bar, activity bar, and status bar should all be color
tinted. You can enabled/disable tinting of all elements individually.

### 3. Explore

The status bar shows Glaze's current state. Click it to open the Quick Menu
for toggling, previewing colors, and randomizing your tint seed.

## Configuration

Glaze has extensive configuration options covering color styles, color
harmonies, UI element selection, theme blend modes, and workspace identifier
sources. The easiest way to explore all available settings is through the
VS Code Settings UI:

1. Open Settings (<kbd>Cmd+,</kbd> / <kbd>Ctrl+,</kbd>)
2. Search for `@ext:jimeh.glaze`

All settings include descriptions and sensible defaults.

## Theme Color Matching

VS Code's extension API does not expose the active theme's resolved color
values. To blend tints naturally with your theme, Glaze needs to know the
theme's background colors, so it ships with a precomputed lookup table mapping
theme names to their colors.

The lookup table is generated from:

- **All built-in VS Code themes** extracted from the latest VS Code release.
- **The top 250 most-installed theme extensions** from both the
  [VS Code Marketplace](https://marketplace.visualstudio.com/) and the
  [OpenVSX Registry](https://open-vsx.org/), merged and deduplicated.

If your theme isn't in the lookup table, you can provide its colors manually via
the `glaze.theme.colors` setting. See the setting's description in the VS Code
Settings UI for the expected format. You can also
[open an issue](https://github.com/jimeh/vscode-glaze/issues) to request that
a specific theme be added to the built-in lookup table.

## Commands

Access these from the Command Palette (<kbd>Cmd+Shift+P</kbd> /
<kbd>Ctrl+Shift+P</kbd>):

| Command                             | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `Glaze: Enable Globally`            | Enable Glaze for all workspaces                |
| `Glaze: Disable Globally`           | Disable Glaze for all workspaces               |
| `Glaze: Enable for This Workspace`  | Enable Glaze for the current workspace only    |
| `Glaze: Disable for This Workspace` | Disable Glaze for the current workspace only   |
| `Glaze: Show Status`                | Display current Glaze status and configuration |
| `Glaze: Show Color Palette Preview` | Preview the generated color palette            |
| `Glaze: Randomize Tint Seed`        | Randomize the seed to get a different color    |
| `Glaze: Reset Tint Seed`            | Reset the seed back to the default             |

## Screenshots

<table>
  <tr>
    <th align="center" width="50%">Dark</th>
    <th align="center" width="50%">Light</th>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/dark-themes.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/light-themes.png"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/statusbar-dark.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/statusbar-light.png"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/titlebarhalf-dark.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/titlebarhalf-light.png"></td>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/colornames-dark.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/colornames-light.png"></td>
  </tr>
</table>

<table>
  <tr>
    <th align="center" width="50%">High Contrast Dark</th>
    <th align="center" width="50%">High Contrast Light</th>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/hc-dark-themes.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/hc-light-themes.png"></td>
  </tr>
</table>

<table>
  <tr>
    <th align="center" width="50%">Style: Vibrant</th>
    <th align="center" width="50%">Style: Neon</th>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/vibrant-themes.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/neon-themes.png"></td>
  </tr>
</table>

<table>
  <tr>
    <th align="center" width="50%">Harmony: Analogous</th>
    <th align="center" width="50%">Harmony: Accent</th>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/analogous-themes.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/accent-themes.png"></td>
  </tr>
</table>

<table>
  <tr>
    <th align="center" width="50%">Color Styles</th>
    <th align="center" width="50%">Color Harmonies</th>
  </tr>
  <tr>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/color-style.png"></td>
    <td><img src="https://github.com/jimeh/vscode-glaze/raw/refs/heads/main/img/screenshots/color-harmony.png"></td>
  </tr>
</table>

## FAQ

### Can I exclude Glaze's changes from version control?

Use the [Workspace Config+][workspace-config-plus] extension to split shared
settings into `settings.shared.json` (version controlled) while keeping
`settings.json` and `settings.local.json` in your `.gitignore`.

### How do I completely remove Glaze's color changes?

Run **`Glaze: Disable Globally`** or **`Glaze: Disable for This Workspace`**
from the Command Palette. This removes all Glaze-managed color entries from
your workspace settings.

### Does it work with Remote Development?

Yes. Glaze runs in the VS Code UI and applies tints based on the workspace
path, regardless of whether the workspace is local or remote.

## License

[MIT](LICENSE)
