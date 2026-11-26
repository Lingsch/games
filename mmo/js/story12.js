// Build 12: a personal stake and a face to hate.
//   Your mother or father went after the Pale Choir ten years ago and never came home. A letter finally reaches
//   you at level 2, wherever you started. The trail runs through your start, the Vale and the coast.
//   On it, always a step ahead, is Aurelian Thorne of the Gilded Hand, a hero for hire whom the Choir pays to keep
//   you from finding them. He taunts you, steals your kills, and slips away, until level 10 in Thorne's Folly.
import { S, X, chat, pick, rnd, TAU, dist } from './core.js';
import { QUESTS, MOBS, GIVERS, xpNeed } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { world, hgt, freeSpot } from './world.js';
import { INSTANCES } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { boss, HU } from './hi9.js';
import { EARLY } from './early12.js';

// ---------- your missing parent ----------
export function parent() {
  if (S.ext.parent12) return S.ext.parent12;
  let h = 0; for (const c of (S.heroName || 'x') + S.seed) h = (h * 31 + c.charCodeAt(0)) | 0; h >>>= 0;
  const mother = h % 2 === 0, name = (mother ? ['Elspeth', 'Isolt', 'Brenna', 'Mairead', 'Rowan', 'Tessaly'] : ['Aldous', 'Corin', 'Hal', 'Tomas', 'Edric', 'Baird'])[(h >> 3) % 6];
  return S.ext.parent12 = { rel: mother ? 'mother' : 'father', name, she: mother ? 'she' : 'he', her: mother ? 'her' : 'his', Her: mother ? 'Her' : 'His', She: mother ? 'She' : 'He' };
}
const fill = s => { const p = parent(); return s.replace(/\{rel\}/g, p.rel).replace(/\{name\}/g, p.name).replace(/\{she\}/g, p.she).replace(/\{her\}/g, p.her).replace(/\{Her\}/g, p.Her).replace(/\{She\}/g, p.She).replace(/\{you\}/g, S.heroName || 'you').replace(/\{town\}/g, S.ext.valeTown || 'the Vale'); };

// ---------- the people ----------
GIVERS.post12 = { name: 'Dapple the Post-Rider', title: 'Letters, late and otherwise', model: 'villager2' };
GIVERS.wenlock12 = { name: 'Old Wenlock', title: '{town} · an old friend of your family', model: 'hermit' };
TALK.post12 = { bio: 'Dapple carries letters between every town from the Weald to the coast, on a pony called Thursday who is much faster than Dapple. She has never lost a letter. She has, on several occasions, delivered one ten years late.',
  greet: ['Post! Post for anyone? No? Just me talking to myself, then. Again.', 'Thursday says hello. Thursday is the pony. Thursday does not actually say hello. I say it for him.'],
  topics: [{ q: 'How does a letter take ten years?', a: ['It sat in a sorting-house in Corrandel that burned down, and then in the sorting-house they built to replace it, which flooded, and then in a sack under the stairs of the third sorting-house until a clerk tripped over it last spring.', 'I\'m very sorry. I really am. I rode all night to get it to you.'] }] };
Object.defineProperty(TALK, 'wenlock12', { configurable: true, enumerable: true, get() { return { bio: 'Wenlock was a lantern-bearer in the Fourfold Guard, and went hunting the Pale Choir with your parent in the year the Choir first came back. He came home. Your parent did not. He has never forgiven himself for that, and he would like the chance to try.',
  greet: [fill("You have {her} eyes. Has anyone told you that? You have {name}'s eyes exactly."), fill("I've been waiting ten years for someone to come and ask me about {name}. I'm glad it's you.")],
  topics: [{ q: fill('What happened to my {rel}?'), a: [fill("We were hunting the Choir together. {She} was better at it than me, braver, smarter, always a step further in. One night {she} went into a Choir camp alone to get a look at their leader, and {she} didn't come out."), fill("I looked for {her} for a year. Then the Guard told me to stop. I'm sorry. I should never have stopped.")] }] }; } });

