// Build 11: a living economy.
//   The market moves: news of shortages and gluts pushes the auction house's prices, and the Market page shows it.
//   Fake crafters list what they make and take your commissions.
//   Your own shop: if you own a house, a hired shopkeeper sells for you at prices you set, even while you're away.
//   Trade routes: buy goods where they're made and sell them where they're wanted. Hire a caravan to haul them
//   (slow, and it pays less), or ride along with your cargo yourself (full price, and bandits come for it).
import { S, X, chat, pick, rnd, irnd, TAU, clamp, dist } from './core.js';
import { MOBS, GIVERS, CLASSES } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt } from './world.js';
import { INSTANCES } from './dungeons.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import * as AI from './ai.js';
import * as Craft from './crafting.js';
import { AH, BASE_PRICE, fairGear } from './social6.js';

const L = () => S.hero?.lvl || 1, now = () => Date.now();
const E = () => (S.ext.econ = S.ext.econ || { news: [], hist: {}, comm: [], shop: [], shopT: now(), cargo: {}, caravans: [], tradeT: 0 });

// ---------- the market moves ----------
const CATS = { ore: ['copper', 'iron', 'silver', 'starsteel', 'rimeiron', 'crowngold', 'skysilver'], herb: ['meadowsweet', 'graveroot', 'kelpbloom', 'deepcap', 'frostbloom', 'kingsfoil', 'cloudbloom'],
  hide: ['lighthide', 'thickhide', 'scalehide', 'wyrmhide', 'stormhide'], cloth: ['linen', 'wool', 'seasilk', 'moonweave', 'starweave'], gem: ['garnet', 'moonstone', 'pearl', 'starstone', 'heartstar'], magic: ['dust', 'shard'] };
