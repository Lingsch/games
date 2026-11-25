// Build 4.3: your group talks. Companions comment on quests and story moments, and answer when you talk to them.
import { S, chat, pick, rnd, dist } from './core.js';
import { world } from './world.js';
import { QUESTS, GIVERS, MOBS, CLASSES } from './data.js';
import * as Cb from './combat.js';

let G = null;
export function bindGame(g) { G = g; }
const mates = () => S.party.filter(p => !p.isHero && !p.dead);
const friendFirst = () => { const m = mates(); return [...m.filter(p => p.fake?.bff), ...m.filter(p => !p.fake?.bff)]; };
const who = () => { const m = friendFirst(); return m.length ? (Math.random() < .7 ? m[0] : pick(m)) : null; };
// replies arrive a moment later, one after another, like people typing
function say(p, text, delay = rnd(.8, 1.8), act) { if (!p) return; S.banterQ = S.banterQ || []; const last = S.banterQ.length ? S.banterQ[S.banterQ.length - 1].t : S.time; S.banterQ.push({ t: Math.max(S.time + delay, last + .7), p, text, act }); }
export function tick() {
  const q = S.banterQ; if (!q || !q.length) return;
  while (q.length && q[0].t <= S.time) { const b = q.shift(); if (b.p.dead || !S.party.includes(b.p)) continue; chat('party', b.p.name, G.fill(b.text)); if (b.act) b.act(); }
}
const gname = k => GIVERS[k]?.name || 'them';

// ---------------- comments on quests ----------------
const ACCEPT = {
  m1: 'Empty graves? That is not creepy at all. I am going to stand very close to you for this one.',
  m2: "Drag marks. Wonderful. I've always wanted to follow drag marks into the dark.",
  m3: "Off to the Watch, then. Let's hope the Warden is in a good mood.",
  m4: 'Brigands with shovels. Somehow that is worse than brigands with swords.',
  m5: 'Paid in bone coins? Who pays people in bones? Actually, never mind. I think I know.',
  m6: "A cult. Of course there's a cult. There's always a cult.",
  m7: 'Little Hollin! My aunt lived there. She made a truly terrible turnip pie.',
  m8: "A man who rings a bell at midnight to wake the dead. Let's go and have a word with him.",
  m9: "The Gravelord. I thought he was just a story they told to scare children.",
  m10: "A grumpy hermit in a tower. Should we bring jam? Maren says he likes jam.",
  m11: 'Cultists pestering an old man in his own home. That is just rude.',
  m12: "A deacon who carries letters. Let's go and read his mail.",
  q8: 'The Ossuary. Everybody check your gear, and maybe your will.',
  q9: "This is it. Healers, stay behind the tank. Everyone else, please try not to die.",
  m16: "The coast! I've always wanted to see the sea. Do you think there are crabs? I hope there are crabs.",
  h1: 'Angry ghosts in a turnip field. Just another day in the Vale.',
  h3: 'A ghost who still works for a living. That is the most dedicated miller I have ever heard of.',
  h4: "A boar the size of a hay cart. I'll be honest with you, I'm a little excited.",
  h6: "Ringing bells to annoy the dead. I didn't know that was a job, but I'd like to apply.",
  h9: "If I never hear that Choir sing again, it will be too soon. Let's finish this.",
  t1: "Harpies who only steal left socks. I have so many questions, and I'm afraid to ask any of them.",
  t3: "A giant made of other giants? I'd like to go on record as saying I don't like that at all.",
  c13: "The Admiral. This is the big one. Everybody eat something first. I mean it.",
};
const ACCEPT_ANY = ['Sounds like a plan to me.', "Let's go and get it done.", 'Another job for the heroes, I suppose. Lead the way!', "I'm with you. Where to first?", 'Right behind you.'];
const DONE_ANY = ["That's the lot. Shall we head back to {g}?", 'All done! {g} is going to be very pleased with us.', "That's finished. Back to {g}, then, and maybe a nice sit down.", 'Done and dusted. Let\'s go and collect our reward from {g}.'];
const TURN = {
  m3: q => S.flags.wick === 'praised' ? "That was nice of you, sticking up for Wick. He'll be talking about it for weeks." : null,
  m8: q => S.flags.ansel === 'free' ? "That was kind of you, letting him go. I hope he means it." : "Fair's fair. The Watch will give him a proper hearing.",
  m13: q => S.flags.corwin === 'trust' ? "I'm glad you trusted him. I think he's needed somebody to, for about a hundred years." : 'That was a hard call. I think it was the right one, though.',
  h5: q => S.flags.haskett === 'rest' ? "Rest well, Haskett. I'm going to miss that terrible miller's joke." : 'Free bread forever! That might be the best reward we ever get.',
  q9: q => "Did everybody else see his face up there? I'm going to have nightmares for a week.",
  m16: q => "Wick is coming with us? Good. He makes me feel brave by comparison.",
};
export function onQuest(type, q) {
  const p = who(); if (!p) return;
  if (type === 'accept') { if (Math.random() < (ACCEPT[q.id] ? 1 : .45)) say(p, ACCEPT[q.id] || pick(ACCEPT_ANY)); }
  if (type === 'done') { if (q.obj.talk) return; say(p, pick(DONE_ANY).replace('{g}', gname(q.turnTo || q.giver)), rnd(1, 2)); }
  if (type === 'turnin') { const f = TURN[q.id]; const line = f && f(q); if (line) say(p, line, rnd(1.2, 2.2)); else if (Math.random() < .3) say(p, pick(['Nice work, everyone.', 'Easy money!', "I could get used to being thanked.", 'Another one for the history books.']), rnd(1, 2)); }
}
export function onScene(id) {
  const p = who(); if (!p) return;
  const L = { drag: "So they lead to the Ossuary. Of course they do. Nothing good ever leads anywhere else.", hollin: 'Is it just me, or is that ghost waving at us?', apprentice: "Well. I didn't see that coming. Did you see that coming?", gravelord: 'Did that skeleton just talk to us? And was he being polite? I think that might be worse.' }[id];
  if (L) say(p, L, rnd(1, 2));
}

