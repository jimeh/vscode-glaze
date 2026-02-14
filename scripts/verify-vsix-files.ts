/**
 * Verifies the VSIX package contains exactly the expected files.
 * Run via `pnpm run verify:vsix-files`.
 *
 * Exits with code 1 if the file list doesn't match expectations.
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

const ROOT = path.resolve(__dirname, '..');

/**
 * Exact list of files that should be in the VSIX package.
 * Any deviation (missing or extra files) will fail the check.
 */
const EXPECTED_FILES = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'dist/extension.js',
  'dist/web/extension.js',
  'img/icon.png',
  'package.json',
];

// Build if dist bundles don't exist yet.
const distPath = path.join(ROOT, 'dist', 'extension.js');
const distWebPath = path.join(ROOT, 'dist', 'web', 'extension.js');
if (!existsSync(distPath) || !existsSync(distWebPath)) {
  console.log('dist bundle(s) not found, building...');
  execFileSync('pnpm', ['run', 'vscode:prepublish'], {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'inherit',
  });
}

// Get file list from vsce.
const output = execFileSync(
  'npx',
  ['-y', '@vscode/vsce', 'ls', '--no-dependencies'],
  {
    cwd: ROOT,
    encoding: 'utf-8',
    stdio: 'pipe',
  }
);

const actualFiles = output
  .trim()
  .split('\n')
  .filter((line) => line.length > 0)
  .sort();

const expected = [...EXPECTED_FILES].sort();

// Compare.
const missing = expected.filter((f) => !actualFiles.includes(f));
const extra = actualFiles.filter((f) => !expected.includes(f));

if (missing.length > 0 || extra.length > 0) {
  console.error('VSIX file list mismatch!');
  if (missing.length > 0) {
    console.error(`  Missing: ${missing.join(', ')}`);
  }
  if (extra.length > 0) {
    console.error(`  Extra:   ${extra.join(', ')}`);
  }
  console.error(`  Expected: ${expected.join(', ')}`);
  console.error(`  Actual:   ${actualFiles.join(', ')}`);
  process.exit(1);
}

console.log(`VSIX file list OK (${actualFiles.length} files)`);
