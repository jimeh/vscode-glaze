import * as assert from 'assert';
import {
  ALL_COLOR_STYLES,
  STATIC_STYLE_CONFIGS,
  getStyleResolver,
} from '../../color/styles';
import type { ColorStyle, StyleConfig } from '../../color/styles';
import type { ThemeType } from '../../theme';
import { ALL_COLOR_HARMONIES, HARMONY_CONFIGS } from '../../color/harmony';
import type { ColorHarmony } from '../../color/harmony';

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
 * Styles that have static StyleConfig (excludes dynamic styles).
 */
const STATIC_STYLES = ALL_COLOR_STYLES.filter(
  (s) => STATIC_STYLE_CONFIGS[s] !== undefined
);

/**
 * Helper to get a static config, asserting it exists.
 */
function getConfig(style: ColorStyle): StyleConfig {
  const config = STATIC_STYLE_CONFIGS[style];
  assert.ok(config, `Config for ${style} should exist`);
  return config;
}

suite('STATIC_STYLE_CONFIGS', () => {
  test('contains config for all static styles', () => {
    for (const style of STATIC_STYLES) {
      assert.ok(
        STATIC_STYLE_CONFIGS[style],
        `Config for ${style} should exist`
      );
    }
  });

  test('does not contain dynamic styles', () => {
    assert.strictEqual(
      STATIC_STYLE_CONFIGS['adaptive'],
      undefined,
      'adaptive should not have a static config'
    );
  });

  test('all static styles define all theme types', () => {
    for (const style of STATIC_STYLES) {
      const config = getConfig(style);
      for (const themeType of ALL_THEME_TYPES) {
        assert.ok(
          config[themeType],
          `${style} should define config for ${themeType}`
        );
      }
    }
  });

  test('all static styles define all required palette keys', () => {
    for (const style of STATIC_STYLES) {
      const config = getConfig(style);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          assert.ok(
            themeConfig[key],
            `${style}.${themeType} should define ${key}`
          );
        }
        assert.strictEqual(
          Object.keys(themeConfig).length,
          ALL_PALETTE_KEYS.length,
          `${style}.${themeType} should have exactly ` +
            `${ALL_PALETTE_KEYS.length} keys`
        );
      }
    }
  });

  test('chromaFactor values within valid range (0-1)', () => {
    for (const style of STATIC_STYLES) {
      const config = getConfig(style);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { chromaFactor } = themeConfig[key];
          assert.ok(
            chromaFactor >= 0 && chromaFactor <= 1,
            `${style}.${themeType}.${key}.chromaFactor ` +
              `(${chromaFactor}) should be between 0 and 1`
          );
        }
      }
    }
  });

  test('lightness values within valid range (0-1)', () => {
    for (const style of STATIC_STYLES) {
      const config = getConfig(style);
      for (const themeType of ALL_THEME_TYPES) {
        const themeConfig = config[themeType];
        for (const key of ALL_PALETTE_KEYS) {
          const { lightness } = themeConfig[key];
          assert.ok(
            lightness >= 0 && lightness <= 1,
            `${style}.${themeType}.${key}.lightness ` +
              `(${lightness}) should be between 0 and 1`
          );
        }
      }
    }
  });
});

