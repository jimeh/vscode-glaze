import type { ColorHarmony } from './definitions';
import type { HarmonyConfig } from './types';

/**
 * Harmony configs defining per-element hue offsets.
 *
 * Each harmony maps element types to their hue offset from the
 * workspace's base hue. The "editor" element is always 0° since
 * it is not tinted.
 */
export const HARMONY_CONFIGS: Readonly<Record<ColorHarmony, HarmonyConfig>> = {
  /**
   * Uniform — all elements share the base hue.
   */
  uniform: {
    editor: 0,
    titleBar: 0,
    statusBar: 0,
    activityBar: 0,
    sideBar: 0,
  },

  /**
   * Duotone — complementary accent (180°) on activity/side bar.
   */
  duotone: {
    editor: 0,
    titleBar: 0,
    statusBar: 0,
    activityBar: 180,
    sideBar: 180,
  },

  /**
   * Undercurrent — complementary accent (180°) on status bar.
   */
  undercurrent: {
    editor: 0,
    titleBar: 0,
    statusBar: 180,
    activityBar: 0,
    sideBar: 0,
  },

  /**
   * Analogous — three adjacent hues (-25°, 0°, +25°).
   */
  analogous: {
    editor: 0,
    titleBar: -25,
    statusBar: 25,
    activityBar: 0,
    sideBar: 0,
  },

  /**
   * Triadic — three evenly-spaced hues (120° apart).
   */
  triadic: {
    editor: 0,
    titleBar: -120,
    statusBar: 120,
    activityBar: 0,
    sideBar: 0,
  },
};
