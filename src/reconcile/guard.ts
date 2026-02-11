import * as vscode from 'vscode';
import { updateCachedState, refreshStatusBar } from './state';

/**
 * Sliding-window rate limiter for the reconcile loop.
 *
 * Detects runaway reconcile cycles (e.g. two extensions
 * ping-ponging config writes) by tracking how many actual
 * config writes occur within a short window. When the limit
 * is exceeded, reconciliation pauses for a cooldown period
 * and resumes automatically.
 *
 * Force-flagged reconciles (from the "Force Apply" command)
 * always bypass the guard.
 */

// ── Default thresholds ────────────────────────────────────

/** Max config writes allowed within the sliding window. */
const DEFAULT_MAX_WRITES = 5;

/** Sliding window size in milliseconds. */
const DEFAULT_WINDOW_MS = 3_000;

/** Cooldown duration in milliseconds after tripping. */
const DEFAULT_COOLDOWN_MS = 10_000;

// ── Mutable state ─────────────────────────────────────────

/**
 * Whether the guard is active. Starts disabled and must be
 * explicitly enabled during extension activation.
 */
let enabled = false;

/** Active thresholds (overridable for testing). */
let maxWrites = DEFAULT_MAX_WRITES;
let windowMs = DEFAULT_WINDOW_MS;
let cooldownMs = DEFAULT_COOLDOWN_MS;

/** Timestamps (ms) of recent actual config writes. */
let timestamps: number[] = [];

/**
 * Epoch-ms when the cooldown expires, or 0 when the guard
 * is not tripped.
 */
let cooldownUntil = 0;

// ── Public API ────────────────────────────────────────────

/**
 * Activate the reconcile guard. Call once during extension
 * activation. The guard starts disabled so it does not
 * interfere with integration tests that exercise the live
 * extension.
 */
export function enableReconcileGuard(): void {
  enabled = true;
}

/**
 * Check whether the reconcile loop should proceed.
 *
 * Call at the top of doReconcile(). Returns `true` when
 * execution may continue, `false` when the guard has
 * tripped and the caller should bail.
 *
 * Side-effects on trip:
 *  - Sets `lastError` in cached state (shown in status bar)
 *  - Shows a VS Code warning notification (once per trip)
 *  - Refreshes the status bar
 */
export async function reconcileGuardCheck(force: boolean): Promise<boolean> {
  if (!enabled || force) {
    return true;
  }

  const now = Date.now();

  // During cooldown — silently skip.
  if (cooldownUntil > 0 && now < cooldownUntil) {
    return false;
  }

  // Cooldown just expired — reset and allow this execution.
  if (cooldownUntil > 0) {
    cooldownUntil = 0;
    timestamps = [];
    updateCachedState({ lastError: undefined });
    await refreshStatusBar();
  }

  // Check accumulated writes against threshold. We don't
  // record a timestamp here — that happens in
  // reconcileGuardRecordWrite() after a real config write.
  const windowStart = now - windowMs;
  while (timestamps.length > 0 && timestamps[0]! < windowStart) {
    timestamps.shift();
  }

  if (timestamps.length >= maxWrites) {
    cooldownUntil = now + cooldownMs;
    timestamps = [];
    const secs = Math.ceil(cooldownMs / 1_000);
    updateCachedState({
      lastError:
        'Reconcile paused: too many config writes detected. ' +
        `Resuming automatically in ${secs} s. ` +
        'Use "Force Apply" to override.',
    });
    await refreshStatusBar();
    void vscode.window.showWarningMessage(
      'Glaze: Runaway reconcile loop detected — ' +
        `pausing for ${secs} seconds. ` +
        'Use "Glaze: Force Apply" to override.'
    );
    return false;
  }

  return true;
}

/**
 * Record that writeColorConfig() performed an actual config
 * write (i.e. deepEqual did not match). Call immediately
 * after a successful vscode config update.
 *
 * Only real writes count toward the rate limit — no-op
 * reconciles (where the config already matches) are free.
 */
export function reconcileGuardRecordWrite(): void {
  // The cooldown check is redundant (reconcileGuardCheck
  // already blocks execution during cooldown) but guards
  // against future refactoring that might call this
  // outside the normal check → write → record flow.
  if (!enabled || cooldownUntil > 0) {
    return;
  }
  timestamps.push(Date.now());
}

// ── Test helpers (prefixed with underscore) ───────────────

/**
 * Enable or disable the guard. Intended for test isolation:
 * _resetGuardState() disables the guard so normal tests are
 * not affected. Explicit guard tests re-enable it.
 */
export function _setGuardEnabled(value: boolean): void {
  enabled = value;
}

/**
 * Override the guard thresholds. Useful for testing with
 * shorter windows/cooldowns. Pass `undefined` for any field
 * to keep its current value.
 */
export function _configureGuard(config: {
  maxWrites?: number;
  windowMs?: number;
  cooldownMs?: number;
}): void {
  if (config.maxWrites !== undefined) {
    maxWrites = config.maxWrites;
  }
  if (config.windowMs !== undefined) {
    windowMs = config.windowMs;
  }
  if (config.cooldownMs !== undefined) {
    cooldownMs = config.cooldownMs;
  }
}

/**
 * Reset all guard state to defaults and disable the guard.
 * Intended for test isolation only — called by
 * _resetAllState() in the reconcile barrel.
 */
export function _resetGuardState(): void {
  enabled = false;
  timestamps = [];
  cooldownUntil = 0;
  maxWrites = DEFAULT_MAX_WRITES;
  windowMs = DEFAULT_WINDOW_MS;
  cooldownMs = DEFAULT_COOLDOWN_MS;
}
