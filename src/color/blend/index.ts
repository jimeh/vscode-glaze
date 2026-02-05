export type { BlendMethod } from './definitions';
export {
  ALL_BLEND_METHODS,
  BLEND_METHOD_DEFINITIONS,
  BLEND_METHOD_LABELS,
  DEFAULT_BLEND_METHOD,
  isValidBlendMethod,
} from './definitions';
export type {
  BlendFunction,
  HueBlendDirection,
  HueShiftContext,
} from './types';
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
import type { BlendFunction, HueShiftContext } from './types';
import { createHueShiftBlend } from './hueShift';
import { overlayBlend } from './overlay';

/**
 * Returns the appropriate {@link BlendFunction} for the given
 * blend method.
 *
 * For hueShift mode, the returned function lazily computes the
 * majority hue direction from the context so all keys blend
 * consistently. For overlay mode, the returned function is
 * stateless (context is ignored).
 *
 * @param method - The blend method to use
 * @param context - Context for hue shift blending (ignored for
 *   overlay mode)
 * @returns A {@link BlendFunction} for the specified method
 */
export function getBlendFunction(
  method: BlendMethod,
  context?: HueShiftContext
): BlendFunction {
  switch (method) {
    case 'hueShift':
      return createHueShiftBlend(context);
    case 'overlay':
    default:
      return overlayBlend;
  }
}
