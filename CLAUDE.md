# Patina

VSCode extension that applies color tints to editor windows based on workspace.

- **Package manager**: pnpm
- **Commit style**: [Conventional Commits](https://conventionalcommits.org/)
- **Pre-PR**: `pnpm run compile && pnpm run test`
- **Lint fix**: `pnpm run lint:fix`

## Docs

- [Architecture](docs/architecture.md) — Data flow, modules, concepts
- [Testing](docs/testing.md) — Running tests, patterns
- [Build](docs/build.md) — esbuild, output dirs
- [Theme Extraction](docs/theme-extraction.md)

## Conventions

- Barrel exports per module — import from `src/module/`
- Use `PATINA_MANAGED_KEYS`, don't hardcode color keys
- Readonly/immutable patterns throughout
- Don't edit `src/theme/generated/` — auto-generated files
