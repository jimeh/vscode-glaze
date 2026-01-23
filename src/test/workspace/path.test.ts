import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import {
  normalizePath,
  expandTilde,
  getRelativePath,
} from '../../workspace/path';

suite('normalizePath', () => {
  test('converts backslashes to forward slashes', () => {
    assert.strictEqual(normalizePath('foo\\bar\\baz'), 'foo/bar/baz');
  });

  test('leaves forward slashes unchanged', () => {
    assert.strictEqual(normalizePath('foo/bar/baz'), 'foo/bar/baz');
  });

  test('handles empty string', () => {
    assert.strictEqual(normalizePath(''), '');
  });

  test('handles mixed separators', () => {
    assert.strictEqual(normalizePath('foo\\bar/baz\\qux'), 'foo/bar/baz/qux');
  });

  test('handles Windows-style absolute path', () => {
    assert.strictEqual(
      normalizePath('C:\\Users\\name\\project'),
      'C:/Users/name/project'
    );
  });

  test('handles path with no separators', () => {
    assert.strictEqual(normalizePath('filename.txt'), 'filename.txt');
  });
});

suite('expandTilde', () => {
  test('expands ~ at start of path', () => {
    const result = expandTilde('~/projects');
    const expected = path.join(os.homedir(), 'projects');
    assert.strictEqual(result, expected);
  });

  test('expands lone tilde', () => {
    const result = expandTilde('~');
    assert.strictEqual(result, os.homedir());
  });

  test('leaves path without tilde unchanged', () => {
    assert.strictEqual(expandTilde('/usr/local/bin'), '/usr/local/bin');
  });

  test('leaves tilde in middle of path unchanged', () => {
    assert.strictEqual(expandTilde('/path/to/~user'), '/path/to/~user');
  });

  test('handles empty string', () => {
    assert.strictEqual(expandTilde(''), '');
  });

  test('expands ~/ with nested path', () => {
    const result = expandTilde('~/a/b/c');
    const expected = path.join(os.homedir(), 'a', 'b', 'c');
    assert.strictEqual(result, expected);
  });
});

suite('getRelativePath', () => {
  test('returns relative path when target is within base', () => {
    const base = '/home/user';
    const target = '/home/user/projects/my-app';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, 'projects/my-app');
  });

  test('returns undefined when target is outside base', () => {
    const base = '/home/user/projects';
    const target = '/var/log';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, undefined);
  });

  test('returns dot when target equals base', () => {
    const base = '/home/user/projects';
    const target = '/home/user/projects';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, '.');
  });

  test('handles trailing slashes in base', () => {
    const base = '/home/user/';
    const target = '/home/user/projects';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, 'projects');
  });

  test('returns undefined for sibling directories', () => {
    const base = '/home/user/projects';
    const target = '/home/user/documents';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, undefined);
  });

  test('returns undefined when target is parent of base', () => {
    const base = '/home/user/projects';
    const target = '/home/user';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, undefined);
  });

  test('handles deeply nested paths', () => {
    const base = '/home/user';
    const target = '/home/user/a/b/c/d/e';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, 'a/b/c/d/e');
  });

  test('returns undefined for paths that share prefix but not directory', () => {
    // /home/user-admin is not inside /home/user
    const base = '/home/user';
    const target = '/home/user-admin/projects';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, undefined);
  });

  test('handles single level relative path', () => {
    const base = '/home/user';
    const target = '/home/user/projects';
    const result = getRelativePath(base, target);
    assert.strictEqual(result, 'projects');
  });
});
