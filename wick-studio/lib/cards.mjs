// Image cards (handoff §3): verdict / results / race / track / anatomy in two style sets.
//   A "Scoreboard": dark navy, filled stamps — matches the video.
//   B "Judges' sheet": cream ruled paper, worn ink stamps — stands out in a dark feed.
// Layout, margins and Wick's spot are fixed per size so the account is recognisable;
// only the content and Wick's mood change week to week.
import { drawWick } from '../characters/rig.mjs';
import { rng } from './motion.mjs';
import { dataUri } from './scene.mjs';
import { esc, textWidth, wrap } from './text.mjs';

export const SIZES = { portrait: { W: 1080, H: 1350 }, wide: { W: 1600, H: 900 } };
const DISCLAIMER = 'Not financial advice';

const STYLES = {
  A: { name: 'Scoreboard', bg: '#10141f', fg: '#eef1f7', muted: '#9aa3b5', panel: '#1a2030', rule: '#2a3142', band: '#1a2030', bandFg: '#eef1f7', ink: false },
  B: { name: "Judges' sheet", bg: '#f3ede1', fg: '#1b1f2a', muted: '#6b6457', panel: '#e9e0cd', rule: '#ddd2bd', band: '#1b1f2a', bandFg: '#f3ede1', ink: true },
};
const STAMP_COLORS = {
  A: { QUALIFIED: '#22c47a', VANISHED: '#8a93a6', 'EARNINGS WEEK': '#ff6a3d', 'TAKE-PROFIT': '#22c47a', 'FIRST TARGET': '#2bb3a3', 'SECOND TARGET': '#22c47a', 'STOPPED OUT': '#ef5350', 'TRAILING EXIT': '#4c8dff', CANDIDATES: '#ffb020', 'BEAT SPY': '#22c47a', 'TRAILED SPY': '#ef5350', 'STILL OPEN': '#ffb020' },
  B: { QUALIFIED: '#1f8a54', VANISHED: '#6b6457', 'EARNINGS WEEK': '#d9631e', 'TAKE-PROFIT': '#1f8a54', 'FIRST TARGET': '#1f7f74', 'SECOND TARGET': '#1f8a54', 'STOPPED OUT': '#c0392b', 'TRAILING EXIT': '#2763c4', CANDIDATES: '#b7791f', 'BEAT SPY': '#1f8a54', 'TRAILED SPY': '#c0392b', 'STILL OPEN': '#b7791f' },
};
const STAMP_COL = 330; // right-hand column that holds a row's stamps
const HEADER = { verdict: 'WEEKLY VERDICT', results: 'EXIT REPORT', race: 'CANDIDATE RACE', track: 'PICK TRACKER', anatomy: 'SIGNAL ANATOMY' };

