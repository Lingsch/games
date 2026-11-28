// Build 8: your group pulls its weight between fights. Allies walk over to bodies with loot on them and
// open them, which puts the good things up for need/greed rolls, and they pick herbs, ore, fish and wrecks
// within a few steps of where they stand. Plus a stats page for you and everyone with you.
import { S, pick, irnd, dist, chat, X } from './core.js';
import { CLASSES, RARITY, SLOT_NAMES, BOOK, rankOf, roleOf, MAX_LVL, xpNeed, statText, mainsOf, STAT_NAMES } from './data.js';
import * as Cb from './combat.js';
import * as Craft from './crafting.js';
import * as Game from './game.js';
import { aiHooks } from './ai.js';

const LOOT_R = 14, NODE_R = 8;          // how far from themselves an ally will go for a body, and for a node
const fighting = () => S.party.some(p => !p.dead && Cb.inCombat(p)) || S.ents.some(m => m.mob && !m.dead && m.engaged && [...m.threat.keys()].some(k => k.inParty));

// ---------- gathering: any ally, not only friends with a job ----------
// a friend with a gathering job uses their own skill; anyone else gathers what you could, or the easy nodes
const reqOk = (e, n) => { const prof = Craft.NODE_PROF[n.type], fr = (S.friends || []).find(f => f.name === e.name), job = fr?.craft?.gather === prof ? Craft.skill(prof, fr) : null;
  const mine = Craft.skill(prof); return Math.max(job ?? -1, mine ?? -1, 1) >= n.req ? (job != null ? fr : null) : false; };
function allyTasks() {
  const h = S.hero; if (!h || h.dead || h.casting || fighting()) return;
  const busy = new Set(S.party.map(p => p.gatherTask?.ent).filter(Boolean));
  for (const e of S.party) {
    if (e.isHero || e.dead || e.gatherTask || e.pull || S.cmd === 'hold' || Cb.inCombat(e) || dist(e, h) > 25) continue;
    // a body with something on it comes first
    const body = S.ents.find(m => m.mob && m.dead && !m.remove && m.lootFor === 'party' && (m.loot?.length || m.lootGold) && !busy.has(m) && dist(m, e) < LOOT_R);
    if (body) { e.gatherTask = { ent: body, t: 0, body: true }; busy.add(body); continue; }
    const node = S.ents.find(x => x.prop?.node && !x.remove && !busy.has(x) && dist(x, e) < NODE_R && reqOk(e, x.prop.node) !== false);
    if (node) { e.gatherTask = { ent: node, t: 0, fr: reqOk(e, node.prop.node) || null }; busy.add(node); }
  }
}
// the old friend-job tick still runs; give its tasks the same rules
const oldGathered = aiHooks.gathered;
aiHooks.gathered = e => {
  const g = e.gatherTask;
  if (g?.body) { e.gatherTask = null; allyLoot(e, g.ent); Game.save(); return; }
  if (g && !g.fr) {
    // an ally without the job: what they pick goes to you, and nobody's skill goes up
    e.gatherTask = null; if (g.ent.remove) return;
    const p = g.ent.prop, n = p.node, got = Craft.nodeHooks.roll[n.type] ? Craft.nodeHooks.roll[n.type](n, null) : [[n.mat, irnd(1, 2)]];
    for (const [k, c] of got) Craft.addMat(k, c, true);
    if (got.length) chat('loot', null, `${e.name} gathers ${got.map(([k, c]) => `${c} ${Craft.MATS[k].name}`).join(' and ')} for you.`);
    for (const f of X.gathered || []) f(n.type, got);
    p.depleted = S.time + (n.regrow || 150); g.ent.remove = true; g.ent.dead = true; Game.save(); return;
  }
  oldGathered?.(e);
};
X.tick.push(dt => { aT += dt; if (aT > .5) { aT = 0; allyTasks(); } tickRolls(dt); });
let aT = 0;

// ---------- an ally opens a body ----------
const wants = (p, it) => it.book ? X.canStudy(p, it) : Game.canWear(p.cls, it);
function allyLoot(e, m) {
  if (m.remove || !m.loot) return;
  if (m.lootGold) { S.gold += m.lootGold; chat('loot', null, `${e.name} loots ${m.lootGold} gold for the group.`); m.lootGold = 0; }
  const keep = [];
  for (const it of m.loot) {
    if (it.recipe || it.collect) { Game.assignLoot({ loot: [it] }, it, S.hero); continue; }   // only you can learn these
    if (X.isSmall(it)) { if (!X.takeSmall(it, true)) keep.push(it); else chat('loot', null, `${e.name} hands you ${it.n > 1 ? it.n + ' ' + it.name + 's' : /^[AEIOU]/.test(it.name) ? 'an ' + it.name : 'a ' + it.name}.`); continue; }
    rolls.push({ it, t: ROLL_T, from: e.name, id: ++rollId });
  }
  m.loot = keep;
  drawRolls();
}

