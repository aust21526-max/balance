// Code-made soundtrack: wick-studio's synthesised beat + whoosh / stamp / pop cues.
// usage: node scripts/soundtrack.mjs cues.json out.wav   (cues.json = { duration, cues: [{ at, kind }] })
import { readFileSync, writeFileSync } from 'node:fs';
import { mixSoundtrack, SR } from '../lib/sfx.mjs';

const [cueFile, out] = process.argv.slice(2);
const { duration, cues } = JSON.parse(readFileSync(cueFile, 'utf8'));
const mono = mixSoundtrack({ total: duration, voice: [], cues, levels: { voice: 0, music: 0.26, sfx: 0.5 } });
// Normalise to -1 dBFS peak so nothing clips after AAC encoding.
let pk = 0; for (const v of mono) pk = Math.max(pk, Math.abs(v));
const g = 0.891 / (pk || 1); for (let i = 0; i < mono.length; i++) mono[i] *= g;

// 16-bit stereo PCM WAV.
const n = mono.length, buf = Buffer.alloc(44 + n * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
let peak = 0;
for (let i = 0; i < n; i++) {
  const v = Math.max(-1, Math.min(1, mono[i])); peak = Math.max(peak, Math.abs(v));
  const s = Math.round(v * 32767);
  buf.writeInt16LE(s, 44 + i * 4); buf.writeInt16LE(s, 46 + i * 4);
}
writeFileSync(out, buf);
console.log(`wrote ${out}: ${duration}s, ${cues.length} cues, peak ${peak.toFixed(3)}`);
