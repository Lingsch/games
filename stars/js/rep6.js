// Build 6: reputation with four factions, and mounts. Mounts come from a stable master's quests, from rare boss
// drops, and from quartermasters who trust you. Riding is for travel: you get off when you're hit or when you attack.
import { S, TAU, chat, pick, floatText, X } from './core.js';
import { world, hgt } from './world.js';
import { QUESTS, makeItem } from './data.js';
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import { addKinds } from './render.js';
import * as Cb from './combat.js';
import * as Craft from './crafting.js';
import * as Loot5 from './loot5.js';
const O = [0, 0, 0];

// ---------- reputation ----------
export const FACTIONS = {
  light: { name: 'The Lighthouse Keepers', icon: '🗼', qm: 'vendor:light' },
  crook: { name: "Crookwater's Smugglers", icon: '🏴', qm: 'vendor:crook' },
  vale: { get name() { return S.ext?.valeTown || 'The Vale'; }, icon: '🏰', qm: 'vendor:vale' },
  law: { name: 'The Fourfold Law', icon: '⚖️', qm: 'ashgrove' },
};
export const STANDINGS = [['Neutral', 0], ['Friendly', 1500], ['Honored', 4500], ['Revered', 9000], ['Exalted', 15000]];
const repOf = f => (S.ext?.rep?.[f]) || 0;
export const standing = f => { const r = repOf(f); let i = 0; for (let k = 0; k < STANDINGS.length; k++) if (r >= STANDINGS[k][1]) i = k; return i; };
export function addRep(f, n, quiet) {
  if (!FACTIONS[f] || !n) return;
  S.ext.rep = S.ext.rep || {}; const before = standing(f);
  if ((S.ext.guild?.lvl || 1) >= 3) n = Math.round(n * 1.1);
  S.ext.rep[f] = Math.min(21000, repOf(f) + n);
  if (!quiet) chat('sys', null, `${FACTIONS[f].name}: +${n} reputation.`);
  const after = standing(f); if (after > before) { chat('sys', null, `You are now ${STANDINGS[after][0]} with ${FACTIONS[f].name}.`); if (S.hero) floatText(S.hero, `${STANDINGS[after][0]}: ${FACTIONS[f].name}`, '#ffd34d', true); }
}
const VALE_GIVERS = ['wick', 'warden', 'tanner', 'sister', 'pell', 'wenlow', 'haskett', 'corwin', 'ansel', 'dace', 'fenna', 'ottoline', 'hobb'];
X.turnin.push(q => {
  if (q.rep) { for (const [f, n] of Object.entries(q.rep)) addRep(f, n); }
  else if (/^c[123][a-d]$/.test(q.id)) { addRep('law', 300); addRep('vale', 100); }
  else if (VALE_GIVERS.includes(q.giver)) addRep('vale', q.story ? 200 : 120);
  else if (/^c\d+$/.test(q.id)) addRep('law', 100);
  if (q.mount) Loot5.collect(q.mount);
});
export const KILL_REP = { wrecker: ['crook', 6], wreckerlamp: ['crook', 6], wreckerbrute: ['crook', 6], navymarine: ['light', 5], navyofficer: ['light', 5], tidesworn: ['light', 5], tidechanter: ['light', 5], brineling: ['light', 4], tidewight: ['light', 6], stormdrowned: ['light', 5],
  bandit: ['vale', 3], bandit2: ['vale', 3], xbow: ['vale', 3], cultist: ['vale', 3], chanter: ['vale', 3], skeleton: ['vale', 2], ghoul: ['vale', 2], pirate: ['law', 3], smuggler: ['law', 2], raider: ['vale', 6], raiderbow: ['vale', 6], risen: ['vale', 3] };
X.kill.push(m => {
  const k = KILL_REP[m.mob]; if (k && !m.named) addRep(k[0], k[1], true);
  if (m.named && !m.boss && !m.boss2) { const f = S.zone === 'vale' ? 'vale' : m.mob.startsWith('wreck') || m.mob === 'lanternjack' ? 'crook' : 'light'; addRep(f, 60); addRep('law', 40, true); }
  if (m.boss || m.boss2) addRep(S.zone === 'vale' || ['catacombs', 'mines'].includes(S.zone) ? 'vale' : 'light', m.boss ? 150 : 75, true);
});

