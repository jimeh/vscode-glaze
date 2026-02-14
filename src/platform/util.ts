/**
 * Platform wrapper for Node's `util` module.
 *
 * Node build — delegates to the native `util` module.
 * Web build — the .web.ts variant provides a minimal `promisify`
 * that wraps Node-style callbacks into Promises.
 */
export { promisify } from 'util';
