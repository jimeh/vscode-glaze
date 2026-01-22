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
});
