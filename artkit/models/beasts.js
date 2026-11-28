// Beasts for the MMO, designed from scratch in the approved style. One four-legged builder, quad(), is shaped into
// each family (wolf, hound, bear, boar, rat, stag); ordinary creatures are a line of choices, and every boss and
// named rare adds its own unique pieces. BEASTS maps a creature's name in the game to its model.
// Engine parts: 0 body, 21-24 upper legs (front left, front right, hind left, hind right), 31-34 lower legs,
// 5 neck and head, 27 jaw, 25 tail, 7 anything that flickers.
import { THREE, A, J, tag, mat, shade, sph, cyl, cone, box, tor, lathe, dome, ext, fac, harpy, setStyle } from './people.js';
const octa = r => fac(new THREE.OctahedronGeometry(r));
const BONE = '#e6dcc2', STEEL = '#74809a', GOLD = '#e8bd4c', FLAME = ['#ffe27a', '#ffb347', '#ff7a2a', '#e8451a'];

export function quad(o = {}) {
  const g = new THREE.Group(), fc = o.fur || '#7d6b5a', fur = mat(fc), fur2 = mat(o.fur2 || '#cdbb9c'), dk = mat(o.dark || '#3a2e26'), k = o.bulk || 1, hh = o.hh || .66, L = o.len || 1, lk = hh / .66, lr = (o.legR || 1) * k, eye = o.eye || '#ffc93a';
  const B = J(g, 0, hh, 0);
  A(B, lathe([[.01, -.66], [.2 * k, -.56], [.27 * k, -.3], [(o.waist || .2) * k, -.02], [.33 * k, .3], [.3 * k, .5], [.17 * k, .64], [.01, .72]], 14), fur, 0, 0, 0, Math.PI / 2, 0, 0, 1, L, 1);
  A(B, sph(.24 * k * (o.chest ?? 1)), fur2, 0, -.12, .3 * L, 0, 0, 0, .85, .75, 1.3);
  if (o.hump) A(B, sph(.28 * k), fur, 0, .13 * k, (o.humpZ ?? .3) * L, 0, 0, 0, 1, o.hump, 1.2);
  const mn = o.mane || { n: 5, len: .2 }; for (let i = 0; i < mn.n; i++) { const t = i / (mn.n - 1 || 1), m = A(B, cone((mn.w || .07) * k, mn.len * (1 - t * .4), 5), mn.mat ? mat(mn.mat, mn.glow) : dk, 0, .28 * k - t * .06 + (o.hump ? .12 * k * (1 - t) : 0), (.44 - t * .8) * L, -.55); if (mn.flick) tag(7, m); }
  const rf = o.ruff ?? 1; if (rf) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; A(B, cone(.085 * k, .3 * rf, 4), mat(shade(fc, i % 2 ? .86 : 1.1)), Math.sin(a) * .25 * k, .04 + Math.cos(a) * .24 * k, .46 * L, -1.9 + Math.cos(a) * .3, 0, Math.sin(a) * .5, 1, 1, .6); }
  for (const [x, z, front, id] of [[-1, .38, 1, 21], [1, .38, 1, 22], [-1, -.44, 0, 23], [1, -.44, 0, 24]]) {
    const Lg = tag(id, J(g, x * .2 * k, hh - .02, z * L, front ? .05 : -.35, 0, 0)), Kn = tag(id + 10, J(Lg, 0, -.32 * lk, 0, front ? -.05 : .6, 0, 0));
    A(Lg, sph(.13 * lr), fur, 0, -.1 * lk, 0, 0, 0, 0, 1, (front ? 1.7 : 2.1) * lk, front ? 1.3 : 1.9); A(Lg, cyl(.1 * lr, .08 * lr, .34 * lk, 8), fur, 0, -.17 * lk, 0);
    A(Kn, cyl(.078 * lr, .058 * lr, .34 * lk, 8), o.sock ? mat(o.sock) : fur, 0, -.16 * lk, 0);
    if (o.hoof) A(Kn, cyl(.06 * lr, .075 * lr, .09, 6), dk, 0, -.31 * lk, .01);
    else { A(Kn, sph(.095 * lr), o.paw ? mat(o.paw, o.pawGlow) : fur2, 0, -.33 * lk, .05, front ? 0 : -.25, 0, 0, 1.3, .7, 1.7); for (let i = -1; i <= 1; i++) A(Kn, cone(.02 * lr, .08 * (o.claw || 1), 4), o.claw ? mat(BONE) : dk, i * .05 * lr, -.35 * lk, .2 * lr, Math.PI / 2 + (front ? 0 : -.25)); }
    if (o.leg) o.leg(Lg, Kn, front, x, lk, lr);
  }
  const nrx = o.neckRx ?? -.6, nl = o.neck || .42, N = tag(5, J(B, 0, .14, .5 * L, nrx, 0, 0)); A(N, cyl(.15 * k * (o.neckW || 1), .25 * k * (o.neckW || 1), nl, 10), fur, 0, nl * .36, 0);
  const R = .21 * (o.headK || 1), H = J(N, 0, nl * .88, .03, .18 - nrx, o.turn ?? .25, 0), mz = o.muzzle || [1.15, 1];
  A(H, sph(R), fur, 0, 0, 0, 0, 0, 0, 1, .9, 1.05); if (!o.noBrow) A(H, box(R * 1.5, R * .22, R * .5), dk, 0, R * .42, R * .62, .3);
  A(H, cyl(R * .32 * mz[1], R * .62 * mz[1], R * mz[0], 10), fur2, 0, -R * .18, R * (.62 + mz[0] * .5), Math.PI / 2 + .1);
  if (o.disc) A(H, cyl(R * .36, R * .36, R * .14, 8), mat('#d99a8a'), 0, -R * .12, R * (.66 + mz[0]), Math.PI / 2 + .1); else A(H, sph(R * .2), dk, 0, -R * .08, R * (.65 + mz[0]));
  for (const s of [-1, 1]) {
    const blind = o.blind === s, eg = o.eyeGlow ?? 1;
    A(H, sph(R * .17 * (o.eyeK || 1)), mat(blind ? '#e8e8e8' : eye, !blind && eg), s * R * .5, R * .2, R * .8, 0, s * .5, s * .35, 1.25, .7, .5); if (!blind) A(H, sph(R * .06), dk, s * R * .53, R * .2, R * .88, 0, 0, 0, .5, 1.3, .4, false);
    const el = (o.earK || 1) * (o.torn === s ? .5 : 1);
    if (o.ears === 'round') A(H, sph(R * .32 * el), fur, s * R * .7, R * .78, -R * .1, 0, 0, 0, 1, 1, .5);
    else if (o.ears === 'flop') A(H, ext([[-.5, 0], [.5, 0], [.4, -1], [0, -1.25], [-.4, -1]], .06, .02), dk, s * R * .9, R * .6, -R * .05, .1, s * 1.3, s * .25, R * .7, R * .9 * el, 1);
    else if (o.ears === 'side') A(H, cone(R * .2, R * .7 * el, 4), fur, s * R * .95, R * .5, -R * .15, 0, 0, -s * 1.35, 1, 1, .5);
    else { A(H, cone(R * .34, R * .85 * el, 4), fur, s * R * .55, R * .95, -R * .15, -.15, 0, -s * .25, 1, 1, .5); A(H, cone(R * .18, R * .5 * el, 4), mat('#c98a80'), s * R * .55, R * .9, -R * .08, -.15, 0, -s * .25, 1, 1, .4, false); }
    if (!o.noCheek) A(H, cone(R * .22, R * .6, 4), fur2, s * R * .85, -R * .25, R * .1, 0, 0, -s * 1.9, 1, 1, .5);
    if (o.tusks) A(H, cone(R * .1 * o.tusks, R * .7 * o.tusks, 5), mat(o.tuskC || BONE), s * R * .42 * mz[1], -R * .2, R * (.5 + mz[0] * .7), -.5, 0, -s * .5);
    else if (!o.noFang) A(H, cone(R * .08, R * .34 * (o.fang || 1), 5), mat('#fbf7ee'), s * R * .25 * mz[1], -R * (.34 + .16 * (o.fang || 1)), R * (.5 + mz[0] * .85), Math.PI);
  }
  if (o.buck) A(H, box(R * .2, R * .3, R * .06), mat('#fbf7ee'), 0, -R * .55, R * (.55 + mz[0] * .9));
  const Jw = tag(27, J(H, 0, -R * .46, R * .5, .32, 0, 0)); A(Jw, cyl(R * .2 * mz[1], R * .46 * mz[1], R * mz[0] * .86, 8), dk, 0, 0, R * mz[0] * .44, Math.PI / 2); A(Jw, box(R * .3, R * .04, R * mz[0] * .7), mat(o.tongue || '#c9605a', o.tongueGlow), 0, R * .16, R * mz[0] * .44);
  if (!o.noFang) for (const s of [-1, 1]) A(Jw, cone(R * .07, R * .3, 5), mat('#fbf7ee'), s * R * .2 * mz[1], R * .16, R * mz[0] * .76);
  const tl = o.tail || 'bush', T = tag(25, J(B, 0, .1, -.62 * L, tl === 'thin' ? -1.9 : -2.2, 0, 0));
  if (tl === 'bush') { A(T, lathe([[.01, 0], [.07 * k, .06], [.14 * k, .32], [.1 * k, .52], [.01, .68]], 10), fur, 0, 0, 0); A(T, cone(.09 * k, .22, 8), fur2, 0, .6, 0); }
  else if (tl === 'stub') A(T, sph(.09 * k), fur, 0, .04, 0);
  else if (tl === 'thin') { const c = mat(o.tailC || fc); A(T, cyl(.02 * k, .035 * k, .5 * (o.tailLen || 1), 6), c, 0, .25 * (o.tailLen || 1), 0); const T2 = J(T, 0, .5 * (o.tailLen || 1), 0, .5, 0, .3); A(T2, cyl(.008 * k, .02 * k, .4 * (o.tailLen || 1), 5), c, 0, .2 * (o.tailLen || 1), 0); }
  const e = { g, B, N, H, T, Jw, R, k, L, hh, fur, fur2, dk }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- pieces that bosses and area versions add
const sores = (c = '#b6ff3a', n = 7) => e => { for (let i = 0; i < n; i++) { const a = i * 2.4; A(e.B, sph(.05), mat(c, 1), Math.sin(a) * .27 * e.k, .04 + Math.cos(a * 1.7) * .14, (-.45 + i * .15) * e.L, 0, 0, 0, 1, 1, .6); } };
const bald = (c = '#c98a80') => e => { for (const [x, y, z] of [[.26, .05, .1], [-.27, .0, -.2], [.22, .12, -.36]]) A(e.B, sph(.11), mat(c), x * e.k, y, z * e.L, 0, 0, 0, .4, 1, 1.3, false); };
const ribs = (c = BONE, core) => e => { for (let i = 0; i < 4; i++) A(e.B, tor((.3 - i * .012) * e.k, .022), mat(c), 0, 0, (.14 - i * .13) * e.L); if (core) A(e.B, sph(.16 * e.k), mat(core, 1), 0, -.02, -.05, 0, 0, 0, 1, 1, 2); };
const collar = (c = STEEL, spiked) => e => { A(e.N, tor(.21 * e.k, .04), mat(c), 0, .1, 0, Math.PI / 2); if (spiked) for (let i = 0; i < 8; i++) A(e.N, cone(.03, .12, 4), mat(typeof spiked === 'string' ? spiked : c), Math.sin(i * .785) * .25 * e.k, .1, Math.cos(i * .785) * .25 * e.k, Math.PI / 2, 0, -i * .785, 1, 1, 1); };
const chains = (c = STEEL) => e => { for (const z of [.2, -.15, -.4]) A(e.B, tor(.31 * e.k, .028), mat(c), 0, 0, z * e.L, 0, .2, 0); for (let i = 0; i < 6; i++) A(e.B, tor(.045, .014), mat(c), .1, -.2 - (i < 3 ? i * .08 : .2), i < 3 ? .58 : -.7 - (i - 3) * .09, i % 2 ? 0 : Math.PI / 2); };
const plates = (c = STEEL, trim = GOLD) => e => { for (let i = 0; i < 3; i++) { A(e.B, sph(.24 * e.k), mat(c), 0, .16 * e.k, (.32 - i * .32) * e.L, 0, 0, 0, 1.25, .55, 1); A(e.B, tor(.2 * e.k, .02), mat(trim), 0, .16 * e.k, (.32 - i * .32) * e.L, Math.PI / 2, 0, 0, 1.25, 1, 1); } A(e.H, dome(e.R * 1.12, .42), mat(c), 0, e.R * .25, -e.R * .05, -.3); };
const blanket = (c, trim = GOLD) => e => { A(e.B, lathe([[.31 * e.k, -.3], [.35 * e.k, 0], [.33 * e.k, .28]], 12), mat(c), 0, 0, -.02, Math.PI / 2); for (const z of [-.3, .28]) A(e.B, tor(.33 * e.k, .02), mat(trim), 0, 0, z); };
const antlers = (c = BONE, glow, s2 = 1) => e => { for (const s of [-1, 1]) { const An = J(e.H, s * e.R * .5, e.R * .8, -e.R * .2, -.25, 0, -s * .5); A(An, cyl(e.R * .09, e.R * .14, e.R * 1.6 * s2, 5), mat(c, glow), 0, e.R * .8 * s2, 0); const A2 = J(An, 0, e.R * 1.55 * s2, 0, 0, 0, s * .7); A(A2, cone(e.R * .1, e.R * 1.3 * s2, 5), mat(c, glow), 0, e.R * .62 * s2, 0); for (const [y, a] of [[.5, -1.0], [1.0, -.85], [1.4, .9]]) A(An, cone(e.R * .07, e.R * .8 * s2, 5), mat(c, glow), s * e.R * .28 * (a > 0 ? -1 : 1), e.R * y * s2 + e.R * .2, 0, 0, 0, s * a); } };
const icicles = (c = '#d8f6ff') => e => { for (let i = -2; i <= 2; i++) A(e.Jw, cone(e.R * .09, e.R * (.7 - Math.abs(i) * .15), 4), mat(c, 1), i * e.R * .16, -e.R * .35, e.R * (.5 - Math.abs(i) * .1), Math.PI); };
const mush = (cap = '#c8382c') => e => { for (const [x, z, s] of [[.06, .2, 1], [-.1, -.05, 1.4], [.1, -.3, .8], [-.04, -.48, 1.1]]) { A(e.B, cyl(.03 * s, .04 * s, .16 * s, 6), mat('#efe6d0'), x, .3 * e.k + .06 * s, z * e.L); A(e.B, dome(.1 * s, .5), mat(cap), x, .3 * e.k + .13 * s, z * e.L); } };
const moss = (c = '#4f8a3a') => e => { A(e.B, sph(.3 * e.k), mat(c), 0, .12 * e.k, -.05, 0, 0, 0, 1.05, .7, 2.0 * e.L); for (const [x, z] of [[.12, .3], [-.14, 0], [.1, -.3]]) A(e.B, sph(.07), mat('#7ac85a'), x, .3 * e.k, z * e.L); };
const crown = (c = GOLD, gem = '#ff5a4a') => e => { A(e.H, tor(e.R * .7, e.R * .09), mat(c), 0, e.R * .82, -e.R * .1, Math.PI / 2 - .2); for (let i = 0; i < 6; i++) A(e.H, cone(e.R * .12, e.R * .5, 4), mat(c), Math.sin(i * 1.047) * e.R * .7, e.R * 1.08, Math.cos(i * 1.047) * e.R * .7 - e.R * .1); A(e.H, sph(e.R * .11), mat(gem, 1), 0, e.R * .84, e.R * .6); };
const wisps = (c = '#bfefff', n = 6) => e => { for (let i = 0; i < n; i++) tag(7, A(e.T, octa(.07 - i * .008), mat(c, 1), Math.sin(i * 1.9) * .08, .1 + i * .13, Math.cos(i * 1.9) * .05, 0, 0, 0, 1, 1.8, 1)); };
const scars = (n = 3) => e => { for (let i = 0; i < n; i++) A(e.H, box(e.R * .07, e.R * .8, e.R * .05), mat('#d9a8a0'), -e.R * (.5 - i * .5), e.R * (.2 - i * .12), e.R * (.9 + (i === 1 ? .5 : 0)), .2, -.4 + i * .4, .5 - i * .3, 1, 1, 1, false); };
const arrows = e => { for (const [x, z, rz] of [[.08, .1, .5], [-.1, -.2, -.4]]) { const Ar = J(e.B, x, .3, z, -.3, 0, rz); A(Ar, cyl(.012, .012, .5, 5), mat('#6b4526'), 0, .2, 0); A(Ar, cone(.05, .16, 4), mat('#b8241c'), 0, .42, 0, Math.PI, 0, 0, 1, 1, .3); } };
const flames = (spine = 1) => e => {
  if (spine) for (let i = 0; i < 11; i++) { const t = i / 10; for (const s of [-1, 0, 1]) tag(7, A(e.B, cone(.09, .34 + ((i * 7 + s * 3) % 5) * .07, 5), mat(FLAME[(i + s + 4) % 4], 1), s * .11, .3 * e.k - t * .05 - Math.abs(s) * .05, .52 - t * 1.0, -.5, 0, -s * .45)); }
  for (let i = 0; i < 6; i++) tag(7, A(e.T, cone(.16 - i * .018, .32, 6), mat(FLAME[(i + 1) % 4], 1), Math.sin(i * 1.3) * .03, .08 + i * .15, 0));
};
const cracks = (c = '#ff7a2a') => e => { for (const [x, y, z, w, rz] of [[.28, .05, .2, .34, .5], [-.3, .0, .1, .3, -.6], [.25, -.02, -.25, .28, .9], [-.24, .06, -.34, .3, -.3], [.0, -.2, .1, .4, 1.57]]) A(e.B, box(.035, w, .03), mat(c, 1), x * e.k, y, z, 0, x > 0 ? .3 : -.3, rz); };
const shards = (c, glow, n = 7, len = .4) => e => { for (let i = 0; i < n; i++) { const t = i / (n - 1); A(e.B, octa(.09), mat(c, glow), Math.sin(i * 2.3) * .1, .3 * e.k + .04, (.45 - t * .9) * e.L, Math.sin(i) * .3, 0, Math.cos(i * 1.7) * .4, .8, len * 5, .8); } };
const tails = (c = '#c98a80', n = 5) => e => { for (let i = 0; i < n; i++) { const Tl = J(e.T, 0, .05, 0, (i - (n - 1) / 2) * .22, 0, (i % 2 ? .3 : -.3)); A(Tl, cyl(.012, .03, .7, 5), mat(c), 0, .35, 0); } A(e.T, sph(.07), mat(c), 0, .1, 0); };

