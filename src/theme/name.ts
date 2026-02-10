import * as vscode from 'vscode';
import type { ThemeType } from './types';
import { getThemeInfo } from './colors';
import { detectOsColorScheme } from './osColorScheme';

/**
 * Gets the effective theme name based on the current theme type.
 *
 * When `window.autoDetectColorScheme` is enabled, VS Code switches
 * between `preferredDarkColorTheme` and `preferredLightColorTheme`
 * based on OS dark/light mode. Since VS Code doesn't expose which
 * OS mode is active, we use a two-phase detection:
 *
 * 1. **Quick check**: Look up both preferred themes in the known
 *    theme database. The one whose `ThemeInfo.type` matches
 *    `themeType` is the active theme.
 * 2. **OS fallback**: If the quick check is ambiguous (both match
 *    or neither match), or if either preferred theme is unknown to
 *    the theme database, shell out to detect OS dark/light mode
 *    and pick the corresponding preferred theme.
 *
 * When `autoDetectColorScheme` is disabled, simply returns the
 * `workbench.colorTheme` setting.
 *
 * @param themeType - The current theme type as reported by VS Code
 * @returns The effective theme name, or undefined if not found
 */
export async function getThemeName(
  themeType: ThemeType
): Promise<string | undefined> {
  const windowConfig = vscode.workspace.getConfiguration('window');
  const autoDetect =
    windowConfig.get<boolean>('autoDetectColorScheme') ?? false;

  const workbenchConfig = vscode.workspace.getConfiguration('workbench');
  const colorTheme = workbenchConfig.get<string>('colorTheme');

  if (!autoDetect) {
    return colorTheme;
  }

  // Auto-detect is enabled — resolve which preferred theme is active
  const darkTheme =
    workbenchConfig.get<string>('preferredDarkColorTheme') || '';
  const lightTheme =
    workbenchConfig.get<string>('preferredLightColorTheme') || '';

  // If neither preferred theme is configured, fall back
  if (!darkTheme && !lightTheme) {
    return colorTheme;
  }

  // Phase 1: Quick check via ThemeInfo.type matching
  // Only trust this when all configured preferred themes are known
  // in the database. If either is unknown, skip to Phase 2.
  const darkInfo = darkTheme ? getThemeInfo(darkTheme) : undefined;
  const lightInfo = lightTheme ? getThemeInfo(lightTheme) : undefined;

  const bothKnown = (!darkTheme || darkInfo) && (!lightTheme || lightInfo);
  if (bothKnown) {
    const darkMatches = darkInfo?.type === themeType;
    const lightMatches = lightInfo?.type === themeType;

    if (darkMatches && !lightMatches) {
      return darkTheme;
    }
    if (lightMatches && !darkMatches) {
      return lightTheme;
    }
  }

  // Phase 2: OS fallback (both matched or neither matched)
  const osScheme = await detectOsColorScheme();
  if (osScheme === 'dark') {
    return darkTheme || colorTheme;
  }
  if (osScheme === 'light') {
    return lightTheme || colorTheme;
  }

  // Unable to determine — fall back to colorTheme
  return colorTheme;
}
