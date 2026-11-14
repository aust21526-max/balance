// Minimal 16-bit PCM WAV read/write plus helpers for lip sync and TTS caching.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

export function readWav(path) {
  const buf = readFileSync(path);
  let off = 12, sampleRate = 24000, channels = 1, data = null;
  while (off < buf.length - 8) {
    const id = buf.toString('ascii', off, off + 4);
    const size = buf.readUInt32LE(off + 4);
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(off + 10);
      sampleRate = buf.readUInt32LE(off + 12);
      if (buf.readUInt16LE(off + 22) !== 16) throw new Error(`${path}: only 16-bit PCM is supported`);
    } else if (id === 'data') {
      data = buf.subarray(off + 8, off + 8 + size);
    }
    off += 8 + size + (size % 2);
  }
  const n = data.length / 2 / channels;
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) samples[i] = data.readInt16LE(i * 2 * channels) / 32768;
  return { sampleRate, samples };
}

export function writeWav(path, samples, sampleRate) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(sampleRate, 24); h.writeUInt32LE(sampleRate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([h, data]));
}

// RMS per video frame, normalised so the loudest frame of the clip is 1.
export function frameEnvelope({ samples, sampleRate }, fps) {
  const per = sampleRate / fps;
  const frames = Math.ceil(samples.length / per);
  const env = new Float32Array(frames);
  let peak = 1e-6;
  for (let f = 0; f < frames; f++) {
    let sum = 0, n = 0;
    for (let i = Math.floor(f * per); i < Math.min(samples.length, Math.floor((f + 1) * per)); i++, n++) sum += samples[i] ** 2;
    env[f] = Math.sqrt(sum / Math.max(n, 1));
    peak = Math.max(peak, env[f]);
  }
  for (let f = 0; f < frames; f++) env[f] /= peak;
  return env;
}

function pythonBin(root) {
  const win = join(root, '.venv', 'Scripts', 'python.exe');
  return existsSync(win) ? win : join(root, '.venv', 'bin', 'python');
}

// Synthesises each text once; results are cached by (engine, voice, speed, text) so
// re-rendering the same script gives byte-identical audio.
export function synthesize(root, cfg, texts, workDir) {
  const cacheDir = join(root, '.cache', 'tts', 'clips');
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(workDir, { recursive: true });
  const key = (t) => createHash('sha256').update(JSON.stringify([cfg.engine, cfg.voice, cfg.speed, t])).digest('hex').slice(0, 16);
  const todo = [];
  const paths = texts.map((t) => {
    const p = join(cacheDir, `${key(t)}.wav`);
    if (!existsSync(p)) todo.push({ text: t, out: p });
    return p;
  });
  if (todo.length) {
    if (cfg.engine !== 'kokoro') throw new Error(`TTS engine "${cfg.engine}" is not set up yet`);
    const job = join(workDir, 'tts-job.json');
    writeFileSync(job, JSON.stringify({
      model: resolve(root, cfg.model), voices: resolve(root, cfg.voices), voice: cfg.voice, speed: cfg.speed, items: todo,
    }));
    execFileSync(pythonBin(root), ['-I', join(root, 'tts', 'kokoro_tts.py'), job], { stdio: ['ignore', 'inherit', 'inherit'] });
  }
  return paths.map((p, i) => {
    const local = join(workDir, `seg-${i}.wav`);
    copyFileSync(p, local);
    return local;
  });
}
