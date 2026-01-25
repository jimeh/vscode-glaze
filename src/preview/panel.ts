import * as vscode from 'vscode';
import type { ThemeType } from '../theme';
import type { PreviewMessage, PreviewState } from './types';
import {
  getColorScheme,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
} from '../config';
import { getThemeContext } from '../theme';
import { getWorkspaceIdentifier } from '../workspace';
import { generateAllSchemePreviews, generateWorkspacePreview } from './colors';
import { generatePreviewHtml } from './html';

/**
 * Manages the color palette preview webview panel.
 */
export class PalettePreviewPanel {
  public static readonly viewType = 'patina.colorPreview';

  private static instance: PalettePreviewPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private selectedThemeType: ThemeType | undefined;

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    this.update();

    // Handle panel disposal
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from webview
    this.panel.webview.onDidReceiveMessage(
      (message: PreviewMessage) => this.handleMessage(message),
      null,
      this.disposables
    );

    // Re-render when configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration('patina.tint') ||
          e.affectsConfiguration('patina.theme') ||
          e.affectsConfiguration('patina.workspaceIdentifier')
        ) {
          this.update();
        }
      })
    );

    // Re-render when theme changes
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(() => {
        // Clear manual selection when theme changes
        this.selectedThemeType = undefined;
        setTimeout(() => this.update(), 0);
      })
    );
  }

  /**
   * Creates or reveals the preview panel.
   */
  public static show(extensionUri: vscode.Uri): void {
    if (PalettePreviewPanel.instance) {
      PalettePreviewPanel.instance.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      PalettePreviewPanel.viewType,
      'Patina Color Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
        retainContextWhenHidden: true,
      }
    );

    PalettePreviewPanel.instance = new PalettePreviewPanel(panel, extensionUri);
  }

  /**
   * Updates the webview content.
   */
  public update(): void {
    const state = this.buildState();
    const nonce = this.generateNonce();
    const cspSource = this.panel.webview.cspSource;

    this.panel.webview.html = generatePreviewHtml(state, nonce, cspSource);
  }

  /**
   * Builds the current preview state.
   */
  private buildState(): PreviewState {
    const tintConfig = getTintConfig();
    const themeConfig = getThemeConfig();
    const themeContext = getThemeContext(tintConfig.mode);
    const currentScheme = getColorScheme();

    // Use manual selection if set, otherwise use detected theme type
    const themeType = this.selectedThemeType ?? themeContext.type;
    const schemes = generateAllSchemePreviews(themeType);

    // Generate workspace preview if available
    const identifierConfig = getWorkspaceIdentifierConfig();
    const identifier = getWorkspaceIdentifier(identifierConfig);

    const workspacePreview = identifier
      ? generateWorkspacePreview({
          identifier,
          scheme: currentScheme,
          themeType,
          seed: tintConfig.seed,
          themeColors: themeContext.colors,
          blendFactor: themeConfig.blendFactor,
        })
      : undefined;

    return {
      themeType,
      currentScheme,
      workspacePreview,
      schemes,
    };
  }

  /**
   * Handles messages from the webview.
   */
  private async handleMessage(message: PreviewMessage): Promise<void> {
    switch (message.type) {
      case 'selectScheme': {
        const config = vscode.workspace.getConfiguration('patina');
        const inspection = config.inspect('tint.colorScheme');

        // Determine target: respect existing scope, default to workspace
        let target: vscode.ConfigurationTarget;
        if (inspection?.workspaceValue !== undefined) {
          target = vscode.ConfigurationTarget.Workspace;
        } else if (inspection?.globalValue !== undefined) {
          target = vscode.ConfigurationTarget.Global;
        } else {
          // Neither defined: prefer workspace if available
          target = vscode.workspace.workspaceFolders
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;
        }

        await config.update('tint.colorScheme', message.scheme, target);
        // Update will happen via config change listener
        break;
      }
      case 'changeThemeType': {
        this.selectedThemeType = message.themeType;
        this.update();
        break;
      }
    }
  }

  /**
   * Generates a random nonce for CSP.
   */
  private generateNonce(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    for (let i = 0; i < 32; i++) {
      nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
  }

  /**
   * Disposes of the panel and cleans up resources.
   */
  public dispose(): void {
    PalettePreviewPanel.instance = undefined;

    this.panel.dispose();

    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }
}
