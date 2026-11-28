// Art layer, part 2: combat feel and atmosphere. Everything here watches the game's state each frame
// (who was hit, who is casting, what is flying) and adds light and motion. It changes no rules and no numbers.
export function initFx(G) {
  const { THREE, R, S, world, hgt, Cb, fct, CLASSES, MOBS, theme } = G;
  const rnd = (a, b) => a + Math.random() * (b - a), TAU = Math.PI * 2;
  const SC = { fire: [1, .5, .15], frost: [.55, .88, 1], storm: [.8, .75, 1], earth: [.85, .65, .4], holy: [1, .92, .55], shadow: [.68, .4, 1], phys: [1, .97, .9], poison: [.55, 1, .4], nature: [.5, 1, .45], arcane: [.9, .6, 1], ...(theme.schools || {}) };
  let on = false;

  // ---------- two pools of glowing shapes: ones that face the camera, and ones that lie on the ground ----------
  const N = 120;
  function pool(ground) {
    const geo = new THREE.PlaneGeometry(1, 1); if (ground) geo.rotateX(-Math.PI / 2);
    const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; g.setAttribute('position', geo.attributes.position);
    const iPos = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const iPar = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4).setUsage(THREE.DynamicDrawUsage);
    const iCol = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', iPos); g.setAttribute('iPar', iPar); g.setAttribute('iCol', iCol); g.instanceCount = 0;
    const vs = ground
      ? `attribute vec3 iPos,iCol;attribute vec4 iPar;varying vec2 vU;varying vec4 vP;varying vec3 vC;
void main(){vU=position.xz*2.;vP=iPar;vC=iCol;vec3 p=iPos+vec3(position.x,0.,position.z)*iPar.x;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}`
      : `attribute vec3 iPos,iCol;attribute vec4 iPar;varying vec2 vU;varying vec4 vP;varying vec3 vC;
void main(){vU=position.xy*2.;vP=iPar;vC=iCol;vec4 mv=viewMatrix*vec4(iPos,1.);float c=cos(iPar.w),s=sin(iPar.w);mv.xy+=mat2(c,-s,s,c)*position.xy*iPar.x;gl_Position=projectionMatrix*mv;}`;
    const fs = ground
      ? `uniform float uT;varying vec2 vU;varying vec4 vP;varying vec3 vC;
float ln(float d,float w){return smoothstep(w,0.,abs(d));}
void main(){float r=length(vU),a=0.;int t=int(vP.z+.5);float an=atan(vU.y,vU.x);
if(t==0){float rr=mix(.12,.92,vP.w);a=ln(r-rr,.09)+ln(r-rr*.72,.05)*.5;a*=1.-vP.w;}
else if(t==1){float ro=an+uT*.9;a=ln(r-.9,.035)+ln(r-.62,.025);
  a+=step(.5,fract(ro*18./6.2832))*step(.72,r)*step(r,.86)*.8;
  float ro2=an-uT*.6;float seg=6.2832/3.;float d1=cos(floor(.5+ro2/seg)*seg-ro2)*r;float d2=cos(floor(.5+(ro2+3.1416)/seg)*seg-(ro2+3.1416))*r;
  a+=(ln(d1-.31,.022)+ln(d2-.31,.022))*step(r,.62);a+=smoothstep(.9,0.,r)*.12;}
else if(t==2){a=smoothstep(1.,0.,r);a*=a;}
else{float pu=.5+.5*sin(uT*5.);a=ln(r-.86,.05)+ln(r-.5-.2*vP.w,.03)*.7+smoothstep(.9,0.,r)*.18*pu;}
a*=vP.y*step(r,1.);gl_FragColor=vec4(vC*a,a);}`
      : `varying vec2 vU;varying vec4 vP;varying vec3 vC;
void main(){float r=length(vU),a=0.;int t=int(vP.z+.5);
if(t==0){a=smoothstep(1.,0.,r);a=a*a+smoothstep(.35,0.,r);}
else if(t==1){a=smoothstep(1.,.1,r)*min(1.,.012/(abs(vU.x*vU.y)+.012))+smoothstep(.3,0.,r);}
else if(t==2){float o=smoothstep(.96,.9,r);float i=smoothstep(.8,.88,length(vU-vec2(.3,0.)));a=o*i*smoothstep(1.,.2,abs(vU.y))*step(vU.x,.35);}
else if(t==3){a=smoothstep(.3,0.,abs(vU.x))*smoothstep(1.,.1,abs(vU.y))+smoothstep(.09,0.,abs(vU.x))*smoothstep(1.,.5,abs(vU.y));}
else{a=smoothstep(.1,0.,abs(r-.82));}
a*=vP.y;gl_FragColor=vec4(vC*a,a);}`;
    const m = new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { uT: R.uTime }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide, polygonOffset: ground, polygonOffsetFactor: -6 });
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.visible = false; mesh.renderOrder = 5; R.scene.add(mesh);
    let n = 0;
    return {
      mesh, begin() { n = 0; },
      put(x, y, z, size, alpha, type, w, c, k = 1) { if (n >= N) return; iPos.setXYZ(n, x, y, z); iPar.setXYZW(n, size, alpha, type, w); iCol.setXYZ(n, c[0] * k, c[1] * k, c[2] * k); n++; },
      end() { g.instanceCount = n; iPos.needsUpdate = iPar.needsUpdate = iCol.needsUpdate = true; }
    };
  }
  const bill = pool(false), gnd = pool(true);
  // short-lived effects. b: 1 billboard, 0 ground. s0→s1 size, life in seconds.
  const live = [];
  function fx(b, type, x, y, z, s0, s1, life, c, k = 1.6, rot = 0, follow = null) { if (live.length < 150) live.push({ b, type, x, y, z, s0, s1, life, t: 0, c, k, rot, follow, fx: follow ? x - follow.x : 0, fz: follow ? z - follow.z : 0 }); }
  const sparks = (x, y, z, n, c, spd = 3.5, life = .45, size = .28, grav = 9) => { for (let i = 0; i < n; i++) R.magic.emit(x, y, z, rnd(-spd, spd), rnd(-.2, spd * 1.1), rnd(-spd, spd), rnd(life * .5, life), rnd(size * .5, size), c[0], c[1], c[2], grav); };

  // ---------- the target ring: a turning, pulsing sigil in place of the flat band ----------
  const ring0 = { geo: R.selRing.geometry, mat: R.selRing.material, tgeo: R.tankRing.geometry, tmat: R.tankRing.material };
  function ringMat(col) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uT: R.uTime, col: { value: new THREE.Color(col) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -5, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vU;void main(){vU=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float uT;uniform vec3 col;varying vec2 vU;float ln(float d,float w){return smoothstep(w,0.,abs(d));}
void main(){float r=length(vU);float an=atan(vU.y,vU.x);float pu=.5+.5*sin(uT*4.);
float a=ln(r-.74,.035)*step(.22,fract((an+uT*.8)*4./6.2832))+ln(r-.84,.014)*.8;
float q=abs(fract((an-uT*.4)*4./6.2832)-.5);a+=step(q,.06)*step(.52,r)*step(r,.7)*(.6+.4*pu);
a+=smoothstep(.74,.2,r)*.07*(1.+pu);a*=step(r,1.);gl_FragColor=vec4(col*a*1.5,a);}`
    });
    m.color = m.uniforms.col.value; return m;
  }
  const ringGeo = new THREE.PlaneGeometry(2.7, 2.7).rotateX(-Math.PI / 2), selM = ringMat('#ff4a3a'), tankM = ringMat('#ffd34d');

  // ---------- what the layer remembers about each creature between frames ----------
  const mem = new WeakMap(), seen = new WeakSet();
  const M = e => { let m = mem.get(e); if (!m) { m = { fl: 0, atk: 0, dead: !!e.dead, lvl: e.lvl, step: 0 }; mem.set(e, m); } return m; };
  const castCol = e => { const ab = e.cls && CLASSES[e.cls] && CLASSES[e.cls].abilities[e.casting.key]; return !ab ? SC.arcane : ab.kind === 'heal' ? (SC[ab.school] || SC.nature) : SC[ab.school] || (ab.kind === 'buff' ? SC.holy : SC.arcane); };
  let ambT = 0, lootT = 0;

  function tick(dt, inside, space) {
    if (!on) return;
    const cam = R.cam.position, h = S.hero, playing = S.running && h && !space;
    bill.begin(); gnd.begin();
    if (space) { live.length = 0; bill.end(); gnd.end(); return; }
    if (playing && !S.scene) {
      for (const e of S.ents) {
        if (e.remove || !e.anim) continue;
        const dx = e.x - cam.x, dz = e.z - cam.z; if (dx * dx + dz * dz > 55 * 55) continue;
        const m = M(e), sc = e.scale || 1, a = e.anim, cy = e.y + 1.1 * sc;
        // struck: sparks and a flash where the blow landed
        if (a.flash > m.fl + .3 && !e.dead) { const c = e.mob ? [1, .92, .7] : [1, .6, .5]; sparks(e.x, cy, e.z, 7, c, 3.2 * Math.min(1.6, sc)); fx(1, 0, e.x, cy, e.z, .5 * sc, 1.5 * sc, .13, c, 1.3); }
        m.fl = a.flash;
        // a swing: a quick crescent in front of whoever threw it
        if (a.atk >= .9 && m.atk < .9 && !e.dead && !e.casting && !e.mcast) {
          const melee = e.mob ? !MOBS[e.mob]?.caster && !MOBS[e.mob]?.ranged : e.cls ? CLASSES[e.cls]?.melee : e.pet ? true : false;
          if (melee) { const f = .85 * sc + (e.r || .4); fx(1, 2, e.x + Math.sin(e.yaw) * f, cy, e.z + Math.cos(e.yaw) * f, 1.5 * sc, 2.1 * sc, .16, e.mob ? [1, .8, .68] : [.88, .95, 1], 1.2, rnd(-.9, .9) + (Math.random() < .5 ? Math.PI : 0)); }
        }
        m.atk = a.atk;
        // a spell being woven: a sigil underfoot and motes drawn in
        if (e.casting && !e.dead) {
          const c = castCol(e), k = Math.min(1, e.casting.t * 4);
          gnd.put(e.x, e.y + .1, e.z, 2.8 * sc, k, 1, 0, c, .7);
          if (Math.random() < .6) { const an = rnd(0, TAU), rr = 1.2 * sc; R.magic.emit(e.x + Math.cos(an) * rr, e.y + .15, e.z + Math.sin(an) * rr, -Math.cos(an) * 1.6, 2.2, -Math.sin(an) * 1.6, .6, .22, c[0], c[1], c[2]); }
        } else if (e.mcast && !e.dead) { const c = e.mcast.kind === 'heal' ? SC.nature : SC.shadow; gnd.put(e.x, e.y + .1, e.z, (2.4 + (e.r || .5) * 2) * 1, Math.min(1, e.mcast.t * 3), 1, 0, c, .8); }
        // fallen: a ring on the ground and the last of it drifting up
        if (e.dead && !m.dead && e.mob) {
          const und = MOBS[e.mob]?.undead, c = und ? [.5, 1, .4] : [.85, .8, 1];
          fx(0, 0, e.x, e.y + .1, e.z, 4.5 * sc, 4.5 * sc, .55, c, 1.2); fx(1, 0, e.x, cy, e.z, 1 * sc, 2.6 * sc, .22, c, 1.1);
          for (let i = 0; i < 12; i++) R.magic.emit(e.x + rnd(-.5, .5) * sc, e.y + rnd(.2, 1.4) * sc, e.z + rnd(-.5, .5) * sc, rnd(-.3, .3), rnd(.8, 2.2), rnd(-.3, .3), rnd(.7, 1.3), rnd(.2, .34), c[0], c[1], c[2]);
        }
        m.dead = !!e.dead;
        // a level gained: a pillar of light
        if (e.lvl > m.lvl && (e.isHero || e.inParty)) {
          const c = [1, .85, .4]; fx(1, 3, e.x, e.y + 5, e.z, 10, 12, 1.1, c, 1.6); fx(0, 0, e.x, e.y + .1, e.z, 7, 7, .9, c, 1.5); fx(0, 3, e.x, e.y + .1, e.z, 3.4, 3.4, 1.2, c, 1.3);
          sparks(e.x, e.y + .4, e.z, 40, c, 3, 1.2, .35, -2); if (e.isHero) S.shake = Math.max(S.shake || 0, .22);
        }
        m.lvl = e.lvl;
        // dust at running feet
        if ((e.isHero || e.inParty) && a.mv > .6 && !e.dead && !inside) { m.step += dt; if (m.step > .28) { m.step = 0; R.dust.emit(e.x - Math.sin(e.yaw) * .3, e.y + .08, e.z - Math.cos(e.yaw) * .3, rnd(-.3, .3), rnd(.3, .7), rnd(-.3, .3), .55, .5, .62, .56, .46); } }
      }
      // what the numbers say: critical hits get a glint and a jolt, heals a green ring
      for (const f of fct) {
        if (seen.has(f)) continue; seen.add(f);
        const e = f.e; if (!e) continue; const sc = e.scale || 1, cy = e.y + 1.2 * sc;
        if (/^\d+!$/.test(f.text)) { const mine = f.col !== '#ff6a5a'; fx(1, 1, e.x, cy, e.z, 1.5 * sc, 4 * sc, .22, mine ? [1, .9, .55] : [1, .5, .4], 1.7, rnd(0, 1.5)); sparks(e.x, cy, e.z, 10, [1, .85, .5], 4.5); if (mine) S.shake = Math.max(S.shake || 0, .1); }
        else if (f.text[0] === '+' && f.col === '#7dff7a') { fx(0, 3, e.x, e.y + .1, e.z, 2.6 * sc, 2.6 * sc, .7, SC.nature, 1.1, 0, e); for (let i = 0; i < 5; i++) R.magic.emit(e.x + rnd(-.5, .5), e.y + rnd(.2, 1), e.z + rnd(-.5, .5), 0, rnd(1, 1.8), 0, .8, .26, .5, 1, .45); }
        else if (f.text === 'Resurrected') { fx(1, 3, e.x, e.y + 4, e.z, 8, 9, 1, SC.holy, 1.5); fx(0, 0, e.x, e.y + .1, e.z, 5, 5, .8, SC.holy, 1.4); }
      }
      // bolts carry a bright head and shed sparks; arrows leave a thin streak
      for (const p of Cb.projectiles) {
        if (p.dx === undefined) continue;
        if (p.kind === 'bolt') { const c = SC[p.school] || SC.phys; bill.put(p.x, p.y, p.z, 1.5, 1, 0, 0, c, 1.6); bill.put(p.x, p.y, p.z, 2.2, .7, 1, R.uTime.value * 3, c, 1.2); R.magic.emit(p.x, p.y, p.z, rnd(-1, 1), rnd(-1, 1), rnd(-1, 1), .35, .3, c[0], c[1], c[2], 2); }
        else R.magic.emit(p.x, p.y, p.z, 0, 0, 0, .16, .12, .9, .9, .8);
      }
      // bodies with something on them glint
      lootT -= dt;
      if (lootT <= 0) { lootT = .45; for (const e of S.ents) if (e.dead && e.mob && e.loot?.length && e.lootFor === 'party' && !e.remove) { const dx = e.x - h.x, dz = e.z - h.z; if (dx * dx + dz * dz < 1600) { R.magic.emit(e.x + rnd(-.4, .4), e.y + .3, e.z + rnd(-.4, .4), 0, rnd(.8, 1.4), 0, .9, .22, 1, .85, .35); if (Math.random() < .5) fx(1, 1, e.x + rnd(-.3, .3), e.y + rnd(.4, .9), e.z + rnd(-.3, .3), .5, 1.1, .35, [1, .88, .45], 1.3, rnd(0, 1)); } } }
    }
    // the air of the place: leaves, snow, embers, fireflies
    const amb = theme.ambient ? theme.ambient(world, S, inside, R.uTime.value) : null;
    if (amb && amb.rate) {
      ambT += dt * amb.rate;
      const cx = playing ? h.x : 0, cz = playing ? h.z : 0, base = playing ? h.y : 6;
      while (ambT > 1) {
        ambT -= 1; const x = cx + rnd(-26, 26), z = cz + rnd(-26, 26), c = amb.col, v = amb.vel || [0, 0, 0], sz = rnd(.6, 1) * (amb.size || .2), life = amb.life || 4;
        const y = amb.low ? Math.max(hgt(x, z), world.water ?? -99) + rnd(.2, amb.low) : base + rnd(1, 9);
        (amb.glow ? R.magic : R.dust).emit(x, y, z, v[0] + rnd(-.4, .4), v[1] + rnd(-.15, .15), v[2] + rnd(-.4, .4), rnd(life * .6, life), sz, c[0] * rnd(.8, 1), c[1] * rnd(.8, 1), c[2] * rnd(.8, 1), amb.grav || 0);
      }
    }
    for (let i = live.length - 1; i >= 0; i--) {
      const f = live[i]; f.t += dt; if (f.t >= f.life) { live.splice(i, 1); continue; }
      const k = f.t / f.life, s = f.s0 + (f.s1 - f.s0) * (1 - (1 - k) * (1 - k)), x = f.follow ? f.follow.x + f.fx : f.x, z = f.follow ? f.follow.z + f.fz : f.z;
      if (f.b) bill.put(x, f.y, z, s, f.type === 2 ? 1 - k * k : 1 - k, f.type, f.rot, f.c, f.k); else gnd.put(x, f.y, z, s, f.type === 0 ? 1 : 1 - k, f.type, k, f.c, f.k);
    }
    bill.end(); gnd.end();
  }
  G.onFrame && G.onFrame(tick);

  function setOn(v) {
    on = v; bill.mesh.visible = gnd.mesh.visible = v; live.length = 0;
    R.selRing.geometry = v ? ringGeo : ring0.geo; R.selRing.material = v ? selM : ring0.mat;
    R.tankRing.geometry = v ? ringGeo : ring0.tgeo; R.tankRing.material = v ? tankM : ring0.tmat;
    if (v) { selM.color.copy(ring0.mat.color); tankM.color.copy(ring0.tmat.color); }
  }
  return { setOn, fx, sparks };
}
