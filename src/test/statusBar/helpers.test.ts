import * as assert from 'assert';
import {
  buildColorTable,
  buildPropertiesTable,
  capitalizeFirst,
  colorCopyLink,
  colorSwatch,
  colorTableRow,
  escapeForMarkdown,
  formatWorkspaceIdForDisplay,
  getStatusText,
  getThemeModeLabel,
  isEffectivelyEnabled,
  isTintActive,
} from '../../statusBar';

suite('isEffectivelyEnabled', () => {
  test('returns false when globalEnabled is false and no override', () => {
    const result = isEffectivelyEnabled(false, undefined);
    assert.strictEqual(result, false);
  });

  test('returns false when workspace override is false', () => {
    const result = isEffectivelyEnabled(true, false);
    assert.strictEqual(result, false);
  });

  test('returns true when globalEnabled and no override', () => {
    const result = isEffectivelyEnabled(true, undefined);
    assert.strictEqual(result, true);
  });

  test('returns true when both globalEnabled and override true', () => {
    const result = isEffectivelyEnabled(true, true);
    assert.strictEqual(result, true);
  });

  test('returns true when globalEnabled false but override true', () => {
    const result = isEffectivelyEnabled(false, true);
    assert.strictEqual(result, true);
  });
});

suite('getStatusText', () => {
  test('returns "Disabled globally" when globalEnabled false and no override', () => {
    const result = getStatusText(false, undefined);
    assert.strictEqual(result, 'Disabled globally');
  });

  test('returns "Disabled for this workspace" when override is false', () => {
    const result = getStatusText(true, false);
    assert.strictEqual(result, 'Disabled for this workspace');
  });

  test('returns "Enabled (Global + Workspace)" when both enabled', () => {
    const result = getStatusText(true, true);
    assert.strictEqual(result, 'Enabled (Global + Workspace)');
  });

  test('returns "Enabled globally" when globalEnabled and no override', () => {
    const result = getStatusText(true, undefined);
    assert.strictEqual(result, 'Enabled globally');
  });

  test('returns "Enabled for this workspace" when global off but override on', () => {
    const result = getStatusText(false, true);
    assert.strictEqual(result, 'Enabled for this workspace');
  });

  test('returns "Disabled globally" when global off and override false', () => {
    const result = getStatusText(false, false);
    assert.strictEqual(result, 'Disabled for this workspace');
  });
});

suite('getThemeModeLabel', () => {
  test('returns "Auto (Dark)" for dark theme with auto-detection', () => {
    const result = getThemeModeLabel('dark', true);
    assert.strictEqual(result, 'Auto (Dark)');
  });

  test('returns "Auto (Light)" for light theme with auto-detection', () => {
    const result = getThemeModeLabel('light', true);
    assert.strictEqual(result, 'Auto (Light)');
  });

  test('returns "Dark" for dark theme without auto-detection', () => {
    const result = getThemeModeLabel('dark', false);
    assert.strictEqual(result, 'Dark');
  });

  test('returns "Light" for light theme without auto-detection', () => {
    const result = getThemeModeLabel('light', false);
    assert.strictEqual(result, 'Light');
  });

  test('returns "Auto (HcDark)" for hcDark theme with auto-detection', () => {
    const result = getThemeModeLabel('hcDark', true);
    assert.strictEqual(result, 'Auto (HcDark)');
  });

  test('returns "HcDark" for hcDark theme without auto-detection', () => {
    const result = getThemeModeLabel('hcDark', false);
    assert.strictEqual(result, 'HcDark');
  });

  test('returns "Auto (HcLight)" for hcLight theme with auto-detection', () => {
    const result = getThemeModeLabel('hcLight', true);
    assert.strictEqual(result, 'Auto (HcLight)');
  });

  test('returns "HcLight" for hcLight theme without auto-detection', () => {
    const result = getThemeModeLabel('hcLight', false);
    assert.strictEqual(result, 'HcLight');
  });
});

suite('colorSwatch', () => {
  test('generates HTML span with background color', () => {
    const result = colorSwatch('#ff0000');
    assert.strictEqual(
      result,
      '<span style="background-color:#ff0000;border-radius:3px;">' +
        '&nbsp;&nbsp;&nbsp;&nbsp;</span>'
    );
  });

  test('handles uppercase hex colors', () => {
    const result = colorSwatch('#AABBCC');
    assert.strictEqual(
      result,
      '<span style="background-color:#AABBCC;border-radius:3px;">' +
        '&nbsp;&nbsp;&nbsp;&nbsp;</span>'
    );
  });

  test('preserves hex format exactly as provided', () => {
    const lower = colorSwatch('#abc123');
    const upper = colorSwatch('#ABC123');
    assert.ok(lower.includes('#abc123'));
    assert.ok(upper.includes('#ABC123'));
  });

  test('throws on invalid hex', () => {
    assert.throws(() => colorSwatch('not-a-hex'), /Invalid hex color/);
  });
});

