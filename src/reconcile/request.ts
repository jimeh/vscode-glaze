import { log } from '../log';
import type { ReconcileOptions } from './types';
import { doReconcile } from './core';

/** Debounce delay in ms for reconcile operations. */
const DEBOUNCE_MS = 75;

/** Promise chain ensuring only one reconcile runs at a time. */
let reconcileChain: Promise<void> = Promise.resolve();

/** Debounce timer for requestReconcile(). */
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

/** Sticky force flag — once set, persists until consumed. */
let pendingForce = false;

/**
 * Request a reconcile. Resets the debounce timer; the actual
 * reconcile is enqueued onto the promise chain after the delay.
 * The force flag is sticky: once set during a debounce window
 * it persists until the reconcile consumes it.
 */
export function requestReconcile(options?: ReconcileOptions): void {
  if (options?.force) {
    pendingForce = true;
  }
  log.debug('Reconcile queued', { force: pendingForce });
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    const force = pendingForce;
    pendingForce = false;
    reconcileChain = reconcileChain.then(() =>
      doReconcile({ force }).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        log.error('Reconcile error:', message);
      })
    );
  }, DEBOUNCE_MS);
}

/** Cancel any pending debounced reconcile (for deactivation). */
export function cancelPendingReconcile(): void {
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
}

/**
 * Reset all request module state. Cancels any pending debounce
 * timer, clears the sticky force flag, and resets the promise
 * chain. Intended for test isolation only.
 */
export function _resetRequestState(): void {
  cancelPendingReconcile();
  pendingForce = false;
  reconcileChain = Promise.resolve();
}
