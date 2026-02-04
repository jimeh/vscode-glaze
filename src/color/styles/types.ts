import type { OKLCH } from '../types';
import type { ThemeColors, ThemeType, PaletteKey } from '../../theme';

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
export type StyleConfig = Record<ThemeType, Record<PaletteKey, ElementConfig>>;

// ============================================================================
// Style Resolver
// ============================================================================

/**
 * Context passed to style resolvers for dynamic color computation.
 */
export interface StyleResolveContext {
  /** Theme colors for the current theme, if available */
  readonly themeColors?: ThemeColors;
  /** The element's target hue (0-359), with any harmony offset pre-applied */
  readonly baseHue: number;
}

/**
 * Result from a style resolver for a single palette key.
 */
export interface StyleResolveResult {
  /** The pre-blend tint color in OKLCH */
  readonly tintOklch: OKLCH;
  /** When true, blending only affects hue (preserves L/C) */
  readonly hueOnlyBlend: boolean;
}

/**
 * Resolves the tint OKLCH color for a given palette key.
 *
 * Unlike static StyleConfig which provides fixed lightness/chromaFactor,
 * resolvers can compute colors dynamically based on theme context.
 */
export type StyleResolver = (
  themeType: ThemeType,
  key: PaletteKey,
  context: StyleResolveContext
) => StyleResolveResult;
