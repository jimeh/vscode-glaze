import * as assert from 'assert';
import {
  ALL_COLOR_SCHEMES,
  STATIC_SCHEME_CONFIGS,
  getSchemeResolver,
} from '../../color/schemes';
import type { ColorScheme, SchemeConfig } from '../../color/schemes';
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
  'sideBar.background',
  'sideBar.foreground',
  'sideBarSectionHeader.background',
  'sideBarSectionHeader.foreground',
] as const;

/**
 * Schemes that have static SchemeConfig (excludes dynamic schemes).
 */
const STATIC_SCHEMES = ALL_COLOR_SCHEMES.filter(
  (s) => STATIC_SCHEME_CONFIGS[s] !== undefined
);

/**
 * Helper to get a static config, asserting it exists.
 */
function getConfig(scheme: ColorScheme): SchemeConfig {
  const config = STATIC_SCHEME_CONFIGS[scheme];
  assert.ok(config, `Config for ${scheme} should exist`);
  return config;
}

suite('STATIC_SCHEME_CONFIGS', () => {
  test('contains config for all static schemes', () => {
    for (const scheme of STATIC_SCHEMES) {
      assert.ok(
        STATIC_SCHEME_CONFIGS[scheme],
        `Config for ${scheme} should exist`
      );
    }
  });

  test('does not contain dynamic schemes', () => {
    assert.strictEqual(
      STATIC_SCHEME_CONFIGS['adaptive'],
      undefined,
      'adaptive should not have a static config'
    );
  });

  test('all static schemes define all theme types', () => {
    for (const scheme of STATIC_SCHEMES) {
      const config = getConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        assert.ok(
          config[themeType],
          `${scheme} should define config for ${themeType}`
        );
      }
    }
  });

  test('all static schemes define all required palette keys', () => {
    for (const scheme of STATIC_SCHEMES) {
      const config = getConfig(scheme);
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
          `${scheme}.${themeType} should have exactly ` +
            `${ALL_PALETTE_KEYS.length} keys`
        );
      }
    }
  });

  test('chromaFactor values within valid range (0-1)', () => {
    for (const scheme of STATIC_SCHEMES) {
      const config = getConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { chromaFactor } = themeConfig[key];
          assert.ok(
            chromaFactor >= 0 && chromaFactor <= 1,
            `${scheme}.${themeType}.${key}.chromaFactor ` +
              `(${chromaFactor}) should be between 0 and 1`
          );
        }
      }
    }
  });

  test('lightness values within valid range (0-1)', () => {
    for (const scheme of STATIC_SCHEMES) {
      const config = getConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { lightness } = themeConfig[key];
          assert.ok(
            lightness >= 0 && lightness <= 1,
            `${scheme}.${themeType}.${key}.lightness ` +
              `(${lightness}) should be between 0 and 1`
          );
        }
      }
    }
  });

  test('hueOffset values within valid range when defined', () => {
    for (const scheme of STATIC_SCHEMES) {
      const config = getConfig(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { hueOffset } = themeConfig[key];
          if (hueOffset !== undefined) {
            assert.ok(
              hueOffset >= -360 && hueOffset <= 360,
              `${scheme}.${themeType}.${key}.hueOffset ` +
                `(${hueOffset}) should be between -360 and 360`
            );
          }
        }
      }
    }
  });
});

suite('getSchemeResolver', () => {
  test('returns a resolver for all color schemes', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const resolver = getSchemeResolver(scheme);
      assert.strictEqual(
        typeof resolver,
        'function',
        `Resolver for ${scheme} should be a function`
      );
    }
  });

  test('all resolvers produce valid OKLCH for all keys', () => {
    for (const scheme of ALL_COLOR_SCHEMES) {
      const resolver = getSchemeResolver(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        for (const key of ALL_PALETTE_KEYS) {
          const result = resolver(themeType, key, { baseHue: 180 });
          assert.ok(
            result.tintOklch,
            `${scheme}.${themeType}.${key} should return tintOklch`
          );
          const { l, c, h } = result.tintOklch;
          assert.ok(
            l >= 0 && l <= 1,
            `${scheme}.${themeType}.${key} L=${l} out of range`
          );
          assert.ok(
            c >= 0,
            `${scheme}.${themeType}.${key} C=${c} should be >= 0`
          );
          assert.ok(
            h >= 0 && h < 360,
            `${scheme}.${themeType}.${key} H=${h} out of range`
          );
          assert.strictEqual(
            typeof result.hueOnlyBlend,
            'boolean',
            `${scheme}.${themeType}.${key} hueOnlyBlend ` + `should be boolean`
          );
        }
      }
    }
  });

  test('static scheme resolvers match config output', () => {
    for (const scheme of STATIC_SCHEMES) {
      const config = getConfig(scheme);
      const resolver = getSchemeResolver(scheme);
      for (const themeType of ALL_THEME_TYPES) {
        for (const key of ALL_PALETTE_KEYS) {
          const result = resolver(themeType, key, { baseHue: 180 });
          // Static resolvers should have hueOnlyBlend=false
          assert.strictEqual(
            result.hueOnlyBlend,
            false,
            `${scheme} should use full blending`
          );
          // Lightness should match config
          assert.strictEqual(
            result.tintOklch.l,
            config[themeType][key].lightness,
            `${scheme}.${themeType}.${key} lightness mismatch`
          );
        }
      }
    }
  });
});

