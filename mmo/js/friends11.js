// Build 11: your friends have lives of their own.
//   Loyalty (0-100): it grows while you adventure together and through their stories, and wears down when you
//   leave them behind or let them down. At 75 they fight harder for you; at 90, harder still. Below 15 they leave,
//   and you'll have to write to them to win them back.
//   A personal story for each friend: three chapters, ending in a choice.
//   Romance and rivalry: you can grow close to one friend, and your friends fall for, and fall out with, each
//   other and the fake players too. Their story is on the Friends page.
import { S, X, chat, pick, rnd, TAU, dist } from './core.js';
import { QUESTS, MOBS, GIVERS, CLASSES, xpNeed } from './data.js';
import { hgt, world } from './world.js';
import { INSTANCES } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { boss } from './hi9.js';
import { parent } from './story12.js';

const F = () => (S.ext.fr = S.ext.fr || { loyal: {}, story: {}, romance: null, pairs: [], gossip: [], left: {}, drink: {}, nextEvent: 900 });
const loyal = n => F().loyal[n] ?? (F().loyal[n] = 50);
export const loyaltyName = v => v >= 90 ? 'Sworn' : v >= 75 ? 'Devoted' : v >= 50 ? 'Friendly' : v >= 30 ? 'Distant' : 'Fed up';
const friends = () => (S.friends || []);
const inParty = n => S.party.find(p => p.name === n && !p.isHero);
function bump(n, d, why) {
  const f = F(), was = loyal(n); f.loyal[n] = Math.max(0, Math.min(100, was + d));
  const now = f.loyal[n]; if (loyaltyName(now) !== loyaltyName(was)) chat('sys', null, `${n} is now ${loyaltyName(now).toLowerCase()}${why ? ` (${why})` : ''}.`);
  const e = inParty(n); if (e) Cb.recalc(e);
  if (now < 15) leave(n);
}
X.loyaltyBump = bump;
// loyalty in numbers: devoted friends fight a little harder, sworn friends harder still, and your love more
{ const prev = X.acctOf; X.acctOf = e => { const a = prev ? prev(e) : {}; if (!e || e.isHero || !e.fake?.bff) return a; const v = loyal(e.name), k = (v >= 90 ? .1 : v >= 75 ? .05 : 0) + (F().romance === e.name ? .05 : 0); if (!k) return a; return { ...a, powP: (a.powP || 0) + k, hpP: (a.hpP || 0) + k }; }; }
// together: loyalty grows; apart: it wears down
let tT = 0;
X.tick.push(dt => {
  if (!S.hero || !S.running || (tT += dt) < 60) return; tT = 0;
  for (const fr of friends()) { const s = F().story[fr.name] = F().story[fr.name] || { together: 0, apart: 0 };
    if (inParty(fr.name)) { s.together++; s.apart = 0; if (s.together % 5 === 0) bump(fr.name, 1); }
    else { s.apart++; if (s.apart >= 30 && s.apart % 15 === 0) { bump(fr.name, -1); if (s.apart === 30) chat('whisper', fr.name, pick(["Are we still adventuring? Only it's been a while.", "I've been sitting at the inn for half a day. The barman knows my life story now.", "No pressure. But I'm bored. Very, very bored."])); } }
  }
  events();
});
// leaving them out of the group stings
X.kickHook = f => { if (f?.fake?.bff && !F().left[f.name] && !S.ext.bgKey) bump(f.name, -3); };
// a friend who walks out
function leave(n) {
  const fr = friends().find(f => f.name === n); if (!fr || F().left[n]) return;
  chat('party', n, pick(["I'm done. I followed you up mountains and into crypts and you never once asked how I was. Goodbye.", "I need some time away from you. Don't follow me.", "I'm going home. Write, if you ever remember I exist."]));
  F().left[n] = { cls: fr.cls, pal: fr.pal, t: Date.now(), tries: 0 }; S.friends = friends().filter(f => f.name !== n);
  const e = S.ents.find(p => p.name === n && p.fake); if (e) { if (e.inParty) Game.kick(e); e.fake.bff = false; e.fake.friend = false; e.remove = true; e.dead = true; S.fakes = S.fakes.filter(p => p !== e); }
  if (F().romance === n) F().romance = null;
  chat('sys', null, `${n} has left you. You could write to them, from the Friends page.`);
}
export function writeTo(n) {
  const l = F().left[n]; if (!l) return null;
  const cost = 20 + (S.hero?.lvl || 1) * 8; if (S.gold < cost) return `A letter, a gift and a courier cost ${cost} gold.`;
  if (Date.now() - (l.last || 0) < 36e5) return 'You wrote within the hour. Give them time to read it.';
  S.gold -= cost; l.last = Date.now(); l.tries++;
  if (Math.random() < .35 + l.tries * .15) {
    delete F().left[n]; F().loyal[n] = 40; const fr = { name: n, pal: l.pal || 1, persona: 'friendly', cls: l.cls }; S.friends.push(fr);
    if (S.party.length < Game.partyCap()) Game.addMate({ name: n, cls: l.cls, lvl: S.hero.lvl, pal: fr.pal, persona: 'friendly', guild: null, friend: true, bff: true }, S.hero);
    chat('party', n, pick(["I got your letter. All four pages. Fine. I'm back. Don't make me regret it.", "You wrote. Nobody ever writes. ...Shove over, then."])); return null;
  }
  chat('sys', null, pick([`${n} sends the letter back unopened.`, `${n} writes back: "Not yet."`, `The courier says ${n} read your letter twice and then went for a long walk.`])); return null;
}

