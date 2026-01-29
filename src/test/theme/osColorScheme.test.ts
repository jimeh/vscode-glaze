import * as assert from 'assert';
import { detectOsColorScheme } from '../../theme/osColorScheme';

suite('detectOsColorScheme', () => {
  test('returns a valid value', () => {
    const result = detectOsColorScheme();
    assert.ok(
      result === 'dark' || result === 'light' || result === undefined,
      `Expected 'dark', 'light', or undefined, got: ${result}`
    );
  });

  test('returns a string on supported platforms', function () {
    // Only macOS is guaranteed: `defaults` always resolves to
    // 'dark' or 'light'. Linux/Windows can legitimately return
    // undefined in headless or non-standard desktop environments.
    const supported = ['darwin'];
    if (!supported.includes(process.platform)) {
      this.skip();
    }

    const result = detectOsColorScheme();
    assert.strictEqual(
      typeof result,
      'string',
      `Expected string on ${process.platform}, got: ${result}`
    );
  });
});
