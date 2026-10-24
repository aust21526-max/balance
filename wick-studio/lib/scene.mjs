// Frame composer for the 1080x1920 video, the thumbnail and the 1080x1080 image mode.
// Everything is plain SVG so a frame is a pure function of (timeline state, time).
import { readFileSync } from 'node:fs';
import { drawWick } from '../characters/rig.mjs';
import { esc, textBlock, textWidth, wrap } from './text.mjs';

export const COLORS = {
  bg: '#10141f', panel: '#1a2030', line: '#2a3142', text: '#eef1f7', muted: '#9aa3b5',
  live: '#ffb020', confirmed: '#22c47a', qualified: '#22c47a', candidate: '#ffb020', earnings: '#ff6a3d', ink: '#1b1f2a',
};

const DISCLAIMER = 'Automated account · Not financial advice';
const CATCHPHRASE = "Weekly close or it didn't happen.";

const imageCache = new Map();
function dataUri(path) {
  if (!imageCache.has(path)) imageCache.set(path, `data:image/png;base64,${readFileSync(path).toString('base64')}`);
  return imageCache.get(path);
}

function pill(x, y, label, { bg, fg = COLORS.ink, size = 34, dot = false, anchor = 'start' }) {
  const padX = size * 0.7, h = size * 1.7;
  const w = textWidth(label, size, 0.62) + padX * 2 + (dot ? size * 0.9 : 0);
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  const tx = x0 + padX + (dot ? size * 0.9 : 0);
  return {
    w, h,
    svg: `<g><rect x="${x0.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="${h / 2}" fill="${bg}"/>
      ${dot ? `<circle cx="${(x0 + padX + size * 0.3).toFixed(1)}" cy="${y + h / 2}" r="${size * 0.28}" fill="#e5383b"/>` : ''}
      <text x="${tx.toFixed(1)}" y="${(y + h / 2 + size * 0.36).toFixed(1)}" font-family="Inter" font-size="${size}" font-weight="800" fill="${fg}">${esc(label)}</text></g>`,
  };
}

export function statusPill(type, cx, y, size = 34) {
  return type === 'weekly_confirm'
    ? pill(cx, y, 'CONFIRMED · Weekly close', { bg: COLORS.confirmed, size, anchor: 'middle' }).svg
    : pill(cx, y, 'LIVE · Confirms at Friday close', { bg: COLORS.live, size, dot: true, anchor: 'middle' }).svg;
}

function badgeRow(x, y, sig, size) {
  let out = '', cx = x;
  const add = (p) => { out += p.svg; cx += p.w + 14; };
  if (sig.status === 'QUALIFIED') add(pill(cx, y, 'QUALIFIED', { bg: COLORS.qualified, size }));
  else if (sig.status === 'CANDIDATE') add(pill(cx, y, 'CANDIDATE', { bg: COLORS.candidate, size }));
  if (sig.earnings_caution === true) add(pill(cx, y, 'EARNINGS WEEK', { bg: COLORS.earnings, fg: '#fff', size }));
  return { svg: out, w: Math.max(0, cx - x - 14) };
}

