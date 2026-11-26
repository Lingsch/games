// Build 12: fuller towns. New townsfolk in {town} and the three race-start towns, each with something to say and
// odd jobs to give, plus a pair of new rare creatures in every early land.
import { S, X, dist, isNight } from './core.js';
import { QUESTS, MOBS, GIVERS, xpNeed } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt, freeSpot } from './world.js';
import * as Cb from './combat.js';
import { boss, B, U, HU } from './hi9.js';

const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f * .75), qg = lvl => Math.round(2 + lvl * 3.5);
const FOLK = {};   // zone -> [keys]
function folk(zone, key, name, title, model, bio, greet, topics = []) { GIVERS[key] = { name, title, model }; TALK[key] = { bio, greet, topics }; (FOLK[zone] = FOLK[zone] || []).push(key); }
const Q = (zone, list) => QUESTS.push(...list.map(q => ({ zone: zone === 'vale' ? undefined : zone, xp: qx(q.lvl, q.obj.named ? .45 : .3), gold: qg(q.lvl), text: q.say[0], ...q })));

// ---------- {town}, in the Vale ----------
folk('vale', 'mabel12', 'Mabel Thatch', 'The baker', 'villager1', 'Mabel has baked bread for the town every morning for thirty-one years, including the morning the Choir came, when she handed out loaves to the militia on the walls and called it breakfast.',
  ["Mind the flour. Everything's flour. You'll go home looking like a ghost.", "If you're going out there, take a bun. Nobody fights well on an empty stomach."], [{ q: 'What\'s the news?', a: ["The news is that somebody is stealing my flour off the road, and somebody else's bees are making the best honey in the Vale and won't share it."] }]);
folk('vale', 'pip12', 'Pip Fennick', 'Wants to be a hero', 'villager0', 'Pip is nine and three-quarters, and has decided to become a hero. So far he has a wooden sword, a saucepan for a helmet, and the absolute certainty of a boy who has never been bitten by anything.',
  ["Are you a real hero? A REAL one? Have you killed a dragon? A big rat? A medium rat?", "When I grow up I'm going to be a hero just like you, only taller."]);
folk('vale', 'harrow12', 'Widow Harrow', 'Knows everyone\'s business', 'villager2', 'Widow Harrow sits on the bench by the well and knows everything that happens in the Vale, usually before it has finished happening.',
  ["Sit, sit. You look like someone who's heard the news. No? Then sit, and I'll tell you.", "I don't gossip, dear. I keep people informed. It's a public service."], [{ q: 'What have you heard?', a: ["That the brigands on the Kingsroad have a new leader, that the miller's daughter is sweet on the blacksmith's boy, and that there's a bear in the hills with one red eye the size of a plum. All true, too."] }]);
folk('vale', 'ned12', 'Ned Gravel', 'Gravedigger', 'villager3', 'Ned has buried half the town and expects to bury the other half, eventually, in no particular hurry. Lately the dead have been unburying themselves, and he takes it personally.',
  ["Morning. Nobody dead today? Shame. I've a lovely spot by the yew.", "They keep getting up. Fifty years I've been digging, and now they keep getting up."]);
