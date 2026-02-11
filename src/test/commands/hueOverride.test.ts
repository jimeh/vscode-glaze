import * as assert from 'assert';
import * as vscode from 'vscode';
import { updateConfig } from '../helpers';
import { _resetAllState } from '../../reconcile';

suite('hueOverride commands', () => {
  // Snapshot config to restore after all tests.
  let originalBaseHueOverride: number | null | undefined;

  suiteSetup(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    const inspection = config.inspect<number | null>('tint.baseHueOverride');
    originalBaseHueOverride = inspection?.workspaceValue;
  });

  setup(() => {
    _resetAllState();
  });

  teardown(() => {
    _resetAllState();
  });

  suiteTeardown(async () => {
    const config = vscode.workspace.getConfiguration('glaze');
    await config.update(
      'tint.baseHueOverride',
      originalBaseHueOverride,
      vscode.ConfigurationTarget.Workspace
    );
  });

  suite('Command Registration', () => {
    test('glaze.setBaseHueOverride command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes('glaze.setBaseHueOverride'),
        'glaze.setBaseHueOverride should be registered'
      );
    });

    test('glaze.clearBaseHueOverride command is registered', async () => {
      const commands = await vscode.commands.getCommands(true);
      assert.ok(
        commands.includes('glaze.clearBaseHueOverride'),
        'glaze.clearBaseHueOverride should be registered'
      );
    });
  });

  suite('clearBaseHueOverride', () => {
    test('clears tint.baseHueOverride from workspace config', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Set a hue override first.
      await updateConfig(
        'tint.baseHueOverride',
        200,
        vscode.ConfigurationTarget.Workspace
      );

      // Verify it was set.
      const config = vscode.workspace.getConfiguration('glaze');
      let inspection = config.inspect<number | null>('tint.baseHueOverride');
      assert.strictEqual(
        inspection?.workspaceValue,
        200,
        'baseHueOverride should be set before clear'
      );

      // Execute the clear command.
      await vscode.commands.executeCommand('glaze.clearBaseHueOverride');

      // Verify it was cleared.
      inspection = config.inspect<number | null>('tint.baseHueOverride');
      assert.strictEqual(
        inspection?.workspaceValue,
        undefined,
        'baseHueOverride workspace value should be cleared'
      );
    });

    test('works when no override was set (no-op)', async function () {
      if (!vscode.workspace.workspaceFolders?.length) {
        return this.skip();
      }

      // Ensure no override is set.
      const config = vscode.workspace.getConfiguration('glaze');
      await config.update(
        'tint.baseHueOverride',
        undefined,
        vscode.ConfigurationTarget.Workspace
      );

      // Execute the clear command — should not throw.
      await vscode.commands.executeCommand('glaze.clearBaseHueOverride');

      // Verify still unset.
      const inspection = config.inspect<number | null>('tint.baseHueOverride');
      assert.strictEqual(
        inspection?.workspaceValue,
        undefined,
        'baseHueOverride should remain undefined'
      );
    });
  });
});
