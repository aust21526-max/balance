// Easing and deterministic randomness for motion graphics.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOutCubic = (t) => 1 - (1 - clamp(t)) ** 3;
export const easeInOutCubic = (t) => { t = clamp(t); return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2; };
export const easeOutBack = (t, s = 1.70158) => { t = clamp(t) - 1; return 1 + (s + 1) * t ** 3 + s * t ** 2; };

// Damped spring from 0 to 1 (overshoots, settles in ~0.5 s).
export function spring(t, { stiffness = 170, damping = 14 } = {}) {
  if (t <= 0) return 0;
  const w = Math.sqrt(stiffness), z = damping / (2 * w);
  if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
}

// Seeded PRNG (mulberry32) so particles and noise are identical on every render.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Small camera shake that decays over `dur` seconds after an impact at t=0.
export function shake(t, dur = 0.35, amp = 14) {
  if (t < 0 || t > dur) return { x: 0, y: 0 };
  const k = (1 - t / dur) ** 2 * amp;
  return { x: Math.sin(t * 91) * k, y: Math.cos(t * 77) * k };
}
