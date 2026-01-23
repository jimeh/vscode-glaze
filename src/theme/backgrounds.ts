import * as vscode from 'vscode';
import type { PatinaColorPalette } from '../color/palette';
import { GENERATED_THEME_BACKGROUNDS } from './backgrounds.generated';

/**
 * Element identifier for background color lookup.
 */
export type ElementType = 'editor' | 'titleBar' | 'statusBar' | 'activityBar';

/**
 * Theme kind for categorization.
 */
export type ThemeBackgroundKind = 'dark' | 'light';

/**
 * Background colors for different UI elements.
 * The `editor` color is required and serves as the fallback for all elements.
 */
export interface ElementBackgrounds {
  /** Main editor background (required, fallback for all elements) */
  editor: string;
  /** Title bar background (titleBar.activeBackground) */
  titleBar?: string;
  /** Status bar background (statusBar.background) */
  statusBar?: string;
  /** Activity bar background (activityBar.background) */
  activityBar?: string;
}

/**
 * Information about a theme's background colors.
 */
export interface ThemeBackground {
  /** Background colors for different UI elements */
  backgrounds: ElementBackgrounds;
  /** Whether this is a dark or light theme */
  kind: ThemeBackgroundKind;
}

/**
 * Lookup table of popular VS Code themes with their background colors.
 *
 * Theme names are matched exactly as they appear in VS Code's
 * `workbench.colorTheme` setting.
 */
