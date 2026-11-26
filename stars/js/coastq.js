// Build 6: the people of the new coast, what they say, and their quests (levels 10-15).
// The main story runs from the Greywatch Light to Crookwater and back, through all four coast dungeons.
import { world } from './world.js';
import { QUESTS, GIVERS, xpNeed } from './data.js';
import { TALK } from './dialogue.js';
import { LORE } from './story.js';
import { coastHooks } from './zones.js';
import { C6 } from './coast6.js';

// ---------- people ----------
Object.assign(GIVERS, {
  hale: { name: 'Head Keeper Mariel Hale', title: 'The Greywatch Light', model: 'villager3' },
  brannagh: { name: 'Keeper Brannagh', title: 'Warden of the Lamp', model: 'guard' },
  ketchmor: { name: 'Silas Ketch', title: 'Master of Crookwater', model: 'smuggler' },
  tamsy: { name: 'Tamsy Greenlow', title: 'Speaks for the families', model: 'villager1' },
  oldwyn: { name: 'Old Wyn', title: 'Salvaging', model: 'villager2' },
  hallie: { name: 'Hook-Hand Hallie', title: 'Fishing', model: 'pirate1' },
  rook: { name: 'Ostler Rook', title: 'Stables · mounts', model: 'villager0' },
  vance: { name: 'Lieutenant Corra Vance', title: 'Halyard Marines', model: 'guard' },
  dunn: { name: 'Harpooner Dunn', title: 'Late of the whaler Constance', model: 'pirate2' },
  ashgrove: { name: 'Marshal Ashgrove', title: 'The Fourfold Law · bounties', model: 'guard' },
});
coastHooks.build.push(() => {
  const C = C6.crook, Hm = C6.hamlet, port = world.port;
  world.storyNpcs.push(
    { key: 'rook', x: C.x - 12, z: C.z - 2, yaw: Math.PI / 2 }, { key: 'hallie', x: Hm.x + 8, z: Hm.z - 1, yaw: -Math.PI / 2 },
    { key: 'vance', x: C6.vaults.x + 9, z: C6.vaults.z + 4, yaw: -Math.PI / 2 }, { key: 'dunn', x: C6.grotto.x + 4, z: C6.grotto.z - 11, yaw: Math.PI },
    { key: 'ashgrove', x: port.x - 10, z: port.z - 7, yaw: Math.PI / 4 });
});
Object.assign(TALK, {
  hale: { bio: "Mariel Hale has kept the Greywatch Light for twenty-two years, and her mother before her, and her grandmother before that. Her great-grandfather was a navy captain who drowned in the last battle of the summoner wars. She tries not to think about where he is now.",
    greet: ["Mind the stairs. Four hundred and twelve of them, and every one has tried to kill me at least once.", "As long as the lamp burns, the drowned stay in the sea. That's the oldest rule on this coast, and lately it hasn't been working."],
    topics: [{ q: 'What do the keepers do?', a: ["We keep the lights. Every lighthouse on this coast was built after the war, with a ward-stone in the lamp, and the light from a warded lamp keeps the dead from walking up the beaches.", "For a hundred years it worked. Now the drowned come ashore anyway, and we can't work out why. Well. We have a guess. It begins with 'Grave' and ends with 'lord'."] },
      { q: 'Your great-grandfather?', a: ["Captain Ossery Hale, of the Resolute. He went down with his ship off the Drowned Reef. There's a portrait of him on the stairs, looking stern and magnificent.", "Some of the night watch swear they've seen him walking on the beach after dark. I tell them they've been at the lamp oil. I hope I'm right."] }] },
  brannagh: { bio: "Brannagh was a Halyard marine until she got tired of being told to stand still. Now she guards the Greywatch Light and is told to stand still somewhere with a better view.",
    greet: ["If it comes out of the sea, I hit it. If it comes out of the sea twice, I hit it harder.", "The keepers light the lamp. I make sure nobody puts it out. It's a simple job, and I'm very good at it."],
    topics: [{ q: 'Who is the tide cult?', a: ["Folk from the drowned villages who decided that if you can't beat the sea, you might as well worship it.", "They pray to the dead in the water, and lately the dead have started answering. Their temple's out in the salt lagoon on the Downs. I'd burn it down, but it's mostly underwater."] }] },
  ketchmor: { bio: "Silas Ketch runs Crookwater the way his mother taught him: honest prices, no questions, and nobody gets left on the road. He has smuggled everything from brandy to bishops, but he has never once lit a false lamp.",
    greet: ["Welcome to Crookwater. We don't exist, so mind you don't tell anyone how nice we are.", "Every family in this hollow lost a village to the drowned. Some lost more than that. Be gentle with them."],
    topics: [{ q: 'Smugglers and refugees?', a: ["When the dead came up the beaches, the navy guarded the forts and the free port guarded its gold. Nobody guarded the fishing villages.", "So we did. We had boats, we knew the back roads, and we had a hollow nobody could find. Now we have two hundred extra mouths and not nearly enough soup."] },
      { q: 'What about the wreckers?', a: ["Wreckers are not smugglers. A smuggler moves cargo past the law. A wrecker lights a false lamp on the rocks, waits for a ship to break, and then robs the bodies.", "Morrigan Blackhallow has been doing more of that lately, and somebody is paying her for every sailor she drowns. I would very much like to know who."] }] },
  tamsy: { bio: "Tamsy Greenlow walked forty families out of the drowned village of Little Saltings in one night, carrying a baby that wasn't hers and a cat that refused to be carried. She has organized Crookwater's soup kitchen ever since.",
    greet: ["If you're hungry, there's soup. If you're not hungry, there's still soup. We are, in many ways, a soup-based community.", "Mind the children, they bite. Not hard. Mostly out of affection."],
    topics: [{ q: 'What happened to Little Saltings?', a: ["The storm came in, and the dead came in with it. Sailors from the old war, in rotten coats, walking up out of the surf.", "We rang the bell and ran. Most of us made it. Some of us didn't, and on stormy nights I think I see them on the beach with the others."] }] },
  oldwyn: { bio: "Old Wyn has salvaged wrecks on this coast for sixty years. He can tell you the name of a ship from a single plank, and he will, at length, whether or not you asked.",
    greet: ["Every wreck's a library, if you can read wood.", "Brass, rope, timber, coin. The sea takes everything and gives back about a third, and the third is what I live on."],
    topics: [{ q: 'How does salvaging work?', a: ["Find a wreck, find the good timber and the brass, and pry it loose before the tide comes back for it. Wrecks on the beaches and the reefs all have something worth taking.", "Bring what you find to a forge or a bench and you'll be surprised what it turns into."] }] },
  hallie: { bio: "Hallie lost her hand to a shark at fourteen and replaced it with a hook she uses for gutting fish, opening barrels and making a point. She can catch a fish in a puddle.",
    greet: ["The fish are biting. So are the sharks. Wear boots.", "Fishing's easy. You put the line in the water and wait. Then you wait some more. Then, sometimes, a fish."],
    topics: [{ q: 'Where are the good fishing spots?', a: ["Wherever the water churns. You'll see the ripples where a school's feeding, right up by the shore.", "Calm water gives you supper. Rough water near the reefs gives you something worth selling. And in a storm, well. In a storm you might catch something you wish you hadn't."] }] },
  rook: { bio: "Rook kept the horses of the Saltmarrow post road until the road got too dangerous to post on. Now he keeps them in a hollow, and he talks to them more than to people. The horses seem to prefer it.",
    greet: ["Easy now. Not you, the horse. Well. You too, really.", "A good horse will carry you farther than a good sword, and it won't ask for a share of the loot."],
    topics: [{ q: 'Can I buy a horse?', a: ["Buy? No. Horses aren't bought on this coast, not anymore. They're earned, or they're found, or they're given by people who trust you.", "Help me out and I'll see you right. And if you hear of a beast worth riding in some dungeon, well, you won't need my help with that one."] }] },
  vance: { bio: "Lieutenant Vance was sent to watch the Brine Vaults with a squad of twelve marines. She has eleven now, and she has stopped asking Fort Halyard for more because they keep sending her poems about duty.",
    greet: ["The Admiralty's old vaults are under that bastion. Ninety years shut. Three weeks ago, the doors opened from the inside.", "My marines can hold the door. Going through it is another matter."],
    topics: [{ q: 'What were the Brine Vaults?', a: ["The navy's armory and treasury, cut into the cliffs during the war. Cannon, powder, pay chests, and the Admiralty's sealed records.", "When the war ended they flooded the lower halls and locked the doors. Everyone who knew the way in drowned with the fleet. Apparently that hasn't stopped them."] }] },
  dunn: { bio: "Dunn harpooned whales for thirty years on the Constance, until the night something dead and enormous came up under her hull. He was the only one to make it to shore. He has been sitting at the mouth of the grotto ever since, waiting for it to come out again.",
    greet: ["It's in there. I can hear it breathing, and it doesn't breathe.", "Thirty years of whales. Never saw one with a green light in its skull before."],
    topics: [{ q: 'What is in the grotto?', a: ["The bones of the biggest whale that ever swam, beached here before my grandfather's time. The ribs are the roof. The skull is the back wall.", "And something's moved into it. Crabs the size of carts, a serpent that eats lightning, a nest of storm-gulls. And at the back, the whale itself, awake, with a green light in its head."] }] },
  ashgrove: { bio: "Marshal Ashgrove enforces the Fourfold Law along the whole coast, which is a large coast and a small Marshal. She keeps a board of bounties, a book of names, and a very sharp pencil.",
    greet: ["The Law says the dead stay dead. Lately the dead disagree. I am collecting their names.", "Bounties are paid on proof, not promises. Bring me proof."],
    topics: [{ q: 'What is the Fourfold Law?', a: ["One, the dead stay dead. Two, no summoner binds more than four. Three, the war ruins are sealed. Four, what was bound in war is unbound in peace.", "Eight kings signed it. Somebody's broken all four clauses this year, and I would like a word with them."] }] },
});
Object.assign(LORE, {
  wreckledger: { title: "The Wreck-Queen's Ledger", where: 'teeth', text: "Ships on the rocks this season: 9. Sailors drowned: 61. Paid by the Hierophant at a crown a body: 61 crowns, less 3 crowns for the ones who swam ashore and had to be finished with oars. The Hierophant says the master wants them whole, so tell the boys to stop using the oars." },
  callowaysermon: { title: "Calloway's Last Sermon", where: 'shrine', text: "Brothers and sisters of the tide, the keepers tell you the light protects you. From what? From your own mothers and fathers, waiting for you under the water. The master has promised that when the lamps go out, the sea will give back everything it took. Put out the lamps. Let the tide come home." },
  veyorders: { title: 'Sealed Orders, Admiralty Seal', where: 'vaults', text: "To Commodore Vey, keeper of the vaults. The master requires ships. Raise the powder-crews and the marines, refit the hulls in the lower dock, and await the Leviathan. When it rises from the grotto, the fleet will follow it out of the deep, and no lamp on the coast will stop them. Signed with a single black thumbprint." },
  greywatchlog: { title: 'The Greywatch Log, Last Entry', where: 'light', text: "Lamp lit at dusk. Wind from the west. The drowned came up the north beach at midnight and stopped at the edge of the light, as they always do. Then one of them stepped into it, and kept walking. Wrote to the Head Keeper. Doubled the oil." },
});

