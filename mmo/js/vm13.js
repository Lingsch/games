// Build 13: the Lightless March (levels 31-33). The kingdom of Avenmoor went dark in a single night when Vhorun
// passed over it. The sun still rises; it just doesn't reach the ground. The survivors hold Candlehold by
// candlelight, and the Lightless King, who opened his gates to the dark, sits in his cathedral at the end of it.
import { S, X } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, tier, giver, faction, mount } from './hi9.js';
import * as Rep from './rep6.js';
import * as Loot5 from './loot5.js';
import { finish35, addDungeon35, addRaid24, PAL_DARK } from './vh13.js';

Object.assign(MOBS, {
  gloomstalker: mob('Gloomstalker', 'bear~ashen', { ...B, hpM: 1.4, scale: 1.2, weak: 'holy', resist: 'shadow' }),
  candlemoth: mob('Gloom-Moth', 'wasp~ashen', { ...B, hpM: .9, fly: 1.2, weak: 'fire', resist: 'shadow', scale: 1.3 }),
  shadowtreant: mob('Starless Treant', 'treant~ashen', { hpM: 1.5, spd: 4.2, weak: 'fire', resist: 'shadow', scale: 1.15 }),
  lightlessknight: mob('Lightless Knight of Avenmoor', 'bladewarden1~ashen', { ...U, hpM: 1.45, weak: 'holy', resist: 'shadow' }),
  dusksister: mob('Sister of the Long Dusk', 'priest~ashen', { ...HU, hpM: .95, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  // named
  theblackhart13: boss('The Black Hart', 'boarbig~ashen', { ...B, scale: 2, mechs: ['charge', 'knock'] }),
  widowcandle13: boss('Widow Candle', 'ghostnpc~ashen', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear'] }),
  // Fallen Avenmoor (open)
  sheriffgaunt13: boss('Sheriff Gaunt', 'guard~ashen', { ...U, mechs: ['cleave', 'call'], adds: 'lightless', lines: { start: 'Curfew, citizen. Curfew forever, now. Get indoors and stay in the dark where you belong.', half: 'Deputies!' } }),
  bellringer13: boss('The Bell-Ringer', 'skeleton~ashen', { ...U, scale: 1.6, mechs: ['fear', 'knock'], lines: { start: '*The bell in Avenmoor\'s tower rings the hours of a day that never comes.*', half: '*It rings faster. The dead in the streets start to move.*' } }),
  lordmayor13: boss('Lord Mayor Aldric Vane', 'bulwark2~ashen', { ...U, hpM: 1.7, scale: 1.5, mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'lightlessknight', lines: { start: 'The King opened the gates, and the dark came in, and it was so QUIET. Do you know how loud a city is? I don\'t miss it. I don\'t miss any of it.', half: 'Avenmoor sleeps! Let it sleep!' } }),
  // the Starless Wood (open)
  oldgloam13: boss('Old Gloam', 'treant~ashen', { scale: 2.2, weak: 'fire', mechs: ['slam', 'web'], lines: { start: '*The oldest tree in the wood has not seen the sun in a month. It has decided it does not need to.*', half: '*Roots tear out of the ground.*' } }),
  hollowstag13: boss('The Hollow Stag', 'wolf~spectral', { ...B, scale: 2.2, mechs: ['charge', 'knock', 'spawn'], adds: 'gloomstalker', lines: { start: '*A stag of white light used to lead the herds of the wood. The light is gone. The stag is not.*', half: '*It bellows, and the gloomstalkers come.*' } }),
  starlesswitch13: boss('The Starless Witch', 'druid2~ashen', { ...HU, hpM: 1.7, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'pool', 'spawn', 'enrage'], adds: 'shadowtreant', lines: { start: 'I asked the stars for a hundred years to come down and talk to me. They never did. Then the dark came, and it talked to me every night.', half: 'Grow, my darlings! Grow over them!' } }),
  // the Court of Shadows (instance, 32-33)
  chamberlain13: boss('The Chamberlain of Night', 'cleric2~ashen', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['heal', 'volley'], lines: { start: 'You are not on the list. Nobody is on the list. The court is closed, forever, by order of the Queen.', half: 'Guards! An intrusion!' } }),
  jester13: boss('Pell the Jester', 'illusionist1~ashen', { ...HU, range: 16, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool', 'spawn'], adds: 'lightless', lines: { start: 'Knock knock! Who\'s there? NOBODY! Nobody\'s there! Nobody\'s ever there any more! Hahaha! Haha. Ha.', half: 'Here\'s my best trick! Watch the lights go out!' } }),
  blackknight13: boss('Ser Corvin, the Black Knight', 'bladewarden2~ashen', { ...U, scale: 1.5, mechs: ['cleave', 'charge', 'shield'], lines: { start: 'I swore to guard the Queen until the sun came up. It will not come up. I will guard her forever. I am so glad.', half: 'For the Queen in the dark!' } }),
  lightlessqueen13: boss('Queen Merewen the Lightless', 'queen~ashen', { hpM: 1.9, range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['pool', 'fear', 'call', 'enrage'], adds: 'lightlessknight', lines: { start: 'My husband gave our kingdom to the dark so that nobody would ever see me grow old. Wasn\'t that sweet of him? Wasn\'t that the sweetest thing?', half: 'Aldwin! Aldwin, they are hurting me!' } }),
  // the Lightless Cathedral (24-person raid)
  gargoyle24: rboss('The Cathedral\'s Watch', 'harpynamed~ashen', { hpM: 2.3, fly: 1.2, scale: 2.4, mechs: ['charge', 'volley', 'spawn'], adds: 'candlemoth', lines: { start: '*The stone things on the cathedral roof were carved to keep evil out. They have changed their minds about which side evil is on.*', half: '*More of them peel off the walls.*' } }),
  organist24: rboss('The Organist of Night', 'priest~spectral', { hpM: 2.4, range: 20, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'knock', 'fear', 'aura'], auraK: .12, lines: { start: '*Somebody has been playing the cathedral organ since the night the dark came. The same chord. Over and over. It is making the walls bleed.*', half: '*The chord changes. Everyone in the cathedral feels it in their teeth.*' } }),
  choirdark24: rboss('The Lightless Choir', 'choir', { hpM: 2.4, fly: .5, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley', 'heal', 'spawn'], adds: 'dusksister', lines: { start: '*A choir of four hundred, every voice in Avenmoor that ever sang in this cathedral, singing the dark in.*', half: '*The song splits into parts. Some of the parts are screaming.*' } }),
  bishop24: rboss('Bishop Ansel the Eclipsed', 'cleric2~ashen', { hpM: 2.5, range: 18, ranged: true, caster: true, school: 'shadow', resist: 'shadow', mechs: ['heal', 'pool', 'call', 'aura'], auraK: .13, adds: 'lightlessknight', lines: { start: 'I preached the light for forty years and it never once answered. The dark answered on the first night. Forgive me. No. Don\'t.', half: 'Kneel, and be eclipsed!' } }),
  lightlessking24: rboss('Aldwin, the Lightless King', 'bulwark2~ashen', { hpM: 2.8, scale: 2.6, weak: 'holy', resist: 'shadow', school: 'shadow', mechs: ['cleave', 'pool', 'call', 'fear', 'aura', 'enrage'], auraK: .17, adds: 'lightlessknight', lines: { start: 'I opened the gates. I did it for her. She was frightened of growing old, and he said that in the dark, nothing changes. Nothing ever changes. Is that so terrible? Is it?', half: 'Merewen! Merewen, I did it for you!' } }),
});
Object.assign(MOB_LORE, { lightlessknight: 'A knight of Avenmoor who kept his oath to his king, even after his king gave the kingdom to the dark.', lightlessking24: 'Aldwin of Avenmoor, who opened his gates to Vhorun so that his queen would never grow old.' });
giver('aldous13', 'Lord-Warden Aldous Fenn', 'Candlehold · the Candlehold Free', 'aegis1');
giver('nell13', 'Nell Candlewright', 'Candlehold · chandler', 'villager2');
giver('mourne13', 'Sister Mourne', 'Last Hearth · once of the Long Dusk', 'cleric1');
Object.assign(TALK, {
  aldous13: { bio: 'Aldous Fenn was the Lord-Warden of Avenmoor\'s eastern march, which mostly meant counting sheep and settling arguments about fences. Now he holds the last lit town in a kingdom of four hundred thousand people, and he counts candles instead.',
    greet: ["Welcome to Candlehold. Mind the candles. Mind every candle. If you knock one over, light it again before you do anything else, including apologising.", "The sun came up this morning. I know because Nell has an hourglass. We didn't see it, of course. Nobody's seen it in a month."],
    topics: [{ q: 'What happened to Avenmoor?', a: ["The King opened the gates. That's all anyone knows. A month ago, at midnight, King Aldwin rode out to the border, opened the old gate, and invited something in.", "It went over us like a cloud over the moon, and when it had gone, the light hadn't come back. Not the sun, not the stars. Candles still burn. Lanterns still burn. That's all."] }] },
  nell13: { bio: 'Nell made candles for the cathedral in Avenmoor for twenty-six years. She is now, as far as anyone can tell, the most important person in the kingdom, and she is not handling it well.',
    greet: ["Candles! Candles for sale! Candles for free, actually, if you're going out there. Take two. Take ten.", "Do you know how many candles four hundred thousand people need? Neither do I. I've stopped counting. I just make them."],
    topics: [{ q: 'How are you managing?', a: ["Badly! Very badly. I haven't slept in nine days. But every candle I make is a family that can see each other's faces tonight, and that's... that's worth not sleeping, I think.", "Bring me tallow. Bring me wicks. Bring me anything that burns. Please."] }] },
  mourne13: { bio: 'Mourne was a Sister of the Long Dusk, the order that tended Avenmoor\'s cathedral, until the night the Bishop told them the dark was holy. She ran, with eleven children from the cathedral school. They are all at Last Hearth. They are all alive.',
    greet: ["Last Hearth. We keep one fire burning in the middle of the village, day and night, and everyone sleeps around it. The children call it the sun.", "My sisters still wear the grey. If you see a grey robe in the dark, don't stop to ask her name. She doesn't have one any more."],
    topics: [{ q: 'What happened to your order?', a: ["The Bishop came back from the cathedral on the first night and said he'd seen something wonderful. He said the dark had a voice, and it was kind.", "Most of my sisters believed him. They always believed him. I took the children and climbed out of a window. I'm not proud of the window. I'm very proud of the children."] }] },
});
Object.assign(LORE, {
  avengate: { title: 'The King\'s Last Order', where: 'avenmoor', text: "Nailed to the gate of Fallen Avenmoor, in a fine royal hand: 'By order of Aldwin, King of Avenmoor: the gates shall stand open, and the lamps shall be put out, and we shall welcome what comes with courtesy. Nothing shall change any more. Nothing shall ever change. My Queen shall be young for ever. Let it be so.'" },
});
X.VEND = Object.assign(X.VEND || {}, { candlehold: ['Wick-Keeper Tamsel', 'villager3'], lasthearth: ['Old Brannoch', 'villager1'] });
faction('candle', 'The Candlehold Free', '🕯️', 'candlehold', [[1, 200, 'Candlewright\'s Band', Rep.ring('Candlewright\'s Band', 32, 2)], [2, 500, 'Wickfire Steed (mount)', 'mount_wick'], [3, 500, 'Torc of the Last Candle', Rep.ring('Torc of the Last Candle', 35, 3, 'neck')], [4, 0, 'Title: of Candlehold', 'title_candle']], []);
mount('mount_wick', 'Wickfire Steed', 'horse_wick', '#f4e8c8', '#ffd34d', '#5a3a2a', false);
Loot5.COLLECT.title_candle = { type: 'title', name: 'of Candlehold', from: 'rep' };
const M = { zone: 'xm13' }, CF = r => ({ candle: r });
const BEAST = ['gloomstalker', 'candlemoth', 'shadowtreant'], AVEN = ['lightlessknight', 'lightless', 'dusksister', 'gloomcaster'];
for (const m of [...BEAST, ...AVEN]) Rep.KILL_REP[m] = ['candle', 6];
X.arriveHooks.push((zone, from) => zone === 'xm13' ? ({ xt13: { x: 0, z: -460 } }[from] || { x: 460, z: 0 }) : null);
defineZone('xm13', {
  size: 500, seed: 13031, name: 'The Lightless March', bossName: 'Aldwin, the Lightless King', hiH: 12, maxSpawnH: 26,
  land: (x, z, N) => 3 + N.fbm(x * .006, z * .006, 4) * 12 + Math.max(0, N.fbm(x * .016 + 7, z * .016, 3) - .5) * 18,
  pal: PAL_DARK,
  towns: [{ key: 'candlehold', name: 'Candlehold', x: 330, z: 40, R: 30, wall: 'human', gates: [0, Math.PI], roof: '#3a2a2a', hwall: '#5a4a3a', guardName: 'Candle-Warden', guardKind: 'aegis1',
    houses: [[-14, 10, .4, 'hall', 9, 5], [14, 12, -.4, { wall: '#6a5a4a', roof: '#2a2228', floors: 2, h: 5.4 }], [-16, -10, .2, 'hut'], [16, -10, 2.2, 'hut']], props: [[0, 4, 'lantern'], [-4, 0, 'lantern'], [4, 0, 'lantern'], [0, -4, 'lantern'], [-8, 8, 'banner', '#ffd34d']],
    npcs: [['giver', 'aldous13', 0, 0], ['giver', 'nell13', -8, 6], ['vendor', 'candlehold', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[28, 2], [28, -2], [-28, 2], [-28, -2]] },
    { key: 'lasthearth', name: 'Last Hearth', x: -60, z: 380, R: 22, wall: 'palisade', gates: [Math.PI / 2, Math.PI * 1.5], guardName: 'Hearth-Watcher', guardKind: 'archer1',
      houses: [[-6, 6, .3, 'hut'], [6, -6, -.4, 'hut'], [8, 8, 1, 'tent']], props: [[0, 0, 'lantern'], [2, 0, 'lantern'], [-2, 0, 'lantern']],
      npcs: [['giver', 'mourne13', -5, -2], ['vendor', 'lasthearth', 6, -4], ['bind', null, 0, 6]], guards: [[2, -20], [-2, -20]] }],
  roads: [[460, 0, 330, 40], [330, 40, 0, -40], [0, -40, -60, 360], [0, -40, -300, 140]],
  regions: { names: ['The Candle Road', 'Last Hearth', 'The Starless Wood', 'Fallen Avenmoor', 'The Cathedral Hill'], fn: (x, z) => z < -300 ? 4 : x > 160 ? 0 : z > 230 ? 1 : x < -160 ? 2 : 3 },
  open: [{ key: 'avenmoor', name: 'Fallen Avenmoor', x: 0, z: -40, R: 34, deco: 'dead', decoN: 12, ring: true, gap: 0, centre: 'statue', lvl: [31, 32], area: 3,
      packs: [[-18, 0, ['lightlessknight', 'lightless', 'lightless']], [18, 0, ['lightlessknight', 'dusksister']], [0, -18, ['lightless', 'lightless', 'gloomcaster']], [0, 18, ['lightlessknight', 'lightlessknight']]],
      bosses: [[-22, -18, 'sheriffgaunt13', 31], [22, -20, 'bellringer13', 32], [0, -4, 'lordmayor13', 32, true]] },
    { key: 'starlesswood', name: 'The Starless Wood', x: -300, z: 140, R: 34, deco: 'dead', decoN: 26, centre: 'stonecircle', lvl: [32, 33], area: 2,
      packs: [[-18, 0, ['shadowtreant', 'gloomstalker']], [18, 0, ['candlemoth', 'candlemoth', 'gloomstalker']], [0, -18, ['shadowtreant', 'shadowtreant']], [0, 18, ['gloomstalker', 'gloomstalker', 'candlemoth']]],
      bosses: [[-22, -18, 'oldgloam13', 32], [22, -20, 'hollowstag13', 33], [0, -4, 'starlesswitch13', 33, true]] }],
  doors: [{ to: 'shadowcourt', name: 'The Court of Shadows', x: -300, z: -250, ry: 0, label: 'Enter the Court of Shadows (32-33)', col: '#b05aff' },
    { to: 'lightlesscath', name: 'The Lightless Cathedral', x: 60, z: -430, ry: 0, label: 'Enter the Lightless Cathedral (24-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: 200, z: -240, name: 'The Gate Aldwin Opened', R: 14, clear: 10, s: 1.8 }],
  lines: [{ x: 488, z: 0, to: 'xw13', label: 'East, back to the Wound', ry: Math.PI / 2 }, { x: 0, z: -488, to: 'xt13', label: 'South-west to the Throat of the World', ry: 0, why: () => (S.hero?.lvl || 0) < 34 ? 'The Throat of the World is for level 34 and beyond.' : S.quests.xw6?.state !== 'turned' ? 'The dark past the cathedral goes on for ever. Nobody knows the way yet.' : null }],
  spots: { candlehold: { x: 330, z: 40 }, candleroad: { x: 250, z: 120 }, lasthearth: { x: -60, z: 370 }, avenmoor: { x: 0, z: -40 }, wood: { x: -300, z: 140 }, court: { x: -300, z: -240 }, cathedral: { x: 60, z: -420 }, gate: { x: 200, z: -240 } },
  scatter: [[44, [160, 480, -300, 480], ['gloomstalker', 'candlemoth', 'lightless'], [31, 32], 0], [40, [-480, 160, 230, 480], ['candlemoth', 'dusksister', 'gloomstalker', 'lightless'], [31, 32], 1],
    [44, [-480, -160, -300, 230], ['shadowtreant', 'gloomstalker', 'candlemoth'], [32, 33], 2], [44, [-160, 160, -300, 230], ['lightlessknight', 'lightless', 'dusksister', 'gloomcaster'], [31, 32], 3],
    [44, [-480, 480, -480, -300], ['lightlessknight', 'dusksister', 'voidspawn', 'gloomcaster'], [32, 33], 4]],
  camps: [[6, [-480, 160, 230, 480], ['dusksister', 'dusksister', 'gloomcaster'], [31, 32], 1, 'ds'], [6, [-480, 480, -480, -300], ['lightlessknight', 'lightlessknight', 'dusksister'], [32, 33], 4, 'lk']],
  rares: [[[160, 480, -300, 480], 'theblackhart13', 32, false], [[-480, 160, 230, 480], 'widowcandle13', 32, false]],
  hunt: [{ area: 0, lvl: [31, 32] }, { area: 1, lvl: [31, 32] }, { area: 2, lvl: [32, 33] }, { area: 3, lvl: [31, 32] }, { area: 4, lvl: [32, 33] }],
  labels: [{ t: 'The Candle Road (31-32)', x: 260, z: 160 }, { t: 'Last Hearth (31-32)', x: -60, z: 300 }, { t: 'The Starless Wood (32-33)', x: -300, z: 60 }, { t: 'Fallen Avenmoor (31-32)', x: 0, z: 40 }, { t: 'The Cathedral Hill (32-33)', x: 0, z: -360 }],
  nodes: [['voidiron', 'ore', 'oresilver', 150, null, 20], ['gloomcap', 'herb', 'herbgrave', 150, null, 30]],
  scenery: { density: 18000, tuft: '#4a4a5a', kinds: [['dead', .04, 1, 2.2], ['snowpine', .02, 1, 2], ['icerock', .01, .8, 1.6]] },
  sky: { fog: '#14141c', top: '#06060a', hor: '#1e1e2a', k: .75, far: 150 },
});
defineDungeon({ key: 'shadowcourt', name: 'The Court of Shadows', parent: 'xm13', plan: 'nave', floor: '#3a3440', rock: '#121016', fog: '#1a161e', light: .4, lvl: [32, 33], prop: 'lantern',
  mobs: ['lightlessknight', 'lightless', 'dusksister', 'gloomcaster'], bosses: ['chamberlain13', 'jester13', 'blackknight13', 'lightlessqueen13'], exitLabel: 'Back out into the dark' });
defineDungeon({ key: 'lightlesscath', name: 'The Lightless Cathedral', parent: 'xm13', plan: 'nave', floor: '#2e2a34', rock: '#0e0c12', fog: '#16121c', light: .4, lvl: [35, 35], prop: 'banner', propArg: '#2a2236', raid: true,
  mobs: ['lightlessknight', 'dusksister', 'lightless', 'gloomcaster', 'candlemoth'], bosses: ['gargoyle24', 'organist24', 'choirdark24', 'bishop24', 'lightlessking24'], exitLabel: 'Back out onto the Cathedral Hill' });
addDungeon35('shadowcourt', 'The Court of Shadows', [32, 33]); addRaid24('lightlesscath', 'The Lightless Cathedral');
tier({ avenmoor: 13, starlesswood: 13, shadowcourt: 14, lightlesscath: 16 });

QUESTS.push(...finish35([
  { id: 'xm1', story: true, giver: 'aldous13', lvl: 31, pre: 'xw6', name: 'Where the Sun Doesn\'t Rise', where: 'candleroad', ...M, rep: CF(300), obj: { kill: [...BEAST, 'lightless'], n: 12, near: 'candleroad', nearR: 240, what: 'Clear 12 creatures of the dark from the Candle Road' },
    say: ["You came in from the Wound? Then you came down the Candle Road, and you saw what's on it. We used to light a candle every fifty paces so the carts could find their way. The moths eat them now.", "Twelve of the things on the road, please. The carts from the Wound bring us food. If the carts stop, we stop."],
    done: ["Nell's sending a boy out with a box of candles to relight the road. He's eleven. He volunteered. I wish he hadn't, and I'm so proud of him I could burst."] },
  { id: 'xm2', story: true, giver: 'nell13', lvl: 31, pre: 'xm1', name: 'Tallow and Wick', where: 'candleroad', ...M, rep: CF(300), obj: { collect: BEAST, item: 'Lump of Gloom-Tallow', chance: .5, n: 8, what: 'Gather 8 lumps of gloom-tallow from the beasts of the March' },
    say: ["The beasts out there have gone fat in the dark, and fat is tallow, and tallow is candles. I know how that sounds. I've stopped minding how things sound.", "Eight lumps, please. That's four hundred candles. That's a street. That's a whole street that can see tonight."],
    done: ["Oh, that's good tallow. That's wonderful tallow. It smells terrible. I'm going to make it into the brightest candles in the kingdom."] },
  { id: 'xm3', story: true, giver: 'aldous13', lvl: 32, pre: 'xm2', name: 'Fallen Avenmoor', where: 'avenmoor', ...M, rep: CF(400), obj: { named: 'lordmayor13', n: 1, what: 'Go into Fallen Avenmoor and depose Lord Mayor Aldric Vane' },
    say: ["Avenmoor was the capital. Ninety thousand people. When the dark came, most of them just... sat down. In the streets, in their kitchens. And then, after a while, they got up again, and they weren't themselves.", "The Lord Mayor is still in the town hall, giving orders. He was always good at giving orders. Stop him giving them."],
    done: ["Aldric. We used to play cards. He cheated. I always let him. Did he say anything? About the King?", "The cathedral. Of course. Aldwin always loved that cathedral. He used to say it was the only place in Avenmoor quiet enough to think."] },
  { id: 'xm4', story: true, giver: 'mourne13', lvl: 32, pre: 'xm1', name: 'The Sisters of the Long Dusk', where: 'lasthearth', ...M, rep: CF(400), obj: { kill: ['dusksister', 'gloomcaster', 'lightlessknight'], n: 12, near: 'lasthearth', nearR: 260, what: 'Drive off 12 of the Long Dusk around Last Hearth' },
    say: ["My sisters come to the edge of the firelight every night and call the children by name. Sweetly. The way we used to call them in from the yard.", "The children know not to go. But they're children, and the voices are so kind. Twelve of them, please. I can't do it myself. I taught half of them their letters."],
    done: ["The children slept through the night. All eleven. The first time since we came here. Thank you. Thank you. I'm going to sit down now for a little while."] },
  { id: 'xm5', story: true, giver: 'mourne13', lvl: 33, pre: 'xm4', pre2: 'xm3', name: 'The Starless Wood', where: 'wood', ...M, rep: CF(500), obj: { named: 'starlesswitch13', n: 1, what: 'Go into the Starless Wood and end the Starless Witch' },
    say: ["There's a woman in the wood west of here who's been calling the dark into the trees. Old Mother Hesk, she used to be. She read the stars for the village. She asked the stars for a hundred years to talk to her, and they never did.", "Now something does. And everything that grows in the wood grows towards her, the way a plant grows towards the sun. End it, Lightkeeper. Gently, if she'll let you. She won't."],
    done: ["The trees are still. I could hear them from here, you know, growing. A sound like knuckles cracking. It's stopped.", "She just wanted to be spoken to. That's all any of them wanted. That's how he gets in."] },
  { id: 'xm6', story: true, giver: 'aldous13', lvl: 33, pre: 'xm5', name: 'The Court of Shadows', where: 'court', ...M, rep: CF(600), obj: { named: 'lightlessqueen13', n: 1, what: 'Enter the Court of Shadows and defeat Queen Merewen the Lightless' },
    say: ["The palace sits in the south-west of the March, and the Queen is still in it. Merewen. She was frightened of growing old, everyone knew that. The King adored her. He'd have given her anything.", "He did give her anything. He gave her the dark. Go in, Lightkeeper. See what's become of her. Then end it."],
    done: ["She's... she was young? Still young? After all this? He really did it, then. He really kept her young.", "The King is in the cathedral on the hill. When you're ready, and only when you're ready, you'll need more than a handful of friends to get through those doors. You'll need an army."] },
  { id: 'xm7', story: true, giver: 'aldous13', lvl: 35, needLvl: 35, pre: 'xm6', name: 'The Lightless Cathedral', where: 'cathedral', ...M, rep: CF(1000), obj: { named: 'lightlessking24', n: 1, what: 'Enter the Lightless Cathedral and defeat Aldwin, the Lightless King (24-person raid)' },
    say: ["Aldwin opened the gate. While he sits on his throne in that cathedral, the gate stays open, and the dark stays in. That's what Mourne's sisters say, and for once I believe them.", "Twenty-four of you, Lightkeeper. The cathedral has four hundred voices in it, and every one of them used to be somebody's. Bring the light back to Avenmoor."],
    done: [['aldous13', "Lightkeeper. Look up. Look at the sky."], ['aldous13', "It's grey. It's only grey. But it's grey, and that's light coming through, and Nell is crying into her wax, and I don't think I've ever seen anything so beautiful in my life."]] },
  { id: 'xmx1', giver: 'nell13', lvl: 32, pre: 'xm2', name: 'The Black Hart', where: 'candleroad', ...M, rep: CF(250), obj: { named: 'theblackhart13', n: 1, what: 'Hunt down the Black Hart on the Candle Road' },
    say: ["There's a beast on the road that knocks over the carts. A great black hart, with antlers like a chandelier. It goes for the candles first. I think it hates them.", "I'd like its tallow. I know. I know! But it'd make a thousand candles, and I've stopped being ashamed of anything."],
    done: ["A thousand candles. No. Twelve hundred. I'll name every one of them after you. That's going to get confusing."] },
  { id: 'xmx2', giver: 'mourne13', lvl: 32, pre: 'xm4', name: 'Grey Veils', where: 'lasthearth', ...M, rep: CF(250), obj: { collect: ['dusksister'], item: 'Grey Veil', chance: .55, n: 6, what: 'Take 6 grey veils from the Sisters of the Long Dusk' },
    say: ["Every sister of my order wore a grey veil, embroidered with her name. When she took her vows she stopped saying it, but she wore it, so somebody would remember.", "Bring me six. I'll read them out by the fire tonight. The children should know their teachers had names."],
    done: ["Sister Agathe. Sister Wenna. Sister Callis, who could never keep a tune. Sister Orla. Sister Brin. And Sister Anwen. She taught me. Thank you."] },
  { id: 'xmy1', daily: true, giver: 'aldous13', lvl: 32, pre: 'xm1', name: 'Daily: Keep the Candles Lit', ...M, rep: CF(200), obj: { kill: [...BEAST, ...AVEN], n: 12, what: 'Defeat 12 creatures of the Lightless March' },
    say: ["The candles on the road go out every night. Twelve of the things that put them out, if you'd be so kind."], done: ["Nell's boy will be glad. He's started naming the candles."] },
  { id: 'xmy2', daily: true, giver: 'nell13', lvl: 33, pre: 'xm2', name: 'Daily: Tallow Run', ...M, rep: CF(200), obj: { collect: BEAST, item: 'Lump of Gloom-Tallow', chance: .5, n: 6, what: 'Gather 6 lumps of gloom-tallow' },
    say: ["I'm out of tallow again. I'm always out of tallow. Six lumps, please, before the evening shift."], done: ["Wonderful. Terrible-smelling. Wonderful."] },
]));
