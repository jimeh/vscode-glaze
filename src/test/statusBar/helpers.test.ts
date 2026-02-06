import * as assert from 'assert';
import {
  capitalizeFirst,
  colorTableRow,
  colorSwatch,
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
      '<span style="background-color:#ff0000;border-radius:2px;">' +
        '&nbsp;&nbsp;&nbsp;</span>'
    );
  });

  test('handles uppercase hex colors', () => {
    const result = colorSwatch('#AABBCC');
    assert.strictEqual(
      result,
      '<span style="background-color:#AABBCC;border-radius:2px;">' +
        '&nbsp;&nbsp;&nbsp;</span>'
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

suite('colorTableRow', () => {
  test('returns pipe-delimited row with label, swatch, name, hex, copy', () => {
    const result = colorTableRow('Base', '#ff0000');
    assert.ok(result.startsWith('| Base |'));
    assert.ok(result.includes('background-color:#ff0000'));
    assert.ok(result.includes('`#ff0000`'));
    assert.ok(result.includes('[$(copy)]'));
    assert.ok(result.includes('command:patina.copyColor'));
  });

  test('includes encoded hex in command args', () => {
    const result = colorTableRow('Title Bar', '#AABBCC');
    const expectedArgs = encodeURIComponent(JSON.stringify('#AABBCC'));
    assert.ok(result.includes(expectedArgs));
  });

  test('preserves hex format in display', () => {
    const lower = colorTableRow('Test', '#abc123');
    const upper = colorTableRow('Test', '#ABC123');
    assert.ok(lower.includes('`#abc123`'));
    assert.ok(upper.includes('`#ABC123`'));
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

  test('formats two folders on separate lines', () => {
    const result = formatWorkspaceIdForDisplay('backend\nfrontend');
    assert.strictEqual(result, '<br>`backend`<br>`frontend`');
  });

  test('formats three or more folders on separate lines', () => {
    const result = formatWorkspaceIdForDisplay('api\nweb\nshared\ntools');
    assert.strictEqual(result, '<br>`api`<br>`web`<br>`shared`<br>`tools`');
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
    assert.strictEqual(result, "<br>`back'end`<br>`front'end`");
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
