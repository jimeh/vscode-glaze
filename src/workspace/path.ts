import * as os from 'os';
import * as path from 'path';

/**
 * Normalizes a path by converting backslashes to forward slashes.
 * Ensures consistent hashing across platforms.
 */
export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Expands ~ to the home directory in a path.
 */
export function expandTilde(p: string): string {
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
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
