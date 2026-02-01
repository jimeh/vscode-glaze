import * as assert from 'assert';
import { assertHex } from '../../webview/assert';

suite('assertHex', () => {
  test('accepts valid lowercase hex', () => {
    assert.doesNotThrow(() => assertHex('#abcdef'));
  });

  test('accepts valid uppercase hex', () => {
    assert.doesNotThrow(() => assertHex('#ABCDEF'));
  });

  test('accepts valid mixed-case hex', () => {
    assert.doesNotThrow(() => assertHex('#a1B2c3'));
  });

  test('accepts #000000', () => {
    assert.doesNotThrow(() => assertHex('#000000'));
  });

  test('accepts #ffffff', () => {
    assert.doesNotThrow(() => assertHex('#ffffff'));
  });

  test('rejects hex without hash', () => {
    assert.throws(() => assertHex('abcdef'), /Invalid hex color/);
  });

  test('rejects 3-digit shorthand', () => {
    assert.throws(() => assertHex('#abc'), /Invalid hex color/);
  });

  test('rejects 8-digit hex (with alpha)', () => {
    assert.throws(() => assertHex('#aabbccdd'), /Invalid hex color/);
  });

  test('rejects empty string', () => {
    assert.throws(() => assertHex(''), /Invalid hex color/);
  });

  test('rejects arbitrary string', () => {
    assert.throws(() => assertHex('not-a-color'), /Invalid hex color/);
  });

  test('rejects hex with invalid characters', () => {
    assert.throws(() => assertHex('#gggggg'), /Invalid hex color/);
  });

  test('includes invalid value in error message', () => {
    assert.throws(
      () => assertHex('bad'),
      (err: Error) => {
        return err.message.includes('bad');
      }
    );
  });
});
