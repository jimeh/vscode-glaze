/**
 * GitHub API client for fetching VS Code source.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';

const GITHUB_API = 'https://api.github.com';
const VSCODE_REPO = 'microsoft/vscode';

/**
 * GitHub release information.
 */
export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  zipball_url: string;
}

/**
 * Fetches the latest VS Code release from GitHub.
 */
export async function fetchLatestVSCodeRelease(): Promise<GitHubRelease> {
  const url = `${GITHUB_API}/repos/${VSCODE_REPO}/releases/latest`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'vscode-glaze-theme-extractor',
    },
    signal: AbortSignal.timeout(CONFIG.requestTimeout),
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch latest release: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as GitHubRelease;
}

/**
 * Gets the cache path for a VS Code source zip.
 */
function getVSCodeZipCachePath(tag: string): string {
  return path.join(CONFIG.cacheDir, `vscode-${tag}.zip`);
}

/**
 * Downloads the VS Code source zip from GitHub.
 * Uses cache if available and not expired.
 */
export async function downloadVSCodeSource(tag: string): Promise<Buffer> {
  const cachePath = getVSCodeZipCachePath(tag);

  // Check cache
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const age = Date.now() - stats.mtimeMs;
    // Cache VS Code source for longer (30 days) since releases are infrequent
    if (age < 30 * 24 * 60 * 60 * 1000) {
      console.log(`Using cached VS Code source: ${cachePath}`);
      return fs.readFileSync(cachePath);
    }
  }

  console.log(`Downloading VS Code source for ${tag}...`);

  // Download from GitHub
  const url = `https://github.com/${VSCODE_REPO}/archive/refs/tags/${tag}.zip`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'vscode-glaze-theme-extractor',
    },
    signal: AbortSignal.timeout(60000), // 60s timeout for large download
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download VS Code source: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Ensure cache directory exists
  if (!fs.existsSync(CONFIG.cacheDir)) {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
  }

  // Cache the zip
  fs.writeFileSync(cachePath, buffer);
  console.log(`Cached VS Code source: ${cachePath}`);

  return buffer;
}
