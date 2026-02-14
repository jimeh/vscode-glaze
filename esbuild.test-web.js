const esbuild = require('esbuild');
const path = require('path');

/**
 * Redirects platform/ module imports to their .web.ts variants.
 * Same plugin as in esbuild.js — duplicated here because the
 * 5-line plugin is simpler to duplicate than to extract a shared
 * module that both configs import.
 *
 * @type {import('esbuild').Plugin}
 */
const webPlatformPlugin = {
  name: 'web-platform',

  setup(build) {
    build.onResolve({ filter: /\/platform\/sha256$/ }, () => ({
      path: path.resolve('src/platform/sha256.web.ts'),
    }));
  },
};

esbuild
  .build({
    entryPoints: ['src/test/web/index.ts'],
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    outfile: 'dist/web/test/index.js',
    external: ['vscode'],
    sourcemap: true,
    inject: ['src/test/web/process-shim.js'],
    plugins: [webPlatformPlugin],
    alias: {
      os: path.resolve('src/shims/os.ts'),
      path: 'path-browserify',
      child_process: path.resolve('src/shims/child_process.ts'),
      // Use the full browserify util polyfill (not the extension's
      // minimal shim) because the `assert` package needs
      // util.inspect.custom.
      util: require.resolve('util/'),
      assert: 'assert',
      mocha: require.resolve('mocha/mocha.js'),
    },
  })
  .catch(() => process.exit(1));
