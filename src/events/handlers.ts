import * as vscode from 'vscode';
import { log } from '../log';
import { requestReconcile } from '../reconcile';
import type { StatusBarManager } from '../statusBar';
import { clearGitRepoRootCache } from '../workspace/gitRoot';

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
        log.debug('Config changed: workbench.colorCustomizations');
        requestReconcile();
        return;
      }
      // Handle VS Code theme changes
      if (
        e.affectsConfiguration('workbench.colorTheme') ||
        e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
        e.affectsConfiguration('workbench.preferredLightColorTheme')
      ) {
        log.debug('Config changed: color theme setting');
        requestReconcile();
        return;
      }
      if (e.affectsConfiguration('glaze.statusBar.enabled')) {
        log.debug('Config changed: glaze.statusBar.enabled');
        statusBar.updateVisibility();
        return;
      }
      if (e.affectsConfiguration('glaze.enabled')) {
        log.debug('Config changed: glaze.enabled');
        requestReconcile();
        return;
      }
      if (e.affectsConfiguration('glaze.workspaceIdentifier')) {
        log.debug('Config changed: glaze.workspaceIdentifier');
        clearGitRepoRootCache();
        requestReconcile();
        return;
      }
      if (
        e.affectsConfiguration('glaze.tint') ||
        e.affectsConfiguration('glaze.theme') ||
        e.affectsConfiguration('glaze.elements')
      ) {
        log.debug('Config changed: glaze tint/theme/elements');
        requestReconcile();
      }
    }),
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      log.debug('Workspace folders changed');
      clearGitRepoRootCache();
      requestReconcile();
    }),
    vscode.window.onDidChangeActiveColorTheme(() => {
      log.debug('Active color theme changed');
      requestReconcile();
    }),
  ];
}
