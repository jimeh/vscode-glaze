import * as assert from 'assert';
import { repairJsonc } from '../../settings/repair';

suite('repairJsonc', () => {
  test('returns valid empty object unchanged', () => {
    const text = '{}\n';
    assert.strictEqual(repairJsonc(text), text);
  });

  test('returns valid JSON with properties unchanged', () => {
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

  test('repairs stray comma — { , } with newlines', () => {
    assert.strictEqual(repairJsonc('{\n  ,\n}\n'), '{}\n');
  });

  test('repairs stray comma inline — {,}', () => {
    assert.strictEqual(repairJsonc('{,}'), '{}\n');
  });

  test('repairs stray comma with surrounding whitespace', () => {
    assert.strictEqual(repairJsonc('{  ,  }'), '{}\n');
  });

  test('repairs stray comma with tab indent', () => {
    assert.strictEqual(repairJsonc('{\n\t,\n}\n'), '{}\n');
  });

  test('repairs multiple stray commas', () => {
    assert.strictEqual(repairJsonc('{\n  , ,\n}\n'), '{}\n');
  });

  test('repairs object with only whitespace (no comma)', () => {
    assert.strictEqual(repairJsonc('{   }'), '{}\n');
    assert.strictEqual(repairJsonc('{\n\n}'), '{}\n');
  });

  test('does not repair object with actual properties', () => {
    const text = '{\n  "a": 1,\n  ,\n}\n';
    assert.strictEqual(repairJsonc(text), text);
  });
});
