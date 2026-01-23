import * as assert from 'assert';
import * as vscode from 'vscode';
import { mapColorThemeKind, getThemeContext } from '../../theme';

suite('mapColorThemeKind', () => {
  test('maps Light to light', () => {
    const result = mapColorThemeKind(vscode.ColorThemeKind.Light);
    assert.strictEqual(result, 'light');
  });

  test('maps Dark to dark', () => {
    const result = mapColorThemeKind(vscode.ColorThemeKind.Dark);
    assert.strictEqual(result, 'dark');
  });

  test('maps HighContrast to highContrast', () => {
    const result = mapColorThemeKind(vscode.ColorThemeKind.HighContrast);
    assert.strictEqual(result, 'highContrast');
  });

  test('maps HighContrastLight to highContrastLight', () => {
    const result = mapColorThemeKind(vscode.ColorThemeKind.HighContrastLight);
    assert.strictEqual(result, 'highContrastLight');
  });
});

suite('getThemeContext', () => {
  test('returns auto-detected context when mode is auto', () => {
    const result = getThemeContext('auto');
    assert.strictEqual(result.isAutoDetected, true);
    // Should return a valid theme kind based on current VSCode theme
    assert.ok(
      ['dark', 'light', 'highContrast', 'highContrastLight'].includes(
        result.kind
      )
    );
  });

  test('returns light kind when mode is light', () => {
    const result = getThemeContext('light');
    assert.strictEqual(result.kind, 'light');
    assert.strictEqual(result.isAutoDetected, false);
  });

  test('returns dark kind when mode is dark', () => {
    const result = getThemeContext('dark');
    assert.strictEqual(result.kind, 'dark');
    assert.strictEqual(result.isAutoDetected, false);
  });
});
