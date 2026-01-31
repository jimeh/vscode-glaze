import type { OKLCH } from './types';
import type { ColorScheme, TintTarget } from '../config';
import type {
  ThemeColors,
  ThemeType,
  PaletteKey,
  ElementType,
  ColorType,
  PatinaColorPalette,
} from '../theme';
import { COLOR_KEY_DEFINITIONS, PATINA_MANAGED_KEYS } from '../theme';
import { getColorForKey } from '../theme/colors';
import { hashString } from './hash';
import { oklchToHex, maxChroma } from './convert';
import { blendWithThemeOklch } from './blend';
import { getSchemeConfig } from './schemes';
import type { TintColors } from '../statusBar/types';

// ============================================================================
// Types
// ============================================================================

/**
 * Detail for a single managed palette key within a tint computation.
 */
export interface TintKeyDetail {
  /** The palette key (e.g., 'titleBar.activeBackground') */
  readonly key: PaletteKey;
  /** UI element this color belongs to */
  readonly element: ElementType;
  /** Whether this is a background or foreground color */
  readonly colorType: ColorType;
  /** Pre-blend tint color as hex */
  readonly tintHex: string;
  /** Post-blend final color as hex */
  readonly finalHex: string;
  /** Theme color from the database, if available */
  readonly themeColor?: string;
  /** Effective blend factor for this key */
  readonly blendFactor: number;
  /** Whether the element's target is active */
  readonly enabled: boolean;
}

/**
 * Complete result of a tint computation for all managed keys.
 */
export interface TintResult {
  /** Computed base hue angle (0-359) */
  readonly baseHue: number;
  /** Display-only base tint hex (neutral L/C, no blending) */
  readonly baseTintHex: string;
  /** Detail for each of the 8 managed palette keys */
  readonly keys: readonly TintKeyDetail[];
}

/**
 * Options for computing a full tint result.
 *
 * Provide `baseHue` to skip hash computation (when hue is
 * already known), or `workspaceIdentifier` to compute it.
 * At least one must be provided.
 */
export interface ComputeTintOptions {
  /** Pre-computed base hue (skips hash when provided) */
  baseHue?: number;
  /** Workspace identifier for hue derivation */
  workspaceIdentifier?: string;
  /** Active tint targets (determines `enabled` flag per key) */
  targets: TintTarget[];
  /** Theme type for scheme config lookup */
  themeType: ThemeType;
  /** Color scheme, default 'pastel' */
  colorScheme?: ColorScheme;
  /** Theme colors for blending, if available */
  themeColors?: ThemeColors;
  /** How much to blend toward theme background (0-1), default 0.35 */
  themeBlendFactor?: number;
  /** Per-target blend factor overrides */
  targetBlendFactors?: Partial<Record<TintTarget, number>>;
  /** Seed for hue calculation, default 0 */
  seed?: number;
}

// ============================================================================
// Shared helpers
// ============================================================================

/**
 * Computes the base hue from a workspace identifier and seed.
 * Uses SHA-256 hash + XOR + mod 360.
 *
 * @param identifier - The workspace identifier string
 * @param seed - Seed value to shift the hue (0 = no shift)
 * @returns Hue angle in degrees (0-359)
 */
export function computeBaseHue(identifier: string, seed: number): number {
  const workspaceHash = hashString(identifier);
  const seedHash = seed !== 0 ? hashString(seed.toString()) : 0;
  return ((workspaceHash ^ seedHash) >>> 0) % 360;
}

/**
 * Applies a hue offset, wrapping to the 0-360 range.
 *
 * @param hue - Base hue angle
 * @param offset - Degrees to add (may be undefined or negative)
 * @returns Wrapped hue angle (0-360)
 */
export function applyHueOffset(hue: number, offset?: number): number {
  return (((hue + (offset ?? 0)) % 360) + 360) % 360;
}

/**
 * Computes a display-only base tint hex color for the given hue
 * and theme type. Uses neutral lightness/chroma values without
 * any scheme-specific tweaks or theme blending.
 *
 * @param baseHue - Hue angle (0-360)
 * @param themeType - Theme type for lightness selection
 * @returns Hex color string
 */
