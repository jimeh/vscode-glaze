export type { ThemeKind, ThemeMode, ThemeContext } from './types';
export { mapColorThemeKind, getThemeContext } from './detect';
export { getThemeName } from './name';
export {
  getThemeBackground,
  getBackgroundForKey,
  THEME_BACKGROUNDS,
  type ThemeBackground,
  type ThemeBackgroundKind,
  type ElementBackgrounds,
  type ElementType,
} from './backgrounds';
