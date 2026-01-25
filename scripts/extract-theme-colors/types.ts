/**
 * Types for theme extraction script.
 * Note: These types are intentionally duplicated from src/theme/colorKeys.ts
 * because the script has its own tsconfig that can't import from src/.
 */

/**
 * Extension registry source.
 */
export type RegistrySource = 'marketplace' | 'openvsx';

/**
 * Official VSCode theme types.
 * Matches VSCode's uiTheme values and theme JSON type field.
 */
export type ThemeType = 'dark' | 'light' | 'hcDark' | 'hcLight';

/**
 * All color keys that can be extracted from themes.
 * Uses native VSCode color keys (matching workbench.colorCustomizations).
 */
export type ThemeColorKey =
  | 'editor.background'
  | 'editor.foreground'
  | 'titleBar.activeBackground'
  | 'titleBar.activeForeground'
  | 'titleBar.inactiveBackground'
  | 'titleBar.inactiveForeground'
  | 'statusBar.background'
  | 'statusBar.foreground'
  | 'activityBar.background'
  | 'activityBar.foreground';

/**
 * Theme colors using native VSCode keys.
 * editor.background is required; all others are optional.
 */
export type ThemeColors = {
  'editor.background': string;
} & Partial<Record<Exclude<ThemeColorKey, 'editor.background'>, string>>;

/**
 * Extracted theme information.
 */
export interface ExtractedTheme {
  /** Theme name used as key (ID if available, otherwise label) */
  name: string;
  /** Display label (may differ from name/ID) */
  label: string;
  colors: ThemeColors;
  type: ThemeType;
  extensionId: string;
  publisherName: string;
  extensionName: string;
  installCount: number;
}

/**
 * VS Code extension metadata from marketplace or OpenVSX.
 */
export interface MarketplaceExtension {
  extensionId: string;
  extensionName: string;
  displayName: string | null;
  publisherName: string;
  version: string;
  installCount: number;
  vsixUrl?: string;
  themes: ThemeContribution[];
  /** Source registry for this extension */
  source?: RegistrySource;
}

/**
 * Theme data stored in metadata files.
 */
export interface MetadataTheme {
  name: string;
  label: string;
  colors: ThemeColors;
  type: ThemeType;
}

/**
 * Per-extension metadata stored in .meta.json sidecar files.
 */
export interface ExtensionMetadata {
  extensionId: string;
  extensionName: string;
  publisherName: string;
  displayName: string | null;
  version: string;
  extractedAt: string;
  installCount: number;
  /** Theme data extracted from extension */
  themes: MetadataTheme[];
  /** Source registry for this extension */
  source?: RegistrySource;
}

/**
 * Theme contribution from package.json.
 */
export interface ThemeContribution {
  /** Theme display name */
  label: string;
  /** Optional unique ID - if present, this is what VSCode stores in settings */
  id?: string;
  uiTheme: string;
  path: string;
}

/**
 * Raw theme JSON content.
 */
export interface ThemeJson {
  name?: string;
  type?: string;
  include?: string;
  colors?: Record<string, string>;
  tokenColors?: unknown[] | string;
}

/**
 * Cache entry with timestamp.
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Marketplace API query response.
 */
export interface MarketplaceQueryResponse {
  results: Array<{
    extensions: Array<{
      extensionId: string;
      extensionName: string;
      displayName: string;
      publisher: {
        publisherName: string;
        displayName: string;
      };
      versions: Array<{
        version: string;
        files: Array<{
          assetType: string;
          source: string;
        }>;
        properties?: Array<{
          key: string;
          value: string;
        }>;
      }>;
      statistics?: Array<{
        statisticName: string;
        value: number;
      }>;
    }>;
    resultMetadata: Array<{
      metadataType: string;
      metadataItems: Array<{
        name: string;
        count: number;
      }>;
    }>;
  }>;
}
