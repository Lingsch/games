// Boot, the frame loop, the over-the-shoulder camera, hero movement and drawing every character.
import * as THREE from './three.js';
import { S, clamp, wrapA, rnd, X } from './core.js';
import * as R from './render.js';
import * as Game from './game.js';
import * as Cb from './combat.js';
import * as UI from './ui.js';
import { hgt, collide, world, generateWorld, wallHit } from './world.js';
import { MOBS } from './data.js';
import { updateWater } from './zones.js';
import * as Sea from './sea.js';
// Build 6: the bigger coast, professions, reputation and mounts, guilds and the market, more Vale
import './coast6.js';
import './coastq.js';
import './prof6.js';
import * as Rep from './rep6.js';
import * as Social from './social6.js';
import * as Vale6 from './vale6.js';
// Build 7: the blighted wastes, the raid, soulbound weapons, heroics and deeds
import './wastes7.js';
import './wastesq.js';
import * as Raid from './raid7.js';
import './soul7.js';
import './spell8.js';
import * as P8 from './party8.js';
import './heroic7.js';
import './ach7.js';
// Stars Beneath: the space-opera skin, Dustfall, its people, and the ship
import './stars.js';
import './moon1.js';
import './moonq.js';
import './models3.js';
import * as Ship from './ship1.js';
import './sunder3.js';
import './light4.js';
import './fort4.js';
import './city4.js';
import './aliens5.js';
import './dark5.js';
import './cinder5.js';
import './hollow5.js';
import './systems6.js';
import './front6.js';
import * as Flight from './flight2.js';
import './board6.js';
import './more6.js';
import './drones6.js';
import './heal7.js';

UI.init();
window.__G = { S, Game, Cb, UI, Sea, world, Rep, Social, X, Vale6, Raid, P8, Ship, Flight }; // a handle for testing from the console
generateWorld(7, 'moon');         // a backdrop for the title screen
UI.showTitle();
document.getElementById('load').remove();

// ---------- light through the day ----------
const C = c => new THREE.Color(c);
const DAY = { top: C('#3a5a8a'), mid: C('#9ab6d8'), hor: C('#e8cfa8'), sun: C('#fff0d8'), si: 2.8, hemi: 1.7, fog: C('#d8c8a8') };
const DUSK = { top: C('#2a3558'), mid: C('#b8789a'), hor: C('#d9a37a'), sun: C('#ffd6a8'), si: 2.5, hemi: 1.55, fog: C('#d0a07c') };
const NIGHT = { top: C('#0d1430'), mid: C('#223058'), hor: C('#3a4468'), sun: C('#a8b8e8'), si: 1.1, hemi: 1.0, fog: C('#2c3454') };
const mixP = (a, b, k) => ({ top: a.top.clone().lerp(b.top, k), mid: a.mid.clone().lerp(b.mid, k), hor: a.hor.clone().lerp(b.hor, k), sun: a.sun.clone().lerp(b.sun, k), si: a.si + (b.si - a.si) * k, hemi: a.hemi + (b.hemi - a.hemi) * k, fog: a.fog.clone().lerp(b.fog, k) });
function dayNight(time) {
  const ph = ((time / 1440) + .3) % 1;   // a 24-minute day
  const p = ph < .15 ? mixP(DUSK, DAY, ph / .15) : ph < .5 ? DAY : ph < .62 ? mixP(DAY, DUSK, (ph - .5) / .12) : ph < .7 ? mixP(DUSK, NIGHT, (ph - .62) / .08) : ph < .92 ? NIGHT : mixP(NIGHT, DUSK, (ph - .92) / .08);
  R.skyMat.uniforms.top.value.copy(p.top); R.skyMat.uniforms.mid.value.copy(p.mid); R.skyMat.uniforms.hor.value.copy(p.hor);
  R.sun.color.copy(p.sun); R.sun.intensity = p.si; R.hemi.intensity = p.hemi; R.scene.fog.color.copy(p.fog);
}
// the ossuary is gloomy whatever the hour
function ruinGloom(h) {
  R.scene.fog.far = world.underwater ? 110 : 250; R.scene.fog.near = world.underwater ? 20 : 45;
  if (world.underwater) { R.scene.fog.color.set('#163c5a'); R.sun.intensity *= .45; R.hemi.intensity *= .8; R.sun.color.lerp(C('#6ab8e8'), .6); return; }
  if (world.cave) { R.scene.fog.far = 75; R.scene.fog.near = 10; R.scene.fog.color.set(world.cave.fog); R.sun.intensity = 2.2 * world.cave.light; R.hemi.intensity = 1.1 * world.cave.light; R.sun.color.set('#ffd8a8');
    R.skyMat.uniforms.top.value.set(world.cave.fog); R.skyMat.uniforms.mid.value.set(world.cave.fog); R.skyMat.uniforms.hor.value.set(world.cave.fog); return; }
  if (!world.ruin || world.zone !== 'vale') return;
  const d = Math.hypot(h.x - world.ruin.x, h.z - world.ruin.z); const k = clamp(1 - (d - world.ruin.R) / 30, 0, 1); if (k > 0) { R.scene.fog.color.lerp(C('#3a3646'), k * .7); R.sun.intensity *= 1 - k * .45; } }

