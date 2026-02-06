import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { parseThemeContributions } from '../marketplace';

describe('parseThemeContributions', () => {
  it('extracts theme contributions from valid package.json', () => {
    const packageJson = {
      contributes: {
        themes: [
          {
            label: 'Monokai',
            uiTheme: 'vs-dark',
            path: './themes/monokai.json',
          },
          {
            label: 'Solarized Light',
            uiTheme: 'vs',
            path: './themes/solarized-light.json',
          },
        ],
      },
    };
    const result = parseThemeContributions(packageJson);
    assert.equal(result.length, 2);
    assert.equal(result[0].label, 'Monokai');
    assert.equal(result[0].uiTheme, 'vs-dark');
    assert.equal(result[0].path, './themes/monokai.json');
    assert.equal(result[1].label, 'Solarized Light');
  });

  it('returns empty array when contributes is missing', () => {
    const result = parseThemeContributions({});
    assert.deepEqual(result, []);
  });

  it('returns empty array when themes is missing', () => {
    const result = parseThemeContributions({
      contributes: {},
    });
    assert.deepEqual(result, []);
  });

  it('returns empty array when themes is not an array', () => {
    const result = parseThemeContributions({
      contributes: { themes: 'invalid' },
    });
    assert.deepEqual(result, []);
  });

  it('filters out entries without required fields', () => {
    const packageJson = {
      contributes: {
        themes: [
          // Valid
          {
            label: 'Valid',
            uiTheme: 'vs-dark',
            path: './theme.json',
          },
          // Missing label
          {
            uiTheme: 'vs-dark',
            path: './theme.json',
          },
          // Missing uiTheme
          {
            label: 'No UI Theme',
            path: './theme.json',
          },
          // Missing path
          {
            label: 'No Path',
            uiTheme: 'vs-dark',
          },
        ],
      },
    };
    const result = parseThemeContributions(packageJson);
    assert.equal(result.length, 1);
    assert.equal(result[0].label, 'Valid');
  });

  it('includes id when present', () => {
    const packageJson = {
      contributes: {
        themes: [
          {
            id: 'my-theme-id',
            label: 'My Theme',
            uiTheme: 'vs-dark',
            path: './theme.json',
          },
        ],
      },
    };
    const result = parseThemeContributions(packageJson);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'my-theme-id');
  });

  it('sets id to undefined when absent', () => {
    const packageJson = {
      contributes: {
        themes: [
          {
            label: 'No ID',
            uiTheme: 'vs-dark',
            path: './theme.json',
          },
        ],
      },
    };
    const result = parseThemeContributions(packageJson);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, undefined);
  });

  it('sets id to undefined when id is not a string', () => {
    const packageJson = {
      contributes: {
        themes: [
          {
            id: 123,
            label: 'Numeric ID',
            uiTheme: 'vs-dark',
            path: './theme.json',
          },
        ],
      },
    };
    const result = parseThemeContributions(packageJson);
    assert.equal(result.length, 1);
    assert.equal(result[0].id, undefined);
  });
});