Q('vale', [
  { id: 'tv1', giver: 'mabel12', lvl: 2, name: 'Honey for the Buns', where: 'town', obj: { collect: ['wasp'], item: 'Honeycomb', chance: .5, n: 6, what: 'Bring Mabel 6 honeycombs from the Meadow Stingers' },
    say: ["The stingers in the meadows have built their nests out of my honey. My honey! I left it on the windowsill to cool for one afternoon.", "Six honeycombs, and you'll have buns for a week."], done: ["Oh, that's lovely. Smell that. Here, take a bun. Take two. You're too thin for a hero."] },
  { id: 'tv2', giver: 'mabel12', lvl: 4, pre: 'tv1', name: 'Flour Thieves', where: 'wagon', obj: { collect: ['bandit', 'bandit2', 'xbow'], item: 'Sack of Flour', chance: .4, n: 6, what: 'Recover 6 sacks of flour from the brigands on the Kingsroad' },
    say: ["The brigands on the Kingsroad have been stopping my flour cart. They don't even like bread. They just like stopping carts.", "Six sacks. And if one of them has flour on his face, you'll know he's the one who ate the cake."], done: ["Every sack! And only one of them opened. Bless you."] },
  { id: 'tv3', giver: 'pip12', lvl: 2, name: 'Pip\'s Wooden Sword', where: 'town', obj: { collect: ['wolf'], item: 'Pip\'s Wooden Sword', chance: .25, n: 1, what: 'Get Pip\'s wooden sword back from the wolves' },
    say: ["A wolf took my sword! I was being very brave and it just took it, like it was a stick. It IS a stick. But it's MY stick.", "Please get it back. Don't tell my mum I was in the fields."], done: ["My sword! It's all chewed. That makes it better, actually. It's been in a battle now."] },
  { id: 'tv4', giver: 'pip12', lvl: 5, pre: 'tv3', name: 'Pip\'s Dare', where: 'graveyard', obj: { at: 'graveyard', r: 12, what: 'Stand in the graveyard where Pip was dared to go' },
    say: ["The big kids dared me to go to the graveyard and touch the old yew. I'm not scared. I just don't want to. Will you do it for me, and then I'll say I did it?", "That's not lying. That's... delegating. My dad says that a lot."], done: ["You did it? Was it scary? Did a ghost come out? Don't tell me. Tell me. No, don't."] },
  { id: 'tv5', giver: 'harrow12', lvl: 4, name: 'Rumours on the Road', where: 'wagon', obj: { kill: ['bandit', 'bandit2', 'xbow'], n: 10, near: 'wagon', nearR: 120, what: 'Thin out the brigands on the Kingsroad: 10 of them' },
    say: ["The brigands on the road have a new leader, and they've been bold since. Bold brigands are bad for gossip: nobody comes to town any more.", "Ten of them, dear. That should shut them up for a while."], done: ["Already the carts are coming back. I've heard three new rumours this afternoon. Thank you."] },
  { id: 'tv6', giver: 'harrow12', lvl: 6, name: 'Old Redeye', where: 'tower', obj: { named: 'redeye12', n: 1, what: 'Hunt Old Redeye, the one-eyed bear in the hills' },
    say: ["The bear with the red eye is real, dear. He's killed three sheep and a tinker. The tinker deserved it, mostly, but the sheep didn't.", "He prowls the hills west of the old tower."], done: ["You killed him? Oh, I'll be telling that one for years. It'll get bigger each time. The bear, I mean."] },
  { id: 'tv7', giver: 'ned12', lvl: 5, name: 'Restless Neighbours', where: 'graveyard', obj: { kill: ['risen', 'skeleton', 'ghoul'], n: 10, near: 'graveyard', nearR: 140, what: 'Put 10 of the risen dead back down' },
    say: ["They keep getting up. Old Tom Halloway got up three times this week. Three! He never got up that much when he was alive.", "Put ten of them back down. Gently, if you can. Not too gently."], done: ["That's quieter. Thank you. I'll have the spades out in the morning."] },
  { id: 'tv8', giver: 'ned12', lvl: 8, pre: 'tv7', name: 'Ned\'s Good Spade', obj: { collect: ['ghoul'], item: 'Ned\'s Good Spade', chance: .25, n: 1, what: 'Take back the spade a ghoul ran off with' },
    say: ["One of them took my good spade. My GOOD spade. Forty years I've had that spade. A ghoul has it now, out in the dark somewhere, and I bet it's digging all wrong."], done: ["There she is. Bit of ghoul on the handle. I'll scrub it."] },
  { id: 'tv9', giver: 'pip12', lvl: 3, pre: 'tv3', name: 'Grimtooth', where: 'town', obj: { named: 'grimtooth12', n: 1, what: 'Hunt Grimtooth, the wolf who took Pip\'s sword' },
    say: ["The wolf that took my sword had a name! The farmers call him Grimtooth. He's the big grey one. Will you get him? For me? For justice?"], done: ["JUSTICE. I'm going to tell everybody. Can I say I helped? I'll say I helped."] },
]);
// ---------- Hornstead, in the Weald (Varr) ----------
folk('weald', 'tusk12', 'Old Tusk', 'Retired beast-warden', 'bladewarden1', 'Tusk kept the beast-graves for forty years, and has the scars to prove it: a set of boar teeth across his left forearm, which he will show you whether or not you ask.',
  ["Mind the boars. They remember faces. Mine, especially.", "The Weald's been wrong since the Choir came. The animals are scared, and scared animals bite."]);
