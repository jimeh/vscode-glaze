import type { OKLCH } from './types';
import type { ColorScheme, TintTarget } from '../config';
import type { ThemeContext, PaletteKey, PatinaColorPalette } from '../theme';
import { COLOR_KEY_DEFINITIONS, PATINA_MANAGED_KEYS } from '../theme';
import { getColorForKey } from '../theme/colors';
import { hashString } from './hash';
import { oklchToHex, maxChroma } from './convert';
import { blendWithThemeOklch } from './blend';
import { getSchemeConfig } from './schemes';

/**
 * Partial palette containing only the requested tint targets.
 */
export type PartialPatinaColorPalette = Partial<PatinaColorPalette>;

/**
 * Maps tint targets to their corresponding palette keys.
 * Derived from COLOR_KEY_DEFINITIONS by grouping palette keys by element.
 */
const TARGET_KEYS: Record<TintTarget, PaletteKey[]> = (() => {
  const result: Record<TintTarget, PaletteKey[]> = {
    titleBar: [],
    statusBar: [],
    activityBar: [],
  };
  for (const key of PATINA_MANAGED_KEYS) {
    const def = COLOR_KEY_DEFINITIONS[key];
    result[def.element as TintTarget].push(key);
  }
  return result;
})();

/**
 * Options for palette generation.
 */
export interface GeneratePaletteOptions {
  /** A string identifying the workspace (typically the folder name) */
  workspaceIdentifier: string;
  /** Which UI element groups to include in the palette */
  targets: TintTarget[];
  /** Theme context with type and optional colors */
  themeContext: ThemeContext;
  /** Color scheme to use for palette generation, default 'pastel' */
  colorScheme?: ColorScheme;
  /** How much to blend toward theme background (0-1), default 0.35 */
  themeBlendFactor?: number;
  /** Seed value to shift the base hue calculation, default 0 */
  seed?: number;
}

/**
 * Generates a harmonious color palette from a workspace identifier.
 * All colors share the same hue (derived from the identifier) but vary in
 * lightness and chroma to create visual hierarchy.
 *
 * Uses OKLCH color space for perceptually uniform color generation.
 * Chroma is calculated as a percentage of the maximum in-gamut chroma
 * for the given hue and lightness, ensuring consistent perceived
 * saturation across all hues.
 *
 * When theme colors are available, colors are blended toward them for better
 * visual integration with the active theme.
 *
 * @param options - Palette generation options
 * @returns A palette of hex color strings for the specified UI elements
 */
export function generatePalette(
  options: GeneratePaletteOptions
): PartialPatinaColorPalette {
  const {
    workspaceIdentifier,
    targets,
    themeContext,
    colorScheme = 'pastel',
    themeBlendFactor = 0.35,
    seed = 0,
  } = options;

  const workspaceHash = hashString(workspaceIdentifier);
  // Hash the seed and XOR with workspace hash for dramatic color shifts per seed
  const seedHash = seed !== 0 ? hashString(seed.toString()) : 0;
  const baseHue = ((workspaceHash ^ seedHash) >>> 0) % 360;

  const keysToInclude = new Set<keyof PatinaColorPalette>();
  for (const target of targets) {
    for (const key of TARGET_KEYS[target]) {
      keysToInclude.add(key);
    }
  }

  const schemeConfig = getSchemeConfig(colorScheme);
  const themeConfig = schemeConfig[themeContext.type];
  const palette: PartialPatinaColorPalette = {};

  for (const key of keysToInclude) {
    const config = themeConfig[key];

    // Apply hue offset for multi-hue schemes (duotone, analogous)
    const elementHue =
      (((baseHue + (config.hueOffset ?? 0)) % 360) + 360) % 360;

    // Calculate actual chroma using chromaFactor and max in-gamut chroma
    const maxC = maxChroma(config.lightness, elementHue);
    const chroma = maxC * config.chromaFactor;

    let oklch: OKLCH = {
      l: config.lightness,
      c: chroma,
      h: elementHue,
    };

    // Blend with theme color when available
    if (themeContext.colors) {
      const themeColor = getColorForKey(key, themeContext.colors);
      if (themeColor) {
        oklch = blendWithThemeOklch(oklch, themeColor, themeBlendFactor);
      }
    }

    palette[key] = oklchToHex(oklch);
  }

  return palette;
}
