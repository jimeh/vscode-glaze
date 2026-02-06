import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { resolveNlsPlaceholders } from '../nls';

describe('resolveNlsPlaceholders', () => {
  it('resolves simple %key% placeholder', () => {
    const obj = { label: '%themeName%' };
    const nls = { themeName: 'Dark+' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, { label: 'Dark+' });
  });

  it('passes through non-placeholder strings', () => {
    const obj = { label: 'Static Name' };
    const nls = { themeName: 'Dark+' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, { label: 'Static Name' });
  });

  it('preserves unresolved placeholders', () => {
    const obj = { label: '%unknown%' };
    const nls = { themeName: 'Dark+' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, { label: '%unknown%' });
  });

  it('returns input unchanged when nlsData is undefined', () => {
    const obj = { label: '%key%' };
    const result = resolveNlsPlaceholders(obj, undefined);
    assert.deepEqual(result, { label: '%key%' });
  });

  it('returns input unchanged when nlsData is empty', () => {
    const obj = { label: '%key%' };
    const result = resolveNlsPlaceholders(obj, {});
    assert.deepEqual(result, { label: '%key%' });
  });

  it('resolves placeholders in nested objects', () => {
    const obj = {
      contributes: {
        themes: [{ label: '%name%' }],
      },
    };
    const nls = { name: 'Monokai' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, {
      contributes: {
        themes: [{ label: 'Monokai' }],
      },
    });
  });

  it('resolves placeholders inside arrays', () => {
    const obj = ['%a%', '%b%', 'static'];
    const nls = { a: 'Alpha', b: 'Beta' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, ['Alpha', 'Beta', 'static']);
  });

  it('preserves non-string values', () => {
    const obj = {
      str: '%key%',
      num: 42,
      bool: true,
      nil: null,
    };
    const nls = { key: 'resolved' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, {
      str: 'resolved',
      num: 42,
      bool: true,
      nil: null,
    });
  });

  it('resolves multiple placeholders in same object', () => {
    const obj = { a: '%x%', b: '%y%' };
    const nls = { x: 'X', y: 'Y' };
    const result = resolveNlsPlaceholders(obj, nls);
    assert.deepEqual(result, { a: 'X', b: 'Y' });
  });

  it('does not partially match %key% within longer strings', () => {
    const obj = { label: 'prefix %key% suffix' };
    const nls = { key: 'replaced' };
    const result = resolveNlsPlaceholders(obj, nls);
    // The pattern requires the entire string to be %key%
    assert.deepEqual(result, {
      label: 'prefix %key% suffix',
    });
  });
});