// ---------- mounts ----------
const horse = (coat, mane, tack = '#6b3a22', armored = false) => build([
  P(T(Box(1.1, 1, 2.4), 0, 1.55), 0, O, coat), P(T(Box(.6, 1.2, .7), 0, 2.3, 1.2, -.6), 0, O, coat), P(T(Box(.5, .5, 1), 0, 2.85, 1.75, .25), 0, O, coat),
  P(T(Box(.14, .9, .7), 0, 2.6, 1.05, -.6), 0, O, mane), P(T(Box(.2, .9, .2), 0, 1.4, -1.35, .5), 0, O, mane), ...[-.25, .25].map(x => P(T(Cone(.1, .3, 4), x, 3.2, 1.55), 0, O, coat)),
  ...[[-.38, .9], [.38, .9], [-.38, -.9], [.38, -.9]].map(([x, z]) => P(T(Box(.26, 1.1, .26), x, .55, z), 0, O, coat)), ...[[-.38, .9], [.38, .9], [-.38, -.9], [.38, -.9]].map(([x, z]) => P(T(Box(.3, .2, .3), x, .1, z), 0, O, '#2a221a')),
  P(T(Box(1.2, .25, 1), 0, 2.1, -.1), 0, O, tack), P(T(Box(1.25, .5, .9), 0, 1.75, -.1), 0, O, tack),
  ...(armored ? [P(T(Box(1.25, .7, 1.2), 0, 1.6, .9), 0, O, '#8a8a95'), P(T(Box(.55, .55, .6), 0, 2.95, 1.9, .25), 0, O, '#8a8a95')] : [])]);