folk('weald', 'brin12', 'Brin Quickhand', 'Teller of stories', 'villager0', 'Brin is eleven and knows every story the Varr have ever told, and several they haven\'t. She tells them to anyone who stands still long enough.',
  ["Do you want to hear about the Bone-King? Everyone wants to hear about the Bone-King.", "The old Varr say the beast-gods sleep under the Heartwood, and they dream us."]);
folk('weald', 'nettle12', 'Nettle', 'Herb-wife', 'druid1', 'Nettle grows, picks, brews and sells everything green in Hornstead, and has strong opinions about all of it.',
  ["Don't touch that. Don't touch that either. Actually, just don't touch anything.", "Everything in the Weald is medicine or poison. The trick is knowing which, and how much."]);
Q('weald', [
  { id: 'tw12a', giver: 'nettle12', lvl: 1, name: 'Stinger Venom', where: 'clearing', obj: { collect: ['nettlewasp'], item: 'Nettle Venom', chance: .5, n: 6, what: 'Bring Nettle 6 sacs of nettlewasp venom' },
    say: ["Nettlewasp venom, a little of it, cures a fever. A lot of it gives you one. I'm out of both. Six sacs."], done: ["Good, unpopped, too. You've a gentle hand for a fighter."] },
  { id: 'tw12b', giver: 'nettle12', lvl: 4, pre: 'tw12a', name: 'Bitter Sap', where: 'seekers', obj: { collect: ['sapling'], item: 'Bitter Sap', chance: .5, n: 5, what: 'Tap 5 measures of bitter sap from the walking saplings' },
    say: ["The saplings that walk have a sap that heals a burn in a night. They don't like being tapped. They don't like anything. Five measures."], done: ["Sticky. Perfect. I'll have the salve ready by sundown."] },
  { id: 'tw12c', giver: 'tusk12', lvl: 2, name: 'Boar Season', where: 'clearing', obj: { collect: ['mossboar'], item: 'Mossboar Tusk', chance: .5, n: 6, what: 'Bring Old Tusk 6 mossboar tusks' },
    say: ["Mossboars are breeding again, and when they breed, they get brave. Six tusks, and they'll get the idea."], done: ["Six. Good. You fight like a Varr, for someone so... well. You fight well."] },
  { id: 'tw12d', giver: 'tusk12', lvl: 3, pre: 'tw12c', name: 'The Poachers\' Snares', where: 'poachers', obj: { kill: ['poacher', 'trapper'], n: 8, near: 'poachers', nearR: 120, what: 'Drive off 8 of the poachers in the eastern woods' },
    say: ["Poachers. Outsiders, with iron snares, taking beasts the Varr don't take. They don't take what they kill to the beast-graves. They just take it.", "Eight of them. And break every snare you see."], done: ["The woods will be quieter tonight. The right kind of quiet."] },
  { id: 'tw12e', giver: 'tusk12', lvl: 4, name: 'Old Bristleback', where: 'eastwoods', obj: { named: 'bristleback12', n: 1, what: 'Hunt Old Bristleback, the greatest boar in the Weald' },
    say: ["There's a boar out there I've been hunting for twenty years. Old Bristleback. He gave me these scars. I'm too old to finish it. You're not."], done: ["Gone? Truly? I'll miss him, the old devil. Thank you. Bury his tusks at the beast-graves, if you've time."] },
  { id: 'tw12f', giver: 'brin12', lvl: 3, name: 'Stories in the Bones', where: 'beastgraves', obj: { collect: ['warbones'], item: 'Old Bone-Charm', chance: .4, n: 5, what: 'Recover 5 old bone-charms from the warbones' },
    say: ["The warbones are old Varr warriors who won't stay buried. Every one of them wears a bone-charm with a story carved on it. Bring me five! I want to read them all!"], done: ["This one's about a hero who wrestled a bear. This one's about a hero who married a bear. The Varr had very complicated feelings about bears."] },
  { id: 'tw12g', giver: 'brin12', lvl: 4, pre: 'tw12f', name: 'The Heartwood Whisper', where: 'heartwood', obj: { at: 'heartwood', r: 16, what: 'Go to the Heartwood and listen' },
    say: ["The stories say the beast-gods whisper in the Heartwood if you stand very still. Nobody believes me. Will you go and listen? And then tell me they whispered, even if they didn't?"], done: ["They did? They DID? What did they say? ...You're just saying that. You are, aren't you. I don't care. I'm telling everyone."] },
  { id: 'tw12h', giver: 'nettle12', lvl: 5, name: 'The Thorn-Queen', where: 'seekers', obj: { named: 'thornqueen12', n: 1, what: 'Kill the Thorn-Queen, the great bark-spider of the Weald' },
    say: ["There's a spider in the deep woods with a body like a barrel and a bite that turns blood to sap. Every bark-spider in the Weald comes from her. Kill her, and bring me her venom sac. Carefully."], done: ["Careful indeed. This will make medicine for a year. Or kill a village. Medicine. Definitely medicine."] },
]);
// ---------- Cinderhall, at the Kiln (Grael) ----------
folk('kiln', 'oreka12', 'Oreka Stonebrow', 'Quarry boss', 'bulwark1', 'Oreka runs the quarries above Cinderhall and has a voice that can be heard over three hammers and a rockfall. She does not believe in inside voices. She does not believe in inside.',
  ["SPEAK UP. EVERYONE SPEAKS UP IN THE QUARRY.", "The golems are old Grael work. They were built to dig. Now they dig whatever's in front of them, including people."]);
