# Patina

Subtle color tints for VS Code windows based on your workspace — visually
distinguish between projects at a glance.

## Features

- **Automatic color generation** — Each workspace gets a unique color tint
  derived from its directory path
- **Theme-aware blending** — Colors adapt to your active VS Code theme,
  working seamlessly with both light and dark themes
- **Multiple color schemes** — Choose from Pastel, Vibrant, Muted, or
  Monochrome palettes
- **Configurable UI elements** — Apply tints to title bar, status bar, sidebar,
  and more
- **Deterministic colors** — The same workspace path always produces the same
  color, so your projects look consistent across sessions

## How It Works

### Color Generation

Patina generates colors using a stable hash of your workspace's directory path.
This means:

- The same project always gets the same color
- Different projects get visually distinct colors
- Colors appear random but are completely reproducible
- No configuration needed — it just works

### Theme Blending

When applying tints, Patina detects your active VS Code color theme and blends
the generated tint with the theme's background colors. This ensures:

- Tints look natural with any theme
- Text remains readable
- The aesthetic quality of your theme is preserved
- Automatic re-adaptation when you switch themes

### Implementation

Patina modifies `.vscode/settings.json` in your workspace, using VS Code's
`workbench.colorCustomizations` to apply color overrides. This approach is:

- Non-destructive — only patina-specific colors are added/updated
- Workspace-scoped — your global settings remain untouched

## Installation

### From Marketplace

Search for "Patina" in the VS Code Extensions view (`Cmd+Shift+X` /
`Ctrl+Shift+X`), or install directly from the
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=jimeh.patina).

### Manual Installation

1. Download the `.vsix` file from the
   [releases page](https://github.com/jimeh/vscode-patina/releases)
2. Run `code --install-extension patina-x.x.x.vsix`

## Configuration

### Settings

| Setting              | Default        | Description                                                  |
| -------------------- | -------------- | ------------------------------------------------------------ |
| `patina.enabled`     | `true`         | Enable or disable Patina                                     |
| `patina.colorScheme` | `"pastel"`     | Color palette: `pastel`, `vibrant`, `muted`, or `monochrome` |
| `patina.elements`    | `["titleBar"]` | UI elements to tint                                          |
| `patina.intensity`   | `0.5`          | How strongly the tint is applied (0.0–1.0)                   |
| `patina.saturation`  | `0.5`          | Color saturation level (0.0–1.0)                             |

### Color Schemes

- **Pastel** (default) — Soft, muted tones that blend gently with any theme
- **Vibrant** — Higher saturation for bolder, more noticeable colors
- **Muted** — Desaturated, subtle tones for minimal visual impact
- **Monochrome** — Grayscale tints only, for a uniform look

## Supported UI Elements

Configure which parts of the VS Code interface receive the tint:

| Element | Description |
|---------|-------------|
| `titleBar` | Window title bar (default, enabled) |
| `statusBar` | Bottom status bar |
| `activityBar` | Left-side icon bar |
| `sidebar` | Explorer, search, and other side panels |
| `editorBackground` | Main editor area background |
| `tabs` | Editor tab bar |
| `commandPalette` | Command palette dropdown |
| `panel` | Bottom panel (terminal, output, problems, etc.) |

Example configuration to tint multiple elements:

```json
{
  "patina.elements": ["titleBar", "statusBar", "activityBar"]
}
```

## Commands

Access these from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| `Patina: Enable` | Enable Patina for the current workspace |
| `Patina: Disable` | Disable Patina and remove color customizations |
| `Patina: Refresh` | Regenerate colors (useful after theme changes) |

## FAQ

### Why does Patina modify my workspace settings?

VS Code's color customization API requires settings to be stored somewhere.
Workspace-level settings ensure each project gets its own unique tint without
affecting other projects or your global configuration.

### Can I exclude the settings from version control?

Yes. Add `.vscode/settings.json` to your `.gitignore`, or use the more
selective approach of committing the file but having team members override
locally.

### How do I completely remove Patina's changes?

Run the `Patina: Disable` command, which removes all patina-related color
customizations from your workspace settings.

### Does Patina work with Remote Development?

Yes. Patina runs in the VS Code window and applies tints based on the workspace
path, regardless of whether the workspace is local or remote.

## Roadmap

Planned features and enhancements:

- [ ] Custom color overrides per workspace
- [ ] Color preview/picker command

## Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/jimeh/vscode-patina.git
cd vscode-patina

# Install dependencies
pnpm install

# Compile and watch for changes
pnpm run watch

# Run tests
pnpm run test

# Package for distribution
pnpm run package
```

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to launch the Extension Development Host
3. The extension will be active in the new window

## License

[MIT](LICENSE)
