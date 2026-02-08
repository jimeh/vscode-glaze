import * as assert from 'assert';
import { generatePreviewHtml } from '../../preview/html';
import type { PreviewState } from '../../preview/types';

const MOCK_HUE_COLORS = [
  {
    titleBar: { background: '#524052', foreground: '#e6dce6' },
    activityBar: { background: '#403340', foreground: '#d9ccd9' },
    sideBar: { background: '#473a47', foreground: '#d9ccd9' },
    statusBar: { background: '#59475a', foreground: '#e6dce6' },
  },
];

function createMockState(overrides: Partial<PreviewState> = {}): PreviewState {
  return {
    themeType: 'dark',
    currentStyle: 'pastel',
    currentHarmony: 'uniform',
    styles: [
      { style: 'pastel', label: 'Pastel', hueColors: MOCK_HUE_COLORS },
      {
        style: 'vibrant',
        label: 'Vibrant',
        hueColors: [
          {
            titleBar: { background: '#663366', foreground: '#f2e6f2' },
            activityBar: { background: '#4d264d', foreground: '#e6d9e6' },
            sideBar: { background: '#5a2d5a', foreground: '#e6d9e6' },
            statusBar: { background: '#733d73', foreground: '#f2e6f2' },
          },
        ],
      },
    ],
    harmonies: [
      { harmony: 'uniform', label: 'Uniform', hueColors: MOCK_HUE_COLORS },
      { harmony: 'duotone', label: 'Duotone', hueColors: MOCK_HUE_COLORS },
    ],
    ...overrides,
  };
}

