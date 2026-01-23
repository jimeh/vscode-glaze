/**
 * File-based cache for HTTP responses.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { CONFIG } from './config';
import type { CacheEntry } from './types';

/**
 * Ensures the cache directory exists.
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CONFIG.cacheDir)) {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
  }
}

/**
 * Generates a cache key from a URL.
 */
function getCacheKey(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex');
}

/**
 * Gets the cache file path for a URL.
 */
function getCachePath(url: string): string {
  return path.join(CONFIG.cacheDir, `${getCacheKey(url)}.json`);
}

/**
 * Gets a cached value if it exists and is not expired.
 */
export function getCached<T>(url: string): T | undefined {
  const cachePath = getCachePath(url);
  if (!fs.existsSync(cachePath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(cachePath, 'utf-8');
    const entry: CacheEntry<T> = JSON.parse(content);
    const age = Date.now() - entry.timestamp;
    if (age > CONFIG.cacheTtl) {
      fs.unlinkSync(cachePath);
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

/**
 * Stores a value in the cache.
 */
export function setCache<T>(url: string, data: T): void {
  ensureCacheDir();
  const cachePath = getCachePath(url);
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  fs.writeFileSync(cachePath, JSON.stringify(entry));
}

/**
 * Clears all cached data.
 */
export function clearCache(): void {
  if (fs.existsSync(CONFIG.cacheDir)) {
    const files = fs.readdirSync(CONFIG.cacheDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(CONFIG.cacheDir, file));
      }
    }
  }
}
