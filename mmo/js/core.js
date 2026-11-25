// Shared helpers and the single mutable game state.
export const TAU = Math.PI * 2;
export let WH = 300;              // half the zone's width, in world units (each zone sets its own)
export function setWH(v) { WH = v; }
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const irnd = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = a => a[(Math.random() * a.length) | 0];
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
export const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

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

// Runtime state. Filled by game.js when a game starts.
export const S = {
  running: false, paused: false, time: 0, frame: 0, seed: 1,
  hero: null,          // the player's entity
  ents: [],            // every living thing in the zone
  party: [],           // entities in your group, hero first
  target: null,        // your current target
  camYaw: 0, camPitch: .36, camDist: 10.5,
  gold: 0, bag: [], corpse: null, bind: null,
  quests: {}, heroCls: 'bulwark', classes: {}, gear: {},
  bar: {},             // hotbar layout per class
  log: [],             // chat feed
  meter: {}, dangers: [], cmd: 'follow', fakes: [],
  ui: {},
};
let _id = 1;
export const nextId = () => _id++;

// chat feed: channel is 'sys', 'party', 'gen', 'say', 'loot', 'combat', 'guild'
export function chat(ch, from, text) {
  S.log.push({ ch, from, text, t: S.time });
  if (S.log.length > 120) S.log.shift();
  S.logDirty = true;
}
// floating combat text, drawn by the UI
export const fct = [];
export function floatText(e, text, col, big = false) { fct.push({ e, text, col, big, t: 0, ox: (Math.random() - .5) * 30 }); if (fct.length > 40) fct.shift(); }

// Build 6: hooks so new systems plug in without touching the core loop
// tick(dt) · zone(zone) after a zone is built · kill(mob) on a party kill · turnin(q) · accept(q)
// book: [key, name, render(body)] · talk: (key, npc, api) => [[label, fn, cls]] · ui: filled by ui.js
export const X = { tick: [], zone: [], kill: [], turnin: [], accept: [], book: [], talk: [], ui: {}, objText: [], mapPins: [] };
// the 24-minute day (main.js lights it): night runs from dusk's end to just before dawn
export const dayPhase = () => ((S.time / 1440) + .3) % 1;
export const isNight = () => { const p = dayPhase(); return p > .66 && p < .95; };
X.light = [];
