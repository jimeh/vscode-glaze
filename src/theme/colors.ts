import * as vscode from 'vscode';
import { BUILTIN_THEME_COLORS } from './generated/builtins';
import { EXTENSION_THEME_COLORS } from './generated/extensions';
import type { ThemeType } from './types';
import {
  OPTIONAL_THEME_COLOR_KEYS,
  PALETTE_KEY_TO_COLOR_KEY,
  FOREGROUND_KEYS,
  type ThemeColorKey,
  type ThemeColors,
  type PaletteKey,
} from './colorKeys';

/**
 * Information about a theme's colors.
 */
export interface ThemeInfo {
  /** Colors for different UI elements */
  colors: ThemeColors;
  /** Theme type (dark, light, hcDark, hcLight) */
  type: ThemeType;
}

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
  if (BUILTIN_THEME_COLORS[themeName]) {
    return BUILTIN_THEME_COLORS[themeName];
  }
  // Marketplace extension themes as fallback
  return EXTENSION_THEME_COLORS[themeName];
}

/**
 * Gets the appropriate color for a specific palette key.
 *
 * Lookup order:
 * 1. Direct key (e.g. sideBarSectionHeader.background)
 * 2. Mapped fallback key (e.g. sideBar.background)
 * 3. editor.background / editor.foreground
 *
 * @param key - The palette key to get color for
 * @param colors - The theme colors
 * @returns The hex color string for the appropriate element, or undefined
 */
export function getColorForKey(
  key: PaletteKey,
  colors: ThemeColors
): string | undefined {
  // 1. Check direct key
  // Cast is safe: PaletteKey never includes 'editor.background'
  // (inPalette: false), so it's always within OptionalColorKey.
  type OptionalColorKey = Exclude<ThemeColorKey, 'editor.background'>;
  const directValue = colors[key as OptionalColorKey];
  if (directValue) {
    return directValue;
  }

  // 2. Check mapped fallback key (only when different from direct)
  const fallbackKey = PALETTE_KEY_TO_COLOR_KEY[key];
  if (fallbackKey !== key && colors[fallbackKey]) {
    return colors[fallbackKey]!;
  }

  // 3. Generic fallback based on key type
  if (FOREGROUND_KEYS.has(key)) {
    return colors['editor.foreground'];
  }
  return colors['editor.background'];
}
