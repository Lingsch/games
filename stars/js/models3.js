// Stars Beneath: the look of the people and creatures. Two thousand years on nobody wears a robe or carries a staff:
// troopers in sealed armor, spacers in flight suits and long coats, blasters, rifles, generator packs and drones.
// One flexible figure (sfig) builds every person; the classes, crew, townsfolk and raiders are all dressed from it.
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import { replaceKinds } from './render.js';
import { CLASSES, GIVERS } from './data.js';
const O = [0, 0, 0], LR = [1, -1], TAU = Math.PI * 2, H2 = Math.PI / 2;
const SKIN = ['#e0b08a', '#c68e62', '#8d5a3b', '#f0c9a6'];
const HAIR = ['#2b1d14', '#5a3e28', '#c8a25a', '#8a8a8a', '#a83a2a', '#e8e2d0'];
const DARK = '#1c2026', METAL = '#8a9098', GUN = '#3a3f46';

function legs(col, boot, w = .11, knee = null) {
  return [...LR.map((s, i) => P(T(Cyl(.085, .075, .62), w * s, .38), 1 + i, [w * s, .72, 0], col)),
    ...LR.map((s, i) => P(T(Box(.15, .15, .27), w * s, .08, .04), 1 + i, [w * s, .72, 0], boot)),
    ...(knee ? LR.map((s, i) => P(T(Box(.13, .14, .1), w * s, .42, .07), 1 + i, [w * s, .72, 0], knee)) : [])];
}
// o: body (armor, suit, coat, wraps) · head (helmet, visor, cap, hood, hat, headset, bald, bare, droid) · r and l (what each hand holds)
// extras: heavy, vest, knee, pack, coils, bandolier, scarf, cloak, drone, pet, arms4, skin, hair · p: a main, b second, t trim, g glow
export function sfig(o, p, sk = 0) {
  const parts = [], add = (...x) => parts.push(...x), A3 = [.26, 1.38, 0], A4 = [-.26, 1.38, 0], HD = [0, 1.44, 0];
  const skin = o.skin || SKIN[sk % 4], hair = o.hair || HAIR[(sk * 3 + 1) % HAIR.length];
  if (o.body === 'armor') {
    add(...legs(p.b, DARK, .12, p.a));
    add(P(T(Box(.44, .26, .3), 0, .86), 0, O, p.b), P(T(Box(.56, .5, .36), 0, 1.2), 0, O, p.a), P(T(Box(.3, .16, .05), 0, 1.27, .19), 0, O, p.t), P(T(Box(.1, .06, .03), 0, 1.12, .19), 0, O, p.g, 2),
      ...LR.map(s => P(T(Box(.2, .16, .3), .36 * s, 1.42), 0, O, p.a)), ...LR.map(s => P(T(Box(.21, .04, .31), .36 * s, 1.33), 0, O, p.t)), P(T(Box(.46, .06, .32), 0, .98), 0, O, DARK));
    if (o.heavy) add(...LR.map(s => P(T(Box(.14, .2, .34), .45 * s, 1.5), 0, O, p.b)), P(T(Box(.5, .14, .3), 0, 1.5, -.08), 0, O, p.b), ...LR.map(s => P(T(Box(.1, .04, .2), .45 * s, 1.61), 0, O, p.g, 1.4)));
  } else if (o.body === 'coat') {
    add(...legs(p.b, DARK, .1));
    add(P(T(Cyl(.2, .23, .6, 8), 0, 1.0), 0, O, p.b), P(T(Box(.5, .6, .3), 0, 1.08, -.03), 0, O, p.a),
      ...LR.map(s => P(T(Box(.2, .64, .05), .15 * s, .56, .13, .05), 0, O, p.a)), P(T(Box(.5, .7, .05), 0, .55, -.18, -.07), 0, O, p.a),
      ...LR.map(s => P(T(Box(.07, .46, .04), .1 * s, 1.12, .14, 0, 0, -.12 * s), 0, O, p.t)), P(T(Box(.42, .06, .28), 0, .82, .02), 0, O, DARK), P(T(Box(.08, .07, .04), 0, .82, .17), 0, O, p.g, 1.2),
      P(T(Box(.3, .1, .2), 0, 1.4, -.06), 0, O, p.a));
  } else if (o.body === 'wraps') {
    add(...legs(p.a, DARK, .11));
    add(P(T(Cyl(.21, .24, .6, 8), 0, .99), 0, O, p.a), P(T(Cyl(.23, .23, .08, 8), 0, .82), 0, O, p.t), P(T(Box(.26, .3, .02), 0, 1.16, .2), 0, O, skin), P(T(Box(.08, .44, .04), .13, .72, .2, 0, 0, .1), 0, O, p.t),
      P(T(Box(.1, .06, .03), 0, .82, .23), 0, O, p.g, 1.4));
  } else { // a flight suit or work overalls
    add(...legs(p.a, DARK, .1, o.knee ? p.b : null));
    add(P(T(Cyl(.2, .24, .6, 8), 0, .99), 0, O, p.a), P(T(Cyl(.225, .225, .07, 8), 0, .8), 0, O, DARK), ...[-.14, .14].map(x => P(T(Box(.09, .11, .07), x, .78, .2), 0, O, p.b)),
      P(T(Box(.05, .5, .03), 0, 1.05, .22), 0, O, p.t), P(T(Cyl(.13, .16, .08, 8), 0, 1.34), 0, O, p.b));
    if (o.vest) add(P(T(Box(.46, .36, .3), 0, 1.14), 0, O, p.b), P(T(Box(.14, .1, .04), -.11, 1.2, .16), 0, O, p.t), P(T(Box(.06, .04, .03), .12, 1.22, .16), 0, O, p.g, 1.6));
  }
  if (o.pack) add(P(T(Box(.36, .44, .2), 0, 1.16, -.27), 0, O, o.pack === true ? p.b : o.pack), P(T(Box(.2, .08, .04), 0, 1.28, -.38), 0, O, p.g, 2),
    ...(o.coils ? LR.map(s => P(T(Cyl(.07, .07, .5, 6), .13 * s, 1.2, -.4), 0, O, p.g, 1.5)) : []));
  if (o.bandolier) add(P(T(Box(.07, .72, .36), 0, 1.06, 0, 0, 0, .72), 0, O, p.t), ...[0, 1, 2].map(k => P(T(Box(.05, .07, .05), -.12 + k * .1, .98 + k * .1, .2), 0, O, p.g, 1)));
  if (o.scarf) add(P(T(Cyl(.17, .19, .1, 8), 0, 1.4), 0, O, o.scarf), P(T(Box(.12, .4, .04), .1, 1.2, -.21, -.1), 0, O, o.scarf));
  if (o.cloak) add(P(T(Box(.5, .9, .04), 0, .98, -.23, -.08), 0, O, o.cloak));
  if (o.drone) add(P(T(Oct(.11), .44, 1.84, -.05), 0, O, METAL), P(T(Sph(.04, 5, 4), .44, 1.84, .07), 0, O, p.g, 2.6), P(T(Cyl(.16, .16, .015, 8), .44, 1.95, -.05), 0, O, DARK));
  if (o.pet) add(P(T(Sph(.09, 6, 5), .3, 1.53, -.02, 0, 0, 0, 1, .8, 1.3), 0, O, '#7ab85a'), ...LR.map(s => P(T(Sph(.022, 4, 3), .3 + .04 * s, 1.56, .09), 0, O, '#ffcf6a', 2.4)), P(T(Cone(.03, .2, 4), .3, 1.5, -.18, -1.2), 0, O, '#5a9a4a'));
  if (o.arms4) add(...LR.map(s => P(T(Cyl(.055, .05, .46), .27 * s, .98, .1, -.5), 0, O, skin)), ...LR.map(s => P(T(Sph(.055, 5, 4), .27 * s, .82, .22), 0, O, skin)));
  // head
  const h = o.head, cap = () => P(T(Sph(.158, 8, 5, 0, TAU, 0, Math.PI * .56), 0, 1.575, -.012), 5, HD, hair);
  if (h !== 'helmet' && h !== 'droid') add(P(T(Sph(.14), 0, 1.56), 5, HD, skin));
  if (h === 'helmet') add(P(T(Sph(.19, 10, 7), 0, 1.58, 0, 0, 0, 0, 1, 1.05, 1.08), 5, HD, p.a), P(T(Box(.3, .09, .08), 0, 1.585, .15), 5, HD, p.g, 2.2), P(T(Box(.06, .14, .34), 0, 1.75, -.02), 5, HD, p.t),
    ...LR.map(s => P(T(Cyl(.05, .05, .06, 6), .19 * s, 1.54, 0, 0, 0, H2), 5, HD, p.b)), P(T(Box(.14, .08, .1), 0, 1.47, .14), 5, HD, p.b));
  else if (h === 'visor') add(cap(), P(T(Box(.3, .07, .1), 0, 1.59, .1), 5, HD, p.g, 2), ...LR.map(s => P(T(Box(.03, .05, .2), .15 * s, 1.59, 0), 5, HD, DARK)));
  else if (h === 'cap') add(P(T(Sph(.165, 8, 5, 0, TAU, 0, Math.PI * .5), 0, 1.6, -.01), 5, HD, p.b), P(T(Box(.22, .02, .14), 0, 1.62, .17), 5, HD, p.b), P(T(Box(.24, .06, .05), 0, 1.68, .11), 5, HD, DARK), ...LR.map(s => P(T(Sph(.035, 5, 4), .06 * s, 1.68, .14), 5, HD, p.g, 1.8)));
  else if (h === 'hood') add(P(T(Sph(.2, 8, 6), 0, 1.6, -.04, 0, 0, 0, 1, 1.08, 1.15), 5, HD, p.b), P(T(Box(.14, .1, .09), 0, 1.5, .12), 5, HD, DARK), ...LR.map(s => P(T(Sph(.036, 5, 4), .06 * s, 1.59, .14), 5, HD, p.g, 2.4)));
  else if (h === 'hat') add(cap(), P(T(Cyl(.32, .32, .03, 12), 0, 1.68), 5, HD, p.b), P(T(Cyl(.15, .17, .16, 8), 0, 1.76), 5, HD, p.b), P(T(Cyl(.172, .172, .04, 8), 0, 1.71), 5, HD, p.t));
  else if (h === 'headset') add(cap(), ...LR.map(s => P(T(Cyl(.05, .05, .05, 6), .15 * s, 1.57, 0, 0, 0, H2), 5, HD, DARK)), P(T(Box(.32, .025, .03), 0, 1.72, 0), 5, HD, DARK), P(T(Box(.02, .02, .14), .14, 1.5, .08), 5, HD, DARK), P(T(Sph(.02, 4, 3), .14, 1.5, .15), 5, HD, p.g, 2.4));
  else if (h === 'bald') add(P(T(Box(.04, .03, .2), .1, 1.68, 0), 5, HD, p.g, 2), P(T(Box(.24, .04, .02), 0, 1.65, .13), 5, HD, p.t));
  else if (h === 'bare') { add(cap()); if (o.tail) add(P(T(Cone(.06, .34, 5), 0, 1.5, -.2, -2.6), 5, HD, hair)); }
  else if (h === 'droid') add(P(T(Box(.26, .24, .26), 0, 1.58), 5, HD, METAL), P(T(Box(.2, .05, .04), 0, 1.6, .13), 5, HD, p.g, 2.6), P(T(Cyl(.012, .012, .2, 4), .1, 1.8, -.05), 5, HD, DARK), P(T(Cyl(.06, .08, .1, 6), 0, 1.42), 0, O, DARK));
  // arms
  const armCol = o.body === 'armor' ? p.b : o.body === 'wraps' ? skin : p.a, glove = o.body === 'wraps' ? p.t : DARK;
  add(...LR.map((s, i) => P(T(Cyl(.065, .055, .52), .27 * s, 1.12), 3 + i, s > 0 ? A3 : A4, armCol)), ...LR.map((s, i) => P(T(Sph(.06, 5, 4), .27 * s, .85), 3 + i, s > 0 ? A3 : A4, glove)));
  if (o.body === 'armor') add(...LR.map((s, i) => P(T(Box(.15, .22, .15), .27 * s, 1.0), 3 + i, s > 0 ? A3 : A4, p.a)));
  if (o.body === 'wraps') add(...LR.map((s, i) => P(T(Cyl(.07, .07, .16, 6), .27 * s, .96), 3 + i, s > 0 ? A3 : A4, p.t)));
  const held = (w, arm) => {
    const pv = arm === 3 ? A3 : A4, x = arm === 3 ? .3 : -.3, sg = Math.sign(x), Q = (g, col, glow = 0) => P(g, arm, pv, col, glow);
    if (w === 'pistol') return [Q(T(Box(.05, .13, .07), x, .82, .1), DARK), Q(T(Box(.06, .08, .3), x, .9, .22), GUN), Q(T(Box(.035, .035, .05), x, .9, .39), p.g, 2.6), Q(T(Box(.065, .03, .12), x, .95, .2), p.t)];
    if (w === 'rifle') return [Q(T(Box(.06, .1, .78), x, .9, .42), GUN), Q(T(Box(.05, .13, .22), x, .87, -.04), p.b), Q(T(Cyl(.028, .028, .22, 6), x, .99, .4, H2), DARK), Q(T(Box(.04, .04, .05), x, .9, .83), p.g, 2.6), Q(T(Box(.05, .14, .07), x, .8, .3), DARK)];
    if (w === 'cannon') return [Q(T(Cyl(.09, .09, .9, 8), x, .9, .42, H2), GUN), Q(T(Box(.15, .15, .32), x, .9, .1), p.b), Q(T(Cyl(.07, .07, .05, 8), x, .9, .88, H2), p.g, 2.6), Q(T(Cyl(.12, .12, .1, 8), x, .76, .22), p.t), ...[.3, .5, .7].map(z => Q(T(Cyl(.1, .1, .03, 8), x, .9, z, H2), p.t))];
    if (w === 'maul') return [Q(T(Box(.04, .04, .9), x, .9, .4), DARK), Q(T(Box(.17, .2, .2), x, .9, .88), METAL), Q(T(Box(.18, .06, .21), x, .9, .88), p.g, 2)];
    if (w === 'hammer') return [Q(T(Box(.05, .05, 1.3), x, .9, .55), DARK), Q(T(Box(.3, .26, .26), x, .9, 1.2), p.b), Q(T(Box(.31, .1, .12), x, .9, 1.2), p.g, 2), Q(T(Box(.08, .08, .1), x, .9, -.12), METAL)];
    if (w === 'shield') return [Q(T(Box(.06, .82, .5), x + .09 * sg, 1.02, .16), p.a), Q(T(Box(.066, .6, .06), x + .09 * sg, .96, .16), p.g, 1.6), Q(T(Box(.066, .12, .32), x + .09 * sg, 1.3, .16), '#2a3a4a'), Q(T(Box(.066, .04, .5), x + .09 * sg, .62, .16), p.t)];
    if (w === 'medkit') return [Q(T(Box(.1, .2, .26), x, .8, .1), '#e8e8e4'), Q(T(Box(.105, .1, .04), x, .8, .1), '#ff4a4a', 1.8), Q(T(Box(.105, .04, .1), x, .8, .1), '#ff4a4a', 1.8), Q(T(Box(.04, .03, .12), x, .92, .1), DARK)];
    if (w === 'injector') return [Q(T(Cyl(.03, .03, .5, 6), x, .9, .3, H2), METAL), Q(T(Cyl(.045, .045, .16, 6), x, .97, .24, H2), p.g, 2.2), Q(T(Cone(.015, .12, 4), x, .9, .6, H2), '#d8dce4'), Q(T(Box(.05, .12, .06), x, .82, .12), DARK)];
    if (w === 'emitter') return [Q(T(Box(.07, .1, .26), x, .9, .2), GUN), Q(T(Cone(.12, .1, 8), x, .9, .38, -H2), METAL), Q(T(Sph(.05, 6, 5), x, .9, .4), p.g, 2.6), Q(T(Box(.05, .12, .06), x, .82, .12), DARK)];
    if (w === 'holoshield') return [Q(T(Cyl(.27, .27, .02, 12), x + .1 * sg, 1.02, .18, 0, 0, H2), p.g, 1.4), Q(T(Box(.06, .08, .1), x + .04 * sg, .9, .1), DARK)];
    if (w === 'controller') return [Q(T(Box(.03, .2, .28), x, .95, .26, -.4), DARK), Q(T(Box(.034, .16, .22), x, .955, .262, -.4), p.g, 1.8)];
    if (w === 'holo') return [Q(T(Oct(.1), x, 1.04, .32), p.g, 2.6), Q(T(Cyl(.14, .14, .012, 10), x, .92, .32), p.g, 1.2), Q(T(Box(.06, .04, .08), x, .86, .1), DARK)];
    if (w === 'amp') return [Q(T(Cone(.12, .26, 8), x, .92, .34, -H2), p.t), Q(T(Box(.05, .12, .06), x, .84, .16), DARK), Q(T(Sph(.03, 5, 4), x, .92, .24), p.g, 2)];
    if (w === 'foil') return [Q(T(Box(.02, .03, .8), x, .88, .46), p.g, .9), Q(T(Sph(.06, 6, 5), x, .88, .06, 0, 0, 0, 1, 1, .6), p.t), Q(T(Box(.03, .04, .12), x, .88, -.02), DARK)];
    if (w === 'knuckles') return [Q(T(Sph(.08, 6, 5), x, .84, .04), p.t), Q(T(Box(.14, .04, .1), x, .84, .08), p.g, 1.8)];
    if (w === 'canister') return [Q(T(Cyl(.08, .08, .24, 8), x, .82, .1), METAL), Q(T(Box(.05, .14, .03), x, .82, .17), p.g, 1.8), Q(T(Cyl(.03, .03, .06, 5), x, .96, .1), DARK)];
    if (w === 'baton') return [Q(T(Box(.035, .035, .6), x, .9, .3), DARK), Q(T(Box(.045, .045, .18), x, .9, .52), p.g, 2)];
    if (w === 'blade') return [Q(T(Box(.03, .08, .62), x, .88, .38), METAL), Q(T(Box(.034, .02, .6), x, .84, .38), p.g, 1.8), Q(T(Box(.12, .03, .05), x, .88, .06), DARK)];
    if (w === 'wrench') return [Q(T(Box(.035, .035, .42), x, .88, .22), METAL), Q(T(Box(.1, .04, .08), x, .88, .45), METAL)];
    if (w === 'slate') return [Q(T(Box(.03, .22, .16), x, .92, .2), DARK), Q(T(Box(.034, .18, .12), x, .92, .2), p.g, 1.2)];
    return [];
  };
  add(...held(o.r, 4), ...held(o.l, 3));
  return build(parts);
}

