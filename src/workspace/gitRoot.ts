import * as path from 'path';
import * as vscode from 'vscode';
import { normalizePath } from './path';

/**
 * Minimal file system surface used by git root resolution.
 */
export interface WorkspaceFs {
  stat(uri: vscode.Uri): Thenable<vscode.FileStat>;
  readFile(uri: vscode.Uri): Thenable<Uint8Array>;
}

/**
 * Optional dependencies for git root resolution.
 */
export interface ResolveGitRepoRootOptions {
  fs?: WorkspaceFs;
  cache?: Map<string, Promise<vscode.Uri | undefined>>;
}

const DEFAULT_GIT_ROOT_CACHE = new Map<
  string,
  Promise<vscode.Uri | undefined>
>();
const UTF8_DECODER = new TextDecoder('utf-8');

function decodeText(data: Uint8Array): string {
  return UTF8_DECODER.decode(data);
}

function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const error = err as {
    name?: string;
    message?: string;
    code?: string;
  };

  const text = `${error.code ?? ''} ${error.name ?? ''} ${error.message ?? ''}`;
  return /FileNotFound/i.test(text);
}

function getParentUri(uri: vscode.Uri): vscode.Uri | undefined {
  const normalizedPath = path.posix.normalize(uri.path);
  if (normalizedPath === '/' || /^\/[A-Za-z]:\/?$/.test(normalizedPath)) {
    return undefined;
  }

  const parentPath = path.posix.dirname(normalizedPath);
  if (parentPath === normalizedPath) {
    return undefined;
  }

  return uri.with({ path: parentPath });
}

function toUriPath(rawPath: string): string {
  const normalized = normalizePath(rawPath);
  if (/^[A-Za-z]:\//.test(normalized)) {
    return `/${normalized}`;
  }
  return normalized;
}

function resolveGitPath(baseUri: vscode.Uri, rawPath: string): vscode.Uri {
  const trimmed = rawPath.trim();
  const normalized = normalizePath(trimmed);

  const isAbsolute =
    normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized);

  if (isAbsolute) {
    return baseUri.with({ path: path.posix.normalize(toUriPath(normalized)) });
  }

  const joined = path.posix.join(baseUri.path, normalized);
  return baseUri.with({ path: path.posix.normalize(joined) });
}

function parseGitDirPointer(content: string): string | undefined {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = /^gitdir:\s*(.+)\s*$/i.exec(trimmed);
    if (!match) {
      continue;
    }
    return match[1].trim();
  }
  return undefined;
}

function firstNonEmptyLine(content: string): string | undefined {
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return undefined;
}

async function readTextFile(
  uri: vscode.Uri,
  fs: WorkspaceFs
): Promise<string | undefined> {
  try {
    const data = await fs.readFile(uri);
    return decodeText(data);
  } catch (err) {
    if (isNotFoundError(err)) {
      return undefined;
    }
    throw err;
  }
}

async function getGitMarkerType(
  uri: vscode.Uri,
  fs: WorkspaceFs
): Promise<'file' | 'directory' | undefined> {
  try {
    const stat = await fs.stat(uri);
    if ((stat.type & vscode.FileType.Directory) !== 0) {
      return 'directory';
    }
    if ((stat.type & vscode.FileType.File) !== 0) {
      return 'file';
    }
    return undefined;
  } catch (err) {
    if (isNotFoundError(err)) {
      return undefined;
    }
    throw err;
  }
}

function deriveRootFromGitDirPath(
  gitDirUri: vscode.Uri
): vscode.Uri | undefined {
  const normalized = path.posix.normalize(gitDirUri.path);

  if (path.posix.basename(normalized) === '.git') {
    return getParentUri(gitDirUri);
  }

  const worktreesSegment = '/.git/worktrees/';
  const worktreesIndex = normalized.indexOf(worktreesSegment);
  if (worktreesIndex > 0) {
    const rootPath = normalized.slice(0, worktreesIndex);
    return gitDirUri.with({ path: rootPath || '/' });
  }

  return undefined;
}

async function resolveFromGitFile(
  gitMarkerFile: vscode.Uri,
  fs: WorkspaceFs
): Promise<vscode.Uri | undefined> {
  const content = await readTextFile(gitMarkerFile, fs);
  if (!content) {
    return undefined;
  }

  const pointer = parseGitDirPointer(content);
  if (!pointer) {
    return undefined;
  }

  const markerDir = getParentUri(gitMarkerFile);
  if (!markerDir) {
    return undefined;
  }

  const gitDirUri = resolveGitPath(markerDir, pointer);

  const commonDirFile = vscode.Uri.joinPath(gitDirUri, 'commondir');
  const commonDirContent = await readTextFile(commonDirFile, fs);
  if (commonDirContent !== undefined) {
    const commonDirPointer = firstNonEmptyLine(commonDirContent);
    if (commonDirPointer) {
      const commonDirUri = resolveGitPath(gitDirUri, commonDirPointer);
      const commonRoot = deriveRootFromGitDirPath(commonDirUri);
      if (commonRoot) {
        return commonRoot;
      }
    }
  }

  return deriveRootFromGitDirPath(gitDirUri);
}

async function resolveGitRepoRootInner(
  folderUri: vscode.Uri,
  fs: WorkspaceFs
): Promise<vscode.Uri | undefined> {
  let current: vscode.Uri | undefined = folderUri;

  while (current) {
    const gitMarker = vscode.Uri.joinPath(current, '.git');

    let markerType: 'file' | 'directory' | undefined;
    try {
      markerType = await getGitMarkerType(gitMarker, fs);
    } catch {
      return undefined;
    }

    if (markerType === 'directory') {
      return current;
    }

    if (markerType === 'file') {
      try {
        return await resolveFromGitFile(gitMarker, fs);
      } catch {
        return undefined;
      }
    }

    current = getParentUri(current);
  }

  return undefined;
}

/**
 * Resolves the canonical git repository root URI for a workspace folder URI.
 *
 * Supports standard repositories (`.git` directory) and linked worktrees
 * (`.git` pointer file + optional `commondir`). Returns undefined when no
 * repository can be resolved or filesystem access fails.
 */
export async function resolveGitRepoRoot(
  folderUri: vscode.Uri,
  options: ResolveGitRepoRootOptions = {}
): Promise<vscode.Uri | undefined> {
  const fs = options.fs ?? vscode.workspace.fs;
  const cache = options.cache ?? DEFAULT_GIT_ROOT_CACHE;
  const cacheKey = folderUri.toString();

  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = resolveGitRepoRootInner(folderUri, fs)
    .then((result) => {
      // Keep successful resolutions cached, but allow unresolved
      // paths to be re-checked on subsequent calls.
      if (!result) {
        cache.delete(cacheKey);
      }
      return result;
    })
    .catch(() => {
      cache.delete(cacheKey);
      return undefined;
    });

  cache.set(cacheKey, pending);
  return pending;
}

/**
 * Clears the default git root cache.
 */
export function clearGitRepoRootCache(): void {
  DEFAULT_GIT_ROOT_CACHE.clear();
}

/**
 * Test-only alias for backwards compatibility with existing imports.
 */
export function _clearGitRepoRootCache(): void {
  clearGitRepoRootCache();
}
