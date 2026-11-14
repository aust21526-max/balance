// Shared colours and drawing helpers for the video (lib/fast.mjs) and cards (lib/cards.mjs).
import { readFileSync } from 'node:fs';
import { esc, textWidth } from './text.mjs';

export const COLORS = {
  bg: '#10141f', panel: '#1a2030', line: '#2a3142', text: '#eef1f7', muted: '#9aa3b5',
  live: '#ffb020', confirmed: '#22c47a', qualified: '#22c47a', candidate: '#ffb020', earnings: '#ff6a3d', ink: '#1b1f2a',
};

const imageCache = new Map();
export function dataUri(path) {
  if (!imageCache.has(path)) imageCache.set(path, `data:image/png;base64,${readFileSync(path).toString('base64')}`);
  return imageCache.get(path);
}

export function pill(x, y, label, { bg, fg = COLORS.ink, size = 34, dot = false, anchor = 'start' }) {
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
