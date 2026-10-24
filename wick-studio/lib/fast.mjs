// Fast-cut, short-form style frames: kinetic word captions, zoom-punch cuts, ticker slams,
// badge stamps, count-ups. Works for landscape (1920x1080) and portrait (1080x1920).
import { drawWick } from '../characters/rig.mjs';
import { clamp, easeOutBack, easeOutCubic, lerp, rng, shake, spring } from './motion.mjs';
import { COLORS, dataUri, pill } from './scene.mjs';
import { esc, wrap } from './text.mjs';

const HL = '#ffd23f'; // active-word highlight
const ACCENT = { excited: '#22c47a', calm: '#4c8dff', tense: '#ffb020', gloomy: '#ef5350', apology: '#ef5350' };
const DISCLAIMER = 'Automated account · Not financial advice';

// Group opacity makes resvg composite a full-frame layer, so only emit it mid-fade.
const fade = (op) => (op < 0.999 ? ` opacity="${op.toFixed(2)}"` : '');

export function layout(W, H) {
  const land = W > H;
  return land
    ? { land, W, H, cap: { y: H - 120, size: 78, max: W - 240 }, bigCap: { y: H / 2 + 20, size: 128, max: W - 700 },
      side: { x: W - 330, y: H - 70, s: 0.6 }, hero: { x: 330, y: H - 60, s: 1.05 },
      chart: { x: 70, y: 130, w: 1160, h: 720 }, tickerCol: { x: 1300, y: 300 } }
    : { land, W, H, cap: { y: 1350, size: 80, max: W - 120 }, bigCap: { y: 760, size: 120, max: W - 120 },
      side: { x: W - 230, y: H - 100, s: 0.55 }, hero: { x: W / 2, y: H - 140, s: 0.95 },
      chart: { x: 50, y: 470, w: 980, h: 760 }, tickerCol: { x: 60, y: 250 } };
}

// Character placed by its feet (stage feet are at 300,712).
function wickAt(x, y, s, state, extra = '') {
  return `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(3)}) translate(-300,-712)" ${extra}>${drawWick(state)}</g>`;
}

function background(L, t, mood) {
  const { W, H } = L;
  const acc = ACCENT[mood] ?? ACCENT.calm;
  const r = rng(42);
  let embers = '';
  for (let i = 0; i < 26; i++) {
    const x0 = r() * W, speed = 40 + r() * 80, size = 2 + r() * 4, ph = r() * H;
    const y = H - ((t * speed + ph) % (H + 40));
    const x = x0 + Math.sin(t * (0.6 + r()) + i) * 20;
    embers += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(1)}" fill="${i % 3 ? '#ff8a2a' : '#ffd23f'}" fill-opacity="${(0.25 + 0.35 * r()).toFixed(2)}"/>`;
  }
  const off = (t * 60) % 80;
  let d = '';
  for (let x = -H; x < W + H; x += 80) d += `M${x + off},0L${x + off - H},${H}`;
  const grid = `<path d="${d}" stroke="#fff" stroke-width="2" stroke-opacity="0.035"/>`;
  return `<defs><radialGradient id="bgGlow" cx="50%" cy="45%" r="70%">
      <stop offset="0" stop-color="${acc}" stop-opacity="0.28"/><stop offset="1" stop-color="${acc}" stop-opacity="0"/>
    </radialGradient></defs>
    <rect width="${W}" height="${H}" fill="${COLORS.bg}"/><rect width="${W}" height="${H}" fill="url(#bgGlow)"/>${grid}${embers}`;
}

function hud(L, { type, t, total, mood }) {
  const { W, H } = L;
  const live = type !== 'weekly_confirm';
  const p = live
    ? pill(40, 34, 'LIVE · Confirms at Friday close', { bg: COLORS.live, size: 26, dot: true })
    : pill(40, 34, 'CONFIRMED · Weekly close', { bg: COLORS.confirmed, size: 26 });
  return `<rect x="0" y="0" width="${(W * clamp(t / total)).toFixed(1)}" height="8" fill="${ACCENT[mood] ?? HL}"/>
    ${p.svg}
    <text x="${W - 40}" y="72" font-family="Inter" font-size="28" font-weight="900" fill="${COLORS.text}" text-anchor="end" letter-spacing="6">WEEKLY WICK</text>
    <text x="${L.land ? 40 : W / 2}" y="${H - 28}" font-family="Inter" font-size="22" font-weight="600" fill="${COLORS.muted}" text-anchor="${L.land ? 'start' : 'middle'}">${DISCLAIMER}</text>`;
}

