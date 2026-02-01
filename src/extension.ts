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
  PATINA_ACTIVE_KEY,
  PATINA_ACTIVE_VALUE,
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
let applyTintTimeout: ReturnType<typeof setTimeout> | undefined;
let removeTintTimeout: ReturnType<typeof setTimeout> | undefined;

/** Debounce delay in ms for apply/remove tint operations. */
const DEBOUNCE_MS = 150;

/**
 * Cached values from the last applyTint/removeTint for cheap
 * status bar refreshes.
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

function debouncedApplyTint(): void {
  if (removeTintTimeout) {
    clearTimeout(removeTintTimeout);
    removeTintTimeout = undefined;
  }
  if (applyTintTimeout) {
    clearTimeout(applyTintTimeout);
  }
  applyTintTimeout = setTimeout(() => {
    applyTintTimeout = undefined;
    applyTint();
  }, DEBOUNCE_MS);
}

function debouncedRemoveTint(): void {
  if (applyTintTimeout) {
    clearTimeout(applyTintTimeout);
    applyTintTimeout = undefined;
  }
  if (removeTintTimeout) {
    clearTimeout(removeTintTimeout);
  }
  removeTintTimeout = setTimeout(() => {
    removeTintTimeout = undefined;
    removeTint();
  }, DEBOUNCE_MS);
}

export async function activate(context: vscode.ExtensionContext) {
  statusBar = new StatusBarManager();
  context.subscriptions.push(statusBar);

  // Apply tint on activation
  debouncedApplyTint();

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
      refreshStatusBar();
    }),
    vscode.commands.registerCommand('patina.resetSeed', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      refreshStatusBar();
    }),
    vscode.commands.registerCommand('patina.forceApply', async () => {
      // Inject the ownership marker into existing colors, then re-apply.
      const config = vscode.workspace.getConfiguration();
      const existing = config.get<ColorCustomizations>(
        'workbench.colorCustomizations'
      );
      if (existing) {
        const updated = { ...existing };
        updated[PATINA_ACTIVE_KEY] = PATINA_ACTIVE_VALUE;
        await config.update(
          'workbench.colorCustomizations',
          updated,
          vscode.ConfigurationTarget.Workspace
        );
      }
      await applyTint();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      // Handle VS Code theme changes
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
        e.affectsConfiguration('workbench.preferredLightColorTheme')
      ) {
        debouncedApplyTint();
        return;
      }
      if (e.affectsConfiguration('patina.statusBar.enabled')) {
        statusBar.updateVisibility();
        return;
      }
      if (e.affectsConfiguration('patina.enabled')) {
        if (isEnabledForWorkspace()) {
          debouncedApplyTint();
        } else {
          debouncedRemoveTint();
        }
        return;
      }
      if (
        e.affectsConfiguration('patina.workspaceIdentifier') ||
        e.affectsConfiguration('patina.tint') ||
        e.affectsConfiguration('patina.theme') ||
        e.affectsConfiguration('patina.elements')
      ) {
        debouncedApplyTint();
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      // Debounce handles race condition where activeColorTheme fires before
      // workbench.colorTheme config is updated
      debouncedApplyTint();
    })
  );
}

async function applyTint(): Promise<void> {
  if (!isEnabledForWorkspace()) {
    await removeTint();
    return;
  }

  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);
  if (!identifier) {
    cached = {
      workspaceIdentifier: undefined,
      tintColors: undefined,
      customizedOutsidePatina: false,
      lastError: undefined,
    };
    refreshStatusBar();
    return;
  }

  const tintConfig = getTintConfig();
  if (tintConfig.targets.length === 0) {
    await removeTint();
    return;
  }

  const themeConfig = getThemeConfig();
  const themeContext = getThemeContext(tintConfig.mode);
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
  // overwrite.
  if (hasPatinaColorsWithoutMarker(existing)) {
    cached = {
      ...cached,
      customizedOutsidePatina: true,
    };
    refreshStatusBar();
    return;
  }

  const merged = mergeColorCustomizations(existing, colors);
  try {
    await config.update(
      'workbench.colorCustomizations',
      merged,
      vscode.ConfigurationTarget.Workspace
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Patina] Failed to update color customizations:', err);
    cached = {
      ...cached,
      lastError: message,
    };
    refreshStatusBar();
    return;
  }

  // Only update cached state after successful write
  cached = {
    workspaceIdentifier: identifier,
    tintColors: tintResultToStatusBarColors(tintResult),
    customizedOutsidePatina: false,
    lastError: undefined,
  };
  refreshStatusBar();
}

async function removeTint(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const existing = config.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );

  const remaining = removePatinaColors(existing);
  try {
    await config.update(
      'workbench.colorCustomizations',
      remaining,
      vscode.ConfigurationTarget.Workspace
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Patina] Failed to remove color customizations:', err);
    cached = {
      ...cached,
      lastError: message,
    };
    refreshStatusBar();
    return;
  }

  cached = {
    workspaceIdentifier: undefined,
    tintColors: undefined,
    customizedOutsidePatina: false,
    lastError: undefined,
  };
  refreshStatusBar();
}

/**
 * Re-reads config and updates the status bar using cached
 * workspace identifier and tint colors from the last
 * apply/remove.
 */
function refreshStatusBar(): void {
  const tintConfig = getTintConfig();
  const themeContext = getThemeContext(tintConfig.mode);

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
  if (applyTintTimeout) {
    clearTimeout(applyTintTimeout);
    applyTintTimeout = undefined;
  }
  if (removeTintTimeout) {
    clearTimeout(removeTintTimeout);
    removeTintTimeout = undefined;
  }
}
