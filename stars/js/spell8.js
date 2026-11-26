// Build 8: spell books and the Scribing profession, and a wider spread of things to find on a body.
// Every spell can be raised twice past where levelling takes it: the Adept rank, then the Master rank.
// Ranks come from tomes that drop in the world, or from blank tomes a scribe writes at the lectern.
import { S, pick, irnd, chat, X } from './core.js';
import { CLASSES, BOOK, makeItem, MAX_LVL, SLOT_NAMES, GIVERS, MOBS, RARITY } from './data.js';
import * as Craft from './crafting.js';
import { TALK } from './dialogue.js';
import { addKinds } from './render.js';
import { build, P, T, Box, Cyl, Sph, Cone } from './models.js';
const O = [0, 0, 0], STILL = [0, 0, 0, 0];

// every ability knows its own key, so a rank can be looked up from the ability alone
for (const c in CLASSES) for (const [k, a] of Object.entries(CLASSES[c].abilities)) a.key = k;
SLOT_NAMES.book = 'Spell tome'; SLOT_NAMES.junk = 'Trade goods';

// ---------- whose ranks ----------
// yours are kept per class; a companion's are kept by name, so a friend keeps what they've studied
export function ranksOf(e, cls = e?.cls) {
  if (!e || !cls) return null;
  S.ext.ranks = S.ext.ranks || {};
  if (e.isHero) return (S.ext.ranks[cls] = S.ext.ranks[cls] || {});
  S.ext.allyRanks = S.ext.allyRanks || {};
  const a = (S.ext.allyRanks[e.name] = S.ext.allyRanks[e.name] || {});
  return (a[cls] = a[cls] || {});
}
BOOK.rank = (e, ab) => {
  if (!ab?.key || !e?.cls || (!e.isHero && !e.fake)) return 0;
  const r = e.isHero ? S.ext.ranks?.[e.cls] : S.ext.allyRanks?.[e.name]?.[e.cls];
  return r?.[ab.key] || 0;
};
const RANK_FX = ['', '15% stronger and 10% cheaper', '30% stronger, 20% cheaper and with a 15% shorter cooldown'];
export const needLvl = (ab, rank) => Math.min(MAX_LVL, rank === 1 ? Math.max(6, ab.lvl + 2) : Math.max(14, ab.lvl + 6));
// null if this person can study this rank of this spell, otherwise why not
export function whyNot(e, cls, key, rank) {
  const ab = CLASSES[cls]?.abilities[key]; if (!ab) return 'The writing makes no sense to you.';
  if (e.cls !== cls) return `Written for a ${CLASSES[cls].name}.`;
  if (e.lvl < ab.lvl) return `You don't know ${ab.name} yet.`;
  const cur = BOOK.rank(e, ab);
  if (cur >= rank) return `You already know the ${BOOK.names[cur]} rank.`;
  if (rank === 2 && cur < 1) return 'Learn the Adept rank first.';
  if (e.lvl < needLvl(ab, rank)) return `Requires level ${needLvl(ab, rank)}.`;
  return null;
}
// spells a blank tome could be written into, for this person
export const blankOptions = (e, rank) => Object.keys(CLASSES[e.cls].abilities).filter(k => !whyNot(e, e.cls, k, rank));
export const canStudy = (e, it) => it.book && (it.book.blank ? blankOptions(e, it.book.rank).length > 0 : !whyNot(e, it.book.cls, it.book.key, it.book.rank));

