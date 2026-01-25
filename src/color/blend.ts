import type { HSL, OKLCH } from './types';
import { hexToOklch, clampToGamut } from './convert';

/**
 * Represents a color in the RGB color space.
 */
export interface RGB {
  /** Red component (0-255) */
  r: number;
  /** Green component (0-255) */
  g: number;
  /** Blue component (0-255) */
  b: number;
}

/**
 * Parses a hex color string to RGB components.
 *
 * @param hex - Hex color string (e.g., "#1F1F1F" or "1F1F1F")
 * @returns RGB color object
 * @throws Error if the hex string is invalid
 */
export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

/**
 * Converts an RGB color to HSL.
 *
 * @param rgb - RGB color object
 * @returns HSL color object
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

/**
 * Convenience function to convert hex directly to HSL.
 *
 * @param hex - Hex color string
 * @returns HSL color object
 */
export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

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
 * Blends a tint color with a theme background color in HSL space.
 *
 * At factor 0, returns the tint color unchanged.
 * At factor 1, returns the theme background color.
 * Values in between interpolate all HSL components.
 *
 * @param tintHsl - The tint color in HSL
 * @param themeBackgroundHex - The theme's background color as hex
 * @param blendFactor - How much to blend toward the theme (0-1)
 * @returns Blended HSL color
 */
export function blendWithTheme(
  tintHsl: HSL,
  themeBackgroundHex: string,
  blendFactor: number
): HSL {
  const themeHsl = hexToHsl(themeBackgroundHex);
  const factor = Math.max(0, Math.min(1, blendFactor));

  // Interpolate all components toward theme
  const blendedH = blendHue(tintHsl.h, themeHsl.h, factor);
  const blendedS = tintHsl.s * (1 - factor) + themeHsl.s * factor;
  const blendedL = tintHsl.l * (1 - factor) + themeHsl.l * factor;

  return {
    h: blendedH,
    s: blendedS,
    l: blendedL,
  };
}

// --------------------------------------------------------------------------
// OKLCH Blending
// --------------------------------------------------------------------------

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
