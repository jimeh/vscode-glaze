import * as assert from 'assert';
import { generatePalette } from '../../color';
import type { TintTarget } from '../../config';
import type { ThemeType, ThemeContext } from '../../theme';
import type { ThemeColors } from '../../theme/colors';

const ALL_TARGETS: TintTarget[] = ['titleBar', 'statusBar', 'activityBar'];

/**
 * Helper to create a ThemeContext for testing.
 */
function makeThemeContext(
  type: ThemeType,
  options?: { colors?: ThemeColors }
): ThemeContext {
  return {
    type,
    isAutoDetected: true,
    colors: options?.colors,
  };
}

suite('generatePalette', () => {
  test('returns all color keys when all targets specified', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    assert.ok('titleBar.activeBackground' in palette);
    assert.ok('titleBar.activeForeground' in palette);
    assert.ok('titleBar.inactiveBackground' in palette);
    assert.ok('titleBar.inactiveForeground' in palette);
    assert.ok('statusBar.background' in palette);
    assert.ok('statusBar.foreground' in palette);
    assert.ok('activityBar.background' in palette);
    assert.ok('activityBar.foreground' in palette);
  });

  test('returns only titleBar keys when titleBar target specified', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ['titleBar'],
      themeContext: makeThemeContext('dark'),
    });
    assert.ok('titleBar.activeBackground' in palette);
    assert.ok('titleBar.activeForeground' in palette);
    assert.ok('titleBar.inactiveBackground' in palette);
    assert.ok('titleBar.inactiveForeground' in palette);
    assert.ok(!('statusBar.background' in palette));
    assert.ok(!('activityBar.background' in palette));
  });

  test('returns only statusBar keys when statusBar target specified', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ['statusBar'],
      themeContext: makeThemeContext('dark'),
    });
    assert.ok('statusBar.background' in palette);
    assert.ok('statusBar.foreground' in palette);
    assert.ok(!('titleBar.activeBackground' in palette));
    assert.ok(!('activityBar.background' in palette));
  });

  test('returns only activityBar keys when activityBar target specified', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ['activityBar'],
      themeContext: makeThemeContext('dark'),
    });
    assert.ok('activityBar.background' in palette);
    assert.ok('activityBar.foreground' in palette);
    assert.ok(!('titleBar.activeBackground' in palette));
    assert.ok(!('statusBar.background' in palette));
  });

  test('returns valid hex colors', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const [key, color] of Object.entries(palette)) {
      assert.match(color, hexPattern, `Invalid hex for ${key}: ${color}`);
    }
  });

  test('same workspace produces same colors', () => {
    const p1 = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const p2 = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    assert.deepStrictEqual(p1, p2);
  });

  test('different workspaces produce different colors', () => {
    const p1 = generatePalette({
      workspaceIdentifier: 'project-a',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const p2 = generatePalette({
      workspaceIdentifier: 'project-b',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    assert.notDeepStrictEqual(p1, p2);
  });

  test('produces visually distinct palettes', () => {
    const projects = ['frontend', 'backend', 'api', 'docs', 'tools'];
    const palettes = projects.map((p) =>
      generatePalette({
        workspaceIdentifier: p,
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
      })
    );

    const titleBarColors = palettes.map((p) => p['titleBar.activeBackground']);
    const uniqueColors = new Set(titleBarColors);
    assert.strictEqual(uniqueColors.size, projects.length);
  });

  test('returns correct number of keys per target', () => {
    const titleBarOnly = generatePalette({
      workspaceIdentifier: 'test',
      targets: ['titleBar'],
      themeContext: makeThemeContext('dark'),
    });
    assert.strictEqual(Object.keys(titleBarOnly).length, 4);

    const statusBarOnly = generatePalette({
      workspaceIdentifier: 'test',
      targets: ['statusBar'],
      themeContext: makeThemeContext('dark'),
    });
    assert.strictEqual(Object.keys(statusBarOnly).length, 2);

    const activityBarOnly = generatePalette({
      workspaceIdentifier: 'test',
      targets: ['activityBar'],
      themeContext: makeThemeContext('dark'),
    });
    assert.strictEqual(Object.keys(activityBarOnly).length, 2);

    const allTargets = generatePalette({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    assert.strictEqual(Object.keys(allTargets).length, 8);
  });

  test('returns empty object when no targets specified', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'test',
      targets: [],
      themeContext: makeThemeContext('dark'),
    });
    assert.strictEqual(Object.keys(palette).length, 0);
  });

  test('handles empty string identifier', () => {
    const palette = generatePalette({
      workspaceIdentifier: '',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const color of Object.values(palette)) {
      assert.match(color, hexPattern);
    }
  });

  test('handles unicode identifiers', () => {
    const palette = generatePalette({
      workspaceIdentifier: '项目',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const color of Object.values(palette)) {
      assert.match(color, hexPattern);
    }
  });
});

suite('generatePalette theme support', () => {
  const THEME_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

  test('generates valid colors for all theme types', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const themeType of THEME_TYPES) {
      const palette = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeType),
      });
      for (const [key, color] of Object.entries(palette)) {
        assert.match(
          color,
          hexPattern,
          `Invalid hex for ${key} in ${themeType}: ${color}`
        );
      }
    }
  });

  test('different theme types produce different colors', () => {
    const darkPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const lightPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('light'),
    });

    assert.notStrictEqual(
      darkPalette['titleBar.activeBackground'],
      lightPalette['titleBar.activeBackground'],
      'Dark and light themes should produce different background colors'
    );
  });

  test('light theme has lighter backgrounds than dark theme', () => {
    const darkPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const lightPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('light'),
    });

    const darkBg = darkPalette['titleBar.activeBackground']!;
    const lightBg = lightPalette['titleBar.activeBackground']!;

    const darkLum = hexToLuminance(darkBg);
    const lightLum = hexToLuminance(lightBg);

    assert.ok(
      lightLum > darkLum,
      `Light theme background (${lightBg}, lum=${lightLum}) should be ` +
        `lighter than dark (${darkBg}, lum=${darkLum})`
    );
  });

  test('high contrast themes have more extreme values', () => {
    const darkPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const hcPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('hcDark'),
    });

    const darkBgLum = hexToLuminance(darkPalette['titleBar.activeBackground']!);
    const hcBgLum = hexToLuminance(hcPalette['titleBar.activeBackground']!);

    assert.ok(
      hcBgLum < darkBgLum,
      `High contrast background should be darker than regular dark theme`
    );
  });

  test('same workspace + theme produces consistent colors', () => {
    for (const themeType of THEME_TYPES) {
      const p1 = generatePalette({
        workspaceIdentifier: 'consistent-test',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeType),
      });
      const p2 = generatePalette({
        workspaceIdentifier: 'consistent-test',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeType),
      });
      assert.deepStrictEqual(
        p1,
        p2,
        `Palette should be consistent for theme: ${themeType}`
      );
    }
  });
});