// ---------- the rival ----------
Object.assign(MOBS, {
  thorne12: boss('Aurelian Thorne', 'knifeshade2~gilded', { ...HU, hpM: 1.3, scale: 1.1, weak: 'holy', mechs: ['cleave', 'charge'], lines: { start: 'Oh, it\'s you. The farm-hand with the tragic backstory. I\'ve heard all about you. I\'ve been paid to hear all about you.', half: 'Hah! Not bad, for a nobody.' } }),
  thug12: { name: 'Gilded Hand Sellsword', kind: 'bandit2', hpM: 1, dmgM: 1, spd: 5.6, range: 2.4, weak: 'holy', resist: null, scale: 1, aggro: 14, social: 14, human: true },
});
MOB_LORE.thorne12 = 'Aurelian Thorne of the Gilded Hand, a hero for hire. Very good, very expensive, and very pleased with himself.';
const RIVAL = {
  taunt: ["You're still alive? I had money on the wolves.", "Saw you fighting back there. Very brave. Very slow.", "The Choir says hello. Well, they don't say anything. They hum. But you get the idea.", "Still chasing ghosts, farm-hand?", "I'm three steps ahead of you and I'm not even trying.", "Do you know how much they're paying me to make you give up? Neither do you. That's the joke."],
  steal: ["Too slow!", "Mine, I think.", "Thanks for softening that up.", "Don't feel bad. Everyone's slower than me."],
  flee: ["Smoke and mirrors, farm-hand! Smoke and mirrors!", "Another day! I'm late for a much better fight!", "You haven't seen the last of me. Nobody ever has."],
};
// Thorne never stays to lose until Thorne's Folly
X.tick.push(() => {
  for (const m of S.ents) if (m.mob === 'thorne12' && !m.dead && !m.remove && m.hp < m.maxHp * .35) {
    chat('say', 'Aurelian Thorne', pick(RIVAL.flee)); m.remove = true; m.dead = true;
    for (const t of S.ents) if (t.mob === 'thug12' && !t.dead && dist(t, m) < 30) { t.remove = true; t.dead = true; }
    const q = QUESTS.find(q => q.obj?.named === 'thorne12' && S.quests[q.id]?.state === 'active');
    if (q) { const st = S.quests[q.id]; st.n = 1; st.state = 'done'; chat('sys', null, `${q.name}: done! ${q.escapeNote ? fill(q.escapeNote) : ''}`); Game.save(); }
  }
});
function spawnThorne(sp) {
  if (!sp || S.ents.some(e => e.mob === 'thorne12' && !e.dead)) return;
  const L = Math.max(2, (S.hero?.lvl || 2) + 1), m = Cb.makeMob('thorne12', L, { x: sp.x, z: sp.z, home: { ...sp }, named: 'thorne12', boss2: true, camp: 'thorne' }); m.y = hgt(sp.x, sp.z);
  for (let i = 0; i < 2; i++) { const a = i * Math.PI + .5, x = sp.x + Math.sin(a) * 3, z = sp.z + Math.cos(a) * 3, t = Cb.makeMob('thug12', Math.max(1, L - 1), { x, z, home: { x, z }, camp: 'thorne' }); t.y = hgt(x, z); }
  world.places.push({ name: 'Aurelian Thorne', x: sp.x, z: sp.z, R: 6, kind: 'place' });
}
const thorneQ = () => QUESTS.find(q => q.obj?.named === 'thorne12' && (q.zone || 'vale') === S.zone && S.quests[q.id]?.state === 'active');
X.accept.push(q => { if (q.obj?.named === 'thorne12' && (q.zone || 'vale') === S.zone) spawnThorne(world.spots[q.where]); });
X.zone.push(() => { const q = thorneQ(); if (q) setTimeout(() => spawnThorne(world.spots[q.where]), 1500); });
// he is everywhere you go in the early lands: in chat, and sometimes at your kill
let tauntT = 240, stoleIn = {};
const active = () => S.quests.p12b_vale || S.quests.p12b_weald || S.quests.p12b_kiln || S.quests.p12b_hush;
const done = () => S.quests.p12e?.state === 'turned';
X.tick.push(dt => {
  const h = S.hero; if (!h || !S.running || done() || !active() || !EARLY.includes(S.zone)) return;
  if ((tauntT -= dt) <= 0) { tauntT = rnd(360, 600); chat('whisper', 'Aurelian Thorne', pick(RIVAL.taunt)); }
  const t = S.target;
  if (!stoleIn[S.zone] && t?.mob && t.named && !t.boss && !t.dead && t.engaged && t.lvl <= 11 && t.hp < t.maxHp * .4 && Math.random() < .004) {
    stoleIn[S.zone] = true; const a = rnd(0, TAU), x = t.x + Math.sin(a) * 2.5, z = t.z + Math.cos(a) * 2.5;
    const g = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: 'Aurelian Thorne', title: '<the Gilded Hand>', kind: 'knifeshade2~gilded', x, z }); g.y = hgt(x, z);
    t.tagged = 'other'; Cb.kill(t, null); chat('say', 'Aurelian Thorne', pick(RIVAL.steal));
    setTimeout(() => { g.remove = true; g.dead = true; }, 3500);
  }
});

