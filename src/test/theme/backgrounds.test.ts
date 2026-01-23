import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  THEME_BACKGROUNDS,
  getThemeBackground,
  getBackgroundForKey,
  type ElementBackgrounds,
} from '../../theme/backgrounds';
import { GENERATED_THEME_BACKGROUNDS } from '../../theme/backgrounds.generated';

suite('THEME_BACKGROUNDS', () => {
  test('contains VS Code built-in themes', () => {
    assert.ok(THEME_BACKGROUNDS['Default Dark Modern']);
    assert.ok(THEME_BACKGROUNDS['Default Light Modern']);
    assert.ok(THEME_BACKGROUNDS['Default Dark+']);
    assert.ok(THEME_BACKGROUNDS['Default Light+']);
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
      assert.ok(THEME_BACKGROUNDS[theme], `Missing dark theme: ${theme}`);
      assert.strictEqual(
        THEME_BACKGROUNDS[theme].kind,
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
      assert.ok(THEME_BACKGROUNDS[theme], `Missing light theme: ${theme}`);
      assert.strictEqual(
        THEME_BACKGROUNDS[theme].kind,
        'light',
        `${theme} should be light`
      );
    }
  });

  test('all backgrounds are valid hex colors', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    for (const [name, info] of Object.entries(THEME_BACKGROUNDS)) {
      assert.match(
        info.backgrounds.editor,
        hexPattern,
        `Invalid hex for ${name}: ${info.backgrounds.editor}`
      );
    }
  });

  test('dark themes have low lightness backgrounds', () => {
    // Dark themes should have backgrounds with lightness < 0.3
    const darkThemes = Object.entries(THEME_BACKGROUNDS).filter(
      ([, info]) => info.kind === 'dark'
    );
    for (const [name, info] of darkThemes) {
      const hex = info.backgrounds.editor;
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
    const lightThemes = Object.entries(THEME_BACKGROUNDS).filter(
      ([, info]) => info.kind === 'light'
    );
    for (const [name, info] of lightThemes) {
      const hex = info.backgrounds.editor;
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

suite('getThemeBackground', () => {
  test('returns info for known themes', () => {
    const result = getThemeBackground('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#282C34');
    assert.strictEqual(result.kind, 'dark');
  });

  test('returns undefined for unknown themes', () => {
    const result = getThemeBackground('My Custom Theme');
    assert.strictEqual(result, undefined);
  });

  test('is case-sensitive', () => {
    // Theme names must match exactly
    const result = getThemeBackground('one dark pro');
    assert.strictEqual(result, undefined);
  });
});

suite('getThemeBackground priority order', () => {
  // Verify that generated themes take precedence over built-in themes
  test('generated themes override built-in themes', () => {
    // Atom One Dark exists in both built-in and generated
    // Generated has per-element backgrounds, built-in only has editor
    assert.ok(THEME_BACKGROUNDS['Atom One Dark'], 'should exist in built-in');
    assert.ok(
      GENERATED_THEME_BACKGROUNDS['Atom One Dark'],
      'should exist in generated'
    );

    const result = getThemeBackground('Atom One Dark');
    assert.ok(result);

    // Verify we get the generated version (which has additional backgrounds)
    const generated = GENERATED_THEME_BACKGROUNDS['Atom One Dark'];
    assert.strictEqual(
      result.backgrounds.editor,
      generated.backgrounds.editor,
      'should use generated editor color'
    );
    assert.strictEqual(
      result.backgrounds.titleBar,
      generated.backgrounds.titleBar,
      'should have titleBar from generated (not present in built-in)'
    );
  });

  test('built-in themes serve as fallback for themes not in generated', () => {
    // One Dark Pro is in built-in but may not be in generated (or has same)
    // Use a theme that's definitely only in built-in
    const builtinOnly = 'One Dark Pro Flat';
    assert.ok(THEME_BACKGROUNDS[builtinOnly], 'should exist in built-in');

    const result = getThemeBackground(builtinOnly);
    assert.ok(result, 'should fall back to built-in');
    assert.strictEqual(
      result.backgrounds.editor,
      THEME_BACKGROUNDS[builtinOnly].backgrounds.editor
    );
  });

  test('generated themes provide per-element backgrounds', () => {
    // Verify that a generated theme with all element backgrounds returns them
    const themeName = 'Atom One Dark';
    const result = getThemeBackground(themeName);
    assert.ok(result);

    // Should have all four background types
    assert.ok(result.backgrounds.editor);
    assert.ok(result.backgrounds.titleBar);
    assert.ok(result.backgrounds.statusBar);
    assert.ok(result.backgrounds.activityBar);
  });
});

suite('getThemeBackground with custom config', () => {
  let originalBackgroundColors: unknown;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalBackgroundColors = config.get('theme.backgroundColors');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      originalBackgroundColors,
      vscode.ConfigurationTarget.Global
    );
  });

  test('custom config overrides built-in theme (legacy format)', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'One Dark Pro': {
          background: '#111111',
          kind: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#111111');
    assert.strictEqual(result.kind, 'dark');
  });

  test('custom config adds new theme (legacy format)', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'My Custom Theme': {
          background: '#ABCDEF',
          kind: 'light',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('My Custom Theme');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#ABCDEF');
    assert.strictEqual(result.kind, 'light');
  });

  test('falls back to built-in when no custom config', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {},
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('One Dark Pro');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#282C34');
    assert.strictEqual(result.kind, 'dark');
  });

  test('normalizes hex colors to uppercase (legacy format)', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'Lowercase Theme': {
          background: '#abcdef',
          kind: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('Lowercase Theme');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#ABCDEF');
  });

  test('skips entries with invalid hex colors', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'Invalid Hex Theme': {
          background: 'not-a-hex',
          kind: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('Invalid Hex Theme');
    assert.strictEqual(result, undefined);
  });

  test('skips entries with invalid kind values', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'Invalid Kind Theme': {
          background: '#123456',
          kind: 'medium',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('Invalid Kind Theme');
    assert.strictEqual(result, undefined);
  });

  test('skips entries with missing required fields', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'Missing Background': {
          kind: 'dark',
        },
        'Missing Kind': {
          background: '#123456',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    assert.strictEqual(getThemeBackground('Missing Background'), undefined);
    assert.strictEqual(getThemeBackground('Missing Kind'), undefined);
  });

  test('empty config returns empty custom themes', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {},
      vscode.ConfigurationTarget.Global
    );

    // Unknown theme should still return undefined
    const result = getThemeBackground('Nonexistent Theme');
    assert.strictEqual(result, undefined);
  });

  test('custom config with new format (backgrounds object)', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'New Format Theme': {
          backgrounds: {
            editor: '#282C34',
            titleBar: '#21252B',
            statusBar: '#3E4451',
            activityBar: '#2C313A',
          },
          kind: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('New Format Theme');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#282C34');
    assert.strictEqual(result.backgrounds.titleBar, '#21252B');
    assert.strictEqual(result.backgrounds.statusBar, '#3E4451');
    assert.strictEqual(result.backgrounds.activityBar, '#2C313A');
    assert.strictEqual(result.kind, 'dark');
  });

  test('custom config with partial element backgrounds', async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'theme.backgroundColors',
      {
        'Partial Theme': {
          backgrounds: {
            editor: '#282C34',
            titleBar: '#21252B',
          },
          kind: 'dark',
        },
      },
      vscode.ConfigurationTarget.Global
    );

    const result = getThemeBackground('Partial Theme');
    assert.ok(result);
    assert.strictEqual(result.backgrounds.editor, '#282C34');
    assert.strictEqual(result.backgrounds.titleBar, '#21252B');
    assert.strictEqual(result.backgrounds.statusBar, undefined);
    assert.strictEqual(result.backgrounds.activityBar, undefined);
  });
});

