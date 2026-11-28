// Puts the from-scratch people (artkit/models/people.js) into the MMO: the sixteen classes (a class kind is named
// <class><0-2>; the number picks a colourway) and the townsfolk and human-shaped enemies listed in FOLK.
import { CLASSES, FOLK, LOOKS, setStyle, bake, THREE, A, tag, mat, sph, cone, tor, box } from './models/people.js';
// What an area version of a person wears on top of the area's colours: gilded, a halo and gold shoulder caps;
// spectral, a ghost's pale glow with wisps about the head; ashen, embers rising off head and shoulders; verdant, moss and flowers.
// the head joint, the two shoulder joints, and how high the head and whatever is on it reach (in the head's own space)
function parts(fig) {
  fig.updateMatrixWorld(true); let H = null; const sh = [];
  fig.traverse(o => { const p = o.userData.part; if (p === 5 && !H && !o.isMesh) H = o; if ((p === 3 || p === 4) && !o.isMesh && !sh.some(s => s.userData.part === p)) sh.push(o); });
  if (!H) return { sh, top: .3 };
  const inv = H.matrixWorld.clone().invert(), bb = new THREE.Box3(), t = new THREE.Box3(), mx = new THREE.Matrix4();
  H.traverse(o => { if (!o.isMesh) return; o.geometry.computeBoundingBox(); bb.union(t.copy(o.geometry.boundingBox).applyMatrix4(mx.multiplyMatrices(inv, o.matrixWorld))); });
  return { H, sh, top: bb.isEmpty() ? .3 : bb.max.y };
}
function dress(fig, look) {
  const { H, sh, top } = parts(fig); if (!H) return;
  if (look === 'gilded') { A(H, tor(.17, .018), mat('#ffe27a', 1), 0, top + .08, 0, Math.PI / 2); for (const s of sh) { A(s, sph(.12), mat('#e8b838'), 0, .03, 0, 0, 0, 0, 1.15, .6, 1.15); A(s, sph(.035), mat('#fff2b0', 1), 0, .11, 0); } }
  else if (look === 'spectral') { for (let i = 0; i < 5; i++) tag(7, A(H, sph(.03 + (i % 2) * .012), mat('#bfefff', 1), Math.sin(i * 1.26) * .3, top - .12 + (i % 3) * .1, Math.cos(i * 1.26) * .3)); for (const s of sh) tag(7, A(s, sph(.03), mat('#bfefff', 1), 0, .16, -.06)); }
  else if (look === 'ashen') { for (let i = -1; i <= 1; i++) tag(7, A(H, cone(.03, .15 - Math.abs(i) * .04, 4), mat(i ? '#ff7a2a' : '#ffb347', 1), i * .08, top + .07, 0)); for (const s of sh) { tag(7, A(s, cone(.035, .16, 4), mat('#ff7a2a', 1), 0, .15, 0)); A(s, sph(.05), mat('#ff5a1a', 1), 0, .05, 0, 0, 0, 0, 1.2, .5, 1.2); } }
  else if (look === 'verdant') { for (const s of sh) { A(s, sph(.1), mat('#58a84a'), 0, .05, 0, 0, 0, 0, 1.3, .6, 1.3); A(s, sph(.035), mat('#f29ab8'), .04, .11, .04); A(s, sph(.03), mat('#ffe27a'), -.05, .1, 0); } for (const i of [-1, 1]) A(H, cone(.04, .16, 4), mat('#6ac85a'), i * .04, top + .06, 0, 0, 0, -i * .5, 1, 1, .4); A(H, sph(.035), mat('#f29ab8'), 0, top + .03, 0); }
}
// The game's three other peoples (mmo/js/race9.js): a class kind named <class><0-2>_<people>. Same class, same gear,
// their own skin and build, and their own features (the head's are in people.js raceFace).
const RACE = { varr: { skin: '#8a6a4a', sx: 1, sy: 1.04 }, grael: { skin: '#8a8478', sx: 1.1, sy: 1.1 }, sallow: { skin: '#a8b8bc', sx: .93, sy: .98 } }, skinOf = {};
function raceDress(fig, race) {
  const sh = [], lg = []; fig.traverse(o => { const q = o.userData.part; if (o.isMesh) return; if ((q === 3 || q === 4) && !sh.some(s => s.userData.part === q)) sh.push(o); if ((q === 1 || q === 2) && !lg.some(s => s.userData.part === q)) lg.push(o); });
  if (race === 'grael') { const q = parts(fig); if (q.H) { tag(7, A(q.H, cone(.045, .2, 4), mat('#ff8a3a', 1), 0, q.top + .12, 0)); A(q.H, cone(.045, .1, 4), mat('#ff8a3a', 1), 0, q.top - .02, 0, Math.PI); } for (const s of sh) A(s, box(.03, .12, .03), mat('#ff7a2a', 1), 0, .1, .11, .3, 0, .4); }
  if (race === 'grael') for (const s of sh) { A(s, sph(.14), mat('#6a6058'), 0, .08, -.02, .4, .3, 0, 1.1, .8, 1); A(s, sph(.07), mat('#7a7068'), .05, .16, .02); }
  if (race === 'varr' && lg.length === 2 && lg[0].parent === lg[1].parent) { const T = tag(6, new THREE.Group()); T.position.set(0, (lg[0].position.y + lg[1].position.y) / 2, Math.min(lg[0].position.z, lg[1].position.z) - .12); lg[0].parent.add(T); A(T, cone(.06, .62, 5), mat('#6a4a32'), 0, -.2, -.2, -2.3); A(T, sph(.07), mat('#3a2616'), 0, -.42, -.44); }
}
export function initClasses(G) {
  if (G.game !== 'mmo') return { setOn() { } };      // Stars Beneath gets its own sci-fi set later
  const HUE = [0, .1, -.16];
  const plain = { learn: null, race: null, skinTo: null, skinFrom: null };
  G.rigPlans.unshift((old, name, K, look) => {
    const f = FOLK[name], m = /^([a-z]+)(\d)(?:_(varr|grael|sallow))?$/.exec(name), cls = m && CLASSES[m[1]]; if (!f && !cls) return null;
    const ghost = look === 'spectral' || (f && f[2] && f[2].ghost) ? 1 : 0, race = !f && m[3] ? m[3] : null; let fig, k = 1.1;
    if (f) { setStyle({ ...plain, hue: 0, pal: null, ghost, ink: false, det: .34 }); fig = f[0](); k = 1.1 * (f[1] || 1); }
    else { const lk = LOOKS[m[1]], i = +m[2] % 3, st = { ...plain, hue: lk ? 0 : HUE[i], pal: lk ? lk[i] : null, ghost, ink: false, det: .34 };
      if (race && !skinOf[m[1]]) { const L = {}; setStyle({ ...st, learn: L }); cls(); skinOf[m[1]] = L.skin || '#e0ac86'; }
      setStyle(race ? { ...st, race, skinFrom: new THREE.Color(skinOf[m[1]]), skinTo: RACE[race].skin } : st); fig = cls(); if (race) raceDress(fig, race); }
    if (look) dress(fig, look);
    const geo = bake(fig, k); setStyle(plain);
    if (race) { const r = RACE[race]; for (const n of ['position', 'pivot', 'pivot2']) { const at = geo.attributes[n]; for (let i = 0; i < at.count; i++) at.setXYZ(i, at.getX(i) * r.sx, at.getY(i) * r.sy, at.getZ(i) * r.sx); } geo.computeBoundingSphere(); }
    if (look) { if (!ghost) G.rigTint(geo, look, .85); geo.userData.look = 1; } return geo;
  });
  return { setOn() { } };
}
