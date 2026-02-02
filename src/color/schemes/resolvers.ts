import type { SchemeConfig, SchemeResolver } from './types';
import { maxChroma } from '../convert';
import { applyHueOffset } from '../hue';

/**
 * Wraps a static SchemeConfig as a SchemeResolver.
 *
 * Performs the standard OKLCH computation: applies hueOffset to the
 * base hue, computes max in-gamut chroma, and scales by chromaFactor.
 * Blending uses the standard full-component mode.
 *
 * @param config - Static scheme configuration
 * @returns SchemeResolver that computes tint colors from static config
 */
export function staticResolver(config: SchemeConfig): SchemeResolver {
  return (themeType, key, context) => {
    const elementConfig = config[themeType][key];
    const elementHue = applyHueOffset(context.baseHue, elementConfig.hueOffset);
    const maxC = maxChroma(elementConfig.lightness, elementHue);
    const chroma = maxC * elementConfig.chromaFactor;

    return {
      tintOklch: {
        l: elementConfig.lightness,
        c: chroma,
        h: elementHue,
      },
      hueOnlyBlend: false,
    };
  };
}
