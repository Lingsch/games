// Build 6: guilds, the group finder and the auction house.
// Guilds: join one of the server's guilds or start your own, chat with guildmates, level the guild for perks,
// and bring guildmates to dungeons. The group finder fills your group with fake players of the roles you need.
// The auction house is a live market: fake players list and buy, prices move with supply, and your goods sell.
import { S, TAU, chat, pick, rnd, irnd, clamp, floatText, X } from './core.js';
import { world, hgt, valeHooks } from './world.js';
import { coastHooks } from './zones.js';
import { CLASSES, CLASS_KEYS, GIVERS, GUILDS, FAKE_NAMES, PERSONAS, RARITY, randomGear, makeItem, statText, MAX_LVL } from './data.js';
import { TALK } from './dialogue.js';
import { INSTANCES } from './dungeons.js';
import { DSITES } from './dungeons.js';
import { C6 } from './coast6.js';
import * as Cb from './combat.js';
import * as Craft from './crafting.js';
import * as Game from './game.js';

// ---------- the people who run it all ----------
Object.assign(GIVERS, {
  auctioneer: { name: 'Pennywhistle', title: 'Auction House', model: 'villager2' },
  auctioneer2: { name: 'Lisette Mardi', title: 'Auction House', model: 'villager1' },
  fence: { name: 'Mags the Fence', title: 'Auction House (no questions asked)', model: 'smuggler' },
  registrar: { name: 'Clerk Oswin Tally', title: 'Guild Registrar', model: 'villager0' },
  registrar2: { name: 'Purser Dabney', title: 'Guild Registrar', model: 'villager2' },
});
Object.assign(TALK, {
  auctioneer: { bio: 'Pennywhistle has run the town auction for thirty years. He can price a sword by the sound it makes when you set it down, and he is right about nine times in ten.', greet: ["Going once, going twice! Oh, hello. Buying or selling? Everybody's doing one or the other.", 'Prices are up on hides, down on wool, and sideways on whatever a Glimmer Shard is worth this week.'], topics: [] },
  auctioneer2: { bio: 'Lisette Mardi runs the free port\'s auction from a table on the quay, with a bell, a ledger and a parrot that bites anybody who haggles.', greet: ["The free port buys anything and sells everything. Mind the parrot.", 'Brass is up since the wrecks stopped washing in. Somebody must have done something about the wreckers.'], topics: [] },
  fence: { bio: 'Mags will sell you anything and buy anything from you, and she will never, ever ask where it came from. She runs Crookwater\'s auction from the back of a cart.', greet: ["Don't tell me where it's from. Tell me what it's worth.", "Everything's for sale in Crookwater, love. Except the soup. The soup is free."], topics: [] },
  registrar: { bio: 'Clerk Oswin Tally keeps the town guild rolls in a ledger the size of a door, and he has never once spelled a guild name wrong, even "Bad Pullers", which he finds deeply upsetting.', greet: ["Guild business? Charters, registrations, and the occasional dispute about who stole whose banner.", 'Every guild in the realm is in my book. Some of them are in it twice, under "complaints".'], topics: [] },
  registrar2: { bio: 'Purser Dabney registers guilds on the coast, collects their dues, and settles their arguments with a very heavy ledger.', greet: ["Charter's ten gold. The ink is free. The ink is always free.", 'A guild is just a crew that doesn\'t need a ship. Want to start one?'], topics: [] },
});
valeHooks.build = (prev => a => { if (prev) prev(a); const t = a.town; world.storyNpcs.push({ key: 'auctioneer', x: t.x + 1.5, z: t.z + 9.5, yaw: Math.PI }, { key: 'registrar', x: t.x + 15, z: t.z + 8.2, yaw: Math.PI, unless: ['case3', 'tally'] }); })(valeHooks.build);
coastHooks.build.push(() => { const p = world.port, C = C6.crook; world.storyNpcs.push({ key: 'auctioneer2', x: p.x + 12, z: p.z + 4, yaw: -Math.PI / 2 }, { key: 'registrar2', x: p.x - 1, z: p.z - 12, yaw: 0 }, { key: 'fence', x: C.x + 10, z: C.z - 4, yaw: -Math.PI / 2 }); });

