import * as assert from 'assert';
import * as vscode from 'vscode';
import { GLAZE_ACTIVE_KEY } from '../settings';
import { _setGuardEnabled } from '../reconcile/guard';

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
function getColorCustomizations(): Record<string, unknown> | undefined {
  const config = vscode.workspace.getConfiguration();
  return config.get<Record<string, unknown>>('workbench.colorCustomizations');
}

/**
 * Checks if a key is a Glaze-managed color key (root-level).
 */
function isRootGlazeKey(key: string): boolean {
  return (
    key === GLAZE_ACTIVE_KEY ||
    key.startsWith('titleBar.') ||
    key.startsWith('statusBar.') ||
    key.startsWith('activityBar.') ||
    key.startsWith('sideBar.') ||
    key.startsWith('sideBarSectionHeader.')
  );
}

/**
 * Find the Glaze-owned theme block in colorCustomizations.
 * Uses the root `glaze.active` marker to identify which theme
 * block Glaze owns.
 */
function findGlazeBlock(
  colors: Record<string, unknown>
): Record<string, string> | undefined {
  const marker = colors[GLAZE_ACTIVE_KEY];
  if (typeof marker !== 'string' || marker.length === 0) {
    return undefined;
  }
  const themeKey = `[${marker}]`;
  const value = colors[themeKey];
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, string>;
  }
  return undefined;
}

/**
 * Waits for colorCustomizations to be set, polling with timeout.
 */
