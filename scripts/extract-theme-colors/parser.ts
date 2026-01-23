/**
 * Theme JSON parser with inheritance support.
 */
import type {
  ThemeJson,
  ThemeKind,
  ElementBackgrounds,
  ExtractedTheme,
  ThemeContribution,
  RepoInfo,
} from './types';
import { fetchThemeFile } from './repository';

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/;

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
 * Determines theme kind from uiTheme or type field.
 */
function determineThemeKind(
  uiTheme: string | undefined,
  type: string | undefined
): ThemeKind | undefined {
  // Check uiTheme first (from package.json contribution)
  if (uiTheme) {
    if (uiTheme.includes('dark') || uiTheme === 'vs-dark') return 'dark';
    if (uiTheme.includes('light') || uiTheme === 'vs') return 'light';
    if (uiTheme.includes('hc-black')) return 'dark';
    if (uiTheme.includes('hc-light')) return 'light';
  }

  // Check type from theme JSON
  if (type) {
    if (type === 'dark' || type === 'hc') return 'dark';
    if (type === 'light' || type === 'hcLight') return 'light';
  }

  return undefined;
}

/**
 * Extracts background colors from theme colors object.
 */
function extractBackgrounds(
  colors: Record<string, string> | undefined
): ElementBackgrounds | undefined {
  if (!colors) return undefined;

  const editor = colors['editor.background'];
  if (!isValidHexColor(editor)) return undefined;

  const backgrounds: ElementBackgrounds = {
    editor: normalizeHexColor(editor),
  };

  // Extract optional element-specific backgrounds
  const titleBar = colors['titleBar.activeBackground'];
  if (isValidHexColor(titleBar)) {
    backgrounds.titleBar = normalizeHexColor(titleBar);
  }

  const statusBar = colors['statusBar.background'];
  if (isValidHexColor(statusBar)) {
    backgrounds.statusBar = normalizeHexColor(statusBar);
  }

  const activityBar = colors['activityBar.background'];
  if (isValidHexColor(activityBar)) {
    backgrounds.activityBar = normalizeHexColor(activityBar);
  }

  return backgrounds;
}

/**
 * Resolves theme inheritance (include directive).
 * Maximum depth of 5 to prevent infinite loops.
 */
async function resolveInheritance(
  theme: ThemeJson,
  repoInfo: RepoInfo,
  basePath: string,
  depth = 0
): Promise<ThemeJson> {
  if (depth > 5 || !theme.include) {
    return theme;
  }

  // Resolve include path relative to current theme file
  const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
  const includePath = theme.include.startsWith('./')
    ? `${baseDir}/${theme.include.slice(2)}`
    : `${baseDir}/${theme.include}`;

  const parentTheme = await fetchThemeFile(repoInfo, includePath);
  if (!parentTheme) {
    return theme;
  }

  // Recursively resolve parent's includes
  const resolvedParent = await resolveInheritance(
    parentTheme,
    repoInfo,
    includePath,
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
export async function parseTheme(
  themeJson: ThemeJson,
  contribution: ThemeContribution,
  repoInfo: RepoInfo,
  extensionId: string,
  extensionName: string
): Promise<ExtractedTheme | undefined> {
  // Resolve inheritance
  const resolvedTheme = await resolveInheritance(
    themeJson,
    repoInfo,
    contribution.path
  );

  // Determine theme kind
  const kind = determineThemeKind(contribution.uiTheme, resolvedTheme.type);
  if (!kind) {
    return undefined;
  }

  // Extract background colors
  const backgrounds = extractBackgrounds(resolvedTheme.colors);
  if (!backgrounds) {
    return undefined;
  }

  // Use contribution label as theme name
  const name = contribution.label;

  return {
    name,
    backgrounds,
    kind,
    extensionId,
    extensionName,
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
  if (!isValidHexColor(theme.backgrounds.editor)) {
    return false;
  }

  // Must have valid kind
  if (theme.kind !== 'dark' && theme.kind !== 'light') {
    return false;
  }

  return true;
}
