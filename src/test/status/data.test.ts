import * as assert from 'assert';
import { computeBaseHue, computeStatusColors } from '../../status/data';
import type { ComputeStatusColorsOptions } from '../../status/data';
import type { TintTarget } from '../../config';
import type { ThemeType, ThemeColors } from '../../theme';
import { COLOR_KEY_DEFINITIONS, PATINA_MANAGED_KEYS } from '../../theme';

const ALL_TARGETS: TintTarget[] = ['titleBar', 'statusBar', 'activityBar'];

function makeColorsOptions(
  overrides: Partial<ComputeStatusColorsOptions> = {}
): ComputeStatusColorsOptions {
  return {
    baseHue: 180,
    colorScheme: 'pastel',
    themeType: 'dark',
    themeColors: undefined,
    blendFactor: 0.35,
    targets: ALL_TARGETS,
    ...overrides,
  };
}

suite('computeBaseHue', () => {
  test('is deterministic for same identifier and seed', () => {
    const h1 = computeBaseHue('my-project', 0);
    const h2 = computeBaseHue('my-project', 0);
    assert.strictEqual(h1, h2);
  });

  test('seed=0 is the same as no seed shift', () => {
    const h1 = computeBaseHue('my-project', 0);
    const h2 = computeBaseHue('my-project', 0);
    assert.strictEqual(h1, h2);
  });

  test('different seeds produce different hues', () => {
    const h1 = computeBaseHue('my-project', 0);
    const h2 = computeBaseHue('my-project', 42);
    assert.notStrictEqual(h1, h2);
  });

  test('result is in 0-359 range', () => {
    const identifiers = [
      'project-a',
      'project-b',
      'some/long/path/to/workspace',
      '',
      'x',
    ];
    const seeds = [0, 1, 42, -100, 999999999];

    for (const id of identifiers) {
      for (const seed of seeds) {
        const hue = computeBaseHue(id, seed);
        assert.ok(
          hue >= 0 && hue < 360,
          `Hue ${hue} for "${id}" seed=${seed} out of range`
        );
      }
    }
  });

  test('different identifiers produce different hues', () => {
    const h1 = computeBaseHue('project-a', 0);
    const h2 = computeBaseHue('project-b', 0);
    assert.notStrictEqual(h1, h2);
  });

  test('handles empty string identifier', () => {
    const hue = computeBaseHue('', 0);
    assert.ok(hue >= 0 && hue < 360);
  });

  test('handles unicode identifiers', () => {
    const hue = computeBaseHue('プロジェクト', 0);
    assert.ok(hue >= 0 && hue < 360);
  });

  test('handles negative seeds', () => {
    const hue = computeBaseHue('test', -100);
    assert.ok(hue >= 0 && hue < 360);
  });

  test('handles large seeds', () => {
    const hue = computeBaseHue('test', 999999999);
    assert.ok(hue >= 0 && hue < 360);
  });
});

