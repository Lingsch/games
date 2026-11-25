// Build 6: more to do in the Vale. Three side chains, five new roaming rares, world events (the dead rise at night,
// brigands raid the farms by day), and a third murder case, set in the Vale's own town.
import { S, TAU, chat, pick, rnd, irnd, isNight, X } from './core.js';
import { world, hgt, valeHooks, regionAt, depthAt } from './world.js';
import { MOBS, QUESTS, GIVERS, xpNeed, randomGear } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { TESTIMONY } from './mystery.js';
import * as Loot5 from './loot5.js';
import * as Cb from './combat.js';
import * as Game from './game.js';

// ---------- new enemies and rares ----------
const U = { undead: true }, B = { beast: true }, HU = { human: true };
Object.assign(MOBS, {
  risen: { name: 'Risen Villager', kind: 'ghoul', hpM: .95, dmgM: 1, spd: 5.4, range: 2.2, weak: 'fire', resist: 'shadow', scale: .95, aggro: 11, social: 12, ...U },
  raider: { name: 'Gilt Raider', kind: 'bandit2', hpM: 1, dmgM: 1.05, spd: 5.8, range: 2.2, weak: 'frost', resist: null, scale: 1, aggro: 14, social: 18, ...HU },
  raiderbow: { name: 'Gilt Raider Archer', kind: 'xbow', hpM: .85, dmgM: .95, spd: 5.4, range: 22, ranged: true, weak: 'earth', resist: null, scale: 1, aggro: 16, social: 18, ...HU },
  tatters: { name: 'Mister Tatters', kind: 'treant', hpM: 1.5, dmgM: 1.1, spd: 5.2, range: 2.6, weak: 'fire', resist: 'earth', scale: .75, aggro: 12, social: 20, mechs: ['fear'] },
  bristle: { name: 'Old Mother Bristle', kind: 'boarbig', hpM: 1.7, dmgM: 1.15, spd: 6, range: 2.8, weak: 'storm', resist: 'frost', scale: 1.25, aggro: 12, social: 20, ...B, mechs: ['charge', 'cleave'] },
  greymane: { name: 'Old Greymane', kind: 'wolf', hpM: 1.7, dmgM: 1.15, spd: 6.6, range: 2.6, weak: 'fire', resist: 'frost', scale: 1.6, aggro: 13, social: 20, ...B, mechs: ['charge', 'hounds'], adds: 'wolf' },
  widow: { name: 'The Lantern Widow', kind: 'ghostnpc', hpM: 1.6, dmgM: 1.1, spd: 5.4, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'frost', scale: 1.2, aggro: 14, social: 20, ...U, mechs: ['fear', 'pool'] },
  inkwraith: { name: 'The Inkwraith', kind: 'wraith', hpM: 1.7, dmgM: 1.1, spd: 5.4, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'storm', resist: 'frost', scale: 1.3, aggro: 15, social: 20, ...U, fly: .4, mechs: ['pool', 'spawn'], adds: 'wraith' },
});
Object.assign(MOB_LORE, {
  risen: 'A villager from the old Hollin graves, risen with the dark. They walk back to the houses they used to live in.',
  raider: 'One of the Gilt raiders, a band that still wears Varro Gilt\'s crown on their sleeves, whoever is paying them now.',
  raiderbow: 'A Gilt raider with a crossbow, who covers the others while they carry off the grain.',
  tatters: 'A scarecrow that has decided it would rather do the scaring up close. Nobody knows who stitched it, and nobody wants to.',
  bristle: "Grumblesnout's mother, enormous and furious, come looking for her boy.", greymane: 'The oldest wolf in the Vale, grey to the tail, who leads the pack and has never once been caught.',
  widow: 'She walks the Hollin lanes at night with a lantern, looking for a husband who never came home from the war.', inkwraith: 'A wraith made of spilled ink and stolen pages. It reads you while it fights you.',
});

