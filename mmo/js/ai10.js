// Build 10: smarter teammates. On top of each class's own fighting brain:
//   interrupts: anyone with a spell-stopper uses it on an enemy caster, heals first;
//   crowd control: stuns and fears go on loose adds when the pull is big;
//   cooldowns: defensives when they're in trouble, big cooldowns for bosses and big pulls;
//   positioning: casters spread out against bosses, and nobody stands where they'll wake another pack;
//   battleground jobs: the players the battlemaster finds defend, attack, escort and run the banner.
import { S, X, chat, dist, pick } from './core.js';
import { CLASSES, MOBS } from './data.js';
import * as Cb from './combat.js';
import { aiHooks, tryUse, ready, isTank, isHealer, cc, hpPct, stopMove, goTo, groupFoes, meleeClass } from './ai.js';

// read each class's abilities once and sort out what they're good for
const src = ab => { try { return ab.fx ? ab.fx.toString() : ''; } catch (e) { return ''; } };
const KIT = {};
for (const [cls, C] of Object.entries(CLASSES)) {
  const K = KIT[cls] = { kick: [], stun: [], fear: [], def: [], gdef: [], big: [] };
  for (const [k, ab] of Object.entries(C.abilities || {})) {
    const f = src(ab), d = (ab.desc || '').toLowerCase();
    if (ab.tgt === 'enemy' && f.includes('interrupt(')) K.kick.push(k);
    else if (ab.tgt === 'enemy' && f.includes('stun(') && (ab.cd || 0) <= 30) K.stun.push(k);
    if (ab.tgt === 'enemy' && f.includes('fear(') && cls !== 'warlock') K.fear.push(k);
    const self = ab.tgt === 'self' && ab.kind !== 'ult', guard = /less damage|damage taken|absorb|immune|invulnerab|reduc|ward|shield|dodge|parry/.test(d);
    if (self && guard && (ab.cd || 0) >= 15) (/party|group|everyone|allies/.test(d) ? K.gdef : K.def).push(k);
    else if (self && (ab.cd || 0) >= 40 && /faster|twice|more damage|critical|\+\d+% power/.test(d)) K.big.push(k);
  }
}
X.aiKit = KIT;
const said = (e, lines, p = .3) => { if (e.inParty && Math.random() < p) chat('party', e.name, pick(lines)); };
const rangeOf = (e, k, t) => (CLASSES[e.cls].abilities[k]?.range || 3) + (t.r || .6);

aiHooks.preFight = (e, t, g, n) => {
  const K = KIT[e.cls]; if (!K) return false;
  const foes = groupFoes(g);
  // 1. stop spells: heals first, then anything aimed at a healer, then the rest
  if (K.kick.length || K.stun.length) {
    const casters = foes.filter(m => m.mcast && !m.dead && (K.kick.length || (!m.boss && !m.named)))
      .sort((a, b) => (b.mcast.kind === 'heal') - (a.mcast.kind === 'heal') || (b.mcast.tgt && isHealer(b.mcast.tgt)) - (a.mcast.tgt && isHealer(a.mcast.tgt)) || (b.mcast.t / b.mcast.total) - (a.mcast.t / a.mcast.total));
    for (const m of casters) {
      if (g.some(p => p !== e && p.kicking === m && S.time - p.kickT < 1)) continue;
      for (const k of [...K.kick, ...(m.boss || m.named ? [] : K.stun)]) if (dist(e, m) <= rangeOf(e, k, m) && ready(e, k, m) && tryUse(e, k, m)) { e.kicking = m; e.kickT = S.time; said(e, ['Kicked.', 'Interrupted.', `Stopped ${m.name}'s cast.`, 'Not on my watch.'], .2); return true; }
    }
  }
  // 2. big pulls: a stun or fear on a loose add that nobody is holding
  if (foes.length >= 3 && (K.stun.length || K.fear.length)) {
    const main = g.find(p => isTank(p) && !p.dead)?.target || S.hero.target || t;
    const loose = foes.find(m => m !== main && !m.boss && !m.named && !cc(m) && m.target && isHealer(m.target) && g.includes(m.target))
      || (foes.length >= 4 ? foes.find(m => m !== main && !m.boss && !m.named && !cc(m) && m.target !== e && !isTank(m.target || {})) : null);
    if (loose) for (const k of [...K.stun, ...K.fear]) if (dist(e, loose) <= rangeOf(e, k, loose) && tryUse(e, k, loose)) { said(e, [`Holding ${loose.name}.`, 'Got the add.', 'Peeling.'], .2); return true; }
  }
  // 3. cooldowns: defensives when it's going badly, big ones for bosses and big pulls
  const hitMe = foes.some(m => m.target === e && !cc(m));
  if (hpPct(e) < (isTank(e) ? .3 : .4) && (hitMe || S.dangers?.length)) for (const k of K.def) if (tryUse(e, k, e)) { said(e, ['Popping a defensive.', 'Saving myself, one sec.'], .3); return true; }
  if (K.gdef.length && g.filter(p => !p.dead && hpPct(p) < .5).length >= Math.min(3, g.length)) for (const k of K.gdef) if (tryUse(e, k, e)) { said(e, ['Everyone, under the shield!', 'Group cooldown, hang on!'], .5); return true; }
  if (!t.engT) t.engT = S.time;
  const bigFight = t.boss || t.named || (t.elite && foes.length >= 2) || foes.length >= 4;
  const burn = t.boss && t.hp < t.maxHp * .3;
  if (bigFight && (!t.boss || (S.time - (t.engT || S.time)) < 8 || burn)) for (const k of K.big) if (tryUse(e, k, e)) { said(e, ['Cooldowns up!', 'Everything I have.', 'Burning it down.'], .25); return true; }
  return false;
};

