import type { ThemeType, PaletteKey } from '../../theme';

/**
 * Configuration for saturation and lightness values.
 */
export type ElementConfig = { saturation: number; lightness: number };

/**
 * Configuration for each UI element's color generation per theme type.
 */
export type SchemeConfig = Record<ThemeType, Record<PaletteKey, ElementConfig>>;