const HORSE = [.75, 0, 0, .5];
addKinds({
  horse_salt: [horse('#d8ccb0', '#8a7a5a', '#3a6a8a'), HORSE, .05, .03], horse_white: [horse('#f0ece0', '#c8c0b0', '#b83a32'), HORSE, .05, .03],
  horse_black: [horse('#2a2622', '#121010', '#5a4a3a'), HORSE, .05, .03], horse_bay: [horse('#8a5a3a', '#2a1a12'), HORSE, .05, .03],
  horse_grey: [horse('#9a9aa0', '#4a4a52', '#2e4a7a', true), HORSE, .05, .03], horse_night: [horse('#1a1418', '#c0392b', '#3a1a1a'), HORSE, .05, .03],
  horse_war: [horse('#5a5a60', '#2a2a30', '#2e5a9e', true), HORSE, .05, .03], horse_gilt: [horse('#c8a050', '#f0e0a0', '#7a1f1c', true), HORSE, .05, .03],
  horse_ghost: [horse('#b8e0e8', '#e8ffff', '#5a8a9a'), HORSE, .05, .025],
});
Object.assign(Loot5.COLLECT, {
  mount_saltpony: { type: 'mount', name: 'Brine, the Salt Pony', kind: 'horse_salt', spd: .6, ride: 1, from: 'quest' },
  mount_greywatch: { type: 'mount', name: 'Greywatch Courser', kind: 'horse_white', spd: .7, ride: 1, from: 'rep' },
  mount_crookblack: { type: 'mount', name: "Smuggler's Black", kind: 'horse_black', spd: .7, ride: 1, from: 'rep' },
  mount_wyrgate: { type: 'mount', name: 'Vale Palfrey', kind: 'horse_bay', spd: .6, ride: 1, from: 'rep' },
  mount_lawcharger: { type: 'mount', name: "Marshal's Charger", kind: 'horse_grey', spd: .8, ride: 1, from: 'rep' },
  mount_varro: { type: 'mount', name: "Varro's Gilded Charger", kind: 'horse_gilt', spd: .8, ride: 1, from: 'keep' },
  mount_rotfang: { type: 'mount', name: 'Rotfang Whelp', kind: 'wolf', scale: 1.6, spd: .8, ride: .75, from: 'grove' },
  mount_hymn: { type: 'mount', name: 'Hymnal Steed', kind: 'horse_ghost', spd: .8, ride: 1, from: 'catacombs' },
  mount_slag: { type: 'mount', name: 'Slagback', kind: 'golempet', scale: .75, spd: .8, ride: 1.25, from: 'mines' },
  mount_nightmare: { type: 'mount', name: "Wreck-Queen's Nightmare", kind: 'horse_night', spd: .8, ride: 1, from: 'teeth' },
  mount_tidecrab: { type: 'mount', name: 'Tidestrider', kind: 'crabbig', scale: .6, spd: .8, ride: .65, from: 'shrine' },
  mount_admiralty: { type: 'mount', name: 'Admiralty Warhorse', kind: 'horse_war', spd: .8, ride: 1, from: 'brinevaults' },
  mount_serpent: { type: 'mount', name: 'Bone Serpent', kind: 'leviathan', scale: .13, spd: .85, ride: .5, from: 'bonewhale' },
});
const MOUNT_FOR_FRIENDS = ['horse_bay', 'horse_salt', 'horse_white', 'horse_black'];
export const mounts = () => (S.collection || []).filter(k => Loot5.COLLECT[k]?.type === 'mount');
export const riding = () => !!(S.hero && S.hero.mountEnt && !S.hero.mountEnt.remove);
function mountUp(e, kind, scale, ride, spd) {
  const m = Cb.makeEnt({ team: 'npc', maxHp: 1, hp: 1, name: '', kind, x: e.x, z: e.z, scale: scale || 1, mount: true, vanity: true });
  m.y = hgt(m.x, m.z); m.yaw = e.yaw; e.mountEnt = m; e.rideY = ride; Cb.buff(e, 'mounted', 99999, { spd }, e);
}
function getOff(e) { if (e.mountEnt) { e.mountEnt.remove = true; e.mountEnt.dead = true; e.mountEnt = null; } e.rideY = 0; e.buffs = e.buffs.filter(b => b.id !== 'mounted'); }
export function mount() {
  const h = S.hero; if (!h || h.dead) return 'You are dead.';
  if (riding()) { dismountAll(); return null; }
  const k = S.ext.mount && mounts().includes(S.ext.mount) ? S.ext.mount : mounts()[0]; if (!k) return "You don't have a mount.";
  if (world.cave || world.underwater) return 'There is no room to ride here.';
  if (h.swim) return "You can't ride in the water.";
  if (Cb.inCombat(h)) return "You can't mount in combat.";
  const c = Loot5.COLLECT[k]; S.ext.mount = k;
  mountUp(h, c.kind, c.scale, c.ride, c.spd);
  S.party.forEach((p, i) => { if (p !== h && !p.dead) mountUp(p, MOUNT_FOR_FRIENDS[i % 4], 1, 1, c.spd); });
  return null;
}
export function dismountAll() { for (const p of S.party) getOff(p); if (S.hero) getOff(S.hero); }
// mounts follow their riders, step for step; anyone hit, attacking or swimming gets off
X.tick.push(dt => {
  const h = S.hero; if (!h) return;
  if (riding() && (h.dead || Cb.inCombat(h) || h.casting || h.swim || world.cave || world.underwater || S.party.some(p => !p.dead && Cb.inCombat(p) && p.mountEnt))) dismountAll();
  for (const p of S.party) {
    const m = p.mountEnt; if (!m) continue;
    if (m.remove || !S.ents.includes(m)) { p.mountEnt = null; p.rideY = 0; p.buffs = p.buffs.filter(b => b.id !== 'mounted'); continue; }
    if (p.dead || p.swim) { getOff(p); continue; }
    m.x = p.x; m.z = p.z; m.y = hgt(m.x, m.z); m.yaw = p.yaw; m.moving = p.moving;
    m.anim.ph += dt * (p.spd || 7) * 1.1 * Math.min(1, p.moving || 0); m.anim.mv = p.moving || 0;
  }
});
X.zone.push(zone => { if (S.hero) { S.hero.rideY = 0; S.hero.mountEnt = null; } if (zone === 'vale' && world.names?.town) S.ext.valeTown = world.names.town; });

