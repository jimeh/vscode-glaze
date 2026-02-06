import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { isTmThemePath, isTmThemeContent, parseTmTheme } from '../tmtheme';

describe('isTmThemePath', () => {
  it('returns true for .tmTheme extension', () => {
    assert.equal(isTmThemePath('themes/Monokai.tmTheme'), true);
  });

  it('returns true for uppercase .TMTHEME', () => {
    assert.equal(isTmThemePath('themes/Monokai.TMTHEME'), true);
  });

  it('returns false for .json extension', () => {
    assert.equal(isTmThemePath('themes/dark.json'), false);
  });

  it('returns false for .tmTheme in directory name', () => {
    assert.equal(isTmThemePath('tmTheme/theme.json'), false);
  });
});

describe('isTmThemeContent', () => {
  it('detects <?xml header', () => {
    assert.equal(
      isTmThemeContent('<?xml version="1.0" encoding="UTF-8"?>'),
      true
    );
  });

  it('detects <!DOCTYPE plist header', () => {
    assert.equal(isTmThemeContent('<!DOCTYPE plist PUBLIC'), true);
  });

  it('detects <plist header', () => {
    assert.equal(isTmThemeContent('<plist version="1.0">'), true);
  });

  it('detects with leading whitespace', () => {
    assert.equal(isTmThemeContent('  \n  <?xml version="1.0"?>'), true);
  });

  it('returns false for JSON content', () => {
    assert.equal(isTmThemeContent('{ "colors": {} }'), false);
  });

  it('returns false for empty string', () => {
    assert.equal(isTmThemeContent(''), false);
  });
});

describe('parseTmTheme', () => {
  function makePlist(bg?: string, fg?: string): string {
    const settings: string[] = [];
    if (bg) settings.push(`<key>background</key><string>${bg}</string>`);
    if (fg) settings.push(`<key>foreground</key><string>${fg}</string>`);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>name</key>
  <string>Test Theme</string>
  <key>settings</key>
  <array>
    <dict>
      <key>settings</key>
      <dict>
        ${settings.join('\n        ')}
      </dict>
    </dict>
  </array>
</dict>
</plist>`;
  }

  it('parses valid plist with background and foreground', () => {
    const result = parseTmTheme(makePlist('#1E1E1E', '#D4D4D4'));
    assert.ok(result);
    assert.equal(result.colors?.['editor.background'], '#1E1E1E');
    assert.equal(result.colors?.['editor.foreground'], '#D4D4D4');
    assert.equal(result.name, 'Test Theme');
  });

  it('returns undefined when no background', () => {
    const result = parseTmTheme(makePlist(undefined, '#D4D4D4'));
    assert.equal(result, undefined);
  });

  it('returns undefined for invalid XML', () => {
    const result = parseTmTheme('not xml at all');
    assert.equal(result, undefined);
  });

  it('normalizes 3-char hex to 6-char', () => {
    const result = parseTmTheme(makePlist('#ABC'));
    assert.ok(result);
    assert.equal(result.colors?.['editor.background'], '#AABBCC');
  });

  it('strips alpha from 8-char hex', () => {
    const result = parseTmTheme(makePlist('#1E1E1EFF'));
    assert.ok(result);
    assert.equal(result.colors?.['editor.background'], '#1E1E1E');
  });

  it('returns undefined when settings array is empty', () => {
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>settings</key>
  <array/>
</dict>
</plist>`;
    const result = parseTmTheme(plist);
    assert.equal(result, undefined);
  });
});
