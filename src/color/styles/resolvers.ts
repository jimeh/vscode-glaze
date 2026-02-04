import type { StyleConfig, StyleResolver } from './types';
import { maxChroma } from '../convert';
import { applyHueOffset } from '../hue';

/**
 * Wraps a static StyleConfig as a StyleResolver.
 *
 * Performs the standard OKLCH computation: applies the harmony's
 * hue offset to the base hue, computes max in-gamut chroma, and
 * scales by chromaFactor. Blending uses the standard full-component
 * mode.
 *
 * @param config - Static style configuration
 * @returns StyleResolver that computes tint colors from static config
 */
export function staticResolver(config: StyleConfig): StyleResolver {
  return (themeType, key, context) => {
    const elementConfig = config[themeType][key];
    const elementHue = applyHueOffset(context.baseHue, context.hueOffset);
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