// ---------- the tomes ----------
export function tome(cls, key, rank) {
  const ab = CLASSES[cls].abilities[key], L = needLvl(ab, rank);
  return makeItem({ name: `${rank === 1 ? "Adept's" : "Master's"} Tome: ${ab.name}`, slot: 'book', book: { cls, key, rank }, lvl: L, rarity: rank === 1 ? 2 : 3, stats: {}, value: rank === 1 ? 20 + L * 3 : 70 + L * 6,
    desc: `${CLASSES[cls].name}. Raises ${ab.name} to its ${BOOK.names[rank]} rank: ${RANK_FX[rank]}.` });
}
export function blankTome(rank) {
  return makeItem({ name: rank === 1 ? "Blank Adept's Tome" : "Blank Master's Tome", slot: 'book', book: { blank: true, rank }, lvl: rank === 1 ? 6 : 14, rarity: rank === 1 ? 2 : 3, stats: {}, value: rank === 1 ? 45 : 160, crafted: true,
    desc: `Any class. Study it to write one of your spells into the ${BOOK.names[rank]} rank: ${RANK_FX[rank]}.` });
}
// learn it. Returns a message if it didn't take.
export function study(e, it, key) {
  const b = it.book; if (!b) return 'That is not a tome.';
  const cls = b.blank ? e.cls : b.cls; key = b.blank ? key : b.key;
  if (b.blank && !key) return 'Choose a spell.';
  const why = whyNot(e, cls, key, b.rank); if (why) return why;
  ranksOf(e, cls)[key] = b.rank;
  const ab = CLASSES[cls].abilities[key];
  if (e.isHero) { S.bag = S.bag.filter(x => x !== it); chat('sys', null, `You study the tome until the words stay put. ${ab.name} is now ${BOOK.names[b.rank]}.`); }
  else chat('party', e.name, pick([`ok ${BOOK.names[b.rank].toLowerCase()} ${ab.name.toLowerCase()} unlocked`, `reading this now, ty`, `${ab.name} rank up!! ty`, 'oh nice, been wanting that one']));
  return null;
}
X.study = study; X.canStudy = canStudy; X.blankOptions = blankOptions; X.whyNot = whyNot;

// a body might be carrying a tome: mostly for someone in your group, sometimes for a stranger's class (sell it)
function bookFor(m) {
  const people = S.party.filter(p => p.cls && !p.dead), who = Math.random() < .5 ? S.hero : Math.random() < .8 && people.length ? pick(people) : null;
  const cls = who ? who.cls : pick(Object.keys(CLASSES));
  const keys = Object.keys(CLASSES[cls].abilities).filter(k => CLASSES[cls].abilities[k].lvl <= m.lvl + 1); if (!keys.length) return null;
  const masterCh = m.lvl < 14 ? 0 : m.raidBoss ? .7 : m.boss ? .5 : m.named ? .35 : m.elite ? .2 : .1;
  return tome(cls, pick(keys), Math.random() < masterCh ? 2 : 1);
}

// ---------- the rest of what a body carries ----------
const JUNK = {
  beast: [['Matted Pelt', 2], ['Cracked Fang', 2], ['Sharp Claw', 3], ['Bloodied Tail', 1], ['Unbroken Tusk', 6]],
  undead: [['Bone Chip', 1], ['Grave-Rotted Ring', 5], ['Funeral Coin', 4], ['Dusty Rib', 1], ['Wax-Sealed Locket', 8], ['Sliver of Coffin Lid', 2]],
  human: [['Pair of Loaded Dice', 4], ["Bandit's Letter", 3], ['Silver Thimble', 6], ['Torn Map', 3], ['Pouch of Tobacco', 2], ['Pewter Flask', 4], ['Locket With No Picture', 7]],
  thing: [['Glittering Pebble', 2], ['Strange Residue', 2], ['Warped Shard', 4], ['Chitin Plate', 3], ['Ichor-Stained Rag', 1]],
};
const junkFor = m => { const D = MOBS[m.mob] || {}, list = D.beast ? JUNK.beast : D.undead ? JUNK.undead : D.human ? JUNK.human : JUNK.thing, [name, v] = pick(list);
  return makeItem({ name, slot: 'junk', junk: true, lvl: m.lvl, rarity: 0, stats: {}, value: Math.max(1, Math.round(v * (1 + m.lvl * .35))) }); };