export function computeBaseTintHex(
  baseHue: number,
  themeType: ThemeType
): string {
  const lightness =
    themeType === 'light' || themeType === 'hcLight' ? 0.65 : 0.5;
  const chroma = maxChroma(lightness, baseHue) * 0.7;
  return oklchToHex({ l: lightness, c: chroma, h: baseHue });
}

/**
 * Unified tint computation for all 8 managed palette keys.
 *
 * Always computes every key; the `enabled` flag per-key indicates
 * whether the element's target is active. Consumers filter by
 * `enabled` as needed.
 *
 * @param options - Computation options
 * @returns Full TintResult with base hue, base tint hex, and
 *   per-key details
 * @throws If neither `baseHue` nor `workspaceIdentifier` is provided
 */
export function computeTint(options: ComputeTintOptions): TintResult {
  const {
    targets,
    themeType,
    colorScheme = 'pastel',
    themeColors,
    themeBlendFactor = 0.35,
    targetBlendFactors,
    seed = 0,
  } = options;

  // Resolve base hue
  let baseHue: number;
  if (options.baseHue !== undefined) {
    baseHue = options.baseHue;
  } else if (options.workspaceIdentifier !== undefined) {
    baseHue = computeBaseHue(options.workspaceIdentifier, seed);
  } else {
    throw new Error(
      'computeTint requires either baseHue or workspaceIdentifier'
    );
  }

  const baseTintHex = computeBaseTintHex(baseHue, themeType);
  const targetSet = new Set<string>(targets);
  const schemeConfig = getSchemeConfig(colorScheme);
  const themeConfig = schemeConfig[themeType];

  const keys: TintKeyDetail[] = PATINA_MANAGED_KEYS.map(
    (key: PaletteKey): TintKeyDetail => {
      const def = COLOR_KEY_DEFINITIONS[key];
      const config = themeConfig[key];
      const element = def.element as TintTarget;

      // Compute element hue with offset
      const elementHue = applyHueOffset(baseHue, config.hueOffset);

      // Compute OKLCH tint color (pre-blend)
      const maxC = maxChroma(config.lightness, elementHue);
      const chroma = maxC * config.chromaFactor;
      const tintOklch: OKLCH = {
        l: config.lightness,
        c: chroma,
        h: elementHue,
      };
      const tintHex = oklchToHex(tintOklch);

      // Look up theme color
      const themeColor = themeColors
        ? getColorForKey(key, themeColors)
        : undefined;

      // Resolve effective blend factor for this element
      const effectiveBlend = targetBlendFactors?.[element] ?? themeBlendFactor;

      // Compute final color (blend with theme if available)
      let finalHex: string;
      if (themeColor && effectiveBlend > 0) {
        const blendedOklch = blendWithThemeOklch(
          tintOklch,
          themeColor,
          effectiveBlend
        );
        finalHex = oklchToHex(blendedOklch);
      } else {
        finalHex = tintHex;
      }

      return {
        key,
        element: def.element,
        colorType: def.colorType,
        tintHex,
        finalHex,
        themeColor,
        blendFactor: effectiveBlend,
        enabled: targetSet.has(def.element),
      };
    }
  );

  return { baseHue, baseTintHex, keys };
}

// ============================================================================
// Convenience converters
// ============================================================================

/**
 * Converts a TintResult to a partial palette containing only
 * enabled keys. Drop-in replacement for generatePalette output.
 */
export function tintResultToPalette(
  result: TintResult
): Partial<PatinaColorPalette> {
  const palette: Partial<PatinaColorPalette> = {};
  for (const detail of result.keys) {
    if (detail.enabled) {
      palette[detail.key] = detail.finalHex;
    }
  }
  return palette;
}

/**
 * Extracts TintColors (status bar tooltip data) from a TintResult.
 * Picks background colors for titleBar, statusBar, and activityBar
 * from enabled keys.
 */
export function tintResultToStatusBarColors(result: TintResult): TintColors {
  const colors: TintColors = {
    baseTint: result.baseTintHex,
  };

  for (const detail of result.keys) {
    if (!detail.enabled || detail.colorType !== 'background') {
      continue;
    }
    switch (detail.key) {
      case 'titleBar.activeBackground':
        colors.titleBar = detail.finalHex;
        break;
      case 'statusBar.background':
        colors.statusBar = detail.finalHex;
        break;
      case 'activityBar.background':
        colors.activityBar = detail.finalHex;
        break;
    }
  }

  return colors;
}
