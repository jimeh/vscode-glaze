# Glaze

VSCode extension that applies color tints to editor windows based on workspace.

- **Package manager**: pnpm
- **Commit style**: [Conventional Commits](https://conventionalcommits.org/)
- **Pre-PR**: `pnpm run compile && pnpm run test`
- **Lint fix**: `pnpm run lint:fix`

## Docs

- [Architecture](.agents/docs/architecture.md) — Data flow, modules, concepts
- [Testing](.agents/docs/testing.md) — Running tests, patterns
- [Build](.agents/docs/build.md) — esbuild, output dirs
- [Theme Extraction](.agents/docs/theme-extraction.md)

## TypeScript Style

Oxfmt enforces formatting (Prettier-compatible). Key rules:

- Single quotes, semicolons
- Trailing commas in multi-line constructs (es5)
- 80 char print width
- 2-space indentation

**Always run `pnpm run format` after writing/editing TypeScript files and before
running `pnpm run compile` or `pnpm run test`.** The `compile` task includes an
oxfmt check that will fail on unformatted code.

## Conventions

- Barrel exports per module — grep `index.ts` for re-exports
- Use `GLAZE_MANAGED_KEYS`, don't hardcode color keys
- Readonly/immutable patterns throughout
- Don't edit `generated/` dirs — grep for `auto-generated` file headers
- Platform-specific code goes in `src/platform/` with `.web.ts` variants;
  `src/shims/` contains degraded stubs for Node built-ins on web
- For test changes, follow `.agents/docs/testing.md` isolation rules:
  `inspect().<scope>Value` snapshots, `updateConfig()` for asserted writes, and
  `_resetAllState()` setup/teardown in config/command-driven suites.
