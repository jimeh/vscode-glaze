/**
 * Web implementation of the `os` platform wrapper.
 *
 * When `homedir()` returns `''`, callers like `expandTilde` and
 * `pathRelativeToHome` fall back to the absolute path, which is
 * the correct behavior for web workspaces.
 */
export function homedir(): string {
  return '';
}
