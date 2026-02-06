import type { CachedTintState } from './types';

let cached: CachedTintState = {
  workspaceIdentifier: undefined,
  tintColors: undefined,
  customizedOutsidePatina: false,
};

/**
 * Callback to refresh the status bar. Injected by extension.ts
 * during activation to break the circular dependency between
 * reconcile and statusBar modules.
 */
let refreshStatusBarFn: (() => Promise<void>) | undefined;

/**
 * Inject the status bar refresh callback. Must be called once
 * during extension activation before any reconcile runs.
 */
export function setRefreshStatusBar(fn: () => Promise<void>): void {
  refreshStatusBarFn = fn;
}

/** Invoke the injected status bar refresh callback. */
export async function refreshStatusBar(): Promise<void> {
  await refreshStatusBarFn?.();
}

/** Read-only snapshot of the cached tint state. */
export function getCachedState(): Readonly<CachedTintState> {
  return cached;
}

/** Merge partial updates into the cached tint state. */
export function updateCachedState(updates: Partial<CachedTintState>): void {
  cached = { ...cached, ...updates };
}

/** Reset cached state to empty and refresh the status bar. */
export async function resetCachedState(): Promise<void> {
  cached = {
    workspaceIdentifier: undefined,
    tintColors: undefined,
    customizedOutsidePatina: false,
    lastError: undefined,
  };
  await refreshStatusBar();
}
