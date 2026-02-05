export type { BlendMethod } from './definitions';
export {
  ALL_BLEND_METHODS,
  BLEND_METHOD_DEFINITIONS,
  BLEND_METHOD_LABELS,
  DEFAULT_BLEND_METHOD,
  isValidBlendMethod,
} from './definitions';
export type { BlendFunction, HueBlendDirection } from './types';
export {
  blendDirectedOklch,
  blendHueOnlyOklch,
  blendHueOnlyOklchDirected,
  blendWithThemeOklch,
  blendWithThemeOklchDirected,
  createHueShiftBlend,
  effectiveHueDirection,
  getHueBlendDirection,
  getMajorityHueDirection,
} from './hueShift';
export { overlayBlend } from './overlay';

import type { BlendMethod } from './definitions';
import type { BlendFunction, HueBlendDirection } from './types';
import { createHueShiftBlend } from './hueShift';
import { overlayBlend } from './overlay';

/**
 * Returns the appropriate {@link BlendFunction} for the given
 * blend method.
 *
 * For hueShift mode, the returned function closes over the
 * pre-calculated majority hue direction so all keys blend
 * consistently. For overlay mode, the returned function is
 * stateless.
 *
 * @param method - The blend method to use
 * @param majorityDir - Pre-calculated majority hue direction
 *   (only used by hueShift)
 * @returns A {@link BlendFunction} for the specified method
 */
export function getBlendFunction(
  method: BlendMethod,
  majorityDir?: HueBlendDirection
): BlendFunction {
  switch (method) {
    case 'hueShift':
      return createHueShiftBlend(majorityDir);
    case 'overlay':
    default:
      return overlayBlend;
  }
}
