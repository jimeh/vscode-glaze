/**
 * Platform wrapper for Node's `os` module.
 *
 * Node build — delegates to the native `os` module.
 * Web build — the .web.ts variant returns `''`, so callers like
 * `expandTilde` fall back to the absolute path.
 */
export { homedir } from 'os';
