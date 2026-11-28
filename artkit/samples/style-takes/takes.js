import * as THREE from '../../../vendor/three.module.min.js';
// Three takes on one style: the same knight, wizard and wolf, designed from scratch, at three sets of proportions.
const C = { head: .19, torso: .52, leg: .62, sw: .29, limb: .1, hand: 1.6, foot: 1.7, eye: 1.15, pauld: 1.25, weap: 1.15, line: .015, facet: 1, sat: 1.05 };
const TAKES = [
  { ...C, face: 1, name: 'C1  Hooded eyes', sub: 'narrow eyes under heavy lids, long face, strong jaw' },
  { ...C, face: 2, name: 'C2  Simple dark eyes', sub: 'no whites at all: the brows and mouth do the acting' },
  { ...C, face: 3, name: 'C3  Open eyes, adult features', sub: 'larger eyes, but with lids, cheekbones and a real nose' },
];
const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 4, 1); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
let S, uLine = { value: .012 };
const mats = new Map();
const mat = (c, glow) => { const k = c + (glow ? 'g' : '') + S.sat; if (!mats.has(k)) { const col = new THREE.Color(c); const h = {}; col.getHSL(h); col.setHSL(h.h, Math.min(1, h.s * S.sat), h.l); mats.set(k, glow ? new THREE.MeshBasicMaterial({ color: col }) : new THREE.MeshToonMaterial({ color: col, gradientMap: ramp })); } return mats.get(k); };
const ink = new THREE.MeshBasicMaterial({ color: '#1a120c', side: THREE.BackSide });
ink.onBeforeCompile = s => { s.uniforms.uLine = uLine; s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLine;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uLine;'); };
const fac = g => { if (!S.facet) return g; const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };
const q = n => S.facet ? Math.max(5, Math.round(n * .45)) : n;
const sph = (r = 1) => fac(new THREE.SphereGeometry(r, q(18), q(12)));
const cyl = (a, b, h, n = 14) => fac(new THREE.CylinderGeometry(a, b, h, q(n)));
const cone = (r, h, n = 14) => fac(new THREE.ConeGeometry(r, h, q(n)));
const cap = (r, l) => fac(new THREE.CapsuleGeometry(r, l, q(6), q(14)));
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const tor = (r, t, arc = Math.PI * 2) => fac(new THREE.TorusGeometry(r, t, q(8), q(22), arc));
const lathe = (pts, n = 18) => fac(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), q(n)));
const dome = (r, a = .55) => fac(new THREE.SphereGeometry(r, q(18), q(10), 0, Math.PI * 2, 0, Math.PI * a));
function A(p, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx, line = true) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); p.add(o);
  if (line && !m.isMeshBasicMaterial) o.add(new THREE.Mesh(geo, ink)); return o;
}
const J = (p, x, y, z, rx = 0, ry = 0, rz = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(rx, ry, rz); p.add(g); return g; };
const ext = (pts, d, bev = .01) => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 2 }); g.translate(0, 0, -d / 2); return g; };

