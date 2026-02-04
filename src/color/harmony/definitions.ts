/**
 * Central source of truth for color harmony definitions.
 * All color harmony metadata (labels, descriptions, order) lives here.
 */

/**
 * Definition for a single color harmony.
 */
export interface ColorHarmonyDefinition {
  readonly label: string;
  readonly description: string;
  readonly order: number;
}

/**
 * All color harmony definitions with their metadata.
 * Order determines display sequence in UI (lower = first).
 */
export const COLOR_HARMONY_DEFINITIONS = {
  uniform: {
    label: 'Uniform',
    description: 'Single hue across all elements',
    order: 0,
  },
  duotone: {
    label: 'Duotone',
    description: 'Complementary accent on activity and side bar',
    order: 1,
  },
  undercurrent: {
    label: 'Undercurrent',
    description: 'Complementary accent on status bar',
    order: 2,
  },
  analogous: {
    label: 'Analogous',
    description: 'Three adjacent hues spread across elements',
    order: 3,
  },
  triadic: {
    label: 'Triadic',
    description: 'Three evenly-spaced hues for maximum variation',
    order: 4,
  },
} as const satisfies Record<string, ColorHarmonyDefinition>;

/**
 * Available color harmonies.
 */
export type ColorHarmony = keyof typeof COLOR_HARMONY_DEFINITIONS;

/**
 * Default color harmony.
 */
export const DEFAULT_COLOR_HARMONY: ColorHarmony = 'uniform';

/**
 * All color harmonies sorted by display order.
 */
export const ALL_COLOR_HARMONIES: readonly ColorHarmony[] = (
  Object.keys(COLOR_HARMONY_DEFINITIONS) as ColorHarmony[]
).sort(
  (a, b) =>
    COLOR_HARMONY_DEFINITIONS[a].order - COLOR_HARMONY_DEFINITIONS[b].order
);

/**
 * Display labels for each color harmony.
 */
export const COLOR_HARMONY_LABELS: Readonly<Record<ColorHarmony, string>> =
  Object.fromEntries(
    ALL_COLOR_HARMONIES.map((harmony) => [
      harmony,
      COLOR_HARMONY_DEFINITIONS[harmony].label,
    ])
  ) as Record<ColorHarmony, string>;

/**
 * Type guard for validating color harmony strings.
 */
export function isValidColorHarmony(value: string): value is ColorHarmony {
  return value in COLOR_HARMONY_DEFINITIONS;
}