// ---------- need / greed ----------
const ROLL_T = 20;
let rolls = [], rollId = 0, box = null;
function resolve(r, mine) {
  rolls = rolls.filter(x => x !== r);
  const it = r.it, mates = S.party.filter(p => !p.isHero && !p.dead);
  const need = mates.filter(p => X.allyNeeds ? X.allyNeeds(p, it) : wants(p, it)), greed = mates.filter(p => !need.includes(p) && Math.random() < .35);
  const all = [...need.map(p => ({ p, kind: 'need', n: irnd(1, 100) })), ...greed.map(p => ({ p, kind: 'greed', n: irnd(1, 100) }))];
  if (mine && mine !== 'pass') all.push({ p: S.hero, kind: mine, n: irnd(1, 100) });
  all.sort((a, b) => (a.kind === 'need' ? 0 : 1) - (b.kind === 'need' ? 0 : 1) || b.n - a.n);
  const best = all[0];
  if (!best) { chat('party', null, r.from === 'You' ? `Everyone passed on ${it.name}. You sell it for ${it.value}g.` : `Everyone passed on ${it.name}. ${r.from} sells it, and gives you the ${it.value}g.`); S.gold += it.value; }
  else {
    chat('party', null, `${best.p.isHero ? 'You win' : best.p.name + ' wins'} ${it.name} (${best.kind} ${best.n}${all.length > 1 ? ', against ' + all.slice(1).map(x => `${x.p.isHero ? 'your' : x.p.name + "'s"} ${x.kind} ${x.n}`).join(', ') : ''}).`);
    if (best.p.isHero) { if (!Game.addToBag(it)) { if (S.bank.length < Game.BANK_SLOTS) { S.bank.push(it); chat('sys', null, `Your bags are full. ${it.name} goes to your bank.`); } else { S.gold += it.value; chat('sys', null, `No room anywhere. You sell ${it.name} for ${it.value}g.`); } } }
    else Game.assignLoot({ loot: [it] }, it, best.p);
    // greed on something a mate needed, and won, is noticed
    if (best.p.isHero && best.kind === 'need' && !wants(S.hero, it)) for (const p of need) { p.fake.mood--; }
  }
  Game.save(); drawRolls();
}
function tickRolls(dt) {
  if (!rolls.length) return;
  for (const r of [...rolls]) { r.t -= dt; if (r.t <= 0) resolve(r, 'pass'); }
  if (box) for (const d of box.children) { const r = rolls.find(x => x.id === +d.dataset.id); const b = d.querySelector('.rt'); if (r && b) b.style.width = Math.max(0, r.t / ROLL_T * 100) + '%'; }
}
const statLine = it => it.book ? (it.desc || '') : Object.entries(it.stats || {}).map(([k, v]) => statText(k, v)).join(' · ');
function drawRolls() {
  if (!box) { box = document.getElementById('rolls'); if (!box) return; box.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const r = rolls.find(x => x.id === +b.closest('.roll').dataset.id); if (r) resolve(r, b.dataset.k); }; }
  const esc = X.ui.esc || (s => s);
  box.innerHTML = rolls.slice(0, 3).map(r => { const it = r.it, can = wants(S.hero, it), cmp = !it.book && can ? S.gear[S.heroCls][it.slot] : null;
    const up = cmp ? Game.itemScore(it, Game.focusW(Game.gearPrefs().focus)) - Game.itemScore(cmp, Game.focusW(Game.gearPrefs().focus)) : 0;
    return `<div class="roll" data-id="${r.id}" style="--c:${RARITY[it.rarity].c}"><b>${esc(it.name)}</b><small>${SLOT_NAMES[it.slot] || it.slot} · L${it.lvl}${can ? (it.book ? '' : !cmp || up > 0 ? ' · <i class="up">upgrade</i>' : ' · <i class="down">sidegrade</i>') : ' · ' + esc(it.book && it.book.cls === S.heroCls ? (X.whyNot(S.hero, it.book.cls, it.book.key, it.book.rank) || '').replace(/\.$/, '').toLowerCase() : 'not for you')}</small><small class="dim">${esc(statLine(it))}</small>
      <div class="rb"><button data-k="need" ${can ? '' : 'disabled'}>🎲 Need</button><button data-k="greed">💰 Greed</button><button data-k="pass">Pass</button></div><i class="rt"></i></div>`; }).join('') + (rolls.length > 3 ? `<div class="dim" style="font-size:11px;text-align:center">+${rolls.length - 3} more</div>` : '');
}
X.rollsOpen = () => rolls.length;
X.rollItems = (items, from) => { for (const it of items) rolls.push({ it, t: ROLL_T, from, id: ++rollId }); drawRolls(); };

