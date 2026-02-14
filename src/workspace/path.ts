import * as path from 'path';
import { homedir } from '../platform/os';

/** Cached home directory — never changes during a session. */
export const HOME_DIR = homedir();

/**
 * Normalizes a path by converting backslashes to forward slashes.
 * Ensures consistent hashing across platforms.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Expands ~ or $HOME to the home directory in a path.
 */
export function expandTilde(p: string): string {
  if (p.startsWith('~')) {
    return path.join(HOME_DIR, p.slice(1));
  }
  if (p.startsWith('$HOME')) {
    return path.join(HOME_DIR, p.slice(5));
  }
  return p;
}

/**
 * Infers the home directory from a remote filesystem path.
 * Recognizes common patterns: /home/<user>, /Users/<user>, /root.
 * Returns undefined if the path doesn't match any known pattern.
 */
export function inferRemoteHome(remotePath: string): string | undefined {
  const match = remotePath.match(/^(\/(?:home|Users)\/[^/]+)/);
  if (match) {
    return match[1];
  }
  if (remotePath === '/root' || remotePath.startsWith('/root/')) {
    return '/root';
  }
  return undefined;
}

/**
 * Computes the relative path from a base to a target.
 * Returns undefined if the target is not within the base path.
 */
export function getRelativePath(
  basePath: string,
  targetPath: string
): string | undefined {
  const normalizedBase = normalizePath(path.resolve(basePath));
  const normalizedTarget = normalizePath(path.resolve(targetPath));

  if (
    !normalizedTarget.startsWith(normalizedBase + '/') &&
    normalizedTarget !== normalizedBase
  ) {
    return undefined;
  }

  const relative = path.relative(basePath, targetPath);
  return normalizePath(relative) || '.';
}
