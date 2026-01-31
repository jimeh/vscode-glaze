import * as assert from 'assert';
import { escapeHtml } from '../../webview/escapeHtml';

suite('escapeHtml', () => {
  test('escapes ampersand', () => {
    assert.strictEqual(escapeHtml('a&b'), 'a&amp;b');
  });

  test('escapes less-than', () => {
    assert.strictEqual(escapeHtml('a<b'), 'a&lt;b');
  });

  test('escapes greater-than', () => {
    assert.strictEqual(escapeHtml('a>b'), 'a&gt;b');
  });

  test('escapes double quote', () => {
    assert.strictEqual(escapeHtml('a"b'), 'a&quot;b');
  });

  test('returns empty string unchanged', () => {
    assert.strictEqual(escapeHtml(''), '');
  });

  test('returns safe string unchanged', () => {
    assert.strictEqual(escapeHtml('hello world 123'), 'hello world 123');
  });

  test('escapes all special characters in one string', () => {
    assert.strictEqual(
      escapeHtml('<div class="a&b">'),
      '&lt;div class=&quot;a&amp;b&quot;&gt;'
    );
  });

  test('escapes multiple occurrences', () => {
    assert.strictEqual(escapeHtml('a&b&c'), 'a&amp;b&amp;c');
  });
});
