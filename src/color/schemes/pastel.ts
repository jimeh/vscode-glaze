import type { SchemeConfig } from './types';

/**
 * Pastel color scheme - soft, muted tones that blend gently with any theme.
 *
 * All elements share the same hue but vary in saturation/lightness for visual
 * hierarchy. Foreground colors use the same hue but with appropriate lightness
 * and low saturation to ensure readability while maintaining color harmony.
 */
export const pastelScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { saturation: 0.4, lightness: 0.32 },
    'titleBar.activeForeground': { saturation: 0.15, lightness: 0.9 },
    'titleBar.inactiveBackground': { saturation: 0.3, lightness: 0.28 },
    'titleBar.inactiveForeground': { saturation: 0.1, lightness: 0.7 },
    'statusBar.background': { saturation: 0.5, lightness: 0.35 },
    'statusBar.foreground': { saturation: 0.15, lightness: 0.9 },
    'activityBar.background': { saturation: 0.35, lightness: 0.25 },
    'activityBar.foreground': { saturation: 0.15, lightness: 0.85 },
  },
  light: {
    'titleBar.activeBackground': { saturation: 0.45, lightness: 0.82 },
    'titleBar.activeForeground': { saturation: 0.25, lightness: 0.05 },
    'titleBar.inactiveBackground': { saturation: 0.35, lightness: 0.86 },
    'titleBar.inactiveForeground': { saturation: 0.15, lightness: 0.2 },
    'statusBar.background': { saturation: 0.5, lightness: 0.78 },
    'statusBar.foreground': { saturation: 0.25, lightness: 0.05 },
    'activityBar.background': { saturation: 0.4, lightness: 0.88 },
    'activityBar.foreground': { saturation: 0.2, lightness: 0.06 },
  },
  hcDark: {
    'titleBar.activeBackground': { saturation: 0.5, lightness: 0.15 },
    'titleBar.activeForeground': { saturation: 0.1, lightness: 0.98 },
    'titleBar.inactiveBackground': { saturation: 0.4, lightness: 0.12 },
    'titleBar.inactiveForeground': { saturation: 0.08, lightness: 0.85 },
    'statusBar.background': { saturation: 0.55, lightness: 0.18 },
    'statusBar.foreground': { saturation: 0.1, lightness: 0.98 },
    'activityBar.background': { saturation: 0.45, lightness: 0.1 },
    'activityBar.foreground': { saturation: 0.1, lightness: 0.95 },
  },
  hcLight: {
    'titleBar.activeBackground': { saturation: 0.5, lightness: 0.92 },
    'titleBar.activeForeground': { saturation: 0.3, lightness: 0.05 },
    'titleBar.inactiveBackground': { saturation: 0.4, lightness: 0.94 },
    'titleBar.inactiveForeground': { saturation: 0.2, lightness: 0.2 },
    'statusBar.background': { saturation: 0.55, lightness: 0.9 },
    'statusBar.foreground': { saturation: 0.3, lightness: 0.05 },
    'activityBar.background': { saturation: 0.45, lightness: 0.95 },
    'activityBar.foreground': { saturation: 0.25, lightness: 0.08 },
  },
};
