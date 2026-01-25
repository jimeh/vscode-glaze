import type { SchemeConfig } from './types';

/**
 * Duotone color scheme - base hue + complement on activity bar.
 *
 * Title bar and status bar use the base hue, while the activity bar
 * uses the complementary hue (180° offset). Creates a bold accent
 * on the side of the editor.
 */
export const duotoneScheme: SchemeConfig = {
  dark: {
    // Base hue for title bar and status bar
    'titleBar.activeBackground': { lightness: 0.38, chromaFactor: 0.5 },
    'titleBar.activeForeground': { lightness: 0.92, chromaFactor: 0.12 },
    'titleBar.inactiveBackground': { lightness: 0.32, chromaFactor: 0.4 },
    'titleBar.inactiveForeground': { lightness: 0.72, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.4, chromaFactor: 0.5 },
    'statusBar.foreground': { lightness: 0.92, chromaFactor: 0.12 },
    // Complement hue (+180°) for activity bar
    'activityBar.background': {
      lightness: 0.28,
      chromaFactor: 0.45,
      hueOffset: 180,
    },
    'activityBar.foreground': {
      lightness: 0.88,
      chromaFactor: 0.1,
      hueOffset: 180,
    },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.78, chromaFactor: 0.45 },
    'titleBar.activeForeground': { lightness: 0.2, chromaFactor: 0.15 },
    'titleBar.inactiveBackground': { lightness: 0.82, chromaFactor: 0.35 },
    'titleBar.inactiveForeground': { lightness: 0.38, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.75, chromaFactor: 0.45 },
    'statusBar.foreground': { lightness: 0.2, chromaFactor: 0.15 },
    'activityBar.background': {
      lightness: 0.85,
      chromaFactor: 0.4,
      hueOffset: 180,
    },
    'activityBar.foreground': {
      lightness: 0.22,
      chromaFactor: 0.12,
      hueOffset: 180,
    },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.2, chromaFactor: 0.55 },
    'titleBar.activeForeground': { lightness: 0.96, chromaFactor: 0.1 },
    'titleBar.inactiveBackground': { lightness: 0.16, chromaFactor: 0.45 },
    'titleBar.inactiveForeground': { lightness: 0.82, chromaFactor: 0.08 },
    'statusBar.background': { lightness: 0.22, chromaFactor: 0.55 },
    'statusBar.foreground': { lightness: 0.96, chromaFactor: 0.1 },
    'activityBar.background': {
      lightness: 0.14,
      chromaFactor: 0.5,
      hueOffset: 180,
    },
    'activityBar.foreground': {
      lightness: 0.94,
      chromaFactor: 0.08,
      hueOffset: 180,
    },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.88, chromaFactor: 0.5 },
    'titleBar.activeForeground': { lightness: 0.1, chromaFactor: 0.18 },
    'titleBar.inactiveBackground': { lightness: 0.9, chromaFactor: 0.4 },
    'titleBar.inactiveForeground': { lightness: 0.28, chromaFactor: 0.12 },
    'statusBar.background': { lightness: 0.86, chromaFactor: 0.5 },
    'statusBar.foreground': { lightness: 0.1, chromaFactor: 0.18 },
    'activityBar.background': {
      lightness: 0.92,
      chromaFactor: 0.45,
      hueOffset: 180,
    },
    'activityBar.foreground': {
      lightness: 0.12,
      chromaFactor: 0.15,
      hueOffset: 180,
    },
  },
};