// ---- winged things: wasps, moths, bats, sprites. Parts 8/9 are fast wings, 28/29 slow wings, 5 the head.
export function bug(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#e8b82a', o.glowBody), c2 = mat(o.fur2 || '#2a2018'), dk = mat(o.dark || '#1a1410'), k = o.bulk || 1, y0 = o.y || 1.15, eye = o.eye || '#2a1c14', wc = o.wingC || '#dff2ff';
  const B = J(g, 0, y0, 0, o.pitch ?? -.3, 0, 0), fat = o.fat || 1;
  A(B, sph(.2 * k), o.fuzzy ? c1 : c2, 0, 0, 0, 0, 0, 0, 1, .95, 1.15);
  const T = J(B, 0, -.02, -.2 * k, o.curl ?? .5, 0, 0), n = o.segs || 4;
  for (let i = 0; i < n; i++) { const t = i / n, r = .2 * k * fat * (1 - t * .55) * (i ? 1 : 1.05); A(T, sph(r), (o.stripe === 0 ? c1 : i % 2 ? c2 : c1), 0, 0, -i * .17 * k * fat, 0, 0, 0, 1, .92, 1.05); }
  if (o.sting) A(T, cone(.035 * k, .26 * k * o.sting, 5), mat(o.stingC || BONE), 0, 0, -(n * .17 + .06) * k * fat, -Math.PI / 2);
  if (o.lamp) A(T, sph(.2 * k * fat), mat(o.lamp, 1), 0, 0, -(n - 1) * .17 * k * fat, 0, 0, 0, .9, .85, 1);
  if (!o.noLegs) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { A(B, cyl(.012 * k, .012 * k, .3 * k, 4), dk, s * .13 * k, -.18 * k, (.1 - i * .11) * k, .3 - i * .3, 0, -s * .4); }
  const R = .15 * k * (o.headK || 1), H = tag(5, J(B, 0, .02, .27 * k, .25, o.turn ?? .2, 0));
  A(H, sph(R), o.fuzzy ? c1 : c2, 0, 0, 0, 0, 0, 0, 1.05, .95, 1);
  for (const s of [-1, 1]) {
    A(H, sph(R * .5 * (o.eyeK || 1)), mat(eye, o.eyeGlow), s * R * .62, R * .15, R * .55, 0, 0, 0, .7, 1.1, .8);
    if (o.feeler === 'feather') A(H, ext([[0, 0], [.22, .5], [.1, 1.3], [0, 1], [-.1, 1.3], [-.22, .5]], .02, .006), mat(o.feelerC || BONE), s * R * .4, R * .7, R * .2, -.5, 0, -s * .5, R * 1.4, R * 1.3, 1);
    else if (o.feeler !== 'none') { A(H, cyl(.008 * k, .008 * k, R * 1.6, 4), dk, s * R * .35, R * 1.2, R * .5, .6, 0, -s * .35); }
    if (o.ears) A(H, cone(R * .5, R * 1.4, 4), c1, s * R * .7, R * 1.0, -R * .1, -.1, 0, -s * .4, 1, 1, .4);
    if (o.mand) A(H, cone(R * .14, R * .7 * o.mand, 4), mat(o.mandC || BONE), s * R * .3, -R * .5, R * .9, Math.PI - .6, 0, s * .4);
  }
  if (o.beak) A(H, cone(R * .1, R * 1.6 * o.beak, 5), dk, 0, -R * .2, R * 1.5, Math.PI / 2 + .3);
  const wk = (o.wingK || 1) * k;
  for (const s of [-1, 1]) {
    if (o.wing === 'moth' || o.wing === 'bat') {
      const Wg = tag(s > 0 ? 28 : 29, J(B, s * .12 * k, .12 * k, 0, 0, 0, s * .25));
      if (o.wing === 'moth') { const up = [[0, 0], [.35, .55], [1.0, .75], [1.25, .3], [.8, -.1]], lo = [[0, -.05], [.8, -.15], [.95, -.6], [.5, -.9], [.1, -.5]];
        A(Wg, ext(up.map(p => [p[0] * s, p[1]]), .02, .006), mat(wc), 0, 0, .05, -Math.PI / 2, 0, 0, wk * .5, wk * .5, 1); A(Wg, ext(lo.map(p => [p[0] * s, p[1]]), .02, .006), mat(o.wingC2 || wc), 0, -.01, .02, -Math.PI / 2, 0, 0, wk * .47, wk * .47, 1);
        if (o.spot) { A(Wg, cyl(wk * .09, wk * .09, .03, 8), mat(o.spot, o.spotGlow), s * wk * .39, .012, -wk * .22); A(Wg, cyl(wk * .04, wk * .04, .04, 6), dk, s * wk * .39, .014, -wk * .22); A(Wg, cyl(wk * .07, wk * .07, .03, 8), mat(o.spot, o.spotGlow), s * wk * .31, .0, wk * .19); } }
      else { const mem = [[0, 0], [.5, .35], [1.3, .3], [1.15, -.1], [.85, -.02], [.7, -.4], [.4, -.25], [.2, -.5]]; A(Wg, ext(mem.map(p => [p[0] * s, p[1]]), .02, .006), mat(wc, o.wingGlow), 0, 0, 0, -Math.PI / 2, 0, 0, wk * .6, wk * .6, 1);
        for (const [x, z] of [[1.3, -.3], [.85, .02], [.4, .25]]) A(Wg, cyl(.012 * k, .016 * k, Math.hypot(x, z) * wk * .6, 4), dk, s * x * wk * .3, .015, z * wk * .3, Math.PI / 2, 0, s * Math.atan2(x, -z) - (s > 0 ? 0 : 0)); }
    } else for (let j = 0; j < 2; j++) { const Wg = tag(s > 0 ? 8 : 9, J(B, s * .1 * k, .14 * k, (.05 - j * .12) * k, 0, s * (-.25 - j * .5), s * .2)); A(Wg, ext([[0, 0], [.5 * s, .14], [1.0 * s, .05], [.9 * s, -.14], [.3 * s, -.12]], .012, .004), mat(wc), 0, 0, 0, -Math.PI / 2, 0, 0, wk * (.75 - j * .2), wk * (.75 - j * .2), 1); }
  }
  const e = { g, B, N: H, H, T, Jw: H, R, k, L: .5, hh: y0, fly: 1 }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- many legs: spiders and mites. Parts 41-44 are the left legs, 45-48 the right, 5 the head.
export function spider(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#5a4030'), c2 = mat(o.fur2 || '#2e2018'), dk = mat(o.dark || '#1a120c'), k = o.bulk || 1, hy = .42 * k * (o.tall || 1), eye = o.eye || '#ff3a2a', nl = o.legs || 4, lg = (o.legK || 1) * k;
  const B = J(g, 0, hy, 0);
  A(B, sph(.34 * k * (o.abd || 1)), c1, 0, .1 * k, -.34 * k * (o.abd || 1), -.15, 0, 0, 1, .85, 1.25); A(B, sph(.2 * k), c2, 0, 0, .12 * k, 0, 0, 0, 1.1, .8, 1.2);
  if (o.mark) for (let i = 0; i < 3; i++) A(B, box(.16 * k * (1 - i * .25), .03, .08 * k), mat(o.mark, o.markGlow), 0, .39 * k * (o.abd || 1) - i * .015, (-.2 - i * .16) * k * (o.abd || 1), -.15 + i * .25);
  if (o.shell) { A(B, dome(.4 * k * (o.abd || 1), .5), mat(o.shell, o.shellGlow), 0, .04 * k, -.2 * k, -.1, 0, 0, 1.05, .95, 1.35); }
  if (o.sac) A(B, sph(.2 * k), mat(o.sac), 0, -.04 * k, -.66 * k * (o.abd || 1), 0, 0, 0, 1, 1, 1);
  const R = .16 * k, H = tag(5, J(B, 0, .0, .3 * k, .1, o.turn ?? .15, 0)); A(H, sph(R), c2, 0, 0, 0, 0, 0, 0, 1.1, .85, 1);
  for (const s of [-1, 1]) { for (const [x, y, r] of [[.3, .3, .2], [.62, .2, .14], [.25, .62, .12], [.75, .45, .1]].slice(0, o.eyes || 4)) A(H, sph(R * r), mat(eye, 1), s * R * x, R * y, R * .8, 0, 0, 0, 1, 1, .6);
    A(H, cone(R * .2, R * 1.1 * (o.fang || 1), 5), mat(o.fangC || BONE, o.fangGlow), s * R * .32, -R * .7, R * .7, Math.PI + .25, 0, s * .15); A(H, cyl(R * .1, R * .12, R * .9, 5), c1, s * R * .7, -R * .3, R * .8, 1.0, 0, -s * .4); }
  for (const s of [-1, 1]) for (let i = 0; i < nl; i++) {
    const Lg = tag((s > 0 ? 45 : 41) + i, J(B, s * .16 * k, 0, (.2 - i * (.42 / nl)) * k, 0, -s * (1.0 - i * (1.9 / nl)), 0)), h = hy / .42;
    A(Lg, cyl(.035 * lg, .045 * lg, .38 * lg, 5), o.legC ? mat(o.legC) : c2, s * .16 * lg, .1 * lg, 0, 0, 0, -s * (Math.PI / 2 - .6)); A(Lg, sph(.05 * lg), dk, s * .31 * lg, .2 * lg, 0);
    A(Lg, cyl(.016 * lg, .034 * lg, Math.hypot(.24 * lg, hy + .2 * lg), 5), o.legC ? mat(o.legC) : c2, s * .43 * lg, (.2 * lg - hy) / 2, 0, 0, 0, s * Math.atan2(.24 * lg, hy + .2 * lg));
  }
  const T = J(B, 0, .1 * k, -.7 * k * (o.abd || 1), -1.4, 0, 0), e = { g, B, N: H, H, T, Jw: H, R, k, L: .8, hh: hy }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- grubs and crawlers: a chain of segments that ripples. Parts 50-59, head 5.
export function grub(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#d8cfa8'), c2 = mat(o.fur2 || '#a89a70'), dk = mat(o.dark || '#3a2e1e'), k = o.bulk || 1, n = Math.min(9, o.segs || 7), r0 = .24 * k, eye = o.eye || '#2a1c14';
  const B = J(g, 0, r0 * .9, 0); let z = .5 * k;
  for (let i = 0; i < n; i++) { const t = i / (n - 1), r = r0 * (1 - Math.abs(t - .35) * .7), S = tag(50 + i, J(B, 0, 0, z)); A(S, sph(r), i % 2 ? c2 : c1, 0, 0, 0, 0, 0, 0, 1.1, .9, .75);
    if (o.plate) A(S, dome(r * 1.05, .45), mat(o.plate, o.plateGlow), 0, r * .08, 0, 0, 0, 0, 1.1, .9, .8); if (o.spine) A(S, cone(r * .16, r * 1.1 * o.spine, 4), mat(o.spineC || BONE, o.spineGlow), 0, r * .95, 0);
    if (o.feet) for (const s of [-1, 1]) A(S, cone(r * .12, r * .7, 4), dk, s * r * .85, -r * .6, 0, Math.PI, 0, s * .5); if (o.dots) for (const s of [-1, 1]) A(S, sph(r * .14), mat(o.dots, 1), s * r * .95, r * .1, 0);
    z -= r * 1.25; }
  const R = r0 * .8 * (o.headK || 1), H = tag(5, J(B, 0, .02, .5 * k + R * .9, 0, o.turn ?? .15, 0)); A(H, sph(R), o.headC ? mat(o.headC) : dk, 0, 0, 0, 0, 0, 0, 1.05, .9, .9);
  for (const s of [-1, 1]) { A(H, sph(R * .2), mat(eye, o.eyeGlow), s * R * .5, R * .3, R * .7); A(H, cone(R * .2, R * 1.1 * (o.mand || 1), 4), mat(o.mandC || BONE), s * R * .5, -R * .25, R * 1.0, Math.PI / 2, 0, s * .5 - (s > 0 ? 0 : 0)); }
  const T = J(B, 0, 0, z, -1.5, 0, 0), e = { g, B, N: H, H, T, Jw: H, R, k, L: 1, hh: r0 }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- crabs: wide shell, six legs (41-43 left, 45-47 right), claws on the arm parts 3/4 so they snap on an attack
export function crab(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#d8542a'), c2 = mat(o.fur2 || '#f0b08a'), dk = mat(o.dark || '#7a2a14'), k = o.bulk || 1, hy = .3 * k, eye = o.eye || '#1a120c';
  const B = J(g, 0, hy, 0); A(B, sph(.4 * k), c1, 0, .06 * k, 0, 0, 0, 0, 1.25, .5, .85); A(B, sph(.36 * k), c2, 0, -.02 * k, .02 * k, 0, 0, 0, 1.15, .4, .8);
  const R = .14 * k, H = tag(5, J(B, 0, .12 * k, .3 * k)); for (const s of [-1, 1]) { A(H, cyl(.02 * k, .02 * k, .2 * k, 4), dk, s * .1 * k, .08 * k, 0); A(H, sph(.05 * k), mat(eye, o.eyeGlow), s * .1 * k, .2 * k, 0); }
  if (o.maw) { A(H, sph(.2 * k), mat('#2a0e10'), 0, -.1 * k, .02 * k, 0, 0, 0, 1.3, .6, .5); for (let i = -3; i <= 3; i++) A(H, cone(.025 * k, .12 * k, 4), mat(BONE), i * .06 * k, -.04 * k, .1 * k, Math.PI); }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const Lg = tag((s > 0 ? 45 : 41) + i, J(B, s * .34 * k, 0, (.12 - i * .16) * k, 0, -s * (.5 - i * .5), 0));
    A(Lg, cyl(.035 * k, .045 * k, .3 * k, 5), c1, s * .13 * k, .07 * k, 0, 0, 0, -s * (Math.PI / 2 - .5)); A(Lg, cone(.035 * k, Math.hypot(.2 * k, hy + .14 * k), 5), dk, s * .36 * k, (.14 * k - hy) / 2, 0, Math.PI, 0, -s * Math.atan2(.2 * k, hy + .14 * k)); }
  for (const s of [-1, 1]) { const big = o.bigClaw === s ? 1.7 : o.noClaw === s ? .45 : 1, Ar = tag(s > 0 ? 4 : 3, J(B, s * .4 * k, .04 * k, .22 * k, 0, s * .5, 0));
    A(Ar, cyl(.05 * k, .06 * k, .3 * k, 5), c1, 0, 0, .14 * k, Math.PI / 2); const C = J(Ar, 0, .02 * k, .32 * k, -.2, -s * .7, 0); A(C, sph(.15 * k * big), c1, 0, 0, .08 * k * big, 0, 0, 0, .8, .7, 1.2);
    A(C, cone(.07 * k * big, .3 * k * big, 5), o.clawC ? mat(o.clawC, o.clawGlow) : c2, s * .04 * k, .03 * k, .3 * k * big, Math.PI / 2); A(C, cone(.05 * k * big, .24 * k * big, 5), o.clawC ? mat(o.clawC, o.clawGlow) : c2, -s * .06 * k * big, -.03 * k, .26 * k * big, Math.PI / 2, 0, -s * .35); }
  const e = { g, B, N: H, H, T: B, Jw: H, R, k: k * 1.1, L: .5, hh: hy }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- sharks: swim in the air a little above the ground (the game treats them as swimmers). Tail on part 6, head 5, jaw 27.
export function shark(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#5a7a94'), c2 = mat(o.fur2 || '#e8eef2'), dk = mat(o.dark || '#2a3a4a'), k = o.bulk || 1, eye = o.eye || '#0a0a0a';
  const B = J(g, 0, .6, 0); A(B, lathe([[.01, -1.0], [.1 * k, -.8], [.22 * k, -.3], [.3 * k, .2], [.24 * k, .6], [.01, .62]], 12), c1, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, .85); A(B, sph(.26 * k), c2, 0, -.08 * k, .1, 0, 0, 0, .9, .7, 2.6);
  A(B, ext([[0, 0], [.5, 0], [.1, .7]], .04, .012), c1, 0, .22 * k, .1, 0, -Math.PI / 2, 0, .8 * k, .7 * k, 1);
  for (const s of [-1, 1]) A(B, ext([[0, 0], [.8, -.3], [.3, .25]], .03, .01), c1, s * .2 * k, -.08 * k, .25, -Math.PI / 2, 0, s > 0 ? -.3 : Math.PI + .3, .6 * k, .6 * k, 1);
  const T = tag(6, J(B, 0, 0, -.9)); A(T, ext([[0, 0], [.5, .8], [.2, .1], [.4, -.6]], .04, .012), c1, 0, 0, 0, 0, Math.PI / 2, 0, .8 * k, .8 * k, 1);
  const R = .24 * k * (o.headK || 1), H = tag(5, J(B, 0, 0, .58)); A(H, cone(R, R * 2.0, 10), c1, 0, .02, R * .7, Math.PI / 2, 0, 0, 1, 1, .8); A(H, cone(R * .8, R * 1.4, 8), c2, 0, -R * .2, R * .5, Math.PI / 2, 0, 0, 1, 1, .5);
  for (const s of [-1, 1]) { A(H, sph(R * .14), mat(eye, o.eyeGlow), s * R * .62, R * .15, R * .6); for (let i = 0; i < 3; i++) A(H, box(.012, R * .34, .04), mat(o.gill || '#2a3a4a', o.gillGlow), s * R * .86, 0, -R * (.1 + i * .22), 0, 0, 0, 1, 1, 1, false); }
  const Jw = tag(27, J(H, 0, -R * .34, R * .1, .3, 0, 0)); A(Jw, cone(R * .7, R * 1.2, 8), c2, 0, 0, R * .5, Math.PI / 2, 0, 0, 1, 1, .4);
  for (let i = -3; i <= 3; i++) { A(Jw, cone(R * .07, R * .24 * (o.fang || 1), 4), mat('#fbf7ee'), i * R * .13, R * .1, R * (.8 - Math.abs(i) * .12)); A(H, cone(R * .07, R * .24 * (o.fang || 1), 4), mat('#fbf7ee'), i * R * .14, -R * .26, R * (1.0 - Math.abs(i) * .14), Math.PI); }
  const e = { g, B, N: H, H, T, Jw, R, k, L: 1, hh: .6 }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- birds: gulls and hawks. Wings on the slow wing parts 28/29.
export function bird(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#f1f1ee'), c2 = mat(o.fur2 || '#8a94a0'), dk = mat(o.dark || '#3a3f48'), k = o.bulk || 1, eye = o.eye || '#1a120c', bk = mat(o.beakC || '#e8b03a');
  const B = J(g, 0, o.y || 1.3, 0, -.2, 0, 0); A(B, lathe([[.01, -.5], [.12 * k, -.34], [.2 * k, 0], [.16 * k, .26], [.01, .36]], 10), c1, 0, 0, 0, Math.PI / 2);
  const T = tag(6, J(B, 0, 0, -.42 * k)); for (let i = -2; i <= 2; i++) A(T, ext([[-.5, 0], [.5, 0], [.4, -1], [0, -1.2], [-.4, -1]], .02, .006), i % 2 ? c2 : dk, i * .05 * k, 0, 0, Math.PI / 2, 0, i * .2, .12 * k, .4 * k, 1);
  for (const s of [-1, 1]) { A(B, cyl(.014 * k, .014 * k, .2 * k, 4), bk, s * .07 * k, -.22 * k, -.05, .4); const Wg = tag(s > 0 ? 28 : 29, J(B, s * .14 * k, .1 * k, .05, 0, 0, s * .2));
    for (let i = 0; i < 6; i++) A(Wg, ext([[-.5, 0], [.5, 0], [.34, -1], [0, -1.2], [-.34, -1]], .02, .006), i > 3 ? dk : i % 2 ? c2 : c1, s * (.1 + i * .17) * k, 0, 0, Math.PI / 2, 0, s * i * .1, .2 * k, (.62 - i * .04) * k, 1);
    A(Wg, cyl(.03 * k, .02 * k, 1.05 * k, 5), c2, s * .52 * k, .01, .0, 0, 0, s * Math.PI / 2); }
  const R = .13 * k * (o.headK || 1), H = tag(5, J(B, 0, .12 * k, .34 * k, .3, o.turn ?? .2, 0)); A(H, sph(R), c1); A(H, cone(R * .42, R * 1.5 * (o.beak || 1), 5), bk, 0, -R * .15, R * 1.2, Math.PI / 2 + .25);
  for (const s of [-1, 1]) { A(H, sph(R * .18), mat(eye, o.eyeGlow), s * R * .62, R * .2, R * .6); A(H, box(R * .6, R * .1, R * .3), dk, s * R * .5, R * .42, R * .6, .2, 0, -s * .4); }
  if (o.crest) for (let i = 0; i < 4; i++) A(H, cone(R * .2, R * (1.4 - i * .2), 4), mat(o.crest, o.crestGlow), 0, R * (1.0 - i * .1), -R * (.2 + i * .3), -.9 - i * .15, 0, 0, 1, 1, .4);
  const e = { g, B, N: H, H, T, Jw: H, R, k, L: .5, hh: 1.3 }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
const wingsOn = (c1, c2, kk = 1, beak) => e => {            // feathered wings (and an eagle's beak) for a four-legged body: griffons
  for (const s of [-1, 1]) { const Wg = tag(s > 0 ? 28 : 29, J(e.B, s * .22 * e.k, .26 * e.k, .2, 0, s * .2, s * .5)); A(Wg, cyl(.05, .03, 1.3 * kk, 5), mat(c2), s * .65 * kk, 0, 0, 0, 0, s * Math.PI / 2);
    for (let i = 0; i < 7; i++) A(Wg, ext([[-.5, 0], [.5, 0], [.34, -1], [0, -1.2], [-.34, -1]], .03, .01), mat(i % 2 ? c1 : c2), s * (.12 + i * .19) * kk, -.02, 0, Math.PI / 2 - .2, 0, s * i * .09, .24 * kk, (.85 - i * .05) * kk, 1); }
  if (beak) { A(e.H, cone(e.R * .5, e.R * 1.5, 5), mat(beak), 0, -e.R * .25, e.R * 1.45, Math.PI / 2 + .4, 0, 0, 1, 1, .8); for (let i = 0; i < 5; i++) A(e.H, cone(e.R * .2, e.R * .9, 4), mat(i % 2 ? c1 : c2), (i - 2) * e.R * .28, e.R * .9, -e.R * .5, -.9, 0, -(i - 2) * .2, 1, 1, .4); } };
// one of the people-shaped monsters in other colours, with boss pieces added to its head
const recolor = (pal, fn, head) => () => { setStyle({ pal }); const g = fn(); setStyle({ pal: null }); if (head) g.traverse(o => { if (o.userData.part === 5 && !o.isMesh) head({ H: o, R: .18, g }); }); return g; };
// ---- serpents, wyrms and dragons: a column of segments that sways (parts 50-58), head 5, jaw 27
export function serpent(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#2f7a6a'), c2 = mat(o.fur2 || '#bfe0c8'), dk = mat(o.dark || '#17423a'), k = o.bulk || 1, n = 9, eye = o.eye || '#ffd34d', fr = mat(o.frill || '#d8742a', o.frillGlow);
  for (let i = 0; i < 6; i++) { const a = i * 1.05; A(g, sph(.5 * k), i % 2 ? c1 : dk, Math.cos(a) * .9 * k, .32 * k, -1.0 + Math.sin(a) * .9 * k, 0, a, 0, 1.3, .7, .9); }      // the coil it rises from
  let last = null; for (let i = 0; i < n; i++) { const t = i / (n - 1), r = .5 * k * (1 - t * .42), y = .5 * k + t * 3.4 * k, z = -1.0 + Math.sin(t * 2.6) * 1.1 * k, S = tag(50 + i, J(g, 0, y, z, -.5 + t * 1.5, 0, 0));
    A(S, sph(r), i % 2 ? c1 : dk, 0, 0, 0, 0, 0, 0, 1, .7, 1); A(S, sph(r * .8), c2, 0, 0, r * .45, 0, 0, 0, .8, .7, .7);
    if (o.spine !== 0) A(S, cone(r * .22, r * 1.2 * (o.spine || 1), 4), o.spineC ? mat(o.spineC, o.spineGlow) : fr, 0, 0, -r * 1.0, -Math.PI / 2 - .3, 0, 0, 1, 1, .4);
    if (o.dots) for (const s of [-1, 1]) A(S, sph(r * .13), mat(o.dots, 1), s * r * .9, 0, r * .2);
    if (o.plate) A(S, dome(r * 1.05, .5), mat(o.plate, o.plateGlow), 0, 0, -r * .1, -Math.PI / 2, 0, 0, 1, .8, .7); last = { y, z, r }; }
  const R = .52 * k * (o.headK || 1), H = tag(5, J(g, 0, last.y + R * .9, last.z + R * .5, .5, o.turn ?? .2, 0));
  A(H, sph(R), c1, 0, 0, 0, 0, 0, 0, 1, .85, 1.1); A(H, cone(R * .8, R * 1.7, 8), c1, 0, R * .05, R * 1.2, Math.PI / 2, 0, 0, 1, 1, .7);
  for (const s of [-1, 1]) { if (!o.blindAll) { A(H, sph(R * .17), mat(eye, 1), s * R * .62, R * .32, R * .55, 0, s * .4, 0, 1.2, .7, .6); A(H, box(R * .6, R * .12, R * .3), dk, s * R * .55, R * .5, R * .6, .2, 0, -s * .45); }
    A(H, ext([[0, 0], [1, .6], [.8, -.2], [1, -.9], [0, -.6]], .03, .01), fr, s * R * .8, 0, -R * .3, 0, s > 0 ? -.5 : Math.PI + .5, 0, R * 1.1, R * 1.1, 1);
    if (o.horns) A(H, cone(R * .16, R * 1.3 * o.horns, 5), mat(o.hornC || BONE, o.hornGlow), s * R * .5, R * .9, -R * .5, -.8, 0, -s * .35);
    for (let i = 0; i < 4; i++) A(H, cone(R * .08, R * .34 * (o.fang || 1), 4), mat('#fbf7ee'), s * R * (.15 + i * .13), -R * .28, R * (1.75 - i * .3), Math.PI); }
  const Jw = tag(27, J(H, 0, -R * .34, R * .3, .4, 0, 0)); A(Jw, cone(R * .66, R * 1.5, 8), c2, 0, 0, R * .75, Math.PI / 2, 0, 0, 1, 1, .45); A(Jw, sph(R * .4), mat(o.maw || '#7a1e28', o.mawGlow), 0, R * .12, R * .5, 0, 0, 0, 1, .3, 1.8, false);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) A(Jw, cone(R * .08, R * .3 * (o.fang || 1), 4), mat('#fbf7ee'), s * R * (.15 + i * .14), R * .12, R * (1.3 - i * .3));
  const e = { g, B: g, N: H, H, T: g, Jw, R, k: k * 1.4, L: 1.2, hh: 3 }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- tree-folk: trunk body, root legs (1/2, 11/12), branch arms (3/4, 13/14), a face in the bark and a crown that nods (5)
export function treant(o = {}) {
  const g = new THREE.Group(), bk = mat(o.fur || '#6a4a2e'), bk2 = mat(o.fur2 || '#8a6a44'), dk = mat(o.dark || '#3a2616'), lf = o.leaf || '#4f8a3a', k = o.bulk || 1, hip = .8 * k, eye = o.eye || '#ffd27a', th = o.thin || 1;
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * .22 * k * th, hip, 0, 0, 0, s * .12)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -.4 * k, 0));
    A(L, cyl(.16 * k * th, .14 * k * th, .46 * k, 6), bk, 0, -.2 * k, 0); A(Kn, cyl(.14 * k * th, .2 * k * th, .4 * k, 6), bk2, 0, -.2 * k, 0); for (let i = -1; i <= 1; i++) A(Kn, cone(.07 * k * th, .4 * k, 4), dk, i * .12 * k, -.38 * k, .12 * k, Math.PI / 2 + .25, 0, -i * .6); }
  const B = J(g, 0, hip, 0); A(B, lathe([[.26 * k * th, 0], [.3 * k * th, .3 * k], [.24 * k * th, .7 * k], [.3 * k * th, 1.0 * k], [.2 * k * th, 1.3 * k], [.01, 1.38 * k]], 8), bk);
  for (const [x, y] of [[.2, .35], [-.22, .62], [.16, 1.05]]) A(B, sph(.08 * k), dk, x * k * th, y * k, .18 * k * th, 0, 0, 0, 1, 1, .5);
  for (const s of [-1, 1]) { const Sh = tag(s > 0 ? 4 : 3, J(B, s * .28 * k * th, 1.0 * k, 0, -.2, 0, s * .6)), El = tag(s > 0 ? 14 : 13, J(Sh, 0, -.6 * k, 0, -.6, 0, 0));
    A(Sh, cyl(.1 * k * th, .13 * k * th, .62 * k, 6), bk, 0, -.3 * k, 0); A(El, sph(.11 * k * th), dk); A(El, cyl(.07 * k * th, .1 * k * th, .55 * k, 6), bk2, 0, -.27 * k, 0);
    for (let i = -1; i <= 1; i++) A(El, cone(.035 * k, .3 * k, 4), dk, i * .07 * k, -.66 * k, 0, Math.PI, 0, i * .45); if (o.tuft) A(El, sph(.14 * k), mat(o.tuft), 0, -.1 * k, 0, 0, 0, 0, 1.2, .8, 1.2); }
  const R = .22 * k, H = tag(5, J(B, 0, .95 * k, .2 * k * th, 0, o.turn ?? .15, 0));
  for (const s of [-1, 1]) { A(H, sph(R * .26), mat(eye, 1), s * R * .55, R * .2, R * .15, 0, 0, s * .5, 1.3, .7, .5); A(H, cone(R * .12, R * .9, 4), dk, s * R * .6, R * .6, R * .15, 0, 0, -s * 1.2); }
  A(H, sph(R * .22), bk2, 0, -R * .15, R * .22); A(H, box(R * .9, R * .22, R * .2), mat('#1a100a'), 0, -R * .75, R * .05, 0, 0, o.mouth ?? .08, 1, 1, 1, false);
  const C = J(H, 0, .62 * k, -.2 * k * th), cp = o.canopy || 'leaf';
  if (cp === 'leaf') for (const [x, y, z, r] of [[0, .2, 0, .5], [.4, 0, .1, .36], [-.42, .05, -.05, .38], [.1, .1, -.36, .34], [-.1, .45, .1, .3]]) A(C, sph(r * k), mat(shade(lf, .85 + r * .5)), x * k, y * k, z * k, x, y, z);
  else if (cp === 'bare') for (let i = 0; i < 7; i++) A(C, cone(.05 * k, (.7 - (i % 3) * .15) * k, 4), dk, Math.sin(i * .9) * .2 * k, .15 * k, Math.cos(i * .9) * .1 * k, Math.cos(i * 1.7) * .5, 0, -Math.sin(i * .9) * .9);
  else if (cp === 'pine') for (let i = 0; i < 3; i++) A(C, cone((.5 - i * .13) * k, .55 * k, 7), mat(shade(lf, .9 + i * .12)), 0, (-.1 + i * .34) * k, 0);
  else if (cp === 'mush') { A(C, dome(.62 * k, .5), mat(lf), 0, -.12 * k, 0, 0, 0, 0, 1, .8, 1); A(C, cyl(.6 * k, .5 * k, .06 * k, 10), mat('#efe6d0'), 0, -.13 * k, 0); for (const [x, z, r] of [[.25, .2, .1], [-.3, .1, .12], [.05, -.3, .09], [-.1, .35, .07]]) A(C, sph(r * k), mat(o.spot || '#fbf7ee', o.spotGlow), x * k, .2 * k, z * k, 0, 0, 0, 1, .4, 1); }
  else if (cp === 'flower') { A(C, cyl(.3 * k, .3 * k, .1 * k, 10), mat('#5a3a1a'), 0, .1 * k, .25 * k, Math.PI / 2 - .3); for (let i = 0; i < 12; i++) A(C, ext([[0, 0], [.5, .5], [0, 1.4], [-.5, .5]], .03, .01), mat(lf), Math.sin(i * .524) * .3 * k, .1 * k + Math.cos(i * .524) * .3 * k, .22 * k, -.3, 0, -i * .524, .2 * k, .28 * k, 1); }
  else if (cp === 'hedge') { A(C, box(.9 * k, .7 * k, .7 * k), mat(lf), 0, .15 * k, 0); A(C, box(.5 * k, .3 * k, .5 * k), mat(shade(lf, 1.15)), 0, .62 * k, 0); }
  const e = { g, B: J(B, 0, .6 * k, 0), N: H, H, T: C, Jw: H, R, k: k * .8, L: .3, hh: hip, C }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- scarecrows: a sack body on a pole, arms out on a crossbar
export function scarecrow(o = {}) {
  const g = new THREE.Group(), c1 = mat(o.fur || '#6a4a3a'), c2 = mat(o.fur2 || '#3a5a7a'), sk = mat(o.sack || '#c8b080'), straw = mat(o.straw || '#e8c860'), wood = mat('#5c3b22'), dk = mat('#1a100a'), k = o.bulk || 1, eye = o.eye || '#ffb347';
  A(g, cyl(.05 * k, .06 * k, 1.0 * k, 5), wood, 0, .5 * k, 0);
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * .15 * k, .95 * k, 0, s * .1, 0, s * .08)); A(L, cyl(.11 * k, .09 * k, .7 * k, 6), c2, 0, -.35 * k, 0); for (let i = -1; i <= 1; i++) A(L, cone(.03 * k, .22 * k, 4), straw, i * .05 * k, -.76 * k, 0, Math.PI, 0, i * .3); }
  const B = J(g, 0, .92 * k, 0); A(B, lathe([[.2 * k, 0], [.3 * k, .1 * k], [.32 * k, .45 * k], [.24 * k, .72 * k], [.1 * k, .8 * k]], 8), c1, 0, 0, 0, 0, 0, 0, 1, 1, .75);
  A(B, box(.14 * k, .14 * k, .03), c2, .1 * k, .3 * k, .24 * k, 0, 0, .2); A(B, box(.1 * k, .12 * k, .03), sk, -.12 * k, .5 * k, .22 * k, 0, 0, -.3); A(B, tor(.31 * k, .03 * k), mat('#8a6a44'), 0, .14 * k, 0, Math.PI / 2, 0, 0, 1, .75, 1);
  for (let i = 0; i < 9; i++) A(B, cone(.035 * k, .22 * k, 4), straw, Math.sin(i * .7) * .13 * k, .82 * k, Math.cos(i * .7) * .1 * k, Math.cos(i * .7) * .6, 0, -Math.sin(i * .7) * .7);
  A(B, cyl(.03 * k, .03 * k, 1.5 * k, 5), wood, 0, .66 * k, -.04 * k, 0, 0, Math.PI / 2);
  for (const s of [-1, 1]) { const Sh = tag(s > 0 ? 4 : 3, J(B, s * .26 * k, .66 * k, 0, 0, 0, s * 1.25)), El = tag(s > 0 ? 14 : 13, J(Sh, 0, -.36 * k, 0, -.3, 0, s * -.3));
    A(Sh, cyl(.1 * k, .09 * k, .4 * k, 6), c1, 0, -.18 * k, 0); A(El, cyl(.09 * k, .11 * k, .36 * k, 6), c1, 0, -.18 * k, 0); for (let i = 0; i < 5; i++) A(El, cone(.03 * k, .26 * k, 4), straw, Math.sin(i * 1.26) * .05 * k, -.46 * k, Math.cos(i * 1.26) * .05 * k, Math.PI + Math.cos(i * 1.26) * .3, 0, Math.sin(i * 1.26) * .3);
    if (o.hook === s) A(El, tor(.14 * k, .02 * k, Math.PI * 1.2), mat('#b9c4d6'), 0, -.56 * k, 0, 0, Math.PI / 2, 0); }
  const R = .2 * k * (o.headK || 1), H = tag(5, J(B, 0, 1.0 * k, .02, .08, o.turn ?? .2, .06));
  if (o.pumpkin) { A(H, sph(R * 1.15), mat('#e07a1e'), 0, 0, 0, 0, 0, 0, 1.15, .9, 1.1); A(H, cyl(R * .12, R * .18, R * .4, 5), mat('#4f6a2a'), 0, R * 1.05, 0, 0, 0, .3); } else { A(H, sph(R), sk, 0, 0, 0, 0, 0, 0, 1, 1.1, 1); A(H, tor(R * .7, R * .08), mat('#8a6a44'), 0, -R * .85, 0, Math.PI / 2); }
  for (const s of [-1, 1]) A(H, cone(R * .2, R * .34, 3), mat(eye, 1), s * R * .4, R * .15, R * .95, Math.PI / 2 - .2, 0, 0, 1, 1, .4);
  for (let i = -2; i <= 2; i++) A(H, box(R * .05, R * .2, R * .05), dk, i * R * .2, -R * .4 + (i % 2 ? .0 : R * .06), R * 1.0, 0, 0, 0, 1, 1, 1, false); A(H, box(R * .9, R * .05, R * .05), dk, 0, -R * .4, R * .98, 0, 0, 0, 1, 1, 1, false);
  if (o.hat !== 0) { A(H, cyl(R * 1.9, R * 2.0, R * .08, 10), mat(o.hatC || '#3a2e22'), 0, R * .72, 0, -.1, 0, .1); A(H, cone(R * .95, R * 1.6, 8), mat(o.hatC || '#3a2e22'), 0, R * 1.45, -R * .1, -.3, 0, .2); }
  const e = { g, B: J(B, 0, .4 * k, 0), N: H, H, T: B, Jw: H, R, k: k * .6, L: .2, hh: .9 }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
