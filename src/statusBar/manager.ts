import * as vscode from 'vscode';
import { getColorName } from '../color';
import { getStatusBarEnabled } from '../config';
import {
  buildColorTable,
  buildPropertiesTable,
  capitalizeFirst,
  escapeForMarkdown,
  formatWorkspaceIdForDisplay,
  getStatusText,
  getThemeModeLabel,
  isTintActive,
} from './helpers';
import type { StatusBarState } from './types';

/**
 * Manages the Patina status bar item.
 */
export class StatusBarManager implements vscode.Disposable {
  readonly item: vscode.StatusBarItem;
  private state: StatusBarState | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = 'patina.quickMenu';
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
    const lastError = this.state?.lastError;

    // Set icon and text
    if (lastError) {
      this.item.text = '$(paintcan) $(error) Error';
    } else if (isActive && customized) {
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

    // Check elements in priority order
    const activeColor =
      tintColors.titleBar ??
      tintColors.activityBar ??
      tintColors.sideBar ??
      tintColors.statusBar;

    if (activeColor) {
      return getColorName(activeColor);
    }

    return 'Patina';
  }

  private isActive(): boolean {
    if (!this.state) {
      return false;
    }
    const {
      globalEnabled,
      workspaceEnabledOverride,
      workspaceIdentifier,
      hasActiveTargets,
    } = this.state;
    return isTintActive(
      globalEnabled,
      workspaceEnabledOverride,
      workspaceIdentifier,
      hasActiveTargets
    );
  }

  private buildTooltip(isActive: boolean): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = {
      enabledCommands: [
        'patina.copyColor',
        'patina.forceApply',
        'patina.showStatus',
        'patina.showColorPreview',
      ],
    };
    md.supportThemeIcons = true;
    md.supportHtml = true;

    if (!this.state) {
      const icon = isActive ? '$(check)' : '$(x)';
      md.appendMarkdown(`**Patina** ${icon}\n\n`);
      return md;
    }
    const state = this.state;
    const { globalEnabled, workspaceEnabledOverride } = state;

    // Header: merged status line
    const statusIcon = isActive ? '$(check)' : '$(x)';
    const statusText = getStatusText(globalEnabled, workspaceEnabledOverride);
    md.appendMarkdown(
      `**Patina** ${statusIcon} ${statusText} ` +
        `[$(info)](command:patina.showStatus)\n\n`
    );

    // Error from last apply/remove attempt
    if (state.lastError) {
      md.appendMarkdown(
        `$(error) **Failed to apply colors:** ` +
          `${escapeForMarkdown(state.lastError)}\n\n`
      );
    }

    // Warning when colors were modified outside Patina
    if (isActive && state.customizedOutsidePatina) {
      md.appendMarkdown(
        '$(warning) **Colors modified outside Patina.** ' +
          'Patina will not overwrite external changes.\n\n' +
          '[Force Apply](command:patina.forceApply) ' +
          'to reclaim ownership.\n\n'
      );
    }

    // Explain why inactive when enabled but missing requirements
    if (!isActive && !state.hasActiveTargets) {
      md.appendMarkdown('$(info) All target elements are disabled.\n\n');
    }

    if (isActive) {
      const {
        themeName,
        tintType,
        themeAutoDetected,
        colorStyle,
        colorHarmony,
        tintColors,
      } = state;

      // Properties table
      const props: Array<readonly [string, string]> = [];

      if (state.workspaceIdentifier) {
        const displayId = formatWorkspaceIdForDisplay(
          state.workspaceIdentifier
        );
        props.push(['Workspace', displayId]);
      }
      if (themeName) {
        props.push(['Theme', escapeForMarkdown(themeName)]);
      }
      props.push(['Tint Mode', getThemeModeLabel(tintType, themeAutoDetected)]);
      props.push(['Style', capitalizeFirst(colorStyle)]);
      props.push(['Harmony', capitalizeFirst(colorHarmony)]);
      props.push(['Seed', `\`${state.seed}\``]);

      md.appendMarkdown(buildPropertiesTable(props) + '\n\n');

      // Colors section with clickable swatches in a table
      if (tintColors) {
        md.appendMarkdown('---\n\n');
        md.appendMarkdown(
          '**Colors** ' + '[$(eye)](command:patina.showColorPreview)\n\n'
        );
        md.appendMarkdown(buildColorTable(tintColors) + '\n\n');
      }
    }

    return md;
  }

  dispose(): void {
    this.item.dispose();
  }
}
