import * as assert from 'assert';
import {
  computeBaseHue,
  applyHueOffset,
  computeBaseTintHex,
  computeTint,
  tintResultToPalette,
  tintResultToStatusBarColors,
} from '../../color/tint';
import { hexToOklch } from '../../color/convert';
import type { ColorHarmony, ColorStyle } from '../../config';
import type { ThemeColors, ThemeType } from '../../theme';
import { PATINA_MANAGED_KEYS, EXCLUDE_WHEN_UNDEFINED_KEYS } from '../../theme';
import { ALL_TARGETS } from '../helpers';

// ============================================================================
// computeBaseHue
// ============================================================================

suite('computeBaseHue', () => {
  test('returns deterministic result for same inputs', () => {
    const a = computeBaseHue('my-project', 0);
    const b = computeBaseHue('my-project', 0);
    assert.strictEqual(a, b);
  });

  test('returns value in 0-359 range', () => {
    const identifiers = [
      'a',
      'project',
      '/home/user/workspace',
      '项目',
      '',
      'a-very-long-workspace-identifier-name',
    ];
    for (const id of identifiers) {
      for (const seed of [0, 1, 42, 999999999, -100]) {
        const hue = computeBaseHue(id, seed);
        assert.ok(
          hue >= 0 && hue < 360,
          `Hue ${hue} for "${id}" seed=${seed} out of range`
        );
      }
    }
  });

  test('different identifiers produce different hues', () => {
    const a = computeBaseHue('project-a', 0);
    const b = computeBaseHue('project-b', 0);
    assert.notStrictEqual(a, b);
  });

  test('seed shifts the hue', () => {
    const a = computeBaseHue('my-project', 0);
    const b = computeBaseHue('my-project', 42);
    assert.notStrictEqual(a, b);
  });

  test('seed=0 produces same as no XOR (seedHash=0)', () => {
    const a = computeBaseHue('test', 0);
    const b = computeBaseHue('test', 0);
    assert.strictEqual(a, b);
  });

  test('handles unicode identifiers', () => {
    const hue = computeBaseHue('日本語プロジェクト', 0);
    assert.ok(hue >= 0 && hue < 360);
  });

  test('handles empty string', () => {
    const hue = computeBaseHue('', 0);
    assert.ok(hue >= 0 && hue < 360);
  });
});

// ============================================================================
// applyHueOffset
// ============================================================================

suite('applyHueOffset', () => {
  test('returns hue unchanged when offset is undefined', () => {
    assert.strictEqual(applyHueOffset(180, undefined), 180);
  });

  test('returns hue unchanged when offset is 0', () => {
    assert.strictEqual(applyHueOffset(180, 0), 180);
  });

  test('adds positive offset', () => {
    assert.strictEqual(applyHueOffset(100, 50), 150);
  });

  test('wraps past 360', () => {
    assert.strictEqual(applyHueOffset(350, 20), 10);
  });

  test('wraps at exactly 360 to 0', () => {
    assert.strictEqual(applyHueOffset(180, 180), 0);
  });

  test('handles negative offset', () => {
    const result = applyHueOffset(10, -30);
    assert.strictEqual(result, 340);
  });

  test('handles large positive offset', () => {
    const result = applyHueOffset(0, 720);
    assert.strictEqual(result, 0);
  });

  test('handles zero hue with offset', () => {
    assert.strictEqual(applyHueOffset(0, 90), 90);
  });
});

// ============================================================================
// computeBaseTintHex
// ============================================================================

suite('computeBaseTintHex', () => {
  const hexPattern = /^#[0-9a-f]{6}$/i;

  test('returns valid hex color', () => {
    assert.match(computeBaseTintHex(180, 'dark'), hexPattern);
    assert.match(computeBaseTintHex(0, 'light'), hexPattern);
  });

  test('light theme produces lighter color than dark', () => {
    const hue = 200;
    const darkLum = hexToLuminance(computeBaseTintHex(hue, 'dark'));
    const lightLum = hexToLuminance(computeBaseTintHex(hue, 'light'));
    assert.ok(
      lightLum > darkLum,
      `Light (${lightLum}) should be brighter than dark (${darkLum})`
    );
  });

  test('deterministic for same inputs', () => {
    const a = computeBaseTintHex(100, 'dark');
    const b = computeBaseTintHex(100, 'dark');
    assert.strictEqual(a, b);
  });
});

// ============================================================================
// computeTint
// ============================================================================

