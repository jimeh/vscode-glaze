import * as assert from 'assert';
import { generatePalette, calculateBaseTint } from '../../color';
import { hexToOklch } from '../../color/convert';
import type { ColorScheme, TintTarget } from '../../config';
import type { ThemeType, ThemeContext, ThemeColors } from '../../theme';

const ALL_TARGETS: TintTarget[] = ['titleBar', 'statusBar', 'activityBar'];

/**
 * Helper to create a ThemeContext for testing.
 */
function makeThemeContext(
  tintType: ThemeType,
  options?: { colors?: ThemeColors }
): ThemeContext {
  return {
    tintType,
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

  test('foreground colors are blended with theme foreground', () => {
    // Generate palette without theme colors
    const paletteNoColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    // Generate palette with theme foreground colors and blending
    const paletteWithColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: {
          'editor.background': '#282C34',
          'editor.foreground': '#ABB2BF',
        },
      }),
      themeBlendFactor: 0.5,
    });

    // Foreground colors should be blended when theme foreground is available
    assert.notStrictEqual(
      paletteNoColors['titleBar.activeForeground'],
      paletteWithColors['titleBar.activeForeground'],
      'titleBar.activeForeground should be blended'
    );
    assert.notStrictEqual(
      paletteNoColors['statusBar.foreground'],
      paletteWithColors['statusBar.foreground'],
      'statusBar.foreground should be blended'
    );
    assert.notStrictEqual(
      paletteNoColors['activityBar.foreground'],
      paletteWithColors['activityBar.foreground'],
      'activityBar.foreground should be blended'
    );

    // Background colors should also be blended
    assert.notStrictEqual(
      paletteNoColors['titleBar.activeBackground'],
      paletteWithColors['titleBar.activeBackground'],
      'titleBar.activeBackground should be blended'
    );
  });

  test('foreground not blended when theme has no foreground color', () => {
    // Generate palette without theme colors
    const paletteNoColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    // Generate palette with only background theme colors (no foreground)
    const paletteWithBgOnly = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': '#282C34' },
      }),
      themeBlendFactor: 0.5,
    });

    // Foreground colors should remain unchanged when no theme foreground
    assert.strictEqual(
      paletteNoColors['titleBar.activeForeground'],
      paletteWithBgOnly['titleBar.activeForeground'],
      'titleBar.activeForeground should not be blended without theme foreground'
    );
    assert.strictEqual(
      paletteNoColors['statusBar.foreground'],
      paletteWithBgOnly['statusBar.foreground'],
      'statusBar.foreground should not be blended without theme foreground'
    );

    // Background colors should still be blended
    assert.notStrictEqual(
      paletteNoColors['titleBar.activeBackground'],
      paletteWithBgOnly['titleBar.activeBackground'],
      'titleBar.activeBackground should be blended'
    );
  });

  test('at themeBlendFactor=1, colors match theme exactly', () => {
    const themeBg = '#1E1E1E';
    const themeFg = '#D4D4D4';

    const palette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: {
          'editor.background': themeBg,
          'editor.foreground': themeFg,
        },
      }),
      themeBlendFactor: 1.0,
    });

    // Background should match theme background exactly (case-insensitive)
    assert.strictEqual(
      palette['titleBar.activeBackground']!.toUpperCase(),
      themeBg.toUpperCase(),
      'At blend factor 1, background should match theme exactly'
    );
    assert.strictEqual(
      palette['statusBar.background']!.toUpperCase(),
      themeBg.toUpperCase(),
      'At blend factor 1, statusBar background should match theme exactly'
    );

    // Foreground should match theme foreground exactly (case-insensitive)
    assert.strictEqual(
      palette['titleBar.activeForeground']!.toUpperCase(),
      themeFg.toUpperCase(),
      'At blend factor 1, foreground should match theme exactly'
    );
    assert.strictEqual(
      palette['statusBar.foreground']!.toUpperCase(),
      themeFg.toUpperCase(),
      'At blend factor 1, statusBar foreground should match theme exactly'
    );
  });

  test('at themeBlendFactor=0, colors use generated values', () => {
    const themeBg = '#FF0000'; // Bright red - very different from generated
    const themeFg = '#00FF00'; // Bright green - very different from generated

    const paletteNoColors = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    const paletteZeroFactor = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: {
          'editor.background': themeBg,
          'editor.foreground': themeFg,
        },
      }),
      themeBlendFactor: 0,
    });

    // With factor 0, should produce same results as no colors
    assert.deepStrictEqual(
      paletteNoColors,
      paletteZeroFactor,
      'Zero blend factor should produce same results as no colors'
    );
  });
});

