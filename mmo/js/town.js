// Build 5.2: a lived-in Vale town. Timber houses, a tavern, the Watch house and its cells, the temple of the Four,
// the bank, the keep and armory, a market square, and a crafters' quarter inside the walls.
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import * as M from './models.js';
import { mat4, addWall } from './world.js';
const O = [0, 0, 0];
// a house: walls, timber frame, a 45-degree gable roof, windows, a door, a chimney. Front faces local +z.
export function houseGeo({ w = 6, d = 5, h = 3.4, wall = '#d8cdb5', trim = '#5a3e28', roof = '#8a4a32', floors = 1, stone = false, chimney = true, sign = null }) {
  const parts = [P(T(Box(w, h, d), 0, h / 2), 0, O, wall)];
  if (stone) parts.push(P(T(Box(w + .2, .5, d + .2), 0, .25), 0, O, '#7d786e'));
  else {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(P(T(Box(.28, h, .28), x * (w / 2 - .1), h / 2, z * (d / 2 - .1)), 0, O, trim));
    for (const y of floors > 1 ? [h * .5, h - .1] : [h - .1]) { parts.push(P(T(Box(w + .05, .22, .1), 0, y, d / 2 + .02), 0, O, trim), P(T(Box(w + .05, .22, .1), 0, y, -d / 2 - .02), 0, O, trim)); }
    parts.push(P(T(Box(.18, h, .1), -w / 4, h / 2, d / 2 + .03), 0, O, trim), P(T(Box(.18, h, .1), w / 4, h / 2, d / 2 + .03), 0, O, trim));
  }
  // gable roof
  const s = d / Math.SQRT2;
  parts.push(P(T(Box(w - .05, s, s), 0, h, 0, Math.PI / 4), 0, O, wall));
  const half = (d / 2 + .45) * Math.SQRT2;
  for (const sg of [-1, 1]) parts.push(P(T(Box(w + .7, .22, half), 0, h + d / 4 + .12, sg * d / 4, sg * Math.PI / 4), 0, O, roof));
  parts.push(P(T(Box(w + .75, .26, .3), 0, h + d / 2 + .25), 0, O, trim));
  // door, windows (lit), chimney
  parts.push(P(T(Box(1.1, 2, .12), 0, 1, d / 2 + .06), 0, O, '#4a3322'), P(T(Box(1.4, .15, .3), 0, 2.1, d / 2 + .15), 0, O, trim));
  const win = (x, y, z, ry = 0) => parts.push(P(T(Box(.75, .75, .08), x, y, z, 0, ry), 0, O, '#f4d98a', .55), P(T(Box(.9, .1, .14), x, y - .42, z, 0, ry), 0, O, trim));
  for (let f = 0; f < floors; f++) { const y = f ? h * .5 + 1.2 : 1.55; for (const x of [-w / 2 + 1.1, w / 2 - 1.1]) { win(x, y, d / 2 + .05); win(x, y, -d / 2 - .05); } if (f) win(0, y, d / 2 + .05); win(w / 2 + .05, y, 0, Math.PI / 2); win(-w / 2 - .05, y, 0, Math.PI / 2); }
  if (chimney) parts.push(P(T(Box(.7, d / 2 + 1.6, .7), w / 3, h + d / 4 + .5, -d / 4), 0, O, '#7d786e'));
  if (sign) parts.push(P(T(Box(.1, .1, 1.2), w / 2 - .6, 2.7, d / 2 + .6), 0, O, trim), P(T(Box(.08, .8, 1), w / 2 - .6, 2.2, d / 2 + .95), 0, O, sign));
  return build(parts);
}
const lamp = () => build([P(T(Cyl(.08, .11, 3, 6), 0, 1.5), 0, O, '#2a2a30'), P(T(Box(.5, .55, .5), 0, 3.2), 0, O, '#ffcf6a', 1.8), P(T(Cone(.45, .35, 4), 0, 3.6, 0, 0, Math.PI / 4), 0, O, '#2a2a30')]);
const barrel = () => build([P(T(Cyl(.38, .38, .9, 8), 0, .45), 0, O, '#7a5a36'), P(T(Cyl(.4, .4, .08, 8), 0, .2), 0, O, '#3a3a40'), P(T(Cyl(.4, .4, .08, 8), 0, .7), 0, O, '#3a3a40')]);
const crate = () => build([P(T(Box(.8, .8, .8), 0, .4), 0, O, '#9a7a4a'), P(T(Box(.82, .1, .82), 0, .8), 0, O, '#6b4a2e')]);
const bench = () => build([P(T(Box(1.8, .1, .45), 0, .5), 0, O, '#7a5a36'), ...[-.7, .7].map(x => P(T(Box(.1, .5, .4), x, .25), 0, O, '#5a3e28'))]);
const flowers = () => build([P(T(Box(2.2, .3, .9), 0, .15), 0, O, '#6b4a2e'), ...[-.8, -.3, .2, .7].map((x, i) => P(T(Sph(.28, 5, 4), x, .45, (i % 2) * .2 - .1), 0, O, ['#e04a6a', '#ffd34d', '#c88aff', '#ff8a3a'][i], .3))]);
const fence = len => build([...Array(Math.max(2, Math.round(len / 1.2) + 1)).keys()].map(i => P(T(Box(.12, .9, .12), -len / 2 + i * len / Math.max(1, Math.round(len / 1.2)), .45), 0, O, '#8a6a44')).concat([P(T(Box(len, .1, .08), 0, .7), 0, O, '#8a6a44'), P(T(Box(len, .1, .08), 0, .35), 0, O, '#8a6a44')]));
const cart = () => build([P(T(Box(1.6, .5, 2.6), 0, .8), 0, O, '#7a5a36'), ...[-1, 1].map(s => P(T(Cyl(.5, .5, .12, 10), s * .85, .5, -.4, 0, 0, Math.PI / 2), 0, O, '#4a3322')), P(T(Box(.1, .1, 1.8), .3, .6, 2), 0, O, '#5a3e28'), P(T(Dod(.4), 0, 1.3, .3), 0, O, '#c8a050')]);
const tree = () => build([P(T(Cyl(.18, .25, 2.2, 6), 0, 1.1), 0, O, '#5a3e28'), P(T(Dod(1.3), 0, 2.9), 0, O, '#c8782a'), P(T(Dod(.9), .6, 3.5, .3), 0, O, '#d89a3a')]);
const cells = () => build([P(T(Box(9.5, .3, 3.4), 0, .15), 0, O, '#6d685f'), P(T(Box(9.5, .25, 3.4), 0, 2.9), 0, O, '#4a4652'), P(T(Box(9.5, 2.9, .3), 0, 1.45, -1.6), 0, O, '#7d786e'),
  ...[...Array(20).keys()].map(i => P(T(Box(.08, 2.6, .08), -4.6 + i * .48, 1.45, 1.6), 0, O, '#2a2a30')), ...[-2.4, 0, 2.4].map(x => P(T(Box(.15, 2.6, 3.2), x, 1.45), 0, O, '#7d786e')), P(T(Box(9.5, .12, .1), 0, 2.7, 1.6), 0, O, '#2a2a30')]);
