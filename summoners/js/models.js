// Low-poly model kit. Every model is built from primitives merged into one geometry,
// with per-vertex colour, glow, and a "part" + pivot so the vertex shader can animate limbs.
import * as THREE from './three.js';
const C = THREE, TAU = Math.PI * 2;

export function T(g, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) { return g.scale(sx, sy, sz).rotateX(rx).rotateY(ry).rotateZ(rz).translate(x, y, z); }
export function P(g, part, pivot, col, glow = 0) { return { g: g.index ? g.toNonIndexed() : g, part, pivot, col: new THREE.Color(col), glow }; }
export function build(parts) {
  let n = 0; for (const p of parts) n += p.g.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), piv = new Float32Array(n * 3), prt = new Float32Array(n), glw = new Float32Array(n);
  let o = 0;
  for (const p of parts) {
    const m = p.g.attributes.position.count;
    pos.set(p.g.attributes.position.array, o * 3); nor.set(p.g.attributes.normal.array, o * 3);
    for (let i = 0; i < m; i++) {
      const k = (o + i) * 3, sh = .94 + ((i * 7919) % 100) / 1000;
      col[k] = p.col.r * sh; col[k + 1] = p.col.g * sh; col[k + 2] = p.col.b * sh;
      piv[k] = p.pivot[0]; piv[k + 1] = p.pivot[1]; piv[k + 2] = p.pivot[2]; prt[o + i] = p.part; glw[o + i] = p.glow;
    }
    o += m;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('pivot', new THREE.BufferAttribute(piv, 3));
  g.setAttribute('part', new THREE.BufferAttribute(prt, 1)); g.setAttribute('glow', new THREE.BufferAttribute(glw, 1));
  g.computeBoundingSphere();
  return g;
}
export const Box = (a, b, c) => new C.BoxGeometry(a, b, c), Cyl = (a, b, h, s = 6) => new C.CylinderGeometry(a, b, h, s),
  Sph = (r, w = 8, h = 6) => new C.SphereGeometry(r, w, h), Cone = (r, h, s = 6) => new C.ConeGeometry(r, h, s),
  Cap = (r, l, c = 3, s = 8) => new C.CapsuleGeometry(r, l, c, s), Tor = (r, t, a = 4, b = 10, arc = TAU) => new C.TorusGeometry(r, t, a, b, arc),
  Oct = r => new C.OctahedronGeometry(r, 0), Ico = (r, d = 0) => new C.IcosahedronGeometry(r, d), Dod = r => new C.DodecahedronGeometry(r, 0);
const O = [0, 0, 0];
const LR = [1, -1];

// ---------- elementals (fire / water share a body plan) ----------
export function elementalGeo(p) {
  return build([
    P(T(Cone(.31, 1.0, 7), 0, 1.0, 0, Math.PI), 0, O, p.core, p.g[0]),
    P(T(Sph(.3), 0, 1.5, 0, 0, 0, 0, 1, .85, .85), 0, O, p.chest, p.g[1]),
    ...[[.28, 1.62, -.05], [-.3, 1.46, .05], [0, 1.24, -.26], [.12, 1.2, .25]].map(([x, y, z]) => P(T(Oct(.12), x, y, z), 0, O, p.shard, p.g[5])),
    P(T(Sph(.17), 0, 1.93, .02), 5, [0, 1.8, 0], p.head, p.g[2]),
    ...LR.map(s => P(T(Sph(.035, 5, 4), .06 * s, 1.95, .15), 5, [0, 1.8, 0], p.eye, 3)),
    ...[0, 1, 2, 3, 4].map(k => P(T(Cone(.055, .34, 4), Math.cos(k * 1.257) * .1, 2.14, Math.sin(k * 1.257) * .1), 7, [0, 2.0, 0], p.crown, p.g[3])),
    ...LR.map((s, i) => P(T(Cone(.11, .6, 5), .4 * s, 1.35, .05, Math.PI), 3 + i, [.36 * s, 1.62, 0], p.core, p.g[4])),
    ...LR.map((s, i) => P(T(Cone(.07, .26, 4), .4 * s, .98, .08, Math.PI), 3 + i, [.36 * s, 1.62, 0], p.crown, p.g[3])),
    P(T(Cone(.13, .4, 5), 0, .42, 0, Math.PI), 7, [0, .6, 0], p.crown, p.g[3]),
  ]);
}
export const fireGeo = () => elementalGeo({ core: '#e8500c', chest: '#ffa53a', head: '#fff0a0', crown: '#ffd34d', shard: '#2a201c', eye: '#ffffff', g: [.55, .7, 1.1, 1.3, .5, 0] });
export const waterGeo = () => elementalGeo({ core: '#1c64b0', chest: '#45a6e0', head: '#dff6ff', crown: '#9fe6ff', shard: '#eaf8ff', eye: '#ffffff', g: [.25, .35, .7, .9, .25, .4] });

