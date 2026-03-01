import * as vscode from 'vscode';
import { getBaseHueOverride } from '../config';
import { log } from '../log';
import { refreshStatusBar, StatusBarManager } from '../statusBar';

/**
 * Register base hue override commands:
 * setBaseHueOverride, clearBaseHueOverride.
 */
export function registerHueOverrideCommands(
  statusBar: StatusBarManager
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('glaze.setBaseHueOverride', async () => {
      const current = getBaseHueOverride();
      const input = await vscode.window.showInputBox({
        title: 'Base Hue Override',
        prompt: 'Enter a hue value (0-359)',
        value: current !== null ? String(current) : '',
        validateInput: (value) => {
          const trimmed = value.trim();
          if (trimmed === '') {
            return 'A hue value is required';
          }
          const num = Number(trimmed);
          if (!Number.isInteger(num) || num < 0 || num > 359) {
            return 'Must be an integer between 0 and 359';
          }
          return null;
        },
      });
      if (input === undefined) {
        return; // Cancelled
      }
      const hue = Number(input.trim());
      log.debug('Command: setBaseHueOverride', { hue });
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.baseHueOverride',
        hue,
        vscode.ConfigurationTarget.Workspace
      );
      await refreshStatusBar(statusBar);
    }),
    vscode.commands.registerCommand('glaze.clearBaseHueOverride', async () => {
      log.debug('Command: clearBaseHueOverride');
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.baseHueOverride',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      await refreshStatusBar(statusBar);
    }),
  ];
}
