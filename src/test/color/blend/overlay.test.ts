import * as assert from 'assert';
import { overlayBlend } from '../../../color/blend';

// ============================================================================
// overlayBlend
// ============================================================================

suite('overlayBlend', () => {
  const dummyOklch = { l: 0.5, c: 0.1, h: 200 };

  test('returns tint hex when factor is 0', () => {
    const tintHex = '#ff0000';
    const result = overlayBlend(dummyOklch, tintHex, '#0000ff', 0, false);
    assert.strictEqual(result, tintHex);
  });

  test('returns theme hex when factor is 1', () => {
    const themeHex = '#0000ff';
    const result = overlayBlend(dummyOklch, '#ff0000', themeHex, 1, false);
    assert.strictEqual(result, themeHex);
  });

  test('produces intermediate color at factor 0.5', () => {
    const result = overlayBlend(dummyOklch, '#ff0000', '#0000ff', 0.5, false);
    assert.match(result, /^#[0-9a-f]{6}$/);
    // Should be neither pure red nor pure blue
    assert.notStrictEqual(result, '#ff0000');
    assert.notStrictEqual(result, '#0000ff');
  });

  test('ignores hueOnly flag', () => {
    const a = overlayBlend(dummyOklch, '#ff0000', '#0000ff', 0.3, false);
    const b = overlayBlend(dummyOklch, '#ff0000', '#0000ff', 0.3, true);
    assert.strictEqual(a, b);
  });

  test('ignores tintOklch parameter', () => {
    const oklchA = { l: 0.2, c: 0.05, h: 100 };
    const oklchB = { l: 0.8, c: 0.3, h: 300 };
    const a = overlayBlend(oklchA, '#ff0000', '#0000ff', 0.5, false);
    const b = overlayBlend(oklchB, '#ff0000', '#0000ff', 0.5, false);
    assert.strictEqual(a, b);
  });

  test('returns valid hex output', () => {
    const result = overlayBlend(dummyOklch, '#1a2b3c', '#4d5e6f', 0.35, false);
    assert.match(result, /^#[0-9a-f]{6}$/);
  });

  test('clamps factor above 1', () => {
    const themeHex = '#0000ff';
    const result = overlayBlend(dummyOklch, '#ff0000', themeHex, 1.5, false);
    assert.strictEqual(result, themeHex);
  });

  test('clamps factor below 0', () => {
    const tintHex = '#ff0000';
    const result = overlayBlend(dummyOklch, tintHex, '#0000ff', -0.5, false);
    assert.strictEqual(result, tintHex);
  });

  test('returns tint hex on invalid theme hex', () => {
    const tintHex = '#ff0000';
    const result = overlayBlend(dummyOklch, tintHex, 'invalid', 0.5, false);
    assert.strictEqual(result, tintHex);
  });

  test('returns tint hex on invalid tint hex', () => {
    const tintHex = 'invalid';
    const result = overlayBlend(dummyOklch, tintHex, '#0000ff', 0.5, false);
    assert.strictEqual(result, tintHex);
  });

  test('blending black and white at 0.5 produces mid gray', () => {
    const result = overlayBlend(dummyOklch, '#000000', '#ffffff', 0.5, false);
    // Linear sRGB midpoint is ~#b4b4b4 (not #808080 which is gamma-encoded)
    const r = parseInt(result.slice(1, 3), 16);
    const g = parseInt(result.slice(3, 5), 16);
    const b = parseInt(result.slice(5, 7), 16);
    // All channels should be equal (gray) and above 128
    // (since linear midpoint maps to higher sRGB value)
    assert.strictEqual(r, g);
    assert.strictEqual(g, b);
    assert.ok(r > 128, `Expected gray > 128, got ${r}`);
  });

  test('blending identical colors returns that color', () => {
    const color = '#3a7bdc';
    const result = overlayBlend(dummyOklch, color, color, 0.5, false);
    assert.strictEqual(result, color);
  });

  test('operates in linear sRGB space', () => {
    // In linear space, 0.5 blend of #000000 and #ffffff should give
    // ~0.5 linear, which is ~0.735 sRGB (187 decimal).
    // If it were naive gamma-space blending, we'd get exactly 127.
    const result = overlayBlend(dummyOklch, '#000000', '#ffffff', 0.5, false);
    const r = parseInt(result.slice(1, 3), 16);
    // Should be significantly higher than 127 due to linear blending
    assert.ok(
      r > 170,
      `Expected linear blend result > 170, got ${r} (linear sRGB)`
    );
  });

  test('handles various hex formats consistently', () => {
    // Both uppercase and lowercase should work
    const a = overlayBlend(dummyOklch, '#FF0000', '#00FF00', 0.5, false);
    const b = overlayBlend(dummyOklch, '#ff0000', '#00ff00', 0.5, false);
    assert.strictEqual(a, b);
  });
});
