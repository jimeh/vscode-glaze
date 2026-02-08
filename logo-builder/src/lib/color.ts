/**
 * OKLCH Color Space Utilities
 */

import type { OKLCH, Oklab, LinearRGB } from './types';

/**
 * Converts OKLCH to Oklab color space.
 */
function oklchToOklab(oklch: OKLCH): Oklab {
  const { l, c, h } = oklch;
  const hRad = (h * Math.PI) / 180;
  return {
    L: l,
    a: c * Math.cos(hRad),
    b: c * Math.sin(hRad),
  };
}

/**
 * Converts Oklab to OKLCH color space.
 */
function oklabToOklch(oklab: Oklab): OKLCH {
  const { L, a, b } = oklab;
  const c = Math.sqrt(a * a + b * b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) {
    h += 360;
  }
  return { l: L, c, h };
}

/**
 * Converts Oklab to linear RGB.
 */
function oklabToLinearRgb(oklab: Oklab): LinearRGB {
  const { L, a, b } = oklab;

  // Oklab to LMS (cone response)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  // Cube the values to get LMS
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to linear RGB
  return {
    r: +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

/**
 * Converts linear RGB to Oklab.
 */
function linearRgbToOklab(rgb: LinearRGB): Oklab {
  const { r, g, b } = rgb;

  // Linear RGB to LMS
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  // Cube root to get LMS'
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  // LMS' to Oklab
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/**
 * Applies sRGB gamma correction (linear to sRGB).
 */
function linearToSrgb(c: number): number {
  if (c <= 0.0031308) {
    return 12.92 * c;
  }
  return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

/**
 * Removes sRGB gamma correction (sRGB to linear).
 */
function srgbToLinear(c: number): number {
  if (c <= 0.04045) {
    return c / 12.92;
  }
  return Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Checks if a linear RGB value is within the sRGB gamut (0-1 range).
 */
function isInGamut(rgb: LinearRGB): boolean {
  const epsilon = 0.0001;
  return (
    rgb.r >= -epsilon &&
    rgb.r <= 1 + epsilon &&
    rgb.g >= -epsilon &&
    rgb.g <= 1 + epsilon &&
    rgb.b >= -epsilon &&
    rgb.b <= 1 + epsilon
  );
}

/**
 * Clamps a value to the 0-1 range.
 */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Clamps an OKLCH color to the sRGB gamut by reducing chroma.
 */
export function clampToGamut(oklch: OKLCH): OKLCH {
  const { l, c, h } = oklch;

  // Edge cases
  if (l <= 0) {
    return { l: 0, c: 0, h };
  }
  if (l >= 1) {
    return { l: 1, c: 0, h };
  }
  if (c <= 0) {
    return { l, c: 0, h };
  }

  // Check if already in gamut
  const oklab = oklchToOklab(oklch);
  const rgb = oklabToLinearRgb(oklab);
  if (isInGamut(rgb)) {
    return oklch;
  }

  // Binary search for max in-gamut chroma
  let low = 0;
  let high = c;
  const tolerance = 0.0001;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const testOklab = oklchToOklab({ l, c: mid, h });
    const testRgb = oklabToLinearRgb(testOklab);

    if (isInGamut(testRgb)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return { l, c: low, h };
}

/**
 * Converts an OKLCH color to a hex string.
 */
export function oklchToHex(oklch: OKLCH): string {
  const clamped = clampToGamut(oklch);
  const oklab = oklchToOklab(clamped);
  const linearRgb = oklabToLinearRgb(oklab);

  const r = clamp01(linearToSrgb(linearRgb.r));
  const g = clamp01(linearToSrgb(linearRgb.g));
  const b = clamp01(linearToSrgb(linearRgb.b));

  const toHex = (n: number): string =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts a hex color string to OKLCH.
 */
export function hexToOklch(hex: string): OKLCH {
  const cleaned = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;

  const linearR = srgbToLinear(r);
  const linearG = srgbToLinear(g);
  const linearB = srgbToLinear(b);

  const oklab = linearRgbToOklab({ r: linearR, g: linearG, b: linearB });
  return oklabToOklch(oklab);
}

/**
 * Finds the maximum in-gamut chroma for a given lightness and hue.
 */
export function maxChroma(lightness: number, hue: number): number {
  // Edge cases: at L=0 (black) or L=1 (white), chroma must be 0
  if (lightness <= 0 || lightness >= 1) {
    return 0;
  }

  let low = 0;
  let high = 0.4; // Maximum possible chroma in sRGB is roughly 0.37
  const tolerance = 0.0001;

  while (high - low > tolerance) {
    const mid = (low + high) / 2;
    const oklab = oklchToOklab({ l: lightness, c: mid, h: hue });
    const rgb = oklabToLinearRgb(oklab);

    if (isInGamut(rgb)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}
