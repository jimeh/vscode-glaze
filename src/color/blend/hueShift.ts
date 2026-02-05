import type { OKLCH } from '../types';
import type { ThemeColors, PaletteKey } from '../../theme';
import { COLOR_KEY_DEFINITIONS, PATINA_MANAGED_KEYS } from '../../theme';
import { getColorForKey } from '../../theme/colors';
import { hexToOklch, oklchToHex, clampToGamut } from '../convert';
import type { BlendFunction, HueBlendDirection } from './types';

// ============================================================================
// Hue interpolation helpers
// ============================================================================

/**
 * Blends two hue values with an explicit direction around
 * the color wheel.
 *
 * - `'shortest'` -- take the shorter arc (default, original behavior).
 * - `'cw'`       -- always interpolate clockwise (increasing hue).
 * - `'ccw'`      -- always interpolate counter-clockwise.
 */
function blendHueDirected(
  hue1: number,
  hue2: number,
  factor: number,
  direction: HueBlendDirection
): number {
  let diff = hue2 - hue1;

  switch (direction) {
    case 'cw':
      // Force clockwise (positive direction)
      if (diff < 0) {
        diff += 360;
      }
      break;
    case 'ccw':
      // Force counter-clockwise (negative direction)
      if (diff > 0) {
        diff -= 360;
      }
      break;
    case 'shortest':
    default:
      // Take the shortest path around the circle
      if (diff > 180) {
        diff -= 360;
      } else if (diff < -180) {
        diff += 360;
      }
      break;
  }

  let result = hue1 + diff * factor;

  // Normalize to [0, 360)
  result = ((result % 360) + 360) % 360;

  return result;
}

/**
 * Blends two hue values with proper wraparound handling.
 * Hue is circular (0-360), so we take the shortest path.
 */
function blendHue(hue1: number, hue2: number, factor: number): number {
  return blendHueDirected(hue1, hue2, factor, 'shortest');
}

// ============================================================================
// Hue direction helpers
// ============================================================================

/**
 * Determines which direction shortest-path hue blending would
 * take from `tintHue` toward `themeHue`.
 *
 * Returns `'cw'` when the shortest arc goes clockwise (increasing
 * hue), `'ccw'` when counter-clockwise. At exactly 180 the tie
 * is broken toward `'cw'` for determinism.
 */
export function getHueBlendDirection(
  tintHue: number,
  themeHue: number
): 'cw' | 'ccw' {
  let diff = themeHue - tintHue;
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }
  return diff >= 0 ? 'cw' : 'ccw';
}

/**
 * Maximum forced arc before falling back to shortest-path blending.
 * Beyond this the forced direction would arc >3/4 of the wheel,
 * producing worse results than shortest-path fallback. The generous
 * threshold allows the majority to override boundary cases while
 * blocking catastrophic arcs.
 */
const MAX_FORCED_ARC_DEGREES = 270;

/**
 * Returns the majority direction if the arc from `tintHue` to
 * `themeHue` in that direction is <= {@link MAX_FORCED_ARC_DEGREES}.
 * Falls back to `undefined` (shortest path) when forcing would
 * create an extreme long-way-around blend. The generous threshold
 * allows the majority to override boundary cases while blocking
 * catastrophic arcs.
 *
 * @param tintHue - The tint color's hue angle
 * @param themeHue - The theme color's hue angle
 * @param majorityDir - Pre-calculated majority direction
 * @returns The majority direction, or `undefined` to use shortest
 */
export function effectiveHueDirection(
  tintHue: number,
  themeHue: number,
  majorityDir?: HueBlendDirection
): HueBlendDirection | undefined {
  if (!majorityDir) return undefined;
  let diff = themeHue - tintHue;
  if (majorityDir === 'cw') {
    if (diff < 0) diff += 360;
  } else {
    if (diff > 0) diff -= 360;
  }
  return Math.abs(diff) <= MAX_FORCED_ARC_DEGREES ? majorityDir : undefined;
}

/**
 * Determines the majority hue blend direction from the base hue
 * toward theme background colors.
 *
 * Computes the shortest-path blend direction from `baseHue` (before
 * any harmony offsets) to each background theme color's hue, then
 * returns the majority vote. This ensures all elements -- regardless
 * of their harmony offset -- blend in the same direction, preventing
 * split-direction artifacts where some elements go clockwise and
 * others counter-clockwise.
 *
 * @param baseHue - Pre-offset base hue angle
 * @param themeColors - Theme colors to vote against
 * @returns Majority direction, or `undefined` if no BG theme colors
 */
export function getMajorityHueDirection(
  baseHue: number,
  themeColors: ThemeColors
): HueBlendDirection | undefined {
  let cwCount = 0;
  let total = 0;

  for (const key of PATINA_MANAGED_KEYS) {
    const def = COLOR_KEY_DEFINITIONS[key as PaletteKey];
    if (def.colorType !== 'background') continue;

    const themeHex = getColorForKey(key as PaletteKey, themeColors);
    if (!themeHex) continue;

    const themeHue = hexToOklch(themeHex).h;
    const dir = getHueBlendDirection(baseHue, themeHue);
    if (dir === 'cw') cwCount++;
    total++;
  }

  if (total === 0) return undefined;

  // Break ties toward clockwise for determinism.
  return cwCount >= total - cwCount ? 'cw' : 'ccw';
}

