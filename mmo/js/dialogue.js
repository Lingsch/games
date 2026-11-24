// Build 4.2: the script. Every quest's dialogue, what people say when you just talk to them, who they are
// when you inspect them, the story scenes and the lore pages. Lines are a string (the quest's speaker)
// or [speakerKey, text]. {town}, {hero}, {captain} and friends are filled in when shown.
import { QUESTS, GIVERS, MOBS } from './data.js';
import { LORE, SCENES } from './story.js';

const Q = id => QUESTS.find(q => q.id === id);
function script(id, say, done, choices) {
  const q = Q(id); if (!q) return;
  q.say = say; q.done = done;
  if (choices && q.choices) choices.forEach((c, i) => { if (q.choices[i]) Object.assign(q.choices[i], c); });
  q.text = typeof say[0] === 'string' ? say[0] : say[0][1];
}

// ======================= THE VALE: MAIN STORY =======================
script('m1', [
  "Oh, thank the Four, a real adventurer! I've been standing out here practicing my wave for an hour in case one came by. I'm Wick Tallow, and I dig the graves for {town}. Well, mostly I fill them. Digging is the easy part.",
  "The trouble is that somebody has started un-filling them. Three graves opened up last night: old Mother Abernathy, the Cobb twins, and my Uncle Bartholomew, who was never much of a morning person and has apparently become a night person instead.",
  "Would you take a look at them for me? I've been staring at those holes for so long that I've started wishing them good morning, and I'm fairly sure one of them winked back.",
], [
  "Dug out from below? Not from above? Oh, that's worse. I knew it was going to be worse. I could feel it being worse all the way down in my boots.",
  "Graves are supposed to be a one-way arrangement. Something is breaking the rules, and I'd very much like it to stop before it reaches the T's. Tallow starts with a T, you see.",
]);
script('m2', [
  "There's something else you ought to see. Out past the north fields, the grass has been pressed flat in long lines, as if something heavy was dragged through it. Or as if something walked through it without bothering to pick up its feet.",
  "I made a list of the things that could be, and I didn't like a single one of them. Would you follow the marks and see where they lead? I'd come along, but somebody has to stay and guard the holes, and the holes don't seem to respect me.",
], [
  "They head north, toward the Ossuary? Of course they do. Nothing pleasant has ever come out of the Ossuary. I once found a sandwich up there, and I'm almost certain that even the sandwich was haunted.",
  "Well, now we know where they're going. That means somebody official needs to know as well.",
]);
script('m3', [
  "We need to tell the Watch. Well, really, you need to tell the Watch. Warden Ilse thinks very highly of adventurers and not at all highly of me.",
  "I buried her cat last spring. It turned out to be the wrong cat, and the right cat came home the next morning looking extremely pleased with itself. She has never forgiven either of us.",
], [
  "Graves dug open from the inside, drag marks running north to the Ossuary, and Wick Tallow as the star witness. You'll forgive me if I take a long breath before I answer that.",
  "All right. I believe you. I'm not entirely sure I believe Wick, but I believe you, and that's enough for me. The dead don't get up and wander off on their own, whatever the old stories say. Somebody is moving them, and I intend to find out who.",
], [
  { t: 'Wick noticed all of this before anyone else did. He deserves some credit.', reply: ['warden', "Hm. That's a fair point, and I don't hear many of those in this job. Maybe I'll stop calling him 'the shovel' behind his back. In front of him, I make no promises."] },
  { t: "Let's skip the speeches. What do you need from me?", reply: ['warden', "Now that's the kind of attitude I like to see in an adventurer. Straight to work it is, then."] },
]);
script('m4', [
  "The brigands out on the Kingsroad will steal anything that isn't nailed down, and lately they've started taking the nails as well. If anybody in the Vale is being paid to dig up graves, my money is on that lot.",
  "Their camps are strung along the road to the east and west of town. Search them, and bring me something that ties them to the graveyard. A shovel with the wrong kind of mud on it would do nicely.",
], [
  "That's grave mud on this blade, and I'd wager my badge that it came from Mother Abernathy's plot. So the brigands were hired to dig. The next question is who hired them, and what they were paid with.",
]);
script('m5', [
  "Every hired hand expects to be paid, and brigands expect it more than most. Find out what these diggers were paid with. Their purses should tell us who's holding the other end of the rope.",
  "When you've got the coins, take them straight to Sister Maren at the temple. She knows a great deal about money and a great deal about sin, and you'd be surprised how often those two subjects overlap.",
], [
  ['sister', "Oh, I know these. Coins carved from bone. The Pale Choir minted them during the summoner wars to pay the men who dug up battlefields for them. I had rather hoped I would go to my own grave without ever holding one."],
  ['sister', "The Choir were the Gravelord's faithful. They sang over the battlefields while he raised the dead, and they believed every word of their own hymns. We were told they died out a hundred years ago. It seems that nobody told the Choir."],
]);
script('m6', [
  "If the Choir is singing again, they'll have a meeting place somewhere close enough to reach the graves and far enough from the Watch to feel safe. Our scouts have seen pale robes west of the Kingsroad, past the brigand camp, on the road toward Little Hollin.",
  "Break up that camp, and bring me anything they've written down. And be careful, {hero}. They'll call this a holy war, because that's what they always call it. Please don't let them turn it into one.",
], [
  "Their hymns keep coming back to one place: Little Hollin. They sing that the dead there have already stopped resting. Mayor Pell has been writing to me about ghosts for weeks, and I confess that I've been putting his letters in a drawer. Dobbin exaggerates everything, you see.",
  "Everything except this, apparently. I owe that man an apology, and you owe him a visit.",
]);
script('m7', [
  "Little Hollin is a farming village on the west road, about an hour's walk past the Choir camp you just broke up. It's a lovely little place in the spring, provided you like turnips.",
  "Find Mayor Pell and tell him the temple is finally taking his letters seriously. And bring a sturdy stomach, because Hollin's cooking is famous for all the wrong reasons.",
], [
  ['pell', "A visitor! An actual, living, breathing visitor! You've no idea how good it is to see someone who casts a shadow. Please excuse the ghosts. They aren't with the village, so to speak. Well, they are, technically, which is rather the problem."],
  ['pell', "Mayor Dobbin Pell, at your service, and at the service of anyone with a sword who's willing to point it in the right direction. Sister Maren sent you? Oh, bless her. I knew she'd read my letters eventually."],
]);
script('m8', [
  "There's a robed fellow who has taken up residence in our chapel yard. He calls himself Brother Ansel, and every night at midnight he rings the chapel bell. And every night, shortly after midnight, the graves start getting chatty.",
  "I went down and asked him very politely to leave. He hissed at me. I was married for thirty years, so I've been hissed at before, but this was a different sort of hiss entirely. Would you have a word with him? A firm word, ideally.",
], [
  ['ansel', "Enough! Please, that's enough, I yield! I'm not a fighter. I only rang the bell. They told me that if I rang it at the right hour, it would bring my brother home."],
  ['ansel', "It didn't bring him home. It brought home everybody else's brother instead, and their sisters, and at least three people's grandmothers. I've been too frightened to stop ringing it, because the Deacon would know."],
  ['ansel', "His name is Deacon Mortlake. He keeps a camp out in the Grey Waste, and he has the bodies carried north to the Ossuary. He says they're for the Gravelord. I don't know what that means, and I'm not sure I want to."],
], [
  { t: "You're going to the Watch, Ansel. They'll decide what happens to you.", reply: ['ansel', "That's fair. That's probably more than fair, if I'm honest. I'll go quietly. I've never done anything loudly in my life, really."] },
  { t: 'Go, and spend the rest of your life making this right.', reply: ['ansel', "I will. I swear I will. There's a hermit at the edge of the Waste who knows about the old rituals. I'll go to him and ask how to undo what I've done, and then I'll do whatever he tells me."] },
]);
script('m9', [
  "The Gravelord? Like in the old songs? The one who built the Ossuary out of his enemies? Oh dear. Oh, dear, dear, dear.",
  "You must tell Sister Maren straight away. I'll stay here and bolt all the doors, although I suspect the ghosts don't care very much about doors. Hurry back to {town}, and please keep to the road. The fields are no place to be after dark this week.",
], [
  ['sister', "The Gravelord. Every history I've ever read says he died at the end of the wars, when the four courts broke his armies at the Ossuary."],
  ['sister', "Then again, every one of those histories was written by people who never found his body. I've always found that detail a little uncomfortable."],
  ['sister', "There is one man still alive who fought him and who might know whether he truly died. His name is Corwin Ashlar, and he lives alone in a tower at the western edge of the Grey Waste. He hates visitors. You should go and see him anyway."],
]);
script('m10', [
  "Corwin Ashlar served in the last war against the necromancers. He was very young then, and he's very old now, and somewhere in between he became the grumpiest man in the Vale. I send him a jar of jam at every solstice, which is the only reason he still speaks to me.",
  "His tower stands at the western edge of the Waste, past the harpy crag. Be polite, be patient, and if he throws something at you, I'd advise ducking.",
], [
  ['corwin', "Go away. I don't buy anything, I don't join anything, and I'm not interested in hearing about any gods, new or old."],
  ['corwin', "You're still standing there. Maren sent you, didn't she? She sends me jam at the solstice and visitors whenever she wants something, and I've always preferred the jam."],
  ['corwin', "Fine. Come in, and wipe your feet first. I'm a hundred and twenty years old, so whatever you've come to say, I'd appreciate it if you said it before I die."],
]);
script('m11', [
  "Pale robes have been creeping around my tower for a month now. They seem to think I've forgotten what those robes mean, or that I'm too old to care. They are wrong on both counts.",
  "Clear them off my doorstep, and then we can talk about the Gravelord properly. I don't discuss the old days with the Choir listening at my windows.",
], [
  "That's better. I could actually hear the wind again for a moment, instead of that dreadful humming they call a hymn. Thank you.",
  "Sit down, then. No, not in that chair, it bites. Take the stool. We have a great deal to talk about, and very little of it is pleasant.",
]);
script('m12', [
  "If the Choir has a Deacon giving orders, then the Deacon is taking his orders from somebody. And if I know the Gravelord at all, those orders came in writing. He always did love a letter. Long ones, with footnotes, and postscripts on the postscripts.",
  "Mortlake's camp is out in the Grey Waste, east of the north road. Bring me whatever he's carrying, and I'll be able to tell you who wrote it.",
], [
  'Give it here, and let me look at it properly.',
  "Oh, that's his hand, all right. I'd know it anywhere. A hundred years have passed, and he still dots his i's with tiny little skulls. He always thought that was charming.",
  "He's alive, {hero}. Or he's as close to alive as his sort ever manage to be. Either way, he's awake, and he's been busy.",
]);
script('m13', [
  "There's something you ought to know before you go any further, and I would rather you heard it from me than from a ghost with a grudge.",
  "I know the Gravelord's rituals better than any man alive. That's why I live out here, in a tower in the middle of nowhere, where nobody can come and ask me about them.",
], [
  "So now you know the worst of me. I won't pretend it's a small thing, and I won't ask you to pretend either.",
  "What happens next is your decision. I've had a hundred years to decide what I think of myself. You've had about five minutes.",
], [
  { t: 'You left him and helped bring him down. That matters more than the rest.', reply: "Hmph. Maren raised you well, whoever you are. I won't forget that, and I won't waste it either." },
  { t: 'Sister Maren needs to know about this.', reply: "Go on, then, and tell her. She'll scowl at me, which she has always done beautifully. I suppose I've earned it." },
]);
script('q8', [
  "Whatever the Choir has been gathering, it ends up in the Ossuary. Corwin is certain of it, and after reading that letter, so am I.",
  "Clear the court and the great hall, and see for yourself what they've been building down there. Take a full group with you, {hero}. The Fourfold Law forbids what was done in that place, and somebody is doing it again.",
], [
  "The court and the hall are clear? Then only the crypt is left, along with whatever is waiting at the bottom of it. You've already done more than anyone could ask of you.",
  "I'm afraid I'm going to ask anyway.",
]);
script('q9', [
  "In the deepest part of the Ossuary's crypt waits something stitched together from the soldiers who fell in the war. They called it Grathul, and Corwin says the Gravelord made it with his own hands.",
  "It has to be destroyed before the Choir finishes whatever they've started. Take six of your best, and make certain that one of them is a healer you trust with your life, because you will be trusting them with exactly that.",
], [
  "You saw him? In the crypt, after the creature fell? His face, after a hundred years?",
  "Then the Fourfold Law has already been broken, and we've only just noticed. I need to sit down for a moment, {hero}. And then I need to think very hard about what comes next.",
]);
script('m16', [
  "He told you he has an ocean of the dead waiting for him. There's only one ocean near enough to matter, and that's the Saltreach, east along the Kingsroad past the end of the Vale.",
  "Go east, {hero}. Find Harbormaster Quell in Saltmarrow and tell the harbormaster everything. And take Wick with you, if he'll go. He's been packing his bags since the moment that creature fell.",
  ['wick', "I've packed a shovel. Well, three shovels. You never know what sort of digging the seaside needs, and I'd hate to be caught short."],
], [
  ['quell', "Another one from the Vale with a story about the dead walking around? You'll need to get in line, friend. I've had four of those this week, and one of them turned out to be a very pale fisherman."],
  ['quell', "Wait. You're telling me you killed the Stitched Thing? The real one, down in the Ossuary? Well, then you'd better come inside and tell me the whole story from the beginning."],
]);

