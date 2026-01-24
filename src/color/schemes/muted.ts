import type { SchemeConfig } from './types';

/**
 * Muted color scheme - desaturated, subtle tones for minimal visual impact.
 *
 * All elements share the same hue but use significantly lower saturation values
 * for very subtle tints that don't distract. Foreground colors maintain
 * readability with minimal color influence.
 */
export const mutedScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { saturation: 0.2, lightness: 0.28 },
    'titleBar.activeForeground': { saturation: 0.08, lightness: 0.85 },
    'titleBar.inactiveBackground': { saturation: 0.15, lightness: 0.24 },
    'titleBar.inactiveForeground': { saturation: 0.05, lightness: 0.65 },
    'statusBar.background': { saturation: 0.25, lightness: 0.3 },
    'statusBar.foreground': { saturation: 0.08, lightness: 0.85 },
    'activityBar.background': { saturation: 0.18, lightness: 0.22 },
    'activityBar.foreground': { saturation: 0.06, lightness: 0.8 },
  },
  light: {
    'titleBar.activeBackground': { saturation: 0.22, lightness: 0.85 },
    'titleBar.activeForeground': { saturation: 0.12, lightness: 0.1 },
    'titleBar.inactiveBackground': { saturation: 0.15, lightness: 0.88 },
    'titleBar.inactiveForeground': { saturation: 0.08, lightness: 0.25 },
    'statusBar.background': { saturation: 0.25, lightness: 0.82 },
    'statusBar.foreground': { saturation: 0.12, lightness: 0.1 },
    'activityBar.background': { saturation: 0.2, lightness: 0.9 },
    'activityBar.foreground': { saturation: 0.1, lightness: 0.12 },
  },
  hcDark: {
    'titleBar.activeBackground': { saturation: 0.25, lightness: 0.12 },
    'titleBar.activeForeground': { saturation: 0.05, lightness: 0.95 },
    'titleBar.inactiveBackground': { saturation: 0.18, lightness: 0.1 },
    'titleBar.inactiveForeground': { saturation: 0.04, lightness: 0.8 },
    'statusBar.background': { saturation: 0.28, lightness: 0.14 },
    'statusBar.foreground': { saturation: 0.05, lightness: 0.95 },
    'activityBar.background': { saturation: 0.22, lightness: 0.08 },
    'activityBar.foreground': { saturation: 0.05, lightness: 0.9 },
  },
  hcLight: {
    'titleBar.activeBackground': { saturation: 0.25, lightness: 0.94 },
    'titleBar.activeForeground': { saturation: 0.15, lightness: 0.08 },
    'titleBar.inactiveBackground': { saturation: 0.18, lightness: 0.95 },
    'titleBar.inactiveForeground': { saturation: 0.1, lightness: 0.22 },
    'statusBar.background': { saturation: 0.28, lightness: 0.92 },
    'statusBar.foreground': { saturation: 0.15, lightness: 0.08 },
    'activityBar.background': { saturation: 0.22, lightness: 0.96 },
    'activityBar.foreground': { saturation: 0.12, lightness: 0.1 },
  },
};