const NEWS = {
  ore: [["A mine collapsed under the Wastes. Ore is scarce.", 1.8], ["The Kaldmen found a new seam of rime-iron. Ore is cheap this week.", .55], ["Corrand's smiths are arming for war and buying every bar of metal they can find.", 1.6]],
  herb: [["A blight in the herb gardens of the Vale. Herbs are dear.", 1.7], ["The Weald had a bumper harvest. Herbs are cheap.", .55], ["Plague in the Quarter has every healer in Corrand buying herbs.", 1.9]],
  hide: [["The tanners' guild is on strike. Hides are scarce.", 1.7], ["The great hunt in the Rimewild came home heavy. Hides are cheap.", .55]],
  cloth: [["The Sky Fleet is buying sailcloth by the mile. Cloth is dear.", 1.8], ["A silk caravan came up from the coast. Cloth is cheap.", .6]],
  gem: [["The Halcyon are hoarding stones for their lenses. Gems are dear.", 1.9], ["A gem-cutter's estate is being sold off cheap.", .6]],
  magic: [["Enchanters are buying up dust for the festival. Magic stuff is dear.", 1.7], ["A wizard's tower in the Wastes was looted. Dust and shards are everywhere.", .55]],
};
const target = {};
X.priceTarget = k => target[k] ?? 1;
function newsTick() {
  const e = E(); e.news = e.news.filter(n => n.until > S.time);
  for (const k in target) delete target[k];
  for (const n of e.news) for (const k of CATS[n.cat]) target[k] = n.mul;
  if (e.news.length < 2 && Math.random() < .35) {
    const cat = pick(Object.keys(NEWS)), [text, mul] = pick(NEWS[cat]);
    e.news.push({ cat, text, mul, until: S.time + rnd(1200, 2400) }); for (const k of CATS[cat]) { target[k] = mul; const a = AH(); a.price[k] = clamp((a.price[k] ?? 1) * (mul > 1 ? 1.25 : .8), .3, 3.5); }
    chat('trade', 'Market News', text);
  }
}
X.restock = X.restock || [];
X.restock.push(a => {
  newsTick();
  const e = E(); for (const k in BASE_PRICE) { const h = e.hist[k] = e.hist[k] || []; h.push(+(a.price[k] ?? 1).toFixed(2)); if (h.length > 12) h.shift(); }
  // fake crafters list what they make
  for (let i = 0; i < 3; i++) { const c = crafter(); if (!c) break; const it = craftFor(c, clamp(L() + irnd(-2, 1), 1, 35), Math.random() < .6 ? S.heroCls : pick(Object.keys(CLASSES))); if (it) a.list.push({ item: it, price: Math.round(fairGear(it) * rnd(1, 1.3)), by: c.name + ' (crafter)', t: S.time }); }
});
// ---------- fake crafters and commissions ----------
const MAKERS = ['smithing', 'leatherworking', 'tailoring', 'jewelcrafting'];
const crafters = () => { const fs = (S.fakes || []).filter(f => f.fake); return fs.slice(0, 8).map((f, i) => ({ name: f.name, prof: MAKERS[i % 4], who: { name: f.name, craft: { make: MAKERS[i % 4], skill: { [MAKERS[i % 4]]: Craft.SKILL_CAP } } } })); };
const crafter = () => pick(crafters());
function recipeFor(prof, lvl, slot) { return Object.values(Craft.RECIPES).filter(r => r.prof === prof && r.out.slot && !r.out.ench && !r.rare && r.out.lvl <= lvl && (!slot || r.out.slot === slot)).sort((a, b) => b.out.lvl - a.out.lvl || b.req - a.req)[0]; }
function craftFor(c, lvl, cls, slot) {
  const r = recipeFor(c.prof, lvl, slot); if (!r) return null;
  const keep = S.heroCls; S.heroCls = cls; let it; try { it = Craft.makeGear(r); } finally { S.heroCls = keep; }
  Craft.craftHooks.gear?.(it, r, c.who); it.maker = c.name; return it;
}
export function commission(c, slot) {
  const e = E(); if (e.comm.length >= 3) return 'Three commissions at a time is plenty. Crafters have other customers.';
  const r = recipeFor(c.prof, L(), slot); if (!r) return `${c.name} can't make that for someone at your level.`;
  const it = Craft.makeGear(r), cost = Math.round(fairGear(it) * 1.25);
  if (S.gold < cost) return `${c.name} wants ${cost} gold for that, up front.`;
  S.gold -= cost; e.comm.push({ by: c.name, prof: c.prof, slot, cls: S.heroCls, lvl: L(), done: now() + rnd(5, 15) * 6e4 });
  chat('trade', c.name, pick([`I'll have it for you within the quarter-hour. Don't hover.`, `Consider it done. Well, consider it started.`, `A ${slot} for a ${CLASSES[S.heroCls].name}? I can do that in my sleep. I won't. But I could.`]));
  Game.save(); return null;
}
// ---------- your shop ----------
export const hasHouse = () => Object.keys(S.ext.home?.houses || {}).length > 0;
export function shopAdd(it, price) { const e = E(); if (e.shop.length >= 6) return 'Your shopkeeper has room for six things.'; S.bag = S.bag.filter(b => b !== it); e.shop.push({ item: it, price: Math.max(1, Math.round(price)) }); return null; }
export function shopTake(l) { const e = E(); if (S.bag.length >= 30) return 'Your bags are full.'; e.shop = e.shop.filter(x => x !== l); S.bag.push(l.item); return null; }
function shopSell(hours) {
  const e = E(); if (!e.shop.length || !hasHouse()) return;
  let got = 0; const sold = [];
  for (const l of e.shop.slice()) { const ratio = l.price / Math.max(1, fairGear(l.item)), perHour = ratio <= .8 ? .5 : ratio <= 1.05 ? .3 : ratio <= 1.4 ? .12 : ratio <= 2 ? .04 : .01;
    if (Math.random() < 1 - Math.pow(1 - perHour, hours)) { e.shop = e.shop.filter(x => x !== l); got += Math.floor(l.price * .97); sold.push(l.item.name); } }
  if (got) { S.gold += got; chat('trade', 'Your Shopkeeper', `Sold ${sold.join(', ')}. ${got} gold in the till, less my wages. You're welcome.`); }
}
// ---------- trade routes ----------
export const MARKETS = { vale: ['The Vale', 0, 'grain'], weald: ['Hornstead', 1, 'furs'], kiln: ['Cinderhall', 1, 'emberglass'], hush: ['Lanternrest', 1, 'lampoil'], coast: ['Crookwater', 2, 'saltfish'], wastes: ['Emberwatch', 3, 'ashsalt'],
  deep: ['Lowmarket', 4, 'glowcap'], north: ['Hearthfrost', 4, 'rimefur'], crown: ['Corrandel', 4, 'wine'], sky1: ['Gale\'s Rest', 5, 'stormglass'], sky2: ['Prismhold', 6, 'cloudsilk'], sky3: ['Zenith Camp', 7, 'starglass'] };