// ======================= LITTLE HOLLIN =======================
script('h1', [
  "Most of our ghosts are perfectly harmless. Old Mrs. Gubbins, for example, spends every night rearranging my furniture, which is irritating but not technically dangerous. I've stopped putting the chairs back.",
  "The ones out in the fields are another matter. They're angry, and they're getting angrier. Would you thin them out a little? Gently, if you can manage it. They're still constituents, after all.",
], [
  "Wonderful! The fields are nearly quiet for the first time in weeks. I can finally hear myself think, which mostly means I can hear myself worrying, but it's a start.",
]);
script('h2', [
  "You there, with the face. Yes, you. Make yourself useful for a moment. I sew charm bags that keep the restless dead from climbing in through the windows, and half the village is waiting on me for a new one.",
  "I need spider silk to stitch them, and the big hairy brutes south of the village have plenty of it. Bring me six good strands. And don't come back with your hair full of spider eggs, because I'm not picking them out for you.",
], [
  "Good silk. It's strong and clean, and there isn't a single egg in it. I'm almost impressed with you. Almost. Don't let it go to your head.",
]);
script('h3', [
  "Haskett the miller passed away last spring, and nobody has quite had the heart to tell him. He's still up at the mill every night, turning the stones and grinding nothing at all.",
  "See if you can talk some sense into him, would you? I'd go myself, but he always tries to sell me flour. I'd also recommend bringing earplugs. Haskett talks a great deal, and death hasn't slowed him down one bit.",
], [
  ['haskett', "A customer! At long last, a customer! Flour's a copper a sack, or two coppers if you're dead. Ha! That's a little miller's joke. I'm dead, you see."],
  ['haskett', "Oh, don't look at me like that. I've known for months. I'm not daft. I just happen to like the work, and the stones don't care whether I've got a pulse."],
]);
script('h4', [
  "There's a boar out in the west fields, as big as a hay cart and as mean as a tax collector. The villagers call him Grumblesnout. He ate my prize turnips on the very day I died, and if I'm honest, he may well be the reason I died. The details are a little fuzzy.",
  "Bring me his tusk, would you? I think I'd rest a great deal easier knowing he'd been dealt with. Figuratively speaking, of course. I'm not ready to rest literally just yet.",
], [
  "That's the tusk! Oh, that's the very one, I'd know it anywhere. Look at it. Look at that horrible, turnip-stealing tusk. I feel lighter already, and I didn't think that was possible in my condition.",
]);
script('h5', [
  "I've been thinking, which is a dangerous habit for a miller. I suppose I can't keep turning these stones forever. Sister Maren has a rite that could send me on to wherever it is I'm supposed to be going.",
  "Or I could stay. I could keep the stones turning, keep the bread coming, and keep Hollin fed through the winter. I'm torn, friend, and I'd like your opinion before I decide.",
], [
  "So, what do you think? You've a good, sensible face for deciding things. I'll do whatever you say.",
], [
  { t: "You've earned your rest, Haskett. It's time.", reply: "Aye. Aye, you're right, and I think I knew it already. Tell Pell the mill is his now, and tell him to oil the north stone every Thursday. He never remembers." },
  { t: 'Hollin needs its miller. Stay as long as you like.', reply: "Ha! Then the bread's on me, friend, forever. And I do mean literally forever. Here, take a little something for the trouble." },
]);
script('h6', [
  "Three old bells stand around the edge of Hollin. Somebody rang them every evening at dusk for two hundred years, and the whole time, the dead stayed politely in their graves.",
  "Then the bell-ringer died, and nobody else wanted the job, because it involves a great deal of climbing. Go and ring all three. And I'd expect some company if I were you. The dead don't enjoy being reminded of their manners.",
], [
  "Do you hear that? That's the sound of the restless dead deciding they'd rather be somewhere else tonight. It's the best sound I've heard in a month.",
]);
script('h7', [
  "Brother Ansel's friends are still hanging about the chapel yard, and they're still singing. I use the word 'singing' very loosely.",
  "Please clear them out for me. I'd very much like my chapel back for weddings and funerals. Well, mostly funerals, lately, but I live in hope of a wedding.",
], [
  "Silence! Beautiful, holy silence. Apart from Mrs. Gubbins, who has apparently decided that the chapel pews would look better upside down. One battle at a time.",
]);
script('h8', [
  "The Choir sing out of little grey books, and I want some of them. Mostly I want to burn them, but I make a point of reading everything before I burn it.",
  "Bring me four of their hymnals. You'd be amazed what people scribble in the margins of their holy books when they think nobody will ever look.",
], [
  "Hmm. 'We sing so that they may rise.' Well, I've heard them sing, and it's far more likely to make the dead lie down and cover their ears. It sounds like a cat that has fallen down a well.",
  "Still, there's something in here about the Ossuary, and about a Deacon. I'll pass it along to the Sister. Here's a little something for your trouble.",
]);
script('h9', [
  "There's one more thing, and it's the big one. The man who leads all that dreadful singing is the Choirmaster, Venn, and he has set himself up at the old shrine east of the village.",
  "As long as he's out there, the song will keep starting again. Stop it for good, {hero}, and Hollin will owe you more than we can ever repay.",
], [
  "Quiet. Real, proper, honest-to-goodness quiet. Hollin owes you everything, {hero}. We'll name something after you. A pie, most likely. We name a great many things after pies here.",
]);

