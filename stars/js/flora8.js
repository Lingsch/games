// Stars Beneath, Build 8: alien plants. No oaks, pines or cactus out here. (No imports from the game: zone files
// load this early.)
import { build, P, T, Cyl, Cone, Sph, Oct } from './models.js';
const O = [0, 0, 0], TAU = Math.PI * 2;
// a fat bulb with breathing vents and three stiff feelers: what passes for a cactus on a dust world
export const podGeo = (hide = '#8a6a4a', glow = '#ffb347') => build([P(T(Sph(.55, 8, 6), 0, .5, 0, 0, 0, 0, 1, .9, 1), 0, O, hide), P(T(Sph(.36, 7, 5), 0, 1.02, 0), 0, O, '#6a4e36'),
  ...[0, 1, 2, 3].map(k => P(T(Sph(.08, 5, 4), Math.cos(k * 1.6) * .5, .55, Math.sin(k * 1.6) * .5), 0, O, glow, 2)),
  ...[0, 1, 2].map(k => { const a = k / 3 * TAU + .4; return P(T(Cyl(.03, .05, 1.5 + k * .3, 4), Math.cos(a) * .16, 1.8 + k * .15, Math.sin(a) * .16, Math.sin(a) * .22, 0, -Math.cos(a) * .22), 0, O, '#4e3a28'); }),
  ...[0, 1, 2].map(k => { const a = k / 3 * TAU + .4, h = 2.6 + k * .3; return P(T(Oct(.07), Math.cos(a) * .34, h, Math.sin(a) * .34), 0, O, glow, 2.6); })]);
// a stalk carrying tilted fans, with light-bulbs hanging under each: the nearest thing here to a tree
export const fanTreeGeo = (leaf = '#3aa890', glow = '#ffd86a', bark = '#3a3046') => build([P(T(Cyl(.14, .26, 2.6, 6), 0, 1.3, 0, .05), 0, O, bark),
  ...[[0, 2.9, 0, 1.5, .2, 0], [.9, 2.3, .3, 1.05, -.3, .5], [-.8, 2.5, -.4, .95, .35, -.4], [.2, 3.6, -.3, .8, -.2, -.2]].flatMap(([x, y, z, r, rx, rz]) => [P(T(Cyl(r, r * .7, .1, 9), x, y, z, rx, 0, rz), 0, O, leaf), P(T(Cyl(r * .5, r * .3, .12, 7), x, y + .08, z, rx, 0, rz), 0, O, bark),
    P(T(Cyl(.015, .015, .5, 3), x + r * .5, y - .3, z), 0, O, bark), P(T(Sph(.09, 5, 4), x + r * .5, y - .58, z), 0, O, glow, 2.4)])]);
// branching ice-coral with lit tips, for a world too cold for anything with leaves
export const frostCoralGeo = (ice = '#cfe4f4', glow = '#7ad8ff') => build([P(T(Cone(.3, 2.6, 5), 0, 1.3), 0, O, ice),
  ...[[.5, 1.5, 0, 0, -.7], [-.45, 1.9, .2, .2, .75], [.1, 2.2, -.45, -.7, 0], [-.1, 1.2, .5, .8, .1]].flatMap(([x, y, z, rx, rz]) => [P(T(Cone(.16, 1.5, 4), x, y, z, rx, 0, rz), 0, O, '#e8f2fa'), P(T(Oct(.08), x * 2.1, y + .55, z * 2.1), 0, O, glow, 2.4)]), P(T(Oct(.1), 0, 2.7), 0, O, glow, 2.6)]);
