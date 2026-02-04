/**
 * Central source of truth for color style definitions.
 * All color style metadata (labels, descriptions, order) lives here.
 */

/**
 * Definition for a single color style.
 */
export interface ColorStyleDefinition {
  readonly label: string;
  readonly description: string;
  readonly order: number;
}

/**
 * All color style definitions with their metadata.
 * Order determines display sequence in UI (lower = first).
 */
export const COLOR_STYLE_DEFINITIONS = {
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
  adaptive: {
    label: 'Adaptive',
    description: "Preserves theme's lightness/chroma, shifts only the hue",
    order: 5,
  },
} as const satisfies Record<string, ColorStyleDefinition>;

/**
 * Available color styles for tinting.
 */
export type ColorStyle = keyof typeof COLOR_STYLE_DEFINITIONS;

/**
 * Default color style.
 */
export const DEFAULT_COLOR_STYLE: ColorStyle = 'pastel';

/**
 * All color styles sorted by display order.
 */
export const ALL_COLOR_STYLES: readonly ColorStyle[] = (
  Object.keys(COLOR_STYLE_DEFINITIONS) as ColorStyle[]
).sort(
  (a, b) => COLOR_STYLE_DEFINITIONS[a].order - COLOR_STYLE_DEFINITIONS[b].order
);

/**
 * Display labels for each color style.
 */
export const COLOR_STYLE_LABELS: Readonly<Record<ColorStyle, string>> =
  Object.fromEntries(
    ALL_COLOR_STYLES.map((s) => [s, COLOR_STYLE_DEFINITIONS[s].label])
  ) as Record<ColorStyle, string>;

/**
 * Type guard for validating color style strings.
 */
export function isValidColorStyle(value: string): value is ColorStyle {
  return value in COLOR_STYLE_DEFINITIONS;
}
