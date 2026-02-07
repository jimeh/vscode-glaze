import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  generateExtensionColorsCode,
  generateBuiltinColorsCode,
  generateReport,
  toMetadataThemes,
  type ExtensionFileInfo,
} from '../output';
import type { ExtractedTheme, MetadataTheme, ThemeColors } from '../types';

function makeTheme(overrides: Partial<ExtractedTheme> = {}): ExtractedTheme {
  return {
    name: 'Test Theme',
    label: 'Test Theme',
    colors: { 'editor.background': '#1E1E1E' },
    type: 'dark',
    extensionId: 'pub.ext',
    publisherName: 'pub',
    extensionName: 'ext',
    installCount: 1000,
    ...overrides,
  };
}

function makeExtInfo(
  overrides: Partial<ExtensionFileInfo> & {
    themes: ExtractedTheme[];
  }
): ExtensionFileInfo {
  return {
    publisherName: 'pub',
    extensionName: 'ext',
    installCount: 1000,
    ...overrides,
  };
}

const FIXED_TS = '2024-01-01T00:00:00.000Z';

describe('generateExtensionColorsCode', () => {
  it('produces valid TypeScript with correct imports', () => {
    const code = generateExtensionColorsCode(
      [makeExtInfo({ themes: [makeTheme()] })],
      FIXED_TS
    );
    assert.ok(code.includes('import { createThemeLookup'));
    assert.ok(code.includes("from '../decode'"));
    assert.ok(code.includes('EXTENSION_THEME_COLORS'));
    assert.ok(code.includes(FIXED_TS));
  });

  it('uses type index 0 for dark themes', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [makeTheme({ type: 'dark' })],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('[0,'));
  });

  it('uses type index 1 for light themes', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [makeTheme({ type: 'light' })],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('[1,'));
  });

  it('uses type index 2 for hcDark themes', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [makeTheme({ type: 'hcDark' })],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('[2,'));
  });

  it('uses type index 3 for hcLight themes', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [makeTheme({ type: 'hcLight' })],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('[3,'));
  });

  it('compresses hex AABBCC to ABC', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [
            makeTheme({
              colors: {
                'editor.background': '#AABBCC',
              },
            }),
          ],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('"ABC"'));
    assert.ok(!code.includes('"AABBCC"'));
  });

  it('keeps non-compressible hex as-is', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [
            makeTheme({
              colors: {
                'editor.background': '#1E1E1E',
              },
            }),
          ],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('"1E1E1E"'));
  });

  it('produces sparse arrays for missing colors', () => {
    const colors: ThemeColors = {
      'editor.background': '#1E1E1E',
      'statusBar.background': '#007ACC',
    };
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [makeTheme({ colors })],
        }),
      ],
      FIXED_TS
    );
    // statusBar.background is at index 6, so indices
    // 1-5 should be empty (sparse commas)
    assert.ok(code.includes(',,,'));
  });

  it('sorts themes alphabetically (case-insensitive)', () => {
    const themes = [
      makeTheme({ name: 'Zebra' }),
      makeTheme({ name: 'alpha' }),
      makeTheme({ name: 'Beta' }),
    ];
    const code = generateExtensionColorsCode(
      [makeExtInfo({ themes })],
      FIXED_TS
    );
    const alphaIdx = code.indexOf('"alpha"');
    const betaIdx = code.indexOf('"Beta"');
    const zebraIdx = code.indexOf('"Zebra"');
    assert.ok(alphaIdx < betaIdx);
    assert.ok(betaIdx < zebraIdx);
  });

  it('escapes theme names with special characters', () => {
    const code = generateExtensionColorsCode(
      [
        makeExtInfo({
          themes: [makeTheme({ name: 'Theme "Quoted"' })],
        }),
      ],
      FIXED_TS
    );
    assert.ok(code.includes('"Theme \\"Quoted\\""'));
  });

  it('resolves conflicts by higher install count', () => {
    const ext1: ExtensionFileInfo = {
      publisherName: 'pub1',
      extensionName: 'ext1',
      installCount: 5000,
      themes: [
        makeTheme({
          name: 'Conflict',
          publisherName: 'pub1',
          extensionName: 'ext1',
          installCount: 5000,
          colors: { 'editor.background': '#1A2B3C' },
        }),
      ],
    };
    const ext2: ExtensionFileInfo = {
      publisherName: 'pub2',
      extensionName: 'ext2',
      installCount: 100,
      themes: [
        makeTheme({
          name: 'Conflict',
          publisherName: 'pub2',
          extensionName: 'ext2',
          installCount: 100,
          colors: { 'editor.background': '#4D5E6F' },
        }),
      ],
    };
    const code = generateExtensionColorsCode([ext1, ext2], FIXED_TS);
    // Higher install count (ext1) should win
    assert.ok(code.includes('"1A2B3C"'));
    assert.ok(!code.includes('"4D5E6F"'));
  });

  it('keeps both themes when names differ', () => {
    const ext1: ExtensionFileInfo = {
      publisherName: 'pub1',
      extensionName: 'ext1',
      installCount: 1000,
      themes: [makeTheme({ name: 'Theme A' })],
    };
    const ext2: ExtensionFileInfo = {
      publisherName: 'pub2',
      extensionName: 'ext2',
      installCount: 1000,
      themes: [makeTheme({ name: 'Theme B' })],
    };
    const code = generateExtensionColorsCode([ext1, ext2], FIXED_TS);
    assert.ok(code.includes('"Theme A"'));
    assert.ok(code.includes('"Theme B"'));
  });
});

