import * as assert from 'assert';
import {
  computeBaseHue,
  applyHueOffset,
  computeBaseTintHex,
  computeTint,
  tintResultToStatusBarColors,
} from '../../color/tint';
import { hexToOklch, oklchToHex, maxChroma } from '../../color/convert';
import { getHueBlendDirection } from '../../color/blend';
import type { ColorScheme } from '../../config';
import type { ThemeColors, ThemeType } from '../../theme';
import { PATINA_MANAGED_KEYS } from '../../theme';
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

  test('computes all 12 keys regardless of targets', () => {
    const result = computeTint({
      workspaceIdentifier: 'test',
      targets: ['titleBar'],
      themeType: 'dark',
    });
    assert.strictEqual(result.keys.length, 12);
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

  test('works with all color schemes', () => {
    const schemes: ColorScheme[] = [
      'pastel',
      'vibrant',
      'muted',
      'tinted',
      'duotone',
      'undercurrent',
      'analogous',
      'neon',
      'adaptive',
    ];
    const hexPattern = /^#[0-9a-f]{6}$/i;

    for (const scheme of schemes) {
      const result = computeTint({
        workspaceIdentifier: 'test',
        targets: ALL_TARGETS,
        themeType: 'dark',
        colorScheme: scheme,
      });
      for (const detail of result.keys) {
        assert.match(
          detail.finalHex,
          hexPattern,
          `Invalid hex for ${detail.key} in ${scheme}`
        );
      }
    }
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
// Hue direction harmonization
// ============================================================================

suite('computeTint hue harmonization', () => {
  // One Dark Pro theme colors that trigger the split-direction bug:
  // #21252B (sidebar/statusBar) has hue ~258° and #282C34 (titleBar/
  // activityBar) has hue ~264°. With a base hue of 83° the hue
  // diff straddles the 180° boundary, causing opposite blend
  // directions without harmonization.
  const oneDarkProColors: ThemeColors = {
    'editor.background': '#282C34',
    'titleBar.activeBackground': '#282C34',
    'titleBar.activeForeground': '#9DA5B4',
    'titleBar.inactiveBackground': '#282C34',
    'titleBar.inactiveForeground': '#6B717D',
    'activityBar.background': '#282C34',
    'activityBar.foreground': '#D7DAE0',
    'statusBar.background': '#21252B',
    'statusBar.foreground': '#9DA5B4',
    'sideBar.background': '#21252B',
    'sideBar.foreground': '#ABB2BF',
    'sideBarSectionHeader.background': '#282C34',
    'sideBarSectionHeader.foreground': '#ABB2BF',
  };

  /**
   * Helper: extract hue from a hex color string.
   */
  function hueOf(hex: string): number {
    return hexToOklch(hex).h;
  }

  /**
   * Helper: normalize a hue difference to (-180, 180].
   */
  function hueDiff(a: number, b: number): number {
    let d = b - a;
    if (d > 180) d -= 360;
    else if (d <= -180) d += 360;
    return d;
  }

  test('background hues are harmonized (One Dark Pro + hue 83)', () => {
    const result = computeTint({
      baseHue: 83,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorScheme: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
    });

    const bgKeys = result.keys.filter(
      (k) => k.colorType === 'background' && k.themeColor
    );

    // All background hues should be within 30° of each other
    const hues = bgKeys.map((k) => hueOf(k.finalHex));
    for (let i = 1; i < hues.length; i++) {
      const diff = Math.abs(hueDiff(hues[0], hues[i]));
      assert.ok(
        diff < 30,
        `Background hues too far apart: ${bgKeys[0].key} ` +
          `(${hues[0].toFixed(1)}°) vs ${bgKeys[i].key} ` +
          `(${hues[i].toFixed(1)}°), diff=${diff.toFixed(1)}°`
      );
    }
  });

  test('foreground hues follow their background direction', () => {
    const result = computeTint({
      baseHue: 83,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorScheme: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
    });

    // For each element, its fg/bg should be in similar hue range
    const elements = ['titleBar', 'statusBar', 'activityBar', 'sideBar'];
    for (const el of elements) {
      const bgs = result.keys.filter(
        (k) => k.element === el && k.colorType === 'background'
      );
      const fgs = result.keys.filter(
        (k) => k.element === el && k.colorType === 'foreground' && k.themeColor
      );

      if (bgs.length === 0 || fgs.length === 0) continue;

      const bgHue = hueOf(bgs[0].finalHex);
      for (const fg of fgs) {
        const fgHue = hueOf(fg.finalHex);
        const diff = Math.abs(hueDiff(bgHue, fgHue));
        // Foregrounds have low chroma so hue can wobble, but
        // with harmonization they should stay within 60°.
        assert.ok(
          diff < 60,
          `${el} fg/bg hue mismatch: bg=${bgHue.toFixed(1)}° ` +
            `fg=${fgHue.toFixed(1)}° diff=${diff.toFixed(1)}°`
        );
      }
    }
  });

  test('no-op when theme colors are absent', () => {
    // Without theme colors, harmonization has nothing to do.
    const result = computeTint({
      baseHue: 83,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorScheme: 'pastel',
    });

    for (const detail of result.keys) {
      assert.strictEqual(detail.tintHex, detail.finalHex);
    }
  });

  test('consistent when all background directions already agree', () => {
    // Use a hue far from the 180° boundary relative to
    // One Dark Pro's theme hues (~258-264°). Hue 0 gives
    // diff ~258-264 which is clearly > 180, so all CCW.
    const result = computeTint({
      baseHue: 0,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorScheme: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
    });

    const bgKeys = result.keys.filter(
      (k) => k.colorType === 'background' && k.themeColor
    );
    const hues = bgKeys.map((k) => hueOf(k.finalHex));

    // All backgrounds should still be consistent
    for (let i = 1; i < hues.length; i++) {
      const diff = Math.abs(hueDiff(hues[0], hues[i]));
      assert.ok(
        diff < 30,
        `Hues should agree at hue=0: ${bgKeys[0].key} ` +
          `(${hues[0].toFixed(1)}°) vs ${bgKeys[i].key} ` +
          `(${hues[i].toFixed(1)}°), diff=${diff.toFixed(1)}°`
      );
    }

    // Foregrounds should also be harmonized with backgrounds
    const elements = ['titleBar', 'statusBar', 'activityBar', 'sideBar'];
    for (const el of elements) {
      const bgs = result.keys.filter(
        (k) => k.element === el && k.colorType === 'background'
      );
      const fgs = result.keys.filter(
        (k) => k.element === el && k.colorType === 'foreground' && k.themeColor
      );
      if (bgs.length === 0 || fgs.length === 0) continue;
      const bgHue = hueOf(bgs[0].finalHex);
      for (const fg of fgs) {
        const fgHue = hueOf(fg.finalHex);
        const diff = Math.abs(hueDiff(bgHue, fgHue));
        assert.ok(
          diff < 90,
          `${el} fg/bg hue mismatch at hue=0: ` +
            `bg=${bgHue.toFixed(1)}° fg=${fgHue.toFixed(1)}° ` +
            `diff=${diff.toFixed(1)}°`
        );
      }
    }
  });

  test('foreground harmonized when backgrounds unanimously agree', () => {
    // Backgrounds at hue ~258-264° with baseHue=0 all blend CCW
    // (diff > 180). Construct foregrounds with a hue that would
    // naturally blend CW (diff < 180) to verify they get
    // re-blended to match the background majority (CCW).
    //
    // Use a bright foreground at hue ~90° (green-ish). With a
    // tint hue near 0°, shortest-path blending would go CW
    // (0 → 90), but backgrounds unanimously go CCW.
    const fgAtHue90 = oklchToHex({
      l: 0.75,
      c: maxChroma(0.75, 90) * 0.4,
      h: 90,
    });

    const colorsWithCwForeground: ThemeColors = {
      // Backgrounds: all hue ~260°, will blend CCW from baseHue=0
      'editor.background': '#282C34',
      'titleBar.activeBackground': '#282C34',
      'titleBar.inactiveBackground': '#282C34',
      'activityBar.background': '#282C34',
      'statusBar.background': '#21252B',
      'sideBar.background': '#21252B',
      'sideBarSectionHeader.background': '#282C34',
      // Foregrounds: hue ~90°, would naturally blend CW from ~0°
      'titleBar.activeForeground': fgAtHue90,
      'titleBar.inactiveForeground': fgAtHue90,
      'activityBar.foreground': fgAtHue90,
      'statusBar.foreground': fgAtHue90,
      'sideBar.foreground': fgAtHue90,
      'sideBarSectionHeader.foreground': fgAtHue90,
    };

    const result = computeTint({
      baseHue: 0,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorScheme: 'pastel',
      themeColors: colorsWithCwForeground,
      themeBlendFactor: 0.35,
    });

    // Verify backgrounds are unanimously one direction
    const bgKeys = result.keys.filter(
      (k) => k.colorType === 'background' && k.themeColor
    );
    const bgHues = bgKeys.map((k) => hueOf(k.finalHex));
    for (let i = 1; i < bgHues.length; i++) {
      const diff = Math.abs(hueDiff(bgHues[0], bgHues[i]));
      assert.ok(diff < 30, `Background hues should agree`);
    }

    // Verify foregrounds are harmonized with background direction.
    // Without harmonization the fg hue would go CW (~45-90°),
    // with harmonization it should go CCW (toward ~300-350°).
    const fgKeys = result.keys.filter(
      (k) => k.colorType === 'foreground' && k.themeColor && k.blendFactor > 0
    );
    assert.ok(fgKeys.length > 0, 'Should have blended foregrounds');

    for (const fg of fgKeys) {
      const tintHue = hexToOklch(fg.tintHex).h;
      const themeHue = hexToOklch(fg.themeColor!).h;
      const naturalDir = getHueBlendDirection(tintHue, themeHue);
      const fgHue = hueOf(fg.finalHex);

      // Natural direction should be CW (the opposite of bg)
      assert.strictEqual(
        naturalDir,
        'cw',
        `${fg.key} should naturally blend CW ` +
          `(tint=${tintHue.toFixed(1)}° theme=${themeHue.toFixed(1)}°)`
      );

      // After harmonization, fg should be closer to the bg hue
      // range (CCW side, ~300-360°) rather than the CW side (~45-90°)
      const diffFromBg = Math.abs(hueDiff(bgHues[0], fgHue));
      assert.ok(
        diffFromBg < 90,
        `${fg.key} should be harmonized with backgrounds: ` +
          `fg=${fgHue.toFixed(1)}° bg=${bgHues[0].toFixed(1)}° ` +
          `diff=${diffFromBg.toFixed(1)}°`
      );
    }
  });

  test('deterministic with tied directions', () => {
    // Even if an equal number of elements go CW vs CCW, the
    // result should be deterministic across runs.
    const opts = {
      baseHue: 83,
      targets: ALL_TARGETS,
      themeType: 'dark' as ThemeType,
      colorScheme: 'pastel' as ColorScheme,
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
    };

    const a = computeTint(opts);
    const b = computeTint(opts);
    assert.deepStrictEqual(a, b);
  });

  test('produces valid hex after harmonization', () => {
    const hexPattern = /^#[0-9a-f]{6}$/i;
    const result = computeTint({
      baseHue: 83,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorScheme: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
    });

    for (const detail of result.keys) {
      assert.match(
        detail.finalHex,
        hexPattern,
        `Invalid finalHex for ${detail.key}: ${detail.finalHex}`
      );
    }
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
