// Renderer, scene, shared materials, animated instanced characters, particles, ground decals.
// Adapted from the Summoners engine: same cel shading, outlines and particle system.
import * as THREE from './three.js';
import { WH, rnd } from './core.js';
import * as M from './models.js';
import * as CM from './classmodels.js';
import * as CO from './coastmodels.js';
import * as VM from './valemodels.js';

export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
document.body.prepend(renderer.domElement);
export const scene = new THREE.Scene();
export const HORIZON = new THREE.Color('#d9b48a');
scene.fog = new THREE.Fog(HORIZON, 45, 250);
export const cam = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .2, 1200);
export const hemi = new THREE.HemisphereLight('#a9bcdc', '#4a3a2a', 1.6); scene.add(hemi);
export const sun = new THREE.DirectionalLight('#ffd6a8', 2.6); sun.position.set(-50, 45, -60); scene.add(sun);
export const fillL = new THREE.DirectionalLight('#7f9cd6', .7); fillL.position.set(40, 30, 50); scene.add(fillL);
export const uTime = { value: 0 };
export const worldGroup = new THREE.Group(); scene.add(worldGroup);

export const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#2a3558') }, mid: { value: new THREE.Color('#b8789a') }, hor: { value: HORIZON }, sunDir: { value: sun.position.clone().normalize() } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader: 'uniform vec3 top,mid,hor,sunDir;varying vec3 vP;void main(){float h=max(vP.y,0.);vec3 c=mix(hor,mid,smoothstep(0.,.18,h));c=mix(c,top,smoothstep(.15,.7,h));float s=max(dot(vP,sunDir),0.);c+=vec3(1.,.75,.45)*(pow(s,40.)*1.2+pow(s,6.)*.25);gl_FragColor=vec4(c,1.);}'
});
export const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 12), skyMat); scene.add(sky);

const ramp = new THREE.DataTexture(new Uint8Array([70, 150, 210, 255]), 4, 1, THREE.RedFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
export const toon = (o = {}) => new THREE.MeshToonMaterial({ gradientMap: ramp, ...o });

export function canvasTex(w, h, paint, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  t.anisotropy = 4; return t;
}
export const detailTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#e2e2e2'; g.fillRect(0, 0, w, h);
  const tones = ['#f0f0f0', '#cfcfcf', '#ffffff', '#c4c4c4', '#dadada', '#ebebeb'];
  for (let i = 0; i < 1500; i++) {
    const x = rnd(0, w), y = rnd(0, h), r = rnd(6, 34);
    for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
      const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      gr.addColorStop(0, tones[i % tones.length] + '66'); gr.addColorStop(1, tones[i % tones.length] + '00');
      g.fillStyle = gr; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  g.lineWidth = 1.4;
  for (let i = 0; i < 9000; i++) {
    const x = rnd(0, w), y = rnd(0, h), l = rnd(3, 8);
    g.strokeStyle = Math.random() < .5 ? 'rgba(90,90,90,.35)' : 'rgba(255,255,255,.4)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(-2, 2), y - l); g.stroke();
  }
}, 60);
export const grassTex = canvasTex(64, 64, (g) => {
  for (let i = 0; i < 26; i++) {
    const x = rnd(6, 58), lean = rnd(-10, 10), hb = rnd(30, 62), l = rnd(55, 85);
    g.strokeStyle = `hsl(0,0%,${l}%)`; g.lineWidth = rnd(2, 3.5); g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, 64); g.quadraticCurveTo(x + lean * .3, 64 - hb * .6, x + lean, 64 - hb); g.stroke();
  }
});
export const softTex = canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

