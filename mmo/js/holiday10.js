// Build 10: holidays. Four festivals take turns, three days each, by the real calendar: the Midsummer Fair,
// the Day of the Dead, the Harvest Festival and Winter's Eve. While one is on, every town is decorated, a
// festival host in each town has work for you (two quests per festival and a daily), a festival boss can be
// challenged once a day, and festival tokens buy a title, a mount, furniture and a dye that are only sold then.
import { S, X, chat, pick, rnd, TAU, dist } from './core.js';
import { QUESTS, MOBS, GIVERS } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt } from './world.js';
import { build, P, T, Box, Cyl, Sph, Cone, Oct, Tor } from './models.js';
import { addKinds } from './render.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as Loot5 from './loot5.js';
import { boss, qx, qg } from './hi9.js';
import { FURN } from './house10.js';
import { DYES } from './look10.js';
const O = [0, 0, 0], STILL = [0, 0, 0, 0];

// ---------- the four festivals ----------
export const FESTS = {
  midsummer: { name: 'The Midsummer Fair', host: 'Fairmaster Jolly Penhallow', hostModel: 'bard1', token: 'Fair Ribbon', icon: '🎀', deco: ['maypole', 'bunting', 'bonfire'], game: 'bonfire', gameVerb: 'Leap the bonfire',
    treat: 'Honey Cake', bossKey: 'wickerman', dye: ['sunflower', 'Sunflower', '#ffd23a'], furn: ['f_maypole', 'Maypole', 'maypole'], mount: ['mount_fair', 'Ribboned Pony'], title: ['title_fair', 'the Merrymaker'],
    greet: "Roll up, roll up! Cakes, ribbons, leaping over fires that are definitely a safe distance from the hay! It's Midsummer, friend. Even heroes are allowed to enjoy themselves.",
    q1: ['Ribbons for the Pole', "Every year somebody steals the maypole ribbons, and every year it's a different creature. This year it's everything. Every beast and bandit in the land has a scrap of ribbon in its fur. Bring me eight.", 'Midsummer Ribbon'],
    q2: ['A Cake for the Steward', "Pell the housing steward hasn't taken a day off in eleven years. Take him a honey cake and tell him it's from the fair. Tell him it's mandatory.", "Pell looks at the honey cake for a long time. \"Mandatory?\" he says. \"Well. If it's mandatory.\" He eats it in two bites and goes back to his ledger, humming."],
    daily: ['Over the Flames', "Three bonfires in town, and tradition says you leap all three before sundown for luck. I've never seen anybody's luck change. I've seen a lot of singed trousers."],
    bossSay: "Somebody built the Wicker Man too big this year, and somebody else lit it too early, and now it's walking. It'll be on the edge of town if you're feeling brave." },
  dead: { name: 'The Day of the Dead', host: 'Grandmother Osk', hostModel: 'cleric2', token: 'Marigold', icon: '🌼', deco: ['gravecandle', 'marigolds', 'skullpost'], game: 'gravecandle', gameVerb: 'Light the candle',
    treat: 'Sugar Skull', bossKey: 'bonepiper', dye: ['marigold', 'Marigold', '#ff8a1a'], furn: ['f_altar', 'Altar of Remembrance', 'altar'], mount: ['mount_dead', 'Bone-White Mare'], title: ['title_dead', 'the Remembered'],
    greet: "Today we set a place at the table for everyone who isn't here any more. We light their candles, we tell their stories, and we eat far too much sugar. Sit with me a while.",
    q1: ['Candles for the Forgotten', "There are dead nobody remembers, dear. Their candles go out first. The restless things out there are carrying grave-wax from the old barrows; bring me eight pieces, and I'll make candles for the ones with no one left to light them.", 'Grave-Wax'],
    q2: ['A Sugar Skull for Pell', "Pell the steward lost his mother last winter, and he hasn't said a word about it to anyone. Take him this sugar skull. Don't say anything clever. Just give it to him.", 'Pell turns the sugar skull over in his hands. "She used to make these," he says, quietly. "Thank you." He puts it on his desk, beside the ledger, where he can see it.'],
    daily: ['Light Them All', "Three candles in town keep going out, and every one of them is somebody's grandmother. Light them again for me, would you? My knees aren't what they were."],
    bossSay: "Every year the Bone Piper comes to the edge of town and plays, and every year some fool follows him into the dark. Go and break his pipes, and bring the fool home." },
  harvest: { name: 'The Harvest Festival', host: 'Old Reeve Barleycorn', hostModel: 'druid1', token: 'Golden Ear', icon: '🌾', deco: ['pumpkins', 'haybale', 'cornstook'], game: 'pumpkins', gameVerb: 'Judge the pumpkin',
    treat: 'Harvest Pie', bossKey: 'scarecrowking', dye: ['wheat', 'Wheat', '#d8b86a'], furn: ['f_cornucopia', 'Cornucopia', 'cornucopia'], mount: ['mount_harvest', 'Harvest Ox'], title: ['title_harvest', 'the Bountiful'],
    greet: "Good harvest this year, the best in a decade. Tables full, barns full, bellies full. So naturally something's gone wrong. Something always goes wrong at the harvest.",
    q1: ['Gleaning', "Every creature in the land has been raiding the fields. Every one. They've got grain in their teeth. Bring back eight sheaves they've taken and we'll call it gleaning.", 'Stolen Sheaf'],
    q2: ['Pie for the Steward', "Pell the steward is judging the pie contest, and he's never once eaten a pie. Take him this one so he knows what he's looking for.", 'Pell eats the pie with a fork, very slowly, taking notes. "Crust: excellent. Filling: excellent." He looks up. "I was wrong about pies. I have been wrong about pies for forty years."'],
    daily: ['Judge of Gourds', "The pumpkin judging needs a judge who hasn't been bribed. That's you; nobody's bribed you yet. Go and judge the three biggest pumpkins in town."],
    bossSay: "The Scarecrow King's been walking the edge of the fields again, and the crows have gone strange. Somebody has to knock him down before he gets to the barns." },
  wintereve: { name: "Winter's Eve", host: 'Mother Hollin', hostModel: 'lifebinder1', token: 'Silver Bell', icon: '🔔', deco: ['wintertree', 'snowman', 'giftpile'], game: 'giftpile', gameVerb: 'Leave a gift',
    treat: 'Spiced Wine', bossKey: 'krampel', dye: ['holly', 'Holly', '#2a8a4a'], furn: ['f_wintertree', 'Winter Tree', 'wintertree'], mount: ['mount_winter', 'Silver-Belled Reindeer'], title: ['title_winter', 'the Giver'],
    greet: "The longest night of the year, and the warmest. Light a candle in the window, leave a gift for someone who won't know it was you, and drink something hot. That's all Winter's Eve asks.",
    q1: ['Silver Bells', "Old Krampel's goblins came through last night and stole every bell from the wintertrees, and now they're in the pockets of every beast and brigand from here to the mountains. Bring me eight back.", 'Silver Bell'],
    q2: ['Spiced Wine for Pell', "Pell the steward is working on Winter's Eve again. Take him a cup of spiced wine and tell him to go home. He won't go home. But take it anyway.", "Pell sips the wine. Then he puts down his quill, and closes his ledger, and for the first time in eleven years he goes home early. People talk about it for weeks."],
    daily: ['Gifts Under the Tree', "Three gift piles in town, and every gift has to be put under by somebody who isn't its giver. Off you go. And no peeking."],
    bossSay: "Old Krampel comes down from the hills every Winter's Eve with a sack, and he doesn't put things in it, he takes them out. Go and give him a hiding before he reaches the children." },
};
const KEYS = Object.keys(FESTS), DAY = 864e5;
const runNo = () => Math.floor(Date.now() / DAY / 3);
export const festOn = () => S.ext?.festForce || KEYS[runNo() % KEYS.length];
export const festLeft = () => { const end = (runNo() + 1) * 3 * DAY; return Math.max(0, end - Date.now()); };
const st = () => (S.ext.fest = S.ext.fest || { tokens: {}, run: null, boss: {} });
X.festOn = festOn;

