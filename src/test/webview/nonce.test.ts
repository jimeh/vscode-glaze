import * as assert from 'assert';
import { generateNonce } from '../../webview/nonce';

suite('generateNonce', () => {
  test('returns a 32-character string', () => {
    const nonce = generateNonce();
    assert.strictEqual(nonce.length, 32);
  });

  test('contains only alphanumeric characters', () => {
    const nonce = generateNonce();
    assert.match(nonce, /^[A-Za-z0-9]+$/);
  });

  test('generates unique values across 100 calls', () => {
    const nonces = new Set<string>();
    for (let i = 0; i < 100; i++) {
      nonces.add(generateNonce());
    }
    assert.strictEqual(nonces.size, 100, 'Expected 100 unique nonces');
  });

  test('returns a string type', () => {
    assert.strictEqual(typeof generateNonce(), 'string');
  });
});
