// Stars Beneath, Build 5: the dark path. The Empire's Dusk Covenant keeps what is left of the Gravelord's art, and
// its four classes are the only Imperial users of the old power. The same four engine classes the lamp-keepers use
// are dressed here in the Covenant's names, kit and colours whenever a dark hero is in play.
import { S, X } from './core.js';
import { CLASSES, BASE_NAMES, WTYPE } from './data.js';
import { addKinds } from './render.js';
import { sfig } from './models3.js';
import { dress, dressLight } from './light4.js';
import { SYSTEMS, LANES } from './ship1.js';

const FOUR = ['wardancer', 'lifebinder', 'knifeshade', 'warlock'];
const REN = {
  wardancer: ['Dusk Knight', "A knight of the Dusk Covenant. Black plate and a dusk blade in each hand: a lamp blade that eats light instead of giving it. You turn blows aside, and every one you slip builds momentum for the kill.",
    { flicker: 'Gutter Strike', challenge: 'Dominate', counter: 'Riposte', whirl: 'Wheel of Dusk', blur: 'Smother', flourish: "Executioner's Flourish", keen: 'Whetted Hate', lightfeet: 'Soft Tread' }],
  lifebinder: ['Bloodbinder', "The Covenant's healer, which is a generous word for it. Blood is a currency: you move it from where it is to where you need it, and keep several transfusions running at once.",
    { thorn: 'Lancet', renew: 'Transfusion', bloom: 'Clotting', rejuv: 'Quicken', wild: 'Shared Vein', swift: 'Suture', lifebloom: 'Second Pulse', tranq: 'Bloodtide', vigor: 'Thick Blood', rooted: 'Cold Hands', treeoflife: 'The Open Vein' }],
  knifeshade: ['Shade', "The Covenant's knife in the dark. A dusk knife, a black cloak and no conscience to speak of. Enormous damage from behind while somebody else holds the enemy's eye.",
    { gouge: 'Blind', step: 'Shadowstep', shadowpact: 'Oath of Dusk', deathmark: 'Mark of Death' }],
  warlock: ['Necromancer', "The Gravelord's art, two thousand years on and still illegal almost everywhere. Rot that eats over time, life drained to mend yourself, and the recently dead put back to work.",
    { sbolt: 'Grave Bolt', corruption: 'Rot', rain: 'Rain of Ash', darkpact: 'Grave Pact', thrall: 'Raise Thrall' }],
};
const WORDS = [[/\bnature\b/gi, 'blood'], [/\bthorn\w*\b/gi, 'lancet'], [/\btree\b/gi, 'font'], [/\bholy\b/gi, 'shadow'], [/\bfire\b/gi, 'ash'], [/\bFire\b/g, 'Ash']];
const W = BASE_NAMES.weapon, Of = BASE_NAMES.off;
W.duskblade = ['Training Dusk Blade', 'Covenant Dusk Blade', 'Reaver Blade']; Of.offdusk = ['Off-hand Dusk Blade', 'Parrying Dark']; W.reliquary = ['Bleeding Bowl', 'Covenant Chalice', 'Red Reliquary']; Of.veincord = ['Vein Cord', 'Lancet Case'];
W.duskknife = ['Dusk Knife', 'Covenant Dirk', 'Shade Edge']; W.skullcase = ['Grave Lantern', 'Covenant Urn', 'Ossuary Lamp']; Of.deadbook = ['Book of Names', 'Ledger of the Dead'];
const DARK_W = { wardancer: ['duskblade', 'offdusk'], lifebinder: ['reliquary', 'veincord'], knifeshade: ['duskknife', 'knife'], warlock: ['skullcase', 'deadbook'] };
const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15];
const LOOKS = {
  wardancer: [{ body: 'armor', head: 'helmet', r: 'lampblade', l: 'lampblade', cloak: '#1a1014' }, HEAVY, [pal('#2c2c34', '#16161a', '#8a1a1a', '#ff3a2a'), pal('#34282c', '#1a1214', '#a8843a', '#ff6a2a'), pal('#28283a', '#12121e', '#6a1a4a', '#c84aff')]],
  lifebinder: [{ body: 'coat', head: 'hood', r: 'canister', l: 'injector', cloak: '#3a0e12' }, HUM, [pal('#5a1a1e', '#2a0e10', '#c8a25a', '#ff4a4a'), pal('#4a1a2a', '#220c14', '#b8b89a', '#ff6a8a'), pal('#3a1414', '#1c0a0a', '#8a8a8a', '#ff3a2a')]],
  knifeshade: [{ body: 'suit', knee: true, head: 'hood', r: 'lampknife', l: 'lampknife', cloak: '#141418' }, HUM, [pal('#26262c', '#121216', '#6a1a1a', '#c84aff'), pal('#2a2226', '#141012', '#8a1a1a', '#ff3a2a'), pal('#22282a', '#101416', '#3a5a4a', '#7aff4a')]],
  warlock: [{ body: 'coat', head: 'hood', r: 'lantern', l: 'slate', cloak: '#1c2a1c' }, HUM, [pal('#2a3a2e', '#141c16', '#b8b89a', '#8dff5a'), pal('#2e2a3a', '#16141c', '#b8b89a', '#a8ff7a'), pal('#3a3a34', '#1c1c18', '#e8e2c0', '#5aff8a')]],
};
const defs = {};
for (const [cls, [o, anim, pals]] of Object.entries(LOOKS)) pals.forEach((p, i) => { defs['dk_' + cls + i] = [sfig(o, p, i + 1), anim, .05, .03]; });
// a quenched dusk blade takes the colour of whatever its knight fed it
export const DUSK_COLS = { crimson: ['Crimson', '#ff2a2a'], ember: ['Ember', '#ff8a2a'], violet: ['Violet', '#b85aff'], venom: ['Venom green', '#7aff4a'], bone: ['Bone white', '#f0e8d8'] };
for (const [k, [, c]] of Object.entries(DUSK_COLS)) defs['dn_' + k] = [sfig(LOOKS.wardancer[0], pal('#2c2c34', '#16161a', '#8a1a1a', c), 1), HEAVY, .05, .03];
addKinds(defs);

