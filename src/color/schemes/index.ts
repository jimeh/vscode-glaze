import type { ColorScheme } from '../../config';
import type { SchemeConfig } from './types';
import { pastelScheme } from './pastel';
import { vibrantScheme } from './vibrant';

export type { SchemeConfig, ElementConfig } from './types';

/**
 * Map of color scheme names to their configurations.
 */
const SCHEME_CONFIGS: Record<ColorScheme, SchemeConfig> = {
  pastel: pastelScheme,
  vibrant: vibrantScheme,
};

/**
 * Returns the configuration for the specified color scheme.
 */
export function getSchemeConfig(scheme: ColorScheme): SchemeConfig {
  return SCHEME_CONFIGS[scheme];
}
