import * as vscode from 'vscode';
import * as path from 'path';
import type { WorkspaceIdentifierConfig } from '../config';
import {
  HOME_DIR,
  normalizePath,
  expandTilde,
  getRelativePath,
  inferRemoteHome,
} from './path';

/**
 * Minimal workspace folder interface for testing.
 */
export interface WorkspaceFolder {
  readonly uri: {
    readonly fsPath: string;
    readonly authority?: string;
    readonly scheme?: string;
  };
  readonly name: string;
}

/**
 * Minimal URI interface for testing.
 */
export interface WorkspaceFileUri {
  readonly fsPath: string;
  readonly authority?: string;
  readonly scheme?: string;
}

/**
 * Returns whether a URI represents a remote workspace.
 */
function isRemoteUri(uri: { scheme?: string; authority?: string }): boolean {
  return !!uri.authority && uri.scheme !== 'file';
}

/**
 * Resolves the effective home directory for path-relative-to-home.
 * For local workspaces, uses os.homedir(). For remote workspaces,
 * tries the configured remoteHomeDirectory, then heuristic
 * inference from the path.
 */
function resolveHomeDir(
  fsPath: string,
  remote: boolean,
  remoteHomeDirectory: string
): string | undefined {
  if (!remote) {
    return HOME_DIR;
  }
  // Try explicit remote home directory setting first
  if (remoteHomeDirectory) {
    return remoteHomeDirectory;
  }
  // Fall back to heuristic inference
  return inferRemoteHome(fsPath);
}

/**
 * Formats a path based on the source configuration.
 */
function formatPath(
  fsPath: string,
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string,
  remote: boolean,
  remoteHomeDirectory: string
): string {
  switch (source) {
    case 'name':
      return path.basename(fsPath);

    case 'pathRelativeToHome': {
      const homeDir = resolveHomeDir(fsPath, remote, remoteHomeDirectory);
      if (homeDir) {
        const relative = getRelativePath(homeDir, fsPath);
        if (relative !== undefined) {
          return relative;
        }
      }
      return normalizePath(fsPath);
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
 * Special handling for 'name' source to use the folder's
 * custom name if set.
 */
function formatFolder(
  folder: WorkspaceFolder,
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string,
  remoteHomeDirectory: string
): string {
  // For 'name' source, use the folder's name property
  // (may be customized)
  if (source === 'name') {
    return folder.name;
  }
  const remote = isRemoteUri(folder.uri);
  return formatPath(
    folder.uri.fsPath,
    source,
    customBasePath,
    remote,
    remoteHomeDirectory
  );
}

/**
 * Formats all folders into a sorted, newline-joined identifier
 * string.
 */
function formatAllFolders(
  folders: readonly WorkspaceFolder[],
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string,
  remoteHomeDirectory: string
): string {
  return folders
    .map((f) => formatFolder(f, source, customBasePath, remoteHomeDirectory))
    .sort()
    .join('\n');
}

/**
 * Extracts the authority prefix from the first remote folder.
 * Returns empty string for local workspaces or when authority
 * prefixing is disabled.
 */
function getAuthorityPrefix(
  folders: readonly WorkspaceFolder[],
  config: WorkspaceIdentifierConfig,
  workspaceFile?: WorkspaceFileUri
): string {
  if (!config.includeRemoteAuthority) {
    return '';
  }

  // For workspace files, check the workspace file URI first
  if (workspaceFile?.authority && workspaceFile.scheme !== 'file') {
    return workspaceFile.authority + ':';
  }

  // Check folder URIs for remote authority
  for (const folder of folders) {
    if (isRemoteUri(folder.uri) && folder.uri.authority) {
      return folder.uri.authority + ':';
    }
  }

  return '';
}

/**
 * Extracts a suitable identifier from the current workspace
 * based on config.
 *
 * @param config - Configuration specifying how to generate the
 *   identifier
 * @param folders - Optional workspace folders (defaults to
 *   vscode.workspace)
 * @param workspaceFile - Optional workspace file URI (defaults
 *   to vscode.workspace.workspaceFile)
 * @returns The workspace identifier, or undefined if no
 *   workspace is open
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
  const { source, customBasePath, remoteHomeDirectory } = config;

  let baseIdentifier: string;

  // Single folder workspace
  if (!isMultiRoot) {
    baseIdentifier = formatFolder(
      workspaceFolders[0],
      source,
      customBasePath,
      remoteHomeDirectory
    );
  } else {
    // Multi-root workspace: use multiRootSource to determine base
    switch (config.multiRootSource) {
      case 'workspaceFile': {
        if (resolvedWorkspaceFile?.fsPath) {
          const remote =
            resolvedWorkspaceFile.scheme !== 'file' &&
            !!resolvedWorkspaceFile.authority;
          baseIdentifier = formatPath(
            resolvedWorkspaceFile.fsPath,
            source,
            customBasePath,
            remote,
            remoteHomeDirectory
          );
        } else {
          // Fall back to allFolders if workspace file unavailable
          baseIdentifier = formatAllFolders(
            workspaceFolders,
            source,
            customBasePath,
            remoteHomeDirectory
          );
        }
        break;
      }

      case 'allFolders':
        baseIdentifier = formatAllFolders(
          workspaceFolders,
          source,
          customBasePath,
          remoteHomeDirectory
        );
        break;

      case 'firstFolder':
      default:
        baseIdentifier = formatFolder(
          workspaceFolders[0],
          source,
          customBasePath,
          remoteHomeDirectory
        );
        break;
    }
  }

  // 'name' source is intentionally host-agnostic — no prefix
  if (source === 'name') {
    return baseIdentifier;
  }

  const prefix = getAuthorityPrefix(
    workspaceFolders,
    config,
    resolvedWorkspaceFile
  );
  return prefix + baseIdentifier;
}
