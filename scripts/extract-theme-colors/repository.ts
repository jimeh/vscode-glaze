/**
 * Repository content fetcher for GitHub/GitLab.
 */
import { CONFIG } from './config';
import { getCached, setCache } from './cache';
import type { RepoInfo, ThemeContribution, ThemeJson } from './types';

/**
 * Parses a repository URL to extract owner, repo, and type.
 */
export function parseRepoUrl(url: string): RepoInfo | undefined {
  // GitHub patterns
  const githubMatch = url.match(
    /github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?(?:\/|$)/i
  );
  if (githubMatch) {
    return {
      type: 'github',
      owner: githubMatch[1],
      repo: githubMatch[2],
      url,
    };
  }

  // GitLab patterns
  const gitlabMatch = url.match(
    /gitlab\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?(?:\/|$)/i
  );
  if (gitlabMatch) {
    return {
      type: 'gitlab',
      owner: gitlabMatch[1],
      repo: gitlabMatch[2],
      url,
    };
  }

  // Bitbucket patterns
  const bitbucketMatch = url.match(
    /bitbucket\.org[/:]([^/]+)\/([^/.]+)(?:\.git)?(?:\/|$)/i
  );
  if (bitbucketMatch) {
    return {
      type: 'bitbucket',
      owner: bitbucketMatch[1],
      repo: bitbucketMatch[2],
      url,
    };
  }

  return undefined;
}

/**
 * Gets the GitHub token from environment if available.
 */
function getGitHubToken(): string | undefined {
  return process.env[CONFIG.githubTokenEnv];
}

/**
 * Fetches raw content from GitHub.
 */
async function fetchGitHubRaw(
  owner: string,
  repo: string,
  path: string,
  branch = 'main'
): Promise<string | undefined> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  const cacheKey = `github-raw:${owner}/${repo}/${branch}/${path}`;

  const cached = getCached<string>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const token = getGitHubToken();
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.raw',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(CONFIG.requestTimeout),
    });

    if (response.status === 404 && branch === 'main') {
      // Try master branch as fallback
      return fetchGitHubRaw(owner, repo, path, 'master');
    }

    if (!response.ok) {
      return undefined;
    }

    const content = await response.text();
    setCache(cacheKey, content);
    return content;
  } catch {
    return undefined;
  }
}

/**
 * Fetches package.json from a repository.
 */
export async function fetchPackageJson(
  repoInfo: RepoInfo
): Promise<Record<string, unknown> | undefined> {
  if (repoInfo.type !== 'github') {
    // Only GitHub is supported for now
    return undefined;
  }

  const content = await fetchGitHubRaw(
    repoInfo.owner,
    repoInfo.repo,
    'package.json'
  );
  if (!content) return undefined;

  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Fetches a theme JSON file from a repository.
 */
export async function fetchThemeFile(
  repoInfo: RepoInfo,
  themePath: string
): Promise<ThemeJson | undefined> {
  if (repoInfo.type !== 'github') {
    return undefined;
  }

  // Normalize path (remove leading ./)
  const normalizedPath = themePath.replace(/^\.\//, '');

  const content = await fetchGitHubRaw(
    repoInfo.owner,
    repoInfo.repo,
    normalizedPath
  );
  if (!content) return undefined;

  try {
    // Handle JSONC (JSON with comments)
    const cleaned = content
      .replace(/\/\/.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
    return JSON.parse(cleaned) as ThemeJson;
  } catch {
    return undefined;
  }
}

/**
 * Fetches all theme files for an extension.
 */
export async function fetchThemeFiles(
  repoInfo: RepoInfo,
  themes: ThemeContribution[]
): Promise<Map<string, ThemeJson>> {
  const result = new Map<string, ThemeJson>();

  for (const theme of themes) {
    const themeJson = await fetchThemeFile(repoInfo, theme.path);
    if (themeJson) {
      result.set(theme.label, themeJson);
    }
  }

  return result;
}
