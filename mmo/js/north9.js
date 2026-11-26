// Build 9: the Rimewild (levels 20-25). North of the wastes lies Kaldmark, the snow-kingdom that fell in the
// same war as Vharos and froze where it fell. Its survivors hold Hearthfrost; its dead stand in the ice, waiting
// for the Frost-King, who has heard the Gravelord is gone and wants his old army back.
import { S, X } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, addRaid, addDungeonLFG, tier, faction, mount, finishQuests, giver } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';

Object.assign(MOBS, {
  frostwolf: mob('Rimewolf', 'wolf', { ...B, spd: 6.6, weak: 'fire', resist: 'frost', scale: 1.2, aggro: 11, social: 10 }),
  rimebear: mob('Rime Bear', 'bear', { ...B, hpM: 1.35, dmgM: 1.15, weak: 'fire', resist: 'frost', scale: 1.2 }),
  icetroll: mob('Ice Troll', 'troll', { hpM: 1.4, dmgM: 1.15, range: 2.8, weak: 'fire', resist: 'frost', scale: 1.15 }),
  snowharpy: mob('Snow Harpy', 'harpy', { ...B, hpM: .9, fly: 1.2, range: 16, ranged: true, weak: 'fire', resist: 'frost' }),
  rimedead: mob('Frozen Kaldman', 'skeleton', { ...U, hpM: 1.15, weak: 'fire', resist: 'frost' }),
  frostshade: mob('Frost Shade', 'wraith', { ...U, hpM: .9, range: 18, ranged: true, caster: true, school: 'frost', weak: 'fire', resist: 'frost', fly: .4 }),
  frostelem: mob('Frost Elemental', 'waterpet', { hpM: 1.2, weak: 'fire', resist: 'frost', scale: 1.15 }),
  wintersworn: mob('Wintersworn Raider', 'guard', { ...HU, hpM: 1.2, weak: 'fire', resist: 'frost' }),
  wintercaller: mob('Wintersworn Rimecaller', 'cultist1', { ...HU, hpM: .85, range: 18, ranged: true, caster: true, healer: true, school: 'frost', weak: 'fire', resist: 'frost' }),
  winterbow: mob('Wintersworn Bowman', 'xbow', { ...HU, hpM: .85, range: 22, ranged: true, weak: 'fire' }),
  // named
  oldwhite: boss('Old White', 'bear', { ...B, hpM: 1.6, scale: 2.1, weak: 'fire', resist: 'frost', mechs: ['cleave', 'charge'] }),
  thestillqueen: boss('The Still Queen', 'ghostnpc', { ...U, range: 18, ranged: true, caster: true, school: 'frost', resist: 'frost', mechs: ['fear', 'pool'] }),
  // the Frozen Barracks
  sergeantrime: boss('Sergeant Rime', 'skeleton', { ...U, scale: 1.6, mechs: ['cleave', 'call'], adds: 'rimedead', lines: { start: 'Kaldmark holds! Kaldmark always holds! Stand to, you frozen layabouts!', half: 'Company! Form up!' } }),
  thequartermaster: boss('The Frozen Quartermaster', 'abom', { ...U, scale: 1.5, mechs: ['slam', 'pool'], lines: { start: '*It is still counting the rations. It has been counting for a hundred years.*', half: '*It throws a barrel of frozen salt pork at you.*' } }),
  captainhalvard: boss('Captain Halvard the Unthawed', 'bladewarden0', { ...U, hpM: 1.7, scale: 1.5, weak: 'fire', resist: 'frost', mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'rimedead', lines: { start: 'The king said hold the barracks until relieved. Nobody came. I am still holding. Are you the relief?', half: 'To me, Kaldmark!' } }),
  // the Icefang Caverns
  broodmother: boss('Icefang Broodmother', 'spider', { ...B, scale: 2.4, weak: 'fire', resist: 'frost', mechs: ['web', 'spawn'], adds: 'frostwolf', lines: { start: '*The cavern walls are white with webs, and the webs are moving.*', half: '*Wolves pour out of the ice.*' } }),
  glacierheart: boss('The Glacier\'s Heart', 'waterpet', { scale: 2.4, weak: 'fire', resist: 'frost', mechs: ['pool', 'shield', 'slam'], lines: { start: '*The ice itself stands up.*', half: '*The temperature drops. Your breath freezes in the air.*' } }),
  hrothgar: boss('Hrothgar the Hungering', 'troll', { hpM: 1.7, scale: 2, weak: 'fire', resist: 'frost', mechs: ['cleave', 'slam', 'charge', 'enrage'], lines: { start: 'HROTHGAR SMELLS WARM MEAT. HROTHGAR HAS NOT HAD WARM MEAT IN A VERY LONG TIME.', half: 'MORE MEAT!' } }),
  // the Glacier Tomb
  tombwarden: boss('The Tomb-Warden', 'golempet', { scale: 2.2, weak: 'fire', resist: 'frost', mechs: ['slam', 'shield'], lines: { start: '*An iron sentinel, frosted white, turns its head.*', half: '*It grinds the floor with its fists.*' } }),
  thefrozenchoir: boss('The Frozen Choir', 'wraith', { ...U, fly: .4, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['fear', 'volley'], lines: { start: '*Twelve voices sing a funeral hymn for a king who is not dead.*', half: '*The hymn becomes a howl.*' } }),
  queenyrsild: boss('Queen Yrsild', 'ghostnpc', { ...U, scale: 1.4, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'heal', 'fear'], lines: { start: 'My husband waits for his crown. You are standing between him and it.', half: 'Ulvhar! Husband! Wake!' } }),
  thefirstjarl: boss('The First Jarl', 'bulwark2', { ...U, hpM: 1.8, scale: 1.6, weak: 'fire', resist: 'frost', mechs: ['cleave', 'slam', 'call', 'enrage'], adds: 'rimedead', lines: { start: 'I founded Kaldmark with an axe and a promise. The promise is broken. I still have the axe.', half: 'Kaldmark! Kaldmark!' } }),
  // Kaldmark Keep
  wintermaw: boss('Wintermaw', 'wolf', { ...B, scale: 2.4, weak: 'fire', resist: 'frost', mechs: ['charge', 'hounds'], adds: 'frostwolf', lines: { start: '*The king\'s hound has been waiting at the gate for a hundred years. It is very hungry.*', half: '*It howls, and the pack answers.*' } }),
  lordchamberlain: boss('Lord Chamberlain Vigge', 'priest', { ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['heal', 'volley', 'shield'], lines: { start: 'You have no appointment. His Majesty sees no one without an appointment.', half: 'Guards! Guards!' } }),
  theicesmith: boss('The Ice-Smith', 'troll', { scale: 1.8, weak: 'fire', resist: 'frost', mechs: ['cleave', 'pool', 'knock'], lines: { start: 'I forged the Frost-King\'s crown. It took me a hundred years. Do not scratch it.', half: 'Hot! HOT! Too hot!' } }),
  thewinterheir: boss('Prince Ivar, the Winter Heir', 'bladewarden2', { ...U, hpM: 1.8, scale: 1.5, weak: 'fire', resist: 'frost', mechs: ['cleave', 'charge', 'pool', 'enrage'], lines: { start: 'My father will wake when the crown is ready. Until then, I hold his hall. I have always held it. I am very tired.', half: 'Father! Father, wake!' } }),
  // the Crown of Winter: raid
  huntsman: rboss('Hrimgar the Huntsman', 'archer2', { hpM: 2.1, ...U, range: 22, ranged: true, weak: 'fire', resist: 'frost', mechs: ['volley', 'hounds', 'charge'], adds: 'frostwolf', lines: { start: 'The king\'s hunt rides again. You are the quarry.', half: 'Release the hounds!' } }),
  longnight: rboss('The Sisters of the Long Night', 'ghostnpc', { hpM: 2.2, ...U, range: 18, ranged: true, caster: true, school: 'frost', mechs: ['pool', 'fear', 'heal', 'volley'], lines: { start: 'We sang the sun down. We will sing you down too.', half: 'Darker! Colder!' } }),
  thefrostwyrm: rboss('Skarnvold, the Frost-Wyrm', 'leviathan', { hpM: 2.4, scale: .9, weak: 'fire', resist: 'frost', mechs: ['pool', 'slam', 'knock', 'enrage'], lines: { start: '*Something enormous and white uncoils from the glacier.*', half: '*Its breath turns the hall to ice.*' } }),
  frostking: rboss('Ulvhar, the Frost-King', 'gravelord', { hpM: 2.6, ...U, scale: 2.4, range: 18, ranged: true, caster: true, school: 'frost', weak: 'fire', resist: 'frost', mechs: ['pool', 'call', 'fear', 'slam', 'enrage'], adds: 'rimedead', lines: { start: 'The Gravelord promised me my kingdom back. He failed. But the voice beneath him promised more. It promised me the whole world, frozen, and silent, and mine.', half: 'Rise, Kaldmark! Your king commands it!' } }),
});
Object.assign(MOB_LORE, { rimedead: 'A soldier of Kaldmark, frozen where he fell a hundred years ago. The cold kept him. Something else is waking him.', wintersworn: 'A raider of the Wintersworn, who worship the Frost-King and want the long winter to cover the world.',
  frostking: 'Ulvhar, the last king of Kaldmark, who made a bargain with the Gravelord to save his kingdom and lost it anyway.' });
