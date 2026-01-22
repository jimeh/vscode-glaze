import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import type { HSL } from './types';
import type { WorkspaceIdentifierConfig } from '../config';
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
 * Normalizes a path by converting backslashes to forward slashes.
 * Ensures consistent hashing across platforms.
 */
function normalizePath(p: string): string {
  return p.replace(/\\/g, '/');
}

/**
 * Expands ~ to the home directory in a path.
 */
function expandTilde(p: string): string {
  if (p.startsWith('~')) {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

/**
 * Computes the relative path from a base to a target.
 * Returns undefined if the target is not within the base path.
 */
function getRelativePath(basePath: string, targetPath: string): string | undefined {
  const normalizedBase = normalizePath(path.resolve(basePath));
  const normalizedTarget = normalizePath(path.resolve(targetPath));

  if (!normalizedTarget.startsWith(normalizedBase + '/') &&
      normalizedTarget !== normalizedBase) {
    return undefined;
  }

  const relative = path.relative(basePath, targetPath);
  return normalizePath(relative) || '.';
}

/**
 * Extracts a suitable identifier from the current workspace based on config.
 *
 * @param config - Configuration specifying how to generate the identifier
 * @returns The workspace identifier, or undefined if no workspace is open
 */
export function getWorkspaceIdentifier(
  config: WorkspaceIdentifierConfig
): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }

  const folder = folders[0];
  const folderPath = folder.uri.fsPath;

  switch (config.source) {
    case 'name':
      return folder.name;

    case 'pathRelativeToHome': {
      const homedir = os.homedir();
      const relative = getRelativePath(homedir, folderPath);
      return relative ?? normalizePath(folderPath);
    }

    case 'pathAbsolute':
      return normalizePath(folderPath);

    case 'pathRelativeToCustom': {
      if (!config.customBasePath) {
        return normalizePath(folderPath);
      }
      const basePath = expandTilde(config.customBasePath);
      const relative = getRelativePath(basePath, folderPath);
      return relative ?? normalizePath(folderPath);
    }

    default:
      return folder.name;
  }
}
