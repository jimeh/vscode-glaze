/**
 * Official VSCode theme types.
 * Matches VSCode's uiTheme values and theme JSON type field.
 */
export type ThemeType = 'dark' | 'light' | 'hcDark' | 'hcLight';

/**
 * User-configurable theme mode setting.
 */
export type ThemeMode = 'auto' | 'light' | 'dark';

import type { ThemeColors } from './colorKeys';

/**
 * Context information about the current theme.
 */
export interface ThemeContext {
  /**
   * The theme's own type from the database (e.g., a dark theme is
   * always 'dark' regardless of tint mode). Undefined if the theme
   * is not found in the database.
   */
  type?: ThemeType | undefined;

  /**
   * The resolved tint type — auto-detected from VSCode's active
   * theme kind, or manually set by the user.
   */
  tintType: ThemeType;

  /**
   * Whether tintType was auto-detected (true) or manually
   * configured (false).
   */
  isAutoDetected: boolean;

  /**
   * The name of the active color theme (e.g., "One Dark Pro").
   * May be undefined if the theme name cannot be determined.
   */
  name?: string | undefined;

  /**
   * Theme colors for different UI elements.
   * Only populated for known themes in the lookup table.
   */
  colors?: ThemeColors | undefined;
}
