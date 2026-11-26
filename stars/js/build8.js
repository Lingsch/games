// Stars Beneath, Build 8: the third way to be boarded (it happens to you), contraband and customs for the cargo
// hold, an alpha beast and a second weekly job on each of Lanthorn's four fronts, and the last of the old world's
// guild names and chatter swept out.
import { S, X, chat, mulberry32, TAU } from './core.js';
import { world, registerZone, zoneGen, hgt } from './world.js';
import { MOBS, QUESTS, GUILDS, CHAT, xpNeed } from './data.js';
import { MOB_LORE } from './dialogue.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { SYSTEMS, here } from './ship1.js';
import { GOODS, FACT, holdUsed } from './systems6.js';
import { FRONTS, frontNow, D8 } from './front6.js';

// ---------- sweeping up ----------
GUILDS.splice(0, GUILDS.length, 'Lane Rats', 'Hullbreakers', 'The Fourfold Wing', 'Bad Pullers', 'Cell Drain', 'Sleepy Lurchers');
CHAT.oom = ['cell is dry, sitting', 'need charge', 'low on charge, give me a sec', 'swapping cells'];
CHAT.wipe = ['wipe :(', 'well that went great', 'long walk back from the medbay', 'who pulled that??', 'lol'];
CHAT.idle = ['brb', 'gotta feed the ship cat', 'this crew is good', 'love this game', 'lag?', 'nice pull', 'heals are great today'];

// ---------- boarded ----------
const WHO = { smuggler: ['Syndicate boarders', 'w_syn', 'w_syng', 'Collector', "The Ochre Syndicate would like a word about your uncle's debts. We'll take it out of the hold."],
  justice: ['an Imperial boarding party', 'w_impb', 'w_imp', 'Boarding Officer', "Order vessel, you are detained under the Imperial border code. Stand away from the helm."],
  dark: ['Republic marines', 'w_repb', 'w_rep', 'Marine Lieutenant', "Covenant ship! By order of the Senate you are seized. Put the blade down, and nobody needs to be buried at space."] };
