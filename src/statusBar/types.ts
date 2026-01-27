import type { ColorScheme } from '../config';
import type { ThemeType } from '../theme';

/**
 * Tint colors for display in the status bar tooltip.
 */
export interface TintColors {
  /** The base tint hue (before per-element scheme tweaks). */
  baseTint: string;
  /** Title bar background color (if enabled). */
  titleBar?: string;
  /** Activity bar background color (if enabled). */
  activityBar?: string;
  /** Status bar background color (if enabled). */
  statusBar?: string;
}

/**
 * State information for the status bar item.
 */
export interface StatusBarState {
  /** Whether Patina is globally enabled. */
  globalEnabled: boolean;

  /** Workspace-level enabled override (undefined = inherits global). */
  workspaceEnabledOverride: boolean | undefined;

  /** The workspace identifier used for color generation. */
  workspaceIdentifier: string | undefined;

  /** The detected/configured theme type. */
  themeType: ThemeType;

  /** Whether the theme type was auto-detected. */
  themeAutoDetected: boolean;

  /** The active color scheme. */
  colorScheme: ColorScheme;

  /** Tint colors for tooltip display. */
  tintColors: TintColors | undefined;
}