folk('kiln', 'dunmore12', 'Dunmore', 'Lamp-tender', 'villager3', 'Dunmore keeps the lamps of Cinderhall burning, all four hundred and twelve of them. He has named every one.',
  ["Lamp three-oh-six is flickering. She does that when she's sad.", "Bats keep getting into the lamps. Then the lamps go out, and then the bats are very warm for about a second."]);
folk('kiln', 'gemma12', 'Gemma Flint', 'Jeweller', 'villager2', 'Gemma cuts stones for half the Grael holds, and can tell a garnet from a bit of red glass by the sound it makes when she taps it with her teeth.',
  ["Don't let anyone tell you glass is worth nothing. It's worth exactly what a fool will pay for it.", "Somebody's been robbing my couriers. Probably the scavengers. Definitely the scavengers."]);
Q('kiln', [
  { id: 'tk12a', giver: 'dunmore12', lvl: 2, name: 'Bats in the Lamps', where: 'steps', obj: { kill: ['slagbat'], n: 10, near: 'steps', nearR: 140, what: 'Clear 10 slag-bats from the Cinder Steps' },
    say: ["Slag-bats. They nest in the lamp-cages for the warmth, and then they put the lamps out with their wings. Lamp one-nine-eight hasn't been lit for a week. She's very upset.", "Ten of them, please."], done: ["One-nine-eight is burning again. She says thank you. Well, she flickers thank you."] },
  { id: 'tk12b', giver: 'dunmore12', lvl: 2, pre: 'tk12a', name: 'Cinder-Oil', where: 'steps', obj: { collect: ['cinderling'], item: 'Cinder Oil', chance: .5, n: 6, what: 'Collect 6 flasks of cinder oil from cinderlings' },
    say: ["Cinderlings burn on oil, and that oil burns twice as long as anything you can buy. Six flasks, and the lamps will last the winter."], done: ["Smell that. Like a forge on a winter morning. Lovely."] },
  { id: 'tk12c', giver: 'oreka12', lvl: 3, name: 'Rusty Golems', where: 'sleepers', obj: { kill: ['rustgolem'], n: 8, near: 'sleepers', nearR: 140, what: 'Put down 8 rust-golems in the Golem Field' },
    say: ["THE GOLEMS HAVE WANDERED INTO MY QUARRY AGAIN. EIGHT OF THEM. PUT THEM DOWN."], done: ["GOOD WORK. YOU HIT HARD. I LIKE THAT."] },
  { id: 'tk12d', giver: 'oreka12', lvl: 3, name: 'Glass Teeth', where: 'ridge', obj: { collect: ['glassmite'], item: 'Glassmite Mandible', chance: .5, n: 6, what: 'Collect 6 glassmite mandibles from the Glass Ridge' },
    say: ["GLASSMITE TEETH CUT STONE BETTER THAN STEEL. SIX OF THEM. MIND YOUR FINGERS."], done: ["SHARP. VERY GOOD. I WILL MAKE A SAW."] },
  { id: 'tk12e', giver: 'oreka12', lvl: 4, name: 'Ironjaw', where: 'sleepers', obj: { named: 'ironjaw12', n: 1, what: 'Break Ironjaw, the oldest golem in the Golem Field' },
    say: ["THERE IS A GOLEM IN THE FIELD OLDER THAN CINDERHALL. IRONJAW. IT HAS EATEN THREE OF MY PICKAXES AND ONE OF MY FOREMEN. THE FOREMAN WAS FINE, EVENTUALLY. BREAK IT."], done: ["IRONJAW IS BROKEN? I WILL BUY YOU A DRINK. I WILL BUY YOU SEVERAL DRINKS."] },
  { id: 'tk12f', giver: 'gemma12', lvl: 4, name: 'Scavenged Stones', where: 'scav', obj: { collect: ['scavenger'], item: 'Stolen Gem', chance: .45, n: 5, what: 'Recover 5 stolen gems from the scavengers' },
    say: ["The scavengers have been robbing my couriers. Five stones I'd already cut and promised. Bring them back, and I'll make you something nice."], done: ["Not a scratch on them. The scavengers clearly didn't know what they had. Thank you."] },
  { id: 'tk12g', giver: 'gemma12', lvl: 4, pre: 'tk12f', name: 'The First Forge', where: 'oldforge', obj: { at: 'oldforge', r: 16, what: 'Find the First Forge, where the Grael learned to work glass' },
    say: ["Every Grael jeweller makes one pilgrimage in her life, to the First Forge, where the old masters first turned sand into glass. I'm too busy. Go for me, and tell me if the anvil's still there."], done: ["Still there? Of course it is. Nothing moves that anvil. Thank you."] },
  { id: 'tk12h', giver: 'dunmore12', lvl: 5, name: 'The Ember King', where: 'ridge', obj: { named: 'emberking12', n: 1, what: 'Hunt the Ember King, the pack-leader of the ember-hounds' },
    say: ["There's an ember-hound on the Ridge that's grown so hot the lamps light themselves when it passes. The Ember King. It's lovely to watch, and it ate my apprentice's boots. With his feet in them. He's fine. Mostly."], done: ["The Ridge is dark again. Normally I'd hate that. Tonight I don't."] },
]);
// ---------- Lanternrest, in the Hush (Sallow) ----------
folk('hush', 'moth12', 'Mother Moth', 'Lantern-maker', 'cleric1', 'Mother Moth makes the lanterns of Lanternrest, and the Sallow say that every lantern she has ever made has guided someone home. She says that is nonsense, but she says it while making another lantern.',
  ["Every lantern is a promise: someone is waiting for you. I just make the promises.", "The fen is dark, child. Take a light."]);
