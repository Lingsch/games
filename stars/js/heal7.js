// Stars Beneath, Build 7: healers that can fight. Every healer had one attack and a long wait. Each now has a
// proper second and third thing to do to an enemy between heals: weaker than a damage class, but not nothing.
import { S, X, chat } from './core.js';
import { CLASSES, BENCH, defaultBar } from './data.js';
const add = (cls, after, abs) => { const c = CLASSES[cls], out = {}; for (const [k, a] of Object.entries(c.abilities)) { out[k] = a; if (k === after) Object.assign(out, abs); } c.abilities = out; };
// Field Medic: a toxin dart that keeps working while you heal, and an overcharged shot on a short cooldown
add('cleric', 'smite', {
  toxin: { name: 'Toxin Dart', icon: '☣️', lvl: 2, kind: 'attack', cost: 6, range: 30, tgt: 'enemy', school: 'poison', desc: 'Instant. Poison damage over 12 seconds.', fx: (C, u, t) => C.dot(u, t, 'toxin', C.pw(u) * .17 + 1.5, 12, 'poison') },
  overcharge: { name: 'Overcharge Shot', icon: '⚡', lvl: 4, kind: 'attack', cost: 9, cast: 1.5, cd: 8, range: 30, tgt: 'enemy', school: 'storm', desc: 'Dumps the injector’s power cell into one shot. Heavy storm damage.', fx: (C, u, t) => C.bolt(u, t, C.pw(u) * 1.3 + 10, 'storm') },
});
// Shield Tech: an arc that clings to a target, and a barrier thrown outward as a blast
add('aegis', 'judgment', {
  tether: { name: 'Arc Tether', icon: '🔗', lvl: 2, kind: 'attack', cost: 6, range: 30, tgt: 'enemy', school: 'storm', desc: 'Instant. Storm damage over 12 seconds.', fx: (C, u, t) => C.dot(u, t, 'tether', C.pw(u) * .16 + 1.5, 12, 'storm') },
  burst: { name: 'Barrier Burst', icon: '💠', lvl: 4, kind: 'attack', cost: 10, cd: 10, range: 30, tgt: 'enemy', school: 'storm', desc: 'Instant. A barrier thrown outward: storm damage to every enemy within 6 m of the target.', fx: (C, u, t) => { for (const e of C.enemiesNear(u, t, 6)) C.damage(u, e, C.pw(u) * .85 + 6, 'storm'); C.fxRing(t, 6, [.5, .8, 1]); } },
});
// Lifebinder / Bloodbinder: a mark that burns the way their mending lights heal (their drone already shoots)
add('lifebinder', 'thorn', {
  mark: { name: 'Lingering Light', icon: '🔥', lvl: 2, kind: 'attack', cost: 6, range: 30, tgt: 'enemy', school: 'holy', desc: 'Instant. Damage over 15 seconds.', fx: (C, u, t) => C.dot(u, t, 'bindmark', C.pw(u) * .18 + 1.5, 15, X.path?.() === 'dark' ? 'shadow' : 'holy') },
});
// the first attack of every healer hits a little harder, and the Xenobiologist's too
for (const [cls, k] of [['cleric', 'smite'], ['aegis', 'judgment'], ['lifebinder', 'thorn'], ['druid', 'moonfire']]) { const ab = CLASSES[cls].abilities[k]; if (!ab || ab._up) continue; ab._up = 1; const fx = ab.fx;
  ab.fx = (C, u, t) => { const pw = C.pw; C.pw = x => pw(x) * 1.2; try { return fx(C, u, t); } finally { C.pw = pw; } }; }
// what stays in the Book when a bar is full
Object.assign(BENCH, { cleric: ['rez', 'fade'], aegis: ['rune', 'echoes'], lifebinder: ['rooted'], druid: ['gate', 'cat'] });
// heroes made before this build get the new attacks on their bars once
X.zone.push(() => { if (!S.hero || S.ext.barV >= 7) return; S.ext.barV = 7; let n = 0; for (const k of ['cleric', 'aegis', 'lifebinder']) if (S.bar?.[k] && !S.bar[k].includes(k === 'cleric' ? 'toxin' : k === 'aegis' ? 'tether' : 'mark')) { S.bar[k] = defaultBar(k); n++; }
  if (n && ['cleric', 'aegis', 'lifebinder'].includes(S.heroCls)) chat('sys', null, 'Your hotbar has been reset to make room for new attacks. Anything it dropped is in the Book under Abilities.'); });