// ---------------- answering you ----------------
const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
function whereIs(x, z) {
  const h = S.hero, dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz);
  if (d < 18) return 'right around here';
  const a = (Math.atan2(dx, -dz) * 180 / Math.PI + 360 + 22.5) % 360;
  const paces = d < 60 ? 'a short walk' : d < 150 ? `about ${Math.round(d / 10) * 10} paces` : 'a fair walk';
  return `${paces} to the ${DIRS[Math.floor(a / 45)]}`;
}
function placeName(x, z) { const p = (world.places || []).find(p => Math.hypot(x - p.x, z - p.z) < p.R + 15); return p ? ` near ${p.name}` : ''; }
// what the group thinks you should do next
function advice() {
  const act = QUESTS.filter(q => S.quests[q.id] && S.quests[q.id].state !== 'turned').sort((a, b) => (b.story ? 1 : 0) - (a.story ? 1 : 0));
  const done = act.find(q => S.quests[q.id].state === 'done');
  if (done) {
    const k = done.turnTo || done.giver, n = S.npcs?.[k];
    return n ? `We should go and see ${gname(k)} about "${done.name}". ${cap(whereIs(n.x, n.z))}.` : `We should go and see ${gname(k)} about "${done.name}". They're not in this zone, though.`;
  }
  const q = act[0];
  if (!q) {
    const offers = Object.keys(S.npcs || {}).filter(k => GIVERS[k] && G.nextOffer(k)).map(k => [k, G.nextOffer(k)]).sort((a, b) => (b[1].story ? 1 : 0) - (a[1].story ? 1 : 0) || a[1].lvl - b[1].lvl);
    if (offers.length) { const [k, q] = offers[0], n = S.npcs[k]; return `I think ${gname(k)} has ${q.story ? 'something important' : 'some work'} for us. ${cap(whereIs(n.x, n.z))}.`; }
    return "I'm out of ideas, honestly. We could go and hunt something our level, or try a different class for a while.";
  }
  const o = q.obj, st = S.quests[q.id], left = (o.n || 1) - (st.n || 0);
  if (o.at) { const s = world.spots?.[o.at]; return s ? `For "${q.name}", we need to get to the right spot. It's ${whereIs(s.x, s.z)}.` : `For "${q.name}", we need to travel somewhere. Check the quest log.`; }
  if (o.inspect) { const pr = S.ents.filter(e => e.prop && !e.remove && G.inspectLabel(e) && e.prop.tag === o.inspect).sort((a, b) => dist(a, S.hero) - dist(b, S.hero))[0]; return pr ? `For "${q.name}", there's one ${whereIs(pr.x, pr.z)}. ${left} to go.` : `For "${q.name}", we still have ${left} to find.`; }
  if (o.named) { const m = S.ents.find(e => e.named === o.named && !e.dead) || world.spawns.find(s => s.named === o.named); const nm = world.names?.[o.named] || MOBS[o.named]?.name; return m ? `${nm} should be ${whereIs(m.x, m.z)}${placeName(m.x, m.z)}. Let's go and find them.` : `I'm not sure where ${nm} is. We may need to look around.`; }
  if (o.ask) { const asked = st.asked || []; const k = o.ask.find(x => !asked.includes(x)); const n = k && S.ents.find(e => !e.dead && !e.remove && (e.giver === k || (k.startsWith('vendor:') && e.vendor === k.slice(7)))); return n ? `For "${q.name}", we still need to talk to ${n.name}. ${cap(whereIs(n.x, n.z))}.` : `For "${q.name}", we still have people to question. Check the quest log.`; }
  if (o.bosses) { const got = st.got || []; const b = S.ents.find(e => o.bosses.includes(e.named) && !got.includes(e.named) && !e.dead); return b ? `${b.name} is still standing, ${whereIs(b.x, b.z)}.` : q.where && world.spots?.[q.where] ? `For "${q.name}", we have to go down into the dungeon. The way in is ${whereIs(world.spots[q.where].x, world.spots[q.where].z)}.` : `For "${q.name}", there are still bosses to beat.`; }
  if (o.anyMin) return `For "${q.name}", anything level ${o.anyMin} or higher will do. ${left} to go.`;
  if (q.where && world.spots?.[q.where] && world.zone === 'vale') return `For "${q.name}", we have to go down into the dungeon. The way in is ${whereIs(world.spots[q.where].x, world.spots[q.where].z)}.`;
  const keys = o.kill || o.collect || [];
  const m = S.ents.filter(e => e.mob && !e.dead && keys.includes(e.mob) && !e.named).sort((a, b) => dist(a, S.hero) - dist(b, S.hero))[0];
  const what = o.collect ? `${left} more ${o.item}` : `${left} more ${MOBS[keys[0]]?.name || 'of them'}${left > 1 ? 's' : ''}`;
  return m ? `We need ${what} for "${q.name}". The nearest is ${whereIs(m.x, m.z)}${placeName(m.x, m.z)}.` : `We need ${what} for "${q.name}", but I can't see any about. They'll be back soon.`;
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pct = (a, b) => Math.round(a / Math.max(1, b) * 100);
const JOKES = [
  "Why don't skeletons ever fight each other? They don't have the guts.",
  'How does a necromancer start a letter? "To whom it may concern, and also to whom it may no longer concern."',
  "What's a ghost's favorite room? The living room. They're very nostalgic about it.",
  "I told Wick a joke about graves once. He said it was a bit too close to home.",
  "Why did the lich refuse to go to the party? He had no body to go with.",
];
const INTENTS = [
  [/\b(hi|hello|hey|hiya|yo|greetings|morning|evening|sup)\b/, () => { const m = friendFirst().slice(0, 2); m.forEach((p, i) => say(p, pick([`Hey, ${S.heroName}!`, 'Hello there!', 'Hi! Good to see you.', `Morning, ${S.heroName}.`, "Hey! What's the plan?"]), i ? rnd(1.6, 2.6) : undefined)); }],
  [/how (are|r|is) (you|u|ya|everyone|everybody|we|it going)|how'?s everyone|you (ok|okay|alright)|everyone (ok|okay|good)/, () => { for (const p of friendFirst().slice(0, 3)) { const hp = pct(p.hp, p.maxHp), mp = p.resType === 'mana' ? pct(p.res, p.resMax) : 100; say(p, hp < 50 ? `Honestly, I'm a bit battered. ${hp}% health.` : mp < 40 ? `I'm fine, but I'm low on mana. Give me a minute to sit.` : pick(["I'm good! Ready for anything.", 'Doing great, thanks for asking.', "Never better. Well, I'm a bit hungry.", 'All good here!'])); } }],
  [/\b(ready|rdy)\b/, () => { for (const p of friendFirst()) { const hp = pct(p.hp, p.maxHp), mp = p.resType === 'mana' ? pct(p.res, p.resMax) : 100; say(p, hp > 80 && mp > 60 ? pick(['Ready!', 'Ready when you are.', 'Good to go.', 'Ready.']) : `Not quite. I'm at ${hp}% health${p.resType === 'mana' ? ` and ${mp}% mana` : ''}. Give me a moment.`); } }],
  [/\b(rest|med|meditate|sit|break|recover)\b/, () => { for (const p of friendFirst()) { if (!Cb.inCombat(p)) p.sit = true; say(p, pick(['Sitting down for a bit.', "Good idea. My feet are killing me.", 'Resting up.', 'Taking a breather.'])); } }],
  [/\bfollow\b|come (on|here|with)|with me|this way|let'?s go/, () => { G.partyCommand('follow'); say(who(), pick(['Right behind you.', 'Lead the way!', 'Following.', "We're with you."])); }],
  [/\b(wait|hold|stay|stop|hang on)\b/, () => { G.partyCommand('hold'); say(who(), pick(["We'll wait right here.", 'Holding.', 'Staying put.', "Take your time, we're not going anywhere."])); }],
  [/\b(attack|assist|focus|kill (it|that|this)|on my target|help me)\b/, () => { G.partyCommand('assist'); say(who(), pick(["On your target!", 'Attacking!', "Got it, we'll hit what you hit.", 'Focusing your target.'])); }],
  [/\bpull\b/, () => G.partyCommand('pull')],
  [/\bclear\b/, () => G.partyCommand('clear')],
  [/\bheal|need (heals|healing|a heal)|i'?m (dying|hurt|low)/, () => {
    const hl = friendFirst().find(p => CLASSES[p.cls].role === 'healer' || p.cls === 'druid');
    if (!hl) { say(who(), "None of us can heal, I'm afraid. Drink a potion!"); return; }
    if (hl.resType === 'mana' && hl.res < hl.resMax * .15) { say(hl, "I'm almost out of mana! Drink a potion and I'll sit down for a moment."); return; }
    say(hl, pick(['Heals incoming!', 'Hold still, I have you.', "I've got you!"]), .4, () => { if (hl.resType === 'mana') hl.res -= hl.resMax * .12; Cb.heal(hl, S.hero, hl.power * 3); });
  }],
  [/\bbuff/, () => { const any = friendFirst(); say(any[0], pick(['Buffs coming up!', 'Hold still, buffing.', "Here, you'll want these."]), .5, () => { for (const p of mates()) { p.buffT = 0; G.forceBuffs?.(p); } }); }],
  [/\b(thanks|thank you|ty|thx|cheers)\b/, () => say(who(), pick(['Any time!', 'No problem at all.', "That's what friends are for.", 'Happy to help.', 'You would do the same for us.']))],
  [/\bjoke\b|make me laugh|something funny/, () => say(who(), pick(JOKES))],
  [/\b(gg|good job|well done|nice (work|one|job)|great job)\b/, () => { for (const p of friendFirst().slice(0, 2)) say(p, pick(['gg!', 'Nice work, everyone.', 'We make a good team.', 'Too easy!'])); }],
  [/\b(lol|haha|lmao|hehe)\b/, () => say(who(), pick(['Ha!', 'lol', 'Hehe.', "I'm glad someone's having fun."]))],
  [/what level|your level|\blvl\b/, () => { for (const p of friendFirst()) say(p, `I'm level ${p.lvl}.`); }],
  [/who are you|what class|your class|what do you (play|do)|introduce/, () => { for (const p of friendFirst()) { const C = CLASSES[p.cls]; say(p, `I'm ${p.name}, a level ${p.lvl} ${C.name}. ${{ tank: "I keep the monsters looking at me instead of you.", healer: 'I keep everyone alive, mostly.', dps: 'I make things fall over.' }[C.role]}`); } }],
  [/(what|where).*(next|now|go|do)|any (ideas|plans)|what'?s the plan|\bquest\b|where (are|is) (they|it|the)/, () => say(who(), advice())],
  [/\b(brb|afk|bye|good ?night|gn|later)\b/, () => say(who(), pick(["Take your time, we'll be here.", 'See you soon!', "Don't be long!", 'kk']))],
  [/\b(sorry|my bad|oops)\b/, () => say(who(), pick(["Don't worry about it.", 'Happens to the best of us.', "No harm done. Well, a little harm. But we're fine."]))],
  [/\b(love|like) (you|this|this game|this group)\b/, () => say(who(), pick(['Aww. We like you too.', 'This group is the best, honestly.', "Don't get sentimental on me now, we've got monsters to fight."]))],
];
export function partySay(text) {
  const t = String(text).trim().slice(0, 140); if (!t) return;
  chat('party', S.heroName, t);
  if (!mates().length) { chat('sys', null, 'Nobody is in your group to hear you. Invite someone first.'); return; }
  const low = t.toLowerCase();
  const hit = INTENTS.find(([re]) => re.test(low));
  if (hit) { S.quietCmd = true; try { hit[1](); } finally { S.quietCmd = false; } } else say(who(), pick(["Not sure what you mean, but I'm with you.", 'Huh? Say that again?', "I didn't quite catch that. Want to try 'what's next?'", "Sure thing. I think. What was the question?"]));
}
export const QUICK = ['Hello!', "How's everyone doing?", "What's next?", 'Ready?', "Let's rest a minute.", 'Follow me.', 'Wait here.', 'Heal me!', 'Buff me, please.', 'Who are you?', 'Tell me a joke.', 'Thanks, everyone!'];