// ---------- personal stories: three chapters each ----------
export const STORIES = {
  sibling: { t1: 'Family Business', t2: 'The Ones Who Took Them', t3: 'Home Again',
    s1: n => [`${n} has a younger sister called Wenna, who ran off two years ago to join a company of sellswords. A letter came this morning: Wenna is in trouble, and the company won't let her go.`, `"I know it's not your problem," ${n} says. "But you're the best fighter I know, and I don't know who else to ask."`],
    rival: n => [`The Blackwater Company`, `Captain Drace of the Blackwater Company`, 'bandit2'],
    s2: n => [`The Blackwater Company owns Wenna's contract, and Captain Drace doesn't let anyone go. ${n} has found his camp. Drace is close by, waiting.`, `"Help me break him," ${n} says, "and Wenna walks free."`],
    s3: n => [`Wenna is free, and furious, and alive. She wants to keep fighting, now with ${n}'s friends. ${n} wants her to go home to their mother's farm, where it's safe.`, `"You tell her," ${n} says. "She'll listen to you. She never listens to me."`],
    c: [['Tell Wenna to go home. Her sister needs her alive.', 20, `"Thank you," ${'{n}'} says quietly, once Wenna is on the road home. "I couldn't have said it."`], ['Tell Wenna she can make her own choices.', -10, `Wenna grins and runs off to join a different company. {n} doesn't speak to you for an hour.`]] },
  rival: { t1: 'An Old Score', t2: 'The Duel', t3: 'After the Duel',
    s1: n => [`${n} trained with a master-at-arms called Osric Vane, and everything ${n} ever did right, Osric did slightly better. Osric is in town. He's been telling people ${n} only made it this far because of you.`, `"He's right," ${n} says. "That's the worst part. Is he right?"`],
    rival: n => [`Osric Vane`, `Osric Vane, ${n}'s old rival`, 'bladewarden1'],
    s2: n => [`Osric has challenged ${n} to a duel outside town, with seconds. You're ${n}'s second. Osric brought his own, and they're the kind of people who don't follow duelling rules.`, `"If they jump in," ${n} says, "so do you."`],
    s3: n => [`Osric is on the ground, bleeding, and ${n} has the point of a blade at his throat. The whole town is watching.`, `${n} looks at you. "What do I do?"`],
    c: [['Tell them to help Osric up. Win like it was never in doubt.', 20, `{n} offers a hand. Osric takes it, after a long moment. "Same time next year?" he says. {n} laughs, properly, for the first time in days.`], ['Tell them to let Osric crawl home. He earned it.', 5, `Osric limps away to jeers. {n} doesn't look as happy as you'd expect.`]] },
  debt: { t1: 'What Is Owed', t2: 'The Collector', t3: 'Square',
    s1: n => [`${n} owes money. Quite a lot of money, to a moneylender called Mother Grist, from before you met. ${n} has been paying it off a little at a time, and Mother Grist has decided a little isn't enough.`, `"She's sent her collector," ${n} says. "His name is Knuckles. That's not a nickname. That's what he does."`],
    rival: n => [`Knuckles`, `Knuckles, Mother Grist's collector`, 'brute'],
    s2: n => [`Knuckles is waiting on the road with friends. He'd like ${n}'s money or ${n}'s kneecaps, and he's not fussy about which.`, `"I'd rather keep my knees," ${n} says. "I use them constantly."`],
    s3: n => [`Knuckles is down. Mother Grist has sent a letter: the debt still stands, plus interest, plus the cost of a new collector.`, `${n} looks sick. "I could work it off. It'd take years."`],
    c: [['Pay the debt yourself. Friends do that.', 25, `{n} stares at you, then hugs you so hard your ribs creak. "I'll pay you back. I'll pay you back with my life, probably. Several times."`, 'pay'], ['Tell Grist the debt died with her collector.', 10, `Mother Grist, it turns out, takes the point. {n} is free, and a little worried about what you'd have done if she hadn't.`]] },
  home: { t1: 'Letters From Home', t2: 'The Thing in the Fields', t3: 'Staying or Going',
    s1: n => [`${n}'s home village has written: something has been taking sheep from the high fields, and then the shepherds, and the village militia is four farmers and a dog.`, `"I left them to come adventuring," ${n} says. "I always said I'd go back if they needed me."`],
    rival: n => [`The Hollow Hound`, `The Hollow Hound of ${n}'s village`, 'wolf'],
    s2: n => [`The thing in the fields is a hound the size of a cart, with something wrong about its eyes. It's out there now. ${n} wants it dead before nightfall.`, `"For the dog," ${n} says. "The village dog. It was very brave."`],
    s3: n => [`The village is safe, and it's thrown a feast in ${n}'s honour. The elders have asked ${n} to stay and lead the militia.`, `${n} is quiet for a long time. "What do you think I should do?"`],
    c: [['Tell them to stay. Their village needs them more than you do.', -5, `{n} stays a week, and then comes back, sheepish. "They don't need me. They have a new dog. It's terrifying." Something has settled in them, though.`], ['Tell them you need them with you.', 20, `"You do?" {n} says, and looks happier than you've ever seen them. "Then I'm coming. The village will manage."`]] },
  past: { t1: 'A Teacher\'s Grave', t2: 'What Haunts the Grave', t3: 'Rest',
    s1: n => [`${n}'s teacher, Old Mother Aedre, died the winter before you met, and ${n} never went to her grave. Last night ${n} dreamed she was calling, and woke up crying.`, `"It's stupid," ${n} says. "It's a dream. Will you come with me anyway?"`],
    rival: n => [`Aedre's Shade`, `The Shade of Mother Aedre`, 'ghostnpc'],
    s2: n => [`Something is wrong at the grave: Aedre's shade walks there, angry and confused, and it doesn't recognise ${n}. It has to be put to rest.`, `"Gently," ${n} says. "She was the kindest person I ever met. Gently, if we can."`],
    s3: n => [`The shade is gone. ${n} kneels at the grave for a long time. When they stand up, they look at you differently.`, `"She'd have liked you," ${n} says. "She always said I needed someone who'd go to a haunted grave with me."`],
    c: [['Tell them she was right, and you always will.', 20, `{n} smiles, and doesn't say anything, and doesn't need to.`], ['Tell them it was nothing. It\'s what friends do.', 10, `"It's not nothing," {n} says. "But thank you."`]] },
};
// Build 13: your mother or father, rescued from the Frostcrown, has a story of their own
const PR = s => { const p = parent(); return s.replace(/\{rel\}/g, p.rel).replace(/\{she\}/g, p.she).replace(/\{her\}/g, p.her).replace(/\{She\}/g, p.She).replace(/\{Her\}/g, p.Her).replace(/\{you\}/g, S.heroName || 'you'); };
STORIES.parent = { t1: 'Ten Years', t2: 'The Choir\'s Hunter', t3: 'Word From Home',
  s1: n => [PR(`${n} sits by the fire with you, the first night out of the cells, and tells you about the ten years. Not all of it. Enough. The cold, the dark, the other prisoners, the games they played with pebbles to stay sane.`), PR(`"I talked about you every day," ${n} says. "Every single day. They got very tired of hearing about you. I didn't care."`)],
  rival: n => ['Choir-Hunter Vell', 'Choir-Hunter Vell of the Pale Choir', 'cultist2~spectral'],
  s2: n => [PR(`The Pale Choir doesn't let a prisoner go. They've sent a hunter after ${n}: Vell, who brought ${n} north in chains ten years ago and remembers {her} very well.`), PR(`"I'd like to see Vell again," ${n} says, very quietly. "I'd like that very much. With you beside me, this time."`)],
  s3: n => [PR(`Vell is dead. ${n} stands over the body for a long time, then turns away, and is {her}self again. "There," {she} says. "That's done. Now. Does anyone at home know I'm alive?"`), PR(`"Should we write to them? Or should we wait until this is over, and walk in the door together, and give them all a heart attack?"`)],
  c: [['Write home now. They\'ve waited ten years.', 20, `{n} writes for an hour, and seals it, and sends it with the fastest rider in Thawhold. "There," {n} says. "Now we can't die. It'd be very embarrassing after a letter like that."`], ['Wait, and walk in the door together.', 10, `{n} grins. "Oh, I like that. I like that a lot. We'll knock. We'll pretend to be selling something."`]] };