// ---------- quests ----------
const qx = (lvl, f) => Math.round(xpNeed(Math.min(lvl, 19)) * f);
const NAVY = ['navymarine', 'navyofficer'], WRECK = ['wrecker', 'wreckerlamp', 'wreckerbrute'], CULT = ['tidesworn', 'tidechanter', 'brineling'];
const VAULT_KILL = ['navymarine', 'navyofficer', 'brineling'], GROTTO_KILL = ['crab', 'stormgull', 'shoreserpent', 'brineling'];
const Z = { zone: 'coast' };
QUESTS.push(
  // ----- the main story -----
  { id: 'k1', story: true, giver: 'sister', turnTo: 'hale', lvl: 10, pre: 'm16', name: 'A Light in the North', xp: qx(10, .3), gold: 12, rep: { light: 250 }, obj: { talk: true, what: 'Find Head Keeper Mariel Hale at the Greywatch Light, on the northern headland of the Saltreach Coast' },
    say: ["The Gravelord's reach goes past the Vale, {hero}. Every grave we've closed here, another has opened on the coast. The drowned are walking up the beaches.", "There is a lighthouse on the northern headland, the Greywatch Light, kept by an old order that has held back the sea's dead since the war. Go to their Head Keeper, Mariel Hale. Tell her the Vale sends its help, such as it is."],
    done: [['hale', "The Vale sent you? I wrote to them for help three months ago. I'd assumed the letter drowned."], ['hale', "Never mind. You're here now, and you look like someone who can climb stairs. Welcome to the Greywatch Light."]] },
  { id: 'k2', story: true, giver: 'hale', lvl: 10, pre: 'k1', name: 'Keep the Lamp Lit', where: 'headland', xp: qx(10, .45), gold: 14, rep: { light: 250 }, obj: { kill: NAVY, n: 10, near: 'headland', nearR: 160, what: 'Defeat 10 drowned marines or lieutenants on the Greywatch Headland' },
    say: ["The drowned are supposed to stop at the edge of the lamplight. For a hundred years they did. Now they keep walking, right up to the cottages.", "The ones on the headland are the old navy, marines and their officers, still in uniform. Put ten of them back in the sea, and we'll see whether the rest take the hint."],
    done: ["Ten! The night watch actually slept last night. One of them snored so loudly the drowned probably heard it. Thank you."] },
  { id: 'k3', story: true, giver: 'hale', lvl: 10, pre: 'k2', name: 'Oil for the Lamp', where: 'southshore', xp: qx(10, .5), gold: 16, rep: { light: 250 }, obj: { collect: WRECK, item: 'Flask of Lamp Oil', chance: .5, n: 6, what: 'Take back 6 Flasks of Lamp Oil from the wreckers on the south shore' },
    say: ["Our oil comes up the coast road from Saltmarrow, and lately it doesn't arrive. The wreckers on the south shore have been taking it.", "They burn it in false lamps on the rocks to wreck ships, which is a crime twice over. Take back six flasks. Ours have a little lighthouse stamped on the cork."],
    done: ["Six flasks, and every cork stamped. You'd be amazed how much lamp oil a lighthouse drinks. More than Brannagh, and that's saying something."] },
  { id: 'k4', story: true, giver: 'hale', turnTo: 'ketchmor', lvl: 11, pre: 'k3', name: 'The Hollow with One Door', xp: qx(11, .3), gold: 12, rep: { crook: 250 }, obj: { talk: true, what: 'Find Silas Ketch in Crookwater, a hidden hollow in the south-west of the coast' },
    say: ["Somebody is paying those wreckers, and I don't think it's for the oil. The only folk who know the south shore better than the wreckers are the smugglers.", "There's a hollow in the south-west called Crookwater. Officially, it doesn't exist. Ask for Silas Ketch. He's a rogue, but he's an honest rogue, and those are rarer than you'd think."],
    done: [['ketchmor', "Mariel Hale sent you? She must be desperate. The last time she sent someone here, it was to arrest my mother."], ['ketchmor', "Relax. My mother escaped. She runs the shop now. Come in, and mind the soup."]] },
  { id: 'k5', story: true, giver: 'ketchmor', lvl: 11, pre: 'k4', name: "Ketch's Eyes", where: 'teeth', zone: 'coast', xp: qx(11, .35), gold: 12, rep: { crook: 250 }, obj: { at: 'teeth', r: 30, what: "Scout the Wreckers' Teeth on the south shore and get close enough to count the fires" },
    say: ["The wreckers keep a camp on the south shore called the Teeth, after the rocks off the beach. Morrigan Blackhallow runs it, and she calls herself the Wreck-Queen, which tells you most of what you need to know.", "Go and have a look. Count the fires, count the guards, and come back with all your fingers. Then we'll talk about what to do with her."],
    done: ["Four signal fires and a camp full of cutthroats. That's twice what she had last spring. Somebody is paying her very well indeed."] },
  { id: 'k6', story: true, giver: 'ketchmor', turnTo: 'brannagh', lvl: 12, pre: 'dt3', name: "The Ledger's Last Page", xp: qx(12, .3), gold: 14, rep: { light: 250 }, obj: { talk: true, what: "Take the Wreck-Queen's ledger to Keeper Brannagh at the Greywatch Light" },
    say: ["A crown for every drowned sailor, paid by somebody called the Hierophant. The master wants them whole. I've been in this business thirty years, and I've never been so frightened by an accounts book.", "The keepers will know who this Hierophant is. Take the ledger to Brannagh at the Light. She'll know what to do with it, and if she doesn't, she'll hit something until she does."],
    done: [['brannagh', "The Hierophant. Calloway Drift. He leads the tide cult out in the salt lagoon. I always said he was trouble."], ['brannagh', "Paying for drowned sailors, whole. He isn't praying to the dead. He's collecting them. Right. Time to hit something."]] },
  { id: 'k7', story: true, giver: 'brannagh', lvl: 12, pre: 'k6', name: 'Salt in the Wound', where: 'downs', xp: qx(12, .45), gold: 18, rep: { light: 250 }, obj: { kill: CULT, n: 12, near: 'downs', nearR: 160, what: 'Defeat 12 of the tide cult or the brine they call up on the Salt Downs' },
    say: ["The tide cult camps all over the Salt Downs, between here and their lagoon. Acolytes, chanters, and the brine elementals they pull up out of the salt pans.", "Twelve of them, and then they'll be too busy guarding their camps to send anyone to the shrine. Then we go for the Hierophant."],
    done: ["Twelve. You can hear them wailing about it all the way from here. Good. Now for the lagoon."] },
  { id: 'k8', story: true, giver: 'brannagh', turnTo: 'hale', lvl: 13, pre: 'ds3', name: "The Hierophant's Map", xp: qx(13, .3), gold: 16, rep: { light: 300 }, obj: { talk: true, what: "Bring the Hierophant's sermon to Head Keeper Hale" },
    say: ["When the lamps go out, the sea will give back everything it took. That's what he told them. The poor fools believed it.", "Hale needs to read this. There's a map on the back of the last page, and I don't like where it points."],
    done: [['hale', "The Admiralty's vaults. That's where the map points. The navy's old armory, under the cliffs on the western Downs."], ['hale', "If the master is raising ships, he'll need cannon, powder and crews. The vaults have all three, and the crews have been waiting a hundred years."]] },
  { id: 'k9', story: true, giver: 'hale', turnTo: 'vance', lvl: 13, pre: 'k8', name: "The Admiralty's Door", xp: qx(13, .3), gold: 16, rep: { light: 300 }, obj: { talk: true, what: 'Find Lieutenant Vance at the old bastion over the Brine Vaults, on the western edge of the Salt Downs' },
    say: ["Fort Halyard sent a squad to watch the vaults when the doors opened. Lieutenant Corra Vance commands them, and from her letters, she is not having a nice time.", "Go to her. Take your friends. Take your friends' friends. The vaults were built to keep an army out, and now they're keeping one in."],
    done: [['vance', "From the keepers? Good. I was starting to think the next help to arrive would be another poem about duty."]] },
  { id: 'k10', story: true, giver: 'vance', turnTo: 'hale', lvl: 14, pre: 'dv3', name: 'Ships for a Dead Man', xp: qx(14, .3), gold: 20, rep: { light: 300 }, obj: { talk: true, what: "Bring Commodore Vey's sealed orders to Head Keeper Hale" },
    say: ["The commodore's orders. Black thumbprint, same as the ledger. Await the Leviathan, it says. When it rises from the grotto, the fleet will follow.", "I don't know what the Leviathan is, but I know who will. Take this to Hale, and quickly."],
    done: [['hale', "The Bonewhale Grotto, on the south shore. There's a whale's skeleton there the size of a church, beached before anyone can remember."], ['hale', "If the master has woken that, and means to drag the drowned fleet out of the deep behind it, then every lamp on this coast is going out at once."]] },
  { id: 'k11', story: true, giver: 'hale', turnTo: 'dunn', lvl: 14, pre: 'k10', name: 'Under the Ribs', xp: qx(14, .3), gold: 20, rep: { light: 300 }, obj: { talk: true, what: 'Find Harpooner Dunn at the mouth of the Bonewhale Grotto, on the far south shore' },
    say: ["There's an old whaler who's been camped at the mouth of the grotto for a month. Dunn, from the Constance. The only man who's seen what's inside and lived.", "Find him. If anybody knows how to kill a whale, it's a whaler, even if this one is already dead."],
    done: [['dunn', "Hale sent you? Then she believes me. Nobody else does. They think I've gone soft in the head."], ['dunn', "I haven't. It's in there, and it's waking up."]] },
  { id: 'k12', story: true, giver: 'dunn', turnTo: 'hale', lvl: 15, pre: 'dw3', name: 'Lights Along the Coast', where: 'lamp', zone: 'coast', xp: qx(15, .8), gold: 60, gear: true, rep: { light: 500, crook: 250 }, lore: 'greywatchlog', obj: { at: 'lamp', r: 8, what: 'Climb to the lamp of the Greywatch Light and tell Head Keeper Hale it is over' },
    say: ["It's dead. Properly dead this time. The green light went out of its skull like a candle.", "Go and tell the Head Keeper. And then climb her stairs and look out at the coast. You've earned the view."],
    done: [['hale', "The lamps held. All of them, the whole length of the coast. For the first time in a year, the drowned stopped at the edge of the light."], ['hale', "The Gravelord isn't finished, {hero}. Out past the Drowned Reef, the fleet he raised is still down there, and Admiral Vane with it. But tonight, this coast is safe, and you made it so. The keepers won't forget."]] },

  // ----- the Wreckers' Teeth (open, 10-11) -----
  { id: 'dt1', giver: 'ketchmor', lvl: 11, pre: 'k5', name: 'Pulling Teeth', where: 'teeth', xp: qx(11, .45), gold: 16, rep: { crook: 300 }, obj: { kill: WRECK, n: 12, near: 'teeth', nearR: 40, dungeon: true, what: "Defeat 12 wreckers at the Wreckers' Teeth" },
    say: ["The Wreck-Queen's camp is full of cutthroats and lamplighters, and her bruisers drag the cargo off the rocks. Thin them out. Twelve should do it.", "Every wrecker you put down is one less lamp on the rocks tonight, and one less ship on them in the morning."],
    done: ["Twelve! Mother says she'll name a soup after you. That's the highest honor Crookwater has."] },
  { id: 'dt2', giver: 'ketchmor', lvl: 11, pre: 'dt1', name: 'The Queen\'s Court', where: 'teeth', xp: qx(11, .55), gold: 20, gear: true, rep: { crook: 350 }, obj: { bosses: ['gullet', 'lampjack', 'saltmother'], n: 3, what: 'Defeat Mad Gullet, Lamplighter Fenwick and Grandmother Salt at the Teeth' },
    say: ["Three of Morrigan's people hold that camp together. Mad Gullet does the heavy lifting, Lamplighter Fenwick keeps the false lights burning, and Grandmother Salt keeps the books.", "Grandmother Salt is the dangerous one. She'll heal anyone who owes her money, and everyone owes her money."],
    done: ["All three. Without Salt's books, nobody in that camp knows who owes what. They'll be at each other's throats by morning."] },
  { id: 'dt3', giver: 'ketchmor', lvl: 11, pre: 'dt2', name: 'Long Live the Wreck-Queen', where: 'teeth', xp: qx(11, .75), gold: 30, gear: true, rep: { crook: 500 }, lore: 'wreckledger', obj: { named: 'blackhallow', n: 1, what: 'Defeat Morrigan Blackhallow, the Wreck-Queen, at the Teeth' },
    say: ["Now for Morrigan herself. She stands on the rocks with a lantern and watches the ships come in, and when they break, she laughs.", "Bring her down, and bring me whatever she writes things down in. I want to know who's been paying her."],
    done: ["A ledger. A crown a body, paid by the Hierophant. And look here: the master wants them whole.", "I need to sit down. And then I need you to take this to the keepers."] },
  // ----- the Tidewater Shrine (open, 11-12) -----
  { id: 'ds1', giver: 'brannagh', lvl: 12, pre: 'k7', name: 'Wading In', where: 'shrine', xp: qx(12, .45), gold: 18, rep: { light: 300 }, obj: { kill: CULT, n: 12, near: 'shrine', nearR: 48, dungeon: true, what: 'Defeat 12 of the tide cult at the Tidewater Shrine' },
    say: ["The shrine sits on an island in the middle of the lagoon, with one causeway out to it. The cult camps all round the shore and along the causeway.", "Clear a path. Twelve should do it. Mind the water, it's deeper than it looks, and the things in it are hungrier than they look."],
    done: ["The causeway's open. Now for the ones who keep it."] },
  { id: 'ds2', giver: 'brannagh', lvl: 12, pre: 'ds1', name: 'Guardians of the Lagoon', where: 'shrine', xp: qx(12, .55), gold: 22, gear: true, rep: { light: 350 }, obj: { bosses: ['deepmaw', 'lagoonwyrm', 'undertow'], n: 3, what: 'Defeat Deepmaw, the Lagoon Serpent and Sister Undertow' },
    say: ["Three things guard the Hierophant. A crab the size of a boat that the acolytes call Deepmaw, a serpent that lives in the lagoon itself, and Sister Undertow, his right hand.", "Undertow is a healer, so take her down fast, or you'll be fighting her all day."],
    done: ["The lagoon's quiet. Even the serpent's stopped thrashing. Now there's only him."] },
  { id: 'ds3', giver: 'brannagh', lvl: 12, pre: 'ds2', name: 'The Hierophant', where: 'shrine', xp: qx(12, .75), gold: 32, gear: true, rep: { light: 500 }, lore: 'callowaysermon', obj: { named: 'calloway', n: 1, what: 'Defeat Hierophant Calloway Drift in the Tidewater Shrine' },
    say: ["Calloway Drift. He was a fisherman once, from a village that the war drowned. Now he preaches that the dead will come home if the lamps go out.", "End it. And bring me anything he wrote. Men like him always write things down."],
    done: ["A sermon, and a map on the back. He knew exactly what the master was planning.", "Take this to Hale. She'll want to read it herself."] },
  // ----- the Brine Vaults (instanced, 13-14) -----
  { id: 'dv1', giver: 'vance', lvl: 13, pre: 'k9', name: 'Into the Vaults', xp: qx(13, .45), gold: 22, rep: { light: 300 }, obj: { kill: VAULT_KILL, n: 15, dungeon: true, what: 'Defeat 15 drowned marines, lieutenants or brine elementals inside the Brine Vaults' },
    say: ["The vaults run deep under the cliff: the gun decks, the powder stores, the pay rooms, and the commodore's hall at the bottom. Every hall is full of drowned marines who think the war is still on.", "Fifteen of them, and we'll know how many we're really dealing with. My marines will hold the door behind you."],
    done: ["Fifteen. My lads cheered so loudly they woke the ones you hadn't got to yet. Sorry about that."] },
  { id: 'dv2', giver: 'vance', lvl: 14, pre: 'dv1', name: 'The Officers\' Mess', xp: qx(14, .55), gold: 26, gear: true, rep: { light: 350 }, obj: { bosses: ['rusk', 'chainwarden', 'powdernell', 'barnacle'], n: 4, what: 'Defeat Quartermaster Rusk, the Chainwarden, Powder Nell and the Barnacle Hulk' },
    say: ["Four of them guard the way to the commodore. Rusk holds the armory and refuses every requisition. Something called the Chainwarden drags itself round the brig. Powder Nell has a hundred years of dry powder. And something big lives in the barnacle wall at the bottom of the stair.", "Take all four, and Vey will have nobody left between you and her."],
    done: ["Four for four. I'm going to write that down and send it to Fort Halyard. As a poem."] },
  { id: 'dv3', giver: 'vance', lvl: 14, pre: 'dv2', name: 'The Commodore', xp: qx(14, .75), gold: 36, gear: true, rep: { light: 500 }, lore: 'veyorders', obj: { named: 'vey', n: 1, what: 'Defeat Commodore Sabine Vey in the depths of the Brine Vaults' },
    say: ["Commodore Sabine Vey kept these vaults for forty years when she was alive. Now she keeps them for the Gravelord.", "She'll have orders on her. The navy always does. Bring them to me."],
    done: ["Sealed orders, under the Admiralty seal, signed with a black thumbprint. Await the Leviathan."] },
  // ----- the Bonewhale Grotto (instanced, 14-15) -----
  { id: 'dw1', giver: 'dunn', lvl: 14, pre: 'k11', name: 'Clearing the Ribs', xp: qx(14, .45), gold: 26, rep: { light: 300 }, obj: { kill: GROTTO_KILL, n: 15, dungeon: true, what: 'Defeat 15 crabs, gulls, serpents or brine elementals inside the Bonewhale Grotto' },
    say: ["Everything that lives in the sea has crawled into that grotto. Crabs in the ribs, gulls nesting in the roof, serpents in the pools.", "Fifteen of them, and we'll have a path. I'll show you where to stand when you're ready. I've been planning this for a month."],
    done: ["Fifteen. I've been sat here thirty days, and you did more in an afternoon than I did all month. Mind you, I mostly sat."] },
  { id: 'dw2', giver: 'dunn', lvl: 15, pre: 'dw1', name: 'Things That Live in Bones', xp: qx(15, .55), gold: 30, gear: true, rep: { light: 350 }, obj: { bosses: ['ribcrawler', 'shrikemother', 'vashh'], n: 3, what: 'Defeat the Ribcrawler, Shrikemother and Eelking Vashh' },
    say: ["Three of them keep the grotto. The Ribcrawler, a crab so big it lives inside the ribs. The Shrikemother, queen of the storm-gulls. And Vashh, the Eelking, who sleeps in the pool and eats lightning.", "Kill all three, and there's nothing between us and the whale."],
    done: ["Vashh is dead. I watched the lightning go out of him. Now. The whale."] },
  { id: 'dw3', giver: 'dunn', lvl: 15, pre: 'dw2', name: 'The Hollow Leviathan', xp: qx(15, .75), gold: 40, gear: true, rep: { light: 500, crook: 250 }, obj: { named: 'hollowwhale', n: 1, what: 'Defeat the Hollow Leviathan at the back of the Bonewhale Grotto' },
    say: ["It took the Constance. It took eleven of my friends. It's been dead longer than I've been alive, and it's still hungry.", "Put it down, {hero}. Properly, this time. For the Constance."],
    done: ["It's done. Properly done. For the Constance.", "Thank you. Now go and tell Hale. I'm going to sit here a bit longer. Just to make sure."] },

  // ----- side quests -----
  { id: 'kh1', giver: 'hale', lvl: 11, pre: 'k2', name: 'The Captain Walks at Night', where: 'headland', xp: qx(11, .6), gold: 28, gear: true, rep: { light: 400 }, obj: { named: 'osserylord', n: 1, what: 'Find Captain Ossery Hale on the headland at night, and lay him to rest' },
    say: ["The night watch say they've seen my great-grandfather on the north beach, after dark. Captain Ossery Hale, of the Resolute, in his good coat, with his sword out.", "If it's him, he deserves better than to be the Gravelord's puppet. Find him, after dark. And please, be gentle about it. As gentle as you can be with a sword."],
    done: ["It was him, wasn't it? You don't have to say. I can see it on your face.", "Thank you for bringing him home. I'll have his name put back on the stairs, under the portrait."] },
  { id: 'kb1', giver: 'brannagh', lvl: 11, pre: 'k2', name: 'Gull Trouble', where: 'headland', xp: qx(11, .4), gold: 14, rep: { light: 200 }, obj: { kill: ['stormgull'], n: 10, what: 'Defeat 10 Stormbeak Gulls' },
    say: ["The storm-gulls have started nesting on the lamp gallery. They knock the keepers off the railing and steal their sandwiches, not necessarily in that order.", "Ten of them. Do it for the sandwiches."],
    done: ["Ten gulls. The keepers have eaten an entire lunch in peace for the first time in weeks. They wept. Actual tears."] },
  { id: 'kt1', giver: 'tamsy', lvl: 10, name: 'Families on the Road', where: 'southshore', xp: qx(10, .4), gold: 12, rep: { crook: 200 }, obj: { kill: ['crab', 'shoreserpent'], n: 10, near: 'southshore', nearR: 140, what: 'Defeat 10 crabs or shore serpents along the south shore road' },
    say: ["More families come up the shore road every week, from villages the drowned have taken. And the crabs and serpents on the road take a toll of their own.", "Ten of them, so the next family through doesn't lose a grandmother to a crab. It happened last week. She was fine. The crab was not."],
    done: ["Thank you. The Pellow family came in this morning without a scratch on them. Well, one scratch. The grandmother bit the crab back."] },
  { id: 'kt2', giver: 'tamsy', lvl: 11, pre: 'kt1', name: 'What the Sea Gave Back', xp: qx(11, .45), gold: 16, rep: { crook: 250 }, obj: { collect: ['stormdrowned', 'navymarine'], item: 'Waterlogged Keepsake', chance: .4, n: 6, what: 'Recover 6 Waterlogged Keepsakes from the drowned that walk the shores' },
    say: ["The drowned that come up out of the sea in storms, some of them are ours. From Little Saltings and the other villages. They still carry things. Rings, lockets, little carved boats.", "Bring some back, if you can. Six. Their families would like something to bury, even if it's only a keepsake."],
    done: ["Oh. This one was Danny Pellow's. His mother will want it. Thank you, {hero}. Truly."] },
  { id: 'kt3', giver: 'tamsy', lvl: 12, pre: 'kt2', name: 'Bread for the Hollow', xp: qx(12, .45), gold: 18, rep: { crook: 300 }, obj: { collect: WRECK, item: 'Salvaged Flour Sack', chance: .5, n: 8, what: 'Take back 8 Salvaged Flour Sacks from the wreckers' },
    say: ["The wreckers took a whole grain ship off the rocks last week. Flour, salt, dried apples, enough to feed this hollow until spring.", "Take back eight sacks. Ketch says it's stealing. I say it's returning things to the people who need them. We've agreed to call it soup."],
    done: ["Eight sacks! That's bread for a month. Mother Ketch is already arguing with the oven."] },
  { id: 'ka1', giver: 'ashgrove', lvl: 11, name: 'Wanted: Lantern Jack', xp: qx(11, .6), gold: 35, gear: true, rep: { law: 400 }, obj: { named: 'lanternjack', n: 1, what: 'Bring down Lantern Jack, the wrecker who walks the south shore with a lamp' },
    say: ["Lantern Jack lights false lamps on the south shore, then walks the beach afterward picking pockets. Nine ships, by my count. The Law would like a word.", "He's on the south shore somewhere, carrying a lamp, which makes him easy to find and hard to sneak up on. Bounty's paid on proof."],
    done: ["That's his lamp. Bounty's yours, and the Law thanks you. I've crossed him out in my book with my very sharpest pencil."] },
  { id: 'ka2', giver: 'ashgrove', lvl: 12, pre: 'ka1', name: 'Wanted: Wrecker Gangs', xp: qx(12, .45), gold: 22, rep: { law: 300, crook: 150 }, obj: { kill: WRECK, n: 15, what: 'Defeat 15 wreckers anywhere on the coast' },
    say: ["The Wreck-Queen's people are spread all along the south shore in little gangs, three and four at a time. Each one is breaking the Law in four or five ways.", "Fifteen of them, and I'll call it a good month."],
    done: ["Fifteen. A good month, then. The Law pays its debts, even the small ones."] },
  { id: 'ka3', giver: 'ashgrove', lvl: 14, pre: 'ka2', name: 'Wanted: The Pale Abbess', xp: qx(14, .6), gold: 45, gear: true, rep: { law: 500 }, obj: { named: 'paleabbess', n: 1, what: 'Find the Pale Abbess on the western Downs at night and bring her to justice' },
    say: ["The Pale Abbess leads the tide cult's night prayers on the western Downs. She only comes out after dark, and wherever she prays, someone drowns in their bed by morning.", "Find her at night. Bring her down. And don't stand in the water."],
    done: ["The Abbess. I never thought I'd cross that name out. The Fourfold Law owes you, {hero}, and I'll make sure it remembers."] },
  // the stable master's horse
  { id: 'kr1', giver: 'rook', lvl: 12, name: 'Spooked', xp: qx(12, .4), gold: 14, rep: { crook: 200 }, obj: { kill: ['stormgull'], n: 8, what: 'Drive off 8 Stormbeak Gulls that have been spooking the horses' },
    say: ["The storm-gulls dive at my horses. A horse that's been dived at by a gull is a horse that won't come out of the stable for a week.", "Eight of them, and they'll learn to stay away. Gulls aren't clever, but they do remember."],
    done: ["Not a gull in sight. Look at her, she's practically prancing. Thank you."] },
  { id: 'kr2', giver: 'rook', lvl: 13, pre: 'kr1', name: 'The Shrike Took My Best Mare', xp: qx(13, .55), gold: 22, rep: { crook: 300 }, obj: { named: 'shrike', n: 1, what: 'Hunt down the Shrike of the Squall on the eastern Downs' },
    say: ["There's a storm-gull out on the Downs bigger than the others. Much bigger. They call it the Shrike of the Squall, and last month it took my best mare's foal right out of the paddock.", "I can't bring the foal back. But I'd sleep better knowing that thing will never take another."],
    done: ["It's done? Thank you. I'll tell the mare. She'll understand. Horses are cleverer than people think."] },
  { id: 'kr3', giver: 'rook', lvl: 13, pre: 'kr2', name: 'A Bridle of Sea-Glass', xp: qx(13, .5), gold: 20, rep: { crook: 300 }, mount: 'mount_saltpony', obj: { collect: ['shoreserpent'], item: 'Bead of Sea-Glass', chance: .5, n: 5, what: 'Collect 5 Beads of Sea-Glass from the shore serpents, who swallow anything that shines' },
    say: ["You've earned a horse, {hero}. I've got just the one: a salt pony from the downs, sure-footed and stubborn, and she's taken a liking to you. Don't ask me how I know.", "But a salt pony needs a proper bridle, and a proper bridle on this coast is strung with sea-glass. The serpents swallow it like sweets. Five beads should do it."],
    done: ["There. A bridle of sea-glass, and a pony to wear it. She's yours. Her name's Brine, and she bites, but only people she likes."] },
  // salvaging and fishing
  { id: 'kp1', giver: 'oldwyn', lvl: 10, name: 'Reading the Wood', xp: qx(10, .3), gold: 10, rep: { crook: 150 }, obj: { gather: 'salvage', n: 4, what: 'Learn Salvaging from Old Wyn, then salvage 4 wrecks along the shore' },
    say: ["Every wreck on this coast has something in it worth keeping. Brass fittings, good timber, rope, the odd coin, and once, a very confused parrot.", "Let me teach you to read the wood, and then go and pick over four wrecks. Bring back what you find, and tell me what ship it came from. I'll tell you if you're wrong."],
    done: ["Oak from the Margarethe, and brass from the Pell. You've got the eye. Or the luck. In this trade, it's the same thing."] },
  { id: 'kp2', giver: 'hallie', lvl: 10, name: 'A Line in the Water', xp: qx(10, .3), gold: 10, rep: { light: 150 }, obj: { gather: 'fish', n: 5, what: 'Learn Fishing from Hook-Hand Hallie, then catch 5 fish' },
    say: ["Anyone can fish. Line in, wait, line out. The trick is knowing where. Look for the ripples, where the water churns by the shore.", "Let me teach you, then catch five. Any five. Even a boot counts, if it's a nice boot."],
    done: ["Five fish and no boots. You're a natural. Or the fish are stupid. Either way, supper."] },
);
