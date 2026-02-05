import type { OKLCH } from '../types';
import type { ThemeColors } from '../../theme';

/** Direction for hue interpolation around the color wheel. */
export type HueBlendDirection = 'cw' | 'ccw' | 'shortest';

/**
 * Context for hue shift blending that enables lazy computation of
 * the majority hue direction.
 */
export interface HueShiftContext {
  /** Pre-offset base hue angle for majority direction calculation. */
  readonly baseHue?: number;
  /** Theme colors to vote against for majority direction. */
  readonly themeColors?: ThemeColors;
}

/**
 * A blend function that combines a tint color with a theme color.
 *
 * Takes the tint in both OKLCH and hex forms (callers already have
 * both), plus the theme hex and a blend factor. Returns the final
 * blended color as a hex string.
 *
 * @param tintOklch - The tint color in OKLCH
 * @param tintHex - The tint color as hex
 * @param themeHex - The theme color as hex
 * @param factor - Blend factor (0 = full tint, 1 = full theme)
 * @param hueOnly - When true, only hue is blended (L/C preserved)
 * @returns Blended color as hex string
 */
export type BlendFunction = (
  tintOklch: OKLCH,
  tintHex: string,
  themeHex: string,
  factor: number,
  hueOnly: boolean
) => string;