// ======================= BRANCHES =======================
script('b1', [
  "You came! I wasn't sure you would. Corwin has agreed to let me sweep his tower while he decides what to do with me. He says that sweeping builds character. I think mostly it builds dust.",
  "I know where the Choir hides its people, because I used to be one of them. If you'll help me break up their camps, I'll show you every one. I owe the Vale that much. I owe it a great deal more, really.",
], [
  "Thank you. Every one of them was somebody's brother once, the same as mine was. I'll try very hard to remember that, even when it would be easier to forget.",
]);
script('b2', [
  "Your Brother Ansel turned out to be quite talkative once we gave him a bowl of soup and a warm blanket. He named every brigand on the Kingsroad who'd taken the Choir's bone coin.",
  "I'd like you to go and collect on that list. Eight of them should send a clear message to the rest.",
], [
  "The Watch thanks you, officially and in writing, which is a very rare honor around here. I've even had it stamped.",
]);
script('b3', [
  "Since you've decided to trust me, I'll put that trust to work. Three ward stones stand in a circle around this tower. I raised them the year I left him, to keep his people away from my door.",
  "They've gone dark over the years. Touch each one, and they should wake up again. They know my hand, and it seems they'll know yours as well now. Please don't tell anyone that. I have a reputation.",
], [
  "There we are. That should keep the Choir off my doorstep for good. With any luck, it'll keep the tax collector away as well.",
]);
script('b4', [
  "His apprentice. Of course he was. I should have guessed years ago. Who else would know the old rituals so well, and who else would hide himself away so thoroughly?",
  "If Corwin kept a journal in those days, it will be somewhere at that tower. Find it and bring it to me. I need to know exactly what he did, and just as importantly, what he refused to do.",
], [
  "He held the lantern while the Gravelord worked. And then, the very next morning, he walked away and told the Four everything. He did that at seventeen, alone, in the middle of a war.",
  "Well. I suppose I'll scowl at him a little less from now on. Only a little, mind you. I wouldn't want him to think I'd gone soft.",
]);

// ======================= THE TOWER =======================
script('t1', [
  "Harpies have built their nests on the crag behind my tower, and they've developed a taste for my laundry. They steal my socks, but only the left ones. I now own forty right socks and not a single left.",
  "Persuade them to find somewhere else to live, would you? Somewhere very far away would be ideal, and permanently would be even better.",
], [
  'Peace and quiet at last. I may even hang my washing out again. Thank you, {hero}.',
]);
script('t2', [
  "The harpies have a matriarch, a great screeching brute called Shrieka, and she has stolen my telescope. Please don't ask me how she got it. It was a very embarrassing afternoon.",
  "Get it back for me. That telescope is the only way I can keep an eye on the Choir's camps from up here.",
], [
  "My telescope! And look at this, she's polished it. She's a horrible creature, but I have to admit she does a lovely polish.",
]);
script('t3', [
  "Out in the middle of the Waste walks a giant built out of other giants. During the war it guarded the Gravelord's door, and the soldiers called it Gristlebones, mostly because they couldn't think of anything worse.",
  "If it's walking around again, then the old wards are failing. Put it back down where it belongs, and I'll know we still have a little time.",
], [
  "Down again, and good riddance. It never did like stairs, you know. That's how we beat it the first time.",
]);

