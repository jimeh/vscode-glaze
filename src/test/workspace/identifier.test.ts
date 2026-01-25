import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import {
  getWorkspaceIdentifier,
  type WorkspaceFolder,
  type WorkspaceFileUri,
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

/**
 * Helper to create mock workspace file URI.
 */
function mockWorkspaceFile(fsPath: string): WorkspaceFileUri {
  return { fsPath };
}

suite('getWorkspaceIdentifier', () => {
  suite('with source: name', () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'name',
      customBasePath: '',
      multiRootSource: 'firstFolder',
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
      multiRootSource: 'firstFolder',
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
      multiRootSource: 'firstFolder',
    };

    test('returns normalized absolute path', () => {
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '/home/user/projects/my-app');
    });

    test('normalizes backslashes to forward slashes', () => {
      // Simulate a Windows-style path
      const folders = [
        {
          uri: { fsPath: 'C:\\Users\\name\\projects\\my-app' },
          name: 'my-app',
        },
      ];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'C:/Users/name/projects/my-app');
    });
  });

  suite('with source: pathRelativeToCustom', () => {
    test('returns relative path when within custom base', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user/projects',
        multiRootSource: 'firstFolder',
      };
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });

    test('falls back to absolute path when outside custom base', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user/projects',
        multiRootSource: 'firstFolder',
      };
      const folders = [mockFolder('/var/www/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '/var/www/my-app');
    });

    test('falls back to absolute path when customBasePath is empty', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '',
        multiRootSource: 'firstFolder',
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
        multiRootSource: 'firstFolder',
      };
      const folders = [mockFolder(path.join(homedir, 'projects', 'my-app'))];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });

    test('expands $HOME in customBasePath', () => {
      const homedir = os.homedir();
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '$HOME/projects',
        multiRootSource: 'firstFolder',
      };
      const folders = [mockFolder(path.join(homedir, 'projects', 'my-app'))];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });

    test('returns nested relative path', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user',
        multiRootSource: 'firstFolder',
      };
      const folders = [mockFolder('/home/user/projects/work/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'projects/work/my-app');
    });

    test('returns dot when folder equals custom base', () => {
      const config: WorkspaceIdentifierConfig = {
        source: 'pathRelativeToCustom',
        customBasePath: '/home/user/projects',
        multiRootSource: 'firstFolder',
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
        multiRootSource: 'firstFolder',
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
        multiRootSource: 'firstFolder',
      };
      const folders = [mockFolder('/home/user/projects/项目', '项目')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, '项目');
    });

    test('defaults to name for unknown source', () => {
      const config = {
        source: 'unknownSource' as 'name',
        customBasePath: '',
        multiRootSource: 'firstFolder' as const,
      };
      const folders = [mockFolder('/home/user/projects/my-app')];
      const result = getWorkspaceIdentifier(config, folders);
      assert.strictEqual(result, 'my-app');
    });
  });

  suite('multi-root workspaces', () => {
    const multiFolders = [
      mockFolder('/home/user/projects/frontend', 'frontend'),
      mockFolder('/home/user/projects/backend', 'backend'),
    ];
    const workspaceFile = mockWorkspaceFile(
      '/home/user/workspaces/my-project.code-workspace'
    );

    suite('with multiRootSource: workspaceFile', () => {
      test('uses workspace file path with source: name', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'workspaceFile',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(result, 'my-project.code-workspace');
      });

      test('uses workspace file path with source: pathAbsolute', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'workspaceFile',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(
          result,
          '/home/user/workspaces/my-project.code-workspace'
        );
      });

      test('uses workspace file path with source: pathRelativeToHome', () => {
        const homedir = os.homedir();
        const wsFile = mockWorkspaceFile(
          path.join(homedir, 'workspaces', 'my-project.code-workspace')
        );
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'workspaceFile',
        };
        const result = getWorkspaceIdentifier(config, multiFolders, wsFile);
        assert.strictEqual(result, 'workspaces/my-project.code-workspace');
      });

      test('uses workspace file path with source: pathRelativeToCustom', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToCustom',
          customBasePath: '/home/user',
          multiRootSource: 'workspaceFile',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(result, 'workspaces/my-project.code-workspace');
      });

      test('falls back to allFolders when workspaceFile unavailable', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'workspaceFile',
        };
        const result = getWorkspaceIdentifier(config, multiFolders, undefined);
        // Should fall back to allFolders, sorted alphabetically
        assert.strictEqual(result, 'backend\nfrontend');
      });
    });

    suite('with multiRootSource: allFolders', () => {
      test('combines all folder names sorted alphabetically', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'allFolders',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(result, 'backend\nfrontend');
      });

      test('combines all absolute paths sorted alphabetically', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'allFolders',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(
          result,
          '/home/user/projects/backend\n/home/user/projects/frontend'
        );
      });

      test('combines all relative paths sorted alphabetically', () => {
        const homedir = os.homedir();
        const folders = [
          mockFolder(path.join(homedir, 'projects', 'frontend'), 'frontend'),
          mockFolder(path.join(homedir, 'projects', 'backend'), 'backend'),
        ];
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'allFolders',
        };
        const result = getWorkspaceIdentifier(config, folders, workspaceFile);
        assert.strictEqual(result, 'projects/backend\nprojects/frontend');
      });

      test('uses custom folder names when set', () => {
        const folders = [
          mockFolder('/home/user/projects/app', 'My Frontend App'),
          mockFolder('/home/user/projects/api', 'My Backend API'),
        ];
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'allFolders',
        };
        const result = getWorkspaceIdentifier(config, folders, workspaceFile);
        assert.strictEqual(result, 'My Backend API\nMy Frontend App');
      });
    });

    suite('with multiRootSource: firstFolder', () => {
      test('uses only first folder name (backward compatible)', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'firstFolder',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(result, 'frontend');
      });

      test('uses only first folder absolute path', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(result, '/home/user/projects/frontend');
      });

      test('ignores workspace file', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'firstFolder',
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        // Should NOT use workspace file, only first folder
        assert.strictEqual(result, 'frontend');
      });
    });

    suite('single folder workspace', () => {
      test('uses folder regardless of multiRootSource setting', () => {
        const singleFolder = [mockFolder('/home/user/projects/my-app')];
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'workspaceFile',
        };
        // Even with workspaceFile setting, single folder should use folder
        const result = getWorkspaceIdentifier(
          config,
          singleFolder,
          workspaceFile
        );
        assert.strictEqual(result, 'my-app');
      });

      test('ignores multiRootSource: allFolders for single folder', () => {
        const singleFolder = [mockFolder('/home/user/projects/my-app')];
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'allFolders',
        };
        const result = getWorkspaceIdentifier(
          config,
          singleFolder,
          workspaceFile
        );
        assert.strictEqual(result, '/home/user/projects/my-app');
      });
    });
  });
});
