// Build 13: the Throat of the World (levels 34-35). Where Vhorun lay down to eat. The land around him is chewed
// to the bone, the sky is full of the lights he swallowed, and the Starwrights who made him have come down to
// watch. At the bottom of the Throat is the last 24-person raid, and the One Beneath himself.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { finish35, addDungeon35, addRaid24, PAL_THROAT, st13 } from './vh13.js';
import { pfill } from './vf13.js';

Object.assign(MOBS, {
  gnawling: mob('Gnawling', 'ghoul~ashen', { ...B, hpM: 1.3, spd: 6, weak: 'holy', resist: 'shadow' }),
  hungering: mob('The Hungering', 'abom~ashen', { hpM: 1.7, spd: 4.2, scale: 1.05, weak: 'holy', resist: 'shadow', ore: true }),
  hosthound: mob('Host of the One Beneath', 'bladewarden2~ashen', { ...U, hpM: 1.5, weak: 'holy', resist: 'shadow' }),
  emptyeyed: mob('Empty-Eyed Pilgrim', 'villager1~ashen', { ...HU, hpM: 1.1, range: 16, ranged: true, caster: true, school: 'shadow', weak: 'holy' }),
  starwatcher: mob('Starwright Watcher', 'wraith~gilded', { hpM: 1.3, fly: .5, range: 20, ranged: true, caster: true, school: 'storm', weak: 'shadow', resist: 'holy', scale: 1.3 }),
  // named
  greedmaw13: boss('Greedmaw', 'abom~spectral', { scale: 2, mechs: ['pool', 'charge'] }),
  pilgrimqueen13: boss('The Pilgrim Queen', 'queen~ashen', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'call'], adds: 'emptyeyed' }),
  // the Gnawed Plain (open)
  gnawking13: boss('The Gnawling King', 'ghoul~spectral', { ...B, scale: 2, mechs: ['charge', 'spawn'], adds: 'gnawling', lines: { start: '*The biggest of the things that live on his crumbs. It has grown fat on scraps of a god.*', half: '*It screeches, and the plain answers.*' } }),
  eatenknight13: boss('Ser Halvane, Half-Eaten', 'bulwark2~ashen', { ...U, mechs: ['cleave', 'shield'], lines: { start: 'He ate half of me. Just half. He said the other half was for later. I have been waiting for later ever since.', half: 'Is it later? Is it later yet?' } }),
  plainmaw13: boss('The Mouth in the Plain', 'abom~ashen', { hpM: 1.8, scale: 2.6, mechs: ['pool', 'knock', 'spawn', 'enrage'], adds: 'hungering', lines: { start: '*The ground opens like a jaw. It is not the ground.*', half: '*It bites down, and the whole plain shakes.*' } }),
  // the Ribs of the World (open)
  ribwarden13: boss('The Rib-Warden', 'golempet~ashen', { scale: 2.2, weak: 'storm', mechs: ['slam', 'shield'], lines: { start: '*His ribs rise out of the ground like the pillars of a cathedral. Something guards them.*', half: '*It braces against a rib, and the rib braces back.*' } }),
  starherald13: boss('Ossiel, Herald of the Starwrights', 'wraith~gilded', { range: 20, ranged: true, caster: true, school: 'storm', resist: 'holy', mechs: ['volley', 'pool', 'heal'], lines: { start: 'We did not come to fight. We came to collect our child. You are in the way. Please move.', half: 'This is a family matter.' } }),
  ribheart13: boss('The Ribcage Choir', 'choir', { hpM: 1.8, fly: .5, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley', 'call', 'enrage'], adds: 'emptyeyed', lines: { start: '*The pilgrims who walked into his mouth are still singing, inside his ribs. They are very happy. They want you to be happy too.*', half: '*The song becomes a chant. The chant becomes a scream.*' } }),
  // the Heartless Deep (instance, 34-35)
  hd_guard13: boss('The Gullet-Guard', 'troll~ashen', { scale: 1.9, mechs: ['cleave', 'knock'], lines: { start: '*It lives in his throat, like a parasite. It does not want to share.*', half: '*It roars, and the throat contracts.*' } }),
  hd_lights13: boss('The Swallowed Lights', 'firepet~gilded', { scale: 2.2, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'pool', 'spawn'], adds: 'starwatcher', lines: { start: '*Every light he ever ate, a thousand candles and lanterns and hearths, knotted together and burning in the dark of his belly. It does not know who it is.*', half: '*Some of the lights remember they were somebody\'s.*' } }),
  hd_digest13: boss('The Digesting', 'abom~spectral', { scale: 2.4, mechs: ['pool', 'web', 'charge'], lines: { start: '*Deeper in, something is breaking down everything he swallows. Including, it hopes, you.*', half: '*The walls start to squeeze.*' } }),
  vhorunsheart13: boss('The Heart That Hungers', 'golempet~spectral', { hpM: 2, scale: 2.8, weak: 'holy', resist: 'shadow', school: 'shadow', mechs: ['slam', 'pool', 'call', 'enrage'], adds: 'hungering', lines: { start: '*His heart. It beats once a minute, and every beat is a hunger so big the walls of the Deep echo with it.*', half: '*It beats faster. Something above you stirs.*' } }),
  // the Throat of the World (24-person raid)
  gullet24: rboss('The Gullet Guardians', 'troll~ashen', { hpM: 2.4, scale: 2.4, mechs: ['cleave', 'slam', 'call'], adds: 'hosthound', lines: { start: '*Two giants at the top of the Throat, keeping it clear of anything that would stop the eating.*', half: '*One of them bellows for help. Help comes.*' } }),
  teeth24: rboss('The Teeth of the World', 'golempet~ashen', { hpM: 2.5, scale: 3, weak: 'storm', mechs: ['slam', 'knock', 'pool', 'enrage'], lines: { start: '*His teeth. Each one the size of a tower. One of them has broken loose and is grinding its way toward you.*', half: '*It splits, and keeps grinding.*' } }),
  stolenlight24: rboss('Everything He Ate', 'firepet~gilded', { hpM: 2.4, scale: 2.8, range: 20, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'pool', 'heal', 'aura'], auraK: .12, lines: { start: '*All the light Vhorun has ever eaten, every hearth and candle and eye, burning in one place. It is beautiful, and it is in agony, and it is trying to get out through you.*', half: '*Some of the lights break away and drift upward, free. The rest burn hotter.*' } }),
  aumel24: rboss('Aumel of the Starwrights', 'wraith~gilded', { hpM: 2.5, scale: 2, fly: .6, range: 20, ranged: true, caster: true, school: 'storm', resist: 'holy', mechs: ['volley', 'pool', 'knock', 'heal', 'aura'], auraK: .12, lines: { start: 'We made him. We made him hungry, because hunger is how things grow, and we wanted him to grow. He belongs to us. Stand aside, child of the ground.', half: 'Then we will take him from your hands.' } }),
  vhorun24: rboss('Vhorun, the One Beneath', 'leviathan~ashen', { hpM: 3.4, scale: 1.6, weak: 'holy', resist: 'shadow', school: 'shadow', range: 6, mechs: ['cleave', 'pool', 'call', 'fear', 'knock', 'aura', 'spawn', 'enrage'], auraK: .2, adds: 'voidspawn', lines: { start: '*He opens one eye. It is not angry. It is not cruel. It is hungry, the way a baby is hungry. And you are so very, very bright.*', half: '*He uncoils. The Throat of the World shakes, and every light in the sky flickers.*' } }),
});
Object.assign(MOB_LORE, { starwatcher: 'One of the Starwrights, who made Vhorun long ago, come down out of the dark above the sky to take back what they made.', vhorun24: 'Vhorun, the One Beneath, who the Starwrights made too hungry, and who has been eating the light of the world from underneath it for longer than there have been people.' });
giver('mira13', 'Mira of the Compact', 'The Last Light · the Lantern Compact', 'aegis2');
giver('iven13', 'Keeper Iven', 'Ember Watch · the Last Light', 'cleric1');
Object.assign(TALK, {
  mira13: { bio: 'Mira kept the Last Lamp for forty years and watched it go out. She has followed Vhorun across half the world with a lantern in her hand, and she has stopped shaking.',
    greet: ["The Last Light. That's what we're calling the camp. If he eats this one, there won't be another.", "Look up. All those lights in the sky, drifting about. Every one of them is something he ate. They're trying to find their way home."],
    topics: [{ q: 'Can we really kill him?', a: ["I don't know. Nobody's ever tried. Nobody's ever been able to get close enough. He's always been under us, a hundred miles down.", "But he came up. He's in reach. And he's tired, Lightkeeper. He climbed a hundred miles and he's lying down to eat, the way a snake does after a big meal. If there's ever a time, it's now."] }] },
  iven13: { bio: 'Iven was a priest of a temple in Corrandel that kept a flame lit for six hundred years. Vhorun ate the flame from three hundred miles away. Iven walked here to ask for it back.',
    greet: ["Ember Watch. We keep a single ember, from the last fire in the last village before the Throat. If it goes out, we go home.", "Do you see that light, up there, the blue one? That was my temple's flame. I'd know it anywhere. It's so close."],
    topics: [] },
});
Object.assign(LORE, {
  starwrightnote: { title: 'A Starwright\'s Notes', where: 'ribs', text: "Found where a Starwright stood, written in light that is slowly fading: 'Specimen four hundred and twelve. Designation: Vhorun. Purpose: to grow. Status: grew. Note: we may have made him too hungry. Note: we may have made all of them too hungry. Recommend recovery before the others notice. Recommend we do not tell the others.'" },
});
X.VEND = Object.assign(X.VEND || {}, { lastlight: ['Quartermaster Dell', 'bulwark1'], emberwatch: ['Brother Fen', 'villager3'] });
const T = { zone: 'xt13' }, LA = r => ({ lantern: r });
const BIT = ['gnawling', 'hungering', 'hosthound', 'voidspawn'], PILG = ['emptyeyed', 'starwatcher'];
for (const m of [...BIT, ...PILG]) Rep.KILL_REP[m] = ['lantern', 6];
X.arriveHooks.push((zone, from) => zone === 'xt13' ? ({ xm13: { x: -460, z: 200 } }[from] || { x: 0, z: 460 }) : zone === 'xm13' && from === 'xt13' ? { x: 0, z: -460 } : null);
defineZone('xt13', {
  size: 500, seed: 13071, name: 'The Throat of the World', bossName: 'Vhorun, the One Beneath', hiH: 14, maxSpawnH: 30,
  land: (x, z, N) => { const d = Math.hypot(x, z + 300) / 160; let h = 4 + N.fbm(x * .006, z * .006, 4) * 14 + Math.abs(Math.sin(x * .02)) * Math.max(0, N.fbm(x * .01, z * .01, 2) - .4) * 20; if (d < 1) h *= .3 + .7 * d; return Math.max(1.5, h); },
  pal: PAL_THROAT,
  towns: [{ key: 'lastlight', name: 'The Last Light', x: 0, z: 400, R: 30, wall: 'palisade', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Compact Lantern-Guard', guardKind: 'aegis1',
    houses: [[-12, 10, .4, 'tent', 4, 4], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'tent', 4, 4]], props: [[0, 4, 'bluelamp'], [-6, 0, 'lantern'], [6, 0, 'lantern'], [0, -6, 'banner', '#c8a050']],
    npcs: [['giver', 'mira13', 0, 0], ['giver', 'ammara', -8, 6], ['vendor', 'lastlight', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 28], [-2, 28], [2, -28], [-2, -28]] },
    { key: 'emberwatch', name: 'Ember Watch', x: 320, z: 60, R: 22, wall: 'stones', gates: [Math.PI, Math.PI / 2], guardName: 'Ember-Keeper', guardKind: 'cleric1',
      houses: [[-6, 6, .3, 'tent'], [6, -6, -.4, 'hut']], props: [[0, 0, 'lantern'], [4, 4, 'banner', '#ff9a3a']],
      npcs: [['giver', 'iven13', -5, -2], ['vendor', 'emberwatch', 6, -4], ['bind', null, 0, 6]], guards: [[-20, 2], [-20, -2]] }],
  roads: [[0, 470, 0, 360], [0, 360, 40, 140], [40, 140, 300, 60], [40, 140, -300, 40]],
  regions: { names: ['The Last Light', 'Ember Watch', 'The Gnawed Plain', 'The Ribs of the World', 'The Throat'], fn: (x, z) => z > 240 ? 0 : z < -180 ? 4 : x > 160 ? 1 : x < -160 ? 2 : 3 },
  open: [{ key: 'gnawedplain', name: 'The Gnawed Plain', x: -300, z: 40, R: 34, deco: 'dead', decoN: 14, ring: true, gap: 0, centre: 'statue', lvl: [34, 34], area: 2,
      packs: [[-18, 0, ['gnawling', 'gnawling', 'hungering']], [18, 0, ['hosthound', 'gnawling']], [0, -18, ['hungering', 'gnawling', 'gnawling']], [0, 18, ['hosthound', 'hosthound']]],
      bosses: [[-22, -18, 'gnawking13', 34], [22, -20, 'eatenknight13', 34], [0, -4, 'plainmaw13', 34, true]] },
    { key: 'ribs', name: 'The Ribs of the World', x: 60, z: -80, R: 34, deco: 'crystal', decoN: 16, centre: 'stonecircle', lvl: [34, 35], area: 3,
      packs: [[-18, 0, ['emptyeyed', 'emptyeyed', 'hosthound']], [18, 0, ['starwatcher', 'starwatcher']], [0, -18, ['emptyeyed', 'starwatcher', 'hungering']], [0, 18, ['hosthound', 'emptyeyed']]],
      bosses: [[-22, -18, 'ribwarden13', 34], [22, -20, 'starherald13', 35], [0, -4, 'ribheart13', 35, true]] }],
  doors: [{ to: 'heartless', name: 'The Heartless Deep', x: 300, z: -260, ry: 0, label: 'Climb down into the Heartless Deep (34-35)', col: '#b05aff' },
    { to: 'throat', name: 'The Throat of the World', x: 0, z: -400, ry: 0, label: 'Go down the Throat of the World (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: -200, z: -260, name: 'The Last Pilgrim', R: 14, clear: 10, s: 1.8 }],
  lines: [{ x: 0, z: 488, to: 'xw13', label: 'Back up the trail to the Wound', ry: Math.PI }, { x: -488, z: 200, to: 'xm13', label: 'North-east into the Lightless March', ry: -Math.PI / 2 }],
  spots: { lastlight: { x: 0, z: 390 }, outskirts: { x: 40, z: 280 }, emberwatch: { x: 320, z: 60 }, plain: { x: -300, z: 40 }, ribs: { x: 60, z: -80 }, heartless: { x: 300, z: -250 }, throatgate: { x: 0, z: -390 }, lastpilgrim: { x: -200, z: -260 } },
  scatter: [[44, [-480, 480, 240, 480], ['gnawling', 'hosthound', 'voidspawn'], [34, 34], 0], [40, [160, 480, -180, 240], ['hungering', 'gnawling', 'starwatcher'], [34, 35], 1],
    [44, [-480, -160, -180, 240], ['gnawling', 'hungering', 'hosthound'], [34, 34], 2], [44, [-160, 160, -180, 240], ['emptyeyed', 'starwatcher', 'hosthound'], [34, 35], 3],
    [48, [-480, 480, -480, -180], ['voidspawn', 'hosthound', 'hungering', 'emptyeyed'], [35, 35], 4]],
  camps: [[6, [-160, 160, -180, 240], ['emptyeyed', 'emptyeyed', 'hosthound'], [34, 35], 3, 'ep'], [6, [-480, 480, -480, -180], ['hosthound', 'hosthound', 'emptyeyed'], [35, 35], 4, 'hh']],
  rares: [[[-480, -160, -180, 240], 'greedmaw13', 35, false], [[-160, 160, -180, 240], 'pilgrimqueen13', 35, true]],
  hunt: [{ area: 0, lvl: [34, 34] }, { area: 1, lvl: [34, 35] }, { area: 2, lvl: [34, 34] }, { area: 3, lvl: [34, 35] }, { area: 4, lvl: [35, 35] }],
  labels: [{ t: 'The outskirts (34)', x: 0, z: 300 }, { t: 'Ember Watch (34-35)', x: 300, z: 140 }, { t: 'The Gnawed Plain (34)', x: -300, z: 120 }, { t: 'The Ribs (34-35)', x: 60, z: 0 }, { t: 'The Throat (35)', x: 0, z: -320 }],
  nodes: [['voidiron', 'ore', 'oresilver', 150, null, 22], ['gloomcap', 'herb', 'herbgrave', 150, null, 26]],
  scenery: { density: 12000, tuft: '#4a2a3a', kinds: [['dead', .03, 1.2, 2.6], ['crystal', .01, .8, 2], ['icerock', .01, .8, 1.6]] },
  sky: { fog: '#2a1820', top: '#0a0610', hor: '#4a2a3a', k: .65, far: 180 },
});
defineDungeon({ key: 'heartless', name: 'The Heartless Deep', parent: 'xt13', plan: 'winding', floor: '#4a2a34', rock: '#140810', fog: '#2a1018', light: .42, lvl: [34, 35], prop: 'bluelamp',
  mobs: ['hungering', 'hosthound', 'voidspawn', 'gnawling'], bosses: ['hd_guard13', 'hd_lights13', 'hd_digest13', 'vhorunsheart13'], exitLabel: 'Climb back out of the Deep' });
defineDungeon({ key: 'throat', name: 'The Throat of the World', parent: 'xt13', plan: 'nave', floor: '#3a1e28', rock: '#0e0408', fog: '#1e0a12', light: .4, lvl: [35, 35], prop: 'bluelamp', raid: true,
  mobs: ['hosthound', 'hungering', 'voidspawn', 'emptyeyed', 'starwatcher'], bosses: ['gullet24', 'teeth24', 'stolenlight24', 'aumel24', 'vhorun24'], exitLabel: 'Climb back up out of the Throat' });
addDungeon35('heartless', 'The Heartless Deep', [34, 35]); addRaid24('throat', 'The Throat of the World');
tier({ gnawedplain: 14, ribs: 14, heartless: 14, throat: 16 });

// ---------- when Vhorun falls ----------
X.kill.push(m => {
  if (m.mob !== 'vhorun24' || st13().vhorunDead) return;
  st13().vhorunDead = true;
  chat('sys', null, 'Vhorun, the One Beneath, is dead. All over the world, lights that went out a month ago flicker, and catch, and burn.');
  setTimeout(() => chat('sys', null, 'Vhorun\'s host falls back from every town at once. The invasions are over.'), 4000);
});
QUESTS.push(...finish35([
  { id: 'xt1', story: true, giver: 'mira13', lvl: 34, pre: 'xw6', when: () => S.quests.xm6?.state === 'turned' || S.quests.xf6?.state === 'turned', name: 'The Throat of the World', where: 'outskirts', ...T, rep: LA(400), obj: { kill: BIT, n: 12, near: 'outskirts', nearR: 240, what: 'Clear 12 of the things living on Vhorun\'s crumbs around the Last Light' },
    say: ["I stopped shaking, you'll be glad to hear. Somewhere around the March. I just ran out of shake.", "He's here, Lightkeeper. Lying down in the Throat of the World, eating. Everything around him lives on the crumbs. Twelve of them, so we can light the camp's last lamp without them coming to eat it."],
    done: ["There. The Last Light is lit. It's only a little lamp. But it's ours, and he can see it from where he's lying, and I want him to."] },
  { id: 'xt2', story: true, giver: 'ammara', lvl: 34, pre: 'xt1', name: 'The Starwrights Are Watching', where: 'ribs', ...T, rep: LA(400), obj: { collect: ['starwatcher'], item: 'Starwright Lens', chance: .55, n: 6, what: 'Take 6 lenses from the Starwright watchers among his ribs' },
    say: ["You remember me? From the Stormreach? I ran from the Starwrights before they could ask my name. I came here because they did. They're here, Lightkeeper. Watching him.", "They carry lenses, to see across the dark. Bring me six. I want to know what they see when they look at him. I want to know what they're planning."],
    done: ["I looked through one. They don't see a monster. They see a child. Their child. Hungry, and lost, and theirs.", "They're going to try to take him. Whatever's left of him. I don't know if that's better or worse."] },
  { id: 'xt3', story: true, giver: 'iven13', lvl: 34, pre: 'xt1', name: 'The Gnawed Plain', where: 'plain', ...T, rep: LA(500), obj: { named: 'plainmaw13', n: 1, what: 'Cross the Gnawed Plain and destroy the Mouth in the Plain' },
    say: ["West of the camp the ground is all bite-marks. He chewed it on his way in. Something lives in the biggest bite: a mouth that opens in the ground and swallows anyone who walks over it.", "My flame is somewhere on the other side. Close that mouth for me, Lightkeeper. Please. I'm old, and I walked a long way."],
    done: ["Thank you. I could see the blue light moving, while you fought. As if it was cheering. I'm sure that's foolish. I'm going to believe it anyway."] },
  { id: 'xt4', story: true, giver: 'ammara', lvl: 35, pre: 'xt2', name: 'The Ribs of the World', where: 'ribs', ...T, rep: LA(500), obj: { named: 'ribheart13', n: 1, what: 'Go into the Ribs of the World, past the Starwright herald, and silence the Ribcage Choir' },
    say: ["His ribs come up out of the ground like a cathedral, and the pilgrims who walked into his mouth are still singing inside them. A Starwright herald stands guard there, keeping the singers safe.", "Silence the Choir. It's keeping him calm, and a calm Vhorun is a Vhorun who'll let the Starwrights walk right up to him."],
    done: ["The herald spoke to you? What did it say? ...'A family matter'. They always say that. They said it to the Empress, before they asked for everyone's names."] },
  { id: 'xt5', story: true, giver: 'mira13', lvl: 35, pre: 'xt3', pre2: 'xt4', name: 'The Heartless Deep', where: 'heartless', ...T, rep: LA(600), obj: { named: 'vhorunsheart13', n: 1, what: 'Climb down into the Heartless Deep and stop the Heart That Hungers' },
    say: ["There's a way into him. Into his body, I mean. A crack in his side that goes down to his heart. It beats once a minute and every time it beats, the lights in the sky flicker.", "If you stop his heart, he'll be weak. Not dead. He's too big to die of anything as small as a heart. But weak. Weak enough to fight."],
    done: ["Did you feel the ground? Every light in the sky went dim, all at once, and then came back brighter. He's weak. He knows we're coming."] },
  { id: 'xt6', story: true, giver: 'mira13', lvl: 35, needLvl: 35, pre: 'xt5', pre2: 'xw7', pre3: 'xm7', name: 'The One Beneath', where: 'throatgate', ...T, rep: LA(1500), obj: { named: 'vhorun24', n: 1, what: 'Go down the Throat of the World and defeat Vhorun, the One Beneath (24-person raid)' },
    get say() { return ["Everyone's here. The Compact, Corrand's Legion, the Candlehold Free, the Thawborn. They've all come to the Last Light, and they've all brought a lantern.", (S.friends || []).some(f => f.parent) ? pfill("Your {rel} is here too. {She} said to tell you {she}'s not letting you go down there on your own, and that this isn't up for discussion. I like {her}.") : "Your friends are here too. All of them. Nobody's letting you go down there alone.", "Twenty-four of you, Lightkeeper. Go down the Throat of the World, and put out the thing that puts out lights."]; },
    done: [['mira13', "He's dead. He's dead. Look up. Look at the sky."], ['mira13', "All the lights are going home."]] },
  { id: 'xt7', story: true, giver: 'mira13', lvl: 35, pre: 'xt6', name: 'When the Lamp Is Lit Again', where: 'lastlight', ...T, rep: LA(500), obj: { talk: true, what: 'Stand with Mira while the Starwrights come' },
    say: [["mira13", "They came down an hour after he fell. Seven of them, tall and quiet, in robes like the night sky. They didn't fight. They didn't even look at us."], ["ammara", "They gathered up what was left of him. Not the body. The hunger. They put it in something like a lantern, and it went dark, and they took it up, and they were gone."], ["mira13", "Ammara says they'll be back. Not soon. Not in our lifetimes. But one day, a long way from now, somebody's going to look up and see that lantern coming down."]],
    done: [['mira13', "I'm going home to Deepwatch. I'm going to build the Lamp again, out of the glass Sela found. It won't be the same. Nothing will be the same."], ['mira13', "But it'll be lit. And when they come back, whenever that is, there'll be a light on, and somebody waiting by it. Thank you, Lightkeeper. Thank you for all of it."]] },
  { id: 'xtx1', giver: 'iven13', lvl: 35, pre: 'xt1', name: 'Greedmaw', where: 'plain', ...T, rep: LA(250), obj: { named: 'greedmaw13', n: 1, what: 'Hunt down Greedmaw on the Gnawed Plain' },
    say: ["Greedmaw. A thing on the plain that's eaten so many of his crumbs it's started to look like him. It ate our second ember. I've stopped forgiving things."],
    done: ["Good. Good. I'll say a prayer for it. A short one. A very short one."] },
  { id: 'xtx2', giver: 'mira13', lvl: 35, pre: 'xt1', name: 'Stolen Lights', where: 'outskirts', ...T, rep: LA(250), obj: { collect: ['hungering', 'gnawling'], item: 'Stolen Light', chance: .5, n: 8, what: 'Free 8 stolen lights from the hungering and the gnawlings' },
    say: ["The things out there swallowed little lights from his scraps. Candles, sparks, a lighthouse or two. Free eight of them. They'll float up, and go home, wherever home is."],
    done: ["There they go. Look at them, wobbling upward like drunk fireflies. I used to think I'd never see anything that made me happy again."] },
  { id: 'xty1', daily: true, giver: 'iven13', lvl: 35, pre: 'xt1', name: 'Daily: Guard the Ember', ...T, rep: LA(200), obj: { kill: [...BIT, ...PILG], n: 12, what: 'Defeat 12 creatures of the Throat' },
    say: ["The ember needs guarding again. Twelve, please. Old men need their sleep."], done: ["The ember's safe. So am I. So, for the moment, are we all."] },
  { id: 'xty2', daily: true, giver: 'mira13', lvl: 35, pre: 'xt1', name: 'Daily: Keep the Last Light', ...T, rep: LA(200), obj: { kill: BIT, n: 10, what: 'Defeat 10 of the things that live on his crumbs' },
    say: ["Ten. They come for the lamp every night, and every night the lamp stays lit."], done: ["Still lit. Always lit."] },
]));
