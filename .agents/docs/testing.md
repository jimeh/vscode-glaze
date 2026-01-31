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

## Test Coverage

```bash
pnpm run test:coverage
```

Generate HTML and lcov reports in `coverage/`:

```bash
pnpm run test:coverage:html
```
