// Stars Beneath, Build 12: the road to 50 opens. The level cap is 50; the weapon rule still holds you at 10, and
// a three-part trial holds you at 20, 30 and 40: alone, with your crew, and ship-to-deck. The helm now lets you
// choose who comes down the ramp. And the supply crates lying about every world can finally be opened.
import { S, X, chat, pick, irnd } from './core.js';
import { CLASSES, QUESTS, GIVERS, randomGear, xpNeed } from './data.js';
import * as Game from './game.js';
import * as UI from './ui.js';
import * as Cb from './combat.js';
import * as Craft from './crafting.js';
import { world } from './world.js';

// ---------- gates ----------
export const GATES = [20, 30, 40];
X.gateCap = () => { for (const g of GATES) if (!S.flags['gate' + g]) return g; return 50; };
const need = g => g - 4;                                   // trial enemies must be within four levels of the gate
const PART = [
  ['Alone', g => `Defeat 10 enemies of level ${need(g)} or higher with no crew at your side`, 10,
    g => [`Level ${g}. You've come as far as a captain can on habit. From here on the galaxy stops forgiving people who only know how to fight in company.`, `First part of three. Leave your crew aboard, every one of them, and put down 10 things of level ${need(g)} or better by yourself. The helm will let you choose who comes down the ramp. Choose nobody.`],
    "Ten, alone, and you walked back in. Good. You'd be surprised how many discover on that trial that they've been carried. Now forget it. The next part is the opposite."],
  ['Together', g => `With at least three crew beside you, defeat a dungeon boss of level ${need(g)} or higher`, 1,
    g => [`Second part. Any fool can fight alone. Leading is harder, because the people you lead can die of your mistakes.`, `Take at least three of your crew into somewhere properly dangerous and bring down whatever runs the place: a dungeon boss, level ${need(g)} or better. If one of yours falls and you finish anyway, it still counts. I'll just think less of you.`],
    "Down, with your crew around you. That's the part that matters. A captain is somebody other people are willing to stand next to. Last part, and it's the one that's actually about being a captain."],
  ['Ship to Deck', g => `In one outing: win a dogfight, board a crippled ship or a derelict, and defeat whoever commands it`, 1,
    g => [`Third part. Everything you are happens in two places: at the helm and on the deck. The trial is to do both without stopping for breath.`, `Launch. Find a fight. Cripple something big, or find a derelict, get alongside, go aboard and take the bridge. When whoever commands that ship is down, come and see me. Then the lock comes off.`],
    g => `Helm and deck, in one outing. That's the trial, all three parts. I'm lifting the lock at ${g}. Don't thank me, I didn't do anything. There'll be another at ${g + 10 > 40 ? 'the end of all this' : g + 10}, and I'll be harder to impress.`],
];
const qx = (lvl, f) => Math.round(xpNeed(lvl) * f * .36);
for (const g of GATES) PART.forEach(([nm, what, n, say, done], i) => QUESTS.push({ id: `tr${g}_${i + 1}`, trial: g, part: i, giver: 'armorer', lvl: g, pre: i ? `tr${g}_${i}` : null, when: () => (S.hero?.lvl || 1) >= g && !S.flags['gate' + g], name: `The Trial at ${g}: ${nm}`, xp: qx(g, .5), gold: g * 4, ...(i === 2 ? { gear: true } : {}),
  obj: { kill: ['__trial'], n, what: what(g) }, say: say(g), done: [typeof done === 'function' ? done(g) : done] }));
const active = part => QUESTS.find(q => q.trial && q.part === part && S.quests[q.id]?.state === 'active');
const bump = q => { const st = S.quests[q.id]; st.n = (st.n || 0) + 1; if (st.n >= q.obj.n) { st.state = 'done'; chat('sys', null, `${q.name}: done! Return to the armourer.`); } else chat('sys', null, `${q.name}: ${st.n}/${q.obj.n}`); Game.save(); };
const crewOut = () => S.party.filter(p => !p.isHero && !p.dead).length;
X.kill.push(m => {
  let q = active(0); if (q && m.lvl >= need(q.trial) && S.party.filter(p => !p.isHero).length === 0) bump(q);
  q = active(1); if (q && (m.boss || m.boss2) && m.lvl >= need(q.trial) && crewOut() >= 3) bump(q);
  q = active(2); if (q && S.zone === 'board' && m.boss && S.ext.wonFight) bump(q);
});
X.flightEnd = (prev => (...a) => { prev?.(...a); })(X.flightEnd);
// a dogfight counts for the third part when you shoot something down on the outing that ends in a boarding
X.tick.push(() => { const F = window.__G?.Flight?.state; if (F?.on) { const dead = F.ents.filter(e => e.team === 'foe' && e.dead).length; if (dead > 0 || F.boardT) S.ext.wonFight = S.time; } else if (S.zone !== 'board' && S.zone !== 'ship' && S.ext.wonFight) S.ext.wonFight = 0; });
X.turnin.push(q => { if (q.trial && q.part === 2) { S.flags['gate' + q.trial] = 1; chat('sys', null, `The lock at level ${q.trial} is lifted. You can now reach level ${X.gateCap()}.`); Game.save(); } });
X.zone.push(() => { const h = S.hero; if (!h) return; const g = X.gateCap(); if (g < 50 && h.lvl >= g && !Game.lockedAt10()) chat('sys', null, `You are held at level ${g}. The armourer in any large port runs the trial that lifts the lock.`); });

