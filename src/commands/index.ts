import type * as vscode from 'vscode';
import type { StatusBarManager } from '../statusBar';
import { registerClipboardCommands } from './clipboard';
import { registerEnableCommands } from './enable';
import { registerHueOverrideCommands } from './hueOverride';
import { registerMenuCommands } from './menu';
import { registerSeedCommands } from './seed';
import { registerUiCommands } from './ui';

/** Register all Patina commands and return their disposables. */
export function registerAllCommands(
  extensionUri: vscode.Uri,
  statusBar: StatusBarManager
): vscode.Disposable[] {
  return [
    ...registerEnableCommands(),
    ...registerMenuCommands(),
    ...registerSeedCommands(statusBar),
    ...registerHueOverrideCommands(statusBar),
    ...registerUiCommands(extensionUri),
    ...registerClipboardCommands(),
  ];
}
