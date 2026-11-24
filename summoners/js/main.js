// Boot and the frame loop.
import * as THREE from './three.js';
import { S, rnd } from './core.js';
import * as R from './render.js';
import * as M from './models.js';
import * as Game from './game.js';
import * as Un from './units.js';
import * as UI from './ui.js';
import { hgt } from './world.js';

Game.loadMeta(); UI.init();
window.__G = { S, Game, Un }; // handle for testing from the console
// one model per summoner; the active one follows the hero
const heroes = {};
for (const cls of ['elem', 'druid', 'necro']) { const g = M.heroGeoFor(cls), grp = new THREE.Group(); grp.add(new THREE.Mesh(g, R.propMat), new THREE.Mesh(g, R.propOutline(.04))); grp.visible = false; R.scene.add(grp); heroes[cls] = grp; }
let hero = heroes.elem;
const HERO_COL = { elem: [1, .45, .12, '#ff8a3a'], druid: [1, .78, .3, '#ffc060'], necro: [.55, 1, .35, '#8dff5a'] };
const orbs = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), R.toon({ color: '#ffb347', emissive: '#ff6a12', emissiveIntensity: 2.5 })); m.visible = false; R.scene.add(m); return m; });
const light = new THREE.PointLight('#ff8a3a', 22, 14, 1.6); R.scene.add(light);
const staff = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
// a small chevron on the ground shows which way you face (and so where spells fly)
const chev = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 1.1), new THREE.Vector2(.55, .3), new THREE.Vector2(0, .55), new THREE.Vector2(-.55, .3)])).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: .75, depthWrite: false, side: THREE.DoubleSide }));
chev.visible = false; R.scene.add(chev);
R.writeCorr(); UI.showTitle();
document.getElementById('load').remove();