suite('generatePalette targetBlendFactors', () => {
  test('uses per-target blend factor when provided', () => {
    const themeColors = { 'editor.background': '#282C34' };

    // Default blend for all
    const paletteDefault = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { colors: themeColors }),
      themeBlendFactor: 0.35,
    });

    // Override statusBar blend to 0.8
    const paletteOverride = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { colors: themeColors }),
      themeBlendFactor: 0.35,
      targetBlendFactors: { statusBar: 0.8 },
    });

    // titleBar should be the same (no override)
    assert.strictEqual(
      paletteDefault['titleBar.activeBackground'],
      paletteOverride['titleBar.activeBackground'],
      'titleBar should use default blend factor'
    );

    // statusBar should differ (override)
    assert.notStrictEqual(
      paletteDefault['statusBar.background'],
      paletteOverride['statusBar.background'],
      'statusBar should use overridden blend factor'
    );
  });

  test('falls back to default when target not in overrides', () => {
    const themeColors = { 'editor.background': '#282C34' };

    const paletteDefault = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { colors: themeColors }),
      themeBlendFactor: 0.35,
    });

    const paletteWithUnrelatedOverride = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { colors: themeColors }),
      themeBlendFactor: 0.35,
      targetBlendFactors: { activityBar: 0.9 },
    });

    // titleBar has no override, should match default
    assert.strictEqual(
      paletteDefault['titleBar.activeBackground'],
      paletteWithUnrelatedOverride['titleBar.activeBackground'],
      'titleBar should fall back to default blend factor'
    );
    // statusBar has no override, should match default
    assert.strictEqual(
      paletteDefault['statusBar.background'],
      paletteWithUnrelatedOverride['statusBar.background'],
      'statusBar should fall back to default blend factor'
    );
    // activityBar has override, should differ
    assert.notStrictEqual(
      paletteDefault['activityBar.background'],
      paletteWithUnrelatedOverride['activityBar.background'],
      'activityBar should use overridden blend factor'
    );
  });

  test('empty targetBlendFactors acts as no override', () => {
    const themeColors = { 'editor.background': '#282C34' };

    const paletteDefault = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { colors: themeColors }),
      themeBlendFactor: 0.35,
    });

    const paletteEmpty = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { colors: themeColors }),
      themeBlendFactor: 0.35,
      targetBlendFactors: {},
    });

    assert.deepStrictEqual(
      paletteDefault,
      paletteEmpty,
      'Empty targetBlendFactors should be same as no override'
    );
  });

  test('no effect without theme colors', () => {
    const paletteDefault = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      themeBlendFactor: 0.35,
    });

    const paletteOverride = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      themeBlendFactor: 0.35,
      targetBlendFactors: { statusBar: 0.8 },
    });

    assert.deepStrictEqual(
      paletteDefault,
      paletteOverride,
      'Overrides should have no effect without theme colors'
    );
  });
});

suite('generatePalette seed', () => {
  test('different seeds produce different colors', () => {
    const palette1 = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 0,
    });
    const palette2 = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 42,
    });

    assert.notStrictEqual(
      palette1['titleBar.activeBackground'],
      palette2['titleBar.activeBackground'],
      'Different seeds should produce different colors'
    );
  });

  test('same seed produces consistent colors', () => {
    const palette1 = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 123,
    });
    const palette2 = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 123,
    });

    assert.deepStrictEqual(
      palette1,
      palette2,
      'Same seed should produce identical palettes'
    );
  });

  test('default seed is 0 when not specified', () => {
    const paletteDefault = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const paletteZeroSeed = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 0,
    });

    assert.deepStrictEqual(
      paletteDefault,
      paletteZeroSeed,
      'Default seed should be 0'
    );
  });

  test('seed works with all theme types', () => {
    const THEME_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const themeType of THEME_TYPES) {
      const palette = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeType),
        seed: 999,
      });
      for (const [key, color] of Object.entries(palette)) {
        assert.match(
          color,
          hexPattern,
          `Invalid hex for ${key} with seed in ${themeType}: ${color}`
        );
      }
    }
  });

  test('seed works with all color schemes', () => {
    const COLOR_SCHEMES: ColorScheme[] = [
      'pastel',
      'vibrant',
      'muted',
      'tinted',
      'duotone',
      'undercurrent',
      'analogous',
      'neon',
    ];
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const scheme of COLOR_SCHEMES) {
      const palette = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: scheme,
        seed: 456,
      });
      for (const [key, color] of Object.entries(palette)) {
        assert.match(
          color,
          hexPattern,
          `Invalid hex for ${key} with seed in ${scheme} scheme: ${color}`
        );
      }
    }
  });

  test('seed works with theme blending', () => {
    const paletteNoBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 100,
      themeBlendFactor: 0,
    });

    const paletteBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', {
        colors: { 'editor.background': '#282C34' },
      }),
      seed: 100,
      themeBlendFactor: 0.35,
    });

    assert.notStrictEqual(
      paletteNoBlend['titleBar.activeBackground'],
      paletteBlend['titleBar.activeBackground'],
      'Seed should work with theme blending'
    );
  });

  test('negative seed values work correctly', () => {
    const paletteNegative = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: -100,
    });
    const palettePositive = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 100,
    });

    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const color of Object.values(paletteNegative)) {
      assert.match(color, hexPattern, 'Negative seed should produce valid hex');
    }

    assert.notDeepStrictEqual(
      paletteNegative,
      palettePositive,
      'Negative and positive seeds should produce different colors'
    );
  });

  test('large seed values work correctly', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      seed: 999999999,
    });

    const hexPattern = /^#[0-9a-f]{6}$/i;
    for (const [key, color] of Object.entries(palette)) {
      assert.match(
        color,
        hexPattern,
        `Large seed should produce valid hex for ${key}`
      );
    }
  });
});

