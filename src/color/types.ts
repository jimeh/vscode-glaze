/**
 * Represents a color in the HSL (Hue, Saturation, Lightness) color space.
 */
export interface HSL {
  /** Hue angle in degrees (0-360) */
  h: number;
  /** Saturation as a fraction (0-1) */
  s: number;
  /** Lightness as a fraction (0-1) */
  l: number;
}
