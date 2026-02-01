import * as assert from 'assert';
import * as vscode from 'vscode';
import { getThemeName } from '../../theme/name';

suite('getThemeName', () => {
  // Store original config values to restore after tests
  let originalAutoDetect: boolean | undefined;
  let originalPreferredDark: string | undefined;
  let originalPreferredLight: string | undefined;
  let originalColorTheme: string | undefined;

  suiteSetup(async () => {
    const windowConfig = vscode.workspace.getConfiguration('window');
    const workbenchConfig = vscode.workspace.getConfiguration('workbench');
    originalAutoDetect = windowConfig.get<boolean>('autoDetectColorScheme');
    originalPreferredDark = workbenchConfig.get<string>(
      'preferredDarkColorTheme'
    );
    originalPreferredLight = workbenchConfig.get<string>(
      'preferredLightColorTheme'
    );
    originalColorTheme = workbenchConfig.get<string>('colorTheme');
  });

  suiteTeardown(async () => {
    const windowConfig = vscode.workspace.getConfiguration('window');
    const workbenchConfig = vscode.workspace.getConfiguration('workbench');
    await windowConfig.update(
      'autoDetectColorScheme',
      originalAutoDetect,
      vscode.ConfigurationTarget.Global
    );
    await workbenchConfig.update(
      'preferredDarkColorTheme',
      originalPreferredDark,
      vscode.ConfigurationTarget.Global
    );
    await workbenchConfig.update(
      'preferredLightColorTheme',
      originalPreferredLight,
      vscode.ConfigurationTarget.Global
    );
    await workbenchConfig.update(
      'colorTheme',
      originalColorTheme,
      vscode.ConfigurationTarget.Global
    );
  });

  // Helper to set config values for tests
  async function setConfig(opts: {
    autoDetect?: boolean;
    darkTheme?: string;
    lightTheme?: string;
    colorTheme?: string;
  }): Promise<void> {
    const windowConfig = vscode.workspace.getConfiguration('window');
    const workbenchConfig = vscode.workspace.getConfiguration('workbench');

    if (opts.autoDetect !== undefined) {
      await windowConfig.update(
        'autoDetectColorScheme',
        opts.autoDetect,
        vscode.ConfigurationTarget.Global
      );
    }
    if (opts.darkTheme !== undefined) {
      await workbenchConfig.update(
        'preferredDarkColorTheme',
        opts.darkTheme,
        vscode.ConfigurationTarget.Global
      );
    }
    if (opts.lightTheme !== undefined) {
      await workbenchConfig.update(
        'preferredLightColorTheme',
        opts.lightTheme,
        vscode.ConfigurationTarget.Global
      );
    }
    if (opts.colorTheme !== undefined) {
      await workbenchConfig.update(
        'colorTheme',
        opts.colorTheme,
        vscode.ConfigurationTarget.Global
      );
    }
  }

  suite('autoDetectColorScheme disabled', () => {
    test('returns colorTheme regardless of preferred settings', async () => {
      await setConfig({
        autoDetect: false,
        darkTheme: 'Default Dark Modern',
        lightTheme: 'Default Light Modern',
        colorTheme: 'Monokai',
      });

      assert.strictEqual(await getThemeName('dark'), 'Monokai');
      assert.strictEqual(await getThemeName('light'), 'Monokai');
    });

    test('returns colorTheme when no preferred themes set', async () => {
      await setConfig({
        autoDetect: false,
        darkTheme: '',
        lightTheme: '',
        colorTheme: 'Default Dark+',
      });

      assert.strictEqual(await getThemeName('dark'), 'Default Dark+');
      assert.strictEqual(await getThemeName('light'), 'Default Dark+');
    });
  });

  suite('autoDetectColorScheme enabled', () => {
    test('resolves dark theme via quick check with distinct types', async () => {
      // Default Dark Modern = type dark, Default Light Modern = type light
      // Quick check: for themeType 'dark', dark matches and light doesn't
      await setConfig({
        autoDetect: true,
        darkTheme: 'Default Dark Modern',
        lightTheme: 'Default Light Modern',
        colorTheme: 'Monokai',
      });

      assert.strictEqual(await getThemeName('dark'), 'Default Dark Modern');
    });

    test('resolves light theme via quick check with distinct types', async () => {
      await setConfig({
        autoDetect: true,
        darkTheme: 'Default Dark Modern',
        lightTheme: 'Default Light Modern',
        colorTheme: 'Monokai',
      });

      assert.strictEqual(await getThemeName('light'), 'Default Light Modern');
    });

    test('falls back to colorTheme when both preferred are empty', async () => {
      await setConfig({
        autoDetect: true,
        darkTheme: '',
        lightTheme: '',
        colorTheme: 'Monokai',
      });

      assert.strictEqual(await getThemeName('dark'), 'Monokai');
      assert.strictEqual(await getThemeName('light'), 'Monokai');
    });

    test('handles only dark preferred theme set', async () => {
      await setConfig({
        autoDetect: true,
        darkTheme: 'Default Dark Modern',
        lightTheme: '',
        colorTheme: 'Monokai',
      });

      // For dark themeType: darkInfo matches (type=dark), lightInfo
      // is undefined (empty name → no lookup). Only dark matches.
      assert.strictEqual(await getThemeName('dark'), 'Default Dark Modern');
    });

    test('handles only light preferred theme set', async () => {
      await setConfig({
        autoDetect: true,
        darkTheme: '',
        lightTheme: 'Default Light Modern',
        colorTheme: 'Monokai',
      });

      // For light themeType: lightInfo matches (type=light),
      // darkInfo is undefined. Only light matches.
      assert.strictEqual(await getThemeName('light'), 'Default Light Modern');
    });

    test('returns a string for any themeType', async () => {
      // Regardless of configuration, should always return something
      await setConfig({
        autoDetect: true,
        darkTheme: 'Default Dark Modern',
        lightTheme: 'Default Light Modern',
        colorTheme: 'Monokai',
      });

      const darkResult = await getThemeName('dark');
      const lightResult = await getThemeName('light');
      const hcDarkResult = await getThemeName('hcDark');
      const hcLightResult = await getThemeName('hcLight');

      assert.strictEqual(typeof darkResult, 'string');
      assert.strictEqual(typeof lightResult, 'string');
      assert.strictEqual(typeof hcDarkResult, 'string');
      assert.strictEqual(typeof hcLightResult, 'string');
    });
  });
});
