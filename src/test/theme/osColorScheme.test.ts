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
    // Only meaningful on macOS, Windows, or Linux
    const supported = ['darwin', 'win32', 'linux'];
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
