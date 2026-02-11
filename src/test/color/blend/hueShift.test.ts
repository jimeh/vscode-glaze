import * as assert from 'assert';
import {
  blendWithThemeOklch,
  blendHueOnlyOklch,
  blendWithThemeOklchDirected,
  blendHueOnlyOklchDirected,
  getHueBlendDirection,
  effectiveHueDirection,
  createHueShiftBlend,
} from '../../../color/blend';
import { hexToOklch, oklchToHex, maxChroma } from '../../../color/convert';
import { computeTint } from '../../../color/tint';
import type { ColorHarmony, ColorStyle } from '../../../config';
import type { ThemeColors, ThemeType } from '../../../theme';
import { ALL_TARGETS } from '../../helpers';

// ============================================================================
// blendWithThemeOklch
// ============================================================================

suite('blendWithThemeOklch', () => {
  test('returns original when factor is 0', () => {
    // Use low chroma that's definitely in gamut
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const result = blendWithThemeOklch(tint, '#1F1F1F', 0);
    assert.strictEqual(result.l, tint.l);
    assert.strictEqual(result.c, tint.c);
    assert.strictEqual(result.h, tint.h);
  });

  test('returns theme color when factor is 1', () => {
    const tint = { l: 0.5, c: 0.15, h: 200 };
    const themeHex = '#1F1F1F';
    const themeOklch = hexToOklch(themeHex);
    const result = blendWithThemeOklch(tint, themeHex, 1);

    // Should match theme (with possible small floating-point differences)
    assert.ok(
      Math.abs(result.l - themeOklch.l) < 0.01,
      `Lightness should match theme: ${result.l} vs ${themeOklch.l}`
    );
    assert.ok(
      Math.abs(result.c - themeOklch.c) < 0.01,
      `Chroma should match theme: ${result.c} vs ${themeOklch.c}`
    );
  });

  test('blends all components at intermediate factor', () => {
    const tint = { l: 0.5, c: 0.15, h: 180 };
    const themeHex = '#282C34'; // Bluish dark
    const themeOklch = hexToOklch(themeHex);
    const result = blendWithThemeOklch(tint, themeHex, 0.5);

    // Lightness should be between tint and theme
    const minL = Math.min(tint.l, themeOklch.l);
    const maxL = Math.max(tint.l, themeOklch.l);
    assert.ok(
      result.l >= minL - 0.01 && result.l <= maxL + 0.01,
      `Lightness ${result.l} should be between ${minL} and ${maxL}`
    );
  });

  test('blends lightness toward theme', () => {
    const tint = { l: 0.6, c: 0.15, h: 100 };
    const darkTheme = '#1F1F1F';
    const result = blendWithThemeOklch(tint, darkTheme, 0.5);
    assert.ok(result.l < tint.l, 'Lightness should decrease toward dark theme');
  });

  test('blends chroma toward theme', () => {
    const tint = { l: 0.5, c: 0.2, h: 200 };
    const themeHex = '#282C34'; // Low chroma
    const result = blendWithThemeOklch(tint, themeHex, 0.5);

    // Chroma should be reduced toward the low-chroma theme
    assert.ok(
      result.c < tint.c,
      `Chroma ${result.c} should decrease toward low-chroma theme`
    );
  });

  test('clamps factor > 1 to 1', () => {
    const tint = { l: 0.5, c: 0.15, h: 200 };
    const themeHex = '#FFFFFF';
    const themeOklch = hexToOklch(themeHex);

    const result = blendWithThemeOklch(tint, themeHex, 1.5);

    // Should match theme exactly when clamped to factor 1
    assert.ok(result.l <= 1, 'Lightness should not exceed 1');
    assert.ok(
      Math.abs(result.l - themeOklch.l) < 0.01,
      'Lightness should match theme at clamped factor'
    );
  });

  test('clamps factor < 0 to 0', () => {
    // Use low chroma that's definitely in gamut
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const themeHex = '#FFFFFF';

    const result = blendWithThemeOklch(tint, themeHex, -0.5);

    assert.strictEqual(result.l, tint.l, 'Lightness should match tint');
    assert.strictEqual(result.c, tint.c, 'Chroma should match tint');
    assert.strictEqual(result.h, tint.h, 'Hue should match tint');
  });

  test('handles light themes', () => {
    const tint = { l: 0.35, c: 0.15, h: 200 };
    const lightTheme = '#FFFFFF';
    const result = blendWithThemeOklch(tint, lightTheme, 0.35);
    assert.ok(
      result.l > tint.l,
      'Lightness should increase toward light theme'
    );
  });

  test('produces valid hex output', () => {
    const tint = { l: 0.5, c: 0.2, h: 180 };
    const themes = ['#1F1F1F', '#FFFFFF', '#282C34', '#FF5733'];
    const factors = [0, 0.25, 0.5, 0.75, 1];

    for (const theme of themes) {
      for (const factor of factors) {
        const result = blendWithThemeOklch(tint, theme, factor);
        const hex = oklchToHex(result);
        assert.match(
          hex,
          /^#[0-9a-f]{6}$/,
          `Theme ${theme} factor ${factor} should produce valid hex`
        );
      }
    }
  });

  test('handles hue wraparound', () => {
    // Tint at hue 350, theme near hue 10
    const tint = { l: 0.5, c: 0.15, h: 350 };
    const result = blendWithThemeOklch(tint, '#FF0000', 0.5); // Red ~hue 29

    // Result should stay near 0/360, not go through 180
    assert.ok(
      result.h > 340 || result.h < 30,
      `Hue ${result.h} should wrap around 0/360`
    );
  });

  test('returns tint unblended on invalid theme hex', () => {
    const tint = { l: 0.5, c: 0.15, h: 200 };
    const result = blendWithThemeOklch(tint, 'invalid', 0.5);
    assert.strictEqual(result.l, tint.l, 'Lightness should match tint');
    assert.strictEqual(result.c, tint.c, 'Chroma should match tint');
    assert.strictEqual(result.h, tint.h, 'Hue should match tint');
  });

  test('returns tint unblended on empty theme hex', () => {
    const tint = { l: 0.4, c: 0.1, h: 120 };
    const result = blendWithThemeOklch(tint, '', 0.5);
    assert.strictEqual(result.l, tint.l);
    assert.strictEqual(result.c, tint.c);
    assert.strictEqual(result.h, tint.h);
  });

  test('clamps result to sRGB gamut', () => {
    // High chroma tint that might go out of gamut when blended
    const tint = { l: 0.5, c: 0.3, h: 150 };
    const theme = '#00FF00'; // High chroma green

    const result = blendWithThemeOklch(tint, theme, 0.3);
    const hex = oklchToHex(result);

    // Should produce valid hex (gamut-clamped)
    assert.match(
      hex,
      /^#[0-9a-f]{6}$/,
      'Should produce valid gamut-clamped hex'
    );
  });
});

