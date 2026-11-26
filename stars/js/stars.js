// Stars Beneath, Build 1: the space-opera skin over the MMO engine. Two thousand years on, the same sixteen
// fighting styles carry new names and new weapons. Twelve are open to anyone; four belong to the light and dark
// paths and stay closed until those paths arrive.
import { S, X, clamp } from './core.js';
import { CLASSES, BASE_NAMES, PETS, GUILDS, FAKE_NAMES, CHAT, POTIONS, WTYPE } from './data.js';
import * as R from './render.js';

// path classes: not offered yet (the Blade Knight, Lifebinder, Shade and Voidcaller split into light and dark later)
X.hiddenCls = ['wardancer', 'lifebinder', 'knifeshade', 'warlock'];
X.fakeLvl = zone => zone === 'moon' ? clamp(Math.round(1 + Math.random() ** 1.3 * 5), 1, 6) : zone === 'sunder' || zone === 'city' ? clamp(Math.round(6 + Math.random() * 4.4), 6, 10) : zone === 'fort' ? clamp(Math.round(1 + Math.random() ** 1.3 * 5), 1, 6) : clamp(Math.round(3 + Math.random() * 5), 3, 8);

const REN = {
  bulwark: ['Vanguard', 'Shield trooper. Battle plate, a riot shield, and rage that rises every time something hits you.',
    { heavy: 'Maul Strike', slam: 'Shield Slam', clap: 'Shockwave', wall: 'Barrier Wall', revenge: 'Second Wind', bash: 'Shield Bash', rally: 'Rallying Call', shout: 'Battle Cadence', iron: 'Iron Resolve', lastwall: 'Unbreakable' }],
  bladewarden: ['Breaker', 'Heavy armor and a power hammer. Parries strike back on their own and stack a riposte chain.',
    { hew: 'Hammer Blow', callout: 'Call Out', riposte: 'Riposte', sweep: 'Sweeping Arc', guard: 'Guard Stance', rally: 'Rally', disarm: 'Disarm', execute: 'Finisher', steel: 'Drilled Discipline', bladeward: 'Kinetic Ward', thousand: 'Thousand Blows' }],
  wardancer: ['Blade Knight', 'A knight of the old power. Closed for now.', {}],
  monk: ['Adept', 'Fighter support. Pulls by playing dead, fights bare-handed, stuns casters, off-tanks, and brings group buffs.',
    { palm: 'Palm Strike', feign: 'Play Dead', provoke: 'Provoke', claw: 'Nerve Strike', stun: 'Stunning Palm', whirlkick: 'Spinning Kick', calm: 'Inner Calm', flyingkick: 'Flying Kick', ironbody: 'Iron Body', wind: 'Way of the Wind', focus: 'Focused Mind', fists: 'Hundred Fists' }],
  cleric: ['Field Medic', 'Big heals for a big charge. Slow, enormous treatments like Full Restore. Your power cell is the limit.',
    { smite: 'Stun Dart', mend: 'Medigel', rez: 'Revive', flash: 'Quick Patch', fade: 'Keep Low', complete: 'Full Restore', sanct: 'Triage Field', prayer: 'Group Infusion', guardian: 'Guardian Drone', fort: 'Booster Shot', inner: 'Steady Hands', miracle: 'Miracle Worker' }],
  aegis: ['Shield Tech', 'Barrier healer. A generator pack that throws shields over your crew before the hits land. Read the fight and shield ahead of the big blows.',
    { judgment: 'Shock Pulse', ward: 'Barrier', word: 'Nano Patch', echoes: 'Echo Barrier', rune: 'Shelter Projector', bastion: 'Bastion Field', purge: 'Purge Pulse', reflect: 'Mirror Barrier', barrier: 'Dome Shield', faith: 'Hardened Emitters', serenity: 'Steady State', divine: 'Fortress Protocol' }],
  lifebinder: ['Lifebinder', 'A healer of the old power. Closed for now.', {}],
  druid: ['Xenobiologist', 'Healer support. Bio-serums and off-heals, creeper pods that snare, tamed alien beasts, and mutagens that lend you a brute\'s bulk or a stalker\'s claws.',
    { moonfire: 'Spore Dart', touch: 'Bio-serum', entangle: 'Creeper Pod', grow: 'Regrowth Serum', bear: 'Brute Strain', cat: 'Stalker Strain', hurricane: 'Spore Storm', gate: 'Homing Beacon', starfall: 'Acid Rain', wolf: 'Pack Pheromone', thorns: 'Barbed Hide', mark: 'Adaptive Graft', nature: 'Call the Brood' }],
  longwatch: ['Hunter', 'Rifle and patience. Long aimed shots and crit builds. Stand still a moment and your shots crit more.',
    { quick: 'Snap Shot', aimed: 'Aimed Shot', pin: 'Pinning Shot', fallback: 'Fall Back', volley: 'Suppressing Fire', deadeye: 'Deadeye', multishot: 'Ricochet', rapid: 'Rapid Fire', eagle: 'Scope In', trueshot: 'Spotter', moon: "Hunter's Mark" }],
  knifeshade: ['Shade', 'A knife in the dark. Closed for now.', {}],
  blightblade: ['Smuggler', 'A holdout pistol and a kit of dirty tricks. Stack toxin on one target, up to five deep, then set it off.',
    { envenom: 'Toxin Round', gash: 'Quick Draw', rupture: 'Bleeder Round', cripple: 'Leg Shot', plague: 'Spreader', burst: 'Detonate', cloud: 'Gas Grenade', lethal: 'Double Dose', blades: 'Coated Rounds', antivenom: 'Antitoxin', pandemic: 'Outbreak' }],
  bard: ['Envoy', 'Rogue support. Speeches and songs for the whole group, a silver tongue that charms and lulls, and a fast puller.',
    { chord: 'Cutting Remark', lullaby: 'Lull', siren: 'Silver Tongue', seasong: 'Deep Breath', shriek: 'Feedback Shriek', valor: 'Anthem of Valor', travel: "Spacer's Shanty", rest: 'Song of Rest', haste: 'Quickstep', crescendo: 'Crescendo' }],
  elementalist: ['Arc Gunner', 'Heavy weapons and demolitions. An arc cannon with four kinds of load: incendiary, cryo, shock and breaching. Every enemy is weak to one. Find it, load it, and hit 50% harder.',
    { fire: 'Incendiary Round', frost: 'Cryo Round', storm: 'Arc Round', stone: 'Breaching Charge', nova: 'Cryo Grenade', chain: 'Chain Arc', meteor: 'Demolition Charge', prism: 'Prism Round', kindle: 'Hot Loads', eward: 'Reactive Plating', cataclysm: 'Danger Close' }],
  warlock: ['Voidcaller', 'The edge of the forbidden. Closed for now.', {}],
  binder: ['Machinist', 'Drone swarms. Fields up to four drones (the Fourfold Law still allows no more). They fight on their own; you tune them.',
    { lash: 'Arc Lash', bindfire: 'Deploy Burner Drone', bindstone: 'Deploy Bulwark Drone', empower: 'Overclock', bindwater: 'Deploy Medic Drone', bindstorm: 'Deploy Arc Drone', mendbond: 'Field Repair', primal: 'Focus Fire', fourward: 'Fourfold Shield', seal: 'Command Link', kinship: 'Shared Uplink', unbound: 'Swarm Protocol' }],
  illusionist: ['Holomancer', 'Mage support. The crowd-control master: hard-light decoys, dazzles and charms, and haste and focus for the group.',
    { spike: 'Light Spike', mez: 'Dazzle', mirror: 'Hard-light Decoy', fade: 'Cloak', charm: 'Override', massmez: 'Mass Dazzle', slow: 'Slow', phantasm: 'Phantom Killer', clarity: 'Clarity', hasted: 'Haste', insight: 'Gift of Insight', grand: 'Grand Illusion' }],
};
for (const [k, [name, blurb, abs]] of Object.entries(REN)) {
  const c = CLASSES[k]; c.name = name; c.blurb = blurb;
  for (const [a, n] of Object.entries(abs)) if (c.abilities[a]) c.abilities[a].name = n;
}
// the Smuggler shoots: the old poisoner's kit, at pistol range
{ const c = CLASSES.blightblade; c.melee = false; c.range = 24; c.swing = 2.0;
  for (const ab of Object.values(c.abilities)) { if (ab.range === 3) ab.range = 24; if (ab.desc) ab.desc = ab.desc.replace(/poison/g, 'toxin').replace('A strike that', 'A round that').replace('A quick cut', 'A quick shot').replace('your weapon swings add', 'your pistol shots add'); } }
