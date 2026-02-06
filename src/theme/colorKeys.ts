/**
 * Single source of truth for all theme color key definitions.
 * All color key metadata, types, and derived constants live here.
 */

/**
 * UI element types that can be tinted.
 */
export type ElementType =
  | 'editor'
  | 'titleBar'
  | 'statusBar'
  | 'activityBar'
  | 'sideBar';

/**
 * Color type: background or foreground.
 */
export type ColorType = 'background' | 'foreground';

/**
 * Metadata for a single color key.
 */
interface ColorKeyDefinition {
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
  'sideBar.background': {
    element: 'sideBar',
    colorType: 'background',
    required: false,
    inPalette: true,
  },
  'sideBar.foreground': {
    element: 'sideBar',
    colorType: 'foreground',
    required: false,
    inPalette: true,
  },
  'sideBarSectionHeader.background': {
    element: 'sideBar',
    colorType: 'background',
    required: false,
    inPalette: true,
  },
  'sideBarSectionHeader.foreground': {
    element: 'sideBar',
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
      // Section header falls back to corresponding sideBar key
      if (key === 'sideBarSectionHeader.background') {
        return [key, 'sideBar.background'];
      }
      if (key === 'sideBarSectionHeader.foreground') {
        return [key, 'sideBar.foreground'];
      }
      return [key, key];
    })
  ) as Record<PaletteKey, ThemeColorKey>;