giver('sigrun', 'Jarl Sigrun Ashhand', 'Hearthfrost · the Hearthfrost Watch', 'bulwark2');
giver('olle', 'Old Olle', 'Hearthfrost · skald and storyteller', 'bard1');
giver('maelis', 'Ranger Maelis', 'Wolfwatch · the Watch\'s eyes', 'archer0_varr');
giver('hjalm', 'Hjalm Stonefist', 'Wolfwatch · smith and grudge-holder', 'bladewarden1_grael');
Object.assign(TALK, {
  sigrun: { bio: "Sigrun Ashhand is the granddaughter of the last free jarl of Kaldmark. She burned her right hand putting out the fire in Hearthfrost's great hall when she was twelve, and has led the survivors ever since.",
    greet: ["Close the door. Close it! Every bit of warmth in Hearthfrost was paid for by somebody.", "You've come up from the wastes. Then you know what the dead are like. Ours are frozen. That doesn't make them any friendlier."],
    topics: [{ q: 'What happened to Kaldmark?', a: ["In the summoner wars, King Ulvhar made a bargain with the Gravelord: he would let the dead march through Kaldmark to Vharos, and in return Kaldmark would be spared.", "Kaldmark was not spared. The Gravelord's army froze in our passes, and so did ours, and so did the king. A century of snow fell on all of them. We are what's left: two towns and a lot of graves."] },
      { q: 'Who are the Wintersworn?', a: ["Fools. They think Ulvhar is still king, under the ice, and that when he wakes he'll make the whole world into Kaldmark: cold and clean and quiet.", "They raid our caravans and pray to the snow. Lately the snow has started answering."] }] },
  olle: { bio: 'Olle has been the skald of Hearthfrost for fifty years. He knows every saga of Kaldmark by heart, and several that he admits he made up.', greet: ["Sit by the fire and I'll tell you of the Fall of Kaldmark. No? The Saga of Sigrun's Hand? The time I fought a bear? It was a small bear.", "A song for the road? No? Then a warning: never trust snow that's quiet."], topics: [] },
  maelis: { bio: 'Maelis is a Varr who came north looking for a quiet life and found a war instead. She runs Wolfwatch, the Watch\'s outpost in the pines, and talks to the rimewolves. She says some of them talk back.', greet: ["The wolves are restless. So am I.", "The Frozen Field is to the west. Don't go there at night. The dead stand up when nobody's looking."], topics: [] },
  hjalm: { bio: 'Hjalm is a Grael who walked north from the Kilnlands because the cold makes the fire in his chest burn brighter. He forges the Watch\'s axes and holds grudges against eleven people by name.', greet: ["The cold is good for the forge. The forge is good for the cold. Everyone wins.", "Bring me rime-iron and I'll make you an axe that remembers every cut."], topics: [] },
});
Object.assign(LORE, {
  ulvharpact: { title: 'King Ulvhar\'s Pact', where: 'kaldkeep', text: "'I, Ulvhar, King of Kaldmark, grant the Lord of Graves passage for his host through the passes of my kingdom. In return, my kingdom shall be spared, and I shall not die.' Underneath, in a different ink: 'The second half of the bargain has been honored. The voice beneath the Lord remembers its promises, even when the Lord does not.'" },
  frozenletter: { title: 'A Soldier\'s Letter', where: 'barracks', text: "'Dear Inga. It is very cold. The sergeant says the relief will come soon. I believe him. I am writing this so you know I am still holding. I will be holding when you read this. I will be holding for as long as it takes.'" },
});
faction('hearth', 'The Hearthfrost Watch', '🔥', 'hearthfrost', [[1, 160, 'Watch-Band of Hearthfrost', Rep.ring('Watch-Band of Hearthfrost', 22, 2)], [2, 400, 'Rimewool Charger (mount)', 'mount_rimewool'], [3, 400, 'Jarl\'s Torc', Rep.ring("Jarl's Torc", 25, 3, 'neck')], [4, 0, 'Title: of Hearthfrost', 'title_hearth']],
  ['frostwolf', 'rimebear', 'icetroll', 'snowharpy', 'rimedead', 'frostshade', 'frostelem', 'wintersworn', 'wintercaller', 'winterbow']);
