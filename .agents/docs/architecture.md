# Architecture

## Data Flow

1. **extension** — Entry point, registers commands and event listeners.
   Calls `requestReconcile()` on activation and configuration/theme changes.
   Reconcile requests are debounced and flow into `doReconcile()`.
   Runtime enables the reconcile guard by default; tests can disable it via
   `GLAZE_DISABLE_RECONCILE_GUARD=1`.

2. **workspace** — Derives workspace identifier from folder path/name based
   on user config (`name`, `pathRelativeToHome`, `pathAbsolute`, or
   `pathRelativeToCustom`). Remote workspaces (SSH, WSL, Dev Containers)
   are detected via `uri.authority`/`uri.scheme` and prefixed with the
   remote authority for uniqueness. Remote home directory is inferred
   heuristically (grep `inferRemoteHome`) or configured via setting.

3. **config** — Reads Glaze settings from VSCode configuration API
   (grep `config.get<` or `config.inspect<`). Six config groups:
   workspace identifier, tint, elements, theme, status bar, enable/disable.

4. **color** — Core color generation pipeline:
   - Deterministic hash → base hue (grep `computeBaseHue`)
   - Style resolvers control saturation/lightness (grep `StyleResolver`)
   - Harmony configs control per-element hue offsets (grep `HarmonyConfig`)
   - Theme blending in OKLCH space (grep `blendDirectedOklch`)
   - Color naming via nearest-color matching (grep `getColorName`)
   - Entry point: grep `computeTint`

5. **theme** — Theme detection and background color lookup:
   - Theme context: type (dark/light/hcDark/hcLight), name, colors
     (grep `ThemeContext`, `getThemeInfo`)
   - Color key metadata: `COLOR_KEY_DEFINITIONS`, `GLAZE_MANAGED_KEYS`
     (single source of truth for all managed color keys)
   - `generated/` dirs contain auto-generated theme data (do not edit)

6. **settings** — Writes color customizations to VSCode settings:
   - Merges Glaze colors with existing user customizations
     (grep `mergeColorCustomizations`)
   - Ownership marker `glaze.active` tracks whether Glaze owns settings
     (grep `GLAZE_ACTIVE_KEY`)

7. **preview** — Palette preview webview (colors, style/harmony comparisons)

8. **status** — Status info webview (current Glaze state)

9. **statusBar** — Status bar item (paintcan icon, QuickPick menu)

## Key Concepts

- Colors are generated from a hash of the workspace identifier, producing
  the same hue for the same workspace
- Two orthogonal color axes:
  - **Color style** (6): controls saturation and lightness per element
    (neon, vibrant, pastel, muted, tinted, adaptive)
  - **Color harmony** (9): controls per-element hue offsets from the base
    hue (uniform, accent, gradient, analogous, undercurrent, duotone,
    split-complementary, triadic, tetradic)
- 4 theme types: dark, light, hcDark, hcLight
- `ThemeContext` carries `type` (theme's own type from database) and
  `tintType` (resolved type used for tinting), plus name and colors
- Per-target blend factor overrides allow different blending per UI element
  (titleBar, statusBar, activityBar, sideBar)
- `TintTarget` determines which UI elements receive colors
- Theme blending uses a pre-calculated majority hue direction (CW/CCW)
  from the base hue to ensure all elements blend consistently
- Colors are written to `.vscode/settings.json` via
  `workbench.colorCustomizations`
- Ownership marker (`glaze.active`) detects external modifications to
  Glaze-managed settings

## Finding Things

- Modules: barrel exports — grep for `index.ts` re-exports
- Config reading: grep `config.get<` or `config.inspect<`
- Color gen: grep `computeTint`, `computeBaseHue`, `blendDirectedOklch`
- Color key metadata: grep `COLOR_KEY_DEFINITIONS`, `GLAZE_MANAGED_KEYS`
- Color styles: grep `COLOR_STYLE_DEFINITIONS`, `StyleConfig`,
  `StyleResolver`
- Color harmonies: grep `COLOR_HARMONY_DEFINITIONS`, `HARMONY_CONFIGS`,
  `HarmonyConfig`
- Theme lookup: grep `getThemeInfo`
- Settings mutation: grep `mergeColorCustomizations`
- Ownership marker: grep `GLAZE_ACTIVE_KEY`
