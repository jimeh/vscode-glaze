/**
 * Scanner for existing extension metadata.
 * Reads from consolidated extensions.json file.
 */
import { readExtensionsMetadata, type ExtensionData } from './metadata';
import type { ExtensionMetadata } from './types';

/**
 * Scans for existing extension metadata from extensions.json.
 * @returns Map of extension ID to metadata
 */
export function scanExistingExtensions(): Map<string, ExtensionMetadata> {
  const result = new Map<string, ExtensionMetadata>();
  const metadata = readExtensionsMetadata();

  for (const [extensionId, data] of Object.entries(metadata.extensions)) {
    // Convert ExtensionData to ExtensionMetadata format, preserving stored values
    const meta: ExtensionMetadata = {
      extensionId: data.extensionId,
      extensionName: data.extensionName,
      publisherName: data.publisherName,
      displayName: data.displayName,
      version: data.version,
      extractedAt: data.extractedAt,
      installCount: data.installCount,
      stale: data.stale,
      themes: data.themes,
    };
    result.set(extensionId, meta);
  }

  return result;
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
 * Converts ExtensionMetadata to ExtensionData format for storage.
 */
export function toExtensionData(metadata: ExtensionMetadata): ExtensionData {
  return {
    extensionId: metadata.extensionId,
    extensionName: metadata.extensionName,
    publisherName: metadata.publisherName,
    displayName: metadata.displayName,
    version: metadata.version,
    extractedAt: metadata.extractedAt,
    installCount: metadata.installCount,
    stale: metadata.stale,
    themes: metadata.themes,
  };
}
