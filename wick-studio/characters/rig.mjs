// Weekly Wick rig — draft A "Candle Buddy" (chosen 2026-10-25).
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

const TEARDROP =
  'M0,-1 C0.22,-0.72 0.38,-0.5 0.36,-0.28 C0.34,-0.08 0.18,0 0,0 ' +
  'C-0.18,0 -0.34,-0.08 -0.36,-0.28 C-0.38,-0.5 -0.22,-0.72 0,-1 Z';

const INK = PALETTE.ink;
const SAD = new Set(['gloomy', 'apology']);
const FRONT_ARMS = new Set(['tense', 'apology']); // hands held in front of the body

function flame(t, size) {
  const { outer, mid, core } = PALETTE.flame;
  // Two incommensurate sines give a flicker that never visibly loops.
  const sx = 1 + 0.05 * Math.sin(t * 9.1) + 0.03 * Math.sin(t * 15.7);
  const sy = 1 + 0.07 * Math.sin(t * 7.3 + 1) + 0.03 * Math.sin(t * 13.1);
  const lean = 4 * Math.sin(t * 4.2);
  const s = 150 * size;
  return `<g id="flame" transform="translate(300,278) rotate(${lean.toFixed(2)}) scale(${sx.toFixed(3)},${sy.toFixed(3)})">
    <path d="${TEARDROP}" fill="${outer}" transform="scale(${s})"/>
    <path d="${TEARDROP}" fill="${mid}" transform="translate(0,${-s * 0.04}) scale(${s * 0.68})"/>
    <path d="${TEARDROP}" fill="${core}" transform="translate(0,${-s * 0.05}) scale(${s * 0.34})"/>
  </g>`;
}

function smoke(t, size) {
  const top = 268 - 150 * size * 0.9;
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
  if (SAD.has(mood)) {
    return `<g id="eyes">
      <path d="M236,412 Q258,430 280,412" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M320,412 Q342,430 364,412" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
    </g>`;
  }
  const ry = (mood === 'excited' ? 32 : 28) * Math.max(0.08, 1 - blink);
  const pr = mood === 'tense' ? 8 : mood === 'excited' ? 14 : 12;
  const one = (x) => `<ellipse cx="${x}" cy="408" rx="${mood === 'excited' ? 27 : 24}" ry="${ry.toFixed(1)}" fill="#fff"/>
    ${ry > 10 ? `<circle cx="${x}" cy="412" r="${pr}" fill="${INK}"/><circle cx="${x + 5}" cy="406" r="4" fill="#fff"/>` : ''}
    ${ry > 10 && mood === 'excited' ? `<circle cx="${x - 6}" cy="418" r="2.5" fill="#fff"/>` : ''}`;
  return `<g id="eyes">${one(258)}${one(342)}</g>`;
}

// Brows only appear when the face needs them; calm stays clean like the design sheet.
function brows(mood) {
  if (mood === 'calm') return '';
  const [inner, outer] = { excited: [366, 362], tense: [368, 376], gloomy: [366, 376], apology: [364, 378] }[mood];
  const sw = mood === 'excited' ? 6 : 7;
  return `<g id="brows">
    <path d="M238,${outer} Q256,${Math.min(inner, outer) - 6} 276,${inner}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
    <path d="M324,${inner} Q344,${Math.min(inner, outer) - 6} 362,${outer}" stroke="${INK}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
  </g>`;
}

