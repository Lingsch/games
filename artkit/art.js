// The art layer. One switch (Settings → Graphics → New art) turns all of it on or off.
// Each game loads this from its own art/art.js and hands over its engine modules, so nothing here imports game files.
import { initRig } from './rig.js';
import { initCreatures } from './creatures.js';
import { initClasses } from './classes.js';
import { initBeasts } from './beastkit.js';
import { initLight } from './light.js';
import { initFx } from './fx.js';
import { initUi } from './ui.js';
export const ART_VERSION = '10';
export function initArt(G) {
  const { SET } = G;
  if (SET.art === undefined) SET.art = 1;
  // quality follows Settings → Graphics, and steps down by itself if the frame rate stays low for a while
  const ORDER = ['low', 'medium', 'high']; let cap = 2, slow = 0, lastFps = 0;
  G.quality = () => ORDER[Math.min(cap, Math.max(0, ORDER.indexOf(SET.gfx || 'high')))];
  setInterval(() => {
    if (!SET.art || !G.S.running || document.hidden || navigator.webdriver) { slow = 0; return; }
    const f = G.S.fps || 60; slow = f < 27 ? slow + 1 : 0; lastFps = f;
    if (slow >= 8 && cap > 0) { cap--; slow = -6; console.info('art: stepping quality down to', ORDER[cap], 'at', f, 'fps'); }
  }, 1000);
  G.base = new URL('.', import.meta.url).href; G.version = ART_VERSION;
  const parts = [];
  for (const [name, init] of [['light', initLight], ['fx', initFx], ['ui', initUi], ['rig', initRig], ['creatures', initCreatures], ['classes', initClasses], ['beasts', initBeasts]]) {
    try { parts.push(init(G)); } catch (e) { console.warn('art: ' + name + ' failed to start', e); }
  }
  let on = null;
  const sync = () => { const want = !!SET.art; if (want === on) return; on = want; for (const p of parts) { try { p.setOn(want); } catch (e) { console.warn('art', e); } } };
  sync(); setInterval(sync, 250);
  window.__ART = { G, parts, version: ART_VERSION, set: v => { SET.art = v ? 1 : 0; sync(); } };
}
