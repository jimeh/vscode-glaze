import { DEFAULT_BLEND_FACTOR } from '../config';
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
import { hexToOklch, oklchToHex, maxChroma } from './convert';
import {
  blendWithThemeOklch,
  blendHueOnlyOklch,
  blendWithThemeOklchDirected,
  blendHueOnlyOklchDirected,
  getHueBlendDirection,
} from './blend';
import type { HueBlendDirection } from './blend';
import { getSchemeResolver } from './schemes';
import type { SchemeResolveContext } from './schemes';
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
  /** How much to blend toward theme background (0-1) */
  themeBlendFactor?: number;
  /** Per-target blend factor overrides */
  targetBlendFactors?: Partial<Record<TintTarget, number>>;
  /** Seed for hue calculation, default 0 */
  seed?: number;
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
    themeType === 'light' || themeType === 'hcLight'
      ? BASE_TINT_LIGHTNESS_LIGHT
      : BASE_TINT_LIGHTNESS_DARK;
  const chroma = maxChroma(lightness, baseHue) * BASE_TINT_CHROMA_FACTOR;
  return oklchToHex({ l: lightness, c: chroma, h: baseHue });
}

// ============================================================================
// Hue direction harmonization
// ============================================================================

/**
 * Ensures all blended keys shift hue in the same direction around
 * the color wheel.
 *
 * When theme backgrounds have slightly different hues, shortest-path
 * blending can send some elements clockwise and others counter-
 * clockwise, producing jarring mismatches (e.g., one element turns
 * green while the rest turn orange). This function detects the
 * majority blend direction among background colors and re-blends
 * any outliers to match. Foreground colors follow the direction
 * chosen for their element's background.
 *
 * If all directions already agree, the keys are returned unchanged.
 *
 * @param keys - Initial blended key details
 * @param hueOnlyFlags - Parallel array indicating hueOnly blending
 * @returns Keys with harmonized hue directions
 */
function harmonizeHueDirections(
  keys: readonly TintKeyDetail[],
  hueOnlyFlags: readonly boolean[]
): readonly TintKeyDetail[] {
  // Collect hue blend directions for background keys that were
  // actually blended (have a theme color and non-zero factor).
  const bgDirections: Array<{
    index: number;
    element: ElementType;
    direction: 'cw' | 'ccw';
  }> = [];

  for (let i = 0; i < keys.length; i++) {
    const detail = keys[i];
    if (
      detail.colorType !== 'background' ||
      !detail.themeColor ||
      detail.blendFactor <= 0
    ) {
      continue;
    }
    const tintHue = hexToOklch(detail.tintHex).h;
    const themeHue = hexToOklch(detail.themeColor).h;
    bgDirections.push({
      index: i,
      element: detail.element,
      direction: getHueBlendDirection(tintHue, themeHue),
    });
  }

  // Nothing to harmonize if fewer than 2 blended backgrounds.
  if (bgDirections.length < 2) {
    return keys;
  }

  const cwCount = bgDirections.filter((d) => d.direction === 'cw').length;
  const ccwCount = bgDirections.length - cwCount;

  // All backgrounds already agree — nothing to do.
  if (cwCount === 0 || ccwCount === 0) {
    return keys;
  }

  // Pick majority direction; break ties toward clockwise for
  // deterministic results.
  const majorityDir: HueBlendDirection = cwCount >= ccwCount ? 'cw' : 'ccw';

  // Build a set of elements whose backgrounds need re-blending.
  const elementsToFix = new Set<ElementType>();
  for (const bg of bgDirections) {
    if (bg.direction !== majorityDir) {
      elementsToFix.add(bg.element);
    }
  }

  // Re-blend affected keys (both bg and fg for those elements).
  return keys.map((detail, i) => {
    if (!elementsToFix.has(detail.element)) {
      return detail;
    }
    if (!detail.themeColor || detail.blendFactor <= 0) {
      return detail;
    }

    const tintOklch = hexToOklch(detail.tintHex);
    const blendFn = hueOnlyFlags[i]
      ? blendHueOnlyOklchDirected
      : blendWithThemeOklchDirected;
    const blendedOklch = blendFn(
      tintOklch,
      detail.themeColor,
      detail.blendFactor,
      majorityDir
    );

    return { ...detail, finalHex: oklchToHex(blendedOklch) };
  });
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
 * After computing each key's blended color, a harmonization pass
 * ensures all elements blend hue in the same direction around the
 * color wheel. See {@link harmonizeHueDirections}.
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
  const resolver = getSchemeResolver(colorScheme);
  const resolveContext: SchemeResolveContext = { themeColors, baseHue };

  // First pass: compute each key with shortest-path hue blending.
  // Track hueOnlyBlend per key for the harmonization re-blend.
  const hueOnlyFlags: boolean[] = [];

  const keys: TintKeyDetail[] = PATINA_MANAGED_KEYS.map(
    (key: PaletteKey): TintKeyDetail => {
      const def = COLOR_KEY_DEFINITIONS[key];
      const element = def.element as TintTarget;

      // Resolve tint color via scheme resolver
      const { tintOklch, hueOnlyBlend } = resolver(
        themeType,
        key,
        resolveContext
      );
      hueOnlyFlags.push(hueOnlyBlend);
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
        const blendFn = hueOnlyBlend ? blendHueOnlyOklch : blendWithThemeOklch;
        const blendedOklch = blendFn(tintOklch, themeColor, effectiveBlend);
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

  // Second pass: harmonize hue blend directions so all elements
  // shift the same way around the color wheel.
  const harmonized = harmonizeHueDirections(keys, hueOnlyFlags);

  return { baseHue, baseTintHex, keys: harmonized };
}

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
      case 'sideBar.background':
        colors.sideBar = detail.finalHex;
        break;
    }
  }

  return colors;
}