MOBS.b_master = { name: 'Boarding Master', kind: 'syn3', hpM: 1.5, dmgM: 1.1, spd: 5.2, range: 2.8, weak: 'storm', resist: null, scale: 1.2, aggro: 30, social: 30, human: true, mechs: ['cleave', 'call'], adds: 'w_syn', lines: { start: '', half: 'Take the bridge! Take the captain alive if you can!' } };
MOB_LORE.b_master = 'Whoever leads a boarding party is first through the lock and last to believe it has gone wrong.';
const KIND = { smuggler: 'syn3', justice: 'imp_off', dark: 'rep_off' };
let B = null;     // { to, proceed, ids }
export function boardMe(to, proceed) {
  const p = X.path(), W = WHO[p] || WHO.smuggler, L = S.hero.lvl, ids = [];
  const put = (key, x, z, o = {}) => { const e = Cb.makeMob(key, L, { x, z, y: 0, home: { x, z }, boarder: true, solo: true, ...o }); e.aggro = 60; ids.push(e.id); return e; };
  Object.assign(MOBS.b_master, { name: W[3], kind: KIND[p] || 'syn3', adds: W[1] }); MOBS.b_master.lines.start = W[4];
  [[-3, 62], [3, 64], [0, 58], [-4, 28], [4, 26]].forEach(([x, z], i) => put(i % 2 ? W[2] : W[1], x, z));
  put('b_master', 0, 66, { named: 'b_master', boss: true });
  B = { to, proceed, ids }; S.ext.timesBoarded = (S.ext.timesBoarded || 0) + 1;
  chat('sys', null, `Something hits the hull, hard, and the jump drive cuts out. The airlock is cycling. You have been boarded by ${W[0]}.`);
  const mate = (S.party || []).find(m => m !== S.hero && !m.dead); if (mate) setTimeout(() => chat('party', mate.name, "They're in the hold, Captain! They'll come forward through the commons. Hold them at the corridor!"), 1200);
}
X.tick.push(() => {
  if (!B) return;
  if (S.zone !== 'ship') { B = null; return; }
  const left = S.ents.filter(e => e.boarder && !e.dead && !e.remove);
  if (S.hero.dead) { const cut = Math.round(S.gold * .12); S.gold -= cut; for (const e of left) { e.dead = true; e.remove = true; } X.cargoLost?.(); const pr = B.proceed; B = null; chat('sys', null, `You come round on the deck. They took ${cut} credits and everything in the hold, and left you the ship. The drive is spooling back up.`); setTimeout(pr, 4000); return; }
  if (!left.length) { const L = S.hero.lvl, cr = Math.round(30 * (1 + L * .12)); S.gold += cr; const pr = B.proceed; B = null; chat('loot', null, `The last of them is down. Their boarding skiff is still latched to your lock: ${cr} credits in its strongbox.`); if (Math.random() < .5) X.givePart?.(2, "Stripped from the boarders' skiff"); setTimeout(pr, 2500); }
});
// ---------- contraband and customs ----------
GOODS.contra = ['Contraband', 30];
const LAWFUL = { cairn: 1.5, aurelis: 1.7, cinder: 1.6, hollow: 1.5, vigil: 1.8 };
for (const [k, f] of Object.entries(FACT)) f.contra = LAWFUL[k] || ({ halfway: .7, moon: .8, sunder: .75 })[k] || 1;
function customs(to) {
  const c = S.ext.cargo?.contra; if (!c || !c.n || !LAWFUL[to]) return;
  const risk = X.path() === 'smuggler' ? .15 : .35;
  setTimeout(() => {
    if (Math.random() >= risk) { chat('sys', null, `Customs at ${SYSTEMS[to].name} scans the hold and waves you through. They did not look in the right crates.`); return; }
    const fine = Math.min(S.gold, Math.round(c.paid * .25)); S.gold -= fine; delete S.ext.cargo.contra; S.ext.moral = (S.ext.moral || 0);
    chat('sys', null, `Customs at ${SYSTEMS[to].name} opens the right crates. ${c.n} crate${c.n === 1 ? '' : 's'} of contraband seized, and a fine of ${fine} credits.`); Game.save();
  }, 3600);
}
X.jumpEvent = (prev => (to, proceed) => {
  const go = () => { proceed(); customs(to); };
  const L = S.hero?.lvl || 1, force = X.forceBoard; X.forceBoard = false;
  if (!B && L >= 6 && (S.ext.jumps || 0) >= 2 && !X.forceEvent && (force || Math.random() < (holdUsed() > 0 ? .16 : .1))) { boardMe(to, go); return true; }
  if (B) { chat('sys', null, 'The drive will not spool with boarders on the ship.'); return true; }
  if (prev && prev(to, go)) return true;
  go(); return true;
})(X.jumpEvent);