suite('generatePalette color schemes', () => {
  const COLOR_SCHEMES: ColorScheme[] = [
    'pastel',
    'vibrant',
    'muted',
    'tinted',
    'duotone',
    'undercurrent',
    'analogous',
    'neon',
  ];
  const THEME_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

  test('generates valid colors for all color schemes', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const scheme of COLOR_SCHEMES) {
      const palette = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: scheme,
      });
      for (const [key, color] of Object.entries(palette)) {
        assert.match(
          color,
          hexPattern,
          `Invalid hex for ${key} with ${scheme} scheme: ${color}`
        );
      }
    }
  });

  test('pastel and vibrant produce different colors', () => {
    const pastelPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'pastel',
    });
    const vibrantPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'vibrant',
    });

    assert.notStrictEqual(
      pastelPalette['titleBar.activeBackground'],
      vibrantPalette['titleBar.activeBackground'],
      'Pastel and vibrant should produce different background colors'
    );
  });

  test('vibrant scheme has higher chroma than pastel', () => {
    const pastelPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'pastel',
    });
    const vibrantPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'vibrant',
    });

    const pastelSat = hexToChroma(pastelPalette['titleBar.activeBackground']!);
    const vibrantSat = hexToChroma(
      vibrantPalette['titleBar.activeBackground']!
    );

    assert.ok(
      vibrantSat > pastelSat,
      `Vibrant chroma (${vibrantSat}) should be higher than pastel (${pastelSat})`
    );
  });

  test('default scheme is pastel when not specified', () => {
    const defaultPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });
    const pastelPalette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'pastel',
    });

    assert.deepStrictEqual(
      defaultPalette,
      pastelPalette,
      'Default scheme should be pastel'
    );
  });

  test('color schemes work with all theme types', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const scheme of COLOR_SCHEMES) {
      for (const themeType of THEME_TYPES) {
        const palette = generatePalette({
          workspaceIdentifier: 'test-project',
          targets: ALL_TARGETS,
          themeContext: makeThemeContext(themeType),
          colorScheme: scheme,
        });
        for (const [key, color] of Object.entries(palette)) {
          assert.match(
            color,
            hexPattern,
            `Invalid hex for ${key} with ${scheme} scheme in ${themeType}: ${color}`
          );
        }
      }
    }
  });

  test('same workspace + scheme produces consistent colors', () => {
    for (const scheme of COLOR_SCHEMES) {
      const p1 = generatePalette({
        workspaceIdentifier: 'consistent-test',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: scheme,
      });
      const p2 = generatePalette({
        workspaceIdentifier: 'consistent-test',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: scheme,
      });
      assert.deepStrictEqual(
        p1,
        p2,
        `Palette should be consistent for scheme: ${scheme}`
      );
    }
  });

  test('color schemes work with theme blending', () => {
    for (const scheme of COLOR_SCHEMES) {
      const paletteNoBlend = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: scheme,
        themeBlendFactor: 0,
      });

      const paletteBlend = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark', {
          colors: { 'editor.background': '#282C34' },
        }),
        colorScheme: scheme,
        themeBlendFactor: 0.35,
      });

      assert.notStrictEqual(
        paletteNoBlend['titleBar.activeBackground'],
        paletteBlend['titleBar.activeBackground'],
        `${scheme} scheme should support theme blending`
      );
    }
  });

  test('chroma ordering: neon > vibrant > pastel > muted > tinted', () => {
    const palettes = {
      neon: generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: 'neon',
      }),
      vibrant: generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: 'vibrant',
      }),
      pastel: generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: 'pastel',
      }),
      muted: generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: 'muted',
      }),
      tinted: generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext('dark'),
        colorScheme: 'tinted',
      }),
    };

    const neonSat = hexToChroma(palettes.neon['titleBar.activeBackground']!);
    const vibrantSat = hexToChroma(
      palettes.vibrant['titleBar.activeBackground']!
    );
    const pastelSat = hexToChroma(
      palettes.pastel['titleBar.activeBackground']!
    );
    const mutedSat = hexToChroma(palettes.muted['titleBar.activeBackground']!);
    const tintedSat = hexToChroma(
      palettes.tinted['titleBar.activeBackground']!
    );

    assert.ok(
      neonSat > vibrantSat,
      `neon (${neonSat}) should have higher chroma than ` +
        `vibrant (${vibrantSat})`
    );
    assert.ok(
      vibrantSat > pastelSat,
      `vibrant (${vibrantSat}) should have higher chroma than ` +
        `pastel (${pastelSat})`
    );
    assert.ok(
      pastelSat > mutedSat,
      `pastel (${pastelSat}) should have higher chroma than ` +
        `muted (${mutedSat})`
    );
    assert.ok(
      mutedSat > tintedSat,
      `muted (${mutedSat}) should have higher chroma than ` +
        `tinted (${tintedSat})`
    );
  });

  test('tinted produces very low chroma output', () => {
    const palette = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'tinted',
    });

    for (const [key, color] of Object.entries(palette)) {
      const chroma = hexToChroma(color);
      // Tinted has very low but non-zero chroma (0.05-0.15 chromaFactor)
      assert.ok(
        chroma < 0.03,
        `tinted ${key} should have very low chroma, got ${chroma}`
      );
    }
  });

  test('muted and tinted produce different colors from pastel', () => {
    const pastel = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'pastel',
    });
    const muted = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'muted',
    });
    const tinted = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      colorScheme: 'tinted',
    });

    assert.notStrictEqual(
      pastel['titleBar.activeBackground'],
      muted['titleBar.activeBackground'],
      'muted should differ from pastel'
    );
    assert.notStrictEqual(
      pastel['titleBar.activeBackground'],
      tinted['titleBar.activeBackground'],
      'tinted should differ from pastel'
    );
    assert.notStrictEqual(
      muted['titleBar.activeBackground'],
      tinted['titleBar.activeBackground'],
      'tinted should differ from muted'
    );
  });
});