// only the light and dark paths touch the old power; everything a neutral class does is kit, training or chemistry
X.magicCls = ['wardancer', 'lifebinder', 'knifeshade', 'warlock'];
X.fam = { Mage: 'Tech' }; X.famPl = { Mage: 'Tech' };
const TECH = [[/\bmana\b/g, 'charge'], [/\bMana\b/g, 'Charge'], [/\bspells?\b/g, 'abilities'], [/\bholy\b/gi, 'shock'], [/\bHoly\b/g, 'Shock'], [/\bmagic(al)?\b/gi, 'energy'], [/\bprayer\b/gi, 'infusion'], [/\bblessing\b/gi, 'booster'], [/\bward(s)?\b/g, 'barrier$1'], [/\bWard(s)?\b/g, 'Barrier$1'], [/\bsong\b/g, 'anthem'],
  [/\bbear form\b/gi, 'the brute strain'], [/\bcat form\b/gi, 'the stalker strain'], [/\btreants?\b/gi, 'brood beasts'], [/\bMoonfire\b/g, 'Spore Dart'], [/\broots?\b/g, 'snares'], [/\bfire spirit\b/gi, 'burner drone']];
for (const k of Object.keys(CLASSES)) if (!X.magicCls.includes(k)) for (const ab of Object.values(CLASSES[k].abilities)) if (ab.desc) for (const [a, b] of TECH) ab.desc = ab.desc.replace(a, b);
// drones for the Machinist
for (const ab of Object.values(CLASSES.binder.abilities)) if (ab.desc) ab.desc = ab.desc.replace(/Binds an? /g, 'Deploys a ').replace(/fire spirit/gi, 'burner drone').replace(/stone guardian/gi, 'bulwark drone').replace(/water spirit/gi, 'medic drone').replace(/storm sprite/gi, 'arc drone').replace(/elementals/g, 'drones').replace(/elemental/g, 'drone').replace(/spirits/g, 'drones').replace(/bond/g, 'link');
Object.assign(PETS.firepet, { name: 'Burner Drone' }); Object.assign(PETS.golempet, { name: 'Bulwark Drone' }); Object.assign(PETS.waterpet, { name: 'Medic Drone' }); Object.assign(PETS.stormpet, { name: 'Arc Drone' });

