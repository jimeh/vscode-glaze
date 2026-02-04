export type { ColorStyle } from './definitions';
export {
  ALL_COLOR_STYLES,
  COLOR_STYLE_DEFINITIONS,
  COLOR_STYLE_LABELS,
  DEFAULT_COLOR_STYLE,
  isValidColorStyle,
} from './definitions';
export type {
  StyleConfig,
  StyleResolver,
  StyleResolveContext,
  StyleResolveResult,
} from './types';

import type { ColorStyle } from './definitions';
import type { StyleConfig, StyleResolver } from './types';
import { adaptiveResolver } from './adaptive';
import { mutedStyle } from './muted';
import { neonStyle } from './neon';
import { pastelStyle } from './pastel';
import { staticResolver } from './resolvers';
import { tintedStyle } from './tinted';
import { vibrantStyle } from './vibrant';

/**
 * Static style configurations keyed by style name.
 * Excludes dynamic styles (e.g. adaptive) that have no
 * static config.
 */
export const STATIC_STYLE_CONFIGS: Readonly<
  Partial<Record<ColorStyle, StyleConfig>>
> = {
  pastel: pastelStyle,
  vibrant: vibrantStyle,
  muted: mutedStyle,
  tinted: tintedStyle,
  neon: neonStyle,
};

/**
 * Map of color style names to their resolvers.
 */
const STYLE_RESOLVERS: Record<ColorStyle, StyleResolver> = {
  pastel: staticResolver(pastelStyle),
  vibrant: staticResolver(vibrantStyle),
  muted: staticResolver(mutedStyle),
  tinted: staticResolver(tintedStyle),
  neon: staticResolver(neonStyle),
  adaptive: adaptiveResolver,
};

/**
 * Returns the resolver for the specified color style.
 */
export function getStyleResolver(style: ColorStyle): StyleResolver {
  return STYLE_RESOLVERS[style];
}
