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
import { oklchToHex } from '../color/convert';
import { blendWithThemeOklch, blendHueOnlyOklch } from '../color/blend';
import { getColorForKey } from '../theme/colors';
import { computeBaseHue } from '../color/tint';

/**
 * Sample hues for preview display (OKLCH-calibrated).
 * Red=29, Orange=55, Yellow=100, Green=145, Teal=185, Cyan=210,
 * Blue=265, Purple=305
 */
export const SAMPLE_HUES = [29, 55, 100, 145, 185, 235, 265, 305];

/**
 * Generates element colors for a single UI element at a given
 * hue, optionally blending with theme colors.
 */
function generateElementColors(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number,
  bgKey: PaletteKey,
  fgKey: PaletteKey,
  hueOffset: number,
  themeColors?: ThemeColors,
  blendFactor?: number
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

    const blendBg = bgResult.hueOnlyBlend
      ? blendHueOnlyOklch
      : blendWithThemeOklch;
    const blendFg = fgResult.hueOnlyBlend
      ? blendHueOnlyOklch
      : blendWithThemeOklch;

    const blendedBg = themeBg
      ? blendBg(bgResult.tintOklch, themeBg, blendFactor)
      : bgResult.tintOklch;
    const blendedFg = themeFg
      ? blendFg(fgResult.tintOklch, themeFg, blendFactor)
      : fgResult.tintOklch;

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

  return {
    titleBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      harmonyConfig.titleBar,
      themeColors,
      targetBlendFactors?.titleBar ?? blendFactor
    ),
    statusBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'statusBar.background',
      'statusBar.foreground',
      harmonyConfig.statusBar,
      themeColors,
      targetBlendFactors?.statusBar ?? blendFactor
    ),
    activityBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'activityBar.background',
      'activityBar.foreground',
      harmonyConfig.activityBar,
      themeColors,
      targetBlendFactors?.activityBar ?? blendFactor
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