suite('colorCopyLink', () => {
  test('contains copy icon and command link', () => {
    const result = colorCopyLink('#ff0000');
    assert.ok(result.includes('[$(copy)]'));
    assert.ok(result.includes('command:glaze.copyColor'));
  });

  test('includes encoded hex in command args', () => {
    const result = colorCopyLink('#AABBCC');
    const expectedArgs = encodeURIComponent(JSON.stringify('#AABBCC'));
    assert.ok(result.includes(expectedArgs));
  });

  test('throws on invalid hex', () => {
    assert.throws(() => colorCopyLink('not-a-hex'), /Invalid hex color/);
  });
});

suite('colorTableRow', () => {
  test('returns pipe-delimited row with label', () => {
    const result = colorTableRow('Base', '#ff0000');
    assert.ok(result.startsWith('| Base |'));
    assert.ok(result.endsWith('|'));
  });

  test('includes swatch, color name, and hex code', () => {
    const result = colorTableRow('Title Bar', '#ff0000');
    assert.ok(result.includes('background-color:#ff0000'));
    assert.ok(result.includes('`#ff0000`'));
    assert.ok(result.includes('"'));
  });

  test('includes copy command link', () => {
    const result = colorTableRow('Base', '#ff0000');
    assert.ok(result.includes('[$(copy)]'));
    assert.ok(result.includes('command:glaze.copyColor'));
  });
});

suite('buildColorTable', () => {
  test('includes header row and separator', () => {
    const result = buildColorTable({ baseTint: '#ff0000' });
    assert.ok(result.includes('| Element | Color | Hex | |'));
    assert.ok(result.includes('|:--|:--|:--|:--|'));
  });

  test('always includes base tint row', () => {
    const result = buildColorTable({ baseTint: '#ff0000' });
    assert.ok(result.includes('| Base |'));
  });

  test('includes only defined element rows', () => {
    const result = buildColorTable({
      baseTint: '#ff0000',
      titleBar: '#00ff00',
    });
    assert.ok(result.includes('| Base |'));
    assert.ok(result.includes('| Title Bar |'));
    assert.ok(!result.includes('| Activity Bar |'));
    assert.ok(!result.includes('| Side Bar |'));
    assert.ok(!result.includes('| Status Bar |'));
  });

  test('includes all element rows when all defined', () => {
    const result = buildColorTable({
      baseTint: '#ff0000',
      titleBar: '#00ff00',
      activityBar: '#0000ff',
      sideBar: '#ffff00',
      statusBar: '#ff00ff',
    });
    assert.ok(result.includes('| Base |'));
    assert.ok(result.includes('| Title Bar |'));
    assert.ok(result.includes('| Activity Bar |'));
    assert.ok(result.includes('| Side Bar |'));
    assert.ok(result.includes('| Status Bar |'));
  });

  test('rows are newline-separated', () => {
    const result = buildColorTable({
      baseTint: '#ff0000',
      titleBar: '#00ff00',
    });
    const lines = result.split('\n');
    // header + separator + 2 data rows
    assert.strictEqual(lines.length, 4);
  });
});

suite('buildPropertiesTable', () => {
  test('includes header row and separator', () => {
    const result = buildPropertiesTable([['Theme', 'Dark+']]);
    assert.ok(result.includes('| | |'));
    assert.ok(result.includes('|:--|:--|'));
  });

  test('renders label as bold in first column', () => {
    const result = buildPropertiesTable([['Theme', 'Dark+']]);
    assert.ok(result.includes('| **Theme** | Dark+ |'));
  });

  test('renders multiple rows', () => {
    const result = buildPropertiesTable([
      ['Theme', 'Dark+'],
      ['Style', 'Pastel'],
      ['Seed', '`42`'],
    ]);
    const lines = result.split('\n');
    // header + separator + 3 data rows
    assert.strictEqual(lines.length, 5);
    assert.ok(result.includes('| **Theme** | Dark+ |'));
    assert.ok(result.includes('| **Style** | Pastel |'));
    assert.ok(result.includes('| **Seed** | `42` |'));
  });

  test('renders empty rows array with just header', () => {
    const result = buildPropertiesTable([]);
    const lines = result.split('\n');
    assert.strictEqual(lines.length, 2);
  });
});

