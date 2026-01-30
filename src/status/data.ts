import type { TintTarget } from '../config';
import type { ThemeColors, ThemeType, PaletteKey } from '../theme';
import type { ColorScheme } from '../color';
import type {
  StatusColorDetail,
  StatusGeneralInfo,
  StatusState,
} from './types';
import { COLOR_KEY_DEFINITIONS, PATINA_MANAGED_KEYS } from '../theme';
import { getColorForKey } from '../theme/colors';
import { hashString } from '../color/hash';
import { oklchToHex, maxChroma } from '../color/convert';
import { blendWithThemeOklch } from '../color/blend';
import { getSchemeConfig } from '../color/schemes';
import {
  getColorScheme,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  isEnabledForWorkspace,
  isGloballyEnabled,
  getWorkspaceEnabledOverride,
} from '../config';
import * as vscode from 'vscode';
import {
  hasPatinaColorsWithoutMarker,
  type ColorCustomizations,
} from '../settings';
import { getThemeContext } from '../theme';
import { getWorkspaceIdentifier } from '../workspace';
import { detectOsColorScheme } from '../theme/osColorScheme';

/**
 * Computes the base hue from a workspace identifier and seed.
 * Replicates the hash + XOR + mod logic from generatePalette.
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
 * Options for computing status color details.
 */
export interface ComputeStatusColorsOptions {
  /** Computed base hue angle (0-359) */
  baseHue: number;
  /** Active color scheme */
  colorScheme: ColorScheme;
  /** Resolved theme type */
  themeType: ThemeType;
  /** Theme colors from the database, if available */
  themeColors: ThemeColors | undefined;
  /** Theme blend factor (0-1) */
  blendFactor: number;
  /** Per-target blend factor overrides */
  targetBlendFactors?: Partial<Record<TintTarget, number>>;
  /** Active tint targets */
  targets: TintTarget[];
}

/**
 * Computes color details for all 8 managed palette keys.
 *
 * For each key:
 * 1. Gets the ElementConfig from the scheme
 * 2. Computes the OKLCH tint color (pre-blend)
 * 3. Looks up the theme color if available
 * 4. Computes the final blended color
 * 5. Determines if the element is enabled
 *
 * @returns Array of StatusColorDetail for all managed keys
 */
export function computeStatusColors(
  options: ComputeStatusColorsOptions
): StatusColorDetail[] {
  const {
    baseHue,
    colorScheme,
    themeType,
    themeColors,
    blendFactor,
    targetBlendFactors,
    targets,
  } = options;

  const targetSet = new Set<string>(targets);
  const schemeConfig = getSchemeConfig(colorScheme);
  const themeConfig = schemeConfig[themeType];

  return PATINA_MANAGED_KEYS.map((key: PaletteKey): StatusColorDetail => {
    const def = COLOR_KEY_DEFINITIONS[key];
    const config = themeConfig[key];

    // Compute element hue with offset
    const elementHue =
      (((baseHue + (config.hueOffset ?? 0)) % 360) + 360) % 360;

    // Compute OKLCH tint
    const maxC = maxChroma(config.lightness, elementHue);
    const chroma = maxC * config.chromaFactor;
    const tintOklch = {
      l: config.lightness,
      c: chroma,
      h: elementHue,
    };
    const tintColor = oklchToHex(tintOklch);

    // Look up theme color
    const themeColor = themeColors
      ? getColorForKey(key, themeColors)
      : undefined;

    // Resolve effective blend factor for this element
    const effectiveBlend =
      targetBlendFactors?.[def.element as TintTarget] ?? blendFactor;

    // Compute final color (blend with theme if available)
    let finalColor: string;
    if (themeColor && effectiveBlend > 0) {
      const blendedOklch = blendWithThemeOklch(
        tintOklch,
        themeColor,
        effectiveBlend
      );
      finalColor = oklchToHex(blendedOklch);
    } else {
      finalColor = tintColor;
    }

    return {
      key,
      element: def.element,
      colorType: def.colorType,
      themeColor,
      tintColor,
      finalColor,
      enabled: targetSet.has(def.element),
    };
  });
}

/**
 * Builds the complete status state by reading VSCode configuration
 * and computing all color details.
 *
 * @returns Complete StatusState for rendering the webview
 */
export function buildStatusState(): StatusState {
  const globalEnabled = isGloballyEnabled();
  const workspaceEnabled = getWorkspaceEnabledOverride();
  const tintConfig = getTintConfig();
  const themeConfig = getThemeConfig();
  const themeContext = getThemeContext(tintConfig.mode);
  const colorScheme = getColorScheme();
  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);

  const isActive = isEnabledForWorkspace() && identifier !== undefined;
  const baseHue = identifier ? computeBaseHue(identifier, tintConfig.seed) : 0;

  const colors = computeStatusColors({
    baseHue,
    colorScheme,
    themeType: themeContext.tintType,
    themeColors: themeContext.colors,
    blendFactor: themeConfig.blendFactor,
    targetBlendFactors: themeConfig.targetBlendFactors,
    targets: tintConfig.targets,
  });

  const wbConfig = vscode.workspace.getConfiguration();
  const existing = wbConfig.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );
  const customizedOutsidePatina = hasPatinaColorsWithoutMarker(existing);

  const general: StatusGeneralInfo = {
    active: isActive,
    globalEnabled,
    workspaceEnabled,
    workspaceIdentifier: identifier,
    themeName: themeContext.name,
    themeType: themeContext.type,
    tintType: themeContext.tintType,
    themeAutoDetected: themeContext.isAutoDetected,
    themeColorsAvailable: themeContext.colors !== undefined,
    osColorScheme: detectOsColorScheme(),
    colorScheme,
    blendFactor: themeConfig.blendFactor,
    targetBlendFactors: themeConfig.targetBlendFactors,
    seed: tintConfig.seed,
    baseHue,
    targets: tintConfig.targets,
    customizedOutsidePatina,
  };

  return { general, colors };
}