const temple = () => build([P(T(Box(7, 5, 10), 0, 2.5), 0, O, '#d8d2c4'), P(T(Box(7.4, .5, 10.4), 0, .25), 0, O, '#9a948a'),
  P(T(Box(6.95, 4.95, 4.95), 0, 5, 0, Math.PI / 4), 0, O, '#d8d2c4'), ...[-1, 1].map(sg => P(T(Box(7.6, .25, 5.4 * 1.414 / 1.414 * 1.05), 0, 5 + 2.5 + .1, sg * 2.5, sg * Math.PI / 4), 0, O, '#3a5a8a')),
  P(T(Box(2.2, 5, 2.2), 0, 8.5, 4), 0, O, '#d8d2c4'), P(T(Cone(1.8, 3, 4), 0, 12.5, 4, 0, Math.PI / 4), 0, O, '#3a5a8a'), P(T(Oct(.5), 0, 14.4, 4), 0, O, '#ffd34d', 1.2),
  P(T(Box(1.6, 2.8, .15), 0, 1.4, 5.05), 0, O, '#4a3322'), ...[-2.5, 2.5].map(x => P(T(Cyl(.35, .4, 4.5, 8), x, 2.25, 5.6), 0, O, '#e8e2d4')), P(T(Box(6.4, .4, 1.6), 0, 4.6, 5.4), 0, O, '#c8c2b4'),
  ...[-2.5, 2.5].flatMap(z => [-1, 1].map(x => P(T(Box(.08, 1.6, .7), x * 3.55, 2.8, z, 0, 0, 0), 0, O, '#8ac0ff', .5)))]);
const bank = () => build([P(T(Box(7, 4.2, 6), 0, 2.1), 0, O, '#c8c2b4'), P(T(Box(7.6, .6, 6.6), 0, 4.5), 0, O, '#9a948a'), P(T(Box(7, .4, 6), 0, 5), 0, O, '#b8b2a4'),
  P(T(Box(6.95, 3, 3), 0, 5.1, 0, Math.PI / 4, 0, 0, 1, .55, 1), 0, O, '#9a948a'), ...[-2.6, -.9, .9, 2.6].map(x => P(T(Cyl(.28, .32, 4, 8), x, 2, 3.6), 0, O, '#e8e2d4')), P(T(Box(7.4, .4, 1.4), 0, 4.2, 3.5), 0, O, '#b8b2a4'),
  P(T(Box(1.4, 2.4, .12), 0, 1.2, 3.02), 0, O, '#3a2a1c'), P(T(Oct(.45), 0, 6.3, 3.3), 0, O, '#ffd34d', 1)]);