// ---------- the trail ----------
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f);
const START = { human: ['vale', 'wagon'], varr: ['weald', 'poachers'], grael: ['kiln', 'scav'], sallow: ['hush', 'finders'] };
const race = () => S.ext.race || 'human';
for (const [r, [z, where]] of Object.entries(START)) {
  QUESTS.push(
    { id: `p12a_${z}`, story: true, giver: 'post12', lvl: 2, needLvl: 2, zone: z, name: 'A Letter, Ten Years Late', when: () => race() === r, gold: 5, xp: qx(2, .35),
      get say() { return [fill("Post for {you}! Er... this one's a bit late. Ten years late, the stamp says. It went to the wrong sorting-house, and then the right one burned down, and then... look, I'm very sorry. It's from your {rel}."), fill("I'll give you a moment. Thursday and I will be over there, pretending not to watch.")]; },
      get text() { return fill('A letter from your {rel}, ten years late.'); }, obj: { talk: true, get what() { return fill('Read the letter from your {rel}, {name}'); } },
      get done() { return [fill("\"My darling. If this reaches you, I didn't come home. I'm sorry. I'm so sorry. I went after the Pale Choir because somebody had to, and because they were coming for us. Don't look for me. Grow up and be happy. (You won't listen. You never did. If you do come looking, start with my locket. I left it where it would be safe.) All my love, always. {name}.\""), "Dapple sniffs, and pretends very hard that she isn't. \"There's a postscript. 'Ask Wenlock in {town}.' I know Wenlock. He's... he's a good man. Go and see him, when you're ready.\""]; } },
    { id: `p12b_${z}`, story: true, giver: 'post12', lvl: 4, pre: `p12a_${z}`, zone: z, where, name: 'The Locket', when: () => race() === r, gold: 10, xp: qx(4, .45),
      get say() { return [fill("Your {rel}'s locket? I know where it went. A trader sold it last week to a fancy sort in gold armour, a hero for hire, the kind who signs autographs. He's been asking about you, too."), "He's camped out there now with a couple of sellswords. I don't think he means to give it back."]; },
      get text() { return fill('Your {rel}\'s locket, in the hands of a hero for hire.'); }, obj: { named: 'thorne12', n: 1, get what() { return fill('Get your {rel}\'s locket back from the hero for hire who bought it'); } },
      escapeNote: "He dropped something when he ran: your {rel}'s locket.",
      get done() { return [fill("He ran off and dropped it? Ha! Here, let me see. Oh. Oh, it's lovely. That's you, inside, as a baby. And that's {name}."), "Look, there's a name scratched on the back. 'Wenlock. {town}.' That settles it: when you're ready for the Vale, you go and see Wenlock. And watch out for that Thorne fellow. He knew your name."]; } },
  );
}
X.preAlt = X.preAlt || {};
X.preAlt.p12b_vale = ['p12b_weald', 'p12b_kiln', 'p12b_hush'];
QUESTS.push(
  { id: 'p12c', story: true, giver: 'wenlock12', lvl: 5, needLvl: 5, pre: 'p12b_vale', where: 'choircamp', name: 'The Journal', gold: 15, xp: qx(5, .5),
    get say() { return [fill("So you found {her} locket, and Thorne found you. The Gilded Hand works for whoever pays, and lately the Pale Choir pays very well."), fill("{name} kept a journal. When {she} went into the Choir camp, the journal went with {her}. The Choir tear pages out of things they take and use them for their hymns. Bring me pages from the cultists at the old Choir camp, west of town, and we'll see what {she} wrote.")]; },
    get text() { return fill('Pages from your {rel}\'s journal, torn out by the Choir.'); }, obj: { collect: ['cultist', 'chanter'], item: 'Page of a Journal', chance: .45, n: 5, get what() { return fill("Take 5 pages of {name}'s journal from the Choir's cultists and chanters"); } },
    get done() { return [fill("That's {her} hand. I'd know it anywhere. 'Day 40. The Choir moves its prisoners at night. They are taking them somewhere by the sea.' Prisoners, it says. Prisoners, not dead."), "There's more, but it's water-damaged, and... the last page has a gold thumbprint on it. Thorne's been through these before you. He's ahead of us."]; } },
  { id: 'p12d', story: true, giver: 'wenlock12', lvl: 7, pre: 'p12c', where: 'tower', name: 'A Step Ahead', gold: 20, xp: qx(7, .5),
    get say() { return [fill("Thorne's at the old watchtower, south-west of here. A shepherd saw him there this morning with a torch and a bundle of letters. If those are the rest of {name}'s pages, he's going to burn them."), "Go. Now. Run."]; },
    get text() { return 'Thorne, at the old watchtower, with a torch.'; }, obj: { named: 'thorne12', n: 1, what: 'Stop Aurelian Thorne at the old watchtower before he burns the last pages' },
    escapeNote: 'He ran, but the pages are safe. Mostly. One is singed.',
    get done() { return [fill("Singed, but readable. 'The Choir's hired a hero to watch my family. If anything happens to me, he'll go after my child next. His name is Thorne.' Ten years ago, {she} knew. {She} knew about him ten years ago."), "Thorne has a house, they say. Out past the old ruins, a grand, ugly place he calls his Folly. When you're strong enough, that's where this ends."]; } },
  { id: 'p12e', story: true, giver: 'wenlock12', lvl: 9, needLvl: 9, pre: 'p12d', where: 'folly12', name: 'Thorne\'s Folly', gold: 40, xp: qx(9, .7),
    get say() { return ["Thorne's Folly, south of the ruins. He's got his hound, his partner Vesper, and every sellsword the Gilded Hand could spare.", fill("He knows where {name} is, or knows who does. Bring him down. And bring me whatever he's got on him.")]; },
    get text() { return 'The end of Aurelian Thorne.'; }, obj: { named: 'thornefinal12', n: 1, what: 'Defeat Aurelian Thorne in Thorne\'s Folly' },
    get done() { return [fill("A ledger. 'Paid by the Choir: four hundred gold a year, to keep the child from Saint Brine's.' Saint Brine's Undercroft, on the coast. That's where they took {name}."), fill("Go to the coast, {you}. Go to Saint Brine's. Go and find your {rel}. And if you find {her}... tell {her} Wenlock is sorry.")]; } },
  { id: 'p12f', story: true, giver: 'wenlock12', lvl: 11, needLvl: 10, pre: 'p12e', zone: 'coast', where: 'undercroft12', name: 'Saint Brine\'s Undercroft', gold: 60, xp: qx(11, .6),
    get say() { return [fill("Saint Brine's Undercroft is under the old abbey on the coast. The Choir keeps its prisoners there. If {name} is alive, that's where {she} is."), "I'd come with you, but my knees and my nerve went the same year. Go. Find out."]; },
    get text() { return fill('The cells under Saint Brine\'s, where the Choir kept your {rel}.'); }, obj: { named: 'abbot12', n: 1, get what() { return fill("Search Saint Brine's Undercroft for your {rel}, and get past the Hollow Abbot"); } },
    get done() { return [fill("An empty cell, and a message scratched in the wall, in {her} hand: 'Still alive. They are taking me north, to the Frost-King's halls. Don't follow. (You will.) I love you. {name}.'"), fill("Still alive, {you}. Still alive. The north is a long way, and a long time from now, but you'll get there. I know you will. You have {her} eyes.")]; } },
);
// Dapple rides wherever you started, and into the Vale; Wenlock waits in {town}
X.zone.push(zone => {
  if (!world.town || !['vale', 'weald', 'kiln', 'hush'].includes(zone)) return;
  const t = world.town, avoid = S.ents.filter(e => e.team === 'npc' && !e.prop && dist(e, t) < 40);
  const p = freeSpot(t.x, t.z, 7, 24, 1.1, avoid); const d = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: GIVERS.post12.name, title: GIVERS.post12.title, kind: 'villager2', x: p.x, z: p.z, giver: 'post12' }); d.y = hgt(p.x, p.z);
  if (zone === 'vale') { const w = freeSpot(t.x, t.z, 9, 26, 2.6, [...avoid, p]); const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: GIVERS.wenlock12.name, title: GIVERS.wenlock12.title, kind: 'hermit', x: w.x, z: w.z, giver: 'wenlock12' }); e.y = hgt(w.x, w.z); }
});
