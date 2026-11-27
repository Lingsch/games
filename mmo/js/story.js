// Build 4: the Vale's story. "The graves are emptying."
// Quests are done once per hero. Dialogue lines are a string (the giver speaks) or [speakerKey, text].
// obj kinds: kill, collect, named (yield: they surrender), talk (done on accept), at (reach a spot), inspect (props with a tag)
import { QUESTS, GIVERS, MOBS, NAMED_LOOT, xpNeed, CLASSES, CLASS_KEYS } from './data.js';

const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f);
const qg = lvl => Math.round(2 + lvl * 3.5);

// ---------- the people of the story ----------
Object.assign(GIVERS, {
  wick: { name: 'Wick Tallow', title: 'Gravedigger', model: 'wick', idle: ["Dig, fill, dig, fill. It's a living. Well. It's a dying, technically.", "If anyone asks, I was never afraid of the dark. I was afraid of what was in it. Different thing."] },
  pell: { name: 'Mayor Dobbin Pell', title: 'Little Hollin', model: 'villager0', idle: ["Welcome to Little Hollin! Population: forty-two. Forty-nine if you count the ghosts, and I'm legally required not to."] },
  wenlow: { name: 'Granny Wenlow', title: 'Herbalist', model: 'villager3', idle: ["Hmph. Wipe your boots.", "Back already? Did you bring anything, or just your face?"] },
  haskett: { name: 'Haskett the Miller', title: 'Deceased', model: 'ghostnpc', idle: ["Flour! Fresh flour! Well, ghost flour. It's mostly cold air, but it's very cold air."] },
  ansel: { name: 'Brother Ansel', title: 'Former Choir', model: 'cultist0', idle: ["I'm trying to be better. Corwin says trying is the first step. The second step is sweeping."] },
  corwin: { name: 'Corwin Ashlar', title: 'Hermit of the Tower', model: 'hermit', idle: ["Close the door. Were you born in a barn? Don't answer that, I've seen the Vale.", "Hmph."] },
  banker: { name: 'Teller Mott', title: 'Bank (shared by all your classes)', model: 'villager2', idle: [] },
});
GIVERS.warden.idle = ["Keep your blade clean and your nose cleaner."];
GIVERS.tanner.idle = ["Hides, leathers, the occasional opinion. What'll it be?"];
GIVERS.sister.idle = ["The Four keep you, {hero}."];
GIVERS.quell = GIVERS.quell || { name: 'Harbormaster Quell', title: 'Saltmarrow Free Port', model: 'pirate1' };

// ---------- new creatures ----------
Object.assign(MOBS, {
  cultist: { name: 'Pale Choir Initiate', kind: 'cultist0', hpM: .95, dmgM: 1, spd: 5.4, range: 2.2, weak: 'holy', resist: 'shadow', scale: 1, aggro: 12, social: 14, human: true, flee: true },
  chanter: { name: 'Pale Choir Chanter', kind: 'cultist1', hpM: .85, dmgM: .85, spd: 5.2, range: 20, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1, aggro: 13, social: 14, human: true },
  ghost: { name: 'Restless Spirit', kind: 'ghost', hpM: .85, dmgM: .95, spd: 5, range: 2.2, weak: 'holy', resist: 'frost', scale: 1, aggro: 10, social: 10, undead: true, fly: .25 },
  boar: { name: 'Bristleback Boar', kind: 'boar', hpM: 1.1, dmgM: 1.05, spd: 6, range: 2.2, weak: 'fire', resist: null, scale: 1.1, aggro: 8, social: 6, beast: true },
  spider: { name: 'Hollin Webspinner', kind: 'spider', hpM: 1, dmgM: 1, spd: 6.2, range: 2.2, weak: 'fire', resist: 'shadow', scale: 1.1, aggro: 10, social: 8, beast: true },
  harpy: { name: 'Crag Harpy', kind: 'harpy', hpM: .9, dmgM: 1.05, spd: 6.4, range: 2.2, weak: 'storm', resist: 'frost', scale: 1, aggro: 14, social: 12, fly: .6 },
  ansel: { name: 'Brother Ansel', kind: 'cultist0', hpM: 1.4, dmgM: .8, spd: 5.4, range: 2.2, weak: 'holy', resist: null, scale: 1.05, aggro: 10, social: 0, human: true, yields: true },
  grumble: { name: 'Grumblesnout', kind: 'boarbig', hpM: 1.4, dmgM: 1.3, spd: 6, range: 2.8, weak: 'fire', resist: null, scale: 1.6, aggro: 10, social: 0, beast: true },
  choirmaster: { name: 'Choirmaster Venn', kind: 'cultist2', hpM: 1.1, dmgM: 1, spd: 5.2, range: 18, ranged: true, caster: true, healer: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1.1, aggro: 14, social: 20, human: true },
  deacon: { name: 'Deacon Mortlake', kind: 'cultist2', hpM: 1.3, dmgM: 1.15, spd: 5.2, range: 18, ranged: true, caster: true, school: 'shadow', weak: 'holy', resist: 'shadow', scale: 1.2, aggro: 15, social: 24, human: true },
  shrieka: { name: 'Shrieka', kind: 'harpynamed', hpM: 1.2, dmgM: 1.2, spd: 6.6, range: 2.4, weak: 'storm', resist: 'frost', scale: 1.4, aggro: 15, social: 20, fly: .8 },
  gristle: { name: 'Gristlebones', kind: 'skeleton', hpM: 1.6, dmgM: 1.4, spd: 5, range: 3.6, weak: 'earth', resist: 'frost', scale: 2.4, aggro: 14, social: 0, undead: true },
});
const it = (name, slot, type, lvl, stats, extra = {}) => ({ name, slot, type, armorType: ['plate', 'leather', 'cloth'].includes(type) ? type : undefined, lvl, rarity: 2, stats, value: 20 + lvl * 9, ...extra });
Object.assign(NAMED_LOOT, {
  grumble: [it('Grumblesnout Tusk-Knife', 'weapon', 'dagger', 5, { pow: 13, sta: 5, crit: 1 }), it('Bristlehide Jerkin', 'chest', 'leather', 5, { sta: 9, pow: 6, arm: 12 })],
  choirmaster: [it("Venn's Hymnal", 'off', 'tome', 6, { pow: 10, sta: 6 }), it('Choirmaster Vestments', 'chest', 'cloth', 6, { sta: 9, pow: 10, arm: 6 }), it('Bell-Iron Helm', 'head', 'plate', 6, { sta: 10, pow: 4, arm: 18 })],
  deacon: [it("Mortlake's Ossuary Staff", 'weapon', 'staff', 8, { pow: 24, sta: 9, crit: 1 }), it("Deacon's Bone Mail", 'chest', 'plate', 8, { sta: 16, pow: 7, arm: 32 }), it('Pale Choir Sash', 'legs', 'leather', 8, { sta: 12, pow: 9, crit: 2, arm: 15 })],
  shrieka: [it('Shrieka-Feather Hood', 'head', 'cloth', 8, { sta: 8, pow: 9, crit: 2, arm: 6 }), it('Talon-Tipped Bow', 'weapon', 'bow', 8, { pow: 22, sta: 8, crit: 2 })],
  gristle: [it('Gristlebone Cleaver', 'weapon', 'greatsword', 8, { pow: 23, sta: 12 }), it('Ribcage Breastplate', 'chest', 'plate', 8, { sta: 14, pow: 5, arm: 26 }), it('Marrow Orb', 'off', 'orb', 8, { pow: 8, sta: 8, crit: 2 })],
  ansel: [],
});

