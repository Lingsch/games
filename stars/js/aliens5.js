// Stars Beneath, Build 5: alien life. Nothing out here is a wolf, a bear, a spider or a wasp, and the dead do not walk
// around in rags. Every creature the old world lent this one is rebuilt as something that evolved somewhere else:
// eyeless lurchers with split jaws, shell-backed maulers, stilt-walking striders, crystal-backed skitters,
// segmented crawlers, glass rays and gas-bag floaters. The risen dead are corpses in the armor they died in.
import { build, P, T, Box, Cyl, Cone, Sph, Oct, Dod } from './models.js';
import { replaceKinds, addKinds } from './render.js';
import { MOBS, PETS } from './data.js';
import { sfig } from './models3.js';
const O = [0, 0, 0], LR = [1, -1], TAU = Math.PI * 2, H2 = Math.PI / 2;
const C = (hide, belly, plate, glow) => ({ hide, belly, plate, glow });

// the lurcher: eyeless, split-jawed, a row of light sacs down the spine and two feelers that taste the air
export const houndGeo = c => { const HD = [0, .74, .46];
  return build([P(T(Sph(.3, 9, 7), 0, .72, 0, 0, 0, 0, 1, .78, 2), 0, O, c.hide), P(T(Sph(.22, 7, 5), 0, .6, .05, 0, 0, 0, 1, .7, 1.8), 0, O, c.belly),
    ...[-.36, -.14, .08, .3].map((z, i) => P(T(Sph(.085 - i * .008, 6, 5), 0, 1 - Math.abs(z) * .12, z), 0, O, c.glow, 2.2)),
    ...LR.flatMap(s => [-.3, 0, .3].map(z => P(T(Box(.04, .16, .22), .27 * s, .8, z, 0, 0, -.5 * s), 0, O, c.plate))),
    // the head is a wedge that opens three ways
    P(T(Box(.26, .12, .52), 0, .84, .78, .12), 5, HD, c.plate), ...LR.map(s => P(T(Box(.1, .1, .5), .1 * s, .66, .76, -.12, .22 * s), 5, HD, c.hide)), ...LR.map(s => P(T(Cone(.035, .16, 4), .14 * s, .62, 1.02, H2), 5, HD, '#e8e2c0')),
    P(T(Sph(.08, 6, 5), 0, .74, .72), 5, HD, c.glow, 2.8), ...LR.flatMap(s => [.62, .74, .86].map(z => P(T(Sph(.022, 4, 3), .135 * s, .86, z), 5, HD, c.glow, 2.4))),
    // heavy forelegs, light hind legs, and a counterweight tail
    ...LR.flatMap((s, i) => [P(T(Cyl(.09, .055, .76, 5), .3 * s, .38, .32), 1 + i, [.3 * s, .76, .32], c.hide), P(T(Box(.16, .06, .22), .3 * s, .03, .38), 1 + i, [.3 * s, .76, .32], c.plate), P(T(Cone(.03, .14, 4), .3 * s, .05, .52, H2), 1 + i, [.3 * s, .76, .32], '#e8e2c0')]),
    ...LR.flatMap((s, i) => [P(T(Cyl(.055, .035, .6, 5), .2 * s, .3, -.4), 2 - i, [.2 * s, .6, -.4], c.hide), P(T(Box(.1, .04, .14), .2 * s, .02, -.38), 2 - i, [.2 * s, .6, -.4], c.plate)]),
    P(T(Cone(.11, .9, 5), 0, .7, -.98, -H2), 6, [0, .7, -.5], c.hide), P(T(Oct(.09), 0, .7, -1.46), 6, [0, .7, -.5], c.glow, 2),
    ...LR.flatMap(s => [P(T(Cyl(.018, .012, .6, 4), .16 * s, 1.22, .3, 0, 0, -.2 * s), 7, [.16 * s, .92, .3], c.plate), P(T(Sph(.035, 5, 4), .22 * s, 1.52, .3), 7, [.16 * s, .92, .3], c.glow, 2.6)])]); };
