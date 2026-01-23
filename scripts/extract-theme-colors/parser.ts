/**
 * Theme JSON parser with inheritance support.
 */
import type {
  ThemeJson,
  ThemeType,
  ThemeColors,
  ExtractedTheme,
  ThemeContribution,
} from './types';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

/**
 * Function type for reading theme files.
 */
export type ThemeFileReader = (path: string) => ThemeJson | undefined;

/**
 * Checks if a value is a valid hex color (ignoring CSS variables).
 */
function isValidHexColor(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (value.startsWith('var(')) return false; // CSS variable, skip
  return HEX_COLOR_PATTERN.test(value);
}

/**
 * Normalizes a hex color to 6-digit uppercase format.
 */
function normalizeHexColor(hex: string): string {
  // Remove alpha channel if present (8-digit hex)
  const color = hex.length === 9 ? hex.slice(0, 7) : hex;
  return color.toUpperCase();
}

/**
 * Determines theme type from uiTheme or type field.
 * Returns official VSCode theme type values.
 */
function determineThemeType(
  uiTheme: string | undefined,
  type: string | undefined
): ThemeType | undefined {
  // Check uiTheme first (from package.json contribution)
  if (uiTheme) {
    if (uiTheme === 'vs-dark' || uiTheme.includes('dark')) return 'dark';
    if (uiTheme === 'vs' || uiTheme.includes('light')) return 'light';
    if (uiTheme === 'hc-black') return 'hcDark';
    if (uiTheme === 'hc-light') return 'hcLight';
  }

  // Check type from theme JSON
  if (type) {
    if (type === 'dark') return 'dark';
    if (type === 'light') return 'light';
    if (type === 'hc' || type === 'hcDark') return 'hcDark';
    if (type === 'hcLight') return 'hcLight';
  }

  return undefined;
}

/**
 * Extracts colors from theme colors object using native VSCode keys.
 */
function extractColors(
  colors: Record<string, string> | undefined
): ThemeColors | undefined {
  if (!colors) return undefined;

  const editor = colors['editor.background'];
  if (!isValidHexColor(editor)) return undefined;

  const themeColors: ThemeColors = {
    'editor.background': normalizeHexColor(editor),
  };

  // Extract optional colors using native VSCode keys
  const optionalKeys = [
    'editor.foreground',
    'titleBar.activeBackground',
    'titleBar.activeForeground',
    'titleBar.inactiveBackground',
    'titleBar.inactiveForeground',
    'statusBar.background',
    'statusBar.foreground',
    'activityBar.background',
    'activityBar.foreground',
  ] as const;

  for (const key of optionalKeys) {
    const value = colors[key];
    if (isValidHexColor(value)) {
      themeColors[key] = normalizeHexColor(value);
    }
  }

  return themeColors;
}

/**
 * Resolves theme inheritance (include directive).
 * Maximum depth of 5 to prevent infinite loops.
 */
function resolveInheritance(
  theme: ThemeJson,
  basePath: string,
  readThemeFile: ThemeFileReader,
  depth = 0
): ThemeJson {
  if (depth > 5 || !theme.include) {
    return theme;
  }

  // Resolve include path relative to current theme file
  const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
  const includePath = theme.include.startsWith('./')
    ? `${baseDir}/${theme.include.slice(2)}`
    : `${baseDir}/${theme.include}`;

  const parentTheme = readThemeFile(includePath);
  if (!parentTheme) {
    return theme;
  }

  // Recursively resolve parent's includes
  const resolvedParent = resolveInheritance(
    parentTheme,
    includePath,
    readThemeFile,
    depth + 1
  );

  // Merge colors (child overrides parent)
  return {
    ...resolvedParent,
    ...theme,
    colors: {
      ...resolvedParent.colors,
      ...theme.colors,
    },
  };
}

/**
 * Parses a single theme and extracts its colors.
 */
export function parseTheme(
  themeJson: ThemeJson,
  contribution: ThemeContribution,
  readThemeFile: ThemeFileReader,
  extensionId: string,
  extensionName: string,
  installCount: number
): ExtractedTheme | undefined {
  // Resolve inheritance
  const resolvedTheme = resolveInheritance(
    themeJson,
    contribution.path,
    readThemeFile
  );

  // Determine theme type
  const type = determineThemeType(contribution.uiTheme, resolvedTheme.type);
  if (!type) {
    return undefined;
  }

  // Extract colors
  const colors = extractColors(resolvedTheme.colors);
  if (!colors) {
    return undefined;
  }

  // Use contribution label as theme name
  const name = contribution.label;

  return {
    name,
    colors,
    type,
    extensionId,
    extensionName,
    installCount,
  };
}

/**
 * Validates and normalizes an extracted theme.
 */
export function validateTheme(theme: ExtractedTheme): boolean {
  // Must have a name
  if (!theme.name || typeof theme.name !== 'string') {
    return false;
  }

  // Must have valid editor background
  if (!isValidHexColor(theme.colors['editor.background'])) {
    return false;
  }

  // Must have valid type
  const validTypes: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];
  if (!validTypes.includes(theme.type)) {
    return false;
  }

  return true;
}
