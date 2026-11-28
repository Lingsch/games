// Character models for the MMO, designed from scratch in the approved style (see artkit/README.md, "Models").
// Each class is a function that builds a posed figure from joints (J) and pieces (A). bake() turns a figure into
// one geometry the game engine can animate. The sample page in artkit/samples/style-takes/ draws the same figures.
import * as THREE from '../../vendor/three.module.min.js';
// Three takes on one style: the same knight, wizard and wolf, designed from scratch, at three sets of proportions.
const C = { head: .19, torso: .52, leg: .62, sw: .29, limb: .1, hand: 1.6, foot: 1.7, eye: 1.15, pauld: 1.25, weap: 1.15, line: .015, facet: 1, sat: 1.05 };
const shade = (c, k) => '#' + new THREE.Color(c).multiplyScalar(k).getHexString();
const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 215, 215, 215, 255, 255, 255, 255, 255]), 4, 1); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
let S = { ...C, face: 2, hue: 0 }, INK = true; const uLine = { value: C.line };
export const setStyle = o => { if ('ink' in o) INK = o.ink; S = { ...S, ...o }; uLine.value = S.line; };
const tag = (p, o) => { o.userData.part = p; return o; };
const mats = new Map();
const mat = (c, glow) => { const k = c + (glow ? 'g' : '') + S.sat + '/' + S.hue; if (!mats.has(k)) { const col = new THREE.Color(c); const h = {}; col.getHSL(h); col.setHSL((S.hue && !glow && h.s > .3 && !(h.h > .028 && h.h < .14)) ? (h.h + S.hue + 1) % 1 : h.h, Math.min(1, h.s * S.sat), h.l); mats.set(k, glow ? new THREE.MeshBasicMaterial({ color: col }) : new THREE.MeshToonMaterial({ color: col, gradientMap: ramp })); } return mats.get(k); };
const ink = new THREE.MeshBasicMaterial({ color: '#1a120c', side: THREE.BackSide });
ink.onBeforeCompile = s => { s.uniforms.uLine = uLine; s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uLine;').replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += normalize(normal) * uLine;'); };
const fac = g => { if (!S.facet) return g; const n = g.toNonIndexed(); n.computeVertexNormals(); return n; };
const q = n => S.facet ? Math.max(4, Math.round(n * (S.det || .45))) : n;
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
  if (INK && line && !m.isMeshBasicMaterial) o.add(new THREE.Mesh(geo, ink)); return o;
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
  if (o.scar) A(p, box(R * .05, R * .62, R * .04), mat(shade(o.skin, 1.18)), -R * .5, R * .12, R * .78, 0, -.5, .28, 1, 1, 1, false);
}
function hand(p, r, m) { const k = r * S.hand; A(p, sph(k), m, 0, 0, 0, 0, 0, 0, .95, 1.1, 1); A(p, sph(k * .5), m, k * .7, k * .2, k * .5, 0, 0, 0, .8, 1.2, .8); }

