// Exports Weekly Wick's five moods as fixed transparent PNGs (green and red body).
// Usage: node scripts/wick-stills.mjs [outDir]   (default assets/wick)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { drawWick } from '../characters/rig.mjs';
import { svgToPng } from '../lib/raster.mjs';

const outDir = process.argv[2] ?? 'assets/wick';
mkdirSync(outDir, { recursive: true });
for (const mood of ['excited', 'calm', 'tense', 'gloomy', 'apology']) {
  for (const up of [true, false]) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">${drawWick({ t: 0.35, mood, mouth: 'closed', blink: 0, flameSize: 1, up })}</svg>`;
    writeFileSync(join(outDir, `wick-${mood}-${up ? 'up' : 'down'}.png`), svgToPng(svg));
  }
}
console.log(`wrote 10 stills to ${outDir}`);
