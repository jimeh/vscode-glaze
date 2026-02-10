import type { ThemeType } from '../theme';
import type { TintTarget } from '../config';
import type {
  HarmonyPreview,
  PreviewState,
  StylePreview,
  StylePreviewColors,
} from './types';
import { SAMPLE_HUES } from './colors';
import { getColorName } from '../color';
import { COLOR_HARMONY_LABELS } from '../color/harmony/definitions';
import { COLOR_STYLE_LABELS } from '../color/styles/definitions';
import { assertHex, escapeHtml } from '../webview';
import { renderWebviewHtml } from '../webview/html';

/**
 * Hue labels for column headers (OKLCH-calibrated hue angles).
 */
const HUE_LABELS: Record<number, string> = {
  29: 'Red',
  55: 'Orange',
  100: 'Yellow',
  145: 'Green',
  185: 'Teal',
  235: 'Cyan',
  265: 'Blue',
  305: 'Purple',
};

/**
 * Theme type display labels.
 */
const THEME_LABELS: Record<ThemeType, string> = {
  dark: 'Dark',
  light: 'Light',
  hcDark: 'HC Dark',
  hcLight: 'HC Light',
};

/**
 * All theme types in display order.
 */
const ALL_THEME_TYPES: ThemeType[] = ['dark', 'light', 'hcDark', 'hcLight'];

/**
 * Generates an inline color swatch with stacked elements.
 * Each element has a title attribute showing the color name on hover.
 */
function generateSwatch(colors: StylePreviewColors): string {
  const { titleBar, activityBar, sideBar, statusBar } = colors;

  // Validate all hex values before interpolating into style attrs
  assertHex(titleBar.background);
  assertHex(titleBar.foreground);
  assertHex(activityBar.background);
  assertHex(activityBar.foreground);
  assertHex(sideBar.background);
  assertHex(sideBar.foreground);
  assertHex(statusBar.background);
  assertHex(statusBar.foreground);

  return `
    <div class="swatch">
      <div class="element" style="background: ${titleBar.background}; color: ${titleBar.foreground};" title="${escapeHtml(getColorName(titleBar.background))}">
        <span class="name">Title</span>
      </div>
      <div class="element-row">
        <div class="element half" style="background: ${activityBar.background}; color: ${activityBar.foreground};" title="${escapeHtml(getColorName(activityBar.background))}">
          <span class="name">AB</span>
        </div>
        <div class="element half" style="background: ${sideBar.background}; color: ${sideBar.foreground};" title="${escapeHtml(getColorName(sideBar.background))}">
          <span class="name">SB</span>
        </div>
      </div>
      <div class="element" style="background: ${statusBar.background}; color: ${statusBar.foreground};" title="${escapeHtml(getColorName(statusBar.background))}">
        <span class="name">Status</span>
      </div>
    </div>
  `;
}

/**
 * Generates the theme type selector tabs.
 */
function generateThemeTabs(currentType: ThemeType): string {
  const tabs = ALL_THEME_TYPES.map((type) => {
    const active = type === currentType ? 'active' : '';
    const label = THEME_LABELS[type];
    return `<button class="theme-tab ${active}" data-theme="${type}">${label}</button>`;
  }).join('\n');

  return `<div class="theme-tabs">${tabs}</div>`;
}

/**
 * Short labels for per-target blend factor display.
 */
const TARGET_SHORT_LABELS: Record<TintTarget, string> = {
  titleBar: 'TB',
  activityBar: 'AB',
  statusBar: 'SB',
  sideBar: 'Side',
};

/**
 * Generates the blend info text.
 */
function generateBlendInfo(
  isBlended: boolean,
  blendFactor: number | undefined,
  targetBlendFactors?: Partial<Record<TintTarget, number>>
): string {
  if (!isBlended || blendFactor === undefined) {
    return '<span class="blend-info">No theme blending</span>';
  }
  const percentage = Math.round(blendFactor * 100);

  const overrides = targetBlendFactors
    ? Object.entries(targetBlendFactors)
    : [];
  if (overrides.length === 0) {
    return `<span class="blend-info">Blended ${percentage}% with theme</span>`;
  }

  const parts = overrides.map(
    ([t, f]) =>
      `${TARGET_SHORT_LABELS[t as TintTarget]}: ` + `${Math.round(f * 100)}%`
  );
  return (
    `<span class="blend-info">Blended ${percentage}% with theme` +
    ` (${parts.join(', ')})</span>`
  );
}

/**
 * Generates the workspace preview section.
 */
