/**
 * TextMate theme (.tmTheme) parsing utilities.
 *
 * TextMate themes use Apple's XML plist format with colors stored in
 * settings[0].settings. They only provide background/foreground colors,
 * not UI-specific colors (titleBar, statusBar, activityBar).
 */
import plist from 'plist';
import type { ThemeJson } from './types';

/**
 * Raw structure of a TextMate theme plist.
 */
interface TmThemePlist {
  name?: string;
  settings?: Array<{
    settings?: {
      background?: string;
      foreground?: string;
    };
  }>;
}

/**
 * Checks if a file path has a .tmTheme extension.
 */
export function isTmThemePath(themePath: string): boolean {
  return themePath.toLowerCase().endsWith('.tmtheme');
}

/**
 * Content-based detection for TextMate themes.
 * Checks for XML plist markers.
 */
export function isTmThemeContent(content: string): boolean {
  const trimmed = content.trimStart();
  return (
    trimmed.startsWith('<?xml') ||
    trimmed.startsWith('<!DOCTYPE plist') ||
    trimmed.startsWith('<plist')
  );
}

/**
 * Parses a TextMate theme (.tmTheme) and returns ThemeJson format.
 *
 * Maps TextMate colors to VSCode equivalents:
 * - background -> editor.background
 * - foreground -> editor.foreground
 */
export function parseTmTheme(content: string): ThemeJson | undefined {
  try {
    const parsed = plist.parse(content) as TmThemePlist;

    // TextMate themes store global settings in settings[0].settings
    const globalSettings = parsed.settings?.[0]?.settings;
    if (!globalSettings) {
      return undefined;
    }

    const colors: Record<string, string> = {};

    if (globalSettings.background) {
      colors['editor.background'] = normalizeColor(globalSettings.background);
    }

    if (globalSettings.foreground) {
      colors['editor.foreground'] = normalizeColor(globalSettings.foreground);
    }

    // Must have at least background color
    if (!colors['editor.background']) {
      return undefined;
    }

    return {
      name: parsed.name,
      colors,
    };
  } catch {
    return undefined;
  }
}

/**
 * Normalizes color values to 6-character hex format.
 * Handles 3-char hex (#RGB) and 8-char hex with alpha (#RRGGBBAA).
 */
function normalizeColor(color: string): string {
  if (!color.startsWith('#')) {
    return color;
  }

  const hex = color.slice(1);

  // Expand 3-char hex to 6-char
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
  }

  // Strip alpha from 8-char hex
  if (hex.length === 8) {
    return `#${hex.slice(0, 6)}`;
  }

  return color;
}
