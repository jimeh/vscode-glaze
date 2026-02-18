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
import { DEFAULT_COLOR_STYLE, DEFAULT_COLOR_HARMONY } from '../color';
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
  'glaze.tint',
  'glaze.theme',
  'glaze.workspaceIdentifier',
] as const;

/**
 * Determines the configuration target for a Glaze setting.
 *
 * Defaults to global so that preview changes apply user-wide. Only
 * targets workspace when the user has an explicit workspace-level
 * override for the setting.
 */
function getSettingTarget(settingKey: string): vscode.ConfigurationTarget {
  const config = vscode.workspace.getConfiguration('glaze');
  const inspection = config.inspect(settingKey);

  if (inspection?.workspaceValue !== undefined) {
    return vscode.ConfigurationTarget.Workspace;
  }
  return vscode.ConfigurationTarget.Global;
}

/**
 * Manages the color palette preview webview panel.
 */
export class PalettePreviewPanel extends BaseWebviewPanel<PreviewMessage> {
  public static readonly viewType = 'glaze.colorPreview';

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
      'Glaze Color Preview',
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
    const styles = generateAllStylePreviews(themeType, currentHarmony);

    // Generate workspace preview if available
    const identifierConfig = getWorkspaceIdentifierConfig();
    const identifier = await getWorkspaceIdentifier(identifierConfig);

    const workspacePreview = identifier
      ? generateWorkspacePreview({
          identifier,
          style: currentStyle,
          harmony: currentHarmony,
          themeType,
          seed: tintConfig.seed,
          baseHueOverride: tintConfig.baseHueOverride,
          themeColors: themeContext.colors,
          blendMethod: themeConfig.blendMethod,
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
        const config = vscode.workspace.getConfiguration('glaze');
        const value =
          target === vscode.ConfigurationTarget.Global &&
          message.style === DEFAULT_COLOR_STYLE
            ? undefined
            : message.style;
        await config.update('tint.colorStyle', value, target);
        // Update will happen via config change listener
        break;
      }
      case 'selectHarmony': {
        const target = getSettingTarget('tint.colorHarmony');
        const config = vscode.workspace.getConfiguration('glaze');
        const value =
          target === vscode.ConfigurationTarget.Global &&
          message.harmony === DEFAULT_COLOR_HARMONY
            ? undefined
            : message.harmony;
        await config.update('tint.colorHarmony', value, target);
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
