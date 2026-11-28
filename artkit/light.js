// Art layer, part 1: lighting. Sun shadows that follow the camera, a sky with a sun, moon, stars and clouds,
// and a post-process pass (soft glow on bright things, filmic tone mapping, a colour grade per zone).
// It wraps renderer.render, so the game's own files are not touched. Turning the art off restores every value.
export function initLight(G) {
  const { THREE, R, S, world, theme } = G;
  const r = R.renderer, gl = r.getContext();
  const origRender = r.render.bind(r);
  let canPost = r.capabilities.isWebGL2 && !!(gl.getExtension('EXT_color_buffer_half_float') || gl.getExtension('EXT_color_buffer_float'));
  const V = () => new THREE.Vector3(), clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const hooks = []; G.onFrame = f => hooks.push(f);
  let on = false, busy = false;

  // ---------- the sky ----------
  const sky0 = { frag: R.skyMat.fragmentShader };
  const SKY = `uniform vec3 top,mid,hor,sunDir,moonDir,sunCol,fogCol;uniform float uT,uNight,uOn,uCloud;varying vec3 vP;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=vn(p)*a;p=p*2.03+17.;a*=.5;}return s;}
void main(){
  vec3 d=normalize(vP);float h=max(d.y,0.);
  vec3 c=mix(hor,mid,smoothstep(0.,.2,h));c=mix(c,top,smoothstep(.12,.7,h));
  if(uOn>.5){
    float day=1.-uNight;
    // stars and the moon
    vec2 sp=d.xz/(abs(d.y)+.35)*46.;vec2 ci=floor(sp);vec2 sf=fract(sp)-.5;float sr=h21(ci);
    float st=step(.955,sr)*smoothstep(.16,.02,length(sf-(vec2(h21(ci+7.),h21(ci+13.))-.5)*.6));
    st*=.65+.35*sin(uT*2.+sr*90.);
    c+=vec3(.9,.95,1.)*st*uNight*smoothstep(.02,.25,d.y)*1.6;
    float m=dot(d,moonDir);float md=smoothstep(.9988,.9991,m);
    float mc=smoothstep(.9989,.9992,dot(d,normalize(moonDir+vec3(.018,.01,0.))));
    c+=vec3(.92,.95,1.)*(md*(1.-mc*.92)*2.2+pow(max(m,0.),300.)*.25)*uNight;
    // the sun: a hot disc the glow pass picks up, and a wide warm halo
    float s=max(dot(d,sunDir),0.);
    vec3 sun=sunCol*(smoothstep(.9993,.9996,s)*9.+pow(s,90.)*.55+pow(s,9.)*.16)*day;
    // clouds: two flat tones with crisp edges, to sit with the cel shading
    vec2 uv=d.xz/(d.y+.22);vec2 w=vec2(uT*.006,uT*.0025);
    float n=fbm(uv*1.25+w);float cov=smoothstep(1.-uCloud,1.-uCloud+.035,n)*smoothstep(.015,.16,d.y);
    float n2=fbm(uv*1.25+w+sunDir.xz*.09);float lit=smoothstep(-.02,.05,n-n2+.02);
    vec3 cl=mix(vec3(1.),sunCol,.55)*(.55+.5*day);vec3 cs=mix(mid,top,.45)*(.55+.35*day);
    vec3 cc=mix(cs,cl,lit);cc=mix(cc,cc+sunCol*.5,pow(s,6.)*day);
    c=mix(c+sun,cc+sun*.25,cov*.92);
    c=mix(fogCol,c,smoothstep(-.01,.085,d.y));
  }
  else if(uOn>1.5){
    // open space: a field of stars all the way round and two drifts of nebula
    vec3 q=d*38.;vec3 ci=floor(q);vec3 f=fract(q)-.5;float sr=h21(ci.xy+ci.z*17.);
    float st=step(.93,sr)*smoothstep(.2,.02,length(f-(vec3(h21(ci.yz+3.),h21(ci.zx+5.),h21(ci.xy+9.))-.5)*.5));
    c+=mix(vec3(.75,.85,1.),vec3(1.,.85,.7),h21(ci.xz+1.))*st*(.7+.3*sin(uT*1.7+sr*80.))*1.5;
    vec3 w=abs(d);w/=w.x+w.y+w.z;
    float n=fbm(d.yz*2.2+3.)*w.x+fbm(d.zx*2.2+11.)*w.y+fbm(d.xy*2.2+19.)*w.z;
    float n2=fbm(d.yz*3.1+31.)*w.x+fbm(d.zx*3.1+41.)*w.y+fbm(d.xy*3.1+53.)*w.z;
    c+=vec3(.32,.12,.5)*smoothstep(.5,.78,n)*.5+vec3(.05,.3,.38)*smoothstep(.52,.8,n2)*.45;
  }
  gl_FragColor=vec4(c,1.);}`;
  const skyU = R.skyMat.uniforms;
  Object.assign(skyU, { moonDir: { value: V().set(.4, .6, .5).normalize() }, sunCol: { value: new THREE.Color(1, .9, .7) }, fogCol: { value: new THREE.Color() }, uT: R.uTime, uNight: { value: 0 }, uOn: { value: 1 }, uCloud: { value: .5 } });

  // ---------- post-process targets and passes ----------
  const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsScene = new THREE.Scene();
  const fsQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null); fsQuad.frustumCulled = false; fsScene.add(fsQuad);
  const VS = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
  const mat = (fs, u, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
  // each step down halves the picture. The first keeps only what is bright enough to glow, and tucks the plain
  // brightness of the scene into the fourth channel, so the smallest picture ends up holding the scene's average light.
  const downM = mat(`uniform sampler2D t;uniform vec2 px;uniform float thr;varying vec2 vUv;
void main(){vec4 c=texture2D(t,vUv)*4.;c+=texture2D(t,vUv+px)+texture2D(t,vUv-px)+texture2D(t,vUv+vec2(px.x,-px.y))+texture2D(t,vUv+vec2(-px.x,px.y));c/=8.;
if(thr>0.){c.a=min(dot(c.rgb,vec3(.2126,.7152,.0722)),4.);float l=max(c.r,max(c.g,c.b));c.rgb*=smoothstep(thr-.35,thr+.45,l);c.rgb=min(c.rgb,vec3(6.));}gl_FragColor=c;}`, { t: { value: null }, px: { value: new THREE.Vector2() }, thr: { value: 0 } });
  // the eye: eases toward the scene's average light, weighted to the middle of the view
  const eyeM = mat(`uniform sampler2D t,p;uniform float k;varying vec2 vUv;
void main(){float l=texture2D(t,vec2(.5,.45)).a*.36+(texture2D(t,vec2(.3,.35)).a+texture2D(t,vec2(.7,.35)).a+texture2D(t,vec2(.3,.65)).a+texture2D(t,vec2(.7,.65)).a)*.16;
float o=texture2D(p,vec2(.5)).r;gl_FragColor=vec4(vec3(k>=1.?l:mix(o,l,k)),1.);}`, { t: { value: null }, p: { value: null }, k: { value: 1 } });
  const upM = mat(`uniform sampler2D t;uniform vec2 px;varying vec2 vUv;
void main(){vec3 c=texture2D(t,vUv+vec2(-px.x*2.,0.)).rgb+texture2D(t,vUv+vec2(px.x*2.,0.)).rgb+texture2D(t,vUv+vec2(0.,px.y*2.)).rgb+texture2D(t,vUv+vec2(0.,-px.y*2.)).rgb;
c+=(texture2D(t,vUv+px).rgb+texture2D(t,vUv-px).rgb+texture2D(t,vUv+vec2(px.x,-px.y)).rgb+texture2D(t,vUv+vec2(-px.x,px.y)).rgb)*2.;gl_FragColor=vec4(c/12.,1.);}`,
    { t: { value: null }, px: { value: new THREE.Vector2() } }, { blending: THREE.AdditiveBlending, transparent: true });
  const outU = { tS: { value: null }, tB: { value: null }, uExp: { value: 1 }, uBloom: { value: .5 }, uSat: { value: 1 }, uCon: { value: 1 }, tL: { value: null }, uKey: { value: .23 }, uAe: { value: new THREE.Vector2(.62, 1.7) }, uTint: { value: new THREE.Color(1, 1, 1) }, uLift: { value: new THREE.Color(0, 0, 0) }, uVig: { value: .0 } };
  const outM = mat(`uniform sampler2D tS,tB,tL;uniform float uExp,uBloom,uSat,uCon,uVig,uKey;uniform vec2 uAe;uniform vec3 uTint,uLift;varying vec2 vUv;
vec3 fit(vec3 v){vec3 a=v*(v+.0245786)-.000090537;vec3 b=v*(.983729*v+.432951)+.238081;return a/b;}
vec3 film(vec3 c){c*=1./.6;c=mat3(.59719,.076,.0284,.35458,.90834,.13383,.04823,.01566,.83777)*c;c=fit(c);c=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602)*c;return clamp(c,0.,1.);}
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
void main(){vec3 c=texture2D(tS,vUv).rgb+texture2D(tB,vUv).rgb*uBloom;float ae=clamp(pow(uKey/max(texture2D(tL,vec2(.5)).r,.02),.5),uAe.x,uAe.y);c*=uExp*ae*uTint;c=film(c);
float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,uSat);c=(c-.5)*uCon+.5;c+=uLift*(1.-l)*(1.-l);
vec2 q=vUv-.5;c*=1.-uVig*dot(q,q)*2.;
c=mix(c*12.92,1.055*pow(max(c,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),c));
c+=(h21(gl_FragCoord.xy)-.5)/255.;gl_FragColor=vec4(c,1.);}`, outU);
  let rt = null, mips = [], rtW = 0, rtH = 0, rtQ = '', eyeNew = true, rtNew = true;
  const eye = [0, 1].map(() => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }));
  function targets() {
    const sz = r.getDrawingBufferSize(new THREE.Vector2()), q = G.quality();
    if (rt && sz.x === rtW && sz.y === rtH && q === rtQ) return;
    if (rt) { rt.dispose(); mips.forEach(m => m.dispose()); }
    rtW = sz.x; rtH = sz.y; rtQ = q; eyeNew = true; rtNew = true;
    rt = new THREE.WebGLRenderTarget(rtW, rtH, { type: THREE.HalfFloatType, samples: q === 'high' ? 4 : 2, depthBuffer: true });
    mips = [];
    let w = rtW >> 1, h = rtH >> 1;
    for (let i = 0; i < 5 && w > 8 && h > 8; i++) { mips.push(new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false })); w >>= 1; h >>= 1; }
  }
  function pass(m, target) { fsQuad.material = m; r.setRenderTarget(target); origRender(fsScene, fsCam); }

  // ---------- the colour grade, eased between zones ----------
  const cur = { char: .3, fill: 1.25, exp: 1, bloom: .5, sat: 1, con: 1, tint: new THREE.Color(1, 1, 1), lift: new THREE.Color(0, 0, 0), cloud: .5, thr: 1.05 };
  const tmpC = new THREE.Color();
  function grade(dt, space) {
    const g = theme.grade(world, S, space), k = Math.min(1, dt * 1.5);
    for (const key of ['exp', 'bloom', 'sat', 'con', 'cloud', 'thr', 'fill', 'char']) cur[key] += ((g[key] ?? cur0[key]) - cur[key]) * k;
    cur.tint.lerp(tmpC.set(g.tint || '#ffffff'), k); cur.lift.lerp(tmpC.set(g.lift || '#000000'), k);
    outU.uExp.value = cur.exp; outU.uBloom.value = cur.bloom; outU.uSat.value = cur.sat; outU.uCon.value = cur.con; outU.uTint.value.copy(cur.tint); outU.uLift.value.copy(cur.lift);
    skyU.uCloud.value = cur.cloud;
  }
  const cur0 = { char: .3, fill: 1.25, exp: 1, bloom: .5, sat: 1.08, con: 1.04, cloud: .5, thr: 1.05 };

  // ---------- the sun: where it stands, and the shadow box that follows the camera ----------
  const fill0 = { p: R.fillL.position.clone(), i: R.fillL.intensity };
  const sun = R.sun, sun0 = { pos: sun.position.clone(), cast: sun.castShadow, blob: R.shadows.material.opacity };
  const sunDir = V().copy(sun.position).normalize(), sunStep = V().copy(sunDir), moonDir = V(), fwd = V(), ctr = V(), rgt = V(), upv = V(), UP = V().set(0, 1, 0);
  if (!sun.target.parent) R.scene.add(sun.target);
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .05; sun.shadow.camera.near = 1; sun.shadow.camera.far = 420;
  let shHalf = 0, shSize = 0, lastGround = null, kindN = 0;
  const dirAt = (az, el, out) => out.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  function sunWhere() {
    const now = R.uTime.value, time = S.running && S.hero ? S.time : now * 6, ph = ((time / 1440) + .3) % 1;
    const space = !!(G.space && G.space()), inside = space || !!(world.cave || world.underwater);
    let night = 0;
    if (inside) dirAt(-2.2, 1.15, sunDir);
    else {
      const u = ((ph + .05) % 1) / .7;        // 0 at sunrise, 1 at sunset
      if (u <= 1) dirAt(-2.5 + u * 3.6, Math.max(.2, Math.sin(Math.PI * u) * 1.02), sunDir);
      else { const v = (u - 1) / (1 / .7 - 1); dirAt(-.9 + v * 2.6, Math.max(.3, Math.sin(Math.PI * v) * .9), sunDir); }
      night = ph < .62 ? 0 : ph < .7 ? (ph - .62) / .08 : ph < .92 ? 1 : 1 - (ph - .92) / .08;
      if (u > 1) moonDir.copy(sunDir); else dirAt(.8, .7, moonDir);
    }
    // the light itself moves in small steps so shadow edges hold still between them
    if (sunStep.angleTo(sunDir) > .009) sunStep.copy(sunDir);
    skyU.sunDir.value.copy(sunDir); skyU.moonDir.value.copy(moonDir);
    skyU.uNight.value = night; skyU.uOn.value = space ? 2 : inside ? 0 : 1;
    skyU.sunCol.value.copy(sun.color).multiplyScalar(Math.min(1.25, sun.intensity / 2.4));
    skyU.fogCol.value.copy(R.scene.fog.color);
    return space ? 2 : inside ? 1 : 0;
  }
  function shadowBox() {
    const q = G.quality(), want = q === 'low' ? 0 : q === 'medium' ? 1024 : 2048;
    if (want !== shSize) {
      shSize = want; sun.castShadow = !!want; r.shadowMap.enabled = !!want; r.shadowMap.type = THREE.PCFSoftShadowMap;
      if (want) { sun.shadow.mapSize.set(want, want); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
      R.scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
      R.shadows.material.opacity = want ? sun0.blob * .45 : sun0.blob;
    }
    if (!want) { sun.position.copy(sunStep).multiplyScalar(90); return; }
    const cam = R.cam, gy = S.hero && S.running ? S.hero.y : 0;
    cam.getWorldDirection(fwd);
    const t = fwd.y < -.04 ? clamp((cam.position.y - gy) / -fwd.y, 14, 95) : 30;
    ctr.copy(cam.position).addScaledVector(fwd, t * .85); ctr.y = gy;
    const half = t < 26 ? 46 : t < 45 ? 66 : t < 70 ? 92 : 124;
    rgt.crossVectors(UP, sunStep).normalize(); upv.crossVectors(sunStep, rgt);
    const tex = 2 * half / shSize, cx = ctr.dot(rgt), cy = ctr.dot(upv);
    ctr.addScaledVector(rgt, Math.round(cx / tex) * tex - cx).addScaledVector(upv, Math.round(cy / tex) * tex - cy);
    sun.target.position.copy(ctr); sun.position.copy(ctr).addScaledVector(sunStep, 160); sun.target.updateMatrixWorld();
    if (half !== shHalf) { shHalf = half; const c = sun.shadow.camera; c.left = c.bottom = -half; c.right = c.top = half; c.updateProjectionMatrix(); }
  }
  // which meshes cast and catch shadows. Run when a zone is built and when new character models appear.
  const lit = m => m && (m.isMeshToonMaterial || m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial);
  function flag(o) {
    if (!o.isMesh || o.userData.artSh) return; o.userData.artSh = 1;
    const m = o.material;
    if (!lit(m)) return;
    o.receiveShadow = true;
    o.castShadow = o !== world.ground && !m.transparent;
  }
  function flagAll() {
    R.worldGroup.traverse(flag);
    for (const k in R.kinds) if (!R.kinds[k].artSh) kind(R.kinds[k], k);
  }
  // a character model: its shadow has to walk and swing the way the model does, so the depth pass borrows its animation
  // It also gets a little light of its own, in proportion to its colours, so a dark coat on bright snow
  // (or a hero seen from the shaded side) stays readable instead of going black.
  const uChar = { value: .3 };
  function kind(K, k) {
    K.artSh = 1; K.mesh.receiveShadow = true; K.mesh.castShadow = true; K.mesh.userData.artSh = 1;
    const src = K.mesh.material, a0 = src.userData.art0 || (src.userData.art0 = { obc: src.onBeforeCompile, key: src.customProgramCacheKey }), key = a0.key ? a0.key.call(src) : k;
    const dm = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    dm.onBeforeCompile = a0.obc; dm.customProgramCacheKey = () => 'artd' + key; K.mesh.customDepthMaterial = dm;
    src.onBeforeCompile = (sh, rr) => {
      a0.obc.call(src, sh, rr); sh.uniforms.uArtChar = uChar;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uArtChar;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*uArtChar;');
    };
    src.customProgramCacheKey = () => 'artc' + key; src.needsUpdate = true;
  }
  function unflag() {
    R.worldGroup.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = false; delete o.userData.artSh; } });
    for (const k in R.kinds) { const K = R.kinds[k], m = K.mesh.material, a0 = m.userData.art0; K.artSh = 0; K.mesh.castShadow = K.mesh.receiveShadow = false; if (a0) { m.onBeforeCompile = a0.obc; m.customProgramCacheKey = a0.key; m.needsUpdate = true; } }
  }

  // ---------- particles carry real light now, so the glow pass can pick them up ----------
  const magic0 = R.magic.mat.fragmentShader, dust0 = { v: R.dust.mat.vertexShader, f: R.dust.mat.fragmentShader };
  // drifting things (leaves, snow, ash) are small crisp flecks; puffs of dust stay soft
  const DUSTV = 'attribute float size;attribute vec3 pcol;attribute float pa;uniform float uScale;varying vec3 vC;varying float vA;varying float vS;void main(){vC=pcol;vA=pa;vS=size;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/max(-mv.z,1.);gl_Position=projectionMatrix*mv;}';
  const DUSTF = 'varying vec3 vC;varying float vA;varying float vS;void main(){vec2 q=gl_PointCoord-.5;float d=length(q);float a=vS<.3?smoothstep(.5,.4,abs(q.x)*1.6+abs(q.y))*min(1.,vA*1.6):smoothstep(.5,.1,d)*vA*.8;gl_FragColor=vec4(vC*vC,a);}';
  const MAGIC = 'varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=(smoothstep(.5,0.,d)+smoothstep(.18,0.,d)*.6)*vA;gl_FragColor=vec4(vC*vC*a*1.15,a);}';

  // ---------- one frame ----------
  let lastT = performance.now();
  function frame(scene, cam) {
    const now = performance.now(), dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    const where = sunWhere(), inside = where > 0, space = where === 2;
    const kn = Object.keys(R.kinds).length;
    if (world.ground !== lastGround || kn !== kindN) { lastGround = world.ground; kindN = kn; flagAll(); G.zoneChanged && G.zoneChanged(); }
    R.worldGroup.children.forEach(o => { if (!o.userData.artSh) o.traverse(flag); });
    shadowBox();
    for (const k in R.kinds) { const K = R.kinds[k]; if (!K.artSh) kind(K, k); K.mesh.castShadow = K.n > 0; }
    // a little less haze in the open, so distance reads as colour rather than as grey
    if (!inside) { const f = R.scene.fog; f.near = Math.max(f.near, 70); f.far = Math.max(f.far, 300); }
    uChar.value = (cur.char ?? .3) * clamp(R.hemi.intensity / 1.7, .35, 1.2);
    R.hemi.intensity *= cur.fill;
    // the second light rides behind the camera, so whatever you are looking at is never a black silhouette
    if (!space) { R.cam.getWorldDirection(fwd); R.fillL.position.set(-fwd.x, .55, -fwd.z).normalize().multiplyScalar(80); R.fillL.intensity = fill0.i * 1.35; }
    else { R.fillL.position.copy(fill0.p); R.fillL.intensity = fill0.i; }
    grade(dt, space);
    for (const f of hooks) f(dt, inside, space);
    const q = G.quality();
    if (!canPost || q === 'low') { r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = cur.exp; origRender(scene, cam); return; }
    r.toneMapping = THREE.NoToneMapping;
    targets();
    r.setRenderTarget(rt);
    // a device that cannot draw into this kind of target gets the simpler path instead of a black screen
    if (rtNew) { rtNew = false; if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) { canPost = false; console.info('art: glow pass not supported here, using the simple path'); r.setRenderTarget(null); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = cur.exp; origRender(scene, cam); return; } }
    origRender(scene, cam);
    const ac = r.autoClear;
    downM.uniforms.thr.value = cur.thr; let src = rt;
    for (let i = 0; i < mips.length; i++) { downM.uniforms.t.value = src.texture; downM.uniforms.px.value.set(.5 / src.width, .5 / src.height); pass(downM, mips[i]); src = mips[i]; downM.uniforms.thr.value = 0; }
    r.autoClear = false;
    for (let i = mips.length - 1; i > 0; i--) { upM.uniforms.t.value = mips[i].texture; upM.uniforms.px.value.set(.5 / mips[i].width, .5 / mips[i].height); pass(upM, mips[i - 1]); }
    r.autoClear = ac;
    eyeM.uniforms.t.value = mips[mips.length - 1].texture; eyeM.uniforms.p.value = eye[0].texture; eyeM.uniforms.k.value = eyeNew ? 1 : Math.min(1, dt * 1.4); eyeNew = false;
    pass(eyeM, eye[1]); eye.reverse();
    outU.tS.value = rt.texture; outU.tB.value = mips[0].texture; outU.tL.value = eye[0].texture;
    pass(outM, null);
  }
  r.render = (scene, cam) => {
    if (!on || busy || scene !== R.scene) return origRender(scene, cam);
    busy = true; try { frame(scene, cam); } catch (e) { console.warn('art: lighting stopped', e); setOn(false); origRender(scene, cam); } finally { busy = false; }
  };

  function setOn(v) {
    if (v === on) return; on = v;
    if (v) {
      R.skyMat.fragmentShader = SKY; R.skyMat.needsUpdate = true;
      R.magic.mat.fragmentShader = MAGIC; R.magic.mat.needsUpdate = true;
      R.dust.mat.vertexShader = DUSTV; R.dust.mat.fragmentShader = DUSTF; R.dust.mat.needsUpdate = true;
      shSize = -1; lastGround = null;
    } else {
      R.skyMat.fragmentShader = sky0.frag; R.skyMat.needsUpdate = true;
      R.magic.mat.fragmentShader = magic0; R.magic.mat.needsUpdate = true;
      R.dust.mat.vertexShader = dust0.v; R.dust.mat.fragmentShader = dust0.f; R.dust.mat.needsUpdate = true;
      R.fillL.position.copy(fill0.p); R.fillL.intensity = fill0.i;
      sun.castShadow = sun0.cast; r.shadowMap.enabled = false; sun.position.copy(sun0.pos); R.shadows.material.opacity = sun0.blob;
      r.toneMapping = THREE.NoToneMapping; r.setRenderTarget(null); unflag();
      R.scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); });
    }
  }
  const probe = new Uint16Array(4);
  return { setOn, origRender, sunDir: sunStep, cur, lum() { try { r.readRenderTargetPixels(eye[0], 0, 0, 1, 1, probe); return THREE.DataUtils.fromHalfFloat(probe[0]); } catch (e) { return -1; } } };
}
