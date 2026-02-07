import {
  getColorHarmony,
  getColorStyle,
  getTintConfig,
  getWorkspaceEnabledOverride,
  isGloballyEnabled,
} from '../config';
import { getCachedState } from '../reconcile';
import { getThemeContext } from '../theme';
import type { StatusBarManager } from './manager';
import type { StatusBarState } from './types';

/**
 * Re-reads config and updates the status bar using cached
 * workspace identifier and tint colors from the last
 * apply/remove.
 */
export async function refreshStatusBar(
  statusBar: StatusBarManager
): Promise<void> {
  const cached = getCachedState();
  const tintConfig = getTintConfig();
  const themeContext = await getThemeContext(tintConfig.mode);

  const state: StatusBarState = {
    globalEnabled: isGloballyEnabled(),
    workspaceEnabledOverride: getWorkspaceEnabledOverride(),
    workspaceIdentifier: cached.workspaceIdentifier,
    themeName: themeContext.name,
    tintType: themeContext.tintType,
    themeAutoDetected: themeContext.isAutoDetected,
    colorStyle: getColorStyle(),
    colorHarmony: getColorHarmony(),
    seed: tintConfig.seed,
    baseHueOverride: tintConfig.baseHueOverride,
    hasActiveTargets: tintConfig.targets.length > 0,
    tintColors: cached.tintColors,
    customizedOutsidePatina: cached.customizedOutsidePatina,
    lastError: cached.lastError,
  };

  statusBar.update(state);
}
