import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getBaseHueOverride,
  getBlendMethod,
  getColorHarmony,
  getColorStyle,
  getStatusBarEnabled,
  getThemeConfig,
  getWorkspaceIdentifierConfig,
  getTintConfig,
  isGloballyEnabled,
  isEnabledForWorkspace,
  getWorkspaceEnabledOverride,
  setEnabledForWorkspace,
} from '../../config';
import { updateConfig } from '../helpers';

suite('isGloballyEnabled', () => {
  let originalEnabled: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalEnabled = config.get<boolean>('enabled');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'enabled',
      originalEnabled,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns false by default', async () => {
    await updateConfig('enabled', undefined, vscode.ConfigurationTarget.Global);

    const result = isGloballyEnabled();
    assert.strictEqual(result, false);
  });

  test('returns configured value when set to false', async () => {
    await updateConfig('enabled', false, vscode.ConfigurationTarget.Global);

    const result = isGloballyEnabled();
    assert.strictEqual(result, false);
  });

  test('returns configured value when set to true', async () => {
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Global);

    const result = isGloballyEnabled();
    assert.strictEqual(result, true);
  });
});

suite('isEnabledForWorkspace', () => {
  let originalGlobalEnabled: boolean | undefined;
  let originalWorkspaceEnabled: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    originalGlobalEnabled = inspection?.globalValue;
    originalWorkspaceEnabled = inspection?.workspaceValue;
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
  });

  test('returns global value when no workspace override', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Global);
    await updateConfig(
      'enabled',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    const result = isEnabledForWorkspace();
    assert.strictEqual(result, true);
  });

  test('workspace override takes precedence (true over false)', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig('enabled', false, vscode.ConfigurationTarget.Global);
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Workspace);

    const result = isEnabledForWorkspace();
    assert.strictEqual(result, true);
  });

  test('workspace override takes precedence (false over true)', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Global);
    await updateConfig('enabled', false, vscode.ConfigurationTarget.Workspace);

    const result = isEnabledForWorkspace();
    assert.strictEqual(result, false);
  });
});

suite('getWorkspaceEnabledOverride', () => {
  let originalWorkspaceEnabled: boolean | undefined;

  suiteSetup(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    originalWorkspaceEnabled = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'enabled',
      originalWorkspaceEnabled,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test('returns undefined when no workspace override', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig(
      'enabled',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getWorkspaceEnabledOverride();
    assert.strictEqual(result, undefined);
  });

  test('returns true when workspace override is true', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig('enabled', true, vscode.ConfigurationTarget.Workspace);

    const result = getWorkspaceEnabledOverride();
    assert.strictEqual(result, true);
  });

  test('returns false when workspace override is false', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig('enabled', false, vscode.ConfigurationTarget.Workspace);

    const result = getWorkspaceEnabledOverride();
    assert.strictEqual(result, false);
  });
});

suite('setEnabledForWorkspace', () => {
  let originalWorkspaceEnabled: boolean | undefined;

  suiteSetup(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    originalWorkspaceEnabled = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'enabled',
      originalWorkspaceEnabled,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test('writes true to workspace scope', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setEnabledForWorkspace(true);

    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    assert.strictEqual(inspection?.workspaceValue, true);
  });

  test('writes false to workspace scope', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setEnabledForWorkspace(false);

    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    assert.strictEqual(inspection?.workspaceValue, false);
  });

  test('clears workspace scope when undefined', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setEnabledForWorkspace(true);
    await setEnabledForWorkspace(undefined);

    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<boolean>('enabled');
    assert.strictEqual(inspection?.workspaceValue, undefined);
  });
});

