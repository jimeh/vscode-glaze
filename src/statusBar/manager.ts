import * as vscode from 'vscode';
import { getStatusBarEnabled } from '../config';
import {
  capitalizeFirst,
  colorSwatch,
  getStatusText,
  getThemeModeLabel,
  isStatusBarActive,
} from './helpers';
import type { StatusBarState } from './types';

/**
 * Manages the Patina status bar item.
 */
export class StatusBarManager implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private state: StatusBarState | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.updateVisibility();
  }

  /**
   * Updates the status bar with new state.
   */
  update(state: StatusBarState): void {
    this.state = state;
    this.render();
    this.updateVisibility();
  }

  /**
   * Updates visibility based on config setting.
   */
  updateVisibility(): void {
    if (getStatusBarEnabled()) {
      this.item.show();
    } else {
      this.item.hide();
    }
  }

  private render(): void {
    const isActive = this.isActive();

    // Set icon and text
    this.item.text = isActive ? '$(paintcan) Patina' : '$(paintcan)';

    // Build tooltip
    this.item.tooltip = this.buildTooltip(isActive);
  }

  private isActive(): boolean {
    // state is guaranteed to be set before render() is called
    const { globalEnabled, workspaceEnabled } = this.state!;
    return isStatusBarActive(globalEnabled, workspaceEnabled);
  }

  private buildTooltip(isActive: boolean): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportThemeIcons = true;
    md.supportHtml = true;

    if (isActive) {
      md.appendMarkdown('**Patina** $(check) Active\n\n');
    } else {
      md.appendMarkdown('**Patina** $(x) Inactive\n\n');
    }

    // state is guaranteed to be set before render() is called
    const state = this.state!;
    const { globalEnabled, workspaceEnabled } = state;

    // Status line
    md.appendMarkdown(
      `**Status:** ${getStatusText(globalEnabled, workspaceEnabled)}\n\n`
    );

    if (isActive) {
      // Workspace ID
      if (state.workspaceIdentifier) {
        md.appendMarkdown(
          `**Workspace ID:** \`${state.workspaceIdentifier}\`\n\n`
        );
      }

      // Theme mode
      const { themeType, themeAutoDetected, colorScheme, tintColor } = state;
      const themeLabel = getThemeModeLabel(themeType, themeAutoDetected);
      const schemeLabel = capitalizeFirst(colorScheme);
      md.appendMarkdown(`**Theme:** ${themeLabel} · ${schemeLabel}\n\n`);

      // Tint color with preview swatch
      if (tintColor) {
        const swatch = colorSwatch(tintColor);
        md.appendMarkdown(`**Tint:** ${swatch} \`${tintColor}\``);
      }
    }

    return md;
  }

  dispose(): void {
    this.item.dispose();
  }
}
