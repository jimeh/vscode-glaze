import type { OKLCH } from './types';
import { hexToOklch, clampToGamut } from './convert';

/**
 * Blends two hue values with proper wraparound handling.
 * Hue is circular (0-360), so we take the shortest path.
 */
function blendHue(hue1: number, hue2: number, factor: number): number {
  let diff = hue2 - hue1;

  // Take the shortest path around the circle
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }

  let result = hue1 + diff * factor;

  // Normalize to 0-360
  if (result < 0) {
    result += 360;
  } else if (result >= 360) {
    result -= 360;
  }

  return result;
}

/**
 * Internal helper that parses the theme hex, clamps the factor,
 * and delegates to an interpolation function for the actual blend.
 */
function blendOklchInternal(
  tintOklch: OKLCH,
  themeBackgroundHex: string,
  blendFactor: number,
  interpolate: (tint: OKLCH, theme: OKLCH, factor: number) => OKLCH
): OKLCH {
  let themeOklch;
  try {
    themeOklch = hexToOklch(themeBackgroundHex);
  } catch {
    // Invalid hex — skip blending, return tint unchanged.
    return tintOklch;
  }
  const factor = Math.max(0, Math.min(1, blendFactor));

  return clampToGamut(interpolate(tintOklch, themeOklch, factor));
}

/**
 * Blends a tint color with a theme background color in OKLCH space.
 *
 * OKLCH provides perceptually uniform blending, ensuring smoother
 * transitions that look more natural to the human eye.
 *
 * At factor 0, returns the tint color unchanged.
 * At factor 1, returns the theme background color.
 * Values in between interpolate all OKLCH components.
 *
 * After blending, the result is clamped to sRGB gamut if necessary.
 *
 * @param tintOklch - The tint color in OKLCH
 * @param themeBackgroundHex - The theme's background color as hex
 * @param blendFactor - How much to blend toward the theme (0-1)
 * @returns Blended OKLCH color (gamut-clamped)
 */
export function blendWithThemeOklch(
  tintOklch: OKLCH,
  themeBackgroundHex: string,
  blendFactor: number
): OKLCH {
  return blendOklchInternal(
    tintOklch,
    themeBackgroundHex,
    blendFactor,
    (tint, theme, factor) => ({
      l: tint.l * (1 - factor) + theme.l * factor,
      c: tint.c * (1 - factor) + theme.c * factor,
      h: blendHue(tint.h, theme.h, factor),
    })
  );
}

/**
 * Blends only the hue of a tint color toward a theme color.
 *
 * Lightness and chroma are preserved from the tint; only the hue
 * component is interpolated. Used by the adaptive scheme where L/C
 * already come from the theme's original values.
 *
 * At factor 0, returns the tint color unchanged.
 * At factor 1, returns the theme's hue with the tint's L/C.
 *
 * After blending, the result is clamped to sRGB gamut if necessary.
 *
 * @param tintOklch - The tint color in OKLCH (L/C preserved)
 * @param themeBackgroundHex - The theme's background color as hex
 * @param blendFactor - How much to blend the hue toward theme (0-1)
 * @returns Blended OKLCH color (gamut-clamped)
 */
export function blendHueOnlyOklch(
  tintOklch: OKLCH,
  themeBackgroundHex: string,
  blendFactor: number
): OKLCH {
  return blendOklchInternal(
    tintOklch,
    themeBackgroundHex,
    blendFactor,
    (tint, theme, factor) => ({
      l: tint.l,
      c: tint.c,
      h: blendHue(tint.h, theme.h, factor),
    })
  );
}
