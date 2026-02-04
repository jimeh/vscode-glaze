import type { ThemeType, ThemeColors, PaletteKey } from '../theme';
import { DEFAULT_BLEND_FACTOR } from '../config';
import type { TintTarget } from '../config';
import type {
  ElementColors,
  HarmonyPreview,
  StylePreview,
  StylePreviewColors,
  WorkspacePreview,
} from './types';
import type { ColorStyle } from '../color/styles';
import {
  ALL_COLOR_STYLES,
  COLOR_STYLE_LABELS,
  getStyleResolver,
} from '../color/styles';
import type { StyleResolveContext } from '../color/styles';
import type { ColorHarmony } from '../color/harmony';
import {
  ALL_COLOR_HARMONIES,
  COLOR_HARMONY_LABELS,
  HARMONY_CONFIGS,
} from '../color/harmony';
import { hexToOklch, oklchToHex } from '../color/convert';
import {
  blendWithThemeOklch,
  blendHueOnlyOklch,
  blendWithThemeOklchDirected,
  blendHueOnlyOklchDirected,
  effectiveHueDirection,
} from '../color/blend';
import type { HueBlendDirection } from '../color/blend';
import { getColorForKey } from '../theme/colors';
import { computeBaseHue, getMajorityHueDirection } from '../color/tint';

/**
 * Sample hues for preview display (OKLCH-calibrated).
 * Red=29, Orange=55, Yellow=100, Green=145, Teal=185, Cyan=210,
 * Blue=265, Purple=305
 */
export const SAMPLE_HUES = [29, 55, 100, 145, 185, 235, 265, 305];

/**
 * Generates element colors for a single UI element at a given
 * hue, optionally blending with theme colors.
 *
 * When `hueDirection` is provided, directed blending is used
 * to keep all elements consistent in their hue rotation.
 */
function generateElementColors(
  style: ColorStyle,
  themeType: ThemeType,
  hue: number,
  bgKey: PaletteKey,
  fgKey: PaletteKey,
  hueOffset: number,
  themeColors?: ThemeColors,
  blendFactor?: number,
  hueDirection?: HueBlendDirection
): ElementColors {
  const resolver = getStyleResolver(style);
  const context: StyleResolveContext = {
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
      const themeHue = hexToOklch(themeBg).h;
      const dir = effectiveHueDirection(
        bgResult.tintOklch.h,
        themeHue,
        hueDirection
      );
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
      const themeHue = hexToOklch(themeFg).h;
      const dir = effectiveHueDirection(
        fgResult.tintOklch.h,
        themeHue,
        hueDirection
      );
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
  style: ColorStyle,
  themeType: ThemeType,
  hue: number,
  harmony: ColorHarmony = 'uniform',
  themeColors?: ThemeColors,
  blendFactor?: number,
  targetBlendFactors?: Partial<Record<TintTarget, number>>
): StylePreviewColors {
  const harmonyConfig = HARMONY_CONFIGS[harmony];

  // Pre-calculate majority hue direction from the base hue
  // (before harmony offsets) against the BG theme colors.
  const majorityDir = themeColors
    ? getMajorityHueDirection(hue, themeColors)
    : undefined;

  return {
    titleBar: generateElementColors(
      style,
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
      style,
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
      style,
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
 * Generates preview data for a single color style.
 */
export function generateStylePreview(
  style: ColorStyle,
  themeType: ThemeType
): StylePreview {
  return {
    style,
    label: COLOR_STYLE_LABELS[style],
    hueColors: SAMPLE_HUES.map((hue) =>
      generateColorsAtHue(style, themeType, hue)
    ),
  };
}

/**
 * Generates preview data for all color styles.
 */
export function generateAllStylePreviews(themeType: ThemeType): StylePreview[] {
  return ALL_COLOR_STYLES.map((s) => generateStylePreview(s, themeType));
}

/**
 * Generates preview data for a single color harmony.
 */
export function generateHarmonyPreview(
  harmony: ColorHarmony,
  style: ColorStyle,
  themeType: ThemeType
): HarmonyPreview {
  return {
    harmony,
    label: COLOR_HARMONY_LABELS[harmony],
    hueColors: SAMPLE_HUES.map((hue) =>
      generateColorsAtHue(style, themeType, hue, harmony)
    ),
  };
}

/**
 * Generates preview data for all color harmonies.
 */
export function generateAllHarmonyPreviews(
  style: ColorStyle,
  themeType: ThemeType
): HarmonyPreview[] {
  return ALL_COLOR_HARMONIES.map((h) =>
    generateHarmonyPreview(h, style, themeType)
  );
}

/**
 * Options for generating workspace preview.
 */
export interface WorkspacePreviewOptions {
  identifier: string;
  style: ColorStyle;
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
    style,
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
        style,
        themeType,
        hue,
        harmony,
        themeColors,
        blendFactor,
        targetBlendFactors
      )
    : generateColorsAtHue(style, themeType, hue, harmony);

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
