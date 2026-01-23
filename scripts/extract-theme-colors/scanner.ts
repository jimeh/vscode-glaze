/**
 * Scanner for existing extension files.
 * Reads metadata from .meta.json sidecar files.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import type { ExtensionMetadata } from './types';

/**
 * Scans the extensions directory for existing .meta.json files.
 * @returns Map of extension ID to metadata
 */
export function scanExistingExtensions(): Map<string, ExtensionMetadata> {
  const result = new Map<string, ExtensionMetadata>();

  if (!fs.existsSync(CONFIG.extensionsDir)) {
    return result;
  }

  const files = fs.readdirSync(CONFIG.extensionsDir);
  const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

  for (const metaFile of metaFiles) {
    const metaPath = path.join(CONFIG.extensionsDir, metaFile);
    try {
      const content = fs.readFileSync(metaPath, 'utf-8');
      const metadata = JSON.parse(content) as ExtensionMetadata;
      if (metadata.extensionId) {
        result.set(metadata.extensionId, metadata);
      }
    } catch (error) {
      console.warn(`Failed to read metadata from ${metaFile}: ${error}`);
    }
  }

  return result;
}

/**
 * Gets the filename for an extension (without directory or extension).
 * Uses the format: publisher-name.extension-name (all lowercase, keeping dots)
 */
export function getExtensionFilename(
  publisherName: string,
  extensionName: string
): string {
  return `${publisherName}.${extensionName}`.toLowerCase();
}

/**
 * Gets the full path to an extension's .ts file.
 */
export function getExtensionTsPath(
  publisherName: string,
  extensionName: string
): string {
  const filename = getExtensionFilename(publisherName, extensionName);
  return path.join(CONFIG.extensionsDir, `${filename}.ts`);
}

/**
 * Gets the full path to an extension's .meta.json file.
 */
export function getExtensionMetaPath(
  publisherName: string,
  extensionName: string
): string {
  const filename = getExtensionFilename(publisherName, extensionName);
  return path.join(CONFIG.extensionsDir, `${filename}.meta.json`);
}

/**
 * Checks if an extension needs to be updated based on version.
 * @returns true if the extension should be re-fetched
 */
export function needsUpdate(
  existing: ExtensionMetadata | undefined,
  marketplaceVersion: string
): boolean {
  if (!existing) {
    return true;
  }
  return existing.version !== marketplaceVersion;
}

/**
 * Checks if metadata has themes data (for migration detection).
 */
export function hasThemesInMetadata(metadata: ExtensionMetadata): boolean {
  return Array.isArray(metadata.themes) && metadata.themes.length > 0;
}

/**
 * Cleans up old per-extension .ts files from the extensions directory.
 * These are no longer needed after migration to consolidated colors.ts.
 * @returns Array of deleted file paths
 */
export function cleanupExtensionTsFiles(): string[] {
  const deleted: string[] = [];

  if (!fs.existsSync(CONFIG.extensionsDir)) {
    return deleted;
  }

  const files = fs.readdirSync(CONFIG.extensionsDir);
  const tsFiles = files.filter(
    (f) => f.endsWith('.ts') && !f.endsWith('.d.ts')
  );

  for (const tsFile of tsFiles) {
    const tsPath = path.join(CONFIG.extensionsDir, tsFile);
    fs.unlinkSync(tsPath);
    deleted.push(tsPath);
  }

  return deleted;
}
