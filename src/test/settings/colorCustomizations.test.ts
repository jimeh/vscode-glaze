import * as assert from 'assert';
import {
  mergeColorCustomizations,
  removePatinaColors,
} from '../../settings/colorCustomizations';

suite('mergeColorCustomizations', () => {
  test('returns Patina colors when existing is undefined', () => {
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
      'statusBar.background': '#445566',
    };

    const result = mergeColorCustomizations(undefined, patinaColors);

    assert.deepStrictEqual(result, patinaColors);
  });

  test('returns Patina colors when existing is empty', () => {
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations({}, patinaColors);

    assert.deepStrictEqual(result, patinaColors);
  });

  test('preserves non-Patina keys', () => {
    const existing = {
      'editor.background': '#aabbcc',
      'sideBar.border': '#ddeeff',
    };
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
      'sideBar.border': '#ddeeff',
      'titleBar.activeBackground': '#112233',
    });
  });

  test('overwrites existing Patina keys', () => {
    const existing = {
      'titleBar.activeBackground': '#old111',
      'editor.background': '#aabbcc',
    };
    const patinaColors = {
      'titleBar.activeBackground': '#new222',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    assert.strictEqual(result['titleBar.activeBackground'], '#new222');
    assert.strictEqual(result['editor.background'], '#aabbcc');
  });

  test('removes old Patina keys not in new palette', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'titleBar.activeForeground': '#222222',
      'statusBar.background': '#333333',
      'editor.background': '#aabbcc',
    };
    const patinaColors = {
      'titleBar.activeBackground': '#444444',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    assert.strictEqual(result['titleBar.activeBackground'], '#444444');
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result['titleBar.activeForeground'], undefined);
    assert.strictEqual(result['statusBar.background'], undefined);
  });

  test('handles all Patina-managed keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'titleBar.activeForeground': '#222222',
      'titleBar.inactiveBackground': '#333333',
      'titleBar.inactiveForeground': '#444444',
      'statusBar.background': '#555555',
      'statusBar.foreground': '#666666',
      'activityBar.background': '#777777',
      'activityBar.foreground': '#888888',
      'editor.background': '#aabbcc',
    };
    const patinaColors = {
      'titleBar.activeBackground': '#newcolor',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    // 2 keys: titleBar.activeBackground, editor.background
    assert.strictEqual(Object.keys(result).length, 2);
    assert.strictEqual(result['titleBar.activeBackground'], '#newcolor');
    assert.strictEqual(result['editor.background'], '#aabbcc');
  });
});

suite('removePatinaColors', () => {
  test('returns undefined when existing is undefined', () => {
    const result = removePatinaColors(undefined);

    assert.strictEqual(result, undefined);
  });

  test('returns undefined when existing is empty', () => {
    const result = removePatinaColors({});

    assert.strictEqual(result, undefined);
  });

  test('returns undefined when only Patina keys exist', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
    };

    const result = removePatinaColors(existing);

    assert.strictEqual(result, undefined);
  });

  test('preserves non-Patina keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'editor.background': '#aabbcc',
      'sideBar.border': '#ddeeff',
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
      'sideBar.border': '#ddeeff',
    });
  });

  test('removes all Patina-managed keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'titleBar.activeForeground': '#222222',
      'titleBar.inactiveBackground': '#333333',
      'titleBar.inactiveForeground': '#444444',
      'statusBar.background': '#555555',
      'statusBar.foreground': '#666666',
      'activityBar.background': '#777777',
      'activityBar.foreground': '#888888',
      'editor.background': '#aabbcc',
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
    });
  });
});
