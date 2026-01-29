import * as vscode from 'vscode';
import { generatePalette, calculateBaseTint } from './color';
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
  ColorCustomizations,
} from './settings';
import { StatusBarManager, StatusBarState, TintColors } from './statusBar';
import { PalettePreviewPanel } from './preview';
import { StatusPanel } from './status';

let statusBar: StatusBarManager;
let applyTintTimeout: ReturnType<typeof setTimeout> | undefined;
let removeTintTimeout: ReturnType<typeof setTimeout> | undefined;

/** Cached values from the last applyTint/removeTint for cheap status bar refreshes. */
let lastWorkspaceIdentifier: string | undefined;
let lastTintColors: TintColors | undefined;

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
  }, 150);
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
  }, 150);
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
    lastWorkspaceIdentifier = undefined;
    lastTintColors = undefined;
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
  const colors = generatePalette({
    workspaceIdentifier: identifier,
    targets: tintConfig.targets,
    themeContext,
    colorScheme,
    themeBlendFactor: themeConfig.blendFactor,
    seed: tintConfig.seed,
  });
  const config = vscode.workspace.getConfiguration();
  const existing = config.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );
  const merged = mergeColorCustomizations(existing, colors);
  await config.update(
    'workbench.colorCustomizations',
    merged,
    vscode.ConfigurationTarget.Workspace
  );

  // Build tint colors for status bar display
  const tintColors: TintColors = {
    baseTint: calculateBaseTint({
      workspaceIdentifier: identifier,
      themeType: themeContext.tintType,
      seed: tintConfig.seed,
    }),
    titleBar: colors['titleBar.activeBackground'],
    activityBar: colors['activityBar.background'],
    statusBar: colors['statusBar.background'],
  };

  // Update status bar with current state
  lastWorkspaceIdentifier = identifier;
  lastTintColors = tintColors;
  refreshStatusBar();
}

async function removeTint(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  const existing = config.get<ColorCustomizations>(
    'workbench.colorCustomizations'
  );

  const remaining = removePatinaColors(existing);
  await config.update(
    'workbench.colorCustomizations',
    remaining,
    vscode.ConfigurationTarget.Workspace
  );

  lastWorkspaceIdentifier = undefined;
  lastTintColors = undefined;
  refreshStatusBar();
}

/**
 * Re-reads config and updates the status bar using cached
 * workspace identifier and tint colors from the last apply/remove.
 */
function refreshStatusBar(): void {
  const tintConfig = getTintConfig();
  const themeContext = getThemeContext(tintConfig.mode);

  const state: StatusBarState = {
    globalEnabled: isGloballyEnabled(),
    workspaceEnabledOverride: getWorkspaceEnabledOverride(),
    workspaceIdentifier: lastWorkspaceIdentifier,
    themeName: themeContext.name,
    tintType: themeContext.tintType,
    themeAutoDetected: themeContext.isAutoDetected,
    colorScheme: getColorScheme(),
    seed: tintConfig.seed,
    tintColors: lastTintColors,
  };

  statusBar.update(state);
}

export function deactivate() {}