function knight() {
  const g = new THREE.Group(), st = mat('#b9c4d6'), sd = mat('#74809a'), gold = mat('#e8bd4c'), red = mat('#b8241c'), lea = mat('#5c3b22'), r = S.limb, hip = S.leg, sh = hip + S.torso, R = S.head;
  for (const s of [-1, 1]) {
    const L = tag(s > 0 ? 2 : 1, J(g, s * S.sw * .45, hip, 0, s > 0 ? -.12 : .1, 0, s * .1)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -S.leg * .47, 0));
    A(L, cap(r * 1.15, S.leg * .3), sd, 0, -S.leg * .24, 0);
    A(Kn, cyl(r * 1.45, r * 1.05, S.leg * .42), st, 0, -S.leg * .23, 0);                           // greave
    A(Kn, sph(r * 1.5), st, 0, 0, r * .5, 0, 0, 0, 1, 1.1, .9); A(Kn, sph(r * .5), gold, 0, 0, r * 1.75);  // knee
    A(Kn, sph(r), st, 0, -S.leg * .53 + r * .62, r * .9, 0, 0, 0, 1.3 * S.foot, .85, 2.0 * S.foot);    // sabaton
  }
  const W = S.sw;
  A(g, lathe([[W * .5, 0], [W * .98, -.02], [W * 1.12, S.torso * .3], [W * .82, S.torso * .55], [W * 1.3, S.torso * .9], [W * 1.05, S.torso * 1.06], [W * .5, S.torso * 1.12]]), st, 0, hip, 0, 0, 0, 0, 1, 1, .72);   // breastplate
  A(g, tor(W * .98, r * .5), lea, 0, hip + S.torso * .34, 0, Math.PI / 2, 0, 0, 1, .74, 1); A(g, box(r * 1.6, r * 1.4, r * .5), gold, 0, hip + S.torso * .34, W * .74);
  for (let i = -2; i <= 2; i++) A(g, ext([[-.5, 0], [.5, 0], [.36, -1], [0, -1.25], [-.36, -1]], .12, .03), i % 2 ? sd : st, Math.sin(i * .62) * W * 1.0, hip + S.torso * .22, Math.cos(i * .62) * W * .74, .12, i * .62, 0, r * 2.3, S.leg * .34, r * 2);   // tassets
  A(g, ext([[-.5, 0], [.5, 0], [.5, -1], [0, -1.2], [-.5, -1]], .1, .02), red, 0, hip + S.torso * .98, W * .8, -.06, 0, 0, W * .95, S.torso * .9 + S.leg * .3, .2);   // tabard
  A(g, sph(W * .2), gold, 0, hip + S.torso * .62, W * .86, 0, 0, 0, 1, 1, .3); for (let i = 0; i < 8; i++) A(g, cone(W * .05, W * .16, 4), gold, Math.cos(i * .785) * W * .3, hip + S.torso * .62 + Math.sin(i * .785) * W * .3, W * .85, 0, 0, i * .785 - Math.PI / 2, 1, 1, .4);
  tag(15, A(g, ext([[-1, 0], [1, 0], [1.25, -1], [0, -1.12], [-1.25, -1]], .05, .01), red, 0, sh * .99, -W * .7, .14, 0, 0, W * .95, S.torso + S.leg * .62, 1));   // cape
  for (const s of [-1, 1]) {   // arms: right holds the sword out, left carries the shield
    const P = W * .34 * S.pauld, Sh = tag(s > 0 ? 4 : 3, J(g, s * (W * 1.12), sh, 0, s > 0 ? -.25 : -.3, 0, s * (s > 0 ? .75 : .5)));
    A(Sh, dome(P, .6), st, s * P * .1, P * .12, 0, 0, 0, -s * .3); A(Sh, tor(P * .98, P * .12), gold, s * P * .1, P * .12, 0, Math.PI / 2, 0, 0); A(Sh, dome(P * .72, .6), sd, s * P * .55, -P * .12, 0, 0, 0, -s * .75);
    A(Sh, cone(P * .22, P * .6, 6), gold, s * P * .1, P * 1.0, 0);
    A(Sh, cap(r * 1.05, S.torso * .3), sd, 0, -S.torso * .3, 0);
    const El = tag(s > 0 ? 14 : 13, J(Sh, 0, -S.torso * .56, 0, s > 0 ? -1.25 : -.9, 0, 0));
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
  const Hd = tag(5, J(g, 0, sh + R * 1.3, 0, .04, -.18, 0)); face(Hd, R, { skin: '#d9a47c', iris: '#3f7fd0', hair: '#4a2e18', brow: -.2, mouth: 'smirk', jaw: 1.18, stubble: '#b88a68', scar: 1 });
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
    const Sh = tag(s > 0 ? 4 : 3, J(g, s * W * 1.0, sh - r, 0, s > 0 ? -.3 : -.45, 0, s * (s > 0 ? .7 : .85)));
    A(Sh, cyl(r * 1.2, r * 1.6, S.torso * .5), robe, 0, -S.torso * .25, 0);
    const El = tag(s > 0 ? 14 : 13, J(Sh, 0, -S.torso * .5, 0, s > 0 ? -.9 : -.9, 0, 0));
    A(El, cyl(r * 1.4, r * 2.1, S.torso * .5), robe, 0, -S.torso * .22, 0); A(El, tor(r * 2.05, r * .35), trim, 0, -S.torso * .47, 0, Math.PI / 2);
    const H = J(El, 0, -S.torso * .56, 0); hand(H, r, mat('#e8b48a'));
    if (s > 0) { const L = (sh + R * 2) * 1.02 * (S.weap * .2 + .8), B = J(H, 0, 0, 0, .95, 0, -.5);
      A(B, cyl(.022, .03, L, 7), wood, 0, L * .12, 0); A(B, tor(.11, .024, Math.PI * 1.5), wood, .0, L * .62 + .1, 0, 0, 0, -.6);
      A(B, fac(new THREE.OctahedronGeometry(.085)), mat('#7fe9ff', 1), 0, L * .62 + .1, 0, 0, .4, 0, 1, 1.5, 1); A(B, fac(new THREE.OctahedronGeometry(.11)), mat('#2aa7d8'), 0, L * .62 + .1, 0, 0, .4, 0, .8, 1.25, .8); }
    else { A(H, sph(.11), mat('#ffb347', 1), 0, -.2, .05); A(H, sph(.15), mat('#ff7a2a'), 0, -.2, .05, 0, 0, 0, 1, 1, 1, false).material = new THREE.MeshBasicMaterial({ color: '#ff7a2a', transparent: true, opacity: .35 });
      for (let i = 0; i < 5; i++) A(H, fac(new THREE.OctahedronGeometry(.03)), mat('#ffd98a', 1), Math.cos(i * 1.26) * .22, -.2 + Math.sin(i * 2.1) * .1, .05 + Math.sin(i * 1.26) * .22); }
  }
  A(g, cyl(R * .38, R * .42, R * .5), mat('#e0ac86'), 0, sh + R * .25, 0); const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, 0, .22, .05)); face(Hd, R, { skin: '#e0ac86', iris: '#6a4bc9', hair: '#f1ece0', brow: -.1, brow2: .3, mouth: 'grin', nose: '#cf9070' });
  A(Hd, cone(R * .7, R * 1.9, 9), wh, 0, -R * 1.25, R * .5, Math.PI + .28, 0, 0, 1, 1, .6); for (const s of [-1, 1]) { A(Hd, sph(R * .32), wh, s * R * .42, -R * .5, R * .78, 0, 0, s * .5, 1.3, .6, .6); A(Hd, sph(R * .4), wh, s * R * .92, R * .1, -R * .1, 0, 0, 0, .5, 1.1, 1); }
  const Hat = J(Hd, 0, R * .55, -R * .05, -.16, 0, .1); A(Hat, cyl(R * 2.0, R * 2.1, R * .09, 18), robe2, 0, 0, 0); A(Hat, tor(R * 2.05, R * .06), trim, 0, 0, 0, Math.PI / 2);
  A(Hat, cyl(R * .72, R * 1.05, R * .9, 14), robe, 0, R * .45, 0); A(Hat, cyl(R * 1.04, R * 1.07, R * .2, 14), trim, 0, R * .14, 0);
  const T1 = J(Hat, 0, R * .88, 0, -.35, 0, .25); A(T1, cyl(R * .4, R * .72, R * .8, 12), robe, 0, R * .38, 0); const T2 = J(T1, 0, R * .76, 0, -.6, 0, .35); A(T2, cone(R * .4, R * 1.0, 10), robe, 0, R * .48, 0); A(T2, fac(new THREE.OctahedronGeometry(R * .16)), mat('#ffd98a', 1), 0, R * 1.05, 0);
  return g;
}
function legsOf(g, W, r, hip, thigh, boot, cuff, lean = 0) {
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * W * .46, hip, 0, (s > 0 ? .14 : -.12) + lean * s, 0, s * .09)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -S.leg * .45, 0));
    A(L, cap(r * 1.08, S.leg * .32), thigh, 0, -S.leg * .25, 0); A(Kn, cyl(r * 1.28, r * .98, S.leg * .48), boot, 0, -S.leg * .23, 0);
    A(Kn, tor(r * 1.28, r * .26), cuff, 0, 0, 0, Math.PI / 2); A(Kn, sph(r), boot, 0, -S.leg * .55 + r * .6, r * .8, 0, 0, 0, 1.2 * S.foot, .8, 1.9 * S.foot); }
}
function armsOf(g, W, r, sh, up, fore, hm, pose) {
  const out = {};
  for (const s of [-1, 1]) { const p = pose[s], Sh = tag(s > 0 ? 4 : 3, J(g, s * W * 1.06, sh - r * .3, 0, p[0], 0, s * p[1]));
    A(Sh, sph(r * 1.3), up); A(Sh, cap(r, S.torso * .3), up, 0, -S.torso * .28, 0);
    const El = tag(s > 0 ? 14 : 13, J(Sh, 0, -S.torso * .54, 0, p[2], 0, 0)); A(El, sph(r * 1.05), up); A(El, cyl(r * .95, r * 1.15, S.torso * .42), fore, 0, -S.torso * .25, 0); A(El, tor(r * 1.15, r * .2), up, 0, -S.torso * .44, 0, Math.PI / 2);
    const H = J(El, 0, -S.torso * .54, 0); hand(H, r, hm); out[s] = H; }
  return out;
}
function archer() {
  const g = new THREE.Group(), grn = mat('#3f7a3a'), grn2 = mat('#2a552b'), lea = mat('#8a5a32'), lea2 = mat('#4a2f1a'), tan = mat('#cdb07a'), wood = mat('#6b4526'), wh = mat('#f1ece0'), red = mat('#b8241c'), r = S.limb * .84, hip = S.leg, sh = hip + S.torso, R = S.head * .96, W = S.sw * .8;
  legsOf(g, W, r, hip, tan, lea2, lea);
  A(g, lathe([[W * 1.3, -S.leg * .3], [W * 1.02, .02], [W * .5, .03]]), grn, 0, hip, 0, 0, 0, 0, 1, 1, .76);                      // tunic skirt
  A(g, lathe([[W * .5, 0], [W * 1.0, 0], [W * .9, S.torso * .35], [W * .8, S.torso * .55], [W * 1.1, S.torso * .9], [W * .9, S.torso * 1.04], [W * .4, S.torso * 1.1]]), lea, 0, hip, 0, 0, 0, 0, 1, 1, .72);
  A(g, tor(W * .93, r * .45), lea2, 0, hip + S.torso * .3, 0, Math.PI / 2, 0, 0, 1, .74, 1); A(g, box(r * 1.3, r * 1.2, r * .4), mat('#e8bd4c'), 0, hip + S.torso * .3, W * .7); A(g, box(r * 2, r * 2.2, r * 1.2), lea2, -W * .85, hip + S.torso * .16, W * .3, 0, -.6, 0);
  A(g, box(r * .7, S.torso * 1.25, r * .3), lea2, 0, hip + S.torso * .68, W * .7, 0, 0, .72);                                       // quiver strap
  const Q = J(g, W * .45, hip + S.torso * .8, -W * .9, .1, 0, -.45); A(Q, cyl(r * 1.0, r * .8, S.torso * .95, 8), lea2); A(Q, tor(r * 1.0, r * .18), mat('#e8bd4c'), 0, S.torso * .45, 0, Math.PI / 2);
  for (let i = 0; i < 4; i++) { const x = (i % 2 - .5) * r * .8, z = (i > 1 ? .4 : -.4) * r; A(Q, cyl(.008, .008, S.torso * .5, 5), wood, x, S.torso * .6, z); A(Q, cone(r * .28, r * .9, 4), i % 2 ? red : wh, x, S.torso * .82, z, Math.PI, 0, 0, 1, 1, .3); }
  tag(15, A(g, ext([[-1, 0], [1, 0], [1.2, -1], [.4, -1.1], [0, -.95], [-.5, -1.12], [-1.2, -1]], .05, .01), grn2, 0, sh * .99, -W * .75, .12, 0, 0, W * .95, S.torso + S.leg * .5, 1));   // cloak
  A(g, cone(W * 1.35, S.torso * .34, 12), grn2, 0, sh - S.torso * .08, 0, Math.PI, 0, 0, 1, 1, .8);                                 // mantle
  const hs = armsOf(g, W, r, sh, grn, lea2, mat('#e2b08c'), { '-1': [-1.35, .25, -.1], '1': [-.15, .35, -1.1] });
  const Bw = J(hs[-1], 0, 0, 0, 1.45, 0, 0), bl = .6 * S.weap; A(Bw, tor(bl, .02, Math.PI * .8), wood, 0, 0, -bl, 0, -Math.PI / 2, -1.257); A(Bw, cyl(.005, .005, bl * 1.9, 4), wh, 0, 0, -bl * .69); A(Bw, cyl(.03, .03, .14, 6), lea2, 0, 0, 0);
  const Ar = J(hs[1], 0, 0, 0, 2.7, 0, .2); A(Ar, cyl(.009, .009, .7, 5), wood, 0, .2, 0); A(Ar, cone(.03, .09, 4), mat('#dfe6f0'), 0, .58, 0); A(Ar, cone(.04, .14, 4), red, 0, -.1, 0, Math.PI, 0, 0, 1, 1, .3);
  A(g, cyl(R * .36, R * .4, R * .5), mat('#e2b08c'), 0, sh + R * .25, 0);
  const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, 0, -.3, 0)); face(Hd, R, { skin: '#e2b08c', iris: '#3a8a4a', hair: '#8a3a1c', brow: -.14, mouth: 'smirk', jaw: .9 });
  A(Hd, dome(R * 1.0, .5), mat('#8a3a1c'), 0, R * .36, -R * .06, -.3); for (const s of [-1, 1]) A(Hd, sph(R * .3), mat('#8a3a1c'), s * R * .62, R * .55, R * .55, 0, 0, s * .5, 1, .7, .6);   // hair
  A(Hd, sph(R * .7), grn2, 0, -R * .75, -R * .85, 0, 0, 0, 1.3, .7, 1); A(Hd, sph(R * .55), mat('#8a3a1c'), 0, R * .1, -R * .7, 0, 0, 0, 1, 1.2, 1); A(Hd, cone(R * .3, R * 1.3, 6), mat('#8a3a1c'), 0, -R * .6, -R * 1.15, .5, 0, 0, 1, 1, .7); A(Hd, tor(R * .93, R * .07), grn, 0, R * .62, -R * .05, Math.PI / 2 - .2);                                                       // hood
  A(Hd, cyl(.012, .012, R * 1.1, 4), red, R * .7, R * 1.25, -R * .3, 0, 0, -.5); A(Hd, cone(R * .16, R * .5, 4), red, R * .98, R * 1.72, -R * .3, 0, 0, -.5, 1, 1, .3);                  // feather
  return g;
}
function rogue() {
  const g = new THREE.Group(), dkl = mat('#3b3644'), dk2 = mat('#27232e'), pur = mat('#6b4a94'), steel = mat('#cfd6e2'), gold = mat('#c9a04a'), cloth = mat('#7a1e28'), r = S.limb * .88, hip = S.leg * .94, sh = hip + S.torso * .96, R = S.head * .97, W = S.sw * .86;
  legsOf(g, W * 1.25, r, hip, dkl, dk2, pur, .12);
  const T = J(g, 0, hip, 0, .22, .1, 0);                                                                                              // leaning in
  A(T, lathe([[W * .5, 0], [W * 1.0, 0], [W * .9, S.torso * .35], [W * .8, S.torso * .55], [W * 1.14, S.torso * .9], [W * .92, S.torso * 1.04], [W * .4, S.torso * 1.1]]), dkl, 0, 0, 0, 0, 0, 0, 1, 1, .72);
  A(T, tor(W * .93, r * .5), cloth, 0, S.torso * .3, 0, Math.PI / 2, 0, 0, 1, .74, 1); A(T, ext([[-.5, 0], [.5, 0], [.3, -1], [-.2, -1.1]], .08, .02), cloth, -W * .55, S.torso * .3, W * .6, -.1, -.4, 0, r * 1.6, S.leg * .5, .2);
  A(T, box(r * .7, S.torso * 1.3, r * .3), dk2, 0, S.torso * .7, W * .72, 0, 0, -.72); for (let i = 0; i < 3; i++) A(T, ext([[-.02, 0], [.02, 0], [.025, .1], [0, .16], [-.025, .1]], .01, .003), steel, W * (.42 - i * .34), S.torso * (.98 - i * .25), W * .78, 0, 0, 2.4);
  for (const s of [-1, 1]) A(T, dome(W * .42, .55), dk2, s * W * 1.02, S.torso * .98, 0, 0, 0, -s * .5);                                // shoulder caps
  A(T, cone(W * 1.2, S.torso * .3, 10), dk2, 0, S.torso * .98, 0, Math.PI, 0, 0, 1, 1, .8);                                              // cowl
  const hs = armsOf(T, W, r, S.torso * 1.02, dkl, dk2, mat('#8f6344'), { '-1': [-.9, .55, -.9], '1': [-.4, .7, -1.3] });
  for (const s of [-1, 1]) { const D = J(hs[s], 0, 0, 0, s > 0 ? 1.5 : 1.9, 0, s * -.5), w = S.weap;
    A(D, ext([[-.035, 0], [.04, 0], [.055, .2], [.03, .36], [-.03, .42], [-.012, .2]], .014, .005), steel, 0, .07 * w, 0, 0, 0, 0, w, w, w); A(D, box(.13 * w, .025 * w, .04 * w), gold, 0, .06 * w, 0); A(D, cyl(.02 * w, .022 * w, .13 * w, 6), cloth, 0, -.01 * w, 0); A(D, sph(.03 * w), gold, 0, -.09 * w, 0); }
  A(T, cyl(R * .36, R * .4, R * .5), mat('#8f6344'), 0, S.torso * 1.04 + R * .2, 0);
  const Hd = tag(5, J(T, 0, S.torso * 1.04 + R * 1.15, 0, -.18, .3, 0)); face(Hd, R, { skin: '#8f6344', iris: '#c9a04a', hair: '#17151a', brow: -.3, mouth: 'stern', jaw: 1.0 });
  A(Hd, dome(R * 1.06, .5), cloth, 0, -R * .02, R * .02, Math.PI, 0, 0, .93, 1.06, 1.02); A(Hd, sph(R * .21), cloth, 0, -R * .24, R * 1.0, 0, 0, 0, 1.2, 1.05, 1.15, false); A(Hd, tor(R * .97, R * .05), dk2, 0, -R * .02, R * .02, Math.PI / 2, 0, 0, .93, 1.02, 1);                                       // mask over nose and mouth
  A(Hd, dome(R * 1.2, .6), dk2, 0, R * .3, -R * .16, -.38); A(Hd, cone(R * .42, R * .9, 6), dk2, 0, R * 1.05, -R * 1.1, -1.9);                                                       // hood
  for (const s of [-1, 1]) A(Hd, ext([[-.5, 0], [.5, 0], [.2, -1]], .04, .01), cloth, s * R * .25 - R * .9, -R * .4, -R * .7, .3, 0, s * .3 - .5, R * .4, R * 1.2, 1);                 // mask ties
  return g;
}
const robeOf = (g, W, Ht, m) => A(g, lathe([[W * 1.75, 0], [W * 1.55, Ht * .1], [W * 1.05, Ht * .55], [W * .86, Ht * .66], [W * 1.12, Ht * .9], [W * .9, Ht * .99], [W * .4, Ht * 1.03]]), m, 0, 0, 0, 0, 0, 0, 1, 1, .82);
const feetOf = (g, W, r, m) => { for (const s of [-1, 1]) A(g, sph(r), m, s * W * .5, r * .5, W * .9, 0, 0, 0, 1.2 * S.foot, .8, 1.9 * S.foot); };
function cleric() {
  const g = new THREE.Group(), wh = mat('#efe9da'), wh2 = mat('#d2c8b0'), gold = mat('#e8bd4c'), red = mat('#a8281e'), wood = mat('#6b4526'), sk = '#7c4c30', r = S.limb * .9, hip = S.leg, sh = hip + S.torso, R = S.head * .97, W = S.sw * .9, Ht = sh;
  robeOf(g, W, Ht, wh); A(g, tor(W * 1.72, r * .5), gold, 0, r * .5, 0, Math.PI / 2, 0, 0, 1, .82, 1); feetOf(g, W, r, mat('#5a3a22'));
  for (const s of [-1, 1]) { A(g, box(r * 1.35, Ht * .7, .03), red, s * W * .34, Ht * .6, W * .84, -.12, 0, s * .03); A(g, box(r * 1.35, r * .5, .035), gold, s * W * .36, Ht * .3, W * .97, -.12); A(g, cone(r * .5, r * 1.2, 4), gold, s * W * .37, Ht * .2, W * 1.0, Math.PI, 0, 0, 1, 1, .3); }
  A(g, tor(W * .9, r * .45), gold, 0, Ht * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1);
  A(g, cone(W * 1.55, S.torso * .55, 14), wh2, 0, sh - S.torso * .1, 0, 0, 0, 0, 1, 1, .82); A(g, tor(W * 1.5, r * .28), gold, 0, sh - S.torso * .36, 0, Math.PI / 2, 0, 0, 1, .82, 1);
  A(g, sph(W * .22), gold, 0, sh - S.torso * .2, W * .95, 0, 0, 0, 1, 1, .35); for (let i = 0; i < 8; i++) A(g, cone(W * .05, W * .16, 4), gold, Math.cos(i * .785) * W * .32, sh - S.torso * .2 + Math.sin(i * .785) * W * .32, W * .94, 0, 0, i * .785 - Math.PI / 2, 1, 1, .4);
  const hs = armsOf(g, W, r, sh, wh, wh2, mat(sk), { '-1': [-.55, .3, -1.05], '1': [-.3, .65, -.95] });
  const B = J(hs[1], 0, 0, 0, .95, 0, -.55), L = (sh + R * 2) * 1.0; A(B, cyl(.022, .028, L, 7), wood, 0, L * .12, 0); A(B, tor(.12, .022, Math.PI * 1.2), gold, .12, L * .62, 0, 0, 0, .3);
  A(B, cyl(.006, .006, .12, 4), gold, .23, L * .62 - .02, 0); A(B, box(.11, .14, .11), gold, .23, L * .62 - .15, 0); A(B, sph(.06), mat('#ffe9a0', 1), .23, L * .62 - .15, 0, 0, 0, 0, 1, 1.1, 1); A(B, cone(.08, .07, 4), gold, .23, L * .62 - .05, 0, 0, .785);
  const Bk = J(hs[-1], 0, -.04, .05, 1.3, .2, 0); A(Bk, box(.2, .26, .06), red); A(Bk, box(.18, .24, .065), mat('#f6f1e4'), .012, 0, 0); A(Bk, sph(.035), gold, 0, 0, .04, 0, 0, 0, 1, 1, .4);
  A(g, cyl(R * .36, R * .4, R * .5), mat(sk), 0, sh + R * .25, 0);
  const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, 0, .15, 0)); face(Hd, R, { skin: sk, iris: '#5a3a22', hair: '#c9c4bc', brow: .06, mouth: 'grin', jaw: .92 });
  A(Hd, dome(R * 1.0, .5), mat('#c9c4bc'), 0, R * .36, -R * .06, -.3); A(Hd, sph(R * .42), mat('#c9c4bc'), 0, R * .5, -R * 1.0);
  for (const z of [.3, -.42]) A(Hd, ext([[-.62, 0], [.62, 0], [.66, .55], [0, 1.25], [-.66, .55]], .1, .02), wh, 0, R * .78, R * z, z > 0 ? -.08 : .12, 0, 0, R, R * 1.05, R);
  A(Hd, tor(R * .74, R * .09), gold, 0, R * .86, -R * .06, Math.PI / 2); A(Hd, sph(R * .16), gold, 0, R * 1.35, R * .38, 0, 0, 0, 1, 1, .4);
  return g;
}
function bladewarden() {
  const g = new THREE.Group(), stl = mat('#5d6676'), stl2 = mat('#3d4452'), lea = mat('#6a4226'), fur = mat('#8a7a66'), fur2 = mat('#5e5246'), gold = mat('#c9a04a'), blue = mat('#2f6fb8'), sk = '#c99670', r = S.limb * 1.08, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw * 1.08;
  legsOf(g, W, r, hip, lea, stl, gold);
  A(g, lathe([[W * .5, 0], [W * .98, -.02], [W * 1.1, S.torso * .3], [W * .84, S.torso * .55], [W * 1.32, S.torso * .9], [W * 1.05, S.torso * 1.06], [W * .5, S.torso * 1.12]]), stl, 0, hip, 0, 0, 0, 0, 1, 1, .74);
  A(g, tor(W * .98, r * .5), lea, 0, hip + S.torso * .32, 0, Math.PI / 2, 0, 0, 1, .76, 1); A(g, sph(r * .9), gold, 0, hip + S.torso * .32, W * .76, 0, 0, 0, 1, 1, .5);
  for (let i = -3; i <= 3; i++) A(g, ext([[-.5, 0], [.5, 0], [.4, -1], [0, -1.2], [-.4, -1]], .1, .02), i % 2 ? lea : blue, Math.sin(i * .5) * W * 1.02, hip + S.torso * .2, Math.cos(i * .5) * W * .78, .1, i * .5, 0, r * 1.7, S.leg * .5, r * 2);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; if (Math.cos(a) > .3) continue; A(g, sph(W * .42), i % 2 ? fur : fur2, Math.sin(a) * W * .95, sh + Math.cos(a * 2) * .01, Math.cos(a) * W * .62 - W * .05, 0, a, 0, 1, .7, 1); }
  { const P = W * .5; const Pg = J(g, -W * 1.2, sh + P * .25, 0, 0, 0, .35); A(Pg, dome(P, .6), stl2); A(Pg, tor(P * .98, P * .1), gold, 0, 0, 0, Math.PI / 2); for (const [x, z] of [[0, 0], [-.5, .3], [-.5, -.3]]) A(Pg, cone(P * .2, P * .7, 5), stl, x * P, P * (x ? .75 : 1.05), z * P, 0, 0, x ? .5 : 0); }
  const hs = armsOf(g, W, r, sh, mat(sk), stl, stl2, { '-1': [-.2, .35, -.55], '1': [-.25, .75, -1.25] });
  const Sw = J(hs[1], 0, 0, 0, 1.25, 0, -1.05), w = S.weap * 1.15;
  A(Sw, ext([[-.085, 0], [.085, 0], [.075, 1], [0, 1.14], [-.075, 1]], .022, .008), mat('#dfe6f0'), 0, .13 * w, 0, 0, 0, 0, w, w, w); A(Sw, box(.016 * w, .8 * w, .04 * w), stl, 0, .6 * w, 0);
  A(Sw, ext([[-.26, .04], [-.22, -.04], [.22, -.04], [.26, .04], [.1, .02], [-.1, .02]], .05, .01), gold, 0, .11 * w, 0, 0, 0, 0, w, w, w); A(Sw, cyl(.026 * w, .03 * w, .26 * w, 8), lea, 0, -.04 * w, 0); A(Sw, sph(.05 * w), gold, 0, -.19 * w, 0); A(Sw, sph(.03 * w), blue, 0, .12 * w, .03 * w, 0, 0, 0, 1, 1, .5);
  A(g, cyl(R * .42, R * .5, R * .5), mat(sk), 0, sh + R * .25, 0);
  const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, .08, 0, 0)); face(Hd, R, { skin: sk, iris: '#3f7fd0', hair: '#2e1c10', brow: -.3, mouth: 'stern', jaw: 1.2, stubble: '#3a2414', scar: 1 });
  A(Hd, box(R * 1.86, R * .2, R * .1), blue, 0, R * .2, R * .74, 0, 0, 0, 1, 1, 1, false);                                    // war paint across the eyes sits behind them
  A(Hd, dome(R * .7, .5), mat('#2e1c10'), 0, R * .62, -R * .1, -.2, 0, 0, .7, 1, 1.2); A(Hd, sph(R * .26), mat('#2e1c10'), 0, R * 1.3, -R * .5); A(Hd, tor(R * .16, R * .05), gold, 0, R * 1.14, -R * .4, 1.1); A(Hd, cone(R * .2, R * .9, 6), mat('#2e1c10'), 0, R * .9, -R * 1.0, -2.4);
  A(Hd, cone(R * .34, R * .9, 5), mat('#2e1c10'), 0, -R * 1.35, R * .45, Math.PI + .2, 0, 0, 1, 1, .6); A(Hd, tor(R * .12, R * .05), gold, 0, -R * 1.5, R * .5, Math.PI / 2);
  return g;
}
function warlock() {
  const g = new THREE.Group(), rb = mat('#3b2552'), rb2 = mat('#241634'), bone = mat('#e6dcc2'), grn = mat('#7dff6a', 1), grn2 = mat('#2f9a3a'), blk = mat('#1d1822'), wood = mat('#2e2018'), sk = '#b7a3b6', r = S.limb * .88, hip = S.leg, sh = hip + S.torso, R = S.head * .98, W = S.sw * .92, Ht = sh;
  robeOf(g, W, Ht, rb); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; A(g, cone(W * .34, Ht * .22, 4), rb2, Math.sin(a) * W * 1.6, Ht * .1, Math.cos(a) * W * 1.3, 0, a, 0, 1, 1, .5); } feetOf(g, W, r, blk);
  A(g, box(r * 1.2, Ht * .62, .03), rb2, 0, Ht * .52, W * .88, -.13); for (let i = 0; i < 4; i++) A(g, fac(new THREE.OctahedronGeometry(r * .32)), grn, 0, Ht * (.3 + i * .14), W * (1.0 - i * .045), 0, 0, 0, 1, 1.4, .4);
  A(g, tor(W * .9, r * .4), bone, 0, Ht * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1);
  { const Sk = J(g, W * .5, Ht * .62, W * .72, 0, .5, 0); A(Sk, sph(r * 1.1), bone, 0, 0, 0, 0, 0, 0, 1, 1.05, 1); A(Sk, sph(r * .6), bone, 0, -r * .8, r * .25, 0, 0, 0, 1, .7, 1); for (const s of [-1, 1]) A(Sk, sph(r * .3), blk, s * r * .42, 0, r * .85, 0, 0, 0, 1, 1.2, .5, false); }
  A(g, cone(W * 1.2, S.torso * .34, 10), rb2, 0, sh - S.torso * .06, 0, Math.PI, 0, 0, 1, 1, .8);
  for (const s of [-1, 1]) { const Pg = J(g, s * W * 1.12, sh + .02, 0, 0, 0, -s * .45); A(Pg, dome(W * .44, .6), blk); for (const [x, z] of [[0, 0], [.55, .3], [.55, -.3]]) A(Pg, cone(W * .1, W * .5, 5), bone, s * x * W * .44, W * (x ? .32 : .52), z * W * .44, 0, 0, -s * (x ? .6 : 0)); }
  const hs = armsOf(g, W, r, sh, rb, rb2, mat(sk), { '-1': [-.6, .75, -.85], '1': [-.3, .65, -.95] });
  const B = J(hs[1], 0, 0, 0, .95, 0, -.55), L = (sh + R * 2) * .98; A(B, cyl(.02, .03, L * .55, 6), wood, 0, -L * .1, 0); A(B, cyl(.02, .024, L * .5, 6), wood, .03, L * .4, 0, 0, 0, -.12);
  { const Sk = J(B, .06, L * .7, 0, -.9, 0, .5); A(Sk, sph(.085), bone, 0, 0, 0, 0, 0, 0, 1, 1.05, 1); A(Sk, sph(.05), bone, 0, -.065, .02, 0, 0, 0, 1, .7, 1); for (const s of [-1, 1]) { A(Sk, sph(.024), grn, s * .034, 0, .068, 0, 0, 0, 1, 1.2, .5); A(Sk, cone(.02, .16, 5), bone, s * .07, .09, 0, 0, 0, -s * .7); } }
  for (let i = 0; i < 3; i++) A(B, fac(new THREE.OctahedronGeometry(.04 - i * .008)), grn, .07 + i * .03, L * .7 + .16 + i * .09, 0, 0, 0, 0, 1, 1.6, 1);
  const Tm = J(hs[-1], 0, -.26, .08, 1.5, .3, 0); A(Tm, box(.3, .04, .22), blk, 0, 0, 0, 0, 0, 0); for (const s of [-1, 1]) A(Tm, box(.14, .02, .2), mat('#d6ffcf', 1), s * .072, .03, 0, 0, 0, s * .12); for (let i = 0; i < 5; i++) A(Tm, fac(new THREE.OctahedronGeometry(.02)), grn, Math.cos(i * 1.26) * .22, .14 + Math.sin(i * 2.2) * .06, Math.sin(i * 1.26) * .2);
  A(g, cyl(R * .34, R * .38, R * .5), mat(sk), 0, sh + R * .25, 0);
  const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, .1, -.2, 0)); face(Hd, R, { skin: sk, iris: '#2f9a3a', hair: '#1d1822', brow: -.34, mouth: 'grin', jaw: .88 });
  for (const s of [-1, 1]) A(Hd, sph(R * .05), grn, s * R * .36 - R * .02, R * .23, R * .9, 0, 0, 0, 1, 1, .5);
  A(Hd, cone(R * .22, R * .7, 5), blk, 0, -R * 1.3, R * .5, Math.PI + .25, 0, 0, 1, 1, .6);
  A(Hd, dome(R * 1.22, .6), rb2, 0, R * .3, -R * .16, -.38); A(Hd, cone(R * .45, R * 1.0, 6), rb2, 0, R * 1.0, -R * 1.15, -1.9);
  for (const s of [-1, 1]) { const Hn = J(Hd, s * R * .85, R * .95, -R * .1, 0, 0, -s * .9); A(Hn, cyl(R * .14, R * .2, R * .6, 6), bone, 0, R * .3, 0); const H2 = J(Hn, 0, R * .58, 0, 0, 0, s * .9); A(H2, cone(R * .14, R * .8, 6), bone, 0, R * .38, 0); }
  return g;
}
function druid() {
  const g = new THREE.Group(), hide = mat('#7a5a3a'), hide2 = mat('#5a4028'), moss = mat('#4f8a3a'), moss2 = mat('#2f6030'), wood = mat('#6b4a2a'), bone = mat('#e6dcc2'), gl = mat('#a8ff7a', 1), sk = '#c8926a', hair = '#6a4424', r = S.limb, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw;
  legsOf(g, W, r, hip, mat(sk), hide2, moss);
  A(g, lathe([[W * .5, 0], [W * 1.0, 0], [W * .92, S.torso * .35], [W * .82, S.torso * .55], [W * 1.14, S.torso * .9], [W * .92, S.torso * 1.04], [W * .4, S.torso * 1.1]]), hide, 0, hip, 0, 0, 0, 0, 1, 1, .74);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; A(g, ext([[-.5, 0], [.5, 0], [.34, -1], [0, -1.25], [-.3, -.9]], .08, .02), i % 2 ? hide2 : hide, Math.sin(a) * W * 1.0, hip + S.torso * .22, Math.cos(a) * W * .76, .12, a, 0, r * 2.1, S.leg * (.42 + (i % 3) * .06), r * 2); }
  A(g, tor(W * .96, r * .45), moss2, 0, hip + S.torso * .3, 0, Math.PI / 2, 0, 0, 1, .76, 1); A(g, sph(r * .8), bone, 0, hip + S.torso * .3, W * .76, 0, 0, 0, 1, 1, .5);
  const leaf = [[0, 0], [.5, -.45], [0, -1.3], [-.5, -.45]];
  for (let k = 0; k < 2; k++) for (let i = 0; i < 9; i++) { const a = (i + k * .5) / 9 * Math.PI * 2; A(g, ext(leaf, .04, .012), (i + k) % 2 ? moss : moss2, Math.sin(a) * W * (.95 - k * .2), sh + S.torso * (.02 + k * .08), Math.cos(a) * W * (.7 - k * .15), .75 - k * .2, a, 0, W * .8, S.torso * (.55 - k * .1), 1); }
  const hs = armsOf(g, W, r, sh, mat(sk), hide2, mat(sk), { '-1': [-.7, .7, -.8], '1': [-.3, .65, -.95] });
  const B = J(hs[1], 0, 0, 0, .95, 0, -.55), L = (sh + R * 2) * 1.02; A(B, cyl(.026, .036, L * .6, 6), wood, 0, -L * .08, 0); A(B, cyl(.022, .028, L * .45, 6), wood, .03, L * .42, 0, 0, 0, -.14);
  for (const s of [-1, 1]) A(B, cyl(.012, .02, .26, 5), wood, .07 + s * .07, L * .7, 0, 0, 0, -.14 - s * .55); A(B, sph(.07), gl, .1, L * .7 + .16, 0); A(B, sph(.1), moss, .1, L * .7 + .16, 0, 0, 0, 0, 1, 1, 1, false).material = new THREE.MeshBasicMaterial({ color: '#a8ff7a', transparent: true, opacity: .3 });
  for (const [x, y, rz] of [[-.04, .5, .9], [.1, .58, -.8], [-.02, .3, 1.1]]) A(B, ext(leaf, .02, .006), moss, x, L * y, 0, 0, 0, rz, .09, .12, 1);
  A(hs[-1], sph(.05), gl, 0, -.2, .04); for (let i = 0; i < 4; i++) A(hs[-1], ext(leaf, .01, .004), moss, Math.cos(i * 1.57) * .1, -.2 + i * .03, .04 + Math.sin(i * 1.57) * .1, 0, i * 1.57, .6, .07, .09, 1);
  A(g, cyl(R * .4, R * .46, R * .5), mat(sk), 0, sh + R * .25, 0);
  const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, .02, .28, 0)); face(Hd, R, { skin: sk, iris: '#3a8a4a', hair, brow: -.08, mouth: 'smirk', jaw: 1.05 });
  A(Hd, dome(R * 1.02, .5), mat(hair), 0, R * .36, -R * .08, -.35); A(Hd, sph(R * .6), mat(hair), 0, -R * .1, -R * .7, 0, 0, 0, 1.2, 1.4, .8);
  A(Hd, sph(R * .76), mat(hair), 0, -R * .62, R * .1, 0, 0, 0, 1.12, .7, 1.0); A(Hd, cone(R * .6, R * 1.7, 7), mat(hair), 0, -R * 1.4, R * .45, Math.PI + .22, 0, 0, 1, 1, .6); A(Hd, tor(R * .2, R * .07), moss, 0, -R * 1.9, R * .6, Math.PI / 2 + .2);
  for (const s of [-1, 1]) A(Hd, sph(R * .26), mat(hair), s * R * .34, -R * .42, R * .86, 0, 0, s * .5, 1.3, .55, .6);
  A(Hd, tor(R * .95, R * .08), hide2, 0, R * .62, -R * .05, Math.PI / 2 - .2);
  for (const s of [-1, 1]) { const An = J(Hd, s * R * .7, R * .9, -R * .1, -.15, 0, -s * .55); A(An, cyl(R * .07, R * .11, R * 1.0, 5), bone, 0, R * .5, 0); const A2 = J(An, 0, R * .95, 0, 0, 0, s * .7); A(A2, cone(R * .08, R * .9, 5), bone, 0, R * .42, 0); for (const [y, a] of [[.35, -1.0], [.7, -.8]]) A(An, cone(R * .06, R * .55, 5), bone, s * R * .2, R * y + R * .15, 0, 0, 0, s * a); }
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

