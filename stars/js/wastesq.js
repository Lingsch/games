// Build 7: the people of the Blighted Wastes, the Ember Garrison's standing, and the wastes' quests (levels 15-20):
// the main story to the Hollow Throne, a chain for each of the six dungeons, side quests and bounties, and dailies.
import { S, chat, X } from './core.js';
import { world } from './world.js';
import { QUESTS, GIVERS, xpNeed } from './data.js';
import { TALK } from './dialogue.js';
import { LORE } from './story.js';
import * as Rep from './rep6.js';
import * as Loot5 from './loot5.js';

// ---------- people ----------
Object.assign(GIVERS, {
  vael: { name: 'Marshal-Commander Idris Vael', title: 'Emberwatch · the Ember Garrison', model: 'guard' },
  pike: { name: 'Sergeant Tobias Pike', title: 'The wall and the barrows', model: 'guard' },
  wrenash: { name: 'Wren Ashby', title: 'Scout', model: 'villager3' },
  hesper: { name: 'Mother Hesper', title: "Saint Orrin's Refuge", model: 'priest' },
  cadwy: { name: 'Brother Cadwy', title: 'Once a smith of the Legion', model: 'villager2' },
});
Object.assign(TALK, {
  vael: { bio: "Idris Vael has held Emberwatch for eleven years with four hundred soldiers, then three hundred, then two. The kingdom of Corrand keeps promising reinforcements. She keeps the letters in a drawer marked 'Fiction'.",
    greet: ["Emberwatch stands because it has to. Behind us is the Vale, and every farm and child in it. In front of us is a dead kingdom that wants them.", "Report, or rest. Either way, keep your sword where you can reach it."],
    topics: [{ q: 'What happened to Vharos?', a: ["Vharos was the richest of the eight kingdoms. In the last year of the summoner wars, the Gravelord broke its walls and raised its army against it. The living fled. The dead stayed.", "For a hundred years the wastes just sat there, grey and quiet. This year they started moving south."] },
      { q: 'Where is the Gravelord?', a: ["At the top of the map, in the Hollow Throne: the citadel of the kings of Vharos. There's a rift in its heart that goes somewhere else. Somewhere between.", "He's in there. And everything we've fought, every drowned sailor and every empty grave, has been walking toward that rift."] }] },
  pike: { bio: 'Tobias Pike joined the garrison at sixteen, lied about his age, and has been lying about it ever since in the other direction. He knows every stone of the wall by name.', greet: ["The wall's held for eleven years. I intend to make it twelve.", "Mind the barrows to the west. The dead in there were kings, and they haven't forgotten."], topics: [] },
  wrenash: { bio: "Wren Ashby scouts the wastes alone, which the Marshal says is reckless and Wren says is the only way to stay quiet. She has mapped more of Vharos than anyone alive.", greet: ["I've been to the Throne and back twice. The second time, something followed me home. I didn't let it in.", "Quiet. Listen. Hear that? Neither do I. That's what worries me."], topics: [] },
  hesper: { bio: "Mother Hesper keeps Saint Orrin's lamp, which has burned without oil since the day Vharos fell. She says it burns on faith. Brother Cadwy says it burns on stubbornness, and that they're the same thing.", greet: ["The lamp has not gone out in a hundred years, child. It will not go out while I am alive, and possibly not after.", "The dead come to the walls every night and ask to be let in. We pray for them. We do not open the gate."], topics: [] },
  cadwy: { bio: "Cadwy forged swords for the Black Legion for twenty years, until he learned what the swords were for. He walked out of the foundry one night with nothing but his hammer, and he has been trying to make up for it ever since.", greet: ["I made the blades the Legion carries. Every one I break is a prayer answered.", "Forgemaster Kael still runs my old foundry. He was my teacher. He'll be my last debt."], topics: [] },
});
Object.assign(LORE, {
  aldouscrown: { title: "King Aldous's Crown", where: 'barrows', text: "Inside the band of the dead king's crown, scratched with a knife: 'Sworn to the Hand, who serves the Lord of Graves, who serves the One Beneath. Vharos will rise when the last lamp falls.' The scratches are fresh." },
  kaelledger: { title: "Forgemaster Kael's Order Book", where: 'foundry', text: "For the Lord of Graves: four thousand blades, two thousand helms, six hundred bone golems. Delivery to the Hollow Throne. Payment: ten years each for the forgemaster and his smiths. Note: the Lord says the One Beneath requires an army, not a garrison. Double the order." },
  rootsong: { title: "Grandmother Root's Song", where: 'witchroot', text: "Words carved into the heartwood of the great tree, in the old tongue of Vharos: 'Drink deep, children. Drink the dead. When the Lord of Graves opens the way, the One Beneath will want for nothing, and we will be its garden.'" },
  veshsermon: { title: 'The Archdeacon\'s Hymnal', where: 'cathedral', text: "The last page of the hymnal is not a hymn. It is a list of eight kingdoms, with seven crossed out in black ink. At the bottom: 'And when all eight have fallen, the One Beneath will rise to claim the dead it was promised, and the Lord of Graves will be its herald.'" },
  gaolkeys: { title: 'The Gaoler-King\'s Keys', where: 'gaol', text: "A ring of iron keys, each tagged with a name: King Aldous. Prince Merel. Queen Misrule. Brother Linus of the Choir. Commodore Vey. The last tag is blank, but the key on it is new, and it fits no lock in the Gaol." },
  handletter: { title: "A Letter Found on the Hand", where: 'ossuary', text: "'My Lord. The Vale's graves are empty, the coast's lamps are failing, and the wastes march south. The way Between is open. When you take the throne beyond, remember who was promised what. It remembers. It always remembers.' Unsigned." },
});
// the Ember Garrison: Emberwatch's standing, and its quartermaster
Rep.FACTIONS.ember = { name: 'The Ember Garrison', icon: '🔥', qm: 'vendor:ember' };
Rep.REWARDS.ember = [[1, 120, "Garrison Signet", Rep.ring('Garrison Signet', 17, 2)], [2, 300, 'Ember Destrier (mount)', 'mount_ember'], [3, 300, "Marshal's Gorget", Rep.ring("Marshal's Gorget", 20, 3, 'neck')], [4, 0, 'Title: of Emberwatch', 'title_ember']];
Object.assign(Loot5.COLLECT, { mount_ember: { type: 'mount', name: 'Ember Destrier', kind: 'horse_war', spd: .8, ride: 1, from: 'rep' }, title_ember: { type: 'title', name: 'of Emberwatch', from: 'rep' } });
for (const k of ['bonewarden', 'blightghoul', 'plaguehulk', 'ashwraith', 'vharosghost', 'legionknight', 'legionbow', 'deathsworn', 'deathcaller', 'boneguard', 'cinder', 'witchroot', 'blightspawn']) Rep.KILL_REP[k] = ['ember', 5];

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f);
const DEAD = ['bonewarden', 'blightghoul', 'vharosghost', 'plaguehulk'], LEGION = ['legionknight', 'legionbow', 'deathsworn', 'deathcaller'], FORGE = ['boneguard', 'cinder', 'legionknight', 'legionbow', 'deathsworn', 'deathcaller'];
const ROOT = ['witchroot', 'rotweaver', 'carrionwasp', 'deathsworn', 'deathcaller'], CATH = ['bonewarden', 'deathsworn', 'deathcaller', 'ashwraith', 'plaguehulk'], GAOL = ['legionknight', 'legionbow', 'deathcaller', 'vharosghost', 'ashwraith', 'plaguehulk'], OSS = ['legionknight', 'legionbow', 'deathsworn', 'deathcaller', 'boneguard', 'ashwraith', 'plaguehulk'];
const E = r => ({ ember: r });
QUESTS.push(
  // ----- the road to the Hollow Throne -----
  { id: 'w1', story: true, giver: 'sister', turnTo: 'vael', lvl: 15, pre: 'k12', name: 'The Road North', xp: qx(15, .3), gold: 20, rep: E(250), obj: { talk: true, what: 'Take the north road out of the Vale into the Blighted Wastes, and find Marshal-Commander Vael at Emberwatch' },
    say: ["The coast is safe, {hero}, and that is your doing. But every road the dead have walked this year has led north, into the wastes of dead Vharos, where the Gravelord holds his throne.", "There's a garrison at the edge of the wastes, Emberwatch, holding the road. Its commander, Idris Vael, has been asking for help for eleven years. Go and be the help she asked for."],
    done: [['vael', "The Vale sent someone? In person? I'll have to take a letter out of the Fiction drawer."], ['vael', "Welcome to Emberwatch. Get some food and some sleep, in that order. Tomorrow, you start learning how to stay alive out there."]] },
  { id: 'w2', story: true, giver: 'vael', lvl: 15, pre: 'w1', name: 'Holding the March', where: 'march', xp: qx(15, .45), gold: 22, rep: E(250), obj: { kill: ['bonewarden', 'blightwolf', 'carrionwasp'], n: 14, near: 'march', nearR: 170, what: 'Defeat 14 bonewardens, blightwolves or carrion wasps on the Emberwatch March' },
    say: ["The March is the stretch between our walls and the ridges. It used to be farmland. Now it's where the dead and the blight's beasts come to test us every night.", "Fourteen of them. That's how many it takes before they back off long enough for the night watch to eat dinner."],
    done: ["The watch had hot food for once. You'd think I'd given them a medal."] },
  { id: 'w3', story: true, giver: 'vael', turnTo: 'wrenash', lvl: 15, pre: 'w2', name: 'Eyes on the Ashfields', where: 'ashfields', zone: 'wastes', xp: qx(15, .4), gold: 20, rep: E(250), obj: { at: 'ashfields', r: 45, what: 'Scout the Ashfields to the south-west and report to Wren Ashby' },
    say: ["Something is stirring in the old barrows on the Ashfields. The dead there were kings and their guards, buried with honors before the war. They shouldn't be awake.", "Go and look. Wren Ashby, our scout, is out there somewhere. Find her, and tell her I said to come home for supper. She won't, but tell her."],
    done: [['wrenash', "The Marshal wants me home for supper? Tell her I'll be home when the barrows are quiet. Which is to say, not for a while."], ['wrenash', "The old king's awake. Aldous. I saw him walking the mounds, counting his guard. Pike knows the barrows better than anyone. Talk to him."]] },
  { id: 'w4', story: true, giver: 'hesper', lvl: 16, pre: 'db3', name: 'Light for the Lost', where: 'ashfields', xp: qx(16, .45), gold: 24, rep: E(300), obj: { kill: ['vharosghost', 'blightghoul'], n: 12, near: 'ashfields', nearR: 200, what: 'Lay 12 Vharosi shades or blightghouls to rest on the Ashfields' },
    say: ["The crown you took from King Aldous names a Hand, a Lord of Graves, and something called the One Beneath. I don't know the last one, and that frightens me more than the other two.", "While I pray over it, the dead of the Ashfields need laying to rest. Twelve, child. Each one you put down is one less voice at my gate tonight."],
    done: ["The gate was quiet last night. Truly quiet, for the first time in years. Thank you."] },
  { id: 'w5', story: true, giver: 'hesper', turnTo: 'wrenash', lvl: 17, pre: 'df3', name: 'Where the Legion Marches', xp: qx(17, .3), gold: 24, rep: E(300), obj: { talk: true, what: 'Take Forgemaster Kael\'s order book to Wren Ashby, who is scouting the Witchroot in the east' },
    say: ["Four thousand blades. Six hundred golems. 'The One Beneath requires an army, not a garrison.' This is not a war against Emberwatch, child. It's a war against everyone.", "Wren needs to see this. She's somewhere in the Witchroot to the east, counting the Legion's camps. Go carefully. The trees out there have opinions."],
    done: [['wrenash', "An army for something called the One Beneath. Wonderful. And the Witchroot is feeding it. The whole wood is drinking the dead, and the old tree at its heart is the one doing the drinking."]] },
  { id: 'w6', story: true, giver: 'vael', lvl: 19, pre: 'dg73', name: 'The Last March', where: 'legion', xp: qx(19, .5), gold: 36, rep: E(400), obj: { kill: LEGION, n: 16, near: 'legion', nearR: 200, what: 'Break 16 of the Black Legion on the road to the Hollow Throne' },
    say: ["The Legion has camped the whole road north to the Throne. Knights, crossbows, Deathsworn: the living who sold their swords for a promise of never dying.", "Break sixteen of them. When the camps are broken, the road is open. And when the road is open, we go knock on the Gravelord's door."],
    done: ["The road's open. The Legion pulled back behind the Throne's walls. Now there's only the Ossuary between us and him."] },
  { id: 'w7', story: true, giver: 'vael', lvl: 20, pre: 'do3', name: 'The Hollow Throne', where: 'throne', zone: 'wastes', xp: qx(19, .6), gold: 50, rep: E(500), obj: { at: 'throne', r: 14, what: 'Walk into the Hollow Throne and look into the rift' },
    say: ["The Hand is dead. Its letter speaks of the way Between, and of something that remembers what it was promised. The Gravelord has gone through the rift in the Hollow Throne, and he is waiting on the other side.", "Go and look at it, {hero}. Don't step through. Not alone. When you go through, you'll need every sword you can find: twelve, at least. But look. Know what we're walking into."],
    done: ["You saw it. Green, and cold, and breathing. That's Between Worlds.", "Gather your raid, {hero}. Twelve of the best. When you're ready, the Ember Garrison will hold the rift open behind you."] },

  // ----- the Ashfield Barrows (open, 15-16), Sergeant Pike -----
  { id: 'db1', giver: 'pike', lvl: 15, pre: 'w3', name: 'Disturbing the Dead', where: 'barrows', xp: qx(15, .45), gold: 22, rep: E(300), obj: { kill: DEAD, n: 12, near: 'barrows', nearR: 44, dungeon: true, what: 'Defeat 12 of the risen dead in the Ashfield Barrows' },
    say: ["The barrows were the tombs of the kings of Vharos and their guard. Now the guard is out of its tombs and walking the mounds in formation.", "Twelve of them. Let the old soldiers rest. They earned it a long time ago."],
    done: ["Twelve. They fight well for men who've been dead a hundred years. Better than some of mine."] },
  { id: 'db2', giver: 'pike', lvl: 16, pre: 'db1', name: 'The Court of the Mounds', where: 'barrows', xp: qx(16, .55), gold: 26, gear: true, rep: E(350), obj: { bosses: ['barrowking', 'gravemoth', 'mournwife'], n: 3, what: 'Defeat the Barrow-King, Gravemoth and the Mourning Wife' },
    say: ["Three things guard the old king. A lesser king, buried with his own guard. A moth the size of a cart that lays its eggs in the mounds. And a widow who never stopped mourning.", "Put all three down. Then we go for Aldous himself."],
    done: ["The widow's gone quiet. I almost miss her singing. Almost."] },
  { id: 'db3', giver: 'pike', lvl: 16, pre: 'db2', name: 'The King Under the Mound', where: 'barrows', xp: qx(16, .75), gold: 40, gear: true, rep: E(500), lore: 'aldouscrown', obj: { named: 'oldkingaldous', n: 1, what: 'Defeat Old King Aldous of Vharos at the heart of the Barrows' },
    say: ["Old King Aldous ruled Vharos when it fell. He's still ruling it, as far as he's concerned. His barrow's in the middle of the mounds.", "Bring me his crown. The Mother at the Refuge will want to see whatever's written in it. Kings always have something written in their crowns."],
    done: ["There's writing inside the band. Fresh. 'Sworn to the Hand, who serves the Lord of Graves, who serves the One Beneath.'", "Take it to Mother Hesper at the Refuge, in the west. She reads the old tongue better than any of us."] },
  // ----- the Weeping Foundry (open, 16-17), Brother Cadwy -----
  { id: 'df1', giver: 'cadwy', lvl: 16, pre: 'w4', name: 'Cold Forges', where: 'foundry', xp: qx(16, .45), gold: 24, rep: E(300), obj: { kill: FORGE, n: 12, near: 'foundry', nearR: 44, dungeon: true, what: 'Defeat 12 golems, cinders or Legion smiths at the Weeping Foundry' },
    say: ["The Weeping Foundry is where I made the Legion's swords for twenty years. It weeps because the furnaces leak, and because of what they're used for.", "Twelve of its guards and smiths. Every one is a sword that won't be made tomorrow."],
    done: ["Twelve. I can hear the furnaces from here, and they sound a little quieter. Thank you."] },
  { id: 'df2', giver: 'cadwy', lvl: 17, pre: 'df1', name: 'My Old Workmates', where: 'foundry', xp: qx(17, .55), gold: 28, gear: true, rep: E(350), obj: { bosses: ['slagmaw', 'bellowsjack', 'mistressanvil'], n: 3, what: 'Defeat Slagmaw, Bellows-Jack and Mistress Anvil' },
    say: ["Slagmaw is a slag heap Kael taught to walk. Bellows-Jack works the bellows and never, ever stops. And Mistress Anvil forged beside me for twenty years, and she was better at it than I was.", "Give them rest. Mistress Anvil especially. She used to sing while she worked."],
    done: ["Mistress Anvil said something at the end. My name, I think. I hope she meant it kindly."] },
  { id: 'df3', giver: 'cadwy', lvl: 17, pre: 'df2', name: 'The Forgemaster', where: 'foundry', xp: qx(17, .75), gold: 44, gear: true, rep: E(500), lore: 'kaelledger', obj: { named: 'forgemasterkael', n: 1, what: 'Defeat Forgemaster Kael at the heart of the Weeping Foundry' },
    say: ["Forgemaster Kael taught me everything I know. He also taught me what a forge is for, which is to make whatever you're paid to make, and never ask why.", "He keeps an order book. He always has. Bring it to me. And tell him, if he lets you, that Cadwy says goodbye."],
    done: ["Four thousand blades, for something called the One Beneath. The Lord of Graves is buying an army for someone else.", "Mother Hesper must see this. And then, I think, I'll go and pray for a while."] },
  // ----- Witchroot Hollow (open, 17-18), Wren Ashby -----
  { id: 'dr1', giver: 'wrenash', lvl: 17, pre: 'w5', name: 'Pruning', where: 'witchroot', xp: qx(17, .45), gold: 26, rep: E(300), obj: { kill: ROOT, n: 12, near: 'witchroot', nearR: 48, dungeon: true, what: 'Defeat 12 of the walking trees, spiders and Deathsworn in Witchroot Hollow' },
    say: ["The Hollow is the heart of the Witchroot: a ring of dead trees around one that's very much alive. The spiders web it, the Deathsworn pray to it, and the trees themselves get up and walk.", "Twelve of them, and I can get close enough to see what the old tree's doing."],
    done: ["I got close. It's drinking. The roots go down into the barrows and the old graves, and it's drinking the dead."] },
  { id: 'dr2', giver: 'wrenash', lvl: 18, pre: 'dr1', name: 'Grandmother\'s Children', where: 'witchroot', xp: qx(18, .55), gold: 30, gear: true, rep: E(350), obj: { bosses: ['mothergrub', 'hollowmen', 'sistersnare'], n: 3, what: 'Defeat Mother Grub, the Hollow Man and Sister Snare' },
    say: ["Three things guard the old tree. A spider queen in the canopy, a tree with a face carved in it that smiles, and a witch called Sister Snare who talks to the roots.", "The smiling one's the worst. I don't know why. I just know."],
    done: ["The smile's gone. Thank you. I'll sleep tonight. Probably."] },
  { id: 'dr3', giver: 'wrenash', lvl: 18, pre: 'dr2', name: 'Grandmother Root', where: 'witchroot', xp: qx(18, .75), gold: 46, gear: true, rep: E(500), lore: 'rootsong', obj: { named: 'grandmotherroot', n: 1, what: 'Fell Grandmother Root at the heart of Witchroot Hollow' },
    say: ["Grandmother Root was a tree when Vharos was a village. She's been drinking the dead of the wastes since the war, and she's gotten very large and very thirsty.", "Bring her down. There's carving in her heartwood: I saw it from the canopy. I want to know what it says."],
    done: ["'We will be its garden.' Whatever the One Beneath is, the whole wastes are being grown for it like a field.", "I'm going to need a very long walk after this."] },
  // ----- the Bone Cathedral (instanced, 17-18), Mother Hesper -----
  { id: 'dc71', giver: 'hesper', lvl: 17, pre: 'w4', name: 'The Unholy See', xp: qx(17, .45), gold: 28, rep: E(300), obj: { kill: CATH, n: 15, dungeon: true, what: 'Defeat 15 of the dead or the Deathsworn inside the Bone Cathedral' },
    say: ["There was a cathedral to the Four in Vharos, the greatest in the eight kingdoms. Archdeacon Vesh rebuilt it in bone and turned its congregation into the Deathsworn.", "Its doors are in the western barrens. Go in with friends, child. Fifteen of them will tell us how deep the rot goes."],
    done: ["Fifteen. Their hymns have stopped. I didn't know how much they were in my head until they stopped."] },
  { id: 'dc72', giver: 'hesper', lvl: 18, pre: 'dc71', name: 'The Choir and the Clergy', xp: qx(18, .55), gold: 32, gear: true, rep: E(350), obj: { bosses: ['deaconbleak', 'choirmaster', 'theflayed', 'bishopmarrow'], n: 4, what: 'Defeat Deacon Bleak, the Choirmaster, the Flayed Saint and Bishop Marrow' },
    say: ["The Archdeacon's clergy: a deacon who serves the sacrament, a choirmaster made of a thousand voices, a saint they skinned for the cathedral doors, and Bishop Marrow, who once preached at my own ordination.", "All four, child. Bishop Marrow last, and quickly. He knows every prayer I know, and he uses them backward."],
    done: ["Marrow is gone. I'll say a prayer for the man he was, and none at all for the man he became."] },
  { id: 'dc73', giver: 'hesper', lvl: 18, pre: 'dc72', name: 'The Archdeacon', xp: qx(18, .75), gold: 48, gear: true, rep: E(500), lore: 'veshsermon', obj: { named: 'archdeaconvesh', n: 1, what: 'Defeat Archdeacon Vesh at the altar of the Bone Cathedral' },
    say: ["Archdeacon Vesh built his altar from the bones of a kingdom. He preaches that the Four are dead, and that the Gravelord is the only god left.", "Prove him wrong, {hero}. And bring me his hymnal. I want to know what he's been singing."],
    done: ["Eight kingdoms, seven crossed out. And the One Beneath, rising to claim the dead it was promised. The Gravelord is only its herald.", "I think I need to sit down. Bring me a chair, child. Bring me two."] },
  // ----- the Gaol of Kings (instanced, 18-19), Sergeant Pike -----
  { id: 'dg71', giver: 'pike', lvl: 18, pre: 'dc73', name: 'Breaking Into Prison', xp: qx(18, .45), gold: 30, rep: E(300), obj: { kill: GAOL, n: 15, dungeon: true, what: 'Defeat 15 of the guards and prisoners inside the Gaol of Kings' },
    say: ["The Gaol of Kings held every royal prisoner Vharos ever took. Now the Gravelord keeps his own prisoners there, and the guards are the Black Legion.", "Its door is in the north-western barrens. Fifteen of them, and we'll find out who he's keeping."],
    done: ["Fifteen. And the cells are full of names I recognize. Kings, princes, a queen. All dead, all locked up, all waiting."] },
  { id: 'dg72', giver: 'pike', lvl: 19, pre: 'dg71', name: 'Royal Prisoners', xp: qx(19, .55), gold: 34, gear: true, rep: E(350), obj: { bosses: ['turnkey', 'hangedprince', 'warlordbrask', 'queenmisrule'], n: 4, what: 'Defeat the Turnkey, the Hanged Prince, Warlord Brask and Queen Misrule' },
    say: ["The Turnkey holds the gate. The Hanged Prince walks the west cells, and a troll called Brask runs the east. Queen Misrule rules the lot of them from the bottom of the stair.", "Four of them. Kings make terrible prisoners and worse wardens."],
    done: ["Misrule's gone. She was the last of the old royal line. Vharos is properly out of royalty now."] },
  { id: 'dg73', giver: 'pike', lvl: 19, pre: 'dg72', name: 'The Gaoler-King', xp: qx(19, .75), gold: 50, gear: true, rep: E(500), lore: 'gaolkeys', obj: { named: 'gaolerking', n: 1, what: 'Defeat the Gaoler-King in the depths of the Gaol' },
    say: ["The Gaoler-King holds every key in Vharos, and he's got a key for every prisoner the Gravelord ever took. Every one.", "Bring me his keys. If the Gravelord's keeping a cell for someone, I want to know who."],
    done: ["King Aldous. Brother Linus. Commodore Vey. Every name you've crossed out, there's a key for. And one key with no name on it, and no lock.", "Show the Marshal. It's time we broke the Legion's road."] },
  // ----- the Black Ossuary (instanced, 19-20), the Marshal -----
  { id: 'do1', giver: 'vael', lvl: 19, pre: 'w6', name: 'The Ossuary Door', xp: qx(19, .45), gold: 34, rep: E(300), obj: { kill: OSS, n: 15, dungeon: true, what: 'Defeat 15 of the Legion and the dead inside the Black Ossuary' },
    say: ["The Black Ossuary is the Gravelord's antechamber: the bone-vaults under the Throne, where he keeps the Legion's officers and the things he builds. His Hand rules it while he's away.", "Its door is in the north-east. Fifteen of them, and we'll be standing in his front hall."],
    done: ["Fifteen. My scouts say the Legion's officers are running out of soldiers to send at us. Good."] },
  { id: 'do2', giver: 'vael', lvl: 20, pre: 'do1', name: 'The Officers of the Ossuary', xp: qx(19, .55), gold: 38, gear: true, rep: E(350), obj: { bosses: ['marrowsmith', 'thetithe', 'lordvanthe', 'thehollowtwins'], n: 4, what: 'Defeat the Marrowsmith, the Tithe, Lord Vanthe and the Hollow Twins' },
    say: ["Four of his officers guard the way to the Hand. The Marrowsmith builds his golems. The Tithe collects his souls. Lord Vanthe leads the Legion. And the Twins, well, nobody who's met the Twins has described them twice the same way.", "All four. Then the Hand."],
    done: ["Vanthe's dead. The Legion has no commander. For the first time in eleven years, Emberwatch is winning."] },
  { id: 'do3', giver: 'vael', lvl: 20, pre: 'do2', name: "The Gravelord's Hand", xp: qx(19, .75), gold: 60, gear: true, rep: E(600), lore: 'handletter', obj: { named: 'gravelordshand', n: 1, what: "Defeat the Gravelord's Hand at the bottom of the Black Ossuary" },
    say: ["The Hand sees through the Gravelord's eyes, and the Gravelord sees through his. When the Hand dies, the Gravelord will know exactly who did it.", "Good. Let him know. Bring back anything the Hand carries."],
    done: ["'The way Between is open. Remember who was promised what. It remembers.' Whatever's waiting in that rift, the Gravelord isn't the only thing in there."] },

  // ----- side quests and bounties -----
  { id: 'ws1', giver: 'pike', lvl: 15, pre: 'w1', name: 'Wolves at the Wall', where: 'march', xp: qx(15, .4), gold: 18, rep: E(200), obj: { kill: ['blightwolf'], n: 10, what: 'Kill 10 Blightwolves' },
    say: ["The blightwolves have learned our watch rotation. Every night at the change of shift, they hit the south wall. Clever animals.", "Ten of them, and they'll have to learn something new."],
    done: ["Ten. The change of shift was boring last night. Boring is lovely."] },
  { id: 'ws2', giver: 'wrenash', lvl: 15, pre: 'w3', name: 'Wasp Season', xp: qx(15, .4), gold: 18, rep: E(200), obj: { kill: ['carrionwasp'], n: 10, what: 'Kill 10 Carrion Wasps' },
    say: ["The carrion wasps lay their eggs in corpses, and the wastes have a lot of corpses. This year they've started laying them in sleeping soldiers.", "Ten of them, please. And if you see a nest, don't poke it. Burn it."],
    done: ["Ten. I've stopped checking my bedroll every night. Well. I check it less."] },
  { id: 'ws3', giver: 'cadwy', lvl: 16, pre: 'w4', name: 'Legion Iron', xp: qx(16, .45), gold: 22, rep: E(250), obj: { collect: ['legionknight'], item: 'Bar of Legion Iron', chance: .5, n: 6, what: 'Take 6 Bars of Legion Iron from the Black Legion Knights in the Weeping Hills' },
    say: ["The Legion's knights carry bars of iron from the foundry to the Throne, and I'd like them back. I can make good steel out of bad iron, given time and a hammer.", "Six bars. Emberwatch's smiths are making do with horseshoes."],
    done: ["Six bars! The garrison smith actually smiled. I didn't know he could."] },
  { id: 'ws4', giver: 'cadwy', lvl: 18, pre: 'dr1', name: 'Witchroot Sap', xp: qx(18, .45), gold: 26, rep: E(250), obj: { collect: ['witchroot'], item: 'Flask of Witchroot Sap', chance: .5, n: 6, what: 'Gather 6 Flasks of Witchroot Sap from the walking trees' },
    say: ["The sap of the walking trees burns like oil and doesn't go out. I want to fill the Refuge's lamps with it, so they'll burn on something other than Mother Hesper's stubbornness.", "Six flasks. Mind the branches. They grab."],
    done: ["Six flasks. Mother Hesper says the lamp didn't need it. Then she filled it anyway."] },
  { id: 'wb1', giver: 'vael', lvl: 16, pre: 'w2', name: 'Bounty: Greytooth', xp: qx(16, .6), gold: 44, gear: true, rep: E(400), obj: { named: 'greytooth', n: 1, what: 'Hunt down Greytooth, who leads the blightwolves of the March' },
    say: ["Every blightwolf on the March answers to one old grey one. Greytooth. My soldiers have shot him seven times. He keeps the arrows as souvenirs.", "Bring him down, and the packs will scatter."],
    done: ["Greytooth. Seven of my arrows, still in his hide. I'll have them back, thank you."] },
  { id: 'wb2', giver: 'hesper', lvl: 17, pre: 'w4', name: 'Bounty: The Lanternless', xp: qx(17, .6), gold: 48, gear: true, rep: E(400), obj: { named: 'lanternless', n: 1, what: 'Find the Lanternless on the Ashfields at night, and give it rest' },
    say: ["There is a spirit that walks the Ashfields after dark, looking for a light it lost. It puts out every lamp it finds. Last week it put out three of our pilgrims.", "Find it at night, child. Give it rest. It has been looking for a very long time."],
    done: ["The pilgrims' lamps burned all night. Thank you. I hope it found what it was looking for."] },
  { id: 'wb3', giver: 'pike', lvl: 18, pre: 'dr1', name: 'Bounty: Ironmaw', xp: qx(18, .6), gold: 52, gear: true, rep: E(400), obj: { named: 'ironmaw', n: 1, what: 'Hunt down Ironmaw, the great ash troll of the Weeping Hills' },
    say: ["Ironmaw is a troll with iron teeth. Somebody at the foundry made them for him, and he's been grateful ever since, mostly by eating our patrols.", "He's somewhere in the Weeping Hills. Bring back a tooth."],
    done: ["Look at the size of that tooth. I'm having it mounted over the gate."] },
  { id: 'wb4', giver: 'hesper', lvl: 19, pre: 'dc73', name: 'Bounty: The Pale Queen', xp: qx(19, .6), gold: 60, gear: true, rep: E(500), obj: { named: 'thepalequeen', n: 1, what: 'Find the Pale Queen of Vharos in the barrens at night' },
    say: ["The last queen of Vharos walks the barrens at night with her court of shades. She doesn't know the kingdom fell. She thinks she's on a progress through her lands.", "Find her, child. At night. Tell her, gently, that she can stop now."],
    done: ["She's at rest? Good. The barrens will be a little quieter. A little sadder, too."] },
  // ----- dailies: once a day, for the garrison -----
  { id: 'wd1', daily: true, giver: 'pike', lvl: 16, pre: 'w2', name: 'Daily: Walk the Wall', xp: qx(16, .3), gold: 20, rep: E(250), obj: { kill: ['bonewarden', 'blightwolf', 'carrionwasp', 'blightghoul'], n: 12, near: 'march', nearR: 220, what: 'Defeat 12 creatures on the March' },
    say: ["Every day the March fills up again, and every day somebody has to empty it. Today that's you.", "Twelve. Same as yesterday. Same as tomorrow."], done: ["Same time tomorrow?"] },
  { id: 'wd2', daily: true, giver: 'vael', lvl: 17, pre: 'w4', name: 'Daily: Storm Watch', xp: qx(17, .35), gold: 26, rep: E(300), obj: { kill: ['blightspawn'], n: 8, what: 'Defeat 8 Blightspawn during a blight storm' },
    say: ["When a blight storm breaks, the dead come down with the rain. Every storm, they get closer to the walls.", "Eight of them, during the storm. Then come in and dry off."], done: ["Eight. Go and dry off. You smell like the inside of a grave."] },
  { id: 'wd3', daily: true, giver: 'cadwy', lvl: 18, pre: 'df1', name: 'Daily: Supply Run', xp: qx(18, .35), gold: 28, rep: E(300), obj: { collect: FORGE, item: 'Crate of Legion Supplies', chance: .4, n: 5, what: 'Take 5 Crates of Legion Supplies from the Legion or its golems' },
    say: ["The Legion moves supplies from the foundry every day. Every crate they lose is a crate we gain.", "Five crates. I'll make sure they go to the right people."], done: ["Five crates. Bandages and bread, mostly. The garrison thanks you."] },
  { id: 'wd4', daily: true, giver: 'hesper', lvl: 18, pre: 'w4', name: 'Daily: Lamp Oil', xp: qx(18, .35), gold: 28, rep: E(300), obj: { collect: ['ashwraith', 'vharosghost'], item: 'Measure of Ghost-Light', chance: .45, n: 6, what: 'Gather 6 Measures of Ghost-Light from the shades and wraiths' },
    say: ["The shades carry a little light with them, the last of whatever they were. Gathered, it burns in our lamps, and it guides the pilgrims to the gate.", "Six measures, child. Gently."], done: ["Six. The pilgrims will find us tonight."] },
  { id: 'wd5', daily: true, giver: 'vael', lvl: 20, pre: 'w6', name: 'Daily: Break the Legion', xp: qx(19, .4), gold: 40, rep: E(350), obj: { kill: LEGION, n: 15, near: 'legion', nearR: 220, what: 'Defeat 15 of the Black Legion on the Throne road' },
    say: ["The Legion rebuilds its camps on the Throne road every night. We knock them down every morning.", "Fifteen. Knock them down."], done: ["Knocked down. They'll be back up by tonight. So will we."] },
);
// dailies come back every day
const today = () => new Date().toDateString();
X.turnin.push(q => { if (q.daily) { S.ext.daily = S.ext.daily || {}; S.ext.daily[q.id] = today(); } });
let dayT = 0;
X.tick.push(dt => {
  if ((dayT -= dt) > 0) return; dayT = 20; const t = today();
  for (const q of QUESTS) if (q.daily && S.quests[q.id]?.state === 'turned' && S.ext.daily?.[q.id] !== t) delete S.quests[q.id];
});
