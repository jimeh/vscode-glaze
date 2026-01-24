import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Waits for a configuration change to propagate, with timeout.
 * Uses onDidChangeConfiguration event instead of fixed delay.
 */
async function waitForConfigChange(
  section: string,
  timeoutMs = 2000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      disposable.dispose();
      reject(new Error(`Timeout waiting for config change: ${section}`));
    }, timeoutMs);

    const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(section)) {
        clearTimeout(timeout);
        disposable.dispose();
        resolve();
      }
    });
  });
}

/**
 * Waits for colorCustomizations to be set, polling with timeout.
 */
async function waitForColorCustomizations(
  timeoutMs = 2000,
  intervalMs = 50
): Promise<Record<string, string>> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const config = vscode.workspace.getConfiguration();
    const colors = config.get<Record<string, string>>(
      'workbench.colorCustomizations'
    );
    if (colors && Object.keys(colors).length > 0) {
      return colors;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('Timeout waiting for colorCustomizations');
}

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

    test('sets patina.enabled to true', async () => {
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
      assert.strictEqual(enabled, true, 'patina.enabled should be true');
    });

    test('sets workbench.colorCustomizations when workspace is open', async function () {
      // Skip if no workspace is open (tests might run without workspace)
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      await vscode.commands.executeCommand('patina.enableGlobally');

      // Wait for colorCustomizations to be set (polls with timeout)
      const colors = await waitForColorCustomizations();

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

      // Wait for colorCustomizations to be set (polls with timeout)
      const colors = await waitForColorCustomizations();

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

    test('sets patina.enabled to false', async () => {
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
      assert.strictEqual(enabled, false, 'patina.enabled should be false');
    });

    test('clears workbench.colorCustomizations', async function () {
      // Extend timeout for this test as it involves multiple async operations
      this.timeout(5000);

      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First enable to set colors
      await vscode.commands.executeCommand('patina.enableGlobally');

      // Wait for colors to be set
      await waitForColorCustomizations();

      // Then disable
      await vscode.commands.executeCommand('patina.disableGlobally');

      // Poll for colors to be cleared (with timeout)
      const start = Date.now();
      const timeoutMs = 3000;
      const intervalMs = 50;
      while (Date.now() - start < timeoutMs) {
        const config = vscode.workspace.getConfiguration();
        const colors = config.get('workbench.colorCustomizations');
        if (
          colors === undefined ||
          (typeof colors === 'object' &&
            Object.keys(colors as object).length === 0)
        ) {
          // Colors cleared successfully
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      // Final assertion if we timed out
      const config = vscode.workspace.getConfiguration();
      const colors = config.get('workbench.colorCustomizations');
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

      // Get initial colors (wait for them to be set)
      const initialColors = await waitForColorCustomizations();

      // Change the identifier source to pathAbsolute (different from default
      // 'name')
      const changePromise = waitForConfigChange(
        'workbench.colorCustomizations'
      );
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'workspaceIdentifier.source',
        'pathAbsolute',
        vscode.ConfigurationTarget.Global
      );

      // Wait for config change to propagate
      await changePromise;

      // Get colors after config change
      const config = vscode.workspace.getConfiguration();
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

  suite('Command Registration (workspace)', () => {
    test('patina.enableWorkspace command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.enableWorkspace'));
    });

    test('patina.disableWorkspace command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.disableWorkspace'));
    });
  });

  suite('patina.enableWorkspace', () => {
    let originalEnabled: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      const inspection = config.inspect<boolean>('workspace.enabled');
      originalEnabled = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'workspace.enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets workspace.enabled to true', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First disable to ensure we're testing the change
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'workspace.enabled',
        false,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.enableWorkspace');

      // Get fresh config after command
      const inspection = config.inspect<boolean>('workspace.enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        true,
        'workspace.enabled should be true'
      );
    });
  });

  suite('patina.disableWorkspace', () => {
    let originalEnabled: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      const inspection = config.inspect<boolean>('workspace.enabled');
      originalEnabled = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'workspace.enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets workspace.enabled to false', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First enable to ensure we're testing the change
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'workspace.enabled',
        true,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.disableWorkspace');

      // Get fresh config after command
      const inspection = config.inspect<boolean>('workspace.enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        false,
        'workspace.enabled should be false'
      );
    });
  });
});