// =====================================================================
// guilds
// =====================================================================
const GUILD_INFO = {
  'Ashen Covenant': { min: 8, vibe: 'Serious raiders. They keep spreadsheets of their spreadsheets.', yes: .55 },
  'Wallbreakers': { min: 5, vibe: 'A guild founded by tanks, for tanks, and for anyone who likes standing in front of things.', yes: .75 },
  'Order of the Fourfold': { min: 1, vibe: 'Roleplayers who speak in full sentences and never, ever break character.', yes: .9 },
  'Bad Pullers': { min: 1, vibe: 'Chaos, friendship and accidental wipes. Everybody is welcome. Nobody is safe.', yes: .95 },
  'Mana Break': { min: 4, vibe: 'Casters and healers who argue about mana efficiency for fun.', yes: .7 },
  'Sleepy Wolves': { min: 1, vibe: 'Casual, friendly, mostly asleep. They log on to say goodnight.', yes: .9 },
};
const G = () => S.ext.guild || null;
const GLV = [0, 600, 1800, 4000, 8000];
export const guildLvl = () => { const g = G(); if (!g) return 0; let l = 1; for (let i = 0; i < GLV.length; i++) if ((g.xp || 0) >= GLV[i]) l = i + 1; return l; };
const PERKS = [[2, '+5% experience'], [3, '+10% reputation'], [4, 'Guild banner: +4% power when a guildmate is in your group'], [5, 'Guild banner: also +5% health']];
X.xpBonus = () => guildLvl() >= 2 ? .05 : 0;
function guildXp(n) { const g = G(); if (!g) return; const before = guildLvl(); g.xp = (g.xp || 0) + n; g.lvl = guildLvl(); if (g.lvl > before) { chat('guild', null, `<${g.name}> is now guild level ${g.lvl}!`); const p = PERKS.find(p => p[0] === g.lvl); if (p) chat('sys', null, `New guild perk: ${p[1]}.`); } }
const guildmates = () => { const g = G(); if (!g) return []; return S.fakes.filter(f => f.fake?.guild === g.name && !f.dead); };
const rosterNames = () => { const g = G(); if (!g) return []; const names = new Set(guildmates().map(f => f.name)); for (const list of Object.values(S.pops || {})) for (const d of list || []) if (d.guild === g.name) names.add(d.name); return [...names]; };
export function joinGuild(name) {
  const info = GUILD_INFO[name]; if (!info) return 'No such guild.';
  if (S.hero.lvl < info.min) return `${name} wants members of level ${info.min} or higher.`;
  if (G()?.name === name) return 'You are already in that guild.';
  const officer = S.fakes.find(f => f.fake?.guild === name);
  if (Math.random() > info.yes + (S.ext.guildAsked?.[name] || 0) * .15) { S.ext.guildAsked = { ...(S.ext.guildAsked || {}), [name]: (S.ext.guildAsked?.[name] || 0) + 1 }; return `${officer ? officer.name : 'The officers'} of ${name} will think about it. Ask again later.`; }
  S.ext.guild = { name, own: false, xp: irnd(200, 2600), joinedT: S.time, loot: { 'Ashen Covenant': 'dkp', 'Mana Break': 'dkp', 'Order of the Fourfold': 'council' }[name] || 'needgreed' }; S.ext.guild.lvl = guildLvl();
  chat('guild', officer ? officer.name : null, pick(['welcome!!', `welcome to ${name}!`, 'o/ welcome', 'another one! welcome', 'grats on joining, ask if you need anything']));
  return null;
}
export function startGuild(name) {
  name = (name || '').trim().slice(0, 22); if (name.length < 3) return 'A guild name needs at least three letters.';
  if (GUILDS.includes(name) || GUILD_INFO[name]) return 'That name is taken.';
  if (S.gold < 10) return 'A charter costs 10 gold.';
  S.gold -= 10; S.ext.guild = { name, own: true, xp: 0, lvl: 1, joinedT: S.time };
  chat('sys', null, `You found the guild <${name}>. Now find some people to put in it.`);
  return null;
}
export function leaveGuild() { const g = G(); if (!g) return; chat('sys', null, `You leave <${g.name}>.`); S.ext.guild = null; }
export function recruit(f) {
  const g = G(); if (!g || !g.own) return 'Only a guild founder can recruit.';
  if (f.fake.guild === g.name) return `${f.name} is already in your guild.`;
  const chance = (f.fake.friend ? .9 : .55) * (f.fake.guild ? .35 : 1) + (f.fake.mood > 0 ? .1 : 0);
  if (Math.random() > chance) { chat('whisper', f.name, pick(['nah, happy where i am', 'maybe later', 'sorry, loyal to my guild', 'hmm. no thx'])); return null; }
  if (f.fake.guild) chat('gen', f.name, `leaving ${f.fake.guild}, no hard feelings`);
  f.fake.guild = g.name; chat('guild', f.name, pick(['hi all!', 'o/ thanks for the invite', 'happy to be here', 'what do i win', 'hello new guild']));
  guildXp(50); return null;
}
// guild xp from what you do
X.kill.push(m => { if (!G()) return; guildXp(m.boss ? 40 : m.boss2 ? 20 : m.named ? 10 : 1); });
X.turnin.push(q => { if (G()) guildXp(q.story ? 30 : 15); });
// the banner, and guild chat
let bannerT = 0, gchatT = 40, lastLvl = 0;
const GCHAT = {
  any: ['anyone up for {dungeon}?', 'o/', 'evening all', 'who wants to farm {area}', 'just got {item}!!', 'anyone have spare {mat}?', 'guild bank when', 'lol {pname} just pulled half the {area}', 'brb dinner', 'gn all', 'storm on the coast, careful out there', 'need a {role} for {dungeon}'],
  chill: ['vibing', 'nice night for it', 'no rush'], tryhard: ['parse incoming', 'min-maxing my rotation again', 'who has the best gear in guild? me. checked.'],
  joker: ['what do you call a skeleton who wont work? lazy bones', 'i pulled the boss on purpose. for science', 'mount says hi'], newbie: ['how do i get to the coast', 'is fire bad for undead?', 'what does aggro mean'],
  veteran: ['back in my day the Vale had twice the wolves', 'protip: dont stand in the green'], grumpy: ['who left the gate open', 'quiet in here. good.', 'another wipe. fantastic.'],
};
const DUNGEON_NAMES = () => Object.values(LFG_D).map(d => d.name.replace(/^The /, ''));
X.tick.push(dt => {
  const g = G(), h = S.hero; if (!g || !h) return;
  if ((bannerT -= dt) <= 0) {
    bannerT = 5; const lv = guildLvl();
    if (lv >= 4 && S.party.some(p => p.fake?.guild === g.name)) for (const p of S.party) if (!p.dead) Cb.buff(p, 'guildbanner', 8, lv >= 5 ? { pow: .04, hp: .05 } : { pow: .04 }, h);
  }
  if (h.lvl > lastLvl && lastLvl) { const m = pick(rosterNames()); if (m) setTimeout(() => chat('guild', m, pick(['gz!!', 'grats on the ding', `${h.lvl}! nice`, 'ding grats'])), 1200); }
  lastLvl = h.lvl;
  if ((gchatT -= dt) <= 0) {
    gchatT = rnd(35, 80); const names = rosterNames(); if (!names.length) return;
    const who = pick(names), f = S.fakes.find(x => x.name === who), per = f?.fake?.persona;
    let line = pick(Math.random() < .35 && per && GCHAT[per] ? GCHAT[per] : GCHAT.any);
    line = line.replace('{dungeon}', pick(DUNGEON_NAMES())).replace('{area}', pick(world.regionNames || ['the fields'])).replace('{item}', pick(['a blue ring', 'Saltforged Greaves', 'a Glowfin', 'the Wreck-Queen\'s hat', 'a new mount'])).replace('{mat}', pick(Object.values(Craft.MATS)).name)
      .replace('{pname}', pick(names)).replace('{role}', pick(['tank', 'healer', 'dps']));
    chat('guild', who, line); guildXp(2);
  }
});

