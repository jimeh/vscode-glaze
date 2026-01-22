import * as vscode from 'vscode';
import { generatePalette, getWorkspaceIdentifier } from './color';

export function activate(context: vscode.ExtensionContext) {
  // Apply tint on activation
  applyTint();

  context.subscriptions.push(
    vscode.commands.registerCommand('patina.enable', applyTint),
    vscode.commands.registerCommand('patina.disable', removeTint)
  );
}

async function applyTint(): Promise<void> {
  const identifier = getWorkspaceIdentifier();
  if (!identifier) {
    return;
  }

  const colors = generatePalette(identifier);
  const config = vscode.workspace.getConfiguration();
  await config.update(
    'workbench.colorCustomizations',
    colors,
    vscode.ConfigurationTarget.Workspace
  );
}

async function removeTint(): Promise<void> {
  const config = vscode.workspace.getConfiguration();
  await config.update(
    'workbench.colorCustomizations',
    undefined,
    vscode.ConfigurationTarget.Workspace
  );
}

export function deactivate() {}
