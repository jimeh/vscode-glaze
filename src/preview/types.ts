import type { ColorScheme } from '../config';
import type { ThemeType } from '../theme';

/**
 * Colors for a single UI element (background + foreground).
 */
export interface ElementColors {
  background: string;
  foreground: string;
}

/**
 * Colors for all three tintable elements at a single hue.
 */
export interface SchemePreviewColors {
  titleBar: ElementColors;
  statusBar: ElementColors;
  activityBar: ElementColors;
}

/**
 * Preview data for a single color scheme.
 */
export interface SchemePreview {
  /** Scheme identifier */
  scheme: ColorScheme;
  /** Display label */
  label: string;
  /** Colors for each sample hue */
  hueColors: SchemePreviewColors[];
}

/**
 * Preview data for the current workspace.
 */
export interface WorkspacePreview {
  /** Workspace identifier string used for color generation */
  identifier: string;
  /** Generated colors for this workspace */
  colors: SchemePreviewColors;
  /** Theme blend factor (0-1), undefined if no theme colors available */
  blendFactor?: number;
  /** Whether theme blending is active (theme colors available) */
  isBlended: boolean;
}

/**
 * Complete state for the preview panel.
 */
export interface PreviewState {
  /** Currently selected theme type for preview */
  themeType: ThemeType;
  /** Currently active color scheme */
  currentScheme: ColorScheme;
  /** Current workspace preview (if available) */
  workspacePreview?: WorkspacePreview;
  /** Preview data for all schemes */
  schemes: SchemePreview[];
}

/**
 * Messages from webview to extension.
 */
export type PreviewMessage =
  | { type: 'selectScheme'; scheme: ColorScheme }
  | { type: 'changeThemeType'; themeType: ThemeType };
