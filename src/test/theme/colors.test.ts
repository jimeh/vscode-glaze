import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getThemeInfo,
  getColorForKey,
  type ThemeColors,
} from '../../theme/colors';
import { BUILTIN_THEME_COLORS } from '../../theme/generated/builtins';
import { EXTENSION_THEME_COLORS } from '../../theme/generated/extensions';

suite('BUILTIN_THEME_COLORS', () => {
  test('contains VS Code built-in themes', () => {
    assert.ok(BUILTIN_THEME_COLORS['Default Dark Modern']);
    assert.ok(BUILTIN_THEME_COLORS['Default Light Modern']);
    assert.ok(BUILTIN_THEME_COLORS['Default Dark+']);
    assert.ok(BUILTIN_THEME_COLORS['Default Light+']);
  });

  test('contains classic VS Code themes', () => {
    const classicThemes = [
      'Monokai',
      'Monokai Dimmed',
      'Solarized Dark',
      'Solarized Light',
      'Quiet Light',
    ];
    for (const theme of classicThemes) {
      assert.ok(
        BUILTIN_THEME_COLORS[theme],
        `Missing built-in theme: ${theme}`
      );
    }
  });

  test('all colors are valid hex colors', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [name, info] of Object.entries(BUILTIN_THEME_COLORS)) {
      assert.match(
        info.colors['editor.background'],
        hexPattern,
        `Invalid hex for ${name}: ${info.colors['editor.background']}`
      );
    }
  });

  test('dark themes have low lightness backgrounds', () => {
    // Dark themes should have backgrounds with lightness < 0.35
    const darkThemes = Object.entries(BUILTIN_THEME_COLORS).filter(
      ([, info]) => info.type === 'dark' || info.type === 'hcDark'
    );
    for (const [name, info] of darkThemes) {
      const hex = info.colors['editor.background'];
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      assert.ok(
        lightness < 0.35,
        `Dark theme ${name} has too high lightness: ${lightness}`
      );
    }
  });

  test('light themes have high lightness backgrounds', () => {
    // Light themes should have backgrounds with lightness > 0.7
    const lightThemes = Object.entries(BUILTIN_THEME_COLORS).filter(
      ([, info]) => info.type === 'light' || info.type === 'hcLight'
    );
    for (const [name, info] of lightThemes) {
      const hex = info.colors['editor.background'];
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
      assert.ok(
        lightness > 0.7,
        `Light theme ${name} has too low lightness: ${lightness}`
      );
    }
  });
});

