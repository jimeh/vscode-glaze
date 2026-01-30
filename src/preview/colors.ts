import type { ThemeType, ThemeColors } from '../theme';
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
import { hashString } from '../color/hash';
import { blendWithThemeOklch } from '../color/blend';
import { getColorForKey } from '../theme/colors';
import type { OKLCH } from '../color/types';

/**
 * Sample hues for preview display (OKLCH-calibrated).
 * Red=29, Orange=55, Yellow=100, Green=145, Teal=185, Cyan=210, Blue=265,
 * Purple=305
 */
export const SAMPLE_HUES = [29, 55, 100, 145, 185, 235, 265, 305];

/**
 * Applies hue offset, wrapping to 0-360 range.
 */
function applyHueOffset(hue: number, offset?: number): number {
  return (((hue + (offset ?? 0)) % 360) + 360) % 360;
}

/**
 * Generates element colors for a single UI element at a given hue.
 */
function generateElementColors(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number,
  bgKey: string,
  fgKey: string
): ElementColors {
  const config = getSchemeConfig(scheme);
  const themeConfig = config[themeType];

  const bgConfig = themeConfig[bgKey as keyof typeof themeConfig];
  const fgConfig = themeConfig[fgKey as keyof typeof themeConfig];

  // Apply hue offset for multi-hue schemes (duotone, analogous)
  const bgHue = applyHueOffset(hue, bgConfig.hueOffset);
  const fgHue = applyHueOffset(hue, fgConfig.hueOffset);

  // Calculate chroma based on max gamut chroma and chromaFactor
  const bgChroma = maxChroma(bgConfig.lightness, bgHue) * bgConfig.chromaFactor;
  const fgChroma = maxChroma(fgConfig.lightness, fgHue) * fgConfig.chromaFactor;

  return {
    background: oklchToHex({ l: bgConfig.lightness, c: bgChroma, h: bgHue }),
    foreground: oklchToHex({ l: fgConfig.lightness, c: fgChroma, h: fgHue }),
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
 * Generates blended element colors with theme blending applied.
 */
function generateBlendedElementColors(
  scheme: ColorScheme,
  themeType: ThemeType,
  hue: number,
  bgKey: string,
  fgKey: string,
  themeColors: ThemeColors,
  blendFactor: number
): ElementColors {
  const config = getSchemeConfig(scheme);
  const themeConfig = config[themeType];

  const bgConfig = themeConfig[bgKey as keyof typeof themeConfig];
  const fgConfig = themeConfig[fgKey as keyof typeof themeConfig];

  // Apply hue offset for multi-hue schemes (duotone, analogous)
  const bgHue = applyHueOffset(hue, bgConfig.hueOffset);
  const fgHue = applyHueOffset(hue, fgConfig.hueOffset);

  // Calculate chroma based on max gamut chroma and chromaFactor
  const bgChroma = maxChroma(bgConfig.lightness, bgHue) * bgConfig.chromaFactor;
  const fgChroma = maxChroma(fgConfig.lightness, fgHue) * fgConfig.chromaFactor;

  // Create base OKLCH colors
  const bgOklch: OKLCH = { l: bgConfig.lightness, c: bgChroma, h: bgHue };
  const fgOklch: OKLCH = { l: fgConfig.lightness, c: fgChroma, h: fgHue };

  // Get theme colors for blending
  const themeBgColor = getColorForKey(
    bgKey as Parameters<typeof getColorForKey>[0],
    themeColors
  );
  const themeFgColor = getColorForKey(
    fgKey as Parameters<typeof getColorForKey>[0],
    themeColors
  );

  // Apply blending
  const blendedBg = themeBgColor
    ? blendWithThemeOklch(bgOklch, themeBgColor, blendFactor)
    : bgOklch;
  const blendedFg = themeFgColor
    ? blendWithThemeOklch(fgOklch, themeFgColor, blendFactor)
    : fgOklch;

  return {
    background: oklchToHex(blendedBg),
    foreground: oklchToHex(blendedFg),
  };
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
    titleBar: generateBlendedElementColors(
      scheme,
      themeType,
      hue,
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      themeColors,
      targetBlendFactors?.titleBar ?? blendFactor
    ),
    statusBar: generateBlendedElementColors(
      scheme,
      themeType,
      hue,
      'statusBar.background',
      'statusBar.foreground',
      themeColors,
      targetBlendFactors?.statusBar ?? blendFactor
    ),
    activityBar: generateBlendedElementColors(
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
    blendFactor = 0.35,
    targetBlendFactors,
  } = options;

  const workspaceHash = hashString(identifier);
  const seedHash = seed !== 0 ? hashString(seed.toString()) : 0;
  const hue = ((workspaceHash ^ seedHash) >>> 0) % 360;

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
