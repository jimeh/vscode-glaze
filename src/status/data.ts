import type { StatusGeneralInfo, StatusState } from './types';
import { computeBaseHue, computeTint } from '../color/tint';
import {
  getColorHarmony,
  getColorStyle,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  isGloballyEnabled,
  getWorkspaceEnabledOverride,
} from '../config';
import * as vscode from 'vscode';
import {
  hasGlazeColorsWithoutMarker,
  type ColorCustomizations,
} from '../settings';
import { isTintActive } from '../statusBar/helpers';
import { getThemeContext } from '../theme';
import { getWorkspaceIdentifier } from '../workspace';
import { detectOsColorScheme } from '../theme/osColorScheme';

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
  const colorStyle = getColorStyle();
  const colorHarmony = getColorHarmony();
  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);

  const isActive = isTintActive(
    globalEnabled,
    workspaceEnabled,
    identifier,
    tintConfig.targets.length > 0
  );
  const baseHue =
    tintConfig.baseHueOverride !== null
      ? tintConfig.baseHueOverride
      : identifier
        ? computeBaseHue(identifier, tintConfig.seed)
        : 0;

  const result = computeTint({
    baseHue,
    targets: tintConfig.targets,
    themeType: themeContext.tintType,
    colorStyle,
    colorHarmony,
    themeColors: themeContext.colors,
    blendMethod: themeConfig.blendMethod,
    themeBlendFactor: themeConfig.blendFactor,
    targetBlendFactors: themeConfig.targetBlendFactors,
  });

  const wbConfig = vscode.workspace.getConfiguration();
  const existing = wbConfig.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );
  const customizedOutsideGlaze = hasGlazeColorsWithoutMarker(
    existing,
    themeContext.name
  );

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
    colorStyle,
    colorHarmony,
    blendFactor: themeConfig.blendFactor,
    targetBlendFactors: themeConfig.targetBlendFactors,
    seed: tintConfig.seed,
    baseHueOverride: tintConfig.baseHueOverride,
    baseHue,
    targets: tintConfig.targets,
    customizedOutsideGlaze,
  };

  return { general, colors: result.keys };
}
