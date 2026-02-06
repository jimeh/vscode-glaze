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
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    const force = pendingForce;
    pendingForce = false;
    reconcileChain = reconcileChain.then(() =>
      doReconcile({ force }).catch((err) =>
        console.error('[Patina] reconcile error:', err)
      )
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