// Build 13: a second book for every story, once Vhorun breaks out and the world gets darker
const BOOK2 = {
  sibling: { t4: 'Wenna\'s Company', t5: 'A Company of Her Own', rival2: n => ['The Hollow Captain', 'The Hollow Captain of the Wound', 'abom~ashen'],
    s4: n => [`Wenna's new company signed on to guard the edge of the Wound. Something came up out of the dark and took half of them. Wenna's letter is three lines long, and the third line is "please."`, `"I told her," ${n} says. "I told her to go home. Come on."`],
    s5: n => [`Wenna is alive, and so are most of her company, and she's decided to start her own. She wants to call it ${n}'s Company.`, `"That's ridiculous," ${n} says, and then turns away so you can't see their face.`] },
  rival: { t4: 'Osric in the Dark', t5: 'A Grave for Osric', rival2: n => ['Osric the Lightless', 'Osric Vane, Lightless', 'bladewarden1~ashen'],
    s4: n => [`Osric Vane went into the March to prove he was better than ${n}. He didn't come out. Not as himself. Something wearing his armour is hunting the roads near you now.`, `"He was an idiot," ${n} says. "He was my idiot. I'll put him down myself."`],
    s5: n => [`Osric is at rest. ${n} wants to bury him somewhere with a view, and carve something on the stone.`, `"What do I put?" ${n} asks. "'He was slightly better than me.' He'd have liked that. He'd have hated that I meant it."`] },
  debt: { t4: 'The Debt-Wraith', t5: 'Ashes', rival2: n => ['The Debt-Wraith', 'The Debt-Wraith of Mother Grist', 'wraith~ashen'],
    s4: n => [`Mother Grist's counting-house went dark when Vhorun passed, and everything in it turned. Her ledgers walk now, collecting. One of them has ${n}'s name in it, in red.`, `"Even the dark wants my money," ${n} says. "I'm almost flattered."`],
    s5: n => [`The ledger is ash. Whatever ${n} owed, to anyone, is gone with it. ${n} keeps patting their pockets, as if something's missing.`, `"I don't know what to do with my hands," ${n} says. "I've been worried about money for eleven years. What do people think about, when they're not worried about money?"`] },
  home: { t4: 'The Village Under Siege', t5: 'A Statue in the Square', rival2: n => ['The Siege-Hound', 'The Siege-Hound of the Lightless', 'wolf~ashen'],
    s4: n => [`Vhorun's host has found ${n}'s village. The militia, four farmers and the new dog, is holding the bridge. ${n} got the letter an hour ago and hasn't stopped moving since.`, `"The hound is leading them," ${n} says. "Kill the hound, and they'll scatter. They always scatter."`],
    s5: n => [`The village is safe again, and it wants to put up a statue of ${n} in the square. ${n} is mortified.`, `"Tell them no," ${n} begs you. "Tell them to put up a statue of the dog."`] },
  past: { t4: 'Aedre\'s Lantern', t5: 'Lit Again', rival2: n => ['The Lantern-Thief', 'The Lantern-Thief', 'wraith~ashen'],
    s4: n => [`${n} has found out something about Mother Aedre: before she taught, she kept a lantern for the Lantern Compact. Her lantern was buried with her. Something that eats lamps has dug it up.`, `"She'd want it back," ${n} says. "She'd want it lit."`],
    s5: n => [`Aedre's lantern is back in ${n}'s hands. It's old, and dented, and it hasn't been lit in twenty years. ${n} looks at you.`, `"Will you light it with me?" ${n} asks.`] },
  parent: { t4: 'What the Choir Wanted', t5: 'Family', rival2: n => ['Sabine\'s Shadow', 'The Shadow of the Choir-Mother', 'queen~spectral'],
    s4: n => [PR(`${n} has told you why {she} went after the Pale Choir ten years ago: the Choir-Mother wanted a child from the Vale, and {she} went to stop her. The Choir-Mother sent her shadow after you both, to finish what she started.`), PR(`"She wanted you," ${n} says. "She always wanted you. I've never told anyone that. I'm telling you now because I'm not afraid of her any more."`)],
    s5: n => [PR(`The shadow is gone. ${n} sits down on a rock, suddenly, as if {her} legs have given out, and laughs, and can't stop laughing.`), PR(`"Ten years," ${n} says. "Ten years I was afraid of her. And you just... you just hit her. Come here. Come here, I need to hug somebody, and it's going to be you."`)] },
};
for (const [k, b] of Object.entries(BOOK2)) Object.assign(STORIES[k], b);
const KEYS = Object.keys(STORIES).filter(k => k !== 'parent');
const slug = n => n.toLowerCase().replace(/[^a-z]/g, '');
const storyOf = n => { const s = F().story[n] = F().story[n] || { together: 0, apart: 0 }; const fk = friends().find(f => f.name === n)?.storyKind; if (fk) s.kind = fk; if (!s.kind) { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) | 0; s.kind = KEYS[(h >>> 0) % KEYS.length]; } return s; };
const qxL = f => Math.round(xpNeed(Math.min(S.hero?.lvl || 1, 29)) * f * .5);
function ensureQuests(fr) {
  const n = fr.name, sl = slug(n), st = storyOf(n), T = STORIES[st.kind], g = 'friend_' + sl;
  if (QUESTS.some(q => q.id === `fs_${sl}_1`)) { ensureBook2(fr); return; }
  GIVERS[g] = { name: n, title: 'Your friend', model: CLASSES[fr.cls]?.models[1] || 'villager1' };
  const rk = 'fsr_' + sl, [rn, rfull, rkind] = T.rival(n);
  MOBS[rk] = boss(rfull, rkind, { hpM: 1.4, mechs: ['cleave', 'charge', 'call'], adds: 'roadraider', lines: { start: `${rn} has been expecting you.`, half: 'Is that all?' } });
  const base = { giver: g, turnTo: g, friendQ: n, get lvl() { return S.hero?.lvl || 1; }, get gold() { return 10 + (S.hero?.lvl || 1) * 4; } };
  QUESTS.push(
    { ...base, id: `fs_${sl}_1`, name: `${n}: ${T.t1}`, text: T.s1(n).join(' '), say: T.s1(n), obj: { talk: true, what: `Hear ${n} out` }, get xp() { return qxL(.2); }, done: [`"Thank you for listening," ${n} says.`], fstep: 1 },
    { ...base, id: `fs_${sl}_2`, pre: `fs_${sl}_1`, name: `${n}: ${T.t2}`, text: T.s2(n).join(' '), say: T.s2(n), obj: { named: rk, n: 1, what: `Defeat ${rfull} with ${n}` }, get xp() { return qxL(.6); }, done: [`${n} lets out a long breath. "We did it."`], fstep: 2 },
    { ...base, id: `fs_${sl}_3`, pre: `fs_${sl}_2`, name: `${n}: ${T.t3}`, text: T.s3(n).join(' '), say: T.s3(n), obj: { talk: true, what: `Help ${n} decide` }, get xp() { return qxL(.4); }, done: [''], fstep: 3 },
  );
  ensureBook2(fr);
}
// Build 13: the second book, chapters four and five, from level 30
const book2Ready = () => (S.hero?.lvl || 0) >= 30 && S.quests.xv1?.state === 'turned';
function ensureBook2(fr) {
  const n = fr.name, sl = slug(n), T = STORIES[storyOf(n).kind], g = 'friend_' + sl;
  if (!T.t4 || QUESTS.some(q => q.id === `fs_${sl}_4`)) return;
  const rk = 'fsr2_' + sl, [rn, rfull, rkind] = T.rival2(n);
  MOBS[rk] = boss(rfull, rkind, { hpM: 1.6, mechs: ['cleave', 'pool', 'call', 'enrage'], adds: 'lightless', lines: { start: `${rn} has been waiting for you both.`, half: 'You should have stayed in the light.' } });
  const base = { giver: g, turnTo: g, friendQ: n, get lvl() { return S.hero?.lvl || 1; }, get gold() { return 20 + (S.hero?.lvl || 1) * 6; } };
  QUESTS.push(
    { ...base, id: `fs_${sl}_4`, pre: `fs_${sl}_3`, name: `${n}: ${T.t4}`, text: T.s4(n).join(' '), say: T.s4(n), obj: { named: rk, n: 1, what: `Defeat ${rfull} with ${n}` }, get xp() { return qxL(.7); }, done: [`${n} wipes their face. "Thank you. I couldn't have done that alone."`], fstep: 4 },
    { ...base, id: `fs_${sl}_5`, pre: `fs_${sl}_4`, name: `${n}: ${T.t5}`, text: T.s5(n).join(' '), say: T.s5(n), obj: { talk: true, what: `Be there for ${n}` }, get xp() { return qxL(.4); }, done: [''], fstep: 5 },
  );
}
// the rival appears near you when the time comes (outside towns and instances)
function spawnRival(n, step = 2) {
  const sl = slug(n), rk = (step === 4 ? 'fsr2_' : 'fsr_') + sl; if (S.ents.some(e => e.mob === rk && !e.dead) || INSTANCES[S.zone]) return;
  const h = S.hero, a = rnd(0, TAU), x = h.x + Math.cos(a) * 35, z = h.z + Math.sin(a) * 35;
  const m = Cb.makeMob(rk, h.lvl + 1, { x, z, home: { x, z }, named: rk, boss2: true }); m.y = hgt(x, z); m.huntHero = true;
  world.places.push({ name: MOBS[rk].name, x, z, R: 6, kind: 'place' });
  chat('sys', null, `${MOBS[rk].name} is close. ${n} has seen them.`);
}
X.accept.push(q => { if (q.friendQ && (q.fstep === 2 || q.fstep === 4)) spawnRival(q.friendQ, q.fstep); });
X.zone.push(() => { for (const fr of friends()) for (const st of [2, 4]) { const q = S.quests[`fs_${slug(fr.name)}_${st}`]; if (q?.state === 'active') setTimeout(() => spawnRival(fr.name, st), 3000); } });
export function storyNext(n) {
  const fr = friends().find(f => f.name === n); if (!fr) return null; ensureQuests(fr);
  const sl = slug(n); for (const i of [1, 2, 3, 4, 5]) { const q = QUESTS.find(x => x.id === `fs_${sl}_${i}`); if (!q) return null; const st = S.quests[q.id]?.state; if (st !== 'turned') { if (i >= 4 && !st && !book2Ready()) return { q, i, state: null, wait: true }; return { q, i, state: st || null }; } }
  return null;
}
export function storyGo(n, choice) {
  const s = storyNext(n); if (!s) return; const { q, i, state } = s, T = STORIES[storyOf(n).kind];
  if (i > 1 && (S.hero?.lvl || 1) < 10) return 'Not yet. Level 10.';
  if (s.wait) return 'Their story goes on, once the world gets darker. Level 30.';
  if (i === 5 && state === 'done') { Game.turnIn(q); bump(n, 15, 'you were there'); chat('sys', null, T.s5(n)[T.s5(n).length - 1]); return null; }
  if (!inParty(n)) return `${n} needs to be with you for this.`;
  if (!state) { Game.acceptQuest(q); chat('party', n, q.say[q.say.length - 1].replace(/^"|"$/g, '')); return null; }
  if (state !== 'done') return null;
  if (i === 3) {
    const c = choice === 'love' ? null : T.c[choice ?? 0];
    if (c?.[3] === 'pay') { const cost = 200 + S.hero.lvl * 30; if (S.gold < cost) return `That's ${cost} gold you don't have.`; S.gold -= cost; }
    Game.turnIn(q);
    if (choice === 'love') { F().romance = n; bump(n, 25, 'you told them how you feel'); chat('party', n, pick(["Oh. Oh. I've been hoping you'd say that since the first time you dragged me out of a crypt.", "I... yes. Yes. Me too. Don't look at me like that, I'm blushing.", "You picked a haunted battlefield to tell me? That's the most us thing that's ever happened."])); }
    else { bump(n, c[1], 'your choice'); chat('sys', null, c[2].replace(/\{n\}/g, n)); }
    return null;
  }
  Game.turnIn(q); bump(n, i === 2 ? 10 : 5); return null;
}
export function endRomance() { const n = F().romance; if (!n) return; F().romance = null; bump(n, -30, 'you ended it'); chat('party', n, pick(["I see. I'll... I'll be fine. Let's just fight things for a while.", "Right. Okay. I'm going to go and hit something very hard."])); }