// ============================================================================
// blendHueOnlyOklch
// ============================================================================

suite('blendHueOnlyOklch', () => {
  test('returns original when factor is 0', () => {
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const result = blendHueOnlyOklch(tint, '#1F1F1F', 0);
    assert.strictEqual(result.l, tint.l);
    assert.strictEqual(result.c, tint.c);
    assert.strictEqual(result.h, tint.h);
  });

  test('returns theme hue with tint L/C when factor is 1', () => {
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const themeHex = '#FF5733'; // orange-red
    const themeOklch = hexToOklch(themeHex);
    const result = blendHueOnlyOklch(tint, themeHex, 1);

    // L and C should be preserved from tint
    assert.ok(
      Math.abs(result.l - tint.l) < 0.01,
      `L should match tint: ${result.l} vs ${tint.l}`
    );
    // C may be gamut-clamped but should be close
    assert.ok(
      result.c <= tint.c + 0.001,
      `C should not exceed tint: ${result.c} vs ${tint.c}`
    );
    // H should match theme
    assert.ok(
      Math.abs(result.h - themeOklch.h) < 1,
      `Hue should match theme: ${result.h} vs ${themeOklch.h}`
    );
  });

  test('preserves L and C at all blend factors', () => {
    const tint = { l: 0.4, c: 0.05, h: 180 };
    const themeHex = '#282C34';
    const factors = [0, 0.25, 0.5, 0.75, 1];

    for (const factor of factors) {
      const result = blendHueOnlyOklch(tint, themeHex, factor);
      // L/C should be preserved (gamut clamping may reduce C)
      assert.ok(
        Math.abs(result.l - tint.l) < 0.01,
        `L should be preserved at factor=${factor}: ` +
          `${result.l} vs ${tint.l}`
      );
      assert.ok(
        result.c <= tint.c + 0.001,
        `C should not exceed tint at factor=${factor}: ` +
          `${result.c} vs ${tint.c}`
      );
    }
  });

  test('blends hue at intermediate factor', () => {
    const tint = { l: 0.5, c: 0.05, h: 0 };
    const themeHex = '#00FF00'; // green, hue ~142
    const themeOklch = hexToOklch(themeHex);
    const result = blendHueOnlyOklch(tint, themeHex, 0.5);

    // Hue should be roughly halfway between 0 and theme hue
    const expectedHue = themeOklch.h / 2;
    assert.ok(
      Math.abs(result.h - expectedHue) < 5,
      `Hue should be ~${expectedHue}, got ${result.h}`
    );
  });

  test('handles hue wraparound', () => {
    const tint = { l: 0.5, c: 0.05, h: 350 };
    const result = blendHueOnlyOklch(tint, '#FF0000', 0.5);

    // Should wrap around 0/360, not go through 180
    assert.ok(
      result.h > 340 || result.h < 30,
      `Hue ${result.h} should wrap around 0/360`
    );
  });

  test('returns tint unchanged on invalid theme hex', () => {
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const result = blendHueOnlyOklch(tint, 'invalid', 0.5);
    assert.strictEqual(result.l, tint.l);
    assert.strictEqual(result.c, tint.c);
    assert.strictEqual(result.h, tint.h);
  });

  test('produces valid hex output', () => {
    const tint = { l: 0.5, c: 0.1, h: 180 };
    const themes = ['#1F1F1F', '#FFFFFF', '#282C34', '#FF5733'];
    const factors = [0, 0.25, 0.5, 0.75, 1];

    for (const theme of themes) {
      for (const factor of factors) {
        const result = blendHueOnlyOklch(tint, theme, factor);
        const hex = oklchToHex(result);
        assert.match(
          hex,
          /^#[0-9a-f]{6}$/,
          `Theme ${theme} factor ${factor} should give valid hex`
        );
      }
    }
  });
});

