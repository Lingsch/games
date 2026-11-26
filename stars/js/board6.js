// Stars Beneath, Build 6: going aboard. A crippled prize, a drifting derelict, or the colony ship Corrin's Promise
// (the space dungeon, off Halfway). One zone, three layouts, crewed to match whatever you just latched on to.
import { S, X, chat } from './core.js';
import { world, registerZone, mergeBuilt, mat4, meshWithOutline } from './world.js';
import { buildInstance } from './dungeons.js';
import { MOBS, QUESTS, xpNeed } from './data.js';
import { MOB_LORE } from './dialogue.js';
import { LORE } from './story.js';
import { build, P, T, Box, Cyl, Sph, Oct } from './models.js';
import { crateGeo } from './moon1.js';
import { SYSTEMS, here } from './ship1.js';
const O = [0, 0, 0];
const mob = (name, kind, o) => ({ name, kind, hpM: 1, dmgM: 1, spd: 5.4, range: 2.4, weak: 'storm', resist: null, scale: 1, aggro: 12, social: 13, ...o });
const boss = (name, kind, o) => ({ name, kind, hpM: 1.3, dmgM: 1.05, spd: 5.2, range: 2.8, weak: 'storm', resist: null, scale: 1.25, aggro: 14, social: 18, ...o });
Object.assign(MOBS, {
  b_hand: mob("Ship's Hand", 'rat0', { human: true }), b_gun: mob("Ship's Gunner", 'rat1', { range: 20, ranged: true, human: true }), b_med: mob("Ship's Surgeon", 'rat2', { hpM: .85, dmgM: .8, range: 16, ranged: true, caster: true, healer: true, school: 'storm', human: true }),
  b_captain: boss('The Captain', 'captain', { human: true, range: 18, ranged: true, mechs: ['pool', 'call'], adds: 'b_hand', lines: { start: "You shot my engines out and now you're on my deck. I'll say this for you, you finish what you start. So do I.", half: 'All hands! Repel boarders!' } }),
  b_drone: mob('Custodian Drone', 'sdrone', { hpM: .9, range: 16, ranged: true, fly: .5, resist: 'poison' }), b_loader: mob('Hold Loader', 'golempet', { hpM: 1.2, spd: 4.6, range: 2.8, resist: 'earth' }),
  b_mind: boss("The Ship's Mind", 'golempet', { scale: 1.6, resist: 'earth', mechs: ['slam', 'cleave', 'call'], adds: 'b_drone', lines: { start: '*UNAUTHORISED PERSONNEL. THIS VESSEL IS ON SCHEDULE. THIS VESSEL HAS BEEN ON SCHEDULE FOR NINETY YEARS.*', half: '*CUSTODIANS TO THE BRIDGE. THE SCHEDULE WILL BE KEPT.*' } }),
  h_crew: mob('Dimmed Crewman', 'dim0', { weak: 'shadow', resist: 'holy', undead: true }), h_marine: mob('Dimmed Marine', 'dim1', { range: 20, ranged: true, weak: 'shadow', resist: 'holy', undead: true }), h_mote: mob('Herald Mote', 'herald0', { dmgM: 1.1, range: 18, ranged: true, caster: true, school: 'arcane', weak: 'shadow', resist: 'holy', fly: .2 }),
  h_purser: boss('Purser Odalric Wynn', 'dim0', { scale: 1.35, weak: 'shadow', resist: 'holy', undead: true, mechs: ['cleave', 'call'], adds: 'h_crew', lines: { start: '*He is still holding the passenger manifest. Every name on it has been neatly ruled through, and he is looking for a pen to do yours.*', half: 'Boarding... is... closed.' } }),
  h_chief: boss('Chief Engineer Sabine Roe', 'dim1', { scale: 1.35, range: 18, ranged: true, weak: 'shadow', resist: 'holy', undead: true, mechs: ['pool', 'slam'], lines: { start: '*The reactor is cold. She tends it anyway, and turns from the dead board with white light spilling out of her visor.*', half: '*The whole engine room hums, on a note with no machine behind it.*' } }),
  h_stowaway: boss('The Stowaway', 'herald_boss', { hpM: 1.6, scale: .8, range: 20, ranged: true, caster: true, school: 'arcane', weak: 'shadow', resist: 'holy', mechs: ['pool', 'call', 'fear', 'enrage'], adds: 'h_mote', lines: { start: '*It is standing on the bridge where the captain should be, facing the forward ports, exactly as it has for ninety years. It rode here. It is in no hurry.*', half: '*Every dead screen on the bridge lights up white.*', enrage: '*It has finished waiting.*' } }),
});
Object.assign(MOB_LORE, { b_hand: 'A deckhand off the ship you just crippled, fighting for the only home he has.', b_gun: "The prize's gunner. Her turret is slag, so she has come down with a rifle.", b_med: "The ship's surgeon, patching her own side as fast as you can undo it.", b_captain: 'Master of the prize. The strongbox is behind her chair.',
  b_drone: 'A maintenance drone still keeping a dead ship tidy.', b_loader: 'A hold loader that has been stacking the same crates for decades.', b_mind: "The derelict's governing machine, which has not been told the voyage is over.",
  h_crew: "One of the crew of Corrin's Promise. White light, and no name.", h_marine: "A ship's marine from Corrin's Promise, still at his post.", h_mote: 'A herald mote. There should not be one this far from a dying star.',
  h_purser: 'He counted nine thousand colonists aboard at Corrin’s Star and has been checking the list ever since.', h_chief: 'She kept the engines running for ninety years after there was anyone left to arrive.', h_stowaway: "Whatever put out Corrin's Star came aboard the last ship to leave it." });
