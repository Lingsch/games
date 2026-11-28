// Creature body plans for the model rig (rig.js). Like the people plan, each one reads the game's own model
// and rebuilds it: same size, same colours, same glowing eyes and extras, on a better body.
//   quad  four-legged beasts: shaped body, shoulder and haunch, legs that bend, paws, muzzle, jaw, tail
//   soft  everything else that moves: blocks become rounded forms and long blocks become tapered limbs
export function initCreatures(G) {
  const { lathe, limb, ball, Out, split, axis, isBox, pad, dist, mul, mix, DARK } = G.rigTools;
  const vol = c => c.size[0] * c.size[1] * c.size[2];

  function quad(old, name) {
    const C = split(old), by = p => C.filter(c => c.part === p);
    if (by(3).length || by(4).length || !by(1).length || !by(2).length) return null;
    const body = by(0).filter(c => !c.glow && c.n >= 24).sort((a, b) => vol(b) - vol(a))[0];
    old.computeBoundingBox(); if (!body || body.size[2] < 1.25 * body.size[1] || old.boundingBox.max.y > 1.95) return null;
    const corner = new Map(); let nlegs = 0;
    for (const p of [1, 2]) for (const c of by(p)) {
      if (c.glow || c.n < 24 || c.size[1] < .2 || c.size[1] < 1.3 * Math.max(c.size[0], c.size[2])) continue;
      nlegs++; const k = p + (c.ctr[0] > 0 ? 'R' : 'L') + (c.ctr[2] > body.ctr[2] ? 'F' : 'B'), o = corner.get(k); if (!o || c.size[1] > o.size[1]) corner.set(k, c);
    }
    if (corner.size !== 4 || nlegs !== 4) return null;
    const out = new Out(), drop = new Set(), re = new Map(), fur = body.col;
    const under = by(0).find(c => c !== body && !c.glow && c.n >= 24 && c.size[2] > .5 * body.size[2] && c.ctr[1] < body.ctr[1] && Math.abs(c.ctr[0]) < .05);
    const belly = under ? under.col : mul(fur, 1.15); if (under) drop.add(under);
    const bear = /bear|mauler/.test(name), boar = /boar/.test(name);

    { // body, built along its length: rump, haunch, waist, chest, shoulder
      const L = body.size[2] * 1.04, rx = body.size[0] / 2, ry = body.size[1] / 2, [cx, cy, cz] = body.ctr;
      const prof = bear ? [[0, .5, .55], [.08, .92, .9], [.28, 1.1, 1.05], [.52, 1.02, .98], [.76, 1.14, 1.12], [.93, .92, .96], [1, .5, .6]]
        : boar ? [[0, .42, .48], [.1, .84, .84], [.34, .96, .92], [.58, 1.0, 1.0], [.8, 1.16, 1.2], [.94, .96, 1.0], [1, .5, .6]]
          : [[0, .38, .42], [.09, .84, .86], [.28, .96, .92], [.5, .8, .8], [.74, 1.1, 1.12], [.92, .9, .96], [1, .48, .55]];
      const g = lathe(prof.map(([t, kx, ky]) => [L * t, 0, 0, rx * kx, ry * ky]), 12); g.rotateX(Math.PI / 2); g.translate(cx, cy, cz - L / 2);
      out.geo(g, 0, body.piv, body.piv, (x, y, z, ny) => ny < -.4 ? belly : fur, 0, .94); drop.add(body);
    }
    for (const [k, m] of corner) { // legs: two pairs that trot in turn
      const front = k.endsWith('F'), id = m.part === 1 ? (front ? 21 : 24) : (front ? 22 : 23), bot = Math.max(0, m.min[1]), top = m.max[1], len = top - bot;
      const r = Math.max(.04, Math.min(m.size[0], m.size[2]) * .5), cx = m.ctr[0], cz = m.ctr[2], pv = m.piv, knee = [cx, bot + len * .46, cz + (front ? .25 : -.5) * r];
      out.geo(limb([cx * .92, top + r * .5, cz], knee, r * (front ? 1.35 : 1.6), r * .85, .16), id, pv, pv, fur);
      out.geo(limb(knee, [cx, bot + r * .5, cz], r * .8, r * .6, .06), id + 10, pv, knee, fur);
      out.geo(ball(cx, bot + r * .45, cz + r * .4, r * .95, r * .6, r * 1.3, 8, 6, (x, y, z) => [x, Math.max(y, -.75), z]), id + 10, pv, knee, mul(fur, .68), 0, .8);
      for (const c of by(m.part)) {
        if (c === m || c.glow || Math.sign(c.ctr[0]) !== Math.sign(cx) || Math.abs(c.ctr[2] - cz) > Math.max(r * 3, .2)) continue;
        if (c.ctr[1] < bot + len * .3 && c.big < len) drop.add(c); else re.set(c, c.ctr[1] < knee[1] ? { part: id + 10, pv2: knee } : { part: id });
      }
      drop.add(m);
    }
    { // head: skull, muzzle, a jaw that opens to bite, nose. Ears, tusks and glowing eyes are kept from the game's model.
      const H = by(5).filter(c => !c.glow && c.n >= 24), sk = H.sort((a, b) => vol(b) - vol(a))[0];
      if (sk && sk.ctr[2] > body.ctr[2] + body.size[2] * .3) {
        const pv = sk.piv, [cx, cy, cz] = sk.ctr, hx = sk.size[0] / 2, hy = sk.size[1] / 2, hz = sk.size[2] / 2;
        const sn = H.find(c => c !== sk && c.ctr[2] > cz + hz * .5 && c.ctr[1] < cy + hy && vol(c) > vol(sk) * .04);
        const tip = sn ? sn.max[2] : cz + hz + hz * (bear ? .7 : boar ? 1.5 : 1.3), sx = sn ? sn.size[0] / 2 : hx * .5, sy = sn ? sn.size[1] / 2 : hy * .45, my = sn ? sn.ctr[1] : cy - hy * .25;
        const snc = sn ? sn.col : mix(fur, [1, 1, 1], .1), z0 = cz + hz * .3, ml = tip - z0;
        drop.add(sk); if (sn) drop.add(sn);
        out.geo(ball(cx, cy, cz, hx * 1.04, hy * 1.04, hz * 1.08, 12, 8), 5, pv, pv, sk.col, 0, .9);
        let g = lathe([[0, 0, 0, sx * 1.5, sy * 1.25], [ml * .5, 0, 0, sx * 1.12, sy * .9], [ml * .9, 0, 0, sx * .9, sy * .7], [ml, 0, 0, sx * .5, sy * .4]], 10); g.rotateX(Math.PI / 2); g.translate(cx, my + sy * .35, z0);
        out.geo(g, 5, pv, pv, snc, 0, .9);
        const hinge = [cx, my - sy * .35, z0 + ml * .1];
        g = lathe([[0, 0, 0, sx * 1.2, sy * .5], [ml * .55, 0, 0, sx * .95, sy * .42], [ml * .86, 0, 0, sx * .6, sy * .3]], 8); g.rotateX(Math.PI / 2); g.translate(cx, my - sy * .62, z0);
        out.geo(g, 27, pv, hinge, mul(snc, .8), 0, .9);
        out.geo(ball(cx, my + sy * .62, tip - sx * .2, sx * .42, sy * .36, sx * .4, 6, 5), 5, pv, pv, DARK, 0, 1);
        if (!by(5).some(c => c.glow)) for (const s of [-1, 1]) out.geo(ball(cx + s * hx * .62, cy + hy * .28, cz + hz * .72, hx * .16, hy * .18, hz * .12, 6, 5), 5, pv, pv, DARK, 0, 1);
      }
    }
    { // tail: one tapered piece that swings
      const Tl = by(6).filter(c => !c.glow && c.n >= 24).sort((a, b) => b.big - a.big)[0];
      if (Tl) { const x = axis(old, Tl), near = dist(x.e0, Tl.piv) < dist(x.e1, Tl.piv), a = near ? x.e0 : x.e1, b = near ? x.e1 : x.e0, r = Math.max(.03, (x.w + x.W) / 4);
        drop.add(Tl); out.geo(limb(a, b, r * 1.1, r * .35, boar ? 0 : .7, 8), 25, Tl.piv, Tl.piv, Tl.col); for (const c of by(6)) if (c !== Tl && !c.glow && vol(c) < vol(Tl)) drop.add(c); }
    }
    for (const c of C) if (!drop.has(c)) out.keep(old, c, re.get(c));
    return out.build();
  }

  // anything else that moves: spiders, wasps, crabs, sharks, wraiths, elementals, treants, drones, aliens
  function soft(old, name) {
    const C = split(old); if (!C.some(c => c.part !== 0)) return null;
    old.computeBoundingBox(); const H = old.boundingBox.max.y, out = new Out(); let did = 0;
    for (const c of C) {
      if (c.glow || c.n !== 36 || c.big < .06 * H) { out.keep(old, c); continue; }
      const x = axis(old, c);
      if (x.len > 2.2 * x.W && x.W > .012 * H) {
        const near = dist(x.e0, c.piv) < dist(x.e1, c.piv), a = near ? x.e0 : x.e1, b = near ? x.e1 : x.e0, r = (x.w + x.W) / 4;
        out.geo(limb(a, b, r * 1.12, r * .72, .12, 6), c.part, c.piv, c.piv, c.col); did++;
      } else if (isBox(old, c) && c.small > .02 * H) { out.geo(pad(c, 10, 6), c.part, c.piv, c.piv, c.col, 0, .86); did++; }
      else out.keep(old, c);
    }
    return did ? out.build() : null;
  }
  G.rigPlans.unshift(quad); G.rigPlans.push(soft);
  return { setOn() { } };
}