// ---------- the classes: three colourways each (you, and two for crew and other players) ----------
const pal = (a, b, t, g) => ({ a, b, t, g });
export const LOOKS = {
  bulwark: [{ body: 'armor', head: 'helmet', r: 'maul', l: 'shield', pack: true }, [pal('#5a7a9a', '#2e3e52', '#e8a03a', '#6ad8ff'), pal('#6a7a52', '#363e2a', '#e8e2d0', '#9be36b'), pal('#4a4a52', '#26262c', '#c0392b', '#ff8a5a')]],
  bladewarden: [{ body: 'armor', heavy: true, head: 'helmet', r: 'hammer', l: null, pack: true }, [pal('#8a8f96', '#4a4f56', '#e8b83a', '#ffcf6a'), pal('#9a5a3a', '#4a2e22', '#d8dce4', '#ff8a3a'), pal('#3a5a5a', '#1e3030', '#e8e2d0', '#6affd8')]],
  monk: [{ body: 'wraps', head: 'bald', r: 'knuckles', l: 'knuckles' }, [pal('#c8782a', '#8a4a1a', '#2a2e34', '#ffcf6a'), pal('#d8dce4', '#8a9098', '#2e5a9e', '#6ad8ff'), pal('#3a4a6a', '#22304a', '#e8e2d0', '#ff8ad0')]],
  cleric: [{ body: 'suit', vest: true, head: 'headset', r: 'injector', l: 'medkit', pack: '#e8e8e4' }, [pal('#e8e8e4', '#3a9a9a', '#ff4a4a', '#6affd8'), pal('#d8e0e8', '#4a6a9a', '#ff4a4a', '#9fe6ff'), pal('#e8e0d0', '#6a8a4a', '#ff4a4a', '#c8ff9a')]],
  aegis: [{ body: 'suit', vest: true, knee: true, head: 'visor', r: 'emitter', l: 'holoshield', pack: true, coils: true }, [pal('#3a5a8a', '#22344e', '#d8dce4', '#6ad8ff'), pal('#6a5a3a', '#3a3222', '#e8b83a', '#ffe08a'), pal('#4a6a5a', '#2a3e34', '#d8dce4', '#8affd0')]],
  druid: [{ body: 'coat', head: 'cap', r: 'injector', l: 'canister', pet: true }, [pal('#5a7a4a', '#3a3e2e', '#e8d8a8', '#9be36b'), pal('#8a7a5a', '#4a4232', '#5a9a4a', '#c8ff7a'), pal('#4a6a6a', '#2a3a3a', '#e8c060', '#8dffef')]],
  longwatch: [{ body: 'suit', knee: true, head: 'hood', r: 'rifle', l: null, cloak: '#4a4a3a', bandolier: true }, [pal('#5a6a4a', '#3a4030', '#8a6a3a', '#ffcf6a'), pal('#6a5a4a', '#3a322a', '#a8a090', '#ff8a3a'), pal('#3a4a5a', '#222c36', '#8a9098', '#6ad8ff')]],
  blightblade: [{ body: 'coat', head: 'hat', r: 'pistol', l: 'pistol', bandolier: true }, [pal('#6a4a32', '#3a3430', '#c8a25a', '#9be36b'), pal('#3a3a44', '#26262c', '#8a6a3a', '#c08aff'), pal('#5a3a3a', '#2e2222', '#d8b24a', '#e8e05a')]],
  bard: [{ body: 'coat', head: 'bare', tail: true, r: 'foil', l: 'amp', scarf: '#e8e2d0' }, [pal('#a83a4a', '#3a2a3a', '#e8b83a', '#fff0b0'), pal('#3a6aa8', '#22304a', '#e8e2d0', '#bfe6ff'), pal('#3a8a6a', '#22443a', '#e8b83a', '#c8ffd8')]],
  elementalist: [{ body: 'armor', head: 'helmet', r: 'cannon', l: null, pack: true, coils: true }, [pal('#a8683a', '#4a3226', '#2a2e34', '#ff8a3a'), pal('#4a7a9a', '#263e52', '#d8dce4', '#9fe6ff'), pal('#6a5a8a', '#342c46', '#d8dce4', '#e0d0ff')]],
  binder: [{ body: 'suit', vest: true, head: 'cap', r: 'wrench', l: 'controller', drone: true }, [pal('#c8a03a', '#4a4232', '#2a2e34', '#ffcf6a'), pal('#4a7a8a', '#2a3e46', '#e8e2d0', '#6ad8ff'), pal('#8a5a3a', '#463020', '#d8dce4', '#ff9a3a')]],
  illusionist: [{ body: 'coat', head: 'visor', r: 'holo', l: 'holo' }, [pal('#6a3a9a', '#2e2a3a', '#e0b0ff', '#e0b0ff'), pal('#2e5a8a', '#22303e', '#bfe6ff', '#bfe6ff'), pal('#8a3a6a', '#3a2432', '#ffd0f0', '#ffb0e0')]],
};
const KIND_BASE = { bulwark: 'bulwark', cleric: 'cleric', longwatch: 'archer', elementalist: 'elem' };   // the first four classes keep their old model keys
const HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15], STILL = [0, 0, 0, 0];
const defs = {};
for (const [cls, [o, pals]] of Object.entries(LOOKS)) pals.forEach((p, i) => { defs[(KIND_BASE[cls] || cls) + i] = [sfig(o, p, i + (cls.length % 4)), o.body === 'armor' ? HEAVY : HUM, .05, o.body === 'armor' ? .035 : .03]; });

