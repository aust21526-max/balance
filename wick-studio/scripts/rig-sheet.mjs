// Renders the rig's states (5 moods, 4 mouth shapes, red body) into one review sheet.
// Usage: node scripts/rig-sheet.mjs [out.png]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { drawWick } from '../characters/rig.mjs';
import { svgToPng } from '../lib/raster.mjs';

const out = process.argv[2] ?? 'out/rig-sheet.png';
mkdirSync(dirname(out), { recursive: true });

const MOODS = ['excited', 'calm', 'tense', 'gloomy', 'apology'];
const MOUTHS = ['closed', 'small', 'wide', 'round'];
const CELL_W = 300, CELL_H = 430, LABEL = 36;
const rows = [
  MOODS.map((mood) => ({ label: mood, state: { mood, flameSize: 1 } })),
  MOUTHS.map((mouth) => ({ label: `mouth: ${mouth}`, state: { mood: 'calm', mouth, flameSize: 1 } })),
  MOODS.map((mood) => ({ label: `${mood} · down week`, state: { mood, flameSize: 0.6, up: false } })),
];
const W = CELL_W * 5, H = rows.length * (CELL_H + LABEL) + 20;
let s = `<rect width="${W}" height="${H}" fill="#10141f"/>`;
rows.forEach((row, r) => row.forEach((cell, i) => {
  const x = i * CELL_W, y = 10 + r * (CELL_H + LABEL);
  s += `<g transform="translate(${x},${y}) scale(0.5)">${drawWick({ t: 0.35, ...cell.state })}</g>`;
  s += `<text x="${x + CELL_W / 2}" y="${y + CELL_H + 18}" font-family="Inter" font-size="22" font-weight="600" fill="#9aa3b5" text-anchor="middle">${cell.label}</text>`;
}));
writeFileSync(out, svgToPng(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`));
console.log(`wrote ${out}`);
