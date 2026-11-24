// Player-class models, built with the Summoners model kit.
// Parts: 0 body, 1-2 legs, 3 off-hand arm, 4 weapon arm, 5 head. Every class comes in palettes
// so the fake players don't all look alike.
import * as THREE from './three.js';
import { build, P, T, Box, Cyl, Sph, Cone, Cap, Tor, Oct, Dod } from './models.js';
const O = [0, 0, 0], LR = [1, -1], TAU = Math.PI * 2;
const SKIN = ['#e0b08a', '#c68e62', '#8d5a3b', '#f0c9a6'];

function legs(col, boot, w = .11, top = .72) {
  return [...LR.map((s, i) => P(T(Cyl(.085, .075, .62), w * s, .38), 1 + i, [w * s, top, 0], col)),
    ...LR.map((s, i) => P(T(Box(.15, .13, .26), w * s, .07, .04), 1 + i, [w * s, top, 0], boot))];
}

// Bulwark: plate, a tower shield and a flanged mace
export const BULWARK_PAL = [
  { pl: '#aeb7c4', pl2: '#717b8c', cl: '#8a2a22', tr: '#d8b24a' },
  { pl: '#8f969e', pl2: '#565c66', cl: '#2e5a9e', tr: '#c9ccd2' },
  { pl: '#b59a6a', pl2: '#7a6440', cl: '#3e6b34', tr: '#e8d48a' }];
export function bulwarkGeo(p, sk = 0) {
  return build([
    ...legs(p.pl2, p.pl, .12),
    P(T(Box(.46, .3, .3), 0, .84), 0, O, p.cl), P(T(Box(.54, .5, .36), 0, 1.2), 0, O, p.pl),
    P(T(Box(.3, .46, .04), 0, .95, .19), 0, O, p.cl), P(T(Box(.32, .06, .04), 0, 1.3, .19), 0, O, p.tr),
    ...LR.map(s => P(T(Sph(.17, 7, 5), .34 * s, 1.42, 0, 0, 0, 0, 1.3, .8, 1.1), 0, O, p.pl2)),
    P(T(Box(.5, .6, .05), 0, 1.0, -.2), 0, O, p.cl),
    P(T(Cyl(.17, .18, .34, 8), 0, 1.64), 5, [0, 1.46, 0], p.pl), P(T(Box(.22, .035, .02), 0, 1.66, .175), 5, [0, 1.46, 0], '#14100c'),
    P(T(Box(.04, .14, .36), 0, 1.86, 0), 5, [0, 1.46, 0], p.cl),
    ...LR.map((s, i) => P(T(Cyl(.07, .065, .54), .35 * s, 1.1), 3 + i, [.35 * s, 1.38, 0], p.pl2)),
    P(T(Box(.07, .82, .58), .48, 1.02, .16), 3, [.35, 1.38, 0], p.pl), P(T(Box(.075, .7, .46), .49, 1.02, .16), 3, [.35, 1.38, 0], p.cl),
    P(T(Box(.08, .12, .12), .5, 1.05, .16), 3, [.35, 1.38, 0], p.tr),
    P(T(Cyl(.035, .035, .7, 5), -.35, .82, .3, Math.PI / 2), 4, [-.35, 1.38, 0], '#4a3526'),
    P(T(Oct(.13), -.35, .82, .68, 0, 0, 0, 1, 1, 1.3), 4, [-.35, 1.38, 0], '#c9ccd2'),
    P(T(Sph(.06, 5, 4), 0, 1.6, .1), 5, [0, 1.46, 0], SKIN[sk % 4]),
  ]);
}

// High Cleric: layered robes, a tall mitre and a sunburst staff
export const CLERIC_PAL = [
  { rb: '#ece6d4', rb2: '#c9bfa4', tr: '#d8b24a', gl: '#fff2a0' },
  { rb: '#d7dbe6', rb2: '#9aa6c4', tr: '#c9ccd2', gl: '#bfe6ff' },
  { rb: '#e6d2b8', rb2: '#a8463a', tr: '#e8c060', gl: '#ffd27a' }];