// ---------- townsfolk, the law, the Rats ----------
const civ = (o, p, sk) => [sfig(o, p, sk), HUM, .05, .03];
Object.assign(defs, {
  // general kinds the engine hands out: guards, shopkeepers, passers-by
  guard: [sfig({ body: 'armor', head: 'helmet', r: 'rifle', l: null }, pal('#3a5a8a', '#22303e', '#e8e2d0', '#6ad8ff'), 1), HEAVY, .05, .035],
  villager0: civ({ body: 'suit', head: 'headset', r: null, l: 'slate' }, pal('#6a7a8a', '#3a444e', '#e8a03a', '#6ad8ff'), 0),
  villager1: civ({ body: 'coat', head: 'hat', r: null, l: null }, pal('#8a7a5a', '#4a4232', '#5a8a4a', '#ffcf6a'), 3),
  villager2: civ({ body: 'suit', vest: true, head: 'bare', r: null, l: null }, pal('#5a4a6a', '#2e2636', '#d8b24a', '#ffcf6a'), 1),
  villager3: civ({ body: 'suit', knee: true, head: 'cap', r: 'wrench', l: null }, pal('#c8782a', '#4a3a2a', '#2a2e34', '#ffcf6a'), 2),
  pirate0: civ({ body: 'coat', head: 'cap', r: null, l: 'slate' }, pal('#3a4a5a', '#22282e', '#e8b83a', '#6ad8ff'), 2),
  pirate1: civ({ body: 'coat', head: 'bare', r: null, l: 'slate', scarf: '#c8782a' }, pal('#5a5248', '#2e2a26', '#c8a25a', '#ffcf6a'), 0),
  pirate2: civ({ body: 'suit', vest: true, head: 'cap', r: 'pistol', l: null, bandolier: true }, pal('#6a4a3a', '#342622', '#8a9098', '#ff8a3a'), 1),
  priest: civ({ body: 'coat', head: 'hood', r: null, l: null, cloak: '#e8e2d0' }, pal('#e8e2d0', '#8a8478', '#d8b24a', '#ffe08a'), 3),
  // the people of Dustfall and Halfway
  n_dekk: civ({ body: 'coat', head: 'hat', r: null, l: 'slate' }, pal('#4a3a4a', '#26202a', '#d8b24a', '#ffcf6a'), 1),
  n_tilly: civ({ body: 'suit', knee: true, head: 'cap', r: 'wrench', l: null, bandolier: true }, pal('#c8782a', '#4a3a2a', '#2a2e34', '#ffcf6a'), 2),
  n_ruth: [sfig({ body: 'armor', head: 'bare', r: 'pistol', l: null, hair: '#8a8a8a' }, pal('#3a5a8a', '#22303e', '#e8e2d0', '#6ad8ff'), 3), HEAVY, .05, .035],
  n_sazz: civ({ body: 'suit', vest: true, head: 'bald', r: null, l: null, arms4: true, skin: '#6aa89a' }, pal('#8a3a4a', '#3a2228', '#e8b83a', '#ffcf6a'), 0),
  n_mabel: civ({ body: 'coat', head: 'hat', r: null, l: 'canister', hair: '#e8e2d0' }, pal('#8a9a6a', '#4a4a3a', '#e8d8a8', '#9be36b'), 3),
  n_juno: civ({ body: 'suit', vest: true, head: 'headset', r: 'wrench', l: null, hair: '#a83a2a' }, pal('#4a7a8a', '#2a3e46', '#e8a03a', '#6ad8ff'), 0),
  n_imre: civ({ body: 'coat', head: 'cap', r: null, l: 'slate', hair: '#8a8a8a' }, pal('#2e4a6a', '#1e2c3a', '#e8b83a', '#6ad8ff'), 1),
  n_clerk: civ({ body: 'suit', head: 'visor', r: null, l: 'slate' }, pal('#d8dce4', '#4a6a9a', '#2e5a9e', '#6ad8ff'), 3),
  n_officer: [sfig({ body: 'armor', heavy: true, head: 'helmet', r: 'rifle', l: null }, pal('#3a3a40', '#1e1e22', '#c0392b', '#ff4a3a'), 0), HEAVY, .05, .035],
  // the Dust Rats: scavenged plate, respirators, whatever shoots
  rat0: [sfig({ body: 'armor', head: 'hood', r: 'baton', l: null }, pal('#8a4a2a', '#3a2a22', '#d8b24a', '#ff8a3a'), 0), HUM, .05, .03],
  rat1: civ({ body: 'suit', vest: true, head: 'hood', r: 'rifle', l: null, bandolier: true }, pal('#5a5a4a', '#2a2a24', '#c8782a', '#ffcf6a'), 1),
  rat2: civ({ body: 'suit', head: 'cap', r: 'injector', l: 'medkit', pack: '#5a3a2a' }, pal('#6a2a2a', '#2a1a1a', '#8dffef', '#8dffef'), 2),
  brute: [sfig({ body: 'armor', heavy: true, head: 'bald', r: 'knuckles', l: 'knuckles', pack: true, coils: true }, pal('#8a4a2a', '#3a2a22', '#d8b24a', '#ff6a2a'), 2), HEAVY, .05, .04],
  captain: civ({ body: 'coat', head: 'bare', tail: true, r: 'pistol', l: 'blade', scarf: '#2a2e34', hair: '#a83a2a' }, pal('#a82a22', '#3a1a16', '#d8b24a', '#ff6a2a'), 3),
});