// Kinetic caption: the current chunk pops in, the spoken word is highlighted.
function caption(chunk, { x, y, size, max }, t) {
  if (!chunk) return '';
  const k = t - chunk.start;
  const sc = lerp(0.6, 1, spring(k, { stiffness: 260, damping: 16 }));
  const line = chunk.words.join(' ');
  const fs = Math.min(size, max / Math.max(1, line.length * 0.6));
  const spans = chunk.words.map((w, i) => `<tspan fill="${i === chunk.active ? HL : '#fff'}">${esc(w)}${i < chunk.words.length - 1 ? ' ' : ''}</tspan>`).join('');
  return `<g transform="translate(${x},${y}) scale(${sc.toFixed(3)}) rotate(${(-2 * (1 - clamp(k / 0.2))).toFixed(2)})">
    <text x="0" y="0" font-family="Inter" font-size="${fs.toFixed(0)}" font-weight="900" text-anchor="middle"
      stroke="#000" stroke-width="${(fs * 0.16).toFixed(1)}" stroke-linejoin="round" paint-order="stroke">${spans}</text></g>`;
}

function stampBadge(x, y, label, bg, fg, size, k) {
  if (k < 0) return '';
  const s = lerp(1.9, 1, easeOutBack(k / 0.22, 2.2));
  const op = clamp(k / 0.06);
  const p = pill(0, 0, label, { bg, fg, size });
  return `<g transform="translate(${x},${y}) rotate(-6) scale(${s.toFixed(3)}) translate(${-p.w / 2},${-p.h / 2})"${fade(op)}>${p.svg}</g>`;
}

function slamText(x, y, label, size, k, color = COLORS.text, anchor = 'middle') {
  if (k < 0) return '';
  const s = lerp(2.4, 1, easeOutCubic(k / 0.18));
  const op = clamp(k / 0.08);
  return `<g transform="translate(${x},${y}) scale(${s.toFixed(3)})"${fade(op)}>
    <text x="0" y="0" font-family="Inter" font-size="${size}" font-weight="900" fill="${color}" text-anchor="${anchor}"
      stroke="#000" stroke-width="${(size * 0.06).toFixed(1)}" paint-order="stroke">${esc(label)}</text></g>`;
}

function chartScene(L, seg, lt, wick) {
  const { chart: B } = L;
  const sig = seg.signal;
  let s = '';
  const inK = easeOutCubic(lt / 0.3);
  const dx = (1 - inK) * L.W * 0.6;
  if (seg.chart) {
    const z = 1.12 - 0.08 * clamp(lt / Math.max(1, seg.dur));
    const cx = B.x + B.w / 2, cy = B.y + B.h / 2;
    s += `<g transform="translate(${dx.toFixed(1)},0)">
      <clipPath id="cc"><rect x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" rx="26"/></clipPath>
      <rect x="${B.x - 6}" y="${B.y - 6}" width="${B.w + 12}" height="${B.h + 12}" rx="30" fill="${COLORS.qualified}" fill-opacity="0.5"/>
      <g clip-path="url(#cc)"><g transform="translate(${cx},${cy}) scale(${z.toFixed(4)}) translate(${-cx},${-cy})">
        <image href="${dataUri(seg.chart)}" x="${B.x}" y="${B.y}" width="${B.w}" height="${B.h}" preserveAspectRatio="xMidYMid slice"/></g>
        <rect x="${B.x + (lt * 900) % (B.w + 600) - 300}" y="${B.y}" width="160" height="${B.h}" fill="#fff" fill-opacity="0.06" transform="skewX(-18)"/>
      </g>
      <rect x="${B.x + B.w - 300}" y="${B.y + B.h - 54}" width="282" height="38" rx="10" fill="#000" fill-opacity="0.75"/>
      <text x="${B.x + B.w - 159}" y="${B.y + B.h - 27}" font-family="Inter" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">Charts by TradingView</text>
    </g>`;
  }
  const col = seg.chart ? L.tickerCol : { x: L.W / 2, y: L.land ? 380 : 620 };
  const centered = !seg.chart || !L.land;
  const tx = centered ? (seg.chart ? L.W / 2 : col.x) : col.x + 270;
  const big = seg.chart ? (L.land ? 120 : 130) : 220;
  s += slamText(tx, col.y, `$${sig.symbol}`, big, lt - 0.12);
  if (sig.company && !seg.chart) s += `<text x="${tx}" y="${col.y + 70}" font-family="Inter" font-size="40" font-weight="600" fill="${COLORS.muted}" text-anchor="middle" fill-opacity="${clamp((lt - 0.3) / 0.2).toFixed(2)}">${esc(sig.company)}</text>`;
  const by = col.y + (seg.chart ? 90 : 170);
  if (sig.status === 'QUALIFIED') s += stampBadge(tx, by, 'QUALIFIED', COLORS.qualified, COLORS.ink, 40, lt - 0.45);
  if (sig.status === 'CANDIDATE') s += stampBadge(tx, by, 'CANDIDATE', COLORS.candidate, COLORS.ink, 40, lt - 0.45);
  if (sig.earnings_caution) s += stampBadge(tx, by + 92, 'EARNINGS WEEK', COLORS.earnings, '#fff', 34, lt - 0.7);
  const pop = spring(lt - 0.2);
  s += wickAt(L.side.x, L.side.y + (1 - pop) * 300, L.side.s, wick);
  return s;
}