export function clericGeo(p, sk = 0) {
  return build([
    ...legs(p.rb2, '#5a3e28', .09, .62).map(x => (x.g.scale(1, .7, 1), x)),
    P(T(Cone(.44, 1.35, 10), 0, .72), 0, O, p.rb), P(T(Cone(.34, .9, 10), 0, 1.05), 0, O, p.rb2),
    P(T(Box(.16, 1.0, .03), 0, .75, .33), 0, O, p.tr), P(T(Tor(.39, .035, 4, 14), 0, .2, 0, Math.PI / 2), 0, O, p.tr),
    P(T(Box(.42, .38, .28), 0, 1.25), 0, O, p.rb), ...LR.map(s => P(T(Sph(.13, 6, 4), .24 * s, 1.42), 0, O, p.rb2)),
    P(T(Sph(.14), 0, 1.6), 5, [0, 1.46, 0], SKIN[sk % 4]),
    P(T(Cone(.15, .42, 4), 0, 1.92, -.01, 0, Math.PI / 4), 5, [0, 1.46, 0], p.rb), P(T(Box(.035, .3, .02), 0, 1.88, .1), 5, [0, 1.46, 0], p.tr),
    ...LR.map((s, i) => P(T(Cyl(.075, .1, .52), .28 * s, 1.14), 3 + i, [.27 * s, 1.38, 0], p.rb)),
    P(T(Cyl(.028, .028, 2.0, 5), -.3, 1.08, .14), 4, [-.27, 1.38, 0], '#6b4a2e'),
    P(T(Tor(.17, .03, 4, 12), -.3, 2.1, .14), 4, [-.27, 1.38, 0], p.tr, 1.4),
    P(T(Oct(.09), -.3, 2.1, .14), 4, [-.27, 1.38, 0], p.gl, 2.6),
  ]);
}

// Longwatch: hooded leathers, a cloak, a longbow
export const ARCHER_PAL = [
  { lt: '#5a7a3a', lt2: '#3e5228', hd: '#2f4422', br: '#6b4a2e' },
  { lt: '#7a5a3a', lt2: '#523a26', hd: '#3a2a1c', br: '#4a3322' },
  { lt: '#4a5a6a', lt2: '#2f3a46', hd: '#232c36', br: '#7a5a3a' }];
export function archerGeo(p, sk = 0) {
  return build([
    ...legs(p.lt2, '#3b2a1c', .1),
    P(T(Cyl(.2, .24, .6, 8), 0, .99), 0, O, p.lt), P(T(Cyl(.22, .22, .06, 8), 0, .8), 0, O, p.br),
    P(T(Box(.46, .9, .04), 0, .95, -.2, -.08), 0, O, p.hd),
    P(T(Cyl(.07, .07, .55, 6), -.12, 1.15, -.24, .25), 0, O, p.br), ...[-.05, 0, .05].map(o => P(T(Box(.02, .14, .02), -.12 + o, 1.48, -.18), 0, O, '#e8e0c8')),
    P(T(Sph(.14), 0, 1.5), 5, [0, 1.38, 0], SKIN[sk % 4]),
    P(T(Sph(.18, 8, 6), 0, 1.54, -.05, 0, 0, 0, 1, 1.05, 1.15), 5, [0, 1.38, 0], p.hd), P(T(Cone(.12, .26, 6), 0, 1.7, -.17, -.7), 5, [0, 1.38, 0], p.hd),
    ...LR.map((s, i) => P(T(Cyl(.055, .05, .5), .25 * s, 1.08), 3 + i, [.25 * s, 1.32, 0], p.lt)),
    P(new THREE.TorusGeometry(.55, .025, 3, 12, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2).translate(.3, 1.0, .32), 3, [.25, 1.32, 0], p.br),
    P(T(Box(.01, 1.08, .01), .3, 1.0, .32), 3, [.25, 1.32, 0], '#e8e0c8'),
    P(T(Box(.02, .02, .55), -.25, .9, .25), 4, [-.25, 1.32, 0], '#8a6a4a'),
  ]);
}

// Elementalist: hooded robe in the school colours, a staff with a four-element crown
export const ELEM_PAL = [
  { rb: '#7a1f1c', rb2: '#4a1412', tr: '#e0b040', orb: '#ff8a3a' },
  { rb: '#1f3f7a', rb2: '#142a52', tr: '#9fe6ff', orb: '#7fd4ff' },
  { rb: '#3f4a2a', rb2: '#2a3220', tr: '#d8c060', orb: '#c8ff7a' }];