let uid = 0;
export function stamp(style, label, x, y, size, rot = -7) {
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
// (closed trades, nothing left to confirm), TRACKED on Tuesday's free-pick follow-up,
// LIVE on weekday race cards.
function statusPill(style, type, x, y) {
  const kind = type === 'weekly_confirm' ? 'confirmed' : type === 'results' ? 'graded' : type === 'track' ? 'tracked' : type === 'anatomy' ? 'explainer' : 'live';
  const label = { confirmed: 'CONFIRMED · Weekly close', graded: 'GRADED · Exit report', tracked: 'TRACKED · Every free pick', explainer: 'HOW IT WORKS · Illustration', live: 'LIVE · Confirms at Friday close' }[kind];
  const bg = { confirmed: '#22c47a', graded: '#7fb2ff', tracked: '#7fb2ff', explainer: '#d9d2c3', live: '#ffb020' }[kind];
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
  if (card.subtitle) {
    // Shrink a long subtitle to stay on one line (Inter SemiBold ≈ 0.53 em per character).
    const subSize = Math.max(28, Math.min(L.subSize, L.titleMax / (card.subtitle.length * 0.53)));
    s += `<text x="${L.pad}" y="${subY}" font-family="Inter" font-size="${subSize.toFixed(1)}" font-weight="600" fill="${S.muted}">${esc(card.subtitle)}</text>`;
  }
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

// "+5.4%" / "−3.1%" and "+2.0pp vs SPY": result figures for free picks (see card-data.mjs).
const signed = (v, unit) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}${unit}`;

function resultsBody(style, L, card, y0) {
  const S = STYLES[style];
  const sc = card.stats.scorecard;
  // Portrait cards put the monthly averages on a second line, so the box grows when they are there.
  const avgLine = sc && sc.avgRet != null ? `avg ${signed(sc.avgRet, '%')}${sc.avgExcess != null ? ` · ${signed(sc.avgExcess, 'pp')} vs SPY` : ''}` : null;
  const C = columns(L, y0, sc ? (avgLine && L.W <= L.H ? 190 : 140) : 0);
  let s = '';
  if (sc) {
    const split = L.W > L.H;
    s += `<rect x="${C.sx}" y="${C.sy}" width="${C.sw}" height="${split ? (avgLine ? 260 : 200) : avgLine ? 160 : 110}" rx="18" fill="${S.panel}"/>
      <text x="${C.sx + 30}" y="${C.sy + 45}" font-family="Inter" font-size="24" font-weight="800" fill="${S.muted}" letter-spacing="3">MONTH SO FAR</text>`;
    const parts = [`${sc.wins} W · ${sc.losses} L`, sc.beatSpy != null ? `${sc.beatSpy} beat SPY` : null].filter(Boolean);
    if (split) [...parts, avgLine].filter(Boolean).forEach((p, i) => { s += `<text x="${C.sx + 30}" y="${C.sy + 105 + i * 60}" font-family="Inter" font-size="${i < 2 ? 46 : 34}" font-weight="900" fill="${S.fg}">${p}</text>`; });
    else {
      s += `<text x="${C.sx + 30}" y="${C.sy + 90}" font-family="Inter" font-size="40" font-weight="900" fill="${S.fg}">${parts.join(' · ')}</text>`;
      if (avgLine) s += `<text x="${C.sx + 30}" y="${C.sy + 138}" font-family="Inter" font-size="32" font-weight="800" fill="${S.fg}">${avgLine}</text>`;
    }
  }
  // Rows shrink to fit the space above the footer; past MAX_ROWS the rest is summarised.
  const MAX_ROWS = 8;
  const shown = card.rows.slice(0, MAX_ROWS);
  const extra = card.rows.length - shown.length;
  const bottom = L.footY - 50 - (extra ? 50 : 0);
  const rowH = Math.max(88, Math.min(150, (bottom - C.ry) / Math.max(1, shown.length)));
  const k = rowH / 150;
  let y = C.ry;
  for (const row of shown) {
    s += `<line x1="${C.rx}" y1="${y}" x2="${C.rx + C.rw}" y2="${y}" stroke="${S.rule}" stroke-width="3"/>`;
    s += `<text x="${C.rx}" y="${y + 74 * k}" font-family="Inter" font-size="${(60 * Math.max(k, 0.8)).toFixed(0)}" font-weight="900" fill="${S.fg}">$${esc(row.symbol)}</text>`;
    if (row.company && k > 0.85) s += `<text x="${C.rx}" y="${y + 112 * k}" font-family="Inter" font-size="28" font-weight="700" fill="${S.muted}">${esc(row.company)}</text>`;
    const sx = C.rx + C.rw - STAMP_COL / 2;
    if (row.stamp) s += stamp(style, row.stamp, sx, y + 52 * k, 32 * Math.max(k, 0.8), -7).svg;
    if (row.vsSpy) s += stamp(style, row.vsSpy, sx, y + 114 * k, 22 * Math.max(k, 0.8), -3).svg;
    if (row.resultPct != null) {
      const fx = C.rx + C.rw - STAMP_COL - 24;
      s += `<text x="${fx}" y="${y + 70 * k}" text-anchor="end" font-family="Inter" font-size="${(46 * Math.max(k, 0.8)).toFixed(0)}" font-weight="900" fill="${S.fg}">${signed(row.resultPct, '%')}</text>`;
      if (row.vsSpyPct != null) s += `<text x="${fx}" y="${y + 108 * k}" text-anchor="end" font-family="Inter" font-size="26" font-weight="700" fill="${S.muted}">${signed(row.vsSpyPct, 'pp')} vs SPY</text>`;
    }
    y += rowH;
  }
  if (extra) s += `<text x="${C.rx}" y="${y + 40}" font-family="Inter" font-size="32" font-weight="800" fill="${S.muted}">+${extra} more on the record</text>`;
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

// "Signal anatomy": a drawn schematic, not market data, so it carries no prices and no
// licence questions. Two weekly-candle stories against the lower Bollinger band:
// the close comes back above it (QUALIFIED) or fades below it again (VANISHED).
const ANATOMY_CANDLES = [
  { o: 0.78, c: 0.72, h: 0.82, l: 0.68 },
  { o: 0.72, c: 0.62, h: 0.74, l: 0.58 },
  { o: 0.62, c: 0.50, h: 0.64, l: 0.46 },
  { o: 0.50, c: 0.30, h: 0.52, l: 0.26 },
];
const ANATOMY_LAST = { qualified: { o: 0.30, c: 0.44, h: 0.48, l: 0.27 }, vanished: { o: 0.30, c: 0.27, h: 0.47, l: 0.22 } };
const ANATOMY_LOWER = [0.62, 0.56, 0.48, 0.38, 0.35];
const ANATOMY_MID = [0.84, 0.81, 0.77, 0.72, 0.68];
const ANATOMY_TEXT = {
  qualified: { head: 'IF IT HOLDS', stamp: 'QUALIFIED', lines: ['A weekly close lands below the lower band.', 'The next Friday close is back above it.', 'Confirmed once, at the weekly close.'] },
  vanished: { head: 'IF IT FADES', stamp: 'VANISHED', lines: ['Mid-week it pops back above the band: LIVE.', 'The Friday close slips below again.', 'Logged as vanished, not hidden.'] },
};

function anatomyPanel(style, kind, x, y, w, h, stackedText) {
  const S = STYLES[style];
  const ink = STAMP_COLORS[style];
  const up = ink.QUALIFIED, down = ink['STOPPED OUT'];
  const T = ANATOMY_TEXT[kind];
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${S.panel}" fill-opacity="${S.ink ? 0.55 : 1}"/>`;
  s += `<text x="${x + 26}" y="${y + 42}" font-family="Inter" font-size="22" font-weight="800" fill="${S.muted}" letter-spacing="3">${T.head}</text>`;
  // Chart box: left part of the panel (row layout) or its top part (stacked layout).
  const cx = x + 26, cy = y + 64;
  const cw = stackedText ? w - 52 : Math.min(460, w * 0.49);
  const ch = stackedText ? Math.max(150, h * 0.36) : h - 110;
  const py = (v) => cy + (1 - v) * ch;
  const slot = cw / 5;
  const px = (i) => cx + slot * (i + 0.5);
  const pts = (arr) => arr.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  s += `<polyline points="${pts(ANATOMY_MID)}" fill="none" stroke="${S.muted}" stroke-opacity="0.35" stroke-width="3"/>`;
  s += `<polyline points="${pts(ANATOMY_LOWER)}" fill="none" stroke="${S.muted}" stroke-width="4" stroke-dasharray="12 9"/>`;
  s += `<text x="${(px(0) - slot * 0.4).toFixed(1)}" y="${(py(ANATOMY_LOWER[0]) + 30).toFixed(1)}" font-family="Inter" font-size="18" font-weight="700" fill="${S.muted}">lower band</text>`;
  const candles = [...ANATOMY_CANDLES, ANATOMY_LAST[kind]];
  candles.forEach((k, i) => {
    const col = k.c >= k.o ? up : down;
    const bw = slot * 0.46, top = py(Math.max(k.o, k.c)), bot = py(Math.min(k.o, k.c));
    s += `<line x1="${px(i).toFixed(1)}" y1="${py(k.h).toFixed(1)}" x2="${px(i).toFixed(1)}" y2="${py(k.l).toFixed(1)}" stroke="${col}" stroke-width="4"/>`;
    s += `<rect x="${(px(i) - bw / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(4, bot - top).toFixed(1)}" rx="3" fill="${col}"/>`;
  });
  // Ring the two closes that decide it: below the band, then the next Friday close.
  const ring = (i, v, color) => `<circle cx="${px(i).toFixed(1)}" cy="${py(v).toFixed(1)}" r="${(slot * 0.36).toFixed(1)}" fill="none" stroke="${color}" stroke-width="4"/>`;
  s += ring(3, ANATOMY_CANDLES[3].c, S.muted);
  s += ring(4, ANATOMY_LAST[kind].c, ink[T.stamp]);
  if (kind === 'vanished') {
    s += `<circle cx="${px(4).toFixed(1)}" cy="${py(ANATOMY_LAST.vanished.h).toFixed(1)}" r="8" fill="${ink.CANDIDATES}"/>`;
    s += `<text x="${(px(4) - 14).toFixed(1)}" y="${(py(ANATOMY_LAST.vanished.h) - 16).toFixed(1)}" font-family="Inter" font-size="18" font-weight="800" fill="${ink.CANDIDATES}" text-anchor="end">mid-week</text>`;
  }
  s += `<text x="${px(4).toFixed(1)}" y="${(cy + ch + 26).toFixed(1)}" font-family="Inter" font-size="18" font-weight="800" fill="${S.muted}" text-anchor="middle">Fri close</text>`;
  // Explanation and stamp: right of the chart (row) or under it (stacked).
  const tx = stackedText ? x + 26 : cx + cw + 40, tw = stackedText ? w - 52 : x + w - 26 - tx;
  // Stacked (wide card): the stamp sits in the panel's header row to leave room for text.
  const fs = stackedText ? 22 : 25, lh = stackedText ? 29 : 33;
  let ty;
  if (stackedText) {
    const st = stamp(style, T.stamp, 0, 0, 24, -6);
    s += stamp(style, T.stamp, x + w - 26 - st.w / 2, y + 36, 24, -6).svg;
    ty = cy + ch + 62;
  } else {
    const st = stamp(style, T.stamp, tx + 105, y + 100, 30, -6);
    s += st.svg;
    ty = y + 100 + st.h / 2 + 52;
  }
  T.lines.forEach((line, i) => {
    for (const part of wrap(`${i + 1}. ${line}`, fs, tw, 0.56)) {
      s += `<text x="${tx}" y="${ty}" font-family="Inter" font-size="${fs}" font-weight="${i === 2 ? 800 : 600}" fill="${i === 2 ? S.fg : S.muted}">${esc(part)}</text>`;
      ty += lh;
    }
    ty += 6;
  });
  return s;
}

