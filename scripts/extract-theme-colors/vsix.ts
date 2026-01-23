/**
 * VSIX download and extraction utilities.
 */
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { CONFIG } from './config';
import { getCached, setCache } from './cache';
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
 * Gets the cache path for a VSIX file.
 */
function getVsixCachePath(url: string): string {
  // Create a safe filename from the URL
  const safeName = url
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-200); // Limit filename length
  return path.join(CONFIG.cacheDir, `${safeName}.vsix`);
}

/**
 * Downloads a VSIX file from the marketplace.
 * Returns the file as a Buffer, using cache when available.
 */
export async function downloadVsix(url: string): Promise<Buffer> {
  const cachePath = getVsixCachePath(url);

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
 * Cleans JSONC content (removes comments and trailing commas).
 * Preserves content inside strings.
 */
function cleanJsonc(content: string): string {
  // State machine to handle strings and comments properly
  let result = '';
  let i = 0;
  let inString = false;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inString) {
      result += char;
      if (char === '\\' && i + 1 < content.length) {
        // Escaped character, include next char as-is
        result += nextChar;
        i += 2;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    // Not in string
    if (char === '"') {
      inString = true;
      result += char;
      i++;
      continue;
    }

    // Check for single-line comment
    if (char === '/' && nextChar === '/') {
      // Skip until end of line
      while (i < content.length && content[i] !== '\n') {
        i++;
      }
      continue;
    }

    // Check for multi-line comment
    if (char === '/' && nextChar === '*') {
      i += 2;
      while (i < content.length - 1) {
        if (content[i] === '*' && content[i + 1] === '/') {
          i += 2;
          break;
        }
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  // Remove trailing commas
  return result.replace(/,(\s*[}\]])/g, '$1');
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
      const cleaned = cleanJsonc(content);
      return JSON.parse(cleaned) as ThemeJson;
    } catch {
      return undefined;
    }
  };
}
