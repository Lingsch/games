// Build 15: the Moonfall Road (levels 42-43). East of the Hatchery the Covenant have built a road of towers, every one
// with a mirror at the top. They gather every light in the land and throw it up at the moon, in a single message
// written in light: wake up. Break the mirrors. At the end of the road is the tallest tower of all, and the man who
// built them: Absalom, the Moonward Eye.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world } from './world.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver } from './hi9.js';
import * as Rep from './rep6.js';
import { side, props14, K, C, N, A, I, TK } from './l14.js';
import { finish45, addDungeon45, addRaid45, st15, MW } from './l15.js';

Object.assign(MOBS, {
  mirrorwright: mob('Covenant Mirrorwright', 'cultist1~gilded', { ...HU, hpM: 1.2, range: 18, ranged: true, caster: true, school: 'holy', weak: 'shadow' }),
  towerauto: mob('Tower Automaton', 'construct14~gilded', { hpM: 1.9, spd: 4.4, scale: 1.1, weak: 'storm', resist: 'holy', ore: true }),
  lightwraith: mob('Lightwraith', 'wraith~gilded', { hpM: 1.2, fly: .5, range: 16, ranged: true, caster: true, school: 'holy', weak: 'shadow', resist: 'holy' }),
  sleepwalker: mob('Moonstruck Pilgrim', 'villager1~spectral', { ...HU, hpM: 1.1, weak: 'shadow' }),
  beammoth: mob('Beam-Moth', 'mothpale14', { ...B, hpM: 1.2, spd: 6.6, fly: 1.2, weak: 'storm' }),
  // named, out on the road
  wanderer15: boss('The Wanderer', 'villager1~spectral', { ...HU, scale: 2.4, mechs: ['slam', 'fear', 'knock'], lines: { start: '*A pilgrim who has been walking toward the moon for so long he has grown huge. He does not see you. He steps on you anyway.*', half: '*He stops, and looks up, and walks on.*' } }),
  beamwyrm15: boss('The Beam-Wyrm', 'eel14', { scale: 3, fly: 1.6, range: 16, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'pool', 'charge'], lines: { start: '*It swims up and down the beams, like a fish in a stream of light.*', half: '*It dives through a beam, and comes out brighter.*' } }),
  // the Mirror Fields (open, 42)
  polisher15: boss('The Polisher', 'cultist1~gilded', { ...HU, scale: 1.4, range: 16, ranged: true, caster: true, school: 'holy', mechs: ['heal', 'volley', 'call'], adds: 'mirrorwright', lines: { start: 'Every mirror must be clean. Every speck of dust is a word she will not read.', half: 'You are a smudge. You are a SMUDGE.' } }),
  brightness15: boss('Brightness', 'wraith~gilded', { scale: 2.2, fly: .6, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'pool', 'fear'], lines: { start: '*So much light pours through the fields that some of it has stood up.*', half: '*It flares. You can see through your own hands.*' } }),
  greatmirror15: boss('The Great Mirror', 'mirror15', { hpM: 1.9, scale: 3.4, range: 22, ranged: true, caster: true, school: 'holy', weak: 'storm', mechs: ['volley', 'pool', 'call', 'enrage'], adds: 'lightwraith', lines: { start: '*The biggest mirror in the fields. It has a little of every light in the land in it. It turns toward you.*', half: '*It focuses. Your shadow catches fire.*' } }),
  // the Pilgrims' Stair (open, 43)
  stairwarden15: boss('The Stair-Warden', 'construct14~gilded', { scale: 2.4, weak: 'storm', mechs: ['slam', 'shield', 'knock'], lines: { start: 'PILGRIMS MAY PASS. YOU ARE NOT A PILGRIM.', half: 'PLEASE BECOME A PILGRIM.' } }),
  brightwell15: boss('Sister Brightwell', 'cultist1~gilded', { ...HU, scale: 1.4, range: 16, ranged: true, caster: true, school: 'holy', mechs: ['heal', 'fear', 'call'], adds: 'sleepwalker', lines: { start: 'Walk, children. Walk up. Don\'t look down. Never look down.', half: 'You made them look down! Look what you did!' } }),
  moonwardchoir15: boss('The Moonward Choir', 'choir', { hpM: 1.9, scale: 2.4, fly: .5, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['fear', 'volley', 'call', 'enrage'], adds: 'lightwraith', lines: { start: '*At the top of the Pilgrims\' Stair, a hundred voices sing up at the moon. Wake up. Wake up. Wake up.*', half: '*The song gets louder. The moon gets closer.*' } }),
  // the Lantern Vault (instance, 42-43)
  lv_sentinel15: boss('The Vault Sentinel', 'construct14~gilded', { scale: 2.4, weak: 'storm', mechs: ['slam', 'shield', 'call'], adds: 'towerauto', lines: { start: '*The Covenant keep every lamp they take in a vault under the road. The Forge built them a doorman.*', half: '*It locks the vault behind it.*' } }),
  lv_hoard15: boss('The Hoard of Lamps', 'firepet~gilded', { scale: 2.6, weak: 'frost', resist: 'fire', school: 'fire', range: 16, ranged: true, caster: true, mechs: ['pool', 'volley', 'spawn'], adds: 'lightwraith', lines: { start: '*Ten thousand stolen lamps, piled up, burning together. It has a face now.*', half: '*It flares hotter.*' } }),
  lv_burner15: boss('The Wick-Burner', 'cultist2~gilded', { ...HU, scale: 1.6, mechs: ['cleave', 'pool', 'charge'], lines: { start: 'Every wick in the Vale, burned for her. Every one.', half: 'She will see! She will SEE!' } }),
  lv_shade15: boss('The Mirror-Shade', 'wraith~gilded', { hpM: 2, scale: 2.6, fly: .6, range: 18, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'fear', 'pool', 'enrage'], adds: 'lightwraith', lines: { start: '*Absalom\'s reflection, left to guard the vault while he guards the tower. It is not as kind as he is. He is not kind.*', half: '*It shows you yourself, wrong.*' } }),
  // the Tower of the Moonward Eye (12-person raid)
  me_gate15: rboss('The Gate of Mirrors', 'mirror15', { hpM: 2.3, scale: 3.6, range: 22, ranged: true, caster: true, school: 'holy', weak: 'storm', mechs: ['volley', 'pool', 'call'], adds: 'lightwraith', lines: { start: '*The tower\'s door is a mirror, and the mirror is looking at you.*', half: '*It shows you a hundred of yourselves. They all attack.*' } }),
  me_twins15: rboss('The Twin Lights', 'wraith~gilded', { hpM: 2.3, scale: 2.6, fly: .6, range: 20, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'heal', 'pool', 'aura'], auraK: .1, lines: { start: '*Two lights, one from the sun and one from the Great Lamp, caught in the tower and twisted together.*', half: '*They pull apart, and both burn brighter.*' } }),
  me_lens15: rboss('The Grand Lens', 'beacon14', { hpM: 2.4, scale: 3.4, range: 24, ranged: true, caster: true, school: 'holy', weak: 'storm', mechs: ['volley', 'pool', 'knock', 'spawn'], adds: 'towerauto', lines: { start: '*The lens at the top of the tower. Every light on the road comes through it, and goes up.*', half: '*It focuses on you.*' } }),
  me_absalom15: rboss('Absalom, the Moonward Eye', 'cultist1~gilded', { hpM: 3, scale: 1.6, range: 22, ranged: true, caster: true, school: 'holy', mechs: ['volley', 'fear', 'heal', 'call', 'pool', 'aura', 'enrage'], auraK: .14, adds: 'mirrorwright', lines: { start: 'Every lamp you lit, Lamplighter, every shrine, every wick, I took, and I sent up. Vesper is up there now, at its eye. She needs one more light. Yours.', half: 'Look up! LOOK UP! It is OPENING!' } }),
});
Object.assign(MOB_LORE, {
  mirrorwright: 'The Covenant\'s tower-keepers. They polish the mirrors every hour, so not one speck of light is lost on the way to the moon.',
  sleepwalker: 'Pilgrims who looked at the beams too long. They walk toward the moon in their sleep. They do not stop for anything, including you.',
  me_absalom15: 'Absalom built every tower on the Moonfall Road. He was a lighthouse-keeper on the coast, once. He has always loved sending light a long way.',
});
giver('abigail15', 'Mother Abigail', 'Pilgrim\'s Rest · pilgrims who turned back', 'cleric1');
giver('ned15', 'Ned Pell', 'Pilgrim\'s Rest · a tower-keeper\'s son', 'villager1');
Object.assign(TALK, {
  abigail15: { bio: 'Abigail led three hundred pilgrims up the Moonfall Road to meet the makers. Halfway up she looked down instead of up, and saw what was walking beside her, and turned round. Forty followed her back. She runs Pilgrim\'s Rest for the ones who turn back.',
    greet: ["Welcome to Pilgrim's Rest. Rest. That's the whole point. Nobody here is going anywhere.", "Don't look at the beams too long. That's how it starts. You look, and you want to go and see."], topics: [] },
  ned15: { bio: 'Ned\'s father kept a tower on the road. Absalom made him polish the mirror until his hands bled, and then until they didn\'t. Ned ran. He wants to go back and break every mirror his father ever cleaned.',
    greet: ["My dad's up one of those. Polishing. He doesn't know me any more.", "I know how the mirrors come apart. There's a pin at the back. Hit the pin."], topics: [] },
});
Object.assign(LORE, {
  absalomlog: { title: 'Absalom\'s Lighthouse Log', where: 'mirrorfields', text: "An old lighthouse log, from the coast, kept for years: weather, ships, oil used. The last page, much later, in the same neat hand: 'All lights on the road aimed. Message: WAKE. V. is at the eye. One more light needed. Waiting for the Lamplighter. They always bring a lamp.'" },
});
X.VEND = Object.assign(X.VEND || {}, { pilgrimsrest: ['Brother Tobit', 'villager3'], waystation: ['Unit Twelve', 'automaton14'] });
X.inspectSay = Object.assign(X.inspectSay || {}, {
  pilgrimsign: ['A pilgrim\'s waymark: an arrow, pointing up. You turn it to point back down the road.', 'A waymark. Someone has added, in chalk: TURN BACK. You leave it.'],
  stolenlamp: ['A heap of stolen lamps at a tower\'s foot, waiting to be burned. You take what you can carry.', 'Lamps, dozens, from every village in the south. You take them back to the Rest.'],
  beamfoot: ['The foot of a beam. The light goes up and up and up. It is warm, and it hums, and you want to step into it. You don\'t.', 'You stand at the beam\'s foot and look up. The moon is right there, at the top.'],
});

