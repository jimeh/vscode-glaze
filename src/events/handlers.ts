import * as vscode from 'vscode';
import { requestReconcile } from '../reconcile';
import type { StatusBarManager } from '../statusBar';

/**
 * Register configuration and theme change event handlers.
 * Returns disposables for subscription management.
 */
export function registerEventHandlers(
  statusBar: StatusBarManager
): vscode.Disposable[] {
  return [
    vscode.workspace.onDidChangeConfiguration((e) => {
      // React to colorCustomizations changes. The equality
      // check in writeColorConfig prevents loops — if Glaze
      // just wrote these colors, the re-read will match and
      // skip the write.
      if (e.affectsConfiguration('workbench.colorCustomizations')) {
        requestReconcile();
        return;
      }
      // Handle VS Code theme changes
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
        e.affectsConfiguration('workbench.preferredLightColorTheme')
      ) {
        requestReconcile();
        return;
      }
      if (e.affectsConfiguration('glaze.statusBar.enabled')) {
        statusBar.updateVisibility();
        return;
      }
      if (e.affectsConfiguration('glaze.enabled')) {
        requestReconcile();
        return;
      }
      if (
        e.affectsConfiguration('glaze.settingsTarget') ||
        e.affectsConfiguration('glaze.workspaceIdentifier') ||
        e.affectsConfiguration('glaze.tint') ||
        e.affectsConfiguration('glaze.theme') ||
        e.affectsConfiguration('glaze.elements')
      ) {
        requestReconcile();
      }
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      requestReconcile();
    }),
  ];
}
