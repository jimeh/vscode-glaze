import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { needsUpdate, hasThemesInMetadata, toExtensionData } from '../scanner';
import type { ExtensionMetadata } from '../types';

function makeMetadata(
  overrides: Partial<ExtensionMetadata> = {}
): ExtensionMetadata {
  return {
    extensionId: 'pub.ext',
    extensionName: 'ext',
    publisherName: 'pub',
    displayName: 'Test Extension',
    version: '1.0.0',
    extractedAt: '2024-01-01T00:00:00.000Z',
    installCount: 1000,
    themes: [],
    ...overrides,
  };
}

describe('needsUpdate', () => {
  it('returns true when existing is undefined', () => {
    assert.equal(needsUpdate(undefined, '1.0.0'), true);
  });

  it('returns false when versions match', () => {
    const meta = makeMetadata({ version: '1.0.0' });
    assert.equal(needsUpdate(meta, '1.0.0'), false);
  });

  it('returns true when versions differ', () => {
    const meta = makeMetadata({ version: '1.0.0' });
    assert.equal(needsUpdate(meta, '2.0.0'), true);
  });
});

describe('hasThemesInMetadata', () => {
  it('returns true when themes array has entries', () => {
    const meta = makeMetadata({
      themes: [
        {
          name: 'Dark+',
          label: 'Dark+',
          colors: { 'editor.background': '#1E1E1E' },
          type: 'dark',
        },
      ],
    });
    assert.equal(hasThemesInMetadata(meta), true);
  });

  it('returns false when themes array is empty', () => {
    const meta = makeMetadata({ themes: [] });
    assert.equal(hasThemesInMetadata(meta), false);
  });

  it('returns false when themes is not an array', () => {
    const meta = makeMetadata();
    // Force themes to be undefined to test guard
    (meta as unknown as Record<string, unknown>).themes = undefined;
    assert.equal(hasThemesInMetadata(meta), false);
  });
});

describe('toExtensionData', () => {
  it('copies all fields correctly', () => {
    const meta = makeMetadata({
      extensionId: 'test.theme',
      extensionName: 'theme',
      publisherName: 'test',
      displayName: 'Test Theme',
      version: '2.0.0',
      extractedAt: '2024-06-01T00:00:00.000Z',
      installCount: 5000,
      themes: [
        {
          name: 'Dark',
          label: 'Dark',
          colors: { 'editor.background': '#000000' },
          type: 'dark',
        },
      ],
      source: 'marketplace',
    });
    const data = toExtensionData(meta);
    assert.equal(data.extensionId, 'test.theme');
    assert.equal(data.extensionName, 'theme');
    assert.equal(data.publisherName, 'test');
    assert.equal(data.displayName, 'Test Theme');
    assert.equal(data.version, '2.0.0');
    assert.equal(data.extractedAt, '2024-06-01T00:00:00.000Z');
    assert.equal(data.installCount, 5000);
    assert.equal(data.themes.length, 1);
    assert.equal(data.source, 'marketplace');
  });

  it('handles undefined source', () => {
    const meta = makeMetadata();
    const data = toExtensionData(meta);
    assert.equal(data.source, undefined);
  });

  it('handles null displayName', () => {
    const meta = makeMetadata({ displayName: null });
    const data = toExtensionData(meta);
    assert.equal(data.displayName, null);
  });
});
