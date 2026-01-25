import type { SchemeConfig } from './types';

/**
 * Vibrant color scheme - bold, saturated tones for maximum visual impact.
 *
 * Uses OKLCH color space with chromaFactor ~0.7-0.95 for vivid, eye-catching
 * colors. Background lightness is boosted for better visibility with
 * the high chroma values.
 *
 * Foreground colors use moderate chroma to complement the saturated
 * backgrounds while maintaining readability.
 */
export const vibrantScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.44, chromaFactor: 0.85 },
    'titleBar.activeForeground': { lightness: 0.94, chromaFactor: 0.15 },
    'titleBar.inactiveBackground': { lightness: 0.38, chromaFactor: 0.7 },
    'titleBar.inactiveForeground': { lightness: 0.75, chromaFactor: 0.12 },
    'statusBar.background': { lightness: 0.46, chromaFactor: 0.9 },
    'statusBar.foreground': { lightness: 0.94, chromaFactor: 0.15 },
    'activityBar.background': { lightness: 0.36, chromaFactor: 0.8 },
    'activityBar.foreground': { lightness: 0.9, chromaFactor: 0.14 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.68, chromaFactor: 0.8 },
    'titleBar.activeForeground': { lightness: 0.18, chromaFactor: 0.25 },
    'titleBar.inactiveBackground': { lightness: 0.73, chromaFactor: 0.65 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0.15 },
    'statusBar.background': { lightness: 0.65, chromaFactor: 0.85 },
    'statusBar.foreground': { lightness: 0.18, chromaFactor: 0.25 },
    'activityBar.background': { lightness: 0.75, chromaFactor: 0.75 },
    'activityBar.foreground': { lightness: 0.2, chromaFactor: 0.2 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.28, chromaFactor: 0.9 },
    'titleBar.activeForeground': { lightness: 0.97, chromaFactor: 0.12 },
    'titleBar.inactiveBackground': { lightness: 0.22, chromaFactor: 0.75 },
    'titleBar.inactiveForeground': { lightness: 0.84, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.3, chromaFactor: 0.95 },
    'statusBar.foreground': { lightness: 0.97, chromaFactor: 0.12 },
    'activityBar.background': { lightness: 0.22, chromaFactor: 0.85 },
    'activityBar.foreground': { lightness: 0.95, chromaFactor: 0.12 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.82, chromaFactor: 0.85 },
    'titleBar.activeForeground': { lightness: 0.12, chromaFactor: 0.3 },
    'titleBar.inactiveBackground': { lightness: 0.85, chromaFactor: 0.7 },
    'titleBar.inactiveForeground': { lightness: 0.28, chromaFactor: 0.18 },
    'statusBar.background': { lightness: 0.8, chromaFactor: 0.9 },
    'statusBar.foreground': { lightness: 0.12, chromaFactor: 0.3 },
    'activityBar.background': { lightness: 0.87, chromaFactor: 0.8 },
    'activityBar.foreground': { lightness: 0.14, chromaFactor: 0.22 },
  },
};