function anatomyBody(style, L, card, y0) {
  const wide = L.W > L.H;
  const kinds = card.variant === 'both' ? ['qualified', 'vanished'] : [card.variant];
  // Portrait drops Wick (see renderCardSvg) so both panels get the full body height.
  const bottom = L.footY - 44;
  y0 -= wide ? 20 : 40;
  const gap = 26;
  let s = '';
  if (wide && kinds.length === 2) {
    const w = (L.bodyW - gap) / 2;
    kinds.forEach((k, i) => { s += anatomyPanel(style, k, L.pad + i * (w + gap), y0, w, bottom - y0, true); });
  } else {
    const h = (bottom - y0 - gap * (kinds.length - 1)) / kinds.length;
    kinds.forEach((k, i) => { s += anatomyPanel(style, k, L.pad, y0 + i * (h + gap), L.bodyW, h, false); });
  }
  return s;
}

export function renderCardSvg(card, { style = 'A', size = 'portrait', handle = '@Aistockpo' } = {}) {
  const L = layout(size);
  const f = frame(style, L, card, handle);
  // The tracker lists past free picks with their latest grade: the exit report's row layout.
  const body = { verdict: verdictBody, results: resultsBody, race: raceBody, track: resultsBody, anatomy: anatomyBody }[card.template](style, L, card, f.bodyY);
  // The portrait anatomy card is a full-height diagram; Wick would sit on its second panel.
  const mascot = card.template === 'anatomy' && L.W < L.H ? '' : wick(L, card);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">${f.svg}${body}${mascot}</svg>`;
}

export const STYLE_NAMES = Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, v.name]));
