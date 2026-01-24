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

  test('saturation values within valid range (0-1)', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { saturation } = themeConfig[key];
          assert.ok(
            saturation >= 0 && saturation <= 1,
            `${scheme}.${themeType}.${key}.saturation (${saturation}) ` +
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

suite('color scheme saturation ordering', () => {
  /**
   * Helper to get average background saturation for a scheme's dark theme.
   */
  function getAverageBackgroundSaturation(config: SchemeConfig): number {
    const backgroundKeys = [
      'titleBar.activeBackground',
      'statusBar.background',
      'activityBar.background',
    ] as const;

    const darkConfig = config.dark;
    const saturations = backgroundKeys.map((key) => darkConfig[key].saturation);
    return saturations.reduce((a, b) => a + b, 0) / saturations.length;
  }

  test('vibrant has higher saturation than pastel', () => {
    const pastelSat = getAverageBackgroundSaturation(getSchemeConfig('pastel'));
    const vibrantSat = getAverageBackgroundSaturation(
      getSchemeConfig('vibrant')
    );

    assert.ok(
      vibrantSat > pastelSat,
      `vibrant (${vibrantSat}) should have higher saturation than ` +
        `pastel (${pastelSat})`
    );
  });

  test('pastel has higher saturation than muted', () => {
    const pastelSat = getAverageBackgroundSaturation(getSchemeConfig('pastel'));
    const mutedSat = getAverageBackgroundSaturation(getSchemeConfig('muted'));

    assert.ok(
      pastelSat > mutedSat,
      `pastel (${pastelSat}) should have higher saturation than ` +
        `muted (${mutedSat})`
    );
  });

  test('muted has higher saturation than monochrome', () => {
    const mutedSat = getAverageBackgroundSaturation(getSchemeConfig('muted'));
    const monoSat = getAverageBackgroundSaturation(
      getSchemeConfig('monochrome')
    );

    assert.ok(
      mutedSat > monoSat,
      `muted (${mutedSat}) should have higher saturation than ` +
        `monochrome (${monoSat})`
    );
  });

  test('saturation ordering: vibrant > pastel > muted > monochrome', () => {
    const vibrantSat = getAverageBackgroundSaturation(
      getSchemeConfig('vibrant')
    );
    const pastelSat = getAverageBackgroundSaturation(getSchemeConfig('pastel'));
    const mutedSat = getAverageBackgroundSaturation(getSchemeConfig('muted'));
    const monoSat = getAverageBackgroundSaturation(
      getSchemeConfig('monochrome')
    );

    assert.ok(
      vibrantSat > pastelSat && pastelSat > mutedSat && mutedSat > monoSat,
      `Expected ordering vibrant (${vibrantSat}) > pastel (${pastelSat}) > ` +
        `muted (${mutedSat}) > monochrome (${monoSat})`
    );
  });
});

suite('monochrome scheme', () => {
  test('has zero saturation for all elements in all themes', () => {
    const config = getSchemeConfig('monochrome');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of ALL_PALETTE_KEYS) {
        const { saturation } = themeConfig[key];
        assert.strictEqual(
          saturation,
          0,
          `monochrome.${themeType}.${key}.saturation should be 0, ` +
            `got ${saturation}`
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