// ---------- creatures and machines ----------
// the dust jackal: lean, six-legged, built low to the ground
const jackalGeo = (big = false) => { const HIDE = big ? '#6a5a4a' : '#a8885a', BELLY = '#d8c098', PLATE = big ? '#4a4038' : '#7a5a3a', EYE = big ? '#ff5a3a' : '#9be36b', HDP = [0, .74, .4];
  return build([P(T(Sph(.26, 8, 6), 0, .64, 0, 0, 0, 0, 1, .85, 2.4), 0, O, HIDE), P(T(Sph(.2, 7, 5), 0, .54, .05, 0, 0, 0, 1, .7, 2.1), 0, O, BELLY),
    ...[-.34, -.05, .24].map(z => P(T(Box(.3, .08, .2), 0, .86, z, .1), 0, O, PLATE)),
    P(T(Cyl(.12, .16, .3), 0, .76, .5, 1.0), 5, HDP, HIDE), P(T(Box(.2, .16, .34), 0, .82, .74), 5, HDP, HIDE), P(T(Box(.12, .07, .2), 0, .76, .96), 5, HDP, PLATE),
    ...LR.map(s => P(T(Cone(.04, .3, 4), .1 * s, 1.02, .6, -.5), 5, HDP, PLATE)), ...LR.flatMap(s => [P(T(Sph(.03, 5, 4), .09 * s, .88, .86), 5, HDP, EYE, 2.6), P(T(Sph(.022, 5, 4), .1 * s, .82, .78), 5, HDP, EYE, 2.2)]),
    ...[[.17, .42, 1], [-.17, .42, 2], [.2, .02, 2], [-.2, .02, 1], [.17, -.4, 1], [-.17, -.4, 2]].flatMap(([x, z, pt]) => [P(T(Cyl(.045, .03, .56, 5), x, .3, z), pt, [x, .58, z], HIDE), P(T(Box(.08, .04, .12), x, .02, z + .03), pt, [x, .58, z], PLATE)]),
    P(T(Cone(.06, .7, 5), 0, .72, -.82, -1.4), 6, [0, .68, -.5], PLATE)]); };
