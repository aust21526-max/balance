#!/usr/bin/env node
// Renders today's card straight from Google Drive, for the GitHub Actions run (.github/workflows/wick-card.yml
// on main) that covers for the PC when it sleeps through the card times.
//   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… GOOGLE_REFRESH_TOKEN=… node scripts/drive-card.mjs [YYYY-MM-DD]
// Downloads wick/queue/<date>/ (card.json, charts/, card.png, error.md) and the last 8 weeks of
// wick/packets/ into a temp folder with their Drive times, runs `render.mjs --pending` there (the same
// up-to-date check the PC uses), and uploads card.png or error.md if the render wrote one.
// The repo is public, so this prints file names and status only, never packet contents.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = process.env.WICK_QUEUE_FOLDER || '1q07qiHOETaJy4oWKOqmu1J-_jYJrCzQQ';
const PACKETS = process.env.WICK_PACKETS_FOLDER || '1jqIJx5F6W7_fCJewLTNmUKMBe0JlqSJY';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER = 'application/vnd.google-apps.folder';
const date = process.argv[2] ?? new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST

async function token() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token', refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: HTTP ${res.status}`);
  return (await res.json()).access_token;
}
const auth = { Authorization: `Bearer ${await token()}` };

async function drive(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...auth, ...init.headers } });
  if (!res.ok) throw new Error(`Drive ${init.method ?? 'GET'} ${url.split('?')[0]}: HTTP ${res.status}`);
  return res;
}
async function list(parent) {
  const q = encodeURIComponent(`'${parent}' in parents and trashed = false`);
  const out = [];
  let page = '';
  do {
    const r = await (await drive(`${API}/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,modifiedTime)&pageSize=1000${page ? `&pageToken=${page}` : ''}`)).json();
    out.push(...r.files);
    page = r.nextPageToken;
  } while (page);
  return out;
}
async function download(file, path) {
  writeFileSync(path, Buffer.from(await (await drive(`${API}/files/${file.id}?alt=media`)).arrayBuffer()));
  const t = new Date(file.modifiedTime);
  utimesSync(path, t, t);
}
async function upload(parent, existing, name, path, type) {
  const body = readFileSync(path);
  if (existing) return drive(`${UPLOAD}/files/${existing.id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': type }, body });
  const boundary = `wick${Date.now()}`;
  const multipart = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ name, parents: [parent] })}\r\n--${boundary}\r\nContent-Type: ${type}\r\n\r\n`),
    body, Buffer.from(`\r\n--${boundary}--`),
  ]);
  return drive(`${UPLOAD}/files?uploadType=multipart`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart });
}
const trash = (file) => drive(`${API}/files/${file.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trashed: true }) });

const day = (await list(QUEUE)).find((f) => f.name === date && f.mimeType === FOLDER);
if (!day) { console.log(`${date}: no queue folder`); process.exit(0); }
const files = await list(day.id);
const byName = (n) => files.find((f) => f.name === n && f.mimeType !== FOLDER);
if (!byName('card.json')) { console.log(`${date}: no card.json`); process.exit(0); }

const wick = mkdtempSync(join(tmpdir(), 'wick-'));
const q = join(wick, 'queue', date);
mkdirSync(join(q, 'charts'), { recursive: true });
mkdirSync(join(wick, 'packets'));
for (const n of ['card.json', 'card.png', 'error.md']) if (byName(n)) await download(byName(n), join(q, n));
const charts = files.find((f) => f.name === 'charts' && f.mimeType === FOLDER);
if (charts) for (const f of await list(charts.id)) if (/\.png$/i.test(f.name)) await download(f, join(q, 'charts', f.name));
const from = new Date(Date.parse(`${date}T00:00:00Z`) - 56 * 86400e3).toISOString().slice(0, 10);
let packets = 0;
for (const f of await list(PACKETS)) {
  if (!/^\d{4}-\d{2}-\d{2}\.json$/.test(f.name) || f.name.slice(0, 10) > date || f.name.slice(0, 10) < from) continue;
  await download(f, join(wick, 'packets', f.name));
  packets++;
}

const mtime = (p) => (existsSync(p) ? statSync(p).mtimeMs : 0);
const before = { card: mtime(join(q, 'card.png')), error: mtime(join(q, 'error.md')) };
console.log(`${date}: card.json + ${packets} packets downloaded, rendering if out of date`);
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const days = Math.max(0, Math.round((Date.parse(today) - Date.parse(date)) / 86400e3)); // reach back to <date> when it is given
const run = spawnSync(process.execPath, ['render.mjs', '--pending', String(days)], { cwd: ROOT, env: { ...process.env, WICK_DIR: wick }, encoding: 'utf8' });
const rendered = mtime(join(q, 'card.png')) > before.card;
const failed = mtime(join(q, 'error.md')) > before.error;

if (rendered) {
  await upload(day.id, byName('card.png'), 'card.png', join(q, 'card.png'), 'image/png');
  if (byName('error.md')) await trash(byName('error.md'));
  console.log(`${date}: card.png uploaded`);
} else if (failed) {
  await upload(day.id, byName('error.md'), 'error.md', join(q, 'error.md'), 'text/markdown');
  console.log(`${date}: render failed, error.md uploaded for Grok`);
  process.exit(1);
} else {
  console.log(`${date}: card.png already up to date`);
}
if (run.status !== 0 && !failed) { console.error(`render exited ${run.status}`); process.exit(1); }
