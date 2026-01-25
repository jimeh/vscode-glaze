import type { SchemeConfig } from './types';

/**
 * Vibrant color scheme - bold, saturated tones for maximum visual impact.
 *
 * Uses OKLCH color space with chromaFactor ~0.7-0.9 for vivid, eye-catching
 * colors. Background lightness is slightly adjusted for better contrast with
 * the high chroma values.
 *
 * Foreground colors use moderate chroma to complement the saturated
 * backgrounds while maintaining readability.
 */
export const vibrantScheme: SchemeConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.38, chromaFactor: 0.8 },
    'titleBar.activeForeground': { lightness: 0.92, chromaFactor: 0.15 },
    'titleBar.inactiveBackground': { lightness: 0.32, chromaFactor: 0.6 },
    'titleBar.inactiveForeground': { lightness: 0.72, chromaFactor: 0.1 },
    'statusBar.background': { lightness: 0.4, chromaFactor: 0.85 },
    'statusBar.foreground': { lightness: 0.92, chromaFactor: 0.15 },
    'activityBar.background': { lightness: 0.3, chromaFactor: 0.75 },
    'activityBar.foreground': { lightness: 0.88, chromaFactor: 0.12 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.75, chromaFactor: 0.75 },
    'titleBar.activeForeground': { lightness: 0.18, chromaFactor: 0.25 },
    'titleBar.inactiveBackground': { lightness: 0.8, chromaFactor: 0.55 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0.15 },
    'statusBar.background': { lightness: 0.72, chromaFactor: 0.8 },
    'statusBar.foreground': { lightness: 0.18, chromaFactor: 0.25 },
    'activityBar.background': { lightness: 0.82, chromaFactor: 0.7 },
    'activityBar.foreground': { lightness: 0.2, chromaFactor: 0.2 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.22, chromaFactor: 0.85 },
    'titleBar.activeForeground': { lightness: 0.96, chromaFactor: 0.12 },
    'titleBar.inactiveBackground': { lightness: 0.16, chromaFactor: 0.65 },
    'titleBar.inactiveForeground': { lightness: 0.82, chromaFactor: 0.08 },
    'statusBar.background': { lightness: 0.24, chromaFactor: 0.9 },
    'statusBar.foreground': { lightness: 0.96, chromaFactor: 0.12 },
    'activityBar.background': { lightness: 0.16, chromaFactor: 0.8 },
    'activityBar.foreground': { lightness: 0.94, chromaFactor: 0.1 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.88, chromaFactor: 0.8 },
    'titleBar.activeForeground': { lightness: 0.12, chromaFactor: 0.3 },
    'titleBar.inactiveBackground': { lightness: 0.9, chromaFactor: 0.6 },
    'titleBar.inactiveForeground': { lightness: 0.28, chromaFactor: 0.18 },
    'statusBar.background': { lightness: 0.85, chromaFactor: 0.85 },
    'statusBar.foreground': { lightness: 0.12, chromaFactor: 0.3 },
    'activityBar.background': { lightness: 0.92, chromaFactor: 0.75 },
    'activityBar.foreground': { lightness: 0.14, chromaFactor: 0.22 },
  },
};
