/**
 * Represents a color in the OKLCH (Lightness, Chroma, Hue) color space.
 *
 * OKLCH is a perceptually uniform color space where equal changes in values
 * correspond to equal perceived changes in color. This makes it ideal for
 * generating harmonious color palettes.
 */
export interface OKLCH {
  /** Lightness as a fraction (0-1), perceptually uniform */
  l: number;
  /** Chroma (colorfulness), typically 0-0.4 for sRGB gamut */
  c: number;
  /** Hue angle in degrees (0-360) */
  h: number;
}
