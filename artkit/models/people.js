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
const mat = (c, glow) => { if (S.pal && S.pal[c]) c = S.pal[c];
  if (S.ghost && !glow) { const q0 = new THREE.Color(c), l = Math.min(1, (q0.r + q0.g + q0.b) / 2.2); c = '#' + new THREE.Color('#3f6f90').lerp(new THREE.Color('#eafcff'), l).getHexString(); }
  const k = c + (glow ? 'g' : '') + S.sat + '/' + S.hue; if (!mats.has(k)) { const col = new THREE.Color(c); const h = {}; col.getHSL(h); col.setHSL((S.hue && !glow && h.s > .3 && !(h.h > .028 && h.h < .14)) ? (h.h + S.hue + 1) % 1 : h.h, Math.min(1, h.s * S.sat), h.l); mats.set(k, glow ? new THREE.MeshBasicMaterial({ color: col }) : new THREE.MeshToonMaterial({ color: col, gradientMap: ramp })); } return mats.get(k); };
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

function headGeo(jaw) {     // one smooth shape: tall skull, full square jaw, chin set forward. Never faceted.
  const g = new THREE.SphereGeometry(1, 22, 16), P = g.attributes.position;
  for (let i = 0; i < P.count; i++) { let x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    if (y < 0) { const t = -y, k = Math.pow(t, .72); x *= 1 + (jaw - 1) * t * .6 + .1 * Math.sin(t * Math.PI); y = -k * 1.02; z = z * (1 - .1 * t) + t * t * .2; }
    if (z > 0) z *= .96;
    P.setXYZ(i, x * .9, y * 1.14 + .1, z * .97); }
  g.computeVertexNormals(); return g;
}
const smooth = (r = 1) => new THREE.SphereGeometry(r, 12, 9);
function face(p, R, o) {
  const skin = mat(o.skin), sk2 = mat(shade(o.skin, .93)), dk = mat('#2a1c14'), wh = mat('#fbf7ee'), F = S.face, hair = mat(o.hair);
  A(p, headGeo(o.jaw || 1), skin, 0, 0, 0, 0, 0, 0, R, R, R);
  const er = R * (F === 2 ? .11 : F === 1 ? .125 : .165), ex = R * .36, ey = R * .22, ez = R * .8;
  for (const s of [-1, 1]) {
    if (F === 2) { A(p, sph(er), dk, s * ex, ey, ez + R * .04, 0, s * .2, -s * .1, 1.35, .8, .45, false); A(p, sph(er * .22), mat('#ffffff', 1), s * ex - er * .3, ey + er * .2, ez + R * .04 + er * .45, 0, 0, 0, 1, 1, .4, false); }
    else { A(p, sph(er), wh, s * ex, ey, ez, 0, s * .25, 0, 1.3, F === 1 ? .62 : .8, .45);
      A(p, sph(er * .6), mat(o.iris), s * ex * .97, ey, ez + er * .3, 0, 0, 0, 1, 1, .4, false); A(p, sph(er * .3), dk, s * ex * .96, ey, ez + er * .42, 0, 0, 0, 1, 1, .35, false);
      A(p, sph(er * .13), mat('#ffffff', 1), s * ex * .96 - er * .2, ey + er * .18, ez + er * .5, 0, 0, 0, 1, 1, .4, false); }
    A(p, smooth(er * 1.35), sk2, s * ex, ey + er * (F === 3 ? .78 : .62), ez - er * .15, 0, s * .25, -s * .14, 1.3, .5, .62, false);   // upper lid
    A(p, box(R * .5, R * .13, R * .17), hair, s * ex * 1.02, ey + er * 1.05 + R * .07, ez + R * .05, 0, s * .2, -s * o.brow + (s > 0 ? (o.brow2 || 0) : 0));
    A(p, smooth(R * .2), skin, s * R * .88, R * .04, -R * .05, 0, 0, 0, .45, 1.1, .75);                // ears
  }
  A(p, smooth(R * .1), skin, 0, R * .0, R * .9, -.2, 0, 0, .9, 2.6, 1.3, false);                     // bridge of the nose
  A(p, smooth(R * .16), mat(o.nose || shade(o.skin, .96)), 0, -R * .24, R * 1.0, 0, 0, 0, 1.15, .85, 1.05);
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

// ---- shared pieces for the rest of the cast
const torsoOf = (g, W, hip, m, z = .72) => A(g, lathe([[W * .5, 0], [W * 1.0, 0], [W * .92, S.torso * .35], [W * .82, S.torso * .55], [W * 1.14, S.torso * .9], [W * .92, S.torso * 1.04], [W * .4, S.torso * 1.1]]), m, 0, hip, 0, 0, 0, 0, 1, 1, z);
const headOf = (g, sh, R, o, rx = 0, ry = 0) => { A(g, cyl(R * .36, R * .42, R * .5), mat(o.skin), 0, sh + R * .25, 0); const Hd = tag(5, J(g, 0, sh + R * 1.2, 0, rx, ry, 0)); face(Hd, R, o); return Hd; };
const hairOf = (Hd, R, c, back = 0) => { A(Hd, dome(R * 1.02, .5), mat(c), 0, R * .36, -R * .08, -.32); if (back) A(Hd, sph(R * .6), mat(c), 0, -R * .15 * back, -R * .7, 0, 0, 0, 1.15, 1 + back * .45, .8); };
const beltOf = (g, W, y, r, m, bm) => { A(g, tor(W * .96, r * .45), m, 0, y, 0, Math.PI / 2, 0, 0, 1, .76, 1); if (bm) A(g, box(r * 1.3, r * 1.2, r * .4), bm, 0, y, W * .74); };
const capeOf = (g, W, sh, m, len = .5) => tag(15, A(g, ext([[-1, 0], [1, 0], [1.2, -1], [.4, -1.1], [0, -.95], [-.5, -1.12], [-1.2, -1]], .05, .01), m, 0, sh * .99, -W * .74, .12, 0, 0, W * .95, S.torso + S.leg * len, 1));
const beardOf = (Hd, R, c, len = 1) => { A(Hd, sph(R * .76), mat(c), 0, -R * .62, R * .1, 0, 0, 0, 1.12, .7, 1.0); if (len > 0) A(Hd, cone(R * .5, R * 1.2 * len, 6), mat(c), 0, -R * (1.0 + .4 * len), R * .42, Math.PI + .2, 0, 0, 1, 1, .6); for (const s of [-1, 1]) A(Hd, sph(R * .24), mat(c), s * R * .32, -R * .42, R * .86, 0, 0, s * .5, 1.3, .55, .6); };
function hat(Hd, R, kind, c1, c2 = '#e8bd4c') {
  const m = mat(c1), t = mat(c2);
  if (kind === 'straw') { A(Hd, cyl(R * 2.0, R * 2.15, R * .08, 12), m, 0, R * .62, 0, -.08); A(Hd, cyl(R * .8, R * 1.0, R * .6, 10), m, 0, R * .9, 0, -.08); A(Hd, tor(R * .98, R * .07), t, 0, R * .7, 0, Math.PI / 2 - .08); }
  else if (kind === 'cap') { A(Hd, dome(R * 1.08, .5), m, 0, R * .42, -R * .05, -.15); A(Hd, box(R * 1.2, R * .08, R * .7), m, 0, R * .5, R * .95, .15); }
  else if (kind === 'hood') { A(Hd, dome(R * 1.22, .6), m, 0, R * .3, -R * .16, -.38); A(Hd, cone(R * .45, R * 1.0, 6), m, 0, R * 1.0, -R * 1.15, -1.9); }
  else if (kind === 'tricorn') { A(Hd, cyl(R * 2.0, R * 2.0, R * .12, 3), m, 0, R * .66, 0, 0, Math.PI, 0); A(Hd, dome(R * 1.0, .5), m, 0, R * .66, 0); A(Hd, tor(R * 1.0, R * .07), t, 0, R * .74, 0, Math.PI / 2); }
  else if (kind === 'bandana') { A(Hd, dome(R * 1.05, .45), m, 0, R * .42, -R * .04, -.25); A(Hd, cone(R * .2, R * .9, 4), m, R * .6, R * .2, -R * 1.1, -2.2, 0, .4, 1, 1, .4); A(Hd, sph(R * .16), m, R * .4, R * .5, -R * .95); }
  else if (kind === 'helm' || kind === 'horned') { A(Hd, dome(R * 1.1, .5), m, 0, R * .5, -R * .04, -.1); A(Hd, tor(R * 1.07, R * .08), t, 0, R * .58, -R * .06, Math.PI / 2 - .1); A(Hd, box(R * .11, R * .42, R * .08), m, 0, R * .5, R * 1.0, -.1);
    if (kind === 'horned') for (const s of [-1, 1]) A(Hd, cone(R * .16, R * .9, 5), mat('#e6dcc2'), s * R * 1.0, R * 1.2, -R * .05, 0, 0, -s * .7); else A(Hd, cone(R * .14, R * .5, 5), t, 0, R * 1.75, -R * .04); }
  else if (kind === 'crown') { A(Hd, tor(R * .86, R * .1), t, 0, R * .84, -R * .05, Math.PI / 2); for (let i = 0; i < 6; i++) A(Hd, cone(R * .13, R * .5, 4), t, Math.sin(i * 1.047) * R * .86, R * 1.1, Math.cos(i * 1.047) * R * .86 - R * .05); A(Hd, sph(R * .12), m, 0, R * .88, R * .82); }
  else if (kind === 'tall') { A(Hd, cyl(R * 1.7, R * 1.75, R * .08, 12), m, 0, R * .66, 0, -.06); A(Hd, cyl(R * .9, R * .82, R * 1.3, 10), m, 0, R * 1.3, 0, -.06); A(Hd, tor(R * .86, R * .08), t, 0, R * .8, 0, Math.PI / 2 - .06); }
  else if (kind === 'feathers') { A(Hd, tor(R * .95, R * .09), m, 0, R * .62, -R * .05, Math.PI / 2 - .2); for (let i = -2; i <= 2; i++) A(Hd, cone(R * .2, R * 1.3, 4), i % 2 ? t : m, i * R * .42, R * 1.4 - Math.abs(i) * R * .12, -R * .3, -.25, 0, -i * .28, 1, 1, .35); }
  else if (kind === 'wrap') { A(Hd, sph(R * 1.12), m, 0, R * .62, -R * .08, 0, 0, 0, 1, .62, 1); A(Hd, tor(R * .98, R * .16), m, 0, R * .5, -R * .05, Math.PI / 2 - .25); A(Hd, sph(R * .15), t, 0, R * .62, R * .98); }
}
function hold(H, kind, side = 1, w = S.weap) {
  const st = mat('#dfe6f0'), sd = mat('#74809a'), gold = mat('#e8bd4c'), lea = mat('#5c3b22'), wood = mat('#6b4526');
  if (kind === 'staff' || kind === 'spear' || kind === 'fork' || kind === 'scepter') { const B = J(H, 0, 0, 0, .95, 0, -.55), L = 1.5; A(B, cyl(.022, .03, L, 6), wood, 0, L * .12, 0);
    if (kind === 'spear') A(B, cone(.05, .22, 4), st, 0, L * .62 + .1, 0); else if (kind === 'fork') { A(B, box(.2, .02, .02), sd, 0, L * .62, 0); for (const x of [-.09, 0, .09]) A(B, cone(.016, .2, 4), sd, x, L * .62 + .1, 0); } else A(B, sph(kind === 'scepter' ? .08 : .05), kind === 'scepter' ? gold : wood, 0, L * .62 + .04, 0); return B; }
  if (kind === 'lantern') { A(H, cyl(.006, .006, .14, 4), gold, 0, -.14, .02); A(H, box(.12, .16, .12), gold, 0, -.28, .02); A(H, sph(.066), mat('#ffe9a0', 1), 0, -.28, .02); return H; }
  if (kind === 'book') { const B = J(H, 0, -.04, .05, 1.3, .2, 0); A(B, box(.2, .26, .06), mat('#a8281e')); A(B, box(.18, .24, .065), mat('#f6f1e4'), .012, 0, 0); return B; }
  if (kind === 'shield' || kind === 'round') { const k = S.torso * .8 + .14, B = J(H, -S.limb * 1.5, 0, S.limb * .8, 1.25, .75, 0);
    if (kind === 'round') { A(B, cyl(k * .5, k * .5, .05, 12), wood, 0, 0, 0, Math.PI / 2); A(B, tor(k * .5, .025), sd, 0, 0, 0); A(B, sph(k * .14), sd, 0, 0, .04, 0, 0, 0, 1, 1, .6); }
    else { const sp = [[-.42, .5], [.42, .5], [.44, .05], [.3, -.32], [0, -.6], [-.3, -.32], [-.44, .05]]; A(B, ext(sp, .06, .02), sd, 0, 0, 0, 0, 0, 0, k, k, 1); A(B, sph(k * .12), gold, 0, k * .1, .05, 0, 0, 0, 1, 1, .5); } return B; }
  const B = J(H, 0, 0, 0, side > 0 ? 1.25 : 1.9, 0, side > 0 ? -1.05 : .5);
  const hilt = gw => { A(B, ext([[-gw, -.03], [-gw + .04, .04], [gw - .04, .04], [gw, -.03], [.06, -.02], [-.06, -.02]], .05, .01), gold, 0, .09 * w, 0, 0, 0, 0, w, w, w); A(B, cyl(.022 * w, .026 * w, .2 * w, 8), lea, 0, -.03 * w, 0); A(B, sph(.045 * w), gold, 0, -.15 * w, 0); };
  if (kind === 'sword') { A(B, ext([[-.055, 0], [.055, 0], [.045, .78], [0, .9], [-.045, .78]], .016, .006), st, 0, .1 * w, 0, 0, 0, 0, w, w, w); hilt(.2); }
  else if (kind === 'cutlass') { A(B, ext([[-.05, 0], [.05, 0], [.1, .4], [.06, .72], [-.06, .8], [-.02, .4]], .016, .006), st, 0, .1 * w, 0, 0, 0, 0, w, w, w); hilt(.14); }
  else if (kind === 'dagger') { A(B, ext([[-.04, 0], [.04, 0], [.03, .3], [0, .4], [-.03, .3]], .014, .005), st, 0, .08 * w, 0, 0, 0, 0, w, w, w); hilt(.1); }
  else if (kind === 'axe') { A(B, cyl(.022 * w, .026 * w, .9 * w, 6), wood, 0, .3 * w, 0); A(B, ext([[0, -.12], [.26, -.2], [.32, 0], [.26, .2], [0, .12]], .03, .01), sd, .01 * w, .66 * w, 0, 0, 0, 0, w, w, w); }
  else if (kind === 'club') { A(B, cyl(.08 * w, .03 * w, .85 * w, 7), wood, 0, .32 * w, 0); for (const y of [.5, .64]) A(B, tor(.07 * w, .014 * w), sd, 0, y * w, 0, Math.PI / 2); }
  else if (kind === 'hammer') { A(B, cyl(.024 * w, .028 * w, .9 * w, 6), wood, 0, .3 * w, 0); A(B, box(.3 * w, .18 * w, .18 * w), sd, 0, .72 * w, 0); }
  else if (kind === 'mace') { A(B, cyl(.022 * w, .026 * w, .7 * w, 6), sd, 0, .22 * w, 0); A(B, sph(.1 * w), sd, 0, .6 * w, 0); for (let i = 0; i < 6; i++) A(B, cone(.03 * w, .1 * w, 4), gold, Math.cos(i * 1.047) * .11 * w, .6 * w, Math.sin(i * 1.047) * .11 * w, 0, -i * 1.047, -Math.PI / 2); }
  else if (kind === 'crossbow') { A(B, box(.06, .5, .07), wood, 0, .2, 0); A(B, tor(.26, .018, Math.PI), sd, 0, .4, 0); A(B, cyl(.004, .004, .52, 4), mat('#f1ece0'), 0, .4, 0, 0, 0, Math.PI / 2); }
  return B;
}

// ---- the other eight classes
function wardancer() {
  const g = new THREE.Group(), red = mat('#b3262c'), red2 = mat('#7a1620'), gold = mat('#e8bd4c'), sk = '#c8946a', r = S.limb * .84, hip = S.leg, sh = hip + S.torso, R = S.head * .96, W = S.sw * .8;
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * W * .5, hip, 0, s > 0 ? .25 : -.2, 0, s * .16)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -S.leg * .45, 0));
    A(L, cyl(r * 1.2, r * 1.7, S.leg * .5), red, 0, -S.leg * .24, 0); A(Kn, cyl(r * 1.75, r * 1.0, S.leg * .4), red, 0, -S.leg * .18, 0); A(Kn, tor(r * 1.0, r * .25), gold, 0, -S.leg * .38, 0, Math.PI / 2); A(Kn, sph(r), mat(sk), 0, -S.leg * .55 + r * .6, r * .7, 0, 0, 0, 1.1 * S.foot, .7, 1.7 * S.foot); }
  torsoOf(g, W, hip, mat(sk)); A(g, lathe([[W * .84, S.torso * .52], [W * 1.2, S.torso * .9], [W * .97, S.torso * 1.05], [W * .42, S.torso * 1.12]]), red2, 0, hip, 0, 0, 0, 0, 1, 1, .76); A(g, tor(W * 1.0, r * .3), gold, 0, hip + S.torso * .66, 0, Math.PI / 2, 0, 0, 1, .74, 1);
  beltOf(g, W, hip + S.torso * .16, r * 1.3, gold); for (const s of [-1, 1]) tag(15, A(g, ext([[-.5, 0], [.5, 0], [.7, -1], [0, -1.2], [-.3, -.9]], .03, .01), red2, s * W * .7, hip + S.torso * .16, -W * .5, .25, s * .5, 0, W * .7, S.leg * .9, 1));
  A(g, ext([[-.5, 0], [.5, 0], [.3, -1], [0, -1.15], [-.3, -1]], .05, .015), red2, 0, hip + S.torso * .16, W * .76, -.08, 0, 0, W * .6, S.leg * .7, .2);
  const hs = armsOf(g, W, r, sh, mat(sk), gold, mat(sk), { '-1': [-1.0, .9, -.5], '1': [-.2, 1.0, -1.5] });
  for (const s of [-1, 1]) { const B = J(hs[s], 0, 0, 0, s > 0 ? 1.4 : 2.2, 0, s * -.4), w = S.weap; A(B, ext([[-.04, 0], [.045, 0], [.12, .45], [.1, .8], [-.02, .95], [.0, .45]], .014, .005), mat('#dfe6f0'), 0, .08 * w, 0, 0, 0, 0, w, w, w); A(B, sph(.05 * w), gold, 0, .07 * w, 0, 0, 0, 0, 1.6, .6, 1); A(B, cyl(.02 * w, .024 * w, .16 * w, 6), red2, 0, -.02 * w, 0); A(B, tor(.035 * w, .012 * w), gold, 0, -.13 * w, 0); }
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#5a3a22', hair: '#1a1210', brow: -.2, mouth: 'smirk', jaw: .9 }, 0, -.25); hairOf(Hd, R, '#1a1210');
  A(Hd, tor(R * .97, R * .07), gold, 0, R * .6, -R * .05, Math.PI / 2 - .2); A(Hd, sph(R * .1), mat('#ff5a4a', 1), 0, R * .62, R * .93); A(Hd, sph(R * .3), mat('#1a1210'), 0, R * .9, -R * .8); const P = tag(15, J(Hd, 0, R * .9, -R * .9, .5, 0, 0)); A(P, cone(R * .26, R * 2.6, 6), mat('#1a1210'), 0, -R * 1.2, 0, Math.PI); A(P, tor(R * .16, R * .06), gold, 0, -R * .4, 0, Math.PI / 2);
  return g;
}
function monk() {
  const g = new THREE.Group(), saf = mat('#e08a1e'), saf2 = mat('#a85a12'), rope = mat('#d9c8a0'), sk = '#d2a074', r = S.limb, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw * .95;
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * W * .5, hip, 0, s > 0 ? -.5 : .35, 0, s * .12)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -S.leg * .45, 0, s > 0 ? .7 : .1, 0, 0));
    A(L, cyl(r * 1.2, r * 1.5, S.leg * .5), saf2, 0, -S.leg * .24, 0); A(Kn, cyl(r * 1.5, r * .9, S.leg * .34), saf2, 0, -S.leg * .15, 0); for (let i = 0; i < 3; i++) A(Kn, tor(r * .82, r * .12), rope, 0, -S.leg * (.34 + i * .05), 0, Math.PI / 2); A(Kn, sph(r), mat(sk), 0, -S.leg * .55 + r * .6, r * .7, 0, 0, 0, 1.15 * S.foot, .7, 1.8 * S.foot); }
  torsoOf(g, W, hip, mat(sk)); A(g, lathe([[W * 1.25, -S.leg * .25], [W * 1.02, .02], [W * .96, S.torso * .4], [W * .5, S.torso * .42]]), saf, 0, hip, 0, 0, 0, 0, 1, 1, .78);
  A(g, ext([[-.5, 0], [.62, 0], [.2, 1.5], [-.2, 1.5]], .3, .04), saf, -W * .1, hip + S.torso * .3, 0, 0, 0, -.55, W * 1.1, S.torso * .62, W * 2.6);                // sash over one shoulder
  beltOf(g, W, hip + S.torso * .32, r * 1.2, rope); A(g, cyl(r * .3, r * .3, S.leg * .5, 5), rope, W * .5, hip + S.torso * .1, W * .7, 0, 0, .1);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; A(g, sph(r * .34), mat('#6b4526'), Math.sin(a) * W * .62, sh - S.torso * .14 - Math.cos(a) * S.torso * .16, W * .5 + Math.cos(a) * W * .28); }
  const hs = armsOf(g, W, r, sh, mat(sk), rope, rope, { '-1': [-1.1, .5, -1.3], '1': [-.6, .55, -1.7] });
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#5a3a22', hair: '#3a2a1c', brow: -.06, mouth: 'stern', jaw: 1.05 }, .04, -.2);
  A(Hd, tor(R * .97, R * .08), saf2, 0, R * .5, -R * .05, Math.PI / 2 - .15); A(Hd, cone(R * .14, R * 1.0, 4), saf2, R * .7, R * .1, -R * 1.0, -2.3, 0, .3, 1, 1, .4);
  return g;
}
function aegis() {
  const g = new THREE.Group(), st = mat('#c9d2de'), teal = mat('#1f8f8a'), teal2 = mat('#135e5c'), gold = mat('#e8bd4c'), glow = mat('#8ff7ea', 1), sk = '#e0b08a', r = S.limb * 1.05, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw * 1.05;
  legsOf(g, W, r, hip, teal2, st, gold);
  A(g, lathe([[W * .5, 0], [W * .98, -.02], [W * 1.14, S.torso * .3], [W * .86, S.torso * .55], [W * 1.34, S.torso * .9], [W * 1.05, S.torso * 1.06], [W * .5, S.torso * 1.12]]), st, 0, hip, 0, 0, 0, 0, 1, 1, .74);
  A(g, lathe([[W * 1.4, -S.leg * .42], [W * 1.02, 0], [W * .5, .02]]), teal, 0, hip + S.torso * .1, 0, 0, 0, 0, 1, 1, .78); beltOf(g, W, hip + S.torso * .3, r, teal2, gold);
  A(g, fac(new THREE.OctahedronGeometry(W * .3)), glow, 0, hip + S.torso * .7, W * .86, 0, 0, 0, 1, 1.3, .3); A(g, tor(W * .36, r * .22), gold, 0, hip + S.torso * .7, W * .84);
  for (const s of [-1, 1]) { A(g, sph(W * .56), st, s * W * 1.2, sh + W * .04, 0, 0, 0, 0, 1, .8, 1); A(g, tor(W * .5, r * .2), gold, s * W * 1.2, sh - W * .02, 0, Math.PI / 2); }
  capeOf(g, W, sh, teal, .6);
  const hs = armsOf(g, W, r, sh, st, st, mat('#74809a'), { '-1': [-.7, .25, -1.0], '1': [-.25, .75, -1.25] });
  hold(hs[1], 'mace');
  { const k = S.torso * 1.5 + .3, B = J(hs[-1], -r * 1.4, 0, r * 1.2, 1.55, .55, 0), sp = [[-.34, .5], [.34, .5], [.38, -.3], [0, -.56], [-.38, -.3]];
    A(B, ext(sp, .07, .02), teal, 0, 0, 0, 0, 0, 0, k, k, 1); A(B, ext(sp, .03, .012), gold, 0, 0, -.035, 0, 0, 0, k * 1.07, k * 1.05, 1); A(B, fac(new THREE.OctahedronGeometry(k * .13)), glow, 0, k * .08, .05, 0, 0, 0, 1, 1.5, .4); for (const y of [.36, -.22]) A(B, box(k * .56, k * .04, .02), gold, 0, k * y, .045); }
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#1f8f8a', hair: '#c9a25a', brow: -.14, mouth: 'stern', jaw: 1.15 }, .03, .2); hat(Hd, R, 'helm', '#c9d2de'); beardOf(Hd, R, '#c9a25a', 0);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) A(Hd, cone(R * .16, R * (.9 - i * .18), 4), st, s * R * 1.08, R * (.95 - i * .2), -R * (.2 + i * .12), -.5, 0, -s * (.5 + i * .25), 1, 1, .3);
  return g;
}
function lifebinder() {
  const g = new THREE.Group(), wh = mat('#eef2e2'), grn = mat('#58a84a'), grn2 = mat('#2f7038'), pink = mat('#f29ab8'), gl = mat('#c8ffb0', 1), wood = mat('#7a5a3a'), sk = '#e8bb98', r = S.limb * .84, hip = S.leg, sh = hip + S.torso, R = S.head * .96, W = S.sw * .82, Ht = sh;
  robeOf(g, W, Ht, wh); feetOf(g, W, r, wood); const leaf = [[0, 0], [.5, .45], [0, 1.3], [-.5, .45]];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; A(g, ext(leaf, .03, .01), i % 2 ? grn : grn2, Math.sin(a) * W * 1.66, r * .2, Math.cos(a) * W * 1.36, -.25, a, 0, W * .6, Ht * .2, 1); }
  A(g, tor(W * .9, r * .5), grn2, 0, Ht * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1); for (let i = -1; i <= 1; i++) { A(g, sph(r * .5), pink, i * W * .4, Ht * .66, W * (.74 - Math.abs(i) * .08), 0, 0, 0, 1, 1, .6); A(g, sph(r * .2), mat('#ffe27a', 1), i * W * .4, Ht * .66, W * (.84 - Math.abs(i) * .08)); }
  A(g, cone(W * 1.4, S.torso * .5, 12), grn, 0, sh - S.torso * .1, 0, 0, 0, 0, 1, 1, .82);
  const hs = armsOf(g, W, r, sh, wh, grn2, mat(sk), { '-1': [-.9, .6, -.9], '1': [-.3, .65, -.95] });
  const B = J(hs[1], 0, 0, 0, .95, 0, -.55), L = (sh + R * 2) * 1.0; A(B, cyl(.02, .03, L, 6), wood, 0, L * .12, 0); for (let i = 0; i < 6; i++) A(B, sph(.05), pink, Math.cos(i * 1.047) * .09, L * .62 + .12, Math.sin(i * 1.047) * .09, 0, 0, 0, 1, .6, 1); A(B, sph(.05), mat('#ffe27a', 1), 0, L * .62 + .14, 0);
  for (const [y, rz] of [[.4, .9], [.5, -.8]]) A(B, ext(leaf, .02, .006), grn, 0, L * y, 0, 0, 0, rz, .09, .1, 1);
  A(hs[-1], sph(.07), gl, 0, -.2, .05); for (let i = 0; i < 5; i++) A(hs[-1], sph(.022), gl, Math.cos(i * 1.26) * .16, -.2 + Math.sin(i * 2.3) * .08, .05 + Math.sin(i * 1.26) * .16);
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#58a84a', hair: '#d9b25a', brow: .04, mouth: 'grin', jaw: .88 }, 0, .2); hairOf(Hd, R, '#d9b25a', 1.6);
  const Br = tag(15, J(Hd, R * .5, -R * .3, -R * .8, .3, 0, 0)); A(Br, cone(R * .26, R * 2.2, 6), mat('#d9b25a'), 0, -R * 1.0, 0, Math.PI); A(Br, tor(R * .16, R * .06), grn, 0, -R * .5, 0, Math.PI / 2);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; A(Hd, sph(R * .16), i % 3 ? pink : mat('#ffe27a'), Math.sin(a) * R * .95, R * .62 + Math.cos(a) * R * .12, Math.cos(a) * R * .95 - R * .05, 0, 0, 0, 1, .7, 1); }
  return g;
}
function blightblade() {
  const g = new THREE.Group(), blk = mat('#2c3028'), grn = mat('#55702e'), rust = mat('#6a4a2a'), bone = mat('#d8d2b8'), gl = mat('#b6ff3a', 1), sk = '#a9b294', r = S.limb, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw;
  legsOf(g, W, r, hip, blk, mat('#3a3f36'), rust);
  A(g, lathe([[W * .5, 0], [W * .98, -.02], [W * 1.1, S.torso * .3], [W * .84, S.torso * .55], [W * 1.3, S.torso * .9], [W * 1.05, S.torso * 1.06], [W * .5, S.torso * 1.12]]), mat('#3a3f36'), 0, hip, 0, 0, 0, 0, 1, 1, .74);
  beltOf(g, W, hip + S.torso * .32, r, rust, bone); for (const x of [-.5, -.25, .5]) { A(g, cyl(r * .3, r * .3, r * 1.3, 6), gl, x * W, hip + S.torso * .2, W * .76); A(g, cyl(r * .2, r * .2, r * .3, 5), rust, x * W, hip + S.torso * .2 + r * .8, W * .76); }
  for (let i = -3; i <= 3; i++) A(g, ext([[-.5, 0], [.5, 0], [.2, -1], [-.1, -1.2], [-.4, -.8]], .08, .02), i % 2 ? grn : blk, Math.sin(i * .5) * W * 1.02, hip + S.torso * .2, Math.cos(i * .5) * W * .78, .1, i * .5, 0, r * 1.7, S.leg * (.4 + (i & 1) * .12), r * 2);
  tag(15, A(g, ext([[-1, 0], [1, 0], [1.1, -.8], [.6, -1.1], [.3, -.8], [-.1, -1.15], [-.6, -.85], [-1.15, -1.05]], .05, .01), grn, 0, sh * .99, -W * .74, .12, 0, 0, W * .95, S.torso + S.leg * .5, 1));
  for (const s of [-1, 1]) { const Pg = J(g, s * W * 1.14, sh + .02, 0, 0, 0, -s * .45); A(Pg, dome(W * .46, .6), blk); A(Pg, tor(W * .45, r * .16), rust, 0, 0, 0, Math.PI / 2); A(Pg, cone(W * .12, W * .45, 4), bone, 0, W * .5, 0); }
  const hs = armsOf(g, W, r, sh, blk, mat('#3a3f36'), mat('#3a3f36'), { '-1': [-.2, .4, -.6], '1': [-.25, .75, -1.25] });
  { const B = J(hs[1], 0, 0, 0, 1.25, 0, -1.05), w = S.weap * 1.1; A(B, ext([[-.06, 0], [.06, 0], [.09, .2], [.05, .3], [.09, .45], [.05, .55], [.08, .7], [0, .95], [-.05, .7]], .018, .006), mat('#9aa58a'), 0, .1 * w, 0, 0, 0, 0, w, w, w); A(B, box(.012 * w, .7 * w, .03 * w), gl, -.01 * w, .45 * w, 0);
    A(B, ext([[-.2, -.03], [-.16, .04], [.16, .04], [.2, -.03], [.06, -.02], [-.06, -.02]], .05, .01), rust, 0, .09 * w, 0, 0, 0, 0, w, w, w); A(B, cyl(.022 * w, .026 * w, .2 * w, 6), blk, 0, -.03 * w, 0); A(B, sph(.05 * w), bone, 0, -.15 * w, 0); for (let i = 0; i < 3; i++) A(B, sph(.02 * w), gl, .02 * w, (.2 + i * .28) * w, .03 * w, 0, 0, 0, 1, 1.6, 1); }
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#55702e', hair: '#2c3028', brow: -.3, mouth: 'stern', jaw: 1.0, scar: 1 }, .08, -.15); hat(Hd, R, 'hood', '#55702e');
  for (const s of [-1, 1]) A(Hd, sph(R * .05), gl, s * R * .36 - R * .02, R * .23, R * .9, 0, 0, 0, 1, 1, .5);
  A(Hd, dome(R * 1.05, .5), rust, 0, -R * .1, R * .04, Math.PI, 0, 0, .92, .95, 1.0); A(Hd, cone(R * .26, R * .7, 6), rust, 0, -R * .35, R * 1.2, Math.PI / 2 + .25); for (const s of [-1, 1]) A(Hd, sph(R * .1), blk, s * R * .18, -R * .5, R * 1.05, 0, 0, 0, 1, 1, .4, false);
  return g;
}
function bard() {
  const g = new THREE.Group(), pur = mat('#7a3aa8'), yel = mat('#f0c040'), pur2 = mat('#4a2270'), wood = mat('#b87a3a'), wh = mat('#f1ece0'), sk = '#e6b48c', r = S.limb * .88, hip = S.leg, sh = hip + S.torso, R = S.head * .98, W = S.sw * .86;
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * W * .46, hip, 0, s > 0 ? .14 : -.12, 0, s * .09)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -S.leg * .45, 0));
    A(L, sph(r * 1.7), s > 0 ? pur : yel, 0, -S.leg * .16, 0, 0, 0, 0, 1, 1.1, 1); A(L, cyl(r * .9, r * .8, S.leg * .2), s > 0 ? yel : pur, 0, -S.leg * .38, 0); A(Kn, cyl(r * .8, r * .7, S.leg * .42), s > 0 ? yel : pur, 0, -S.leg * .2, 0); A(Kn, sph(r), pur2, 0, -S.leg * .55 + r * .6, r * .8, 0, 0, 0, 1.1 * S.foot, .7, 1.9 * S.foot); A(Kn, cone(r * .5, r * 1.6, 5), pur2, 0, -S.leg * .55 + r * .9, r * 2.6 * S.foot / 1.7, 1.0); }
  torsoOf(g, W, hip, pur); A(g, box(W * .5, S.torso * .95, .03), yel, 0, hip + S.torso * .55, W * .78, -.05); for (let i = 0; i < 4; i++) A(g, sph(r * .26), pur2, 0, hip + S.torso * (.25 + i * .2), W * .82);
  beltOf(g, W, hip + S.torso * .3, r, pur2, yel); A(g, lathe([[W * 1.25, -S.leg * .16], [W * 1.02, .02], [W * .5, .03]]), pur, 0, hip, 0, 0, 0, 0, 1, 1, .78);
  A(g, tor(W * .5, r * .5), wh, 0, sh + r * .1, 0, Math.PI / 2); tag(15, A(g, ext([[-1, 0], [1, 0], [1.1, -1], [0, -1.1], [-1.1, -1]], .04, .01), yel, 0, sh * .99, -W * .72, .2, 0, 0, W * .9, S.torso * .9, 1));
  const hs = armsOf(g, W, r, sh, pur, yel, mat(sk), { '-1': [-1.0, .2, -1.1], '1': [-.55, .45, -1.5] });
  for (const s of [-1, 1]) A(g, sph(r * 1.8), s > 0 ? yel : pur2, s * W * 1.08, sh - r * .6, 0, 0, 0, 0, 1, 1, 1);
  { const Lu = J(g, -W * .1, hip + S.torso * .5, W * 1.15, .1, .2, .9); A(Lu, sph(.2), wood, 0, 0, 0, 0, 0, 0, 1, 1.25, .5); A(Lu, cyl(.07, .07, .012, 10), mat('#3a2414'), 0, .03, .1, Math.PI / 2); A(Lu, box(.06, .5, .04), mat('#6b4526'), 0, .45, .02); A(Lu, box(.1, .14, .05), mat('#6b4526'), 0, .74, -.01, -.5); for (const x of [-.015, 0, .015]) A(Lu, cyl(.003, .003, .62, 3), wh, x, .34, .08); }
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#7a3aa8', hair: '#8a4a1c', brow: -.04, brow2: .3, mouth: 'grin', jaw: .95 }, -.05, .25); hairOf(Hd, R, '#8a4a1c', 1);
  A(Hd, cone(R * .2, R * .5, 5), mat('#8a4a1c'), 0, -R * 1.2, R * .5, Math.PI + .2); for (const s of [-1, 1]) A(Hd, cone(R * .08, R * .6, 4), mat('#8a4a1c'), s * R * .4, -R * .36, R * .88, 0, 0, s * 1.9);
  const Ht = J(Hd, 0, R * .62, 0, -.1, 0, .22); A(Ht, cyl(R * 2.0, R * 2.1, R * .08, 12), pur); A(Ht, cyl(R * .8, R * 1.02, R * 1.0, 10), pur, 0, R * .52, 0); A(Ht, tor(R * 1.02, R * .1), yel, 0, R * .14, 0, Math.PI / 2); for (let i = 0; i < 5; i++) A(Ht, sph(R * (.42 - i * .05)), i % 2 ? wh : yel, R * (.95 + i * .12), R * (.5 + i * .42), -R * (.1 + i * .36), 0, 0, 0, .5, 1.2, 1);
  return g;
}
function binder() {
  const g = new THREE.Group(), teal = mat('#1f6f8a'), org = mat('#d8742a'), dk = mat('#17384a'), gold = mat('#e8bd4c'), wh = mat('#efe6d0'), sk = '#8a5a3a', r = S.limb * .9, hip = S.leg, sh = hip + S.torso, R = S.head, W = S.sw * .9, Ht = sh;
  robeOf(g, W, Ht, teal); A(g, tor(W * 1.72, r * .5), org, 0, r * .5, 0, Math.PI / 2, 0, 0, 1, .82, 1); feetOf(g, W, r, dk);
  A(g, box(W * .7, Ht * .64, .03), dk, 0, Ht * .52, W * .88, -.13); for (let i = 0; i < 4; i++) A(g, tor(r * .5, r * .12), gold, 0, Ht * (.3 + i * .13), W * (1.0 - i * .04), -.13);
  A(g, tor(W * .9, r * .5), org, 0, Ht * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1); { const Bk = J(g, -W * .7, Ht * .56, W * .62, .1, -.5, .1); A(Bk, box(.2, .26, .07), org); A(Bk, box(.18, .24, .075), wh, .012, 0, 0); A(Bk, tor(.05, .012), gold, 0, .16, 0); }
  A(g, cone(W * 1.45, S.torso * .5, 4), dk, 0, sh - S.torso * .1, 0, 0, .785, 0, 1, 1, .8); A(g, tor(W * .5, r * .4), gold, 0, sh, 0, Math.PI / 2);
  const hs = armsOf(g, W, r, sh, teal, org, mat(sk), { '-1': [-1.0, .8, -.8], '1': [-1.0, .8, -.8] });
  const cols = ['#ff6a2a', '#4ab8ff', '#b88a4a', '#fff27a']; cols.forEach((c, i) => { const a = i / 4 * Math.PI * 2 + .5; A(g, fac(new THREE.OctahedronGeometry(.085)), mat(c, 1), Math.sin(a) * W * 2.3, sh + R * 1.2 + Math.cos(a * 2) * .1, Math.cos(a) * W * 1.6 + .1, 0, a, 0, 1, 1.3, 1); A(g, tor(.12, .012), mat(c), Math.sin(a) * W * 2.3, sh + R * 1.2 + Math.cos(a * 2) * .1, Math.cos(a) * W * 1.6 + .1, Math.PI / 2 + .3, 0, a); });
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#d8742a', hair: '#1a1210', brow: -.16, mouth: 'stern', jaw: 1.02 }, 0, .1); hat(Hd, R, 'wrap', '#efe6d0', '#d8742a'); beardOf(Hd, R, '#1a1210', .6);
  return g;
}
function illusionist() {
  const g = new THREE.Group(), mag = mat('#c0368a'), ind = mat('#3a2a7a'), sil = mat('#d8dcea'), gl = mat('#ff9af0', 1), gl2 = mat('#9ad8ff', 1), sk = '#ecc3a4', r = S.limb * .84, hip = S.leg, sh = hip + S.torso, R = S.head * .97, W = S.sw * .84, Ht = sh;
  robeOf(g, W, Ht, ind); A(g, tor(W * 1.72, r * .5), sil, 0, r * .5, 0, Math.PI / 2, 0, 0, 1, .82, 1); feetOf(g, W, r, mat('#241a4a'));
  for (let i = 0; i < 9; i++) { const a = i * 2.4, y = .12 + (i * .37 % .5); A(g, star(r * .5), sil, Math.sin(a) * W * (1.62 - y * 1.1), Ht * y, Math.cos(a) * W * (1.34 - y * .9), 0, a, 0); }
  A(g, tor(W * .9, r * .5), mag, 0, Ht * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1); A(g, fac(new THREE.OctahedronGeometry(r * .7)), gl, 0, Ht * .66, W * .78);
  for (const s of [-1, 1]) A(g, ext([[0, 0], [.9, .2], [1.0, 1.5], [.2, 1.0]], .04, .012), mag, s * W * .3, sh - S.torso * .12, -W * .2, 0, s > 0 ? -.5 : Math.PI + .5, 0, W * 1.1, R * 1.5, 1);        // high collar
  capeOf(g, W, sh, mag, .62);
  const hs = armsOf(g, W, r, sh, ind, mag, mat('#f6f1e4'), { '-1': [-1.1, .7, -.7], '1': [-.5, .6, -1.4] });
  { const B = J(hs[1], 0, 0, 0, 1.3, 0, -.5); A(B, cyl(.012, .018, .5, 5), mat('#17122a'), 0, .22, 0); A(B, cyl(.02, .02, .08, 5), sil, 0, .44, 0); A(B, star(.07), gl, 0, .56, 0); }
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + .4; A(hs[-1], fac(new THREE.OctahedronGeometry(.06)), i % 2 ? gl : gl2, Math.cos(a) * .2, -.22 + i * .09, .05 + Math.sin(a) * .2, .3, a, 0, .7, 1.7, .7); }
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#c0368a', hair: '#17122a', brow: -.1, brow2: .34, mouth: 'smirk', jaw: .92 }, 0, -.2); hairOf(Hd, R, '#17122a');
  A(Hd, sph(R * .5), mat('#17122a'), 0, R * .95, -R * .2, 0, 0, 0, 1, .7, 1.3); for (const s of [-1, 1]) A(Hd, cone(R * .06, R * .5, 4), mat('#17122a'), s * R * .36, -R * .4, R * .9, 0, 0, s * 1.7);
  A(Hd, ext([[-.5, .5], [.1, .5], [.1, -.35], [-.3, -.5], [-.5, -.1]], .06, .02), mat('#f6f1e4'), R * .4, R * .14, R * .9, 0, .25, 0, R * .9, R * .9, 1); A(Hd, sph(R * .1), mat('#17122a'), R * .34, R * .22, R * .98, 0, 0, 0, 1.3, .7, .4, false); A(Hd, star(R * .12), gl, R * .62, R * .5, R * .9);
  return g;
}
const star = r => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const q2 = i % 2 ? r * .45 : r, a = i * Math.PI / 5; i ? s.lineTo(Math.sin(a) * q2, Math.cos(a) * q2) : s.moveTo(Math.sin(a) * q2, Math.cos(a) * q2); } return new THREE.ExtrudeGeometry(s, { depth: r * .25, bevelEnabled: false }); };

