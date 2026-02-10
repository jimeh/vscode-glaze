import { _resetAllState as _resetCachedState } from './state';
import { _resetRequestState } from './request';

export type { CachedTintState, ReconcileOptions } from './types';
export {
  getCachedState,
  resetCachedState,
  setRefreshStatusBar,
  updateCachedState,
} from './state';
export { doReconcile } from './core';
export { cancelPendingReconcile, requestReconcile } from './request';

/**
 * Reset all reconcile module state: cached tint state, injected
 * callbacks, debounce timer, and promise chain. Intended for
 * test isolation only.
 */
export function _resetAllState(): void {
  _resetRequestState();
  _resetCachedState();
}
