import * as vscode from 'vscode';
import { setEnabledForWorkspace } from '../config';
import { log } from '../log';
import { requestReconcile } from '../reconcile';

/** Register enable/disable and apply/retry commands. */
export function registerEnableCommands(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('glaze.enableGlobally', async () => {
      log.debug('Command: enableGlobally');
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand('glaze.disableGlobally', async () => {
      log.debug('Command: disableGlobally');
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Global
      );
    }),
    vscode.commands.registerCommand('glaze.enableWorkspace', async () => {
      log.debug('Command: enableWorkspace');
      await setEnabledForWorkspace(true);
    }),
    vscode.commands.registerCommand('glaze.disableWorkspace', async () => {
      log.debug('Command: disableWorkspace');
      await setEnabledForWorkspace(false);
    }),
    vscode.commands.registerCommand('glaze.clearWorkspaceEnabled', async () => {
      log.debug('Command: clearWorkspaceEnabled');
      await setEnabledForWorkspace(undefined);
    }),
    vscode.commands.registerCommand('glaze.forceApply', () => {
      log.debug('Command: forceApply');
      requestReconcile({ force: true });
    }),
    vscode.commands.registerCommand('glaze.retryApply', () => {
      log.debug('Command: retryApply');
      requestReconcile();
    }),
  ];
}
