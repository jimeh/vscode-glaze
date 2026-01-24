import * as assert from 'assert';
import * as vscode from 'vscode';
import { getThemeName } from '../../theme/name';

suite('getThemeName', () => {
  // Store original config values to restore after tests
  let originalPreferredDark: string | undefined;
  let originalPreferredLight: string | undefined;
  let originalColorTheme: string | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    originalPreferredDark = config.get<string>('preferredDarkColorTheme');
    originalPreferredLight = config.get<string>('preferredLightColorTheme');
    originalColorTheme = config.get<string>('colorTheme');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredDarkColorTheme',
      originalPreferredDark,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'preferredLightColorTheme',
      originalPreferredLight,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'colorTheme',
      originalColorTheme,
      vscode.ConfigurationTarget.Global
    );
  });

  test('returns preferredDarkColorTheme for dark theme type', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredDarkColorTheme',
      'One Dark Pro',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'colorTheme',
      'Default Dark+',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeName('dark');
    assert.strictEqual(result, 'One Dark Pro');
  });

  test('returns preferredDarkColorTheme for hcDark theme type', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredDarkColorTheme',
      'Dracula',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'colorTheme',
      'Default Dark+',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeName('hcDark');
    assert.strictEqual(result, 'Dracula');
  });

  test('returns preferredLightColorTheme for light theme type', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredLightColorTheme',
      'Solarized Light',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'colorTheme',
      'Default Light+',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeName('light');
    assert.strictEqual(result, 'Solarized Light');
  });

  test('returns preferredLightColorTheme for hcLight type', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredLightColorTheme',
      'GitHub Light',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'colorTheme',
      'Default Light+',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeName('hcLight');
    assert.strictEqual(result, 'GitHub Light');
  });

  test('falls back to colorTheme when preferredDark is empty', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    // Use empty string (falsy) to ensure fallback path is taken
    await config.update(
      'preferredDarkColorTheme',
      '',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeName('dark');
    const colorTheme = config.get<string>('colorTheme');
    assert.strictEqual(result, colorTheme, 'Should fall back to colorTheme');
  });

  test('falls back to colorTheme when preferredLight is empty', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    // Use empty string (falsy) to ensure fallback path is taken
    await config.update(
      'preferredLightColorTheme',
      '',
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeName('light');
    const colorTheme = config.get<string>('colorTheme');
    assert.strictEqual(result, colorTheme, 'Should fall back to colorTheme');
  });

  test('returns colorTheme when no preferred themes are set', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    // Use empty strings (falsy) to ensure fallback paths are taken
    await config.update(
      'preferredDarkColorTheme',
      '',
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'preferredLightColorTheme',
      '',
      vscode.ConfigurationTarget.Global
    );

    const colorTheme = config.get<string>('colorTheme');
    const darkResult = getThemeName('dark');
    const lightResult = getThemeName('light');
    assert.strictEqual(darkResult, colorTheme, 'Dark should fall back');
    assert.strictEqual(lightResult, colorTheme, 'Light should fall back');
  });
});
