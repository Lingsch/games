// Build 11: the sky and the stars (levels 25-30). Long before the summoner wars, the Halcyon Empire lifted its
// cities into the sky on cloudstone and left the ground behind. Now something has come down from above the sky
// to bargain with them: the Starwrights, who made Vhorun, and who would like to know what became of him.
// Two ways up from Corrand, to the same three lands: climb the Spire with its Wardens, or help Corrand's Sky
// Fleet build its airships from parts torn out of the dungeons of the 20-25 lands.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS, CLASSES, CLASS_KEYS, xpNeed, GIVERS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world, zoneMarker } from './world.js';
import { INSTANCES } from './dungeons.js';
import { LFG_D } from './social6.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, faction, mount, giver } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';
import * as Craft from './crafting.js';

Object.assign(Craft.MATS, { skysilver: { name: 'Skysilver Ore', icon: '🌤️' }, cloudbloom: { name: 'Cloudbloom', icon: '☁️' }, stormhide: { name: 'Stormhide', icon: '⚡' }, starweave: { name: 'Starweave', icon: '✨' }, heartstar: { name: 'Heartstar', icon: '🌟' } });

// ---------- shared rules for the sky ----------
export const SKY = ['sky1', 'sky2', 'sky3'];
X.SKY_INST = new Set();
export const qx30 = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 29)) * f * .25), qg30 = lvl => Math.round(10 + lvl * 5);
X.xpMul.push(() => SKY.includes(S.zone) || X.SKY_INST.has(S.zone) ? .65 : 1);
X.fakeLvlHooks = X.fakeLvlHooks || [];
X.fakeLvlHooks.push(zone => SKY.includes(zone) ? Math.max(25, Math.min(30, Math.round(25 + Math.random() ** 1.2 * 5))) : null);
X.gate = X.gate || {};
for (const z of SKY) X.gate[z] = () => (S.hero?.lvl || 0) < 25 ? 'The sky is for level 25 and beyond.' : null;
const FAMS = ['Fighter', 'Healer', 'Rogue', 'Mage'];
export function raidWhy30() {
  if ((S.hero?.lvl || 0) < 29) return 'This raid is for level 29 and above.';
  const missing = FAMS.filter(f => !CLASS_KEYS.some(k => CLASSES[k].family === f && (S.classes[k]?.lvl || 0) >= 25));
  return missing.length ? `You need a ${missing.join(', a ')} at level 25 first.` : null;
}
export function addRaid30(key, name) { X.RAIDS.add(key); X.SKY_INST.add(key); X.gate[key] = raidWhy30; LFG_D[key] = { name: `${name} (12-person raid)`, lvl: [29, 30], zone: key, raid: raidWhy30 }; }
export function addDungeon30(key, name, lvl) { X.SKY_INST.add(key); LFG_D[key] = { name, lvl, zone: key }; }
export function finish30(list) { for (const q of list) { if (q.xp == null) q.xp = qx30(q.lvl, q.daily ? .3 : q.story ? (q.obj.named ? .75 : .5) : q.obj.named ? .65 : .42); if (q.gold == null) q.gold = qg30(q.lvl); q.text = q.text || (typeof q.say[0] === 'string' ? q.say[0] : q.say[0][1]); } return list; }
// floating isles over a sea of cloudstone (solid enough to walk on, if you don't look down)
export const isles = list => (x, z, N) => { let h = 1.5 + N.fbm(x * .01, z * .01, 2) * 2; for (const [ix, iz, r, top = 16] of list) { const d = Math.hypot(x - ix, z - iz) / r; if (d < 1) { const t = 1 - d, s = t < .3 ? (t / .3) ** 2 * (3 - 2 * t / .3) : 1; h = Math.max(h, 1.5 + s * (top + N.fbm(x * .02 + 3, z * .02, 3) * 5)); } } return h; };
const SKYPAL = { a: '#e8eef6', b: '#d4dfec', hi: '#7aa85a', road: '#c8b88a', cob: '#d0c8b4', low: '#f4f8fc' };
export { SKYPAL };
// the way the sky lands join: cloud-bridges between them
const SKY_ARRIVE = { sky1: { crown: { x: 0, z: 440 }, spire: { x: 290, z: 40 }, sky2: { x: 0, z: -440 } }, sky2: { sky1: { x: 0, z: 440 }, sky3: { x: 0, z: -440 } }, sky3: { sky2: { x: 0, z: 440 } } };
X.arriveHooks = X.arriveHooks || [];
X.arriveHooks.push((zone, from) => SKY_ARRIVE[zone]?.[from] || (SKY.includes(zone) && !from ? Object.values(SKY_ARRIVE[zone])[0] : null) || (zone === 'crown' && SKY.includes(from) ? { x: 118, z: 30 } : null));