suite('computeStatusColors', () => {
  const hexPattern = /^#[0-9a-f]{6}$/i;

  test('returns 8 StatusColorDetail entries', () => {
    const colors = computeStatusColors(makeColorsOptions());
    assert.strictEqual(colors.length, 8);
  });

  test('all hex values are valid format', () => {
    const colors = computeStatusColors(makeColorsOptions());

    for (const color of colors) {
      assert.match(
        color.tintColor,
        hexPattern,
        `Invalid tint hex for ${color.key}: ${color.tintColor}`
      );
      assert.match(
        color.finalColor,
        hexPattern,
        `Invalid final hex for ${color.key}: ${color.finalColor}`
      );
      if (color.themeColor !== undefined) {
        assert.match(
          color.themeColor,
          hexPattern,
          `Invalid theme hex for ${color.key}: ${color.themeColor}`
        );
      }
    }
  });

  test('without themeColors: tintColor === finalColor', () => {
    const colors = computeStatusColors(
      makeColorsOptions({ themeColors: undefined })
    );

    for (const color of colors) {
      assert.strictEqual(
        color.tintColor,
        color.finalColor,
        `${color.key}: tint and final should match without theme`
      );
    }
  });

  test('without themeColors: themeColor is undefined', () => {
    const colors = computeStatusColors(
      makeColorsOptions({ themeColors: undefined })
    );

    for (const color of colors) {
      assert.strictEqual(
        color.themeColor,
        undefined,
        `${color.key}: themeColor should be undefined`
      );
    }
  });

  test('with themeColors: themeColor populated for keys', () => {
    const themeColors: ThemeColors = {
      'editor.background': '#282C34',
      'titleBar.activeBackground': '#21252B',
      'statusBar.background': '#21252B',
    };
    const colors = computeStatusColors(makeColorsOptions({ themeColors }));

    // titleBar.activeBackground should get a theme color
    const titleBg = colors.find((c) => c.key === 'titleBar.activeBackground')!;
    assert.ok(
      titleBg.themeColor !== undefined,
      'titleBar.activeBackground should have a themeColor'
    );

    // statusBar.background should get a theme color
    const statusBg = colors.find((c) => c.key === 'statusBar.background')!;
    assert.ok(
      statusBg.themeColor !== undefined,
      'statusBar.background should have a themeColor'
    );
  });

  test('blendFactor=0: tintColor === finalColor even with theme', () => {
    const themeColors: ThemeColors = {
      'editor.background': '#282C34',
    };
    const colors = computeStatusColors(
      makeColorsOptions({
        themeColors,
        blendFactor: 0,
      })
    );

    for (const color of colors) {
      assert.strictEqual(
        color.tintColor,
        color.finalColor,
        `${color.key}: tint and final should match at blend=0`
      );
    }
  });

  test('blendFactor>0 with theme: finalColor differs from tint', () => {
    const themeColors: ThemeColors = {
      'editor.background': '#FF0000',
    };
    const colors = computeStatusColors(
      makeColorsOptions({
        themeColors,
        blendFactor: 0.5,
      })
    );

    // At least background keys should differ
    const bgKeys = colors.filter((c) => c.colorType === 'background');
    const anyDifferent = bgKeys.some((c) => c.tintColor !== c.finalColor);
    assert.ok(
      anyDifferent,
      'At least one background color should differ with blending'
    );
  });

  test('enabled is true only for keys matching targets', () => {
    const colors = computeStatusColors(
      makeColorsOptions({ targets: ['titleBar'] })
    );

    for (const color of colors) {
      if (color.element === 'titleBar') {
        assert.ok(
          color.enabled,
          `${color.key}: should be enabled for titleBar target`
        );
      } else {
        assert.ok(
          !color.enabled,
          `${color.key}: should be disabled (not in targets)`
        );
      }
    }
  });

  test('enabled is true for all when all targets active', () => {
    const colors = computeStatusColors(
      makeColorsOptions({ targets: ALL_TARGETS })
    );

    for (const color of colors) {
      assert.ok(
        color.enabled,
        `${color.key}: should be enabled with all targets`
      );
    }
  });

  test('enabled is false for all when no targets', () => {
    const colors = computeStatusColors(makeColorsOptions({ targets: [] }));

    for (const color of colors) {
      assert.ok(
        !color.enabled,
        `${color.key}: should be disabled with no targets`
      );
    }
  });

  test('element and colorType match COLOR_KEY_DEFINITIONS', () => {
    const colors = computeStatusColors(makeColorsOptions());

    for (const color of colors) {
      const def = COLOR_KEY_DEFINITIONS[color.key];
      assert.strictEqual(
        color.element,
        def.element,
        `${color.key}: element mismatch`
      );
      assert.strictEqual(
        color.colorType,
        def.colorType,
        `${color.key}: colorType mismatch`
      );
    }
  });

  test('keys match PATINA_MANAGED_KEYS', () => {
    const colors = computeStatusColors(makeColorsOptions());
    const keys = colors.map((c) => c.key);
    assert.deepStrictEqual(
      keys,
      PATINA_MANAGED_KEYS,
      'Keys should match PATINA_MANAGED_KEYS order'
    );
  });

  test('works with all theme types', () => {
    const themeTypes: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

    for (const themeType of themeTypes) {
      const colors = computeStatusColors(makeColorsOptions({ themeType }));
      assert.strictEqual(
        colors.length,
        8,
        `Should return 8 colors for ${themeType}`
      );

      for (const color of colors) {
        assert.match(
          color.tintColor,
          hexPattern,
          `Invalid tint hex for ${color.key} in ${themeType}`
        );
      }
    }
  });

  test('works with all color schemes', () => {
    const schemes = [
      'pastel',
      'vibrant',
      'muted',
      'tinted',
      'duotone',
      'undercurrent',
      'analogous',
      'neon',
    ] as const;

    for (const colorScheme of schemes) {
      const colors = computeStatusColors(makeColorsOptions({ colorScheme }));
      assert.strictEqual(
        colors.length,
        8,
        `Should return 8 colors for ${colorScheme}`
      );
    }
  });

  test('is deterministic', () => {
    const opts = makeColorsOptions();
    const c1 = computeStatusColors(opts);
    const c2 = computeStatusColors(opts);

    for (let i = 0; i < c1.length; i++) {
      assert.strictEqual(c1[i].tintColor, c2[i].tintColor);
      assert.strictEqual(c1[i].finalColor, c2[i].finalColor);
    }
  });

  test('per-target blend factor overrides change specific elements', () => {
    const themeColors: ThemeColors = {
      'editor.background': '#282C34',
    };
    const colorsDefault = computeStatusColors(
      makeColorsOptions({
        themeColors,
        blendFactor: 0.35,
      })
    );
    const colorsOverride = computeStatusColors(
      makeColorsOptions({
        themeColors,
        blendFactor: 0.35,
        targetBlendFactors: { statusBar: 0.8 },
      })
    );

    // titleBar should be unchanged (no override)
    const titleBgDefault = colorsDefault.find(
      (c) => c.key === 'titleBar.activeBackground'
    )!;
    const titleBgOverride = colorsOverride.find(
      (c) => c.key === 'titleBar.activeBackground'
    )!;
    assert.strictEqual(
      titleBgDefault.finalColor,
      titleBgOverride.finalColor,
      'titleBar should use default blend factor'
    );

    // statusBar should differ (override to 0.8)
    const statusBgDefault = colorsDefault.find(
      (c) => c.key === 'statusBar.background'
    )!;
    const statusBgOverride = colorsOverride.find(
      (c) => c.key === 'statusBar.background'
    )!;
    assert.notStrictEqual(
      statusBgDefault.finalColor,
      statusBgOverride.finalColor,
      'statusBar should use overridden blend factor'
    );
  });

  test('per-target blend factors fall back to default', () => {
    const themeColors: ThemeColors = {
      'editor.background': '#282C34',
    };
    const colorsDefault = computeStatusColors(
      makeColorsOptions({
        themeColors,
        blendFactor: 0.35,
      })
    );
    const colorsEmpty = computeStatusColors(
      makeColorsOptions({
        themeColors,
        blendFactor: 0.35,
        targetBlendFactors: {},
      })
    );

    for (let i = 0; i < colorsDefault.length; i++) {
      assert.strictEqual(
        colorsDefault[i].finalColor,
        colorsEmpty[i].finalColor,
        `${colorsDefault[i].key}: empty overrides should match default`
      );
    }
  });
});
