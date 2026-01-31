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
  const themeOklch = hexToOklch(themeBackgroundHex);
  const factor = Math.max(0, Math.min(1, blendFactor));

  // Interpolate all components toward theme
  const blendedH = blendHue(tintOklch.h, themeOklch.h, factor);
  const blendedL = tintOklch.l * (1 - factor) + themeOklch.l * factor;
  const blendedC = tintOklch.c * (1 - factor) + themeOklch.c * factor;

  // Clamp to gamut in case blending produced an out-of-gamut color
  return clampToGamut({
    l: blendedL,
    c: blendedC,
    h: blendedH,
  });
}
