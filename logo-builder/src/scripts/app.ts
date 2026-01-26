/**
 * Client-side interactivity for the Logo Builder.
 */

import { oklchToHex, hexToOklch, maxChroma } from '../lib/color';
import { SCHEMES, BALANCE_SCHEMES, normalizeHue, clamp } from '../lib/schemes';
import type { AppState } from '../lib/types';

// SVG container size
const SVG_SIZE = 800;

// Default dimensions
const DEFAULT_BOX_WIDTH = 510;
const DEFAULT_BOX_HEIGHT = 368;
const DEFAULT_RADIUS = 123;

// State
const state: AppState = {
  spacing: 70,
  rounding: DEFAULT_RADIUS,
  roundingUnit: 'px',
  boxWidth: DEFAULT_BOX_WIDTH,
  boxHeight: DEFAULT_BOX_HEIGHT,
  colorMode: 'custom',
  baseHue: 195,
  balanceMode: 'custom',
  baseLuminance: 0.7,
  baseChromaFactor: 0.5,
  boxes: [
    { l: 0.95, cFactor: 0.54, h: 34 }, // Box 1 (back) - #f7ebe8
    { l: 0.63, cFactor: 0.75, h: 24 }, // Box 2 (red) - #e54b4b
    { l: 0.67, cFactor: 0.49, h: 205 }, // Box 3 (teal) - #6b9fa5
  ],
};

/**
 * Computes center X position for box placement.
 */
function getCenterX(): number {
  return (SVG_SIZE - state.boxWidth) / 2;
}

/**
 * Computes center Y position for box placement.
 */
function getCenterY(): number {
  return (SVG_SIZE - state.boxHeight) / 2;
}

/**
 * Gets maximum allowed rounding in pixels (half of smallest dimension).
 */
function getMaxRounding(): number {
  return Math.floor(Math.min(state.boxWidth, state.boxHeight) / 2);
}

/**
 * Converts current rounding value to pixels based on unit.
 * For percentage mode, uses the larger dimension as reference.
 */
function getRoundingPx(): number {
  if (state.roundingUnit === 'px') {
    return state.rounding;
  }
  // Percentage mode: use larger dimension as reference
  const ref = Math.max(state.boxWidth, state.boxHeight);
  return Math.round((state.rounding / 100) * ref);
}

// DOM elements - select all boxes from both SVGs
const boxes1 = document.querySelectorAll('.box1') as NodeListOf<SVGRectElement>;
const boxes2 = document.querySelectorAll('.box2') as NodeListOf<SVGRectElement>;
const boxes3 = document.querySelectorAll('.box3') as NodeListOf<SVGRectElement>;

const spacingSlider = document.getElementById('spacing') as HTMLInputElement;
const spacingValue = document.getElementById('spacing-value') as HTMLElement;
const roundingSlider = document.getElementById('rounding') as HTMLInputElement;
const roundingValue = document.getElementById('rounding-value') as HTMLElement;
const roundingUnitContainer = document.getElementById(
  'rounding-unit'
) as HTMLElement;
const boxWidthSlider = document.getElementById('box-width') as HTMLInputElement;
const boxWidthValue = document.getElementById('box-width-value') as HTMLElement;
const boxHeightSlider = document.getElementById(
  'box-height'
) as HTMLInputElement;
const boxHeightValue = document.getElementById(
  'box-height-value'
) as HTMLElement;
const dimensionPresetsContainer = document.getElementById(
  'dimension-presets'
) as HTMLElement;
const baseHueSlider = document.getElementById('base-hue') as HTMLInputElement;
const baseHueValue = document.getElementById('base-hue-value') as HTMLElement;
const baseHuePreview = document.getElementById(
  'base-hue-preview'
) as HTMLElement;
const baseHueGroup = document.getElementById('base-hue-group') as HTMLElement;
const colorModeContainer = document.getElementById('color-mode') as HTMLElement;
const balanceModeContainer = document.getElementById(
  'balance-mode'
) as HTMLElement;
const baseLCGroup = document.getElementById('base-lc-group') as HTMLElement;
const baseLuminanceSlider = document.getElementById(
  'base-luminance'
) as HTMLInputElement;
const baseLuminanceValue = document.getElementById(
  'base-luminance-value'
) as HTMLElement;
const baseChromaSlider = document.getElementById(
  'base-chroma'
) as HTMLInputElement;
const baseChromaValue = document.getElementById(
  'base-chroma-value'
) as HTMLElement;
const copySvgBtn = document.getElementById('copy-svg') as HTMLButtonElement;
const downloadSvgBtn = document.getElementById(
  'download-svg'
) as HTMLButtonElement;