suite('computeTint', () => {
  test('throws when neither baseHue nor workspaceIdentifier provided', () => {
    assert.throws(
      () => computeTint({ targets: ALL_TARGETS, themeType: 'dark' }),
      /requires either baseHue or workspaceIdentifier/
    );
  });

  test('computes all 19 keys regardless of targets', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ['titleBar'],
      themeType: 'dark',
    });
    assert.strictEqual(result.keys.length, 19);
  });

  test('enabled flag matches targets', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ['statusBar'],
      themeType: 'dark',
    });

    for (const detail of result.keys) {
      if (detail.element === 'statusBar') {
        assert.ok(detail.enabled, `${detail.key} should be enabled`);
      } else {
        assert.ok(!detail.enabled, `${detail.key} should be disabled`);
      }
    }
  });

  test('all keys produce valid hex colors', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    const result = computeTint({
      workspaceIdentifier: 'test-project',
      targets: ALL_TARGETS,
      themeType: 'dark',
    });

    assert.match(result.baseTintHex, hexPattern);
    for (const detail of result.keys) {
      assert.match(
        detail.tintHex,
        hexPattern,
        `Invalid tintHex for ${detail.key}`
      );
      assert.match(
        detail.finalHex,
        hexPattern,
        `Invalid finalHex for ${detail.key}`
      );
    }
  });

  test('baseHue matches computeBaseHue', () => {
    const result = computeTint({
      workspaceIdentifier: 'my-project',
      targets: ALL_TARGETS,
      themeType: 'dark',
      seed: 42,
    });
    const expected = computeBaseHue('my-project', 42);
    assert.strictEqual(result.baseHue, expected);
  });

  test('accepts pre-computed baseHue', () => {
    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
    });
    assert.strictEqual(result.baseHue, 200);
  });

  test('prefers baseHue over workspaceIdentifier when both given', () => {
    const result = computeTint({
      baseHue: 200,
      workspaceIdentifier: 'will-be-ignored',
      targets: ALL_TARGETS,
      themeType: 'dark',
    });
    assert.strictEqual(result.baseHue, 200);
  });

  test('without theme colors, tintHex equals finalHex', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
    });
    for (const detail of result.keys) {
      assert.strictEqual(
        detail.tintHex,
        detail.finalHex,
        `${detail.key}: tint and final should match without theme`
      );
      assert.strictEqual(detail.themeColor, undefined);
    }
  });

  test('with theme colors, finalHex differs from tintHex', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors: { 'editor.background': '#282C34' },
      themeBlendFactor: 0.35,
    });

    // At least some keys should differ
    const diffCount = result.keys.filter(
      (d) => d.tintHex !== d.finalHex
    ).length;
    assert.ok(
      diffCount > 0,
      'Some keys should have different tint vs final with blending'
    );
  });

  test('blendFactor=0 produces tintHex === finalHex', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors: { 'editor.background': '#282C34' },
      themeBlendFactor: 0,
    });
    for (const detail of result.keys) {
      assert.strictEqual(
        detail.tintHex,
        detail.finalHex,
        `${detail.key}: should match at blend=0`
      );
    }
  });

  test('per-target blend factor overrides', () => {
    const base = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors: { 'editor.background': '#282C34' },
      themeBlendFactor: 0.35,
    });

    const overridden = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors: { 'editor.background': '#282C34' },
      themeBlendFactor: 0.35,
      targetBlendFactors: { statusBar: 0.8 },
    });

    // titleBar should be same (no override)
    const baseTb = base.keys.find(
      (k) => k.key === 'titleBar.activeBackground'
    )!;
    const overTb = overridden.keys.find(
      (k) => k.key === 'titleBar.activeBackground'
    )!;
    assert.strictEqual(baseTb.finalHex, overTb.finalHex);

    // statusBar should differ (override)
    const baseSb = base.keys.find((k) => k.key === 'statusBar.background')!;
    const overSb = overridden.keys.find(
      (k) => k.key === 'statusBar.background'
    )!;
    assert.notStrictEqual(baseSb.finalHex, overSb.finalHex);
  });

  test('works with all theme types', () => {
    const themeTypes: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const tt of themeTypes) {
      const result = computeTint({
        workspaceIdentifier: 'test',
        targets: ALL_TARGETS,
        themeType: tt,
      });
      for (const detail of result.keys) {
        assert.match(
          detail.finalHex,
          hexPattern,
          `Invalid hex for ${detail.key} in ${tt}`
        );
      }
    }
  });

  test('works with all color styles', () => {
    const styles: ColorStyle[] = [
      'pastel',
      'vibrant',
      'muted',
      'tinted',
      'neon',
      'adaptive',
    ];
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const style of styles) {
      const result = computeTint({
        workspaceIdentifier: 'test',
        targets: ALL_TARGETS,
        themeType: 'dark',
        colorStyle: style,
      });
      for (const detail of result.keys) {
        assert.match(
          detail.finalHex,
          hexPattern,
          `Invalid hex for ${detail.key} in ${style}`
        );
      }
    }
  });

  test('works with all color harmonies', () => {
    const harmonies: ColorHarmony[] = [
      'uniform',
      'duotone',
      'undercurrent',
      'analogous',
      'triadic',
    ];
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const harmony of harmonies) {
      const result = computeTint({
        workspaceIdentifier: 'test',
        targets: ALL_TARGETS,
        themeType: 'dark',
        colorHarmony: harmony,
      });
      for (const detail of result.keys) {
        assert.match(
          detail.finalHex,
          hexPattern,
          `Invalid hex for ${detail.key} in harmony ${harmony}`
        );
      }
    }
  });

  test('non-uniform harmony produces different hues for different elements', () => {
    const result = computeTint({
      baseHue: 100,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorHarmony: 'duotone',
    });

    const titleBarBg = result.keys.find(
      (k) => k.key === 'titleBar.activeBackground'
    )!;
    const activityBarBg = result.keys.find(
      (k) => k.key === 'activityBar.background'
    )!;

    // Duotone: titleBar=0°, activityBar=180° — hues should differ
    const titleBarHue = hexToOklch(titleBarBg.tintHex).h;
    const activityBarHue = hexToOklch(activityBarBg.tintHex).h;

    assert.notStrictEqual(
      Math.round(titleBarHue),
      Math.round(activityBarHue),
      'Duotone should produce different hues for titleBar vs activityBar'
    );
  });

  test('deterministic for same inputs', () => {
    const opts = {
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark' as ThemeType,
      seed: 42,
    };
    const a = computeTint(opts);
    const b = computeTint(opts);
    assert.deepStrictEqual(a, b);
  });

  test('seed changes output', () => {
    const a = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      seed: 0,
    });
    const b = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      seed: 42,
    });
    assert.notStrictEqual(a.baseHue, b.baseHue);
  });

  test('blendFactor stored per-key', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeBlendFactor: 0.35,
      targetBlendFactors: { statusBar: 0.8 },
    });

    for (const detail of result.keys) {
      if (detail.element === 'statusBar') {
        assert.strictEqual(detail.blendFactor, 0.8);
      } else {
        assert.strictEqual(detail.blendFactor, 0.35);
      }
    }
  });

  test('all PATINA_MANAGED_KEYS are represented', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
    });
    const resultKeys = result.keys.map((d) => d.key);
    for (const key of PATINA_MANAGED_KEYS) {
      assert.ok(resultKeys.includes(key), `Missing key: ${key}`);
    }
  });
});

