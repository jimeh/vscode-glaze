#!/usr/bin/env tsx
/**
 * Theme color extraction script.
 *
 * Fetches VS Code built-in themes from GitHub and popular theme extensions
 * from the marketplace, extracts their background colors, and generates
 * TypeScript code.
 *
 * Supports incremental updates - only re-fetches extensions when their
 * version changes.
 *
 * Usage:
 *   pnpm run extract-themes               # Generate output files
 *   pnpm run extract-themes:dry-run       # Preview without writing
 *   pnpm run extract-themes -- --skip-builtin   # Skip built-in extraction
 *   pnpm run extract-themes -- --force-builtin  # Force built-in re-extraction
 */
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';
import { clearCache } from './cache';
import {
  fetchMarketplaceThemes,
  fetchOpenVsxThemes,
  fetchExtensionById,
  parseThemeContributions,
} from './marketplace';
import { mergeRegistryExtensions } from './registry-merge';
import {
  downloadVsix,
  extractPackageJson,
  createVsixThemeReader,
} from './vsix';
import { parseTheme, validateTheme } from './parser';
import {
  generateReport,
  toMetadataThemes,
  writeExtensionColorsFile,
  writeBuiltinColorsFile,
  type ExtensionFileInfo,
} from './output';
import {
  scanExistingExtensions,
  needsUpdate,
  hasThemesInMetadata,
  toExtensionData,
} from './scanner';
import { loadPinnedExtensions } from './pinned';
import {
  readBuiltinsMetadata,
  writeBuiltinsMetadata,
  writeExtensionsMetadata,
  deleteOldExtensionsJson,
  type ExtensionsMetadata,
} from './metadata';
import { fetchLatestVSCodeRelease, downloadVSCodeSource } from './github';
import { extractBuiltinThemes } from './builtin';
import type {
  ExtractedTheme,
  ExtensionMetadata,
  MarketplaceExtension,
} from './types';

interface CliOptions {
  dryRun: boolean;
  clearCache: boolean;
  verbose: boolean;
  forceAll: boolean;
  skipBuiltin: boolean;
  forceBuiltin: boolean;
  skipStaleUpdates: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    clearCache: args.includes('--clear-cache'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    forceAll: args.includes('--force-all'),
    skipBuiltin: args.includes('--skip-builtin'),
    forceBuiltin: args.includes('--force-builtin'),
    skipStaleUpdates: args.includes('--skip-stale-updates'),
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
    vsixBuffer = await downloadVsix({
      publisherName: extension.publisherName,
      extensionName: extension.extensionName,
      version: extension.version,
      url: extension.vsixUrl,
    });
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
        extension.publisherName,
        extension.extensionName,
        extension.installCount
      );

      if (extracted && validateTheme(extracted)) {
        themes.push(extracted);
        if (verbose) {
          const idPart =
            extracted.name !== extracted.label ? ` [${extracted.name}]` : '';
          console.log(
            `    Extracted: "${extracted.label}"${idPart} (${extracted.type})`
          );
        }
      } else if (verbose) {
        console.log(
          `    Skipping theme "${contribution.label}": invalid or missing data`
        );
      }
    } catch (error) {
      if (verbose) {
        console.log(`    Error processing "${contribution.label}": ${error}`);
      }
    }
  }

  return themes;
}

/**
 * Loads themes from existing metadata.
 */
function loadExistingThemes(metadata: ExtensionMetadata): ExtractedTheme[] {
  if (!hasThemesInMetadata(metadata)) {
    return [];
  }

  return metadata.themes.map((t) => ({
    name: t.name,
    label: t.label,
    colors: t.colors,
    type: t.type,
    extensionId: metadata.extensionId,
    publisherName: metadata.publisherName,
    extensionName: metadata.extensionName,
    installCount: metadata.installCount,
  }));
}

/**
 * Ensures extensions metadata directory exists.
 */
function ensureExtensionsDir(): void {
  if (!fs.existsSync(CONFIG.extensionsMetadataDir)) {
    fs.mkdirSync(CONFIG.extensionsMetadataDir, { recursive: true });
  }
}

/**
 * Cleans up old colors.ts file if it exists.
 */
function cleanupOldColorsFile(): void {
  const oldColorsPath = path.join(CONFIG.outputDir, 'colors.ts');
  if (fs.existsSync(oldColorsPath)) {
    console.log('Cleaning up old colors.ts file...');
    fs.unlinkSync(oldColorsPath);
  }
}

/**
 * Extracts and saves VS Code built-in themes.
 */
