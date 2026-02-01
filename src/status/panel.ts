import * as vscode from 'vscode';
import type { StatusMessage } from './types';
import { buildStatusState } from './data';
import { generateStatusHtml } from './html';
import { BaseWebviewPanel } from '../webview/panel';

/**
 * Configuration sections that trigger a status panel re-render.
 */
const CONFIG_SECTIONS = [
  'patina',
  'workbench.colorTheme',
  'workbench.preferredDarkColorTheme',
  'workbench.preferredLightColorTheme',
] as const;

/**
 * Manages the Patina Status webview panel.
 * Singleton pattern — only one status panel can be open at a time.
 */
export class StatusPanel extends BaseWebviewPanel<StatusMessage> {
  public static readonly viewType = 'patina.statusView';

  private static instance: StatusPanel | undefined;

  private constructor(panel: vscode.WebviewPanel) {
    super(panel, { configSections: CONFIG_SECTIONS });
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

    StatusPanel.instance = new StatusPanel(panel);
  }

  /**
   * Generates the status panel HTML.
   */
  protected async generateHtml(
    nonce: string,
    cspSource: string
  ): Promise<string> {
    const state = await buildStatusState();
    return generateStatusHtml(state, nonce, cspSource);
  }

  /**
   * Handles messages from the webview.
   */
  protected handleMessage(message: StatusMessage): void {
    switch (message.type) {
      case 'refresh':
        void this.update();
        break;
    }
  }

  /**
   * Disposes of the panel and cleans up resources.
   */
  public override dispose(): void {
    StatusPanel.instance = undefined;
    super.dispose();
  }
}
