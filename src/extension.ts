import * as vscode from 'vscode';
import { registerAllCommands } from './commands';
import { registerEventHandlers } from './events';
import {
  cancelPendingReconcile,
  enableReconcileGuard,
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

  // Enable the reconcile guard in normal runtime. Tests disable it
  // via GLAZE_DISABLE_RECONCILE_GUARD for deterministic behavior.
  if (
    typeof process === 'undefined' ||
    process.env.GLAZE_DISABLE_RECONCILE_GUARD !== '1'
  ) {
    enableReconcileGuard();
  }

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
