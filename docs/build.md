# Build System

## Extension Bundle

**esbuild** bundles `src/extension.ts` → `dist/extension.js` (CommonJS)

The `vscode` module is externalized (provided by VSCode at runtime).

## Commands

```bash
pnpm run compile       # Type-check + lint + build
pnpm run watch         # Watch mode (esbuild + tsc in parallel)
pnpm run check-types   # Type checking only
pnpm run lint          # ESLint
pnpm run package       # Production build
```

## Test Compilation

Tests compile separately via `tsc` to `out/` directory.