// ---- townsfolk and human-shaped enemies: one builder, one line of choices per character
function folk(o) {
  const g = new THREE.Group(), r = S.limb * (o.thin || 1), hip = S.leg, sh = hip + S.torso, R = S.head * (o.headK || 1), W = S.sw * (o.wide || .95), c1 = mat(o.c1), c2 = mat(o.c2 || shade(o.c1, .65)), c3 = mat(o.c3 || '#e8bd4c'), skm = mat(o.skin), bone = o.bones;
  if (o.robe) { robeOf(g, W, sh, c1); A(g, tor(W * 1.72, r * .5), c3, 0, r * .5, 0, Math.PI / 2, 0, 0, 1, .82, 1); feetOf(g, W, r, mat(o.boots || '#4a2f1a')); A(g, tor(W * .9, r * .45), c2, 0, sh * .66, 0, Math.PI / 2, 0, 0, 1, .82, 1); if (o.apron) A(g, box(W * 1.0, sh * .46, .03), mat(o.apron), 0, sh * .42, W * 1.0, -.16); }
  else if (bone) { legsOf(g, W * .8, r * .5, hip, skm, skm, skm); A(g, cyl(r * .35, r * .35, S.torso, 5), skm, 0, hip + S.torso * .5, -W * .1); A(g, sph(W * .7), skm, 0, hip + r * .3, 0, 0, 0, 0, 1, .5, .6);
    for (let i = 0; i < 4; i++) A(g, tor(W * (.72 + i * .08), r * .2, Math.PI * 1.5), skm, 0, hip + S.torso * (.5 + i * .14), 0, Math.PI / 2, 0, Math.PI * .75, 1, .75, 1); A(g, box(W * 2.0, r * .5, r * .5), skm, 0, sh, 0); if (o.rags) A(g, lathe([[W * 1.1, -S.leg * .3], [W * .8, .02], [W * .4, .03]]), mat(o.rags), 0, hip + r, 0, 0, 0, 0, 1, 1, .7); }
  else { legsOf(g, W, r, hip, o.bareLegs ? skm : mat(o.legs || '#6a5a48'), o.bareLegs ? skm : mat(o.boots || '#4a2f1a'), c2); torsoOf(g, W * (o.belly || 1), hip, o.bare ? skm : c1, o.belly ? .92 : .72); beltOf(g, W * (o.belly || 1), hip + S.torso * .3, r, c2, o.bare ? null : c3);
    if (o.skirt) A(g, lathe([[W * 1.3, -S.leg * o.skirt], [W * 1.02 * (o.belly || 1), .02], [W * .5, .03]]), o.bare ? c1 : c1, 0, hip + S.torso * .28, 0, 0, 0, 0, 1, 1, .8);
    if (o.apron) A(g, box(W * 1.1, S.torso * .6 + S.leg * .4, .03), mat(o.apron), 0, hip + S.torso * .12, W * .8 * (o.belly || 1), -.05);
    if (o.stripes) for (let i = 0; i < 3; i++) A(g, tor(W * (1.0 + i * .05), r * .22), mat(o.stripes), 0, hip + S.torso * (.48 + i * .17), 0, Math.PI / 2, 0, 0, 1, .73, 1);
    if (o.stitch) for (let i = 0; i < 4; i++) A(g, box(W * .3, r * .12, .02), mat('#2a1c14'), W * .2, hip + S.torso * (.4 + i * .12), W * .9 * (o.belly || 1), 0, 0, i % 2 ? .3 : -.3, 1, 1, 1, false); }
  if (o.tabard) A(g, ext([[-.5, 0], [.5, 0], [.5, -1], [0, -1.2], [-.5, -1]], .1, .02), mat(o.tabard), 0, hip + S.torso * .98, W * .8, -.06, 0, 0, W * .95, S.torso * .9 + S.leg * .3, .2);
  if (o.pauld) for (const s of [-1, 1]) { A(g, dome(W * .44 * o.pauld, .6), mat(o.pauldC || '#74809a'), s * W * 1.12, sh, 0, 0, 0, -s * .4); if (o.spikes) A(g, cone(W * .12, W * .5, 4), mat('#e6dcc2'), s * W * 1.2, sh + W * .45, 0, 0, 0, -s * .3); }
  if (o.cape) capeOf(g, W, sh, mat(o.cape), o.capeLen || .5);
  if (o.mantle) A(g, cone(W * 1.4, S.torso * .45, 10), mat(o.mantle), 0, sh - S.torso * .1, 0, 0, 0, 0, 1, 1, .82);
  const hs = armsOf(g, W, r * (bone ? .5 : 1), sh, (o.bare || bone || o.bareArms) ? skm : c1, bone ? skm : mat(o.fore || shade(o.c1, .78)), o.gloves ? mat(o.gloves) : skm, o.pose || { '-1': [-.15, .32, -.5], '1': [-.3, .55, -1.0] });
  if (o.right) hold(hs[1], o.right, 1, S.weap * (o.weapK || 1)); if (o.left) hold(hs[-1], o.left, -1, S.weap * (o.weapK || 1));
  if (o.claws) for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) A(hs[s], cone(r * .2, r * 1.3, 4), mat('#e6dcc2'), i * r * .5, -r * 1.6, r * .3, Math.PI - .3);
  const Hd = headOf(g, sh, R, { skin: o.skin, iris: o.iris || '#5a3a22', hair: o.hair || '#3a2a1c', brow: o.brow ?? -.06, brow2: o.brow2, mouth: o.mouth || 'stern', jaw: o.jaw || 1, stubble: o.stubble, scar: o.scar, nose: o.noseC }, o.hx || 0, o.hy ?? .15);
  if (o.hairStyle !== 'bald' && !bone) hairOf(Hd, R, o.hair || '#3a2a1c', o.hairStyle === 'long' ? 1.6 : o.hairStyle === 'bun' ? 0 : .6); if (o.hairStyle === 'bun') A(Hd, sph(R * .42), mat(o.hair), 0, R * .6, -R * 1.0);
  if (o.beard) beardOf(Hd, R, o.beardC || o.hair || '#3a2a1c', o.beard === true ? .6 : o.beard);
  if (o.hat) hat(Hd, R, o.hat, o.hatC || o.c2 || o.c1, o.hatT || o.c3);
  if (o.mask) { A(Hd, dome(R * 1.06, .5), mat(o.mask), 0, -R * .02, R * .02, Math.PI, 0, 0, .93, 1.06, 1.02); A(Hd, sph(R * .21), mat(o.mask), 0, -R * .24, R * 1.0, 0, 0, 0, 1.2, 1.05, 1.15, false); }
  if (o.tusks) for (const s of [-1, 1]) A(Hd, cone(R * .1 * o.tusks, R * .5 * o.tusks, 5), mat('#f1ece0'), s * R * .3, -R * .42, R * .86, -.2, 0, -s * .15);
  if (o.bigNose) A(Hd, sph(R * .3), mat(o.noseC || shade(o.skin, .9)), 0, -R * .25, R * 1.1, 0, 0, 0, 1, 1.2, 1.3);
  if (o.ears) for (const s of [-1, 1]) A(Hd, cone(R * .2, R * .8, 4), skm, s * R * 1.15, R * .25, -R * .1, 0, 0, -s * 1.1, 1, 1, .4);
  if (o.glowEyes) for (const s of [-1, 1]) A(Hd, sph(R * .07), mat(o.glowEyes, 1), s * R * .36 - R * .02, R * .23, R * .9, 0, 0, 0, 1, 1, .5);
  if (bone) { A(Hd, box(R * .5, R * .12, R * .06), mat('#f6f1e4'), 0, -R * .56, R * .84); for (let i = -2; i <= 2; i++) A(Hd, box(R * .015, R * .12, R * .07), mat('#2a1c14'), i * R * .09, -R * .56, R * .85, 0, 0, 0, 1, 1, 1, false); }
  return g;
}
// ---- the dead and the half-beasts
function wraith(c1 = '#1c2a30', c2 = '#0f171b', gl = '#6ff2e0') {
  const g = new THREE.Group(), rb = mat(c1), rb2 = mat(c2), glow = mat(gl, 1), bone = mat('#d8d2b8'), r = S.limb * .8, sh = S.leg + S.torso + .25, R = S.head, W = S.sw * .9, y0 = .38;
  A(g, lathe([[W * .25, y0], [W * 1.25, y0 + .2], [W * 1.0, sh * .6], [W * .82, sh * .72], [W * 1.15, sh * .9], [W * .9, sh * .99], [W * .4, sh * 1.03]]), rb, 0, 0, 0, 0, 0, 0, 1, 1, .82);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; tag(7, A(g, cone(W * .34, .5 + (i % 3) * .14, 4), i % 2 ? rb : rb2, Math.sin(a) * W * 1.0, y0 + .1, Math.cos(a) * W * .82, Math.PI, a, 0, 1, 1, .5)); }
  for (let i = 0; i < 4; i++) tag(7, A(g, fac(new THREE.OctahedronGeometry(.05 - i * .008)), glow, Math.sin(i * 2.2) * W * .5, y0 - .08 - i * .07, Math.cos(i * 2.2) * W * .4, 0, 0, 0, 1, 1.8, 1));
  A(g, box(r * .9, sh * .5, .03), rb2, 0, sh * .62, W * .86, -.1); for (let i = 0; i < 3; i++) A(g, tor(r * .6, r * .14), bone, 0, sh * (.5 + i * .12), W * (.95 - i * .03), -.1);
  A(g, cone(W * 1.35, S.torso * .45, 8), rb2, 0, sh - S.torso * .1, 0, 0, 0, 0, 1, 1, .82);
  const hs = armsOf(g, W, r, sh, rb, rb2, bone, { '-1': [-1.0, .55, -.6], '1': [-1.25, .4, -.5] });
  for (const s of [-1, 1]) { A(hs[s], cyl(r * 1.0, r * 2.2, S.torso * .3, 6), rb, 0, S.torso * .14, 0); for (let i = -1; i <= 1; i++) A(hs[s], cone(r * .2, r * 1.6, 4), bone, i * r * .5, -r * 1.7, r * .3, Math.PI - .35); }
  const Hd = tag(5, J(g, 0, sh + R * 1.0, 0, .18, 0, 0)); A(Hd, sph(R * .92), mat('#05080a'), 0, 0, R * .06);
  for (const s of [-1, 1]) A(Hd, sph(R * .14), glow, s * R * .34, R * .12, R * .9, 0, 0, s * .5, 1.5, .6, .5); A(Hd, sph(R * .1), glow, 0, -R * .4, R * .86, 0, 0, 0, 1.6, .4, .5);
  A(Hd, dome(R * 1.32, .62), rb2, 0, R * .26, -R * .18, -.4); A(Hd, cone(R * .5, R * 1.3, 6), rb2, 0, R * 1.0, -R * 1.3, -1.9);
  return g;
}
function harpy() {
  const g = new THREE.Group(), fe = mat('#6a5a7a'), fe2 = mat('#3f344a'), bel = mat('#b8a8a0'), tal = mat('#e6dcc2'), yel = mat('#e0a030'), sk = '#9aa08a', r = S.limb * .8, hip = S.leg * .86, R = S.head * .95, W = S.sw * .9;
  for (const s of [-1, 1]) { const L = tag(s > 0 ? 2 : 1, J(g, s * W * .5, hip, 0, -.5, 0, s * .1)), Kn = tag(s > 0 ? 12 : 11, J(L, 0, -S.leg * .42, 0, 1.0, 0, 0));
    A(L, sph(r * 1.6), fe, 0, -S.leg * .16, 0, 0, 0, 0, 1, 1.6, 1.1); A(Kn, cyl(r * .5, r * .4, S.leg * .5, 6), yel, 0, -S.leg * .24, 0);
    for (let i = -1; i <= 1; i++) { A(Kn, cone(r * .32, r * 2.4, 5), yel, i * r * .8, -S.leg * .5, r * 1.0, Math.PI / 2 - .5, 0, -i * .45); A(Kn, cone(r * .2, r * .9, 4), tal, i * r * 1.3, -S.leg * .56, r * 2.1, Math.PI / 2, 0, -i * .45); } A(Kn, cone(r * .28, r * 1.6, 5), yel, 0, -S.leg * .46, -r * .7, -Math.PI / 2 - .5); }
  const Bd = J(g, 0, hip, 0, .4, 0, 0);
  A(Bd, lathe([[.02, -.14], [W * .9, 0], [W * 1.2, S.torso * .4], [W * 1.0, S.torso * .8], [W * .4, S.torso * 1.06]]), fe, 0, 0, 0, 0, 0, 0, 1, 1, .86); A(Bd, sph(W * .8), bel, 0, S.torso * .42, W * .46, 0, 0, 0, .9, 1.3, .7);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; A(Bd, cone(W * .26, S.torso * .5, 4), i % 2 ? fe2 : fe, Math.sin(a) * W * .55, S.torso * .95, Math.cos(a) * W * .5, Math.PI + Math.cos(a) * .5, 0, -Math.sin(a) * .5, 1, 1, .5); }
  const Tl = tag(6, J(Bd, 0, S.torso * .12, -W * .8, -1.9, 0, 0)); for (let i = -2; i <= 2; i++) A(Tl, ext([[-.5, 0], [.5, 0], [.35, 1], [0, 1.25], [-.35, 1]], .03, .01), i % 2 ? fe : fe2, i * W * .22, 0, 0, 0, 0, -i * .22, W * .4, S.torso * (1.3 - Math.abs(i) * .15), 1);
  for (const s of [-1, 1]) { const Wg = tag(s > 0 ? 28 : 29, J(Bd, s * W * .95, S.torso * .86, -W * .1, 0, s * .25, s * .35));
    A(Wg, cyl(r * .7, r * .45, W * 2.6, 6), fe2, s * W * 1.3, 0, 0, 0, 0, s * Math.PI / 2); A(Wg, cone(r * .3, r * 1.6, 4), tal, s * W * 2.7, r * .4, 0, 0, 0, -s * 1.0);
    for (let i = 0; i < 7; i++) A(Wg, ext([[-.5, 0], [.5, 0], [.34, -1], [0, -1.22], [-.34, -1]], .03, .01), i % 2 ? fe : fe2, s * W * (.25 + i * .38), -r * .2, -.01 * i, .12, 0, s * i * .1, W * .46, S.torso * (1.55 - i * .1), 1); }
  A(Bd, cyl(R * .34, R * .42, R * .7, 6), mat(sk), 0, S.torso * 1.12, W * .16, .4);
  const Hd = tag(5, J(Bd, 0, S.torso * 1.3 + R * .5, W * .36, -.3, .15, 0)); face(Hd, R, { skin: sk, iris: '#e0a030', hair: '#3f344a', brow: -.36, mouth: 'stern', jaw: .9 });
  A(Hd, cone(R * .36, R * 1.2, 5), yel, 0, -R * .2, R * 1.25, Math.PI / 2 + .35, 0, 0, 1, 1, .8); A(Hd, cone(R * .26, R * .7, 5), mat('#b07818'), 0, -R * .6, R * 1.0, Math.PI / 2 + .1, 0, 0, 1, 1, .6);
  for (const s of [-1, 1]) A(Hd, sph(R * .07), mat('#ffe27a', 1), s * R * .36 - R * .02, R * .23, R * .9, 0, 0, 0, 1, 1, .5);
  for (let i = -2; i <= 2; i++) A(Hd, cone(R * .22, R * (1.5 - Math.abs(i) * .2), 4), i % 2 ? fe : fe2, i * R * .36, R * .95, -R * .5, -.9, 0, -i * .25, 1, 1, .4);
  return g;
}
function merfolk() {
  const g = new THREE.Group(), sc2 = mat('#1c4f55'), bel = mat('#a8d8c0'), fin = mat('#d8742a'), sk = '#4f9a94', r = S.limb, hip = .68, sh = hip + S.torso, R = S.head, W = S.sw, skm = mat(sk);
  const T1 = tag(6, J(g, 0, hip + .04, 0, -.5, 0, 0)); A(T1, cyl(W * 1.0, W * .8, .44, 10), skm, 0, -.2, 0, 0, 0, 0, 1, 1, .8);
  const T2 = J(T1, 0, -.4, 0, 1.3, 0, 0); A(T2, sph(W * .82), skm, 0, 0, 0, 0, 0, 0, 1, 1, .8); A(T2, cyl(W * .8, W * .55, .44, 10), sc2, 0, -.2, 0, 0, 0, 0, 1, 1, .8);
  const T3 = J(T2, 0, -.4, 0, .75, 0, 0); A(T3, sph(W * .56), sc2, 0, 0, 0, 0, 0, 0, 1, 1, .8); A(T3, cyl(W * .55, W * .2, .4, 8), skm, 0, -.2, 0, 0, 0, 0, 1, 1, .8);
  for (const s of [-1, 1]) A(T3, ext([[0, 0], [.9, -.5], [.7, -1.2], [0, -.5]], .03, .01), fin, 0, -.36, 0, 0, s > 0 ? 0 : Math.PI, 0, .45, .4, 1);
  for (let i = 0; i < 3; i++) A(i ? T2 : T1, ext([[0, 0], [.5, .9], [1, 0]], .03, .01), fin, 0, -.34 + (i === 2 ? .16 : 0), -W * .6, 0, Math.PI / 2, Math.PI, .22, .2, 1);
  torsoOf(g, W, hip, skm); A(g, sph(W * .78), bel, 0, hip + S.torso * .5, W * .3, 0, 0, 0, .9, 1.5, .8);
  A(g, ext([[0, 0], [.4, 1], [1, .3], [1, 0]], .03, .01), fin, 0, hip + S.torso * .2, -W * .7, 0, -Math.PI / 2, 0, .34, S.torso * .9, 1);
  for (const s of [-1, 1]) A(g, dome(W * .42, .6), sc2, s * W * 1.1, sh, 0, 0, 0, -s * .4);
  const hs = armsOf(g, W, r, sh, skm, sc2, skm, { '-1': [-.9, .6, -.7], '1': [-.3, .6, -1.0] });
  for (const s of [-1, 1]) { A(hs[s], ext([[0, 0], [.7, .5], [.3, 1.3], [0, 1]], .03, .01), fin, 0, .05, -r, 0, Math.PI / 2, 0, .2, .22, 1); for (let i = -1; i <= 1; i++) A(hs[s], cone(r * .18, r * 1.1, 4), mat('#e6dcc2'), i * r * .5, -r * 1.5, r * .3, Math.PI - .3); }
  hold(hs[1], 'fork');
  const Hd = headOf(g, sh, R, { skin: sk, iris: '#e0a030', hair: '#1c4f55', brow: -.32, mouth: 'grin', jaw: 1.1 }, .05, .2);
  for (const s of [-1, 1]) { A(Hd, ext([[0, 0], [1, .5], [.8, -.3], [1, -.9], [0, -.5]], .03, .01), fin, s * R * .85, R * .15, -R * .1, 0, s > 0 ? -.4 : Math.PI + .4, 0, R * .8, R * .8, 1); A(Hd, sph(R * .07), mat('#ffe27a', 1), s * R * .36 - R * .02, R * .23, R * .9, 0, 0, 0, 1, 1, .5); }
  A(Hd, ext([[0, 0], [.5, 1], [1.2, .6], [1.6, 0]], .03, .01), fin, 0, R * .8, R * .5, 0, Math.PI / 2, 0, R * .9, R * .7, 1);
  for (let i = -2; i <= 2; i++) A(Hd, cone(R * .04, R * .2, 4), mat('#fbf7ee'), i * R * .09, -R * .62, R * .84, Math.PI);
  return g;
}
// The three looks of a class: look 0 is the model as designed; looks 1 and 2 swap its colours for a themed set.
export const LOOKS = {
  bulwark: [null, { '#b9c4d6': '#b89a66', '#74809a': '#6a5636', '#b8241c': '#2f6a3a', '#5c3b22': '#3a2a18' }, { '#b9c4d6': '#4c5160', '#74809a': '#2a2d38', '#b8241c': '#5a2a8a', '#e8bd4c': '#c9d2de', '#dfe6f0': '#b9a6ff' }],
  elem: [null, { '#3d57c4': '#b03a1e', '#27398c': '#6a1e12', '#b8241c': '#e8bd4c', '#7fe9ff': '#ffb347', '#2aa7d8': '#d8541a', '#ffb347': '#7fe9ff', '#ff7a2a': '#2aa7d8' }, { '#3d57c4': '#3a2a5a', '#27398c': '#201636', '#e8bd4c': '#c9d2de', '#b8241c': '#1f8f8a', '#7fe9ff': '#e0a8ff', '#2aa7d8': '#8a4ad8', '#ffb347': '#b6ff3a', '#ff7a2a': '#55a82e' }],
  archer: [null, { '#3f7a3a': '#b0622a', '#2a552b': '#7a3a16', '#cdb07a': '#d8c8a0', '#b8241c': '#e8bd4c' }, { '#3f7a3a': '#2f4a6a', '#2a552b': '#1c2f48', '#8a5a32': '#4a4a52', '#4a2f1a': '#26262e', '#b8241c': '#c9d2de' }],
  knifeshade: [null, { '#3b3644': '#8a6a44', '#27232e': '#5a4228', '#6b4a94': '#c9a04a', '#7a1e28': '#2f6a6a' }, { '#3b3644': '#5a5e66', '#27232e': '#383c44', '#6b4a94': '#2f8a5a', '#7a1e28': '#1f5a3a' }],
  cleric: [null, { '#a8281e': '#2f5fb0', '#d2c8b0': '#b8c4d8' }, { '#efe9da': '#4a3a5a', '#d2c8b0': '#30243c', '#a8281e': '#e8bd4c' }],
  bladewarden: [null, { '#2f6fb8': '#b8241c', '#5d6676': '#7a5a3a', '#3d4452': '#4a3420' }, { '#2f6fb8': '#2f8a5a', '#5d6676': '#8a8f9a', '#3d4452': '#5a5f6a', '#8a7a66': '#d8d4cc', '#5e5246': '#a8a49c' }],
  warlock: [null, { '#3b2552': '#5a1420', '#241634': '#32080e', '#7dff6a': '#ff5a3a', '#d6ffcf': '#ffd6cf' }, { '#3b2552': '#1f3a52', '#241634': '#102030', '#7dff6a': '#7fe9ff', '#d6ffcf': '#d8f6ff' }],
  druid: [null, { '#4f8a3a': '#c9742a', '#2f6030': '#8a3a1c', '#a8ff7a': '#ffd27a' }, { '#4f8a3a': '#c8d8e0', '#2f6030': '#8aa0b0', '#7a5a3a': '#8a8478', '#5a4028': '#5a564e', '#a8ff7a': '#9ae8ff' }],
  wardancer: [null, { '#b3262c': '#1f7f8a', '#7a1620': '#125058' }, { '#b3262c': '#3a2a6a', '#7a1620': '#221848', '#e8bd4c': '#c9d2de' }],
  monk: [null, { '#e08a1e': '#8a2a22', '#a85a12': '#5a1612' }, { '#e08a1e': '#2f5a8a', '#a85a12': '#1c3a5c' }],
  aegis: [null, { '#1f8f8a': '#b03a1e', '#135e5c': '#6a1e12', '#8ff7ea': '#ffd27a' }, { '#1f8f8a': '#4a2a8a', '#135e5c': '#2c1858', '#c9d2de': '#8a8f9a', '#8ff7ea': '#e0a8ff' }],
  lifebinder: [null, { '#f29ab8': '#f0c040', '#58a84a': '#3a8a7a', '#2f7038': '#1f5a50' }, { '#eef2e2': '#f0d8e0', '#f29ab8': '#9a6ad8', '#58a84a': '#6a8a4a' }],
  blightblade: [null, { '#55702e': '#6a2e70', '#b6ff3a': '#e07aff', '#6a4a2a': '#4a3a5a' }, { '#55702e': '#7a2a1e', '#b6ff3a': '#ff8a3a', '#3a3f36': '#4a3a34' }],
  bard: [null, { '#7a3aa8': '#b8241c', '#4a2270': '#6a1410', '#f0c040': '#f1ece0' }, { '#7a3aa8': '#2f7a4a', '#4a2270': '#1a4a2a', '#f0c040': '#e08a1e' }],
  binder: [null, { '#1f6f8a': '#6a2a7a', '#17384a': '#3a1648', '#d8742a': '#e8bd4c' }, { '#1f6f8a': '#7a5a2a', '#17384a': '#4a3414', '#d8742a': '#2f8a8a' }],
  illusionist: [null, { '#c0368a': '#1f8f8a', '#3a2a7a': '#123a4a', '#ff9af0': '#8ff7ea' }, { '#c0368a': '#e08a1e', '#3a2a7a': '#4a1a2a', '#ff9af0': '#ffd27a' }],
};

