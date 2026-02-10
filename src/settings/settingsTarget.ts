import * as vscode from 'vscode';
import { getSettingsTarget } from '../config';

/**
 * Extension ID for the Workspace Config+ extension.
 * When this extension is active, Glaze can write to
 * .vscode/settings.local.json instead of .vscode/settings.json.
 */
const WORKSPACE_CONFIG_PLUS_ID = 'swellaby.workspace-config-plus';

/**
 * Returns true when Glaze should write colorCustomizations to
 * .vscode/settings.local.json rather than .vscode/settings.json.
 *
 * Resolution order:
 * - 'workspaceSettings' → false (always use settings.json)
 * - 'localSettings'     → true  (always use settings.local.json)
 * - 'auto'              → true only when Workspace Config+ is active
 */
export function shouldUseLocalSettings(): boolean {
  const target = getSettingsTarget();
  if (target === 'workspaceSettings') {
    return false;
  }
  if (target === 'localSettings') {
    return true;
  }
  // 'auto' — check for Workspace Config+ extension
  return isWorkspaceConfigPlusActive();
}

/**
 * Returns true when the Workspace Config+ extension is installed
 * and enabled. Note: getExtension() returns undefined for both
 * "not installed" and "installed but disabled".
 */
function isWorkspaceConfigPlusActive(): boolean {
  return vscode.extensions.getExtension(WORKSPACE_CONFIG_PLUS_ID) !== undefined;
}
