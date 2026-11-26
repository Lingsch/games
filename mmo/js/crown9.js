// Build 9: the kingdom of Corrand (levels 20-25). Emberwatch's kingdom, and the reason its reinforcements never
// came. Corrandel is a great walled city with a dying king; its lands are full of rebels, plague and mercenaries;
// and at its court sits the Queen-Regent, who used to be called the Choir-Mother of the Vale.
import { S, X } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { defineZone, defineDungeon } from './kit9.js';
import { mob, boss, rboss, B, U, HU, addRaid, addDungeonLFG, tier, faction, mount, finishQuests, giver } from './hi9.js';
import * as Loot5 from './loot5.js';
import * as Rep from './rep6.js';

Object.assign(MOBS, {
  ashwolf: mob('Ashwood Wolf', 'wolf', { ...B, spd: 6.6, weak: 'fire', resist: 'nature', scale: 1.15 }),
  wildboar: mob('Royal Forest Boar', 'boarbig', { ...B, hpM: 1.2, weak: 'fire' }),
  hillharpy: mob('Hill Harpy', 'harpy', { ...B, hpM: .9, fly: 1.2, range: 16, ranged: true, weak: 'storm' }),
  rebel: mob('Thornfield Rebel', 'bandit', { ...HU, weak: 'storm' }),
  rebelbow: mob('Thornfield Longbow', 'xbow', { ...HU, hpM: .85, range: 22, ranged: true, weak: 'storm' }),
  mercenary: mob('Black Lion Mercenary', 'bandit2', { ...HU, hpM: 1.2, dmgM: 1.15, weak: 'storm' }),
  goldcloak: mob('Gold Cloak', 'guard', { ...HU, hpM: 1.25, weak: 'shadow', resist: 'holy' }),
  plaguedead: mob('Plague Dead', 'ghoul', { ...U, hpM: 1.1, weak: 'fire', resist: 'shadow' }),
  plaguerat: mob('Plague Rat', 'boar', { ...B, hpM: .7, scale: .6, weak: 'fire', resist: 'nature' }),
  palechorister: mob('Pale Choir Chorister', 'cultist0', { ...HU, weak: 'holy', resist: 'shadow' }),
  palecantor: mob('Pale Choir Cantor', 'cultist2', { ...HU, hpM: .9, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow' }),
  // named
  kingsstag: boss('The King\'s White Stag', 'boarbig', { ...B, hpM: 1.6, scale: 1.9, mechs: ['charge', 'knock'] }),
  thebellman: boss('The Bellman', 'ghostnpc', { ...U, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool'] }),
  // Thornfield Hold
  redmoll: boss('Red Moll', 'bandit2', { ...HU, mechs: ['cleave', 'charge'], lines: { start: 'Another Crown dog? We\'ve buried a dozen of you this month. The ground\'s still soft.', half: 'Thornfield! To me!' } }),
  thehangman: boss('The Hangman of Thornfield', 'brute', { ...HU, mechs: ['knock', 'web', 'cleave'], lines: { start: 'I hanged three tax collectors last week. I have plenty of rope.', half: 'Tighter!' } }),
  lordthornfield: boss('Lord Edric Thornfield', 'bladewarden1', { ...HU, hpM: 1.7, scale: 1.4, weak: 'storm', mechs: ['cleave', 'charge', 'call', 'enrage'], adds: 'rebel', lines: { start: 'The Crown sold my lands to the Choir and my people to the plague. I would rather burn Corrand than kneel to it. Stand aside.', half: 'Thornfield stands!' } }),
  // the Plague Quarter
  ratking: boss('The Rat King', 'boarbig', { ...B, scale: 1.4, mechs: ['spawn', 'pool'], adds: 'plaguerat', lines: { start: '*A tangle of rats, tied together by their tails, squeals as one creature.*', half: '*The tangle splits. The rats run everywhere.*' } }),
  doctorgall: boss('Doctor Gall', 'priest', { ...HU, range: 18, ranged: true, caster: true, school: 'nature', mechs: ['heal', 'pool', 'volley'], lines: { start: 'The cure is very close. I just need a few more subjects. Healthy ones. Like you.', half: 'Hold still! This is for science!' } }),
  plaguefather: boss('The Plague-Father', 'abom', { ...U, hpM: 1.7, scale: 1.8, weak: 'fire', mechs: ['slam', 'pool', 'spawn', 'enrage'], adds: 'plaguedead', lines: { start: '*Something enormous and sewn together rises from the plague pits. It wears a bishop\'s hat.*', half: '*It vomits up its congregation.*' } }),
  // Ashford Manor
  majordomo: boss('The Majordomo', 'villager2', { ...HU, mechs: ['knock', 'call'], adds: 'goldcloak', lines: { start: 'His Grace is not receiving visitors. Especially armed ones.', half: 'Guards! The silver!' } }),
  ladyashford: boss('Lady Ashford', 'cultist2', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'heal', 'volley'], lines: { start: 'My husband sold Emberwatch for a seat at court. I sold my soul for a better one. Do you like the view?', half: 'Choir! Sing!' } }),
  thehounds: boss('The Duke\'s Hounds', 'wolf', { ...B, scale: 2, mechs: ['charge', 'hounds'], adds: 'ashwolf', lines: { start: '*Two hounds the size of ponies come bounding down the stairs.*', half: '*The whole kennel answers their howl.*' } }),
  dukeofash: boss('Duke Corvin of Ash', 'bulwark1', { ...HU, hpM: 1.8, scale: 1.5, weak: 'storm', mechs: ['cleave', 'shield', 'call', 'enrage'], adds: 'goldcloak', lines: { start: 'Emberwatch\'s letters? I burned every one. The Regent pays better than the King, and the dead don\'t ask for wages.', half: 'Gold Cloaks! Earn your gold!' } }),
  // the Undercity
  sewerqueen: boss('The Sewer Queen', 'spider', { ...B, scale: 2.2, mechs: ['web', 'spawn'], adds: 'plaguerat', lines: { start: '*Under the city, something has been eating very well.*', half: '*Rats and spiders pour from the drains.*' } }),
  brotherhush: boss('Brother Hush', 'cultist1', { ...HU, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool', 'call'], adds: 'palechorister', lines: { start: 'Shh. The Mother is singing upstairs. Don\'t interrupt.', half: 'Brothers. Quietly now.' } }),
  thetithecollector: boss('The Tithe-Collector', 'abom', { ...U, scale: 1.7, mechs: ['slam', 'pool', 'knock'], lines: { start: '*It carries a ledger made of skin. Your name is in it.*', half: '*It collects.*' } }),
  choirmaster2: boss('Precentor Aldous Vey', 'gravelord', { ...HU, hpM: 1.8, scale: 1.5, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'fear', 'spawn', 'enrage'], adds: 'plaguedead', lines: { start: 'Under every city there is a choir of the dead, waiting for a conductor. The Mother has given them one.', half: 'Sing, Corrandel! SING!' } }),
  // the Gilded Catacombs: raid
  executioner: rboss('The Royal Executioner', 'brute', { hpM: 2.1, ...HU, mechs: ['cleave', 'knock', 'charge'], lines: { start: 'I have beheaded three kings. The Regent says you are more important than any of them. I am flattered on your behalf.', half: 'Kneel!' } }),
  goldenknights: rboss('The Golden Twins', 'bladewarden0', { hpM: 2.2, ...HU, mechs: ['cleave', 'charge', 'shield', 'call'], adds: 'goldcloak', lines: { start: 'We guarded the King for twenty years. Now we guard his tomb. It is very quiet.', half: 'Brother! Together!' } }),
  thedeadking: rboss('King Aldric the Third', 'bulwark0', { hpM: 2.3, ...U, mechs: ['slam', 'call', 'fear', 'pool'], adds: 'plaguedead', lines: { start: 'I... was the king. She told me I would live forever. She did not say I would have to die first.', half: 'Corrand... forgive me...' } }),
  sabine: rboss('Queen-Regent Sabine, the Pale Crown', 'cultist2', { hpM: 2.6, ...HU, scale: 2, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', mechs: ['pool', 'fear', 'heal', 'volley', 'spawn', 'enrage'], adds: 'palechorister', lines: { start: 'I was the Choir-Mother of the Vale once. I sang the dead out of their graves for the Lord of Graves, and when he fell I came here and took a kingdom. The One Beneath will want a kingdom. I intend to give it one.', half: 'Sing, my children! Sing the city dead!' } }),
});
Object.assign(MOB_LORE, { goldcloak: 'A Gold Cloak of the royal guard, paid twice: once by the King, and once, more generously, by the Regent.', rebel: 'A rebel of Thornfield. The Crown took his farm. He took up a spear.',
  plaguedead: 'Dead of the Corrandel plague, which the Regent\'s physicians say is under control.', sabine: 'Sabine, once the Choir-Mother of the Pale Choir, now Queen-Regent of Corrand.' });
giver('marshal', 'Lord-Marshal Ivo Carrow', 'Corrandel · the King\'s Marshal', 'bladewarden2');
giver('pennant', 'Pennant Grey', 'Corrandel · spymaster to nobody', 'knifeshade1');
giver('abbessrue', 'Abbess Rue', 'Corrandel · the Abbey of the Four', 'cleric0');
giver('hobbturnip', 'Hobb Turnip', 'Ashford · reeve of a very small village', 'villager0');
Object.assign(TALK, {
  marshal: { bio: "Ivo Carrow is Marshal of Corrand, which means he commands an army that the Queen-Regent will not let him use. He has written forty letters to Emberwatch promising reinforcements. Every one was stopped at court.",
    greet: ["You came from the wastes? From Emberwatch? Then you know what I owe Idris Vael. Sit down. I'm going to tell you a story about why I couldn't pay it.", "The King is dying, the Regent rules, and I command an army that isn't allowed to march. It's a very expensive way to do nothing."],
    topics: [{ q: 'What is wrong with Corrand?', a: ["Three years ago King Aldric fell ill. His physicians couldn't help him. Then a woman came from the Vale, a holy woman who sang, and she could. The King got a little better. He made her Regent.", "Since then: plague in the eastern quarter, rebels in the south, gold for the Gold Cloaks and nothing for Emberwatch. And at night, at court, she sings. People who hear it don't sleep well."] },
      { q: 'Who is the Queen-Regent?', a: ["Her name is Sabine. In the Vale, Pennant says, they called her something else: the Choir-Mother.", "If you've met the Pale Choir, you know what that means. I've met them now. I wish I hadn't."] }] },
  pennant: { bio: 'Pennant Grey was the King\'s spymaster until the Regent dismissed him. He still runs his spies. He just doesn\'t tell anyone he\'s doing it, including, he says, himself.', greet: ["I'm not here. You're not talking to me. Good, now that's settled: what do you need?", "Everyone in Corrandel is watching everyone else. I'm just better at it."], topics: [] },
  abbessrue: { bio: 'Abbess Rue runs the Abbey of the Four in Corrandel, and treats the plague with soap, soup and a cudgel for anyone who interferes. She knew Mother Hesper as a girl; they still write.', greet: ["Wash your hands. No, properly. Again.", "The plague isn't a curse, child. It's a song. Somebody is singing it, and I would like them to stop."], topics: [] },
  hobbturnip: { bio: 'Hobb Turnip is the reeve of Ashford, a village of thirty people, two cows and a very large manor. He is terrified of the Duke and brave about it anyway.', greet: ["Welcome to Ashford! We have a well. It's a very good well.", "Please don't make the Duke angry. Please also stop the Duke. Ideally both."], topics: [] },
});
Object.assign(LORE, {
  emberletters: { title: 'Forty Letters to Emberwatch', where: 'ashmanor', text: "A drawer in the Duke of Ash's study, stuffed with letters in Marshal Carrow's hand, all addressed to Emberwatch, all unopened. On top, a note in a woman's hand: 'Burn them. Emberwatch must fall for the Lord of Graves to march south. The One Beneath does not care which of us he favours, only that the dead keep coming. — S.'" },
  choirsheet: { title: 'A Sheet of Choir Music', where: 'undercity', text: "The notes are drawn with a skull instead of a head. The title, in Sabine's hand: 'For the Waking of Cities. To be sung beneath the palace until the King dies, and then once more, so that he wakes again.'" },
});
faction('crown', 'The Crown of Corrand', '👑', 'corrandel', [[1, 160, 'Signet of the Marshal', Rep.ring('Signet of the Marshal', 22, 2)], [2, 400, 'Royal Destrier (mount)', 'mount_royal'], [3, 400, "Kingsguard Collar", Rep.ring('Kingsguard Collar', 25, 3, 'neck')], [4, 0, 'Title: Champion of Corrand', 'title_crown']],
  ['rebel', 'rebelbow', 'mercenary', 'plaguedead', 'plaguerat', 'palechorister', 'palecantor', 'ashwolf', 'hillharpy']);
mount('mount_royal', 'Royal Destrier', 'horse_royal', '#f4f0e8', '#c8a050', '#7a1f1c', true);
Loot5.COLLECT.title_crown = { type: 'title', name: 'Champion of Corrand', from: 'rep' };
X.VEND = Object.assign(X.VEND || {}, { corrandel: ['Merchant Ottoline', 'villager1'], ashford: ['Widow Penhallow', 'villager3'] });

// Corrandel's streets: rings of houses inside the walls, with the palace and the abbey in the middle
const city = (() => {
  const out = [];
  for (const [r, n] of [[26, 12], [44, 18], [60, 24]]) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + r * .01; if ([0, Math.PI / 2, Math.PI, Math.PI * 1.5].some(g => Math.abs(((a - g) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI) < .16)) continue;
    out.push([Math.cos(a) * r, Math.sin(a) * r, -a + Math.PI / 2, { wall: ['#d8cdb5', '#cfc2a8', '#c8b898', '#e0d4bc'][i % 4], roof: ['#7a3a2a', '#3a4a6a', '#5a3a3a', '#4a5a3a'][i % 4], floors: r > 40 ? 2 : 1, h: r > 40 ? 5.4 : 3.4, chimney: i % 2 === 0 }]); }
  return out;
})();
defineZone('crown', {
  size: 500, seed: 9606, name: 'The Kingdom of Corrand', bossName: 'Queen-Regent Sabine', land: (x, z, N) => 2 + N.fbm(x * .006, z * .006, 4) * 12 + (N.fbm(x * .03 + 5, z * .03, 2) - .5) * 3, hiH: 11,
  pal: { a: '#7a9a4a', b: '#8aa858', hi: '#7a7a6a', road: '#8a7a5a', cob: '#9a9284', low: '#5a7a3a' },
  towns: [{ key: 'corrandel', name: 'Corrandel', x: 60, z: 0, R: 72, base: 4, wall: 'human', gates: [0, Math.PI / 2, Math.PI, Math.PI * 1.5], guardName: 'Gold Cloak', guardKind: 'bulwark2',
    houses: [...city, [0, 0, 0, { wall: '#e8e0cc', roof: '#3a4a7a', w: 12, d: 9, floors: 3, h: 7.4, sign: '#c8a050' }, 12, 9], [0, -14, Math.PI, 'hall', 9, 5]],
    props: [[6, 12, 'statue'], [-6, 12, 'statue'], [10, -6, 'banner', '#c8a050'], [-10, -6, 'banner', '#c8a050'], [14, 14, 'lantern'], [-14, 14, 'lantern'], [14, -14, 'lantern'], [-14, -14, 'lantern'], [34, 0, 'lantern'], [-34, 0, 'lantern'], [0, 34, 'lantern'], [0, -34, 'lantern']],
    npcs: [['giver', 'marshal', 4, 12], ['giver', 'pennant', -16, 6], ['giver', 'abbessrue', 2, -20], ['vendor', 'corrandel', 16, 6], ['bind', null, 8, 16], ['armory', null, -8, 16]],
    guards: [[70, 3], [70, -3], [-70, 3], [-70, -3], [3, 70], [-3, 70], [3, -70], [-3, -70], [20, 20], [-20, -20], [20, -20], [-20, 20]] },
    { key: 'ashford', name: 'Ashford', x: -300, z: 300, R: 18, wall: 'none', guardName: 'Ashford Watchman', houses: [[-6, 6, .3, { wall: '#d8cdb5', roof: '#7a5a3a' }], [8, -4, -.4, { wall: '#cfc2a8', roof: '#6a4a2a' }]], props: [[0, 0, 'lantern'], [4, 8, 'fence'], [-8, -8, 'fence']],
      npcs: [['giver', 'hobbturnip', 0, 3], ['vendor', 'ashford', -4, -4], ['bind', null, 3, -2]], guards: [] }],
  roads: [[-486, 0, -12, 0], [132, 0, 486, 0], [60, -72, 60, -480], [60, 72, 60, 300], [-300, 300, -300, 0], [60, 120, 300, 120], [60, -200, 300, -300]],
  regions: { names: ["The King's Fields", 'Thornfield', 'Blackwater', 'The Ashwood', "The Duke's Reach"], fn: (x, z) => x < -150 ? (z > 120 ? 4 : 0) : z > 150 ? 1 : x > 180 ? 2 : z < -150 ? 3 : 0 },
  open: [{ key: 'thornhold', name: 'Thornfield Hold', x: 140, z: 360, R: 34, deco: 'tent', decoArg: '#8a3a2a', decoN: 14, ring: true, gap: Math.PI * 1.5, centre: 'banner', lvl: [21, 22], area: 1,
      packs: [[-18, 0, ['rebel', 'rebel', 'rebelbow']], [18, 0, ['rebel', 'rebelbow']], [0, -18, ['mercenary', 'rebel']], [0, 18, ['rebelbow', 'rebelbow', 'rebel']]],
      bosses: [[-22, -18, 'redmoll', 21], [22, -20, 'thehangman', 22], [0, -4, 'lordthornfield', 22, true]] },
    { key: 'plaguequarter', name: 'The Plague Quarter', x: 360, z: 60, R: 34, deco: 'bones', decoN: 30, ring: true, gap: Math.PI, centre: 'greenlamp', lvl: [22, 23], area: 2,
      packs: [[-18, 0, ['plaguedead', 'plaguedead', 'plaguerat']], [18, 0, ['plaguedead', 'palecantor']], [0, -18, ['plaguerat', 'plaguerat', 'plaguedead']], [0, 18, ['plaguedead', 'palechorister', 'palecantor']]],
      bosses: [[-22, -18, 'ratking', 22], [22, -20, 'doctorgall', 23], [0, -4, 'plaguefather', 23, true]] }],
  doors: [{ to: 'ashmanor', name: 'Ashford Manor', x: -360, z: 380, ry: Math.PI, label: 'Enter Ashford Manor (23-24)', col: '#c8a050' },
    { to: 'undercity', name: 'The Undercity', x: 160, z: -60, ry: Math.PI / 2, label: 'Climb down into the Undercity (24-25)', col: '#8aff8a' },
    { to: 'gilded', name: 'The Gilded Catacombs', x: 60, z: -110, ry: 0, label: 'Descend into the Gilded Catacombs (12-person raid)', col: '#ffd34d' }],
  landmarks: [{ g: 'stonecircle', x: 200, z: -330, name: 'The Old Kings\' Barrows', R: 18, clear: 12 }, { g: 'statue', x: -200, z: -150, name: 'The Ashwood Shrine', R: 14, clear: 10 }],
  lines: [{ x: -486, z: 0, to: 'wastes', label: 'West to the Blighted Wastes', ry: -Math.PI / 2 }],
  spots: { kingsfields: { x: -250, z: -60 }, thornfield: { x: 100, z: 280 }, blackwater: { x: 340, z: 120 }, ashwood: { x: 0, z: -300 }, dukesreach: { x: -330, z: 260 }, barrows: { x: 200, z: -330 }, palace: { x: 60, z: 0 } },
  scatter: [[40, [-480, -150, -480, 120], ['wildboar', 'ashwolf', 'hillharpy'], [20, 21], 0], [40, [-150, 480, 150, 480], ['rebel', 'rebelbow', 'wildboar', 'ashwolf'], [21, 22], 1],
    [40, [180, 480, -150, 150], ['plaguedead', 'plaguerat', 'palechorister'], [22, 23], 2], [44, [-150, 480, -480, -150], ['ashwolf', 'hillharpy', 'mercenary', 'palechorister'], [23, 24], 3],
    [36, [-480, -150, 120, 480], ['mercenary', 'goldcloak', 'palecantor', 'ashwolf'], [24, 25], 4]],
  camps: [[6, [-150, 480, 150, 480], ['rebel', 'rebelbow', 'rebel'], [21, 22], 1, 'rb'], [6, [-150, 480, -480, -150], ['mercenary', 'mercenary', 'rebelbow'], [23, 24], 3, 'mc'], [5, [-480, -150, 120, 480], ['goldcloak', 'palechorister', 'palecantor', 'goldcloak'], [24, 25], 4, 'gc']],
  rares: [[[-480, -150, -480, 120], 'kingsstag', 21, false], [[180, 480, -150, 150], 'thebellman', 23, true]],
  hunt: [{ area: 0, lvl: [20, 21] }, { area: 1, lvl: [21, 22] }, { area: 2, lvl: [22, 23] }, { area: 3, lvl: [23, 24] }, { area: 4, lvl: [24, 25] }],
  labels: [{ t: "King's Fields (20-21)", x: -300, z: -100 }, { t: 'Thornfield rebels (21-22)', x: 150, z: 260 }, { t: 'Blackwater plague (22-23)', x: 330, z: -20 }, { t: 'The Ashwood (23-24)', x: 100, z: -330 }, { t: "The Duke's Reach (24-25)", x: -320, z: 200 }],
  nodes: [['crowngold', 'ore', 'oresilver', 90, null, 22], ['kingsfoil', 'herb', 'herbmeadow', 90, null, 24]],
  scenery: { density: 24000, tuft: '#7a9a4a', kinds: [['oak', .03, 1.1, 2.2], ['birch', .015, 1, 1.6], ['hedge', .004, 1, 1.3], ['pine', .01, 1, 1.8]] },
  sky: { fog: '#a8b8a8', top: '#5a8ac8', hor: '#d8e8f0', k: .25 },
});
defineDungeon({ key: 'ashmanor', name: 'Ashford Manor', parent: 'crown', plan: 'cells', floor: '#6a5040', rock: '#2a2018', fog: '#2a2018', light: .55, lvl: [23, 24], prop: 'lantern',
  mobs: ['goldcloak', 'mercenary', 'palechorister', 'palecantor'], bosses: ['majordomo', 'ladyashford', 'thehounds', 'dukeofash'], exitLabel: 'Back out to Ashford' });
defineDungeon({ key: 'undercity', name: 'The Undercity', parent: 'crown', plan: 'winding', floor: '#3a3a30', rock: '#141410', fog: '#14160e', light: .45, lvl: [24, 25], prop: 'greenlamp',
  mobs: ['plaguedead', 'plaguerat', 'palechorister', 'palecantor'], bosses: ['sewerqueen', 'brotherhush', 'thetithecollector', 'choirmaster2'], exitLabel: 'Climb back up into Corrandel' });
defineDungeon({ key: 'gilded', name: 'The Gilded Catacombs', parent: 'crown', plan: 'nave', floor: '#8a7a5a', rock: '#2a2418', fog: '#1a160e', light: .5, lvl: [25, 25], prop: 'banner', propArg: '#c8a050', raid: true,
  mobs: ['goldcloak', 'plaguedead', 'palecantor', 'palechorister', 'mercenary'], bosses: ['executioner', 'goldenknights', 'thedeadking', 'sabine'], exitLabel: 'Back up to the palace' });
addDungeonLFG('ashmanor', 'Ashford Manor', [23, 24]); addDungeonLFG('undercity', 'The Undercity', [24, 25]); addRaid('gilded', 'The Gilded Catacombs');
tier({ thornhold: 7, plaguequarter: 7, ashmanor: 8, undercity: 8, gilded: 9 });

const C = { zone: 'crown' }, Cr = r => ({ crown: r });
const FIELDS = ['wildboar', 'ashwolf', 'hillharpy'], REB = ['rebel', 'rebelbow'], PLAGUE = ['plaguedead', 'plaguerat', 'palechorister', 'palecantor'];
QUESTS.push(...finishQuests([
  { id: 'cc1', story: true, giver: 'vael', turnTo: 'marshal', lvl: 20, needLvl: 20, name: 'The Fiction Drawer', rep: Cr(250), obj: { talk: true, what: 'Take the eastern road out of the wastes to Corrandel, and find Lord-Marshal Carrow' },
    say: ["Eleven years of letters, and not one soldier from Corrand. I used to think the court had forgotten us. Then I started to wonder whether somebody was making sure they forgot.", "The east road out of the wastes goes to Corrandel, our capital. Find Lord-Marshal Ivo Carrow. He's an honest man, or he was. Ask him why Emberwatch has been left to die."],
    done: [['marshal', "From Idris Vael? Then I owe you an explanation, and her an apology. Sit down."], ['marshal', "I wrote to her forty times. Every letter was stopped at court. I didn't know until last month. I know now, and I know who stopped them."]] },
  { id: 'cc2', story: true, giver: 'marshal', lvl: 20, pre: 'cc1', name: 'The King\'s Fields', where: 'kingsfields', ...C, rep: Cr(250), obj: { kill: FIELDS, n: 14, near: 'kingsfields', nearR: 240, what: 'Clear 14 wolves, boars or harpies from the King\'s Fields' },
    say: ["The King's Fields feed this city, and the Regent has pulled the patrols off them. Wolves in the barley, harpies over the roads. Fourteen of them, and the farmers might believe somebody still cares."],
    done: ["The farmers sent a cart of bread to the barracks. With a note: 'From the Fields, for whoever that was.' That was you."] },
  { id: 'cc3', story: true, giver: 'marshal', turnTo: 'pennant', lvl: 21, pre: 'cc2', name: 'A Man Who Isn\'t There', ...C, rep: Cr(250), obj: { talk: true, what: 'Find Pennant Grey, the dismissed spymaster, somewhere in Corrandel' },
    say: ["There's a man in this city named Pennant Grey. He was the King's spymaster until the Regent dismissed him. He's still a spymaster. He just pretends not to be. Find him; he'll know who stopped my letters."],
    done: [['pennant', "You found me. Annoying. Well, since you're here: the letters went to the Duke of Ash, who burned them, because the Regent told him to."], ['pennant', "And the Regent, my friend, was once called the Choir-Mother of the Vale."]] },
  { id: 'cc4', story: true, giver: 'pennant', lvl: 21, pre: 'cc3', name: 'Thornfield Burns', where: 'thornfield', ...C, rep: Cr(300), obj: { kill: REB, n: 12, near: 'thornfield', nearR: 240, what: 'Break up 12 Thornfield rebels' },
    say: ["The rebels in Thornfield say the Crown sold their lands to the Choir. They're right. They're also burning every caravan on the south road, which makes them very hard to like.", "Twelve of them. Don't enjoy it; they're not wrong, just dangerous. When it's done, Lord Thornfield may be willing to talk."],
    done: ["Thornfield's quieter. Lord Edric still won't parley. He says he'll only kneel to someone who can beat him."] },
  { id: 'cc5', story: true, giver: 'abbessrue', lvl: 22, pre: 'cc4', name: 'The Plague Is a Song', where: 'blackwater', ...C, rep: Cr(300), obj: { kill: PLAGUE, n: 12, near: 'blackwater', nearR: 240, what: 'Put down 12 of the plague dead and their choir in Blackwater' },
    say: ["The plague in Blackwater isn't a plague, child. The dead get up at night and walk to the palace, and Choir singers walk beside them. A plague doesn't sing.", "Twelve of them. Then I'll know whether my cudgel or your sword works better."],
    done: ["Your sword, sadly. I'll keep the cudgel for the physicians."] },
  { id: 'cc6', story: true, giver: 'pennant', lvl: 23, pre: 'cc5', name: 'The Duke of Ash', where: 'dukesreach', ...C, rep: Cr(400), obj: { named: 'dukeofash', n: 1, what: 'Defeat Duke Corvin of Ash in Ashford Manor' },
    say: ["The Duke of Ash burned Emberwatch's letters and keeps the Regent's Gold Cloaks in silver. His manor is at Ashford, north-west. His papers will prove everything.", "Bring me his papers. Bring me his signet. Bring me his head if you like; I'm not fussy."],
    done: ["Forty letters, unopened, and a note in Sabine's hand: 'Emberwatch must fall.' The Marshal is shaking. I've never seen him shake."] },
  { id: 'cc7', story: true, giver: 'marshal', lvl: 24, pre: 'cc6', name: 'The Song Under the City', where: 'palace', ...C, rep: Cr(400), obj: { named: 'choirmaster2', n: 1, what: 'Silence Precentor Vey in the Undercity' },
    say: ["Under Corrandel there's another city: the old one, the one they built the new one on. The Choir has a cathedral down there, and a precentor who conducts the singing that wakes the plague dead.", "Stop the song, and the plague stops. Then the Regent has nothing left to hide behind."],
    done: ["The plague dead have lain down in the streets of Blackwater. The Abbess is burying them properly. And the King died this morning. The Regent has closed the catacombs."] },
  { id: 'cc8', story: true, giver: 'marshal', lvl: 25, pre: 'cc7', name: 'The Pale Crown', where: 'palace', ...C, rep: Cr(600), obj: { named: 'sabine', n: 1, what: 'Defeat Queen-Regent Sabine in the Gilded Catacombs (12-person raid)' },
    say: ["The King is dead, and Sabine has taken him down into the Gilded Catacombs, under the palace, with her whole choir. She means to sing him back. She means to sing the whole city back.", "Raise a raid. I'll open the palace gates myself. End her, and Corrand will remember your name for a thousand years."],
    done: ["It's over. Corrand has no king, and no regent, and a Marshal who would very much like to march to Emberwatch. He's already writing to Idris. He's going to deliver this one himself."] },
  { id: 'cq1', giver: 'hobbturnip', lvl: 21, pre: 'cc2', name: 'Lord Thornfield', where: 'thornfield', ...C, rep: Cr(300), obj: { named: 'lordthornfield', n: 1, what: 'Beat Lord Edric Thornfield at Thornfield Hold' },
    say: ["Lord Edric was a good lord to Ashford before the Crown took his lands. He says he'll only kneel to someone who can beat him. Beat him, gently, and maybe he'll come home."], done: ["He knelt? He's sent word: Thornfield will hold the south road for the Marshal. Oh, that's wonderful. My cows will be so relieved."] },
  { id: 'cq2', giver: 'abbessrue', lvl: 23, pre: 'cc5', name: 'The Plague-Father', where: 'blackwater', ...C, rep: Cr(300), obj: { named: 'plaguefather', n: 1, what: 'Destroy the Plague-Father in the Plague Quarter' },
    say: ["At the heart of the Plague Quarter, something has been made from the bishop of Blackwater and his whole congregation. It's still wearing his hat. Destroy it, child. I'll pray. Loudly."], done: ["The bishop's hat. I'll bury it with him. Thank you."] },
  { id: 'cq3', giver: 'pennant', lvl: 24, pre: 'cc6', name: 'Keys to the Undercity', where: 'palace', ...C, rep: Cr(300), obj: { collect: ['goldcloak', 'palecantor'], item: 'Undercity Key', chance: .3, n: 1, what: 'Take a key to the Undercity from a Gold Cloak or cantor' },
    say: ["The Undercity is locked, and the Gold Cloaks have the keys. So does the Choir. I'd like one. I'd like you to get it, because I'm not here."], done: ["Thank you. I'll make copies. Several. You never know."] },
  { id: 'cs1', giver: 'hobbturnip', lvl: 21, name: 'The King\'s White Stag', where: 'kingsfields', ...C, rep: Cr(300), obj: { named: 'kingsstag', n: 1, what: 'Hunt the King\'s White Stag' },
    say: ["The King's White Stag has eaten every turnip in Ashford. Every one. It's royal game, so nobody's allowed to hunt it. The King's dead, though. Isn't he? Please hunt it."], done: ["Turnips! We can have turnips again! I'm going to cry."] },
  { id: 'cs2', giver: 'abbessrue', lvl: 23, name: 'The Bellman', where: 'blackwater', ...C, rep: Cr(300), obj: { named: 'thebellman', n: 1, what: 'Lay the Bellman to rest (he walks only at night)' },
    say: ["At night a ghost with a bell walks Blackwater, calling 'Bring out your dead.' The dead come. Find him after dark, and ring his bell for the last time."], done: ["The bell's in my chapel now. I'll ring it for Matins. It deserves a better job."] },
  { id: 'cs3', giver: 'marshal', lvl: 23, name: 'Black Lion Mercenaries', where: 'ashwood', ...C, rep: Cr(250), obj: { kill: ['mercenary'], n: 8, what: 'Defeat 8 Black Lion mercenaries in the Ashwood' },
    say: ["The Regent hired the Black Lions to hold the Ashwood road. They've been holding it for ransom. Eight of them, and the road's ours again."], done: ["The Ashwood road's open. The Black Lions have sent a very polite letter of resignation."] },
  { id: 'cy1', daily: true, giver: 'marshal', lvl: 21, pre: 'cc2', name: 'Daily: Ride the Fields', ...C, rep: Cr(200), obj: { kill: FIELDS, n: 12, what: 'Defeat 12 beasts in the King\'s Fields' },
    say: ["The patrols are mine again. Ride with them today: twelve beasts, and the harvest comes in."], done: ["Another day's harvest saved."] },
  { id: 'cy2', daily: true, giver: 'abbessrue', lvl: 23, pre: 'cc5', name: 'Daily: Soap and Soup', ...C, rep: Cr(250), obj: { collect: PLAGUE, item: 'Plague Censer', chance: .4, n: 5, what: 'Take 5 plague censers from the Choir and the plague dead' },
    say: ["The Choir carries censers that spread the sickness. Bring me five a day and I'll melt them into soup pots."], done: ["Five more pots. Blackwater has never been so well fed."] },
  { id: 'cy3', daily: true, giver: 'pennant', lvl: 24, pre: 'cc6', name: 'Daily: Gold Cloaks', ...C, rep: Cr(250), obj: { kill: ['goldcloak', 'palecantor', 'palechorister'], n: 10, what: 'Defeat 10 Gold Cloaks or Choir loyalists in the Duke\'s Reach' },
    say: ["The Regent's loyalists still hold the Duke's Reach. Ten a day. I'm not here, of course. Neither are they, soon."], done: ["Fewer of them. More of us. That's how it goes."] },
]));
