import * as vscode from 'vscode';
import type { TintTarget } from '../config';

/** All tint targets for parametric tests. */
export const ALL_TARGETS: TintTarget[] = [
  'titleBar',
  'statusBar',
  'activityBar',
  'sideBar',
];

/**
 * Update a glaze configuration value and wait for the change to
 * propagate through VS Code's configuration service.
 *
 * `config.update()` resolves when the write is persisted, but the
 * in-memory configuration cache may not have refreshed yet, causing
 * subsequent `getConfiguration().get()` calls to return stale values.
 * This helper waits for `onDidChangeConfiguration` to fire before
 * returning, ensuring the updated value is immediately readable.
 *
 * When the target-scoped value already matches `value`, no change
 * event will fire, so the function returns immediately.
 */
export async function updateConfig(
  section: string,
  value: unknown,
  target: vscode.ConfigurationTarget
): Promise<void> {
  const config = vscode.workspace.getConfiguration('glaze');

  // If the target-scoped value already matches, config.update()
  // won't fire a change event — skip the wait.
  const inspection = config.inspect(section);
  const current =
    target === vscode.ConfigurationTarget.Global
      ? inspection?.globalValue
      : target === vscode.ConfigurationTarget.Workspace
        ? inspection?.workspaceValue
        : inspection?.workspaceFolderValue;
  if (current === value) {
    return;
  }

  // When the effective value already matches the desired value,
  // onDidChangeConfiguration won't fire (e.g. setting null when the
  // schema default is already null). Still write, but skip the wait.
  if (value !== undefined && config.get(section) === value) {
    await config.update(section, value, target);
    return;
  }

  const changed = new Promise<void>((resolve) => {
    const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(`glaze.${section}`)) {
        disposable.dispose();
        resolve();
      }
    });
  });

  await config.update(section, value, target);
  await changed;
}
