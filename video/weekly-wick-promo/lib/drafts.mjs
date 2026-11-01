// Weekly Wick design drafts (A/B/C). Each draft returns an SVG <g> for a 600x800 stage.
// Parts are kept in separate groups (body, eyes, mouth, arms, flame) so the chosen
// draft can be turned into a rig without redrawing.

export const PALETTE = {
  up: { body: '#22c47a', dark: '#168a55', light: '#6fe3ac' },
  down: { body: '#ef5350', dark: '#b3302e', light: '#ff9a8f' },
  flame: { outer: '#ff6a1a', mid: '#ffae1f', core: '#fff2a8' },
  ink: '#1b1f2a',
  wick: '#2b2b2b',
  smoke: '#8a8f99',
};

// Teardrop flame in unit space: base (0,0), tip (0,-1).
const TEARDROP =
  'M0,-1 C0.22,-0.72 0.38,-0.5 0.36,-0.28 C0.34,-0.08 0.18,0 0,0 ' +
  'C-0.18,0 -0.34,-0.08 -0.36,-0.28 C-0.38,-0.5 -0.22,-0.72 0,-1 Z';

// Three-tongue flame in unit space.
const TRIFLAME =
  'M0,-1 C0.1,-0.8 0.2,-0.7 0.16,-0.55 C0.26,-0.65 0.32,-0.72 0.3,-0.84 ' +
  'C0.44,-0.6 0.42,-0.3 0.34,-0.16 C0.26,-0.02 0.14,0 0,0 ' +
  'C-0.14,0 -0.26,-0.02 -0.34,-0.16 C-0.42,-0.3 -0.44,-0.6 -0.3,-0.84 ' +
  'C-0.32,-0.72 -0.26,-0.65 -0.16,-0.55 C-0.2,-0.7 -0.1,-0.8 0,-1 Z';

function flame(shape, cx, by, size) {
  const { outer, mid, core } = PALETTE.flame;
  return `<g id="flame" transform="translate(${cx},${by})">
    <path d="${shape}" fill="${outer}" transform="scale(${size})"/>
    <path d="${shape}" fill="${mid}" transform="translate(0,${-size * 0.04}) scale(${size * 0.68})"/>
    <path d="${TEARDROP}" fill="${core}" transform="translate(0,${-size * 0.05}) scale(${size * 0.34})"/>
  </g>`;
}

function smoke(cx, y) {
  const c = PALETTE.smoke;
  return `<g id="smoke" opacity="0.55">
    <circle cx="${cx + 6}" cy="${y - 10}" r="10" fill="${c}"/>
    <circle cx="${cx - 8}" cy="${y - 34}" r="13" fill="${c}"/>
    <circle cx="${cx + 10}" cy="${y - 62}" r="16" fill="${c}"/>
  </g>`;
}

function roundEyes(lx, rx, y, mood, size = 1) {
  const ink = PALETTE.ink;
  const w = 24 * size, h = 28 * size, p = 12 * size;
  const eye = (x) => {
    if (mood === 'gloomy') {
      return `<path d="M${x - w},${y} Q${x},${y + h * 0.7} ${x + w},${y}" stroke="${ink}" stroke-width="${6 * size}" fill="none" stroke-linecap="round"/>`;
    }
    return `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${h}" fill="#fff"/>
      <circle cx="${x}" cy="${y + 4 * size}" r="${p}" fill="${ink}"/>
      <circle cx="${x + 5 * size}" cy="${y - 2 * size}" r="${4 * size}" fill="#fff"/>`;
  };
  return `<g id="eyes">${eye(lx)}${eye(rx)}</g>`;
}

function mouth(cx, y, mood, size = 1) {
  const ink = PALETTE.ink;
  const w = 20 * size;
  if (mood === 'excited') {
    return `<g id="mouth"><path d="M${cx - w * 1.1},${y} Q${cx},${y + 34 * size} ${cx + w * 1.1},${y} Z" fill="${ink}"/>
      <path d="M${cx - w * 0.5},${y + 16 * size} Q${cx},${y + 26 * size} ${cx + w * 0.5},${y + 16 * size}" fill="#ff7b8a"/></g>`;
  }
  if (mood === 'gloomy') {
    return `<g id="mouth"><path d="M${cx - w * 0.8},${y + 12 * size} Q${cx},${y - 4 * size} ${cx + w * 0.8},${y + 12 * size}" stroke="${ink}" stroke-width="${6 * size}" fill="none" stroke-linecap="round"/></g>`;
  }
  return `<g id="mouth"><path d="M${cx - w},${y} Q${cx},${y + 18 * size} ${cx + w},${y}" stroke="${ink}" stroke-width="${6 * size}" fill="none" stroke-linecap="round"/></g>`;
}

// A — "Candle Buddy": soft rounded candle, teardrop flame, big friendly eyes.
export function draftA({ up = true, mood = 'calm', flameSize = 1 } = {}) {
  const c = up ? PALETTE.up : PALETTE.down;
  const fs = 150 * flameSize;
  return `<g id="wick-a">
    <line x1="300" y1="640" x2="300" y2="712" stroke="${c.dark}" stroke-width="12" stroke-linecap="round"/>
    <g id="arms">
      <path d="M206,470 Q170,490 162,530" stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path d="M394,470 Q430,490 438,530" stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
    </g>
    <g id="body">
      <rect x="200" y="300" width="200" height="345" rx="40" fill="${c.body}"/>
      <rect x="222" y="322" width="26" height="200" rx="13" fill="${c.light}" opacity="0.6"/>
    </g>
    <line id="wick" x1="300" y1="302" x2="300" y2="268" stroke="${PALETTE.wick}" stroke-width="8" stroke-linecap="round"/>
    ${mood === 'gloomy' ? smoke(300, 268 - fs * 0.9) : ''}
    ${flame(TEARDROP, 300, 278, fs)}
    ${roundEyes(258, 342, 408, mood)}
    <ellipse cx="232" cy="460" rx="16" ry="9" fill="#ff8fa3" opacity="0.45"/>
    <ellipse cx="368" cy="460" rx="16" ry="9" fill="#ff8fa3" opacity="0.45"/>
    ${mouth(300, 470, mood)}
  </g>`;
}

