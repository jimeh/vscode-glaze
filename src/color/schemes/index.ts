export type { ColorScheme } from './definitions';
export {
  ALL_COLOR_SCHEMES,
  COLOR_SCHEME_DEFINITIONS,
  COLOR_SCHEME_LABELS,
  DEFAULT_COLOR_SCHEME,
  isValidColorScheme,
} from './definitions';
export type {
  SchemeConfig,
  SchemeResolver,
  SchemeResolveContext,
  SchemeResolveResult,
} from './types';

import type { ColorScheme } from './definitions';
import type { SchemeConfig, SchemeResolver } from './types';
import { adaptiveResolver } from './adaptive';
import { mutedScheme } from './muted';
import { neonScheme } from './neon';
import { pastelScheme } from './pastel';
import { staticResolver } from './resolvers';
import { tintedScheme } from './tinted';
import { vibrantScheme } from './vibrant';

/**
 * Static scheme configurations keyed by scheme name.
 * Excludes dynamic schemes (e.g. adaptive) that have no
 * static config.
 */
export const STATIC_SCHEME_CONFIGS: Readonly<
  Partial<Record<ColorScheme, SchemeConfig>>
> = {
  pastel: pastelScheme,
  vibrant: vibrantScheme,
  muted: mutedScheme,
  tinted: tintedScheme,
  neon: neonScheme,
};

/**
 * Map of color scheme names to their resolvers.
 */
const SCHEME_RESOLVERS: Record<ColorScheme, SchemeResolver> = {
  pastel: staticResolver(pastelScheme),
  vibrant: staticResolver(vibrantScheme),
  muted: staticResolver(mutedScheme),
  tinted: staticResolver(tintedScheme),
  neon: staticResolver(neonScheme),
  adaptive: adaptiveResolver,
};

/**
 * Returns the resolver for the specified color scheme.
 */
export function getSchemeResolver(scheme: ColorScheme): SchemeResolver {
  return SCHEME_RESOLVERS[scheme];
}
