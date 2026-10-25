// Pre-render checks (handoff §3 "렌더 전 자동 점검"). Returns { errors, warnings }.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { packetNumbers, publicSymbols, signalFor, weekDirection } from './packet.mjs';

// Scores and rankings are never shown; advice/guarantee language is never used.
const BANNED = /\b(scores?|scored|ranked|ranking|rank|top pick|number one|highest|best pick|guarantee[sd]?|sure thing|must buy|buy now)\b|#\s?1\b/i;

// ABOUT segments show the packet's company_blurb: one plain-language line, no figures.
function checkAbout(seg, where, packet, errors, warnings) {
  const sym = seg.onScreen.tickers[0];
  if (!sym) { errors.push(`${where}: ABOUT needs a ticker`); return; }
  const blurb = signalFor(packet, sym)?.company_blurb;
  if (!blurb) { errors.push(`${where}: ${sym} has no company_blurb in the packet — ABOUT cannot be shown`); return; }
  if (/\d/.test(blurb)) errors.push(`${where}: ${sym} company_blurb contains a number — blurbs must not quote figures`);
  if (BANNED.test(blurb)) errors.push(`${where}: ${sym} company_blurb uses score/ranking/advice wording`);
  const words = blurb.split(/\s+/).length;
  if (words > 16) warnings.push(`${where}: ${sym} company_blurb is ${words} words (keep it under 16)`);
  const norm = (s) => new Set(s.toLowerCase().match(/[a-z']+/g) ?? []);
  const b = norm(blurb), said = norm(seg.text);
  const shared = [...b].filter((w) => said.has(w)).length;
  if (shared / Math.max(1, b.size) < 0.5) warnings.push(`${where}: spoken line differs from ${sym} company_blurb — Wick should read the blurb`);
}

export function chartPath(queueDir, symbol) {
  return join(queueDir, 'charts', `${symbol.toUpperCase()}.png`);
}

export function validate({ script, packet, queueDir }) {
  const errors = [...script.errors];
  const warnings = [];
  if (!packet) {
    errors.push('packet: no packets/<YYYY-MM-DD>.json on or before this date');
    return { errors, warnings };
  }
  const allowed = publicSymbols(packet);
  const numbers = packetNumbers(packet);
  const earningsTickers = new Set();
  const spoken = script.segments.map((s) => s.text).join(' ');

  for (const seg of script.segments) {
    const where = seg.isEnd ? '[end]' : `[${seg.start}-${seg.end}s]`;
    const shown = [seg.text, ...seg.onScreen.other].join(' ');
    const bad = shown.match(BANNED);
    if (bad) errors.push(`${where}: "${bad[0]}" — scores, rankings and advice/guarantee wording are not allowed`);

    for (const m of shown.matchAll(/\d+(?:\.\d+)?/g)) {
      if (!numbers.has(m[0])) errors.push(`${where}: number "${m[0]}" is not in the packet`);
    }

    for (const sym of seg.onScreen.tickers) {
      const sig = signalFor(packet, sym);
      if (!sig) { errors.push(`${where}: ${sym} is not in packet.signals`); continue; }
      if (sig.publish_eligible !== true && sig.publish !== 'free post: vanished log') errors.push(`${where}: ${sym} has publish_eligible != true`);
      if (!allowed.has(sym)) errors.push(`${where}: ${sym} is not a free pick (publish: "${sig.publish ?? '-'}") — only free_picks may be named`);
      for (const b of seg.onScreen.badges) {
        if (b !== sig.status) errors.push(`${where}: badge ${b} does not match ${sym} status ${sig.status}`);
      }
      if (sig.status === 'QUALIFIED' && script.type !== 'weekly_confirm' && script.type !== 'deep_dive' && script.type !== 'results') {
        warnings.push(`${where}: ${sym} is QUALIFIED but type is ${script.type}`);
      }
      if (sig.earnings_caution === true) earningsTickers.add(sym);
      // A late snapshot should not block the video: render without it, re-render when it lands.
      if (seg.onScreen.chart && !existsSync(chartPath(queueDir, sym))) {
        warnings.push(`${where}: no charts/${sym}.png yet — shown without the chart; the video re-renders when the snapshot is added`);
      }
    }
    if (seg.onScreen.chart && !seg.onScreen.tickers.length) errors.push(`${where}: chart requested without a ticker`);
    if (seg.onScreen.about) checkAbout(seg, where, packet, errors, warnings);
  }

  if (earningsTickers.size && !/earnings/i.test(spoken)) {
    errors.push(`earnings week: ${[...earningsTickers].join(', ')} needs a ~5 s line on the earnings date and volatility — ask Grok to add it`);
  }
  for (const sym of earningsTickers) {
    if (!signalFor(packet, sym).earnings_date) warnings.push(`${sym}: earnings_caution is true but earnings_date is empty`);
  }

  const timed = script.segments.filter((s) => !s.isEnd);
  for (let i = 1; i < timed.length; i++) {
    if (timed[i].start < timed[i - 1].end) warnings.push(`segments overlap at ${timed[i].start}s`);
  }
  if (!weekDirection(packet).known) warnings.push('packet.summary has no up/down week field (market_week or spy_week_change_pct) — using green body');
  if (Array.isArray(packet.notes) ? packet.notes.length : packet.notes) warnings.push(`packet.notes: ${JSON.stringify(packet.notes)}`);
  return { errors, warnings };
}
