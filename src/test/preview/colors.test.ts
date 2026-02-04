import * as assert from 'assert';
import {
  SAMPLE_HUES,
  generateStylePreview,
  generateAllStylePreviews,
  generateHarmonyPreview,
  generateAllHarmonyPreviews,
  generateWorkspacePreview,
} from '../../preview/colors';
import { ALL_COLOR_STYLES } from '../../color/styles';
import { ALL_COLOR_HARMONIES } from '../../color/harmony';
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

suite('generateStylePreview', () => {
  test('returns preview with correct style name', () => {
    for (const style of ALL_COLOR_STYLES) {
      const preview = generateStylePreview(style, 'dark');
      assert.strictEqual(preview.style, style);
    }
  });

  test('returns preview with display label', () => {
    const preview = generateStylePreview('pastel', 'dark');
    assert.strictEqual(preview.label, 'Pastel');

    const vibrantPreview = generateStylePreview('vibrant', 'dark');
    assert.strictEqual(vibrantPreview.label, 'Vibrant');
  });

  test('generates colors for each sample hue', () => {
    const preview = generateStylePreview('pastel', 'dark');
    assert.strictEqual(
      preview.hueColors.length,
      SAMPLE_HUES.length,
      'Should have colors for each sample hue'
    );
  });

  test('each hue has colors for all three elements', () => {
    const preview = generateStylePreview('pastel', 'dark');
    for (const hueColors of preview.hueColors) {
      assert.ok(hueColors.titleBar, 'Should have titleBar colors');
      assert.ok(hueColors.statusBar, 'Should have statusBar colors');
      assert.ok(hueColors.activityBar, 'Should have activityBar colors');
    }
  });

  test('all colors are valid hex values', () => {
    for (const style of ALL_COLOR_STYLES) {
      for (const themeType of ALL_THEME_TYPES) {
        const preview = generateStylePreview(style, themeType);
        for (const hueColors of preview.hueColors) {
          assert.ok(
            isValidHexColor(hueColors.titleBar.background),
            `${style}/${themeType} titleBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.titleBar.foreground),
            `${style}/${themeType} titleBar.foreground should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.statusBar.background),
            `${style}/${themeType} statusBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.statusBar.foreground),
            `${style}/${themeType} statusBar.foreground should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.activityBar.background),
            `${style}/${themeType} activityBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.activityBar.foreground),
            `${style}/${themeType} activityBar.foreground should be valid hex`
          );
        }
      }
    }
  });

  test('different theme types produce different colors', () => {
    const darkPreview = generateStylePreview('pastel', 'dark');
    const lightPreview = generateStylePreview('pastel', 'light');

    // At least the first hue should differ between dark and light
    assert.notStrictEqual(
      darkPreview.hueColors[0].titleBar.background,
      lightPreview.hueColors[0].titleBar.background,
      'Dark and light should produce different colors'
    );
  });

  test('different styles produce different colors', () => {
    const pastelPreview = generateStylePreview('pastel', 'dark');
    const vibrantPreview = generateStylePreview('vibrant', 'dark');

    assert.notStrictEqual(
      pastelPreview.hueColors[0].titleBar.background,
      vibrantPreview.hueColors[0].titleBar.background,
      'Pastel and vibrant should produce different colors'
    );
  });
});

suite('generateAllStylePreviews', () => {
  test('returns previews for all styles', () => {
    const previews = generateAllStylePreviews('dark');
    assert.strictEqual(previews.length, ALL_COLOR_STYLES.length);
  });

  test('styles are in correct order', () => {
    const previews = generateAllStylePreviews('dark');
    const styleNames = previews.map((p) => p.style);
    assert.deepStrictEqual(styleNames, [...ALL_COLOR_STYLES]);
  });

  test('works with all theme types', () => {
    for (const themeType of ALL_THEME_TYPES) {
      const previews = generateAllStylePreviews(themeType);
      assert.strictEqual(
        previews.length,
        ALL_COLOR_STYLES.length,
        `Should return ${ALL_COLOR_STYLES.length} previews for ${themeType}`
      );
    }
  });
});

suite('generateStylePreview with harmony', () => {
  test('non-uniform harmony produces different element colors', () => {
    const uniform = generateStylePreview('pastel', 'dark', 'uniform');
    const triadic = generateStylePreview('pastel', 'dark', 'triadic');

    // Triadic offsets titleBar by -120° and statusBar by +120°,
    // so their colors should differ from uniform.
    assert.notStrictEqual(
      uniform.hueColors[0].titleBar.background,
      triadic.hueColors[0].titleBar.background,
      'Triadic harmony should change titleBar colors vs uniform'
    );
    assert.notStrictEqual(
      uniform.hueColors[0].statusBar.background,
      triadic.hueColors[0].statusBar.background,
      'Triadic harmony should change statusBar colors vs uniform'
    );
  });
});

suite('generateHarmonyPreview', () => {
  test('returns preview with correct harmony name', () => {
    for (const harmony of ALL_COLOR_HARMONIES) {
      const preview = generateHarmonyPreview(harmony, 'pastel', 'dark');
      assert.strictEqual(preview.harmony, harmony);
    }
  });

  test('returns preview with display label', () => {
    const preview = generateHarmonyPreview('uniform', 'pastel', 'dark');
    assert.strictEqual(preview.label, 'Uniform');

    const duotone = generateHarmonyPreview('duotone', 'pastel', 'dark');
    assert.strictEqual(duotone.label, 'Duotone');
  });

  test('generates colors for each sample hue', () => {
    const preview = generateHarmonyPreview('uniform', 'pastel', 'dark');
    assert.strictEqual(
      preview.hueColors.length,
      SAMPLE_HUES.length,
      'Should have colors for each sample hue'
    );
  });

  test('each hue has colors for all three elements', () => {
    const preview = generateHarmonyPreview('triadic', 'pastel', 'dark');
    for (const hueColors of preview.hueColors) {
      assert.ok(hueColors.titleBar, 'Should have titleBar colors');
      assert.ok(hueColors.statusBar, 'Should have statusBar colors');
      assert.ok(hueColors.activityBar, 'Should have activityBar colors');
    }
  });

  test('all colors are valid hex values', () => {
    for (const harmony of ALL_COLOR_HARMONIES) {
      for (const themeType of ALL_THEME_TYPES) {
        const preview = generateHarmonyPreview(harmony, 'pastel', themeType);
        for (const hueColors of preview.hueColors) {
          assert.ok(
            isValidHexColor(hueColors.titleBar.background),
            `${harmony}/${themeType} titleBar.background should be valid hex`
          );
          assert.ok(
            isValidHexColor(hueColors.titleBar.foreground),
            `${harmony}/${themeType} titleBar.foreground should be valid hex`
          );
        }
      }
    }
  });

  test('different harmonies produce different colors for non-uniform', () => {
    const uniform = generateHarmonyPreview('uniform', 'pastel', 'dark');
    const triadic = generateHarmonyPreview('triadic', 'pastel', 'dark');

    // Triadic applies ±120° offsets on titleBar and statusBar
    assert.notStrictEqual(
      uniform.hueColors[0].statusBar.background,
      triadic.hueColors[0].statusBar.background,
      'Uniform and triadic should produce different statusBar colors'
    );
  });
});

suite('generateAllHarmonyPreviews', () => {
  test('returns previews for all harmonies', () => {
    const previews = generateAllHarmonyPreviews('pastel', 'dark');
    assert.strictEqual(previews.length, ALL_COLOR_HARMONIES.length);
  });

  test('harmonies are in correct order', () => {
    const previews = generateAllHarmonyPreviews('pastel', 'dark');
    const harmonyNames = previews.map((p) => p.harmony);
    assert.deepStrictEqual(harmonyNames, [...ALL_COLOR_HARMONIES]);
  });

  test('works with all theme types', () => {
    for (const themeType of ALL_THEME_TYPES) {
      const previews = generateAllHarmonyPreviews('pastel', themeType);
      assert.strictEqual(
        previews.length,
        ALL_COLOR_HARMONIES.length,
        `Should return ${ALL_COLOR_HARMONIES.length} previews for ${themeType}`
      );
    }
  });
});

suite('generateWorkspacePreview', () => {
  test('returns preview with identifier', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
    });
    assert.strictEqual(preview.identifier, 'my-project');
  });

  test('returns colors for all three elements', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
    });
    assert.ok(preview.colors.titleBar, 'Should have titleBar colors');
    assert.ok(preview.colors.statusBar, 'Should have statusBar colors');
    assert.ok(preview.colors.activityBar, 'Should have activityBar colors');
  });

  test('all colors are valid hex values', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
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
      style: 'pastel',
      themeType: 'dark',
    });
    const preview2 = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
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
      style: 'pastel',
      themeType: 'dark',
    });
    const preview2 = generateWorkspacePreview({
      identifier: 'project-b',
      style: 'pastel',
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
      style: 'pastel',
      themeType: 'dark',
      seed: 0,
    });
    const preview2 = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
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
      style: 'pastel',
      themeType: 'dark',
    });

    assert.strictEqual(preview.isBlended, false);
    assert.strictEqual(preview.blendFactor, undefined);
  });

  test('isBlended is true when theme colors provided', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
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
      style: 'pastel',
      themeType: 'dark',
      themeColors: { 'editor.background': '#1e1e1e' },
      blendFactor: 0,
    });

    assert.strictEqual(preview.isBlended, false);
  });

  test('blending changes colors', () => {
    const unblended = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
    });

    const blended = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
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
      style: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0.1,
    });

    const highBlend = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
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

  test('targetBlendFactors override per-element blend', () => {
    const themeColors = { 'editor.background': '#000000' };

    const previewDefault = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0.35,
    });

    const previewOverride = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0.35,
      targetBlendFactors: { statusBar: 0.9 },
    });

    // titleBar should be the same (no override)
    assert.strictEqual(
      previewDefault.colors.titleBar.background,
      previewOverride.colors.titleBar.background,
      'titleBar should use default blend factor'
    );

    // statusBar should differ (override to 0.9)
    assert.notStrictEqual(
      previewDefault.colors.statusBar.background,
      previewOverride.colors.statusBar.background,
      'statusBar should use overridden blend factor'
    );
  });

  test('targetBlendFactors included in result when set', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
      themeColors: { 'editor.background': '#1e1e1e' },
      blendFactor: 0.35,
      targetBlendFactors: { titleBar: 0.5 },
    });

    assert.deepStrictEqual(preview.targetBlendFactors, {
      titleBar: 0.5,
    });
  });

  test('targetBlendFactors undefined when empty', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
      themeColors: { 'editor.background': '#1e1e1e' },
      blendFactor: 0.35,
      targetBlendFactors: {},
    });

    assert.strictEqual(preview.targetBlendFactors, undefined);
  });

  test('blends when blendFactor is 0 but target override is non-zero', () => {
    const themeColors = { 'editor.background': '#1e1e1e' };

    const previewNoBlend = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0,
    });

    const previewOverride = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
      themeColors,
      blendFactor: 0,
      targetBlendFactors: { titleBar: 0.5 },
    });

    assert.strictEqual(previewNoBlend.isBlended, false);
    assert.strictEqual(previewOverride.isBlended, true);
    // titleBar should differ due to override blend
    assert.notStrictEqual(
      previewNoBlend.colors.titleBar.background,
      previewOverride.colors.titleBar.background,
      'titleBar should blend with target override even when global is 0'
    );
  });

  test('targetBlendFactors undefined when not provided', () => {
    const preview = generateWorkspacePreview({
      identifier: 'my-project',
      style: 'pastel',
      themeType: 'dark',
    });

    assert.strictEqual(preview.targetBlendFactors, undefined);
  });
});