function earningsScene(L, seg, lt, wick) {
  const { W, H } = L;
  const sig = seg.signal;
  let stripes = '';
  const off = (lt * 160) % 120;
  for (let x = -H; x < W + H; x += 120) stripes += `<polygon points="${x + off},0 ${x + off + 60},0 ${x + off + 60 - H},${H} ${x + off - H},${H}" fill="${COLORS.earnings}" fill-opacity="0.07"/>`;
  const cy = L.land ? 330 : 600;
  let s = stripes;
  s += stampBadge(W / 2, cy - 120, 'EARNINGS WEEK', COLORS.earnings, '#fff', L.land ? 56 : 60, lt - 0.1);
  s += slamText(W / 2, cy + 60, `$${sig.symbol}`, L.land ? 150 : 170, lt - 0.3);
  if (sig.earnings_date) s += slamText(W / 2, cy + (L.land ? 170 : 200), `Reports ${sig.earnings_date}`, L.land ? 64 : 72, lt - 0.55, HL);
  s += `<text x="${W / 2}" y="${cy + (L.land ? 240 : 290)}" font-family="Inter" font-size="40" font-weight="700" fill="${COLORS.text}" text-anchor="middle" fill-opacity="${clamp((lt - 0.8) / 0.2).toFixed(2)}">Expect volatility around the report</text>`;
  s += wickAt(L.side.x, L.side.y, L.side.s, wick);
  return s;
}

