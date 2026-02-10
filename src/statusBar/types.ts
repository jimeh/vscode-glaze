import type { ColorHarmony, ColorStyle } from '../config';
import type { ThemeType } from '../theme';

/**
 * Tint colors for display in the status bar tooltip.
 */
export interface TintColors {
  /** The base tint hue (before per-element style tweaks). */
  baseTint: string;
  /** Title bar background color (if enabled). */
  titleBar?: string | undefined;
  /** Activity bar background color (if enabled). */
  activityBar?: string | undefined;
  /** Status bar background color (if enabled). */
  statusBar?: string | undefined;
  /** Side bar background color (if enabled). */
  sideBar?: string | undefined;
}

/**
 * State information for the status bar item.
 */
export interface StatusBarState {
  /** Whether Glaze is globally enabled. */
  readonly globalEnabled: boolean;

  /** Workspace-level enabled override (undefined = inherits global). */
  readonly workspaceEnabledOverride: boolean | undefined;

  /** The workspace identifier used for color generation. */
  readonly workspaceIdentifier: string | undefined;

  /** The name of the active VS Code color theme. */
  readonly themeName: string | undefined;

  /** The resolved tint type (auto-detected or manually configured). */
  readonly tintType: ThemeType;

  /** Whether the theme type was auto-detected. */
  readonly themeAutoDetected: boolean;

  /** The active color style. */
  readonly colorStyle: ColorStyle;

  /** The active color harmony. */
  readonly colorHarmony: ColorHarmony;

  /** Seed value used for tint calculation. */
  readonly seed: number;

  /** Base hue override (null = no override). */
  readonly baseHueOverride: number | null;

  /** Whether at least one tint target element is enabled. */
  readonly hasActiveTargets: boolean;

  /** Tint colors for tooltip display. */
  readonly tintColors: TintColors | undefined;

  /** Whether managed colors were modified outside of Glaze. */
  readonly customizedOutsideGlaze: boolean;

  /** Error message from the last failed apply/remove operation. */
  readonly lastError?: string | undefined;
}
