import * as assert from 'assert';
import {
  hexToRgb,
  rgbToHsl,
  hexToHsl,
  blendWithTheme,
  blendWithThemeOklch,
} from '../../color/blend';
import { hexToOklch, oklchToHex } from '../../color/convert';

suite('hexToRgb', () => {
  test('parses hex with hash', () => {
    const rgb = hexToRgb('#FF5733');
    assert.deepStrictEqual(rgb, { r: 255, g: 87, b: 51 });
  });

  test('parses hex without hash', () => {
    const rgb = hexToRgb('1F1F1F');
    assert.deepStrictEqual(rgb, { r: 31, g: 31, b: 31 });
  });

  test('parses black', () => {
    const rgb = hexToRgb('#000000');
    assert.deepStrictEqual(rgb, { r: 0, g: 0, b: 0 });
  });

  test('parses white', () => {
    const rgb = hexToRgb('#FFFFFF');
    assert.deepStrictEqual(rgb, { r: 255, g: 255, b: 255 });
  });

  test('handles lowercase', () => {
    const rgb = hexToRgb('#abcdef');
    assert.deepStrictEqual(rgb, { r: 171, g: 205, b: 239 });
  });

  test('throws on invalid hex', () => {
    assert.throws(() => hexToRgb('invalid'));
    assert.throws(() => hexToRgb('#GGG'));
    assert.throws(() => hexToRgb('#12345'));
  });

  test('throws on 3-character shorthand hex', () => {
    // 3-char shorthand (#FFF) is not supported
    assert.throws(() => hexToRgb('#FFF'), 'Should reject 3-char shorthand');
    assert.throws(() => hexToRgb('FFF'), 'Should reject 3-char without hash');
  });

  test('throws on 8-character hex with alpha', () => {
    // 8-char hex with alpha (#FF5733FF) is not supported
    assert.throws(
      () => hexToRgb('#FF5733FF'),
      'Should reject 8-char hex with alpha'
    );
  });

  test('throws on hex with spaces', () => {
    assert.throws(() => hexToRgb(' #FF5733'), 'Should reject leading space');
    assert.throws(() => hexToRgb('#FF5733 '), 'Should reject trailing space');
    assert.throws(() => hexToRgb('# FF5733'), 'Should reject space after hash');
  });

  test('throws on empty string', () => {
    assert.throws(() => hexToRgb(''), 'Should reject empty string');
  });
});

suite('rgbToHsl', () => {
  test('converts black', () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 0 });
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 0);
    assert.strictEqual(hsl.l, 0);
  });

  test('converts white', () => {
    const hsl = rgbToHsl({ r: 255, g: 255, b: 255 });
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 0);
    assert.strictEqual(hsl.l, 1);
  });

  test('converts pure red', () => {
    const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 1);
    assert.strictEqual(hsl.l, 0.5);
  });

  test('converts pure green', () => {
    const hsl = rgbToHsl({ r: 0, g: 255, b: 0 });
    assert.strictEqual(hsl.h, 120);
    assert.strictEqual(hsl.s, 1);
    assert.strictEqual(hsl.l, 0.5);
  });

  test('converts pure blue', () => {
    const hsl = rgbToHsl({ r: 0, g: 0, b: 255 });
    assert.strictEqual(hsl.h, 240);
    assert.strictEqual(hsl.s, 1);
    assert.strictEqual(hsl.l, 0.5);
  });

  test('converts gray', () => {
    const hsl = rgbToHsl({ r: 128, g: 128, b: 128 });
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 0);
    // Approximately 0.5
    assert.ok(Math.abs(hsl.l - 0.5) < 0.01);
  });

  test('converts dark theme background', () => {
    // One Dark Pro background #282C34
    const hsl = rgbToHsl({ r: 40, g: 44, b: 52 });
    // Should be low saturation, low lightness, bluish hue
    assert.ok(hsl.l < 0.25, 'Lightness should be low for dark background');
    assert.ok(hsl.s < 0.5, 'Saturation should be moderate');
  });
});