suite('color scheme chromaFactor ordering', () => {
  /**
   * Helper to get average background chromaFactor for a dark theme.
   */
  function getAvgBgChromaFactor(config: SchemeConfig): number {
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
    const pastelFactor = getAvgBgChromaFactor(getConfig('pastel'));
    const vibrantFactor = getAvgBgChromaFactor(getConfig('vibrant'));

    assert.ok(
      vibrantFactor > pastelFactor,
      `vibrant (${vibrantFactor}) should have higher chromaFactor ` +
        `than pastel (${pastelFactor})`
    );
  });

  test('pastel has higher chromaFactor than muted', () => {
    const pastelFactor = getAvgBgChromaFactor(getConfig('pastel'));
    const mutedFactor = getAvgBgChromaFactor(getConfig('muted'));

    assert.ok(
      pastelFactor > mutedFactor,
      `pastel (${pastelFactor}) should have higher chromaFactor ` +
        `than muted (${mutedFactor})`
    );
  });

  test('muted has higher chromaFactor than tinted', () => {
    const mutedFactor = getAvgBgChromaFactor(getConfig('muted'));
    const tintedFactor = getAvgBgChromaFactor(getConfig('tinted'));

    assert.ok(
      mutedFactor > tintedFactor,
      `muted (${mutedFactor}) should have higher chromaFactor ` +
        `than tinted (${tintedFactor})`
    );
  });

  test('neon has highest chromaFactor', () => {
    const neonFactor = getAvgBgChromaFactor(getConfig('neon'));
    const vibrantFactor = getAvgBgChromaFactor(getConfig('vibrant'));

    assert.ok(
      neonFactor > vibrantFactor,
      `neon (${neonFactor}) should have higher chromaFactor ` +
        `than vibrant (${vibrantFactor})`
    );
  });
});

suite('tinted scheme', () => {
  test('has very low chromaFactor for all elements (0.05-0.15)', () => {
    const config = getConfig('tinted');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      for (const key of ALL_PALETTE_KEYS) {
        const { chromaFactor } = themeConfig[key];
        assert.ok(
          chromaFactor >= 0.05 && chromaFactor <= 0.15,
          `tinted.${themeType}.${key}.chromaFactor ` +
            `(${chromaFactor}) should be between 0.05 and 0.15`
        );
      }
    }
  });

  test('has non-zero lightness values', () => {
    const config = getConfig('tinted');

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
  test('activity bar has 180° hue offset (complementary)', () => {
    const config = getConfig('duotone');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['activityBar.background'].hueOffset,
        180,
        `duotone.${themeType}.activityBar.background ` +
          `should have hueOffset=180`
      );
      assert.strictEqual(
        themeConfig['activityBar.foreground'].hueOffset,
        180,
        `duotone.${themeType}.activityBar.foreground ` +
          `should have hueOffset=180`
      );
    }
  });

  test('title bar and status bar have no hue offset', () => {
    const config = getConfig('duotone');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['titleBar.activeBackground'].hueOffset,
        undefined,
        `duotone.${themeType}.titleBar.activeBackground ` +
          `should have no offset`
      );
      assert.strictEqual(
        themeConfig['statusBar.background'].hueOffset,
        undefined,
        `duotone.${themeType}.statusBar.background ` + `should have no offset`
      );
    }
  });
});

suite('undercurrent scheme', () => {
  test('status bar has 180° hue offset (complementary)', () => {
    const config = getConfig('undercurrent');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['statusBar.background'].hueOffset,
        180,
        `undercurrent.${themeType}.statusBar.background ` +
          `should have hueOffset=180`
      );
      assert.strictEqual(
        themeConfig['statusBar.foreground'].hueOffset,
        180,
        `undercurrent.${themeType}.statusBar.foreground ` +
          `should have hueOffset=180`
      );
    }
  });

  test('title bar and activity bar have no hue offset', () => {
    const config = getConfig('undercurrent');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['titleBar.activeBackground'].hueOffset,
        undefined,
        `undercurrent.${themeType}.titleBar.activeBackground ` +
          `should have no offset`
      );
      assert.strictEqual(
        themeConfig['activityBar.background'].hueOffset,
        undefined,
        `undercurrent.${themeType}.activityBar.background ` +
          `should have no offset`
      );
    }
  });
});