export const THEME_BACKGROUNDS: Record<string, ThemeBackground> = {
  // VS Code built-in themes
  'Default Dark Modern': { backgrounds: { editor: '#1F1F1F' }, kind: 'dark' },
  'Default Dark+': { backgrounds: { editor: '#1E1E1E' }, kind: 'dark' },
  'Visual Studio Dark': { backgrounds: { editor: '#1E1E1E' }, kind: 'dark' },
  'Default Light Modern': { backgrounds: { editor: '#FFFFFF' }, kind: 'light' },
  'Default Light+': { backgrounds: { editor: '#FFFFFF' }, kind: 'light' },
  'Visual Studio Light': { backgrounds: { editor: '#FFFFFF' }, kind: 'light' },
  'Default High Contrast': { backgrounds: { editor: '#000000' }, kind: 'dark' },
  'Default High Contrast Light': {
    backgrounds: { editor: '#FFFFFF' },
    kind: 'light',
  },

  // Popular dark themes
  'One Dark Pro': { backgrounds: { editor: '#282C34' }, kind: 'dark' },
  'One Dark Pro Darker': { backgrounds: { editor: '#23272E' }, kind: 'dark' },
  'One Dark Pro Flat': { backgrounds: { editor: '#282C34' }, kind: 'dark' },
  'One Dark Pro Mix': { backgrounds: { editor: '#282C34' }, kind: 'dark' },
  Dracula: { backgrounds: { editor: '#282A36' }, kind: 'dark' },
  'Dracula Soft': { backgrounds: { editor: '#282A36' }, kind: 'dark' },
  'GitHub Dark Default': { backgrounds: { editor: '#0D1117' }, kind: 'dark' },
  'GitHub Dark Dimmed': { backgrounds: { editor: '#22272E' }, kind: 'dark' },
  'GitHub Dark High Contrast': {
    backgrounds: { editor: '#0A0C10' },
    kind: 'dark',
  },
  'Night Owl': { backgrounds: { editor: '#011627' }, kind: 'dark' },
  Monokai: { backgrounds: { editor: '#272822' }, kind: 'dark' },
  'Monokai Dimmed': { backgrounds: { editor: '#1E1E1E' }, kind: 'dark' },
  Nord: { backgrounds: { editor: '#2E3440' }, kind: 'dark' },
  'Solarized Dark': { backgrounds: { editor: '#002B36' }, kind: 'dark' },
  'Gruvbox Dark Medium': { backgrounds: { editor: '#282828' }, kind: 'dark' },
  'Gruvbox Dark Hard': { backgrounds: { editor: '#1D2021' }, kind: 'dark' },
  'Gruvbox Dark Soft': { backgrounds: { editor: '#32302F' }, kind: 'dark' },
  'Tokyo Night': { backgrounds: { editor: '#1A1B26' }, kind: 'dark' },
  'Tokyo Night Storm': { backgrounds: { editor: '#24283B' }, kind: 'dark' },
  'Catppuccin Mocha': { backgrounds: { editor: '#1E1E2E' }, kind: 'dark' },
  'Catppuccin Macchiato': { backgrounds: { editor: '#24273A' }, kind: 'dark' },
  'Catppuccin Frappé': { backgrounds: { editor: '#303446' }, kind: 'dark' },
  'Ayu Dark': { backgrounds: { editor: '#0A0E14' }, kind: 'dark' },
  'Ayu Dark Bordered': { backgrounds: { editor: '#0A0E14' }, kind: 'dark' },
  'Ayu Mirage': { backgrounds: { editor: '#1F2430' }, kind: 'dark' },
  'Ayu Mirage Bordered': { backgrounds: { editor: '#1F2430' }, kind: 'dark' },
  'Material Theme Palenight': {
    backgrounds: { editor: '#292D3E' },
    kind: 'dark',
  },
  'Material Theme Palenight High Contrast': {
    backgrounds: { editor: '#292D3E' },
    kind: 'dark',
  },
  'Material Theme Ocean': { backgrounds: { editor: '#0F111A' }, kind: 'dark' },
  'Material Theme Darker': { backgrounds: { editor: '#212121' }, kind: 'dark' },
  Cobalt2: { backgrounds: { editor: '#193549' }, kind: 'dark' },
  'Atom One Dark': { backgrounds: { editor: '#282C34' }, kind: 'dark' },
  'Palenight Theme': { backgrounds: { editor: '#292D3E' }, kind: 'dark' },
  'Shades of Purple': { backgrounds: { editor: '#2D2B55' }, kind: 'dark' },
  'Synthwave 84': { backgrounds: { editor: '#262335' }, kind: 'dark' },
  'Panda Theme': { backgrounds: { editor: '#292A2B' }, kind: 'dark' },

  // Popular light themes
  'GitHub Light Default': { backgrounds: { editor: '#FFFFFF' }, kind: 'light' },
  'GitHub Light High Contrast': {
    backgrounds: { editor: '#FFFFFF' },
    kind: 'light',
  },
  'Light Owl': { backgrounds: { editor: '#FBFBFB' }, kind: 'light' },
  'Solarized Light': { backgrounds: { editor: '#FDF6E3' }, kind: 'light' },
  'Gruvbox Light Medium': { backgrounds: { editor: '#FBF1C7' }, kind: 'light' },
  'Gruvbox Light Hard': { backgrounds: { editor: '#F9F5D7' }, kind: 'light' },
  'Gruvbox Light Soft': { backgrounds: { editor: '#F2E5BC' }, kind: 'light' },
  'Catppuccin Latte': { backgrounds: { editor: '#EFF1F5' }, kind: 'light' },
  'Ayu Light': { backgrounds: { editor: '#FAFAFA' }, kind: 'light' },
  'Ayu Light Bordered': { backgrounds: { editor: '#FAFAFA' }, kind: 'light' },
  'Atom One Light': { backgrounds: { editor: '#FAFAFA' }, kind: 'light' },
  'Tokyo Night Light': { backgrounds: { editor: '#D5D6DB' }, kind: 'light' },
  'Material Theme Lighter': { backgrounds: { editor: '#FAFAFA' }, kind: 'light' },
  'Quiet Light': { backgrounds: { editor: '#F5F5F5' }, kind: 'light' },
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const VALID_KINDS: ThemeBackgroundKind[] = ['dark', 'light'];

function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

/**
 * Validates an ElementBackgrounds object.
 * Requires `editor` key with valid hex color; other keys are optional.
 */
function isValidElementBackgrounds(
  value: unknown
): value is ElementBackgrounds {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // editor is required
  if (!isValidHexColor(obj.editor)) {
    return false;
  }
  // Optional keys must be valid hex if present
  for (const key of ['titleBar', 'statusBar', 'activityBar']) {
    if (obj[key] !== undefined && !isValidHexColor(obj[key])) {
      return false;
    }
  }
  return true;
}

/**
 * Validates a ThemeBackground object (new format with `backgrounds`).
 * Also accepts legacy format with `background` string for backwards
 * compatibility with user settings.
 */
function isValidThemeBackground(value: unknown): value is ThemeBackground {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;

  // Check for valid kind
  if (
    typeof obj.kind !== 'string' ||
    !VALID_KINDS.includes(obj.kind as ThemeBackgroundKind)
  ) {
    return false;
  }

  // New format: { backgrounds: ElementBackgrounds, kind }
  if (obj.backgrounds !== undefined) {
    return isValidElementBackgrounds(obj.backgrounds);
  }

  // Legacy format: { background: string, kind } - for user config compat
  if (isValidHexColor(obj.background)) {
    return true;
  }

  return false;
}

/**
 * Legacy format for user config backwards compatibility.
 */
interface LegacyThemeBackground {
  background: string;
  kind: ThemeBackgroundKind;
}

function isNewFormat(
  value: ThemeBackground | LegacyThemeBackground
): value is ThemeBackground {
  return 'backgrounds' in value;
}

/**
 * Normalizes a theme background entry, converting legacy format to new format.
 */
function normalizeThemeBackground(
  value: ThemeBackground | LegacyThemeBackground
): ThemeBackground {
  if (isNewFormat(value)) {
    return {
      backgrounds: {
        editor: value.backgrounds.editor.toUpperCase(),
        titleBar: value.backgrounds.titleBar?.toUpperCase(),
        statusBar: value.backgrounds.statusBar?.toUpperCase(),
        activityBar: value.backgrounds.activityBar?.toUpperCase(),
      },
      kind: value.kind,
    };
  }
  // Legacy format - convert to new format
  return {
    backgrounds: { editor: value.background.toUpperCase() },
    kind: value.kind,
  };
}

/**
 * Gets custom theme background colors from VSCode settings.
 * Invalid entries are silently skipped. Supports both new format (with
 * `backgrounds`) and legacy format (with `background`) for backwards
 * compatibility.
 */
function getCustomThemeBackgrounds(): Record<string, ThemeBackground> {
  const config = vscode.workspace.getConfiguration('patina');
  const raw = config.get<Record<string, unknown>>(
    'theme.backgroundColors',
    {}
  );

  const result: Record<string, ThemeBackground> = {};
  for (const [name, entry] of Object.entries(raw)) {
    if (isValidThemeBackground(entry)) {
      // Cast is safe after validation; normalizeThemeBackground handles both
      // new and legacy formats
      result[name] = normalizeThemeBackground(
        entry as ThemeBackground | LegacyThemeBackground
      );
    }
  }
  return result;
}

/**
 * Gets the background information for a theme by name.
 * Priority order:
 * 1. User-configured custom themes (highest)
 * 2. Generated themes from extracted VSIX data
 * 3. Built-in themes (fallback)
 *
 * @param themeName - The theme name as it appears in VS Code settings
 * @returns Theme background info if found, undefined otherwise
 */
export function getThemeBackground(
  themeName: string
): ThemeBackground | undefined {
  // User config takes highest precedence
  const custom = getCustomThemeBackgrounds();
  if (custom[themeName]) {
    return custom[themeName];
  }
  // Generated themes from VSIX extraction
  if (GENERATED_THEME_BACKGROUNDS[themeName]) {
    return GENERATED_THEME_BACKGROUNDS[themeName];
  }
  // Built-in themes as fallback
  return THEME_BACKGROUNDS[themeName];
}

/**
 * Maps palette keys to their corresponding element type for background lookup.
 */
const PALETTE_KEY_TO_ELEMENT: Partial<Record<keyof PatinaColorPalette, ElementType>> = {
  'titleBar.activeBackground': 'titleBar',
  'titleBar.inactiveBackground': 'titleBar',
  'statusBar.background': 'statusBar',
  'activityBar.background': 'activityBar',
};

/**
 * Gets the appropriate background color for a specific palette key.
 * Falls back to editor background if the element-specific color is not defined.
 *
 * @param key - The palette key to get background for
 * @param backgrounds - The element backgrounds from the theme
 * @returns The hex color string for the appropriate background
 */
export function getBackgroundForKey(
  key: keyof PatinaColorPalette,
  backgrounds: ElementBackgrounds
): string {
  const element = PALETTE_KEY_TO_ELEMENT[key];
  if (element && backgrounds[element]) {
    return backgrounds[element];
  }
  return backgrounds.editor;
}
