# Testing

Tests use `@vscode/test-cli` with Mocha. Test files live in `src/test/` and
follow the `*.test.ts` naming convention using `suite()` and `test()` functions.

## Running Tests

```bash
pnpm run test
```

The `pretest` script handles compilation automatically.

## Fixture Workspace

Tests run in a VSCode instance with a fixture workspace at
`src/test/fixtures/test-workspace/`.

## Running a Single Test

```bash
pnpm run compile-tests && pnpm exec vscode-test --grep "hash"
```

The `--grep` pattern matches against suite/test names.

`pnpm run test` is preferred because it runs `pretest`, which clears fixture
workspace settings before the test host starts. If you run `vscode-test`
directly, clear the fixture settings first:

```bash
rm -f src/test/fixtures/test-workspace/.vscode/settings.json
```

## Test Ordering

[Choma](https://www.npmjs.com/package/choma) randomizes suite and test
execution order on every run to surface leaky tests early. Set `CHOMA_SEED`
to reproduce a specific ordering:

```bash
CHOMA_SEED=s0pxg40XgN pnpm run test
```

## Config State Isolation

**Capture with `inspect()`, not `get()`**: `suiteSetup` blocks must capture
original config values via `config.inspect<T>(key)?.globalValue` (or
`?.workspaceValue` for workspace-scoped teardowns). Using `config.get()`
captures the effective/merged value across all scopes, which includes
contamination from other suites and permanently writes it back on teardown.

**Scope must match restore target**: if teardown restores to global scope, the
snapshot must come from `?.globalValue`; if teardown restores to workspace
scope, the snapshot must come from `?.workspaceValue`. Never snapshot teardown
state with `config.get()`.

**Reset all config you touch**: If a test sets a subset of related config
keys (e.g. only `elements.titleBar`), other keys (e.g. `elements.sideBar`)
may still hold stale values from a prior randomly-ordered test. Either reset
all related keys or explicitly set every key your test depends on.

**Clear shared state before asserting**: Tests that assert on
`workbench.colorCustomizations` being clean should clear it at the start,
since a prior test in the same suite may have seeded root-level keys.

## Config Propagation in Tests

VS Code's `config.update()` resolves when the write is persisted, but the
in-memory configuration cache may not have refreshed yet. Use
`updateConfig()` from `src/test/helpers.ts` instead of raw `config.update()`
in test bodies to wait for `onDidChangeConfiguration` before reading back
values. Teardown hooks that only restore values (no assertions after) can use
raw `config.update()` safely.

## Reconcile Guard in Tests

Extension tests run with `GLAZE_DISABLE_RECONCILE_GUARD=1`, which keeps the
reconcile guard disabled by default and avoids random-order guard trips.
Guard-specific tests explicitly enable it in their own setup.

## Reconcile Runtime Isolation

Config changes and Glaze commands can enqueue debounced reconcile work
(`requestReconcile`) that outlives a test and leaks into the next one.

For suites that mutate any of the following, add per-test full-state resets:

- `glaze.*` settings
- `workbench.colorCustomizations`
- `workbench.colorTheme` / `workbench.preferred*ColorTheme`
- `vscode.commands.executeCommand('glaze.*')`

Pattern:

```ts
import { _resetAllState } from '../../reconcile';

setup(() => {
  _resetAllState();
});

teardown(() => {
  _resetAllState();
});
```

Pure unit tests that do not touch extension runtime/config mutation paths do
not need this.

## Web Extension Tests

`@vscode/test-web` runs the extension in a browser-based VS Code host (headless
Chromium via Playwright) to verify the web bundle works correctly.

```bash
pnpm run test:web
```

The `pretest:web` script compiles the extension and builds the web test bundle
(`dist/web/test/index.js`) via `esbuild.test-web.js`.

### Architecture

Web tests reuse the same `*.test.ts` files as the Electron tests but are
bundled by esbuild (not compiled by tsc) because the browser has no filesystem
for Mocha to glob. The entry point at `src/test/web/index.ts` statically
imports each test file and runs Mocha's browser build.

The esbuild config (`esbuild.test-web.js`) aliases Node built-ins to browser
polyfills (`assert`, `util`, `process`, `path-browserify`) and uses the same
`webPlatformPlugin` as the main web build to redirect `platform/sha256` to its
`.web.ts` variant.

### Included Tests (Phase 1)

Only pure unit tests with no Node API dependencies beyond `assert`:
`color/blend/*`, `color/convert`, `color/naming`, `color/styles`, `color/tint`,
`config/validate`, `preview/*`, `status/*`, `theme/colors`, `theme/decode`,
`theme/detect`, `theme/name`, `webview/*`.

### Excluded Tests

- `color/hash` — `crypto.randomBytes`
- `extension` — `util.isDeepStrictEqual`
- `workspace/path`, `workspace/identifier` — `os.homedir()` expectations
- `theme/osColorScheme` — OS color scheme detection
- Integration tests (`config/index`, `commands/*`, `reconcile/*`, `settings/*`,
  `statusBar/*`) — need reconcile guard and `_resetAllState()` investigation

### Adding Web Tests

To include a new test file in the web runner, add an `await import()` call in
`src/test/web/index.ts`. The file is excluded from tsc via `tsconfig.json`
(only esbuild processes it).

## Test Coverage

```bash
pnpm run test:coverage
```

Generate HTML and lcov reports in `coverage/`:

```bash
pnpm run test:coverage:html
```

## Script Tests

The `extract-theme-colors` script has its own tests using Node.js built-in test
runner (`node:test`) with `node:assert/strict`. Tests live in
`scripts/extract-theme-colors/__tests__/`.

```bash
pnpm run test:scripts
```

These run independently from the VS Code extension tests — no Electron runtime
needed. They use `tsx` as the TypeScript loader.

### Running a Single Script Test

```bash
node --import tsx --test --test-reporter spec --test-name-pattern "parseTheme" 'scripts/extract-theme-colors/__tests__/**/*.test.ts'
```
