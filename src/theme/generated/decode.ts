/**
 * Decoder for compact theme data format.
 * Converts space-efficient array format to ThemeInfo objects.
 */

import type { ThemeType, ThemeInfo } from '../colors';
import type { ThemeColors, ThemeColorKey } from '../colorKeys';

/**
 * Compact theme entry format: [colorsArray, typeIndex]
 * - colorsArray: Sparse array with hex values (without #), 3 or 6 chars
 * - typeIndex: 0=dark, 1=light, 2=hcDark, 3=hcLight
 */
export type CompactThemeEntry = readonly [readonly (string | undefined)[], number];

/**
 * Compact theme data: Record mapping theme name to compact entry.
 */
export type CompactThemeData = Record<string, CompactThemeEntry>;

/**
 * Color keys in order matching compact array indices.
 */
const COLOR_KEY_ORDER: readonly ThemeColorKey[] = [
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
 */
const THEME_TYPE_ORDER: readonly ThemeType[] = [
  'dark',
  'light',
  'hcDark',
  'hcLight',
] as const;

/**
 * Expands a 3-character hex to 6 characters.
 * E.g., "ABC" -> "AABBCC", "1E1E1E" stays as "1E1E1E"
 */
function expandHex(hex: string): string {
  if (hex.length === 3) {
    return hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return hex;
}

/**
 * Decodes a compact theme entry to ThemeInfo.
 */
function decodeThemeEntry(entry: CompactThemeEntry): ThemeInfo {
  const [colorArray, typeIndex] = entry;
  const colors: ThemeColors = {
    'editor.background': '#' + expandHex(colorArray[0]!),
  };

  // Add optional colors (indices 1-9)
  for (let i = 1; i < COLOR_KEY_ORDER.length; i++) {
    const value = colorArray[i];
    if (value) {
      const key = COLOR_KEY_ORDER[i] as Exclude<
        ThemeColorKey,
        'editor.background'
      >;
      colors[key] = '#' + expandHex(value);
    }
  }

  return {
    colors,
    type: THEME_TYPE_ORDER[typeIndex],
  };
}

/**
 * Decodes compact data and returns cached lookup function.
 */
function getOrDecode(
  compactData: CompactThemeData,
  cache: Map<string, ThemeInfo>,
  prop: string
): ThemeInfo | undefined {
  // Return from cache if already decoded
  const cached = cache.get(prop);
  if (cached !== undefined) return cached;

  // Decode if exists in compact data
  const entry = compactData[prop];
  if (entry === undefined) return undefined;

  const decoded = decodeThemeEntry(entry);
  cache.set(prop, decoded);
  return decoded;
}

/**
 * Creates a lazy-decoded theme lookup from compact data.
 * Decodes entries on first access and caches results.
 */
export function createThemeLookup(
  compactData: CompactThemeData
): Record<string, ThemeInfo> {
  const cache = new Map<string, ThemeInfo>();

  return new Proxy({} as Record<string, ThemeInfo>, {
    get(_target, prop: string): ThemeInfo | undefined {
      if (typeof prop !== 'string') return undefined;
      return getOrDecode(compactData, cache, prop);
    },

    has(_target, prop: string): boolean {
      return prop in compactData;
    },

    ownKeys(): string[] {
      return Object.keys(compactData);
    },

    getOwnPropertyDescriptor(_target, prop: string) {
      if (prop in compactData) {
        return {
          enumerable: true,
          configurable: true,
          value: getOrDecode(compactData, cache, prop),
        };
      }
      return undefined;
    },
  });
}
