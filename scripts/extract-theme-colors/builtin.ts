/**
 * Built-in theme extraction from VS Code source.
 */
import AdmZip from 'adm-zip';
import { parse as parseJsonc } from 'jsonc-parser';
import { parseThemeContributions } from './marketplace';
import { resolveNlsPlaceholders } from './nls';
import { parseTheme, validateTheme, type ThemeFileReader } from './parser';
import { isTmThemeContent, isTmThemePath, parseTmTheme } from './tmtheme';
import type { ExtractedTheme, ThemeJson } from './types';

/**
 * Information about a theme extension found in the source.
 */
interface ThemeExtensionInfo {
  /** Path within the zip (e.g., "vscode-1.96.0/extensions/theme-monokai") */
  basePath: string;
  /** package.json content */
  packageJson: Record<string, unknown>;
}

/**
 * Finds theme extensions in the VS Code source zip.
 * Scans for extensions/theme-{asterisk}/package.json files.
 */
function findThemeExtensions(zip: AdmZip): ThemeExtensionInfo[] {
  const extensions: ThemeExtensionInfo[] = [];
  const entries = zip.getEntries();

  // Pattern: */extensions/theme-*/package.json
  const packageJsonPattern = /^[^/]+\/extensions\/theme-[^/]+\/package\.json$/;

  for (const entry of entries) {
    if (packageJsonPattern.test(entry.entryName)) {
      try {
        const content = zip.readAsText(entry);
        let packageJson = JSON.parse(content) as Record<string, unknown>;

        // Extract base path (without package.json)
        const basePath = entry.entryName.replace(/\/package\.json$/, '');

        // Resolve NLS placeholders if package.nls.json exists
        const nlsEntry = zip.getEntry(`${basePath}/package.nls.json`);
        if (nlsEntry) {
          try {
            const nlsContent = zip.readAsText(nlsEntry);
            const nlsData = JSON.parse(nlsContent) as Record<string, string>;
            packageJson = resolveNlsPlaceholders(packageJson, nlsData);
          } catch {
            // Ignore invalid NLS files
          }
        }

        extensions.push({ basePath, packageJson });
      } catch {
        // Skip invalid package.json files
      }
    }
  }

  return extensions;
}

/**
 * Creates a theme file reader for a VS Code source zip.
 * Adapts the VSIX reader pattern for source directory structure.
 */
function createSourceZipThemeReader(
  zip: AdmZip,
  basePath: string
): ThemeFileReader {
  return (themePath: string): ThemeJson | undefined => {
    try {
      // Normalize path: remove leading ./
      const normalizedPath = themePath.replace(/^\.\//, '');
      const fullPath = `${basePath}/${normalizedPath}`;

      const entry = zip.getEntry(fullPath);
      if (!entry) return undefined;

      const content = zip.readAsText(entry);

      // Detect TextMate themes by path or content
      if (isTmThemePath(themePath) || isTmThemeContent(content)) {
        return parseTmTheme(content);
      }

      return parseJsonc(content) as ThemeJson;
    } catch {
      return undefined;
    }
  };
}

/**
 * Extracts built-in themes from VS Code source zip.
 * @param zipBuffer - Buffer containing the VS Code source zip
 * @returns Array of extracted themes
 */
export function extractBuiltinThemes(zipBuffer: Buffer): ExtractedTheme[] {
  const zip = new AdmZip(zipBuffer);
  const themes: ExtractedTheme[] = [];

  // Find all theme extensions
  const extensions = findThemeExtensions(zip);
  console.log(`Found ${extensions.length} built-in theme extensions`);

  for (const ext of extensions) {
    const contributions = parseThemeContributions(ext.packageJson);
    if (contributions.length === 0) continue;

    // Create theme reader for this extension
    const readThemeFile = createSourceZipThemeReader(zip, ext.basePath);

    // Extract extension name from path (e.g., "theme-monokai")
    const extName = ext.basePath.split('/').pop() ?? 'unknown';

    for (const contribution of contributions) {
      try {
        const themeJson = readThemeFile(contribution.path);
        if (!themeJson) continue;

        const extracted = parseTheme(
          themeJson,
          contribution,
          readThemeFile,
          `vscode.${extName}`,
          'vscode',
          extName,
          0 // Built-in themes have no install count
        );

        if (extracted && validateTheme(extracted)) {
          themes.push(extracted);
        }
      } catch {
        // Skip themes that fail to parse
      }
    }
  }

  return themes;
}