suite('calculateBaseTint', () => {
  test('returns valid hex color', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    const result = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'dark',
    });
    assert.match(result, hexPattern);
  });

  test('same workspace produces same color', () => {
    const c1 = calculateBaseTint({
      workspaceIdentifier: 'my-project',
      themeType: 'dark',
    });
    const c2 = calculateBaseTint({
      workspaceIdentifier: 'my-project',
      themeType: 'dark',
    });
    assert.strictEqual(c1, c2);
  });

  test('different workspaces produce different colors', () => {
    const c1 = calculateBaseTint({
      workspaceIdentifier: 'project-a',
      themeType: 'dark',
    });
    const c2 = calculateBaseTint({
      workspaceIdentifier: 'project-b',
      themeType: 'dark',
    });
    assert.notStrictEqual(c1, c2);
  });

  test('light theme produces lighter colors than dark', () => {
    const darkColor = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'dark',
    });
    const lightColor = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'light',
    });
    const darkLum = hexToLuminance(darkColor);
    const lightLum = hexToLuminance(lightColor);
    assert.ok(
      lightLum > darkLum,
      `Light (${lightLum}) should be brighter than dark (${darkLum})`
    );
  });

  test('seed changes the resulting color', () => {
    const c1 = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'dark',
      seed: 0,
    });
    const c2 = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'dark',
      seed: 42,
    });
    assert.notStrictEqual(c1, c2);
  });

  test('same seed produces same color', () => {
    const c1 = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'dark',
      seed: 123,
    });
    const c2 = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'dark',
      seed: 123,
    });
    assert.strictEqual(c1, c2);
  });

  test('works with all theme types', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    const themeTypes: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];
    for (const themeType of themeTypes) {
      const result = calculateBaseTint({
        workspaceIdentifier: 'test-project',
        themeType,
      });
      assert.match(
        result,
        hexPattern,
        `Invalid hex for ${themeType}: ${result}`
      );
    }
  });

  test('hcLight produces lighter colors than hcDark', () => {
    const hcDarkColor = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'hcDark',
    });
    const hcLightColor = calculateBaseTint({
      workspaceIdentifier: 'test-project',
      themeType: 'hcLight',
    });
    const hcDarkLum = hexToLuminance(hcDarkColor);
    const hcLightLum = hexToLuminance(hcLightColor);
    assert.ok(
      hcLightLum > hcDarkLum,
      `hcLight (${hcLightLum}) should be brighter than hcDark (${hcDarkLum})`
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

/**
 * Calculate chroma from hex color using OKLCH.
 * This is now the proper measure of colorfulness in our OKLCH-based system.
 */
function hexToChroma(hex: string): number {
  const oklch = hexToOklch(hex);
  return oklch.c;
}
