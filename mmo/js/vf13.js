// Build 13: the Frostcrown (levels 32-34). Past Kaldmark, past the Crown of Winter, the ice goes on for ever,
// and under it are the true halls of Kaldmark's kings. When Vhorun broke out, the voice beneath kept its promise:
// Ulvhar the Frost-King rose again, undying, on the White Throne. The Pale Choir has been sending him a tithe of
// prisoners for ten years. One of them is your mother or father, and this is where you bring them home.
import { S, X, chat, pick } from './core.js';
import { QUESTS, MOBS, CLASSES, CLASS_KEYS, GIVERS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world, zoneMarker, hgt, freeSpot } from './world.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver, faction, mount } from './hi9.js';
import * as Rep from './rep6.js';
import * as Loot5 from './loot5.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { parent } from './story12.js';
import { finish35, addDungeon35, addRaid35, PAL_ICE, st13 } from './vh13.js';

// {name}, {rel} and the rest, for your parent
export const pfill = s => { const p = parent(); return String(s).replace(/\{rel\}/g, p.rel).replace(/\{name\}/g, p.name).replace(/\{she\}/g, p.she).replace(/\{her\}/g, p.her).replace(/\{Her\}/g, p.Her).replace(/\{She\}/g, p.She).replace(/\{you\}/g, S.heroName || 'you'); };
Object.assign(MOBS, {
  rimeguard: mob('Rimeguard of the Frostcrown', 'bulwark1~spectral', { ...U, hpM: 1.45, weak: 'fire', resist: 'frost' }),
  frostwight: mob('Frost-Wight', 'ghoul~spectral', { ...U, hpM: 1.2, spd: 5.8, weak: 'fire', resist: 'frost' }),
  snowstalker: mob('Snowstalker', 'wolf~spectral', { ...B, hpM: 1.15, spd: 6.6, scale: 1.25, weak: 'fire', resist: 'frost' }),
  glacialhulk: mob('Glacial Hulk', 'troll~spectral', { hpM: 1.6, spd: 4.4, scale: 1.3, weak: 'fire', resist: 'frost', ore: true }),
  icewisp: mob('Ice-Wisp', 'firepet~spectral', { hpM: .85, fly: .8, range: 18, ranged: true, caster: true, school: 'frost', weak: 'fire', resist: 'frost' }),
  tithetaker: mob('Choir Tithe-Taker', 'cultist1~spectral', { ...HU, hpM: 1.15, range: 16, ranged: true, caster: true, school: 'frost', weak: 'holy' }),
  // named
  theoldfang13: boss('Old Fang', 'wolf~spectral', { ...B, scale: 2.2, mechs: ['charge', 'spawn'], adds: 'snowstalker' }),
  rimehag13: boss('The Rime-Hag', 'ghostnpc~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'fear'] }),
  // the Tithe Road (open)
  wagonmaster13: boss('Wagon-Master Gile', 'cultist2~spectral', { ...HU, mechs: ['cleave', 'call'], adds: 'tithetaker', lines: { start: 'Every month, a wagon. Every wagon, twelve. I don\'t ask their names. It\'s easier not to.', half: 'Lock the wagons!' } }),
  chainhound13: boss('The Chain-Hound', 'wolf~ashen', { ...B, scale: 2, mechs: ['charge', 'web', 'knock'], lines: { start: '*A wolf the size of a pony, wearing the chains of everyone who ever tried to run.*', half: '*It drags the chains, and they sing.*' } }),
  tithemaster13: boss('The Tithe-Master', 'priest~spectral', { ...HU, hpM: 1.7, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'heal', 'call', 'enrage'], adds: 'rimeguard', lines: { start: 'The Choir-Mother sends him twelve a month, and he keeps the winter off her lands. A fair trade. I have the ledger to prove it.', half: 'You can\'t stop the tithe! The tithe was promised!' } }),
  // the Glass Glacier (open)
  glassmaiden13: boss('The Glass Maiden', 'ghostnpc~spectral', { ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'fear', 'heal'], lines: { start: 'I ran. Thirty years ago, I ran, and the glacier caught me, and I have been looking out at the sky ever since. Stay with me. It is so lonely in the ice.', half: 'Don\'t go! Nobody ever stays!' } }),
  glacierwyrm13: boss('The Glacier Wyrm', 'leviathan~spectral', { scale: .7, weak: 'fire', resist: 'frost', mechs: ['charge', 'pool', 'knock'], lines: { start: '*Something long and pale swims up through the ice as if it were water.*', half: '*It dives, and the glacier groans.*' } }),
  heartofwinter13: boss('The Heart of Winter', 'golempet~spectral', { hpM: 1.8, scale: 2.6, weak: 'fire', resist: 'frost', school: 'frost', mechs: ['slam', 'pool', 'shield', 'enrage'], lines: { start: '*At the centre of the glacier, a heart of blue ice beats once a minute. It keeps the cells beneath sealed. It is beating faster.*', half: '*Cracks spread through the ice, and through it.*' } }),
  // the Tithe-Cells (instance, 33-34)
  turnkey13: boss('The Turnkey', 'bulwark1~spectral', { ...U, scale: 1.5, mechs: ['cleave', 'shield'], lines: { start: 'Lights out. Lights out forever. That is the rule.', half: 'Back in your cell!' } }),
  thecold13: boss('The Cold Within', 'stormpet~spectral', { scale: 2, school: 'frost', weak: 'fire', resist: 'frost', mechs: ['pool', 'knock', 'volley'], lines: { start: '*The cells are kept cold by a thing that is nothing but cold. It notices you are warm.*', half: '*The air itself freezes.*' } }),
  choirwarden13: boss('Choir-Warden Sabeth', 'cleric2~spectral', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'fear', 'call'], adds: 'tithetaker', lines: { start: 'The Choir-Mother sends her regards. She remembers your family very well. Especially the one in cell nine.', half: 'Sing, sisters! The cold is our hymn!' } }),
  jailer13: boss('Hrimgar the Jailer', 'troll~spectral', { hpM: 2, scale: 1.9, weak: 'fire', resist: 'frost', mechs: ['cleave', 'slam', 'call', 'enrage'], adds: 'frostwight', lines: { start: 'Every key in the Frostcrown hangs on my belt. Every prisoner is mine until the king says otherwise. The king never says otherwise.', half: 'Wights! The cells are open! Close them!' } }),
  // the White Throne (12-person raid)
  huscarls12: rboss('The Huscarls of Winter', 'bulwark2~spectral', { hpM: 2.3, scale: 1.8, ...U, mechs: ['cleave', 'shield', 'call'], adds: 'rimeguard', lines: { start: '*Twelve huscarls stand around the hall, as they have for a hundred years. They move as one.*', half: '*They lock shields.*' } }),
  yrsildreturned: rboss('Queen Yrsild Returned', 'ghostnpc~spectral', { hpM: 2.3, ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'heal', 'fear', 'aura'], auraK: .1, lines: { start: 'You put me in my grave once. My husband has dug me out again. He is always so thoughtful.', half: 'Husband! They are here again!' } }),
  ivarreturned: rboss('Ivar, the Winter Heir', 'bladewarden2~spectral', { hpM: 2.4, ...U, scale: 1.6, mechs: ['cleave', 'charge', 'knock'], lines: { start: 'I asked you to be kind, the last time. You were. I am sorry, Lightkeeper. He woke me. He did not ask.', half: 'Forgive me. I cannot stop.' } }),
  ulvharundying: rboss('Ulvhar Undying', 'gravelord~spectral', { hpM: 2.7, ...U, scale: 2.6, range: 18, ranged: true, caster: true, school: 'frost', weak: 'fire', resist: 'frost', mechs: ['pool', 'call', 'fear', 'knock', 'aura', 'enrage'], auraK: .15, adds: 'frostwight', lines: { start: 'You killed me on the Crown of Winter. The voice beneath was kind enough to disagree. He promised me a frozen world, Lightkeeper, and he keeps his promises. Unlike some.', half: 'Winter without end! Winter without END!' } }),
});
Object.assign(MOB_LORE, { tithetaker: 'A Choir agent who brings Ulvhar his monthly tithe of prisoners, in exchange for winter staying out of the Choir\'s lands.', ulvharundying: 'Ulvhar of Kaldmark, raised again on the White Throne when Vhorun broke out, as he was promised.' });
giver('astrid13', 'Astrid of the Thawborn', 'Thawhold · the Thawborn', 'bladewarden1');
giver('hallvard13', 'Hallvard the Runner', 'Hearth\'s End · once a prisoner', 'knifeshade1');
GIVERS.parent13 = { get name() { return parent().name; }, get title() { return pfill('Your {rel}'); }, model: 'cleric1' };
Object.assign(TALK, {
  astrid13: { bio: 'Astrid was born in the Frostcrown, under Ulvhar\'s long winter, to parents who had been taken on the Tithe Road. She has never seen a summer. She leads the Thawborn, the prisoners\' children who live free in the ice, and she intends to see one before she dies.',
    greet: ["Thawhold. It's the only place in the Frostcrown where the fire never goes out. We'd die if it did. So it doesn't.", "You came up the Tithe Road on your own feet. Nobody does that. Everyone else comes up it in chains."],
    topics: [{ q: 'Who are the Thawborn?', a: ["The children of the tithe. The Choir sends twelve prisoners a month up the road, and the Frost-King keeps them in his cells, and some of them get out, and some of them have children.", "We're the children. We've never been warm, not properly. We want to be. That's all. That's the whole cause."] }] },
  hallvard13: { bio: 'Hallvard was a tinker from Corrandel who was taken on the Tithe Road nine years ago. He ran on the third night, and has been running ever since. He has never stopped moving long enough to go home.',
    greet: ["Keep moving. That's my advice for the Frostcrown. If you stand still, the cold notices you.", "I was in the cells, once. Nine years ago. I remember every face. I've been trying to get them out ever since."],
    topics: [{ q: 'Do you remember a prisoner from the Vale?', get a() { return [pfill("From the Vale? There was one. Cell nine. {Name} came up the year before me, and never stopped talking about home, and never stopped saying somebody would come.").replace('{Name}', parent().name), pfill("I told {her} nobody comes. {She} said, 'Mine will.' I didn't believe {her}. I'm starting to.")]; } }] },
  parent13: { get bio() { return pfill('{name} went after the Pale Choir ten years ago, and was taken by them, and spent ten years in a cell in the Frostcrown, talking about you. {She} is thinner than you remember, and greyer, and {she} has not stopped looking at you since you opened the door.'); },
    get greet() { return [pfill("Look at you. Just look at you. I keep thinking I'll wake up."), pfill("You came. I told them you would. Nobody believed me. I didn't always believe me.")]; }, topics: [] },
});
Object.assign(LORE, {
  titheledger: { title: 'The Tithe Ledger', where: 'titheroad', get text() { return pfill("A ledger in the Tithe-Master's careful hand, ten years of names. Halfway down one page: '{name}, of the Vale. Strong. Asks questions. Cell nine.' Beside it, in a different hand, small and shaky, someone has added: 'still asking.'"); } },
});
X.VEND = Object.assign(X.VEND || {}, { thawhold: ['Fire-Keeper Brenna', 'villager2'], hearthsend: ['Old Skarp', 'villager1'] });
faction('thaw', 'The Thawborn', '🔥', 'thawhold', [[1, 200, 'Thawborn Ring', Rep.ring('Thawborn Ring', 32, 2)], [2, 500, 'Hearthfire Elk (mount)', 'mount_thaw'], [3, 500, 'Torc of the First Summer', Rep.ring('Torc of the First Summer', 35, 3, 'neck')], [4, 0, 'Title: the Thawbringer', 'title_thaw']], []);
mount('mount_thaw', 'Hearthfire Elk', 'horse_thaw', '#8a5a3a', '#ff9a3a', '#3a2a22', true);
Loot5.COLLECT.title_thaw = { type: 'title', name: 'the Thawbringer', from: 'rep' };
const F = { zone: 'xf13' }, TH = r => ({ thaw: r });
const WILD = ['snowstalker', 'glacialhulk', 'icewisp'], KING = ['rimeguard', 'frostwight', 'tithetaker'];
for (const m of [...WILD, ...KING]) Rep.KILL_REP[m] = ['thaw', 6];
// the way in: past Kaldmark, at the top of the Rimewild
X.zone.push(zone => {
  if (zone !== 'north') return;
  world.zoneLines.push({ x: 200, z: -480, r: 6, to: 'xf13', label: 'North past Kaldmark into the Frostcrown (levels 32-35)', why: () => (S.hero?.lvl || 0) < 32 ? 'The Frostcrown is for level 32 and beyond.' : S.quests.xw6?.state !== 'turned' ? 'The ice past Kaldmark is sealed. Something will have to open it.' : null });
  zoneMarker(200, -480, 0); world.places.push({ name: 'The Road to the Frostcrown', x: 200, z: -470, R: 10, kind: 'place' });
});
X.arriveHooks.push((zone, from) => zone === 'xf13' ? { x: 0, z: 460 } : zone === 'north' && from === 'xf13' ? { x: 200, z: -455 } : null);
defineZone('xf13', {
  size: 500, seed: 13051, name: 'The Frostcrown', bossName: 'Ulvhar Undying', hiH: 14, maxSpawnH: 30,
  land: (x, z, N) => 4 + N.fbm(x * .006, z * .006, 4) * 18 + Math.max(0, N.fbm(x * .014 + 3, z * .014, 3) - .5) * 30,
  pal: PAL_ICE,
  towns: [{ key: 'thawhold', name: 'Thawhold', x: 0, z: 390, R: 30, wall: 'human', gates: [Math.PI / 2, Math.PI * 1.5], roof: '#4a3a3a', hwall: '#7a6a5a', guardName: 'Thawborn Spear', guardKind: 'bladewarden1',
    houses: [[-14, 10, .4, 'hall', 9, 5], [14, 12, -.4, 'icehut', 6, 6], [-16, -10, .2, 'icehut', 6, 6], [16, -10, 2.2, 'hut']], props: [[0, 4, 'lantern'], [-6, 0, 'banner', '#ff7a2a'], [6, 0, 'banner', '#ff7a2a']],
    npcs: [['giver', 'astrid13', 0, 0], ['vendor', 'thawhold', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 28], [-2, 28], [2, -28], [-2, -28]] },
    { key: 'hearthsend', name: 'Hearth\'s End', x: 320, z: 40, R: 22, wall: 'palisade', gates: [Math.PI, Math.PI / 2], guardName: 'Runner', guardKind: 'archer1',
      houses: [[-6, 6, .3, 'icehut', 5, 5], [6, -6, -.4, 'tent']], props: [[0, 0, 'lantern'], [4, 4, 'totem']],
      npcs: [['giver', 'hallvard13', -5, -2], ['vendor', 'hearthsend', 6, -4], ['bind', null, 0, 6]], guards: [[-20, 2], [-20, -2]] }],
  roads: [[0, 470, 0, 360], [0, 360, 40, 160], [40, 160, 300, 40], [40, 160, -300, 60], [-300, 60, -200, -260]],
  regions: { names: ['The Thaw', 'Hearth\'s End', 'The Tithe Road', 'The Glass Glacier', 'The White Throne'], fn: (x, z) => z > 240 ? 0 : z < -320 ? 4 : x > 160 ? 1 : x < -160 ? 2 : 3 },
  open: [{ key: 'titheroad', name: 'The Tithe Road', x: -300, z: 60, R: 34, deco: 'icerock', decoN: 18, ring: true, gap: 0, centre: 'banner', lvl: [32, 33], area: 2,
      packs: [[-18, 0, ['tithetaker', 'tithetaker', 'rimeguard']], [18, 0, ['rimeguard', 'frostwight']], [0, -18, ['tithetaker', 'snowstalker', 'snowstalker']], [0, 18, ['rimeguard', 'rimeguard', 'tithetaker']]],
      bosses: [[-22, -18, 'wagonmaster13', 32], [22, -20, 'chainhound13', 33], [0, -4, 'tithemaster13', 33, true]] },
    { key: 'glassglacier', name: 'The Glass Glacier', x: 40, z: -120, R: 34, deco: 'crystal', decoN: 24, centre: 'crystal', lvl: [33, 34], area: 3,
      packs: [[-18, 0, ['icewisp', 'icewisp', 'glacialhulk']], [18, 0, ['frostwight', 'frostwight', 'icewisp']], [0, -18, ['glacialhulk', 'icewisp']], [0, 18, ['frostwight', 'glacialhulk']]],
      bosses: [[-22, -18, 'glassmaiden13', 33], [22, -20, 'glacierwyrm13', 34], [0, -4, 'heartofwinter13', 34, true]] }],
  doors: [{ to: 'tithecells', name: 'The Tithe-Cells', x: -200, z: -270, ry: 0, label: 'Enter the Tithe-Cells (33-34)', col: '#9ad8ff', why: () => S.quests.xf5?.state !== 'turned' && S.quests.xf5?.state !== 'done' ? 'The cells are sealed in ice. Something in the glacier is keeping them shut.' : null },
    { to: 'whitethrone', name: 'The White Throne', x: 60, z: -430, ry: 0, label: 'Climb to the White Throne (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: 220, z: -260, name: 'The Frozen Petitioners', R: 16, clear: 10, s: 1.6 }],
  lines: [{ x: 0, z: 488, to: 'north', label: 'South to the Rimewild', ry: Math.PI }],
  spots: { thawhold: { x: 0, z: 380 }, thaw: { x: 40, z: 280 }, hearthsend: { x: 320, z: 40 }, titheroad: { x: -300, z: 60 }, glacier: { x: 40, z: -120 }, cells: { x: -200, z: -260 }, throne: { x: 60, z: -420 }, petitioners: { x: 220, z: -260 } },
  scatter: [[44, [-480, 480, 240, 480], ['snowstalker', 'icewisp', 'frostwight'], [32, 33], 0], [40, [160, 480, -320, 240], ['glacialhulk', 'snowstalker', 'icewisp'], [32, 33], 1],
    [44, [-480, -160, -320, 240], ['tithetaker', 'rimeguard', 'snowstalker'], [32, 33], 2], [44, [-160, 160, -320, 240], ['frostwight', 'icewisp', 'glacialhulk'], [33, 34], 3],
    [44, [-480, 480, -480, -320], ['rimeguard', 'frostwight', 'glacialhulk', 'icewisp'], [33, 34], 4]],
  camps: [[6, [-480, -160, -320, 240], ['tithetaker', 'tithetaker', 'rimeguard'], [32, 33], 2, 'tt'], [6, [-480, 480, -480, -320], ['rimeguard', 'rimeguard', 'frostwight'], [33, 34], 4, 'rg']],
  rares: [[[160, 480, -320, 240], 'theoldfang13', 33, false], [[-160, 160, -320, 240], 'rimehag13', 33, true]],
  hunt: [{ area: 0, lvl: [32, 33] }, { area: 1, lvl: [32, 33] }, { area: 2, lvl: [32, 33] }, { area: 3, lvl: [33, 34] }, { area: 4, lvl: [33, 34] }],
  labels: [{ t: 'The Thaw (32-33)', x: 0, z: 300 }, { t: 'Hearth\'s End (32-33)', x: 300, z: 120 }, { t: 'The Tithe Road (32-33)', x: -300, z: 140 }, { t: 'The Glass Glacier (33-34)', x: 40, z: -40 }, { t: 'The White Throne (33-34)', x: 0, z: -380 }],
  nodes: [['voidiron', 'ore', 'oresilver', 150, null, 18], ['rimeglass', 'ore', 'oresilver', 150, null, 16], ['gloomcap', 'herb', 'herbmeadow', 150, null, 20]],
  scenery: { density: 20000, tuft: '#c8d8e0', kinds: [['snowpine', .05, 1.2, 2.6], ['icerock', .02, .8, 2.2], ['crystal', .006, .8, 1.8]] },
  sky: { fog: '#d8e4f0', top: '#6a8ab0', hor: '#eef4fa', k: .55, far: 210 },
});
defineDungeon({ key: 'tithecells', name: 'The Tithe-Cells', parent: 'xf13', plan: 'cells', floor: '#a8b8c8', rock: '#2a3a4a', fog: '#7a90a8', light: .5, lvl: [33, 34], prop: 'bluelamp',
  mobs: ['rimeguard', 'frostwight', 'tithetaker', 'icewisp'], bosses: ['turnkey13', 'thecold13', 'choirwarden13', 'jailer13'], exitLabel: 'Back out onto the ice' });
defineDungeon({ key: 'whitethrone', name: 'The White Throne', parent: 'xf13', plan: 'winding', floor: '#d8e0ea', rock: '#4a5a6a', fog: '#b8c8d8', light: .55, lvl: [34, 35], prop: 'icerock', raid: true,
  mobs: ['rimeguard', 'frostwight', 'glacialhulk', 'icewisp'], bosses: ['huscarls12', 'yrsildreturned', 'ivarreturned', 'ulvharundying'], exitLabel: 'Back down to the Frostcrown' });
addDungeon35('tithecells', 'The Tithe-Cells', [33, 34]); addRaid35('whitethrone', 'The White Throne');
X.gate.tithecells = () => ['done', 'turned'].includes(S.quests.xf5?.state) ? null : 'The Tithe-Cells are sealed in ice. Something in the Glass Glacier is keeping them shut.';
tier({ titheroad: 13, glassglacier: 14, tithecells: 14, whitethrone: 15 });

// ---------- your parent: waiting in Thawhold once you've opened the cells, then at your side ----------
const freed = () => ['done', 'turned'].includes(S.quests.xf6?.state);
export const parentJoined = () => (S.friends || []).some(f => f.parent) || !!st13().parentCls;
X.zone.push(zone => {
  if (zone !== 'xf13' || !freed() || parentJoined() || !world.town) return;
  const t = world.town, avoid = S.ents.filter(e => e.team === 'npc' && Math.hypot(e.x - t.x, e.z - t.z) < 40), p = freeSpot(t.x, t.z, 6, 20, 2.2, avoid);
  const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: parent().name, title: pfill('Your {rel}'), kind: 'cleric1', x: p.x, z: p.z, giver: 'parent13' }); e.y = hgt(p.x, p.z);
});
// choosing what your parent fights as: anything they like, they've had ten years to think about it
export function joinParent(cls) {
  const p = parent(); if (parentJoined()) return;
  st13().parentCls = cls; st13().parentFree = true;
  S.friends = S.friends || []; S.friends.push({ name: p.name, pal: 2, persona: 'friendly', cls, parent: true, storyKind: 'parent' });
  const npc = S.ents.find(e => e.giver === 'parent13'); if (npc) npc.remove = true;
  if (S.party.length < Game.partyCap()) { const f = Game.addMate({ name: p.name, cls, lvl: S.hero.lvl, pal: 2, persona: 'friendly', guild: null, friend: true, bff: true }, S.hero); chat('party', f.name, pfill(pick(["Right. Where are we going? Don't say home. Not yet. I want to see what you've become first.", "Ten years in a cell. I've had a lot of time to think about how I'd fight my way out of it. Let's find out if I was right."]))); }
  else chat('sys', null, pfill('Your {rel} will meet you when you have room in your group.'));
  X.loyaltyBump?.(p.name, 30); Game.save();
}
function pickClass() {
  const { el, openSheet, closeSheet } = X.ui;
  openSheet(pfill('{name} joins you'), body => {
    body.appendChild(el(`<p style="margin-top:0">${X.ui.esc(pfill("\"I've had ten years to decide how I'd fight if I ever got out,\" {name} says. \"Tell me what you need, and that's what I'll be.\""))}</p>`));
    for (const role of ['tank', 'healer', 'dps']) {
      body.appendChild(el(`<h3 style="font:700 13px Cinzel;margin:8px 0 4px;color:var(--dim)">${{ tank: 'Hold the line', healer: 'Keep you alive', dps: 'Hit hard' }[role]}</h3>`));
      const row = el('<div class="seg" style="flex-wrap:wrap"></div>');
      for (const k of CLASS_KEYS.filter(c => CLASSES[c].role === role)) { const b = el(`<button style="flex:1 0 auto;padding:0 8px;color:${CLASSES[k].color}">${CLASSES[k].name}</button>`); b.onclick = () => { joinParent(k); closeSheet(); }; row.appendChild(b); }
      body.appendChild(row);
    }
  });
}
X.turnin.push(q => { if (q.id === 'xf6') setTimeout(pickClass, 400); });
X.talk.push((k, n, { close }) => k === 'parent13' && freed() && !parentJoined() && S.quests.xf6?.state === 'turned' ? [['▸ Come with me. <span class="qn">Choose how they fight</span>', () => { close(); pickClass(); }, 'hl']] : []);

