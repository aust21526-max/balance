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

async function video() {
  const { srv, browser, page, duration } = await openPage();
  await mkdir(OUT, { recursive: true });
  const n = Math.round(duration * FPS);
  const silent = join(OUT, 'video-silent.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], async (stdin) => {
    for (let i = 0; i < n; i++) {
      const buf = await shot(page, i / FPS);
      if (!stdin.write(buf)) await new Promise((r) => stdin.once('drain', r));
      if (i % 60 === 0) process.stdout.write(`frame ${i}/${n}\r`);
    }
    stdin.end();
  });
  await browser.close(); srv.close();
  const wav = join(OUT, 'soundtrack.wav');
  await run('node', [join(ROOT, 'scripts', 'soundtrack.mjs'), wav]);
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', join(OUT, 'weekly-wick-promo.mp4')]);
  console.log('\nwrote out/weekly-wick-promo.mp4');
}

const [mode = 'stills', ...rest] = process.argv.slice(2);
if (mode === 'video') await video();
else {
  const times = rest.length ? rest.map(Number) : [0.6, 1.6, 2.6, 3.4, 4.3, 5.4, 6.3, 7.6, 10.2, 11.0, 12.0, 13.5, 14.5, 15.6, 17.0, 18.5, 20.0, 21.3, 22.5, 23.2, 24.0, 25.6, 27.5, 29.5];
  await stills(times);
}
