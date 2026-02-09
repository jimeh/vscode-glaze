/**
 * Default blend factor for theme color blending.
 * Used as fallback when no explicit blend factor is configured.
 */
export const DEFAULT_BLEND_FACTOR = 0.35;

import type { BlendMethod } from '../color/blend';

export type { BlendMethod } from '../color/blend';
export type { ColorStyle } from '../color/styles';
export type { ColorHarmony } from '../color/harmony';

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

  /**
   * Whether to include the remote authority (e.g. hostname) in the
   * workspace identifier. When true, the same path on different
   * remote hosts produces different colors. Default is true.
   */
  includeRemoteAuthority: boolean;

  /**
   * Home directory override for remote workspaces. Used by
   * 'pathRelativeToHome' when the automatic heuristic fails.
   * Empty string means no override (use heuristic only).
   */
  remoteHomeDirectory: string;
}

/**
 * UI element groups that can be tinted.
 */
export type TintTarget = 'titleBar' | 'statusBar' | 'activityBar' | 'sideBar';

import type { ThemeMode } from '../theme/types';

export type { ThemeMode } from '../theme/types';

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

  /**
   * Override for the base hue (0-359). When set, bypasses the
   * deterministic hue calculation. null = no override.
   */
  baseHueOverride: number | null;
}

/**
 * Configuration for theme-related settings.
 */
export interface ThemeConfig {
  /**
   * Blend method for combining tint and theme colors.
   * - 'overlay': Alpha compositing in linear sRGB
   * - 'hueShift': OKLCH interpolation with directed hue blending
   * Default is 'overlay'.
   */
  blendMethod: BlendMethod;

  /**
   * How much to blend tint colors toward the theme's background color.
   * Value between 0 (no blending) and 1 (fully match theme).
   * Default is 0.35.
   */
  blendFactor: number;

  /**
   * Per-target blend factor overrides.
   * Only populated for targets that have an explicit override.
   * When set, overrides blendFactor for the specified element.
   */
  targetBlendFactors: Partial<Record<TintTarget, number>>;
}
