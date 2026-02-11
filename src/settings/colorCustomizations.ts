import { GLAZE_MANAGED_KEYS } from '../theme';

/** Set of all Glaze-managed color keys for O(1) lookup. */
const MANAGED_KEY_SET = new Set<string>(GLAZE_MANAGED_KEYS);

/**
 * Marker key written at the root of colorCustomizations. Its value
 * is the theme name that Glaze currently owns (e.g. `"Monokai"`).
 * Stored at root level because VSCode silently ignores unknown
 * root keys, whereas unknown keys inside theme-scoped blocks
 * produce diagnostics.
 */
export const GLAZE_ACTIVE_KEY = 'glaze.active';

/**
 * Legacy marker keys from previous versions of the extension
 * (when it was called "Patina"). Workspaces with these keys are
 * recognized as Glaze-managed and seamlessly upgraded on next write.
 */
export const LEGACY_ACTIVE_KEYS: readonly string[] = ['patina.active'];

const LEGACY_KEY_SET = new Set<string>(LEGACY_ACTIVE_KEYS);

/**
 * Reads the active ownership marker from colorCustomizations,
 * checking the current `glaze.active` key first, then falling
 * back through legacy keys.
 *
 * @returns The marker value (theme name string) or `undefined`
 */
export function readActiveMarker(
  existing: ColorCustomizations | undefined
): string | undefined {
  if (!existing) {
    return undefined;
  }

  const current = existing[GLAZE_ACTIVE_KEY];
  if (isGlazeMarker(current)) {
    return current;
  }

  for (const key of LEGACY_ACTIVE_KEYS) {
    const value = existing[key];
    if (isGlazeMarker(value)) {
      return value;
    }
  }

  return undefined;
}

/**
 * Type for VSCode's workbench.colorCustomizations setting.
 * Top-level values may be strings (color keys) or objects
 * (theme-scoped blocks like `[Theme Name]`).
 */
export type ColorCustomizations = Record<string, unknown>;

/**
 * Type for a theme-scoped block inside colorCustomizations.
 */
type ThemeScopedBlock = Record<string, string>;

/**
 * Returns true if the key looks like a theme-scoped block key,
 * e.g. `[Monokai]` or `[Default Dark Modern]`.
 */
function isThemeScopedKey(key: string): boolean {
  return key.startsWith('[') && key.endsWith(']');
}

/**
 * Formats a theme name into the VS Code theme-scoped key format.
 * e.g. `"Monokai"` → `"[Monokai]"`
 */
export function themeScopeKey(themeName: string): string {
  return `[${themeName}]`;
}

/**
 * Returns true if value is a valid Glaze ownership marker:
 * a non-empty string representing the owned theme name.
 */
