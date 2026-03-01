import * as assert from 'assert';
import { _resetLoggerState } from '../log';
import { _resetAllState } from '../reconcile';

// File-level hooks: reset reconcile state for every test.
setup(() => {
  _resetAllState();
});

teardown(() => {
  _resetAllState();
});

suite('_resetLoggerState', () => {
  test('resets without throwing', () => {
    assert.doesNotThrow(() => _resetLoggerState());
  });

  test('successive resets are idempotent', () => {
    _resetLoggerState();
    assert.doesNotThrow(() => _resetLoggerState());
  });
});