// ============================================================================
// getHueBlendDirection
// ============================================================================

suite('getHueBlendDirection', () => {
  test('returns cw when theme hue is slightly ahead', () => {
    assert.strictEqual(getHueBlendDirection(80, 120), 'cw');
  });

  test('returns ccw when theme hue is slightly behind', () => {
    assert.strictEqual(getHueBlendDirection(120, 80), 'ccw');
  });

  test('returns cw when diff is exactly 0', () => {
    assert.strictEqual(getHueBlendDirection(100, 100), 'cw');
  });

  test('returns cw when diff is exactly 180 (tie-break)', () => {
    assert.strictEqual(getHueBlendDirection(0, 180), 'cw');
    assert.strictEqual(getHueBlendDirection(90, 270), 'cw');
  });

  test('wraps around correctly at 360 boundary', () => {
    // 350 -> 10: shortest path is CW (+20°)
    assert.strictEqual(getHueBlendDirection(350, 10), 'cw');
    // 10 -> 350: shortest path is CCW (-20°)
    assert.strictEqual(getHueBlendDirection(10, 350), 'ccw');
  });

  test('handles the problematic One Dark Pro case', () => {
    // From the bug: #21252B has hue ~258.4, #282C34 has hue ~264.3
    // Tint hue ~84. The 6° difference causes opposite directions.
    // Use actual fractional hues from hexToOklch to match real
    // behavior (integer 264-84=180 hits the tie-break).
    const sidebarTheme = hexToOklch('#21252B'); // hue ~258.4
    const titleBarTheme = hexToOklch('#282C34'); // hue ~264.3
    const tintHue = 84;

    assert.strictEqual(
      getHueBlendDirection(tintHue, sidebarTheme.h),
      'cw',
      `Sidebar theme (${sidebarTheme.h.toFixed(1)}°) should be CW`
    );
    assert.strictEqual(
      getHueBlendDirection(tintHue, titleBarTheme.h),
      'ccw',
      `Title bar theme (${titleBarTheme.h.toFixed(1)}°) should be CCW`
    );
  });
});

