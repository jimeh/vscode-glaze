import * as vscode from 'vscode';
import type { PatinaColorPalette } from '../color/palette';
import { GENERATED_THEME_COLORS } from './generated/colors';

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

/**
 * Lookup table of popular VS Code themes with their colors.
 *
 * Theme names are matched exactly as they appear in VS Code's
 * `workbench.colorTheme` setting.
 */
export const BUILTIN_THEMES: Record<string, ThemeInfo> = {
  // VS Code built-in themes
  'Default Dark Modern': {
    colors: { 'editor.background': '#1F1F1F' },
    type: 'dark',
  },
  'Default Dark+': {
    colors: { 'editor.background': '#1E1E1E' },
    type: 'dark',
  },
  'Visual Studio Dark': {
    colors: { 'editor.background': '#1E1E1E' },
    type: 'dark',
  },
  'Default Light Modern': {
    colors: { 'editor.background': '#FFFFFF' },
    type: 'light',
  },
  'Default Light+': {
    colors: { 'editor.background': '#FFFFFF' },
    type: 'light',
  },
  'Visual Studio Light': {
    colors: { 'editor.background': '#FFFFFF' },
    type: 'light',
  },
  'Default High Contrast': {
    colors: { 'editor.background': '#000000' },
    type: 'hcDark',
  },
  'Default High Contrast Light': {
    colors: { 'editor.background': '#FFFFFF' },
    type: 'hcLight',
  },

  // Popular dark themes
  'One Dark Pro': {
    colors: { 'editor.background': '#282C34' },
    type: 'dark',
  },
  'One Dark Pro Darker': {
    colors: { 'editor.background': '#23272E' },
    type: 'dark',
  },
  'One Dark Pro Flat': {
    colors: { 'editor.background': '#282C34' },
    type: 'dark',
  },
  'One Dark Pro Mix': {
    colors: { 'editor.background': '#282C34' },
    type: 'dark',
  },
  Dracula: {
    colors: { 'editor.background': '#282A36' },
    type: 'dark',
  },
  'Dracula Soft': {
    colors: { 'editor.background': '#282A36' },
    type: 'dark',
  },
  'GitHub Dark Default': {
    colors: { 'editor.background': '#0D1117' },
    type: 'dark',
  },
  'GitHub Dark Dimmed': {
    colors: { 'editor.background': '#22272E' },
    type: 'dark',
  },
  'GitHub Dark High Contrast': {
    colors: { 'editor.background': '#0A0C10' },
    type: 'dark',
  },
  'Night Owl': {
    colors: { 'editor.background': '#011627' },
    type: 'dark',
  },
  Monokai: {
    colors: { 'editor.background': '#272822' },
    type: 'dark',
  },
  'Monokai Dimmed': {
    colors: { 'editor.background': '#1E1E1E' },
    type: 'dark',
  },
  Nord: {
    colors: { 'editor.background': '#2E3440' },
    type: 'dark',
  },
  'Solarized Dark': {
    colors: { 'editor.background': '#002B36' },
    type: 'dark',
  },
  'Gruvbox Dark Medium': {
    colors: { 'editor.background': '#282828' },
    type: 'dark',
  },
  'Gruvbox Dark Hard': {
    colors: { 'editor.background': '#1D2021' },
    type: 'dark',
  },
  'Gruvbox Dark Soft': {
    colors: { 'editor.background': '#32302F' },
    type: 'dark',
  },
  'Tokyo Night': {
    colors: { 'editor.background': '#1A1B26' },
    type: 'dark',
  },
  'Tokyo Night Storm': {
    colors: { 'editor.background': '#24283B' },
    type: 'dark',
  },
  'Catppuccin Mocha': {
    colors: { 'editor.background': '#1E1E2E' },
    type: 'dark',
  },
  'Catppuccin Macchiato': {
    colors: { 'editor.background': '#24273A' },
    type: 'dark',
  },
  'Catppuccin Frappé': {
    colors: { 'editor.background': '#303446' },
    type: 'dark',
  },
  'Ayu Dark': {
    colors: { 'editor.background': '#0A0E14' },
    type: 'dark',
  },
  'Ayu Dark Bordered': {
    colors: { 'editor.background': '#0A0E14' },
    type: 'dark',
  },
  'Ayu Mirage': {
    colors: { 'editor.background': '#1F2430' },
    type: 'dark',
  },
  'Ayu Mirage Bordered': {
    colors: { 'editor.background': '#1F2430' },
    type: 'dark',
  },
  'Material Theme Palenight': {
    colors: { 'editor.background': '#292D3E' },
    type: 'dark',
  },
  'Material Theme Palenight High Contrast': {
    colors: { 'editor.background': '#292D3E' },
    type: 'dark',
  },
  'Material Theme Ocean': {
    colors: { 'editor.background': '#0F111A' },
    type: 'dark',
  },
  'Material Theme Darker': {
    colors: { 'editor.background': '#212121' },
    type: 'dark',
  },
  Cobalt2: {
    colors: { 'editor.background': '#193549' },
    type: 'dark',
  },
  'Atom One Dark': {
    colors: { 'editor.background': '#282C34' },
    type: 'dark',
  },
  'Palenight Theme': {
    colors: { 'editor.background': '#292D3E' },
    type: 'dark',
  },
  'Shades of Purple': {
    colors: { 'editor.background': '#2D2B55' },
    type: 'dark',
  },
  'Synthwave 84': {
    colors: { 'editor.background': '#262335' },
    type: 'dark',
  },
  'Panda Theme': {
    colors: { 'editor.background': '#292A2B' },
    type: 'dark',
  },

  // Popular light themes
  'GitHub Light Default': {
    colors: { 'editor.background': '#FFFFFF' },
    type: 'light',
  },
  'GitHub Light High Contrast': {
    colors: { 'editor.background': '#FFFFFF' },
    type: 'light',
  },
  'Light Owl': {
    colors: { 'editor.background': '#FBFBFB' },
    type: 'light',
  },
  'Solarized Light': {
    colors: { 'editor.background': '#FDF6E3' },
    type: 'light',
  },
  'Gruvbox Light Medium': {
    colors: { 'editor.background': '#FBF1C7' },
    type: 'light',
  },
  'Gruvbox Light Hard': {
    colors: { 'editor.background': '#F9F5D7' },
    type: 'light',
  },
  'Gruvbox Light Soft': {
    colors: { 'editor.background': '#F2E5BC' },
    type: 'light',
  },
  'Catppuccin Latte': {
    colors: { 'editor.background': '#EFF1F5' },
    type: 'light',
  },
  'Ayu Light': {
    colors: { 'editor.background': '#FAFAFA' },
    type: 'light',
  },
  'Ayu Light Bordered': {
    colors: { 'editor.background': '#FAFAFA' },
    type: 'light',
  },
  'Atom One Light': {
    colors: { 'editor.background': '#FAFAFA' },
    type: 'light',
  },
  'Tokyo Night Light': {
    colors: { 'editor.background': '#D5D6DB' },
    type: 'light',
  },
  'Material Theme Lighter': {
    colors: { 'editor.background': '#FAFAFA' },
    type: 'light',
  },
  'Quiet Light': {
    colors: { 'editor.background': '#F5F5F5' },
    type: 'light',
  },
};

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
 * 2. Generated themes from extracted VSIX data
 * 3. Built-in themes (fallback)
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
  // Generated themes from VSIX extraction
  if (GENERATED_THEME_COLORS[themeName]) {
    return GENERATED_THEME_COLORS[themeName];
  }
  // Built-in themes as fallback
  return BUILTIN_THEMES[themeName];
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
