import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
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
 * Minimal URI interface for testing.
 */
export interface WorkspaceFileUri {
  readonly fsPath: string;
}

/**
 * Formats a path based on the source configuration.
 */
function formatPath(
  fsPath: string,
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string
): string {
  switch (source) {
    case 'name':
      return path.basename(fsPath);

    case 'pathRelativeToHome': {
      const homedir = os.homedir();
      const relative = getRelativePath(homedir, fsPath);
      return relative ?? normalizePath(fsPath);
    }

    case 'pathAbsolute':
      return normalizePath(fsPath);

    case 'pathRelativeToCustom': {
      if (!customBasePath) {
        return normalizePath(fsPath);
      }
      const basePath = expandTilde(customBasePath);
      const relative = getRelativePath(basePath, fsPath);
      return relative ?? normalizePath(fsPath);
    }

    default:
      return path.basename(fsPath);
  }
}

/**
 * Formats a folder based on the source configuration.
 * Special handling for 'name' source to use the folder's custom name if set.
 */
function formatFolder(
  folder: WorkspaceFolder,
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string
): string {
  // For 'name' source, use the folder's name property (may be customized)
  if (source === 'name') {
    return folder.name;
  }
  return formatPath(folder.uri.fsPath, source, customBasePath);
}

/**
 * Formats all folders into a sorted, newline-joined identifier string.
 */
function formatAllFolders(
  folders: readonly WorkspaceFolder[],
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string
): string {
  return folders
    .map((f) => formatFolder(f, source, customBasePath))
    .sort()
    .join('\n');
}

/**
 * Extracts a suitable identifier from the current workspace based on config.
 *
 * @param config - Configuration specifying how to generate the identifier
 * @param folders - Optional workspace folders (defaults to vscode.workspace)
 * @param workspaceFile - Optional workspace file URI (defaults to
 *   vscode.workspace.workspaceFile)
 * @returns The workspace identifier, or undefined if no workspace is open
 */
export function getWorkspaceIdentifier(
  config: WorkspaceIdentifierConfig,
  folders?: readonly WorkspaceFolder[],
  workspaceFile?: WorkspaceFileUri
): string | undefined {
  const workspaceFolders = folders ?? vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }

  const resolvedWorkspaceFile = workspaceFile ?? vscode.workspace.workspaceFile;
  const isMultiRoot = workspaceFolders.length > 1;

  // Single folder workspace: use existing behavior
  if (!isMultiRoot) {
    return formatFolder(
      workspaceFolders[0],
      config.source,
      config.customBasePath
    );
  }

  // Multi-root workspace: use multiRootSource to determine base
  switch (config.multiRootSource) {
    case 'workspaceFile': {
      // Use workspace file if available
      if (resolvedWorkspaceFile?.fsPath) {
        return formatPath(
          resolvedWorkspaceFile.fsPath,
          config.source,
          config.customBasePath
        );
      }
      // Fall back to allFolders if workspace file unavailable
      return formatAllFolders(
        workspaceFolders,
        config.source,
        config.customBasePath
      );
    }

    case 'allFolders':
      return formatAllFolders(
        workspaceFolders,
        config.source,
        config.customBasePath
      );

    case 'firstFolder':
    default:
      return formatFolder(
        workspaceFolders[0],
        config.source,
        config.customBasePath
      );
  }
}
