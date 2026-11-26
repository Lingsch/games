// Build 5: two murder investigations. Inspect the scene, question the suspects, then accuse someone.
// Accusing the wrong person sticks: an innocent goes to the cells, and the real killer strikes again.
// Case 1 (Warden Ilse): Pellam Vesk, a traveling merchant, dead beside his wagon on the western Kingsroad. The killer is Brother Linus.
// Case 2 (Mayor Pell): Marta Vesk, Pellam's sister and partner, dead in Little Hollin.
//   If you caught Linus, her killer is Rennick, the sellsword she hired (bought by Varro Gilt). If you didn't, it was Linus again.
import { world, hgt, valeHooks } from './world.js';
import { QUESTS, GIVERS, xpNeed } from './data.js';
import { LORE } from './story.js';
import { TALK } from './dialogue.js';
import { addKinds } from './render.js';
import { build, P, T, Box, Cyl, Cone } from './models.js';
const O = [0, 0, 0];
addKinds({ wagon: [build([P(T(Box(2.2, .6, 4), 0, .9), 0, O, '#6b4a2e'), ...[-1, 1].flatMap(s => [-1.3, 1.3].map(z => P(T(Cyl(.55, .55, .15, 10), s * 1.15, .55, z, 0, 0, Math.PI / 2), 0, O, '#4a3322'))),
  P(T(Box(2.1, .9, 1.6), 0, 1.6, -.8, .2), 0, O, '#c8b890'), P(T(Box(.8, .5, .6), .5, 1.45, 1.2, 0, .4), 0, O, '#8a6a3a'), P(T(Box(.6, .4, .5), -.6, .4, 2.6, 0, .9, .4), 0, O, '#8a6a3a')]), [0, 0, 0, 0], 0, .04] });

export const MSPOTS = { wagon: { x: -80, z: 2 }, shrine: { x: -95, z: -24 }, pond: { x: -206, z: 84 }, jail: { x: 9.9, z: -22.8 } };
const prevB = valeHooks.build;
valeHooks.build = a => {
  if (prevB) prevB(a);
  Object.assign(world.spots, JSON.parse(JSON.stringify(MSPOTS)));
  const W = MSPOTS.wagon, Pd = MSPOTS.pond, J = MSPOTS.jail;
  const prop = (kind, tag, name, x, z, o = {}) => world.props.push({ id: 'm' + world.props.length, kind, tag, name, x, z, yaw: o.yaw ?? 0, lore: o.lore || null, scale: o.scale || 1, when: o.when, unless: o.unless });
  const npc = (key, x, z, o = {}) => world.storyNpcs.push({ key, x, z, ...o });
  world.clearSpots.push({ x: W.x, z: W.z, r: 9 }, { x: MSPOTS.shrine.x, z: MSPOTS.shrine.z, r: 5 });
  world.spawns = world.spawns.filter(s => Math.hypot(s.x - W.x, s.z - W.z) > 16 && Math.hypot(s.x - MSPOTS.shrine.x, s.z - MSPOTS.shrine.z) > 12);
  // case 1: the wagon on the Kingsroad
  prop('wagon', 'scene', "Pellam Vesk's wagon", W.x, W.z, { yaw: .4 });
  prop('lorebook', 'clue1', 'A blood-stained ledger', W.x + 2.5, W.z + 1.5, { lore: 'c1ledger' });
  prop('opengrave', 'clue1', 'Footprints in the mud', W.x - 3, W.z + 3, { lore: 'c1prints', yaw: 1.2 });
  prop('lorebook', 'clue1', 'A forced lockbox', W.x + .5, W.z - 3, { lore: 'c1lockbox' });
  npc('hask', W.x + 4, W.z - 4, { yaw: -1, unless: ['case1', 'hask'] });
  npc('linus', MSPOTS.shrine.x, MSPOTS.shrine.z + 2, { yaw: Math.PI, unless: ['case1', '*'] });
  // case 2: by the millpond in Little Hollin
  prop('lorebook', 'clue2', "Marta Vesk's purse", Pd.x + 2, Pd.z + 1, { lore: 'c2purse' });
  prop('lorebook', 'clue2', 'A scrap caught on the reeds', Pd.x - 2, Pd.z + 3, { lore: 'c2scrapA', unless: ['case1', '!linus'] });
  prop('lorebook', 'clue2', 'A scrap caught on the reeds', Pd.x - 2, Pd.z + 3, { lore: 'c2scrapB', when: ['case1', '!linus'] });
  prop('opengrave', 'clue2', 'Tracks by the water', Pd.x + 3.5, Pd.z - 2, { lore: 'c2tracksA', unless: ['case1', '!linus'], yaw: .3 });
  prop('opengrave', 'clue2', 'Tracks by the water', Pd.x + 3.5, Pd.z - 2, { lore: 'c2tracksB', when: ['case1', '!linus'], yaw: .3 });
  prop('opengrave', 'scene', 'Another fresh grave', Pd.x - 6, Pd.z - 6, { lore: 'c2third', when: ['mystery', 'failed'], yaw: 2 });
  npc('garrow', Pd.x + 10, Pd.z - 4, { yaw: -Math.PI / 2, unless: ['case2', 'garrow'] });
  npc('rennick', Pd.x + 18, Pd.z - 14, { yaw: Math.PI, unless: ['case2', 'rennick'] });
  npc('linus', Pd.x + 6, Pd.z + 8, { yaw: Math.PI, when: ['case1', '!linus'], unless: ['case2', 'linus'] });
  // the cells behind the Watch house in town: whoever you accused waits here
  for (const [k, flag, v, dx] of [['jodda', 'case1', 'odda', 0], ['jhask', 'case1', 'hask', 2.4], ['jlinus', 'case1', 'linus', 4.8], ['jlinus2', 'case2', 'linus', 7.2], ['jgarrow', 'case2', 'garrow', 7.2], ['jrennick', 'case2', 'rennick', 7.2]])
    npc(k, J.x + dx, J.z, { yaw: Math.PI, when: [flag, v] });
};

