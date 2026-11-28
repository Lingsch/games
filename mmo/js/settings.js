// Player settings: camera and touch, interface and text size, graphics quality. Kept on this device.
import * as R from './render.js';
const KEY = 'mmo-settings';
export const SET = { camSpeed: 1, joySize: 1, tapSens: 1, ui: 1, text: 1, gfx: 'high', loot: 'roll' };
try { Object.assign(SET, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
export const OPTS = {
  camSpeed: ['Camera speed', [['Slow', .6], ['Normal', 1], ['Fast', 1.5], ['Very fast', 2.1]]],
  joySize: ['Joystick size', [['Small', .8], ['Normal', 1], ['Large', 1.25], ['Huge', 1.5]]],
  tapSens: ['Tap sensitivity', [['Precise', .75], ['Normal', 1], ['Forgiving', 1.4]]],
  ui: ['Interface size', [['Small', .85], ['Normal', 1], ['Large', 1.15], ['Huge', 1.3]]],
  text: ['Text size', [['Small', .9], ['Normal', 1], ['Large', 1.2], ['Huge', 1.4]]],
  gfx: ['Graphics quality', [['Low', 'low'], ['Medium', 'medium'], ['High', 'high']]],
  loot: ['Gear from bodies you open', [['Need or greed', 'roll'], ['I hand it out', 'master']]],
};
// Build 13.4: dynamic resolution, the way console games hold their frame rate. When frames run slow for a couple of seconds the
// picture is drawn at a slightly lower resolution (never below 60% of the setting); after a long smooth stretch it climbs back.
// It reads the game's own frame counter, so it never fights the art layer's quality step-down, which only acts much later.
export const dyn = { max: 1.75, min: 1, cur: 1.75, low: 0, high: 0, wait: 0 };
setInterval(() => {
  const S = window.__G?.S; if (!S?.running || document.hidden || navigator.webdriver) { dyn.low = dyn.high = 0; return; }
  const f = S.fps || 60; if (dyn.wait > 0) { dyn.wait--; return; }
  dyn.low = f < 48 ? dyn.low + 1 : 0; dyn.high = f >= 57 ? dyn.high + 1 : 0;
  let next = dyn.cur;
  // a phone in Low Power Mode caps the frame rate at 30 however little there is to draw: if dropping all the way didn't help, go back up and leave it a minute
  if (dyn.low >= 4 && dyn.cur <= dyn.min && dyn.f0 && f < dyn.f0 + 4) { next = dyn.max; dyn.f0 = 0; dyn.wait = 120; }
  else if (dyn.low >= 4 && dyn.cur > dyn.min) { if (dyn.cur === dyn.max) dyn.f0 = f; next = Math.max(dyn.min, dyn.cur - .15); }
  else if (dyn.high >= 20 && dyn.cur < dyn.max) next = Math.min(dyn.max, dyn.cur + .1);
  if (next !== dyn.cur) { dyn.cur = +next.toFixed(2); dyn.low = dyn.high = 0; dyn.wait = Math.max(dyn.wait, 3); R.renderer.setPixelRatio(dyn.cur); dispatchEvent(new Event('resize')); }
}, 500);
export function setOpt(k, v) { SET[k] = v; try { localStorage.setItem(KEY, JSON.stringify(SET)); } catch (e) { } apply(); }
export function apply() {
  const r = document.documentElement.style;
  r.setProperty('--ui', SET.ui); r.setProperty('--txt', SET.text); r.setProperty('--joy', SET.joySize);
  const pr = { low: .85, medium: 1.25, high: 1.75 }[SET.gfx] || 1.75;
  dyn.max = Math.min(devicePixelRatio || 1, pr); dyn.min = Math.min(dyn.max, Math.max(.85, dyn.max * .6)); dyn.cur = dyn.max;
  R.renderer.setPixelRatio(dyn.cur);
  R.cam.far = SET.gfx === 'low' ? 320 : 1200; R.cam.updateProjectionMatrix();
  dispatchEvent(new Event('resize'));
}
