// Build 13.3: look an ally over and trade with them.
//   Inspect: their gear, their numbers, every spell they know with its rank (and which tomes they could still use), and their specialization.
//   Trade: only opens when you press Trade. You put things in from your bags; they only take what they'd actually use.
//   Your companions can hand back what you gave them; anyone else pays you half its worth for an upgrade.
import { S, X, chat, pick } from './core.js';
import { CLASSES, SLOT_NAMES, RARITY, STAT_NAMES, PCT_STATS, BOOK } from './data.js';
import * as Game from './game.js';
import { dollOf, friendOf } from './comp9.js';

const DOLL = ['weapon', 'off', 'head', 'chest', 'legs', 'feet', 'ring', 'neck'];
const pctTxt = v => (v * 100).toFixed(1).replace(/\.0$/, '') + '%';
X.isCompanion = e => friendOf(e);
// would they take this from you, and if not, why not
export function wouldTake(e, it) {
  if (it.book) return X.canStudy?.(e, it) ? null : 'They can\'t study that one.';
  if (!it.stats || it.junk || it.mat || it.pot) return 'Nothing they can use.';
  if (!Game.canWear(e.cls, it)) return `A ${CLASSES[e.cls].name} can't use that.`;
  return X.allyNeeds?.(e, it) ? null : 'Not better than what they have.';
}
const usable = e => S.bag.filter(it => it.book || (it.stats && !it.junk && !it.mat && !it.pot && Game.canWear(e.cls, it)));