suite('getThemeInfo', () => {
  test('returns info for known extension themes', () => {
    const result = getThemeInfo('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.colors['editor.background'], '#282C34');
    assert.strictEqual(result.type, 'dark');
  });

  test('returns undefined for unknown themes', () => {
    const result = getThemeInfo('My Custom Theme');
    assert.strictEqual(result, undefined);
  });

  test('is case-sensitive', () => {
    // Theme names must match exactly
    const result = getThemeInfo('one dark pro');
    assert.strictEqual(result, undefined);
  });
});

suite('getThemeInfo priority order', () => {
  test('builtin themes take precedence over extension themes', () => {
    // Default Dark Modern is a VS Code built-in theme
    const themeName = 'Default Dark Modern';
    assert.ok(BUILTIN_THEME_COLORS[themeName], 'should exist in builtin');

    const result = getThemeInfo(themeName);
    assert.ok(result);

    // Verify we get the builtin version
    assert.strictEqual(
      result.colors['editor.background'],
      BUILTIN_THEME_COLORS[themeName].colors['editor.background'],
      'should use builtin colors'
    );
  });

  test('finds themes from extension data', () => {
    // Atom One Dark exists in extension data with per-element colors
    assert.ok(
      EXTENSION_THEME_COLORS['Atom One Dark'],
      'should exist in extensions'
    );

    const result = getThemeInfo('Atom One Dark');
    assert.ok(result);

    // Verify we get the extension version (which has additional colors)
    const extension = EXTENSION_THEME_COLORS['Atom One Dark'];
    assert.strictEqual(
      result.colors['editor.background'],
      extension.colors['editor.background'],
      'should use extension editor color'
    );
    assert.strictEqual(
      result.colors['titleBar.activeBackground'],
      extension.colors['titleBar.activeBackground'],
      'should have titleBar from extension'
    );
  });

  test('extension themes provide per-element colors', () => {
    // Verify that an extension theme with all element colors returns them
    const themeName = 'Atom One Dark';
    const result = getThemeInfo(themeName);
    assert.ok(result);

    // Should have editor.background at minimum
    assert.ok(result.colors['editor.background']);
    // If extension has per-element colors, they should be present
    if (EXTENSION_THEME_COLORS[themeName].colors['titleBar.activeBackground']) {
      assert.ok(result.colors['titleBar.activeBackground']);
    }
  });
});

suite('getThemeInfo with custom config', () => {
  let originalColors: unknown;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalColors = config.get('theme.colors');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      originalColors,
      vscode.ConfigurationTarget.Global
    );
  });

  test('custom config overrides extension theme', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'One Dark Pro': {
          colors: { 'editor.background': '#111111' },
          type: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeInfo('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.colors['editor.background'], '#111111');
    assert.strictEqual(result.type, 'dark');
  });

  test('custom config adds new theme', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'My Custom Theme': {
          colors: { 'editor.background': '#ABCDEF' },
          type: 'light',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeInfo('My Custom Theme');
    assert.ok(result);
    assert.strictEqual(result.colors['editor.background'], '#ABCDEF');
    assert.strictEqual(result.type, 'light');
  });

  test('falls back to extension when no custom config', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update('theme.colors', {}, vscode.ConfigurationTarget.Global);

    const result = getThemeInfo('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.colors['editor.background'], '#282C34');
    assert.strictEqual(result.type, 'dark');
  });

  test('normalizes hex colors to uppercase', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'Lowercase Theme': {
          colors: { 'editor.background': '#abcdef' },
          type: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeInfo('Lowercase Theme');
    assert.ok(result);
    assert.strictEqual(result.colors['editor.background'], '#ABCDEF');
  });

  test('skips entries with invalid hex colors', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'Invalid Hex Theme': {
          colors: { 'editor.background': 'not-a-hex' },
          type: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeInfo('Invalid Hex Theme');
    assert.strictEqual(result, undefined);
  });

  test('skips entries with invalid type values', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'Invalid Type Theme': {
          colors: { 'editor.background': '#123456' },
          type: 'medium',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeInfo('Invalid Type Theme');
    assert.strictEqual(result, undefined);
  });

  test('custom config with all color keys', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'Full Colors Theme': {
          colors: {
            'editor.background': '#282C34',
            'titleBar.activeBackground': '#21252B',
            'statusBar.background': '#3E4451',
            'activityBar.background': '#2C313A',
          },
          type: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeInfo('Full Colors Theme');
    assert.ok(result);
    assert.strictEqual(result.colors['editor.background'], '#282C34');
    assert.strictEqual(result.colors['titleBar.activeBackground'], '#21252B');
    assert.strictEqual(result.colors['statusBar.background'], '#3E4451');
    assert.strictEqual(result.colors['activityBar.background'], '#2C313A');
    assert.strictEqual(result.type, 'dark');
  });

  test('supports hcDark and hcLight types', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {
        'HC Dark Theme': {
          colors: { 'editor.background': '#000000' },
          type: 'hcDark',
        },
        'HC Light Theme': {
          colors: { 'editor.background': '#FFFFFF' },
          type: 'hcLight',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const hcDark = getThemeInfo('HC Dark Theme');
    assert.ok(hcDark);
    assert.strictEqual(hcDark.type, 'hcDark');

    const hcLight = getThemeInfo('HC Light Theme');
    assert.ok(hcLight);
    assert.strictEqual(hcLight.type, 'hcLight');
  });
});

suite('getColorForKey', () => {
  const fullColors: ThemeColors = {
    'editor.background': '#282C34',
    'titleBar.activeBackground': '#21252B',
    'statusBar.background': '#3E4451',
    'activityBar.background': '#2C313A',
  };

  const editorOnlyColors: ThemeColors = {
    'editor.background': '#282C34',
  };

  test('returns titleBar background for titleBar keys', () => {
    assert.strictEqual(
      getColorForKey('titleBar.activeBackground', fullColors),
      '#21252B'
    );
    assert.strictEqual(
      getColorForKey('titleBar.inactiveBackground', fullColors),
      '#21252B'
    );
  });

  test('returns statusBar background for statusBar key', () => {
    assert.strictEqual(
      getColorForKey('statusBar.background', fullColors),
      '#3E4451'
    );
  });

  test('returns activityBar background for activityBar key', () => {
    assert.strictEqual(
      getColorForKey('activityBar.background', fullColors),
      '#2C313A'
    );
  });

  test('returns editor background for foreground keys', () => {
    // Foreground keys are not in the map, so they return editor
    assert.strictEqual(
      getColorForKey('titleBar.activeForeground', fullColors),
      '#282C34'
    );
    assert.strictEqual(
      getColorForKey('statusBar.foreground', fullColors),
      '#282C34'
    );
  });

  test('falls back to editor when element-specific not defined', () => {
    assert.strictEqual(
      getColorForKey('titleBar.activeBackground', editorOnlyColors),
      '#282C34'
    );
    assert.strictEqual(
      getColorForKey('statusBar.background', editorOnlyColors),
      '#282C34'
    );
    assert.strictEqual(
      getColorForKey('activityBar.background', editorOnlyColors),
      '#282C34'
    );
  });
});
