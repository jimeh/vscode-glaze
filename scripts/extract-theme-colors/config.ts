/**
 * Configuration constants for theme extraction script.
 */
export const CONFIG = {
  /** VS Code Marketplace API URL */
  marketplaceApiUrl:
    'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery',
  /** OpenVSX Registry API URL (VS Code-compatible gallery endpoint) */
  openvsxApiUrl: 'https://open-vsx.org/vscode/gallery/extensionquery',
  /** Maximum number of extensions to process per registry */
  maxExtensions: 250,
  /** Page size for marketplace API queries */
  pageSize: 50,
  /** Cache TTL in milliseconds (7 days) */
  cacheTtl: 7 * 24 * 60 * 60 * 1000,
  /** Request timeout in milliseconds */
  requestTimeout: 30000,
  /** Maximum concurrent requests */
  concurrency: 5,
  /** Output directory for generated files */
  outputDir: 'src/theme/generated',
  /** Path to built-in theme colors file */
  builtinColorsPath: 'src/theme/generated/builtins.ts',
  /** Path to extension theme colors file */
  extensionColorsPath: 'src/theme/generated/extensions.ts',
  /** Path to VS Code built-ins metadata file */
  builtinsMetadataPath: 'src/theme/generated/builtins.json',
  /** Directory for per-extension metadata files */
  extensionsMetadataDir: 'src/theme/generated/extensions',
  /** Path to pinned extensions config */
  pinnedExtensionsPath: 'scripts/extract-theme-colors/pinned-extensions.json',
  /** Cache directory */
  cacheDir: 'scripts/extract-theme-colors/.cache',
  /** Retry configuration */
  retry: {
    attempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
};
