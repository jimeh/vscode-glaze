export type { ThemeType, ThemeMode, ThemeContext } from './types';
export { getThemeTypeFromColorThemeKind, getThemeContext } from './detect';

// Re-export color key definitions and types
export {
  COLOR_KEY_DEFINITIONS,
  ALL_THEME_COLOR_KEYS,
  OPTIONAL_THEME_COLOR_KEYS,
  PATINA_MANAGED_KEYS,
  FOREGROUND_KEYS,
  EXCLUDE_WHEN_UNDEFINED_KEYS,
  PALETTE_KEY_TO_COLOR_KEY,
} from './colorKeys';
export type {
  ElementType,
  ColorType,
  ThemeColorKey,
  PaletteKey,
  PatinaColorPalette,
  ThemeColors,
} from './colorKeys';
