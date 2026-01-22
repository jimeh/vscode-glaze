# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Patina is a VSCode extension that applies subtle color tints to editor windows
based on the open project, helping users visually distinguish between different
workspaces.

## Development Commands

```bash
# Install dependencies
pnpm install

# Compile (type-check + lint + build)
pnpm run compile

# Watch mode for development (runs esbuild and tsc in parallel)
pnpm run watch

# Type checking only
pnpm run check-types

# Lint
pnpm run lint

# Run tests (requires compile-tests first)
pnpm run test

# Production build
pnpm run package
```

## Testing

Tests use `@vscode/test-cli` with Mocha. Test files live in `src/test/` and
follow the `*.test.ts` naming convention.

To run tests:
1. Tests are compiled to `out/test/` via `pnpm run compile-tests`
2. `pnpm run test` runs the compiled tests in a VSCode instance

## Build System

- **esbuild** bundles the extension into `dist/extension.js`
- Entry point: `src/extension.ts`
- Output format: CommonJS (required by VSCode)
- The `vscode` module is externalized (provided by VSCode at runtime)

## Project Structure

- `src/extension.ts` - Main extension entry point with `activate()` and
  `deactivate()` lifecycle functions
- `src/test/` - Test files
- `dist/` - Compiled extension output (gitignored)
- `out/` - Compiled test output (gitignored)

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```text
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
