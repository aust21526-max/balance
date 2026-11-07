// Draws a synthetic placeholder "chart snapshot" for render tests.
// It is NOT market data and must never be published; real videos use TradingView snapshots.
// Usage: node scripts/make-sample-chart.mjs <out.png>
import { writeFileSync } from 'node:fs';
import { svgToPng } from '../lib/raster.mjs';

const out = process.argv[2] ?? 'out/sample-chart.png';
const W = 1600, H = 1266, N = 52;
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

let price = 100;
const bars = Array.from({ length: N }, (_, i) => {
  const o = price;
  const c = o + (rand() - 0.45) * 6 + (i > 40 ? 1.5 : 0);
  const h = Math.max(o, c) + rand() * 3, l = Math.min(o, c) - rand() * 3;
  price = c;
  return { o, h, l, c };
});
const lo = Math.min(...bars.map((b) => b.l)), hi = Math.max(...bars.map((b) => b.h));
const y = (v) => 140 + ((hi - v) / (hi - lo)) * (H - 300);
const bw = (W - 160) / N;

let s = `<rect width="${W}" height="${H}" fill="#131722"/>`;
for (let g = 0; g < 6; g++) s += `<line x1="60" x2="${W - 60}" y1="${140 + g * (H - 300) / 5}" y2="${140 + g * (H - 300) / 5}" stroke="#2a2e39"/>`;
bars.forEach((b, i) => {
  const x = 80 + i * bw, col = b.c >= b.o ? '#26a69a' : '#ef5350';
  s += `<line x1="${x + bw / 2}" x2="${x + bw / 2}" y1="${y(b.h)}" y2="${y(b.l)}" stroke="${col}" stroke-width="3"/>`;
  s += `<rect x="${x + 4}" y="${Math.min(y(b.o), y(b.c))}" width="${bw - 8}" height="${Math.max(3, Math.abs(y(b.o) - y(b.c)))}" fill="${col}"/>`;
});
s += `<text x="${W / 2}" y="${H - 70}" font-family="Inter" font-size="40" font-weight="800" fill="#ffb020" text-anchor="middle">SAMPLE · synthetic data · replace with TradingView snapshot</text>`;
writeFileSync(out, svgToPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`));
console.log(`wrote ${out}`);
