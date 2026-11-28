// The model rig. It rebuilds each character model the games hand it into a jointed, rounded body:
// knees and elbows that bend, hands, feet, a face, shaped torsos. It reads the game's own model to do it,
// so a model keeps its colours, its size, and every hat, weapon, cloak and trinket it was given, and a model
// added to the game tomorrow is rebuilt the same way with no work here. Creature body plans are in creatures.js.
// The games' own model files are not touched; Settings > Graphics > New art puts the old models back.

// ---- the pose, run on the graphics card for every vertex. Parts 0-9 behave as the games define them.
const CALC = `void calcAnim(){
  float ph=aAnim.x, mv=clamp(aAnim.y,0.,1.), at=clamp(aAnim.z,0.,1.), atk=sin(at*3.14159), sit=step(1.5,aAnim.y);
  float idle=(1.-mv)*(1.-sit), br=sin(uTime*1.7+ph*.37), s=sin(ph), c=cos(ph);
  int p=int(part+.5); animR=mat3(1.); animP=mat3(1.); animT=vec3(0.);
  if(p==1) animR=rX(s*uAmp.x*mv - sit*1.4);
  else if(p==2) animR=rX(-s*uAmp.x*mv - sit*1.4);
  else if(p==11){ animP=rX(s*uAmp.x*mv - sit*1.4); animR=animP*rX(max(0.,-c)*uAmp.x*1.6*mv + sit*1.0 + .03); }
  else if(p==12){ animP=rX(-s*uAmp.x*mv - sit*1.4); animR=animP*rX(max(0.,c)*uAmp.x*1.6*mv + sit*1.0 + .03); }
  else if(p==3) animR=rX(-s*uAmp.y*mv - atk*uAmp.z*.25 + br*.04*idle);
  else if(p==4) animR=rX(s*uAmp.y*mv - atk*uAmp.z - br*.04*idle);
  else if(p==13){ animP=rX(-s*uAmp.y*mv - atk*uAmp.z*.25 + br*.04*idle); animR=animP*rX(-.22 - max(0.,-s)*uAmp.y*mv - atk*.25 - sit*.5); }
  else if(p==14){ animP=rX(s*uAmp.y*mv - atk*uAmp.z - br*.04*idle); animR=animP*rX(-.22 - max(0.,s)*uAmp.y*mv - atk*.35 - sit*.5); }
  else if(p==5) animR=rX(atk*uAmp.w + sin(ph*2.)*.06*mv)*rY(sin(uTime*.55+ph)*.14*idle);
  else if(p==6) animR=rY(sin(uTime*9.+ph)*.45);
  else if(p==8) animR=rZ(sin(uTime*26.+ph)*.7);
  else if(p==9) animR=rZ(-sin(uTime*26.+ph)*.7);
  else if(p==15) animR=rX(.05+mv*.42+sin(uTime*3.1+ph)*.06);
  else if(p>=21&&p<=24){ float o=(p==21||p==24)?0.:3.14159; animR=rX(sin(ph+o)*uAmp.x*mv); }
  else if(p>=31&&p<=34){ float o=(p==31||p==34)?0.:3.14159; animP=rX(sin(ph+o)*uAmp.x*mv); animR=animP*rX(max(0.,-cos(ph+o))*uAmp.x*1.4*mv*(p<33?1.:-1.)); }
  else if(p==25) animR=rY(sin(uTime*2.6+ph)*.3)*rX(-mv*.35+br*.05);
  else if(p==27){ animP=rX(atk*uAmp.w + sin(ph*2.)*.06*mv)*rY(sin(uTime*.55+ph)*.14*idle); animR=animP*rX(atk*.55+max(0.,br)*.08*idle); }
  else if(p==28) animR=rZ(sin(uTime*7.+ph)*.5+.12);
  else if(p==29) animR=rZ(-sin(uTime*7.+ph)*.5-.12);
  else if(p>=41&&p<=48){ float a=mod(float(p-41),2.)*3.14159, sd=p<45?1.:-1.; animR=rY(sin(ph+a)*.42*mv*sd)*rZ(-sd*max(0.,cos(ph+a))*.32*mv); }
  else if(p>=50&&p<=59){ float w=uTime*2.4+ph-float(p-50)*.85; animT.x=sin(w)*.1*(.35+mv); animR=rY(cos(w)*.28*(.35+mv)); }
  else if(p==60){ animT.y=sin(uTime*1.4+ph)*.07; }
  else if(p==61){ animT.y=sin(uTime*1.4+ph)*.07; animR=rX(sin(uTime*2.2+ph+pivot2.x*9.)*.2+mv*.3); }
}`;
function rigShader(sh) {
  sh.vertexShader = sh.vertexShader
    .replace('attribute float part; attribute vec3 pivot;', 'attribute float part; attribute vec3 pivot; attribute vec3 pivot2;')
    .replace('mat3 animR;', 'mat3 animR; mat3 animP; vec3 animT;')
    .replace(/void calcAnim\(\)\{[\s\S]*?\n\}/, CALC)
    .replace('vec3 transformed = animR*(position-pivot)+pivot;', 'vec3 transformed = animR*(position-pivot2)+animP*(pivot2-pivot)+pivot+animT;');
}

