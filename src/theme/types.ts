/**
 * Official VSCode theme types.
 * Matches VSCode's uiTheme values and theme JSON type field.
 */
export type ThemeType = 'dark' | 'light' | 'hcDark' | 'hcLight';

/**
 * @deprecated Use ThemeType instead. This alias is kept for backwards
 * compatibility.
 */
export type ThemeKind = ThemeType;

/**
 * User-configurable theme mode setting.
 */
export type ThemeMode = 'auto' | 'light' | 'dark';

import type { ThemeColors } from './colors';

/**
 * Context information about the current theme.
 */
export interface ThemeContext {
  /**
   * The detected or configured theme type.
   */
  type: ThemeType;

  /**
   * @deprecated Use `type` instead. This alias is kept for backwards
   * compatibility.
   */
  kind: ThemeType;

  /**
   * Whether the type was auto-detected (true) or manually configured (false).
   */
  isAutoDetected: boolean;

  /**
   * The name of the active color theme (e.g., "One Dark Pro").
   * May be undefined if the theme name cannot be determined.
   */
  name?: string;

  /**
   * The theme's editor background color as a hex string (e.g., "#282C34").
   * Only populated for known themes in the lookup table.
   * @deprecated Use `colors['editor.background']` instead
   */
  background?: string;

  /**
   * Theme colors for different UI elements.
   * Only populated for known themes in the lookup table.
   */
  colors?: ThemeColors;

  /**
   * @deprecated Use `colors` instead. This alias is kept for backwards
   * compatibility.
   */
  backgrounds?: {
    editor: string;
    titleBar?: string;
    statusBar?: string;
    activityBar?: string;
  };
}
