import * as assert from 'assert';
import {
  SAMPLE_HUES,
  generateSchemePreview,
  generateAllSchemePreviews,
  generateWorkspacePreview,
} from '../../preview/colors';
import { ALL_COLOR_SCHEMES } from '../../color/schemes';
import type { ThemeType } from '../../theme';

const ALL_THEME_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_PATTERN.test(color);
}

suite('SAMPLE_HUES', () => {
  test('contains 8 sample hues', () => {
    assert.strictEqual(SAMPLE_HUES.length, 8);
  });

  test('hues are OKLCH-calibrated for accurate color names', () => {
    // Red, Orange, Yellow, Green, Teal, Cyan, Blue, Purple
    const expected = [29, 55, 100, 145, 185, 235, 265, 305];
    assert.deepStrictEqual(SAMPLE_HUES, expected);
  });

  test('all hues are in valid range (0-359)', () => {
    for (const hue of SAMPLE_HUES) {
      assert.ok(hue >= 0 && hue < 360, `Hue ${hue} should be in range 0-359`);
    }
  });
});

suite('generateSchemePreview', () => {
  test('returns preview with correct scheme name', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const preview = generateSchemePreview(scheme, 'dark');
      assert.strictEqual(preview.scheme, scheme);
    }
  });

  test('returns preview with display label', () => {
    const preview = generateSchemePreview('pastel', 'dark');
    assert.strictEqual(preview.label, 'Pastel');

    const vibrantPreview = generateSchemePreview('vibrant', 'dark');
    assert.strictEqual(vibrantPreview.label, 'Vibrant');
  });

  test('generates colors for each sample hue', () => {
    const preview = generateSchemePreview('pastel', 'dark');
    assert.strictEqual(
      preview.hueColors.length,
      SAMPLE_HUES.length,
      'Should have colors for each sample hue'
    );
  });

  test('each hue has colors for all three elements', () => {
    const preview = generateSchemePreview('pastel', 'dark');
    for (const hueColors of preview.hueColors) {
      assert.ok(hueColors.titleBar, 'Should have titleBar colors');
      assert.ok(hueColors.statusBar, 'Should have statusBar colors');
      assert.ok(hueColors.activityBar, 'Should have activityBar colors');
    }
  });

  test('all colors are valid hex values', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      for (const themeType of ALL_THEME_TYPES) {
        const preview = generateSchemePreview(scheme, themeType);
        for (const hueColors of preview.hueColors) {
          assert.ok(
            isValidHexColor(hueColors.titleBar.background),
            `${scheme}/${themeType} titleBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.titleBar.foreground),
            `${scheme}/${themeType} titleBar.foreground should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.statusBar.background),
            `${scheme}/${themeType} statusBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.statusBar.foreground),
            `${scheme}/${themeType} statusBar.foreground should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.activityBar.background),
            `${scheme}/${themeType} activityBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.activityBar.foreground),
            `${scheme}/${themeType} activityBar.foreground should be valid hex`
          );
        }
      }
    }
  });

  test('different theme types produce different colors', () => {
    const darkPreview = generateSchemePreview('pastel', 'dark');
    const lightPreview = generateSchemePreview('pastel', 'light');

    // At least the first hue should differ between dark and light
    assert.notStrictEqual(
      darkPreview.hueColors[0].titleBar.background,
      lightPreview.hueColors[0].titleBar.background,
      'Dark and light should produce different colors'
    );
  });

  test('different schemes produce different colors', () => {
    const pastelPreview = generateSchemePreview('pastel', 'dark');
    const vibrantPreview = generateSchemePreview('vibrant', 'dark');

    assert.notStrictEqual(
      pastelPreview.hueColors[0].titleBar.background,
      vibrantPreview.hueColors[0].titleBar.background,
      'Pastel and vibrant should produce different colors'
    );
  });
});

suite('generateAllSchemePreviews', () => {
  test('returns previews for all 8 schemes', () => {
    const previews = generateAllSchemePreviews('dark');
    assert.strictEqual(previews.length, 8);
  });

  test('schemes are in correct order', () => {
    const previews = generateAllSchemePreviews('dark');
    const schemeNames = previews.map((p) => p.scheme);
    assert.deepStrictEqual(schemeNames, [...ALL_COLOR_SCHEMES]);
  });

  test('works with all theme types', () => {
    for (const themeType of ALL_THEME_TYPES) {
      const previews = generateAllSchemePreviews(themeType);
      assert.strictEqual(
        previews.length,
        8,
        `Should return 8 previews for ${themeType}`
      );
    }
  });
});

suite('generateWorkspacePreview', () => {
  test('returns preview with identifier', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });
    assert.strictEqual(preview.identifier, 'my-project');
  });

  test('returns colors for all three elements', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });
    assert.ok(preview.colors.titleBar, 'Should have titleBar colors');
    assert.ok(preview.colors.statusBar, 'Should have statusBar colors');
    assert.ok(preview.colors.activityBar, 'Should have activityBar colors');
  });

  test('all colors are valid hex values', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });

    assert.ok(isValidHexColor(preview.colors.titleBar.background));
    assert.ok(isValidHexColor(preview.colors.titleBar.foreground));
    assert.ok(isValidHexColor(preview.colors.statusBar.background));
    assert.ok(isValidHexColor(preview.colors.statusBar.foreground));
    assert.ok(isValidHexColor(preview.colors.activityBar.background));
    assert.ok(isValidHexColor(preview.colors.activityBar.foreground));
  });

  test('same identifier produces same colors', () => {
    const preview1 = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });
    const preview2 = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });

    assert.strictEqual(
      preview1.colors.titleBar.background,
      preview2.colors.titleBar.background
    );
  });

  test('different identifiers produce different colors', () => {
    const preview1 = generateWorkspacePreview({
      identifier: 'project-a',
      scheme: 'pastel',
      themeType: 'dark',
    });
    const preview2 = generateWorkspacePreview({
      identifier: 'project-b',
      scheme: 'pastel',
      themeType: 'dark',
    });

    assert.notStrictEqual(
      preview1.colors.titleBar.background,
      preview2.colors.titleBar.background
    );
  });

  test('seed changes colors', () => {
    const preview1 = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      seed: 0,
    });
    const preview2 = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      seed: 42,
    });

    assert.notStrictEqual(
      preview1.colors.titleBar.background,
      preview2.colors.titleBar.background,
      'Different seeds should produce different colors'
    );
  });

  test('isBlended is false when no theme colors provided', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });

    assert.strictEqual(preview.isBlended, false);
    assert.strictEqual(preview.blendFactor, undefined);
  });

  test('isBlended is true when theme colors provided', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      themeColors: { 'editor.background': '#1e1e1e' },
      blendFactor: 0.35,
    });

    assert.strictEqual(preview.isBlended, true);
    assert.strictEqual(preview.blendFactor, 0.35);
  });

  test('isBlended is false when blendFactor is 0', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      themeColors: { 'editor.background': '#1e1e1e' },
      blendFactor: 0,
    });

    assert.strictEqual(preview.isBlended, false);
  });

  test('blending changes colors', () => {
    const unblended = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
    });

    const blended = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      themeColors: { 'editor.background': '#1e1e1e' },
      blendFactor: 0.5,
    });

    assert.notStrictEqual(
      unblended.colors.titleBar.background,
      blended.colors.titleBar.background,
      'Blending should change colors'
    );
  });

  test('higher blend factor produces colors closer to theme', () => {
    const themeColors = { 'editor.background': '#000000' };

    const lowBlend = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0.1,
    });

    const highBlend = generateWorkspacePreview({
      identifier: 'my-project',
      scheme: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0.9,
    });

    // High blend should be darker (closer to #000000)
    const lowLightness = parseInt(
      lowBlend.colors.titleBar.background.slice(5, 7),
      16
    );
    const highLightness = parseInt(
      highBlend.colors.titleBar.background.slice(5, 7),
      16
    );

    assert.ok(
      highLightness < lowLightness,
      'Higher blend factor should produce darker colors when blending toward black'
    );
  });
});
