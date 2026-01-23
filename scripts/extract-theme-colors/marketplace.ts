/**
 * VS Code Marketplace API client.
 */
import { CONFIG } from './config';
import { getCached, setCache } from './cache';
import type {
  MarketplaceExtension,
  MarketplaceQueryResponse,
  ThemeContribution,
} from './types';

const MARKETPLACE_API =
  'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';

const VSIX_ASSET_TYPE = 'Microsoft.VisualStudio.Services.VSIXPackage';

/**
 * Fetches with retry and exponential backoff.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error | undefined;
  let delay = CONFIG.retry.initialDelayMs;

  for (let attempt = 0; attempt < CONFIG.retry.attempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        CONFIG.requestTimeout
      );

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429) {
        // Rate limited - check Retry-After header
        const retryAfter = response.headers.get('Retry-After');
        const retryDelay = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : delay * 2;
        console.warn(
          `Rate limited, waiting ${retryDelay / 1000}s before retry...`
        );
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < CONFIG.retry.attempts - 1) {
        console.warn(
          `Request failed (attempt ${attempt + 1}/${CONFIG.retry.attempts}): ` +
            `${lastError.message}. Retrying in ${delay / 1000}s...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, CONFIG.retry.maxDelayMs);
      }
    }
  }

  throw lastError;
}

/**
 * Queries the VS Code Marketplace for theme extensions.
 */
async function queryMarketplace(
  pageNumber: number
): Promise<MarketplaceQueryResponse> {
  const cacheKey = `marketplace-themes-page-${pageNumber}`;

  const cached = getCached<MarketplaceQueryResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const body = {
    filters: [
      {
        criteria: [
          { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
          { filterType: 5, value: 'Themes' }, // Category name filter
        ],
        pageNumber,
        pageSize: CONFIG.pageSize,
        sortBy: 4, // Install count
        sortOrder: 2, // Descending
      },
    ],
    assetTypes: [],
    flags:
      0x1 | // IncludeVersions
      0x2 | // IncludeFiles
      0x4 | // IncludeCategories
      0x10 | // IncludeVersionProperties
      0x100, // IncludeStatistics
  };

  const response = await fetchWithRetry(MARKETPLACE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json;api-version=6.1-preview.1',
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as MarketplaceQueryResponse;
  setCache(cacheKey, data);
  return data;
}

/**
 * Extracts VSIX download URL from extension version files.
 */
function extractVsixUrl(
  files?: Array<{ assetType: string; source: string }>
): string | undefined {
  if (!files) return undefined;
  const vsixFile = files.find((f) => f.assetType === VSIX_ASSET_TYPE);
  return vsixFile?.source;
}

/**
 * Extracts install count from statistics.
 */
function extractInstallCount(
  statistics?: Array<{ statisticName: string; value: number }>
): number {
  if (!statistics) return 0;
  const stat = statistics.find((s) => s.statisticName === 'install');
  return stat?.value ?? 0;
}

/**
 * Fetches theme extensions from the marketplace.
 */
export async function fetchThemeExtensions(): Promise<MarketplaceExtension[]> {
  const extensions: MarketplaceExtension[] = [];
  const maxPages = Math.ceil(CONFIG.maxExtensions / CONFIG.pageSize);

  console.log(`Fetching up to ${CONFIG.maxExtensions} theme extensions...`);

  for (let page = 1; page <= maxPages; page++) {
    console.log(`Fetching page ${page}/${maxPages}...`);
    const response = await queryMarketplace(page);

    if (!response.results?.[0]?.extensions?.length) {
      console.log(`No more extensions found at page ${page}`);
      break;
    }

    for (const ext of response.results[0].extensions) {
      const latestVersion = ext.versions?.[0];
      if (!latestVersion) continue;

      const vsixUrl = extractVsixUrl(latestVersion.files);
      const installCount = extractInstallCount(ext.statistics);

      extensions.push({
        extensionId: ext.extensionId,
        extensionName: ext.extensionName,
        displayName: ext.displayName,
        publisherName: ext.publisher.publisherName,
        version: latestVersion.version,
        installCount,
        vsixUrl,
        themes: [],
      });

      if (extensions.length >= CONFIG.maxExtensions) {
        break;
      }
    }

    if (extensions.length >= CONFIG.maxExtensions) {
      break;
    }

    // Small delay between pages to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`Found ${extensions.length} theme extensions`);
  return extensions;
}

/**
 * Parses theme contributions from package.json content.
 */
export function parseThemeContributions(
  packageJson: Record<string, unknown>
): ThemeContribution[] {
  const contributes = packageJson.contributes as
    | Record<string, unknown>
    | undefined;
  if (!contributes) return [];

  const themes = contributes.themes as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(themes)) return [];

  return themes
    .filter(
      (t) =>
        typeof t.label === 'string' &&
        typeof t.path === 'string' &&
        typeof t.uiTheme === 'string'
    )
    .map((t) => ({
      label: t.label as string,
      id: typeof t.id === 'string' ? t.id : undefined,
      uiTheme: t.uiTheme as string,
      path: t.path as string,
    }));
}

/**
 * Fetches a single extension by its ID from the marketplace.
 * @param extensionId - Full extension ID (e.g., "dracula-theme.theme-dracula")
 * @returns The extension info or undefined if not found
 */
export async function fetchExtensionById(
  extensionId: string
): Promise<MarketplaceExtension | undefined> {
  const cacheKey = `extension-${extensionId}`;

  const cached = getCached<MarketplaceExtension>(cacheKey);
  if (cached) {
    return cached;
  }

  const body = {
    filters: [
      {
        criteria: [
          { filterType: 8, value: 'Microsoft.VisualStudio.Code' },
          { filterType: 4, value: extensionId }, // Extension name filter
        ],
        pageNumber: 1,
        pageSize: 1,
        sortBy: 0,
        sortOrder: 0,
      },
    ],
    assetTypes: [],
    flags:
      0x1 | // IncludeVersions
      0x2 | // IncludeFiles
      0x4 | // IncludeCategories
      0x10 | // IncludeVersionProperties
      0x100, // IncludeStatistics
  };

  try {
    const response = await fetchWithRetry(MARKETPLACE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json;api-version=6.1-preview.1',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as MarketplaceQueryResponse;
    const ext = data.results?.[0]?.extensions?.[0];

    if (!ext) {
      return undefined;
    }

    const latestVersion = ext.versions?.[0];
    if (!latestVersion) {
      return undefined;
    }

    const vsixUrl = extractVsixUrl(latestVersion.files);
    const installCount = extractInstallCount(ext.statistics);

    const extension: MarketplaceExtension = {
      extensionId: ext.extensionId,
      extensionName: ext.extensionName,
      displayName: ext.displayName,
      publisherName: ext.publisher.publisherName,
      version: latestVersion.version,
      installCount,
      vsixUrl,
      themes: [],
    };

    setCache(cacheKey, extension);
    return extension;
  } catch (error) {
    console.warn(`Failed to fetch extension ${extensionId}: ${error}`);
    return undefined;
  }
}