export const GOODS = { grain: ['Sacks of Grain', 6], furs: ['Bales of Furs', 10], emberglass: ['Crates of Emberglass', 12], lampoil: ['Casks of Lamp-Oil', 9], saltfish: ['Barrels of Salt Fish', 8], ashsalt: ['Sacks of Ash-Salt', 11],
  glowcap: ['Crates of Glowcaps', 14], rimefur: ['Bales of Rime-Fur', 15], wine: ['Casks of Corrand Wine', 16], stormglass: ['Crates of Stormglass', 18], cloudsilk: ['Bolts of Cloudsilk', 20], starglass: ['Crates of Starglass', 24] };
const made = g => Object.keys(MARKETS).find(m => MARKETS[m][2] === g);
const day = () => Math.floor(now() / 864e5);
const noise = (m, g) => { let h = 0; for (const c of m + g + day()) h = (h * 31 + c.charCodeAt(0)) | 0; return .9 + ((h >>> 0) % 1000) / 5000; };
export function priceAt(m, g) { const p = MARKETS[made(g)][1], here = MARKETS[m][1], base = GOODS[g][1] * (1 + L() * .08); return Math.max(1, Math.round(base * (m === made(g) ? .6 : .9 + .14 * Math.abs(here - p)) * noise(m, g))); }
export const cargoN = () => Object.values(E().cargo).reduce((a, b) => a + b, 0);
export const CAP = 20;
export function buyGood(m, g, n) { const p = priceAt(m, g) * n; if (cargoN() + n > CAP) return `You can carry ${CAP} loads.`; if (S.gold < p) return 'Not enough gold.'; S.gold -= p; E().cargo[g] = (E().cargo[g] || 0) + n; chat('trade', null, `You buy ${n} ${GOODS[g][0]} for ${p} gold.`); return null; }
export function sellGood(m, g, n) { const c = E().cargo; n = Math.min(n, c[g] || 0); if (!n) return 'You have none of those.'; const p = priceAt(m, g) * n; c[g] -= n; if (!c[g]) delete c[g]; S.gold += p; chat('trade', null, `You sell ${n} ${GOODS[g][0]} for ${p} gold.`); return null; }
export function hire(from, to) {
  const e = E(), c = { ...e.cargo }, n = cargoN(); if (!n) return 'Buy some goods first: the caravan hauls what you have.';
  if (e.caravans.length >= 3) return 'You already have three caravans on the road.';
  const legs = Math.abs(MARKETS[from][1] - MARKETS[to][1]) + 1, mins = 8 + legs * 6;
  e.caravans.push({ from, to, goods: c, arrive: now() + mins * 6e4 }); e.cargo = {};
  chat('trade', 'Caravan-Master', `Your caravan leaves for ${MARKETS[to][0]}. ${mins} minutes on the road, if nothing goes wrong. Something usually goes wrong.`); Game.save(); return null;
}
function caravanTick() {
  const e = E(), t = now();
  for (const c of e.caravans.filter(c => c.arrive <= t)) {
    let total = 0, lost = Math.random() < .12; for (const [g, n] of Object.entries(c.goods)) { if (!n) continue; const k = lost ? Math.floor(n / 2) : n; total += Math.round(priceAt(c.to, g) * k * .8); }
    S.gold += total; chat('trade', 'Caravan-Master', lost ? `Your caravan reached ${MARKETS[c.to][0]}, but bandits took half the load on the way. The rest sold for ${total} gold, after the hauliers' cut.` : `Your caravan reached ${MARKETS[c.to][0]} and sold everything for ${total} gold, after the hauliers' cut.`);
  }
  e.caravans = e.caravans.filter(c => c.arrive > t);
  for (const c of e.comm.filter(c => c.done <= t)) { const cr = crafters().find(x => x.name === c.by) || { name: c.by, prof: c.prof, who: { name: c.by, craft: { make: c.prof, skill: { [c.prof]: Craft.SKILL_CAP } } } }; const it = craftFor(cr, c.lvl, c.cls, c.slot);
    if (it && Game.addToBag(it)) { chat('trade', c.by, `Your ${it.name} is ready. ${/Masterwork/.test(it.name) ? 'I outdid myself, frankly.' : 'Mind the edges.'}`); e.comm = e.comm.filter(x => x !== c); } }
}
// riding along: bandits smell cargo on the road
Object.assign(MOBS, { roadraider: { name: 'Road Raider', kind: 'bandit2', hpM: 1.1, dmgM: 1.05, spd: 6, range: 2.4, weak: 'storm', resist: null, scale: 1, aggro: 20, social: 0, human: true },
  roadarcher: { name: 'Road Raider Archer', kind: 'xbow', hpM: .9, dmgM: 1, spd: 6, range: 22, ranged: true, weak: 'storm', resist: null, scale: 1, aggro: 20, social: 0, human: true } });
