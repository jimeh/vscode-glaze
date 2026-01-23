import * as assert from 'assert';
import { generatePalette } from '../../color/palette';
import type { TintTarget } from '../../config';
import type { ThemeKind, ThemeContext } from '../../theme';
import type { ElementBackgrounds } from '../../theme/backgrounds';

const ALL_TARGETS: TintTarget[] = ['titleBar', 'statusBar', 'activityBar'];

/**
 * Helper to create a ThemeContext for testing.
 */
function makeThemeContext(
  kind: ThemeKind,
  options?: { background?: string; backgrounds?: ElementBackgrounds }
): ThemeContext {
  // Support both old style (background) and new style (backgrounds)
  let backgrounds: ElementBackgrounds | undefined;
  if (options?.backgrounds) {
    backgrounds = options.backgrounds;
  } else if (options?.background) {
    backgrounds = { editor: options.background };
  }
  return {
    kind,
    isAutoDetected: true,
    background: backgrounds?.editor,
    backgrounds,
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
  const THEME_KINDS: ThemeKind[] = [
    'dark',
    'light',
    'highContrast',
    'highContrastLight',
  ];

  test('generates valid colors for all theme kinds', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const themeKind of THEME_KINDS) {
      const palette = generatePalette({
        workspaceIdentifier: 'test-project',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeKind),
      });
      for (const [key, color] of Object.entries(palette)) {
        assert.match(
          color,
          hexPattern,
          `Invalid hex for ${key} in ${themeKind}: ${color}`
        );
      }
    }
  });

  test('different theme kinds produce different colors', () => {
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
      themeContext: makeThemeContext('highContrast'),
    });

    const darkBgLum = hexToLuminance(darkPalette['titleBar.activeBackground']!);
    const hcBgLum = hexToLuminance(hcPalette['titleBar.activeBackground']!);

    assert.ok(
      hcBgLum < darkBgLum,
      `High contrast background should be darker than regular dark theme`
    );
  });

  test('same workspace + theme produces consistent colors', () => {
    for (const themeKind of THEME_KINDS) {
      const p1 = generatePalette({
        workspaceIdentifier: 'consistent-test',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeKind),
      });
      const p2 = generatePalette({
        workspaceIdentifier: 'consistent-test',
        targets: ALL_TARGETS,
        themeContext: makeThemeContext(themeKind),
      });
      assert.deepStrictEqual(
        p1,
        p2,
        `Palette should be consistent for theme: ${themeKind}`
      );
    }
  });
});

suite('generatePalette theme blending', () => {
  test('blends colors when theme background is provided', () => {
    // Without blending
    const paletteNoBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
      themeBlendFactor: 0,
    });

    // With blending (One Dark Pro background)
    const paletteBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { background: '#282C34' }),
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
    const paletteNoBackground = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    const paletteZeroFactor = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { background: '#282C34' }),
      themeBlendFactor: 0,
    });

    // With factor 0, should produce same results
    assert.deepStrictEqual(
      paletteNoBackground,
      paletteZeroFactor,
      'Zero blend factor should produce same results as no background'
    );
  });

  test('higher blend factor produces colors closer to theme', () => {
    const themeBg = '#1F1F1F'; // Dark theme background
    const themeBgLum = hexToLuminance(themeBg);

    const paletteLowBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { background: themeBg }),
      themeBlendFactor: 0.2,
    });

    const paletteHighBlend = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { background: themeBg }),
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
      themeContext: makeThemeContext('light', { background: '#FFFFFF' }),
      themeBlendFactor: 0.35,
    });

    assert.notStrictEqual(
      paletteNoBlend['titleBar.activeBackground'],
      paletteBlend['titleBar.activeBackground'],
      'Light theme blending should produce different colors'
    );
  });

  test('foreground colors are not blended with theme background', () => {
    // Generate palette without theme background
    const paletteNoBackground = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark'),
    });

    // Generate palette with theme background and blending
    const paletteWithBackground = generatePalette({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeContext: makeThemeContext('dark', { background: '#282C34' }),
      themeBlendFactor: 0.5,
    });

    // Foreground colors should remain unchanged regardless of background
    assert.strictEqual(
      paletteNoBackground['titleBar.activeForeground'],
      paletteWithBackground['titleBar.activeForeground'],
      'titleBar.activeForeground should not be blended'
    );
    assert.strictEqual(
      paletteNoBackground['titleBar.inactiveForeground'],
      paletteWithBackground['titleBar.inactiveForeground'],
      'titleBar.inactiveForeground should not be blended'
    );
    assert.strictEqual(
      paletteNoBackground['statusBar.foreground'],
      paletteWithBackground['statusBar.foreground'],
      'statusBar.foreground should not be blended'
    );
    assert.strictEqual(
      paletteNoBackground['activityBar.foreground'],
      paletteWithBackground['activityBar.foreground'],
      'activityBar.foreground should not be blended'
    );

    // Background colors should be blended (different from no-background)
    assert.notStrictEqual(
      paletteNoBackground['titleBar.activeBackground'],
      paletteWithBackground['titleBar.activeBackground'],
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
