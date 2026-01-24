import type { HSL } from './types';
import type { ColorScheme, TintTarget } from '../config';
import type { ThemeContext } from '../theme';
import { getColorForKey } from '../theme/colors';
import { hashString } from './hash';
import { hslToHex } from './convert';
import { blendWithTheme } from './blend';
import { getSchemeConfig } from './schemes';

/**
 * Full color palette for all VSCode UI elements.
 */
export interface PatinaColorPalette {
  'titleBar.activeBackground': string;
  'titleBar.activeForeground': string;
  'titleBar.inactiveBackground': string;
  'titleBar.inactiveForeground': string;
  'statusBar.background': string;
  'statusBar.foreground': string;
  'activityBar.background': string;
  'activityBar.foreground': string;
}

/**
 * Partial palette containing only the requested tint targets.
 */
export type PartialPatinaColorPalette = Partial<PatinaColorPalette>;

/**
 * Maps tint targets to their corresponding palette keys.
 */
const TARGET_KEYS: Record<TintTarget, (keyof PatinaColorPalette)[]> = {
  titleBar: [
    'titleBar.activeBackground',
    'titleBar.activeForeground',
    'titleBar.inactiveBackground',
    'titleBar.inactiveForeground',
  ],
  statusBar: ['statusBar.background', 'statusBar.foreground'],
  activityBar: ['activityBar.background', 'activityBar.foreground'],
};

/**
 * All keys that Patina manages in workbench.colorCustomizations.
 * Used to preserve user customizations when applying/removing tints.
 */
export const PATINA_MANAGED_KEYS: readonly (keyof PatinaColorPalette)[] =
  Object.values(TARGET_KEYS).flat();

/**
 * Keys that represent background colors and should be blended with theme.
 * Note: VSCode uses inconsistent casing (titleBar.activeBackground vs
 * statusBar.background), so we explicitly list all background keys.
 */
const BACKGROUND_KEYS: ReadonlySet<keyof PatinaColorPalette> = new Set([
  'titleBar.activeBackground',
  'titleBar.inactiveBackground',
  'statusBar.background',
  'activityBar.background',
]);

/**
 * Options for palette generation.
 */
export interface GeneratePaletteOptions {
  /** A string identifying the workspace (typically the folder name) */
  workspaceIdentifier: string;
  /** Which UI element groups to include in the palette */
  targets: TintTarget[];
  /** Theme context with type and optional colors */
  themeContext: ThemeContext;
  /** Color scheme to use for palette generation, default 'pastel' */
  colorScheme?: ColorScheme;
  /** How much to blend toward theme background (0-1), default 0.35 */
  themeBlendFactor?: number;
}

/**
 * Generates a harmonious color palette from a workspace identifier.
 * All colors share the same hue (derived from the identifier) but vary in
 * saturation and lightness to create visual hierarchy.
 *
 * When theme colors are available, colors are blended toward them for better
 * visual integration with the active theme.
 *
 * @param options - Palette generation options
 * @returns A palette of hex color strings for the specified UI elements
 */
export function generatePalette(
  options: GeneratePaletteOptions
): PartialPatinaColorPalette {
  const {
    workspaceIdentifier,
    targets,
    themeContext,
    colorScheme = 'pastel',
    themeBlendFactor = 0.35,
  } = options;

  const hash = hashString(workspaceIdentifier);
  const baseHue = hash % 360;

  const keysToInclude = new Set<keyof PatinaColorPalette>();
  for (const target of targets) {
    for (const key of TARGET_KEYS[target]) {
      keysToInclude.add(key);
    }
  }

  const schemeConfig = getSchemeConfig(colorScheme);
  const themeConfig = schemeConfig[themeContext.type];
  const palette: PartialPatinaColorPalette = {};

  for (const key of keysToInclude) {
    const config = themeConfig[key];
    let hsl: HSL = {
      h: baseHue,
      s: config.saturation,
      l: config.lightness,
    };

    // Only blend background colors, not foreground colors
    if (BACKGROUND_KEYS.has(key) && themeContext.colors) {
      const bgColor = getColorForKey(key, themeContext.colors);
      hsl = blendWithTheme(hsl, bgColor, themeBlendFactor);
    }

    palette[key] = hslToHex(hsl);
  }

  return palette;
}
