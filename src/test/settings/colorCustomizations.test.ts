import * as assert from 'assert';
import {
  GLAZE_ACTIVE_KEY,
  type ColorCustomizations,
  mergeColorCustomizations,
  removeGlazeColors,
  hasGlazeColorsWithoutMarker,
} from '../../settings/colorCustomizations';

const THEME = 'Default Dark Modern';
const THEME_KEY = `[${THEME}]`;
const OTHER_THEME = 'Monokai';
const OTHER_THEME_KEY = `[${OTHER_THEME}]`;

suite('mergeColorCustomizations', () => {
  test('returns theme-scoped block when existing is undefined', () => {
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
      'statusBar.background': '#445566',
    };

    const result = mergeColorCustomizations(undefined, glazeColors, THEME);

    assert.deepStrictEqual(result, {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        ...glazeColors,
      },
    });
  });

  test('returns theme-scoped block when existing is empty', () => {
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations({}, glazeColors, THEME);

    assert.deepStrictEqual(result, {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        ...glazeColors,
      },
    });
  });

  test('preserves root-level non-Glaze keys', () => {
    const existing = {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#112233',
      },
    });
  });

  test('removes root-level Glaze keys (migration)', () => {
    const existing = {
      'titleBar.activeBackground': '#old111',
      'editor.background': '#aabbcc',
      [GLAZE_ACTIVE_KEY]: '#ef5ec7', // old fixed-value marker
    };
    const glazeColors = {
      'titleBar.activeBackground': '#new222',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    // Root-level managed keys should be stripped
    assert.strictEqual(result['titleBar.activeBackground'], undefined);
    // Root marker should now be theme name
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], THEME);
    // Root non-Glaze preserved
    assert.strictEqual(result['editor.background'], '#aabbcc');
    // Theme block has new colors, no marker inside
    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['titleBar.activeBackground'], '#new222');
    assert.strictEqual(block[GLAZE_ACTIVE_KEY], undefined);
  });

  test('overwrites existing Glaze keys in theme block', () => {
    const existing = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#old111',
      },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#new222',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['titleBar.activeBackground'], '#new222');
    assert.strictEqual(block[GLAZE_ACTIVE_KEY], undefined);
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], THEME);
  });

  test('removes old Glaze keys not in new palette from theme block', () => {
    const existing = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
        'titleBar.activeForeground': '#222222',
        'statusBar.background': '#333333',
      },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#444444',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['titleBar.activeBackground'], '#444444');
    assert.strictEqual(block['titleBar.activeForeground'], undefined);
    assert.strictEqual(block['statusBar.background'], undefined);
    assert.strictEqual(block[GLAZE_ACTIVE_KEY], undefined);
  });

  test('preserves user keys inside current theme block', () => {
    const existing = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'editor.background': '#usercolor',
        'titleBar.activeBackground': '#old111',
      },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#new222',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['editor.background'], '#usercolor');
    assert.strictEqual(block['titleBar.activeBackground'], '#new222');
    assert.strictEqual(block[GLAZE_ACTIVE_KEY], undefined);
  });

  test('preserves user-owned theme blocks for other themes', () => {
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: { 'editor.background': '#1e1e1e' },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    assert.deepStrictEqual(result[OTHER_THEME_KEY], {
      'editor.background': '#1e1e1e',
    });
    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['titleBar.activeBackground'], '#112233');
  });

  test('strips Glaze keys from other theme blocks on theme change', () => {
    // Simulates: was on OTHER_THEME (Glaze-owned), now switching to THEME.
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: OTHER_THEME,
      [OTHER_THEME_KEY]: {
        'titleBar.activeBackground': '#mono111',
        'statusBar.background': '#mono222',
      },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#glaze111',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    // Old theme's Glaze keys should be removed, block empty → dropped
    assert.strictEqual(result[OTHER_THEME_KEY], undefined);
    // Root marker updated to new theme
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], THEME);
    // New theme block created
    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['titleBar.activeBackground'], '#glaze111');
    assert.strictEqual(block[GLAZE_ACTIVE_KEY], undefined);
  });

  test('preserves user keys in other Glaze-owned theme block on theme change', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: OTHER_THEME,
      [OTHER_THEME_KEY]: {
        'editor.background': '#usercolor',
        'titleBar.activeBackground': '#mono111',
      },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#glaze111',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    // Old theme block preserved with only user keys
    assert.deepStrictEqual(result[OTHER_THEME_KEY], {
      'editor.background': '#usercolor',
    });
    // New theme block created
    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(block['titleBar.activeBackground'], '#glaze111');
  });

  test('preserves multiple user-owned theme blocks', () => {
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: { 'editor.background': '#1e1e1e' },
      '[Solarized Dark]': { 'editor.foreground': '#abcdef' },
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    assert.deepStrictEqual(result[OTHER_THEME_KEY], {
      'editor.background': '#1e1e1e',
    });
    assert.deepStrictEqual(result['[Solarized Dark]'], {
      'editor.foreground': '#abcdef',
    });
  });

  test('preserves non-string root-level values', () => {
    const existing: ColorCustomizations = {
      'editor.background': '#aabbcc',
      someNonStringKey: 42,
    };
    const glazeColors = {
      'titleBar.activeBackground': '#112233',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    assert.strictEqual(result['someNonStringKey'], 42);
    assert.strictEqual(result['editor.background'], '#aabbcc');
  });

  test('handles all Glaze-managed keys being replaced', () => {
    const existing = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
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
      },
      'editor.background': '#aabbcc',
    };
    const glazeColors = {
      'titleBar.activeBackground': '#newcolor',
    };

    const result = mergeColorCustomizations(existing, glazeColors, THEME);

    // Root non-Glaze key preserved
    assert.strictEqual(result['editor.background'], '#aabbcc');
    // Root marker present
    assert.strictEqual(result[GLAZE_ACTIVE_KEY], THEME);
    // Theme block only has new color (no marker inside)
    const block = result[THEME_KEY] as Record<string, string>;
    assert.strictEqual(Object.keys(block).length, 1);
    assert.strictEqual(block['titleBar.activeBackground'], '#newcolor');
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

  test('returns undefined when only root-level Glaze keys exist', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
    };

    const result = removeGlazeColors(existing);

    assert.strictEqual(result, undefined);
  });

  test('preserves root-level non-Glaze keys', () => {
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

  test('removes all root-level Glaze-managed keys', () => {
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

  test('removes root-level glaze.active marker key', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      [GLAZE_ACTIVE_KEY]: THEME,
      'editor.background': '#aabbcc',
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      'editor.background': '#aabbcc',
    });
  });

  test('removes Glaze-owned theme block entirely when no user keys', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
        'statusBar.background': '#222222',
      },
    };

    const result = removeGlazeColors(existing);

    assert.strictEqual(result, undefined);
  });

  test('preserves user keys in Glaze-owned theme block', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'editor.background': '#usercolor',
        'titleBar.activeBackground': '#111111',
      },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      [THEME_KEY]: { 'editor.background': '#usercolor' },
    });
  });

  test('preserves user-owned theme blocks untouched', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
      },
      [OTHER_THEME_KEY]: { 'editor.background': '#1e1e1e' },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      [OTHER_THEME_KEY]: { 'editor.background': '#1e1e1e' },
    });
  });

  test('preserves user-owned block with Glaze key names', () => {
    // No root marker → block is not identified as Glaze-owned.
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: {
        'titleBar.activeBackground': '#mono111',
      },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      [OTHER_THEME_KEY]: { 'titleBar.activeBackground': '#mono111' },
    });
  });

  test('only removes the Glaze-owned block indicated by root marker', () => {
    // Root marker points to THEME, so only that block is cleaned up.
    // OTHER_THEME block is preserved even though it has managed keys.
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
      },
      [OTHER_THEME_KEY]: {
        'statusBar.background': '#222222',
      },
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, {
      [OTHER_THEME_KEY]: { 'statusBar.background': '#222222' },
    });
  });

  test('preserves non-string root values during remove', () => {
    const existing: ColorCustomizations = {
      'titleBar.activeBackground': '#111111',
      someNonStringKey: 42,
    };

    const result = removeGlazeColors(existing);

    assert.deepStrictEqual(result, { someNonStringKey: 42 });
  });

  test('returns undefined when only marker and managed keys exist in root', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      [GLAZE_ACTIVE_KEY]: THEME,
    };

    const result = removeGlazeColors(existing);

    assert.strictEqual(result, undefined);
  });
});

