// Stars Beneath, Build 4: the justice path. The four light classes (the only justice-side users of the old power),
// lamp-powered kit for tech classes once the order grants it, the patrol cutter Vigilant, and the path's hooks.
import { S, X, chat } from './core.js';
import { CLASSES, BASE_NAMES, WTYPE, X_NAME, makeItem, CLASS_KEYS } from './data.js';
import { replaceKinds, addKinds } from './render.js';
import { sfig } from './models3.js';
import * as Game from './game.js';
import * as Cb from './combat.js';
import { SYSTEMS, LANES, CREW } from './ship1.js';

X.path = () => X.newPath || S.ext?.path || 'smuggler';
// which classes a hero may be: smugglers have the twelve tech classes; the order's novices add the four light ones
const LIGHT = ['wardancer', 'lifebinder', 'knifeshade', 'warlock'];
Object.defineProperty(X, 'hiddenCls', { get: () => X.path() === 'justice' ? [] : LIGHT, configurable: true });
X.magicCls = LIGHT;
const ZONE_PATH = { moon: 'smuggler', sunder: 'smuggler', fort: 'justice', city: 'justice' };
X.lfgOk = d => !ZONE_PATH[d.zone] || ZONE_PATH[d.zone] === X.path();
X.shipName = () => X.path() === 'justice' ? 'Vigilant' : 'Second Chance';
X.shipLook = () => X.path() === 'justice' ? ['#c8d0d8', '#2e5a9e'] : ['#8a8e96', '#c8782a'];
X.textFix = t => X.path() === 'justice' && typeof t === 'string' ? t.replace(/Second Chance/g, 'Vigilant') : t;

// ---------- the light classes ----------
const REN = {
  wardancer: ['Lamp Knight', "A knight of the lamp-keepers. Light armour and a lamp blade in each hand. You turn blows aside, and every one you slip builds momentum for the counter.",
    { flicker: 'Flicker Strike', challenge: 'Challenge', counter: 'Counter', whirl: 'Wheel of Light', blur: 'Blur', secondstep: 'Second Step', flurry: 'Blade Flurry', flourish: "Keeper's Flourish", keen: 'Trimmed Wick', lightfeet: 'Light Feet', untouchable: 'Untouchable' }],
  lifebinder: ['Lifebinder', "A healer of the old power. You carry an order lantern and keep several mending lights burning on everyone at once. Very little is wasted.",
    { thorn: 'Searing Ray', renew: 'Renewing Light', bloom: 'Mending Glow', rejuv: 'Rekindle', wild: 'Spreading Light', swift: 'Swiftmend', lifebloom: 'Lifeflame', tranq: 'Stillness', vigor: 'Steady Flame', rooted: 'Quiet Mind', treeoflife: 'Beacon' }],
  knifeshade: ['Sentinel', "The order's quiet hand. A lamp knife, a grey cloak and a long patience. Enormous damage from behind while somebody else holds the enemy's eye.",
    { stab: 'Stab', backstab: 'Backstab', gouge: 'Dazzle', evade: 'Evade', vanish: 'Veil', ambush: 'Ambush', step: 'Lightstep', fan: 'Fan of Sparks', deadly: 'Deadly Focus', shadowpact: 'Oath of the Vigil', deathmark: 'Mark of Judgment' }],
  warlock: ['Lumenist', "A scholar of the lamp lore who burns with it. Brands that sear over time, light drawn out of an enemy to mend yourself, and a rain of fire when patience runs out.",
    { sbolt: 'Radiant Bolt', corruption: 'Searing Brand', agony: 'Brand of Truth', drain: 'Draw the Light', weakness: 'Dimming', terror: 'Blinding Glare', rain: 'Rain of Light', bargain: 'Kindle', darkpact: 'Lamp Oath', bloodpact: 'Shared Flame', harvest: 'Gather the Light' }],
};
const LIGHT_WORDS = [[/\bshadow\b/gi, 'radiant'], [/\bcurses?\b/gi, 'brand'], [/\bdark\b/gi, 'bright'], [/\bsoul\b/gi, 'light'], [/\bpoison(ed)?\b/gi, 'searing'], [/\bnecromancy\b/gi, 'the lamp lore'], [/\bthorn\w*\b/gi, 'ray'], [/\bnature\b/gi, 'light'], [/\btree\b/gi, 'beacon']];
for (const [k, [name, blurb, abs]] of Object.entries(REN)) {
  const c = CLASSES[k]; c.name = name; c.blurb = blurb;
  for (const [a, n] of Object.entries(abs)) if (c.abilities[a]) c.abilities[a].name = n;
  for (const ab of Object.values(c.abilities)) if (ab.desc) for (const [a, b] of LIGHT_WORDS) ab.desc = ab.desc.replace(a, b);
}
const W = BASE_NAMES.weapon, O = BASE_NAMES.off;
W.lampblade = ['Training Lamp Blade', 'Order Lamp Blade', 'Vigil Blade']; O.offblade = ['Off-hand Lamp Blade', 'Parrying Light']; W.lantern = ['Order Lantern', "Keeper's Lamp", 'Vigil Lantern']; O.censer = ['Oil Flask', 'Wick Case', 'Prayer Cord'];
W.shortblade = ['Lamp Knife', 'Vigil Dirk', "Keeper's Edge"]; O.codex = ['Book of Hours', 'Order Codex'];
WTYPE.wardancer = ['lampblade', 'offblade']; WTYPE.lifebinder = ['lantern', 'censer']; WTYPE.knifeshade = ['shortblade', 'knife']; WTYPE.warlock = ['lantern', 'codex'];
const pal = (a, b, t, g) => ({ a, b, t, g }), HUM = [.6, .4, 1.6, .15];
const LOOKS = {
  wardancer: [{ body: 'coat', head: 'bare', tail: true, r: 'lampblade', l: 'lampblade', scarf: '#e8e2d0' }, [pal('#e8e2d0', '#5a6a8a', '#d8b24a', '#ffe9a0'), pal('#d8dce4', '#3a5a6a', '#c8a25a', '#9fe6ff'), pal('#e0d8c8', '#6a5a4a', '#d8b24a', '#c8ffb0')]],
  lifebinder: [{ body: 'coat', head: 'hood', r: 'lantern', l: null, cloak: '#e8e2d0' }, [pal('#e8e2d0', '#c8b890', '#d8b24a', '#ffe9a0'), pal('#d8e0e8', '#8aa0b8', '#c8a25a', '#bfe6ff'), pal('#e0e8d8', '#9ab08a', '#d8b24a', '#d8ffb0')]],
  knifeshade: [{ body: 'suit', knee: true, head: 'hood', r: 'lampknife', l: 'lampknife', cloak: '#8a9098' }, [pal('#8a9098', '#4a5058', '#d8b24a', '#ffe9a0'), pal('#7a8a9a', '#3a4654', '#c8a25a', '#9fe6ff'), pal('#9a9488', '#4e4a42', '#d8b24a', '#ffd0a0')]],
  warlock: [{ body: 'coat', head: 'visor', r: 'lantern', l: 'slate', scarf: '#d8b24a' }, [pal('#f0ead8', '#8a7a5a', '#d8b24a', '#fff2b0'), pal('#e0e8f0', '#5a6a8a', '#c8a25a', '#bfe6ff'), pal('#f0e0d0', '#8a5a4a', '#d8b24a', '#ffc890')]],
};
const defs = {};
for (const [cls, [o, pals]] of Object.entries(LOOKS)) pals.forEach((p, i) => { defs[cls + i] = [sfig(o, p, i + 1), HUM, .05, .03]; });
replaceKinds(defs);
// a forged lamp blade burns in the colour its knight chose
export const BLADE_COLS = { gold: ['Gold', '#ffe07a'], blue: ['Blue', '#7ad8ff'], green: ['Green', '#8aff9a'], white: ['White', '#ffffff'], violet: ['Violet', '#c8a0ff'] };
for (const [k, [, c]] of Object.entries(BLADE_COLS)) addKinds({ ['lk_' + k]: [sfig(LOOKS.wardancer[0], pal('#e8e2d0', '#5a6a8a', '#d8b24a', c), 1), HUM, .05, .03] });
X.zone.push(() => { const h = S.hero; if (h && S.heroCls === 'wardancer' && S.ext.blade && BLADE_COLS[S.ext.blade]) h.kind = 'lk_' + S.ext.blade; });

