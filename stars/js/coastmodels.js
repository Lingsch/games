// Models for the Saltreach Coast: creatures, the drowned, the fleet's bosses, ships and harbour props.
import * as THREE from './three.js';
import { build, P, T, Box, Cyl, Sph, Cone, Tor, Oct, Dod } from './models.js';
import { figure } from './classmodels.js';
const O = [0, 0, 0], LR = [1, -1], TAU = Math.PI * 2;

// pirates and smugglers: the shared figure in sea-dog colours
export const pirateGeo = (i = 0) => figure({ body: 'leather', head: 'bandana', r: 'curved', l: i % 2 ? 'dagger' : null, sash: true },
  [{ a: '#8a2a22', b: '#3a2a1c', t: '#e0b040', g: '#fff' }, { a: '#2e4a6a', b: '#2a2018', t: '#d8dce4', g: '#fff' }, { a: '#5a3a2a', b: '#2a2018', t: '#c9a060', g: '#fff' }][i % 3], i);
export const smugglerGeo = () => figure({ body: 'leather', head: 'hood', r: 'dagger', l: 'dagger', cape: '#2a2a2e' }, { a: '#3a3a3e', b: '#22222a', t: '#6a5a3a', g: '#fff' }, 2);
export const captainGeo = () => figure({ body: 'leather', head: 'hat', r: 'curved', l: 'sword', cape: '#5a1a14' }, { a: '#5a1a14', b: '#2a1a12', t: '#e0b040', g: '#fff' }, 1);
export const queenGeo = () => figure({ body: 'robe', head: 'hat', r: 'dagger', l: 'orb', cape: '#1a2a3a' }, { a: '#2a3a4a', b: '#1a2430', t: '#e0b040', g: '#8dffef' }, 3);
// the drowned: rags, weed and a lantern-green glow in the eyes
export const drownedGeo = (i = 0) => figure({ body: i === 2 ? 'robe' : 'leather', head: 'cowl', r: i === 1 ? 'skull' : 'curved', l: null },
  [{ a: '#4a5a4a', b: '#2a3a32', t: '#6a7a5a', g: '#8dff9a' }, { a: '#3a4a52', b: '#22303a', t: '#5a6a6a', g: '#7affd8' }, { a: '#3a3a4a', b: '#22222e', t: '#5a8a6a', g: '#9be36b' }][i % 3], 2);
