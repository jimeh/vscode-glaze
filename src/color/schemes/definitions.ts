/**
 * Central source of truth for color scheme definitions.
 * All color scheme metadata (labels, descriptions, order) lives here.
 */

/**
 * Definition for a single color scheme.
 */
export interface ColorSchemeDefinition {
  readonly label: string;
  readonly description: string;
  readonly order: number;
}

/**
 * All color scheme definitions with their metadata.
 * Order determines display sequence in UI (lower = first).
 */
export const COLOR_SCHEME_DEFINITIONS = {
  neon: {
    label: 'Neon',
    description: 'Maximum chroma with elevated lightness for vivid glow',
    order: 0,
  },
  vibrant: {
    label: 'Vibrant',
    description: 'Higher saturation for bolder, more noticeable colors',
    order: 1,
  },
  pastel: {
    label: 'Pastel',
    description: 'Soft, muted tones that blend gently with any theme',
    order: 2,
  },
  muted: {
    label: 'Muted',
    description: 'Desaturated, subtle tones for minimal visual impact',
    order: 3,
  },
  tinted: {
    label: 'Tinted',
    description: 'Very subtle color hints while retaining hue variation',
    order: 4,
  },
  duotone: {
    label: 'Duotone',
    description: 'Base hue + complementary hue split across UI elements',
    order: 5,
  },
  analogous: {
    label: 'Analogous',
    description: 'Three adjacent hues for harmonious color transitions',
    order: 6,
  },
} as const satisfies Record<string, ColorSchemeDefinition>;

/**
 * Available color schemes for tinting.
 */
export type ColorScheme = keyof typeof COLOR_SCHEME_DEFINITIONS;

/**
 * Default color scheme.
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'pastel';

/**
 * All color schemes sorted by display order.
 */
export const ALL_COLOR_SCHEMES: readonly ColorScheme[] = (
  Object.keys(COLOR_SCHEME_DEFINITIONS) as ColorScheme[]
).sort(
  (a, b) =>
    COLOR_SCHEME_DEFINITIONS[a].order - COLOR_SCHEME_DEFINITIONS[b].order
);

/**
 * Display labels for each color scheme.
 */
export const COLOR_SCHEME_LABELS: Readonly<Record<ColorScheme, string>> =
  Object.fromEntries(
    ALL_COLOR_SCHEMES.map((scheme) => [
      scheme,
      COLOR_SCHEME_DEFINITIONS[scheme].label,
    ])
  ) as Record<ColorScheme, string>;

/**
 * Type guard for validating color scheme strings.
 */
export function isValidColorScheme(value: string): value is ColorScheme {
  return value in COLOR_SCHEME_DEFINITIONS;
}
