import * as assert from 'assert';
import * as vscode from 'vscode';
import { PATINA_ACTIVE_KEY } from '../settings';

/**
 * Polls until a condition is met or timeout is reached.
 */
async function pollUntil(
  condition: () => boolean,
  errorMessage: string,
  timeoutMs = 4000,
  intervalMs = 50
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(errorMessage);
}

/**
 * Gets current colorCustomizations from config.
 */
function getColorCustomizations(): Record<string, string> | undefined {
  const config = vscode.workspace.getConfiguration();
  return config.get<Record<string, string>>('workbench.colorCustomizations');
}

/**
 * Checks if a key is a Patina-managed color key.
 */
function isPatinaKey(key: string): boolean {
  return (
    key === PATINA_ACTIVE_KEY ||
    key.startsWith('titleBar.') ||
    key.startsWith('statusBar.') ||
    key.startsWith('activityBar.') ||
    key.startsWith('sideBar.') ||
    key.startsWith('sideBarSectionHeader.')
  );
}

/**
 * Waits for colorCustomizations to be set, polling with timeout.
 */
async function waitForColorCustomizations(
  timeoutMs = 4000,
  intervalMs = 50
): Promise<Record<string, string>> {
  let colors: Record<string, string> | undefined;
  await pollUntil(
    () => {
      colors = getColorCustomizations();
      return colors !== undefined && Object.keys(colors).length > 0;
    },
    'Timeout waiting for colorCustomizations',
    timeoutMs,
    intervalMs
  );
  return colors!;
}

/**
 * Waits for a specific key to appear in colorCustomizations.
 */
async function waitForColorKey(
  key: string,
  timeoutMs = 4000,
  intervalMs = 50
): Promise<Record<string, string>> {
  let colors: Record<string, string> | undefined;
  await pollUntil(
    () => {
      colors = getColorCustomizations();
      return colors !== undefined && key in colors;
    },
    `Timeout waiting for colorCustomizations key: ${key}`,
    timeoutMs,
    intervalMs
  );
  return colors!;
}

/**
 * Waits for colorCustomizations to contain only non-Patina keys.
 */
async function waitForPatinaColorsCleared(
  timeoutMs = 4000,
  intervalMs = 50
): Promise<void> {
  await pollUntil(
    () => {
      const colors = getColorCustomizations();
      if (!colors) return true;
      return !Object.keys(colors).some(isPatinaKey);
    },
    'Timeout waiting for Patina colors to be cleared',
    timeoutMs,
    intervalMs
  );
}

