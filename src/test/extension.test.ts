import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  suiteSetup(async () => {
    // Ensure extension is activated
    const ext = vscode.extensions.getExtension('undefined_publisher.patina');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  });

  suite('Command Registration', () => {
    test('patina.enableGlobally command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.enableGlobally'));
    });

    test('patina.disableGlobally command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.disableGlobally'));
    });
  });

  suite('patina.enableGlobally', () => {
    let originalColorCustomizations: unknown;
    let originalEnabled: boolean | undefined;

    suiteSetup(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      originalEnabled = patinaConfig.get<boolean>('enabled');

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets patina.enableGloballyd to true', async () => {
      // First disable to ensure we're testing the change
      let patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      await vscode.commands.executeCommand('patina.enableGlobally');

      // Get fresh config after command
      patinaConfig = vscode.workspace.getConfiguration('patina');
      const enabled = patinaConfig.get<boolean>('enabled');
      assert.strictEqual(
        enabled,
        true,
        'patina.enableGloballyd should be true'
      );
    });

    test('sets workbench.colorCustomizations when workspace is open', async function () {
      // Skip if no workspace is open (tests might run without workspace)
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      await vscode.commands.executeCommand('patina.enableGlobally');

      // Small delay for config change listener to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );

      assert.ok(colors, 'colorCustomizations should be set');
      assert.ok(
        'titleBar.activeBackground' in colors,
        'should have titleBar.activeBackground'
      );
    });

    test('color values are valid hex codes', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      await vscode.commands.executeCommand('patina.enableGlobally');

      // Small delay for config change listener to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );

      const hexPattern = /^#[0-9a-f]{6}$/i;
      for (const [key, value] of Object.entries(colors ?? {})) {
        if (
          key.startsWith('titleBar.') ||
          key.startsWith('statusBar.') ||
          key.startsWith('activityBar.')
        ) {
          assert.match(value, hexPattern, `Invalid hex for ${key}: ${value}`);
        }
      }
    });
  });

  suite('patina.disableGlobally', () => {
    let originalColorCustomizations: unknown;
    let originalEnabled: boolean | undefined;

    suiteSetup(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      originalEnabled = patinaConfig.get<boolean>('enabled');

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets patina.enableGloballyd to false', async () => {
      // First enable to ensure we're testing the change
      let patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      await vscode.commands.executeCommand('patina.disableGlobally');

      // Get fresh config after command
      patinaConfig = vscode.workspace.getConfiguration('patina');
      const enabled = patinaConfig.get<boolean>('enabled');
      assert.strictEqual(
        enabled,
        false,
        'patina.enableGloballyd should be false'
      );
    });

    test('clears workbench.colorCustomizations', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First enable to set colors
      await vscode.commands.executeCommand('patina.enableGlobally');

      // Small delay for config change listener to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Then disable
      await vscode.commands.executeCommand('patina.disableGlobally');

      // Small delay for config change listener to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const config = vscode.workspace.getConfiguration();
      const colors = config.get('workbench.colorCustomizations');

      // Should be undefined or empty object after disable
      assert.ok(
        colors === undefined ||
          (typeof colors === 'object' &&
            Object.keys(colors as object).length === 0),
        'colorCustomizations should be cleared'
      );
    });
  });

  suite('Configuration Change Listener', () => {
    let originalSource: string | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      originalSource = patinaConfig.get<string>('workspaceIdentifier.source');

      if (vscode.workspace.workspaceFolders?.length) {
        const config = vscode.workspace.getConfiguration();
        originalColorCustomizations = config.get(
          'workbench.colorCustomizations'
        );
      }
    });

    suiteTeardown(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'workspaceIdentifier.source',
        originalSource,
        vscode.ConfigurationTarget.Global
      );

      if (vscode.workspace.workspaceFolders?.length) {
        const config = vscode.workspace.getConfiguration();
        await config.update(
          'workbench.colorCustomizations',
          originalColorCustomizations,
          vscode.ConfigurationTarget.Workspace
        );
      }
    });

    test('re-applies tint when patina config changes', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable patina first
      await vscode.commands.executeCommand('patina.enableGlobally');

      // Get initial colors
      let config = vscode.workspace.getConfiguration();
      const initialColors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );

      // Change the identifier source to pathAbsolute (different from default
      // 'name')
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'workspaceIdentifier.source',
        'pathAbsolute',
        vscode.ConfigurationTarget.Global
      );

      // Small delay for config change listener to fire
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get colors after config change
      config = vscode.workspace.getConfiguration();
      const newColors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );

      // Colors should be different because identifier changed
      assert.ok(newColors, 'colorCustomizations should still be set');
      assert.notDeepStrictEqual(
        initialColors,
        newColors,
        'colors should change when identifier source changes'
      );
    });
  });
});