function face(p, R, o) {
  const skin = mat(o.skin), sk2 = mat(shade(o.skin, .8)), dk = mat('#2a1c14'), wh = mat('#fbf7ee'), F = S.face, hair = mat(o.hair);
  A(p, sph(R), skin, 0, R * .1, 0, 0, 0, 0, .9, 1.14, .97);                                       // skull, taller than it is wide
  A(p, sph(R * .7), skin, 0, -R * .52, R * .1, 0, 0, 0, (o.jaw || 1) * 1.08, .66, .95);           // square jaw
  A(p, sph(R * .3), skin, 0, -R * .9, R * .4, 0, 0, 0, 1.15, .6, .8);                            // chin
  if (o.stubble) A(p, sph(R * .72), mat(o.stubble), 0, -R * .6, R * .08, 0, 0, 0, (o.jaw || 1) * 1.1, .6, .97, false);
  const er = R * (F === 2 ? .11 : F === 1 ? .125 : .165), ex = R * .36, ey = R * .22, ez = R * .8;
  for (const s of [-1, 1]) {
    A(p, sph(R * .28), skin, s * R * .56, -R * .12, R * .58, 0, 0, 0, 1, .6, .7, false);          // cheekbone
    if (F === 2) { A(p, sph(er), dk, s * ex, ey, ez + R * .04, 0, s * .2, -s * .1, 1.35, .8, .45, false); A(p, sph(er * .22), mat('#ffffff', 1), s * ex - er * .3, ey + er * .2, ez + R * .04 + er * .45, 0, 0, 0, 1, 1, .4, false); }
    else { A(p, sph(er), wh, s * ex, ey, ez, 0, s * .25, 0, 1.3, F === 1 ? .62 : .8, .45);
      A(p, sph(er * .6), mat(o.iris), s * ex * .97, ey, ez + er * .3, 0, 0, 0, 1, 1, .4, false); A(p, sph(er * .3), dk, s * ex * .96, ey, ez + er * .42, 0, 0, 0, 1, 1, .35, false);
      A(p, sph(er * .13), mat('#ffffff', 1), s * ex * .96 - er * .2, ey + er * .18, ez + er * .5, 0, 0, 0, 1, 1, .4, false); }
    A(p, sph(er * 1.35), sk2, s * ex, ey + er * (F === 3 ? .78 : .62), ez - er * .15, 0, s * .25, -s * .14, 1.3, .5, .62, false);   // upper lid
    A(p, box(R * .5, R * .13, R * .17), hair, s * ex * 1.02, ey + er * 1.05 + R * .07, ez + R * .05, 0, s * .2, -s * o.brow + (s > 0 ? (o.brow2 || 0) : 0));
    A(p, sph(R * .2), skin, s * R * .9, R * .04, -R * .05, 0, 0, 0, .45, 1.1, .75);                // ears
  }
  A(p, box(R * .15, R * .5, R * .2), skin, 0, R * .02, R * .93, -.22, 0, 0, 1, 1, 1, false);       // bridge of the nose
  A(p, sph(R * .17), mat(o.nose || shade(o.skin, .9)), 0, -R * .24, R * 1.04, 0, 0, 0, 1.15, .85, 1.05);
  A(p, box(R * .44, R * .05, R * .06), dk, R * .02, -R * .56, R * .82, 0, 0, o.mouth === 'smirk' ? .1 : o.mouth === 'grin' ? 0 : -.04, 1, 1, 1, false);
  if (o.mouth === 'grin') for (const s of [-1, 1]) A(p, box(R * .1, R * .05, R * .06), dk, s * R * .25 + R * .02, -R * .52, R * .8, 0, 0, s * .6, 1, 1, 1, false);
  A(p, sph(R * .12), sk2, R * .02, -R * .68, R * .78, 0, 0, 0, 1.4, .5, .6, false);                 // lower lip
  if (o.scar) A(p, box(R * .05, R * .62, R * .04), mat(shade(o.skin, 1.18)), -R * .5, R * .12, R * .78, 0, -.5, .28, 1, 1, 1, false);
}
function hand(p, r, m) { const k = r * S.hand; A(p, sph(k), m, 0, 0, 0, 0, 0, 0, .95, 1.1, 1); A(p, sph(k * .5), m, k * .7, k * .2, k * .5, 0, 0, 0, .8, 1.2, .8); }