export const golemGeo = () => {
  const ST = '#8c877c', ST2 = '#6d685f', MS = '#5e8a3a';
  return build([
    ...LR.map((s, i) => P(T(Box(.32, .6, .36), .24 * s, .32, 0), 1 + i, [.24 * s, .62, 0], ST2)),
    P(T(Box(.7, .3, .45), 0, .75), 0, O, ST2),
    P(T(Box(1.0, .75, .62), 0, 1.25), 0, O, ST),
    P(T(Box(.62, .12, .52), 0, 1.66, -.02), 0, O, MS),
    P(T(Box(.36, .3, .34), 0, 1.8, .16), 5, [0, 1.6, 0], ST),
    ...LR.map(s => P(T(Sph(.045, 5, 4), .08 * s, 1.82, .34), 5, [0, 1.6, 0], '#ffb43a', 2.2)),
    ...LR.map((s, i) => P(T(Box(.3, .8, .32), .68 * s, 1.12), 3 + i, [.62 * s, 1.5, 0], ST)),
    ...LR.map((s, i) => P(T(Box(.38, .34, .4), .7 * s, .62, .04), 3 + i, [.62 * s, 1.5, 0], ST2)),
    ...[[.22, 1.8, -.28], [-.2, 1.75, -.3], [0, 1.9, -.32]].map(([x, y, z]) => P(T(Oct(.15), x, y, z, 0, 0, 0, 1, 2, 1), 0, O, '#7fd6c8', 1.1)),
  ]);
};
export const stormGeo = () => build([
  P(T(Sph(.22), 0, 1.3, 0, 0, 0, 0, 1, 1.2, 1), 0, O, '#cdb8ff', 1.0),
  P(T(Sph(.15), 0, 1.62, .04), 5, [0, 1.5, 0], '#f2ecff', 1.3),
  ...LR.map(s => P(T(Sph(.03, 5, 4), .05 * s, 1.64, .17), 5, [0, 1.5, 0], '#ffffff', 3)),
  P(T(Box(.55, .04, .3), .38, 1.44, -.08, 0, 0, .3), 8, [.12, 1.38, -.08], '#a58cff', .7),
  P(T(Box(.55, .04, .3), -.38, 1.44, -.08, 0, 0, -.3), 9, [-.12, 1.38, -.08], '#a58cff', .7),
  P(T(Cone(.12, .6, 5), 0, .85, 0, Math.PI), 7, [0, 1.1, 0], '#8f6bff', 1.2),
  ...LR.map(s => P(T(Oct(.06), .2 * s, 1.05, .1), 7, [0, 1.1, 0], '#fff6a0', 2)),
]);
export const bruteGeo = () => {
  const SKIN = '#7f8c5c', STEEL = '#8293ad', STEEL2 = '#4f5c74', TEAL = '#7a3a2c', LEATH = '#4a3526', HORN = '#e2d6b5', RED = '#ff3a2a';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.1, .09, .62), .15 * s, .4, 0), 1 + i, [.15 * s, .74, 0], LEATH)),
    ...LR.map((s, i) => P(T(Box(.18, .15, .28), .15 * s, .08, .04), 1 + i, [.15 * s, .74, 0], STEEL2)),
    P(T(Box(.52, .17, .33), 0, .8), 0, O, LEATH),
    P(T(Box(.62, .56, .4), 0, 1.13), 0, O, STEEL),
    P(T(Box(.46, .3, .06), 0, 1.18, .21), 0, O, STEEL2),
    P(T(Box(.34, .44, .04), 0, .8, .19), 0, O, TEAL),
    ...LR.map(s => P(T(Sph(.17, 6, 4), .37 * s, 1.41, 0, 0, 0, 0, 1.25, .8, 1.05), 0, O, STEEL2)),
    P(T(Box(.29, .29, .29), 0, 1.58, .03), 5, [0, 1.42, 0], SKIN),
    P(T(new C.SphereGeometry(.21, 8, 5, 0, TAU, 0, Math.PI / 2), 0, 1.64, .02), 5, [0, 1.42, 0], STEEL),
    ...LR.map(s => P(T(Cone(.05, .32, 5), .21 * s, 1.8, 0, 0, 0, -1.0 * s), 5, [0, 1.42, 0], HORN)),
    ...LR.map(s => P(T(Cone(.026, .09, 4), .065 * s, 1.5, .19), 5, [0, 1.42, 0], HORN)),
    ...LR.map(s => P(T(Sph(.032, 5, 4), .07 * s, 1.61, .18), 5, [0, 1.42, 0], RED, 2.4)),
    P(T(Cyl(.08, .07, .6), .39, 1.06), 3, [.39, 1.36, 0], SKIN),
    P(T(Cyl(.08, .07, .6), -.39, 1.06), 4, [-.39, 1.36, 0], SKIN),
    ...LR.map((s, i) => P(T(Box(.14, .16, .14), .39 * s, .75), 3 + i, [.39 * s, 1.36, 0], STEEL2)),
    P(T(Box(.07, .58, .48), .5, .98, .12), 3, [.39, 1.36, 0], TEAL),
    P(T(Sph(.09, 6, 4), .55, 1.0, .12), 3, [.39, 1.36, 0], STEEL),
    P(T(Cyl(.026, .026, .9, 4), -.39, .75, .32, Math.PI / 2), 4, [-.39, 1.36, 0], LEATH),
    P(T(Box(.04, .3, .22), -.39, .86, .7), 4, [-.39, 1.36, 0], STEEL),
  ]);
};
export const archerGeo = () => {
  const SK = '#d9a77e', TU = '#2f5d8a', BR = '#5a3e28', HD = '#24384f';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.07, .06, .62), .1 * s, .38, 0), 1 + i, [.1 * s, .7, 0], BR)),
    ...LR.map((s, i) => P(T(Box(.12, .12, .2), .1 * s, .06, .03), 1 + i, [.1 * s, .7, 0], '#3b2a1c')),
    P(T(Cyl(.2, .26, .62, 8), 0, .98), 0, O, TU),
    P(T(Cyl(.215, .215, .06, 8), 0, .8), 0, O, BR),
    P(T(Box(.36, .62, .04), 0, 1.02, -.21), 0, O, HD),
    P(T(Sph(.14), 0, 1.5), 5, [0, 1.38, 0], SK),
    P(T(Sph(.17), 0, 1.54, -.05), 5, [0, 1.38, 0], HD),
    P(T(Cone(.12, .22, 6), 0, 1.72, -.08, -.4), 5, [0, 1.38, 0], HD),
    ...LR.map((s, i) => P(T(Cyl(.05, .045, .5), .25 * s, 1.08), 3 + i, [.25 * s, 1.32, 0], TU)),
    P(new C.TorusGeometry(.36, .022, 3, 10, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(.3, 1.0, .22), 3, [.25, 1.32, 0], BR),
    P(T(Box(.01, .7, .01), .3, 1.0, .22), 3, [.25, 1.32, 0], '#e8e0c8'),
    P(T(Cyl(.06, .06, .45), -.1, 1.15, -.24, .3), 0, O, BR),
  ]);
};
export const knightGeo = () => {
  const AR = '#b9c2cf', AR2 = '#7e8898', BL = '#2e5a9e', GD = '#d8b24a', PL = '#c0392b';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.08, .07, .62), .11 * s, .38, 0), 1 + i, [.11 * s, .7, 0], AR2)),
    ...LR.map((s, i) => P(T(Box(.14, .12, .24), .11 * s, .06, .04), 1 + i, [.11 * s, .7, 0], AR)),
    P(T(Box(.42, .4, .3), 0, .82), 0, O, BL),
    P(T(Box(.48, .46, .32), 0, 1.18), 0, O, AR),
    P(T(Box(.26, .5, .03), 0, .98, .17), 0, O, BL),
    P(T(Box(.05, .3, .035), 0, 1.05, .19), 0, O, GD), P(T(Box(.2, .05, .035), 0, 1.1, .19), 0, O, GD),
    ...LR.map(s => P(T(Sph(.13, 6, 4), .3 * s, 1.38, 0, 0, 0, 0, 1.2, .8, 1), 0, O, AR2)),
    P(T(Cyl(.16, .17, .32, 8), 0, 1.6), 5, [0, 1.42, 0], AR),
    P(T(Box(.2, .03, .02), 0, 1.62, .165), 5, [0, 1.42, 0], '#1a1a1a'),
    P(T(Cone(.07, .35, 5), 0, 1.9, -.02, -.3), 5, [0, 1.42, 0], PL),
    ...LR.map((s, i) => P(T(Cyl(.065, .06, .52), .32 * s, 1.08), 3 + i, [.32 * s, 1.36, 0], AR2)),
    P(T(Box(.06, .6, .44), .42, .98, .14), 3, [.32, 1.36, 0], BL),
    P(T(Box(.065, .08, .3), .43, 1.05, .14), 3, [.32, 1.36, 0], GD),
    P(T(Box(.04, .06, .8), -.32, .8, .45), 4, [-.32, 1.36, 0], '#dfe5ec'),
    P(T(Box(.2, .04, .05), -.32, .8, .06), 4, [-.32, 1.36, 0], GD),
  ]);
};
export const heroGeoFor = cls => cls === 'druid' ? druidHeroGeo() : cls === 'necro' ? necroHeroGeo() : heroGeo();
const druidHeroGeo = () => { const VOID = '#0b080d', AM = '#ffb43a', AN = '#d9c8a0';
  return build([
    P(T(Cone(.62, 1.95, 9), 0, .97), 0, O, '#45552a'), P(T(Cone(.8, .75, 9), 0, 1.55), 0, O, '#6b4f2a'),
    P(T(Sph(.27), 0, 2.02), 0, O, '#3d4a22'), P(T(Sph(.17), 0, 1.98, .12), 0, O, VOID),
    ...LR.map(s => P(T(Sph(.035, 5, 4), .06 * s, 2.0, .26), 0, O, AM, 3)),
    ...LR.flatMap(s => [P(T(Cyl(.03, .04, .6, 4), .2 * s, 2.4, 0, 0, 0, -.6 * s), 0, O, AN),
      P(T(Cyl(.02, .03, .3, 4), .38 * s, 2.62, .05, 0, 0, .2 * s), 0, O, AN), P(T(Cyl(.02, .03, .28, 4), .32 * s, 2.5, -.12, -.6, 0, -.3 * s), 0, O, AN)]),
    P(T(Cyl(.04, .055, 2.3, 5), .55, 1.15, .2, 0, 0, .06), 0, O, '#5a3f22'), P(T(Sph(.13), .5, 2.36, .2), 0, O, AM, 2.5),
    ...[0, 1, 2].map(k => P(T(Cone(.05, .2, 4), .5 + Math.cos(k * 2.1) * .12, 2.3, .2 + Math.sin(k * 2.1) * .12, 0, 0, Math.cos(k * 2.1) * .5), 0, O, '#5e9a3a'))]); };
