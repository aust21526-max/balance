// Finds the BB·MJ signal labels on a TradingView weekly screenshot so the video and cards can
// point at them: the latest signal (right edge) gets the spotlight, earlier ones a subtle ring and
// an arrow to the high that followed, drawn only where the chart itself shows that rise.
//
// Labels as the indicator draws them under the signal bar: orange "MJ TB" / "GEM TB" (both TB), blue "MON".
// Decoding goes through ffmpeg (already needed for video); without it, no marks and the plain chart.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';


const isOrange = (r, g, b) => r > 225 && g > 135 && g < 175 && b < 70;
const isBlue = (r, g, b) => b > 225 && r < 90 && g > 85 && g < 125;
const isUp = (r, g, b) => g > 110 && r < 90 && b > 95 && b < 160 && g - r > 60;
const isDown = (r, g, b) => r > 150 && g < 110 && b < 125 && r - g > 70;

function decode(path) {
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', path], { encoding: 'utf8' });
  if (probe.status !== 0) return null;
  const [W, H] = probe.stdout.trim().split(',').map(Number);
  if (!W || !H) return null;
  const raw = spawnSync('ffmpeg', ['-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], { maxBuffer: W * H * 3 + 1024 });
  if (raw.status !== 0 || raw.stdout.length < W * H * 3) return null;
  return { W, H, px: raw.stdout };
}

// Connected blobs of one label colour, kept when they are label-sized.
function blobs(img, test, kind, maxX) {
  const { W, H, px } = img;
  const seen = new Uint8Array(W * H);
  const out = [];
  const s = W / 2000; // sizes below are tuned on 2000 px wide screenshots
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < maxX; x++) {
      const i = y * W + x;
      if (seen[i] || !test(px[i * 3], px[i * 3 + 1], px[i * 3 + 2])) continue;
      let x0 = x, x1 = x, y0 = y, y1 = y, n = 0;
      const stack = [i];
      seen[i] = 1;
      while (stack.length) {
        const j = stack.pop();
        const jx = j % W, jy = (j - jx) / W;
        n++;
        if (jx < x0) x0 = jx; if (jx > x1) x1 = jx; if (jy < y0) y0 = jy; if (jy > y1) y1 = jy;
        for (const k of [j - 1, j + 1, j - W, j + W]) {
          const kx = k % W;
          if (k < 0 || k >= W * H || kx >= maxX || Math.abs(kx - jx) > 1 || seen[k]) continue;
          if (test(px[k * 3], px[k * 3 + 1], px[k * 3 + 2])) { seen[k] = 1; stack.push(k); }
        }
      }
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (n > 220 * s * s && w > 26 * s && w < 150 * s && h > 13 * s && h < 85 * s) out.push({ kind, x: x0, y: y0, w, h });
    }
  }
  return out;
}

// Topmost candle pixel per column (needs a vertical run, so thin moving-average lines don't count).
function candleTops(img, maxX) {
  const { W, H, px } = img;
  const top = new Int32Array(W).fill(-1);
  for (let x = 0; x < maxX; x++) {
    let run = 0;
    for (let y = Math.round(H * 0.05); y < H * 0.9; y++) { // skip the OHLC header line
      const i = (y * W + x) * 3;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      if (isUp(r, g, b) || isDown(r, g, b)) { if (++run >= 4) { top[x] = y - 3; break; } } else run = 0;
    }
  }
  return top;
}

// Lowest candle pixel per column (same vertical-run rule), to see whether price fell below the signal bar.
function candleBottoms(img, maxX) {
  const { W, H, px } = img;
  const bot = new Int32Array(W).fill(-1);
  for (let x = 0; x < maxX; x++) {
    let run = 0;
    for (let y = Math.round(H * 0.9); y > H * 0.05; y--) {
      const i = (y * W + x) * 3;
      const r = px[i], g = px[i + 1], b = px[i + 2];
      if (isUp(r, g, b) || isDown(r, g, b)) { if (++run >= 4) { bot[x] = y + 3; break; } } else run = 0;
    }
  }
  return bot;
}

/**
 * { W, H, plotRight, latest: [{kind, x, y, w, h}], past: [{kind, x, y, w, h, low: {x,y}, high: {x,y}}] }
 * or null when the image can't be read. Coordinates are image pixels.
 */
