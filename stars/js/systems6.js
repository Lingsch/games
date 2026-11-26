// Stars Beneath, Build 6: the systems the first five builds left out. The armory trials (so a hero can take up a
// second weapon at level 10 and climb past the lock), rides for every path, a morality standing moved by the choices
// you make at the end of a job, and cargo runs between the systems on your star map.
import { S, X, chat } from './core.js';
import { CLASSES, CLASS_KEYS, QUESTS, GIVERS } from './data.js';
import { TALK } from './dialogue.js';
import { addKinds } from './render.js';
import { build, P, T, Box, Cyl, Cone } from './models.js';
import * as Loot5 from './loot5.js';
import * as Game from './game.js';
import * as Cb from './combat.js';
import * as UI from './ui.js';
import { SYSTEMS, here } from './ship1.js';
import { houndGeo, ASH } from './aliens5.js';
const O = [0, 0, 0], LR = [1, -1];

// ---------- the armory trials ----------
const ARMS = { smuggler: ['Gunsmith Ada Okonkwo', "Ada Okonkwo has fitted, fixed or condemned every weapon in the Free Captains' Hall. She will sell you nothing. She lends, against proof that you know which end is which."],
  justice: ['Armourer-Sergeant Josune Pell', "Josune Pell has kept the order's armoury for thirty years and regards the lamp lore as a fine thing that has never once cleared a jammed rifle."],
  dark: ['Armourer Thessel Vane-Okor', "Thessel keeps the Covenant's racks. Every weapon on them has had an owner before you. She can tell you how each of them stopped needing it."] };
X.armorName = () => ARMS[X.path()]?.[0] || ARMS.smuggler[0];
Object.defineProperty(GIVERS.armorer, 'name', { get: () => X.armorName(), configurable: true });
GIVERS.armorer.title = 'Armory · weapon trials';
TALK.armory = { get bio() { return (ARMS[X.path()] || ARMS.smuggler)[1]; }, greet: ["Reach level 10 with what you carry and I'll put something new in your hands. Not before.", "One weapon mastered earns one more, from a kind you haven't tried. Master all four kinds and nothing in the galaxy will hold you at ten."], topics: [{ q: 'Why am I stuck at level 10?', a: ["Because you only know one way to fight, and past ten that gets people killed. Fighter, Healer, Rogue, Tech: get one weapon from each family to level 10 and the lock comes off.", "Every weapon you master earns a trial with me. Pass it, pick a new weapon from the rack, and take it out on easy work until it feels like yours. Your crew will keep up. They're used to you."] }] };
for (const k of CLASS_KEYS) { const q = QUESTS.find(x => x.id === 'w_' + k); if (!q) continue; delete q.path; delete q.zone;
  Object.defineProperty(q, 'name', { get: () => `The ${CLASSES[k].name}'s Trial`, configurable: true });
  q.obj.what = 'Defeat 10 enemies of level 9 or higher';
  q.say = ["Level 10 with that, and still in one piece. Most don't get there. They find one trick that works and lean on it until the day it doesn't.", "Here's the trial, and it isn't complicated. Go and put down ten things of level 9 or better, with the weapon you've mastered, where I can hear about it. Then come back and I'll open the rack."];
  q.done = ["Ten. I heard. Right, the rack's open. You may take one weapon from a family you haven't touched. You'll start it from level 1, and it will feel like wearing somebody else's boots. That passes. Choose carefully, I don't do exchanges."]; }
X.zone.push(() => { if ((S.unlockPicks || 0) > 0) chat('sys', null, 'You have a weapon to choose. Speak to the armourer in any large port.'); });