// ---------- animated character material (per-instance walk phase, movement, attack, flash) ----------
const ANIM_HEAD = `
attribute float part; attribute vec3 pivot; attribute float glow; attribute vec4 aAnim;
uniform float uTime; uniform vec4 uAmp; uniform float uBob; uniform float uOutline;
varying float vGlow; varying float vFlash;
mat3 animR;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
void calcAnim(){
  float ph=aAnim.x, mv=clamp(aAnim.y,0.,1.), atk=sin(clamp(aAnim.z,0.,1.)*3.14159), sit=step(1.5,aAnim.y);
  int p=int(part+.5); animR=mat3(1.);
  if(p==1) animR=rX(sin(ph)*uAmp.x*mv - sit*1.4);
  else if(p==2) animR=rX(-sin(ph)*uAmp.x*mv - sit*1.4);
  else if(p==3) animR=rX(-sin(ph)*uAmp.y*mv - atk*uAmp.z*.25);
  else if(p==4) animR=rX(sin(ph)*uAmp.y*mv - atk*uAmp.z);
  else if(p==5) animR=rX(atk*uAmp.w + sin(ph*2.)*.06*mv);
  else if(p==6) animR=rY(sin(uTime*9.+ph)*.45);
  else if(p==8) animR=rZ(sin(uTime*26.+ph)*.7);
  else if(p==9) animR=rZ(-sin(uTime*26.+ph)*.7);
}`;
const ANIM_BODY = `
calcAnim();
vec3 transformed = animR*(position-pivot)+pivot;
if(int(part+.5)==7){ transformed.y = pivot.y + (position.y-pivot.y)*(1.+.45*sin(uTime*15.+aAnim.x*3.+position.x*25.)); }
transformed.y += abs(sin(aAnim.x))*uBob*min(aAnim.y,1.);
transformed.y -= step(1.5,aAnim.y)*.42;
transformed += normalize(animR*normal)*uOutline;
vGlow=glow; vFlash=aAnim.w;`;
export function animMat(base, amp, bob, outline) {
  base.onBeforeCompile = s => {
    Object.assign(s.uniforms, { uTime, uAmp: { value: new THREE.Vector4(...amp) }, uBob: { value: bob }, uOutline: { value: outline } });
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + ANIM_HEAD)
      .replace('#include <beginnormal_vertex>', 'calcAnim();\nvec3 objectNormal = animR*vec3(normal);')
      .replace('#include <begin_vertex>', ANIM_BODY);
    if (!outline) s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGlow; varying float vFlash;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.,.95,.85),vFlash*.85);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vGlow*.9;');
  };
  base.customProgramCacheKey = () => 'anim' + amp.join(',') + bob + outline;
  return base;
}
export const OUTLINE_COL = '#1a120c';
const MAXI = 160;
function makeKind(geo, amp, bob, thick) {
  geo.setAttribute('aAnim', new THREE.InstancedBufferAttribute(new Float32Array(MAXI * 4), 4).setUsage(THREE.DynamicDrawUsage));
  const mesh = new THREE.InstancedMesh(geo, animMat(toon({ vertexColors: true }), amp, bob, 0), MAXI);
  const ol = new THREE.InstancedMesh(geo, animMat(new THREE.MeshBasicMaterial({ color: OUTLINE_COL, side: THREE.BackSide }), amp, bob, thick), MAXI);
  ol.instanceMatrix = mesh.instanceMatrix;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (const m of [mesh, ol]) { m.frustumCulled = false; m.count = 0; scene.add(m); }
  return { mesh, ol, anim: geo.attributes.aAnim, n: 0 };
}
// every model an entity can wear. Entities store the key.
const HUM = [.6, .4, 1.6, .15];
const defs = {
  wolf: [M.wolfGeo(), [.75, 0, 0, .55], .07, .035],
  bear: [M.bearGeo(), [.55, 0, 0, .5], .08, .04],
  brute: [M.bruteGeo(), [.55, .45, 1.8, .2], .05, .035],
  shaman: [M.shamanGeo(), [.5, .4, 1.2, .2], .05, .03],
  troll: [M.trollGeo(), [.45, .4, 1.8, .2], .06, .04],
  skeleton: [M.skeletonGeo(), [.7, .55, 2.2, -.3], .05, .03],
  ghoul: [M.ghoulGeo(), [.8, .6, 1.8, .3], .07, .03],
  wraith: [M.wraithGeo(), [0, .5, 1.6, 0], 0, .03],
  abom: [M.abomGeo(), [.45, .35, 1.6, .2], .06, .04],
  wasp: [M.waspGeo(), [0, 0, 0, .3], 0, .025],
  bandit: [CM.banditGeo(1), HUM, .05, .03],
  bandit2: [CM.banditGeo(2, '#3a4a5a'), HUM, .05, .03],
  xbow: [M.crossbowGeo(), [.55, .1, .6, 0], .05, .03],
  guard: [M.knightGeo(), [.55, .4, 1.8, .15], .05, .035],
  priest: [M.priestGeo(), [.4, .3, .8, 0], .03, .03],
  corpse: [CM.corpseGeo(), [0, 0, 0, 0], 0, .03],
};
CM.BULWARK_PAL.forEach((p, i) => defs['bulwark' + i] = [CM.bulwarkGeo(p, i), [.55, .4, 1.9, .15], .05, .035]);
CM.CLERIC_PAL.forEach((p, i) => defs['cleric' + i] = [CM.clericGeo(p, i + 1), [.4, .35, 1.4, .1], .03, .03]);
CM.ARCHER_PAL.forEach((p, i) => defs['archer' + i] = [CM.archerGeo(p, i + 2), [.6, .35, 1.0, .1], .05, .03]);
CM.ELEM_PAL.forEach((p, i) => defs['elem' + i] = [CM.elemGeo(p, i + 3), [.4, .35, 1.5, .1], .03, .03]);
for (const cls in CM.NEW_CLASS_LOOKS) {
  const robe = CM.NEW_CLASS_LOOKS[cls][0].body === 'robe';
  for (let i = 0; i < 3; i++) defs[cls + i] = [CM.classGeo(cls, i), robe ? [.4, .35, 1.4, .1] : [.6, .4, 1.7, .15], robe ? .03 : .05, .03];
}
// pets: the Binder's four elementals and the Druid's treants
Object.assign(defs, {
  firepet: [M.fireGeo(), [.5, .45, 1.4, .2], .05, .03], waterpet: [M.waterGeo(), [.5, .45, 1.2, .2], .05, .03],
  golempet: [M.golemGeo(), [.45, .4, 1.6, .15], .05, .04], stormpet: [M.stormGeo(), [0, .5, 1.4, .2], 0, .03],
  treant: [M.treantGeo(), [.45, .35, 1.4, .2], .05, .04],
});
// the coast and the fleet
const HUM2 = [.6, .4, 1.7, .15];
Object.assign(defs, {
  pirate0: [CO.pirateGeo(0), HUM2, .05, .03], pirate1: [CO.pirateGeo(1), HUM2, .05, .03], pirate2: [CO.pirateGeo(2), HUM2, .05, .03],
  smuggler: [CO.smugglerGeo(), HUM2, .05, .03], captain: [CO.captainGeo(), HUM2, .05, .03], queen: [CO.queenGeo(), [.4, .35, 1.4, .1], .03, .03],
  drowned0: [CO.drownedGeo(0), [.6, .5, 1.7, .25], .05, .03], drowned1: [CO.drownedGeo(1), [.6, .45, 1.4, .2], .05, .03], drowned2: [CO.drownedGeo(2), [.4, .35, 1.2, .1], .03, .03],
  admiral: [CO.admiralGeo(), [.4, .35, 1.6, .15], .03, .035], merfolk: [CO.merfolkGeo(), [0, .45, 1.7, .2], .03, .03],
  crab: [CO.crabGeo(), [.9, 0, 1.2, 0], .03, .03], crabbig: [CO.crabGeo(true), [.9, 0, 1.2, 0], .03, .035], shark: [CO.sharkGeo(), [0, 0, 0, .3], 0, .03],
  leviathan: [CO.leviathanGeo(), [0, 0, 0, .2], 0, .05],
});
// Build 4: the Vale's new creatures, people and story props
const STILL = [0, 0, 0, 0];
Object.assign(defs, {
  boar: [VM.boarGeo(), [.8, 0, 0, .4], .06, .035], boarbig: [VM.boarGeo(true), [.8, 0, 0, .4], .06, .04], spider: [VM.spiderGeo(), [.9, 0, 0, 0], .03, .03],
  ghost: [VM.ghostGeo(), [0, .5, 1.4, 0], 0, .025], ghostnpc: [VM.ghostGeo('#e8e0c0'), [0, .3, 1.0, 0], 0, .025],
  harpy: [VM.harpyGeo(), [.5, 1.2, 1.2, .3], 0, .03], harpynamed: [VM.harpyGeo(true), [.5, 1.2, 1.2, .3], 0, .035],
  cultist0: [VM.cultistGeo(0), [.4, .35, 1.4, .1], .03, .03], cultist1: [VM.cultistGeo(1), [.4, .35, 1.4, .1], .03, .03], cultist2: [VM.cultistGeo(2), [.4, .35, 1.4, .1], .03, .035],
  villager0: [VM.villagerGeo(0), HUM, .05, .03], villager1: [VM.villagerGeo(1), [.4, .35, 1.4, .1], .03, .03], villager2: [VM.villagerGeo(2), HUM, .05, .03], villager3: [VM.villagerGeo(3), [.4, .35, 1.4, .1], .03, .03],
  wick: [VM.wickGeo(), HUM, .05, .03], hermit: [VM.hermitGeo(), [.4, .35, 1.2, .1], .03, .03], gravelord: [VM.gravelordGeo(), [.3, .3, 1.0, .1], .02, .035],
  opengrave: [VM.openGraveGeo(), STILL, 0, .03], headstone: [VM.headstoneGeo(true), STILL, 0, .03], lorebook: [VM.loreGeo(), STILL, 0, .03],
  bell: [VM.bellGeo(), STILL, 0, .03], wardstone: [VM.wardstoneGeo(), STILL, 0, .03], shrine: [VM.shrineGeo(), STILL, 0, .03],
});
export const kinds = {};
for (const k in defs) kinds[k] = makeKind(...defs[k]);
// later modules (dungeons, crafting) register their own models
export function addKinds(o) { for (const k in o) if (!kinds[k]) kinds[k] = makeKind(...o[k]); }

