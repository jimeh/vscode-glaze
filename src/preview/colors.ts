import type { ThemeType, ThemeColors } from '../theme';
import { DEFAULT_BLEND_FACTOR } from '../config';
import type { TintTarget } from '../config';
import type {
  HarmonyPreview,
  StylePreview,
  StylePreviewColors,
  WorkspacePreview,
} from './types';
import type { ColorStyle } from '../color/styles';
import { ALL_COLOR_STYLES, COLOR_STYLE_LABELS } from '../color/styles';
import type { ColorHarmony } from '../color/harmony';
import { ALL_COLOR_HARMONIES, COLOR_HARMONY_LABELS } from '../color/harmony';
import type { BlendMethod } from '../color/blend';
import { computeTint } from '../color/tint';
import { tintResultToPreviewColors } from './adapter';

/**
 * Sample hues for preview display (OKLCH-calibrated).
 * Red=29, Orange=55, Yellow=100, Green=145, Teal=185, Cyan=210,
 * Blue=265, Purple=305
 */
export const SAMPLE_HUES = [29, 55, 100, 145, 185, 235, 265, 305];

/**
 * Preview targets — the elements shown in the preview panel.
 * Excludes sideBar since it's disabled by default and not shown.
 */
const PREVIEW_TARGETS: TintTarget[] = ['titleBar', 'statusBar', 'activityBar'];

/** Options for {@link generateColorsAtHue}. */
interface GenerateColorsAtHueOptions {
  style: ColorStyle;
  themeType: ThemeType;
  hue: number;
  harmony?: ColorHarmony | undefined;
  themeColors?: ThemeColors | undefined;
  blendFactor?: number | undefined;
  blendMethod?: BlendMethod | undefined;
  targetBlendFactors?: Partial<Record<TintTarget, number>> | undefined;
}

/**
 * Generates preview colors for all three elements at a given hue,
 * optionally blending with theme colors.
 *
 * Delegates to computeTint() to ensure identical color computation
 * with production code paths.
 */
function generateColorsAtHue(
  options: GenerateColorsAtHueOptions
): StylePreviewColors {
  const {
    style,
    themeType,
    hue,
    harmony = 'uniform',
    themeColors,
    blendFactor,
    blendMethod = 'overlay',
    targetBlendFactors,
  } = options;
  const result = computeTint({
    baseHue: hue,
    targets: PREVIEW_TARGETS,
    themeType,
    colorStyle: style,
    colorHarmony: harmony,
    themeColors,
    blendMethod,
    themeBlendFactor: blendFactor ?? DEFAULT_BLEND_FACTOR,
    targetBlendFactors,
  });

  return tintResultToPreviewColors(result);
}

/**
 * Generates preview data for a single color style.
 */
export function generateStylePreview(
  style: ColorStyle,
  themeType: ThemeType,
  harmony: ColorHarmony = 'uniform'
): StylePreview {
  return {
    style,
    label: COLOR_STYLE_LABELS[style],
    hueColors: SAMPLE_HUES.map((hue) =>
      generateColorsAtHue({ style, themeType, hue, harmony })
    ),
  };
}

/**
 * Generates preview data for all color styles.
 */
export function generateAllStylePreviews(
  themeType: ThemeType,
  harmony: ColorHarmony = 'uniform'
): StylePreview[] {
  return ALL_COLOR_STYLES.map((s) =>
    generateStylePreview(s, themeType, harmony)
  );
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
      generateColorsAtHue({ style, themeType, hue, harmony })
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
  harmony?: ColorHarmony | undefined;
  themeType: ThemeType;
  seed?: number | undefined;
  themeColors?: ThemeColors | undefined;
  blendMethod?: BlendMethod | undefined;
  blendFactor?: number | undefined;
  targetBlendFactors?: Partial<Record<TintTarget, number>> | undefined;
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
    blendMethod = 'overlay',
    blendFactor = DEFAULT_BLEND_FACTOR,
    targetBlendFactors,
  } = options;

  const hasAnyBlend =
    blendFactor > 0 ||
    (targetBlendFactors !== undefined &&
      Object.values(targetBlendFactors).some((f) => f > 0));
  const isBlended = themeColors !== undefined && hasAnyBlend;

  const result = computeTint({
    workspaceIdentifier: identifier,
    seed,
    targets: PREVIEW_TARGETS,
    themeType,
    colorStyle: style,
    colorHarmony: harmony,
    themeColors: isBlended ? themeColors : undefined,
    blendMethod,
    themeBlendFactor: blendFactor,
    targetBlendFactors,
  });

  return {
    identifier,
    colors: tintResultToPreviewColors(result),
    blendFactor: isBlended ? blendFactor : undefined,
    isBlended,
    targetBlendFactors:
      targetBlendFactors && Object.keys(targetBlendFactors).length > 0
        ? targetBlendFactors
        : undefined,
  };
}
