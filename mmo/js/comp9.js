// Build 9: your companions' gear, training and pets.
//   Gear: every friend has a full set of slots. They put on upgrades they win by themselves, and you can hand
//   them anything from your bags (or take it back). Each worn piece replaces what their level would give them.
//   Training: gold buys ranks in Weapon Drill, Endurance, Footwork and Battle Sense.
//   Pets: Binders and Druids choose how their pets look, and pay to make them stronger.
import * as THREE from './three.js';
import { S, X, chat, pick } from './core.js';
import { CLASSES, SLOTS, SLOT_NAMES, RARITY, PETS, mainVal, SEC_KEYS } from './data.js';
import * as R from './render.js';
import * as Game from './game.js';
import * as Cb from './combat.js';

const DOLL = ['weapon', 'off', 'head', 'chest', 'legs', 'feet', 'ring', 'neck'];
const doll = name => { S.ext.cgear = S.ext.cgear || {}; return (S.ext.cgear[name] = S.ext.cgear[name] || {}); };
const isFriend = e => e?.fake && (S.friends || []).some(f => f.name === e.name);
const score = (it, cls) => it ? mainVal(it.stats, cls) * 1.2 + (it.stats.sta || 0) + (it.stats.arm || 0) * .25 + ((it.stats.crit || 0) + (it.stats.haste || 0)) * 4 + ((it.stats.dodge || 0) + (it.stats.parry || 0) + (it.stats.block || 0)) * (CLASSES[cls]?.role === 'tank' ? 4 : 0) : 0;
// what a companion's level gives them in an empty slot (the old fixed allowance, spread across the slots)
const share = (e, k) => k === 'pow' ? (e.lvl * 2.2 + 2) / DOLL.length : k === 'sta' ? (e.lvl * 3 + 3) / DOLL.length : 0;
X.dollGear = e => {
  if (!isFriend(e)) return;
  const d = doll(e.name); e.gearCrit = 0;
  const g = e.g13 = e.g13 || {}; for (const s of DOLL) { const it = d[s]; if (!it) continue; for (const q of SEC_KEYS) if (it.stats[q]) g[q] = (g[q] || 0) + it.stats[q]; if (s === 'off') e.hasShield = it.type === 'shield'; e.gearPow += mainVal(it.stats, e.cls) - share(e, 'pow'); e.gearSta += (it.stats.sta || 0) - share(e, 'sta'); e.gearArm += (it.stats.arm || 0) * .9; e.gearCrit = (e.gearCrit || 0) + (it.stats.crit || 0); }
  e.gearPow = Math.max(1, Math.round(e.gearPow)); e.gearSta = Math.max(1, Math.round(e.gearSta));
};
const refit = e => Game.fakeGear(e);
// a friend handed (or winning) a piece of gear puts it on if it's better, and gives you back what it replaces
X.compTake = (who, it) => {
  if (!isFriend(who) || !SLOTS.includes(it.slot) && !['ring', 'neck'].includes(it.slot)) return false;
  if (!Game.canWear(who.cls, it)) { S.gold += it.value; chat('party', who.name, `can't wear that one, sold it, ${it.value}g is yours`); return true; }
  const d = doll(who.name), old = d[it.slot];
  if (old && score(old, who.cls) >= score(it, who.cls)) { S.gold += it.value; chat('party', who.name, `mine's better, sold it for ${it.value}g`); return true; }
  d[it.slot] = it; refit(who); who.fake.mood += 2;
  if (old && !Game.addToBag(old, true)) S.gold += old.value;
  chat('loot', null, `${who.name} puts on ${it.name}.`); chat('party', who.name, pick(['ty!! that\'s an upgrade', 'ooh shiny, thanks', 'putting it on now', 'nice, much better than what I had']));
  return true;
};
// Build 13.2: would this ally roll Need? A tome they can study, or gear that's a real upgrade on what they wear. No dice-rolling about it.
X.allyNeeds = (p, it) => {
  if (!p || !it || p.isHero) return false;
  if (it.book) return !!X.canStudy?.(p, it);
  if (it.slot === 'collect' || it.slot === 'recipe' || it.junk || !it.stats || !Game.canWear(p.cls, it)) return false;
  if (isFriend(p)) { const cur = doll(p.name)[it.slot]; return cur ? score(it, p.cls) > score(cur, p.cls) * 1.02 : (it.lvl || 1) >= p.lvl - 5; }
  return (it.lvl || 1) >= p.lvl - 3 && (it.rarity || 0) >= 1;
};
export const dollOf = doll, friendOf = isFriend, gearScore = score;
export function giveTo(who, it) { S.bag = S.bag.filter(x => x !== it); if (!X.compTake(who, it)) Game.addToBag(it, true); Game.save(); }
export function takeBack(who, slot) { const d = doll(who.name), it = d[slot]; if (!it) return; if (!Game.addToBag(it, true)) { X.ui.toast("Your bags are full."); return; } delete d[slot]; refit(who); Game.save(); }