const M = { zone: 'mr15' }, TOWER = ['mirrorwright', 'towerauto', 'lightwraith'], ROAD = ['sleepwalker', 'beammoth'];
for (const m of [...TOWER, ...ROAD]) Rep.KILL_REP[m] = ['moon15', 6];
X.arriveHooks.push((zone, from) => zone === 'mr15' ? ({ sh15: { x: 0, z: -450 } }[from] || { x: -455, z: -100 }) : zone === 'ht15' && from === 'mr15' ? { x: 455, z: -100 } : null);
// thirty mirrors along the road
const MIRRORS = []; for (let i = 0; i < 30; i++) { const t = i / 29; MIRRORS.push([Math.round(-380 + t * 740 + Math.sin(i * 1.7) * 40), Math.round(-100 + Math.sin(t * 6) * 160 + Math.cos(i * 2.3) * 40)]); }
defineZone('mr15', {
  size: 500, seed: 15037, name: 'The Moonfall Road', bossName: 'Absalom, the Moonward Eye', hiH: 12, maxSpawnH: 26,
  land: (x, z, N) => Math.max(1.5, 4 + N.fbm(x * .005, z * .005, 4) * 9),
  pal: { a: '#8a8a96', b: '#7a7a88', hi: '#a8a8b8', road: '#c8c4b8', cob: '#d8d4c8', low: '#5a5a68' },
  towns: [{ key: 'pilgrimsrest', name: 'Pilgrim\'s Rest', x: -380, z: -100, R: 30, wall: 'stones', gates: [0, Math.PI], guardName: 'Pilgrim Warden', guardKind: 'aegis1',
    houses: [[-12, 10, .4, 'hut'], [12, 10, -.4, 'tent', 4, 4], [-14, -10, .2, 'hall', 9, 5], [14, -10, 2.2, 'tent', 4, 4]], props: [[0, 4, 'lantern'], [-6, 0, 'lantern'], [0, -6, 'banner', '#ffffff']],
    npcs: [['giver', 'abigail15', 0, 0], ['giver', 'ned15', -8, 6], ['giver', 'wenna14f', 8, -4], ['vendor', 'pilgrimsrest', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[28, 2], [28, -2], [-28, 2], [-28, -2]] },
    { key: 'waystation', name: 'Waystation Nine', x: 240, z: 320, R: 24, wall: 'palisade', gates: [Math.PI, Math.PI / 2], guardName: 'Iron Legionary', guardKind: 'bladewarden1',
      houses: [[-6, 6, .3, 'tent'], [8, -6, -.4, 'tent']], props: [[0, 0, 'lantern'], [4, 4, 'banner', '#c8a050'], [-6, -8, 'pylon']],
      npcs: [['giver', 'unitnine14', -5, -2], ['giver', 'varga14', 5, 4], ['vendor', 'waystation', 6, -4], ['bind', null, 0, 6]], guards: [[-22, 2], [-22, -2]] }],
  roads: [[-460, -100, -340, -100], [-340, -100, -100, 40], [-100, 40, 120, -80], [120, -80, 380, 0], [380, 0, 240, 300], [120, -80, 0, -420]],
  regions: { names: ['Pilgrim\'s Rest', 'Waystation Nine', 'The Mirror Fields', 'The Pilgrims\' Stair', 'The Tower'], fn: (x, z) => z < -260 ? 4 : x < -240 ? 0 : z > 180 ? 1 : x < 140 ? 2 : 3 },
  open: [{ key: 'mirrorfields', name: 'The Mirror Fields', x: -60, z: 60, R: 34, deco: 'moonrock', decoN: 8, ring: true, gap: 0, centre: 'lamptower', lvl: [42, 42], area: 2,
      packs: [[-18, 0, ['mirrorwright', 'lightwraith']], [18, 0, ['towerauto', 'mirrorwright']], [0, -18, ['lightwraith', 'lightwraith', 'beammoth']], [0, 18, ['mirrorwright', 'towerauto']]],
      bosses: [[-22, -18, 'polisher15', 42], [22, -20, 'brightness15', 42], [0, -4, 'greatmirror15', 42, true]] },
    { key: 'pilgrimstair', name: 'The Pilgrims\' Stair', x: 300, z: -100, R: 34, deco: 'moonbeam', decoN: 4, centre: 'statue', lvl: [43, 43], area: 3,
      packs: [[-18, 0, ['sleepwalker', 'sleepwalker', 'mirrorwright']], [18, 0, ['towerauto', 'lightwraith']], [0, -18, ['sleepwalker', 'mirrorwright', 'lightwraith']], [0, 18, ['towerauto', 'beammoth']]],
      bosses: [[-22, -18, 'stairwarden15', 43], [22, -20, 'brightwell15', 43], [0, -4, 'moonwardchoir15', 43, true]] }],
  doors: [{ to: 'lanternvault', name: 'The Lantern Vault', x: -280, z: -300, ry: 0, label: 'Go down into the Lantern Vault (42-43)', col: '#ffe6a0' },
    { to: 'moonwardeye', name: 'The Tower of the Moonward Eye', x: 0, z: -420, ry: 0, label: 'Climb the Tower of the Moonward Eye (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'lamptower', x: 0, z: -360, name: 'The Moonward Eye', R: 18, clear: 14, s: 2.2 }, { g: 'lamptower', x: 140, z: 200, name: 'The Old Lighthouse', R: 12, clear: 8, s: 1.2 }],
  lines: [{ x: -488, z: -100, to: 'ht15', label: 'West, back to the Hatchery', ry: -Math.PI / 2 },
    { x: 0, z: -488, to: 'sh15', label: 'South, to where the piece of the moon came down: the Shell', ry: Math.PI, why: () => (S.hero?.lvl || 0) < 43 ? 'The Shell is for level 43 and beyond.' : S.quests.zm9?.state !== 'turned' && S.quests.zm9?.state !== 'done' ? 'South of the tower is only smoke. For now.' : null }],
  spots: { pilgrimsrest: { x: -380, z: -100 }, pilgrimroad: { x: -240, z: -20 }, waystation: { x: 240, z: 320 }, mirrorfields: { x: -60, z: 60 }, stair: { x: 300, z: -100 }, lighthouse: { x: 140, z: 200 },
    beamfoot: { x: 120, z: -80 }, lanternvault: { x: -280, z: -290 }, moonwardeye: { x: 0, z: -400 }, southsmoke: { x: 0, z: -460 }, eastroad: { x: 380, z: 0 } },
  scatter: [[40, [-480, -240, -300, 200], ['sleepwalker', 'beammoth', 'lightwraith'], [42, 42], 0], [40, [-240, 480, 180, 480], ['towerauto', 'mirrorwright', 'beammoth'], [42, 43], 1],
    [44, [-240, 140, -260, 180], ['mirrorwright', 'lightwraith', 'towerauto'], [42, 42], 2], [44, [140, 480, -260, 180], ['sleepwalker', 'mirrorwright', 'towerauto', 'lightwraith'], [43, 43], 3],
    [48, [-480, 480, -480, -260], ['towerauto', 'mirrorwright', 'lightwraith', 'beammoth'], [43, 43], 4]],
  camps: [[6, [-240, 140, -260, 180], ['mirrorwright', 'mirrorwright', 'towerauto'], [42, 42], 2, 'mw'], [5, [-480, 480, -480, -260], ['towerauto', 'mirrorwright', 'mirrorwright'], [43, 43], 4, 'ta']],
  rares: [[[-480, -240, -300, 200], 'wanderer15', 42, false], [[140, 480, -260, 180], 'beamwyrm15', 43, true]],
  hunt: [{ area: 0, lvl: [42, 42] }, { area: 1, lvl: [42, 43] }, { area: 2, lvl: [42, 42] }, { area: 3, lvl: [43, 43] }, { area: 4, lvl: [43, 43] }],
  labels: [{ t: 'Around Pilgrim\'s Rest (42)', x: -360, z: 40 }, { t: 'Waystation Nine (42-43)', x: 240, z: 240 }, { t: 'The Mirror Fields (42)', x: -60, z: 140 }, { t: 'The Pilgrims\' Stair (43)', x: 300, z: -20 }, { t: 'The Tower (43)', x: 0, z: -320 }],
  scenery: { density: 7000, tuft: '#9a9aa8', kinds: [['moonrock', .012, .6, 1.4], ['lamptower', .0012, .8, 1.2], ['moonbeam', .002, .8, 1.2], ['silvertree', .006, .8, 1.4]] },
  sky: { fog: '#6a6a8a', top: '#080a1c', hor: '#b8b8d8', k: .7, far: 260 },
  after: ({ rng }) => {
    MIRRORS.forEach(([x, z], i) => world.props.push({ id: 'mir' + i, kind: 'mirror15', tag: 'mirror', use: 'mirror15', name: 'A Covenant mirror', x, z, yaw: rng() * 6.28, scale: 1.2 }));
    props14([['pilgrimsign', 'A pilgrim\'s waymark', 'carving14', -200, 0, 6, 120], ['stolenlamp', 'A heap of stolen lamps', 'cache14', 120, 0, 6, 150], ['beamfoot', 'The foot of a beam', 'beacon14', 120, -80, 4, 80], ['alog', 'An old lighthouse log', 'lorebook', 146, 206, 1, 1, 'absalomlog']], rng);
  },
});
defineDungeon({ key: 'lanternvault', name: 'The Lantern Vault', parent: 'mr15', plan: 'cells', floor: '#8a8070', rock: '#2a2418', fog: '#4a3a28', light: .55, lvl: [42, 43], prop: 'lantern',
  mobs: ['mirrorwright', 'towerauto', 'lightwraith'], bosses: ['lv_sentinel15', 'lv_hoard15', 'lv_burner15', 'lv_shade15'], exitLabel: 'Climb back up to the road' });
defineDungeon({ key: 'moonwardeye', name: 'The Tower of the Moonward Eye', parent: 'mr15', plan: 'nave', floor: '#a8a8b8', rock: '#2a2a38', fog: '#4a4a68', light: .6, lvl: [43, 43], prop: 'bluelamp', raid: true,
  mobs: ['mirrorwright', 'towerauto', 'lightwraith', 'beammoth'], bosses: ['me_gate15', 'me_twins15', 'me_lens15', 'me_absalom15'], exitLabel: 'Climb back down the tower' });
addDungeon45('lanternvault', 'The Lantern Vault', [42, 43]); addRaid45('moonwardeye', 'The Tower of the Moonward Eye', 12, 43);
tier({ mirrorfields: 24, pilgrimstair: 24, lanternvault: 24, moonwardeye: 25 });
X.kill.push(m => {
  if (m.mob !== 'me_absalom15' || st15().absalom) return; st15().absalom = true;
  chat('sys', null, 'Absalom falls, and the Moonward Eye\'s lens cracks. Every beam on the road goes out at once.');
  setTimeout(() => chat('sys', null, 'The last light the tower ever sent hits the moon. A piece of it breaks off, and falls, slowly, burning, somewhere to the south.'), 4000);
});

// ---------- the story ----------
QUESTS.push(...finish45([
  { id: 'zm1', story: true, giver: 'abigail15', lvl: 42, pre: 'zt9', name: 'The Ones Who Turned Back', where: 'pilgrimroad', ...M, rep: MW(400), obj: K(['lightwraith', 'beammoth'], 12, 'Clear 12 lightwraiths and beam-moths off the road to Pilgrim\'s Rest', 'pilgrimroad', 220),
    say: ["Lamplighters. We heard. Come in. Rest. Then go back out and clear the road, because forty more pilgrims are trying to get here and the light's eating them.", "Twelve. The things made of light. They lead people into the beams."],
    done: ["Twelve. Seven pilgrims came in tonight. Seven. They'd looked down. That's all it takes. Looking down."] },
  { id: 'zm2', story: true, giver: 'ned15', lvl: 42, pre: 'zm1', name: 'Break the Mirrors', where: 'mirrorfields', ...M, rep: MW(400), obj: I('mirror', 5, 'Break 5 of the Covenant\'s mirrors along the road'),
    say: ["Every tower's got a mirror. Every mirror throws light at the moon. Break them. There's a pin at the back. Hit the pin. Five.", "My dad polished one of them for a year. I want it broken. I want all of them broken."],
    done: ["Five dark. Five threads of light that don't reach it any more. Halden says he can see the difference from the Vale. That's us. We did that."] },
  { id: 'zm3', story: true, giver: 'abigail15', lvl: 42, pre: 'zm1', name: 'Sleepwalkers', where: 'beamfoot', ...M, rep: MW(400), obj: I('beamfoot', 3, 'Go to the feet of 3 beams and pull the sleepwalkers back'),
    say: ["The ones who look too long walk into the beams. Asleep. Smiling. And they go up. Pull them back. Three beams. Don't look up while you do it."],
    done: ["You looked up. I can see it on your face. Everyone does, once. Sit down. Drink this. You'll be fine. Most people are."] },
  { id: 'zm4', story: true, giver: 'unitnine14', lvl: 42, pre: 'zm2', pre2: 'zm3', name: 'Waystation Nine', where: 'waystation', ...M, rep: MW(400), obj: TK('Hear Unit Nine\'s report'),
    say: [["unitnine14", "UNIT NINE REPORTS. Unit Nine has built a waystation. It is called Waystation Nine. Unit Nine named it. Unit Nine is learning."], ["unitnine14", "UNIT NINE REPORTS. Forge units are working the towers. They were taken from the Forge by a man named Absalom. He gave them orders. They follow orders. Unit Nine also followed orders, once."], ["varga14", "The Legion's here too. Corrand sent us after the Brood-Mother. Absalom's the one building the towers. A lighthouse-keeper, from the coast. He's very good at aiming light."]],
    done: [["unitnine14", "UNIT NINE REQUESTS the Forge units be freed. Not retired. Freed. Unit Nine is learning the difference."], ["varga14", "Fine. Freed. Hit them till they're freed."]] },
  { id: 'zm5', story: true, giver: 'ned15', lvl: 42, pre: 'zm4', name: 'The Mirror Fields', where: 'mirrorfields', ...M, rep: MW(500), obj: N('greatmirror15', 'Go into the Mirror Fields and shatter the Great Mirror'),
    say: ["In the middle of the fields there's a mirror as big as a house. Every other mirror sends to it, and it sends up. Shatter it.", "My dad's somewhere in the fields. If you see a man polishing with no skin on his hands... don't hurt him. Please."],
    done: ["Shattered. And... my dad came down to Pilgrim's Rest. On his own. Hands bandaged. He looked at me. He said 'Ned?'. Just that. 'Ned?'."] },
  { id: 'zm6', story: true, giver: 'abigail15', lvl: 43, pre: 'zm5', name: 'The Pilgrims\' Stair', where: 'stair', ...M, rep: MW(500), obj: N('moonwardchoir15', 'Climb the Pilgrims\' Stair and silence the Moonward Choir'),
    say: ["East, there's a stair that goes up and up toward nothing. The pilgrims climb it singing. At the top there's a choir. A hundred voices. All singing 'wake up'.", "I climbed it, once. Halfway. Then I looked down. Silence them. Please. I still hear it at night."],
    done: ["Quiet. I can hear the wind. I'd forgotten wind. Thank you. I'm going to sleep for a day."] },
  { id: 'zm7', story: true, giver: 'varga14', lvl: 43, pre: 'zm6', name: 'The Lantern Vault', where: 'lanternvault', ...M, rep: MW(600), obj: N('lv_shade15', 'Go down into the Lantern Vault and destroy the Mirror-Shade'),
    say: ["Under the road, the Covenant keep every lamp they've stolen. Ten thousand. Burning them a few at a time, to keep the towers fed.", "Absalom left something to guard it. His reflection, Ned says. Go down. Take the lamps back. Take them all back."],
    done: ["Ten thousand lamps. Coming back up the road in carts. Every village in the south will have its lamp back. The Legion's going to hand them out. Personally. With a salute."] },
  { id: 'zm8', story: true, giver: 'unitnine14', lvl: 43, needLvl: 43, pre: 'zm7', name: 'The Moonward Eye', where: 'moonwardeye', ...M, rep: MW(1200), obj: N('me_absalom15', 'Climb the Tower of the Moonward Eye and stop Absalom (12-person raid)'),
    say: ["UNIT NINE REPORTS. The tallest tower is at the end of the road. The Moonward Eye. Absalom is at the top, with the lens.", "UNIT NINE REPORTS. Absalom says he is waiting for one more light. Unit Nine believes he means you. Unit Nine requests you go anyway. With eleven others. Unit Nine will hold the door."],
    done: [["unitnine14", "UNIT NINE REPORTS. The tower is dark. Every tower is dark. The road is dark."], ["varga14", "And the last light he sent hit the moon. I saw it. A piece broke off. It's falling. South."], ["unitnine14", "UNIT NINE REPORTS. It has landed. Unit Nine felt it. Everyone felt it."]] },
  { id: 'zm9', story: true, giver: 'abigail15', lvl: 43, pre: 'zm8', name: 'Moonfall', where: 'southsmoke', ...M, rep: MW(400), obj: TK('Talk about what fell'),
    say: [["seventh14", "A piece of its shell. You cracked its shell. It is not hatching. It is shedding. It is getting ready to move."], ["abigail15", "The road's called the Moonfall Road. Has been for a hundred years. I always thought it was poetry."], ["seventh14", "Somebody knew. A long time ago. Somebody always knows."]],
    done: [["seventh14", "Go south, to the Shell. There will be a way up, from there. The shell is still tied to the moon. A thread of silver. Vesper's thread. She will be at the other end."], ["abigail15", "Take this. A pilgrim's staff. Every pilgrim who turned back leaves one at the Rest. You're the first one going the right way."]] },
]));

// ---------- the smaller roads ----------
const rest = side('mr15', MW, 'zm1', [
  ['zmr1', 'abigail15', 42, 'Waymarks', 'pilgrimroad', I('pilgrimsign', 4, 'Turn 4 pilgrims\' waymarks to point back down the road'), "The waymarks all point up. Toward the beams. Turn them round. Four. Some pilgrim will look at one and turn round too.", "Four. A woman came in this morning. She said a sign told her to turn back. I've never been so proud of a sign."],
  ['zmr2', 'ned15', 42, 'Mirror Pins', 'mirrorfields', I('mirror', 4, 'Break 4 more mirrors by hitting the pins at the back'), "Four more. The pin. At the back. You've got it now. Hit it like you mean it.", "Four. The road's darker. You can see stars between the towers now. Real ones."],
  ['zmr3', 'wenna14f', 42, 'Stolen Lamps', 'eastroad', I('stolenlamp', 4, 'Take back 4 heaps of stolen lamps at the towers\' feet'), "The Covenant pile stolen lamps at the foot of every tower. To burn for the mirrors. Four heaps. We'll take them back to the villages. On foot if we have to.", "Four heaps. Hundreds of lamps. Every one of them somebody's. I'm going to find out whose. All of them."],
  ['zmr4', 'abigail15', 42, 'Moonstruck', 'pilgrimroad', K(['sleepwalker'], 8, 'Stop 8 moonstruck pilgrims walking toward the beams', 'pilgrimroad', 260), "Some of them can't be pulled back. They fight. Asleep, smiling, they fight. Stop them. Eight. Gently, if you can. It doesn't matter how, in the end."],
  ['zmr5', 'ned15', 42, 'My Dad', 'mirrorfields', A('mirrorfields', 'Look for Ned\'s father in the Mirror Fields'), "My dad's in the fields. Polishing. Find him. Don't make him stop. Just... tell me he's alive.", "Alive. Polishing. Singing. He didn't see you? He doesn't see anyone. ...Thank you."],
  ['zmr6', 'abigail15', 42, 'Beam-Moths', 'pilgrimroad', K(['beammoth'], 10, 'Shoot down 10 beam-moths flying up the beams', 'pilgrimroad', 280), "The moths fly up the beams. They carry things. Light. Hatchlings. Anything. Ten.", "Ten. Moths falling like snow. The children here thought it was snow. Let them."],
  ['zmr7', 'wenna14f', 42, 'Lamps for the Rest', 'pilgrimsrest', C(['mirrorwright'], 'Polished Lamp', 5, 'Take 5 polished lamps from the Mirrorwrights'), "The Mirrorwrights carry lamps. Polished. Beautiful. Five. For the Rest. People who turned back deserve a nice lamp."],
  ['zmr8', 'abigail15', 43, 'The Wanderer', 'pilgrimroad', N('wanderer15', 'Stop the Wanderer, a giant pilgrim, somewhere on the west road'), "There's a pilgrim who's been walking toward the moon so long he's grown. Huge. He doesn't see anyone. He steps on them. Stop him.", "He's down? He was a kind man, once. He gave me bread on the road. He'll be very surprised when he wakes, if he wakes."],
  ['zmr9', 'ned15', 43, 'What My Dad Said', 'pilgrimsrest', TK('Sit with Ned and his father'), "My dad wants to talk to the one who broke the mirror. That's you. He doesn't talk much. Sit with us.", [["ned15", "He said thank you. He said the mirror kept looking at him. All year. Every day. He said it was nice to see his own face again, in a puddle."]]],
  ['zmrd', 'abigail15', 42, 'Road Watch', 'pilgrimroad', K(['lightwraith', 'beammoth', 'sleepwalker'], 8, 'Clear 8 things off the pilgrims\' road', 'pilgrimroad', 240), "Eight a day. People are still coming.", "Clear. Same tomorrow.", { daily: true }],
]);
const way = side('mr15', MW, 'zm4', [
  ['zmw1', 'unitnine14', 42, 'Freed, Not Retired', 'eastroad', K(['towerauto'], 8, 'Stop 8 Tower Automatons so Unit Nine can free them', 'eastroad', 260), "UNIT NINE REPORTS. Forge units on the towers. Unit Nine requests they be stopped. Not destroyed. Stopped. Unit Nine will free them afterwards.", "UNIT NINE REPORTS. Eight units freed. Three have asked to join Waystation Nine. Unit Nine is... a foreman again. Unit Nine does not mind this time."],
  ['zmw2', 'varga14', 42, 'Mirrorwrights', 'eastroad', K(['mirrorwright'], 10, 'Kill 10 Covenant Mirrorwrights', 'eastroad', 260), "The Mirrorwrights keep the mirrors clean. Every hour. Ten fewer and the mirrors get dusty. Dusty mirrors don't send so far.", "Ten. Their mirrors are dusty. Varga's Law: everything's worse with dust."],
  ['zmw3', 'unitnine14', 42, 'Order Plates', 'eastroad', C(['towerauto'], 'Order Plate', 5, 'Take 5 order-plates out of the Tower Automatons'), "UNIT NINE REPORTS. Each unit has a plate with its orders. Absalom has written new ones. Unit Nine requests the plates, to read them.", "UNIT NINE REPORTS. The orders say: AIM. POLISH. SEND. They do not say why. Unit Nine never knew why either. Unit Nine is going to start asking why."],
  ['zmw4', 'varga14', 42, 'The Old Lighthouse', 'lighthouse', A('lighthouse', 'Go to the Old Lighthouse and see what Absalom left there'), "There's an old lighthouse north of the road. Absalom's first tower, before he got ambitious. Go and look. I want to know him before I kill him.", "A log. Weather, ships, oil. A tidy man. Loved his light. Loved sending it far. That's the worst sort. The ones who love the job."],
  ['zmw5', 'unitnine14', 43, 'Lens Shards', 'eastroad', C(['lightwraith'], 'Lens Shard', 6, 'Gather 6 lens-shards from the lightwraiths'), "UNIT NINE REPORTS. Lightwraiths are made around shards of lens. Six shards. Unit Nine will make a lens for the waystation. Pointing down."],
  ['zmw6', 'varga14', 43, 'The Beam-Wyrm', 'stair', N('beamwyrm15', 'Hunt the Beam-Wyrm swimming in the beams near the Stair'), "Something swims up and down the beams near the Stair. Like a fish. The Legion can't hit it. You can.", "Down? Out of the beam? Good. Fish belong in water. Light belongs on the ground. Everything in its place."],
  ['zmw7', 'unitnine14', 43, 'Unit Nine Asks Why', 'waystation', TK('Answer Unit Nine\'s question'), "UNIT NINE REPORTS. Unit Nine has a question. Why does Absalom want the moon to wake? Unit Nine has asked the freed units. They do not know. Unit Nine wishes to know."],
  ['zmw8', 'varga14', 43, 'Tower by Tower', 'stair', I('mirror', 4, 'Break 4 mirrors on the eastern towers'), "Four more mirrors, east, toward the Stair. The Legion's taking those towers once the mirrors are down. One at a time. That's how you take a road."],
  ['zmwd', 'varga14', 43, 'Hold the Waystation', 'waystation', K(['towerauto', 'mirrorwright', 'lightwraith'], 8, 'Hold Waystation Nine against the Covenant', 'waystation', 240), "Eight. Every day. That's what we do.", "Held. Same tomorrow.", { daily: true }],
]);
const fields = side('mr15', MW, 'zm5', [
  ['zmf1', 'ned15', 42, 'The Polisher', 'mirrorfields', N('polisher15', 'Stop the Polisher in the Mirror Fields'), "There's a woman in the fields who polishes the others' mirrors. Inspects them. She made my dad do his over and over. Stop her.", "She called you a smudge? Ha. Good. I hope she saw you everywhere she looked."],
  ['zmf2', 'wenna14f', 42, 'Brightness', 'mirrorfields', N('brightness15', 'Put out Brightness in the Mirror Fields'), "So much light goes through the fields that some of it stood up and walks about. Brightness, the pilgrims call it. Put it out.", "Out. I could see through my hands for an hour after. Hesk would call it a waste of good light. Hesk is wrong, for once."],
  ['zmf3', 'abigail15', 42, 'Into the Fields', 'mirrorfields', K(['mirrorwright', 'lightwraith', 'towerauto'], 14, 'Clear 14 things in the Mirror Fields', 'mirrorfields', 140), "The fields are full. Fourteen, and the Legion can go in and start taking towers down.", "Fourteen. The Legion's in. They're pushing towers over. With ropes. Singing. Not the moon song. A rude one."],
  ['zmf4', 'ned15', 43, 'Dad\'s Mirror', 'mirrorfields', I('mirror', 2, 'Break the 2 mirrors Ned\'s father polished'), "Dad's told me which two were his. He wants them broken. He wants to watch. He can't do it himself. His hands.", [["ned15", "He watched. He laughed. I've never heard him laugh. Not even before."]]],
  ['zmf5', 'abigail15', 43, 'Sister Brightwell', 'stair', N('brightwell15', 'Stop Sister Brightwell on the Pilgrims\' Stair'), "Sister Brightwell walks beside the pilgrims on the Stair. 'Don't look down,' she says. She held my hand. When I looked down, she let go. Stop her.", "She let go of everyone in the end. Didn't she. Every hand. That's what she was for."],
  ['zmf6', 'wenna14f', 43, 'The Stair-Warden', 'stair', N('stairwarden15', 'Get past the Stair-Warden on the Pilgrims\' Stair'), "A Forge unit guards the bottom of the Stair. 'Please become a pilgrim', it says. Unit Nine wants it freed. Get past it first.", [["unitnine14", "UNIT NINE REPORTS. The Stair-Warden is freed. It has asked to become a pilgrim. Of Pilgrim's Rest. Unit Nine said yes."]]],
  ['zmf7', 'abigail15', 43, 'The Stair Sleepwalkers', 'stair', K(['sleepwalker'], 10, 'Turn back 10 sleepwalkers climbing the Pilgrims\' Stair', 'stair', 220), "The Stair's full of them. Climbing. Smiling. Ten. Pull them down. Hold them till they wake."],
  ['zmf8', 'ned15', 43, 'Lamps Pointed Down', 'stair', I('stolenlamp', 2, 'Take back the last 2 heaps of stolen lamps near the Stair'), "Two more heaps, by the Stair. The last ones. Bring them back. Every village gets its lamp back. Every one."],
  ['zmfd', 'ned15', 42, 'Dust the Mirrors', 'mirrorfields', K(['mirrorwright', 'lightwraith'], 8, 'Clear 8 polishers from the fields', 'mirrorfields', 200), "Eight a day. Let the mirrors get dusty.", "Dusty. Same tomorrow.", { daily: true }],
]);
const tower = side('mr15', MW, 'zm6', [
  ['zmt1', 'varga14', 43, 'The Vault Sentinel', 'lanternvault', N('lv_sentinel15', 'Get past the Vault Sentinel in the Lantern Vault'), "A Forge unit guards the Vault door. Unit Nine wants it freed. Get it out of the way first.", "Freed. It's helping carry the lamps up. It's very good at carrying. It's very good at everything it's told. That's the trouble."],
  ['zmt2', 'wenna14f', 43, 'The Hoard of Lamps', 'lanternvault', N('lv_hoard15', 'Put out the Hoard of Lamps in the Lantern Vault'), "Ten thousand stolen lamps, burning in a pile, with a face. Put it out. I want to cry. I'm going to cry after."],
  ['zmt3', 'abigail15', 43, 'The Wick-Burner', 'lanternvault', N('lv_burner15', 'Stop the Wick-Burner in the Lantern Vault'), "The man who burns the wicks, in the Vault. He burned every wick in the south for her. Stop him."],
  ['zmt4', 'unitnine14', 43, 'The Gate of Mirrors', 'moonwardeye', N('me_gate15', 'Get through the Gate of Mirrors in the Tower of the Moonward Eye (12-person raid)'), "UNIT NINE REPORTS. The tower door is a mirror. It shows you yourself. Unit Nine saw itself. Unit Nine did not like it. Get through."],
  ['zmt5', 'varga14', 43, 'The Twin Lights', 'moonwardeye', N('me_twins15', 'Break the Twin Lights in the Tower (12-person raid)'), "Halfway up the tower there are two lights twisted together. The sun and the Great Lamp, Ned says. Stolen. Untwist them."],
  ['zmt6', 'ned15', 43, 'The Grand Lens', 'moonwardeye', N('me_lens15', 'Crack the Grand Lens at the top of the Tower (12-person raid)'), "The lens at the top. Every light on the road goes through it. Crack it. My dad says there's a pin. There's always a pin."],
  ['zmt7', 'abigail15', 43, 'Every Pilgrim', 'pilgrimsrest', TK('Count the pilgrims at the Rest with Mother Abigail'), "Count them with me. Every one who turned back. I want to know how many. I've never dared."],
  ['zmt8', 'varga14', 43, 'Smoke in the South', 'southsmoke', A('southsmoke', 'Go to the south edge of the road and look at the smoke'), "There's smoke in the south. A lot. Go and look. Tell me if I need to send the Legion, or the Legion and everybody else."],
]);
const more = side('mr15', MW, 'zm2', [
  ['zmx1', 'wenna14f', 42, 'Wenna Breaks One', 'pilgrimroad', I('mirror', 1, 'Help Wenna break her first mirror'), "I want to break one. Myself. Just one. Show me the pin. Stand behind me. Don't help unless I ask.", "I hit the pin! It broke! It broke and the light went out and I did that! Ammara's never going to believe me."],
  ['zmx2', 'abigail15', 42, 'Water for the Rest', 'pilgrimsrest', C(['beammoth'], 'Moth Dew', 6, 'Collect 6 vials of dew from the beam-moths'), "The moths collect dew. Clean dew. The wells here taste of silver. Six vials, for the children."],
  ['zmx3', 'ned15', 42, 'Lightwraiths', 'mirrorfields', K(['lightwraith'], 10, 'Put out 10 lightwraiths in the Mirror Fields', 'mirrorfields', 220), "The light walks about in the fields. Shaped like people. Ten. They're not people. Dad says some of them have his face."],
  ['zmx4', 'varga14', 42, 'Legion Banners', 'eastroad', A('eastroad', 'Plant the Legion\'s banner on the east road'), "The Legion plants its banner where it means to stay. East road. Plant it. Make sure the Covenant can see it from their towers."],
  ['zmx5', 'unitnine14', 42, 'Unit Twelve', 'waystation', TK('Meet Unit Twelve, the waystation\'s quartermaster'), "UNIT NINE REPORTS. Unit Twelve has joined Waystation Nine. Unit Twelve sells things. Unit Nine does not understand selling. Unit Twelve is very good at it."],
  ['zmx6', 'abigail15', 43, 'The Turned', 'pilgrimsrest', TK('Hear the stories of the pilgrims who turned back'), "Sit at the fire. Every pilgrim here has a story of the moment they looked down. Listen to a few. It helps them, telling it."],
  ['zmx7', 'wenna14f', 43, 'A Lamp for Ned\'s Dad', 'pilgrimsrest', C(['mirrorwright'], 'Clean Cloth', 3, 'Take 3 clean polishing cloths from the Mirrorwrights'), "Ned's dad wants to polish something. Something good. I'm giving him my lamp to polish. He needs cloths. Three. Clean ones."],
  ['zmx8', 'ned15', 43, 'The Pin', 'mirrorfields', TK('Hear Ned explain the pin'), "Everyone asks about the pin. I'll tell you. Every mirror Absalom designed has a pin at the back. So it can be taken down for cleaning. He built every one of them to come apart. Isn't that funny?"],
]);
const extra = side('mr15', MW, 'zm3', [
  ['zme1', 'abigail15', 42, 'Bread for the Road', 'pilgrimroad', C(['sleepwalker'], 'Pilgrim\'s Bread', 5, 'Take 5 loaves from the moonstruck pilgrims\' packs'), "The sleepwalkers carry bread they'll never eat. Five loaves. The Rest is hungry. They won't mind. They're not here.", "Five loaves. Stale. Wonderful. The Rest eats tonight."],
  ['zme2', 'ned15', 42, 'Tower Keepers', 'mirrorfields', C(['mirrorwright'], 'Keeper\'s Key', 4, 'Take 4 tower keys from the Mirrorwrights'), "Every tower's locked. The Mirrorwrights carry the keys. Four. I'll open them. My dad might not be the only one up there."],
  ['zme3', 'wenna14f', 42, 'Waymarks, Again', 'eastroad', I('pilgrimsign', 2, 'Turn 2 more waymarks on the east road'), "Two more waymarks, east. Turn them round. I'll leave a lamp by each one. Pointed down the road. Home."],
  ['zme4', 'varga14', 43, 'Covenant Supply', 'eastroad', K(['towerauto', 'mirrorwright'], 12, 'Break the Covenant supply line on the east road', 'eastroad', 260), "The Covenant bring oil and glass down the east road. Twelve, and the towers start running dry."],
  ['zme5', 'unitnine14', 43, 'A Hat for Seventh', 'waystation', C(['lightwraith'], 'Lens Shard', 2, 'Find 2 lens-shards so Unit Twelve can make Seventh a hat'), "UNIT NINE REPORTS. Unit Twelve says Seventh would like a hat. Unit Nine does not know if this is true. Unit Nine would like it to be true. Two shards."],
  ['zme6', 'abigail15', 43, 'Beams at Night', 'beamfoot', I('beamfoot', 1, 'Stand at the foot of the last beam and keep the sleepwalkers back'), "One more beam to watch tonight. Stand at its foot. Keep them back. Don't look up. You looked up last time."],
  ['zme7', 'ned15', 43, 'Dad Talks', 'pilgrimsrest', TK('Sit with Ned\'s father'), "Dad wants to tell you what the mirror showed him. All year. He's never told anyone. Sit with him. I'll be outside."],
  ['zme8', 'wenna14f', 43, 'The Road at Night', 'pilgrimroad', A('pilgrimroad', 'Walk the dark road at night with Wenna'), "The road's dark now. No beams. Walk it with me tonight. I want to see the stars between the towers. Ned says you can. I want to see."],
]);
const DONE_MR = { zme2: "Four keys. Four towers open. Two people came down. Polishers. Like Dad. They're at the Rest now, wrapped in blankets, looking at their hands.", zme3: "Two lamps, pointing home. I sat by the second one for a while. Nobody came. Somebody will.", zme4: "Twelve. The towers are going dark on their own now. No oil. No glass. Varga's smiling. It's horrible.", zme5: [["unitnine14", "UNIT NINE REPORTS. Seventh has a hat. Seventh is wearing it. Seventh said thank you. Unit Nine is logging this, and then Unit Nine is going to stand very still for a while."]], zme6: "Nobody went up tonight. You didn't look up either. I watched you. Good.", zme7: "He said it showed him his son. Every day. Older. Walking away. Then he broke it, and I was there. Thank you.", zme8: "Stars. Real ones. Between the towers. Lots of them. ...Is that the curtain? The light round the edge? It's so pretty. It's hiding us.", zmr4: "Eight. Two woke up when they fell. They asked where they were. I said: here. They cried. That's the right answer.", zmr7: "Five. Beautiful lamps. The Rest has never been so pretty. The pilgrims keep touching them, like they're not sure they're allowed.", zmw5: "UNIT NINE REPORTS. A lens. Pointing down. The waystation floor is very bright. Unit Nine can see every speck of dust. Unit Nine is sweeping.", zmw7: "UNIT NINE REPORTS. Because he wants to be seen. By something big. Unit Nine understands this. Unit Nine also wanted to be seen. By Seventh. Unit Nine has been seen. Unit Nine is content.", zmw8: "Four. The Legion's on the towers. The flags are up. Corrand will be insufferable.", zmf7: "Ten. Some of them are awake now. Sitting at the bottom of the Stair. Crying. That's waking up, here.", zmf8: "That's all of them. Every lamp the Covenant took from the south. Going home. I'm going home too, one day. When it's done.", zmt2: "Out. I cried. It was alright. Every one of those lamps is going home now. Burnt black. Still lamps.", zmt3: "He said every wick? Not every wick. Hesk's still got hers. And Pip's. And mine.", zmt4: "UNIT NINE REPORTS. Through. Unit Nine did not look at itself this time. Unit Nine is learning.", zmt5: "Untwisted. The sun's light went back to being sunlight. It looked very relieved, Ned says. Can light look relieved?", zmt6: "Cracked. There was a pin. Dad was right. Dad's always right about pins.", zmt7: "Four hundred and six. Four hundred and six people turned back. I thought it was forty. It's four hundred and six.", zmt8: "A piece of the moon? In the south? Burning? ...Both. Send everyone.", zmx2: "Six. The children drank it and said it tasted like sky. I don't know what that tastes like. I believe them.", zmx3: "Ten. None of them had his face. I checked. I'm glad you didn't let me come.", zmx4: "Planted. The Covenant saw it. They lit a tower to look at it better. Then we knocked the tower over.", zmx5: [["unitnine14", "UNIT NINE REPORTS. Unit Twelve has sold Unit Nine a hat. Unit Nine does not need a hat. Unit Nine is wearing the hat."]], zmx6: "The baker. The soldier. The girl with the goat. Thank you for listening. They'll sleep tonight.", zmx7: "Three cloths. He polished it all night. It's the shiniest ugly lamp in the world. He gave it back to me with both hands.", zmx8: "He built every tower to come apart. Every one. Like he knew somebody would come. Like he wanted them to." };
for (const q of [...rest, ...way, ...fields, ...tower, ...more, ...extra]) if (DONE_MR[q.id]) q.done = [].concat(typeof DONE_MR[q.id] === 'string' ? [DONE_MR[q.id]] : DONE_MR[q.id]);
QUESTS.push(...finish45([...rest, ...way, ...fields, ...tower, ...more, ...extra]));