// ======================= SIDE QUESTS =======================
script('g1', [
  "Have you seen my good shovel? The wasps took it. I know how that sounds, believe me. But they're very organized wasps, and I think they wanted it for something.",
  "Their nests are out in the north fields. If you find her, please bring her back. She's the only shovel I've ever really understood.",
], [
  "My shovel! Oh, look at her. She's covered in honey. Honestly, she's never looked better in her life. Thank you.",
]);
script('g2', [
  "The headstones got knocked over when the graves... well, when they let themselves out. Could you set them upright again for me?",
  "I'd do it myself, but I hurt my back last week carrying all of these feelings around, and the doctor says I'm not to lift anything heavier than my spirits.",
], [
  'Thank you. They look so much more dead now. In a good way, I mean. A respectful way.',
]);
script('g3', [
  "The boars on the west road have grown as fat as barrels this year, and the whole Vale could do with a decent breakfast. Bring me six good haunches.",
  "I'll cure them over the winter fires, and come spring we'll all be a good deal happier. Especially me.",
], [
  'Now that is a haunch. That is a haunch with a future. Take this for your trouble, and come by in the spring for a slice.',
]);
script('g4', [
  "The bears on the Kingsroad have taken to sitting right in the middle of it, and the merchants refuse to go past them. I can't say I blame the merchants.",
  'Move them along, would you? Firmly. Six of them ought to get the message across to the rest.',
], [
  "The road's clear again. The merchants send their thanks, along with an invoice for the delay, which I shall be losing very carefully.",
]);
script('g5', [
  "Granny Wenlow isn't the only one in the Vale who wants spider silk. I line my best gloves with it, and the nobles in the capital pay a small fortune for a pair.",
  "Bring me eight good strands from the spiders out near Hollin, and I'll make it worth your while.",
], [
  "That's fine silk, that is. I'll make you a pair of gloves from it one day. Don't hold your breath. Actually, do hold it. I hear it's good for the lungs.",
]);
script('g6', [
  "Our temple lanterns burn ghost-light far better than they burn oil. Please don't ask me how I found that out. It involved a long night and a very surprised acolyte.",
  'Bring me six measures of ectoplasm from the restless spirits. It washes out of most fabrics, eventually.',
], [
  "Lovely. It's glowing, it's cold, and it's humming very slightly, which is exactly how I like it. The temple will be bright all winter.",
]);
script('g7', [
  "The Watch has posted a bounty on Pale Choir robes. Bring me ten of them, and the Watch will pay you properly, in coin that isn't made out of anybody's fingers.",
  "I wrote the poster myself. I'm quite proud of it. It has a drawing.",
], [
  "Ten robes. The laundry is going to be absolutely thrilled. Here's your bounty, and thank you.",
]);
script('g8', [
  "Harpy plumes fetch a fortune in the capital at the moment. It's something to do with hats. I don't pretend to understand hats, but I understand fortunes very well.",
  "Bring me eight plumes from the crag harpies near the hermit's tower. And mind the talons.",
], [
  "Gorgeous. Completely ridiculous, of course, but gorgeous. Somebody in the capital is going to look very silly, and I'm going to be very rich.",
]);
script('g9', [
  "The Grey Waste was the bloodiest battlefield of the whole war, and its dead are the angriest in the Vale. They were never properly laid to rest, and the Choir's singing has stirred them up.",
  "Give ten of them peace, by sword or by prayer. Mostly by sword, I suspect, but I'll say a prayer for each one when you're done.",
], [
  'May the Four keep them, and may the Four keep you as well. Thank you, {hero}.',
]);

// ======================= THE VALE'S FIRST QUESTS =======================
script('q1', [
  "Welcome to {town}. I'm Warden Ilse, and I keep the peace here, which is harder work than it sounds. You look like someone who can handle a blade, and that's exactly what I need this morning.",
  "The plains wolves have grown bold since the harvest. They're taking sheep within sight of the gate, and last night one of them chased the baker halfway up the main street. Thin them out for me. Eight should make the rest think twice.",
], [
  "Good work. The shepherds will sleep easier tonight, and so will the baker, who I'm told has finally stopped screaming. Come and see me again when you've got a little more experience.",
]);
script('q2', [
  "Bram's the name, and leather's the trade. Winter's coming on fast, and I have a whole town's worth of coats and boots to make before the first snow.",
  "Bring me six good pelts, wolf or bear, it doesn't matter which. Try not to put too many holes in them. Holes are fine in a cheese, but they're terrible for business in a coat.",
], [
  "Now these are fine pelts. Clean cuts, and hardly a hole between them. You've a gentle hand for somebody who swings a weapon for a living.",
]);
script('q3', [
  "Brigands have set up camps along the Kingsroad, and they're robbing anybody foolish enough to walk it alone. The merchants have stopped coming, and {town} can't live without its merchants.",
  "Take a group with you and break those camps. Ten of them should do it. And keep your eyes open, because these aren't ordinary thieves. Somebody is paying them.",
], [
  'That will give them something to think about. The Kingsroad is a little safer tonight, and I have you to thank for it.',
]);
script('q4', [
  "The brigands have a leader who likes to call himself a captain. {captain}, he calls himself. He keeps to the eastern camp, and he only shows his face when his men start falling around him.",
  "Thin out his crew until he comes out to see what's wrong, and then bring him down. That's how you catch a man like that: patiently. Bring me proof that he's finished.",
], [
  "So that's the end of {captain}. I can't say I'll miss him, and I doubt his crew will either. Well done.",
]);
script('q5', [
  "Orcs have come out of the southern wood, painted up for war. I'll sell to almost anyone, but even I can't sell to a warband. They don't pay, and they set fire to things.",
  "Their bonecallers keep the brutes on their feet with healing chants, so kill the callers first, or you'll be fighting the same orc all afternoon.",
], [
  "That's the warband broken, then. The wood will be a little quieter for a while. Take this, and thank you.",
]);
script('q6', [
  "The Grey Waste was necromancer country during the war. A hundred years later, the dead out there still refuse to lie down, and lately they've grown restless in a way that worries me.",
  'Put twelve of them to rest, {hero}, and say a word over each one if you can spare the breath.',
], [
  "Thank you. The Waste will never be truly at peace, but you've given it a little rest tonight.",
]);
script('q7', [
  "An old troll lives in the hollow at the far end of the southern wood. The orcs call him {tusk}, and they won't go anywhere near him, which tells you everything you need to know.",
  "He has killed every hunter I've ever sent after him. If you mean to try your luck, take a full group, and take a healer who doesn't panic.",
], [
  "You actually did it? {tusk}, finished at last? Well, I'll be. The hunters will be drinking to your name for a month.",
]);

