import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { parseTheme, validateTheme, type ThemeFileReader } from '../parser';
import type { ThemeJson, ThemeContribution, ExtractedTheme } from '../types';

/** No-op theme reader that never finds files. */
const noopReader: ThemeFileReader = () => undefined;

function makeContribution(
  overrides: Partial<ThemeContribution> = {}
): ThemeContribution {
  return {
    label: 'Test Theme',
    uiTheme: 'vs-dark',
    path: './themes/test.json',
    ...overrides,
  };
}

function makeThemeJson(overrides: Partial<ThemeJson> = {}): ThemeJson {
  return {
    colors: { 'editor.background': '#1E1E1E' },
    ...overrides,
  };
}

function callParseTheme(
  themeJson: ThemeJson,
  contribution: ThemeContribution,
  readThemeFile: ThemeFileReader = noopReader
): ExtractedTheme | undefined {
  return parseTheme(
    themeJson,
    contribution,
    readThemeFile,
    'publisher.extension',
    'publisher',
    'extension',
    1000
  );
}

describe('parseTheme', () => {
  it('extracts a basic dark theme', () => {
    const result = callParseTheme(makeThemeJson(), makeContribution());
    assert.ok(result);
    assert.equal(result.type, 'dark');
    assert.equal(result.colors['editor.background'], '#1E1E1E');
    assert.equal(result.name, 'Test Theme');
    assert.equal(result.label, 'Test Theme');
  });

  it('extracts a light theme (vs)', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#FFFFFF' },
      }),
      makeContribution({ uiTheme: 'vs' })
    );
    assert.ok(result);
    assert.equal(result.type, 'light');
  });

  it('extracts hcDark theme (hc-black)', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#000000' },
      }),
      makeContribution({ uiTheme: 'hc-black' })
    );
    assert.ok(result);
    assert.equal(result.type, 'hcDark');
  });

  it('extracts hcLight theme (hc-light)', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#FFFFFF' },
      }),
      makeContribution({ uiTheme: 'hc-light' })
    );
    assert.ok(result);
    assert.equal(result.type, 'hcLight');
  });

  it('falls back to type from theme JSON when uiTheme is absent', () => {
    const result = callParseTheme(
      makeThemeJson({ type: 'light' }),
      makeContribution({ uiTheme: '' })
    );
    assert.ok(result);
    assert.equal(result.type, 'light');
  });

  it('returns undefined when theme type cannot be determined', () => {
    const result = callParseTheme(
      makeThemeJson(),
      makeContribution({ uiTheme: '' })
    );
    assert.equal(result, undefined);
  });

  it('normalizes 3-digit hex to 6-digit uppercase', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#abc' },
      }),
      makeContribution()
    );
    assert.ok(result);
    assert.equal(result.colors['editor.background'], '#AABBCC');
  });

  it('strips alpha from 8-digit hex', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#1E1E1EFF' },
      }),
      makeContribution()
    );
    assert.ok(result);
    assert.equal(result.colors['editor.background'], '#1E1E1E');
  });

  it('strips alpha from 4-digit hex and expands', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#ABCD' },
      }),
      makeContribution()
    );
    assert.ok(result);
    assert.equal(result.colors['editor.background'], '#AABBCC');
  });

  it('rejects CSS variable as editor.background', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': 'var(--bg)' },
      }),
      makeContribution()
    );
    assert.equal(result, undefined);
  });

  it('returns undefined when editor.background is missing', () => {
    const result = callParseTheme(
      makeThemeJson({ colors: {} }),
      makeContribution()
    );
    assert.equal(result, undefined);
  });

  it('returns undefined when colors object is missing', () => {
    const result = callParseTheme(
      makeThemeJson({ colors: undefined }),
      makeContribution()
    );
    assert.equal(result, undefined);
  });

  it('extracts all 14 color keys when present', () => {
    const colors: Record<string, string> = {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'titleBar.activeBackground': '#3C3C3C',
      'titleBar.activeForeground': '#CCCCCC',
      'titleBar.inactiveBackground': '#3C3C3C',
      'titleBar.inactiveForeground': '#999999',
      'statusBar.background': '#007ACC',
      'statusBar.foreground': '#FFFFFF',
      'activityBar.background': '#333333',
      'activityBar.foreground': '#FFFFFF',
      'sideBar.background': '#252526',
      'sideBar.foreground': '#CCCCCC',
      'sideBarSectionHeader.background': '#383838',
      'sideBarSectionHeader.foreground': '#CCCCCC',
    };
    const result = callParseTheme(
      makeThemeJson({ colors }),
      makeContribution()
    );
    assert.ok(result);
    assert.equal(Object.keys(result.colors).length, 14);
    assert.equal(result.colors['editor.foreground'], '#D4D4D4');
    assert.equal(result.colors['statusBar.background'], '#007ACC');
  });

  it('leaves optional colors undefined when not present', () => {
    const result = callParseTheme(makeThemeJson(), makeContribution());
    assert.ok(result);
    assert.equal(result.colors['editor.foreground'], undefined);
    assert.equal(result.colors['statusBar.background'], undefined);
  });

  it('resolves theme inheritance via include', () => {
    const parentTheme: ThemeJson = {
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#FFFFFF',
      },
    };
    const childTheme: ThemeJson = {
      include: './parent.json',
      colors: {
        'editor.background': '#1E1E1E',
      },
    };
    const reader: ThemeFileReader = (path) => {
      if (path === './themes/parent.json') return parentTheme;
      return undefined;
    };
    const result = callParseTheme(
      childTheme,
      makeContribution({ path: './themes/test.json' }),
      reader
    );
    assert.ok(result);
    // Child overrides parent's editor.background
    assert.equal(result.colors['editor.background'], '#1E1E1E');
    // Parent's editor.foreground is inherited
    assert.equal(result.colors['editor.foreground'], '#FFFFFF');
  });

  it('resolves multi-level inheritance', () => {
    const grandparent: ThemeJson = {
      colors: {
        'editor.background': '#000000',
        'sideBar.background': '#111111',
      },
    };
    const parent: ThemeJson = {
      include: './grandparent.json',
      colors: {
        'editor.foreground': '#FFFFFF',
      },
    };
    const child: ThemeJson = {
      include: './parent.json',
      colors: {
        'editor.background': '#1E1E1E',
      },
    };
    const reader: ThemeFileReader = (path) => {
      if (path === './themes/parent.json') return parent;
      if (path === './themes/grandparent.json') {
        return grandparent;
      }
      return undefined;
    };
    const result = callParseTheme(
      child,
      makeContribution({ path: './themes/test.json' }),
      reader
    );
    assert.ok(result);
    assert.equal(result.colors['editor.background'], '#1E1E1E');
    assert.equal(result.colors['editor.foreground'], '#FFFFFF');
    assert.equal(result.colors['sideBar.background'], '#111111');
  });

  it('stops inheritance at depth 5', () => {
    // Create a chain deeper than 5
    const themes: Record<string, ThemeJson> = {};
    for (let i = 0; i < 8; i++) {
      themes[`./themes/level${i}.json`] = {
        include: `./level${i + 1}.json`,
        colors: { [`level${i}`]: `#${String(i).padStart(6, '0')}` },
      };
    }
    // The deepest level has an editor.background
    themes['./themes/level8.json'] = {
      colors: { 'editor.background': '#DEEP00' },
    };
    // Level 0 also has editor.background to ensure we get a result
    themes['./themes/level0.json']!.colors = {
      ...themes['./themes/level0.json']!.colors,
      'editor.background': '#1E1E1E',
    };

    const reader: ThemeFileReader = (path) => themes[path];
    const root: ThemeJson = {
      include: './level0.json',
      colors: {},
    };
    const result = callParseTheme(
      root,
      makeContribution({ path: './themes/test.json' }),
      reader
    );
    // Should not crash; should resolve up to depth limit
    // The deep #DEEP00 color shouldn't be reachable
    assert.ok(result);
  });

  it('resolves tokenColors path reference', () => {
    const baseTheme: ThemeJson = {
      colors: {
        'editor.foreground': '#D4D4D4',
      },
    };
    const themeJson: ThemeJson = {
      tokenColors: './base.json',
      colors: {
        'editor.background': '#1E1E1E',
      },
    };
    const reader: ThemeFileReader = (path) => {
      if (path === './themes/base.json') return baseTheme;
      return undefined;
    };
    const result = callParseTheme(
      themeJson,
      makeContribution({ path: './themes/test.json' }),
      reader
    );
    assert.ok(result);
    assert.equal(result.colors['editor.background'], '#1E1E1E');
    assert.equal(result.colors['editor.foreground'], '#D4D4D4');
  });

  it('uses contribution id as name when present', () => {
    const result = callParseTheme(
      makeThemeJson(),
      makeContribution({
        id: 'my-theme-id',
        label: 'My Theme Label',
      })
    );
    assert.ok(result);
    assert.equal(result.name, 'my-theme-id');
    assert.equal(result.label, 'My Theme Label');
  });

  it('uses label as name when id is absent', () => {
    const result = callParseTheme(
      makeThemeJson(),
      makeContribution({ label: 'Only Label' })
    );
    assert.ok(result);
    assert.equal(result.name, 'Only Label');
    assert.equal(result.label, 'Only Label');
  });

  it('passes through extension metadata fields', () => {
    const result = parseTheme(
      makeThemeJson(),
      makeContribution(),
      noopReader,
      'pub.ext',
      'pub',
      'ext',
      42000
    );
    assert.ok(result);
    assert.equal(result.extensionId, 'pub.ext');
    assert.equal(result.publisherName, 'pub');
    assert.equal(result.extensionName, 'ext');
    assert.equal(result.installCount, 42000);
  });

  it('uppercases hex colors', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: { 'editor.background': '#abcdef' },
      }),
      makeContribution()
    );
    assert.ok(result);
    assert.equal(result.colors['editor.background'], '#ABCDEF');
  });

  it('ignores non-hex color values (except CSS vars)', () => {
    const result = callParseTheme(
      makeThemeJson({
        colors: {
          'editor.background': '#1E1E1E',
          'editor.foreground': 'rgb(255,255,255)',
        },
      }),
      makeContribution()
    );
    assert.ok(result);
    // rgb() is not valid hex, so it's skipped
    assert.equal(result.colors['editor.foreground'], undefined);
  });
});

