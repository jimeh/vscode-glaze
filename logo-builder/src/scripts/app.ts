/**
 * Client-side interactivity for the Logo Builder.
 */

import { oklchToHex, hexToOklch, maxChroma } from '../lib/color';
import { SCHEMES, normalizeHue } from '../lib/schemes';
import type { AppState } from '../lib/types';

// SVG dimensions
const BOX_WIDTH = 510.4;
const BOX_HEIGHT = 368.4;
const BOX_RADIUS = 122.8;
const SVG_SIZE = 800;

// Center position for the front box (box3)
const CENTER_X = (SVG_SIZE - BOX_WIDTH) / 2;
const CENTER_Y = (SVG_SIZE - BOX_HEIGHT) / 2;

// State
const state: AppState = {
  spacing: 70,
  colorMode: 'custom',
  baseHue: 195,
  boxes: [
    { l: 0.92, cFactor: 0.15, h: 30 }, // Box 1 (back)
    { l: 0.55, cFactor: 0.5, h: 25 }, // Box 2 (front)
    { l: 0.65, cFactor: 0.45, h: 195 }, // Box 3 (middle)
  ],
};

// DOM elements - select all boxes from both SVGs
const boxes1 = document.querySelectorAll('.box1') as NodeListOf<SVGRectElement>;
const boxes2 = document.querySelectorAll('.box2') as NodeListOf<SVGRectElement>;
const boxes3 = document.querySelectorAll('.box3') as NodeListOf<SVGRectElement>;

const spacingSlider = document.getElementById('spacing') as HTMLInputElement;
const spacingValue = document.getElementById('spacing-value') as HTMLElement;
const baseHueSlider = document.getElementById('base-hue') as HTMLInputElement;
const baseHueValue = document.getElementById('base-hue-value') as HTMLElement;
const baseHuePreview = document.getElementById(
  'base-hue-preview'
) as HTMLElement;
const baseHueGroup = document.getElementById('base-hue-group') as HTMLElement;
const colorModeContainer = document.getElementById(
  'color-mode'
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

  const mc = maxChroma(box.l, hue);
  const c = mc * box.cFactor;

  return oklchToHex({ l: box.l, c, h: hue });
}

/**
 * Updates SVG positions based on spacing.
 * Box3 (front) is centered, box1 offset up-left, box2 offset down-right.
 */
function updatePositions(): void {
  const spacing = state.spacing;

  // Box3 (front): centered
  const box3X = CENTER_X;
  const box3Y = CENTER_Y;

  // Box1 (back): offset up-left from center
  const box1X = CENTER_X - spacing;
  const box1Y = CENTER_Y - spacing;

  // Box2 (back): offset down-right from center
  const box2X = CENTER_X + spacing;
  const box2Y = CENTER_Y + spacing;

  // Apply to all SVG instances
  boxes1.forEach((box) => {
    box.setAttribute('x', String(box1X));
    box.setAttribute('y', String(box1Y));
  });
  boxes2.forEach((box) => {
    box.setAttribute('x', String(box2X));
    box.setAttribute('y', String(box2Y));
  });
  boxes3.forEach((box) => {
    box.setAttribute('x', String(box3X));
    box.setAttribute('y', String(box3Y));
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
 * Updates UI controls to match state.
 */
function updateUI(): void {
  // Spacing
  spacingSlider.value = String(state.spacing);
  spacingValue.textContent = String(state.spacing);

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

  // Box controls
  boxControls.forEach((ctrl, i) => {
    const box = state.boxes[i];
    const lSlider = ctrl.querySelector('.l-slider') as HTMLInputElement;
    const cSlider = ctrl.querySelector('.c-slider') as HTMLInputElement;
    const hSlider = ctrl.querySelector('.h-slider') as HTMLInputElement;
    const lValueEl = ctrl.querySelector('.l-value') as HTMLElement;
    const cValueEl = ctrl.querySelector('.c-value') as HTMLElement;
    const hValueEl = ctrl.querySelector('.h-value') as HTMLElement;
    const hexInput = ctrl.querySelector('.hex-input') as HTMLInputElement;
    const swatch = ctrl.querySelector('.color-swatch') as HTMLElement;
    const hueRow = ctrl.querySelector('.hue-row') as HTMLElement;

    lSlider.value = String(Math.round(box.l * 100));
    cSlider.value = String(Math.round(box.cFactor * 100));
    lValueEl.textContent = box.l.toFixed(2);
    cValueEl.textContent = box.cFactor.toFixed(2);

    // Hue handling
    if (state.colorMode === 'custom') {
      hSlider.value = String(box.h);
      hValueEl.textContent = String(Math.round(box.h));
      hueRow.classList.remove('disabled');
    } else {
      const scheme = SCHEMES[state.colorMode];
      if (scheme && scheme.boxes) {
        const computedHue = normalizeHue(
          state.baseHue + scheme.boxes[i].hueOffset
        );
        hSlider.value = String(computedHue);
        hValueEl.textContent = String(Math.round(computedHue));
      }
      hueRow.classList.add('disabled');
    }

    const color = getBoxColor(i);
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
 * Full render update.
 */
function render(): void {
  updatePositions();
  updateColors();
  updateUI();
}

/**
 * Generates clean SVG string for export.
 * Order: box1 (back), box2 (back), box3 (front) - last rendered = on top.
 */
function generateSvg(): string {
  const spacing = state.spacing;
  const color1 = getBoxColor(0);
  const color2 = getBoxColor(1);
  const color3 = getBoxColor(2);

  // Box positions: box3 centered, box1 up-left, box2 down-right
  const box1X = CENTER_X - spacing;
  const box1Y = CENTER_Y - spacing;
  const box2X = CENTER_X + spacing;
  const box2Y = CENTER_Y + spacing;
  const box3X = CENTER_X;
  const box3Y = CENTER_Y;

  return `<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <rect x="${box1X}" y="${box1Y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_RADIUS}" fill="${color1}"/>
  <rect x="${box2X}" y="${box2Y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_RADIUS}" fill="${color2}"/>
  <rect x="${box3X}" y="${box3Y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_RADIUS}" fill="${color3}"/>
</svg>`;
}

// Event handlers

spacingSlider.addEventListener('input', (e) => {
  state.spacing = parseInt((e.target as HTMLInputElement).value, 10);
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
boxControls.forEach((ctrl, i) => {
  const lSlider = ctrl.querySelector('.l-slider') as HTMLInputElement;
  const cSlider = ctrl.querySelector('.c-slider') as HTMLInputElement;
  const hSlider = ctrl.querySelector('.h-slider') as HTMLInputElement;
  const hexInput = ctrl.querySelector('.hex-input') as HTMLInputElement;

  lSlider.addEventListener('input', (e) => {
    state.boxes[i].l = parseInt((e.target as HTMLInputElement).value, 10) / 100;
    render();
  });

  cSlider.addEventListener('input', (e) => {
    state.boxes[i].cFactor =
      parseInt((e.target as HTMLInputElement).value, 10) / 100;
    render();
  });

  hSlider.addEventListener('input', (e) => {
    if (state.colorMode === 'custom') {
      state.boxes[i].h = parseInt((e.target as HTMLInputElement).value, 10);
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
      state.boxes[i].l = oklch.l;
      state.boxes[i].h = oklch.h;

      // Estimate cFactor from actual chroma
      const mc = maxChroma(oklch.l, oklch.h);
      state.boxes[i].cFactor = mc > 0 ? Math.min(1, oklch.c / mc) : 0;

      // Switch to custom mode if not already
      if (state.colorMode !== 'custom') {
        state.colorMode = 'custom';
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
