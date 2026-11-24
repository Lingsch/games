// Renderer, scene, shared materials, the living-land layer, animated hordes, particles.
import * as THREE from './three.js';
import { WH, rnd } from './core.js';
import * as M from './models.js';

export const MAXU = 2600;
export const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
document.body.prepend(renderer.domElement);
export const scene = new THREE.Scene();
export const HORIZON = new THREE.Color('#d9a37a');
scene.fog = new THREE.Fog(HORIZON, 50, 185);
export const cam = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, .5, 1200);
export const hemi = new THREE.HemisphereLight('#a9bcdc', '#4a3a2a', 1.6); scene.add(hemi);
export const sun = new THREE.DirectionalLight('#ffd6a8', 2.6); sun.position.set(-50, 45, -60); scene.add(sun);
export const fillL = new THREE.DirectionalLight('#7f9cd6', .7); fillL.position.set(40, 30, 50); scene.add(fillL);
export const uTime = { value: 0 };
export const worldGroup = new THREE.Group(); scene.add(worldGroup);

// sky dome
export const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#2a3558') }, mid: { value: new THREE.Color('#b8789a') }, hor: { value: HORIZON }, sunDir: { value: sun.position.clone().normalize() } },
  vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader: 'uniform vec3 top,mid,hor,sunDir;varying vec3 vP;void main(){float h=max(vP.y,0.);vec3 c=mix(hor,mid,smoothstep(0.,.18,h));c=mix(c,top,smoothstep(.15,.7,h));float s=max(dot(vP,sunDir),0.);c+=vec3(1.,.75,.45)*(pow(s,40.)*1.2+pow(s,6.)*.25);gl_FragColor=vec4(c,1.);}'
});
scene.add(new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 12), skyMat));

const ramp = new THREE.DataTexture(new Uint8Array([70, 150, 210, 255]), 4, 1, THREE.RedFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
export const toon = (o = {}) => new THREE.MeshToonMaterial({ gradientMap: ramp, ...o });

// ---------- painted textures ----------
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
}, 34);
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

// ---------- living land: what your elementals leave behind ----------
// types: 1 scorch (fire) 2 frost (water) 3 stone (earth) 4 storm (air)
export const G = 640;
let landDirty = true;
export const TS = new Float32Array(G * G), TT = new Uint8Array(G * G), TN = new Uint8Array(G * G);
const cdata = new Uint8Array(G * G * 4);
for (let i = 0; i < G * G; i++) TN[i] = (Math.random() * 24) | 0;
const corr = new THREE.DataTexture(cdata, G, G, THREE.RGBAFormat);
corr.magFilter = corr.minFilter = THREE.LinearFilter; corr.colorSpace = THREE.SRGBColorSpace;
export const uCorr = { value: corr };
// types: 1 scorch 2 frost 3 stone 4 storm (elementalist) · 5 bloom (druid) · 6 blight (necromancer)
export const LAND = [[[38, 30, 30], [255, 110, 40]], [[150, 196, 222], [240, 252, 255]], [[112, 104, 96], [168, 156, 132]], [[92, 78, 140], [214, 196, 255]], [[52, 128, 56], [226, 214, 120]], [[84, 80, 98], [210, 204, 186]]];
export const cellT = (x, z) => Math.min(G - 1, Math.max(0, ((WH - z) / (2 * WH) * G) | 0)) * G + Math.min(G - 1, Math.max(0, ((x + WH) / (2 * WH) * G) | 0));
export function paint(c, type, amt) {
  landDirty = true;
  if (TT[c] === type) TS[c] = Math.min(1, TS[c] + amt);
  else { TS[c] -= amt * 1.4; if (TS[c] <= 0) { TT[c] = type; TS[c] = .02; } }
}
export function paintDisc(x, z, rad, type, amt) {
  const step = 2 * WH / G;
  for (let dz = -rad; dz <= rad; dz += step) for (let dx = -rad; dx <= rad; dx += step)
    if (dx * dx + dz * dz < rad * rad) paint(cellT(x + dx, z + dz), type, amt * (1 - Math.hypot(dx, dz) / rad * .5));
}
export function resetLand() { TS.fill(0); TT.fill(0); writeCorr(true); }
export function writeCorr(force) {
  if (!landDirty && !force) return; landDirty = false;
  for (let c = 0, o = 0; c < G * G; c++, o += 4) {
    const t = TT[c];
    if (!t) { cdata[o + 3] = 0; continue; }
    const col = LAND[t - 1][TN[c] > 21 && TS[c] > .6 ? 1 : 0], n = TN[c] * .6;
    cdata[o] = Math.max(0, col[0] - n); cdata[o + 1] = Math.max(0, col[1] - n); cdata[o + 2] = Math.max(0, col[2] - n);
    cdata[o + 3] = Math.min(255, TS[c] * 235);
  }
  corr.needsUpdate = true;
}
export const corrUV = p => `vCuv=vec2((${p}.x+${WH.toFixed(1)})/${(2 * WH).toFixed(1)},(${WH.toFixed(1)}-${p}.z)/${(2 * WH).toFixed(1)});`;