suite('generatePreviewHtml', () => {
  const nonce = 'test-nonce-12345';
  const cspSource = 'https://example.com';

  test('returns valid HTML document', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
    assert.ok(html.includes('<html'), 'Should have html tag');
    assert.ok(html.includes('</html>'), 'Should close html tag');
    assert.ok(html.includes('<head>'), 'Should have head section');
    assert.ok(html.includes('<body>'), 'Should have body section');
  });

  test('includes CSP meta tag with nonce', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('Content-Security-Policy'),
      'Should have CSP meta tag'
    );
    assert.ok(
      html.includes(`script-src 'nonce-${nonce}'`),
      'Should include nonce in CSP'
    );
    assert.ok(html.includes(cspSource), 'Should include CSP source');
  });

  test('includes script with nonce attribute', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes(`<script nonce="${nonce}">`),
      'Script should have nonce attribute'
    );
  });

  test('includes theme type tabs', () => {
    const state = createMockState({ themeType: 'dark' });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('theme-tab'), 'Should have theme tabs');
    assert.ok(html.includes('data-theme="dark"'), 'Should have dark tab');
    assert.ok(html.includes('data-theme="light"'), 'Should have light tab');
    assert.ok(html.includes('data-theme="hcDark"'), 'Should have hcDark tab');
    assert.ok(html.includes('data-theme="hcLight"'), 'Should have hcLight tab');
  });

  test('marks current theme type tab as active', () => {
    const darkState = createMockState({ themeType: 'dark' });
    const darkHtml = generatePreviewHtml(darkState, nonce, cspSource);

    // The active tab should have both 'active' class and the theme data attr
    assert.ok(
      darkHtml.includes('theme-tab active" data-theme="dark"'),
      'Dark tab should be active when themeType is dark'
    );

    const lightState = createMockState({ themeType: 'light' });
    const lightHtml = generatePreviewHtml(lightState, nonce, cspSource);

    assert.ok(
      lightHtml.includes('theme-tab active" data-theme="light"'),
      'Light tab should be active when themeType is light'
    );
  });

  test('shows "No workspace open" when no workspace preview', () => {
    const state = createMockState({ workspacePreview: undefined });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('No workspace open'),
      'Should show no workspace message'
    );
  });

  test('shows workspace identifier when workspace preview exists', () => {
    const state = createMockState({
      workspacePreview: {
        identifier: 'my-awesome-project',
        colors: {
          titleBar: { background: '#524052', foreground: '#e6dce6' },
          activityBar: { background: '#403340', foreground: '#d9ccd9' },
          sideBar: { background: '#473a47', foreground: '#d9ccd9' },
          statusBar: { background: '#59475a', foreground: '#e6dce6' },
        },
        isBlended: false,
      },
    });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('my-awesome-project'),
      'Should show workspace identifier'
    );
  });

  test('escapes HTML in workspace identifier', () => {
    const state = createMockState({
      workspacePreview: {
        identifier: '<script>alert("xss")</script>',
        colors: {
          titleBar: { background: '#524052', foreground: '#e6dce6' },
          activityBar: { background: '#403340', foreground: '#d9ccd9' },
          sideBar: { background: '#473a47', foreground: '#d9ccd9' },
          statusBar: { background: '#59475a', foreground: '#e6dce6' },
        },
        isBlended: false,
      },
    });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      !html.includes('<script>alert'),
      'Should escape script tags in identifier'
    );
    assert.ok(html.includes('&lt;script&gt;'), 'Should escape < and >');
  });

  test('shows blend info when blended', () => {
    const state = createMockState({
      workspacePreview: {
        identifier: 'my-project',
        colors: {
          titleBar: { background: '#524052', foreground: '#e6dce6' },
          activityBar: { background: '#403340', foreground: '#d9ccd9' },
          sideBar: { background: '#473a47', foreground: '#d9ccd9' },
          statusBar: { background: '#59475a', foreground: '#e6dce6' },
        },
        isBlended: true,
        blendFactor: 0.35,
      },
    });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('Blended 35% with theme'), 'Should show blend %');
  });

  test('shows "No theme blending" when not blended', () => {
    const state = createMockState({
      workspacePreview: {
        identifier: 'my-project',
        colors: {
          titleBar: { background: '#524052', foreground: '#e6dce6' },
          activityBar: { background: '#403340', foreground: '#d9ccd9' },
          sideBar: { background: '#473a47', foreground: '#d9ccd9' },
          statusBar: { background: '#59475a', foreground: '#e6dce6' },
        },
        isBlended: false,
      },
    });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('No theme blending'),
      'Should show no blending message'
    );
  });

  test('includes style rows in table', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('style-row'), 'Should have style rows');
    assert.ok(html.includes('data-style="pastel"'), 'Should have pastel row');
    assert.ok(html.includes('data-style="vibrant"'), 'Should have vibrant row');
  });

  test('marks current style row with current class', () => {
    const state = createMockState({ currentStyle: 'pastel' });
    const html = generatePreviewHtml(state, nonce, cspSource);

    // The current row should have 'current' class
    assert.ok(
      html.includes('style-row current" data-style="pastel"'),
      'Current style row should have current class'
    );
  });

  test('includes current badge (*) for current style', () => {
    const state = createMockState({ currentStyle: 'pastel' });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('current-badge'), 'Should have current badge');
  });

  test('includes color swatches with hex colors', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    // Check that swatch elements exist with inline styles
    assert.ok(html.includes('class="swatch"'), 'Should have swatches');
    assert.ok(
      html.includes('background: #'),
      'Should have background color styles'
    );
    assert.ok(html.includes('color: #'), 'Should have foreground color styles');
  });

  test('swatches show element names in correct order', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    // Find a swatch by matching the swatch class
    assert.ok(html.includes('class="swatch"'), 'Should have swatches');

    // Find the first swatch and check label order within it
    const swatchStart = html.indexOf('class="swatch"');
    // Get a chunk of HTML after the swatch start (enough to capture all
    // names, including title attributes with color names)
    const chunk = html.slice(swatchStart, swatchStart + 1500);

    const tbIndex = chunk.indexOf('>Title<');
    const abIndex = chunk.indexOf('>AB<');
    const sideIndex = chunk.indexOf('>SB<');
    const sbIndex = chunk.indexOf('>Status<');

    assert.ok(tbIndex > 0, 'Should find Title name');
    assert.ok(abIndex > 0, 'Should find AB name');
    assert.ok(sideIndex > 0, 'Should find SB name');
    assert.ok(sbIndex > 0, 'Should find Status name');
    assert.ok(tbIndex < abIndex, 'Title should come before AB');
    assert.ok(abIndex < sideIndex, 'AB should come before SB');
    assert.ok(sideIndex < sbIndex, 'SB should come before Status');
  });

  test('includes hint text', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('Click a row to apply'),
      'Should include click hint'
    );
  });

  test('includes harmony rows in table', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('harmony-row'), 'Should have harmony rows');
    assert.ok(
      html.includes('data-harmony="uniform"'),
      'Should have uniform row'
    );
    assert.ok(
      html.includes('data-harmony="duotone"'),
      'Should have duotone row'
    );
  });

  test('marks current harmony row with current class', () => {
    const state = createMockState({ currentHarmony: 'uniform' });
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('harmony-row current" data-harmony="uniform"'),
      'Current harmony row should have current class'
    );
  });

  test('includes section headings', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('Color Style'), 'Should have Color Style heading');
    assert.ok(
      html.includes('Color Harmony'),
      'Should have Color Harmony heading'
    );
  });

  test('includes hint text for both sections', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('Click a row to apply that color style.'),
      'Should have style hint'
    );
    assert.ok(
      html.includes('Click a row to apply that color harmony.'),
      'Should have harmony hint'
    );
  });

  test('includes JavaScript for interactivity', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('acquireVsCodeApi'), 'Should use VS Code API');
    assert.ok(
      html.includes("postMessage({ type: 'selectStyle'"),
      'Should post selectStyle message'
    );
    assert.ok(
      html.includes("postMessage({ type: 'selectHarmony'"),
      'Should post selectHarmony message'
    );
    assert.ok(
      html.includes("postMessage({ type: 'changeThemeType'"),
      'Should post changeThemeType message'
    );
  });

  test('includes CSS for styling', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('<style>'), 'Should have style tag');
    assert.ok(html.includes('--vscode-'), 'Should use VS Code CSS variables');
  });

  test('hue headers are present', () => {
    const state = createMockState();
    const html = generatePreviewHtml(state, nonce, cspSource);

    assert.ok(html.includes('hue-header'), 'Should have hue headers');
    assert.ok(html.includes('Red'), 'Should have Red label');
    assert.ok(html.includes('Orange'), 'Should have Orange label');
    assert.ok(html.includes('Yellow'), 'Should have Yellow label');
    assert.ok(html.includes('Green'), 'Should have Green label');
    assert.ok(html.includes('Teal'), 'Should have Teal label');
    assert.ok(html.includes('Cyan'), 'Should have Cyan label');
    assert.ok(html.includes('Blue'), 'Should have Blue label');
    assert.ok(html.includes('Purple'), 'Should have Purple label');
  });
});