// ============================================================================
// computeTint — excluded flag
// ============================================================================

suite('computeTint excluded flag', () => {
  const excludedKeys = [...EXCLUDE_WHEN_UNDEFINED_KEYS];

  test('excluded=false when theme defines the key directly', () => {
    const themeColors: ThemeColors = {
      'editor.background': '#282C34',
      'titleBar.border': '#181A1F',
      'statusBar.border': '#181A1F',
      'statusBar.focusBorder': '#181A1F',
      'activityBar.activeBackground': '#2C313A',
      'activityBar.activeBorder': '#528BFF',
      'sideBar.border': '#181A1F',
      'sideBarSectionHeader.border': '#181A1F',
    };

    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors,
    });

    for (const detail of result.keys) {
      if (EXCLUDE_WHEN_UNDEFINED_KEYS.has(detail.key)) {
        assert.strictEqual(
          detail.excluded,
          false,
          `${detail.key} should not be excluded when theme defines it`
        );
      }
    }
  });

  test('excluded=true when theme does not define the key', () => {
    // Only editor.background, no border/active keys
    const themeColors: ThemeColors = {
      'editor.background': '#282C34',
    };

    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors,
    });

    for (const detail of result.keys) {
      if (EXCLUDE_WHEN_UNDEFINED_KEYS.has(detail.key)) {
        assert.strictEqual(
          detail.excluded,
          true,
          `${detail.key} should be excluded when theme omits it`
        );
      }
    }
  });

  test('excluded=true for all 7 keys when themeColors is undefined', () => {
    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
    });

    const excludedDetails = result.keys.filter((d) => d.excluded);
    assert.strictEqual(
      excludedDetails.length,
      excludedKeys.length,
      `Expected ${excludedKeys.length} excluded keys`
    );
    for (const detail of excludedDetails) {
      assert.ok(
        EXCLUDE_WHEN_UNDEFINED_KEYS.has(detail.key),
        `${detail.key} should be in EXCLUDE_WHEN_UNDEFINED_KEYS`
      );
    }
  });

  test('non-excluded keys are never excluded', () => {
    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
    });

    for (const detail of result.keys) {
      if (!EXCLUDE_WHEN_UNDEFINED_KEYS.has(detail.key)) {
        assert.strictEqual(
          detail.excluded,
          false,
          `${detail.key} should never be excluded`
        );
      }
    }
  });
});

