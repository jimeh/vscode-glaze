import * as assert from 'assert';
import { repairJsonc } from '../../settings/repair';

suite('repairJsonc', () => {
  test('returns valid JSON unchanged', () => {
    const text = '{\n  "editor.fontSize": 14\n}\n';
    assert.strictEqual(repairJsonc(text), text);
  });

  test('returns valid JSONC with trailing comma unchanged', () => {
    const text = '{\n  "editor.fontSize": 14,\n}\n';
    assert.strictEqual(repairJsonc(text), text);
  });

  test('returns valid JSONC with comments unchanged', () => {
    const text = '{\n  // A comment\n  "editor.fontSize": 14\n}\n';
    assert.strictEqual(repairJsonc(text), text);
  });

  test('repairs stray comma in empty object — { , }', () => {
    const text = '{\n  ,\n}\n';
    const result = repairJsonc(text);
    assert.strictEqual(result, '{}\n');
  });

  test('repairs stray comma inline — {,}', () => {
    const text = '{,}';
    const result = repairJsonc(text);
    assert.strictEqual(result, '{}\n');
  });

  test('repairs stray comma with surrounding whitespace', () => {
    const text = '{  ,  }';
    const result = repairJsonc(text);
    assert.strictEqual(result, '{}\n');
  });

  test('repairs stray comma after property removal with 2-space indent', () => {
    const text = '{\n  "editor.fontSize": 14,\n  ,\n}\n';
    const result = repairJsonc(text);
    // jsonc-parser extracts { "editor.fontSize": 14 }, re-serialized
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, { 'editor.fontSize': 14 });
  });

  test('repairs stray comma after property removal with tab indent', () => {
    const text = '{\n\t"editor.fontSize": 14,\n\t,\n}\n';
    const result = repairJsonc(text);
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, { 'editor.fontSize': 14 });
    // Should preserve tab indentation
    assert.ok(result.includes('\t'), 'should preserve tab indentation');
  });

  test('repairs double comma between properties', () => {
    const text = '{\n  "a": 1,,\n  "b": 2\n}\n';
    const result = repairJsonc(text);
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, { a: 1, b: 2 });
  });

  test('preserves all properties during repair', () => {
    const text = '{\n  "a": "hello",\n  ,\n  "b": 42,\n  "c": true\n}\n';
    const result = repairJsonc(text);
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, {
      a: 'hello',
      b: 42,
      c: true,
    });
  });

  test('handles realistic VS Code trailing comma bug', () => {
    // Simulates: settings.json had only colorCustomizations with
    // trailing comma, VS Code removed the key leaving { , }
    const text = '{\n\t,\n}\n';
    const result = repairJsonc(text);
    assert.strictEqual(result, '{}\n');
  });

  test('handles nested objects during repair', () => {
    const text = '{\n  "outer": {\n    "inner": 1\n  },\n  ,\n}\n';
    const result = repairJsonc(text);
    const parsed = JSON.parse(result);
    assert.deepStrictEqual(parsed, {
      outer: { inner: 1 },
    });
  });
});
