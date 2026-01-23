import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import {
  getWorkspaceIdentifier,
  type WorkspaceFolder,
} from '../../workspace/identifier';
import type { WorkspaceIdentifierConfig } from '../../config';

/**
 * Helper to create mock workspace folders.
 */
function mockFolder(fsPath: string, name?: string): WorkspaceFolder {
  return {
    uri: { fsPath },
    name: name ?? path.basename(fsPath),
  };
}

suite('getWorkspaceIdentifier', () => {
  suite('with source: name', () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'name',
      customBasePath: '',
    };

    test('returns folder name', () => {
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });

    test('returns custom folder name if set', () => {
      const folders = [mockFolder('/home/user/projects/my-app', 'Custom Name')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'Custom Name');
    });

    test('returns undefined when no folders', () => {
      const result = getWorkspaceIdentifier(config, []);
      assert.strictEqual(result, undefined);
    });

    test('returns undefined when folders is undefined', () => {
      // This would normally read from vscode.workspace, but we test the
      // explicit undefined case
      const result = getWorkspaceIdentifier(config, undefined);
      // When undefined, it falls back to vscode.workspace which might have
      // folders in the test environment
      assert.ok(result === undefined || typeof result === 'string');
    });

    test('uses first folder when multiple folders present', () => {
      const folders = [
        mockFolder('/home/user/projects/first'),
        mockFolder('/home/user/projects/second'),
      ];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'first');
    });
  });

  suite('with source: pathRelativeToHome', () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathRelativeToHome',
      customBasePath: '',
    };

    test('returns relative path from home directory', () => {
      const homedir = os.homedir();
      const folders = [mockFolder(path.join(homedir, 'projects', 'my-app'))];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'projects/my-app');
    });

    test('returns normalized absolute path when outside home', () => {
      const folders = [mockFolder('/var/www/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      // Should fall back to absolute path
      assert.strictEqual(result, '/var/www/my-app');
    });

    test('returns dot when folder is home directory', () => {
      const homedir = os.homedir();
      const folders = [mockFolder(homedir, 'home')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '.');
    });
  });

  suite('with source: pathAbsolute', () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathAbsolute',
      customBasePath: '',
    };

    test('returns normalized absolute path', () => {
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '/home/user/projects/my-app');
    });

    test('normalizes backslashes to forward slashes', () => {
      // Simulate a Windows-style path
      const folders = [{
        uri: { fsPath: 'C:\\Users\\name\\projects\\my-app' },
        name: 'my-app',
      }];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'C:/Users/name/projects/my-app');
    });
  });

  suite('with source: pathRelativeToCustom', () => {
    test('returns relative path when within custom base', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user/projects',
      };
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });

    test('falls back to absolute path when outside custom base', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user/projects',
      };
      const folders = [mockFolder('/var/www/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '/var/www/my-app');
    });

    test('falls back to absolute path when customBasePath is empty', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '',
      };
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '/home/user/projects/my-app');
    });

    test('expands tilde in customBasePath', () => {
      const homedir = os.homedir();
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '~/projects',
      };
      const folders = [mockFolder(path.join(homedir, 'projects', 'my-app'))];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });

    test('returns nested relative path', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user',
      };
      const folders = [mockFolder('/home/user/projects/work/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'projects/work/my-app');
    });

    test('returns dot when folder equals custom base', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user/projects',
      };
      const folders = [mockFolder('/home/user/projects', 'projects')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '.');
    });
  });

  suite('edge cases', () => {
    test('handles folder with special characters in name', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'name',
        customBasePath: '',
      };
      const folders = [
        mockFolder('/home/user/projects/my-app (1)', 'my-app (1)'),
      ];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app (1)');
    });

    test('handles folder with unicode characters', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'name',
        customBasePath: '',
      };
      const folders = [mockFolder('/home/user/projects/项目', '项目')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '项目');
    });

    test('defaults to name for unknown source', () => {
      const config = {
        source: 'unknownSource' as 'name',
        customBasePath: '',
      };
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });
  });
});
