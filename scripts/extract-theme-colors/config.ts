/**
 * Configuration constants for theme extraction script.
 */
export const CONFIG = {
  /** Maximum number of extensions to process */
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
  /** Directory for per-extension theme files */
  extensionsDir: 'src/theme/generated/extensions',
  /** Path to the consolidated colors file */
  colorsPath: 'src/theme/generated/colors.ts',
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