suite('generatePalette theme blending', () => {
  test('blends colors when theme colors are provided', () => {
    // Without blending
    const paletteNoBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      themeBlendFactor: 0,
    });

    // With blending (One Dark Pro colors)
    const paletteBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': '#282C34' },
      }),
      themeBlendFactor: 0.35,
    });

    // Colors should differ when blending is applied
    assert.notStrictEqual(
      paletteNoBlend['titleBar.activeBackground'],
      paletteBlend['titleBar.activeBackground'],
      'Blended colors should differ from non-blended'
    );
  });

  test('no blending when factor is 0', () => {
    const paletteNoColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    const paletteZeroFactor = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': '#282C34' },
      }),
      themeBlendFactor: 0,
    });

    // With factor 0, should produce same results
    assert.deepStrictEqual(
      paletteNoColors,
      paletteZeroFactor,
      'Zero blend factor should produce same results as no colors'
    );
  });

  test('higher blend factor produces colors closer to theme', () => {
    const themeBg = '#1F1F1F'; // Dark theme background
    const themeBgLum = hexToLuminance(themeBg);

    const paletteLowBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': themeBg },
      }),
      themeBlendFactor: 0.2,
    });

    const paletteHighBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': themeBg },
      }),
      themeBlendFactor: 0.8,
    });

    const lowBlendLum = hexToLuminance(
      paletteLowBlend['titleBar.activeBackground']!
    );
    const highBlendLum = hexToLuminance(
      paletteHighBlend['titleBar.activeBackground']!
    );

    // Higher blend should be closer to theme background luminance
    const lowBlendDiff = Math.abs(lowBlendLum - themeBgLum);
    const highBlendDiff = Math.abs(highBlendLum - themeBgLum);

    assert.ok(
      highBlendDiff < lowBlendDiff,
      'Higher blend factor should produce colors closer to theme'
    );
  });

  test('blending works with light themes', () => {
    const paletteNoBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('light'),
    });

    const paletteBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('light', {
        colors: { 'editor.background': '#FFFFFF' },
      }),
      themeBlendFactor: 0.35,
    });

    assert.notStrictEqual(
      paletteNoBlend['titleBar.activeBackground'],
      paletteBlend['titleBar.activeBackground'],
      'Light theme blending should produce different colors'
    );
  });

  test('foreground colors are not blended with theme background', () => {
    // Generate palette without theme colors
    const paletteNoColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    // Generate palette with theme colors and blending
    const paletteWithColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': '#282C34' },
      }),
      themeBlendFactor: 0.5,
    });

    // Foreground colors should remain unchanged regardless of colors
    assert.strictEqual(
      paletteNoColors['titleBar.activeForeground'],
      paletteWithColors['titleBar.activeForeground'],
      'titleBar.activeForeground should not be blended'
    );
    assert.strictEqual(
      paletteNoColors['titleBar.inactiveForeground'],
      paletteWithColors['titleBar.inactiveForeground'],
      'titleBar.inactiveForeground should not be blended'
    );
    assert.strictEqual(
      paletteNoColors['statusBar.foreground'],
      paletteWithColors['statusBar.foreground'],
      'statusBar.foreground should not be blended'
    );
    assert.strictEqual(
      paletteNoColors['activityBar.foreground'],
      paletteWithColors['activityBar.foreground'],
      'activityBar.foreground should not be blended'
    );

    // Background colors should be blended (different from no-colors)
    assert.notStrictEqual(
      paletteNoColors['titleBar.activeBackground'],
      paletteWithColors['titleBar.activeBackground'],
      'titleBar.activeBackground should be blended'
    );
  });
});

/**
 * Simple luminance calculation from hex color.
 */
function hexToLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