function isGlazeMarker(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Merges Glaze colors with existing color customizations, writing
 * into a theme-scoped block for the given theme.
 *
 * - Reads the root `glaze.active` marker to identify the previously
 *   owned theme and strips Glaze keys from that block on theme change.
 * - Removes any root-level Glaze keys (migration from old format).
 * - Preserves all non-Glaze user customizations, both at root level
 *   and inside theme-scoped blocks.
 * - Writes new Glaze colors into `[themeName]` (no marker inside).
 * - Writes `glaze.active = themeName` at root level.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @param glazeColors - New Glaze colors to apply
 * @param themeName - Name of the currently active theme
 * @returns Merged color customizations object
 */
export function mergeColorCustomizations(
  existing: ColorCustomizations | undefined,
  glazeColors: Record<string, string>,
  themeName: string
): ColorCustomizations {
  const result: ColorCustomizations = {};
  const targetKey = themeScopeKey(themeName);

  // Identify previously owned theme from root marker.
  const prevOwned = readActiveMarker(existing);
  const prevOwnedKey = prevOwned ? themeScopeKey(prevOwned) : undefined;

  // Collect user keys from the target theme's existing block (if any)
  // so we can preserve them in the new block.
  let userKeysInTargetBlock: ThemeScopedBlock | undefined;

  if (existing) {
    for (const [key, value] of Object.entries(existing)) {
      if (isThemeScopedKey(key)) {
        const block = value as Record<string, unknown> | undefined;
        if (block && typeof block === 'object') {
          if (key === targetKey) {
            // Extract non-Glaze user keys from the current theme block
            userKeysInTargetBlock = extractNonGlazeKeys(block);
          } else if (prevOwnedKey && key === prevOwnedKey) {
            // Strip Glaze keys from previously owned block, keep user keys
            const remaining = extractNonGlazeKeys(block);
            if (remaining) {
              result[key] = remaining;
            }
          } else {
            // Preserve user-owned blocks for other themes
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      } else if (!isGlazeKey(key)) {
        // Preserve root-level non-Glaze keys
        result[key] = value;
      }
      // Root-level Glaze keys are dropped (migration cleanup)
    }
  }

  // Build the theme-scoped block
  const themeBlock: ThemeScopedBlock = {};

  // Restore user's non-Glaze customizations for this theme
  if (userKeysInTargetBlock) {
    for (const [key, value] of Object.entries(userKeysInTargetBlock)) {
      themeBlock[key] = value;
    }
  }

  // Add new Glaze colors
  for (const [key, value] of Object.entries(glazeColors)) {
    if (value !== undefined) {
      themeBlock[key] = value;
    }
  }

  // Root-level ownership marker with theme name as value
  result[GLAZE_ACTIVE_KEY] = themeName;
  result[targetKey] = themeBlock;

  return result;
}

/**
 * Removes Glaze-managed keys from color customizations.
 * Preserves all non-Glaze user customizations.
 *
 * - Reads the root `glaze.active` marker to find the owned theme block.
 * - Strips Glaze keys from that block, keeps any user keys. If the
 *   block becomes empty, removes it entirely.
 * - Removes root-level Glaze keys (including the marker).
 * - Preserves user-owned theme blocks untouched.
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

  // Identify the owned theme block from root marker.
  const ownedTheme = readActiveMarker(existing);
  const ownedKey = ownedTheme ? themeScopeKey(ownedTheme) : undefined;

  for (const [key, value] of Object.entries(existing)) {
    if (isThemeScopedKey(key)) {
      const block = value as Record<string, unknown> | undefined;
      if (block && typeof block === 'object' && ownedKey === key) {
        // Glaze-owned block — strip Glaze keys, keep user keys
        const remaining = extractNonGlazeKeys(block);
        if (remaining && Object.keys(remaining).length > 0) {
          result[key] = remaining;
        }
        // else: block is now empty, drop it entirely
      } else {
        // User-owned block or non-object — preserve
        result[key] = value;
      }
    } else if (!isGlazeKey(key)) {
      result[key] = value;
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Checks if a key is managed by Glaze (including the marker key).
 */
function isGlazeKey(key: string): boolean {
  return (
    key === GLAZE_ACTIVE_KEY ||
    LEGACY_KEY_SET.has(key) ||
    MANAGED_KEY_SET.has(key)
  );
}

/**
 * Extracts non-Glaze keys from a record, returning undefined
 * if no non-Glaze keys remain.
 */
function extractNonGlazeKeys(
  block: Record<string, unknown>
): ThemeScopedBlock | undefined {
  const result: ThemeScopedBlock = {};
  let count = 0;

  for (const [key, value] of Object.entries(block)) {
    if (!isGlazeKey(key)) {
      result[key] = value as string;
      count++;
    }
  }

  return count > 0 ? result : undefined;
}

/**
 * Detects external modification: returns true when Glaze-managed color
 * keys exist without the ownership marker.
 *
 * Checks two locations:
 * 1. Root-level keys (legacy / migration from pre-theme-scoped format)
 * 2. The current theme's scoped block (if `themeName` is provided):
 *    managed keys present AND root marker does not point to this theme.
 *
 * @param existing - Current colorCustomizations value (may be undefined)
 * @param themeName - Name of the currently active theme (optional)
 * @returns true if managed keys are present without the marker
 */
export function hasGlazeColorsWithoutMarker(
  existing: ColorCustomizations | undefined,
  themeName?: string
): boolean {
  if (!existing) {
    return false;
  }

  // Check root-level keys (legacy format)
  const activeMarker = readActiveMarker(existing);
  if (!activeMarker) {
    const hasRootManagedKeys = Object.keys(existing).some((key) =>
      MANAGED_KEY_SET.has(key)
    );
    if (hasRootManagedKeys) {
      return true;
    }
  }

  // Check the current theme's block
  if (themeName) {
    const themeKey = themeScopeKey(themeName);
    const block = existing[themeKey];
    if (block && typeof block === 'object') {
      const themeBlock = block as Record<string, unknown>;
      // Root marker must point to this theme for it to be Glaze-owned
      const markerPointsHere = activeMarker === themeName;
      if (!markerPointsHere) {
        return Object.keys(themeBlock).some((key) => MANAGED_KEY_SET.has(key));
      }
    }
  }

  return false;
}