// ============================================================================
// blendWithThemeOklchDirected
// ============================================================================

suite('blendWithThemeOklchDirected', () => {
  test('shortest mode matches blendWithThemeOklch', () => {
    const tint = { l: 0.5, c: 0.15, h: 100 };
    const theme = '#282C34';
    const factor = 0.35;

    const original = blendWithThemeOklch(tint, theme, factor);
    const directed = blendWithThemeOklchDirected(
      tint,
      theme,
      factor,
      'shortest'
    );

    assert.ok(
      Math.abs(original.h - directed.h) < 0.01,
      `Hue should match: ${original.h} vs ${directed.h}`
    );
    assert.ok(
      Math.abs(original.l - directed.l) < 0.01,
      `Lightness should match: ${original.l} vs ${directed.l}`
    );
    assert.ok(
      Math.abs(original.c - directed.c) < 0.01,
      `Chroma should match: ${original.c} vs ${directed.c}`
    );
  });

  test('cw forces clockwise blend', () => {
    // Tint at 80°, theme at ~258° (One Dark Pro sidebar)
    // Shortest path would go CW (+174°). CCW would go (-186°).
    // Forced CW should produce hue > 80°.
    const tint = { l: 0.35, c: 0.03, h: 80 };
    const theme = '#21252B'; // hue ~258
    const factor = 0.35;

    const result = blendWithThemeOklchDirected(tint, theme, factor, 'cw');
    // CW from 80° toward 258° should land around 80 + 178*0.35 ≈ 142°
    assert.ok(
      result.h > 100 && result.h < 200,
      `CW should produce hue ~142°, got ${result.h}`
    );
  });

  test('ccw forces counter-clockwise blend', () => {
    // Same inputs, but forced CCW: goes from 80° backwards
    // CCW from 80° toward 258°: diff becomes 258-80=178 -> -182
    // 80 + (-182)*0.35 = 80 - 63.7 ≈ 16°
    const tint = { l: 0.35, c: 0.03, h: 80 };
    const theme = '#21252B'; // hue ~258
    const factor = 0.35;

    const result = blendWithThemeOklchDirected(tint, theme, factor, 'ccw');
    // CCW should produce hue around 16°
    assert.ok(
      result.h < 80 || result.h > 340,
      `CCW should produce hue < 80° or > 340°, got ${result.h}`
    );
  });

  test('cw and ccw produce different hues', () => {
    const tint = { l: 0.5, c: 0.1, h: 80 };
    const theme = '#282C34';
    const factor = 0.35;

    const cw = blendWithThemeOklchDirected(tint, theme, factor, 'cw');
    const ccw = blendWithThemeOklchDirected(tint, theme, factor, 'ccw');

    assert.ok(
      Math.abs(cw.h - ccw.h) > 5,
      `CW (${cw.h}) and CCW (${ccw.h}) should differ`
    );
  });

  test('blends L and C identically regardless of direction', () => {
    const tint = { l: 0.5, c: 0.1, h: 80 };
    const theme = '#282C34';
    const factor = 0.35;

    const cw = blendWithThemeOklchDirected(tint, theme, factor, 'cw');
    const ccw = blendWithThemeOklchDirected(tint, theme, factor, 'ccw');

    // L and C interpolation is direction-independent
    assert.ok(
      Math.abs(cw.l - ccw.l) < 0.01,
      `Lightness should match: ${cw.l} vs ${ccw.l}`
    );
    assert.ok(
      Math.abs(cw.c - ccw.c) < 0.01,
      `Chroma should match: ${cw.c} vs ${ccw.c}`
    );
  });

  test('returns tint unblended on invalid theme hex', () => {
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const result = blendWithThemeOklchDirected(tint, 'invalid', 0.5, 'cw');
    assert.strictEqual(result.l, tint.l);
    assert.strictEqual(result.c, tint.c);
    assert.strictEqual(result.h, tint.h);
  });
});

