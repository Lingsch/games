// Build 7: heroic dungeons. Level-20 versions of the eight dungeons of the Vale and the coast: every enemy is
// level 20 and elite, the bosses hit harder and know their tricks better, and the loot is level-20 sets.
// Instanced dungeons are rebuilt as they are; the open-world ones get a sealed heroic copy of their own.
import { S, chat, X } from './core.js';
import { world, registerZone, zoneGen, ZONE_SIZE } from './world.js';
import { MOBS } from './data.js';
import { INSTANCES, DBOSSES, DSITES, buildInstance } from './dungeons.js';
import { C6 } from './coast6.js';
import { LFG_D } from './social6.js';
const HEROIC = {
  catacombs: { name: 'The Choir Catacombs', parent: 'vale' }, mines: { name: 'The Mines under the Waste', parent: 'vale' },
  brinevaults: { name: 'The Brine Vaults', parent: 'coast' }, bonewhale: { name: 'The Bonewhale Grotto', parent: 'coast' },
  keep: { name: "Varro's Keep", parent: 'vale', open: true, mobs: ['keepguard', 'keepthug', 'keepxbow', 'keephound'], floor: '#6a6458', fog: '#1a1814' },
  grove: { name: 'The Blighted Grove', parent: 'vale', open: true, mobs: ['rotwolf', 'rotboar', 'thornling', 'blightsprite', 'blightbear'], floor: '#4a5a3a', fog: '#121a10' },
  teeth: { name: "The Wreckers' Teeth", parent: 'coast', open: true, mobs: ['wrecker', 'wreckerlamp', 'wreckerbrute'], floor: '#8a7a5a', fog: '#141a1e' },
  shrine: { name: 'The Tidewater Shrine', parent: 'coast', open: true, mobs: ['tidesworn', 'tidechanter', 'brineling'], floor: '#5a6a6a', fog: '#0e1a1e' },
};
const toHeroic = () => { for (const s of world.spawns) { s.lvl = [20, 20]; s.elite = true; s.heroic = true; } for (const z of world.zoneLines) if (z.to !== S.zone) z.label = z.label.replace(/^Back/, 'Leave the heroic and go back'); };
for (const [k, H] of Object.entries(HEROIC)) {
  const zk = 'h_' + k, name = `Heroic: ${H.name}`;
  ZONE_SIZE[zk] = 300;
  const out = INSTANCES[k]?.out || { keep: { x: DSITES.keep.x + 34, z: DSITES.keep.z }, grove: { x: DSITES.grove.x, z: DSITES.grove.z - 40 }, teeth: { x: C6.teeth.x - 36, z: C6.teeth.z - 10 }, shrine: { x: C6.shrine.x, z: C6.shrine.z + 44 } }[k];
  INSTANCES[zk] = { parent: H.parent, out: out || { x: 0, z: 0 }, name };
  LFG_D[zk] = { name, lvl: [20, 20], zone: zk };
  if (!H.open) registerZone(zk, seed => { const w = zoneGen(k)(seed); world.names = { ...world.names, zone: name }; for (const z of world.zoneLines) z.to = H.parent; toHeroic(); return w; });
  else registerZone(zk, seed => {
    world.names = { zone: name, town: name };
    const B = DBOSSES[k], m = H.mobs, pk = i => m[i % m.length];
    const w = buildInstance(seed, { name, floor: H.floor, rock: '#1a1814', walls: true, fog: H.fog, light: .55, exitTo: H.parent, exitLabel: `Back to ${H.parent === 'vale' ? 'the Vale' : 'the coast'}`,
      rects: [[-8, 52, 8, 74], [-3, 38, 3, 52], [-22, 8, 22, 38], [-3, -4, 3, 8], [-24, -40, 24, -4], [-3, -52, 3, -40], [-22, -86, 22, -52]],
      doors: [[0, 52], [0, 38], [0, 8], [0, -4], [0, -40], [0, -52]], props: [],
      packs: [[-4, 60, [pk(0), pk(1)], [20, 20]], [-12, 28, [pk(0), pk(2), pk(1)], [20, 20]], [12, 18, [pk(3), pk(1), pk(0)], [20, 20]], [-14, -12, [pk(2), pk(4), pk(0)], [20, 20]], [14, -30, [pk(1), pk(3), pk(2)], [20, 20]], [-12, -62, [pk(0), pk(1), pk(4)], [20, 20]]],
      bosses: B.map((b, i) => [B.length === 4 ? [[0, 24], [-14, -22], [14, -22], [0, -74]][i][0] : [[0, 24], [-14, -16], [14, -28], [-10, -62], [0, -76]][i][0], B.length === 4 ? [[0, 24], [-14, -22], [14, -22], [0, -74]][i][1] : [[0, 24], [-14, -16], [14, -28], [-10, -62], [0, -76]][i][1], b, 20, i === B.length - 1]) });
    toHeroic(); return w;
  });
}
// the heroic mark: a quick line when you enter
X.zone.push(zone => { if (zone.startsWith('h_')) chat('sys', null, `${INSTANCES[zone].name}. Everything here is level 20, and everything here knows it.`); });