// weapons and armor
const set = (o, k, v) => { o[k].length = 0; o[k].push(...v); };
const W = BASE_NAMES.weapon, O = BASE_NAMES.off;
W.cannon = ['Arc Cannon', 'Heavy Repeater', 'Siege Launcher']; O.drum = ['Ammo Drum', 'Charge Bandolier']; O.genpack = ['Shield Generator', 'Capacitor Pack']; W.injector = ['Serum Injector', 'Dart Rifle', 'Bio-sprayer'];
WTYPE.elementalist = ['cannon', 'drum']; WTYPE.aegis = ['wand', 'genpack']; WTYPE.druid = ['injector', 'totem'];
set(W, 'mace', ['Shock Maul', 'Breaching Hammer', 'Riot Baton']); set(W, 'staff', ['Stim Rod', 'Field Staff', 'Conduit Rod']); set(W, 'bow', ['Scout Rifle', 'Long Rifle', 'Marksman Carbine']);
set(W, 'blade', ['Arc Sabre', 'Duelling Sabre', 'Vibro Sabre']); set(W, 'greatsword', ['Power Hammer', 'Siege Maul', 'Breaker Bar']); set(W, 'wraps', ['Hand Wraps', 'Knuckle Guards', 'Shock Gloves']);
set(W, 'dagger', ['Holdout Pistol', 'Snub Blaster', 'Sidewinder Pistol']); set(W, 'rapier', ['Duelling Foil', 'Dress Sabre', "Envoy's Blade"]); set(W, 'wand', ['Projector', 'Emitter', 'Sidearm']);
set(O, 'shield', ['Riot Shield', 'Barrier Plate', 'Tower Shield']); set(O, 'tome', ['Field Kit', 'Trauma Kit']); set(O, 'orb', ['Focus Core', 'Storm Cell']); set(O, 'quiver', ['Rifle Scope', 'Power Pack']);
set(O, 'sabre', ['Off-hand Sabre', 'Parrying Blade']); set(O, 'charm', ['Lucky Chit', 'Dog Tags', 'Worry Stone']); set(O, 'relic', ['Ward Icon', 'Service Medal']); set(O, 'totem', ['Seed Canister', 'Beast Whistle', 'Spore Pouch']);
set(O, 'knife', ['Boot Knife', 'Throwing Knife']); set(O, 'vial', ['Toxin Kit', 'Trick Belt']); set(O, 'lute', ['Voice Amp', 'Signal Horn', 'Hand Drum']); set(O, 'grimoire', ['Black Slate', 'Void Lantern']); set(O, 'bond', ['Drone Controller', 'Command Slate']);
set(BASE_NAMES.head, 'plate', ['Helmet', 'Visor Helm']); set(BASE_NAMES.head, 'leather', ['Flight Cap', 'Goggles']); set(BASE_NAMES.head, 'cloth', ['Hood', 'Circlet']);
set(BASE_NAMES.chest, 'plate', ['Battle Plate', 'Carapace']); set(BASE_NAMES.chest, 'leather', ['Flight Jacket', 'Duster']); set(BASE_NAMES.chest, 'cloth', ['Longcoat', 'Vestments']);
set(BASE_NAMES.legs, 'plate', ['Greaves', 'Legplates']); set(BASE_NAMES.legs, 'leather', ['Spacer Trousers', 'Chaps']); set(BASE_NAMES.legs, 'cloth', ['Trousers', 'Wraps']);
set(BASE_NAMES.feet, 'plate', ['Mag Boots', 'Warboots']); set(BASE_NAMES.feet, 'leather', ['Deck Boots', 'Treads']); set(BASE_NAMES.feet, 'cloth', ['Soft Boots', 'Sandals']);

// the people you meet online
for (const n of ['Vexa', 'Jettrik', 'Nova', 'Dax', 'Orbit', 'Spanner', 'Kessa', 'Rook', 'Tolliver', 'Zee', 'Brask', 'Moonpie', 'Cinder', 'Halloway', 'Quark', 'Sunny']) if (!FAKE_NAMES.includes(n)) FAKE_NAMES.push(n);
POTIONS.hpot.name = 'Medigel Shot'; POTIONS.mpot.name = 'Stim Cell'; POTIONS.mpot.desc = POTIONS.mpot.desc.replace('mana, rage or focus', 'power, rage or focus');

// blaster bolts instead of arrows
R.arrows.material.color.set('#ff6a3a');
R.arrows.geometry.scale(1.8, 1.8, 1.3);
