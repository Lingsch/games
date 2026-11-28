// Beasts for the MMO, designed from scratch in the approved style. A creature family shares one builder (here the
// canines); ordinary versions are a few choices on it, and every boss adds its own unique pieces on top.
// Engine parts: 0 body, 21-24 upper legs (front left, front right, hind left, hind right), 31-34 lower legs,
// 5 neck and head, 27 jaw, 25 tail, 7 anything that flickers.
import { THREE, A, J, tag, mat, shade, sph, cyl, cone, box, tor, lathe, ext, fac } from './people.js';
const octa = r => fac(new THREE.OctahedronGeometry(r));

export function canine(o = {}) {
  const g = new THREE.Group(), fur = mat(o.fur || '#7d6b5a'), fur2 = mat(o.fur2 || '#cdbb9c'), dk = mat(o.dark || '#3a2e26'), k = o.bulk || 1, hh = .66, eye = o.eye || '#ffc93a';
  const B = J(g, 0, hh, 0);
  A(B, lathe([[.01, -.66], [.2 * k, -.56], [.27 * k, -.3], [.2 * k, -.02], [.33 * k, .3], [.3 * k, .5], [.17 * k, .64], [.01, .72]], 14), fur, 0, 0, 0, Math.PI / 2);
  A(B, sph(.24 * k), fur2, 0, -.12, .3, 0, 0, 0, .85, .75, 1.3);
  const mn = o.mane || { n: 5, len: .2 }; for (let i = 0; i < mn.n; i++) { const t = i / (mn.n - 1 || 1); A(B, cone(.07 * k, mn.len * (1 - t * .4), 5), mn.mat ? mat(mn.mat, mn.glow) : dk, 0, .28 * k - t * .06, .44 - t * .8, -.55); }
  const rf = o.ruff ?? 1; for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; A(B, cone(.085 * k, .3 * rf, 4), mat(shade(o.fur || '#7d6b5a', i % 2 ? .86 : 1.1)), Math.sin(a) * .25 * k, .04 + Math.cos(a) * .24 * k, .46, -1.9 + Math.cos(a) * .3, 0, Math.sin(a) * .5, 1, 1, .6); }
  for (const [x, z, front, id] of [[-1, .38, 1, 21], [1, .38, 1, 22], [-1, -.44, 0, 23], [1, -.44, 0, 24]]) {
    const L = tag(id, J(g, x * .2 * k, hh - .02, z, front ? .05 : -.35, 0, 0)), Kn = tag(id + 10, J(L, 0, -.32, 0, front ? -.05 : .6, 0, 0));
    A(L, sph(.13 * k), fur, 0, -.1, 0, 0, 0, 0, 1, front ? 1.7 : 2.1, front ? 1.3 : 1.9);
    A(Kn, cyl(.078 * k, .058 * k, .34, 8), fur, 0, -.16, 0); A(Kn, sph(.095 * k), o.paw ? mat(o.paw, o.pawGlow) : fur2, 0, -.33, .05, front ? 0 : -.25, 0, 0, 1.3, .7, 1.7);
    for (let i = -1; i <= 1; i++) A(Kn, cone(.02 * k, .08, 4), dk, i * .05 * k, -.35, .2 * k, Math.PI / 2 + (front ? 0 : -.25));
  }
  const N = tag(5, J(B, 0, .14, .5, -.6, 0, 0)); A(N, cyl(.15 * k, .25 * k, .42, 10), fur, 0, .15, 0);
  const R = .21 * (o.headK || 1), H = J(N, 0, .37, .03, .78, o.turn ?? .25, 0);
  A(H, sph(R), fur, 0, 0, 0, 0, 0, 0, 1, .9, 1.05); A(H, box(R * 1.5, R * .22, R * .5), dk, 0, R * .42, R * .62, .3);
  A(H, cyl(R * .32, R * .62, R * 1.15, 10), fur2, 0, -R * .18, R * 1.2, Math.PI / 2 + .1); A(H, sph(R * .2), dk, 0, -R * .08, R * 1.8);
  for (const s of [-1, 1]) {
    const blind = o.blind === s;
    A(H, sph(R * .17), mat(blind ? '#e8e8e8' : eye, !blind), s * R * .5, R * .2, R * .8, 0, s * .5, s * .35, 1.25, .7, .5); if (!blind) A(H, sph(R * .06), dk, s * R * .53, R * .2, R * .88, 0, 0, 0, .5, 1.3, .4, false);
    A(H, cone(R * .34, R * (o.torn === s ? .45 : .85), 4), fur, s * R * .55, R * .95, -R * .15, -.15, 0, -s * .25, 1, 1, .5); A(H, cone(R * .18, R * (o.torn === s ? .25 : .5), 4), mat('#c98a80'), s * R * .55, R * .9, -R * .08, -.15, 0, -s * .25, 1, 1, .4, false);
    A(H, cone(R * .22, R * .6, 4), fur2, s * R * .85, -R * .25, R * .1, 0, 0, -s * 1.9, 1, 1, .5); A(H, cone(R * .08, R * .34, 5), mat('#fbf7ee'), s * R * .25, -R * .5, R * 1.5, Math.PI);
  }
  const Jw = tag(27, J(H, 0, -R * .46, R * .5, .32, 0, 0)); A(Jw, cyl(R * .2, R * .46, R * .98, 8), dk, 0, 0, R * .5, Math.PI / 2); A(Jw, box(R * .3, R * .04, R * .8), mat(o.tongue || '#c9605a', o.tongueGlow), 0, R * .16, R * .5);
  for (const s of [-1, 1]) A(Jw, cone(R * .07, R * .3, 5), mat('#fbf7ee'), s * R * .2, R * .16, R * .88);
  const T = tag(25, J(B, 0, .1, -.62, -2.2, 0, 0)); if (!o.noTail) { A(T, lathe([[.01, 0], [.07 * k, .06], [.14 * k, .32], [.1 * k, .52], [.01, .68]], 10), fur, 0, 0, 0); A(T, cone(.09 * k, .22, 8), fur2, 0, .6, 0); }
  if (o.extra) o.extra({ g, B, N, H, T, R, k, fur, fur2, dk });
  return g;
}
const plainsWolf = () => canine({});
const oldGreymane = () => canine({ fur: '#8b8b90', fur2: '#e9e5dc', dark: '#4a4a52', bulk: 1.14, headK: 1.08, ruff: 1.5, mane: { n: 7, len: .3, mat: '#e9e5dc' }, blind: -1, torn: 1, eye: '#bfe6ff',
  extra({ B, H, R }) {
    for (const [x, z, rz] of [[.08, .1, .5], [-.1, -.2, -.4]]) { const Ar = J(B, x, .3, z, -.3, 0, rz); A(Ar, cyl(.012, .012, .5, 5), mat('#6b4526'), 0, .2, 0); A(Ar, cone(.05, .16, 4), mat('#b8241c'), 0, .42, 0, Math.PI, 0, 0, 1, 1, .3); }
    for (const [y, rz] of [[.25, .5], [-.05, .35]]) A(H, box(R * .08, R * .9, R * .06), mat('#d9a8a0'), -R * .42, R * y, R * .9, .2, -.4, rz, 1, 1, 1, false);
    A(H, box(R * .9, R * .07, R * .06), mat('#d9a8a0'), R * .1, -R * .05, R * 1.5, 0, 0, .5, 1, 1, 1, false);
  } });
