import type { TintColors } from '../statusBar';

export interface ReconcileOptions {
  force?: boolean | undefined;
}

/**
 * Cached values from the last reconcile for cheap status bar
 * refreshes.
 */
export interface CachedTintState {
  workspaceIdentifier: string | undefined;
  tintColors: TintColors | undefined;
  customizedOutsidePatina: boolean;
  lastError?: string | undefined;
}
