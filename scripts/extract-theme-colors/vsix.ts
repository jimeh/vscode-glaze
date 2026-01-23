/**
 * VSIX download and extraction utilities.
 */
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { parse as parseJsonc } from 'jsonc-parser';
import { CONFIG } from './config';
import { isTmThemeContent, isTmThemePath, parseTmTheme } from './tmtheme';
import type { ThemeJson } from './types';

/**
 * Ensures the cache directory exists.
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CONFIG.cacheDir)) {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
  }
}

/**
 * Gets the cache path for a VSIX file using extension ID + version.
 */
function getVsixCachePath(
  publisherName: string,
  extensionName: string,
  version: string
): string {
  const filename = `${publisherName}.${extensionName}-${version}.vsix`;
  return path.join(CONFIG.cacheDir, filename);
}

export interface VsixDownloadOptions {
  publisherName: string;
  extensionName: string;
  version: string;
  url: string;
}

/**
 * Downloads a VSIX file from the marketplace.
 * Returns the file as a Buffer, using cache when available.
 */
export async function downloadVsix(options: VsixDownloadOptions): Promise<Buffer> {
  const { publisherName, extensionName, version, url } = options;
  const cachePath = getVsixCachePath(publisherName, extensionName, version);

  // Check file cache
  if (fs.existsSync(cachePath)) {
    const stats = fs.statSync(cachePath);
    const age = Date.now() - stats.mtimeMs;
    if (age < CONFIG.cacheTtl) {
      return fs.readFileSync(cachePath);
    }
  }

  // Download VSIX
  const response = await fetch(url, {
    signal: AbortSignal.timeout(CONFIG.requestTimeout),
  });

  if (!response.ok) {
    throw new Error(`Failed to download VSIX: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Cache to file
  ensureCacheDir();
  fs.writeFileSync(cachePath, buffer);

  return buffer;
}

/**
 * Extracts and parses package.json from a VSIX buffer.
 */
export function extractPackageJson(
  vsixBuffer: Buffer
): Record<string, unknown> | undefined {
  try {
    const zip = new AdmZip(vsixBuffer);
    const entry = zip.getEntry('extension/package.json');
    if (!entry) return undefined;

    const content = zip.readAsText(entry);
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Creates a theme file reader function for a VSIX buffer.
 * Returns a function that can read theme files from the VSIX.
 */
export function createVsixThemeReader(
  vsixBuffer: Buffer
): (themePath: string) => ThemeJson | undefined {
  const zip = new AdmZip(vsixBuffer);

  return (themePath: string): ThemeJson | undefined => {
    try {
      // Normalize path: remove leading ./ and prepend extension/
      const normalizedPath = themePath.replace(/^\.\//, '');
      const fullPath = `extension/${normalizedPath}`;

      const entry = zip.getEntry(fullPath);
      if (!entry) return undefined;

      const content = zip.readAsText(entry);

      // Detect TextMate themes by path or content
      if (isTmThemePath(themePath) || isTmThemeContent(content)) {
        return parseTmTheme(content);
      }

      return parseJsonc(content) as ThemeJson;
    } catch {
      return undefined;
    }
  };
}
