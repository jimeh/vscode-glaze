import type { SchemeConfig } from './types';

/**
 * Vibrant color scheme - higher saturation for bolder, more noticeable colors.
 *
 * All elements share the same hue but use higher saturation values compared to
 * pastel for more vivid, eye-catching tints. Foreground colors maintain
 * readability while complementing the saturated backgrounds.
 */
export const vibrantScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { saturation: 0.7, lightness: 0.35 },
    'titleBar.activeForeground': { saturation: 0.2, lightness: 0.95 },
    'titleBar.inactiveBackground': { saturation: 0.55, lightness: 0.28 },
    'titleBar.inactiveForeground': { saturation: 0.12, lightness: 0.7 },
    'statusBar.background': { saturation: 0.75, lightness: 0.38 },
    'statusBar.foreground': { saturation: 0.2, lightness: 0.95 },
    'activityBar.background': { saturation: 0.65, lightness: 0.28 },
    'activityBar.foreground': { saturation: 0.18, lightness: 0.9 },
  },
  light: {
    'titleBar.activeBackground': { saturation: 0.65, lightness: 0.75 },
    'titleBar.activeForeground': { saturation: 0.4, lightness: 0.1 },
    'titleBar.inactiveBackground': { saturation: 0.5, lightness: 0.8 },
    'titleBar.inactiveForeground': { saturation: 0.2, lightness: 0.25 },
    'statusBar.background': { saturation: 0.7, lightness: 0.72 },
    'statusBar.foreground': { saturation: 0.4, lightness: 0.1 },
    'activityBar.background': { saturation: 0.6, lightness: 0.82 },
    'activityBar.foreground': { saturation: 0.3, lightness: 0.12 },
  },
  hcDark: {
    'titleBar.activeBackground': { saturation: 0.75, lightness: 0.2 },
    'titleBar.activeForeground': { saturation: 0.15, lightness: 0.98 },
    'titleBar.inactiveBackground': { saturation: 0.6, lightness: 0.15 },
    'titleBar.inactiveForeground': { saturation: 0.1, lightness: 0.85 },
    'statusBar.background': { saturation: 0.8, lightness: 0.22 },
    'statusBar.foreground': { saturation: 0.15, lightness: 0.98 },
    'activityBar.background': { saturation: 0.7, lightness: 0.15 },
    'activityBar.foreground': { saturation: 0.12, lightness: 0.95 },
  },
  hcLight: {
    'titleBar.activeBackground': { saturation: 0.7, lightness: 0.88 },
    'titleBar.activeForeground': { saturation: 0.45, lightness: 0.08 },
    'titleBar.inactiveBackground': { saturation: 0.55, lightness: 0.9 },
    'titleBar.inactiveForeground': { saturation: 0.25, lightness: 0.22 },
    'statusBar.background': { saturation: 0.75, lightness: 0.85 },
    'statusBar.foreground': { saturation: 0.45, lightness: 0.08 },
    'activityBar.background': { saturation: 0.65, lightness: 0.92 },
    'activityBar.foreground': { saturation: 0.35, lightness: 0.1 },
  },
};
