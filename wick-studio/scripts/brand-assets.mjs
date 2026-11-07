// X profile picture (400x400) and header (1500x500) in the card B "judges' sheet" look,
// drawn with the same Wick rig as the cards and video.
// Usage: node scripts/brand-assets.mjs [outDir]   (default out/brand)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { drawWick } from '../characters/rig.mjs';
import { stamp } from '../lib/cards.mjs';
import { svgToPng } from '../lib/raster.mjs';

const outDir = process.argv[2] ?? 'out/brand';
mkdirSync(outDir, { recursive: true });
const PAPER = '#f3ede1', RULE = '#ddd2bd', MARGIN = '#d98b80', INK = '#1b1f2a', MUTED = '#6b6457';
const wick = (x, y, s, state) =>
  `<g transform="translate(${x},${y}) scale(${s}) translate(-300,-712)">${drawWick({ t: 0.35, blink: 0, mouth: 'closed', flameSize: 1.15, up: true, ...state })}</g>`;
const ruled = (W, H, step, from = step) => {
  let s = '';
  for (let y = from; y < H; y += step) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${RULE}" stroke-width="2"/>`;
  return s;
};

// Profile picture: X crops it to a circle, so Wick sits inside a centred safe circle.
function avatar(mood) {
  const W = 400;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${W}" viewBox="0 0 ${W} ${W}">
    <rect width="${W}" height="${W}" fill="${PAPER}"/>${ruled(W, W, 50, 25)}
    ${wick(200, 420, 0.64, { mood })}
  </svg>`;
}

// Header: X overlays the avatar bottom-left and crops top/bottom on some screens,
// so text sits centre-right inside the middle band.
function header() {
  const W = 1500, H = 500;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>${ruled(W, H, 50, 40)}
    <line x1="110" y1="0" x2="110" y2="${H}" stroke="${MARGIN}" stroke-width="3"/>
    <rect width="${W}" height="56" fill="${INK}"/>
    <text x="${W - 60}" y="37" font-family="Inter" font-size="22" font-weight="800" fill="${PAPER}" text-anchor="end" letter-spacing="6">OFFICIAL WEEKLY VERDICT</text>
    <text x="430" y="230" font-family="Inter" font-size="100" font-weight="900" fill="${INK}" letter-spacing="2">WEEKLY WICK</text>
    <text x="434" y="290" font-family="Inter" font-size="38" font-weight="700" fill="${MUTED}">Weekly close or it didn't happen.</text>
    <text x="434" y="340" font-family="Inter" font-size="26" font-weight="600" fill="${MUTED}">US stocks · judged every Saturday · every call graded vs SPY</text>
    ${stamp('B', 'QUALIFIED', 620, 420, 30, -8).svg}
    ${stamp('B', 'VANISHED', 880, 428, 26, 6).svg}
    ${wick(1370, 470, 0.58, { mood: 'excited' })}
  </svg>`;
}

for (const mood of ['calm', 'excited']) writeFileSync(join(outDir, `avatar-${mood}.png`), svgToPng(avatar(mood)));
writeFileSync(join(outDir, 'header.png'), svgToPng(header()));
console.log(`wrote avatar-calm.png, avatar-excited.png, header.png to ${outDir}`);
