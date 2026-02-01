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
 * Gets the current theme context based on VSCode's active theme and user
 * configuration.
 *
 * @param themeMode - User's theme mode preference ('auto', 'light', or 'dark')
 * @returns Theme context with the resolved type and detection status
 */
export async function getThemeContext(
  themeMode: ThemeMode
): Promise<ThemeContext> {
  let tintType: ThemeType;
  let isAutoDetected: boolean;

  const vsCodeKind = getThemeTypeFromColorThemeKind(
    vscode.window.activeColorTheme.kind
  );

  if (themeMode === 'auto') {
    tintType = vsCodeKind;
    isAutoDetected = true;
  } else {
    tintType = themeMode;
    isAutoDetected = false;
  }

  // Get the theme name, then look up its colors
  const name = await getThemeName(vsCodeKind);
  const themeInfo = name ? getThemeInfo(name) : undefined;

  return {
    type: themeInfo?.type,
    tintType,
    isAutoDetected,
    name,
    colors: themeInfo?.colors,
  };
}