function mouth(shape, mood) {
  switch (shape) {
    case 'small':
      return `<g id="mouth"><ellipse cx="300" cy="474" rx="15" ry="9" fill="${INK}"/></g>`;
    case 'wide':
      return `<g id="mouth"><path d="M276,466 Q300,506 324,466 Z" fill="${INK}"/>
        <path d="M288,486 Q300,496 312,486" fill="#ff7b8a"/></g>`;
    case 'round':
      return `<g id="mouth"><ellipse cx="300" cy="476" rx="12" ry="15" fill="${INK}"/></g>`;
    default:
      if (SAD.has(mood)) return `<g id="mouth"><path d="M284,482 Q300,468 316,482" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
      if (mood === 'excited') return `<g id="mouth"><path d="M278,468 Q300,500 322,468 Z" fill="${INK}"/></g>`;
      if (mood === 'tense') return `<g id="mouth"><path d="M282,476 L291,471 L300,477 L309,471 L318,476" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      return `<g id="mouth"><path d="M280,470 Q300,488 320,470" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  }
}

function arms(mood, t, c) {
  const stroke = `stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"`;
  if (mood === 'excited') {
    const wave = 6 * Math.sin(t * 10);
    return `<g id="arms"><path d="M206,460 Q170,430 ${158 + wave},${392 - wave}" ${stroke}/>
      <path d="M394,460 Q430,430 ${442 - wave},${392 - wave}" ${stroke}/></g>`;
  }
  if (mood === 'tense') {
    return `<g id="arms"><path d="M206,480 Q186,500 214,522" ${stroke}/><path d="M394,480 Q414,500 386,522" ${stroke}/></g>`;
  }
  if (mood === 'apology') {
    return `<g id="arms"><path d="M206,470 Q200,520 240,552" ${stroke}/><path d="M394,470 Q400,520 360,552" ${stroke}/></g>`;
  }
  if (mood === 'gloomy') {
    return `<g id="arms"><path d="M206,480 Q192,520 190,560" ${stroke}/><path d="M394,480 Q408,520 410,560" ${stroke}/></g>`;
  }
  return `<g id="arms"><path d="M206,470 Q170,490 162,530" ${stroke}/><path d="M394,470 Q430,490 438,530" ${stroke}/></g>`;
}

function sweat(t) {
  const y = 372 + ((t * 40) % 30);
  return `<path d="M388,${y.toFixed(1)} q9,15 0,21 q-9,-6 0,-21 Z" fill="#8fd3ff" opacity="0.9"/>`;
}

export function drawWick({ t = 0, mood = 'calm', mouth: m = 'closed', blink = 0, flameSize = 1, up = true } = {}) {
  const c = up ? PALETTE.up : PALETTE.down;
  // Whole-body motion per mood.
  let dx = 0, dy = 0, rot = 0;
  if (mood === 'excited') dy = -Math.abs(Math.sin(t * 6)) * 18;
  if (mood === 'tense') dx = Math.sin(t * 47) * 2.2;
  if (mood === 'calm') dy = Math.sin(t * 1.8) * 3;
  if (mood === 'apology') rot = 14;
  const size = mood === 'gloomy' || mood === 'apology' ? Math.min(flameSize, 0.5) : mood === 'excited' ? Math.max(flameSize, 1.1) : flameSize;
  return `<g id="wick" transform="translate(${dx.toFixed(2)},${dy.toFixed(2)}) rotate(${rot},300,712)">
    <line x1="300" y1="640" x2="300" y2="712" stroke="${c.dark}" stroke-width="12" stroke-linecap="round"/>
    ${FRONT_ARMS.has(mood) ? '' : arms(mood, t, c)}
    <g id="body">
      <rect x="200" y="300" width="200" height="345" rx="40" fill="${c.body}"/>
      <rect x="222" y="322" width="26" height="200" rx="13" fill="${c.light}" opacity="0.6"/>
    </g>
    ${FRONT_ARMS.has(mood) ? arms(mood, t, c) : ''}
    <line id="wick-top" x1="300" y1="302" x2="300" y2="268" stroke="${PALETTE.wick}" stroke-width="8" stroke-linecap="round"/>
    ${SAD.has(mood) ? smoke(t, size) : ''}
    ${flame(t, size)}
    ${brows(mood)}
    ${eyes(mood, blink)}
    <ellipse cx="232" cy="460" rx="16" ry="9" fill="#ff8fa3" opacity="${mood === 'excited' ? 0.7 : 0.45}"/>
    <ellipse cx="368" cy="460" rx="16" ry="9" fill="#ff8fa3" opacity="${mood === 'excited' ? 0.7 : 0.45}"/>
    ${mouth(m, mood)}
    ${mood === 'tense' || mood === 'apology' ? sweat(t) : ''}
  </g>`;
}

// Blink schedule: deterministic, roughly every 3-4.5 s, 0.16 s long.
export function blinkAt(t) {
  const period = 3.7;
  const local = (t + 0.9 * Math.sin(Math.floor(t / period) * 12.9898)) % period;
  if (local < 0 || local > 0.16) return 0;
  return Math.sin((local / 0.16) * Math.PI);
}
