import * as vscode from 'vscode';
import type { ThemeKind, ThemeMode, ThemeContext } from './types';
import { getThemeName } from './name';
import { getThemeBackground } from './backgrounds';

/**
 * Maps VSCode's ColorThemeKind enum to our ThemeKind type.
 */
export function mapColorThemeKind(
  colorThemeKind: vscode.ColorThemeKind
): ThemeKind {
  switch (colorThemeKind) {
    case vscode.ColorThemeKind.Light:
      return 'light';
    case vscode.ColorThemeKind.Dark:
      return 'dark';
    case vscode.ColorThemeKind.HighContrast:
      return 'highContrast';
    case vscode.ColorThemeKind.HighContrastLight:
      return 'highContrastLight';
    default:
      return 'dark';
  }
}

/**
 * Gets the current theme context based on VSCode's active theme and user
 * configuration.
 *
 * @param themeMode - User's theme mode preference ('auto', 'light', or 'dark')
 * @returns Theme context with the resolved kind and detection status
 */
export function getThemeContext(themeMode: ThemeMode): ThemeContext {
  let kind: ThemeKind;
  let isAutoDetected: boolean;

  if (themeMode === 'auto') {
    const vsCodeKind = vscode.window.activeColorTheme.kind;
    kind = mapColorThemeKind(vsCodeKind);
    isAutoDetected = true;
  } else {
    kind = themeMode;
    isAutoDetected = false;
  }

  // Get the theme name, then look up its background colors
  const name = getThemeName(kind);
  const themeInfo = name ? getThemeBackground(name) : undefined;

  return {
    kind,
    isAutoDetected,
    name,
    // Deprecated: use backgrounds.editor instead
    background: themeInfo?.backgrounds.editor,
    backgrounds: themeInfo?.backgrounds,
  };
}
