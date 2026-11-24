// Build 4: new creatures, story characters and props for the Vale.
import { build, P, T, Box, Cyl, Sph, Cone, Cap, Tor, Oct, Dod } from './models.js';
import { figure } from './classmodels.js';
const O = [0, 0, 0], LR = [1, -1];

// a bristly boar: body 0, legs 1-2, head 5, tail 6
export const boarGeo = (big = false) => { const F = big ? '#4a3428' : '#6a4a34', F2 = '#3a2a20', T2 = '#e8dcc0';
  return build([
    P(T(Cap(.36, .55, 3, 8), 0, .62, 0, Math.PI / 2), 0, O, F), P(T(Box(.12, .22, .8), 0, .98, -.05), 0, O, F2),
    ...[-.3, -.1, .1, .3].map(z => P(T(Cone(.05, .2, 4), 0, 1.05, z, -.3), 0, O, F2)),
    P(T(Box(.34, .32, .38), 0, .66, .56), 5, [0, .7, .4], F), P(T(Cyl(.12, .14, .16, 7), 0, .58, .8, Math.PI / 2), 5, [0, .7, .4], '#c88a7a'),
    ...LR.map(s => P(T(Cone(.035, .22, 4), .13 * s, .62, .76, -.9, 0, .3 * s), 5, [0, .7, .4], T2)),
    ...LR.map(s => P(T(Sph(.035, 5, 4), .12 * s, .78, .72), 5, [0, .7, .4], '#ff6a3a', 2)),
    ...LR.map(s => P(T(Cone(.06, .14, 4), .13 * s, .86, .5, .4), 5, [0, .7, .4], F2)),
    ...[[.17, .3, 1], [-.17, -.3, 1], [-.17, .3, 2], [.17, -.3, 2]].map(([x, z, pt]) => P(T(Cyl(.07, .05, .4, 5), x, .2, z), pt, [x, .42, z], F2)),
    P(T(Cone(.04, .25, 4), 0, .7, -.62, -1.2), 6, [0, .7, -.5], F2)]); };

// a big hairy spider: eight legs split between the two leg groups
export const spiderGeo = () => { const B = '#3a2e2a', B2 = '#5a3e2e', E = '#ff3a3a';
  const legs = [];
  for (let k = 0; k < 4; k++) for (const s of LR) {
    const z = .25 - k * .17, pt = (k + (s > 0 ? 0 : 1)) % 2 ? 1 : 2;
    legs.push(P(T(Cyl(.035, .03, .55, 4), .38 * s, .45, z, 0, 0, -1.0 * s), pt, [.18 * s, .45, z], B), P(T(Cyl(.03, .02, .5, 4), .66 * s, .22, z, 0, 0, .45 * s), pt, [.18 * s, .45, z], B));
  }
  return build([P(T(Sph(.42, 8, 6), 0, .55, -.45, 0, 0, 0, 1, .85, 1.2), 0, O, B), P(T(Sph(.2, 7, 5), 0, .58, -.45, 0, 0, 0, 1.6, .5, 1.9), 0, O, '#8a3a2a'),
    P(T(Sph(.22, 7, 5), 0, .5, .1), 0, O, B2), P(T(Sph(.15, 7, 5), 0, .5, .38), 5, [0, .5, .3], B2),
    ...[-.06, .06].flatMap(x => [P(T(Sph(.035, 4, 3), x, .58, .5), 5, [0, .5, .3], E, 2.5), P(T(Sph(.025, 4, 3), x * 1.8, .54, .48), 5, [0, .5, .3], E, 2.5)]),
    ...LR.map(s => P(T(Cone(.03, .14, 4), .05 * s, .42, .52, 1.2), 5, [0, .5, .3], '#1a1210')), ...legs]); };

// a ghost: a pale floating shape that trails off below the waist
export const ghostGeo = (tint = '#bfe0f0') => build([
  P(T(Cone(.36, 1.1, 9), 0, .75, 0, Math.PI), 0, O, tint, .9), P(T(Sph(.33, 8, 6), 0, 1.3, 0, 0, 0, 0, 1, 1.05, .9), 0, O, tint, .9),
  P(T(Sph(.17, 7, 5), 0, 1.66), 5, [0, 1.5, 0], tint, 1.1), ...LR.map(s => P(T(Sph(.035, 4, 3), .06 * s, 1.68, .14), 5, [0, 1.5, 0], '#1a2a3a')),
  P(T(Box(.08, .03, .02), 0, 1.6, .15), 5, [0, 1.5, 0], '#1a2a3a'),
  ...LR.map(s => P(T(Cyl(.07, .04, .6, 5), .38 * s, 1.15, 0, 0, 0, .5 * s), s > 0 ? 3 : 4, [.3 * s, 1.4, 0], tint, .9))]);

