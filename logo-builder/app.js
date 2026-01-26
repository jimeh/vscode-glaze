import { oklchToHex, hexToOklch, maxChroma } from './color.js';
import { SCHEMES, normalizeHue } from './schemes.js';

// SVG dimensions
const BOX_WIDTH = 510.4;
const BOX_HEIGHT = 368.4;
const BOX_RADIUS = 122.8;
const BASE_X = 74.8;
const BASE_Y = 145.8;

// State
let state = {
  spacing: 70,
  colorMode: 'custom',
  baseHue: 195,
  boxes: [
    { l: 0.92, cFactor: 0.15, h: 30 },  // Box 1 (back)
    { l: 0.55, cFactor: 0.50, h: 25 },  // Box 2 (front)
    { l: 0.65, cFactor: 0.45, h: 195 }, // Box 3 (middle)
  ],
};

// DOM elements
const box1 = document.getElementById('box1');
const box2 = document.getElementById('box2');
const box3 = document.getElementById('box3');

const spacingSlider = document.getElementById('spacing');
const spacingValue = document.getElementById('spacing-value');
const baseHueSlider = document.getElementById('base-hue');
const baseHueValue = document.getElementById('base-hue-value');
const baseHuePreview = document.getElementById('base-hue-preview');
const baseHueGroup = document.getElementById('base-hue-group');
const colorModeContainer = document.getElementById('color-mode');
const themeToggle = document.getElementById('theme-toggle');
const copySvgBtn = document.getElementById('copy-svg');
const downloadSvgBtn = document.getElementById('download-svg');

const boxControls = document.querySelectorAll('.box-control');

/**
 * Gets computed color for a box based on current mode.
 */
function getBoxColor(boxIndex) {
  const box = state.boxes[boxIndex];
  let hue;

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
 */
function updatePositions() {
  const spacing = state.spacing;

  // Box 1 (back) - base position
  box1.setAttribute('x', BASE_X);
  box1.setAttribute('y', BASE_Y);

  // Box 3 (middle) - 1x spacing
  box3.setAttribute('x', BASE_X + spacing);
  box3.setAttribute('y', BASE_Y + spacing);

  // Box 2 (front) - 2x spacing
  box2.setAttribute('x', BASE_X + spacing * 2);
  box2.setAttribute('y', BASE_Y + spacing * 2);
}

/**
 * Updates SVG colors.
 */
function updateColors() {
  box1.setAttribute('fill', getBoxColor(0));
  box2.setAttribute('fill', getBoxColor(1));
  box3.setAttribute('fill', getBoxColor(2));
}

/**
 * Updates UI controls to match state.
 */
function updateUI() {
  // Spacing
  spacingSlider.value = state.spacing;
  spacingValue.textContent = state.spacing;

  // Base hue
  baseHueSlider.value = state.baseHue;
  baseHueValue.textContent = state.baseHue;
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
    btn.classList.toggle('active', btn.dataset.mode === state.colorMode);
  });

  // Box controls
  boxControls.forEach((ctrl, i) => {
    const box = state.boxes[i];
    const lSlider = ctrl.querySelector('.l-slider');
    const cSlider = ctrl.querySelector('.c-slider');
    const hSlider = ctrl.querySelector('.h-slider');
    const lValueEl = ctrl.querySelector('.l-value');
    const cValueEl = ctrl.querySelector('.c-value');
    const hValueEl = ctrl.querySelector('.h-value');
    const hexInput = ctrl.querySelector('.hex-input');
    const swatch = ctrl.querySelector('.color-swatch');
    const hueRow = ctrl.querySelector('.hue-row');

    lSlider.value = Math.round(box.l * 100);
    cSlider.value = Math.round(box.cFactor * 100);
    lValueEl.textContent = box.l.toFixed(2);
    cValueEl.textContent = box.cFactor.toFixed(2);

    // Hue handling
    if (state.colorMode === 'custom') {
      hSlider.value = box.h;
      hValueEl.textContent = Math.round(box.h);
      hueRow.classList.remove('disabled');
    } else {
      const scheme = SCHEMES[state.colorMode];
      if (scheme && scheme.boxes) {
        const computedHue = normalizeHue(
          state.baseHue + scheme.boxes[i].hueOffset
        );
        hSlider.value = computedHue;
        hValueEl.textContent = Math.round(computedHue);
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
function applySchemeDefaults(schemeName) {
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
function render() {
  updatePositions();
  updateColors();
  updateUI();
}

/**
 * Generates clean SVG string for export.
 */
function generateSvg() {
  const spacing = state.spacing;
  const color1 = getBoxColor(0);
  const color2 = getBoxColor(1);
  const color3 = getBoxColor(2);

  return `<svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
  <rect x="${BASE_X}" y="${BASE_Y}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_RADIUS}" fill="${color1}"/>
  <rect x="${BASE_X + spacing}" y="${BASE_Y + spacing}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_RADIUS}" fill="${color3}"/>
  <rect x="${BASE_X + spacing * 2}" y="${BASE_Y + spacing * 2}" width="${BOX_WIDTH}" height="${BOX_HEIGHT}" rx="${BOX_RADIUS}" fill="${color2}"/>
</svg>`;
}

// Event handlers

spacingSlider.addEventListener('input', (e) => {
  state.spacing = parseInt(e.target.value, 10);
  render();
});

baseHueSlider.addEventListener('input', (e) => {
  state.baseHue = parseInt(e.target.value, 10);
  render();
});

colorModeContainer.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  const mode = e.target.dataset.mode;
  if (!mode || mode === state.colorMode) return;

  state.colorMode = mode;
  if (mode !== 'custom') {
    applySchemeDefaults(mode);
  }
  render();
});

themeToggle.addEventListener('click', () => {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? 'light' : 'dark';
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
  const lSlider = ctrl.querySelector('.l-slider');
  const cSlider = ctrl.querySelector('.c-slider');
  const hSlider = ctrl.querySelector('.h-slider');
  const hexInput = ctrl.querySelector('.hex-input');

  lSlider.addEventListener('input', (e) => {
    state.boxes[i].l = parseInt(e.target.value, 10) / 100;
    render();
  });

  cSlider.addEventListener('input', (e) => {
    state.boxes[i].cFactor = parseInt(e.target.value, 10) / 100;
    render();
  });

  hSlider.addEventListener('input', (e) => {
    if (state.colorMode === 'custom') {
      state.boxes[i].h = parseInt(e.target.value, 10);
      render();
    }
  });

  hexInput.addEventListener('change', (e) => {
    const hex = e.target.value.trim();
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

// Initialize
render();
