import * as assert from 'assert';
import * as vscode from 'vscode';
import { _buildMenuGroups, _buildQuickPickItems } from '../../commands/menu';
import { _resetAllState, updateCachedState } from '../../reconcile';
import { updateConfig } from '../helpers';
import type { ActionableQuickPickItem } from '../../commands/menu';

// ── Helpers ───────────────────────────────────────────────────

/** Return visible (non-separator) command strings from groups. */
function visibleCommands(
  groups: ReturnType<typeof _buildMenuGroups>
): string[] {
  const items = _buildQuickPickItems(groups);
  return items
    .filter(
      (i): i is ActionableQuickPickItem & { command: string } =>
        i.kind !== vscode.QuickPickItemKind.Separator && i.command !== undefined
    )
    .map((i) => i.command);
}

// ── Config helpers ────────────────────────────────────────────

const glazeConfig = () => vscode.workspace.getConfiguration('glaze');

async function setEnabled(global: boolean, workspace?: boolean): Promise<void> {
  await updateConfig('enabled', global, vscode.ConfigurationTarget.Global);
  await updateConfig(
    'enabled',
    workspace,
    vscode.ConfigurationTarget.Workspace
  );
}

async function setSeed(value: number): Promise<void> {
  await updateConfig('tint.seed', value, vscode.ConfigurationTarget.Workspace);
}

async function setBaseHueOverride(value: number | null): Promise<void> {
  await updateConfig(
    'tint.baseHueOverride',
    value === null ? undefined : value,
    vscode.ConfigurationTarget.Workspace
  );
}

// ── Saved originals ───────────────────────────────────────────

let origGlobalEnabled: boolean | undefined;
let origWorkspaceEnabled: boolean | undefined;
let origSeed: number | undefined;
let origBaseHueOverride: number | null | undefined;

