/**
 * OKLCH color representation.
 */
export interface OKLCH {
  /** Lightness (0-1) */
  l: number;
  /** Chroma (0-~0.4) */
  c: number;
  /** Hue (0-360) */
  h: number;
}

/**
 * Oklab color representation.
 */
export interface Oklab {
  L: number;
  a: number;
  b: number;
}

/**
 * Linear RGB color representation.
 */
export interface LinearRGB {
  r: number;
  g: number;
  b: number;
}

/**
 * State for a single box in the logo.
 */
export interface BoxState {
  /** Lightness (0-1) */
  l: number;
  /** Chroma factor (0-1), multiplied by maxChroma */
  cFactor: number;
  /** Hue angle (0-360) */
  h: number;
}

/**
 * Application state.
 */
export interface AppState {
  /** Spacing between boxes in pixels */
  spacing: number;
  /** Corner rounding radius (px or %) */
  rounding: number;
  /** Rounding unit: pixels or percentage */
  roundingUnit: 'px' | '%';
  /** Box width in pixels */
  boxWidth: number;
  /** Box height in pixels */
  boxHeight: number;
  /** Active color mode */
  colorMode: string;
  /** Base hue for non-custom modes */
  baseHue: number;
  /** Active balance mode */
  balanceMode: string;
  /** Base luminance for non-custom balance modes */
  baseLuminance: number;
  /** Base chroma factor for non-custom balance modes */
  baseChromaFactor: number;
  /** State for each of the 3 boxes */
  boxes: [BoxState, BoxState, BoxState];
}

/**
 * Preset for a single box in a color scheme.
 */
export interface SchemeBoxPreset {
  /** Hue offset from base hue */
  hueOffset: number;
  /** Default lightness */
  l: number;
  /** Default chroma factor */
  cFactor: number;
}

/**
 * Color scheme definition.
 */
export interface ColorScheme {
  name: string;
  description: string;
  boxes: [SchemeBoxPreset, SchemeBoxPreset, SchemeBoxPreset] | null;
}

/**
 * All available color schemes.
 */
export type Schemes = Record<string, ColorScheme>;

/**
 * Preset for a single box in a balance scheme.
 */
export interface BalanceBoxPreset {
  /** Luminance offset from base (-1 to 1) */
  lOffset: number;
  /** Chroma multiplier applied to base (0-2) */
  cMultiplier: number;
}

/**
 * Balance scheme definition.
 */
export interface BalanceScheme {
  name: string;
  description: string;
  boxes: [BalanceBoxPreset, BalanceBoxPreset, BalanceBoxPreset] | null;
}

/**
 * All available balance schemes.
 */
export type BalanceSchemes = Record<string, BalanceScheme>;
