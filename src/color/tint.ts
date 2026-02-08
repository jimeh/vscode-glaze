import { DEFAULT_BLEND_FACTOR } from '../config';
import type { ColorHarmony, ColorStyle, TintTarget } from '../config';
import type {
  ThemeColors,
  ThemeType,
  PaletteKey,
  ElementType,
  ColorType,
  PatinaColorPalette,
} from '../theme';
import {
  COLOR_KEY_DEFINITIONS,
  PATINA_MANAGED_KEYS,
  EXCLUDE_WHEN_UNDEFINED_KEYS,
} from '../theme';
import { getColorForKey } from '../theme/colors';
import { hashString } from './hash';
import { oklchToHex, maxChroma } from './convert';
import { getBlendFunction } from './blend';
import type { BlendMethod } from './blend';
import { getStyleResolver } from './styles';
import type { StyleResolveContext } from './styles';
import { HARMONY_CONFIGS } from './harmony';
import { applyHueOffset } from './hue';
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
  readonly themeColor?: string | undefined;
  /** Effective blend factor for this key */
  readonly blendFactor: number;
  /** Whether the element's target is active */
  readonly enabled: boolean;
  /**
   * Whether this key should be excluded from colorCustomizations
   * because the theme doesn't explicitly define it.
   */
  readonly excluded: boolean;
}

/**
 * Complete result of a tint computation for all managed keys.
 */
export interface TintResult {
  /** Computed base hue angle (0-359) */
  readonly baseHue: number;
  /** Display-only base tint hex (neutral L/C, no blending) */
  readonly baseTintHex: string;
  /** Detail for each managed palette key */
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
  baseHue?: number | undefined;
  /** Workspace identifier for hue derivation */
  workspaceIdentifier?: string | undefined;
  /** Active tint targets (determines `enabled` flag per key) */
  targets: TintTarget[];
  /** Theme type for style config lookup */
  themeType: ThemeType;
  /** Color style, default 'pastel' */
  colorStyle?: ColorStyle | undefined;
  /** Color harmony for hue distribution, default 'uniform' */
  colorHarmony?: ColorHarmony | undefined;
  /** Blend method for theme color blending, default 'overlay' */
  blendMethod?: BlendMethod | undefined;
  /** Theme colors for blending, if available */
  themeColors?: ThemeColors | undefined;
  /** How much to blend toward theme background (0-1) */
  themeBlendFactor?: number | undefined;
  /** Per-target blend factor overrides */
  targetBlendFactors?: Partial<Record<TintTarget, number>> | undefined;
  /** Seed for hue calculation, default 0 */
  seed?: number | undefined;
}

// ============================================================================
// Constants
// ============================================================================

/** Lightness for base tint preview in light themes (OKLCH L). */
const BASE_TINT_LIGHTNESS_LIGHT = 0.65;

/** Lightness for base tint preview in dark themes (OKLCH L). */
const BASE_TINT_LIGHTNESS_DARK = 0.5;

/** Fraction of max in-gamut chroma used for base tint preview. */
const BASE_TINT_CHROMA_FACTOR = 0.7;

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

// Re-export from leaf module to preserve public API.
export { applyHueOffset } from './hue';

