import * as assert from 'assert';
import {
  capitalizeFirst,
  clickableColorSwatch,
  colorSwatch,
  formatWorkspaceIdForDisplay,
  getStatusText,
  getThemeModeLabel,
  isEffectivelyEnabled,
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

suite('clickableColorSwatch', () => {
  test('generates swatch with copy icon command link', () => {
    const result = clickableColorSwatch('#ff0000');
    assert.ok(result.includes('background-color:#ff0000'));
    assert.ok(result.includes('`#ff0000`'));
    assert.ok(result.includes('[$(copy)]'));
    assert.ok(result.includes('command:patina.copyColor'));
  });

  test('includes encoded hex in command args', () => {
    const result = clickableColorSwatch('#AABBCC');
    const expectedArgs = encodeURIComponent(JSON.stringify('#AABBCC'));
    assert.ok(result.includes(expectedArgs));
  });

  test('preserves hex format in display', () => {
    const lower = clickableColorSwatch('#abc123');
    const upper = clickableColorSwatch('#ABC123');
    assert.ok(lower.includes('`#abc123`'));
    assert.ok(upper.includes('`#ABC123`'));
  });

  test('includes color name in output', () => {
    const result = clickableColorSwatch('#ff0000');
    // getColorName returns a human-readable name; just verify
    // it appears quoted in the output
    assert.ok(result.includes('"'), 'should include quoted color name');
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
});
