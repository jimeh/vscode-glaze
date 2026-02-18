import * as assert from 'assert';
import {
  getWorkspaceIdentifier,
  type WorkspaceFolder,
  type WorkspaceFileUri,
  type GitRepoRootResolver,
} from '../../workspace/identifier';
import type { WorkspaceIdentifierConfig } from '../../config';

function mockFolder(
  fsPath: string,
  name = fsPath.split('/').pop() ?? 'workspace'
): WorkspaceFolder {
  return { uri: { fsPath }, name };
}

function mockWorkspaceFile(fsPath: string): WorkspaceFileUri {
  return { fsPath };
}

suite('getWorkspaceIdentifier (git root mode)', () => {
  test('uses resolved git root path for single-folder identifier', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathAbsolute',
      customBasePath: '',
      multiRootSource: 'firstFolder',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const folder = mockFolder('/worktrees/app-feature');
    const resolver: GitRepoRootResolver = async () => '/repos/app';

    const result = await getWorkspaceIdentifier(
      config,
      [folder],
      undefined,
      resolver
    );

    assert.strictEqual(result, '/repos/app');
  });

  test('falls back to folder path when git root cannot be resolved', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathAbsolute',
      customBasePath: '',
      multiRootSource: 'firstFolder',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const folder = mockFolder('/worktrees/app-feature');
    const resolver: GitRepoRootResolver = async () => undefined;

    const result = await getWorkspaceIdentifier(
      config,
      [folder],
      undefined,
      resolver
    );

    assert.strictEqual(result, '/worktrees/app-feature');
  });

  test('different worktree paths map to the same identifier', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathAbsolute',
      customBasePath: '',
      multiRootSource: 'firstFolder',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const resolver: GitRepoRootResolver = async () => '/repos/app';

    const resultA = await getWorkspaceIdentifier(
      config,
      [mockFolder('/worktrees/app-feature-a')],
      undefined,
      resolver
    );
    const resultB = await getWorkspaceIdentifier(
      config,
      [mockFolder('/worktrees/app-feature-b')],
      undefined,
      resolver
    );

    assert.strictEqual(resultA, '/repos/app');
    assert.strictEqual(resultB, '/repos/app');
    assert.strictEqual(resultA, resultB);
  });

  test('name source uses git root basename instead of custom folder name', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'name',
      customBasePath: '',
      multiRootSource: 'firstFolder',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const folder = mockFolder('/worktrees/app-feature', 'Feature Branch');
    const resolver: GitRepoRootResolver = async () => '/repos/app';

    const result = await getWorkspaceIdentifier(
      config,
      [folder],
      undefined,
      resolver
    );

    assert.strictEqual(result, 'app');
  });

  test('allFolders mode combines resolved roots across worktrees', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathAbsolute',
      customBasePath: '',
      multiRootSource: 'allFolders',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const folders = [
      mockFolder('/worktrees/app-feature-a'),
      mockFolder('/worktrees/app-feature-b'),
    ];

    const resolver: GitRepoRootResolver = async (folder) => {
      if (folder.uri.fsPath.includes('feature-a')) {
        return '/repos/shared';
      }
      return '/repos/shared';
    };

    const result = await getWorkspaceIdentifier(
      config,
      folders,
      undefined,
      resolver
    );

    assert.strictEqual(result, '/repos/shared\n/repos/shared');
  });

  test('workspaceFile mode remains path-based when workspace file exists', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'pathAbsolute',
      customBasePath: '',
      multiRootSource: 'workspaceFile',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const folders = [
      mockFolder('/worktrees/app-feature-a'),
      mockFolder('/worktrees/app-feature-b'),
    ];
    const workspaceFile = mockWorkspaceFile('/workspaces/team.code-workspace');

    let resolverCalls = 0;
    const resolver: GitRepoRootResolver = async () => {
      resolverCalls += 1;
      return '/repos/shared';
    };

    const result = await getWorkspaceIdentifier(
      config,
      folders,
      workspaceFile,
      resolver
    );

    assert.strictEqual(result, '/workspaces/team.code-workspace');
    assert.strictEqual(resolverCalls, 0);
  });

  test('workspaceFile mode falls back to git roots when file is unavailable', async () => {
    const config: WorkspaceIdentifierConfig = {
      source: 'name',
      customBasePath: '',
      multiRootSource: 'workspaceFile',
      includeRemoteAuthority: true,
      remoteHomeDirectory: '',
      useGitRepoRoot: true,
    };

    const folders = [
      mockFolder('/worktrees/app-feature-a'),
      mockFolder('/worktrees/app-feature-b'),
    ];
    const unavailableWorkspaceFile = mockWorkspaceFile('');

    const resolver: GitRepoRootResolver = async () => '/repos/shared';

    const result = await getWorkspaceIdentifier(
      config,
      folders,
      unavailableWorkspaceFile,
      resolver
    );

    assert.strictEqual(result, 'shared\nshared');
  });
});
