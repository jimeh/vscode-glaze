import { GLAZE_MANAGED_KEYS } from '../theme';

/** Set of all Glaze-managed color keys for O(1) lookup. */
const MANAGED_KEY_SET = new Set<string>(GLAZE_MANAGED_KEYS);

/**
 * Invisible marker key written into colorCustomizations to indicate
 * Glaze owns the current set of managed colors. If managed keys are
 * present but this marker is absent, an external tool or user has
 * modified the settings and Glaze will refuse to overwrite them.
 */
export const GLAZE_ACTIVE_KEY = 'glaze.active';

/**
 * Fixed value written for the marker key.
 * VSCode ignores unknown keys, so this has no visual effect.
 */
export const GLAZE_ACTIVE_VALUE = '#ef5ec7';

/**
 * Type for VSCode's workbench.colorCustomizations setting.
 */
export type ColorCustomizations = Record<string, unknown>;

/**
 * Merges Glaze colors with existing color customizations.
 * Removes any existing Glaze-managed keys, then adds the new Glaze colors.
 * Preserves all non-Glaze user customizations.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @param glazeColors - New Glaze colors to apply
 * @returns Merged color customizations object
 */
export function mergeColorCustomizations(
  existing: ColorCustomizations | undefined,
  glazeColors: Record<string, string>
): ColorCustomizations {
  const result: ColorCustomizations = {};

  // Copy existing non-Glaze keys
  if (existing) {
    for (const [key, value] of Object.entries(existing)) {
      if (!isGlazeKey(key)) {
        result[key] = value;
      }
    }
  }

  // Add new Glaze colors
  for (const [key, value] of Object.entries(glazeColors)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  // Inject ownership marker
  result[GLAZE_ACTIVE_KEY] = GLAZE_ACTIVE_VALUE;

  return result;
}

/**
 * Removes Glaze-managed keys from color customizations.
 * Preserves all non-Glaze user customizations.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @returns Remaining customizations, or undefined if result is empty
 */
export function removeGlazeColors(
  existing: ColorCustomizations | undefined
): ColorCustomizations | undefined {
  if (!existing) {
    return undefined;
  }

  const result: ColorCustomizations = {};

  for (const [key, value] of Object.entries(existing)) {
    if (!isGlazeKey(key)) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Checks if a key is managed by Glaze (including the marker key).
 */
function isGlazeKey(key: string): boolean {
  return key === GLAZE_ACTIVE_KEY || MANAGED_KEY_SET.has(key);
}

/**
 * Detects external modification: returns true when Glaze-managed color
 * keys exist in the customizations but the ownership marker is absent.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @returns true if managed keys are present without the marker
 */
export function hasGlazeColorsWithoutMarker(
  existing: ColorCustomizations | undefined
): boolean {
  if (!existing) {
    return false;
  }

  const hasMarker = existing[GLAZE_ACTIVE_KEY] === GLAZE_ACTIVE_VALUE;
  if (hasMarker) {
    return false;
  }

  return Object.keys(existing).some((key) => MANAGED_KEY_SET.has(key));
}
