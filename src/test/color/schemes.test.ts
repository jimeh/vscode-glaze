import * as assert from 'assert';
import { ALL_COLOR_SCHEMES, getSchemeConfig } from '../../color/schemes';
import type { SchemeConfig } from '../../color/schemes';
import type { ThemeType } from '../../theme';

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

  test('hueOffset values within valid range (-360 to 360) when defined', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const config = getSchemeConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { hueOffset } = themeConfig[key];
          if (hueOffset !== undefined) {
            assert.ok(
              hueOffset >= -360 && hueOffset <= 360,
              `${scheme}.${themeType}.${key}.hueOffset (${hueOffset}) ` +
                `should be between -360 and 360`
            );
          }
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

  test('muted has higher chromaFactor than tinted', () => {
    const mutedFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('muted')
    );
    const tintedFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('tinted')
    );

    assert.ok(
      mutedFactor > tintedFactor,
      `muted (${mutedFactor}) should have higher chromaFactor than ` +
        `tinted (${tintedFactor})`
    );
  });

  test('neon has highest chromaFactor', () => {
    const neonFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('neon')
    );
    const vibrantFactor = getAverageBackgroundChromaFactor(
      getSchemeConfig('vibrant')
    );

    assert.ok(
      neonFactor > vibrantFactor,
      `neon (${neonFactor}) should have higher chromaFactor than ` +
        `vibrant (${vibrantFactor})`
    );
  });
});

suite('tinted scheme', () => {
  test('has very low chromaFactor for all elements (0.05-0.15)', () => {
    const config = getSchemeConfig('tinted');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of ALL_PALETTE_KEYS) {
        const { chromaFactor } = themeConfig[key];
        assert.ok(
          chromaFactor >= 0.05 && chromaFactor <= 0.15,
          `tinted.${themeType}.${key}.chromaFactor (${chromaFactor}) ` +
            `should be between 0.05 and 0.15`
        );
      }
    }
  });

  test('has non-zero lightness values', () => {
    const config = getSchemeConfig('tinted');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of ALL_PALETTE_KEYS) {
        const { lightness } = themeConfig[key];
        assert.ok(
          lightness > 0,
          `tinted.${themeType}.${key}.lightness should be > 0, ` +
            `got ${lightness}`
        );
      }
    }
  });
});

suite('duotone scheme', () => {
  test('status bar has 180° hue offset (complementary)', () => {
    const config = getSchemeConfig('duotone');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['statusBar.background'].hueOffset,
        180,
        `duotone.${themeType}.statusBar.background should have hueOffset=180`
      );
      assert.strictEqual(
        themeConfig['statusBar.foreground'].hueOffset,
        180,
        `duotone.${themeType}.statusBar.foreground should have hueOffset=180`
      );
    }
  });

  test('title bar and activity bar have no hue offset', () => {
    const config = getSchemeConfig('duotone');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['titleBar.activeBackground'].hueOffset,
        undefined,
        `duotone.${themeType}.titleBar.activeBackground should have no offset`
      );
      assert.strictEqual(
        themeConfig['activityBar.background'].hueOffset,
        undefined,
        `duotone.${themeType}.activityBar.background should have no offset`
      );
    }
  });
});

suite('analogous scheme', () => {
  test('title bar has -25° hue offset', () => {
    const config = getSchemeConfig('analogous');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['titleBar.activeBackground'].hueOffset,
        -25,
        `analogous.${themeType}.titleBar.activeBackground should have ` +
          `hueOffset=-25`
      );
    }
  });

  test('status bar has +25° hue offset', () => {
    const config = getSchemeConfig('analogous');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['statusBar.background'].hueOffset,
        25,
        `analogous.${themeType}.statusBar.background should have hueOffset=25`
      );
    }
  });

  test('activity bar has no hue offset (base hue)', () => {
    const config = getSchemeConfig('analogous');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['activityBar.background'].hueOffset,
        undefined,
        `analogous.${themeType}.activityBar.background should have no offset`
      );
    }
  });
});

suite('neon scheme', () => {
  test('has maximum chromaFactor (0.85-1.0) for backgrounds', () => {
    const config = getSchemeConfig('neon');
    const backgroundKeys = [
      'titleBar.activeBackground',
      'statusBar.background',
      'activityBar.background',
    ] as const;

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of backgroundKeys) {
        const { chromaFactor } = themeConfig[key];
        assert.ok(
          chromaFactor >= 0.85,
          `neon.${themeType}.${key}.chromaFactor (${chromaFactor}) ` +
            `should be >= 0.85`
        );
      }
    }
  });

  test('has elevated lightness for glow effect (0.45-0.85)', () => {
    const config = getSchemeConfig('neon');
    const backgroundKeys = [
      'titleBar.activeBackground',
      'statusBar.background',
      'activityBar.background',
    ] as const;

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of backgroundKeys) {
        const { lightness } = themeConfig[key];
        assert.ok(
          lightness >= 0.4 && lightness <= 0.85,
          `neon.${themeType}.${key}.lightness (${lightness}) ` +
            `should be between 0.4 and 0.85`
        );
      }
    }
  });
});