const SKIN = ['#e6b48c', '#c8946a', '#8a5a3a', '#f0c8a4'], ORC = '#7a9a4a', DROWN = '#8fb8b0', GH = '#9aa890';
const F = o => () => folk(o);
export const FOLK = {
  villager0: [F({ c1: '#8a6a3a', c3: '#c9a25a', skin: SKIN[0], hat: 'straw', hatC: '#d9c070', hatT: '#8a3a1c', right: 'fork', beard: .3, hair: '#6a4424', mouth: 'grin' })],
  villager1: [F({ robe: 1, c1: '#b86a8a', c2: '#7a3a5a', c3: '#f1ece0', apron: '#f1ece0', skin: SKIN[3], hair: '#4a2a1a', hairStyle: 'bun', thin: .85, wide: .82, jaw: .88, mouth: 'grin', brow: .04 })],
  villager2: [F({ c1: '#5a8a3a', legs: '#4a4032', skin: SKIN[2], hairStyle: 'bald', hat: 'cap', hatC: '#8a6a3a', right: 'staff', stubble: '#6a4630' })],
  villager3: [F({ robe: 1, c1: '#4a6a9a', c2: '#2a3a5a', c3: '#e8bd4c', apron: '#e6dcc2', skin: SKIN[1], hair: '#c9c4bc', hairStyle: 'bun', thin: .85, wide: .85, jaw: .9, left: 'lantern' })],
  wick: [F({ c1: '#3a3a4a', c2: '#22222c', skin: SKIN[0], hat: 'tall', hatC: '#22222c', hatT: '#e8bd4c', cape: '#22222c', capeLen: .6, right: 'staff', left: 'lantern', hair: '#c9c4bc', beard: .4, beardC: '#c9c4bc' })],
  hermit: [F({ robe: 1, c1: '#7a6a52', c2: '#4a3f30', c3: '#4a3f30', skin: SKIN[1], hair: '#d8d4cc', hairStyle: 'long', beard: 1.3, beardC: '#d8d4cc', right: 'staff', hat: 'hood', hatC: '#4a3f30', brow: .05 })],
  guard: [F({ c1: '#b9c4d6', c2: '#5c3b22', legs: '#74809a', boots: '#b9c4d6', fore: '#b9c4d6', gloves: '#74809a', tabard: '#2f5fb0', pauld: 1.1, skin: SKIN[0], hat: 'helm', hatC: '#b9c4d6', right: 'spear', left: 'shield', stubble: '#b88a68', jaw: 1.12, brow: -.16 })],
  priest: [F({ robe: 1, c1: '#efe9da', c2: '#e8bd4c', skin: SKIN[2], hair: '#3a2a1c', hairStyle: 'bald', mantle: '#d2c8b0', left: 'book', right: 'scepter', beard: .5, brow: .03, mouth: 'grin' })],
  bandit: [F({ c1: '#6a4a32', legs: '#3f3a34', skin: SKIN[1], hat: 'hood', hatC: '#3f3a34', mask: '#3f3a34', right: 'sword', brow: -.28, scar: 1 })],
  bandit2: [F({ c1: '#3a4a5a', legs: '#2f3338', skin: SKIN[0], hat: 'bandana', hatC: '#8a2a22', right: 'axe', stubble: '#a87a5a', brow: -.26, pauld: .8, pauldC: '#5c3b22' })],
  xbow: [F({ c1: '#5a5240', legs: '#3f3a34', skin: SKIN[2], hat: 'cap', hatC: '#3f3a34', right: 'crossbow', brow: -.2, pose: { '-1': [-1.0, -.2, -.6], '1': [-.9, .25, -.9] } })],
  pirate0: [F({ c1: '#f1ece0', stripes: '#b8241c', legs: '#2a3a5a', skin: SKIN[1], hat: 'bandana', hatC: '#b8241c', right: 'cutlass', stubble: '#9a6a48', brow: -.2, mouth: 'grin', bareArms: 1 })],
  pirate1: [F({ c1: '#f1ece0', stripes: '#2a5a9a', legs: '#5a3a22', skin: SKIN[2], hairStyle: 'bald', right: 'cutlass', left: 'dagger', beard: .5, hair: '#1a1210', brow: -.24, bareArms: 1, scar: 1 })],
  pirate2: [F({ c1: '#3a6a5a', legs: '#3f3a34', skin: SKIN[0], hat: 'bandana', hatC: '#e8bd4c', right: 'axe', beard: .8, hair: '#a8482a', brow: -.2, belly: 1.25 })],
  smuggler: [F({ c1: '#4a4038', c2: '#2a2420', legs: '#2a2420', skin: SKIN[3], hat: 'cap', hatC: '#2a2420', cape: '#2a2420', right: 'dagger', left: 'lantern', stubble: '#c8a080', brow: -.12 })],
  captain: [F({ c1: '#a8281e', c2: '#3a2414', legs: '#f1ece0', boots: '#2a1c14', skin: SKIN[0], hat: 'tricorn', hatC: '#2a1c14', cape: '#7a1c16', capeLen: .6, right: 'cutlass', beard: 1, hair: '#1a1210', brow: -.26, pauld: .8, pauldC: '#e8bd4c', scar: 1 }), 1.08],
  queen: [F({ robe: 1, c1: '#8a1c3a', c2: '#e8bd4c', skin: SKIN[1], hair: '#1a1210', hairStyle: 'long', hat: 'crown', hatC: '#ff5a4a', mantle: '#3a1020', cape: '#3a1020', capeLen: .7, right: 'scepter', jaw: .9, brow: -.2, mouth: 'smirk', thin: .86, wide: .85 }), 1.06],
  admiral: [F({ c1: '#1f3a5a', c2: '#e8bd4c', legs: '#d8dcd0', boots: '#1a1a22', skin: DROWN, hat: 'tricorn', hatC: '#1a2a3a', cape: '#16283c', capeLen: .7, right: 'cutlass', beard: 1.1, hair: '#d8e8e4', brow: -.3, glowEyes: '#7dffe0', pauld: .9, pauldC: '#e8bd4c' }), 1.12],
  drowned0: [F({ c1: '#4a6a62', legs: '#34443f', skin: DROWN, hat: 'bandana', hatC: '#2a4a48', right: 'cutlass', glowEyes: '#7dffe0', brow: -.28, bareArms: 1, hair: '#2a4a48', mouth: 'grin' })],
  drowned1: [F({ c1: '#3a5a66', legs: '#2a3a40', skin: DROWN, hairStyle: 'long', hair: '#3a6a5a', right: 'hammer', glowEyes: '#7dffe0', brow: -.3, belly: 1.2, bare: 1, skirt: .3 })],
  drowned2: [F({ robe: 1, c1: '#2f4f52', c2: '#1a2f33', c3: '#7dffe0', skin: DROWN, hat: 'hood', hatC: '#1a2f33', right: 'staff', glowEyes: '#7dffe0', brow: -.2 })],
  cultist0: [F({ robe: 1, c1: '#5a1820', c2: '#2a0c10', c3: '#2a0c10', skin: SKIN[3], hat: 'hood', hatC: '#2a0c10', right: 'dagger', brow: -.28 })],
  cultist1: [F({ robe: 1, c1: '#5a1820', c2: '#2a0c10', c3: '#e8bd4c', skin: SKIN[2], hat: 'hood', hatC: '#2a0c10', right: 'staff', left: 'book', brow: -.24, mask: '#2a0c10' })],
  cultist2: [F({ robe: 1, c1: '#3a0c14', c2: '#e8bd4c', c3: '#e8bd4c', skin: SKIN[0], hat: 'horned', hatC: '#2a0c10', mantle: '#2a0c10', right: 'scepter', beard: .8, hair: '#1a1210', brow: -.32, glowEyes: '#ff5a3a' }), 1.1],
  gravelord: [F({ robe: 1, c1: '#22202a', c2: '#6a5a8a', c3: '#b9a6ff', skin: '#b9b4c6', hat: 'crown', hatC: '#b9a6ff', hatT: '#8a8496', mantle: '#16141c', cape: '#16141c', capeLen: .7, right: 'scepter', glowEyes: '#b9a6ff', brow: -.34, hairStyle: 'long', hair: '#d8d4e0', jaw: .9 }), 1.15],
  skeleton: [F({ bones: 1, c1: '#e6dcc2', skin: '#e6dcc2', hair: '#b8ad90', rags: '#4a3a5a', right: 'sword', left: 'round', glowEyes: '#7dff6a', brow: -.3, mouth: 'stern' })],
  ghoul: [F({ c1: '#4a4038', skin: GH, bare: 1, bareLegs: 1, skirt: .28, hairStyle: 'bald', claws: 1, glowEyes: '#b6ff3a', brow: -.34, mouth: 'grin', ears: 1, thin: .85, pose: { '-1': [-.9, .5, -.7], '1': [-1.0, .5, -.6] } })],
  brute: [F({ c1: '#5c3b22', legs: '#4a3a2a', skin: ORC, bareArms: 1, tusks: 1.2, hat: 'horned', hatC: '#74809a', pauld: 1.3, spikes: 1, right: 'axe', weapK: 1.3, brow: -.34, jaw: 1.25, wide: 1.15, noseC: '#6a8a3e', hair: '#1a1210' }), 1.15],
  shaman: [F({ c1: '#6a4a2a', skin: ORC, bare: 1, skirt: .5, tusks: 1, hat: 'feathers', hatC: '#b8241c', hatT: '#e8bd4c', right: 'staff', mantle: '#8a7a66', brow: -.2, jaw: 1.15, hairStyle: 'bald', noseC: '#6a8a3e', glowEyes: '#ffb03a' }), 1.12],
  troll: [F({ c1: '#5a4a3a', skin: '#7a8f9a', bare: 1, bareLegs: 1, skirt: .34, tusks: 1.7, bigNose: 1, ears: 1, hairStyle: 'bald', right: 'club', weapK: 1.5, brow: -.3, jaw: 1.3, wide: 1.25, thin: 1.25, belly: 1.15, noseC: '#687c86' }), 1.5],
  wraith: [() => wraith()], ghost: [() => wraith('#8aa8b8', '#5f7f90', '#e8fdff')], harpy: [harpy], harpynamed: [harpy, 1.2], merfolk: [merfolk, 1.1],
  ghostnpc: [F({ robe: 1, c1: '#b86a8a', c2: '#7a3a5a', c3: '#f1ece0', skin: SKIN[3], hair: '#4a2a1a', hairStyle: 'bun', thin: .85, wide: .82, jaw: .88, brow: .04, left: 'lantern' }), 1, { ghost: 1 }],
  abom: [F({ c1: '#6a3a3a', skin: '#a8a488', bare: 1, bareLegs: 1, skirt: .3, belly: 1.5, apron: '#7a2a2a', stitch: 1, hairStyle: 'bald', right: 'axe', weapK: 1.4, brow: -.2, jaw: 1.3, wide: 1.2, thin: 1.3, glowEyes: '#b6ff3a', mouth: 'grin' }), 1.38],
};
export const CLASSES = { bulwark: knight, elem: wizard, archer, knifeshade: rogue, cleric, bladewarden, warlock, druid, wardancer, monk, aegis, lifebinder, blightblade, bard, binder, illusionist };
export { THREE, wolf, uLine, A, J, tag, mat, shade, sph, cyl, cone, cap, box, tor, lathe, dome, ext, fac };

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
      if (!found) { found = 1; part = t; if ((t > 10 && t < 15) || t === 27 || (t > 30 && t < 35)) p2 = at(a); else { pv = at(a); break; } } else { pv = at(a); break; } }
    if (!p2) p2 = pv;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position, N = g.attributes.normal, c = o.material.color, glow = o.material.isMeshBasicMaterial ? 1.4 : (S.ghost ? .5 : 0);
    nm.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      pos.push(v.x, v.y, v.z); nor.push(n.x, n.y, n.z); col.push(c.r, c.g, c.b); piv.push(pv[0], pv[1], pv[2]); pv2.push(p2[0], p2[1], p2[2]); prt.push(part); glw.push(glow); }
  });
  const g = new THREE.BufferGeometry(), f = (a, m) => new THREE.Float32BufferAttribute(a, m);
  g.setAttribute('position', f(pos, 3)); g.setAttribute('normal', f(nor, 3)); g.setAttribute('color', f(col, 3)); g.setAttribute('pivot', f(piv, 3)); g.setAttribute('pivot2', f(pv2, 3)); g.setAttribute('part', f(prt, 1)); g.setAttribute('glow', f(glw, 1));
  g.computeBoundingSphere(); return g;
}