const boxControls = document.querySelectorAll('.box-control');

/**
 * Gets computed color for a box based on current mode.
 */
function getBoxColor(boxIndex: number): string {
  const box = state.boxes[boxIndex];
  let hue: number;
  let l: number;
  let cFactor: number;

  // Compute hue from color mode
  if (state.colorMode === 'custom') {
    hue = box.h;
  } else {
    const scheme = SCHEMES[state.colorMode];
    if (scheme && scheme.boxes) {
      hue = normalizeHue(state.baseHue + scheme.boxes[boxIndex].hueOffset);
    } else {
      hue = box.h;
    }
  }

  // Compute L/cFactor from balance mode
  if (state.balanceMode === 'custom') {
    l = box.l;
    cFactor = box.cFactor;
  } else {
    const balanceScheme = BALANCE_SCHEMES[state.balanceMode];
    if (balanceScheme && balanceScheme.boxes) {
      const preset = balanceScheme.boxes[boxIndex];
      l = clamp(state.baseLuminance + preset.lOffset, 0, 1);
      cFactor = clamp(state.baseChromaFactor * preset.cMultiplier, 0, 1);
    } else {
      l = box.l;
      cFactor = box.cFactor;
    }
  }

  const mc = maxChroma(l, hue);
  const c = mc * cFactor;

  return oklchToHex({ l, c, h: hue });
}

/**
 * Updates SVG positions and dimensions based on spacing and box size.
 * Box3 (front) is centered, box1 offset up-left, box2 offset down-right.
 */
function updatePositions(): void {
  const spacing = state.spacing;
  const centerX = getCenterX();
  const centerY = getCenterY();
  const width = String(state.boxWidth);
  const height = String(state.boxHeight);

  // Box3 (front): centered
  const box3X = centerX;
  const box3Y = centerY;

  // Box1 (back): offset up-left from center
  const box1X = centerX - spacing;
  const box1Y = centerY - spacing;

  // Box2 (back): offset down-right from center
  const box2X = centerX + spacing;
  const box2Y = centerY + spacing;

  // Apply to all SVG instances
  boxes1.forEach((box) => {
    box.setAttribute('x', String(box1X));
    box.setAttribute('y', String(box1Y));
    box.setAttribute('width', width);
    box.setAttribute('height', height);
  });
  boxes2.forEach((box) => {
    box.setAttribute('x', String(box2X));
    box.setAttribute('y', String(box2Y));
    box.setAttribute('width', width);
    box.setAttribute('height', height);
  });
  boxes3.forEach((box) => {
    box.setAttribute('x', String(box3X));
    box.setAttribute('y', String(box3Y));
    box.setAttribute('width', width);
    box.setAttribute('height', height);
  });
}

/**
 * Updates SVG colors for all preview instances.
 */
function updateColors(): void {
  const color1 = getBoxColor(0);
  const color2 = getBoxColor(1);
  const color3 = getBoxColor(2);

  boxes1.forEach((box) => box.setAttribute('fill', color1));
  boxes2.forEach((box) => box.setAttribute('fill', color2));
  boxes3.forEach((box) => box.setAttribute('fill', color3));
}

/**
 * Updates SVG corner rounding for all preview instances.
 */
function updateRounding(): void {
  const rx = String(getRoundingPx());
  boxes1.forEach((box) => box.setAttribute('rx', rx));
  boxes2.forEach((box) => box.setAttribute('rx', rx));
  boxes3.forEach((box) => box.setAttribute('rx', rx));
}

/**
 * Updates UI controls to match state.
 */
