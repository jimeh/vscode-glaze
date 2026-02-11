import type { TintTarget } from './types';

/**
 * Element-enabled flags used to build the list of tint targets.
 */
export interface ElementFlags {
  readonly titleBar: boolean;
  readonly statusBar: boolean;
  readonly activityBar: boolean;
  readonly sideBar: boolean;
}

/**
 * Builds an ordered list of tint targets from element flags.
 * Order matches the UI stacking: titleBar → statusBar →
 * activityBar → sideBar.
 */
export function _buildTargets(elements: ElementFlags): TintTarget[] {
  const targets: TintTarget[] = [];
  if (elements.titleBar) {
    targets.push('titleBar');
  }
  if (elements.statusBar) {
    targets.push('statusBar');
  }
  if (elements.activityBar) {
    targets.push('activityBar');
  }
  if (elements.sideBar) {
    targets.push('sideBar');
  }
  return targets;
}

/**
 * Validates a tint seed value. Returns the value if it is an
 * integer, otherwise falls back to 0.
 */
export function _validateSeed(value: number): number {
  return Number.isInteger(value) ? value : 0;
}

/**
 * Validates a base hue override. Returns the value if it is an
 * integer in [0, 359], otherwise returns null.
 */
export function _validateBaseHueOverride(value: number | null): number | null {
  if (value !== null && Number.isInteger(value) && value >= 0 && value <= 359) {
    return value;
  }
  return null;
}

/**
 * Clamps a blend factor to the valid range [0, 1].
 */
export function _clampBlendFactor(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Builds per-target blend factor overrides from raw config
 * entries. Null values are omitted; numeric values are clamped
 * to [0, 1].
 */
export function _buildTargetBlendFactors(
  entries: ReadonlyArray<readonly [TintTarget, number | null]>
): Partial<Record<TintTarget, number>> {
  const result: Partial<Record<TintTarget, number>> = {};
  for (const [target, value] of entries) {
    if (value !== null && typeof value === 'number') {
      result[target] = _clampBlendFactor(value);
    }
  }
  return result;
}

/**
 * Validates a string value against an allowed set. Returns
 * the value if it is included, otherwise falls back to the
 * default.
 */
export function _validateEnum<T extends string>(
  value: string,
  validValues: readonly T[],
  defaultValue: T
): T {
  return (validValues as readonly string[]).includes(value)
    ? (value as T)
    : defaultValue;
}
