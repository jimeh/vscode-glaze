import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getColorScheme,
  getStatusBarEnabled,
  getThemeConfig,
  getWorkspaceIdentifierConfig,
  getTintConfig,
  isGloballyEnabled,
  isEnabledForWorkspace,
  getWorkspaceEnabledOverride,
  setEnabledForWorkspace,
} from '../../config';

suite('isGloballyEnabled', () => {
  let originalEnabled: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalEnabled = config.get<boolean>('enabled');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'enabled',
      originalEnabled,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns false by default', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'enabled',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = isGloballyEnabled();
    assert.strictEqual(result, false);
  });

  test('returns configured value when set to false', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', false, vscode.ConfigurationTarget.Global);

    const result = isGloballyEnabled();
    assert.strictEqual(result, false);
  });

  test('returns configured value when set to true', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);

    const result = isGloballyEnabled();
    assert.strictEqual(result, true);
  });
});

suite('isEnabledForWorkspace', () => {
  let originalGlobalEnabled: boolean | undefined;
  let originalWorkspaceEnabled: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('enabled');
    originalGlobalEnabled = inspection?.globalValue;
    originalWorkspaceEnabled = inspection?.workspaceValue;
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
  });

  test('returns global value when no workspace override', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    await config.update(
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
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', false, vscode.ConfigurationTarget.Global);
    await config.update('enabled', true, vscode.ConfigurationTarget.Workspace);

    const result = isEnabledForWorkspace();
    assert.strictEqual(result, true);
  });

  test('workspace override takes precedence (false over true)', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);

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
    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('enabled');
    originalWorkspaceEnabled = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('patina');
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
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
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
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', true, vscode.ConfigurationTarget.Workspace);

    const result = getWorkspaceEnabledOverride();
    assert.strictEqual(result, true);
  });

  test('returns false when workspace override is false', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('enabled', false, vscode.ConfigurationTarget.Workspace);

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
    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('enabled');
    originalWorkspaceEnabled = inspection?.workspaceValue;
  });

  suiteTeardown(async () => {
    if (!vscode.workspace.workspaceFolders?.length) {
      return;
    }
    const config = vscode.workspace.getConfiguration('patina');
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

    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('enabled');
    assert.strictEqual(inspection?.workspaceValue, true);
  });

  test('writes false to workspace scope', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setEnabledForWorkspace(false);

    const config = vscode.workspace.getConfiguration('patina');
    const inspection = config.inspect<boolean>('enabled');
    assert.strictEqual(inspection?.workspaceValue, false);
  });

  test('clears workspace scope when undefined', async function () {
    if (!vscode.workspace.workspaceFolders?.length) {
      return this.skip();
    }
    await setEnabledForWorkspace(true);
    await setEnabledForWorkspace(undefined);

    const config = vscode.workspace.getConfiguration('patina');
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
    const config = vscode.workspace.getConfiguration('patina');
    originalSource = config.get<string>('workspaceIdentifier.source');
    originalCustomBasePath = config.get<string>(
      'workspaceIdentifier.customBasePath'
    );
    originalMultiRootSource = config.get<string>(
      'workspaceIdentifier.multiRootSource'
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
    await config.update(
      'workspaceIdentifier.multiRootSource',
      originalMultiRootSource,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns default source as pathRelativeToHome when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToHome');
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

  test('falls back to pathRelativeToHome for invalid source', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.source',
      'invalidValue',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.source, 'pathRelativeToHome');
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

  test('returns default multiRootSource as workspaceFile when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.multiRootSource',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'workspaceFile');
  });

  test('reads configured multiRootSource value (allFolders)', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.multiRootSource',
      'allFolders',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'allFolders');
  });

  test('reads configured multiRootSource value (firstFolder)', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'workspaceIdentifier.multiRootSource',
      'firstFolder',
      vscode.ConfigurationTarget.Global
    );

    const result = getWorkspaceIdentifierConfig();
    assert.strictEqual(result.multiRootSource, 'firstFolder');
  });

  test('falls back to workspaceFile for invalid multiRootSource', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
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
  let originalMode: string | undefined;
  let originalSeed: number | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalTitleBar = config.get<boolean>('elements.titleBar');
    originalStatusBar = config.get<boolean>('elements.statusBar');
    originalActivityBar = config.get<boolean>('elements.activityBar');
    originalMode = config.get<string>('tint.mode');
    originalSeed = config.get<number>('tint.seed');
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
    await config.update(
      'tint.seed',
      originalSeed,
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
    assert.deepStrictEqual(result.targets, [
      'titleBar',
      'statusBar',
      'activityBar',
    ]);
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
    await config.update(
      'tint.mode',
      'light',
      vscode.ConfigurationTarget.Global
    );

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

  test('defaults to seed 0 when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.seed',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.seed, 0);
  });

  test('reads configured seed value', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('tint.seed', 42, vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.seed, 42);
  });

  test('accepts negative seed values', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('tint.seed', -100, vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.seed, -100);
  });

  test('accepts large seed values', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.seed',
      999999999,
      vscode.ConfigurationTarget.Global
    );

    const result = getTintConfig();
    assert.strictEqual(result.seed, 999999999);
  });

  test('falls back to 0 for non-integer seed', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('tint.seed', 3.14, vscode.ConfigurationTarget.Global);

    const result = getTintConfig();
    assert.strictEqual(result.seed, 0);
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

suite('getColorScheme', () => {
  let originalColorScheme: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalColorScheme = config.get<string>('tint.colorScheme');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      originalColorScheme,
      vscode.ConfigurationTarget.Global
    );
  });

  test('defaults to pastel when not configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'pastel');
  });

  test('returns pastel when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      'pastel',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'pastel');
  });

  test('returns vibrant when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      'vibrant',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'vibrant');
  });

  test('returns muted when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      'muted',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'muted');
  });

  test('returns tinted when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      'tinted',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'tinted');
  });

  test('returns neon when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      'neon',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'neon');
  });

  test('falls back to pastel for invalid scheme', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'tint.colorScheme',
      'invalid',
      vscode.ConfigurationTarget.Global
    );
    const result = getColorScheme();
    assert.strictEqual(result, 'pastel');
  });
});

suite('getStatusBarEnabled', () => {
  let originalValue: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalValue = config.get<boolean>('statusBar.enabled');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'statusBar.enabled',
      originalValue,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns false by default', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'statusBar.enabled',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    const result = getStatusBarEnabled();
    assert.strictEqual(result, false);
  });

  test('returns true when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'statusBar.enabled',
      true,
      vscode.ConfigurationTarget.Global
    );
    const result = getStatusBarEnabled();
    assert.strictEqual(result, true);
  });

  test('returns false when configured', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'statusBar.enabled',
      false,
      vscode.ConfigurationTarget.Global
    );
    const result = getStatusBarEnabled();
    assert.strictEqual(result, false);
  });
});