const necroHeroGeo = () => { const VOID = '#0b080d', SOUL = '#8dff5a', BONE = '#ebdfc2';
  return build([
    P(T(Cone(.62, 1.95, 9), 0, .97), 0, O, '#2a2233'), P(T(Cone(.75, .7, 9), 0, 1.55), 0, O, '#3a2d47'),
    P(T(Sph(.27), 0, 2.02), 0, O, '#1f1928'), P(T(Cone(.2, .45, 6), 0, 2.3, -.12, -.5), 0, O, '#1f1928'),
    P(T(Sph(.17), 0, 1.98, .12), 0, O, VOID), ...LR.map(s => P(T(Sph(.035, 5, 4), .06 * s, 2.0, .26), 0, O, SOUL, 3)),
    ...LR.map(s => P(T(Sph(.13, 7, 5), .36 * s, 1.72), 0, O, BONE)),
    P(T(Cyl(.035, .035, 2.4, 5), .55, 1.2, .2), 0, O, '#3a2a1e'), P(T(Sph(.15), .55, 2.48, .2), 0, O, BONE),
    ...LR.map(s => P(T(Sph(.035, 5, 4), .55 + .05 * s, 2.5, .33), 0, O, SOUL, 3))]); };

// ---------- druid beasts ----------
export const wolfGeo = () => { const FUR = '#6e5b48', FUR2 = '#b49c78', MOSS = '#5e9a3a', DARK = '#2b211a', AMBER = '#ffb43a';
  return build([
    P(T(Cap(.25, .62), 0, .66, 0, Math.PI / 2), 0, O, FUR), P(T(Cap(.18, .5, 2, 6), 0, .55, .02, Math.PI / 2), 0, O, FUR2),
    P(T(Box(.13, .09, .7), 0, .9, -.02), 0, O, MOSS), ...[-.25, 0, .25].map(z => P(T(Cone(.06, .18, 4), 0, .98, z), 0, O, MOSS)),
    P(T(Cyl(.13, .17, .32), 0, .82, .4, .9), 5, [0, .78, .36], FUR), P(T(Box(.27, .23, .28), 0, .93, .6), 5, [0, .78, .36], FUR),
    P(T(Box(.14, .11, .22), 0, .86, .81), 5, [0, .78, .36], FUR2), P(T(Box(.07, .05, .05), 0, .9, .92), 5, [0, .78, .36], DARK),
    ...LR.map(s => P(T(Cone(.065, .17, 4), .085 * s, 1.1, .56), 5, [0, .78, .36], DARK)),
    ...LR.map(s => P(T(Sph(.034, 5, 4), .088 * s, .97, .74), 5, [0, .78, .36], AMBER, 2.4)),
    ...[[.14, .32, 1], [-.14, -.3, 1], [-.14, .32, 2], [.14, -.3, 2]].flatMap(([x, z, pt]) => [P(T(Cyl(.06, .045, .56, 5), x, .3, z), pt, [x, .58, z], FUR), P(T(Box(.1, .05, .13), x, .03, z + .02), pt, [x, .58, z], DARK)]),
    P(T(Cone(.085, .5, 5), 0, .82, -.62, -1.16), 6, [0, .74, -.42], FUR)]); };
export const bearGeo = () => { const F = '#5a4030', F2 = '#3f2c20', MS = '#5e9a3a';
  return build([
    P(T(Cap(.48, .7, 3, 8), 0, .95, 0, Math.PI / 2), 0, O, F), P(T(Sph(.5, 8, 6), 0, 1.25, -.25, 0, 0, 0, 1, .9, 1), 0, O, F2),
    P(T(Box(.5, .12, .9), 0, 1.55, -.1), 0, O, MS),
    P(T(Box(.5, .45, .5), 0, 1.15, .75), 5, [0, 1.05, .5], F), P(T(Box(.28, .22, .3), 0, 1.05, 1.08), 5, [0, 1.05, .5], '#8a6a4a'),
    P(T(Box(.1, .08, .06), 0, 1.12, 1.24), 5, [0, 1.05, .5], '#1a120c'),
    ...LR.map(s => P(T(Sph(.09, 6, 4), .2 * s, 1.43, .72), 5, [0, 1.05, .5], F2)), ...LR.map(s => P(T(Sph(.04, 5, 4), .13 * s, 1.24, 1.0), 5, [0, 1.05, .5], '#ffb43a', 2.2)),
    ...[[.3, .5, 1], [-.3, -.45, 1], [-.3, .5, 2], [.3, -.45, 2]].flatMap(([x, z, pt]) => [P(T(Cyl(.14, .12, .7, 6), x, .35, z), pt, [x, .7, z], F2), P(T(Box(.22, .08, .26), x, .04, z + .05), pt, [x, .7, z], '#e2d6b5')])]); };
