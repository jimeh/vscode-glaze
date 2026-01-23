#!/usr/bin/env tsx
/**
 * Theme color extraction script.
 *
 * Fetches popular VS Code theme extensions from the marketplace,
 * extracts their background colors, and generates TypeScript code.
 *
 * Supports incremental updates - only re-fetches extensions when their
 * version changes. Generates per-extension files with metadata sidecars.
 *
 * Usage:
 *   pnpm run extract-themes           # Generate output files
 *   pnpm run extract-themes:dry-run   # Preview without writing
 */
import { CONFIG } from './config';
import { clearCache } from './cache';
import {
  fetchThemeExtensions,
  fetchExtensionById,
  parseThemeContributions,
} from './marketplace';
import {
  downloadVsix,
  extractPackageJson,
  createVsixThemeReader,
} from './vsix';
import { parseTheme, validateTheme } from './parser';
import {
  generateReport,
  writeExtensionFile,
  writeIndexFile,
  type ExtensionFileInfo,
} from './output';
import {
  scanExistingExtensions,
  needsUpdate,
  getExtensionTsPath,
  getExtensionMetaPath,
} from './scanner';
import { loadPinnedExtensions } from './pinned';
import type {
  ExtractedTheme,
  ExtensionMetadata,
  MarketplaceExtension,
} from './types';
import * as fs from 'fs';

interface CliOptions {
  dryRun: boolean;
  clearCache: boolean;
  verbose: boolean;
  forceAll: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    clearCache: args.includes('--clear-cache'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    forceAll: args.includes('--force-all'),
  };
}

async function processExtension(
  extension: MarketplaceExtension,
  verbose: boolean
): Promise<ExtractedTheme[]> {
  const themes: ExtractedTheme[] = [];

  if (!extension.vsixUrl) {
    if (verbose) {
      console.log(`  Skipping ${extension.displayName}: no VSIX URL`);
    }
    return themes;
  }

  // Download VSIX
  let vsixBuffer: Buffer;
  try {
    vsixBuffer = await downloadVsix(extension.vsixUrl);
  } catch (error) {
    if (verbose) {
      console.log(`  Skipping ${extension.displayName}: VSIX download failed`);
    }
    return themes;
  }

  // Extract package.json from VSIX
  const packageJson = extractPackageJson(vsixBuffer);
  if (!packageJson) {
    if (verbose) {
      console.log(
        `  Skipping ${extension.displayName}: no package.json in VSIX`
      );
    }
    return themes;
  }

  const contributions = parseThemeContributions(packageJson);
  if (contributions.length === 0) {
    if (verbose) {
      console.log(
        `  Skipping ${extension.displayName}: no theme contributions`
      );
    }
    return themes;
  }

  // Create theme file reader for this VSIX
  const readThemeFile = createVsixThemeReader(vsixBuffer);

  // Process each theme contribution
  for (const contribution of contributions) {
    try {
      const themeJson = readThemeFile(contribution.path);
      if (!themeJson) {
        if (verbose) {
          console.log(
            `    Skipping theme "${contribution.label}": could not extract`
          );
        }
        continue;
      }

      const extracted = parseTheme(
        themeJson,
        contribution,
        readThemeFile,
        extension.extensionId,
        extension.extensionName,
        extension.installCount
      );

      if (extracted && validateTheme(extracted)) {
        themes.push(extracted);
        if (verbose) {
          console.log(`    Extracted: ${extracted.name} (${extracted.type})`);
        }
      } else if (verbose) {
        console.log(
          `    Skipping theme "${contribution.label}": invalid or missing data`
        );
      }
    } catch (error) {
      if (verbose) {
        console.log(
          `    Error processing "${contribution.label}": ${error}`
        );
      }
    }
  }

  return themes;
}

/**
 * Loads themes from an existing extension file.
 */
