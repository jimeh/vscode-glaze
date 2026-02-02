import type { ThemeType } from '../theme';
import type { TintTarget } from '../config';
import type { PreviewState, SchemePreview, SchemePreviewColors } from './types';
import { SAMPLE_HUES } from './colors';
import { getColorName } from '../color';
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
function generateSwatch(colors: SchemePreviewColors): string {
  const { titleBar, activityBar, statusBar } = colors;

  // Validate all hex values before interpolating into style attrs
  assertHex(titleBar.background);
  assertHex(titleBar.foreground);
  assertHex(activityBar.background);
  assertHex(activityBar.foreground);
  assertHex(statusBar.background);
  assertHex(statusBar.foreground);

  return `
    <div class="swatch">
      <div class="element" style="background: ${titleBar.background}; color: ${titleBar.foreground};" title="${escapeHtml(getColorName(titleBar.background))}">
        <span class="label">TB</span>
        <span class="sample">Aa</span>
      </div>
      <div class="element" style="background: ${activityBar.background}; color: ${activityBar.foreground};" title="${escapeHtml(getColorName(activityBar.background))}">
        <span class="label">AB</span>
        <span class="sample">Aa</span>
      </div>
      <div class="element" style="background: ${statusBar.background}; color: ${statusBar.foreground};" title="${escapeHtml(getColorName(statusBar.background))}">
        <span class="label">SB</span>
        <span class="sample">Aa</span>
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

  return `
    <div class="workspace-section">
      <div class="workspace-header">
        <span class="workspace-label">Your Workspace:</span>
        ${swatch}
        <div class="workspace-info">
          <span class="workspace-id"><span class="info-label">ID:</span> ${escapeHtml(identifier)}</span>
          <span class="workspace-color-name"><span class="info-label">Color:</span> ${escapeHtml(colorName)}</span>
        </div>
        ${blendInfo}
      </div>
    </div>
  `;
}

/**
 * Generates a single scheme row.
 */
function generateSchemeRow(scheme: SchemePreview, isCurrent: boolean): string {
  const currentClass = isCurrent ? 'current' : '';
  const currentBadge = isCurrent ? '<span class="current-badge">*</span>' : '';

  const hueCells = scheme.hueColors
    .map((colors) => `<td class="hue-cell">${generateSwatch(colors)}</td>`)
    .join('\n');

  return `
    <tr class="scheme-row ${currentClass}" data-scheme="${scheme.scheme}">
      <td class="scheme-name">${scheme.label}${currentBadge}</td>
      ${hueCells}
    </tr>
  `;
}

/**
 * Generates the color schemes table.
 */
function generateSchemesTable(state: PreviewState): string {
  const hueHeaders = SAMPLE_HUES.map(
    (hue) => `<th class="hue-header">${HUE_LABELS[hue]}</th>`
  ).join('\n');

  const schemeRows = state.schemes
    .map((scheme) =>
      generateSchemeRow(scheme, scheme.scheme === state.currentScheme)
    )
    .join('\n');

  return `
    <table class="schemes-table">
      <thead>
        <tr>
          <th class="scheme-header">Scheme</th>
          ${hueHeaders}
        </tr>
      </thead>
      <tbody>
        ${schemeRows}
      </tbody>
    </table>
  `;
}

/**
 * Preview-specific CSS (appended after the base body reset).
 */
const PREVIEW_CSS = `
    .theme-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .theme-tab {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: 1px solid var(--vscode-button-border, transparent);
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 13px;
    }

    .theme-tab:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    .theme-tab.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .workspace-section {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }

    .workspace-header {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .workspace-label {
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .workspace-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .workspace-id {
      color: var(--vscode-foreground);
    }

    .info-label {
      color: var(--vscode-descriptionForeground);
    }

    .blend-info {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-badge-background);
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: auto;
    }

    .workspace-color-name {
      font-size: 12px;
      color: var(--vscode-foreground);
    }

    .schemes-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .schemes-table th,
    .schemes-table td {
      padding: 8px;
      text-align: center;
      border-bottom: 1px solid var(--vscode-widget-border);
    }

    .scheme-header {
      text-align: left;
      width: 120px;
    }

    .hue-header {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
    }

    .scheme-row {
      cursor: pointer;
      transition: background 0.15s;
    }

    .scheme-row:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .scheme-row.current {
      background: var(--vscode-list-activeSelectionBackground);
    }

    .scheme-row.current:hover {
      background: var(--vscode-list-activeSelectionBackground);
    }

    .scheme-name {
      text-align: left;
      font-weight: 500;
    }

    .current-badge {
      color: var(--vscode-charts-green);
      margin-left: 4px;
    }

    .swatch {
      display: inline-flex;
      flex-direction: column;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .element {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 6px;
      min-width: 50px;
      font-size: 11px;
    }

    .element .label {
      font-weight: 600;
      opacity: 0.7;
    }

    .element .sample {
      font-weight: 500;
    }

    .hue-cell {
      vertical-align: middle;
    }

    .hint {
      margin-top: 16px;
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
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

      // Scheme row click handler
      document.querySelectorAll('.scheme-row').forEach(row => {
        row.addEventListener('click', () => {
          const scheme = row.dataset.scheme;
          vscode.postMessage({ type: 'selectScheme', scheme });
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
  const schemesTable = generateSchemesTable(state);

  return renderWebviewHtml({
    title: 'Patina Color Preview',
    nonce,
    cspSource,
    css: PREVIEW_CSS,
    body: `${themeTabs}
  ${workspaceSection}
  ${schemesTable}
  <p class="hint">Click a row to apply that color scheme.</p>`,
    script: PREVIEW_SCRIPT,
  });
}