// ---------- romance and rivalry among the others ----------
const LOVE = [["{a} and {b} have been sharing a tent. Nobody is saying anything. Everybody knows.", 'love'], ["{a} has started saving {b} the best bits of every stew.", 'love'], ["{a} wrote {b} a song. It's terrible. {b} loved it.", 'love']];
const FEUD = [["{a} and {b} had a shouting match about who pulled that last pack. It was {a}. Or {b}. It depends who you ask.", 'feud'], ["{b} 'borrowed' {a}'s good boots and returned them full of mud. {a} is not over it.", 'feud'], ["{a} called {b}'s battle cry 'embarrassing' in front of everybody.", 'feud']];
function events() {
  const f = F(); if (S.time < f.nextEvent) return; f.nextEvent = S.time + rnd(1200, 2400);
  const fs = friends().filter(fr => !F().left[fr.name]); if (!fs.length) return;
  const a = pick(fs), others = [...fs.filter(x => x !== a).map(x => x.name), ...(S.fakes || []).filter(x => x.fake && !x.fake.bff).slice(0, 6).map(x => x.name)].filter(x => x !== F().romance || a.name !== x);
  const b = pick(others); if (!b) return;
  if (f.pairs.some(p => (p.a === a.name && p.b === b) || (p.b === a.name && p.a === b))) return;
  const [txt, kind] = pick(Math.random() < .5 ? LOVE : FEUD), line = txt.replace(/\{a\}/g, a.name).replace(/\{b\}/g, b);
  if (kind === 'love' && F().romance === a.name) return;   // spoken for
  f.pairs.push({ a: a.name, b, kind, t: Date.now(), settled: false }); f.gossip.unshift(line); f.gossip = f.gossip.slice(0, 8);
  chat('party', pick([a.name, ...fs.filter(x => x !== a).map(x => x.name)]), kind === 'love' ? pick(['Has anyone else noticed...?', 'Am I the only one who sees it?', 'I\'m just saying, they\'re very cosy.']) : pick(['Oh, here we go again.', 'Can you two not?', 'I am not taking sides. I am taking cover.']));
  chat('sys', null, line);
}
// couples fight better side by side; feuding friends don't, until you settle it
{ const prev = X.acctOf; X.acctOf = e => { const a = prev ? prev(e) : {}; if (!e?.fake) return a; let k = 0; for (const p of F().pairs) { const other = p.a === e.name ? p.b : p.b === e.name ? p.a : null; if (!other || !inParty(other)) continue; if (p.kind === 'love') k += .03; else if (!p.settled) k -= .03; } if (!k) return a; return { ...a, powP: (a.powP || 0) + k }; }; }
export function settle(p, side) { p.settled = true; if (side === 'a') { bump(p.a, 6); if (friends().some(f => f.name === p.b)) bump(p.b, -6); } else if (side === 'b') { if (friends().some(f => f.name === p.b)) bump(p.b, 6); bump(p.a, -6); } else { bump(p.a, 2); if (friends().some(f => f.name === p.b)) bump(p.b, 2); }
  chat('sys', null, side ? `You take ${side === 'a' ? p.a : p.b}'s side. The other one sulks, but it's settled.` : `You sit them both down and make them shake hands. It's awkward. It works.`); }