// ---------- rides for every path ----------
const bikeGeo = (c, trim, glow) => build([P(T(Box(.46, .3, 2.3), 0, .9, 0), 0, O, c), P(T(Cone(.28, 1, 5), 0, .9, 1.6, Math.PI / 2), 0, O, c), P(T(Box(.42, .14, .7), 0, 1.1, -.2), 0, O, '#1c2026'), P(T(Box(1, .06, .4), 0, 1.02, .9), 0, O, trim),
  ...LR.map(s => P(T(Box(.5, .06, 1), .46 * s, .82, -.6, 0, 0, -.2 * s), 0, O, trim)), P(T(Cyl(.2, .26, .5, 8), 0, .9, -1.35, Math.PI / 2), 0, O, '#4a5058'), P(T(Cyl(.17, .17, .06, 8), 0, .9, -1.62, Math.PI / 2), 0, O, glow, 2.8), P(T(Box(.5, .04, .1), 0, .74, 1.2), 0, O, glow, 2)]);
addKinds({ bike_j: [bikeGeo('#e8e2d0', '#2e5a9e', '#6ad8ff'), [0, 0, 0, 0], 0, .03], bike_j2: [bikeGeo('#8a9098', '#2e5a9e', '#6ad8ff'), [0, 0, 0, 0], 0, .03], bike_d2: [bikeGeo('#26262c', '#8a1a1a', '#ff3a2a'), [0, 0, 0, 0], 0, .03],
  mount_lurcher: [houndGeo({ ...ASH, plate: '#8a1a1a' }), [.75, 0, 0, .55], .07, .035] });
Object.assign(Loot5.COLLECT, { mount_bike_j: { type: 'mount', name: 'Order Patrol Bike', kind: 'bike_j', spd: .7, ride: .55, from: 'quest' }, mount_lurcher: { type: 'mount', name: 'Broken Lurcher', kind: 'mount_lurcher', spd: .75, ride: .75, scale: 1.5, from: 'quest' } });
Object.defineProperty(X, 'crewMount', { get: () => ({ justice: 'bike_j2', dark: 'bike_d2' })[X.path()] || 'speeder2', set() { }, configurable: true });
const RIDES = { justice: ['jc_c1', 'mount_bike_j', 'The order assigns you a patrol bike. The ride button is beside your potions.'], dark: ['dh_h1', 'mount_lurcher', 'Legate Marr signs over a broken lurcher from the garrison kennels. It hates you a little less than it hates everyone else. The ride button is beside your potions.'] };
function giveRide(tell) { const r = RIDES[X.path()]; if (!r || S.quests[r[0]]?.state !== 'turned') return; S.collection = S.collection || []; if (S.collection.includes(r[1])) return; S.collection.push(r[1]); S.ext.mount = r[1]; if (tell) chat('loot', null, r[2]); }
X.turnin.push(() => setTimeout(() => giveRide(true), 30)); X.zone.push(() => giveRide(true));

// ---------- morality: what the galaxy has decided you are ----------
export const moral = () => S.ext?.moral || 0;
export const standing = () => { const m = moral(); return m >= 6 ? 'Merciful' : m >= 3 ? 'Fair-handed' : m <= -6 ? 'Merciless' : m <= -3 ? 'Hard-handed' : 'Unsettled'; };
X.turnin.push((q, ch) => { if (!ch || !ch.moral) return; const was = standing(); S.ext.moral = moral() + ch.moral; chat('sys', null, ch.moral > 0 ? 'That will be remembered kindly.' : 'That will be remembered.'); if (standing() !== was) { chat('sys', null, `Word gets around. You are now known as ${standing()}.`); Game.refreshAcct?.(); } });
X.acct = (prev => a => { prev?.(a); const m = moral(); if (m >= 3) a.hpP = (a.hpP || 0) + (m >= 6 ? .05 : .03); if (m <= -3) a.powP = (a.powP || 0) + (m <= -6 ? .05 : .03); })(X.acct);
// choices at the end of jobs already in the game
const choose = (id, choices) => { const q = QUESTS.find(x => x.id === id); if (q) q.choices = choices; };
for (const id of ['su_a4', 'su_a5']) { const q = QUESTS.find(x => x.id === id); if (!q) continue; const g = q.gold || 20;
  q.choices = [{ t: '▸ Collect the bounty.', reply: ['tamm', "Paid in full, and entered in the Ledger. Pleasure doing business, Captain."] },
    { t: "▸ 'Give my cut to whoever they robbed.'", gold: -g, moral: 1, reply: ['tamm', "Well, now. I've kept this Ledger eleven years and I've a column for that, but I've never had to rule the lines on it before. I'll see it gets to them. I won't say who from, unless they ask nicely."] },
    { t: "▸ 'Dead was harder than you said. Half again, or find another gun.'", gold: Math.round(g * .5), moral: -1, reply: ['tamm', "That's not how the Ledger works, Captain, and you know it. Here. Take it. I'll remember the price went up, and so will the next name I'd have offered you."] }]; }
