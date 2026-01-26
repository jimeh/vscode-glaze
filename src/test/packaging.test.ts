import * as assert from 'assert';
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Finds the project root by looking for package.json from the test file
 * location.
 */
function findProjectRoot(): string {
  let dir = __dirname;
  // Walk up from out/test to find package.json
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  throw new Error('Could not find project root');
}

/**
 * Exact list of files that should be in the VSIX package. Any deviation from
 * this list (missing or extra files) will fail the test.
 */
const EXPECTED_FILES = [
  'CHANGELOG.md',
  'LICENSE',
  'README.md',
  'dist/extension.js',
  'img/icon.png',
  'package.json',
];

suite('VSIX Packaging', () => {
  let projectRoot: string;

  suiteSetup(() => {
    projectRoot = findProjectRoot();
  });

  test('contains exactly the expected files', function () {
    this.timeout(120000);

    // Build only if dist/extension.js doesn't exist
    const distPath = join(projectRoot, 'dist', 'extension.js');
    if (!existsSync(distPath)) {
      execFileSync('pnpm', ['run', 'vscode:prepublish'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
    }

    // Get file list from vsce
    const output = execFileSync(
      'pnpm',
      ['exec', 'vsce', 'ls', '--no-dependencies'],
      {
        cwd: projectRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      }
    );

    // Parse and sort for comparison
    const actualFiles = output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
      .sort();

    assert.deepStrictEqual(
      actualFiles,
      EXPECTED_FILES,
      `VSIX file list mismatch.\n` +
        `Expected: ${EXPECTED_FILES.join(', ')}\n` +
        `Actual: ${actualFiles.join(', ')}`
    );
  });
});
