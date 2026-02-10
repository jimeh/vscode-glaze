# Logo Builder

Interactive tool for picking a set of harmonious, complementary colors for the
Glaze logo. It uses the same color schemes that the VS Code extension itself
uses (analogous, complementary, triadic, etc.), making it easy to quickly find
combinations that look decent without manual color theory work. Built with
[Astro](https://astro.build/).

## Features

- **OKLCH color space** — All color manipulation uses OKLCH for perceptually
  uniform results
- **Color schemes** — Analogous, complementary, triadic, tetradic,
  split-complementary, monochromatic
- **Balance mode** — Fine-tune luminance and chroma across boxes
- **Box controls** — Dimensions, corner radius, spacing (including negative for
  reversed positions), percentage rounding
- **Dual preview** — Compare color variations side by side
- **SVG export** — Download the logo as SVG with customizable dimensions

## Development

```sh
pnpm install
pnpm run dev
```

This starts a local dev server. The app is a standalone static site, separate
from the main VSCode extension.

## Build

```sh
pnpm run build
pnpm run preview
```

Output goes to `dist/`.