// ======================= THE SALTREACH COAST =======================
script('c1', [
  "Welcome to Saltmarrow, the only port on this coast where nobody asks what's in your crates. I'm Harbormaster Quell, and I keep this place running, which mostly means I keep it from sinking.",
  "Right now the shore crabs are into the fish barrels again, and the fishmongers are threatening to strike. Clear out ten of them for me. Bring a stick, and watch your toes.",
], [
  "Ten fewer crabs, and the fishmongers have gone back to shouting at their customers instead of at me. That's what passes for peace on this quay. Thank you.",
]);
script('c2', [
  "Captain Redwake's corsairs have camps all along the shore, and they charge a toll to anyone who lands a boat. This is a free port, and free means free.",
  'Go and remind them of that. Twelve of his crew, or of the smugglers who pay his toll, should get the message across.',
], [
  "That'll teach them to tax my harbor. Redwake will be furious, which is the best news I've had all week.",
]);
script('c3', [
  "Captain Redwake only shows his face when his crew is getting thin. Camp the north camp, cut down his men until he comes out to see what's wrong, and then deal with him.",
  "Bring me his hat. It's a ridiculous hat, and I've wanted it for years.",
], [
  "That's the hat! Look at that feather. Saltmarrow is free again, and I now own the most ridiculous hat on the coast. Thank you, friend.",
]);
script('c4', [
  "You have an honest face. Don't worry, I won't hold it against you. I'm Madame Tessaly, and I deal in information, which is the only cargo that never spoils.",
  "The smugglers on Smuggler's Rock carry sealed crates with an odd mark on them. I want six of those crates. What's inside them is my business, but I'll tell you this much: it isn't rum.",
], [
  "Six crates, still sealed. You didn't peek, did you? No, I can see that you didn't. You're more trustworthy than you look, and you look very trustworthy indeed.",
]);
script('c5', [
  "Mother Brine runs the sea caves under the Rock, and she owes me a great deal of money. She has made it very clear that she has no intention of paying.",
  "Take a group into the caves and settle her account for me. Permanently, if it comes to that, and with Mother Brine it usually does.",
], [
  "So Mother Brine has finally settled her debts. I'll miss her, a little. She made the best smuggled brandy on the coast.",
]);
script('c6', [
  "Commodore Ashby, Halyard Marines. You'll be the adventurer from the Vale, I take it. Good. I'm short of marines and long on trouble.",
  'Merrow raiders come up the beaches of Halyard Isle with every tide. Drive them back into the sea. Ten of them should make the rest think twice about the next tide.',
], [
  "Well fought. The beaches are ours again, at least until the tide turns. You'd make a fine marine, if you ever grow tired of adventuring.",
]);
script('c7', [
  "Wild squalls have been loose on this coast since the war, when the elementalists bound them and then lost track of them. They've been wrecking our signal towers all season.",
  'Disperse eight of them. Fight them on the cliffs, and mind the lightning.',
], [
  'The towers are lit again for the first time in a month. The fleet can see us now, and we can see them. Good work.',
]);
script('c8', [
  "One of those squalls has grown old and clever up on the peak of Smuggler's Rock. The men call it the Tidecaller, because it calls the storms down on us.",
  "End it, and the rest will scatter. Take friends with you. It doesn't go down quietly.",
], [
  "The skies are clearing already. I never thought I'd see blue over the Rock again. The Halyard Marines owe you one.",
]);
script('c9', [
  "I'm Wenna. I mend the nets here in Gullwick, and every night lately I've watched the drowned crawl up out of the sea and onto our beach.",
  "I think my husband is among them. He went down with his boat three winters ago. Please put them to rest, all of them, and him along with them if he's there.",
], [
  "Thank you. I sat on the dunes and watched you, and I think I saw him go still at the end. I hope he's at peace now. I think he is.",
]);
script('c10', [
  "There's a crab living on the south beach who is older than I am, and I'm older than most of Gullwick. We call him Old Snapper. He's taken two of our boats this year, and he very nearly took a fisherman with the second one.",
  "Bring me his claw, and we'll hang it over the tavern door as a warning to the rest of them.",
], [
  "That's his claw, all right. It'll look very fine over the tavern door. The fishermen will be telling this story for years.",
]);
script('c11', [
  "Gullwick has had a lean season, and the children are getting thin. Five fins from the reef sharks would make enough soup to feed the whole village for a week.",
  'Mind your breath out there, and mind the sharks even more. They only come for swimmers, so stay out of deep water when you can.',
], [
  'Five fins! The whole village eats well tonight, and the children will remember the stranger who brought the soup. Thank you.',
]);
script('c12', [
  "The reef north-east of Halyard Isle is where the necromancers' war fleet went down at the end of the summoner wars. The drowned crews out there are still armed, and lately they've started walking.",
  "Clear twelve of them. Take a Bard if you can find one, because you'll be spending a lot of time underwater.",
], [
  "Twelve of them down, and you came back breathing. I'm starting to think you might be able to do the thing I've been dreading asking you to do.",
]);
script('c13', [
  "Admiral Morrow Vane drowned with his fleet a hundred years ago, and he did not stay dead. He holds the seabed beneath the reef inside a bubble of dark water, and his crew keeps growing.",
  "Dive at the buoy with a full group of six. This will be the hardest fight of your life so far, so take your best friends and your best gear.",
], [
  "The Admiral is gone. I didn't let myself believe it was possible until I saw you come back up. The whole coast owes you a debt.",
]);
script('c14', [
  "When the Admiral fell, something answered him from the deep. Something enormous. The Fourfold Law has a clause for nearly everything, but it doesn't have one for that.",
  'Go back down and kill it, before it decides to come up here and introduce itself.',
], [
  "It's dead. The thing from the deep is really dead. I'm going to propose a new clause for the Fourfold Law, and I'm going to name it after you.",
]);
// the class quests share one script, written for each class
for (const q of QUESTS) {
  const m = /^cq([12])_(\w+)$/.exec(q.id); if (!m) continue;
  const cn = q.name.split(':')[0];
  if (m[1] === '1') {
    const item = q.obj.item + 's';
    script(q.id, [
      `So you'd like a signature weapon of your own, would you? Every ${cn} who has ever earned one started in exactly the same place you're standing now.`,
      `Bring me six ${item}, taken from the coast with your own hands. Not bought, not borrowed, and certainly not stolen from another ${cn}. I'll know if they were.`,
    ], [`Six ${item}, and every one of them honestly earned. You've proven you're serious. Come back when you're ready for the real test.`]);
  } else {
    script(q.id, [
      `There's a rogue ${cn} on the beach below Smuggler's Rock who has been selling our training secrets to the pirates. It's a disgrace to everyone who has ever earned the title.`,
      "Beat them in a fair fight. Or an unfair one, frankly. I'm not fussy, as long as they stop.",
    ], [`It's done, then. Here is your signature weapon, made for a ${cn} who has truly earned it. Carry it well.`]);
  }
}

