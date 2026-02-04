import type { TintTarget } from '../config';
import type { ThemeColors, ThemeType } from '../theme';
import type { ColorHarmony, ColorScheme } from '../color';
import type {
  StatusColorDetail,
  StatusGeneralInfo,
  StatusState,
} from './types';
import { computeBaseHue, computeTint } from '../color/tint';
import {
  getColorHarmony,
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
 * Options for computing status color details.
 */
export interface ComputeStatusColorsOptions {
  /** Computed base hue angle (0-359) */
  baseHue: number;
  /** Active color scheme */
  colorScheme: ColorScheme;
  /** Active color harmony */
  colorHarmony?: ColorHarmony;
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
    colorHarmony,
    themeType,
    themeColors,
    blendFactor,
    targetBlendFactors,
    targets,
  } = options;

  const result = computeTint({
    baseHue,
    targets,
    themeType,
    colorScheme,
    colorHarmony,
    themeColors,
    themeBlendFactor: blendFactor,
    targetBlendFactors,
  });

  return result.keys.map(
    (detail): StatusColorDetail => ({
      key: detail.key,
      element: detail.element,
      colorType: detail.colorType,
      themeColor: detail.themeColor,
      tintColor: detail.tintHex,
      finalColor: detail.finalHex,
      enabled: detail.enabled,
    })
  );
}

/**
 * Builds the complete status state by reading VSCode configuration
 * and computing all color details.
 *
 * @returns Complete StatusState for rendering the webview
 */
export async function buildStatusState(): Promise<StatusState> {
  const globalEnabled = isGloballyEnabled();
  const workspaceEnabled = getWorkspaceEnabledOverride();
  const tintConfig = getTintConfig();
  const themeConfig = getThemeConfig();
  const themeContext = await getThemeContext(tintConfig.mode);
  const colorScheme = getColorScheme();
  const colorHarmony = getColorHarmony();
  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);

  const isActive = isEnabledForWorkspace() && identifier !== undefined;
  const baseHue = identifier ? computeBaseHue(identifier, tintConfig.seed) : 0;

  const colors = computeStatusColors({
    baseHue,
    colorScheme,
    colorHarmony,
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
    osColorScheme: await detectOsColorScheme(),
    colorScheme,
    colorHarmony,
    blendFactor: themeConfig.blendFactor,
    targetBlendFactors: themeConfig.targetBlendFactors,
    seed: tintConfig.seed,
    baseHue,
    targets: tintConfig.targets,
    customizedOutsidePatina,
  };

  return { general, colors };
}
