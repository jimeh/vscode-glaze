import { defineConfig } from '@vscode/test-cli';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: resolve(__dirname, 'src/test/fixtures/test-workspace'),
  mocha: { timeout: 5000 },
  coverage: {
    reporter: ['text'],
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
});