function generateWorkspaceSection(state: PreviewState): string {
  if (!state.workspacePreview) {
    return `
      <div class="workspace-section">
        <div class="workspace-header">
          <span class="workspace-label">Your Workspace:</span>
          <span class="workspace-name">No workspace open</span>
        </div>
      </div>
    `;
  }

  const { identifier, colors, isBlended, blendFactor, targetBlendFactors } =
    state.workspacePreview;
  const swatch = generateSwatch(colors);
  const blendInfo = generateBlendInfo(
    isBlended,
    blendFactor,
    targetBlendFactors
  );
  const colorName = getColorName(colors.titleBar.background);
  const styleLabel = COLOR_STYLE_LABELS[state.currentStyle];
  const harmonyLabel = COLOR_HARMONY_LABELS[state.currentHarmony];

  return `
    <div class="workspace-section">
      <div class="workspace-header">
        <span class="workspace-label">Your Workspace:</span>
        ${swatch}
        <div class="workspace-info">
          <span class="workspace-id"><span class="info-label">ID:</span> ${escapeHtml(identifier)}</span>
          <span class="workspace-color-name"><span class="info-label">Color:</span> ${escapeHtml(colorName)}</span>
          <span class="workspace-style"><span class="info-label">Style:</span> ${escapeHtml(styleLabel)}</span>
          <span class="workspace-harmony"><span class="info-label">Harmony:</span> ${escapeHtml(harmonyLabel)}</span>
        </div>
        ${blendInfo}
      </div>
    </div>
  `;
}

/**
 * Generates a single style row.
 */
function generateStyleRow(style: StylePreview, isCurrent: boolean): string {
  const currentClass = isCurrent ? 'current' : '';
  const currentBadge = isCurrent
    ? '<span class="current-badge">\u25CF</span>'
    : '';

  const hueCells = style.hueColors
    .map((colors) => `<td class="hue-cell">${generateSwatch(colors)}</td>`)
    .join('\n');

  return `
    <tr class="style-row ${currentClass}" data-style="${style.style}">
      <td class="comparison-name">${style.label}${currentBadge}</td>
      ${hueCells}
    </tr>
  `;
}

/**
 * Generates the color styles table.
 */
function generateStylesTable(state: PreviewState): string {
  const hueHeaders = SAMPLE_HUES.map(
    (hue) => `<th class="hue-header">${HUE_LABELS[hue]}</th>`
  ).join('\n');

  const styleRows = state.styles
    .map((s) => generateStyleRow(s, s.style === state.currentStyle))
    .join('\n');

  return `
    <table class="comparison-table">
      <thead>
        <tr>
          <th class="comparison-header">Style</th>
          ${hueHeaders}
        </tr>
      </thead>
      <tbody>
        ${styleRows}
      </tbody>
    </table>
  `;
}

/**
 * Generates a single harmony row.
 */
function generateHarmonyRow(
  harmony: HarmonyPreview,
  isCurrent: boolean
): string {
  const currentClass = isCurrent ? 'current' : '';
  const currentBadge = isCurrent
    ? '<span class="current-badge">\u25CF</span>'
    : '';

  const hueCells = harmony.hueColors
    .map((colors) => `<td class="hue-cell">${generateSwatch(colors)}</td>`)
    .join('\n');

  return `
    <tr class="harmony-row ${currentClass}" data-harmony="${harmony.harmony}">
      <td class="comparison-name">${harmony.label}${currentBadge}</td>
      ${hueCells}
    </tr>
  `;
}

/**
 * Generates the color harmonies table.
 */
function generateHarmoniesTable(state: PreviewState): string {
  const hueHeaders = SAMPLE_HUES.map(
    (hue) => `<th class="hue-header">${HUE_LABELS[hue]}</th>`
  ).join('\n');

  const harmonyRows = state.harmonies
    .map((h) => generateHarmonyRow(h, h.harmony === state.currentHarmony))
    .join('\n');

  return `
    <table class="comparison-table">
      <thead>
        <tr>
          <th class="comparison-header">Harmony</th>
          ${hueHeaders}
        </tr>
      </thead>
      <tbody>
        ${harmonyRows}
      </tbody>
    </table>
  `;
}

/**
 * Preview-specific CSS (appended after the base body reset).
 */