// ---------- placing rares, the night's dead, and the raid camps ----------
const RAID = { x: -150, z: 36 };   // the farms by the shrine road, between town and Little Hollin
valeHooks.build = (prev => a => {
  if (prev) prev(a);
  const sp = world.spawns, rng = a.rng, put = o => sp.push({ ...o, y: hgt(o.x, o.z), alive: null, timer: 0 });
  const near = (x, z, R) => { for (let i = 0; i < 200; i++) { const p = { x: x + (rng() * 2 - 1) * R, z: z + (rng() * 2 - 1) * R }; const h = hgt(p.x, p.z); if (depthAt(p.x, p.z) < .1 && h > -1 && !world.clearSpots.some(c => Math.hypot(c.x - p.x, c.z - p.z) < c.r) && Math.hypot(p.x - a.town.x, p.z - a.town.z) > 60) return p; } return { x, z }; };
  const S2 = world.spots;
  put({ ...near(60, 40, 40), mob: 'tatters', named: 'tatters', lvl: [3, 3], respawn: 420, area: 0 });
  put({ ...near(-120, 60, 30), mob: 'bristle', named: 'bristle', lvl: [5, 5], respawn: 480, area: 1 });
  put({ ...near(40, 180, 60), mob: 'greymane', named: 'greymane', lvl: [7, 7], respawn: 540, area: 2 });
  put({ ...near(S2.hollin.x + 10, S2.hollin.z - 20, 18), mob: 'widow', named: 'widow', lvl: [6, 6], respawn: 420, area: 1, when: isNight });
  put({ ...near(S2.waste.x - 60, S2.waste.z - 40, 40), mob: 'inkwraith', named: 'inkwraith', lvl: [9, 9], respawn: 540, area: 3 });
  // after dark the old graves give up their dead: around the graveyard and Little Hollin
  for (const [c, n, lvl] of [[S2.graveyard, 10, [3, 5]], [S2.hollin, 10, [4, 6]]]) for (let i = 0; i < n; i++) { const p = near(c.x, c.z, 34); put({ ...p, mob: 'risen', lvl, respawn: 45, area: regionAt(p.x, p.z), when: isNight }); }
  // the raid camp, only there while a raid is on
  world.spots.raid = { ...RAID };
  for (let k = 0; k < 8; k++) { const a2 = k / 8 * TAU; put({ x: RAID.x + Math.cos(a2) * 5, z: RAID.z + Math.sin(a2) * 5, mob: k % 3 === 2 ? 'raiderbow' : 'raider', lvl: [5, 7], respawn: 99999, area: 1, camp: 'raid', raid: true, when: () => !!S.ext?.raid?.on });
  }
  put({ x: RAID.x, z: RAID.z, mob: 'raidcaptain', named: 'raidcaptain', lvl: [7, 7], respawn: 99999, area: 1, camp: 'raid', raid: true, boss2: true, when: () => !!S.ext?.raid?.on });
})(valeHooks.build);
MOBS.raidcaptain = { ...MOBS.raider, name: 'Raid-Captain Sorrel Gilt', hpM: 1.7, scale: 1.25, mechs: ['cleave', 'call'], adds: 'raider', lines: { start: "Varro's dead, and the Gilt band eats anyway. Grain, gold, whatever's not nailed down.", half: 'Lads! Burn the barns!' } };

// ---------- world events: the brigand raids ----------
// every 14-22 minutes of daylight in the Vale, the Gilt raiders hit the farms. Break the raid for gold, gear and standing.
let raidT = 600 + Math.random() * 300;
export const raidSoon = (t = 1) => { raidT = t; };
X.tick.push(dt => {
  if (S.zone !== 'vale' || !S.hero) return;
  const r = S.ext.raid = S.ext.raid || { on: false };
  if (r.on) {
    const raidSp = world.spawns.filter(s => s.raid);
    for (const s of raidSp) if (s.alive && !s.alive.dead) s.spawned = true;
    const broken = raidSp.length && raidSp.every(s => s.spawned && (!s.alive || s.alive.dead));
    if (broken || S.time > r.until) {
      r.on = false; raidT = 840 + Math.random() * 480;
      for (const s of raidSp) { if (s.alive && !s.alive.dead) { s.alive.remove = true; s.alive.dead = true; } s.alive = null; s.spawned = false; s.timer = 0; }
      if (broken) { chat('sys', null, 'The raid is broken. The farmers come out of hiding, cheering, and press a purse of coin into your hands.'); S.gold += 25 + irnd(0, 15); const it = randomGear(Math.max(5, S.hero.lvl), S.heroCls, .5); if (Game.addToBag(it)) chat('loot', null, `You receive ${it.name}.`); Game.save(); }
      else chat('sys', null, 'The raiders load their carts and slip away down the Kingsroad.');
    }
    return;
  }
  if (isNight()) return;
  if ((raidT -= dt) > 0) return;
  r.on = true; r.until = S.time + 420;
  chat('sys', null, `A horn sounds from the shrine road. The Gilt raiders are hitting the farms between ${world.names.town} and Little Hollin!`);
  for (const f of S.fakes || []) if (f.fake && f.lvl >= 5 && Math.random() < .3) { chat('gen', f.name, pick(['RAID on the shrine road, who\'s coming', 'gilt raiders at the farms!! go go', 'raid! need healers at the farms', 'omw to the raid'])); break; }
});