function updateUI(): void {
  // Spacing
  spacingSlider.value = String(state.spacing);
  spacingValue.textContent = String(state.spacing);

  // Box dimensions
  boxWidthSlider.value = String(state.boxWidth);
  boxWidthValue.textContent = String(state.boxWidth);
  boxHeightSlider.value = String(state.boxHeight);
  boxHeightValue.textContent = String(state.boxHeight);

  // Dimension presets
  dimensionPresetsContainer.querySelectorAll('button').forEach((btn) => {
    const w = parseInt((btn as HTMLButtonElement).dataset.width || '0', 10);
    const h = parseInt((btn as HTMLButtonElement).dataset.height || '0', 10);
    btn.classList.toggle(
      'active',
      w === state.boxWidth && h === state.boxHeight
    );
  });

  // Rounding - update slider max and value display
  const maxRounding = state.roundingUnit === 'px' ? getMaxRounding() : 50;
  roundingSlider.max = String(maxRounding);
  roundingSlider.value = String(state.rounding);
  roundingValue.textContent = String(state.rounding);

  // Rounding unit toggle
  roundingUnitContainer.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle(
      'active',
      (btn as HTMLButtonElement).dataset.unit === state.roundingUnit
    );
  });

  // Base hue
  baseHueSlider.value = String(state.baseHue);
  baseHueValue.textContent = String(state.baseHue);
  const mc = maxChroma(0.6, state.baseHue);
  baseHuePreview.style.backgroundColor = oklchToHex({
    l: 0.6,
    c: mc * 0.8,
    h: state.baseHue,
  });

  // Show/hide base hue based on mode
  if (state.colorMode === 'custom') {
    baseHueGroup.style.opacity = '0.5';
    baseHueGroup.style.pointerEvents = 'none';
  } else {
    baseHueGroup.style.opacity = '1';
    baseHueGroup.style.pointerEvents = 'auto';
  }

  // Color mode buttons
  colorModeContainer.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle(
      'active',
      (btn as HTMLButtonElement).dataset.mode === state.colorMode
    );
  });

  // Balance mode buttons
  balanceModeContainer.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle(
      'active',
      (btn as HTMLButtonElement).dataset.mode === state.balanceMode
    );
  });

  // Base L/C sliders
  baseLuminanceSlider.value = String(Math.round(state.baseLuminance * 100));
  baseLuminanceValue.textContent = state.baseLuminance.toFixed(2);
  baseChromaSlider.value = String(Math.round(state.baseChromaFactor * 100));
  baseChromaValue.textContent = state.baseChromaFactor.toFixed(2);

  // Show/hide base L/C based on balance mode
  if (state.balanceMode === 'custom') {
    baseLCGroup.style.opacity = '0.5';
    baseLCGroup.style.pointerEvents = 'none';
  } else {
    baseLCGroup.style.opacity = '1';
    baseLCGroup.style.pointerEvents = 'auto';
  }

  // Box controls
  boxControls.forEach((ctrl) => {
    const boxIndex = parseInt(ctrl.getAttribute('data-box') || '1', 10) - 1;
    const box = state.boxes[boxIndex];
    const lSlider = ctrl.querySelector('.l-slider') as HTMLInputElement;
    const cSlider = ctrl.querySelector('.c-slider') as HTMLInputElement;
    const hSlider = ctrl.querySelector('.h-slider') as HTMLInputElement;
    const lValueEl = ctrl.querySelector('.l-value') as HTMLElement;
    const cValueEl = ctrl.querySelector('.c-value') as HTMLElement;
    const hValueEl = ctrl.querySelector('.h-value') as HTMLElement;
    const hexInput = ctrl.querySelector('.hex-input') as HTMLInputElement;
    const swatch = ctrl.querySelector('.color-swatch') as HTMLElement;
    const hueRow = ctrl.querySelector('.hue-row') as HTMLElement;
    const lRow = ctrl.querySelector('.l-row') as HTMLElement;
    const cRow = ctrl.querySelector('.c-row') as HTMLElement;

    // L/C handling based on balance mode
    if (state.balanceMode === 'custom') {
      lSlider.value = String(Math.round(box.l * 100));
      cSlider.value = String(Math.round(box.cFactor * 100));
      lValueEl.textContent = box.l.toFixed(2);
      cValueEl.textContent = box.cFactor.toFixed(2);
      lRow.classList.remove('disabled');
      cRow.classList.remove('disabled');
    } else {
      const balanceScheme = BALANCE_SCHEMES[state.balanceMode];
      if (balanceScheme && balanceScheme.boxes) {
        const preset = balanceScheme.boxes[boxIndex];
        const computedL = clamp(state.baseLuminance + preset.lOffset, 0, 1);
        const computedC = clamp(
          state.baseChromaFactor * preset.cMultiplier,
          0,
          1
        );
        lSlider.value = String(Math.round(computedL * 100));
        cSlider.value = String(Math.round(computedC * 100));
        lValueEl.textContent = computedL.toFixed(2);
        cValueEl.textContent = computedC.toFixed(2);
      }
      lRow.classList.add('disabled');
      cRow.classList.add('disabled');
    }

    // Hue handling
    if (state.colorMode === 'custom') {
      hSlider.value = String(box.h);
      hValueEl.textContent = String(Math.round(box.h));
      hueRow.classList.remove('disabled');
    } else {
      const scheme = SCHEMES[state.colorMode];
      if (scheme && scheme.boxes) {
        const computedHue = normalizeHue(
          state.baseHue + scheme.boxes[boxIndex].hueOffset
        );
        hSlider.value = String(computedHue);
        hValueEl.textContent = String(Math.round(computedHue));
      }
      hueRow.classList.add('disabled');
    }

    const color = getBoxColor(boxIndex);
    hexInput.value = color;
    swatch.style.backgroundColor = color;
  });
}