// =====================================================================
// the group finder
// =====================================================================
export const LFG_D = {
  keep: { name: "Varro's Keep", lvl: [4, 6], zone: 'vale', at: () => ({ x: DSITES.keep.x + 34, z: DSITES.keep.z }) },
  grove: { name: 'The Blighted Grove', lvl: [4, 6], zone: 'vale', at: () => ({ x: DSITES.grove.x, z: DSITES.grove.z - 40 }) },
  catacombs: { name: 'The Choir Catacombs', lvl: [8, 10], zone: 'catacombs' },
  mines: { name: 'The Mines under the Waste', lvl: [8, 10], zone: 'mines' },
  teeth: { name: "The Wreckers' Teeth", lvl: [10, 11], zone: 'coast', at: () => ({ x: C6.teeth.x - 36, z: C6.teeth.z - 10 }) },
  shrine: { name: 'The Tidewater Shrine', lvl: [11, 12], zone: 'coast', at: () => ({ x: C6.shrine.x, z: C6.shrine.z + 44 }) },
  brinevaults: { name: 'The Brine Vaults', lvl: [13, 14], zone: 'brinevaults' },
  bonewhale: { name: 'The Bonewhale Grotto', lvl: [14, 15], zone: 'bonewhale' },
  caves: { name: "The Smugglers' Sea Caves", lvl: [15, 17], zone: 'coast', at: () => ({ x: world.caves ? world.caves.x - world.caves.R - 6 : 150, z: world.caves ? world.caves.z : 20 }) },
  fleet: { name: 'The Sunken Fleet', lvl: [19, 20], zone: 'coast', at: () => ({ x: world.buoy ? world.buoy.x + 3 : 160, z: world.buoy ? world.buoy.z + 3 : 200 }) },
};
const roleOf6 = k => Game.SLOT_OF(k) === 'support' ? 'dps' : CLASSES[k].role;
const HELLO = {
  chill: ['hey all', 'sup, ready when you are', 'o/ no rush'], tryhard: ['lets go fast, i have a schedule', 'i know this place, follow my marks', 'checking everyone\'s gear... ok, it\'ll do'],
  joker: ['hi! i promise not to pull the boss. this time.', 'who wants to see me fall off something', 'i brought snacks'], newbie: ['hi!! first time here, be nice', 'which way is the dungeon', 'what does a tank do exactly'],
  veteran: ['done this a hundred times, stick together', 'kill the healers first', 'evening. lets keep it clean'], grumpy: ['fine. lets get this over with', 'if anyone stands in fire im leaving', 'hi. i guess.'],
};
export function queue(key, guildRun = false) {
  const d = LFG_D[key]; if (!d) return 'Unknown dungeon.';
  if (d.raid) { const why = d.raid(); if (why) return why; S.ext.raid12 = true; S.ext.raid24 = !!d.raid24; } else if (S.party.length > 6) return 'Your group is too big for a dungeon.';
  if (S.party.length >= Game.partyCap()) return 'Your group is already full.';
  const need = needed(), waits = need.tank * 9 + need.healer * 7 + need.dps * 3;
  S.ext.lfg = { key, guild: guildRun, t: S.time + clamp((guildRun ? 4 : 6) + waits * rnd(.6, 1.2) * (guildRun ? .5 : 1), 4, 50) };
  chat('sys', null, `You join the queue for ${d.name}.`);
  return null;
}
export const cancelQueue = () => { if (S.ext.lfg) chat('sys', null, 'You leave the queue.'); S.ext.lfg = null; };
function needed() {
  const have = { tank: 0, healer: 0, dps: 0 }; for (const p of S.party) have[roleOf6(p.cls)]++;
  const N = Game.partyCap(), n = { tank: Math.max(0, (N > 12 ? 4 : N > 6 ? 2 : 1) - have.tank), healer: Math.max(0, (N > 12 ? 6 : N > 6 ? 3 : 2) - have.healer), dps: 0 };
  n.dps = Math.max(0, N - S.party.length - n.tank - n.healer);
  return n;
}
function fillGroup(key, guildRun) {
  const d = LFG_D[key], h = S.hero, need = needed(), L = clamp(Math.round((Math.max(h.lvl, d.lvl[0]) + Math.min(h.lvl + 1, d.lvl[1])) / 2), 1, MAX_LVL), used = new Set([...S.party.map(p => p.name), ...S.fakes.map(f => f.name)]);
  const joined = [];
  for (const role of ['tank', 'healer', 'dps']) for (let i = 0; i < need[role]; i++) {
    if (S.party.length >= Game.partyCap()) break;
    // guildmates and friends first, then anyone in the zone at the right level, then someone from another zone
    const cand = S.fakes.filter(f => !f.inParty && !f.dead && roleOf6(f.cls) === role && Math.abs(f.lvl - L) <= 3).sort((a, b) => ((b.fake.guild === G()?.name) - (a.fake.guild === G()?.name)) || (b.fake.friend - a.fake.friend) || Math.abs(a.lvl - L) - Math.abs(b.lvl - L));
    let f = cand[0];
    if (f) { f.inParty = true; f.sit = false; f.fake.state = 'party'; if (f.fake.group) { f.fake.group = f.fake.group.filter(x => x !== f); f.fake.group = null; } f.x = h.x + rnd(-2.5, 2.5); f.z = h.z + rnd(-2.5, 2.5); f.y = hgt(f.x, f.z); S.party.push(f); }
    else {
      const name = pick(FAKE_NAMES.filter(n => !used.has(n))) || 'Wanderer' + irnd(10, 99); used.add(name);
      const pool = CLASS_KEYS.filter(k => roleOf6(k) === role), cls = pick(pool);
      f = Game.addMate({ name, cls, lvl: clamp(L + irnd(-1, 1), 1, MAX_LVL), pal: 1 + irnd(0, 1), persona: pick(PERSONAS), guild: guildRun && G() ? G().name : Math.random() < .5 ? pick(GUILDS) : null, mood: 0 }, h);
    }
    joined.push(f);
  }
  if (!joined.length) { chat('sys', null, 'Nobody else was needed.'); return; }
  chat('sys', null, `Your group for ${d.name} is ready: ${joined.map(f => `${f.name} (${CLASSES[f.cls].name})`).join(', ')}.`);
  joined.forEach((f, i) => setTimeout(() => { if (f.inParty) chat('party', f.name, pick(HELLO[f.fake.persona] || HELLO.chill)); }, 800 + i * 1300));
  S.ext.lfgReady = key;
}
export function goTo(key) {
  const d = LFG_D[key]; if (!d) return;
  S.ext.lfgReady = null;
  if (INSTANCES[d.zone] && d.zone !== 'fleet') { Game.travel(d.zone, null, false); return; }
  const at = d.at && S.zone === d.zone ? d.at() : null;
  if (S.zone !== d.zone) { Game.travel(d.zone, null, false); if (d.at) { const p = d.at(); place(p); } return; }
  if (at) place(at);
}
function place(p) { const y = hgt(p.x, p.z); for (const m of S.party) { m.x = p.x + rnd(-2, 2); m.z = p.z + rnd(-2, 2); m.y = y; } chat('sys', null, 'You arrive with your group.'); }
X.tick.push(() => { const q = S.ext.lfg; if (q && S.time >= q.t) { S.ext.lfg = null; fillGroup(q.key, q.guild); } });

