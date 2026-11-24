// Shared helpers and the one mutable game state object every module reads.
export const TAU = Math.PI * 2;
export const WH = 520;            // half the world's width, in world units
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

export function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function makeNoise(seed) {
  const r = mulberry32(seed), P = new Uint16Array(512), V = new Float32Array(256);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = (r() * (i + 1)) | 0; const t = p[i]; p[i] = p[j]; p[j] = t; }
  for (let i = 0; i < 512; i++) P[i] = p[i & 255];
  for (let i = 0; i < 256; i++) V[i] = r();
  const h = (i, j) => V[P[P[i & 255] + (j & 255)]];
  const sm = t => t * t * (3 - 2 * t);
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = sm(x - xi), v = sm(y - yi);
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  const fbm = (x, y, o = 4) => { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += n2(x * f, y * f) * a; n += a; a *= .5; f *= 2.03; } return s / n; };
  return { n2, fbm };
}
export const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

// Runtime state. Filled by game.js at the start of each run.
export const S = {
  running: false, paused: false, over: false, time: 0, frame: 0,
  hero: null, res: null, cities: [], orders: [], outlines: true, zoom: 1, assist: true,
  meta: null, kills: 0, threat: 0.5, pc: [0, 0, 0, 0], pcTotal: 0, ec: 0, focus: null,
};