// ---------- decorations and festival furniture ----------
const FG = {
  maypole: () => build([P(T(Cyl(.12, .16, 7, 6), 0, 3.5), 0, O, '#f2ead8'), P(T(Sph(.3, 6, 5), 0, 7.1), 0, O, '#ffd23a', 1), ...['#e04a4a', '#4a8ae0', '#ffd23a', '#4ab04a'].map((c, i) => P(T(Box(.06, 5.6, .06), Math.sin(i * 1.57) * 1.4, 3.8, Math.cos(i * 1.57) * 1.4, Math.cos(i * 1.57) * .25, 0, -Math.sin(i * 1.57) * .25), 0, O, c)), P(T(Tor(.5, .08, 4, 10), 0, 6.8, 0, Math.PI / 2), 0, O, '#4ab04a')]),
  bunting: () => build([P(T(Cyl(.06, .08, 4, 5), -3, 2), 0, O, '#6b4a2e'), P(T(Cyl(.06, .08, 4, 5), 3, 2), 0, O, '#6b4a2e'), ...Array.from({ length: 8 }, (_, i) => P(T(Cone(.25, .5, 3), -2.6 + i * .75, 3.5 - Math.sin(i / 7 * Math.PI) * .4, 0, Math.PI), 0, O, ['#e04a4a', '#4a8ae0', '#ffd23a', '#4ab04a'][i % 4]))]),
  bonfire: () => build([...[0, 1.2, 2.4, 3.6, 4.8].map(a => P(T(Cyl(.12, .14, 1.6, 5), Math.sin(a) * .5, .3, Math.cos(a) * .5, Math.cos(a) * .9, 0, -Math.sin(a) * .9), 0, O, '#5a3a22')), P(T(Cone(.6, 1.6, 6), 0, 1), 0, O, '#ff7a2a', 2), P(T(Cone(.35, 1.1, 5), 0, 1.4), 0, O, '#ffd23a', 2.4)]),
  gravecandle: () => build([P(T(Box(.8, .3, .5), 0, .15), 0, O, '#6a6058'), ...[-.25, 0, .25].map((x, i) => P(T(Cyl(.06, .06, .3 + i % 2 * .15, 5), x, .45 + i % 2 * .07), 0, O, '#f4ecd8')), ...[-.25, 0, .25].map((x, i) => P(T(Cone(.04, .1, 4), x, .68 + i % 2 * .15), 0, O, '#ffb040', 2.2)), P(T(Sph(.13, 6, 5), .5, .45), 0, O, '#f4f0e8')]),
  marigolds: () => build([P(T(Box(1.6, .3, .6), 0, .15), 0, O, '#6b4a2e'), ...Array.from({ length: 7 }, (_, i) => P(T(Sph(.14, 5, 4), -.66 + i * .22, .42, (i % 2) * .15 - .07), 0, O, i % 2 ? '#ff8a1a' : '#ffb82a'))]),
  skullpost: () => build([P(T(Cyl(.07, .09, 2.4, 5), 0, 1.2), 0, O, '#3a2a22'), P(T(Sph(.24, 7, 6), 0, 2.5), 0, O, '#f4f0e8'), P(T(Box(.06, .06, .02), -.08, 2.52, .22), 0, O, '#ff8a1a', 1.5), P(T(Box(.06, .06, .02), .08, 2.52, .22), 0, O, '#ff8a1a', 1.5), P(T(Tor(.28, .05, 4, 10), 0, 2.2, 0, Math.PI / 2), 0, O, '#ff8a1a')]),
  pumpkins: () => build([P(T(Sph(.55, 8, 6), 0, .45, 0, 0, 0, 0, 1.2, .85, 1.2), 0, O, '#e07a1a'), P(T(Cyl(.05, .07, .3, 5), 0, 1, 0, .2), 0, O, '#4a6a2a'), P(T(Sph(.35, 8, 6), .8, .3, .3, 0, 0, 0, 1.2, .85, 1.2), 0, O, '#d86a1a'), P(T(Sph(.28, 8, 6), -.7, .24, .4, 0, 0, 0, 1.2, .85, 1.2), 0, O, '#e8a03a')]),
  haybale: () => build([P(T(Box(1.6, .9, 1), 0, .45), 0, O, '#d8b86a'), P(T(Box(1.62, .08, 1.02), 0, .3), 0, O, '#8a6a3a'), P(T(Box(1.62, .08, 1.02), 0, .65), 0, O, '#8a6a3a')]),
  cornstook: () => build([P(T(Cone(.6, 2.2, 6), 0, 1.1), 0, O, '#c8a85a'), P(T(Tor(.32, .05, 4, 8), 0, 1.3, 0, Math.PI / 2), 0, O, '#8a6a3a')]),
  wintertree: () => build([P(T(Cyl(.15, .2, .8, 5), 0, .4), 0, O, '#5a3a22'), P(T(Cone(1.3, 1.8, 7), 0, 1.4), 0, O, '#2a6a3a'), P(T(Cone(1, 1.5, 7), 0, 2.3), 0, O, '#2a7a42'), P(T(Cone(.65, 1.2, 7), 0, 3.1), 0, O, '#3a8a4a'), P(T(Oct(.2), 0, 3.85), 0, O, '#ffe25a', 2), ...[[.7, 1.3, .5], [-.6, 1.7, .4], [.3, 2.5, -.5], [-.4, 2.2, -.5], [.5, 1.1, -.7]].map(([x, y, z], i) => P(T(Sph(.1, 5, 4), x, y, z), 0, O, ['#e04a4a', '#ffd23a', '#4a8ae0'][i % 3], 1.4))]),
  snowman: () => build([P(T(Sph(.6, 8, 6), 0, .55), 0, O, '#f4f8fc'), P(T(Sph(.42, 8, 6), 0, 1.4), 0, O, '#f4f8fc'), P(T(Sph(.3, 8, 6), 0, 2.05), 0, O, '#f4f8fc'), P(T(Cone(.05, .3, 4), 0, 2.05, .35, Math.PI / 2), 0, O, '#e07a1a'), P(T(Cyl(.22, .22, .3, 8), 0, 2.4), 0, O, '#2a2a30'), P(T(Tor(.32, .06, 4, 10), 0, 1.75, 0, Math.PI / 2), 0, O, '#c82a2a')]),
  giftpile: () => build([P(T(Box(.7, .5, .7), 0, .25), 0, O, '#c82a2a'), P(T(Box(.72, .52, .1), 0, .25), 0, O, '#ffd23a'), P(T(Box(.5, .4, .5), .6, .2, .3, 0, .4), 0, O, '#2a6aaa'), P(T(Box(.4, .35, .4), -.5, .17, .3, 0, -.3), 0, O, '#2a8a4a'), P(T(Box(.4, .3, .4), .1, .65, 0, 0, .7), 0, O, '#f4f0e8')]),
  altar: () => build([P(T(Box(1.8, .9, .7), 0, .45), 0, O, '#6b4a2e'), P(T(Box(1.9, .08, .8), 0, .92), 0, O, '#ff8a1a'), ...[-.6, 0, .6].map(x => P(T(Cyl(.06, .06, .35, 5), x, 1.15), 0, O, '#f4ecd8')), ...[-.6, 0, .6].map(x => P(T(Cone(.04, .1, 4), x, 1.38), 0, O, '#ffb040', 2.2)), P(T(Sph(.15, 6, 5), -.3, 1.08), 0, O, '#f4f0e8'), P(T(Sph(.15, 6, 5), .3, 1.08), 0, O, '#f4f0e8')]),
  cornucopia: () => build([P(T(Cone(.45, 1.4, 7), 0, .45, 0, 0, 0, Math.PI / 2 + .2), 0, O, '#c8a050'), P(T(Sph(.18, 5, 4), .7, .45, .1), 0, O, '#c82a2a'), P(T(Sph(.16, 5, 4), .75, .3, -.15), 0, O, '#e8a03a'), P(T(Sph(.15, 5, 4), .9, .4, .15), 0, O, '#6a2a8a')]),
};
addKinds(Object.fromEntries(Object.entries(FG).map(([k, f]) => ['fest_' + k, [f(), STILL, 0, .03]])));
// festival furniture joins the housing catalog (bought with tokens, placed like any other piece)
for (const k of KEYS) { const [fk, name, model] = FESTS[k].furn; FURN[fk] = [name, model, 0, null, null, 'fest_' + model]; }
X.objVerb = Object.assign(X.objVerb || {}, Object.fromEntries(KEYS.map(k => ['fest_' + k, FESTS[k].gameVerb])));
// and festival dyes join the wardrobe
for (const k of KEYS) { const [dk, name, col] = FESTS[k].dye; DYES[dk] = [name, col, 0, 'festival']; }

