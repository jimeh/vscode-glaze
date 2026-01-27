import * as vscode from 'vscode';
import { getColorName } from '../color';
import { getStatusBarEnabled } from '../config';
import {
  capitalizeFirst,
  clickableColorSwatch,
  formatWorkspaceIdForDisplay,
  getStatusText,
  getThemeModeLabel,
  isEffectivelyEnabled,
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
    if (isActive) {
      const colorName = this.getActiveColorName();
      this.item.text = `$(paintcan) ${colorName}`;
    } else {
      this.item.text = '$(paintcan)';
    }

    // Build tooltip
    this.item.tooltip = this.buildTooltip(isActive);
  }

  private getActiveColorName(): string {
    const tintColors = this.state?.tintColors;
    if (!tintColors) {
      return 'Patina';
    }

    // Check elements in priority order: titleBar, activityBar, statusBar
    const activeColor =
      tintColors.titleBar ?? tintColors.activityBar ?? tintColors.statusBar;

    if (activeColor) {
      return getColorName(activeColor);
    }

    return 'Patina';
  }

  private isActive(): boolean {
    // state is guaranteed to be set before render() is called
    const { globalEnabled, workspaceEnabledOverride } = this.state!;
    return isEffectivelyEnabled(globalEnabled, workspaceEnabledOverride);
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
    const { globalEnabled, workspaceEnabledOverride } = state;

    // Status line
    md.appendMarkdown(
      `**Status:** ${getStatusText(globalEnabled, workspaceEnabledOverride)}\n\n`
    );

    if (isActive) {
      // Workspace ID
      if (state.workspaceIdentifier) {
        const displayId = formatWorkspaceIdForDisplay(
          state.workspaceIdentifier
        );
        md.appendMarkdown(`**Workspace ID:** ${displayId}\n\n`);
      }

      // Theme mode
      const { themeType, themeAutoDetected, colorScheme, tintColors } = state;
      const themeLabel = getThemeModeLabel(themeType, themeAutoDetected);
      const schemeLabel = capitalizeFirst(colorScheme);
      md.appendMarkdown(`**Theme:** ${themeLabel} · ${schemeLabel}\n\n`);

      // Colors section with clickable swatches
      if (tintColors) {
        md.appendMarkdown('---\n\n');
        md.appendMarkdown('**Colors**\n\n');

        // Base tint (always shown)
        md.appendMarkdown(
          `Base: ${clickableColorSwatch(tintColors.baseTint)}\n\n`
        );

        // Per-element colors (only if enabled)
        if (tintColors.titleBar) {
          md.appendMarkdown(
            `Title Bar: ${clickableColorSwatch(tintColors.titleBar)}\n\n`
          );
        }
        if (tintColors.activityBar) {
          md.appendMarkdown(
            `Activity Bar: ${clickableColorSwatch(tintColors.activityBar)}\n\n`
          );
        }
        if (tintColors.statusBar) {
          md.appendMarkdown(
            `Status Bar: ${clickableColorSwatch(tintColors.statusBar)}\n\n`
          );
        }
      }
    }

    return md;
  }

  dispose(): void {
    this.item.dispose();
  }
}
