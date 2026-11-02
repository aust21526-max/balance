#!/usr/bin/env node
// A TradingView weekly screenshot with the signal marks drawn on, for posting on its own.
//   node scripts/mark-chart.mjs <in.png> <out.png> [--focus] [--move <alert price>:<weekly close>]
// Earlier MJ TB / MON signals get a ring and a dashed arrow to the high that followed (only where the
// chart shows a clear rise); the latest signal gets the yellow ring. --focus crops to the recent part.
import { Resvg } from '@resvg/resvg-js';
import { writeFileSync } from 'node:fs';
import { chartMarks, focusRect, markedChart, moveNoteSvg } from '../lib/chart-marks.mjs';
import { dataUri } from '../lib/scene.mjs';

const args = process.argv.slice(2);
const [input, output] = args;
const flag = args.includes('--focus') ? '--focus' : null;
const mv = args[args.indexOf('--move') + 1]?.split(':').map(Number);
const move = args.includes('--move') && mv?.[0] > 0 && mv?.[1] > 0 ? { from: mv[0], to: mv[1], pct: (mv[1] / mv[0] - 1) * 100 } : null;
if (!input || !output) { console.error('usage: node scripts/mark-chart.mjs <in.png> <out.png> [--focus]'); process.exit(1); }
const m = chartMarks(input);
if (!m) { console.error(`${input}: could not read the chart (ffmpeg needed)`); process.exit(1); }
const W = 2000, H = flag === '--focus' ? 1600 : Math.round((W * m.H) / m.W);
const view = flag === '--focus' ? focusRect(m, W / H, 0.4) : null;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${markedChart({ x: 0, y: 0, w: W, h: H }, dataUri(input), m, view)}${moveNoteSvg(move, 60, 90, 1.6)}</svg>`;
writeFileSync(output, new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
console.log(`${output}: ${m.latest.length ? 'latest signal ringed' : 'no latest label found'}, ${m.past.length} earlier signal(s) marked`);
