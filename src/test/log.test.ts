import * as assert from 'assert';
import { disposeLogger, log } from '../log';

suite('log', () => {
  test('all log methods are callable', () => {
    assert.doesNotThrow(() => {
      log.trace('trace test');
      log.debug('debug test');
      log.info('info test');
      log.warn('warn test');
      log.error('error test');
    });
  });

  test('disposeLogger() does not throw before channel creation', () => {
    // disposeLogger is safe to call even if no log method has
    // been called yet (channel not created).
    assert.doesNotThrow(() => disposeLogger());
  });
});
