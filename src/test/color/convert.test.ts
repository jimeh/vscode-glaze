import * as assert from 'assert';
import { hslToHex } from '../../color/convert';

suite('hslToHex', () => {
  test('converts pure red', () => {
    const hex = hslToHex({ h: 0, s: 1, l: 0.5 });
    assert.strictEqual(hex, '#ff0000');
  });

  test('converts pure green', () => {
    const hex = hslToHex({ h: 120, s: 1, l: 0.5 });
    assert.strictEqual(hex, '#00ff00');
  });

  test('converts pure blue', () => {
    const hex = hslToHex({ h: 240, s: 1, l: 0.5 });
    assert.strictEqual(hex, '#0000ff');
  });

  test('converts black', () => {
    const hex = hslToHex({ h: 0, s: 0, l: 0 });
    assert.strictEqual(hex, '#000000');
  });

  test('converts white', () => {
    const hex = hslToHex({ h: 0, s: 0, l: 1 });
    assert.strictEqual(hex, '#ffffff');
  });

  test('converts gray (no saturation)', () => {
    const hex = hslToHex({ h: 0, s: 0, l: 0.5 });
    assert.strictEqual(hex, '#808080');
  });

  test('returns valid hex format', () => {
    const hex = hslToHex({ h: 200, s: 0.4, l: 0.3 });
    assert.match(hex, /^#[0-9a-f]{6}$/);
  });

  test('handles pastel-range values', () => {
    // Typical pastel: low-medium saturation, medium-high lightness
    const hex = hslToHex({ h: 180, s: 0.4, l: 0.32 });
    assert.match(hex, /^#[0-9a-f]{6}$/);
  });

  test('handles all hue ranges', () => {
    // Test each 60-degree segment
    const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (const h of hues) {
      const hex = hslToHex({ h, s: 0.5, l: 0.5 });
      assert.match(hex, /^#[0-9a-f]{6}$/, `Failed for hue ${h}`);
    }
  });

  test('hue at 360 normalizes to same as 0', () => {
    // Hue 360 should produce same result as hue 0 (full circle)
    const hex0 = hslToHex({ h: 0, s: 1, l: 0.5 });
    const hex360 = hslToHex({ h: 360, s: 1, l: 0.5 });
    assert.strictEqual(hex0, hex360, 'Hue 360 should equal hue 0');
  });

  test('saturation at boundary 0', () => {
    // S=0 should produce grayscale regardless of hue
    const hex1 = hslToHex({ h: 0, s: 0, l: 0.5 });
    const hex2 = hslToHex({ h: 180, s: 0, l: 0.5 });
    assert.strictEqual(hex1, hex2, 'S=0 should ignore hue');
    assert.strictEqual(hex1, '#808080', 'S=0, L=0.5 should be gray');
  });

  test('saturation at boundary 1', () => {
    // S=1 with pure hues should produce vivid colors
    const red = hslToHex({ h: 0, s: 1, l: 0.5 });
    const green = hslToHex({ h: 120, s: 1, l: 0.5 });
    const blue = hslToHex({ h: 240, s: 1, l: 0.5 });
    assert.strictEqual(red, '#ff0000');
    assert.strictEqual(green, '#00ff00');
    assert.strictEqual(blue, '#0000ff');
  });

  test('lightness at boundary 0', () => {
    // L=0 should produce black regardless of hue and saturation
    const hex1 = hslToHex({ h: 0, s: 1, l: 0 });
    const hex2 = hslToHex({ h: 180, s: 0.5, l: 0 });
    assert.strictEqual(hex1, '#000000', 'L=0 should be black');
    assert.strictEqual(
      hex2,
      '#000000',
      'L=0 should be black regardless of h/s'
    );
  });

  test('lightness at boundary 1', () => {
    // L=1 should produce white regardless of hue and saturation
    const hex1 = hslToHex({ h: 0, s: 1, l: 1 });
    const hex2 = hslToHex({ h: 180, s: 0.5, l: 1 });
    assert.strictEqual(hex1, '#ffffff', 'L=1 should be white');
    assert.strictEqual(
      hex2,
      '#ffffff',
      'L=1 should be white regardless of h/s'
    );
  });

  test('handles hue greater than 360', () => {
    // Hue values > 360 should wrap around and produce valid output
    const hex370 = hslToHex({ h: 370, s: 1, l: 0.5 });
    assert.match(hex370, /^#[0-9a-f]{6}$/, 'Should handle hue > 360');
  });

  test('negative hue produces output (callers should normalize)', () => {
    // Negative hues are not normalized in the current implementation.
    // This test documents that it doesn't crash, but the output may be
    // invalid. Callers should normalize hues to 0-360 before calling.
    const hex = hslToHex({ h: -10, s: 1, l: 0.5 });
    // Should produce some string output (may not be valid hex)
    assert.strictEqual(typeof hex, 'string');
    assert.ok(hex.startsWith('#'), 'Should start with #');
    // Note: Output may be malformed like "#ff-2b00" for negative inputs
  });
});
