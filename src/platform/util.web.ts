/**
 * Web implementation of the `util` platform wrapper.
 *
 * Minimal `promisify` that wraps a Node-style callback function
 * into a Promise-returning function. Only used to promisify the
 * `child_process.exec` web stub.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function promisify(
  fn: Function
): (...args: unknown[]) => Promise<unknown> {
  return (...args: unknown[]) =>
    new Promise((resolve, reject) => {
      fn(...args, (err: unknown, result: unknown) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
}