// ---------- lore pages ----------
export const LORE = {
  law: { title: 'The Fourfold Law', where: 'law', text: 'Set down at the end of the summoner wars by the necromancer, druid and elementalist courts, and the kingdoms who survived them. One: the dead stay dead. Two: no summoner binds more than four. Three: the war ruins are sealed. Four: what was bound in war is unbound in peace. Signed by eight kings. Witnessed by four summoners. Broken, as of last Tuesday, by somebody.' },
  ledger: { title: "Wick Tallow's Ledger", where: 'graveyard', text: 'Monday: dug two. Tuesday: filled two. Wednesday: Mother Abernathy\'s plot was open. Filled it. Thursday: open again. Filled it again. Friday: it was open, and there were footprints coming OUT. Bought a second lantern. Saturday: bought a third lantern.' },
  drag: { title: 'A Scrap of Pale Cloth', where: 'drag', text: 'Snagged on a thornbush where the drag marks bend north. Grey wool, embroidered with four notes of music and a skull where the fifth should be. Someone has stitched, very small, along the hem: "We sing so they may rise."' },
  hymn: { title: 'A Torn Hymn', where: 'choircamp', text: 'Rise, O sleepers, rise and sing, / the Lord of Graves is coming in. / No law of four shall hold the tide, / the dead are many, the dead are wide. (A second hand has added, underneath: "this rhymes worse every time we sing it.")' },
  register: { title: 'Hollin Parish Register', where: 'chapel', text: 'Births: 2. Deaths: 3. Deaths that did not take: 41. Brother Ansel has asked to borrow the chapel bell "for a small ceremony." Mayor Pell has said yes, because Mayor Pell says yes to everything.' },
  flour: { title: "Haskett's Flour Accounts", where: 'mill', text: 'Sold: 12 sacks. Owed: 4 coppers by Pell (again). Note to self: the boar is back. Note to self: deal with the boar. Note to self: AAAA THE BOAR. (The rest of the page is flour.)' },
  journal: { title: "Corwin's Field Journal", where: 'tower', text: 'Ninth siege, spring. The master raised the Abomination tonight. He stitched it from the men who held the north wall, and he called it beautiful, and he asked me to hold the lantern. I held it. I will hold it in my sleep for the rest of my life. Tomorrow I go to the Four. Tomorrow I am no one\'s apprentice.' },
  letter: { title: "The Gravelord's Letter", where: null, text: 'My dear Deacon. The Vale is a pantry, not a feast: take what you need for the Stitched One and send the rest east. The Saltreach holds three fleets of war dead and the sea keeps them so very fresh. Do not trouble yourself with old Corwin. I have kept his room. P.S. Do tell the Choir to practise. I have heard them from a hundred miles away, and it was not the good kind of haunting.' },
  dedication: { title: 'Ossuary Dedication Stone', where: 'ruin', text: 'THIS HOUSE OF BONE IS RAISED TO THE GLORY OF THE GRAVE AND ITS LORD, WHO DOES NOT DIE. The last three words have been chiselled out, and someone has carved underneath, much more recently: "WRONG."' },
  soldier: { title: "A Soldier's Last Letter", where: 'waste', text: 'Mags — they say the necromancers are beaten. They say we go home in a week. If I don\'t, don\'t let them bury me in the Waste, the ground here doesn\'t keep what you put in it. Kiss the baby. Tell her about the sea. — Tom' },
  warchant: { title: 'Orc War-Chant, Translated', where: 'orcs', text: 'TUSK IS STRONG. TUSK IS OLD. TUSK REMEMBERS WHEN THE BONE MAN CAME AND THE TREES DIED. TUSK DOES NOT GO NORTH. (Margin note by Bram the Tanner: "Smart troll.")' },
  bounty: { title: 'Brigand Bounty Notice', where: 'bandits', text: 'WANTED by the Watch of {town}: the brigand who calls himself {captain}. For robbery, arson, and selling forged pardons. NOTE: if you are the man on this poster, the pardons do not work. We checked.' },
};