export const treantGeo = () => { const BK = '#5a3f28', BK2 = '#43301f', LF = '#4f8a35', LF2 = '#6aa844';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.16, .24, .8, 6), .22 * s, .4), 1 + i, [.22 * s, .8, 0], BK2)),
    P(T(Cyl(.38, .45, 1.5, 7), 0, 1.5), 0, O, BK), P(T(Cyl(.3, .38, .6, 7), 0, 2.5), 0, O, BK2),
    ...LR.map(s => P(T(Sph(.05, 5, 4), .12 * s, 2.25, .34), 0, O, '#ffd34d', 2.5)), P(T(Box(.26, .05, .06), 0, 2.08, .36), 0, O, '#1a120c'),
    P(T(Ico(.75, 0), 0, 3.15, 0, 0, 0, 0, 1.2, .9, 1.2), 5, [0, 2.6, 0], LF), P(T(Ico(.45, 0), .5, 2.9, .2), 5, [0, 2.6, 0], LF2), P(T(Ico(.42, 0), -.5, 3.0, -.2), 5, [0, 2.6, 0], LF2),
    ...LR.map((s, i) => P(T(Cyl(.09, .13, 1.2, 5), .6 * s, 1.7, 0, 0, 0, .5 * s), 3 + i, [.4 * s, 2.2, 0], BK)),
    ...LR.map((s, i) => P(T(Ico(.25, 0), .95 * s, 1.15, .05), 3 + i, [.4 * s, 2.2, 0], LF2))]); };
export const waspGeo = () => build([
  P(T(Sph(.16), 0, 1.3, .1), 0, O, '#3a2a10'), P(T(Sph(.2), 0, 1.25, -.22, 0, 0, 0, .9, .9, 1.3), 0, O, '#f0c020', .4),
  P(T(Tor(.17, .03, 3, 10), 0, 1.25, -.22), 0, O, '#1a1408'), P(T(Cone(.04, .2, 4), 0, 1.2, -.55, -Math.PI / 2), 0, O, '#1a1408'),
  P(T(Sph(.11), 0, 1.38, .28), 5, [0, 1.3, .2], '#3a2a10'), ...LR.map(s => P(T(Sph(.045, 5, 4), .07 * s, 1.42, .35), 5, [0, 1.3, .2], '#ff5a2a', 2)),
  P(T(Box(.45, .02, .18), .26, 1.45, 0, 0, 0, .2), 8, [.08, 1.4, 0], '#d9f0ff', .6), P(T(Box(.45, .02, .18), -.26, 1.45, 0, 0, 0, -.2), 9, [-.08, 1.4, 0], '#d9f0ff', .6)]);

// ---------- necromancer's undead ----------
export const skeletonGeo = () => { const BONE = '#ebdfc2', BONE2 = '#c4b48e', IRON = '#a3abb3', RUST = '#7a5a40', CLOTH = '#3e2c50', SOUL = '#8dff5a';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.045, .038, .86, 5), .1 * s, .5, 0), 1 + i, [.1 * s, .95, 0], BONE)),
    ...LR.map((s, i) => P(T(Box(.1, .05, .2), .1 * s, .03, .04), 1 + i, [.1 * s, .95, 0], BONE2)),
    P(T(Box(.3, .1, .16), 0, .98), 0, O, BONE2), P(T(Box(.34, .3, .05), 0, .84, .1), 0, O, CLOTH), P(T(Box(.3, .26, .05), 0, .86, -.1), 0, O, CLOTH),
    P(T(Cyl(.035, .035, .38, 5), 0, 1.16), 0, O, BONE2),
    ...[0, 1, 2, 3].map(k => P(Tor(.155 - k * .012, .024).rotateX(Math.PI / 2).scale(1, 1, .72).translate(0, 1.22 + k * .085, 0), 0, O, BONE)),
    P(T(Box(.46, .07, .11), 0, 1.55), 0, O, BONE2),
    P(T(Sph(.165), 0, 1.77, .01, 0, 0, 0, 1, 1.05, 1.12), 5, [0, 1.58, 0], BONE), P(T(Box(.17, .06, .13), 0, 1.6, .06), 5, [0, 1.58, 0], BONE2),
    ...LR.map(s => P(T(Sph(.045, 5, 4), .062 * s, 1.78, .15), 5, [0, 1.58, 0], SOUL, 2.2)),
    P(T(Cyl(.032, .028, .64, 5), .25, 1.24), 3, [.25, 1.53, 0], BONE), P(T(Cyl(.032, .028, .64, 5), -.25, 1.24), 4, [-.25, 1.53, 0], BONE),
    P(T(Box(.045, .07, .78), -.25, .94, .42), 4, [-.25, 1.53, 0], IRON), P(T(Box(.2, .05, .05), -.25, .94, .04), 4, [-.25, 1.53, 0], RUST),
    P(T(Box(.06, .4, .34), .3, 1.05, .12), 3, [.25, 1.53, 0], RUST)]); };
export const ghoulGeo = () => { const SK = '#8a9a7a', SK2 = '#5f6b52', RAG = '#3b3040';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.07, .05, .6), .13 * s, .32, -.05), 1 + i, [.13 * s, .62, -.05], SK2)),
    P(T(Box(.32, .22, .22), 0, .7, -.05), 0, O, RAG),
    P(T(Box(.36, .5, .26), 0, 1.0, .12, .5), 0, O, SK), P(T(Box(.3, .08, .3), 0, 1.27, .1, .5), 0, O, SK2),
    P(T(Sph(.15), 0, 1.25, .42), 5, [0, 1.2, .3], SK), ...LR.map(s => P(T(Sph(.035, 5, 4), .06 * s, 1.27, .55), 5, [0, 1.2, .3], '#8dff5a', 2.4)),
    P(T(Box(.12, .05, .1), 0, 1.15, .52), 5, [0, 1.2, .3], '#2a1a1a'),
    ...LR.map((s, i) => P(T(Cyl(.05, .04, .8), .26 * s, .82, .3), 3 + i, [.24 * s, 1.18, .25], SK)),
    ...LR.flatMap((s, i) => [-.04, 0, .04].map(o => P(T(Cone(.02, .16, 3), .26 * s + o, .38, .34, Math.PI), 3 + i, [.24 * s, 1.18, .25], '#e2d6b5')))]); };
export const abomGeo = () => { const FL = '#a8949a', FL2 = '#7d6870', ST = '#2a1a20';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.18, .16, .55), .3 * s, .3), 1 + i, [.3 * s, .6, 0], FL2)),
    P(T(Sph(.75, 10, 8), 0, 1.35, 0, 0, 0, 0, 1, .95, .85), 0, O, FL),
    ...[[0, 1.4, .64, 0], [.3, 1.1, .55, .6], [-.35, 1.6, .5, -.5]].map(([x, y, z, r]) => P(T(Box(.5, .04, .04), x, y, z, 0, 0, r), 0, O, ST)),
    P(T(Sph(.22), 0, 2.15, .2), 5, [0, 2, 0], FL2), ...LR.map(s => P(T(Sph(.04, 5, 4), .08 * s, 2.18, .4), 5, [0, 2, 0], '#8dff5a', 2.4)),
    ...LR.map((s, i) => P(T(Cyl(.17, .14, .9), .8 * s, 1.15), 3 + i, [.7 * s, 1.6, 0], FL)),
    P(T(Box(.06, .5, .45), -.85, .6, .25), 4, [-.7, 1.6, 0], '#b9c2cf'), P(T(Box(.06, .14, .14), -.85, .9, .02), 4, [-.7, 1.6, 0], '#4a3526'),
    P(T(Sph(.2), .82, .66, .05), 3, [.7, 1.6, 0], FL2)]); };
