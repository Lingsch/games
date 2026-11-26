// Build 7: level-20 soulbound weapons. Every class has its own chain of three quests from its family's master at
// Emberwatch: take a relic from one of the wastes' great foes, gather what the weapon needs, then face the spirit of
// the first of your class at the Proving Stone and earn the weapon it carried.
import { S, chat, X, TAU } from './core.js';
import { world, hgt } from './world.js';
import { MOBS, QUESTS, GIVERS, CLASSES, WTYPE, BASE_NAMES, makeItem, xpNeed } from './data.js';
import { TALK } from './dialogue.js';
import { gearBudget } from './crafting.js';
import { W7 } from './wastes7.js';

Object.assign(GIVERS, {
  halk: { name: 'Swordmaster Oren Halk', title: 'Master of the Fighters', model: 'guard' },
  ysmay: { name: 'Sister Ysmay', title: 'Master of the Healers', model: 'priest' },
  quietman: { name: 'The Quiet Man', title: 'Master of the Rogues', model: 'villager0' },
  ravel: { name: 'Archmagus Ravel', title: 'Master of the Mages', model: 'hermit' },
});
Object.assign(TALK, {
  halk: { bio: 'Oren Halk has trained every fighter Corrand has sent to Emberwatch for thirty years. He has buried most of them. He is very particular about footwork.', greet: ['Feet first. Then the sword. Then the shouting.', 'A weapon is only as good as the arm behind it. A soulbound weapon is as good as the soul.'], topics: [] },
  ysmay: { bio: 'Sister Ysmay has kept more soldiers alive than anyone at Emberwatch, and she has opinions about every one of them who died anyway.', greet: ['Stand still. You are bleeding on my floor.', 'Healing is easy. Keeping fools from needing it is the hard part.'], topics: [] },
  quietman: { bio: 'Nobody knows the Quiet Man\'s name. Nobody is entirely sure he\'s there until he speaks. He has taught every scout and cutpurse at Emberwatch, including Wren Ashby, who still cannot sneak up on him.', greet: ['...', 'You walk like a cart full of pans. We can fix that.'], topics: [] },
  ravel: { bio: 'Archmagus Ravel left the towers of Corrand to study the blight, and stayed to fight it. He is a hundred and four years old and claims it is the blight keeping him alive out of spite.', greet: ['Power is cheap. Control is expensive. Pay attention.', 'Every spell is a promise to the world. Keep yours.'], topics: [] },
});
const MASTER = { Fighter: 'halk', Healer: 'ysmay', Rogue: 'quietman', Mage: 'ravel' };
// cls: [the weapon's name, the first of the class, the foe who holds the relic, the relic, what the weapon needs (from whom), and a line in the master's voice]
const SOUL = {
  bulwark: ['Unbroken, the Last Wall', 'Dame Ottila the Unbroken', 'gaolerking', 'the Gate-Key of Corrand', ['legionknight'], 'Legion Shield-Iron', 'She held a gate alone for three days. The gate held. She didn\'t, and she never once complained about it.'],
  wardancer: ['Whirlwind of Saint Cael', 'Cael the Dancer', 'lordvanthe', "Vanthe's Broken Spur", ['bonewarden'], 'Vharosi Sword-Steel', 'Cael fought like the wind dances: never where you aimed, always where you weren\'t looking.'],
  bladewarden: ['Warden\'s Oath', 'Talric the Sworn', 'warlordbrask', "Brask's Stolen Banner", ['legionknight', 'legionbow'], 'Oathsilver', 'Talric swore to guard a bridge and died on it. They built the new bridge around his sword.'],
  monk: ['The Still Hand', 'Master Seon of the Quiet Mountain', 'theflayed', 'a Prayer-Bead of the Flayed Saint', ['vharosghost'], 'Ghost-Calm', 'Seon never struck a blow in anger. He struck a great many in perfect calm.'],
  cleric: ['Dawnstaff of the Four', 'Mother Elspeth of the First Light', 'bishopmarrow', "Bishop Marrow's Holy Seal", ['deathsworn', 'deathcaller'], 'Stolen Altar-Gold', 'Elspeth walked into the plague-city of Varn with nothing but a staff and a prayer, and walked out with everyone.'],
  aegis: ['Aegis of the Warding Dawn', 'Brother Halvard the Shield', 'thehollowtwins', 'a Shard of the Twins\' Mirror', ['ashwraith'], 'Ward-Ash', 'Halvard\'s wards never broke. Not once. Not even when he did.'],
  lifebinder: ['The Living Thread', 'Weaver Imogen of the Green', 'grandmotherroot', 'a Living Seed from Grandmother Root', ['witchroot'], 'Unblighted Heartwood', 'Imogen could stitch a wound shut with a word and a thread of green light. She stitched the world shut once, for an afternoon.'],
  druid: ['Thornheart, the Grove\'s Promise', 'Old Mother Fen', 'mothergrub', "Mother Grub's Silk-Heart", ['rotweaver'], 'Clean Spider-Silk', 'Fen talked to trees, and the trees talked back, and once they marched for her.'],
  longwatch: ['Farsight, the Never-Missing', 'Iselle Longwatch', 'thepalequeen', "the Pale Queen's Circlet", ['carrionwasp'], 'Wasp-Glass', 'Iselle once shot a message through the keyhole of a besieged castle from a mile away. The message said "hold on." They did.'],
  knifeshade: ['Whisper and Nothing', 'The First Shade, whose name was taken', 'thetithe', "the Tithe's Ledger-Knife", ['vharosghost', 'ashwraith'], 'Shade-Silk', 'The first Knifeshade gave away her name so no one could ever call her. She came when she chose.'],
  blightblade: ['Rotbane, the Clean Cut', 'Corvan Blightborn', 'forgemasterkael', "Kael's Quenching-Tongs", ['cinder', 'boneguard'], 'Purified Blight-Steel', 'Corvan was born in the blight and learned to use it against itself. He said poison was just medicine with a grudge.'],
  bard: ['The Last Verse', 'Merriwen the Ballad-Keeper', 'choirmaster', "the Choirmaster's Tuning Fork", ['deathsworn'], 'Hymn-Wire', 'Merriwen sang an army to sleep once, so the farmers could get the harvest in. Then she sang them awake again, slightly to the east.'],
  elementalist: ['Stormheart Rod', 'Archon Valla of the Four Winds', 'slagmaw', "a Core of Slagmaw's Fire", ['cinder'], 'Living Ember', 'Valla held a storm in one hand and a fire in the other and asked the sea what it thought about it. The sea agreed with her.'],
  warlock: ['The Grudge Eternal', 'Morwen the Unforgiving', 'archdeaconvesh', "Archdeacon Vesh's Black Hymnal", ['deathcaller'], 'Grave-Ink', 'Morwen kept a list of everyone who wronged her. It was very long, and she worked through it very patiently.'],
  binder: ['Chainbreaker, the Bound Word', 'Tessaly the Binder', 'turnkey', "the Turnkey's Iron Ring", ['legionknight', 'plaguehulk'], 'Gaol-Iron', 'Tessaly bound a demon into a teacup, then drank tea from it every morning to annoy it.'],
  illusionist: ['Mirrorglass, That Which Is Not', 'Lord Hallow the Pretender', 'hangedprince', "the Hanged Prince's Noose", ['vharosghost'], 'Glass-Ghost', 'Lord Hallow convinced an invading army it had already lost, so it went home. Nobody ever found out if he was really there.'],
};
const RING = Object.keys(SOUL);
const qx = f => Math.round(xpNeed(19) * f);
for (const [cls, [wname, founder, foe, relic, mobs, mat, line]] of Object.entries(SOUL)) {
  const C = CLASSES[cls], m = MASTER[C.family], nm = C.name, key = 'trial_' + cls, id = 'sb_' + cls, foeName = () => MOBS[foe]?.name || 'its keeper';
  MOBS[key] = { name: `The Spirit of ${founder}`, kind: 'ghostnpc', hpM: 2.2, dmgM: 1.25, spd: 5.4, range: C.role === 'healer' || C.family === 'Mage' ? 18 : 2.6, ranged: C.role === 'healer' || C.family === 'Mage' || cls === 'longwatch', caster: C.family === 'Mage' || C.role === 'healer', school: C.family === 'Mage' ? 'frost' : 'holy', weak: null, resist: null, scale: 1.4, aggro: 30, social: 0, mechs: ['fear', 'pool', 'enrage'],
    lines: { start: `So. Another ${nm}. Show me what you carry, and I will show you what I carried.`, half: 'Better. Again. Harder.' } };
  QUESTS.push(
    { id: id + '1', giver: m, lvl: 20, needLvl: 20, forCls: cls, name: `The ${nm}'s Calling`, xp: qx(.4), gold: 40, obj: { named: foe, n: 1, what: `Take ${relic} from ${foeName()}` },
      say: [`Twenty, and a ${nm}. Good. Then you're ready to hear about ${founder}, the first of your kind, and the weapon they carried: ${wname}.`, `${line} The weapon is still out there, in a way. To call it, you'll need ${relic}, and ${foeName()} has it.`],
      done: [`${relic}. Yes. I can feel it humming from here. It remembers what it used to belong to.`] },
    { id: id + '2', giver: m, lvl: 20, needLvl: 20, forCls: cls, pre: id + '1', name: `${mat} for ${wname}`, xp: qx(.35), gold: 30, obj: { collect: mobs, item: mat, chance: .4, n: 5, what: `Gather 5 ${mat} from the ${mobs.map(k => MOBS[k].name).join(' or ')} of the wastes` },
      say: [`A soulbound weapon is not forged. It is persuaded. ${relic} gives it a memory; now it needs a body, and the body is ${mat}.`, `Five measures. The ${mobs.map(k => MOBS[k].name).join(' and ')} carry it, whether they know it or not.`],
      done: ['Good. Now it has a body and a memory. All it needs is a soul, and that part is up to you.'] },
    { id: id + '3', giver: m, lvl: 20, needLvl: 20, forCls: cls, pre: id + '2', name: `The Proving of ${wname}`, xp: qx(.6), gold: 80, soul: cls, obj: { named: key, n: 1, what: `Face the Spirit of ${founder} at the Proving Stone, east of Emberwatch` },
      say: [`There's a stone east of the walls where the first of every class can be called. Take the relic and the ${mat} there, and ${founder} will come.`, `They won't hand ${wname} over. You'll have to show them you deserve it. Go alone, or don't. ${founder} won't care either way.`],
      done: [`So ${founder} let it go. ${wname} is yours now, {hero}, bound to you and no one else.`, 'Use it well. It has a long memory, and it will remember you.'] },
  );
}
// the spirits only come to the Proving Stone when called
X.zone.push(zone => {
  if (zone !== 'wastes') return;
  const P2 = world.spots.proving; if (!P2) return;
  for (const cls of RING) world.spawns.push({ x: P2.x, z: P2.z, y: hgt(P2.x, P2.z), mob: 'trial_' + cls, named: 'trial_' + cls, lvl: [20, 20], respawn: 30, area: 0, alive: null, timer: 0, when: () => S.quests['sb_' + cls + '3']?.state === 'active' });
});
// the weapon itself: the best weapon a level-20 hero can hold, and it can't be traded
export function soulWeapon(cls) {
  const [wname] = SOUL[cls], type = WTYPE[cls][0], b = gearBudget(20, 'weapon') * 1.5;
  return makeItem({ name: wname, slot: 'weapon', type, lvl: 20, rarity: 4, stats: { pow: Math.round(b * .7), sta: Math.round(b * .3), crit: 3 }, value: 1, soulbound: true, cls });
}
X.turnin.push(q => { if (q.soul) { const it = soulWeapon(q.soul); X.ui.toast?.(`${it.name}!`); import('./game.js').then(G => { if (!G.addToBag(it)) chat('sys', null, 'Your bags are full; the weapon waits in your bank.'), S.bank.push(it); else chat('loot', null, `You receive ${it.name}, soulbound to you.`); }); } });