export function chartMarks(path) {
  const img = decode(path);
  if (!img) return null;
  const { W, H } = img;
  const s = W / 2000;
  const tops = candleTops(img, W - Math.round(70 * s)); // keep clear of the price axis tags
  const bots = candleBottoms(img, W - Math.round(70 * s));
  let plotRight = 0;
  for (let x = 0; x < W; x++) if (tops[x] >= 0) plotRight = x;
  if (!plotRight) return null;
  const maxX = Math.min(W - Math.round(60 * s), plotRight + Math.round(30 * s)); // labels under the last bar, not the price axis
  const labels = [...blobs(img, isOrange, 'TB', maxX), ...blobs(img, isBlue, 'MON', maxX)];
  const latestFrom = plotRight - 0.035 * plotRight;
  // The latest bar is this week's confirmed signal (the packet says so), stacked labels and all.
  const latest = labels.filter((l) => l.x + l.w / 2 >= latestFrom);
  const past = [];
  const win = Math.round(0.07 * plotRight); // roughly the next half year on a 10+ year weekly chart
  for (const l of labels.filter((l) => l.x + l.w / 2 < latestFrom && true)) {
    const cx = Math.round(l.x + l.w / 2);
    const low = { x: cx, y: l.y - Math.round(8 * s) };
    let high = null;
    for (let x = cx; x <= Math.min(plotRight, cx + win); x++) if (tops[x] >= 0 && (!high || tops[x] < high.y)) high = { x, y: tops[x] };
    // Only a clear rise counts: at least 6% of the image height above the signal bar's low.
    // Only signals that worked: price rose clearly AND never closed the gap below the signal bar's low on
    // the way (a dip under it would have hit the stop, so that signal was a loss, not a win).
    const sigLow = Math.max(...[-2, -1, 0, 1, 2].map((d) => bots[cx + d] ?? -1));
    let dipped = false;
    if (high && sigLow > 0) for (let x = cx + Math.round(4 * s); x < high.x; x++) if (bots[x] > sigLow + 0.012 * H) { dipped = true; break; }
    if (high && !dipped && low.y - high.y > 0.06 * H && high.x > cx + 2) {
      // The candle tops from the signal bar to that high, for the "trace" style.
      const path = [];
      for (let x = cx; x <= high.x; x += Math.max(1, Math.round(3 * s))) if (tops[x] >= 0) path.push([x, tops[x]]);
      path.push([high.x, high.y]);
      // Light smoothing so the trace reads as one move, not every wick; both ends stay where they are.
      const raw = path.map((q) => q[1]);
      for (let j = 1; j < path.length - 1; j++) {
        const w = raw.slice(Math.max(0, j - 2), j + 3);
        path[j] = [path[j][0], w.reduce((t, v) => t + v, 0) / w.length];
      }
      past.push({ ...l, low, high, path });
    }
  }
  // Labels of one signal stack (TB + MON on the same bar): keep one mark per bar.
  const dedup = (arr) => arr.filter((a, i) => !arr.some((b, j) => j < i && Math.abs(b.x + b.w / 2 - (a.x + a.w / 2)) < 14 * s));
  return { W, H, plotRight, latest: dedup(latest), past: dedup(past) };
}

const YEL = '#ffd23f';
// How earlier signals are drawn: 'arrow' | 'zone' | 'trace' | 'level' (config.json charts.mark_style).
const MARK_STYLE = (() => {
  try { return JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'config.json'), 'utf8')).charts?.mark_style ?? 'trace'; } catch { return 'trace'; }
})();
const GRN = '#22c55e';

/** SVG overlay in image coordinates. `k` 0..1 fades the past marks in one after another; `focus` 0..1 the latest spotlight. */
export function marksSvg(m, { k = 1, focus = 1, scale = 1, style = MARK_STYLE } = {}) {
  if (!m) return '';
  const u = (m.W / 2000) * scale; // stroke widths follow the image size
  let s = '';
  m.past.forEach((p, i) => {
    const a = Math.max(0, Math.min(1, k * (m.past.length + 1) - i));
    if (a <= 0) return;
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    // Per-element opacity: group opacity inside a nested <svg> trips resvg's layer bounds.
    const o = (0.85 * a).toFixed(2);
    const ring = `<ellipse cx="${cx}" cy="${cy}" rx="${p.w * 0.85}" ry="${p.h * 1.05}" fill="none" stroke="#1e293b" stroke-opacity="${(0.7 * a).toFixed(2)}" stroke-width="${3.5 * u}"/>`;
    if (style === 'zone') {
      // A soft green box over the stretch from the signal bar to the high that followed.
      const x0 = cx - 4 * u, x1 = p.high.x + 6 * u, y0 = p.high.y - 8 * u, y1 = p.low.y;
      s += `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${8 * u}" fill="${GRN}" fill-opacity="${(0.16 * a).toFixed(2)}" stroke="${GRN}" stroke-opacity="${(0.55 * a).toFixed(2)}" stroke-width="${2.5 * u}"/>${ring}`;
    } else if (style === 'trace') {
      // The price path itself, traced in green over the candles.
      const d = p.path.map(([x, y], j) => `${j ? 'L' : 'M'}${x},${y}`).join(' ');
      s += `${ring}<path d="${d}" fill="none" stroke="${GRN}" stroke-opacity="${(0.35 * a).toFixed(2)}" stroke-width="${14 * u}" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="${GRN}" stroke-opacity="${o}" stroke-width="${4 * u}" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${p.high.x}" cy="${p.high.y}" r="${7 * u}" fill="${GRN}" fill-opacity="${o}"/>`;
    } else if (style === 'level') {
      // A dashed line at the signal bar's level running to the high, and a dot at the high.
      s += `${ring}<line x1="${cx}" y1="${p.low.y}" x2="${p.high.x}" y2="${p.low.y}" stroke="${GRN}" stroke-opacity="${o}" stroke-width="${3 * u}" stroke-dasharray="${10 * u} ${7 * u}"/>
        <line x1="${p.high.x}" y1="${p.low.y}" x2="${p.high.x}" y2="${p.high.y}" stroke="${GRN}" stroke-opacity="${o}" stroke-width="${3 * u}"/>
        <circle cx="${p.high.x}" cy="${p.high.y}" r="${8 * u}" fill="${GRN}" fill-opacity="${o}"/>`;
    } else {
      s += `${ring}
      <line x1="${p.low.x}" y1="${p.low.y}" x2="${p.high.x}" y2="${p.high.y + 10 * u}" stroke="${GRN}" stroke-opacity="${o}" stroke-width="${5 * u}" stroke-dasharray="${12 * u} ${8 * u}" stroke-linecap="round"/>
      <path d="M${p.high.x - 13 * u},${p.high.y + 16 * u} L${p.high.x},${p.high.y - 6 * u} L${p.high.x + 13 * u},${p.high.y + 16 * u} Z" fill="${GRN}" fill-opacity="${o}"/>`;
    }
  });
  if (m.latest.length && focus > 0) {
    const x0 = Math.min(...m.latest.map((l) => l.x)), x1 = Math.max(...m.latest.map((l) => l.x + l.w));
    const y0 = Math.min(...m.latest.map((l) => l.y)), y1 = Math.max(...m.latest.map((l) => l.y + l.h));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${(x1 - x0) / 2 + 22 * u}" ry="${(y1 - y0) / 2 + 22 * u}" fill="none" stroke="${YEL}" stroke-opacity="${focus.toFixed(2)}" stroke-width="${9 * u}"/>`;
  }
  return s;
}