// ======================= WHAT PEOPLE SAY WHEN YOU JUST TALK =======================
// greet: one of these opens the conversation. topics: things you can ask (after: only once that quest is turned in).
// decline: what they say if you turn down a quest. bio: what you learn when you inspect them.
export const TALK = {
  warden: {
    bio: "Warden Ilse has kept the peace in {town} for eleven years. She is fair, tireless and short on patience, and she has never quite forgiven Wick Tallow for burying the wrong cat.",
    greet: ["Good morning, {hero}. Keep your blade clean and your nose cleaner.", "Back again? Good. The Vale needs more people like you and fewer like the ones I usually arrest."],
    decline: "Suit yourself. The job will still be here tomorrow, and so, unfortunately, will the problem.",
    topics: [
      { q: 'Tell me about yourself.', a: ["There isn't much to tell. I joined the Watch at sixteen because I was tired of watching other people make a mess of things. Eleven years later, I'm in charge of cleaning up all of their messes, which I suppose serves me right."] },
      { q: "What's the news in {town}?", a: ["Wolves at the gate, brigands on the road, and now graves that won't stay shut. On a quiet week, we only get two of those at once."] },
      { q: 'What do you think of Wick?', after: 'm3', a: ["He's a good lad, really, under all the nerves. I'd never tell him so, of course. It would go straight to his head, and there's barely room in there as it is."] },
    ],
  },
  tanner: {
    bio: "Bram the Tanner has worked leather in {town} since before most of the Watch was born. He sells to anyone who pays, talks to anyone who listens, and keeps his opinions about orcs, wolves and hats for his paying customers.",
    greet: ['Hides, leathers, and the occasional opinion. What can I do for you today?', "Mind the drying racks, friend. Those hides are worth more than my house."],
    decline: "No harm done. I'll find somebody else, or I'll go myself and complain about it the whole way.",
    topics: [
      { q: "How's business?", a: ["Business is like the weather. It's always terrible, and yet somehow there's always more of it. The orcs have been bad for trade and the brigands have been worse, but people still need boots."] },
      { q: 'What do you know about the southern wood?', a: ["The wood belongs to the orcs these days, and the hollow at the far end belongs to {tusk}. The orcs are dangerous. {tusk} is something else entirely. I've lost good hunters in that hollow."] },
    ],
  },
  sister: {
    bio: 'Sister Maren keeps the temple of the Four and the letter of the Fourfold Law. She is kind, sharp-eyed and very hard to fool, and she sends a jar of jam to a certain grumpy hermit every solstice without fail.',
    greet: ['The Four keep you, {hero}. Come in out of the wind.', "Welcome back. Sit down for a moment if you need to. You look as though you've been carrying the whole Vale on your shoulders."],
    decline: "Of course. Nobody can carry everything at once, and I would never ask you to. Come back when you're ready.",
    topics: [
      { q: 'What is the Fourfold Law?', a: ["It's the treaty that ended the summoner wars. The dead stay dead. No summoner may bind more than four creatures. The war ruins stay sealed. And whatever was bound in war is set free in peace.", "Eight kings signed it, and four summoners witnessed it. It has kept the peace for a hundred years, and I would very much like it to keep the peace for a hundred more."] },
      { q: 'Who are the Four?', a: ["The Four were the summoners who ended the war: a necromancer, a druid, an elementalist, and one who could bind all three schools at once. They broke their own armies and signed the Law, and the temples have honored them ever since.", "People pray to them now, which I suspect would have embarrassed them terribly. By all accounts, they were stubborn, brave and frightened people, much like the rest of us."] },
      { q: 'What do you know about the Gravelord?', after: 'm9', a: ["He was the greatest necromancer of the war, and the cruelest. He built the Ossuary out of the bones of his enemies and called it a temple. Every history says he died when the Four broke his army there.", "I'm beginning to suspect the histories were written by optimists."] },
    ],
  },
  wick: {
    bio: "Wick Tallow is {town}'s gravedigger, a nervous young man with three lanterns, two shovels and the best intentions in the Vale. He's far braver than he thinks he is, which is lucky, because he doesn't think he's brave at all.",
    greet: ["Oh, it's you! Thank goodness. I thought you were another one of the... well, never mind what I thought.", "Hello again! I've moved my bed into the tool shed so I can keep an eye on the graves. It's very cozy, apart from the rakes."],
    decline: "Oh. That's all right. Really, it is. I'll just stand here and keep an eye on things. Nervously.",
    topics: [
      { q: 'How did you become a gravedigger?', a: ["My Uncle Bartholomew was the gravedigger before me, and his father before him. I wanted to be a baker, really, but you can't argue with family tradition, especially when the family is buried right there and listening."] },
      { q: 'Are you all right, Wick?', a: ["I'm fine! Absolutely fine. I've only screamed twice today, and one of those was at a squirrel, so it hardly counts."] },
      { q: 'Are you ready for the coast?', after: 'q9', a: ["I've never seen the sea. People say it's enormous and full of fish and very, very wet. I've packed three shovels, a spare lantern and a hat that I'm told is nautical. I'm as ready as I'll ever be, which isn't very."] },
    ],
  },
  pell: {
    bio: 'Mayor Dobbin Pell has led Little Hollin for twenty-two years, mostly by saying yes to everything. He is warm, talkative and hopelessly optimistic, and he writes the longest letters in the Vale.',
    greet: ['A visitor! Always a pleasure, always a pleasure. Mind Mrs. Gubbins, she\'s in the parlor again.', "Ah, {hero}! Hollin's favorite hero. Well, our only hero, but our favorite all the same."],
    decline: "Not to worry, not to worry! There's no rush. Well, there's a little rush. But it can wait. Probably.",
    topics: [
      { q: 'Tell me about Little Hollin.', a: ["We're forty-two people, two hundred sheep and the best turnips in the Vale. Well, they were the best turnips, until a certain boar developed a taste for them. We're a quiet village, usually. I'd love for you to see it when it's quiet."] },
      { q: 'Who is Mrs. Gubbins?', a: ["She was our schoolteacher for fifty years, and she was very particular about where the furniture went. She still is, apparently. I've stopped arguing with her. I never won when she was alive, either."] },
    ],
  },
  wenlow: {
    bio: "Granny Wenlow is Little Hollin's herbalist, midwife and resident terror. Nobody knows how old she is, and nobody has ever been brave enough to ask. Her charm bags actually work, which is more than can be said for most charm bags.",
    greet: ['Hmph. Wipe your boots before you come in.', 'Back again? Did you bring me something useful, or just your face?'],
    decline: "Hmph. I'll do it myself, then, the way I always end up doing everything.",
    topics: [
      { q: 'Do your charm bags really work?', a: ["Of course they work. Sage, salt, spider silk and a little bit of the right kind of stubbornness. The dead are like cats, you see. They go wherever they're least welcome, unless you make it very clear that you mean it."] },
      { q: 'How long have you lived in Hollin?', a: ["Long enough to remember when Dobbin Pell was a baby, and a very loud one he was, too. That's all you're getting, so you can stop counting on your fingers."] },
    ],
  },
  haskett: {
    bio: "Haskett the Miller died last spring and has carried on working ever since. He is cheerful, chatty and entirely see-through, and his flour, while technically made of cold air, is said to make an excellent ghost loaf.",
    greet: ["Flour! Fresh flour! Well, ghost flour. It's mostly cold air, but it's very good cold air.", "Hello, friend! Mind the stones, they're still turning. Everything here is still turning, really, apart from my heart."],
    decline: "Ah well, no hurry. I've got all the time in the world now. Literally all of it.",
    topics: [
      { q: "What's it like, being a ghost?", a: ["Honestly? It's a lot like being alive, only cooler and with fewer meals. I never get tired, I never get hungry, and nobody stands too close to me in the queue. There are worse ways to spend an afterlife."] },
      { q: 'What happened to you?', a: ["It was a Tuesday. I went out to chase that wretched boar away from my turnips, and then everything went sort of misty. When I came round, I was see-through and the turnips were gone. I've made my peace with the first part. I'm still upset about the turnips."] },
    ],
  },
  ansel: {
    bio: "Brother Ansel was a junior member of the Pale Choir until the day he met you. He joined because he wanted his brother back. He's learning, slowly and painfully, that the dead have every right to stay where they are.",
    greet: ['I\'m trying to be better. Corwin says trying is the first step. The second step, apparently, is sweeping.', "Hello again. I've nearly finished sweeping the tower stairs. There are four hundred and twelve of them. I've counted, several times."],
    decline: "I understand. I'll keep sweeping. There's always more sweeping.",
    topics: [
      { q: 'Why did you join the Choir?', a: ["My brother Tobin drowned in the millpond when we were boys. The Choir told me that if I sang the right hymns and rang the right bell, he'd come home. I wanted that so badly that I never once asked what the bell would cost anybody else."] },
      { q: 'What will you do now?', a: ["Whatever I'm asked to do, for as long as it takes. And I'm going to visit Tobin's grave. I've never been, you know. I couldn't bear to stand there and admit that he wasn't coming back."] },
    ],
  },
  corwin: {
    bio: "Corwin Ashlar fought in the last war against the necromancers, and he has spent the hundred years since then avoiding anyone who might ask him about it. He is grumpy, brilliant and very old, and he owns forty right socks.",
    greet: ["Close the door behind you. Were you born in a barn? Actually, don't answer that. I've seen the Vale.", "Hmph. It's you again. Well, sit down, then. Not in the biting chair."],
    decline: "Fine. I've waited a hundred years. I can wait until you've stopped dawdling.",
    topics: [
      { q: 'How are you a hundred and twenty years old?', a: ["Spite, mostly, and a little bit of old magic that I'd rather not discuss. When you've seen what I've seen, you develop a very strong desire to outlive the people responsible."] },
      { q: 'What was the war like?', a: ["Loud. It was very, very loud. People imagine the summoner wars as great armies of beasts and storms and the dead, all marching under banners. Mostly I remember the noise and the smell, and how young everybody was."] },
      { q: 'Tell me about the Gravelord.', after: 'm12', a: ["He was the most brilliant man I ever met, and he knew it. He could talk to the dead the way you and I talk to each other, and he honestly believed he was doing them a kindness when he raised them.", "That's the most dangerous kind of villain, {hero}. The kind who believes he's the hero of the story."] },
    ],
  },
  banker: { bio: "Teller Mott runs the bank in {town} and keeps a branch in Saltmarrow as well. He remembers every coin he has ever counted, and every customer who ever tried to short him. Your vault is shared by every class you play.", greet: [], topics: [] },
  quell: {
    bio: "Harbormaster Quell runs Saltmarrow's harbor with a loud voice, a long memory and a ledger that nobody else is allowed to touch. The port is free, and Quell intends to keep it that way.",
    greet: ["Welcome to Saltmarrow. Mind the ropes, and don't feed the gulls. They've started to organize.", 'Ah, our hero from the Vale. What can the harbor do for you today?'],
    decline: "Fair enough. The harbor will still be here, and so will the crabs, unfortunately.",
    topics: [
      { q: "What's Saltmarrow like?", a: ["It's the only free port on the Saltreach, which means anybody can land here, sell anything and leave without answering questions. It also means we get every scoundrel on the coast. On balance, I wouldn't live anywhere else."] },
      { q: 'How do I get around the islands?', a: ["The ferry calls at every dock on a schedule: Saltmarrow, Fort Halyard, Smuggler's Rock and Gullwick, round and round. If you can't wait, rent a rowboat at any dock for two gold. And if you're feeling brave you can swim, but mind your breath and mind the sharks."] },
    ],
  },
  tessaly: {
    bio: "Madame Tessaly deals in information on the Saltreach Coast, and occasionally in things that are harder to explain. She is always smiling, which is usually the first warning sign.",
    greet: ["You again. I was hoping you'd come by. I've been hearing such interesting things about you.", "Lovely weather for secrets, isn't it?"],
    decline: "No? How mysterious of you. I'll write that down.",
    topics: [{ q: 'What exactly do you do?', a: ["I buy what people know, and I sell it to people who would like to know it. It's a very old trade, and a perfectly honest one, if you look at it from the right angle and squint."] }],
  },
  steward: {
    bio: "Guild Steward Orne keeps the class halls on the coast and decides who has earned a signature weapon. Orne has very high standards and is never shy about mentioning them.",
    greet: ['Welcome to the guild hall. Wipe your boots, and mind the trophies.'],
    decline: "Come back when you're ready, then. The guild has waited for heroes before.",
    topics: [{ q: 'What is a signature weapon?', a: ["It's a weapon made for one class and one hero, earned rather than bought. Prove yourself on the coast, beat the rival who has been shaming your class, and I'll see to it that you get one."] }],
  },
  ashby: {
    bio: 'Commodore Ashby commands the Halyard Marines from Fort Halyard. Ashby is tireless, blunt and permanently short of marines, and is very glad you came.',
    greet: ['Stand easy. What do you need?', 'Good to see you, adventurer. The fort is always glad of an extra sword.'],
    decline: "Understood. I'll put it back on the duty roster.",
    topics: [{ q: 'Tell me about the drowned fleet.', a: ["A hundred years ago, the necromancers' war fleet sank off the reef north-east of here, with every soul aboard. The sea kept them, the way the sea keeps everything. Lately, it has started giving them back."] }],
  },
  wenna: {
    bio: "Old Wenna mends the nets in Gullwick and has buried more fishermen than she can count. She is quiet, practical and much kinder than she lets anyone see.",
    greet: ["Mind the nets, love. They're the only thing in Gullwick that doesn't leak.", "Back again? Sit a while. The sea's calm today, for once."],
    decline: "That's all right, love. The sea isn't going anywhere.",
    topics: [{ q: 'Tell me about Gullwick.', a: ["We're a fishing village, which means we're poor, wet and proud of it. The sea gives us everything we have, and every so often it takes something back. Lately, it has been taking more than it gives."] }],
  },
};
// ambient villagers
export const VILLAGER_LINES = {
  'Mrs. Gubbins': "Young person, that chair does not belong there, and neither do you. Sit up straight.",
  'Hollin Villager': ['Mind how you go. The ghosts are worse after dark.', "Have you met the Mayor? He'll talk your ear off, but he means well.", "Turnips? No, we haven't got any turnips. Don't ask about the turnips."],
};

