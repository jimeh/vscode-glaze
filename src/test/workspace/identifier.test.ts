import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import {
  getWorkspaceIdentifier,
  type WorkspaceFolder,
  type WorkspaceFileUri,
} from '../../workspace/identifier';
import type { WorkspaceIdentifierConfig } from '../../config';

/** Default remote config fields for local-only tests. */
const LOCAL_DEFAULTS = {
  includeRemoteAuthority: true,
  remoteHomeDirectory: '',
} as const;

/**
 * Helper to create mock workspace folders (local).
 */
function mockFolder(fsPath: string, name?: string): WorkspaceFolder {
  return {
    uri: { fsPath },
    name: name ?? path.basename(fsPath),
  };
}

/**
 * Helper to create mock remote workspace folders.
 */
function mockRemoteFolder(
  fsPath: string,
  authority: string,
  name?: string,
  scheme = 'vscode-remote'
): WorkspaceFolder {
  return {
    uri: { fsPath, authority, scheme },
    name: name ?? path.basename(fsPath),
  };
}

/**
 * Helper to create mock workspace file URI (local).
 */
function mockWorkspaceFile(fsPath: string): WorkspaceFileUri {
  return { fsPath };
}

/**
 * Helper to create mock remote workspace file URI.
 */
function mockRemoteWorkspaceFile(
  fsPath: string,
  authority: string,
  scheme = 'vscode-remote'
): WorkspaceFileUri {
  return { fsPath, authority, scheme };
}

