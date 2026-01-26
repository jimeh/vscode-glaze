/**
 * TypeScript code generator for theme colors.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import type { ExtractedTheme, MetadataTheme, ThemeColors } from './types';

/**
 * Theme type to numeric code mapping (matches THEME_TYPE_CODES in colorKeys.ts).
 */
const THEME_TYPE_TO_CODE: Record<string, number> = {
  dark: 0,
  light: 1,
  hcDark: 2,
  hcLight: 3,
};

/**
 * Optional color keys in fixed order for compact format.
 * This order MUST match OPTIONAL_THEME_COLOR_KEYS in colorKeys.ts.
 */
const OPTIONAL_COLOR_KEYS = [
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

/**
 * Strips the # prefix from a hex color.
 */
function stripHashPrefix(color: string): string {
  return color.startsWith('#') ? color.slice(1) : color;
}

/**
 * Formats theme data as a compact array for minimal storage size.
 * Format: [typeCode, editorBg, editorFg, ...optional colors]
 * Missing colors are represented as empty strings.
 */
function formatCompactTheme(colors: ThemeColors, type: string): string {
  const typeCode = THEME_TYPE_TO_CODE[type] ?? 0;
  const editorBg = stripHashPrefix(colors['editor.background']);

  const values: string[] = [String(typeCode), `"${editorBg}"`];

  for (const key of OPTIONAL_COLOR_KEYS) {
    const color = colors[key];
    values.push(color ? `"${stripHashPrefix(color)}"` : '""');
  }

  return `[${values.join(',')}]`;
}

/**
 * Formats a theme name for use as an object key.
 * Uses JSON.stringify to handle all edge cases (numeric strings, special
 * characters, embedded quotes, unicode).
 */
function formatThemeName(name: string): string {
  return JSON.stringify(name);
}

interface ThemeConflict {
  kept: ExtractedTheme;
  discarded: ExtractedTheme;
}

/**
 * Information needed to generate theme files.
 */
export interface ExtensionFileInfo {
  publisherName: string;
  extensionName: string;
  installCount: number;
  themes: ExtractedTheme[];
}

/**
 * Strips the timestamp line from generated content for comparison.
 */
function stripTimestamp(content: string): string {
  return content.replace(/^ \* Generated: .+$/m, '');
}

/**
 * Resolves theme conflicts and returns merged themes map.
 */
function resolveThemeConflicts(
  extensionInfos: ExtensionFileInfo[]
): Map<string, ExtractedTheme> {
  const themeMap = new Map<string, { theme: ExtractedTheme; extKey: string }>();
  const conflicts: ThemeConflict[] = [];

  for (const info of extensionInfos) {
    const extKey = `${info.publisherName}.${info.extensionName}`;
    for (const theme of info.themes) {
      const existing = themeMap.get(theme.name);
      if (existing && existing.extKey !== extKey) {
        // Conflict: same name from different extensions
        if (theme.installCount > existing.theme.installCount) {
          themeMap.set(theme.name, { theme, extKey });
          conflicts.push({ kept: theme, discarded: existing.theme });
        } else {
          conflicts.push({ kept: existing.theme, discarded: theme });
        }
      } else {
        themeMap.set(theme.name, { theme, extKey });
      }
    }
  }

  // Log conflicts
  if (conflicts.length > 0) {
    console.warn('');
    console.warn(`Found ${conflicts.length} duplicate theme name(s):`);
    for (const { kept, discarded } of conflicts) {
      const keptId = `${kept.publisherName}.${kept.extensionName}`;
      const discardedId = `${discarded.publisherName}.${discarded.extensionName}`;
      console.warn(
        `  "${kept.name}": keeping from "${keptId}" ` +
          `(${kept.installCount.toLocaleString()} installs), ` +
          `discarding from "${discardedId}" ` +
          `(${discarded.installCount.toLocaleString()} installs)`
      );
    }
    console.warn('');
  }

  // Convert to simple map
  const result = new Map<string, ExtractedTheme>();
  for (const [name, { theme }] of themeMap) {
    result.set(name, theme);
  }
  return result;
}

/**
 * Generates compact theme entries for a map of themes.
 * Each entry is a single line: "themeName": [typeCode, colors...]
 */
function generateCompactThemeEntries(
  themeMap: Map<string, ExtractedTheme>
): string[] {
  const sortedNames = Array.from(themeMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  const lines: string[] = [];
  for (const name of sortedNames) {
    const theme = themeMap.get(name)!;
    const formattedName = formatThemeName(name);
    const compactData = formatCompactTheme(theme.colors, theme.type);
    lines.push(`  ${formattedName}: ${compactData},`);
  }

  return lines;
}

/**
 * Generates extensions.ts with compact EXTENSION_THEME_COLORS constant.
 */
export function generateExtensionColorsCode(
  extensionInfos: ExtensionFileInfo[],
  timestamp?: string
): string {
  const themeMap = resolveThemeConflicts(extensionInfos);

  const ts = timestamp ?? new Date().toISOString();
  const lines: string[] = [
    '/**',
    ' * Auto-generated theme colors from marketplace extensions.',
    ` * Generated: ${ts}`,
    ' *',
    ' * This file is auto-generated by scripts/extract-theme-colors.',
    ' * Do not edit manually - changes will be overwritten.',
    ' */',
    '',
    "import type { CompactThemeColors } from '../colorKeys';",
    '',
    'export const EXTENSION_THEME_COLORS: CompactThemeColors = {',
  ];

  lines.push(...generateCompactThemeEntries(themeMap));

  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates builtin.ts with compact BUILTIN_THEME_COLORS constant.
 */
export function generateBuiltinColorsCode(
  themes: MetadataTheme[],
  timestamp?: string
): string {
  // Convert to map for sorting
  const themeMap = new Map<string, MetadataTheme>();
  for (const theme of themes) {
    themeMap.set(theme.name, theme);
  }

  const sortedNames = Array.from(themeMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  const ts = timestamp ?? new Date().toISOString();
  const lines: string[] = [
    '/**',
    ' * Auto-generated theme colors from VS Code built-in themes.',
    ` * Generated: ${ts}`,
    ' *',
    ' * This file is auto-generated by scripts/extract-theme-colors.',
    ' * Do not edit manually - changes will be overwritten.',
    ' */',
    '',
    "import type { CompactThemeColors } from '../colorKeys';",
    '',
    'export const BUILTIN_THEME_COLORS: CompactThemeColors = {',
  ];

  for (const name of sortedNames) {
    const theme = themeMap.get(name)!;
    const formattedName = formatThemeName(name);
    const compactData = formatCompactTheme(theme.colors, theme.type);
    lines.push(`  ${formattedName}: ${compactData},`);
  }

  lines.push('};');
  lines.push('');

  return lines.join('\n');
}

/**
 * Writes the generated TypeScript code to a file.
 */
export function writeOutputFile(outputPath: string, content: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, content);
}

/**
 * Generates a summary report of extracted themes.
 */
export function generateReport(themes: ExtractedTheme[]): string {
  const darkThemes = themes.filter(
    (t) => t.type === 'dark' || t.type === 'hcDark'
  );
  const lightThemes = themes.filter(
    (t) => t.type === 'light' || t.type === 'hcLight'
  );

  const lines: string[] = [
    '# Theme Extraction Report',
    '',
    `Total themes extracted: ${themes.length}`,
    `  - Dark themes: ${darkThemes.length}`,
    `  - Light themes: ${lightThemes.length}`,
    '',
    '## Themes with per-element colors',
    '',
  ];

  const themesWithElements = themes.filter(
    (t) =>
      t.colors['titleBar.activeBackground'] ||
      t.colors['statusBar.background'] ||
      t.colors['activityBar.background']
  );

  if (themesWithElements.length === 0) {
    lines.push('No themes with per-element colors found.');
  } else {
    for (const theme of themesWithElements) {
      const elements: string[] = [];
      if (theme.colors['titleBar.activeBackground']) {
        elements.push('titleBar');
      }
      if (theme.colors['statusBar.background']) {
        elements.push('statusBar');
      }
      if (theme.colors['activityBar.background']) {
        elements.push('activityBar');
      }
      lines.push(`- ${theme.name}: ${elements.join(', ')}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Converts ExtractedTheme array to MetadataTheme array for storage.
 */
export function toMetadataThemes(themes: ExtractedTheme[]): MetadataTheme[] {
  return themes.map((t) => ({
    name: t.name,
    label: t.label,
    colors: t.colors,
    type: t.type,
  }));
}

/**
 * Writes the extension colors file if content has changed.
 * Returns true if the file was written, false if skipped (no changes).
 */
export function writeExtensionColorsFile(
  extensionInfos: ExtensionFileInfo[]
): boolean {
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const newContent = generateExtensionColorsCode(extensionInfos);

  // Check if existing file has the same content (ignoring timestamp)
  if (fs.existsSync(CONFIG.extensionColorsPath)) {
    const existingContent = fs.readFileSync(
      CONFIG.extensionColorsPath,
      'utf-8'
    );
    if (stripTimestamp(existingContent) === stripTimestamp(newContent)) {
      return false;
    }
  }

  fs.writeFileSync(CONFIG.extensionColorsPath, newContent);
  return true;
}

/**
 * Writes the builtin colors file if content has changed.
 * Returns true if the file was written, false if skipped (no changes).
 */
export function writeBuiltinColorsFile(themes: MetadataTheme[]): boolean {
  // Ensure directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const newContent = generateBuiltinColorsCode(themes);

  // Check if existing file has the same content (ignoring timestamp)
  if (fs.existsSync(CONFIG.builtinColorsPath)) {
    const existingContent = fs.readFileSync(CONFIG.builtinColorsPath, 'utf-8');
    if (stripTimestamp(existingContent) === stripTimestamp(newContent)) {
      return false;
    }
  }

  fs.writeFileSync(CONFIG.builtinColorsPath, newContent);
  return true;
}
