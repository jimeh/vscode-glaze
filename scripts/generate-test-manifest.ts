import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type ExtensionManifest = Record<string, unknown> & {
  main?: string;
};

const rootDir = process.cwd();
const packageJsonPath = resolve(rootDir, 'package.json');
const outPackageJsonPath = resolve(rootDir, 'out/package.json');

async function generateTestManifest(): Promise<void> {
  const raw = await readFile(packageJsonPath, 'utf8');
  const manifest = JSON.parse(raw) as ExtensionManifest;

  const testManifest: ExtensionManifest = {
    ...manifest,
    main: './extension.js',
  };

  await mkdir(resolve(rootDir, 'out'), { recursive: true });
  await writeFile(
    outPackageJsonPath,
    `${JSON.stringify(testManifest, null, 2)}\n`,
    'utf8'
  );
}

generateTestManifest().catch((error: unknown) => {
  console.error('Failed to generate out/package.json for tests.');
  console.error(error);
  process.exitCode = 1;
});
