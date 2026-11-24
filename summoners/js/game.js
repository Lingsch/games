// Run rules: the hero, spells, cities, raids, escalation, economy, saving and the meta layer.
import { S, WH, TAU, clamp, rnd, hexRGB } from './core.js';
import { world, hgt, updateWalls, setCityLook, placeBuilding, generateWorld } from './world.js';
import * as Un from './units.js';
import { magic, dust, paintDisc, resetLand } from './render.js';
import * as UI from './ui.js';
import * as PR from './progress.js';
import * as UP from './upgrades.js';
import { M } from './progress.js';

// ---------- meta progression (survives death) ----------
export const META_UPS = [
  { id: 'will', name: 'Hardened Will', desc: '+15 maximum health', max: 5, cost: l => 15 + l * 15 },
  { id: 'well', name: 'Deep Wellspring', desc: '+1 mana per second', max: 5, cost: l => 15 + l * 15 },
  { id: 'pact', name: 'Elder Pact', desc: '+4 horde cap', max: 5, cost: l => 20 + l * 20 },
  { id: 'cache', name: 'Hidden Cache', desc: 'Start each run with 40 gold and 30 stone', max: 3, cost: l => 25 + l * 25 }];
export function loadMeta() {
  let m = null; try { m = JSON.parse(localStorage.getItem('shr_meta')); } catch (e) { }
  S.meta = Object.assign({ embers: 0, ups: {}, runs: 0, best: 0 }, m || {});
}
export function saveMeta() { try { localStorage.setItem('shr_meta', JSON.stringify(S.meta)); } catch (e) { } }
export const metaLvl = id => S.meta.ups[id] || 0;
export function buyMeta(id) {
  const u = META_UPS.find(u => u.id === id), l = metaLvl(id);
  if (!u || l >= u.max || S.meta.embers < u.cost(l)) return false;
  S.meta.embers -= u.cost(l); S.meta.ups[id] = l + 1; saveMeta(); return true;
}

// ---------- derived stats ----------
const owned = () => world.cities.filter(c => c.state === 'owned');
const perkCount = id => owned().filter(c => c.perk.id === id).length;
const bLevels = type => owned().reduce((s, c) => s + c.buildings.reduce((t, b) => t + (b.type === type ? b.lvl : 0), 0), 0);
export const stat = n => (S.st && S.st[n] !== undefined ? S.st[n] : 1);
export function recompute() {
  PR.recomputeMods(); UP.addUpgradeMods(S.mods);
  const h = S.hero, own = owned().length, fonts = bLevels('font');
  S.st = {
    cap: 12 + metaLvl('pact') * 4 + h.level * 4 + own * 25 + bLevels('circle') * 15 + perkCount('cap') * 20 + Math.round(M('cap')),
    manaMax: 100 + (h.level - 1) * 8 + fonts * 15 + M('mana'),
    regen: 5 + metaLvl('well') + (h.level - 1) * .4 + fonts + perkCount('regen') + M('regen'),
    hpMax: CLASSES[S.cls].hp + metaLvl('will') * 15 + (h.level - 1) * 8 + perkCount('hp') * 15 + M('hp'),
    dmgMul: 1 + .1 * perkCount('dmg'), goldMul: 1 + .25 * perkCount('gold') + M('gold'), costMul: Math.pow(.9, perkCount('cheap')),
  };
  // on-hit effects from capstone skills, per creature kind
  S.onHit = {};
  const oh = (k, o) => { S.onHit[k] = Object.assign(S.onHit[k] || {}, o); };
  if (M('flag:tide')) oh(1, { slow: 2 }); if (M('flag:heartwood')) oh(9, { slow: 3 }); if (M('flag:wings')) oh(10, { slow: 2 });
  if (M('flag:haunt')) oh(14, { slow: 2.5 }); if (M('flag:alpha')) oh(7, { leech: 1.5 }); if (M('flag:feast')) oh(12, { leech: 1.5 });
  // what upgrade cards do to each kind of creature, and how strong buffs are
  S.kMut = [];
  for (let k = 0; k < Un.K.length; k++) S.kMut[k] = { scale: Math.max(.4, 1 + M('scale:' + k)), armor: Math.min(.75, M('armor:' + k) + M('armor:all')), haste: M('haste:' + k) + M('haste:all'), blink: M('blink:' + k), split: M('split:' + k), rebirth: M('rebirth:' + k), trail: M('trail:' + k), boomR: 1 + M('boomR:' + k), aura: 0 };
  for (const id in S.spellUps || {}) for (const c of S.spellUps[id]) for (const key in c.fx) if (key.startsWith('aura:')) S.kMut[+key.slice(5)].aura = c.fx[key];
  for (const sl of PR.SLOTS) { const it = S.equip[sl], u = it && it.unique && PR.UNIQUES.find(u => u.id === it.unique); if (u) for (const key in u.fx) if (key.startsWith('aura:')) S.kMut[+key.slice(5)].aura = u.fx[key]; }
  S.bMul = { BD: 1.6, BF: 1.6, BS: .5 }; S.shapeMul = 2; S.shapeTake = .5;
  for (const id of S.known) if (M('od:' + id)) { const s = SPELLS.find(s => s.id === id); if (!s) continue; if (id === 'shape') { S.shapeMul = 4; S.shapeTake = .25; } for (const b of s.boosts || []) S.bMul[b] = b === 'BS' ? .25 : b === 'BD' ? 2.4 : 2.2; }
  for (let k = 0; k < Un.K.length; k++) if (Un.K[k].web) oh(k, { slow: Un.K[k].web });
  S.regenK = [];
  for (let k = 0; k < Un.K.length; k++) {
    const lc = M('leech:' + k), ch = M('chill:' + k);
    if (lc) oh(k, { leech: ((S.onHit[k] || {}).leech || 0) + lc }); if (ch) oh(k, { slow: Math.max((S.onHit[k] || {}).slow || 0, ch) });
    S.regenK[k] = M('regen:' + k);
  }
  h.hpMax = S.st.hpMax; h.manaMax = S.st.manaMax;
  for (const c of world.cities) c.heartMax = 150 + ((c.lvl || 1) - 1) * 90;
}
const xpNeedF = l => Math.round(14 * l ** 1.5);

// ---------- run lifecycle ----------
export function newRun(seed, save = null, cls = 'elem') {
  S.cls = (save && save.cls) || cls; S.seed = seed; generateWorld(seed, CLASSES[S.cls] ? S.cls : 'elem'); resetLand(); Un.clearUnits(); magic.clear(); dust.clear();
  Object.assign(S, { time: 0, kills: 0, over: false, paused: false, running: true, frame: 0, cd: {}, lastSpell: 'imps', skills: [], skillPts: 0, relics: [], equip: {}, inv: [], loot: [], eyeCount: 0, lastBreath: false, partyT: 120, spawnT: 10, raidT: 0, incomeT: 10, saveT: 30, citiesTaken: 0, buffs: { tail: 0, kindle: 0, stone: 0 }, castLock: 0, picks: 0, offer: null, threat: .5, aim: { x: 0, z: 10, locked: false }, aimOverride: null });
  S.known = [...CLASSES[S.cls].starter, ...unlockedFor(S.cls)].filter((id, k, a) => a.indexOf(id) === k && SPELLS.some(sp => sp.id === id));
  S.loadout = [...S.known.slice(0, 12), ...Array(12).fill(null)].slice(0, 12); sortBar();
  S.spellUps = {}; S.spellOffers = {}; S.spellPts = 0; S.zones = []; S.echoQ = []; S.autoT = {}; S.spawnQ = []; S.meteors = []; S.potions = { hp: 2, mp: 1, fury: 0 };
  S.hero = { x: 0, z: 0, y: hgt(0, 0), hp: 80, hpMax: 80, swing: 0, mana: 100, manaMax: 100, level: 1, xp: 0, yaw: Math.PI, moving: 0, hurtT: 9, boltCD: 0 };
  S.res = { gold: metaLvl('cache') * 70, essence: 0 };
  S.orders = [0, 1, 2, 3].map(() => ({ mode: 'charge', x: 0, z: 0 }));
  recompute();
  if (save) applySave(save);
  else { S.hero.hp = S.hero.hpMax; const st = SPELLS.find(sp => sp.id === CLASSES[S.cls].starter[0] && sp.kind !== undefined) || SPELLS.find(sp => sp.cls === S.cls && sp.kind !== undefined); summon(st.kind, S.cls === 'druid' ? 2 : 4); S.meta.runs++; saveMeta(); }
  recompute();
  UI.onRunStart();
}
export function gameOver() {
  if (S.over) return;
  S.over = true;
  const h = S.hero, mins = S.time / 60;
  const embers = Math.floor(S.kills / 8 + S.citiesTaken * 15 + (h.level - 1) * 3 + mins);
  S.meta.embers += embers; S.meta.best = Math.max(S.meta.best || 0, S.kills); saveMeta();
  try { localStorage.removeItem('shr_run'); } catch (e) { }
  UI.showGameOver({ embers, kills: S.kills, cities: S.citiesTaken, level: h.level, mins });
}

// ---------- saving ----------
export function snapshot() {
  const h = S.hero, horde = [0, 0, 0, 0];
  for (let i = 0; i < Un.U.N; i++) if (!Un.TEAM[i]) horde[Un.KIND[i]] = (horde[Un.KIND[i]] || 0) + 1;
  return {
    v: 7, potions: S.potions, cls: S.cls, known: S.known, spellUps: S.spellUps, spellOffers: S.spellOffers, spellPts: S.spellPts, loadout: S.loadout, meta: S.meta, skills: S.skills, skillPts: S.skillPts, relics: S.relics, equip: S.equip, inv: S.inv, lastBreath: S.lastBreath, seed: S.seed, time: S.time, kills: S.kills, citiesTaken: S.citiesTaken,
    hero: { x: h.x, z: h.z, hp: h.hp, mana: h.mana, level: h.level, xp: h.xp }, res: S.res, horde,
    cities: world.cities.map(c => ({ state: c.state, wallHP: c.wallHP, gateHP: c.gateHP, towerHP: c.towerHP, sally: c.sally, heartHP: c.heartHP, lordAlive: c.lordAlive, discovered: c.discovered, lvl: c.lvl || 1 })),
    camps: world.camps.map(c => c.cleared ? 1 : 0),
  };
}
export function saveRun() {
  if (S.over || !S.running) return false;
  try { localStorage.setItem('shr_run', JSON.stringify(snapshot())); return true; } catch (e) { return false; }
}
export function loadRunSave() { try { return JSON.parse(localStorage.getItem('shr_run')); } catch (e) { return null; } }
// save codes: compressed JSON in base64, prefixed so we can tell versions apart
const b64 = u8 => { let t = ''; for (let k = 0; k < u8.length; k += 0x8000) t += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000)); return btoa(t); };
const unb64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
async function pipe(bytes, stream) { const out = new Response(new Blob([bytes]).stream().pipeThrough(stream)); return new Uint8Array(await out.arrayBuffer()); }
export async function exportCode() {
  const json = new TextEncoder().encode(JSON.stringify(snapshot()));
  if (typeof CompressionStream !== 'undefined') { try { return 'SUMMON2.' + b64(await pipe(json, new CompressionStream('deflate-raw'))); } catch (e) { } }
  return 'SUMMON1.' + b64(json);
}
export async function importCode(code) {
  try {
    const raw = code.replace(/\s+/g, ''), dot = raw.indexOf('.');
    let json;
    if (raw.startsWith('SUMMON2.')) json = new TextDecoder().decode(await pipe(unb64(raw.slice(dot + 1)), new DecompressionStream('deflate-raw')));
    else if (raw.startsWith('SUMMON1.')) json = new TextDecoder().decode(unb64(raw.slice(dot + 1)));
    else json = decodeURIComponent(escape(atob(raw)));   // codes from earlier builds
    const s = JSON.parse(json); if (!s || !s.v || s.seed === undefined) return false;
    newRun(s.seed, s); saveRun(); return true;
  } catch (e) { console.warn(e); return false; }
}
function applySave(s) {
  Object.assign(S, { time: s.time, kills: s.kills, citiesTaken: s.citiesTaken || 0 });
  if (s.meta) {
    for (const k of ['embers', 'runs', 'best']) S.meta[k] = Math.max(S.meta[k] || 0, s.meta[k] || 0);
    S.meta.ups = S.meta.ups || {}; for (const k in s.meta.ups || {}) S.meta.ups[k] = Math.max(S.meta.ups[k] || 0, s.meta.ups[k]);
    for (const c in s.meta.unlocked || {}) { const u = unlockedFor(c); for (const id of s.meta.unlocked[c]) if (!u.includes(id)) u.push(id); }
  }
  S.spellUps = s.spellUps || {}; S.spellOffers = s.spellOffers || {}; S.spellPts = s.spellPts || 0;
  if (s.known) {
    const known = [...CLASSES[S.cls].starter, ...unlockedFor(S.cls)].filter((id, k, a) => a.indexOf(id) === k);
    let refund = 0;
    for (const raw of s.known) { const id = FOLDED[raw] ? FOLDED[raw][0] : raw; if (!SPELLS.some(sp => sp.id === id)) continue; if (known.includes(id)) { if (FOLDED[raw]) refund++; } else known.push(id); }
    if ((s.v || 0) < 5) { // older builds: spells you'd learned stay unlocked for good; ranks and unspent picks come back as spell points
      refund += s.picks || 0; for (const id in s.ranks || {}) refund += Math.max(0, s.ranks[id] - 1);
      S.spellPts += refund; const u = unlockedFor(S.cls); for (const id of known) if (!u.includes(id) && !CLASSES[S.cls].starter.includes(id)) u.push(id);
    }
    S.known = known;
  }
  saveMeta();
  const bar = (s.loadout || []).map(id => FOLDED[id] ? FOLDED[id][0] : id).filter((id, k, a) => id && S.known.includes(id) && a.indexOf(id) === k);
  for (const id of S.known) if (bar.length < 12 && !bar.includes(id)) bar.push(id);
  S.loadout = [...bar, ...Array(12).fill(null)].slice(0, 12);
  S.skills = []; S.skillPts = 0;   // the skill tree is gone
  S.potions = s.potions ? { hp: 0, mp: 0, fury: 0, ...s.potions } : { hp: 2, mp: 1, fury: 0 };
  if ((s.v || 0) < 6) { for (const id in S.spellUps) S.spellPts += S.spellUps[id].length; S.spellUps = {}; S.spellOffers = {}; } S.relics = s.relics || []; S.equip = s.equip || {}; S.inv = s.inv || []; S.lastBreath = !!s.lastBreath;
  { const r = s.res || {}; S.res = { gold: (r.gold || 0) + (r.stone || 0), essence: (r.essence || 0) + (r.iron || 0) + 2 * (r.crystal || 0) }; }   // older saves had five resources
  Object.assign(S.hero, s.hero); S.hero.y = hgt(S.hero.x, S.hero.z);
  s.cities.forEach((d, i) => {
    const c = world.cities[i]; if (!c) return;
    Object.assign(c, { state: d.state, wallHP: d.wallHP, gateHP: d.gateHP ?? c.gateHP, towerHP: d.towerHP || c.towerHP, sally: !!d.sally, heartHP: d.heartHP, lordAlive: d.lordAlive, discovered: d.discovered });
    // older saves kept separate buildings: turn their total into a city level
    c.lvl = d.lvl || (d.buildings ? 1 + [1, 3, 6, 10].filter(n => d.buildings.reduce((t, b) => t + (b.lvl || 0), 0) >= n).length : 1);
    if (c.state === 'owned') applyCityLevel(c); else { c.lvl = 1; applyCityLevel(c); }
    if (c.state === 'owned') paintDisc(c.x, c.z, c.R + 6, CLASSES[S.cls].land, 1);
    setCityLook(c);
  });
  (s.camps || []).forEach((v, i) => { if (v && world.camps[i]) world.camps[i].cleared = world.camps[i].discovered = true; });
  recompute();
  s.horde.forEach((n, k) => { if (n && Un.K[k] && Un.K[k].el !== undefined) summon(k, n, true); });
}

