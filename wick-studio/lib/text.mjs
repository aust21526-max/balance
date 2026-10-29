export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Greedy word wrap using an average glyph width (Inter ≈ 0.56 em for mixed text).
export function wrap(text, fontSize, maxWidth, ratio = 0.56) {
  const maxChars = Math.max(4, Math.floor(maxWidth / (fontSize * ratio)));
  const lines = [];
  let cur = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (!cur) cur = word;
    else if ((cur + ' ' + word).length <= maxChars) cur += ' ' + word;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}

export const textWidth = (s, fontSize, ratio = 0.6) => String(s).length * fontSize * ratio;