// Main panel (chart snapshot or title card) in the box x,y,w,h.
function mainPanel(view, box, progress) {
  const { x, y, w, h } = box;
  let out = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="${COLORS.panel}"/>`;
  if (view.chart) {
    const z = 1 + 0.06 * progress; // slow push-in
    const cx = x + w / 2, cy = y + h / 2;
    out += `<clipPath id="chartClip"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28"/></clipPath>
      <g clip-path="url(#chartClip)"><g transform="translate(${cx},${cy}) scale(${z.toFixed(4)}) translate(${-cx},${-cy})">
        <image href="${dataUri(view.chart)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>
      </g></g>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="28" fill="none" stroke="${COLORS.qualified}" stroke-width="5" opacity="${(0.35 + 0.35 * Math.sin(progress * Math.PI * 2)).toFixed(2)}"/>`;
    const attrib = 'Charts by TradingView';
    const aw = textWidth(attrib, 24, 0.56) + 32;
    out += `<rect x="${x + w - aw - 18}" y="${y + h - 58}" width="${aw}" height="40" rx="10" fill="#000" opacity="0.7"/>
      <text x="${x + w - 18 - aw / 2}" y="${y + h - 30}" font-family="Inter" font-size="24" font-weight="600" fill="#fff" text-anchor="middle">${attrib}</text>`;
  }
  if (view.signal) {
    const ty = view.chart ? y + 30 : y + h / 2 - 120;
    const tx = view.chart ? x + 30 : x + w / 2;
    if (view.chart) {
      const label = `$${view.signal.symbol}`;
      out += `<rect x="${tx - 6}" y="${ty}" width="${textWidth(label, 72, 0.64) + 40}" height="100" rx="20" fill="${COLORS.bg}" opacity="0.85"/>`;
      out += `<text x="${tx + 14}" y="${ty + 76}" font-family="Inter" font-size="72" font-weight="900" fill="${COLORS.text}">${esc(label)}</text>`;
      out += badgeRow(tx, ty + 118, view.signal, 30).svg;
    } else {
      out += `<text x="${tx}" y="${ty}" font-family="Inter" font-size="150" font-weight="900" fill="${COLORS.text}" text-anchor="middle">$${esc(view.signal.symbol)}</text>`;
      if (view.signal.company) out += `<text x="${tx}" y="${ty + 70}" font-family="Inter" font-size="40" font-weight="500" fill="${COLORS.muted}" text-anchor="middle">${esc(view.signal.company)}</text>`;
      const row = badgeRow(0, 0, view.signal, 36);
      out += `<g transform="translate(${tx - row.w / 2},${ty + 120})">${row.svg}</g>`;
    }
    if (view.signal.earnings_caution === true && view.signal.earnings_date) {
      const ey = view.chart ? ty + 190 : ty + 260;
      out += `<text x="${tx}" y="${ey + 40}" font-family="Inter" font-size="34" font-weight="700" fill="${COLORS.earnings}" text-anchor="${view.chart ? 'start' : 'middle'}">Earnings ${esc(view.signal.earnings_date)} — expect volatility</text>`;
    }
  } else {
    const lines = view.other?.length ? view.other : null;
    if (lines) out += textBlock(lines.flatMap((l) => wrap(l, 72, w - 120)), { x: x + w / 2, y: y + h / 2 - 40, size: 72, color: COLORS.text, weight: 900, anchor: 'middle' });
    else {
      out += `<text x="${x + w / 2}" y="${y + h / 2 - 20}" font-family="Inter" font-size="96" font-weight="900" fill="${COLORS.text}" text-anchor="middle" letter-spacing="4">WEEKLY WICK</text>`;
      out += `<text x="${x + w / 2}" y="${y + h / 2 + 60}" font-family="Inter" font-size="42" font-weight="600" fill="${COLORS.muted}" text-anchor="middle">${esc(CATCHPHRASE)}</text>`;
    }
  }
  return out;
}

function bubble(text, box, tailX) {
  const { x, y, w, h } = box;
  const lines = wrap(text, 50, w - 80);
  const size = lines.length > 3 ? 42 : 50;
  const ls = lines.length > 3 ? wrap(text, size, w - 80) : lines;
  const ty = y + h / 2 - ((ls.length - 1) * size * 1.22) / 2 + size * 0.36;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="#fff"/>
    <path d="M${tailX - 30},${y + h - 2} L${tailX},${y + h + 46} L${tailX + 34},${y + h - 2} Z" fill="#fff"/>
    ${textBlock(ls, { x: x + w / 2, y: ty, size, lineHeight: 1.22, color: COLORS.ink, weight: 800, anchor: 'middle' })}`;
}