// every town is decorated while a festival is on
const TOWN_ZONES = ['vale', 'weald', 'kiln', 'hush', 'coast', 'wastes', 'north', 'crown'];
X.zone.push(zone => {
  if (!TOWN_ZONES.includes(zone) || !world.town) return;
  const F = FESTS[festOn()], fk = festOn(), t = world.town, R = (t.R || 20) * .62;
  resetRun();
  F.deco.forEach((d, j) => { for (let i = 0; i < 3; i++) { const a = (i * 3 + j) / 9 * TAU + .35, x = t.x + Math.cos(a) * R, z = t.z + Math.sin(a) * R;
    const p = { id: `fest_${fk}_${zone}_${d}_${i}`, kind: 'fest_' + d, name: d === F.game ? ({ bonfire: 'Bonfire', gravecandle: 'Grave Candles', pumpkins: 'Prize Pumpkins', giftpile: 'Gift Pile' })[d] : '', x, z, yaw: -a + Math.PI / 2, scale: 1 };
    if (d === F.game) p.tag = 'fest_' + fk; Game.spawnProp(p); } });
  const a = 4.1, e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: F.host, title: F.name, kind: F.hostModel, x: t.x + Math.cos(a) * R * .55, z: t.z + Math.sin(a) * R * .55, giver: 'fest_' + fk });
  e.y = hgt(e.x, e.z);
});