// day and night: an 8-minute cycle, visual for now
const C = c => new THREE.Color(c);
const DAY = { top: C('#3a5a8a'), mid: C('#9ab6d8'), hor: C('#e8cfa8'), sun: C('#fff0d8'), si: 2.8, hemi: 1.7, fog: C('#d8c4a4') };
const DUSK = { top: C('#2a3558'), mid: C('#b8789a'), hor: C('#d9a37a'), sun: C('#ffd6a8'), si: 2.6, hemi: 1.6, fog: C('#d9a37a') };
const NIGHT = { top: C('#070b18'), mid: C('#18223e'), hor: C('#2a3150'), sun: C('#8aa0d8'), si: .7, hemi: .65, fog: C('#1c2238') };
const mixP = (a, b, k) => ({ top: a.top.clone().lerp(b.top, k), mid: a.mid.clone().lerp(b.mid, k), hor: a.hor.clone().lerp(b.hor, k), sun: a.sun.clone().lerp(b.sun, k), si: a.si + (b.si - a.si) * k, hemi: a.hemi + (b.hemi - a.hemi) * k, fog: a.fog.clone().lerp(b.fog, k) });
function dayNight(time) {
  const ph = ((time / 480) + .3) % 1;   // 0 dawn, .25 noon, .5 dusk, .75 midnight
  const p = ph < .2 ? mixP(DUSK, DAY, ph / .2) : ph < .4 ? DAY : ph < .55 ? mixP(DAY, DUSK, (ph - .4) / .15) : ph < .65 ? mixP(DUSK, NIGHT, (ph - .55) / .1) : ph < .9 ? NIGHT : mixP(NIGHT, DUSK, (ph - .9) / .1);
  R.skyMat.uniforms.top.value.copy(p.top); R.skyMat.uniforms.mid.value.copy(p.mid); R.skyMat.uniforms.hor.value.copy(p.hor);
  R.sun.color.copy(p.sun); R.sun.intensity = p.si; R.hemi.intensity = p.hemi; R.scene.fog.color.copy(p.fog);
  S.night = ph > .58 && ph < .92;
}
let last = performance.now(), fN = 0, fT = last, camX = 0, camZ = 0, lastHero = null;
function loop() {
  requestAnimationFrame(loop);
  const now = performance.now(), dt = Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
  R.uTime.value = now / 1000;
  const inp = UI.pollInput();
  const live = S.running && !S.paused && !S.over;
  if (live) {
    Game.tick(dt); Game.updateHero(dt, inp.ix, inp.iz);
    Un.step(dt); Un.updateProjectiles(dt);
    Game.updateCities(dt); Game.updateCamps(dt); Game.updateBosses(dt); Game.updateLoot(dt); Game.updateZones(dt); Game.updateRaids(dt); Game.updateEscalation(dt); Game.updateEconomy(dt);
    S.frame++;
    if (S.frame % 3 === 0) R.writeCorr();
  }
  const t = now / 1000;
  if (S.hero) {
    const h = S.hero;
    if (h !== lastHero) { lastHero = h; camX = h.x; camZ = h.z; R.writeCorr(true); for (const k in heroes) heroes[k].visible = false; hero = heroes[S.cls] || heroes.elem; light.color.set(HERO_COL[S.cls][3]); }
    hero.visible = !S.over;
    if (h.swing > 0) h.swing = Math.max(0, h.swing - dt * 4);
    hero.position.set(h.x, h.y + Math.abs(Math.sin(t * 7)) * .08 * h.moving, h.z); hero.rotation.y = h.yaw; hero.rotation.z = Math.sin(t * 7) * .04 * h.moving; hero.rotation.x = (h.swing || 0) * .35;
    { const want = S.buffs.shape > 0 ? 1.45 : 1; hero.scale.setScalar(hero.scale.x + (want - hero.scale.x) * Math.min(1, dt * 6)); }
    staff.set(.55, 2.75, .2).applyAxisAngle(up, h.yaw).add(hero.position);
    light.position.set(staff.x, staff.y + .5, staff.z);
    chev.visible = !S.over; chev.position.set(h.x + Math.sin(h.yaw) * 1.3, hgt(h.x + Math.sin(h.yaw) * 1.3, h.z + Math.cos(h.yaw) * 1.3) + .15, h.z + Math.cos(h.yaw) * 1.3); chev.rotation.y = h.yaw + Math.PI;
    orbs.forEach((o, k) => { const a = t * 2.2 + k * Math.PI; o.visible = !S.over && S.cls === 'elem'; o.position.set(h.x + Math.cos(a) * 1.1, h.y + 1.6 + Math.sin(t * 3 + k) * .2, h.z + Math.sin(a) * 1.1); if (o.visible && live && Math.random() < .4) R.magic.emit(o.position.x, o.position.y, o.position.z, 0, .8, 0, .5, .45, 1, .5, .1); });
    if (live && Math.random() < .6) R.magic.emit(staff.x + rnd(-.1, .1), staff.y, staff.z + rnd(-.1, .1), rnd(-.3, .3), rnd(.8, 1.8), rnd(-.3, .3), rnd(.5, .9), rnd(.4, .8), ...HERO_COL[S.cls].slice(0, 3));
    camX += (h.x - camX) * Math.min(1, dt * 4); camZ += (h.z - camZ) * Math.min(1, dt * 4);
    const sh = S.shake || 0; S.shake = Math.max(0, sh - dt * 1.5);
    const cy = hgt(camX, camZ), z = S.zoom || 1;
    let camY = cy + 14 * z + 2; // lift the camera so no hill sits between it and the summoner
    for (const f of [.1, .2, .3, .45, .6, .8, 1]) { const g = hgt(camX, camZ + 19 * z * f) + .6; camY = Math.max(camY, cy + (g - cy) / f); }
    R.cam.position.set(camX + (Math.random() - .5) * sh, camY + (Math.random() - .5) * sh, camZ + 19 * z);
    R.cam.lookAt(camX, cy + 1.5, camZ - 3);
  } else {
    R.cam.position.set(Math.cos(t * .05) * 80, 25, Math.sin(t * .05) * 80); R.cam.lookAt(0, 10, 0);
  }
  dayNight(S.running ? S.time : t * 20);
  Un.draw();
  const pdt = S.paused && !S.over ? 0 : dt;
  R.magic.update(pdt); R.dust.update(pdt);
  R.renderer.render(R.scene, R.cam);
  UI.update(dt);
  fN++; if (now - fT > 500) { S.fps = Math.round(fN * 1000 / (now - fT)); fN = 0; fT = now; }
}
loop();