folk('hush', 'quentin12', 'Quentin Reed', 'Ferryman', 'villager3', 'Quentin poles the ferry across the deep channels of the Hush, for anyone who can pay and several who can\'t. He has fallen in four times. He says that\'s a record. Nobody knows whose.',
  ["Ferry's running. Mostly. Mind the eels.", "The witchfinders don't like the Sallow. The Sallow don't like the witchfinders. I like everyone who pays."]);
folk('hush', 'ada12', 'Ada Gloam', 'Sees ghosts', 'villager0', 'Ada is eight, and sees ghosts. All the Sallow children do, for a while; most stop by twelve. Ada has decided she isn\'t going to stop.',
  ["There's one behind you. No, the other side. He's waving. Wave back.", "The lost ones aren't scary. They're just lost. Like when you can't find your mum at the market, but forever."]);
Q('hush', [
  { id: 'th12a', giver: 'moth12', lvl: 1, name: 'Marshfly Wings', where: 'lampfen', obj: { collect: ['marshfly'], item: 'Marshfly Wing', chance: .5, n: 8, what: 'Gather 8 marshfly wings for Mother Moth\'s lanterns' },
    say: ["Marshfly wings, held up to a flame, glow green for a hundred nights. Eight of them, and I'll have the windows done."], done: ["Look at that green. Lovely. A lantern made of marshflies. Nobody else would think of it."] },
  { id: 'th12b', giver: 'moth12', lvl: 3, pre: 'th12a', name: 'Lanterns for the Lost', where: 'reeds', obj: { at: 'reeds', r: 16, what: 'Carry a lantern out to the Drowned Reeds and leave it burning' },
    say: ["Every year the Sallow leave a lantern burning in the Drowned Reeds, for the people the fen took. This year my legs won't make the walk. Take it for me."], done: ["Thank you. They'll see it. I know they will."] },
  { id: 'th12c', giver: 'quentin12', lvl: 2, name: 'Crawlers on the Causeway', where: 'causeway', obj: { kill: ['mirecrawler'], n: 10, near: 'causeway', nearR: 140, what: 'Clear 10 mirecrawlers from the Causeway' },
    say: ["Mirecrawlers on the Causeway again. Folk won't walk it, so they want the ferry, and the ferry's only me. Ten of them, and I can have my afternoons back."], done: ["Wonderful. I'm going to sit down for a whole hour."] },
  { id: 'th12d', giver: 'quentin12', lvl: 4, name: 'The Witchfinders\' Warrant', where: 'finders', obj: { kill: ['witchfinder', 'finderbow'], n: 8, near: 'finders', nearR: 140, what: 'Drive off 8 of the witchfinders camped in the fen' },
    say: ["The witchfinders have a warrant for every Sallow in the Hush. They say we're cursed. We're not cursed. We're just pale and we see dead people. That's not a curse, that's a lifestyle.", "Eight of them. Then maybe they'll go home."], done: ["They're packing up. Good riddance. And thank you, from all of us pale and cursed folk."] },
  { id: 'th12e', giver: 'quentin12', lvl: 5, name: 'The Bog-Beast', where: 'thrallpits', obj: { named: 'bogbeast12', n: 1, what: 'Kill the Bog-Beast that has been sinking the ferries' },
    say: ["Something big has been tipping my ferry. Something with a lot of arms. The fishermen call it the Bog-Beast. I call it the reason I've fallen in four times."], done: ["Dead? Really dead? I could kiss you. I won't, I'm all fen-water. But I could."] },
  { id: 'th12f', giver: 'ada12', lvl: 3, name: 'My Friend the Ghost', where: 'callers', obj: { kill: ['fenghoul'], n: 8, near: 'callers', nearR: 160, what: 'Stop 8 fen-ghouls frightening Ada\'s ghost friend' },
    say: ["My friend Tobias is a ghost. He's very nice. The fen-ghouls keep scaring him. Ghosts can be scared, you know. Ask any ghost.", "Eight of them, please. He's hiding under the jetty and he won't come out."], done: ["Tobias says thank you. He's doing a little dance. You can't see it, but it's very good."] },
  { id: 'th12g', giver: 'ada12', lvl: 4, pre: 'th12f', name: 'The Lost Ones\' Names', where: 'reeds', obj: { collect: ['lostone'], item: 'Name-Token', chance: .45, n: 5, what: 'Bring Ada 5 name-tokens from the lost ones' },
    say: ["The lost ones carry little tokens with their names on, so they don't forget. But they've forgotten how to read. If you bring me their tokens, I'll read the names out loud. Then they'll remember."], done: ["Hessa. Aldo. Little Wim. Corra. And... this one's my grandad. Oh. Hello, Grandad."] },
  { id: 'th12h', giver: 'moth12', lvl: 4, name: 'The Lantern Jack', where: 'lampfen', obj: { named: 'lanternjack12', n: 1, what: 'Put out the Lantern Jack, which walks the fen at night' },
    say: ["There's a light in the fen at night that isn't one of mine. It leads people into the deep water. The Sallow call it the Lantern Jack. Put it out, child. Put it out for good."], done: ["Out? Good. My lanterns are the only lights in the fen now. That's how it should be."] },
]);