// the rogue loader (and the Machinist's bulwark drone): a yellow cargo lifter on two stubby legs
const loaderGeo = () => { const Y = '#d8a82a', Y2 = '#8a6a1a', BK = '#22262c';
  return build([...LR.map((s, i) => P(T(Box(.32, .6, .4), .26 * s, .32, 0), 1 + i, [.26 * s, .62, 0], BK)), ...LR.map((s, i) => P(T(Box(.4, .12, .56), .26 * s, .06, .05), 1 + i, [.26 * s, .62, 0], Y2)),
    P(T(Box(.74, .3, .5), 0, .76), 0, O, BK), P(T(Box(1.04, .76, .68), 0, 1.26), 0, O, Y), ...[-.3, 0, .3].map(x => P(T(Box(.12, .78, .7), x, 1.26, 0, 0, 0, .5), 0, O, BK)),
    P(T(Box(.6, .34, .1), 0, 1.36, .34), 0, O, '#2a3a4a'), P(T(Box(.5, .06, .11), 0, 1.24, .345), 0, O, '#ffcf6a', 2),
    P(T(Cyl(.07, .07, .14, 6), .34, 1.72, -.1), 0, O, BK), P(T(Sph(.08, 6, 5), .34, 1.84, -.1), 0, O, '#ff8a2a', 2.6),
    ...LR.map((s, i) => P(T(Box(.26, .8, .3), .7 * s, 1.14), 3 + i, [.62 * s, 1.5, 0], Y2)), ...LR.map((s, i) => P(T(Box(.36, .12, .5), .7 * s, .72, .14), 3 + i, [.62 * s, 1.5, 0], BK)),
    ...LR.flatMap((s, i) => [-1, 1].map(k => P(T(Box(.08, .1, .34), .7 * s + .12 * k, .64, .42), 3 + i, [.62 * s, 1.5, 0], METAL)))]); };
