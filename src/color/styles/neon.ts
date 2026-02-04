import type { StyleConfig } from './types';

/**
 * Neon color style - maximum chroma with elevated lightness for glow effect.
 *
 * Uses chromaFactor at or near 1.0 (full gamut) with boosted lightness
 * values to create vivid, glowing colors reminiscent of neon signs.
 * Best suited for users who want maximum visual impact.
 */
export const neonStyle: StyleConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.58, chromaFactor: 1.0 },
    'titleBar.activeForeground': { lightness: 0.98, chromaFactor: 0.15 },
    'titleBar.inactiveBackground': { lightness: 0.5, chromaFactor: 0.85 },
    'titleBar.inactiveForeground': { lightness: 0.82, chromaFactor: 0.12 },
    'statusBar.background': { lightness: 0.6, chromaFactor: 1.0 },
    'statusBar.foreground': { lightness: 0.98, chromaFactor: 0.15 },
    'activityBar.background': { lightness: 0.52, chromaFactor: 0.95 },
    'activityBar.foreground': { lightness: 0.96, chromaFactor: 0.14 },
    'sideBar.background': { lightness: 0.49, chromaFactor: 0.95 },
    'sideBar.foreground': { lightness: 0.96, chromaFactor: 0.14 },
    'sideBarSectionHeader.background': { lightness: 0.52, chromaFactor: 0.95 },
    'sideBarSectionHeader.foreground': { lightness: 0.96, chromaFactor: 0.14 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.72, chromaFactor: 0.95 },
    'titleBar.activeForeground': { lightness: 0.12, chromaFactor: 0.25 },
    'titleBar.inactiveBackground': { lightness: 0.76, chromaFactor: 0.8 },
    'titleBar.inactiveForeground': { lightness: 0.28, chromaFactor: 0.18 },
    'statusBar.background': { lightness: 0.7, chromaFactor: 1.0 },
    'statusBar.foreground': { lightness: 0.12, chromaFactor: 0.25 },
    'activityBar.background': { lightness: 0.78, chromaFactor: 0.9 },
    'activityBar.foreground': { lightness: 0.15, chromaFactor: 0.2 },
    'sideBar.background': { lightness: 0.81, chromaFactor: 0.9 },
    'sideBar.foreground': { lightness: 0.15, chromaFactor: 0.2 },
    'sideBarSectionHeader.background': { lightness: 0.78, chromaFactor: 0.9 },
    'sideBarSectionHeader.foreground': { lightness: 0.15, chromaFactor: 0.2 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.45, chromaFactor: 1.0 },
    'titleBar.activeForeground': { lightness: 0.99, chromaFactor: 0.12 },
    'titleBar.inactiveBackground': { lightness: 0.38, chromaFactor: 0.9 },
    'titleBar.inactiveForeground': { lightness: 0.9, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.48, chromaFactor: 1.0 },
    'statusBar.foreground': { lightness: 0.99, chromaFactor: 0.12 },
    'activityBar.background': { lightness: 0.4, chromaFactor: 0.95 },
    'activityBar.foreground': { lightness: 0.98, chromaFactor: 0.1 },
    'sideBar.background': { lightness: 0.37, chromaFactor: 0.95 },
    'sideBar.foreground': { lightness: 0.98, chromaFactor: 0.1 },
    'sideBarSectionHeader.background': { lightness: 0.4, chromaFactor: 0.95 },
    'sideBarSectionHeader.foreground': { lightness: 0.98, chromaFactor: 0.1 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.8, chromaFactor: 1.0 },
    'titleBar.activeForeground': { lightness: 0.06, chromaFactor: 0.3 },
    'titleBar.inactiveBackground': { lightness: 0.84, chromaFactor: 0.85 },
    'titleBar.inactiveForeground': { lightness: 0.2, chromaFactor: 0.2 },
    'statusBar.background': { lightness: 0.78, chromaFactor: 1.0 },
    'statusBar.foreground': { lightness: 0.06, chromaFactor: 0.3 },
    'activityBar.background': { lightness: 0.85, chromaFactor: 0.95 },
    'activityBar.foreground': { lightness: 0.08, chromaFactor: 0.25 },
    'sideBar.background': { lightness: 0.88, chromaFactor: 0.95 },
    'sideBar.foreground': { lightness: 0.08, chromaFactor: 0.25 },
    'sideBarSectionHeader.background': { lightness: 0.85, chromaFactor: 0.95 },
    'sideBarSectionHeader.foreground': { lightness: 0.08, chromaFactor: 0.25 },
  },
};
