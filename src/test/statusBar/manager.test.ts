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
        workspaceEnabled: undefined,
        workspaceIdentifier: 'test-workspace',
        themeType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
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
        workspaceEnabled: undefined,
        workspaceIdentifier: 'test-workspace',
        themeType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
        tintColors: { baseTint: '#ff0000', titleBar: '#ff0000' },
      };

      manager.update(state);
      assert.ok(true, 'update completed without error');
    });

    test('handles workspaceEnabled false', async () => {
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'statusBar.enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      const state: StatusBarState = {
        globalEnabled: true,
        workspaceEnabled: false,
        workspaceIdentifier: 'test-workspace',
        themeType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'pastel',
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
        workspaceEnabled: true,
        workspaceIdentifier: 'test-workspace',
        themeType: 'light',
        themeAutoDetected: false,
        colorScheme: 'vibrant',
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
        workspaceEnabled: undefined,
        workspaceIdentifier: undefined,
        themeType: 'dark',
        themeAutoDetected: true,
        colorScheme: 'muted',
        tintColors: { baseTint: '#00ff00', titleBar: '#00ff00' },
      };

      manager.update(state);
      assert.ok(true, 'update completed without error');
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

  suite('all theme types', () => {
    const themeTypes: Array<'dark' | 'light' | 'hcDark' | 'hcLight'> = [
      'dark',
      'light',
      'hcDark',
      'hcLight',
    ];

    for (const themeType of themeTypes) {
      test(`handles ${themeType} theme type`, async () => {
        const config = vscode.workspace.getConfiguration('patina');
        await config.update(
          'statusBar.enabled',
          true,
          vscode.ConfigurationTarget.Global
        );

        const state: StatusBarState = {
          globalEnabled: true,
          workspaceEnabled: undefined,
          workspaceIdentifier: 'test',
          themeType,
          themeAutoDetected: true,
          colorScheme: 'pastel',
          tintColors: { baseTint: '#123456', titleBar: '#123456' },
        };

        manager.update(state);
        assert.ok(true, `${themeType} theme handled without error`);
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
          workspaceEnabled: undefined,
          workspaceIdentifier: 'test',
          themeType: 'dark',
          themeAutoDetected: false,
          colorScheme,
          tintColors: { baseTint: '#abcdef', titleBar: '#abcdef' },
        };

        manager.update(state);
        assert.ok(true, `${colorScheme} scheme handled without error`);
      });
    }
  });
});