// ---------- the hero ----------
let follow = null;
function moveHero(dt, inp) {
  const h = S.hero; if (!h || h.dead) { if (h) h.moving = 0; return; }
  const fx = Math.sin(S.camYaw), fz = Math.cos(S.camYaw), rx = -Math.cos(S.camYaw), rz = Math.sin(S.camYaw);
  let vx = fx * -inp.mz + rx * inp.mx, vz = fz * -inp.mz + rz * inp.mx;
  const l = Math.hypot(vx, vz);
  if (h.onBoat === 'row') { Sea.steerBoat(vx, vz, l, dt); return; }
  if (h.onBoat) { h.moving = 0; return; }
  if (l > .12 && Sea.sea.fish) Sea.stopFish('You stop fishing.');
  if (l > .12 && !Cb.rooted(h) && !Cb.ccd(h)) {
    vx /= Math.max(1, l); vz /= Math.max(1, l);
    if (h.casting && h.casting.t > .05) Cb.interruptCast(h); else if (h.casting) h.casting = null;
    h.sit = false;
    const sp = h.spd * Cb.spdOf(h) * Math.min(1, l * 1.2) * (S.ui.walkBack && inp.mz > .5 ? .6 : 1);
    h.x += vx * sp * dt; h.z += vz * sp * dt; collide(h, h.r);
    h.yaw += wrapA(Math.atan2(vx, vz) - h.yaw) * Math.min(1, dt * 12);
    h.moving = Math.min(1, h.moving + dt * 8);
    // the camera drifts back behind you when you run forward
    if (S.time - UI.input.lastDragT > 1.2 && inp.mz < -.4) S.camYaw += wrapA(h.yaw - S.camYaw) * Math.min(1, dt * 1.6);
  } else if (!h.casting && !Cb.rooted(h) && !Cb.ccd(h) && (follow = Game.autoFollowPoint()) && Math.hypot(follow.x - h.x, follow.z - h.z) > .05) {
    const dx = follow.x - h.x, dz = follow.z - h.z, d = Math.hypot(dx, dz), sp = Math.min(h.spd * Cb.spdOf(h), d / dt);
    h.sit = false;
    h.x += dx / d * sp * dt; h.z += dz / d * sp * dt; collide(h, h.r);
    h.yaw += wrapA(Math.atan2(dx, dz) - h.yaw) * Math.min(1, dt * 10);
    h.moving = Math.min(1, h.moving + dt * 8);
    if (S.time - UI.input.lastDragT > 2) S.camYaw += wrapA(h.yaw - S.camYaw) * Math.min(1, dt * .5);
  } else {
    h.moving = Math.max(0, h.moving - dt * 8);
    const t = S.target;
    if (t && !t.dead && Cb.isEnemy(h, t) && (h.autoOn || h.casting)) h.yaw += wrapA(Math.atan2(t.x - h.x, t.z - h.z) - h.yaw) * Math.min(1, dt * 10);
    else if (h.casting?.tgt && h.casting.tgt !== h) h.yaw += wrapA(Math.atan2(h.casting.tgt.x - h.x, h.casting.tgt.z - h.z) - h.yaw) * Math.min(1, dt * 10);
  }
}
let lastHp = 0, camK = 1;
function camera(dt) {
  const h = S.hero;
  const fx = Math.sin(S.camYaw), fz = Math.cos(S.camYaw), rx = -Math.cos(S.camYaw), rz = Math.sin(S.camYaw);
  const dd = S.camDist, cp = Math.cos(S.camPitch), sp = Math.sin(S.camPitch), sh = .55;
  const tx = h.x + rx * sh, ty = h.y + 1.7, tz = h.z + rz * sh;
  // pull the camera in when a wall is between it and you
  const k0 = wallHit(tx, tz, tx - fx * dd * cp, tz - fz * dd * cp);
  camK += (k0 - camK) * Math.min(1, dt * (k0 < camK ? 14 : 3));
  // walls here are low: rise over them rather than pressing into your back
  const de = Math.max(Math.min(dd, 5), dd * camK);
  let cx = tx - fx * de * cp, cy = ty + de * sp + (1 - camK) * 4.5, cz = tz - fz * de * cp;
  cy = Math.max(cy, hgt(cx, cz) + .6, world.water !== null ? world.water + .4 : -99);
  // a gentle shake when you're hit hard
  if (h.hp < lastHp - h.maxHp * .08) { S.shake = .25; UI.hurtFlash(); }
  lastHp = h.hp;
  const k = S.shake || 0; S.shake = Math.max(0, k - dt);
  R.cam.position.set(cx + rnd(-k, k) * .3, cy + rnd(-k, k) * .3, cz);
  R.cam.lookAt(tx + fx * 2, ty + .2 - S.camPitch * .8, tz + fz * 2);
}

