import type { ThemeInfo } from '../theme/colors';

/**
 * Custom theme colors configuration.
 * Maps theme names to their color information.
 */
export type ThemeColors = Record<string, ThemeInfo>;

/**
 * Determines what value is used to generate the workspace color.
 */
export type WorkspaceIdentifierSource =
  | 'name'
  | 'pathRelativeToHome'
  | 'pathAbsolute'
  | 'pathRelativeToCustom';

/**
 * Determines the identifier base for multi-root workspaces.
 */
export type MultiRootIdentifierSource =
  | 'workspaceFile'
  | 'allFolders'
  | 'firstFolder';

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

  /**
   * Determines the identifier base for multi-root workspaces.
   * - 'workspaceFile': Use the .code-workspace file path
   * - 'allFolders': Combine all workspace folder paths
   * - 'firstFolder': Use only the first folder (backward compatible)
   */
  multiRootSource: MultiRootIdentifierSource;
}

/**
 * UI element groups that can be tinted.
 */
export type TintTarget = 'titleBar' | 'statusBar' | 'activityBar';

export type { ColorScheme } from '../color/schemes';

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

  /**
   * Seed value used to shift the base color tint calculation.
   * Changing this value produces completely different colors for all workspaces.
   * Default is 0.
   */
  seed: number;
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