// ---------- who comes down the ramp ----------
const bench = () => (S.ext.bench = S.ext.bench || []);
function setOut(fr, out) {
  const mate = S.party.find(p => !p.isHero && p.name === fr.name);
  if (!out && mate) { for (const e of Cb.petsOf(mate)) { e.dead = true; e.remove = true; } S.party = S.party.filter(p => p !== mate); S.fakes = S.fakes.filter(p => p !== mate); mate.dead = true; mate.remove = true; if (!bench().includes(fr.name)) bench().push(fr.name); }
  if (out && !mate) { S.ext.bench = bench().filter(n => n !== fr.name); Game.addMate({ name: fr.name, cls: fr.cls, lvl: S.hero.lvl, pal: fr.pal, persona: fr.persona || 'friendly', guild: null, friend: true, bff: true }, S.hero); }
  Game.save();
}
export function openCrew() {
  UI.openSheet('Your crew', body => { const draw = () => { body.innerHTML = '';
    const out = S.party.filter(p => !p.isHero).length, top = document.createElement('p'); top.innerHTML = `Choose who comes down the ramp with you: up to <b>four</b>. The rest stay aboard, fly as your wingmen and keep the ship in one piece.<br><small class="dim">${out} going ashore · ${(S.friends || []).length - out} staying aboard</small>`; body.appendChild(top);
    if (!(S.friends || []).length) { const p = document.createElement('p'); p.className = 'dim'; p.textContent = 'You have no crew yet. You take one on every five levels.'; body.appendChild(p); }
    for (const fr of S.friends || []) { const going = S.party.some(p => !p.isHero && p.name === fr.name), row = document.createElement('div'); row.className = 'card'; row.style.cssText = 'margin:6px 0;display:flex;align-items:center;gap:8px';
      row.innerHTML = `<div style="flex:1"><b>${fr.name}</b><br><small class="dim">${CLASSES[fr.cls]?.name || ''} · ${CLASSES[fr.cls]?.role || ''}</small></div><button ${!going && out >= 4 ? 'disabled' : ''}>${going ? 'Going ashore ✓' : 'Staying aboard'}</button>`;
      row.querySelector('button').onclick = () => { setOut(fr, !going); draw(); }; body.appendChild(row); }
    const all = document.createElement('button'); all.textContent = out ? 'Everyone stays aboard' : 'Bring the first four'; all.style.marginTop = '8px'; all.onclick = () => { if (out) for (const fr of S.friends) setOut(fr, false); else for (const fr of (S.friends || []).slice(0, 4)) setOut(fr, true); draw(); }; body.appendChild(all);
  }; draw(); });
}
X.talk.push((k, n, api) => k === 'helm' ? [['▸ Choose who comes ashore.', () => { api.close(); openCrew(); }, 'hl']] : null);
// a new recruit over the limit waits aboard
X.recruit = (prev => key => { prev?.(key); const over = S.party.filter(p => !p.isHero); if (over.length > 4) { const last = over[over.length - 1], fr = (S.friends || []).find(f => f.name === last.name); if (fr) { setOut(fr, false); chat('sys', null, `${fr.name} waits aboard. You can bring four ashore; choose who at the helm.`); } } })(X.recruit);

// ---------- crates you can actually open ----------
const BOX = ['jobcrate', 'm_can', 's_cask', 'h_lamp', 'dcache'];
const wanted = tag => QUESTS.some(q => S.quests[q.id]?.state === 'active' && q.obj?.inspect === tag);
X.zone.push(() => { for (const p of world.props || []) if (BOX.includes(p.tag) && !p.use) p.use = 'box12'; for (const e of S.ents) if (e.prop && BOX.includes(e.prop.tag)) e.prop.use = 'box12'; });
{ const pl = X.propLabel, pu = X.propUse;
  X.propLabel = e => e.prop.use === 'box12' ? (wanted(e.prop.tag) ? null : 'Open the crate') : pl ? pl(e) : null;
  X.propUse = e => { if (e.prop.use !== 'box12') return pu?.(e); if (wanted(e.prop.tag)) return false;          // a job needs it: let the job have it
    const h = S.hero, r = Math.random(); let txt;
    if (r < .5) { const g = 3 + irnd(1, 3) * h.lvl; S.gold += g; txt = `${g} credits in loose chits`; }
    else if (r < .8) { const k = pick(['copper', 'iron', 'linen', 'lighthide', 'meat']); Craft.addMat(k, irnd(1, 3), true); txt = `some ${Craft.MATS[k].name}`; }
    else if (r < .93) { const k = Math.random() < .5 ? 'hpot' : 'mpot'; S.pots[k] = (S.pots[k] || 0) + 1; txt = k === 'hpot' ? 'a sealed medigel' : 'a spare power cell'; }
    else { const it = randomGear(h.lvl, Math.random() < .6 ? S.heroCls : null, .3); txt = Game.addToBag(it) ? it.name : 'something you have no room for'; }
    chat('loot', null, `You crack the crate: ${txt}.`); e.dead = true; e.remove = true; S.ext.boxes = (S.ext.boxes || 0) + 1; }; }
