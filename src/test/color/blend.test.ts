import * as assert from 'assert';
import {
  hexToRgb,
  rgbToHsl,
  hexToHsl,
  blendWithTheme,
} from '../../color/blend';

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

  test('blends hue with wraparound', () => {
    // Tint at hue 350, theme at hue 10 - should blend through 0
    const tint = { h: 350, s: 0.5, l: 0.4 };
    const result = blendWithTheme(tint, '#FF0000', 0.5); // Red = hue 0
    // Should blend toward 0/360, not go the long way around
    assert.ok(
      result.h > 350 || result.h < 10,
      `Hue should wrap around 0, got ${result.h}`
    );
  });

  test('clamps factor to valid range', () => {
    const tint = { h: 200, s: 0.5, l: 0.4 };
    const result = blendWithTheme(tint, '#FFFFFF', 1.5);
    assert.ok(result.l <= 1, 'Lightness should not exceed 1');
    assert.ok(result.s >= 0, 'Saturation should not go negative');
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
});
