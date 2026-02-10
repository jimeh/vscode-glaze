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
 * Color type: background, foreground, or border.
 */
export type ColorType = 'background' | 'foreground' | 'border';

/**
 * Metadata for a single color key.
 */
interface ColorKeyDefinition {
  /** UI element this color belongs to */
  element: ElementType;
  /** Whether this is a background, foreground, or border color */
  colorType: ColorType;
  /** Whether this key is required (only editor.background is required) */
  required: boolean;
  /** Whether this key is included in the palette (editor.* excluded) */
  inPalette: boolean;
  /**
   * When true, this key is excluded from colorCustomizations if the
   * theme doesn't explicitly define it. Prevents visual glitches from
   * borders/highlights that the theme never intended to exist.
   */
  excludeWhenUndefined?: boolean;
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
  'titleBar.border': {
    element: 'titleBar',
    colorType: 'border',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
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
  'statusBar.border': {
    element: 'statusBar',
    colorType: 'border',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
  },
  'statusBar.focusBorder': {
    element: 'statusBar',
    colorType: 'border',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
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
  'activityBar.activeBackground': {
    element: 'activityBar',
    colorType: 'background',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
  },
  'activityBar.activeBorder': {
    element: 'activityBar',
    colorType: 'border',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
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
  'sideBar.border': {
    element: 'sideBar',
    colorType: 'border',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
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
  'sideBarSectionHeader.border': {
    element: 'sideBar',
    colorType: 'border',
    required: false,
    inPalette: true,
    excludeWhenUndefined: true,
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
export type GlazeColorPalette = Record<PaletteKey, string>;

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
export const GLAZE_MANAGED_KEYS = ALL_THEME_COLOR_KEYS.filter(
  (key) => COLOR_KEY_DEFINITIONS[key].inPalette
) as PaletteKey[];

/**
 * Set of foreground color keys (for fallback logic).
 */
export const FOREGROUND_KEYS: ReadonlySet<PaletteKey> = new Set(
  GLAZE_MANAGED_KEYS.filter(
    (key) => COLOR_KEY_DEFINITIONS[key].colorType === 'foreground'
  )
);

/**
 * Set of border color keys (for fallback logic).
 */
export const BORDER_KEYS: ReadonlySet<PaletteKey> = new Set(
  GLAZE_MANAGED_KEYS.filter(
    (key) => COLOR_KEY_DEFINITIONS[key].colorType === 'border'
  )
);

/**
 * Keys excluded from colorCustomizations when the theme doesn't
 * explicitly define them (prevents visual glitches from borders
 * and highlights the theme never intended to exist).
 */
export const EXCLUDE_WHEN_UNDEFINED_KEYS: ReadonlySet<PaletteKey> = new Set(
  GLAZE_MANAGED_KEYS.filter(
    (key) =>
      (COLOR_KEY_DEFINITIONS[key] as ColorKeyDefinition).excludeWhenUndefined
  )
);

/**
 * Maps palette keys to their lookup color keys.
 * Special case: titleBar.inactiveBackground uses titleBar.activeBackground.
 */
export const PALETTE_KEY_TO_COLOR_KEY: Record<PaletteKey, ThemeColorKey> =
  Object.fromEntries(
    GLAZE_MANAGED_KEYS.map((key) => {
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
      // Border keys fall back to their element's background
      if (key === 'sideBar.border') {
        return [key, 'sideBar.background'];
      }
      if (key === 'sideBarSectionHeader.border') {
        return [key, 'sideBarSectionHeader.background'];
      }
      if (key === 'statusBar.border') {
        return [key, 'statusBar.background'];
      }
      if (key === 'statusBar.focusBorder') {
        return [key, 'statusBar.background'];
      }
      if (key === 'titleBar.border') {
        return [key, 'titleBar.activeBackground'];
      }
      if (key === 'activityBar.activeBackground') {
        return [key, 'activityBar.background'];
      }
      if (key === 'activityBar.activeBorder') {
        return [key, 'activityBar.background'];
      }
      return [key, key];
    })
  ) as Record<PaletteKey, ThemeColorKey>;