suite('getWorkspaceIdentifierConfig', () => {
  // Store original config values to restore after tests
  let originalSource: string | undefined;
  let originalCustomBasePath: string | undefined;
  let originalMultiRootSource: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalSource = config.get<string>('workspaceIdentifier.source');
    originalCustomBasePath = config.get<string>(
      'workspaceIdentifier.customBasePath'
    );
    originalMultiRootSource = config.get<string>(
      'workspaceIdentifier.multiRootSource'
    );
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'workspaceIdentifier.source',
      originalSource,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'workspaceIdentifier.customBasePath',
      originalCustomBasePath,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'workspaceIdentifier.multiRootSource',
      originalMultiRootSource,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns default source as pathRelativeToHome when not configured', async () => {
    await updateConfig(
      'workspaceIdentifier.source',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToHome');
  });

  test('reads configured source value', async () => {
    await updateConfig(
      'workspaceIdentifier.source',
      'pathAbsolute',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathAbsolute');
  });

  test('reads customBasePath value', async () => {
    await updateConfig(
      'workspaceIdentifier.customBasePath',
      '~/Projects',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.customBasePath, '~/Projects');
  });

  test('falls back to pathRelativeToHome for invalid source', async () => {
    await updateConfig(
      'workspaceIdentifier.source',
      'invalidValue',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToHome');
  });

  test('returns empty customBasePath when not configured', async () => {
    await updateConfig(
      'workspaceIdentifier.customBasePath',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.customBasePath, '');
  });

  test('reads pathRelativeToHome source', async () => {
    await updateConfig(
      'workspaceIdentifier.source',
      'pathRelativeToHome',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToHome');
  });

  test('reads pathRelativeToCustom source', async () => {
    await updateConfig(
      'workspaceIdentifier.source',
      'pathRelativeToCustom',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToCustom');
  });

  test('returns default multiRootSource as workspaceFile when not configured', async () => {
    await updateConfig(
      'workspaceIdentifier.multiRootSource',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'workspaceFile');
  });

  test('reads configured multiRootSource value (allFolders)', async () => {
    await updateConfig(
      'workspaceIdentifier.multiRootSource',
      'allFolders',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'allFolders');
  });

  test('reads configured multiRootSource value (firstFolder)', async () => {
    await updateConfig(
      'workspaceIdentifier.multiRootSource',
      'firstFolder',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'firstFolder');
  });

  test('falls back to workspaceFile for invalid multiRootSource', async () => {
    await updateConfig(
      'workspaceIdentifier.multiRootSource',
      'invalidValue',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'workspaceFile');
  });
});

suite('getTintConfig', () => {
  let originalTitleBar: boolean | undefined;
  let originalStatusBar: boolean | undefined;
  let originalActivityBar: boolean | undefined;
  let originalSideBar: boolean | undefined;
  let originalMode: string | undefined;
  let originalSeed: number | undefined;
  let originalBaseHueOverride: number | null | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalTitleBar = config.get<boolean>('elements.titleBar');
    originalStatusBar = config.get<boolean>('elements.statusBar');
    originalActivityBar = config.get<boolean>('elements.activityBar');
    originalSideBar = config.get<boolean>('elements.sideBar');
    originalMode = config.get<string>('tint.mode');
    originalSeed = config.get<number>('tint.seed');
    originalBaseHueOverride = config.get<number | null>('tint.baseHueOverride');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
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
    await config.update(
      'tint.mode',
      originalMode,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'tint.seed',
      originalSeed,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'tint.baseHueOverride',
      originalBaseHueOverride,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns default-enabled targets by default', async () => {
    await updateConfig(
      'elements.titleBar',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.statusBar',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.activityBar',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.sideBar',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    // sideBar defaults to false, so not included
    assert.deepStrictEqual(result.targets, [
      'titleBar',
      'statusBar',
      'activityBar',
    ]);
  });

  test('returns empty targets when all elements disabled', async () => {
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

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, []);
  });

  test('returns only titleBar when only titleBar enabled', async () => {
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
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['titleBar']);
  });

  test('returns only statusBar when only statusBar enabled', async () => {
    await updateConfig(
      'elements.titleBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.statusBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['statusBar']);
  });

  test('returns only activityBar when only activityBar enabled', async () => {
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
      true,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['activityBar']);
  });

  test('returns multiple targets when multiple enabled', async () => {
    await updateConfig(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.statusBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['titleBar', 'statusBar']);
  });

  test('returns all targets when all enabled', async () => {
    await updateConfig(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.statusBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.activityBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'elements.sideBar',
      true,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, [
      'titleBar',
      'statusBar',
      'activityBar',
      'sideBar',
    ]);
  });

  test('sideBar target appears only when explicitly enabled', async () => {
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
      true,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['sideBar']);
  });

  test('defaults to auto mode when not configured', async () => {
    await updateConfig(
      'tint.mode',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'auto');
  });

  test('reads configured mode value', async () => {
    await updateConfig('tint.mode', 'light', vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'light');
  });

  test('accepts dark mode', async () => {
    await updateConfig('tint.mode', 'dark', vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'dark');
  });

  test('falls back to auto for invalid mode', async () => {
    await updateConfig(
      'tint.mode',
      'invalidValue',
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'auto');
  });

  test('defaults to seed 0 when not configured', async () => {
    await updateConfig(
      'tint.seed',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.seed, 0);
  });

  test('reads configured seed value', async () => {
    await updateConfig('tint.seed', 42, vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.seed, 42);
  });

  test('accepts negative seed values', async () => {
    await updateConfig('tint.seed', -100, vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.seed, -100);
  });

  test('accepts large seed values', async () => {
    await updateConfig(
      'tint.seed',
      999999999,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.seed, 999999999);
  });

  test('falls back to 0 for non-integer seed', async () => {
    await updateConfig('tint.seed', 3.14, vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.seed, 0);
  });

  test('defaults to null baseHueOverride when not configured', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, null);
  });

  test('returns null baseHueOverride when set to null', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      null,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, null);
  });

  test('reads configured baseHueOverride value', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      180,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, 180);
  });

  test('accepts baseHueOverride of 0', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      0,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, 0);
  });

  test('accepts baseHueOverride of 359', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      359,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, 359);
  });

  test('falls back to null for non-integer baseHueOverride', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      3.14,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, null);
  });

  test('falls back to null for negative baseHueOverride', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      -1,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, null);
  });

  test('falls back to null for baseHueOverride >= 360', async () => {
    await updateConfig(
      'tint.baseHueOverride',
      360,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.baseHueOverride, null);
  });
});

