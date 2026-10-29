// GROK PACKET helpers. Field names follow 그록봇_운영지침.md §5; anything not listed
// there is read defensively and reported as a warning when missing.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// The packet for a queue date is the newest packets/<YYYY-MM-DD>.json on or before it.
// With `type`, the newest packet of that packet_type from the 7 days up to the date wins
// instead: a Sunday or Monday verdict card needs Saturday's weekly_verdict (only it has
// free_picks), even though a daily or monday_confirm packet has arrived since.
export function findPacket(wickDir, date, type = null) {
  const dir = join(wickDir, 'packets');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) <= date).sort().reverse();
  if (type) {
    const weekAgo = new Date(Date.parse(`${date}T00:00:00Z`) - 7 * 86400e3).toISOString().slice(0, 10);
    for (const f of files.filter((f) => f.slice(0, 10) >= weekAgo)) {
      try {
        if (JSON.parse(readFileSync(join(dir, f), 'utf8')).packet_type === type) return join(dir, f);
      } catch { /* unreadable packets are reported when loaded */ }
    }
  }
  return files.length ? join(dir, files[0]) : null;
}

// Which packet_type a card template or script type is built from (null = newest packet).
export function packetTypeFor({ template, scriptType }) {
  if (template === 'verdict' || scriptType === 'weekly_confirm' || scriptType === 'deep_dive') return 'weekly_verdict';
  if (template === 'results' || scriptType === 'results') return 'monday_confirm';
  return null;
}

// Real packets name stocks with their exchange ("NYSE:EFC") while free_picks and scripts
// use the bare ticker ("EFC"). Normalise once on load: every symbol becomes the bare
// ticker and the exchange is kept alongside it.
export function normalizePacket(p) {
  const bare = (sym) => String(sym).split(':').pop().trim().toUpperCase();
  const walk = (v) => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out = {};
      for (const [k, x] of Object.entries(v)) out[k] = walk(x);
      if (typeof v.symbol === 'string') {
        out.symbol = bare(v.symbol);
        if (v.symbol.includes(':') && !out.exchange) out.exchange = v.symbol.split(':')[0];
      }
      return out;
    }
    return v;
  };
  const out = walk(p);
  if (Array.isArray(out.free_picks)) out.free_picks = out.free_picks.map((x) => (typeof x === 'string' ? bare(x) : x));
  return out;
}

export function loadPacket(path) {
  return normalizePacket(JSON.parse(readFileSync(path, 'utf8')));
}

export const signals = (p) => (Array.isArray(p.signals) ? p.signals : []);

export function signalFor(p, symbol) {
  return signals(p).find((s) => String(s.symbol).toUpperCase() === symbol.toUpperCase());
}

// free_picks may be a list of symbols or of signal-like objects.
export function freePickSymbols(p) {
  const fp = Array.isArray(p.free_picks) ? p.free_picks : [];
  const fromList = fp.map((x) => (typeof x === 'string' ? x : x?.symbol)).filter(Boolean);
  const fromSignals = signals(p).filter((s) => s.publish === 'free sample candidate').map((s) => s.symbol);
  return [...new Set([...fromList, ...fromSignals].map((s) => String(s).toUpperCase()))];
}

// Tickers that may appear by name in public content.
export function publicSymbols(p) {
  const vanished = signals(p).filter((s) => s.publish === 'free post: vanished log').map((s) => String(s.symbol).toUpperCase());
  return new Set([...freePickSymbols(p), ...vanished]);
}

export function qualifiedCount(p) {
  const n = signals(p).filter((s) => s.status === 'QUALIFIED').length;
  if (n) return n;
  const s = p.summary ?? {};
  return Number(s.qualified ?? s.qualified_count ?? s.passed_50 ?? s.passed ?? 0) || 0;
}

// Flame size from the week's pass count: 0 -> tiny, 10+ -> full blaze.
export function flameSizeFor(count) {
  return 0.45 + Math.min(count, 10) * 0.095;
}

// Up/down week drives the body colour. Returns { up, known }.
export function weekDirection(p) {
  const s = p.summary ?? {};
  const v = s.market_week ?? s.week_direction ?? s.spy_week_change_pct ?? s.spy_weekly_change_pct;
  if (v === undefined || v === null || v === '') return { up: true, known: false };
  if (typeof v === 'string' && /^(up|down)$/i.test(v)) return { up: /^up$/i.test(v), known: true };
  return { up: Number(v) >= 0, known: true };
}

// Every number that appears anywhere in the packet, as strings, for on-screen checks.
export function packetNumbers(p) {
  const out = new Set();
  const walk = (v) => {
    if (v === null || v === undefined) return;
    if (typeof v === 'number') { out.add(String(v)); return; }
    if (typeof v === 'string') {
      for (const m of v.matchAll(/\d+(?:\.\d+)?/g)) { out.add(m[0]); out.add(String(Number(m[0]))); }
      return;
    }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(p);
  return out;
}