// the mauler: a shell-backed slab on four pillars, with a mouth like an opening flower
export const maulerGeo = c => { const HD = [0, 1, .78];
  return build([P(T(Sph(.56, 10, 8), 0, .98, 0, 0, 0, 0, 1.25, .95, 1.5), 0, O, c.hide), P(T(Sph(.44, 8, 6), 0, .78, .1, 0, 0, 0, 1.2, .7, 1.4), 0, O, c.belly),
    ...[-.5, -.05, .4].map((z, i) => P(T(Box(1.16 - i * .08, .14, .46), 0, 1.5 - Math.abs(z) * .16, z, i === 2 ? .2 : i === 0 ? -.2 : 0), 0, O, c.plate)), ...[-.28, .18].map(z => P(T(Sph(.1, 6, 5), 0, 1.5, z), 0, O, c.glow, 2.2)),
    ...LR.flatMap(s => [-.4, 0, .4].map(z => P(T(Cone(.08, .34, 4), .66 * s, 1.26, z, 0, 0, -1.1 * s), 0, O, c.plate))),
    ...[0, 1, 2].map(k => { const a = k / 3 * TAU + H2; return P(T(Cone(.12, .56, 4), Math.cos(a) * .2, 1 + Math.sin(a) * .2, 1.08, H2 - Math.sin(a) * .3, Math.cos(a) * .3), 5, HD, c.plate); }),
    P(T(Sph(.2, 7, 6), 0, 1, .86), 5, HD, c.hide), P(T(Sph(.13, 6, 5), 0, 1, .98), 5, HD, c.glow, 2.8), ...[-.24, -.08, .08, .24].map(x => P(T(Sph(.04, 5, 4), x, 1.32, .8), 5, HD, c.glow, 2.4)),
    ...[-.16, 0, .16].flatMap(x => [P(T(Cyl(.02, .012, .46, 4), x, .52, .98), 7, [x, .76, .98], c.belly), P(T(Sph(.03, 4, 3), x, .28, .98), 7, [x, .76, .98], c.glow, 2)]),
    ...[[.5, .46, 1], [-.5, .46, 2], [.5, -.5, 2], [-.5, -.5, 1]].flatMap(([x, z, pt]) => [P(T(Cyl(.17, .2, .84, 6), x, .42, z), pt, [x, .84, z], c.hide), P(T(Cyl(.24, .24, .1, 6), x, .05, z), pt, [x, .84, z], c.plate)]),
    P(T(Cyl(.1, .06, .6, 5), 0, .9, -1.1, -1.3), 6, [0, .9, -.8], c.hide), P(T(Dod(.2), 0, .82, -1.46), 6, [0, .9, -.8], c.plate)]); };
// the strider: a small body carried very high on four stilts, one lamp of an eye, feelers trailing underneath
export const striderGeo = c => { const HD = [0, 2.1, .46];
  return build([P(T(Sph(.42, 9, 7), 0, 2.15, 0, 0, 0, 0, 1, .7, 1.3), 0, O, c.hide), P(T(Dod(.34), 0, 2.36, -.1, 0, 0, 0, 1.1, .5, 1.3), 0, O, c.plate), P(T(Sph(.2, 7, 6), 0, 1.9, 0), 0, O, c.glow, 1.8),
    ...[[.44, .36, 1], [-.44, .36, 2], [.44, -.36, 2], [-.44, -.36, 1]].flatMap(([x, z, pt]) => [P(T(Cyl(.06, .035, 2.06, 5), x * 1.12, 1.03, z * 1.1, 0, 0, x > 0 ? .1 : -.1), pt, [x, 2.06, z], c.hide), P(T(Sph(.09, 5, 4), x, 2.04, z), pt, [x, 2.06, z], c.plate), P(T(Cone(.1, .16, 4), x * 1.24, .08, z * 1.1), pt, [x, 2.06, z], c.plate)]),
    P(T(Cyl(.08, .03, .98, 5), 0, 1.7, .7, -.46), 5, HD, c.hide), P(T(Sph(.05, 5, 4), 0, 1.26, .92), 5, HD, c.glow, 2.4), P(T(Sph(.13, 7, 6), 0, 2.26, .5), 5, HD, c.glow, 2.8), P(T(Box(.34, .05, .1), 0, 2.4, .5), 5, HD, c.plate),
    ...[[.16, .1], [-.16, .1], [.1, -.2], [-.1, -.2], [0, -.05]].flatMap(([x, z]) => [P(T(Cyl(.018, .01, .76, 4), x, 1.5, z), 7, [x, 1.88, z], c.belly), P(T(Sph(.028, 4, 3), x, 1.1, z), 7, [x, 1.88, z], c.glow, 2.2)])]); };
