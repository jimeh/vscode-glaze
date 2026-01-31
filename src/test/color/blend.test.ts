import * as assert from 'assert';
import { blendWithThemeOklch } from '../../color/blend';
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
