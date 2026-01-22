/**
 * Determines what value is used to generate the workspace color.
 */
export type WorkspaceIdentifierSource =
  | 'name'
  | 'pathRelativeToHome'
  | 'pathAbsolute'
  | 'pathRelativeToCustom';

/**
 * Configuration for workspace identifier generation.
 */
export interface WorkspaceIdentifierConfig {
  /**
   * The source to use for generating the workspace identifier.
   */
  source: WorkspaceIdentifierSource;

  /**
   * Base path for 'pathRelativeToCustom' source.
   * Supports ~ for home directory. Falls back to absolute path if workspace
   * is outside this path.
   */
  customBasePath: string;
}
