# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Patina is a VSCode extension that applies subtle color tints to editor windows
based on the open project, helping users visually distinguish between different
workspaces. It generates deterministic colors from workspace paths and blends
them with the active theme.

## Development Commands

```bash
pnpm install              # Install dependencies
pnpm run compile          # Type-check + lint + build
pnpm run watch            # Watch mode (esbuild + tsc in parallel)
pnpm run check-types      # Type checking only
pnpm run lint             # ESLint
pnpm run test             # Run tests (auto-compiles first via pretest)
pnpm run package          # Production build
```

To run the extension in development: Open project in VSCode, press F5 to launch
Extension Development Host.

## Testing

Tests use `@vscode/test-cli` with Mocha. Test files live in `src/test/` and
follow the `*.test.ts` naming convention using `suite()` and `test()` functions.

Tests compile to `out/test/` and run in a VSCode instance. The `pretest` script
handles compilation automatically.

## Architecture

### Data Flow

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
   - `backgrounds.ts` — Maps known theme names to background colors
   - `name.ts` — Extracts theme name from VSCode

6. **settings/** — Writes color customizations to VSCode settings:
   - `colorCustomizations.ts` — Manages `workbench.colorCustomizations`
   - `mergeColorCustomizations()` — Merges Patina colors with existing user
     customizations, preserving non-Patina keys
   - `removePatinaColors()` — Removes all Patina-managed keys when disabling

### Key Concepts

- Colors are generated from a hash of the workspace identifier, producing the
  same hue for the same workspace
- The `ThemeContext` carries theme kind, name, and background color for blending
- `TintTarget` determines which UI elements receive colors (titleBar, statusBar,
  activityBar)
- Colors are written to `.vscode/settings.json` via
  `workbench.colorCustomizations`

## Build System

- **esbuild** bundles `src/extension.ts` → `dist/extension.js` (CommonJS)
- The `vscode` module is externalized (provided by VSCode at runtime)
- Tests compile separately via `tsc` to `out/` directory

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):
`<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
