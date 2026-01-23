import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getThemeConfig,
  getWorkspaceIdentifierConfig,
  getWorkspaceModify,
  setWorkspaceModify,
  getTintConfig,
  isEnabled,
} from '../../config';

suite('isEnabled', () => {
  let originalEnabled: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalEnabled = config.get<boolean>('enabled');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', originalEnabled, vscode.ConfigurationTarget.Global);
  });

  test('returns true by default', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', undefined, vscode.ConfigurationTarget.Global);

    const result = isEnabled();
    assert.strictEqual(result, true);
  });

  test('returns configured value when set to false', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', false, vscode.ConfigurationTarget.Global);

    const result = isEnabled();
    assert.strictEqual(result, false);
  });

  test('returns configured value when set to true', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);

    const result = isEnabled();
    assert.strictEqual(result, true);
  });
});

suite('getWorkspaceModify', () => {
  let originalValue: boolean | undefined;

  suiteSetup(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('workspace.modify');
    originalValue = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspace.modify',
      originalValue,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test('returns undefined when not set', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspace.modify',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getWorkspaceModify();
    assert.strictEqual(result, undefined);
  });

  test('returns true when set to true', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspace.modify',
      true,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getWorkspaceModify();
    assert.strictEqual(result, true);
  });

  test('returns false when set to false', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspace.modify',
      false,
      vscode.ConfigurationTarget.Workspace
    );

    const result = getWorkspaceModify();
    assert.strictEqual(result, false);
  });

  test('ignores global-level settings', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    // Clear workspace-level value
    await config.update(
      'workspace.modify',
      undefined,
      vscode.ConfigurationTarget.Workspace
    );
    // Set global-level value
    await config.update(
      'workspace.modify',
      true,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceModify();
    assert.strictEqual(result, undefined);

    // Clean up global setting
    await config.update(
      'workspace.modify',
      undefined,
      vscode.ConfigurationTarget.Global
    );
  });
});

suite('setWorkspaceModify', () => {
  let originalValue: boolean | undefined;

  suiteSetup(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('workspace.modify');
    originalValue = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspace.modify',
      originalValue,
      vscode.ConfigurationTarget.Workspace
    );
  });

  test('writes true to workspace scope', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setWorkspaceModify(true);

    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('workspace.modify');
    assert.strictEqual(inspection?.workspaceValue, true);
  });

  test('writes false to workspace scope', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setWorkspaceModify(false);

    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('workspace.modify');
    assert.strictEqual(inspection?.workspaceValue, false);
  });

  test('writes undefined to workspace scope', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    // First set a value
    await setWorkspaceModify(true);
    // Then clear it
    await setWorkspaceModify(undefined);

    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('workspace.modify');
    assert.strictEqual(inspection?.workspaceValue, undefined);
  });
});

suite('getWorkspaceIdentifierConfig', () => {
  // Store original config values to restore after tests
  let originalSource: string | undefined;
  let originalCustomBasePath: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalSource = config.get<string>('workspaceIdentifier.source');
    originalCustomBasePath = config.get<string>(
      'workspaceIdentifier.customBasePath'
    );
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
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
  });

  test('returns default source as name when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'name');
  });

  test('reads configured source value', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      'pathAbsolute',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathAbsolute');
  });

  test('reads customBasePath value', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.customBasePath',
      '~/Projects',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.customBasePath, '~/Projects');
  });

  test('falls back to name for invalid source', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      'invalidValue',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'name');
  });

  test('returns empty customBasePath when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.customBasePath',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.customBasePath, '');
  });

  test('reads pathRelativeToHome source', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      'pathRelativeToHome',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToHome');
  });

  test('reads pathRelativeToCustom source', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      'pathRelativeToCustom',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToCustom');
  });
});

suite('getTintConfig', () => {
  let originalTitleBar: boolean | undefined;
  let originalStatusBar: boolean | undefined;
  let originalActivityBar: boolean | undefined;
  let originalMode: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalTitleBar = config.get<boolean>('elements.titleBar');
    originalStatusBar = config.get<boolean>('elements.statusBar');
    originalActivityBar = config.get<boolean>('elements.activityBar');
    originalMode = config.get<string>('tint.mode');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
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
      'tint.mode',
      originalMode,
      vscode.ConfigurationTarget.Global
    );
  });

  test('defaults to titleBar when all targets disabled', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'elements.titleBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['titleBar']);
  });

  test('returns only titleBar when only titleBar enabled', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['titleBar']);
  });

  test('returns only statusBar when only statusBar enabled', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'elements.titleBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['statusBar']);
  });

  test('returns only activityBar when only activityBar enabled', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'elements.titleBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      false,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      true,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['activityBar']);
  });

  test('returns multiple targets when multiple enabled', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      false,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(result.targets, ['titleBar', 'statusBar']);
  });

  test('returns all targets when all enabled', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'elements.titleBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.statusBar',
      true,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'elements.activityBar',
      true,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.deepStrictEqual(
      result.targets,
      ['titleBar', 'statusBar', 'activityBar']
    );
  });

  test('defaults to auto mode when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.mode',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'auto');
  });

  test('reads configured mode value', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('tint.mode', 'light', vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'light');
  });

  test('accepts dark mode', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('tint.mode', 'dark', vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'dark');
  });

  test('falls back to auto for invalid mode', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.mode',
      'invalidValue',
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.mode, 'auto');
  });
});

suite('getThemeConfig', () => {
  let originalBlendFactor: number | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalBlendFactor = config.get<number>('theme.blendFactor');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      originalBlendFactor,
      vscode.ConfigurationTarget.Global
    );
  });

  test('defaults to 0.35 when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0.35);
  });

  test('reads configured blendFactor value', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      0.5,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0.5);
  });

  test('clamps blendFactor to minimum 0', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      -0.5,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0);
  });

  test('clamps blendFactor to maximum 1', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      1.5,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 1);
  });

  test('accepts blendFactor of 0', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      0,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 0);
  });

  test('accepts blendFactor of 1', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.blendFactor',
      1,
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeConfig();
    assert.strictEqual(result.blendFactor, 1);
  });
});
