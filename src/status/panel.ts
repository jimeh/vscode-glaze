import * as vscode from 'vscode';
import type { StatusMessage } from './types';
import { buildStatusState } from './data';
import { generateStatusHtml } from './html';
import { generateNonce } from '../webview';

/**
 * Manages the Patina Status webview panel.
 * Singleton pattern — only one status panel can be open at a time.
 */
export class StatusPanel {
  public static readonly viewType = 'patina.statusView';

  private static instance: StatusPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, _extensionUri: vscode.Uri) {
    this.panel = panel;

    this.update();

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message: StatusMessage) => this.handleMessage(message),
      null,
      this.disposables
    );

    // Re-render when Patina or theme configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration('patina') ||
          e.affectsConfiguration('workbench.colorTheme') ||
          e.affectsConfiguration('workbench.preferredDarkColorTheme') ||
          e.affectsConfiguration('workbench.preferredLightColorTheme')
        ) {
          this.update();
        }
      })
    );

    // Re-render when VS Code theme changes
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        setTimeout(() => this.update(), 0);
      })
    );
  }

  /**
   * Creates or reveals the status panel.
   */
  public static show(extensionUri: vscode.Uri): void {
    if (StatusPanel.instance) {
      StatusPanel.instance.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      StatusPanel.viewType,
      'Patina Status',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true,
      }
    );

    StatusPanel.instance = new StatusPanel(panel, extensionUri);
  }

  /**
   * Updates the webview content with current state.
   */
  public update(): void {
    const state = buildStatusState();
    const nonce = generateNonce();
    const cspSource = this.panel.webview.cspSource;

    this.panel.webview.html = generateStatusHtml(state, nonce, cspSource);
  }

  /**
   * Handles messages from the webview.
   */
  private handleMessage(message: StatusMessage): void {
    switch (message.type) {
      case 'refresh':
        this.update();
        break;
    }
  }

  /**
   * Disposes of the panel and cleans up resources.
   */
  public dispose(): void {
    StatusPanel.instance = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
