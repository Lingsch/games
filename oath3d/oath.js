/* Oath of the East 3D in a browser.
   The game itself is oath3d.wasm (the same C source as the PSP and Windows builds). This file is everything around it:
   a small OpenGL 1.1 on top of WebGL 2, touch / keyboard / mouse / gamepad input, sound, and saves in the browser's storage. */
'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('c'), msg = $('msg'), bar = $('bar'), splash = $('splash');
  const params = new URLSearchParams(location.search);
  const FAST = params.get('fast') === '1';
  const dec = new TextDecoder();
  let gl = null, ex = null, mem = null, HU8, HU16, HU32, HF32, HI16;
  let dead = false;

  function views() {
    if (!HU8 || HU8.buffer !== mem.buffer) {
      HU8 = new Uint8Array(mem.buffer); HU16 = new Uint16Array(mem.buffer); HU32 = new Uint32Array(mem.buffer);
      HF32 = new Float32Array(mem.buffer); HI16 = new Int16Array(mem.buffer);
    }
  }
  function cstr(p) { views(); let e = p; while (HU8[e]) e++; return dec.decode(HU8.slice(p, e)); }
  function fail(text) {
    dead = true; msg.textContent = text; msg.style.display = 'flex';
  }

  /* ------------------------------------------------------------ files: kept by name; saves also go to localStorage */
  const files = new Map();
  const KEY = 'oath3d:';
  const persistent = (name) => name.indexOf('SAVEDATA') >= 0;
  function b64enc(u8) { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }
  function b64dec(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function fileGet(name) {
    if (files.has(name)) return files.get(name);
    if (persistent(name)) {
      try { const s = localStorage.getItem(KEY + name); if (s) { const u = b64dec(s); files.set(name, u); return u; } } catch (e) { /* storage off: play without saves */ }
    }
    return null;
  }
  function filePut(name, u8) {
    files.set(name, u8);
    if (persistent(name)) { try { localStorage.setItem(KEY + name, b64enc(u8)); } catch (e) { console.warn('could not store the save', e); } }
  }

  /* ------------------------------------------------------------ OpenGL 1.1, as much of it as the game's PC layer uses */
  const VS = `#version 300 es
  layout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_nrm; layout(location=2) in vec4 a_col; layout(location=3) in vec2 a_uv;
  uniform mat4 u_p, u_mv; uniform mat3 u_nm; uniform int u_lit, u_cm;
  uniform vec3 u_ldir[4], u_ldif[4], u_lamb[4]; uniform vec4 u_lon;
  uniform vec3 u_gamb, u_memi; uniform vec4 u_mamb, u_mdif;
  out vec4 v_col; out vec2 v_uv; out float v_fog;
  void main() {
    vec4 e = u_mv * vec4(a_pos, 1.0);
    gl_Position = u_p * e; gl_PointSize = 1.0;
    vec4 c = a_col;
    if (u_lit == 1) {
      vec3 n = normalize(u_nm * a_nrm);
      vec4 ma = u_cm == 1 ? c : u_mamb, md = u_cm == 1 ? c : u_mdif;
      vec3 s = u_memi + u_gamb * ma.rgb;
      for (int i = 0; i < 4; i++) if (u_lon[i] > 0.5) s += u_lamb[i] * ma.rgb + max(dot(n, u_ldir[i]), 0.0) * u_ldif[i] * md.rgb;
      c = vec4(clamp(s, 0.0, 1.0), md.a);
    }
    v_col = c; v_uv = a_uv; v_fog = abs(e.z);
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec4 v_col; in vec2 v_uv; in float v_fog;
  uniform sampler2D u_tex; uniform int u_usetex, u_afunc, u_fog; uniform float u_aref; uniform vec3 u_fogc; uniform vec2 u_fogr;
  out vec4 o;
  void main() {
    vec4 c = v_col;
    if (u_usetex == 1) c *= texture(u_tex, v_uv);
    if (u_afunc >= 0) {
      float a = c.a; bool pass = true;
      if (u_afunc == 0) pass = false; else if (u_afunc == 1) pass = a < u_aref; else if (u_afunc == 2) pass = a == u_aref; else if (u_afunc == 3) pass = a <= u_aref;
      else if (u_afunc == 4) pass = a > u_aref; else if (u_afunc == 5) pass = a != u_aref; else if (u_afunc == 6) pass = a >= u_aref;
      if (!pass) discard;
    }
    if (u_fog == 1) c.rgb = mix(u_fogc, c.rgb, clamp((u_fogr.y - v_fog) / (u_fogr.y - u_fogr.x), 0.0, 1.0));
    o = c;
  }`;
  const G = {
    lit: false, fog: false, atest: false, tex: false, cm: false, lon: [0, 0, 0, 0],
    proj: new Float32Array(16), mv: new Float32Array(16), mode: 0x1700, nm: new Float32Array(9),
    ldir: new Float32Array(12), ldif: new Float32Array(12), lamb: new Float32Array(12),
    gamb: [0.2, 0.2, 0.2], memi: [0, 0, 0], mamb: [0.2, 0.2, 0.2, 1], mdif: [0.8, 0.8, 0.8, 1],
    fogc: [0, 0, 0], fogs: 0, foge: 1, afunc: 7, aref: 0, cur: [1, 1, 1, 1], tc: [0, 0],
    arr: { v: { on: false }, n: { on: false }, c: { on: false }, t: { on: false } },
    texs: [null], U: {}, vbo: [], ibo: null, dirty: true, im: [], imMode: 0, draws: 0
  };
  G.proj[0] = G.proj[5] = G.proj[10] = G.proj[15] = 1; G.mv.set(G.proj);
  function glSetup() {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    gl.useProgram(p);
    for (const n of ['u_p', 'u_mv', 'u_nm', 'u_lit', 'u_cm', 'u_ldir', 'u_ldif', 'u_lamb', 'u_lon', 'u_gamb', 'u_memi', 'u_mamb', 'u_mdif', 'u_tex', 'u_usetex', 'u_afunc', 'u_fog', 'u_aref', 'u_fogc', 'u_fogr']) G.U[n] = gl.getUniformLocation(p, n);
    gl.uniform1i(G.U.u_tex, 0);
    gl.bindVertexArray(gl.createVertexArray());
    for (let i = 0; i < 5; i++) G.vbo.push(gl.createBuffer());
    G.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, G.ibo);
    gl.enableVertexAttribArray(0);
  }
  function mul(o, a, b) {            /* o = a * b, column-major */
    const r = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; r[i * 4 + j] = s; }
    o.set(r);
  }
  function normalMatrix() {          /* inverse transpose of the model-view's upper 3 x 3 */
    const m = G.mv, a = m[0], b = m[1], c = m[2], d = m[4], e = m[5], f = m[6], g = m[8], h = m[9], i = m[10];
    const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g; let det = a * A + b * B + c * C; if (!det) det = 1; const k = 1 / det, n = G.nm;
    n[0] = A * k; n[1] = B * k; n[2] = C * k;
    n[3] = (c * h - b * i) * k; n[4] = (a * i - c * g) * k; n[5] = (b * g - a * h) * k;
    n[6] = (b * f - c * e) * k; n[7] = (c * d - a * f) * k; n[8] = (a * e - b * d) * k;
  }
  function sync() {
    const U = G.U;
    gl.uniformMatrix4fv(U.u_p, false, G.proj); gl.uniformMatrix4fv(U.u_mv, false, G.mv);
    if (G.lit) { normalMatrix(); gl.uniformMatrix3fv(U.u_nm, false, G.nm); }
    if (!G.dirty) return;
    G.dirty = false;
    gl.uniform1i(U.u_lit, G.lit ? 1 : 0); gl.uniform1i(U.u_cm, G.cm ? 1 : 0);
    gl.uniform3fv(U.u_ldir, G.ldir); gl.uniform3fv(U.u_ldif, G.ldif); gl.uniform3fv(U.u_lamb, G.lamb); gl.uniform4f(U.u_lon, G.lon[0], G.lon[1], G.lon[2], G.lon[3]);
    gl.uniform3f(U.u_gamb, G.gamb[0], G.gamb[1], G.gamb[2]); gl.uniform3f(U.u_memi, G.memi[0], G.memi[1], G.memi[2]);
    gl.uniform4f(U.u_mamb, G.mamb[0], G.mamb[1], G.mamb[2], G.mamb[3]); gl.uniform4f(U.u_mdif, G.mdif[0], G.mdif[1], G.mdif[2], G.mdif[3]);
    gl.uniform1i(U.u_usetex, G.tex ? 1 : 0); gl.uniform1i(U.u_afunc, G.atest ? G.afunc : -1); gl.uniform1f(U.u_aref, G.aref);
    gl.uniform1i(U.u_fog, G.fog ? 1 : 0); gl.uniform3f(U.u_fogc, G.fogc[0], G.fogc[1], G.fogc[2]); gl.uniform2f(U.u_fogr, G.fogs, G.foge);
  }
  const TSIZE = { 0x1400: 1, 0x1401: 1, 0x1402: 2, 0x1403: 2, 0x1406: 4 };
  function arrays(nv) {
    views();
    const A = G.arr, list = [];
    list.push([0, 3, 0x1406, false, A.v.stride, A.v.ptr, 12]);
    if (A.n.on) list.push([1, 3, A.n.type, false, A.n.stride, A.n.ptr, 3 * TSIZE[A.n.type]]); else { gl.disableVertexAttribArray(1); gl.vertexAttrib3f(1, 0, 0, 1); }
    if (A.c.on) list.push([2, 4, 0x1401, true, A.c.stride, A.c.ptr, 4]); else { gl.disableVertexAttribArray(2); gl.vertexAttrib4f(2, G.cur[0], G.cur[1], G.cur[2], G.cur[3]); }
    if (A.t.on) list.push([3, 2, 0x1406, false, A.t.stride, A.t.ptr, 8]); else { gl.disableVertexAttribArray(3); gl.vertexAttrib2f(3, G.tc[0], G.tc[1]); }
    let lo = Infinity, hi = 0, same = true;
    for (const a of list) { if (a[4] !== list[0][4]) same = false; if (a[5] < lo) lo = a[5]; const e = a[5] + (nv - 1) * a[4] + a[6]; if (e > hi) hi = e; }
    for (const a of list) if (a[5] - lo >= a[4]) same = false;
    if (same) {                      /* the usual case: one interleaved block */
      gl.bindBuffer(gl.ARRAY_BUFFER, G.vbo[0]); gl.bufferData(gl.ARRAY_BUFFER, HU8.subarray(lo, hi), gl.STREAM_DRAW);
      for (const a of list) { gl.enableVertexAttribArray(a[0]); gl.vertexAttribPointer(a[0], a[1], a[2], a[3], a[4], a[5] - lo); }
    } else {
      for (const a of list) {
        gl.bindBuffer(gl.ARRAY_BUFFER, G.vbo[1 + a[0]]); gl.bufferData(gl.ARRAY_BUFFER, HU8.subarray(a[5], a[5] + (nv - 1) * a[4] + a[6]), gl.STREAM_DRAW);
        gl.enableVertexAttribArray(a[0]); gl.vertexAttribPointer(a[0], a[1], a[2], a[3], a[4], 0);
      }
    }
  }
  const glf = {
    glEnable(c) { cap(c, true); }, glDisable(c) { cap(c, false); },
    glDepthFunc(f) { gl.depthFunc(f); }, glDepthMask(m) { gl.depthMask(!!m); }, glFrontFace(m) { gl.frontFace(m); }, glCullFace(m) { gl.cullFace(m); },
    glShadeModel() {}, glLineWidth() {}, glTexEnvi() {}, glColorMaterial() {}, glFogi() {},
    glAlphaFunc(f, r) { G.afunc = f - 0x200; G.aref = r; G.dirty = true; },
    glBlendFunc(s, d) { gl.blendFunc(s, d); },
    glClearColor(r, g, b, a) { gl.clearColor(r, g, b, a); }, glClearDepth(d) { gl.clearDepth(d); }, glClear(m) { gl.clear(m); },
    glScissor(x, y, w, h) { gl.scissor(x, y, w, h); }, glViewport(x, y, w, h) { gl.viewport(x, y, w, h); },
    glLightfv(light, name, p) {
      views(); const i = (light - 0x4000) & 3, f = p >> 2;
      if (name === 0x1203) {         /* a direction, taken into eye space by the current model-view */
        const m = G.mv, x = HF32[f], y = HF32[f + 1], z = HF32[f + 2], w = HF32[f + 3];
        let ex_ = m[0] * x + m[4] * y + m[8] * z + m[12] * w, ey = m[1] * x + m[5] * y + m[9] * z + m[13] * w, ez = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        const l = Math.hypot(ex_, ey, ez) || 1; G.ldir[i * 3] = ex_ / l; G.ldir[i * 3 + 1] = ey / l; G.ldir[i * 3 + 2] = ez / l;
      } else if (name === 0x1201) { G.ldif[i * 3] = HF32[f]; G.ldif[i * 3 + 1] = HF32[f + 1]; G.ldif[i * 3 + 2] = HF32[f + 2]; }
      else if (name === 0x1200) { G.lamb[i * 3] = HF32[f]; G.lamb[i * 3 + 1] = HF32[f + 1]; G.lamb[i * 3 + 2] = HF32[f + 2]; }
      G.dirty = true;
    },
    glLightModelfv(name, p) { views(); const f = p >> 2; G.gamb = [HF32[f], HF32[f + 1], HF32[f + 2]]; G.dirty = true; },
    glMaterialfv(face, name, p) {
      views(); const f = p >> 2, v = [HF32[f], HF32[f + 1], HF32[f + 2], HF32[f + 3]];
      if (name === 0x1200) G.mamb = v; else if (name === 0x1201) G.mdif = v; else if (name === 0x1600) G.memi = v; else if (name === 0x1602) { G.mamb = v; G.mdif = v; }
      G.dirty = true;
    },
    glFogf(name, v) { if (name === 0xB63) G.fogs = v; else if (name === 0xB64) G.foge = v; G.dirty = true; },
    glFogfv(name, p) { views(); const f = p >> 2; G.fogc = [HF32[f], HF32[f + 1], HF32[f + 2]]; G.dirty = true; },
    glGenTextures(n, p) { views(); for (let i = 0; i < n; i++) { G.texs.push(gl.createTexture()); HU32[(p >> 2) + i] = G.texs.length - 1; } },
    glBindTexture(t, id) { gl.bindTexture(gl.TEXTURE_2D, G.texs[id] || null); },
    glPixelStorei(name, v) { if (name === 0xCF5) gl.pixelStorei(gl.UNPACK_ALIGNMENT, v); },
    glTexParameteri(t, name, v) { gl.texParameteri(gl.TEXTURE_2D, name, v); },
    glTexImage2D(t, level, ifmt, w, h, border, fmt, type, p) { views(); gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, HU8, p); },
    glMatrixMode(m) { G.mode = m; },
    glLoadMatrixf(p) { views(); (G.mode === 0x1701 ? G.proj : G.mv).set(HF32.subarray(p >> 2, (p >> 2) + 16)); },
    glLoadIdentity() { const m = G.mode === 0x1701 ? G.proj : G.mv; m.fill(0); m[0] = m[5] = m[10] = m[15] = 1; },
    glOrtho(l, r, b, t, n, f) {
      const o = new Float32Array(16), m = G.mode === 0x1701 ? G.proj : G.mv;
      o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n); o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); o[15] = 1;
      mul(m, m, o);
    },
    glBegin(mode) { G.imMode = mode; G.im.length = 0; },
    glColor4ub(r, g, b, a) { G.cur = [r / 255, g / 255, b / 255, a / 255]; },
    glColor4f(r, g, b, a) { G.cur = [r, g, b, a]; },
    glTexCoord2f(u, v) { G.tc = [u, v]; },
    glVertex2f(x, y) { G.im.push(x, y, G.tc[0], G.tc[1], G.cur[0], G.cur[1], G.cur[2], G.cur[3]); },
    glEnd() {
      const n = G.im.length / 8; if (!n) return;
      let data, count, mode = G.imMode;
      if (mode === 7) {              /* quads: two triangles each */
        const q = n >> 2; data = new Float32Array(q * 48); count = q * 6; const order = [0, 1, 2, 0, 2, 3];
        for (let i = 0; i < q; i++) for (let k = 0; k < 6; k++) { const s = (i * 4 + order[k]) * 8, d = (i * 6 + k) * 8; for (let j = 0; j < 8; j++) data[d + j] = G.im[s + j]; }
        mode = gl.TRIANGLES;
      } else { data = new Float32Array(G.im); count = n; }
      sync();
      gl.bindBuffer(gl.ARRAY_BUFFER, G.vbo[0]); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 32, 0);
      gl.disableVertexAttribArray(1); gl.vertexAttrib3f(1, 0, 0, 1);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 32, 8);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
      gl.drawArrays(mode, 0, count); G.draws++;
    },
    glEnableClientState(a) { cstate(a, true); }, glDisableClientState(a) { cstate(a, false); },
    glVertexPointer(size, type, stride, ptr) { const v = G.arr.v; v.size = size; v.type = type; v.stride = stride; v.ptr = ptr; },
    glNormalPointer(type, stride, ptr) { const v = G.arr.n; v.type = type; v.stride = stride; v.ptr = ptr; },
    glColorPointer(size, type, stride, ptr) { const v = G.arr.c; v.size = size; v.type = type; v.stride = stride; v.ptr = ptr; },
    glTexCoordPointer(size, type, stride, ptr) { const v = G.arr.t; v.size = size; v.type = type; v.stride = stride; v.ptr = ptr; },
    glDrawArrays(mode, first, count) { if (count <= 0) return; sync(); arrays(first + count); gl.drawArrays(mode, first, count); G.draws++; },
    glDrawElements(mode, count, type, ptr) {
      if (count <= 0) return;
      views(); let nv = 0;
      if (type === 0x1403) { const b = ptr >> 1; for (let i = 0; i < count; i++) { const v = HU16[b + i]; if (v >= nv) nv = v + 1; } gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, HU8.subarray(ptr, ptr + count * 2), gl.STREAM_DRAW); }
      else { for (let i = 0; i < count; i++) { const v = HU8[ptr + i]; if (v >= nv) nv = v + 1; } gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, HU8.subarray(ptr, ptr + count), gl.STREAM_DRAW); }
      sync(); arrays(nv); gl.drawElements(mode, count, type, 0); G.draws++;
    },
    pc_sky() {}
  };
  function cap(c, on) {
    switch (c) {
      case 0xB50: G.lit = on; break; case 0xB60: G.fog = on; break; case 0xBC0: G.atest = on; break; case 0xDE1: G.tex = on; break; case 0xB57: G.cm = on; break;
      case 0x4000: case 0x4001: case 0x4002: case 0x4003: G.lon[c - 0x4000] = on ? 1 : 0; break;
      case 0xB71: case 0xBE2: case 0xB44: case 0xC11: if (on) gl.enable(c); else gl.disable(c); return;
      default: return;               /* GL_NORMALIZE and the like: always on here */
    }
    G.dirty = true;
  }
  function cstate(a, on) { const A = G.arr; if (a === 0x8074) A.v.on = on; else if (a === 0x8075) A.n.on = on; else if (a === 0x8076) A.c.on = on; else if (a === 0x8078) A.t.on = on; }

  /* ------------------------------------------------------------ input */
  const B = { SELECT: 0x1, START: 0x8, UP: 0x10, RIGHT: 0x20, DOWN: 0x40, LEFT: 0x80, L: 0x100, R: 0x200, TRIANGLE: 0x1000, CIRCLE: 0x2000, CROSS: 0x4000, SQUARE: 0x8000 };
  const KEYS = {
    KeyW: B.UP, ArrowUp: B.UP, KeyS: B.DOWN, ArrowDown: B.DOWN, KeyA: B.LEFT, ArrowLeft: B.LEFT, KeyD: B.RIGHT, ArrowRight: B.RIGHT,
    Space: B.CROSS, Enter: B.CROSS, KeyQ: B.CIRCLE, Backspace: B.CIRCLE, KeyE: B.TRIANGLE, KeyF: B.SQUARE, ShiftLeft: B.SQUARE, ShiftRight: B.SQUARE,
    Tab: B.L, KeyZ: B.L, PageUp: B.L, KeyX: B.R, PageDown: B.R, Escape: B.START, KeyC: B.SELECT, ControlLeft: B.SELECT, ControlRight: B.SELECT
  };
  const I = { keys: 0, mouse: 0, touch: 0, stick: 0, kx: 0, ky: 0, mdx: 0, mdy: 0, device: -1, capture: 0, locked: false };
  const down = new Set();
  addEventListener('keydown', (e) => {
    if (e.code === 'F11' || e.metaKey) return;
    const b = KEYS[e.code]; if (b || 'IJKL'.indexOf(e.code.slice(3)) >= 0 && e.code.startsWith('Key')) { e.preventDefault(); }
    down.add(e.code); if (b) I.keys |= b; I.device = 0; audioWake();
  });
  addEventListener('keyup', (e) => { down.delete(e.code); let k = 0; for (const c of down) k |= KEYS[c] || 0; I.keys = k; });
  addEventListener('blur', () => { down.clear(); I.keys = 0; I.mouse = 0; });
  canvas.addEventListener('mousedown', (e) => {
    audioWake();
    if (!I.locked) { if (I.capture && canvas.requestPointerLock) canvas.requestPointerLock(); return; }
    if (e.button === 0) I.mouse |= B.R; else if (e.button === 2) I.mouse |= B.TRIANGLE; I.device = 0;
  });
  addEventListener('mouseup', (e) => { if (e.button === 0) I.mouse &= ~B.R; else if (e.button === 2) I.mouse &= ~B.TRIANGLE; });
  addEventListener('mousemove', (e) => { if (I.locked) { I.mdx += e.movementX || 0; I.mdy += e.movementY || 0; } });
  addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('pointerlockchange', () => { I.locked = document.pointerLockElement === canvas; if (!I.locked) I.mouse = 0; });

  /* touch: a stick on the left (it presses the D-pad, which is what moves the hero), buttons on the right, and dragging the right side looks around */
  const pad = $('pad');
  function showPad() { pad.classList.add('on'); }
  if (matchMedia('(pointer: coarse)').matches || params.get('touch') === '1') { showPad(); I.device = 1; }
  addEventListener('touchstart', () => { showPad(); }, { passive: true, capture: true });
  for (const ev of ['touchend', 'pointerup', 'click']) addEventListener(ev, () => audioWake(), { passive: true, capture: true });   /* Safari only lets sound start from the end of a touch */
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  for (const el of document.querySelectorAll('[data-b]')) {
    const bit = B[el.dataset.b];
    const on = (e) => { e.preventDefault(); I.touch |= bit; I.device = 1; el.classList.add('held'); try { el.setPointerCapture(e.pointerId); } catch (x) { } };
    const off = (e) => { e.preventDefault(); I.touch &= ~bit; el.classList.remove('held'); };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointercancel', off); el.addEventListener('lostpointercapture', off);
  }
  {
    const zone = $('stick'), knob = $('knob'); let id = -1;
    const move = (e) => {
      const r = zone.getBoundingClientRect(), R = r.width / 2; let x = (e.clientX - r.left - R) / R, y = (e.clientY - r.top - R) / R;
      const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
      knob.style.transform = 'translate(' + (x * R * 0.6) + 'px,' + (y * R * 0.6) + 'px)';
      let b = 0; if (m > 0.28) { const nx = x / Math.min(m, 1), ny = y / Math.min(m, 1); if (nx > 0.4) b |= B.RIGHT; if (nx < -0.4) b |= B.LEFT; if (ny > 0.4) b |= B.DOWN; if (ny < -0.4) b |= B.UP; }
      I.stick = b; I.device = 1;
    };
    const end = (e) => { if (e.pointerId !== id) return; id = -1; I.stick = 0; knob.style.transform = ''; };
    zone.addEventListener('pointerdown', (e) => { e.preventDefault(); id = e.pointerId; try { zone.setPointerCapture(id); } catch (x) { } move(e); });
    zone.addEventListener('pointermove', (e) => { if (e.pointerId === id) { e.preventDefault(); move(e); } });
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  }
  {
    const zone = $('look'); const last = new Map();
    zone.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; e.preventDefault(); last.set(e.pointerId, [e.clientX, e.clientY]); try { zone.setPointerCapture(e.pointerId); } catch (x) { } });
    zone.addEventListener('pointermove', (e) => { const p = last.get(e.pointerId); if (!p) return; e.preventDefault(); I.mdx += (e.clientX - p[0]) * 2.2; I.mdy += (e.clientY - p[1]) * 2.2; p[0] = e.clientX; p[1] = e.clientY; I.device = 1; });
    const end = (e) => { last.delete(e.pointerId); };
    zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  }
  function gamepad(o) {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of gps) {
      if (!g || !g.connected || g.mapping !== 'standard') continue;
      const p = (i) => g.buttons[i] && g.buttons[i].pressed; let b = 0;
      if (p(0)) b |= B.CROSS; if (p(1)) b |= B.CIRCLE; if (p(2)) b |= B.SQUARE; if (p(3)) b |= B.TRIANGLE; if (p(4) || p(6)) b |= B.L; if (p(5) || p(7)) b |= B.R;
      if (p(8)) b |= B.SELECT; if (p(9)) b |= B.START; if (p(12)) b |= B.UP; if (p(13)) b |= B.DOWN; if (p(14)) b |= B.LEFT; if (p(15)) b |= B.RIGHT;
      const dz = (v) => Math.abs(v) < 0.25 ? 0 : v; const lx = dz(g.axes[0] || 0), ly = dz(g.axes[1] || 0), rx = dz(g.axes[2] || 0), ry = dz(g.axes[3] || 0);
      if (lx > 0.45) b |= B.RIGHT; if (lx < -0.45) b |= B.LEFT; if (ly > 0.45) b |= B.DOWN; if (ly < -0.45) b |= B.UP;
      o.b |= b; o.x += rx; o.y += ry;
      if (b || rx || ry) I.device = 1;
      return;
    }
  }

  /* ------------------------------------------------------------ sound: keep a little of the game's mix queued ahead */
  let actx = null, anext = 0;
  function audioWake() {
    if (FAST) return;
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { actx = new AC(); } catch (e) { return; } }
    if (actx.state === 'suspended') actx.resume();
  }
  function audioPump() {
    if (!actx || actx.state !== 'running' || !ex) return;
    const now = actx.currentTime; if (anext < now + 0.02) anext = now + 0.05;
    let guard = 0;
    while (anext < now + 0.16 && guard++ < 8) {
      const N = 1024, p = ex.web_audio(N) >> 1; views();
      const buf = actx.createBuffer(2, N, 44100), l = buf.getChannelData(0), r = buf.getChannelData(1);
      for (let i = 0; i < N; i++) { l[i] = HI16[p + i * 2] / 32768; r[i] = HI16[p + i * 2 + 1] / 32768; }
      const s = actx.createBufferSource(); s.buffer = buf; s.connect(actx.destination); s.start(anext); anext += N / 44100;
    }
  }

  /* ------------------------------------------------------------ what the game calls */
  const shots = {}; window.oathShots = shots; window.oathFiles = files;
  const env = Object.assign({}, glf, {
    web_init() {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: true, depth: true, stencil: false, powerPreference: 'high-performance' });
      if (!gl) return 0;
      glSetup(); return 1;
    },
    web_w() { return canvas.width; }, web_h() { return canvas.height; },
    web_now() { return performance.now(); },
    web_vcount() { return Math.floor(performance.now() * 0.06); },
    web_fast() { return FAST ? 1 : 0; },
    web_capture(on) { I.capture = on; if (!on && I.locked) document.exitPointerLock(); },
    web_input(p) {
      views();
      const o = { b: 0, x: 0, y: 0 }; gamepad(o);
      if (down.has('KeyJ')) o.x -= 1; if (down.has('KeyL')) o.x += 1; if (down.has('KeyI')) o.y -= 1; if (down.has('KeyK')) o.y += 1;
      HU32[p >> 2] = (I.keys | I.mouse | I.touch | I.stick | o.b) >>> 0;
      HF32[(p >> 2) + 1] = Math.max(-1, Math.min(1, o.x)); HF32[(p >> 2) + 2] = Math.max(-1, Math.min(1, o.y));
      new Int32Array(mem.buffer)[(p >> 2) + 3] = I.device; I.device = -1;
      HF32[(p >> 2) + 4] = I.mdx; HF32[(p >> 2) + 5] = I.mdy; I.mdx = I.mdy = 0;
    },
    web_shot(p) { const name = cstr(p); gl.finish(); shots[name] = canvas.toDataURL('image/png'); },
    web_file_size(p) { const f = fileGet(cstr(p)); return f ? f.length : -1; },
    web_file_read(p, buf, n) { const f = fileGet(cstr(p)); if (!f) return -1; views(); n = Math.min(n, f.length); HU8.set(f.subarray(0, n), buf); return n; },
    web_file_write(p, buf, n, append) {
      views(); const name = cstr(p), data = HU8.slice(buf, buf + n);
      if (append) { const old = fileGet(name); if (old) { const u = new Uint8Array(old.length + n); u.set(old); u.set(data, old.length); filePut(name, u); return; } }
      filePut(name, data);
    }
  });
  const wasi = {
    environ_get() { return 0; },
    environ_sizes_get(pc, ps) { views(); HU32[pc >> 2] = 0; HU32[ps >> 2] = 0; return 0; },
    fd_close() { return 0; }, fd_seek() { return 70; },
    fd_write(fd, iov, n, pw) {
      views(); let s = '', total = 0;
      for (let i = 0; i < n; i++) { const p = HU32[(iov >> 2) + i * 2], l = HU32[(iov >> 2) + i * 2 + 1]; s += dec.decode(HU8.slice(p, p + l)); total += l; }
      if (s.trim()) console.log(s.trimEnd());
      HU32[pw >> 2] = total; return 0;
    },
    proc_exit(code) { throw new Error('the game stopped (' + code + ')'); }
  };

  /* ------------------------------------------------------------ the page */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(canvas.clientWidth * dpr)), h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200));
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); fail('The browser took the graphics away (this can happen after switching apps). Tap to reload; your last save is kept.'); msg.onclick = () => location.reload(); });

  let lastT = 0, frames = 0;
  window.oathStats = () => ({ frames, draws: G.draws, dead });
  function frame() {
    if (dead) return;
    resize(); G.draws = 0;
    try { ex.web_frame(); } catch (e) { console.error(e); fail('The game hit an error and stopped:\n' + (e && e.message ? e.message : e) + '\n\nReload the page to carry on from your last save.'); return; }
    frames++; audioPump();
  }
  function tick(t) {
    if (dead) return;
    requestAnimationFrame(tick);
    if (t - lastT < 30) return;      /* the game runs at 30 frames a second, as on the PSP */
    lastT = t; frame();
  }
  function fastLoop() { if (dead) return; const t0 = performance.now(); while (performance.now() - t0 < 12 && !dead) frame(); setTimeout(fastLoop, 0); }

  async function load() {
    const test = params.get('autotest');
    if (test) { const r = await fetch(test); if (r.ok) files.set('ms0:/PSP/GAME/OATH3D/autotest.txt', new Uint8Array(await r.arrayBuffer())); }
    const res = await fetch('oath3d.wasm?v=' + (window.OATH_BUILD || '1'));
    if (!res.ok) throw new Error('could not download the game (' + res.status + ')');
    const total = +res.headers.get('Content-Length') || 13500000, reader = res.body && res.body.getReader ? res.body.getReader() : null;
    let bytes;
    if (reader) {
      const parts = []; let got = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; bar.style.width = Math.min(100, got / total * 100) + '%'; }
      bytes = new Uint8Array(got); let at = 0; for (const p of parts) { bytes.set(p, at); at += p.length; }
    } else bytes = new Uint8Array(await res.arrayBuffer());
    bar.style.width = '100%';
    const { instance } = await WebAssembly.instantiate(bytes, { env, wasi_snapshot_preview1: wasi });
    ex = instance.exports; mem = ex.memory; views();
    resize();
    ex._initialize();
    ex.web_boot();
    if (!gl) throw new Error('This browser has no WebGL 2, which the game needs. On an iPhone that means iOS 15 or newer.');
    splash.style.display = 'none';
    window.oathReady = true;
    if (FAST) fastLoop(); else requestAnimationFrame(tick);
  }
  load().catch((e) => { console.error(e); splash.style.display = 'none'; fail(String(e && e.message ? e.message : e)); });
})();