suite('hasGlazeColorsWithoutMarker', () => {
  test('returns false for undefined', () => {
    assert.strictEqual(hasGlazeColorsWithoutMarker(undefined), false);
  });

  test('returns false for empty object', () => {
    assert.strictEqual(hasGlazeColorsWithoutMarker({}), false);
  });

  test('returns false for non-Glaze-only root keys', () => {
    const existing = {
      'editor.background': '#aabbcc',
      'editor.lineHighlightBackground': '#ddeeff',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), false);
  });

  test('returns false when root marker present alongside root managed keys', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
      [GLAZE_ACTIVE_KEY]: THEME,
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), false);
  });

  test('returns true when root managed keys present without root marker', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'statusBar.background': '#222222',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns true when root managed keys mixed with non-Glaze keys without marker', () => {
    const existing = {
      'titleBar.activeBackground': '#111111',
      'editor.background': '#aabbcc',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns true when root marker key exists with empty string value', () => {
    const existing = {
      [GLAZE_ACTIVE_KEY]: '',
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns false when managed keys only inside user-owned theme blocks', () => {
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: {
        'titleBar.activeBackground': '#mono111',
        'statusBar.background': '#mono222',
      },
      'editor.background': '#aabbcc',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), false);
  });

  test('returns true when top-level managed keys alongside theme-scoped blocks', () => {
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: {
        'titleBar.activeBackground': '#mono111',
      },
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  test('returns true when root marker value is non-string', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: { nested: true },
      'titleBar.activeBackground': '#111111',
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing), true);
  });

  // Theme-scoped block detection (with themeName)
  test('returns false for Glaze-owned current theme block', () => {
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
      },
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing, THEME), false);
  });

  test('returns true when current theme block has managed keys without marker', () => {
    const existing: ColorCustomizations = {
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
        'statusBar.background': '#222222',
      },
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing, THEME), true);
  });

  test('returns false when current theme block has no managed keys', () => {
    const existing: ColorCustomizations = {
      [THEME_KEY]: {
        'editor.background': '#111111',
      },
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing, THEME), false);
  });

  test('returns false when current theme block does not exist', () => {
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
      },
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing, THEME), false);
  });

  test('does not check non-current theme blocks for managed keys', () => {
    // Other theme block has managed keys without marker, but
    // since it's not the current theme, it should be ignored.
    const existing: ColorCustomizations = {
      [OTHER_THEME_KEY]: {
        'titleBar.activeBackground': '#mono111',
      },
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing, THEME), false);
  });

  test('returns true when root marker points to different theme', () => {
    // Root marker says Glaze owns OTHER_THEME, but THEME block
    // has managed keys — someone else wrote them.
    const existing: ColorCustomizations = {
      [GLAZE_ACTIVE_KEY]: OTHER_THEME,
      [THEME_KEY]: {
        'titleBar.activeBackground': '#111111',
      },
    };
    assert.strictEqual(hasGlazeColorsWithoutMarker(existing, THEME), true);
  });
});
