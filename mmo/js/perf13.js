// Build 13.4: the speed test (Menu → Speed test). It times the game as it is, then with one part of the graphics switched off
// at a time, and shows a table Rod can screenshot or copy. That says what actually costs the frames on his phone,
// instead of guessing from a desktop.
import { S, X } from './core.js';
import * as R from './render.js';
import { SET, dyn } from './settings.js';

const STEPS = [
  ['Everything on', {}],
  ['No glow pass', { noGlow: 1 }],
  ['No shadows', { noShadow: 1 }],
  ['No outlines', { noOutline: 1 }],
  ['60% resolution', { res: .6 }],
  ['No interface', { noHud: 1 }],
  ['New art off', { noArt: 1 }],
  ['All of the above off', { noGlow: 1, noShadow: 1, noOutline: 1, res: .6, noHud: 1, noArt: 1 }],
];
const wait = ms => new Promise(r => setTimeout(r, ms));
let running = false;

function apply(o, art0) {
  const P = window.__PERF;
  P.noGlow = !!o.noGlow; P.noShadow = !!o.noShadow; P.noOutline = !!o.noOutline;
  R.renderer.setPixelRatio(+(dyn.cur * (o.res || 1)).toFixed(2)); dispatchEvent(new Event('resize'));
  for (const id of ['hud', 'plates']) { const e = document.getElementById(id); if (e) e.style.visibility = o.noHud ? 'hidden' : ''; }
  if (window.__ART) window.__ART.set(o.noArt ? 0 : art0);
}

X.speedTest = async () => {
  if (running || !S.running) return; running = true;
  const P = window.__PERF, art0 = SET.art === undefined ? 1 : SET.art, wait0 = dyn.wait;
  const tag = document.createElement('div');
  tag.style.cssText = 'position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:99;background:#000c;color:#fff;padding:10px 16px;border-radius:10px;font:600 15px system-ui;text-align:center;pointer-events:none';
  document.body.appendChild(tag);
  const rows = [];
  try {
    for (let i = 0; i < STEPS.length; i++) {
      const [name, o] = STEPS[i];
      dyn.wait = 9999;
      tag.textContent = `Speed test ${i + 1} of ${STEPS.length}: ${name}`;
      apply(o, art0);
      await wait(1800);
      for (const k of ['tick', 'draw', 'render', 'ui', 'busy', 'frames']) P[k] = 0;
      const t0 = performance.now(); await wait(3000); const sec = (performance.now() - t0) / 1000, n = Math.max(1, P.frames);
      rows.push({ name, fps: P.frames / sec, frame: sec * 1000 / n, busy: P.busy / n, tick: P.tick / n, draw: P.draw / n, render: P.render / n, ui: P.ui / n });
    }
  } finally {
    apply({}, art0); dyn.wait = wait0; tag.remove(); running = false;
    const P2 = window.__PERF; P2.noGlow = P2.noShadow = P2.noOutline = false;
  }
  const q = window.__ART?.G?.quality?.() || '-';
  const info = `${navigator.userAgent.match(/iPhone|iPad|Android|Mac OS X|Windows/)?.[0] || 'device'} · screen ${screen.width}×${screen.height} at ${devicePixelRatio}x · drawing at ${dyn.cur}x · Graphics ${SET.gfx} · art ${q}`;
  const f = v => v.toFixed(1);
  const text = info + '\n' + rows.map(r => `${r.name}: ${f(r.fps)} fps (frame ${f(r.frame)} ms; our code ${f(r.busy)} = world ${f(r.tick)} + models ${f(r.draw)} + send to GPU ${f(r.render)} + interface ${f(r.ui)})`).join('\n');
  X.ui.openSheet('Speed test', body => {
    const { el, esc } = X.ui;
    body.appendChild(el(`<div class="card" style="text-align:left"><p class="dim" style="margin:0 0 6px;font-size:12px">${esc(info)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="text-align:left"><th>Test</th><th>FPS</th><th>Frame</th><th>Code</th><th>GPU send</th></tr>
      ${rows.map(r => `<tr><td>${esc(r.name)}</td><td><b>${f(r.fps)}</b></td><td>${f(r.frame)} ms</td><td>${f(r.busy)} ms</td><td>${f(r.render)} ms</td></tr>`).join('')}</table>
      <p class="dim" style="font-size:12px;margin:6px 0 0">"Frame" is the time between pictures. "Code" is the game's own work each frame; the rest is the phone's graphics chip catching up.</p></div>`));
    const a = el('<div class="acts"><button class="pri">Copy results</button></div>');
    a.firstChild.onclick = async () => { try { await navigator.clipboard.writeText(text); X.ui.toast('Copied'); } catch (e) { X.ui.toast('Take a screenshot instead'); } };
    body.appendChild(a);
  });
};