// ---------- story scenes (in-engine, letterboxed) ----------
// each shot: where the camera stands (from) and looks (look), relative to a spot, and a line
export const SCENES = {
  intro: [
    { spot: 'town', from: [40, 34, 60], look: [0, 4, 0], who: null, text: 'A hundred years ago, the summoners went to war. Necromancer, druid and elementalist bound hordes beyond counting, and eight kingdoms burned.' },
    { spot: 'town', from: [-50, 22, -30], look: [0, 6, -40], who: null, text: 'The Fourfold Law ended it. The dead stay dead. No summoner binds more than four. The war ruins stay sealed.' },
    { spot: 'graveyard', from: [9, 6, 11], look: [0, 1, 0], who: null, text: 'In {town}, a hundred years later, the graves have started to empty.' },
    { spot: 'graveyard', from: [5, 3, 6], look: [0, 1.4, 0], who: 'wick', text: "Hello? Is someone there? Please be alive. Please be alive. Please be alive..." },
  ],
  drag: [
    { spot: 'drag', from: [-6, 5, 8], look: [0, 1, -12], who: null, text: 'The drag marks run on through the grass, north and north again.' },
    { spot: 'ruin', from: [0, 30, 120], look: [0, 6, 0], who: null, text: 'Toward the Ossuary, where the old necromancers kept their dead.' },
  ],
  hollin: [
    { spot: 'hollin', from: [28, 18, 30], look: [0, 2, 0], who: null, text: 'Little Hollin. Forty-two souls, and rather more than that who have stopped counting.' },
    { spot: 'hollin', from: [6, 3, 8], look: [0, 1.6, 0], who: 'pell', text: "Visitors! Living ones! Oh, this is a red-letter day. Mind the ghost, he's harmless. That one isn't. Don't make eye contact with that one." },
  ],
  apprentice: [
    { spot: 'tower', from: [7, 3, 9], look: [0, 1.6, 2], who: 'corwin', text: "I was seventeen. He was the most brilliant man I had ever met. I held his lantern while he stitched the dead." },
    { spot: 'tower', from: [-4, 9, 14], look: [0, 8, 0], who: 'corwin', text: "I was his apprentice, {hero}. The Gravelord's. And I was the one who told the Four how to kill him." },
    { spot: 'tower', from: [5, 2.5, 6], look: [0, 1.6, 1], who: 'corwin', text: "Clearly I told them wrong." },
  ],
  gravelord: [
    { spot: 'crypt', from: [0, 5, 14], look: [0, 2, 0], who: null, text: 'As the Stitched Thing falls, the crypt goes cold. Something green and patient gathers above the altar.' },
    { spot: 'crypt', from: [0, 2.6, 6], look: [0, 2.2, 0], who: 'gravelord', text: "Oh, well done. Truly. Grathul took me eleven years to stitch, and you've unpicked him in an afternoon." },
    { spot: 'crypt', from: [3, 2.4, 5], look: [0, 2.2, 0], who: 'gravelord', text: 'Keep the bones, little Vale. Keep your Law. I have an ocean of dead waiting for me, and they are so very patient.' },
    { spot: 'crypt', from: [-3, 3, 7], look: [0, 2, 0], who: 'gravelord', text: 'Do give Corwin my regards. Tell him I kept his room.' },
  ],
};
GIVERS.gravelord = { name: 'The Gravelord', title: '', model: 'gravelord' };

