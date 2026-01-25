import * as vscode from 'vscode';
import type {
  ColorScheme,
  MultiRootIdentifierSource,
  ThemeConfig,
  ThemeMode,
  TintConfig,
  TintTarget,
  WorkspaceIdentifierConfig,
  WorkspaceIdentifierSource,
} from './types';
import { DEFAULT_COLOR_SCHEME, isValidColorScheme } from '../color/schemes';

export type {
  ColorScheme,
  MultiRootIdentifierSource,
  ThemeConfig,
  ThemeMode,
  TintConfig,
  TintTarget,
  WorkspaceIdentifierConfig,
  WorkspaceIdentifierSource,
} from './types';

/**
 * Returns whether Patina is globally enabled.
 */
export function isEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('patina');
  return config.get<boolean>('enabled', true);
}

/**
 * Returns the workspace enabled state.
 * - undefined: Patina has never modified this workspace
 * - true: Patina has applied colors to this workspace
 * - false: User opted out of Patina for this workspace
 */
export function getWorkspaceEnabled(): boolean | undefined {
  const config = vscode.workspace.getConfiguration('patina');
  const inspection = config.inspect<boolean>('workspace.enabled');
  // Only read workspace-level value, ignore global
  return inspection?.workspaceValue;
}

/**
 * Sets the workspace enabled state at Workspace scope.
 */
export async function setWorkspaceEnabled(
  value: boolean | undefined
): Promise<void> {
  const config = vscode.workspace.getConfiguration('patina');
  await config.update(
    'workspace.enabled',
    value,
    vscode.ConfigurationTarget.Workspace
  );
}

const VALID_THEME_MODES: ThemeMode[] = ['auto', 'light', 'dark'];

function isValidThemeMode(value: string): value is ThemeMode {
  return VALID_THEME_MODES.includes(value as ThemeMode);
}

/**
 * Returns the configured color scheme.
 */
export function getColorScheme(): ColorScheme {
  const config = vscode.workspace.getConfiguration('patina');
  const scheme = config.get<string>('tint.colorScheme', DEFAULT_COLOR_SCHEME);
  return isValidColorScheme(scheme) ? scheme : DEFAULT_COLOR_SCHEME;
}

const VALID_SOURCES: WorkspaceIdentifierSource[] = [
  'name',
  'pathRelativeToHome',
  'pathAbsolute',
  'pathRelativeToCustom',
];

function isValidSource(value: string): value is WorkspaceIdentifierSource {
  return VALID_SOURCES.includes(value as WorkspaceIdentifierSource);
}

const VALID_MULTI_ROOT_SOURCES: MultiRootIdentifierSource[] = [
  'workspaceFile',
  'allFolders',
  'firstFolder',
];

function isValidMultiRootSource(
  value: string
): value is MultiRootIdentifierSource {
  return VALID_MULTI_ROOT_SOURCES.includes(value as MultiRootIdentifierSource);
}

/**
 * Reads the workspace identifier configuration from VSCode settings.
 */
export function getWorkspaceIdentifierConfig(): WorkspaceIdentifierConfig {
  const config = vscode.workspace.getConfiguration('patina');

  const source = config.get<string>(
    'workspaceIdentifier.source',
    'pathRelativeToHome'
  );
  const customBasePath = config.get<string>(
    'workspaceIdentifier.customBasePath',
    ''
  );
  const multiRootSource = config.get<string>(
    'workspaceIdentifier.multiRootSource',
    'workspaceFile'
  );

  return {
    source: isValidSource(source) ? source : 'pathRelativeToHome',
    customBasePath,
    multiRootSource: isValidMultiRootSource(multiRootSource)
      ? multiRootSource
      : 'workspaceFile',
  };
}

/**
 * Reads the tint configuration from VSCode settings.
 */
export function getTintConfig(): TintConfig {
  const config = vscode.workspace.getConfiguration('patina');

  const targets: TintTarget[] = [];
  if (config.get<boolean>('elements.titleBar', true)) {
    targets.push('titleBar');
  }
  if (config.get<boolean>('elements.statusBar', false)) {
    targets.push('statusBar');
  }
  if (config.get<boolean>('elements.activityBar', false)) {
    targets.push('activityBar');
  }

  // Default to titleBar if nothing is enabled
  if (targets.length === 0) {
    targets.push('titleBar');
  }

  const modeValue = config.get<string>('tint.mode', 'auto');
  const mode: ThemeMode = isValidThemeMode(modeValue) ? modeValue : 'auto';

  const seedValue = config.get<number>('tint.seed', 0);
  const seed = Number.isInteger(seedValue) ? seedValue : 0;

  return { targets, mode, seed };
}

/**
 * Reads the theme configuration from VSCode settings.
 */
export function getThemeConfig(): ThemeConfig {
  const config = vscode.workspace.getConfiguration('patina');

  const blendFactorValue = config.get<number>('theme.blendFactor', 0.35);
  // Clamp to valid range
  const blendFactor = Math.max(0, Math.min(1, blendFactorValue));

  return { blendFactor };
}

/**
 * Returns whether the status bar item is enabled.
 */
export function getStatusBarEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('patina');
  return config.get<boolean>('statusBar.enabled', false);
}
