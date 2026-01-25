/**
 * Unified metadata handling for theme extraction.
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import type { MetadataTheme, RegistrySource } from './types';

/**
 * Built-ins metadata stored in builtins.json.
 */
export interface BuiltinsMetadata {
  /** VS Code release tag (e.g., "1.96.0") */
  tag: string;
  /** ISO timestamp when themes were extracted */
  extractedAt: string;
  /** Extracted theme data */
  themes: MetadataTheme[];
}

/**
 * Single extension metadata within extensions.json.
 */
export interface ExtensionData {
  extensionId: string;
  extensionName: string;
  publisherName: string;
  displayName: string | null;
  version: string;
  extractedAt: string;
  installCount: number;
  stale: boolean;
  themes: MetadataTheme[];
  /** Source registry for this extension */
  source?: RegistrySource;
}

/**
 * In-memory extensions metadata (consolidated from individual files).
 */
export interface ExtensionsMetadata {
  /** Map of extension ID to extension data */
  extensions: Record<string, ExtensionData>;
}

/**
 * Reads builtins metadata from builtins.json.
 * Returns undefined if file doesn't exist or is invalid.
 */
export function readBuiltinsMetadata(): BuiltinsMetadata | undefined {
  if (!fs.existsSync(CONFIG.builtinsMetadataPath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(CONFIG.builtinsMetadataPath, 'utf-8');
    const data = JSON.parse(content) as BuiltinsMetadata;

    // Basic validation
    if (
      typeof data.tag !== 'string' ||
      typeof data.extractedAt !== 'string' ||
      !Array.isArray(data.themes)
    ) {
      return undefined;
    }

    return data;
  } catch {
    return undefined;
  }
}

/**
 * Writes builtins metadata to builtins.json.
 */
export function writeBuiltinsMetadata(data: BuiltinsMetadata): void {
  const dir = CONFIG.outputDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    CONFIG.builtinsMetadataPath,
    JSON.stringify(data, null, 2) + '\n'
  );
}

/**
 * Gets the metadata file path for an extension.
 * File names are lowercase for consistency.
 */
export function getExtensionMetadataPath(extensionId: string): string {
  return path.join(
    CONFIG.extensionsMetadataDir,
    `${extensionId.toLowerCase()}.meta.json`
  );
}

/**
 * Old consolidated format for migration.
 */
interface OldExtensionsMetadata {
  extractedAt: string;
  extensions: Record<string, ExtensionData>;
}

/**
 * Reads from old consolidated extensions.json for migration.
 * Returns undefined if file doesn't exist or is invalid.
 */
function readOldExtensionsJson(): ExtensionsMetadata | undefined {
  const oldPath = path.join(CONFIG.outputDir, 'extensions.json');
  if (!fs.existsSync(oldPath)) {
    return undefined;
  }

  try {
    const content = fs.readFileSync(oldPath, 'utf-8');
    const data = JSON.parse(content) as OldExtensionsMetadata;

    if (typeof data.extensions !== 'object') {
      return undefined;
    }

    return { extensions: data.extensions };
  } catch {
    return undefined;
  }
}

/**
 * Reads extensions metadata from individual .meta.json files.
 * Falls back to old extensions.json during migration.
 * Returns empty extensions map if no data exists.
 */
export function readExtensionsMetadata(): ExtensionsMetadata {
  const dir = CONFIG.extensionsMetadataDir;

  // Try reading from new per-extension files
  if (fs.existsSync(dir)) {
    const result: ExtensionsMetadata = { extensions: {} };

    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.meta.json')) {
          continue;
        }

        const extensionId = file.replace('.meta.json', '');
        const filePath = path.join(dir, file);

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(content) as ExtensionData;

          // Basic validation
          if (
            typeof data.version === 'string' &&
            (typeof data.displayName === 'string' ||
              data.displayName === null) &&
            Array.isArray(data.themes)
          ) {
            result.extensions[extensionId] = data;
          }
        } catch {
          // Skip invalid files
        }
      }
    } catch {
      // Fall through to try old format
    }

    // If we found data, return it
    if (Object.keys(result.extensions).length > 0) {
      return result;
    }
  }

  // Fall back to old consolidated format during migration
  const oldData = readOldExtensionsJson();
  if (oldData) {
    return oldData;
  }

  return { extensions: {} };
}

/**
 * Writes extensions metadata to individual .meta.json files.
 * Only writes files for extensions in the data map. Does not delete
 * files for extensions not in the map (they may be skipped, not removed).
 */
export function writeExtensionsMetadata(data: ExtensionsMetadata): void {
  const dir = CONFIG.extensionsMetadataDir;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write individual files for updated extensions only (lowercase filenames)
  for (const [extensionId, extData] of Object.entries(data.extensions)) {
    const fileName = `${extensionId.toLowerCase()}.meta.json`;
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(extData, null, 2) + '\n');
  }
}

/**
 * Deletes the old consolidated extensions.json file if it exists.
 */
export function deleteOldExtensionsJson(): boolean {
  const oldPath = path.join(CONFIG.outputDir, 'extensions.json');
  if (fs.existsSync(oldPath)) {
    fs.unlinkSync(oldPath);
    return true;
  }
  return false;
}