// ---------- the hosts, their quests and their stores ----------
const lvl = () => S.hero?.lvl || 1;
for (const k of KEYS) {
  const F = FESTS[k], g = 'fest_' + k;
  GIVERS[g] = { name: F.host, title: F.name, model: F.hostModel };
  TALK[g] = { bio: `${F.host} has hosted ${F.name.replace(/^The /, 'the ')} for longer than anybody can remember, and intends to go on hosting it until somebody makes them stop.`, greet: [F.greet], topics: [] };
  const when = () => festOn() === k;
  const mk = (id, name, text, obj, extra = {}) => QUESTS.push({ id, giver: g, name, text, obj, when, fest: k, ...extra, get lvl() { return lvl(); }, get xp() { return qx(lvl(), extra.daily ? .3 : .45); }, get gold() { return qg(lvl()); } });
  mk(g + '1', F.q1[0], F.q1[1], { collect: Object.keys(MOBS).filter(m => !MOBS[m].boss && !m.startsWith('bg_')), item: F.q1[2], chance: .3, n: 8 });
  mk(g + '2', F.q2[0], F.q2[1], { talk: true, what: `Take a ${F.treat} to Pell, the housing steward` }, { turnTo: 'steward', done: [['steward', F.q2[2]]] });
  mk(g + 'd', F.daily[0], F.daily[1], { inspect: g, n: 3, what: `${F.gameVerb}: all three, in any town` }, { daily: true });
}
// a new festival: last time's quests can be done again
function resetRun() {
  const s = st(), r = runNo() + ':' + festOn(); if (s.run === r) return; s.run = r;
  for (const q of QUESTS) if (q.fest && !q.daily) delete S.quests[q.id];
}
X.turnin.push(q => { if (!q.fest) return; const s = st(), n = q.daily ? 3 : 5; s.tokens[q.fest] = (s.tokens[q.fest] || 0) + n; chat('loot', null, `+${n} ${FESTS[q.fest].token}${n > 1 ? 's' : ''}.`); });