suite('getBaseHueOverride', () => {
  let originalValue: number | null | undefined;

  suiteSetup(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<number | null>('tint.baseHueOverride');
    originalValue = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'tint.baseHueOverride',
      originalValue,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test('returns null when no workspace override', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig(
      'tint.baseHueOverride',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getBaseHueOverride();
    assert.strictEqual(result, null);
  });

  test('returns value when workspace override is set', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig(
      'tint.baseHueOverride',
      200,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getBaseHueOverride();
    assert.strictEqual(result, 200);
  });

  test('returns null when workspace override is null', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig(
      'tint.baseHueOverride',
      null,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getBaseHueOverride();
    assert.strictEqual(result, null);
  });

  test('returns 0 when workspace override is 0', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await updateConfig(
      'tint.baseHueOverride',
      0,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getBaseHueOverride();
    assert.strictEqual(result, 0);
  });
});

suite('getBlendMethod', () => {
  let originalBlendMethod: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalBlendMethod = config.get<string>('theme.blendMethod');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'theme.blendMethod',
      originalBlendMethod,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns overlay by default', async () => {
    await updateConfig(
      'theme.blendMethod',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getBlendMethod();
    assert.strictEqual(result, 'overlay');
  });

  test('returns hueShift when configured', async () => {
    await updateConfig(
      'theme.blendMethod',
      'hueShift',
      vscode.ConfigurationTarget.Global
    );

    const result = getBlendMethod();
    assert.strictEqual(result, 'hueShift');
  });

  test('falls back to overlay for invalid value', async () => {
    await updateConfig(
      'theme.blendMethod',
      'bogus',
      vscode.ConfigurationTarget.Global
    );

    const result = getBlendMethod();
    assert.strictEqual(result, 'overlay');
  });

  test('falls back to overlay for prototype key', async () => {
    await updateConfig(
      'theme.blendMethod',
      'toString',
      vscode.ConfigurationTarget.Global
    );

    const result = getBlendMethod();
    assert.strictEqual(result, 'overlay');
  });
});

