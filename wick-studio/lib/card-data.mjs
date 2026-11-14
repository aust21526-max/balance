// card.json (written by Grok) -> resolved card data + pre-render checks (handoff §3).
//
// {
//   "template": "verdict" | "results" | "race",
//   "title": "≤ 6 words",
//   "subtitle": "≤ 12 words",            optional
//   "mood": "excited" | "calm" | "tense" | "gloomy" | "apology",   optional
//   "items": [{ "symbol": "NVDA", "about": true }],   verdict/results only; race has none ("ticker" also accepted)
//   "chart": "NVDA"                       optional, uses charts/NVDA.png (verdict only)
// }
// "anatomy" is a drawn schematic of how a signal is confirmed or vanishes (no market data):
//   { "template": "anatomy", "title": "…", "variant": "both" | "qualified" | "vanished" }
// "track" (Tuesday) follows up past free picks: items optional, default = every free pick
// of the last 8 weeks; each row shows its latest grade from later monday_confirm packets.
//
// Stamps are never taken from card.json: they come from the packet (status, publish,
// earnings_caution, monday.new_closes), so a card cannot mislabel a stock.
import { existsSync } from 'node:fs';
import { packetNumbers, publicSymbols, qualifiedCount, signalFor, signals, weekDirection } from './packet.mjs';
import { MOODS } from './script.mjs';
import { chartPath, membersWord } from './validate.mjs';

export const TEMPLATES = ['verdict', 'results', 'race', 'track', 'anatomy', 'basket', 'index', 'copy', 'heatmap', 'leader', 'surge'];
// Performance cards (2026-11-11, special growth period): they read wick/boards/<date>.json blocks written by
// Claude from the ledger and daily prices — index (Top-10 Index vs SPY), copy ("if you'd copied the list"),
// heatmap (weeks × names, names hidden except the leader), leader (the top name since its list, with its chart),
// surge (signals that were never featured publicly but ran). Figures are printed as given, never from card.json.
export const BOARD_TEMPLATES = { index: 'index', copy: 'copy', heatmap: 'heatmap', leader: 'leader', surge: 'surge' };
const BANNED = /\b(scores?|scored|ranked|ranking|rank|top pick|number one|highest|best|guarantee[sd]?|sure thing|must buy|buy now|buy|sell)\b|#\s?1\b/i;
const PRICE_OR_PCT = /%|\bpercent\b|\$\s?\d|\d+(\.\d+)?\s?(usd|dollars?)\b/i;
const words = (s) => String(s ?? '').trim().split(/\s+/).filter(Boolean).length;

const PARTIAL = new Set(['FIRST TARGET', 'SECOND TARGET']);