// ---------- cross-class perks: each class at level 10 unlocks one; any class can slot two ----------
export const PERKS = {
  bulwark: { name: 'Stone Skin', icon: '🪨', desc: '+8% armor.', data: { armorP: .08 } },
  wardancer: { name: 'Light Feet', icon: '🪶', desc: '+3% dodge.', data: { dodge: .03 } },
  bladewarden: { name: 'Riposte Drills', icon: '⚔️', desc: '+3% parry.', data: { parry: .03 } },
  monk: { name: 'Inner Calm', icon: '☯️', desc: '+25% health regeneration out of combat.', data: { regenP: .25 } },
  cleric: { name: 'Blessed Hands', icon: '🙏', desc: '+6% healing done.', data: { healP: .06 } },
  aegis: { name: 'Warded', icon: '🔰', desc: '+5% maximum health.', data: { hpP: .05 } },
  lifebinder: { name: 'Evergreen', icon: '🌿', desc: '+8% healing received.', data: { healIn: .08 } },
  druid: { name: 'Wild Stride', icon: '🐾', desc: '+6% run speed.', data: { spdP: .06 } },
  longwatch: { name: 'Keen Eye', icon: '🎯', desc: '+2% critical strike.', data: { crit: .02 } },
  knifeshade: { name: 'Cheap Shots', icon: '🗡️', desc: '+4% power.', data: { powP: .04 } },
  blightblade: { name: 'Thick Blood', icon: '🩸', desc: '+3% maximum health and +1% critical strike.', data: { hpP: .03, crit: .01 } },
  bard: { name: 'Travelling Tunes', icon: '🎶', desc: '+4% run speed and +4% resource regeneration.', data: { spdP: .04, resP: .04 } },
  elementalist: { name: 'Arcane Focus', icon: '🔥', desc: '+4% power.', data: { powP: .04 } },
  warlock: { name: 'Dark Pact', icon: '💀', desc: '+5% maximum health.', data: { hpP: .05 } },
  binder: { name: 'Kindred Spirits', icon: '🌀', desc: '+8% resource regeneration.', data: { resP: .08 } },
  illusionist: { name: 'Misdirection', icon: '🎭', desc: '−12% threat generated.', data: { threatP: -.12 } },
};