// ---------- animated horde material ----------
const ANIM_HEAD = `
attribute float part; attribute vec3 pivot; attribute float glow; attribute vec4 aAnim;
uniform float uTime; uniform vec4 uAmp; uniform float uBob; uniform float uOutline;
varying float vGlow; varying float vFlash;
mat3 animR;
mat3 rX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
mat3 rZ(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
void calcAnim(){
  float ph=aAnim.x, mv=aAnim.y, atk=sin(clamp(aAnim.z,0.,1.)*3.14159);
  int p=int(part+.5); animR=mat3(1.);
  if(p==1) animR=rX(sin(ph)*uAmp.x*mv);
  else if(p==2) animR=rX(-sin(ph)*uAmp.x*mv);
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
transformed.y += abs(sin(aAnim.x))*uBob*aAnim.y;
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
function makeHorde(geo, amp, bob, thick) {
  geo.setAttribute('aAnim', new THREE.InstancedBufferAttribute(new Float32Array(MAXU * 4), 4).setUsage(THREE.DynamicDrawUsage));
  const mesh = new THREE.InstancedMesh(geo, animMat(toon({ vertexColors: true }), amp, bob, 0), MAXU);
  const ol = new THREE.InstancedMesh(geo, animMat(new THREE.MeshBasicMaterial({ color: OUTLINE_COL, side: THREE.BackSide }), amp, bob, thick), MAXU);
  ol.instanceMatrix = mesh.instanceMatrix;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (const m of [mesh, ol]) { m.frustumCulled = false; m.count = 0; scene.add(m); }
  return { mesh, ol, anim: geo.attributes.aAnim };
}
// order matches unit kinds in units.js
export const hordes = [
  makeHorde(M.fireGeo(), [0, .45, 1.5, 0], 0, .03),
  makeHorde(M.waterGeo(), [0, .45, 1.2, 0], 0, .03),
  makeHorde(M.golemGeo(), [.45, .4, 1.6, .2], .06, .035),
  makeHorde(M.stormGeo(), [0, 0, 0, 0], 0, .025),
  makeHorde(M.bruteGeo(), [.55, .45, 1.8, .2], .05, .035),
  makeHorde(M.archerGeo(), [.6, .3, 1.0, 0], .05, .03),
  makeHorde(M.knightGeo(), [.55, .4, 1.8, .15], .05, .035),
  makeHorde(M.wolfGeo(), [.75, 0, 0, .55], .07, .035),
  makeHorde(M.bearGeo(), [.55, 0, 0, .5], .08, .04),
  makeHorde(M.treantGeo(), [.4, .35, 1.4, .1], .05, .04),
  makeHorde(M.waspGeo(), [0, 0, 0, .3], 0, .025),
  makeHorde(M.skeletonGeo(), [.7, .55, 2.2, -.3], .05, .03),
  makeHorde(M.ghoulGeo(), [.8, .6, 1.8, .3], .07, .03),
  makeHorde(M.abomGeo(), [.45, .35, 1.6, .2], .06, .04),
  makeHorde(M.wraithGeo(), [0, .5, 1.6, 0], 0, .03),
  makeHorde(M.pikemanGeo(), [.55, .3, 1.2, .1], .05, .03),
  makeHorde(M.cavalryGeo(), [.8, .3, 1.6, .3], .08, .035),
  makeHorde(M.priestGeo(), [.4, .3, .8, 0], .03, .03),
  makeHorde(M.crossbowGeo(), [.55, .1, .6, 0], .05, .03),
  makeHorde(M.shamanGeo(), [.5, .4, 1.2, .2], .05, .03),
  makeHorde(M.trollGeo(), [.45, .4, 1.8, .2], .06, .04),
  makeHorde(M.magmaGeo(), [0, .45, 1.3, 0], 0, .035),
  makeHorde(M.spiderGeo(), [.9, 0, 0, .2], .03, .03),
  makeHorde(M.skelMageGeo(), [.5, .5, 1.6, -.2], .04, .03)];
export const shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ map: softTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), MAXU);
shadows.frustumCulled = false; shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage); shadows.count = 0; scene.add(shadows);
export const arrows = new THREE.InstancedMesh(new THREE.BoxGeometry(.05, .05, .9), new THREE.MeshBasicMaterial({ color: '#3b2a1c' }), 600);
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
// a list of [x,y,z,ry,rx,rz,scale] becomes one instanced mesh (+ outline)
export function addInstanced(geo, mat, list, thick, parent = worldGroup) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), o = new THREE.Object3D();
  m.count = list.length;
  list.forEach((t, i) => { o.position.set(t[0], t[1], t[2]); o.rotation.set(t[4] || 0, t[3] || 0, t[5] || 0); o.scale.setScalar(t[6] || 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  parent.add(m);
  if (thick) { const ol = new THREE.InstancedMesh(geo, propOutline(thick), Math.max(1, list.length)); ol.count = list.length; ol.instanceMatrix = m.instanceMatrix; parent.add(ol); m.userData.ol = ol; }
  return m;
}

// same as addInstanced, split into map chunks so off-screen chunks are skipped
export function addChunked(geo, mat, list, thick, colors = null, CH = 90) {
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
export const magic = makeParticles(6000, true), dust = makeParticles(1500, false);
// soft glows: positions + colours written every frame
export const GLOWN = 3000;
export const glowGeo = new THREE.BufferGeometry();
glowGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(GLOWN * 3), 3).setUsage(THREE.DynamicDrawUsage));
glowGeo.setAttribute('pcol', new THREE.BufferAttribute(new Float32Array(GLOWN * 3), 3).setUsage(THREE.DynamicDrawUsage));
glowGeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array(GLOWN), 1).setUsage(THREE.DynamicDrawUsage));
glowGeo.setAttribute('pa', new THREE.BufferAttribute(new Float32Array(GLOWN).fill(1), 1));
const glowPts = new THREE.Points(glowGeo, magic.mat); glowPts.frustumCulled = false; scene.add(glowPts);

export function resize() {
  renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  const sc = renderer.domElement.height / (2 * Math.tan(cam.fov * Math.PI / 360));
  magic.mat.uniforms.uScale.value = dust.mat.uniforms.uScale.value = sc;
}
addEventListener('resize', resize); resize();
