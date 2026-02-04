import type { StyleConfig } from './types';

/**
 * Pastel color style - soft, muted tones that blend gently with any theme.
 *
 * Uses OKLCH color space with chromaFactor ~0.45-0.60 for soft but colorful
 * tints. All elements share the same hue (derived from workspace identifier)
 * but vary in lightness and chroma factor to create visual hierarchy.
 *
 * Foreground colors use low chroma factor for readability while maintaining
 * color harmony with background elements.
 */
export const pastelStyle: StyleConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.42, chromaFactor: 0.55 },
    'titleBar.activeForeground': { lightness: 0.92, chromaFactor: 0.12 },
    'titleBar.inactiveBackground': { lightness: 0.36, chromaFactor: 0.45 },
    'titleBar.inactiveForeground': { lightness: 0.72, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.45, chromaFactor: 0.6 },
    'statusBar.foreground': { lightness: 0.92, chromaFactor: 0.12 },
    'activityBar.background': { lightness: 0.34, chromaFactor: 0.5 },
    'activityBar.foreground': { lightness: 0.88, chromaFactor: 0.12 },
    'sideBar.background': { lightness: 0.31, chromaFactor: 0.5 },
    'sideBar.foreground': { lightness: 0.88, chromaFactor: 0.12 },
    'sideBarSectionHeader.background': { lightness: 0.34, chromaFactor: 0.5 },
    'sideBarSectionHeader.foreground': { lightness: 0.88, chromaFactor: 0.12 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.76, chromaFactor: 0.55 },
    'titleBar.activeForeground': { lightness: 0.15, chromaFactor: 0.15 },
    'titleBar.inactiveBackground': { lightness: 0.8, chromaFactor: 0.45 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.72, chromaFactor: 0.6 },
    'statusBar.foreground': { lightness: 0.15, chromaFactor: 0.15 },
    'activityBar.background': { lightness: 0.82, chromaFactor: 0.5 },
    'activityBar.foreground': { lightness: 0.18, chromaFactor: 0.12 },
    'sideBar.background': { lightness: 0.85, chromaFactor: 0.5 },
    'sideBar.foreground': { lightness: 0.18, chromaFactor: 0.12 },
    'sideBarSectionHeader.background': { lightness: 0.82, chromaFactor: 0.5 },
    'sideBarSectionHeader.foreground': { lightness: 0.18, chromaFactor: 0.12 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.24, chromaFactor: 0.6 },
    'titleBar.activeForeground': { lightness: 0.96, chromaFactor: 0.1 },
    'titleBar.inactiveBackground': { lightness: 0.2, chromaFactor: 0.5 },
    'titleBar.inactiveForeground': { lightness: 0.82, chromaFactor: 0.08 },
    'statusBar.background': { lightness: 0.26, chromaFactor: 0.65 },
    'statusBar.foreground': { lightness: 0.96, chromaFactor: 0.1 },
    'activityBar.background': { lightness: 0.18, chromaFactor: 0.55 },
    'activityBar.foreground': { lightness: 0.94, chromaFactor: 0.1 },
    'sideBar.background': { lightness: 0.15, chromaFactor: 0.55 },
    'sideBar.foreground': { lightness: 0.94, chromaFactor: 0.1 },
    'sideBarSectionHeader.background': { lightness: 0.18, chromaFactor: 0.55 },
    'sideBarSectionHeader.foreground': { lightness: 0.94, chromaFactor: 0.1 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.88, chromaFactor: 0.6 },
    'titleBar.activeForeground': { lightness: 0.1, chromaFactor: 0.2 },
    'titleBar.inactiveBackground': { lightness: 0.9, chromaFactor: 0.5 },
    'titleBar.inactiveForeground': { lightness: 0.25, chromaFactor: 0.12 },
    'statusBar.background': { lightness: 0.85, chromaFactor: 0.65 },
    'statusBar.foreground': { lightness: 0.1, chromaFactor: 0.2 },
    'activityBar.background': { lightness: 0.92, chromaFactor: 0.55 },
    'activityBar.foreground': { lightness: 0.12, chromaFactor: 0.15 },
    'sideBar.background': { lightness: 0.95, chromaFactor: 0.55 },
    'sideBar.foreground': { lightness: 0.12, chromaFactor: 0.15 },
    'sideBarSectionHeader.background': { lightness: 0.92, chromaFactor: 0.55 },
    'sideBarSectionHeader.foreground': { lightness: 0.12, chromaFactor: 0.15 },
  },
};
