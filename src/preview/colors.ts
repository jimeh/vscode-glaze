import type { ThemeType, ThemeColors, PaletteKey } from '../theme';
import { DEFAULT_BLEND_FACTOR } from '../config';
import type { TintTarget } from '../config';
import type {
  ElementColors,
  SchemePreview,
  SchemePreviewColors,
  WorkspacePreview,
} from './types';
import type { ColorScheme } from '../color/schemes';
import {
  ALL_COLOR_SCHEMES,
  COLOR_SCHEME_LABELS,
  getSchemeResolver,
} from '../color/schemes';
import type { SchemeResolveContext } from '../color/schemes';
import type { ColorHarmony } from '../color/harmony';
import { HARMONY_CONFIGS } from '../color/harmony';
import { hexToOklch, oklchToHex } from '../color/convert';
import {
  blendWithThemeOklch,
  blendHueOnlyOklch,
  blendWithThemeOklchDirected,
  blendHueOnlyOklchDirected,
  getHueBlendDirection,
} from '../color/blend';
import type { HueBlendDirection } from '../color/blend';
import { getColorForKey } from '../theme/colors';
import { computeBaseHue } from '../color/tint';

/**
 * Sample hues for preview display (OKLCH-calibrated).
 * Red=29, Orange=55, Yellow=100, Green=145, Teal=185, Cyan=210,
 * Blue=265, Purple=305
 */
export const SAMPLE_HUES = [29, 55, 100, 145, 185, 235, 265, 305];

/**
 * Returns the majority direction if the arc from `tintHue` to
 * `themeHex` in that direction is ≤ 270°. Falls back to
 * `undefined` (shortest path) when forcing would create an
 * extreme long-way-around blend (>270° arc). The generous
 * threshold allows the majority to override boundary cases
 * while blocking catastrophic arcs.
 */
function effectiveDir(
  tintHue: number,
  themeHex: string,
  majorityDir?: HueBlendDirection
): HueBlendDirection | undefined {
  if (!majorityDir) return undefined;
  const themeHue = hexToOklch(themeHex).h;
  let diff = themeHue - tintHue;
  if (majorityDir === 'cw') {
    if (diff < 0) diff += 360;
  } else {
    if (diff > 0) diff -= 360;
  }
  return Math.abs(diff) <= 270 ? majorityDir : undefined;
}

/**
 * Generates element colors for a single UI element at a given
 * hue, optionally blending with theme colors.
 *
 * When `hueDirection` is provided, directed blending is used
 * to keep all elements consistent in their hue rotation.
 */
function generateElementColors(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number,
  bgKey: PaletteKey,
  fgKey: PaletteKey,
  hueOffset: number,
  themeColors?: ThemeColors,
  blendFactor?: number,
  hueDirection?: HueBlendDirection
): ElementColors {
  const resolver = getSchemeResolver(scheme);
  const context: SchemeResolveContext = {
    baseHue: hue,
    themeColors,
    hueOffset,
  };

  const bgResult = resolver(themeType, bgKey, context);
  const fgResult = resolver(themeType, fgKey, context);

  // Blend with theme colors if provided
  if (themeColors && blendFactor !== undefined && blendFactor > 0) {
    const themeBg = getColorForKey(bgKey, themeColors);
    const themeFg = getColorForKey(fgKey, themeColors);

    let blendedBg = bgResult.tintOklch;
    if (themeBg) {
      const dir = effectiveDir(bgResult.tintOklch.h, themeBg, hueDirection);
      if (dir) {
        const fn = bgResult.hueOnlyBlend
          ? blendHueOnlyOklchDirected
          : blendWithThemeOklchDirected;
        blendedBg = fn(bgResult.tintOklch, themeBg, blendFactor, dir);
      } else {
        const fn = bgResult.hueOnlyBlend
          ? blendHueOnlyOklch
          : blendWithThemeOklch;
        blendedBg = fn(bgResult.tintOklch, themeBg, blendFactor);
      }
    }

    let blendedFg = fgResult.tintOklch;
    if (themeFg) {
      const dir = effectiveDir(fgResult.tintOklch.h, themeFg, hueDirection);
      if (dir) {
        const fn = fgResult.hueOnlyBlend
          ? blendHueOnlyOklchDirected
          : blendWithThemeOklchDirected;
        blendedFg = fn(fgResult.tintOklch, themeFg, blendFactor, dir);
      } else {
        const fn = fgResult.hueOnlyBlend
          ? blendHueOnlyOklch
          : blendWithThemeOklch;
        blendedFg = fn(fgResult.tintOklch, themeFg, blendFactor);
      }
    }

    return {
      background: oklchToHex(blendedBg),
      foreground: oklchToHex(blendedFg),
    };
  }

  return {
    background: oklchToHex(bgResult.tintOklch),
    foreground: oklchToHex(fgResult.tintOklch),
  };
}

