import * as assert from 'assert';
import {
  getBlendFunction,
  overlayBlend,
  createHueShiftBlend,
  ALL_BLEND_METHODS,
  BLEND_METHOD_DEFINITIONS,
  BLEND_METHOD_LABELS,
  DEFAULT_BLEND_METHOD,
  isValidBlendMethod,
} from '../../../color/blend';
import { oklchToHex } from '../../../color/convert';

// ============================================================================
// getBlendFunction
// ============================================================================

suite('getBlendFunction', () => {
  const tint = { l: 0.5, c: 0.1, h: 200 };
  const tintHex = oklchToHex(tint);
  const themeHex = '#1F1F1F';

  test('hueShift mode returns a function', () => {
    const fn = getBlendFunction('hueShift');
    assert.strictEqual(typeof fn, 'function');
  });

  test('overlay mode returns a function', () => {
    const fn = getBlendFunction('overlay');
    assert.strictEqual(typeof fn, 'function');
  });

  test('hueShift and overlay produce different results', () => {
    const hueShift = getBlendFunction('hueShift');
    const overlay = getBlendFunction('overlay');

    const a = hueShift(tint, tintHex, themeHex, 0.35, false);
    const b = overlay(tint, tintHex, themeHex, 0.35, false);

    assert.match(a, /^#[0-9a-f]{6}$/);
    assert.match(b, /^#[0-9a-f]{6}$/);
    assert.notStrictEqual(a, b);
  });

  test('both methods return tint at factor 0', () => {
    const hueShift = getBlendFunction('hueShift');
    const overlay = getBlendFunction('overlay');

    const a = hueShift(tint, tintHex, themeHex, 0, false);
    const b = overlay(tint, tintHex, themeHex, 0, false);

    assert.strictEqual(a, tintHex);
    assert.strictEqual(b, tintHex);
  });

  test('hueShift matches createHueShiftBlend output', () => {
    const fromDispatcher = getBlendFunction('hueShift');
    const fromFactory = createHueShiftBlend();

    const a = fromDispatcher(tint, tintHex, themeHex, 0.5, false);
    const b = fromFactory(tint, tintHex, themeHex, 0.5, false);

    assert.strictEqual(a, b);
  });

  test('overlay matches overlayBlend output', () => {
    const fromDispatcher = getBlendFunction('overlay');

    const a = fromDispatcher(tint, tintHex, themeHex, 0.5, false);
    const b = overlayBlend(tint, tintHex, themeHex, 0.5, false);

    assert.strictEqual(a, b);
  });

  test('accepts majorityDir for hueShift', () => {
    const fn = getBlendFunction('hueShift', 'cw');
    const result = fn(tint, tintHex, themeHex, 0.35, false);
    assert.match(result, /^#[0-9a-f]{6}$/);
  });

  test('ignores majorityDir for overlay', () => {
    const a = getBlendFunction('overlay', 'cw');
    const b = getBlendFunction('overlay', 'ccw');
    const c = getBlendFunction('overlay', undefined);

    const resultA = a(tint, tintHex, themeHex, 0.35, false);
    const resultB = b(tint, tintHex, themeHex, 0.35, false);
    const resultC = c(tint, tintHex, themeHex, 0.35, false);

    assert.strictEqual(resultA, resultB);
    assert.strictEqual(resultB, resultC);
  });

  test('defaults to overlay for unknown method', () => {
    // TypeScript won't allow this normally, but test runtime behavior
    const fn = getBlendFunction('unknown' as 'overlay');
    const overlay = getBlendFunction('overlay');

    const a = fn(tint, tintHex, themeHex, 0.35, false);
    const b = overlay(tint, tintHex, themeHex, 0.35, false);

    assert.strictEqual(a, b);
  });
});

// ============================================================================
// Blend method definitions
// ============================================================================

suite('blend method definitions', () => {
  test('ALL_BLEND_METHODS contains all methods', () => {
    assert.ok(ALL_BLEND_METHODS.includes('overlay'));
    assert.ok(ALL_BLEND_METHODS.includes('hueShift'));
    assert.strictEqual(ALL_BLEND_METHODS.length, 2);
  });

  test('ALL_BLEND_METHODS is sorted by order', () => {
    for (let i = 1; i < ALL_BLEND_METHODS.length; i++) {
      const prev = BLEND_METHOD_DEFINITIONS[ALL_BLEND_METHODS[i - 1]];
      const curr = BLEND_METHOD_DEFINITIONS[ALL_BLEND_METHODS[i]];
      assert.ok(
        prev.order <= curr.order,
        `${ALL_BLEND_METHODS[i - 1]} (${prev.order}) should come before ` +
          `${ALL_BLEND_METHODS[i]} (${curr.order})`
      );
    }
  });

  test('BLEND_METHOD_DEFINITIONS has all required fields', () => {
    for (const method of ALL_BLEND_METHODS) {
      const def = BLEND_METHOD_DEFINITIONS[method];
      assert.ok(typeof def.label === 'string', `${method} should have label`);
      assert.ok(
        typeof def.description === 'string',
        `${method} should have description`
      );
      assert.ok(typeof def.order === 'number', `${method} should have order`);
    }
  });

  test('BLEND_METHOD_LABELS maps methods to labels', () => {
    for (const method of ALL_BLEND_METHODS) {
      assert.strictEqual(
        BLEND_METHOD_LABELS[method],
        BLEND_METHOD_DEFINITIONS[method].label
      );
    }
  });

  test('DEFAULT_BLEND_METHOD is overlay', () => {
    assert.strictEqual(DEFAULT_BLEND_METHOD, 'overlay');
  });

  test('DEFAULT_BLEND_METHOD is a valid method', () => {
    assert.ok(ALL_BLEND_METHODS.includes(DEFAULT_BLEND_METHOD));
  });
});

// ============================================================================
// isValidBlendMethod
// ============================================================================

suite('isValidBlendMethod', () => {
  test('returns true for overlay', () => {
    assert.strictEqual(isValidBlendMethod('overlay'), true);
  });

  test('returns true for hueShift', () => {
    assert.strictEqual(isValidBlendMethod('hueShift'), true);
  });

  test('returns false for invalid strings', () => {
    assert.strictEqual(isValidBlendMethod('invalid'), false);
    assert.strictEqual(isValidBlendMethod(''), false);
    assert.strictEqual(isValidBlendMethod('Overlay'), false); // case sensitive
    assert.strictEqual(isValidBlendMethod('hue-shift'), false);
  });

  test('works as type guard', () => {
    const value: string = 'overlay';
    if (isValidBlendMethod(value)) {
      // TypeScript should narrow to BlendMethod
      const method: 'overlay' | 'hueShift' = value;
      assert.strictEqual(method, 'overlay');
    } else {
      assert.fail('Should have recognized overlay as valid');
    }
  });
});