// ======================= SCENES AND LORE, IN FULL SENTENCES =======================
const scene = (id, lines) => SCENES[id].forEach((s, i) => { if (lines[i]) s.text = lines[i]; });
scene('intro', [
  'A hundred years ago, the summoners went to war. Necromancers raised the dead, druids called up the beasts of the wild, and elementalists bound fire and storm, until eight kingdoms burned around them.',
  'The war ended with the Fourfold Law. The dead would stay dead, no summoner would ever bind more than four creatures again, and the old war ruins would be sealed forever. For a hundred years, the Law has held.',
  'Then, in the quiet farming town of {town}, the graves began to empty.',
  "Hello? Is somebody there? Please be alive. Please, please be alive. It's been a very long night.",
]);
scene('drag', [
  'The drag marks run on through the long grass, north and then further north, as straight as if someone had drawn them with a ruler.',
  'They lead toward the Ossuary, the great bone temple where the necromancers kept their dead during the war, and where nobody in the Vale has dared to go for a hundred years.',
]);
scene('hollin', [
  'Little Hollin is a village of forty-two people, two hundred sheep and a great many turnips. Lately it has gained a few residents who have stopped bothering to count.',
  "Visitors! Living ones, too! Oh, this is a red-letter day. Don't mind the ghost by the well, he's perfectly harmless. The one by the fence isn't, though, so I'd avoid eye contact if I were you.",
]);
scene('apprentice', [
  'I was seventeen years old when I went to work for him. He was the most brilliant man I had ever met, and when he asked me to hold the lantern while he stitched the dead together, I held it.',
  'I was the Gravelord\'s apprentice, {hero}. And when I finally found the courage to leave him, I was the one who told the Four how to kill him.',
  'Clearly, I told them wrong.',
]);
scene('gravelord', [
  'As the Stitched Thing collapses, the air in the crypt turns bitterly cold. Above the altar, something green and patient begins to gather itself into the shape of a man.',
  "Oh, well done. Truly, I mean it. Grathul took me eleven years to stitch together, and you've unpicked him in a single afternoon. I'd be furious if I weren't so impressed.",
  'Keep the bones, little Vale. Keep your precious Law. I have an entire ocean of the dead waiting for me out there, and they are so very, very patient.',
  "Oh, and do give Corwin my regards. Tell him I've kept his room exactly the way he left it.",
]);
const lore = (id, text) => { if (LORE[id]) LORE[id].text = text; };
lore('law', 'The Fourfold Law was set down at the end of the summoner wars by the necromancer, druid and elementalist courts, together with the eight kingdoms that survived them. Its four articles are simple. The dead shall stay dead. No summoner shall bind more than four creatures. The war ruins shall remain sealed. Whatever was bound in war shall be set free in peace. Eight kings signed it, and four summoners witnessed it. As of last Tuesday, somebody has broken it.');
lore('ledger', "Monday: I dug two graves today. Tuesday: I filled both of them in again, as is traditional. Wednesday: I found Mother Abernathy's plot open, so I filled it back in. Thursday: it was open again, so I filled it in again and said a few stern words to it. Friday: it was open again, and this time there were footprints coming out. I have bought a second lantern. Saturday: I have bought a third lantern.");
lore('drag', "This scrap of grey wool was caught on a thornbush where the drag marks bend toward the north. It is embroidered with four notes of music, with a small skull stitched in where the fifth note ought to be. Along the hem, in tiny and careful stitches, someone has written: 'We sing so that they may rise.'");
lore('hymn', "Rise, O sleepers, rise and sing, for the Lord of Graves is coming in. No law of four shall hold the tide; the dead are many, the dead are wide. Beneath the verse, in a different and much less patient hand, somebody has added a note: 'This rhymes worse every single time we sing it.'");
lore('register', 'Births this year: two. Deaths this year: three. Deaths that did not entirely take: forty-one. Brother Ansel has asked whether he might borrow the chapel bell for a small ceremony. Mayor Pell has said yes, because Mayor Pell says yes to everything.');
lore('flour', 'Sold twelve sacks of flour this week. Dobbin Pell owes me four coppers, again. Note to self: the boar is back. Note to self: do something about the boar. Note to self: THE BOAR. The rest of the page is covered in flour and what appear to be very large hoofprints.');
lore('journal', 'Spring, during the ninth siege. Tonight the master raised the Abomination. He stitched it together from the men who held the north wall, and he called it beautiful, and he asked me to hold the lantern while he worked. I held it. I think I will be holding that lantern in my sleep for the rest of my life. Tomorrow I am going to the Four, and I am going to tell them everything. Tomorrow I will be nobody\'s apprentice.');
lore('letter', "My dear Deacon, the Vale is a pantry rather than a feast, so take only what you need for the Stitched One and send everything else east to the coast. The Saltreach holds three entire fleets of the war dead, and the sea has kept them wonderfully fresh. Please don't trouble yourself about old Corwin. I have kept his room. P.S. Do tell the Choir to practice. I could hear them from a hundred miles away, and it was not the good kind of haunting.");
lore('dedication', 'THIS HOUSE OF BONE IS RAISED TO THE GLORY OF THE GRAVE AND OF ITS LORD, WHO DOES NOT DIE. The last three words were chiseled away long ago, and beneath them somebody has carved a single word much more recently: WRONG.');
lore('soldier', "Dearest Mags, they're saying the necromancers are beaten and we'll all be going home within the week. If I don't make it, please don't let them bury me out here in the Waste. The ground here doesn't keep what you put in it. Give the baby a kiss from me, and tell her all about the sea. Your Tom.");
lore('warchant', "TUSK IS STRONG. TUSK IS OLD. TUSK REMEMBERS WHEN THE BONE MAN CAME AND ALL THE TREES DIED. TUSK DOES NOT GO NORTH. In the margin, Bram the Tanner has written: 'Smart troll.'");
lore('bounty', 'WANTED by the Watch of {town}: the brigand who calls himself {captain}, for robbery, arson and the sale of forged royal pardons. If you are the man on this poster, please be advised that the pardons do not work. We checked.');

