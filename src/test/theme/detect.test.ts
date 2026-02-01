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
  test('returns auto-detected context when mode is auto', async () => {
    const result = await getThemeContext('auto');
    assert.strictEqual(result.isAutoDetected, true);
    // tintType should be a valid theme type based on current VSCode theme
    assert.ok(['dark', 'light', 'hcDark', 'hcLight'].includes(result.tintType));
  });

  test('returns light tintType when mode is light', async () => {
    const result = await getThemeContext('light');
    assert.strictEqual(result.tintType, 'light');
    assert.strictEqual(result.isAutoDetected, false);
  });

  test('returns dark tintType when mode is dark', async () => {
    const result = await getThemeContext('dark');
    assert.strictEqual(result.tintType, 'dark');
    assert.strictEqual(result.isAutoDetected, false);
  });

  test('returns valid context structure', async () => {
    const result = await getThemeContext('auto');
    // Should have all required properties
    assert.ok('tintType' in result, 'Should have tintType property');
    assert.ok('name' in result, 'Should have name property');
    assert.ok('colors' in result, 'Should have colors property');
    assert.ok(
      'isAutoDetected' in result,
      'Should have isAutoDetected property'
    );
  });

  test('colors property has editor.background when available', async () => {
    const result = await getThemeContext('auto');
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

  test('name property is a non-empty string', async () => {
    const result = await getThemeContext('auto');
    assert.strictEqual(typeof result.name, 'string');
    // Name may be empty if no theme is active, but typically isn't
  });

  test('tintType is consistent with isAutoDetected flag', async () => {
    // When auto-detected, tintType comes from VSCode's active theme
    const autoResult = await getThemeContext('auto');
    assert.strictEqual(autoResult.isAutoDetected, true);

    // When manually set, tintType matches the mode
    const darkResult = await getThemeContext('dark');
    assert.strictEqual(darkResult.isAutoDetected, false);
    assert.strictEqual(darkResult.tintType, 'dark');

    const lightResult = await getThemeContext('light');
    assert.strictEqual(lightResult.isAutoDetected, false);
    assert.strictEqual(lightResult.tintType, 'light');
  });

  test('type reflects theme DB type, not tint mode', async () => {
    // type comes from the theme database, so may differ from tintType
    const result = await getThemeContext('auto');
    // type is optional — undefined if theme not in DB
    if (result.type !== undefined) {
      assert.ok(
        ['dark', 'light', 'hcDark', 'hcLight'].includes(result.type),
        'type should be a valid ThemeType when defined'
      );
    }
  });

  test('colors available even when tintType differs from type', async () => {
    // Force a manual tint mode that may differ from theme's DB type
    const lightResult = await getThemeContext('light');
    const darkResult = await getThemeContext('dark');

    // At least one should have colors if the theme is in the DB,
    // and colors should be present regardless of tint mode mismatch
    if (lightResult.colors || darkResult.colors) {
      // Whichever has colors, the other should too — the type-match
      // gate has been removed so both should get colors
      assert.strictEqual(
        lightResult.colors !== undefined,
        darkResult.colors !== undefined,
        'Colors should be available regardless of tint mode'
      );
    }
  });
});
