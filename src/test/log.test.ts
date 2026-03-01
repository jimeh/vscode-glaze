import * as assert from 'assert';
import { disposeLogger, log } from '../log';

suite('log', () => {
  teardown(() => {
    disposeLogger();
  });

  test('all log methods are callable', () => {
    assert.doesNotThrow(() => {
      log.trace('trace test');
      log.debug('debug test');
      log.info('info test');
      log.warn('warn test');
      log.error('error test');
    });
  });

  test('log methods work after disposeLogger()', () => {
    log.info('before dispose');
    disposeLogger();
    assert.doesNotThrow(() => log.info('after dispose'));
  });

  test('disposeLogger() is idempotent', () => {
    disposeLogger();
    assert.doesNotThrow(() => disposeLogger());
  });
});