// ---------- people ----------
Object.assign(GIVERS, { bryn: { name: 'Bryn Holloway', title: 'Cards, dice and bad decisions', model: 'villager0' }, registrar3: { name: 'Junior Clerk Pim', title: 'Guild Registrar (acting)', model: 'villager1' },
  jmott: { name: 'Teller Mott', title: 'In the cells', model: 'villager2' }, jbryn: { name: 'Bryn Holloway', title: 'In the cells', model: 'villager0' }, jtally: { name: 'Clerk Oswin Tally', title: 'In the cells', model: 'villager0' } });
valeHooks.build = (prev => a => {
  if (prev) prev(a);
  const t = a.town, J = world.spots.jail || { x: 9.9, z: -22.8 };
  world.spots.bankback = { x: t.x + 9, z: t.z + 30 };
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'v6' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? 0, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  prop('lorebook', 'clue3', 'A torn ledger', t.x + 6, t.z + 30, { lore: 'c3ledger' });
  prop('opengrave', 'clue3', 'Ink-black fingerprints', t.x + 10.5, t.z + 30.5, { lore: 'c3prints', yaw: .6 });
  prop('lorebook', 'clue3', 'A broken wax seal', t.x + 13, t.z + 28.5, { lore: 'c3seal' });
  world.storyNpcs.push({ key: 'bryn', x: t.x + 13.5, z: t.z + 9.8, yaw: Math.PI, unless: ['case3', 'bryn'] });
  world.storyNpcs.push({ key: 'registrar3', x: t.x + 15, z: t.z + 8.2, yaw: Math.PI, when: ['case3', 'tally'] });
  for (const [k, v] of [['jmott', 'mott'], ['jbryn', 'bryn'], ['jtally', 'tally']]) world.storyNpcs.push({ key: k, x: J.x + 4.8, z: J.z + .6, yaw: Math.PI, when: ['case3', v] });
})(valeHooks.build);
// the registrar and the banker step out when they're the ones in the cells
valeHooks.build = (prev => a => { if (prev) prev(a); const bk = world.storyNpcs.find(n => n.key === 'banker'); if (bk) Object.defineProperty(bk, 'name', { get: () => S.flags?.case3 === 'mott' ? 'Teller Fennimore Mott' : undefined, configurable: true }); })(valeHooks.build);
Object.assign(TALK, {
  bryn: { bio: 'Bryn Holloway plays cards at the tavern every night and loses at them most nights. He owed money to half the town, and to Edwin Marsh most of all.', greet: ["Fancy a hand? Penny a point. I'm due a win. I've been due a win for about six years.", "Poor Edwin. He was the only one in town who'd still lend me money."], topics: [] },
  registrar3: { bio: 'Pim was Clerk Tally\'s junior for three years. Now she runs the guild rolls herself, and she has already found eleven mistakes in his handwriting.', greet: ["Guild business? I can do that. I've been doing all of it for years anyway.", 'Mister Tally kept two ledgers. I only found the second one after he was gone.'], topics: [] },
  jmott: { bio: 'Teller Mott, in the cells for the murder of his clerk.', greet: ["Thirty years I kept that vault, and not a copper went missing. Not ONE.", "My nephew's running the bank. Count your coins twice."], topics: [] },
  jbryn: { bio: 'Bryn Holloway, in the cells for the murder of Edwin Marsh.', greet: ["I owed him money! You don't kill the only man who'll still lend to you!", "Deal you in? I've got a deck in here. I've got nothing but time."], topics: [] },
  jtally: { bio: 'Clerk Oswin Tally, in the cells at last.', greet: ['Every guild in the realm paid its dues through my books. Every one. And every tenth crown went east, to the Choir.', "Edwin read the second ledger. Edwin always did read too carefully."], topics: [] },
});
Object.assign(LORE, {
  c3ledger: { title: "Edwin Marsh's Torn Ledger", where: 'bankback', text: "A page torn from the bank's deposit book, in Edwin's neat hand: 'Guild dues, deposited by O. Tally: 340 crowns. Guild dues, withdrawn the same night by O. Tally: 34 crowns, no receipt. Same again last month. And the month before. Ask Mott.' The last two words are underlined three times." },
  c3prints: { title: 'Ink-Black Fingerprints', where: 'bankback', text: "Smudged black fingerprints on the bank's back wall, as if someone steadied himself there. Not blood. Ink, the good black ink that costs a crown a bottle and only a clerk would bother to buy." },
  c3seal: { title: 'A Broken Wax Seal', where: 'bankback', text: "A crumbled wax seal, red, pressed with a tiny quill and scroll. Every guild charter in the Vale is sealed with that mark. It belongs to the Guild Registrar's office." },
  c3choir: { title: 'A Receipt in Grey Wool', where: 'bankback', text: "Found on a Choir initiate, folded small: 'Received from the town's guild rolls, by way of O. T., thirty-four crowns for the Deacon's work. The Choir thanks the clerk for his devotion.'" },
});
TESTIMONY.c3b = {
  banker: () => ["Edwin was my clerk for six years, and the most careful man I ever hired. He'd been fretting over the deposit book for a week, but he wouldn't tell me why. He said he wanted to be sure first.", "The night he died, I was locking the vault. I heard him go out the back to speak with someone. I thought it was that gambler again."],
  bryn: () => ["I owed Edwin twelve crowns, and he never once asked for it back. Why would I kill him? He was my bank, my friend and my last chance, in that order.", "That night? I was losing at cards in the tavern until two. Ask anyone. Ask the people I was losing to."],
  registrar: () => ["Young Marsh? Terrible business. Terrible. He came by my office asking about guild dues, of all things. I told him the rolls were in perfect order. They are. Perfect.", "I was at my desk all evening, writing charters. I always am. You can ask the ink."],
};
// ---------- the quests ----------
const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f);
QUESTS.push(
  // the third case: a clerk dead behind the bank
  { id: 'c3a', giver: 'warden', lvl: 7, pre: 'c2d', pre2: 'm10', name: 'Ink and Blood', where: 'bankback', xp: qx(7, .4), gold: 10, obj: { inspect: 'clue3', n: 3, what: 'Search the lane behind the bank in {town} for clues' },
    say: ["Edwin Marsh, Teller Mott's clerk, was found dead in the lane behind the bank this morning. Inside our own walls, {hero}. Inside my town.", "You've done this twice now, so you know the drill. Look at everything. Read everything. Then come and tell me what you saw."],
    done: ["Skimmed guild dues, ink on the wall and a registrar's seal. That's a short list, and I don't like any of the names on it."] },
  { id: 'c3b', giver: 'warden', lvl: 7, pre: 'c3a', name: 'Inside the Walls', xp: qx(7, .45), gold: 12, obj: { ask: ['banker', 'bryn', 'registrar'], n: 3, what: 'Question Teller Mott at the bank, Bryn Holloway outside the tavern, and Clerk Tally the guild registrar' },
    say: ["Three people saw Edwin in his last week. Teller Mott, who owns the deposit book he was fretting over. Bryn Holloway, who owed him money. And Clerk Oswin Tally, who keeps the guild rolls.", "Talk to them. Somebody in my own town is lying to my face, and I want to know who."],
    done: ["The banker heard him go out to meet someone. The gambler was losing at cards. And the clerk says the rolls are perfect. Perfect. Nobody's rolls are perfect."] },
  { id: 'c3c', giver: 'warden', lvl: 8, pre: 'c3b', name: 'Where the Money Went', xp: qx(8, .45), gold: 12, lore: 'c3choir', obj: { collect: ['cultist', 'chanter'], item: 'A Folded Receipt', chance: .3, n: 1, what: 'Find out where the missing dues went: search the Pale Choir in the west' },
    say: ["Thirty-four crowns a month, missing from the guild dues. Money that size doesn't vanish. It goes somewhere.", "Every coin of dirty money in this Vale ends up in the Choir's hands sooner or later. Go and see if they've kept a receipt. Cultists love paperwork."],
    done: ["'The Choir thanks the clerk for his devotion.' A clerk. Well. That is a word that narrows things down."] },
  { id: 'c3d', giver: 'warden', lvl: 8, pre: 'c3c', name: 'Name the Killer, Once More', xp: qx(8, .55), gold: 15, obj: { talk: true, what: 'Tell Warden Ilse who killed Edwin Marsh' },
    say: ["Three names. A banker, a gambler and a clerk. I'll arrest whoever you say, and I'll trust you, {hero}, because you've earned it.", "But this one's inside my walls. Get it wrong, and I'll be locking up a neighbor."],
    done: ['Who killed Edwin Marsh?'],
    choices: [
      { t: 'Teller Mott. It was his deposit book.', set: { case3: 'mott' }, reply: "Mott. Thirty years of honest banking, and this is how it ends. Guards! ...I hope you're right." },
      { t: 'Bryn Holloway. He owed Edwin money.', set: { case3: 'bryn' }, reply: "The gambler. Owed him twelve crowns. Guards! ...I hope you're right." },
      { t: 'Clerk Oswin Tally. The skimmed dues, the ink, the seal, the receipt.', set: { case3: 'tally' }, reply: "The registrar. Skimming the guild dues for the Choir, and Edwin caught him at it. Ink on the wall and his seal in the mud. Guards! Fetch Clerk Tally, and his second ledger." },
    ] },
  // Haskett's prize pig
  { id: 'vh1', giver: 'haskett', lvl: 4, pre: 'h4', name: 'Wolves at the Sty', xp: qx(4, .4), gold: 7, obj: { kill: ['wolf'], n: 8, what: 'Drive off 8 Plains Wolves from the farms' },
    say: ["The wolves have found my prize pig, Duchess. She's in the sty with the door barred, and she's very upset, and frankly so am I.", "Eight wolves, and they'll get the message. Wolves are clever. They know when a farm's become more trouble than it's worth."],
    done: ["Duchess came out of the sty this morning and ate a whole bucket of apples. That's how I know she's feeling better."] },
  { id: 'vh2', giver: 'haskett', lvl: 4, pre: 'vh1', name: 'Turnips, Again', xp: qx(4, .4), gold: 8, obj: { collect: ['boar'], item: 'Stolen Turnip', chance: .5, n: 6, what: 'Take back 6 Stolen Turnips from the boars of the west road' },
    say: ["Ever since you dealt with Grumblesnout, the other boars have taken up his hobby. They dig up my turnips at night and carry them off in their mouths.", "Six turnips. I know exactly how many are missing, because I count them every morning. It's not a healthy habit, but here we are."],
    done: ["Six turnips, only slightly chewed. Duchess will eat the chewed ones. She's not proud."] },
  { id: 'vh3', giver: 'haskett', lvl: 5, pre: 'vh2', name: "Grumblesnout's Mother", xp: qx(5, .6), gold: 14, gear: true, obj: { named: 'bristle', n: 1, what: 'Deal with Old Mother Bristle on the west road' },
    say: ["There's a boar on the west road bigger than Grumblesnout ever was. The other farmers say it's his mother, come looking for him, and she's in a terrible mood.", "I can't say I blame her. But she's flattened two fences and a cart, and she's eyeing Duchess. Please."],
    done: ["She's gone? Oh, thank the Four. Duchess, did you hear? You can come out now. ...She's not coming out. She's eating. That's fine."] },
  // Wenlow's night walk
  { id: 'vw1', giver: 'wenlow', lvl: 5, pre: 'h6', name: 'When the Lanterns Go Out', xp: qx(5, .45), gold: 9, obj: { kill: ['risen'], n: 8, what: 'Lay 8 Risen Villagers to rest around Little Hollin or the graveyard. They walk only at night' },
    say: ["The old graves don't stay shut after dark anymore, dear. Folk who've been buried fifty years come walking back to the houses they lived in, and knock on the doors.", "Lay eight of them to rest for me. At night, mind. They're never out in the day. They're shy."],
    done: ["Eight. The Pottle family slept through the night for the first time this month. Their great-grandmother knocked on the door every night at three."] },
  { id: 'vw2', giver: 'wenlow', lvl: 5, pre: 'vw1', name: 'A Charm for the Doors', xp: qx(5, .45), gold: 10, obj: { collect: ['risen'], item: 'Grave Candle Stub', chance: .5, n: 5, what: 'Collect 5 Grave Candle Stubs from the Risen Villagers, at night' },
    say: ["Every one of them carries a candle stub, the ones that were burning at their wakes. If I melt those into charms, the dead won't knock on the doors that carry them.", "Five stubs. I'll make a charm for every house in Hollin."],
    done: ["Five. That's enough wax for... let me see... all of Hollin, and a little one for your door, wherever that may be."] },
  { id: 'vw3', giver: 'wenlow', lvl: 6, pre: 'vw2', name: 'The Lantern Widow', xp: qx(6, .6), gold: 16, gear: true, obj: { named: 'widow', n: 1, what: 'Find the Lantern Widow in the Hollin lanes at night, and give her rest' },
    say: ["There's one the charms won't stop. A woman with a lantern, walking the lanes after dark, calling a name. Her husband went to the summoner wars and never came home.", "She doesn't mean any harm, dear. But she's frightening the children, and I think she's very tired. Give her rest."],
    done: ["She's gone? Good. Did she find him? ...No, I don't suppose she did. Well. She's resting now. That will have to do."] },
  // Corwin's lost pages
  { id: 'vc1', giver: 'corwin', lvl: 7, pre: 'm11', name: 'Socks and Spellbooks', xp: qx(7, .45), gold: 12, obj: { collect: ['harpy'], item: 'Torn Spellbook Page', chance: .45, n: 6, what: 'Recover 6 Torn Spellbook Pages from the crag harpies' },
    say: ["The harpies behind my tower have moved on from stealing my socks to stealing my spellbooks. They line their nests with the pages. Theory of Wards, chapters four to nine. Very cozy, I'm sure.", "Get me six pages back. Ideally not chewed."],
    done: ["Chapter six! Chapter seven, mostly! This one is a sock. I'll keep it anyway."] },
  { id: 'vc2', giver: 'corwin', lvl: 8, pre: 'vc1', name: 'Words in the Waste', xp: qx(8, .45), gold: 14, obj: { kill: ['wraith', 'ghost'], n: 10, near: 'waste', nearR: 120, what: 'Defeat 10 wraiths or spirits in the Grey Waste' },
    say: ["The last chapter didn't go to the harpies. It blew north, into the Waste, and something there has been reading it. The wraiths out there have started casting wards. MY wards.", "Ten of them, please, before they get to the advanced chapters."],
    done: ["Ten. Good. They were getting the hand gestures wrong anyway, which is somehow more insulting."] },
  { id: 'vc3', giver: 'corwin', lvl: 9, pre: 'vc2', name: 'The Inkwraith', xp: qx(9, .6), gold: 20, gear: true, obj: { named: 'inkwraith', n: 1, what: 'Destroy the Inkwraith in the deep Waste' },
    say: ["Something in the Waste ate the chapter. Not read it. Ate it. The wraiths call it the Inkwraith, and it's made of every page it has ever swallowed.", "Destroy it, and bring back anything legible. If it's the chapter on counter-wards, I may weep with joy."],
    done: ["It's... it's chapter twelve. Smudged, singed, and absolutely perfect. Thank you, {hero}. I'm going to go and sit somewhere quiet with this."] },
  // a bounty on the rares, from the Watch
  { id: 'vb1', giver: 'warden', lvl: 3, pre: 'm4', name: 'Wanted: Mister Tatters', xp: qx(3, .5), gold: 10, obj: { named: 'tatters', n: 1, what: 'Find and destroy Mister Tatters, the walking scarecrow in the fields' },
    say: ["Farmers in the north fields keep reporting a scarecrow that isn't where they left it. Then it's closer. Then it's at the window.", "I don't know who stitched the thing, and I don't want to. Find it and burn it."],
    done: ["Straw and buttons. Nothing else. I'll sleep better, and so will every farmer north of the gate."] },
  { id: 'vb2', giver: 'warden', lvl: 7, pre: 'vb1', name: 'Wanted: Old Greymane', xp: qx(7, .55), gold: 16, gear: true, obj: { named: 'greymane', n: 1, what: 'Hunt down Old Greymane, the wolf who leads the packs of the southern wood' },
    say: ["Every wolf in the Vale answers to one old grey wolf in the southern wood. The hunters call him Greymane, and he's taken more sheep than the Choir has taken graves.", "Hunt him down. Take friends. He never runs alone."],
    done: ["Greymane, at last. The hunters are going to want to buy you a drink. Several drinks. Pace yourself."] },
);
// the third verdict: the truth earns a trophy; a wrong name leaves the skimming going on
Object.assign(Loot5.COLLECT, { trophy_inkwell: { type: 'trophy', name: "Clerk Tally's Second Ledger", desc: 'Every tenth crown of every guild\'s dues, written down neatly, all the way to the Choir.', from: 'mystery' } });
X.turnin.push(q => {
  if (q.id !== 'c3d') return;
  Game.storyFolk();
  if (S.flags.case3 === 'tally') { S.gold += 30; Loot5.collect('trophy_inkwell'); }
  else chat('sys', null, 'A week later, another tenth of the guild dues goes missing. Whoever is in the cells, the skimming goes on.');
});
