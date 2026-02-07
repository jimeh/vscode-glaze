import type { StatusState, StatusGeneralInfo } from './types';
import type { TintKeyDetail } from '../color/tint';
import type { ElementType } from '../theme';
import type { TintTarget } from '../config';
import { computeBaseTintHex } from '../color/tint';
import { capitalizeFirst } from '../statusBar/helpers';
import { escapeHtml } from '../webview';
import { renderWebviewHtml } from '../webview/html';

/**
 * Element groups in display order with their labels.
 */
const ELEMENT_GROUPS: { element: ElementType; label: string }[] = [
  { element: 'titleBar', label: 'Title Bar' },
  { element: 'activityBar', label: 'Activity Bar' },
  { element: 'statusBar', label: 'Status Bar' },
  { element: 'sideBar', label: 'Side Bar' },
];

/**
 * Generates an inline color swatch span.
 */
function colorSwatch(hex: string): string {
  return `<span class="color-swatch"` + ` style="background:${hex};"></span>`;
}

/**
 * Generates a color cell with swatch and hex code.
 */
function colorCell(hex: string | undefined): string {
  if (hex === undefined) {
    return '<span class="na">N/A</span>';
  }
  return `${colorSwatch(hex)} <code>${hex}</code>`;
}

/**
 * Generates the general info section.
 */
function generateGeneralInfo(state: StatusState): string {
  const g = state.general;

  const statusBadge = g.active
    ? '<span class="badge active">Active</span>'
    : '<span class="badge inactive">Inactive</span>';

  const globalEnabled = g.globalEnabled ? 'Yes' : 'No';

  let workspaceOverride: string;
  if (g.workspaceEnabled === undefined) {
    workspaceOverride = 'Not set (inherits global)';
  } else {
    workspaceOverride = g.workspaceEnabled ? 'Enabled' : 'Disabled';
  }

  const workspaceId = g.workspaceIdentifier
    ? escapeHtml(g.workspaceIdentifier)
    : '<span class="na">No workspace</span>';

  const themeName = g.themeName
    ? escapeHtml(g.themeName)
    : '<span class="na">Unknown</span>';
  const themeTypeLabel = g.themeType;
  const tintModeLabel = g.themeAutoDetected
    ? `Auto (${capitalizeFirst(g.tintType)})`
    : capitalizeFirst(g.tintType);

  const themeColors = g.themeColorsAvailable
    ? 'Available'
    : '<span class="na">Unknown theme</span>';

  const blendPct = Math.round(g.blendFactor * 100);
  const blendOverrideRows = generateBlendOverrideRows(g);
  const baseHueSwatch = g.workspaceIdentifier
    ? ` ${colorSwatch(computeBaseTintHex(g.baseHue, g.themeType ?? 'dark'))}`
    : '';

  const targetLabels =
    g.targets.length > 0
      ? g.targets.join(', ')
      : '<span class="na">None</span>';

  return `
    <div class="info-card">
      <table class="info-table">
        <tr>
          <td class="info-label">Status</td>
          <td>${statusBadge}</td>
        </tr>${
          g.customizedOutsidePatina
            ? `
        <tr>
          <td class="info-label"></td>
          <td><span class="badge warning">Colors modified outside Patina</span></td>
        </tr>`
            : ''
        }
        <tr>
          <td class="info-label">Global Enabled</td>
          <td>${globalEnabled}</td>
        </tr>
        <tr>
          <td class="info-label">Workspace Override</td>
          <td>${workspaceOverride}</td>
        </tr>
        <tr>
          <td class="info-label">Workspace ID</td>
          <td class="mono">${workspaceId}</td>
        </tr>
        <tr>
          <td class="info-label">Theme (detected)</td>
          <td>${themeName}${themeTypeLabel ? ` (${themeTypeLabel})` : ''}</td>
        </tr>
        <tr>
          <td class="info-label">OS Color Scheme</td>
          <td>${g.osColorScheme ? capitalizeFirst(g.osColorScheme) : '<span class="na">Unknown</span>'}</td>
        </tr>
        <tr>
          <td class="info-label">Tint Mode</td>
          <td>${tintModeLabel}</td>
        </tr>
        <tr>
          <td class="info-label">Theme Colors</td>
          <td>${themeColors}</td>
        </tr>
        <tr>
          <td class="info-label">Color Style</td>
          <td>${escapeHtml(g.colorStyle)}</td>
        </tr>
        <tr>
          <td class="info-label">Color Harmony</td>
          <td>${escapeHtml(g.colorHarmony)}</td>
        </tr>
        <tr>
          <td class="info-label">Blend Factor</td>
          <td>${blendPct}%</td>
        </tr>${blendOverrideRows}
        <tr>
          <td class="info-label">Seed</td>
          <td>${g.seed}</td>
        </tr>${
          g.baseHueOverride !== null
            ? `
        <tr>
          <td class="info-label">Hue Override</td>
          <td>${g.baseHueOverride}&deg;</td>
        </tr>`
            : ''
        }
        <tr>
          <td class="info-label">Base Hue</td>
          <td>${g.baseHue}&deg;${baseHueSwatch}</td>
        </tr>
        <tr>
          <td class="info-label">Tint Targets</td>
          <td>${targetLabels}</td>
        </tr>
      </table>
    </div>
  `;
}

