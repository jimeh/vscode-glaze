import * as vscode from 'vscode';
import { BUILTIN_THEME_COLORS } from './generated/builtins';
import { EXTENSION_THEME_COLORS } from './generated/extensions';
import {
  OPTIONAL_THEME_COLOR_KEYS,
  PALETTE_KEY_TO_COLOR_KEY,
  FOREGROUND_KEYS,
  THEME_TYPE_CODES,
  expandThemeColors,
  type ThemeColors,
  type PaletteKey,
  type CompactThemeColors,
  type CompactThemeData,
} from './colorKeys';

/**
 * Official VSCode theme types.
 */
export type ThemeType = 'dark' | 'light' | 'hcDark' | 'hcLight';

/**
 * Information about a theme's colors.
 */
export interface ThemeInfo {
  /** Colors for different UI elements */
  colors: ThemeColors;
  /** Theme type (dark, light, hcDark, hcLight) */
  type: ThemeType;
}

/**
 * Expands a compact theme data array into a ThemeInfo object.
 */
function expandCompactTheme(data: CompactThemeData): ThemeInfo {
  return {
    colors: expandThemeColors(data),
    type: THEME_TYPE_CODES[data[0]],
  };
}

/**
 * Expands a compact theme colors record into a ThemeInfo record.
 */
function expandCompactThemeColors(
  compact: CompactThemeColors
): Record<string, ThemeInfo> {
  const result: Record<string, ThemeInfo> = {};
  for (const name of Object.keys(compact)) {
    result[name] = expandCompactTheme(compact[name]);
  }
  return result;
}

// Expand compact theme data at module load time
const expandedBuiltinThemes = expandCompactThemeColors(BUILTIN_THEME_COLORS);
const expandedExtensionThemes = expandCompactThemeColors(
  EXTENSION_THEME_COLORS
);

/**
 * Expanded built-in theme colors (for testing).
 */
export { expandedBuiltinThemes as EXPANDED_BUILTIN_THEME_COLORS };

/**
 * Expanded extension theme colors (for testing).
 */
export { expandedExtensionThemes as EXPANDED_EXTENSION_THEME_COLORS };

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const VALID_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

/**
 * Validates a ThemeColors object.
 * Requires editor.background key with valid hex color; other keys are optional.
 */
function isValidThemeColors(value: unknown): value is ThemeColors {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (!isValidHexColor(obj['editor.background'])) {
    return false;
  }
  // Optional keys must be valid hex if present
  for (const key of OPTIONAL_THEME_COLOR_KEYS) {
    if (obj[key] !== undefined && !isValidHexColor(obj[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Validates a ThemeInfo object.
 */
function isValidThemeInfo(value: unknown): value is ThemeInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  // Check for valid type
  if (
    typeof obj.type !== 'string' ||
    !VALID_TYPES.includes(obj.type as ThemeType)
  ) {
    return false;
  }

  return isValidThemeColors(obj.colors);
}

/**
 * Normalizes a theme info by uppercasing hex colors.
 */
function normalizeThemeInfo(value: ThemeInfo): ThemeInfo {
  const colors: ThemeColors = {
    'editor.background': value.colors['editor.background'].toUpperCase(),
  };

  for (const key of OPTIONAL_THEME_COLOR_KEYS) {
    if (value.colors[key]) {
      colors[key] = value.colors[key]!.toUpperCase();
    }
  }

  return {
    colors,
    type: value.type,
  };
}

/**
 * Gets custom theme colors from VSCode settings.
 */
function getCustomThemeInfo(): Record<string, ThemeInfo> {
  const config = vscode.workspace.getConfiguration('patina');
  const themeColors = config.get<Record<string, unknown>>('theme.colors', {});
  const result: Record<string, ThemeInfo> = {};

  for (const [name, entry] of Object.entries(themeColors)) {
    if (isValidThemeInfo(entry)) {
      result[name] = normalizeThemeInfo(entry);
    }
  }

  return result;
}

/**
 * Gets the theme info for a theme by name.
 * Priority order:
 * 1. User-configured custom themes (highest)
 * 2. VS Code built-in themes
 * 3. Marketplace extension themes (fallback)
 *
 * @param themeName - The theme name as it appears in VS Code settings
 * @returns Theme info if found, undefined otherwise
 */
export function getThemeInfo(themeName: string): ThemeInfo | undefined {
  // User config takes highest precedence
  const custom = getCustomThemeInfo();
  if (custom[themeName]) {
    return custom[themeName];
  }
  // VS Code built-in themes
  if (expandedBuiltinThemes[themeName]) {
    return expandedBuiltinThemes[themeName];
  }
  // Marketplace extension themes as fallback
  return expandedExtensionThemes[themeName];
}

/**
 * Gets the appropriate color for a specific palette key.
 * Falls back to editor.background for background keys, editor.foreground for
 * foreground keys. Returns undefined if no suitable color is found.
 *
 * @param key - The palette key to get color for
 * @param colors - The theme colors
 * @returns The hex color string for the appropriate element, or undefined
 */
export function getColorForKey(
  key: PaletteKey,
  colors: ThemeColors
): string | undefined {
  const colorKey = PALETTE_KEY_TO_COLOR_KEY[key];
  if (colors[colorKey]) {
    return colors[colorKey]!;
  }
  // Fallback based on key type
  if (FOREGROUND_KEYS.has(key)) {
    return colors['editor.foreground'];
  }
  return colors['editor.background'];
}