// ============================================================================
// blendHueOnlyOklchDirected
// ============================================================================

suite('blendHueOnlyOklchDirected', () => {
  test('shortest mode matches blendHueOnlyOklch', () => {
    const tint = { l: 0.5, c: 0.05, h: 100 };
    const theme = '#282C34';
    const factor = 0.5;

    const original = blendHueOnlyOklch(tint, theme, factor);
    const directed = blendHueOnlyOklchDirected(tint, theme, factor, 'shortest');

    assert.ok(
      Math.abs(original.h - directed.h) < 0.01,
      `Hue should match: ${original.h} vs ${directed.h}`
    );
  });

  test('preserves L and C regardless of direction', () => {
    const tint = { l: 0.4, c: 0.05, h: 80 };
    const theme = '#21252B';
    const factor = 0.35;

    const cw = blendHueOnlyOklchDirected(tint, theme, factor, 'cw');
    const ccw = blendHueOnlyOklchDirected(tint, theme, factor, 'ccw');

    // L should be preserved from tint
    assert.ok(
      Math.abs(cw.l - tint.l) < 0.01,
      `CW L should match tint: ${cw.l} vs ${tint.l}`
    );
    assert.ok(
      Math.abs(ccw.l - tint.l) < 0.01,
      `CCW L should match tint: ${ccw.l} vs ${tint.l}`
    );

    // C should be preserved (may be gamut-clamped)
    assert.ok(cw.c <= tint.c + 0.001, `CW C should not exceed tint: ${cw.c}`);
    assert.ok(
      ccw.c <= tint.c + 0.001,
      `CCW C should not exceed tint: ${ccw.c}`
    );
  });

  test('cw and ccw produce different hues', () => {
    const tint = { l: 0.5, c: 0.05, h: 80 };
    const theme = '#282C34';
    const factor = 0.35;

    const cw = blendHueOnlyOklchDirected(tint, theme, factor, 'cw');
    const ccw = blendHueOnlyOklchDirected(tint, theme, factor, 'ccw');

    assert.ok(
      Math.abs(cw.h - ccw.h) > 5,
      `CW (${cw.h}) and CCW (${ccw.h}) should differ`
    );
  });

  test('returns tint unchanged on invalid theme hex', () => {
    const tint = { l: 0.5, c: 0.05, h: 200 };
    const result = blendHueOnlyOklchDirected(tint, 'invalid', 0.5, 'cw');
    assert.strictEqual(result.l, tint.l);
    assert.strictEqual(result.c, tint.c);
    assert.strictEqual(result.h, tint.h);
  });
});

// ============================================================================
// effectiveHueDirection
// ============================================================================