suite('capitalizeFirst', () => {
  test('capitalizes normal string', () => {
    const result = capitalizeFirst('hello');
    assert.strictEqual(result, 'Hello');
  });

  test('returns empty string for empty input', () => {
    const result = capitalizeFirst('');
    assert.strictEqual(result, '');
  });

  test('handles single character', () => {
    const result = capitalizeFirst('a');
    assert.strictEqual(result, 'A');
  });

  test('leaves already capitalized string unchanged', () => {
    const result = capitalizeFirst('Hello');
    assert.strictEqual(result, 'Hello');
  });

  test('only capitalizes first character', () => {
    const result = capitalizeFirst('hELLO');
    assert.strictEqual(result, 'HELLO');
  });
});

suite('escapeForMarkdown', () => {
  test('escapes HTML angle brackets', () => {
    assert.strictEqual(
      escapeForMarkdown('<script>alert(1)</script>'),
      '\\<script\\>alert\\(1\\)\\</script\\>'
    );
  });

  test('escapes markdown syntax characters', () => {
    assert.strictEqual(
      escapeForMarkdown('**bold** _italic_ ~strike~'),
      '\\*\\*bold\\*\\* \\_italic\\_ \\~strike\\~'
    );
  });

  test('escapes markdown command links', () => {
    assert.strictEqual(
      escapeForMarkdown('[click](command:evil.run)'),
      '\\[click\\]\\(command:evil.run\\)'
    );
  });

  test('escapes backticks', () => {
    assert.strictEqual(escapeForMarkdown('`code`'), '\\`code\\`');
  });

  test('escapes ampersand and pipe', () => {
    assert.strictEqual(escapeForMarkdown('a & b | c'), 'a \\& b \\| c');
  });

  test('escapes backslashes', () => {
    assert.strictEqual(
      escapeForMarkdown('path\\to\\file'),
      'path\\\\to\\\\file'
    );
  });

  test('passes through safe strings unchanged', () => {
    assert.strictEqual(escapeForMarkdown('One Dark Pro'), 'One Dark Pro');
  });

  test('passes through empty string', () => {
    assert.strictEqual(escapeForMarkdown(''), '');
  });

  test('escapes curly braces and exclamation mark', () => {
    assert.strictEqual(
      escapeForMarkdown('{value} !important'),
      '\\{value\\} \\!important'
    );
  });
});

suite('formatWorkspaceIdForDisplay', () => {
  test('wraps single folder in backticks inline', () => {
    const result = formatWorkspaceIdForDisplay('my-project');
    assert.strictEqual(result, '`my-project`');
  });

  test('formats two folders as comma-separated', () => {
    const result = formatWorkspaceIdForDisplay('backend\nfrontend');
    assert.strictEqual(result, '`backend`, `frontend`');
  });

  test('formats three or more folders as comma-separated', () => {
    const result = formatWorkspaceIdForDisplay('api\nweb\nshared\ntools');
    assert.strictEqual(result, '`api`, `web`, `shared`, `tools`');
  });

  test('handles empty string', () => {
    const result = formatWorkspaceIdForDisplay('');
    assert.strictEqual(result, '``');
  });

  test('replaces backticks with single quotes', () => {
    const result = formatWorkspaceIdForDisplay('my`project');
    assert.strictEqual(result, "`my'project`");
  });

  test('replaces backticks in multi-folder names', () => {
    const result = formatWorkspaceIdForDisplay('back`end\nfront`end');
    assert.strictEqual(result, "`back'end`, `front'end`");
  });
});

suite('isTintActive', () => {
  test('returns true when all conditions met', () => {
    assert.strictEqual(isTintActive(true, undefined, 'ws', true), true);
  });

  test('returns false when globally disabled', () => {
    assert.strictEqual(isTintActive(false, undefined, 'ws', true), false);
  });

  test('returns false when workspace override disables', () => {
    assert.strictEqual(isTintActive(true, false, 'ws', true), false);
  });

  test('returns false when identifier is undefined', () => {
    assert.strictEqual(isTintActive(true, undefined, undefined, true), false);
  });

  test('returns false when no active targets', () => {
    assert.strictEqual(isTintActive(true, undefined, 'ws', false), false);
  });

  test('workspace override true overrides global false', () => {
    assert.strictEqual(isTintActive(false, true, 'ws', true), true);
  });

  test('returns false when all conditions fail', () => {
    assert.strictEqual(isTintActive(false, undefined, undefined, false), false);
  });
});
