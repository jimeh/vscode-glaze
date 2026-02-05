/**
 * Central source of truth for blend method definitions.
 * All blend method metadata (labels, descriptions, order) lives here.
 */

/**
 * Definition for a single blend method.
 */
export interface BlendMethodDefinition {
  readonly label: string;
  readonly description: string;
  readonly order: number;
}

/**
 * All blend method definitions with their metadata.
 * Order determines display sequence in UI (lower = first).
 */
export const BLEND_METHOD_DEFINITIONS = {
  overlay: {
    label: 'Overlay',
    description:
      'Alpha compositing in linear sRGB for colors closer to the theme',
    order: 0,
  },
  hueShift: {
    label: 'Hue Shift',
    description:
      'OKLCH interpolation with directed hue for perceptually uniform blending',
    order: 1,
  },
} as const satisfies Record<string, BlendMethodDefinition>;

/**
 * Available blend methods.
 */
export type BlendMethod = keyof typeof BLEND_METHOD_DEFINITIONS;

/**
 * Default blend method.
 */
export const DEFAULT_BLEND_METHOD: BlendMethod = 'overlay';

/**
 * All blend methods sorted by display order.
 */
export const ALL_BLEND_METHODS: readonly BlendMethod[] = (
  Object.keys(BLEND_METHOD_DEFINITIONS) as BlendMethod[]
).sort(
  (a, b) =>
    BLEND_METHOD_DEFINITIONS[a].order - BLEND_METHOD_DEFINITIONS[b].order
);

/**
 * Display labels for each blend method.
 */
export const BLEND_METHOD_LABELS: Readonly<Record<BlendMethod, string>> =
  Object.fromEntries(
    ALL_BLEND_METHODS.map((m) => [m, BLEND_METHOD_DEFINITIONS[m].label])
  ) as Record<BlendMethod, string>;

/**
 * Type guard for validating blend method strings.
 */
export function isValidBlendMethod(value: string): value is BlendMethod {
  return value in BLEND_METHOD_DEFINITIONS;
}
