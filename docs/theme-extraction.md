# Theme Color Extraction

The `scripts/extract-theme-colors/` script fetches popular VSCode themes from
the marketplace and extracts their background colors for theme-aware blending.

## Commands

```bash
pnpm run extract-themes           # Generate theme files
pnpm run extract-themes:dry-run   # Preview without writing
pnpm run extract-themes:verbose   # Verbose output
```

## Generated Files

Output is two compact TypeScript data files:

- `src/theme/generated/builtins.ts` — Built-in VS Code themes
- `src/theme/generated/extensions.ts` — Marketplace extension themes

The `src/theme/generated/extensions/` directory contains `.meta.json` cache
files used by the extraction script to avoid re-downloading unchanged themes.
These are not consumed at runtime.

All generated files are auto-generated and should not be manually edited.

## Adding Themes

Add themes to `scripts/extract-theme-colors/pinned.ts` to ensure specific
themes are always included.
