import type { SchemeConfig } from './types';

/**
 * Monochrome color scheme - grayscale tints only, for a uniform look.
 *
 * All elements use zero saturation, resulting in pure grayscale colors.
 * The hue is effectively ignored, and only lightness values determine the
 * final appearance. This provides a neutral, non-distracting visual distinction
 * between workspaces.
 */
export const monochromeScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { saturation: 0, lightness: 0.28 },
    'titleBar.activeForeground': { saturation: 0, lightness: 0.88 },
    'titleBar.inactiveBackground': { saturation: 0, lightness: 0.22 },
    'titleBar.inactiveForeground': { saturation: 0, lightness: 0.65 },
    'statusBar.background': { saturation: 0, lightness: 0.3 },
    'statusBar.foreground': { saturation: 0, lightness: 0.88 },
    'activityBar.background': { saturation: 0, lightness: 0.2 },
    'activityBar.foreground': { saturation: 0, lightness: 0.82 },
  },
  light: {
    'titleBar.activeBackground': { saturation: 0, lightness: 0.85 },
    'titleBar.activeForeground': { saturation: 0, lightness: 0.1 },
    'titleBar.inactiveBackground': { saturation: 0, lightness: 0.9 },
    'titleBar.inactiveForeground': { saturation: 0, lightness: 0.3 },
    'statusBar.background': { saturation: 0, lightness: 0.82 },
    'statusBar.foreground': { saturation: 0, lightness: 0.1 },
    'activityBar.background': { saturation: 0, lightness: 0.92 },
    'activityBar.foreground': { saturation: 0, lightness: 0.12 },
  },
  hcDark: {
    'titleBar.activeBackground': { saturation: 0, lightness: 0.12 },
    'titleBar.activeForeground': { saturation: 0, lightness: 0.98 },
    'titleBar.inactiveBackground': { saturation: 0, lightness: 0.08 },
    'titleBar.inactiveForeground': { saturation: 0, lightness: 0.8 },
    'statusBar.background': { saturation: 0, lightness: 0.14 },
    'statusBar.foreground': { saturation: 0, lightness: 0.98 },
    'activityBar.background': { saturation: 0, lightness: 0.06 },
    'activityBar.foreground': { saturation: 0, lightness: 0.92 },
  },
  hcLight: {
    'titleBar.activeBackground': { saturation: 0, lightness: 0.94 },
    'titleBar.activeForeground': { saturation: 0, lightness: 0.05 },
    'titleBar.inactiveBackground': { saturation: 0, lightness: 0.96 },
    'titleBar.inactiveForeground': { saturation: 0, lightness: 0.2 },
    'statusBar.background': { saturation: 0, lightness: 0.92 },
    'statusBar.foreground': { saturation: 0, lightness: 0.05 },
    'activityBar.background': { saturation: 0, lightness: 0.98 },
    'activityBar.foreground': { saturation: 0, lightness: 0.08 },
  },
};