// ---------- the festival bosses ----------
Object.assign(MOBS, {
  wickerman: { ...boss('The Wicker Man', 'treant~gilded', { hpM: 2.2, dmgM: 1.1, scale: 2.4, weak: 'frost', resist: 'fire', school: 'fire', mechs: ['pool', 'slam', 'knock'], lines: { start: '*The Wicker Man creaks, and burns, and walks. It does not seem to mind the burning.*', half: '*Sparks shower from its arms.*' } }) },
  bonepiper: { ...boss('The Bone Piper', 'skeleton~spectral', { hpM: 2.2, dmgM: 1.1, scale: 1.8, undead: true, range: 16, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'call', 'pool'], adds: 'skeleton', lines: { start: 'Dance with me! Everyone dances with the Piper, sooner or later!', half: 'Faster! Faster!' } }) },
  scarecrowking: { ...boss('The Scarecrow King', 'bandit~ashen', { hpM: 2.2, dmgM: 1.1, scale: 1.9, weak: 'fire', mechs: ['fear', 'spawn', 'cleave'], adds: 'harpy', lines: { start: '*Straw rustles. Something under the sack-cloth face is smiling.*', half: '*The crows answer him.*' } }) },
  krampel: { ...boss('Old Krampel', 'troll~ashen', { hpM: 2.3, dmgM: 1.15, scale: 1.7, weak: 'fire', resist: 'frost', school: 'frost', mechs: ['slam', 'knock', 'charge'], lines: { start: 'Naughty! Naughty! Into the sack with you!', half: 'Krampel is not done counting!' } }) },
});
function challenge() {
  const k = festOn(), F = FESTS[k], s = st(), today = new Date().toDateString();
  if (s.boss[k] === today) return `${F.bossKey === 'krampel' ? 'Old Krampel' : MOBS[F.bossKey].name} has had enough for one day. Come back tomorrow.`;
  if (S.ents.some(e => e.mob === F.bossKey && !e.dead)) return 'It is already out there.';
  const t = world.town, a = rnd(0, TAU), r = (t.R || 20) + 22, x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r;
  const m = Cb.makeMob(F.bossKey, lvl() + 1, { x, z, home: { x, z }, named: F.bossKey, boss: true }); m.y = hgt(x, z); m.festBoss = k;
  chat('sys', null, `${m.name} waits at the edge of town.`); world.places.push({ name: m.name, x, z, R: 8, kind: 'place' }); return null;
}
X.kill.push(m => {
  if (!m.festBoss) return; const k = m.festBoss, F = FESTS[k], s = st();
  s.boss[k] = new Date().toDateString(); s.tokens[k] = (s.tokens[k] || 0) + 10; chat('loot', null, `+10 ${F.token}s.`);
  if (!Loot5.owned(F.mount[0]) && Math.random() < .08) Loot5.collect(F.mount[0]);
  const it = Loot5.setPieceFor?.(S.heroCls, lvl() >= 25 ? 8 : lvl() >= 22 ? 7 : lvl() >= 20 ? 5 : lvl() >= 15 ? 3 : lvl() >= 10 ? 1 : 0); if (it && Game.addToBag(it)) chat('loot', null, `${m.name} drops ${it.name}.`);
});
for (const k of KEYS) { const F = FESTS[k]; Loot5.COLLECT[F.mount[0]] = { type: 'mount', name: F.mount[1], kind: 'horse_war', spd: .85, ride: 1, from: F.name }; Loot5.COLLECT[F.title[0]] = { type: 'title', name: F.title[1], from: F.name }; }

