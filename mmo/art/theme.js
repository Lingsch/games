// Single-Player MMO: the look. Colour grades per land, and the names of the pictographs.
// A grade is: exp (brightness), sat (colour), con (contrast), tint (overall colour), lift (colour in the shadows),
// bloom (glow strength), cloud (0 clear … 1 overcast).
const BASE = { exp: .8, fill: 1.3, sat: 1.1, con: 1.08, bloom: .45, cloud: .5, tint: '#ffffff', lift: '#000000', thr: 1.05 };
const LANDS = {
  vale: { tint: '#f6fbf0', lift: '#0a0612', sat: 1.12, cloud: .5 },
  weald: { tint: '#f2fbee', lift: '#04100a', sat: 1.08, cloud: .58 },
  kiln: { tint: '#ffeeda', lift: '#160604', sat: 1.12, con: 1.12, cloud: .35, bloom: .65 },
  hush: { tint: '#e2e6ff', lift: '#0a0a1c', sat: .92, cloud: .78 },
  coast: { tint: '#f2fbff', lift: '#041018', sat: 1.06, cloud: .42 },
  wastes: { tint: '#f0f0d8', lift: '#0c1206', sat: .84, con: 1.14, cloud: .72 },
  deep: { tint: '#d8e4ff', lift: '#06081e', sat: 1.1, con: 1.16, bloom: .8 },
  north: { tint: '#e4f2ff', lift: '#081428', sat: 1.0, cloud: .6, bloom: .6 },
  crown: { tint: '#fff6e2', lift: '#120a04', sat: 1.12, cloud: .4 },
  sky1: { tint: '#eef2ff', lift: '#0a0e22', sat: 1.12, cloud: .8, bloom: .6 },
  sky2: { tint: '#f4ecff', lift: '#100a22', sat: 1.2, cloud: .35, bloom: .8 },
  sky3: { tint: '#e6e6ff', lift: '#0a0624', sat: 1.18, cloud: .25, bloom: .85 },
  xw13: { tint: '#ffe0d6', lift: '#1c0406', sat: 1.12, con: 1.16, cloud: .7, bloom: .7 },
  xm13: { tint: '#dcdcff', lift: '#08061c', sat: .98, con: 1.18, cloud: .85, bloom: .85 },
  xf13: { tint: '#e0f0ff', lift: '#081428', sat: .98, cloud: .65, bloom: .65 },
  xt13: { tint: '#ffe2c8', lift: '#1a0806', sat: 1.14, con: 1.16, cloud: .6, bloom: .8 },
  // Build 14: the Lamplighters' road. The Reach is kept dark on purpose: low exposure, little character self-light,
  // so your lamp and the wayshrines are the only real light. The others are the sea, the crash and the Forge.
  lr14: { exp: .62, fill: .7, char: .12, tint: '#ffe8cc', lift: '#000000', sat: .9, con: 1.22, cloud: 0, bloom: 1.05 },
  dh14: { tint: '#d0f0ff', lift: '#021420', sat: 1.12, con: 1.1, cloud: 0, bloom: .9 },
  sf14: { tint: '#eae6ff', lift: '#0a0418', sat: 1.16, con: 1.14, cloud: .3, bloom: .95 },
  mf14: { tint: '#e8f6ff', lift: '#040c18', sat: 1.06, con: 1.18, cloud: .2, bloom: 1 },
  gl14: { tint: '#fff2d8', lift: '#100804', sat: 1.12, con: 1.12, cloud: .45, bloom: .9 },
};
let INST = null;
function landOf(zone) {
  let z = zone, n = 0;
  while (z && !LANDS[z] && INST && INST[z] && INST[z].parent && n++ < 4) z = INST[z].parent;
  return LANDS[z] ? z : 'vale';
}
// what drifts in the air of each land: [what, colour, per second, size, speed, life, glows, hugs the ground up to]
const AIR = {
  vale: { col: [.95, .55, .18], rate: 5, size: .2, vel: [.9, -.7, .3], life: 6 },                    // autumn leaves
  weald: { col: [.55, .8, .3], rate: 5, size: .16, vel: [.3, -.4, .2], life: 6 },                     // green leaf-fall
  kiln: { col: [1, .5, .15], rate: 9, size: .2, vel: [.2, .9, 0], life: 3.5, glow: 1, low: 3 },       // embers
  hush: { col: [.6, .75, .7], rate: 5, size: .5, vel: [.25, .05, .1], life: 6, low: 1.5 },            // marsh mist
  coast: { col: [1, 1, 1], rate: 2, size: .14, vel: [1.4, .1, .4], life: 4 },                         // spray
  wastes: { col: [.5, .5, .46], rate: 10, size: .16, vel: [.6, -.5, .2], life: 6 },                   // ash
  deep: { col: [.35, .7, 1], rate: 6, size: .22, vel: [0, .15, 0], life: 5, glow: 1, low: 5 },        // cave spores
  north: { col: [1, 1, 1], rate: 34, size: .13, vel: [1.1, -1.6, .4], life: 6 },                      // snow
  crown: { col: [1, .9, .55], rate: 3, size: .14, vel: [.2, .1, .1], life: 5, glow: 1 },              // gold motes
  sky1: { col: [.9, .95, 1], rate: 8, size: .5, vel: [2.2, 0, .6], life: 5 },                         // cloud wisps
  sky2: { col: [.9, .7, 1], rate: 6, size: .16, vel: [0, .2, 0], life: 5, glow: 1 },                  // crystal glints
  sky3: { col: [.7, .8, 1], rate: 7, size: .14, vel: [0, .1, 0], life: 6, glow: 1 },                  // star dust
  xw13: { col: [1, .3, .2], rate: 8, size: .18, vel: [.1, .7, 0], life: 4, glow: 1, low: 4 },
  xm13: { col: [.55, .45, 1], rate: 6, size: .2, vel: [0, .12, 0], life: 6, glow: 1, low: 5 },
  xf13: { col: [1, 1, 1], rate: 40, size: .13, vel: [1.6, -1.8, .5], life: 6 },
  xt13: { col: [1, .55, .2], rate: 10, size: .18, vel: [.1, 1, 0], life: 4, glow: 1, low: 4 },
  lr14: { col: [1, .7, .35], rate: 3, size: .1, vel: [0, .05, 0], life: 5, glow: 1, low: 3 },                // a few motes of stolen light
  dh14: { col: [.7, .95, 1], rate: 10, size: .14, vel: [0, .6, 0], life: 4, glow: 1, low: 6 },
  sf14: { col: [.8, .5, 1], rate: 8, size: .14, vel: [0, .25, 0], life: 5, glow: 1, low: 6 },               // star-dust off the wreck
  mf14: { col: [.4, 1, 1], rate: 9, size: .12, vel: [.3, .4, 0], life: 3.5, glow: 1, low: 5 },             // sparks from the Forge
  gl14: { col: [1, .9, .55], rate: 6, size: .15, vel: [0, .4, 0], life: 5, glow: 1, low: 6 },
};
const FIREFLY = { col: [.75, 1, .35], rate: 7, size: .2, vel: [0, .05, 0], life: 4, glow: 1, low: 2.5 };
const CAVE = { col: [.8, .75, .6], rate: 4, size: .1, vel: [0, .05, 0], life: 6, glow: 1, low: 4 };
export const theme = {
  name: 'fantasy',
  ambient(world, S, inside, now) {
    if (world.underwater) return { col: [.7, .9, 1], rate: 8, size: .14, vel: [0, .6, 0], life: 4, glow: 1, low: 6 };
    const land = landOf(world.zone);
    if (world.cave) return land === 'deep' || land === 'xm13' ? AIR[land] : CAVE;
    const time = S.running && S.hero ? S.time : now * 6, ph = ((time / 1440) + .3) % 1;
    if (ph > .64 && ph < .95 && (land === 'vale' || land === 'weald' || land === 'hush' || land === 'crown')) return FIREFLY;
    return AIR[land];
  },
  setInstances(i) { INST = i; },
  landOf,
  grade(world) {
    const g = { ...BASE, ...LANDS[landOf(world.zone)] };
    if (world.cave) { g.bloom = Math.max(g.bloom, .75); g.con = Math.max(g.con, 1.1); g.exp = .86; }
    if (world.underwater) { g.tint = '#d6f4ff'; g.lift = '#04141c'; g.bloom = .8; }
    return g;
  },
};