// the skitter: a flat shell grown over with crystal, six quick legs, two eyes on stalks and one claw far too big for it
export const skitterGeo = c => { const EY = [0, .5, .42], CL = [.34, .4, .44];
  return build([P(T(Sph(.5, 10, 6), 0, .44, 0, 0, 0, 0, 1, .42, 1.1), 0, O, c.hide), P(T(Sph(.4, 8, 5), 0, .36, 0, 0, 0, 0, 1, .3, 1), 0, O, c.belly),
    ...[[.1, -.1, .1, .2], [-.2, .1, -.3, -.2], [.22, .2, .2, -.3], [-.05, -.3, -.2, .1], [0, .12, 0, 0]].map(([x, z, rx, rz], i) => P(T(Cone(.07 + (i % 2) * .03, .3 + (i % 3) * .12, 4), x, .74 + (i % 3) * .05, z, rx, 0, rz), 0, O, c.glow, 1.7)),
    ...LR.flatMap((s, si) => [-.34, 0, .34].flatMap((z, i) => { const pt = (i + si) % 2 ? 1 : 2, pv = [.4 * s, .42, z]; return [P(T(Cyl(.04, .03, .34, 4), .56 * s, .5, z, 0, 0, -1.0 * s), pt, pv, c.plate), P(T(Cyl(.03, .015, .5, 4), .74 * s, .24, z, 0, 0, .25 * s), pt, pv, c.plate)]; })),
    ...LR.flatMap(s => [P(T(Cyl(.02, .02, .44, 4), .14 * s, .72, .42), 6, EY, c.plate), P(T(Sph(.06, 6, 5), .14 * s, .96, .42), 6, EY, c.glow, 2.8)]),
    P(T(Box(.12, .1, .44), .36, .4, .68), 4, CL, c.plate), P(T(Cone(.11, .4, 4), .44, .44, 1.04, H2, 0, 0), 4, CL, c.hide), P(T(Cone(.07, .34, 4), .28, .36, 1.02, H2, .3), 4, CL, c.hide),
    P(T(Box(.07, .07, .26), -.3, .38, .6), 3, [-.3, .4, .44], c.plate), P(T(Cone(.05, .18, 4), -.3, .38, .8, H2), 3, [-.3, .4, .44], c.hide), P(T(Sph(.05, 5, 4), 0, .38, .54), 0, O, c.glow, 2.2)]); };
// the crawler: a chain of segments, each banded with light, and a ring of teeth where a face should be
export const crawlerGeo = c => { const seg = [.3, .29, .27, .24, .2, .16], HD = [0, .3, .78], parts = [];
  seg.forEach((r, i) => { const z = .56 - i * .38, y = r * .92, pt = i % 2 ? 1 : 2, pv = [0, y, z];
    parts.push(P(T(Sph(r, 8, 6), 0, y, z, 0, 0, 0, 1.1, .9, 1), 0, O, i % 2 ? c.hide : c.belly), P(T(Cyl(r * 1.08, r * 1.08, .05, 8), 0, y, z + .16, H2, 0, 0, 1.1, 1, .9), 0, O, c.glow, 1.6), P(T(Box(r * 1.5, .06, .2), 0, y + r * .8, z), 0, O, c.plate),
      ...LR.map((s, k) => P(T(Cone(.05, .3, 4), r * 1.05 * s, .14, z, 0, 0, (Math.PI - .5) * s), k ? pt : 3 - pt, pv, c.plate))); });
  parts.push(P(T(Sph(.27, 8, 6), 0, .32, .92), 5, HD, c.hide), P(T(Sph(.13, 6, 5), 0, .32, 1.1), 5, HD, c.glow, 2.8), ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * TAU; return P(T(Cone(.035, .22, 4), Math.cos(a) * .17, .32 + Math.sin(a) * .17, 1.2, H2 - Math.sin(a) * .35, Math.cos(a) * .35), 5, HD, '#e8e2c0'); }),
    ...LR.flatMap(s => [P(T(Cyl(.014, .01, .4, 4), .14 * s, .66, .9, .3, 0, -.3 * s), 7, [.12 * s, .5, .9], c.plate), P(T(Sph(.028, 4, 3), .2 * s, .86, .96), 7, [.12 * s, .5, .9], c.glow, 2.4)]),
    P(T(Cone(.07, .5, 4), 0, .16, -1.72, -H2), 6, [0, .16, -1.4], c.plate), P(T(Oct(.07), 0, .16, -2), 6, [0, .16, -1.4], c.glow, 2));
  return build(parts); };