export const CLASSES = { bulwark: knight, elem: wizard, archer, knifeshade: rogue, cleric, bladewarden, warlock, druid };
export { THREE, wolf, uLine };

// One geometry for the game engine: position, normal, colour, and for every vertex which joint moves it and where that joint is.
// Parts: 0 body, 1/2 thighs, 11/12 shins, 3/4 upper arms, 13/14 forearms and whatever they hold, 5 head, 15 cloak.
export function bake(root, k = 1.1) {
  root.scale.setScalar(k); root.updateMatrixWorld(true);
  const pos = [], nor = [], col = [], piv = [], pv2 = [], prt = [], glw = [], v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  const at = o => { const p = o.getWorldPosition(new THREE.Vector3()); return [p.x, p.y, p.z]; };
  root.traverse(o => {
    if (!o.isMesh || o.material === ink || o.material.transparent) return;
    let part = 0, pv = [0, 0, 0], p2 = null;
    if (o.userData.part !== undefined) { part = o.userData.part; pv = at(o); }
    else for (let a = o.parent, found = 0; a && a !== root.parent; a = a.parent) { const t = a.userData.part; if (t === undefined) continue;
      if (!found) { found = 1; part = t; if (t > 10 && t < 15) p2 = at(a); else { pv = at(a); break; } } else { pv = at(a); break; } }
    if (!p2) p2 = pv;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, N = g.attributes.normal, c = o.material.color, glow = o.material.isMeshBasicMaterial ? 1.4 : 0;
    nm.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); col.push(c.r, c.g, c.b); piv.push(pv[0], pv[1], pv[2]); pv2.push(p2[0], p2[1], p2[2]); prt.push(part); glw.push(glow); }
  });
  const g = new THREE.BufferGeometry(), f = (a, m) => new THREE.Float32BufferAttribute(a, m);
  g.setAttribute('position', f(pos, 3)); g.setAttribute('normal', f(nor, 3)); g.setAttribute('color', f(col, 3)); g.setAttribute('pivot', f(piv, 3)); g.setAttribute('pivot2', f(pv2, 3)); g.setAttribute('part', f(prt, 1)); g.setAttribute('glow', f(glw, 1));
  g.computeBoundingSphere(); return g;
}
