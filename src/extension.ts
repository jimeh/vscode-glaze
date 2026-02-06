import * as vscode from 'vscode';
import { registerAllCommands } from './commands';
import { registerEventHandlers } from './events';
import {
  cancelPendingReconcile,
  requestReconcile,
  setRefreshStatusBar,
} from './reconcile';
import { refreshStatusBar, StatusBarManager } from './statusBar';

export async function activate(context: vscode.ExtensionContext) {
  const statusBar = new StatusBarManager();
  context.subscriptions.push(statusBar);

  // Wire up the status bar refresh callback so the reconcile
  // module can trigger refreshes without a circular import.
  setRefreshStatusBar(() => refreshStatusBar(statusBar));

  // Apply tint on activation
  requestReconcile();

  context.subscriptions.push(
    ...registerAllCommands(context.extensionUri, statusBar),
    ...registerEventHandlers(statusBar)
  );
}

export function deactivate() {
  cancelPendingReconcile();
}
