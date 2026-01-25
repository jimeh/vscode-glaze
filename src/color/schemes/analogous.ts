import type { SchemeConfig } from './types';

/**
 * Analogous color scheme - three adjacent hues spread across UI elements.
 *
 * Uses hues at -25°, 0°, and +25° from the base to create a harmonious
 * color palette. Each UI element gets a slightly different hue while
 * maintaining visual cohesion.
 *
 * Title bar: base hue - 25°
 * Activity bar: base hue
 * Status bar: base hue + 25°
 */
export const analogousScheme: SchemeConfig = {
  dark: {
    // Base hue - 25° for title bar
    'titleBar.activeBackground': {
      lightness: 0.38,
      chromaFactor: 0.5,
      hueOffset: -25,
    },
    'titleBar.activeForeground': {
      lightness: 0.92,
      chromaFactor: 0.12,
      hueOffset: -25,
    },
    'titleBar.inactiveBackground': {
      lightness: 0.32,
      chromaFactor: 0.4,
      hueOffset: -25,
    },
    'titleBar.inactiveForeground': {
      lightness: 0.72,
      chromaFactor: 0.1,
      hueOffset: -25,
    },
    // Base hue for activity bar
    'activityBar.background': { lightness: 0.28, chromaFactor: 0.45 },
    'activityBar.foreground': { lightness: 0.88, chromaFactor: 0.1 },
    // Base hue + 25° for status bar
    'statusBar.background': {
      lightness: 0.4,
      chromaFactor: 0.5,
      hueOffset: 25,
    },
    'statusBar.foreground': {
      lightness: 0.92,
      chromaFactor: 0.12,
      hueOffset: 25,
    },
  },
  light: {
    'titleBar.activeBackground': {
      lightness: 0.78,
      chromaFactor: 0.45,
      hueOffset: -25,
    },
    'titleBar.activeForeground': {
      lightness: 0.2,
      chromaFactor: 0.15,
      hueOffset: -25,
    },
    'titleBar.inactiveBackground': {
      lightness: 0.82,
      chromaFactor: 0.35,
      hueOffset: -25,
    },
    'titleBar.inactiveForeground': {
      lightness: 0.38,
      chromaFactor: 0.1,
      hueOffset: -25,
    },
    'activityBar.background': { lightness: 0.85, chromaFactor: 0.4 },
    'activityBar.foreground': { lightness: 0.22, chromaFactor: 0.12 },
    'statusBar.background': {
      lightness: 0.75,
      chromaFactor: 0.45,
      hueOffset: 25,
    },
    'statusBar.foreground': {
      lightness: 0.2,
      chromaFactor: 0.15,
      hueOffset: 25,
    },
  },
  hcDark: {
    'titleBar.activeBackground': {
      lightness: 0.2,
      chromaFactor: 0.55,
      hueOffset: -25,
    },
    'titleBar.activeForeground': {
      lightness: 0.96,
      chromaFactor: 0.1,
      hueOffset: -25,
    },
    'titleBar.inactiveBackground': {
      lightness: 0.16,
      chromaFactor: 0.45,
      hueOffset: -25,
    },
    'titleBar.inactiveForeground': {
      lightness: 0.82,
      chromaFactor: 0.08,
      hueOffset: -25,
    },
    'activityBar.background': { lightness: 0.14, chromaFactor: 0.5 },
    'activityBar.foreground': { lightness: 0.94, chromaFactor: 0.08 },
    'statusBar.background': {
      lightness: 0.22,
      chromaFactor: 0.55,
      hueOffset: 25,
    },
    'statusBar.foreground': {
      lightness: 0.96,
      chromaFactor: 0.1,
      hueOffset: 25,
    },
  },
  hcLight: {
    'titleBar.activeBackground': {
      lightness: 0.88,
      chromaFactor: 0.5,
      hueOffset: -25,
    },
    'titleBar.activeForeground': {
      lightness: 0.1,
      chromaFactor: 0.18,
      hueOffset: -25,
    },
    'titleBar.inactiveBackground': {
      lightness: 0.9,
      chromaFactor: 0.4,
      hueOffset: -25,
    },
    'titleBar.inactiveForeground': {
      lightness: 0.28,
      chromaFactor: 0.12,
      hueOffset: -25,
    },
    'activityBar.background': { lightness: 0.92, chromaFactor: 0.45 },
    'activityBar.foreground': { lightness: 0.12, chromaFactor: 0.15 },
    'statusBar.background': {
      lightness: 0.86,
      chromaFactor: 0.5,
      hueOffset: 25,
    },
    'statusBar.foreground': {
      lightness: 0.1,
      chromaFactor: 0.18,
      hueOffset: 25,
    },
  },
};
