import * as assert from 'assert';
import { getColorName } from '../../color/naming';

suite('getColorName', () => {
  test('returns string for valid hex', () => {
    const name = getColorName('#ff0000');
    assert.strictEqual(typeof name, 'string');
    assert.ok(name.length > 0);
  });

  test('same hex returns same name (memoization)', () => {
    const name1 = getColorName('#336699');
    const name2 = getColorName('#336699');
    assert.strictEqual(name1, name2);
  });

  test('case insensitive - returns same name for different cases', () => {
    const name1 = getColorName('#AABBCC');
    const name2 = getColorName('#aabbcc');
    assert.strictEqual(name1, name2);
  });

  test('returns reasonable name for red', () => {
    const name = getColorName('#ff0000');
    assert.ok(
      name !== 'Unknown',
      `Expected a real name for red, got "${name}"`
    );
    // The name should contain "red" or be a known red-ish name
    assert.ok(
      name.toLowerCase().includes('red') ||
        name.toLowerCase().includes('scarlet') ||
        name.toLowerCase().includes('crimson'),
      `Expected red-ish name, got "${name}"`
    );
  });

  test('returns reasonable name for blue', () => {
    const name = getColorName('#0000ff');
    assert.ok(
      name !== 'Unknown',
      `Expected a real name for blue, got "${name}"`
    );
    assert.ok(
      name.toLowerCase().includes('blue') ||
        name.toLowerCase().includes('navy') ||
        name.toLowerCase().includes('cobalt') ||
        name.toLowerCase().includes('azure'),
      `Expected blue-ish name, got "${name}"`
    );
  });

  test('returns reasonable name for green', () => {
    const name = getColorName('#00ff00');
    assert.ok(
      name !== 'Unknown',
      `Expected a real name for green, got "${name}"`
    );
    assert.ok(
      name.toLowerCase().includes('green') ||
        name.toLowerCase().includes('lime') ||
        name.toLowerCase().includes('emerald') ||
        name.toLowerCase().includes('chartreuse'),
      `Expected green-ish name, got "${name}"`
    );
  });

  test('returns reasonable name for white', () => {
    const name = getColorName('#ffffff');
    assert.ok(
      name !== 'Unknown',
      `Expected a real name for white, got "${name}"`
    );
  });

  test('returns reasonable name for black', () => {
    const name = getColorName('#000000');
    assert.ok(
      name !== 'Unknown',
      `Expected a real name for black, got "${name}"`
    );
  });

  test('handles arbitrary colors', () => {
    // Test some random colors to ensure no crashes
    const colors = ['#1a2b3c', '#abcdef', '#987654', '#c0ffee', '#facade'];
    for (const color of colors) {
      const name = getColorName(color);
      assert.strictEqual(typeof name, 'string');
      assert.ok(name.length > 0, `Empty name for ${color}`);
    }
  });

  test('different colors may return different names', () => {
    // While not guaranteed, very different colors should likely have
    // different names
    const redName = getColorName('#ff0000');
    const blueName = getColorName('#0000ff');
    const greenName = getColorName('#00ff00');

    // At least two of these three should be different
    const names = [redName, blueName, greenName];
    const uniqueNames = new Set(names);
    assert.ok(
      uniqueNames.size >= 2,
      `Expected at least 2 unique names, got: ${names.join(', ')}`
    );
  });
});
