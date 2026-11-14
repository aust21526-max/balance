// Renders the three Weekly Wick design drafts into PNGs for review.
// Usage: node scripts/drafts-sheet.mjs [outDir]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DRAFTS } from '../characters/drafts.mjs';
import { svgToPng } from '../lib/raster.mjs';

const outDir = process.argv[2] ?? 'out/drafts';
mkdirSync(outDir, { recursive: true });

const BG = '#10141f';
const NAMES = { A: 'A · Candle Buddy', B: 'B · The Judge', C: 'C · Ember Head' };
const STATES = [
  { key: 'calm', label: 'calm · up week', opts: { up: true, mood: 'calm', flameSize: 1 } },
  { key: 'excited', label: 'excited · many passes', opts: { up: true, mood: 'excited', flameSize: 1.3 } },
  { key: 'gloomy', label: 'gloomy · down week, few passes', opts: { up: false, mood: 'gloomy', flameSize: 0.45 } },
];

const text = (x, y, s, size, color = '#e8ecf4', weight = 600) =>
  `<text x="${x}" y="${y}" font-family="Inter" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle">${s}</text>`;

// Individual front views (calm, up week) for Drive.
for (const [id, draw] of Object.entries(DRAFTS)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="${BG}"/>${draw(STATES[0].opts)}</svg>`;
  writeFileSync(join(outDir, `draft-${id}.svg`), svg);
  writeFileSync(join(outDir, `draft-${id}.png`), svgToPng(svg));
}

// Comparison sheet: one column per draft, main view on top, two moods underneath.
const colW = 600, W = colW * 3, H = 80 + 800 + 40 + 400 + 60;
let body = `<rect width="${W}" height="${H}" fill="${BG}"/>`;
Object.entries(DRAFTS).forEach(([id, draw], i) => {
  const x0 = i * colW;
  body += text(x0 + colW / 2, 56, NAMES[id], 34);
  body += `<g transform="translate(${x0},80)">${draw(STATES[0].opts)}</g>`;
  STATES.slice(1).forEach((st, j) => {
    const sx = x0 + j * 300, sy = 920;
    body += `<g transform="translate(${sx},${sy}) scale(0.5)">${draw(st.opts)}</g>`;
    body += text(sx + 150, sy + 420, st.label, 18, '#9aa3b5', 500);
  });
  if (i > 0) body += `<line x1="${x0}" y1="20" x2="${x0}" y2="${H - 20}" stroke="#2a3142" stroke-width="2"/>`;
});
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
writeFileSync(join(outDir, 'drafts-sheet.png'), svgToPng(sheet));
console.log(`wrote drafts to ${outDir}`);