// rings and necklaces, which until now only crafters and bosses could make
const JEWEL = { ring: ['Band', 'Signet', 'Loop', 'Ring'], neck: ['Pendant', 'Choker', 'Amulet', 'Torc'] };
const JMAT = ['Copper', 'Bone', 'Iron', 'Jet', 'Silver', 'Pearl'], JSUF = [['of the Bear', 'sta'], ['of Might', 'pow'], ['of the Eagle', 'crit']];
function jewelFor(m) {
  const slot = Math.random() < .5 ? 'ring' : 'neck', L = m.lvl, rar = Math.random() < .2 ? 2 : 1, b = Craft.gearBudget(L, slot) * (rar === 2 ? .8 : .62), [suf, key] = pick(JSUF);
  const stats = { pow: Math.round(b * .45), sta: Math.round(b * .4) }; if (key === 'crit') stats.crit = +(1 + L * .07 + rar * .5).toFixed(1); else stats[key] += Math.round(b * .15);
  return makeItem({ name: `${JMAT[Math.min(JMAT.length - 1, Math.floor(L / 4))]} ${pick(JEWEL[slot])} ${suf}`, slot, type: slot, lvl: L, rarity: rar, stats, value: Math.round((3 + L * 4) * (1 + rar * 2)) });
}
X.kill.push(m => {
  if (m.tagged !== 'party' || !m.loot) return;
  const D = MOBS[m.mob] || {}, add = it => it && m.loot.push(it);
  const bookCh = m.raidBoss || D.raidBoss ? .6 : m.boss ? .4 : m.named ? .25 : m.elite ? .08 : .025;
  if (Math.random() < bookCh) add(bookFor(m));
  if (!m.boss && Math.random() < .12) add(junkFor(m));   // less junk
  if (Math.random() < (m.elite || m.named ? .08 : .025)) add(jewelFor(m));
  if (Math.random() < .05) { const hp = Math.random() < .5; add(makeItem({ name: hp ? 'Healing Draught' : 'Clarity Draught', slot: 'junk', pot: hp ? 'hpot' : 'mpot', lvl: 1, rarity: 0, stats: {}, value: 0 })); }
  if ((D.human || D.undead || D.caster) && Math.random() < (m.named ? .6 : .08)) add(makeItem({ name: 'Torn Spell Page', slot: 'junk', mat: 'page', n: m.named ? 2 : 1, lvl: 1, rarity: 1, stats: {}, value: 0 }));
});
// small things go straight into your pack: potions, pages and trade goods. Returns true if it was handled.
export function takeSmall(it, quiet) {
  const say = t => quiet || chat('loot', null, t);
  if (it.pot) { S.pots[it.pot] = (S.pots[it.pot] || 0) + 1; say(`You take a ${it.name}.`); return true; }
  if (it.mat) { Craft.addMat(it.mat, it.n || 1, true); say(`You take ${it.n > 1 ? it.n + ' ' : 'a '}${it.name}${it.n > 1 ? 's' : ''}.`); return true; }
  if (it.junk) { if (S.bag.length >= 30) return false; S.bag.push(it); say(`You take ${it.name}.`); return true; }
  return false;
}
X.takeSmall = takeSmall; X.isSmall = it => !!(it.pot || it.mat || it.junk);
export const isSmall = it => !!(it.pot || it.mat || it.junk);