function countScene(L, seg, lt, wick, count) {
  const { W } = L;
  const cy = L.land ? 420 : 640;
  const shown = Math.min(count, Math.floor(clamp((lt - 0.15) / 0.6) * count + (lt > 0.15 ? 1 : 0)));
  let s = slamText(W / 2, cy, String(shown), L.land ? 300 : 340, lt - 0.1, HL);
  s += stampBadge(W / 2, cy + 90, 'QUALIFIED', COLORS.qualified, COLORS.ink, 48, lt - 0.5);
  const n = Math.min(count, 10), gap = 96, x0 = W / 2 - ((n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) {
    const k = spring(lt - 0.2 - i * 0.12);
    s += `<g transform="translate(${x0 + i * gap},${cy + 240}) scale(${(1.15 * k).toFixed(3)})">
      <path d="M0,-60 C14,-42 23,-30 22,-17 C20,-5 11,0 0,0 C-11,0 -20,-5 -22,-17 C-23,-30 -14,-42 0,-60 Z" fill="#ff6a1a"/>
      <path d="M0,-38 C8,-28 12,-20 11,-12 C10,-4 6,0 0,0 C-6,0 -10,-4 -11,-12 C-12,-20 -8,-28 0,-38 Z" fill="#ffd23f"/></g>`;
  }
  s += wickAt(L.side.x, L.side.y, L.side.s, wick);
  return s;
}

function heroScene(L, seg, lt, wick, chunk, t) {
  const pop = spring(lt, { stiffness: 200, damping: 12 });
  const x = L.land ? L.hero.x : L.W / 2;
  let s = wickAt(x, L.hero.y + (1 - pop) * 400, L.hero.s * lerp(0.7, 1, pop), wick);
  const cap = L.land ? { x: L.W / 2 + 280, y: L.bigCap.y, size: L.bigCap.size, max: L.bigCap.max } : { x: L.W / 2, y: L.bigCap.y - 200, size: L.bigCap.size, max: L.bigCap.max };
  s += caption(chunk, cap, t);
  return s;
}

function lineScene(L, seg, lt, wick, chunk, t) {
  let s = caption(chunk, { x: L.W / 2, y: L.land ? L.H / 2 - 40 : L.bigCap.y - 120, size: L.bigCap.size, max: L.land ? L.W - 200 : L.bigCap.max }, t);
  const pop = spring(lt - 0.1);
  s += wickAt(L.side.x, L.side.y + (1 - pop) * 300, L.side.s, wick);
  return s;
}

function endScene(L, seg, lt, wick) {
  const { W } = L;
  const tx = L.land ? W / 2 - 220 : W / 2;
  const cy = L.land ? 360 : 420;
  let s = slamText(tx, cy, 'FULL LIST', 150, lt - 0.05);
  s += slamText(tx, cy + 150, 'FOR MEMBERS', 110, lt - 0.25, HL);
  s += `<text x="${tx}" y="${cy + 240}" font-family="Inter" font-size="40" font-weight="700" fill="${COLORS.muted}" text-anchor="middle" fill-opacity="${clamp((lt - 0.5) / 0.3).toFixed(2)}">Weekly close or it didn't happen.</text>`;
  const pop = spring(lt - 0.15, { stiffness: 200, damping: 11 });
  const at = L.land ? { x: W - 380, y: L.H - 90, s: 0.85 } : { x: W / 2, y: 1450, s: 0.7 };
  s += wickAt(at.x, at.y + (1 - pop) * 400, at.s, wick);
  return s;
}

// "What they do": company name, a WHAT THEY DO tag and the packet's one-line blurb,
// revealed word by word in step with the voice.
function aboutScene(L, seg, lt, wick, t) {
  const { W } = L;
  const sig = seg.signal;
  const x0 = L.land ? 140 : 70;
  const top = L.land ? 250 : 380;
  const maxW = L.land ? W - 760 : W - 140;
  let s = '';
  const tag = pill(0, 0, 'WHAT THEY DO', { bg: HL, size: 30 });
  const tk = easeOutBack(lt / 0.3);
  s += `<g transform="translate(${x0 + (1 - tk) * -200},${top})">${tag.svg}</g>`;
  s += `<text x="${x0}" y="${top + 150}" font-family="Inter" font-size="${L.land ? 96 : 88}" font-weight="900" fill="${COLORS.text}" fill-opacity="${clamp((lt - 0.1) / 0.15).toFixed(2)}">${esc(sig.company ?? sig.symbol)}</text>`;
  s += `<text x="${x0}" y="${top + 210}" font-family="Inter" font-size="40" font-weight="800" fill="${COLORS.muted}" fill-opacity="${clamp((lt - 0.2) / 0.15).toFixed(2)}">$${esc(sig.symbol)}</text>`;
  // Accent bar grows down the left edge.
  const barH = 360 * easeOutCubic((lt - 0.2) / 0.4);
  s += `<rect x="${x0 - 36}" y="${top + 250}" width="10" height="${barH.toFixed(1)}" rx="5" fill="${HL}"/>`;
  const size = L.land ? 64 : 62;
  const lines = wrap(sig.company_blurb, size, maxW, 0.55);
  const words = lines.join(' ').split(' ');
  const per = Math.max(0.12, (seg.dur - 0.6) / Math.max(1, words.length)); // spread the reveal over the line
  let wi = 0;
  lines.forEach((line, li) => {
    const spans = line.split(' ').map((w) => {
      const k = clamp((lt - 0.35 - wi++ * per) / 0.18);
      return `<tspan fill="#fff" fill-opacity="${(0.15 + 0.85 * k).toFixed(2)}">${esc(w)} </tspan>`;
    }).join('');
    s += `<text x="${x0}" y="${top + 320 + li * size * 1.25}" font-family="Inter" font-size="${size}" font-weight="800">${spans}</text>`;
  });
  const pop = spring(lt - 0.15);
  s += wickAt(L.side.x, L.side.y + (1 - pop) * 300, L.side.s, wick);
  return s;
}

export function sceneKind(seg, i, count) {
  if (i === 0) return 'hero';
  if (seg.isEnd) return 'end';
  if (seg.signal && seg.about && seg.signal.company_blurb) return 'about';
  if (seg.signal && seg.signal.earnings_caution && /earnings/i.test(seg.text) && !seg.chart) return 'earnings';
  if (seg.signal) return 'chart';
  if (count > 0 && new RegExp(`\\b${count}\\b`).test(seg.text) && /qualif/i.test(seg.text)) return 'count';
  return 'line';
}

// state: { type, t, total, seg: {kind, start, dur, signal, chart, mood}, chunk, wick, count }
export function fastFrame(L, st) {
  const { t, seg } = st;
  const lt = t - seg.start;
  const impact = seg.kind === 'chart' ? lt - 0.45 : seg.kind === 'earnings' ? lt - 0.1 : seg.kind === 'count' ? lt - 0.5 : lt;
  const sh = shake(impact, 0.3, seg.kind === 'line' || seg.kind === 'hero' ? 0 : 12);
  const punch = lerp(1.07, 1, easeOutCubic(lt / 0.25));
  let body;
  switch (seg.kind) {
    case 'hero': body = heroScene(L, seg, lt, st.wick, st.chunk, t); break;
    case 'chart': body = chartScene(L, seg, lt, st.wick); break;
    case 'earnings': body = earningsScene(L, seg, lt, st.wick); break;
    case 'about': body = aboutScene(L, seg, lt, st.wick, t); break;
    case 'count': body = countScene(L, seg, lt, st.wick, st.count); break;
    case 'end': body = endScene(L, seg, lt, st.wick); break;
    default: body = lineScene(L, seg, lt, st.wick, st.chunk, t);
  }
  const bottomCap = seg.kind === 'hero' || seg.kind === 'line' || seg.kind === 'about' ? '' : caption(st.chunk, { x: L.W / 2, ...L.cap }, t);
  const flash = clamp(1 - lt / 0.12) * 0.35;
  const cx = L.W / 2, cy = L.H / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L.W}" height="${L.H}" viewBox="0 0 ${L.W} ${L.H}">
    ${background(L, t, seg.mood)}
    <g transform="translate(${(cx + sh.x).toFixed(1)},${(cy + sh.y).toFixed(1)}) scale(${punch.toFixed(4)}) translate(${-cx},${-cy})">${body}</g>
    ${bottomCap}
    ${hud(L, { type: st.type, t, total: st.total, mood: seg.mood })}
    ${flash > 0.01 ? `<rect width="${L.W}" height="${L.H}" fill="#fff" fill-opacity="${flash.toFixed(3)}"/>` : ''}
  </svg>`;
}

// Splits spoken text into caption chunks (≤3 words, break after punctuation) with word
// timings spread over the voiced part of the clip, weighted by word length.
export function chunkWords(text, voiceStart, voiceEnd) {
  const words = text.split(/\s+/).filter(Boolean);
  const weight = words.map((w) => w.replace(/[^\w]/g, '').length + 2 + (/[.,!?;:]$/.test(w) ? 4 : 0));
  const sum = weight.reduce((a, b) => a + b, 0);
  let acc = 0;
  const times = words.map((w, i) => { const at = voiceStart + (acc / sum) * (voiceEnd - voiceStart); acc += weight[i]; return at; });
  const chunks = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push(i);
    if (cur.length === 3 || /[.,!?;:]$/.test(w) || i === words.length - 1) { chunks.push(cur); cur = []; }
  });
  return chunks.map((idx) => ({ words: idx.map((i) => words[i]), times: idx.map((i) => times[i]), start: times[idx[0]] }));
}

export function chunkAt(chunks, t) {
  let c = null;
  for (const ch of chunks) if (t >= ch.start) c = ch;
  if (!c) return null;
  let active = 0;
  c.times.forEach((at, i) => { if (t >= at) active = i; });
  return { words: c.words, start: c.start, active };
}

