import { PATINA_MANAGED_KEYS } from '../theme';

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
 * Checks if a key is managed by Patina.
 */
function isPatinaKey(key: string): boolean {
  return (PATINA_MANAGED_KEYS as readonly string[]).includes(key);
}