// ============================================================================
// tintResultToPalette
// ============================================================================

suite('tintResultToPalette', () => {
  test('includes enabled, non-excluded keys', () => {
    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors: {
        'editor.background': '#282C34',
        'titleBar.border': '#181A1F',
        'statusBar.border': '#181A1F',
        'statusBar.focusBorder': '#181A1F',
        'activityBar.activeBackground': '#2C313A',
        'activityBar.activeBorder': '#528BFF',
        'sideBar.border': '#181A1F',
        'sideBarSectionHeader.border': '#181A1F',
      },
    });

    const palette = tintResultToPalette(result);

    // All managed keys except editor.* should be present
    for (const key of PATINA_MANAGED_KEYS) {
      assert.ok(
        key in palette,
        `${key} should be in palette when theme defines it`
      );
    }
  });

  test('excludes keys when theme does not define them', () => {
    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
      themeColors: { 'editor.background': '#282C34' },
    });

    const palette = tintResultToPalette(result);

    for (const key of EXCLUDE_WHEN_UNDEFINED_KEYS) {
      assert.ok(!(key in palette), `${key} should be excluded from palette`);
    }

    // Non-excluded keys should still be present
    for (const key of PATINA_MANAGED_KEYS) {
      if (!EXCLUDE_WHEN_UNDEFINED_KEYS.has(key)) {
        assert.ok(key in palette, `${key} should still be in palette`);
      }
    }
  });

  test('excludes keys when themeColors is undefined', () => {
    const result = computeTint({
      baseHue: 200,
      targets: ALL_TARGETS,
      themeType: 'dark',
    });

    const palette = tintResultToPalette(result);

    for (const key of EXCLUDE_WHEN_UNDEFINED_KEYS) {
      assert.ok(
        !(key in palette),
        `${key} should be excluded when theme unknown`
      );
    }
  });

  test('disabled keys are still excluded', () => {
    const result = computeTint({
      baseHue: 200,
      targets: [], // nothing enabled
      themeType: 'dark',
    });

    const palette = tintResultToPalette(result);
    assert.deepStrictEqual(
      palette,
      {},
      'No keys should be in palette when all disabled'
    );
  });
});

// ============================================================================
// tintResultToStatusBarColors
// ============================================================================

suite('tintResultToStatusBarColors', () => {
  test('extracts baseTint', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
    });
    const colors = tintResultToStatusBarColors(result);
    assert.strictEqual(colors.baseTint, result.baseTintHex);
  });

  test('extracts background colors for enabled targets', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ALL_TARGETS,
      themeType: 'dark',
    });
    const colors = tintResultToStatusBarColors(result);

    const tbBg = result.keys.find(
      (k) => k.key === 'titleBar.activeBackground'
    )!;
    const sbBg = result.keys.find((k) => k.key === 'statusBar.background')!;
    const abBg = result.keys.find((k) => k.key === 'activityBar.background')!;
    const sideBg = result.keys.find((k) => k.key === 'sideBar.background')!;

    assert.strictEqual(colors.titleBar, tbBg.finalHex);
    assert.strictEqual(colors.statusBar, sbBg.finalHex);
    assert.strictEqual(colors.activityBar, abBg.finalHex);
    assert.strictEqual(colors.sideBar, sideBg.finalHex);
  });

  test('omits disabled targets', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ['titleBar'],
      themeType: 'dark',
    });
    const colors = tintResultToStatusBarColors(result);

    assert.ok(colors.titleBar !== undefined);
    assert.strictEqual(colors.statusBar, undefined);
    assert.strictEqual(colors.activityBar, undefined);
    assert.strictEqual(colors.sideBar, undefined);
  });
});

// ============================================================================
// Helpers
// ============================================================================

/**
 * Simple luminance calculation from hex color.
 */
function hexToLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