// ---------- training ----------
export const DRILLS = { drill: ['Weapon Drill', '⚔️', 'powP', .03, '% power'], endure: ['Endurance', '❤️', 'hpP', .04, '% health'], foot: ['Footwork', '🦶', 'dodge', .015, '% dodge'], sense: ['Battle Sense', '🧠', 'crit', .01, '% critical chance'] };
const train = name => { S.ext.ctrain = S.ext.ctrain || {}; return (S.ext.ctrain[name] = S.ext.ctrain[name] || {}); };
export const drillCost = (e, r) => Math.round((10 + e.lvl * 4) * (r + 1));
export function doDrill(e, k) { const t = train(e.name), r = t[k] || 0; if (r >= 5) return 'Already fully trained.'; const c = drillCost(e, r); if (S.gold < c) return 'Not enough gold.'; S.gold -= c; t[k] = r + 1; Cb.recalc(e); Game.save(); return null; }
X.trainBonus = e => { if (!e?.fake || !S.ext.ctrain?.[e.name]) return null; const t = S.ext.ctrain[e.name], o = {}; for (const [k, [, , st, v]] of Object.entries(DRILLS)) if (t[k]) o[st] = (o[st] || 0) + v * t[k]; return o; };
// fold training into the account-bonus hook alongside race and talents
{ const prev = X.acctOf; X.acctOf = e => { const a = prev(e), t = X.trainBonus(e); if (!t) return a; const o = { ...a }; for (const [k, v] of Object.entries(t)) o[k] = (o[k] || 0) + v; return o; }; }

// ---------- pets: looks and ranks ----------
const LOOKS = { '': 'Natural', ashen: 'Ashen', spectral: 'Spectral', gilded: 'Gilded', verdant: 'Verdant' };
const TINT = { ashen: [.55, .55, .55, .4], spectral: [.55, .8, 1, .65], gilded: [1, .82, .35, .6], verdant: [.4, .9, .45, .55] };
const pets = () => (S.ext.pets = S.ext.pets || {});
X.petLook = (key, kind) => { const l = pets()[key]?.look; return l ? kind + '~' + l : kind; };
X.petRank = key => pets()[key]?.rank || 0;
// tinted pet models are built the first time they're seen
{ const prev = X.lazyKind; X.lazyKind = kk => {
  if (kk && kk.includes('~')) { const [base, look] = kk.split('~'), K = R.kinds[base], tn = TINT[look]; if (!K || !tn) return null;
    const g = K.mesh.geometry.clone(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'pivot', 'part', 'glow'].includes(n)) g.deleteAttribute(n);
    const c = g.attributes.color, tc = new THREE.Color(tn[0], tn[1], tn[2]);
    for (let i = 0; i < c.count; i++) { const l = (c.getX(i) + c.getY(i) + c.getZ(i)) / 3; c.setXYZ(i, c.getX(i) * (1 - tn[3]) + tc.r * l * 1.6 * tn[3], c.getY(i) * (1 - tn[3]) + tc.g * l * 1.6 * tn[3], c.getZ(i) * (1 - tn[3]) + tc.b * l * 1.6 * tn[3]); }
    R.addKinds({ [kk]: [g, [.5, .45, 1.4, .2], .05, .03] }); return R.kinds[kk]; }
  return prev ? prev(kk) : null; }; }
const PET_CLS = { binder: ['firepet', 'golempet', 'waterpet', 'stormpet'], druid: ['treant'] };
export const petCost = r => 40 + r * 60;

