import * as assert from 'assert';
import { hashString } from '../../color/hash';

suite('hashString', () => {
  test('returns consistent hash for same input', () => {
    const hash1 = hashString('my-project');
    const hash2 = hashString('my-project');
    assert.strictEqual(hash1, hash2);
  });

  test('returns different hashes for different inputs', () => {
    const hash1 = hashString('project-a');
    const hash2 = hashString('project-b');
    assert.notStrictEqual(hash1, hash2);
  });

  test('returns positive number', () => {
    assert.ok(hashString('test') >= 0);
    assert.ok(hashString('') >= 0);
    assert.ok(hashString('a very long string with many characters') >= 0);
  });

  test('handles empty string', () => {
    const hash = hashString('');
    assert.strictEqual(typeof hash, 'number');
    assert.ok(hash >= 0);
  });

  test('handles unicode characters', () => {
    const hash = hashString('项目名称');
    assert.strictEqual(typeof hash, 'number');
    assert.ok(hash >= 0);
  });

  test('produces well-distributed hashes', () => {
    // Test that similar strings produce different hashes
    const hashes = [
      hashString('project1'),
      hashString('project2'),
      hashString('project3'),
      hashString('1project'),
      hashString('2project'),
    ];

    const uniqueHashes = new Set(hashes);
    assert.strictEqual(uniqueHashes.size, hashes.length);
  });
});