// the ray: a glider of living glass that hums through the air on wings you can see the sky through
export const rayGeo = c => { const Y = 1.3;
  return build([P(T(Sph(.3, 9, 6), 0, Y, 0, 0, 0, 0, 1.05, .32, 1.7), 0, O, c.hide), P(T(Box(.12, .03, .8), 0, Y - .1, 0), 0, O, c.glow, 2), ...LR.map(s => P(T(Cone(.05, .34, 4), .14 * s, Y, .62, H2, .2 * s), 0, O, c.plate)),
    ...[-.2, .1].map(z => P(T(Sph(.055, 5, 4), 0, Y + .1, z), 0, O, c.glow, 2.4)),
    ...LR.flatMap((s, i) => [P(T(Box(.86, .025, .7), .58 * s, Y, -.02, 0, .2 * s), 8 + i, [.16 * s, Y, 0], c.belly, .5), P(T(Box(.84, .035, .04), .58 * s, Y + .01, .3, 0, .2 * s), 8 + i, [.16 * s, Y, 0], c.plate), P(T(Box(.7, .035, .03), .5 * s, Y + .01, -.1, 0, -.1 * s), 8 + i, [.16 * s, Y, 0], c.glow, 1.4), P(T(Oct(.05), 1 * s, Y, .1), 8 + i, [.16 * s, Y, 0], c.glow, 2.2)]),
    P(T(Cyl(.03, .01, 1.1, 4), 0, Y, -1, -H2), 6, [0, Y, -.45], c.plate), P(T(Oct(.08), 0, Y, -1.6), 6, [0, Y, -.45], c.glow, 2.6)]); };
// the floater: a gas bag with a ring of lights, a beak underneath and a curtain of stinging threads
export const floaterGeo = c => { const Y = 1.8, TP = Y - .42;
  return build([P(T(Sph(.42, 10, 8), 0, Y, 0, 0, 0, 0, 1, 1.12, 1), 0, O, c.hide), P(T(Sph(.3, 8, 6), 0, Y - .22, 0, 0, 0, 0, 1, .7, 1), 0, O, c.belly), P(T(Box(.03, .36, .5), 0, Y + .5, -.06), 0, O, c.plate),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(k => { const a = k / 8 * TAU; return P(T(Sph(.055, 5, 4), Math.cos(a) * .41, Y + .04, Math.sin(a) * .41), 0, O, c.glow, 2.4); }), P(T(Cone(.1, .26, 4), 0, TP - .06, .2, Math.PI - .5), 5, [0, TP, .1], c.plate),
    ...[0, 1, 2, 3, 4, 5, 6].flatMap(k => { const a = k / 7 * TAU, x = Math.cos(a) * .22, z = Math.sin(a) * .22, L = .7 + (k % 3) * .16; return [P(T(Cyl(.028, .012, L, 4), x, TP - L / 2, z), 7, [x, TP, z], c.belly), P(T(Sph(.034, 4, 3), x, TP - L, z), 7, [x, TP, z], c.glow, 2.4)]; }),
    ...LR.map((s, i) => P(T(Box(.34, .02, .24), .56 * s, Y, 0), 8 + i, [.4 * s, Y, 0], c.plate))]); };

