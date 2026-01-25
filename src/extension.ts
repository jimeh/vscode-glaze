import * as vscode from 'vscode';
import { generatePalette } from './color';
import { getWorkspaceIdentifier } from './workspace';
import {
  getColorScheme,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  getWorkspaceEnabled,
  setWorkspaceEnabled,
  isEnabled,
} from './config';
import { getThemeContext } from './theme';
import {
  mergeColorCustomizations,
  removePatinaColors,
  ColorCustomizations,
} from './settings';
import { StatusBarManager, StatusBarState } from './statusBar';
import { PalettePreviewPanel } from './preview';

let statusBar: StatusBarManager;
let themeChangeTimeout: ReturnType<typeof setTimeout> | undefined;

export async function activate(context: vscode.ExtensionContext) {
  statusBar = new StatusBarManager();
  context.subscriptions.push(statusBar);

  // Apply tint on activation
  applyTint();

  context.subscriptions.push(
    vscode.commands.registerCommand('patina.enableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('patina.disableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', false, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('patina.enableWorkspace', async () => {
      await setWorkspaceEnabled(true);
    }),
    vscode.commands.registerCommand('patina.disableWorkspace', async () => {
      await setWorkspaceEnabled(false);
    }),
    vscode.commands.registerCommand('patina.showColorPreview', () => {
      PalettePreviewPanel.show(context.extensionUri);
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      // Handle VS Code theme changes (debounced with theme event)
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
        e.affectsConfiguration('workbench.preferredLightColorTheme')
      ) {
        if (themeChangeTimeout) {
          clearTimeout(themeChangeTimeout);
        }
        themeChangeTimeout = setTimeout(() => {
          themeChangeTimeout = undefined;
          applyTint();
        }, 150);
        return;
      }
      if (e.affectsConfiguration('patina.statusBar.enabled')) {
        statusBar.updateVisibility();
        return;
      }
      if (e.affectsConfiguration('patina.workspace.enabled')) {
        const workspaceEnabled = getWorkspaceEnabled();
        if (workspaceEnabled === false) {
          // User opted out - remove colors without clearing the flag
          removeTintPreservingFlag();
        } else if (workspaceEnabled === true && isEnabled()) {
          applyTint();
        }
        return;
      }
      if (e.affectsConfiguration('patina.enabled')) {
        if (isEnabled()) {
          applyTint();
        } else {
          removeTint();
        }
        return;
      }
      if (
        e.affectsConfiguration('patina.workspaceIdentifier') ||
        e.affectsConfiguration('patina.tint') ||
        e.affectsConfiguration('patina.theme') ||
        e.affectsConfiguration('patina.elements')
      ) {
        applyTint();
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      // Debounce with config change events to handle race condition where
      // activeColorTheme fires before workbench.colorTheme config is updated
      if (themeChangeTimeout) {
        clearTimeout(themeChangeTimeout);
      }
      themeChangeTimeout = setTimeout(() => {
        themeChangeTimeout = undefined;
        applyTint();
      }, 150);
    })
  );
}

async function applyTint(): Promise<void> {
  // Check for per-workspace opt-out first
  const workspaceEnabled = getWorkspaceEnabled();
  if (workspaceEnabled === false) {
    updateStatusBar(undefined, undefined);
    return;
  }

  if (!isEnabled()) {
    await removeTint();
    return;
  }

  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);
  if (!identifier) {
    updateStatusBar(undefined, undefined);
    return;
  }

  const tintConfig = getTintConfig();
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

  // Mark workspace as enabled by Patina (only if not already true)
  if (workspaceEnabled !== true) {
    await setWorkspaceEnabled(true);
  }

  // Update status bar with current state
  updateStatusBar(identifier, colors['titleBar.activeBackground']);
}

async function removeTint(): Promise<void> {
  const workspaceEnabled = getWorkspaceEnabled();

  // Only remove if Patina has actually modified this workspace
  if (workspaceEnabled !== true) {
    updateStatusBar(undefined, undefined);
    return;
  }

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

  // Clear the enabled marker
  await setWorkspaceEnabled(undefined);

  updateStatusBar(undefined, undefined);
}

async function removeTintPreservingFlag(): Promise<void> {
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

  updateStatusBar(undefined, undefined);
}

function updateStatusBar(
  workspaceIdentifier: string | undefined,
  tintColor: string | undefined
): void {
  const tintConfig = getTintConfig();
  const themeContext = getThemeContext(tintConfig.mode);

  const state: StatusBarState = {
    globalEnabled: isEnabled(),
    workspaceEnabled: getWorkspaceEnabled(),
    workspaceIdentifier,
    themeType: themeContext.type,
    themeAutoDetected: themeContext.isAutoDetected,
    colorScheme: getColorScheme(),
    tintColor,
  };

  statusBar.update(state);
}

export function deactivate() {}