const emberKing = () => canine({ fur: '#2b2326', fur2: '#4b3a36', dark: '#161214', bulk: 1.3, headK: 1.15, ruff: 0, eye: '#ffe27a', paw: '#ff7a2a', pawGlow: 1, tongue: '#ffb347', tongueGlow: 1, noTail: 1, mane: { n: 0, len: 0 },
  extra({ B, H, T, R, k }) {
    const fl = ['#ffe27a', '#ffb347', '#ff7a2a', '#e8451a'];
    for (let i = 0; i < 11; i++) { const t = i / 10, y = .3 * k - t * .05, z = .52 - t * 1.0; for (const s of [-1, 0, 1]) tag(7, A(B, cone(.09, .34 + ((i * 7 + s * 3) % 5) * .07, 5), mat(fl[(i + s + 4) % 4], 1), s * .11, y - Math.abs(s) * .05, z, -.5, 0, -s * .45)); }   // a mane of flame down the spine
    for (const [x, y, z, w, rz] of [[.28, .05, .2, .34, .5], [-.3, .0, .1, .3, -.6], [.25, -.02, -.25, .28, .9], [-.24, .06, -.34, .3, -.3], [.0, -.2, .1, .4, 1.57]]) A(B, box(.035, w, .03), mat('#ff7a2a', 1), x * k, y, z, 0, x > 0 ? .3 : -.3, rz);                                    // molten cracks
    for (let i = 0; i < 7; i++) { const a = (i - 3) * .42; A(H, cone(R * .16, R * (1.1 - Math.abs(i - 3) * .12), 5), mat('#161214'), Math.sin(a) * R * .95, R * .85 + Math.cos(a) * R * .2, -R * .1, -.25, 0, -a * .9); tag(7, A(H, cone(R * .1, R * .6, 4), mat(fl[i % 4], 1), Math.sin(a) * R * .95, R * 1.5 + Math.cos(a) * R * .2, -R * .22, -.25, 0, -a * .9)); }   // crown of horn and fire
    for (let i = 0; i < 6; i++) tag(7, A(T, cone(.16 - i * .018, .32, 6), mat(fl[(i + 1) % 4], 1), Math.sin(i * 1.3) * .03, .08 + i * .15, 0));                                      // tail of fire
    A(B, tor(.27 * k, .035), mat('#74809a'), 0, .06, .5, .3); for (let i = 0; i < 4; i++) A(B, tor(.045, .014), mat('#74809a'), 0, -.2 - i * .07, .62 - i * .01, i % 2 ? 0 : Math.PI / 2);   // broken chain
  } });
// name of the mob in the game -> [builder, scale]
export const BEASTS = { 'Plains Wolf': [plainsWolf, 1.0], 'Old Greymane': [oldGreymane, 1.25], 'The Ember King': [emberKing, 1.75] };
