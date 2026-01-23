import { defineConfig } from '@vscode/test-cli';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: resolve(__dirname, 'src/test/fixtures/test-workspace'),
});
