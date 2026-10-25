// card.json (written by Grok) -> resolved card data + pre-render checks (handoff §3).
//
// {
//   "template": "verdict" | "results" | "race",
//   "title": "≤ 6 words",
//   "subtitle": "≤ 12 words",            optional
//   "mood": "excited" | "calm" | "tense" | "gloomy" | "apology",   optional
//   "items": [{ "symbol": "NVDA", "about": true }],   verdict/results only; race has none
//   "chart": "NVDA"                       optional, uses charts/NVDA.png (verdict only)
// }
//
// Stamps are never taken from card.json: they come from the packet (status, publish,
// earnings_caution, monday.new_closes), so a card cannot mislabel a stock.
import { existsSync } from 'node:fs';
import { packetNumbers, publicSymbols, qualifiedCount, signalFor, signals, weekDirection } from './packet.mjs';
import { MOODS } from './script.mjs';
import { chartPath } from './validate.mjs';

export const TEMPLATES = ['verdict', 'results', 'race'];
const BANNED = /\b(scores?|scored|ranked|ranking|rank|top pick|number one|highest|best|guarantee[sd]?|sure thing|must buy|buy now|buy|sell)\b|#\s?1\b/i;
const PRICE_OR_PCT = /%|\bpercent\b|\$\s?\d|\d+(\.\d+)?\s?(usd|dollars?)\b/i;
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;

// Normalises the many ways exit_kind may be spelled in the ledger.
export function exitStamp(kind) {
  const k = String(kind ?? '').toLowerCase();
  if (/tp|take|profit/.test(k)) return 'TAKE-PROFIT';
  if (/sl|stop/.test(k) && !/trail/.test(k)) return 'STOPPED OUT';
  if (/trail|chand/.test(k)) return 'TRAILING EXIT';
  return null;
}

function closes(packet) {
  const m = packet.monday ?? {};
  return Array.isArray(m.new_closes) ? m.new_closes : [];
}

function topTags(packet, n = 3) {
  const counts = new Map();
  for (const s of signals(packet)) for (const t of s.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, n).map(([t]) => t);
}

function candidateCount(packet) {
  const s = packet.summary ?? {};
  const n = Number(s.candidates ?? s.candidate_count);
  return Number.isFinite(n) ? n : signals(packet).filter((x) => x.status === 'CANDIDATE').length;
}

