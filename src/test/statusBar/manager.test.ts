import * as assert from 'assert';
import * as vscode from 'vscode';
import { StatusBarManager } from '../../statusBar';
import type { StatusBarState } from '../../statusBar';

/** Icon prefix used in all status bar text. */
const ICON = '$(paintcan)';

suite('StatusBarManager', () => {
  let manager: StatusBarManager;
  let originalStatusBarEnabled: boolean | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    originalStatusBarEnabled = config.get<boolean>('statusBar.enabled');
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'statusBar.enabled',
      originalStatusBarEnabled,
      vscode.ConfigurationTarget.Global
    );
  });

  setup(() => {
    manager = new StatusBarManager();
  });

  teardown(() => {
    manager.dispose();
  });

  /** Enable the status bar item for test visibility. */
  async function enableStatusBar(): Promise<void> {
    const config = vscode.workspace.getConfiguration('patina');
    await config.update(
      'statusBar.enabled',
      true,
      vscode.ConfigurationTarget.Global
    );
  }

  /** Cast tooltip to MarkdownString and return its value. */
  function tooltipValue(): string {
    const tooltip = manager.item.tooltip as vscode.MarkdownString;
    return tooltip.value;
  }

  suite('lifecycle', () => {
    test('constructor creates status bar item', () => {
      assert.ok(manager.item, 'StatusBarManager should expose item');
    });

    test('dispose does not throw', () => {
      assert.doesNotThrow(() => manager.dispose());
    });
  });

  suite('update', () => {
    test('shows icon only when inactive', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: false,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.strictEqual(manager.item.text, ICON);

      const tip = tooltipValue();
      assert.ok(
        tip.includes('Inactive'),
        `tooltip should indicate inactive, got: ${tip}`
      );
    });

    test('shows icon + color name when active', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);

      assert.ok(
        manager.item.text.startsWith(`${ICON} `),
        `expected icon prefix, got: ${manager.item.text}`
      );
      assert.ok(
        manager.item.text.length > `${ICON} `.length,
        'expected color name after icon'
      );

      const tip = tooltipValue();
      assert.ok(
        tip.includes('Active'),
        `tooltip should indicate active, got: ${tip}`
      );
      assert.ok(
        tip.includes('test-workspace'),
        `tooltip should show workspace ID, got: ${tip}`
      );
    });

    test('shows icon only when workspace override disables', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: false,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.strictEqual(manager.item.text, ICON);

      const tip = tooltipValue();
      assert.ok(
        tip.includes('Inactive'),
        `tooltip should indicate inactive, got: ${tip}`
      );
    });

    test('shows "Patina" when active with no tint colors', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: true,
        workspaceIdentifier: 'test-workspace',
        themeName: 'Solarized Light',
        tintType: 'light',
        themeAutoDetected: false,
        colorScheme: 'vibrant',
        seed: 0,
        tintColors: undefined,
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.strictEqual(manager.item.text, `${ICON} Patina`);
    });

    test('shows icon + color name with undefined workspace ID', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: undefined,
        themeName: undefined,
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'muted',
        seed: 0,
        tintColors: {
          baseTint: '#00ff00',
          titleBar: '#00ff00',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.ok(
        manager.item.text.startsWith(`${ICON} `),
        `expected icon prefix, got: ${manager.item.text}`
      );
    });

    test('shows icon + color name with undefined theme name', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: undefined,
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.ok(
        manager.item.text.startsWith(`${ICON} `),
        `expected icon prefix, got: ${manager.item.text}`
      );
    });

    test('shows icon + color name with theme name set', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.ok(
        manager.item.text.startsWith(`${ICON} `),
        `expected icon prefix, got: ${manager.item.text}`
      );

      const tip = tooltipValue();
      assert.ok(
        tip.includes('One Dark Pro'),
        `tooltip should include theme name, got: ${tip}`
      );
    });

    test('shows modified warning when customized outside Patina', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: undefined,
        customizedOutsidePatina: true,
      };

      manager.update(state);
      assert.strictEqual(manager.item.text, `${ICON} $(warning) Modified`);

      const tip = tooltipValue();
      assert.ok(
        tip.includes('modified outside Patina'),
        `tooltip should warn about external changes, got: ${tip}`
      );
    });

    test('shows icon only when customized but inactive', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: false,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: undefined,
        customizedOutsidePatina: true,
      };

      manager.update(state);
      assert.strictEqual(
        manager.item.text,
        ICON,
        'should show icon only when inactive, even if customized'
      );

      const tip = tooltipValue();
      assert.ok(
        tip.includes('Inactive'),
        `tooltip should indicate inactive, got: ${tip}`
      );
      assert.ok(
        !tip.includes('modified outside Patina'),
        `tooltip should not warn about external changes when inactive, got: ${tip}`
      );
    });
  });

  suite('updateVisibility', () => {
    test('does not throw when statusBar.enabled is true', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      assert.doesNotThrow(() => manager.updateVisibility());
    });

    test('does not throw when statusBar.enabled is false', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      assert.doesNotThrow(() => manager.updateVisibility());
    });

    test('responds to config changes', async () => {
      const config = vscode.workspace.getConfiguration('patina');

      // Toggle from false to true
      await config.update(
        'statusBar.enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      manager.updateVisibility();

      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );
      manager.updateVisibility();

      assert.ok(true, 'visibility updates completed without error');
    });
  });

  suite('seed display', () => {
    test('includes seed in tooltip for non-zero seed', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 12345,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      assert.ok(
        manager.item.text.startsWith(`${ICON} `),
        `expected icon prefix, got: ${manager.item.text}`
      );

      const tip = tooltipValue();
      assert.ok(
        tip.includes('12345'),
        `tooltip should include seed value, got: ${tip}`
      );
    });
  });

  suite('all theme types', () => {
    const themeTypes: Array<'dark' | 'light' | 'hcDark' | 'hcLight'> = [
      'dark',
      'light',
      'hcDark',
      'hcLight',
    ];

    for (const tintType of themeTypes) {
      test(`shows color name for ${tintType} theme`, async () => {
        await enableStatusBar();

        const state: StatusBarState = {
          globalEnabled: true,
          workspaceEnabledOverride: undefined,
          workspaceIdentifier: 'test',
          themeName: 'Default Dark+',
          tintType,
          themeAutoDetected: true,
          colorScheme: 'pastel',
          seed: 0,
          tintColors: {
            baseTint: '#123456',
            titleBar: '#123456',
          },
          customizedOutsidePatina: false,
        };

        manager.update(state);
        assert.ok(
          manager.item.text.startsWith(`${ICON} `),
          `expected icon prefix for ${tintType}, ` + `got: ${manager.item.text}`
        );
      });
    }
  });

  suite('error state', () => {
    test('shows error text when lastError is set', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
        lastError: 'Unable to write settings',
      };

      manager.update(state);
      assert.strictEqual(manager.item.text, `${ICON} $(error) Error`);

      const tip = tooltipValue();
      assert.ok(
        tip.includes('Failed to apply colors'),
        `tooltip should show error, got: ${tip}`
      );
      assert.ok(
        tip.includes('Unable to write settings'),
        `tooltip should include error message, got: ${tip}`
      );
    });

    test('error takes priority over customized warning', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: undefined,
        customizedOutsidePatina: true,
        lastError: 'Write failed',
      };

      manager.update(state);
      assert.strictEqual(
        manager.item.text,
        `${ICON} $(error) Error`,
        'error should take priority over modified warning'
      );
    });

    test('clears error when lastError is undefined', async () => {
      await enableStatusBar();

      // First show error
      const errorState: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
        lastError: 'Some error',
      };
      manager.update(errorState);
      assert.strictEqual(manager.item.text, `${ICON} $(error) Error`);

      // Then clear error
      const okState: StatusBarState = {
        ...errorState,
        lastError: undefined,
      };
      manager.update(okState);
      assert.ok(
        manager.item.text.startsWith(`${ICON} `),
        `expected icon prefix after error clear, got: ${manager.item.text}`
      );
      assert.ok(
        !manager.item.text.includes('Error'),
        'should not show error after clear'
      );
    });
  });

  suite('tooltip content security', () => {
    test('escapes HTML/markdown in lastError', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test',
        themeName: 'Default Dark+',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
        lastError: '<img src=x onerror=alert(1)>',
      };

      manager.update(state);
      const tip = tooltipValue();
      // Angle brackets and parens should be backslash-escaped
      assert.ok(
        tip.includes('\\<img src=x onerror=alert\\(1\\)\\>'),
        `HTML should be backslash-escaped in tooltip, got: ${tip}`
      );
    });

    test('escapes markdown command links in lastError', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test',
        themeName: 'Default Dark+',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
        lastError: '[click](command:evil.run)',
      };

      manager.update(state);
      const tip = tooltipValue();
      assert.ok(
        !tip.includes('[click](command:evil.run)'),
        `tooltip should not contain raw command link, got: ${tip}`
      );
    });

    test('escapes brackets/angles in themeName', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test',
        themeName: '<b>Evil</b> [x](command:bad)',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      const tip = tooltipValue();
      assert.ok(
        !tip.includes('<b>Evil</b>'),
        `tooltip should not contain raw HTML in theme name, got: ${tip}`
      );
      assert.ok(
        !tip.includes('[x](command:bad)'),
        `tooltip should not contain command link in theme name, got: ${tip}`
      );
    });

    test('isTrusted restricts to allowed commands', async () => {
      await enableStatusBar();

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test',
        themeName: 'Default Dark+',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: {
          baseTint: '#ff0000',
          titleBar: '#ff0000',
        },
        customizedOutsidePatina: false,
      };

      manager.update(state);
      const tooltip = manager.item.tooltip as vscode.MarkdownString;
      assert.ok(
        typeof tooltip.isTrusted === 'object' && tooltip.isTrusted !== null,
        'isTrusted should be an object with enabledCommands'
      );
      const trusted = tooltip.isTrusted as {
        enabledCommands: string[];
      };
      assert.deepStrictEqual(trusted.enabledCommands, [
        'patina.copyColor',
        'patina.forceApply',
      ]);
    });
  });

  suite('all color schemes', () => {
    const colorSchemes: Array<
      | 'pastel'
      | 'vibrant'
      | 'muted'
      | 'tinted'
      | 'duotone'
      | 'undercurrent'
      | 'analogous'
      | 'neon'
    > = [
      'pastel',
      'vibrant',
      'muted',
      'tinted',
      'duotone',
      'undercurrent',
      'analogous',
      'neon',
    ];

    for (const colorScheme of colorSchemes) {
      test(`shows color name for ${colorScheme} scheme`, async () => {
        await enableStatusBar();

        const state: StatusBarState = {
          globalEnabled: true,
          workspaceEnabledOverride: undefined,
          workspaceIdentifier: 'test',
          themeName: 'Default Dark+',
          tintType: 'dark',
          themeAutoDetected: false,
          colorScheme,
          seed: 0,
          tintColors: {
            baseTint: '#abcdef',
            titleBar: '#abcdef',
          },
          customizedOutsidePatina: false,
        };

        manager.update(state);
        assert.ok(
          manager.item.text.startsWith(`${ICON} `),
          `expected icon prefix for ${colorScheme}, ` +
            `got: ${manager.item.text}`
        );
      });
    }
  });
});
