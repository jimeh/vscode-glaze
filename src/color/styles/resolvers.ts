import type { StyleConfig, StyleResolver } from './types';
import { maxChroma } from '../convert';

/**
 * Wraps a static StyleConfig as a StyleResolver.
 *
 * Performs the standard OKLCH computation: computes max in-gamut
 * chroma for the given hue and lightness, and scales by
 * chromaFactor. Blending uses the standard full-component mode.
 *
 * @param config - Static style configuration
 * @returns StyleResolver that computes tint colors from static config
 */
export function staticResolver(config: StyleConfig): StyleResolver {
  return (themeType, key, context) => {
    const elementConfig = config[themeType][key];
    const elementHue = context.elementHue;
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
