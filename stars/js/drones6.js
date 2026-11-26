// Stars Beneath, Build 7: the old power, wired in. The eight light and dark classes keep their art, but now carry
// it the way this century carries everything: a lamp core (or dusk core) in a pack on the back, and an order drone
// flying at the shoulder that covers whatever its owner cannot do. The healer's drone shoots, the two damage
// classes' drones take the hits, and the knight's drone mends.
import { S, X } from './core.js';
import { CLASSES, PETS } from './data.js';
import { addKinds } from './render.js';
import { build, P, T, Box, Cyl, Cone, Sph, Oct } from './models.js';
import * as THREE from './three.js';
import * as Cb from './combat.js';
const O = [0, 0, 0], LR = [1, -1];
const droneGeo = (shell, trim, glow, role) => { const Y = 1.5, parts = [P(T(Sph(.3, 9, 7), 0, Y, 0, 0, 0, 0, 1, .8, 1.15), 0, O, shell), P(T(Sph(.11, 6, 5), 0, Y + .02, .3), 0, O, glow, 3), P(T(Box(.5, .05, .3), 0, Y + .24, -.05), 0, O, trim),
    P(T(new THREE.TorusGeometry(.46, .03, 4, 14), 0, Y + .34, 0, Math.PI / 2), 6, [0, Y + .34, 0], glow, 2.2), P(T(Cone(.1, .26, 5), 0, Y - .34, 0, Math.PI), 0, O, glow, 2), ...LR.map(s => P(T(Box(.08, .14, .4), .32 * s, Y - .02, 0), 0, O, trim))];
  if (role === 'dps') parts.push(...LR.map(s => P(T(Cyl(.035, .035, .5, 5), .32 * s, Y - .04, .3, Math.PI / 2), 0, O, '#2a2e34')), ...LR.map(s => P(T(Sph(.04, 4, 3), .32 * s, Y - .04, .56), 0, O, glow, 2.6)));
  if (role === 'tank') parts.push(P(T(Box(.9, .8, .06), 0, Y, .44), 0, O, glow, .9), P(T(Box(1, .08, .08), 0, Y + .42, .44), 0, O, trim), P(T(Box(1, .08, .08), 0, Y - .42, .44), 0, O, trim), P(T(Sph(.34, 8, 6), 0, Y, -.1, 0, 0, 0, 1.2, 1, 1), 0, O, shell));
  if (role === 'healer') parts.push(P(T(Box(.36, .1, .04), 0, Y, .42), 0, O, glow, 3), P(T(Box(.1, .36, .04), 0, Y, .42), 0, O, glow, 3), ...LR.map(s => P(T(Cyl(.02, .02, .4, 4), .2 * s, Y - .4, .1), 7, [.2 * s, Y - .2, .1], glow, 1.6)));
  return build(parts); };
const SK = { l: ['#f0ead8', '#d8b24a', '#ffe9a0'], d: ['#22222a', '#8a1a1a', '#ff3a2a'] }, AIR = [0, 0, 0, .3];
const defs = {}; for (const [p, [shell, trim, glow]] of Object.entries(SK)) for (const r of ['dps', 'tank', 'healer']) defs[`od_${p}_${r}`] = [droneGeo(shell, trim, glow, r), AIR, 0, .03];
addKinds(defs);
Object.assign(PETS, {
  odps: { name: 'Lamp Lance', kind: 'od_l_dps', role: 'dps', ranged: true, school: 'holy', hpM: .5, powM: .5, spd: 7, r: .4 },
  otank: { name: 'Lamp Warden', kind: 'od_l_tank', role: 'tank', hpM: 1.15, powM: .3, spd: 6.4, r: .55 },
  oheal: { name: 'Lamp Mender', kind: 'od_l_healer', role: 'healer', ranged: true, school: 'holy', hpM: .5, powM: .4, spd: 7, r: .4 },
});
export const DRONE_FOR = { wardancer: 'oheal', lifebinder: 'odps', knifeshade: 'otank', warlock: 'otank' };
const DOES = { oheal: 'mends you while you hold the line', odps: 'shoots while you heal', otank: 'takes the hits while you do the damage' };
const NAMES = { l: { odps: 'Lamp Lance', otank: 'Lamp Warden', oheal: 'Lamp Mender' }, d: { odps: 'Dusk Lance', otank: 'Dusk Warden', oheal: 'Dusk Mender' } };
const BLURB0 = {};
function dressDrones(path) {
  const p = path === 'dark' ? 'd' : 'l';
  for (const k of ['odps', 'otank', 'oheal']) { PETS[k].name = NAMES[p][k]; PETS[k].kind = `od_${p}_${PETS[k].role}`; if (PETS[k].school) PETS[k].school = p === 'd' ? 'shadow' : 'holy'; }
  for (const [cls, key] of Object.entries(DRONE_FOR)) { const c = CLASSES[cls]; if (BLURB0[cls + p] === undefined) BLURB0[cls + p] = c.blurb; c.blurb = `${BLURB0[cls + p]} A ${p === 'd' ? 'dusk' : 'lamp'} core in your pack powers the kit, and your ${NAMES[p][key]} drone ${DOES[key]}.`; }
}
X.pathSet = (prev => p => { prev?.(p); dressDrones(p === 'dark' ? 'dark' : 'justice'); })(X.pathSet);
dressDrones('justice');
// every sworn member of either order in your party keeps a drone in the air; a lost one is replaced after a short wait
let t = 0;
X.tick.push(dt => {
  t -= dt; if (t > 0 || !S.hero || X.path() === 'smuggler' || X.noFakes?.includes(S.zone) && S.zone !== 'board') return; t = 1.5;
  for (const p of S.party || []) { const key = DRONE_FOR[p.cls]; if (!key || p.dead || p.mount) continue;
    const mine = Cb.petsOf(p), have = mine.find(e => e.pet.key === key);
    for (const e of mine) if (e !== have && DRONE_FOR[p.cls] && ['odps', 'otank', 'oheal'].includes(e.pet.key)) { e.dead = true; e.remove = true; }   // changed weapon: the old drone goes home
    if (have) { p._dw = 0; continue; }
    p._dw = (p._dw || 0) + 1.5; if (p._dw >= (p._dOnce ? 18 : 1.5)) { Cb.summon(p, key); p._dOnce = 1; p._dw = 0; } }
  // and a drone whose owner has put the weapon down does not linger
  for (const e of S.ents) if (e.pet && ['odps', 'otank', 'oheal'].includes(e.pet.key) && !e.dead && DRONE_FOR[e.pet.owner?.cls] !== e.pet.key) { e.dead = true; e.remove = true; }
});
// Build 7 balance: the war world and boardings are boss-heavy, and were handing out levels too fast
X.xpMul.push(() => S.zone === 'front' ? .6 : S.zone === 'board' ? .7 : 1);