// ---------- quartermasters ----------
export const ring = (name, L, rar, slot = 'ring') => () => { const b = Craft.gearBudget(L, slot) * (rar > 2 ? 1 : .85); return makeItem({ name, slot, type: slot, lvl: L, rarity: rar, stats: { pow: Math.round(b * .5), sta: Math.round(b * .35), crit: +(1 + L * .08).toFixed(1) }, value: 30 }); };
export const REWARDS = {
  light: [[1, 60, "Keeper's Lamp-Ring", ring("Keeper's Lamp-Ring", 12, 2)], [2, 200, 'Greywatch Courser (mount)', 'mount_greywatch'], [3, 150, "Head Keeper's Locket", ring("Head Keeper's Locket", 15, 3, 'neck')], [4, 0, 'Title: of the Light', 'title_light']],
  crook: [[1, 50, "Smuggler's Knot", ring("Smuggler's Knot", 12, 2)], [2, 0, 'Recipe: Storm Eel Pie', 'r:eelpie'], [3, 200, "Smuggler's Black (mount)", 'mount_crookblack'], [4, 0, 'Title: the Honest Rogue', 'title_rogue']],
  vale: [[1, 40, 'Watch Signet', ring('Watch Signet', 9, 2)], [2, 150, 'Vale Palfrey (mount)', 'mount_wyrgate'], [3, 120, "Watch-Captain's Medal", ring("Watch-Captain's Medal", 12, 3, 'neck')], [4, 0, 'Title: Hero of the Vale', 'title_wyrgate']],
  law: [[1, 60, "Deputy's Star", ring("Deputy's Star", 12, 2, 'neck')], [2, 120, "Marshal's Seal", ring("Marshal's Seal", 14, 3)], [3, 250, "Marshal's Charger (mount)", 'mount_lawcharger'], [4, 0, 'Title: Warden of the Law', 'title_law']],
};
Object.assign(Loot5.COLLECT, {
  title_light: { type: 'title', name: 'of the Light', from: 'rep' }, title_rogue: { type: 'title', name: 'the Honest Rogue', from: 'rep' },
  title_wyrgate: { type: 'title', name: 'Hero of the Vale', from: 'rep' }, title_law: { type: 'title', name: 'Warden of the Law', from: 'rep' },
});
const bought = (f, i) => (S.ext.bought || []).includes(f + i);
function buy(f, i) {
  const [need, price, label, what] = REWARDS[f][i];
  if (standing(f) < need) return `You need to be ${STANDINGS[need][0]} with ${FACTIONS[f].name}.`;
  if (S.gold < price) return 'Not enough credits.';
  if (typeof what === 'string' && what.startsWith('r:')) { if (!Craft.learnRecipe(what.slice(2))) return 'You already know that recipe.'; }
  else if (typeof what === 'string') { if (!Loot5.collect(what)) return 'You already have that.'; }
  else { if (bought(f, i)) return 'You already bought that.'; if (S.bag.length >= 30) return 'Your bags are full.'; S.bag.push(what()); chat('loot', null, `You receive ${label}.`); }
  S.gold -= price; S.ext.bought = [...(S.ext.bought || []), f + i];
  return null;
}
function openQM(f, n) {
  const { el, esc, toast, openSheet, refreshSheet } = X.ui;
  openSheet(n?.name || FACTIONS[f].name, body => {
    const st = standing(f);
    body.appendChild(el(`<p style="margin:0 0 6px">${FACTIONS[f].icon} <b>${esc(FACTIONS[f].name)}</b>: ${STANDINGS[st][0]} (${repOf(f)}) · Gold <b style="color:var(--acc)">${S.gold}</b></p>`));
    REWARDS[f].forEach(([need, price, label, what], i) => {
      const have = typeof what === 'string' ? (what.startsWith('r:') ? (S.recipes || []).includes(what.slice(2)) : Loot5.owned(what)) : bought(f, i);
      const c = el(`<div class="card sp"><div style="flex:1"><b>${esc(label)}</b> <span class="dim">· ${STANDINGS[need][0]}${price ? ' · ' + price + 'g' : ''}</span><div class="acts"><button ${have || st < need ? 'disabled' : ''}>${have ? 'Owned' : st < need ? 'Not yet' : 'Buy'}</button></div></div></div>`);
      c.querySelector('button').onclick = () => { const m = buy(f, i); if (m) toast(m); else { X.ui.refreshSheet(); } };
      body.appendChild(c);
    });
  });
}
X.talk.push((k, n, api) => {
  const f = Object.keys(FACTIONS).find(f => FACTIONS[f].qm === k); if (!f) return [];
  return [[`▸ What do you keep for friends of ${FACTIONS[f].name.replace(/^The /, 'the ')}? <span class="qn">${FACTIONS[f].icon}</span>`, () => { api.close(); openQM(f, n); }, 'hl']];
});
// ---------- the Book: standing and mounts ----------
X.book.push(['rep', 'Rep', body => {
  const { el, esc, toast, refreshSheet } = X.ui;
  body.appendChild(el('<h3 style="font:700 13px Orbitron;margin:0 0 4px;color:var(--dim)">Reputation</h3>'));
  for (const [f, F] of Object.entries(FACTIONS)) {
    const r = repOf(f), st = standing(f), lo = STANDINGS[st][1], hi = STANDINGS[st + 1]?.[1] ?? lo + 1, pct = st >= 4 ? 100 : Math.round((r - lo) / (hi - lo) * 100);
    body.appendChild(el(`<div class="card" style="padding:6px 8px;margin:4px 0"><b>${F.icon} ${esc(F.name)}</b> <span class="dim">· ${STANDINGS[st][0]}${st < 4 ? ` · ${r - lo}/${hi - lo}` : ''}</span><div style="height:6px;background:#2a2a30;border-radius:3px;margin-top:4px"><div style="height:6px;width:${pct}%;background:var(--acc);border-radius:3px"></div></div></div>`));
  }
  body.appendChild(el('<h3 style="font:700 13px Orbitron;margin:10px 0 4px;color:var(--dim)">Mounts</h3>'));
  const ms = mounts();
  if (!ms.length) body.appendChild(el('<p class="dim" style="margin:0">None yet.</p>'));
  for (const k of ms) {
    const c = Loot5.COLLECT[k], on = S.ext.mount === k;
    const row = el(`<div class="who"><div><b>🐎 ${esc(c.name)}</b> <small>${Math.round(c.spd * 100)}% faster</small></div><button>${on ? (riding() ? 'Get off' : 'Ride') : 'Choose'}</button></div>`);
    row.querySelector('button').onclick = () => { if (!on) { S.ext.mount = k; if (riding()) { dismountAll(); } refreshSheet(); return; } const m = mount(); if (m) toast(m); refreshSheet(); };
    body.appendChild(row);
  }
}]);