// the Necromancer's one honest trick: up to two of the dead, standing again
const THRALL = { name: 'Raise Thrall', icon: '🧟', lvl: 3, kind: 'util', cost: 20, cast: 2, cd: 15, tgt: 'self', desc: 'Raises a dead trooper to fight beside you. You can keep two standing.',
  fx: (C, u) => { const mine = C.petsOf(u).filter(p => p.pet.key === 'thrall'); if (mine.length >= 2) { mine[0].dead = true; mine[0].remove = true; } C.summon(u, 'thrall'); } };
function setThrall(on) {
  const c = CLASSES.warlock, has = !!c.abilities.thrall; if (on === has) return;
  if (!on) { delete c.abilities.thrall; return; }
  const out = {}; for (const [k, ab] of Object.entries(c.abilities)) { out[k] = ab; if (k === 'agony') out.thrall = { ...THRALL }; }
  if (!out.thrall) out.thrall = { ...THRALL }; c.abilities = out;
}
// blood and bone instead of leaves and lamps on the hotbar
const ICONS = { lifebinder: { thorn: '🩸', renew: '💉', bloom: '🩹', rejuv: '❤️', wild: '🫀', swift: '🪡', lifebloom: '💓', tranq: '🌊', vigor: '🧪', rooted: '🧊', treeoflife: '⚱️' }, warlock: { sbolt: '💀', corruption: '🦠', rain: '🌋', darkpact: '⚰️' }, wardancer: { flicker: '🗡️', whirl: '🌑' }, knifeshade: {} };
function setIcons(on) { for (const [cls, map] of Object.entries(ICONS)) for (const [k, ab] of Object.entries(CLASSES[cls].abilities)) { if (ab.icon0 === undefined) ab.icon0 = ab.icon; ab.icon = on && map[k] ? map[k] : ab.icon0; } }
let dressed = 'justice';
X.pathSet = p => {
  const want = p === 'dark' ? 'dark' : 'justice'; if (want === dressed) return; dressed = want;
  if (want === 'dark') { setThrall(true); dress(REN, WORDS); Object.assign(WTYPE, DARK_W); for (const k of FOUR) CLASSES[k].models = [0, 1, 2].map(i => 'dk_' + k + i); setIcons(true); }
  else { setIcons(false); setThrall(false); dressLight(); }
};
X.zone.push(() => {
  X.pathSet(X.path()); const h = S.hero; if (!h || X.path() !== 'dark' || !FOUR.includes(S.heroCls)) return;
  h.kind = S.heroCls === 'wardancer' && DUSK_COLS[S.ext.blade] ? 'dn_' + S.ext.blade : CLASSES[S.heroCls].models[0];
});

// ---------- where a dark hero begins, and what the map shows them ----------
X.starts = X.starts || {};
X.starts.dark = { zone: 'cinder', sys: 'cinder', gold: 5, scene: 'intro_d', hello: 'You are marched off the transport at {town}. The air tastes of metal, and nobody tells you where to stand.' };
Object.assign(SYSTEMS, {
  cinder: { name: 'Cinder', sub: 'Imperial fortress world', path: 'dark', zone: 'cinder', x: .26, y: .14, info: 'A furnace world of black glass and slow rivers of fire. The Dusk Covenant trains its initiates here because very little on Cinder can be made worse by an accident.' },
  hollow: { name: 'Hollow', sub: 'Imperial tithe world', path: 'dark', zone: 'hollow', x: .58, y: .24, info: 'A conquered mining world, dug out for three generations and named for the result. It pays the Empire in ore and has started paying in other ways.', need: () => !!S.quests.de_e11, why: 'You have no orders for the tithe worlds yet.' },
});
LANES.push(['cinder', 'halfway'], ['halfway', 'hollow']);
