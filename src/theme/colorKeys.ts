/**
 * Single source of truth for all theme color key definitions.
 * All color key metadata, types, and derived constants live here.
 */

/**
 * UI element types that can be tinted.
 */
export type ElementType = 'editor' | 'titleBar' | 'statusBar' | 'activityBar';

/**
 * Color type: background or foreground.
 */
export type ColorType = 'background' | 'foreground';

/**
 * Metadata for a single color key.
 */
export interface ColorKeyDefinition {
  /** UI element this color belongs to */
  element: ElementType;
  /** Whether this is a background or foreground color */
  colorType: ColorType;
  /** Whether this key is required (only editor.background is required) */
  required: boolean;
  /** Whether this key is included in the palette (editor.* excluded) */
  inPalette: boolean;
}

/**
 * All color key definitions with their metadata.
 * This is the single source of truth for color key information.
 */
export const COLOR_KEY_DEFINITIONS = {
  'editor.background': {
    element: 'editor',
    colorType: 'background',
    required: true,
    inPalette: false,
  },
  'editor.foreground': {
    element: 'editor',
    colorType: 'foreground',
    required: false,
    inPalette: false,
  },
  'titleBar.activeBackground': {
    element: 'titleBar',
    colorType: 'background',
    required: false,
    inPalette: true,
  },
  'titleBar.activeForeground': {
    element: 'titleBar',
    colorType: 'foreground',
    required: false,
    inPalette: true,
  },
  'titleBar.inactiveBackground': {
    element: 'titleBar',
    colorType: 'background',
    required: false,
    inPalette: true,
  },
  'titleBar.inactiveForeground': {
    element: 'titleBar',
    colorType: 'foreground',
    required: false,
    inPalette: true,
  },
  'statusBar.background': {
    element: 'statusBar',
    colorType: 'background',
    required: false,
    inPalette: true,
  },
  'statusBar.foreground': {
    element: 'statusBar',
    colorType: 'foreground',
    required: false,
    inPalette: true,
  },
  'activityBar.background': {
    element: 'activityBar',
    colorType: 'background',
    required: false,
    inPalette: true,
  },
  'activityBar.foreground': {
    element: 'activityBar',
    colorType: 'foreground',
    required: false,
    inPalette: true,
  },
} as const satisfies Record<string, ColorKeyDefinition>;

// ============================================================================
// Derived Types
// ============================================================================

/**
 * All theme color keys (union type).
 */
export type ThemeColorKey = keyof typeof COLOR_KEY_DEFINITIONS;

/**
 * Keys that are included in the palette (excludes editor.*).
 */
export type PaletteKey = {
  [K in ThemeColorKey]: (typeof COLOR_KEY_DEFINITIONS)[K]['inPalette'] extends true
    ? K
    : never;
}[ThemeColorKey];

/**
 * Full color palette interface for all tintable UI elements.
 */
export type PatinaColorPalette = Record<PaletteKey, string>;

/**
 * Theme colors using native VSCode keys.
 * editor.background is required; all others are optional.
 */
export type ThemeColors = {
  'editor.background': string;
} & Partial<Record<Exclude<ThemeColorKey, 'editor.background'>, string>>;

// ============================================================================
// Derived Constants
// ============================================================================

/**
 * All theme color keys as an array.
 */
export const ALL_THEME_COLOR_KEYS = Object.keys(
  COLOR_KEY_DEFINITIONS
) as ThemeColorKey[];

/**
 * Optional theme color keys (all except editor.background).
 */
export const OPTIONAL_THEME_COLOR_KEYS = ALL_THEME_COLOR_KEYS.filter(
  (key) => !COLOR_KEY_DEFINITIONS[key].required
) as Exclude<ThemeColorKey, 'editor.background'>[];

/**
 * All palette keys as an array (keys where inPalette is true).
 */
export const PATINA_MANAGED_KEYS = ALL_THEME_COLOR_KEYS.filter(
  (key) => COLOR_KEY_DEFINITIONS[key].inPalette
) as PaletteKey[];

/**
 * Set of foreground color keys (for fallback logic).
 */
export const FOREGROUND_KEYS: ReadonlySet<PaletteKey> = new Set(
  PATINA_MANAGED_KEYS.filter(
    (key) => COLOR_KEY_DEFINITIONS[key].colorType === 'foreground'
  )
);

/**
 * Maps palette keys to their lookup color keys.
 * Special case: titleBar.inactiveBackground uses titleBar.activeBackground.
 */
export const PALETTE_KEY_TO_COLOR_KEY: Record<PaletteKey, ThemeColorKey> =
  Object.fromEntries(
    PATINA_MANAGED_KEYS.map((key) => {
      // Inactive titleBar background falls back to active background
      if (key === 'titleBar.inactiveBackground') {
        return [key, 'titleBar.activeBackground'];
      }
      return [key, key];
    })
  ) as Record<PaletteKey, ThemeColorKey>;

// ============================================================================
// Compact Theme Data Format
// ============================================================================

/**
 * Theme type codes for compact storage.
 * Maps numeric index to ThemeType string.
 */
export const THEME_TYPE_CODES = ['dark', 'light', 'hcDark', 'hcLight'] as const;

/**
 * Numeric theme type code (0-3).
 */
export type ThemeTypeCode = 0 | 1 | 2 | 3;

/**
 * Compact theme data format for efficient storage.
 * Array structure: [typeCode, editorBg, editorFg, ...other colors]
 *
 * Index 0: Theme type code (0=dark, 1=light, 2=hcDark, 3=hcLight)
 * Index 1-10: Color values without # prefix, empty string if not present
 *   1: editor.background (required)
 *   2: editor.foreground
 *   3: titleBar.activeBackground
 *   4: titleBar.activeForeground
 *   5: titleBar.inactiveBackground
 *   6: titleBar.inactiveForeground
 *   7: statusBar.background
 *   8: statusBar.foreground
 *   9: activityBar.background
 *   10: activityBar.foreground
 */
export type CompactThemeData = readonly [
  ThemeTypeCode,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/**
 * Compact theme colors storage format.
 */
export type CompactThemeColors = Record<string, CompactThemeData>;

/**
 * Expands a compact theme data array into a ThemeColors object.
 */
export function expandThemeColors(data: CompactThemeData): ThemeColors {
  const colors: ThemeColors = {
    'editor.background': '#' + data[1],
  };

  // Map indices to optional keys (indices 2-10 correspond to optional keys)
  const optionalKeys = OPTIONAL_THEME_COLOR_KEYS;
  for (let i = 0; i < optionalKeys.length; i++) {
    const value = data[i + 2];
    if (value) {
      colors[optionalKeys[i]] = '#' + value;
    }
  }

  return colors;
}