// ---------- stats: you and everyone with you ----------
const pctS = v => (v * 100).toFixed(1) + '%', cap = t => t[0].toUpperCase() + t.slice(1);
const BUFF_NAMES = { fed: 'Well fed', elixir: 'Elixir', scroll: 'Scroll', mounted: 'Mounted', guildbanner: 'Guild banner', slow: 'Slowed', root: 'Rooted', valor: 'Valor', vigor: 'Vigor', steel: 'Steel' };
const buffName = id => { if (BUFF_NAMES[id]) return BUFF_NAMES[id]; for (const c in CLASSES) if (CLASSES[c].abilities[id]) return CLASSES[c].abilities[id].name; return cap(id); };
function statCard(e) {
  const C = CLASSES[e.cls], esc = X.ui.esc, dr = e.armor / (e.armor + 60 + e.lvl * 14);
  const gear = e.isHero ? Object.values(S.gear[S.heroCls] || {}).filter(Boolean) : [];
  const ilvl = gear.length ? (gear.reduce((a, it) => a + it.lvl * (1 + it.rarity * .15), 0) / gear.length).toFixed(1) : null;
  const rows = [['Level', e.lvl + (e.lvl < MAX_LVL && e.isHero ? ` · ${Math.round(e.xp)} / ${xpNeed(e.lvl)} xp` : '')], ['Role', cap(roleOf(e) || '')], ['Health', `${Math.round(e.hp)} / ${e.maxHp}`], [e.resType[0].toUpperCase() + e.resType.slice(1), `${Math.round(e.res)} / ${e.resMax}`],
    ['Power', Math.round(e.power)], ['Armor', `${Math.round(e.armor)} (${pctS(dr)} less physical damage)`], ['Critical chance', pctS(e.crit)], ['Dodge', pctS(e.dodge)], ['Parry', pctS(e.parry || 0)],
    ['From gear', `${Math.round(e.gearPow || 0)} power (${mainsOf(e.cls).map(k => STAT_NAMES[k]).join(' + ')}) · ${Math.round(e.gearSta || 0)} stamina · ${Math.round(e.gearArm || 0)} armor${e.gearCrit ? ' · ' + e.gearCrit.toFixed(1) + '% crit' : ''}`]];
  // Build 13: the secondaries, shown only when you have some
  if (e.haste) rows.push(['Haste', pctS(e.haste)]);
  if (e.block) rows.push(['Block', pctS(e.block)]);
  if (e.spi) rows.push(['Spirit', `${e.spi} (+${e.spi}% ${e.resType === 'mana' ? 'mana and ' : ''}health regen)`]);
  if (e.mreg) rows.push(['Mana regen', `${e.mreg} every 5 seconds`]);
  const rs = Object.entries(e.resist || {}).filter(([, v]) => v > 0); if (rs.length) rows.push(['Resists', rs.map(([k, v]) => `${STAT_NAMES[k].replace(' resist', '')} ${v} (${pctS(Math.min(.75, v / (v + e.lvl * 2 + 15)))})`).join(' · ')]);
  if (ilvl) rows.push(['Average item level', ilvl]);
  if (!e.isHero && e.fake) rows.push(['Mood', e.fake.mood >= 4 ? 'Happy with you' : e.fake.mood >= 0 ? 'Content' : e.fake.mood > -3 ? 'Grumbling' : 'Thinking about leaving']);
  const buffs = (e.buffs || []).filter(b => b.dur > 0 && b.dur < 1e6).map(b => b.id), uniq = [...new Set(buffs)];
  if (uniq.length) rows.push(['Effects', uniq.map(buffName).join(', ')]);
  const sp = Object.values(C.abilities).filter(a => a.lvl <= e.lvl).map(a => (BOOK.code ? BOOK.code(e, a) > 1 : BOOK.rank(e, a) || rankOf(e, a) > 1) ? `${a.icon} ${BOOK.label ? BOOK.label(e, a) : a.name}` : null).filter(Boolean);
  return `<div class="card" style="text-align:left"><h3 style="color:${C.color}">${esc(e.name)} · ${C.name}</h3>${rows.map(([k, v]) => `<div class="stat"><span>${k}</span><span>${esc(String(v))}</span></div>`).join('')}${sp.length ? `<p style="margin:6px 0 0;font-size:12.5px"><b>Ranked spells:</b> ${sp.map(esc).join(' · ')}</p>` : ''}</div>`;
}
let statPick = 0;
export function statsHtml() {
  const who = S.party.filter(p => p.cls); if (statPick >= who.length) statPick = 0;
  return `<div class="card" style="text-align:left"><h3>Stats</h3><div class="seg" id="statSeg" style="flex-wrap:wrap">${who.map((p, i) => `<button data-sp="${i}" class="${i === statPick ? 'on' : ''}">${p.isHero ? 'You' : X.ui.esc(p.name)}</button>`).join('')}</div></div>${who[statPick] ? statCard(who[statPick]) : ''}`;
}
export function statsClick(ev) { const b = ev.target.closest('[data-sp]'); if (!b) return false; statPick = +b.dataset.sp; X.ui.refreshSheet(); return true; }

// ---------- selling the trade goods in one go ----------
export function sellJunk() { const j = S.bag.filter(it => it.junk); if (!j.length) return 0; const g = j.reduce((a, it) => a + it.value, 0); S.bag = S.bag.filter(it => !it.junk); S.gold += g; chat('sys', null, `You sell ${j.length} trade goods for ${g} gold.`); Game.save(); return g; }