function knight() {
  const g = new THREE.Group(), st = mat('#b9c4d6'), sd = mat('#74809a'), gold = mat('#e8bd4c'), red = mat('#b8241c'), lea = mat('#5c3b22'), r = S.limb, hip = S.leg, sh = hip + S.torso, R = S.head;
  for (const s of [-1, 1]) {
    const L = J(g, s * S.sw * .45, hip, 0, s > 0 ? -.12 : .1, 0, s * .1);
    A(L, cap(r * 1.15, S.leg * .3), sd, 0, -S.leg * .24, 0);
    A(L, cyl(r * 1.45, r * 1.05, S.leg * .42), st, 0, -S.leg * .7, 0);                           // greave
    A(L, sph(r * 1.5), st, 0, -S.leg * .47, r * .5, 0, 0, 0, 1, 1.1, .9); A(L, sph(r * .5), gold, 0, -S.leg * .47, r * 1.75);  // knee
    A(L, sph(r), st, 0, -S.leg + r * .62, r * .9, 0, 0, 0, 1.3 * S.foot, .85, 2.0 * S.foot);    // sabaton
  }
  const W = S.sw;
  A(g, lathe([[W * .5, 0], [W * .98, -.02], [W * 1.12, S.torso * .3], [W * .82, S.torso * .55], [W * 1.3, S.torso * .9], [W * 1.05, S.torso * 1.06], [W * .5, S.torso * 1.12]]), st, 0, hip, 0, 0, 0, 0, 1, 1, .72);   // breastplate
  A(g, tor(W * .98, r * .5), lea, 0, hip + S.torso * .34, 0, Math.PI / 2, 0, 0, 1, .74, 1); A(g, box(r * 1.6, r * 1.4, r * .5), gold, 0, hip + S.torso * .34, W * .74);
  for (let i = -2; i <= 2; i++) A(g, ext([[-.5, 0], [.5, 0], [.36, -1], [0, -1.25], [-.36, -1]], .12, .03), i % 2 ? sd : st, Math.sin(i * .62) * W * 1.0, hip + S.torso * .22, Math.cos(i * .62) * W * .74, .12, i * .62, 0, r * 2.3, S.leg * .34, r * 2);   // tassets
  A(g, ext([[-.5, 0], [.5, 0], [.5, -1], [0, -1.2], [-.5, -1]], .1, .02), red, 0, hip + S.torso * .98, W * .8, -.06, 0, 0, W * .95, S.torso * .9 + S.leg * .3, .2);   // tabard
  A(g, sph(W * .2), gold, 0, hip + S.torso * .62, W * .86, 0, 0, 0, 1, 1, .3); for (let i = 0; i < 8; i++) A(g, cone(W * .05, W * .16, 4), gold, Math.cos(i * .785) * W * .3, hip + S.torso * .62 + Math.sin(i * .785) * W * .3, W * .85, 0, 0, i * .785 - Math.PI / 2, 1, 1, .4);
  A(g, ext([[-1, 0], [1, 0], [1.25, -1], [0, -1.12], [-1.25, -1]], .05, .01), red, 0, sh * .99, -W * .7, .14, 0, 0, W * .95, S.torso + S.leg * .62, 1);   // cape
  for (const s of [-1, 1]) {   // arms: right holds the sword out, left carries the shield
    const P = W * .34 * S.pauld, Sh = J(g, s * (W * 1.12), sh, 0, s > 0 ? -.25 : -.3, 0, s * (s > 0 ? .75 : .5));
    A(Sh, dome(P, .6), st, s * P * .1, P * .12, 0, 0, 0, -s * .3); A(Sh, tor(P * .98, P * .12), gold, s * P * .1, P * .12, 0, Math.PI / 2, 0, 0); A(Sh, dome(P * .72, .6), sd, s * P * .55, -P * .12, 0, 0, 0, -s * .75);
    A(Sh, cone(P * .22, P * .6, 6), gold, s * P * .1, P * 1.0, 0);
    A(Sh, cap(r * 1.05, S.torso * .3), sd, 0, -S.torso * .3, 0);
    const El = J(Sh, 0, -S.torso * .56, 0, s > 0 ? -1.25 : -.9, 0, 0);
    A(El, sph(r * 1.35), st); A(El, cyl(r * 1.0, r * 1.4, S.torso * .42), st, 0, -S.torso * .27, 0);
    const H = J(El, 0, -S.torso * .56, 0); hand(H, r * 1.05, sd);
    if (s > 0) { const w = S.weap, B = J(H, 0, 0, 0, 1.25, 0, -1.05);
      A(B, ext([[-.055, 0], [.055, 0], [.045, .78], [0, .9], [-.045, .78]], .016, .006), mat('#dfe6f0'), 0, .1 * w, 0, 0, 0, 0, w, w, w); A(B, box(.012 * w, .6 * w, .03 * w), sd, 0, .44 * w, 0);
      A(B, ext([[-.2, -.03], [-.16, .04], [.16, .04], [.2, -.03], [.1, -.02], [-.1, -.02]], .05, .01), gold, 0, .09 * w, 0, 0, 0, 0, w, w, w); A(B, cyl(.022 * w, .026 * w, .2 * w, 8), lea, 0, -.03 * w, 0); A(B, sph(.045 * w), gold, 0, -.15 * w, 0); }
    else { const k = (S.torso * .8 + .14) * Math.min(1.15, S.weap), B = J(H, -r * 1.5, 0, r * .8, 1.25, .75, 0);
      const sp = [[-.42, .5], [.42, .5], [.44, .05], [.3, -.32], [0, -.6], [-.3, -.32], [-.44, .05]];
      A(B, ext(sp, .06, .02), red, 0, 0, 0, 0, 0, 0, k, k, 1); A(B, ext(sp, .03, .012), st, 0, 0, -.03, 0, 0, 0, k * 1.08, k * 1.08, 1);
      A(B, box(k * .12, k * 1.0, .03), gold, 0, -k * .03, .045); A(B, box(k * .8, k * .12, .03), gold, 0, k * .2, .045); A(B, sph(k * .12), gold, 0, k * .2, .05, 0, 0, 0, 1, 1, .5); }
  }
  A(g, cyl(R * .5, R * .62, R * .5), sd, 0, sh + R * .1, 0); A(g, cyl(R * .4, R * .44, R * .5), mat('#d9a47c'), 0, sh + R * .45, 0);                                    // gorget
  const Hd = J(g, 0, sh + R * 1.3, 0, .04, -.18, 0); face(Hd, R, { skin: '#d9a47c', iris: '#3f7fd0', hair: '#4a2e18', brow: .24, mouth: 'smirk', jaw: 1.18, stubble: '#b88a68', scar: 1 });
  A(Hd, dome(R * 1.1, .5), st, 0, R * .5, -R * .04, -.1); A(Hd, tor(R * 1.07, R * .08), gold, 0, R * .58, -R * .06, Math.PI / 2 - .1, 0, 0);
  for (const s of [-1, 1]) A(Hd, ext([[-.5, .5], [.5, .5], [.4, -.5], [-.1, -.8]], .1, .03), st, s * R * 1.02, -R * .2, R * .12, 0, s * 1.35, 0, R * .7, R * .9, R);
  A(Hd, box(R * .11, R * .42, R * .08), st, 0, R * .5, R * 1.0, -.1);
  for (let i = 0; i < 6; i++) A(Hd, sph(R * (.3 - i * .025)), red, 0, R * (1.65 - i * i * .03), -R * (i * .26 - .25), 0, 0, 0, .55, 1, 1);   // plume
  return g;
}
function wizard() {
  const g = new THREE.Group(), robe = mat('#3d57c4'), robe2 = mat('#27398c'), trim = mat('#e8bd4c'), wh = mat('#f1ece0'), wood = mat('#6b4526'), r = S.limb, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw, Ht = sh;
  A(g, lathe([[W * 1.75, 0], [W * 1.55, Ht * .1], [W * 1.05, Ht * .55], [W * .86, Ht * .66], [W * 1.12, Ht * .9], [W * .9, Ht * .99], [W * .4, Ht * 1.03]]), robe, 0, 0, 0, 0, 0, 0, 1, 1, .82);
  A(g, tor(W * 1.72, r * .55), trim, 0, r * .5, 0, Math.PI / 2, 0, 0, 1, .82, 1); A(g, tor(W * .9, r * .6), mat('#b8241c'), 0, Ht * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1);
  A(g, ext([[-.5, 0], [.5, 0], [.4, -1], [0, -1.15], [-.4, -1]], .1, .02), mat('#b8241c'), W * .3, Ht * .66, W * .78, -.12, 0, .06, r * 1.8, Ht * .36, .2);
  for (const s of [-1, 1]) A(g, sph(r), wood, s * W * .5, r * .5, W * .9, 0, 0, 0, 1.2 * S.foot, .8, 1.9 * S.foot);
  A(g, cone(W * 1.0, Ht * .2, 14), robe2, 0, sh - Ht * .05, 0, Math.PI, 0, 0, 1, 1, .8);        // collar
  for (const s of [-1, 1]) {
    const Sh = J(g, s * W * 1.0, sh - r, 0, s > 0 ? -.3 : -.45, 0, s * (s > 0 ? .7 : .85));
    A(Sh, cyl(r * 1.2, r * 1.6, S.torso * .5), robe, 0, -S.torso * .25, 0);
    const El = J(Sh, 0, -S.torso * .5, 0, s > 0 ? -.9 : -.9, 0, 0);
    A(El, cyl(r * 1.4, r * 2.1, S.torso * .5), robe, 0, -S.torso * .22, 0); A(El, tor(r * 2.05, r * .35), trim, 0, -S.torso * .47, 0, Math.PI / 2);
    const H = J(El, 0, -S.torso * .56, 0); hand(H, r, mat('#e8b48a'));
    if (s > 0) { const L = (sh + R * 2) * 1.02 * (S.weap * .2 + .8), B = J(H, 0, 0, 0, .95, 0, -.5);
      A(B, cyl(.022, .03, L, 7), wood, 0, L * .12, 0); A(B, tor(.11, .024, Math.PI * 1.5), wood, .0, L * .62 + .1, 0, 0, 0, -.6);
      A(B, fac(new THREE.OctahedronGeometry(.085)), mat('#7fe9ff', 1), 0, L * .62 + .1, 0, 0, .4, 0, 1, 1.5, 1); A(B, fac(new THREE.OctahedronGeometry(.11)), mat('#2aa7d8'), 0, L * .62 + .1, 0, 0, .4, 0, .8, 1.25, .8); }
    else { A(H, sph(.11), mat('#ffb347', 1), 0, -.2, .05); A(H, sph(.15), mat('#ff7a2a'), 0, -.2, .05, 0, 0, 0, 1, 1, 1, false).material = new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: .35 });
      for (let i = 0; i < 5; i++) A(H, fac(new THREE.OctahedronGeometry(.03)), mat('#ffd98a', 1), Math.cos(i * 1.26) * .22, -.2 + Math.sin(i * 2.1) * .1, .05 + Math.sin(i * 1.26) * .22); }
  }
  A(g, cyl(R * .38, R * .42, R * .5), mat('#e0ac86'), 0, sh + R * .25, 0); const Hd = J(g, 0, sh + R * 1.2, 0, 0, .22, .05); face(Hd, R, { skin: '#e0ac86', iris: '#6a4bc9', hair: '#f1ece0', brow: -.1, brow2: .3, mouth: 'grin', nose: '#cf9070' });
  A(Hd, cone(R * .7, R * 1.9, 9), wh, 0, -R * 1.25, R * .5, Math.PI + .28, 0, 0, 1, 1, .6); for (const s of [-1, 1]) { A(Hd, sph(R * .32), wh, s * R * .42, -R * .5, R * .78, 0, 0, s * .5, 1.3, .6, .6); A(Hd, sph(R * .4), wh, s * R * .92, R * .1, -R * .1, 0, 0, 0, .5, 1.1, 1); }
  const Hat = J(Hd, 0, R * .55, -R * .05, -.16, 0, .1); A(Hat, cyl(R * 2.0, R * 2.1, R * .09, 18), robe2, 0, 0, 0); A(Hat, tor(R * 2.05, R * .06), trim, 0, 0, 0, Math.PI / 2);
  A(Hat, cyl(R * .72, R * 1.05, R * .9, 14), robe, 0, R * .45, 0); A(Hat, cyl(R * 1.04, R * 1.07, R * .2, 14), trim, 0, R * .14, 0);
  const T1 = J(Hat, 0, R * .88, 0, -.35, 0, .25); A(T1, cyl(R * .4, R * .72, R * .8, 12), robe, 0, R * .38, 0); const T2 = J(T1, 0, R * .76, 0, -.6, 0, .35); A(T2, cone(R * .4, R * 1.0, 10), robe, 0, R * .48, 0); A(T2, fac(new THREE.OctahedronGeometry(R * .16)), mat('#ffd98a', 1), 0, R * 1.05, 0);
  return g;
}
function wolf() {
  const g = new THREE.Group(), fur = mat('#7d6b5a'), fur2 = mat('#cdbb9c'), dk = mat('#3a2e26'), k = S.limb / .085, hs = S.head / .155, hh = .62;
  const B = J(g, 0, hh, 0, 0, 0, 0);
  A(B, lathe([[.01, -.62], [.2, -.55], [.25, -.3], [.2, -.02], [.3, .3], [.27, .5], [.15, .62], [.01, .66]], 14), fur, 0, 0, 0, Math.PI / 2, 0, 0, 1, 1, 1);
  A(B, sph(.22), fur2, 0, -.08, .28, 0, 0, 0, .9, .8, 1.3); for (let i = 0; i < 5; i++) A(B, cone(.07, .22, 5), dk, 0, .27 - i * .012, .4 - i * .16, -.5);   // chest ruff, back mane
  for (const [x, z, f] of [[-1, .36, 1], [1, .36, 1], [-1, -.42, 0], [1, -.42, 0]]) {
    const L = J(g, x * .17, hh - .05, z, f ? (x > 0 ? -.35 : .2) : (x > 0 ? .3 : -.3), 0, 0);
    A(L, sph(.12 * k), fur, 0, -.08, 0, 0, 0, 0, 1, f ? 1.7 : 2.0, f ? 1.25 : 1.8);
    const Kn = J(L, 0, -.3, f ? 0 : -.06, f ? .25 : .7, 0, 0); A(Kn, cyl(.075 * k, .055 * k, .32, 8), fur, 0, -.15, 0); A(Kn, sph(.08 * k), fur2, 0, -.31, .05, 0, 0, 0, 1.2 * S.foot / 1.5, .7, 1.6 * S.foot / 1.5);
  }
  const N = J(B, 0, .12, .52, -.55, 0, 0); A(N, cyl(.14, .22, .36, 12), fur, 0, .14, 0);
  const H = J(N, 0, .34, .02, .7, .25, 0), R = .2 * hs; A(H, sph(R), fur, 0, 0, 0, 0, 0, 0, 1, .9, 1.05);
  A(H, cyl(R * .3, R * .6, R * 1.1, 10), fur2, 0, -R * .2, R * 1.2, Math.PI / 2 + .1); A(H, sph(R * .2), dk, 0, -R * .1, R * 1.78);
  const Jw = J(H, 0, -R * .45, R * .55, .35, 0, 0); A(Jw, cyl(R * .2, R * .45, R * .95, 8), dk, 0, 0, R * .5, Math.PI / 2); for (const s of [-1, 1]) { A(Jw, cone(R * .07, R * .28, 5), mat('#fbf7ee'), s * R * .2, R * .14, R * .85); A(H, cone(R * .08, R * .32, 5), mat('#fbf7ee'), s * R * .24, -R * .5, R * 1.45, Math.PI); }
  const er = Math.min(R * .3, R * .16 * S.eye);
  for (const s of [-1, 1]) { A(H, sph(er), mat('#ffd34d', 1), s * R * .5, R * .22, R * .78, 0, s * .5, s * .3, 1.2, .75, .5); A(H, sph(er * .4), dk, s * R * .52, R * .22, R * .78 + er * .4, 0, 0, 0, .6, 1.2, .4, false);
    A(H, box(R * .5, R * .1, R * .12), dk, s * R * .48, R * .22 + er * .95, R * .8, 0, 0, -s * .5);
    A(H, cone(R * .32, R * .8, 4), fur, s * R * .55, R * .95, -R * .15, -.15, 0, -s * .25, 1, 1, .5); A(H, cone(R * .18, R * .5, 4), mat('#d99a8a'), s * R * .55, R * .9, -R * .09, -.15, 0, -s * .25, 1, 1, .4, false); }
  const T = J(B, 0, .12, -.6, -2.1, 0, 0); A(T, lathe([[.01, 0], [.07, .06], [.13, .3], [.1, .5], [.01, .66]], 10), fur, 0, 0, 0); A(T, cone(.09, .22, 8), fur2, 0, .58, 0);
  return g;
}
const W = 1100, H = 560, r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(W, H); r.setPixelRatio(1.5); r.outputColorSpace = THREE.SRGBColorSpace;
for (const t of TAKES) {
  S = t; uLine.value = t.line; mats.clear();
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#aeb9c6'); sc.add(new THREE.HemisphereLight('#ffffff', '#8a7a6a', 1.5)); const d = new THREE.DirectionalLight('#fff4e0', 2.6); d.position.set(-3, 5, 6); sc.add(d);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshBasicMaterial({ color: '#8fa07a' })); gr.rotation.x = -Math.PI / 2; sc.add(gr);
  [[knight, -1.5, .3], [wizard, .15, -.25], [wolf, 1.8, -1.05]].forEach(([f, x, ry]) => { const m = f(); m.position.x = x; m.rotation.y = ry; sc.add(m);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(f === wolf ? .75 : .5, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .22 })); sh.rotation.x = -Math.PI / 2; sh.position.set(x, .005, 0); sc.add(sh); });
  const box = document.createElement('div'); box.style.cssText = 'position:relative;width:' + W + 'px;margin:0 0 8px;display:flex;flex-wrap:wrap';
  for (const [w, h, pos, at, fov] of [[1100, 400, [0, 1.35, 7.2], [.1, .98, 0], 21], [550, 400, [-1.05, 1.5, 1.75], [-1.48, 1.4, 0], 27], [550, 400, [-.2, 1.47, 1.8], [.15, 1.4, 0], 27]]) {
    r.setSize(w, h); const cam = new THREE.PerspectiveCamera(fov, w / h, .1, 50); cam.position.set(...pos); cam.lookAt(...at); r.render(sc, cam);
    const im = new Image(); im.src = r.domElement.toDataURL(); im.style.cssText = 'display:block;width:' + w + 'px;height:' + h + 'px'; box.append(im);
  }
  const cp = document.createElement('div'); cp.style.cssText = 'position:absolute;left:16px;top:10px;font:700 30px Georgia,serif;color:#1a120c'; cp.innerHTML = t.name + '<div style="font:400 18px Georgia,serif">' + t.sub + '</div>'; box.append(cp); document.body.append(box);
}
window.__done = 1;
