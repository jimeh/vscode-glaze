import * as vscode from 'vscode';
import type {
  WorkspaceIdentifierConfig,
  WorkspaceIdentifierSource,
} from './types';

export type { WorkspaceIdentifierConfig, WorkspaceIdentifierSource } from
  './types';

const VALID_SOURCES: WorkspaceIdentifierSource[] = [
  'name',
  'pathRelativeToHome',
  'pathAbsolute',
  'pathRelativeToCustom',
];

/**
 * Reads the workspace identifier configuration from VSCode settings.
 */
export function getWorkspaceIdentifierConfig(): WorkspaceIdentifierConfig {
  const config = vscode.workspace.getConfiguration('patina');

  const source = config.get<string>('workspaceIdentifier.source', 'name');
  const customBasePath = config.get<string>(
    'workspaceIdentifier.customBasePath',
    ''
  );

  return {
    source: isValidSource(source) ? source : 'name',
    customBasePath,
  };
}

function isValidSource(value: string): value is WorkspaceIdentifierSource {
  return VALID_SOURCES.includes(value as WorkspaceIdentifierSource);
}
