/**
 * Platform wrapper for Node's `child_process` module.
 *
 * Node build — delegates to the native `child_process` module.
 * Web build — the .web.ts variant immediately invokes the callback
 * with an error so that `promisify(exec)(...)` rejects gracefully.
 */
export { exec } from 'child_process';