/**
 * Display labels for tint targets in blend override rows.
 */
const TARGET_LABELS: Record<TintTarget, string> = {
  titleBar: 'Title Bar',
  activityBar: 'Activity Bar',
  statusBar: 'Status Bar',
  sideBar: 'Side Bar',
};

/**
 * Generates blend factor override rows for the general info table.
 * Only shows rows for targets that have an explicit override.
 */
function generateBlendOverrideRows(g: StatusGeneralInfo): string {
  const overrides = g.targetBlendFactors;
  if (!overrides || Object.keys(overrides).length === 0) {
    return '';
  }

  const rows: string[] = [];
  for (const [target, factor] of Object.entries(overrides)) {
    const label = TARGET_LABELS[target as TintTarget];
    const pct = Math.round(factor * 100);
    rows.push(
      `\n        <tr>` +
        `\n          <td class="info-label blend-override">` +
        `\u00a0\u00a0${label}</td>` +
        `\n          <td>${pct}% (override)</td>` +
        `\n        </tr>`
    );
  }
  return rows.join('');
}

/**
 * Generates the color pipeline table.
 */
function generateColorTable(colors: readonly TintKeyDetail[]): string {
  const rows: string[] = [];

  for (const group of ELEMENT_GROUPS) {
    const groupColors = colors.filter((c) => c.element === group.element);
    if (groupColors.length === 0) {
      continue;
    }

    // Group header row
    rows.push(
      `<tr class="group-header">` +
        `<td colspan="4">${group.label}</td>` +
        `</tr>`
    );

    // Color rows
    for (const color of groupColors) {
      const disabledClass = color.enabled ? '' : ' disabled';
      rows.push(
        `<tr class="color-row${disabledClass}">` +
          `<td class="key-cell mono">${escapeHtml(color.key)}</td>` +
          `<td class="color-cell">${colorCell(color.themeColor)}</td>` +
          `<td class="color-cell">${colorCell(color.tintHex)}</td>` +
          `<td class="color-cell">${colorCell(color.finalHex)}</td>` +
          `</tr>`
      );
    }
  }

  return `
    <table class="color-table">
      <thead>
        <tr>
          <th>Key</th>
          <th>Theme Color</th>
          <th>Tint Color</th>
          <th>Final Color</th>
        </tr>
      </thead>
      <tbody>
        ${rows.join('\n        ')}
      </tbody>
    </table>
  `;
}

/**
 * Status-specific CSS (appended after the base body reset).
 */
