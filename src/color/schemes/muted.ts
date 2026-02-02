import type { SchemeConfig } from './types';

/**
 * Muted color scheme - subtle, desaturated tones for minimal visual impact.
 *
 * Uses OKLCH color space with chromaFactor ~0.25-0.35 for subtle tints
 * that provide clear workspace differentiation without distraction.
 *
 * Foreground colors use minimal chroma for neutral readability with
 * just a hint of color influence.
 */
export const mutedScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.36, chromaFactor: 0.32 },
    'titleBar.activeForeground': { lightness: 0.88, chromaFactor: 0.08 },
    'titleBar.inactiveBackground': { lightness: 0.32, chromaFactor: 0.25 },
    'titleBar.inactiveForeground': { lightness: 0.68, chromaFactor: 0.06 },
    'statusBar.background': { lightness: 0.38, chromaFactor: 0.35 },
    'statusBar.foreground': { lightness: 0.88, chromaFactor: 0.08 },
    'activityBar.background': { lightness: 0.3, chromaFactor: 0.28 },
    'activityBar.foreground': { lightness: 0.84, chromaFactor: 0.07 },
    'sideBar.background': { lightness: 0.27, chromaFactor: 0.28 },
    'sideBar.foreground': { lightness: 0.84, chromaFactor: 0.07 },
    'sideBarSectionHeader.background': { lightness: 0.3, chromaFactor: 0.28 },
    'sideBarSectionHeader.foreground': { lightness: 0.84, chromaFactor: 0.07 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.78, chromaFactor: 0.32 },
    'titleBar.activeForeground': { lightness: 0.18, chromaFactor: 0.1 },
    'titleBar.inactiveBackground': { lightness: 0.82, chromaFactor: 0.25 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0.06 },
    'statusBar.background': { lightness: 0.75, chromaFactor: 0.35 },
    'statusBar.foreground': { lightness: 0.18, chromaFactor: 0.1 },
    'activityBar.background': { lightness: 0.84, chromaFactor: 0.28 },
    'activityBar.foreground': { lightness: 0.2, chromaFactor: 0.08 },
    'sideBar.background': { lightness: 0.87, chromaFactor: 0.28 },
    'sideBar.foreground': { lightness: 0.2, chromaFactor: 0.08 },
    'sideBarSectionHeader.background': { lightness: 0.84, chromaFactor: 0.28 },
    'sideBarSectionHeader.foreground': { lightness: 0.2, chromaFactor: 0.08 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.2, chromaFactor: 0.35 },
    'titleBar.activeForeground': { lightness: 0.95, chromaFactor: 0.06 },
    'titleBar.inactiveBackground': { lightness: 0.16, chromaFactor: 0.28 },
    'titleBar.inactiveForeground': { lightness: 0.8, chromaFactor: 0.04 },
    'statusBar.background': { lightness: 0.22, chromaFactor: 0.38 },
    'statusBar.foreground': { lightness: 0.95, chromaFactor: 0.06 },
    'activityBar.background': { lightness: 0.14, chromaFactor: 0.32 },
    'activityBar.foreground': { lightness: 0.92, chromaFactor: 0.05 },
    'sideBar.background': { lightness: 0.11, chromaFactor: 0.32 },
    'sideBar.foreground': { lightness: 0.92, chromaFactor: 0.05 },
    'sideBarSectionHeader.background': { lightness: 0.14, chromaFactor: 0.32 },
    'sideBarSectionHeader.foreground': { lightness: 0.92, chromaFactor: 0.05 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.9, chromaFactor: 0.35 },
    'titleBar.activeForeground': { lightness: 0.12, chromaFactor: 0.12 },
    'titleBar.inactiveBackground': { lightness: 0.92, chromaFactor: 0.28 },
    'titleBar.inactiveForeground': { lightness: 0.28, chromaFactor: 0.08 },
    'statusBar.background': { lightness: 0.88, chromaFactor: 0.38 },
    'statusBar.foreground': { lightness: 0.12, chromaFactor: 0.12 },
    'activityBar.background': { lightness: 0.94, chromaFactor: 0.32 },
    'activityBar.foreground': { lightness: 0.14, chromaFactor: 0.1 },
    'sideBar.background': { lightness: 0.97, chromaFactor: 0.32 },
    'sideBar.foreground': { lightness: 0.14, chromaFactor: 0.1 },
    'sideBarSectionHeader.background': { lightness: 0.94, chromaFactor: 0.32 },
    'sideBarSectionHeader.foreground': { lightness: 0.14, chromaFactor: 0.1 },
  },
};
