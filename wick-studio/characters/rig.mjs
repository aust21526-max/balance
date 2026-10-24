// Weekly Wick rig — PLACEHOLDER character (based on draft B) until the final design is chosen.
// The renderer only depends on drawWick(state); swap this file to change the character.
//
// state = {
//   t,          seconds since start (drives flicker/bounce/tremble deterministically)
//   mood,       'excited' | 'calm' | 'tense' | 'gloomy' | 'apology'
//   mouth,      'closed' | 'small' | 'wide' | 'round'
//   blink,      0..1 (1 = eyes fully closed)
//   flameSize,  ~0.4..1.4 (number of qualified stocks this week)
//   up,         true = green (up week), false = red (down week)
// }
// Returns an SVG <g> drawn on a 600x800 stage, feet at roughly y=712.

import { PALETTE } from './drafts.mjs';

const TRIFLAME =
  'M0,-1 C0.1,-0.8 0.2,-0.7 0.16,-0.55 C0.26,-0.65 0.32,-0.72 0.3,-0.84 ' +
  'C0.44,-0.6 0.42,-0.3 0.34,-0.16 C0.26,-0.02 0.14,0 0,0 ' +
  'C-0.14,0 -0.26,-0.02 -0.34,-0.16 C-0.42,-0.3 -0.44,-0.6 -0.3,-0.84 ' +
  'C-0.32,-0.72 -0.26,-0.65 -0.16,-0.55 C-0.2,-0.7 -0.1,-0.8 0,-1 Z';
const TEARDROP =
  'M0,-1 C0.22,-0.72 0.38,-0.5 0.36,-0.28 C0.34,-0.08 0.18,0 0,0 ' +
  'C-0.18,0 -0.34,-0.08 -0.36,-0.28 C-0.38,-0.5 -0.22,-0.72 0,-1 Z';

const INK = PALETTE.ink;

function flame(t, size) {
  const { outer, mid, core } = PALETTE.flame;
  // Two incommensurate sines give a flicker that never visibly loops.
  const sx = 1 + 0.05 * Math.sin(t * 9.1) + 0.03 * Math.sin(t * 15.7);
  const sy = 1 + 0.07 * Math.sin(t * 7.3 + 1) + 0.03 * Math.sin(t * 13.1);
  const lean = 3 * Math.sin(t * 4.2);
  const s = 165 * size;
  return `<g id="flame" transform="translate(300,280) rotate(${lean.toFixed(2)}) scale(${sx.toFixed(3)},${sy.toFixed(3)})">
    <path d="${TRIFLAME}" fill="${outer}" transform="scale(${s})"/>
    <path d="${TRIFLAME}" fill="${mid}" transform="translate(0,${-s * 0.04}) scale(${s * 0.68})"/>
    <path d="${TEARDROP}" fill="${core}" transform="translate(0,${-s * 0.05}) scale(${s * 0.34})"/>
  </g>`;
}

function smoke(t, size) {
  const top = 270 - 165 * size * 0.9;
  const puffs = [0, 1, 2].map((i) => {
    const phase = (t * 0.6 + i / 3) % 1; // rises and fades in a loop
    const y = top - 10 - phase * 70;
    const x = 300 + 10 * Math.sin((t + i) * 2);
    const r = 8 + phase * 12;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${PALETTE.smoke}" opacity="${(0.6 * (1 - phase)).toFixed(2)}"/>`;
  });
  return `<g id="smoke">${puffs.join('')}</g>`;
}

function eyes(mood, blink) {
  if (mood === 'gloomy' || mood === 'apology') {
    return `<g id="eyes">
      <path d="M236,420 Q256,436 276,420" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M324,420 Q344,436 364,420" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  const h = mood === 'excited' ? 36 : 30;
  const open = Math.max(0.08, 1 - blink);
  const eh = h * open;
  const y = 419 - eh / 2;
  const pupil = (cx) => (open > 0.35 ? `<circle cx="${cx}" cy="421" r="${mood === 'excited' ? 12 : 10}" fill="${INK}"/>
    <circle cx="${cx + 4}" cy="416" r="3.5" fill="#fff"/>` : '');
  return `<g id="eyes">
    <rect x="236" y="${y.toFixed(1)}" width="40" height="${eh.toFixed(1)}" rx="${Math.min(12, eh / 2).toFixed(1)}" fill="#fff"/>
    <rect x="324" y="${y.toFixed(1)}" width="40" height="${eh.toFixed(1)}" rx="${Math.min(12, eh / 2).toFixed(1)}" fill="#fff"/>
    ${pupil(256)}${pupil(344)}
  </g>`;
}

function brows(mood) {
  const tilt = { excited: 4, calm: 10, tense: -6, gloomy: -10, apology: -12 }[mood] ?? 10;
  const lift = mood === 'excited' ? -14 : mood === 'tense' ? -6 : 0;
  return `<g id="brows">
    <line x1="232" y1="${392 - tilt + lift}" x2="280" y2="${392 + tilt + lift}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <line x1="320" y1="${392 + tilt + lift}" x2="368" y2="${392 - tilt + lift}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
  </g>`;
}

function mouth(shape, mood) {
  const sad = mood === 'gloomy' || mood === 'apology';
  switch (shape) {
    case 'small':
      return `<g id="mouth"><ellipse cx="300" cy="474" rx="16" ry="9" fill="${INK}"/></g>`;
    case 'wide':
      return `<g id="mouth"><path d="M272,464 Q300,506 328,464 Z" fill="${INK}"/>
        <path d="M286,484 Q300,494 314,484" fill="#ff7b8a"/></g>`;
    case 'round':
      return `<g id="mouth"><ellipse cx="300" cy="476" rx="12" ry="15" fill="${INK}"/></g>`;
    default:
      if (sad) return `<g id="mouth"><path d="M282,480 Q300,466 318,480" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
      if (mood === 'excited') return `<g id="mouth"><path d="M278,466 Q300,488 322,466" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
      if (mood === 'tense') return `<g id="mouth"><path d="M282,472 L291,468 L300,474 L309,468 L318,472" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      return `<g id="mouth"><line x1="282" y1="470" x2="318" y2="470" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g>`;
  }
}