X.talk.push((k, n, api) => {
  if (!k.startsWith('fest_')) return [];
  const fk = k.slice(5), F = FESTS[fk];
  return [[`▸ "${F.bossSay}"`, () => { const m = challenge(); if (m) X.ui.toast(m); api.close(); }, 'hl'], ['▸ Show me what you have for tokens.', () => { api.close(); shop(fk); }, 'hl']];
});
function shop(k) {
  const F = FESTS[k];
  X.ui.openSheet(F.name, body => {
    const { el, esc, toast, refreshSheet } = X.ui, s = st(), have = s.tokens[k] || 0;
    const left = Math.ceil(festLeft() / 36e5);
    body.appendChild(el(`<p>${F.icon} ${have} ${esc(F.token)}s. The festival ends in about ${left} hour${left === 1 ? '' : 's'}; tokens keep for next year.</p>`));
    const items = [[`Title: ${F.title[1]}`, 30, () => Loot5.owned(F.title[0]), () => Loot5.collect(F.title[0])], [`Mount: ${F.mount[1]}`, 80, () => Loot5.owned(F.mount[0]), () => Loot5.collect(F.mount[0])],
      [`Furniture: ${F.furn[1]}`, 15, () => false, () => { S.ext.furn = S.ext.furn || {}; S.ext.furn[F.furn[0]] = (S.ext.furn[F.furn[0]] || 0) + 1; chat('loot', null, `You get a ${F.furn[1]}. Place it from the Home page.`); }],
      [`Dye: ${F.dye[1]}`, 25, () => S.ext.dyes?.[F.dye[0]], () => { S.ext.dyes = S.ext.dyes || {}; S.ext.dyes[F.dye[0]] = true; chat('loot', null, `New dye: ${F.dye[1]}.`); }]];
    for (const [name, cost, has, give] of items) { const c = el(`<div class="who"><div><b>${esc(name)}</b></div><button ${has() || have < cost ? 'disabled' : ''}>${has() ? 'Owned' : cost + ' ' + F.icon}</button></div>`);
      c.querySelector('button').onclick = () => { if (has() || (s.tokens[k] || 0) < cost) return; s.tokens[k] -= cost; give(); Game.save(); refreshSheet(); }; body.appendChild(c); }
  });
}