suite('effectiveHueDirection', () => {
  test('returns undefined when majorityDir is undefined', () => {
    assert.strictEqual(effectiveHueDirection(80, 200, undefined), undefined);
  });

  test('returns majorityDir when CW arc <= 270°', () => {
    // CW from 80 to 200: arc = 120°
    assert.strictEqual(effectiveHueDirection(80, 200, 'cw'), 'cw');
  });

  test('returns majorityDir when CCW arc <= 270°', () => {
    // CCW from 200 to 80: diff = 80-200 = -120, abs = 120°
    assert.strictEqual(effectiveHueDirection(200, 80, 'ccw'), 'ccw');
  });

  test('returns undefined when forced CW arc > 270°', () => {
    // CW from 200 to 80: diff = 80-200 = -120, +360 = 240°... no
    // CW from 10 to 20: diff=10, arc=10 — too small.
    // Need forced arc > 270: CW from 100 to 80: diff=-20, +360=340°
    assert.strictEqual(
      effectiveHueDirection(100, 80, 'cw'),
      undefined,
      'CW arc of 340° should fall back to undefined'
    );
  });

  test('returns undefined when forced CCW arc > 270°', () => {
    // CCW from 80 to 100: diff=20, -360=-340, abs=340°
    assert.strictEqual(
      effectiveHueDirection(80, 100, 'ccw'),
      undefined,
      'CCW arc of 340° should fall back to undefined'
    );
  });

  test('boundary: arc exactly at 270° returns majorityDir', () => {
    // CW from 0 to 270: diff=270, arc=270°
    assert.strictEqual(
      effectiveHueDirection(0, 270, 'cw'),
      'cw',
      'Exactly 270° arc should return majorityDir'
    );
  });

  test('boundary: arc at 271° returns undefined', () => {
    // CW from 0 to 271: diff=271, arc=271°
    assert.strictEqual(
      effectiveHueDirection(0, 271, 'cw'),
      undefined,
      '271° arc should fall back to undefined'
    );
  });
});

// ============================================================================
// createHueShiftBlend
// ============================================================================

