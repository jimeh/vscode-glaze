import type { ColorScheme } from '../config';
import type { ThemeType, ThemeColors } from '../theme';
import type {
  ElementColors,
  SchemePreview,
  SchemePreviewColors,
  WorkspacePreview,
} from './types';
import { getSchemeConfig } from '../color/schemes';
import { oklchToHex, maxChroma } from '../color/convert';
import { hashString } from '../color/hash';
import { blendWithThemeOklch } from '../color/blend';
import { getColorForKey } from '../theme/colors';
import type { OKLCH } from '../color/types';

/**
 * Sample hues for preview display (ROYGBIV spread).
 * 0=Red, 60=Yellow, 120=Green, 180=Cyan, 240=Blue, 300=Magenta
 */
export const SAMPLE_HUES = [0, 60, 120, 180, 240, 300];

/**
 * Display labels for color schemes.
 */
const SCHEME_LABELS: Record<ColorScheme, string> = {
  pastel: 'Pastel',
  vibrant: 'Vibrant',
  muted: 'Muted',
  monochrome: 'Monochrome',
};

/**
 * All available color schemes in display order.
 */
const ALL_SCHEMES: ColorScheme[] = ['pastel', 'vibrant', 'muted', 'monochrome'];

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

  // Calculate chroma based on max gamut chroma and chromaFactor
  const bgChroma = maxChroma(bgConfig.lightness, hue) * bgConfig.chromaFactor;
  const fgChroma = maxChroma(fgConfig.lightness, hue) * fgConfig.chromaFactor;

  return {
    background: oklchToHex({ l: bgConfig.lightness, c: bgChroma, h: hue }),
    foreground: oklchToHex({ l: fgConfig.lightness, c: fgChroma, h: hue }),
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
    label: SCHEME_LABELS[scheme],
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
  return ALL_SCHEMES.map((scheme) => generateSchemePreview(scheme, themeType));
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

  // Calculate chroma based on max gamut chroma and chromaFactor
  const bgChroma = maxChroma(bgConfig.lightness, hue) * bgConfig.chromaFactor;
  const fgChroma = maxChroma(fgConfig.lightness, hue) * fgConfig.chromaFactor;

  // Create base OKLCH colors
  const bgOklch: OKLCH = { l: bgConfig.lightness, c: bgChroma, h: hue };
  const fgOklch: OKLCH = { l: fgConfig.lightness, c: fgChroma, h: hue };

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
  blendFactor: number
): SchemePreviewColors {
  return {
    titleBar: generateBlendedElementColors(
      scheme,
      themeType,
      hue,
      'titleBar.activeBackground',
      'titleBar.activeForeground',
      themeColors,
      blendFactor
    ),
    statusBar: generateBlendedElementColors(
      scheme,
      themeType,
      hue,
      'statusBar.background',
      'statusBar.foreground',
      themeColors,
      blendFactor
    ),
    activityBar: generateBlendedElementColors(
      scheme,
      themeType,
      hue,
      'activityBar.background',
      'activityBar.foreground',
      themeColors,
      blendFactor
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
  } = options;

  const workspaceHash = hashString(identifier);
  const seedHash = seed !== 0 ? hashString(seed.toString()) : 0;
  const hue = ((workspaceHash ^ seedHash) >>> 0) % 360;

  const isBlended = themeColors !== undefined && blendFactor > 0;

  const colors = isBlended
    ? generateBlendedColorsAtHue(
        scheme,
        themeType,
        hue,
        themeColors!,
        blendFactor
      )
    : generateColorsAtHue(scheme, themeType, hue);

  return {
    identifier,
    colors,
    blendFactor: isBlended ? blendFactor : undefined,
    isBlended,
  };
}