/**
 * Applies scheme defaults to boxes.
 */
function applySchemeDefaults(schemeName: string): void {
  const scheme = SCHEMES[schemeName];
  if (!scheme || !scheme.boxes) return;

  scheme.boxes.forEach((preset, i) => {
    state.boxes[i].l = preset.l;
    state.boxes[i].cFactor = preset.cFactor;
  });
}

/**
 * Sets base L/C values from current box averages when switching to
 * non-custom balance mode.
 */
function applyBalanceDefaults(): void {
  const avgL =
    state.boxes.reduce((sum, box) => sum + box.l, 0) / state.boxes.length;
  const avgC =
    state.boxes.reduce((sum, box) => sum + box.cFactor, 0) / state.boxes.length;

  state.baseLuminance = clamp(avgL, 0.1, 0.9);
  state.baseChromaFactor = clamp(avgC, 0.1, 0.9);
}

/**
 * Full render update.
 */
function render(): void {
  updatePositions();
  updateColors();
  updateRounding();
  updateUI();
}

/**
 * Generates clean SVG string for export.
 * Order: box1 (back), box2 (back), box3 (front) - last rendered = on top.
 */
function generateSvg(): string {
  const spacing = state.spacing;
  const centerX = getCenterX();
  const centerY = getCenterY();
  const color1 = getBoxColor(0);
  const color2 = getBoxColor(1);
  const color3 = getBoxColor(2);
  const width = state.boxWidth;
  const height = state.boxHeight;

  // Box positions: box3 centered, box1 up-left, box2 down-right
  const box1X = centerX - spacing;
  const box1Y = centerY - spacing;
  const box2X = centerX + spacing;
  const box2Y = centerY + spacing;
  const box3X = centerX;
  const box3Y = centerY;

  const rx = getRoundingPx();

  return `<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <rect x="${box1X}" y="${box1Y}" width="${width}" height="${height}" rx="${rx}" fill="${color1}"/>
  <rect x="${box2X}" y="${box2Y}" width="${width}" height="${height}" rx="${rx}" fill="${color2}"/>
  <rect x="${box3X}" y="${box3Y}" width="${width}" height="${height}" rx="${rx}" fill="${color3}"/>
</svg>`;
}

// Event handlers

spacingSlider.addEventListener('input', (e) => {
  state.spacing = parseInt((e.target as HTMLInputElement).value, 10);
  render();
});

roundingSlider.addEventListener('input', (e) => {
  state.rounding = parseInt((e.target as HTMLInputElement).value, 10);
  render();
});

// Rounding unit toggle
roundingUnitContainer.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;
  const unit = (target as HTMLButtonElement).dataset.unit as 'px' | '%';
  if (!unit || unit === state.roundingUnit) return;

  // Convert current value between units
  if (unit === '%') {
    // px -> %: convert current px to percentage of larger dimension
    const ref = Math.max(state.boxWidth, state.boxHeight);
    state.rounding = Math.round((state.rounding / ref) * 100);
    // Clamp to 0-50
    state.rounding = Math.min(50, Math.max(0, state.rounding));
  } else {
    // % -> px: convert percentage to pixels
    const ref = Math.max(state.boxWidth, state.boxHeight);
    state.rounding = Math.round((state.rounding / 100) * ref);
    // Clamp to max rounding
    const maxRounding = getMaxRounding();
    state.rounding = Math.min(maxRounding, state.rounding);
  }
  state.roundingUnit = unit;
  render();
});

// Box dimension sliders
boxWidthSlider.addEventListener('input', (e) => {
  state.boxWidth = parseInt((e.target as HTMLInputElement).value, 10);
  // Clamp rounding if in px mode and exceeds new max
  if (state.roundingUnit === 'px') {
    const maxRounding = getMaxRounding();
    if (state.rounding > maxRounding) {
      state.rounding = maxRounding;
    }
  }
  render();
});

boxHeightSlider.addEventListener('input', (e) => {
  state.boxHeight = parseInt((e.target as HTMLInputElement).value, 10);
  // Clamp rounding if in px mode and exceeds new max
  if (state.roundingUnit === 'px') {
    const maxRounding = getMaxRounding();
    if (state.rounding > maxRounding) {
      state.rounding = maxRounding;
    }
  }
  render();
});

