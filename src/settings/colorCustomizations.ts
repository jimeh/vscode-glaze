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
 * Returns true if a theme-scoped block is owned by Glaze,
 * i.e. it contains the `glaze.active` marker with the correct value.
 */
function isGlazeOwnedBlock(block: Record<string, unknown>): boolean {
  return block[GLAZE_ACTIVE_KEY] === GLAZE_ACTIVE_VALUE;
}

/**
 * Merges Glaze colors with existing color customizations, writing
 * into a theme-scoped block for the given theme.
 *
 * - Removes all Glaze-owned theme blocks (those containing the
 *   `glaze.active` marker) — this cleans up colors from previously
 *   active themes.
 * - Removes any root-level Glaze keys (migration from old format).
 * - Preserves all non-Glaze user customizations, both at root level
 *   and inside theme-scoped blocks.
 * - Writes new Glaze colors + marker into `[themeName]`.
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
          } else if (isGlazeOwnedBlock(block)) {
            // Strip Glaze keys from other-theme blocks, keep user keys
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

  // Inject ownership marker
  themeBlock[GLAZE_ACTIVE_KEY] = GLAZE_ACTIVE_VALUE;

  result[targetKey] = themeBlock;

  return result;
}

/**
 * Removes Glaze-managed keys and Glaze-owned theme blocks from
 * color customizations. Preserves all non-Glaze user customizations.
 *
 * - Removes root-level Glaze keys (including the marker).
 * - For Glaze-owned theme blocks (containing `glaze.active` marker):
 *   removes Glaze keys and keeps any user keys. If the block becomes
 *   empty, removes the block entirely.
 * - Preserves user-owned theme blocks (no marker) untouched.
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
    if (isThemeScopedKey(key)) {
      const block = value as Record<string, unknown> | undefined;
      if (block && typeof block === 'object' && isGlazeOwnedBlock(block)) {
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
  return key === GLAZE_ACTIVE_KEY || MANAGED_KEY_SET.has(key);
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
 * 2. The current theme's scoped block (if `themeName` is provided)
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
  const hasRootMarker = existing[GLAZE_ACTIVE_KEY] === GLAZE_ACTIVE_VALUE;
  if (!hasRootMarker) {
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
      const hasBlockMarker =
        themeBlock[GLAZE_ACTIVE_KEY] === GLAZE_ACTIVE_VALUE;
      if (!hasBlockMarker) {
        return Object.keys(themeBlock).some((key) => MANAGED_KEY_SET.has(key));
      }
    }
  }

  return false;
}