export function elemGeo(p, sk = 0) {
  return build([
    ...legs(p.rb2, '#2b1d14', .09, .62).map(x => (x.g.scale(1, .7, 1), x)),
    P(T(Cone(.46, 1.4, 10), 0, .74), 0, O, p.rb), P(T(Tor(.42, .035, 4, 14), 0, .2, 0, Math.PI / 2), 0, O, p.tr),
    P(T(Box(.4, .36, .28), 0, 1.25), 0, O, p.rb2), P(T(Box(.1, .9, .02), 0, .8, .33), 0, O, p.tr),
    P(T(Sph(.135), 0, 1.58), 5, [0, 1.44, 0], SKIN[sk % 4]),
    P(T(Sph(.2, 8, 6), 0, 1.62, -.04, 0, 0, 0, 1, 1.1, 1.15), 5, [0, 1.44, 0], p.rb), P(T(Cone(.16, .36, 6), 0, 1.86, -.12, -.5), 5, [0, 1.44, 0], p.rb),
    P(T(Sph(.11), 0, 1.55, .08), 5, [0, 1.44, 0], '#140e0c'),
    ...LR.map(s => P(T(Sph(.025, 4, 3), .045 * s, 1.58, .17), 5, [0, 1.44, 0], p.orb, 2.5)),
    ...LR.map((s, i) => P(T(Cyl(.075, .11, .5), .27 * s, 1.14), 3 + i, [.26 * s, 1.38, 0], p.rb)),
    P(T(Cyl(.03, .025, 2.1, 5), -.3, 1.1, .14), 4, [-.26, 1.38, 0], '#3b2a1c'),
    ...[0, 1, 2, 3].map(k => P(T(Cone(.03, .22, 4), -.3 + Math.cos(k * TAU / 4) * .1, 2.22, .14 + Math.sin(k * TAU / 4) * .1), 4, [-.26, 1.38, 0], p.tr)),
    P(T(Sph(.1, 8, 6), -.3, 2.24, .14), 4, [-.26, 1.38, 0], p.orb, 2.8),
  ]);
}

// bandits for the road
export function banditGeo(sk = 0, cloth = '#6a3a2a') {
  return build([
    ...legs('#3b2a1c', '#2b1d14', .1),
    P(T(Cyl(.21, .25, .62, 8), 0, .98), 0, O, cloth), P(T(Box(.42, .28, .26), 0, 1.2), 0, O, '#5a4632'),
    P(T(Sph(.14), 0, 1.5), 5, [0, 1.38, 0], SKIN[sk % 4]), P(T(Box(.3, .1, .05), 0, 1.47, .12), 5, [0, 1.38, 0], '#2a1a14'),
    P(T(Sph(.165, 8, 5), 0, 1.56, -.02, 0, 0, 0, 1, .7, 1), 5, [0, 1.38, 0], '#3a2a20'),
    ...LR.map((s, i) => P(T(Cyl(.055, .05, .5), .25 * s, 1.08), 3 + i, [.25 * s, 1.32, 0], cloth)),
    P(T(Box(.03, .05, .55), -.25, .84, .3), 4, [-.25, 1.32, 0], '#c9ccd2'), P(T(Box(.14, .03, .04), -.25, .84, .04), 4, [-.25, 1.32, 0], '#5a3e28'),
    P(T(Box(.02, .03, .3), .25, .84, .2), 3, [.25, 1.32, 0], '#c9ccd2'),
  ]);
}

// the corpse marker: a little cairn with a lantern
export function corpseGeo() {
  return build([...[0, 1, 2, 3, 4].map(k => P(T(Dod(.28 - k * .03), Math.cos(k * 2.3) * .2, .2 + k * .22, Math.sin(k * 2.3) * .2), 0, O, '#8a8478')),
    P(T(Cyl(.03, .03, 1.4, 4), .45, .7, 0), 0, O, '#3b2a1c'), P(T(Oct(.12), .45, 1.45, 0), 0, O, '#8dffef', 3)]);
}