mount('mount_rimewool', 'Rimewool Charger', 'horse_rimewool', '#e8eef4', '#a8c8e8', '#2e4a7a', true);
Loot5.COLLECT.title_hearth = { type: 'title', name: 'of Hearthfrost', from: 'rep' };
X.VEND = Object.assign(X.VEND || {}, { hearthfrost: ['Trader Ingrid', 'villager3'], wolfwatch: ['Quartermaster Bjorn', 'guard'] });

defineZone('north', {
  size: 500, seed: 9505, name: 'The Rimewild', bossName: 'Ulvhar, the Frost-King', land: (x, z, N) => 3 + N.fbm(x * .006, z * .006, 4) * 16 + Math.max(0, N.fbm(x * .015 + 9, z * .015, 3) - .5) * 26, hiH: 12, maxSpawnH: 20,
  pal: { a: '#dfe6ee', b: '#c8d4e0', hi: '#8a9aa8', road: '#8a7a6a', cob: '#a8a49a', low: '#b0c4d4' },
  towns: [{ key: 'hearthfrost', name: 'Hearthfrost', x: 0, z: 390, R: 32, wall: 'human', gates: [Math.PI / 2, Math.PI * 1.5], roof: '#4a3a3a', hwall: '#7a6a5a', guardName: 'Hearthfrost Shieldmaid', guardKind: 'bulwark1',
    houses: [[-14, 10, .4, 'hall', 9, 5], [14, 12, -.4, 'hall', 9, 5], [-16, -10, .2, { wall: '#8a7a6a', roof: '#3a3a4a', floors: 2, h: 5.4 }], [16, -10, 2.2, 'icehut', 6, 6]],
    props: [[0, 4, 'lantern'], [-6, 0, 'banner', '#8a2a22'], [6, 0, 'banner', '#8a2a22'], [0, -20, 'statue']],
    npcs: [['giver', 'sigrun', 0, 0], ['giver', 'olle', -8, 6], ['vendor', 'hearthfrost', 8, 6], ['bind', null, 3, -4], ['armory', null, -6, -6]], guards: [[2, 30], [-2, 30], [2, -30], [-2, -30]] },
    { key: 'wolfwatch', name: 'Wolfwatch', x: 300, z: 80, R: 20, wall: 'palisade', gates: [Math.PI, Math.PI / 2], guardName: 'Watch Ranger', guardKind: 'archer1',
      houses: [[-6, 6, .3, 'tent'], [6, -6, -.4, 'tent']], props: [[0, 0, 'totem'], [4, 4, 'lantern']],
      npcs: [['giver', 'maelis', -5, -2], ['giver', 'hjalm', 4, 3], ['vendor', 'wolfwatch', 6, -4], ['bind', null, 0, 6]], guards: [[-18, 2], [-18, -2]] }],
  roads: [[0, 360, 60, 200], [60, 200, 300, 80], [60, 200, -80, 40], [-80, 40, -40, -200], [-40, -200, 0, -360]],
  regions: { names: ['Hearthfrost Vale', 'The Wolfwatch Pines', 'The Frozen Field', 'The Icefang Peaks', 'Kaldmark'], fn: (x, z) => z > 250 ? 0 : z < -240 ? 4 : x > 100 ? (z > -40 ? 1 : 3) : 2 },
  open: [{ key: 'barracks', name: 'The Frozen Barracks', x: -320, z: 100, R: 34, deco: 'icerock', decoN: 20, ring: true, gap: 0, centre: 'banner', lvl: [21, 22], area: 2,
      packs: [[-18, 0, ['rimedead', 'rimedead', 'frostshade']], [18, 0, ['rimedead', 'frostshade']], [0, -18, ['rimedead', 'rimedead', 'rimedead']], [0, 18, ['frostshade', 'rimedead', 'frostelem']]],
      bosses: [[-22, -18, 'sergeantrime', 21], [22, -20, 'thequartermaster', 22], [0, -4, 'captainhalvard', 22, true]] },
    { key: 'icefang', name: 'The Icefang Caverns', x: 330, z: -170, R: 34, deco: 'icerock', decoN: 28, centre: 'crystal', lvl: [23, 24], area: 3,
      packs: [[-18, 0, ['frostwolf', 'frostwolf', 'icetroll']], [18, 0, ['frostelem', 'frostelem']], [0, -18, ['icetroll', 'frostwolf']], [0, 18, ['frostelem', 'frostwolf', 'frostwolf']]],
      bosses: [[-22, -18, 'broodmother', 23], [22, -20, 'glacierheart', 24], [0, -4, 'hrothgar', 24, true]] }],
  doors: [{ to: 'glaciertomb', name: 'The Glacier Tomb', x: -300, z: -180, ry: 0, label: 'Enter the Glacier Tomb (22-23)', col: '#9ad8ff' },
    { to: 'kaldkeep', name: 'Kaldmark Keep', x: 120, z: -400, ry: 0, label: 'Enter Kaldmark Keep (24-25)', col: '#9ad8ff' },
    { to: 'wintercrown', name: 'The Crown of Winter', x: -60, z: -460, ry: 0, label: 'Climb to the Crown of Winter (12-person raid)', col: '#ffffff' }],
  landmarks: [{ g: 'statue', x: -150, z: -40, name: 'The Frozen Field', R: 30, clear: 10, s: 1.6 }, { g: 'stonecircle', x: 220, z: -300, name: 'The Wolf-Stones', R: 16, clear: 12 }],
  lines: [{ x: 0, z: 486, to: 'wastes', label: 'South to the Blighted Wastes', ry: Math.PI }],
  spots: { hearthvale: { x: 40, z: 280 }, pines: { x: 300, z: 140 }, frozenfield: { x: -150, z: -40 }, peaks: { x: 300, z: -120 }, kaldmark: { x: 0, z: -380 }, wolfstones: { x: 220, z: -300 }, wintersworncamp: { x: -250, z: -320 } },
  scatter: [[40, [-480, 480, 250, 480], ['frostwolf', 'rimebear', 'snowharpy'], [20, 21], 0], [44, [100, 480, -40, 250], ['frostwolf', 'rimebear', 'snowharpy', 'frostelem'], [21, 22], 1],
    [48, [-480, 100, -240, 250], ['rimedead', 'frostshade', 'rimedead', 'frostwolf'], [22, 23], 2], [44, [100, 480, -240, -40], ['icetroll', 'frostelem', 'snowharpy', 'rimebear'], [23, 24], 3],
    [44, [-480, 480, -480, -240], ['rimedead', 'frostshade', 'icetroll', 'frostelem'], [24, 25], 4]],
  camps: [[6, [-480, 100, -240, 250], ['wintersworn', 'wintercaller', 'winterbow'], [22, 23], 2, 'ws'], [6, [-480, 480, -480, -240], ['wintersworn', 'wintersworn', 'wintercaller', 'winterbow'], [24, 25], 4, 'wk']],
  rares: [[[100, 480, -40, 250], 'oldwhite', 22, false], [[-480, 100, -240, 250], 'thestillqueen', 23, true]],
  hunt: [{ area: 0, lvl: [20, 21] }, { area: 1, lvl: [21, 22] }, { area: 2, lvl: [22, 23] }, { area: 3, lvl: [23, 24] }, { area: 4, lvl: [24, 25] }],
  labels: [{ t: 'Wolves, bears (20-21)', x: 0, z: 300 }, { t: 'The Pines (21-22)', x: 300, z: 160 }, { t: 'The Frozen Field (22-23)', x: -200, z: 20 }, { t: 'Trolls, elementals (23-24)', x: 300, z: -100 }, { t: 'Kaldmark (24-25)', x: 0, z: -360 }],
  nodes: [['rimeiron', 'ore', 'oreiron', 90, null, 24], ['frostbloom', 'herb', 'herbmeadow', 90, null, 24]],
  scenery: { density: 22000, tuft: '#c8d8e0', kinds: [['snowpine', .05, 1.2, 2.4], ['icerock', .01, .8, 1.8], ['dead', .004, 1, 1.6]] },
  sky: { fog: '#c8d8e8', top: '#7a9ab8', hor: '#e8f0f8', k: .5, far: 220 },
});
defineDungeon({ key: 'glaciertomb', name: 'The Glacier Tomb', parent: 'north', plan: 'cells', floor: '#a8b8c8', rock: '#3a4a5a', fog: '#8aa0b8', light: .55, lvl: [22, 23], prop: 'bluelamp',
  mobs: ['rimedead', 'frostshade', 'frostelem', 'rimedead'], bosses: ['tombwarden', 'thefrozenchoir', 'queenyrsild', 'thefirstjarl'], exitLabel: 'Back out to the Frozen Field' });
