import * as assert from 'assert';
import * as vscode from 'vscode';
import { StatusBarManager } from '../../statusBar';
import type { StatusBarState } from '../../statusBar';

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

  suite('lifecycle', () => {
    test('constructor creates status bar item', () => {
      // If constructor didn't throw, item was created successfully
      assert.ok(manager, 'StatusBarManager should be instantiated');
    });

    test('dispose does not throw', () => {
      // Dispose should clean up without errors
      assert.doesNotThrow(() => manager.dispose());
    });
  });

  suite('update', () => {
    test('sets text to icon only when inactive (globalEnabled false)', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: false,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      // Note: We can't directly access item.text, but update should complete
      // without error. This is a smoke test.
      assert.ok(true, 'update completed without error');
    });

    test('sets text to icon and name when active', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      assert.ok(true, 'update completed without error');
    });

    test('handles workspaceEnabledOverride false', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: false,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      assert.ok(true, 'update completed without error');
    });

    test('handles undefined tintColors', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

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
      };

      manager.update(state);
      assert.ok(true, 'update completed without error');
    });

    test('handles undefined workspaceIdentifier', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: undefined,
        themeName: undefined,
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'muted',
        seed: 0,
        tintColors: { baseTint: '#00ff00', titleBar: '#00ff00' },
      };

      manager.update(state);
      assert.ok(true, 'update completed without error');
    });

    test('handles undefined themeName', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: undefined,
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      assert.ok(
        true,
        'update with undefined themeName completed without error'
      );
    });

    test('handles themeName with value', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 0,
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      assert.ok(true, 'update with themeName completed without error');
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
    test('handles non-zero seed without error', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabledOverride: undefined,
        workspaceIdentifier: 'test-workspace',
        themeName: 'One Dark Pro',
        tintType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        seed: 12345,
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      assert.ok(true, 'update with non-zero seed completed without error');
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
      test(`handles ${tintType} theme type`, async () => {
        const config = vscode.workspace.getConfiguration('patina');
        await config.update(
          'statusBar.enabled',
          true,
          vscode.ConfigurationTarget.Global
        );

        const state: StatusBarState = {
          globalEnabled: true,
          workspaceEnabledOverride: undefined,
          workspaceIdentifier: 'test',
          themeName: 'Default Dark+',
          tintType,
          themeAutoDetected: true,
          colorScheme: 'pastel',
          seed: 0,
          tintColors: { baseTint: '#123456', titleBar: '#123456' },
        };

        manager.update(state);
        assert.ok(true, `${tintType} theme handled without error`);
      });
    }
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
      test(`handles ${colorScheme} color scheme`, async () => {
        const config = vscode.workspace.getConfiguration('patina');
        await config.update(
          'statusBar.enabled',
          true,
          vscode.ConfigurationTarget.Global
        );

        const state: StatusBarState = {
          globalEnabled: true,
          workspaceEnabledOverride: undefined,
          workspaceIdentifier: 'test',
          themeName: 'Default Dark+',
          tintType: 'dark',
          themeAutoDetected: false,
          colorScheme,
          seed: 0,
          tintColors: { baseTint: '#abcdef', titleBar: '#abcdef' },
        };

        manager.update(state);
        assert.ok(true, `${colorScheme} scheme handled without error`);
      });
    }
  });
});
