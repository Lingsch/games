// Hunting zones: every spawn belongs to one zone. A dungeon is one big zone; out in the open,
// spawns that sit close together at similar levels form a zone, named for where it is.
import { world, regionAt, REGION_NAMES, depthAt } from './world.js';
import { MOBS } from './data.js';

const SITE_NAMES = { graveyard: 'The Old Graveyard', hollin: 'Little Hollin', choircamp: 'The Pale Choir Camp', shrine: 'The Choir Shrine', spiders: 'The Spider Hollow',
  tower: "Corwin's Tower", crag: 'Harpy Crag', deacon: "The Deacon's Camp", gristle: 'The Bone Field', waste: 'The Waste' };
const CAMP_NAMES = { bandit: 'Bandit Camp', orc: 'Orc Warcamp', choir: 'Pale Choir Camp', pirate: 'Pirate Camp' };
const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
const dirOf = (x, z) => DIRS[Math.round(((Math.atan2(x, -z) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI / 4)) % 8];
const mid = sp => (sp.lvl[0] + sp.lvl[1]) / 2;

export function defineHuntZones() {
  const sp = world.spawns, zones = [], key = new Array(sp.length).fill(-1);
  const add = (name, idx, dungeon) => {
    const z = { id: zones.length, name, idx, dungeon: !!dungeon };
    let cx = 0, cz = 0; for (const i of idx) { cx += sp[i].x; cz += sp[i].z; } z.x = cx / idx.length; z.z = cz / idx.length;
    z.r = Math.max(14, ...idx.map(i => Math.hypot(sp[i].x - z.x, sp[i].z - z.z) + 8));
    z.lvl = [Math.min(...idx.map(i => sp[i].lvl[0])), Math.max(...idx.map(i => sp[i].lvl[1]))];
    const counts = {}; for (const i of idx) if (!sp[i].named) counts[sp[i].mob] = (counts[sp[i].mob] || 0) + 1;
    z.mobs = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => MOBS[k]?.name || k).slice(0, 3);
    for (const i of idx) { key[i] = z.id; sp[i].hz = z.id; }
    zones.push(z); return z;
  };
  // the Sunken Fleet is one instance; dungeons are one zone each
  if (world.zone === 'fleet') { add('The Sunken Fleet', sp.map((_, i) => i), true); world.huntZones = zones; return zones; }
  const dung = sp.map((s, i) => s.dungeon ? i : -1).filter(i => i >= 0);
  if (dung.length) {
    const place = (world.places || []).find(p => p.kind === 'dungeon' && dung.some(i => Math.hypot(sp[i].x - p.x, sp[i].z - p.z) < p.R + 10));
    add(place ? place.name : world.zone === 'coast' ? 'The Sea Caves' : (world.names.ruin || 'The Dungeon'), dung, true);
  }
  // sites claim their own spawns first: named landmarks, then camps (spawns that share a camp tag)
  const SITE = { choircamp: [16], shrine: [16], deacon: [16], gristle: [12], spiders: [24, ['spider']], crag: [28, ['harpy', 'shrieka']], tower: [34, ['cultist', 'chanter']], hollin: [64, ['ghost']] };
  const sites = Object.entries(SITE).filter(([k]) => world.spots?.[k]).sort((a, b) => a[1][0] - b[1][0]);
  for (const [k, [R, mobs]] of sites) {
    const s0 = world.spots[k], idx = sp.map((s, i) => i).filter(i => key[i] < 0 && Math.hypot(sp[i].x - s0.x, sp[i].z - s0.z) < R && (!mobs || mobs.includes(sp[i].mob)));
    const camps = new Set(idx.map(i => sp[i].camp).filter(Boolean));
    for (let i = 0; i < sp.length; i++) if (key[i] < 0 && sp[i].camp && camps.has(sp[i].camp) && !idx.includes(i)) idx.push(i);
    if (idx.length >= 2) add(SITE_NAMES[k], idx, false);
  }
  const campIdx = {}; sp.forEach((s, i) => { if (key[i] < 0 && s.camp) (campIdx[s.camp] = campIdx[s.camp] || []).push(i); });
  const pending = [];
  for (const idx of Object.values(campIdx)) if (idx.length >= 3) { for (const i of idx) key[i] = -2; pending.push(idx); }
  // single-link clusters of the rest: close together, same part of the world, similar levels, and not chained too far
  const rest = sp.map((s, i) => i).filter(i => key[i] === -1);
  const comp = new Map(); let next = 0;
  for (const i of rest) {
    if (comp.has(i)) continue;
    const c = next++, stack = [i], seed = sp[i]; comp.set(i, c);
    while (stack.length) {
      const a = sp[stack.pop()];
      for (const j of rest) {
        if (comp.has(j)) continue; const b = sp[j];
        if (a.area !== b.area || Math.abs(mid(a) - mid(b)) > 2 || Math.abs(mid(seed) - mid(b)) > 2.5) continue;
        const wet = depthAt(a.x, a.z) > 1.2, wet2 = depthAt(b.x, b.z) > 1.2; if (wet !== wet2) continue;
        if (Math.hypot(a.x - b.x, a.z - b.z) < 30 && Math.hypot(seed.x - b.x, seed.z - b.z) < 140) { comp.set(j, c); stack.push(j); }
      }
    }
  }
  const groups = []; for (const [i, c] of comp) (groups[c] = groups[c] || []).push(i);
  // tiny clusters (a lone named, a stray) join the nearest group or zone in the same part of the world
  const big = [...pending, ...groups.filter(g => g && g.length >= 3)], small = groups.filter(g => g && g.length < 3);
  for (const g of small) {
    const s = sp[g[0]]; let best = null, bz = null, bd = 80;
    for (const b of big) for (const j of b) { const d = Math.hypot(sp[j].x - s.x, sp[j].z - s.z); if (d < bd && sp[j].area === s.area) { bd = d; best = b; bz = null; } }
    for (const z of zones) if (!z.dungeon && Math.hypot(z.x - s.x, z.z - s.z) < z.r + 20) for (const j of z.idx) { const d = Math.hypot(sp[j].x - s.x, sp[j].z - s.z); if (d < bd && sp[j].area === s.area) { bd = d; bz = z; best = null; } }
    if (best) best.push(...g);
    else if (bz) { for (const i of g) { bz.idx.push(i); key[i] = bz.id; sp[i].hz = bz.id; } bz.r = Math.max(bz.r, ...g.map(i => Math.hypot(sp[i].x - bz.x, sp[i].z - bz.z) + 8)); bz.lvl = [Math.min(bz.lvl[0], ...g.map(i => sp[i].lvl[0])), Math.max(bz.lvl[1], ...g.map(i => sp[i].lvl[1]))]; }
    else big.push(g);
  }
  // names: a place or site it sits in, a camp, else its part of the world and a compass point
  const named = big.map(g => {
    let cx = 0, cz = 0; for (const i of g) { cx += sp[i].x; cz += sp[i].z; } cx /= g.length; cz /= g.length;
    let name = null;
    if (g.some(i => sp[i].camp === 'chapel')) name = 'Hollin Chapel';
    if (!name) { const p = [...(world.places || []), ...(world.extraPlaces || [])].find(p => p.kind !== 'town' && p.kind !== 'dungeon' && Math.hypot(p.x - cx, p.z - cz) < p.R + 10); if (p) name = p.name; }
    if (!name) { const c = (world.camps || []).find(c => Math.hypot(c.x - cx, c.z - cz) < 16); if (c && CAMP_NAMES[c.kind]) name = CAMP_NAMES[c.kind]; }
    if (!name) { const wet = g.filter(i => depthAt(sp[i].x, sp[i].z) > 1.2).length > g.length / 2; name = wet ? 'The Open Sea' : REGION_NAMES()[regionAt(cx, cz)] || world.names.zone || 'The Wilds'; }
    return { g, name, cx, cz };
  });
  // the same name twice: tell them apart by where they sit relative to each other
  const byName = {};
  for (const n of named) (byName[n.name] = byName[n.name] || []).push(n);
  for (const list of Object.values(byName)) {
    if (list.length === 1) { add(list[0].name, list[0].g, false); continue; }
    const xs = list.map(n => n.cx), zs = list.map(n => n.cz), ew = Math.max(...xs) - Math.min(...xs) >= Math.max(...zs) - Math.min(...zs);
    list.sort((a, b) => ew ? a.cx - b.cx : a.cz - b.cz);
    const tags = list.length === 2 ? (ew ? ['west', 'east'] : ['north', 'south']) : list.length === 3 ? (ew ? ['west', 'central', 'east'] : ['north', 'central', 'south']) : list.map((_, i) => String(i + 1));
    list.forEach((n, i) => add(`${n.name} (${tags[i]})`, n.g, false));
  }
  world.huntZones = zones;
  return zones;
}
// the zone you're standing in: inside its circle, smallest first; or the nearest edge within 25
export function zoneAt(x, z) {
  const zs = world.huntZones || [];
  const inside = zs.filter(q => Math.hypot(q.x - x, q.z - z) < q.r).sort((a, b) => a.r - b.r);
  if (inside.length) return inside[0];
  let best = null, bd = 25;
  for (const q of zs) { const d = Math.hypot(q.x - x, q.z - z) - q.r; if (d < bd) { bd = d; best = q; } }
  return best;
}
