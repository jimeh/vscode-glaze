import * as assert from 'assert';
import { generatePalette } from '../../color/palette';

suite('generatePalette', () => {
  test('returns all required color keys', () => {
    const palette = generatePalette('my-project');
    assert.ok('titleBar.activeBackground' in palette);
    assert.ok('titleBar.inactiveBackground' in palette);
    assert.ok('statusBar.background' in palette);
    assert.ok('activityBar.background' in palette);
  });

  test('returns valid hex colors', () => {
    const palette = generatePalette('my-project');
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const [key, color] of Object.entries(palette)) {
      assert.match(color, hexPattern, `Invalid hex for ${key}: ${color}`);
    }
  });

  test('same workspace produces same colors', () => {
    const p1 = generatePalette('my-project');
    const p2 = generatePalette('my-project');
    assert.deepStrictEqual(p1, p2);
  });

  test('different workspaces produce different colors', () => {
    const p1 = generatePalette('project-a');
    const p2 = generatePalette('project-b');
    assert.notDeepStrictEqual(p1, p2);
  });

  test('produces visually distinct palettes', () => {
    // Generate palettes for several projects and check they differ
    const projects = ['frontend', 'backend', 'api', 'docs', 'tools'];
    const palettes = projects.map((p) => generatePalette(p));

    // All titleBar.activeBackground colors should be unique
    const titleBarColors = palettes.map((p) => p['titleBar.activeBackground']);
    const uniqueColors = new Set(titleBarColors);
    assert.strictEqual(uniqueColors.size, projects.length);
  });

  test('returns exactly 4 color keys', () => {
    const palette = generatePalette('test-project');
    const keys = Object.keys(palette);
    assert.strictEqual(keys.length, 4);
  });

  test('handles empty string identifier', () => {
    const palette = generatePalette('');
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const color of Object.values(palette)) {
      assert.match(color, hexPattern);
    }
  });

  test('handles unicode identifiers', () => {
    const palette = generatePalette('项目');
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const color of Object.values(palette)) {
      assert.match(color, hexPattern);
    }
  });
});