describe('generateBuiltinColorsCode', () => {
  it('uses BUILTIN_THEME_COLORS constant', () => {
    const theme: MetadataTheme = {
      name: 'Dark+',
      label: 'Dark+',
      colors: { 'editor.background': '#1E1E1E' },
      type: 'dark',
    };
    const code = generateBuiltinColorsCode([theme], FIXED_TS);
    assert.ok(code.includes('BUILTIN_THEME_COLORS'));
    assert.ok(!code.includes('EXTENSION_THEME_COLORS'));
  });

  it('includes decode import', () => {
    const theme: MetadataTheme = {
      name: 'Test',
      label: 'Test',
      colors: { 'editor.background': '#1E1E1E' },
      type: 'dark',
    };
    const code = generateBuiltinColorsCode([theme], FIXED_TS);
    assert.ok(code.includes('import { createThemeLookup'));
  });
});

describe('generateReport', () => {
  it('counts dark and light themes', () => {
    const themes = [
      makeTheme({ type: 'dark' }),
      makeTheme({ type: 'dark', name: 'D2' }),
      makeTheme({ type: 'light', name: 'L1' }),
      makeTheme({ type: 'hcDark', name: 'HC1' }),
      makeTheme({ type: 'hcLight', name: 'HC2' }),
    ];
    const report = generateReport(themes);
    assert.ok(report.includes('Total themes extracted: 5'));
    // dark + hcDark = 3
    assert.ok(report.includes('Dark themes: 3'));
    // light + hcLight = 2
    assert.ok(report.includes('Light themes: 2'));
  });

  it('lists themes with element colors', () => {
    const themes = [
      makeTheme({
        name: 'Rich Theme',
        colors: {
          'editor.background': '#1E1E1E',
          'titleBar.activeBackground': '#3C3C3C',
          'statusBar.background': '#007ACC',
        },
      }),
    ];
    const report = generateReport(themes);
    assert.ok(report.includes('Rich Theme'));
    assert.ok(report.includes('titleBar'));
    assert.ok(report.includes('statusBar'));
  });

  it('shows empty message when no element colors', () => {
    const themes = [makeTheme()];
    const report = generateReport(themes);
    assert.ok(report.includes('No themes with per-element colors found'));
  });
});

describe('toMetadataThemes', () => {
  it('strips extension-specific fields', () => {
    const themes = [makeTheme()];
    const metadata = toMetadataThemes(themes);
    assert.equal(metadata.length, 1);
    assert.equal(metadata[0].name, 'Test Theme');
    assert.equal(metadata[0].label, 'Test Theme');
    assert.equal(metadata[0].type, 'dark');
    assert.deepEqual(metadata[0].colors, {
      'editor.background': '#1E1E1E',
    });
    // Should not have extension fields
    const keys = Object.keys(metadata[0]);
    assert.ok(!keys.includes('extensionId'));
    assert.ok(!keys.includes('publisherName'));
    assert.ok(!keys.includes('extensionName'));
    assert.ok(!keys.includes('installCount'));
  });
});
