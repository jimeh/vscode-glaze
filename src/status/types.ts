import type { ColorHarmony, ColorStyle, TintTarget } from '../config';
import type { ColorType, ElementType, PaletteKey, ThemeType } from '../theme';

/**
 * Color detail for a single managed palette key in the status view.
 */
export interface StatusColorDetail {
  /** The palette key (e.g., 'titleBar.activeBackground') */
  key: PaletteKey;
  /** UI element this color belongs to */
  element: ElementType;
  /** Whether this is a background or foreground color */
  colorType: ColorType;
  /** Theme color from the theme database, if available */
  themeColor: string | undefined;
  /** Pre-blend tint color (OKLCH → hex, before theme blending) */
  tintColor: string;
  /** Final blended color (after theme blending, or same as tint) */
  finalColor: string;
  /** Whether the element is in the active tint targets */
  enabled: boolean;
}

/**
 * General status information about the current Patina configuration.
 */
export interface StatusGeneralInfo {
  /** Whether Patina is currently active (enabled + has identifier) */
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
  colors: StatusColorDetail[];
}

/**
 * Messages from the webview to the extension.
 */
export type StatusMessage = { type: 'refresh' };