// lays out everything inside the walls; returns merged items, and adds collision. tx,tz: town center
export function buildTown(tx, tz, rng, items) {
  const box = (x, z, w, d, ry = 0) => {   // solid collision footprint, rotated
    const c = Math.cos(ry), s = Math.sin(ry), pt = (lx, lz) => [tx + x + lx * c + lz * s, tz + z - lx * s + lz * c];
    const k = [pt(-w / 2, -d / 2), pt(w / 2, -d / 2), pt(w / 2, d / 2), pt(-w / 2, d / 2)];
    for (let i = 0; i < 4; i++) addWall(k[i][0], k[i][1], k[(i + 1) % 4][0], k[(i + 1) % 4][1], .3);
  };
  const put = (geo, x, z, ry = 0, sc = 1) => items.push({ geo, m: mat4(x, 0, z, ry, sc) });
  const HOUSE_COL = [['#d8cdb5', '#8a4a32'], ['#e0d4b8', '#5a6a3a'], ['#cfc2a8', '#6a3a2a'], ['#d4c6ae', '#3a4a6a'], ['#e2d8c4', '#7a5a32']];
  const house = (x, z, ry, o = {}) => { const [wall, roof] = HOUSE_COL[Math.floor(rng() * HOUSE_COL.length)]; const w = o.w || 6, d = o.d || 5; put(houseGeo({ wall, roof, ...o, w, d }), x, z, ry); box(x, z, w, d, ry); };
  // the keep (lord's hall) and the armory beside it, north-west
  put(M.keepGeo('human'), -17, -16, .2, 1.25); box(-17, -16, 6.4, 6.4, .2);
  house(-8, -13, 0, { w: 6, d: 5, h: 3.4, wall: '#8f897c', roof: '#4a4652', stone: true, sign: '#9a2a2a' });
  put(fence(6), -8, -9.3, 0); put(barrel(), -11.5, -9.6); put(crate(), -4.6, -9.8, .3);
  house(-26, -8, Math.PI / 2, { w: 6, d: 5, floors: 2, h: 5.4 }); house(-7, -25, 0, { w: 5.5, d: 5 }); house(-18, -26, .3, { w: 6, d: 5, floors: 2, h: 5.2 });
  // the Watch house and its cells, north-east
  house(12, -13, 0, { w: 10, d: 7, h: 4.4, wall: '#a39d8f', roof: '#2e3a5a', stone: true, chimney: true, sign: '#2e5a9e' });
  put(cells(), 13.5, -22.5, 0); box(13.5, -24.1, 9.5, .3); box(9.1, -22.5, .3, 3.4); box(17.9, -22.5, .3, 3.4); box(13.5, -20.9, 9.5, .2);
  // the temple of the Four, east
  put(temple(), 23, -9, -Math.PI / 2); box(23, -9, 7, 10, -Math.PI / 2); put(flowers(), 18.2, -5, Math.PI / 2); put(flowers(), 18.2, -13, Math.PI / 2);
  // the tavern, south-east: two floors, a sign, tables out front
  house(15, 14, Math.PI, { w: 10, d: 7, floors: 2, h: 5.6, wall: '#d8c4a0', roof: '#6a3a2a', sign: '#c8782a' });
  put(bench(), 12, 8.6); put(bench(), 18, 8.6); put(barrel(), 21, 9.5); put(barrel(), 21.8, 10.4);
  // the bank, south
  put(bank(), 8, 25, Math.PI); box(8, 25, 7, 6, Math.PI);
  house(26, 6, -Math.PI / 2, { w: 6, d: 5 }); house(23, 21, -2.3, { w: 6, d: 5, floors: 2, h: 5.2 });
  // houses and gardens in the south-west, around the crafters' quarter
  house(-27, 7, Math.PI / 2, { w: 6, d: 5 }); house(-8, 27, Math.PI, { w: 6, d: 5, floors: 2, h: 5.2 }); house(-22, 22, 2.3, { w: 5.5, d: 5 });
  put(fence(7), -27, 12, 0); put(flowers(), -24.5, 11, 0); put(tree(), -29, 15); put(tree(), 27, -16); put(tree(), -12, -30);
  // the market square
  put(cart(), -9, 9, 2.4); put(crate(), 10.5, 4.5, .4); put(crate(), 11.2, 5.2); put(barrel(), -11, 1.2);
  for (const [x, z] of [[4, -9], [-4, 9], [4, 9], [-4, -9], [4, -20], [-4, 20], [20, 4], [-20, -4], [4, 30], [-4, -30], [29, -4], [-29, 4]]) put(lamp(), x, z);
  // where people stand
  return {
    bind: { x: -4, z: 5.5 }, armory: { x: -8, z: -8.2 }, vendor: { x: 8.5, z: 7.4 }, quest1: { x: 7, z: -8 }, quest2: { x: -9, z: 13 }, quest3: { x: 17.5, z: -9 }, banker: { x: 8, z: 20.5 },
    jail: { x: 10.8, z: -22.5 }, crafts: { x: -15, z: 15 },
  };
}
