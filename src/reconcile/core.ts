import * as vscode from 'vscode';
import {
  computeTint,
  tintResultToPalette,
  tintResultToStatusBarColors,
} from '../color';
import { getWorkspaceIdentifier } from '../workspace';
import {
  getColorHarmony,
  getColorStyle,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  isEnabledForWorkspace,
} from '../config';
import { getThemeContext } from '../theme';
import {
  mergeColorCustomizations,
  removePatinaColors,
  hasPatinaColorsWithoutMarker,
  type ColorCustomizations,
} from '../settings';
import type { ReconcileOptions } from './types';
import { resetCachedState, updateCachedState, refreshStatusBar } from './state';

/**
 * Shallow-compare two optional records by key count and value
 * identity. Used to skip redundant config writes.
 */
function shallowEqualRecords(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const key of keysA) {
    if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/**
 * Write colorCustomizations with equality check and error
 * handling. The equality check prevents reconcile loops: after
 * Patina writes colors, the resulting config event triggers a
 * re-read that matches what was just written, so the write is
 * skipped.
 * Returns true on success (or if no write was needed).
 */
async function writeColorConfig(
  value: ColorCustomizations | undefined
): Promise<boolean> {
  // Re-read config to skip redundant writes. Normalize empty
  // objects to undefined since VS Code returns {} (Proxy) for
  // cleared config.
  const raw = vscode.workspace
    .getConfiguration()
    .get<ColorCustomizations>('workbench.colorCustomizations');
  const current = raw && Object.keys(raw).length > 0 ? raw : undefined;
  const normalized = value && Object.keys(value).length > 0 ? value : undefined;
  if (shallowEqualRecords(current, normalized)) {
    return true;
  }

  try {
    await vscode.workspace
      .getConfiguration()
      .update(
        'workbench.colorCustomizations',
        value,
        vscode.ConfigurationTarget.Workspace
      );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Patina] Failed to write color customizations:', err);
    updateCachedState({ lastError: message });
    await refreshStatusBar();
    return false;
  }
  return true;
}

/** Strip Patina colors from config and reset cached state. */
async function clearTintColors(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const existing = config.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );

  // Don't remove colors that Patina doesn't own.
  if (hasPatinaColorsWithoutMarker(existing)) {
    updateCachedState({
      workspaceIdentifier: undefined,
      tintColors: undefined,
      customizedOutsidePatina: true,
      lastError: undefined,
    });
    await refreshStatusBar();
    return;
  }

  const remaining = removePatinaColors(existing);
  if (await writeColorConfig(remaining)) {
    await resetCachedState();
  }
}

/** Compute and write tint colors to config. */
async function applyTintColors(
  identifier: string,
  tintConfig: ReturnType<typeof getTintConfig>,
  force: boolean
): Promise<void> {
  const themeConfig = getThemeConfig();
  const themeContext = await getThemeContext(tintConfig.mode);
  const colorStyle = getColorStyle();
  const colorHarmony = getColorHarmony();
  const tintResult = computeTint({
    baseHue:
      tintConfig.baseHueOverride !== null
        ? tintConfig.baseHueOverride
        : undefined,
    workspaceIdentifier: identifier,
    targets: tintConfig.targets,
    themeType: themeContext.tintType,
    colorStyle,
    colorHarmony,
    blendMethod: themeConfig.blendMethod,
    themeColors: themeContext.colors,
    themeBlendFactor: themeConfig.blendFactor,
    targetBlendFactors: themeConfig.targetBlendFactors,
    seed: tintConfig.seed,
  });
  const colors = tintResultToPalette(tintResult);

  const config = vscode.workspace.getConfiguration();
  const existing = config.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );

  // Guard: if managed colors exist but marker is absent, an
  // external tool or user has modified settings — refuse to
  // overwrite (unless force).
  if (!force && hasPatinaColorsWithoutMarker(existing)) {
    updateCachedState({
      workspaceIdentifier: identifier,
      customizedOutsidePatina: true,
    });
    await refreshStatusBar();
    return;
  }

  const merged = mergeColorCustomizations(existing, colors);
  if (await writeColorConfig(merged)) {
    updateCachedState({
      workspaceIdentifier: identifier,
      tintColors: tintResultToStatusBarColors(tintResult),
      customizedOutsidePatina: false,
      lastError: undefined,
    });
    await refreshStatusBar();
  }
}

/**
 * Unified apply/remove logic. Reads config fresh and decides
 * whether to apply or remove colors.
 */
export async function doReconcile(options?: ReconcileOptions): Promise<void> {
  const force = options?.force ?? false;
  const tintConfig = getTintConfig();

  if (!isEnabledForWorkspace() || tintConfig.targets.length === 0) {
    await clearTintColors();
    return;
  }

  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);
  if (!identifier) {
    await resetCachedState();
    return;
  }

  await applyTintColors(identifier, tintConfig, force);
}