export const admiralGeo = () => figure({ body: 'robe', head: 'horns', r: 'skull', l: 'orb', cape: '#0e1a22' }, { a: '#1a2a3a', b: '#0e1820', t: '#c9a060', g: '#7affd8' }, 2);
export const merfolkGeo = () => build([
  P(T(Cone(.34, 1.0, 8), 0, .5, 0, Math.PI), 0, O, '#3a7a7a'), P(T(Cone(.36, .5, 4), 0, .05, -.15, -.6, Math.PI / 4), 6, [0, .2, 0], '#2a5a6a'),
  P(T(Cyl(.2, .26, .55, 8), 0, 1.25), 0, O, '#4a9a8a'), P(T(Sph(.15), 0, 1.66), 5, [0, 1.52, 0], '#6ab0a0'),
  P(T(Cone(.18, .45, 5), 0, 1.86, -.08, -.4), 5, [0, 1.52, 0], '#2a6a5a'), ...LR.map(s => P(T(Sph(.03, 4, 3), .06 * s, 1.68, .13), 5, [0, 1.52, 0], '#ffd34d', 2)),
  ...LR.map((s, i) => P(T(Cyl(.06, .05, .52), .27 * s, 1.15), 3 + i, [.26 * s, 1.42, 0], '#4a9a8a')),
  P(T(Cyl(.03, .03, 1.9, 5), -.3, 1.15, .2), 4, [-.26, 1.42, 0], '#5a4a32'), ...[-1, 0, 1].map(k => P(T(Cone(.03, .28, 4), -.3 + k * .07, 2.15, .2), 4, [-.26, 1.42, 0], '#c9ccd2')),
]);
export const crabGeo = (big = false) => build([
  P(T(Sph(.55, 9, 6), 0, .45, 0, 0, 0, 0, 1.3, .55, 1), 0, O, big ? '#a8463a' : '#c8583a'), ...LR.map(s => P(T(Sph(.06, 4, 3), .15 * s, .78, .45), 0, O, '#14100c')),
  ...LR.flatMap((s, i) => [0, 1, 2].map(k => P(T(Cyl(.04, .03, .7, 4), .65 * s, .3, -.25 + k * .25, 0, 0, s * 1.1), 1 + i, [.5 * s, .4, 0], '#a8463a'))),
  ...LR.map((s, i) => P(T(Sph(.22, 6, 5), .55 * s, .5, .7, 0, 0, 0, 1, .7, 1.3), 3 + i, [.4 * s, .45, .35], '#d86a4a')),
]);
export const sharkGeo = () => build([
  P(T(Sph(.5, 10, 6), 0, .2, 0, 0, 0, 0, .8, .7, 2.6), 0, O, '#6a7a8a'), P(T(Sph(.45, 8, 5), 0, .05, .1, 0, 0, 0, .7, .4, 2.3), 0, O, '#d8dce4'),
  P(T(Cone(.3, .7, 4), 0, .75, -.1, -.2), 0, O, '#5a6a7a'), ...LR.map(s => P(T(Box(.6, .04, .3), .45 * s, 0, .3, 0, 0, s * .3), 0, O, '#5a6a7a')),
  P(T(Cone(.35, .8, 4), 0, .25, -1.5, -Math.PI / 2, 0, 0, .3, 1, 1), 6, [0, .2, -1.1], '#5a6a7a'), ...LR.map(s => P(T(Sph(.04, 4, 3), .2 * s, .3, 1.05), 0, O, '#14100c')),
]);
export const leviathanGeo = () => build([
  P(T(Sph(2.2, 12, 8), 0, 3.5, 0, 0, 0, 0, 1, 1.3, 1.4), 0, O, '#2a4a5a'), P(T(Sph(1.6, 10, 6), 0, 2.6, 1.4, 0, 0, 0, 1.1, .6, 1), 0, O, '#3a6a6a'),
  ...LR.map(s => P(T(Sph(.35, 6, 5), .9 * s, 4.2, 2.3), 5, [0, 3.5, 1.5], '#ffd34d', 2.5)), P(T(Box(2.4, .3, .9), 0, 2.7, 2.6), 5, [0, 3.5, 1.5], '#14100c'),
  ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * TAU, x = Math.cos(a) * 2.2, z = Math.sin(a) * 1.8; return P(T(Cone(.45, 5, 6), x, 3.2, z, Math.cos(a) * .5, 0, -Math.sin(a) * .5 - .3), 7, [x, 1, z], k % 2 ? '#2a4a5a' : '#3a5a6a'); }),
  ...[0, 1, 2, 3].map(k => P(T(Cone(.25, 1, 4), (k - 1.5) * .9, 5.6, -.4, -.4), 0, O, '#c9ccd2')),
]);
// ships: a ferry with a sail, and a small rowboat
export function shipGeo(sail = '#e8e0c8') {
  return build([
    P(T(Box(3.2, 1.2, 9), 0, .4, 0), 0, O, '#6b4a2e'), P(T(Box(3.4, .25, 9.2), 0, 1.05, 0), 0, O, '#4a3322'), P(T(Cone(1.6, 2.4, 4), 0, .4, 5.6, Math.PI / 2, Math.PI / 4, 0, 1, 1, .5), 0, O, '#6b4a2e'),
    P(T(Box(3, .15, 8.6), 0, .95, 0), 0, O, '#8a6a4a'), P(T(Cyl(.15, .18, 8, 6), 0, 4.8, .5), 0, O, '#5a3e28'),
    P(T(Box(3.6, 3.8, .08), 0, 5.2, .5), 0, O, sail), P(T(Box(2.4, 1.6, .08), 0, 2.6, -3.2), 0, O, sail), P(T(Box(.12, 2.4, .12), 0, 2.2, -3.2), 0, O, '#5a3e28'),
    P(T(Box(.08, 1.2, 1.8), 0, 8.2, .5), 0, O, '#7a1f1c'), ...LR.map(s => P(T(Box(.1, .5, 9), 1.65 * s, 1.35, 0), 0, O, '#4a3322')),
  ]);
}
export function rowboatGeo() {
  return build([P(T(Box(1.6, .5, 4), 0, .2, 0), 0, O, '#7a5a3a'), P(T(Box(1.7, .12, 4.1), 0, .5, 0), 0, O, '#5a3e28'), P(T(Cone(.8, 1, 4), 0, .2, 2.4, Math.PI / 2, Math.PI / 4, 0, 1, 1, .5), 0, O, '#7a5a3a'),
    ...LR.map(s => P(T(Box(.06, .06, 2.4), .9 * s, .6, 0, 0, 0, s * .5), 0, O, '#c9a060'))]);
}
export function dockGeo(len = 14) {
  const parts = [P(T(Box(3, .3, len), 0, 1.0, len / 2), 0, O, '#8a6a4a')];
  for (let k = 0; k <= len; k += 3.5) for (const s of LR) parts.push(P(T(Cyl(.15, .15, 3.4, 5), 1.3 * s, -.6, k), 0, O, '#5a3e28'));
  parts.push(P(T(Cyl(.08, .08, 1.6, 4), 1.3, 1.9, len - .4), 0, O, '#5a3e28'), P(T(Oct(.18), 1.3, 2.8, len - .4), 0, O, '#ffd34d', 2.5));
  return build(parts);
}
export function hutGeo(roof = '#b59a6a') {
  return build([P(T(Box(3.2, 2.2, 3), 0, 1.1, 0), 0, O, '#8a7a5a'), P(T(Cone(2.6, 2, 4), 0, 3.2, 0, 0, Math.PI / 4), 0, O, roof), P(T(Box(.8, 1.4, .05), 0, .7, 1.52), 0, O, '#3b2a1c'),
    ...LR.map(s => P(T(Box(.6, .5, .05), 1 * s, 1.4, 1.52), 0, O, '#2a3a4a'))]);
}
export function palmGeo() {
  const parts = [];
  for (let k = 0; k < 6; k++) parts.push(P(T(Cyl(.2 - k * .02, .22 - k * .02, 1, 6), k * .12, .5 + k * .95, 0, 0, 0, -.12), 0, O, '#8a6a42'));
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; parts.push(P(T(Box(.5, .06, 2.6), .7 + Math.cos(a) * 1.2, 6, Math.sin(a) * 1.2, -.35, -a + Math.PI / 2), 0, O, k % 2 ? '#4a8a3a' : '#5a9a42')); }
  parts.push(...[0, 1, 2].map(k => P(T(Sph(.18, 5, 4), .7 + Math.cos(k * 2) * .25, 5.7, Math.sin(k * 2) * .25), 0, O, '#6b4a2e')));
  return build(parts);
}
export function wreckGeo() {
  return build([P(T(Box(3.6, 2.4, 12), 0, .8, 0, 0, 0, .35), 0, O, '#3a3026'), P(T(Box(3.8, .3, 12.2), .4, 2.1, 0, 0, 0, .35), 0, O, '#2a2218'),
    P(T(Cyl(.2, .25, 7, 6), -.6, 4.2, 1, .3, 0, .5), 0, O, '#2a2218'), P(T(Box(2.5, 2.2, .08), -1.4, 5.4, 1.6, .3, 0, .5), 0, O, '#4a5a4a'),
    ...[-3, 0, 3].map(z => P(T(Dod(.5), 1.2, 2.6, z), 0, O, '#5a7a5a'))]);
}
export const bobberGeo = () => build([P(T(Sph(.12, 6, 4), 0, .1, 0), 0, O, '#ff4a3a'), P(T(Sph(.1, 6, 4), 0, -.02, 0), 0, O, '#ffffff')]);