export const wraithGeo = () => build([
  P(T(Cone(.42, 1.5, 8), 0, 1.0, 0, Math.PI), 0, O, '#2c3a44', .3), P(T(Cone(.36, .9, 8), 0, 1.95), 0, O, '#26323b', .2),
  P(T(Sph(.17), 0, 2.0, .12), 5, [0, 1.9, 0], '#0b0d10'), ...LR.map(s => P(T(Sph(.04, 5, 4), .06 * s, 2.03, .26), 5, [0, 1.9, 0], '#7fffd4', 3)),
  ...LR.map((s, i) => P(T(Cone(.1, .8, 5), .42 * s, 1.4, .15, Math.PI, 0, .3 * s), 3 + i, [.32 * s, 1.75, 0], '#2c3a44', .3)),
  ...LR.map((s, i) => P(T(Cone(.05, .3, 4), .52 * s, .95, .2, Math.PI), 3 + i, [.32 * s, 1.75, 0], '#7fffd4', 1.2)),
  P(T(Cone(.2, .5, 6), 0, .2, 0, Math.PI), 7, [0, .45, 0], '#7fffd4', .8)]);

export const heroGeo = () => {
  const VOID = '#0b080d', GD = '#ffd34d';
  return build([
    P(T(Cone(.62, 1.95, 9), 0, .97), 0, O, '#7a1f1c'), P(T(Tor(.56, .05, 4, 16), 0, .22, 0, Math.PI / 2), 0, O, '#e0b040'),
    P(T(Cone(.72, .65, 9), 0, 1.58), 0, O, '#5c1715'), P(T(Tor(.5, .04, 4, 16), 0, 1.3, 0, Math.PI / 2), 0, O, '#e0b040'),
    P(T(Sph(.27), 0, 2.02), 0, O, '#5c1715'), P(T(Sph(.17), 0, 1.98, .12), 0, O, VOID),
    ...LR.map(s => P(T(Sph(.035, 5, 4), .06 * s, 2.0, .26), 0, O, GD, 3)),
    P(T(Cyl(.035, .035, 2.3, 5), .55, 1.15, .2), 0, O, '#2b1d14'), P(T(Cone(.12, .4, 5), .55, 2.48, .2), 0, O, GD, 2.5),
  ]);
};

// ---------- new enemies ----------
export const pikemanGeo = () => { const BL = '#2e5a9e', GM = '#8a7a5a', ST = '#b9c2cf', WD = '#6b4a2e';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.07, .06, .62), .1 * s, .38), 1 + i, [.1 * s, .7, 0], '#4a3a2a')),
    ...LR.map((s, i) => P(T(Box(.12, .1, .22), .1 * s, .06, .03), 1 + i, [.1 * s, .7, 0], '#3b2a1c')),
    P(T(Cyl(.22, .27, .66, 8), 0, 1.0), 0, O, GM), P(T(Box(.3, .4, .03), 0, 1.0, .25), 0, O, BL),
    P(T(Sph(.14), 0, 1.5), 5, [0, 1.38, 0], '#d9a77e'), P(T(Cyl(.2, .2, .04, 10), 0, 1.6), 5, [0, 1.38, 0], ST), P(T(Cyl(.14, .15, .16, 8), 0, 1.68), 5, [0, 1.38, 0], ST),
    ...LR.map((s, i) => P(T(Cyl(.05, .045, .5), .25 * s, 1.08), 3 + i, [.25 * s, 1.32, 0], GM)),
    P(T(Cyl(.025, .025, 2.8, 4), -.12, 1.0, .7, Math.PI / 2 - .15), 4, [-.25, 1.32, 0], WD), P(T(Cone(.06, .3, 4), -.12, 1.2, 2.1, Math.PI / 2 - .15), 4, [-.25, 1.32, 0], ST),
    P(T(Cyl(.3, .3, .05, 10), .32, 1.05, .15, 0, 0, Math.PI / 2), 3, [.25, 1.32, 0], BL)]); };
export const cavalryGeo = () => { const HR = '#5a3e28', HR2 = '#3b2a1c', AR = '#b9c2cf', BL = '#2e5a9e', GD = '#d8b24a';
  return build([
    P(T(Cap(.36, .9, 3, 8), 0, 1.05, 0, Math.PI / 2), 0, O, HR), P(T(Box(.62, .5, .9), 0, 1.15, 0), 0, O, BL),
    P(T(Cyl(.16, .22, .7, 6), 0, 1.45, .7, .7), 5, [0, 1.3, .55], HR), P(T(Box(.2, .22, .5), 0, 1.68, 1.02, .3), 5, [0, 1.3, .55], HR), P(T(Box(.08, .3, .2), 0, 1.62, .85, .3), 5, [0, 1.3, .55], HR2),
    ...[[.2, .55, 1], [-.2, -.5, 1], [-.2, .55, 2], [.2, -.5, 2]].flatMap(([x, z, pt]) => [P(T(Cyl(.07, .06, .85, 5), x, .45, z), pt, [x, .85, z], HR), P(T(Box(.1, .08, .12), x, .04, z), pt, [x, .85, z], HR2)]),
    P(T(Cone(.08, .6, 5), 0, 1.0, -.75, -1.9), 6, [0, 1.1, -.6], HR2),
    P(T(Box(.42, .5, .3), 0, 1.85, -.05), 0, O, AR), P(T(Cyl(.15, .16, .3, 8), 0, 2.25, -.05), 0, O, AR), P(T(Cone(.06, .3, 5), 0, 2.5, -.07), 0, O, '#c0392b'),
    P(T(Cyl(.03, .02, 2.4, 4), -.3, 1.95, .9, Math.PI / 2 - .1), 4, [-.25, 2, 0], WD_C), P(T(Box(.25, .15, .03), -.3, 2.05, .25), 4, [-.25, 2, 0], GD),
    P(T(Box(.06, .5, .4), .32, 1.8, .05), 3, [.25, 2, 0], BL)]); };
const WD_C = '#6b4a2e';
export const priestGeo = () => { const RB = '#e8e2d0', GD = '#d8b24a';
  return build([
    P(T(Cone(.42, 1.5, 9), 0, .75), 0, O, RB), P(T(Tor(.38, .04, 4, 14), 0, .15, 0, Math.PI / 2), 0, O, GD), P(T(Box(.14, 1.1, .02), 0, .7, .3), 0, O, GD),
    P(T(Sph(.14), 0, 1.58), 5, [0, 1.45, 0], '#d9a77e'), P(T(Sph(.18), 0, 1.62, -.04), 5, [0, 1.45, 0], RB),
    ...LR.map((s, i) => P(T(Cyl(.06, .05, .5), .26 * s, 1.12), 3 + i, [.24 * s, 1.36, 0], RB)),
    P(T(Cyl(.025, .025, 1.9, 4), .3, 1.1, .12), 3, [.24, 1.36, 0], WD_C), P(T(Tor(.16, .03, 4, 12), .3, 2.1, .12), 3, [.24, 1.36, 0], GD, 1.6), P(T(Sph(.07), .3, 2.1, .12), 3, [.24, 1.36, 0], '#fff6c0', 2.5)]); };