// ---------- the quests ----------
const V = [
  // ===== MAIN STORY: The graves are emptying (levels 1-10) =====
  { id: 'm1', story: true, giver: 'wick', lvl: 1, name: 'An Empty Grave', obj: { inspect: 'grave', n: 3, what: 'Examine the open graves' },
    say: ["Oh! Oh, thank the Four, a real adventurer. I'm Wick. Wick Tallow. I dig the graves for {town}. Well. I fill them, mostly.", "Somebody's been un-filling them. Three, last night. Old Mother Abernathy, the Cobb twins, and... I'd rather not say who. He was my uncle.", "Would you take a look? I've been staring at them so long I've started saying good morning to the holes."],
    done: ["Dug out from below? Not from above? That's... that's worse, isn't it. I knew it was worse. I could feel it being worse."] },
  { id: 'm2', story: true, giver: 'wick', lvl: 1, pre: 'm1', name: 'Drag Marks', obj: { at: 'drag', r: 9, what: 'Follow the drag marks north-west of town' }, sceneAt: 'drag',
    say: ["There are marks in the grass going out past the north fields. Something heavy, dragged. Or something that drags its feet. I have a list of both and I don't like either.", "Follow them for me? I'd come, but somebody has to guard the holes."],
    done: ["Toward the Ossuary. Of course toward the Ossuary. Nothing nice has ever come from the Ossuary. I once found a sandwich up there and even that was haunted."] },
  { id: 'm3', story: true, giver: 'wick', turnTo: 'warden', lvl: 2, pre: 'm2', name: 'Somebody Should Tell Somebody', obj: { talk: true, what: 'Tell Warden Ilse what you found' },
    say: ["We should tell the Watch. You should tell the Watch. Warden Ilse likes adventurers. She doesn't like me. I buried her cat. Wrong cat, as it turned out."],
    done: ["Graves dug out from below. Tracks to the Ossuary. And Wick Tallow is the witness.", "...", "Fine. I believe you. I don't believe him, but I believe you. Bodies don't walk on their own. Somebody is moving them."],
    choices: [{ t: 'Wick did good work. Give him some credit.', set: { wick: 'praised' }, reply: "...Noted. Maybe I'll stop calling him 'the shovel'." }, { t: "Just tell me what's next.", set: { wick: 'plain' }, reply: 'I like you already.' }] },
  { id: 'm4', story: true, giver: 'warden', lvl: 3, pre: 'm3', name: "Under the Watch's Nose", obj: { collect: ['bandit', 'bandit2', 'xbow'], item: 'Grave-Muddied Shovel', chance: .35, n: 1 },
    say: ["The brigands on the Kingsroad will steal anything that isn't nailed down. Lately they've started stealing the nails.", "If someone is paying diggers, it's them. Bring me proof."],
    done: ["Grave mud on a brigand's shovel. Mud from Mother Abernathy's plot, I'd bet my badge on it. So someone hired diggers."] },
  { id: 'm5', story: true, giver: 'warden', turnTo: 'sister', lvl: 3, pre: 'm4', name: 'Paid in Bone Coin', obj: { collect: ['bandit', 'bandit2', 'xbow'], item: 'Bone Coin', chance: .5, n: 5 },
    say: ["Every hired hand gets paid. Find out what they were paid with, then take it to Sister Maren. She knows money, and she knows sin, and there's a lot of overlap."],
    done: ["Bone coin. The Pale Choir minted these in the wars to pay their gravediggers. I hoped I would never hold one.", "The Choir were the Gravelord's faithful. They sang while he raised the dead. We thought them gone for a hundred years."] },
  { id: 'm6', story: true, giver: 'sister', lvl: 4, pre: 'm5', name: 'The Pale Choir', obj: { kill: ['cultist', 'chanter'], n: 6, what: 'Break up the Pale Choir camp west of the Kingsroad' }, lore: 'hymn',
    say: ["If the Choir is singing again, they will have a meeting place. Scouts report pale robes in the west, past the brigand camp, toward Little Hollin.", "Break it up. And {hero}: they will call it a holy war. Don't let them make it one."],
    done: ["Their hymns mention Little Hollin. The dead there won't stay down, they say. Mayor Pell has written to me for weeks and I thought he was exaggerating. He exaggerates everything. Except, apparently, this."] },
  { id: 'm7', story: true, giver: 'sister', turnTo: 'pell', lvl: 4, pre: 'm6', name: 'Little Hollin', obj: { at: 'hollin', r: 18, what: 'Travel west to Little Hollin and find Mayor Pell' }, sceneAt: 'hollin',
    say: ["Go to Little Hollin and speak to Mayor Pell. Bring a sturdy stomach. Hollin's cooking is famous, for all the wrong reasons."],
    done: ["A visitor! An actual living visitor! Do excuse the ghosts, they came with the place. Well, no, they didn't, that's rather the problem.", "Mayor Dobbin Pell, at your service. And at the service of anyone with a sword, frankly."] },
  { id: 'm8', story: true, giver: 'pell', turnTo: 'ansel', lvl: 5, pre: 'm7', name: 'Brother Ansel', obj: { named: 'ansel', yield: true, n: 1, what: 'Defeat Brother Ansel in the chapel yard (he will yield)' },
    say: ["There's a robed fellow at our chapel. Calls himself Brother Ansel. He rings the bell at midnight and the graves get chatty.", "I asked him politely to leave. He hissed at me. I've been hissed at before, I was married for thirty years, but this was different."],
    done: [['ansel', "Enough! Enough, I yield! Please. I only rang the bell. They told me it would bring my brother back. It didn't. It brought back everybody else's brother."], ['ansel', "The Deacon gives the orders. Deacon Mortlake. He camps out in the Grey Waste and sends the bodies north, to the Ossuary. For the Gravelord."]],
    choices: [{ t: 'Hand him over to the Watch.', set: { ansel: 'watch' }, reply: ['ansel', "...That's fair. That's probably fair."] }, { t: 'Let him go. Make amends.', set: { ansel: 'free' }, reply: ['ansel', "I... thank you. I'll make this right. I swear it on... well. Not on the Choir."] }] },
  { id: 'm9', story: true, giver: 'pell', turnTo: 'sister', lvl: 5, pre: 'm8', name: 'A Name From the Wars', obj: { talk: true, what: 'Take the name back to Sister Maren in {town}' },
    say: ["The Gravelord? Like in the songs? The one who built the Ossuary? Oh dear. Oh, dear, dear, dear. Tell your Sister, quick as you can. I'll... I'll bolt the doors. Not that ghosts mind doors."],
    done: ["The Gravelord died at the end of the wars. Every history says so.", "...Every history written by people who never found his body.", "There is one man alive who fought him. Old Corwin, the hermit. He lives in a tower at the edge of the Grey Waste and he hates visitors. Go anyway."] },
  { id: 'm10', story: true, giver: 'sister', turnTo: 'corwin', lvl: 6, pre: 'm9', name: 'The Man in the Tower', obj: { at: 'tower', r: 14, what: "Find Corwin's tower at the western edge of the Grey Waste" },
    say: ["Corwin Ashlar served in the last war against the necromancers. He was young then. He is very old now. Be polite. Be patient. Duck if he throws things."],
    done: ['Go away.', '...', "You're still here. Maren sent you, didn't she. She sends me jam at the solstice and visitors when she wants something. I prefer the jam.", "Fine. What do you want? Make it quick, I'm a hundred and twenty and my time is precious."] },
  { id: 'm11', story: true, giver: 'corwin', lvl: 7, pre: 'm10', name: 'Old Bones, Old Debts', obj: { kill: ['cultist', 'chanter'], n: 8, near: 'tower', what: 'Drive the Pale Choir away from the tower' },
    say: ["The Choir has been creeping round my tower for a month. They think I've forgotten what those robes mean. I haven't.", "Clear them off. Then we'll talk about the Gravelord. Not before."],
    done: ['Good. Well done. Now sit. No, not there. That chair bites.'] },
  { id: 'm12', story: true, giver: 'corwin', lvl: 8, pre: 'm11', name: 'The Deacon of the Waste', obj: { named: 'deacon', n: 1, what: 'Kill Deacon Mortlake at his camp in the Grey Waste' }, lore: 'letter',
    say: ["If the Choir has a Deacon, he'll be carrying the Gravelord's letters. The old man always did love a letter. Long ones. With postscripts.", 'Bring me what he carries. His camp is out in the Waste, east of the north road.'],
    done: ['Let me see that.', '...', "That's his hand. A hundred years and he still dots his i's with little skulls.", "He's alive, {hero}. Or as close to it as his sort ever get."] },
  { id: 'm13', story: true, giver: 'corwin', lvl: 8, pre: 'm12', name: 'The Apprentice', obj: { talk: true, what: 'Hear what Corwin has to say' }, sceneOnAccept: 'apprentice',
    say: ["There's something you should know, and I'd rather you heard it from me than from a ghost.", "I knew his rituals better than anyone alive. Still do. That's why I live out here, where no one can ask me about them."],
    done: ['So. Now you know. What will you do with it?'],
    choices: [{ t: 'You turned against him. That is what matters.', set: { corwin: 'trust' }, reply: 'Hmph. Maren raised you well, whoever you are.' }, { t: 'Sister Maren needs to hear this.', set: { corwin: 'report' }, reply: "Go on, then. Tell her. She'll scowl. She has a very good scowl." }] },
  // q8 and q9 (the Ossuary) continue the main story below
  { id: 'm16', story: true, giver: 'sister', turnTo: 'quell', lvl: 10, pre: 'q9', name: 'East to the Sea', obj: { talk: true, what: 'Follow the Kingsroad east to Saltmarrow and find Harbormaster Quell' },
    say: ["'An ocean of dead,' he said. There is only one ocean near enough to matter: the Saltreach.", "Go east, {hero}. Take Wick, if he'll go. He has been packing since the moment that thing fell.", ['wick', "I've packed a shovel. Three shovels. You never know."]],
    done: [["quell", "Another one from the Vale with a story about walking dead? Get in line, friend. Get in line."], ['quell', "...Wait. You killed the Stitched Thing? Huh. Then maybe you'd better come inside."]] },

  // ===== LITTLE HOLLIN (levels 4-6) =====
  { id: 'h1', giver: 'pell', lvl: 4, pre: 'm7', name: 'Restless Neighbours', obj: { kill: ['ghost'], n: 6 },
    say: ["The ghosts are mostly harmless. Mostly. Old Mrs. Gubbins keeps trying to rearrange my furniture.", "The ones out in the fields are the angry sort. Thin them out, would you? Gently. They're still constituents."],
    done: ["Wonderful! The fields are almost quiet. I can hear myself think. It's mostly worrying, but still."] },
  { id: 'h2', giver: 'wenlow', lvl: 4, pre: 'm7', name: 'Charm Bags', obj: { collect: ['spider'], item: 'Spider Silk', chance: .55, n: 6 },
    say: ["You. Yes, you, with the face. Make yourself useful. I sew charm bags that keep the restless out of the windows.", "I need spider silk. The big hairy ones south of the village. Don't come back with your hair full of eggs, I won't pick them out."],
    done: ["Good silk. Strong. Not a single egg. I'm almost impressed. Almost."] },
  { id: 'h3', giver: 'pell', turnTo: 'haskett', lvl: 4, pre: 'h1', name: "The Miller Won't Stop Milling", obj: { talk: true, what: 'Speak to the ghost at the mill' },
    say: ["Haskett the miller died last spring and nobody has had the heart to tell him. He's up at the mill every night, grinding nothing.", 'See if you can talk sense into him. Bring earplugs. He talks a great deal.'],
    done: [['haskett', "Customer! At last! Flour's a copper a sack. Two for the dead. Ha! Little miller joke. I'm dead, you see. I've known for months. I just like the work."]] },
  { id: 'h4', giver: 'haskett', lvl: 5, pre: 'h3', name: 'Grumblesnout', obj: { named: 'grumble', n: 1 },
    say: ["There's a boar out there. Big as a cart, mean as a tax collector. He ate my prize turnips the day I died. Possibly he's why I died. The details are fuzzy.", "Bring me his tusk and I'll rest easier. Figuratively. For now."],
    done: ["That's the tusk! Oh, that's the very one. Look at it. Look at that horrible tusk."] },
  { id: 'h5', giver: 'haskett', lvl: 5, pre: 'h4', name: 'One Last Sack', obj: { talk: true, what: "Decide Haskett's fate" },
    say: ["I suppose I can't mill forever. Sister Maren's rite could send me on. Or... I could stay. Keep the old stones turning. Keep Hollin fed."],
    done: ["What do you think, friend? You've a good face for deciding things."],
    choices: [{ t: "It's time to rest, Haskett.", set: { haskett: 'rest' }, gear: true, reply: "...Aye. Aye, you're right. Tell Pell the mill's his now. Tell him to oil the north stone." }, { t: 'Hollin needs its miller. Stay.', set: { haskett: 'stay' }, gold: 30, reply: "Ha! Then the bread's on me. Forever. Literally forever." }] },
  { id: 'h6', giver: 'wenlow', lvl: 5, pre: 'h2', name: 'Ring the Warding Bells', obj: { inspect: 'bell', n: 3, what: 'Ring the three warding bells around Hollin' },
    say: ["Three bells stand round Hollin. They were rung every dusk for two hundred years, until the ringer died. Then nobody rang them, because nobody likes climbing.", 'Ring them. Expect company.'],
    done: ["Hear that? That's the sound of the dead deciding to be somewhere else."] },
  { id: 'h7', giver: 'pell', lvl: 5, pre: 'm8', name: 'The Chapel Cellar', obj: { kill: ['cultist', 'chanter'], n: 6, near: 'hollin' },
    say: ["Ansel's friends are still around the chapel. Singing. Badly.", "Clear them out, please. I'd like my chapel back for weddings. And funerals. Mostly funerals, lately."],
    done: ['Silence! Beautiful, holy silence. Well. Apart from Mrs. Gubbins.'] },
  { id: 'h8', giver: 'wenlow', lvl: 5, pre: 'h6', name: 'Choir Hymnals', obj: { collect: ['cultist', 'chanter'], item: 'Pale Hymnal', chance: .5, n: 4 }, lore: 'drag',
    say: ['The Choir sings from little grey books. I want them. To burn, mostly. But I read everything before I burn it. There is always something in the margins.'],
    done: ['Hm. "We sing so they may rise." Sing? I\'ve heard them. It\'s not singing, it\'s a cat in a well.'] },
  { id: 'h9', giver: 'pell', lvl: 6, pre: 'h7', name: 'The Choirmaster', obj: { named: 'choirmaster', n: 1 }, gear: true,
    say: ["One more. The Choirmaster, Venn. He's at the old shrine east of the village, leading the singing. Stop the song for good."],
    done: ["Quiet. Real, proper quiet. Hollin owes you, {hero}. We'll name something after you. A pie, possibly."] },

  // ===== BRANCHES =====
  { id: 'b1', giver: 'ansel', lvl: 6, pre: 'm10', req: { ansel: 'free' }, name: "Ansel's Penance", obj: { kill: ['cultist', 'chanter'], n: 8 },
    say: ["You came! Corwin lets me sweep the tower. He says it builds character. I think it mostly builds dust.", "I know where the Choir hides. I'll mark the camps on your map, if you'll help me break them. I owe it. I owe a lot."],
    done: ["Thank you. Every one of them was somebody's brother too. I'll remember that."] },
  { id: 'b2', giver: 'warden', lvl: 6, pre: 'm8', req: { ansel: 'watch' }, name: 'The Watch Is Grateful', obj: { kill: ['bandit', 'bandit2', 'xbow'], n: 8 }, gear: true,
    say: ["Your Brother Ansel sang like a lark once we gave him a bowl of soup. Named every brigand on the Kingsroad who took the Choir's coin.", "Go and collect on that, would you?"],
    done: ['The Watch thanks you. Officially. In writing. Very rare.'] },
  { id: 'b3', giver: 'corwin', lvl: 8, pre: 'm13', req: { corwin: 'trust' }, name: "The Apprentice's Ward", obj: { inspect: 'wardstone', n: 3, what: 'Wake the three ward stones around the tower' }, gear: true,
    say: ["Since you're so trusting: three ward stones circle this tower. I built them the year I left him. They've gone dark.", 'Touch each one. They know my work. Apparently they also know yours now. Don\'t tell anyone.'],
    done: ["There. That'll keep the Choir out. And, with luck, the post."] },
  { id: 'b4', giver: 'sister', lvl: 8, pre: 'm13', req: { corwin: 'report' }, name: 'Heresy, Sort Of', obj: { inspect: 'journal', n: 1, what: "Find Corwin's old field journal at his tower" }, gear: true,
    say: ['His apprentice. Of course he was. Who else would know the rituals so well?', "Find his old journal. If he kept one, it will be at the tower. I need to know what he did. And what he didn't."],
    done: ["...He held the lantern. And then he left. At seventeen, alone, in a war.", "Well. I'll scowl at him a little less."] },

  // ===== THE TOWER (levels 7-8) =====
  { id: 't1', giver: 'corwin', lvl: 7, pre: 'm10', name: 'Harpies on the Crag', obj: { kill: ['harpy'], n: 8 },
    say: ["Harpies nest on the crag behind my tower. They steal my socks. Only the left ones. I have forty right socks.", 'Persuade them to leave. Permanently.'],
    done: ['Peace. Quiet. Socks. A good day.'] },
  { id: 't2', giver: 'corwin', lvl: 8, pre: 't1', name: 'Shrieka', obj: { named: 'shrieka', n: 1 },
    say: ["Their matriarch, Shrieka, has my telescope. Don't ask me how. Get it back."],
    done: ["My telescope! Look, she's polished it. Horrible creature. Good polish."] },
  { id: 't3', giver: 'corwin', lvl: 8, pre: 'm11', name: 'Gristlebones', obj: { named: 'gristle', n: 1 }, gear: true,
    say: ["Out in the Waste there's a giant built out of other giants. The Gravelord's old doorman. Gristlebones, the soldiers called it.", "If it's walking again, the old wards are failing. Put it down."],
    done: ["Down again. Good. It never did like stairs."] },

  // ===== SIDE QUESTS around the Vale =====
  { id: 'g1', giver: 'wick', lvl: 2, pre: 'm1', name: "Wick's Lost Shovel", obj: { collect: ['wasp'], item: "Wick's Favourite Shovel", chance: .3, n: 1 },
    say: ['Have you seen my good shovel? The wasps took it. I know how that sounds. They are very organized wasps.'],
    done: ["My shovel! Oh, look at her. She's covered in honey. She's never looked better."] },
  { id: 'g2', giver: 'wick', lvl: 2, pre: 'm2', name: 'Proper Headstones', obj: { inspect: 'headstone', n: 4, what: 'Set the fallen headstones upright' },
    say: ["The headstones got knocked over when the graves... let out. Could you set them right? I'd do it myself, but I hurt my back carrying all these feelings."],
    done: ["Thank you. They look so much more dead now. In a good way."] },
  { id: 'g3', giver: 'tanner', lvl: 3, name: 'Boar Bacon', obj: { collect: ['boar'], item: 'Boar Haunch', chance: .6, n: 6 },
    say: ["Boars roam the west road, fat as barrels. Bring me haunches. I'll cure them, and we'll all be happier, especially me."],
    done: ['Now that is a haunch. That is a haunch with a future.'] },
  { id: 'g4', giver: 'warden', lvl: 4, name: 'Bear Necessities', obj: { kill: ['bear'], n: 6 },
    say: ["Bears on the Kingsroad have taken to sitting in the middle of it. Merchants won't pass. Move them along. Firmly."],
    done: ['Road is clear. The merchants send their thanks, and an invoice for the delay.'] },
  { id: 'g5', giver: 'tanner', lvl: 4, name: 'Silk for the Spring', obj: { collect: ['spider'], item: 'Strong Silk', chance: .5, n: 8 },
    say: ["Granny Wenlow's not the only one who wants spider silk. I line my best gloves with it. Bring me a good bundle."],
    done: ["Fine silk. I'll make you a pair someday. Don't hold your breath. Actually, do. It's good for you."] },
  { id: 'g6', giver: 'sister', lvl: 6, name: 'Lantern Oil', obj: { collect: ['ghost'], item: 'Ectoplasm', chance: .5, n: 6 },
    say: ['Our temple lanterns burn ghost-light better than oil. Don\'t ask me how I know. Bring me ectoplasm. It washes out. Mostly.'],
    done: ['Lovely. Glowing and cold and slightly humming. Just how I like it.'] },
  { id: 'g7', giver: 'warden', lvl: 6, pre: 'm6', name: 'The Bounty Board', obj: { kill: ['cultist', 'chanter'], n: 10 },
    say: ['The Watch has posted a bounty on Pale Choir robes. Ten of them, and the Watch pays. I wrote the poster myself.'],
    done: ['Ten robes. The laundry will be thrilled.'] },
  { id: 'g8', giver: 'tanner', lvl: 7, name: 'Harpy Plumes', obj: { collect: ['harpy'], item: 'Harpy Plume', chance: .5, n: 8 },
    say: ["Harpy plumes fetch a fortune in the capital. Something about hats. I don't understand hats, but I understand fortunes."],
    done: ['Gorgeous. Ridiculous, but gorgeous.'] },
  { id: 'g9', giver: 'sister', lvl: 8, name: 'Ghosts of the Waste', obj: { kill: ['ghost'], n: 10, near: 'waste' },
    say: ['The Grey Waste was a battlefield. Its dead are the angriest. Give them peace, by sword or by prayer. Mostly sword.'],
    done: ['The Four keep them. And you.'] },
];