suite('Quick Menu visibility', () => {
  suiteSetup(async () => {
    const config = glazeConfig();
    const enabledInsp = config.inspect<boolean>('enabled');
    origGlobalEnabled = enabledInsp?.globalValue;
    origWorkspaceEnabled = enabledInsp?.workspaceValue;
    const seedInsp = config.inspect<number>('tint.seed');
    origSeed = seedInsp?.workspaceValue;
    const hueInsp = config.inspect<number | null>('tint.baseHueOverride');
    origBaseHueOverride = hueInsp?.workspaceValue;
  });

  suiteTeardown(async () => {
    const config = glazeConfig();
    await config.update(
      'enabled',
      origGlobalEnabled,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'enabled',
      origWorkspaceEnabled,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update(
      'tint.seed',
      origSeed,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update(
      'tint.baseHueOverride',
      origBaseHueOverride,
      vscode.ConfigurationTarget.Workspace
    );
    _resetAllState();
  });

  setup(async () => {
    _resetAllState();
    await setEnabled(true);
    await setSeed(0);
    await setBaseHueOverride(null);
  });

  // ── Force Apply ───────────────────────────────────────────

  suite('Force Apply', () => {
    test('visible when enabled and customized outside', async () => {
      await setEnabled(true);
      updateCachedState({ customizedOutsideGlaze: true });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.forceApply'));
    });

    test('hidden when not customized outside', async () => {
      await setEnabled(true);
      updateCachedState({ customizedOutsideGlaze: false });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.forceApply'));
    });

    test('hidden when disabled', async () => {
      await setEnabled(false);
      updateCachedState({ customizedOutsideGlaze: true });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.forceApply'));
    });
  });

  // ── Retry Apply ───────────────────────────────────────────

  suite('Retry Apply', () => {
    test('visible when lastError is set', async () => {
      updateCachedState({ lastError: 'write failed' });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.retryApply'));
    });

    test('hidden when no error', async () => {
      updateCachedState({ lastError: undefined });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.retryApply'));
    });
  });

  // ── Enable / Disable for Workspace ────────────────────────

  suite('Enable/Disable for Workspace', () => {
    test('shows enable when disabled', async () => {
      await setEnabled(false);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.enableWorkspace'));
      assert.ok(!cmds.includes('glaze.disableWorkspace'));
    });

    test('shows disable when enabled', async () => {
      await setEnabled(true);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.enableWorkspace'));
      assert.ok(cmds.includes('glaze.disableWorkspace'));
    });
  });

  // ── Clear Workspace Setting ───────────────────────────────

  suite('Clear Workspace Setting', () => {
    test('visible when workspace override is set', async () => {
      await setEnabled(true, true);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.clearWorkspaceEnabled'));
    });

    test('hidden when no workspace override', async () => {
      await setEnabled(true);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.clearWorkspaceEnabled'));
    });
  });

  // ── Randomize Seed ────────────────────────────────────────

  suite('Randomize Seed', () => {
    test('visible when enabled, no conflict, no error, no hue', async () => {
      await setEnabled(true);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.randomizeSeed'));
    });

    test('hidden when disabled', async () => {
      await setEnabled(false);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.randomizeSeed'));
    });

    test('hidden when customized outside', async () => {
      await setEnabled(true);
      updateCachedState({ customizedOutsideGlaze: true });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.randomizeSeed'));
    });

    test('hidden when lastError is set', async () => {
      await setEnabled(true);
      updateCachedState({ lastError: 'fail' });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.randomizeSeed'));
    });

    test('hidden when baseHueOverride is set', async () => {
      await setEnabled(true);
      await setBaseHueOverride(180);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.randomizeSeed'));
    });
  });

  // ── Reset Seed ────────────────────────────────────────────

  suite('Reset Seed', () => {
    test('visible when seed is non-zero', async () => {
      await setEnabled(true);
      await setSeed(42);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.resetSeed'));
    });

    test('hidden when seed is 0', async () => {
      await setEnabled(true);
      await setSeed(0);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.resetSeed'));
    });

    test('hidden when lastError is set', async () => {
      await setEnabled(true);
      await setSeed(42);
      updateCachedState({ lastError: 'fail' });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.resetSeed'));
    });

    test('hidden when baseHueOverride is set', async () => {
      await setEnabled(true);
      await setSeed(42);
      await setBaseHueOverride(90);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.resetSeed'));
    });
  });

  // ── Set Base Hue Override ─────────────────────────────────

  suite('Set Base Hue Override', () => {
    test('visible when enabled, no conflict, no error', async () => {
      await setEnabled(true);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.setBaseHueOverride'));
    });

    test('hidden when disabled', async () => {
      await setEnabled(false);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.setBaseHueOverride'));
    });

    test('hidden when customized outside', async () => {
      await setEnabled(true);
      updateCachedState({ customizedOutsideGlaze: true });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.setBaseHueOverride'));
    });

    test('hidden when lastError is set', async () => {
      await setEnabled(true);
      updateCachedState({ lastError: 'fail' });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.setBaseHueOverride'));
    });
  });

  // ── Clear Base Hue Override ───────────────────────────────

  suite('Clear Base Hue Override', () => {
    test('visible when hue override is set', async () => {
      await setEnabled(true);
      await setBaseHueOverride(270);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.clearBaseHueOverride'));
    });

    test('hidden when no hue override', async () => {
      await setEnabled(true);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.clearBaseHueOverride'));
    });

    test('hidden when lastError is set', async () => {
      await setEnabled(true);
      await setBaseHueOverride(270);
      updateCachedState({ lastError: 'fail' });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.clearBaseHueOverride'));
    });

    test('hidden when customized outside', async () => {
      await setEnabled(true);
      await setBaseHueOverride(270);
      updateCachedState({ customizedOutsideGlaze: true });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.clearBaseHueOverride'));
    });
  });

  // ── Enable / Disable Globally ─────────────────────────────

  suite('Enable/Disable Globally', () => {
    test('shows enable globally when globally disabled', async () => {
      await updateConfig('enabled', false, vscode.ConfigurationTarget.Global);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(cmds.includes('glaze.enableGlobally'));
      assert.ok(!cmds.includes('glaze.disableGlobally'));
    });

    test('shows disable globally when globally enabled', async () => {
      await updateConfig('enabled', true, vscode.ConfigurationTarget.Global);

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.enableGlobally'));
      assert.ok(cmds.includes('glaze.disableGlobally'));
    });
  });

  // ── Error state hides seed/hue items ──────────────────────

  suite('error state hides seed/hue items', () => {
    const seedHueCommands = [
      'glaze.randomizeSeed',
      'glaze.resetSeed',
      'glaze.setBaseHueOverride',
      'glaze.clearBaseHueOverride',
    ];

    test('all seed/hue items hidden during error', async () => {
      await setEnabled(true);
      await setSeed(42);
      await setBaseHueOverride(180);
      updateCachedState({ lastError: 'write failed' });

      const cmds = visibleCommands(_buildMenuGroups());
      for (const cmd of seedHueCommands) {
        assert.ok(!cmds.includes(cmd), `${cmd} should be hidden during error`);
      }
    });

    test('seed/hue items visible after error clears', async () => {
      await setEnabled(true);
      await setSeed(42);
      await setBaseHueOverride(180);
      updateCachedState({ lastError: 'write failed' });

      // Verify hidden
      let cmds = visibleCommands(_buildMenuGroups());
      assert.ok(!cmds.includes('glaze.setBaseHueOverride'));

      // Clear error
      updateCachedState({ lastError: undefined });
      cmds = visibleCommands(_buildMenuGroups());
      assert.ok(
        cmds.includes('glaze.setBaseHueOverride'),
        'setBaseHueOverride should reappear after error clears'
      );
      assert.ok(
        cmds.includes('glaze.clearBaseHueOverride'),
        'clearBaseHueOverride should reappear after error clears'
      );
    });

    test('retry apply visible but seed/hue hidden', async () => {
      await setEnabled(true);
      await setSeed(42);
      updateCachedState({ lastError: 'fail' });

      const cmds = visibleCommands(_buildMenuGroups());
      assert.ok(
        cmds.includes('glaze.retryApply'),
        'retryApply should be visible'
      );
      assert.ok(
        !cmds.includes('glaze.randomizeSeed'),
        'randomizeSeed should be hidden'
      );
      assert.ok(
        !cmds.includes('glaze.resetSeed'),
        'resetSeed should be hidden'
      );
    });
  });
});
