import type { ThemeType } from '../theme';

/**
 * Determines if the status bar should show as active.
 */
export function isStatusBarActive(
  globalEnabled: boolean,
  workspaceEnabled: boolean | undefined
): boolean {
  return globalEnabled && workspaceEnabled !== false;
}

/**
 * Gets the status text describing the enabled state.
 */
export function getStatusText(
  globalEnabled: boolean,
  workspaceEnabled: boolean | undefined
): string {
  if (!globalEnabled) {
    return 'Disabled globally';
  }
  if (workspaceEnabled === false) {
    return 'Disabled for this workspace';
  }
  if (workspaceEnabled === true) {
    return 'Enabled (Global + Workspace)';
  }
  return 'Enabled globally';
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
  return `<span style="background-color:${hex};border-radius:2px;">&nbsp;&nbsp;&nbsp;</span>`;
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
  if (!id.includes('\n')) {
    return `\`${id}\``;
  }
  // Multi-folder: each on its own line with HTML line breaks
  const folders = id.split('\n');
  return '<br>' + folders.map((f) => `\`${f}\``).join('<br>');
}
