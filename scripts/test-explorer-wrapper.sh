#!/bin/bash

# Remove stale test workspace settings that can cause test failures
rm -f src/test/fixtures/test-workspace/.vscode/settings.json

# Compile tests
pnpm run compile-tests &> /dev/null

# Then execute whatever command was passed to us
exec "$@"