// B — "The Judge": squarer candle, stern brows, whistle; the referee who rules pass/fail.
export function draftB({ up = true, mood = 'calm', flameSize = 1 } = {}) {
  const c = up ? PALETTE.up : PALETTE.down;
  const ink = PALETTE.ink;
  const fs = 165 * flameSize;
  const browTilt = mood === 'gloomy' ? -10 : 10;
  const eyes = mood === 'gloomy'
    ? roundEyes(256, 344, 420, 'gloomy', 0.9)
    : `<g id="eyes">
        <rect x="236" y="404" width="40" height="30" rx="12" fill="#fff"/>
        <rect x="324" y="404" width="40" height="30" rx="12" fill="#fff"/>
        <circle cx="258" cy="421" r="10" fill="${ink}"/>
        <circle cx="346" cy="421" r="10" fill="${ink}"/>
      </g>`;
  return `<g id="wick-b">
    <line x1="300" y1="650" x2="300" y2="712" stroke="${c.dark}" stroke-width="12" stroke-linecap="round"/>
    <g id="arms">
      <path d="M196,480 L160,540" stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
      <path d="M404,470 L440,410" stroke="${c.dark}" stroke-width="20" fill="none" stroke-linecap="round"/>
      <g id="card" transform="translate(440,404) rotate(-12)">
        <rect x="-20" y="-58" width="44" height="58" rx="6" fill="#fff" stroke="${ink}" stroke-width="4"/>
        <path d="M-8,-30 L0,-20 L14,-42" stroke="${PALETTE.up.dark}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    </g>
    <g id="body">
      <rect x="196" y="300" width="208" height="355" rx="18" fill="${c.body}"/>
      <rect x="196" y="300" width="208" height="40" rx="18" fill="${c.dark}" opacity="0.35"/>
      <rect x="216" y="352" width="22" height="230" rx="10" fill="${c.light}" opacity="0.5"/>
    </g>
    <g id="stripes">
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `<rect x="${196 + k * 26}" y="590" width="26" height="34" fill="${k % 2 ? '#fff' : ink}"/>`).join('')}
    </g>
    <g id="whistle" transform="translate(156,548)">
      <rect x="-20" y="-8" width="34" height="22" rx="8" fill="#d8dde6" stroke="${ink}" stroke-width="4"/>
      <circle cx="4" cy="3" r="4" fill="${ink}"/>
    </g>
    <line id="wick" x1="300" y1="302" x2="300" y2="270" stroke="${PALETTE.wick}" stroke-width="8" stroke-linecap="round"/>
    ${mood === 'gloomy' ? smoke(300, 270 - fs * 0.9) : ''}
    ${flame(TRIFLAME, 300, 280, fs)}
    <g id="brows">
      <line x1="232" y1="${392 - browTilt}" x2="280" y2="${392 + browTilt}" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
      <line x1="320" y1="${392 + browTilt}" x2="368" y2="${392 - browTilt}" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
    </g>
    ${eyes}
    ${mood === 'excited' ? mouth(300, 462, 'excited', 0.9) : mood === 'gloomy' ? mouth(300, 462, 'gloomy', 0.9)
      : `<g id="mouth"><line x1="282" y1="470" x2="318" y2="470" stroke="${ink}" stroke-width="6" stroke-linecap="round"/></g>`}
  </g>`;
}

// C — "Ember Head": the flame is the head. A fixed glowing core carries the face,
// the outer flame grows or shrinks with the weekly count, the candle is a small torso.
export function draftC({ up = true, mood = 'calm', flameSize = 1 } = {}) {
  const c = up ? PALETTE.up : PALETTE.down;
  const { outer, mid, core } = PALETTE.flame;
  const fs = 220 + 120 * flameSize;
  return `<g id="wick-c">
    <g id="legs">
      <line x1="270" y1="640" x2="262" y2="700" stroke="${c.dark}" stroke-width="16" stroke-linecap="round"/>
      <line x1="330" y1="640" x2="338" y2="700" stroke="${c.dark}" stroke-width="16" stroke-linecap="round"/>
    </g>
    <g id="arms">
      <path d="M236,560 Q204,580 198,612" stroke="${c.dark}" stroke-width="16" fill="none" stroke-linecap="round"/>
      <path d="M364,560 Q396,580 402,612" stroke="${c.dark}" stroke-width="16" fill="none" stroke-linecap="round"/>
    </g>
    <g id="body">
      <rect x="232" y="500" width="136" height="150" rx="28" fill="${c.body}"/>
      <rect x="248" y="514" width="18" height="96" rx="9" fill="${c.light}" opacity="0.6"/>
    </g>
    ${mood === 'gloomy' ? smoke(300, 520 - fs * 0.95) : ''}
    <g id="flame" transform="translate(300,520)">
      <path d="${TRIFLAME}" fill="${outer}" transform="scale(${fs})"/>
      <path d="${TEARDROP}" fill="${mid}" transform="translate(0,-6) scale(${fs * 0.7})"/>
    </g>
    <circle id="core" cx="300" cy="420" r="92" fill="${core}"/>
    ${roundEyes(266, 334, 410, mood, 0.85)}
    ${mouth(300, 456, mood, 0.8)}
  </g>`;
}

export const DRAFTS = { A: draftA, B: draftB, C: draftC };