const QUAD = [.75, 0, 0, .55], SLOW = [.5, 0, 0, .5], STILT = [.34, 0, 0, .4], SCUT = [.9, .3, 1.6, .2], AIR = [0, 0, 0, .3], HUM = [.6, .4, 1.6, .15], HEAVY = [.55, .4, 1.9, .15];
const pal = (a, b, t, g) => ({ a, b, t, g });
export const DUST = C('#b08a58', '#d8c098', '#6a4a2e', '#ffb347'), ICE = C('#c8d8e8', '#eef4fa', '#7a94b0', '#7ad8ff'), CAGE = C('#6a4a8a', '#c8a8d8', '#3a2a52', '#ffd86a'), ASH = C('#4a4448', '#7a6a66', '#2a2628', '#ff5a2a'), DEEP = C('#3a5a52', '#8ab8a0', '#22342e', '#8dff5a');
replaceKinds({
  wolf: [houndGeo(DUST), QUAD, .07, .035], bear: [maulerGeo(C('#7a8a4a', '#c8d098', '#4a5430', '#ff8ad8')), SLOW, .06, .04], spider: [skitterGeo(C('#8a6a52', '#c8a888', '#4e3a2e', '#6ad8ff')), SCUT, .03, .03], wasp: [rayGeo(C('#9ad8e8', '#d8f4ff', '#3a6a7a', '#fff2b0')), AIR, 0, .025],
  // the risen wear what they were buried in, and the light in the visor is the wrong colour
  ghoul: [sfig({ body: 'armor', head: 'helmet', r: 'baton', l: null }, pal('#5a6258', '#2e322c', '#7a4a2a', '#8dff5a'), 0), [.8, .6, 1.8, .3], .07, .03],
  skeleton: [sfig({ body: 'armor', heavy: true, head: 'bare', r: 'blade', l: 'shield', skin: '#8a9a8a', hair: '#d8d8c8' }, pal('#6a6a5a', '#34342c', '#a8843a', '#8dff5a'), 0), [.7, .55, 2.2, .2], .05, .03],
  // a four-armed Thuun heavy, and a pirate captain in a coat she did not pay for
  brute: [sfig({ body: 'armor', heavy: true, arms4: true, head: 'bald', r: 'maul', l: null, skin: '#6a9a8a' }, pal('#7a5a3a', '#3e2e20', '#c8782a', '#ffb347'), 0), HEAVY, .05, .04],
  captain: [sfig({ body: 'coat', head: 'hat', r: 'pistol', l: 'blade', scarf: '#c0392b', hair: '#a83a2a' }, pal('#8a2a22', '#2a1c1c', '#d8b24a', '#ff8a3a'), 3), HUM, .05, .035],
});
addKinds({
  a_hound_ice: [houndGeo(ICE), QUAD, .07, .035], a_hound_cage: [houndGeo(CAGE), QUAD, .07, .035], a_hound_ash: [houndGeo(ASH), QUAD, .07, .035],
  a_mauler_ash: [maulerGeo(ASH), SLOW, .06, .04], a_mauler_deep: [maulerGeo(DEEP), SLOW, .06, .04],
  a_strider: [striderGeo(C('#c8b088', '#e8dcc0', '#7a5a3a', '#ffd86a')), STILT, .04, .035],
  a_skitter_ash: [skitterGeo(C('#3a3438', '#6a5a58', '#221e20', '#ff7a2a')), SCUT, .03, .03],
  a_crawler: [crawlerGeo(C('#b89858', '#8a6a3a', '#5a4226', '#ffb347')), [.5, .5, 0, .5], .03, .03], a_crawler_ice: [crawlerGeo(C('#d0e0ee', '#9ab4cc', '#5a7a98', '#7ad8ff')), [.5, .5, 0, .5], .03, .03], a_crawler_deep: [crawlerGeo(C('#4a6a5e', '#2e463e', '#1c2c26', '#8dff5a')), [.5, .5, 0, .5], .03, .035],
  a_ray_ash: [rayGeo(C('#5a4a4a', '#ff9a5a', '#2a2222', '#ff5a2a')), AIR, 0, .025],
  a_floater: [floaterGeo(C('#b86a5a', '#e8b8a0', '#6a3a32', '#ffcf6a')), AIR, 0, .03], a_floater_ice: [floaterGeo(C('#c8dcec', '#f0f6fc', '#6a8aa8', '#bfe6ff')), AIR, 0, .03], a_floater_deep: [floaterGeo(C('#5a7a8a', '#a8d0c8', '#2e4450', '#8dff5a')), AIR, 0, .03],
  a_risen_cit: [sfig({ body: 'suit', head: 'bare', r: null, l: null, skin: '#8a9a8a', hair: '#5a5a52' }, pal('#6a7078', '#3a3e44', '#8a8a6a', '#8dff5a'), 0), [.8, .6, 1.8, .3], .07, .03],
});
// who wears which body. Names stay; a "jackal" was only ever what the first colonists called it.
const SET = { icejackal: 'a_hound_ice', frostmaw: 'a_hound_ice', stalker: 'a_hound_cage', strider: 'a_strider', duneking: 'a_strider', crawler: 'a_crawler', rimecrawler: 'a_crawler_ice', kite: 'a_floater', sleetkite: 'a_floater_ice', cityrisen: 'a_risen_cit' };
for (const [k, kind] of Object.entries(SET)) if (MOBS[k]) MOBS[k].kind = kind;
// stilt-walkers are tall enough already
for (const k of ['strider', 'duneking']) if (MOBS[k]) MOBS[k].scale = Math.min(MOBS[k].scale || 1, k === 'duneking' ? 1.5 : 1);
// what a Necromancer raises
PETS.thrall = { name: 'Thrall', kind: 'ghoul', role: 'dps', hpM: .8, powM: .55, spd: 6, r: .5, scale: .95 };
