import * as assert from 'assert';
import { generateStatusHtml } from '../../status/html';
import type { StatusState, StatusColorDetail } from '../../status/types';
import type { PaletteKey } from '../../theme';
import { PATINA_MANAGED_KEYS, COLOR_KEY_DEFINITIONS } from '../../theme';

function createMockColors(): StatusColorDetail[] {
  return PATINA_MANAGED_KEYS.map((key: PaletteKey): StatusColorDetail => {
    const def = COLOR_KEY_DEFINITIONS[key];
    return {
      key,
      element: def.element,
      colorType: def.colorType,
      themeColor: '#282c34',
      tintColor: '#524052',
      finalColor: '#3d3040',
      enabled: true,
    };
  });
}

function createMockState(overrides: Partial<StatusState> = {}): StatusState {
  return {
    general: {
      active: true,
      globalEnabled: true,
      workspaceEnabled: undefined,
      workspaceIdentifier: 'my-project',
      themeName: 'One Dark Pro',
      themeType: 'dark',
      themeAutoDetected: true,
      themeColorsAvailable: true,
      colorScheme: 'pastel',
      blendFactor: 0.35,
      seed: 0,
      baseHue: 180,
      targets: ['titleBar', 'statusBar', 'activityBar'],
    },
    colors: createMockColors(),
    ...overrides,
  };
}