/**
 * Computes a display-only base tint hex color for the given hue
 * and theme type. Uses neutral lightness/chroma values without
 * any style-specific tweaks or theme blending.
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
    themeType === 'light' || themeType === 'hcLight'
      ? BASE_TINT_LIGHTNESS_LIGHT
      : BASE_TINT_LIGHTNESS_DARK;
  const chroma = maxChroma(lightness, baseHue) * BASE_TINT_CHROMA_FACTOR;
  return oklchToHex({ l: lightness, c: chroma, h: baseHue });
}

// ============================================================================
// Main computation
// ============================================================================

/**
 * Unified tint computation for all managed palette keys.
 *
 * Always computes every key; the `enabled` flag per-key indicates
 * whether the element's target is active. Consumers filter by
 * `enabled` as needed.
 *
 * The blend method determines how tint and theme colors are mixed:
 * - **overlay**: Alpha compositing in linear sRGB space for colors
 *   that stay closer to the original theme.
 * - **hueShift**: OKLCH interpolation with directed hue blending.
 *   A majority hue direction is pre-calculated from the base hue
 *   against background theme colors to prevent split-direction
 *   artifacts.
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
    colorStyle = 'pastel',
    colorHarmony = 'uniform',
    blendMethod = 'overlay',
    themeColors,
    themeBlendFactor = DEFAULT_BLEND_FACTOR,
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
  const resolver = getStyleResolver(colorStyle);
  const harmonyConfig = HARMONY_CONFIGS[colorHarmony];

  const blend = getBlendFunction(blendMethod, { baseHue, themeColors });

  const keys: TintKeyDetail[] = PATINA_MANAGED_KEYS.map(
    (key: PaletteKey): TintKeyDetail => {
      const def = COLOR_KEY_DEFINITIONS[key];
      const element = def.element as TintTarget;

      // Pre-apply harmony hue offset for this element
      const elementHue = applyHueOffset(baseHue, harmonyConfig[def.element]);

      // Build per-key resolve context with offset-adjusted hue
      const resolveContext: StyleResolveContext = {
        themeColors,
        elementHue,
      };

      // Resolve tint color via style resolver
      const { tintOklch, hueOnlyBlend } = resolver(
        themeType,
        key,
        resolveContext
      );
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
        finalHex = blend(
          tintOklch,
          tintHex,
          themeColor,
          effectiveBlend,
          hueOnlyBlend
        );
      } else {
        finalHex = tintHex;
      }

      // Exclude keys the theme doesn't explicitly define
      const excluded =
        EXCLUDE_WHEN_UNDEFINED_KEYS.has(key) &&
        (!themeColors || themeColors[key] === undefined);

      return {
        key,
        element: def.element,
        colorType: def.colorType,
        tintHex,
        finalHex,
        themeColor,
        blendFactor: effectiveBlend,
        enabled: targetSet.has(def.element),
        excluded,
      };
    }
  );

  return { baseHue, baseTintHex, keys };
}

// ============================================================================
// Status bar color mapping
// ============================================================================

/**
 * Set of primary background palette keys for TintColors extraction.
 * Derived from COLOR_KEY_DEFINITIONS: picks the first background key
 * per non-editor element.
 */
const STATUS_BAR_BG_KEYS: ReadonlySet<PaletteKey> = (() => {
  const seen = new Set<string>();
  const keys = new Set<PaletteKey>();
  for (const key of PATINA_MANAGED_KEYS) {
    const def = COLOR_KEY_DEFINITIONS[key];
    if (def.colorType === 'background' && !seen.has(def.element)) {
      seen.add(def.element);
      keys.add(key);
    }
  }
  return keys;
})();

// ============================================================================
// Convenience converters
// ============================================================================

/**
 * Converts a TintResult to a partial palette containing only
 * enabled keys.
 */
export function tintResultToPalette(
  result: TintResult
): Partial<PatinaColorPalette> {
  const palette: Partial<PatinaColorPalette> = {};
  for (const detail of result.keys) {
    if (detail.enabled && !detail.excluded) {
      palette[detail.key] = detail.finalHex;
    }
  }
  return palette;
}

/**
 * Extracts TintColors (status bar tooltip data) from a TintResult.
 * Picks the primary background color for each non-editor element
 * from enabled keys, derived from COLOR_KEY_DEFINITIONS.
 */
export function tintResultToStatusBarColors(result: TintResult): TintColors {
  const colors: TintColors = {
    baseTint: result.baseTintHex,
  };

  for (const detail of result.keys) {
    if (
      !detail.enabled ||
      detail.colorType !== 'background' ||
      !STATUS_BAR_BG_KEYS.has(detail.key)
    ) {
      continue;
    }
    colors[detail.element as keyof Omit<TintColors, 'baseTint'>] =
      detail.finalHex;
  }

  return colors;
}