// ---------- lamp-powered kit: what the order grants a tech class at its first trial ----------
const lit = e => e && e.isHero && S.flags?.lamp && !LIGHT.includes(e.cls);
X_NAME.fn = (e, ab) => lit(e) && ab.kind !== 'buff' ? 'Lamplit ' + ab.name : ab.name;
X.abName = (e, ab) => X_NAME.fn(e, ab);
X.acct = a => { if (S.flags?.lamp) { a.powP = (a.powP || 0) + (LIGHT.includes(S.heroCls) ? .04 : .08); a.hpP = (a.hpP || 0) + .04; } };
export function grantLamp() {
  if (S.flags.lamp) return; S.flags.lamp = 1;
  const cls = S.heroCls, t = WTYPE[cls], L = S.hero.lvl, light = LIGHT.includes(cls);
  const it = makeItem({ name: light ? `Novice's ${BASE_NAMES.weapon[t[0]][1] || BASE_NAMES.weapon[t[0]][0]}` : `Lamp-powered ${BASE_NAMES.weapon[t[0]][0]}`, slot: 'weapon', type: t[0], lvl: L, rarity: 2, stats: { pow: 6 + L * 2, sta: 2 + L }, value: 12 });
  if (S.gear[cls]) { const old = S.gear[cls].weapon; S.gear[cls].weapon = it; if (old && S.bag.length < 30) S.bag.push(old); Game.applyGear(S.hero, S.gear[cls]); }
  Game.refreshAcct();
  chat('loot', null, light ? `The order confirms you as a sworn novice. You receive ${it.name}.` : `The order lights a lamp core in your weapon. You receive ${it.name}, and your abilities burn with it.`);
  Game.save();
}

// ---------- where a justice hero begins, and what the map shows them ----------
X.starts = { justice: { zone: 'fort', sys: 'cairn', gold: 8, scene: 'intro_j', hello: 'A transport sets you down at {town}. The cold has teeth.' } };
Object.assign(SYSTEMS, {
  cairn: { name: 'Cairn', sub: 'Republic border world', path: 'justice', zone: 'fort', x: .22, y: .3, info: 'Ice, wind and one fort. Fort Lastlight has watched the border for three hundred years, and lately the border has started watching back.' },
  aurelis: { name: 'Aurelis', sub: 'Republic core world', path: 'justice', zone: 'city', x: .72, y: .72, info: "The Republic's capital and the seat of the lamp-keepers. A hundred million lights, and somebody is counting the ones that go out.", need: () => !!S.quests.jf_j11, why: 'You have no orders for the core worlds yet.' },
});
SYSTEMS.core1.path = 'smuggler'; SYSTEMS.core2.path = 'smuggler';
LANES.push(['cairn', 'halfway'], ['halfway', 'aurelis']);
