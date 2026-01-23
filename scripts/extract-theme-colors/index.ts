#!/usr/bin/env tsx
/**
 * Theme color extraction script.
 *
 * Fetches popular VS Code theme extensions from the marketplace,
 * extracts their background colors, and generates TypeScript code.
 *
 * Usage:
 *   pnpm run extract-themes           # Generate output file
 *   pnpm run extract-themes:dry-run   # Preview without writing
 */
import { CONFIG } from './config';
import { clearCache } from './cache';
import {
  fetchThemeExtensions,
  parseThemeContributions,
} from './marketplace';
import { parseRepoUrl, fetchPackageJson, fetchThemeFile } from './repository';
import { parseTheme, validateTheme } from './parser';
import {
  generateTypeScriptCode,
  writeOutputFile,
  generateReport,
} from './output';
import type { ExtractedTheme } from './types';

interface CliOptions {
  dryRun: boolean;
  clearCache: boolean;
  verbose: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    clearCache: args.includes('--clear-cache'),
    verbose: args.includes('--verbose') || args.includes('-v'),
  };
}

async function processExtension(
  extension: {
    extensionId: string;
    extensionName: string;
    displayName: string;
    repositoryUrl?: string;
  },
  verbose: boolean
): Promise<ExtractedTheme[]> {
  const themes: ExtractedTheme[] = [];

  if (!extension.repositoryUrl) {
    if (verbose) {
      console.log(`  Skipping ${extension.displayName}: no repository URL`);
    }
    return themes;
  }

  const repoInfo = parseRepoUrl(extension.repositoryUrl);
  if (!repoInfo) {
    if (verbose) {
      console.log(
        `  Skipping ${extension.displayName}: unsupported repository`
      );
    }
    return themes;
  }

  // Fetch package.json to get theme contributions
  const packageJson = await fetchPackageJson(repoInfo);
  if (!packageJson) {
    if (verbose) {
      console.log(
        `  Skipping ${extension.displayName}: could not fetch package.json`
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

  // Process each theme contribution
  for (const contribution of contributions) {
    try {
      const themeJson = await fetchThemeFile(repoInfo, contribution.path);
      if (!themeJson) {
        if (verbose) {
          console.log(
            `    Skipping theme "${contribution.label}": could not fetch`
          );
        }
        continue;
      }

      const extracted = await parseTheme(
        themeJson,
        contribution,
        repoInfo,
        extension.extensionId,
        extension.extensionName
      );

      if (extracted && validateTheme(extracted)) {
        themes.push(extracted);
        if (verbose) {
          console.log(`    Extracted: ${extracted.name} (${extracted.kind})`);
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

async function main(): Promise<void> {
  const options = parseArgs();

  console.log('Theme Color Extraction Script');
  console.log('=============================');
  console.log('');

  if (options.clearCache) {
    console.log('Clearing cache...');
    clearCache();
  }

  // Fetch extensions from marketplace
  const extensions = await fetchThemeExtensions();

  // Process each extension
  const allThemes: ExtractedTheme[] = [];
  let processed = 0;

  console.log('');
  console.log('Processing extensions...');

  for (const extension of extensions) {
    processed++;
    if (options.verbose) {
      console.log(
        `[${processed}/${extensions.length}] ${extension.displayName}`
      );
    } else if (processed % 50 === 0) {
      console.log(`Processed ${processed}/${extensions.length} extensions...`);
    }

    const themes = await processExtension(extension, options.verbose);
    allThemes.push(...themes);

    // Small delay to be nice to GitHub API
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('');
  console.log(`Extracted ${allThemes.length} themes from ${processed} extensions`);

  // Generate report
  const report = generateReport(allThemes);
  console.log('');
  console.log(report);

  // Generate TypeScript code
  const code = generateTypeScriptCode(allThemes);

  if (options.dryRun) {
    console.log('');
    console.log('=== DRY RUN - Generated code preview ===');
    console.log('');
    // Show first 50 lines
    const preview = code.split('\n').slice(0, 50).join('\n');
    console.log(preview);
    if (code.split('\n').length > 50) {
      console.log(`... (${code.split('\n').length - 50} more lines)`);
    }
    console.log('');
    console.log(`Would write to: ${CONFIG.outputPath}`);
  } else {
    writeOutputFile(CONFIG.outputPath, code);
    console.log(`Written to: ${CONFIG.outputPath}`);
  }

  console.log('');
  console.log('Done!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
