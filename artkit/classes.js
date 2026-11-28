// Puts the from-scratch people (artkit/models/people.js) into the MMO: the sixteen classes (a class kind is named
// <class><0-2>; the number picks a colourway) and the townsfolk and human-shaped enemies listed in FOLK.
import { CLASSES, FOLK, LOOKS, setStyle, bake, THREE, A, tag, mat, sph, cone, tor } from './models/people.js';
// What an area version of a person wears on top of the area's colours: gilded, a halo and gold shoulder caps;
// spectral, a ghost's pale glow with wisps about the head; ashen, embers rising off head and shoulders; verdant, moss and flowers.
function dress(fig, look) {
  fig.updateMatrixWorld(true); let H = null; const sh = [];
  fig.traverse(o => { const p = o.userData.part; if (p === 5 && !H && !o.isMesh) H = o; if ((p === 3 || p === 4) && !o.isMesh && !sh.some(s => s.userData.part === p)) sh.push(o); });
  if (!H) return;
  const inv = H.matrixWorld.clone().invert(), bb = new THREE.Box3(), t = new THREE.Box3(), mx = new THREE.Matrix4();
  H.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); bb.union(t.copy(o.geometry.boundingBox).applyMatrix4(mx.multiplyMatrices(inv, o.matrixWorld))); });
  const top = bb.isEmpty() ? .3 : bb.max.y;
  if (look === 'gilded') { A(H, tor(.17, .018), mat('#ffe27a', 1), 0, top + .08, 0, Math.PI / 2); for (const s of sh) { A(s, sph(.12), mat('#e8b838'), 0, .03, 0, 0, 0, 0, 1.15, .6, 1.15); A(s, sph(.035), mat('#fff2b0', 1), 0, .11, 0); } }
  else if (look === 'spectral') { for (let i = 0; i < 5; i++) tag(7, A(H, sph(.03 + (i % 2) * .012), mat('#bfefff', 1), Math.sin(i * 1.26) * .3, top - .12 + (i % 3) * .1, Math.cos(i * 1.26) * .3)); for (const s of sh) tag(7, A(s, sph(.03), mat('#bfefff', 1), 0, .16, -.06)); }
  else if (look === 'ashen') { for (let i = -1; i <= 1; i++) tag(7, A(H, cone(.03, .15 - Math.abs(i) * .04, 4), mat(i ? '#ff7a2a' : '#ffb347', 1), i * .08, top + .07, 0)); for (const s of sh) { tag(7, A(s, cone(.035, .16, 4), mat('#ff7a2a', 1), 0, .15, 0)); A(s, sph(.05), mat('#ff5a1a', 1), 0, .05, 0, 0, 0, 0, 1.2, .5, 1.2); } }
  else if (look === 'verdant') { for (const s of sh) { A(s, sph(.1), mat('#58a84a'), 0, .05, 0, 0, 0, 0, 1.3, .6, 1.3); A(s, sph(.035), mat('#f29ab8'), .04, .11, .04); A(s, sph(.03), mat('#ffe27a'), -.05, .1, 0); } for (const i of [-1, 1]) A(H, cone(.04, .16, 4), mat('#6ac85a'), i * .04, top + .06, 0, 0, 0, -i * .5, 1, 1, .4); A(H, sph(.035), mat('#f29ab8'), 0, top + .03, 0); }
}
export function initClasses(G) {
  if (G.game !== 'mmo') return { setOn() { } };      // Stars Beneath gets its own sci-fi set later
  const HUE = [0, .1, -.16];
  G.rigPlans.unshift((old, name, K, look) => {
    const f = FOLK[name], m = /^([a-z]+)(\d)$/.exec(name), cls = m && CLASSES[m[1]]; if (!f && !cls) return null;
    const ghost = look === 'spectral' || (f && f[2] && f[2].ghost) ? 1 : 0; let fig, k = 1.1;
    if (f) { setStyle({ hue: 0, pal: null, ghost, ink: false, det: .34 }); fig = f[0](); k = 1.1 * (f[1] || 1); }
    else { const lk = LOOKS[m[1]], i = +m[2] % 3; setStyle({ hue: lk ? 0 : HUE[i], pal: lk ? lk[i] : null, ghost, ink: false, det: .34 }); fig = cls(); }
    if (look) dress(fig, look);
    const geo = bake(fig, k); if (look) { if (!ghost) G.rigTint(geo, look, .85); geo.userData.look = 1; } return geo;
  });
  return { setOn() { } };
}
