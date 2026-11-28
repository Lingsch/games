// Build 15: models for the road to the moon (levels 41-45): the Sleeper's young, the things that guard its shell,
// the Sleeper itself, and the scenery of a world the moon is pulling apart.
import { addKinds } from './render.js';
import { build, P, T, Box, Cyl, Sph, Cone, Cap, Tor, Oct, Ico, Dod } from './models.js';
import { GEO } from './kit9.js';
const O = [0, 0, 0], STILL = [0, 0, 0, 0], PI = Math.PI;

// a moon-grub: the Sleeper's young, fallen as shooting stars
const larva = (c = '#d8dce8', glow = '#b07aff') => build([
  ...[0, 1, 2, 3, 4].map(k => P(T(Sph(.5 - k * .06, 8, 6), 0, .55, -k * .55, 0, 0, 0, 1, .85, 1.1), k < 2 ? 0 : 1 + (k % 2), [0, .55, -k * .55], k % 2 ? '#c8ccd8' : c)),
  ...[0, 1, 2, 3].map(k => P(T(Tor(.42 - k * .05, .04, 3, 12), 0, .55, -k * .55 - .25, 0, 0, 0), 0, O, glow, 1.6)),
  P(T(Sph(.32, 8, 6), 0, .6, .45, 0, 0, 0, 1, .9, 1), 5, [0, .6, .3], c), P(T(Sph(.14, 6, 5), 0, .65, .72), 5, [0, .6, .3], glow, 2.2),
  ...[1, -1].map((s, i) => P(T(Cone(.05, .5, 4), .25 * s, .9, .5, -.6, 0, .4 * s), 3 + i, [.2 * s, .8, .4], '#8a8ea0')),
]);
// an antibody: what the Sleeper's shell sends to deal with intruders
const antibody = () => build([
  P(T(Ico(.7, 1), 0, 1.5, 0), 0, O, '#f0f2f8'), P(T(Sph(.3, 8, 6), 0, 1.55, .5), 5, [0, 1.5, 0], '#b07aff', 2),
  ...[0, 1, 2, 3, 4, 5].map(k => { const a = k / 6 * PI * 2; return P(T(Cyl(.06, .02, 1.3, 4), Math.cos(a) * .7, 1.1, Math.sin(a) * .7, Math.sin(a) * .7, 0, -Math.cos(a) * .7), 1 + (k % 2), [Math.cos(a) * .5, 1.4, Math.sin(a) * .5], '#d8dce8'); }),
]);
// the Sleeper: an eye the size of a house in a shell of silver plates, with arms
const sleeper = () => build([
  P(T(Sph(1.6, 14, 10), 0, 2.2, 0, 0, 0, 0, 1.1, 1, 1), 0, O, '#e8ecf4'), P(T(Sph(.8, 12, 8), 0, 2.3, 1.2, 0, 0, 0, 1, 1, .5), 5, [0, 2.2, .6], '#7a3aff', 2.2), P(T(Sph(.35, 8, 6), 0, 2.3, 1.55, 0, 0, 0, 1, 1.6, .5), 5, [0, 2.2, .6], '#0a0410'),
  ...[0, 1, 2, 3, 4, 5, 6].map(k => { const a = k / 7 * PI * 2; return P(T(Box(1.4, .2, 1), Math.cos(a) * 1.5, 2.2 + Math.sin(k) * .5, Math.sin(a) * 1.5 - .3, 0, -a, .3), 0, O, '#a8acc0'); }),
  ...[1, -1].map((s, i) => P(T(Cyl(.3, .12, 3.4, 6), 1.9 * s, 2, .4, .4, 0, 1 * s), 3 + i, [1.2 * s, 2.6, 0], '#c8ccd8')),
  ...[1, -1].map((s, i) => P(T(Cone(.25, .8, 5), 3.2 * s, .9, 1, -1.2, 0, 0), 3 + i, [1.2 * s, 2.6, 0], '#b07aff', 1.4)),
]);
addKinds({
  larva15: [larva(), [.9, 0, 0, .35], .03, .03], larvagold15: [larva('#e8dcb0', '#ffb04a'), [.9, 0, 0, .35], .03, .03],
  antibody15: [antibody(), [0, .5, 1.4, .15], .1, .035], sleeper15: [sleeper(), [0, .3, 1, .08], .05, .05],
  egg15: [build([P(T(Sph(.8, 10, 8), 0, .9, 0, 0, 0, 0, 1, 1.3, 1), 0, O, '#d8dce8'), ...[0, 1, 2].map(k => P(T(Tor(.6 + k * .12, .03, 3, 14), 0, .5 + k * .45, 0, PI / 2), 0, O, '#b07aff', 1.4)), P(T(Cyl(1, 1.2, .3, 10), 0, .1), 0, O, '#9a9eb0')]), STILL, 0, .03],
  eggcracked15: [build([P(T(Sph(.8, 10, 8), 0, .6, 0, 0, 0, 0, 1, .7, 1), 0, O, '#b8bcc8'), ...[0, 1, 2, 3].map(k => P(T(Cone(.25, .7, 4), Math.cos(k * 1.6) * .6, 1.1, Math.sin(k * 1.6) * .6, Math.sin(k) * .4, 0, Math.cos(k) * .4), 0, O, '#d8dce8')), P(T(Cyl(1, 1.2, .3, 10), 0, .1), 0, O, '#9a9eb0')]), STILL, 0, .03],
  mirror15: [build([P(T(Cyl(.6, .8, .6, 8), 0, .3), 0, O, '#4a4458'), P(T(Cyl(.2, .2, 3, 6), 0, 2), 0, O, '#6a6478'), P(T(Box(1.6, 1.6, .1), 0, 4, 0, -.9), 0, O, '#e8ecf4', 1.2), P(T(Oct(.3), 0, 4.2, .3), 0, O, '#b07aff', 2.4)]), STILL, 0, .03],
  mirrordark15: [build([P(T(Cyl(.6, .8, .6, 8), 0, .3), 0, O, '#3a3448'), P(T(Cyl(.2, .2, 3, 6), 0, 2), 0, O, '#4a4458'), P(T(Box(1.6, 1.6, .1), 0, 4, 0, -.9), 0, O, '#2a2838'), P(T(Box(1.6, .1, .12), 0, 4.2, 0, -.9, 0, .7), 0, O, '#6a6478')]), STILL, 0, .03],
});
Object.assign(GEO, {
  silvercrack: () => build([...[0, 1, 2, 3].map(k => P(T(Box(.25, .12, 3 + k), Math.sin(k * 2) * .8, .02, k * .6, 0, k * .7, 0), 0, O, '#d8d0ff', 2))]),
  moonrock: () => build([P(T(Dod(1), 0, .5, 0, 0, 0, 0, 1.2, .8, 1), 0, O, '#b8bcc8'), P(T(Dod(.5), .9, .3, .4), 0, O, '#a8acb8')]),
  crater: () => build([P(T(Tor(2.4, .5, 6, 16), 0, .1, 0, PI / 2, 0, 0, 1, 1, .5), 0, O, '#a8acb8')]),
  moonbeam: () => build([P(T(Cyl(.5, .5, 60, 8), 0, 30), 0, O, '#e8e0ff', 2.4), P(T(Cyl(1.2, 1.4, 1.2, 8), 0, .6), 0, O, '#4a4458'), P(T(Tor(.9, .1, 4, 12), 0, 4, 0, PI / 2), 0, O, '#b07aff', 2)]),
  lamptower: () => build([P(T(Cyl(2, 2.6, 2, 8), 0, 1), 0, O, '#4a4458'), P(T(Cyl(1, 1.4, 14, 8), 0, 9), 0, O, '#5a5468'), P(T(Box(3.4, 3.4, .2), 0, 17, 0, -.8), 0, O, '#e8ecf4', 1.4), P(T(Cyl(.4, .4, 60, 8), 0, 47), 0, O, '#e8e0ff', 2.4)]),
  shellwall: () => build([P(T(Sph(3, 10, 6), 0, 0, 0, 0, 0, 0, 1.6, 1.4, .5), 0, O, '#c8ccd8'), ...[0, 1, 2].map(k => P(T(Box(.15, 3.4, .1), -1.6 + k * 1.6, 1.2, 1.45, 0, 0, (k - 1) * .3), 0, O, '#b07aff', 1.6))]),
  vein: () => build([...[0, 1, 2].map(k => P(T(Cyl(.12, .08, 4 + k, 5), Math.cos(k * 2) * .5, .1, Math.sin(k * 2) * .5, PI / 2, k * 1.1, 0), 0, O, '#b07aff', 1.8))]),
  nest: () => build([P(T(Tor(1.6, .6, 6, 14), 0, .3, 0, PI / 2), 0, O, '#8a8070'), ...[0, 1, 2].map(k => P(T(Sph(.5, 8, 6), Math.cos(k * 2) * .6, .7, Math.sin(k * 2) * .6, 0, 0, 0, 1, 1.3, 1), 0, O, '#d8dce8'))]),
  silvertree: () => build([P(T(Cyl(.15, .3, 3.4, 6), 0, 1.7), 0, O, '#9a9eb0'), ...[0, 1, 2].map(k => P(T(Ico(.9 - k * .2, 0), Math.cos(k * 2) * .5, 3.2 + k * .5, Math.sin(k * 2) * .5), 0, O, '#c8c0f0', .6))]),
});
