import type { ThemeType, PaletteKey } from '../../theme';

/**
 * Configuration for OKLCH color generation per UI element.
 *
 * Uses lightness and chromaFactor instead of HSL saturation/lightness.
 * chromaFactor is a percentage (0-1) of the maximum in-gamut chroma
 * for the given hue and lightness, ensuring consistent perceived
 * saturation across all hues.
 */
export type ElementConfig = {
  /** OKLCH lightness (0-1), perceptually uniform */
  lightness: number;
  /** Percentage of max in-gamut chroma (0-1) */
  chromaFactor: number;
};

/**
 * Configuration for each UI element's color generation per theme type.
 */
export type SchemeConfig = Record<ThemeType, Record<PaletteKey, ElementConfig>>;
