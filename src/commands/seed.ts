import * as vscode from 'vscode';
import {
  getTintConfig,
  getWorkspaceEnabledOverride,
  isEnabledForWorkspace,
  isGloballyEnabled,
} from '../config';
import { getCachedState } from '../reconcile';
import { refreshStatusBar, StatusBarManager } from '../statusBar';

/**
 * Register seed-related commands: seedMenu, randomizeSeed,
 * resetSeed.
 */
export function registerSeedCommands(
  statusBar: StatusBarManager
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('patina.seedMenu', async () => {
      const { seed } = getTintConfig();
      const effectivelyEnabled = isEnabledForWorkspace();
      const wsOverride = getWorkspaceEnabledOverride();

      const items: vscode.QuickPickItem[] = [];

      // ── Workspace group
      items.push({
        label: 'Workspace',
        kind: vscode.QuickPickItemKind.Separator,
      });
      if (effectivelyEnabled) {
        items.push({
          label: '$(circle-slash) Disable for Workspace',
          description: 'Disable Patina for this workspace',
        });
      } else {
        items.push({
          label: '$(check) Enable for Workspace',
          description: 'Enable Patina for this workspace',
        });
      }
      if (wsOverride !== undefined) {
        items.push({
          label: '$(clear-all) Clear Workspace Setting',
          description: 'Remove workspace override, follow global',
        });
      }

      // ── Global group
      items.push({
        label: 'Global',
        kind: vscode.QuickPickItemKind.Separator,
      });
      if (isGloballyEnabled()) {
        items.push({
          label: '$(circle-slash) Disable Globally',
          description: 'Disable Patina globally',
        });
      } else {
        items.push({
          label: '$(check) Enable Globally',
          description: 'Enable Patina globally',
        });
      }

      // ── Seed group
      items.push({
        label: 'Seed',
        kind: vscode.QuickPickItemKind.Separator,
      });
      items.push({
        label: '$(refresh) Randomize Seed',
        description: 'Generate a new random seed',
      });
      if (seed !== 0) {
        items.push({
          label: '$(discard) Reset Seed',
          description: 'Reset seed to default (0)',
        });
      }

      // ── Actions group (conditional)
      if (effectivelyEnabled && getCachedState().customizedOutsidePatina) {
        items.push({
          label: 'Actions',
          kind: vscode.QuickPickItemKind.Separator,
        });
        items.push({
          label: '$(warning) Force Apply',
          description: 'Reclaim ownership of color customizations',
        });
      }

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Patina',
      });
      if (!selected) {
        return;
      }
      switch (selected.label) {
        case '$(check) Enable for Workspace':
          await vscode.commands.executeCommand('patina.enableWorkspace');
          break;
        case '$(circle-slash) Disable for Workspace':
          await vscode.commands.executeCommand('patina.disableWorkspace');
          break;
        case '$(clear-all) Clear Workspace Setting':
          await vscode.commands.executeCommand('patina.clearWorkspaceEnabled');
          break;
        case '$(check) Enable Globally':
          await vscode.commands.executeCommand('patina.enableGlobally');
          break;
        case '$(circle-slash) Disable Globally':
          await vscode.commands.executeCommand('patina.disableGlobally');
          break;
        case '$(refresh) Randomize Seed':
          await vscode.commands.executeCommand('patina.randomizeSeed');
          break;
        case '$(discard) Reset Seed':
          await vscode.commands.executeCommand('patina.resetSeed');
          break;
        case '$(warning) Force Apply':
          await vscode.commands.executeCommand('patina.forceApply');
          break;
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
      // Refresh status bar immediately so the tooltip
      // reflects the new seed without waiting for the
      // debounced config listener.
      await refreshStatusBar(statusBar);
    }),
    vscode.commands.registerCommand('patina.resetSeed', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      await refreshStatusBar(statusBar);
    }),
  ];
}
