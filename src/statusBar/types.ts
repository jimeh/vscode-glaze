import type { ColorScheme } from '../config';
import type { ThemeType } from '../theme';

/**
 * State information for the status bar item.
 */
export interface StatusBarState {
  /** Whether Patina is globally enabled. */
  globalEnabled: boolean;

  /** Workspace-level enabled state (undefined = not set). */
  workspaceEnabled: boolean | undefined;

  /** The workspace identifier used for color generation. */
  workspaceIdentifier: string | undefined;

  /** The detected/configured theme type. */
  themeType: ThemeType;

  /** Whether the theme type was auto-detected. */
  themeAutoDetected: boolean;

  /** The active color scheme. */
  colorScheme: ColorScheme;

  /** The primary tint color (titleBar.activeBackground). */
  tintColor: string | undefined;
}
