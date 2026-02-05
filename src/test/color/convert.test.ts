import * as assert from 'assert';
import {
  oklchToHex,
  hexToOklch,
  maxChroma,
  clampToGamut,
  hexToLinearRgb,
  linearRgbToHex,
} from '../../color/convert';

suite('oklchToHex', () => {
  test('converts black', () => {
    const hex = oklchToHex({ l: 0, c: 0, h: 0 });
    assert.strictEqual(hex, '#000000');
  });

  test('converts white', () => {
    const hex = oklchToHex({ l: 1, c: 0, h: 0 });
    assert.strictEqual(hex, '#ffffff');
  });

  test('converts gray (no chroma)', () => {
    const hex = oklchToHex({ l: 0.5, c: 0, h: 0 });
    // Should be a gray value
    assert.match(hex, /^#[0-9a-f]{6}$/);
    // Parse and verify R=G=B
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    assert.strictEqual(r, g, 'Gray should have R=G');
    assert.strictEqual(g, b, 'Gray should have G=B');
  });

  test('returns valid hex format', () => {
    const hex = oklchToHex({ l: 0.5, c: 0.1, h: 200 });
    assert.match(hex, /^#[0-9a-f]{6}$/);
  });

  test('handles all hue ranges', () => {
    // Test each 30-degree increment
    const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (const h of hues) {
      const hex = oklchToHex({ l: 0.5, c: 0.1, h });
      assert.match(hex, /^#[0-9a-f]{6}$/, `Failed for hue ${h}`);
    }
  });

  test('clamps out-of-gamut colors', () => {
    // High chroma values that may be out of sRGB gamut
    const hex = oklchToHex({ l: 0.5, c: 0.5, h: 150 });
    assert.match(hex, /^#[0-9a-f]{6}$/, 'Should produce valid hex');
  });

  test('handles edge case lightness 0', () => {
    const hex = oklchToHex({ l: 0, c: 0.2, h: 180 });
    assert.strictEqual(hex, '#000000', 'L=0 should be black');
  });

  test('handles edge case lightness 1', () => {
    const hex = oklchToHex({ l: 1, c: 0.2, h: 180 });
    assert.strictEqual(hex, '#ffffff', 'L=1 should be white');
  });

  test('produces different colors for different hues', () => {
    const hex0 = oklchToHex({ l: 0.5, c: 0.15, h: 0 });
    const hex120 = oklchToHex({ l: 0.5, c: 0.15, h: 120 });
    const hex240 = oklchToHex({ l: 0.5, c: 0.15, h: 240 });

    assert.notStrictEqual(hex0, hex120, 'Hue 0 and 120 should differ');
    assert.notStrictEqual(hex120, hex240, 'Hue 120 and 240 should differ');
    assert.notStrictEqual(hex0, hex240, 'Hue 0 and 240 should differ');
  });

  test('higher chroma produces more saturated colors', () => {
    const lowChroma = oklchToHex({ l: 0.5, c: 0.05, h: 0 });
    const highChroma = oklchToHex({ l: 0.5, c: 0.2, h: 0 });

    // Parse RGB values
    const lowR = parseInt(lowChroma.slice(1, 3), 16);
    const lowG = parseInt(lowChroma.slice(3, 5), 16);
    const highR = parseInt(highChroma.slice(1, 3), 16);
    const highG = parseInt(highChroma.slice(3, 5), 16);

    // Higher chroma at hue 0 (red) should have larger R-G difference
    const lowDiff = Math.abs(lowR - lowG);
    const highDiff = Math.abs(highR - highG);
    assert.ok(
      highDiff > lowDiff,
      'Higher chroma should have more color separation'
    );
  });
});

suite('hexToOklch', () => {
  test('converts black', () => {
    const oklch = hexToOklch('#000000');
    assert.ok(oklch.l < 0.001, 'Black should have L near 0');
    assert.ok(oklch.c < 0.001, 'Black should have C near 0');
  });

  test('converts white', () => {
    const oklch = hexToOklch('#ffffff');
    assert.ok(oklch.l > 0.999, 'White should have L near 1');
    assert.ok(oklch.c < 0.001, 'White should have C near 0');
  });

  test('converts gray', () => {
    const oklch = hexToOklch('#808080');
    assert.ok(oklch.l > 0.4 && oklch.l < 0.6, 'Gray should have mid lightness');
    assert.ok(oklch.c < 0.01, 'Gray should have near-zero chroma');
  });

  test('converts red', () => {
    const oklch = hexToOklch('#ff0000');
    assert.ok(oklch.c > 0.2, 'Red should have high chroma');
    // Red in OKLCH has hue around 29
    assert.ok(oklch.h < 40 || oklch.h > 350, 'Red hue should be near 0/360');
  });

  test('handles hex without hash', () => {
    const oklch = hexToOklch('ff0000');
    assert.ok(oklch.c > 0.2, 'Should parse hex without hash');
  });

  test('handles lowercase hex', () => {
    const oklch = hexToOklch('#abcdef');
    assert.match(oklch.l.toString(), /^\d/, 'Should have numeric lightness');
  });

  test('throws on invalid hex', () => {
    assert.throws(() => hexToOklch('invalid'));
    assert.throws(() => hexToOklch('#GGG'));
    assert.throws(() => hexToOklch('#12345'));
  });

  test('roundtrip conversion is close', () => {
    const testColors = [
      '#ff5733',
      '#33ff57',
      '#5733ff',
      '#808080',
      '#1f1f1f',
      '#e0e0e0',
    ];

    for (const original of testColors) {
      const oklch = hexToOklch(original);
      const roundtrip = oklchToHex(oklch);

      // Parse both and compare
      const origR = parseInt(original.slice(1, 3), 16);
      const origG = parseInt(original.slice(3, 5), 16);
      const origB = parseInt(original.slice(5, 7), 16);
      const rtR = parseInt(roundtrip.slice(1, 3), 16);
      const rtG = parseInt(roundtrip.slice(3, 5), 16);
      const rtB = parseInt(roundtrip.slice(5, 7), 16);

      // Allow small rounding errors (±2)
      assert.ok(
        Math.abs(origR - rtR) <= 2,
        `Red mismatch for ${original}: ${origR} vs ${rtR}`
      );
      assert.ok(
        Math.abs(origG - rtG) <= 2,
        `Green mismatch for ${original}: ${origG} vs ${rtG}`
      );
      assert.ok(
        Math.abs(origB - rtB) <= 2,
        `Blue mismatch for ${original}: ${origB} vs ${rtB}`
      );
    }
  });
});

suite('maxChroma', () => {
  test('returns 0 for lightness 0', () => {
    const mc = maxChroma(0, 180);
    assert.strictEqual(mc, 0, 'Black has no chroma');
  });

  test('returns 0 for lightness 1', () => {
    const mc = maxChroma(1, 180);
    assert.strictEqual(mc, 0, 'White has no chroma');
  });

  test('returns positive value for mid lightness', () => {
    const mc = maxChroma(0.5, 180);
    assert.ok(mc > 0, 'Mid lightness should have positive max chroma');
    assert.ok(mc <= 0.4, 'Max chroma should be within sRGB bounds');
  });

  test('returns valid values for all hues', () => {
    const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (const h of hues) {
      const mc = maxChroma(0.5, h);
      assert.ok(mc > 0, `Hue ${h} should have positive max chroma`);
      assert.ok(mc <= 0.4, `Hue ${h} max chroma should be <= 0.4`);
    }
  });

  test('produces in-gamut colors', () => {
    // Verify that maxChroma produces colors that are within sRGB gamut
    const testCases = [
      { l: 0.3, h: 0 },
      { l: 0.5, h: 120 },
      { l: 0.7, h: 240 },
      { l: 0.4, h: 60 },
      { l: 0.6, h: 300 },
    ];

    for (const { l, h } of testCases) {
      const mc = maxChroma(l, h);
      const hex = oklchToHex({ l, c: mc, h });
      assert.match(
        hex,
        /^#[0-9a-f]{6}$/,
        `maxChroma(${l}, ${h}) should produce valid hex`
      );
    }
  });

  test('different hues have different max chroma', () => {
    // Yellow (around hue 110) typically has higher max chroma than blue (around 265)
    const yellowChroma = maxChroma(0.8, 110);
    const blueChroma = maxChroma(0.5, 265);

    // Both should be positive
    assert.ok(yellowChroma > 0);
    assert.ok(blueChroma > 0);
    // They should differ (gamut varies by hue)
    assert.notStrictEqual(
      yellowChroma.toFixed(2),
      blueChroma.toFixed(2),
      'Different hues should have different max chroma'
    );
  });
});

suite('clampToGamut', () => {
  test('returns same color if already in gamut', () => {
    // Use low chroma that's definitely in gamut for any hue/lightness
    const oklch = { l: 0.5, c: 0.05, h: 180 };
    const clamped = clampToGamut(oklch);

    assert.strictEqual(clamped.l, oklch.l);
    assert.strictEqual(clamped.c, oklch.c);
    assert.strictEqual(clamped.h, oklch.h);
  });

  test('reduces chroma for out-of-gamut colors', () => {
    const oklch = { l: 0.5, c: 0.5, h: 150 }; // Likely out of gamut
    const clamped = clampToGamut(oklch);

    assert.strictEqual(clamped.l, oklch.l, 'Lightness should not change');
    assert.strictEqual(clamped.h, oklch.h, 'Hue should not change');
    assert.ok(clamped.c <= oklch.c, 'Chroma should be reduced or equal');
    assert.ok(clamped.c >= 0, 'Chroma should be non-negative');
  });

  test('handles edge case L=0', () => {
    const clamped = clampToGamut({ l: 0, c: 0.2, h: 180 });
    assert.strictEqual(clamped.l, 0);
    assert.strictEqual(clamped.c, 0);
  });

  test('handles edge case L=1', () => {
    const clamped = clampToGamut({ l: 1, c: 0.2, h: 180 });
    assert.strictEqual(clamped.l, 1);
    assert.strictEqual(clamped.c, 0);
  });

  test('handles edge case C=0', () => {
    const clamped = clampToGamut({ l: 0.5, c: 0, h: 180 });
    assert.strictEqual(clamped.c, 0);
  });

  test('produces valid hex after clamping', () => {
    const outOfGamut = [
      { l: 0.3, c: 0.4, h: 0 },
      { l: 0.8, c: 0.4, h: 120 },
      { l: 0.5, c: 0.5, h: 240 },
    ];

    for (const oklch of outOfGamut) {
      const clamped = clampToGamut(oklch);
      const hex = oklchToHex(clamped);
      assert.match(
        hex,
        /^#[0-9a-f]{6}$/,
        'Clamped color should produce valid hex'
      );
    }
  });
});

// =================================================================
// hexToLinearRgb
// =================================================================

suite('hexToLinearRgb', () => {
  test('converts black', () => {
    const rgb = hexToLinearRgb('#000000');
    assert.strictEqual(rgb.r, 0);
    assert.strictEqual(rgb.g, 0);
    assert.strictEqual(rgb.b, 0);
  });

  test('converts white', () => {
    const rgb = hexToLinearRgb('#ffffff');
    assert.ok(Math.abs(rgb.r - 1) < 0.001, `Red should be ~1, got ${rgb.r}`);
    assert.ok(Math.abs(rgb.g - 1) < 0.001, `Green should be ~1, got ${rgb.g}`);
    assert.ok(Math.abs(rgb.b - 1) < 0.001, `Blue should be ~1, got ${rgb.b}`);
  });

  test('handles hex without hash', () => {
    const rgb = hexToLinearRgb('ff0000');
    assert.ok(rgb.r > 0.9, 'Red channel should be near 1');
    assert.ok(rgb.g < 0.01, 'Green channel should be near 0');
    assert.ok(rgb.b < 0.01, 'Blue channel should be near 0');
  });

  test('handles uppercase hex', () => {
    const rgb = hexToLinearRgb('#FF0000');
    assert.ok(rgb.r > 0.9, 'Should parse uppercase hex');
  });

  test('linearizes sRGB values', () => {
    // sRGB #808080 (128/255 ≈ 0.502) linearizes to ~0.216
    const rgb = hexToLinearRgb('#808080');
    assert.ok(rgb.r > 0.2 && rgb.r < 0.23, `Expected ~0.216, got ${rgb.r}`);
    assert.strictEqual(rgb.r, rgb.g);
    assert.strictEqual(rgb.g, rgb.b);
  });

  test('throws on invalid hex', () => {
    assert.throws(() => hexToLinearRgb('invalid'));
    assert.throws(() => hexToLinearRgb('#GGG'));
    assert.throws(() => hexToLinearRgb('#12345'));
    assert.throws(() => hexToLinearRgb(''));
  });

  test('pure red gives only red channel', () => {
    const rgb = hexToLinearRgb('#ff0000');
    assert.ok(rgb.r > 0.9);
    assert.strictEqual(rgb.g, 0);
    assert.strictEqual(rgb.b, 0);
  });

  test('pure green gives only green channel', () => {
    const rgb = hexToLinearRgb('#00ff00');
    assert.strictEqual(rgb.r, 0);
    assert.ok(rgb.g > 0.9);
    assert.strictEqual(rgb.b, 0);
  });

  test('pure blue gives only blue channel', () => {
    const rgb = hexToLinearRgb('#0000ff');
    assert.strictEqual(rgb.r, 0);
    assert.strictEqual(rgb.g, 0);
    assert.ok(rgb.b > 0.9);
  });
});

// =================================================================
// linearRgbToHex
// =================================================================

suite('linearRgbToHex', () => {
  test('converts black', () => {
    assert.strictEqual(linearRgbToHex({ r: 0, g: 0, b: 0 }), '#000000');
  });

  test('converts white', () => {
    assert.strictEqual(linearRgbToHex({ r: 1, g: 1, b: 1 }), '#ffffff');
  });

  test('applies gamma encoding', () => {
    // Linear 0.216 should encode to sRGB ~128 (#80)
    const hex = linearRgbToHex({ r: 0.216, g: 0.216, b: 0.216 });
    const r = parseInt(hex.slice(1, 3), 16);
    assert.ok(Math.abs(r - 128) <= 2, `Expected ~128, got ${r}`);
  });

  test('returns valid hex format', () => {
    const hex = linearRgbToHex({ r: 0.5, g: 0.3, b: 0.7 });
    assert.match(hex, /^#[0-9a-f]{6}$/);
  });

  test('clamps values above 1', () => {
    const hex = linearRgbToHex({ r: 1.5, g: 0, b: 0 });
    assert.strictEqual(hex, '#ff0000');
  });

  test('clamps values below 0', () => {
    const hex = linearRgbToHex({ r: -0.5, g: 0, b: 0 });
    assert.strictEqual(hex, '#000000');
  });

  test('roundtrip with hexToLinearRgb', () => {
    const testColors = [
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#1a2b3c',
      '#808080',
      '#f0e0d0',
    ];

    for (const original of testColors) {
      const linear = hexToLinearRgb(original);
      const roundtrip = linearRgbToHex(linear);

      const origR = parseInt(original.slice(1, 3), 16);
      const origG = parseInt(original.slice(3, 5), 16);
      const origB = parseInt(original.slice(5, 7), 16);
      const rtR = parseInt(roundtrip.slice(1, 3), 16);
      const rtG = parseInt(roundtrip.slice(3, 5), 16);
      const rtB = parseInt(roundtrip.slice(5, 7), 16);

      assert.ok(
        Math.abs(origR - rtR) <= 1,
        `Red mismatch for ${original}: ${origR} vs ${rtR}`
      );
      assert.ok(
        Math.abs(origG - rtG) <= 1,
        `Green mismatch for ${original}: ${origG} vs ${rtG}`
      );
      assert.ok(
        Math.abs(origB - rtB) <= 1,
        `Blue mismatch for ${original}: ${origB} vs ${rtB}`
      );
    }
  });
});
