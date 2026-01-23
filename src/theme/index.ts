export type { ThemeKind, ThemeMode, ThemeContext } from './types';
export { mapColorThemeKind, getThemeContext } from './detect';
export { getThemeName } from './name';
export {
  getThemeBackground,
  THEME_BACKGROUNDS,
  type ThemeBackground,
  type ThemeBackgroundKind,
} from './backgrounds';