const STATUS_CSS = `
    html {
      scroll-behavior: smooth;
    }

    /* --- Section headings --- */

    h2 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 28px 0 12px 0;
      padding-bottom: 8px;
      color: var(--vscode-descriptionForeground);
      border-bottom: 1px solid
        var(--vscode-widget-border, transparent);
    }

    h2:first-of-type {
      margin-top: 0;
    }

    /* --- General info card --- */

    .info-card {
      background: var(--vscode-editorWidget-background);
      border: 1px solid
        var(--vscode-widget-border, transparent);
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
    }

    .info-table td {
      padding: 5px 10px 5px 0;
      vertical-align: top;
      line-height: 1.5;
    }

    .info-label {
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
      width: 150px;
      font-size: 12px;
    }

    .blend-override {
      font-size: 11px;
      opacity: 0.75;
    }

    .mono {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
    }

    /* --- Badges --- */

    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.03em;
      line-height: 1.4;
    }

    .badge.active {
      background: var(--vscode-testing-iconPassed,
        #388a34);
      color: #fff;
    }

    .badge.inactive {
      background: var(--vscode-descriptionForeground);
      color: var(--vscode-editor-background);
    }

    .badge.warning {
      background: var(--vscode-editorWarning-foreground,
        #cca700);
      color: #000;
    }

    .na {
      color: var(--vscode-descriptionForeground);
      font-style: italic;
      opacity: 0.7;
    }

    /* --- Color pipeline table --- */

    .color-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    .color-table th {
      text-align: left;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--vscode-descriptionForeground);
      border-bottom: 2px solid
        var(--vscode-widget-border);
    }

    .color-table td {
      padding: 6px 10px;
      border-bottom: 1px solid
        var(--vscode-widget-border);
    }

    .group-header td {
      font-weight: 600;
      font-size: 13px;
      padding-top: 20px;
      padding-bottom: 6px;
      color: var(--vscode-foreground);
      border-bottom: 1px solid
        var(--vscode-widget-border);
      border-left: 3px solid
        var(--vscode-focusBorder, #007fd4);
      padding-left: 10px;
    }

    /* --- Color rows: hover & disabled --- */

    .color-row {
      transition: background-color 0.15s ease;
    }

    .color-row:hover {
      background-color:
        var(--vscode-list-hoverBackground);
    }

    .color-row.disabled {
      opacity: 0.35;
    }

    .color-row.disabled:hover {
      opacity: 0.5;
    }

    /* --- Color cells & swatches --- */

    .key-cell {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      white-space: nowrap;
    }

    .color-cell {
      white-space: nowrap;
    }

    .color-cell code {
      font-family: var(--vscode-editor-font-family);
      font-size: var(--vscode-editor-font-size);
      letter-spacing: 0.02em;
    }

    .color-swatch {
      display: inline-block;
      width: 18px;
      height: 18px;
      border-radius: 4px;
      vertical-align: middle;
      margin-right: 8px;
      border: 1px solid
        var(--vscode-widget-border);
      box-shadow:
        0 1px 3px rgba(0, 0, 0, 0.22),
        inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    }

    /* --- Toolbar --- */

    .toolbar {
      float: right;
      margin-left: 12px;
      margin-bottom: 4px;
    }

    .refresh-btn {
      background:
        var(--vscode-button-secondaryBackground);
      color:
        var(--vscode-button-secondaryForeground);
      border: 1px solid
        var(--vscode-button-border, transparent);
      padding: 5px 14px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      transition: background-color 0.15s ease;
    }

    .refresh-btn:hover {
      background:
        var(--vscode-button-secondaryHoverBackground);
    }`;

/**
 * Status-specific script (runs inside an IIFE with acquireVsCodeApi).
 */
const STATUS_SCRIPT = `const vscode = acquireVsCodeApi();

      document.getElementById('refreshBtn')
        .addEventListener('click', () => {
          vscode.postMessage({ type: 'refresh' });
        });`;

/**
 * Generates the complete status HTML document.
 *
 * @param state - The current status state
 * @param nonce - CSP nonce for inline scripts
 * @param cspSource - CSP source for styles
 * @returns Complete HTML document string
 */
export function generateStatusHtml(
  state: StatusState,
  nonce: string,
  cspSource: string
): string {
  const generalInfo = generateGeneralInfo(state);
  const colorTable = generateColorTable(state.colors);

  return renderWebviewHtml({
    title: 'Patina Status',
    nonce,
    cspSource,
    css: STATUS_CSS,
    body: `<div class="toolbar">
    <button class="refresh-btn" id="refreshBtn">Refresh</button>
  </div>

  <h2>General Info</h2>
  ${generalInfo}

  <h2>Color Pipeline</h2>
  ${colorTable}`,
    script: STATUS_SCRIPT,
  });
}