suite('getThemeConfig', () => {
  let originalBlendMethod: string | undefined;
  let originalBlendFactor: number | undefined;
  let originalTitleBarBlendFactor: number | null | undefined;
  let originalActivityBarBlendFactor: number | null | undefined;
  let originalStatusBarBlendFactor: number | null | undefined;
  let originalSideBarBlendFactor: number | null | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalBlendMethod = config.get<string>('theme.blendMethod');
    originalBlendFactor = config.get<number>('theme.blendFactor');
    originalTitleBarBlendFactor = config.get<number | null>(
      'theme.titleBarBlendFactor'
    );
    originalActivityBarBlendFactor = config.get<number | null>(
      'theme.activityBarBlendFactor'
    );
    originalStatusBarBlendFactor = config.get<number | null>(
      'theme.statusBarBlendFactor'
    );
    originalSideBarBlendFactor = config.get<number | null>(
      'theme.sideBarBlendFactor'
    );
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'theme.blendMethod',
      originalBlendMethod,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'theme.blendFactor',
      originalBlendFactor,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'theme.titleBarBlendFactor',
      originalTitleBarBlendFactor,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'theme.activityBarBlendFactor',
      originalActivityBarBlendFactor,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'theme.statusBarBlendFactor',
      originalStatusBarBlendFactor,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'theme.sideBarBlendFactor',
      originalSideBarBlendFactor,
      vscode.ConfigurationTarget.Global
    );
  });

  test('defaults to 0.35 when not configured', async () => {
    await updateConfig(
      'theme.blendFactor',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0.35);
  });

  test('reads configured blendFactor value', async () => {
    await updateConfig(
      'theme.blendFactor',
      0.5,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0.5);
  });

  test('clamps blendFactor to minimum 0', async () => {
    await updateConfig(
      'theme.blendFactor',
      -0.5,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0);
  });

  test('clamps blendFactor to maximum 1', async () => {
    await updateConfig(
      'theme.blendFactor',
      1.5,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 1);
  });

  test('accepts blendFactor of 0', async () => {
    await updateConfig(
      'theme.blendFactor',
      0,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0);
  });

  test('accepts blendFactor of 1', async () => {
    await updateConfig(
      'theme.blendFactor',
      1,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 1);
  });

  test('returns empty targetBlendFactors when none set', async () => {
    await updateConfig(
      'theme.titleBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.activityBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.statusBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.sideBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.deepStrictEqual(result.targetBlendFactors, {});
  });

  test('reads titleBarBlendFactor when set', async () => {
    await updateConfig(
      'theme.titleBarBlendFactor',
      0.5,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.activityBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.statusBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.targetBlendFactors.titleBar, 0.5);
    assert.strictEqual(result.targetBlendFactors.activityBar, undefined);
    assert.strictEqual(result.targetBlendFactors.statusBar, undefined);
  });

  test('reads all target blend factors when set', async () => {
    await updateConfig(
      'theme.titleBarBlendFactor',
      0.2,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.activityBarBlendFactor',
      0.5,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.statusBarBlendFactor',
      0.8,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.targetBlendFactors.titleBar, 0.2);
    assert.strictEqual(result.targetBlendFactors.activityBar, 0.5);
    assert.strictEqual(result.targetBlendFactors.statusBar, 0.8);
  });

  test('clamps target blend factors to [0,1]', async () => {
    await updateConfig(
      'theme.titleBarBlendFactor',
      -0.5,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.statusBarBlendFactor',
      1.5,
      vscode.ConfigurationTarget.Global
    );
    await updateConfig(
      'theme.activityBarBlendFactor',
      null,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.targetBlendFactors.titleBar, 0);
    assert.strictEqual(result.targetBlendFactors.statusBar, 1);
  });

  test('blendMethod defaults to overlay', async () => {
    await updateConfig(
      'theme.blendMethod',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendMethod, 'overlay');
  });

  test('blendMethod reflects hueShift when configured', async () => {
    await updateConfig(
      'theme.blendMethod',
      'hueShift',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendMethod, 'hueShift');
  });

  test('blendMethod falls back for invalid values', async () => {
    await updateConfig(
      'theme.blendMethod',
      'bogus',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendMethod, 'overlay');
  });
});

