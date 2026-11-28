// Stars Beneath: the look. Colour grades per world, what drifts in each world's air, and the interface skin.
// A grade is: exp (brightness), fill (how bright the shade is), sat (colour), con (contrast), tint (overall colour),
// lift (colour in the shadows), bloom (glow strength), thr (how bright a thing must be to glow), cloud (0 clear … 1 overcast).
const BASE = { exp: .8, fill: 1.3, sat: 1.1, con: 1.08, bloom: .55, cloud: .35, tint: '#ffffff', lift: '#000000', thr: 1.0 };
const WORLDS = {
  moon: { tint: '#fff0dc', lift: '#140a06', sat: 1.1, cloud: .12, bloom: .5 },              // Dustfall: an airless-looking amber moon
  sunder: { tint: '#fff8ec', lift: '#0c0a14', sat: 1.06, cloud: .3, bloom: .65 },              // Sunder: salt and glass
  fort: { tint: '#e8f2ff', lift: '#081428', sat: 1.02, cloud: .6, bloom: .6 },                 // Cairn: cold border world
  city: { tint: '#f6fbff', lift: '#0a1020', sat: 1.12, cloud: .4, bloom: .4, thr: 1.3 },                // Aurelis: the Republic's bright core
  cinder: { tint: '#ffe4d2', lift: '#1c0606', sat: 1.12, con: 1.14, cloud: .7, bloom: .8 },    // Cinder: the Empire's furnace world
  hollow: { tint: '#f6f4d8', lift: '#0e1206', sat: .98, con: 1.12, cloud: .65, bloom: .6 },    // Hollow: sulphur mines
  front: { tint: '#f4ece2', lift: '#100a0c', sat: .98, con: 1.14, cloud: .75, bloom: .7 },      // Lanthorn: the war world
  grave: { tint: '#dcf4f4', lift: '#04121a', sat: 1.1, con: 1.16, cloud: .1, bloom: .9 },     // the Becalmed: a fleet graveyard
  halfway: { tint: '#eaf4ff', lift: '#060c18', sat: 1.0, con: 1.08, bloom: .85, thr: .9 },    // Halfway Station
  ship: { tint: '#eef6ff', lift: '#060c18', sat: 1.0, con: 1.08, bloom: .85, thr: .9 },
  board: { tint: '#ffe8e0', lift: '#140608', sat: .95, con: 1.12, bloom: .9, thr: .9 },
};
const SPACE = { exp: .7, fill: 1.0, sat: 1.15, con: 1.1, bloom: .5, thr: .9, cloud: 0, tint: '#f2f6ff', lift: '#04061a' };
let INST = null;
function landOf(zone) { let z = zone, n = 0; while (z && !WORLDS[z] && INST && INST[z] && INST[z].parent && n++ < 4) z = INST[z].parent; return WORLDS[z] ? z : 'moon'; }
const AIR = {
  moon: { col: [.8, .62, .42], rate: 8, size: .12, vel: [1.6, .05, .5], life: 5 },               // blown dust
  sunder: { col: [1, 1, .95], rate: 5, size: .1, vel: [1, .1, .3], life: 5, glow: 1, low: 3 },   // salt glitter
  fort: { col: [1, 1, 1], rate: 30, size: .13, vel: [1.4, -1.6, .4], life: 6 },                  // snow
  cinder: { col: [1, .45, .15], rate: 10, size: .18, vel: [.2, 1, 0], life: 4, glow: 1, low: 4 },// embers
  hollow: { col: [.7, .72, .3], rate: 8, size: .14, vel: [.5, -.2, .2], life: 6 },               // sulphur dust
  front: { col: [.45, .43, .4], rate: 12, size: .15, vel: [.8, -.5, .2], life: 6 },              // ash
  grave: { col: [.3, .95, .9], rate: 7, size: .2, vel: [0, .12, 0], life: 6, glow: 1, low: 6 },  // glowing motes off the hulls
};
const INDOOR = { col: [.6, .8, 1], rate: 2, size: .08, vel: [0, .04, 0], life: 6, glow: 1, low: 3 };
export const theme = {
  name: 'scifi', skin: 'scifi', nameFix: n => n.replace(/^(Dusk|Lamplit) /, ''),
  setInstances(i) { INST = i; },
  landOf,
  grade(world, S, space) {
    if (space) return SPACE;
    const g = { ...BASE, ...WORLDS[landOf(world.zone)] };
    if (world.cave) { g.bloom = Math.max(g.bloom, .8); g.con = Math.max(g.con, 1.1); g.exp = .86; }
    return g;
  },
  ambient(world, S, inside) {
    const z = landOf(world.zone);
    if (z === 'ship' || z === 'halfway' || z === 'board' || world.cave) return z === 'grave' ? AIR.grave : INDOOR;
    return AIR[z];
  },
  schools: { holy: [1, .9, .5], shadow: [.9, .3, .55], storm: [.45, .85, 1], nature: [.5, 1, .55] },
};