// ============================================================================
// OKLCH blend internals
// ============================================================================

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
    // Invalid hex -- skip blending, return tint unchanged.
    return tintOklch;
  }
  const factor = Math.max(0, Math.min(1, blendFactor));

  return clampToGamut(interpolate(tintOklch, themeOklch, factor));
}

// ============================================================================
// Exported OKLCH blend functions (used by tests + preview)
// ============================================================================

/**
 * Blends a tint color with a theme background color in OKLCH space.
 *
 * OKLCH provides uniform blending in a perceptual color space,
 * ensuring smoother transitions that look more natural to the human eye.
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
 * component is interpolated. Used by the adaptive style where L/C
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

/**
 * Like {@link blendWithThemeOklch} but forces a specific hue
 * interpolation direction instead of taking the shortest path.
 *
 * @param tintOklch - The tint color in OKLCH
 * @param themeBackgroundHex - The theme's background color as hex
 * @param blendFactor - How much to blend toward the theme (0-1)
 * @param hueDirection - Direction around the color wheel for hue
 * @returns Blended OKLCH color (gamut-clamped)
 */
export function blendWithThemeOklchDirected(
  tintOklch: OKLCH,
  themeBackgroundHex: string,
  blendFactor: number,
  hueDirection: HueBlendDirection
): OKLCH {
  return blendOklchInternal(
    tintOklch,
    themeBackgroundHex,
    blendFactor,
    (tint, theme, factor) => ({
      l: tint.l * (1 - factor) + theme.l * factor,
      c: tint.c * (1 - factor) + theme.c * factor,
      h: blendHueDirected(tint.h, theme.h, factor, hueDirection),
    })
  );
}

/**
 * Like {@link blendHueOnlyOklch} but forces a specific hue
 * interpolation direction instead of taking the shortest path.
 *
 * @param tintOklch - The tint color in OKLCH (L/C preserved)
 * @param themeBackgroundHex - The theme's background color as hex
 * @param blendFactor - How much to blend the hue toward theme (0-1)
 * @param hueDirection - Direction around the color wheel for hue
 * @returns Blended OKLCH color (gamut-clamped)
 */
export function blendHueOnlyOklchDirected(
  tintOklch: OKLCH,
  themeBackgroundHex: string,
  blendFactor: number,
  hueDirection: HueBlendDirection
): OKLCH {
  return blendOklchInternal(
    tintOklch,
    themeBackgroundHex,
    blendFactor,
    (tint, theme, factor) => ({
      l: tint.l,
      c: tint.c,
      h: blendHueDirected(tint.h, theme.h, factor, hueDirection),
    })
  );
}

// ============================================================================
// High-level hue shift blend
// ============================================================================

/**
 * High-level blend that resolves the effective hue direction and
 * picks the appropriate directed or shortest-path blend function.
 *
 * Encapsulates the common pattern of:
 * 1. Resolve effective direction via {@link effectiveHueDirection}
 * 2. Pick directed vs shortest-path blend function
 * 3. Call and return the blended result
 *
 * @param tintOklch - The tint color in OKLCH
 * @param themeHex - The theme color as hex
 * @param factor - Blend factor (0-1)
 * @param hueOnly - Whether to blend hue only (preserving L/C)
 * @param majorityDir - Pre-calculated majority hue direction
 * @returns Blended OKLCH color (gamut-clamped)
 */
export function blendDirectedOklch(
  tintOklch: OKLCH,
  themeHex: string,
  factor: number,
  hueOnly: boolean,
  majorityDir?: HueBlendDirection
): OKLCH {
  const themeHue = hexToOklch(themeHex).h;
  const dir = effectiveHueDirection(tintOklch.h, themeHue, majorityDir);

  if (dir) {
    const fn = hueOnly
      ? blendHueOnlyOklchDirected
      : blendWithThemeOklchDirected;
    return fn(tintOklch, themeHex, factor, dir);
  }

  const fn = hueOnly ? blendHueOnlyOklch : blendWithThemeOklch;
  return fn(tintOklch, themeHex, factor);
}

/**
 * Creates a hue shift {@link BlendFunction} that uses OKLCH
 * interpolation with directed hue blending.
 *
 * The returned function closes over the pre-calculated majority
 * hue direction so all keys blend consistently.
 *
 * @param majorityDir - Pre-calculated majority hue direction
 * @returns A {@link BlendFunction} using OKLCH hue shift blending
 */
export function createHueShiftBlend(
  majorityDir?: HueBlendDirection
): BlendFunction {
  return (tintOklch, _tintHex, themeHex, factor, hueOnly) => {
    const blended = blendDirectedOklch(
      tintOklch,
      themeHex,
      factor,
      hueOnly,
      majorityDir
    );
    return oklchToHex(blended);
  };
}