// a harpy: feathered wings for arms, bird legs, a shrieking face
export const harpyGeo = (named = false) => { const F = named ? '#6a2a3a' : '#8a6a4a', F2 = named ? '#3a1220' : '#5a4030', S = '#d8a888';
  return build([
    P(T(Cyl(.18, .22, .62, 7), 0, 1.0), 0, O, F), P(T(Sph(.2, 7, 5), 0, 1.3, .02), 0, O, S),
    P(T(Sph(.14), 0, 1.55), 5, [0, 1.45, 0], S), P(T(Sph(.17, 7, 5), 0, 1.62, -.05), 5, [0, 1.45, 0], F2), P(T(Cone(.03, .1, 4), 0, 1.54, .15, Math.PI / 2), 5, [0, 1.45, 0], '#e0b040'),
    ...LR.map(s => P(T(Sph(.028, 4, 3), .05 * s, 1.58, .12), 5, [0, 1.45, 0], '#ffd34d', 2.5)),
    ...LR.flatMap(s => [P(T(Box(.9, .05, .42), .55 * s, 1.3, -.05, 0, 0, .2 * s), s > 0 ? 3 : 4, [.18 * s, 1.32, 0], F), P(T(Box(.6, .04, .3), .95 * s, 1.25, -.12, 0, 0, .1 * s), s > 0 ? 3 : 4, [.18 * s, 1.32, 0], F2)]),
    ...LR.map(s => P(T(Cyl(.04, .03, .55, 4), .1 * s, .45, 0), s > 0 ? 1 : 2, [.1 * s, .72, 0], '#d8b040')),
    ...LR.map(s => P(T(Box(.14, .04, .2), .1 * s, .18, .05), s > 0 ? 1 : 2, [.1 * s, .72, 0], '#d8b040')),
    P(T(Cone(.12, .5, 5), 0, .7, -.2, -2.6), 6, [0, .8, -.1], F2)]); };

// people built from the shared class figure
const fig = (o, p, sk) => figure(o, p, sk);
export const cultistGeo = (rank = 0) => fig({ body: 'robe', head: rank === 2 ? 'horns' : 'hood', r: rank ? 'skull' : 'dagger', l: rank === 1 ? 'tome' : null },
  [{ a: '#d8d4c8', b: '#8a8478', t: '#3a5a3a', g: '#8dff9a' }, { a: '#c8c0b0', b: '#5a5448', t: '#6a2a6a', g: '#c88aff' }, { a: '#2a2a2e', b: '#1a1a1e', t: '#d8d4c8', g: '#8dff9a' }][rank], rank);
export const villagerGeo = (i = 0) => fig([{ body: 'leather', head: 'hat', r: null, l: null }, { body: 'robe', head: 'bandana', r: null, l: null }, { body: 'leather', head: 'bald', r: 'rod', l: null }, { body: 'robe', head: 'hood', r: 'staff', l: null }][i % 4],
  [{ a: '#7a6a4a', b: '#4a3e2a', t: '#a8442a', g: '#fff' }, { a: '#8a5a6a', b: '#5a3a44', t: '#e8d8a8', g: '#fff' }, { a: '#5a6a3a', b: '#3a4428', t: '#c9a060', g: '#fff' }, { a: '#6a6a7a', b: '#3a3a48', t: '#a8a8b8', g: '#9fe6ff' }][i % 4], i);
// Wick the gravedigger: a shovel and a lantern
export const wickGeo = () => fig({ body: 'leather', head: 'hat', r: 'rod', l: 'orb' }, { a: '#5a5a4a', b: '#3a3a2e', t: '#c8a060', g: '#ffd34d' }, 3);
// the hermit: an old war veteran in a patched cloak with a staff
export const hermitGeo = () => fig({ body: 'robe', head: 'bald', r: 'staff', l: 'tome', cape: '#4a3a2a' }, { a: '#6a5a48', b: '#4a3e30', t: '#c8b080', g: '#9fe6ff' }, 1);
// the Gravelord himself: black and bone, a crown of four colours gone grey
export const gravelordGeo = () => fig({ body: 'robe', head: 'crown', r: 'skull', l: 'staff', cape: '#0e0e12' }, { a: '#16161a', b: '#2a2a30', t: '#d8d0b8', g: '#8dff9a' }, 0);

// ---------- props ----------
export const openGraveGeo = () => build([P(T(Box(1.1, .2, 2.1), 0, .02, 0), 0, O, '#2a2018'), ...LR.map(s => P(T(Box(.35, .35, 2.2), .8 * s, .15, 0), 0, O, '#6a5238')),
  P(T(Box(.7, .9, .16), 0, .45, -1.25, -.12), 0, O, '#8a8680'), P(T(Box(.5, .06, .02), 0, .7, -1.17, -.12), 0, O, '#5a5650'),
  P(T(Cyl(.03, .03, 1.1, 4), .9, .5, .7, .3, 0, .2), 0, O, '#6a4a2a'), P(T(Box(.25, .3, .04), .97, .05, .78, .3, 0, .2), 0, O, '#8a8a8a')]);
