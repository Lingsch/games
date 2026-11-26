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
export function setOpt(k, v) { SET[k] = v; try { localStorage.setItem(KEY, JSON.stringify(SET)); } catch (e) { } apply(); }
export function apply() {
  const r = document.documentElement.style;
  r.setProperty('--ui', SET.ui); r.setProperty('--txt', SET.text); r.setProperty('--joy', SET.joySize);
  const pr = { low: .85, medium: 1.25, high: 1.75 }[SET.gfx] || 1.75;
  R.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, pr));
  R.cam.far = SET.gfx === 'low' ? 320 : 1200; R.cam.updateProjectionMatrix();
  dispatchEvent(new Event('resize'));
}
