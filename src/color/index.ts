export { generatePalette, calculateBaseTint } from './palette';
export type {
  CalculateBaseTintOptions,
  GeneratePaletteOptions,
  PartialPatinaColorPalette,
} from './palette';
export type { ColorScheme } from './schemes';
export {
  ALL_COLOR_SCHEMES,
  COLOR_SCHEME_LABELS,
  DEFAULT_COLOR_SCHEME,
  isValidColorScheme,
} from './schemes';
export { getColorName } from './naming';
export {
  computeBaseHue,
  applyHueOffset,
  computeBaseTintHex,
  computeTint,
  tintResultToPalette,
  tintResultToStatusBarColors,
} from './tint';
export type { TintKeyDetail, TintResult, ComputeTintOptions } from './tint';
