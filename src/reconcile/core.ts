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
  removeGlazeColors,
  hasGlazeColorsWithoutMarker,
  type ColorCustomizations,
} from '../settings';
import type { ReconcileOptions } from './types';
import { resetCachedState, updateCachedState, refreshStatusBar } from './state';
import { reconcileGuardCheck, reconcileGuardRecordWrite } from './guard';

/**
 * Deep-compare two optional records, recursing one level into
 * nested objects (for theme-scoped blocks). Used to skip
 * redundant config writes.
 */
function deepEqualRecords(
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
    const va = a[key];
    const vb = b[key];
    if (va === vb) {
      continue;
    }
    // Recurse one level for theme-scoped blocks (plain objects)
    if (
      typeof va === 'object' &&
      va !== null &&
      typeof vb === 'object' &&
      vb !== null &&
      !Array.isArray(va) &&
      !Array.isArray(vb)
    ) {
      const objA = va as Record<string, unknown>;
      const objB = vb as Record<string, unknown>;
      const innerKeysA = Object.keys(objA);
      const innerKeysB = Object.keys(objB);
      if (innerKeysA.length !== innerKeysB.length) {
        return false;
      }
      for (const innerKey of innerKeysA) {
        if (objA[innerKey] !== objB[innerKey]) {
          return false;
        }
      }
      continue;
    }
    return false;
  }
  return true;
}

/**
 * Write colorCustomizations with equality check and error
 * handling. The equality check prevents reconcile loops: after
 * Glaze writes colors, the resulting config event triggers a
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
  if (deepEqualRecords(current, normalized)) {
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
    console.error('[Glaze] Failed to write color customizations:', err);
    updateCachedState({ lastError: message });
    await refreshStatusBar();
    return false;
  }
  reconcileGuardRecordWrite();
  return true;
}

/** Strip Glaze colors from config and reset cached state. */
async function clearTintColors(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const existing = config.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );

  // Don't remove colors that Glaze doesn't own.
  if (hasGlazeColorsWithoutMarker(existing)) {
    updateCachedState({
      workspaceIdentifier: undefined,
      tintColors: undefined,
      customizedOutsideGlaze: true,
      lastError: undefined,
    });
    await refreshStatusBar();
    return;
  }

  const remaining = removeGlazeColors(existing);
  // Use empty object instead of undefined when all Glaze colors are
  // removed. Passing undefined to config.update() removes the key
  // entirely, which can leave the file with stray commas (e.g.
  // "{ , }") when the file had trailing commas. Writing {} updates
  // the value in-place, avoiding the VS Code JSONC serialization bug.
  if (await writeColorConfig(remaining ?? {})) {
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

  const themeName = themeContext.name;

  // Guard: if managed colors exist but marker is absent, an
  // external tool or user has modified settings — refuse to
  // overwrite (unless force).
  if (!force && hasGlazeColorsWithoutMarker(existing, themeName)) {
    updateCachedState({
      workspaceIdentifier: identifier,
      customizedOutsideGlaze: true,
    });
    await refreshStatusBar();
    return;
  }

  // Theme name is required for scoped writes. If it cannot be
  // determined (extremely unlikely), skip rather than writing
  // unscoped colors.
  if (!themeName) {
    console.warn(
      '[Glaze] Unable to determine active theme name; skipping color write.'
    );
    return;
  }

  const merged = mergeColorCustomizations(existing, colors, themeName);
  if (await writeColorConfig(merged)) {
    updateCachedState({
      workspaceIdentifier: identifier,
      tintColors: tintResultToStatusBarColors(tintResult),
      customizedOutsideGlaze: false,
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

  // Rate-limit guard: bail if the reconcile loop is running
  // too frequently (e.g. another extension is ping-ponging
  // config writes). Force-flagged runs always bypass.
  if (!(await reconcileGuardCheck(force))) {
    return;
  }

  const tintConfig = getTintConfig();

  if (!isEnabledForWorkspace() || tintConfig.targets.length === 0) {
    await clearTintColors();
    return;
  }

  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = await getWorkspaceIdentifier(identifierConfig);
  if (!identifier) {
    await resetCachedState();
    return;
  }

  await applyTintColors(identifier, tintConfig, force);
}
