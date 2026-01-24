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

  test('produces well-distributed hue values across larger sample', () => {
    // Generate hashes for 100 different workspace names
    const sampleSize = 100;
    const hues: number[] = [];

    for (let i = 0; i < sampleSize; i++) {
      const hash = hashString(`workspace-${i}`);
      // Convert to hue (0-360) as palette.ts does
      const hue = hash % 360;
      hues.push(hue);
    }

    // Check uniqueness - with 100 samples and 360 possible hues,
    // we should have high uniqueness
    const uniqueHues = new Set(hues);
    assert.ok(
      uniqueHues.size >= sampleSize * 0.9,
      `Expected at least 90% unique hues, got ${uniqueHues.size}/${sampleSize}`
    );

    // Check distribution across quadrants (0-89, 90-179, 180-269, 270-359)
    const quadrants = [0, 0, 0, 0];
    for (const hue of hues) {
      quadrants[Math.floor(hue / 90)]++;
    }

    // Each quadrant should have at least 10% of samples (very loose bound)
    for (let i = 0; i < 4; i++) {
      assert.ok(
        quadrants[i] >= sampleSize * 0.1,
        `Quadrant ${i} has only ${quadrants[i]} samples, expected at least 10`
      );
    }
  });

  test('avoids collisions for common workspace patterns', () => {
    // Test patterns that users commonly have
    const patterns = [
      // Similar prefixes
      'my-app',
      'my-app-v2',
      'my-app-backend',
      'my-app-frontend',
      // Similar suffixes
      'backend',
      'frontend',
      'api-backend',
      'web-backend',
      // Numbered variations
      'project-1',
      'project-2',
      'project-10',
      'project-100',
      // Case variations (djb2 is case-sensitive)
      'MyProject',
      'myproject',
      'MYPROJECT',
      // Path-like strings
      'Users/dev/code/project',
      'Users/dev/code/project2',
      '/home/user/work/app',
    ];

    const hashes = patterns.map((p) => hashString(p));
    const uniqueHashes = new Set(hashes);

    assert.strictEqual(
      uniqueHashes.size,
      patterns.length,
      `Found collisions among ${patterns.length} common patterns`
    );
  });
});