// ---------- the two ways up ----------
const st = () => (S.ext.sky = S.ext.sky || { parts: [], tower: false, fleet: false });
export const fleetReady = () => st().fleet || S.quests.af7?.state === 'turned';
export const towerDone = () => st().tower || S.quests.tw3?.state === 'turned';
giver('isolde', 'Commodore Isolde Vane', 'Corrandel · the Sky Docks', 'aegis1');
giver('oriel', 'Warden-Captain Oriel', 'The foot of the Spire · the Wardens', 'bladewarden2');
giver('fennick', 'Fennick Gearwright', 'Corrandel · shipwright', 'villager3');
Object.assign(TALK, {
  isolde: { bio: 'Isolde Vane commanded the last airship of the old Corrand navy, which flew for eleven minutes in 1031 before it came down in the Regent\'s rose garden. She has been trying to build another one ever since, and this time she has the Marshal\'s money.',
    greet: ["Mind the scaffolding. And the ropes. And Fennick. Especially Fennick.", "One day there'll be a fleet at this dock. Today there's half a hull and a lot of optimism."],
    topics: [{ q: 'How does an airship fly?', a: ["Cloudstone. The Halcyon built their whole empire on it: a stone that floats when you sing to it the right way, or, as Fennick prefers, when you run lightning through it.", "Our problem is that nobody's made cloudstone in a thousand years, and all the old pieces are in the bellies of things in the deep places. So that's where you come in."] }] },
  oriel: { bio: 'Oriel is the last captain of the Wardens of the Spire, an order that has guarded the stair to the sky since the Halcyon left. There used to be four hundred Wardens. There are now nineteen, and two of them are cooks.',
    greet: ["You want to climb the Spire? Good. Everyone who's tried in the last century has died, but you look sturdier than they did.", "The Spire goes up and up, and at the top is the sky. In between are a lot of things that would rather you stayed down here."],
    topics: [{ q: 'What is the Spire?', a: ["The Halcyon built it as a stair, so that the ground could visit them. Then they stopped wanting visitors, and filled it with guardians.", "The Wardens have held the bottom of it for a thousand years, so nothing comes down. Lately things have started coming down anyway."] }] },
  fennick: { bio: 'Fennick builds things. Mostly they work. The ones that don\'t work tend to work very dramatically.', greet: ["Do you know what happens if you run lightning through cloudstone backwards? Neither do I! Let's not find out.", "Bring me parts. Good parts. Old parts. Parts with history and preferably not too much blood on them."], topics: [] },
});
// the Sky Docks in Corrandel, and the foot of the Spire in the Ashwood
X.zone.push(zone => {
  if (zone !== 'crown') return;
  world.zoneLines.push({ x: 124, z: 30, r: 4, to: 'sky1', label: 'Board an airship for the Stormreach (levels 25-30)', why: () => fleetReady() ? null : 'The fleet isn\'t built yet. Commodore Vane needs parts.' });
  zoneMarker(124, 30, Math.PI / 2); world.places.push({ name: 'The Sky Docks', x: 118, z: 30, R: 10, kind: 'place' }); world.spots.skydocks = { x: 112, z: 30 };
  world.zoneLines.push({ x: -262, z: -392, r: 4, to: 'sky1', label: 'Ride the Wardens\' lift to the summit (levels 25-30)', why: () => towerDone() ? null : 'The lift only runs once someone has climbed the Spire and cleared it.' });
  zoneMarker(-262, -392, 0); world.spots.spirefoot = { x: -250, z: -380 };
});
// the Spire itself: a door in the Ashwood, and five floors of guardians
Object.assign(MOBS, {
  spireconstruct: mob('Spire Construct', 'golempet~gilded', { hpM: 1.4, spd: 4.8, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.2 }),
  spirewisp: mob('Spire Wisp', 'firepet~spectral', { hpM: .9, fly: .8, range: 18, ranged: true, caster: true, school: 'storm', weak: 'earth', resist: 'storm' }),
  spirewarden: mob('Hollow Warden', 'bladewarden1~ashen', { ...U, hpM: 1.3, weak: 'holy', resist: 'shadow' }),
  floor1: boss('The Gatekeeper of the First Floor', 'golempet~gilded', { scale: 2.2, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield'], lines: { start: '*Gears turn. The Gatekeeper raises an arm the size of a door.*', half: '*It locks its stance and stops taking damage from the front.*' } }),
  floor2: boss('Sister Aleth, the First Warden', 'aegis2~ashen', { ...U, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['heal', 'volley'], lines: { start: 'I swore to let nothing pass. A thousand years, and I have let nothing pass. I am not going to start now.', half: 'Hold the stair!' } }),
  floor3: boss('The Wind-Cage', 'stormpet', { scale: 2.4, weak: 'earth', resist: 'storm', mechs: ['knock', 'pool', 'volley'], lines: { start: '*A storm has been locked inside this room for a very long time. It is delighted to see you.*', half: '*The windows burst.*' } }),
  floor4: boss('The Clockwork Choir', 'golempet~spectral', { scale: 1.8, weak: 'storm', mechs: ['fear', 'shield', 'spawn'], adds: 'spirewisp', lines: { start: '*Twelve brass figures begin to sing in harmony. It is the most beautiful sound you have ever heard, and it hurts.*', half: '*The song changes key.*' } }),
  floor5: boss('Archon Vael of the Summit', 'bulwark2~gilded', { hpM: 1.8, scale: 1.6, weak: 'shadow', resist: 'holy', mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'spireconstruct', lines: { start: 'The Empress closed this stair a thousand years ago. She did not want the ground. I did not ask why. I have never asked why.', half: 'For Halcyon!' } }),
});
defineDungeon({ key: 'spire', name: 'The Spire', parent: 'crown', plan: 'winding', floor: '#c8c0a8', rock: '#5a5448', fog: '#a8b8c8', light: .6, lvl: [25, 26], prop: 'bluelamp',
  mobs: ['spireconstruct', 'spirewisp', 'spirewarden'], bosses: ['floor1', 'floor2', 'floor3', 'floor4', 'floor5'], exitLabel: 'Back down to the Ashwood' });
addDungeon30('spire', 'The Spire', [25, 26]); tier({ spire: 10 });
X.zone.push(zone => {
  if (zone !== 'crown') return;
  world.zoneLines.push({ x: -250, z: -400, r: 3.5, to: 'spire', label: 'Climb the Spire (25-26)' }); zoneMarker(-250, -400, 0);
  world.places.push({ name: 'The Spire', x: -250, z: -405, R: 12, kind: 'dungeon' }); INSTANCES.spire.out = { x: -250, z: -385 };
});
X.kill.push(m => {
  if (m.mob !== 'floor5') return;
  st().tower = true; world.zoneLines.push({ x: m.x, z: m.z - 3, r: 4, to: 'sky1', label: 'Step out onto the summit of the Spire' }); zoneMarker(m.x, m.z - 3, 0);
  chat('sys', null, 'A door at the top of the Spire swings open onto wind and light. Somewhere far below, the Wardens\' lift starts to run again.');
});
X.arriveHooks.push((zone, from) => zone === 'sky1' && from === 'spire' ? SKY_ARRIVE.sky1.spire : null);
X.VEND = Object.assign(X.VEND || {}, { galesrest: ['Quartermaster Hale', 'bulwark1'], thunderwatch: ['Warden Pike', 'bladewarden1'], prismhold: ['Glass-Trader Ysmay', 'villager2'], shardwatch: ['Sutler Brann', 'guard'], zenith: ['Provisioner Odo', 'villager3'], oldlens: ['Lens-Keeper Ammit', 'cleric1'] });
faction('fleet', 'Corrand\'s Sky Fleet', '⛵', 'galesrest', [[1, 200, 'Fleet Signet', Rep.ring('Fleet Signet', 27, 2)], [2, 500, 'Cloudstrider (mount)', 'mount_cloud'], [3, 500, 'Commodore\'s Brooch', Rep.ring("Commodore's Brooch", 30, 3, 'neck')], [4, 0, 'Title: Sky-Captain', 'title_fleet']], []);
faction('spire', 'The Wardens of the Spire', '🗼', 'thunderwatch', [[1, 200, 'Warden\'s Band', Rep.ring("Warden's Band", 27, 2)], [2, 500, 'Summit Charger (mount)', 'mount_summit'], [3, 500, 'Archon\'s Torc', Rep.ring("Archon's Torc", 30, 3, 'neck')], [4, 0, 'Title: of the Summit', 'title_spire']], []);
mount('mount_cloud', 'Cloudstrider', 'horse_cloud', '#f4f8fc', '#a8c8e8', '#3a6aaa', false); mount('mount_summit', 'Summit Charger', 'horse_summit', '#c8a050', '#f4ecd8', '#7a2a2a', true);
Loot5.COLLECT.title_fleet = { type: 'title', name: 'Sky-Captain', from: 'rep' }; Loot5.COLLECT.title_spire = { type: 'title', name: 'of the Summit', from: 'rep' };

const C0 = { zone: 'crown' }, FL = r => ({ fleet: r }), SP = r => ({ spire: r });
const PZ = { echovault: 'deep', icefang: 'north', glaciertomb: 'north', ashmanor: 'crown', plaguequarter: 'crown' };
const part = (id, n, boss, where, name, what, say, done) => ({ id, giver: 'fennick', lvl: 25, pre: 'af1', name, zone: PZ[where], where, rep: FL(300), obj: { named: boss, n: 1, what }, say, done, part: n });
QUESTS.push(...finish30([
  { id: 'sk1', story: true, giver: 'marshal', lvl: 25, needLvl: 25, name: 'Something Fell From the Sky', ...C0, where: 'palace', rep: { crown: 300 }, obj: { talk: true, what: 'Hear what fell on the Ashwood' },
    say: ["Three nights ago something fell out of the sky and burned a hole the size of a barn in the Ashwood. My scouts found a ship in it. A ship, with sails made of glass, and a crew dressed in gold, and none of them older than twenty.", "They were dead before they hit the ground, and not from the fall. Something had hollowed them out. There are two people in this kingdom who know anything about the sky: the Commodore at the docks, and the Warden-Captain at the foot of the Spire. Talk to either. Talk to both."],
    done: [['marshal', "I've had the bodies burned. Don't ask me why I couldn't stand to look at them. Go up, Lightkeeper. Find out who's sending us dead children in glass ships."]] },
  { id: 'af1', story: true, giver: 'isolde', lvl: 25, pre: 'sk1', name: 'A Fleet From Nothing', ...C0, where: 'skydocks', rep: FL(300), obj: { talk: true, what: 'Hear the Commodore\'s plan' },
    say: ["You heard about the glass ship. So did I. And I thought: if they can fly down, we can fly up. All I need is cloudstone, and the only cloudstone left in the world is in the dungeons of the deep, the north and Corrand, inside things that have eaten it.", "Six parts, Lightkeeper. Six bosses, six dungeons. Fennick will tell you which. It's not fast. It's not easy. But at the end of it, Corrand has a fleet, and nobody ever has to climb that blasted tower again."],
    done: ["Fennick's made you a list. He's very proud of the list. Please pretend to read it."] },
  part('af2', 1, 'thelastecho', 'echovault', 'The Singing Keel', 'Cut the cloudstone keel out of the Last Echo in the Vault of Echoes',
    ["Keel first. The Last Echo in the Vault of Echoes is made of cloudstone, I'd bet my workshop on it. That's why it sings: cloudstone always sings. Go and stop it singing, and bring me what's left."], ["Listen! Still humming. Oh, she's going to fly beautifully."]),
  part('af3', 2, 'hrothgar', 'icefang', 'The Troll Who Ate a Sail', 'Recover the swallowed sky-sail from Hrothgar in the Icefang Caverns',
    ["A Halcyon sky-sail came down in the north a century back. The Kaldmen say a troll ate it. Trolls eat everything, but Hrothgar ate it on purpose, and I want it back."], ["It's a bit sticky. It'll fly. Everything flies if you're optimistic enough."]),
  part('af4', 3, 'thefirstjarl', 'glaciertomb', 'The Jarl\'s Compass', 'Take the sky-compass from the First Jarl in the Glacier Tomb',
    ["The First Jarl of Kaldmark was buried with a compass that points up. Not north. Up. I need it. He doesn't. He's dead. Mostly."], ["Look at it spin! It knows where it wants to go."]),
  part('af5', 4, 'dukeofash', 'ashmanor', 'The Duke\'s Engine', 'Seize the lightning-engine from Duke Corvin in Ashford Manor',
    ["Duke Corvin bought a lightning-engine off a Halcyon trader forty years ago and uses it to heat his bath. His bath! It could lift a ship. Go and liberate it."], ["Warm. Very warm. He was using it for a bath. Unbelievable."]),
  part('af6', 5, 'plaguefather', 'plaguequarter', 'Ribs of Cloudstone', 'Pull the cloudstone ribs out of the Plague-Father in the Plague Quarter',
    ["The Plague-Father is sewn together out of everything they buried under the Quarter, and some of what they buried was a Halcyon skiff. Its ribs are in him. I need ribs. Don't think about it too hard."], ["I'll wash them. Several times. With fire."]),
  { id: 'af7', story: true, giver: 'fennick', turnTo: 'isolde', lvl: 25, pre: 'af1', when: () => ['af2', 'af3', 'af4', 'af5', 'af6'].every(id => S.quests[id]?.state === 'turned'), name: 'Maiden Voyage', ...C0, where: 'skydocks', rep: FL(500), obj: { named: 'hierophant', n: 1, what: 'Take the last part, the heartstone, from the Hierophant in the Hollowborn Temple, then report to the Commodore' },
    say: ["One more. The heartstone. Without it the ship is just a very expensive pile of wood. The Hierophant of the Hollowborn Temple wears it on his staff. He's not going to give it up nicely."],
    done: [['isolde', "It's in. It's singing. Fennick is crying. I may also be crying."], ['isolde', "The Resolute flies at dawn, Lightkeeper, and you're on her. Every day after, there'll be a ship at this dock for anyone brave enough to board it."]] },
  { id: 'tw1', story: true, giver: 'oriel', lvl: 25, pre: 'sk1', name: 'The Stair to the Sky', ...C0, where: 'spirefoot', rep: SP(300), obj: { named: 'floor2', n: 1, what: 'Climb the Spire past Sister Aleth, the First Warden' },
    say: ["The glass ship came from up there, and up there is the top of my Spire. A thousand years we've kept things from coming down. Now they're coming down dead, and I want to know why.", "Climb, Lightkeeper. The first floors are guardians the Halcyon left behind, and the second is the first Warden of all, Sister Aleth, who went up to talk to the Empress and never came down. She'll still be guarding the stair. Get past her."],
    done: ["Aleth. We have her name carved over the gate. I never thought anyone would actually meet her. Was she... was she kind?"] },
  { id: 'tw2', story: true, giver: 'oriel', lvl: 26, pre: 'tw1', name: 'The Singing Floors', ...C0, where: 'spirefoot', rep: SP(300), obj: { named: 'floor4', n: 1, what: 'Silence the Clockwork Choir on the fourth floor of the Spire' },
    say: ["Above Aleth the Spire sings. We hear it down here on still nights. The old books call it the Clockwork Choir, and say it sang the Empress to sleep every night for a hundred years. Stop it singing."],
    done: ["Silence. I've lived under that song my whole life. It's very loud, silence."] },
  { id: 'tw3', story: true, giver: 'oriel', lvl: 26, pre: 'tw2', name: 'The Summit', ...C0, where: 'spirefoot', rep: SP(600), obj: { named: 'floor5', n: 1, what: 'Defeat Archon Vael at the summit of the Spire, and open the door to the sky' },
    say: ["At the top is the Archon who closed the stair. Vael. The last Halcyon who ever set foot on the ground. Beat him, and open the summit door. Then my Wardens can follow you up, and we'll find out what's happening in the sky."],
    done: ["The lift is running! The lift hasn't run since before my grandmother's grandmother. The Wardens are packing. We'll meet you at Thunderhead Watch, in the Stormreach."] },
]));
// the part quests: number them for the Commodore's ledger
X.turnin.push(q => { if (q.part) { const s = st(); if (!s.parts.includes(q.part)) s.parts.push(q.part); } if (q.id === 'af7') { st().fleet = true; chat('sys', null, 'The Resolute is ready. There is a ship at the Sky Docks for anyone who wants to board her.'); } });
Object.assign(LORE, {
  glassship: { title: 'The Log of the Dawnwing', where: 'skydocks', text: "Recovered from the glass ship in the Ashwood, in a hand that grows smaller as it goes: 'Day 40. The Starwrights came aboard tonight and asked our names. Day 41. They asked again. Day 42. Nobody remembers their names. The Empress says this is a great honour. Day 43. I think I had a name.'" },
});

// ---------- the Stormreach (25-27) ----------
Object.assign(MOBS, {
  stormgriffon: mob('Storm Griffon', 'harpy~gilded', { ...B, hpM: 1.15, fly: 1.4, spd: 6.4, scale: 1.4, weak: 'earth', resist: 'storm' }),
  cloudshark: mob('Cloud Shark', 'shark~spectral', { ...B, hpM: 1.3, fly: 1.6, spd: 6.2, scale: .9, weak: 'storm' }),
  stormelem: mob('Storm Elemental', 'stormpet', { hpM: 1.2, range: 16, ranged: true, caster: true, school: 'storm', weak: 'earth', resist: 'storm', scale: 1.2 }),
  galewisp: mob('Gale Wisp', 'firepet~spectral', { hpM: .85, fly: .8, range: 18, ranged: true, caster: true, school: 'storm', weak: 'earth', resist: 'storm' }),
  skyreaver: mob('Skyreaver Deserter', 'smuggler', { ...HU, hpM: 1.2, weak: 'storm' }),
  skyreaverbow: mob('Skyreaver Harpooner', 'xbow', { ...HU, hpM: .9, range: 22, ranged: true, weak: 'storm' }),
  outrider: mob('Halcyon Outrider', 'guard~gilded', { ...HU, hpM: 1.3, weak: 'shadow', resist: 'holy' }),
  sunpriest: mob('Halcyon Sun-Priest', 'priest~gilded', { ...HU, hpM: .9, range: 18, ranged: true, caster: true, healer: true, school: 'holy', weak: 'shadow', resist: 'holy' }),
  hollowed: mob('Hollowed Sailor', 'skeleton~spectral', { ...U, hpM: 1.15, weak: 'holy', resist: 'shadow' }),
  // named
  thunderjaw: boss('Thunderjaw', 'shark~spectral', { ...B, scale: 1.6, fly: 1.6, mechs: ['charge', 'knock'] }),
  captainmarrow: boss('Captain Rook Marrow', 'captain', { ...HU, mechs: ['cleave', 'call'], adds: 'skyreaver' }),
  // the Wreck of the Resolute (open)
  bosunvex: boss('Bosun Vex', 'smuggler', { ...HU, scale: 1.4, mechs: ['cleave', 'call'], adds: 'skyreaver', lines: { start: 'Finders keepers! This wreck is ours, groundling!', half: 'Lads! Over here!' } }),
  cloudmaw: boss('Cloudmaw', 'shark~spectral', { ...B, scale: 1.8, fly: 1.4, mechs: ['charge', 'pool'], lines: { start: '*A shark the size of a rowboat swims through the cloud as if it were water.*', half: '*It dives into the cloud and comes up somewhere else.*' } }),
  captainsilt: boss('Captain Morwen Silt', 'captain', { ...HU, hpM: 1.7, scale: 1.4, mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'skyreaverbow', lines: { start: 'I deserted Corrand\'s fleet because the Commodore was mad. Now she\'s building a new one. Clearly she\'s still mad. And clearly I have to stop her.', half: 'All hands! Repel boarders!' } }),
  // the Eye of the Storm (open)
  stormherald: boss('The Herald of Gales', 'stormpet', { scale: 2, weak: 'earth', resist: 'storm', mechs: ['knock', 'volley'], lines: { start: '*The wind takes a shape, and the shape is angry.*', half: '*Lightning dances along the ground.*' } }),
  griffonmatriarch: boss('The Griffon Matriarch', 'harpynamed', { ...B, scale: 1.8, fly: 1.2, mechs: ['charge', 'spawn'], adds: 'stormgriffon', lines: { start: '*She screams, and every griffon on the isle answers.*', half: '*Her brood circles overhead.*' } }),
  theeye: boss('The Eye', 'stormpet~gilded', { hpM: 1.8, scale: 2.6, weak: 'earth', resist: 'storm', mechs: ['pool', 'knock', 'volley', 'enrage'], lines: { start: '*At the centre of the storm, something opens an eye and looks at you.*', half: '*The storm closes in.*' } }),
  // the Gale-Forge (instance, 25-26)
  forgefather: boss('The Forge-Father', 'golempet~gilded', { scale: 2.2, weak: 'storm', resist: 'earth', mechs: ['slam', 'pool'], lines: { start: '*An iron giant pumps a bellows that feeds a storm.*', half: '*Sparks rain from the ceiling.*' } }),
  sparkmistress: boss('Sparkmistress Ilen', 'elem2~gilded', { ...HU, range: 18, ranged: true, caster: true, school: 'storm', mechs: ['volley', 'pool', 'shield'], lines: { start: 'The forge makes the lightning that lifts the empire. Do you know how many of us it takes to feed it? Do you know how few of us are left?', half: 'More power!' } }),
  thebellows: boss('The Bellows', 'abom~gilded', { scale: 1.8, mechs: ['knock', 'slam'], lines: { start: '*Something enormous breathes in.*', half: '*It breathes out. Hold on.*' } }),
  forgemasterhal: boss('Forgemaster Halvor Brightsteel', 'bulwark2~gilded', { ...HU, hpM: 1.8, scale: 1.5, weak: 'shadow', resist: 'holy', mechs: ['cleave', 'slam', 'call', 'enrage'], adds: 'outrider', lines: { start: 'The Empress needs lightning. The Starwrights need ships. I need you to stop touching my anvil.', half: 'Stoke the forge!' } }),
  // the Storm-Spire (instance, 26-27)
  windcaller: boss('Windcaller Saresh', 'priest~gilded', { ...HU, range: 18, ranged: true, caster: true, school: 'storm', mechs: ['knock', 'heal'], lines: { start: 'The winds belong to Halcyon. You are standing in them without permission.', half: 'Winds, rise!' } }),
  twinbolts: boss('The Twin Bolts', 'stormpet', { scale: 1.8, weak: 'earth', resist: 'storm', mechs: ['volley', 'charge', 'shield'], lines: { start: '*Two storms, chained together, strain against each other.*', half: '*The chain snaps.*' } }),
  stormhawk: boss('The Stormhawk', 'harpynamed', { ...B, scale: 2, fly: 1.4, mechs: ['charge', 'volley'], lines: { start: '*A bird made of thunder lands on the parapet.*', half: '*It screams, and the sky answers.*' } }),
  lordtempest: boss('Lord Tempest Halcyon', 'bladewarden2~gilded', { ...HU, hpM: 1.9, scale: 1.5, weak: 'shadow', resist: 'storm', mechs: ['cleave', 'pool', 'knock', 'enrage'], lines: { start: 'I am the Empress\'s brother. I hold the storms that keep the ground away from us. Go back down. Go back down while you still can.', half: 'The storm is mine!' } }),
  // the Thunder Throne (raid)
  stormguard: rboss('The Stormguard Colossus', 'golempet~gilded', { hpM: 2.3, scale: 2.8, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield', 'knock'], lines: { start: '*The throne room\'s door is a giant. It stands up.*', half: '*Lightning crawls over its armour.*' } }),
  thehollowfleet: rboss('The Hollowed Admiral', 'admiral', { hpM: 2.3, ...U, mechs: ['call', 'volley', 'fear'], adds: 'hollowed', lines: { start: 'The Starwrights asked my crew their names. Now they have none. Neither will you.', half: 'All hands... all hands...' } }),
  tempestqueen: rboss('The Tempest Queen', 'queen', { hpM: 2.4, range: 18, ranged: true, caster: true, school: 'storm', mechs: ['pool', 'knock', 'volley', 'heal'], lines: { start: 'I was a storm before Halcyon tamed me. Now they have let me go. I am going to enjoy this.', half: 'Feel the sky!' } }),
  stormking: rboss('Aurion, the Thunder-King', 'bulwark2~gilded', { hpM: 2.7, scale: 2.2, weak: 'shadow', resist: 'storm', mechs: ['cleave', 'pool', 'call', 'knock', 'enrage'], adds: 'outrider', lines: { start: 'The Starwrights promised us the stars. They have given us storms, and hollow children, and silence. I am still loyal. I am still loyal. I do not know why I am still loyal.', half: 'Halcyon endures!' } }),
});
Object.assign(MOB_LORE, { outrider: 'A soldier of the Halcyon Empire, which lifted its cities into the sky a thousand years ago and stopped answering letters.', hollowed: 'A Halcyon sailor the Starwrights asked for his name. He gave it to them, and they kept it.', stormking: 'Aurion, the Thunder-King, keeper of the storms that wall Halcyon off from the ground.' });
giver('tamhale', 'Bosun Tamsin Hale', 'Gale\'s Rest · Sky Fleet', 'knifeshade1');
giver('merrinpike', 'Warden Merrin Pike', 'Thunderhead Watch · the Wardens', 'archer1');
giver('ammara', 'Ammara of the Clouds', 'Gale\'s Rest · a Halcyon defector', 'illusionist1~gilded');
Object.assign(TALK, {
  tamhale: { bio: 'Tamsin Hale was the Resolute\'s bosun for eleven minutes in 1031, and has been waiting forty years for a second chance. She is seventy-one and has never been so happy.', greet: ["Mind the edge! There's no railing yet. There's no anything yet. It's wonderful.", "Every isle in the Stormreach has something on it that wants to kill us. I love it here."], topics: [] },
  merrinpike: { bio: 'Merrin Pike is the Wardens\' best archer and worst cook, and she is very insistent about which of those she wants to be remembered for.', greet: ["The Wardens hold Thunderhead now. All nineteen of us. Well, seventeen. The cooks stayed downstairs.", "You can see the whole Stormreach from here. Most of it is lightning."], topics: [] },
  ammara: { bio: 'Ammara was a lady-in-waiting to the Halcyon Empress until the Starwrights came to court and asked her name. She ran before she could answer. She is the only Halcyon in the Stormreach who still remembers hers.',
    greet: ["You came up from the ground. I've never met anyone from the ground. You're very... loud.", "Don't let them ask your name. Whatever happens, don't let the Starwrights ask your name."],
    topics: [{ q: 'Who are the Starwrights?', a: ["They came down out of the dark above the sky, a year ago. Tall, and quiet, and kind, and they spoke to the Empress for a month in her garden.", "They said they had lost something, a long time ago, something they made. They said it went under the world and never came back. They wanted to know where it went. And they said if Halcyon helped them find it, they would lift Halcyon up to the stars."] },
      { q: 'What do they do to people?', a: ["They ask your name. Very politely. And you tell them, because they're so kind, and then they have it and you don't.", "What's left still walks and fights and obeys. But it's hollow. You've seen the sailors. That's what's left."] }] },
});
const W1 = { zone: 'sky1' }, F = r => ({ fleet: r }), Wd = r => ({ spire: r });
const STORM = ['stormgriffon', 'cloudshark', 'stormelem', 'galewisp'], REAV = ['skyreaver', 'skyreaverbow'], HALC = ['outrider', 'sunpriest', 'hollowed'];
for (const m of [...STORM, ...REAV]) Rep.KILL_REP[m] = ['fleet', 6]; for (const m of HALC) Rep.KILL_REP[m] = ['spire', 6];
defineZone('sky1', {
  size: 500, seed: 9811, name: 'The Stormreach', bossName: 'Aurion, the Thunder-King', hiH: 9, maxSpawnH: 40,
  land: isles([[0, 390, 90], [320, 20, 80], [-320, 100, 80], [0, -80, 95], [330, -250, 70], [-300, -250, 75], [0, -430, 80], [160, 220, 60], [-170, 260, 55], [-150, -120, 50], [180, -120, 55]]),
  pal: { ...SKYPAL, hi: '#7aa85a' },
  towns: [{ key: 'galesrest', name: 'Gale\'s Rest', x: 0, z: 380, R: 30, base: 18, wall: 'palisade', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Fleet Marine', guardKind: 'bulwark1',
    houses: [[-12, 10, .4, 'tent', 4, 4], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'hut']], props: [[0, 4, 'banner', '#3a6aaa'], [-6, 0, 'lantern'], [6, 0, 'lantern']],
    npcs: [['giver', 'isolde', 0, 0], ['giver', 'tamhale', -8, 6], ['giver', 'ammara', 6, -6], ['vendor', 'galesrest', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 28], [-2, 28], [2, -28], [-2, -28]] },
    { key: 'thunderwatch', name: 'Thunderhead Watch', x: 320, z: 20, R: 22, base: 18, wall: 'stones', gates: [Math.PI, Math.PI / 2], guardName: 'Warden of the Spire', guardKind: 'bladewarden1',
      houses: [[-6, 6, .3, 'tent'], [6, -6, -.4, 'hut']], props: [[0, 0, 'bluelamp'], [4, 4, 'banner', '#c8a050']],
      npcs: [['giver', 'oriel', -5, -2], ['giver', 'merrinpike', 4, 3], ['vendor', 'thunderwatch', 6, -4], ['bind', null, 0, 6]], guards: [[-20, 2], [-20, -2]] }],
  roads: [],
  regions: { names: ['The Isles of Gale\'s Rest', 'The Thunderheads', 'The Wreck-Fields', 'The Eye of the Storm', 'The Halcyon Gate'], fn: (x, z) => z > 220 ? 0 : z < -300 ? 4 : x > 120 ? 1 : x < -120 ? 2 : 3 },
  open: [{ key: 'wreckfields', name: 'The Wreck of the Resolute', x: -320, z: 100, R: 34, base: 18, deco: 'dead', decoN: 18, ring: true, gap: 0, centre: 'banner', lvl: [25, 26], area: 2,
      packs: [[-18, 0, ['skyreaver', 'skyreaver', 'skyreaverbow']], [18, 0, ['skyreaver', 'skyreaverbow']], [0, -18, ['cloudshark', 'skyreaver']], [0, 18, ['skyreaver', 'skyreaver', 'skyreaverbow']]],
      bosses: [[-22, -18, 'bosunvex', 25], [22, -20, 'cloudmaw', 26], [0, -4, 'captainsilt', 26, true]] },
    { key: 'eyeofstorm', name: 'The Eye of the Storm', x: 0, z: -80, R: 34, base: 18, deco: 'crystal', decoN: 20, centre: 'stonecircle', lvl: [26, 27], area: 3,
      packs: [[-18, 0, ['stormelem', 'galewisp', 'galewisp']], [18, 0, ['stormgriffon', 'stormgriffon']], [0, -18, ['stormelem', 'stormelem']], [0, 18, ['galewisp', 'stormgriffon', 'stormelem']]],
      bosses: [[-22, -18, 'stormherald', 26], [22, -20, 'griffonmatriarch', 27], [0, -4, 'theeye', 27, true]] }],
  doors: [{ to: 'galeforge', name: 'The Gale-Forge', x: -300, z: -250, ry: 0, label: 'Enter the Gale-Forge (25-26)', col: '#ffd34d' },
    { to: 'stormspire', name: 'The Storm-Spire', x: 330, z: -250, ry: 0, label: 'Enter the Storm-Spire (26-27)', col: '#9ad8ff' },
    { to: 'thunderthrone', name: 'The Thunder Throne', x: 40, z: -440, ry: 0, label: 'Climb to the Thunder Throne (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: -150, z: -120, name: 'The Fallen Colossus', R: 16, clear: 10, s: 2 }],
  lines: [{ x: -40, z: -470, to: 'sky2', label: 'Cross the cloud-bridge to the Crystal Shelf', ry: 0, why: () => (S.hero?.lvl || 0) < 26 ? 'The Crystal Shelf is for level 26 and beyond.' : null }, { x: 0, z: 488, to: 'crown', label: 'Take the airship down to Corrand', ry: Math.PI }],
  spots: { galesisles: { x: 0, z: 330 }, thunderheads: { x: 300, z: 120 }, wreckfields: { x: -320, z: 100 }, eye: { x: 0, z: -80 }, halcgate: { x: 0, z: -400 }, colossus: { x: -150, z: -120 } },
  scatter: [[40, [-480, 480, 220, 480], ['stormgriffon', 'cloudshark', 'galewisp'], [25, 26], 0], [44, [120, 480, -300, 220], ['stormelem', 'stormgriffon', 'galewisp', 'cloudshark'], [25, 26], 1],
    [44, [-480, -120, -300, 220], ['skyreaver', 'skyreaverbow', 'cloudshark'], [25, 26], 2], [44, [-120, 120, -300, 220], ['stormelem', 'galewisp', 'stormgriffon', 'hollowed'], [26, 27], 3],
    [44, [-480, 480, -480, -300], ['outrider', 'sunpriest', 'hollowed', 'stormelem'], [26, 27], 4]],
  camps: [[6, [-480, -120, -300, 220], ['skyreaver', 'skyreaver', 'skyreaverbow'], [25, 26], 2, 'sr'], [6, [-480, 480, -480, -300], ['outrider', 'outrider', 'sunpriest'], [26, 27], 4, 'ho']],
  rares: [[[-120, 120, -300, 220], 'thunderjaw', 26, false], [[-480, -120, -300, 220], 'captainmarrow', 26, false]],
  hunt: [{ area: 0, lvl: [25, 26] }, { area: 1, lvl: [25, 26] }, { area: 2, lvl: [25, 26] }, { area: 3, lvl: [26, 27] }, { area: 4, lvl: [26, 27] }],
  labels: [{ t: 'Griffons, sharks (25-26)', x: 0, z: 300 }, { t: 'The Thunderheads (25-26)', x: 300, z: 140 }, { t: 'Skyreavers (25-26)', x: -300, z: 160 }, { t: 'The Eye (26-27)', x: 0, z: -40 }, { t: 'The Halcyon Gate (26-27)', x: 0, z: -360 }],
  nodes: [['skysilver', 'ore', 'oresilver', 125, null, 26], ['cloudbloom', 'herb', 'herbmeadow', 125, null, 26]],
  scenery: { density: 16000, tuft: '#9ac87a', kinds: [['birch', .02, 1, 1.8, 'hi'], ['crystal', .006, .8, 1.6, 'hi'], ['icerock', .02, .8, 2.2]] },
  sky: { fog: '#dfe8f4', top: '#5a8ad0', hor: '#f4f8fc', k: .55, far: 260 },
});
defineDungeon({ key: 'galeforge', name: 'The Gale-Forge', parent: 'sky1', plan: 'cells', floor: '#6a5a48', rock: '#2a2420', fog: '#4a3a2a', light: .6, lvl: [25, 26], prop: 'lantern',
  mobs: ['outrider', 'sunpriest', 'stormelem', 'galewisp'], bosses: ['forgefather', 'sparkmistress', 'thebellows', 'forgemasterhal'], exitLabel: 'Back out into the Stormreach' });
defineDungeon({ key: 'stormspire', name: 'The Storm-Spire', parent: 'sky1', plan: 'winding', floor: '#a8b0c0', rock: '#3a4050', fog: '#7a88a0', light: .55, lvl: [26, 27], prop: 'bluelamp',
  mobs: ['stormelem', 'galewisp', 'outrider', 'stormgriffon', 'sunpriest'], bosses: ['windcaller', 'twinbolts', 'stormhawk', 'lordtempest'], exitLabel: 'Back down to the Thunderheads' });
defineDungeon({ key: 'thunderthrone', name: 'The Thunder Throne', parent: 'sky1', plan: 'nave', floor: '#d8d0b8', rock: '#4a4438', fog: '#a8a8b8', light: .6, lvl: [29, 30], prop: 'banner', propArg: '#c8a050', raid: true,
  mobs: ['outrider', 'sunpriest', 'hollowed', 'stormelem'], bosses: ['stormguard', 'thehollowfleet', 'tempestqueen', 'stormking'], exitLabel: 'Back down to the Halcyon Gate' });
addDungeon30('galeforge', 'The Gale-Forge', [25, 26]); addDungeon30('stormspire', 'The Storm-Spire', [26, 27]); addRaid30('thunderthrone', 'The Thunder Throne');
tier({ wreckfields: 10, eyeofstorm: 10, galeforge: 10, stormspire: 10, thunderthrone: 12 });

QUESTS.push(...finish30([
  { id: 'yss1', story: true, giver: 'isolde', lvl: 25, pre: 'af7', name: 'Landfall', where: 'galesisles', ...W1, rep: F(300), obj: { kill: STORM, n: 12, near: 'galesisles', nearR: 220, what: 'Clear 12 storm creatures from the isles around Gale\'s Rest' },
    say: ["Welcome to the Stormreach, Lightkeeper. That's what Ammara calls it, anyway: the walls of storm the Halcyon keep round their empire.", "Gale's Rest is ours now, but the griffons and the sharks haven't been told. Twelve of them, so we can build a railing without being eaten."], done: ["A railing! Tamsin's putting up a railing. I never thought I'd be so happy about a railing."] },
  { id: 'yws1', story: true, giver: 'oriel', lvl: 25, pre: 'tw3', name: 'The Wardens Come Up', where: 'thunderheads', ...W1, rep: Wd(300), obj: { kill: ['stormelem', 'galewisp', 'stormgriffon'], n: 12, near: 'thunderheads', nearR: 220, what: 'Clear 12 storm creatures from the Thunderheads' },
    say: ["Seventeen Wardens and one very tired lift. We've taken Thunderhead Watch. Now we hold it, and to hold it, the storms around it need to learn some manners."], done: ["The first Warden to stand in the sky in a thousand years, and she's complaining about the wind. Well done, all the same."] },
  { id: 'yss2', story: true, giver: 'ammara', lvl: 25, pre: 'yss1', name: 'Don\'t Tell Them Your Name', where: 'halcgate', ...W1, rep: F(300), obj: { collect: HALC, item: 'Halcyon Name-Seal', chance: .5, n: 6, what: 'Take 6 name-seals from the Halcyon at the Gate' },
    say: ["Every Halcyon soldier wears a seal with their name on it, in case they forget it. The hollowed ones still wear them. They've forgotten, but the seal remembers.", "Bring me six. I'll read them. Somebody should say their names out loud, one last time."], done: ["Corwen. Lissa. Tamar. Old Brannoc, who used to sneak me honey cakes. Elys. Thorn. Thank you. They're said now."] },
  { id: 'yss3', story: true, giver: 'tamhale', lvl: 25, pre: 'yss1', name: 'Deserters', where: 'wreckfields', ...W1, rep: F(300), obj: { kill: REAV, n: 12, near: 'wreckfields', nearR: 240, what: 'Break 12 Skyreaver deserters at the Wreck-Fields' },
    say: ["You know the old Resolute? The one that flew for eleven minutes? Half her crew deserted when she came down. They found their own way up, and now they rob anything that flies.", "Skyreavers, they call themselves. I call them the bosun's mates who owe me money. Twelve of them."], done: ["Silt's crew, every one. She's holed up in the wreck of the Resolute itself. Of course she is."] },
  { id: 'yss4', story: true, giver: 'tamhale', lvl: 26, pre: 'yss3', name: 'Captain Silt', where: 'wreckfields', ...W1, rep: F(400), obj: { named: 'captainsilt', n: 1, what: 'Defeat Captain Morwen Silt at the Wreck of the Resolute' },
    say: ["Morwen Silt was the Resolute's first mate. She thinks the Commodore's mad. She's not wrong. But she's raiding our supply lines, and that I can't forgive.", "She's in the wreck. Don't kill her if you don't have to. Bring her down, though."], done: ["She'll live. She's in the brig. She asked if we needed a first mate. I said I'd think about it."] },
  { id: 'yws2', story: true, giver: 'merrinpike', lvl: 26, pre: 'yws1', name: 'The Eye of the Storm', where: 'eye', ...W1, rep: Wd(400), obj: { named: 'theeye', n: 1, what: 'Close the Eye at the centre of the Stormreach' },
    say: ["There's an eye in the middle of the storm. A real one. It opened a week ago, and since then the storms have been watching us. Close it."], done: ["The storms are just storms again. Stupid, angry, blind storms. Much better."] },
  { id: 'yss5', story: true, giver: 'ammara', lvl: 26, pre: 'yss2', name: 'The Gale-Forge', where: 'halcgate', ...W1, rep: F(400), obj: { named: 'forgemasterhal', n: 1, what: 'Stop Forgemaster Halvor in the Gale-Forge' },
    say: ["The Gale-Forge makes the lightning that keeps Halcyon's cities in the air. It's never made anything else. But Ammara saw the Starwrights there, asking Halvor to make ships.", "Ships that fly up, not down. Ships for the stars. Go and see what he's building."], done: ["Hulls. Dozens. With no doors. Ships for things that don't need to breathe. That's what the Starwrights want from Halcyon: a fleet."] },
  { id: 'yws3', story: true, giver: 'oriel', lvl: 26, pre: 'yws2', name: 'The Empress\'s Brother', where: 'thunderheads', ...W1, rep: Wd(400), obj: { named: 'lordtempest', n: 1, what: 'Defeat Lord Tempest Halcyon in the Storm-Spire' },
    say: ["Lord Tempest holds the storms that keep Halcyon apart from the world. He's the Empress's brother. If anyone still has a name in Halcyon, it's him.", "Go up the Storm-Spire. Bring him down, or bring him to his senses."], done: ["He told you to go back down. He was warning you, Lightkeeper. He's still got his name. Hold on to that."] },
  { id: 'yss6', story: true, giver: 'isolde', lvl: 27, pre: 'yss5', name: 'The Thunder Throne', where: 'halcgate', ...W1, rep: F(600), obj: { named: 'stormking', n: 1, what: 'Defeat Aurion, the Thunder-King, on the Thunder Throne (12-person raid)' },
    say: ["The Thunder-King sits at the Halcyon Gate, on a throne made of lightning, and he says nothing gets past him into the Empire. Well. We're getting past him.", "Raise a raid. Twelve of the best. Then we sail on, to the Crystal Shelf, and the Empress's own city."], done: ["The Gate is open. The cloud-bridge to the Crystal Shelf is clear. And Aurion... he said he was still loyal. I hope she's worth it."] },
  { id: 'ysq1', giver: 'tamhale', lvl: 25, pre: 'yss1', name: 'Shark Fin Soup', where: 'galesisles', ...W1, rep: F(250), obj: { collect: ['cloudshark'], item: 'Cloud Shark Fin', chance: .5, n: 6, what: 'Bring back 6 cloud shark fins' },
    say: ["The cook says cloud shark fin soup is a delicacy in Halcyon. I say the cook has never had to catch one. Six fins, and we'll find out who's right."], done: ["It tastes of thunder. I'm not sure that's good. I'm having seconds."] },
  { id: 'ysq2', giver: 'merrinpike', lvl: 25, pre: 'yws1', name: 'Griffon Feathers', where: 'thunderheads', ...W1, rep: Wd(250), obj: { collect: ['stormgriffon'], item: 'Storm Griffon Feather', chance: .5, n: 8, what: 'Gather 8 storm griffon feathers' },
    say: ["Storm griffon feathers make the best arrows in the world. Lightning in every shot. Eight feathers, and I'll make you a quiver to be proud of."], done: ["Crackling. Lovely. Don't touch the tips."] },
  { id: 'ysq3', giver: 'ammara', lvl: 26, pre: 'yss2', name: 'The Fallen Colossus', where: 'colossus', ...W1, rep: F(250), obj: { at: 'colossus', r: 14, what: 'Visit the Fallen Colossus and read the words on its plinth' },
    say: ["There's a statue on the isle west of the Eye. The Colossus of the First Empress, who lifted Halcyon. It fell the day the Starwrights came. I'd like to know what it says on the plinth. I was never allowed to go and look."], done: ["'We rose so that we would never have to kneel.' Oh. Oh, that's sad, now."] },
  { id: 'ysr1', giver: 'tamhale', lvl: 26, name: 'Thunderjaw', where: 'eye', ...W1, rep: F(300), obj: { named: 'thunderjaw', n: 1, what: 'Hunt Thunderjaw, the great cloud shark' },
    say: ["There's a shark out there called Thunderjaw that ate the Resolute's figurehead. I loved that figurehead. It had my face."], done: ["You got it back? You got it back! Still has my nose."] },
  { id: 'ysr2', giver: 'tamhale', lvl: 26, name: 'Captain Marrow', where: 'wreckfields', ...W1, rep: F(300), obj: { named: 'captainmarrow', n: 1, what: 'Hunt down Captain Rook Marrow, the worst of the Skyreavers' },
    say: ["Rook Marrow robbed three supply barges and threw the crews overboard. Into the cloud. You know what's under the cloud? Neither do they, now."], done: ["Good. Rook's done throwing anyone anywhere."] },
  { id: 'ysy1', daily: true, giver: 'tamhale', lvl: 25, pre: 'yss1', name: 'Daily: Clear Skies', ...W1, rep: F(200), obj: { kill: STORM, n: 12, what: 'Defeat 12 storm creatures' },
    say: ["The barges come up every day, and every day something tries to eat them. Twelve, today."], done: ["Another barge safe. Thank you."] },
  { id: 'ysy2', daily: true, giver: 'merrinpike', lvl: 26, pre: 'yws2', name: 'Daily: Hold the Watch', ...W1, rep: Wd(250), obj: { kill: HALC, n: 10, what: 'Defeat 10 Halcyon soldiers or hollowed sailors' },
    say: ["The Halcyon test our walls every day. Ten of them, before they get any ideas."], done: ["Wall's still standing. So are you. Good."] },
]));
