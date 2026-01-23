/**
 * Types for theme extraction script.
 */

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
  name: string;
  colors: ThemeColors;
  type: ThemeType;
  extensionId: string;
  extensionName: string;
  installCount: number;
}

/**
 * VS Code extension metadata from marketplace.
 */
export interface MarketplaceExtension {
  extensionId: string;
  extensionName: string;
  displayName: string;
  publisherName: string;
  installCount: number;
  vsixUrl?: string;
  themes: ThemeContribution[];
}

/**
 * Theme contribution from package.json.
 */
export interface ThemeContribution {
  label: string;
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
  tokenColors?: unknown[];
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