suite('getBackgroundForKey', () => {
  const fullBackgrounds: ElementBackgrounds = {
    editor: '#282C34',
    titleBar: '#21252B',
    statusBar: '#3E4451',
    activityBar: '#2C313A',
  };

  const editorOnlyBackgrounds: ElementBackgrounds = {
    editor: '#282C34',
  };

  test('returns titleBar background for titleBar keys', () => {
    assert.strictEqual(
      getBackgroundForKey('titleBar.activeBackground', fullBackgrounds),
      '#21252B'
    );
    assert.strictEqual(
      getBackgroundForKey('titleBar.inactiveBackground', fullBackgrounds),
      '#21252B'
    );
  });

  test('returns statusBar background for statusBar key', () => {
    assert.strictEqual(
      getBackgroundForKey('statusBar.background', fullBackgrounds),
      '#3E4451'
    );
  });

  test('returns activityBar background for activityBar key', () => {
    assert.strictEqual(
      getBackgroundForKey('activityBar.background', fullBackgrounds),
      '#2C313A'
    );
  });

  test('returns editor background for foreground keys', () => {
    // Foreground keys are not in the map, so they return editor
    assert.strictEqual(
      getBackgroundForKey('titleBar.activeForeground', fullBackgrounds),
      '#282C34'
    );
    assert.strictEqual(
      getBackgroundForKey('statusBar.foreground', fullBackgrounds),
      '#282C34'
    );
  });

  test('falls back to editor when element-specific not defined', () => {
    assert.strictEqual(
      getBackgroundForKey('titleBar.activeBackground', editorOnlyBackgrounds),
      '#282C34'
    );
    assert.strictEqual(
      getBackgroundForKey('statusBar.background', editorOnlyBackgrounds),
      '#282C34'
    );
    assert.strictEqual(
      getBackgroundForKey('activityBar.background', editorOnlyBackgrounds),
      '#282C34'
    );
  });
});
