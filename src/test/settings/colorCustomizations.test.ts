import * as assert from 'assert';
import {
  PATINA_ACTIVE_KEY,
  PATINA_ACTIVE_VALUE,
  type ColorCustomizations,
  mergeColorCustomizations,
  removePatinaColors,
  hasPatinaColorsWithoutMarker,
} from '../../settings/colorCustomizations';

suite('mergeColorCustomizations', () => {
  test('returns Patina colors when existing is undefined', () => {
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
      'statusBar.background': '#445566',
    };

    const result = mergeColorCustomizations(undefined, patinaColors);

    assert.deepStrictEqual(result, {
      ...patinaColors,
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
    });
  });

  test('returns Patina colors when existing is empty', () => {
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations({}, patinaColors);

    assert.deepStrictEqual(result, {
      ...patinaColors,
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
    });
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
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
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
    assert.strictEqual(result[PATINA_ACTIVE_KEY], PATINA_ACTIVE_VALUE);
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
    assert.strictEqual(result[PATINA_ACTIVE_KEY], PATINA_ACTIVE_VALUE);
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
      'sideBar.background': '#999999',
      'sideBar.foreground': '#aaaaaa',
      'sideBarSectionHeader.background': '#bbbbbb',
      'sideBarSectionHeader.foreground': '#cccccc',
      'editor.background': '#aabbcc',
    };
    const patinaColors = {
      'titleBar.activeBackground': '#newcolor',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    // 3 keys: titleBar.activeBackground, editor.background, patina.active
    assert.strictEqual(Object.keys(result).length, 3);
    assert.strictEqual(result['titleBar.activeBackground'], '#newcolor');
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result[PATINA_ACTIVE_KEY], PATINA_ACTIVE_VALUE);
  });

  test('preserves theme-scoped block during merge', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': { 'editor.background': '#1e1e1e' },
      'editor.background': '#aabbcc',
    };
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    assert.deepStrictEqual(result['[Monokai]'], {
      'editor.background': '#1e1e1e',
    });
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result['titleBar.activeBackground'], '#112233');
    assert.strictEqual(result[PATINA_ACTIVE_KEY], PATINA_ACTIVE_VALUE);
  });

  test('preserves multiple theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': { 'editor.background': '#1e1e1e' },
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    };
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    assert.deepStrictEqual(result['[Monokai]'], {
      'editor.background': '#1e1e1e',
    });
    assert.deepStrictEqual(result['[Solarized Dark]'], {
      'editor.foreground': '#abcdef',
    });
  });

  test('preserves non-string top-level values', () => {
    const existing: ColorCustomizations = {
      'editor.background': '#aabbcc',
      someNonStringKey: 42,
    };
    const patinaColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    assert.strictEqual(result['someNonStringKey'], 42);
    assert.strictEqual(result['editor.background'], '#aabbcc');
  });

  test('preserves theme-scoped block containing Patina key names', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
        'statusBar.background': '#mono222',
      },
    };
    const patinaColors = {
      'titleBar.activeBackground': '#patina111',
    };

    const result = mergeColorCustomizations(existing, patinaColors);

    // Theme-scoped block preserved intact — not stripped
    assert.deepStrictEqual(result['[Monokai]'], {
      'titleBar.activeBackground': '#mono111',
      'statusBar.background': '#mono222',
    });
    assert.strictEqual(result['titleBar.activeBackground'], '#patina111');
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
      'sideBar.background': '#999999',
      'sideBar.foreground': '#aaaaaa',
      'sideBarSectionHeader.background': '#bbbbbb',
      'sideBarSectionHeader.foreground': '#cccccc',
      'editor.background': '#aabbcc',
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
    });
  });

  test('removes patina.active marker key', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
      'editor.background': '#aabbcc',
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
    });
  });

  test('returns undefined when only marker and managed keys exist', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
    };

    const result = removePatinaColors(existing);

    assert.strictEqual(result, undefined);
  });

  test('preserves theme-scoped block when Patina keys removed', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
      '[Monokai]': { 'editor.background': '#1e1e1e' },
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      '[Monokai]': { 'editor.background': '#1e1e1e' },
    });
  });

  test('preserves theme-scoped block with nested Patina key names', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
      },
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      '[Monokai]': { 'titleBar.activeBackground': '#mono111' },
    });
  });

  test('preserves non-string values during remove', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      someNonStringKey: 42,
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, { someNonStringKey: 42 });
  });

  test('returns theme-scoped block as only remaining content', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    };

    const result = removePatinaColors(existing);

    assert.deepStrictEqual(result, {
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    });
  });
});

suite('hasPatinaColorsWithoutMarker', () => {
  test('returns false for undefined', () => {
    assert.strictEqual(hasPatinaColorsWithoutMarker(undefined), false);
  });

  test('returns false for empty object', () => {
    assert.strictEqual(hasPatinaColorsWithoutMarker({}), false);
  });

  test('returns false for non-Patina-only keys', () => {
    const existing = {
      'editor.background': '#aabbcc',
      'sideBar.border': '#ddeeff',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), false);
  });

  test('returns false when marker present alongside managed keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
      [PATINA_ACTIVE_KEY]: PATINA_ACTIVE_VALUE,
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), false);
  });

  test('returns true when managed keys present without marker', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), true);
  });

  test('returns true when managed keys mixed with non-Patina keys without marker', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'editor.background': '#aabbcc',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), true);
  });

  test('returns true when marker key exists with wrong value', () => {
    const existing = {
      [PATINA_ACTIVE_KEY]: '#000000',
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), true);
  });

  test('returns false when managed keys only inside theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
        'statusBar.background': '#mono222',
      },
      'editor.background': '#aabbcc',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), false);
  });

  test('returns true when top-level managed keys alongside theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
      },
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), true);
  });

  test('returns true when marker value is non-string', () => {
    const existing: ColorCustomizations = {
      [PATINA_ACTIVE_KEY]: { nested: true },
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasPatinaColorsWithoutMarker(existing), true);
  });
});