QUESTS.push(...finish35([
  { id: 'xf1', story: true, giver: 'astrid13', lvl: 32, pre: 'xw6', name: 'The Thawborn', where: 'thaw', ...F, rep: TH(300), obj: { kill: [...WILD, 'frostwight'], n: 12, near: 'thaw', nearR: 240, what: 'Clear 12 creatures of the ice from the Thaw around Thawhold' },
    say: ["You're from the south, then. From the warm. I can tell, you know. You stand like someone who's never had frostbite.", "Ulvhar's back on his throne. The ice is growing again, a mile a week, and everything in it is hungry. Twelve of them, between here and the Thaw, and then we'll talk properly."],
    get done() { return [pfill("The Tithe Road? You're looking for someone, then. Everyone who comes up here is looking for someone. Who is it?"), pfill("Your {rel}. Oh. Oh, Lightkeeper. Talk to Hallvard, at Hearth's End. He was in the cells. He remembers everyone.")]; } },
  { id: 'xf2', story: true, giver: 'hallvard13', lvl: 32, pre: 'xf1', name: 'The Tithe-Runner', where: 'titheroad', ...F, rep: TH(300), obj: { collect: ['tithetaker', 'rimeguard'], item: 'Prisoner\'s Token', chance: .5, n: 6, what: 'Take 6 prisoners\' tokens from the tithe-takers and rimeguard on the Tithe Road' },
    get say() { return [pfill("Cell nine. Your {rel} was in cell nine, the year I ran. I remember because {she} gave me {her} bread, the night before. Said I'd need it more."), "Every prisoner gets a token with a number on it. The tithe-takers carry them, so they know who's who. Bring me six. If one of them says nine, we'll know the cell is still... occupied."]; },
    get done() { return [pfill("Three. Five. Eleven. Eight. Two. And nine."), pfill("Nine. Still on the books, Lightkeeper. Still in the cells. Still alive, or they'd have crossed it out. They always cross them out.")]; } },
  { id: 'xf3', story: true, giver: 'astrid13', lvl: 33, pre: 'xf2', name: 'The Tithe Road', where: 'titheroad', ...F, rep: TH(400), obj: { named: 'tithemaster13', n: 1, what: 'Ride out onto the Tithe Road and take the ledger from the Tithe-Master' },
    say: ["The Tithe-Master keeps the ledger: every prisoner the Choir has sent up the road in ten years, and every cell they went into. He meets the wagons at the old toll-gate, west of here.", "Take the ledger. Then we'll know exactly where to dig."],
    get done() { return [pfill("Here. Halfway down the page. '{name}, of the Vale. Strong. Asks questions. Cell nine.' And then, in another hand, very small: 'still asking.'"), "That's them, isn't it? That's their writing. Oh, don't cry. Don't cry, you'll freeze to your face. ...All right. Cry. I'll hold your hood."]; } },
  { id: 'xf4', story: true, giver: 'hallvard13', lvl: 33, pre: 'xf1', name: 'Cold Hands', where: 'glacier', ...F, rep: TH(400), obj: { kill: ['glacialhulk', 'icewisp', 'frostwight'], n: 12, near: 'glacier', nearR: 260, what: 'Break 12 of the creatures guarding the Glass Glacier' },
    say: ["The cells are under the Glass Glacier, and the glacier is crawling with things that keep it cold. Hulks, wisps, wights. Twelve of them, so we can get close enough to look."],
    done: ["Close enough to look. And I wish I hadn't, a bit. There's a heart in there, Lightkeeper. A heart of ice, beating. That's what keeps the cells shut."] },
  { id: 'xf5', story: true, giver: 'astrid13', lvl: 34, pre: 'xf3', pre2: 'xf4', name: 'The Glass Glacier', where: 'glacier', ...F, rep: TH(500), obj: { named: 'heartofwinter13', n: 1, what: 'Break the Heart of Winter at the centre of the Glass Glacier, and unseal the Tithe-Cells' },
    say: ["Hallvard says there's a heart in the glacier, and while it beats, the cells stay sealed. Nobody goes in, nobody comes out.", "Break it. Then the ice will crack, and the way to the cells will open, and you can go and get your family back."],
    done: ["Did you feel that? The whole glacier shook. And listen. Water. Running water, in the Frostcrown. The ice is cracking. The cells are open, Lightkeeper. Go."] },
  { id: 'xf6', story: true, giver: 'astrid13', turnTo: 'parent13', lvl: 34, pre: 'xf5', name: 'The Tithe-Cells', where: 'cells', ...F, rep: TH(800), obj: { named: 'jailer13', n: 1, get what() { return pfill('Go down into the Tithe-Cells, defeat Hrimgar the Jailer, and open cell nine for your {rel}'); } },
    get say() { return [pfill("The cells are open, but the Jailer is still down there, with every key in the Frostcrown on his belt. Cell nine is at the bottom. It always is."), pfill("Go and get your {rel}, Lightkeeper. We'll have the fire built up for when you come back. We'll have it as big as a summer.")]; },
    get done() { return [['parent13', pfill("I heard you coming. Through three floors of ice, I heard you, and I knew. I said to the wall: that's {you}. The wall didn't argue. It never does.")], ['parent13', pfill("Let me look at you. You've grown. You've got scars. You've got my chin, God help you. Ten years. I'm so sorry. I'm so sorry I went, and I'm so proud of you I could split.")], ['parent13', "I'm not going home. Not yet. Not while that thing is loose and I've got two good hands. Take me with you. Please. I want to see what you've become."]]; } },
  { id: 'xf7', story: true, giver: 'astrid13', lvl: 35, needLvl: 34, pre: 'xf6', name: 'The White Throne', where: 'throne', ...F, rep: TH(1000), obj: { named: 'ulvharundying', n: 1, what: 'Climb to the White Throne and end Ulvhar Undying (12-person raid)' },
    get say() { return ["Ulvhar sits on the White Throne at the top of the Frostcrown, and while he sits there, the ice keeps growing. Kaldmark first, then the Rimewild, then the Wastes, then everything. That's what he was promised.", pfill("You put him in his grave once, they say, on the Crown of Winter. Do it again, and make it stick. Bring warm clothes. Bring anything that resists the cold. And bring your {rel}, if {she}'ll come. I think {she}'ll come.")]; },
    done: [['astrid13', "Lightkeeper. Come to the window."], ['astrid13', "That's the sun. On the snow. That's what everyone always told me it looked like, and they never got it right. Nobody ever got it right. Thank you. I'm going to stand here for a while, if that's all right."]] },
  { id: 'xfx1', giver: 'hallvard13', lvl: 33, pre: 'xf2', name: 'Old Fang', where: 'hearthsend', ...F, rep: TH(250), obj: { named: 'theoldfang13', n: 1, what: 'Hunt down Old Fang, the white wolf of Hearth\'s End' },
    say: ["There's a wolf out east that hunts runners. Old Fang. It caught my friend Sorrel, the night we ran. I've been waiting nine years for someone who could kill it.", "I'm not going to watch. I'm going to sit here and drink something hot and think about Sorrel."],
    done: ["Thank you. Sorrel used to say he'd be the one to kill it. He'd have liked you. He liked anyone who'd fight a wolf for no money."] },
  { id: 'xfx2', giver: 'astrid13', lvl: 33, pre: 'xf1', name: 'Fuel for the Fire', where: 'thaw', ...F, rep: TH(250), obj: { collect: ['glacialhulk', 'snowstalker'], item: 'Frozen Pine-Heart', chance: .5, n: 8, what: 'Gather 8 frozen pine-hearts from the hulks and snowstalkers that hoard them' },
    say: ["The fire at Thawhold eats a forest a winter, and the forests are under the ice. The hulks dig up pine-hearts and hoard them; the snowstalkers drag them off and chew them.", "Eight. Enough for a week. A week's a long time, in the Frostcrown."],
    done: ["Good wood. Old wood. It'll burn all night. The little ones will sleep warm."] },
  { id: 'xfy1', daily: true, giver: 'astrid13', lvl: 33, pre: 'xf1', name: 'Daily: Hold Back the Ice', ...F, rep: TH(200), obj: { kill: [...WILD, ...KING], n: 12, what: 'Defeat 12 creatures of the Frostcrown' },
    say: ["The ice crept another hundred paces last night. Twelve of the things that push it, please."], done: ["A hundred paces back. Not much. Everything, up here."] },
  { id: 'xfy2', daily: true, giver: 'hallvard13', lvl: 34, pre: 'xf2', name: 'Daily: No More Tithes', ...F, rep: TH(200), obj: { kill: ['tithetaker', 'rimeguard'], n: 10, what: 'Defeat 10 tithe-takers and rimeguard on the Tithe Road' },
    say: ["The Choir's still sending wagons. Ten of the people driving them, please. Nobody else goes up that road in chains while I'm breathing."], done: ["No wagon today. Good. Good."] },
]));