// Dimension presets
dimensionPresetsContainer.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;
  const btn = target as HTMLButtonElement;
  const width = parseInt(btn.dataset.width || '0', 10);
  const height = parseInt(btn.dataset.height || '0', 10);
  if (!width || !height) return;

  state.boxWidth = width;
  state.boxHeight = height;

  // Clamp rounding if in px mode and exceeds new max
  if (state.roundingUnit === 'px') {
    const maxRounding = getMaxRounding();
    if (state.rounding > maxRounding) {
      state.rounding = maxRounding;
    }
  }
  render();
});

baseHueSlider.addEventListener('input', (e) => {
  state.baseHue = parseInt((e.target as HTMLInputElement).value, 10);
  render();
});

colorModeContainer.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;
  const mode = (target as HTMLButtonElement).dataset.mode;
  if (!mode || mode === state.colorMode) return;

  state.colorMode = mode;
  if (mode !== 'custom') {
    applySchemeDefaults(mode);
  }
  render();
});

balanceModeContainer.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName !== 'BUTTON') return;
  const mode = (target as HTMLButtonElement).dataset.mode;
  if (!mode || mode === state.balanceMode) return;

  state.balanceMode = mode;
  if (mode !== 'custom') {
    applyBalanceDefaults();
  }
  render();
});

baseLuminanceSlider.addEventListener('input', (e) => {
  state.baseLuminance =
    parseInt((e.target as HTMLInputElement).value, 10) / 100;
  render();
});

baseChromaSlider.addEventListener('input', (e) => {
  state.baseChromaFactor =
    parseInt((e.target as HTMLInputElement).value, 10) / 100;
  render();
});

copySvgBtn.addEventListener('click', async () => {
  const svg = generateSvg();
  try {
    await navigator.clipboard.writeText(svg);
    copySvgBtn.textContent = 'Copied!';
    setTimeout(() => {
      copySvgBtn.textContent = 'Copy SVG';
    }, 1500);
  } catch (err) {
    console.error('Copy failed:', err);
    alert('Failed to copy SVG');
  }
});

downloadSvgBtn.addEventListener('click', () => {
  const svg = generateSvg();
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'patina-logo.svg';
  a.click();
  URL.revokeObjectURL(url);
});

// Box control event handlers
boxControls.forEach((ctrl) => {
  const boxIndex = parseInt(ctrl.getAttribute('data-box') || '1', 10) - 1;
  const lSlider = ctrl.querySelector('.l-slider') as HTMLInputElement;
  const cSlider = ctrl.querySelector('.c-slider') as HTMLInputElement;
  const hSlider = ctrl.querySelector('.h-slider') as HTMLInputElement;
  const hexInput = ctrl.querySelector('.hex-input') as HTMLInputElement;

  lSlider.addEventListener('input', (e) => {
    if (state.balanceMode === 'custom') {
      state.boxes[boxIndex].l =
        parseInt((e.target as HTMLInputElement).value, 10) / 100;
      render();
    }
  });

  cSlider.addEventListener('input', (e) => {
    if (state.balanceMode === 'custom') {
      state.boxes[boxIndex].cFactor =
        parseInt((e.target as HTMLInputElement).value, 10) / 100;
      render();
    }
  });

  hSlider.addEventListener('input', (e) => {
    if (state.colorMode === 'custom') {
      state.boxes[boxIndex].h =
        parseInt((e.target as HTMLInputElement).value, 10);
      render();
    }
  });

  hexInput.addEventListener('change', (e) => {
    const hex = (e.target as HTMLInputElement).value.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      render(); // Reset to current value
      return;
    }

    try {
      const oklch = hexToOklch(hex);
      state.boxes[boxIndex].l = oklch.l;
      state.boxes[boxIndex].h = oklch.h;

      // Estimate cFactor from actual chroma
      const mc = maxChroma(oklch.l, oklch.h);
      state.boxes[boxIndex].cFactor = mc > 0 ? Math.min(1, oklch.c / mc) : 0;

      // Switch to custom modes if not already
      if (state.colorMode !== 'custom') {
        state.colorMode = 'custom';
      }
      if (state.balanceMode !== 'custom') {
        state.balanceMode = 'custom';
      }
      render();
    } catch (err) {
      render(); // Reset on error
    }
  });
});

// Initialize - always dark mode
document.body.dataset.theme = 'dark';
render();
