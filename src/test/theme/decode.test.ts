import * as assert from 'assert';
import { createThemeLookup, type CompactThemeData } from '../../theme/decode';

suite('createThemeLookup', () => {
  const sampleData: CompactThemeData = {
    'Dark Theme': [0, '1E1E1E', 'D4D4D4', '323233', 'CCCCCC'],
    'Light Theme': [1, 'FFFFFF', '000000'],
    'HC Dark': [2, '000', 'FFF'],
    'HC Light': [3, 'FFF', '000'],
  };

  test('decodes dark theme type (index 0)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['Dark Theme']?.type, 'dark');
  });

  test('decodes light theme type (index 1)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['Light Theme']?.type, 'light');
  });

  test('decodes hcDark theme type (index 2)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['HC Dark']?.type, 'hcDark');
  });

  test('decodes hcLight theme type (index 3)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['HC Light']?.type, 'hcLight');
  });

  test('expands 3-char hex to 6-char with # prefix', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['HC Dark']!.colors;
    assert.strictEqual(colors['editor.background'], '#000000');
  });

  test('passes through 6-char hex with # prefix', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['Dark Theme']!.colors;
    assert.strictEqual(colors['editor.background'], '#1E1E1E');
  });

  test('maps optional color keys in order', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['Dark Theme']!.colors;
    // Index 1 = editor.foreground
    assert.strictEqual(colors['editor.foreground'], '#D4D4D4');
    // Index 2 = titleBar.activeBackground
    assert.strictEqual(colors['titleBar.activeBackground'], '#323233');
    // Index 3 = titleBar.activeForeground
    assert.strictEqual(colors['titleBar.activeForeground'], '#CCCCCC');
  });

  test('omits undefined optional colors', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['Light Theme']!.colors;
    // Only editor.background and editor.foreground provided
    assert.strictEqual(colors['titleBar.activeBackground'], undefined);
    assert.strictEqual(colors['statusBar.background'], undefined);
  });

  test('returns undefined for missing theme', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['Nonexistent'], undefined);
  });

  test('caches decoded results (same reference)', () => {
    const lookup = createThemeLookup(sampleData);
    const first = lookup['Dark Theme'];
    const second = lookup['Dark Theme'];
    assert.strictEqual(first, second);
  });

  test('supports "in" operator (has trap)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.ok('Dark Theme' in lookup);
    assert.ok('Light Theme' in lookup);
    assert.ok(!('Nonexistent' in lookup));
  });

  test('supports Object.keys (ownKeys trap)', () => {
    const lookup = createThemeLookup(sampleData);
    const keys = Object.keys(lookup);
    assert.deepStrictEqual(keys.sort(), [
      'Dark Theme',
      'HC Dark',
      'HC Light',
      'Light Theme',
    ]);
  });

  test('handles sparse color entries', () => {
    const sparse: CompactThemeData = {
      Sparse: [
        0,
        '1E1E1E',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '21252B',
      ],
    };
    const lookup = createThemeLookup(sparse);
    const colors = lookup['Sparse']!.colors;
    assert.strictEqual(colors['editor.background'], '#1E1E1E');
    assert.strictEqual(colors['editor.foreground'], undefined);
    assert.strictEqual(colors['titleBar.activeBackground'], undefined);
    // Index 6 = statusBar.background
    assert.strictEqual(colors['statusBar.background'], '#21252B');
  });

  test('handles empty compact data', () => {
    const lookup = createThemeLookup({});
    assert.deepStrictEqual(Object.keys(lookup), []);
    assert.strictEqual(lookup['anything'], undefined);
  });

  test('editor.background is always present', () => {
    const lookup = createThemeLookup(sampleData);
    for (const name of Object.keys(sampleData)) {
      const info = lookup[name]!;
      assert.ok(
        info.colors['editor.background'],
        `${name}: editor.background should always be defined`
      );
    }
  });
});