export const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: softTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), 400);
shadows.frustumCulled = false; shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shadows.count = 0; scene.add(shadows);
export const arrows = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, .05, .9), new THREE.MeshBasicMaterial({ color: '#3b2a1c' }), 200);
arrows.frustumCulled = false; arrows.instanceMatrix.setUsage(THREE.DynamicDrawUsage); arrows.count = 0; scene.add(arrows);

export function propOutline(thick) {
  const m = new THREE.MeshBasicMaterial({ color: OUTLINE_COL, side: THREE.BackSide });
  m.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\ntransformed += normalize(normal)*${thick.toFixed(3)};`); };
  m.customProgramCacheKey = () => 'pol' + thick; return m;
}
export function glowMat(o = {}) {
  const mat = toon({ vertexColors: true, ...o });
  mat.onBeforeCompile = s => {
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nattribute float glow;varying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow=glow;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vGlow*1.4;');
  };
  mat.customProgramCacheKey = () => 'glowmat';
  return mat;
}
export const propMat = glowMat();
export function addInstanced(geo, mat, list, thick, parent = worldGroup) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), o = new THREE.Object3D();
  m.count = list.length;
  list.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.set(t[4] || 0, t[3] || 0, t[5] || 0); o.scale.setScalar(t[6] || 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  parent.add(m);
  if (thick) { const ol = new THREE.InstancedMesh(geo, propOutline(thick), Math.max(1, list.length)); ol.count = list.length; ol.instanceMatrix = m.instanceMatrix; parent.add(ol); m.userData.ol = ol; }
  return m;
}
export function addChunked(geo, mat, list, thick, colors = null, CH = 70) {
  const buckets = new Map();
  list.forEach((t, i) => { const k = Math.floor((t[0] + WH) / CH) + ',' + Math.floor((t[2] + WH) / CH); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(i); });
  for (const idx of buckets.values()) {
    const m = addInstanced(geo, mat, idx.map(i => list[i]), thick);
    if (colors) { idx.forEach((i, n) => m.setColorAt(n, colors[i])); m.instanceColor.needsUpdate = true; }
    m.computeBoundingSphere(); if (m.userData.ol) m.userData.ol.boundingSphere = m.boundingSphere;
  }
}

// ---------- particles ----------
function makeParticles(n, additive) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), al = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('pcol', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('size', new THREE.BufferAttribute(sz, 1).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('pa', new THREE.BufferAttribute(al, 1).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 400 } }, transparent: true, depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: 'attribute float size;attribute vec3 pcol;attribute float pa;uniform float uScale;varying vec3 vC;varying float vA;void main(){vC=pcol;vA=pa;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/max(-mv.z,1.);gl_Position=projectionMatrix*mv;}',
    fragmentShader: additive ? 'varying vec3 vC;varying float vA;void main(){float a=smoothstep(.5,0.,length(gl_PointCoord-.5))*vA;gl_FragColor=vec4(vC*a,a);}'
      : 'varying vec3 vC;varying float vA;void main(){float a=smoothstep(.5,.1,length(gl_PointCoord-.5))*vA;gl_FragColor=vec4(vC,a);}'
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  const vel = new Float32Array(n * 3), life = new Float32Array(n), maxl = new Float32Array(n), s0 = new Float32Array(n), grav = new Float32Array(n);
  let head = 0;
  return {
    mat,
    emit(x, y, z, vx, vy, vz, l, s, r, g, b, gr = 0) {
      const i = head; head = (head + 1) % n;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      life[i] = maxl[i] = l; s0[i] = s; col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b; grav[i] = gr;
    },
    clear() { life.fill(0); },
    update(dt) {
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) { if (sz[i]) { sz[i] = 0; al[i] = 0; } continue; }
        life[i] -= dt; const k = Math.max(0, life[i] / maxl[i]);
        vel[i * 3 + 1] -= grav[i] * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
        sz[i] = s0[i] * (.4 + .6 * Math.sqrt(k)); al[i] = k < .8 ? k / .8 : (1 - k) * 5;
      }
      for (const a of ['position', 'pcol', 'size', 'pa']) geo.attributes[a].needsUpdate = true;
    }
  };
}
export const magic = makeParticles(5000, true), dust = makeParticles(1200, false);
export function burst(x, y, z, n, col, spd = 3, life = .7, size = .5, grav = 0) {
  for (let i = 0; i < n; i++) magic.emit(x, y, z, rnd(-spd, spd), rnd(0, spd * 1.2), rnd(-spd, spd), rnd(life * .6, life), rnd(size * .6, size), col[0], col[1], col[2], grav);
}

// ---------- ground decals: selection rings and boss telegraphs ----------
const ringGeo = new THREE.RingGeometry(.85, 1, 40).rotateX(-Math.PI / 2);
function decalMat(col, op) { return new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, side: THREE.DoubleSide }); }
export const selRing = new THREE.Mesh(ringGeo, decalMat('#ff4a3a', .85)); selRing.visible = false; scene.add(selRing);
export const tankRing = new THREE.Mesh(ringGeo, decalMat('#ffd34d', .5)); tankRing.visible = false; scene.add(tankRing);
const discGeo = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
const tele = [];
// a danger shape on the ground: kind 'circle' (radius r) or 'cone' (radius r, half-angle w)
export function telegraph(kind, x, y, z, r, yaw = 0, w = .6, col = '#ff3a1a') {
  let t = tele.find(t => !t.mesh.visible && t.kind === kind);
  if (!t) {
    const geo = kind === 'circle' ? discGeo : new THREE.CircleGeometry(1, 24, -w, 2 * w).rotateX(-Math.PI / 2).rotateY(Math.PI / 2);
    t = { kind, mesh: new THREE.Mesh(geo, decalMat(col, .35)), w }; scene.add(t.mesh); tele.push(t);
    if (kind === 'cone') t.geoW = w;
  }
  t.mesh.material.color.set(col); t.mesh.position.set(x, y + .06, z); t.mesh.scale.setScalar(r); t.mesh.rotation.y = yaw; t.mesh.visible = true;
  return t.mesh;
}
export function clearTelegraphs() { for (const t of tele) t.mesh.visible = false; }

export function resize() {
  renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  const sc = renderer.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
  magic.mat.uniforms.uScale.value = dust.mat.uniforms.uScale.value = sc;
}
addEventListener('resize', resize); resize();
