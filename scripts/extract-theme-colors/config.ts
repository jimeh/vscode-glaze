/**
 * Configuration constants for theme extraction script.
 */
export const CONFIG = {
  /** Maximum number of extensions to process */
  maxExtensions: 500,
  /** Page size for marketplace API queries */
  pageSize: 50,
  /** Cache TTL in milliseconds (7 days) */
  cacheTtl: 7 * 24 * 60 * 60 * 1000,
  /** Request timeout in milliseconds */
  requestTimeout: 30000,
  /** Maximum concurrent requests */
  concurrency: 5,
  /** Output file path */
  outputPath: 'src/theme/backgrounds.generated.ts',
  /** Cache directory */
  cacheDir: 'scripts/extract-theme-colors/.cache',
  /** Retry configuration */
  retry: {
    attempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
  },
};
