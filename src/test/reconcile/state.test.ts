import * as assert from 'assert';
import {
  _resetAllState,
  getCachedState,
  resetCachedState,
  setRefreshStatusBar,
  updateCachedState,
} from '../../reconcile';

suite('getCachedState', () => {
  setup(() => {
    _resetAllState();
  });

  test('returns default empty state initially', () => {
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, undefined);
    assert.strictEqual(state.tintColors, undefined);
    assert.strictEqual(state.customizedOutsidePatina, false);
    assert.strictEqual(state.lastError, undefined);
  });

  test('returns updated state after updateCachedState', () => {
    updateCachedState({ workspaceIdentifier: 'test-ws' });
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, 'test-ws');
  });
});

suite('updateCachedState', () => {
  setup(() => {
    _resetAllState();
  });

  test('merges partial workspaceIdentifier update', () => {
    updateCachedState({ workspaceIdentifier: 'ws-1' });
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, 'ws-1');
    assert.strictEqual(state.customizedOutsidePatina, false);
  });

  test('merges partial tintColors update', () => {
    const colors = {
      baseTint: '#ff0000',
      titleBar: '#cc0000',
    };
    updateCachedState({ tintColors: colors });
    const state = getCachedState();
    assert.deepStrictEqual(state.tintColors, colors);
    assert.strictEqual(state.workspaceIdentifier, undefined);
  });

  test('merges partial customizedOutsidePatina update', () => {
    updateCachedState({ customizedOutsidePatina: true });
    const state = getCachedState();
    assert.strictEqual(state.customizedOutsidePatina, true);
  });

  test('merges partial lastError update', () => {
    updateCachedState({ lastError: 'something broke' });
    const state = getCachedState();
    assert.strictEqual(state.lastError, 'something broke');
  });

  test('preserves existing fields on partial update', () => {
    updateCachedState({ workspaceIdentifier: 'ws-1' });
    updateCachedState({ customizedOutsidePatina: true });
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, 'ws-1');
    assert.strictEqual(state.customizedOutsidePatina, true);
  });

  test('overwrites existing fields', () => {
    updateCachedState({ workspaceIdentifier: 'ws-1' });
    updateCachedState({ workspaceIdentifier: 'ws-2' });
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, 'ws-2');
  });

  test('can set fields to undefined explicitly', () => {
    updateCachedState({ workspaceIdentifier: 'ws-1' });
    updateCachedState({ workspaceIdentifier: undefined });
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, undefined);
  });

  test('handles multiple fields in one update', () => {
    updateCachedState({
      workspaceIdentifier: 'ws-1',
      customizedOutsidePatina: true,
      lastError: 'err',
    });
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, 'ws-1');
    assert.strictEqual(state.customizedOutsidePatina, true);
    assert.strictEqual(state.lastError, 'err');
  });

  test('empty partial update preserves state', () => {
    updateCachedState({ workspaceIdentifier: 'ws-1' });
    updateCachedState({});
    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, 'ws-1');
  });
});

suite('resetCachedState', () => {
  setup(() => {
    _resetAllState();
  });

  test('clears all cached fields to defaults', async () => {
    updateCachedState({
      workspaceIdentifier: 'ws-1',
      tintColors: {
        baseTint: '#ff0000',
        statusBar: '#cc0000',
      },
      customizedOutsidePatina: true,
      lastError: 'error',
    });

    await resetCachedState();

    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, undefined);
    assert.strictEqual(state.tintColors, undefined);
    assert.strictEqual(state.customizedOutsidePatina, false);
    assert.strictEqual(state.lastError, undefined);
  });

  test('invokes injected refreshStatusBar callback', async () => {
    let called = false;
    setRefreshStatusBar(async () => {
      called = true;
    });

    await resetCachedState();
    assert.strictEqual(called, true);
  });

  test('does not throw when no refreshStatusBar is injected', async () => {
    // _resetAllState already clears the callback
    await assert.doesNotReject(() => resetCachedState());
  });
});

suite('setRefreshStatusBar', () => {
  setup(() => {
    _resetAllState();
  });

  test('injected callback is invoked by resetCachedState', async () => {
    let callCount = 0;
    setRefreshStatusBar(async () => {
      callCount++;
    });

    await resetCachedState();
    assert.strictEqual(callCount, 1);

    await resetCachedState();
    assert.strictEqual(callCount, 2);
  });

  test('replaces previously injected callback', async () => {
    const calls: string[] = [];
    setRefreshStatusBar(async () => {
      calls.push('first');
    });
    setRefreshStatusBar(async () => {
      calls.push('second');
    });

    await resetCachedState();
    assert.deepStrictEqual(calls, ['second']);
  });
});

suite('_resetAllState (test isolation)', () => {
  test('resets cached state to defaults', () => {
    updateCachedState({
      workspaceIdentifier: 'ws-1',
      customizedOutsidePatina: true,
    });

    _resetAllState();

    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, undefined);
    assert.strictEqual(state.customizedOutsidePatina, false);
  });

  test('clears injected refreshStatusBar callback', async () => {
    let called = false;
    setRefreshStatusBar(async () => {
      called = true;
    });

    _resetAllState();

    // resetCachedState should NOT invoke the old callback
    await resetCachedState();
    assert.strictEqual(called, false);
  });

  test('successive resets are idempotent', () => {
    updateCachedState({ workspaceIdentifier: 'ws-1' });
    _resetAllState();
    _resetAllState();

    const state = getCachedState();
    assert.strictEqual(state.workspaceIdentifier, undefined);
  });
});
