import * as vscode from 'vscode';
import type { HSL } from './types';
import { hashString } from './hash';
import { hslToHex } from './convert';

/**
 * Color palette for VSCode UI elements.
 */
export interface PatinaColorPalette {
  'titleBar.activeBackground': string;
  'titleBar.inactiveBackground': string;
  'statusBar.background': string;
  'activityBar.background': string;
}

/**
 * Configuration for each UI element's color generation.
 * All elements share the same hue but vary in saturation/lightness for visual
 * hierarchy. Values tuned for dark themes.
 */
const UI_ELEMENT_CONFIG: Record<
  keyof PatinaColorPalette,
  { saturation: number; lightness: number }
> = {
  'titleBar.activeBackground': { saturation: 0.4, lightness: 0.32 },
  'titleBar.inactiveBackground': { saturation: 0.3, lightness: 0.28 },
  'statusBar.background': { saturation: 0.5, lightness: 0.35 },
  'activityBar.background': { saturation: 0.35, lightness: 0.25 },
};

/**
 * Generates a harmonious pastel color palette from a workspace identifier.
 * All colors share the same hue (derived from the identifier) but vary in
 * saturation and lightness to create visual hierarchy.
 *
 * @param workspaceIdentifier - A string identifying the workspace (typically
 *                              the folder name)
 * @returns A palette of hex color strings for each UI element
 */
export function generatePalette(
  workspaceIdentifier: string
): PatinaColorPalette {
  const hash = hashString(workspaceIdentifier);
  const baseHue = hash % 360;

  const palette: Partial<PatinaColorPalette> = {};

  for (const [key, config] of Object.entries(UI_ELEMENT_CONFIG)) {
    const hsl: HSL = {
      h: baseHue,
      s: config.saturation,
      l: config.lightness,
    };
    palette[key as keyof PatinaColorPalette] = hslToHex(hsl);
  }

  return palette as PatinaColorPalette;
}

/**
 * Extracts a suitable identifier from the current workspace.
 * Uses the first workspace folder's name, or undefined if no workspace is
 * open.
 *
 * @returns The workspace folder name, or undefined if no workspace is open
 */
export function getWorkspaceIdentifier(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].name;
}
