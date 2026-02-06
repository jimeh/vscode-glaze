import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { mergeRegistryExtensions } from '../registry-merge';
import type { MarketplaceExtension } from '../types';

function makeExt(
  overrides: Partial<MarketplaceExtension> = {}
): MarketplaceExtension {
  return {
    extensionId: 'id-1',
    extensionName: 'my-theme',
    displayName: 'My Theme',
    publisherName: 'publisher',
    version: '1.0.0',
    installCount: 1000,
    themes: [],
    ...overrides,
  };
}

describe('mergeRegistryExtensions', () => {
  it('includes marketplace-only extensions', () => {
    const mp = [makeExt({ source: 'marketplace' })];
    const { merged, stats } = mergeRegistryExtensions(mp, []);
    assert.equal(merged.length, 1);
    assert.equal(stats.marketplaceOnly, 1);
    assert.equal(stats.openvsxOnly, 0);
    assert.equal(stats.both, 0);
  });

  it('includes openvsx-only extensions', () => {
    const ovsx = [makeExt({ source: 'openvsx' })];
    const { merged, stats } = mergeRegistryExtensions([], ovsx);
    assert.equal(merged.length, 1);
    assert.equal(stats.openvsxOnly, 1);
    assert.equal(stats.marketplaceOnly, 0);
    assert.equal(stats.both, 0);
  });

  it('prefers marketplace when versions are equal', () => {
    const mp = [
      makeExt({
        version: '1.0.0',
        source: 'marketplace',
        vsixUrl: 'https://marketplace/vsix',
      }),
    ];
    const ovsx = [
      makeExt({
        version: '1.0.0',
        source: 'openvsx',
        vsixUrl: 'https://openvsx/vsix',
      }),
    ];
    const { merged, stats } = mergeRegistryExtensions(mp, ovsx);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].source, 'marketplace');
    assert.equal(stats.both, 1);
    assert.equal(stats.usedMarketplace, 1);
    assert.equal(stats.usedOpenvsx, 0);
  });

  it('uses openvsx when it has newer version', () => {
    const mp = [
      makeExt({
        version: '1.0.0',
        source: 'marketplace',
      }),
    ];
    const ovsx = [
      makeExt({
        version: '2.0.0',
        source: 'openvsx',
      }),
    ];
    const { merged, stats } = mergeRegistryExtensions(mp, ovsx);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].version, '2.0.0');
    assert.equal(stats.usedOpenvsx, 1);
    assert.equal(stats.usedMarketplace, 0);
  });

  it('uses marketplace when it has newer version', () => {
    const mp = [
      makeExt({
        version: '3.0.0',
        source: 'marketplace',
      }),
    ];
    const ovsx = [
      makeExt({
        version: '2.0.0',
        source: 'openvsx',
      }),
    ];
    const { merged, stats } = mergeRegistryExtensions(mp, ovsx);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].version, '3.0.0');
    assert.equal(stats.usedMarketplace, 1);
  });

  it('matches extension IDs case-insensitively', () => {
    const mp = [
      makeExt({
        publisherName: 'Publisher',
        extensionName: 'Theme',
        version: '1.0.0',
        source: 'marketplace',
      }),
    ];
    const ovsx = [
      makeExt({
        publisherName: 'publisher',
        extensionName: 'theme',
        version: '1.0.0',
        source: 'openvsx',
      }),
    ];
    const { merged, stats } = mergeRegistryExtensions(mp, ovsx);
    assert.equal(merged.length, 1);
    assert.equal(stats.both, 1);
  });

  it('tracks accurate stats across multiple extensions', () => {
    const mp = [
      makeExt({
        publisherName: 'a',
        extensionName: 'mp-only',
        source: 'marketplace',
      }),
      makeExt({
        publisherName: 'b',
        extensionName: 'shared',
        version: '1.0.0',
        source: 'marketplace',
      }),
    ];
    const ovsx = [
      makeExt({
        publisherName: 'c',
        extensionName: 'ovsx-only',
        source: 'openvsx',
      }),
      makeExt({
        publisherName: 'b',
        extensionName: 'shared',
        version: '1.0.0',
        source: 'openvsx',
      }),
    ];
    const { merged, stats } = mergeRegistryExtensions(mp, ovsx);
    assert.equal(merged.length, 3);
    assert.equal(stats.marketplaceOnly, 1);
    assert.equal(stats.openvsxOnly, 1);
    assert.equal(stats.both, 1);
  });

  it('handles non-semver versions via coerce', () => {
    const mp = [
      makeExt({
        version: '2024.1',
        source: 'marketplace',
      }),
    ];
    const ovsx = [
      makeExt({
        version: '2024.2',
        source: 'openvsx',
      }),
    ];
    const { merged } = mergeRegistryExtensions(mp, ovsx);
    assert.equal(merged.length, 1);
    // 2024.2 > 2024.1 so openvsx should win
    assert.equal(merged[0].version, '2024.2');
  });

  it('returns empty merged list for empty inputs', () => {
    const { merged, stats } = mergeRegistryExtensions([], []);
    assert.equal(merged.length, 0);
    assert.equal(stats.marketplaceOnly, 0);
    assert.equal(stats.openvsxOnly, 0);
    assert.equal(stats.both, 0);
  });
});
