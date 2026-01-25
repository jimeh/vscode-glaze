import type { SchemeConfig } from './types';

/**
 * Monochrome color scheme - grayscale tints only, for a uniform look.
 *
 * Uses chromaFactor = 0 for all elements, resulting in pure grayscale colors.
 * The hue is effectively ignored, and only lightness values determine the
 * final appearance. This provides a neutral, non-distracting visual distinction
 * between workspaces.
 */
export const monochromeScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.3, chromaFactor: 0 },
    'titleBar.activeForeground': { lightness: 0.88, chromaFactor: 0 },
    'titleBar.inactiveBackground': { lightness: 0.24, chromaFactor: 0 },
    'titleBar.inactiveForeground': { lightness: 0.65, chromaFactor: 0 },
    'statusBar.background': { lightness: 0.32, chromaFactor: 0 },
    'statusBar.foreground': { lightness: 0.88, chromaFactor: 0 },
    'activityBar.background': { lightness: 0.22, chromaFactor: 0 },
    'activityBar.foreground': { lightness: 0.82, chromaFactor: 0 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.85, chromaFactor: 0 },
    'titleBar.activeForeground': { lightness: 0.15, chromaFactor: 0 },
    'titleBar.inactiveBackground': { lightness: 0.9, chromaFactor: 0 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0 },
    'statusBar.background': { lightness: 0.82, chromaFactor: 0 },
    'statusBar.foreground': { lightness: 0.15, chromaFactor: 0 },
    'activityBar.background': { lightness: 0.92, chromaFactor: 0 },
    'activityBar.foreground': { lightness: 0.18, chromaFactor: 0 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.14, chromaFactor: 0 },
    'titleBar.activeForeground': { lightness: 0.96, chromaFactor: 0 },
    'titleBar.inactiveBackground': { lightness: 0.1, chromaFactor: 0 },
    'titleBar.inactiveForeground': { lightness: 0.8, chromaFactor: 0 },
    'statusBar.background': { lightness: 0.16, chromaFactor: 0 },
    'statusBar.foreground': { lightness: 0.96, chromaFactor: 0 },
    'activityBar.background': { lightness: 0.08, chromaFactor: 0 },
    'activityBar.foreground': { lightness: 0.92, chromaFactor: 0 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.94, chromaFactor: 0 },
    'titleBar.activeForeground': { lightness: 0.08, chromaFactor: 0 },
    'titleBar.inactiveBackground': { lightness: 0.96, chromaFactor: 0 },
    'titleBar.inactiveForeground': { lightness: 0.25, chromaFactor: 0 },
    'statusBar.background': { lightness: 0.92, chromaFactor: 0 },
    'statusBar.foreground': { lightness: 0.08, chromaFactor: 0 },
    'activityBar.background': { lightness: 0.97, chromaFactor: 0 },
    'activityBar.foreground': { lightness: 0.1, chromaFactor: 0 },
  },
};
