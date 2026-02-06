import type { ThemeType } from '../theme';
import { getColorName } from '../color';
import { assertHex, escapeHtml } from '../webview';
import type { TintColors } from './types';

/**
 * Determines if Patina is effectively enabled for the current workspace.
 * Workspace override takes precedence over global.
 */
export function isEffectivelyEnabled(
  globalEnabled: boolean,
  workspaceEnabledOverride: boolean | undefined
): boolean {
  if (workspaceEnabledOverride !== undefined) {
    return workspaceEnabledOverride;
  }
  return globalEnabled;
}

/**
 * Whether Patina is actively applying tint colors.
 * True when enabled, a workspace identifier exists, and at least one
 * tint target element is enabled. This is the canonical active check
 * — keep all call sites in sync with doReconcile (extension.ts).
 */
export function isTintActive(
  globalEnabled: boolean,
  workspaceEnabledOverride: boolean | undefined,
  workspaceIdentifier: string | undefined,
  hasActiveTargets: boolean
): boolean {
  return (
    isEffectivelyEnabled(globalEnabled, workspaceEnabledOverride) &&
    workspaceIdentifier !== undefined &&
    hasActiveTargets
  );
}

/**
 * Gets the status text describing the enabled state.
 */
export function getStatusText(
  globalEnabled: boolean,
  workspaceEnabledOverride: boolean | undefined
): string {
  if (workspaceEnabledOverride === true) {
    if (globalEnabled) {
      return 'Enabled (Global + Workspace)';
    }
    return 'Enabled for this workspace';
  }
  if (workspaceEnabledOverride === false) {
    return 'Disabled for this workspace';
  }
  if (globalEnabled) {
    return 'Enabled globally';
  }
  return 'Disabled globally';
}

/**
 * Gets a human-readable label for the theme mode.
 */
export function getThemeModeLabel(
  themeType: ThemeType,
  themeAutoDetected: boolean
): string {
  const typeLabel = capitalizeFirst(themeType);

  if (themeAutoDetected) {
    return `Auto (${typeLabel})`;
  }
  return typeLabel;
}

/**
 * Creates an HTML color swatch span element.
 */
export function colorSwatch(hex: string): string {
  assertHex(hex);
  return (
    `<span style="background-color:${hex};border-radius:3px;">` +
    '&nbsp;&nbsp;&nbsp;&nbsp;</span>'
  );
}

/**
 * Creates a markdown command link to copy a hex color to the clipboard.
 */
export function colorCopyLink(hex: string): string {
  assertHex(hex);
  const args = encodeURIComponent(JSON.stringify(hex));
  return `[$(copy)](command:patina.copyColor?${args})`;
}

/**
 * Creates a markdown table row for a color entry in the tooltip.
 */
export function colorTableRow(label: string, hex: string): string {
  const swatch = colorSwatch(hex);
  const name = escapeHtml(getColorName(hex));
  const copy = colorCopyLink(hex);
  return `| ${label} | ${swatch} "${name}" ` + `| \`${hex}\` | ${copy} |`;
}

/**
 * Builds a two-column markdown table for tooltip properties.
 */
export function buildPropertiesTable(
  rows: ReadonlyArray<readonly [string, string]>
): string {
  const lines: string[] = ['| | |', '|:--|:--|'];
  for (const [label, value] of rows) {
    lines.push(`| **${label}** | ${value} |`);
  }
  return lines.join('\n');
}

/**
 * Builds a markdown table of tint colors for the tooltip.
 */
export function buildColorTable(tintColors: TintColors): string {
  const rows: string[] = [
    '| Element | Color | Hex | |',
    '|:--|:--|:--|:--|',
    colorTableRow('Base', tintColors.baseTint),
  ];

  if (tintColors.titleBar) {
    rows.push(colorTableRow('Title Bar', tintColors.titleBar));
  }
  if (tintColors.activityBar) {
    rows.push(colorTableRow('Activity Bar', tintColors.activityBar));
  }
  if (tintColors.sideBar) {
    rows.push(colorTableRow('Side Bar', tintColors.sideBar));
  }
  if (tintColors.statusBar) {
    rows.push(colorTableRow('Status Bar', tintColors.statusBar));
  }

  return rows.join('\n');
}

/**
 * Escapes characters that have special meaning in markdown or HTML.
 *
 * Use on user-controlled strings before interpolating them into
 * `MarkdownString.appendMarkdown()` to prevent injection of HTML
 * tags or markdown command links.
 */
export function escapeForMarkdown(str: string): string {
  return str.replace(/[\\`*_{}[\]()<>&~|!]/g, '\\$&');
}

/**
 * Capitalizes the first character of a string.
 */
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats workspace ID for tooltip display.
 * Single values stay inline; multi-folder values are comma-joined.
 */
export function formatWorkspaceIdForDisplay(id: string): string {
  // Replace backticks with single quotes to prevent code-span breakout.
  // Content inside backtick code spans is already safe from HTML rendering.
  const safe = id.replace(/`/g, "'");

  if (!safe.includes('\n')) {
    return `\`${safe}\``;
  }
  // Multi-folder: comma-separated for compact display in table cells
  const folders = safe.split('\n');
  return folders.map((f) => `\`${f}\``).join(', ');
}
