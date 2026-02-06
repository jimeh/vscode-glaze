import * as vscode from 'vscode';
import { PalettePreviewPanel } from '../preview';
import { StatusPanel } from '../status';

/** Register UI panel commands. */
export function registerUiCommands(
  extensionUri: vscode.Uri
): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('patina.showColorPreview', () => {
      PalettePreviewPanel.show(extensionUri);
    }),
    vscode.commands.registerCommand('patina.showStatus', () => {
      StatusPanel.show(extensionUri);
    }),
  ];
}
