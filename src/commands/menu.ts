import * as vscode from 'vscode';
import {
  getBaseHueOverride,
  getTintConfig,
  getWorkspaceEnabledOverride,
  isEnabledForWorkspace,
  isGloballyEnabled,
} from '../config';
import { getCachedState } from '../reconcile';

// ── Types ──────────────────────────────────────────────────────

export interface MenuItem {
  readonly label: string;
  readonly description: string;
  readonly command: string;
  /** When omitted the item is always visible. */
  readonly when?: () => boolean;
}

export interface MenuGroup {
  readonly separator: string;
  readonly items: readonly MenuItem[];
}

export interface ActionableQuickPickItem extends vscode.QuickPickItem {
  readonly command?: string;
}

// ── Menu definition ────────────────────────────────────────────

/** Exported for testing only. */
export function _buildMenuGroups(): readonly MenuGroup[] {
  const { seed } = getTintConfig();
  const baseHueOverride = getBaseHueOverride();
  const effectivelyEnabled = isEnabledForWorkspace();
  const wsOverride = getWorkspaceEnabledOverride();
  const { customizedOutsideGlaze, lastError } = getCachedState();

  return [
    {
      separator: 'Global',
      items: [
        {
          label: '$(check) Enable Globally',
          description: 'Enable Glaze globally',
          command: 'glaze.enableGlobally',
          when: () => !isGloballyEnabled(),
        },
        {
          label: '$(circle-slash) Disable Globally',
          description: 'Disable Glaze globally',
          command: 'glaze.disableGlobally',
          when: () => isGloballyEnabled(),
        },
      ],
    },
    {
      separator: 'Workspace',
      items: [
        {
          label: '$(warning) Force Apply',
          description: 'Reclaim ownership of color customizations',
          command: 'glaze.forceApply',
          when: () => effectivelyEnabled && customizedOutsideGlaze,
        },
        {
          label: '$(sync) Retry Apply',
          description: 'Retry updating workspace color customizations',
          command: 'glaze.retryApply',
          when: () => lastError !== undefined,
        },
        {
          label: '$(check) Enable for Workspace',
          description: 'Enable Glaze for this workspace',
          command: 'glaze.enableWorkspace',
          when: () => !effectivelyEnabled,
        },
        {
          label: '$(circle-slash) Disable for Workspace',
          description: 'Disable Glaze for this workspace',
          command: 'glaze.disableWorkspace',
          when: () => effectivelyEnabled,
        },
        {
          label: '$(clear-all) Clear Workspace Setting',
          description: 'Remove workspace override, follow global',
          command: 'glaze.clearWorkspaceEnabled',
          when: () => wsOverride !== undefined,
        },
        {
          label: '$(refresh) Randomize Seed',
          description: 'Generate a new random seed',
          command: 'glaze.randomizeSeed',
          when: () =>
            effectivelyEnabled &&
            !customizedOutsideGlaze &&
            !lastError &&
            baseHueOverride === null,
        },
        {
          label: '$(discard) Reset Seed',
          description: 'Reset seed to default (0)',
          command: 'glaze.resetSeed',
          when: () =>
            effectivelyEnabled &&
            !customizedOutsideGlaze &&
            !lastError &&
            seed !== 0 &&
            baseHueOverride === null,
        },
        {
          label: '$(symbol-color) Set Base Hue Override...',
          description:
            baseHueOverride !== null
              ? `Currently ${baseHueOverride}°`
              : 'Pin a specific hue for this workspace',
          command: 'glaze.setBaseHueOverride',
          when: () =>
            effectivelyEnabled && !customizedOutsideGlaze && !lastError,
        },
        {
          label: '$(discard) Clear Base Hue Override',
          description: `Remove override (${baseHueOverride}°)`,
          command: 'glaze.clearBaseHueOverride',
          when: () =>
            effectivelyEnabled &&
            !customizedOutsideGlaze &&
            !lastError &&
            baseHueOverride !== null,
        },
      ],
    },
    {
      separator: 'Panels',
      items: [
        {
          label: '$(eye) Show Color Preview',
          description: 'Open generated color palette preview panel',
          command: 'glaze.showColorPreview',
        },
        {
          label: '$(info) Show Status',
          description: 'Open detailed status and configuration panel',
          command: 'glaze.showStatus',
        },
      ],
    },
  ];
}

// ── QuickPick builder ──────────────────────────────────────────

/** Exported for testing only. */
export function _buildQuickPickItems(
  groups: readonly MenuGroup[]
): ActionableQuickPickItem[] {
  const items: ActionableQuickPickItem[] = [];

  for (const group of groups) {
    const visible = group.items.filter((item) => !item.when || item.when());
    if (visible.length === 0) {
      continue;
    }
    items.push({
      label: group.separator,
      kind: vscode.QuickPickItemKind.Separator,
    });
    for (const item of visible) {
      items.push({
        label: item.label,
        description: item.description,
        command: item.command,
      });
    }
  }

  return items;
}

// ── Command registration ───────────────────────────────────────

/** Register the Glaze quick-menu command. */
export function registerMenuCommands(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('glaze.quickMenu', async () => {
      const groups = _buildMenuGroups();
      const items = _buildQuickPickItems(groups);

      const selected =
        await vscode.window.showQuickPick<ActionableQuickPickItem>(items, {
          placeHolder: 'Glaze',
        });
      if (selected?.command) {
        await vscode.commands.executeCommand(selected.command);
      }
    }),
  ];
}
