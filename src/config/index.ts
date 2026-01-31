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
export function isGloballyEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('patina');
  const inspection = config.inspect<boolean>('enabled');
  return inspection?.globalValue ?? false;
}

/**
 * Returns whether Patina is enabled for the current workspace.
 * Workspace-level patina.enabled takes precedence over global.
 */
export function isEnabledForWorkspace(): boolean {
  const config = vscode.workspace.getConfiguration('patina');
  const inspection = config.inspect<boolean>('enabled');
  // Workspace value takes precedence if set
  if (inspection?.workspaceValue !== undefined) {
    return inspection.workspaceValue;
  }
  // Fall back to global
  return inspection?.globalValue ?? false;
}

/**
 * Returns the workspace-level enabled override.
 * - undefined: No workspace override (inherits global)
 * - true: Workspace override enables Patina
 * - false: Workspace override disables Patina
 */
export function getWorkspaceEnabledOverride(): boolean | undefined {
  const config = vscode.workspace.getConfiguration('patina');
  const inspection = config.inspect<boolean>('enabled');
  return inspection?.workspaceValue;
}

/**
 * Sets patina.enabled at Workspace scope.
 */
export async function setEnabledForWorkspace(
  value: boolean | undefined
): Promise<void> {
  const config = vscode.workspace.getConfiguration('patina');
  await config.update('enabled', value, vscode.ConfigurationTarget.Workspace);
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
  if (config.get<boolean>('elements.statusBar', true)) {
    targets.push('statusBar');
  }
  if (config.get<boolean>('elements.activityBar', true)) {
    targets.push('activityBar');
  }

  const modeValue = config.get<string>('tint.mode', 'auto');
  const mode: ThemeMode = isValidThemeMode(modeValue) ? modeValue : 'auto';

  const seedValue = config.get<number>('tint.seed', 0);
  const seed = Number.isInteger(seedValue) ? seedValue : 0;

  return { targets, mode, seed };
}

/**
 * Mapping of tint targets to their blend factor setting keys.
 */
const TARGET_BLEND_FACTOR_KEYS: Record<TintTarget, string> = {
  titleBar: 'theme.titleBarBlendFactor',
  activityBar: 'theme.activityBarBlendFactor',
  statusBar: 'theme.statusBarBlendFactor',
};

/**
 * Reads the theme configuration from VSCode settings.
 */
export function getThemeConfig(): ThemeConfig {
  const config = vscode.workspace.getConfiguration('patina');

  const blendFactorValue = config.get<number>('theme.blendFactor', 0.35);
  // Clamp to valid range
  const blendFactor = Math.max(0, Math.min(1, blendFactorValue));

  const targetBlendFactors: Partial<Record<TintTarget, number>> = {};
  for (const [target, key] of Object.entries(TARGET_BLEND_FACTOR_KEYS)) {
    const value = config.get<number | null>(key, null);
    if (value !== null && typeof value === 'number') {
      targetBlendFactors[target as TintTarget] = Math.max(
        0,
        Math.min(1, value)
      );
    }
  }

  return { blendFactor, targetBlendFactors };
}

/**
 * Returns whether the status bar item is enabled.
 */
export function getStatusBarEnabled(): boolean {
  const config = vscode.workspace.getConfiguration('patina');
  return config.get<boolean>('statusBar.enabled', true);
}
