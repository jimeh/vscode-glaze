import * as vscode from 'vscode';
import { DEFAULT_BLEND_FACTOR } from './types';
import type {
  ColorHarmony,
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
import { DEFAULT_COLOR_HARMONY, isValidColorHarmony } from '../color/harmony';

export { DEFAULT_BLEND_FACTOR } from './types';
export type {
  ColorHarmony,
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

/**
 * Reads a string config value and validates it against allowed values.
 * Returns the default if the value is not in the allowed set.
 */
function getValidatedEnum<T extends string>(
  config: vscode.WorkspaceConfiguration,
  key: string,
  validValues: readonly T[],
  defaultValue: T
): T {
  const value = config.get<string>(key, defaultValue);
  return (validValues as readonly string[]).includes(value)
    ? (value as T)
    : defaultValue;
}

const VALID_THEME_MODES: readonly ThemeMode[] = ['auto', 'light', 'dark'];

const VALID_SOURCES: readonly WorkspaceIdentifierSource[] = [
  'name',
  'pathRelativeToHome',
  'pathAbsolute',
  'pathRelativeToCustom',
];

const VALID_MULTI_ROOT_SOURCES: readonly MultiRootIdentifierSource[] = [
  'workspaceFile',
  'allFolders',
  'firstFolder',
];

/**
 * Returns the configured color scheme.
 */
export function getColorScheme(): ColorScheme {
  const config = vscode.workspace.getConfiguration('patina');
  const scheme = config.get<string>('tint.colorScheme', DEFAULT_COLOR_SCHEME);
  return isValidColorScheme(scheme) ? scheme : DEFAULT_COLOR_SCHEME;
}

/**
 * Returns the configured color harmony.
 */
export function getColorHarmony(): ColorHarmony {
  const config = vscode.workspace.getConfiguration('patina');
  const harmony = config.get<string>(
    'tint.colorHarmony',
    DEFAULT_COLOR_HARMONY
  );
  return isValidColorHarmony(harmony) ? harmony : DEFAULT_COLOR_HARMONY;
}

/**
 * Reads the workspace identifier configuration from VSCode settings.
 */
export function getWorkspaceIdentifierConfig(): WorkspaceIdentifierConfig {
  const config = vscode.workspace.getConfiguration('patina');

  return {
    source: getValidatedEnum(
      config,
      'workspaceIdentifier.source',
      VALID_SOURCES,
      'pathRelativeToHome'
    ),
    customBasePath: config.get<string>(
      'workspaceIdentifier.customBasePath',
      ''
    ),
    multiRootSource: getValidatedEnum(
      config,
      'workspaceIdentifier.multiRootSource',
      VALID_MULTI_ROOT_SOURCES,
      'workspaceFile'
    ),
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
  if (config.get<boolean>('elements.sideBar', false)) {
    targets.push('sideBar');
  }

  const mode = getValidatedEnum(config, 'tint.mode', VALID_THEME_MODES, 'auto');

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
  sideBar: 'theme.sideBarBlendFactor',
};

/**
 * Reads the theme configuration from VSCode settings.
 */
export function getThemeConfig(): ThemeConfig {
  const config = vscode.workspace.getConfiguration('patina');

  const blendFactorValue = config.get<number>(
    'theme.blendFactor',
    DEFAULT_BLEND_FACTOR
  );
  // Clamp to valid range
  const blendFactor = Math.max(0, Math.min(1, blendFactorValue));

  const targetBlendFactors: Partial<Record<TintTarget, number>> = {};
  const targets = Object.keys(TARGET_BLEND_FACTOR_KEYS) as TintTarget[];
  for (const target of targets) {
    const key = TARGET_BLEND_FACTOR_KEYS[target];
    const value = config.get<number | null>(key, null);
    if (value !== null && typeof value === 'number') {
      targetBlendFactors[target] = Math.max(0, Math.min(1, value));
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