// ---------- the other twelve classes ----------
// One flexible figure: body (plate, leather, robe, gi), headgear, a weapon in each hand, a cape or sash.
// Palette: a main, b second, t trim, g glow.
export function figure(o, p, sk = 0) {
  const parts = [], A3 = [.26, 1.38, 0], A4 = [-.26, 1.38, 0], HD = [0, 1.44, 0];
  const add = (...x) => parts.push(...x);
  const skin = SKIN[sk % 4];
  // legs and body
  if (o.body === 'robe') {
    add(...legs(p.b, '#2b1d14', .09, .62).map(x => (x.g.scale(1, .7, 1), x)));
    add(P(T(Cone(.45, 1.38, 10), 0, .73), 0, O, p.a), P(T(Tor(.41, .035, 4, 14), 0, .2, 0, Math.PI / 2), 0, O, p.t), P(T(Box(.4, .36, .28), 0, 1.25), 0, O, p.b), P(T(Box(.1, .95, .02), 0, .78, .33), 0, O, p.t));
  } else if (o.body === 'plate') {
    add(...legs(p.b, p.a, .12));
    add(P(T(Box(.46, .3, .3), 0, .84), 0, O, p.c || p.b), P(T(Box(.52, .5, .34), 0, 1.2), 0, O, p.a), P(T(Box(.32, .06, .04), 0, 1.3, .18), 0, O, p.t),
      ...LR.map(s => P(T(Sph(.16, 7, 5), .33 * s, 1.42, 0, 0, 0, 0, 1.25, .8, 1.1), 0, O, p.b)));
  } else if (o.body === 'gi') {
    add(...legs(p.a, '#3b2a1c', .11));
    add(P(T(Cyl(.21, .25, .62, 8), 0, .98), 0, O, p.a), P(T(Cyl(.23, .23, .09, 8), 0, .86), 0, O, p.t), P(T(Box(.1, .5, .05), .12, .75, .2, 0, 0, .1), 0, O, p.t),
      P(T(Box(.3, .3, .02), 0, 1.15, .2), 0, O, skin));
  } else { // leather
    add(...legs(p.b, '#3b2a1c', .1));
    add(P(T(Cyl(.2, .24, .6, 8), 0, .99), 0, O, p.a), P(T(Cyl(.22, .22, .06, 8), 0, .8), 0, O, p.t));
    if (o.vials) add(...[-.12, 0, .12].map((x, k) => P(T(Cyl(.035, .035, .12, 5), x, .8, .23), 0, O, p.g, 1.5)));
  }
  if (o.cape) add(P(T(Box(.46, .95, .04), 0, .95, -.21, -.08), 0, O, o.cape === true ? p.b : o.cape));
  if (o.sash) add(P(T(Box(.06, .7, .5), .0, 1.05, 0, 0, 0, .7), 0, O, p.t));
  // head
  add(P(T(Sph(.14), 0, 1.56), 5, HD, skin));
  const h = o.head;
  if (h === 'helm') add(P(T(Cyl(.17, .18, .34, 8), 0, 1.62), 5, HD, p.a), P(T(Box(.22, .035, .02), 0, 1.64, .175), 5, HD, '#14100c'), P(T(Cone(.08, .45, 5), 0, 1.95, -.05, -.3), 5, HD, p.t));
  else if (h === 'hood' || h === 'mask') { add(P(T(Sph(.19, 8, 6), 0, 1.6, -.04, 0, 0, 0, 1, 1.08, 1.15), 5, HD, p.b), P(T(Cone(.13, .3, 6), 0, 1.8, -.16, -.6), 5, HD, p.b)); if (h === 'mask') add(P(T(Box(.26, .1, .05), 0, 1.53, .13), 5, HD, '#14100c')); }
  else if (h === 'cowl') add(P(T(Sph(.2, 8, 6), 0, 1.6, -.04, 0, 0, 0, 1, 1.1, 1.15), 5, HD, p.a), P(T(Sph(.11), 0, 1.53, .08), 5, HD, '#140e0c'), ...LR.map(s => P(T(Sph(.025, 4, 3), .045 * s, 1.56, .17), 5, HD, p.g, 2.5)));
  else if (h === 'bandana') add(P(T(Cyl(.15, .15, .07, 8), 0, 1.64), 5, HD, p.t), P(T(Cone(.06, .5, 4), 0, 1.5, -.25, -2.5), 5, HD, '#2a1a14'));
  else if (h === 'hat') add(P(T(Cyl(.3, .3, .03, 10), 0, 1.68), 5, HD, p.b), P(T(Cyl(.13, .15, .2, 8), 0, 1.78), 5, HD, p.b), P(T(Cone(.04, .55, 4), .1, 1.95, -.08, -.5, 0, -.4), 5, HD, p.t));
  else if (h === 'pointed') add(P(T(Cyl(.3, .3, .03, 10), 0, 1.68), 5, HD, p.a), P(T(Cone(.16, .7, 8), 0, 2.03, -.03, -.15), 5, HD, p.a), P(T(Oct(.05), 0, 1.8, .13), 5, HD, p.g, 2.5));
  else if (h === 'antlers') add(P(T(Sph(.16, 7, 5), 0, 1.62, -.03), 5, HD, '#5a3e28'), ...LR.flatMap(s => [P(T(Cyl(.025, .035, .45, 4), .14 * s, 1.9, 0, 0, 0, -.5 * s), 5, HD, '#e2d6b5'), P(T(Cyl(.02, .025, .2, 4), .26 * s, 2.0, .05, .4, 0, .2 * s), 5, HD, '#e2d6b5')]));
  else if (h === 'horns') add(P(T(Sph(.19, 8, 6), 0, 1.6, -.04, 0, 0, 0, 1, 1.08, 1.15), 5, HD, p.a), P(T(Sph(.11), 0, 1.53, .08), 5, HD, '#140e0c'), ...LR.map(s => P(T(Cone(.05, .35, 5), .16 * s, 1.85, -.02, 0, 0, -.6 * s), 5, HD, '#e2d6b5')), ...LR.map(s => P(T(Sph(.025, 4, 3), .045 * s, 1.56, .17), 5, HD, p.g, 2.5)));
  else if (h === 'circlet') add(P(T(Sph(.15, 7, 5), 0, 1.6, -.04, 0, 0, 0, 1, .9, 1), 5, HD, '#e8d8a8'), P(T(Tor(.15, .02, 4, 12), 0, 1.66, 0, Math.PI / 2), 5, HD, p.t), P(T(Oct(.05), 0, 1.68, .15), 5, HD, p.g, 2.5));
  else if (h === 'flowers') add(P(T(Sph(.155, 7, 5), 0, 1.6, -.04), 5, HD, '#6b4a2e'), ...[0, 1, 2, 3, 4].map(k => P(T(Sph(.045, 5, 4), Math.cos(k * 1.26) * .15, 1.7, Math.sin(k * 1.26) * .15), 5, HD, k % 2 ? p.g : '#ffd34d', 1.2)));
  else if (h === 'crown') add(P(T(Sph(.15, 7, 5), 0, 1.6, -.04), 5, HD, '#2b1d14'), P(T(Tor(.15, .025, 4, 12), 0, 1.68, 0, Math.PI / 2), 5, HD, p.t),
    ...['#ff7a2a', '#4fb0e8', '#a8834a', '#e0d0ff'].map((c, k) => P(T(Sph(.045, 5, 4), Math.cos(k * 1.57) * .16, 1.75, Math.sin(k * 1.57) * .16), 5, HD, c, 2.5)));
  else if (h === 'bald') add(P(T(Sph(.145), 0, 1.6), 5, HD, skin), P(T(Box(.22, .04, .02), 0, 1.66, .13), 5, HD, p.t));
  // arms
  const armCol = o.body === 'gi' ? skin : o.body === 'plate' ? p.b : p.a;
  add(...LR.map((s, i) => P(T(Cyl(o.body === 'robe' ? .075 : .06, o.body === 'robe' ? .1 : .055, .52), .27 * s, 1.12), 3 + i, s > 0 ? A3 : A4, armCol)));
  if (o.body === 'gi') add(...LR.map((s, i) => P(T(Cyl(.065, .065, .14, 6), .27 * s, .9), 3 + i, s > 0 ? A3 : A4, p.t)));
  const held = (w, arm) => {
    const pv = arm === 3 ? A3 : A4, x = arm === 3 ? .3 : -.3;
    if (w === 'sword') return [P(T(Box(.04, .06, .7), x, .86, .38), arm, pv, '#c9ccd2'), P(T(Box(.18, .03, .05), x, .86, .05), arm, pv, p.t)];
    if (w === 'curved') return [P(T(Box(.035, .07, .65), x, .86, .36, -.15), arm, pv, '#d8dce4'), P(T(Box(.15, .03, .05), x, .86, .05), arm, pv, p.t)];
    if (w === 'dagger') return [P(T(Box(.03, .05, .36), x, .86, .22), arm, pv, o.glowBlade ? p.g : '#c9ccd2', o.glowBlade ? 1.5 : 0), P(T(Box(.1, .03, .04), x, .86, .05), arm, pv, '#3b2a1c')];
    if (w === 'greatsword') return [P(T(Box(.06, .09, 1.45), x, .86, .7), arm, pv, '#c9ccd2'), P(T(Box(.32, .04, .06), x, .86, -.02), arm, pv, p.t), P(T(Cyl(.03, .03, .3, 4), x, .86, -.18, Math.PI / 2), arm, pv, '#3b2a1c')];
    if (w === 'staff') return [P(T(Cyl(.03, .025, 2.0, 5), x, 1.08, .14), arm, pv, '#5a3e28'), P(T(Oct(.1), x, 2.12, .14), arm, pv, p.g, 2.6)];
    if (w === 'gnarled') return [P(T(Cyl(.04, .03, 2.0, 5), x, 1.08, .14, 0, 0, .05), arm, pv, '#4a3322'), ...[0, 1, 2].map(k => P(T(Cone(.05, .22, 4), x + Math.cos(k * 2.1) * .1, 2.1, .14 + Math.sin(k * 2.1) * .1), arm, pv, '#5e9a3a')), P(T(Sph(.07), x, 2.08, .14), arm, pv, p.g, 2.2)];
    if (w === 'skull') return [P(T(Cyl(.03, .025, 2.0, 5), x, 1.08, .14), arm, pv, '#2b1d14'), P(T(Sph(.11, 6, 5), x, 2.14, .14), arm, pv, '#ebdfc2'), ...LR.map(s => P(T(Sph(.025, 4, 3), x + .04 * s, 2.15, .24), arm, pv, p.g, 3))];
    if (w === 'rod') return [P(T(Cyl(.025, .025, 1.0, 5), x, .9, .3, .5), arm, pv, p.t), P(T(Oct(.08), x, 1.2, .72), arm, pv, p.g, 2.6)];
    if (w === 'orb') return [P(T(Sph(.12, 8, 6), x, .9, .3), arm, pv, p.g, 2.4)];
    if (w === 'tome') return [P(T(Box(.06, .26, .2), x, .9, .25), arm, pv, p.b), P(T(Box(.065, .22, .02), x, .9, .36), arm, pv, p.t)];
    if (w === 'buckler') return [P(T(Cyl(.24, .24, .05, 10), x + .06 * Math.sign(x), 1.0, .15, 0, 0, Math.PI / 2), arm, pv, p.t), P(T(Oct(.07), x + .1 * Math.sign(x), 1.0, .15), arm, pv, p.g, 2)];
    if (w === 'lute') return [P(T(Sph(.2, 8, 6), x, .95, .25, 0, 0, 0, 1, 1.3, .5), arm, pv, '#8a5a2e'), P(T(Box(.05, .5, .04), x, 1.32, .25), arm, pv, '#5a3e28')];
    if (w === 'wraps') return [P(T(Sph(.075, 6, 5), x, .84, .04), arm, pv, p.t)];
    return [];
  };
  add(...held(o.r, 4), ...held(o.l, 3));
  if (o.back === 'lute') add(P(T(Sph(.2, 8, 6), 0, 1.2, -.27, 0, 0, .5, 1, 1.3, .5), 0, O, '#8a5a2e'));
  return build(parts);
}
export const NEW_CLASS_LOOKS = {
  wardancer: [{ body: 'leather', head: 'bandana', r: 'curved', l: 'curved', sash: true }, [{ a: '#8a2a22', b: '#4a1a14', t: '#e0b040', g: '#ffd34d' }, { a: '#1f6a6a', b: '#123e3e', t: '#d8dce4', g: '#7fe8e0' }, { a: '#5a3a6a', b: '#2e1e38', t: '#e0b040', g: '#ffb0ff' }]],
  bladewarden: [{ body: 'plate', head: 'helm', r: 'greatsword', l: null, cape: true }, [{ a: '#b8bec8', b: '#6a707c', c: '#2e3a5a', t: '#d8b24a', g: '#fff' }, { a: '#8a7a6a', b: '#4a4038', c: '#6a2a22', t: '#c9ccd2', g: '#fff' }, { a: '#6a7a8a', b: '#3a4450', c: '#2e4a2e', t: '#e8d48a', g: '#fff' }]],
  monk: [{ body: 'gi', head: 'bald', r: 'wraps', l: 'wraps' }, [{ a: '#d8a040', b: '#a86a20', t: '#7a1f1c', g: '#fff' }, { a: '#e8e2d0', b: '#b8b0a0', t: '#2a2a2a', g: '#fff' }, { a: '#3a5a8a', b: '#22385a', t: '#e8e2d0', g: '#fff' }]],
  aegis: [{ body: 'robe', head: 'circlet', r: 'rod', l: 'buckler' }, [{ a: '#e8eef8', b: '#8aa6d0', t: '#d8b24a', g: '#9fe6ff' }, { a: '#f0e6d0', b: '#c8a060', t: '#e8e2d0', g: '#ffe08a' }, { a: '#d8e8e0', b: '#5a9a8a', t: '#c9ccd2', g: '#a8ffe8' }]],
  lifebinder: [{ body: 'robe', head: 'flowers', r: 'gnarled', l: null }, [{ a: '#5a8a3a', b: '#3a5a26', t: '#e0c070', g: '#ff9ad0' }, { a: '#8aa84a', b: '#5a6a2a', t: '#f0e0a0', g: '#ffe08a' }, { a: '#3a7a6a', b: '#265046', t: '#d8c060', g: '#c8ffb0' }]],
  druid: [{ body: 'leather', head: 'antlers', r: 'gnarled', l: null, cape: '#5a3e28' }, [{ a: '#6a5a3a', b: '#4a3e28', t: '#5e9a3a', g: '#ffb43a' }, { a: '#4a5a3a', b: '#2e3a26', t: '#a8834a', g: '#c8ff7a' }, { a: '#7a6a5a', b: '#4a4036', t: '#6aa844', g: '#8dffef' }]],
  knifeshade: [{ body: 'leather', head: 'mask', r: 'dagger', l: 'dagger', cape: true }, [{ a: '#2e2a34', b: '#1a181e', t: '#8a2a22', g: '#ff5a48' }, { a: '#3a3a3a', b: '#1e1e1e', t: '#7a7a8a', g: '#c0c0ff' }, { a: '#3a2a22', b: '#1e1612', t: '#a8834a', g: '#ffd34d' }]],
  blightblade: [{ body: 'leather', head: 'hood', r: 'dagger', l: 'dagger', vials: true, glowBlade: true }, [{ a: '#3a4a2a', b: '#26301c', t: '#6a5a3a', g: '#9be36b' }, { a: '#4a3a4a', b: '#2e222e', t: '#5a4a3a', g: '#c08aff' }, { a: '#3a3a2a', b: '#22221a', t: '#6a5a3a', g: '#e8e05a' }]],
  bard: [{ body: 'leather', head: 'hat', r: 'sword', l: 'lute', cape: true }, [{ a: '#a8463a', b: '#6a2a22', t: '#e0b040', g: '#fff' }, { a: '#3a6aa8', b: '#22406a', t: '#e8e2d0', g: '#fff' }, { a: '#6a8a3a', b: '#3e5222', t: '#e0b040', g: '#fff' }]],
  warlock: [{ body: 'robe', head: 'horns', r: 'skull', l: 'tome' }, [{ a: '#3a2d47', b: '#221a2c', t: '#8dff5a', g: '#8dff5a' }, { a: '#4a1a22', b: '#2a0e14', t: '#c08aff', g: '#c08aff' }, { a: '#2a2a3a', b: '#16161e', t: '#ff7a2a', g: '#ff7a2a' }]],
  binder: [{ body: 'robe', head: 'crown', r: 'rod', l: 'tome' }, [{ a: '#5a4a6a', b: '#3a2e46', t: '#d8b24a', g: '#ffd34d' }, { a: '#2e4a5a', b: '#1e303a', t: '#c9ccd2', g: '#9fe6ff' }, { a: '#5a3a2a', b: '#3a2418', t: '#e8c060', g: '#ff9a3a' }]],
  illusionist: [{ body: 'robe', head: 'pointed', r: 'rod', l: 'orb' }, [{ a: '#6a3a9a', b: '#42245e', t: '#e0b0ff', g: '#e0b0ff' }, { a: '#2e5a8a', b: '#1c3858', t: '#bfe6ff', g: '#bfe6ff' }, { a: '#8a3a6a', b: '#5a2244', t: '#ffd0f0', g: '#ffb0e0' }]],
};
export function classGeo(cls, i) { const [o, pals] = NEW_CLASS_LOOKS[cls]; return figure(o, pals[i], i + 1); }