let ambT = 120;
const inTown = () => (world.towns || []).some(t => Math.hypot(S.hero.x - t.x, S.hero.z - t.z) < (t.R || 20) + 8);
X.tick.push(dt => {
  const h = S.hero; if (!h || !S.running) return;
  if ((E().tradeT -= dt) <= 0) { E().tradeT = 20; caravanTick(); shopSell(20 / 3600); }
  if (!cargoN() || INSTANCES[S.zone] || inTown() || h.dead) return;
  if ((ambT -= dt) > 0) return; ambT = rnd(100, 200);
  const a = rnd(0, TAU), x = h.x + Math.cos(a) * 40, z = h.z + Math.sin(a) * 40, n = 2 + (cargoN() > 10 ? 1 : 0) + (L() >= 20 ? 1 : 0);
  for (let i = 0; i < n; i++) { const m = Cb.makeMob(i % 3 === 2 ? 'roadarcher' : 'roadraider', Math.max(1, L() + irnd(-1, 0)), { x: x + rnd(-3, 3), z: z + rnd(-3, 3), home: { x, z } }); m.y = hgt(m.x, m.z); m.raider = true; m.huntHero = true; }
  chat('sys', null, pick(['Someone has been following your cargo. Raiders!', 'Bandits on the road! They want your goods.', 'A shout from the trees: "Drop the cargo and nobody gets hurt!"']));
});
X.tick.push(() => { const h = S.hero; if (!h) return; for (const m of S.ents) if (m.huntHero && !m.dead && !m.engaged) { AI.goTo(m, h.x, h.z, 1 / 30, 5); if (dist(m, h) < 20) Cb.addThreat(m, h, 2); } });
// die with cargo and the raiders take some of it
{ let wasDead = false; X.tick.push(() => { const h = S.hero; if (!h) return; if (h.dead && !wasDead && cargoN()) { const c = E().cargo; let lost = 0; for (const g of Object.keys(c)) { const k = Math.ceil(c[g] * .3); c[g] -= k; lost += k; if (!c[g]) delete c[g]; } if (lost) chat('sys', null, `The raiders make off with ${lost} loads of your cargo.`); } wasDead = h.dead; }); }

// ---------- the people: a trade-master in every market town ----------
GIVERS.trademaster = { name: 'Trade-Master', title: 'Goods, caravans and commissions', model: 'villager3' };
TALK.trademaster = { bio: 'The trade-masters of the free markets keep the prices, hire out caravans, and know which crafter will make what for whom. They are all paid by the market, which means they are all paid by everyone, which means they trust no one.', greet: ["Buy cheap, sell dear, and don't die on the road. That's the whole of trade. Everything else is paperwork.", "Goods in, goods out. Caravans leave on the hour. Bandits leave whenever they like."], topics: [] };
X.zone.push(zone => {
  if (!MARKETS[zone] || !world.town) return;
  const t = world.town, a = 5.4, e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: `Trade-Master of ${MARKETS[zone][0]}`, title: GIVERS.trademaster.title, kind: 'villager3', x: t.x + Math.cos(a) * ((t.R || 20) * .5), z: t.z + Math.sin(a) * ((t.R || 20) * .5), giver: 'trademaster' });
  e.y = hgt(e.x, e.z);
});
X.talk.push((k, n, api) => k === 'trademaster' ? [['▸ Show me your goods.', () => { api.close(); X.ui.openBook('market'); }, 'hl']] : []);
const nearTrade = () => S.ents.some(e => e.giver === 'trademaster' && dist(e, S.hero) < 8);

