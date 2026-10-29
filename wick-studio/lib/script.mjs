// Parses Grok's script.md (format from 그록봇_운영지침.md §6):
//
//   type: weekly_confirm | candidate_race | deep_dive | results | friday_teaser
//   length_sec: 30 | 60
//   mood: excited | calm | tense | gloomy | apology
//   ---
//   [0-3s] (mood) line
//   [3-20s] (mood) line | ON-SCREEN: TICKER, QUALIFIED, chart snapshot
//   [end] CTA line

export const TYPES = ['weekly_confirm', 'candidate_race', 'deep_dive', 'results', 'friday_teaser'];
export const MOODS = ['excited', 'calm', 'tense', 'gloomy', 'apology'];
export const BADGES = ['QUALIFIED', 'CANDIDATE'];

// Words in ON-SCREEN lists that are never tickers.
const NOT_TICKERS = new Set([...BADGES, 'EARNINGS', 'WEEK', 'LIVE', 'CONFIRMED', 'CTA', 'TB', 'MON', 'SPY', 'ETF', 'AI', 'ABOUT']);

export function parseScript(text) {
  const errors = [];
  const [head, ...rest] = text.replace(/\r\n/g, '\n').split(/^---\s*$/m);
  if (!rest.length) errors.push('script.md: header/body separator "---" not found');
  const meta = {};
  for (const line of head.split('\n')) {
    const m = line.match(/^\s*([a-z_]+)\s*:\s*(.+?)\s*$/i);
    if (m) meta[m[1].toLowerCase()] = m[2];
  }
  const type = meta.type;
  const lengthSec = Number(meta.length_sec);
  const mood = meta.mood ?? 'calm';
  if (!TYPES.includes(type)) errors.push(`script.md: unknown type "${type}"`);
  if (![30, 60].includes(lengthSec)) errors.push(`script.md: length_sec must be 30 or 60 (got "${meta.length_sec}")`);
  if (!MOODS.includes(mood)) errors.push(`script.md: unknown mood "${mood}"`);

  const segments = [];
  const body = rest.join('---');
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^\[(end|(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*s?)\]\s*(.*)$/i);
    if (!m) {
      if (segments.length) segments[segments.length - 1].text += ' ' + line; // wrapped line
      continue;
    }
    const isEnd = m[1].toLowerCase() === 'end';
    let rest2 = m[4];
    let segMood = null;
    const mm = rest2.match(/^\(([a-z]+)\)\s*/i);
    if (mm) {
      segMood = mm[1].toLowerCase();
      rest2 = rest2.slice(mm[0].length);
      if (!MOODS.includes(segMood)) errors.push(`script.md: unknown mood "(${segMood})" in "${line}"`);
    }
    const [dialogue, onScreenRaw] = rest2.split(/\|\s*ON-SCREEN\s*:/i);
    segments.push({
      start: isEnd ? null : Number(m[2]),
      end: isEnd ? null : Number(m[3]),
      isEnd,
      mood: segMood ?? mood,
      text: dialogue.trim(),
      onScreen: parseOnScreen(onScreenRaw ?? ''),
      raw: line,
    });
  }
  if (!segments.length) errors.push('script.md: no [start-end s] segments found');
  return { type, lengthSec, mood, segments, errors };
}

export function parseOnScreen(raw) {
  const items = raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  const tickers = [];
  const badges = [];
  let chart = false;
  let about = false;
  const other = [];
  for (const item of items) {
    const up = item.toUpperCase();
    if (/chart|차트/i.test(item)) { chart = true; continue; }
    if (/^about$|기업\s*소개/i.test(item)) { about = true; continue; }
    const badge = BADGES.find((b) => up.includes(b));
    if (badge) { badges.push(badge); continue; }
    if (/EARNINGS\s*WEEK/i.test(item)) continue; // added automatically from the packet
    const t = item.match(/^\$?([A-Z][A-Z.]{0,5})$/);
    if (t && !NOT_TICKERS.has(t[1])) { tickers.push(t[1]); continue; }
    other.push(item);
  }
  return { tickers, badges, chart, about, other, raw: raw.trim() };
}
