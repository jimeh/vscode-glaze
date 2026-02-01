import * as assert from 'assert';
import {
  detectOsColorScheme,
  parseWindowsRegOutput,
} from '../../theme/osColorScheme';

suite('detectOsColorScheme', () => {
  test('returns a valid value', async () => {
    const result = await detectOsColorScheme();
    assert.ok(
      result === 'dark' || result === 'light' || result === undefined,
      `Expected 'dark', 'light', or undefined, got: ${result}`
    );
  });

  test('returns a string on supported platforms', async function () {
    // Only macOS is guaranteed: `defaults` always resolves to
    // 'dark' or 'light'. Linux/Windows can legitimately return
    // undefined in headless or non-standard desktop environments.
    const supported = ['darwin'];
    if (!supported.includes(process.platform)) {
      this.skip();
    }

    const result = await detectOsColorScheme();
    assert.strictEqual(
      typeof result,
      'string',
      `Expected string on ${process.platform}, got: ${result}`
    );
  });
});

suite('parseWindowsRegOutput', () => {
  // Realistic reg query output template
  const regOutput = (hex: string) =>
    `\r\nHKEY_CURRENT_USER\\Software\\Microsoft\\Windows` +
    `\\CurrentVersion\\Themes\\Personalize\r\n` +
    `    AppsUseLightTheme    REG_DWORD    ${hex}\r\n\r\n`;

  test('0x0 → dark', () => {
    assert.strictEqual(parseWindowsRegOutput(regOutput('0x0')), 'dark');
  });

  test('0x1 → light', () => {
    assert.strictEqual(parseWindowsRegOutput(regOutput('0x1')), 'light');
  });

  test('zero-padded 0x00000000 → dark', () => {
    assert.strictEqual(parseWindowsRegOutput(regOutput('0x00000000')), 'dark');
  });

  test('zero-padded 0x00000001 → light (the bug case)', () => {
    assert.strictEqual(parseWindowsRegOutput(regOutput('0x00000001')), 'light');
  });

  test('empty string → undefined', () => {
    assert.strictEqual(parseWindowsRegOutput(''), undefined);
  });

  test('garbage output → undefined', () => {
    assert.strictEqual(parseWindowsRegOutput('ERROR: blah blah'), undefined);
  });

  test('missing hex value → undefined', () => {
    assert.strictEqual(parseWindowsRegOutput('REG_DWORD'), undefined);
  });

  test('case-insensitive REG_DWORD match', () => {
    const lower = regOutput('0x0').replace('REG_DWORD', 'reg_dword');
    assert.strictEqual(parseWindowsRegOutput(lower), 'dark');
  });
});
