import { _resetAllState as _resetCachedState } from './state';
import { _resetRequestState } from './request';
import { _resetGuardState } from './guard';

export type { CachedTintState, ReconcileOptions } from './types';
export {
  getCachedState,
  resetCachedState,
  setRefreshStatusBar,
  updateCachedState,
} from './state';
export { doReconcile } from './core';
export { enableReconcileGuard } from './guard';
export { cancelPendingReconcile, requestReconcile } from './request';

/**
 * Reset all reconcile module state: cached tint state, injected
 * callbacks, debounce timer, promise chain, and rate-limit
 * guard. Intended for test isolation only.
 */
export function _resetAllState(): void {
  _resetRequestState();
  _resetCachedState();
  _resetGuardState();
}