choose('jc_h1', [{ t: "▸ Take the Senator's thanks.", moral: -1, reply: ['harrow', "There. You see how pleasant it is when everyone is reasonable? I shall remember that the order can be relied upon. I do so value things that can be relied upon."] },
  { t: "▸ 'Keep your money, Senator. The order is not for hire.'", gold: -24, moral: 1, reply: ['harrow', "Oh. Well. How very principled. I had rather hoped we might be friends. Never mind. I am a patient man, novice, and principle is so often a thing people can only afford when they are young."] }]);
choose('de_a5', [{ t: "▸ 'He only wanted to go home. I'll remember that.'", moral: 1, reply: ['tole', "Aye. Well. That's more than I expected from one of your lot, and it's more than he'll get from the Empire. I'll stand you a drink, if they let acolytes drink. Do they? Nobody tells me anything."] },
  { t: "▸ 'He was a rebel. He got what rebels get.'", moral: -1, reply: ['tole', "Right. Yes. Of course he did. Here's your money, then. You'll go far in that Citadel. I can always tell the ones who will."] }]);
choose('dh_h4', [{ t: '▸ Hand over the satchel, unread.', moral: 1, reply: ['marr', "Unread. You actually did it. I'm going to remember that, acolyte. Whatever else they've made of you, you can still keep your word to a tired old soldier."] },
  { t: "▸ 'I read every page. The Covenant reads everything.'", moral: -1, reply: ['marr', "Of course you did. I don't know why I asked. Well, then you know it all before I do, and so does your Veil-Lord, I expect. Sit down anyway. One of us should be surprised."] }]);
choose('dh_g2', [{ t: "▸ 'The smile is still on it. Go and fetch your plate.'", moral: 1, reply: ['fenn', "You left it. You went up against Big Shift and you left the smile. Now why would a Covenant acolyte do a soft thing like that? Don't answer. Let an old man think well of somebody for one afternoon."] },
  { t: "▸ 'It's scrap. All of it. Weigh it in.'", gold: 12, moral: -1, reply: ['fenn', "Scrap. Right. No, that's fair. That's quota, that is. That's exactly what I'd have told a lad of mine thirty years ago. Here's the weigh-in bonus. You've earned it."] }]);

// ---------- cargo runs ----------
export const GOODS = { water: ['Water', 6], ore: ['Refined ore', 10], salvage: ['Salvage', 8], parts: ['Machine parts', 14], med: ['Medical supplies', 16], lux: ['Luxuries', 24] };
export const FACT = { moon: { water: 1.5, ore: .9, salvage: .6, parts: 1.3, med: 1.4, lux: 1.2 }, halfway: { lux: 1.1 }, sunder: { water: 1.6, ore: 1.1, salvage: 1.1, parts: .8, med: 1.1, lux: .7 },
  cairn: { water: .6, ore: 1, salvage: 1.2, parts: 1.3, med: 1.5, lux: 1.4 }, aurelis: { water: 1, ore: 1.3, salvage: 1.3, parts: .7, med: .7, lux: 1.5 },
  cinder: { water: 1.6, ore: 1.4, salvage: .9, parts: 1.2, med: 1.3, lux: 1.5 }, hollow: { water: 1.3, ore: .5, salvage: .8, parts: 1.2, med: 1.5, lux: 1.4 }, vigil: { water: 1.4, ore: 1.2, salvage: .5, parts: 1.6, med: 1.9, lux: .8 } };