// =====================================================================
// the auction house
// =====================================================================
export const BASE_PRICE = { copper: 1, iron: 2, silver: 4, meadowsweet: 1, graveroot: 2, kelpbloom: 3, lighthide: 1, thickhide: 2, scalehide: 4, linen: 1, wool: 2, seasilk: 4, meat: 1, crabmeat: 2, bonedust: 2,
  garnet: 5, moonstone: 9, pearl: 14, dust: 3, shard: 10, cod: 1, eel: 4, glowfin: 9, timber: 2, brass: 4, rope: 2,
  starsteel: 6, deepcap: 5, rimeiron: 7, frostbloom: 6, crowngold: 8, kingsfoil: 7, wyrmhide: 6, moonweave: 6, starstone: 18, skysilver: 9, cloudbloom: 8, stormhide: 8, starweave: 8, heartstar: 26 };
export const AH = () => { S.ext.ah = S.ext.ah || { price: {}, list: [], mine: [], next: 0 }; return S.ext.ah; };
export const matPrice = k => { const a = AH(); return Math.max(1, Math.round((a.price[k] ?? 1) * (BASE_PRICE[k] || 2))); };
export const fairGear = it => Math.round(it.value * (2.2 + it.rarity * .8) * (it.crafted || it.set ? 1.5 : 1));
function restock() {
  const a = AH(), L = S.hero?.lvl || 1; a.list = a.list.filter(l => S.time - l.t < 1800);
  while (a.list.length < 10) { const it = randomGear(clamp(L + irnd(-2, 2), 1, MAX_LVL), Math.random() < .6 ? S.heroCls : null, .55); a.list.push({ item: it, price: Math.round(fairGear(it) * rnd(.8, 1.4)), by: pick(S.fakes.length ? S.fakes : [{ name: 'Someone' }]).name, t: S.time }); }
  for (const k in BASE_PRICE) a.price[k] = clamp(((a.price[k] ?? 1) * 4 + (X.priceTarget?.(k) ?? 1)) / 5 * rnd(.95, 1.05), .3, 3.5);   // prices drift back toward normal (Build 11: or toward what the market's news says)
  for (const f of X.restock || []) f(a);
}
// every so often, fake players buy what you've listed. The closer your price is to fair, the sooner it sells.
let ahT = 20;
X.tick.push(dt => {
  if ((ahT -= dt) > 0 || !S.hero) return; ahT = 30;
  const a = AH(); if (S.time > a.next) { restock(); a.next = S.time + 300; }
  for (const l of a.mine) {
    if (l.sold) continue;
    const fair = l.mat ? matPrice(l.mat) * l.n : fairGear(l.item), ratio = l.price / Math.max(1, fair);
    const chance = ratio <= .8 ? .6 : ratio <= 1.05 ? .3 : ratio <= 1.4 ? .12 : ratio <= 2 ? .04 : .005;
    if (Math.random() < chance) {
      l.sold = true; const got = Math.floor(l.price * .95); S.gold += got; S.ext.cnt = S.ext.cnt || {}; S.ext.cnt.sold = (S.ext.cnt.sold || 0) + 1;
      if (l.mat) a.price[l.mat] = clamp((a.price[l.mat] ?? 1) * .96, .4, 3);
      chat('sys', null, `Auction house: ${pick(S.fakes.length ? S.fakes : [{ name: 'A buyer' }]).name} bought your ${l.mat ? l.n + ' ' + Craft.MATS[l.mat].name : l.item.name} for ${l.price} gold. You receive ${got} after the house's cut.`);
    }
  }
  a.mine = a.mine.filter(l => !l.sold || S.time - (l.t || 0) < 3600).filter(l => !l.sold);
});
export function listItem(it, price) {
  const a = AH(); if (a.mine.length >= 8) return 'You can only have 8 auctions at once.';
  price = Math.max(1, Math.round(price)); S.bag = S.bag.filter(b => b !== it); a.mine.push({ item: it, price, t: S.time }); return null;
}
export function listMat(k, n, price) {
  const a = AH(); if (a.mine.length >= 8) return 'You can only have 8 auctions at once.';
  n = Math.min(n, S.mats[k] || 0); if (n <= 0) return 'You have none to sell.';
  S.mats[k] -= n; a.mine.push({ mat: k, n, price: Math.max(1, Math.round(price)), t: S.time }); return null;
}
export function cancelMine(l) { const a = AH(); a.mine = a.mine.filter(x => x !== l); if (l.mat) S.mats[l.mat] = (S.mats[l.mat] || 0) + l.n; else if (S.bag.length < 30) S.bag.push(l.item); else { a.mine.push(l); return 'Your bags are full.'; } return null; }
export function buyListing(l) { const a = AH(); if (S.gold < l.price) return 'Not enough gold.'; if (S.bag.length >= 30) return 'Your bags are full.'; S.gold -= l.price; S.bag.push(l.item); a.list = a.list.filter(x => x !== l); chat('sys', null, `You buy ${l.item.name} from ${l.by} for ${l.price} gold.`); return null; }
export function buyMat(k, n) { const p = matPrice(k) * n; if (S.gold < p) return 'Not enough gold.'; S.gold -= p; Craft.addMat(k, n, true); const a = AH(); a.price[k] = clamp((a.price[k] ?? 1) * (1 + .03 * n), .4, 3); chat('sys', null, `You buy ${n} ${Craft.MATS[k].name} for ${p} gold.`); return null; }