// how much xp: main story carries one class 1-10 with the kills along the way; side chains carry the others
for (const q of V) { q.xp = qx(q.lvl, q.story ? (q.obj.named ? .75 : .52) : q.obj.named ? .65 : .45); q.gold = qg(q.lvl); q.text = q.text || (typeof q.say[0] === 'string' ? q.say[0] : q.say[0][1]); }
// the original Vale quests: rebalanced, and the Ossuary joins the main story
for (const q of QUESTS) {
  if (!/^q\d$/.test(q.id)) continue;
  q.xp = qx(q.lvl, q.obj.named ? .65 : .45);
  if (q.id === 'q8') Object.assign(q, { story: true, giver: 'sister', pre: 'm13', xp: qx(8, .55), say: ["Whatever the Choir has been gathering, it's in the Ossuary. Corwin is certain, and so am I.", "Clear its court and its hall. Take a full group. The Fourfold Law forbids what was done there, and it's being done again."], done: ['The court and the hall are clear? Then only the crypt remains. And whatever is waiting in it.'] });
  if (q.id === 'q9') Object.assign(q, { story: true, giver: 'sister', pre: 'q8', xp: qx(9, .8), say: ["Something stitched from the war dead waits in the Ossuary's crypt. Grathul, the soldiers called it. Corwin says the Gravelord made it.", 'Kill it. Bring six. Bring a healer you trust.'], done: ["You saw him. In the crypt. His face, after a hundred years.", "Then the Law has already failed, and we only just noticed."] });
  if (q.id === 'q6') q.pre = 'm6';
}
QUESTS.push(...V);
// ---------- the armory trials: reach level 10 in a class, prove it, and take up a weapon from a family you're missing ----------
GIVERS.armorer = { name: 'Master Corvin', title: 'Armory · class trials', model: 'guard' };
for (const k of CLASS_KEYS) {
  // Build 13.2: the runner's summons, so nobody hits level 10 without knowing where to go
  QUESTS.push({ id: 'sum_' + k, giver: 'armorer', cls: k, lvl: 10, needLvl: 99, name: 'A Summons from the Armory', xp: 0, gold: 0, obj: { talk: true, what: 'Report to Master Corvin at the armory in {town}' },
    say: ["Master Corvin's compliments, and would you come to the armory? He says you're ready for another weapon."],
    done: ["There you are! The runner found you, then. Good lad, Pim. He only got lost twice.", "Right. You've gone as far as one weapon can take you on its own. Let's see about a second."] });
  QUESTS.push({ id: 'w_' + k, giver: 'armorer', cls: k, lvl: 10, needLvl: 10, unlock: true, name: `The ${CLASSES[k].name}'s Trial`, xp: qx(10, .45), gold: 25,
    obj: { anyMin: 9, n: 10, what: 'Defeat 10 enemies of level 9 or higher' },
    say: ["Ten levels as a {cls}, and you're still standing. Most people give up at four, usually because something ate them.",
      "Here's how the armory works. Show me you've mastered one weapon, and I'll put a new one in your hands. Not just any weapon, either: one from a family you haven't touched yet.",
      'Go and defeat ten enemies of level nine or higher. Then come back, and we will see what fits your hand.'],
    done: ["Ten of them! The guards have been telling stories about you all week, and only some of them are exaggerated.",
      "Come on, then, the rack's this way. Choose carefully. Your friends will want to rethink their own kit to fit around whatever you pick."] });
}