// ---------- Lanthorn: an alpha on every front, and a second job that exists only that week ----------
const alpha = (name, kind, o) => ({ name, kind, hpM: 1.5, dmgM: 1.1, spd: 5.4, range: 2.8, weak: 'fire', resist: null, scale: 2, aggro: 14, social: 18, beast: true, ...o });
Object.assign(MOBS, {
  wa0: alpha('The Shroud', 'a_floater_war', { fly: .9, range: 16, ranged: true, mechs: ['pool', 'call'], adds: 'frontbeast', lines: { start: '*The smoke over the wire has a shape, and the shape has threads hanging from it as long as a trench.*', half: '*It dips, and every floater on the line turns toward you.*' } }),
  wa1: alpha('Gravel-Jaw', 'a_hound_war', { spd: 6.4, mechs: ['cleave', 'call', 'enrage'], adds: 'frontbeast', lines: { start: '*Something the size of a groundcar comes out of a collapsed tram tunnel, split jaw first, wearing most of a barricade.*', half: '*It calls the pack out of the rubble.*', enrage: '*It has decided the whole city is its kill.*' } }),
  wa2: alpha('The Rivet King', 'a_skitter_war', { scale: 2.4, mechs: ['slam', 'cleave'], lines: { start: '*A hull plate on the slipway gets up. It has grown a shell out of ship steel and one claw out of a docking clamp.*', half: '*It begins to take the gantry apart to get at you.*' } }),
  wa3: alpha('Old Bloom', 'a_mauler_war', { scale: 1.9, spd: 5, mechs: ['cleave', 'slam', 'fear'], lines: { start: '*The clearing ahead is not a clearing. It opens, petal by petal, and it is all mouth.*', half: '*The canopy shakes for a mile around.*' } }),
});
Object.assign(MOB_LORE, { wa0: 'Both armies have reported the same patch of smoke over the Wire for a month. It moves against the wind.', wa1: 'The biggest lurcher in Lanthorn City. It has eaten three runners, a mortar crew and part of a tram.', wa2: 'The yard crews say it was a skitter once. It has been eating ship steel for a year.', wa3: 'The oldest mauler in the Green. The ruins have carvings of it.' });
{ const old = zoneGen('front'); if (old) registerZone('front', seed => { const w = old(seed), fi = frontNow(), rng = mulberry32(seed + 55 + fi), a = 2.2 + fi * 1.3, d = 120 + rng() * 20, x = Math.cos(a) * d, z = Math.sin(a) * d * .7;
  world.spawns.push({ x, z, y: hgt(x, z), mob: 'wa' + fi, lvl: [13, 13], respawn: 1200, named: 'wa' + fi, area: 1, alive: null, timer: 0 }); world.spots.alpha = { x, z }; (world.mapLabels = world.mapLabels || []).push({ t: `${MOBS['wa' + fi].name} (13)`, x, z: z + 10 }); return w; }); }
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
[["The Shroud", "There's a patch of smoke over the Wire that's been there a month and goes upwind. The sentries won't look at it. I've looked at it. It's got threads hanging down, love, and they reach the trench floor.", "It's the mother of every floater on that line, and both armies are too proud to ask for help with it. So I'm asking, on behalf of everybody's sentries. Take a full crew.", "The Shroud's down? I watched the smoke come apart from here. First clear sky over the Wire since the shelling started. Both quartermasters have sent a bottle. I've kept the Imperial one, it's better. You have the other."],
  ["Gravel-Jaw", "Lanthorn City has a lurcher the size of a groundcar. Gravel-Jaw, the runners call it, on account of it ate a barricade and some of it's still in there. It's had three of my couriers.", "It dens in the old tram tunnels and comes up wherever the fighting's left the most bodies. Take a full crew, and mind the pack. It never hunts alone.", "Gravel-Jaw's finished? Then my couriers can cross the Dead Mile again. I'll tell their families. There's three households in this city who'll eat easier for knowing."],
  ["The Rivet King", "Something up on the Ring Yards has been eating ships. Not stripping them. Eating them. The yard crews call it the Rivet King. It's a skitter that's grown its shell out of hull plate and it's got a docking clamp for a claw.", "There's a hundred half-built hulls on that slipway and it's working through them in order. I don't care whose navy they're for. Nobody should be eaten by their own shipyard. Take a full crew.", "The Rivet King's scrap? Ha! The yard foremen from both sides just bought the whole truce ground a round. First thing they've agreed on all year. I'd frame the bar tab if I thought they'd pay it."],
  ["Old Bloom", "The Green's got one mauler that's older than the colony. Old Bloom. There are carvings of it in the ruins, love. Somebody a very long time ago was worried enough about it to carve a warning.", "It's sat itself across the only track both armies can use, and it looks like a clearing until it opens. Take a full crew, and count your people when you come out.", "Old Bloom, dead. Well. Whoever carved those warnings would be glad of it. Funny, isn't it? Everything on this world that's older than us has a warning on it. I wonder who's going to carve ours."]]
  .forEach(([name, a, b, done], i) => QUESTS.push({ id: 'wf_a' + i, zone: 'front', giver: 'reave', lvl: 13, when: () => frontNow() === i, name, where: 'alpha', xp: qx(13, .9), gold: 70, gear: true, obj: { named: 'wa' + i, n: 1, what: `Kill ${name === 'Gravel-Jaw' || name === 'Old Bloom' ? name : name} at ${FRONTS[i].name} this week` }, say: [a, b], done: [done] }));