/** A rect around the latest signal and the bars before it, at `aspect` (w/h), inside the image. `minFrac` = smallest width share. */
export function focusRect(m, aspect, minFrac = 0.28) {
  let w = Math.min(m.W, Math.max(m.W * minFrac, 0.3 * m.plotRight) + (m.W - m.plotRight));
  let h = w / aspect;
  if (h > m.H) { h = m.H; w = h * aspect; }
  const ys = m.latest.length ? m.latest.map((l) => l.y + l.h / 2) : [m.H / 2];
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length - h * 0.15; // the label sits under the bar; show the bars above it
  return { x: m.W - w, y: Math.max(0, Math.min(m.H - h, cy - h / 2)), w, h };
}

/** The chart image with its marks, shown through `view` (image-pixel rect) into box x,y,w,h ("meet" fit).
 *  A plain transform, not a nested <svg>: resvg draws nothing for a nested <svg> inside a clip-path. Clip at the caller. */
export function markedChart({ x, y, w, h }, href, m, view, opts = {}) {
  const v = view ?? { x: 0, y: 0, w: m.W, h: m.H };
  const sc = Math.min(w / v.w, h / v.h);
  const tx = x + (w - v.w * sc) / 2 - v.x * sc, ty = y + (h - v.h * sc) / 2 - v.y * sc;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff"/>
    <g transform="translate(${tx.toFixed(2)},${ty.toFixed(2)}) scale(${sc.toFixed(5)})">
    <image href="${href}" x="0" y="0" width="${m.W}" height="${m.H}"/>${marksSvg(m, { ...opts, scale: Math.max(1, (v.w / m.W) * 1.6) })}</g>`;
}

/**
 * The signal week's move for a TB: alert price -> confirmed weekly close (packet price_at_fire and
 * weekly_close_detail "closed X ..."). This is the bar that confirmed the TB, shown as such.
 */
export function signalMove(sig) {
  if (!sig || sig.type !== 'TB') return null;
  const from = Number(sig.price_at_fire);
  const to = Number(String(sig.weekly_close_detail ?? '').match(/closed\s+([\d.]+)/)?.[1]);
  if (!(from > 0) || !(to > 0)) return null;
  return { from, to, pct: (to / from - 1) * 100 };
}

/** Label box for signalMove, top-left at x,y in screen pixels, `k` = size factor, `op` = opacity. */
export function moveNoteSvg(move, x, y, k = 1, op = 1) {
  if (!move || op <= 0) return '';
  const pct = `${move.pct >= 0 ? '+' : '\u2212'}${Math.abs(move.pct).toFixed(1)}%`;
  const col = move.pct >= 0 ? GRN : '#ef5350';
  const w = 470 * k, h = 150 * k;
  return `<g opacity="${op.toFixed(2)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${16 * k}" fill="#0a0c14" fill-opacity="0.92" stroke="${YEL}" stroke-width="${4 * k}"/>
    <text x="${x + 24 * k}" y="${y + 44 * k}" font-family="Inter" font-size="${32 * k}" font-weight="900" fill="${YEL}">TB SIGNAL FIRED</text>
    <text x="${x + 24 * k}" y="${y + 88 * k}" font-family="Inter" font-size="${30 * k}" font-weight="800" fill="#fff">$${move.from.toFixed(2)}  \u2192  $${move.to.toFixed(2)}</text>
    <text x="${x + 24 * k}" y="${y + 130 * k}" font-family="Inter" font-size="${30 * k}" font-weight="900" fill="${col}">${pct} by the weekly close</text></g>`;
}
