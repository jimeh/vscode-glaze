import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getThemeTypeFromColorThemeKind,
  mapColorThemeKind,
  getThemeContext,
} from '../../theme';

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
});

suite('mapColorThemeKind (deprecated alias)', () => {
  test('is alias for getThemeTypeFromColorThemeKind', () => {
    assert.strictEqual(mapColorThemeKind, getThemeTypeFromColorThemeKind);
  });
});

suite('getThemeContext', () => {
  test('returns auto-detected context when mode is auto', () => {
    const result = getThemeContext('auto');
    assert.strictEqual(result.isAutoDetected, true);
    // Should return a valid theme type based on current VSCode theme
    assert.ok(
      ['dark', 'light', 'hcDark', 'hcLight'].includes(result.type)
    );
    // Kind should be same as type (backwards compat)
    assert.strictEqual(result.kind, result.type);
  });

  test('returns light type when mode is light', () => {
    const result = getThemeContext('light');
    assert.strictEqual(result.type, 'light');
    assert.strictEqual(result.kind, 'light'); // Backwards compat
    assert.strictEqual(result.isAutoDetected, false);
  });

  test('returns dark type when mode is dark', () => {
    const result = getThemeContext('dark');
    assert.strictEqual(result.type, 'dark');
    assert.strictEqual(result.kind, 'dark'); // Backwards compat
    assert.strictEqual(result.isAutoDetected, false);
  });
});
