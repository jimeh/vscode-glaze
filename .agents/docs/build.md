# Build System

## Extension Bundle

**esbuild** bundles `src/extension.ts` → `dist/extension.js` (CommonJS)

The `vscode` module is externalized (provided by VSCode at runtime).

## Commands

```bash
pnpm run compile       # Type-check + lint + build
pnpm run watch         # Watch mode (esbuild + tsc in parallel)
pnpm run check-types   # Type checking only
pnpm run lint          # oxlint + oxfmt check
pnpm run lint:fix      # oxlint auto-fix + oxfmt write
pnpm run format        # oxfmt write only
pnpm run package       # Production build
pnpm run generate-images  # Generate extension icon/images
pnpm run vsce:ls       # Bundle + list files that vsce would package
```

## Test Compilation

Tests compile separately via `tsc` to `out/` directory.