export const price = (sys, g) => Math.max(1, Math.round(GOODS[g][1] * (FACT[sys]?.[g] || 1)));
export const holdCap = () => 6 + 2 * Math.max(0, (S.party?.length || 1) - 1);
const hold = () => (S.ext.cargo = S.ext.cargo || {});
export const holdUsed = () => Object.values(hold()).reduce((a, c) => a + c.n, 0);
export function trade(g, n) {            // n > 0 buys, n < 0 sells, at the system you are docked in
  const sys = here(), p = price(sys, g), h = hold(), c = h[g] || { n: 0, paid: 0 };
  if (n > 0) { n = Math.min(n, holdCap() - holdUsed(), Math.floor(S.gold / p)); if (n <= 0) return 0; S.gold -= n * p; c.paid += n * p; c.n += n; h[g] = c; }
  else { n = -Math.min(-n, c.n); if (!n) return 0; const sell = Math.round(p * .92), cost = c.n ? c.paid / c.n : 0; S.gold += -n * sell; c.paid -= cost * -n; c.n += n; if (c.n <= 0) delete h[g]; else h[g] = c;
    const gain = Math.round((sell - cost) * -n); if (gain > 0) { S.ext.cargoGain = (S.ext.cargoGain || 0) + gain; Cb.giveXp(S.hero, Math.round(gain * 1.5)); } }
  Game.save(); return n;
}
export function openCargo() {
  UI.openSheet('Cargo hold', body => { const draw = () => {
    const sys = here(), nm = SYSTEMS[sys]?.name || 'port'; body.innerHTML = '';
    const top = document.createElement('p'); top.innerHTML = `Docked at <b>${nm}</b>. Hold: <b>${holdUsed()} / ${holdCap()}</b> crates · ${S.gold} credits${S.ext.cargoGain ? ` · ${S.ext.cargoGain} earned hauling so far` : ''}<br><small class="dim">Buy where a thing is cheap and sell where it is dear. Each crew member adds two crates of room. Lose the ship and you lose the hold.</small>`; body.appendChild(top);
    for (const [g, [name]] of Object.entries(GOODS)) { const p = price(sys, g), c = hold()[g], row = document.createElement('div'); row.className = 'card'; row.style.cssText = 'margin:6px 0;display:flex;align-items:center;gap:8px';
      const best = Object.keys(FACT).filter(k => k !== sys && SYSTEMS[k] && (!SYSTEMS[k].path || SYSTEMS[k].path === X.path())).sort((a, b) => price(b, g) - price(a, g))[0];
      row.innerHTML = `<div style="flex:1"><b>${name}</b> <small class="dim">buy ${p} · sell ${Math.round(p * .92)}</small><br><small>${c ? `Aboard: ${c.n} (paid ${Math.round(c.paid / c.n)} each)` : 'None aboard'}${best && price(best, g) > p ? ` · dearest at ${SYSTEMS[best].name}` : ''}</small></div><button data-n="1">Buy</button><button data-n="99">Fill</button><button data-n="-99" ${c ? '' : 'disabled'}>Sell</button>`;
      row.onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const r = trade(g, +b.dataset.n); if (!r) UI.toast?.(+b.dataset.n > 0 ? 'No room, or no credits.' : 'None to sell.'); draw(); }; body.appendChild(row); }
  }; draw(); });
}
X.talk.push((k, n, api) => k === 'helm' ? [['▸ Check the cargo hold.', () => { api.close(); openCargo(); }, 'hl'], ['▸ What do people say about me?', () => api.go({ view: 'menu', lines: [`The helm keeps a log of what the lanes say about its captain. Today it reads: ${standing()}.`, moral() >= 3 ? 'People you spared have long memories. So, it turns out, do the people you were sent after.' : moral() <= -3 ? 'Ports go a little quiet when you dock. Prices are firm, and nobody haggles twice.' : 'Nobody has made up their mind about you yet. That will not last.'] })]] : null);
X.cargoLost = () => { if (holdUsed() > 0) { S.ext.cargo = {}; chat('sys', null, 'Everything in the hold went with the ship.'); } };