export const crossbowGeo = () => { const TU = '#6a3a2a', ST = '#9aa3ab', WD = '#5a3e28';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.07, .06, .62), .1 * s, .38), 1 + i, [.1 * s, .7, 0], '#3b2a1c')),
    P(T(Cyl(.21, .26, .64, 8), 0, .98), 0, O, TU), P(T(Box(.4, .3, .25), 0, 1.2), 0, O, ST),
    P(T(Sph(.14), 0, 1.5), 5, [0, 1.38, 0], '#d9a77e'), P(T(new C.SphereGeometry(.16, 8, 5, 0, TAU, 0, Math.PI / 2), 0, 1.55), 5, [0, 1.38, 0], ST),
    ...LR.map((s, i) => P(T(Cyl(.05, .045, .45, 5), .18 * s, 1.15, .2, 1.2), 3 + i, [.24 * s, 1.32, 0], TU)),
    P(T(Box(.06, .08, .7), 0, 1.2, .45), 4, [0, 1.32, 0], WD), P(T(Box(.7, .04, .05), 0, 1.22, .72), 4, [0, 1.32, 0], ST)]); };
export const shamanGeo = () => { const SK = '#7f8c5c', HD = '#6b4a2e', BN = '#e2d6b5';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.08, .07, .5), .13 * s, .3), 1 + i, [.13 * s, .58, 0], SK)),
    P(T(Cone(.45, 1.1, 7), 0, .85), 0, O, HD), P(T(Box(.5, .4, .35), 0, 1.25, .05, .3), 0, O, SK),
    P(T(Sph(.17), 0, 1.55, .28), 5, [0, 1.45, .2], SK), P(T(Sph(.18, 7, 5), 0, 1.6, .34, 0, 0, 0, 1, 1, .5), 5, [0, 1.45, .2], BN),
    ...LR.map(s => P(T(Sph(.035, 5, 4), .07 * s, 1.62, .45), 5, [0, 1.45, .2], '#8dff5a', 2.5)), ...LR.map(s => P(T(Cone(.04, .3, 4), .14 * s, 1.85, .25, 0, 0, -.4 * s), 5, [0, 1.45, .2], '#c0392b')),
    ...LR.map((s, i) => P(T(Cyl(.07, .06, .55), .32 * s, 1.1, .1), 3 + i, [.3 * s, 1.35, 0], SK)),
    P(T(Cyl(.03, .03, 1.9, 4), .38, 1.05, .2), 3, [.3, 1.35, 0], HD), P(T(Dod(.13), .38, 2.05, .2), 3, [.3, 1.35, 0], BN), P(T(Cone(.1, .3, 5), .38, 2.3, .2), 3, [.3, 1.35, 0], '#8dff5a', 2)]); };
export const trollGeo = () => { const SK = '#6e7f8c', SK2 = '#55636e', HR = '#3b2a1c';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.22, .2, .8), .32 * s, .4), 1 + i, [.32 * s, .8, 0], SK2)),
    P(T(Sph(.8, 10, 8), 0, 1.45, 0, 0, 0, 0, 1, 1.1, .85), 0, O, SK), P(T(Box(.9, .3, .7), 0, .95), 0, O, HR),
    P(T(Sph(.28), 0, 2.35, .35), 5, [0, 2.2, .2], SK2), ...LR.map(s => P(T(Cone(.05, .18, 4), .1 * s, 2.22, .6, -.3), 5, [0, 2.2, .2], '#e2d6b5')),
    ...LR.map(s => P(T(Sph(.04, 5, 4), .1 * s, 2.42, .58), 5, [0, 2.2, .2], '#ffb43a', 2)),
    ...LR.map((s, i) => P(T(Cyl(.2, .17, 1.2), .95 * s, 1.35), 3 + i, [.85 * s, 1.95, 0], SK)),
    P(T(Cyl(.14, .26, 1.3, 6), -1.0, .55, .45, .9), 4, [-.85, 1.95, 0], '#5a3e28'), P(T(Sph(.24), .98, .72, .05), 3, [.85, 1.95, 0], SK2)]); };
// a gatehouse that replaces one wall segment
export function gateGeo(f, len) {
  const S1 = f === 'human' ? '#a39d8f' : '#5c3f27', S2 = f === 'human' ? '#8f897c' : '#4a3322';
  return build([...LR.map(s => P(T(Box(1.1, 4, 1.4), s * (len / 2 - .4), 2), 0, O, S1)), ...LR.map(s => P(T(Box(1.3, .3, 1.6), s * (len / 2 - .4), 4.15), 0, O, S2)),
    P(T(Box(len, .8, 1.1), 0, 3.4), 0, O, S1)]);
}
export const doorGeo = (len) => build([P(T(Box(len - 2, 3, .3), 0, 1.5), 0, O, '#5a3e28'), ...[-1, 0, 1].map(t => P(T(Box(.08, 3, .34), t * (len - 2) / 3, 1.5), 0, O, '#2b1d14')), P(T(Box(len - 2, .12, .34), 0, 2.2), 0, O, '#9aa3ab')]);

// ---------- scenery ----------
export const pineGeo = (snow) => build([P(T(Cyl(.16, .22, 1.4), 0, .7), 0, O, '#4a3322'), P(T(Cone(1.35, 1.7, 7), 0, 1.9), 0, O, snow ? '#3f5a4a' : '#2f5034'),
  P(T(Cone(1.05, 1.5, 7), 0, 2.7), 0, O, snow ? '#dfe8ea' : '#355a38'), P(T(Cone(.7, 1.3, 7), 0, 3.4), 0, O, snow ? '#f4f8f9' : '#3d653e')]);
export const oakGeo = () => build([P(T(Cyl(.2, .3, 2, 6), 0, 1), 0, O, '#4e3524'), P(T(Ico(1.2, 0), 0, 2.6, 0, 0, 0, 0, 1.2, .9, 1.2), 0, O, '#c27a2c'),
  P(T(Ico(.85, 0), .8, 2.3, .3), 0, O, '#d39a3a'), P(T(Ico(.8, 0), -.7, 2.4, -.4), 0, O, '#a85a26')]);
export const deadGeo = () => build([P(T(Cyl(.12, .22, 2.6, 5), 0, 1.3), 0, O, '#3b3029'), P(T(Cyl(.05, .09, 1.2, 4), .35, 2.1, 0, 0, 0, -.9), 0, O, '#3b3029'),
  P(T(Cyl(.04, .08, 1, 4), -.3, 1.7, .1, 0, 0, .8), 0, O, '#3b3029')]);
