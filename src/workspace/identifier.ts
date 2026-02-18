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
import { resolveGitRepoRoot } from './gitRoot';

/**
 * Minimal URI interface for testing.
 */
export interface WorkspaceFileUri {
  /**
   * Filesystem-like path used by existing identifier formatting
   * logic (`name`, path-relative/absolute modes).
   */
  readonly fsPath: string;
  /**
   * URI path segment used when reconstructing a `vscode.Uri`
   * for git-root resolution across non-file schemes.
   */
  readonly path?: string;
  /**
   * Remote authority/host identity (for example `ssh-remote+host`)
   * used to detect remote folders and optionally prefix identifiers.
   */
  readonly authority?: string;
  /**
   * URI scheme (for example `file` or `vscode-remote`) used to
   * distinguish local vs remote behavior.
   */
  readonly scheme?: string;
}

/**
 * Minimal workspace folder interface for testing.
 */
export interface WorkspaceFolder {
  /**
   * URI metadata for the workspace folder.
   */
  readonly uri: WorkspaceFileUri;
  /**
   * Display folder name from VS Code. Used directly when identifier
   * source is `name` (unless git-root mode is enabled).
   */
  readonly name: string;
}

/**
 * Resolves git repository root for a workspace folder.
 */
export type GitRepoRootResolver = (
  folder: WorkspaceFolder
) => Promise<string | undefined>;

/**
 * Returns whether a URI represents a remote workspace.
 */
function isRemoteUri(uri: { scheme?: string; authority?: string }): boolean {
  return !!uri.authority && uri.scheme !== 'file';
}

/**
 * Converts a lightweight URI object to a VS Code URI.
 */
function toVscodeUri(uri: WorkspaceFolder['uri']): vscode.Uri {
  const maybeUri = uri as unknown as Partial<vscode.Uri>;
  if (
    typeof maybeUri.with === 'function' &&
    typeof maybeUri.scheme === 'string' &&
    typeof maybeUri.path === 'string'
  ) {
    return uri as unknown as vscode.Uri;
  }

  const scheme = uri.scheme ?? (uri.authority ? 'vscode-remote' : 'file');
  const authority = uri.authority ?? '';

  const fromPath = uri.path;
  const fromFsPath = normalizePath(uri.fsPath);
  const normalizedPath = (fromPath ?? fromFsPath).startsWith('/')
    ? (fromPath ?? fromFsPath)
    : `/${fromPath ?? fromFsPath}`;

  return vscode.Uri.from({
    scheme,
    authority,
    path: normalizedPath,
  });
}

/**
 * Default git root resolver used in runtime.
 */
