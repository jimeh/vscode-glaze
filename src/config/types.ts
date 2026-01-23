import type { ThemeBackground } from '../theme/backgrounds';

/**
 * Custom theme background colors configuration.
 * Maps theme names to their background color information.
 */
export type ThemeBackgroundColors = Record<string, ThemeBackground>;

/**
 * Determines what value is used to generate the workspace color.
 */
export type WorkspaceIdentifierSource =
  | 'name'
  | 'pathRelativeToHome'
  | 'pathAbsolute'
  | 'pathRelativeToCustom';

/**
 * Configuration for workspace identifier generation.
 */
export interface WorkspaceIdentifierConfig {
  /**
   * The source to use for generating the workspace identifier.
   */
  source: WorkspaceIdentifierSource;

  /**
   * Base path for 'pathRelativeToCustom' source.
   * Supports ~ for home directory. Falls back to absolute path if workspace
   * is outside this path.
   */
  customBasePath: string;
}

/**
 * UI element groups that can be tinted.
 */
export type TintTarget = 'titleBar' | 'statusBar' | 'activityBar';

/**
 * User-configurable theme mode setting.
 */
export type ThemeMode = 'auto' | 'light' | 'dark';

/**
 * Configuration for tint targets.
 */
export interface TintConfig {
  /**
   * Which UI element groups to apply the color tint to.
   */
  targets: TintTarget[];

  /**
   * Theme mode for color generation.
   */
  mode: ThemeMode;
}

/**
 * Configuration for theme-related settings.
 */
export interface ThemeConfig {
  /**
   * How much to blend tint colors toward the theme's background color.
   * Value between 0 (no blending) and 1 (fully match theme).
   * Default is 0.35.
   */
  blendFactor: number;
}
