/**
 * Pinned extensions configuration.
 * Loads extension IDs that should always be included regardless of popularity.
 */
import * as fs from 'fs';
import { CONFIG } from './config';

interface PinnedExtensionsConfig {
  extensions: string[];
}

/**
 * Loads the list of pinned extension IDs from the config file.
 * @returns Array of extension IDs to always include
 */
export function loadPinnedExtensions(): string[] {
  if (!fs.existsSync(CONFIG.pinnedExtensionsPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(CONFIG.pinnedExtensionsPath, 'utf-8');
    const config = JSON.parse(content) as PinnedExtensionsConfig;
    return config.extensions ?? [];
  } catch (error) {
    console.warn(
      `Failed to load pinned extensions from ${CONFIG.pinnedExtensionsPath}: ` +
        `${error}`
    );
    return [];
  }
}