async function defaultResolveGitRepoRoot(
  folder: WorkspaceFolder
): Promise<string | undefined> {
  const folderUri = toVscodeUri(folder.uri);
  const gitRoot = await resolveGitRepoRoot(folderUri);
  if (!gitRoot) {
    return undefined;
  }

  return folder.uri.scheme === 'file' || !folder.uri.scheme
    ? gitRoot.fsPath
    : gitRoot.path;
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
function formatFolderSync(
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
 * Formats all folders into a sorted, newline-joined identifier string.
 */
function formatAllFoldersSync(
  folders: readonly WorkspaceFolder[],
  source: WorkspaceIdentifierConfig['source'],
  customBasePath: string,
  remoteHomeDirectory: string
): string {
  return folders
    .map((f) =>
      formatFolderSync(f, source, customBasePath, remoteHomeDirectory)
    )
    .sort()
    .join('\n');
}

/**
 * Resolves the path used as identifier input for a folder.
 */
async function resolveIdentifierPath(
  folder: WorkspaceFolder,
  gitRootResolver: GitRepoRootResolver
): Promise<string> {
  try {
    const gitRoot = await gitRootResolver(folder);
    return gitRoot ?? folder.uri.fsPath;
  } catch {
    return folder.uri.fsPath;
  }
}

/**
 * Formats a folder using git-root-based path resolution.
 */
async function formatFolderWithGitRoot(
  folder: WorkspaceFolder,
  config: WorkspaceIdentifierConfig,
  gitRootResolver: GitRepoRootResolver
): Promise<string> {
  const { source, customBasePath, remoteHomeDirectory } = config;
  const resolvedPath = await resolveIdentifierPath(folder, gitRootResolver);

  const remote = isRemoteUri(folder.uri);
  return formatPath(
    resolvedPath,
    source,
    customBasePath,
    remote,
    remoteHomeDirectory
  );
}

/**
 * Formats all folders into a sorted, newline-joined identifier string.
 */
async function formatAllFoldersWithGitRoot(
  folders: readonly WorkspaceFolder[],
  config: WorkspaceIdentifierConfig,
  gitRootResolver: GitRepoRootResolver
): Promise<string> {
  const formatted = await Promise.all(
    folders.map((folder) =>
      formatFolderWithGitRoot(folder, config, gitRootResolver)
    )
  );

  return formatted.sort().join('\n');
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
 * Synchronous identifier path for default (non-git-root) mode.
 */
function buildIdentifierSync(
  config: WorkspaceIdentifierConfig,
  workspaceFolders: readonly WorkspaceFolder[],
  workspaceFile?: WorkspaceFileUri
): string {
  const isMultiRoot = workspaceFolders.length > 1;
  const { source, customBasePath, remoteHomeDirectory } = config;

  let baseIdentifier: string;

  if (!isMultiRoot) {
    baseIdentifier = formatFolderSync(
      workspaceFolders[0],
      source,
      customBasePath,
      remoteHomeDirectory
    );
  } else {
    switch (config.multiRootSource) {
      case 'workspaceFile': {
        if (workspaceFile?.fsPath) {
          const remote =
            workspaceFile.scheme !== 'file' && !!workspaceFile.authority;
          baseIdentifier = formatPath(
            workspaceFile.fsPath,
            source,
            customBasePath,
            remote,
            remoteHomeDirectory
          );
        } else {
          baseIdentifier = formatAllFoldersSync(
            workspaceFolders,
            source,
            customBasePath,
            remoteHomeDirectory
          );
        }
        break;
      }

      case 'allFolders':
        baseIdentifier = formatAllFoldersSync(
          workspaceFolders,
          source,
          customBasePath,
          remoteHomeDirectory
        );
        break;

      case 'firstFolder':
      default:
        baseIdentifier = formatFolderSync(
          workspaceFolders[0],
          source,
          customBasePath,
          remoteHomeDirectory
        );
        break;
    }
  }

  if (source === 'name') {
    return baseIdentifier;
  }

  const prefix = getAuthorityPrefix(workspaceFolders, config, workspaceFile);
  return prefix + baseIdentifier;
}

/**
 * Async identifier path for git-root mode.
 */
async function buildIdentifierWithGitRoot(
  config: WorkspaceIdentifierConfig,
  workspaceFolders: readonly WorkspaceFolder[],
  workspaceFile: WorkspaceFileUri | undefined,
  gitRootResolver: GitRepoRootResolver
): Promise<string> {
  const isMultiRoot = workspaceFolders.length > 1;
  const { source, customBasePath, remoteHomeDirectory } = config;

  let baseIdentifier: string;

  if (!isMultiRoot) {
    baseIdentifier = await formatFolderWithGitRoot(
      workspaceFolders[0],
      config,
      gitRootResolver
    );
  } else {
    switch (config.multiRootSource) {
      case 'workspaceFile': {
        if (workspaceFile?.fsPath) {
          const remote =
            workspaceFile.scheme !== 'file' && !!workspaceFile.authority;
          baseIdentifier = formatPath(
            workspaceFile.fsPath,
            source,
            customBasePath,
            remote,
            remoteHomeDirectory
          );
        } else {
          baseIdentifier = await formatAllFoldersWithGitRoot(
            workspaceFolders,
            config,
            gitRootResolver
          );
        }
        break;
      }

      case 'allFolders':
        baseIdentifier = await formatAllFoldersWithGitRoot(
          workspaceFolders,
          config,
          gitRootResolver
        );
        break;

      case 'firstFolder':
      default:
        baseIdentifier = await formatFolderWithGitRoot(
          workspaceFolders[0],
          config,
          gitRootResolver
        );
        break;
    }
  }

  if (source === 'name') {
    return baseIdentifier;
  }

  const prefix = getAuthorityPrefix(workspaceFolders, config, workspaceFile);
  return prefix + baseIdentifier;
}

/**
 * Extracts a suitable identifier from the current workspace based on config.
 */
export function getWorkspaceIdentifier(
  config: WorkspaceIdentifierConfig,
  folders?: readonly WorkspaceFolder[],
  workspaceFile?: WorkspaceFileUri,
  gitRootResolver: GitRepoRootResolver = defaultResolveGitRepoRoot
): Promise<string | undefined> {
  const workspaceFolders = folders ?? vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return Promise.resolve(undefined);
  }

  const resolvedWorkspaceFile = workspaceFile ?? vscode.workspace.workspaceFile;

  if (config.useGitRepoRoot !== true) {
    return Promise.resolve(
      buildIdentifierSync(config, workspaceFolders, resolvedWorkspaceFile)
    );
  }

  return buildIdentifierWithGitRoot(
    config,
    workspaceFolders,
    resolvedWorkspaceFile,
    gitRootResolver
  );
}
