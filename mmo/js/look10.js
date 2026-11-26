// Build 10: looks. A wardrobe for you and your companions: change outfit (your class's three looks), dye it,
// and visit the barber for skin and height. Common dyes are sold by the wardrobe-keepers; the four raids each
// drop a dye of their own. Changes are made at a wardrobe-keeper in town, or in front of a mirror at home.
import * as THREE from './three.js';
import { S, X, chat, dist } from './core.js';
import { CLASSES, GIVERS } from './data.js';
import { TALK } from './dialogue.js';
import { world, hgt } from './world.js';
import * as R from './render.js';
import * as Cb from './combat.js';
import * as Game from './game.js';
import { RACES, raceOf } from './race9.js';

export const DYES = {
  '': ['Undyed', null, 0], crimson: ['Crimson', '#b02a2a', 25], azure: ['Azure', '#2a6ad0', 25], forest: ['Forest', '#2a7a3a', 25], violet: ['Violet', '#7a3ab0', 25],
  ivory: ['Ivory', '#f2ead8', 40], onyx: ['Onyx', '#2a2a30', 40], amber: ['Amber', '#d08a2a', 40], rose: ['Rose', '#e07a9a', 40],
  starless: ['Starless', '#3a2a5a', 0, 'herald'], frost: ['Winter-Crowned', '#a8e0ff', 0, 'frostking'], gilded: ['Gilded', '#ffcf4a', 0, 'sabine'], ember: ['Doorbreaker', '#ff5a1a', 0, 'handofvhorun'],
};
const SKIN_OPTS = { human: ['#e0b08a', '#c68e62', '#8d5a3b', '#f0c9a6', '#5a3a26', '#d9a07a'], varr: ['#8a6a4a', '#6a4a32', '#a08060', '#4a3628', '#b09070'], grael: ['#8a8478', '#6a6460', '#a09a8c', '#5a5450', '#7a6a5a'], sallow: ['#a8b8bc', '#8a9ca8', '#c8d4d8', '#7a8a9a', '#b0a8c0'] };
const ALL_SKINS = [...new Set(Object.values(SKIN_OPTS).flat())].map(c => new THREE.Color(c));
const look = who => who === 'hero' ? (S.ext.look = S.ext.look || { out: 0, dye: '', skin: -1, h: 0 }) : ((S.ext.clook = S.ext.clook || {})[who] = S.ext.clook[who] || { out: -1, dye: '', skin: -1, h: 0 });
const owned = () => (S.ext.dyes = S.ext.dyes || {});
for (const [k, d] of Object.entries(DYES)) if (d[3]) X.kill.push(m => { if (m.mob === d[3] && !owned()[k]) { owned()[k] = true; chat('loot', null, `New dye: ${d[0]}! Dye your clothes at a wardrobe-keeper or a mirror.`); } });