defineDungeon({ key: 'kaldkeep', name: 'Kaldmark Keep', parent: 'north', plan: 'nave', floor: '#8a8a94', rock: '#2a2a34', fog: '#6a7a8a', light: .5, lvl: [24, 25], prop: 'banner', propArg: '#3a5a8a',
  mobs: ['rimedead', 'wintersworn', 'wintercaller', 'frostshade', 'winterbow'], bosses: ['wintermaw', 'lordchamberlain', 'theicesmith', 'thewinterheir'], exitLabel: 'Back out to Kaldmark' });
defineDungeon({ key: 'wintercrown', name: 'The Crown of Winter', parent: 'north', plan: 'winding', floor: '#c8d4e0', rock: '#4a5a6a', fog: '#a8b8c8', light: .5, lvl: [25, 25], prop: 'icerock', raid: true,
  mobs: ['rimedead', 'frostelem', 'wintersworn', 'frostshade', 'icetroll'], bosses: ['huntsman', 'longnight', 'thefrostwyrm', 'frostking'], exitLabel: 'Back down to Kaldmark' });
addDungeonLFG('glaciertomb', 'The Glacier Tomb', [22, 23]); addDungeonLFG('kaldkeep', 'Kaldmark Keep', [24, 25]); addRaid('wintercrown', 'The Crown of Winter');
tier({ barracks: 7, icefang: 8, glaciertomb: 7, kaldkeep: 8, wintercrown: 9 });