export const headstoneGeo = (fallen = false) => build([P(T(Box(.7, .95, .16), 0, fallen ? .1 : .47, 0, fallen ? -1.45 : 0), 0, O, '#8a8680'), P(T(Box(.45, .06, .02), 0, fallen ? .19 : .72, fallen ? .3 : .09, fallen ? -1.45 : 0), 0, O, '#5a5650'),
  P(T(Box(.9, .1, 1.6), 0, .05, fallen ? 0 : .9), 0, O, '#4e6a32')]);
export const loreGeo = () => build([P(T(Cyl(.06, .08, .9, 5), 0, .45), 0, O, '#5a3e28'), P(T(Box(.5, .06, .38), 0, .95, 0, -.4), 0, O, '#5a3e28'),
  P(T(Box(.42, .05, .3), 0, 1.0, 0, -.4), 0, O, '#e8dcb8'), P(T(Oct(.09), 0, 1.35, 0), 0, O, '#ffd34d', 3)]);
export const bellGeo = () => build([...LR.map(s => P(T(Box(.12, 2.2, .12), .6 * s, 1.1, 0), 0, O, '#5a3e28')), P(T(Box(1.5, .14, .16), 0, 2.2, 0), 0, O, '#5a3e28'),
  P(T(Cone(.3, .5, 8), 0, 1.8, 0, Math.PI), 0, O, '#b8902a'), P(T(Sph(.08, 5, 4), 0, 1.5, 0), 0, O, '#8a6a1a')]);
export const wardstoneGeo = () => build([P(T(Box(.6, 2, .5), 0, 1, 0), 0, O, '#6a6670'), P(T(Box(.4, .08, .02), 0, 1.4, .26), 0, O, '#8dc8ff', 2.5), P(T(Box(.4, .08, .02), 0, 1.1, .26), 0, O, '#8dc8ff', 2.5)]);
export const chapelGeo = () => build([P(T(Box(5, 3.4, 7.5), 0, 1.7), 0, O, '#b8ac98'), P(T(Cone(4.6, 2.6, 4), 0, 4.7, 0, 0, Math.PI / 4, 0, 1, 1, 1.5), 0, O, '#5a4a5a'),
  P(T(Box(1.6, 5.5, 1.6), 0, 2.75, 3.6), 0, O, '#b8ac98'), P(T(Cone(1.2, 2, 4), 0, 6.5, 3.6, 0, Math.PI / 4), 0, O, '#5a4a5a'), P(T(Box(1.1, 1.8, .1), 0, .9, 4.42), 0, O, '#3b2a1c'),
  P(T(Box(.12, .9, .1), 0, 7.9, 3.6), 0, O, '#c8a040'), P(T(Box(.5, .12, .1), 0, 8.0, 3.6), 0, O, '#c8a040')]);
export const millGeo = () => build([P(T(Cyl(1.8, 2.3, 5, 8), 0, 2.5), 0, O, '#a89a80'), P(T(Cone(2.4, 2, 8), 0, 6), 0, O, '#6a4a3a'),
  ...[0, 1, 2, 3].map(k => P(T(Box(.5, 4.4, .08), 0, 4.5 + Math.cos(k * Math.PI / 2) * 2.2, 2.45, 0, 0, k * Math.PI / 2), 0, O, '#e8dcc0')), P(T(Cyl(.2, .2, .4, 6), 0, 4.5, 2.3, Math.PI / 2), 0, O, '#5a3e28')]);
export const hermitTowerGeo = () => build([P(T(Cyl(3, 3.6, 13, 10), 0, 6.5), 0, O, '#7a7468'), P(T(Cyl(3.6, 3.6, .6, 10), 0, 13.2), 0, O, '#5e5850'),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => P(T(Box(.8, .9, .6), Math.cos(k * .628) * 3.3, 13.9, Math.sin(k * .628) * 3.3, 0, -k * .628), 0, O, '#6a6458')),
  P(T(Cone(3.2, 3.4, 10), 0, 16.2), 0, O, '#4a3a5a'), P(T(Box(1.3, 2.2, .3), 0, 1.1, 3.45), 0, O, '#3b2a1c'),
  ...[4, 8, 11].map(y => P(T(Box(.6, .9, .2), 0, y, 3.4 - y * .03), 0, O, '#ffd88a', 1.8)), P(T(Cyl(.12, .16, 1.6, 5), 1.8, 16.4, 1.2, 0, 0, -.6), 0, O, '#c8a040')]);
export const shrineGeo = () => build([P(T(Box(1.6, .3, 1.6), 0, .15), 0, O, '#6a6670'), P(T(Box(1, 1.4, .3), 0, 1, 0), 0, O, '#8a8680'),
  ...[0, 1, 2, 3].map(k => P(T(Sph(.1, 5, 4), -.3 + k * .2, 1.85, 0), 0, O, ['#ff7a2a', '#4fb0e8', '#a8834a', '#e0d0ff'][k], 2))]);
