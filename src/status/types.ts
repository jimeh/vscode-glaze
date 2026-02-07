import type { ColorHarmony, ColorStyle, TintTarget } from '../config';
import type { ThemeType } from '../theme';
import type { TintKeyDetail } from '../color/tint';

/**
 * General status information about the current Patina configuration.
 */
export interface StatusGeneralInfo {
  /** Whether Patina is actively applying tint colors (enabled + has identifier + has targets) */
  active: boolean;
  /** Global enabled setting */
  globalEnabled: boolean;
  /** Workspace-level enabled override */
  workspaceEnabled: boolean | undefined;
  /** The resolved workspace identifier */
  workspaceIdentifier: string | undefined;
  /** Active theme name */
  themeName: string | undefined;
  /** The theme's own type from the database. */
  themeType: ThemeType | undefined;
  /** The resolved tint type (auto-detected or manually configured). */
  tintType: ThemeType;
  /** Whether tint type was auto-detected */
  themeAutoDetected: boolean;
  /** Whether theme colors are available from the database */
  themeColorsAvailable: boolean;
  /** OS color scheme (dark/light mode) */
  osColorScheme: 'dark' | 'light' | undefined;
  /** Active color style */
  colorStyle: ColorStyle;
  /** Active color harmony */
  colorHarmony: ColorHarmony;
  /** Theme blend factor (0-1) */
  blendFactor: number;
  /** Per-target blend factor overrides */
  targetBlendFactors: Partial<Record<TintTarget, number>>;
  /** Seed value for hue calculation */
  seed: number;
  /** Base hue override (null = no override) */
  baseHueOverride: number | null;
  /** Computed base hue angle (0-359) */
  baseHue: number;
  /** Active tint targets */
  targets: TintTarget[];
  /** Whether managed colors were modified outside of Patina. */
  customizedOutsidePatina: boolean;
}

/**
 * Complete status state for the webview panel.
 */
export interface StatusState {
  general: StatusGeneralInfo;
  colors: readonly TintKeyDetail[];
}

/**
 * Messages from the webview to the extension.
 */
export type StatusMessage = { type: 'refresh' };
