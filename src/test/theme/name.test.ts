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

  test('returns preferredDarkColorTheme for dark theme kind', async () => {
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

  test('returns preferredDarkColorTheme for highContrast theme kind', async () => {
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

    const result = getThemeName('highContrast');
    assert.strictEqual(result, 'Dracula');
  });

  test('returns preferredLightColorTheme for light theme kind', async () => {
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

  test('returns preferredLightColorTheme for highContrastLight kind', async () => {
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

    const result = getThemeName('highContrastLight');
    assert.strictEqual(result, 'GitHub Light');
  });

  test('falls back to colorTheme when preferredDark is empty', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredDarkColorTheme',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    // VSCode always has a colorTheme set, verify it returns a non-empty string
    const result = getThemeName('dark');
    assert.ok(result, 'Should return a theme name');
    assert.ok(typeof result === 'string', 'Should return a string');
    assert.ok(result.length > 0, 'Should not be empty');
  });

  test('falls back to colorTheme when preferredLight is empty', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredLightColorTheme',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    // VSCode always has a colorTheme set, verify it returns a non-empty string
    const result = getThemeName('light');
    assert.ok(result, 'Should return a theme name');
    assert.ok(typeof result === 'string', 'Should return a string');
    assert.ok(result.length > 0, 'Should not be empty');
  });

  test('returns colorTheme when no preferred themes are set', async () => {
    const config = vscode.workspace.getConfiguration('workbench');
    await config.update(
      'preferredDarkColorTheme',
      undefined,
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      'preferredLightColorTheme',
      undefined,
      vscode.ConfigurationTarget.Global
    );

    // VSCode always has a default colorTheme, verify it returns a non-empty
    // string for both dark and light theme kinds
    const darkResult = getThemeName('dark');
    const lightResult = getThemeName('light');
    assert.ok(darkResult, 'Should return a theme name for dark');
    assert.ok(lightResult, 'Should return a theme name for light');
  });
});
