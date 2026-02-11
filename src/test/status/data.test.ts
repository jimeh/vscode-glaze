import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildStatusState } from '../../status/data';
import { updateConfig } from '../helpers';
import { _resetAllState } from '../../reconcile';

suite('buildStatusState', () => {
  // Snapshot config to restore after all tests.
  let originalGlobalEnabled: boolean | undefined;
  let originalWorkspaceEnabled: boolean | undefined;
  let originalBaseHueOverride: number | null | undefined;
  let originalSeed: number | undefined;
  let originalColorStyle: string | undefined;
  let originalColorHarmony: string | undefined;
  let originalTitleBar: boolean | undefined;
  let originalStatusBar: boolean | undefined;
  let originalActivityBar: boolean | undefined;
  let originalSideBar: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    const enabledInspection = config.inspect<boolean>('enabled');
    originalGlobalEnabled = enabledInspection?.globalValue;
    originalWorkspaceEnabled = enabledInspection?.workspaceValue;

    const hueInspection = config.inspect<number | null>('tint.baseHueOverride');
    originalBaseHueOverride = hueInspection?.workspaceValue;

    originalSeed = config.get<number>('tint.seed');
    originalColorStyle = config.get<string>('tint.colorStyle');
    originalColorHarmony = config.get<string>('tint.colorHarmony');
    originalTitleBar = config.get<boolean>('elements.titleBar');
    originalStatusBar = config.get<boolean>('elements.statusBar');
    originalActivityBar = config.get<boolean>('elements.activityBar');
    originalSideBar = config.get<boolean>('elements.sideBar');
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
    await config.update(
      'tint.baseHueOverride',
      originalBaseHueOverride,
      vscode.ConfigurationTarget.Workspace
    );
    await config.update(
      'tint.seed',
      originalSeed,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'tint.colorStyle',
      originalColorStyle,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'tint.colorHarmony',
      originalColorHarmony,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.titleBar',
      originalTitleBar,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      originalStatusBar,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      originalActivityBar,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.sideBar',
      originalSideBar,
      vscode.ConfigurationTarget.Global
    );
    _resetAllState();
  });

  setup(async () => {
    _resetAllState();
  });

  /**
   * Enable Glaze globally and at workspace scope.
   */
  async function enableGlaze(): Promise<void> {
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Global);
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Workspace);
  }

  test('returns a StatusState with general and colors fields', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    const state = await buildStatusState();

    assert.ok(state, 'state should be defined');
    assert.ok(state.general, 'state.general should be defined');
    assert.ok(Array.isArray(state.colors), 'state.colors should be an array');
  });

  test('general.globalEnabled reflects config', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await updateConfig('enabled', true, vscode.ConfigurationTarget.Global);
    let state = await buildStatusState();
    assert.strictEqual(state.general.globalEnabled, true);

    await updateConfig('enabled', false, vscode.ConfigurationTarget.Global);
    state = await buildStatusState();
    assert.strictEqual(state.general.globalEnabled, false);
  });

  test('general.workspaceEnabled reflects workspace override', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await updateConfig('enabled', true, vscode.ConfigurationTarget.Workspace);
    let state = await buildStatusState();
    assert.strictEqual(state.general.workspaceEnabled, true);

    await updateConfig('enabled', false, vscode.ConfigurationTarget.Workspace);
    state = await buildStatusState();
    assert.strictEqual(state.general.workspaceEnabled, false);

    await updateConfig(
      'enabled',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );
    state = await buildStatusState();
    assert.strictEqual(state.general.workspaceEnabled, undefined);
  });

  test('general.active is true when enabled + identifier + targets', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    // Ensure at least one target is enabled.
    await updateConfig(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );

    const state = await buildStatusState();
    assert.strictEqual(
      state.general.active,
      true,
      'should be active when enabled with identifier and targets'
    );
  });

  test('general.active is false when disabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await updateConfig('enabled', false, vscode.ConfigurationTarget.Global);
    await updateConfig(
      'enabled',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    const state = await buildStatusState();
    assert.strictEqual(
      state.general.active,
      false,
      'should not be active when disabled'
    );
  });

  test('general.baseHue uses baseHueOverride when set', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'tint.baseHueOverride',
      180,
      vscode.ConfigurationTarget.Workspace
    );

    const state = await buildStatusState();
    assert.strictEqual(
      state.general.baseHue,
      180,
      'baseHue should match the override value'
    );
    assert.strictEqual(
      state.general.baseHueOverride,
      180,
      'baseHueOverride should be set'
    );
  });

  test('general.baseHue computes from identifier when no override', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'tint.baseHueOverride',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    const state = await buildStatusState();
    assert.strictEqual(
      state.general.baseHueOverride,
      null,
      'baseHueOverride should be null'
    );
    // baseHue should be a number computed from identifier
    assert.strictEqual(typeof state.general.baseHue, 'number');
    assert.ok(
      state.general.baseHue >= 0 && state.general.baseHue < 360,
      'baseHue should be in [0, 360)'
    );
  });

  test('general.colorStyle and colorHarmony reflect config', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();

    const state = await buildStatusState();
    // Should return valid string values (defaults or configured).
    assert.strictEqual(typeof state.general.colorStyle, 'string');
    assert.strictEqual(typeof state.general.colorHarmony, 'string');
    assert.ok(
      state.general.colorStyle.length > 0,
      'colorStyle should not be empty'
    );
    assert.ok(
      state.general.colorHarmony.length > 0,
      'colorHarmony should not be empty'
    );
  });

  test('general.targets reflects enabled elements', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    await updateConfig(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.statusBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.activityBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.sideBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const state = await buildStatusState();
    assert.ok(
      state.general.targets.includes('titleBar'),
      'targets should include titleBar'
    );
    assert.ok(
      !state.general.targets.includes('statusBar'),
      'targets should not include statusBar'
    );
    assert.ok(
      state.general.targets.includes('activityBar'),
      'targets should include activityBar'
    );
    assert.ok(
      !state.general.targets.includes('sideBar'),
      'targets should not include sideBar'
    );
  });

  test('general.seed reflects config', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    await updateConfig('tint.seed', 42, vscode.ConfigurationTarget.Global);

    const state = await buildStatusState();
    assert.strictEqual(
      state.general.seed,
      42,
      'seed should match config value'
    );
  });

  test('general.themeColorsAvailable is boolean', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    const state = await buildStatusState();
    assert.strictEqual(
      typeof state.general.themeColorsAvailable,
      'boolean',
      'themeColorsAvailable should be a boolean'
    );
  });

  test('general.customizedOutsideGlaze is boolean', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    const state = await buildStatusState();
    assert.strictEqual(
      typeof state.general.customizedOutsideGlaze,
      'boolean',
      'customizedOutsideGlaze should be a boolean'
    );
  });

  test('colors array has entries with valid hex values', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    // Ensure at least one target enabled.
    await updateConfig(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );

    const state = await buildStatusState();
    assert.ok(state.colors.length > 0, 'colors should not be empty');

    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const entry of state.colors) {
      assert.ok(entry.key, 'entry should have a key');
      assert.match(
        entry.tintHex,
        hexPattern,
        `tintHex for ${entry.key} should be valid hex`
      );
      assert.match(
        entry.finalHex,
        hexPattern,
        `finalHex for ${entry.key} should be valid hex`
      );
    }
  });

  test('general.active is false when no targets enabled', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }

    await enableGlaze();
    // Disable all targets.
    await updateConfig(
      'elements.titleBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.statusBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.sideBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const state = await buildStatusState();
    assert.strictEqual(
      state.general.active,
      false,
      'should not be active when no targets are enabled'
    );
    assert.deepStrictEqual(
      state.general.targets,
      [],
      'targets should be empty'
    );
  });
});