function loadExistingThemes(
  publisherName: string,
  extensionName: string,
  metadata: ExtensionMetadata
): ExtractedTheme[] {
  const tsPath = getExtensionTsPath(publisherName, extensionName);

  if (!fs.existsSync(tsPath)) {
    return [];
  }

  try {
    // Parse the file content to extract theme data
    const content = fs.readFileSync(tsPath, 'utf-8');

    // Extract themes using regex
    const themes: ExtractedTheme[] = [];
    const themeRegex =
      /"([^"]+)":\s*\{\s*colors:\s*(\{[^}]+\}),\s*type:\s*'([^']+)'/g;
    let match;

    while ((match = themeRegex.exec(content)) !== null) {
      const [, name, colorsStr, type] = match;

      // Parse colors object
      const colors: Record<string, string> = {};
      const colorRegex = /'([^']+)':\s*'([^']+)'/g;
      let colorMatch;
      while ((colorMatch = colorRegex.exec(colorsStr)) !== null) {
        colors[colorMatch[1]] = colorMatch[2];
      }

      if (colors['editor.background']) {
        themes.push({
          name,
          label: name, // When loading from existing files, assume name is the label
          colors: colors as ExtractedTheme['colors'],
          type: type as ExtractedTheme['type'],
          extensionId: metadata.extensionId,
          extensionName: metadata.extensionName,
          installCount: metadata.installCount,
        });
      }
    }

    return themes;
  } catch (error) {
    console.warn(
      `Failed to load themes from ${tsPath}: ${error}`
    );
    return [];
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log('Theme Color Extraction Script');
  console.log('=============================');
  console.log('');

  if (options.clearCache) {
    console.log('Clearing cache...');
    clearCache();
  }

  // Step 1: Scan existing extension files
  console.log('Scanning existing extension files...');
  const existingMetadata = scanExistingExtensions();
  console.log(`Found ${existingMetadata.size} existing extension files`);

  // Step 2: Load pinned extensions
  const pinnedIds = loadPinnedExtensions();
  if (pinnedIds.length > 0) {
    console.log(`Loaded ${pinnedIds.length} pinned extensions`);
  }

  // Step 3: Fetch top N extensions from marketplace
  const topExtensions = await fetchThemeExtensions();

  // Step 4: Build merged set of extensions to process
  const extensionsToProcess = new Map<string, MarketplaceExtension>();

  // Add top extensions
  for (const ext of topExtensions) {
    const id = `${ext.publisherName}.${ext.extensionName}`;
    extensionsToProcess.set(id, ext);
  }

  // Add pinned extensions (fetch if not already in top list)
  for (const pinnedId of pinnedIds) {
    if (!extensionsToProcess.has(pinnedId)) {
      console.log(`Fetching pinned extension: ${pinnedId}`);
      const ext = await fetchExtensionById(pinnedId);
      if (ext) {
        const id = `${ext.publisherName}.${ext.extensionName}`;
        extensionsToProcess.set(id, ext);
      } else {
        console.warn(`Could not fetch pinned extension: ${pinnedId}`);
      }
    }
  }

  // Step 5: Process extensions (incremental update)
  const allExtensionInfos: ExtensionFileInfo[] = [];
  let processed = 0;
  let skipped = 0;
  let updated = 0;

  console.log('');
  console.log('Processing extensions...');

  for (const [, extension] of extensionsToProcess) {
    processed++;
    const existing = existingMetadata.get(extension.extensionId);

    // Check if we need to update
    const shouldUpdate =
      options.forceAll || needsUpdate(existing, extension.version);

    if (!shouldUpdate && existing) {
      // Load themes from existing file
      const themes = loadExistingThemes(
        existing.publisherName,
        existing.extensionName,
        existing
      );

      if (themes.length > 0) {
        allExtensionInfos.push({
          publisherName: existing.publisherName,
          extensionName: existing.extensionName,
          installCount: extension.installCount,
          themes,
        });
        skipped++;

        if (options.verbose) {
          console.log(
            `[${processed}/${extensionsToProcess.size}] ` +
              `${extension.displayName} (skipped - v${extension.version})`
          );
        }
        continue;
      }
    }

    // Process extension
    if (options.verbose) {
      console.log(
        `[${processed}/${extensionsToProcess.size}] ${extension.displayName} ` +
          `(${existing ? 'updating' : 'new'} - v${extension.version})`
      );
    } else if (processed % 50 === 0) {
      console.log(
        `Processed ${processed}/${extensionsToProcess.size} extensions...`
      );
    }

    const themes = await processExtension(extension, options.verbose);

    if (themes.length > 0) {
      const metadata: ExtensionMetadata = {
        extensionId: extension.extensionId,
        extensionName: extension.extensionName,
        publisherName: extension.publisherName,
        displayName: extension.displayName,
        version: extension.version,
        extractedAt: new Date().toISOString(),
        installCount: extension.installCount,
        stale: false,
      };

      if (!options.dryRun) {
        writeExtensionFile(
          extension.publisherName,
          extension.extensionName,
          themes,
          metadata
        );
      }

      allExtensionInfos.push({
        publisherName: extension.publisherName,
        extensionName: extension.extensionName,
        installCount: extension.installCount,
        themes,
      });

      updated++;
    }

    // Small delay between VSIX downloads
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Step 6: Mark extensions not in marketplace + not pinned as stale
  const currentIds = new Set(extensionsToProcess.keys());
  for (const [, metadata] of existingMetadata) {
    const id = `${metadata.publisherName}.${metadata.extensionName}`;
    if (!currentIds.has(id) && !pinnedIds.includes(id)) {
      if (!metadata.stale) {
        console.log(`Marking as stale: ${metadata.displayName}`);
        if (!options.dryRun) {
          const metaPath = getExtensionMetaPath(
            metadata.publisherName,
            metadata.extensionName
          );
          metadata.stale = true;
          fs.writeFileSync(
            metaPath,
            JSON.stringify(metadata, null, 2) + '\n'
          );
        }
      }

      // Still include stale extensions in the output
      const themes = loadExistingThemes(
        metadata.publisherName,
        metadata.extensionName,
        metadata
      );
      if (themes.length > 0) {
        allExtensionInfos.push({
          publisherName: metadata.publisherName,
          extensionName: metadata.extensionName,
          installCount: metadata.installCount,
          themes,
        });
      }
    }
  }

  // Collect all themes for report
  const allThemes: ExtractedTheme[] = [];
  for (const info of allExtensionInfos) {
    allThemes.push(...info.themes);
  }

  console.log('');
  console.log(
    `Processed ${processed} extensions ` +
      `(${updated} updated, ${skipped} skipped)`
  );
  console.log(`Total themes: ${allThemes.length}`);

  // Generate report
  const report = generateReport(allThemes);
  console.log('');
  console.log(report);

  // Step 7: Generate index file
  if (options.dryRun) {
    console.log('');
    console.log('=== DRY RUN - Would generate index file ===');
    console.log(`Extensions included: ${allExtensionInfos.length}`);
    console.log(`Would write to: ${CONFIG.indexPath}`);
  } else {
    writeIndexFile(allExtensionInfos);
    console.log(`Written index to: ${CONFIG.indexPath}`);
  }

  console.log('');
  console.log('Done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
