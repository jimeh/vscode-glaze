import { hexToLinearRgb, linearRgbToHex } from '../convert';
import type { BlendFunction } from './types';

/**
 * Alpha compositing blend function in linear sRGB space.
 *
 * Blends the tint color over the theme color using standard
 * alpha compositing. The blend factor controls tint transparency:
 * at 0 the result is the full tint, at 1 the result is the full
 * theme color.
 *
 * Operates in linear sRGB to produce physically correct blending.
 * The `hueOnly` flag is ignored — overlay mode always composites
 * the full color.
 */
export const overlayBlend: BlendFunction = (
  _tintOklch,
  tintHex,
  themeHex,
  factor,
  _hueOnly
) => {
  let tintRgb;
  let themeRgb;
  try {
    tintRgb = hexToLinearRgb(tintHex);
    themeRgb = hexToLinearRgb(themeHex);
  } catch {
    // Invalid hex — skip blending, return tint unchanged.
    return tintHex;
  }

  const f = Math.max(0, Math.min(1, factor));
  const inv = 1 - f;

  return linearRgbToHex({
    r: tintRgb.r * inv + themeRgb.r * f,
    g: tintRgb.g * inv + themeRgb.g * f,
    b: tintRgb.b * inv + themeRgb.b * f,
  });
};