// the Machinist's hover drones, lit by their job
const petDrone = (glow, shell = '#8a9098') => build([P(T(Sph(.4, 9, 7), 0, 1.2, 0, 0, 0, 0, 1, .7, 1.1), 0, O, shell), P(T(Sph(.15, 6, 5), 0, 1.18, .36), 0, O, glow, 2.6), P(T(Cyl(.56, .56, .04, 12), 0, 1.44), 0, O, DARK),
  P(T(Cyl(.04, .04, .3, 4), 0, 1.3), 0, O, DARK), ...LR.map(s => P(T(Box(.1, .1, .5), .36 * s, 1.08, .16), 0, O, glow, 1.2)), P(T(Cone(.12, .3, 5), 0, .9, 0, Math.PI), 0, O, glow, 1.8)]);
// the brood: what a Xenobiologist calls up
const broodGeo = () => { const C1 = '#5a8a4a', C2 = '#3a5a32', HDP = [0, .9, .5];
  return build([P(T(Sph(.5, 9, 7), 0, .8, 0, 0, 0, 0, 1, .8, 1.4), 0, O, C1), ...[-.3, 0, .3].map(z => P(T(Cone(.12, .4, 4), 0, 1.25, z, -.2), 0, O, C2)),
    P(T(Sph(.3, 8, 6), 0, .95, .7), 5, HDP, C1), ...LR.map(s => P(T(Cone(.06, .36, 4), .16 * s, .86, 1.0, H2 + .2), 5, HDP, '#e8e2c0')), ...LR.map(s => P(T(Sph(.05, 5, 4), .14 * s, 1.08, .92), 5, HDP, '#ffcf6a', 2.6)),
    ...[[.36, .4, 1], [-.36, .4, 2], [.4, -.3, 2], [-.4, -.3, 1]].flatMap(([x, z, pt]) => [P(T(Cyl(.09, .06, .7, 5), x, .36, z), pt, [x, .7, z], C2), P(T(Box(.16, .06, .2), x, .03, z + .04), pt, [x, .7, z], '#2a3a26')])]); };
