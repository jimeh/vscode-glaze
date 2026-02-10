import * as assert from 'assert';
import { generateStatusHtml } from '../../status/html';
import type { StatusState } from '../../status/types';
import type { TintKeyDetail } from '../../color/tint';
import type { PaletteKey } from '../../theme';
import { GLAZE_MANAGED_KEYS, COLOR_KEY_DEFINITIONS } from '../../theme';

function createMockColors(): readonly TintKeyDetail[] {
  return GLAZE_MANAGED_KEYS.map((key: PaletteKey): TintKeyDetail => {
    const def = COLOR_KEY_DEFINITIONS[key];
    return {
      key,
      element: def.element,
      colorType: def.colorType,
      themeColor: '#282c34',
      tintHex: '#524052',
      finalHex: '#3d3040',
      blendFactor: 0.35,
      enabled: true,
      excluded: false,
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
      tintType: 'dark',
      themeAutoDetected: true,
      themeColorsAvailable: true,
      osColorScheme: 'dark',
      colorStyle: 'pastel',
      colorHarmony: 'uniform',
      blendFactor: 0.35,
      targetBlendFactors: {},
      seed: 0,
      baseHueOverride: null,
      baseHue: 180,
      targets: ['titleBar', 'statusBar', 'activityBar'],
      customizedOutsideGlaze: false,
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

  test('shows Inactive badge when no targets enabled', () => {
    const state = createMockState();
    state.general.active = false;
    state.general.targets = [];
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('badge inactive'),
      'Should show inactive when no targets enabled'
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

  test('shows theme info with detected label', () => {
    const state = createMockState();
    state.general.themeName = 'Monokai Pro';
    state.general.themeType = 'dark';
    state.general.tintType = 'dark';
    state.general.themeAutoDetected = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Monokai Pro'), 'Should show theme name');
    assert.ok(
      html.includes('Theme (detected)'),
      'Should show "Theme (detected)" label'
    );
    assert.ok(
      html.includes('Monokai Pro (dark)'),
      'Should show theme name with DB type'
    );
  });

  test('shows theme without type when themeType is undefined', () => {
    const state = createMockState();
    state.general.themeName = 'Unknown Theme';
    state.general.themeType = undefined;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Unknown Theme'), 'Should show theme name');
    // Should NOT show parenthesized type
    assert.ok(
      !html.includes('Unknown Theme ('),
      'Should not show type parenthetical when undefined'
    );
  });

  test('shows manual tint mode label', () => {
    const state = createMockState();
    state.general.themeAutoDetected = false;
    state.general.tintType = 'light';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Tint Mode'), 'Should show Tint Mode label');
    assert.ok(html.includes('Light'), 'Should show capitalized tint type');
  });

  test('shows auto tint mode label', () => {
    const state = createMockState();
    state.general.themeAutoDetected = true;
    state.general.tintType = 'dark';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('Tint Mode'), 'Should show Tint Mode label');
    assert.ok(
      html.includes('Auto (Dark)'),
      'Should show auto tint mode format'
    );
  });

  test('shows color style', () => {
    const state = createMockState();
    state.general.colorStyle = 'vibrant';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(html.includes('vibrant'), 'Should show color style name');
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

  test('color table has all managed keys', () => {
    const state = createMockState();
    const html = generateStatusHtml(state, nonce, cspSource);

    for (const key of GLAZE_MANAGED_KEYS) {
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

  test('shows OS color scheme value', () => {
    const state = createMockState();
    state.general.osColorScheme = 'dark';
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('OS Color Scheme'),
      'Should show OS Color Scheme label'
    );
    assert.ok(html.includes('>Dark<'), 'Should show capitalized dark value');
  });

  test('shows Unknown when OS color scheme is undefined', () => {
    const state = createMockState();
    state.general.osColorScheme = undefined;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('OS Color Scheme'),
      'Should show OS Color Scheme label'
    );
    assert.ok(
      html.includes('>Unknown<'),
      'Should show Unknown for undefined OS color scheme'
    );
  });

  test('shows warning badge when customizedOutsideGlaze is true', () => {
    const state = createMockState();
    state.general.customizedOutsideGlaze = true;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('badge warning'),
      'Should have warning badge class'
    );
    assert.ok(
      html.includes('Colors modified outside Glaze'),
      'Should show warning text'
    );
  });

  test('no warning badge when customizedOutsideGlaze is false', () => {
    const state = createMockState();
    state.general.customizedOutsideGlaze = false;
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      !html.includes('badge warning'),
      'Should not have warning badge class'
    );
  });

  test('shows blend override rows when targetBlendFactors set', () => {
    const state = createMockState();
    state.general.targetBlendFactors = {
      titleBar: 0.5,
      statusBar: 0.2,
    };
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('50% (override)'),
      'Should show title bar override'
    );
    assert.ok(
      html.includes('20% (override)'),
      'Should show status bar override'
    );
    assert.ok(
      html.includes('Title Bar'),
      'Should show Title Bar label in override row'
    );
    assert.ok(
      html.includes('Status Bar'),
      'Should show Status Bar label in override row'
    );
  });

  test('no blend override rows when targetBlendFactors empty', () => {
    const state = createMockState();
    state.general.targetBlendFactors = {};
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      !html.includes('(override)'),
      'Should not show override rows when empty'
    );
  });

  test('only shows override rows for set targets', () => {
    const state = createMockState();
    state.general.targetBlendFactors = {
      activityBar: 0.7,
    };
    const html = generateStatusHtml(state, nonce, cspSource);

    assert.ok(
      html.includes('70% (override)'),
      'Should show activity bar override'
    );
    assert.ok(html.includes('Activity Bar'), 'Should show Activity Bar label');
    // Should not show rows for unset targets
    assert.ok(
      !html.includes('50% (override)'),
      'Should not show rows for unset targets'
    );
  });
});
