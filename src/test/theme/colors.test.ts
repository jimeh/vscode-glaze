import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  BUILTIN_THEMES,
  getThemeInfo,
  getColorForKey,
  type ThemeColors,
  // Backwards compat exports
  THEME_BACKGROUNDS,
  getThemeBackground,
  getBackgroundForKey,
} from '../../theme/colors';
import { GENERATED_THEME_COLORS } from '../../theme/generated';

suite('BUILTIN_THEMES', () => {
  test('contains VS Code built-in themes', () => {
    assert.ok(BUILTIN_THEMES['Default Dark Modern']);
    assert.ok(BUILTIN_THEMES['Default Light Modern']);
    assert.ok(BUILTIN_THEMES['Default Dark+']);
    assert.ok(BUILTIN_THEMES['Default Light+']);
  });

  test('contains popular dark themes', () => {
    const popularDark = [
      'One Dark Pro',
      'Dracula',
      'Night Owl',
      'Monokai',
      'Nord',
      'Solarized Dark',
      'GitHub Dark Default',
      'Tokyo Night',
      'Catppuccin Mocha',
    ];
    for (const theme of popularDark) {
      assert.ok(BUILTIN_THEMES[theme], `Missing dark theme: ${theme}`);
      assert.strictEqual(
        BUILTIN_THEMES[theme].type,
        'dark',
        `${theme} should be dark`
      );
    }
  });

  test('contains popular light themes', () => {
    const popularLight = [
      'GitHub Light Default',
      'Solarized Light',
      'Catppuccin Latte',
      'Ayu Light',
    ];
    for (const theme of popularLight) {
      assert.ok(BUILTIN_THEMES[theme], `Missing light theme: ${theme}`);
      assert.strictEqual(
        BUILTIN_THEMES[theme].type,
        'light',
        `${theme} should be light`
      );
    }
  });

  test('all colors are valid hex colors', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [name, info] of Object.entries(BUILTIN_THEMES)) {
      assert.match(
        info.colors['editor.background'],
        hexPattern,
        `Invalid hex for ${name}: ${info.colors['editor.background']}`
      );
    }
  });

  test('dark themes have low lightness backgrounds', () => {
    // Dark themes should have backgrounds with lightness < 0.3
    const darkThemes = Object.entries(BUILTIN_THEMES).filter(
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
    const lightThemes = Object.entries(BUILTIN_THEMES).filter(
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
  test('returns info for known themes', () => {
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
  // Verify that generated themes take precedence over built-in themes
  test('generated themes override built-in themes', () => {
    // Atom One Dark exists in both built-in and generated
    // Generated has per-element colors, built-in only has editor
    assert.ok(BUILTIN_THEMES['Atom One Dark'], 'should exist in built-in');
    assert.ok(
      GENERATED_THEME_COLORS['Atom One Dark'],
      'should exist in generated'
    );

    const result = getThemeInfo('Atom One Dark');
    assert.ok(result);

    // Verify we get the generated version (which has additional colors)
    const generated = GENERATED_THEME_COLORS['Atom One Dark'];
    assert.strictEqual(
      result.colors['editor.background'],
      generated.colors['editor.background'],
      'should use generated editor color'
    );
    assert.strictEqual(
      result.colors['titleBar.activeBackground'],
      generated.colors['titleBar.activeBackground'],
      'should have titleBar from generated (not present in built-in)'
    );
  });

  test('built-in themes serve as fallback for themes not in generated', () => {
    // One Dark Pro is in built-in but may not be in generated (or has same)
    // Use a theme that's definitely only in built-in
    const builtinOnly = 'One Dark Pro Flat';
    assert.ok(BUILTIN_THEMES[builtinOnly], 'should exist in built-in');

    const result = getThemeInfo(builtinOnly);
    assert.ok(result, 'should fall back to built-in');
    assert.strictEqual(
      result.colors['editor.background'],
      BUILTIN_THEMES[builtinOnly].colors['editor.background']
    );
  });

  test('generated themes provide per-element colors', () => {
    // Verify that a generated theme with all element colors returns them
    const themeName = 'Atom One Dark';
    const result = getThemeInfo(themeName);
    assert.ok(result);

    // Should have editor.background at minimum
    assert.ok(result.colors['editor.background']);
    // If generated has per-element colors, they should be present
    if (GENERATED_THEME_COLORS[themeName].colors['titleBar.activeBackground']) {
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

  test('custom config overrides built-in theme', async () => {
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

  test('falls back to built-in when no custom config', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.colors',
      {},
      vscode.ConfigurationTarget.Global
    );

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

// Backwards compatibility tests
suite('THEME_BACKGROUNDS (deprecated)', () => {
  test('is derived from BUILTIN_THEMES', () => {
    // Should have the same theme names
    const builtinNames = Object.keys(BUILTIN_THEMES);
    const bgNames = Object.keys(THEME_BACKGROUNDS);
    assert.deepStrictEqual(bgNames.sort(), builtinNames.sort());
  });
});

suite('getThemeBackground (deprecated)', () => {
  test('returns legacy format for known themes', () => {
    const result = getThemeBackground('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#282C34');
    assert.strictEqual(result.kind, 'dark');
  });

  test('returns undefined for unknown themes', () => {
    const result = getThemeBackground('Unknown Theme');
    assert.strictEqual(result, undefined);
  });
});

suite('getBackgroundForKey (deprecated)', () => {
  const backgrounds = {
    editor: '#282C34',
    titleBar: '#21252B',
    statusBar: '#3E4451',
    activityBar: '#2C313A',
  };

  test('returns titleBar background for titleBar keys', () => {
    assert.strictEqual(
      getBackgroundForKey('titleBar.activeBackground', backgrounds),
      '#21252B'
    );
  });

  test('returns statusBar background for statusBar key', () => {
    assert.strictEqual(
      getBackgroundForKey('statusBar.background', backgrounds),
      '#3E4451'
    );
  });

  test('falls back to editor when element-specific not defined', () => {
    const editorOnly = { editor: '#282C34' };
    assert.strictEqual(
      getBackgroundForKey('titleBar.activeBackground', editorOnly),
      '#282C34'
    );
  });
});