suite('Extension Test Suite', () => {
  suiteSetup(async () => {
    // Ensure extension is activated
    const ext = vscode.extensions.getExtension('jimeh.patina');
    assert.ok(ext, 'Patina extension (jimeh.patina) not found');
    if (!ext.isActive) {
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

  suite('Disabled behavior', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      const inspection = patinaConfig.inspect<boolean>('enabled');
      originalEnabledGlobal = inspection?.globalValue;
      originalEnabledWorkspace = inspection?.workspaceValue;

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
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        originalEnabledWorkspace,
        vscode.ConfigurationTarget.Workspace
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

    test('does not mutate workbench.colorCustomizations when disabled', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Wait for the disable-triggered reconcile to fully settle before
      // seeding colorCustomizations, otherwise the debounced reconcile
      // can overwrite our seeded value.
      await waitForPatinaColorsCleared();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const seededColors = { 'editor.background': '#aabbcc' };
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        seededColors,
        vscode.ConfigurationTarget.Workspace
      );

      const ext = vscode.extensions.getExtension('jimeh.patina');
      assert.ok(ext, 'Patina extension (jimeh.patina) not found');
      if (!ext.isActive) {
        await ext.activate();
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      const inspection = vscode.workspace
        .getConfiguration()
        .inspect<Record<string, string>>('workbench.colorCustomizations');
      assert.deepStrictEqual(
        inspection?.workspaceValue,
        seededColors,
        'workbench.colorCustomizations should be unchanged when disabled'
      );
      if (inspection?.workspaceValue) {
        for (const key of Object.keys(inspection.workspaceValue)) {
          assert.ok(
            !isPatinaKey(key),
            `Patina key ${key} should not be present when disabled`
          );
        }
      }
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

      // Disable first so enableGlobally triggers a real config change
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await waitForPatinaColorsCleared();

      await vscode.commands.executeCommand('patina.enableGlobally');

      // Wait for the specific key we assert on
      const colors = await waitForColorKey('titleBar.activeBackground');

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

      // Disable first so enableGlobally triggers a real config change
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await waitForPatinaColorsCleared();

      await vscode.commands.executeCommand('patina.enableGlobally');

      // Wait for the specific key we need for assertions
      const colors = await waitForColorKey('titleBar.activeBackground');

      const hexPattern = /^#[0-9a-f]{6}$/i;
      for (const [key, value] of Object.entries(colors ?? {})) {
        if (
          key.startsWith('titleBar.') ||
          key.startsWith('statusBar.') ||
          key.startsWith('activityBar.') ||
          key.startsWith('sideBar.') ||
          key.startsWith('sideBarSectionHeader.')
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

    test('clears Patina colors from workbench.colorCustomizations', async function () {
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

      // Wait for Patina colors to be cleared
      await waitForPatinaColorsCleared();

      // Verify no Patina keys remain
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      if (colors) {
        for (const key of Object.keys(colors)) {
          assert.ok(!isPatinaKey(key), `Patina key ${key} should be removed`);
        }
      }
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

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('patina.disableGlobally');
      await waitForPatinaColorsCleared();

      // Enable patina first
      await vscode.commands.executeCommand('patina.enableGlobally');

      // Get initial colors (wait for them to be set)
      const initialColors = await waitForColorCustomizations();

      // Change the identifier source to pathAbsolute (different from default
      // 'name')
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'workspaceIdentifier.source',
        'pathAbsolute',
        vscode.ConfigurationTarget.Global
      );

      // Poll until colors actually differ from initial state
      let newColors: Record<string, string> | undefined;
      await pollUntil(() => {
        newColors = getColorCustomizations();
        return (
          newColors !== undefined &&
          JSON.stringify(newColors) !== JSON.stringify(initialColors)
        );
      }, 'colors should change when identifier source changes');

      assert.ok(newColors, 'colorCustomizations should still be set');
    });
  });

  suite('Command Registration (seed)', () => {
    test('patina.seedMenu command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.seedMenu'));
    });

    test('patina.randomizeSeed command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.randomizeSeed'));
    });

    test('patina.resetSeed command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.resetSeed'));
    });
  });

  suite('patina.randomizeSeed', () => {
    let originalSeedWorkspace: number | undefined;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      const inspection = config.inspect<number>('tint.seed');
      originalSeedWorkspace = inspection?.workspaceValue;
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        originalSeedWorkspace,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets tint.seed to a non-zero value', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Clear workspace seed first
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.randomizeSeed');

      // Get fresh config
      const inspection = config.inspect<number>('tint.seed');
      assert.ok(
        inspection?.workspaceValue !== undefined &&
          inspection.workspaceValue !== 0,
        'tint.seed workspace value should be set to a non-zero value'
      );
    });
  });

  suite('patina.resetSeed', () => {
    let originalSeedWorkspace: number | undefined;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      const inspection = config.inspect<number>('tint.seed');
      originalSeedWorkspace = inspection?.workspaceValue;
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        originalSeedWorkspace,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('clears workspace seed override', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Set a workspace seed first
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'tint.seed',
        42,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.resetSeed');

      // Get fresh config
      const inspection = config.inspect<number>('tint.seed');
      assert.strictEqual(
        inspection?.workspaceValue,
        undefined,
        'tint.seed workspace value should be cleared'
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

    test('patina.forceApply command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('patina.forceApply'));
    });
  });

  suite('patina.active marker', () => {
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

    test('patina.active exists after enable', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('patina.disableGlobally');
      await waitForPatinaColorsCleared();

      await vscode.commands.executeCommand('patina.enableGlobally');
      const colors = await waitForColorKey('patina.active');

      assert.ok('patina.active' in colors, 'should have patina.active marker');
      assert.strictEqual(
        colors['patina.active'],
        '#ef5ec7',
        'marker should have expected value'
      );
    });

    test('patina.active removed after disable', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      await vscode.commands.executeCommand('patina.enableGlobally');
      await waitForColorCustomizations();

      await vscode.commands.executeCommand('patina.disableGlobally');
      await waitForPatinaColorsCleared();

      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      if (colors) {
        assert.ok(
          !('patina.active' in colors),
          'patina.active should be removed after disable'
        );
      }
    });
  });

  suite('patina.enableWorkspace', () => {
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      const inspection = config.inspect<boolean>('enabled');
      originalEnabledWorkspace = inspection?.workspaceValue;

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
        'enabled',
        originalEnabledWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets patina.enabled at workspace scope to true', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First disable at workspace scope to ensure we're testing the change
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.enableWorkspace');

      // Get fresh config after command
      const inspection = config.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        true,
        'patina.enabled at workspace scope should be true'
      );
    });
  });

  suite('patina.disableWorkspace', () => {
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('patina');
      const inspection = config.inspect<boolean>('enabled');
      originalEnabledWorkspace = inspection?.workspaceValue;

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
        'enabled',
        originalEnabledWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets patina.enabled at workspace scope to false', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First enable at workspace scope to ensure we're testing the change
      const config = vscode.workspace.getConfiguration('patina');
      await config.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.disableWorkspace');

      // Get fresh config after command
      const inspection = config.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        false,
        'patina.enabled at workspace scope should be false'
      );
    });
  });

  suite('Workspace enable/disable override flow', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      const inspection = patinaConfig.inspect<boolean>('enabled');
      originalEnabledGlobal = inspection?.globalValue;
      originalEnabledWorkspace = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        originalEnabledWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('removes colors when workspace override set to false', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable globally first
      await vscode.commands.executeCommand('patina.enableGlobally');
      await waitForColorCustomizations();

      // Set workspace override to false (simulates workspace disable)
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Workspace
      );

      // Wait for colors to be cleared
      await waitForPatinaColorsCleared();

      // Verify workspace enabled override is false
      const inspection = patinaConfig.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        false,
        'patina.enabled at workspace scope should be false'
      );
    });

    test('applies colors when workspace override enables globally disabled', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start with global disabled
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Clear any existing colors
      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Enable at workspace scope (overrides global disabled)
      await vscode.commands.executeCommand('patina.enableWorkspace');

      // Wait for colors to be applied
      const colors = await waitForColorCustomizations();

      // Verify colors were applied
      assert.ok(colors, 'colorCustomizations should be set');
      assert.ok(
        'titleBar.activeBackground' in colors,
        'should have titleBar.activeBackground'
      );

      // Verify global is still disabled
      const inspection = patinaConfig.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.globalValue,
        false,
        'global enabled should still be false'
      );
      assert.strictEqual(
        inspection?.workspaceValue,
        true,
        'workspace override should be true'
      );
    });
  });

  suite('patina.enabled config change listener', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      const inspection = patinaConfig.inspect<boolean>('enabled');
      originalEnabledGlobal = inspection?.globalValue;
      originalEnabledWorkspace = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        originalEnabledWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('removes tint when enabled changed to false via config', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable via command first
      await vscode.commands.executeCommand('patina.enableGlobally');
      await waitForColorCustomizations();

      // Disable via config change (not command)
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Wait for Patina colors to be cleared
      await waitForPatinaColorsCleared();

      // Verify no Patina keys remain
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      if (colors) {
        for (const key of Object.keys(colors)) {
          assert.ok(!isPatinaKey(key), `Patina key ${key} should be removed`);
        }
      }
    });

    test('re-applies tint when enabled changed to true via config', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start disabled
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Clear any existing workspace enabled override
      await patinaConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Clear any existing colors
      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Enable via config change
      await patinaConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Wait for colors to be applied
      const colors = await waitForColorCustomizations();
      assert.ok(colors, 'colorCustomizations should be set');
      assert.ok(
        'titleBar.activeBackground' in colors,
        'should have titleBar.activeBackground'
      );
    });
  });

  suite('Element config changes', () => {
    let originalEnabled: boolean | undefined;
    let originalStatusBar: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      originalEnabled = patinaConfig.get<boolean>('enabled');
      originalStatusBar = patinaConfig.get<boolean>('elements.statusBar');

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'elements.statusBar',
        originalStatusBar,
        vscode.ConfigurationTarget.Global
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('statusBar keys appear when elements.statusBar enabled', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('patina.disableGlobally');
      await waitForPatinaColorsCleared();

      // Start with statusBar disabled
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'elements.statusBar',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Enable globally
      await vscode.commands.executeCommand('patina.enableGlobally');
      let colors = await waitForColorCustomizations();

      // Verify no statusBar keys
      assert.ok(
        !('statusBar.background' in colors),
        'should not have statusBar.background initially'
      );

      // Enable statusBar element
      await patinaConfig.update(
        'elements.statusBar',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Poll until statusBar keys appear
      colors = await waitForColorKey('statusBar.background');

      assert.ok(
        'statusBar.background' in colors,
        'should have statusBar.background after enabling'
      );
      assert.ok(
        'statusBar.foreground' in colors,
        'should have statusBar.foreground after enabling'
      );
    });
  });

  suite('sideBar element config changes', () => {
    let originalEnabled: boolean | undefined;
    let originalSideBar: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      originalEnabled = patinaConfig.get<boolean>('enabled');
      originalSideBar = patinaConfig.get<boolean>('elements.sideBar');

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'elements.sideBar',
        originalSideBar,
        vscode.ConfigurationTarget.Global
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sideBar keys appear when elements.sideBar enabled', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('patina.disableGlobally');
      await waitForPatinaColorsCleared();

      // Start with sideBar disabled (default)
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'elements.sideBar',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Enable globally
      await vscode.commands.executeCommand('patina.enableGlobally');
      let colors = await waitForColorCustomizations();

      // Verify no sideBar keys
      assert.ok(
        !('sideBar.background' in colors),
        'should not have sideBar.background initially'
      );

      // Enable sideBar element
      await patinaConfig.update(
        'elements.sideBar',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Poll until sideBar keys appear
      colors = await waitForColorKey('sideBar.background');

      assert.ok(
        'sideBar.background' in colors,
        'should have sideBar.background after enabling'
      );
      assert.ok(
        'sideBar.foreground' in colors,
        'should have sideBar.foreground after enabling'
      );
    });
  });

  suite('patina.forceApply', () => {
    let originalEnabled: boolean | undefined;
    let originalColorCustomizations: unknown;

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

    test('re-applies tint when colors were externally modified', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable and wait for colors
      await vscode.commands.executeCommand('patina.enableGlobally');
      await waitForColorCustomizations();

      // Simulate external modification: remove marker, keep managed keys
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      assert.ok(colors);
      const tampered = { ...colors };
      delete tampered['patina.active'];
      await config.update(
        'workbench.colorCustomizations',
        tampered,
        vscode.ConfigurationTarget.Workspace
      );

      // Force apply should re-inject marker and re-apply
      await vscode.commands.executeCommand('patina.forceApply');
      const updated = await waitForColorKey('patina.active');
      assert.ok(updated);
      assert.strictEqual(
        updated['patina.active'],
        '#ef5ec7',
        'marker should be present after force apply'
      );
      assert.ok(
        'titleBar.activeBackground' in updated,
        'managed keys should be present after force apply'
      );
    });

    test('does not inject marker when colorCustomizations is empty', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so applyTint becomes a remove-tint no-op
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Wait for any debounced remove to clear Patina colors
      await waitForPatinaColorsCleared();

      // Set colors to only non-Patina keys (empty would be
      // overwritten by debounce races, so use a stable baseline)
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        { 'editor.background': '#aabbcc' },
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('patina.forceApply');

      // Wait for debounced applyTint to settle
      await new Promise((r) => setTimeout(r, 500));

      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      // forceApply only injects marker into existing colors; since
      // patina is disabled the debounced apply is a no-op. No Patina
      // keys should be present.
      if (colors) {
        for (const key of Object.keys(colors)) {
          assert.ok(
            !isPatinaKey(key),
            `Patina key ${key} should not be present`
          );
        }
      }
    });

    test('marker has correct value after force apply', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable patina
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      await vscode.commands.executeCommand('patina.forceApply');

      const colors = await waitForColorKey(PATINA_ACTIVE_KEY);
      assert.strictEqual(
        colors[PATINA_ACTIVE_KEY],
        '#ef5ec7',
        'patina.active should have the correct marker value'
      );
    });
  });

  suite('Rapid toggle race-safety', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      const inspection = patinaConfig.inspect<boolean>('enabled');
      originalEnabledGlobal = inspection?.globalValue;
      originalEnabledWorkspace = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        originalEnabledWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('enable→disable→enable settles with colors applied', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start from a clean disabled state
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      await waitForPatinaColorsCleared();

      // Rapid toggle: enable → disable → enable
      await patinaConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Final state should be enabled with colors applied
      const colors = await waitForColorCustomizations();
      assert.ok(colors, 'colorCustomizations should be set');
      assert.ok(
        'titleBar.activeBackground' in colors,
        'should have titleBar.activeBackground'
      );
      assert.ok(
        PATINA_ACTIVE_KEY in colors,
        'should have patina.active marker'
      );
    });
  });

  suite('forceApply race-safety', () => {
    let originalEnabled: boolean | undefined;
    let originalColorCustomizations: unknown;

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

    test('forceApply during pending config change produces correct final state', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable and wait for initial colors
      await vscode.commands.executeCommand('patina.enableGlobally');
      await waitForColorCustomizations();

      // Simulate external modification: remove marker
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      assert.ok(colors);
      const tampered = { ...colors };
      delete tampered[PATINA_ACTIVE_KEY];
      await config.update(
        'workbench.colorCustomizations',
        tampered,
        vscode.ConfigurationTarget.Workspace
      );

      // Immediately fire forceApply — should resolve correctly
      // even if a config-change-triggered reconcile is pending
      await vscode.commands.executeCommand('patina.forceApply');

      const updated = await waitForColorKey(PATINA_ACTIVE_KEY);
      assert.ok(updated, 'colorCustomizations should be set');
      assert.ok(
        PATINA_ACTIVE_KEY in updated,
        'marker should be present after forceApply'
      );
      assert.ok(
        'titleBar.activeBackground' in updated,
        'managed keys should be present after forceApply'
      );
    });
  });

  suite('Tint seed changes', () => {
    let originalEnabled: boolean | undefined;
    let originalSeed: number | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      originalEnabled = patinaConfig.get<boolean>('enabled');
      originalSeed = patinaConfig.get<number>('tint.seed');

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );
      await patinaConfig.update(
        'tint.seed',
        originalSeed,
        vscode.ConfigurationTarget.Global
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('colors change when tint.seed changes', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('patina.disableGlobally');
      await waitForPatinaColorsCleared();

      // Set seed to 0 and enable
      const patinaConfig = vscode.workspace.getConfiguration('patina');
      await patinaConfig.update(
        'tint.seed',
        0,
        vscode.ConfigurationTarget.Global
      );
      await vscode.commands.executeCommand('patina.enableGlobally');

      const initialColors = await waitForColorCustomizations();
      const initialTitleBar = initialColors['titleBar.activeBackground'];

      // Change seed
      await patinaConfig.update(
        'tint.seed',
        42,
        vscode.ConfigurationTarget.Global
      );

      // Poll until titleBar color actually changes
      let newColors: Record<string, string> | undefined;
      await pollUntil(() => {
        newColors = getColorCustomizations();
        return (
          newColors !== undefined &&
          newColors['titleBar.activeBackground'] !== initialTitleBar
        );
      }, 'titleBar color should change when seed changes');

      assert.ok(newColors, 'colorCustomizations should still be set');
    });
  });
});