// ---------- story scenes ----------
const scFrom = new THREE.Vector3(), scLook = new THREE.Vector3(), scLookNow = new THREE.Vector3();
let scKey = '';
function sceneCam(dt) {
  const sc = S.scene, sh = sc.shots[sc.i], sp = sh && world.spots[sh.spot];
  if (!sp) { Game.endScene(); return; }
  const by = hgt(sp.x, sp.z);
  scFrom.set(sp.x + sh.from[0], by + sh.from[1], sp.z + sh.from[2]); scLook.set(sp.x + sh.look[0], by + sh.look[1], sp.z + sh.look[2]);
  const key = sc.id + sc.i, cut = scKey === '' || Math.abs(R.cam.position.distanceTo(scFrom)) > 60;
  if (key !== scKey && cut) { R.cam.position.copy(scFrom); scLookNow.copy(scLook); }
  scKey = key;
  const k = Math.min(1, dt * 1.6);
  R.cam.position.lerp(scFrom, k); scLookNow.lerp(scLook, k);
  R.cam.lookAt(scLookNow);
}
// ---------- drawing ----------
const o3 = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
let drawDt = 1 / 60;
function draw() {
  for (const k in R.kinds) R.kinds[k].n = 0;
  let ns = 0, na = 0;
  const camP = R.cam.position;
  for (const e of S.ents) {
    if (e.remove) continue;
    // druids in animal form wear the animal
    const kk = e.buffs.length && e.cls === 'druid' ? (e.buffs.some(b => b.id === 'bear') ? 'bear' : e.buffs.some(b => b.id === 'cat') ? 'wolf' : e.kind) : e.kind;
    const K = R.kinds[kk]; if (!K || K.n >= 160) continue;
    const ddx = e.x - camP.x, ddz = e.z - camP.z;
    if (ddx * ddx + ddz * ddz > 150 * 150) continue;
    let y = e.y, rotX = 0;
    if (e.mob) { const M = MOBS[e.mob]; if (M.fly && !e.dead) y += M.fly + Math.sin(R.uTime.value * 3 + e.id) * .15; }
    if (e.dead && !e.corpse) { const f = Math.min(1, (S.time - e.deadT) * 3); rotX = -Math.PI / 2 * f; y += .2 * f; }
    if (e.isHero || e.rx === undefined || Math.abs(e.x - e.rx) + Math.abs(e.z - e.rz) > 4) { e.rx = e.x; e.rz = e.z; e.ryaw = e.yaw; }
    else { const k = Math.min(1, drawDt * 14); e.rx += (e.x - e.rx) * k; e.rz += (e.z - e.rz) * k; e.ryaw += wrapA(e.yaw - e.ryaw) * Math.min(1, drawDt * 12); }
    o3.position.set(e.rx, y, e.rz); o3.rotation.set(rotX, e.ryaw, 0, 'YXZ'); o3.scale.setScalar(e.scale || 1); o3.updateMatrix();
    const i = K.n++;
    K.mesh.setMatrixAt(i, o3.matrix);
    const a = e.anim; K.anim.setXYZW(i, a.ph, e.dead ? 0 : a.mv, a.atk, a.flash);
    if (ns < 400 && !e.dead) { o3.position.set(e.x, e.y + .05, e.z); o3.rotation.set(0, 0, 0); o3.scale.setScalar(1.3 * (e.scale || 1)); o3.updateMatrix(); R.shadows.setMatrixAt(ns++, o3.matrix); }
  }
  for (const k in R.kinds) { const K = R.kinds[k]; K.mesh.count = K.ol.count = K.n; if (K.n) { K.mesh.instanceMatrix.needsUpdate = true; K.anim.needsUpdate = true; } }
  R.shadows.count = ns; R.shadows.instanceMatrix.needsUpdate = true;
  for (const p of Cb.projectiles) if (p.kind === 'arrow' && na < 200 && p.dx !== undefined) {
    o3.position.set(p.x, p.y, p.z); tmpV.set(p.dx, p.dy, p.dz); tmpQ.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tmpV); o3.quaternion.copy(tmpQ); o3.scale.setScalar(1); o3.updateMatrix(); R.arrows.setMatrixAt(na++, o3.matrix); o3.rotation.set(0, 0, 0);
  }
  R.arrows.count = na; R.arrows.instanceMatrix.needsUpdate = true;
  // the target ring, and boss telegraphs on the ground
  const t = S.target;
  if (t && !t.remove) { R.selRing.visible = true; R.selRing.position.set(t.rx ?? t.x, hgt(t.x, t.z) + .07, t.rz ?? t.z); R.selRing.scale.setScalar(Math.max(.9, (t.r || .5) * 2.2)); R.selRing.material.color.set(Cb.isEnemy(S.hero, t) ? '#ff4a3a' : t.team === 'npc' ? '#ffd34d' : '#5fd35a'); }
  else R.selRing.visible = false;
  R.clearTelegraphs();
  for (const g of S.dangers) {
    const m = R.telegraph(g.kind, g.x, hgt(g.x, g.z), g.z, g.r, g.yaw || 0, g.w || .6, g.col || '#ff3a1a');
    m.material.opacity = g.tele ? .25 + .25 * Math.abs(Math.sin(R.uTime.value * 8)) : .4;
    if (g.pool && Math.random() < .3) R.magic.emit(g.x + rnd(-g.r, g.r) * .7, hgt(g.x, g.z) + .2, g.z + rnd(-g.r, g.r) * .7, 0, 1.2, 0, .8, .6, .5, 1, .2);
  }
}

