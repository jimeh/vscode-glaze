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

## Config Propagation in Tests

VS Code's `config.update()` resolves when the write is persisted, but the
in-memory configuration cache may not have refreshed yet. Use
`updateConfig()` from `src/test/helpers.ts` instead of raw `config.update()`
in test bodies to wait for `onDidChangeConfiguration` before reading back
values. Teardown hooks that only restore values (no assertions after) can use
raw `config.update()` safely.

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