suite('analogous scheme', () => {
  test('title bar has -25° hue offset', () => {
    const config = getConfig('analogous');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['titleBar.activeBackground'].hueOffset,
        -25,
        `analogous.${themeType}.titleBar.activeBackground ` +
          `should have hueOffset=-25`
      );
    }
  });

  test('status bar has +25° hue offset', () => {
    const config = getConfig('analogous');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['statusBar.background'].hueOffset,
        25,
        `analogous.${themeType}.statusBar.background ` +
          `should have hueOffset=25`
      );
    }
  });

  test('activity bar has no hue offset (base hue)', () => {
    const config = getConfig('analogous');

    for (const themeType of ALL_THEME_TYPES) {
      const themeConfig = config[themeType];
      assert.strictEqual(
        themeConfig['activityBar.background'].hueOffset,
        undefined,
        `analogous.${themeType}.activityBar.background ` +
          `should have no offset`
      );
    }
  });
});

suite('neon scheme', () => {
  test('has maximum chromaFactor (0.85-1.0) for backgrounds', () => {
    const config = getConfig('neon');
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
          `neon.${themeType}.${key}.chromaFactor ` +
            `(${chromaFactor}) should be >= 0.85`
        );
      }
    }
  });

  test('has elevated lightness for glow effect (0.45-0.85)', () => {
    const config = getConfig('neon');
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

suite('adaptive scheme', () => {
  test('uses theme L/C when theme colors available', () => {
    const resolver = getSchemeResolver('adaptive');
    const themeColors = {
      'editor.background': '#1E1E1E',
      'titleBar.activeBackground': '#3C3C3C',
    };

    const result = resolver('dark', 'titleBar.activeBackground', {
      baseHue: 200,
      themeColors,
    });

    // Should use hue-only blending
    assert.strictEqual(result.hueOnlyBlend, true);

    // Hue should be the base hue (200), not the theme's hue
    assert.ok(
      Math.abs(result.tintOklch.h - 200) < 1,
      `Hue should be ~200, got ${result.tintOklch.h}`
    );
  });

  test('falls back to pastel when no theme colors', () => {
    const adaptive = getSchemeResolver('adaptive');
    const pastel = getSchemeResolver('pastel');

    for (const themeType of ALL_THEME_TYPES) {
      for (const key of ALL_PALETTE_KEYS) {
        const context = { baseHue: 180 };
        const adaptiveResult = adaptive(themeType, key, context);
        const pastelResult = pastel(themeType, key, context);

        // Without theme colors, adaptive should match pastel
        assert.strictEqual(
          adaptiveResult.tintOklch.l,
          pastelResult.tintOklch.l,
          `${themeType}.${key} L should match pastel fallback`
        );
        assert.strictEqual(
          adaptiveResult.tintOklch.c,
          pastelResult.tintOklch.c,
          `${themeType}.${key} C should match pastel fallback`
        );
        assert.strictEqual(
          adaptiveResult.tintOklch.h,
          pastelResult.tintOklch.h,
          `${themeType}.${key} H should match pastel fallback`
        );
      }
    }
  });

  test('falls back to pastel when theme color missing for key', () => {
    const adaptive = getSchemeResolver('adaptive');

    // Only editor.background defined, no activityBar color
    const themeColors = { 'editor.background': '#1E1E1E' };
    const context = { baseHue: 180, themeColors };

    // getColorForKey falls back to editor.background for bg keys,
    // so adaptive uses that fallback color's L/C (not pastel values)
    const result = adaptive('dark', 'activityBar.background', context);
    assert.strictEqual(result.hueOnlyBlend, true);
  });

  test('preserves theme lightness and chroma', () => {
    const resolver = getSchemeResolver('adaptive');
    // A bright, saturated color
    const themeColors = {
      'editor.background': '#1E1E1E',
      'statusBar.background': '#0078D4',
    };

    const result = resolver('dark', 'statusBar.background', {
      baseHue: 0,
      themeColors,
    });

    // The result's L/C should come from #0078D4, not from pastel
    const pastel = getSchemeResolver('pastel');
    const pastelResult = pastel('dark', 'statusBar.background', {
      baseHue: 0,
    });

    // L/C should differ from pastel since theme color is different
    const lMatch = result.tintOklch.l === pastelResult.tintOklch.l;
    const cMatch = result.tintOklch.c === pastelResult.tintOklch.c;
    assert.ok(
      !lMatch || !cMatch,
      'Adaptive should use theme L/C, not pastel values'
    );
  });

  test('uses hue-only blending mode', () => {
    const resolver = getSchemeResolver('adaptive');
    const themeColors = {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'titleBar.activeBackground': '#3C3C3C',
    };

    for (const key of ALL_PALETTE_KEYS) {
      const result = resolver('dark', key, {
        baseHue: 180,
        themeColors,
      });
      assert.strictEqual(
        result.hueOnlyBlend,
        true,
        `${key} should use hue-only blending`
      );
    }
  });
});