// ---------- Scribing ----------
Craft.PROFS.scribing = { name: 'Scribing', icon: '✒️' };
Craft.MAKE_JOBS.push('scribing');
Craft.STATIONS.scribe = { name: "Scribe's Lectern", profs: ['scribing'] };
Craft.TRAINERS.quill = ['scribing'];
Object.assign(Craft.MATS, {
  page: { name: 'Torn Spell Page', icon: '📄' }, vellum: { name: 'Vellum', icon: '📜' }, hvellum: { name: 'Heavy Vellum', icon: '🗞️' },
  ink: { name: "Scribe's Ink", icon: '🖋️' }, gloomink: { name: 'Gloomink', icon: '🫙' }, tideink: { name: 'Tide Ink', icon: '🌊' },
});
Object.assign(Craft.CONS, {
  scrollward: { name: 'Scroll of Warding', icon: '📜', buff: 'scroll', data: { armor: .12 }, desc: '+12% armor for 30 minutes.' },
  scrollsight: { name: 'Scroll of Keen Sight', icon: '📜', buff: 'scroll', data: { crit: .03 }, desc: '+3% critical chance for 30 minutes.' },
  scrollwar: { name: 'Scroll of the War-Chant', icon: '📜', buff: 'scroll', data: { pow: .07, armor: .06 }, desc: '+7% power and +6% armor for 30 minutes.' },
  scrollvigil: { name: 'Scroll of the Long Vigil', icon: '📜', buff: 'scroll', data: { hp: .1, crit: .03 }, desc: '+10% health and +3% critical chance for 30 minutes.' },
});
const add = Craft.addRecipe;
add('vellum', 'scribing', 'Vellum (2)', 1, { lighthide: 2 }, { mat: 'vellum', n: 2 });
add('ink', 'scribing', "Scribe's Ink (2)", 1, { meadowsweet: 2 }, { mat: 'ink', n: 2 });
add('scrollward', 'scribing', 'Scroll of Warding (2)', 10, { vellum: 1, ink: 1 }, { cons: 'scrollward', n: 2 });
add('scrollsight', 'scribing', 'Scroll of Keen Sight (2)', 20, { vellum: 1, ink: 1, dust: 1 }, { cons: 'scrollsight', n: 2 });
add('tome1', 'scribing', "Blank Adept's Tome", 30, { vellum: 3, ink: 3, page: 2 }, { tome: 1 });
add('hvellum', 'scribing', 'Heavy Vellum (2)', 40, { thickhide: 2 }, { mat: 'hvellum', n: 2 });
add('gloomink', 'scribing', 'Gloomink (2)', 40, { graveroot: 2, bonedust: 1 }, { mat: 'gloomink', n: 2 });
add('scrollwar', 'scribing', 'Scroll of the War-Chant (2)', 50, { hvellum: 1, gloomink: 1 }, { cons: 'scrollwar', n: 2 });
add('tome1b', 'scribing', "Blank Adept's Tome, Heavy-Bound", 55, { hvellum: 2, gloomink: 2, page: 1 }, { tome: 1 });
add('tideink', 'scribing', 'Tide Ink (2)', 70, { kelpbloom: 2, pearl: 1 }, { mat: 'tideink', n: 2 });
add('scrollvigil', 'scribing', 'Scroll of the Long Vigil (2)', 75, { hvellum: 1, tideink: 1, shard: 1 }, { cons: 'scrollvigil', n: 2 });
add('tome2', 'scribing', "Blank Master's Tome", 85, { hvellum: 4, tideink: 3, page: 4, shard: 3 }, { tome: 2 });
Craft.craftHooks.tome = blankTome;
Craft.craftHooks.mat = (k, n) => Craft.addMat(k, n, true);

// the lectern
addKinds({ scribe: [build([P(T(Cyl(.12, .22, 1.2, 6), 0, .6), 0, O, '#5a3e28'), P(T(Box(1, .08, .7), 0, 1.25, 0, -.35), 0, O, '#6b4a2e'),
  P(T(Box(.85, .06, .6), 0, 1.31, 0, -.35), 0, O, '#efe4c4'), P(T(Box(.04, .07, .6), 0, 1.33, 0, -.35), 0, O, '#7a2a2a'),
  P(T(Cyl(.05, .05, .2, 6), .55, 1.35, .25), 0, O, '#f4ecd8'), P(T(Cone(.04, .1, 5), .55, 1.5, .25), 0, O, '#ffcf5a', 2),
  P(T(Box(.5, .7, .5), -.9, .35, .2), 0, O, '#4a3322'), P(T(Sph(.1, 6, 5), -.9, .78, .2), 0, O, '#2a2a3a', .4), P(T(Cone(.015, .4, 4), -.85, .95, .2, .5), 0, O, '#f0f0f0')]), STILL, 0, .03] });

GIVERS.quill = { name: 'Brother Quill', title: 'Scribing', model: 'priest' };
TALK.quill = { bio: "Brother Quill left the abbey with a satchel of stolen pens and a grudge against bad handwriting. Spells, he says, are only words that refuse to be forgotten, and he knows how to make them refuse harder.",
  greet: ["Don't touch the ink. Don't breathe on the vellum. Do sit down, you look like a person with a spell that needs fixing.", "Every spell you know is a sentence. I can teach you to write it better.", "A tome is just a spell that someone was too stubborn to let die."],
  topics: [{ q: 'What is a spell tome?', a: ["Words that make a spell stronger, written down so they stay. An Adept's tome takes a spell you know and teaches you to say it properly. A Master's tome teaches you to say it like you mean it.", "You'll find them on the dead, mostly. Wizards are forever dying with a good book in their pocket. Or you can learn to write blank ones yourself, and fill them in with whatever you like."] },
    { q: 'What do I need to write?', a: ["Vellum from hides. Ink from flowers, or from worse things, the better the ink. And pages, torn out of spellbooks by people who no longer need them. Cultists, bandits, the walking dead. They all carry a few."] }] };