suite('hexToHsl', () => {
  test('converts hex to HSL directly', () => {
    const hsl = hexToHsl('#FF0000');
    assert.strictEqual(hsl.h, 0);
    assert.strictEqual(hsl.s, 1);
    assert.strictEqual(hsl.l, 0.5);
  });

  test('converts dark theme background', () => {
    // Default Dark Modern #1F1F1F
    const hsl = hexToHsl('#1F1F1F');
    assert.ok(hsl.l < 0.2, 'Lightness should be very low');
    assert.strictEqual(hsl.s, 0, 'Gray has no saturation');
  });
});

suite('blendWithTheme', () => {
  test('returns original when factor is 0', () => {
    const tint = { h: 200, s: 0.4, l: 0.32 };
    const result = blendWithTheme(tint, '#1F1F1F', 0);
    assert.strictEqual(result.h, tint.h);
    assert.strictEqual(result.s, tint.s);
    assert.strictEqual(result.l, tint.l);
  });

  test('returns theme color when factor is 1', () => {
    const tint = { h: 200, s: 0.5, l: 0.4 };
    const themeHex = '#1F1F1F';
    const themeHsl = hexToHsl(themeHex);
    const result = blendWithTheme(tint, themeHex, 1);
    // Should match theme exactly (gray has h=0, s=0)
    assert.ok(
      Math.abs(result.s - themeHsl.s) < 0.001,
      `Saturation should match theme: ${result.s} vs ${themeHsl.s}`
    );
    assert.ok(
      Math.abs(result.l - themeHsl.l) < 0.001,
      `Lightness should match theme: ${result.l} vs ${themeHsl.l}`
    );
  });

  test('blends all components at intermediate factor', () => {
    const tint = { h: 180, s: 0.5, l: 0.4 };
    const themeHex = '#282C34'; // Bluish dark
    const themeHsl = hexToHsl(themeHex);
    const result = blendWithTheme(tint, themeHex, 0.5);

    // All components should be between tint and theme
    assert.ok(
      result.l < tint.l && result.l > themeHsl.l,
      'Lightness should be between tint and theme'
    );
    assert.ok(
      result.s < tint.s,
      'Saturation should decrease toward low-saturation theme'
    );
  });

  test('blends lightness toward theme', () => {
    const tint = { h: 100, s: 0.4, l: 0.6 };
    const darkTheme = '#1F1F1F';
    const result = blendWithTheme(tint, darkTheme, 0.5);
    assert.ok(result.l < tint.l, 'Lightness should decrease toward dark theme');
    assert.ok(result.l > 0.12, 'Lightness should not reach theme level at 0.5');
  });

  test('blends saturation toward theme', () => {
    const tint = { h: 200, s: 0.5, l: 0.4 };
    const themeHex = '#282C34';
    const themeHsl = hexToHsl(themeHex);
    const result = blendWithTheme(tint, themeHex, 0.5);
    const expectedS = tint.s * 0.5 + themeHsl.s * 0.5;
    assert.ok(
      Math.abs(result.s - expectedS) < 0.01,
      `Expected saturation ~${expectedS}, got ${result.s}`
    );
  });

  test('blends hue with wraparound (350 to 0)', () => {
    // Tint at hue 350, theme at hue 0 - should blend through 0/360
    const tint = { h: 350, s: 0.5, l: 0.4 };
    const result = blendWithTheme(tint, '#FF0000', 0.5); // Red = hue 0
    // Should blend toward 0/360, not go the long way around
    assert.ok(
      result.h > 350 || result.h < 10,
      `Hue should wrap around 0, got ${result.h}`
    );
  });

  test('blends hue with wraparound (10 to 350)', () => {
    // Tint at hue 10, theme at hue 350 - should blend backwards through 0
    // Create a hex color with hue ~350 (magenta-ish)
    const tint = { h: 10, s: 0.5, l: 0.4 };
    // Theme with hue 350: HSL(350, 1, 0.5) -> ~#ff1a40
    const result = blendWithTheme(tint, '#ff1a40', 0.5);
    // Should stay near 0/360, not go through 180
    assert.ok(
      result.h < 20 || result.h > 340,
      `Hue should wrap around 0, got ${result.h}`
    );
  });

  test('normalizes negative hue result', () => {
    // Blend from hue 5 toward hue 350 produces negative intermediate
    // diff = 350 - 5 = 345 > 180, so diff = 345 - 360 = -15
    // result = 5 + (-15 * 0.5) = -2.5 → should normalize to 357.5
    const tint = { h: 5, s: 0.5, l: 0.4 };
    const result = blendWithTheme(tint, '#ff1a40', 0.5); // hue ~350
    assert.ok(result.h >= 0, `Hue should be non-negative, got ${result.h}`);
    assert.ok(result.h < 360, `Hue should be < 360, got ${result.h}`);
    // Should be near 357-358 range (blending 5 toward 350)
    assert.ok(
      result.h > 350 || result.h < 10,
      `Hue should be near 0/360, got ${result.h}`
    );
  });

  test('blends hues near 180 boundary', () => {
    const tint = { h: 170, s: 0.5, l: 0.4 };
    // Theme with hue 190: cyan-ish #00bfbf is close
    const result = blendWithTheme(tint, '#00d9ff', 0.5); // ~hue 190
    // Should blend in a straight line, result between 170 and 190
    assert.ok(
      result.h >= 170 && result.h <= 200,
      `Hue should be between 170-200, got ${result.h}`
    );
  });

  test('blends hues at exact 0 and 180', () => {
    const tint = { h: 0, s: 0.5, l: 0.4 };
    // Cyan has hue 180
    const result = blendWithTheme(tint, '#00ffff', 0.5);
    // Should blend to 90 or 270 depending on shortest path (equal distance)
    assert.ok(
      (result.h >= 80 && result.h <= 100) ||
        (result.h >= 260 && result.h <= 280),
      `Hue should be near 90 or 270, got ${result.h}`
    );
  });

  test('clamps factor > 1 to 1', () => {
    const tint = { h: 200, s: 0.5, l: 0.4 };
    const themeHex = '#FFFFFF';
    const themeHsl = hexToHsl(themeHex);

    // With factor > 1, should clamp to 1 (returns theme color)
    const result = blendWithTheme(tint, themeHex, 1.5);

    assert.ok(result.l <= 1, 'Lightness should not exceed 1');
    assert.ok(result.s >= 0, 'Saturation should not go negative');
    // Should match theme exactly when clamped to factor 1
    assert.ok(
      Math.abs(result.s - themeHsl.s) < 0.001,
      'Saturation should match theme at clamped factor'
    );
    assert.ok(
      Math.abs(result.l - themeHsl.l) < 0.001,
      'Lightness should match theme at clamped factor'
    );
  });

  test('clamps factor < 0 to 0', () => {
    const tint = { h: 200, s: 0.5, l: 0.4 };
    const themeHex = '#FFFFFF';

    // With factor < 0, should clamp to 0 (returns tint unchanged)
    const result = blendWithTheme(tint, themeHex, -0.5);

    assert.strictEqual(result.h, tint.h, 'Hue should match tint at factor 0');
    assert.strictEqual(
      result.s,
      tint.s,
      'Saturation should match tint at factor 0'
    );
    assert.strictEqual(
      result.l,
      tint.l,
      'Lightness should match tint at factor 0'
    );
  });

  test('handles light themes', () => {
    const tint = { h: 200, s: 0.4, l: 0.32 };
    const lightTheme = '#FFFFFF';
    const result = blendWithTheme(tint, lightTheme, 0.35);
    assert.ok(
      result.l > tint.l,
      'Lightness should increase toward light theme'
    );
  });

  test('throws on invalid theme hex', () => {
    const tint = { h: 200, s: 0.5, l: 0.4 };
    assert.throws(
      () => blendWithTheme(tint, 'invalid', 0.5),
      'Should throw on invalid hex'
    );
    assert.throws(
      () => blendWithTheme(tint, '#GGG', 0.5),
      'Should throw on invalid hex characters'
    );
  });
});

// --------------------------------------------------------------------------
// OKLCH Blending Tests
// --------------------------------------------------------------------------

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

  test('throws on invalid theme hex', () => {
    const tint = { l: 0.5, c: 0.15, h: 200 };
    assert.throws(
      () => blendWithThemeOklch(tint, 'invalid', 0.5),
      'Should throw on invalid hex'
    );
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