function sweat(t) {
  const y = 380 + ((t * 40) % 30);
  return `<path d="M392,${y} q8,14 0,20 q-8,-6 0,-20 Z" fill="#8fd3ff" opacity="0.9"/>`;
}

export function drawWick({ t = 0, mood = 'calm', mouth: m = 'closed', blink = 0, flameSize = 1, up = true } = {}) {
  const c = up ? PALETTE.up : PALETTE.down;
  // Whole-body motion per mood.
  let dx = 0, dy = 0, rot = 0;
  if (mood === 'excited') dy = -Math.abs(Math.sin(t * 6)) * 18;
  if (mood === 'tense') dx = Math.sin(t * 47) * 2.2;
  if (mood === 'calm') dy = Math.sin(t * 1.8) * 3;
  if (mood === 'apology') rot = 14;
  const size = mood === 'gloomy' ? Math.min(flameSize, 0.5) : mood === 'excited' ? Math.max(flameSize, 1.1) : flameSize;
  const armR = mood === 'excited' ? 'M404,470 L452,396' : 'M404,470 L440,410';
  const cardAt = mood === 'excited' ? 'translate(452,390) rotate(-6)' : 'translate(440,404) rotate(-12)';
  const showCard = mood !== 'gloomy' && mood !== 'apology';
  return `<g id="wick" transform="translate(${dx.toFixed(2)},${dy.toFixed(2)}) rotate(${rot},300,700)">
    <line x1="300" y1="650" x2="300" y2="712" stroke="${c.dark}" stroke-width="12" stroke-linecap="round"/>
    <g id="arms">
      <path d="M196,480 L160,540" stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path d="${showCard ? armR : 'M404,480 L440,540'}" stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
      ${showCard ? `<g id="card" transform="${cardAt}">
        <rect x="-20" y="-58" width="44" height="58" rx="6" fill="#fff" stroke="${INK}" stroke-width="4"/>
        <path d="M-8,-30 L0,-20 L14,-42" stroke="${PALETTE.up.dark}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>` : ''}
    </g>
    <g id="body">
      <rect x="196" y="300" width="208" height="355" rx="18" fill="${c.body}"/>
      <rect x="196" y="300" width="208" height="40" rx="18" fill="${c.dark}" opacity="0.35"/>
      <rect x="216" y="352" width="22" height="230" rx="10" fill="${c.light}" opacity="0.5"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<rect x="${196 + k * 26}" y="590" width="26" height="34" fill="${k % 2 ? '#fff' : INK}"/>`).join('')}
    </g>
    <g id="whistle" transform="translate(156,548)">
      <rect x="-20" y="-8" width="34" height="22" rx="8" fill="#d8dde6" stroke="${INK}" stroke-width="4"/>
      <circle cx="4" cy="3" r="4" fill="${INK}"/>
    </g>
    <line x1="300" y1="302" x2="300" y2="270" stroke="${PALETTE.wick}" stroke-width="8" stroke-linecap="round"/>
    ${mood === 'gloomy' || mood === 'apology' ? smoke(t, size) : ''}
    ${flame(t, size)}
    ${brows(mood)}
    ${eyes(mood, blink)}
    ${mouth(m, mood)}
    ${mood === 'tense' ? sweat(t) : ''}
  </g>`;
}

// Blink schedule: deterministic, roughly every 3-4.5 s, 0.16 s long.
export function blinkAt(t) {
  const period = 3.7;
  const local = (t + 0.9 * Math.sin(Math.floor(t / period) * 12.9898)) % period;
  if (local < 0 || local > 0.16) return 0;
  return Math.sin((local / 0.16) * Math.PI);
}