// ---------- new rares ----------
Object.assign(MOBS, {
  grimtooth12: boss('Grimtooth', 'wolf', { ...B, scale: 1.4, hpM: 1.2, aggro: 12, mechs: ['charge'] }),
  redeye12: boss('Old Redeye', 'bear', { ...B, scale: 1.5, hpM: 1.4, aggro: 12, mechs: ['slam', 'charge'] }),
  bristleback12: boss('Old Bristleback', 'boarbig', { ...B, scale: 1.3, hpM: 1.3, aggro: 12, mechs: ['charge', 'knock'] }),
  thornqueen12: boss('The Thorn-Queen', 'spider~verdant', { ...B, scale: 1.8, hpM: 1.3, aggro: 12, mechs: ['web', 'spawn'], adds: 'barkspider' }),
  ironjaw12: boss('Ironjaw', 'golempet~ashen', { scale: 1.6, hpM: 1.4, aggro: 12, weak: 'frost', resist: 'fire', mechs: ['slam', 'shield'] }),
  emberking12: boss('The Ember King', 'wolf~gilded', { ...B, scale: 1.5, hpM: 1.3, aggro: 12, weak: 'frost', resist: 'fire', school: 'fire', mechs: ['charge', 'pool'] }),
  bogbeast12: boss('The Bog-Beast', 'troll~verdant', { scale: 1.5, hpM: 1.4, aggro: 12, mechs: ['slam', 'knock'] }),
  lanternjack12: boss('The Lantern Jack', 'ghost', { ...U, scale: 1.5, hpM: 1.1, aggro: 12, range: 16, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'pool'] }),
});
const RARES = { vale: [['grimtooth12', 3, -140, 40], ['redeye12', 6, -210, -150]], weald: [['bristleback12', 4, 150, 140], ['thornqueen12', 5, -110, -120]], kiln: [['ironjaw12', 4, -170, -70], ['emberking12', 5, 150, 100]], hush: [['bogbeast12', 5, -150, -170], ['lanternjack12', 4, 150, 110, true]] };
X.zone.push(zone => {
  for (const [key, L, x, z, night] of RARES[zone] || []) {
    if (world.spawns.some(s => s.named === key)) continue;
    world.spawns.push({ x, z, y: hgt(x, z), mob: key, named: key, lvl: [L, L], respawn: 480, area: 0, alive: null, timer: 470, ...(night ? { when: isNight } : {}) });
  }
  // the townsfolk, standing somewhere sensible
  if (!FOLK[zone] || !world.town) return;
  const t = world.town, avoid = S.ents.filter(e => e.team === 'npc' && !e.prop && dist(e, t) < 50);
  FOLK[zone].forEach((k, i) => { const p = freeSpot(t.x, t.z, 6 + i * 2, 30, 1.7 + i * 1.6, avoid); avoid.push(p); const g = GIVERS[k];
    const e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: g.name, title: g.title, kind: g.model, x: p.x, z: p.z, giver: k }); e.y = hgt(p.x, p.z); e.yaw = Math.atan2(t.x - p.x, t.z - p.z); });
});