// ---------- the Market page ----------
let tab = 'news';
X.book.push(['market', 'Market', body => {
  const { el, esc, toast, refreshSheet } = X.ui, e = E(), m = MARKETS[S.zone] ? S.zone : null;
  body.appendChild(el(`<div class="tabs">${[['news', 'Prices'], ['trade', 'Trade goods'], ['shop', 'Your shop'], ['comm', 'Commissions']].map(([k, t]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${t}</button>`).join('')}</div>`)).onclick = ev => { const t = ev.target.dataset?.t; if (t) { tab = t; refreshSheet(); } };
  body.appendChild(el(`<p style="margin:4px 0">Gold: <b style="color:var(--acc)">${S.gold}</b>${cargoN() ? ` · carrying ${cargoN()}/${CAP} loads` : ''}</p>`));
  if (tab === 'news') {
    body.appendChild(el(`<div class="card" style="text-align:left"><h3>Market news</h3>${e.news.length ? e.news.map(n => `<p style="font-size:13px;margin:2px 0">${n.mul > 1 ? '▲' : '▼'} ${esc(n.text)}</p>`).join('') : '<p style="font-size:13px">A quiet market.</p>'}</div>`));
    const a = AH(), rows = Object.keys(BASE_PRICE).filter(k => Craft.MATS[k]).map(k => { const h = e.hist[k] || [], p = a.price[k] ?? 1, was = h[0] ?? 1; return { k, p, ch: p / was }; }).sort((x, y) => Math.abs(y.ch - 1) - Math.abs(x.ch - 1)).slice(0, 14);
    body.appendChild(el(`<div class="card" style="text-align:left"><h3>Movers</h3>${rows.map(r => `<div class="who"><div>${Craft.MATS[r.k].icon} ${esc(Craft.MATS[r.k].name)}</div><small style="color:${r.ch > 1.05 ? '#e88' : r.ch < .95 ? '#8e8' : 'inherit'}">${Math.max(1, Math.round(r.p * BASE_PRICE[r.k]))}g ${r.ch > 1.05 ? '▲' : r.ch < .95 ? '▼' : '·'} ${Math.round((r.ch - 1) * 100)}%</small></div>`).join('')}<p style="font-size:12px;margin:4px 0 0">Buy and sell materials at any auction house.</p></div>`));
  }
  if (tab === 'trade') {
    if (!m || !nearTrade()) body.appendChild(el('<p>Find a trade-master in a market town to buy and sell goods.</p>'));
    else {
      body.appendChild(el(`<p style="font-size:13px;margin:0 0 4px">${esc(MARKETS[m][0])} makes ${esc(GOODS[MARKETS[m][2]][0].toLowerCase())}, cheap. Everything else is dearer the further it has come.</p>`));
      for (const g of Object.keys(GOODS)) { const p = priceAt(m, g), have = e.cargo[g] || 0;
        const c = el(`<div class="who"><div><b>${esc(GOODS[g][0])}</b> <small>${p}g${have ? ` · you have ${have}` : ''}</small></div><div><button data-b="1">Buy</button> <button data-b="5">×5</button>${have ? ` <button data-s="${have}">Sell all</button>` : ''}</div></div>`);
        c.onclick = ev => { const b = +ev.target.dataset?.b, s = +ev.target.dataset?.s; const r = b ? buyGood(m, g, b) : s ? sellGood(m, g, s) : null; if (r) toast(r); if (b || s) refreshSheet(); }; body.appendChild(c); }
      if (cargoN()) { const c = el(`<div class="card" style="text-align:left"><h3>Hire a caravan</h3><p style="font-size:13px">Send what you carry to another market. It sells there for 80% of the price, and one road in eight has bandits. Ride along yourself for the full price.</p><div class="acts">${Object.keys(MARKETS).filter(k => k !== m).map(k => `<button data-to="${k}">${esc(MARKETS[k][0])}</button>`).join('')}</div></div>`);
        c.onclick = ev => { const to = ev.target.dataset?.to; if (to) { const r = hire(m, to); if (r) toast(r); refreshSheet(); } }; body.appendChild(c); }
    }
    if (e.caravans.length) body.appendChild(el(`<div class="card" style="text-align:left"><h3>On the road</h3>${e.caravans.map(c => `<p style="font-size:13px;margin:2px 0">To ${esc(MARKETS[c.to][0])}: about ${Math.max(1, Math.ceil((c.arrive - now()) / 6e4))} min</p>`).join('')}</div>`));
  }
  if (tab === 'shop') {
    if (!hasHouse()) body.appendChild(el('<p>Buy a house from a housing steward, and you can hire a shopkeeper to sell for you there.</p>'));
    else {
      body.appendChild(el('<p style="font-size:13px;margin:0 0 4px">Your shopkeeper sells while you play and while you\'re away. Price near what a thing is worth and it goes quickly; much above, slowly or never. You keep 97%.</p>'));
      for (const l of e.shop) { const c = el(`<div class="who"><div><b>${esc(l.item.name)}</b> <small>${l.price}g · worth about ${fairGear(l.item)}g</small></div><button>Take back</button></div>`); c.querySelector('button').onclick = () => { const r = shopTake(l); if (r) toast(r); refreshSheet(); }; body.appendChild(c); }
      if (e.shop.length < 6) for (const it of S.bag.filter(b => b.slot && !['collect', 'recipe', 'tome', 'junk'].includes(b.slot) && b.stats)) {
        const f = fairGear(it), c = el(`<div class="who"><div><b>${esc(it.name)}</b> <small>worth about ${f}g</small></div><div><button data-m=".9">${Math.round(f * .9)}g</button> <button data-m="1.1">${Math.round(f * 1.1)}g</button> <button data-m="1.5">${Math.round(f * 1.5)}g</button></div></div>`);
        c.onclick = ev => { const k = +ev.target.dataset?.m; if (k) { const r = shopAdd(it, f * k); if (r) toast(r); refreshSheet(); } }; body.appendChild(c); }
    }
  }
  if (tab === 'comm') {
    body.appendChild(el('<p style="font-size:13px;margin:0 0 4px">Pay a crafter up front, and they make a piece for your class and level. Masters, all of them, so sometimes it comes out a masterwork.</p>'));
    for (const c of e.comm) body.appendChild(el(`<p style="font-size:13px;margin:2px 0">${esc(c.by)}: a ${c.slot}, ready in about ${Math.max(1, Math.ceil((c.done - now()) / 6e4))} min</p>`));
    for (const c of crafters()) { const slots = ['head', 'chest', 'legs', 'feet', 'weapon', 'off', 'ring', 'neck'].filter(s => recipeFor(c.prof, L(), s));
      if (!slots.length) continue;
      const card = el(`<div class="card" style="text-align:left"><h3>${esc(c.name)} <small>${esc(Craft.PROFS[c.prof].name)}</small></h3><div class="acts">${slots.map(s => `<button data-s="${s}">${s}</button>`).join('')}</div></div>`);
      card.onclick = ev => { const s = ev.target.dataset?.s; if (s) { const r = commission(c, s); if (r) toast(r); refreshSheet(); } }; body.appendChild(card); }
  }
}]);
// time away: the shop keeps selling, the caravans keep moving
{ let first = true; X.tick.push(() => { if (!first || !S.hero) return; first = false; const e = E(), hrs = (now() - (e.shopT || now())) / 36e5; if (hrs > .05) shopSell(Math.min(hrs, 72)); caravanTick(); }); X.tick.push(() => { E().shopT = now(); }); }