LORE.promiselog = { title: "The Log of Corrin's Promise", where: 'bridge', text: "'Last entry. We lifted nine thousand off the colony the week the star began to fail. The lamp-keeper aboard said we must not look back at it, and I thought that was scripture. It was advice. Half the passengers watched it go out through the stern ports. They went quiet within the hour, and bright within the day. I have sealed the bridge. There is something standing in here with me. It came up the ramp with the last of them and nobody counted it, because it did not look like anything. It has not moved. It is facing the way we are going. I think it is being carried. I think that is all any of us are, to them: a way of getting to the next lamp.'" };

const kit = seed => { const items = [], put = (geo, x, z, ry = 0, s = 1) => items.push({ geo, m: mat4(x, 0, z, ry, s) }); return [items, put]; };
const light = col => build([P(T(Box(.6, .1, .6), 0, 3.3), 0, O, col, 2)]);
const chest = () => build([P(T(Box(1.2, .8, .8), 0, .4), 0, O, '#3a3f46'), P(T(Box(1.24, .12, .84), 0, .7), 0, O, '#d8b24a'), P(T(Box(.2, .2, .1), 0, .5, .42), 0, O, '#ffcf6a', 2.4)]);
registerZone('board', seed => {
  const B = S.ext.board || { type: 'derelict', name: 'the derelict', lvl: S.hero?.lvl || 5 }, L = Math.max(B.type === 'hulk' ? 9 : 5, B.lvl || 5), lv = [L, L], back = SYSTEMS[here()] ? 'ship' : 'ship';
  const nm = B.type === 'hulk' ? "Corrin's Promise" : B.type === 'prize' ? B.name : 'The Derelict';
  world.names = { zone: nm, town: 'the airlock', boss: B.type === 'hulk' ? 'the Stowaway' : B.type === 'prize' ? 'the Captain' : "the Ship's Mind", ruin: nm };
  let w;
  if (B.type === 'hulk') {
    MOBS.h_stowaway.scale = .8;
    w = buildInstance(seed, { name: nm, floor: '#4a4e58', rock: '#0a0c12', walls: false, fog: '#0c0e16', light: .7, noMarker: true, exitTo: back, exitLabel: 'Back through the airlock',
      rects: [[-6, 56, 6, 74], [-3, 40, 3, 56], [-22, 16, 22, 40], [-40, 22, -22, 34], [-62, 10, -40, 46], [22, 22, 40, 34], [40, 10, 62, 46], [-3, -2, 3, 16], [-18, -30, 18, -2], [-3, -40, 3, -30], [-12, -62, 12, -40]],
      doors: [[0, 56], [0, 40], [-22, 28], [-40, 28], [22, 28], [40, 28], [0, 16], [0, -2], [0, -30], [0, -40]], props: [],
      packs: [[-3, 62, ['h_crew', 'h_crew'], lv], [-10, 32, ['h_crew', 'h_marine', 'h_crew'], lv], [10, 22, ['h_marine', 'h_crew', 'h_mote'], lv], [-52, 36, ['h_crew', 'h_crew', 'h_marine'], lv], [-52, 16, ['h_marine', 'h_mote', 'h_crew'], [L, L + 1]],
        [52, 36, ['h_marine', 'h_marine', 'h_crew'], lv], [52, 16, ['h_mote', 'h_crew', 'h_mote'], [L, L + 1]], [-8, -10, ['h_marine', 'h_mote', 'h_crew'], [L + 1, L + 1]], [8, -22, ['h_mote', 'h_marine', 'h_mote'], [L + 1, L + 1]]],
      bosses: [[-50, 28, 'h_purser', L + 1], [50, 28, 'h_chief', L + 1], [0, -52, 'h_stowaway', L + 2, true]] });
    world.props.push({ id: 'log', kind: 'console', tag: 'lore', name: "The captain's log", x: 6, z: -56, yaw: 1, lore: 'promiselog', scale: 1 });
    Object.assign(world.spots, { bridge: { x: 0, z: -52 }, hold: { x: 0, z: 28 } });
  } else {
    const prize = B.type === 'prize', a = prize ? ['b_hand', 'b_gun', 'b_med'] : ['b_drone', 'b_loader', 'b_drone'];
    MOBS.b_captain.name = prize ? `Captain of the ${String(B.name).replace(/^The /, '')}` : 'The Captain';
    w = buildInstance(seed, { name: nm, floor: prize ? '#5a5248' : '#4a5058', rock: '#0e1016', walls: false, fog: prize ? '#141018' : '#0a1014', light: prize ? .95 : .6, noMarker: true, exitTo: back, exitLabel: 'Back through the airlock',
      rects: [[-5, 58, 5, 74], [-2, 44, 2, 58], [-12, 24, 12, 44], [-2, 12, 2, 24], [-9, -6, 9, 12]], doors: [[0, 58], [0, 44], [0, 24], [0, 12]], props: [],
      packs: [[-2, 64, [a[0], a[1]], lv], [-6, 38, [a[0], a[2], a[1]], lv], [6, 28, [a[1], a[0]], lv], [-3, 6, [a[0], a[1], a[2]], lv]],
      bosses: [[0, -1, prize ? 'b_captain' : 'b_mind', L + 1, true]] });
    Object.assign(world.spots, { bridge: { x: 0, z: -1 }, hold: { x: 0, z: 34 } });
  }
  const [items, put] = kit(seed);
  for (const [x, z] of B.type === 'hulk' ? [[-14, 34], [14, 20], [-56, 40], [56, 14], [-10, -24], [10, -8], [0, 66], [-48, 14], [48, 40]] : [[-8, 40], [8, 28], [-9, 30], [3, 66], [-4, 62]]) put(crateGeo(), x, z, x * .5, 1.1);
  for (const [x, z] of B.type === 'hulk' ? [[0, 48], [0, 28], [-50, 28], [50, 28], [0, 8], [0, -16], [0, -50]] : [[0, 66], [0, 34], [0, 4]]) put(light(B.type === 'hulk' ? '#ffffff' : B.type === 'prize' ? '#ffb347' : '#8dffef'), x, z);
  put(chest(), B.type === 'hulk' ? -6 : 5, B.type === 'hulk' ? -58 : -3, .4);
  meshWithOutline(mergeBuilt(items), .04);
  world.regionNames = ['Aboard ' + nm];
  return w;
});
X.noFakes = [...(X.noFakes || []), 'board'];
// what a boarding is worth
X.kill.push(m => {
  if (m.mob === 'b_captain' || m.mob === 'b_mind' || m.mob === 'h_stowaway') { const L = S.hero?.lvl || 5, cr = Math.round((m.mob === 'h_stowaway' ? 90 : 40) * (1 + L * .1)); S.gold += cr; S.ext.boarded = (S.ext.boarded || 0) + 1;
    chat('loot', null, m.mob === 'b_captain' ? `The strongbox behind the captain's chair holds ${cr} credits.` : m.mob === 'b_mind' ? `You strip the derelict's core for ${cr} credits of fittings.` : `The purser's safe, untouched for ninety years, holds ${cr} credits.`);
    X.givePart?.(m.mob === 'h_stowaway' ? 3 : 2, m.mob === 'b_captain' ? 'Taken as prize' : 'Pulled from her engine room'); }
});
// two jobs at Halfway, for any captain
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
QUESTS.push(
  { id: 'sp_b1', zone: 'board', giver: 'imre', lvl: 6, name: 'Prize Rules', where: 'bridge', xp: qx(6, .8), gold: 40, gear: true, obj: { named: 'b_captain', n: 1, what: "Cripple a gunship or raider in a dogfight, board her, and defeat her captain" },
    say: ["You've been shooting pirates into scrap, Captain, and it pains me to watch. A ship that's blown to pieces is worth what you can scoop. A ship that's merely been stopped has a strongbox, an engine, and a captain with opinions.", "Next time one of the big ones is nearly done for, ease off. With luck she'll go dead in space instead of going up. Then get alongside and go aboard. Free port prize rules: whatever's behind the captain's chair is yours. Come and tell me how it went."],
    done: ["Took her on her own deck? Ha! That's the trade, Captain. Half the ships that dock here were somebody else's once. Here, the port pays a bounty for every hull taken whole. It saves us sweeping the lanes."] },
  { id: 'sp_h1', zone: 'board', giver: 'imre', lvl: 9, pre: 'sp_b1', name: "Corrin's Promise", where: 'bridge', xp: qx(10, 1), gold: 90, gear: true, lore: 'promiselog', obj: { named: 'h_stowaway', n: 1, what: "Fly out to the hulk Corrin's Promise off Halfway, board her, and deal with whatever is on the bridge" },
    say: ["There's a hulk drifted into the outer lanes, off toward the old Corrin beacon. A colony ship, ninety years overdue. Corrin's Promise. She lifted off Corrin's Star the year it went dark, and nobody ever heard of her again until last month.", "Wreckers have been at her and not one has come back off her. And my scopes say she's showing lights, Captain. White ones. On a ship with a cold reactor. Take a full crew and find out what's keeping them on."],
    done: ["It rode her. Ninety years, standing on the bridge, waiting for the ship to drift somewhere with people in. And she drifted here. To my station. Captain, I've run Halfway thirty years on the principle that it's nobody's business what's in the next lock. I'm beginning to think that's how it gets in."] },
);
