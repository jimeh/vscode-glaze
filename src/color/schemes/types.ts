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
  /** Degrees to add to base hue (0-360), for multi-hue schemes */
  hueOffset?: number;
};

/**
 * Configuration for each UI element's color generation per theme type.
 */
export type SchemeConfig = Record<ThemeType, Record<PaletteKey, ElementConfig>>;

// ============================================================================
// Scheme Resolver
// ============================================================================

/**
 * Context passed to scheme resolvers for dynamic color computation.
 */
export interface SchemeResolveContext {
  /** Theme colors for the current theme, if available */
  readonly themeColors?: ThemeColors;
  /** Computed base hue for the workspace (0-359) */
  readonly baseHue: number;
}

/**
 * Result from a scheme resolver for a single palette key.
 */
export interface SchemeResolveResult {
  /** The pre-blend tint color in OKLCH */
  readonly tintOklch: OKLCH;
  /** When true, blending only affects hue (preserves L/C) */
  readonly hueOnlyBlend: boolean;
}

/**
 * Resolves the tint OKLCH color for a given palette key.
 *
 * Unlike static SchemeConfig which provides fixed lightness/chromaFactor,
 * resolvers can compute colors dynamically based on theme context.
 */
export type SchemeResolver = (
  themeType: ThemeType,
  key: PaletteKey,
  context: SchemeResolveContext
) => SchemeResolveResult;
