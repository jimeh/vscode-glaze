import { Resvg, type ResvgRenderOptions } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const images = [
  { svg: 'img/icon.svg', png: 'img/icon.png', width: 512 },
  { svg: 'img/logo.svg', png: 'img/logo.png', width: 1024 },
];

for (const { svg, png, width } of images) {
  const svgData = readFileSync(svg, 'utf8');
  const opts: ResvgRenderOptions = {
    fitTo: { mode: 'width', value: width },
    shapeRendering: 2, // geometricPrecision - highest quality
  };
  const resvg = new Resvg(svgData, opts);
  writeFileSync(png, resvg.render().asPng());
  console.log(`Generated ${png} (${width}px)`);
}
