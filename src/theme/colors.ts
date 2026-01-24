import * as vscode from 'vscode';
import type { PatinaColorPalette } from '../color/palette';
import { BUILTIN_THEME_COLORS } from './generated/builtins';
import { EXTENSION_THEME_COLORS } from './generated/extensions';

/**
 * Official VSCode theme types.
 */
export type ThemeType = 'dark' | 'light' | 'hcDark' | 'hcLight';

/**
 * All color keys supported by theme info.
 * Uses native VSCode color keys (matching workbench.colorCustomizations).
 */
export type ThemeColorKey =
  | 'editor.background'
  | 'editor.foreground'
  | 'titleBar.activeBackground'
  | 'titleBar.activeForeground'
  | 'titleBar.inactiveBackground'
  | 'titleBar.inactiveForeground'
  | 'statusBar.background'
  | 'statusBar.foreground'
  | 'activityBar.background'
  | 'activityBar.foreground';

/**
 * Theme colors using native VSCode keys.
 * editor.background is required; all others are optional.
 */
export type ThemeColors = {
  'editor.background': string;
} & Partial<Record<Exclude<ThemeColorKey, 'editor.background'>, string>>;

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
 * Element identifier for color lookup.
 */
export type ElementType = 'editor' | 'titleBar' | 'statusBar' | 'activityBar';

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
  const optionalKeys = [
    'editor.foreground',
    'titleBar.activeBackground',
    'titleBar.activeForeground',
    'titleBar.inactiveBackground',
    'titleBar.inactiveForeground',
    'statusBar.background',
    'statusBar.foreground',
    'activityBar.background',
    'activityBar.foreground',
  ];
  for (const key of optionalKeys) {
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

  const optionalKeys = [
    'editor.foreground',
    'titleBar.activeBackground',
    'titleBar.activeForeground',
    'titleBar.inactiveBackground',
    'titleBar.inactiveForeground',
    'statusBar.background',
    'statusBar.foreground',
    'activityBar.background',
    'activityBar.foreground',
  ] as const;

  for (const key of optionalKeys) {
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
 * Maps palette keys to their corresponding color keys for lookup.
 */
const PALETTE_KEY_TO_COLOR_KEY: Partial<
  Record<keyof PatinaColorPalette, ThemeColorKey>
> = {
  'titleBar.activeBackground': 'titleBar.activeBackground',
  'titleBar.inactiveBackground': 'titleBar.activeBackground',
  'statusBar.background': 'statusBar.background',
  'activityBar.background': 'activityBar.background',
};

/**
 * Gets the appropriate color for a specific palette key.
 * Falls back to editor background if the element-specific color is not defined.
 *
 * @param key - The palette key to get color for
 * @param colors - The theme colors
 * @returns The hex color string for the appropriate element
 */
export function getColorForKey(
  key: keyof PatinaColorPalette,
  colors: ThemeColors
): string {
  const colorKey = PALETTE_KEY_TO_COLOR_KEY[key];
  if (colorKey && colors[colorKey]) {
    return colors[colorKey]!;
  }
  return colors['editor.background'];
}