// ---------- the loop ----------
let last = performance.now(), fN = 0, fT = last;
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now(), dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
  R.uTime.value = now / 1000;
  if (S.running && S.hero && S.scene) {
    // a story scene: the world holds still while the camera tells it
    sceneCam(dt); dayNight(S.time); ruinGloom(S.hero);
  } else if (S.running && S.hero && Flight.on()) {
    Flight.frame(dt, UI.pollInput());   // Build 2: at the helm, the ship's own world takes over
  } else if (S.running && S.hero) {
    scKey = '';
    const inp = UI.pollInput();
    moveHero(dt, inp);
    Game.tick(dt);
    camera(dt);
    dayNight(S.time); for (const f of X.light) f(dt); ruinGloom(S.hero);
    if (world.water !== null) updateWater(now / 1000);
  } else {
    const t = now / 1000;
    R.cam.position.set(Math.cos(t * .04) * 60, 22, Math.sin(t * .04) * 60); R.cam.lookAt(0, 6, 0);
    dayNight(t * 6);
  }
  drawDt = dt; if (!(S.running && Flight.on())) draw();
  R.magic.update(dt); R.dust.update(dt);
  R.renderer.render(R.scene, R.cam);
  UI.update(dt);
  fN++; if (now - fT > 500) { S.fps = Math.round(fN * 1000 / (now - fT)); fN = 0; fT = now; }
}
loop();
