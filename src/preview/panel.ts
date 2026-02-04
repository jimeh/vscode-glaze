import * as vscode from 'vscode';
import type { ThemeType } from '../theme';
import type { PreviewMessage, PreviewState } from './types';
import {
  getColorHarmony,
  getColorStyle,
  getThemeConfig,
  getTintConfig,
  getWorkspaceIdentifierConfig,
} from '../config';
import { getThemeContext } from '../theme';
import { getWorkspaceIdentifier } from '../workspace';
import {
  generateAllHarmonyPreviews,
  generateAllStylePreviews,
  generateWorkspacePreview,
} from './colors';
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
 * Determines the configuration target for a Patina setting.
 *
 * Respects the existing scope: if the setting already has a workspace
 * value, targets workspace; if global, targets global. When neither
 * is defined, prefers workspace when a workspace folder is open.
 */
function getSettingTarget(settingKey: string): vscode.ConfigurationTarget {
  const config = vscode.workspace.getConfiguration('patina');
  const inspection = config.inspect(settingKey);

  if (inspection?.workspaceValue !== undefined) {
    return vscode.ConfigurationTarget.Workspace;
  }
  if (inspection?.globalValue !== undefined) {
    return vscode.ConfigurationTarget.Global;
  }
  return vscode.workspace.workspaceFolders
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
}

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
    const currentStyle = getColorStyle();
    const currentHarmony = getColorHarmony();

    // Use manual selection if set, otherwise use detected theme type
    const themeType = this.selectedThemeType ?? themeContext.tintType;
    const styles = generateAllStylePreviews(themeType);

    // Generate workspace preview if available
    const identifierConfig = getWorkspaceIdentifierConfig();
    const identifier = getWorkspaceIdentifier(identifierConfig);

    const workspacePreview = identifier
      ? generateWorkspacePreview({
          identifier,
          style: currentStyle,
          harmony: currentHarmony,
          themeType,
          seed: tintConfig.seed,
          themeColors: themeContext.colors,
          blendFactor: themeConfig.blendFactor,
          targetBlendFactors: themeConfig.targetBlendFactors,
        })
      : undefined;

    const harmonies = generateAllHarmonyPreviews(currentStyle, themeType);

    return {
      themeType,
      currentStyle,
      currentHarmony,
      workspacePreview,
      styles,
      harmonies,
    };
  }

  /**
   * Handles messages from the webview.
   */
  protected async handleMessage(message: PreviewMessage): Promise<void> {
    switch (message.type) {
      case 'selectStyle': {
        const target = getSettingTarget('tint.colorStyle');
        const config = vscode.workspace.getConfiguration('patina');
        await config.update('tint.colorStyle', message.style, target);
        // Update will happen via config change listener
        break;
      }
      case 'selectHarmony': {
        const target = getSettingTarget('tint.colorHarmony');
        const config = vscode.workspace.getConfiguration('patina');
        await config.update('tint.colorHarmony', message.harmony, target);
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
