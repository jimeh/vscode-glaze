const esbuild = require('esbuild');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log('[watch] build finished');
    });
  },
};

/**
 * Redirects platform/ module imports to their .web.ts variants.
 * Applied only in the web build so that browser bundles get
 * pure-JS implementations while Node bundles use native modules.
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

/** @type {import('esbuild').BuildOptions} */
const baseConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  external: ['vscode'],
  logLevel: 'silent',
};

async function main() {
  const nodeCtx = await esbuild.context({
    ...baseConfig,
    platform: 'node',
    outfile: 'dist/extension.js',
    plugins: [esbuildProblemMatcherPlugin],
  });

  const webCtx = await esbuild.context({
    ...baseConfig,
    platform: 'browser',
    outfile: 'dist/web/extension.js',
    plugins: [esbuildProblemMatcherPlugin, webPlatformPlugin],
    alias: {
      os: path.resolve('src/shims/os.ts'),
      path: 'path-browserify',
      child_process: path.resolve('src/shims/child_process.ts'),
      util: path.resolve('src/shims/util.ts'),
    },
  });

  if (watch) {
    await Promise.all([nodeCtx.watch(), webCtx.watch()]);
  } else {
    await Promise.all([nodeCtx.rebuild(), webCtx.rebuild()]);
    await Promise.all([nodeCtx.dispose(), webCtx.dispose()]);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
