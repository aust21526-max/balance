// Render the Weekly Wick promo.
//   node scripts/render.mjs stills [t1 t2 ...]   -> out/stills/*.png + out/contact.png
//   node scripts/render.mjs video                -> out/frames piped into out/weekly-wick-promo.mp4 (with soundtrack)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out');
const FPS = 30;
const TYPES = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.otf': 'font/otf' };

function serve() {
  return new Promise((ok) => {
    const srv = createServer(async (req, res) => {
      try {
        const p = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
        if (!p.startsWith(ROOT)) throw new Error('outside root');
        const body = await readFile(p.endsWith('/') ? join(p, 'index.html') : p);
        res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

function run(cmd, args, stdinFeed) {
  return new Promise((ok, fail) => {
    const p = spawn(cmd, args, { stdio: [stdinFeed ? 'pipe' : 'ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? ok() : fail(new Error(`${cmd} exited ${c}`))));
    if (stdinFeed) stdinFeed(p.stdin);
  });
}

async function openPage() {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html`);
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);
  return { srv, browser, page, duration };
}

async function shot(page, t) {
  await page.evaluate((x) => window.seek(x), t);
  return page.locator('#stage').screenshot({ type: 'png' });
}

async function stills(times) {
  const { srv, browser, page } = await openPage();
  const dir = join(OUT, 'stills');
  await mkdir(dir, { recursive: true });
  const files = [];
  for (const t of times) {
    const f = join(dir, `t${t.toFixed(2).padStart(5, '0')}.png`);
    await (await import('node:fs/promises')).writeFile(f, await shot(page, t));
    files.push(f);
  }
  await browser.close(); srv.close();
  // Contact sheet: 6 per row, each still scaled to 270x480 with its time burned in.
  const cols = 6, rows = Math.ceil(files.length / cols);
  const inputs = files.flatMap((f) => ['-i', f]);
  const labels = files.map((_, i) => `[${i}:v]scale=270:480,drawtext=text='${times[i].toFixed(2)}s':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const pads = files.length < rows * cols ? Array.from({ length: rows * cols - files.length }, (_, k) => `color=c=black:s=270x480:d=1[p${k}]`).join(';') + ';' : '';
  const stack = files.map((_, i) => `[v${i}]`).join('') + Array.from({ length: rows * cols - files.length }, (_, k) => `[p${k}]`).join('');
  const layout = Array.from({ length: rows * cols }, (_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
  await run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${pads}${labels};${stack}xstack=inputs=${rows * cols}:layout=${layout}`, '-frames:v', '1', join(OUT, 'contact.png')]);
  console.log(`wrote ${files.length} stills and out/contact.png`);
}

// Frames go to disk first and existing frames are skipped, so a crash never costs the whole render.
// `from`/`to` (seconds) render a test range; the full film is the default.
async function video(from = 0, to = null, name = 'weekly-wick-promo') {
  const { srv, browser, page, duration } = await openPage();
  const { writeFile, access } = await import('node:fs/promises');
  const { createHash } = await import('node:crypto');
  const h = createHash('sha1');
  for (const f of ['index.html', 'lib/rig.mjs', 'lib/drafts.mjs']) h.update(await readFile(join(ROOT, f)));
  const frames = join(OUT, `frames-${h.digest('hex').slice(0, 10)}`); // new scene source = new frame cache
  await mkdir(frames, { recursive: true });
  const end = to ?? duration;
  const i0 = Math.round(from * FPS), i1 = Math.round(end * FPS);
  const t0 = Date.now();
  let made = 0;
  for (let i = i0; i < i1; i++) {
    const f = join(frames, `f${String(i).padStart(5, '0')}.png`);
    if (await access(f).then(() => true, () => false)) continue;
    await writeFile(f, await shot(page, i / FPS));
    made++;
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${i1}\r`);
  }
  const cues = await page.evaluate(() => window.CUES || []);
  await browser.close(); srv.close();
  if (made) console.log(`\n${made} frames, ${((Date.now() - t0) / 1000 / made).toFixed(3)} s per frame`);
  const cueFile = join(OUT, 'cues.json'), wav = join(OUT, 'soundtrack.wav');
  await writeFile(cueFile, JSON.stringify({ duration, cues }));
  await run('node', [join(ROOT, 'scripts', 'soundtrack.mjs'), cueFile, wav]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-start_number', String(i0), '-i', join(frames, 'f%05d.png'),
    '-ss', String(from), '-t', String(end - from), '-i', wav,
    '-frames:v', String(i1 - i0), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', join(OUT, `${name}.mp4`)]);
  console.log(`wrote out/${name}.mp4`);
}

// Contact sheet from a list of PNGs (cols x rows of 270x480 cells, time burned in).
async function sheet(files, labels, out, cols = 6) {
  const rows = Math.ceil(files.length / cols), cells = rows * cols;
  const inputs = files.flatMap((f) => ['-i', f]);
  const lab = files.map((_, i) => `[${i}:v]scale=270:480,drawtext=text='${labels[i]}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(';');
  const pads = cells > files.length ? Array.from({ length: cells - files.length }, (_, k) => `color=c=black:s=270x480:d=1[p${k}]`).join(';') + ';' : '';
  const stack = files.map((_, i) => `[v${i}]`).join('') + Array.from({ length: cells - files.length }, (_, k) => `[p${k}]`).join('');
  const layout = Array.from({ length: cells }, (_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|');
  await run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', `${pads}${lab};${stack}xstack=inputs=${cells}:layout=${layout}`, '-frames:v', '1', out]);
}

// Cook harness: fixed shot stills (cook/SHOTS.md), a 24-frame contact sheet and an 8-frame strip around every cut.
const SHOTS = { S01: 0, S02: 3.9, S03: 7.2, S04: 12.6, S05: 17.4, S06: 23.0, S07: 28.6 };
async function shots(round) {
  const COOK = resolve(ROOT, '..', '..', 'cook');
  const dir = join(COOK, 'stills', `r${round}`);
  await mkdir(join(dir, 'frames'), { recursive: true });
  const { srv, browser, page } = await openPage();
  const { writeFile } = await import('node:fs/promises');
  for (const [k, t] of Object.entries(SHOTS)) await writeFile(join(dir, `${k}.png`), await shot(page, t));
  const sheetTimes = Array.from({ length: 24 }, (_, i) => +(0.0 + i * 1.27).toFixed(2));
  const cuts = Object.values(await page.evaluate(() => window.SCENES)).map((s) => s[0]).slice(1);
  const strips = cuts.flatMap((c) => [-0.4, -0.27, -0.13, 0, 0.1, 0.2, 0.35, 0.6].map((d) => +(c + d).toFixed(2)));
  const all = [...new Set([...sheetTimes, ...strips])];
  const files = {};
  for (const t of all) { const f = join(dir, 'frames', `t${t.toFixed(2).padStart(5, '0')}.png`); await writeFile(f, await shot(page, t)); files[t] = f; }
  await browser.close(); srv.close();
  await sheet(sheetTimes.map((t) => files[t]), sheetTimes.map((t) => `${t.toFixed(2)}s`), join(dir, 'contact.png'));
  await sheet(strips.map((t) => files[t]), strips.map((t) => `${t.toFixed(2)}s`), join(dir, 'cuts.png'), 8);
  console.log(`wrote ${dir}: ${Object.keys(SHOTS).length} shots, contact.png, cuts.png`);
}

const [mode = 'stills', ...rest] = process.argv.slice(2);
if (mode === 'video') await video();
else if (mode === 'test') await video(Number(rest[0] ?? 0), Number(rest[1] ?? 4), 'test'); // pipeline test on a short range
else if (mode === 'shots') await shots(rest[0] || '01');
else {
  const times = rest.length ? rest.map(Number) : [0.6, 1.6, 2.6, 3.4, 4.3, 5.4, 6.3, 7.6, 10.2, 11.0, 12.0, 13.5, 14.5, 15.6, 17.0, 18.5, 20.0, 21.3, 22.5, 23.2, 24.0, 25.6, 27.5, 29.5];
  await stills(times);
}