// ---------- the Friends page ----------
X.book.push(['friends', 'Friends', body => {
  const { el, esc, toast, refreshSheet } = X.ui, f = F();
  for (const fr of friends()) {
    const n = fr.name, v = loyal(n), s = storyNext(n), love = f.romance === n;
    let act = '';
    if (s) { const T = STORIES[storyOf(n).kind];
      if (s.wait) act = '<small>Their story goes on, at level 30, once the world gets darker.</small>';
      else if (!s.state) act = `<button data-a="go">${esc(s.q.name.split(': ')[1])}</button>`;
      else if (s.state === 'done' && s.i !== 3) act = `<button data-a="go">Finish: ${esc(s.q.name.split(': ')[1])}</button>`;
      else if (s.state === 'done') act = T.c.map((c, i) => `<button data-a="c${i}">${esc(c[0])}</button>`).join('') + (!f.romance && v >= 60 ? `<button data-a="love">Tell ${esc(n)} how you feel</button>` : '');
      else act = `<small>${esc(s.q.obj.what)}</small>`; }
    else act = '<small>Their story is told.</small>';
    const today = new Date().toDateString();
    const c = el(`<div class="card" style="text-align:left"><h3>${esc(n)}${love ? ' ❤️' : ''} <small>${esc(CLASSES[fr.cls]?.name || '')}</small></h3><p style="font-size:13px;margin:2px 0">${loyaltyName(v)} · loyalty ${v}/100${v >= 75 ? ` · fights ${v >= 90 ? '10' : '5'}% harder for you` : ''}</p><div class="acts">${act}<button data-a="drink" ${f.drink[n] === today ? 'disabled' : ''}>Buy them a drink</button>${love ? '<button data-a="end">Part ways</button>' : ''}</div></div>`);
    c.onclick = ev => { const a = ev.target.closest('button')?.dataset.a; if (!a) return; let m = null;
      if (a === 'go') m = storyGo(n); else if (a.startsWith('c')) m = storyGo(n, +a.slice(1)); else if (a === 'love') m = storyGo(n, 'love');
      else if (a === 'drink') { const cost = 5 + S.hero.lvl; if (S.gold < cost) m = 'Not enough gold.'; else { S.gold -= cost; f.drink[n] = today; bump(n, 3); chat('party', n, pick(['Cheers!', 'You\'re buying? You\'re buying. Lovely.', 'To us. And to not dying today.'])); } }
      else if (a === 'end') endRomance();
      if (m) toast(m); refreshSheet(); };
    body.appendChild(c);
  }
  for (const [n, l] of Object.entries(f.left)) { const c = el(`<div class="card" style="text-align:left"><h3>${esc(n)} <small>gone</small></h3><p style="font-size:13px">${esc(n)} left you. A letter, a gift and a courier might bring them back.</p><div class="acts"><button>Write to ${esc(n)}</button></div></div>`);
    c.querySelector('button').onclick = () => { const m = writeTo(n); if (m) toast(m); refreshSheet(); }; body.appendChild(c); }
  const open = f.pairs.filter(p => p.kind === 'feud' && !p.settled);
  if (open.length || f.gossip.length) {
    const g = el(`<div class="card" style="text-align:left"><h3>Gossip</h3>${f.gossip.slice(0, 5).map(x => `<p style="font-size:13px;margin:2px 0">${esc(x)}</p>`).join('')}</div>`);
    for (const p of open) { const r = el(`<div class="acts"><button data-s="a">Side with ${esc(p.a)}</button><button data-s="b">Side with ${esc(p.b)}</button><button data-s="">Make them shake hands</button></div>`); r.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; settle(p, b.dataset.s || null); refreshSheet(); }; g.appendChild(r); }
    body.appendChild(g);
  }
}, () => (S.friends || []).length > 0 || Object.keys(S.ext?.fr?.left || {}).length > 0]);
// story quests exist from the start (so the quest log can show them after a reload)
const madeQ = new Set();
const ensureAll = () => { for (const fr of friends()) if (!madeQ.has(fr.name)) { madeQ.add(fr.name); ensureQuests(fr); } };
X.tick.push(ensureAll); X.zone.unshift(ensureAll);
