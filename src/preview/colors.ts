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
  getSchemeConfig,
} from '../color/schemes';
import { oklchToHex, maxChroma } from '../color/convert';
import { blendWithThemeOklch } from '../color/blend';
import { getColorForKey } from '../theme/colors';
import type { OKLCH } from '../color/types';
import { applyHueOffset, computeBaseHue } from '../color/tint';

/**
 * Sample hues for preview display (OKLCH-calibrated).
 * Red=29, Orange=55, Yellow=100, Green=145, Teal=185, Cyan=210, Blue=265,
 * Purple=305
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
  themeColors?: ThemeColors,
  blendFactor?: number
): ElementColors {
  const config = getSchemeConfig(scheme);
  const themeConfig = config[themeType];

  const bgConfig = themeConfig[bgKey];
  const fgConfig = themeConfig[fgKey];

  // Apply hue offset for multi-hue schemes
  const bgHue = applyHueOffset(hue, bgConfig.hueOffset);
  const fgHue = applyHueOffset(hue, fgConfig.hueOffset);

  // Calculate chroma based on max gamut chroma
  const bgChroma = maxChroma(bgConfig.lightness, bgHue) * bgConfig.chromaFactor;
  const fgChroma = maxChroma(fgConfig.lightness, fgHue) * fgConfig.chromaFactor;

  const bgOklch: OKLCH = {
    l: bgConfig.lightness,
    c: bgChroma,
    h: bgHue,
  };
  const fgOklch: OKLCH = {
    l: fgConfig.lightness,
    c: fgChroma,
    h: fgHue,
  };

  // Blend with theme colors if provided
  if (themeColors && blendFactor !== undefined && blendFactor > 0) {
    const themeBg = getColorForKey(bgKey, themeColors);
    const themeFg = getColorForKey(fgKey, themeColors);

    const blendedBg = themeBg
      ? blendWithThemeOklch(bgOklch, themeBg, blendFactor)
      : bgOklch;
    const blendedFg = themeFg
      ? blendWithThemeOklch(fgOklch, themeFg, blendFactor)
      : fgOklch;

    return {
      background: oklchToHex(blendedBg),
      foreground: oklchToHex(blendedFg),
    };
  }

  return {
    background: oklchToHex(bgOklch),
    foreground: oklchToHex(fgOklch),
  };
}

/**
 * Generates preview colors for all three elements at a given hue.
 */
function generateColorsAtHue(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number
): SchemePreviewColors {
  return {
    titleBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'titleBar.activeBackground',
      'titleBar.activeForeground'
    ),
    statusBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'statusBar.background',
      'statusBar.foreground'
    ),
    activityBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'activityBar.background',
      'activityBar.foreground'
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
 * Generates blended colors for all three elements at a given hue.
 */
function generateBlendedColorsAtHue(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number,
  themeColors: ThemeColors,
  blendFactor: number,
  targetBlendFactors?: Partial<Record<TintTarget, number>>
): SchemePreviewColors {
  return {
    titleBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      themeColors,
      targetBlendFactors?.titleBar ?? blendFactor
    ),
    statusBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'statusBar.background',
      'statusBar.foreground',
      themeColors,
      targetBlendFactors?.statusBar ?? blendFactor
    ),
    activityBar: generateElementColors(
      scheme,
      themeType,
      hue,
      'activityBar.background',
      'activityBar.foreground',
      themeColors,
      targetBlendFactors?.activityBar ?? blendFactor
    ),
  };
}

/**
 * Options for generating workspace preview.
 */
export interface WorkspacePreviewOptions {
  identifier: string;
  scheme: ColorScheme;
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
    ? generateBlendedColorsAtHue(
        scheme,
        themeType,
        hue,
        themeColors!,
        blendFactor,
        targetBlendFactors
      )
    : generateColorsAtHue(scheme, themeType, hue);

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