export const rockGeo = (c1, c2) => build([P(T(Dod(1), 0, .3, 0, 0, 0, 0, 1.2, .75, 1), 0, O, c1), P(T(Dod(.75), 0, .72, 0, 0, 0, 0, 1, .3, .9), 0, O, c2)]);
export const cactusGeo = () => build([P(T(Cyl(.25, .28, 2.4, 7), 0, 1.2), 0, O, '#4f7a3a'), P(T(Cyl(.15, .15, .9, 6), .45, 1.5, 0, 0, 0, 0), 0, O, '#4f7a3a'),
  P(T(Cyl(.15, .15, .5, 6), .3, 1.1, 0, 0, 0, Math.PI / 2), 0, O, '#4f7a3a'), P(T(Cyl(.13, .13, .7, 6), -.38, 1.8), 0, O, '#58843f'),
  P(T(Cyl(.13, .13, .4, 6), -.24, 1.45, 0, 0, 0, Math.PI / 2), 0, O, '#58843f'), P(T(Sph(.1), 0, 2.45), 0, O, '#e86a8a', .3)]);

// ---------- city pieces ----------
export function wallGeo(f, len) {
  if (f === 'human') return build([P(T(Box(len, 2.6, .9), 0, 1.3), 0, O, '#9a958a'), P(T(Box(len + .02, .25, 1.0), 0, .12), 0, O, '#7d786e'),
    ...[-.35, 0, .35].map(t => P(T(Box(len * .18, .5, .95), t * len, 2.85), 0, O, '#a39d8f'))]);
  return build([...[-.4, -.2, 0, .2, .4].map((t, i) => P(T(Cyl(.2, .24, 2.6 + (i % 2) * .4, 6), t * len, 1.3 + (i % 2) * .2), 0, O, i % 2 ? '#6b4a2e' : '#5c3f27')),
    ...[-.4, -.2, 0, .2, .4].map((t, i) => P(T(Cone(.2, .5, 6), t * len, 2.85 + (i % 2) * .4), 0, O, '#4a3322')),
    P(T(Box(len, .18, .3), 0, 1.6, .2), 0, O, '#4a3322')]);
}
export function towerGeo(f) {
  if (f === 'human') return build([P(T(Cyl(1.2, 1.4, 4.6, 8), 0, 2.3), 0, O, '#a39d8f'), P(T(Cyl(1.45, 1.45, .4, 8), 0, 4.7), 0, O, '#8f897c'),
    P(T(Cone(1.5, 1.8, 8), 0, 5.8), 0, O, '#3a5f9e'), P(T(Box(.06, .9, .5), 0, 7.0, .25), 0, O, '#d8b24a')]);
  return build([...[0, 1, 2, 3].map(k => P(T(Cyl(.16, .18, 4.4, 5), Math.cos(k * 1.57 + .78) * .9, 2.2, Math.sin(k * 1.57 + .78) * .9), 0, O, '#5c3f27')),
    P(T(Box(2.2, .25, 2.2), 0, 4.3), 0, O, '#6b4a2e'), P(T(Cone(1.6, 1.4, 4), 0, 5.2, 0, 0, Math.PI / 4), 0, O, '#7a5a3a'),
    P(T(Dod(.3), 0, 6.0), 0, O, HORN_C)]);
}
const HORN_C = '#e2d6b5';
export function houseGeo(f, s = 1) {
  if (f === 'human') return build([P(T(Box(2.2 * s, 1.6, 2.6 * s), 0, .8), 0, O, '#d8cdb5'), P(T(Cone(1.9 * s, 1.3, 4), 0, 2.25, 0, 0, Math.PI / 4), 0, O, '#8a4a32'),
    P(T(Box(.4, .7, .05), 0, .35, 1.31 * s), 0, O, '#5a3e28'), P(T(Box(.3, .9, .3), .6 * s, 2.6, -.5), 0, O, '#7d786e')]);
  return build([P(T(Cone(1.6 * s, 2.4, 6), 0, 1.2), 0, O, '#7a5a3a'), ...[0, 1, 2].map(k => P(T(Cyl(.05, .05, 1.2, 4), Math.cos(k * 2.1) * .2, 2.7, Math.sin(k * 2.1) * .2, Math.cos(k * 2.1) * .3, 0, Math.sin(k * 2.1) * .3), 0, O, '#3b2a1c')),
    P(T(Box(.6, .8, .05), 0, .4, 1.25 * s), 0, O, '#2b1d14')]);
}
export function keepGeo(f) {
  if (f === 'human') return build([P(T(Box(5, 5, 5), 0, 2.5), 0, O, '#a39d8f'), ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([a, b]) => [P(T(Cyl(.8, .9, 7, 8), a * 2.5, 3.5, b * 2.5), 0, O, '#9a958a'), P(T(Cone(1, 1.6, 8), a * 2.5, 7.8, b * 2.5), 0, O, '#3a5f9e')]),
    P(T(Box(5.2, .4, 5.2), 0, 5.2), 0, O, '#8f897c'), P(T(Cyl(.06, .06, 3, 4), 0, 6.7), 0, O, '#5a3e28'), P(T(Box(.05, 1, 1.6), 0, 7.6, .8), 0, O, '#2e5a9e'), P(T(Box(1.2, 1.8, .1), 0, .9, 2.52), 0, O, '#5a3e28')]);
  return build([P(T(Cyl(3.2, 3.8, 4.5, 8), 0, 2.25), 0, O, '#5c3f27'), P(T(Cone(4.2, 3.2, 8), 0, 6.1), 0, O, '#7a5a3a'),
    ...[0, 1, 2, 3, 4, 5].map(k => P(T(Cone(.18, 1.2, 5), Math.cos(k * 1.05) * 3.9, 3.4, Math.sin(k * 1.05) * 3.9, 0, 0, Math.cos(k * 1.05) * -.9), 0, O, HORN_C)),
    P(T(Dod(.6), 0, 7.9), 0, O, HORN_C), P(T(Box(1.4, 2, .2), 0, 1, 3.6), 0, O, '#2b1d14')]);
}
// the elemental citadel a city becomes once taken
const CIT = { elem: ['#3a3340', '#2a2430', '#ff7a2a', '#ffd34d', '#4fb0e8'], druid: ['#5a3f28', '#43301f', '#ffb43a', '#6aa844', '#5e9a3a'], necro: ['#c4b48e', '#3a2d47', '#8dff5a', '#ebdfc2', '#7a4a9a'] };
export function citadelGeo(R, style = 'elem') {
  const [B, B2, EM, GD, ALT] = CIT[style];
  const parts = [P(T(Cyl(3.4, 4.2, 2.4, 6), 0, 1.2), 0, O, B), P(T(Cyl(2, 2.8, 2.6, 6), 0, 3.7), 0, O, B2),
    P(T(Oct(1.2), 0, 6.4, 0, 0, 0, 0, 1, 1.8, 1), 0, O, EM, 1.6), P(T(Tor(3.6, .12, 4, 20), 0, 2.45, 0, Math.PI / 2), 0, O, GD, 1.2)];
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * TAU, x = Math.cos(a) * R * .72, z = Math.sin(a) * R * .72;
    parts.push(P(T(Cyl(.5, .7, 3.2, 5), x, 1.6, z), 0, O, B), P(T(Oct(.45), x, 3.8, z, 0, 0, 0, 1, 1.8, 1), 0, O, k % 2 ? ALT : EM, 1.4));
  }
  for (let k = 0; k < 7; k++) {
    const a = k / 7 * TAU + .4, r = R * (.4 + (k % 3) * .1), x = Math.cos(a) * r, z = Math.sin(a) * r;
    parts.push(P(T(Box(1.8, 1.4, 1.8), x, .7, z, 0, a), 0, O, B2), P(T(Cone(1.4, 1.4, 4), x, 2.1, z, 0, a + .78), 0, O, B), P(T(Box(.5, .5, .06), x, .7, z + .91), 0, O, EM, 1.3));
  }
  return build(parts);
}
// plot buildings, keyed by type
export const buildingGeo = {
  spire: () => build([P(T(Cyl(.6, .9, 4, 6), 0, 2), 0, O, '#3a3340'), P(T(Cyl(.9, .9, .3, 6), 0, 4.1), 0, O, '#2a2430'), P(T(Oct(.65), 0, 5, 0, 0, 0, 0, 1, 1.5, 1), 0, O, '#ff7a2a', 1.6)]),
  circle: () => build([P(T(Cyl(2, 2, .15, 16), 0, .08), 0, O, '#5a5260'), P(T(Tor(1.6, .07, 4, 24), 0, .2, 0, Math.PI / 2), 0, O, '#ffd34d', 1.5),
    ...[0, 1, 2, 3, 4, 5].map(k => P(T(Box(.3, 1.3, .3), Math.cos(k * 1.047) * 1.9, .65, Math.sin(k * 1.047) * 1.9), 0, O, '#6d685f'))]),
  font: () => build([P(T(Cyl(1.1, 1.2, .7, 10), 0, .35), 0, O, '#8f897c'), P(T(Cyl(.95, .95, .06, 10), 0, .68), 0, O, '#4fb0e8', .9), P(T(Oct(.35), 0, 1.6, 0, 0, 0, 0, 1, 1.8, 1), 0, O, '#bff0ff', 1.6)]),
  trade: () => build([P(T(Box(2, 1.2, 1.6), 0, .6), 0, O, '#6b4a2e'), P(T(Cone(1.6, 1.3, 4), 0, 1.85, 0, 0, Math.PI / 4), 0, O, '#c27a2c'), P(T(Box(.6, .4, .5), 1.3, .2, .4), 0, O, '#d8b24a')]),
  bastion: () => build([P(T(Box(2.6, 2, 1), 0, 1), 0, O, '#6d685f'), ...[-1, 0, 1].map(t => P(T(Box(.5, .4, 1.05), t * .9, 2.2), 0, O, '#7d786e')), P(T(Cyl(.05, .05, 2.4, 4), .9, 3.2), 0, O, '#3b2a1c'), P(T(Box(.05, .8, 1), .9, 3.8, .5), 0, O, '#ff7a2a', .5)]),
};