suite('getColorStyle', () => {
  let originalColorStyle: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalColorStyle = config.get<string>('tint.colorStyle');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'tint.colorStyle',
      originalColorStyle,
      vscode.ConfigurationTarget.Global
    );
  });

  test('defaults to pastel when not configured', async () => {
    await updateConfig(
      'tint.colorStyle',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'pastel');
  });

  test('returns pastel when configured', async () => {
    await updateConfig(
      'tint.colorStyle',
      'pastel',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'pastel');
  });

  test('returns vibrant when configured', async () => {
    await updateConfig(
      'tint.colorStyle',
      'vibrant',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'vibrant');
  });

  test('returns muted when configured', async () => {
    await updateConfig(
      'tint.colorStyle',
      'muted',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'muted');
  });

  test('returns tinted when configured', async () => {
    await updateConfig(
      'tint.colorStyle',
      'tinted',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'tinted');
  });

  test('returns neon when configured', async () => {
    await updateConfig(
      'tint.colorStyle',
      'neon',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'neon');
  });

  test('falls back to pastel for invalid style', async () => {
    await updateConfig(
      'tint.colorStyle',
      'invalid',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorStyle();
    assert.strictEqual(result, 'pastel');
  });
});

suite('getColorHarmony', () => {
  let originalColorHarmony: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalColorHarmony = config.get<string>('tint.colorHarmony');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'tint.colorHarmony',
      originalColorHarmony,
      vscode.ConfigurationTarget.Global
    );
  });

  test('defaults to uniform when not configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'uniform');
  });

  test('returns uniform when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'uniform',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'uniform');
  });

  test('returns duotone when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'duotone',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'duotone');
  });

  test('returns undercurrent when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'undercurrent',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'undercurrent');
  });

  test('returns analogous when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'analogous',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'analogous');
  });

  test('returns triadic when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'triadic',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'triadic');
  });

  test('returns split-complementary when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'split-complementary',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'split-complementary');
  });

  test('returns tetradic when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'tetradic',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'tetradic');
  });

  test('returns gradient when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'gradient',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'gradient');
  });

  test('returns accent when configured', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'accent',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'accent');
  });

  test('falls back to uniform for invalid harmony', async () => {
    await updateConfig(
      'tint.colorHarmony',
      'invalid',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorHarmony();
    assert.strictEqual(result, 'uniform');
  });
});

suite('getStatusBarEnabled', () => {
  let originalValue: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    originalValue = config.get<boolean>('statusBar.enabled');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'statusBar.enabled',
      originalValue,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns true by default', async () => {
    await updateConfig(
      'statusBar.enabled',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    const result = getStatusBarEnabled();
    assert.strictEqual(result, true);
  });

  test('returns true when configured', async () => {
    await updateConfig(
      'statusBar.enabled',
      true,
      vscode.ConfigurationTarget.Global
    );
    const result = getStatusBarEnabled();
    assert.strictEqual(result, true);
  });

  test('returns false when configured', async () => {
    await updateConfig(
      'statusBar.enabled',
      false,
      vscode.ConfigurationTarget.Global
    );
    const result = getStatusBarEnabled();
    assert.strictEqual(result, false);
  });
});