// the kind string: model[_race][^dye.skin.height]
function kindFor(e, L) {
  const C = CLASSES[e.cls]; if (!C) return null;
  const out = L.out >= 0 ? L.out : Math.max(0, C.models.indexOf(e.kind.replace(/[_^].*$/, '')));
  const race = raceOf(e), base = C.models[Math.min(out, 2)] + (race !== 'human' ? '_' + race : '');
  return L.dye || L.skin >= 0 || L.h ? `${base}^${L.dye}.${L.skin}.${L.h}` : base;
}
{ const prev = X.lazyKind; X.lazyKind = kk => {
  if (!kk || !kk.includes('^')) return prev ? prev(kk) : null;
  const [b, code] = kk.split('^'), [dye, skin, h] = code.split('.'), K = R.kinds[b] || (prev && prev(b)); if (!K) return null;
  const g = K.mesh.geometry.clone(); for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'pivot', 'part', 'glow'].includes(n)) g.deleteAttribute(n);
  const race = b.match(/_(varr|grael|sallow)$/)?.[1] || 'human', newSkin = +skin >= 0 ? new THREE.Color(SKIN_OPTS[race][+skin] || SKIN_OPTS[race][0]) : null, dc = DYES[dye]?.[1] ? new THREE.Color(DYES[dye][1]) : null;
  const col = g.attributes.color, glow = g.attributes.glow, pos = g.attributes.position, piv = g.attributes.pivot, sy = 1 + (+h || 0) * .035;
  for (let i = 0; i < col.count; i++) {
    const r = col.getX(i), gg = col.getY(i), bb = col.getZ(i);
    let isSkin = false, k = 1; for (const s of ALL_SKINS) { const q = r / s.r; if (q > .88 && q < 1.08 && Math.abs(gg / s.g - q) < .025 && Math.abs(bb / s.b - q) < .025) { isSkin = true; k = q; break; } }
    if (isSkin) { if (newSkin) col.setXYZ(i, newSkin.r * k, newSkin.g * k, newSkin.b * k); }
    else if (dc && glow.getX(i) < .1) { const l = (r + gg + bb) / 3, w = .7, f = .3 + l * .9; col.setXYZ(i, r * (1 - w) + dc.r * f * w, gg * (1 - w) + dc.g * f * w, bb * (1 - w) + dc.b * f * w); }
    if (sy !== 1) { pos.setY(i, pos.getY(i) * sy); piv.setY(i, piv.getY(i) * sy); }
  }
  g.computeBoundingSphere();
  const robe = /^(cleric|elem|warlock|binder|illusionist|lifebinder|druid)/.test(b);
  R.addKinds({ [kk]: [g, robe ? [.4, .35, 1.4, .1] : [.6, .4, 1.6, .15], robe ? .03 : .05, .03] }); return R.kinds[kk];
}; }
// keep everyone dressed the way you chose (after the race tick has had its turn)
let lT = 0;
X.tick.push(dt => {
  if ((lT -= dt) > 0) return; lT = .5;
  const h = S.hero; if (!h || !h.cls) return;
  if (S.ext.look) { const k = kindFor(h, S.ext.look); if (k && h.kind !== k) h.kind = k; }
  if (S.ext.clook) for (const p of S.party) if (!p.isHero && S.ext.clook[p.name] && p.cls) { const k = kindFor(p, S.ext.clook[p.name]); if (k && p.kind !== k) p.kind = k; }
});

// ---------- where you can change: a wardrobe-keeper, or a mirror at home ----------
GIVERS.wardrobe = { name: 'Wardrobe-Keeper', title: 'Outfits, dyes and the barber', model: 'villager1' };
TALK.wardrobe = { bio: 'Ottoline Thimble keeps a wardrobe, a dye-vat and a barber\'s chair in every kingdom, and claims to have personally trimmed the beard of every king in the last forty years. Two of the kings deny it. One of them has no beard.', greet: ['You look like you\'ve been dragged through a dungeon backwards. Sit. Let me fix that.', 'Dyes, a trim, a new coat? Heroes always want to look heroic and never want to pay for it.'], topics: [] };
const TOWNS = ['vale', 'weald', 'kiln', 'hush', 'coast', 'wastes', 'north', 'crown'];
X.zone.push(zone => {
  if (!TOWNS.includes(zone) || !world.town) return;
  const t = world.town, a = 2.3, e = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: 'Ottoline Thimble', title: GIVERS.wardrobe.title, kind: 'villager1', x: t.x + Math.cos(a) * ((t.R || 20) * .5), z: t.z + Math.sin(a) * ((t.R || 20) * .5), giver: 'wardrobe' });
  e.y = hgt(e.x, e.z);
});
X.talk.push((k, n, api) => k === 'wardrobe' ? [['▸ Open the wardrobe.', () => { api.close(); X.ui.openBook('looks'); }, 'hl']] : []);
export const canChange = () => S.ents.some(e => !e.dead && dist(e, S.hero) < 6 && (e.giver === 'wardrobe' || e.prop?.furn?.k === 'mirror'));