export function initRig(G) {
  const { THREE, R } = G;
  const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k], lin = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const DARK = lin('#14100c'), HAIR = ['#2b1d14', '#4a3220', '#7a5a34', '#c9a25a', '#8a8a8a', '#1a1a1a', '#a8482a', '#e2d6b5'].map(lin);

  // ---- shape tools. Everything is built around the y axis, then merged.
  function lathe(rings, seg = 12, n = 2) {   // rings: [y, cx, cz, rx, rz] from the bottom up; n > 2 squares the cross-section
    const p = [], idx = [], nr = rings.length;
    for (const [y, cx, cz, rx, rz] of rings) for (let s = 0; s < seg; s++) {
      const a = s / seg * Math.PI * 2, c = Math.cos(a), si = Math.sin(a);
      p.push(cx + Math.sign(c) * Math.abs(c) ** (2 / n) * rx, y, cz + Math.sign(si) * Math.abs(si) ** (2 / n) * rz);
    }
    for (let r = 0; r < nr - 1; r++) for (let s = 0; s < seg; s++) { const a = r * seg + s, b = r * seg + (s + 1) % seg; idx.push(a, a + seg, b, b, a + seg, b + seg); }
    const bot = p.length / 3; p.push(rings[0][1], rings[0][0], rings[0][2]); for (let s = 0; s < seg; s++) idx.push(bot, s, (s + 1) % seg);
    const top = bot + 1, L = rings[nr - 1]; p.push(L[1], L[0], L[2]); for (let s = 0; s < seg; s++) idx.push(top, (nr - 1) * seg + (s + 1) % seg, (nr - 1) * seg + s);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g.toNonIndexed();
  }
  // a limb segment from a to b (a above b), radius ra at a and rb at b, with a little muscle in between and rounded ends
  function limb(a, b, ra, rb, bulge = .1, seg = 8) {
    const d = new THREE.Vector3(a[0] - b[0], a[1] - b[1], a[2] - b[2]), L = d.length() || .001, rings = [], T = [-.12, 0, .25, .5, .75, 1, 1.12];
    for (const t of T) { const u = Math.min(1, Math.max(0, t)), r = (rb + (ra - rb) * u) * (1 + bulge * Math.sin(Math.PI * u)) * (t < 0 || t > 1 ? .78 : 1); rings.push([L * t, 0, 0, r, r]); }
    const g = lathe(rings, seg); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(b[0], b[1], b[2]); return g;
  }
  function ball(x, y, z, rx, ry = rx, rz = rx, w = 10, h = 7, fn) {
    const g = new THREE.SphereGeometry(1, w, h), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { let px = P.getX(i), py = P.getY(i), pz = P.getZ(i); if (fn) [px, py, pz] = fn(px, py, pz); P.setXYZ(i, x + px * rx, y + py * ry, z + pz * rz); }
    g.computeVertexNormals(); return g.toNonIndexed();
  }
  const box = (x, y, z, w, h, d, rz = 0) => { const g = new THREE.BoxGeometry(w, h, d); if (rz) g.rotateZ(rz); g.translate(x, y, z); return g.toNonIndexed(); };

  // ---- the model being written
  class Out {
    constructor() { this.pos = []; this.nor = []; this.col = []; this.piv = []; this.pv2 = []; this.prt = []; this.glw = []; }
    geo(g, part, piv, pv2, col, glow = 0, lo = .8) {     // lo: how dark the bottom of the piece is shaded
      const P = g.attributes.position.array, N = g.attributes.normal.array, n = P.length / 3; let y0 = 1e9, y1 = -1e9;
      for (let i = 0; i < n; i++) { const y = P[i * 3 + 1]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      for (let i = 0; i < n; i++) {
        const k = lo + (1.04 - lo) * ((P[i * 3 + 1] - y0) / (y1 - y0 || 1)), cc = typeof col === 'function' ? col(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], N[i * 3 + 1]) : col;
        this.pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); this.nor.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]);
        this.col.push(cc[0] * k, cc[1] * k, cc[2] * k); this.piv.push(piv[0], piv[1], piv[2]); this.pv2.push(pv2[0], pv2[1], pv2[2]); this.prt.push(part); this.glw.push(glow);
      }
      g.dispose();
    }
    keep(src, c, re) {   // a piece of the game's own model, carried over as it is
      const A = src.attributes, P = A.position.array, N = A.normal.array, Cc = A.color.array, V = A.pivot.array, Gw = A.glow.array;
      for (const t of c.tris) for (let i = t; i < t + 3; i++) {
        this.pos.push(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); this.nor.push(N[i * 3], N[i * 3 + 1], N[i * 3 + 2]); this.col.push(Cc[i * 3], Cc[i * 3 + 1], Cc[i * 3 + 2]);
        const pv = re?.piv || [V[i * 3], V[i * 3 + 1], V[i * 3 + 2]], p2 = re?.pv2 || pv;
        this.piv.push(pv[0], pv[1], pv[2]); this.pv2.push(p2[0], p2[1], p2[2]); this.prt.push(re?.part ?? c.part); this.glw.push(Gw[i]);
      }
    }
    build() {
      const g = new THREE.BufferGeometry(), f = (a, n) => new THREE.Float32BufferAttribute(a, n);
      g.setAttribute('position', f(this.pos, 3)); g.setAttribute('normal', f(this.nor, 3)); g.setAttribute('color', f(this.col, 3));
      g.setAttribute('pivot', f(this.piv, 3)); g.setAttribute('pivot2', f(this.pv2, 3)); g.setAttribute('part', f(this.prt, 1)); g.setAttribute('glow', f(this.glw, 1));
      g.computeBoundingSphere(); return g;
    }
  }

  // ---- reading the game's model: split it back into the separate pieces it was assembled from
  function split(geo) {
    const A = geo.attributes, pos = A.position.array, part = A.part.array, col = A.color.array, piv = A.pivot.array, glow = A.glow.array, n = A.position.count;
    const par = new Int32Array(n); for (let i = 0; i < n; i++) par[i] = i;
    const find = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    const seen = new Map();
    for (let i = 0; i < n; i++) {
      const k = part[i] + '|' + Math.round(pos[i * 3] * 400) + '|' + Math.round(pos[i * 3 + 1] * 400) + '|' + Math.round(pos[i * 3 + 2] * 400), j = seen.get(k);
      if (j === undefined) seen.set(k, i); else par[find(i)] = find(j);
    }
    for (let t = 0; t < n; t += 3) { const a = find(t); par[find(t + 1)] = a; par[find(t + 2)] = find(a); }
    const map = new Map();
    for (let t = 0; t < n; t += 3) {
      const r = find(t); let c = map.get(r);
      if (!c) map.set(r, c = { tris: [], part: Math.round(part[t]), min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9], col: [0, 0, 0], n: 0, first: t, piv: [piv[t * 3], piv[t * 3 + 1], piv[t * 3 + 2]], glow: glow[t] });
      c.tris.push(t);
      for (let v = t; v < t + 3; v++) { c.n++; for (let a = 0; a < 3; a++) { const q = pos[v * 3 + a]; if (q < c.min[a]) c.min[a] = q; if (q > c.max[a]) c.max[a] = q; c.col[a] += col[v * 3 + a]; } }
    }
    const out = [...map.values()].sort((a, b) => a.first - b.first);
    for (const c of out) { c.col = mul(c.col, 1 / c.n); c.size = [0, 1, 2].map(a => c.max[a] - c.min[a]); c.ctr = [0, 1, 2].map(a => (c.max[a] + c.min[a]) / 2); c.big = Math.max(...c.size); c.small = Math.min(...c.size); }
    return out;
  }
  // centre and half-widths of a piece's vertices between two heights
  function slice(geo, c, y0, y1) {
    const P = geo.attributes.position.array; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, k = 0;
    for (const t of c.tris) for (let i = t; i < t + 3; i++) { const y = P[i * 3 + 1]; if (y < y0 || y > y1) continue; k++; const x = P[i * 3], z = P[i * 3 + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    return k ? { x: (x0 + x1) / 2, z: (z0 + z1) / 2, rx: (x1 - x0) / 2, rz: (z1 - z0) / 2 } : null;
  }
  function axis(geo, c) {
    const P = geo.attributes.position.array, m = [0, 0, 0]; let n = 0;
    for (const t of c.tris) for (let i = t; i < t + 3; i++) { m[0] += P[i * 3]; m[1] += P[i * 3 + 1]; m[2] += P[i * 3 + 2]; n++; }
    m[0] /= n; m[1] /= n; m[2] /= n; const S = [0, 0, 0, 0, 0, 0];
    for (const t of c.tris) for (let i = t; i < t + 3; i++) { const x = P[i * 3] - m[0], y = P[i * 3 + 1] - m[1], z = P[i * 3 + 2] - m[2]; S[0] += x * x; S[1] += x * y; S[2] += x * z; S[3] += y * y; S[4] += y * z; S[5] += z * z; }
    let v = [.3, 1, .2]; for (let k = 0; k < 24; k++) { const w = [S[0] * v[0] + S[1] * v[1] + S[2] * v[2], S[1] * v[0] + S[3] * v[1] + S[4] * v[2], S[2] * v[0] + S[4] * v[1] + S[5] * v[2]], l = Math.hypot(...w) || 1; v = [w[0] / l, w[1] / l, w[2] / l]; }
    const u = new THREE.Vector3(...v), p1 = new THREE.Vector3(1, 0, 0); if (Math.abs(u.x) > .8) p1.set(0, 0, 1); p1.cross(u).normalize(); const p2 = new THREE.Vector3().crossVectors(u, p1);
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9, c0 = 1e9, c1 = -1e9;
    for (const t of c.tris) for (let i = t; i < t + 3; i++) { const x = P[i * 3] - m[0], y = P[i * 3 + 1] - m[1], z = P[i * 3 + 2] - m[2], pa = x * u.x + y * u.y + z * u.z, pb = x * p1.x + y * p1.y + z * p1.z, pc = x * p2.x + y * p2.y + z * p2.z; a0 = Math.min(a0, pa); a1 = Math.max(a1, pa); b0 = Math.min(b0, pb); b1 = Math.max(b1, pb); c0 = Math.min(c0, pc); c1 = Math.max(c1, pc); }
    const e0 = [m[0] + v[0] * a0, m[1] + v[1] * a0, m[2] + v[2] * a0], e1 = [m[0] + v[0] * a1, m[1] + v[1] * a1, m[2] + v[2] * a1];
    return { e0, e1, len: a1 - a0, w: Math.min(b1 - b0, c1 - c0), W: Math.max(b1 - b0, c1 - c0) };
  }
  const organic = c => { const mx = Math.max(...c), mn = Math.min(...c), sat = (mx - mn) / (mx || 1); return mx > .04 && ((c[0] >= c[1] && c[1] >= c[2] * .95 && sat > .1) || (c[1] > c[0] && c[1] > c[2] && sat > .15)); };   // skin, bone, hide: not grey steel, not black

  function isBox(geo, c) {
    if (c.n !== 36) return false; const P = geo.attributes.position.array;
    for (const t of c.tris) for (let i = t; i < t + 3; i++) for (let a = 0; a < 3; a++) { const q = P[i * 3 + a]; if (Math.abs(q - c.min[a]) > 2e-3 && Math.abs(q - c.max[a]) > 2e-3) return false; }
    return true;
  }
  const pad = (c, w = 8, h = 5) => ball(c.ctr[0], c.ctr[1], c.ctr[2], c.size[0] / 2, c.size[1] / 2, c.size[2] / 2, w, h, (x, y, z) => [Math.sign(x) * Math.abs(x) ** .5, Math.sign(y) * Math.abs(y) ** .5, Math.sign(z) * Math.abs(z) ** .5]);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  G.rigTools = { lathe, limb, ball, box, Out, split, slice, axis, isBox, pad, dist, mul, mix, lin, organic, DARK };

  // ---- a person: anything with two arms and a head, standing upright
  function person(old, name) {
    const C = split(old), by = p => C.filter(c => c.part === p);
    if (!by(3).length || !by(4).length || !by(5).length) return null;
    old.computeBoundingBox(); const bb = old.boundingBox; if (bb.max.y < 1.2 || bb.max.z - bb.min.z > 2.3) return null;
    const out = new Out(), drop = new Set(), re = new Map(); let did = 0, seed = 0; for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;

    // head first: its colour is the skin
    let skin = null, face = null;
    { const H = by(5), hd = H.find(c => c.n >= 36 && c.big / Math.max(.01, c.small) < 1.7 && c.big > .16 && c.big < .7);
      if (hd && organic(hd.col)) {
        const r = hd.big / 2, rh = r * .99, [cx, cy, cz] = hd.ctr, pv = hd.piv; skin = hd.col; drop.add(hd);
        for (const c of H) if (c !== hd && c.big < r * .7 && !c.glow && [0, 1, 2].every(a => c.min[a] >= hd.min[a] - r * .15 && c.max[a] <= hd.max[a] + r * .15)) drop.add(c);
        const rest = H.filter(c => !drop.has(c));
        const covered = rest.some(c => c.max[2] > cz + r * .7 && c.min[1] < cy + r * .3 && c.max[1] > cy - r * .3 && c.min[0] < cx + r * .4 && c.max[0] > cx - r * .4);
        const live = organic(skin);
        out.geo(ball(cx, cy + rh * .03, cz, rh, rh * 1.07, rh * 1.0, 12, 9, (x, y, z) => y < 0 ? [x * (1 + y * .32), y, z * (1 + y * .12) + (y < -.3 ? .06 : 0)] : [x, y, z]), 5, pv, pv, skin, 0, .86);
        out.geo(limb([cx, cy - rh * .8, cz - rh * .1], [cx, cy - rh * 1.75, cz - rh * .1], rh * .45, rh * .5, 0, 8), 0, [0, 0, 0], [0, 0, 0], mul(skin, .92));
        if (live && !covered) {
          const brow = rest.length ? mul(skin, .35) : HAIR[seed % HAIR.length], ez = cz + rh * .9;
          for (const s of [-1, 1]) {
            out.geo(ball(cx + s * rh * .36, cy + rh * .1, ez, rh * .13, rh * .17, rh * .08, 6, 5), 5, pv, pv, DARK, 0, 1);
            out.geo(box(cx + s * rh * .36, cy + rh * .34, ez + rh * .02, rh * .34, rh * .07, rh * .08, -s * .16), 5, pv, pv, brow, 0, 1);
            out.geo(ball(cx + s * rh * .98, cy + rh * .02, cz, rh * .1, rh * .2, rh * .14, 6, 5), 5, pv, pv, mul(skin, .9), 0, 1);
          }
          out.geo(ball(cx, cy - rh * .12, cz + rh * 1.02, rh * .12, rh * .2, rh * .16, 6, 5), 5, pv, pv, mul(skin, .93), 0, 1);
          out.geo(box(cx, cy - rh * .52, cz + rh * .88, rh * .36, rh * .05, rh * .06), 5, pv, pv, mul(skin, .45), 0, 1);
          if (!rest.length) out.geo(ball(cx, cy + rh * .16, cz - rh * .12, rh * 1.1, rh * 1.14, rh * 1.1, 12, 8, (x, y, z) => (y < -.15 && z > -.2) ? [x * .9, -.15, z * .9] : [x, y, z]), 5, pv, pv, HAIR[seed % HAIR.length], 0, .8);
        }
        face = { cy, rh }; did++;
      } }
    if (!skin) skin = lin('#d8a878');
    const flesh = organic(skin);

    // legs: thigh, shin that bends at the knee, boot and foot
    let hipY = .85;
    const legOf = p => { const L = by(p); if (!L.length) return null; const m = L.reduce((a, b) => b.size[1] > a.size[1] ? b : a), len = m.max[1] - Math.max(0, m.min[1]);
      return (len < .3 || m.size[1] < 1.5 * Math.max(m.size[0], m.size[2]) || m.small < .07 * (m.piv[1] / .85)) ? null : m; };
    const legs = [legOf(1), legOf(2)];
    for (const p of (legs[0] && legs[1]) ? [1, 2] : []) {
      const L = by(p), m = legs[p - 1], bot = Math.max(0, m.min[1]), top = m.max[1], len = top - bot;
      const r = Math.max(.05, Math.min(m.size[0], m.size[2]) * .5), cx = m.ctr[0], cz = m.ctr[2], knee = [cx, bot + len * .5, cz], pv = m.piv; hipY = pv[1];
      let boot = null; for (const c of L) if (c !== m && !c.glow && c.ctr[1] < bot + len * .3 && c.big < len * .8) { drop.add(c); if (!boot || c.n > boot.n) boot = c; }
      const bc = boot ? boot.col : mul(m.col, .5); drop.add(m);
      out.geo(limb([cx, top + r * .25, cz], knee, r * 1.14, r * .94, .1), p, pv, pv, m.col);
      out.geo(limb(knee, [cx, bot + r * .7, cz], r * .92, r * .7, .14), p + 10, pv, knee, m.col);
      out.geo(limb([cx, bot + len * .27, cz], [cx, bot + r * .45, cz], r * .86, r * .8, .04), p + 10, pv, knee, bc, 0, .9);
      out.geo(ball(cx, bot + r * .5, cz + r * .7, r * .9, r * .62, r * 1.75, 8, 6, (x, y, z) => [x, Math.max(y, -.78), z]), p + 10, pv, knee, bc, 0, .7);
      for (const c of L) if (!drop.has(c) && c.ctr[1] < knee[1]) re.set(c, { part: p + 10, pv2: knee });
      did++;
    }
    const sc = hipY / .85;

    // arms: shoulder, upper arm, forearm that bends at the elbow, hand. Whatever the hand held goes with the forearm.
    for (const p of [3, 4]) {
      const A = by(p); let m = null, ax = null;
      for (const c of A) { if (c.n < 24 || c.glow || c.big < .3 * sc || c.big > 1.2 * sc) continue; const x = axis(old, c);
        if (x.len < .3 * sc || x.len < 1.8 * x.W || x.w < .04 * sc || x.W > .3 * sc || x.W > 2.4 * x.w || Math.min(dist(x.e0, c.piv), dist(x.e1, c.piv)) > .24 * sc) continue;
        if (!ax || x.len > ax.len) { m = c; ax = x; } }
      if (!m) continue;
      const near = dist(ax.e0, m.piv) < dist(ax.e1, m.piv), r = Math.min(.14 * sc, Math.max(.045 * sc, ax.w * .5)), ta = near ? ax.e0 : ax.e1, tb = near ? ax.e1 : ax.e0;
      const dir = [0, 1, 2].map(i => (tb[i] - ta[i]) / ax.len), top = ta.map((q, i) => q + dir[i] * r * .4), end = tb.map((q, i) => q - dir[i] * r * .5);
      const elbow = [0, 1, 2].map(i => (top[i] + end[i]) / 2), pv = m.piv; drop.add(m);
      let hc = flesh ? skin : m.col;
      for (const c of A) if (c !== m && !c.glow && c.big < .22 * sc && Math.hypot(c.ctr[0] - end[0], c.ctr[1] - end[1], c.ctr[2] - end[2]) < .13 * sc) { drop.add(c); hc = c.col; }
      out.geo(ball(top[0], top[1], top[2], r * 1.3, r * 1.2, r * 1.3, 8, 6), p, pv, pv, m.col, 0, .9);
      out.geo(limb(top, elbow, r * 1.08, r * .92, .14), p, pv, pv, m.col);
      out.geo(limb(elbow, end.map((q, i) => q - dir[i] * r * .5), r * .9, r * .68, .12), p + 10, pv, elbow, m.col);
      out.geo(ball(end[0] + dir[0] * r * .1, end[1] + dir[1] * r * .1, end[2] + dir[2] * r * .1, r * .8, r * .95, r * .85, 8, 6), p + 10, pv, elbow, hc, 0, .88);
      for (const c of A) if (!drop.has(c) && dist(c.ctr, end) < dist(c.ctr, top)) re.set(c, { part: p + 10, pv2: elbow });
      did++;
    }

    // body: every solid block of the old torso becomes a rounded, shaped form of the same size and colour
    for (const c of by(0)) {
      if (c.glow || c.n < 24 || Math.abs(c.ctr[0]) > .14 * sc || Math.abs(c.ctr[2]) > .18 * sc) {
        // a cloak hangs from its top edge and trails when its wearer moves
        if (!c.glow && c.size[2] < .12 * sc && c.ctr[2] < -.1 * sc && c.size[1] > .5 * sc && c.size[0] > .25 * sc) { const t = [c.ctr[0], c.max[1], c.ctr[2]]; re.set(c, { part: 15, piv: t, pv2: t }); }
        continue;
      }
      if (c.size[0] < .25 * sc || c.size[1] < .2 * sc || c.size[2] < .15 * sc || c.ctr[1] < .3 * sc || c.size[1] > 2.4 * sc) continue;
      const h = c.size[1], lo = slice(old, c, c.min[1], c.min[1] + h * .22), hi = slice(old, c, c.max[1] - h * .22, c.max[1]), mid = slice(old, c, c.min[1] + h * .35, c.max[1] - h * .35);
      if (!lo || !hi) continue;
      const robe = c.min[1] < .4 * sc && h > .7 * sc, tall = !robe && h > .5 * sc, boxy = c.n <= 36, rings = [], K = 8;
      for (let i = 0; i <= K; i++) {
        const t = i / K, q = (a, b, m) => m ? (t < .5 ? a + (m - a) * t * 2 : m + (b - m) * (t - .5) * 2) : a + (b - a) * t;
        let rx = q(lo.rx, hi.rx, mid && mid.rx), rz = q(lo.rz, hi.rz, mid && mid.rz), kx = 1, kz = 1;
        if (robe) { const w = Math.exp(-((t - .62) ** 2) / .012); kx = kz = 1 - .1 * w; if (t > .8) { kx *= 1 + (t - .8) * 1.1; } }
        else if (tall) { kx = 1 - .15 * Math.exp(-((t - .42) ** 2) / .03) + .12 * Math.exp(-((t - .84) ** 2) / .02); kz = 1 - .1 * Math.exp(-((t - .42) ** 2) / .03) + .06 * Math.exp(-((t - .75) ** 2) / .03); }
        else kx = kz = 1 + .04 * Math.sin(Math.PI * t);
        rings.push([c.min[1] + h * t, c.ctr[0], c.ctr[2], Math.max(.02, rx * kx), Math.max(.02, rz * kz)]);
      }
      const T = rings[K], B = rings[0];
      rings.push([T[0] + T[3] * .16, T[1], T[2], T[3] * .72, T[4] * .72]); if (!robe) rings.unshift([B[0] - B[3] * .1, B[1], B[2], B[3] * .78, B[4] * .78]);
      drop.add(c); out.geo(lathe(rings, 14, boxy ? 3.2 : 2), 0, c.piv, c.piv, c.col, 0, robe ? .7 : .84); did++;
    }
    if (did < 2) return null;
    for (const c of C) if (!drop.has(c)) {
      const q = re.get(c);
      if (!c.glow && c.big > .2 * sc && c.small > .07 * sc && isBox(old, c)) { const pv = q?.piv || c.piv; out.geo(pad(c), q?.part ?? c.part, pv, q?.pv2 || pv, c.col, 0, .88); }
      else out.keep(old, c, q);
    }
    return out.build();
  }

  // ---- swapping models in and out
  const plans = [person];
  G.rigPlans = plans;             // creatures.js adds its body plans here, ahead of the people plan
  function patch(m) {
    const a0 = m.userData.art0 || (m.userData.art0 = { obc: m.onBeforeCompile, key: m.customProgramCacheKey });
    if (!a0.rig) {
      const o = a0.obc, kf = a0.key; a0.rig = 1;
      a0.obc = function (sh, r) { o.call(this, sh, r); if (m.userData.rigOn) rigShader(sh); };
      a0.key = function () { return (kf ? kf.call(this) : '') + (m.userData.rigOn ? 'R' : ''); };
      if (m.onBeforeCompile === o) { m.onBeforeCompile = a0.obc; m.customProgramCacheKey = a0.key; }
    }
  }
  function setRig(K, v) {
    const g = v ? K.artRig.geo : K.artRig.old; K.mesh.geometry = g; K.ol.geometry = g;
    for (const m of [K.mesh.material, K.ol.material]) { patch(m); m.userData.rigOn = v ? 1 : 0; m.needsUpdate = true; }
    K.artSh = 0;                  // the lighting module rebuilds this model's shadow material to match
  }
  function rigKind(K, k) {
    const old = K.mesh.geometry; K.artRig = { old };
    if (old.index || !old.attributes.part || !old.attributes.aAnim) { K.artRig.skip = 1; return; }
    let geo = null;
    for (const plan of plans) { try { geo = plan(old, k, K); } catch (e) { console.warn('art: model', k, e); } if (geo) break; }
    if (!geo) { K.artRig.skip = 1; return; }
    geo.setAttribute('aAnim', old.attributes.aAnim); K.artRig.geo = geo; setRig(K, 1);
  }
  // On Graphics: Low (chosen, or stepped down to because the frame rate stayed low) the games' lighter models are used.
  let on = false, raf = 0, live = true;
  const all = v => { for (const k in R.kinds) { const K = R.kinds[k]; if (K.artRig && K.artRig.geo) setRig(K, v); } };
  function tick() {
    raf = requestAnimationFrame(tick); let budget = 3;
    const want = G.quality() !== 'low'; if (want !== live) { live = want; all(want); }
    if (!live) return;
    for (const k in R.kinds) { const K = R.kinds[k]; if (!K.artRig && K.n > 0) { rigKind(K, k); if (--budget <= 0) break; } }
  }
  function setOn(v) {
    v = !!v; if (v === on) return; on = v; cancelAnimationFrame(raf);
    if (v) { live = G.quality() !== 'low'; all(live); tick(); } else all(false);
  }
  G.rigAdopt = K => { K.artRig = { old: K.mesh.geometry, geo: K.mesh.geometry }; setRig(K, on && live ? 1 : 0); };   // a kind built by the art layer itself
  return { setOn, rigKind, person, split };
}