async function waitForColorCustomizations(
  timeoutMs = 4000,
  intervalMs = 50
): Promise<Record<string, unknown>> {
  let colors: Record<string, unknown> | undefined;
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
 * Waits for the root `glaze.active` marker to appear in
 * colorCustomizations as a non-empty string. Returns the full
 * colorCustomizations once found.
 */
async function waitForRootMarker(
  timeoutMs = 4000,
  intervalMs = 50
): Promise<Record<string, unknown>> {
  let colors: Record<string, unknown> | undefined;
  await pollUntil(
    () => {
      colors = getColorCustomizations();
      if (!colors) {
        return false;
      }
      const marker = colors[GLAZE_ACTIVE_KEY];
      return typeof marker === 'string' && marker.length > 0;
    },
    'Timeout waiting for glaze.active root marker',
    timeoutMs,
    intervalMs
  );
  return colors!;
}

/**
 * Waits for a specific key to appear inside the Glaze-owned theme
 * block in colorCustomizations.
 */
async function waitForGlazeBlockKey(
  key: string,
  timeoutMs = 4000,
  intervalMs = 50
): Promise<Record<string, string>> {
  let block: Record<string, string> | undefined;
  await pollUntil(
    () => {
      const colors = getColorCustomizations();
      if (!colors) {
        return false;
      }
      block = findGlazeBlock(colors);
      return block !== undefined && key in block;
    },
    `Timeout waiting for Glaze theme block key: ${key}`,
    timeoutMs,
    intervalMs
  );
  return block!;
}

/**
 * Waits for the Glaze-owned theme block to exist with at least one
 * key, but WITHOUT a specific key present. Useful for waiting until
 * a debounced reconcile has settled after disabling an element.
 */
async function waitForGlazeBlockKeyAbsent(
  key: string,
  timeoutMs = 4000,
  intervalMs = 50
): Promise<Record<string, string>> {
  let block: Record<string, string> | undefined;
  await pollUntil(
    () => {
      const colors = getColorCustomizations();
      if (!colors) {
        return false;
      }
      block = findGlazeBlock(colors);
      return (
        block !== undefined && Object.keys(block).length > 0 && !(key in block)
      );
    },
    `Timeout waiting for Glaze theme block without key: ${key}`,
    timeoutMs,
    intervalMs
  );
  return block!;
}

/**
 * Waits for colorCustomizations to contain no Glaze-owned content:
 * no root-level Glaze keys, and no Glaze-owned theme blocks.
 */
async function waitForGlazeColorsCleared(
  timeoutMs = 4000,
  intervalMs = 50
): Promise<void> {
  await pollUntil(
    () => {
      const colors = getColorCustomizations();
      if (!colors) {
        return true;
      }
      // Check root-level Glaze keys
      if (Object.keys(colors).some(isRootGlazeKey)) {
        return false;
      }
      // Check for Glaze-owned theme blocks
      if (findGlazeBlock(colors)) {
        return false;
      }
      return true;
    },
    'Timeout waiting for Glaze colors to be cleared',
    timeoutMs,
    intervalMs
  );
}

suite('Extension Test Suite', () => {
  suiteSetup(async () => {
    // Ensure extension is activated
    const ext = vscode.extensions.getExtension('jimeh.glaze');
    assert.ok(ext, 'Glaze extension (jimeh.glaze) not found');
    if (!ext.isActive) {
      await ext.activate();
    }
    // Disable the reconcile guard for integration tests. The
    // guard detects runaway config-write loops, but rapid
    // test-driven reconciles would trip it.
    _setGuardEnabled(false);
  });

  suite('Command Registration', () => {
    test('glaze.enableGlobally command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.enableGlobally'));
    });

    test('glaze.disableGlobally command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.disableGlobally'));
    });
  });

  suite('Disabled behavior', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      const inspection = glazeConfig.inspect<boolean>('enabled');
      originalEnabledGlobal = inspection?.globalValue;
      originalEnabledWorkspace = inspection?.workspaceValue;

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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

      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Wait for the disable-triggered reconcile to fully settle before
      // seeding colorCustomizations, otherwise the debounced reconcile
      // can overwrite our seeded value.
      await waitForGlazeColorsCleared();
      await new Promise((resolve) => setTimeout(resolve, 300));

      const seededColors = { 'editor.background': '#aabbcc' };
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        seededColors,
        vscode.ConfigurationTarget.Workspace
      );

      const ext = vscode.extensions.getExtension('jimeh.glaze');
      assert.ok(ext, 'Glaze extension (jimeh.glaze) not found');
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
            !isRootGlazeKey(key),
            `Glaze key ${key} should not be present when disabled`
          );
        }
      }
    });
  });

  suite('glaze.enableGlobally', () => {
    let originalColorCustomizations: unknown;
    let originalEnabled: boolean | undefined;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
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

    test('sets glaze.enabled to true', async () => {
      // First disable to ensure we're testing the change
      let glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      await vscode.commands.executeCommand('glaze.enableGlobally');

      // Get fresh config after command
      glazeConfig = vscode.workspace.getConfiguration('glaze');
      const enabled = glazeConfig.get<boolean>('enabled');
      assert.strictEqual(enabled, true, 'glaze.enabled should be true');
    });

    test('sets workbench.colorCustomizations when workspace is open', async function () {
      // Skip if no workspace is open (tests might run without workspace)
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a real config change
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await waitForGlazeColorsCleared();

      await vscode.commands.executeCommand('glaze.enableGlobally');

      // Wait for the specific key in the Glaze theme block
      const block = await waitForGlazeBlockKey('titleBar.activeBackground');

      assert.ok(block, 'Glaze theme block should be set');
      assert.ok(
        'titleBar.activeBackground' in block,
        'should have titleBar.activeBackground'
      );
    });

    test('color values are valid hex codes', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a real config change
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await waitForGlazeColorsCleared();

      await vscode.commands.executeCommand('glaze.enableGlobally');

      // Wait for the Glaze theme block with managed keys
      const block = await waitForGlazeBlockKey('titleBar.activeBackground');

      const hexPattern = /^#[0-9a-f]{6}$/i;
      for (const [key, value] of Object.entries(block ?? {})) {
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

  suite('glaze.disableGlobally', () => {
    let originalColorCustomizations: unknown;
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      const inspection = glazeConfig.inspect<boolean>('enabled');
      originalEnabledGlobal = inspection?.globalValue;
      originalEnabledWorkspace = inspection?.workspaceValue;

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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

    test('sets glaze.enabled to false', async () => {
      // First enable to ensure we're testing the change
      let glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      await vscode.commands.executeCommand('glaze.disableGlobally');

      // Get fresh config after command
      glazeConfig = vscode.workspace.getConfiguration('glaze');
      const enabled = glazeConfig.get<boolean>('enabled');
      assert.strictEqual(enabled, false, 'glaze.enabled should be false');
    });

    test('clears Glaze colors from workbench.colorCustomizations', async function () {
      // Extend timeout for this test as it involves multiple async operations
      this.timeout(5000);

      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Clear stale colorCustomizations that another test in this
      // suite may have left (e.g. "preserves unowned managed keys"
      // seeds root-level managed keys without a glaze.active marker).
      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // First enable to set colors
      await vscode.commands.executeCommand('glaze.enableGlobally');

      // Wait for colors to be set
      await waitForColorCustomizations();

      // Then disable
      await vscode.commands.executeCommand('glaze.disableGlobally');

      // Wait for Glaze colors to be cleared
      await waitForGlazeColorsCleared();

      // Verify no Glaze content remains
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, unknown>>(
        'workbench.colorCustomizations'
      );
      if (colors) {
        // No root-level Glaze keys
        for (const key of Object.keys(colors)) {
          assert.ok(
            !isRootGlazeKey(key),
            `Root Glaze key ${key} should be removed`
          );
        }
        // No Glaze-owned theme blocks
        assert.strictEqual(
          findGlazeBlock(colors),
          undefined,
          'no Glaze-owned theme block should remain'
        );
      }
    });

    test('preserves unowned managed keys', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start from clean colorCustomizations so applyTintColors
      // isn't blocked by leftover unowned keys from prior tests.
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Clear workspace override so global controls state
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Enable Glaze via command and wait for colors
      await vscode.commands.executeCommand('glaze.enableGlobally');
      await waitForRootMarker();

      // Replace colorCustomizations with managed keys but NO
      // marker, simulating a user or another tool owning them.
      const seededColors: Record<string, string> = {
        'titleBar.activeBackground': '#112233',
        'editor.background': '#aabbcc',
      };
      await config.update(
        'workbench.colorCustomizations',
        seededColors,
        vscode.ConfigurationTarget.Workspace
      );
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Disable via command
      await vscode.commands.executeCommand('glaze.disableGlobally');
      await new Promise((resolve) => setTimeout(resolve, 400));

      const inspection = config.inspect<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      assert.deepStrictEqual(
        inspection?.workspaceValue,
        seededColors,
        'disableGlobally should preserve unowned managed keys'
      );
    });
  });

  suite('Configuration Change Listener', () => {
    let originalSource: string | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalSource = glazeConfig.inspect<string>(
        'workspaceIdentifier.source'
      )?.globalValue;

      if (vscode.workspace.workspaceFolders?.length) {
        const config = vscode.workspace.getConfiguration();
        originalColorCustomizations = config.get(
          'workbench.colorCustomizations'
        );
      }
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
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

    test('re-applies tint when glaze config changes', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('glaze.disableGlobally');
      await waitForGlazeColorsCleared();

      // Enable glaze first
      await vscode.commands.executeCommand('glaze.enableGlobally');

      // Get initial colors (wait for them to be set)
      const initialColors = await waitForColorCustomizations();

      // Change the identifier source to pathAbsolute (different from default
      // 'name')
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'workspaceIdentifier.source',
        'pathAbsolute',
        vscode.ConfigurationTarget.Global
      );

      // Poll until colors actually differ from initial state
      let newColors: Record<string, unknown> | undefined;
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

  suite('Command Registration (menu)', () => {
    test('glaze.quickMenu command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.quickMenu'));
    });
  });

  suite('Command Registration (seed)', () => {
    test('glaze.randomizeSeed command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.randomizeSeed'));
    });

    test('glaze.resetSeed command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.resetSeed'));
    });
  });

  suite('glaze.randomizeSeed', () => {
    let originalSeedWorkspace: number | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('glaze');
      const inspection = config.inspect<number>('tint.seed');
      originalSeedWorkspace = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.seed',
        originalSeedWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('sets tint.seed to a non-zero value', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Clear workspace seed first
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.seed',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('glaze.randomizeSeed');

      // Get fresh config
      const inspection = config.inspect<number>('tint.seed');
      assert.ok(
        inspection?.workspaceValue !== undefined &&
          inspection.workspaceValue !== 0,
        'tint.seed workspace value should be set to a non-zero value'
      );
    });
  });

  suite('glaze.resetSeed', () => {
    let originalSeedWorkspace: number | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('glaze');
      const inspection = config.inspect<number>('tint.seed');
      originalSeedWorkspace = inspection?.workspaceValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.seed',
        originalSeedWorkspace,
        vscode.ConfigurationTarget.Workspace
      );

      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        originalColorCustomizations,
        vscode.ConfigurationTarget.Workspace
      );
    });

    test('clears workspace seed override', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Set a workspace seed first
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.seed',
        42,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('glaze.resetSeed');

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
    test('glaze.enableWorkspace command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.enableWorkspace'));
    });

    test('glaze.disableWorkspace command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.disableWorkspace'));
    });

    test('glaze.forceApply command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.forceApply'));
    });

    test('glaze.retryApply command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(commands.includes('glaze.retryApply'));
    });
  });

  suite('glaze.active marker', () => {
    let originalColorCustomizations: unknown;
    let originalEnabled: boolean | undefined;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
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

    test('glaze.active exists at root level after enable', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so enableGlobally triggers a fresh apply
      await vscode.commands.executeCommand('glaze.disableGlobally');
      await waitForGlazeColorsCleared();

      await vscode.commands.executeCommand('glaze.enableGlobally');
      const colors = await waitForRootMarker();

      const marker = colors[GLAZE_ACTIVE_KEY];
      assert.ok(
        typeof marker === 'string' && marker.length > 0,
        'should have glaze.active root marker with theme name'
      );
      // Marker should NOT be inside the theme block
      const block = findGlazeBlock(colors);
      assert.ok(block, 'Glaze theme block should exist');
      assert.strictEqual(
        block[GLAZE_ACTIVE_KEY],
        undefined,
        'marker should not be inside the theme block'
      );
    });

    test('glaze.active removed after disable', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      await vscode.commands.executeCommand('glaze.enableGlobally');
      await waitForColorCustomizations();

      await vscode.commands.executeCommand('glaze.disableGlobally');
      await waitForGlazeColorsCleared();

      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, unknown>>(
        'workbench.colorCustomizations'
      );
      if (colors) {
        // No root-level marker
        assert.ok(
          !('glaze.active' in colors),
          'glaze.active should not be at root after disable'
        );
        // No Glaze-owned theme block
        assert.strictEqual(
          findGlazeBlock(colors),
          undefined,
          'no Glaze-owned theme block should remain after disable'
        );
      }
    });
  });

  suite('glaze.enableWorkspace', () => {
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('glaze');
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
      const config = vscode.workspace.getConfiguration('glaze');
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

    test('sets glaze.enabled at workspace scope to true', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First disable at workspace scope to ensure we're testing the change
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('glaze.enableWorkspace');

      // Get fresh config after command
      const inspection = config.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        true,
        'glaze.enabled at workspace scope should be true'
      );
    });
  });

  suite('glaze.disableWorkspace', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration('glaze');
      const inspection = config.inspect<boolean>('enabled');
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
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
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

    test('sets glaze.enabled at workspace scope to false', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // First enable at workspace scope to ensure we're testing the change
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('glaze.disableWorkspace');

      // Get fresh config after command
      const inspection = config.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        false,
        'glaze.enabled at workspace scope should be false'
      );
    });

    test('preserves unowned managed keys', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start from clean colorCustomizations so applyTintColors
      // isn't blocked by leftover unowned keys from prior tests.
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Enable via workspace override and wait for colors
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );
      await vscode.commands.executeCommand('glaze.enableWorkspace');
      await waitForRootMarker();

      // Replace colorCustomizations with managed keys but NO
      // marker, simulating a user or another tool owning them.
      const seededColors: Record<string, string> = {
        'titleBar.activeBackground': '#112233',
        'editor.background': '#aabbcc',
      };
      await config.update(
        'workbench.colorCustomizations',
        seededColors,
        vscode.ConfigurationTarget.Workspace
      );
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Disable via workspace command
      await vscode.commands.executeCommand('glaze.disableWorkspace');
      await new Promise((resolve) => setTimeout(resolve, 400));

      const inspection = config.inspect<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      assert.deepStrictEqual(
        inspection?.workspaceValue,
        seededColors,
        'disableWorkspace should preserve unowned managed keys'
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      const inspection = glazeConfig.inspect<boolean>('enabled');
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.enableGlobally');
      await waitForColorCustomizations();

      // Set workspace override to false (simulates workspace disable)
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Workspace
      );

      // Wait for colors to be cleared
      await waitForGlazeColorsCleared();

      // Verify workspace enabled override is false
      const inspection = glazeConfig.inspect<boolean>('enabled');
      assert.strictEqual(
        inspection?.workspaceValue,
        false,
        'glaze.enabled at workspace scope should be false'
      );
    });

    test('applies colors when workspace override enables globally disabled', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start with global disabled
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.enableWorkspace');

      // Wait for Glaze theme block with colors
      const block = await waitForGlazeBlockKey('titleBar.activeBackground');

      // Verify colors were applied inside theme block
      assert.ok(block, 'Glaze theme block should be set');
      assert.ok(
        'titleBar.activeBackground' in block,
        'should have titleBar.activeBackground in theme block'
      );

      // Verify global is still disabled
      const inspection = glazeConfig.inspect<boolean>('enabled');
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

  suite('glaze.enabled config change listener', () => {
    let originalEnabledGlobal: boolean | undefined;
    let originalEnabledWorkspace: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      const inspection = glazeConfig.inspect<boolean>('enabled');
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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

      // Clear stale colorCustomizations that another test in this
      // suite may have left (e.g. "does not remove managed keys…"
      // seeds root-level managed keys without a glaze.active marker).
      const wbConfig = vscode.workspace.getConfiguration();
      await wbConfig.update(
        'workbench.colorCustomizations',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Enable via command first
      await vscode.commands.executeCommand('glaze.enableGlobally');
      await waitForColorCustomizations();

      // Disable via config change (not command)
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Wait for Glaze colors to be cleared
      await waitForGlazeColorsCleared();

      // Verify no Glaze content remains
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, unknown>>(
        'workbench.colorCustomizations'
      );
      if (colors) {
        for (const key of Object.keys(colors)) {
          assert.ok(
            !isRootGlazeKey(key),
            `Root Glaze key ${key} should be removed`
          );
        }
        assert.strictEqual(
          findGlazeBlock(colors),
          undefined,
          'no Glaze-owned theme block should remain'
        );
      }
    });

    test('re-applies tint when enabled changed to true via config', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Start disabled
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Clear any existing workspace enabled override
      await glazeConfig.update(
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
      await glazeConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Wait for Glaze theme block with colors
      const block = await waitForGlazeBlockKey('titleBar.activeBackground');
      assert.ok(block, 'Glaze theme block should be set');
      assert.ok(
        'titleBar.activeBackground' in block,
        'should have titleBar.activeBackground in theme block'
      );
    });

    test('does not remove managed keys set without glaze.active marker', async function () {
      this.timeout(8000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable Glaze and wait for it to apply colors
      const glazeConfig2 = vscode.workspace.getConfiguration('glaze');
      await glazeConfig2.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig2.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      await waitForRootMarker();

      // Replace colorCustomizations with managed keys but NO
      // marker, simulating a user or another tool owning them.
      const seededColors: Record<string, string> = {
        'titleBar.activeBackground': '#112233',
        'editor.background': '#aabbcc',
      };
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        seededColors,
        vscode.ConfigurationTarget.Workspace
      );

      // Wait for the config-change reconcile to notice the
      // tampered colors before we disable.
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Disable Glaze — this triggers clearTintColors, which
      // must skip removal because it doesn't own the keys.
      await glazeConfig2.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Wait for the disable-triggered reconcile to settle
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Verify the managed keys are still present and unchanged
      const inspection = config.inspect<Record<string, string>>(
        'workbench.colorCustomizations'
      );
      assert.deepStrictEqual(
        inspection?.workspaceValue,
        seededColors,
        'managed keys without marker should be preserved on disable'
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;
      originalStatusBar =
        glazeConfig.inspect<boolean>('elements.statusBar')?.globalValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.disableGlobally');
      await waitForGlazeColorsCleared();

      // Start with statusBar disabled
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'elements.statusBar',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Enable globally — wait for Glaze block WITHOUT statusBar keys,
      // since config event delivery order is not guaranteed.
      await vscode.commands.executeCommand('glaze.enableGlobally');
      let block = await waitForGlazeBlockKeyAbsent('statusBar.background');

      // Verify no statusBar keys
      assert.ok(
        !('statusBar.background' in block),
        'should not have statusBar.background initially'
      );

      // Enable statusBar element
      await glazeConfig.update(
        'elements.statusBar',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Poll until statusBar keys appear in the Glaze block
      block = await waitForGlazeBlockKey('statusBar.background');

      assert.ok(
        'statusBar.background' in block,
        'should have statusBar.background after enabling'
      );
      assert.ok(
        'statusBar.foreground' in block,
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;
      originalSideBar =
        glazeConfig.inspect<boolean>('elements.sideBar')?.globalValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.disableGlobally');
      await waitForGlazeColorsCleared();

      // Start with sideBar disabled (default)
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'elements.sideBar',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Enable globally — wait for Glaze block WITHOUT sideBar keys,
      // since config event delivery order is not guaranteed.
      await vscode.commands.executeCommand('glaze.enableGlobally');
      let block = await waitForGlazeBlockKeyAbsent('sideBar.background');

      // Verify no sideBar keys
      assert.ok(
        !('sideBar.background' in block),
        'should not have sideBar.background initially'
      );

      // Enable sideBar element
      await glazeConfig.update(
        'elements.sideBar',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Poll until sideBar keys appear in the Glaze block
      block = await waitForGlazeBlockKey('sideBar.background');

      assert.ok(
        'sideBar.background' in block,
        'should have sideBar.background after enabling'
      );
      assert.ok(
        'sideBar.foreground' in block,
        'should have sideBar.foreground after enabling'
      );
    });
  });

  suite('glaze.forceApply', () => {
    let originalEnabled: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.enableGlobally');
      await waitForColorCustomizations();

      // Simulate external modification: remove the root marker.
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, unknown>>(
        'workbench.colorCustomizations'
      );
      assert.ok(colors);
      const tampered = { ...colors };
      delete tampered[GLAZE_ACTIVE_KEY];
      await config.update(
        'workbench.colorCustomizations',
        tampered,
        vscode.ConfigurationTarget.Workspace
      );

      // Force apply should re-inject root marker and re-apply
      await vscode.commands.executeCommand('glaze.forceApply');
      const afterColors = await waitForRootMarker();
      const block = findGlazeBlock(afterColors);
      assert.ok(block, 'Glaze theme block should exist after force apply');
      assert.ok(
        'titleBar.activeBackground' in block,
        'managed keys should be present in theme block after force apply'
      );
    });

    test('does not inject marker when colorCustomizations is empty', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Disable first so applyTint becomes a remove-tint no-op
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );

      // Wait for any debounced remove to clear Glaze colors
      await waitForGlazeColorsCleared();

      // Set colors to only non-Glaze keys (empty would be
      // overwritten by debounce races, so use a stable baseline)
      const config = vscode.workspace.getConfiguration();
      await config.update(
        'workbench.colorCustomizations',
        { 'editor.background': '#aabbcc' },
        vscode.ConfigurationTarget.Workspace
      );

      await vscode.commands.executeCommand('glaze.forceApply');

      // Wait for debounced applyTint to settle
      await new Promise((r) => setTimeout(r, 500));

      const colors = config.get<Record<string, unknown>>(
        'workbench.colorCustomizations'
      );
      // forceApply only injects marker into existing colors; since
      // glaze is disabled the debounced apply is a no-op. No Glaze
      // content should be present.
      if (colors) {
        for (const key of Object.keys(colors)) {
          assert.ok(
            !isRootGlazeKey(key),
            `Root Glaze key ${key} should not be present`
          );
        }
        assert.strictEqual(
          findGlazeBlock(colors),
          undefined,
          'no Glaze-owned theme block should be present'
        );
      }
    });

    test('marker has correct value after force apply', async function () {
      this.timeout(5000);
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Enable glaze
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      await vscode.commands.executeCommand('glaze.forceApply');

      const colors = await waitForRootMarker();
      const marker = colors[GLAZE_ACTIVE_KEY];
      assert.ok(
        typeof marker === 'string' && marker.length > 0,
        'glaze.active root marker should be a non-empty string (theme name)'
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      const inspection = glazeConfig.inspect<boolean>('enabled');
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabledGlobal,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
        'enabled',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );
      await waitForGlazeColorsCleared();

      // Rapid toggle: enable → disable → enable
      await glazeConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
        'enabled',
        false,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
        'enabled',
        true,
        vscode.ConfigurationTarget.Global
      );

      // Final state should be enabled with colors in a theme block
      // and root marker present.
      const colors = await waitForRootMarker();
      const block = findGlazeBlock(colors);
      assert.ok(block, 'Glaze theme block should be set');
      assert.ok(
        'titleBar.activeBackground' in block,
        'should have titleBar.activeBackground in theme block'
      );
    });
  });

  suite('forceApply race-safety', () => {
    let originalEnabled: boolean | undefined;
    let originalColorCustomizations: unknown;

    suiteSetup(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;

      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const config = vscode.workspace.getConfiguration();
      originalColorCustomizations = config.get('workbench.colorCustomizations');
    });

    suiteTeardown(async () => {
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.enableGlobally');
      await waitForColorCustomizations();

      // Simulate external modification: remove root marker
      const config = vscode.workspace.getConfiguration();
      const colors = config.get<Record<string, unknown>>(
        'workbench.colorCustomizations'
      );
      assert.ok(colors);
      const tampered = { ...colors };
      delete tampered[GLAZE_ACTIVE_KEY];
      await config.update(
        'workbench.colorCustomizations',
        tampered,
        vscode.ConfigurationTarget.Workspace
      );

      // Immediately fire forceApply — should resolve correctly
      // even if a config-change-triggered reconcile is pending
      await vscode.commands.executeCommand('glaze.forceApply');

      const afterColors = await waitForRootMarker();
      const block = findGlazeBlock(afterColors);
      assert.ok(block, 'Glaze theme block should be set');
      assert.ok(
        'titleBar.activeBackground' in block,
        'managed keys should be present in theme block after forceApply'
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
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      originalEnabled = glazeConfig.inspect<boolean>('enabled')?.globalValue;
      originalSeed = glazeConfig.inspect<number>('tint.seed')?.globalValue;

      const wbConfig = vscode.workspace.getConfiguration();
      originalColorCustomizations = wbConfig.get(
        'workbench.colorCustomizations'
      );
    });

    suiteTeardown(async () => {
      if (!vscode.workspace.workspaceFolders?.length) {
        return;
      }
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'enabled',
        originalEnabled,
        vscode.ConfigurationTarget.Global
      );
      await glazeConfig.update(
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
      await vscode.commands.executeCommand('glaze.disableGlobally');
      await waitForGlazeColorsCleared();

      // Set seed to 0 and enable
      const glazeConfig = vscode.workspace.getConfiguration('glaze');
      await glazeConfig.update(
        'tint.seed',
        0,
        vscode.ConfigurationTarget.Global
      );
      await vscode.commands.executeCommand('glaze.enableGlobally');

      const initialBlock = await waitForGlazeBlockKey(
        'titleBar.activeBackground'
      );
      const initialTitleBar = initialBlock['titleBar.activeBackground'];

      // Change seed
      await glazeConfig.update(
        'tint.seed',
        42,
        vscode.ConfigurationTarget.Global
      );

      // Poll until titleBar color actually changes in the theme block
      let newBlock: Record<string, string> | undefined;
      await pollUntil(() => {
        const colors = getColorCustomizations();
        if (!colors) {
          return false;
        }
        newBlock = findGlazeBlock(colors);
        return (
          newBlock !== undefined &&
          newBlock['titleBar.activeBackground'] !== initialTitleBar
        );
      }, 'titleBar color should change when seed changes');

      assert.ok(newBlock, 'Glaze theme block should still be set');
    });
  });
});