export function resolveCard(card, packet, queueDir) {
  const errors = [], warnings = [];
  const t = card.template;
  if (!TEMPLATES.includes(t)) errors.push(`card.json: template must be one of ${TEMPLATES.join(', ')} (got "${t}")`);
  if (!card.title) errors.push('card.json: title is required');
  if (words(card.title) > 6) errors.push(`card.json: title is ${words(card.title)} words (max 6)`);
  if (words(card.subtitle) > 12) errors.push(`card.json: subtitle is ${words(card.subtitle)} words (max 12)`);
  if (card.mood && !MOODS.includes(card.mood)) errors.push(`card.json: unknown mood "${card.mood}"`);
  if (!packet) { errors.push('packet: no packets/<YYYY-MM-DD>.json on or before this date'); return { errors, warnings }; }

  const numbers = packetNumbers(packet);
  for (const [field, text] of [['title', card.title], ['subtitle', card.subtitle]]) {
    if (!text) continue;
    const bad = text.match(BANNED);
    if (bad) errors.push(`card.json ${field}: "${bad[0]}" — scores, rankings and advice wording are not allowed`);
    if (PRICE_OR_PCT.test(text)) errors.push(`card.json ${field}: prices and % are not shown until 명재 approves publishing performance figures`);
    for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) if (!numbers.has(m[0])) errors.push(`card.json ${field}: number "${m[0]}" is not in the packet`);
  }

  const items = Array.isArray(card.items) ? card.items : [];
  const out = {
    template: t, title: card.title, subtitle: card.subtitle ?? '',
    type: t === 'verdict' ? 'weekly_confirm' : t === 'results' ? 'results' : 'candidate_race',
    mood: card.mood ?? { verdict: 'excited', results: 'calm', race: 'tense' }[t] ?? 'calm',
    flameSize: null, up: weekDirection(packet).up, rows: [], chart: null, stats: {},
  };

  if (t === 'verdict') {
    out.stats.qualified = qualifiedCount(packet);
    const allowed = publicSymbols(packet);
    for (const it of items) {
      const sym = String(it.symbol ?? '').toUpperCase();
      const sig = signalFor(packet, sym);
      if (!sig) { errors.push(`items: ${sym} is not in packet.signals`); continue; }
      if (sig.publish_eligible !== true) errors.push(`items: ${sym} has publish_eligible != true`);
      if (!allowed.has(sym)) { errors.push(`items: ${sym} is not a free pick or vanished log (publish: "${sig.publish ?? '-'}")`); continue; }
      const vanished = sig.publish === 'free post: vanished log';
      if (!vanished && sig.status !== 'QUALIFIED') errors.push(`items: ${sym} status is ${sig.status}, not QUALIFIED`);
      const blurb = it.about ? sig.company_blurb : null;
      if (it.about && !blurb) warnings.push(`items: ${sym} has about:true but no company_blurb — shown without it`);
      if (blurb && /\d/.test(blurb)) errors.push(`items: ${sym} company_blurb contains a number`);
      out.rows.push({ symbol: sym, company: sig.company, stamp: vanished ? 'VANISHED' : 'QUALIFIED', earnings: sig.earnings_caution === true, earningsDate: sig.earnings_date, blurb });
    }
    if (!out.rows.length) warnings.push('verdict card has no items — showing the count only');
    if (card.chart) {
      const sym = String(card.chart).toUpperCase();
      if (!out.rows.some((r) => r.symbol === sym)) errors.push(`chart: ${sym} must also be one of the card items`);
      else if (!existsSync(chartPath(queueDir, sym))) errors.push(`chart: put the TradingView snapshot at charts/${sym}.png`);
      else out.chart = chartPath(queueDir, sym);
    }
  }

  if (t === 'results') {
    const list = closes(packet);
    if (!list.length) errors.push('results card needs packet.monday.new_closes');
    const pick = items.length ? items.map((i) => String(i.symbol).toUpperCase()) : list.map((c) => String(c.symbol).toUpperCase());
    for (const sym of pick) {
      const c = list.find((x) => String(x.symbol).toUpperCase() === sym);
      if (!c) { errors.push(`items: ${sym} is not in packet.monday.new_closes`); continue; }
      const stamp = exitStamp(c.exit_kind);
      if (!stamp) errors.push(`items: ${sym} has unknown exit_kind "${c.exit_kind}"`);
      const v = Number(c.vs_spy_pct);
      out.rows.push({ symbol: sym, company: signalFor(packet, sym)?.company ?? c.company, stamp, vsSpy: Number.isFinite(v) ? (v >= 0 ? 'BEAT SPY' : 'TRAILED SPY') : null });
    }
    const sc = packet.monthly_scorecard;
    if (sc) out.stats.scorecard = { wins: sc.wins, losses: sc.losses, beatSpy: sc.beat_spy ?? sc.beat_spy_count };
    const losses = out.rows.filter((r) => r.stamp === 'STOPPED OUT').length;
    if (!card.mood && losses > out.rows.length - losses) out.mood = 'apology';
  }

  if (t === 'race') {
    if (items.length) errors.push('race card must not name stocks — remove items');
    const syms = new Set(signals(packet).map((s) => String(s.symbol).toUpperCase()));
    for (const [field, text] of [['title', card.title], ['subtitle', card.subtitle]]) {
      for (const w of String(text ?? '').match(/\$?[A-Z][A-Z0-9.]{0,5}\b/g) ?? []) {
        if (syms.has(w.replace('$', ''))) errors.push(`card.json ${field}: "${w}" is a ticker — race cards carry no stock names`);
      }
    }
    if (card.chart) errors.push('race card must not show a chart');
    out.stats.candidates = candidateCount(packet);
    out.stats.tags = topTags(packet);
  }

  const passCount = t === 'race' ? out.stats.candidates : qualifiedCount(packet);
  out.flameSize = 0.45 + Math.min(passCount, 10) * 0.095;
  return { errors, warnings, card: out };
}