X.book.push(['looks', 'Looks', body => {
  const { el, esc, toast, refreshSheet } = X.ui, here = canChange();
  const who = X.lookWho && (X.lookWho === 'hero' || S.party.some(p => p.name === X.lookWho)) ? X.lookWho : 'hero';
  const ent = who === 'hero' ? S.hero : S.party.find(p => p.name === who), L = look(who), race = raceOf(ent);
  body.appendChild(el(`<p style="margin:0 0 6px">${here ? 'Choose a look.' : 'Visit a wardrobe-keeper in town, or stand by a mirror at home, to change your looks.'} Your pets' looks are on the Companions page.</p>`));
  const tabs = el(`<div class="acts">${[['hero', 'You'], ...S.party.filter(p => !p.isHero && p.cls && !p.pet).map(p => [p.name, p.name])].map(([k, n]) => `<button data-w="${esc(k)}" ${k === who ? 'style="outline:3px solid var(--acc)"' : ''}>${esc(n)}</button>`).join('')}</div>`);
  tabs.onclick = ev => { const b = ev.target.closest('button'); if (b) { X.lookWho = b.dataset.w; refreshSheet(); } }; body.appendChild(tabs);
  const ON = 'style="outline:3px solid var(--acc)"';
  const set = (k, v, cost = 0) => { if (!here) return toast('You need a wardrobe-keeper or a mirror.'); if (cost && S.gold < cost) return toast('Not enough gold.'); S.gold -= cost; L[k] = v; Game.save(); refreshSheet(); };
  const C = CLASSES[ent.cls], curOut = L.out >= 0 ? L.out : Math.max(0, C.models.indexOf(ent.kind.replace(/[_^].*$/, '')));
  const o = el(`<div class="card" style="text-align:left"><h3>Outfit</h3><div class="acts">${[0, 1, 2].map(i => `<button data-o="${i}" ${i === curOut ? ON : ''}>${['First', 'Second', 'Third'][i]}</button>`).join('')}</div></div>`);
  o.onclick = ev => { const b = ev.target.closest('button'); if (b) set('out', +b.dataset.o); }; body.appendChild(o);
  const d = el(`<div class="card" style="text-align:left"><h3>Dye</h3><div class="acts">${Object.entries(DYES).filter(([k, v]) => !v[3] || owned()[k]).map(([k, v]) => `<button data-d="${k}" style="${v[1] ? `border-left:6px solid ${v[1]};` : ''}${L.dye === k ? 'outline:3px solid var(--acc)' : ''}">${esc(v[0])}${v[2] && !owned()[k] ? ` (${v[2]}g)` : ''}</button>`).join('')}</div><p style="font-size:12px;margin:4px 0 0">Buying a dye keeps it for good. Each of the four great raids has a dye of its own.</p></div>`);
  d.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const k = b.dataset.d, v = DYES[k]; if (v[2] && !owned()[k]) { if (!here) return toast('You need a wardrobe-keeper or a mirror.'); if (S.gold < v[2]) return toast('Not enough gold.'); S.gold -= v[2]; owned()[k] = true; chat('sys', null, `You buy ${v[0]} dye.`); } set('dye', k); };
  body.appendChild(d);
  const opts = SKIN_OPTS[race] || SKIN_OPTS.human;
  const bb = el(`<div class="card" style="text-align:left"><h3>Barber</h3><p style="font-size:12px;margin:0 0 4px">10 gold a visit.</p><div class="acts">${opts.map((c, i) => `<button data-s="${i}" style="border-left:14px solid ${c};${L.skin === i ? 'outline:3px solid var(--acc)' : ''}">${i + 1}</button>`).join('')}<button data-s="-1" ${L.skin < 0 ? ON : ''}>Natural</button></div>
    <div class="acts">${[-2, -1, 0, 1, 2].map(v => `<button data-h="${v}" ${(L.h || 0) === v ? ON : ''}>${['Much shorter', 'Shorter', 'As born', 'Taller', 'Much taller'][v + 2]}</button>`).join('')}</div></div>`);
  bb.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.s != null) set('skin', +b.dataset.s, 10); else set('h', +b.dataset.h, 10); };
  body.appendChild(bb);
}]);
