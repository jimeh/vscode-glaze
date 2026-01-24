#!/bin/bash

# Compile tests
pnpm run compile-tests &> /dev/null

# Then execute whatever command was passed to us
exec "$@"
