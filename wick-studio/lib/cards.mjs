// Image cards (handoff §3): verdict / results / race in two style sets.
//   A "Scoreboard": dark navy, filled stamps — matches the video.
//   B "Judges' sheet": cream ruled paper, worn ink stamps — stands out in a dark feed.
// Layout, margins and Wick's spot are fixed per size so the account is recognisable;
// only the content and Wick's mood change week to week.
import { drawWick } from '../characters/rig.mjs';
import { rng } from './motion.mjs';
import { dataUri } from './scene.mjs';
import { esc, textWidth, wrap } from './text.mjs';

export const SIZES = { portrait: { W: 1080, H: 1350 }, wide: { W: 1600, H: 900 } };
const DISCLAIMER = 'Automated account · Not financial advice';

const STYLES = {
  A: { name: 'Scoreboard', bg: '#10141f', fg: '#eef1f7', muted: '#9aa3b5', panel: '#1a2030', rule: '#2a3142', band: '#1a2030', bandFg: '#eef1f7', ink: false },
  B: { name: "Judges' sheet", bg: '#f3ede1', fg: '#1b1f2a', muted: '#6b6457', panel: '#e9e0cd', rule: '#ddd2bd', band: '#1b1f2a', bandFg: '#f3ede1', ink: true },
};
const STAMP_COLORS = {
  A: { QUALIFIED: '#22c47a', VANISHED: '#8a93a6', 'EARNINGS WEEK': '#ff6a3d', 'TAKE-PROFIT': '#22c47a', 'STOPPED OUT': '#ef5350', 'TRAILING EXIT': '#4c8dff', CANDIDATES: '#ffb020', 'BEAT SPY': '#22c47a', 'TRAILED SPY': '#ef5350' },
  B: { QUALIFIED: '#1f8a54', VANISHED: '#6b6457', 'EARNINGS WEEK': '#d9631e', 'TAKE-PROFIT': '#1f8a54', 'STOPPED OUT': '#c0392b', 'TRAILING EXIT': '#2763c4', CANDIDATES: '#b7791f', 'BEAT SPY': '#1f8a54', 'TRAILED SPY': '#c0392b' },
};
const STAMP_COL = 330; // right-hand column that holds a row's stamps
const HEADER = { verdict: 'WEEKLY VERDICT', results: 'EXIT REPORT', race: 'CANDIDATE RACE' };

let uid = 0;
function stamp(style, label, x, y, size, rot = -7) {
  const color = STAMP_COLORS[style][label] ?? '#888';
  const w = textWidth(label, size, 0.64) + size * 1.4, h = size * 1.9;
  const text = `<text x="0" y="${(size * 0.36).toFixed(1)}" font-family="Inter" font-size="${size}" font-weight="900" text-anchor="middle" letter-spacing="${(size * 0.04).toFixed(1)}"`;
  if (!STYLES[style].ink) {
    return { w, h, svg: `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${size * 0.3}" fill="${color}"/>
      <rect x="${-w / 2 + 6}" y="${-h / 2 + 6}" width="${w - 12}" height="${h - 12}" rx="${size * 0.22}" fill="none" stroke="#000" stroke-opacity="0.25" stroke-width="3"/>
      ${text} fill="#10141f">${esc(label)}</text></g>` };
  }
  // Worn rubber-stamp ink: double border + text, punched with seeded specks.
  const id = `wear${uid++}`;
  const r = rng(label.length * 97 + Math.round(x));
  let specks = '';
  for (let i = 0; i < 70; i++) specks += `<circle cx="${((r() - 0.5) * w).toFixed(1)}" cy="${((r() - 0.5) * h).toFixed(1)}" r="${(0.8 + r() * 2.6).toFixed(1)}" fill="#000"/>`;
  return { w, h, svg: `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot})">
    <mask id="${id}"><rect x="${-w}" y="${-h}" width="${w * 2}" height="${h * 2}" fill="#fff"/>${specks}</mask>
    <g mask="url(#${id})" fill-opacity="0.9" stroke-opacity="0.9">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${size * 0.25}" fill="none" stroke="${color}" stroke-width="${(size * 0.12).toFixed(1)}"/>
      <rect x="${-w / 2 + size * 0.22}" y="${-h / 2 + size * 0.22}" width="${w - size * 0.44}" height="${h - size * 0.44}" rx="${size * 0.15}" fill="none" stroke="${color}" stroke-width="${(size * 0.05).toFixed(1)}"/>
      ${text} fill="${color}">${esc(label)}</text>
    </g></g>` };
}

