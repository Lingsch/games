// Build 13.2: puts Rod's rewritten story text into the game. Keys match the exported script:
// quest.ID.name/.offer.N/.goal/.log/.turnin.N, npc.ID.name/.title, talk.ID.bio/.greet.N/.topicN.ask/.topicN.answer.M,
// folk.NAME.N, scene.KEY.N, lore.KEY.title/.text, boss.MOB.LINE(.N), moblore.KEY, story.KIND.tN.title/.sN.M/.rival/.rival2/.choiceN(.result).
// Text that a getter used to build (your parent, the Frostcrown) stays a getter, so {name}, {rel}, {she} and the rest still fill in.
import { S } from './core.js';
import { QUESTS, MOBS, GIVERS } from './data.js';
import { TALK, VILLAGER_LINES, MOB_LORE } from './dialogue.js';
import { LORE, SCENES } from './story.js';
import { STORIES } from './friends11.js';
import { parent } from './story12.js';
import { world } from './world.js';
import { ROD } from './script13data.js';

const fillAll = s => { const p = parent(); return String(s).replace(/\{rel\}/g, p.rel).replace(/\{name\}/g, p.name).replace(/\{she\}/g, p.she).replace(/\{her\}/g, p.her).replace(/\{She\}/g, p.She).replace(/\{Her\}/g, p.Her).replace(/\{hero\}/g, S.heroName || 'you').replace(/\{town\}/g, S.ext?.valeTown || world.names?.town || 'town'); };
const desc = (o, p) => Object.getOwnPropertyDescriptor(o, p);
function setVal(o, p, text) {
  if (!o) return false; const d = desc(o, p);
  if (d?.get) Object.defineProperty(o, p, { get: () => fillAll(text), configurable: true, enumerable: true });
  else o[p] = text;
  return true;
}
function setAt(o, p, i, text) {
  if (!o) return false; const d = desc(o, p);
  if (d?.get) { const g = d.get; Object.defineProperty(o, p, { get() { const a0 = g.call(this), a = Array.isArray(a0) ? a0.slice() : [a0]; const t = fillAll(text); a[i] = Array.isArray(a[i]) ? [a[i][0], t] : t; return a; }, configurable: true, enumerable: true }); return true; }
  const a = o[p];
  if (Array.isArray(a)) { a[i] = Array.isArray(a[i]) ? [a[i][0], text] : text; return true; }
  if (typeof a === 'string' && i === 0) { o[p] = text; return true; }
  if (typeof a === 'function') { const f = a; o[p] = (...args) => { const r = f(...args); const arr = Array.isArray(r) ? r.slice() : [r]; arr[i] = text; return arr; }; return true; }
  return false;
}
const missed = [];
const offer1 = {};
for (const [key0, text] of Object.entries(ROD)) {
  const key = key0.replace(/ \[[^\]]*\]$/, ''), p = key.split('.'), kind = p[0];
  let ok = false;
  try {
    if (kind === 'quest') {
      const q = QUESTS.find(x => x.id === p[1]); if (!q) { missed.push(key0); continue; }
      if (p[2] === 'name') ok = setVal(q, 'name', text);
      else if (p[2] === 'offer') { ok = setAt(q, 'say', +p[3] - 1, text); if (p[3] === '1') offer1[q.id] = text; }
      else if (p[2] === 'goal') ok = setVal(q.obj, 'what', text);
      else if (p[2] === 'log') { ok = setVal(q, 'text', text); offer1[q.id] = null; }
      else if (p[2] === 'turnin') ok = setAt(q, 'done', +p[3] - 1, text);
    } else if (kind === 'npc') ok = setVal(GIVERS[p[1]], p[2], text);
    else if (kind === 'talk') {
      const t = TALK[p[1]];
      if (p[2] === 'bio') ok = setVal(t, 'bio', text);
      else if (p[2] === 'greet') ok = setAt(t, 'greet', +p[3] - 1, text);
      else { const n = +p[2].replace('topic', '') - 1, tp = t?.topics?.[n]; if (p[3] === 'ask') ok = setVal(tp, 'q', text); else if (p[3] === 'answer') ok = setAt(tp, 'a', +p[4] - 1, text); }
    } else if (kind === 'folk') { const k = p.slice(1, -1).join('.'), i = +p[p.length - 1] - 1; if (Array.isArray(VILLAGER_LINES[k])) { VILLAGER_LINES[k][i] = text; ok = true; } else if (k in VILLAGER_LINES) { VILLAGER_LINES[k] = text; ok = true; } }
    else if (kind === 'scene') { const s = SCENES[p[1]]?.[+p[2] - 1]; if (s) { s.text = text; ok = true; } }
    else if (kind === 'lore') ok = setVal(LORE[p[1]], p[2], text);
    else if (kind === 'moblore') { MOB_LORE[p[1]] = text; ok = true; }
    else if (kind === 'boss') { const L = MOBS[p[1]]?.lines; if (L) { if (p[3]) ok = setAt(L, p[2], +p[3] - 1, text); else { L[p[2]] = text; ok = true; } } }
    else if (kind === 'story') {
      const T = STORIES[p[1]]; if (!T) { missed.push(key0); continue; }
      const f = p[2];
      if (/^t\d$/.test(f)) { T[f] = text; ok = true; }
      else if (/^s\d$/.test(f)) { const g = T[f], i = +p[3] - 1; T[f] = n => { const a = g(n).slice(); a[i] = fillAll(text).replace(/\{friend\}/g, n); return a; }; ok = true; }
      else if (f === 'rival' || f === 'rival2') { const g = T[f], [a0, a1] = text.split(' | '); T[f] = n => { const a = g(n).slice(); if (a0) a[0] = a0.replace(/\{friend\}/g, n); if (a1) a[1] = a1.replace(/\{friend\}/g, n); return a; }; ok = true; }
      else if (/^choice\d$/.test(f)) { const c = T.c?.[+f.slice(6) - 1]; if (c) { c[p[3] === 'result' ? 2 : 0] = text; ok = true; } }
    }
  } catch (e) { ok = false; }
  if (!ok) missed.push(key0);
}
// a quest's log line was its first offer line; keep them together when only the offer changed
for (const [id, t] of Object.entries(offer1)) if (t) { const q = QUESTS.find(x => x.id === id), d = desc(q, 'text'); if (q && !d?.get) q.text = t; }
export const scriptMissed = missed;
if (missed.length) console.warn('script13: lines that found no home', missed);
