import * as vscode from 'vscode';
import { generatePalette } from './color';
import { getWorkspaceIdentifier } from './workspace';
import {
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
  getWorkspaceModify,
  setWorkspaceModify,
  isEnabled,
} from './config';
import { getThemeContext } from './theme';
import {
  mergeColorCustomizations,
  removePatinaColors,
  ColorCustomizations,
} from './settings';

export function activate(context: vscode.ExtensionContext) {
  // Apply tint on activation
  applyTint();

  context.subscriptions.push(
    vscode.commands.registerCommand('patina.enable', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('patina.disable', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', false, vscode.ConfigurationTarget.Global);
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('patina.workspace.modify')) {
        const workspaceModify = getWorkspaceModify();
        if (workspaceModify === false) {
          // User opted out - remove colors without clearing the flag
          removeTintPreservingFlag();
        } else if (workspaceModify === true && isEnabled()) {
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
  const workspaceModify = getWorkspaceModify();
  if (workspaceModify === false) {
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

  // Mark workspace as modified by Patina (only if not already true)
  if (workspaceModify !== true) {
    await setWorkspaceModify(true);
  }
}

async function removeTint(): Promise<void> {
  const workspaceModify = getWorkspaceModify();

  // Only remove if Patina has actually modified this workspace
  if (workspaceModify !== true) {
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

  // Clear the modification marker
  await setWorkspaceModify(undefined);
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
