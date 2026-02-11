import * as assert from 'assert';
import {
  _buildTargets,
  _validateSeed,
  _validateBaseHueOverride,
  _clampBlendFactor,
  _buildTargetBlendFactors,
  _validateEnum,
} from '../../config';

suite('_buildTargets', () => {
  test('returns all four targets when all enabled', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: true,
        statusBar: true,
        activityBar: true,
        sideBar: true,
      }),
      ['titleBar', 'statusBar', 'activityBar', 'sideBar']
    );
  });

  test('returns empty array when all disabled', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: false,
        statusBar: false,
        activityBar: false,
        sideBar: false,
      }),
      []
    );
  });

  test('returns only titleBar', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: true,
        statusBar: false,
        activityBar: false,
        sideBar: false,
      }),
      ['titleBar']
    );
  });

  test('returns only statusBar', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: false,
        statusBar: true,
        activityBar: false,
        sideBar: false,
      }),
      ['statusBar']
    );
  });

  test('returns only activityBar', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: false,
        statusBar: false,
        activityBar: true,
        sideBar: false,
      }),
      ['activityBar']
    );
  });

  test('returns only sideBar', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: false,
        statusBar: false,
        activityBar: false,
        sideBar: true,
      }),
      ['sideBar']
    );
  });

  test('preserves insertion order', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: true,
        statusBar: false,
        activityBar: true,
        sideBar: false,
      }),
      ['titleBar', 'activityBar']
    );
  });

  test('returns titleBar + sideBar', () => {
    assert.deepStrictEqual(
      _buildTargets({
        titleBar: true,
        statusBar: false,
        activityBar: false,
        sideBar: true,
      }),
      ['titleBar', 'sideBar']
    );
  });
});

suite('_validateSeed', () => {
  test('passes through integer', () => {
    assert.strictEqual(_validateSeed(42), 42);
  });

  test('passes through zero', () => {
    assert.strictEqual(_validateSeed(0), 0);
  });

  test('passes through negative integer', () => {
    assert.strictEqual(_validateSeed(-100), -100);
  });

  test('passes through large integer', () => {
    assert.strictEqual(_validateSeed(999999999), 999999999);
  });

  test('falls back for float', () => {
    assert.strictEqual(_validateSeed(3.14), 0);
  });

  test('falls back for NaN', () => {
    assert.strictEqual(_validateSeed(NaN), 0);
  });

  test('falls back for Infinity', () => {
    assert.strictEqual(_validateSeed(Infinity), 0);
  });

  test('falls back for -Infinity', () => {
    assert.strictEqual(_validateSeed(-Infinity), 0);
  });
});

suite('_validateBaseHueOverride', () => {
  test('returns null for null input', () => {
    assert.strictEqual(_validateBaseHueOverride(null), null);
  });

  test('returns 0 for boundary low', () => {
    assert.strictEqual(_validateBaseHueOverride(0), 0);
  });

  test('returns 359 for boundary high', () => {
    assert.strictEqual(_validateBaseHueOverride(359), 359);
  });

  test('returns valid integer within range', () => {
    assert.strictEqual(_validateBaseHueOverride(180), 180);
  });

  test('returns null for negative value', () => {
    assert.strictEqual(_validateBaseHueOverride(-1), null);
  });

  test('returns null for 360', () => {
    assert.strictEqual(_validateBaseHueOverride(360), null);
  });

  test('returns null for large value', () => {
    assert.strictEqual(_validateBaseHueOverride(1000), null);
  });

  test('returns null for float', () => {
    assert.strictEqual(_validateBaseHueOverride(3.14), null);
  });

  test('returns null for NaN', () => {
    assert.strictEqual(_validateBaseHueOverride(NaN), null);
  });
});

suite('_clampBlendFactor', () => {
  test('passes through value in range', () => {
    assert.strictEqual(_clampBlendFactor(0.5), 0.5);
  });

  test('clamps negative to 0', () => {
    assert.strictEqual(_clampBlendFactor(-0.5), 0);
  });

  test('clamps above 1 to 1', () => {
    assert.strictEqual(_clampBlendFactor(1.5), 1);
  });

  test('passes through 0 boundary', () => {
    assert.strictEqual(_clampBlendFactor(0), 0);
  });

  test('passes through 1 boundary', () => {
    assert.strictEqual(_clampBlendFactor(1), 1);
  });

  test('passes through 0.35 default', () => {
    assert.strictEqual(_clampBlendFactor(0.35), 0.35);
  });
});

suite('_buildTargetBlendFactors', () => {
  test('returns empty object for all null values', () => {
    assert.deepStrictEqual(
      _buildTargetBlendFactors([
        ['titleBar', null],
        ['statusBar', null],
        ['activityBar', null],
        ['sideBar', null],
      ]),
      {}
    );
  });

  test('returns empty object for empty entries', () => {
    assert.deepStrictEqual(_buildTargetBlendFactors([]), {});
  });

  test('includes non-null entries', () => {
    assert.deepStrictEqual(
      _buildTargetBlendFactors([
        ['titleBar', 0.5],
        ['statusBar', null],
        ['activityBar', 0.8],
        ['sideBar', null],
      ]),
      { titleBar: 0.5, activityBar: 0.8 }
    );
  });

  test('clamps values to [0, 1]', () => {
    assert.deepStrictEqual(
      _buildTargetBlendFactors([
        ['titleBar', -0.5],
        ['statusBar', 1.5],
      ]),
      { titleBar: 0, statusBar: 1 }
    );
  });

  test('includes all targets when all set', () => {
    const result = _buildTargetBlendFactors([
      ['titleBar', 0.2],
      ['statusBar', 0.4],
      ['activityBar', 0.6],
      ['sideBar', 0.8],
    ]);
    assert.strictEqual(result.titleBar, 0.2);
    assert.strictEqual(result.statusBar, 0.4);
    assert.strictEqual(result.activityBar, 0.6);
    assert.strictEqual(result.sideBar, 0.8);
  });
});

suite('_validateEnum', () => {
  const validValues = ['a', 'b', 'c'] as const;

  test('returns value when valid', () => {
    assert.strictEqual(_validateEnum('a', validValues, 'a'), 'a');
  });

  test('returns different valid value', () => {
    assert.strictEqual(_validateEnum('b', validValues, 'a'), 'b');
  });

  test('returns default for invalid value', () => {
    assert.strictEqual(_validateEnum('invalid', validValues, 'a'), 'a');
  });

  test('returns default for empty string', () => {
    assert.strictEqual(_validateEnum('', validValues, 'a'), 'a');
  });

  test('returns default for prototype key', () => {
    assert.strictEqual(_validateEnum('toString', validValues, 'a'), 'a');
  });

  test('returns default for constructor key', () => {
    assert.strictEqual(_validateEnum('constructor', validValues, 'a'), 'a');
  });

  test('returns default for hasOwnProperty key', () => {
    assert.strictEqual(_validateEnum('hasOwnProperty', validValues, 'a'), 'a');
  });
});