const N = { zone: 'north' }, Hh = r => ({ hearth: r });
const VALE = ['frostwolf', 'rimebear', 'snowharpy'], FIELD = ['rimedead', 'frostshade'], WS = ['wintersworn', 'wintercaller', 'winterbow'];
QUESTS.push(...finishQuests([
  { id: 'nn1', story: true, giver: 'wrenash', turnTo: 'sigrun', lvl: 20, needLvl: 20, name: 'Smoke in the North', rep: Hh(250), obj: { talk: true, what: 'Take the north-western road out of the wastes into the Rimewild, and find Jarl Sigrun in Hearthfrost' },
    say: ["When I scouted the far north of the wastes, I found a road going up into the snow, and smoke at the end of it. Somebody lives up there, in Kaldmark, which everyone says fell a hundred years ago.", "And there were footprints in the snow, going north. Thousands of them. Bare feet. Go and see who's lighting fires, and whether they know whose feet those are."],
    done: [['sigrun', "A southerner! And one who looks like they can swing a sword. Close the door, close it, and sit by the fire."], ['sigrun', "Bare feet in the snow, coming north. Then the frozen dead are walking again. You'd better hear the rest."]] },
  { id: 'nn2', story: true, giver: 'sigrun', lvl: 20, pre: 'nn1', name: 'Wolves at the Woodpile', where: 'hearthvale', ...N, rep: Hh(250), obj: { kill: VALE, n: 14, near: 'hearthvale', nearR: 230, what: 'Drive off 14 rimewolves, rime bears or snow harpies around Hearthfrost' },
    say: ["The beasts of the Vale are hungrier this year. The cold has teeth, and so does everything that lives in it. Fourteen of them, and we can cut firewood again without losing woodcutters."],
    done: ["Fourteen! Olle will want to make a saga of it. Don't let him; he'll get your name wrong."] },
  { id: 'nn3', story: true, giver: 'sigrun', turnTo: 'maelis', lvl: 21, pre: 'nn2', name: 'The Wolfwatch', where: 'pines', ...N, rep: Hh(250), obj: { talk: true, what: 'Take the eastern road to Wolfwatch and find Ranger Maelis' },
    say: ["Maelis runs Wolfwatch, in the pines to the east. She sees more of the Rimewild than anyone. If the dead are moving, she'll know where they're going."],
    done: [['maelis', "Sigrun sent you? Good. I need hands. The dead on the Frozen Field have been standing up at night, and in the morning they're always a little closer to Kaldmark."]] },
  { id: 'nn4', story: true, giver: 'maelis', lvl: 21, pre: 'nn3', name: 'The Frozen Field', where: 'frozenfield', ...N, rep: Hh(300), obj: { kill: FIELD, n: 12, near: 'frozenfield', nearR: 240, what: 'Put down 12 frozen Kaldmen or frost shades on the Frozen Field' },
    say: ["The Frozen Field is where Kaldmark's army froze. A hundred years they stood there, like statues. Now they walk. Twelve of them, and tell me what you see in their eyes."],
    done: ["Blue light? Then something's calling them. The Wintersworn have been singing to the snow. I think the snow's finally singing back."] },
  { id: 'nn5', story: true, giver: 'maelis', lvl: 22, pre: 'nn4', name: 'The Wintersworn', where: 'wintersworncamp', ...N, rep: Hh(300), obj: { kill: WS, n: 12, near: 'wintersworncamp', nearR: 260, what: 'Break up 12 Wintersworn raiders and rimecallers' },
    say: ["The Wintersworn camp in the west, by the old tombs. They pray to King Ulvhar, who died a hundred years ago, and they say he's coming back.", "Twelve of them. Let's see how much they pray with fewer of them."],
    done: ["Broken, and their camps burned. One of them laughed while he died, and said the king would be crowned again in the Glacier Tomb. Hjalm knows the tomb."] },
  { id: 'nn6', story: true, giver: 'hjalm', lvl: 22, pre: 'nn5', name: 'The First Jarl\'s Tomb', where: 'frozenfield', ...N, rep: Hh(400), obj: { named: 'thefirstjarl', n: 1, what: 'Defeat the First Jarl in the Glacier Tomb' },
    say: ["The Glacier Tomb holds every king of Kaldmark, all the way back to the First Jarl, who founded it with an axe. The Wintersworn are waking them, one by one, to crown Ulvhar.", "Go in and put them back to sleep. All of them. Start with the first, and work forward."],
    done: ["The First Jarl's axe. Look at that edge. A hundred years under the ice and it still cuts. I'll make you something from it, if Sigrun lets me."] },
  { id: 'nn7', story: true, giver: 'sigrun', lvl: 24, pre: 'nn6', name: 'The Winter Heir', where: 'kaldmark', ...N, rep: Hh(400), obj: { named: 'thewinterheir', n: 1, what: 'Defeat Prince Ivar in Kaldmark Keep' },
    say: ["Ulvhar's son, Ivar, holds Kaldmark Keep, at the top of the Rimewild. He's been dead a hundred years and still holding his father's hall. Olle says he was a kind boy.", "Be kind if you can. But the Keep must fall, so that the Crown of Winter can't be lit."],
    done: ["He thanked you? Olle's weeping into his beer. So am I, a little. Kaldmark is almost free, at last."] },
  { id: 'nn8', story: true, giver: 'sigrun', lvl: 25, pre: 'nn7', name: 'The Crown of Winter', where: 'kaldmark', ...N, rep: Hh(600), obj: { named: 'frostking', n: 1, what: 'Defeat Ulvhar, the Frost-King, in the Crown of Winter (12-person raid)' },
    say: ["Above the Keep, on the peak, is the Crown of Winter, where the kings of Kaldmark were crowned. Ulvhar waits there, and the Wintersworn say a voice beneath the world has promised him the whole of it, frozen.", "Raise a raid, southerner. Bring every sword you know. End the long winter."],
    done: ["The snow stopped at noon. It hasn't stopped at noon in a hundred years. Hearthfrost is yours, whenever you want it."] },
  { id: 'nq1', giver: 'olle', lvl: 21, pre: 'nn2', name: 'The Relief That Never Came', where: 'frozenfield', ...N, rep: Hh(300), obj: { named: 'captainhalvard', n: 1, what: 'Relieve Captain Halvard at the Frozen Barracks' },
    say: ["There's a saga about Captain Halvard: he was ordered to hold the barracks until relieved, and the relief never came. He's still there. He's still holding.", "Go and relieve him, would you? Properly. It's a sad saga. I'd like to write a better ending."], done: ["'And the relief came at last, and Halvard laid down his sword.' Yes. That's better."] },
  { id: 'nq2', giver: 'maelis', lvl: 23, pre: 'nn4', name: 'Hrothgar the Hungering', where: 'peaks', ...N, rep: Hh(300), obj: { named: 'hrothgar', n: 1, what: 'Defeat Hrothgar in the Icefang Caverns' },
    say: ["There's a troll in the Icefang Caverns who eats wolves. My wolves. He's eaten six this winter, and he's still hungry. His name is Hrothgar. He tells everyone."], done: ["The pack is howling. I think they're saying thank you. Or possibly 'more food'."] },
  { id: 'nq3', giver: 'hjalm', lvl: 22, pre: 'nn3', name: 'Rime-Iron', where: 'peaks', ...N, rep: Hh(250), obj: { collect: ['icetroll', 'frostelem'], item: 'Lump of Rime-Iron', chance: .45, n: 6, what: 'Gather 6 lumps of rime-iron from ice trolls and frost elementals' },
    say: ["Rime-iron forms inside things that live in the deep cold. Trolls swallow it; elementals are made of it. Six lumps, and I'll make the Watch new axes."], done: ["Feel that. Cold as a grudge. Perfect."] },
  { id: 'ns1', giver: 'olle', lvl: 22, name: 'Old White', where: 'pines', ...N, rep: Hh(300), obj: { named: 'oldwhite', n: 1, what: 'Hunt Old White, the great bear of the pines' },
    say: ["Every skald of Hearthfrost has sung about Old White, the bear of the pines. My grandfather sang about him. He's still alive, which seems unfair to the bear's other enemies."], done: ["Old White! I'll need a new verse. And a bigger rug."] },
  { id: 'ns2', giver: 'sigrun', lvl: 23, name: 'The Still Queen', where: 'frozenfield', ...N, rep: Hh(300), obj: { named: 'thestillqueen', n: 1, what: 'Lay the Still Queen to rest (she walks only at night)' },
    say: ["At night, a woman in a crown of ice walks the Frozen Field and sings to the dead soldiers. They stand up when she passes. We call her the Still Queen. Find her after dark."], done: ["Quiet, tonight. Properly quiet. Thank you."] },
  { id: 'ns3', giver: 'maelis', lvl: 21, name: 'Harpies in the Pines', where: 'pines', ...N, rep: Hh(250), obj: { kill: ['snowharpy'], n: 8, what: 'Bring down 8 snow harpies' },
    say: ["Snow harpies are nesting over the eastern road. They throw icicles at the caravans, then laugh. Eight of them, and no more laughing."], done: ["Silence over the road. Bliss."] },
  { id: 'ny1', daily: true, giver: 'sigrun', lvl: 21, pre: 'nn2', name: 'Daily: Firewood Escort', ...N, rep: Hh(200), obj: { kill: VALE, n: 12, what: 'Defeat 12 beasts of the Rimewild' },
    say: ["The woodcutters go out every day, and every day the beasts come to see what's for lunch. Twelve of them today."], done: ["Wood for another night. Thank you."] },
  { id: 'ny2', daily: true, giver: 'maelis', lvl: 23, pre: 'nn4', name: 'Daily: The Night Watch', ...N, rep: Hh(250), obj: { kill: FIELD, n: 10, what: 'Put down 10 frozen dead' },
    say: ["The Field never sleeps. Ten of them today, before they walk any further north."], done: ["Ten more back in the snow. Good."] },
  { id: 'ny3', daily: true, giver: 'hjalm', lvl: 24, pre: 'nq3', name: 'Daily: The Forge Must Burn', ...N, rep: Hh(250), obj: { collect: ['icetroll', 'frostelem', 'rimebear'], item: 'Frozen Coal', chance: .4, n: 5, what: 'Gather 5 lumps of frozen coal' },
    say: ["The forge eats coal. The Rimewild's coal is inside the things that live here. Five lumps a day, and Wolfwatch has axes."], done: ["Hissing already. Lovely."] },
]));
