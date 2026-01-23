import * as vscode from 'vscode';
import type { ThemeKind } from './types';

/**
 * Gets the effective theme name based on the current theme kind.
 *
 * VS Code allows users to set preferred themes for light and dark modes via
 * `workbench.preferredDarkColorTheme` and `workbench.preferredLightColorTheme`.
 * When these are set and auto-switching is active, the preferred theme takes
 * precedence over `workbench.colorTheme`.
 *
 * @param themeKind - The current theme kind
 * @returns The effective theme name, or undefined if not found
 */
export function getThemeName(themeKind: ThemeKind): string | undefined {
  const config = vscode.workspace.getConfiguration('workbench');

  // Check preferred theme settings first (they override colorTheme when set)
  if (themeKind === 'dark' || themeKind === 'highContrast') {
    const preferred = config.get<string>('preferredDarkColorTheme');
    if (preferred) {
      return preferred;
    }
  } else {
    const preferred = config.get<string>('preferredLightColorTheme');
    if (preferred) {
      return preferred;
    }
  }

  // Fall back to colorTheme
  return config.get<string>('colorTheme');
}
