import * as vscode from 'vscode';
import * as os from 'os';
import type { WorkspaceIdentifierConfig } from '../config';
import { normalizePath, expandTilde, getRelativePath } from './path';

/**
 * Minimal workspace folder interface for testing.
 */
export interface WorkspaceFolder {
  readonly uri: { readonly fsPath: string };
  readonly name: string;
}

/**
 * Extracts a suitable identifier from the current workspace based on config.
 *
 * @param config - Configuration specifying how to generate the identifier
 * @param folders - Optional workspace folders (defaults to vscode.workspace)
 * @returns The workspace identifier, or undefined if no workspace is open
 */
export function getWorkspaceIdentifier(
  config: WorkspaceIdentifierConfig,
  folders?: readonly WorkspaceFolder[]
): string | undefined {
  const workspaceFolders = folders ?? vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }

  const folder = workspaceFolders[0];
  const folderPath = folder.uri.fsPath;

  switch (config.source) {
    case 'name':
      return folder.name;

    case 'pathRelativeToHome': {
      const homedir = os.homedir();
      const relative = getRelativePath(homedir, folderPath);
      return relative ?? normalizePath(folderPath);
    }

    case 'pathAbsolute':
      return normalizePath(folderPath);

    case 'pathRelativeToCustom': {
      if (!config.customBasePath) {
        return normalizePath(folderPath);
      }
      const basePath = expandTilde(config.customBasePath);
      const relative = getRelativePath(basePath, folderPath);
      return relative ?? normalizePath(folderPath);
    }

    default:
      return folder.name;
  }
}
