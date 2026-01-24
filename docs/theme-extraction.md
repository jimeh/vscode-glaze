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

Output goes to `src/theme/generated/extensions/` with one TypeScript file per
extension. These are auto-generated and should not be manually edited.

## Adding Themes

Add themes to `scripts/extract-theme-colors/pinned.ts` to ensure specific themes
are always included.