// Result figures (guides/추가지침_성과공개.md): free picks only, and only once the whole position has
// closed, wins and losses alike. Partial take-profits still hold an open part, so they show no %.
const num = (v) => (v === null || v === undefined || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const finalFigures = (stamp, c) => (stamp && !PARTIAL.has(stamp) ? { resultPct: num(c.result_pct), vsSpyPct: num(c.vs_spy_pct), takePct: null } : { resultPct: null, vsSpyPct: null, takePct: PARTIAL.has(stamp) ? num(c.target_gain_pct) : null });
// A partial take-profit shows only the gain on the part sold at that target (target_gain_pct), never the open rest.
export const TAKE_SHARE = { 'FIRST TARGET': '25%', 'SECOND TARGET': '50%' };

// Normalises the many ways exit_kind may be spelled in the ledger.
export function exitStamp(kind, target) {
  const k = String(kind ?? '').toLowerCase();
  // Partial take-profits: a quarter at the middle band (FIRST TARGET), half at the upper band (SECOND TARGET).
  // The rest is still open, so neither is a win yet.
  if (/partial/.test(k)) return /upper/i.test(String(target ?? '')) ? 'SECOND TARGET' : 'FIRST TARGET';
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
  const n = Number(s.candidates ?? s.candidate_count ?? s.passed_50);
  return Number.isFinite(n) ? n : signals(packet).filter((x) => x.status === 'CANDIDATE').length;
}

// Past free picks and their latest grade, from the packets of the last 8 weeks (oldest
// first). A pick stays STILL OPEN until a later Monday packet closes or vanishes it.
export function trackedPicks(history) {
  const picks = new Map();
  for (const p of history) {
    if (p.packet_type === 'weekly_verdict') {
      for (const sym of (Array.isArray(p.free_picks) ? p.free_picks : []).map((x) => String(typeof x === 'string' ? x : x?.symbol).toUpperCase())) {
        const sig = signalFor(p, sym);
        if (!picks.has(sym)) picks.set(sym, { symbol: sym, company: sig?.company, signalWeek: sig?.signal_week, picked: p.snapshot_date, stamp: 'STILL OPEN', vsSpy: null, resultPct: null, vsSpyPct: null });
      }
    }
    if (p.packet_type === 'monday_confirm') {
      const m = p.monday ?? {};
      for (const v of Array.isArray(m.vanished) ? m.vanished : []) {
        const pick = picks.get(String(v?.symbol ?? v).split(':').pop().toUpperCase());
        if (pick && pick.stamp === 'STILL OPEN') pick.stamp = 'VANISHED';
      }
      for (const c of Array.isArray(m.new_closes) ? m.new_closes : []) {
        // Packet symbols carry the exchange (NYSE:EFC); free_picks are bare tickers.
        const pick = picks.get(String(c.symbol).split(':').pop().toUpperCase());
        if (!pick || (pick.signalWeek && c.signal_week && pick.signalWeek !== c.signal_week)) continue;
        const v = Number(c.vs_spy_pct);
        pick.stamp = exitStamp(c.exit_kind, c.target) ?? pick.stamp;
        // vs SPY is only final once the whole position has closed.
        pick.vsSpy = !PARTIAL.has(pick.stamp) && Number.isFinite(v) ? (v >= 0 ? 'BEAT SPY' : 'TRAILED SPY') : null;
        Object.assign(pick, finalFigures(pick.stamp, c));
      }
    }
  }
  return [...picks.values()];
}

// The anatomy card is an illustration: no tickers, no numbers, no packet needed.
function resolveAnatomy(card, errors, warnings) {
  const variant = card.variant ?? 'both';
  if (!['both', 'qualified', 'vanished'].includes(variant)) errors.push(`card.json: variant must be both, qualified or vanished (got "${variant}")`);
  for (const [field, text] of [['title', card.title], ['subtitle', card.subtitle]]) {
    if (!text) continue;
    const bad = text.match(BANNED);
    if (bad) errors.push(`card.json ${field}: "${bad[0]}" — scores, rankings and advice wording are not allowed`);
    const mem = membersWord(text);
    if (mem) errors.push(`card.json ${field}: "${mem}" — the members site isn't open yet; don't mention members (config.json members_open)`);
    if (/\d/.test(text)) errors.push(`card.json ${field}: the anatomy card is an illustration — no numbers`);
    if (/\$[A-Z]/.test(text)) errors.push(`card.json ${field}: the anatomy card names no stocks`);
  }
  if (Array.isArray(card.items) && card.items.length) errors.push('anatomy card must not name stocks — remove items');
  if (card.chart) errors.push('anatomy card is a drawing — remove chart');
  return { errors, warnings, card: {
    template: 'anatomy', type: 'anatomy', title: card.title, subtitle: card.subtitle ?? '', variant,
    mood: card.mood ?? 'calm', flameSize: 0.75, up: true, rows: [], chart: null, stats: {},
  } };
}

export function resolveCard(card, packet, queueDir, history = []) {
  const errors = [], warnings = [];
  const t = card.template;
  if (!TEMPLATES.includes(t)) errors.push(`card.json: template must be one of ${TEMPLATES.join(', ')} (got "${t}")`);
  if (!card.title) errors.push('card.json: title is required');
  if (words(card.title) > 6) errors.push(`card.json: title is ${words(card.title)} words (max 6)`);
  if (words(card.subtitle) > 12) errors.push(`card.json: subtitle is ${words(card.subtitle)} words (max 12)`);
  if (card.mood && !MOODS.includes(card.mood)) errors.push(`card.json: unknown mood "${card.mood}"`);
  if (t === 'anatomy') return resolveAnatomy(card, errors, warnings);
  if (!packet) { errors.push('packet: no packets/<YYYY-MM-DD>.json on or before this date'); return { errors, warnings }; }

  const numbers = packetNumbers(packet);
  for (const p of history) for (const n of packetNumbers(p)) numbers.add(n);
  for (const [field, text] of [['title', card.title], ['subtitle', card.subtitle]]) {
    if (!text) continue;
    const bad = text.match(BANNED);
    if (bad) errors.push(`card.json ${field}: "${bad[0]}" — scores, rankings and advice wording are not allowed`);
    const mem = membersWord(text);
    if (mem) errors.push(`card.json ${field}: "${mem}" — the members site isn't open yet; don't mention members (config.json members_open)`);
    if (PRICE_OR_PCT.test(text)) errors.push(`card.json ${field}: no prices or % in card text — result % for free picks is printed from the packet by the renderer`);
    for (const m of text.matchAll(/\d+(?:\.\d+)?/g)) if (!numbers.has(m[0])) errors.push(`card.json ${field}: number "${m[0]}" is not in the packet`);
  }

  const items = Array.isArray(card.items) ? card.items : [];
  const out = {
    template: t, title: card.title, subtitle: card.subtitle ?? '',
    type: { verdict: 'weekly_confirm', results: 'results', track: 'track', basket: 'basket' }[t] ?? (BOARD_TEMPLATES[t] ? 'basket' : 'candidate_race'),
    mood: card.mood ?? { verdict: 'excited', results: 'calm', race: 'tense', track: 'calm', basket: 'excited', index: 'excited', copy: 'excited', heatmap: 'calm', leader: 'excited', surge: 'excited' }[t] ?? 'calm',
    flameSize: null, up: weekDirection(packet).up, rows: [], chart: null, stats: {},
  };

  if (t === 'verdict') {
    out.stats.qualified = qualifiedCount(packet);
    const allowed = publicSymbols(packet);
    for (const it of items) {
      const sym = String(it.symbol ?? it.ticker ?? '').toUpperCase();
      const sig = signalFor(packet, sym);
      if (!sig) { errors.push(`items: ${sym} is not in packet.signals`); continue; }
      if (!allowed.has(sym)) { errors.push(`items: ${sym} is not a free pick or vanished log (publish: "${sig.publish ?? '-'}")`); continue; }
      const vanished = sig.publish === 'free post: vanished log';
      // Vanished names carry publish_eligible: null in real packets; their publish value is what clears them.
      if (!vanished && sig.publish_eligible !== true) errors.push(`items: ${sym} has publish_eligible != true`);
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
      else if (!existsSync(chartPath(queueDir, sym))) warnings.push(`chart: no charts/${sym}.png yet — card made without it; it re-renders when the snapshot is added`);
      else { out.chart = chartPath(queueDir, sym); out.chartSignal = signalFor(packet, sym); }
    }
  }

  if (t === 'results') {
    const list = closes(packet);
    if (!list.length) errors.push('results card: packet.monday.new_closes is empty — no signal closed this week, so skip the results card (post the text only)');
    const pick = items.length ? items.map((i) => String(i.symbol ?? i.ticker).toUpperCase()) : list.map((c) => String(c.symbol).toUpperCase());
    // Which closes were free picks (same signal week): only those carry result figures.
    const free = new Set(trackedPicks(history).map((p) => `${p.symbol}|${p.signalWeek ?? ''}`));
    const bare = (s) => String(s).split(':').pop().toUpperCase();
    for (const sym of pick) {
      const c = list.find((x) => bare(x.symbol) === bare(sym));
      if (!c) { errors.push(`items: ${sym} is not in packet.monday.new_closes`); continue; }
      const stamp = exitStamp(c.exit_kind, c.target);
      if (!stamp) errors.push(`items: ${sym} has unknown exit_kind "${c.exit_kind}"`);
      const v = Number(c.vs_spy_pct);
      const final = !PARTIAL.has(stamp);
      const isFree = free.has(`${bare(sym)}|${c.signal_week ?? ''}`) || free.has(`${bare(sym)}|`);
      out.rows.push({ symbol: bare(sym), company: signalFor(packet, sym)?.company ?? c.company, stamp, vsSpy: final && Number.isFinite(v) ? (v >= 0 ? 'BEAT SPY' : 'TRAILED SPY') : null,
        ...(isFree ? finalFigures(stamp, c) : { resultPct: null, vsSpyPct: null, takePct: null }) });
    }
    const sc = packet.monthly_scorecard;
    // The monthly scorecard posts every month, good or bad, so its averages are shown whenever it is in the packet.
    if (sc) out.stats.scorecard = { month: /^\d{4}-\d{2}$/.test(sc.month ?? '') ? sc.month : null, wins: sc.wins, losses: sc.losses, beatSpy: sc.beat_spy ?? sc.beat_spy_count, closed: num(sc.signals_closed), avgRet: num(sc.avg_ret_pct), avgExcess: num(sc.avg_excess_vs_spy_pct) };
    const finals = out.rows.filter((r) => !PARTIAL.has(r.stamp));
    const losses = finals.filter((r) => r.stamp === 'STOPPED OUT').length;
    if (!card.mood && losses > finals.length - losses) out.mood = 'apology';
  }

  // Top-10 basket: the packet's top10_board (every week's member rank 1-10 at their latest grade),
  // printed as given. Up to three leaders, always beside the in-profit count and the SPY comparison.
  if (t === 'basket') {
    const b = packet.top10_board;
    if (!b || num(b.avg_ret_pct) === null || !num(b.signals)) errors.push('basket card: packet.top10_board is missing or empty');
    else {
      out.stats.board = { label: b.label ?? 'TOP 10 BASKET', asOf: b.as_of ?? null, signals: num(b.signals), inProfit: num(b.in_profit), avgRet: num(b.avg_ret_pct), vsSpy: num(b.avg_vs_spy_pp), footnote: b.footnote ?? null };
      out.rows = (Array.isArray(b.leaders) ? b.leaders : []).slice(0, 3).map((l) => ({ symbol: String(l.symbol).split(':').pop().toUpperCase(), ret: num(l.ret_pct) })).filter((r) => r.ret !== null);
      if (out.stats.board.inProfit === null) errors.push('basket card: top10_board.in_profit is required (leaders are never shown without it)');
      if (out.stats.board.avgRet < 0 && !card.mood) out.mood = 'gloomy';
    }
    // The hook is the basket's leader (the panel below already carries the average, the in-profit count and SPY).
    if (out.stats.board) {
      const lead = out.rows[0];
      out.hook = lead && lead.ret > 0
        ? { value: lead.ret, unit: '%', kicker: `$${lead.symbol}, the leader · ${out.stats.board.inProfit} of ${out.stats.board.signals} in profit` }
        : { value: out.stats.board.avgRet, unit: '%', kicker: `avg per signal · ${out.stats.board.inProfit} of ${out.stats.board.signals} in profit` };
    }
    if (items.length) errors.push('basket card: leaders come from packet.top10_board — remove items');
    if (card.chart) errors.push('basket card must not show a chart');
  }

  if (BOARD_TEMPLATES[t]) {
    // A leader card may name a stock: its figures come from the board's spotlight block (free picks and
    // published leaders only, written by board-blocks.mjs).
    const want = t === 'leader' && card.symbol ? String(card.symbol).toUpperCase() : null;
    const block = want ? packet.board_extra?.spotlight?.[want] && { symbol: want, ...packet.board_extra.spotlight[want] } : packet.board_extra?.[t];
    if (want && !block) errors.push(`leader card: ${want} is not in the board's spotlight block (free picks and leaders only)`);
    if (!block) errors.push(`${t} card: wick/boards/<date>.json has no "${t}" block`);
    else {
      const bad = boardBlockErrors(t, block);
      errors.push(...bad);
      if (!bad.length) out.stats[t] = block;
      if (t === 'leader' && block.symbol) {
        const sym = String(block.symbol).toUpperCase();
        out.rows = [{ symbol: sym, ret: num(block.ret_pct) }];
        if (existsSync(chartPath(queueDir, sym))) out.chart = chartPath(queueDir, sym);
        else warnings.push(`leader card: no charts/${sym}.png — made without the chart`);
      }
      const lead = t === 'copy' ? num(block.avg_ret_pct) : t === 'index' ? num(block.points?.at(-1)?.[1]) - 100 : null;
      if (lead !== null && lead < 0 && !card.mood) out.mood = 'gloomy';
      if (!bad.length) out.hook = hookFor(t, block);
    }
    if (items.length) errors.push(`${t} card: names come from the board — remove items`);
    if (card.chart && t !== 'leader') errors.push(`${t} card must not show a chart`);
  }

  if (t === 'track') {
    const picks = trackedPicks(history);
    if (!picks.length) errors.push('track card: no free picks in the weekly_verdict packets of the last 8 weeks');
    const want = items.map((i) => String(i.symbol ?? i.ticker).toUpperCase());
    for (const sym of want) if (!picks.some((p) => p.symbol === sym)) errors.push(`items: ${sym} was not a free pick in the last 8 weeks — only past free picks can be tracked by name`);
    out.rows = want.length ? picks.filter((p) => want.includes(p.symbol)) : picks;
    const losses = out.rows.filter((r) => r.stamp === 'STOPPED OUT').length;
    const wins = out.rows.filter((r) => r.stamp === 'TAKE-PROFIT' || r.stamp === 'TRAILING EXIT').length;
    if (!card.mood && losses > wins) out.mood = 'apology';
    if (card.chart) errors.push('track card must not show a chart');
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

// Shape checks for the performance-card board blocks. Figures must be finite numbers; the copy and index
// cards always carry the SPY comparison and the in-profit count beside any gain (no figure without context).
function boardBlockErrors(t, b) {
  const e = [];
  const fin = (v) => Number.isFinite(Number(v)) && v !== null && v !== '';
  if (t === 'index') {
    if (!Array.isArray(b.points) || b.points.length < 2) e.push('index: points needs at least two [date, index, spy] rows');
    else if (!b.points.every((p) => Array.isArray(p) && p.length === 3 && fin(p[1]) && fin(p[2]))) e.push('index: every point is [date, index, spy] with numbers');
    if (!b.since) e.push('index: since (e.g. "Oct 23") is required');
  }
  if (t === 'copy') for (const k of ['signals', 'in_profit', 'avg_ret_pct', 'spy_ret_pct', 'avg_vs_spy_pp']) if (!fin(b[k])) e.push(`copy: ${k} is required`);
  if (t === 'copy' && !b.label) e.push('copy: label (e.g. "Oct 24 list") is required');
  if (t === 'heatmap') {
    if (!Array.isArray(b.weeks) || !b.weeks.length) e.push('heatmap: weeks is required');
    else for (const w of b.weeks) if (!w.label || !Array.isArray(w.cells) || !w.cells.every((c) => fin(c.ret_pct))) e.push(`heatmap: week ${w.label ?? '?'} needs a label and cells with ret_pct`);
  }
  if (t === 'leader') {
    if (!b.symbol || !fin(b.ret_pct) || !b.list_label) e.push('leader: symbol, ret_pct and list_label are required');
    if (!fin(b.in_profit) || !fin(b.signals)) e.push('leader: in_profit and signals (its list) are required — the leader never shows alone');
  }
  if (t === 'surge') {
    if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > 3) e.push('surge: rows needs 1–3 names');
    else if (!b.rows.every((r) => r.symbol && fin(r.ret_pct) && r.since)) e.push('surge: each row needs symbol, ret_pct and since');
  }
  return e;
}

// The scroll-stopping figure printed huge at the top of a performance card, with a one-line kicker.
const sgn = (v, unit) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)}${unit}`;
function hookFor(t, b) {
  if (t === 'index') { const l = b.points.at(-1); const w = Number(l[1]) - 100, s = Number(l[2]) - 100; return { value: w - s, unit: 'pp', kicker: `Top 10 Index ${sgn(w, '%')} vs SPY ${sgn(s, '%')} since ${b.since}` }; }
  if (t === 'copy') return { value: Number(b.avg_ret_pct), unit: '%', kicker: `${b.label} · SPY ${sgn(Number(b.spy_ret_pct), '%')} over the same days` };
  if (t === 'leader') return { value: Number(b.ret_pct), unit: '%', kicker: `$${b.symbol} since our ${b.list_label}` };
  if (t === 'surge') { const r = b.rows[0]; return { value: Number(r.ret_pct), unit: '%', kicker: `$${r.symbol} since the ${r.since} signal — never posted here` }; }
  if (t === 'heatmap') { const cells = b.weeks.flatMap((w) => w.cells); const up = cells.filter((c) => Number(c.ret_pct) > 0).length; return { value: null, text: `${up} of ${cells.length}`, kicker: `names in profit across the last ${b.weeks.length} lists` }; }
  return null;
}
