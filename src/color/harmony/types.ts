import type { ElementType } from '../../theme';

/**
 * Per-element hue offset configuration for a color harmony.
 *
 * Maps each tintable UI element to a hue offset in degrees.
 * Offsets are added to the workspace's base hue when computing
 * per-element colors. Elements not listed default to 0°.
 */
export type HarmonyConfig = Readonly<Record<ElementType, number>>;