// ---- golems: a boulder chest, sunk head, huge forearms and fists. Same parts as a person.
export function golem(o = {}) {
  const g = new THREE.Group(), fc = o.fur || '#7a7672', c1 = mat(fc), c2 = mat(o.fur2 || '#a8a49c'), dk = mat(o.dark || '#3e3a36'), k = o.bulk || 1, core = o.core, hip = .7 * k, eye = o.eye || core || '#ffd27a', hd = o.head || 'rock';
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * .3 * k, hip, 0)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -.32 * k, 0)); A(L, sph(.22 * k), c1, 0, -.14 * k, 0, 0, 0, 0, 1, 1.1, 1); A(Kn, cyl(.2 * k, .26 * k, .34 * k, 6), c2, 0, -.14 * k, 0); A(Kn, sph(.26 * k), dk, 0, -.3 * k, .06 * k, 0, 0, 0, 1.1, .5, 1.4); }
  const B = J(g, 0, hip, 0, .12, 0, 0); A(B, sph(.34 * k), c2, 0, .1 * k, 0, 0, 0, 0, 1.2, .8, 1); A(B, sph(.56 * k), c1, 0, .6 * k, 0, 0, 0, 0, 1.2, .95, .95);
  if (core) { A(B, sph(.2 * k), mat(core, 1), 0, .58 * k, .42 * k, 0, 0, 0, 1, 1, .5); for (const [x, y, rz] of [[.3, .78, .6], [-.34, .7, -.7], [.26, .36, -.5], [-.2, .34, .5]]) A(B, box(.04 * k, .26 * k, .03), mat(core, 1), x * k, y * k, .48 * k, -.1, x > 0 ? .5 : -.5, rz); }
  for (const s of [-1, 1]) { A(B, sph(.3 * k), c2, s * .66 * k, .9 * k, 0, 0, 0, 0, 1.1, .9, 1); if (o.spikes) for (let i = 0; i < 3; i++) A(B, i ? cone(.07 * k, .36 * k, 4) : cone(.09 * k, .5 * k, 4), mat(o.spikes, o.spikeGlow), s * (.66 + (i - 1) * .14) * k, 1.2 * k - Math.abs(i - 1) * .06 * k, -.05 * k * i, 0, 0, -s * (.3 + i * .2));
    const Sh = tag(s > 0 ? 4 : 3, J(B, s * .8 * k, .82 * k, 0, -.15, 0, s * .2)), El = tag(s > 0 ? 14 : 13, J(Sh, 0, -.52 * k, 0, -.5, 0, 0)), fs = (o.fist || 1) * (o.bigFist === s ? 1.5 : 1);
    A(Sh, cyl(.16 * k, .2 * k, .5 * k, 6), c1, 0, -.26 * k, 0); A(El, sph(.2 * k), dk); A(El, cyl(.2 * k, .3 * k, .5 * k, 6), c2, 0, -.28 * k, 0); A(El, sph(.32 * k * fs), o.fistC ? mat(o.fistC, o.fistGlow) : c1, 0, -.6 * k, 0, 0, 0, 0, 1, .9, 1.1);
    if (o.arm) o.arm(El, s, k); }
  const R = .2 * k * (o.headK || 1), H = tag(5, J(B, 0, 1.12 * k, .14 * k, 0, o.turn ?? .15, 0));
  if (hd === 'rock') { A(H, sph(R), c1, 0, 0, 0, 0, 0, 0, 1.1, .9, 1); A(H, box(R * 1.6, R * .3, R * .5), dk, 0, R * .35, R * .6, .3); for (const s of [-1, 1]) A(H, sph(R * .18), mat(eye, 1), s * R * .42, R * .08, R * .86, 0, 0, s * .3, 1.3, .6, .5); A(H, box(R * .8, R * .14, R * .2), dk, 0, -R * .5, R * .78); }
  else if (hd === 'skull') { A(H, sph(R * 1.1), mat(BONE), 0, 0, 0, 0, 0, 0, 1, 1.05, 1); A(H, box(R * 1.1, R * .5, R * .7), mat(BONE), 0, -R * .8, R * .3); for (const s of [-1, 1]) { A(H, sph(R * .3), mat('#1a120c'), s * R * .42, R * .1, R * .85, 0, 0, 0, 1, 1.1, .5, false); A(H, sph(R * .12), mat(eye, 1), s * R * .42, R * .1, R * 1.0); } for (let i = -2; i <= 2; i++) A(H, box(R * .03, R * .4, R * .05), mat('#1a120c'), i * R * .2, -R * .8, R * .66, 0, 0, 0, 1, 1, 1, false); }
  else if (hd === 'lens') { A(H, tor(R * 1.4, R * .22), mat(o.rim || GOLD), 0, R * .3, R * .3); A(H, cyl(R * 1.3, R * 1.3, R * .16, 12), mat(eye, 1), 0, R * .3, R * .3, Math.PI / 2); A(H, sph(R * .4), mat('#ffffff', 1), R * .4, R * .7, R * .4, 0, 0, 0, 1, 1, .3); }
  else if (hd === 'bell') { A(H, lathe([[R * 1.6, -R * .6], [R * 1.2, 0], [R * .9, R * .9], [R * .3, R * 1.4], [.01, R * 1.5]], 10), mat(o.rim || '#b8964a')); A(H, sph(R * .3), dk, 0, -R * .7, 0); for (const s of [-1, 1]) A(H, box(R * .5, R * .12, R * .1), mat(eye, 1), s * R * .5, R * .2, R * 1.12, 0, s * .4, s * .2); }
  else if (hd === 'helm') { A(H, dome(R * 1.25, .6), mat(o.rim || STEEL), 0, -R * .2, 0); A(H, box(R * 1.6, R * .2, R * .2), mat(eye, 1), 0, R * .05, R * 1.1); A(H, cone(R * .2, R * 1.0, 5), mat(o.rim || STEEL), 0, R * 1.3, 0); }
  const e = { g, B, Bc: B, N: H, H, T: B, Jw: H, R, k, L: .3, hh: hip }; for (const f of [].concat(o.extra || [])) f(e);
  return g;
}
const gShards = (c, glow, n = 6, len = 1) => e => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; A(e.B, octa(.12 * e.k), mat(c, glow), Math.sin(a) * .5 * e.k, (1.05 + Math.cos(a * 2) * .12) * e.k, -.15 * e.k + Math.cos(a) * .3 * e.k, Math.cos(a) * .5, 0, -Math.sin(a) * .7, .8, 2.6 * len, .8); } };
const gBarn = (c = '#d8d0c0') => e => { for (const [x, y, z] of [[.5, .9, .3], [-.55, .6, .35], [.2, .3, .5], [-.3, 1.0, .3], [.6, .5, .1], [-.1, .75, .55]]) { A(e.B, cone(.1 * e.k, .12 * e.k, 6), mat(c), x * e.k, y * e.k, z * e.k, 1.2, 0, -x); A(e.B, sph(.04 * e.k), mat('#3a5a4a'), x * e.k, y * e.k, z * e.k + .04 * e.k); } for (let i = 0; i < 4; i++) A(e.B, cone(.03 * e.k, .5 * e.k, 4), mat('#3a7a5a'), (-.4 + i * .28) * e.k, .1 * e.k, .3 * e.k, Math.PI + .3); };
const gGears = (c = GOLD) => e => { for (const [x, y, r] of [[.3, .75, .2], [-.28, .5, .26], [.1, .34, .14]]) { A(e.B, cyl(r * e.k, r * e.k, .06 * e.k, 8), mat(c), x * e.k, y * e.k, .52 * e.k, Math.PI / 2); A(e.B, cyl(r * .4 * e.k, r * .4 * e.k, .08 * e.k, 6), mat('#3a2e22'), x * e.k, y * e.k, .53 * e.k, Math.PI / 2); } };
const gRibs = (c = BONE) => e => { for (let i = 0; i < 4; i++) A(e.B, tor((.62 - i * .05) * e.k, .04 * e.k, Math.PI), mat(c), 0, (.82 - i * .16) * e.k, .1 * e.k, 0, 0, Math.PI); };
const gPlates = (c = GOLD) => e => { A(e.B, sph(.5 * e.k), mat(c), 0, .66 * e.k, .2 * e.k, 0, 0, 0, 1.1, .8, .6); for (const s of [-1, 1]) A(e.B, dome(.36 * e.k, .6), mat(c), s * .66 * e.k, .95 * e.k, 0, 0, 0, -s * .3); };
const gMaw = (c = '#ff7a2a') => e => { A(e.B, sph(.3 * e.k), mat('#1a0c08'), 0, .5 * e.k, .4 * e.k, 0, 0, 0, 1.3, .7, .5); A(e.B, sph(.16 * e.k), mat(c, 1), 0, .5 * e.k, .46 * e.k, 0, 0, 0, 1.3, .6, .4); for (let i = -3; i <= 3; i++) { A(e.B, cone(.05 * e.k, .18 * e.k, 4), mat(BONE), i * .1 * e.k, .68 * e.k, .56 * e.k, Math.PI); A(e.B, cone(.05 * e.k, .18 * e.k, 4), mat(BONE), i * .1 * e.k, .32 * e.k, .56 * e.k); } };
// ---- families
const WOLF = {}, HOUND = { ears: 'flop', muzzle: [.9, 1.3], bulk: 1.22, ruff: 0, mane: { n: 0 }, tail: 'thin', noCheek: 1, headK: 1.08 };
const BEAR = { bulk: 1.5, hh: .82, len: 1.22, legR: .9, hump: .7, humpZ: .2, chest: .6, ears: 'round', earK: 1.1, muzzle: [.85, 1.45], noBrow: 1, tail: 'stub', ruff: 0, mane: { n: 0 }, neck: .5, neckRx: .85, neckW: 1.25, headK: 1.45, claw: 2, noCheek: 1, eyeGlow: 0, eye: '#2a1c14', eyeK: .7, turn: .15 };
const BOAR = { bulk: 1.3, hh: .52, len: .95, legR: .7, hump: .8, ears: 'side', earK: .7, muzzle: [1.3, 1.05], disc: 1, tusks: 1, tail: 'thin', tailLen: .5, ruff: 0, mane: { n: 8, len: .26, w: .06 }, neck: .28, neckW: 1.25, neckRx: -1.0, headK: 1.15, hoof: 1, noFang: 1, noCheek: 1, eyeGlow: 0, eye: '#2a1c14', eyeK: .6, turn: .15 };
const RAT = { bulk: .8, hh: .34, len: .9, legR: .7, ears: 'round', earK: 1.2, muzzle: [1.2, .7], buck: 1, noFang: 1, tail: 'thin', tailC: '#d99a8a', tailLen: 1.5, ruff: 0, mane: { n: 0 }, neck: .24, neckRx: -1.1, hump: .9, noCheek: 1, noBrow: 1, eyeK: .8 };
const STAG = { bulk: .86, hh: 1.0, len: 1.0, legR: .62, ears: 'side', earK: 1.1, muzzle: [1.1, .8], tail: 'stub', ruff: 0, mane: { n: 0 }, neck: .7, neckRx: -.25, neckW: .8, hoof: 1, noFang: 1, noCheek: 1, noBrow: 1, eyeGlow: 0, eye: '#2a1c14', eyeK: .8, waist: .24 };
const Q = (base, o) => () => quad({ ...base, ...o });
// name of the creature in the game -> [builder, the game kind whose movement it borrows]
export const BEASTS = {
  // wolves
  'Plains Wolf': [Q(WOLF, {}), 'wolf'],
  'Ashwood Wolf': [Q(WOLF, { fur: '#5b5049', fur2: '#b9b1a6', dark: '#2a2422', mane: { n: 7, len: .26 }, sock: '#b9b1a6' }), 'wolf'],
  'Thornwolf': [Q(WOLF, { fur: '#56603a', fur2: '#a9b07a', dark: '#2f3a22', eye: '#b6ff3a', mane: { n: 8, len: .34, mat: '#6b4526' }, extra: [moss('#3f7a3a'), collar('#4f8a3a', '#6b4526')] }), 'wolf'],
  'Rimewolf': [Q(WOLF, { fur: '#cfe0ea', fur2: '#f4fbff', dark: '#6a8aa0', eye: '#7fe9ff', paw: '#bfefff', mane: { n: 7, len: .36, mat: '#bfefff', glow: 1 }, extra: [shards('#e8fbff', 1, 5, .3)] }), 'wolf'],
  'Blighted Wolf': [Q(WOLF, { fur: '#7a8064', fur2: '#b8b89a', dark: '#3a4030', eye: '#b6ff3a', ruff: .6, mane: { n: 6, len: .2, mat: BONE }, extra: [sores('#b6ff3a', 5), bald()] }), 'wolf'],
  'Blightwolf': [Q(WOLF, { fur: '#55603f', fur2: '#8f9a6a', dark: '#262c1c', eye: '#d8ff5a', ruff: .5, bulk: 1.08, mane: { n: 8, len: .3, mat: BONE }, tongue: '#b6ff3a', tongueGlow: 1, extra: [sores('#b6ff3a', 9), bald('#8a5a50'), ribs()] }), 'wolf'],
  'Snowstalker': [Q(WOLF, { fur: '#bfe8f4', fur2: '#effcff', dark: '#7fb0c8', eye: '#ffffff', bulk: .9, hh: .74, legR: .85, ruff: .7, mane: { n: 9, len: .3, mat: '#effcff', glow: 1 }, extra: [wisps('#effcff')], noTail: 1, tail: 'none' }), 'wolf'],
  // hounds
  'Keep Mastiff': [Q(HOUND, { fur: '#b08a5a', fur2: '#3a2e26', dark: '#3a2e26', eyeGlow: 0, eye: '#2a1c14', extra: [collar('#5c3b22', STEEL)] }), 'wolf'],
  'Emberhound': [Q(HOUND, { fur: '#4a3430', fur2: '#2a2022', dark: '#1c1416', eye: '#ffb347', paw: '#ff7a2a', pawGlow: 1, tongue: '#ffb347', tongueGlow: 1, bulk: 1.1, extra: [cracks(), e => { for (let i = 0; i < 3; i++) tag(7, A(e.T, cone(.07 - i * .015, .2, 5), mat(FLAME[i], 1), 0, .85 + i * .1, 0)); }] }), 'wolf'],
  'Hollow Hound': [Q(HOUND, { fur: '#2e2a30', fur2: '#1a181c', dark: '#0e0c10', eye: '#ff7a2a', bulk: 1.1, extra: [ribs(BONE, '#ff7a2a'), collar('#3a3a44', 1)] }), 'wolf'],
  // wolf bosses and named rares
  'Old Greymane': [Q(WOLF, { fur: '#8b8b90', fur2: '#e9e5dc', dark: '#4a4a52', bulk: 1.14, headK: 1.08, ruff: 1.5, mane: { n: 7, len: .3, mat: '#e9e5dc' }, blind: -1, torn: 1, eye: '#bfe6ff', extra: [arrows, scars(3)] }), 'wolf'],
  'Greymane': [Q(WOLF, { fur: '#3c3c44', fur2: '#c9cdd6', dark: '#1c1c22', bulk: 1.18, headK: 1.1, ruff: 1.8, mane: { n: 11, len: .44, mat: '#c9cdd6' }, sock: '#c9cdd6', eye: '#ffd34d', torn: -1, extra: [scars(2)] }), 'wolf'],
  'Greytooth': [Q(WOLF, { fur: '#77777c', fur2: '#a8a8ae', dark: '#34343a', bulk: 1.3, headK: 1.25, fang: 3.2, ruff: 1.2, muzzle: [1.25, 1.2], mane: { n: 6, len: .24 }, extra: [plates('#5a5a62', '#34343a'), scars(2)] }), 'wolf'],
  'Grimtooth': [Q(WOLF, { fur: '#5a2e26', fur2: '#8a5a48', dark: '#2a1412', bulk: 1.2, headK: 1.2, eye: '#ff5a3a', noFang: 1, mane: { n: 8, len: .3 }, extra: [collar(STEEL, 1), e => { A(e.Jw, box(e.R * 1.0, e.R * .2, e.R * 1.0), mat(STEEL), 0, e.R * .05, e.R * .5); for (let i = -2; i <= 2; i++) { A(e.Jw, cone(e.R * .08, e.R * .34, 4), mat('#dfe6f0'), i * e.R * .2, e.R * .3, e.R * .95); A(e.H, cone(e.R * .08, e.R * .34, 4), mat('#dfe6f0'), i * e.R * .2, -e.R * .42, e.R * 1.5, Math.PI); } }] }), 'wolf'],
  'Rotfang': [Q(WOLF, { fur: '#4f5a3a', fur2: '#8a9060', dark: '#22281a', bulk: 1.25, headK: 1.3, fang: 2.6, eye: '#b6ff3a', blind: 1, ruff: .4, tail: 'thin', tailC: BONE, mane: { n: 9, len: .34, mat: BONE }, tongue: '#b6ff3a', tongueGlow: 1, extra: [ribs(BONE, '#b6ff3a'), sores('#d8ff5a', 8), e => { A(e.H, dome(e.R * 1.03, .5), mat(BONE), e.R * .1, e.R * .02, e.R * .05, 0, 0, -1.2); }] }), 'wolf'],
  'Wintermaw': [Q(WOLF, { fur: '#dfeef6', fur2: '#ffffff', dark: '#5a86a8', bulk: 1.35, headK: 1.4, muzzle: [1.35, 1.35], fang: 2.2, eye: '#7fe9ff', tongue: '#7fe9ff', tongueGlow: 1, paw: '#bfefff', ruff: 1.6, mane: { n: 10, len: .55, mat: '#bfefff', glow: 1, w: .09 }, extra: [icicles(), shards('#e8fbff', 1, 8, .5), wisps('#e8fbff', 4)] }), 'wolf'],
  "The Duke's Hounds": [Q(HOUND, { fur: '#3a3230', fur2: '#1e1a1a', dark: '#141212', eye: '#ffc93a', bulk: 1.3, extra: [blanket('#2f5fb0'), plates('#b9c4d6', GOLD), collar(GOLD, '#b9c4d6')] }), 'wolf'],
  "Gilt, Thorne's Hound": [Q(HOUND, { fur: '#c9a04a', fur2: '#8a6a2a', dark: '#5a4418', eye: '#ffffff', bulk: 1.2, paw: GOLD, extra: [plates(GOLD, '#fff2b0'), collar('#fff2b0', GOLD), e => A(e.H, cone(e.R * .16, e.R * .9, 5), mat('#b8241c'), 0, e.R * 1.2, -e.R * .2, -.4)] }), 'wolf'],
  'The Chain-Hound': [Q(HOUND, { fur: '#1e1c20', fur2: '#0f0e10', dark: '#08080a', eye: '#ff3a2a', bulk: 1.35, headK: 1.15, extra: [chains('#8a8f9a'), collar('#8a8f9a', 1), e => { for (let i = -1; i <= 1; i++) A(e.H, tor(e.R * (.5 - Math.abs(i) * .08), e.R * .05), mat('#8a8f9a'), 0, -e.R * .2, e.R * (1.1 + i * .3)); A(e.H, box(e.R * .08, e.R * .08, e.R * 1.0), mat('#8a8f9a'), 0, e.R * .15, e.R * 1.2); }], leg: (Lg, Kn) => A(Kn, tor(.07, .022), mat('#8a8f9a'), 0, -.22, 0, Math.PI / 2) }), 'wolf'],
  'The Ember King': [Q(WOLF, { fur: '#2b2326', fur2: '#4b3a36', dark: '#161214', bulk: 1.3, headK: 1.15, ruff: 0, eye: '#ffe27a', paw: '#ff7a2a', pawGlow: 1, tongue: '#ffb347', tongueGlow: 1, tail: 'none', mane: { n: 0 }, extra: [flames(), cracks(), e => { for (let i = 0; i < 7; i++) { const a = (i - 3) * .42; A(e.H, cone(e.R * .16, e.R * (1.1 - Math.abs(i - 3) * .12), 5), mat('#161214'), Math.sin(a) * e.R * .95, e.R * .85 + Math.cos(a) * e.R * .2, -e.R * .1, -.25, 0, -a * .9); tag(7, A(e.H, cone(e.R * .1, e.R * .6, 4), mat(FLAME[i % 4], 1), Math.sin(a) * e.R * .95, e.R * 1.5 + Math.cos(a) * e.R * .2, -e.R * .22, -.25, 0, -a * .9)); } }, e => { A(e.B, tor(.27 * e.k, .035), mat(STEEL), 0, .06, .5, .3); for (let i = 0; i < 4; i++) A(e.B, tor(.045, .014), mat(STEEL), 0, -.2 - i * .07, .62 - i * .01, i % 2 ? 0 : Math.PI / 2); }] }), 'wolf'],
  'Old Fang': [Q(WOLF, { fur: '#9fc8dc', fur2: '#e8fbff', dark: '#4a7a98', bulk: 1.1, hh: .72, eye: '#ffffff', ruff: 1.3, tail: 'none', mane: { n: 10, len: .4, mat: '#e8fbff', glow: 1, flick: 1 }, noFang: 1, extra: [wisps('#e8fbff', 7), ribs('#e8fbff'), e => A(e.H, cone(e.R * .16, e.R * 1.5, 5), mat('#ffffff', 1), e.R * .26, -e.R * 1.05, e.R * 1.45, Math.PI)] }), 'wolf'],
  // bears
  'Grizzled Bear': [Q(BEAR, { fur: '#6a4a30', fur2: '#b89a70', dark: '#3a2616' }), 'bear'],
  'Blight-Sick Bear': [Q(BEAR, { fur: '#6a6a48', fur2: '#a0a070', dark: '#30301e', eye: '#b6ff3a', eyeGlow: 1, tongue: '#b6ff3a', tongueGlow: 1, extra: [sores('#b6ff3a', 8), bald('#8a5a50')] }), 'bear'],
  'Rime Bear': [Q(BEAR, { fur: '#e4eef4', fur2: '#ffffff', dark: '#6a8aa0', eye: '#2a4a6a', extra: [shards('#bfefff', 1, 6, .34)] }), 'bear'],
  'Gloomstalker': [Q(BEAR, { fur: '#221c2a', fur2: '#3a3048', dark: '#0e0a14', eye: '#c08aff', eyeGlow: 1, eyeK: 1, claw: 3.2, mane: { n: 9, len: .34, mat: '#0e0a14', flick: 1 }, extra: [wisps('#c08aff', 5)] }), 'bear'],
  'Old White': [Q(BEAR, { fur: '#eef2f4', fur2: '#ffffff', dark: '#8aa0b0', bulk: 1.95, headK: 1.4, fang: 1.8, blind: 1, torn: -1, eye: '#2a4a6a', claw: 3, extra: [icicles(), scars(3), shards('#bfefff', 1, 9, .6), e => { for (const s of [-1, 1]) A(e.B, octa(.16), mat('#d8f6ff', 1), s * .3 * e.k, .3 * e.k, .32, 0, 0, s * .5, .8, 2.6, .8); }] }), 'bear'],
  'Old Redeye': [Q(BEAR, { fur: '#3a2a22', fur2: '#6a4a3a', dark: '#1a100c', bulk: 1.8, headK: 1.35, blind: -1, torn: 1, eye: '#ff2a1a', eyeGlow: 1, eyeK: 1.3, claw: 2.6, extra: [scars(3), e => { const Sp = J(e.B, .2, .34 * e.k, .3, -.5, 0, -.6); A(Sp, cyl(.02, .02, .7, 5), mat('#6b4526'), 0, .3, 0); A(Sp, box(.1, .02, .02), mat('#6b4526'), 0, .66, 0, 0, 0, .5); }, collar('#5c3b22', BONE)] }), 'bear'],
  // boars
  'Bristleback Boar': [Q(BOAR, { fur: '#6a4a32', fur2: '#8a6a4a', dark: '#2a1c12' }), 'boar'],
  'Rotting Boar': [Q(BOAR, { fur: '#6a705a', fur2: '#8a9070', dark: '#2a301e', eye: '#b6ff3a', eyeGlow: 1, mane: { n: 8, len: .24, w: .05, mat: BONE }, extra: [ribs(), sores('#b6ff3a', 6), bald('#8a5a50')] }), 'boar'],
  'Mossback Boar': [Q(BOAR, { fur: '#5a4a34', fur2: '#7a6a4a', dark: '#2a2014', mane: { n: 0 }, extra: [moss(), mush('#e8bd4c')] }), 'boar'],
  'Sporeback Boar': [Q(BOAR, { fur: '#5a4048', fur2: '#8a6a70', dark: '#2a1c22', mane: { n: 0 }, extra: [mush('#c8382c'), sores('#ffd27a', 5)] }), 'boarbig'],
  'Royal Forest Boar': [Q(BOAR, { fur: '#2e2a26', fur2: '#e9e5dc', dark: '#14120e', tuskC: GOLD, tusks: 1.4, mane: { n: 9, len: .34, w: .07, mat: '#e9e5dc' }, bulk: 1.4 }), 'boarbig'],
  'Grumblesnout': [Q(BOAR, { fur: '#8a5a4a', fur2: '#b88a78', dark: '#3a2018', bulk: 1.6, headK: 1.3, muzzle: [1.5, 1.3], tusks: .7, mane: { n: 5, len: .16, w: .05 }, extra: [e => A(e.H, tor(e.R * .22, e.R * .05), mat(GOLD), 0, -e.R * .32, e.R * 2.2, .3)] }), 'boarbig'],
  'Old Mother Bristle': [Q(BOAR, { fur: '#7a7068', fur2: '#b8b0a4', dark: '#3a3430', bulk: 1.55, tusks: 1.2, torn: 1, mane: { n: 12, len: .4, w: .06, mat: '#d8d4cc' }, extra: [scars(2), e => { for (const [x, z] of [[.34, -.1], [-.36, .1], [.3, -.5]]) A(e.g, sph(.12), mat('#b88a78'), x, .13, z, 0, x, 0, .9, .9, 1.4); }] }), 'boarbig'],
  'Old Bristleback': [Q(BOAR, { fur: '#4a3424', fur2: '#6a4a32', dark: '#1e140c', bulk: 1.5, tusks: 1.6, blind: 1, mane: { n: 12, len: .6, w: .07, mat: '#2a1c12' }, extra: [scars(3), e => { for (let i = 0; i < 10; i++) for (const s of [-1, 1]) A(e.B, cone(.045, .4, 4), mat('#1e140c'), s * .16, .3 * e.k, (.4 - i * .09) * e.L, -.5, 0, -s * .6); }, e => A(e.H, cone(e.R * .12, e.R * .5, 5), mat(BONE), -e.R * .55, -e.R * .1, e.R * 1.5, -.5, 0, .5)] }), 'boarbig'],
  'The Shard-Beast': [Q(BOAR, { fur: '#6a8ab0', fur2: '#bfe8ff', dark: '#2a4a6a', bulk: 1.5, tuskC: '#e8fbff', tusks: 1.8, eye: '#ffffff', eyeGlow: 1, eyeK: 1, mane: { n: 0 }, extra: [shards('#e8fbff', 1, 12, .7), sores('#bfefff', 6), e => { for (const s of [-1, 1]) A(e.B, octa(.14), mat('#bfefff', 1), s * .32 * e.k, .1, -.1, 0, 0, s * 1.0, .8, 2.4, .8); }] }), 'boarbig'],
  // rats
  'Plague Rat': [Q(RAT, { fur: '#5a5448', fur2: '#8a8470', dark: '#2a261e', eye: '#b6ff3a', extra: [sores('#b6ff3a', 4)] }), 'boar'],
  'The Rat King': [Q(RAT, { fur: '#3a3430', fur2: '#6a6058', dark: '#1a1614', bulk: 1.3, headK: 1.25, eye: '#ff5a3a', tail: 'none', mane: { n: 6, len: .2 }, extra: [tails('#d99a8a', 7), crown(BONE, '#b6ff3a'), scars(2), e => { for (const [x, z] of [[.3, .3], [-.32, -.2]]) { A(e.g, sph(.1), mat('#5a5448'), x, .1, z, 0, x * 2, 0, .8, .8, 1.5); A(e.g, sph(.02), mat('#ff5a3a', 1), x + .03, .14, z + .12); } }] }), 'boarbig'],
  // stags
  "The King's White Stag": [Q(STAG, { fur: '#f4f1e8', fur2: '#ffffff', dark: '#b8b0a0', eye: '#2f5fb0', extra: [antlers(GOLD, 0, 1.3), collar(GOLD), blanket('#2f5fb0')] }), 'boarbig'],
  'The Black Hart': [Q(STAG, { fur: '#1c181c', fur2: '#2e262c', dark: '#0a080a', eye: '#ff7a2a', eyeGlow: 1, eyeK: 1.2, bulk: .95, extra: [antlers('#ff7a2a', 1, 1.4), cracks(), e => { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) tag(7, A(e.H, cone(e.R * .12, e.R * .5, 4), mat(FLAME[i], 1), s * e.R * (.7 + i * .35), e.R * (2.2 + i * .5), -e.R * .4)); }] }), 'boarbig'],
  'The Hollow Stag': [Q(STAG, { fur: '#8fb8cc', fur2: '#dff6ff', dark: '#3a6a88', eye: '#ffffff', eyeGlow: 1, eyeK: 1.2, bulk: .8, extra: [antlers('#e8fbff', 1, 1.5), ribs('#e8fbff', '#bfefff'), wisps('#e8fbff', 5)] }), 'wolf'],
  // wasps, moths, bats, sprites
  'Meadow Stinger': [() => bug({ sting: 1, mand: .6 }), 'wasp'],
  'Carrion Wasp': [() => bug({ fur: '#8a2a22', fur2: '#1e1214', sting: 1.8, mand: 1.2, eye: '#b6ff3a', eyeGlow: 1, wingC: '#c8b8a8', bulk: 1.1, extra: [e => sores('#b6ff3a', 3)({ ...e, B: e.T, L: .3, k: .5 })] }), 'wasp'],
  'Nettlewasp': [() => bug({ fur: '#6aa83a', fur2: '#1e2a14', sting: 1.4, mand: .8, wingC: '#d8f2c0', extra: [e => { for (let i = 0; i < 6; i++) A(e.T, cone(.02, .16, 4), mat('#3f7a3a'), Math.sin(i * 2.1) * .12, .1, -i * .1, Math.sin(i) * .6, 0, Math.cos(i * 2.1) * .8); }] }), 'wasp'],
  'Marsh Biter': [() => bug({ fur: '#6a6a3a', fur2: '#3a3a22', stripe: 0, fat: .7, segs: 5, beak: 1.4, feeler: 'none', wingC: '#c8d8c0', headK: .85, eye: '#ff4a2a', eyeGlow: 1 }), 'wasp'],
  'Blight Sprite': [() => bug({ fur: '#b6ff3a', glowBody: 1, fur2: '#3a5a1e', stripe: 0, fuzzy: 1, fat: .6, segs: 3, noLegs: 1, bulk: .7, wing: 'moth', wingK: .9, wingC: '#d8ff9a', wingC2: '#8ac84a', eye: '#1a2a0a', eyeK: 1.3, feeler: 'none', extra: [e => wisps('#d8ff9a', 4)(e)] }), 'wasp'],
  'Gravemoth': [() => bug({ fur: '#a8a49a', fur2: '#6a665e', fuzzy: 1, wing: 'moth', wingK: 1.5, wingC: '#b8b4a8', wingC2: '#8a867c', spot: BONE, feeler: 'feather', fat: 1.15, segs: 3 }), 'wasp'],
  'Duskwing': [() => bug({ fur: '#5a4a8a', fur2: '#2e2450', fuzzy: 1, wing: 'moth', wingK: 1.6, wingC: '#6a5aa8', wingC2: '#c0368a', spot: '#ffd27a', spotGlow: 1, feeler: 'feather', feelerC: '#c0368a', fat: 1.1, segs: 3, eye: '#ffd27a', eyeGlow: 1 }), 'wasp'],
  'Slagbat': [() => bug({ fur: '#3a2e2e', fur2: '#241c1c', fuzzy: 1, stripe: 0, wing: 'bat', wingK: 1.6, wingC: '#6a2e1e', ears: 1, mand: .7, mandC: '#fbf7ee', feeler: 'none', fat: .8, segs: 2, noLegs: 1, eye: '#ff7a2a', eyeGlow: 1, curl: .9, extra: [e => { for (let i = 0; i < 3; i++) A(e.B, box(.025, .14, .02), mat('#ff7a2a', 1), (i - 1) * .1, .0, .12, .3, 0, i - 1); }] }), 'wasp'],
  'Shardwing': [() => bug({ fur: '#e8bd4c', fur2: '#8a6a2a', sting: 1.6, stingC: '#fff2b0', mand: .9, wingC: '#fff2b0', eye: '#ffffff', eyeGlow: 1, bulk: 1.1, extra: [e => shards('#fff2b0', 1, 4, .3)({ ...e, B: e.T, L: .5, k: .1 })] }), 'wasp'],
  'Void Moth': [() => bug({ fur: '#221a3a', fur2: '#120e22', fuzzy: 1, wing: 'moth', wingK: 1.6, wingC: '#2a2050', wingC2: '#17122e', spot: '#b9a6ff', spotGlow: 1, feeler: 'feather', feelerC: '#b9a6ff', eye: '#e0a8ff', eyeGlow: 1, fat: 1.1, segs: 3 }), 'wasp'],
  'Gloom-Moth': [() => bug({ fur: '#4a4444', fur2: '#262222', fuzzy: 1, wing: 'moth', wingK: 1.5, wingC: '#3a3434', wingC2: '#5a2a1a', spot: '#ff7a2a', spotGlow: 1, feeler: 'feather', feelerC: '#8a8078', eye: '#ff7a2a', eyeGlow: 1, fat: 1.1, segs: 3 }), 'wasp'],
  'The Moth-Queen of the Last Light': [() => bug({ fur: '#fff6d8', fur2: '#e8d8a0', fuzzy: 1, wing: 'moth', wingK: 2.3, wingC: '#fffbe8', wingC2: '#ffe9a0', spot: '#ffd27a', spotGlow: 1, feeler: 'feather', feelerC: GOLD, eye: '#ffb347', eyeGlow: 1, eyeK: 1.2, fat: 1.4, segs: 4, lamp: '#ffe9a0', bulk: 1.3, extra: [crown(GOLD, '#fff2b0'), e => wisps('#fff2b0', 7)(e), e => { for (let i = 0; i < 7; i++) A(e.B, cone(.05, .3, 4), mat('#fff6d8'), Math.sin(i * .9) * .2, .02, .12 + Math.cos(i * .9) * .08, -1.2, 0, Math.sin(i * .9) * 1.2); }] }), 'wasp'],
  'The Moth King': [() => bug({ fur: '#2a3a7a', fur2: '#141c44', fuzzy: 1, wing: 'moth', wingK: 2.2, wingC: '#3a4a9a', wingC2: '#1a2458', spot: '#7fe9ff', spotGlow: 1, feeler: 'feather', feelerC: '#7fe9ff', eye: '#7fe9ff', eyeGlow: 1, fat: 1.3, segs: 4, bulk: 1.3, mand: 1.2, extra: [crown('#c9d2de', '#7fe9ff'), e => { for (let i = 0; i < 9; i++) A(e.B, cone(.06, .34, 4), mat(i % 2 ? '#e8fbff' : '#3a4a9a'), Math.sin(i * .7) * .22, .04, .14 + Math.cos(i * .7) * .08, -1.2, 0, Math.sin(i * .7) * 1.2); }] }), 'wasp'],
  'The Void-Moth Queen': [() => bug({ fur: '#16102a', fur2: '#0a0816', fuzzy: 1, wing: 'moth', wingK: 2.4, wingC: '#1e1640', wingC2: '#0e0a20', spot: '#e07aff', spotGlow: 1, feeler: 'feather', feelerC: '#e07aff', eye: '#e07aff', eyeGlow: 1, eyeK: 1.3, fat: 1.4, segs: 5, lamp: '#8a4ad8', bulk: 1.35, sting: 1.5, stingC: '#e07aff', extra: [crown('#3a2a5a', '#e07aff'), e => wisps('#e07aff', 8)(e), e => shards('#b9a6ff', 1, 5, .4)({ ...e, B: e.T, L: .5, k: .1 })] }), 'wasp'],
  // spiders, mites, grubs and crawlers
  'Hollin Webspinner': [() => spider({ mark: '#e8bd4c' }), 'spider'],
  'Barkspinner': [() => spider({ fur: '#6a5438', fur2: '#3a2c1a', mark: '#4f8a3a', legK: 1.1, extra: [moss('#4f8a3a')] }), 'spider'],
  'Rotweaver': [() => spider({ fur: '#6a705a', fur2: '#34382a', eye: '#b6ff3a', mark: '#b6ff3a', markGlow: 1, abd: 1.15, extra: [e => sores('#b6ff3a', 5)({ ...e, L: .6 })] }), 'spider'],
  'Mirecrawler': [() => spider({ fur: '#4a5a3a', fur2: '#26301e', legK: 1.35, tall: 1.3, abd: .8, eye: '#ffd27a' }), 'spider'],
  'Glass Spider': [() => spider({ fur: '#9fd8ec', fur2: '#5a9ab8', dark: '#2a5a78', legC: '#bfefff', eye: '#ffffff', mark: '#ffffff', markGlow: 1, fangC: '#e8fbff', fangGlow: 1, extra: [e => shards('#e8fbff', 1, 4, .3)({ ...e, L: .5 })] }), 'spider'],
  'Thornling': [() => spider({ fur: '#4f7a3a', fur2: '#2a4a22', legs: 3, legK: .8, bulk: .8, abd: .9, shell: '#3f6a2e', eye: '#ffd27a', eyes: 2, fang: .6, extra: [e => { for (let i = 0; i < 7; i++) A(e.B, cone(.03, .22, 4), mat('#6b4526'), Math.sin(i * 2.2) * .16, .3, -.2 + Math.cos(i * 1.3) * .2, Math.cos(i) * .5, 0, Math.sin(i * 2.2) * .7); }] }), 'spider'],
  'Glassmite': [() => spider({ fur: '#7ab8d0', fur2: '#3a7a98', legs: 3, legK: .75, bulk: .8, shell: '#bfefff', shellGlow: 1, eye: '#ffffff', eyes: 2, fang: .6, legC: '#9fd8ec' }), 'spider'],
  'Deep Crawler': [() => grub({ fur: '#6a5a4a', fur2: '#4a3e32', plate: '#3a3028', feet: 1, mand: 1.3, eye: '#ffd27a', eyeGlow: 1, segs: 8 }), 'spider'],
  'Deepcrawler': [() => grub({ fur: '#4a4a5a', fur2: '#2e2e3a', plate: '#22222c', feet: 1, mand: 1.5, eye: '#7fe9ff', eyeGlow: 1, dots: '#7fe9ff', segs: 9, bulk: 1.1 }), 'spider'],
  'Wound-Crawler': [() => grub({ fur: '#5a2a2a', fur2: '#2a1414', plate: '#1a0e0e', feet: 1, mand: 1.6, mandC: '#2a1c14', eye: '#ff7a2a', eyeGlow: 1, dots: '#ff7a2a', spine: .8, spineC: '#1a0e0e', segs: 9, bulk: 1.1 }), 'spider'],
  'Mother Grub': [() => grub({ fur: '#e8dcb0', fur2: '#c8b880', headC: '#8a5a2a', bulk: 1.5, segs: 8, mand: 1.2, dots: '#ffd27a', extra: [e => { for (const [x, z] of [[.45, .2], [-.5, -.2], [.4, -.7]]) { A(e.g, sph(.1), mat('#e8dcb0'), x, .1, z, 0, 0, 0, 1, .9, 1.6); A(e.g, sph(.06), mat('#8a5a2a'), x, .1, z + .16); } }, e => sores('#ffd27a', 5)({ ...e, L: 1, k: .8 })] }), 'spider'],
  'The Pale Grub': [() => grub({ fur: '#f1ece0', fur2: '#d8d0c0', headC: '#f1ece0', dark: '#8a8478', bulk: 1.6, segs: 9, mand: 2.0, eye: '#ff3a2a', eyeGlow: 1, spine: 1.0, spineC: '#d8d0c0', extra: [e => { for (let i = 0; i < 8; i++) A(e.H, cone(e.R * .1, e.R * .5, 4), mat('#fbf7ee'), Math.sin(i * .785) * e.R * .6, Math.cos(i * .785) * e.R * .55, e.R * .85, Math.PI / 2); A(e.H, sph(e.R * .5), mat('#7a1e28'), 0, 0, e.R * .6, 0, 0, 0, 1, 1, .5); }] }), 'spider'],
  'The Gnaw': [() => grub({ fur: '#3a3034', fur2: '#1e181a', plate: '#141012', headC: '#141012', bulk: 1.7, headK: 1.5, segs: 8, mand: 2.6, mandC: '#e6dcc2', eye: '#ff7a2a', eyeGlow: 1, dots: '#ff7a2a', spine: 1.3, spineC: '#e6dcc2', feet: 1, extra: [e => cracks()({ ...e, k: .6 })] }), 'spider'],
  'The Thornmother': [() => spider({ fur: '#3f6a2e', fur2: '#22381a', bulk: 1.35, abd: 1.3, legK: 1.2, mark: '#c0368a', eye: '#ffd27a', fang: 1.5, sac: '#e8dcb0', extra: [crown('#6b4526', '#c0368a'), e => { for (let i = 0; i < 12; i++) A(e.B, cone(.045, .34, 4), mat('#6b4526'), Math.sin(i * 2.2) * .24, .34, -.45 + Math.cos(i * 1.3) * .3, Math.cos(i) * .5 - .2, 0, Math.sin(i * 2.2) * .8); }] }), 'spider'],
  'The Tunnel Queen': [() => spider({ fur: '#d8d0c0', fur2: '#a8a090', dark: '#5a5448', legC: '#c8c0b0', bulk: 1.5, abd: 1.45, legK: 1.3, tall: 1.2, eye: '#ff3a2a', fang: 1.8, sac: '#f1ece0', mark: '#7a1e28', extra: [crown(BONE, '#ff3a2a'), e => { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) A(e.H, sph(e.R * .1), mat('#ff3a2a', 1), s * e.R * (.2 + i * .25), e.R * (.75 - i * .1), e.R * .6); }] }), 'spider'],
  'Icefang Broodmother': [() => spider({ fur: '#dfeef6', fur2: '#9fc0d8', dark: '#5a86a8', legC: '#bfe0f0', bulk: 1.4, abd: 1.3, legK: 1.2, eye: '#7fe9ff', fang: 2.2, fangC: '#d8f6ff', fangGlow: 1, mark: '#7fe9ff', markGlow: 1, sac: '#e8fbff', extra: [e => shards('#e8fbff', 1, 7, .5)({ ...e, L: .7 })] }), 'spider'],
  'The Glass Queen': [() => spider({ fur: '#7ab8d0', fur2: '#3a7a98', legs: 3, legK: 1.0, bulk: 1.5, shell: '#bfefff', shellGlow: 1, eye: '#ffffff', eyes: 3, fang: 1.2, legC: '#9fd8ec', extra: [crown('#e8fbff', '#ffffff'), e => shards('#ffffff', 1, 9, .6)({ ...e, L: .7 })] }), 'spider'],
  'The Crystal Mother': [() => spider({ fur: '#b89ae8', fur2: '#6a4aa8', dark: '#3a2a6a', legC: '#d8c8ff', bulk: 1.45, abd: 1.3, legK: 1.25, eye: '#ffffff', fang: 1.6, fangC: '#f0e8ff', fangGlow: 1, shell: '#d8c8ff', shellGlow: 1, sac: '#f0e8ff', extra: [e => shards('#f0e8ff', 1, 10, .7)({ ...e, L: .8 })] }), 'spider'],
  'The Thorn-Queen': [() => spider({ fur: '#4f8a3a', fur2: '#2a5a22', bulk: 1.4, abd: 1.3, legK: 1.2, eye: '#ff9ad0', fang: 1.4, mark: '#ff9ad0', extra: [crown('#3f7a3a', '#ff9ad0'), moss('#58a84a'), e => { for (let i = 0; i < 5; i++) { const a = i * 1.26; A(e.B, sph(.09), mat('#ff9ad0'), Math.sin(a) * .16, .42, -.4 + Math.cos(a) * .16, 0, 0, 0, 1, .5, 1); } A(e.B, sph(.07), mat('#ffe27a', 1), 0, .45, -.4); }] }), 'spider'],
  // crabs and sharks
  'Shore Crab': [() => crab({}), 'crab'],
  'Old Snapper': [() => crab({ fur: '#a83a22', fur2: '#e0a080', bulk: 1.2, bigClaw: 1, extra: [e => { for (const [x, z] of [[.2, -.1], [-.25, .05], [.0, -.2]]) A(e.B, cone(.06, .1, 6), mat('#d8d0c0'), x, .24, z); }, scars(2)] }), 'crabbig'],
  'Deepmaw': [() => crab({ fur: '#1f3a5a', fur2: '#3a6a8a', dark: '#0e1e30', eye: '#7fe9ff', eyeGlow: 1, maw: 1, bulk: 1.2, clawC: '#7fe9ff', clawGlow: 1 }), 'crabbig'],
  'Old Deepmaw': [() => crab({ fur: '#16243a', fur2: '#2a4a6a', dark: '#0a1420', eye: '#ffd27a', eyeGlow: 1, maw: 1, bulk: 1.35, bigClaw: -1, extra: [e => { const Lu = J(e.B, 0, .22, .3, .6, 0, 0); A(Lu, cyl(.015, .02, .5, 4), mat('#2a4a6a'), 0, .25, 0); A(Lu, sph(.08), mat('#ffd27a', 1), 0, .52, 0); }, scars(2)] }), 'crabbig'],
  'The Ribcrawler': [() => crab({ fur: '#e6dcc2', fur2: '#c8bca0', dark: '#8a8068', eye: '#ff3a2a', eyeGlow: 1, bulk: 1.3, clawC: BONE, extra: [e => { for (let i = 0; i < 5; i++) A(e.B, tor(.4 - Math.abs(i - 2) * .05, .028, Math.PI), mat(BONE), 0, .08, .25 - i * .13, 0, 0, 0); for (let i = 0; i < 5; i++) A(e.B, cone(.04, .22, 4), mat(BONE), 0, .44 - Math.abs(i - 2) * .03, .25 - i * .13); }] }), 'crabbig'],
  'Old Saltjaw': [() => crab({ fur: '#c8ccd0', fur2: '#eef2f4', dark: '#7a8088', bulk: 1.3, noClaw: -1, bigClaw: 1, maw: 1, extra: [e => shards('#ffffff', 0, 7, .3)({ ...e, B: e.B, k: .7, L: .5 }), scars(2)] }), 'crabbig'],
  'Reef Shark': [() => shark({}), 'shark'],
  'Cloud Shark': [() => shark({ fur: '#c8d4e0', fur2: '#ffffff', dark: '#8a9ab0', eye: '#7fe9ff', eyeGlow: 1, gill: '#7fe9ff', gillGlow: 1, extra: [e => { for (let i = 0; i < 5; i++) A(e.B, sph(.16), mat('#ffffff'), Math.sin(i * 2.1) * .08, .26, .3 - i * .25); }] }), 'shark'],
  'Thunderjaw': [() => shark({ fur: '#2a3a5a', fur2: '#8a9ab8', dark: '#141c30', eye: '#ffe27a', eyeGlow: 1, gill: '#ffe27a', gillGlow: 1, headK: 1.25, fang: 1.6, bulk: 1.15, extra: [e => cracks('#ffe27a')({ ...e, k: .8 })] }), 'shark'],
  'Cloudmaw': [() => shark({ fur: '#aeb8c8', fur2: '#f4f8ff', dark: '#5a6880', eye: '#ffe27a', eyeGlow: 1, gill: '#7fe9ff', gillGlow: 1, headK: 1.5, fang: 2.0, bulk: 1.3, extra: [e => { for (let i = 0; i < 9; i++) A(e.B, sph(.2), mat('#ffffff'), Math.sin(i * 2.1) * .14, .3, .45 - i * .17); }, e => cracks('#7fe9ff')({ ...e, k: .9 }), e => { for (const s of [-1, 1]) tag(7, A(e.H, octa(.07), mat('#ffe27a', 1), s * e.R * 1.1, e.R * .3, 0, 0, 0, s * .8, .7, 2.6, .7)); }] }), 'shark'],
  // harpies, gulls, hawks and griffons
  'Crag Harpy': [() => harpy(), 'harpy'],
  'Hill Harpy': [recolor({ '#6a5a7a': '#8a6a4a', '#3f344a': '#5a4028', '#b8a8a0': '#d8c8a0', '#9aa08a': '#b89a78' }, harpy), 'harpy'],
  'Snow Harpy': [recolor({ '#6a5a7a': '#e4eef4', '#3f344a': '#9fc0d8', '#b8a8a0': '#ffffff', '#9aa08a': '#b8c8d8', '#e0a030': '#7fb0d0' }, harpy), 'harpy'],
  'Cinderwing': [recolor({ '#6a5a7a': '#2e2628', '#3f344a': '#e8451a', '#b8a8a0': '#4a3a36', '#9aa08a': '#5a4a48', '#e0a030': '#ff7a2a' }, harpy, e => { for (let i = 0; i < 5; i++) tag(7, A(e.H, cone(.05, .3, 4), mat(FLAME[i % 4], 1), (i - 2) * .06, .3, -.12, -.6, 0, -(i - 2) * .2)); }), 'harpy'],
  'Shrieka': [recolor({ '#6a5a7a': '#a82a2a', '#3f344a': '#5a1414', '#b8a8a0': '#e8bd4c', '#9aa08a': '#b8a890' }, harpy, e => crown(GOLD, '#ff5a4a')({ H: e.H, R: e.R })), 'harpynamed'],
  'Shrike of the Squall': [recolor({ '#6a5a7a': '#3a5a8a', '#3f344a': '#1c2f50', '#b8a8a0': '#e8f2ff', '#9aa08a': '#8aa0b8', '#e0a030': '#ffe27a' }, harpy, e => { for (const s of [-1, 1]) tag(7, A(e.H, octa(.05), mat('#ffe27a', 1), s * .2, .24, -.05, 0, 0, s * .7, .7, 3, .7)); }), 'harpynamed'],
  'Shrikemother': [recolor({ '#6a5a7a': '#3a5a3a', '#3f344a': '#1e3020', '#b8a8a0': '#e6dcc2', '#9aa08a': '#8a9a78', '#e0a030': '#e6dcc2' }, harpy, e => { crown(BONE, '#b6ff3a')({ H: e.H, R: e.R }); for (let i = 0; i < 4; i++) A(e.H, sph(.035), mat(BONE), Math.sin(i * 1.5) * .13, -.24, .06 + Math.cos(i * 1.5) * .06); }), 'harpynamed'],
  "The Cathedral's Watch": [recolor({ '#6a5a7a': '#6a6a70', '#3f344a': '#3e3e44', '#b8a8a0': '#8a8a90', '#9aa08a': '#7a7a80', '#e0a030': '#4a4a50', '#ffe27a': '#ff3a2a' }, harpy, e => { for (const s of [-1, 1]) A(e.H, cone(.045, .3, 5), mat('#3e3e44'), s * .13, .22, -.04, -.3, 0, -s * .5); }), 'harpynamed'],
  'Stormbeak Gull': [() => bird({ beak: 1.3 }), 'harpy'],
  'The Stormhawk': [() => bird({ fur: '#2a3a6a', fur2: '#8aa0d0', dark: '#141c38', beakC: '#ffe27a', eye: '#ffe27a', eyeGlow: 1, bulk: 1.5, headK: 1.15, crest: '#ffe27a', crestGlow: 1, extra: [e => { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) tag(7, A(e.B, octa(.05), mat('#ffe27a', 1), s * (.5 + i * .3), .05, -.1, 0, 0, s * .6, .7, 2.6, .7)); }] }), 'harpynamed'],
  'Storm Griffon': [Q(WOLF, { fur: '#c9a04a', fur2: '#f4ecd0', dark: '#6a5018', ruff: 1.4, mane: { n: 0 }, tail: 'thin', tailLen: 1.2, noFang: 1, muzzle: [.5, .8], ears: 'side', earK: .6, eye: '#7fe9ff', bulk: 1.15, hh: .76, extra: [wingsOn('#f4ecd0', '#8aa0d0', 1.1, '#e8b03a')] }), 'harpy'],
  'The Griffon Matriarch': [Q(WOLF, { fur: '#8a5a2a', fur2: '#f1ece0', dark: '#3a2410', ruff: 1.8, mane: { n: 0 }, tail: 'thin', tailLen: 1.2, noFang: 1, muzzle: [.5, .8], ears: 'side', earK: .6, eye: '#ffd34d', bulk: 1.3, hh: .8, headK: 1.15, claw: 2.4, extra: [wingsOn('#f1ece0', '#5a3a1a', 1.35, '#e8b03a'), crown(GOLD, '#7fe9ff'), scars(2)] }), 'harpynamed'],
  // serpents, wyrms and dragons
  'Shore Serpent': [() => serpent({ bulk: .6, fur: '#3a8a8a', fur2: '#e0e8c8', frill: '#e8bd4c' }), 'leviathan'],
  'The Lagoon Serpent': [() => serpent({ bulk: .8, fur: '#1fa8a0', fur2: '#d8fff0', dark: '#0e6a6a', frill: '#ff7a9a', horns: .6, hornC: '#ff7a9a', dots: '#fff2b0' }), 'leviathan'],
  'The Leviathan of the Fleet': [() => serpent({ fur: '#2f6a5a', fur2: '#a8c8b0', dark: '#143a30', frill: '#b8241c', horns: 1, fang: 1.4, extra: [e => { for (const [y, rz] of [[1.6, .7], [2.6, -.6]]) { const Hp = J(e.g, .3, y, -.6, -.3, 0, rz); A(Hp, cyl(.03, .03, 1.1, 5), mat('#6b4526'), 0, .5, 0); A(Hp, cone(.07, .2, 4), mat(STEEL), 0, -.1, 0, Math.PI); } for (let i = 0; i < 6; i++) A(e.g, tor(.1, .03), mat(STEEL), .5, .9 - i * .14, .2, i % 2 ? 0 : Math.PI / 2); for (const [x, y, z] of [[.3, 1.0, -.4], [-.35, 2.0, -.5], [.2, .5, -.2]]) A(e.g, cone(.1, .14, 6), mat('#d8d0c0'), x, y, z, 0, 0, x > 0 ? -1.2 : 1.2); }] }), 'leviathan'],
  'Eelking Vashh': [() => serpent({ bulk: .85, fur: '#1c1c2a', fur2: '#3a3a5a', dark: '#0c0c16', frill: '#ffe27a', frillGlow: 1, dots: '#ffe27a', eye: '#ffe27a', spine: .6, fang: 1.2, extra: [crown(GOLD, '#ffe27a')] }), 'leviathan'],
  'The Hollow Leviathan': [() => serpent({ fur: '#d8d0b8', fur2: '#f1ece0', dark: '#8a8470', frill: '#8fb8cc', spineC: BONE, spine: 1.4, eye: '#7fe9ff', horns: 1.2, maw: '#7fe9ff', mawGlow: 1, dots: '#7fe9ff', extra: [e => { for (let i = 0; i < 5; i++) A(e.g, tor(.5 - i * .04, .03), mat(BONE), 0, 1.0 + i * .5, -.6 + Math.sin(i * .5) * .5, Math.PI / 2 - .3); }] }), 'leviathan'],
  'Skarnvold, the Frost-Wyrm': [() => serpent({ fur: '#dfeef6', fur2: '#ffffff', dark: '#8ab0c8', frill: '#bfefff', frillGlow: 1, spineC: '#e8fbff', spineGlow: 1, spine: 1.6, eye: '#7fe9ff', horns: 1.6, hornC: '#bfefff', hornGlow: 1, maw: '#7fe9ff', mawGlow: 1, fang: 1.5, extra: [e => icicles()({ ...e, R: e.R })] }), 'leviathan'],
  'The Eyeless Wyrm': [() => serpent({ fur: '#e8d8d0', fur2: '#f6eee8', dark: '#b8a098', frill: '#c98a80', blindAll: 1, headK: 1.3, fang: 2.2, spine: .5, maw: '#5a0e16' }), 'leviathan'],
  'Vitrion, the Glass Dragon': [() => serpent({ fur: '#9fd8ec', fur2: '#e8fbff', dark: '#4a90b0', frill: '#e0a8ff', frillGlow: 1, plate: '#bfefff', plateGlow: 1, spineC: '#ffffff', spineGlow: 1, spine: 1.5, eye: '#ffffff', horns: 1.5, hornC: '#e0a8ff', hornGlow: 1, extra: [e => wingsOn('#bfefff', '#e0a8ff', 2.2)({ B: J(e.g, 0, 2.6, -.2), k: 1, H: e.H, R: e.R })] }), 'leviathan'],
  'The Glacier Wyrm': [() => serpent({ fur: '#8ab8d8', fur2: '#dff2ff', dark: '#3a6a90', frill: '#ffffff', plate: '#e8fbff', spineC: '#ffffff', spine: 1.2, eye: '#ffffff', horns: 1.0, hornC: '#ffffff', headK: 1.15, fang: 1.6 }), 'leviathan'],
  'Vhorun, the One Beneath': [() => serpent({ bulk: 1.15, fur: '#1a1418', fur2: '#3a2a30', dark: '#0a0608', frill: '#5a2a8a', frillGlow: 0, dots: '#ff3a2a', spineC: '#2a1c22', spine: 1.8, eye: '#ff3a2a', horns: 2.0, hornC: '#2a1c22', headK: 1.25, fang: 2.0, maw: '#ff5a2a', mawGlow: 1, extra: [e => { for (let i = 0; i < 6; i++) for (const s of [-1, 1]) A(e.H, sph(e.R * .09), mat('#ff3a2a', 1), s * e.R * (.3 + (i % 3) * .2), e.R * (.55 + (i > 2 ? .2 : 0)), e.R * (.9 - (i % 3) * .2)); }, e => { for (let i = 0; i < 6; i++) { const a = i * 1.05, Tn = tag(7, J(e.g, Math.cos(a) * 1.3, .1, -1.0 + Math.sin(a) * 1.3, 0, 0, Math.cos(a) * -.4)); A(Tn, cone(.14, 1.6, 5), mat('#1a1418'), 0, .8, 0); A(Tn, sph(.06), mat('#ff3a2a', 1), 0, 1.5, 0); } }, e => cracks('#ff5a2a')({ B: J(e.g, 0, 1.6, -.4), k: 1.6 })] }), 'leviathan'],
  'The Sewer Queen': [() => spider({ fur: '#5a6a3a', fur2: '#2e3a1e', dark: '#161e0e', bulk: 1.4, abd: 1.4, legK: 1.15, eye: '#b6ff3a', fang: 1.6, fangC: '#b6ff3a', fangGlow: 1, mark: '#b6ff3a', markGlow: 1, sac: '#c8d8a0', extra: [crown('#8a8f9a', '#b6ff3a'), e => sores('#b6ff3a', 7)({ ...e, L: .7 }), e => { for (let i = 0; i < 4; i++) A(e.B, cone(.04, .4, 4), mat('#7a9a3a'), (i - 1.5) * .16, -.1, -.5, Math.PI); }] }), 'spider'],
  // tree-folk, scarecrows, mushroom-folk
  'Wild Sapling': [() => treant({ bulk: .7, thin: .7, fur: '#7a5a34', leaf: '#7ac85a', canopy: 'leaf', mouth: -.1 }), 'treant'],
  'Witchroot': [() => treant({ fur: '#4a3a2a', fur2: '#6a5238', dark: '#241a10', canopy: 'bare', eye: '#b6ff3a', thin: .85, extra: [e => { for (let i = 0; i < 4; i++) A(e.C, sph(.07), mat('#b6ff3a', 1), Math.sin(i * 1.7) * .3, .3 + (i % 2) * .2, Math.cos(i * 1.7) * .1); }] }), 'treant'],
  'Grandmother Root': [() => treant({ bulk: 1.25, fur: '#5a4634', fur2: '#8a7458', leaf: '#6a8a4a', canopy: 'leaf', eye: '#ffe9a0', tuft: '#6a8a4a', extra: [moss('#5a8a3a'), e => { for (let i = 0; i < 5; i++) A(e.B, cone(.05, .6, 4), mat('#8a7458'), (i - 2) * .12, -.5, .22, Math.PI + .2, 0, (i - 2) * .15); }] }), 'treant'],
  'The Rootrot': [() => treant({ fur: '#4a4a34', fur2: '#6a6a48', dark: '#22221a', canopy: 'bare', eye: '#b6ff3a', mouth: -.2, extra: [e => sores('#b6ff3a', 6)({ ...e, k: .5 }), e => { A(e.B, sph(.2), mat('#1a140c'), .05, .1, .2, 0, 0, 0, 1, 1.4, .5); A(e.B, sph(.1), mat('#b6ff3a', 1), .05, .1, .24); }] }), 'treant'],
  'Ironbark, the Grove Titan': [() => treant({ bulk: 1.45, fur: '#4a4a52', fur2: '#74809a', dark: '#22222a', leaf: '#2f6a3a', canopy: 'pine', eye: '#7dff7a', tuft: '#2f6a3a', extra: [e => { for (let i = 0; i < 3; i++) A(e.B, tor(.4 - i * .03, .05), mat(STEEL), 0, -.45 + i * .45, 0, Math.PI / 2); }, crown('#74809a', '#7dff7a')] }), 'treant'],
  'Sporeling': [() => treant({ bulk: .7, thin: .9, fur: '#e6dcc2', fur2: '#c8bca0', dark: '#8a8068', leaf: '#c8382c', canopy: 'mush', eye: '#2a1c14', mouth: -.15 }), 'treant'],
  'The Spore-Queen': [() => treant({ bulk: 1.3, fur: '#efe6d0', fur2: '#d8c8b0', dark: '#8a8068', leaf: '#8a3aa8', canopy: 'mush', spot: '#ffd27a', spotGlow: 1, eye: '#ffd27a', tuft: '#c0368a', extra: [crown('#c0368a', '#ffd27a'), e => { for (let i = 0; i < 8; i++) tag(7, A(e.C, sph(.04), mat('#ffd27a', 1), Math.sin(i * .8) * .7, -.3 - (i % 3) * .15, Math.cos(i * .8) * .7)); }] }), 'treant'],
  'Mycelius, the Thinking Rot': [() => treant({ bulk: 1.4, fur: '#b8b09a', fur2: '#8a8470', dark: '#4a4638', leaf: '#5a6a3a', canopy: 'mush', spot: '#b6ff3a', spotGlow: 1, eye: '#b6ff3a', extra: [e => { A(e.C, sph(.34), mat('#d99a9a'), 0, .34, 0, 0, 0, 0, 1.1, .8, 1.2); for (let i = 0; i < 4; i++) A(e.C, tor(.3 - i * .05, .03, Math.PI), mat('#b87a7a'), 0, .36, -.15 + i * .1, 0, 0, 0); }, e => sores('#b6ff3a', 6)({ ...e, k: .6 })] }), 'treant'],
  'Mister Tatters': [() => scarecrow({}), 'treant'],
  'The Hollow Man': [() => scarecrow({ fur: '#2e2a2a', fur2: '#1a1818', sack: '#8a8478', eye: '#7fe9ff', hatC: '#141212', hook: 1, bulk: 1.15, extra: [e => A(e.B, sph(.12), mat('#7fe9ff', 1), 0, .1, .2, 0, 0, 0, 1, 1.3, .4)] }), 'treant'],
  'The Wicker Man': [() => scarecrow({ fur: '#b8904a', fur2: '#8a6a34', sack: '#c9a25a', straw: '#e8c860', eye: '#ff7a2a', hat: 0, bulk: 1.5, extra: [e => { for (let i = 0; i < 4; i++) A(e.B, tor(.34 - i * .02, .025), mat('#6a4a22'), 0, -.3 + i * .22, 0, Math.PI / 2, 0, 0, 1, .75, 1); A(e.B, sph(.14), mat('#ff7a2a', 1), 0, .05, .2, 0, 0, 0, 1, 1.4, .4); for (let i = 0; i < 5; i++) tag(7, A(e.H, cone(.05, .3, 4), mat(FLAME[i % 4], 1), (i - 2) * .08, .34, 0, 0, 0, -(i - 2) * .25)); }] }), 'treant'],
  'Old Gardener Bel': [() => scarecrow({ fur: '#4f7a3a', fur2: '#6a4a2a', sack: '#d8c8a0', eye: '#7dff7a', hatC: '#c9a25a', hook: -1, extra: [e => { for (let i = 0; i < 6; i++) A(e.B, sph(.06), mat(i % 2 ? '#f29ab8' : '#ffe27a'), Math.sin(i * 1.05) * .3, .1 + (i % 3) * .14, .2 + Math.cos(i * 1.05) * .05); }, moss('#58a84a')] }), 'treant'],
  'Garden Warden': [() => treant({ bulk: 1.2, fur: '#5a4a2a', fur2: '#8a7444', leaf: '#3f7a3a', canopy: 'hedge', eye: '#ffe27a', tuft: '#3f7a3a', extra: [e => gPlates(GOLD)({ B: e.g.children[2], k: .5 })] }), 'treant'],
  'The Sunflower': [() => treant({ bulk: 1.3, thin: .7, fur: '#4f7a3a', fur2: '#6a9a4a', dark: '#2a4a22', leaf: '#f0c040', canopy: 'flower', eye: '#ff7a2a', tuft: '#4f8a3a' }), 'treant'],
  'Rootmaw': [() => treant({ bulk: 1.2, fur: '#3f5a2e', fur2: '#5a7a3e', dark: '#1e2e16', leaf: '#3f7a3a', canopy: 'bare', eye: '#ff9ad0', mouth: 0, extra: [e => gMaw('#ff9ad0')({ B: e.g.children[2], k: .5 }), moss('#58a84a')] }), 'treant'],
  'The Thorn of Glass': [() => treant({ bulk: 1.2, fur: '#7ab8d0', fur2: '#bfe8f4', dark: '#3a7a98', canopy: 'bare', eye: '#ffffff', extra: [e => gShards('#e8fbff', 1, 8, 1.2)({ B: e.g.children[2], k: .55 })] }), 'treant'],
  'The Heartrot': [() => treant({ bulk: 1.3, fur: '#2e2626', fur2: '#463a38', dark: '#141010', canopy: 'bare', eye: '#ff5a3a', extra: [e => { A(e.B, sph(.2), mat('#ff5a3a', 1), 0, .1, .18, 0, 0, 0, 1, 1.2, .5); for (let i = 0; i < 4; i++) A(e.B, box(.03, .3, .03), mat('#ff7a2a', 1), (i - 1.5) * .12, -.1 + (i % 2) * .5, .24, 0, 0, i - 1.5); }] }), 'treant'],
  'Starless Treant': [() => treant({ fur: '#1e1c26', fur2: '#34303e', dark: '#0c0a12', leaf: '#241e3a', canopy: 'leaf', eye: '#b9a6ff' }), 'treant'],
  'Old Gloam': [() => treant({ bulk: 1.35, fur: '#26202a', fur2: '#3e3444', dark: '#100c14', leaf: '#3a2a4a', canopy: 'leaf', eye: '#e07aff', tuft: '#3a2a4a', extra: [e => { for (let i = 0; i < 7; i++) tag(7, A(e.C, sph(.05), mat('#e07aff', 1), Math.sin(i * .9) * .6, -.2 - (i % 3) * .2, Math.cos(i * .9) * .5)); }, scars(2)] }), 'treant'],
  // golems
  'Slagling': [() => golem({ bulk: .7, fur: '#3a3230', fur2: '#5a4a44', dark: '#1e1816', core: '#ff7a2a' }), 'golempet'],
  'The Living Slag': [() => golem({ bulk: 1.1, fur: '#3a3230', fur2: '#5a4a44', dark: '#1e1816', core: '#ff7a2a', fistC: '#ff7a2a', fistGlow: 1, extra: [e => { for (let i = 0; i < 5; i++) tag(7, A(e.H, cone(.06, .3, 4), mat(FLAME[i % 4], 1), (i - 2) * .07, .2, 0)); }] }), 'golempet'],
  'Slagmaw': [() => golem({ fur: '#3a3230', fur2: '#5a4a44', dark: '#1e1816', eye: '#ffb347', headK: .8, extra: [gMaw('#ff7a2a')] }), 'golempet'],
  'Grandfather Slag': [() => golem({ bulk: 1.3, fur: '#4a4240', fur2: '#6a5a54', dark: '#241e1c', core: '#ffb347', spikes: '#241e1c', extra: [e => { for (let i = 0; i < 5; i++) A(e.H, cone(.04, .4, 4), mat('#a8a49c'), (i - 2) * .06, -.3, .16, Math.PI + .2, 0, (i - 2) * .12); }] }), 'golempet'],
  'The Slag Titan': [() => golem({ bulk: 1.5, fur: '#2e2826', fur2: '#4a3e3a', dark: '#161210', core: '#ff5a1a', spikes: '#ff7a2a', spikeGlow: 1, fistC: '#ff7a2a', fistGlow: 1, head: 'helm', rim: '#2e2826', extra: [crown('#4a3e3a', '#ffb347')] }), 'golempet'],
  'The Forge-Heart': [() => golem({ bulk: 1.2, fur: '#5a4a44', fur2: '#74809a', dark: '#2a2422', core: '#ffe27a', head: 'helm', extra: [gGears(STEEL), e => { A(e.B, cyl(.12, .16, .5, 6), mat(STEEL), .5, 1.25, -.2); tag(7, A(e.B, cone(.1, .3, 5), mat('#ff7a2a', 1), .5, 1.6, -.2)); }] }), 'golempet'],
  'The Barnacle Hulk': [() => golem({ bulk: 1.2, fur: '#3a5a5a', fur2: '#5a7a74', dark: '#1e3232', eye: '#7fe9ff', bigFist: 1, extra: [gBarn(), e => A(e.B, tor(.5, .05), mat('#6b4526'), 0, .2, 0, Math.PI / 2)] }), 'golempet'],
  'Woken Rustgolem': [() => golem({ fur: '#8a4a2a', fur2: '#b86a3a', dark: '#4a2414', eye: '#7dff7a', head: 'helm', rim: '#8a4a2a', extra: [gGears('#6a5a4a'), e => { for (const [x, y] of [[.4, .9], [-.3, .4]]) A(e.B, sph(.14), mat('#3a7a5a'), x, y, .4, 0, 0, 0, 1, 1, .4); }] }), 'golempet'],
  'Bone Golem': [() => golem({ fur: '#d8ceb0', fur2: '#e6dcc2', dark: '#8a8068', eye: '#7dff6a', head: 'skull', extra: [gRibs()] }), 'golempet'],
  'The Bone Colossus of Vharos': [() => golem({ bulk: 1.5, fur: '#c8be9e', fur2: '#e6dcc2', dark: '#7a7058', eye: '#b6ff3a', head: 'skull', headK: 1.3, spikes: BONE, core: '#b6ff3a', extra: [gRibs(), crown(BONE, '#b6ff3a'), e => { for (const s of [-1, 1]) A(e.H, cone(.07, .5, 5), mat(BONE), s * .22, .2, -.05, 0, 0, -s * .8); }] }), 'golempet'],
  'The Tomb-Warden': [() => golem({ bulk: 1.25, fur: '#6a6a5e', fur2: '#8a8a7a', dark: '#34342c', eye: '#7fe9ff', head: 'skull', extra: [gPlates('#4a4a40'), e => { A(e.B, box(.5, .7, .06), mat('#4a4a40'), 0, .6, .56); A(e.B, box(.08, .4, .03), mat('#7fe9ff', 1), 0, .62, .6); A(e.B, box(.26, .08, .03), mat('#7fe9ff', 1), 0, .7, .6); }] }), 'golempet'],
  'Crystal Golem': [() => golem({ fur: '#6a4aa8', fur2: '#b89ae8', dark: '#3a2a6a', core: '#e0a8ff', extra: [gShards('#e0a8ff', 1, 7)] }), 'golempet'],
  'The Cave-In': [() => golem({ bulk: 1.45, fur: '#6a625a', fur2: '#8a8278', dark: '#34302a', eye: '#ffd27a', headK: .7, bigFist: -1, extra: [e => { for (let i = 0; i < 8; i++) A(e.B, octa(.18), mat(i % 2 ? '#8a8278' : '#5a524a'), Math.sin(i * .8) * .6, 1.15 + (i % 3) * .1, Math.cos(i * .8) * .35 - .1); }] }), 'golempet'],
  'The Vault-Guardian': [() => golem({ bulk: 1.3, fur: '#5a5e6a', fur2: '#8a8f9a', dark: '#2a2c34', eye: '#ffe27a', head: 'helm', extra: [gPlates(GOLD), gGears(GOLD)] }), 'golempet'],
  'The Doorwarden': [() => golem({ bulk: 1.25, fur: '#6a5238', fur2: '#8a6a44', dark: '#3a2a18', eye: '#ffb347', head: 'helm', rim: STEEL, extra: [e => { A(e.B, box(.8, 1.0, .08), mat('#6a4a2a'), 0, .6, .52); for (const y of [.3, .9]) A(e.B, box(.84, .08, .1), mat(STEEL), 0, y, .53); A(e.B, tor(.09, .025), mat(GOLD), .22, .6, .6); }] }), 'golempet'],
  'The Lockwarden': [() => golem({ bulk: 1.25, fur: '#4a4e5a', fur2: '#74809a', dark: '#22242c', eye: '#ffe27a', head: 'helm', extra: [e => { A(e.B, box(.5, .46, .1), mat(GOLD), 0, .52, .52); A(e.B, tor(.2, .05, Math.PI), mat(GOLD), 0, .76, .52); A(e.B, sph(.07), mat('#1a120c'), 0, .56, .58); A(e.B, box(.04, .14, .04), mat('#1a120c'), 0, .46, .58); }, chains(GOLD)] }), 'golempet'],
  'Watchtower': [() => golem({ bulk: 1.4, fur: '#7a7672', fur2: '#a8a49c', dark: '#3e3a36', eye: '#ffe27a', head: 'none', extra: [e => { A(e.B, cyl(.3, .36, .8, 8), mat('#8a8680'), 0, 1.4, 0); for (let i = 0; i < 6; i++) A(e.B, box(.14, .16, .14), mat('#a8a49c'), Math.sin(i * 1.047) * .3, 1.86, Math.cos(i * 1.047) * .3); A(e.B, box(.12, .22, .06), mat('#ffe27a', 1), 0, 1.5, .34); tag(7, A(e.B, cone(.1, .34, 5), mat('#ff7a2a', 1), 0, 2.0, 0)); }] }), 'golempet'],
  'Spire Construct': [() => golem({ fur: '#c9a04a', fur2: '#f0d890', dark: '#6a5018', eye: '#7fe9ff', head: 'lens', extra: [gGears('#fff2b0')] }), 'golempet'],
  'The Gatekeeper of the First Floor': [() => golem({ bulk: 1.3, fur: '#b8904a', fur2: '#e8d8a0', dark: '#5a4418', eye: '#7fe9ff', head: 'helm', rim: GOLD, extra: [gPlates('#fff2b0'), crown(GOLD, '#7fe9ff'), e => { for (const s of [-1, 1]) A(e.B, box(.1, 1.2, .1), mat(GOLD), s * .5, .5, .5); A(e.B, box(1.1, .1, .1), mat(GOLD), 0, 1.1, .5); }] }), 'golempet'],
  'The Forge-Father': [() => golem({ bulk: 1.45, fur: '#8a6a2a', fur2: '#c9a04a', dark: '#3a2a10', core: '#ffb347', fistC: '#ffb347', fistGlow: 1, head: 'helm', rim: GOLD, spikes: GOLD, extra: [gGears(GOLD), e => { for (let i = 0; i < 6; i++) tag(7, A(e.H, cone(.06, .34, 4), mat(FLAME[i % 4], 1), (i - 2.5) * .07, .3, -.05)); }] }), 'golempet'],
  'The Stormguard Colossus': [() => golem({ bulk: 1.55, fur: '#c9a04a', fur2: '#e8f2ff', dark: '#5a4418', core: '#7fe9ff', head: 'helm', rim: '#e8f2ff', spikes: '#7fe9ff', spikeGlow: 1, fistC: '#7fe9ff', fistGlow: 1, extra: [gPlates('#e8f2ff')] }), 'golempet'],
  'The Vault-Keeper': [() => golem({ bulk: 1.3, fur: '#b8904a', fur2: '#f0d890', dark: '#5a4418', eye: '#ffffff', head: 'lens', extra: [gPlates(GOLD), chains('#fff2b0'), e => { for (let i = 0; i < 5; i++) A(e.B, cyl(.07, .07, .03, 8), mat('#fff2b0'), -.3 + i * .15, .2, .5, Math.PI / 2); }] }), 'golempet'],
  'The Armillary': [() => golem({ bulk: 1.2, fur: '#c9a04a', fur2: '#f0d890', dark: '#6a5018', eye: '#7fe9ff', head: 'none', extra: [e => { for (let i = 0; i < 3; i++) A(e.B, tor(.5 - i * .1, .03), mat(GOLD), 0, 1.5, 0, i * 1.05, i * .8, 0); A(e.B, sph(.16), mat('#7fe9ff', 1), 0, 1.5, 0); }] }), 'golempet'],
  'The Guardian of the Gate': [() => golem({ bulk: 1.5, fur: '#d8b85a', fur2: '#fff2b0', dark: '#6a5018', core: '#ffffff', head: 'helm', rim: '#fff2b0', spikes: '#fff2b0', extra: [gPlates('#fff2b0'), crown('#fff2b0', '#ffffff'), e => { for (const s of [-1, 1]) wingsOn('#fff6d8', GOLD, .9)({ B: J(e.B, 0, .9, -.4), k: 1, H: e.H, R: e.R }); }] }), 'golempet'],
  'Prism Golem': [() => golem({ fur: '#7ab8d0', fur2: '#bfe8f4', dark: '#3a7a98', core: '#ffffff', extra: [gShards('#e0a8ff', 1, 5), gShards('#8ff7ea', 1, 4, .7)] }), 'golempet'],
  'Lens Construct': [() => golem({ fur: '#8a9ab0', fur2: '#c8d4e0', dark: '#4a5668', eye: '#7fe9ff', head: 'lens', rim: '#c9d2de' }), 'golempet'],
  'The First Lens': [() => golem({ bulk: 1.2, fur: '#8a9ab0', fur2: '#c8d4e0', dark: '#4a5668', eye: '#ffffff', head: 'lens', headK: 1.4, rim: '#c9d2de', extra: [gGears('#c9d2de')] }), 'golempet'],
  'The Great Lens': [() => golem({ bulk: 1.45, fur: '#6a7a98', fur2: '#b8c8e0', dark: '#3a4660', eye: '#ffe27a', head: 'lens', headK: 1.9, rim: GOLD, core: '#ffe27a', extra: [crown(GOLD, '#ffffff')] }), 'golempet'],
  'The Lens-Warden': [() => golem({ bulk: 1.3, fur: '#7a8aa8', fur2: '#c8d4e0', dark: '#3a4660', eye: '#e0a8ff', head: 'lens', headK: 1.3, rim: '#c9d2de', extra: [gPlates('#c9d2de'), e => { for (const s of [-1, 1]) { A(e.B, tor(.2, .04), mat('#c9d2de'), s * .66, .95, .3); A(e.B, cyl(.18, .18, .04, 10), mat('#e0a8ff', 1), s * .66, .95, .3, Math.PI / 2); } }] }), 'golempet'],
  'The Clockwork Choir': [() => golem({ bulk: 1.3, fur: '#8a7a5a', fur2: '#c9b88a', dark: '#4a3e2a', eye: '#7fe9ff', head: 'bell', extra: [gGears(GOLD), e => { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) A(e.B, cyl(.05, .05, .4 + i * .14, 6), mat('#c9b88a'), s * (.3 + i * .12), 1.2 + i * .06, -.3); }] }), 'golempet'],
  'The Silent Bell': [() => golem({ bulk: 1.35, fur: '#5a6270', fur2: '#8a94a8', dark: '#2a2e38', eye: '#bfefff', head: 'bell', headK: 1.6, rim: '#6a7488', extra: [e => A(e.H, box(.1, .7, .1), mat('#bfefff', 1), 0, .1, .44, 0, 0, .3), chains('#8a94a8')] }), 'golempet'],
  'The Spine-Warden': [() => golem({ bulk: 1.3, fur: '#9fc8dc', fur2: '#e8fbff', dark: '#4a7a98', eye: '#ffffff', head: 'skull', spikes: '#e8fbff', spikeGlow: 1, extra: [gRibs('#e8fbff'), e => { for (let i = 0; i < 6; i++) A(e.B, cone(.07, .4, 4), mat('#e8fbff', 1), 0, .2 + i * .2, -.5, -1.3); }] }), 'golempet'],
  'The Heart of Winter': [() => golem({ bulk: 1.4, fur: '#bfe0f0', fur2: '#ffffff', dark: '#6a9ab8', core: '#7fe9ff', spikes: '#e8fbff', spikeGlow: 1, fistC: '#bfefff', extra: [gShards('#e8fbff', 1, 9, 1.3), e => icicles()({ Jw: e.H, R: .22 })] }), 'golempet'],
  'The Heart That Hungers': [() => golem({ bulk: 1.45, fur: '#3a2a4a', fur2: '#5a4a6a', dark: '#1c1228', core: '#ff3a6a', eye: '#ff3a6a', headK: .8, extra: [gMaw('#ff3a6a'), gShards('#e07aff', 1, 6), e => { for (let i = 0; i < 5; i++) tag(7, A(e.B, cone(.05, .5, 4), mat('#ff3a6a', 1), (i - 2) * .18, .2, .56, Math.PI + .4, 0, (i - 2) * .2)); }] }), 'golempet'],
  'Slagjaw': [() => golem({ fur: '#2a2426', fur2: '#463a3c', dark: '#120e10', eye: '#ff7a2a', headK: .8, extra: [gMaw('#ff5a1a')] }), 'golempet'],
  'Ironjaw': [() => golem({ bulk: 1.15, fur: '#3a3e48', fur2: '#5a5f6a', dark: '#1a1c22', eye: '#ff5a3a', head: 'helm', rim: '#3a3e48', extra: [e => { A(e.H, box(.34, .16, .3), mat(STEEL), 0, -.16, .14); for (let i = -2; i <= 2; i++) A(e.H, cone(.03, .12, 4), mat('#dfe6f0'), i * .07, -.06, .28); }] }), 'golempet'],
  'Rock-Wraith': [() => golem({ fur: '#2e2a30', fur2: '#463e4a', dark: '#141018', core: '#c08aff', head: 'none', extra: [e => { tag(7, A(e.B, sph(.2), mat('#c08aff', 1), 0, 1.4, .1, 0, 0, 0, 1, 1.3, 1)); for (let i = 0; i < 5; i++) tag(7, A(e.B, octa(.08), mat('#463e4a'), Math.sin(i * 1.26) * .4, 1.4 + (i % 2) * .2, .1 + Math.cos(i * 1.26) * .4)); }] }), 'golempet'],
  'The Torn Heart of the Halls': [() => golem({ bulk: 1.45, fur: '#2a2226', fur2: '#463638', dark: '#120c0e', core: '#ff3a2a', spikes: '#120c0e', headK: .9, extra: [e => { A(e.B, sph(.3), mat('#1a0808'), 0, .6, .4, 0, 0, 0, 1, 1.2, .5); tag(7, A(e.B, sph(.2), mat('#ff3a2a', 1), 0, .6, .5, 0, 0, 0, 1, 1.1, .6)); }, chains('#5a5f6a')] }), 'golempet'],
  'The Undergate Colossus': [() => golem({ bulk: 1.6, fur: '#34302e', fur2: '#524a46', dark: '#161412', core: '#ff7a2a', head: 'helm', rim: '#161412', spikes: '#524a46', bigFist: 1, extra: [gPlates('#161412'), e => { for (const s of [-1, 1]) A(e.B, box(.12, 1.3, .12), mat('#524a46'), s * .56, .5, .5); A(e.B, box(1.24, .12, .12), mat('#524a46'), 0, 1.15, .5); }] }), 'golempet'],
  'The Rib-Warden': [() => golem({ bulk: 1.3, fur: '#3a3434', fur2: '#8a8068', dark: '#161212', eye: '#ff7a2a', head: 'skull', core: '#ff7a2a', extra: [gRibs('#8a8068'), e => { for (const s of [-1, 1]) for (let i = 0; i < 3; i++) A(e.B, cone(.05, .5, 4), mat('#8a8068'), s * (.4 + i * .1), 1.0 - i * .2, -.4, -1.0, 0, -s * .5); }] }), 'golempet'],
  'The Teeth of the World': [() => golem({ bulk: 1.65, fur: '#262224', fur2: '#3e3638', dark: '#0e0c0c', eye: '#ff5a1a', headK: .7, spikes: BONE, extra: [gMaw('#ff5a1a'), e => { for (let i = 0; i < 9; i++) A(e.B, cone(.07, .4, 4), mat(BONE), Math.sin(i * .7) * .66, .6 + Math.cos(i * .7) * .5, .3, 1.2, 0, -Math.sin(i * .7)); }, cracks('#ff5a1a')] }), 'golempet'],
};

const FALLBACK = { wolf: 'Plains Wolf', bear: 'Grizzled Bear', boar: 'Bristleback Boar', boarbig: 'Royal Forest Boar', wasp: 'Meadow Stinger', spider: 'Hollin Webspinner', crab: 'Shore Crab', crabbig: 'Old Snapper', shark: 'Reef Shark',
  harpy: 'Crag Harpy', harpynamed: 'Shrieka', leviathan: 'The Leviathan of the Fleet', treant: 'Grandmother Root', golempet: 'Crystal Golem' };
// the model for a creature: its own if it has one, else its family's ordinary one (so a creature added to the game later is not left behind)
export function beastFor(name, kind) { if (BEASTS[name]) return name; const f = FALLBACK[String(kind || '').split('~')[0]]; return f && BEASTS[f] ? f : null; }
