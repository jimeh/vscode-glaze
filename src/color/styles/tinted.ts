import type { StyleConfig } from './types';

/**
 * Tinted color style - very subtle per-workspace color tints.
 *
 * Uses very low chromaFactor (0.08-0.12) for barely-there color hints
 * while retaining workspace-specific hue variation. This replaces
 * monochrome for users who want minimal color but still some
 * visual distinction between workspaces.
 */
export const tintedStyle: StyleConfig = {
  dark: {
    'titleBar.activeBackground': { lightness: 0.3, chromaFactor: 0.1 },
    'titleBar.activeForeground': { lightness: 0.88, chromaFactor: 0.08 },
    'titleBar.inactiveBackground': { lightness: 0.24, chromaFactor: 0.08 },
    'titleBar.inactiveForeground': { lightness: 0.65, chromaFactor: 0.06 },
    'statusBar.background': { lightness: 0.32, chromaFactor: 0.12 },
    'statusBar.foreground': { lightness: 0.88, chromaFactor: 0.08 },
    'activityBar.background': { lightness: 0.22, chromaFactor: 0.1 },
    'activityBar.foreground': { lightness: 0.82, chromaFactor: 0.06 },
    'sideBar.background': { lightness: 0.19, chromaFactor: 0.1 },
    'sideBar.foreground': { lightness: 0.82, chromaFactor: 0.06 },
    'sideBarSectionHeader.background': { lightness: 0.22, chromaFactor: 0.1 },
    'sideBarSectionHeader.foreground': { lightness: 0.82, chromaFactor: 0.06 },
  },
  light: {
    'titleBar.activeBackground': { lightness: 0.85, chromaFactor: 0.1 },
    'titleBar.activeForeground': { lightness: 0.15, chromaFactor: 0.08 },
    'titleBar.inactiveBackground': { lightness: 0.9, chromaFactor: 0.08 },
    'titleBar.inactiveForeground': { lightness: 0.35, chromaFactor: 0.06 },
    'statusBar.background': { lightness: 0.82, chromaFactor: 0.12 },
    'statusBar.foreground': { lightness: 0.15, chromaFactor: 0.08 },
    'activityBar.background': { lightness: 0.92, chromaFactor: 0.1 },
    'activityBar.foreground': { lightness: 0.18, chromaFactor: 0.06 },
    'sideBar.background': { lightness: 0.95, chromaFactor: 0.1 },
    'sideBar.foreground': { lightness: 0.18, chromaFactor: 0.06 },
    'sideBarSectionHeader.background': { lightness: 0.92, chromaFactor: 0.1 },
    'sideBarSectionHeader.foreground': { lightness: 0.18, chromaFactor: 0.06 },
  },
  hcDark: {
    'titleBar.activeBackground': { lightness: 0.14, chromaFactor: 0.1 },
    'titleBar.activeForeground': { lightness: 0.96, chromaFactor: 0.06 },
    'titleBar.inactiveBackground': { lightness: 0.1, chromaFactor: 0.08 },
    'titleBar.inactiveForeground': { lightness: 0.8, chromaFactor: 0.05 },
    'statusBar.background': { lightness: 0.16, chromaFactor: 0.12 },
    'statusBar.foreground': { lightness: 0.96, chromaFactor: 0.06 },
    'activityBar.background': { lightness: 0.08, chromaFactor: 0.1 },
    'activityBar.foreground': { lightness: 0.92, chromaFactor: 0.05 },
    'sideBar.background': { lightness: 0.05, chromaFactor: 0.1 },
    'sideBar.foreground': { lightness: 0.92, chromaFactor: 0.05 },
    'sideBarSectionHeader.background': { lightness: 0.08, chromaFactor: 0.1 },
    'sideBarSectionHeader.foreground': { lightness: 0.92, chromaFactor: 0.05 },
  },
  hcLight: {
    'titleBar.activeBackground': { lightness: 0.94, chromaFactor: 0.1 },
    'titleBar.activeForeground': { lightness: 0.08, chromaFactor: 0.06 },
    'titleBar.inactiveBackground': { lightness: 0.96, chromaFactor: 0.08 },
    'titleBar.inactiveForeground': { lightness: 0.25, chromaFactor: 0.05 },
    'statusBar.background': { lightness: 0.92, chromaFactor: 0.12 },
    'statusBar.foreground': { lightness: 0.08, chromaFactor: 0.06 },
    'activityBar.background': { lightness: 0.97, chromaFactor: 0.1 },
    'activityBar.foreground': { lightness: 0.1, chromaFactor: 0.05 },
    'sideBar.background': { lightness: 0.99, chromaFactor: 0.1 },
    'sideBar.foreground': { lightness: 0.1, chromaFactor: 0.05 },
    'sideBarSectionHeader.background': { lightness: 0.97, chromaFactor: 0.1 },
    'sideBarSectionHeader.foreground': { lightness: 0.1, chromaFactor: 0.05 },
  },
};