// the 🐎 button sits beside the chair once you own a mount
let mbT = 0;
X.light.push(dt => {
  if ((mbT -= dt) > 0) return; mbT = .25;
  const b = document.getElementById('mountBtn'); if (!b) return;
  if (!b.onclick) b.onclick = () => { const m = mount(); if (m) X.ui.toast(m); };
  b.classList.toggle('hide', !mounts().length); b.classList.toggle('on', riding()); b.textContent = riding() ? '🚶' : '🐎';
});
// the coast dungeons' collectibles: a pet, a title and a trophy each
Object.assign(Loot5.COLLECT, {
  pet_pinch: { type: 'pet', name: 'Pinch', kind: 'crab', scale: .4, from: 'teeth' }, title_wreck: { type: 'title', name: 'Wreck-Breaker', from: 'teeth' },
  trophy_lantern: { type: 'trophy', name: "Morrigan's False Lantern", desc: 'Still smells of whale oil. Sailors who see it lit swear they hear surf breaking on rocks.', from: 'teeth' },
  pet_brine: { type: 'pet', name: 'Little Brine', kind: 'waterpet', scale: .4, from: 'shrine' }, title_tide: { type: 'title', name: 'Tidebreaker', from: 'shrine' },
  trophy_conch: { type: 'trophy', name: "Calloway's Conch", desc: 'Hold it to your ear and you hear the sea. Hold it longer and the sea starts whispering names.', from: 'shrine' },
  pet_bob: { type: 'pet', name: 'Barnacle Bob', kind: 'golempet', scale: .35, from: 'brinevaults' }, title_admiralty: { type: 'title', name: 'of the Admiralty', from: 'brinevaults' },
  trophy_knot: { type: 'trophy', name: "The Commodore's Sword-Knot", desc: 'Gold braid, salt-stiff, tied in a knot the navy stopped teaching a century ago.', from: 'brinevaults' },
  pet_squawks: { type: 'pet', name: 'Squawks', kind: 'harpy', scale: .35, from: 'bonewhale' }, title_whale: { type: 'title', name: 'Whalebreaker', from: 'bonewhale' },
  trophy_tooth: { type: 'trophy', name: "A Leviathan's Tooth", desc: 'Big as a door, and Dunn swears it was still warm when you pulled it out.', from: 'bonewhale' },
});
