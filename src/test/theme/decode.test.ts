import * as assert from 'assert';
import { createThemeLookup, type CompactThemeData } from '../../theme/decode';

suite('createThemeLookup', () => {
  const sampleData: CompactThemeData = {
    'Dark Theme': [0, '1E1E1E', 'D4D4D4', '323233', 'CCCCCC'],
    'Light Theme': [1, 'FFFFFF', '000000'],
    'HC Dark': [2, '000', 'FFF'],
    'HC Light': [3, 'FFF', '000'],
  };

  test('decodes dark theme type (index 0)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['Dark Theme']?.type, 'dark');
  });

  test('decodes light theme type (index 1)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['Light Theme']?.type, 'light');
  });

  test('decodes hcDark theme type (index 2)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['HC Dark']?.type, 'hcDark');
  });

  test('decodes hcLight theme type (index 3)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['HC Light']?.type, 'hcLight');
  });

  test('expands 3-char hex to 6-char with # prefix', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['HC Dark']!.colors;
    assert.strictEqual(colors['editor.background'], '#000000');
  });

  test('passes through 6-char hex with # prefix', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['Dark Theme']!.colors;
    assert.strictEqual(colors['editor.background'], '#1E1E1E');
  });

  test('maps optional color keys in order', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['Dark Theme']!.colors;
    // Index 1 = editor.foreground
    assert.strictEqual(colors['editor.foreground'], '#D4D4D4');
    // Index 2 = titleBar.activeBackground
    assert.strictEqual(colors['titleBar.activeBackground'], '#323233');
    // Index 3 = titleBar.activeForeground
    assert.strictEqual(colors['titleBar.activeForeground'], '#CCCCCC');
  });

  test('omits undefined optional colors', () => {
    const lookup = createThemeLookup(sampleData);
    const colors = lookup['Light Theme']!.colors;
    // Only editor.background and editor.foreground provided
    assert.strictEqual(colors['titleBar.activeBackground'], undefined);
    assert.strictEqual(colors['statusBar.background'], undefined);
  });

  test('returns undefined for missing theme', () => {
    const lookup = createThemeLookup(sampleData);
    assert.strictEqual(lookup['Nonexistent'], undefined);
  });

  test('caches decoded results (same reference)', () => {
    const lookup = createThemeLookup(sampleData);
    const first = lookup['Dark Theme'];
    const second = lookup['Dark Theme'];
    assert.strictEqual(first, second);
  });

  test('supports "in" operator (has trap)', () => {
    const lookup = createThemeLookup(sampleData);
    assert.ok('Dark Theme' in lookup);
    assert.ok('Light Theme' in lookup);
    assert.ok(!('Nonexistent' in lookup));
  });

  test('supports Object.keys (ownKeys trap)', () => {
    const lookup = createThemeLookup(sampleData);
    const keys = Object.keys(lookup);
    assert.deepStrictEqual(keys.sort(), [
      'Dark Theme',
      'HC Dark',
      'HC Light',
      'Light Theme',
    ]);
  });

  test('handles sparse color entries', () => {
    const sparse: CompactThemeData = {
      Sparse: [
        0,
        '1E1E1E',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        '21252B',
      ],
    };
    const lookup = createThemeLookup(sparse);
    const colors = lookup['Sparse']!.colors;
    assert.strictEqual(colors['editor.background'], '#1E1E1E');
    assert.strictEqual(colors['editor.foreground'], undefined);
    assert.strictEqual(colors['titleBar.activeBackground'], undefined);
    // Index 6 = titleBar.border
    assert.strictEqual(colors['titleBar.border'], '#21252B');
  });

  test('handles empty compact data', () => {
    const lookup = createThemeLookup({});
    assert.deepStrictEqual(Object.keys(lookup), []);
    assert.strictEqual(lookup['anything'], undefined);
  });

  test('decodes all color keys in grouped order', () => {
    const withAll: CompactThemeData = {
      'Full Theme': [
        0,
        '1E1E1E', // 0: editor.background
        'D4D4D4', // 1: editor.foreground
        '323233', // 2: titleBar.activeBackground
        'CCC', // 3: titleBar.activeForeground
        '2D2D2D', // 4: titleBar.inactiveBackground
        '999', // 5: titleBar.inactiveForeground
        '3C3C3C', // 6: titleBar.border
        '007ACC', // 7: statusBar.background
        'FFF', // 8: statusBar.foreground
        '007ACC', // 9: statusBar.border
        '007ACC', // 10: statusBar.focusBorder
        '333', // 11: activityBar.background
        'FFF', // 12: activityBar.foreground
        '444', // 13: activityBar.activeBackground
        '555', // 14: activityBar.activeBorder
        '181818', // 15: sideBar.background
        'CCC', // 16: sideBar.foreground
        '2A2A2A', // 17: sideBar.border
        '252526', // 18: sideBarSectionHeader.background
        'BBB', // 19: sideBarSectionHeader.foreground
        '353535', // 20: sideBarSectionHeader.border
      ],
    };
    const lookup = createThemeLookup(withAll);
    const colors = lookup['Full Theme']!.colors;
    assert.strictEqual(colors['editor.background'], '#1E1E1E');
    assert.strictEqual(colors['editor.foreground'], '#D4D4D4');
    assert.strictEqual(colors['titleBar.activeBackground'], '#323233');
    assert.strictEqual(colors['titleBar.activeForeground'], '#CCCCCC');
    assert.strictEqual(colors['titleBar.inactiveBackground'], '#2D2D2D');
    assert.strictEqual(colors['titleBar.inactiveForeground'], '#999999');
    assert.strictEqual(colors['titleBar.border'], '#3C3C3C');
    assert.strictEqual(colors['statusBar.background'], '#007ACC');
    assert.strictEqual(colors['statusBar.foreground'], '#FFFFFF');
    assert.strictEqual(colors['statusBar.border'], '#007ACC');
    assert.strictEqual(colors['statusBar.focusBorder'], '#007ACC');
    assert.strictEqual(colors['activityBar.background'], '#333333');
    assert.strictEqual(colors['activityBar.foreground'], '#FFFFFF');
    assert.strictEqual(colors['activityBar.activeBackground'], '#444444');
    assert.strictEqual(colors['activityBar.activeBorder'], '#555555');
    assert.strictEqual(colors['sideBar.background'], '#181818');
    assert.strictEqual(colors['sideBar.foreground'], '#CCCCCC');
    assert.strictEqual(colors['sideBar.border'], '#2A2A2A');
    assert.strictEqual(colors['sideBarSectionHeader.background'], '#252526');
    assert.strictEqual(colors['sideBarSectionHeader.foreground'], '#BBBBBB');
    assert.strictEqual(colors['sideBarSectionHeader.border'], '#353535');
  });

  test('decodes sparse entries with only sidebar keys', () => {
    const sidebarOnly: CompactThemeData = {
      'Sidebar Only': [
        0,
        '1E1E1E', // 0: editor.background
        undefined, // 1: editor.foreground
        undefined, // 2: titleBar.activeBackground
        undefined, // 3: titleBar.activeForeground
        undefined, // 4: titleBar.inactiveBackground
        undefined, // 5: titleBar.inactiveForeground
        undefined, // 6: titleBar.border
        undefined, // 7: statusBar.background
        undefined, // 8: statusBar.foreground
        undefined, // 9: statusBar.border
        undefined, // 10: statusBar.focusBorder
        undefined, // 11: activityBar.background
        undefined, // 12: activityBar.foreground
        undefined, // 13: activityBar.activeBackground
        undefined, // 14: activityBar.activeBorder
        'AAA', // 15: sideBar.background
        'BBB', // 16: sideBar.foreground
        'CCC', // 17: sideBar.border
        'DDD', // 18: sideBarSectionHeader.background
        'EEE', // 19: sideBarSectionHeader.foreground
        'F0F0F0', // 20: sideBarSectionHeader.border
      ],
    };
    const lookup = createThemeLookup(sidebarOnly);
    const colors = lookup['Sidebar Only']!.colors;
    assert.strictEqual(colors['editor.background'], '#1E1E1E');
    assert.strictEqual(colors['editor.foreground'], undefined);
    assert.strictEqual(colors['titleBar.border'], undefined);
    assert.strictEqual(colors['sideBar.background'], '#AAAAAA');
    assert.strictEqual(colors['sideBar.foreground'], '#BBBBBB');
    assert.strictEqual(colors['sideBar.border'], '#CCCCCC');
    assert.strictEqual(colors['sideBarSectionHeader.background'], '#DDDDDD');
    assert.strictEqual(colors['sideBarSectionHeader.foreground'], '#EEEEEE');
    assert.strictEqual(colors['sideBarSectionHeader.border'], '#F0F0F0');
  });

  test('decodes sparse sidebar (only sideBar.background)', () => {
    const sparseSidebar: CompactThemeData = {
      'Sparse Sidebar': [
        0,
        '1E1E1E', // 0: editor.background
        undefined, // 1: editor.foreground
        undefined, // 2: titleBar.activeBackground
        undefined, // 3: titleBar.activeForeground
        undefined, // 4: titleBar.inactiveBackground
        undefined, // 5: titleBar.inactiveForeground
        undefined, // 6: titleBar.border
        undefined, // 7: statusBar.background
        undefined, // 8: statusBar.foreground
        undefined, // 9: statusBar.border
        undefined, // 10: statusBar.focusBorder
        undefined, // 11: activityBar.background
        undefined, // 12: activityBar.foreground
        undefined, // 13: activityBar.activeBackground
        undefined, // 14: activityBar.activeBorder
        '252526', // 15: sideBar.background
      ],
    };
    const lookup = createThemeLookup(sparseSidebar);
    const colors = lookup['Sparse Sidebar']!.colors;
    assert.strictEqual(colors['sideBar.background'], '#252526');
    assert.strictEqual(colors['sideBar.foreground'], undefined);
    assert.strictEqual(colors['sideBarSectionHeader.background'], undefined);
  });

  test('editor.background is always present', () => {
    const lookup = createThemeLookup(sampleData);
    for (const name of Object.keys(sampleData)) {
      const info = lookup[name]!;
      assert.ok(
        info.colors['editor.background'],
        `${name}: editor.background should always be defined`
      );
    }
  });
});
