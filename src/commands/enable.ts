import * as vscode from 'vscode';
import { setEnabledForWorkspace } from '../config';
import { requestReconcile } from '../reconcile';

/** Register enable/disable and force-apply commands. */
export function registerEnableCommands(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('glaze.enableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('glaze.disableGlobally', async () => {
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Global
      );
    }),
    vscode.commands.registerCommand('glaze.enableWorkspace', async () => {
      await setEnabledForWorkspace(true);
    }),
    vscode.commands.registerCommand('glaze.disableWorkspace', async () => {
      await setEnabledForWorkspace(false);
    }),
    vscode.commands.registerCommand('glaze.clearWorkspaceEnabled', async () => {
      await setEnabledForWorkspace(undefined);
    }),
    vscode.commands.registerCommand('glaze.forceApply', () => {
      requestReconcile({ force: true });
    }),
  ];
}
