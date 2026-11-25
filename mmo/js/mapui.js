// The maps: a detailed north-up minimap, and a full-screen map with layers you can switch on and off.
import { S, WH, TAU, clamp, dist } from './core.js';
import { world, regionAt, REGION_NAMES, depthAt } from './world.js';
import { MOBS, QUESTS, GIVERS } from './data.js';
import { LORE } from './story.js';
import * as Sea from './sea.js';
import * as Cb from './combat.js';
import * as Game from './game.js';

let H = {};                       // helpers from ui.js: objText, questMark, toast, openTalk
export function bind(h) { H = h; }
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- the painted base map: ground colours, hill shading, water, contours, trees and buildings ----------
const N = 1024;
let base = null, baseKey = '', regionLabels = [];
const lin = v => Math.min(255, Math.max(0, Math.pow(Math.max(0, v), 1 / 2.2) * 255));
function buildBase() {
  const geo = world.ground.geometry, pos = geo.attributes.position, col = geo.attributes.color;
  const n = Math.round(Math.sqrt(pos.count)), x0 = pos.getX(0), z0 = pos.getZ(0), sx = (pos.getX(n - 1) - x0) / (n - 1), sz = (pos.getZ(n * (n - 1)) - z0) / (n - 1);
  const hv = new Float32Array(n * n), sh = new Float32Array(n * n);
  for (let i = 0; i < n * n; i++) hv[i] = pos.getY(i);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c, hl = hv[r * n + Math.max(0, c - 1)], hr = hv[r * n + Math.min(n - 1, c + 1)], hu = hv[Math.max(0, r - 1) * n + c], hd = hv[Math.min(n - 1, r + 1) * n + c];
    // light from the north-west: slopes facing it are brighter
    sh[i] = clamp(1 + ((hl - hr) / (2 * sx) + (hu - hd) / (2 * sz)) * .45, .55, 1.45);
  }
  const cv = document.createElement('canvas'); cv.width = cv.height = N;
  const g = cv.getContext('2d'), img = g.createImageData(N, N), d = img.data;
  const water = world.zone === 'fleet' ? null : world.water;
  const prevH = new Float32Array(N);
  for (let py = 0; py < N; py++) {
    let lastH = 0;
    for (let px = 0; px < N; px++) {
      const x = (px + .5) / N * 2 * WH - WH, z = (py + .5) / N * 2 * WH - WH;
      const gx = clamp((x - x0) / sx, 0, n - 1.001), gz = clamp((z - z0) / sz, 0, n - 1.001), c0 = gx | 0, r0 = gz | 0, fx = gx - c0, fz = gz - r0;
      const i00 = r0 * n + c0, i10 = i00 + 1, i01 = i00 + n, i11 = i01 + 1;
      const w00 = (1 - fx) * (1 - fz), w10 = fx * (1 - fz), w01 = (1 - fx) * fz, w11 = fx * fz;
      const h = hv[i00] * w00 + hv[i10] * w10 + hv[i01] * w01 + hv[i11] * w11, s = sh[i00] * w00 + sh[i10] * w10 + sh[i01] * w01 + sh[i11] * w11;
      let r = (col.getX(i00) * w00 + col.getX(i10) * w10 + col.getX(i01) * w01 + col.getX(i11) * w11) * s;
      let gg = (col.getY(i00) * w00 + col.getY(i10) * w10 + col.getY(i01) * w01 + col.getY(i11) * w11) * s;
      let b = (col.getZ(i00) * w00 + col.getZ(i10) * w10 + col.getZ(i01) * w01 + col.getZ(i11) * w11) * s;
      if (water !== null && h < water) {
        const dep = water - h, k = clamp(dep / 9, 0, 1);
        r = .05 + (.16 - .05) * (1 - k); gg = .16 + (.34 - .16) * (1 - k); b = .27 + (.44 - .27) * (1 - k);
        if (dep < .45) { r += .12; gg += .14; b += .12; }
      } else {
        // faint contour lines every 4 units of height
        const band = Math.floor(h / 4);
        if ((px && band !== Math.floor(lastH / 4)) || (py && band !== Math.floor(prevH[px] / 4))) { r *= .82; gg *= .82; b *= .82; }
      }
      if (world.zone === 'fleet') { r = r * .55 + .02; gg = gg * .6 + .08; b = b * .7 + .16; }
      lastH = h; prevH[px] = h;
      const o = (py * N + px) * 4; d[o] = lin(r); d[o + 1] = lin(gg); d[o + 2] = lin(b); d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const k = N / (2 * WH), P = (x, z) => [(x + WH) * k, (z + WH) * k];
  // trees
  g.fillStyle = world.zone === 'coast' ? 'rgba(40,80,30,.55)' : 'rgba(26,52,22,.5)';
  for (const t of world.trees || []) { const [px, py] = P(t.x, t.z); g.beginPath(); g.arc(px, py, Math.max(1.1, t.r * k * 2.2), 0, TAU); g.fill(); }
  // walls and buildings
  g.lineCap = 'round';
  for (const w of world.walls || []) { const [ax, ay] = P(w.x1, w.z1), [bx, by] = P(w.x2, w.z2); g.strokeStyle = w.soft ? 'rgba(70,52,34,.55)' : 'rgba(42,32,24,.9)'; g.lineWidth = Math.max(1.3, (w.th || .9) * k * 1.4); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
  for (const dk of world.docks || []) { const [px, py] = P(dk.x, dk.z); g.fillStyle = '#7a5a36'; g.fillRect(px - 3, py - 3, 6, 6); }
  // the edge of the world
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.strokeRect(1, 1, N - 2, N - 2);
  base = cv;
  // where to write each part of the world's name
  regionLabels = [];
  if (world.zone !== 'fleet') {
    const acc = {};
    for (let z = -WH + 15; z < WH; z += 15) for (let x = -WH + 15; x < WH; x += 15) { if (water !== null && world.water !== null && depthAtSafe(x, z) > .5) continue; const r = regionAt(x, z); (acc[r] = acc[r] || { x: 0, z: 0, n: 0 }); acc[r].x += x; acc[r].z += z; acc[r].n++; }
    const names = REGION_NAMES();
    for (const [r, a] of Object.entries(acc)) if (names[r] && a.n > 6) regionLabels.push({ t: names[r], x: a.x / a.n, z: a.z / a.n });
  }
}
const depthAtSafe = (x, z) => { try { return depthAt(x, z); } catch (e) { return 0; } };
function ensureBase() {
  const key = (world.ground?.uuid || '') + ':' + world.zone + ':' + world.seed;
  if (key !== baseKey && world.ground) { baseKey = key; buildBase(); }
  return base;
}

// ---------- what goes on the map ----------
const npcPos = k => S.npcs?.[k] && !S.npcs[k].remove ? S.npcs[k] : S.ents.find(e => e.giver === k && !e.dead && !e.remove);
function questTargets(q) {
  const out = questTargets0(q);
  if (!out.length && q.where && world.spots?.[q.where]) out.push({ x: world.spots[q.where].x, z: world.spots[q.where].z });
  return out;
}
function questTargets0(q) {
  const o = q.obj, out = [];
  if (o.zone && o.zone !== S.zone) return out;
  if (o.at) { const sp = world.spots?.[o.at]; if (sp && S.zone === 'vale') out.push({ x: sp.x, z: sp.z, r: Math.max(8, o.r || 9) }); return out; }
  if (o.ask) {
    const asked = S.quests[q.id]?.asked || [];
    for (const k of o.ask) if (!asked.includes(k)) { const n = S.ents.find(e => !e.dead && !e.remove && (e.giver === k || (k.startsWith('vendor:') && e.vendor === k.slice(7)))); if (n) out.push({ x: n.x, z: n.z }); }
    return out;
  }
  if (o.talk) { const n = npcPos(Game.turnToOf(q)); if (n) out.push({ x: n.x, z: n.z }); return out; }
  if (o.inspect) { for (const p of world.props) if (p.tag === o.inspect && !(S.used[q.id] || []).includes(p.id)) out.push({ x: p.x, z: p.z }); return out; }
  if (o.bosses) {
    const got = S.quests[q.id]?.got || [];
    for (const sp of world.spawns) if (o.bosses.includes(sp.named) && !got.includes(sp.named)) out.push({ x: sp.x, z: sp.z });
    return out;
  }
  if (o.named) {
    for (const sp of world.spawns) if (sp.named === o.named || sp.ph?.named === o.named) out.push({ x: sp.x, z: sp.z, r: sp.ph ? 14 : 0 });
    if (!out.length) for (const e of S.ents) if (e.named === o.named && !e.dead) out.push({ x: e.x, z: e.z });
    return out;
  }
  const keys = o.kill || o.collect; if (!keys) return out;
  const near = o.near && world.spots?.[o.near], reef = o.reef && world.buoy;
  const groups = {};
  for (const sp of world.spawns) {
    if (!keys.includes(sp.mob) || sp.boss) continue;
    if (o.dungeon && !sp.dungeon) continue;
    if (near && Math.hypot(sp.x - near.x, sp.z - near.z) > 50) continue;
    if (reef && Math.hypot(sp.x - reef.x, sp.z - reef.z) > 45) continue;
    (groups[sp.hz ?? -1] = groups[sp.hz ?? -1] || []).push(sp);
  }
  for (const g of Object.values(groups)) {
    let cx = 0, cz = 0; for (const s of g) { cx += s.x; cz += s.z; } cx /= g.length; cz /= g.length;
    out.push({ x: cx, z: cz, r: Math.max(10, ...g.map(s => Math.hypot(s.x - cx, s.z - cz) + 6)) });
  }
  return out;
}
const qProgress = q => { const st = S.quests[q.id]; const n = q.obj.n || 1; return q.obj.at || q.obj.talk || q.obj.named ? '' : ` (${Math.min(st?.n || 0, n)}/${n})`; };
// every marker, by layer
export function marks() {
  const h = S.hero, out = [];
  // quests: where to go for each active quest, and who to hand it in to
  for (const q of QUESTS) {
    const st = S.quests[q.id]; if (!st || q.cls && q.cls !== S.heroCls) continue;
    if (st.state === 'active') {
      for (const t of questTargets(q)) out.push({ layer: 'quests', type: t.r ? 'area' : 'qpt', x: t.x, z: t.z, r: t.r, story: q.story, q,
        title: q.name, info: `${H.objText ? esc(H.objText(q)) : ''}${qProgress(q)}`, sub: q.story ? 'Story quest' : 'Quest' });
    }
  }
  // givers: ! has something for you, ? is waiting for a hand-in; everyone else with a name is a grey dot
  for (const e of S.ents) {
    if (e.dead || e.remove) continue;
    if (e.giver) {
      const mk = H.questMark ? H.questMark(e.giver) : '';
      const offer = Game.nextOffer(e.giver), ins = Game.turnInsFor(e.giver);
      out.push({ layer: 'givers', type: 'giver', mk, x: e.x, z: e.z, e, story: mk === '!' ? offer?.story : ins[0]?.story,
        title: e.name, sub: e.title || 'Quest giver',
        info: ins.length ? `Ready to hand in: ${ins.map(q => esc(q.name)).join(', ')}` : offer ? `New quest: ${esc(offer.name)}${offer.story ? ' (story)' : ''}` : 'Nothing for you right now.' });
    } else if (e.vendor || e.armory || e.banker || e.bindstone) {
      out.push({ layer: 'services', type: 'svc', icon: e.vendor ? '💰' : e.armory ? '⚔️' : e.banker ? '🏦' : '✦', x: e.x, z: e.z, e, title: e.name, sub: e.title || '',
        info: e.vendor ? 'Buy supplies, sell loot.' : e.armory ? 'Gear and weapons for your classes.' : e.banker ? 'Your bank: shared by every class.' : 'Bind here to come back here when you die.' });
    } else if (e.storyNpc && !e.prop && e.team === 'npc') {
      out.push({ layer: 'givers', type: 'npc', x: e.x, z: e.z, e, title: e.name, sub: e.title || 'Villager', info: 'Tap them in the world to talk.' });
    }
  }
  for (const d of world.docks || []) out.push({ layer: 'services', type: 'svc', icon: '⚓', x: d.x, z: d.z, title: d.name || 'Dock', sub: 'Dock', info: 'Rent a rowboat here, or wait for the ferry.' });
  if (Sea.sea.ferry) out.push({ layer: 'services', type: 'svc', icon: '⛴️', x: Sea.sea.ferry.x, z: Sea.sea.ferry.z, title: 'The ferry', sub: 'Moving', info: 'Calls at every town dock in turn.' });
  for (const z of world.zoneLines || []) out.push({ layer: 'places', type: 'exit', x: z.x, z: z.z, title: z.label, sub: 'Zone line', info: 'Walk through to travel.' });
  // enemies: hunting zones, named enemies and bosses, and (zoomed in) the enemies themselves
  for (const zn of world.huntZones || []) out.push({ layer: 'enemies', type: 'zone', x: zn.x, z: zn.z, r: zn.r, zn, col: Cb.conColor(h.lvl, Math.round((zn.lvl[0] + zn.lvl[1]) / 2)),
    title: zn.name, sub: `Levels ${zn.lvl[0]}-${zn.lvl[1]}${zn.dungeon ? ' · dungeon' : ''}`, info: `${zn.mobs.join(', ')}${S.huntOn ? '' : '. Tap Hunt in your orders while you stand here and your tank will work through it.'}` });
  for (const sp of world.spawns) if (sp.named && !sp.ph) {
    const nm = world.names[sp.named] || (sp.alive && !sp.alive.dead ? sp.alive.name : MOBS[sp.mob]?.name) || sp.named, up = sp.alive && !sp.alive.dead;
    out.push({ layer: 'enemies', type: sp.boss || sp.boss2 ? 'boss' : 'named', x: sp.x, z: sp.z, up, col: Cb.conColor(h.lvl, sp.lvl[1]), title: nm, sub: `${sp.boss || sp.boss2 ? 'Boss' : 'Named'} · level ${sp.lvl[1]}`, info: up ? 'Up now.' : 'Not up. It will be back.' });
  }
  // items: lore pages, things to inspect for quests, and your corpse
  for (const p of world.props || []) {
    if (p.when || p.unless) { const e = S.ents.find(x => x.prop === p && !x.remove); if (!e) continue; }
    if (p.node) { if (!p.depleted) out.push({ layer: 'items', type: 'item', icon: p.node.type === 'ore' ? '⛏️' : '🌿', hot: false, node: true, x: p.x, z: p.z, title: p.name, sub: p.node.type === 'ore' ? 'Ore vein (Mining)' : 'Herb (Herbalism)', info: '' }); continue; }
    if (p.station) { out.push({ layer: 'services', type: 'svc', icon: '🔨', x: p.x, z: p.z, title: p.name, sub: "Crafters' station", info: 'Craft here once a trainer has taught you.' }); continue; }
    if (p.tag === 'scene') continue;
    const need = QUESTS.some(q => q.obj.inspect === p.tag && S.quests[q.id]?.state === 'active' && !(S.used[q.id] || []).includes(p.id));
    const unread = p.lore && !S.lore[p.lore];
    out.push({ layer: 'items', type: 'item', icon: p.lore ? '📖' : need ? '◆' : '•', hot: need || unread, x: p.x, z: p.z, title: p.lore ? LORE[p.lore]?.title || p.name : p.name,
      sub: p.lore ? (unread ? 'Lore: not found yet' : 'Lore: found') : need ? 'Needed for a quest' : 'Something to look at', info: p.lore ? (unread ? 'Walk up to it to read it.' : 'Already in your Book → Lore.') : '' });
  }
  if (S.corpse && (S.corpse.zone || 'vale') === S.zone) out.push({ layer: 'items', type: 'corpse', x: S.corpse.x, z: S.corpse.z, title: 'Your corpse', sub: 'Your gear is here', info: 'Run back and loot it to get your gear back.', hot: true });
  // places
  for (const p of world.places || []) out.push({ layer: 'places', type: 'place', big: p.kind === 'town', x: p.x, z: p.z - (p.R || 10) - 4, title: p.name, sub: { town: 'Town', dungeon: 'Dungeon', village: 'Village', site: 'Landmark' }[p.kind] || 'Place', info: '' });
  for (const p of world.extraPlaces || []) if (!(world.places || []).includes(p)) out.push({ layer: 'places', type: 'place', x: p.x, z: p.z - (p.R || 10) - 4, title: p.name, sub: 'Place', info: '' });
  for (const l of world.mapLabels || []) out.push({ layer: 'places', type: 'label', x: l.x, z: l.z, title: l.t, sub: '', info: '' });
  for (const l of regionLabels) out.push({ layer: 'places', type: 'region', x: l.x, z: l.z, title: l.t, sub: 'Region', info: '' });
  // people
  for (const p of S.party) if (!p.isHero && !p.dead) out.push({ layer: 'people', type: 'party', x: p.x, z: p.z, title: p.name, sub: `Level ${p.lvl} · in your group`, info: '' });
  for (const f of S.fakes) if (!f.inParty && !f.dead && !f.remove) out.push({ layer: 'people', type: 'fake', x: f.x, z: f.z, title: f.name, sub: `Level ${f.lvl} player`, info: '' });
  return out;
}

// ---------- drawing markers (shared by both maps) ----------
const GOLD = '#ffd34d', STORY = '#ffb020';
function drawMark(g, m, px, py, s, big) {
  const sz = big ? 1 : .8;
  g.lineWidth = 3 * sz; g.strokeStyle = '#000';
  switch (m.type) {
    case 'area': {
      g.fillStyle = m.story ? 'rgba(255,176,32,.22)' : 'rgba(255,211,77,.18)'; g.strokeStyle = m.story ? STORY : GOLD; g.lineWidth = 2 * sz; g.setLineDash([6 * sz, 4 * sz]);
      g.beginPath(); g.arc(px, py, Math.max(8, m.r * s), 0, TAU); g.fill(); g.stroke(); g.setLineDash([]); break; }
    case 'qpt': { const r = 7 * sz; g.fillStyle = m.story ? STORY : GOLD; g.beginPath(); g.moveTo(px, py - r); g.lineTo(px + r, py); g.lineTo(px, py + r); g.lineTo(px - r, py); g.closePath(); g.stroke(); g.fill(); break; }
    case 'giver': {
      if (!m.mk) { g.fillStyle = '#d8c890'; g.beginPath(); g.arc(px, py, 3.5 * sz, 0, TAU); g.stroke(); g.fill(); break; }
      g.font = `900 ${Math.round((m.story ? 24 : 20) * sz)}px Cinzel, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 4 * sz; g.strokeText(m.mk, px, py); g.fillStyle = m.mk === '?' ? GOLD : m.story ? STORY : GOLD; g.fillText(m.mk, px, py); break; }
    case 'npc': g.fillStyle = '#c8bc98'; g.beginPath(); g.arc(px, py, 3 * sz, 0, TAU); g.stroke(); g.fill(); break;
    case 'svc': case 'item': {
      g.font = `${Math.round((m.type === 'item' && m.icon === '•' ? 20 : 15) * sz)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      if (m.icon === '◆') { const r = 6 * sz; g.fillStyle = GOLD; g.beginPath(); g.moveTo(px, py - r); g.lineTo(px + r, py); g.lineTo(px, py + r); g.lineTo(px - r, py); g.closePath(); g.stroke(); g.fill(); break; }
      if (m.icon === '•') { g.fillStyle = '#bbb'; g.beginPath(); g.arc(px, py, 3 * sz, 0, TAU); g.stroke(); g.fill(); break; }
      if (m.hot) { g.fillStyle = 'rgba(255,211,77,.35)'; g.beginPath(); g.arc(px, py, 11 * sz, 0, TAU); g.fill(); }
      g.globalAlpha = m.type === 'item' && !m.hot && !m.node ? .45 : 1; g.fillText(m.icon, px, py + 1); g.globalAlpha = 1; break; }
    case 'corpse': g.strokeStyle = '#8dffef'; g.lineWidth = 3; g.beginPath(); g.moveTo(px - 6, py - 6); g.lineTo(px + 6, py + 6); g.moveTo(px + 6, py - 6); g.lineTo(px - 6, py + 6); g.stroke(); break;
    case 'zone': {
      g.strokeStyle = m.col; g.globalAlpha = .7; g.lineWidth = 1.5; g.setLineDash([3, 4]); g.beginPath(); g.arc(px, py, m.r * s, 0, TAU); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; break; }
    case 'named': case 'boss': {
      g.font = `${Math.round((m.type === 'boss' ? 18 : 15) * sz)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.globalAlpha = m.up ? 1 : .5; g.lineWidth = 3; g.strokeText(m.type === 'boss' ? '☠' : '★', px, py); g.fillStyle = m.type === 'boss' ? '#ff5a48' : '#ff9a3a'; g.fillText(m.type === 'boss' ? '☠' : '★', px, py); g.globalAlpha = 1; break; }
    case 'party': g.fillStyle = '#5fd3ff'; g.beginPath(); g.arc(px, py, 4.5 * sz, 0, TAU); g.stroke(); g.fill(); break;
    case 'fake': g.fillStyle = '#d8d8ff'; g.beginPath(); g.arc(px, py, 2.6 * sz, 0, TAU); g.fill(); break;
    case 'exit': g.font = `700 ${Math.round(13 * sz)}px Cinzel, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeText('➜', px, py); g.fillStyle = '#fff'; g.fillText('➜', px, py); break;
  }
}
function heroArrow(g, px, py, sz = 1) {
  g.save(); g.translate(px, py); g.rotate(Math.PI - S.hero.yaw); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -10 * sz); g.lineTo(7 * sz, 8 * sz); g.lineTo(0, 4 * sz); g.lineTo(-7 * sz, 8 * sz); g.closePath(); g.stroke(); g.fill(); g.restore();
}

// ---------- the minimap: north is always up ----------
let miniMarks = [], miniT = -9;
export function drawMini(c) {
  const h = S.hero; if (!h || !ensureBase()) return;
  if (S.time - miniT > .5 || S.time < miniT) { miniT = S.time; miniMarks = marks().filter(m => ['quests', 'givers', 'items', 'enemies'].includes(m.layer) && (m.type !== 'item' || m.hot || m.node) && m.type !== 'npc' && !(m.type === 'giver' && !m.mk) && m.type !== 'zone'); }
  const g = c.getContext('2d'), W = c.width, span = 120, s = W / span, k = N / (2 * WH);
  g.save(); g.clearRect(0, 0, W, W); g.beginPath(); g.arc(W / 2, W / 2, W / 2, 0, TAU); g.clip();
  g.fillStyle = '#1b2228'; g.fillRect(0, 0, W, W);
  g.imageSmoothingEnabled = true;
  g.drawImage(base, (h.x + WH - span / 2) * k, (h.z + WH - span / 2) * k, span * k, span * k, 0, 0, W, W);
  const P = (x, z) => [(x - h.x) * s + W / 2, (z - h.z) * s + W / 2];
  // the hunting ground you're working
  const hi = Game.huntInfo();
  if (hi?.zone) { const [px, py] = P(hi.zone.x, hi.zone.z); g.strokeStyle = '#ffd34d'; g.lineWidth = 2.5; g.setLineDash([8, 6]); g.beginPath(); g.arc(px, py, hi.zone.r * s, 0, TAU); g.stroke(); g.setLineDash([]); }
  const offEdge = [];
  for (const m of miniMarks) {
    const [px, py] = P(m.x, m.z), r = Math.hypot(px - W / 2, py - W / 2);
    if (r > W / 2 + (m.r ? m.r * s : 0) + 4) { if (m.layer === 'quests' || m.mk) offEdge.push(m); continue; }
    if (m.type === 'named' && !m.up) continue;
    drawMark(g, m, px, py, s, false);
  }
  // live things nearby
  for (const e of S.ents) {
    if (e.dead || e.remove || Math.abs(e.x - h.x) > span / 2 || Math.abs(e.z - h.z) > span / 2) continue;
    const [px, py] = P(e.x, e.z);
    if (e.mob) { if (e.engaged || e === S.target) { g.fillStyle = e === S.target ? '#fff' : '#ff4a3a'; g.beginPath(); g.arc(px, py, e.boss ? 6 : 3.5, 0, TAU); g.fill(); } else if (!e.named) { g.fillStyle = 'rgba(255,90,72,.75)'; g.beginPath(); g.arc(px, py, 2.2, 0, TAU); g.fill(); } }
    else if (e.inParty && !e.isHero) drawMark(g, { type: 'party' }, px, py, s, false);
    else if (e.fake) drawMark(g, { type: 'fake' }, px, py, s, false);
  }
  if (Sea.sea.ferry) { const [px, py] = P(Sea.sea.ferry.x, Sea.sea.ferry.z); g.fillStyle = GOLD; g.beginPath(); g.arc(px, py, 5, 0, TAU); g.fill(); }
  if (S.corpse && (S.corpse.zone || 'vale') === S.zone) { const [px, py] = P(S.corpse.x, S.corpse.z); drawMark(g, { type: 'corpse' }, px, py, s); }
  g.restore();
  // quest markers beyond the edge point the way
  const seen = new Set();
  for (const m of offEdge.sort((a, b) => Math.hypot(a.x - h.x, a.z - h.z) - Math.hypot(b.x - h.x, b.z - h.z))) {
    const key = m.q?.id || m.title; if (seen.has(key)) continue; seen.add(key); if (seen.size > 6) break;
    const a = Math.atan2(m.z - h.z, m.x - h.x), rx = W / 2 + Math.cos(a) * (W / 2 - 9), ry = W / 2 + Math.sin(a) * (W / 2 - 9);
    g.save(); g.translate(rx, ry); g.rotate(a); g.fillStyle = m.story || m.mk === '!' && m.story ? STORY : GOLD; g.strokeStyle = '#000'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(8, 0); g.lineTo(-5, -6); g.lineTo(-5, 6); g.closePath(); g.stroke(); g.fill(); g.restore();
  }
  heroArrow(g, W / 2, W / 2);
  g.strokeStyle = 'rgba(238,228,204,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(W / 2, W / 2, W / 2 - 1.5, 0, TAU); g.stroke();
  g.font = 'bold 20px Cinzel, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = '#000'; g.strokeText('N', W / 2, 14); g.fillStyle = GOLD; g.fillText('N', W / 2, 14);
}

// ---------- the full-screen map ----------
const LAYERS = [['quests', '❗', 'Quests'], ['givers', '🧑', 'Givers'], ['services', '💰', 'Services'], ['enemies', '⚔️', 'Enemies'], ['items', '📖', 'Items'], ['places', '🏘️', 'Places'], ['people', '👥', 'People']];
let on = { quests: true, givers: true, services: true, enemies: true, items: true, places: true, people: true };
try { Object.assign(on, JSON.parse(localStorage.getItem('mmo-map-layers') || '{}')); } catch (e) { }
const view = { x: 0, z: 0, s: 1, fit: 1 };
let open = false, cv = null, drawT = 0, picked = null, hits = [];
export const isOpen = () => open;
export function openBig() {
  if (!S.hero || !ensureBase()) return;
  const box = $('bigmap'); box.classList.remove('hide'); open = true; picked = null; $('bmInfo').classList.add('hide');
  cv = $('bmc'); size();
  view.x = S.hero.x; view.z = S.hero.z; view.s = Math.max(view.fit, view.fit * 1.8);
  if (world.mapBounds) { const B = world.mapBounds; view.x = (B.x0 + B.x1) / 2; view.z = (B.z0 + B.z1) / 2; view.s = view.fit; }
  $('bmTitle').textContent = world.names.zone || world.names.town || 'Map';
  $('bmTog').innerHTML = LAYERS.map(([k, ic, n]) => `<button data-l="${k}" class="${on[k] ? 'on' : ''}">${ic} ${n}</button>`).join('');
  draw();
}
export function closeBig() { $('bigmap').classList.add('hide'); open = false; }
function size() {
  const dpr = Math.min(2, devicePixelRatio || 1), w = innerWidth, h = innerHeight;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px';
  view.dpr = dpr; view.w = w; view.h = h; view.fit = Math.min(w, h - 90) / (2 * WH) * .96;
  const B = world.mapBounds; if (B) view.fit = Math.min(w / (B.x1 - B.x0), (h - 90) / (B.z1 - B.z0)) * .96;
  view.s = clamp(view.s, view.fit, view.fit * 9);
}
const toScr = (x, z) => [(x - view.x) * view.s + view.w / 2, (z - view.z) * view.s + view.h / 2];
const toWorld = (px, py) => [(px - view.w / 2) / view.s + view.x, (py - view.h / 2) / view.s + view.z];
function clampView() { const m = WH; view.x = clamp(view.x, -m, m); view.z = clamp(view.z, -m, m); view.s = clamp(view.s, view.fit, view.fit * 9); }
function draw() {
  if (!open) return;
  const g = cv.getContext('2d'), k = N / (2 * WH);
  g.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  g.fillStyle = '#0d1114'; g.fillRect(0, 0, view.w, view.h);
  const [ox, oy] = toScr(-WH, -WH); g.imageSmoothingEnabled = view.s < 3;
  g.drawImage(base, ox, oy, 2 * WH * view.s, 2 * WH * view.s);
  const ms = marks().filter(m => on[m.layer]);
  hits = [];
  const order = { zone: 0, area: 1, region: 2, place: 3, label: 3, exit: 4, item: 5, svc: 6, npc: 6, named: 7, boss: 7, fake: 8, party: 9, qpt: 10, corpse: 10, giver: 11 };
  ms.sort((a, b) => (order[a.type] ?? 5) - (order[b.type] ?? 5));
  const zoomed = view.s > view.fit * 2.2, labels = [];
  const label = (t, x, y, font, col, pri, alpha = 1) => labels.push({ t, x, y, font, col, pri, alpha });
  for (const m of ms) {
    const [px, py] = toScr(m.x, m.z);
    if (px < -60 || py < -60 || px > view.w + 60 || py > view.h + 60) { if (!m.r || m.r * view.s < 40) continue; }
    if (m.type === 'region' || m.type === 'place' || m.type === 'label') {
      if (m.type === 'region' && zoomed) continue;
      if (m.type === 'region') label(m.title, px, py, '700 15px Cinzel, serif', '#eee4cc', 3, .75);
      else label(m.title, px, py, m.big ? '700 16px Cinzel, serif' : m.type === 'label' ? '12.5px Alegreya Sans, sans-serif' : '700 13px Cinzel, serif', '#fff', m.big ? 10 : 7);
      if (m.type !== 'region') hits.push({ m, px, py, r: 18 });
      continue;
    }
    drawMark(g, m, px, py, view.s, true);
    if (m.type === 'zone') {
      if (zoomed || m.r * view.s > 30) label(`${m.title} ${m.zn.lvl[0]}-${m.zn.lvl[1]}`, px, py + Math.min(m.r * view.s - 10, 26), '700 11.5px Alegreya Sans, sans-serif', m.col, 5);
      hits.push({ m, px, py, r: m.r * view.s, area: true }); continue;
    }
    if (m.type === 'area') { hits.push({ m, px, py, r: Math.max(8, m.r * view.s), area: true }); continue; }
    if ((m.type === 'named' || m.type === 'boss') && zoomed) label(m.title, px, py + 15, '11.5px Alegreya Sans, sans-serif', m.col, 6);
    if ((m.type === 'giver' || m.type === 'svc' && m.e) && zoomed) label(m.title, px, py + 16, '11.5px Alegreya Sans, sans-serif', m.type === 'giver' && m.mk ? GOLD : '#fff', m.mk ? 9 : 8);
    hits.push({ m, px, py, r: 16 });
  }
  // labels last, most important first, never on top of each other
  const placed = [];
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3.5; g.strokeStyle = 'rgba(0,0,0,.85)';
  for (const l of labels.sort((a, b) => b.pri - a.pri)) {
    g.font = l.font; const w = g.measureText(l.t).width + 6, hh = 15, r = { x0: l.x - w / 2, x1: l.x + w / 2, y0: l.y - hh / 2, y1: l.y + hh / 2 };
    if (placed.some(p => r.x0 < p.x1 && r.x1 > p.x0 && r.y0 < p.y1 && r.y1 > p.y0)) continue;
    placed.push(r); g.globalAlpha = l.alpha; g.strokeText(l.t, l.x, l.y); g.fillStyle = l.col; g.fillText(l.t, l.x, l.y); g.globalAlpha = 1;
  }
  // live enemies when zoomed in
  if (on.enemies && zoomed) for (const e of S.ents) {
    if (!e.mob || e.dead || e.remove || e.named) continue;
    const [px, py] = toScr(e.x, e.z); if (px < 0 || py < 0 || px > view.w || py > view.h) continue;
    g.fillStyle = e.engaged ? '#ff4a3a' : Cb.conColor(S.hero.lvl, e.lvl); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.arc(px, py, 3, 0, TAU); g.stroke(); g.fill();
    hits.push({ m: { title: e.name, sub: `Level ${e.lvl}${e.engaged ? ' · fighting' : ''}`, info: '' }, px, py, r: 10 });
  }
  const hi = Game.huntInfo();
  if (hi?.zone) { const [px, py] = toScr(hi.zone.x, hi.zone.z); g.strokeStyle = GOLD; g.lineWidth = 3; g.setLineDash([10, 7]); g.beginPath(); g.arc(px, py, hi.zone.r * view.s, 0, TAU); g.stroke(); g.setLineDash([]); }
  if (picked) { const [px, py] = toScr(picked.x, picked.z); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, picked.r ? Math.max(12, picked.r * view.s) + 4 : 14, 0, TAU); g.stroke(); }
  const [hx, hy] = toScr(S.hero.x, S.hero.z); heroArrow(g, hx, hy, 1.15);
  // compass and scale
  g.font = 'bold 18px Cinzel, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 4; g.strokeStyle = '#000';
  const cx = view.w - 26, cy = 96; g.strokeText('N', cx, cy - 12); g.fillStyle = GOLD; g.fillText('N', cx, cy - 12);
  g.fillStyle = GOLD; g.beginPath(); g.moveTo(cx, cy - 2); g.lineTo(cx + 6, cy + 12); g.lineTo(cx, cy + 8); g.lineTo(cx - 6, cy + 12); g.closePath(); g.stroke(); g.fill();
  drawT = performance.now();
}
export function tick() { if (open && performance.now() - drawT > 450) draw(); }
function pick(px, py) {
  let best = null, bd = 1e9;
  for (const h of hits) {
    const d = Math.hypot(h.px - px, h.py - py);
    if (h.area) { if (d < h.r && h.r + 1000 < bd) { bd = h.r + 1000; best = h; } }
    else if (d < Math.max(h.r, 20) && d < bd) { bd = d; best = h; }
  }
  return best?.m || null;
}
function showInfo(m) {
  const box = $('bmInfo');
  if (!m) { box.classList.add('hide'); picked = null; draw(); return; }
  picked = m.x !== undefined ? m : null;
  const d = m.x !== undefined ? Math.round(Math.hypot(m.x - S.hero.x, m.z - S.hero.z)) : null;
  const dir = m.x !== undefined ? compass(m.x - S.hero.x, m.z - S.hero.z) : '';
  box.innerHTML = `<b>${esc(m.title)}</b>${m.sub ? `<small>${esc(m.sub)}</small>` : ''}${m.info ? `<p>${m.info}</p>` : ''}${d !== null && d > 3 ? `<p class="dim">${d} paces ${dir}</p>` : ''}`;
  box.classList.remove('hide'); draw();
}
const compass = (dx, dz) => ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(((Math.atan2(dx, -dz) + TAU) % TAU) / (Math.PI / 4)) % 8];
export function init() {
  const box = $('bigmap'); cv = $('bmc');
  $('bmX').onclick = closeBig;
  $('bmTog').onclick = ev => { const b = ev.target.closest('button'); if (!b) return; const k = b.dataset.l; on[k] = !on[k]; b.classList.toggle('on', on[k]); try { localStorage.setItem('mmo-map-layers', JSON.stringify(on)); } catch (e) { } draw(); };
  $('bmZoom').onclick = ev => { const z = ev.target.dataset.z; if (z === 'in') view.s *= 1.5; if (z === 'out') view.s /= 1.5; if (z === 'me') { view.x = S.hero.x; view.z = S.hero.z; } if (z === 'all') { const B = world.mapBounds; view.s = view.fit; view.x = B ? (B.x0 + B.x1) / 2 : 0; view.z = B ? (B.z0 + B.z1) / 2 : 0; } clampView(); draw(); };
  addEventListener('resize', () => { if (open) { size(); draw(); } });
  // drag to pan, pinch to zoom, tap to see what something is
  const pts = new Map(); let start = null, pinch = null, moved = 0;
  cv.addEventListener('pointerdown', ev => { cv.setPointerCapture(ev.pointerId); pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY }); moved = 0;
    if (pts.size === 1) start = { x: ev.clientX, y: ev.clientY, vx: view.x, vz: view.z, t: performance.now() };
    if (pts.size === 2) { const [a, b] = [...pts.values()]; const [wx, wz] = toWorld((a.x + b.x) / 2, (a.y + b.y) / 2); pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s, wx, wz }; } });
  cv.addEventListener('pointermove', ev => {
    if (!pts.has(ev.pointerId)) return; pts.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      view.s = clamp(pinch.s * d / Math.max(10, pinch.d), view.fit, view.fit * 9); view.x = pinch.wx - (mx - view.w / 2) / view.s; view.z = pinch.wz - (my - view.h / 2) / view.s; moved = 99; clampView(); draw(); return; }
    if (pts.size === 1 && start) { const dx = ev.clientX - start.x, dy = ev.clientY - start.y; moved = Math.max(moved, Math.hypot(dx, dy)); if (moved > 8) { view.x = start.vx - dx / view.s; view.z = start.vz - dy / view.s; clampView(); draw(); } }
  });
  const up = ev => {
    const wasTap = pts.size === 1 && moved < 10 && start && performance.now() - start.t < 600;
    pts.delete(ev.pointerId); if (pts.size < 2) pinch = null;
    if (pts.size === 1) { const [a] = [...pts.values()]; start = { x: a.x, y: a.y, vx: view.x, vz: view.z, t: performance.now() }; moved = 99; }
    if (wasTap) { const r = cv.getBoundingClientRect(); showInfo(pick(ev.clientX - r.left, ev.clientY - r.top)); }
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', ev => { pts.delete(ev.pointerId); pinch = null; });
  cv.addEventListener('wheel', ev => { ev.preventDefault(); const r = cv.getBoundingClientRect(), [wx, wz] = toWorld(ev.clientX - r.left, ev.clientY - r.top); view.s = clamp(view.s * (ev.deltaY < 0 ? 1.15 : 1 / 1.15), view.fit, view.fit * 9); view.x = wx - (ev.clientX - r.left - view.w / 2) / view.s; view.z = wz - (ev.clientY - r.top - view.h / 2) / view.s; clampView(); draw(); }, { passive: false });
}
