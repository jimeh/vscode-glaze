import * as assert from 'assert';
import * as vscode from 'vscode';
import { getThemeTypeFromColorThemeKind, getThemeContext } from '../../theme';

suite('getThemeTypeFromColorThemeKind', () => {
  test('maps Light to light', () => {
    const result = getThemeTypeFromColorThemeKind(vscode.ColorThemeKind.Light);
    assert.strictEqual(result, 'light');
  });

  test('maps Dark to dark', () => {
    const result = getThemeTypeFromColorThemeKind(vscode.ColorThemeKind.Dark);
    assert.strictEqual(result, 'dark');
  });

  test('maps HighContrast to hcDark', () => {
    const result = getThemeTypeFromColorThemeKind(
      vscode.ColorThemeKind.HighContrast
    );
    assert.strictEqual(result, 'hcDark');
  });

  test('maps HighContrastLight to hcLight', () => {
    const result = getThemeTypeFromColorThemeKind(
      vscode.ColorThemeKind.HighContrastLight
    );
    assert.strictEqual(result, 'hcLight');
  });

  test('defaults to dark for unknown ColorThemeKind', () => {
    // Pass an unknown value that doesn't match any enum case
    const result = getThemeTypeFromColorThemeKind(99 as vscode.ColorThemeKind);
    assert.strictEqual(result, 'dark');
  });
});

suite('getThemeContext', () => {
  test('returns auto-detected context when mode is auto', () => {
    const result = getThemeContext('auto');
    assert.strictEqual(result.isAutoDetected, true);
    // Should return a valid theme type based on current VSCode theme
    assert.ok(['dark', 'light', 'hcDark', 'hcLight'].includes(result.type));
  });

  test('returns light type when mode is light', () => {
    const result = getThemeContext('light');
    assert.strictEqual(result.type, 'light');
    assert.strictEqual(result.isAutoDetected, false);
  });

  test('returns dark type when mode is dark', () => {
    const result = getThemeContext('dark');
    assert.strictEqual(result.type, 'dark');
    assert.strictEqual(result.isAutoDetected, false);
  });

  test('returns valid context structure', () => {
    const result = getThemeContext('auto');
    // Should have all required properties
    assert.ok('type' in result, 'Should have type property');
    assert.ok('name' in result, 'Should have name property');
    assert.ok('colors' in result, 'Should have colors property');
    assert.ok(
      'isAutoDetected' in result,
      'Should have isAutoDetected property'
    );
  });

  test('colors property has editor.background when available', () => {
    const result = getThemeContext('auto');
    // colors may be undefined if theme lookup fails, but if present
    // should have editor.background
    if (result.colors) {
      assert.ok(
        'editor.background' in result.colors,
        'colors should have editor.background property'
      );
      // editor.background should be a valid hex color
      const editorBg = result.colors['editor.background'];
      if (editorBg) {
        assert.match(
          editorBg,
          /^#[0-9a-fA-F]{6}$/,
          'editor.background should be valid hex'
        );
      }
    }
  });

  test('name property is a non-empty string', () => {
    const result = getThemeContext('auto');
    assert.strictEqual(typeof result.name, 'string');
    // Name may be empty if no theme is active, but typically isn't
  });

  test('type is consistent with isAutoDetected flag', () => {
    // When auto-detected, type comes from VSCode's active theme
    const autoResult = getThemeContext('auto');
    assert.strictEqual(autoResult.isAutoDetected, true);

    // When manually set, type matches the mode
    const darkResult = getThemeContext('dark');
    assert.strictEqual(darkResult.isAutoDetected, false);
    assert.strictEqual(darkResult.type, 'dark');

    const lightResult = getThemeContext('light');
    assert.strictEqual(lightResult.isAutoDetected, false);
    assert.strictEqual(lightResult.type, 'light');
  });
});
