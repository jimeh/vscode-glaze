export type { ThemeType, ThemeMode, ThemeContext } from './types';
export { getThemeTypeFromColorThemeKind, getThemeContext } from './detect';
export { getThemeName } from './name';
export {
  getThemeInfo,
  getColorForKey,
  BUILTIN_THEMES,
  type ThemeInfo,
  type ThemeColors,
  type ThemeColorKey,
  type ElementType,
} from './colors';
