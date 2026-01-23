import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  THEME_BACKGROUNDS,
  getThemeBackground,
} from '../../theme/backgrounds';

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
        info.background,
        hexPattern,
        `Invalid hex for ${name}: ${info.background}`
      );
    }
  });

  test('dark themes have low lightness backgrounds', () => {
    // Dark themes should have backgrounds with lightness < 0.3
    const darkThemes = Object.entries(THEME_BACKGROUNDS).filter(
      ([, info]) => info.kind === 'dark'
    );
    for (const [name, info] of darkThemes) {
      const hex = info.background;
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
      const hex = info.background;
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
    assert.strictEqual(result.background, '#282C34');
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

  test('custom config overrides built-in theme', async () => {
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
    assert.strictEqual(result.background, '#111111');
    assert.strictEqual(result.kind, 'dark');
  });

  test('custom config adds new theme', async () => {
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
    assert.strictEqual(result.background, '#ABCDEF');
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
    assert.strictEqual(result.background, '#282C34');
    assert.strictEqual(result.kind, 'dark');
  });

  test('normalizes hex colors to uppercase', async () => {
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
    assert.strictEqual(result.background, '#ABCDEF');
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
});
