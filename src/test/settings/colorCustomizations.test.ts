import * as assert from 'assert';
import {
  GLAZE_ACTIVE_KEY,
  GLAZE_ACTIVE_VALUE,
  type ColorCustomizations,
  mergeColorCustomizations,
  removeGlazeColors,
  hasGlazeColorsWithoutMarker,
} from '../../settings/colorCustomizations';

suite('mergeColorCustomizations', () => {
  test('returns Glaze colors when existing is undefined', () => {
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
      'statusBar.background': '#445566',
    };

    const result = mergeColorCustomizations(undefined, glazeColors);

    assert.deepStrictEqual(result, {
      ...glazeColors,
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
    });
  });

  test('returns Glaze colors when existing is empty', () => {
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations({}, glazeColors);

    assert.deepStrictEqual(result, {
      ...glazeColors,
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
    });
  });

  test('preserves non-Glaze keys', () => {
    const existing = {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
      'titleBar.activeBackground': '#112233',
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
    });
  });

  test('overwrites existing Glaze keys', () => {
    const existing = {
      'titleBar.activeBackground': '#old111',
      'editor.background': '#aabbcc',
    };
    const glazeColors = {
      'titleBar.activeBackground': '#new222',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    assert.strictEqual(result['titleBar.activeBackground'], '#new222');
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], GLAZE_ACTIVE_VALUE);
  });

  test('removes old Glaze keys not in new palette', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'titleBar.activeForeground': '#222222',
      'statusBar.background': '#333333',
      'editor.background': '#aabbcc',
    };
    const glazeColors = {
      'titleBar.activeBackground': '#444444',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    assert.strictEqual(result['titleBar.activeBackground'], '#444444');
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result['titleBar.activeForeground'], undefined);
    assert.strictEqual(result['statusBar.background'], undefined);
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], GLAZE_ACTIVE_VALUE);
  });

  test('handles all Glaze-managed keys', () => {
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
    const glazeColors = {
      'titleBar.activeBackground': '#newcolor',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    // 3 keys: titleBar.activeBackground, editor.background, glaze.active
    assert.strictEqual(Object.keys(result).length, 3);
    assert.strictEqual(result['titleBar.activeBackground'], '#newcolor');
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], GLAZE_ACTIVE_VALUE);
  });

  test('preserves theme-scoped block during merge', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': { 'editor.background': '#1e1e1e' },
      'editor.background': '#aabbcc',
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    assert.deepStrictEqual(result['[Monokai]'], {
      'editor.background': '#1e1e1e',
    });
    assert.strictEqual(result['editor.background'], '#aabbcc');
    assert.strictEqual(result['titleBar.activeBackground'], '#112233');
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], GLAZE_ACTIVE_VALUE);
  });

  test('preserves multiple theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': { 'editor.background': '#1e1e1e' },
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

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
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    assert.strictEqual(result['someNonStringKey'], 42);
    assert.strictEqual(result['editor.background'], '#aabbcc');
  });

  test('preserves theme-scoped block containing Glaze key names', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
        'statusBar.background': '#mono222',
      },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#glaze111',
    };

    const result = mergeColorCustomizations(existing, glazeColors);

    // Theme-scoped block preserved intact — not stripped
    assert.deepStrictEqual(result['[Monokai]'], {
      'titleBar.activeBackground': '#mono111',
      'statusBar.background': '#mono222',
    });
    assert.strictEqual(result['titleBar.activeBackground'], '#glaze111');
  });
});

suite('removeGlazeColors', () => {
  test('returns undefined when existing is undefined', () => {
    const result = removeGlazeColors(undefined);

    assert.strictEqual(result, undefined);
  });

  test('returns undefined when existing is empty', () => {
    const result = removeGlazeColors({});

    assert.strictEqual(result, undefined);
  });

  test('returns undefined when only Glaze keys exist', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
    };

    const result = removeGlazeColors(existing);

    assert.strictEqual(result, undefined);
  });

  test('preserves non-Glaze keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
    });
  });

  test('removes all Glaze-managed keys', () => {
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

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
    });
  });

  test('removes glaze.active marker key', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
      'editor.background': '#aabbcc',
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
    });
  });

  test('returns undefined when only marker and managed keys exist', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
    };

    const result = removeGlazeColors(existing);

    assert.strictEqual(result, undefined);
  });

  test('preserves theme-scoped block when Glaze keys removed', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
      '[Monokai]': { 'editor.background': '#1e1e1e' },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      '[Monokai]': { 'editor.background': '#1e1e1e' },
    });
  });

  test('preserves theme-scoped block with nested Glaze key names', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
      },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      '[Monokai]': { 'titleBar.activeBackground': '#mono111' },
    });
  });

  test('preserves non-string values during remove', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      someNonStringKey: 42,
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, { someNonStringKey: 42 });
  });

  test('returns theme-scoped block as only remaining content', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    });
  });
});

suite('hasGlazeColorsWithoutMarker', () => {
  test('returns false for undefined', () => {
    assert.strictEqual(hasGlazeColorsWithoutMarker(undefined), false);
  });

  test('returns false for empty object', () => {
    assert.strictEqual(hasGlazeColorsWithoutMarker({}), false);
  });

  test('returns false for non-Glaze-only keys', () => {
    const existing = {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), false);
  });

  test('returns false when marker present alongside managed keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
      [GLAZE_ACTIVE_KEY]: GLAZE_ACTIVE_VALUE,
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), false);
  });

  test('returns true when managed keys present without marker', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns true when managed keys mixed with non-Glaze keys without marker', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'editor.background': '#aabbcc',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns true when marker key exists with wrong value', () => {
    const existing = {
      [GLAZE_ACTIVE_KEY]: '#000000',
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns false when managed keys only inside theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
        'statusBar.background': '#mono222',
      },
      'editor.background': '#aabbcc',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), false);
  });

  test('returns true when top-level managed keys alongside theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      '[Monokai]': {
        'titleBar.activeBackground': '#mono111',
      },
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns true when marker value is non-string', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: { nested: true },
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });
});
