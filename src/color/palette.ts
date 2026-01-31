import type { ColorScheme, TintTarget } from '../config';
import type { ThemeContext, PatinaColorPalette } from '../theme';
import type { ThemeType } from '../theme';
import {
  computeBaseHue,
  computeBaseTintHex,
  computeTint,
  tintResultToPalette,
} from './tint';

/**
 * Partial palette containing only the requested tint targets.
 */
export type PartialPatinaColorPalette = Partial<PatinaColorPalette>;

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
  /** Per-target blend factor overrides */
  targetBlendFactors?: Partial<Record<TintTarget, number>>;
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
    targetBlendFactors,
    seed = 0,
  } = options;

  const result = computeTint({
    workspaceIdentifier,
    targets,
    themeType: themeContext.tintType,
    colorScheme,
    themeColors: themeContext.colors,
    themeBlendFactor,
    targetBlendFactors,
    seed,
  });

  return tintResultToPalette(result);
}

/**
 * Options for calculating the base tint color.
 */
export interface CalculateBaseTintOptions {
  /** A string identifying the workspace */
  workspaceIdentifier: string;
  /** The theme type (light/dark/hcLight/hcDark) */
  themeType: ThemeType;
  /** Seed value to shift the base hue calculation, default 0 */
  seed?: number;
}

/**
 * Calculates the base tint color for a workspace before per-element tweaks.
 * Uses a neutral lightness/chroma that represents the "source" hue.
 *
 * @deprecated Use computeTint() directly — it includes baseTintHex.
 * @param options - Base tint calculation options
 * @returns Hex color string representing the base tint
 */
export function calculateBaseTint(options: CalculateBaseTintOptions): string {
  const { workspaceIdentifier, themeType, seed = 0 } = options;
  const hue = computeBaseHue(workspaceIdentifier, seed);
  return computeBaseTintHex(hue, themeType);
}
