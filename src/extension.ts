import * as vscode from 'vscode';
import { generatePalette } from './color';
import { getWorkspaceIdentifier } from './workspace';
import {
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  getWorkspaceEnabled,
  setWorkspaceEnabled,
  migrateWorkspaceModifySetting,
  isEnabled,
} from './config';
import { getThemeContext } from './theme';
import {
  mergeColorCustomizations,
  removePatinaColors,
  ColorCustomizations,
} from './settings';

export async function activate(context: vscode.ExtensionContext) {
  // Migrate old workspace.modify setting to workspace.enabled
  await migrateWorkspaceModifySetting();

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
    vscode.workspace.onDidChangeConfiguration((e) => {
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
      // Re-apply tint when theme changes (only matters if mode is 'auto')
      const tintConfig = getTintConfig();
      if (tintConfig.mode === 'auto') {
        applyTint();
      }
    })
  );
}

async function applyTint(): Promise<void> {
  // Check for per-workspace opt-out first
  const workspaceEnabled = getWorkspaceEnabled();
  if (workspaceEnabled === false) {
    return;
  }

  if (!isEnabled()) {
    await removeTint();
    return;
  }

  const identifierConfig = getWorkspaceIdentifierConfig();
  const identifier = getWorkspaceIdentifier(identifierConfig);
  if (!identifier) {
    return;
  }

  const tintConfig = getTintConfig();
  const themeConfig = getThemeConfig();
  const themeContext = getThemeContext(tintConfig.mode);
  const colors = generatePalette({
    workspaceIdentifier: identifier,
    targets: tintConfig.targets,
    themeContext,
    themeBlendFactor: themeConfig.blendFactor,
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
}

async function removeTint(): Promise<void> {
  const workspaceEnabled = getWorkspaceEnabled();

  // Only remove if Patina has actually modified this workspace
  if (workspaceEnabled !== true) {
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
}

export function deactivate() {}