// ---------- the Companions page ----------
X.book.push(['comp', 'Companions', body => {
  const { el, esc, refreshSheet, toast } = X.ui;
  const mates = S.party.filter(isFriend);
  if (!mates.length) body.appendChild(el('<p>None of your friends are with you right now.</p>'));
  for (const m of mates) {
    const C = CLASSES[m.cls], d = doll(m.name), t = train(m.name);
    const card = el(`<div class="card" style="text-align:left"><h3 style="color:${C.color}">${esc(m.name)} <small class="dim">L${m.lvl} ${esc(X.clsName ? X.clsName(m) : C.name)}</small></h3><div class="slots"></div><p class="setl" style="margin:8px 0 4px">Training</p><div class="drills"></div></div>`);
    const sl = card.querySelector('.slots');
    for (const s of DOLL) {
      const it = d[s], fits = S.bag.filter(b => b.slot === s && Game.canWear(m.cls, b));
      const row = el(`<div class="who"><div><small class="dim">${SLOT_NAMES[s] || s}</small><br>${it ? `<b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b> <small>L${it.lvl}</small>` : '<small class="dim">nothing (their level covers it)</small>'}</div><div>${fits.length ? '<button data-a="give">Give…</button>' : ''}${it ? '<button data-a="back">Take</button>' : ''}</div></div>`);
      row.onclick = ev => { const a = ev.target.closest('button')?.dataset.a; if (a === 'back') { takeBack(m, s); refreshSheet(); }
        if (a === 'give') { const box = row.querySelector('div:last-child'); box.innerHTML = fits.map((b, i) => `<button data-i="${i}" style="color:${RARITY[b.rarity].c}">${esc(b.name)}</button>`).join(''); }
        const i = ev.target.closest('button')?.dataset.i; if (i != null) { giveTo(m, fits[+i]); refreshSheet(); } };
      sl.appendChild(row);
    }
    const dr = card.querySelector('.drills');
    for (const [k, [name, icon, , v, unit]] of Object.entries(DRILLS)) {
      const r = t[k] || 0, row = el(`<div class="who"><div><b>${icon} ${name}</b> <small>${r}/5 · +${+(v * r * 100).toFixed(1)}${unit}</small></div>${r < 5 ? `<button>Train (${drillCost(m, r)}g)</button>` : ''}</div>`);
      row.querySelector('button')?.addEventListener('click', () => { const why = doDrill(m, k); if (why) toast(why); refreshSheet(); });
      dr.appendChild(row);
    }
    body.appendChild(card);
  }
  const pk = PET_CLS[S.heroCls];
  if (pk) {
    const card = el(`<div class="card" style="text-align:left"><h3>Your pets</h3></div>`);
    for (const k of pk) {
      const p = pets()[k] || {}, r = p.rank || 0;
      const row = el(`<div style="margin:6px 0"><b>${esc(PETS[k].name)}</b> <small>rank ${r}/5 · +${r * 8}% health and power</small><div class="seg" style="flex-wrap:wrap;margin:4px 0">${Object.entries(LOOKS).map(([lk, ln]) => `<button data-l="${lk}" class="${(p.look || '') === lk ? 'on' : ''}">${ln}</button>`).join('')}</div>${r < 5 ? `<button data-up="1">Strengthen (${petCost(r)}g)</button>` : ''}</div>`);
      row.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const st = (pets()[k] = pets()[k] || {});
        if (b.dataset.l != null) { st.look = b.dataset.l; for (const e of S.ents) if (e.pet?.owner === S.hero && e.pet.key === k) e.kind = X.petLook(k, PETS[k].kind); }
        if (b.dataset.up) { if (S.gold < petCost(st.rank || 0)) return toast('Not enough gold.'); S.gold -= petCost(st.rank || 0); st.rank = (st.rank || 0) + 1; for (const e of S.ents) if (e.pet?.owner === S.hero && e.pet.key === k) Cb.recalcPet(e); }
        Game.save(); refreshSheet(); };
      card.appendChild(row);
    }
    body.appendChild(card);
  }
}, () => S.party.some(isFriend) || !!PET_CLS[S.heroCls]]);
