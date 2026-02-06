import * as vscode from 'vscode';
import {
  computeTint,
  tintResultToPalette,
  tintResultToStatusBarColors,
} from './color';
import { getWorkspaceIdentifier } from './workspace';
import {
  getColorHarmony,
  getColorStyle,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  isEnabledForWorkspace,
  isGloballyEnabled,
  getWorkspaceEnabledOverride,
  setEnabledForWorkspace,
} from './config';
import { getThemeContext } from './theme';
import {
  mergeColorCustomizations,
  removePatinaColors,
  hasPatinaColorsWithoutMarker,
  ColorCustomizations,
} from './settings';
import {
  StatusBarManager,
  type StatusBarState,
  type TintColors,
} from './statusBar';
import { PalettePreviewPanel } from './preview';
import { StatusPanel } from './status';

let statusBar: StatusBarManager;

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

/** Debounce delay in ms for reconcile operations. */
const DEBOUNCE_MS = 75;

interface ReconcileOptions {
  force?: boolean;
}

/**
 * Cached values from the last reconcile for cheap status bar
 * refreshes.
 */
interface CachedTintState {
  workspaceIdentifier: string | undefined;
  tintColors: TintColors | undefined;
  customizedOutsidePatina: boolean;
  lastError?: string;
}

let cached: CachedTintState = {
  workspaceIdentifier: undefined,
  tintColors: undefined,
  customizedOutsidePatina: false,
};

// --- Serialized reconcile state ---

/** Promise chain ensuring only one reconcile runs at a time. */
let reconcileChain: Promise<void> = Promise.resolve();

/** Debounce timer for requestReconcile(). */
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

/** Sticky force flag — once set, persists until consumed. */
let pendingForce = false;

/**
 * Request a reconcile. Resets the debounce timer; the actual
 * reconcile is enqueued onto the promise chain after the delay.
 * The force flag is sticky: once set during a debounce window it
 * persists until the reconcile consumes it.
 */
function requestReconcile(options?: ReconcileOptions): void {
  if (options?.force) {
    pendingForce = true;
  }
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    const force = pendingForce;
    pendingForce = false;
    reconcileChain = reconcileChain.then(() =>
      doReconcile({ force }).catch((err) =>
        console.error('[Patina] reconcile error:', err)
      )
    );
  }, DEBOUNCE_MS);
}

/** Reset cached state to empty and refresh the status bar. */
async function resetCachedState(): Promise<void> {
  cached = {
    workspaceIdentifier: undefined,
    tintColors: undefined,
    customizedOutsidePatina: false,
    lastError: undefined,
  };
  await refreshStatusBar();
}

/**
 * Write colorCustomizations with equality check and error handling.
 * The equality check prevents reconcile loops: after Patina writes
 * colors, the resulting config event triggers a re-read that matches
 * what was just written, so the write is skipped.
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
    cached = { ...cached, lastError: message };
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
    await resetCachedState();
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
    cached = { ...cached, customizedOutsidePatina: true };
    await refreshStatusBar();
    return;
  }

  const merged = mergeColorCustomizations(existing, colors);
  if (await writeColorConfig(merged)) {
    cached = {
      workspaceIdentifier: identifier,
      tintColors: tintResultToStatusBarColors(tintResult),
      customizedOutsidePatina: false,
      lastError: undefined,
    };
    await refreshStatusBar();
  }
}

/**
 * Unified apply/remove logic. Reads config fresh and decides
 * whether to apply or remove colors.
 */
async function doReconcile(options?: ReconcileOptions): Promise<void> {
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

export async function activate(context: vscode.ExtensionContext) {
  statusBar = new StatusBarManager();
  context.subscriptions.push(statusBar);

  // Apply tint on activation
  requestReconcile();

  context.subscriptions.push(
    vscode.commands.registerCommand('patina.copyColor', (hex: string) => {
      vscode.env.clipboard.writeText(hex);
      vscode.window.showInformationMessage(`Copied ${hex} to clipboard`);
    }),
    vscode.commands.registerCommand('patina.enableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('patina.disableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', false, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('patina.enableWorkspace', async () => {
      await setEnabledForWorkspace(true);
    }),
    vscode.commands.registerCommand('patina.disableWorkspace', async () => {
      await setEnabledForWorkspace(false);
    }),
    vscode.commands.registerCommand('patina.showColorPreview', () => {
      PalettePreviewPanel.show(context.extensionUri);
    }),
    vscode.commands.registerCommand('patina.showStatus', () => {
      StatusPanel.show(context.extensionUri);
    }),
    vscode.commands.registerCommand('patina.seedMenu', async () => {
      const { seed } = getTintConfig();
      const items: vscode.QuickPickItem[] = [
        {
          label: '$(refresh) Randomize Seed',
          description: 'Generate a new random seed',
        },
      ];
      if (seed !== 0) {
        items.push({
          label: '$(discard) Reset Seed',
          description: 'Reset seed to default (0)',
        });
      }
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: `Seed: ${seed}`,
      });
      if (!selected) {
        return;
      }
      if (selected.label === '$(refresh) Randomize Seed') {
        await vscode.commands.executeCommand('patina.randomizeSeed');
      } else if (selected.label === '$(discard) Reset Seed') {
        await vscode.commands.executeCommand('patina.resetSeed');
      }
    }),
    vscode.commands.registerCommand('patina.randomizeSeed', async () => {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        seed,
        vscode.ConfigurationTarget.Workspace
      );
      // Refresh status bar immediately so the tooltip reflects the
      // new seed without waiting for the debounced config listener.
      await refreshStatusBar();
    }),
    vscode.commands.registerCommand('patina.resetSeed', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      await refreshStatusBar();
    }),
    vscode.commands.registerCommand('patina.forceApply', () => {
      requestReconcile({ force: true });
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      // React to colorCustomizations changes. The equality check
      // in writeColorConfig prevents loops — if Patina just wrote
      // these colors, the re-read will match and skip the write.
      if (e.affectsConfiguration('workbench.colorCustomizations')) {
        requestReconcile();
        return;
      }
      // Handle VS Code theme changes
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
        e.affectsConfiguration('workbench.preferredLightColorTheme')
      ) {
        requestReconcile();
        return;
      }
      if (e.affectsConfiguration('patina.statusBar.enabled')) {
        statusBar.updateVisibility();
        return;
      }
      if (e.affectsConfiguration('patina.enabled')) {
        requestReconcile();
        return;
      }
      if (
        e.affectsConfiguration('patina.workspaceIdentifier') ||
        e.affectsConfiguration('patina.tint') ||
        e.affectsConfiguration('patina.theme') ||
        e.affectsConfiguration('patina.elements')
      ) {
        requestReconcile();
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      requestReconcile();
    })
  );
}

/**
 * Re-reads config and updates the status bar using cached
 * workspace identifier and tint colors from the last
 * apply/remove.
 */
async function refreshStatusBar(): Promise<void> {
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
    hasActiveTargets: tintConfig.targets.length > 0,
    tintColors: cached.tintColors,
    customizedOutsidePatina: cached.customizedOutsidePatina,
    lastError: cached.lastError,
  };

  statusBar.update(state);
}

export function deactivate() {
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
    debounceTimer = undefined;
  }
}
