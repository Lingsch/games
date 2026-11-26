// Stars Beneath, Build 10: quality-of-life fixes carried over from the Single-Player MMO's Build 12.
// (The others are small edits in ui.js, settings.js, party8.js, combat.js, spell8.js and world.js.)
import { S, X, dist, rnd, TAU } from './core.js';
import { hgt, freeSpot, insideBuilding, wallNear } from './world.js';
// ---------- nobody inside a wall ----------
function unstick(e, strict) {
  if (!(insideBuilding(e.x, e.z) || (strict && wallNear(e.x, e.z, .35)))) return;
  const p = freeSpot(e.x, e.z, 1.5, 16, rnd(0, TAU), S.ents.filter(o => o !== e && !o.dead && (o.team === 'npc' || o.fake) && !o.prop && dist(o, e) < 20));
  e.x = e.rx = p.x; e.z = e.rz = p.z; e.y = hgt(p.x, p.z); if (e.home) e.home = { x: p.x, z: p.z }; if (e.holdAt) e.holdAt = { x: p.x, z: p.z };
}
const INSIDE = ['ship', 'halfway', 'board'];      // interiors are all walls; leave people where they were put
const fixable = e => !e.dead && !e.remove && !e.prop && !e.mob && !e.isHero && !e.inParty && !e.corpse && !e.pet && !e.mount && (e.team === 'npc' || e.fake || e.guard);
X.zone.push(() => { if (INSIDE.includes(S.zone)) return; setTimeout(() => { for (const e of S.ents) if (fixable(e)) unstick(e, !e.guard); }, 50); });
let uT = 0;
X.tick.push(dt => { if ((uT += dt) < 4) return; uT = 0; if (INSIDE.includes(S.zone)) return; for (const e of S.ents) if (fixable(e) && (e.fake || e.idle || e.wanders)) unstick(e, false); });
