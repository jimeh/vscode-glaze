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
import { BaseWebviewPanel } from '../webview/panel';

/**
 * Configuration sections that trigger a preview panel re-render.
 */
const CONFIG_SECTIONS = [
  'patina.tint',
  'patina.theme',
  'patina.workspaceIdentifier',
] as const;

/**
 * Manages the color palette preview webview panel.
 */
export class PalettePreviewPanel extends BaseWebviewPanel<PreviewMessage> {
  public static readonly viewType = 'patina.colorPreview';

  private static instance: PalettePreviewPanel | undefined;

  private selectedThemeType: ThemeType | undefined;

  private constructor(panel: vscode.WebviewPanel) {
    super(panel, { configSections: CONFIG_SECTIONS });
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

    PalettePreviewPanel.instance = new PalettePreviewPanel(panel);
  }

  /**
   * Generates the preview panel HTML.
   */
  protected async generateHtml(
    nonce: string,
    cspSource: string
  ): Promise<string> {
    const state = await this.buildState();
    return generatePreviewHtml(state, nonce, cspSource);
  }

  /**
   * Builds the current preview state.
   */
  private async buildState(): Promise<PreviewState> {
    const tintConfig = getTintConfig();
    const themeConfig = getThemeConfig();
    const themeContext = await getThemeContext(tintConfig.mode);
    const currentScheme = getColorScheme();

    // Use manual selection if set, otherwise use detected theme type
    const themeType = this.selectedThemeType ?? themeContext.tintType;
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
          targetBlendFactors: themeConfig.targetBlendFactors,
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
  protected async handleMessage(message: PreviewMessage): Promise<void> {
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
        void this.update();
        break;
      }
    }
  }

  /**
   * Clears manual theme type selection when the VS Code theme changes.
   */
  protected override onThemeChanged(): void {
    this.selectedThemeType = undefined;
  }

  /**
   * Disposes of the panel and cleans up resources.
   */
  public override dispose(): void {
    PalettePreviewPanel.instance = undefined;
    super.dispose();
  }
}
