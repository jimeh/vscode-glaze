import * as vscode from 'vscode';

/**
 * Theme kind for categorization.
 */
export type ThemeBackgroundKind = 'dark' | 'light';

/**
 * Information about a theme's background color.
 */
export interface ThemeBackground {
  /** The theme's editor background color */
  background: string;
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
  'Default Dark Modern': { background: '#1F1F1F', kind: 'dark' },
  'Default Dark+': { background: '#1E1E1E', kind: 'dark' },
  'Visual Studio Dark': { background: '#1E1E1E', kind: 'dark' },
  'Default Light Modern': { background: '#FFFFFF', kind: 'light' },
  'Default Light+': { background: '#FFFFFF', kind: 'light' },
  'Visual Studio Light': { background: '#FFFFFF', kind: 'light' },
  'Default High Contrast': { background: '#000000', kind: 'dark' },
  'Default High Contrast Light': { background: '#FFFFFF', kind: 'light' },

  // Popular dark themes
  'One Dark Pro': { background: '#282C34', kind: 'dark' },
  'One Dark Pro Darker': { background: '#23272E', kind: 'dark' },
  'One Dark Pro Flat': { background: '#282C34', kind: 'dark' },
  'One Dark Pro Mix': { background: '#282C34', kind: 'dark' },
  Dracula: { background: '#282A36', kind: 'dark' },
  'Dracula Soft': { background: '#282A36', kind: 'dark' },
  'GitHub Dark Default': { background: '#0D1117', kind: 'dark' },
  'GitHub Dark Dimmed': { background: '#22272E', kind: 'dark' },
  'GitHub Dark High Contrast': { background: '#0A0C10', kind: 'dark' },
  'Night Owl': { background: '#011627', kind: 'dark' },
  Monokai: { background: '#272822', kind: 'dark' },
  'Monokai Dimmed': { background: '#1E1E1E', kind: 'dark' },
  Nord: { background: '#2E3440', kind: 'dark' },
  'Solarized Dark': { background: '#002B36', kind: 'dark' },
  'Gruvbox Dark Medium': { background: '#282828', kind: 'dark' },
  'Gruvbox Dark Hard': { background: '#1D2021', kind: 'dark' },
  'Gruvbox Dark Soft': { background: '#32302F', kind: 'dark' },
  'Tokyo Night': { background: '#1A1B26', kind: 'dark' },
  'Tokyo Night Storm': { background: '#24283B', kind: 'dark' },
  'Catppuccin Mocha': { background: '#1E1E2E', kind: 'dark' },
  'Catppuccin Macchiato': { background: '#24273A', kind: 'dark' },
  'Catppuccin Frappé': { background: '#303446', kind: 'dark' },
  'Ayu Dark': { background: '#0A0E14', kind: 'dark' },
  'Ayu Dark Bordered': { background: '#0A0E14', kind: 'dark' },
  'Ayu Mirage': { background: '#1F2430', kind: 'dark' },
  'Ayu Mirage Bordered': { background: '#1F2430', kind: 'dark' },
  'Material Theme Palenight': { background: '#292D3E', kind: 'dark' },
  'Material Theme Palenight High Contrast': {
    background: '#292D3E',
    kind: 'dark',
  },
  'Material Theme Ocean': { background: '#0F111A', kind: 'dark' },
  'Material Theme Darker': { background: '#212121', kind: 'dark' },
  'Cobalt2': { background: '#193549', kind: 'dark' },
  'Atom One Dark': { background: '#282C34', kind: 'dark' },
  'Palenight Theme': { background: '#292D3E', kind: 'dark' },
  'Shades of Purple': { background: '#2D2B55', kind: 'dark' },
  'Synthwave 84': { background: '#262335', kind: 'dark' },
  'Panda Theme': { background: '#292A2B', kind: 'dark' },

  // Popular light themes
  'GitHub Light Default': { background: '#FFFFFF', kind: 'light' },
  'GitHub Light High Contrast': { background: '#FFFFFF', kind: 'light' },
  'Light Owl': { background: '#FBFBFB', kind: 'light' },
  'Solarized Light': { background: '#FDF6E3', kind: 'light' },
  'Gruvbox Light Medium': { background: '#FBF1C7', kind: 'light' },
  'Gruvbox Light Hard': { background: '#F9F5D7', kind: 'light' },
  'Gruvbox Light Soft': { background: '#F2E5BC', kind: 'light' },
  'Catppuccin Latte': { background: '#EFF1F5', kind: 'light' },
  'Ayu Light': { background: '#FAFAFA', kind: 'light' },
  'Ayu Light Bordered': { background: '#FAFAFA', kind: 'light' },
  'Atom One Light': { background: '#FAFAFA', kind: 'light' },
  'Tokyo Night Light': { background: '#D5D6DB', kind: 'light' },
  'Material Theme Lighter': { background: '#FAFAFA', kind: 'light' },
  'Quiet Light': { background: '#F5F5F5', kind: 'light' },
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const VALID_KINDS: ThemeBackgroundKind[] = ['dark', 'light'];

function isValidThemeBackground(value: unknown): value is ThemeBackground {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.background === 'string' &&
    HEX_COLOR_PATTERN.test(obj.background) &&
    typeof obj.kind === 'string' &&
    VALID_KINDS.includes(obj.kind as ThemeBackgroundKind)
  );
}

/**
 * Gets custom theme background colors from VSCode settings.
 * Invalid entries are silently skipped.
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
      result[name] = {
        background: entry.background.toUpperCase(),
        kind: entry.kind,
      };
    }
  }
  return result;
}

/**
 * Gets the background information for a theme by name.
 * User-configured custom themes take precedence over built-in themes.
 *
 * @param themeName - The theme name as it appears in VS Code settings
 * @returns Theme background info if found, undefined otherwise
 */
export function getThemeBackground(
  themeName: string
): ThemeBackground | undefined {
  // User config takes precedence over built-in
  const custom = getCustomThemeBackgrounds();
  if (custom[themeName]) {
    return custom[themeName];
  }
  return THEME_BACKGROUNDS[themeName];
}