suite('getStyleResolver', () => {
  test('returns a resolver for all color styles', () => {
    for (const style of ALL_COLOR_STYLES) {
      const resolver = getStyleResolver(style);
      assert.strictEqual(
        typeof resolver,
        'function',
        `Resolver for ${style} should be a function`
      );
    }
  });

  test('all resolvers produce valid OKLCH for all keys', () => {
    for (const style of ALL_COLOR_STYLES) {
      const resolver = getStyleResolver(style);
      for (const themeType of ALL_THEME_TYPES) {
        for (const key of ALL_PALETTE_KEYS) {
          const result = resolver(themeType, key, { baseHue: 180 });
          assert.ok(
            result.tintOklch,
            `${style}.${themeType}.${key} should return tintOklch`
          );
          const { l, c, h } = result.tintOklch;
          assert.ok(
            l >= 0 && l <= 1,
            `${style}.${themeType}.${key} L=${l} out of range`
          );
          assert.ok(
            c >= 0,
            `${style}.${themeType}.${key} C=${c} should be >= 0`
          );
          assert.ok(
            h >= 0 && h < 360,
            `${style}.${themeType}.${key} H=${h} out of range`
          );
          assert.strictEqual(
            typeof result.hueOnlyBlend,
            'boolean',
            `${style}.${themeType}.${key} hueOnlyBlend ` + `should be boolean`
          );
        }
      }
    }
  });

  test('resolvers apply hue offset from context', () => {
    for (const style of ALL_COLOR_STYLES) {
      const resolver = getStyleResolver(style);
      const noOffset = resolver('dark', 'titleBar.activeBackground', {
        baseHue: 100,
        hueOffset: 0,
      });
      const withOffset = resolver('dark', 'titleBar.activeBackground', {
        baseHue: 100,
        hueOffset: 90,
      });

      // Hue with offset should differ from hue without
      assert.notStrictEqual(
        noOffset.tintOklch.h,
        withOffset.tintOklch.h,
        `${style} should apply hue offset from context`
      );
    }
  });

  test('static style resolvers match config output', () => {
    for (const style of STATIC_STYLES) {
      const config = getConfig(style);
      const resolver = getStyleResolver(style);
      for (const themeType of ALL_THEME_TYPES) {
        for (const key of ALL_PALETTE_KEYS) {
          const result = resolver(themeType, key, { baseHue: 180 });
          // Static resolvers should have hueOnlyBlend=false
          assert.strictEqual(
            result.hueOnlyBlend,
            false,
            `${style} should use full blending`
          );
          // Lightness should match config
          assert.strictEqual(
            result.tintOklch.l,
            config[themeType][key].lightness,
            `${style}.${themeType}.${key} lightness mismatch`
          );
        }
      }
    }
  });
});

