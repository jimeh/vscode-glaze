# Architecture

## Data Flow

1. **extension.ts** — Entry point, registers commands and event listeners.
   Calls `applyTint()` on activation and configuration/theme changes.

2. **workspace/** — Derives workspace identifier from folder path/name based on
   user config (`name`, `pathRelativeToHome`, `pathAbsolute`, or
   `pathRelativeToCustom`).

3. **config/** — Reads Patina settings from VSCode configuration API. Three
   config groups: workspace identifier, tint targets, and theme settings.

4. **color/** — Core color generation:
   - `hash.ts` — Deterministic hash from workspace identifier
   - `palette.ts` — Generates color palette from hash, with different
     saturation/lightness configs per theme kind (dark/light/highContrast)
   - `blend.ts` — Blends generated colors with theme background for integration

5. **theme/** — Theme detection and background color lookup:
   - `detect.ts` — Gets current theme context (kind, name, background)
   - `colors.ts` — Aggregates theme colors from generated files and user config
   - `name.ts` — Extracts theme name from VSCode
   - `generated/` — Auto-generated theme color definitions (do not edit)

6. **settings/** — Writes color customizations to VSCode settings:
   - `colorCustomizations.ts` — Manages `workbench.colorCustomizations`
   - `mergeColorCustomizations()` — Merges Patina colors with existing user
     customizations, preserving non-Patina keys
   - `removePatinaColors()` — Removes all Patina-managed keys when disabling

## Key Concepts

- Colors are generated from a hash of the workspace identifier, producing the
  same hue for the same workspace
- The `ThemeContext` carries theme type, name, and colors for blending
- `TintTarget` determines which UI elements receive colors (titleBar, statusBar,
  activityBar)
- Colors are written to `.vscode/settings.json` via
  `workbench.colorCustomizations`

## Finding Things

- Modules: barrel exports in `src/*/index.ts`
- Config reading: grep `config.get<` or `config.inspect<`
- Color gen: grep `hashString`, `generatePalette`, `blendWithTheme`
- Theme lookup: grep `getThemeInfo`, `BUILTIN_THEMES`
- Settings mutation: grep `mergeColorCustomizations`