// ======================= INSPECTING ENEMIES =======================
export const MOB_LORE = {
  wolf: 'A lean plains wolf, grown bold on stolen sheep since the harvest.', wasp: 'An oversized field wasp. The nests in the north fields are said to be very well organized.',
  bear: 'A big brown bear that has discovered that merchants carry food.', bandit: 'A Kingsroad brigand who will steal anything that is not nailed down.', bandit2: 'A seasoned brigand cutthroat, better armed than most of the Watch.',
  xbow: 'A brigand crossbowman who prefers to fight from a safe distance.', brute: 'A painted orc brute of the Tusk warband.', shaman: 'An orc bonecaller who keeps the brutes on their feet with healing chants. Kill these first.',
  troll: 'An ancient troll, the terror of the southern wood.', skeleton: 'The bones of a soldier from the summoner wars, still marching a hundred years later.', ghoul: 'A hungry ghoul from the Grey Waste.',
  wraith: 'A wraith, one of the restless dead of the old battlefields.', abom: 'Grathul, the Stitched Thing, sewn together by the Gravelord from the soldiers who held the north wall.',
  cultist: 'An initiate of the Pale Choir, the Gravelord\'s faithful. Initiates fight up close and flee when they are losing.', chanter: 'A chanter of the Pale Choir. Chanters cast from range and heal their friends, so silence them first.',
  ghost: 'A restless spirit that has stopped staying in its grave. Holy magic hurts it most.', boar: 'A bristleback boar from the west road, as fat as a barrel and twice as stubborn.',
  spider: 'A Hollin webspinner, a big hairy spider whose silk is prized by tanners and herbalists alike.', harpy: 'A crag harpy. They nest on the rocks behind Corwin\'s tower and steal his socks.',
  ansel: 'Brother Ansel, a nervous young member of the Pale Choir. He does not look like much of a fighter.', grumble: 'Grumblesnout, the enormous boar who ate Haskett\'s prize turnips.',
  choirmaster: 'Choirmaster Venn, who leads the Pale Choir\'s dreadful singing.', deacon: 'Deacon Mortlake, who takes his orders from the Gravelord himself.',
  shrieka: 'Shrieka, the matriarch of the crag harpies, and the current owner of Corwin\'s telescope.', gristle: 'Gristlebones, a giant built from other giants, who once guarded the Gravelord\'s door.',
  pirate: "One of Captain Redwake's corsairs, who tax anyone landing on the coast.", smuggler: "A smuggler from Smuggler's Rock, carrying sealed crates that are not full of rum.",
  crab: 'A shore crab with a taste for fish barrels and toes.', crabbig: 'A crab so old that the villagers have given it a name.', shark: 'A reef shark. It only hunts swimmers, so stay out of deep water.',
  merfolk: 'A merrow raider who comes up the beaches with the tide.', stormelem: 'A wild squall, bound by the elementalists during the war and never released.',
  drowned: 'A drowned sailor of the necromancers\' war fleet, still armed after a hundred years under the sea.', drownedcaster: 'A drowned fleet mage, still casting.', drownedpriest: 'A drowned chaplain of the war fleet, who heals the dead around it.',
  queen: 'Mother Brine, the smuggler queen of the sea caves.', bosun: 'Bosun Graft, who keeps the drowned crew in line with a boarding hook.', admiral: 'Admiral Morrow Vane, a drowned summoner who would not stay dead.',
  leviathan: 'Something enormous that answered the Admiral from the deep.', rival: 'A rogue of your own class who has been selling your guild\'s secrets to pirates.',
};
