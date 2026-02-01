import type { ThemeType } from '../theme';
import { getColorName } from '../color';
import { assertHex, escapeHtml } from '../webview';

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
    `<span style="background-color:${hex};border-radius:2px;">` +
    '&nbsp;&nbsp;&nbsp;</span>'
  );
}

/**
 * Creates a color swatch with hex code, color name, and a clickable copy icon.
 */
export function clickableColorSwatch(hex: string): string {
  const swatch = colorSwatch(hex);
  const name = escapeHtml(getColorName(hex));
  const args = encodeURIComponent(JSON.stringify(hex));
  return `${swatch} "${name}" \`${hex}\` [$(copy)](command:patina.copyColor?${args})`;
}

/**
 * Escapes characters that have special meaning in markdown or HTML.
 *
 * Use on user-controlled strings before interpolating them into
 * `MarkdownString.appendMarkdown()` to prevent injection of HTML
 * tags or markdown command links.
 */
export function escapeForMarkdown(str: string): string {
  return str.replace(/[\\`*_{}\[\]()<>&~|!]/g, '\\$&');
}

/**
 * Capitalizes the first character of a string.
 */
export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formats workspace ID for tooltip display.
 * Single values stay inline; multi-line values get formatted as a list.
 */
export function formatWorkspaceIdForDisplay(id: string): string {
  // Replace backticks with single quotes to prevent code-span breakout.
  // Content inside backtick code spans is already safe from HTML rendering.
  const safe = id.replace(/`/g, "'");

  if (!safe.includes('\n')) {
    return `\`${safe}\``;
  }
  // Multi-folder: each on its own line with HTML line breaks
  const folders = safe.split('\n');
  return '<br>' + folders.map((f) => `\`${f}\``).join('<br>');
}