/**
 * Generates preview colors for all three elements at a given hue,
 * optionally blending with theme colors.
 *
 * Pre-calculates majority hue direction from the base hue against
 * the background theme colors so all elements blend consistently.
 */
function generateColorsAtHue(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number,
  harmony: ColorHarmony = 'uniform',
  themeColors?: ThemeColors,
  blendFactor?: number,
  targetBlendFactors?: Partial<Record<TintTarget, number>>
): SchemePreviewColors {
  const harmonyConfig = HARMONY_CONFIGS[harmony];

  // Pre-calculate majority hue direction from the base hue
  // (before harmony offsets) against the BG theme colors.
  let majorityDir: HueBlendDirection | undefined;
  if (themeColors) {
    const bgKeys: PaletteKey[] = [
      'titleBar.activeBackground',
      'statusBar.background',
      'activityBar.background',
    ];
    let cwCount = 0;
    let total = 0;
    for (const bgKey of bgKeys) {
      const themeHex = getColorForKey(bgKey, themeColors);
      if (!themeHex) continue;
      const themeHue = hexToOklch(themeHex).h;
      const dir = getHueBlendDirection(hue, themeHue);
      if (dir === 'cw') cwCount++;
      total++;
    }
    if (total > 0) {
      majorityDir = cwCount >= total - cwCount ? 'cw' : 'ccw';
    }
  }

  return {
    titleBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      harmonyConfig.titleBar,
      themeColors,
      targetBlendFactors?.titleBar ?? blendFactor,
      majorityDir
    ),
    statusBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'statusBar.background',
      'statusBar.foreground',
      harmonyConfig.statusBar,
      themeColors,
      targetBlendFactors?.statusBar ?? blendFactor,
      majorityDir
    ),
    activityBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'activityBar.background',
      'activityBar.foreground',
      harmonyConfig.activityBar,
      themeColors,
      targetBlendFactors?.activityBar ?? blendFactor,
      majorityDir
    ),
  };
}

/**
 * Generates preview data for a single color scheme.
 */
export function generateSchemePreview(
  scheme: ColorScheme,
  themeType: ThemeType
): SchemePreview {
  return {
    scheme,
    label: COLOR_SCHEME_LABELS[scheme],
    hueColors: SAMPLE_HUES.map((hue) =>
      generateColorsAtHue(scheme, themeType, hue)
    ),
  };
}

/**
 * Generates preview data for all color schemes.
 */
export function generateAllSchemePreviews(
  themeType: ThemeType
): SchemePreview[] {
  return ALL_COLOR_SCHEMES.map((scheme) =>
    generateSchemePreview(scheme, themeType)
  );
}

/**
 * Options for generating workspace preview.
 */
export interface WorkspacePreviewOptions {
  identifier: string;
  scheme: ColorScheme;
  harmony?: ColorHarmony;
  themeType: ThemeType;
  seed?: number;
  themeColors?: ThemeColors;
  blendFactor?: number;
  targetBlendFactors?: Partial<Record<TintTarget, number>>;
}

/**
 * Generates preview data for the current workspace.
 */
export function generateWorkspacePreview(
  options: WorkspacePreviewOptions
): WorkspacePreview {
  const {
    identifier,
    scheme,
    harmony = 'uniform',
    themeType,
    seed = 0,
    themeColors,
    blendFactor = DEFAULT_BLEND_FACTOR,
    targetBlendFactors,
  } = options;

  const hue = computeBaseHue(identifier, seed);

  const hasAnyBlend =
    blendFactor > 0 ||
    (targetBlendFactors !== undefined &&
      Object.values(targetBlendFactors).some((f) => f > 0));
  const isBlended = themeColors !== undefined && hasAnyBlend;

  const colors = isBlended
    ? generateColorsAtHue(
        scheme,
        themeType,
        hue,
        harmony,
        themeColors,
        blendFactor,
        targetBlendFactors
      )
    : generateColorsAtHue(scheme, themeType, hue, harmony);

  return {
    identifier,
    colors,
    blendFactor: isBlended ? blendFactor : undefined,
    isBlended,
    targetBlendFactors:
      targetBlendFactors && Object.keys(targetBlendFactors).length > 0
        ? targetBlendFactors
        : undefined,
  };
}
