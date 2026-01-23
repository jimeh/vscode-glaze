/**
 * Theme kind categories used for color generation.
 */
export type ThemeKind = 'dark' | 'light' | 'highContrast' | 'highContrastLight';

/**
 * User-configurable theme mode setting.
 */
export type ThemeMode = 'auto' | 'light' | 'dark';

/**
 * Context information about the current theme.
 */
export interface ThemeContext {
  /**
   * The detected or configured theme kind.
   */
  kind: ThemeKind;

  /**
   * Whether the kind was auto-detected (true) or manually configured (false).
   */
  isAutoDetected: boolean;

  /**
   * The name of the active color theme (e.g., "One Dark Pro").
   * May be undefined if the theme name cannot be determined.
   */
  name?: string;

  /**
   * The theme's background color as a hex string (e.g., "#282C34").
   * Only populated for known themes in the lookup table.
   */
  background?: string;
}
