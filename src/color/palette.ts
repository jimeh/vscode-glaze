import type { HSL } from './types';
import type { TintTarget } from '../config';
import type { ThemeContext, ThemeKind } from '../theme';
import { getBackgroundForKey } from '../theme/backgrounds';
import { hashString } from './hash';
import { hslToHex } from './convert';
import { blendWithTheme } from './blend';

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
 * Configuration for saturation and lightness values.
 */
type ElementConfig = { saturation: number; lightness: number };

/**
 * Configuration for each UI element's color generation per theme kind.
 * All elements share the same hue but vary in saturation/lightness for visual
 * hierarchy.
 *
 * Foreground colors use the same hue but with appropriate lightness and low
 * saturation to ensure readability while maintaining color harmony.
 */
const THEME_CONFIGS: Record<
  ThemeKind,
  Record<keyof PatinaColorPalette, ElementConfig>
> = {
  dark: {
    'titleBar.activeBackground': { saturation: 0.4, lightness: 0.32 },
    'titleBar.activeForeground': { saturation: 0.15, lightness: 0.9 },
    'titleBar.inactiveBackground': { saturation: 0.3, lightness: 0.28 },
    'titleBar.inactiveForeground': { saturation: 0.1, lightness: 0.7 },
    'statusBar.background': { saturation: 0.5, lightness: 0.35 },
    'statusBar.foreground': { saturation: 0.15, lightness: 0.9 },
    'activityBar.background': { saturation: 0.35, lightness: 0.25 },
    'activityBar.foreground': { saturation: 0.15, lightness: 0.85 },
  },
  light: {
    'titleBar.activeBackground': { saturation: 0.45, lightness: 0.82 },
    'titleBar.activeForeground': { saturation: 0.25, lightness: 0.05 },
    'titleBar.inactiveBackground': { saturation: 0.35, lightness: 0.86 },
    'titleBar.inactiveForeground': { saturation: 0.15, lightness: 0.2 },
    'statusBar.background': { saturation: 0.5, lightness: 0.78 },
    'statusBar.foreground': { saturation: 0.25, lightness: 0.05 },
    'activityBar.background': { saturation: 0.4, lightness: 0.88 },
    'activityBar.foreground': { saturation: 0.2, lightness: 0.06 },
  },
  highContrast: {
    'titleBar.activeBackground': { saturation: 0.5, lightness: 0.15 },
    'titleBar.activeForeground': { saturation: 0.1, lightness: 0.98 },
    'titleBar.inactiveBackground': { saturation: 0.4, lightness: 0.12 },
    'titleBar.inactiveForeground': { saturation: 0.08, lightness: 0.85 },
    'statusBar.background': { saturation: 0.55, lightness: 0.18 },
    'statusBar.foreground': { saturation: 0.1, lightness: 0.98 },
    'activityBar.background': { saturation: 0.45, lightness: 0.1 },
    'activityBar.foreground': { saturation: 0.1, lightness: 0.95 },
  },
  highContrastLight: {
    'titleBar.activeBackground': { saturation: 0.5, lightness: 0.92 },
    'titleBar.activeForeground': { saturation: 0.3, lightness: 0.05 },
    'titleBar.inactiveBackground': { saturation: 0.4, lightness: 0.94 },
    'titleBar.inactiveForeground': { saturation: 0.2, lightness: 0.2 },
    'statusBar.background': { saturation: 0.55, lightness: 0.9 },
    'statusBar.foreground': { saturation: 0.3, lightness: 0.05 },
    'activityBar.background': { saturation: 0.45, lightness: 0.95 },
    'activityBar.foreground': { saturation: 0.25, lightness: 0.08 },
  },
};

/**
 * Options for palette generation.
 */
export interface GeneratePaletteOptions {
  /** A string identifying the workspace (typically the folder name) */
  workspaceIdentifier: string;
  /** Which UI element groups to include in the palette */
  targets: TintTarget[];
  /** Theme context with kind and optional background color */
  themeContext: ThemeContext;
  /** How much to blend toward theme background (0-1), default 0.35 */
  themeBlendFactor?: number;
}

/**
 * Generates a harmonious pastel color palette from a workspace identifier.
 * All colors share the same hue (derived from the identifier) but vary in
 * saturation and lightness to create visual hierarchy.
 *
 * When a theme background is available, colors are blended toward it for
 * better visual integration with the active theme.
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

  const themeConfig = THEME_CONFIGS[themeContext.kind];
  const palette: PartialPatinaColorPalette = {};

  for (const key of keysToInclude) {
    const config = themeConfig[key];
    let hsl: HSL = {
      h: baseHue,
      s: config.saturation,
      l: config.lightness,
    };

    // Only blend background colors, not foreground colors
    if (BACKGROUND_KEYS.has(key) && themeContext.backgrounds) {
      const bgColor = getBackgroundForKey(key, themeContext.backgrounds);
      hsl = blendWithTheme(hsl, bgColor, themeBlendFactor);
    }

    palette[key] = hslToHex(hsl);
  }

  return palette;
}