X.allyInspect = (t, body) => {
  const { el, esc, rkBadge, spellTier } = X.ui, C = CLASSES[t.cls];
  // gear
  const g = el(`<div class="card" style="text-align:left"><h3>Gear</h3></div>`);
  if (friendOf(t)) {
    const d = dollOf(t.name);
    g.insertAdjacentHTML('beforeend', DOLL.map(s => { const it = d[s]; return `<div class="who"><div><small class="dim">${SLOT_NAMES[s] || s}</small><br>${it ? `<b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b> <small>L${it.lvl}</small>` : '<small class="dim">level ' + t.lvl + ' kit</small>'}</div></div>`; }).join(''));
  } else g.insertAdjacentHTML('beforeend', `<p style="margin:2px 0">Level ${t.lvl} kit${t.bonusPow ? `, plus +${Math.round(t.bonusPow)} power from things you've given them` : ''}.</p>`);
  body.appendChild(g);
  // numbers
  const row = [['Health', Math.round(t.maxHp)], ['Power', Math.round(t.power)], ['Armor', Math.round(t.armor)], ['Crit', pctTxt(t.crit || 0)], ['Haste', pctTxt(t.haste || 0)], ['Dodge', pctTxt(t.dodge || 0)], ['Parry', pctTxt(t.parry || 0)]];
  if (t.block) row.push(['Block', pctTxt(t.block)]);
  if (t.resType) row.push([t.resType[0].toUpperCase() + t.resType.slice(1), `${Math.round(t.res)} / ${Math.round(t.resMax)}`]);
  body.appendChild(el(`<div class="card" style="text-align:left"><h3>Stats</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:2px 10px">${row.map(([k, v]) => `<div><small class="dim">${k}</small> <b>${v}</b></div>`).join('')}</div></div>`));
  // spells and ranks
  const abs = Object.entries(C.abilities).filter(([k, ab]) => ab.lvl <= t.lvl && !ab.passive);
  const could = [];
  const sp = abs.map(([k, ab]) => {
    const r = BOOK.rank(t, ab) || 0, tier = spellTier(t, ab);
    for (const nr of [1, 2]) if (nr > r && !X.whyNot?.(t, t.cls, k, nr)) { could.push(`${BOOK.names[nr]}'s Tome: ${ab.name}`); break; }
    return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><span style="position:relative;display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:5px;background:#0006;${tier > 1 ? 'box-shadow:0 0 0 2px ' + ['', '', '#4aa3ff', '#b35cff', '#ff9a2a'][tier] : ''}">${ab.icon || '•'}${rkBadge(tier)}</span><span>${esc(r ? BOOK.names[r] + ' ' + ab.name : ab.name)}</span></div>`;
  }).join('');
  body.appendChild(el(`<div class="card" style="text-align:left"><h3>Spells</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:0 10px">${sp}</div>${could.length ? `<p class="dim" style="margin:6px 0 0">Tomes they could use now: ${could.map(esc).join(', ')}.</p>` : ''}</div>`));
  // specialization
  const spec = X.allySpec?.(t);
  body.appendChild(el(`<div class="card" style="text-align:left"><h3>Talents</h3>${spec ? `<p style="margin:2px 0"><b>${esc(spec.name)}</b>. ${esc(spec.desc)}</p><p class="dim" style="margin:2px 0">${Object.entries(spec.stats || {}).map(([k, v]) => `+${Math.round(v * 100)}% ${{ hpP: 'health', armorP: 'armor', powP: 'power' }[k] || STAT_NAMES[k] || k}`).join(', ')}</p>` : `<p class="dim" style="margin:2px 0">No specialization yet. They choose one at level 20.</p>`}</div>`));
  const a = el('<div class="acts"><button class="pri">Trade</button></div>'); a.firstChild.onclick = () => X.openTrade(t); body.appendChild(a);
};

// ---------- the trade window ----------
let offer = new Set(), ask = new Set(), with_ = null;
X.openTrade = t => {
  if (!t?.fake || t.dead) return;
  if (with_ !== t) { offer = new Set(); ask = new Set(); with_ = t; }
  const { el, esc, openSheet, refreshSheet, closeSheet, toast } = X.ui;
  openSheet(`Trade with ${t.name}`, body => {
    if (!S.party.includes(t)) { body.appendChild(el('<p>They need to be in your group to trade.</p>')); return; }
    const comp = friendOf(t), d = comp ? dollOf(t.name) : {};
    for (const it of [...offer]) if (!S.bag.includes(it) || wouldTake(t, it)) offer.delete(it);
    const pay = comp ? 0 : [...offer].reduce((n, it) => n + Math.round((it.value || 0) * .5), 0);
    const mine = usable(t);
    const left = el(`<div class="card" style="text-align:left"><h3>You give</h3>${mine.length ? '' : '<p class="dim">Nothing in your bags they could use.</p>'}</div>`);
    mine.forEach((it, i) => {
      const why = wouldTake(t, it), on = offer.has(it);
      const r = el(`<div class="who"><div><b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b> <small>L${it.lvl}</small><br><small class="${why ? 'dim' : ''}">${why || (it.book ? 'They can study this.' : 'An upgrade for them.')}</small></div><div><button ${why ? 'disabled' : ''} class="${on ? 'pri' : ''}">${on ? 'In trade' : 'Add'}</button></div></div>`);
      r.querySelector('button').onclick = () => { on ? offer.delete(it) : offer.add(it); refreshSheet(); };
      left.appendChild(r);
    });
    body.appendChild(left);
    const right = el(`<div class="card" style="text-align:left"><h3>They give</h3></div>`);
    if (comp) {
      const worn = DOLL.filter(s => d[s]);
      if (!worn.length) right.insertAdjacentHTML('beforeend', '<p class="dim">Nothing you gave them. Their level kit isn\'t theirs to hand over.</p>');
      for (const s of worn) { const it = d[s], on = ask.has(s);
        const r = el(`<div class="who"><div><small class="dim">${SLOT_NAMES[s]}</small><br><b style="color:${RARITY[it.rarity].c}">${esc(it.name)}</b></div><div><button class="${on ? 'pri' : ''}">${on ? 'Asked for' : 'Ask for it'}</button></div></div>`);
        r.querySelector('button').onclick = () => { on ? ask.delete(s) : ask.add(s); refreshSheet(); }; right.appendChild(r); }
    } else right.insertAdjacentHTML('beforeend', `<p style="margin:2px 0">${pay ? `<b style="color:var(--acc)">${pay}g</b> for what you're giving.` : '<span class="dim">They\'ll pay half its worth for anything that helps them.</span>'}</p>`);
    body.appendChild(right);
    const acts = el(`<div class="acts"><button class="pri" ${offer.size || ask.size ? '' : 'disabled'}>Trade</button><button>Cancel</button></div>`);
    acts.children[0].onclick = () => {
      const got = [];
      for (const s of ask) { const it = d[s]; if (!it) continue; if (!Game.addToBag(it, true)) { toast('Your bags are full.'); break; } delete d[s]; got.push(it.name); }
      if (ask.size) Game.fakeGear(t);
      for (const it of offer) { S.bag = S.bag.filter(x => x !== it); Game.assignLoot({ loot: [it] }, it, t); }
      if (pay) { S.gold += pay; chat('loot', null, `${t.name} pays you ${pay}g.`); }
      if (got.length) chat('loot', null, `${t.name} hands you ${got.join(', ')}.`);
      if (!offer.size && got.length) chat('party', t.name, pick(['here you go', 'all yours', 'np, take it']));
      offer = new Set(); ask = new Set(); Game.save(); closeSheet();
    };
    acts.children[1].onclick = () => { offer = new Set(); ask = new Set(); closeSheet(); };
    body.appendChild(acts);
  });
};