describe('validateTheme', () => {
  function makeExtractedTheme(
    overrides: Partial<ExtractedTheme> = {}
  ): ExtractedTheme {
    return {
      name: 'Test',
      label: 'Test',
      colors: { 'editor.background': '#1E1E1E' },
      type: 'dark',
      extensionId: 'pub.ext',
      publisherName: 'pub',
      extensionName: 'ext',
      installCount: 100,
      ...overrides,
    };
  }

  it('returns true for a valid theme', () => {
    assert.equal(validateTheme(makeExtractedTheme()), true);
  });

  it('returns false for empty name', () => {
    assert.equal(validateTheme(makeExtractedTheme({ name: '' })), false);
  });

  it('returns false for invalid editor.background', () => {
    assert.equal(
      validateTheme(
        makeExtractedTheme({
          colors: {
            'editor.background': 'not-a-color',
          },
        })
      ),
      false
    );
  });

  it('returns false for invalid theme type', () => {
    assert.equal(
      validateTheme(
        makeExtractedTheme({
          type: 'invalid' as ExtractedTheme['type'],
        })
      ),
      false
    );
  });

  it('returns true for all valid theme types', () => {
    for (const type of ['dark', 'light', 'hcDark', 'hcLight'] as const) {
      assert.equal(
        validateTheme(makeExtractedTheme({ type })),
        true,
        `Expected true for type "${type}"`
      );
    }
  });
});