suite('createHueShiftBlend', () => {
  const tint = { l: 0.5, c: 0.1, h: 200 };
  const tintHex = oklchToHex(tint);
  const themeHex = '#1F1F1F';

  test('returns a function', () => {
    const fn = createHueShiftBlend();
    assert.strictEqual(typeof fn, 'function');
  });

  test('returns tint hex when factor is 0', () => {
    const fn = createHueShiftBlend();
    const result = fn(tint, tintHex, themeHex, 0, false);
    assert.strictEqual(result, tintHex);
  });

  test('returns color close to theme when factor is 1', () => {
    const fn = createHueShiftBlend();
    const result = fn(tint, tintHex, themeHex, 1, false);
    const resultOklch = hexToOklch(result);
    const themeOklch = hexToOklch(themeHex);

    // At factor=1, full blend should match theme's L and C
    assert.ok(
      Math.abs(resultOklch.l - themeOklch.l) < 0.01,
      `Lightness should match theme: ${resultOklch.l} vs ${themeOklch.l}`
    );
    assert.ok(
      Math.abs(resultOklch.c - themeOklch.c) < 0.01,
      `Chroma should match theme: ${resultOklch.c} vs ${themeOklch.c}`
    );
  });

  test('hue-only at factor=1 preserves L/C, shifts hue to theme', () => {
    const fn = createHueShiftBlend();
    const coloredTheme = '#FF5733'; // orange-red, has distinct hue
    const result = fn(tint, tintHex, coloredTheme, 1, true);
    const resultOklch = hexToOklch(result);
    const themeOklch = hexToOklch(coloredTheme);

    // L should stay close to tint
    assert.ok(
      Math.abs(resultOklch.l - tint.l) < 0.01,
      `L should match tint: ${resultOklch.l} vs ${tint.l}`
    );
    // Hue should match theme
    assert.ok(
      Math.abs(resultOklch.h - themeOklch.h) < 1,
      `Hue should match theme: ${resultOklch.h} vs ${themeOklch.h}`
    );
  });

  test('produces valid hex output', () => {
    const fn = createHueShiftBlend();
    const result = fn(tint, tintHex, themeHex, 0.35, false);
    assert.match(result, /^#[0-9a-f]{6}$/);
  });

  test('hueOnly preserves L/C', () => {
    const fn = createHueShiftBlend();
    const resultFull = fn(tint, tintHex, themeHex, 0.5, false);
    const resultHueOnly = fn(tint, tintHex, themeHex, 0.5, true);

    const fullOklch = hexToOklch(resultFull);
    const hueOnlyOklch = hexToOklch(resultHueOnly);

    // Hue-only should preserve tint's L closer than full blend
    assert.ok(
      Math.abs(hueOnlyOklch.l - tint.l) < Math.abs(fullOklch.l - tint.l) + 0.02,
      'Hue-only should preserve L better'
    );
  });

  test('accepts context parameter', () => {
    // Without themeColors, context has no effect (no majority to compute)
    const fnWithContext = createHueShiftBlend({ baseHue: 200 });
    const fnWithoutContext = createHueShiftBlend();

    const resultWith = fnWithContext(tint, tintHex, themeHex, 0.5, false);
    const resultWithout = fnWithoutContext(tint, tintHex, themeHex, 0.5, false);

    // Both should produce valid hex
    assert.match(resultWith, /^#[0-9a-f]{6}$/);
    assert.match(resultWithout, /^#[0-9a-f]{6}$/);
  });
});

// ============================================================================
// computeTint hue harmonization (hue-shift specific integration tests)
// ============================================================================

suite('computeTint hue harmonization (hueShift mode)', () => {
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
    if (d > 180) {
      d -= 360;
    } else if (d <= -180) {
      d += 360;
    }
    return d;
  }

  test('background hues are harmonized (One Dark Pro + hue 83)', () => {
    const result = computeTint({
      baseHue: 83,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorStyle: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
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
      colorStyle: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
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

      if (bgs.length === 0 || fgs.length === 0) {
        continue;
      }

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
      colorStyle: 'pastel',
      blendMethod: 'hueShift',
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
      colorStyle: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
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
      if (bgs.length === 0 || fgs.length === 0) {
        continue;
      }
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
    // (diff > 180). Foregrounds with hue ~90° get the same
    // majority direction from the pre-blend calculation (based on
    // baseHue, not post-offset hues), keeping fg/bg consistent.
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
      // Foregrounds: hue ~90°
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
      colorStyle: 'pastel',
      themeColors: colorsWithCwForeground,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
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

    // Verify foregrounds are close to background hue range
    const fgKeys = result.keys.filter(
      (k) => k.colorType === 'foreground' && k.themeColor && k.blendFactor > 0
    );
    assert.ok(fgKeys.length > 0, 'Should have blended foregrounds');

    for (const fg of fgKeys) {
      const fgHue = hueOf(fg.finalHex);
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
      colorStyle: 'pastel' as ColorStyle,
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift' as const,
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
      colorStyle: 'pastel',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
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
// Pre-blend majority direction regression tests
// ============================================================================

suite('computeTint pre-blend majority direction (hueShift mode)', () => {
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
    if (d > 180) {
      d -= 360;
    } else if (d <= -180) {
      d += 360;
    }
    return d;
  }

  // Theme with similar hue across all BG elements (~258-264°).
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

  test('uniform harmony + close theme hues: no long-way-around blending', () => {
    // Bug: with uniform harmony, all tint hues are baseHue (30°).
    // Theme hues are ~258-264°. The old post-blend harmonization
    // would compute direction from 30° → 258° per-element, and
    // forcing the minority direction caused 30° + 355×0.35 ≈ 154°
    // (green). Pre-blend direction from baseHue avoids this.
    const result = computeTint({
      baseHue: 30,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorStyle: 'pastel',
      colorHarmony: 'uniform',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
    });

    const bgKeys = result.keys.filter(
      (k) => k.colorType === 'background' && k.themeColor
    );
    const hues = bgKeys.map((k) => hueOf(k.finalHex));

    // All BG hues should be within 30° of each other (no outliers
    // shifted 100°+ in the wrong direction).
    for (let i = 1; i < hues.length; i++) {
      const diff = Math.abs(hueDiff(hues[0], hues[i]));
      assert.ok(
        diff < 30,
        `Uniform harmony BG hues too far apart: ` +
          `${bgKeys[0].key} (${hues[0].toFixed(1)}°) vs ` +
          `${bgKeys[i].key} (${hues[i].toFixed(1)}°), ` +
          `diff=${diff.toFixed(1)}°`
      );
    }

    // No hue should be in the green range (100-180°) — that would
    // indicate long-way-around blending from orange (30°).
    for (const k of bgKeys) {
      const h = hueOf(k.finalHex);
      assert.ok(
        h < 100 || h > 180,
        `${k.key} hue ${h.toFixed(1)}° is in the green range, ` +
          `indicating long-way-around blending`
      );
    }
  });

  test('duotone harmony + theme blending: complementary hues maintained', () => {
    // With duotone, titleBar/statusBar at baseHue and
    // activityBar/sideBar at baseHue+180°. Both groups should
    // blend consistently without one group going the long way.
    const result = computeTint({
      baseHue: 30,
      targets: ALL_TARGETS,
      themeType: 'dark',
      colorStyle: 'pastel',
      colorHarmony: 'duotone',
      themeColors: oneDarkProColors,
      themeBlendFactor: 0.35,
      blendMethod: 'hueShift',
    });

    const titleBarBg = result.keys.find(
      (k) => k.key === 'titleBar.activeBackground'
    )!;
    const activityBarBg = result.keys.find(
      (k) => k.key === 'activityBar.background'
    )!;

    const tbHue = hueOf(titleBarBg.finalHex);
    const abHue = hueOf(activityBarBg.finalHex);

    // Both should produce valid colors (not extreme shifts).
    // The hues should differ since they start 180° apart.
    const diff = Math.abs(hueDiff(tbHue, abHue));
    assert.ok(
      diff > 30,
      `Duotone elements should have distinct hues: ` +
        `titleBar=${tbHue.toFixed(1)}° activityBar=${abHue.toFixed(1)}° ` +
        `diff=${diff.toFixed(1)}°`
    );
  });

  test('harmony direction consistent across all harmonies when theme present', () => {
    // For every harmony, all background hues should be within a
    // reasonable range (no 100°+ outliers from long-way blending).
    // Skip very-low-chroma finals where hue is unreliable.
    const harmonies: ColorHarmony[] = [
      'uniform',
      'duotone',
      'undercurrent',
      'analogous',
      'triadic',
    ];

    for (const harmony of harmonies) {
      const result = computeTint({
        baseHue: 83,
        targets: ALL_TARGETS,
        themeType: 'dark',
        colorStyle: 'pastel',
        colorHarmony: harmony,
        themeColors: oneDarkProColors,
        themeBlendFactor: 0.35,
        blendMethod: 'hueShift',
      });

      // No background key should have a hue shifted more than
      // 120° from the unblended tint hue. The blend factor is
      // 0.35 so even worst case the shift should be moderate.
      for (const k of result.keys) {
        if (k.colorType !== 'background' || !k.themeColor) {
          continue;
        }
        const finalOklch = hexToOklch(k.finalHex);
        // Skip low chroma — hue is unreliable below ~0.03 due
        // to hex roundtrip quantization at near-neutral colors.
        if (finalOklch.c < 0.03) {
          continue;
        }
        const tintHue = hueOf(k.tintHex);
        const finalHue = finalOklch.h;
        const shift = Math.abs(hueDiff(tintHue, finalHue));
        assert.ok(
          shift < 120,
          `${harmony}/${k.key}: hue shifted ${shift.toFixed(1)}° ` +
            `(tint=${tintHue.toFixed(1)}° final=${finalHue.toFixed(1)}°), ` +
            `likely long-way-around blending`
        );
      }
    }
  });
});
