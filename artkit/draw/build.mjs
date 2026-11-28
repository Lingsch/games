// Draws every pictograph into artkit/icons/. Run:  node artkit/draw/build.mjs
// Add a shape in glyphs.mjs, name it in specs.mjs, run this, and the new symbol is ready to use by name.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { G } from './glyphs.mjs'; import { SPECS } from './specs.mjs';
import { p, ln, st, ci, ri, eri, rr, rot, flip, tf, sc, star, rays, dr } from './kit.mjs';

const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'icons');
const W = s => `<g class="w">${s}</g>`, K = s => `<g class="k">${s}</g>`;
// a dark outline around a shape so it stands clear of whatever is behind it
const gap = s => `<g class="h">${s.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${+w + 9}"`)}</g>`;
const over = s => gap(s) + s;
function shape(tok) {
  const [n, a] = tok.split('~'), g = G[n]; if (!g) throw new Error('no shape called ' + n);
  let s = g.map((l, i) => l ? (i % 2 ? K(l) : W(l)) : '').join('');
  return a ? rot(s, +a) : s;
}
const solid = tok => { const [n, a] = tok.split('~'), s = K(G[n][0]); return a ? rot(s, +a) : s; };
function base(c) {
  let m;
  if ((m = c.split('+')).length === 2) return sc(shape(m[0]), .8, -9, -9) + over(sc(shape(m[1]), .54, 22, 22));
  if ((m = c.split('>')).length === 2) return shape(m[0]) + over(sc(shape(m[1]), m[1] === 'skull' ? .66 : .56));
  if ((m = c.split('@')).length === 2) return shape(m[1]) + sc(solid(m[0]), .5, 0, m[1] === 'shield' ? -3 : 0);
  if ((m = c.split('|')).length === 2) return sc(shape(m[0]), .58, -22, 0) + over(flip(sc(shape(m[1]), .58, -22, 0)));
  return shape(c);
}
const MARK = {
  ring: s => W(ri(50, 50, 45, 5)) + sc(s, .6),
  rays: s => W(rays(50, 50, 37, 49, 12, 4.5, 15)) + sc(s, .58),
  glow: s => W([...Array(10)].map((_, i) => ci(+(50 + 45 * Math.cos(i * Math.PI / 5)).toFixed(1), +(50 + 45 * Math.sin(i * Math.PI / 5)).toFixed(1), 4)).join('')) + sc(s, .62),
  aim: s => W(st('M8 28V8H28M72 8H92V28M92 72V92H72M28 92H8V72', 5)) + sc(s, .64),
  sparks: s => sc(s, .8, -8, 8) + over(W(star(84, 18, 15, 4.5, 4) + star(62, 7, 7, 2.2, 4) + star(93, 44, 7, 2.2, 4))),
  drip: s => sc(s, .76, 0, -11) + W(dr(28, 86, 7) + dr(50, 91, 8) + dr(72, 86, 7)),
  crack: s => s + K(st('M46 0L58 28L40 50L60 72L48 100', 5)),
  cut: s => s + K(ln(6, 94, 94, 6, 8)),
  no: s => sc(s, .6) + K(ln(18, 82, 82, 18, 13)) + W(ri(50, 50, 45, 6) + ln(18, 82, 82, 18, 6)),
  speed: s => W(ln(3, 28, 24, 28, 5) + ln(3, 50, 32, 50, 5) + ln(3, 72, 24, 72, 5)) + over(sc(s, .78, 11, 0)),
  arc: s => W(p('M6 90Q8 18 90 6Q34 26 20 94Z')) + over(sc(s, .72, 10, 8)),
  plus: s => sc(s, .82, -8, 8) + K(ci(82, 18, 18)) + W(rr(78, 5, 8, 26, 2) + rr(69, 14, 26, 8, 2)),
  up: s => sc(s, .8, -10, 0) + over(W(st('M72 44L85 28L98 44M72 68L85 52L98 68', 6))),
  down: s => sc(s, .8, -10, 0) + over(W(st('M72 32L85 48L98 32M72 56L85 72L98 56', 6))),
  x2: s => rot(sc(s, .94), -38) + over(rot(sc(s, .94), 38)),
  x3: s => rot(sc(s, .78, 0, 6), -36, 50, 96) + over(rot(sc(s, .78, 0, 6), 36, 50, 96)) + over(sc(s, .78, 0, 6)),
  row: s => sc(s, .5, -29, 8) + sc(s, .5, 29, 8) + over(sc(s, .62, 0, -6)),
  wings: s => W(G.wings[0]) + over(sc(s, .6, 0, 6)),
  holy: s => W(eri(50, 11, 30, 8, 5)) + sc(s, .8, 0, 10),
  ground: s => sc(s, .78, 0, -11) + W(ln(5, 91, 95, 91, 5) + st('M20 91L10 78M80 91L90 78', 4)),
  wave: s => sc(s, .78, 0, -11) + W(st('M5 88Q16 76 28 88Q40 100 52 88Q64 76 76 88Q86 98 95 88', 5)),
  dots3: s => sc(s, .78, 0, -11) + W(ci(30, 91, 5) + ci(50, 91, 5) + ci(70, 91, 5)),
  flip: s => flip(s),
};
export function draw(spec) {
  const [c, ...marks] = spec.trim().split(/\s+/); let s = base(c);
  for (const m of marks) { if (!MARK[m]) throw new Error('no mark called ' + m); s = MARK[m](s); }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512"><style>.w{fill:#fff;stroke:#fff}.k{fill:#000;stroke:#000}.h{stroke-width:9px;stroke-linejoin:round;stroke-linecap:round}.h .w,.h .k{fill:#000;stroke:#000}</style><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><g stroke-width="0">${s}</g></mask><rect width="100" height="100" fill="#fff" mask="url(#m)"/></svg>`;
}
const list = SPECS.trim().split('\n').map(l => l.split('=')), seen = new Map(); let bad = 0;
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
for (const [name, spec] of list) {
  try { fs.writeFileSync(path.join(out, name + '.svg'), draw(spec)); } catch (e) { console.log('!!', name, e.message); bad++; }
  if (seen.has(spec)) console.log('same drawing:', name, '=', seen.get(spec)); else seen.set(spec, name);
}
fs.writeFileSync(path.join(here, 'sheet.html'), `<body style="background:#1c1a17;margin:0;display:grid;grid-template-columns:repeat(20,64px);grid-auto-rows:70px;gap:6px;padding:8px;font:8px sans-serif;color:#998">` +
  list.map(([n]) => `<div style="text-align:center;overflow:hidden;white-space:nowrap"><div style="width:56px;height:56px;margin:auto;background:#e9c98a;-webkit-mask:url(../icons/${n}.svg) center/contain no-repeat;mask:url(../icons/${n}.svg) center/contain no-repeat"></div>${n.slice(0, 13)}</div>`).join('') + '</body>');
console.log(list.length, 'drawn,', bad, 'failed,', Object.keys(G).length, 'base shapes');
