/**
 * Color relationship presets for logo colors.
 *
 * Each scheme defines how box hues relate to the base hue,
 * plus default lightness and chroma factors.
 */

import type { Schemes, BalanceSchemes } from './types';

export const SCHEMES: Schemes = {
  monochromatic: {
    name: 'Monochromatic',
    description: 'Same hue, varying lightness and chroma',
    boxes: [
      { hueOffset: 0, l: 0.92, cFactor: 0.15 }, // Back - light
      { hueOffset: 0, l: 0.55, cFactor: 0.7 }, // Front - saturated
      { hueOffset: 0, l: 0.7, cFactor: 0.45 }, // Middle - medium
    ],
  },

  duotone: {
    name: 'Duotone',
    description: 'Base hue + 180 degree complement',
    boxes: [
      { hueOffset: 0, l: 0.9, cFactor: 0.2 }, // Back - base, light
      { hueOffset: 180, l: 0.55, cFactor: 0.65 }, // Front - complement
      { hueOffset: 0, l: 0.6, cFactor: 0.55 }, // Middle - base
    ],
  },

  analogous: {
    name: 'Analogous',
    description: 'Three adjacent hues (base, -30, +30)',
    boxes: [
      { hueOffset: -30, l: 0.88, cFactor: 0.25 }, // Back
      { hueOffset: 30, l: 0.55, cFactor: 0.6 }, // Front
      { hueOffset: 0, l: 0.65, cFactor: 0.5 }, // Middle
    ],
  },

  triadic: {
    name: 'Triadic',
    description: 'Three hues 120 degrees apart',
    boxes: [
      { hueOffset: 0, l: 0.88, cFactor: 0.25 }, // Back - base
      { hueOffset: 120, l: 0.55, cFactor: 0.6 }, // Front
      { hueOffset: 240, l: 0.65, cFactor: 0.5 }, // Middle
    ],
  },

  split: {
    name: 'Split-complementary',
    description: 'Base + 150 and 210 degree offsets',
    boxes: [
      { hueOffset: 0, l: 0.88, cFactor: 0.25 }, // Back - base
      { hueOffset: 150, l: 0.55, cFactor: 0.6 }, // Front
      { hueOffset: 210, l: 0.65, cFactor: 0.5 }, // Middle
    ],
  },

  custom: {
    name: 'Custom',
    description: 'Full manual control over each box',
    boxes: null, // No preset - uses current slider values
  },
};

/**
 * Normalizes a hue to 0-360 range.
 */
export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

/**
 * Clamps a value to the specified range.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Balance (luminance/chroma) presets for logo colors.
 *
 * Each scheme defines how box L/C values relate to the base values.
 */
export const BALANCE_SCHEMES: BalanceSchemes = {
  uniform: {
    name: 'Uniform',
    description: 'All boxes same luminance and chroma',
    boxes: [
      { lOffset: 0, cMultiplier: 1 }, // Highlight
      { lOffset: 0, cMultiplier: 1 }, // Shadow
      { lOffset: 0, cMultiplier: 1 }, // Center
    ],
  },

  layered: {
    name: 'Layered',
    description: 'Back light/muted, front dark/vibrant',
    boxes: [
      { lOffset: 0.25, cMultiplier: 0.4 }, // Highlight - lighter, muted
      { lOffset: -0.1, cMultiplier: 1.2 }, // Shadow - darker, vibrant
      { lOffset: 0, cMultiplier: 0.8 }, // Center - base, slightly muted
    ],
  },

  contrast: {
    name: 'Contrast',
    description: 'Varied luminance, uniform chroma',
    boxes: [
      { lOffset: 0.2, cMultiplier: 1 }, // Highlight - lighter
      { lOffset: -0.15, cMultiplier: 1 }, // Shadow - darker
      { lOffset: 0, cMultiplier: 1 }, // Center - base
    ],
  },

  custom: {
    name: 'Custom',
    description: 'Full manual control over each box',
    boxes: null, // No preset - uses individual slider values
  },
};