// ---------- Milestone 3.4 creatures ----------
const seg = (a, b, r1, r2 = r1, s = 5) => { const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
  const g = Cyl(r2, r1, L, s); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); return g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); };
export const magmaGeo = () => elementalGeo({ core: '#3a2620', chest: '#ff5a12', head: '#ffc070', crown: '#ff3a0a', shard: '#1a1210', eye: '#fff4c0', g: [.15, .9, 1.1, 1.4, .1, 0] });
export const spiderGeo = () => { const B = '#2e2622', B2 = '#45362e', MK = '#a8402a', EY = '#ff5030';
  const legs = [];
  [-.22, -.07, .08, .23].forEach((z, n) => LR.forEach((s, i) => {
    const part = (n + i) % 2 ? 1 : 2, piv = [.12 * s, .5, z], knee = [.55 * s, .78, z * 1.6], foot = [.9 * s, 0, z * 2.4];
    legs.push(P(seg(piv, knee, .045, .04), part, piv, B2), P(seg(knee, foot, .04, .02), part, piv, B));
  }));
  return build([
    P(T(Sph(.36, 9, 7), 0, .58, -.45, 0, 0, 0, 1, .85, 1.25), 0, O, B2), P(T(Sph(.2, 7, 5), 0, .8, -.5), 0, O, MK, .2),
    P(T(Sph(.24, 8, 6), 0, .52, .12, 0, 0, 0, 1, .8, 1.1), 0, O, B),
    P(T(Sph(.13, 7, 5), 0, .54, .38), 5, [0, .52, .25], B2),
    ...LR.map(s => P(T(Sph(.04, 5, 4), .06 * s, .62, .48), 5, [0, .52, .25], EY, 2.4)), ...LR.map(s => P(T(Sph(.028, 4, 3), .11 * s, .58, .45), 5, [0, .52, .25], EY, 2)),
    ...LR.map(s => P(seg([.05 * s, .46, .45], [.08 * s, .3, .55], .03, .015), 5, [0, .52, .25], '#d8c8b0')),
    ...legs]); };
export const skelMageGeo = () => { const BONE = '#ebdfc2', BONE2 = '#c4b48e', ROBE = '#3a2458', ROBE2 = '#5a3a80', SOUL = '#8dff5a', WOOD = '#4a3424';
  return build([
    ...LR.map((s, i) => P(T(Cyl(.045, .038, .86, 5), .1 * s, .5, 0), 1 + i, [.1 * s, .95, 0], BONE)),
    P(T(Cone(.36, 1.0, 7), 0, .78), 0, O, ROBE), P(T(Box(.4, .1, .2), 0, 1.0), 0, O, ROBE2),
    ...[0, 1, 2].map(k => P(Tor(.15 - k * .012, .024).rotateX(Math.PI / 2).scale(1, 1, .72).translate(0, 1.22 + k * .09, 0), 0, O, BONE)),
    P(T(Box(.46, .07, .11), 0, 1.52), 0, O, ROBE2),
    P(T(Sph(.165), 0, 1.74, .01, 0, 0, 0, 1, 1.05, 1.12), 5, [0, 1.56, 0], BONE), P(T(Cone(.25, .42, 7), 0, 1.86, -.03), 5, [0, 1.56, 0], ROBE),
    ...LR.map(s => P(T(Sph(.045, 5, 4), .062 * s, 1.75, .15), 5, [0, 1.56, 0], SOUL, 2.4)),
    P(T(Cyl(.032, .028, .64, 5), .25, 1.22), 3, [.25, 1.5, 0], BONE), P(T(Cyl(.032, .028, .64, 5), -.25, 1.22), 4, [-.25, 1.5, 0], BONE),
    P(T(Cyl(.03, .03, 1.5, 5), .27, 1.15, .14), 3, [.25, 1.5, 0], WOOD), P(T(Ico(.11, 0), .27, 1.95, .14), 3, [.25, 1.5, 0], SOUL, 2.6)]); };