// Top badge: CONFIRMED on the Saturday verdict, GRADED on Monday's exit report
// (closed trades, nothing left to confirm), LIVE on weekday cards.
function statusPill(style, type, x, y) {
  const kind = type === 'weekly_confirm' ? 'confirmed' : type === 'results' ? 'graded' : 'live';
  const label = { confirmed: 'CONFIRMED · Weekly close', graded: 'GRADED · Exit report', live: 'LIVE · Confirms at Friday close' }[kind];
  const bg = { confirmed: '#22c47a', graded: '#7fb2ff', live: '#ffb020' }[kind];
  const live = kind === 'live';
  const size = 24, padX = 18, h = 44, w = textWidth(label, size, 0.62) + padX * 2 + (live ? 22 : 0);
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${bg}"/>
    ${live ? `<circle cx="${x + padX + 6}" cy="${y + h / 2}" r="7" fill="#e5383b"/>` : ''}
    <text x="${x + padX + (live ? 22 : 0)}" y="${y + h / 2 + 9}" font-family="Inter" font-size="${size}" font-weight="800" fill="#10141f">${label}</text></g>`;
}

function layout(size) {
  const { W, H } = SIZES[size];
  return size === 'portrait'
    ? { W, H, pad: 70, band: 118, titleY: 250, titleSize: 84, titleMax: 940, subSize: 38, bodyY: 430, bodyW: 940, wick: { x: 900, y: 1250, s: 0.48 }, footY: 1318, rowSafeW: 760 }
    : { W, H, pad: 70, band: 100, titleY: 210, titleSize: 76, titleMax: 1060, subSize: 34, bodyY: 360, bodyW: 1080, wick: { x: 1390, y: 840, s: 0.62 }, footY: 876, rowSafeW: 1060 };
}

function frame(style, L, card, handle) {
  const S = STYLES[style];
  let s = `<rect width="${L.W}" height="${L.H}" fill="${S.bg}"/>`;
  if (S.ink) {
    for (let y = L.band + 60; y < L.H - 50; y += 64) s += `<line x1="0" y1="${y}" x2="${L.W}" y2="${y}" stroke="${S.rule}" stroke-width="2"/>`;
    s += `<line x1="${L.pad - 24}" y1="${L.band}" x2="${L.pad - 24}" y2="${L.H - 50}" stroke="#d98b80" stroke-width="3"/>`;
  }
  s += `<rect width="${L.W}" height="${L.band}" fill="${S.band}"/>`;
  s += statusPill(style, card.type, L.pad, (L.band - 44) / 2);
  s += `<text x="${L.W - L.pad}" y="${L.band / 2 - 4}" font-family="Inter" font-size="30" font-weight="900" fill="${S.bandFg}" text-anchor="end" letter-spacing="6">WEEKLY WICK</text>`;
  s += `<text x="${L.W - L.pad}" y="${L.band / 2 + 28}" font-family="Inter" font-size="20" font-weight="700" fill="${S.bandFg}" fill-opacity="0.7" text-anchor="end" letter-spacing="4">${HEADER[card.template]}</text>`;
  // Title + subtitle
  let ts = L.titleSize, tl = wrap(card.title, ts, L.titleMax, 0.6);
  while (ts > 62 && (tl.length > 2 || (tl.length === 2 && !tl[1].includes(' ')))) { ts -= 4; tl = wrap(card.title, ts, L.titleMax, 0.6); }
  tl = tl.slice(0, 2);
  tl.forEach((line, i) => { s += `<text x="${L.pad}" y="${L.titleY + i * ts * 1.05}" font-family="Inter" font-size="${ts}" font-weight="900" fill="${S.fg}">${esc(line)}</text>`; });
  const subY = L.titleY + (tl.length - 1) * ts * 1.05 + L.subSize * 1.6;
  if (card.subtitle) s += `<text x="${L.pad}" y="${subY}" font-family="Inter" font-size="${L.subSize}" font-weight="600" fill="${S.muted}">${esc(card.subtitle)}</text>`;
  // Footer
  s += `<text x="${L.pad}" y="${L.footY}" font-family="Inter" font-size="22" font-weight="600" fill="${S.muted}">${DISCLAIMER}</text>`;
  s += `<text x="${L.W - L.pad}" y="${L.footY}" font-family="Inter" font-size="22" font-weight="800" fill="${S.muted}" text-anchor="end">${esc(handle)}</text>`;
  return { svg: s, bodyY: Math.max(L.bodyY, subY + 60) };
}

function wick(L, card) {
  return `<g transform="translate(${L.wick.x},${L.wick.y}) scale(${L.wick.s}) translate(-300,-712)">${drawWick({ t: 0.35, mood: card.mood, mouth: 'closed', blink: 0, flameSize: card.flameSize, up: card.up })}</g>`;
}

// Portrait stacks the summary above the rows; wide puts the summary in a left column
// and the rows beside it, so nothing runs past the footer.
function columns(L, y0, summaryH) {
  const split = L.W > L.H;
  return split
    ? { sx: L.pad, sy: y0, sw: 440, rx: L.pad + 500, ry: y0 - 10, rw: 700 }
    : { sx: L.pad, sy: y0, sw: L.bodyW, rx: L.pad, ry: y0 + summaryH, rw: L.rowSafeW };
}

// Big pass/candidate count with its stamp beside it (portrait) or under it (wide column).
function bigCount(style, x, y, n, label, sub, stacked = false) {
  const S = STYLES[style];
  const numW = textWidth(String(n), 190, 0.66);
  const stampW = textWidth(label, 46, 0.64) + 64;
  let s = `<text x="${x}" y="${y + 160}" font-family="Inter" font-size="190" font-weight="900" fill="${S.fg}">${n}</text>`;
  if (stacked) {
    s += stamp(style, label, x + stampW / 2 + 6, y + 235, 46).svg;
    if (sub) s += `<text x="${x}" y="${y + 345}" font-family="Inter" font-size="34" font-weight="700" fill="${S.muted}">${esc(sub)}</text>`;
    return s;
  }
  s += stamp(style, label, x + numW + 50 + stampW / 2 - 2, y + 64, 46).svg;
  if (sub) s += `<text x="${x + numW + 56}" y="${y + 162}" font-family="Inter" font-size="34" font-weight="700" fill="${S.muted}">${esc(sub)}</text>`;
  return s;
}

function chartStrip(x, y, w, h, path) {
  return `<clipPath id="cc"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20"/></clipPath>
    <image href="${dataUri(path)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cc)"/>
    <rect x="${x + w - 270}" y="${y + h - 48}" width="256" height="34" rx="8" fill="#000" fill-opacity="0.75"/>
    <text x="${x + w - 142}" y="${y + h - 24}" font-family="Inter" font-size="20" font-weight="700" fill="#fff" text-anchor="middle">Charts by TradingView</text>`;
}

function verdictBody(style, L, card, y0) {
  const S = STYLES[style];
  const C = columns(L, y0, 230);
  let s = bigCount(style, C.sx, C.sy, card.stats.qualified, 'QUALIFIED', 'this week', L.W > L.H);
  let y = C.ry;
  if (card.chart) {
    // Portrait: strip under the count. Wide: under the count in the left column.
    if (L.W > L.H) s += chartStrip(C.sx, C.sy + 350, C.sw, 150, card.chart);
    else { s += chartStrip(C.rx, y, L.bodyW, 300, card.chart); y += 330; }
  }
  for (const row of card.rows) {
    s += `<line x1="${C.rx}" y1="${y}" x2="${C.rx + C.rw}" y2="${y}" stroke="${S.rule}" stroke-width="3"/>`;
    s += `<text x="${C.rx}" y="${y + 78}" font-family="Inter" font-size="68" font-weight="900" fill="${S.fg}">$${esc(row.symbol)}</text>`;
    if (row.company) s += `<text x="${C.rx}" y="${y + 120}" font-family="Inter" font-size="30" font-weight="700" fill="${S.muted}">${esc(row.company)}</text>`;
    let ry = y + 120;
    if (row.blurb) {
      const bl = wrap(row.blurb, 32, C.rw - STAMP_COL - 20, 0.55).slice(0, 4);
      bl.forEach((line, i) => {
        s += `<text x="${C.rx}" y="${ry + 46 + i * 40}" font-family="Inter" font-size="32" font-weight="600" fill="${S.fg}">${esc(line)}</text>`;
      });
      ry += 46 + (bl.length - 1) * 40;
    }
    const sx = C.rx + C.rw - STAMP_COL / 2;
    s += stamp(style, row.stamp, sx, y + 56, 34, -8).svg;
    if (row.earnings) s += stamp(style, 'EARNINGS WEEK', sx, y + 126, 24, -4).svg;
    y = ry + 40;
  }
  return s;
}

function resultsBody(style, L, card, y0) {
  const S = STYLES[style];
  const sc = card.stats.scorecard;
  const C = columns(L, y0, sc ? 140 : 0);
  let s = '';
  if (sc) {
    const split = L.W > L.H;
    s += `<rect x="${C.sx}" y="${C.sy}" width="${C.sw}" height="${split ? 200 : 110}" rx="18" fill="${S.panel}"/>
      <text x="${C.sx + 30}" y="${C.sy + 45}" font-family="Inter" font-size="24" font-weight="800" fill="${S.muted}" letter-spacing="3">MONTH SO FAR</text>`;
    const parts = [`${sc.wins} W · ${sc.losses} L`, sc.beatSpy != null ? `${sc.beatSpy} beat SPY` : null].filter(Boolean);
    if (split) parts.forEach((p, i) => { s += `<text x="${C.sx + 30}" y="${C.sy + 105 + i * 60}" font-family="Inter" font-size="46" font-weight="900" fill="${S.fg}">${p}</text>`; });
    else s += `<text x="${C.sx + 30}" y="${C.sy + 90}" font-family="Inter" font-size="40" font-weight="900" fill="${S.fg}">${parts.join(' · ')}</text>`;
  }
  let y = C.ry;
  for (const row of card.rows) {
    s += `<line x1="${C.rx}" y1="${y}" x2="${C.rx + C.rw}" y2="${y}" stroke="${S.rule}" stroke-width="3"/>`;
    s += `<text x="${C.rx}" y="${y + 74}" font-family="Inter" font-size="60" font-weight="900" fill="${S.fg}">$${esc(row.symbol)}</text>`;
    if (row.company) s += `<text x="${C.rx}" y="${y + 112}" font-family="Inter" font-size="28" font-weight="700" fill="${S.muted}">${esc(row.company)}</text>`;
    const sx = C.rx + C.rw - STAMP_COL / 2;
    if (row.stamp) s += stamp(style, row.stamp, sx, y + 52, 32, -7).svg;
    if (row.vsSpy) s += stamp(style, row.vsSpy, sx, y + 114, 22, -3).svg;
    y += 150;
  }
  return s;
}

function raceBody(style, L, card, y0) {
  const S = STYLES[style];
  const C = columns(L, y0, 240);
  let s = bigCount(style, C.sx, C.sy, card.stats.candidates, 'CANDIDATES', 'still in the race', L.W > L.H);
  let y = C.ry + (L.W > L.H ? 40 : 0);
  s += `<text x="${C.rx}" y="${y + 30}" font-family="Inter" font-size="26" font-weight="800" fill="${S.muted}" letter-spacing="3">MOST COMMON TAGS</text>`;
  y += 60;
  let x = C.rx;
  for (const tag of card.stats.tags) {
    const w = textWidth(tag, 36, 0.6) + 50;
    if (x + w > C.rx + C.rw) { x = C.rx; y += 80; }
    s += `<rect x="${x}" y="${y}" width="${w}" height="62" rx="31" fill="${S.panel}" stroke="${S.rule}" stroke-width="2"/>
      <text x="${x + w / 2}" y="${y + 43}" font-family="Inter" font-size="36" font-weight="800" fill="${S.fg}" text-anchor="middle">${esc(tag)}</text>`;
    x += w + 16;
  }
  y += 130;
  s += `<text x="${C.rx}" y="${y}" font-family="Inter" font-size="40" font-weight="800" fill="${S.fg}">Nothing counts until the Friday close.</text>`;
  return s;
}

export function renderCardSvg(card, { style = 'A', size = 'portrait', handle = '@Aistockpo' } = {}) {
  const L = layout(size);
  const f = frame(style, L, card, handle);
  const body = { verdict: verdictBody, results: resultsBody, race: raceBody }[card.template](style, L, card, f.bodyY);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">${f.svg}${body}${wick(L, card)}</svg>`;
}

export const STYLE_NAMES = Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, v.name]));