// ---------- hero ----------
export function damageHero(d, src = -1) {
  if (S.over) return;
  if (M('flag:barkhero') && S.buffs.stone > 0) d *= .5;
  if (S.buffs.shape > 0) d *= S.shapeTake || .5;
  S.hero.hp -= d; S.hero.hurtT = 0; UI.hurtFlash();
  if (src >= 0 && M('thorns')) Un.hitUnit(src, M('thorns'));
  if (S.hero.hp <= 0) {
    if (M('flag:lastbreath') && !S.lastBreath) { S.lastBreath = true; S.hero.hp = S.hero.hpMax * .5; UI.toast('Last Breath: you refuse to fall.', 'good'); burst(S.hero.x, S.hero.y, S.hero.z, 120, [1, 1, .8], 10); return; }
    S.hero.hp = 0; gameOver();
  }
}
export function updateHero(dt, ix, iz) {
  const h = S.hero, spd = 9 * (S.buffs.tail > 0 ? 1.6 : 1) * (1 + M('heroSpd'));
  const px = h.x, pz = h.z;
  h.x = clamp(h.x + ix * spd * dt, -WH + 4, WH - 4); h.z = clamp(h.z + iz * spd * dt, -WH + 4, WH - 4);
  for (const c of world.cities) {
    const kx = h.x - c.x, kz = h.z - c.z, kd = Math.hypot(kx, kz);
    if (kd < 4.4) { h.x = c.x + kx / (kd || 1) * 4.4; h.z = c.z + kz / (kd || 1) * 4.4; }
    if (c.state !== 'hostile') continue;
    const ox = h.x - c.x, oz = h.z - c.z, d = Math.hypot(ox, oz), inside = Math.hypot(px - c.x, pz - c.z) < c.R, lim = inside ? c.R - .8 : c.R + .8;
    if ((inside && d > lim) || (!inside && d < lim)) { const s = lim / (d || 1); h.x = c.x + ox * s; h.z = c.z + oz * s; }
  }
  h.y = hgt(h.x, h.z);
  h.moving += ((Math.hypot(ix, iz) > .1 ? 1 : 0) - h.moving) * Math.min(1, dt * 8);
  if (Math.hypot(ix, iz) > .35) { let df = Math.atan2(ix, iz) - h.yaw; df -= Math.round(df / TAU) * TAU; h.yaw += df * Math.min(1, dt * 14); }
  h.hurtT += dt; if (h.hurtT > 4) h.hp = Math.min(h.hpMax, h.hp + dt * 2);
  if (M('heroRegen')) h.hp = Math.min(h.hpMax, h.hp + M('heroRegen') * dt);
  h.mana = Math.min(h.manaMax, h.mana + S.st.regen * dt);
  for (const k in S.buffs) if (S.buffs[k] > 0) S.buffs[k] = Math.max(0, S.buffs[k] - dt);
  // aim: where you face, nudged onto a foe in front of you; or wherever you drag
  if (S.aimOverride) { S.aim = { x: S.aimOverride.x, z: S.aimOverride.z, locked: false }; h.yaw = Math.atan2(S.aim.x - h.x, S.aim.z - h.z); }
  else {
    const fx = Math.sin(h.yaw), fz = Math.cos(h.yaw); let best = null, bd = 18 * 18;
    if (S.assist !== false) for (let i = 0; i < Un.U.N; i++) {
      if (!Un.TEAM[i]) continue;
      const dx = Un.X[i] - h.x, dz = Un.Z[i] - h.z, d2 = dx * dx + dz * dz;
      if (d2 < bd && d2 > 1 && (dx * fx + dz * fz) / Math.sqrt(d2) > .94) { bd = d2; best = i; }
    }
    S.aim = best !== null ? { x: Un.X[best], z: Un.Z[best], locked: true } : { x: h.x + fx * 10, z: h.z + fz * 10, locked: false };
  }
  if (S.castLock > 0) S.castLock -= dt;
  heroAttack(dt);
}
// each summoner's own weapon: ember bolts, a druid's claws, a necromancer's soul bolts
function heroAttack(dt) {
  const h = S.hero, cls = CLASSES[S.cls];
  h.boltCD -= dt; if (h.boltCD > 0) return;
  if (cls.attack === 'melee') {
    let best = -1, bd = 3.2 * 3.2;
    for (let i = 0; i < Un.U.N; i++) if (Un.TEAM[i]) { const d = (Un.X[i] - h.x) ** 2 + (Un.Z[i] - h.z) ** 2; if (d < bd) { bd = d; best = i; } }
    if (best < 0) return;
    const dmg = (4 + h.level * .6) * S.st.dmgMul * (1 + M('melee')) * (S.buffs.shape > 0 ? S.shapeMul || 2 : 1);
    Un.hitUnit(best, dmg); h.boltCD = .7; h.swing = 1;
    if (M('flag:splash')) for (const j of Un.unitsNear(Un.X[best], Un.Z[best], 2.2, 1, 4)) if (j !== best) Un.hitUnit(j, dmg * .5);
    if (M('flag:shape')) h.hp = Math.min(h.hpMax, h.hp + 2);
    if (!S.aimOverride && !h.moving) h.yaw = Math.atan2(Un.X[best] - h.x, Un.Z[best] - h.z);
    for (let q = 0; q < 6; q++) magic.emit(Un.X[best], hgt(Un.X[best], Un.Z[best]) + 1.1, Un.Z[best], rnd(-2, 2), rnd(0, 2), rnd(-2, 2), .3, .6, 1, .8, .35);
    return;
  }
  if (S.aim.locked && Math.hypot(S.aim.x - h.x, S.aim.z - h.z) < 14) { // the staff spits at whatever you face
    const d = Math.hypot(S.aim.x - h.x, S.aim.z - h.z);
    Un.fire(h.x + .5, h.y + 2.4, h.z, S.aim.x, hgt(S.aim.x, S.aim.z) + 1, S.aim.z, .3 + d / 40, 0, (2 + h.level * .3) * S.st.dmgMul, cls.attack === 'soul' ? 4 : 2);
    h.boltCD = 1.1;
  }
}
export function gainXP(n) {
  const h = S.hero; h.xp += n;
  while (h.xp >= xpNeedF(h.level)) {
    h.xp -= xpNeedF(h.level); h.level++; recompute(); h.hp = Math.min(h.hpMax, h.hp + h.hpMax * .3);
    S.spellPts++; UI.toast(`Level ${h.level}: a spell point to spend in your book.`, 'good');
  }
}
export const xpFrac = () => S.hero.xp / xpNeedF(S.hero.level);

// ---------- the three summoners ----------
export const CLASSES = {
  elem: { name: 'Elementalist', role: 'Fragile caster', color: '#ff6a2b', hp: 80, attack: 'bolt', land: 1, squads: ['Fire', 'Water', 'Earth', 'Air'], sqCol: ['#ff6a2b', '#4fb0e8', '#d9a441', '#a58cff'],
    starter: ['fireball', 'imps', 'golem', 'kindle'], blurb: 'Hard-hitting spirits that burn out. You are fragile: stay behind them.' },
  druid: { name: 'Druid', role: 'Fights alongside', color: '#e0a33a', hp: 130, attack: 'melee', land: 5, squads: ['Wolves', 'Bears', 'Treants', 'Hornets'], sqCol: ['#c9a46e', '#a0703c', '#6aa844', '#f0c020'],
    starter: ['wolves', 'thorns', 'bear', 'wildgrowth'], blurb: 'Fewer, tougher beasts that stay. You fight in the thick of it with claws and bark.' },
  necro: { name: 'Necromancer', role: 'Commander', color: '#9be36b', hp: 95, attack: 'soul', land: 6, raise: true, squads: ['Skeletons', 'Ghouls', 'Horrors', 'Wraiths'], sqCol: ['#ebdfc2', '#8a9a7a', '#a8949a', '#7fffd4'],
    starter: ['raise', 'bonespear', 'abom', 'frenzy'], blurb: 'Every foe that falls near you rises to serve. The dead rot, so keep killing.' }};
