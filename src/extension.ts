import * as vscode from 'vscode';
import {
  computeTint,
  tintResultToPalette,
  tintResultToStatusBarColors,
} from './color';
import { getWorkspaceIdentifier } from './workspace';
import {
  getColorScheme,
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
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
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

// --- Reconcile scheduler ---

/** Monotonic counter bumped on every scheduleReconcile(). */
let reconcileEpoch = 0;

/** Epoch active for the current reconcile run. */
let activeEpoch = 0;

/** Debounce timer for scheduleReconcile(). */
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

/** Whether a reconcile run is pending. */
let pending = false;

/** Whether any pending reconcile should force apply. */
let pendingForce = false;

/** Whether a reconcile run is currently in flight. */
let inFlight = false;

/** Returns true if the active reconcile run is stale. */
function isStale(): boolean {
  return activeEpoch !== reconcileEpoch;
}

/**
 * Request a reconcile. Marks pending, updates epoch, resets debounce
 * timer. The actual worker is invoked after the debounce delay.
 */
function scheduleReconcile(options?: ReconcileOptions): void {
  if (options?.force) {
    pendingForce = true;
  }
  pending = true;
  reconcileEpoch++;
  if (debounceTimer !== undefined) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    void runReconcile();
  }, DEBOUNCE_MS);
}

/**
 * Ensures a reconcile run is scheduled without bumping the epoch.
 * Used when a timer fired during an in-flight run.
 */
function ensureReconcileScheduled(): void {
  if (debounceTimer !== undefined) {
    return;
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    void runReconcile();
  }, DEBOUNCE_MS);
}

/**
 * Runs reconcile workers sequentially, draining pending changes.
 */
async function runReconcile(): Promise<void> {
  if (inFlight) {
    return;
  }
  inFlight = true;
  try {
    do {
      const force = pendingForce;
      pendingForce = false;
      pending = false;
      activeEpoch = reconcileEpoch;
      try {
        await doReconcile({ force });
      } catch (err) {
        console.error('[Patina] reconcile error:', err);
      }
    } while (pending);
  } finally {
    inFlight = false;
    if (pending) {
      ensureReconcileScheduled();
    }
  }
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
 * Write colorCustomizations with stale-check and error handling.
 * Returns true on successful write that is still current.
 */
async function writeColorConfig(
  value: ColorCustomizations | undefined
): Promise<boolean> {
  if (isStale()) return false;

  // Re-read config to skip redundant writes. Phantom reconciles
  // that recompute identical colors must not race with external
  // changes to colorCustomizations. Normalize empty objects to
  // undefined since VS Code returns {} (Proxy) for cleared config.
  const raw = vscode.workspace
    .getConfiguration()
    .get<ColorCustomizations>('workbench.colorCustomizations');
  const current = raw && Object.keys(raw).length > 0 ? raw : undefined;
  const normalized = value && Object.keys(value).length > 0 ? value : undefined;
  if (shallowEqualRecords(current, normalized)) {
    return !isStale();
  }

  try {
    const config = vscode.workspace.getConfiguration();
    await config.update(
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
  return !isStale();
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
  const colorScheme = getColorScheme();
  const tintResult = computeTint({
    workspaceIdentifier: identifier,
    targets: tintConfig.targets,
    themeType: themeContext.tintType,
    colorScheme,
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
  scheduleReconcile();

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
      scheduleReconcile({ force: true });
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      // React to external colorCustomizations changes so a fresh
      // reconcile supersedes any stale pending one.
      if (e.affectsConfiguration('workbench.colorCustomizations')) {
        scheduleReconcile();
        return;
      }
      // React to VS Code theme setting changes.
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
        e.affectsConfiguration('workbench.preferredLightColorTheme')
      ) {
        scheduleReconcile();
        return;
      }
      if (e.affectsConfiguration('patina.statusBar.enabled')) {
        statusBar.updateVisibility();
        return;
      }
      if (e.affectsConfiguration('patina.enabled')) {
        scheduleReconcile();
        return;
      }
      if (
        e.affectsConfiguration('patina.workspaceIdentifier') ||
        e.affectsConfiguration('patina.tint') ||
        e.affectsConfiguration('patina.theme') ||
        e.affectsConfiguration('patina.elements')
      ) {
        scheduleReconcile();
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      scheduleReconcile();
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
    colorScheme: getColorScheme(),
    seed: tintConfig.seed,
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
  // Bump epoch to cancel any in-flight workers
  reconcileEpoch++;
  pending = false;
  pendingForce = false;
}