// where you come back: a recovery pod with a beacon on top
const beaconGeo = () => build([P(T(Cyl(.5, .6, .2, 10), 0, .1), 0, O, '#3a3f46'), P(T(Sph(.42, 10, 8), 0, .78, 0, 0, 0, 0, 1, 1.5, 1), 0, O, '#c8d0d8'), P(T(Box(.36, .5, .1), 0, .86, .37), 0, O, '#2a3a4a'), P(T(Box(.3, .06, .11), 0, .58, .375), 0, O, '#9be36b', 2.2),
  P(T(Cyl(.03, .03, .5, 4), 0, 1.6), 0, O, '#3a3f46'), P(T(Oct(.13), 0, 1.92), 0, O, '#6ad8ff', 3), ...LR.map(s => P(T(Box(.08, .5, .3), .44 * s, .5), 0, O, '#e8a03a'))]);
Object.assign(defs, {
  wolf: [jackalGeo(), [.75, 0, 0, .55], .07, .035], bear: [jackalGeo(true), [.6, 0, 0, .5], .08, .04],
  golempet: [loaderGeo(), [.45, .4, 1.6, .15], .05, .04],
  firepet: [petDrone('#ff6a2a'), [0, 0, 0, .3], 0, .03], waterpet: [petDrone('#6affd8', '#e8e8e4'), [0, 0, 0, .3], 0, .03], stormpet: [petDrone('#c0a0ff', '#4a5058'), [0, 0, 0, .35], 0, .03],
  treant: [broodGeo(), [.6, 0, 0, .3], .05, .04], corpse: [beaconGeo(), STILL, 0, .03],
});
replaceKinds(defs);
// the brute strain makes a Xenobiologist bigger, not a different animal
// (the engine draws the 'bear' and 'wolf' kinds for the two strains: both are jackal-kin here)
Object.assign(GIVERS.dekk, { model: 'n_dekk' }); Object.assign(GIVERS.tilly, { model: 'n_tilly' }); Object.assign(GIVERS.ruth, { model: 'n_ruth' }); Object.assign(GIVERS.sazz, { model: 'n_sazz' });
Object.assign(GIVERS.mabel, { model: 'n_mabel' }); Object.assign(GIVERS.juno, { model: 'n_juno' }); Object.assign(GIVERS.imre, { model: 'n_imre' });
export const NPC_KIND = { 'Republic Clerk': 'n_clerk', 'Imperial Attaché': 'n_officer' };