const burst = (x, y, z, n, col, spd = 6, size = 1) => { for (let q = 0; q < n; q++) { const a = Math.random() * TAU, s = rnd(.3, 1) * spd; magic.emit(x, y + rnd(.3, 1.5), z, Math.cos(a) * s, rnd(.5, 3), Math.sin(a) * s, rnd(.5, 1), rnd(.6, 1.3) * size, ...col, 2); } };
export function summon(kind, n, silent = false) {
  const h = S.hero, col = Un.K[kind].col, rise = kind === 2 || kind === 9 || kind === 11 || kind === 13;
  for (let q = 0; q < n; q++) {
    const a = Math.random() * TAU, d = 1.6 + Math.random() * 3, x = h.x + Math.cos(a) * d, z = h.z + Math.sin(a) * d;
    const i = Un.spawn(0, kind, x, z, { rise, hpMul: 1 + (h.level - 1) * .06 });
    if (i < 0) break;
    if (!silent) burst(x, hgt(x, z), z, 6, col, 2.5, .8);
  }
}
const buffAllies = (r, arrs, t) => { for (const j of Un.unitsNear(S.hero.x, S.hero.z, r, 0)) for (const a of arrs) a[j] = t; };
const healAllies = (r, n) => { for (const j of Un.unitsNear(S.hero.x, S.hero.z, r, 0)) Un.HP[j] = Math.min(Un.HPM[j], Un.HP[j] + n); };
// damage, radius, duration and healing for a spell, after skills, gear and relics
let TMP = 1;   // a temporary damage scale, for barrage strikes
const SD = id => TMP * S.st.dmgMul * (1 + M('sp:' + id) + M('sp:all')), RAD = id => 1 + M('rad:' + id), DUR = id => 1 + M('dur:' + id) + M('dur:all'), HL = id => 1 + M('heal:' + id);
let CUR = null;   // the spell being cast right now, so its upgrades can ride along on every hit
function hitFx(j) {
  if (!CUR) return; const sl = M('slow:' + CUR), wk = M('weaken:' + CUR), dr = M('drain:' + CUR), mh = M('manahit:' + CUR), h = S.hero;
  if (sl) Un.SLOW[j] = Math.max(Un.SLOW[j], sl); if (wk) Un.CURSE[j] = Math.max(Un.CURSE[j], wk);
  if (dr) h.hp = Math.min(h.hpMax, h.hp + dr); if (mh) h.mana = Math.min(h.manaMax, h.mana + mh);
}
const hurtAt = (x, z, r, dmg, slow = 0) => { const out = Un.unitsNear(x, z, r, 1); for (const j of out) { Un.hitUnit(j, dmg); if (slow) Un.SLOW[j] = Math.max(Un.SLOW[j], slow); hitFx(j); } return out; };
const lightning = (x0, y0, z0, x1, y1, z1) => { for (let q = 0; q < 10; q++) { const t = q / 9; magic.emit(x0 + (x1 - x0) * t + rnd(-.3, .3), y0 + (y1 - y0) * t + rnd(-.3, .3), z0 + (z1 - z0) * t + rnd(-.3, .3), 0, 0, 0, .25, .8, .8, .7, 1); } };
// everything along the line from you to the aim point
function lineHit(a, width, dmg, col, push = 0) {
  const h = S.hero, dx = a.x - h.x, dz = a.z - h.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, hit = [];
  for (let i = 0; i < Un.U.N; i++) {
    if (!Un.TEAM[i]) continue;
    const rx = Un.X[i] - h.x, rz = Un.Z[i] - h.z, along = rx * ux + rz * uz, off = Math.abs(rx * uz - rz * ux);
    if (along > 0 && along < L && off < width) { Un.hitUnit(i, dmg); hitFx(i); hit.push(i); if (push) { Un.X[i] += ux * push; Un.Z[i] += uz * push; } }
  }
  for (let q = 0; q < 50; q++) { const t = Math.random() * L; magic.emit(h.x + ux * t + rnd(-.4, .4), hgt(h.x + ux * t, h.z + uz * t) + rnd(.3, 1.4), h.z + uz * t + rnd(-.4, .4), ux * 3, rnd(.5, 2), uz * 3, rnd(.3, .6), rnd(.6, 1.1), ...col); }
  return hit;
}
const wallsAt = (x, z, r, dmg) => { for (const c of world.cities) if (c.state === 'hostile' && Math.abs(Math.hypot(x - c.x, z - c.z) - c.R) < r) hitWall(c, dmg * (1 + M('siege:all')), x, z); };
const H = () => S.hero;
const D = s => Math.round(s.dmg * SD(s.id)), AR = s => +(s.radius * RAD(s.id)).toFixed(1), T = s => Math.round(s.dur * DUR(s.id)), HV = (s, k) => Math.round(s.heal[k] * HL(s.id)), RK = id => rankOf(id);
const buff = (id, arrs, t, key, col) => { const d = t * DUR(id), r = 16 * RAD(id); buffAllies(r, arrs, d); if (M('mend:' + id)) healAllies(r, M('mend:' + id)); for (const k of key) S.buffs[k] = d; burst(H().x, H().y, H().z, 80, col, 10); };
// type: summon / attack / buff. Spells cost mana only; there are no cooldowns.
export const SPELLS = [
  // ---------- Elementalist ----------
  { id: 'fireball', cls: 'elem', type: 'attack', name: 'Fireball', cost: 14, aim: true, range: 18, radius: 3.8, dmg: 7,
    desc: 'Throws a fireball where you aim. It explodes, hurting every foe in the blast and scorching the ground.',
    label() { return `${D(this)} dmg · ${AR(this)}m blast`; },
    cast(a) { const h = H(), d = Math.hypot(a.x - h.x, a.z - h.z); Un.fire(h.x + .5, h.y + 2.5, h.z, a.x, hgt(a.x, a.z) + .4, a.z, .3 + d / 32, 0, this.dmg * SD(this.id), 1, this.radius * RAD(this.id)); } },
  { id: 'imps', cls: 'elem', type: 'summon', name: 'Fire Spirits', n: 3, kind: 0, cost: 12, unit: ['Fire Spirit', 'Fire Spirits'],
    desc: 'Summons Fire Spirits beside you. Fast, hard-hitting and fragile. They burn out after 40 seconds.' },
  { id: 'golem', cls: 'elem', type: 'summon', name: 'Stone Golem', n: 1, kind: 2, cost: 24, unit: ['Stone Golem', 'Stone Golems'],
    desc: 'Summons a Stone Golem. Slow and very tough, and it hits walls three times harder. Crumbles after 80 seconds.' },
  { id: 'kindle', cls: 'elem', type: 'buff', boosts: ['BD'], name: 'Kindle', cost: 25, dur: 10,
    desc: 'Your creatures near you deal 60% more damage for a while.',
    label() { return `+60% creature dmg · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BD], this.dur, ['kindle'], [1, .5, .12]); } },
  { id: 'undine', cls: 'elem', type: 'summon', name: 'Undines', n: 2, kind: 1, cost: 14, unit: ['Undine', 'Undines'],
    desc: 'Summons Undines. They hit weakly but heal your creatures near them. They fade after 45 seconds.' },
  { id: 'sprites', cls: 'elem', type: 'summon', name: 'Storm Sprites', n: 4, kind: 3, cost: 12, unit: ['Storm Sprite', 'Storm Sprites'],
    desc: 'Summons Storm Sprites. Very fast and frail, they strike rapidly. They fade after 30 seconds.' },
  { id: 'nova', cls: 'elem', type: 'attack', name: 'Frost Nova', cost: 20, dmg: 3, radius: 9,
    desc: 'Blasts frost out from you. Hurts every foe nearby, knocks them back and slows them.',
    label() { return `${D(this)} dmg · ${AR(this)}m around you · slows`; },
    cast() { const h = H(), r = this.radius * RAD(this.id); for (const j of hurtAt(h.x, h.z, r, this.dmg * SD(this.id), 4)) { const dx = Un.X[j] - h.x, dz = Un.Z[j] - h.z, d = Math.hypot(dx, dz) || 1; Un.X[j] += dx / d * 3; Un.Z[j] += dz / d * 3; }
      paintDisc(h.x, h.z, r, 2, .8); burst(h.x, h.y, h.z, 140, [.55, .85, 1], r * 1.5); } },
  { id: 'chain', cls: 'elem', type: 'attack', name: 'Chain Lightning', cost: 18, aim: true, range: 18, radius: 5, dmg: 5, jumps: 10,
    desc: 'Lightning strikes the foe nearest your aim, then jumps from foe to foe.',
    label() { return `${D(this)} dmg · up to ${this.jumps + M('n:chain')} foes`; },
    cast(a) { const h = H(); let px = h.x + .5, py = h.y + 2.5, pz = h.z;
      for (const j of Un.unitsNear(a.x, a.z, 9, 1, this.jumps + M('n:chain'))) { const y = hgt(Un.X[j], Un.Z[j]) + 1; lightning(px, py, pz, Un.X[j], y, Un.Z[j]); Un.hitUnit(j, this.dmg * SD(this.id)); hitFx(j); px = Un.X[j]; py = y; pz = Un.Z[j]; } } },
  { id: 'quake', cls: 'elem', type: 'attack', name: 'Earthquake', cost: 32, aim: true, range: 16, radius: 7, dmg: 6, wall: 45,
    desc: 'Shakes the ground where you aim. Hurts every foe in a wide area and badly damages city walls, gates and towers.',
    label() { return `${D(this)} dmg · ${AR(this)}m · ${Math.round(this.wall * S.st.dmgMul * (1 + M('sp:quake')))} to walls`; },
    cast(a) { const r = this.radius * RAD(this.id); hurtAt(a.x, a.z, r, this.dmg * SD(this.id)); wallsAt(a.x, a.z, r, this.wall * S.st.dmgMul * (1 + M('sp:quake'))); paintDisc(a.x, a.z, r, 3, .8); UI.shake(.6);
      for (let q = 0; q < 60; q++) dust.emit(a.x + rnd(-r, r), hgt(a.x, a.z) + rnd(0, 1), a.z + rnd(-r, r), rnd(-1, 1), rnd(1, 4), rnd(-1, 1), rnd(.8, 1.5), rnd(1.5, 3), .55, .5, .42, 4); } },
  { id: 'rain', cls: 'elem', type: 'buff', name: 'Mending Rain', cost: 30, heal: [25, 10],
    desc: 'Heals you and every creature within 15m of you.',
    label() { return `heals you ${HV(this, 0)} · creatures ${HV(this, 1)}`; },
    cast() { const h = H(); healAllies(15, HV(this, 1)); h.hp = Math.min(h.hpMax, h.hp + HV(this, 0));
      for (let q = 0; q < 220; q++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 14; magic.emit(h.x + Math.cos(a) * r, h.y + rnd(6, 10), h.z + Math.sin(a) * r, 0, -12, 0, rnd(.6, 1), .35, .4, .7, 1); } } },
  { id: 'stoneskin', cls: 'elem', type: 'buff', boosts: ['BS'], name: 'Stoneskin', cost: 24, dur: 12,
    desc: 'Your creatures near you take half damage for a while.',
    label() { return `creatures take -50% dmg · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BS], this.dur, ['stone'], [1, .78, .35]); } },
  { id: 'tailwind', cls: 'elem', type: 'buff', boosts: ['BF'], name: 'Tailwind', cost: 20, dur: 10,
    desc: 'You and your creatures near you move 60% faster for a while.',
    label() { return `+60% speed · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BF], this.dur, ['tail'], [.75, .6, 1]); } },
  // ---------- Druid ----------
  { id: 'wolves', cls: 'druid', type: 'summon', name: 'Call Wolves', n: 2, kind: 7, cost: 22, unit: ['Dire Wolf', 'Dire Wolves'],
    desc: 'Summons Dire Wolves. Fast and sturdy, and they stay until killed.' },
  { id: 'bear', cls: 'druid', type: 'summon', name: 'Cave Bear', n: 1, kind: 8, cost: 38, unit: ['Cave Bear', 'Cave Bears'],
    desc: 'Summons a Cave Bear. Very tough and strong, hits walls twice as hard, and stays until killed.' },
  { id: 'treant', cls: 'druid', type: 'summon', name: 'Treant', n: 1, kind: 9, cost: 55, unit: ['Treant', 'Treants'],
    desc: 'Summons a Treant. Your toughest beast. Slow, hits walls four times harder, and stays until killed.' },
  { id: 'hornets', cls: 'druid', type: 'summon', name: 'Hornet Swarm', n: 5, kind: 10, cost: 18, unit: ['Hornet', 'Hornets'],
    desc: 'Summons hornets. Very fast attackers that fade after 35 seconds.' },
  { id: 'thorns', cls: 'druid', type: 'attack', name: 'Thorn Burst', cost: 16, aim: true, range: 16, radius: 3.5, dmg: 6,
    desc: 'Thorns burst from the ground where you aim, hurting foes and slowing them.',
    label() { return `${D(this)} dmg · ${AR(this)}m · slows ${3}s`; },
    cast(a) { const r = this.radius * RAD(this.id); hurtAt(a.x, a.z, r, this.dmg * SD(this.id), 3); paintDisc(a.x, a.z, r, 5, .8); burst(a.x, hgt(a.x, a.z), a.z, 60 + r * 8, [.45, .8, .3], r * 1.6); } },
  { id: 'stampede', cls: 'druid', type: 'attack', line: true, name: 'Stampede', cost: 30, aim: true, range: 18, radius: 2.5, dmg: 7,
    desc: 'Spirit stags charge from you toward your aim, hurting and knocking back every foe in the path.',
    label() { return `${D(this)} dmg · ${AR(this) * 2}m wide line`; },
    cast(a) { lineHit(a, this.radius * RAD(this.id), this.dmg * SD(this.id), [1, .85, .5], 2.5); } },
  { id: 'wildgrowth', cls: 'druid', type: 'buff', name: 'Wild Growth', cost: 25, heal: [20, 12], radius: 10,
    desc: 'Heals you and your beasts nearby, and blooms the land around you. Bloom heals your side and slows foes who stand in it.',
    label() { return `heals you ${HV(this, 0)} · beasts ${HV(this, 1)} · ${AR(this)}m bloom`; },
    cast() { const h = H(), r = this.radius * RAD(this.id); healAllies(r + 6, HV(this, 1)); h.hp = Math.min(h.hpMax, h.hp + HV(this, 0)); paintDisc(h.x, h.z, r, 5, .95); burst(h.x, h.y, h.z, 100 + r * 4, [.5, .9, .35], r); } },
  { id: 'barkskin', cls: 'druid', type: 'buff', boosts: ['BS'], name: 'Barkskin', cost: 24, dur: 12,
    desc: 'Your beasts near you take half damage for a while.',
    label() { return `beasts take -50% dmg · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BS], this.dur, ['stone'], [.7, .5, .3]); } },
  { id: 'rage', cls: 'druid', type: 'buff', boosts: ['BD', 'BF'], name: 'Feral Rage', cost: 30, dur: 10,
    desc: 'Your beasts near you deal 60% more damage and move 60% faster for a while.',
    label() { return `+60% dmg & speed · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BD, Un.BF], this.dur, ['kindle', 'tail'], [1, .4, .2]); } },
  { id: 'shape', cls: 'druid', type: 'buff', name: 'Wild Shape', cost: 28, dur: 12,
    desc: 'You take bear form. Your claws deal double damage and you take half damage for a while.',
    label() { return `x2 claw dmg · -50% dmg taken · ${T(this)}s`; },
    cast() { const h = H(), d = this.dur * DUR(this.id); S.buffs.shape = d; if (M('mend:shape')) healAllies(16, M('mend:shape')); burst(h.x, h.y, h.z, 90, [.8, .55, .3], 6); UI.shake(.2); } },
  { id: 'pounce', cls: 'druid', type: 'attack', name: 'Pounce', cost: 18, aim: true, range: 14, radius: 3, dmg: 8,
    desc: 'You leap to where you aim and slam down, hurting and slowing foes where you land. Can\'t leap over standing city walls.',
    label() { return `leap ${this.range}m · ${D(this)} dmg · ${AR(this)}m`; },
    cast(a) { const h = H(); let x = clamp(a.x, -WH + 4, WH - 4), z = clamp(a.z, -WH + 4, WH - 4);
      for (const c of world.cities) { if (c.state !== 'hostile') continue; const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz) || 1, hd = Math.hypot(h.x - c.x, h.z - c.z); if (hd > c.R && d < c.R + 2) { x = c.x + dx / d * (c.R + 2); z = c.z + dz / d * (c.R + 2); } }
      for (let q = 0; q < 16; q++) { const t = q / 15; dust.emit(h.x + (x - h.x) * t, hgt(h.x, h.z) + Math.sin(t * Math.PI) * 4, h.z + (z - h.z) * t, 0, .5, 0, .5, 1.2, .6, .5, .4); }
      h.x = x; h.z = z; h.y = hgt(x, z); const r = this.radius * RAD(this.id);
      hurtAt(x, z, r, this.dmg * SD(this.id), 2); burst(x, h.y, z, 70, [.75, .6, .35], r * 1.8); UI.shake(.35); } },
  { id: 'storm', cls: 'druid', type: 'attack', name: 'Hurricane', cost: 30, aim: true, range: 18, radius: 6, dmg: 3, dur: 6,
    desc: 'Calls a storm where you aim. Every second it hurts and slows every foe inside it.',
    label() { return `${D(this)} dmg/sec · ${AR(this)}m · ${T(this)}s`; },
    cast(a) { S.zones.push({ x: a.x, z: a.z, r: this.radius * RAD(this.id), t: this.dur * DUR(this.id), dmg: this.dmg * SD(this.id), slow: 1.2, tick: 0, col: [.6, .8, .9], id: this.id }); } },
  // ---------- Necromancer ----------
  { id: 'raise', cls: 'necro', type: 'summon', name: 'Raise Skeletons', n: 3, kind: 11, cost: 14, unit: ['Skeleton', 'Skeletons'],
    desc: 'Raises skeletons from the ground beside you. Skeletons slowly rot away.' },
  { id: 'ghouls', cls: 'necro', type: 'summon', name: 'Ghouls', n: 2, kind: 12, cost: 18, unit: ['Ghoul', 'Ghouls'],
    desc: 'Summons Ghouls. Fast, hungry fighters that slowly rot away.' },
  { id: 'abom', cls: 'necro', type: 'summon', name: 'Abomination', n: 1, kind: 13, cost: 45, unit: ['Abomination', 'Abominations'],
    desc: 'Stitches together an Abomination. Huge and tough, hits walls three times harder, and stays until killed.' },
  { id: 'wraiths', cls: 'necro', type: 'summon', name: 'Wraiths', n: 3, kind: 14, cost: 24, unit: ['Wraith', 'Wraiths'],
    desc: 'Summons Wraiths. They fly through walls to attack defenders inside, and fade after 45 seconds.' },
  { id: 'bonespear', cls: 'necro', type: 'attack', line: true, name: 'Bone Spear', cost: 14, aim: true, range: 18, radius: 1.6, dmg: 6,
    desc: 'Fires a bone spear toward your aim. It pierces every foe in a line.',
    label() { return `${D(this)} dmg · piercing line`; },
    cast(a) { lineHit(a, this.radius * RAD(this.id), this.dmg * SD(this.id), [.95, .92, .8]); } },
  { id: 'corpse', cls: 'necro', type: 'attack', name: 'Corpse Explosion', cost: 26, aim: true, range: 16, radius: 4.5, dmg: 9, wall: 15,
    desc: 'Blows up the ground where you aim. Hurts every foe in the blast, damages city walls, and leaves blighted ground that keeps hurting foes.',
    label() { return `${D(this)} dmg · ${AR(this)}m · leaves blight`; },
    cast(a) { const r = this.radius * RAD(this.id); hurtAt(a.x, a.z, r, this.dmg * SD(this.id)); wallsAt(a.x, a.z, r, this.wall * S.st.dmgMul); paintDisc(a.x, a.z, r + 1, 6, 1); burst(a.x, hgt(a.x, a.z), a.z, 90, [.6, 1, .3], r * 2); UI.shake(.3); } },
  { id: 'pulse', cls: 'necro', type: 'attack', name: 'Death Pulse', cost: 26, dmg: 4, radius: 11, heal: [2, 30],
    desc: 'A wave of death rolls out from you. It hurts every foe nearby and heals you for each foe it hits.',
    label() { return `${D(this)} dmg · ${AR(this)}m · heals ${HV(this, 0)} per foe`; },
    cast() { const h = H(), r = this.radius * RAD(this.id), hit = hurtAt(h.x, h.z, r, this.dmg * SD(this.id)); h.hp = Math.min(h.hpMax, h.hp + Math.min(HV(this, 1), hit.length * HV(this, 0)));
      paintDisc(h.x, h.z, r, 6, .6); burst(h.x, h.y, h.z, 160, [.55, 1, .35], r * 1.4); for (const j of hit.slice(0, 16)) lightning(Un.X[j], hgt(Un.X[j], Un.Z[j]) + 1, Un.Z[j], h.x, h.y + 1.5, h.z); } },
  { id: 'frenzy', cls: 'necro', type: 'buff', boosts: ['BD', 'BF'], name: 'Unholy Frenzy', cost: 25, dur: 10,
    desc: 'Your undead near you deal 60% more damage and move 60% faster for a while.',
    label() { return `+60% dmg & speed · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BD, Un.BF], this.dur, ['kindle', 'tail'], [.55, 1, .35]); } },
  { id: 'bonearmor', cls: 'necro', type: 'buff', boosts: ['BS'], name: 'Bone Armor', cost: 24, dur: 12,
    desc: 'Your undead near you take half damage for a while.',
    label() { return `undead take -50% dmg · ${T(this)}s`; },
    cast() { buff(this.id, [Un.BS], this.dur, ['stone'], [.95, .92, .8]); } },
  { id: 'curse', cls: 'necro', type: 'attack', name: 'Curse of Weakness', cost: 20, aim: true, range: 16, radius: 6, dur: 10,
    desc: 'Curses foes where you aim. Cursed foes deal half damage and take 25% more damage for a while.',
    label() { return `${AR(this)}m · foes -50% dmg, +25% dmg taken · ${T(this)}s`; },
    cast(a) { const r = this.radius * RAD(this.id), t = this.dur * DUR(this.id); for (const j of Un.unitsNear(a.x, a.z, r, 1)) Un.CURSE[j] = t; burst(a.x, hgt(a.x, a.z), a.z, 90, [.6, .3, .9], r * 1.4); } },
  { id: 'mark', cls: 'necro', type: 'attack', name: 'Death Mark', cost: 22, aim: true, range: 18, radius: 4, dur: 12,
    desc: 'Marks the toughest foe near your aim. It takes double damage for a while. If it dies while marked, it rises as an Abomination on your side. Lords and chiefs only take the extra damage.',
    label() { return `1 foe takes x2 dmg · ${T(this)}s · rises as Abomination`; },
    cast(a) { let best = -1, bh = 0; for (const j of Un.unitsNear(a.x, a.z, this.radius * RAD(this.id), 1)) if (Un.HP[j] > bh) { bh = Un.HP[j]; best = j; }
      if (best < 0) return 'No foe there to mark.'; Un.MARK[best] = this.dur * DUR(this.id); burst(Un.X[best], hgt(Un.X[best], Un.Z[best]), Un.Z[best], 50, [.7, 1, .6], 3); } },
  { id: 'sacrifice', cls: 'necro', type: 'buff', name: 'Sacrifice', cost: 6, n: 5, dmg: 5,
    desc: 'Up to 5 of your undead near you explode. Each one hurts foes around it and gives you 10 health and 8 mana.',
    label() { return `up to ${this.n + M('n:sacrifice')} undead · ${D(this)} dmg each · +10 hp, +8 mana each`; },
    cast() { const h = H(), mine = Un.unitsNear(h.x, h.z, 12, 0).filter(j => Un.KIND[j] >= 11 && Un.KIND[j] <= 14).sort((p, q) => Un.HPM[p] - Un.HPM[q]).slice(0, this.n + M('n:sacrifice'));
      if (!mine.length) return 'No undead near you to sacrifice.';
      for (const j of mine) { hurtAt(Un.X[j], Un.Z[j], 2.8, this.dmg * SD(this.id)); burst(Un.X[j], hgt(Un.X[j], Un.Z[j]), Un.Z[j], 30, [.6, 1, .35], 3.5); Un.HP[j] = 0; Un.LIFE[j] = -1; }
      h.hp = Math.min(h.hpMax, h.hp + 10 * mine.length); h.mana = Math.min(h.manaMax, h.mana + 8 * mine.length); } },
  // ---------- Milestone 3.4: new spells ----------
  { id: 'magma', cls: 'elem', type: 'summon', name: 'Magma Brutes', n: 2, kind: 21, cost: 28, unit: ['Magma Brute', 'Magma Brutes'],
    desc: 'Summons Magma Brutes. Tough, slow-burning fighters that explode when they die, scorching everything nearby. They cool after 60 seconds.' },
  { id: 'icelance', cls: 'elem', type: 'attack', line: true, name: 'Ice Lance', cost: 16, aim: true, range: 20, radius: 1.4, dmg: 9,
    desc: 'Fires a lance of ice toward your aim. It pierces every foe in a line and slows them.',
    label() { return `${D(this)} dmg · piercing line · slows`; },
    cast(a) { const hit = lineHit(a, this.radius * RAD(this.id), this.dmg * SD(this.id), [.7, .9, 1]); for (const j of hit || []) Un.SLOW[j] = Math.max(Un.SLOW[j], 2.5); } },
  { id: 'blink', cls: 'elem', type: 'buff', util: true, name: 'Blink', cost: 15, aim: true, range: 16, radius: 4, dmg: 3,
    desc: 'You vanish and reappear where you aim, up to 16m away. Frost bursts where you land, slowing foes. Can\'t pass standing city walls.',
    label() { return `teleport ${this.range}m · ${D(this)} dmg frost burst`; },
    cast(a) { const h = H(), at = safeLanding(a); burst(h.x, h.y, h.z, 50, [.6, .8, 1], 3); h.x = at.x; h.z = at.z; h.y = hgt(at.x, at.z);
      hurtAt(h.x, h.z, this.radius * RAD(this.id), this.dmg * SD(this.id), 2.5); burst(h.x, h.y, h.z, 70, [.6, .85, 1], 5); } },
  { id: 'meteor', cls: 'elem', type: 'attack', ult: true, name: 'Meteor Storm', cost: 90, aim: true, range: 20, radius: 10, dmg: 12, n: 10,
    desc: 'Ultimate. Calls ten meteors down around your aim over a few seconds. Each one explodes, hurting every foe in its blast and smashing walls.',
    label() { return `10 meteors · ${D(this)} dmg each · ${AR(this)}m`; },
    cast(a) { const r = this.radius * RAD(this.id); for (let q = 0; q < this.n; q++) { const an = Math.random() * TAU, d = Math.sqrt(Math.random()) * r; S.meteors.push({ x: a.x + Math.cos(an) * d, z: a.z + Math.sin(an) * d, t: q * .35 + Math.random() * .2, dmg: this.dmg * SD(this.id), id: this.id }); } UI.shake(.3); } },
  { id: 'spiders', cls: 'druid', type: 'summon', name: 'Giant Spiders', n: 3, kind: 22, cost: 20, unit: ['Giant Spider', 'Giant Spiders'],
    desc: 'Summons Giant Spiders. Fast hunters whose bites web foes, slowing them. They stay until killed.' },
  { id: 'thunder', cls: 'druid', type: 'attack', name: 'Thunder Call', cost: 26, aim: true, range: 20, radius: 12, dmg: 10, jumps: 5,
    desc: 'Lightning falls from the sky on several foes around your aim, one bolt each.',
    label() { return `${D(this)} dmg · ${this.jumps + M('n:thunder')} bolts · ${AR(this)}m`; },
    cast(a) { const foes = Un.unitsNear(a.x, a.z, this.radius * RAD(this.id), 1).sort(() => Math.random() - .5).slice(0, this.jumps + M('n:thunder'));
      if (!foes.length) return 'No foes there.';
      for (const j of foes) { const y = hgt(Un.X[j], Un.Z[j]); lightning(Un.X[j] + rnd(-1, 1), y + 22, Un.Z[j] + rnd(-1, 1), Un.X[j], y + .5, Un.Z[j]); Un.hitUnit(j, this.dmg * SD(this.id)); hitFx(j); burst(Un.X[j], y, Un.Z[j], 14, [.8, .85, 1], 2); }
      UI.shake(.2); } },
  { id: 'regroup', cls: 'druid', type: 'buff', util: true, boosts: ['BF'], name: 'Call of the Pack', cost: 22, heal: [0, 30], dur: 6,
    desc: 'All your beasts, wherever they are, rush back to your side, heal, and move faster for a while.',
    label() { return `all beasts return · heal ${HV(this, 1)} · faster ${T(this)}s`; },
    cast() { const h = H(); for (let i = 0; i < Un.U.N; i++) { if (Un.TEAM[i]) continue; const an = Math.random() * TAU, d = 2 + Math.random() * 5;
      burst(Un.X[i], hgt(Un.X[i], Un.Z[i]), Un.Z[i], 6, [.8, .7, .4], 1.5); Un.X[i] = h.x + Math.cos(an) * d; Un.Z[i] = h.z + Math.sin(an) * d; Un.HP[i] = Math.min(Un.HPM[i], Un.HP[i] + HV(this, 1)); Un.BF[i] = this.dur * DUR(this.id); }
      S.buffs.tail = Math.max(S.buffs.tail, this.dur * DUR(this.id)); burst(h.x, h.y, h.z, 90, [.8, .7, .4], 8); } },
  { id: 'wrath', cls: 'druid', type: 'attack', ult: true, name: 'Wrath of the Forest', cost: 90, aim: true, range: 18, radius: 11, dmg: 14,
    desc: 'Ultimate. The forest erupts where you aim: a huge field of thorns that hurts every foe, roots them in place for 5 seconds, and blooms the land.',
    label() { return `${D(this)} dmg · ${AR(this)}m · roots 5s`; },
    cast(a) { const r = this.radius * RAD(this.id); hurtAt(a.x, a.z, r, this.dmg * SD(this.id), 5); paintDisc(a.x, a.z, r + 2, 5, 1); UI.shake(.7);
      for (let q = 0; q < 220; q++) { const an = Math.random() * TAU, d = Math.sqrt(Math.random()) * r; dust.emit(a.x + Math.cos(an) * d, hgt(a.x, a.z), a.z + Math.sin(an) * d, 0, rnd(4, 10), 0, rnd(.6, 1.2), rnd(.8, 1.6), .35, .7, .25); }
      burst(a.x, hgt(a.x, a.z), a.z, 200, [.45, .9, .3], r * 1.8); } },
  { id: 'mages', cls: 'necro', type: 'summon', name: 'Skeleton Mages', n: 2, kind: 23, cost: 22, unit: ['Skeleton Mage', 'Skeleton Mages'],
    desc: 'Raises Skeleton Mages. They hang back and hurl soul bolts at foes from range. They slowly rot away.' },
  { id: 'bonestorm', cls: 'necro', type: 'attack', name: 'Bone Storm', cost: 28, radius: 4.5, dmg: 3, dur: 6,
    desc: 'A storm of whirling bones surrounds you and moves with you, hitting every foe close to you each second.',
    label() { return `${D(this)} dmg/sec · ${AR(this)}m around you · ${T(this)}s`; },
    cast() { S.zones.push({ follow: true, x: S.hero.x, z: S.hero.z, r: this.radius * RAD(this.id), t: this.dur * DUR(this.id), dmg: this.dmg * SD(this.id), slow: 0, tick: 0, col: [.95, .92, .8], id: this.id }); } },
  { id: 'dread', cls: 'necro', type: 'buff', util: true, name: 'Dread', cost: 20, radius: 10, dur: 4,
    desc: 'A wave of terror rolls out from you. Every foe nearby flees in fear and can\'t attack for a while. Lords and chiefs only flinch.',
    label() { return `foes in ${AR(this)}m flee for ${T(this)}s`; },
    cast() { const h = H(), t = this.dur * DUR(this.id); for (const j of Un.unitsNear(h.x, h.z, this.radius * RAD(this.id), 1)) Un.FEAR[j] = Un.ROLE[j] === 3 || Un.ROLE[j] === 4 ? .6 : t;
      for (let q = 0; q < 120; q++) { const an = q / 120 * TAU; magic.emit(h.x, h.y + 1, h.z, Math.cos(an) * 14, .5, Math.sin(an) * 14, .7, 1.2, .55, .2, .7); } UI.shake(.25); } },
  { id: 'army', cls: 'necro', type: 'summon', ult: true, name: 'Army of the Dead', n: 14, kind: 11, cost: 95, unit: ['Skeleton', 'Skeletons'],
    desc: 'Ultimate. The ground splits and a whole army of skeletons claws its way up around you.' },
];
// spells that were folded into others as ranks
export const FOLDED = { massraise: ['raise', 2], overgrowth: ['wildgrowth', 1], rejuv: ['wildgrowth', 1], roots: ['thorns', 1], plague: ['corpse', 1], siphon: ['pulse', 1] };
export const MAX_RANK = UP.MAX_LEVEL;
export const rankOf = id => UP.levelOf(id);
export function spellLabel(s) {
  const leg = UP.legendNames(s.id).join(' · '), tail = leg ? ` · ${leg}` : '';
  if (s.kind !== undefined) { const n = s.n + M('n:' + s.id) + M('n:all'); return `+${n} ${n > 1 ? s.unit[1] : s.unit[0]}${M('champ:' + s.id) ? ' +1 champion' : ''}${tail}`; }
  return s.label() + tail;
}
export const aimRadius = s => (s.radius || 1.5) * RAD(s.id);
// ---------- spell upgrades ----------
export function upgradeOffer(id) {
  const s = SPELLS.find(s => s.id === id); if (!s || rankOf(id) >= MAX_RANK) return [];
  if (!S.spellOffers[id] || !S.spellOffers[id].length) S.spellOffers[id] = UP.makeOffer(s, Un.K);
  return S.spellOffers[id];
}
export function takeUpgrade(id, k) {
  const offer = S.spellOffers[id]; if (!S.spellPts || !offer || !offer[k] || rankOf(id) >= MAX_RANK) return null;
  const c = offer[k]; (S.spellUps[id] = S.spellUps[id] || []).push(c); delete S.spellOffers[id]; S.spellPts--;
  recompute(); saveRun(); return c;
}
// ---------- the spell bar ----------
const ORDER = { summon: 0, buff: 1, attack: 2 };
export const typeLabel = s => s.ult ? 'Ultimate' : s.util ? 'Utility' : TYPE_NAME[s.type];
export function sortBar() {
  const on = S.loadout.filter(Boolean).sort((a, b) => { const p = SPELLS.find(s => s.id === a), q = SPELLS.find(s => s.id === b); return ORDER[p.type] - ORDER[q.type] || SPELLS.indexOf(p) - SPELLS.indexOf(q); });
  S.loadout = [...on, ...Array(12).fill(null)].slice(0, 12);
}
export function toggleEquip(id, slot) {
  const at = S.loadout.indexOf(id);
  if (at >= 0) { S.loadout[at] = null; return 'removed'; }
  const k = S.loadout[slot] == null ? slot : S.loadout.indexOf(null) >= 0 ? S.loadout.indexOf(null) : slot;
  S.loadout[k] = id; return 'added';
}
// ---------- spells you unlock for good by beating bosses ----------
export const lockedSpells = () => SPELLS.filter(s => s.cls === S.cls && !S.known.includes(s.id));
function unlockedFor(cls) { const u = (S.meta.unlocked = S.meta.unlocked || {}); return (u[cls] = u[cls] || []); }
export function unlockSpell(id) {
  const s = SPELLS.find(s => s.id === id); if (!s || S.known.includes(id)) return;
  const u = unlockedFor(s.cls); if (!u.includes(id)) u.push(id); saveMeta();
  S.known.push(id); const k = S.loadout.indexOf(null); if (k >= 0) S.loadout[k] = id;
  UI.loreCard(`Spell unlocked: ${s.name}`, s.desc, `Yours for good: every future ${CLASSES[S.cls].name} run starts knowing it.`);
}
function randomTome() { const pool = lockedSpells().filter(s => !S.loot.some(l => l.tome === s.id)); return pool.length ? pool[(Math.random() * pool.length) | 0].id : null; }
export const TYPE_NAME = { summon: 'Summon', attack: 'Attack', buff: 'Buff' };
export const spellCost = s => Math.max(s.cost * .3, s.cost * S.st.costMul * (1 - M('cost:' + s.id) - M('cost:' + s.type) - M('cost:all')));
// returns null on success, or the reason it failed
function afterCast(s, a, echo = false) {
  const h = S.hero, at = s.aim ? { x: a.x, z: a.z } : { x: h.x, z: h.z }, id = s.id;
  const lg = M('linger:' + id), R = (s.radius || 2) * RAD(id);
  if (lg && s.radius) S.zones.push({ x: at.x, z: at.z, r: R, t: 4 + M('lingerT:' + id), dmg: s.dmg * SD(id) * lg, slow: 0, tick: .5, col: [1, .5, .15], id });
  if (M('big:' + id)) { UI.shake(.7); burst(at.x, hgt(at.x, at.z), at.z, 160, [1, .85, .5], R * 2.2); for (let q = 0; q < 40; q++) dust.emit(at.x + rnd(-R, R), hgt(at.x, at.z) + rnd(0, 1), at.z + rnd(-R, R), rnd(-2, 2), rnd(2, 6), rnd(-2, 2), rnd(.8, 1.6), rnd(2, 4), .5, .45, .4); }
  if (M('sanct:' + id)) buffAllies(16 * RAD(id), [Un.BS], 8);
  if (echo) return;
  const nb = M('barrage:' + id);
  if (nb) { TMP = .7; CUR = id; for (let q = 0; q < nb; q++) { const an = q / nb * TAU + Math.random(), d = R * 1.5 + 2; s.cast({ x: at.x + Math.cos(an) * d, z: at.z + Math.sin(an) * d }); } CUR = null; TMP = 1; }
  if (M('fan:' + id)) { const dx = a.x - h.x, dz = a.z - h.z; CUR = id; for (const an of [-.3, .3]) { const c = Math.cos(an), sn = Math.sin(an); s.cast({ x: h.x + dx * c - dz * sn, z: h.z + dx * sn + dz * c }); } CUR = null; }
  for (let q = 0; q < M('echo:' + id) + (s.type === 'attack' && !s.ult ? M('echo:all') : 0); q++) S.echoQ.push({ id, a: { x: a.x + rnd(-1, 1), z: a.z + rnd(-1, 1) }, t: .45 * (q + 1) });
}
function vortex(s, a) {
  const h = S.hero, at = s.aim ? a : h, R = (s.radius || 3) * RAD(s.id);
  for (const j of Un.unitsNear(at.x, at.z, R * 2, 1)) { if (Un.ROLE[j] === 3) continue; Un.X[j] += (at.x - Un.X[j]) * .75; Un.Z[j] += (at.z - Un.Z[j]) * .75; }
  for (let q = 0; q < 60; q++) { const an = Math.random() * TAU, d = R * 2 * Math.random(); magic.emit(at.x + Math.cos(an) * d, hgt(at.x, at.z) + 1, at.z + Math.sin(an) * d, -Math.cos(an) * d * 2, 1, -Math.sin(an) * d * 2, .5, .8, .6, .5, 1); }
}
function safeLanding(a) {
  const h = S.hero; let x = clamp(a.x, -WH + 4, WH - 4), z = clamp(a.z, -WH + 4, WH - 4);
  for (const c of world.cities) { if (c.state !== 'hostile') continue; const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz) || 1, hd = Math.hypot(h.x - c.x, h.z - c.z); if (hd > c.R && d < c.R + 2) { x = c.x + dx / d * (c.R + 2); z = c.z + dz / d * (c.R + 2); } }
  return { x, z };
}
export function castSpell(id, at) {
  if (S.over || !S.running) return 'Not now.';
  const s = SPELLS.find(s => s.id === id), h = S.hero; if (!s) return 'Unknown spell.';
  if (S.castLock > 0) return null;
  const free = M('flag:eye') && (S.eyeCount || 0) % 4 === 3, cost = free ? 0 : spellCost(s);
  if (h.mana < cost) return `Not enough mana for ${s.name} (needs ${Math.ceil(cost)}).`;
  let a = at || S.aim;
  if (s.aim) { const dx = a.x - h.x, dz = a.z - h.z, d = Math.hypot(dx, dz) || 1; if (d > s.range) a = { x: h.x + dx / d * s.range, z: h.z + dz / d * s.range }; if (at) h.yaw = Math.atan2(a.x - h.x, a.z - h.z); }
  if (s.kind !== undefined) {
    const room = Math.floor(S.st.cap - S.pcTotal), n = Math.min(s.n + M('n:' + s.id) + M('n:all'), room);
    if (n <= 0) return 'Horde cap reached. Take cities or level up to raise it.';
    summon(s.kind, n);
    if (M('champ:' + s.id) && room > n) { const i = Un.spawn(0, s.kind, h.x + rnd(-2, 2), h.z + rnd(-2, 2), { hpMul: 1 + (h.level - 1) * .06, elite: true }); if (i >= 0) burst(Un.X[i], h.y, Un.Z[i], 30, [1, .8, .3], 3); }
  } else {
    if (M('vortex:' + s.id)) vortex(s, a);
    CUR = s.id; const why = s.cast(a); CUR = null; if (why) return why;
    afterCast(s, a);
  }
  h.mana -= cost; S.castLock = .15; S.lastSpell = id; S.eyeCount = (S.eyeCount || 0) + 1;
  return null;
}
export function fireballImpact(x, z, r) {
  paintDisc(x, z, r, 1, .7);
  for (const c of world.cities) if (c.state === 'hostile' && Math.abs(Math.hypot(x - c.x, z - c.z) - c.R) < r + 1) hitWall(c, 18 * S.st.dmgMul * (1 + M('siege:all')), x, z);
  burst(x, hgt(x, z), z, 40, [1, .5, .12], 7);
}

