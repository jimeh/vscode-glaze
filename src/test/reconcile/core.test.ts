import * as assert from 'assert';
import * as vscode from 'vscode';
import { doReconcile, _resetAllState, getCachedState } from '../../reconcile';
import {
  PATINA_ACTIVE_KEY,
  PATINA_ACTIVE_VALUE,
} from '../../settings/colorCustomizations';
import { PATINA_MANAGED_KEYS } from '../../theme';

/**
 * Read the current workspace-level colorCustomizations.
 */
function getColorCustomizations(): Record<string, unknown> | undefined {
  return vscode.workspace
    .getConfiguration()
    .get<Record<string, unknown>>('workbench.colorCustomizations');
}

/**
 * Write workspace-level colorCustomizations.
 */
async function setColorCustomizations(
  value: Record<string, unknown> | undefined
): Promise<void> {
  await vscode.workspace
    .getConfiguration()
    .update(
      'workbench.colorCustomizations',
      value,
      vscode.ConfigurationTarget.Workspace
    );
}

suite('doReconcile', () => {
  // Snapshot of config to restore after all tests.
  let originalGlobalEnabled: boolean | undefined;
  let originalWorkspaceEnabled: boolean | undefined;
  let originalColorCustomizations: Record<string, unknown> | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('enabled');
    originalGlobalEnabled = inspection?.globalValue;
    originalWorkspaceEnabled = inspection?.workspaceValue;
    originalColorCustomizations = getColorCustomizations();
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'enabled',
      originalGlobalEnabled,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'enabled',
      originalWorkspaceEnabled,
      vscode.ConfigurationTarget.Workspace
    );
    await setColorCustomizations(originalColorCustomizations);
    _resetAllState();
  });

  setup(async () => {
    _resetAllState();
    // Clear color customizations before each test.
    await setColorCustomizations(undefined);
  });

  /**
   * Enable Patina globally and at workspace scope so
   * doReconcile() proceeds to apply colors.
   */
  async function enablePatina(): Promise<void> {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    await config.update('enabled', true, vscode.ConfigurationTarget.Workspace);
  }

  /**
   * Disable Patina at workspace scope.
   */
  async function disablePatina(): Promise<void> {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
  }

  test('produces color customizations when enabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enablePatina();
    await doReconcile({ force: true });

    const colors = getColorCustomizations();
    assert.ok(colors, 'colorCustomizations should be set');

    // Patina active marker must be present.
    assert.strictEqual(
      colors[PATINA_ACTIVE_KEY],
      PATINA_ACTIVE_VALUE,
      'patina.active marker should be present'
    );

    // At least some managed keys should be written.
    const managedSet = new Set<string>(PATINA_MANAGED_KEYS);
    const managedKeysPresent = Object.keys(colors).filter((k) =>
      managedSet.has(k)
    );
    assert.ok(
      managedKeysPresent.length > 0,
      'at least one Patina-managed key should be present'
    );
  });

  test('clears colors when disabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    // First apply colors.
    await enablePatina();
    await doReconcile({ force: true });

    // Verify they were written.
    const before = getColorCustomizations();
    assert.ok(before, 'colors should exist before disable');

    // Disable and reconcile again.
    await disablePatina();
    await doReconcile({ force: true });

    // Managed keys should be gone.
    const after = getColorCustomizations();
    const managedSet = new Set<string>(PATINA_MANAGED_KEYS);
    if (after) {
      const remaining = Object.keys(after).filter((k) => managedSet.has(k));
      assert.strictEqual(
        remaining.length,
        0,
        'no Patina-managed keys should remain after disable'
      );
      assert.strictEqual(
        after[PATINA_ACTIVE_KEY],
        undefined,
        'patina.active marker should be removed'
      );
    }
  });

  test('updates cached state after reconcile', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enablePatina();
    await doReconcile({ force: true });

    const state = getCachedState();
    assert.ok(
      state.workspaceIdentifier,
      'workspaceIdentifier should be populated'
    );
    assert.ok(state.tintColors, 'tintColors should be populated');
    assert.strictEqual(
      state.customizedOutsidePatina,
      false,
      'customizedOutsidePatina should be false'
    );
    assert.strictEqual(
      state.lastError,
      undefined,
      'lastError should be undefined'
    );
  });

  test('force reconcile writes even with same state', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enablePatina();
    await doReconcile({ force: true });

    const first = getColorCustomizations();
    assert.ok(first, 'first reconcile should produce colors');

    // Second reconcile with force should also succeed and
    // produce the same output (no error, state intact).
    await doReconcile({ force: true });

    const second = getColorCustomizations();
    assert.ok(second, 'second reconcile should produce colors');
    assert.deepStrictEqual(
      second,
      first,
      'force reconcile should produce identical colors'
    );

    // Cached state should still be valid.
    const state = getCachedState();
    assert.ok(state.workspaceIdentifier);
    assert.ok(state.tintColors);
  });

  test('preserves non-Patina customizations', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    // Set a custom non-Patina color first.
    await setColorCustomizations({
      'editor.foreground': '#abcdef',
    });

    await enablePatina();
    await doReconcile({ force: true });

    const colors = getColorCustomizations();
    assert.ok(colors, 'colorCustomizations should be set');
    assert.strictEqual(
      colors['editor.foreground'],
      '#abcdef',
      'non-Patina editor.foreground should be preserved'
    );
    assert.strictEqual(
      colors[PATINA_ACTIVE_KEY],
      PATINA_ACTIVE_VALUE,
      'patina.active marker should still be present'
    );
  });

  test('clears cached state when disabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enablePatina();
    await doReconcile({ force: true });

    // Verify state is populated.
    const before = getCachedState();
    assert.ok(before.workspaceIdentifier);

    // Disable and reconcile.
    await disablePatina();
    await doReconcile({ force: true });

    const after = getCachedState();
    assert.strictEqual(
      after.workspaceIdentifier,
      undefined,
      'workspaceIdentifier should be cleared after disable'
    );
    assert.strictEqual(
      after.tintColors,
      undefined,
      'tintColors should be cleared after disable'
    );
  });
});
