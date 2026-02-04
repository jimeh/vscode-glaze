import type { SchemeResolver } from './types';
import { pastelScheme } from './pastel';
import { staticResolver } from './resolvers';
import { hexToOklch } from '../convert';
import { applyHueOffset } from '../hue';
import { getColorForKey } from '../../theme/colors';

/**
 * Fallback resolver using pastel scheme values.
 * Used when theme colors are unavailable for a key.
 */
const pastelResolver = staticResolver(pastelScheme);

/**
 * Adaptive color scheme — uses the theme's original lightness and
 * chroma with the tint's hue.
 *
 * For each palette key:
 * - If the theme defines a color: extracts L/C from the theme color
 *   in OKLCH space, then replaces the hue with the tint's base hue
 *   (plus any harmony hue offset).
 * - If the theme color is missing: falls back to pastel scheme values.
 * - If no theme data at all: falls back to pastel entirely.
 *
 * Blending only affects the hue component, so blend=0 uses the full
 * tint hue and blend=1 restores the original theme hue. Lightness
 * and chroma always come from the theme.
 */
export const adaptiveResolver: SchemeResolver = (themeType, key, context) => {
  // No theme data — fall back to pastel
  if (!context.themeColors) {
    return pastelResolver(themeType, key, context);
  }

  // Look up the theme's color for this key
  const themeHex = getColorForKey(key, context.themeColors);
  if (!themeHex) {
    return pastelResolver(themeType, key, context);
  }

  // Extract theme's OKLCH values
  let themeOklch;
  try {
    themeOklch = hexToOklch(themeHex);
  } catch {
    // Invalid hex — fall back to pastel
    return pastelResolver(themeType, key, context);
  }

  // Apply harmony hue offset from the resolve context
  const elementHue = applyHueOffset(context.baseHue, context.hueOffset);

  return {
    tintOklch: {
      l: themeOklch.l,
      c: themeOklch.c,
      h: elementHue,
    },
    hueOnlyBlend: true,
  };
};
