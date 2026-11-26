// Build 13: the Wound (levels 30-32). Where Vhorun came up out of the Underdark: a crater a mile across, the
// upper halls of Deepwatch torn out of the rock and dropped on its rim, and the Upward Choir, a cult that
// watched him pass and decided to worship him. At the bottom is the Undergate, the first 24-person raid.
import { S, X } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { finish35, addDungeon35, addRaid24, PAL_WOUND } from './vh13.js';

Object.assign(MOBS, {
  woundcrawler: mob('Wound-Crawler', 'spider~ashen', { ...B, hpM: 1.2, scale: 1.3, weak: 'fire', resist: 'shadow' }),
  rockwraith: mob('Rock-Wraith', 'golempet~ashen', { hpM: 1.5, spd: 4.4, range: 2.8, weak: 'storm', resist: 'earth', scale: 1.15, ore: true }),
  cinderwing: mob('Cinderwing', 'harpy~ashen', { ...B, hpM: .95, fly: 1.3, spd: 6.4, weak: 'frost', resist: 'fire' }),
  hollowwarden: mob('Hollowed Deepwarden', 'bulwark1~spectral', { ...U, hpM: 1.35, weak: 'holy', resist: 'shadow' }),
  upzealot: mob('Upward Choir Zealot', 'cultist2~ashen', { ...HU, hpM: 1.2, weak: 'holy' }),
  upcaller: mob('Upward Choir Lamp-Eater', 'warlock2~ashen', { ...HU, hpM: .9, range: 20, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  // named
  thegnaw13: boss('The Gnaw', 'spider~ashen', { ...B, scale: 2.4, mechs: ['web', 'spawn'], adds: 'woundcrawler' }),
  mothermaw13: boss('Mother Maw', 'abom~ashen', { scale: 1.8, mechs: ['pool', 'slam'] }),
  // the Shattered Halls (open)
  wardenbrask13: boss('Warden-Captain Brask', 'bulwark2~spectral', { ...U, mechs: ['cleave', 'call'], adds: 'hollowwarden', lines: { start: 'I looked at it. When it went past, I looked at it. Mira told us not to look. I am so tired, Lightkeeper.', half: 'Wardens! To me! To... to whoever I am!' } }),
  lampeater13: boss('The Lamp-Eater', 'wraith~ashen', { range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['pool', 'fear'], lines: { start: '*It is the shape of the Last Lamp\'s flame, drawn in darkness. It ate the light. It is still hungry.*', half: '*The room goes dim. Then dimmer.*' } }),
  hallsheart13: boss('The Torn Heart of the Halls', 'golempet~ashen', { hpM: 1.7, scale: 2.6, weak: 'storm', resist: 'earth', mechs: ['slam', 'knock', 'call', 'enrage'], adds: 'rockwraith', lines: { start: '*The foundation stone of Deepwatch, torn out of the ground and dropped on the rim, has learned to stand.*', half: '*Rubble pulls itself up into new shapes.*' } }),
  // the Weeping Pit (open)
  mournvoice13: boss('Choir-Mother Ysolt', 'priest~ashen', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'volley', 'call'], adds: 'upzealot', lines: { start: 'We watched it pass for eleven minutes. Eleven minutes of something so much bigger than us. How could we not sing to it?', half: 'Sing, children! Sing it up!' } }),
  pitmaw13: boss('The Pit-Maw', 'abom~spectral', { scale: 2.2, mechs: ['pool', 'charge'], lines: { start: '*The bottom of the pit opens a mouth.*', half: '*It swallows the light from your torches.*' } }),
  weepingone13: boss('The Weeping One', 'gravelord~spectral', { hpM: 1.8, scale: 2.2, range: 16, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['pool', 'fear', 'spawn', 'enrage'], adds: 'voidspawn', lines: { start: '*A piece of Vhorun broke off on the way up and fell back. It has been crying ever since. It does not want to be alone.*', half: '*It reaches for you. It just wants to be held.*' } }),
  // the Hollow Spine (instance, 31-32)
  spinewarden13: boss('The Spine-Warden', 'golempet~spectral', { scale: 2.2, weak: 'storm', mechs: ['slam', 'shield'], lines: { start: '*The tunnel Vhorun climbed is lined with something like bone. Something like bone stands up.*', half: '*It locks into the wall and stops feeling pain.*' } }),
  marrowchoir13: boss('The Marrow Choir', 'wraith~spectral', { fly: .5, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley', 'spawn'], adds: 'lightless', lines: { start: '*Voices in the bone of the tunnel, singing the song the Upward Choir learned from them.*', half: '*The song gets louder. Something answers it from below.*' } }),
  thesloughed13: boss('The Sloughed Skin', 'abom~ashen', { scale: 2.4, mechs: ['pool', 'knock', 'charge'], lines: { start: '*Vhorun shed a skin on the way up, like a snake. The skin did not notice that he left.*', half: '*It tears, and keeps coming.*' } }),
  vhorunsshadow13: boss('Vhorun\'s Shadow', 'gravelord~ashen', { hpM: 1.9, scale: 2.4, range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['pool', 'call', 'fear', 'enrage'], adds: 'voidspawn', lines: { start: 'I AM WHAT HE LEFT BEHIND. I AM THE PART OF HIM THAT STILL REMEMBERS THE DARK. YOU SMELL OF THE LAMP.', half: 'COME DOWN. COME DOWN WHERE IT IS QUIET.' } }),
  // the Undergate (24-person raid)
  gatecolossus24: rboss('The Undergate Colossus', 'golempet~ashen', { hpM: 2.4, scale: 3.2, weak: 'storm', resist: 'earth', mechs: ['slam', 'knock', 'shield', 'enrage'], lines: { start: '*The gate the Compact sealed is still here, at the bottom of the Wound. It got up and walked over.*', half: '*Its doors swing open. There is nothing inside but the dark.*' } }),
  hunger24: rboss('Hunger, the First Mouth', 'abom~spectral', { hpM: 2.5, scale: 3, mechs: ['pool', 'charge', 'spawn', 'aura'], school: 'shadow', auraK: .12, adds: 'voidspawn', lines: { start: '*Vhorun was a mouth before he was anything else. This is the mouth he started as.*', half: '*It opens wider. The light in the room leans toward it.*' } }),
  lampthief24: rboss('The Lamp-Thief', 'wraith~ashen', { hpM: 2.3, fly: .6, range: 20, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'volley', 'heal'], lines: { start: 'Forty years she kept it lit. Forty years I waited outside the glass. Now it is mine, and it is going out, and it is DELICIOUS.', half: 'More! Every lamp! Every fire! Every eye!' } }),
  herald24: rboss('The Herald Unbound', 'gravelord~spectral', { hpM: 2.5, scale: 2.6, range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['pool', 'call', 'fear', 'aura'], auraK: .14, adds: 'lightless', lines: { start: 'I stood at the Starless Vault and spoke for him. Now he speaks for himself, and I am free to do what I always wanted to do. I want to put out your light myself.', half: 'Kneel to the one who climbed!' } }),
  firsthand24: rboss('The Hand That Climbed', 'gravelord~ashen', { hpM: 2.8, scale: 3.4, weak: 'holy', resist: 'shadow', school: 'shadow', mechs: ['cleave', 'slam', 'call', 'knock', 'aura', 'enrage'], auraK: .16, adds: 'voidspawn', lines: { start: '*The hand that took hold of the Last Lamp and pulled a god up through a hundred miles of rock. It has let go of him now. It has not let go of the habit of grabbing.*', half: '*It closes into a fist.*' } }),
});
Object.assign(MOB_LORE, { upzealot: 'One of the Upward Choir, who watched Vhorun pass and decided that anything so large must be holy.', hollowwarden: 'A warden of the Lantern Compact who looked at Vhorun as he went by. Mira told them not to look.' });
giver('oswin13', 'Captain Oswin Hale', 'Lampfall Camp · the Lantern Compact', 'bulwark2');
giver('sela13', 'Sela the Unblinking', 'Lampfall Camp · who watched him pass', 'illusionist1');
giver('varga13', 'Commander Ilse Varga', 'Ruinwatch · Corrand\'s Iron Legion', 'bladewarden2');
Object.assign(TALK, {
  oswin13: { bio: 'Oswin Hale was Mira\'s second at Deepwatch for twelve years, and has never once disobeyed an order. He is very much hoping that nobody gives him one he can\'t follow.',
    greet: ["Lampfall Camp. We named it that because it's where the Lamp fell. Some of the lads wanted something cheerier. There wasn't anything.", "Keep your lantern lit and your back to the camp, Lightkeeper. Everything out there came up after him, and none of it likes us."],
    topics: [{ q: 'Where did Vhorun go?', a: ["Out. Up and out, through the rim, and away north-east. Not fast. He doesn't need to be fast. Everything he passes goes dark, and stays dark.", "Whole kingdom out past the March went black in a night. We get refugees with lanterns tied to their wrists. They won't take them off. I don't blame them."] }] },
  sela13: { bio: 'Sela was on watch at Deepwatch the night the Lamp went out, and she watched Vhorun go past for all eleven minutes. She has not blinked since. Nobody is quite sure whether she can.',
    greet: ["I saw him. All of him. Well. The parts of him that went past. There was more.", "Don't look at the bottom of the pit for too long. It looks back. I know. I did."],
    topics: [{ q: 'What did you see?', a: ["Scales. Scales the size of houses, grinding past, and every one had a light in it, a little stolen light, like a lantern in a window.", "And then an eye. Just the once. It looked at me, and it wasn't angry, and it wasn't cruel. It was hungry, the way a baby is hungry. That was the worst part."] }] },
  varga13: { bio: 'Ilse Varga commands what\'s left of Corrand\'s Iron Legion after the sky. She has fought the Gravelord\'s dead, the Halcyon and the Starwrights\' hollow sailors, and she would like, just once, to fight something that bleeds normally.',
    greet: ["The Marshal sent us to hold the rim. The rim is very large and we are not very many. Welcome to Ruinwatch.", "If you see anyone in a white robe singing, they're Upward Choir. Don't let them get close. They bite."],
    topics: [{ q: 'Who are the Upward Choir?', a: ["Miners, traders, a few Compact wardens who should have known better. They were in the deep when he passed, and they heard him, and they've decided he's a god.", "They want to help him eat the light. They say it's a gift. They say once the light's gone we'll all be at peace. I say they're mad, and I say it with a sword."] }] },
});
Object.assign(LORE, {
  scaleshed: { title: 'A Scale the Size of a Door', where: 'woundedge', text: "Propped against a boulder on the Wound's edge, still warm: a single scale, black and smooth, and inside it, like a moth in amber, a tiny trapped light. Someone has scratched beside it, in the rock: THIS WAS SOMEBODY'S CANDLE." },
});
X.VEND = Object.assign(X.VEND || {}, { lampfall: ['Quartermaster Dell', 'bulwark1'], ruinwatch: ['Sutler Pask', 'guard'] });
const W = { zone: 'xw13' }, LA = r => ({ lantern: r }), CR = r => ({ crown: r });
const WILD = ['woundcrawler', 'rockwraith', 'cinderwing', 'hollowhound'], DARK = ['lightless', 'voidspawn', 'hollowwarden'], CHOIR = ['upzealot', 'upcaller'];
for (const m of [...WILD, ...DARK]) Rep.KILL_REP[m] = ['lantern', 6]; for (const m of CHOIR) Rep.KILL_REP[m] = ['crown', 6];
X.arriveHooks.push((zone, from) => zone === 'xw13' ? ({ xm13: { x: -460, z: 0 }, xt13: { x: 0, z: -460 } }[from] || { x: 0, z: 460 }) : zone === 'deep' && from === 'xw13' ? { x: 60, z: -320 } : null);
defineZone('xw13', {
  size: 500, seed: 13013, name: 'The Wound', bossName: 'The Hand That Climbed', hiH: 14, maxSpawnH: 34,
  land: (x, z, N) => { const d = Math.hypot(x, z + 40) / 210; let h = 5 + N.fbm(x * .007, z * .007, 4) * 13 + Math.max(0, N.fbm(x * .02 + 5, z * .02, 3) - .55) * 24; if (d < 1) h = h * (.3 + .7 * d * d) + (d > .82 ? (d - .82) * 70 : 0); else if (d < 1.3) h += (1.3 - d) * 40; return Math.max(1.5, h); },
  pal: PAL_WOUND,
  towns: [{ key: 'lampfall', name: 'Lampfall Camp', x: 0, z: 400, R: 30, wall: 'palisade', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Compact Lantern-Guard', guardKind: 'aegis1',
    houses: [[-12, 10, .4, 'tent', 4, 4], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'hut']], props: [[0, 4, 'bluelamp'], [-6, 0, 'lantern'], [6, 0, 'lantern'], [0, -6, 'banner', '#c8a050']],
    npcs: [['giver', 'oswin13', 0, 0], ['giver', 'sela13', -8, 6], ['vendor', 'lampfall', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 28], [-2, 28], [2, -28], [-2, -28]] },
    { key: 'ruinwatch', name: 'Ruinwatch', x: 330, z: 60, R: 22, wall: 'stones', gates: [Math.PI, Math.PI / 2], guardName: 'Iron Legionary', guardKind: 'bladewarden1',
      houses: [[-6, 6, .3, 'tent'], [6, -6, -.4, 'hut']], props: [[0, 0, 'banner', '#8a2a22'], [4, 4, 'lantern']],
      npcs: [['giver', 'varga13', -5, -2], ['vendor', 'ruinwatch', 6, -4], ['bind', null, 0, 6]], guards: [[-20, 2], [-20, -2]] }],
  roads: [[0, 370, 0, 240], [0, 240, 300, 80], [0, 240, -260, 100]],
  regions: { names: ['The Lampfall Rim', 'The Iron Rim', 'The Shattered Halls', 'The Wound', 'The Undergate'], fn: (x, z) => z > 230 ? 0 : z < -300 ? 4 : x > 160 ? 1 : x < -160 ? 2 : 3 },
  open: [{ key: 'shatteredhalls', name: 'The Shattered Halls', x: -320, z: 80, R: 34, deco: 'dead', decoN: 16, ring: true, gap: 0, centre: 'statue', lvl: [30, 31], area: 2,
      packs: [[-18, 0, ['hollowwarden', 'hollowwarden', 'lightless']], [18, 0, ['rockwraith', 'hollowwarden']], [0, -18, ['lightless', 'lightless', 'gloomcaster']], [0, 18, ['hollowwarden', 'rockwraith', 'lightless']]],
      bosses: [[-22, -18, 'wardenbrask13', 30], [22, -20, 'lampeater13', 31], [0, -4, 'hallsheart13', 31, true]] },
    { key: 'weepingpit', name: 'The Weeping Pit', x: 0, z: -60, R: 34, deco: 'crystal', decoN: 14, centre: 'stonecircle', lvl: [31, 32], area: 3,
      packs: [[-18, 0, ['upzealot', 'upzealot', 'upcaller']], [18, 0, ['voidspawn', 'lightless']], [0, -18, ['upcaller', 'upzealot', 'voidspawn']], [0, 18, ['voidspawn', 'voidspawn']]],
      bosses: [[-22, -18, 'mournvoice13', 31], [22, -20, 'pitmaw13', 32], [0, -4, 'weepingone13', 32, true]] }],
  doors: [{ to: 'hollowspine', name: 'The Hollow Spine', x: 300, z: -260, ry: 0, label: 'Enter the Hollow Spine (31-32)', col: '#b05aff' },
    { to: 'undergate', name: 'The Undergate', x: 40, z: -420, ry: 0, label: 'Go down through the Undergate (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: -150, z: -220, name: 'The Last Warden', R: 14, clear: 10, s: 1.8 }],
  lines: [{ x: 0, z: 488, to: 'deep', label: 'Climb back down to Deepwatch', ry: Math.PI }, { x: -488, z: 0, to: 'xm13', label: 'West into the Lightless March', ry: -Math.PI / 2, why: () => (S.hero?.lvl || 0) < 31 ? 'The Lightless March is for level 31 and beyond.' : null },
    { x: 0, z: -488, to: 'xt13', label: 'Follow the trail of darkness to the Throat of the World', ry: 0, why: () => (S.hero?.lvl || 0) < 34 ? 'The Throat of the World is for level 34 and beyond.' : S.quests.xw6?.state !== 'turned' ? 'Nobody has gone that way and come back. Not yet.' : null }],
  spots: { lampfall: { x: 0, z: 390 }, woundedge: { x: 0, z: 290 }, ironrim: { x: 300, z: 120 }, halls: { x: -320, z: 80 }, pit: { x: 0, z: -60 }, spine: { x: 300, z: -250 }, undergate: { x: 40, z: -410 }, lastwarden: { x: -150, z: -220 } },
  scatter: [[40, [-480, 480, 230, 480], ['woundcrawler', 'cinderwing', 'hollowhound'], [30, 31], 0], [44, [160, 480, -300, 230], ['rockwraith', 'woundcrawler', 'cinderwing', 'upzealot'], [30, 31], 1],
    [44, [-480, -160, -300, 230], ['hollowwarden', 'lightless', 'rockwraith', 'gloomcaster'], [30, 31], 2], [44, [-160, 160, -300, 230], ['voidspawn', 'lightless', 'hollowhound', 'woundcrawler'], [31, 32], 3],
    [44, [-480, 480, -480, -300], ['voidspawn', 'lightless', 'gloomcaster', 'rockwraith'], [31, 32], 4]],
  camps: [[6, [160, 480, -300, 230], ['upzealot', 'upzealot', 'upcaller'], [30, 31], 1, 'uc'], [6, [-160, 160, -300, 230], ['upzealot', 'upcaller', 'upcaller'], [31, 32], 3, 'up']],
  rares: [[[160, 480, -300, 230], 'thegnaw13', 31, false], [[-480, -160, -300, 230], 'mothermaw13', 31, true]],
  hunt: [{ area: 0, lvl: [30, 31] }, { area: 1, lvl: [30, 31] }, { area: 2, lvl: [30, 31] }, { area: 3, lvl: [31, 32] }, { area: 4, lvl: [31, 32] }],
  labels: [{ t: 'Crawlers, cinderwings (30-31)', x: 0, z: 300 }, { t: 'The Iron Rim (30-31)', x: 300, z: 140 }, { t: 'The Shattered Halls (30-31)', x: -300, z: 160 }, { t: 'The Wound (31-32)', x: 0, z: 40 }, { t: 'The Undergate (31-32)', x: 0, z: -360 }],
  nodes: [['voidiron', 'ore', 'oresilver', 150, null, 26], ['gloomcap', 'herb', 'herbgrave', 150, null, 26]],
  scenery: { density: 14000, tuft: '#6a5a4a', kinds: [['dead', .03, 1, 2], ['icerock', .02, .8, 2.2], ['crystal', .004, .8, 1.4]] },
  sky: { fog: '#3a302a', top: '#1a1418', hor: '#5a4438', k: .6, far: 200 },
});
defineDungeon({ key: 'hollowspine', name: 'The Hollow Spine', parent: 'xw13', plan: 'winding', floor: '#5a5048', rock: '#1a1614', fog: '#2a201c', light: .45, lvl: [31, 32], prop: 'bluelamp',
  mobs: ['lightless', 'voidspawn', 'hollowwarden', 'gloomcaster'], bosses: ['spinewarden13', 'marrowchoir13', 'thesloughed13', 'vhorunsshadow13'], exitLabel: 'Back out to the Wound' });
defineDungeon({ key: 'undergate', name: 'The Undergate', parent: 'xw13', plan: 'nave', floor: '#4a4040', rock: '#140e0e', fog: '#2a1a1a', light: .42, lvl: [35, 35], prop: 'bluelamp', raid: true,
  mobs: ['lightless', 'voidspawn', 'hollowwarden', 'gloomcaster', 'upcaller'], bosses: ['gatecolossus24', 'hunger24', 'lampthief24', 'herald24', 'firsthand24'], exitLabel: 'Climb back up into the Wound' });
addDungeon35('hollowspine', 'The Hollow Spine', [31, 32]); addRaid24('undergate', 'The Undergate');
tier({ shatteredhalls: 13, weepingpit: 13, hollowspine: 13, undergate: 16 });

QUESTS.push(...finish35([
  { id: 'xw1', story: true, giver: 'oswin13', lvl: 30, pre: 'xv1', name: 'The Edge of the Wound', where: 'woundedge', ...W, rep: LA(300), obj: { kill: [...WILD, 'lightless'], n: 12, near: 'woundedge', nearR: 230, what: 'Clear 12 creatures from the edge of the Wound around Lampfall Camp' },
    say: ["Welcome to Lampfall, Lightkeeper. Mira sent word you were coming. She also sent word that she's coming herself, as soon as her hands stop shaking, so don't tell her I said they were shaking.", "Everything that lived in the deep came up after him, the way gulls follow a ship. Twelve of them, between here and the rim, so my lads can put a wall up without being eaten while they do it."],
    done: ["A wall. A real one. You've no idea how good a wall looks when the thing you're hiding from is the size of a mountain."] },
  { id: 'xw2', story: true, giver: 'sela13', lvl: 30, pre: 'xw1', name: 'What Passed Us By', where: 'woundedge', ...W, rep: LA(300), obj: { collect: ['voidspawn', 'woundcrawler', 'rockwraith', 'lightless'], item: 'Shed Scale', chance: .45, n: 6, what: 'Gather 6 shed scales from the creatures of the Wound' },
    say: ["He shed scales all the way up. Every one of them has a light inside it, a little stolen light. A candle, a hearth, a lantern, a pair of eyes.", "The things down there eat them. Bring me six. I want to look at what he took. Somebody should."],
    done: ["Look. This one was a cooking fire. This one was a lighthouse. This one... this one was a child's nightlight, I think. Little. Blue.", "He's not taking the light to see by, Lightkeeper. He's taking it to be full. And he isn't full. I don't think he can be."] },
  { id: 'xw3', story: true, giver: 'oswin13', lvl: 31, pre: 'xw2', name: 'The Shattered Halls', where: 'halls', ...W, rep: LA(400), obj: { named: 'hallsheart13', n: 1, what: 'Clear the Shattered Halls on the western rim, and break the Torn Heart' },
    say: ["When he went up, he took the top of Deepwatch with him. The upper halls, the barracks, the old chapel. They came down on the western rim, upside down, with my wardens still in them.", "The ones who looked at him aren't my wardens any more. Brask is in there. He was my friend. And the foundation stone of the whole hall has got up and started walking about. Put them to rest. All of them."],
    done: ["Brask. Did he... was there anything of him left? No. Don't tell me. I'll ask Mira to light a candle. She'll want to light it herself."] },
  { id: 'xw4', story: true, giver: 'varga13', lvl: 31, pre: 'xw1', name: 'Corrand Holds the Rim', where: 'ironrim', ...W, rep: CR(400), obj: { kill: CHOIR, n: 12, near: 'ironrim', nearR: 260, what: 'Break 12 of the Upward Choir on the eastern rim' },
    say: ["The Upward Choir have set up along the eastern rim. They sit on the edge and sing down into the dark, and every so often something comes up to see who's singing.", "Twelve of them, Lightkeeper. I don't care how pretty their voices are. Every time they sing, I lose a sentry."],
    done: ["Quiet. Do you hear that? That's my sentries snoring. I've never been so glad to hear a man asleep on duty."] },
  { id: 'xw5', story: true, giver: 'sela13', lvl: 31, pre: 'xw3', name: 'The Weeping Pit', where: 'pit', ...W, rep: LA(400), obj: { named: 'weepingone13', n: 1, what: 'Go down into the Weeping Pit, past the Choir-Mother, and end the Weeping One' },
    say: ["At the bottom of the Wound there's a pit, and in the pit there's something crying. It's been crying since the night he passed. The Choir-Mother sits beside it and sings it lullabies.", "It's a piece of him. It broke off on the way up and fell back down, and it's alone, and it knows it. I've listened to it for a week. Please. Make it stop. For both our sakes."],
    done: ["It's stopped. I can hear the wind again. I didn't know you could hear the wind from here.", "Do you know what it said, at the end? I heard it. It said 'wait for me'. Over and over. He didn't wait. He's never waited for anything."] },
  { id: 'xw6', story: true, giver: 'oswin13', lvl: 32, pre: 'xw5', pre2: 'xw4', name: 'The Hollow Spine', where: 'spine', ...W, rep: LA(600), obj: { named: 'vhorunsshadow13', n: 1, what: 'Climb the Hollow Spine, the tunnel he made coming up, and defeat Vhorun\'s Shadow' },
    say: ["The tunnel he climbed is still there, on the south-east rim. We call it the Spine. It's lined with bone, or something like bone, and at the top of it there's a shadow that didn't keep up with him.", "Kill his shadow, Lightkeeper. Then we'll know which way he went, and we can stop guessing."],
    done: [['oswin13', "Two roads, then. West, into the March, where the dark's thickest and the Lightless King sits on his throne. And north, past Kaldmark, where the Frost-King's halls have opened again under the ice."], ['oswin13', "And somewhere past both, the Throat of the World, where Vhorun's lying down to eat. One step at a time. One light at a time."]] },
  { id: 'xw7', story: true, giver: 'oswin13', lvl: 35, needLvl: 35, pre: 'xw6', name: 'The Undergate', where: 'undergate', ...W, rep: LA(1000), obj: { named: 'firsthand24', n: 1, what: 'Go down through the Undergate and defeat the Hand That Climbed (24-person raid)' },
    say: ["The Undergate is where the Compact sealed the deep, a thousand years ago. It's at the bottom of the Wound now, and it's open, and everything that he left behind is waiting there.", "The hand that pulled him up is there. Mira says that if we cut it off, he can never climb back down to hide. Raise twenty-four, Lightkeeper. Twelve won't do it. Twenty-four might."],
    done: [['oswin13', "The Hand is dead. I watched it fall from the rim, and I watched Mira cry, and I didn't say anything because I was crying too."], ['oswin13', "He can't go back down now. Whatever happens next, it happens up here, in the light. In our light."]] },
  { id: 'xwx1', giver: 'varga13', lvl: 31, pre: 'xw4', name: 'The Gnaw', where: 'ironrim', ...W, rep: CR(250), obj: { named: 'thegnaw13', n: 1, what: 'Hunt down the Gnaw, the great crawler of the eastern rim' },
    say: ["There's a crawler on the rim the size of a carriage. My lads call it the Gnaw, on account of what it does. It's had three sentries and a mule. I liked that mule."],
    done: ["That's the Gnaw? It's bigger dead. Things usually look smaller dead. I'll have the mule avenged on the regimental roll."] },
  { id: 'xwx2', giver: 'sela13', lvl: 31, pre: 'xw2', name: 'Lamp-Glass', where: 'woundedge', ...W, rep: LA(250), obj: { collect: ['cinderwing', 'rockwraith'], item: 'Shard of Lamp-Glass', chance: .5, n: 8, what: 'Gather 8 shards of the Last Lamp\'s glass from cinderwings and rock-wraiths' },
    say: ["When the Lamp went out, its glass shattered and went up with him. The cinderwings nest with it and the rock-wraiths have it in their bellies.", "Eight pieces. Mira wants to build it again. I don't think it can be built again. But I'd like to watch her try."],
    done: ["Eight. Oh, look at them. Still warm. She's going to cry. I'm going to let her."] },
  { id: 'xwy1', daily: true, giver: 'oswin13', lvl: 31, pre: 'xw1', name: 'Daily: Keep the Rim Lit', ...W, rep: LA(200), obj: { kill: [...WILD, ...DARK], n: 12, what: 'Defeat 12 creatures of the Wound' },
    say: ["Every night they come up the slope at us. Every morning we push them back down. Twelve, if you've the time. I'll have the cook save you something."], done: ["Back down they go. See you tomorrow."] },
  { id: 'xwy2', daily: true, giver: 'varga13', lvl: 32, pre: 'xw4', name: 'Daily: Silence the Choir', ...W, rep: CR(200), obj: { kill: CHOIR, n: 10, what: 'Defeat 10 of the Upward Choir' },
    say: ["They're singing again. Ten of them. I know you know the drill."], done: ["Silence. Beautiful, blessed silence."] },
]));
