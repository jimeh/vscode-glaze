import * as assert from 'assert';
import * as vscode from 'vscode';
import { doReconcile, _resetAllState, getCachedState } from '../../reconcile';
import {
  GLAZE_ACTIVE_KEY,
  LEGACY_ACTIVE_KEYS,
} from '../../settings/colorCustomizations';
import { GLAZE_MANAGED_KEYS } from '../../theme';

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

/**
 * Find the Glaze-owned theme block in colorCustomizations.
 * Uses the root `glaze.active` marker to identify which theme block
 * Glaze owns.
 */
function findGlazeThemeBlock(
  colors: Record<string, unknown>
): { key: string; block: Record<string, unknown> } | undefined {
  const marker = colors[GLAZE_ACTIVE_KEY];
  if (typeof marker !== 'string' || marker.length === 0) {
    return undefined;
  }
  const themeKey = `[${marker}]`;
  const value = colors[themeKey];
  if (typeof value === 'object' && value !== null) {
    return { key: themeKey, block: value as Record<string, unknown> };
  }
  return undefined;
}

suite('doReconcile', () => {
  // Snapshot of config to restore after all tests.
  let originalGlobalEnabled: boolean | undefined;
  let originalWorkspaceEnabled: boolean | undefined;
  let originalColorCustomizations: Record<string, unknown> | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    originalGlobalEnabled = inspection?.globalValue;
    originalWorkspaceEnabled = inspection?.workspaceValue;
    originalColorCustomizations = getColorCustomizations();
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
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
   * Enable Glaze globally and at workspace scope so
   * doReconcile() proceeds to apply colors.
   */
  async function enableGlaze(): Promise<void> {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    await config.update('enabled', true, vscode.ConfigurationTarget.Workspace);
  }

  /**
   * Disable Glaze at workspace scope.
   */
  async function disableGlaze(): Promise<void> {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);
  }

  test('produces color customizations in theme-scoped block', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    await doReconcile({ force: true });

    const colors = getColorCustomizations();
    assert.ok(colors, 'colorCustomizations should be set');

    // Find the Glaze-owned theme block.
    const found = findGlazeThemeBlock(colors);
    assert.ok(found, 'a Glaze-owned theme block should exist');

    // Key should be a theme-scoped key like [Theme Name].
    assert.ok(
      found.key.startsWith('[') && found.key.endsWith(']'),
      'theme block key should be theme-scoped'
    );

    // Root-level marker should be a non-empty string (theme name).
    const marker = colors[GLAZE_ACTIVE_KEY];
    assert.ok(
      typeof marker === 'string' && marker.length > 0,
      'glaze.active root marker should be a non-empty string'
    );

    // Marker should NOT be inside the theme block.
    assert.strictEqual(
      found.block[GLAZE_ACTIVE_KEY],
      undefined,
      'glaze.active marker should NOT be inside the theme block'
    );

    // At least some managed keys should be inside the block.
    const managedSet = new Set<string>(GLAZE_MANAGED_KEYS);
    const managedKeysPresent = Object.keys(found.block).filter((k) =>
      managedSet.has(k)
    );
    assert.ok(
      managedKeysPresent.length > 0,
      'at least one Glaze-managed key should be in the theme block'
    );

    // No managed keys at root level.
    const rootManagedKeys = Object.keys(colors).filter((k) =>
      managedSet.has(k)
    );
    assert.strictEqual(
      rootManagedKeys.length,
      0,
      'no Glaze-managed keys should be at root level'
    );
  });

  test('clears colors when disabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    // First apply colors.
    await enableGlaze();
    await doReconcile({ force: true });

    // Verify they were written.
    const before = getColorCustomizations();
    assert.ok(before, 'colors should exist before disable');
    assert.ok(
      findGlazeThemeBlock(before),
      'Glaze theme block should exist before disable'
    );

    // Disable and reconcile again.
    await disableGlaze();
    await doReconcile({ force: true });

    // Glaze theme block should be gone.
    const after = getColorCustomizations();
    if (after) {
      assert.strictEqual(
        findGlazeThemeBlock(after),
        undefined,
        'no Glaze-owned theme block should remain after disable'
      );

      // No root-level managed keys or marker either.
      const managedSet = new Set<string>(GLAZE_MANAGED_KEYS);
      const remaining = Object.keys(after).filter((k) => managedSet.has(k));
      assert.strictEqual(
        remaining.length,
        0,
        'no Glaze-managed keys should remain after disable'
      );
      assert.strictEqual(
        after[GLAZE_ACTIVE_KEY],
        undefined,
        'glaze.active marker should be removed'
      );
    }
  });

  test('updates cached state after reconcile', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    await doReconcile({ force: true });

    const state = getCachedState();
    assert.ok(
      state.workspaceIdentifier,
      'workspaceIdentifier should be populated'
    );
    assert.ok(state.tintColors, 'tintColors should be populated');
    assert.strictEqual(
      state.customizedOutsideGlaze,
      false,
      'customizedOutsideGlaze should be false'
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

    await enableGlaze();
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

  test('preserves non-Glaze customizations', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    // Set a custom non-Glaze color first.
    await setColorCustomizations({
      'editor.foreground': '#abcdef',
    });

    await enableGlaze();
    await doReconcile({ force: true });

    const colors = getColorCustomizations();
    assert.ok(colors, 'colorCustomizations should be set');
    assert.strictEqual(
      colors['editor.foreground'],
      '#abcdef',
      'non-Glaze editor.foreground should be preserved at root'
    );

    // Root marker should be a non-empty string (theme name).
    const found = findGlazeThemeBlock(colors);
    assert.ok(found, 'Glaze theme block should exist');
    const marker = colors[GLAZE_ACTIVE_KEY];
    assert.ok(
      typeof marker === 'string' && marker.length > 0,
      'glaze.active root marker should be a non-empty string'
    );
    // Marker should NOT be inside the theme block.
    assert.strictEqual(
      found.block[GLAZE_ACTIVE_KEY],
      undefined,
      'glaze.active marker should NOT be inside the theme block'
    );
  });

  test('upgrades legacy patina.active marker to glaze.active', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    // Determine the current theme name so we can seed the legacy marker.
    await enableGlaze();
    await doReconcile({ force: true });
    const initial = getColorCustomizations();
    assert.ok(initial, 'initial reconcile should produce colors');
    const themeName = initial[GLAZE_ACTIVE_KEY] as string;
    assert.ok(themeName, 'should have a theme name from initial reconcile');
    const themeKey = `[${themeName}]`;

    // Replace glaze.active with legacy patina.active marker.
    const legacyKey = LEGACY_ACTIVE_KEYS[0];
    const legacyColors: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(initial)) {
      if (key === GLAZE_ACTIVE_KEY) {
        legacyColors[legacyKey] = value;
      } else {
        legacyColors[key] = value;
      }
    }
    await setColorCustomizations(legacyColors);

    // Verify the legacy marker is in place.
    const pre = getColorCustomizations();
    assert.ok(pre, 'pre-reconcile colors should exist');
    assert.ok(pre[legacyKey], 'legacy marker should be set');
    assert.strictEqual(
      pre[GLAZE_ACTIVE_KEY],
      undefined,
      'glaze.active should not exist before reconcile'
    );

    // Reset state so reconcile does a full write.
    _resetAllState();
    await doReconcile({ force: true });

    const after = getColorCustomizations();
    assert.ok(after, 'post-reconcile colors should exist');

    // Legacy marker should be gone, replaced by glaze.active.
    assert.strictEqual(
      after[legacyKey],
      undefined,
      'legacy marker should be removed after reconcile'
    );
    assert.strictEqual(
      after[GLAZE_ACTIVE_KEY],
      themeName,
      'glaze.active should be set to the theme name'
    );

    // Theme block should still contain managed keys.
    const block = after[themeKey] as Record<string, unknown> | undefined;
    assert.ok(block, 'theme block should exist');
    const managedSet = new Set<string>(GLAZE_MANAGED_KEYS);
    const managedKeysPresent = Object.keys(block).filter((k) =>
      managedSet.has(k)
    );
    assert.ok(
      managedKeysPresent.length > 0,
      'managed keys should be present in theme block'
    );
  });

  test('clears cached state when disabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    await doReconcile({ force: true });

    // Verify state is populated.
    const before = getCachedState();
    assert.ok(before.workspaceIdentifier);

    // Disable and reconcile.
    await disableGlaze();
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