suite('generateStatusHtml', () => {
  const nonce = 'test-nonce-12345';
  const cspSource = 'https://example.com';

  test('returns valid HTML document', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('<!DOCTYPE html>'), 'Should have DOCTYPE');
    assert.ok(html.includes('<html'), 'Should have html tag');
    assert.ok(html.includes('</html>'), 'Should close html tag');
    assert.ok(html.includes('<head>'), 'Should have head section');
    assert.ok(html.includes('<body>'), 'Should have body section');
  });

  test('includes CSP meta tag with nonce', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

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
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes(`<script nonce="${nonce}">`),
      'Script should have nonce attribute'
    );
  });

  test('uses --vscode-* CSS variables', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('--vscode-'), 'Should use VS Code CSS variables');
  });

  test('shows Active badge when active', () => {
    const state = createMockState();
    state.general.active = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('badge active'), 'Should have active badge class');
    assert.ok(html.includes('>Active<'), 'Should show Active text');
  });

  test('shows Inactive badge when not active', () => {
    const state = createMockState();
    state.general.active = false;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('badge inactive'),
      'Should have inactive badge class'
    );
    assert.ok(html.includes('>Inactive<'), 'Should show Inactive text');
  });

  test('shows workspace ID', () => {
    const state = createMockState();
    state.general.workspaceIdentifier = 'my-awesome-project';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('my-awesome-project'),
      'Should show workspace identifier'
    );
  });

  test('shows placeholder when no workspace', () => {
    const state = createMockState();
    state.general.workspaceIdentifier = undefined;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('No workspace'),
      'Should show no workspace placeholder'
    );
  });

  test('escapes HTML in identifier', () => {
    const state = createMockState();
    state.general.workspaceIdentifier = '<script>alert("xss")</script>';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(!html.includes('<script>alert'), 'Should escape script tags');
    assert.ok(html.includes('&lt;script&gt;'), 'Should escape < and >');
  });

  test('shows theme info', () => {
    const state = createMockState();
    state.general.themeName = 'Monokai Pro';
    state.general.themeType = 'dark';
    state.general.themeAutoDetected = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Monokai Pro'), 'Should show theme name');
    assert.ok(html.includes('dark'), 'Should show theme type');
    assert.ok(html.includes('auto'), 'Should show auto-detected label');
  });

  test('shows manual theme mode label', () => {
    const state = createMockState();
    state.general.themeAutoDetected = false;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('manual'),
      'Should show manual label when not auto-detected'
    );
  });

  test('shows color scheme', () => {
    const state = createMockState();
    state.general.colorScheme = 'vibrant';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('vibrant'), 'Should show color scheme name');
  });

  test('shows blend factor as percentage', () => {
    const state = createMockState();
    state.general.blendFactor = 0.35;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('35%'), 'Should show blend factor as %');
  });

  test('shows seed value', () => {
    const state = createMockState();
    state.general.seed = 42;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('42'), 'Should show seed value');
  });

  test('shows base hue with degree symbol', () => {
    const state = createMockState();
    state.general.baseHue = 180;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('180&deg;') || html.includes('180°'),
      'Should show base hue with degree symbol'
    );
  });

  test('color table has all 8 managed keys', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    for (const key of PATINA_MANAGED_KEYS) {
      assert.ok(html.includes(key), `Should contain managed key: ${key}`);
    }
  });

  test('shows group headers', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Title Bar'), 'Should have Title Bar group header');
    assert.ok(
      html.includes('Activity Bar'),
      'Should have Activity Bar group header'
    );
    assert.ok(
      html.includes('Status Bar'),
      'Should have Status Bar group header'
    );
  });

  test('group headers have group-header class', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('class="group-header"'),
      'Should have group-header class'
    );
  });

  test('disabled rows have disabled class', () => {
    const state = createMockState();
    // Disable all colors
    state.colors = state.colors.map((c) => ({
      ...c,
      enabled: false,
    }));
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('color-row disabled'),
      'Disabled rows should have disabled class'
    );
  });

  test('enabled rows do not have disabled class', () => {
    const state = createMockState();
    // Ensure all enabled
    state.colors = state.colors.map((c) => ({
      ...c,
      enabled: true,
    }));
    const html = generateStatusHtml(state, nonce, cspSource);

    // Should have color-row but not color-row disabled
    assert.ok(
      html.includes('class="color-row"'),
      'Enabled rows should have color-row without disabled'
    );
  });

  test('theme color column shows N/A when undefined', () => {
    const state = createMockState();
    state.colors = state.colors.map((c) => ({
      ...c,
      themeColor: undefined,
    }));
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('N/A'),
      'Should show N/A for undefined theme colors'
    );
  });

  test('color cells contain swatch spans', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('class="color-swatch"'),
      'Should have color swatch elements'
    );
  });

  test('color cells contain hex codes', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    // Check that hex codes appear in code tags
    assert.ok(html.includes('<code>#'), 'Should have hex codes in code tags');
  });

  test('includes refresh button', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('refreshBtn'), 'Should have refresh button');
  });

  test('includes JavaScript for refresh', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('acquireVsCodeApi'), 'Should use VS Code API');
    assert.ok(
      html.includes("{ type: 'refresh' }"),
      'Should post refresh message'
    );
  });

  test('shows "Available" when theme colors available', () => {
    const state = createMockState();
    state.general.themeColorsAvailable = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('Available'),
      'Should show Available for theme colors'
    );
  });

  test('shows "Unknown theme" when colors not available', () => {
    const state = createMockState();
    state.general.themeColorsAvailable = false;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Unknown theme'), 'Should show Unknown theme');
  });

  test('shows tint targets', () => {
    const state = createMockState();
    state.general.targets = ['titleBar', 'statusBar'];
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('titleBar, statusBar'), 'Should show target list');
  });

  test('shows None when no targets', () => {
    const state = createMockState();
    state.general.targets = [];
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('>None<'), 'Should show None when no targets');
  });

  test('shows global enabled status', () => {
    const state = createMockState();
    state.general.globalEnabled = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    // Check for "Yes" in the global enabled row
    assert.ok(
      html.includes('Global Enabled'),
      'Should show Global Enabled label'
    );
  });

  test('shows workspace override status', () => {
    const state = createMockState();
    state.general.workspaceEnabled = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('Enabled'),
      'Should show workspace override as Enabled'
    );

    state.general.workspaceEnabled = false;
    const html2 = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html2.includes('Disabled'),
      'Should show workspace override as Disabled'
    );
  });

  test('shows "Not set" for undefined workspace override', () => {
    const state = createMockState();
    state.general.workspaceEnabled = undefined;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('Not set'),
      'Should show Not set for undefined workspace override'
    );
  });
});
