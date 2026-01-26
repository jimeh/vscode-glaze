/**
 * TypeScript code generator for theme colors.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import type {
  ExtractedTheme,
  MetadataTheme,
  ThemeColors,
  ThemeType,
} from './types';

/**
 * Color keys in order matching compact array indices.
 * Must match the order in src/theme/generated/decode.ts
 */
const COLOR_KEY_ORDER = [
  'editor.background',
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
 * Theme types in order matching compact type indices.
 * Must match the order in src/theme/generated/decode.ts
 */
const THEME_TYPE_ORDER: readonly ThemeType[] = [
  'dark',
  'light',
  'hcDark',
  'hcLight',
] as const;

/**
 * Compresses a 6-character hex color to 3 characters if possible.
 * E.g., "AABBCC" -> "ABC", "1E1E1E" stays as "1E1E1E"
 */
function compressHex(hex: string): string {
  if (hex.length !== 6) return hex;
  const r1 = hex[0],
    r2 = hex[1];
  const g1 = hex[2],
    g2 = hex[3];
  const b1 = hex[4],
    b2 = hex[5];
  if (r1 === r2 && g1 === g2 && b1 === b2) {
    return r1 + g1 + b1;
  }
  return hex;
}

/**
 * Converts a ThemeColors object to compact array format.
 * Returns [colorArray, typeIndex] where:
 * - colorArray uses sparse elements for undefined values
 * - hex values are compressed to 3 chars when possible
 */
function toCompactEntry(
  colors: ThemeColors,
  type: ThemeType
): [(string | undefined)[], number] {
  const colorArray: (string | undefined)[] = [];

  // Find last non-empty index to trim trailing empty values
  let lastNonEmpty = 0;
  for (let i = 0; i < COLOR_KEY_ORDER.length; i++) {
    const key = COLOR_KEY_ORDER[i];
    const value = colors[key as keyof ThemeColors];
    if (value) {
      lastNonEmpty = i;
    }
  }

  // Build array up to last non-empty value
  for (let i = 0; i <= lastNonEmpty; i++) {
    const key = COLOR_KEY_ORDER[i];
    const value = colors[key as keyof ThemeColors];
    if (value) {
      // Strip # prefix and compress hex
      colorArray.push(compressHex(value.replace(/^#/, '')));
    } else {
      // Use undefined for sparse array
      colorArray.push(undefined);
    }
  }

  const typeIndex = THEME_TYPE_ORDER.indexOf(type);
  return [colorArray, typeIndex];
}

/**
 * Formats a sparse array as JavaScript code.
 * E.g., ["A", undefined, "B"] -> '["A",,"B"]'
 */
function formatSparseArray(arr: (string | undefined)[]): string {
  const parts: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    if (val === undefined) {
      parts.push('');
    } else {
      parts.push(JSON.stringify(val));
    }
  }
  return '[' + parts.join(',') + ']';
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
 */
function generateCompactThemeEntries(
  themeMap: Map<string, ExtractedTheme | MetadataTheme>
): string[] {
  const sortedNames = Array.from(themeMap.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  const lines: string[] = [];
  for (const name of sortedNames) {
    const theme = themeMap.get(name)!;
    const formattedName = formatThemeName(name);
    const [colorArray, typeIndex] = toCompactEntry(theme.colors, theme.type);
    const colorArrayStr = formatSparseArray(colorArray);
    lines.push(`${formattedName}:[${colorArrayStr},${typeIndex}],`);
  }

  return lines;
}

/**
 * Generates extensions.ts with EXTENSION_THEME_COLORS constant (compact format).
 */
export function generateExtensionColorsCode(
  extensionInfos: ExtensionFileInfo[],
  timestamp?: string
): string {
  const themeMap = resolveThemeConflicts(extensionInfos);

  const ts = timestamp ?? new Date().toISOString();
  const lines: string[] = [
    '/**',
    ' * Auto-generated theme colors from marketplace extensions (compact format).',
    ` * Generated: ${ts}`,
    ' *',
    ' * This file is auto-generated by scripts/extract-theme-colors.',
    ' * Do not edit manually - changes will be overwritten.',
    ' *',
    ' * Format: { "themeName": [[colors...], typeIndex], ... }',
    ' * - colors: hex values without # prefix, empty string for undefined',
    ' * - typeIndex: 0=dark, 1=light, 2=hcDark, 3=hcLight',
    ' */',
    '',
    "import { createThemeLookup, type CompactThemeData } from './decode';",
    "import type { ThemeInfo } from '../colors';",
    '',
    'const DATA: CompactThemeData = {',
  ];

  lines.push(...generateCompactThemeEntries(themeMap));

  lines.push('};');
  lines.push('');
  lines.push(
    'export const EXTENSION_THEME_COLORS: Record<string, ThemeInfo> = createThemeLookup(DATA);'
  );
  lines.push('');

  return lines.join('\n');
}

/**
 * Generates builtin.ts with BUILTIN_THEME_COLORS constant (compact format).
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

  const ts = timestamp ?? new Date().toISOString();
  const lines: string[] = [
    '/**',
    ' * Auto-generated theme colors from VS Code built-in themes (compact format).',
    ` * Generated: ${ts}`,
    ' *',
    ' * This file is auto-generated by scripts/extract-theme-colors.',
    ' * Do not edit manually - changes will be overwritten.',
    ' *',
    ' * Format: { "themeName": [[colors...], typeIndex], ... }',
    ' * - colors: hex values without # prefix, empty string for undefined',
    ' * - typeIndex: 0=dark, 1=light, 2=hcDark, 3=hcLight',
    ' */',
    '',
    "import { createThemeLookup, type CompactThemeData } from './decode';",
    "import type { ThemeInfo } from '../colors';",
    '',
    'const DATA: CompactThemeData = {',
  ];

  lines.push(...generateCompactThemeEntries(themeMap));

  lines.push('};');
  lines.push('');
  lines.push(
    'export const BUILTIN_THEME_COLORS: Record<string, ThemeInfo> = createThemeLookup(DATA);'
  );
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
