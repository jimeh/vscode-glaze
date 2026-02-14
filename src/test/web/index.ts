// Web test runner entry point for @vscode/test-web.
//
// Bundles a curated subset of tests that are fully browser-compatible
// (no Node APIs beyond the `assert` polyfill). Tests that depend on
// crypto.randomBytes, os.homedir(), util.isDeepStrictEqual, or heavy
// VS Code integration (reconcile, commands) are excluded — see Phase 2
// in testing.md.
//
// The `mocha` import resolves to mocha/mocha.js (pre-bundled browser
// UMD) via the esbuild alias in esbuild.test-web.js. That UMD build
// exports a pre-constructed Mocha instance rather than the class
// itself, so we access the constructor from it to create a fresh
// instance with our own config.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mochaInstance = require('mocha');
const Mocha = mochaInstance.constructor as typeof import('mocha');

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 5000 });

  // Expose TDD globals (suite, test, setup, teardown, etc.) so that
  // imported test files can register suites by side-effect.
  mocha.suite.emit('pre-require', globalThis, '', mocha);

  // --- Phase 1: pure unit tests (no Node APIs beyond assert) --------

  // color/blend
  await import('../color/blend/hueShift.test');
  await import('../color/blend/index.test');
  await import('../color/blend/overlay.test');

  // color
  await import('../color/convert.test');
  await import('../color/naming.test');
  await import('../color/styles.test');
  await import('../color/tint.test');

  // config
  await import('../config/validate.test');

  // preview
  await import('../preview/colors.test');
  await import('../preview/html.test');

  // status
  await import('../status/data.test');
  await import('../status/html.test');

  // theme
  await import('../theme/colors.test');
  await import('../theme/decode.test');
  await import('../theme/detect.test');
  await import('../theme/name.test');

  // webview
  await import('../webview/assert.test');
  await import('../webview/escapeHtml.test');
  await import('../webview/html.test');
  await import('../webview/nonce.test');

  return new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} test(s) failed`));
      } else {
        resolve();
      }
    });
  });
}
