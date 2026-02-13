/**
 * Web stub for Node's `child_process` module.
 *
 * `exec` immediately invokes the callback with an error so that
 * `promisify(exec)(...)` rejects. `osColorScheme.ts` catches this
 * and returns `undefined` — graceful degradation on web.
 */
export function exec(...args: unknown[]): void {
  const cb = args[args.length - 1];
  if (typeof cb === 'function') {
    (cb as (err: Error) => void)(
      new Error('child_process is not available in web')
    );
  }
}