// ---------- people ----------
Object.assign(GIVERS, {
  hask: { name: 'Hask the Drover', title: 'Drove cattle for the Vesks', model: 'villager2' },
  linus: { name: 'Brother Linus', title: 'A traveling pilgrim', model: 'cultist0' },
  garrow: { name: 'Garrow the Tinker', title: 'Pots mended, knives sharpened', model: 'villager0' },
  rennick: { name: 'Rennick', title: 'Sellsword', model: 'bandit2' },
  jodda: { name: 'Odda Coin-Purse', title: 'In the cells', model: 'bandit' },
  jhask: { name: 'Hask the Drover', title: 'In the cells', model: 'villager2' },
  jlinus: { name: 'Brother Linus', title: 'In the cells', model: 'cultist0' },
  jlinus2: { name: 'Brother Linus', title: 'In the cells', model: 'cultist0' },
  jgarrow: { name: 'Garrow the Tinker', title: 'In the cells', model: 'villager0' },
  jrennick: { name: 'Rennick', title: 'In the cells', model: 'bandit2' },
});
Object.assign(TALK, {
  hask: { bio: 'Hask has driven cattle for the Vesk family for eleven years. He has big hands, a short temper and, by his own account, an excellent memory for who owes him money.',
    greet: ["If you're from the Watch, I already told them. I found him like that.", "Eleven years I drove for the Vesks. Eleven years, and this is how it ends."], topics: [] },
  linus: { bio: 'A soft-spoken pilgrim in grey wool and sandals, traveling the shrines of the Four. He smiles a great deal.',
    greet: ['Peace of the Four be on you, friend. These are dark days on the road.', 'I pray for the dead. It is the least we can do for them. Or the most.'], topics: [] },
  garrow: { bio: 'Garrow mends pots and sharpens knives from village to village. He is cheerful, nosy and loud, and he knows everyone\'s business.',
    greet: ["Knives sharpened, pots mended, gossip free of charge!", "Terrible business, the Vesk woman. Terrible. I liked her, mostly."], topics: [] },
  rennick: { bio: 'Rennick sells his sword to whoever pays. Marta Vesk paid him to guard her on the road. It did not go well for her.',
    greet: ["I was hired to guard the road, not the millpond. Not my fault.", "I'm leaving as soon as I'm paid. Which, now, I suppose I won't be."], topics: [] },
  jodda: { bio: 'Odda Coin-Purse, in the cells for the murder of Pellam Vesk.', greet: ["I owed him forty crowns. FORTY. You don't kill a man over forty crowns, you complain about him!", "My nephew's running the stall. He's charging double. Tell everyone it isn't my fault."], topics: [] },
  jhask: { bio: 'Hask the Drover, in the cells for the murder of Pellam Vesk.', greet: ["Eleven years. Eleven years I drove for him, and you put me in here.", "I'll be out one day. And I'll remember who put me here."], topics: [] },
  jlinus: { bio: 'Brother Linus, in the cells for the murder of Pellam Vesk.', greet: ['You caught one voice in the choir, friend. The song goes on without me.', 'Pray for the dead. They will be needing it.'], topics: [] },
  jlinus2: { bio: 'Brother Linus, in the cells at last.', greet: ['Two merchants, and you only saw me the second time. The Choir is grateful for slow eyes.', 'The song goes on without me.'], topics: [] },
  jgarrow: { bio: 'Garrow the Tinker, in the cells for the murder of Marta Vesk.', greet: ['I sharpen knives! I don\'t USE them!', "Somebody out there killed that woman, and it wasn't me. Think about that while you sleep."], topics: [] },
  jrennick: { bio: 'Rennick the sellsword, in the cells for the murder of Marta Vesk.', greet: ["Varro paid better than she did. That's the whole story.", "Fine. You got me. Now ask me who paid me."], topics: [] },
});
// the clues, kept in Book → Lore as you find them
Object.assign(LORE, {
  c1ledger: { title: "Pellam Vesk's Ledger", where: 'wagon', text: "The last entries: 'Forty crowns owed by O. Coin-Purse, third time of asking.' 'Hask wants his wages raised again. Told him no. He shouted.' And the very last line, in a shaking hand: 'Sold a crate of grave salts to a brother in grey. Why would a holy man want grave salts?'" },
  c1prints: { title: 'Footprints in the Mud', where: 'wagon', text: "Two sets of prints around the wagon. One is a heavy boot with a worn heel, the kind a drover wears. The other is the flat, soft print of a sandal, and it walks right up to where the body lay, and away again toward the west." },
  c1lockbox: { title: 'The Forced Lockbox', where: 'wagon', text: "The lockbox was pried open with a blade, and the coins are still inside. Whoever did this wasn't after money. The only thing missing is the merchant's signet ring." },
  c2purse: { title: "Marta Vesk's Purse", where: 'pond', text: "Full of coin, untouched. Inside is a letter in Marta's hand: 'I know who killed Pellam. I'm going to the Watch in the morning. I've told no one but my guard.'" },
  c2scrapA: { title: 'A Scrap on the Reeds', where: 'pond', text: "A strip of oiled leather, torn from a strap, with a stamped gilt crown on it. That's the mark of Varro Gilt's sworn men." },
  c2scrapB: { title: 'A Scrap on the Reeds', where: 'pond', text: "A thread of grey wool, the same rough grey a pilgrim wears, caught on the reeds right where Marta went into the water." },
  c2tracksA: { title: 'Tracks by the Water', where: 'pond', text: "Hobnailed boots, heavy, a soldier's stride. They come from the road where her guard was posted, and go back to it." },
  c2tracksB: { title: 'Tracks by the Water', where: 'pond', text: "Sandal prints. Flat and soft, exactly like the ones at Pellam's wagon. Whoever killed Pellam Vesk is still walking free." },
  c2third: { title: 'Another Fresh Grave', where: 'pond', text: "Wick dug this one himself. 'Third one this season,' he says. 'Whoever you locked up, it wasn't the one doing it.'" },
});