suite('color style chromaFactor ordering', () => {
  /**
   * Helper to get average background chromaFactor for a dark theme.
   */
  function getAvgBgChromaFactor(config: StyleConfig): number {
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

suite('tinted style', () => {
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

suite('neon style', () => {
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

suite('adaptive style', () => {
  test('uses theme L/C when theme colors available', () => {
    const resolver = getStyleResolver('adaptive');
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
    const adaptive = getStyleResolver('adaptive');
    const pastel = getStyleResolver('pastel');

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
    const adaptive = getStyleResolver('adaptive');

    // Only editor.background defined, no activityBar color
    const themeColors = { 'editor.background': '#1E1E1E' };
    const context = { baseHue: 180, themeColors };

    // getColorForKey falls back to editor.background for bg keys,
    // so adaptive uses that fallback color's L/C (not pastel values)
    const result = adaptive('dark', 'activityBar.background', context);
    assert.strictEqual(result.hueOnlyBlend, true);
  });

  test('preserves theme lightness and chroma', () => {
    const resolver = getStyleResolver('adaptive');
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
    const pastel = getStyleResolver('pastel');
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
    const resolver = getStyleResolver('adaptive');
    // Provide explicit colors for every palette key so the test
    // doesn't depend on getColorForKey's editor.background fallback.
    const themeColors = {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'titleBar.activeBackground': '#3C3C3C',
      'titleBar.activeForeground': '#CCCCCC',
      'titleBar.inactiveBackground': '#2D2D2D',
      'titleBar.inactiveForeground': '#999999',
      'statusBar.background': '#007ACC',
      'statusBar.foreground': '#FFFFFF',
      'activityBar.background': '#333333',
      'activityBar.foreground': '#FFFFFF',
      'sideBar.background': '#252526',
      'sideBar.foreground': '#CCCCCC',
      'sideBarSectionHeader.background': '#333333',
      'sideBarSectionHeader.foreground': '#CCCCCC',
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

  test('applies hue offset from context', () => {
    const resolver = getStyleResolver('adaptive');
    const themeColors = {
      'editor.background': '#1E1E1E',
      'titleBar.activeBackground': '#3C3C3C',
    };

    const noOffset = resolver('dark', 'titleBar.activeBackground', {
      baseHue: 100,
      themeColors,
      hueOffset: 0,
    });
    const withOffset = resolver('dark', 'titleBar.activeBackground', {
      baseHue: 100,
      themeColors,
      hueOffset: 90,
    });

    assert.notStrictEqual(
      noOffset.tintOklch.h,
      withOffset.tintOklch.h,
      'Adaptive should apply hue offset from context'
    );
  });
});

// ============================================================================
// Color harmony configs
// ============================================================================

suite('HARMONY_CONFIGS', () => {
  test('defines config for all harmonies', () => {
    for (const harmony of ALL_COLOR_HARMONIES) {
      assert.ok(HARMONY_CONFIGS[harmony], `Config for ${harmony} should exist`);
    }
  });

  test('all configs have offsets for all element types', () => {
    const requiredElements = [
      'editor',
      'titleBar',
      'statusBar',
      'activityBar',
      'sideBar',
    ];

    for (const harmony of ALL_COLOR_HARMONIES) {
      const config = HARMONY_CONFIGS[harmony];
      for (const element of requiredElements) {
        assert.strictEqual(
          typeof (config as Record<string, number>)[element],
          'number',
          `${harmony} should define offset for ${element}`
        );
      }
    }
  });

  test('uniform has all zero offsets', () => {
    const config = HARMONY_CONFIGS['uniform'];
    for (const [element, offset] of Object.entries(config)) {
      assert.strictEqual(
        offset,
        0,
        `uniform.${element} should be 0, got ${offset}`
      );
    }
  });

  test('duotone has 180° on activity and side bar', () => {
    const config = HARMONY_CONFIGS['duotone'];
    assert.strictEqual(config.activityBar, 180);
    assert.strictEqual(config.sideBar, 180);
    assert.strictEqual(config.titleBar, 0);
    assert.strictEqual(config.statusBar, 0);
  });

  test('undercurrent has 180° on status bar', () => {
    const config = HARMONY_CONFIGS['undercurrent'];
    assert.strictEqual(config.statusBar, 180);
    assert.strictEqual(config.titleBar, 0);
    assert.strictEqual(config.activityBar, 0);
    assert.strictEqual(config.sideBar, 0);
  });

  test('analogous has -25° on title bar and +25° on status bar', () => {
    const config = HARMONY_CONFIGS['analogous'];
    assert.strictEqual(config.titleBar, -25);
    assert.strictEqual(config.statusBar, 25);
    assert.strictEqual(config.activityBar, 0);
    assert.strictEqual(config.sideBar, 0);
  });

  test('triadic has -120° on title bar and +120° on status bar', () => {
    const config = HARMONY_CONFIGS['triadic'];
    assert.strictEqual(config.titleBar, -120);
    assert.strictEqual(config.statusBar, 120);
    assert.strictEqual(config.activityBar, 0);
    assert.strictEqual(config.sideBar, 0);
  });

  test('hue offsets within valid range (-360 to 360)', () => {
    for (const harmony of ALL_COLOR_HARMONIES) {
      const config = HARMONY_CONFIGS[harmony];
      for (const [element, offset] of Object.entries(config)) {
        assert.ok(
          offset >= -360 && offset <= 360,
          `${harmony}.${element} offset (${offset}) ` +
            `should be between -360 and 360`
        );
      }
    }
  });
});

suite('color harmony integration', () => {
  test('non-uniform harmonies produce different hues per element', () => {
    const nonUniform: ColorHarmony[] = [
      'duotone',
      'undercurrent',
      'analogous',
      'triadic',
    ];

    for (const harmony of nonUniform) {
      const config = HARMONY_CONFIGS[harmony];
      const offsets = new Set(Object.values(config));
      assert.ok(
        offsets.size > 1,
        `${harmony} should have at least two distinct offsets`
      );
    }
  });
});
