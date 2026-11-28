// Beasts for the MMO, designed from scratch in the approved style. One four-legged builder, quad(), is shaped into
// each family (wolf, hound, bear, boar, rat, stag); ordinary creatures are a line of choices, and every boss and
// named rare adds its own unique pieces. BEASTS maps a creature's name in the game to its model.
// Engine parts: 0 body, 21-24 upper legs (front left, front right, hind left, hind right), 31-34 lower legs,
// 5 neck and head, 27 jaw, 25 tail, 7 anything that flickers.
import { THREE, A, J, tag, mat, shade, sph, cyl, cone, box, tor, lathe, dome, ext, fac } from './people.js';
const octa = r => fac(new THREE.OctahedronGeometry(r));
const BONE = '#e6dcc2', STEEL = '#74809a', GOLD = '#e8bd4c', FLAME = ['#ffe27a', '#ffb347', '#ff7a2a', '#e8451a'];

export function quad(o = {}) {
  const g = new THREE.Group(), fc = o.fur || '#7d6b5a', fur = mat(fc), fur2 = mat(o.fur2 || '#cdbb9c'), dk = mat(o.dark || '#3a2e26'), k = o.bulk || 1, hh = o.hh || .66, L = o.len || 1, lk = hh / .66, lr = (o.legR || 1) * k, eye = o.eye || '#ffc93a';
  const B = J(g, 0, hh, 0);
  A(B, lathe([[.01, -.66], [.2 * k, -.56], [.27 * k, -.3], [(o.waist || .2) * k, -.02], [.33 * k, .3], [.3 * k, .5], [.17 * k, .64], [.01, .72]], 14), fur, 0, 0, 0, Math.PI / 2, 0, 0, 1, L, 1);
  A(B, sph(.24 * k), fur2, 0, -.12, .3 * L, 0, 0, 0, .85, .75, 1.3);
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
// ---- families
const WOLF = {}, HOUND = { ears: 'flop', muzzle: [.9, 1.3], bulk: 1.22, ruff: 0, mane: { n: 0 }, tail: 'thin', noCheek: 1, headK: 1.08 };
const BEAR = { bulk: 1.7, hh: .8, len: 1.02, legR: .78, hump: .75, humpZ: .08, ears: 'round', earK: .8, muzzle: [.75, 1.15], tail: 'stub', ruff: 0, mane: { n: 0 }, neck: .62, neckRx: -1.25, neckW: 1.1, headK: 1.38, claw: 2, noCheek: 1, eyeGlow: 0, eye: '#2a1c14', eyeK: .7, turn: .15 };
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
};