async function processBuiltinThemes(
  options: CliOptions
): Promise<{ themes: ExtractedTheme[]; tag: string } | null> {
  if (options.skipBuiltin) {
    console.log('Skipping built-in theme extraction (--skip-builtin)');
    // Load existing if available
    const existing = readBuiltinsMetadata();
    if (existing) {
      const themes = existing.themes.map((t) => ({
        ...t,
        extensionId: 'vscode.builtin',
        publisherName: 'vscode',
        extensionName: 'builtin',
        installCount: 0,
      }));
      return { themes, tag: existing.tag };
    }
    return null;
  }

  console.log('');
  console.log('Processing VS Code built-in themes...');

  // Fetch latest release info
  let release;
  try {
    release = await fetchLatestVSCodeRelease();
    console.log(`Latest VS Code release: ${release.tag_name}`);
  } catch (error) {
    console.error(`Failed to fetch VS Code release info: ${error}`);
    // Fall back to existing metadata
    const existing = readBuiltinsMetadata();
    if (existing) {
      console.log(`Using cached built-in themes from ${existing.tag}`);
      const themes = existing.themes.map((t) => ({
        ...t,
        extensionId: 'vscode.builtin',
        publisherName: 'vscode',
        extensionName: 'builtin',
        installCount: 0,
      }));
      return { themes, tag: existing.tag };
    }
    return null;
  }

  // Check if we need to re-extract
  const existing = readBuiltinsMetadata();
  if (existing && existing.tag === release.tag_name && !options.forceBuiltin) {
    console.log('Built-in themes are up to date, skipping extraction');
    const themes = existing.themes.map((t) => ({
      ...t,
      extensionId: 'vscode.builtin',
      publisherName: 'vscode',
      extensionName: 'builtin',
      installCount: 0,
    }));
    return { themes, tag: existing.tag };
  }

  // Download and extract
  let zipBuffer;
  try {
    zipBuffer = await downloadVSCodeSource(release.tag_name);
  } catch (error) {
    console.error(`Failed to download VS Code source: ${error}`);
    if (existing) {
      console.log(`Using cached built-in themes from ${existing.tag}`);
      const themes = existing.themes.map((t) => ({
        ...t,
        extensionId: 'vscode.builtin',
        publisherName: 'vscode',
        extensionName: 'builtin',
        installCount: 0,
      }));
      return { themes, tag: existing.tag };
    }
    return null;
  }

  const themes = extractBuiltinThemes(zipBuffer);
  console.log(`Extracted ${themes.length} built-in themes`);

  // Save metadata
  if (!options.dryRun) {
    const metadata = {
      tag: release.tag_name,
      extractedAt: new Date().toISOString(),
      themes: toMetadataThemes(themes),
    };
    writeBuiltinsMetadata(metadata);
    console.log(`Saved builtins metadata: ${CONFIG.builtinsMetadataPath}`);

    // Write builtin.ts
    const written = writeBuiltinColorsFile(metadata.themes);
    if (written) {
      console.log(`Written built-in colors to: ${CONFIG.builtinColorsPath}`);
    } else {
      console.log(`Built-in colors unchanged: ${CONFIG.builtinColorsPath}`);
    }
  }

  return { themes, tag: release.tag_name };
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

  // Clean up old file structure and ensure directories exist
  cleanupOldColorsFile();
  ensureExtensionsDir();

  // Step 1: Process built-in themes
  const builtinResult = await processBuiltinThemes(options);
  const builtinThemes = builtinResult?.themes ?? [];

  // Step 2: Scan existing extension files
  console.log('');
  console.log('Scanning existing extension metadata...');
  const existingMetadata = scanExistingExtensions();
  console.log(`Found ${existingMetadata.size} existing extensions`);

  // Step 3: Load pinned extensions
  const pinnedIds = loadPinnedExtensions();
  if (pinnedIds.length > 0) {
    console.log(`Loaded ${pinnedIds.length} pinned extensions`);
  }

  // Step 4: Fetch top N extensions from both registries
  console.log('');
  const marketplaceExts = await fetchMarketplaceThemes();
  console.log('');
  const openvsxExts = await fetchOpenVsxThemes();

  // Step 4b: Merge extensions from both registries
  const { merged: topExtensions, stats: mergeStats } = mergeRegistryExtensions(
    marketplaceExts,
    openvsxExts
  );
  console.log('');
  console.log(
    `Registry merge: ${mergeStats.marketplaceOnly} marketplace-only, ` +
      `${mergeStats.openvsxOnly} openvsx-only, ` +
      `${mergeStats.both} on both ` +
      `(used ${mergeStats.usedMarketplace} from marketplace, ` +
      `${mergeStats.usedOpenvsx} from openvsx)`
  );

  // Step 5: Build merged set of extensions to process
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

  // Step 6: Process extensions (incremental update)
  const allExtensionInfos: ExtensionFileInfo[] = [];
  const extensionsData: ExtensionsMetadata = {
    extensions: {},
  };
  let processed = 0;
  let skipped = 0;
  let updated = 0;

  console.log('');
  console.log('Processing marketplace extensions...');

  for (const [extId, extension] of extensionsToProcess) {
    processed++;
    // Use lowercase extId for lookup (filenames are lowercase)
    const extIdLower = extId.toLowerCase();
    const existing = existingMetadata.get(extIdLower);

    // Check if we need to update
    const shouldUpdate =
      options.forceAll || needsUpdate(existing, extension.version);

    if (!shouldUpdate && existing) {
      // Extension version unchanged - don't write metadata file
      // Only add to output if it has themes (for conflict resolution)
      if (hasThemesInMetadata(existing)) {
        const themes = loadExistingThemes(existing);
        if (themes.length > 0) {
          allExtensionInfos.push({
            publisherName: existing.publisherName,
            extensionName: existing.extensionName,
            // Use live installCount for conflict resolution
            installCount: extension.installCount,
            themes,
          });
        }
      }

      skipped++;

      if (options.verbose) {
        const hasThemes = hasThemesInMetadata(existing);
        console.log(
          `[${processed}/${extensionsToProcess.size}] ` +
            `${extension.displayName} [${extId}] ` +
            `(skipped${hasThemes ? '' : ', no themes'} - v${extension.version})`
        );
      }
      continue;
    }

    // Process extension
    if (options.verbose) {
      console.log(
        `[${processed}/${extensionsToProcess.size}] ` +
          `${extension.displayName} [${extId}] ` +
          `(${existing ? 'updating' : 'new'} - v${extension.version})`
      );
    } else if (processed % 50 === 0) {
      console.log(
        `Processed ${processed}/${extensionsToProcess.size} extensions...`
      );
    }

    const themes = await processExtension(extension, options.verbose);

    // Always store metadata (even with no themes) to avoid re-checking
    const metadata: ExtensionMetadata = {
      extensionId: extension.extensionId,
      extensionName: extension.extensionName,
      publisherName: extension.publisherName,
      displayName: extension.displayName,
      version: extension.version,
      extractedAt: new Date().toISOString(),
      installCount: extension.installCount,
      themes: toMetadataThemes(themes),
      source: extension.source,
    };

    extensionsData.extensions[extIdLower] = toExtensionData(metadata);

    if (themes.length > 0) {
      allExtensionInfos.push({
        publisherName: extension.publisherName,
        extensionName: extension.extensionName,
        installCount: extension.installCount,
        themes,
      });
    }

    updated++;

    // Small delay between VSIX downloads
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Step 7: Handle extensions not in current top results (and not pinned)
  // These extensions still exist in metadata but fell off the top X list
  const currentIdsLower = new Set(
    [...extensionsToProcess.keys()].map((k) => k.toLowerCase())
  );
  let staleChecked = 0;
  let staleUpdated = 0;

  for (const [, metadata] of existingMetadata) {
    const id = `${metadata.publisherName}.${metadata.extensionName}`;
    const idLower = id.toLowerCase();
    if (!currentIdsLower.has(idLower) && !pinnedIds.includes(id)) {
      let themes: ExtractedTheme[] = [];
      let needsWrite = false;

      if (!options.skipStaleUpdates) {
        staleChecked++;

        // Fetch current version from registry
        // If source is known, use it; otherwise try both registries
        let registryExt: MarketplaceExtension | undefined;
        let foundSource = metadata.source;

        try {
          if (metadata.source) {
            // Source is known, query that registry only
            if (options.verbose) {
              const registryName =
                metadata.source === 'openvsx' ? 'OpenVSX' : 'Marketplace';
              console.log(`  Checking ${registryName} for: ${id}`);
            }
            registryExt = await fetchExtensionById(id, metadata.source);
          } else {
            // Source unknown, try marketplace first then OpenVSX
            if (options.verbose) {
              console.log(`  Checking Marketplace for: ${id}`);
            }
            registryExt = await fetchExtensionById(id, 'marketplace');
            if (registryExt) {
              foundSource = 'marketplace';
            } else {
              if (options.verbose) {
                console.log(`  Checking OpenVSX for: ${id}`);
              }
              registryExt = await fetchExtensionById(id, 'openvsx');
              if (registryExt) {
                foundSource = 'openvsx';
              }
            }
          }

          if (
            registryExt &&
            (options.forceAll || needsUpdate(metadata, registryExt.version))
          ) {
            // Download and extract updated themes
            if (options.verbose) {
              console.log(
                `  Updating extension: ${metadata.displayName} ` +
                  `(${metadata.version} → ${registryExt.version})`
              );
            }
            themes = await processExtension(registryExt, options.verbose);
            metadata.version = registryExt.version;
            metadata.extractedAt = new Date().toISOString();
            metadata.installCount = registryExt.installCount;
            metadata.themes = toMetadataThemes(themes);
            metadata.source = foundSource;
            needsWrite = true;
            staleUpdated++;
          } else if (registryExt) {
            // No update needed, load existing themes
            // But update source if we discovered it
            if (!metadata.source && foundSource) {
              metadata.source = foundSource;
              needsWrite = true;
            }
            themes = loadExistingThemes(metadata);
          } else {
            // No longer in registry — keep existing themes
            if (options.verbose) {
              const checked = metadata.source
                ? metadata.source === 'openvsx'
                  ? 'OpenVSX'
                  : 'Marketplace'
                : 'Marketplace and OpenVSX';
              console.log(
                `  Extension not found in ${checked}: ${id} ` +
                  `(keeping existing themes)`
              );
            }
            themes = loadExistingThemes(metadata);
          }
        } catch (error) {
          // Network failure — fall back to existing themes
          if (options.verbose) {
            console.log(
              `  Failed to check extension ${id}: ${error} ` +
                `(keeping existing themes)`
            );
          }
          themes = loadExistingThemes(metadata);
        }
      } else {
        // Skip stale updates flag set — load from disk
        themes = loadExistingThemes(metadata);
      }

      // Include in output if it has themes
      if (themes.length > 0) {
        allExtensionInfos.push({
          publisherName: metadata.publisherName,
          extensionName: metadata.extensionName,
          installCount: metadata.installCount,
          themes,
        });

        if (needsWrite) {
          extensionsData.extensions[idLower] = toExtensionData(metadata);
        }
      }
    }
  }

  if (staleChecked > 0) {
    console.log(
      `Checked ${staleChecked} off-list extensions (${staleUpdated} updated)`
    );
  }

  // Collect all themes for report
  const allThemes: ExtractedTheme[] = [...builtinThemes];
  for (const info of allExtensionInfos) {
    allThemes.push(...info.themes);
  }

  console.log('');
  console.log(
    `Processed ${processed} extensions ` +
      `(${updated} updated, ${skipped} skipped)`
  );
  console.log(`Total themes: ${allThemes.length}`);
  console.log(`  - Built-in: ${builtinThemes.length}`);
  console.log(`  - Extensions: ${allThemes.length - builtinThemes.length}`);

  // Generate report
  const report = generateReport(allThemes);
  console.log('');
  console.log(report);

  // Step 8: Write output files
  if (options.dryRun) {
    console.log('');
    console.log('=== DRY RUN - Would generate output files ===');
    console.log(`Extensions included: ${allExtensionInfos.length}`);
    console.log(`Would write to: ${CONFIG.extensionColorsPath}`);
    const updatedCount = Object.keys(extensionsData.extensions).length;
    console.log(
      `Would write ${updatedCount} updated extension metadata ` +
        `files to: ${CONFIG.extensionsMetadataDir}/`
    );
  } else {
    // Delete old consolidated extensions.json if it exists
    if (deleteOldExtensionsJson()) {
      console.log('Deleted old extensions.json (migrated to separate files)');
    }

    // Write extensions metadata (only updated extensions)
    const updatedCount = Object.keys(extensionsData.extensions).length;
    if (updatedCount > 0) {
      writeExtensionsMetadata(extensionsData);
      console.log(
        `Written ${updatedCount} updated extension metadata ` +
          `files to: ${CONFIG.extensionsMetadataDir}/`
      );
    } else {
      console.log('No extension metadata files needed updating');
    }

    // Write extension colors file
    const colorsWritten = writeExtensionColorsFile(allExtensionInfos);
    if (colorsWritten) {
      console.log(`Written extension colors to: ${CONFIG.extensionColorsPath}`);
    } else {
      console.log(`Extension colors unchanged: ${CONFIG.extensionColorsPath}`);
    }
  }

  console.log('');
  console.log('Done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