// ---------- windows ----------
let ahTab = 'browse';
export function openAH(n) {
  const { el, esc, toast, openSheet, refreshSheet } = X.ui;
  if (!AH().list.length) restock();
  openSheet(n?.name ? `${n.name}: Auction House` : 'Auction House', body => {
    const a = AH();
    body.appendChild(el(`<div class="tabs">${[['browse', 'Gear'], ['mats', 'Materials'], ['sell', 'Sell'], ['mine', `My auctions (${a.mine.length})`]].map(([k, t]) => `<button data-t="${k}" class="${ahTab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`)).onclick = ev => { const t = ev.target.dataset?.t; if (t) { ahTab = t; refreshSheet(); } };
    body.appendChild(el(`<p style="margin:4px 0">Gold: <b style="color:var(--acc)">${S.gold}</b></p>`));
    if (ahTab === 'browse') for (const l of a.list.slice().sort((x, y) => y.item.lvl - x.item.lvl)) {
      const it = l.item, stats = Object.entries(it.stats).map(([k, v]) => statText(k, v)).join(', ');
      const c = el(`<div class="card sp"><div style="flex:1"><b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b> <span class="dim">· L${it.lvl} ${it.slot}${Game.canWear(S.heroCls, it) ? '' : ' · not for you'}</span><p style="margin:2px 0;font-size:12px">${stats}</p><div class="acts"><button ${S.gold < l.price ? 'disabled' : ''}>Buy for ${l.price}g</button> <span class="dim" style="font-size:12px">from ${esc(l.by)}</span></div></div></div>`);
      c.querySelector('button').onclick = () => { const m = buyListing(l); if (m) toast(m); refreshSheet(); }; body.appendChild(c);
    }
    if (ahTab === 'mats') for (const k of Object.keys(BASE_PRICE)) {
      const M = Craft.MATS[k]; if (!M) continue; const p = matPrice(k), tr = (a.price[k] ?? 1) > 1.08 ? '▲' : (a.price[k] ?? 1) < .92 ? '▼' : '';
      const c = el(`<div class="who"><div>${M.icon} <b>${esc(M.name)}</b> <small>${p}g each ${tr} · you have ${S.mats?.[k] || 0}</small></div><div><button data-n="1" ${S.gold < p ? 'disabled' : ''}>Buy 1</button> <button data-n="5" ${S.gold < p * 5 ? 'disabled' : ''}>Buy 5</button></div></div>`);
      c.onclick = ev => { const nn = +ev.target.dataset?.n; if (nn) { const m = buyMat(k, nn); if (m) toast(m); refreshSheet(); } }; body.appendChild(c);
    }
    if (ahTab === 'sell') {
      body.appendChild(el('<p class="dim" style="margin:0 0 4px;font-size:12px">The house keeps 5% of every sale.</p>'));
      for (const it of S.bag.filter(b => b.slot !== 'collect' && b.slot !== 'recipe')) {
        const f = fairGear(it), c = el(`<div class="who"><div><b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b> <small>L${it.lvl} · worth about ${f}g</small></div><div><button data-m=".8">${Math.round(f * .8)}g</button> <button data-m="1">${f}g</button> <button data-m="1.4">${Math.round(f * 1.4)}g</button></div></div>`);
        c.onclick = ev => { const m = +ev.target.dataset?.m; if (m) { const r = listItem(it, f * m); if (r) toast(r); else toast('Listed'); refreshSheet(); } }; body.appendChild(c);
      }
      for (const [k, n] of Object.entries(S.mats || {})) if (n > 0 && BASE_PRICE[k]) {
        const p = matPrice(k), c = el(`<div class="who"><div>${Craft.MATS[k].icon} <b>${esc(Craft.MATS[k].name)}</b> <small>you have ${n} · ${p}g each</small></div><div><button data-n="${Math.min(5, n)}">Sell ${Math.min(5, n)}</button> <button data-n="${n}">Sell all</button></div></div>`);
        c.onclick = ev => { const q = +ev.target.dataset?.n; if (q) { const r = listMat(k, q, p * q); if (r) toast(r); else toast('Listed'); refreshSheet(); } }; body.appendChild(c);
      }
    }
    if (ahTab === 'mine') { if (!a.mine.length) body.appendChild(el('<p class="dim">Nothing listed.</p>'));
      for (const l of a.mine) { const c = el(`<div class="who"><div><b>${esc(l.mat ? l.n + ' ' + Craft.MATS[l.mat].name : l.item.name)}</b> <small>${l.price}g</small></div><button>Cancel</button></div>`); c.querySelector('button').onclick = () => { const m = cancelMine(l); if (m) toast(m); refreshSheet(); }; body.appendChild(c); } }
  });
}
X.talk.push((k, n, api) => {
  const out = [];
  if (['auctioneer', 'auctioneer2', 'fence'].includes(k)) out.push(['▸ I\'d like to see the auction house.', () => { api.close(); openAH(n); }, 'hl']);
  if (['registrar', 'registrar2'].includes(k)) out.push(['▸ I\'m here about guilds.', () => { api.close(); X.ui.openBook('guild'); }, 'hl']);
  return out;
});

// ---------- the Book: guild and group finder ----------
X.book.push(['guild', 'Guild', body => {
  const { el, esc, toast, refreshSheet } = X.ui, g = G();
  if (!g) {
    body.appendChild(el('<p style="margin:0 0 6px">You are not in a guild.</p>'));
    for (const [name, info] of Object.entries(GUILD_INFO)) {
      const n = S.fakes.filter(f => f.fake?.guild === name).length;
      const c = el(`<div class="card" style="text-align:left;padding:8px"><b>&lt;${esc(name)}&gt;</b> <span class="dim">· ${n} online here${info.min > 1 ? ' · level ' + info.min + '+' : ''}</span><p style="margin:2px 0;font-size:13px">${esc(info.vibe)}</p><div class="acts"><button>Ask to join</button></div></div>`);
      c.querySelector('button').onclick = () => { const m = joinGuild(name); if (m) toast(m); refreshSheet(); }; body.appendChild(c);
    }
    const c = el('<div class="card" style="text-align:left;padding:8px"><b>Start your own guild</b><p style="margin:2px 0;font-size:13px">A charter costs 10 gold.</p><input type="text" id="gname" maxlength="22" placeholder="Guild name"><div class="acts"><button>Found the guild</button></div></div>');
    c.querySelector('button').onclick = () => { const m = startGuild(document.getElementById('gname').value); if (m) toast(m); refreshSheet(); }; body.appendChild(c);
    return;
  }
  const lv = guildLvl(), next = GLV[lv] ?? null;
  body.appendChild(el(`<p style="margin:0 0 4px"><b>&lt;${esc(g.name)}&gt;</b> · guild level ${lv}${next ? ` · ${g.xp || 0}/${next}` : ''}${g.own ? ' · founder' : ''}</p>`));
  body.appendChild(el(`<p class="dim" style="margin:0 0 6px;font-size:13px">${PERKS.map(([l, t]) => `${lv >= l ? '✓' : '·'} L${l}: ${t}`).join('<br>')}</p>`));
  { const LM = { needgreed: 'Need / Greed', master: 'Master looter', dkp: 'DKP', council: 'Loot council' }, cur = g.loot || 'needgreed';
    const r = el(`<div class="who"><div><b>Raid loot</b> <small>${g.own ? 'your rule' : 'the officers\' rule'}</small></div><div>${Object.entries(LM).map(([k, t]) => `<button data-l="${k}" class="${cur === k ? 'on' : ''}" ${g.own ? '' : 'disabled'}>${t}</button>`).join(' ')}</div></div>`);
    r.onclick = ev => { const k = ev.target.dataset?.l; if (k && g.own) { g.loot = k; chat('guild', S.hero.name, `Raid loot is ${LM[k]} from now on.`); refreshSheet(); } }; body.appendChild(r); }
  const mates = guildmates().filter(f => !f.inParty);
  body.appendChild(el(`<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">Online here (${mates.length})</h3>`));
  for (const f of mates.sort((a, b) => Math.abs(a.lvl - S.hero.lvl) - Math.abs(b.lvl - S.hero.lvl))) {
    const c = el(`<div class="who"><div><b style="color:${CLASSES[f.cls].color}">${esc(f.name)}</b> <small>L${f.lvl} ${CLASSES[f.cls].name}</small></div><button ${S.party.length >= Game.partyCap() ? 'disabled' : ''}>Invite</button></div>`);
    // guildmates always come when they can
    c.querySelector('button').onclick = () => { f.fake.friend = f.fake.friend || 'guild'; Game.invite(f); if (f.fake.friend === 'guild') f.fake.friend = false; if (f.inParty) { f.x = S.hero.x + rnd(-2, 2); f.z = S.hero.z + rnd(-2, 2); f.y = hgt(f.x, f.z); } refreshSheet(); };
    body.appendChild(c);
  }
  const others = rosterNames().filter(n => !S.fakes.some(f => f.name === n));
  if (others.length) body.appendChild(el(`<p class="dim" style="font-size:12px;margin:4px 0">Elsewhere: ${others.map(esc).join(', ')}</p>`));
  if (g.own) {
    const pool = S.fakes.filter(f => !f.inParty && !f.dead && f.fake?.guild !== g.name && Math.hypot(f.x - S.hero.x, f.z - S.hero.z) < 120).slice(0, 12);
    body.appendChild(el(`<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">Recruit</h3>`));
    for (const f of pool) { const c = el(`<div class="who"><div><b>${esc(f.name)}</b> <small>L${f.lvl} ${CLASSES[f.cls].name}${f.fake.guild ? ' · &lt;' + esc(f.fake.guild) + '&gt;' : ''}</small></div><button>Recruit</button></div>`); c.querySelector('button').onclick = () => { const m = recruit(f); if (m) toast(m); refreshSheet(); }; body.appendChild(c); }
  }
  { const r = el(`<div class="card" style="text-align:left;padding:8px"><b>Raid night</b><p style="margin:2px 0;font-size:13px">Call the guild to Between Worlds. Guildmates come first, and the guild fills the rest of the twelve.</p><div class="acts"><button>Call the raid</button></div></div>`); r.querySelector('button').onclick = () => { const m = queue('between', true); if (m) toast(m); else chat('guild', S.hero.name, 'Raid night! Between Worlds, who\'s in?'); refreshSheet(); }; body.appendChild(r); }
  const b = el('<div class="acts" style="margin-top:10px"><button style="color:#ff8a6a">Leave guild</button></div>'); b.querySelector('button').onclick = () => { leaveGuild(); refreshSheet(); }; body.appendChild(b);
}]);
X.book.push(['lfg', 'LFG', body => {
  const { el, esc, toast, refreshSheet } = X.ui;
  const q = S.ext.lfg, ready = S.ext.lfgReady, need = needed();
  body.appendChild(el(`<p style="margin:0 0 6px">Your group: ${S.party.length}/${Game.partyCap()} · still needed: ${need.tank ? need.tank + ' tank ' : ''}${need.healer ? need.healer + ' healer ' : ''}${need.dps ? need.dps + ' damage' : ''}${!need.tank && !need.healer && !need.dps ? 'nobody' : ''}</p>`));
  if (q) { const c = el(`<div class="card" style="padding:8px">Looking for a group for <b>${esc(LFG_D[q.key].name)}</b>… <div class="acts"><button>Leave queue</button></div></div>`); c.querySelector('button').onclick = () => { cancelQueue(); refreshSheet(); }; body.appendChild(c); }
  if (ready) { const c = el(`<div class="card" style="padding:8px">Your group for <b>${esc(LFG_D[ready].name)}</b> is ready.<div class="acts"><button class="pri">Take us there</button><button>We'll walk</button></div></div>`); c.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.classList.contains('pri')) { X.ui.closeSheet(); goTo(ready); } else { S.ext.lfgReady = null; refreshSheet(); } }; body.appendChild(c); }
  for (const [k, d] of Object.entries(LFG_D)) {
    const c = el(`<div class="who"><div><b>${esc(d.name)}</b> <small>levels ${d.lvl[0]}-${d.lvl[1]}</small></div><button ${q || S.party.length >= (d.raid ? 12 : 6) ? 'disabled' : ''}>Queue</button></div>`);
    c.querySelector('button').onclick = () => { const m = queue(k); if (m) toast(m); refreshSheet(); }; body.appendChild(c);
  }
}]);
