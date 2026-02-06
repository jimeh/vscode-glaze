import * as vscode from 'vscode';
import { setEnabledForWorkspace } from '../config';
import { requestReconcile } from '../reconcile';

/** Register enable/disable and force-apply commands. */
export function registerEnableCommands(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('patina.enableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('patina.disableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Global
      );
    }),
    vscode.commands.registerCommand('patina.enableWorkspace', async () => {
      await setEnabledForWorkspace(true);
    }),
    vscode.commands.registerCommand('patina.disableWorkspace', async () => {
      await setEnabledForWorkspace(false);
    }),
    vscode.commands.registerCommand(
      'patina.clearWorkspaceEnabled',
      async () => {
        await setEnabledForWorkspace(undefined);
      }
    ),
    vscode.commands.registerCommand('patina.forceApply', () => {
      requestReconcile({ force: true });
    }),
  ];
}
