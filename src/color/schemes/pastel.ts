import type { SchemeConfig } from './types';

/**
 * Pastel color scheme - soft, muted tones that blend gently with any theme.
 *
 * Uses OKLCH color space with chromaFactor ~0.3-0.5 for soft but colorful tints.
 * All elements share the same hue (derived from workspace identifier) but vary
 * in lightness and chroma factor to create visual hierarchy.
 *
 * Foreground colors use low chroma factor for readability while maintaining
 * color harmony with background elements.
 */
export const pastelScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.35, chromaFactor: 0.4 },
    'titleBar.activeForeground': { lightness: 0.9, chromaFactor: 0.1 },
    'titleBar.inactiveBackground': { lightness: 0.3, chromaFactor: 0.3 },
    'titleBar.inactiveForeground': { lightness: 0.7, chromaFactor: 0.08 },
    'statusBar.background': { lightness: 0.38, chromaFactor: 0.45 },
    'statusBar.foreground': { lightness: 0.9, chromaFactor: 0.1 },
    'activityBar.background': { lightness: 0.28, chromaFactor: 0.35 },
    'activityBar.foreground': { lightness: 0.85, chromaFactor: 0.1 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.82, chromaFactor: 0.4 },
    'titleBar.activeForeground': { lightness: 0.15, chromaFactor: 0.15 },
    'titleBar.inactiveBackground': { lightness: 0.86, chromaFactor: 0.3 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.78, chromaFactor: 0.45 },
    'statusBar.foreground': { lightness: 0.15, chromaFactor: 0.15 },
    'activityBar.background': { lightness: 0.88, chromaFactor: 0.35 },
    'activityBar.foreground': { lightness: 0.18, chromaFactor: 0.12 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.18, chromaFactor: 0.45 },
    'titleBar.activeForeground': { lightness: 0.95, chromaFactor: 0.08 },
    'titleBar.inactiveBackground': { lightness: 0.14, chromaFactor: 0.35 },
    'titleBar.inactiveForeground': { lightness: 0.8, chromaFactor: 0.06 },
    'statusBar.background': { lightness: 0.2, chromaFactor: 0.5 },
    'statusBar.foreground': { lightness: 0.95, chromaFactor: 0.08 },
    'activityBar.background': { lightness: 0.12, chromaFactor: 0.4 },
    'activityBar.foreground': { lightness: 0.92, chromaFactor: 0.08 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.92, chromaFactor: 0.45 },
    'titleBar.activeForeground': { lightness: 0.1, chromaFactor: 0.2 },
    'titleBar.inactiveBackground': { lightness: 0.94, chromaFactor: 0.35 },
    'titleBar.inactiveForeground': { lightness: 0.25, chromaFactor: 0.12 },
    'statusBar.background': { lightness: 0.9, chromaFactor: 0.5 },
    'statusBar.foreground': { lightness: 0.1, chromaFactor: 0.2 },
    'activityBar.background': { lightness: 0.95, chromaFactor: 0.4 },
    'activityBar.foreground': { lightness: 0.12, chromaFactor: 0.15 },
  },
};
