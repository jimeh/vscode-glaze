/**
 * Theme JSON parser with inheritance support.
 */
import {
  COLOR_KEY_ORDER,
  type ThemeJson,
  type ThemeType,
  type ThemeColors,
  type ExtractedTheme,
  type ThemeContribution,
} from './types';

// Accepts 3, 4, 6, or 8 digit hex colors (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
const HEX_COLOR_PATTERN =
  /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})([0-9A-Fa-f]{1,2})?$/;

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
 * Handles 3, 4, 6, and 8 digit hex colors.
 */
function normalizeHexColor(hex: string): string {
  // Strip alpha for 8-digit (#RRGGBBAA) or 4-digit (#RGBA) hex
  let color = hex;
  if (hex.length === 9) {
    color = hex.slice(0, 7);
  } else if (hex.length === 5) {
    color = hex.slice(0, 4);
  }

  // Expand 3-digit to 6-digit (#RGB -> #RRGGBB)
  if (color.length === 4) {
    const r = color[1];
    const g = color[2];
    const b = color[3];
    color = `#${r}${r}${g}${g}${b}${b}`;
  }

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

  // Extract optional colors (everything after editor.background)
  const optionalKeys = COLOR_KEY_ORDER.slice(1);

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
 * Resolves tokenColors when it's a string path to a .tmTheme file.
 * Returns the theme with colors merged from the referenced .tmTheme.
 */
function resolveTokenColorsPath(
  theme: ThemeJson,
  basePath: string,
  readThemeFile: ThemeFileReader
): ThemeJson {
  if (typeof theme.tokenColors !== 'string') {
    return theme;
  }

  const tokenColorsPath = theme.tokenColors;
  const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
  const resolvedPath = tokenColorsPath.startsWith('./')
    ? `${baseDir}/${tokenColorsPath.slice(2)}`
    : `${baseDir}/${tokenColorsPath}`;

  const referencedTheme = readThemeFile(resolvedPath);
  if (!referencedTheme) {
    return theme;
  }

  // Merge: referenced theme provides base, current theme overrides
  return {
    ...theme,
    colors: {
      ...referencedTheme.colors,
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
  publisherName: string,
  extensionName: string,
  installCount: number
): ExtractedTheme | undefined {
  // Resolve inheritance
  let resolvedTheme = resolveInheritance(
    themeJson,
    contribution.path,
    readThemeFile
  );

  // Resolve tokenColors path reference
  resolvedTheme = resolveTokenColorsPath(
    resolvedTheme,
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

  // Use ID as theme name if available (this is what VSCode stores in settings)
  // Fall back to label if no ID specified
  const name = contribution.id ?? contribution.label;
  const label = contribution.label;

  return {
    name,
    label,
    colors,
    type,
    extensionId,
    publisherName,
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