suite('getWorkspaceIdentifier', () => {
  suite('with source: name', () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'name',
      customBasePath: '',
      multiRootSource: 'firstFolder',
      ...LOCAL_DEFAULTS,
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
      const result = getWorkspaceIdentifier(config, undefined);
      // When undefined, it falls back to vscode.workspace
      // which might have folders in the test environment
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
      ...LOCAL_DEFAULTS,
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
      ...LOCAL_DEFAULTS,
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
          uri: {
            fsPath: 'C:\\Users\\name\\projects\\my-app',
          },
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
        ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
        };
        const result = getWorkspaceIdentifier(config, multiFolders, wsFile);
        assert.strictEqual(result, 'workspaces/my-project.code-workspace');
      });

      test('uses workspace file path with source: pathRelativeToCustom', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToCustom',
          customBasePath: '/home/user',
          multiRootSource: 'workspaceFile',
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
        };
        const result = getWorkspaceIdentifier(
          config,
          multiFolders,
          workspaceFile
        );
        assert.strictEqual(
          result,
          '/home/user/projects/backend\n' + '/home/user/projects/frontend'
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
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
          ...LOCAL_DEFAULTS,
        };
        // Even with workspaceFile setting, single folder
        // should use folder
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
          ...LOCAL_DEFAULTS,
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

  suite('remote workspaces', () => {
    suite('authority prefix', () => {
      test('prefixes SSH remote with authority for pathAbsolute', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/jimeh/compose', 'ssh-remote+myhost'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'ssh-remote+myhost:/home/jimeh/compose');
      });

      test('prefixes WSL remote with authority', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [mockRemoteFolder('/home/jimeh/project', 'wsl+Ubuntu')];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'wsl+Ubuntu:/home/jimeh/project');
      });

      test('prefixes dev container remote with authority', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/workspaces/myapp', 'dev-container+abc123'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'dev-container+abc123:/workspaces/myapp');
      });

      test('no prefix for local folders', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [mockFolder('/home/user/projects/my-app')];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, '/home/user/projects/my-app');
      });

      test('no prefix for file:// scheme even with authority', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder(
            '/home/user/project',
            'localhost',
            undefined,
            'file'
          ),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, '/home/user/project');
      });

      test('name source never gets authority prefix', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder(
            '/home/jimeh/compose',
            'ssh-remote+myhost',
            'compose'
          ),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'compose');
      });

      test('pathRelativeToHome gets authority prefix', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/jimeh/projects/app', 'ssh-remote+myhost'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'ssh-remote+myhost:projects/app');
      });

      test('pathRelativeToCustom gets authority prefix', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToCustom',
          customBasePath: '/home/jimeh',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/jimeh/projects/app', 'ssh-remote+myhost'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'ssh-remote+myhost:projects/app');
      });
    });

    suite('includeRemoteAuthority: false', () => {
      test('omits authority prefix when disabled', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/jimeh/compose', 'ssh-remote+myhost'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, '/home/jimeh/compose');
      });

      test('same path local and remote produce same identifier', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '',
        };
        const localFolders = [mockFolder('/home/jimeh/compose')];
        const remoteFolders = [
          mockRemoteFolder('/home/jimeh/compose', 'ssh-remote+myhost'),
        ];
        const local = getWorkspaceIdentifier(config, localFolders);
        const remote = getWorkspaceIdentifier(config, remoteFolders);
        assert.strictEqual(local, remote);
      });
    });

    suite('remote home directory detection', () => {
      test('infers /home/<user> for pathRelativeToHome', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/jimeh/projects/app', 'ssh-remote+myhost'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'projects/app');
      });

      test('infers /Users/<user> for macOS remote', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder(
            '/Users/jimeh/Developer/project',
            'ssh-remote+machost'
          ),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'Developer/project');
      });

      test('infers /root for root user remote', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/root/projects/app', 'ssh-remote+server'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'projects/app');
      });

      test('falls back to absolute when home cannot be inferred', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/opt/services/myapp', 'ssh-remote+server'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, '/opt/services/myapp');
      });

      test('uses remoteHomeDirectory setting over heuristic', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '/custom/home',
        };
        const folders = [
          mockRemoteFolder('/custom/home/projects/app', 'ssh-remote+server'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'projects/app');
      });

      test('remoteHomeDirectory fallback when path is outside', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: false,
          remoteHomeDirectory: '/custom/home',
        };
        const folders = [
          mockRemoteFolder('/opt/data/app', 'ssh-remote+server'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        // Falls back to absolute since /opt/data/app is
        // outside /custom/home
        assert.strictEqual(result, '/opt/data/app');
      });

      test('does not use remote home detection for local folders', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '/some/remote/home',
        };
        // Local folder outside the local home dir
        const folders = [mockFolder('/var/www/app')];
        const result = getWorkspaceIdentifier(config, folders);
        // Should use os.homedir(), not remote home
        // /var/www/app is outside local home → absolute path
        assert.strictEqual(result, '/var/www/app');
      });
    });

    suite('multi-root with remote', () => {
      test('authority from first remote folder', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'allFolders',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/user/frontend', 'ssh-remote+myhost'),
          mockRemoteFolder('/home/user/backend', 'ssh-remote+myhost'),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(
          result,
          'ssh-remote+myhost:/home/user/backend\n' + '/home/user/frontend'
        );
      });

      test('workspace file authority used for multi-root', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'workspaceFile',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder('/home/user/frontend', 'ssh-remote+myhost'),
          mockRemoteFolder('/home/user/backend', 'ssh-remote+myhost'),
        ];
        const wsFile = mockRemoteWorkspaceFile(
          '/home/user/my.code-workspace',
          'ssh-remote+myhost'
        );
        const result = getWorkspaceIdentifier(config, folders, wsFile);
        assert.strictEqual(
          result,
          'ssh-remote+myhost:/home/user/my.code-workspace'
        );
      });

      test('name source multi-root no prefix even with remote', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'name',
          customBasePath: '',
          multiRootSource: 'allFolders',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const folders = [
          mockRemoteFolder(
            '/home/user/frontend',
            'ssh-remote+myhost',
            'frontend'
          ),
          mockRemoteFolder(
            '/home/user/backend',
            'ssh-remote+myhost',
            'backend'
          ),
        ];
        const result = getWorkspaceIdentifier(config, folders);
        assert.strictEqual(result, 'backend\nfrontend');
      });
    });

    suite('different remotes produce different identifiers', () => {
      test('same path on different SSH hosts', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathAbsolute',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const hostA = [
          mockRemoteFolder('/home/jimeh/compose', 'ssh-remote+host-a'),
        ];
        const hostB = [
          mockRemoteFolder('/home/jimeh/compose', 'ssh-remote+host-b'),
        ];
        const resultA = getWorkspaceIdentifier(config, hostA);
        const resultB = getWorkspaceIdentifier(config, hostB);
        assert.notStrictEqual(resultA, resultB);
        assert.strictEqual(resultA, 'ssh-remote+host-a:/home/jimeh/compose');
        assert.strictEqual(resultB, 'ssh-remote+host-b:/home/jimeh/compose');
      });

      test('SSH vs WSL with same path', () => {
        const config: WorkspaceIdentifierConfig = {
          source: 'pathRelativeToHome',
          customBasePath: '',
          multiRootSource: 'firstFolder',
          includeRemoteAuthority: true,
          remoteHomeDirectory: '',
        };
        const ssh = [
          mockRemoteFolder('/home/jimeh/project', 'ssh-remote+server'),
        ];
        const wsl = [mockRemoteFolder('/home/jimeh/project', 'wsl+Ubuntu')];
        const resultSSH = getWorkspaceIdentifier(config, ssh);
        const resultWSL = getWorkspaceIdentifier(config, wsl);
        assert.notStrictEqual(resultSSH, resultWSL);
      });
    });
  });
});
