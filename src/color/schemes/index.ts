import type { ColorScheme } from '../../config';
import type { SchemeConfig } from './types';
import { analogousScheme } from './analogous';
import { duotoneScheme } from './duotone';
import { mutedScheme } from './muted';
import { neonScheme } from './neon';
import { pastelScheme } from './pastel';
import { tintedScheme } from './tinted';
import { vibrantScheme } from './vibrant';

export type { SchemeConfig, ElementConfig } from './types';

/**
 * Map of color scheme names to their configurations.
 */
const SCHEME_CONFIGS: Record<ColorScheme, SchemeConfig> = {
  pastel: pastelScheme,
  vibrant: vibrantScheme,
  muted: mutedScheme,
  tinted: tintedScheme,
  duotone: duotoneScheme,
  analogous: analogousScheme,
  neon: neonScheme,
};

/**
 * Returns the configuration for the specified color scheme.
 */
export function getSchemeConfig(scheme: ColorScheme): SchemeConfig {
  return SCHEME_CONFIGS[scheme];
}
