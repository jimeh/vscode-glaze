import type { ColorStyle, TintTarget } from '../config';
import type { ColorHarmony } from '../color/harmony';
import type { ThemeType } from '../theme';

/**
 * Colors for a single UI element (background + foreground).
 */
interface ElementColors {
  background: string;
  foreground: string;
}

/**
 * Colors for all three tintable elements at a single hue.
 */
export interface StylePreviewColors {
  titleBar: ElementColors;
  statusBar: ElementColors;
  activityBar: ElementColors;
}

/**
 * Preview data for a single color style.
 */
export interface StylePreview {
  /** Style identifier */
  style: ColorStyle;
  /** Display label */
  label: string;
  /** Colors for each sample hue */
  hueColors: StylePreviewColors[];
}

/**
 * Preview data for a single color harmony.
 */
export interface HarmonyPreview {
  /** Harmony identifier */
  harmony: ColorHarmony;
  /** Display label */
  label: string;
  /** Colors for each sample hue */
  hueColors: StylePreviewColors[];
}

/**
 * Preview data for the current workspace.
 */
export interface WorkspacePreview {
  /** Workspace identifier string used for color generation */
  identifier: string;
  /** Generated colors for this workspace */
  colors: StylePreviewColors;
  /** Theme blend factor (0-1), undefined if no theme colors available */
  blendFactor?: number | undefined;
  /** Whether theme blending is active (theme colors available) */
  isBlended: boolean;
  /** Per-target blend factor overrides, if any */
  targetBlendFactors?: Partial<Record<TintTarget, number>> | undefined;
}

/**
 * Complete state for the preview panel.
 */
export interface PreviewState {
  /** Currently selected theme type for preview */
  themeType: ThemeType;
  /** Currently active color style */
  currentStyle: ColorStyle;
  /** Current workspace preview (if available) */
  workspacePreview?: WorkspacePreview | undefined;
  /** Currently active color harmony */
  currentHarmony: ColorHarmony;
  /** Preview data for all styles */
  styles: StylePreview[];
  /** Preview data for all harmonies */
  harmonies: HarmonyPreview[];
}

/**
 * Messages from webview to extension.
 */
export type PreviewMessage =
  | { type: 'selectStyle'; style: ColorStyle }
  | { type: 'selectHarmony'; harmony: ColorHarmony }
  | { type: 'changeThemeType'; themeType: ThemeType };
