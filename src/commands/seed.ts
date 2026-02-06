import * as vscode from 'vscode';
import { refreshStatusBar, StatusBarManager } from '../statusBar';

/**
 * Register seed-related commands: randomizeSeed, resetSeed.
 */
export function registerSeedCommands(
  statusBar: StatusBarManager
): vscode.Disposable[] {
  return [
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
