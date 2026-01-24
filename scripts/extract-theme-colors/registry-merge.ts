/**
 * Registry merge logic for combining extensions from multiple sources.
 */
import * as semver from 'semver';
import type { MarketplaceExtension } from './types';

/**
 * Statistics from merging two registry sources.
 */
export interface MergeStats {
  /** Extensions only found on VS Code Marketplace */
  marketplaceOnly: number;
  /** Extensions only found on OpenVSX */
  openvsxOnly: number;
  /** Extensions found on both registries */
  both: number;
  /** When on both, how many used the Marketplace version */
  usedMarketplace: number;
  /** When on both, how many used the OpenVSX version */
  usedOpenvsx: number;
}

/**
 * Result of merging extensions from multiple registries.
 */
export interface MergeResult {
  /** Merged list of extensions (deduplicated) */
  merged: MarketplaceExtension[];
  /** Statistics about the merge */
  stats: MergeStats;
}

/**
 * Normalizes an extension ID to lowercase for consistent matching.
 */
function normalizeExtensionId(ext: MarketplaceExtension): string {
  return `${ext.publisherName}.${ext.extensionName}`.toLowerCase();
}

/**
 * Compares two version strings using semver.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 * Uses semver.coerce for non-standard version formats.
 */
function compareVersions(a: string, b: string): number {
  const semverA = semver.coerce(a);
  const semverB = semver.coerce(b);

  if (!semverA && !semverB) {
    // Both unparseable, compare as strings
    return a.localeCompare(b);
  }
  if (!semverA) return -1; // Prefer parseable version
  if (!semverB) return 1;

  return semver.compare(semverA, semverB);
}

/**
 * Merges extensions from VS Code Marketplace and OpenVSX.
 *
 * When the same extension exists in both registries:
 * - Uses the one with the newer version
 * - If versions are equal, prefers VS Code Marketplace
 *
 * @param marketplace Extensions from VS Code Marketplace
 * @param openvsx Extensions from OpenVSX
 * @returns Merged list with deduplication and merge statistics
 */
export function mergeRegistryExtensions(
  marketplace: MarketplaceExtension[],
  openvsx: MarketplaceExtension[]
): MergeResult {
  const stats: MergeStats = {
    marketplaceOnly: 0,
    openvsxOnly: 0,
    both: 0,
    usedMarketplace: 0,
    usedOpenvsx: 0,
  };

  // Build map from marketplace extensions
  const extensionMap = new Map<string, MarketplaceExtension>();
  for (const ext of marketplace) {
    const id = normalizeExtensionId(ext);
    extensionMap.set(id, ext);
  }

  // Merge in OpenVSX extensions
  for (const openvsxExt of openvsx) {
    const id = normalizeExtensionId(openvsxExt);
    const marketplaceExt = extensionMap.get(id);

    if (!marketplaceExt) {
      // Only on OpenVSX
      extensionMap.set(id, openvsxExt);
      stats.openvsxOnly++;
    } else {
      // On both - compare versions
      stats.both++;
      const versionCmp = compareVersions(
        openvsxExt.version,
        marketplaceExt.version
      );

      if (versionCmp > 0) {
        // OpenVSX has newer version
        extensionMap.set(id, openvsxExt);
        stats.usedOpenvsx++;
      } else {
        // Marketplace has newer or equal version
        stats.usedMarketplace++;
      }
    }
  }

  // Count marketplace-only (those not in OpenVSX)
  stats.marketplaceOnly = marketplace.length - stats.both;

  return {
    merged: Array.from(extensionMap.values()),
    stats,
  };
}
