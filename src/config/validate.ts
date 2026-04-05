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
 * Validates an allowed-base-hues array. Keeps only unique integers
 * in [0, 359]. Returns an empty array when unset or invalid.
 */
export function _validateAllowedBaseHues(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<number>();
  const result: number[] = [];
  for (const item of value) {
    if (
      typeof item === 'number' &&
      Number.isInteger(item) &&
      item >= 0 &&
      item <= 359 &&
      !seen.has(item)
    ) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

/**
 * Validates a custom-base-colors array. Keeps only unique 6-digit
 * hex colors and normalizes to lowercase.
 */
export function _validateCustomBaseColors(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const normalized = item.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
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
