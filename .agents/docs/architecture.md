# Architecture

## Data Flow

1. **extension.ts** — Entry point, registers commands and event listeners.
   Calls `applyTint()` on activation and configuration/theme changes.

2. **workspace/** — Derives workspace identifier from folder path/name based
   on user config (`name`, `pathRelativeToHome`, `pathAbsolute`, or
   `pathRelativeToCustom`).

3. **config/** — Reads Patina settings from VSCode configuration API. Six
   config groups:
   - Workspace identifier (`source`, `customBasePath`, `multiRootSource`)
   - Tint (`colorStyle`, `colorHarmony`, `mode`, `seed`)
   - Elements (titleBar, statusBar, activityBar, sideBar toggles)
   - Theme (`blendFactor` + per-target blend factor overrides)
   - Status bar (`enabled` toggle)
   - Plus global/workspace enable/disable flags

4. **color/** — Core color generation:
   - `hash.ts` — Deterministic hash from workspace identifier
   - `tint.ts` — Main entry point: `computeTint()` computes all managed
     palette keys with style, harmony, and theme blending
   - `blend.ts` — Blends generated colors with theme background in OKLCH
     space, with directed hue interpolation
   - `convert.ts` — Color space conversions (hex/RGB/HSL/Oklch)
   - `naming.ts` — Human-readable color names via nearest-color matching
   - `types.ts` — Color type definitions
   - `hue.ts` — Hue offset application helper
   - `styles/` — 6 color style implementations controlling
     saturation/lightness (neon, vibrant, pastel, muted, tinted, adaptive)
   - `harmony/` — 5 color harmony definitions controlling per-element hue
     distribution (uniform, duotone, undercurrent, analogous, triadic)

5. **theme/** — Theme detection and background color lookup:
   - `detect.ts` — Gets current theme context (type, name, background)
   - `colors.ts` — Aggregates theme colors from generated files and user
     config
   - `name.ts` — Extracts theme name from VSCode
   - `colorKeys.ts` — `COLOR_KEY_DEFINITIONS`, `PATINA_MANAGED_KEYS`, and
     derived types (single source of truth for all color key metadata)
   - `osColorScheme.ts` — OS light/dark color scheme detection
   - `decode.ts` — Compact theme data decoding
   - `types.ts` — `ThemeType`, `ThemeContext` definitions
   - `generated/` — Auto-generated theme color definitions (do not edit):
     `builtins.ts` + `extensions.ts` (compact data files). The
     `extensions/` subdir holds `.meta.json` cache files used by the
     extraction script.

6. **settings/** — Writes color customizations to VSCode settings:
   - `colorCustomizations.ts` — Manages `workbench.colorCustomizations`
   - `mergeColorCustomizations()` — Merges Patina colors with existing user
     customizations, preserving non-Patina keys
   - `removePatinaColors()` — Removes all Patina-managed keys when
     disabling
   - `hasPatinaColorsWithoutMarker()` — Detects external modifications to
     Patina-managed color keys
   - Ownership marker (`patina.active` key in colorCustomizations) to
     track whether Patina owns the current settings

7. **preview/** — Palette preview webview panel (shows generated colors,
   style comparisons, and harmony comparisons)

8. **status/** — Status info webview panel (shows current Patina state)

9. **statusBar/** — Status bar item management (paintcan icon, QuickPick
   menu)

## Key Concepts

- Colors are generated from a hash of the workspace identifier, producing
  the same hue for the same workspace
- Two orthogonal color axes:
  - **Color style** (6): controls saturation and lightness per element
    (neon, vibrant, pastel, muted, tinted, adaptive)
  - **Color harmony** (5): controls per-element hue offsets from the base
    hue (uniform, duotone, undercurrent, analogous, triadic)
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
- Ownership marker (`patina.active`) detects external modifications to
  Patina-managed settings

## Finding Things

- Modules: barrel exports in `src/*/index.ts`
- Config reading: grep `config.get<` or `config.inspect<`
- Color gen: grep `computeTint`, `computeBaseHue`, `blendDirectedOklch`
- Color key metadata: `COLOR_KEY_DEFINITIONS`, `PATINA_MANAGED_KEYS` in
  `src/theme/colorKeys.ts`
- Color styles: grep `COLOR_STYLE_DEFINITIONS`, `StyleConfig`,
  `StyleResolver`
- Color harmonies: grep `COLOR_HARMONY_DEFINITIONS`, `HARMONY_CONFIGS`,
  `HarmonyConfig`
- Theme lookup: grep `getThemeInfo`
- Settings mutation: grep `mergeColorCustomizations`
- Ownership marker: `PATINA_ACTIVE_KEY` in `src/settings/`
