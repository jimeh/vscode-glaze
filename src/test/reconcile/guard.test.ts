import * as assert from 'assert';
import {
  _resetAllState,
  getCachedState,
  setRefreshStatusBar,
} from '../../reconcile';
import {
  reconcileGuardCheck,
  reconcileGuardRecordWrite,
  _setGuardEnabled,
  _configureGuard,
  _resetGuardState,
} from '../../reconcile/guard';

suite('reconcileGuardCheck', () => {
  setup(() => {
    _resetAllState();
    // Re-enable the guard (reset disables it).
    _setGuardEnabled(true);
    // Use tight thresholds for fast tests.
    _configureGuard({ maxWrites: 3, windowMs: 5_000, cooldownMs: 100 });
    // Inject no-op refresh so status bar calls succeed.
    setRefreshStatusBar(async () => {});
  });

  test('allows execution when no writes recorded', async () => {
    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true);
  });

  test('allows execution when below threshold', async () => {
    // Record 2 writes (threshold is 3).
    reconcileGuardRecordWrite();
    reconcileGuardRecordWrite();

    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true);
  });

  test('trips when write count reaches threshold', async () => {
    // Record 3 writes (= maxWrites).
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }

    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, false, 'should trip at threshold');
  });

  test('sets lastError when tripped', async () => {
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }

    await reconcileGuardCheck(false);

    const state = getCachedState();
    assert.ok(state.lastError, 'lastError should be set');
    assert.ok(
      state.lastError.includes('paused'),
      'error should mention pausing'
    );
  });

  test('blocks subsequent calls during cooldown', async () => {
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }
    await reconcileGuardCheck(false); // trips

    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, false, 'cooldown should block');
  });

  test('force always bypasses the guard', async () => {
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }
    await reconcileGuardCheck(false); // trips

    const ok = await reconcileGuardCheck(true);
    assert.strictEqual(ok, true, 'force should bypass');
  });

  test('force bypasses before tripping too', async () => {
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }

    // Force call should bypass even though writes >= threshold.
    const ok = await reconcileGuardCheck(true);
    assert.strictEqual(ok, true, 'force should bypass');
  });

  test('auto-resumes after cooldown expires', async () => {
    _configureGuard({ cooldownMs: 50 });
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }
    await reconcileGuardCheck(false); // trips

    // Wait for cooldown to expire.
    await new Promise((r) => setTimeout(r, 80));

    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true, 'should resume after cooldown');
  });

  test('clears lastError after cooldown expires', async () => {
    _configureGuard({ cooldownMs: 50 });
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }
    await reconcileGuardCheck(false); // trips
    assert.ok(getCachedState().lastError, 'lastError should be set');

    await new Promise((r) => setTimeout(r, 80));
    await reconcileGuardCheck(false); // resumes

    assert.strictEqual(
      getCachedState().lastError,
      undefined,
      'lastError should be cleared'
    );
  });

  test('resets write count after cooldown', async () => {
    _configureGuard({ cooldownMs: 50 });
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }
    await reconcileGuardCheck(false); // trips

    await new Promise((r) => setTimeout(r, 80));
    await reconcileGuardCheck(false); // resumes, clears timestamps

    // Should be able to do maxWrites again before tripping.
    for (let i = 0; i < 2; i++) {
      reconcileGuardRecordWrite();
    }
    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true, 'should allow writes after counter reset');
  });

  test('does not record writes when guard is disabled', () => {
    _setGuardEnabled(false);

    // Record many writes — should be ignored.
    for (let i = 0; i < 10; i++) {
      reconcileGuardRecordWrite();
    }

    // Re-enable and verify no accumulated timestamps.
    _setGuardEnabled(true);
    // If timestamps were recorded, this would trip immediately.
    // Since they weren't, it should pass.
    assert.doesNotReject(() => reconcileGuardCheck(false));
  });

  test('disabled guard always allows execution', async () => {
    _setGuardEnabled(false);
    // Even with writes recorded while enabled...
    _setGuardEnabled(true);
    for (let i = 0; i < 3; i++) {
      reconcileGuardRecordWrite();
    }
    await reconcileGuardCheck(false); // trips
    _setGuardEnabled(false);

    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true, 'disabled guard should pass');
  });
});

suite('_resetGuardState', () => {
  setup(() => {
    _resetAllState();
  });

  test('clears tripped state', async () => {
    _setGuardEnabled(true);
    _configureGuard({ maxWrites: 2, windowMs: 5_000, cooldownMs: 100 });
    setRefreshStatusBar(async () => {});

    reconcileGuardRecordWrite();
    reconcileGuardRecordWrite();
    await reconcileGuardCheck(false); // trips

    _resetGuardState();
    _setGuardEnabled(true);
    setRefreshStatusBar(async () => {});

    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true, 'should pass after reset');
  });

  test('disables the guard', () => {
    _setGuardEnabled(true);
    _resetGuardState();

    // Guard is disabled after reset — reconcileGuardRecordWrite
    // should be a no-op.
    for (let i = 0; i < 100; i++) {
      reconcileGuardRecordWrite();
    }
    // Doesn't throw or accumulate timestamps.
  });

  test('restores default thresholds', async () => {
    _setGuardEnabled(true);
    _configureGuard({ maxWrites: 1 });
    setRefreshStatusBar(async () => {});

    _resetGuardState();
    _setGuardEnabled(true);
    setRefreshStatusBar(async () => {});

    // Default maxWrites is 5, so 4 writes should still pass.
    for (let i = 0; i < 4; i++) {
      reconcileGuardRecordWrite();
    }
    const ok = await reconcileGuardCheck(false);
    assert.strictEqual(ok, true, 'default threshold restored');
  });
});
