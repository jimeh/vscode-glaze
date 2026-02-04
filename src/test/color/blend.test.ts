import * as assert from 'assert';
import {
  blendWithThemeOklch,
  blendHueOnlyOklch,
  blendWithThemeOklchDirected,
  blendHueOnlyOklchDirected,
  getHueBlendDirection,
} from '../../color/blend';
import { hexToOklch, oklchToHex } from '../../color/convert';

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

// =================================================================
// blendHueOnlyOklch
// =================================================================

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

// =================================================================
// getHueBlendDirection
// =================================================================

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

// =================================================================
// blendWithThemeOklchDirected
// =================================================================

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

// =================================================================
// blendHueOnlyOklchDirected
// =================================================================

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
