import * as vscode from 'vscode';

/** Register clipboard commands. */
export function registerClipboardCommands(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('patina.copyColor', (hex: string) => {
      vscode.env.clipboard.writeText(hex);
      vscode.window.showInformationMessage(`Copied ${hex} to clipboard`);
    }),
  ];
}