// ---------- orders ----------
export function setOrder(el, mode, x = 0, z = 0) {
  const els = el === 'all' ? [0, 1, 2, 3] : [el];
  for (const e of els) S.orders[e] = { mode, x, z };
  if (mode === 'hold') for (let i = 0; i < Un.U.N; i++) if (!Un.TEAM[i] && els.includes(Un.K[Un.KIND[i]].el)) { Un.AX[i] = Un.X[i]; Un.AZ[i] = Un.Z[i]; }
}

// ---------- cities ----------
// A city grows in levels. Each level raises everything it gives you; the buildings appear on their own.
export const BTYPES = {
  spire: { name: 'Ember Spire', desc: 'hurls fire at raiders' }, circle: { name: 'Summoning Circle', desc: '+15 horde cap per level' },
  font: { name: 'Mana Font', desc: '+15 max mana and +1 mana per second per level' }, trade: { name: 'Trade Post', desc: '+5 gold and +1 essence per level every 10s' }};
const PLOT_ORDER = ['spire', 'circle', 'font', 'trade'];
export const CITY_MAX = 5, CITY_COST = [null, null, [150, 20], [300, 50], [500, 90], [800, 150]];   // gold, essence to reach each level
export const CITY_LEVEL_TEXT = [null, null, 'An Ember Spire and a Summoning Circle', 'A Mana Font and a Trade Post', 'Every building grows to level 2, and the heart gets stronger', 'Every building grows to level 3, and the heart gets stronger still'];
export function applyCityLevel(c) {
  const L = c.lvl || 1;
  PLOT_ORDER.forEach((type, k) => { const lvl = L >= 5 ? 3 : L >= 4 ? 2 : (k < 2 ? L >= 2 : L >= 3) ? 1 : 0; c.buildings[k] = { type: lvl ? type : null, lvl }; });
  c.heartMax = 150 + (L - 1) * 90;
}
export function upgradeCity(c) {
  const L = c.lvl || 1; if (c.state !== 'owned' || L >= CITY_MAX) return false;
  const [g, e] = CITY_COST[L + 1];
  if (S.res.gold < g || S.res.essence < e) { UI.toast('Not enough gold or essence.'); return false; }
  S.res.gold -= g; S.res.essence -= e; c.lvl = L + 1; applyCityLevel(c); c.heartHP = c.heartMax; setCityLook(c); recompute();
  burst(c.x, c.base + 4, c.z, 160, [1, .7, .3], c.R); saveRun(); return true;
}
export const CRAFT_COST = [80, 15];   // gold, essence
export function craft(c) {
  if (c.state !== 'owned') return null;
  const [g, e] = CRAFT_COST;
  if (S.res.gold < g || S.res.essence < e) { UI.toast('Not enough gold or essence.'); return null; }
  S.res.gold -= g; S.res.essence -= e;
  const it = PR.makeItem(c.tier + (c.lvl || 1) - 1, (c.lvl || 1) >= 3 ? 1 : 0, Math.random, S.cls);
  addItem(it); saveRun(); return it;
}
export const POTION_COST = 40;
export function buyPotion(type) {
  if (S.res.gold < POTION_COST) { UI.toast('Not enough gold.'); return false; }
  if ((S.potions[type] || 0) >= 9) { UI.toast('You can carry 9 of each potion.'); return false; }
  S.res.gold -= POTION_COST; S.potions[type] = (S.potions[type] || 0) + 1; return true;
}
// ---------- gear and loot ----------
export function addItem(it) {
  if (S.inv.length >= 24) { sellItem(it); UI.toast(`Your pack is full. ${it.name} was sold for ${PR.sellPrice(it)} gold.`); return; }
  S.inv.push(it);
}
function sellItem(it) { S.res.gold += PR.sellPrice(it); }
export function sell(uid) { const k = S.inv.findIndex(i => i.uid === uid); if (k < 0) return; sellItem(S.inv[k]); S.inv.splice(k, 1); }
const slotsFor = it => it.slot === 'ring' ? ['ring', 'ring2'] : [it.slot];
export function equip(uid) {
  const k = S.inv.findIndex(i => i.uid === uid); if (k < 0) return;
  const it = S.inv[k], opts = slotsFor(it), sl = opts.find(o => !S.equip[o]) || opts.reduce((a, b) => PR.itemScore(S.equip[a]) <= PR.itemScore(S.equip[b]) ? a : b);
  const old = S.equip[sl]; S.inv.splice(k, 1); if (old) S.inv.push(old);
  S.equip[sl] = it; recompute();
}
export function unequip(slot) { const it = S.equip[slot]; if (!it || S.inv.length >= 24) return; S.inv.push(it); delete S.equip[slot]; recompute(); }
// put on the best thing you own in every slot
export function autoEquip() {
  const all = [...S.inv, ...PR.SLOTS.map(sl => S.equip[sl]).filter(Boolean)], used = new Set(), eq = {};
  for (const sl of PR.SLOTS) {
    const base = sl === 'ring2' ? 'ring' : sl, best = all.filter(it => it.slot === base && !used.has(it.uid)).sort((a, b) => PR.itemScore(b) - PR.itemScore(a))[0];
    if (best) { eq[sl] = best; used.add(best.uid); }
  }
  const changed = PR.SLOTS.filter(sl => (eq[sl] && eq[sl].uid) !== (S.equip[sl] && S.equip[sl].uid)).length;
  S.equip = eq; S.inv = all.filter(it => !used.has(it.uid)); recompute(); return changed;
}
// sell everything in the pack that's no better than what you're wearing (legendaries and set pieces are kept)
export function sellOld() {
  let n = 0, g = 0;
  S.inv = S.inv.filter(it => {
    if (it.unique || it.set) return true;
    const worn = slotsFor(it).map(sl => S.equip[sl]); if (worn.some(w => !w)) return true;
    if (PR.itemScore(it) > Math.min(...worn.map(PR.itemScore))) return true;
    n++; g += PR.sellPrice(it); return false;
  });
  S.res.gold += g; return [n, g];
}
export function usePotion(type) {
  const h = S.hero; if (!S.potions[type] || S.over) return false;
  S.potions[type]--;
  if (type === 'hp') { h.hp = Math.min(h.hpMax, h.hp + h.hpMax * .5); burst(h.x, h.y, h.z, 40, [1, .3, .3], 3); }
  else if (type === 'mp') { h.mana = h.manaMax; burst(h.x, h.y, h.z, 40, [.4, .6, 1], 3); }
  else { buffAllies(30, [Un.BD, Un.BF], 15); S.buffs.kindle = Math.max(S.buffs.kindle, 15); S.buffs.tail = Math.max(S.buffs.tail, 15); burst(h.x, h.y, h.z, 80, [1, .5, .15], 8); }
  return true;
}
const POTIONS = ['hp', 'mp', 'fury'];
const randomPotion = () => POTIONS[Math.random() < .45 ? 0 : Math.random() < .7 ? 1 : 2];
function dropLoot(x, z, thing) { S.loot.push({ x, z, ...thing, t: 0 }); }
function randomRelic() { const pool = PR.RELICS.filter(r => !S.relics.includes(r.id) && !S.loot.some(l => l.relic === r.id)); return pool.length ? pool[(Math.random() * pool.length) | 0].id : null; }
// lingering storms and the like
export function updateZones(dt) {
  if (!S.zones) return;
  for (const id of S.known) { // Ever-burning buffs recast themselves when they run out
    if (!M('auto:' + id)) continue; const s = SPELLS.find(s => s.id === id); if (!s) continue;
    S.autoT[id] = (S.autoT[id] ?? 2) - dt;
    if (S.autoT[id] <= 0) { S.autoT[id] = s.dur ? s.dur * DUR(id) : 12; CUR = id; s.cast(S.aim); CUR = null; afterCast(s, S.aim, true); }
  }
  for (let k = (S.echoQ || []).length - 1; k >= 0; k--) {
    const e = S.echoQ[k]; e.t -= dt; if (e.t > 0) continue; S.echoQ.splice(k, 1);
    const s = SPELLS.find(s => s.id === e.id); if (M('vortex:' + s.id)) vortex(s, e.a); CUR = s.id; s.cast(e.a); CUR = null; afterCast(s, e.a, true);
  }
  for (let k = (S.meteors || []).length - 1; k >= 0; k--) {
    const m = S.meteors[k]; m.t -= dt; if (m.t > 0) continue; S.meteors.splice(k, 1);
    const y = hgt(m.x, m.z); Un.fire(m.x + 8, y + 34, m.z - 6, m.x, y + .3, m.z, .9, 0, m.dmg, 1, 4 * RAD(m.id));
  }
  for (let k = S.zones.length - 1; k >= 0; k--) {
    const z = S.zones[k]; z.t -= dt; z.tick -= dt; if (z.follow) { z.x = S.hero.x; z.z = S.hero.z; }
    for (let q = 0; q < 6; q++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * z.r; magic.emit(z.x + Math.cos(a) * r, hgt(z.x, z.z) + rnd(.5, 5), z.z + Math.sin(a) * r, -Math.sin(a) * 8, rnd(-1, 2), Math.cos(a) * 8, rnd(.4, .8), rnd(.6, 1.2), ...z.col); }
    if (z.tick <= 0) { z.tick = 1; CUR = z.id || null; hurtAt(z.x, z.z, z.r, z.dmg, z.slow); CUR = null; }
    if (z.t <= 0) S.zones.splice(k, 1);
  }
}
export function updateLoot(dt) {
  const h = S.hero;
  for (let i = S.loot.length - 1; i >= 0; i--) {
    const l = S.loot[i]; l.t += dt;
    if (Math.random() < .25) magic.emit(l.x + rnd(-.2, .2), hgt(l.x, l.z) + .3, l.z + rnd(-.2, .2), 0, rnd(2, 4), 0, rnd(.6, 1), .5, ...(l.tome ? [.8, .5, 1] : l.relic || (l.item && l.item.unique) ? [1, .6, .2] : l.potion ? [1, .35, .4] : [.5, .75, 1]));
    if ((l.x - h.x) ** 2 + (l.z - h.z) ** 2 < 2.8 * 2.8) {
      if (l.tome) unlockSpell(l.tome);
      else if (l.relic) { S.relics.push(l.relic); const r = PR.RELICS.find(r => r.id === l.relic); UI.loreCard(`Relic: ${r.name}`, r.lore, r.desc); recompute(); }
      else if (l.potion) { if ((S.potions[l.potion] || 0) < 9) S.potions[l.potion] = (S.potions[l.potion] || 0) + 1; else S.res.gold += 20; }
      else { addItem(l.item); if (l.item.unique) UI.loreCard(`Legendary: ${l.item.name}`, l.item.lore, l.item.power); else UI.toast(`Found ${l.item.name} (${PR.RARITY[l.item.r].name} ${PR.SLOT_NAME[l.item.slot]}).`, 'good'); S.newGear = true; }
      S.loot.splice(i, 1);
    }
  }
}
// who turns up, by faction and how dangerous the world has become
export function pickEnemy(faction, threat, r = Math.random()) {
  if (faction === 'human') {
    if (threat > 3 && r < .12) return 16; if (threat > 2 && r < .24) return 18; if (threat > 1.5 && r < .34) return 17; if (r < .52) return 15; return r < .76 ? 5 : 6;
  }
  if (threat > 3 && r < .08) return 20; if (threat > 1.5 && r < .2) return 19; return r < .35 ? 5 : 4;
}
const eliteRoll = () => Math.random() < Math.min(.25, .02 + S.threat * .025);
function spawnGarrison(c) {
  c.garrison = true;
  const n = 8 + c.tier * 10, hpMul = 1 + .15 * (c.tier - 1) + (S.threat - .5) * .08;
  for (let q = 0; q < n; q++) {
    const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * (c.R - 2.2), x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, roll = Math.random();
    Un.spawn(1, pickEnemy(c.faction, c.tier + 1, roll), x, z, { role: 1, city: c.i, hpMul, ax: x, az: z, elite: eliteRoll() });
  }
}
export function hitWall(c, dmg, x, z) {
  if (c.state !== 'hostile') return;
  let part = 'wall';
  if (x !== undefined) {
    const a = Math.atan2(z - c.z, x - c.x); let da = Math.abs(a - c.gateAng); da = Math.min(da, TAU - da);
    if (c.gateHP > 0 && da < .32) part = 'gate';
    else { const t = c.towerPos.findIndex(([tx, tz], q) => c.towerHP[q] > 0 && (c.x + tx - x) ** 2 + (c.z + tz - z) ** 2 < 4.5 * 4.5); if (t >= 0) part = t; }
  }
  if (part === 'gate') { c.gateHP -= dmg; if (c.gateHP <= 0) { c.gateHP = 0; UI.toast(`The gate of ${c.name} is smashed.`, 'good'); } }
  else if (part !== 'wall') { c.towerHP[part] -= dmg; if (c.towerHP[part] <= 0) { c.towerHP[part] = 0; UI.toast(`A tower of ${c.name} comes down.`, 'good'); } }
  else c.wallHP -= dmg;
  c.wallDirty = true;
  if (!c.sally && (c.wallHP < c.wallMax * .5 || c.gateHP < c.gateMax * .5)) { c.sally = true; UI.toast(`The garrison of ${c.name} sallies out to meet you.`, 'bad'); }
  if (Math.random() < .2) { const a = Math.random() * TAU; dust.emit(c.x + Math.cos(a) * c.R, c.base + rnd(.5, 2.5), c.z + Math.sin(a) * c.R, 0, 1, 0, .8, 2, .6, .56, .5); }
}
export function hitHeart(c, dmg) {
  if (c.state !== 'owned') return;
  c.heartHP -= dmg;
  if (c.heartHP <= 0) loseCity(c);
}
function capture(c) {
  c.state = 'owned'; c.heartHP = c.heartMax; c.raid = false; S.citiesTaken++;
  for (let i = 0; i < Un.U.N; i++) if (Un.TEAM[i] && Un.CITY[i] === c.i) Un.HP[i] = 0;
  const r = c.tier; S.res.gold += Math.round(100 * r * S.st.goldMul); S.res.essence += 30 * r; gainXP(30 * r);
  c.lvl = 1; applyCityLevel(c);
  setCityLook(c); paintDisc(c.x, c.z, c.R + 6, CLASSES[S.cls].land, 1); recompute();
  burst(c.x, c.base + 4, c.z, 300, [1, .55, .15], 18, 1.5);
  UI.loreCard(`${c.name} is yours`, c.capLine, `City perk: ${c.perk.text}`);
  if (owned().length === 1) S.raidT = 100;
  saveRun();
}
function loseCity(c) {
  c.state = 'breached'; c.lordAlive = true; c.lordSpawned = false; c.raid = false;
  c.lvl = 1; applyCityLevel(c);
  for (let i = 0; i < Un.U.N; i++) if (Un.TEAM[i] && Un.ROLE[i] === 2 && Un.CITY[i] === c.i) Un.ROLE[i] = 1;
  setCityLook(c); recompute();
  UI.toast(`${c.name} has fallen to raiders. A new ruler claims it.`, 'bad');
  saveRun();
}
export function onEnemyDeath(i) {
  S.kills++;
  const k = Un.KIND[i], st = Un.K[k], role = Un.ROLE[i], x = Un.X[i], z = Un.Z[i];
  gainXP(role === 3 ? 0 : (st.xp || 3) * (Un.ELITE[i] ? 3 : 1));
  S.res.essence += 1; if (Math.random() < .35) S.res.gold += 1;
  if ((st.iron && Math.random() < st.iron) || (st.crystal && Math.random() < st.crystal)) S.res.essence++;
  if (M('manaKill')) S.hero.mana = Math.min(S.hero.manaMax, S.hero.mana + M('manaKill'));
  // spell tomes: lords always carry one, the toughest chiefs sometimes
  if (role === 3 || (role === 4 && (world.camps[Un.CAMP[i]] || {}).tier >= 4 && Math.random() < .25)) { const tm = randomTome(); if (tm) dropLoot(x, z + 1.8, { tome: tm }); }
  // loot: chiefs always drop gear, lords drop better gear and a relic, elites sometimes
  if (role === 4 || role === 3) dropLoot(x - 1.5, z - 1, { potion: randomPotion() });
  else if (Math.random() < (Un.ELITE[i] ? .25 : .015)) dropLoot(x, z, { potion: randomPotion() });
  if (role === 4) { const c = world.camps[Un.CAMP[i]]; dropLoot(x, z, { item: PR.makeItem(c ? c.tier : 1, 0, Math.random, S.cls) }); if (c && c.tier >= 3) dropLoot(x + 1, z - 1.5, { item: PR.makeItem(c.tier, 1, Math.random, S.cls) }); if (Math.random() < .15) { const r = randomRelic(); if (r) dropLoot(x + 1.5, z, { relic: r }); } }
  else if (role === 3) { const c = world.cities[Un.CITY[i]], t = c ? c.tier + 1 : 2; dropLoot(x, z, { item: Math.random() < .4 ? PR.makeUnique(S.cls, t) : PR.makeItem(t, 1, Math.random, S.cls) }); dropLoot(x + 1.5, z + 1, { item: PR.makeItem(t, 1, Math.random, S.cls) }); dropLoot(x - 1, z + 2, { item: PR.makeItem(t, 2, Math.random, S.cls) }); const r = randomRelic(); if (r) dropLoot(x - 1.5, z, { relic: r }); }
  else if (Un.ELITE[i] && Math.random() < .4) dropLoot(x, z, { item: PR.makeItem(Math.max(1, Math.round(S.threat)), 0, Math.random, S.cls) });
  else if (Math.random() < .012) dropLoot(x, z, { item: PR.makeItem(Math.max(1, Math.round(S.threat)), 0, Math.random, S.cls) });
  if (Un.CAMP[i] >= 0) campLoss(world.camps[Un.CAMP[i]], role === 4);
  const reach = 30 + M('raise');
  let raise = 0;
  if (Un.MARK[i] > 0 && role !== 3 && role !== 4 && S.pcTotal < S.st.cap) { S.pcTotal += 3; return 3; }
  if (S.cls === 'necro' && role !== 3 && role !== 4 && S.pcTotal < S.st.cap && (x - S.hero.x) ** 2 + (z - S.hero.z) ** 2 < reach * reach) { raise = M('flag:legion') && Math.random() < .25 ? 2 : 1; S.pcTotal++; }
  if (role === 3) { const c = world.cities[Un.CITY[i]]; if (c && c.lordAlive) { c.lordAlive = false; capture(c); } }
  return raise;
}
function nearestTarget(x, z, r, team, withHero) {
  let best = null, bd = r * r;
  for (let i = 0; i < Un.U.N; i++) if (Un.TEAM[i] === team) { const d = (Un.X[i] - x) ** 2 + (Un.Z[i] - z) ** 2; if (d < bd) { bd = d; best = { x: Un.X[i], z: Un.Z[i] }; } }
  if (withHero) { const h = S.hero, d = (h.x - x) ** 2 + (h.z - z) ** 2; if (d < bd) best = { x: h.x, z: h.z }; }
  return best;
}
let wallT = 0, cleanT = 0, raidCheckT = 0;
export function updateCities(dt) {
  const h = S.hero; let sc = null, sd = 70;
  wallT -= dt;
  for (const c of world.cities) {
    const d = Math.hypot(h.x - c.x, h.z - c.z);
    if (!c.discovered && d < 50) { c.discovered = true; UI.loreCard(c.name, c.desc, `${c.faction === 'human' ? 'Human kingdom' : 'Orc warband'} · danger ${'◆'.repeat(c.tier)}`); }
    if (c.state !== 'owned' && d < sd) { sd = d; sc = c; }
    if (c.state === 'hostile') {
      if (!c.garrison && d < 80) spawnGarrison(c);
      if (c.wallDirty && wallT <= 0) { updateWalls(c); c.wallDirty = false; }
      if (c.wallHP <= 0 || c.gateHP <= 0) { c.state = 'breached'; c.lordSpawned = false; updateWalls(c); UI.toast(`${c.name} is open. Its ruler comes out to meet you.`, 'good'); }
      else if (d < 60) c.towerPos.forEach(([tx, tz], k) => {
        if (!c.towersUp[k] || c.towerHP[k] <= 0) return;
        c.towerCD[k] -= dt; if (c.towerCD[k] > 0) return;
        const wx = c.x + tx, wz = c.z + tz, t = nearestTarget(wx, wz, 20, 0, true);
        if (t) { const dd = Math.hypot(t.x - wx, t.z - wz); Un.fire(wx, c.base + 5.5, wz, t.x, hgt(t.x, t.z) + 1, t.z, .4 + dd / 30, 1, 1.5 + c.tier * .5, 0); c.towerCD[k] = 1.6; }
      });
    }
    if (c.state === 'breached' && c.lordAlive && !c.lordSpawned && d < 90) {
      c.lordSpawned = true;
      const human = c.faction === 'human';
      Un.spawn(1, human ? 6 : 4, c.x, c.z, { role: 3, city: c.i, sc: 2.1, hpMul: (human ? 9 : 20) * c.tier * (1 + .1 * S.threat), dm: 2 + c.tier * .5, ax: c.x, az: c.z });
      UI.boss(c);
    }
    if (c.state === 'owned') {
      if (!c.raid) c.heartHP = Math.min(c.heartMax, c.heartHP + dt * 2);
      c.buildings.forEach((b, k) => {
        if (b.type !== 'spire') return;
        c.spireCD[k] -= dt; if (c.spireCD[k] > 0) return;
        const wx = c.x + c.plots[k].x, wz = c.z + c.plots[k].z, t = nearestTarget(wx, wz, 16 + b.lvl * 4, 1, false);
        if (t) { const dd = Math.hypot(t.x - wx, t.z - wz); Un.fire(wx, c.base + 5, wz, t.x, hgt(t.x, t.z) + 1, t.z, .3 + dd / 35, 0, 3 * b.lvl, 3, 1.5); c.spireCD[k] = 1.4 / Math.sqrt(b.lvl); }
      });
    }
  }
  if (wallT <= 0) wallT = .25;
  S.siegeCity = sc;
}
// raids on the cities you hold
export function updateRaids(dt) {
  const own = owned(); if (!own.length) return;
  S.raidT -= dt;
  if (S.raidT <= 0) {
    const free = own.filter(c => !c.raid), c = free[(Math.random() * free.length) | 0];
    S.raidT = Math.max(70, 170 - own.length * 25) * (.8 + Math.random() * .4);
    if (c) {
      const n = Math.round(6 + S.threat * 5), a = Math.random() * TAU, d = c.R + 30, hpMul = 1 + (S.threat - .5) * .12;
      for (let q = 0; q < n; q++) {
        const x = c.x + Math.cos(a) * d + rnd(-6, 6), z = c.z + Math.sin(a) * d + rnd(-6, 6), r = Math.random();
        Un.spawn(1, pickEnemy(Math.random() < .5 ? 'human' : 'orc', S.threat, r), x, z, { role: 2, city: c.i, hpMul, elite: eliteRoll() });
      }
      c.raid = true; UI.toast(`Raid! ${n} foes march on ${c.name}.`, 'bad');
    }
  }
  raidCheckT -= dt;
  if (raidCheckT <= 0) {
    raidCheckT = 1;
    for (const c of own) if (c.raid) {
      let n = 0; for (let i = 0; i < Un.U.N; i++) if (Un.TEAM[i] && Un.ROLE[i] === 2 && Un.CITY[i] === c.i) n++;
      if (!n) { c.raid = false; UI.toast(`${c.name} holds.`, 'good'); }
    }
  }
}
// the world pushes back: power, time, territory and distance all raise the threat
export function updateEscalation(dt) {
  const h = S.hero, own = owned().length, dist = Math.hypot(h.x, h.z);
  S.threat = .5 + S.time / 200 + (h.level - 1) * .25 + own + dist / 100;
  S.spawnT -= dt;
  if (S.spawnT <= 0) {
    S.spawnT = Math.max(5, 22 - S.threat * 2.5);
    let roam = 0; for (let i = 0; i < Un.U.N; i++) if (Un.TEAM[i] && Un.ROLE[i] === 0) roam++;
    const cap = Math.min(520, 12 + S.threat * 28);
    if (roam < cap) {
      const band = Math.min(60, Math.round(3 + S.threat * 3)), a = Math.random() * TAU, d = 50 + Math.random() * 12;
      const cx = clamp(h.x + Math.cos(a) * d, -WH + 8, WH - 8), cz = clamp(h.z + Math.sin(a) * d, -WH + 8, WH - 8), hpMul = 1 + (S.threat - .5) * .12, fac = Math.random() < .5 ? 'human' : 'orc';
      for (let q = 0; q < band; q++) {
        Un.spawn(1, pickEnemy(fac, S.threat), cx + rnd(-5, 5), cz + rnd(-5, 5), { hpMul, elite: eliteRoll() });
      }
    }
  }
  cleanT -= dt;
  if (cleanT <= 0) { // stragglers far behind you wander off
    cleanT = 2;
    for (let i = Un.U.N - 1; i >= 0; i--) if (Un.TEAM[i] && Un.ROLE[i] === 0 && (Un.X[i] - h.x) ** 2 + (Un.Z[i] - h.z) ** 2 > 115 * 115) Un.remove(i);
  }
}
export function updateEconomy(dt) {
  S.incomeT -= dt;
  if (S.incomeT > 0) return;
  S.incomeT = 10;
  for (const c of owned()) {
    const tr = c.buildings.reduce((t, b) => t + (b.type === 'trade' ? b.lvl : 0), 0);
    S.res.gold += Math.round((3 * c.tier + tr * 5) * S.st.goldMul); S.res.essence += c.tier + tr;
  }
}
export function drawGlows(glow) {
  const h = S.hero;
  for (const l of S.loot || []) { const y = hgt(l.x, l.z); glow(l.x, y + 1, l.z, ...(l.tome ? [.5, .25, .7] : l.relic ? [.6, .45, .1] : [.15, .3, .6]), l.tome ? 6 : 4); glow(l.x, y + 3, l.z, ...(l.tome ? [.3, .15, .45] : l.relic ? [.3, .22, .05] : [.08, .15, .3]), l.tome ? 5 : 3); }
  for (const c of world.camps) if (!c.cleared && (c.x - h.x) ** 2 + (c.z - h.z) ** 2 < 150 * 150) glow(c.x, c.y + .9, c.z, .5, .22, .05, 7);
  for (const c of world.cities) {
    if (c.state === 'owned') glow(c.x, c.base + 6.4, c.z, .6, .25, .06, 14);
    c.buildings.forEach((b, k) => { if (c.state === 'owned' && b.type === 'spire') glow(c.x + c.plots[k].x, c.base + 5 * (.85 + b.lvl * .15), c.z + c.plots[k].z, .5, .2, .05, 6); });
  }
}
export function lordInfo(c) {
  for (let i = 0; i < Un.U.N; i++) if (Un.ROLE[i] === 3 && Un.CITY[i] === c.i) return { hp: Un.HP[i], max: Un.HPM[i] };
  return null;
}
// ---------- camps ----------
function spawnCamp(c) {
  c.spawned = true; c.alive = 0;
  const human = c.faction === 'human', n = 6 + c.tier * 4, hpMul = 1 + .15 * (c.tier - 1);
  for (let q = 0; q < n; q++) {
    const a = Math.random() * TAU, r = 2 + Math.random() * 7, x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r, roll = Math.random();
    if (Un.spawn(1, pickEnemy(c.faction, c.tier, roll), x, z, { role: 5, camp: c.i, hpMul, ax: x, az: z, elite: eliteRoll() }) >= 0) c.alive++;
  }
  const troll = !human && c.tier >= 3;
  if (Un.spawn(1, human ? 6 : troll ? 20 : 4, c.x + 2, c.z + 2, { role: 4, camp: c.i, sc: troll ? 1.25 : 1.6, hpMul: (human ? 5 : troll ? 1.2 : 11) * c.tier, dm: 1.6 + c.tier * .3, ax: c.x + 2, az: c.z + 2 }) >= 0) c.alive++;
}
function campLoss(c, chief) {
  if (!c || c.cleared) return;
  c.alive--;
  if (chief) toast2(`${c.chief} falls.`);
  if (c.alive <= 0) {
    c.cleared = true;
    const r = c.tier; S.res.gold += Math.round(40 * r * S.st.goldMul); S.res.essence += 14 * r;  gainXP(15 * r); c.respawnT = 360 + Math.random() * 180;
    burst(c.x, c.y + 1, c.z, 120, [1, .7, .3], 10);
    UI.toast(`${c.place} cleared. +${25 * r} gold, +${15 * r} stone, +${10 * r} essence.`, 'good');
    saveRun();
  }
}
const toast2 = m => UI.toast(m, 'good');
// lords and chiefs fight back: war cries, charges, calls for help, a last stand
export function updateBosses(dt) {
  const h = S.hero;
  for (let i = 0; i < Un.U.N; i++) {
    const role = Un.ROLE[i]; if (role !== 3 && role !== 4) continue;
    const d2 = (Un.X[i] - h.x) ** 2 + (Un.Z[i] - h.z) ** 2; if (d2 > 40 * 40) continue;
    const y = hgt(Un.X[i], Un.Z[i]), fr = Un.HP[i] / Un.HPM[i];
    Un.ABT[i] -= dt;
    if (Un.ABT[i] <= 0) {
      Un.ABT[i] = 8 + Math.random() * 4;
      if (d2 < 14 * 14 && d2 > 4 * 4 && Math.random() < .5) { Un.CHG[i] = .6; Un.YAW[i] = Math.atan2(h.x - Un.X[i], h.z - Un.Z[i]); for (let q = 0; q < 20; q++) dust.emit(Un.X[i], y + .3, Un.Z[i], rnd(-1, 1), rnd(.5, 1.5), rnd(-1, 1), .7, 1.6, .55, .5, .42); }
      else { for (const j of Un.unitsNear(Un.X[i], Un.Z[i], 12, 1)) Un.BD[j] = 6; for (let q = 0; q < 70; q++) { const a = q / 70 * TAU; magic.emit(Un.X[i], y + 1.5, Un.Z[i], Math.cos(a) * 9, .5, Math.sin(a) * 9, .6, 1, 1, .25, .15); } }
    }
    if (fr < .5 && !(Un.BFL[i] & 1)) { // call for help, once
      Un.BFL[i] |= 1;
      const c = role === 4 ? world.camps[Un.CAMP[i]] : world.cities[Un.CITY[i]], fac = c ? c.faction : 'human', n = 3 + (c ? c.tier : 1) * 2;
      for (let q = 0; q < n; q++) { const a = Math.random() * TAU; const j = Un.spawn(1, pickEnemy(fac, S.threat), Un.X[i] + Math.cos(a) * 6, Un.Z[i] + Math.sin(a) * 6, { role: role === 4 ? 5 : 0, camp: role === 4 ? Un.CAMP[i] : -1, ax: Un.X[i], az: Un.Z[i] }); if (j >= 0 && role === 4 && c) c.alive++; }
      UI.toast(`${role === 4 ? (c && c.chief) : (c && c.lordName)} calls for help!`, 'bad');
    }
    if (fr < .25 && !(Un.BFL[i] & 2)) { Un.BFL[i] |= 2; Un.DM[i] *= 1.5; Un.SPM[i] = 1.3; for (let q = 0; q < 40; q++) magic.emit(Un.X[i], y + 1, Un.Z[i], rnd(-3, 3), rnd(1, 4), rnd(-3, 3), .6, 1.2, 1, .2, .1); }
  }
}
// war parties hunt you once the world takes notice
function updateWarParties(dt) {
  if (S.threat < 1.8) return;
  S.partyT -= dt; if (S.partyT > 0) return;
  S.partyT = 100 + Math.random() * 60;
  const h = S.hero, a = Math.random() * TAU, d = 60, x = clamp(h.x + Math.cos(a) * d, -WH + 8, WH - 8), z = clamp(h.z + Math.sin(a) * d, -WH + 8, WH - 8);
  const fac = Math.random() < .5 ? 'human' : 'orc', n = Math.round(6 + S.threat * 3), hpMul = 1 + (S.threat - .5) * .12;
  for (let q = 0; q < n; q++) Un.spawn(1, pickEnemy(fac, S.threat), x + rnd(-5, 5), z + rnd(-5, 5), { hpMul, elite: q === 0 || eliteRoll() });
  UI.toast(`A ${fac === 'human' ? 'knightly' : 'orcish'} war party is hunting you.`, 'bad');
}
export function updateCamps(dt) {
  const h = S.hero;
  updateWarParties(dt);
  for (const c of world.camps) {
    if (c.cleared) { // cleared camps are slowly reclaimed
      c.respawnT = (c.respawnT || 400) - dt;
      if (c.respawnT <= 0 && Math.hypot(h.x - c.x, h.z - c.z) > 120) { c.cleared = false; c.spawned = false; c.alert = false; if (c.discovered) UI.toast(`${c.place} has been reclaimed.`); }
      continue;
    }
    const d = Math.hypot(h.x - c.x, h.z - c.z);
    if (!c.discovered && d < 60) { c.discovered = true; UI.toast(`${c.place} ahead. Its chief, ${c.chief}, keeps watch.`); }
    if (!c.spawned && d < 95) spawnCamp(c);
    if (c.alert && d > 75) c.alert = false;
    if (d < 120 && Math.random() < .3) magic.emit(c.x + rnd(-.3, .3), c.y + 1, c.z + rnd(-.3, .3), rnd(-.2, .2), rnd(1, 2), rnd(-.2, .2), rnd(.5, 1), rnd(.4, .8), 1, .5, .12);
  }
}
export function tick(dt) {
  S.time += dt;
  S.saveT -= dt; if (S.saveT <= 0) { S.saveT = 30; saveRun(); }
}