const PREVIEW_CSS = `
    html {
      scroll-behavior: smooth;
    }

    /* --- Segmented theme tabs --- */

    .theme-tabs {
      display: inline-flex;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-widget-border, transparent);
      border-radius: 6px;
      padding: 2px;
      margin-bottom: 20px;
      gap: 2px;
    }

    .theme-tab {
      background: transparent;
      color: var(--vscode-descriptionForeground);
      border: none;
      padding: 5px 14px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      font-family: inherit;
      letter-spacing: 0.01em;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .theme-tab:hover {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-foreground);
    }

    .theme-tab.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    /* --- Workspace card --- */

    .workspace-section {
      background: var(--vscode-editorWidget-background);
      border: 1px solid var(--vscode-widget-border, transparent);
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    .workspace-header {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }

    .workspace-label {
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-descriptionForeground);
    }

    .workspace-section .swatch {
      border-radius: 6px;
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.25),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .workspace-section .element {
      padding: 3px 10px;
      min-width: 60px;
      font-size: 12px;
    }

    .workspace-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .workspace-id {
      color: var(--vscode-foreground);
      font-size: 13px;
    }

    .info-label {
      color: var(--vscode-descriptionForeground);
    }

    .blend-info {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-badge-background);
      padding: 3px 10px;
      border-radius: 10px;
      margin-left: auto;
      letter-spacing: 0.01em;
    }

    .workspace-color-name,
    .workspace-style,
    .workspace-harmony {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    /* --- Section headings --- */

    .section-heading {
      margin: 28px 0 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--vscode-descriptionForeground);
      border-bottom: 1px solid var(--vscode-widget-border);
      padding-bottom: 8px;
    }

    .section-heading:first-of-type {
      margin-top: 0;
    }

    /* --- Comparison tables --- */

    .comparison-table {
      width: 100%;
      border-collapse: collapse;
    }

    .comparison-table thead {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .comparison-table th {
      padding: 6px 4px 10px;
      text-align: center;
      background: var(--vscode-editor-background);
      border-bottom:
        1px solid var(--vscode-widget-border);
    }

    .comparison-table td {
      padding: 6px 4px;
      text-align: center;
    }

    .comparison-header {
      text-align: left;
      width: 110px;
      padding-left: 12px !important;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-descriptionForeground);
    }

    .hue-header {
      font-size: 11px;
      font-weight: 500;
      color: var(--vscode-descriptionForeground);
      letter-spacing: 0.02em;
    }

    /* --- Rows: selection & hover --- */

    .style-row,
    .harmony-row {
      cursor: pointer;
      transition: background 0.15s ease;
      border-left: 3px solid transparent;
    }

    .style-row:hover,
    .harmony-row:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .style-row:hover .swatch,
    .harmony-row:hover .swatch {
      transform: scale(1.08);
      box-shadow:
        0 2px 8px rgba(0, 0, 0, 0.3),
        inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    }

    .style-row.current,
    .harmony-row.current {
      border-left-color:
        var(--vscode-focusBorder, var(--vscode-button-background));
      background: var(--vscode-list-activeSelectionBackground);
    }

    .style-row.current:hover,
    .harmony-row.current:hover {
      background: var(--vscode-list-activeSelectionBackground);
    }

    .comparison-name {
      text-align: left;
      font-weight: 500;
      font-size: 13px;
      padding-left: 9px !important;
      white-space: nowrap;
    }

    .current-badge {
      color: var(--vscode-charts-green);
      margin-left: 5px;
      font-size: 8px;
      vertical-align: middle;
    }

    /* --- Swatches --- */

    .swatch {
      display: inline-flex;
      flex-direction: column;
      border-radius: 5px;
      overflow: hidden;
      box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.22),
        inset 0 0 0 1px rgba(255, 255, 255, 0.04);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .element {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px 7px;
      min-width: 54px;
      font-size: 11px;
      line-height: 1.4;
    }

    .element-row {
      display: flex;
      flex-direction: row;
    }

    .element.half {
      flex: 1;
      min-width: 0;
    }

    .element .name {
      font-weight: 500;
      font-size: 10px;
      letter-spacing: 0.02em;
    }

    .hue-cell {
      vertical-align: middle;
    }

    /* --- Hint text --- */

    .hint {
      margin-top: 10px;
      margin-bottom: 20px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
      font-style: italic;
    }`;

/**
 * Preview-specific script (runs inside an IIFE with acquireVsCodeApi).
 */
const PREVIEW_SCRIPT = `const vscode = acquireVsCodeApi();

      // Theme tab click handler
      document.querySelectorAll('.theme-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const themeType = tab.dataset.theme;
          vscode.postMessage({ type: 'changeThemeType', themeType });
        });
      });

      // Style row click handler
      document.querySelectorAll('.style-row').forEach(row => {
        row.addEventListener('click', () => {
          const style = row.dataset.style;
          vscode.postMessage({ type: 'selectStyle', style });
        });
      });

      // Harmony row click handler
      document.querySelectorAll('.harmony-row').forEach(row => {
        row.addEventListener('click', () => {
          const harmony = row.dataset.harmony;
          vscode.postMessage({ type: 'selectHarmony', harmony });
        });
      });`;

/**
 * Generates the complete preview HTML document.
 */
export function generatePreviewHtml(
  state: PreviewState,
  nonce: string,
  cspSource: string
): string {
  const themeTabs = generateThemeTabs(state.themeType);
  const workspaceSection = generateWorkspaceSection(state);
  const stylesTable = generateStylesTable(state);
  const harmoniesTable = generateHarmoniesTable(state);

  return renderWebviewHtml({
    title: 'Glaze Color Preview',
    nonce,
    cspSource,
    css: PREVIEW_CSS,
    body: `${themeTabs}
  ${workspaceSection}
  <h3 class="section-heading">Color Style</h3>
  ${stylesTable}
  <p class="hint">Click a row to apply that color style.</p>
  <h3 class="section-heading">Color Harmony</h3>
  ${harmoniesTable}
  <p class="hint">Click a row to apply that color harmony.</p>`,
    script: PREVIEW_SCRIPT,
  });
}