// state: { type, t, progress, view, caption, wick: {...rig state}, weekly: {count, show} }
export function videoFrame(state, W = 1080, H = 1920) {
  const { type, t, progress, view, caption, wick, weekly } = state;
  let s = `<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>`;
  s += statusPill(type, W / 2, 70);
  s += `<text x="${W / 2}" y="${210}" font-family="Inter" font-size="30" font-weight="800" fill="${COLORS.muted}" text-anchor="middle" letter-spacing="8">WEEKLY WICK</text>`;
  s += mainPanel(view, { x: 60, y: 250, w: 960, h: 760 }, progress);
  if (caption) s += bubble(caption, { x: 60, y: 1050, w: 960, h: 270 }, 300);
  s += `<g transform="translate(70,1255) scale(0.76)">${drawWick({ t, ...wick })}</g>`;
  const side = weekly.show
    ? [`${weekly.count} QUALIFIED`, 'this week']
    : ['Weekly close', "or it didn't happen."];
  s += textBlock([side[0]], { x: 760, y: 1530, size: 54, color: COLORS.text, weight: 900, anchor: 'middle' });
  s += textBlock([side[1]], { x: 760, y: 1590, size: 36, color: COLORS.muted, weight: 600, anchor: 'middle' });
  s += `<text x="${W / 2}" y="${H - 70}" font-family="Inter" font-size="30" font-weight="600" fill="${COLORS.muted}" text-anchor="middle">${DISCLAIMER}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}

export function thumbnail({ type, signal, wick }, W = 1080, H = 1920) {
  let s = `<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>`;
  s += statusPill(type, W / 2, 90, 40);
  if (signal) {
    s += `<text x="${W / 2}" y="520" font-family="Inter" font-size="230" font-weight="900" fill="${COLORS.text}" text-anchor="middle">$${esc(signal.symbol)}</text>`;
    const row = badgeRow(0, 0, signal, 52);
    s += `<g transform="translate(${W / 2 - row.w / 2},600)">${row.svg}</g>`;
  } else {
    s += `<text x="${W / 2}" y="520" font-family="Inter" font-size="130" font-weight="900" fill="${COLORS.text}" text-anchor="middle" letter-spacing="6">WEEKLY WICK</text>`;
  }
  s += `<g transform="translate(135,770) scale(1.35)">${drawWick({ t: 0.3, blink: 0, mouth: 'closed', ...wick })}</g>`;
  s += `<text x="${W / 2}" y="${H - 70}" font-family="Inter" font-size="32" font-weight="600" fill="${COLORS.muted}" text-anchor="middle">${DISCLAIMER}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}

// 1080x1080 still for weekday posts (candidate race, Friday teaser).
export function stillImage({ type, headline, sub, signal, wick, chart }, W = 1080, H = 1080) {
  let s = `<rect width="${W}" height="${H}" fill="${COLORS.bg}"/>`;
  s += statusPill(type, W / 2, 50, 32);
  if (chart || signal) {
    s += mainPanel({ chart, signal }, { x: 50, y: 160, w: 980, h: 520 }, 0);
  } else {
    s += textBlock(wrap(headline, 76, 940), { x: W / 2, y: 330, size: 76, color: COLORS.text, weight: 900, anchor: 'middle' });
    if (sub) s += textBlock(wrap(sub, 40, 900), { x: W / 2, y: 560, size: 40, color: COLORS.muted, weight: 600, anchor: 'middle' });
  }
  s += `<g transform="translate(40,690) scale(0.42)">${drawWick({ t: 0.3, blink: 0, mouth: 'closed', ...wick })}</g>`;
  if (chart || signal) s += textBlock(wrap(headline, 44, 700), { x: 640, y: 820, size: 44, color: COLORS.text, weight: 800, anchor: 'middle' });
  else s += textBlock(['Weekly close', "or it didn't happen."], { x: 640, y: 840, size: 40, color: COLORS.muted, weight: 700, anchor: 'middle' });
  s += `<text x="${W / 2}" y="${H - 36}" font-family="Inter" font-size="26" font-weight="600" fill="${COLORS.muted}" text-anchor="middle">${DISCLAIMER}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${s}</svg>`;
}
