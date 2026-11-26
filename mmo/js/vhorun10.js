// Build 10: the chase for the door. Under the Last Lamp is a door with three locks, and the three keys were
// given long ago to three keepers: the Compact of the deep, the kings of Kaldmark, and the crown of Corrand.
// Find them, open the door, and go through: the raid Beneath the Last Lamp ends with a piece of Vhorun himself.
import { S, X, chat } from './core.js';
import { QUESTS, MOBS } from './data.js';
import { TALK, MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { world, zoneMarker } from './world.js';
import { INSTANCES } from './dungeons.js';
import { defineDungeon } from './kit9.js';
import { rboss, U, HU, B, finishQuests, raidWhy25, addRaid, tier } from './hi9.js';
import * as Loot5 from './loot5.js';

const KEYS = { vk2: 'Key of Night', vk3: 'Key of Rime', vk4: 'Key of Ash' };
const haveKeys = () => ['vk2', 'vk3', 'vk4'].every(id => S.quests[id]?.state === 'turned');
// ---------- the raid ----------
Object.assign(MOBS, {
  lockwarden: rboss('The Lockwarden', 'golempet', { hpM: 2.2, weak: 'storm', resist: 'earth', mechs: ['slam', 'shield', 'knock'], lines: { start: '*Three locks, three keys, and something made of iron that remembers all of them. It turns to face you.*', half: '*The locks on its chest begin to spin.*' } }),
  unlitchoir: rboss('The Unlit Choir', 'wraith', { hpM: 2.3, ...U, fly: .4, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['fear', 'volley', 'pool', 'heal'], lines: { start: 'We sang for the lamp-lighters who built this door. Then they shut us in with it.', half: 'Sing them dark!' } }),
  lightmoth: rboss('The Moth-Queen of the Last Light', 'wasp', { hpM: 2.4, ...B, scale: 4, fly: 1.4, weak: 'fire', mechs: ['pool', 'spawn', 'fear'], adds: 'cavebat', lines: { start: '*Something vast and pale has been circling the light below the Lamp for a thousand years. It has noticed yours.*', half: '*Her brood fills the air.*' } }),
  gravelordecho: rboss('The Echo of the Gravelord', 'gravelord', { hpM: 2.4, ...U, scale: 2.2, range: 18, ranged: true, caster: true, school: 'shadow', mechs: ['pool', 'call', 'fear', 'enrage'], adds: 'bonewarden', lines: { start: 'You killed me once. Down here, so close to Him, nothing stays dead for long.', half: 'Rise! He is watching!' } }),
  handofvhorun: rboss('The Hand of Vhorun', 'abom', { hpM: 2.8, ...U, scale: 3.6, weak: 'holy', resist: 'shadow', mechs: ['slam', 'pool', 'fear', 'spawn', 'knock', 'enrage'], adds: 'starless', lines: { start: 'SMALL THINGS. YOU OPENED MY DOOR. THAT WAS KIND OF YOU. I HAVE BEEN SO HUNGRY.', half: 'I AM VHORUN. I WAS HERE BEFORE YOUR STARS. I WILL BE HERE AFTER THEM.' } }),
});
Object.assign(MOB_LORE, { handofvhorun: 'One hand of Vhorun, the One Beneath, reaching through the door below the Last Lamp. The rest of him is still on the other side. For now.', gravelordecho: 'An echo of the Gravelord, kept by the dark below the Lamp.' });
defineDungeon({ key: 'door', name: 'Beneath the Last Lamp', parent: 'deep', plan: 'nave', floor: '#1e1a14', rock: '#050403', fog: '#040302', light: .4, lvl: [25, 25], prop: 'lantern', raid: true,
  mobs: ['starless', 'echo', 'hollowknight', 'crystalgolem', 'hollowpriest'], bosses: ['lockwarden', 'unlitchoir', 'lightmoth', 'gravelordecho', 'handofvhorun'], exitLabel: 'Climb back up to the Last Lamp' });
addRaid('door', 'Beneath the Last Lamp');
INSTANCES.door.out = { x: 60, z: -300 };
X.gate.door = () => raidWhy25() || (haveKeys() ? null : 'The door below the Lamp has three locks. You don\'t have the keys.');
tier({ door: 9 });
// the door itself, below Deepwatch
X.zone.push(zone => {
  if (zone !== 'deep') return;
  const x = 60, z = -310;
  world.zoneLines.push({ x, z, r: 4, to: 'door', label: 'Open the door below the Last Lamp (12-person raid)' }); zoneMarker(x, z, 0);
  world.places.push({ name: 'The Door Below the Lamp', x, z, R: 10, kind: 'dungeon' }); world.spots.lampdoor = { x, z };
});
// what the Hand leaves behind
Object.assign(Loot5.COLLECT, { title_doorkeeper: { type: 'title', name: 'Doorkeeper', from: 'door' }, mount_lampbearer: { type: 'mount', name: "Lampbearer's Steed", kind: 'horse_ghost', spd: .95, ride: 1, from: 'door' }, trophy_hand: { type: 'trophy', name: 'A Finger of Vhorun', desc: 'It is still warm. Sometimes it twitches toward the dark.', from: 'door' } });
X.kill.push(m => {
  if (m.mob !== 'handofvhorun') return;
  for (const k of ['title_doorkeeper', 'trophy_hand']) if (!Loot5.owned(k)) Loot5.collect(k);
  if (!Loot5.owned('mount_lampbearer') && Math.random() < .3) Loot5.collect('mount_lampbearer');
  chat('say', 'Vhorun', 'YOU HAVE CUT OFF MY HAND. I HAVE OTHERS. AND I HAVE TIME, SMALL THINGS. I HAVE ALL OF IT.');
  setTimeout(() => chat('sys', null, 'The door below the Lamp groans shut. Somewhere far above, the Last Lamp burns a little brighter.'), 2500);
});

// ---------- lore ----------
Object.assign(LORE, {
  threelocks: { title: 'The Three Locks', where: 'deepwatch', text: "Scratched into the back of the Last Lamp's mount, in the old tongue: 'Three keys for the door below: Night to the keepers of the Lamp, Rime to the kings of the north, Ash to the crown of the east. Let no one hold all three. Let no one ever need to.'" },
  vhorunspeaks: { title: 'What the Hand Said', where: 'door', text: "Written by Lamp-Warden Mira Holt, after the door was shut again: 'It spoke in every voice I've ever loved. It said it was here before the stars. I believe it. It said it would be here after them. I am trying very hard not to believe that.'" },
});

// ---------- the chase ----------
const D = { zone: 'deep' };
QUESTS.push(...finishQuests([
  { id: 'vk1', story: true, giver: 'sorrel', turnTo: 'mira', lvl: 25, pre: 'dd8', name: 'Three Locks', where: 'deepwatch', ...D, rep: { lantern: 400 }, obj: { talk: true, what: 'Tell Lamp-Warden Mira what Sorrel found under the Last Lamp' },
    say: ["The Herald is gone, friend, and the door is shut. But I took the Lamp down to clean it this morning, first time in sixty years, and there's writing on the back of its mount. Three locks, it says, and three keys.", "Night, Rime and Ash. The keepers of the Lamp, the kings of the north, and the crown of the east. If the Hollowborn knew that, they'd be hunting the keys right now. Somebody had better hunt them first. Tell Mira."],
    done: [['mira', "Three keys. Of course there are three keys. There are always three of something."], ['mira', "If the door can be opened from this side, then we can go through it before Vhorun's servants do, and cut off whatever is reaching for the Lamp. I can't believe I'm saying this. Let's open the door."]] },
  { id: 'vk2', story: true, giver: 'mira', lvl: 25, pre: 'vk1', name: 'The Key of Night', where: 'steps', ...D, rep: { lantern: 400 }, obj: { named: 'thelastecho', n: 1, what: 'Take the Key of Night from the Last Echo in the Vault of Echoes' },
    say: ["The Compact's key, the Key of Night, was lost a thousand years ago, when the Vault of Echoes was sealed. Nobody knew where it went. I think it went in with the last thing anyone said down there.", "Go back into the Vault. Silence the Last Echo again, and this time, look for a key."],
    done: ["Black iron, cold as the deep, and there's a star in it that isn't shining. The Key of Night. One down."] },
  { id: 'vk3', story: true, giver: 'sigrun', lvl: 25, pre: 'vk1', name: 'The Key of Rime', where: 'kaldmark', zone: 'north', rep: { hearth: 400 }, obj: { named: 'thewinterheir', n: 1, what: 'Take the Key of Rime from Prince Ivar in Kaldmark Keep' },
    say: ["The Key of Rime? Olle knows the saga: the kings of Kaldmark kept a key of ice that never melted, and the heir always carried it. Always. Even after he died.", "Prince Ivar still holds the Keep, southerner. Go back. He'll have the key on him, and he won't want to give it up. He never gave anything up. That's the whole problem with Kaldmark."],
    done: ["Ice that doesn't melt in my hand. Ivar carried it for a hundred years. I hope it was worth it to him. I hope it's worth it to you."] },
  { id: 'vk4', story: true, giver: 'marshal', lvl: 25, pre: 'vk1', name: 'The Key of Ash', where: 'palace', zone: 'crown', rep: { crown: 400 }, obj: { named: 'choirmaster2', n: 1, what: 'Take the Key of Ash from Precentor Vey in the Undercity' },
    say: ["The Key of Ash was in the royal treasury when I was a boy. When Sabine took the court, it vanished, and her precentor started wearing a black key on a chain round his neck.", "Vey's back in the Undercity, rebuilding his choir. Go down and take it off him. I'd come with you, but somebody has to run the kingdom."],
    done: ["Grey, and warm, and it smells of a burned city. The Key of Ash. Take it down to the Lamp, and may the Four go with you."] },
  { id: 'vk5', story: true, giver: 'mira', lvl: 25, pre: 'vk2', pre2: 'vk3', pre3: 'vk4', name: 'Beneath the Last Lamp', where: 'lampdoor', ...D, rep: { lantern: 800 }, obj: { named: 'handofvhorun', n: 1, what: 'Go through the door below the Last Lamp and defeat the Hand of Vhorun (12-person raid)' },
    say: ["Night, Rime and Ash. All three. I never thought I'd see them in one place, and I'm not sure I wanted to.", "The door is below Deepwatch, under the Lamp. On the other side is whatever Vhorun is, reaching for our light. Bring a raid. Bring everyone. Cut off what's reaching, and come back up, and we will lock it behind you."],
    done: ["You're back. You're all back. And the Lamp... look at it. It's never burned this bright. Whatever you cut off down there, it isn't reaching any more.", "He'll grow another one. I know. But not today, Lightkeeper. Not today."] },
]));
