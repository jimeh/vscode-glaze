import * as vscode from 'vscode';
import type { ThemeType, ThemeMode, ThemeContext } from './types';
import { getThemeName } from './name';
import { getThemeInfo } from './colors';

/**
 * Maps VSCode's ColorThemeKind enum to ThemeType.
 */
export function getThemeTypeFromColorThemeKind(
  colorThemeKind: vscode.ColorThemeKind
): ThemeType {
  switch (colorThemeKind) {
    case vscode.ColorThemeKind.Light:
      return 'light';
    case vscode.ColorThemeKind.Dark:
      return 'dark';
    case vscode.ColorThemeKind.HighContrast:
      return 'hcDark';
    case vscode.ColorThemeKind.HighContrastLight:
      return 'hcLight';
    default:
      return 'dark';
  }
}

/**
 * @deprecated Use getThemeTypeFromColorThemeKind instead.
 */
export const mapColorThemeKind = getThemeTypeFromColorThemeKind;

/**
 * Gets the current theme context based on VSCode's active theme and user
 * configuration.
 *
 * @param themeMode - User's theme mode preference ('auto', 'light', or 'dark')
 * @returns Theme context with the resolved type and detection status
 */
export function getThemeContext(themeMode: ThemeMode): ThemeContext {
  let type: ThemeType;
  let isAutoDetected: boolean;

  if (themeMode === 'auto') {
    const vsCodeKind = vscode.window.activeColorTheme.kind;
    type = getThemeTypeFromColorThemeKind(vsCodeKind);
    isAutoDetected = true;
  } else {
    type = themeMode;
    isAutoDetected = false;
  }

  // Get the theme name, then look up its colors
  const name = getThemeName(type);
  const themeInfo = name ? getThemeInfo(name) : undefined;

  // Build legacy backgrounds object for backwards compatibility
  const backgrounds = themeInfo
    ? {
        editor: themeInfo.colors['editor.background'],
        titleBar: themeInfo.colors['titleBar.activeBackground'],
        statusBar: themeInfo.colors['statusBar.background'],
        activityBar: themeInfo.colors['activityBar.background'],
      }
    : undefined;

  return {
    type,
    kind: type, // Deprecated alias
    isAutoDetected,
    name,
    background: themeInfo?.colors['editor.background'],
    colors: themeInfo?.colors,
    backgrounds,
  };
}
