import { PATINA_MANAGED_KEYS } from '../theme';

/**
 * Invisible marker key written into colorCustomizations to indicate
 * Patina owns the current set of managed colors. If managed keys are
 * present but this marker is absent, an external tool or user has
 * modified the settings and Patina will refuse to overwrite them.
 */
export const PATINA_ACTIVE_KEY = 'patina.active';

/**
 * Fixed value written for the marker key.
 * VSCode ignores unknown keys, so this has no visual effect.
 */
export const PATINA_ACTIVE_VALUE = '#ef5ec7';

/**
 * Type for VSCode's workbench.colorCustomizations setting.
 */
export type ColorCustomizations = Record<string, string>;

/**
 * Merges Patina colors with existing color customizations.
 * Removes any existing Patina-managed keys, then adds the new Patina colors.
 * Preserves all non-Patina user customizations.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @param patinaColors - New Patina colors to apply
 * @returns Merged color customizations object
 */
export function mergeColorCustomizations(
  existing: ColorCustomizations | undefined,
  patinaColors: Partial<ColorCustomizations>
): ColorCustomizations {
  const result: ColorCustomizations = {};

  // Copy existing non-Patina keys
  if (existing) {
    for (const [key, value] of Object.entries(existing)) {
      if (!isPatinaKey(key)) {
        result[key] = value;
      }
    }
  }

  // Add new Patina colors
  for (const [key, value] of Object.entries(patinaColors)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }

  // Inject ownership marker
  result[PATINA_ACTIVE_KEY] = PATINA_ACTIVE_VALUE;

  return result;
}

/**
 * Removes Patina-managed keys from color customizations.
 * Preserves all non-Patina user customizations.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @returns Remaining customizations, or undefined if result is empty
 */
export function removePatinaColors(
  existing: ColorCustomizations | undefined
): ColorCustomizations | undefined {
  if (!existing) {
    return undefined;
  }

  const result: ColorCustomizations = {};

  for (const [key, value] of Object.entries(existing)) {
    if (!isPatinaKey(key)) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Checks if a key is managed by Patina (including the marker key).
 */
function isPatinaKey(key: string): boolean {
  return (
    key === PATINA_ACTIVE_KEY ||
    (PATINA_MANAGED_KEYS as readonly string[]).includes(key)
  );
}

/**
 * Detects external modification: returns true when Patina-managed color
 * keys exist in the customizations but the ownership marker is absent.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @returns true if managed keys are present without the marker
 */
export function hasPatinaColorsWithoutMarker(
  existing: ColorCustomizations | undefined
): boolean {
  if (!existing) {
    return false;
  }

  const hasMarker = existing[PATINA_ACTIVE_KEY] === PATINA_ACTIVE_VALUE;
  if (hasMarker) {
    return false;
  }

  const managedKeys = PATINA_MANAGED_KEYS as readonly string[];
  return Object.keys(existing).some((key) => managedKeys.includes(key));
}
