// New exports
export type { ThemeType, ThemeKind, ThemeMode, ThemeContext } from './types';
export {
  getThemeTypeFromColorThemeKind,
  mapColorThemeKind,
  getThemeContext,
} from './detect';
export { getThemeName } from './name';
export {
  getThemeInfo,
  getColorForKey,
  BUILTIN_THEMES,
  type ThemeInfo,
  type ThemeColors,
  type ThemeColorKey,
} from './colors';

// Backwards compatibility exports (deprecated)
export {
  /** @deprecated Use getThemeInfo instead */
  getThemeBackground,
  /** @deprecated Use getColorForKey instead */
  getBackgroundForKey,
  /** @deprecated Use BUILTIN_THEMES instead */
  THEME_BACKGROUNDS,
  /** @deprecated Use ThemeInfo instead */
  type ThemeBackground,
  /** @deprecated Use ThemeType instead */
  type ThemeBackgroundKind,
  /** @deprecated Use ThemeColors instead */
  type ElementBackgrounds,
  type ElementType,
} from './colors';
