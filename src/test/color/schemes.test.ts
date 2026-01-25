import * as assert from 'assert';
import { getSchemeConfig } from '../../color/schemes';
import type { SchemeConfig } from '../../color/schemes';
import type { ColorScheme } from '../../config';
import type { ThemeType } from '../../theme';

const ALL_COLOR_SCHEMES: ColorScheme[] = [
  'pastel',
  'vibrant',
  'muted',
  'monochrome',
];

const ALL_THEME_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

const ALL_PALETTE_KEYS = [
  'titleBar.activeBackground',
  'titleBar.activeForeground',
  'titleBar.inactiveBackground',
  'titleBar.inactiveForeground',
  'statusBar.background',
  'statusBar.foreground',
  'activityBar.background',
  'activityBar.foreground',
] as const;

suite('getSchemeConfig', () => {
  test('returns valid config for all color schemes', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      assert.ok(config, `Config for ${scheme} should exist`);
      assert.strictEqual(
        typeof config,
        'object',
        `Config for ${scheme} should be an object`
      );
    }
  });

  test('all schemes define all theme types', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        assert.ok(
          config[themeType],
          `${scheme} should define config for ${themeType}`
        );
      }
    }
  });

  test('all schemes define all required palette keys', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          assert.ok(
            themeConfig[key],
            `${scheme}.${themeType} should define ${key}`
          );
        }
        assert.strictEqual(
          Object.keys(themeConfig).length,
          ALL_PALETTE_KEYS.length,
          `${scheme}.${themeType} should have exactly ${ALL_PALETTE_KEYS.length} keys`
        );
      }
    }
  });

  test('chromaFactor values within valid range (0-1)', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { chromaFactor } = themeConfig[key];
          assert.ok(
            chromaFactor >= 0 && chromaFactor <= 1,
            `${scheme}.${themeType}.${key}.chromaFactor (${chromaFactor}) ` +
              `should be between 0 and 1`
          );
        }
      }
    }
  });

  test('lightness values within valid range (0-1)', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { lightness } = themeConfig[key];
          assert.ok(
            lightness >= 0 && lightness <= 1,
            `${scheme}.${themeType}.${key}.lightness (${lightness}) ` +
              `should be between 0 and 1`
          );
        }
      }
    }
  });
});

suite('color scheme chromaFactor ordering', () => {
  /**
   * Helper to get average background chromaFactor for a scheme's dark theme.
   */
  function getAverageBackgroundChromaFactor(config: SchemeConfig): number {
    const backgroundKeys = [
      'titleBar.activeBackground',
      'statusBar.background',
      'activityBar.background',
    ] as const;

    const darkConfig = config.dark;
    const factors = backgroundKeys.map((key) => darkConfig[key].chromaFactor);
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  test('vibrant has higher chromaFactor than pastel', () => {
    const pastelFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('pastel')
    );
    const vibrantFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('vibrant')
    );

    assert.ok(
      vibrantFactor > pastelFactor,
      `vibrant (${vibrantFactor}) should have higher chromaFactor than ` +
        `pastel (${pastelFactor})`
    );
  });

  test('pastel has higher chromaFactor than muted', () => {
    const pastelFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('pastel')
    );
    const mutedFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('muted')
    );

    assert.ok(
      pastelFactor > mutedFactor,
      `pastel (${pastelFactor}) should have higher chromaFactor than ` +
        `muted (${mutedFactor})`
    );
  });

  test('muted has higher chromaFactor than monochrome', () => {
    const mutedFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('muted')
    );
    const monoFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('monochrome')
    );

    assert.ok(
      mutedFactor > monoFactor,
      `muted (${mutedFactor}) should have higher chromaFactor than ` +
        `monochrome (${monoFactor})`
    );
  });

  test('chromaFactor ordering: vibrant > pastel > muted > monochrome', () => {
    const vibrantFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('vibrant')
    );
    const pastelFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('pastel')
    );
    const mutedFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('muted')
    );
    const monoFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('monochrome')
    );

    assert.ok(
      vibrantFactor > pastelFactor &&
        pastelFactor > mutedFactor &&
        mutedFactor > monoFactor,
      `Expected ordering vibrant (${vibrantFactor}) > pastel (${pastelFactor}) > ` +
        `muted (${mutedFactor}) > monochrome (${monoFactor})`
    );
  });
});

suite('monochrome scheme', () => {
  test('has zero chromaFactor for all elements in all themes', () => {
    const config = getSchemeConfig('monochrome');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of ALL_PALETTE_KEYS) {
        const { chromaFactor } = themeConfig[key];
        assert.strictEqual(
          chromaFactor,
          0,
          `monochrome.${themeType}.${key}.chromaFactor should be 0, ` +
            `got ${chromaFactor}`
        );
      }
    }
  });

  test('has non-zero lightness values', () => {
    const config = getSchemeConfig('monochrome');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of ALL_PALETTE_KEYS) {
        const { lightness } = themeConfig[key];
        assert.ok(
          lightness > 0,
          `monochrome.${themeType}.${key}.lightness should be > 0, ` +
            `got ${lightness}`
        );
      }
    }
  });
});
