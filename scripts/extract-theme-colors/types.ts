/**
 * Types for theme extraction script.
 */

/**
 * Theme kind (dark or light).
 */
export type ThemeKind = 'dark' | 'light';

/**
 * Background colors for different UI elements.
 */
export interface ElementBackgrounds {
  editor: string;
  titleBar?: string;
  statusBar?: string;
  activityBar?: string;
}

/**
 * Extracted theme information.
 */
export interface ExtractedTheme {
  name: string;
  backgrounds: ElementBackgrounds;
  kind: ThemeKind;
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
