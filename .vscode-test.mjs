import { defineConfig } from '@vscode/test-cli';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  tests: [
    {
      files: 'out/test/**/*.test.js',
      extensionDevelopmentPath: resolve(__dirname, 'out'),
      workspaceFolder: resolve(__dirname, 'src/test/fixtures/test-workspace'),
      version: process.env.VSCODE_TEST_VERSION || 'stable',
      mocha: { timeout: 5000, require: ['choma'] },
    },
  ],
  coverage: {
    exclude: [
      '**/node_modules/**',
      '**/.pnpm/**',
      '**/out/test/**',
      '**/out/color/generated/**',
      '**/out/theme/generated/**',
    ],
    reporter: ['text'],
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
});
