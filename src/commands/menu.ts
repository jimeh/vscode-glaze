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

interface MenuItem {
  readonly label: string;
  readonly description: string;
  readonly command: string;
  /** When omitted the item is always visible. */
  readonly when?: () => boolean;
}

interface MenuGroup {
  readonly separator: string;
  readonly items: readonly MenuItem[];
}

interface ActionableQuickPickItem extends vscode.QuickPickItem {
  readonly command?: string;
}

// ── Menu definition ────────────────────────────────────────────

function buildMenuGroups(): readonly MenuGroup[] {
  const { seed } = getTintConfig();
  const baseHueOverride = getBaseHueOverride();
  const effectivelyEnabled = isEnabledForWorkspace();
  const wsOverride = getWorkspaceEnabledOverride();
  const { customizedOutsidePatina } = getCachedState();

  return [
    {
      separator: 'Workspace',
      items: [
        {
          label: '$(warning) Force Apply',
          description: 'Reclaim ownership of color customizations',
          command: 'patina.forceApply',
          when: () => effectivelyEnabled && customizedOutsidePatina,
        },
        {
          label: '$(check) Enable for Workspace',
          description: 'Enable Patina for this workspace',
          command: 'patina.enableWorkspace',
          when: () => !effectivelyEnabled,
        },
        {
          label: '$(circle-slash) Disable for Workspace',
          description: 'Disable Patina for this workspace',
          command: 'patina.disableWorkspace',
          when: () => effectivelyEnabled,
        },
        {
          label: '$(clear-all) Clear Workspace Setting',
          description: 'Remove workspace override, follow global',
          command: 'patina.clearWorkspaceEnabled',
          when: () => wsOverride !== undefined,
        },
        {
          label: '$(refresh) Randomize Seed',
          description: 'Generate a new random seed',
          command: 'patina.randomizeSeed',
          when: () =>
            effectivelyEnabled &&
            !customizedOutsidePatina &&
            baseHueOverride === null,
        },
        {
          label: '$(discard) Reset Seed',
          description: 'Reset seed to default (0)',
          command: 'patina.resetSeed',
          when: () =>
            effectivelyEnabled &&
            !customizedOutsidePatina &&
            seed !== 0 &&
            baseHueOverride === null,
        },
        {
          label: '$(symbol-color) Set Base Hue Override...',
          description:
            baseHueOverride !== null
              ? `Currently ${baseHueOverride}°`
              : 'Pin a specific hue for this workspace',
          command: 'patina.setBaseHueOverride',
          when: () => effectivelyEnabled && !customizedOutsidePatina,
        },
        {
          label: '$(discard) Clear Base Hue Override',
          description: `Remove override (${baseHueOverride}°)`,
          command: 'patina.clearBaseHueOverride',
          when: () =>
            effectivelyEnabled &&
            !customizedOutsidePatina &&
            baseHueOverride !== null,
        },
      ],
    },
    {
      separator: 'Global',
      items: [
        {
          label: '$(check) Enable Globally',
          description: 'Enable Patina globally',
          command: 'patina.enableGlobally',
          when: () => !isGloballyEnabled(),
        },
        {
          label: '$(circle-slash) Disable Globally',
          description: 'Disable Patina globally',
          command: 'patina.disableGlobally',
          when: () => isGloballyEnabled(),
        },
      ],
    },
  ];
}

// ── QuickPick builder ──────────────────────────────────────────

function buildQuickPickItems(
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

/** Register the Patina quick-menu command. */
export function registerMenuCommands(): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand('patina.quickMenu', async () => {
      const groups = buildMenuGroups();
      const items = buildQuickPickItems(groups);

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Patina',
      });
      if (selected?.command) {
        await vscode.commands.executeCommand(selected.command);
      }
    }),
  ];
}
