# Build System

## Extension Bundle

**esbuild** produces two bundles from `src/extension.ts` (CommonJS):

- `dist/extension.js` — Node build (`platform: 'node'`)
- `dist/web/extension.js` — Web build (`platform: 'browser'`)

The `vscode` module is externalized (provided by VSCode at runtime).

### Web build

The web build uses `path-browserify` for path operations. Platform-specific code
lives in `src/platform/` with `.web.ts` variants; the `webPlatformPlugin` in
`esbuild.js` redirects imports to the web variant at bundle time.

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
