// Procedural sound: cut whooshes, badge stamps, caption pops and a simple backing beat.
// Everything is synthesised from seeded noise and sine waves, so there are no music
// licences to worry about and every render sounds identical.
import { rng } from './motion.mjs';

export const SR = 48000;

function noiseBuf(n, seed) {
  const r = rng(seed);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r() * 2 - 1;
  return out;
}

function addAt(mix, buf, at, gain = 1) {
  const o = Math.round(at * SR);
  for (let i = 0; i < buf.length && o + i < mix.length; i++) if (o + i >= 0) mix[o + i] += buf[i] * gain;
}

// Rising band of filtered noise, ~0.3 s.
function whoosh(seed) {
  const n = Math.round(0.32 * SR), nz = noiseBuf(n, seed), out = new Float32Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n, cut = 0.02 + 0.35 * p;
    lp += cut * (nz[i] - lp);
    out[i] = lp * Math.sin(Math.PI * p) ** 1.5 * 1.6;
  }
  return out;
}

// Low thump + noise click, like a rubber stamp hitting paper.
function stamp(seed) {
  const n = Math.round(0.25 * SR), nz = noiseBuf(n, seed), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 140 * Math.exp(-t * 18) + 45;
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 16) * 0.9 + nz[i] * Math.exp(-t * 90) * 0.5;
  }
  return out;
}

function pop() {
  const n = Math.round(0.06 * SR), out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 900 + 1400 * Math.exp(-t * 60);
    ph += (2 * Math.PI * f) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 70) * 0.5;
  }
  return out;
}

// 120 bpm: kick on beats, hats on off-beats, a two-chord sub bass and a short pluck.
export function beat(total, seed = 11) {
  const mix = new Float32Array(Math.ceil(total * SR));
  const spb = 0.5, nz = noiseBuf(Math.round(0.05 * SR), seed);
  const kick = new Float32Array(Math.round(0.22 * SR));
  let ph = 0;
  for (let i = 0; i < kick.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (50 + 110 * Math.exp(-t * 30))) / SR;
    kick[i] = Math.sin(ph) * Math.exp(-t * 14);
  }
  const hat = nz.map((v, i) => (v - (nz[i - 1] ?? 0)) * Math.exp(-(i / SR) * 120) * 0.5);
  const roots = [55, 43.65]; // A1, F1
  const pluckNotes = [440, 523.25, 659.25, 523.25, 349.23, 440, 523.25, 440];
  for (let b = 0; b * spb < total; b++) {
    const t0 = b * spb;
    addAt(mix, kick, t0, 0.9);
    addAt(mix, hat, t0 + spb / 2, 0.6);
    const root = roots[Math.floor(b / 8) % 2];
    const bass = new Float32Array(Math.round(spb * SR));
    for (let i = 0; i < bass.length; i++) {
      const t = i / SR;
      bass[i] = Math.sin(2 * Math.PI * root * 2 * t) * Math.min(1, t * 80) * Math.exp(-t * 3) * 0.35;
    }
    addAt(mix, bass, t0);
    if (b % 2 === 1) {
      const f = pluckNotes[(b >> 1) % pluckNotes.length];
      const pl = new Float32Array(Math.round(0.3 * SR));
      for (let i = 0; i < pl.length; i++) {
        const t = i / SR;
        pl[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t * 12) * 0.12;
      }
      addAt(mix, pl, t0 + spb * 0.75);
    }
  }
  // Fade in/out.
  for (let i = 0; i < mix.length; i++) {
    const t = i / SR;
    mix[i] *= Math.min(1, t / 0.3, (total - t) / 0.6);
  }
  return mix;
}

// Linear resample of a mono clip to 48 kHz.
export function to48k(samples, sr) {
  if (sr === SR) return samples;
  const n = Math.round((samples.length * SR) / sr), out = new Float32Array(n), k = sr / SR;
  for (let i = 0; i < n; i++) {
    const x = i * k, j = Math.floor(x), f = x - j;
    out[i] = (samples[j] ?? 0) * (1 - f) + (samples[j + 1] ?? 0) * f;
  }
  return out;
}

// cues: [{ at, kind: 'whoosh' | 'stamp' | 'pop' }]
// voice: [{ at, samples (48k) }]
export function mixSoundtrack({ total, voice, cues, levels = { voice: 1, music: 0.16, sfx: 0.45 } }) {
  const n = Math.ceil(total * SR);
  const v = new Float32Array(n);
  for (const c of voice) addAt(v, c.samples, c.at);
  // Duck the music while someone is talking (smoothed envelope of the voice track).
  const music = beat(total);
  const duck = new Float32Array(n);
  let env = 0;
  for (let i = 0; i < n; i++) {
    const target = Math.abs(v[i]) > 0.01 ? 1 : 0;
    env += (target - env) * (target > env ? 0.01 : 0.0004);
    duck[i] = 1 - 0.55 * env;
  }
  const fx = new Float32Array(n);
  cues.forEach((c, i) => {
    const buf = c.kind === 'whoosh' ? whoosh(100 + i) : c.kind === 'stamp' ? stamp(200 + i) : pop();
    addAt(fx, buf, c.at, c.kind === 'pop' ? 0.5 : 1);
  });
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = v[i] * levels.voice + music[i] * levels.music * duck[i] + fx[i] * levels.sfx;
    out[i] = Math.tanh(s * 1.1) / Math.tanh(1.1); // gentle limiter
  }
  return out;
}
