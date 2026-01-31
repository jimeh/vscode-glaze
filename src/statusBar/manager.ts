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
    this.item.command = 'patina.seedMenu';
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
    const customized = this.state?.customizedOutsidePatina ?? false;

    // Set icon and text
    if (customized) {
      this.item.text = '$(paintcan) $(warning) Modified';
    } else if (isActive) {
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
    if (!this.state) {
      return false;
    }
    const { globalEnabled, workspaceEnabledOverride } = this.state;
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

    if (!this.state) {
      return md;
    }
    const state = this.state;

    // Warning when colors were modified outside Patina
    if (state.customizedOutsidePatina) {
      md.appendMarkdown(
        '$(warning) **Colors modified outside Patina.** ' +
          'Patina will not overwrite external changes.\n\n' +
          '[Force Apply](command:patina.forceApply) ' +
          'to reclaim ownership.\n\n'
      );
    }
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

      const {
        themeName,
        tintType,
        themeAutoDetected,
        colorScheme,
        tintColors,
      } = state;

      // Theme name
      if (themeName) {
        md.appendMarkdown(`**Theme:** ${themeName}\n\n`);
      }

      // Tint mode
      const themeLabel = getThemeModeLabel(tintType, themeAutoDetected);
      md.appendMarkdown(`**Tint Mode:** ${themeLabel}\n\n`);

      // Color scheme
      const schemeLabel = capitalizeFirst(colorScheme);
      md.appendMarkdown(`**Color Scheme:** ${schemeLabel}\n\n`);

      // Seed
      md.appendMarkdown(`**Seed:** \`${state.seed}\`\n\n`);

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