// ---------- the cases ----------
const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f);
// what each suspect says when you question them, by case (and by how case 1 went, for case 2)
export const TESTIMONY = {
  c1b: {
    'vendor:vale': () => ["Pellam Vesk? I owed him forty crowns, and I'll not pretend I liked him. But I was at my stall all night. Ask anyone. Ask the guards. Ask the pigeons.", "If you want my opinion, look at that pilgrim. Who walks the roads at night in sandals?"],
    hask: () => ["Aye, we argued. He wouldn't raise my wages, and I told him what I thought of him. Loudly. Then I went to the inn and drank until I couldn't stand.", "When I came back at dawn, he was dead. My boots are all over that mud because I'm the one who found him."],
    linus: () => ["The merchant? I bought salts from him for the shrines. We keep the old graves clean, you understand. Clean and... ready.", "I was at prayer all night. The Four were my witnesses. I'm sure they'd agree."],
  },
  c2b: {
    garrow: f => ["I sharpened Marta's knife the day before. She said she was going to the Watch in the morning, and she looked frightened. Terribly frightened.", f.case1 === 'linus' ? "I'll tell you who I saw, though. Her guard, Rennick, talking to a man with a gilt crown on his sleeve. Money changed hands." : "I'll tell you who I saw, though. A pilgrim in grey, the same one who was on the Kingsroad, walking toward the pond at dusk."],
    rennick: f => [f.case1 === 'linus' ? "I was on the road where she posted me. All night. Ask anyone. Well, nobody was there, but you could ask them anyway." : "I was on the road where she posted me. I heard nothing. I did see a pilgrim, though. Odd fellow. Smiled too much.",
      "She was paying me five crowns a week. You don't kill someone who's paying you. Not unless somebody pays you more."],
    linus: () => ["Another Vesk? How sad. The road is dangerous for merchants. Everyone says so.", "I was praying. As always. The dead need someone to sing for them."],
  },
};
QUESTS.push(
  { id: 'c1a', giver: 'warden', lvl: 3, pre: 'm3', name: 'Death on the Kingsroad', xp: qx(3, .4), gold: 6, obj: { inspect: 'clue1', n: 3, what: "Search Pellam Vesk's wagon on the western Kingsroad for clues" },
    say: ["A traveling merchant was found dead beside his wagon this morning, a little way west along the Kingsroad. Pellam Vesk. He sold cloth, salt and whatever else people would buy.", "My people trampled half the scene before I could stop them, so I want fresh eyes on it. Go and look. Read everything, touch everything, and tell me what you find."],
    done: ["A sandal print and a missing ring. Whoever did this wasn't a common thief. Good eyes, {hero}."] },
  { id: 'c1b', giver: 'warden', lvl: 3, pre: 'c1a', name: 'Questions on the Road', xp: qx(3, .45), gold: 8, obj: { ask: ['vendor:vale', 'hask', 'linus'], n: 3, what: 'Question Odda Coin-Purse in town, Hask the Drover at the wagon, and Brother Linus at the roadside shrine' },
    say: ["Three people had reason to be near that wagon. Odda Coin-Purse owed him money. Hask, his drover, argued with him the night he died. And a pilgrim, Brother Linus, bought something from him that same day.", "Talk to all three. Listen to what they say, and to what they don't."],
    done: ["Three stories. At least two of them are true, and I'd bet my badge one of them is lying."] },
  { id: 'c1c', giver: 'warden', lvl: 4, pre: 'c1b', name: 'The Missing Ring', xp: qx(4, .45), gold: 8, obj: { collect: ['cultist', 'chanter', 'bandit', 'bandit2'], item: "Pellam's Signet Ring", chance: .3, n: 1, what: "Find Pellam Vesk's signet ring on the bandits of the road or the Pale Choir in the west" },
    say: ["The killer took one thing: Pellam's signet ring. Rings like that turn up on the people who took them, or the people they sold them to.", "Bandits on the road, or that grey choir out west. Find out who's carrying it."],
    done: ["Where did you find it? ...On a Choir initiate. Interesting. Very interesting."] },
  { id: 'c1d', giver: 'warden', lvl: 4, pre: 'c1c', name: 'Name the Killer', xp: qx(4, .5), gold: 10, obj: { talk: true, what: 'Tell Warden Ilse who killed Pellam Vesk' },
    say: ["You've seen the wagon, heard the suspects and found the ring. I'll arrest whoever you name. Be sure, {hero}. The cells are cold, and the gallows are colder."],
    done: ["So. Who killed Pellam Vesk?"],
    choices: [
      { t: 'Odda Coin-Purse. She owed him money.', set: { case1: 'odda' }, reply: "Odda? Hm. She did owe him. Guards! ...It will be done. I hope you're right." },
      { t: 'Hask the Drover. They fought that night.', set: { case1: 'hask' }, reply: "Hask, then. His boots were everywhere. Guards! ...It will be done. I hope you're right." },
      { t: 'Brother Linus. The sandals, the salts, the ring on a Choir initiate.', set: { case1: 'linus' }, gold: 20, collect: null, reply: "A pilgrim buying grave salts, sandal prints walking to the body, and the ring in the Choir's hands. Yes. That's our man. Guards! Fetch Brother Linus." },
    ] },
  { id: 'c2a', giver: 'pell', lvl: 5, pre: 'c1d', pre2: 'm7', name: 'Murder at the Millpond', xp: qx(5, .4), gold: 8, obj: { inspect: 'clue2', n: 3, what: 'Search the millpond in Little Hollin for clues' },
    say: ["Dreadful news, dreadful. A woman was found in our millpond this morning. Marta Vesk. Her brother was the merchant murdered on the Kingsroad, wasn't he?", "Two Vesks in one season. Somebody wants that whole family gone, and I want to know who before they start on mine. Would you look at the pond for me?"],
    done: ["A letter saying she knew who killed her brother. Oh dear. Oh dear, oh dear."] },
  { id: 'c2b', giver: 'pell', lvl: 5, pre: 'c2a', name: 'Hollin Gossip', xp: qx(5, .45), gold: 10, obj: { ask: ['garrow', 'rennick'], n: 2, what: 'Question Garrow the Tinker and Rennick the sellsword in Little Hollin' },
    say: ["Garrow the tinker talks to everyone, so he probably talked to her. And Rennick, the sellsword she hired, was meant to be guarding her.", "Ask them both. Garrow will tell you more than you want to know. Rennick will tell you less."],
    done: ["Hm. Hm! That is a great deal to think about."] },
  { id: 'c2c', giver: 'wenlow', lvl: 5, pre: 'c2b', name: 'Ask the Dead', xp: qx(5, .45), gold: 10, obj: { collect: ['ghost'], item: 'Spirit Essence', chance: .45, n: 3, what: 'Collect 3 Spirit Essence from the restless spirits around Little Hollin' },
    say: ["Pell told me everything, dear. If you want to know who killed Marta, why not ask her? She's dead, but in Hollin that hardly matters.", "Bring me three wisps of spirit essence from the ghosts in the fields, and I'll brew something that lets her speak to you for a moment."],
    done: f => [["wenlow", "Drink this, dear. Quickly, before it curdles."], ["", f.case1 === 'linus' ? "A cold voice whispers in your ear: 'He smelled of oiled leather and gold. He was meant to keep me safe.'" : "A cold voice whispers in your ear: 'Incense and grave salts. He was singing as he held me under.'"]] },
  { id: 'c2d', giver: 'pell', lvl: 6, pre: 'c2c', name: 'Name the Killer, Again', xp: qx(6, .55), gold: 12, obj: { talk: true, what: 'Tell Mayor Pell who killed Marta Vesk' },
    say: ["You've heard the gossip, seen the pond and spoken to the dead, which is more than most mayors can say. Who did it, {hero}? I'll send for the Watch."],
    done: ["Well? Who killed Marta Vesk?"],
    choices: [
      { t: 'Garrow the Tinker. He knew she was going to the Watch.', set: { case2: 'garrow' }, reply: "Garrow? Oh, I'll miss his gossip. Very well. The Watch will take him." },
      { t: 'Rennick. Her own guard, paid by Varro Gilt.', set: { case2: 'rennick' }, reply: "Her own guard. A crown on his sleeve and gold in his purse. The Watch will take him." },
      { t: 'Brother Linus. The same sandals, the same grey wool.', set: { case2: 'linus' }, if: ['case1', '!linus'], reply: "The pilgrim! Still walking free after the Kingsroad. The Watch will take him, and this time they'll keep him." },
    ] },
);
// how each case ends: right or wrong, and what that changes
export function verdict(q, flags) {
  if (q.id === 'c1d') return flags.case1 === 'linus';
  if (q.id === 'c2d') return flags.case2 === (flags.case1 === 'linus' ? 'rennick' : 'linus');
  return null;
}