// positioning: spread out against bosses, keep clear of packs that aren't in the fight, and run the banner home
aiHooks.position = (e, dt, g) => {
  if (e.forceTo || e.pull) return false;
  const j = e.bgJob;
  if (j?.run) { if (Math.hypot(e.x - j.x, e.z - j.z) > 3) { e.sit = false; e.casting = null; goTo(e, j.x, j.z, dt, 2, 1.1); return true; } return false; }
  if (e.posT > 0) { e.posT -= dt; goTo(e, e.posTo.x, e.posTo.z, dt, .5, 1.1); return true; }
  if ((e.posCheck = (e.posCheck || 0) - dt) > 0) return false; e.posCheck = .4;
  const foes = groupFoes(g); if (!foes.length || isTank(e)) return false;
  const boss = foes.find(m => m.boss || m.named);
  // spread: casters and healers don't stand on top of each other when a boss can hit an area
  if (boss && !meleeClass(e)) {
    const mates = g.filter(p => p !== e && !p.dead && !meleeClass(p) && dist(p, e) < 2.4);
    if (mates.length) { const m = mates[0], a = Math.atan2(e.x - m.x, e.z - m.z) + (e.id % 2 ? .6 : -.6); e.posTo = { x: e.x + Math.sin(a) * 3.5, z: e.z + Math.cos(a) * 3.5 }; e.posT = .7; return true; }
  }
  // don't wake the next pack: step back from a sleeping enemy you're standing too close to
  const idle = S.ents.find(m => m.mob && !m.dead && !m.engaged && !m.charmed && !m.bg && !m.pvp && m.team === 'enemy' && dist(m, e) < (MOBS[m.mob]?.aggro || 12) * .7 + 1);
  if (idle && foes.some(f => dist(f, e) < 30)) { const a = Math.atan2(e.x - idle.x, e.z - idle.z); e.posTo = { x: e.x + Math.sin(a) * 4, z: e.z + Math.cos(a) * 4 }; e.posT = .6; if (!e.wakeSaid || S.time - e.wakeSaid > 30) { e.wakeSaid = S.time; said(e, ['Careful, there\'s another pack right there.', 'Backing off, don\'t want to pull those.'], .4); } return true; }
  return false;
};

// battleground jobs: go where the job is, and hold there
aiHooks.job = (e, dt) => {
  const j = e.bgJob; if (!j || S.cmd === 'hold') return false;
  const d = Math.hypot(e.x - j.x, e.z - j.z);
  if (d > (j.r || 4)) { e.sit = false; goTo(e, j.x, j.z, dt, (j.r || 4) * .7, 1); return true; }
  stopMove(e, dt); return true;
};
