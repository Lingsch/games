// Spell upgrades: each spell goes from level 1 to 5, and every level offers three cards drawn fresh.
// Commons are solid steps, Rares are big and bring new tricks, Legendaries transform the spell.
// Level 3 is always Rare or better; level 5 is always Legendary. Cards lean toward the path you took.
import { S } from './core.js';

export const RAR = [
  { name: 'Common', col: '#cfc6b0' },
  { name: 'Rare', col: '#5fb0ff' },
  { name: 'Legendary', col: '#ffb02e' }];
export const MAX_LEVEL = 5;
// aura colours for transformed creatures (index stored in 'aura:<kind>')
export const AURA = [null, [.42, .3, .05], [.08, .22, .42], [.42, .03, .03], [.26, .08, .42], [.3, .32, .36], [.12, .4, .14], [.45, .18, .02]];

const pct = v => `${Math.round(v * 100)}%`;
const U = (s, n = 2) => n === 1 ? s.unit[0] : s.unit[1];
const isSummon = s => s.kind !== undefined;
const hasDmg = s => s.dmg !== undefined;
const area = s => s.radius !== undefined && s.type !== 'buff' && s.id !== 'mark';

// a card template: k id, tag (for branching), rarity it belongs to, where it fits, effect and text
const C = (k, tag, r, fits, fx, text, name) => ({ k, tag, r, fits, fx, text, name });
const T = [
  // ===== summons: common =====
  C('count', 'count', 0, s => isSummon(s) && s.n > 1, s => ({ ['n:' + s.id]: 1 }), s => `+1 ${U(s, 1)} per cast`, 'Numerous'),
  C('tough', 'tough', 0, isSummon, s => ({ ['hp:' + s.kind]: .4 }), s => `${U(s)} have +40% health`, 'Sturdy'),
  C('power', 'power', 0, isSummon, s => ({ ['dmg:' + s.kind]: .3 }), s => `${U(s)} deal +30% damage`, 'Sharpened'),
  C('speed', 'speed', 0, isSummon, s => ({ ['spd:' + s.kind]: .25 }), s => `${U(s)} move 25% faster`, 'Swift'),
  C('haste', 'speed', 0, isSummon, s => ({ ['haste:' + s.kind]: .25 }), s => `${U(s)} attack 25% faster`, 'Eager'),
  C('lasting', 'lasting', 0, (s, K) => isSummon(s) && K[s.kind].life > 0, s => ({ ['life:' + s.kind]: .5 }), s => `${U(s)} last 50% longer`, 'Enduring'),
  C('unrot', 'lasting', 0, (s, K) => isSummon(s) && K[s.kind].rot > 0, s => ({ ['rot:' + s.kind]: .5 }), s => `${U(s)} rot half as fast`, 'Embalmed'),
  // ===== summons: rare =====
  C('count2', 'count', 1, isSummon, s => ({ ['n:' + s.id]: s.n > 1 ? 2 : 1 }), s => `+${s.n > 1 ? 2 : 1} ${U(s, s.n > 1 ? 2 : 1)} per cast`, 'Legion'),
  C('tough2', 'tough', 1, isSummon, s => ({ ['hp:' + s.kind]: .8 }), s => `${U(s)} have +80% health`, 'Ironbound'),
  C('power2', 'power', 1, isSummon, s => ({ ['dmg:' + s.kind]: .6 }), s => `${U(s)} deal +60% damage`, 'Brutal'),
  C('speed2', 'speed', 1, isSummon, s => ({ ['spd:' + s.kind]: .5, ['haste:' + s.kind]: .3 }), s => `${U(s)} move 50% faster and attack 30% faster`, 'Fleet'),
  C('armor', 'tough', 1, isSummon, s => ({ ['armor:' + s.kind]: .25 }), s => `${U(s)} take 25% less damage`, 'Plated'),
  C('boom', 'boom', 1, isSummon, s => ({ ['boom:' + s.kind]: 10 }), s => `${U(s)} explode when they die, hitting nearby foes for 10`, 'Volatile'),
  C('leech', 'leech', 1, isSummon, s => ({ ['leech:' + s.kind]: 3 }), s => `${U(s)} heal 3 health with every hit`, 'Hungry'),
  C('chill', 'chill', 1, isSummon, s => ({ ['chill:' + s.kind]: 3 }), s => `${U(s)} slow every foe they hit for 3s`, 'Chilling'),
  C('regen', 'tough', 1, isSummon, s => ({ ['regen:' + s.kind]: 3 }), s => `${U(s)} regenerate 3 health per second`, 'Regrowing'),
  C('siege', 'power', 1, isSummon, s => ({ ['siege:' + s.kind]: 1.5 }), s => `${U(s)} hit walls, gates and towers 2.5× as hard`, 'Wallbreaker'),
  C('lasting2', 'lasting', 1, (s, K) => isSummon(s) && K[s.kind].life > 0, s => ({ ['life:' + s.kind]: 1 }), s => `${U(s)} last twice as long`, 'Lingering'),
  C('unrot2', 'lasting', 1, (s, K) => isSummon(s) && K[s.kind].rot > 0, s => ({ ['rot:' + s.kind]: .85 }), s => `${U(s)} barely rot at all`, 'Preserved'),
  // ===== summons: legendary transformations =====
  C('giant', ['tough', 'power'], 2, isSummon, s => ({ ['scale:' + s.kind]: .7, ['hp:' + s.kind]: 2, ['dmg:' + s.kind]: 1, ['spd:' + s.kind]: -.2, ['armor:' + s.kind]: .3, ['siege:' + s.kind]: 1, ['aura:' + s.kind]: 1 }),
    s => `${U(s)} grow 70% bigger: triple health, double damage, take 30% less damage and smash walls twice as hard, but move 20% slower`, 'Giant'),
  C('swarm', ['count'], 2, isSummon, s => ({ ['n:' + s.id]: s.n * 2, ['scale:' + s.kind]: -.4, ['hp:' + s.kind]: -.5 }),
    s => `Swarm: every cast brings three times as many ${U(s)}. They're 40% smaller with half health, but hit just as hard`, 'Swarm'),
  C('split', ['count', 'tough'], 2, isSummon, s => ({ ['split:' + s.kind]: 1, ['hp:' + s.kind]: .3 }),
    s => `Splitting: when one of your ${U(s)} dies it splits into two smaller copies with half health`, 'Splitting'),
  C('blink', ['speed'], 2, isSummon, s => ({ ['blink:' + s.kind]: 1, ['armor:' + s.kind]: .35, ['aura:' + s.kind]: 4 }),
    s => `Phasing: ${U(s)} teleport onto foes up to 15m away every few seconds, and take 35% less damage`, 'Phasing'),
  C('quick', ['speed'], 2, isSummon, s => ({ ['spd:' + s.kind]: 1.2, ['haste:' + s.kind]: 1, ['trail:' + s.kind]: 1, ['aura:' + s.kind]: 5 }),
    s => `Quicksilver: ${U(s)} move 2.2× as fast and attack twice as fast, streaking across the field`, 'Quicksilver'),
  C('undying', ['tough', 'lasting'], 2, isSummon, s => ({ ['rebirth:' + s.kind]: 1, ['aura:' + s.kind]: 6 }),
    s => `Undying: the first time one of your ${U(s)} dies, it rises again a moment later at full health`, 'Undying'),
  C('champion', ['power', 'count'], 2, isSummon, s => ({ ['champ:' + s.id]: 1 }),
    s => `Champion: every cast also brings a golden champion ${U(s, 1)}, bigger, with 2.5× health and 1.5× damage`, 'Champion'),
  C('volatile', ['count', 'boom'], 2, isSummon, s => ({ ['boom:' + s.kind]: 30, ['boomR:' + s.kind]: 1.6, ['aura:' + s.kind]: 7 }),
    s => `Living bombs: ${U(s)} explode when they die, hitting everything in a wide blast for 30`, 'Living Bombs'),
  C('vampire', ['power', 'leech'], 2, isSummon, s => ({ ['leech:' + s.kind]: 6, ['dmg:' + s.kind]: .3, ['aura:' + s.kind]: 3 }),
    s => `Bloodbound: ${U(s)} heal 6 with every hit and deal +30% damage`, 'Bloodbound'),
  C('frost', ['speed', 'chill'], 2, isSummon, s => ({ ['chill:' + s.kind]: 4, ['dmg:' + s.kind]: .25, ['armor:' + s.kind]: .15, ['aura:' + s.kind]: 2 }),
    s => `Frostbound: ${U(s)} freeze foes they hit (slowed 4s), deal +25% damage and take 15% less`, 'Frostbound'),
  // ===== attacks: common =====
  C('apower', 'power', 0, hasDmg, s => ({ ['sp:' + s.id]: .35 }), () => '+35% damage', 'Searing'),
  C('size', 'size', 0, area, s => ({ ['rad:' + s.id]: .25 }), () => '+25% area', 'Wide'),
  C('jumps', 'count', 0, s => s.jumps !== undefined, s => ({ ['n:' + s.id]: 3 }), () => 'Jumps to 3 more foes', 'Forking'),
  C('more', 'count', 0, s => s.id === 'sacrifice', s => ({ ['n:' + s.id]: 2 }), () => 'Takes 2 more undead', 'Greedy'),
  // ===== attacks: rare =====
  C('apower2', 'power', 1, hasDmg, s => ({ ['sp:' + s.id]: .7 }), () => '+70% damage', 'Brutal'),
  C('size2', 'size', 1, area, s => ({ ['rad:' + s.id]: .5 }), () => '+50% area', 'Vast'),
  C('jumps2', 'count', 1, s => s.jumps !== undefined, s => ({ ['n:' + s.id]: 6 }), () => 'Jumps to 6 more foes', 'Branching'),
  C('aslow', 'chill', 1, s => hasDmg(s) && s.type === 'attack', s => ({ ['slow:' + s.id]: 3 }), () => 'Slows every foe hit for 3s', 'Freezing'),
  C('drain', 'drain', 1, hasDmg, s => ({ ['drain:' + s.id]: 3 }), () => 'Heals you 3 for each foe hit', 'Draining'),
  C('manahit', 'drain', 1, hasDmg, s => ({ ['manahit:' + s.id]: 1.5 }), () => 'Gives back 1.5 mana for each foe hit', 'Channeling'),
  C('weaken', 'chill', 1, hasDmg, s => ({ ['weaken:' + s.id]: 6 }), () => 'Foes hit deal half damage and take 25% more for 6s', 'Withering'),
  C('linger', 'size', 1, s => area(s) && hasDmg(s) && s.id !== 'storm' && s.id !== 'pounce', s => ({ ['linger:' + s.id]: .5 }), () => 'Leaves a burning patch for 4s that hits foes each second for half the damage', 'Smoldering'),
  // ===== attacks: legendary transformations =====
  C('cataclysm', ['power', 'size'], 2, hasDmg, s => ({ ['sp:' + s.id]: 1.5, ['rad:' + s.id]: area(s) ? .6 : 0, ['big:' + s.id]: 1 }), () => 'Cataclysm: 2.5× damage and 60% more area, with a blast that shakes the ground', 'Cataclysm'),
  C('barrage', ['size', 'count'], 2, s => s.aim && area(s) && hasDmg(s) && s.id !== 'pounce' && !s.ult, s => ({ ['barrage:' + s.id]: 4 }), () => 'Barrage: four more strikes rain down around your aim, each at 70% damage', 'Barrage'),
  C('echo', ['power', 'count'], 2, s => s.type === 'attack' || s.id === 'sacrifice', s => ({ ['echo:' + s.id]: 2 }), () => 'Triple cast: it casts itself twice more, for free, a moment apart', 'Triple Cast'),
  C('vortex', ['size', 'chill'], 2, s => area(s) && hasDmg(s), s => ({ ['vortex:' + s.id]: 1, ['sp:' + s.id]: .3 }), () => 'Vortex: drags every foe within twice the area into the center before it hits, +30% damage', 'Vortex'),
  C('inferno', ['size', 'power'], 2, s => area(s) && hasDmg(s) && s.id !== 'storm' && s.id !== 'pounce', s => ({ ['linger:' + s.id]: .8, ['lingerT:' + s.id]: 4, ['rad:' + s.id]: .2 }), () => 'Inferno: leaves a blaze for 8s that hits foes each second for 80% of the damage', 'Inferno'),
  C('fan', ['count', 'power'], 2, s => s.line, s => ({ ['fan:' + s.id]: 1 }), () => 'Fan: fires three at once in a spread', 'Fan of Three'),
  C('soul', ['drain'], 2, hasDmg, s => ({ ['drain:' + s.id]: 8, ['manahit:' + s.id]: 2 }), () => 'Soul-eater: heals you 8 and gives 2 mana for each foe hit', 'Soul-eater'),
  C('vast', ['size'], 2, s => s.radius !== undefined && !hasDmg(s), s => ({ ['rad:' + s.id]: 1 }), () => 'Twice the area', 'Boundless'),
  // ===== buffs and utility =====
  C('duration', 'duration', 0, s => s.dur !== undefined, s => ({ ['dur:' + s.id]: .4 }), () => 'Lasts 40% longer', 'Lasting'),
  C('reach', 'size', 0, s => s.type === 'buff' && s.boosts && !s.util, s => ({ ['rad:' + s.id]: .4 }), () => 'Reaches 40% farther', 'Wide'),
  C('heal', 'heal', 0, s => s.heal !== undefined, s => ({ ['heal:' + s.id]: .4 }), () => 'Heals 40% more', 'Soothing'),
  C('duration2', 'duration', 1, s => s.dur !== undefined, s => ({ ['dur:' + s.id]: .8 }), () => 'Lasts 80% longer', 'Prolonged'),
  C('reach2', 'size', 1, s => s.type === 'buff' && s.boosts && !s.util, s => ({ ['rad:' + s.id]: .8 }), () => 'Reaches 80% farther', 'Far-reaching'),
  C('heal2', 'heal', 1, s => s.heal !== undefined, s => ({ ['heal:' + s.id]: .8 }), () => 'Heals 80% more', 'Restorative'),
  C('mend', 'heal', 1, s => s.type === 'buff' && s.id !== 'sacrifice' && s.heal === undefined, s => ({ ['mend:' + s.id]: 15 }), () => 'Also heals your creatures nearby for 15', 'Mending'),
  C('overdrive', ['duration', 'size'], 2, s => s.boosts || s.id === 'shape', s => ({ ['od:' + s.id]: 1 }),
    s => s.id === 'shape' ? 'Dire form: claws deal 4× damage and you take only a quarter of the damage' : 'Overdrive: the effect is far stronger (damage +140%, speed +120%, damage taken cut to a quarter)', 'Overdrive'),
  C('auto', ['duration', 'heal'], 2, s => s.type === 'buff' && s.id !== 'sacrifice' && !s.util, s => ({ ['auto:' + s.id]: 1 }), () => 'Ever-burning: it casts itself for free whenever it runs out (every 12s for heals)', 'Ever-burning'),
  C('sanct', ['heal'], 2, s => s.heal !== undefined && s.type === 'buff', s => ({ ['sanct:' + s.id]: 1, ['heal:' + s.id]: .5 }), () => 'Sanctuary: heals 50% more, and everything it heals takes half damage for 8s', 'Sanctuary'),
  C('mend3', ['heal', 'size'], 2, s => s.type === 'buff' && s.id !== 'sacrifice' && s.heal === undefined, s => ({ ['mend:' + s.id]: 40 }), () => 'Also heals your creatures nearby for 40', 'Sanctified'),
  C('overflow', ['heal'], 2, s => s.heal !== undefined && s.type === 'buff', s => ({ ['heal:' + s.id]: 1.5 }), () => 'Overflowing: heals 2.5 times as much', 'Overflowing'),
  C('eternal', ['duration'], 2, s => s.dur !== undefined, s => ({ ['dur:' + s.id]: 2 }), () => 'Lasts three times as long', 'Eternal'),
  // ===== any spell =====
  C('thrift', 'thrift', 0, () => true, s => ({ ['cost:' + s.id]: .2 }), () => 'Costs 20% less mana', 'Frugal'),
  C('thrift2', 'thrift', 1, () => true, s => ({ ['cost:' + s.id]: .35 }), () => 'Costs 35% less mana', 'Effortless'),
];
const tagsOf = t => Array.isArray(t.tag) ? t.tag : [t.tag];

export const levelOf = id => 1 + ((S.spellUps && S.spellUps[id]) || []).length;

// Rares are uncommon outside level 3; Legendaries almost only at level 5
function rollRarity(level) {
  const r = Math.random();
  if (level === 2) return r < .08 ? 1 : 0;
  if (level === 3) return r < .05 ? 2 : 1;
  if (level === 4) return r < .03 ? 2 : r < .25 ? 1 : 0;
  return 2;
}

export function makeOffer(s, K) {
  const taken = S.spellUps[s.id] || [], tags = taken.flatMap(c => [].concat(c.tag)), level = taken.length + 2;
  const cards = [], used = new Set(taken.filter(c => c.r === 2).map(c => c.k));   // each transformation only once
  for (let n = 0; n < 12 && cards.length < 3; n++) {
    let r = rollRarity(level);
    let pool = T.filter(t => t.r === r && t.fits(s, K) && !used.has(t.k) && !cards.some(c => c.k === t.k));
    while (!pool.length && r > 0 && level < 5) { r--; pool = T.filter(t => t.r === r && t.fits(s, K) && !used.has(t.k) && !cards.some(c => c.k === t.k)); }
    if (!pool.length) break;
    // the path you've taken pulls the draw toward more of the same
    const w = pool.map(t => 1 + 2.5 * tagsOf(t).reduce((a, g) => a + tags.filter(x => x === g).length, 0));
    let x = Math.random() * w.reduce((a, b) => a + b, 0), k = 0;
    while (k < pool.length - 1 && x > w[k]) x -= w[k++];
    const t = pool[k], fx = t.fx(s);
    for (const key in fx) if (!fx[key]) delete fx[key];
    let text = t.text(s); if (text.startsWith(t.name + ': ')) text = text.slice(t.name.length + 2); text = text[0].toUpperCase() + text.slice(1);
    cards.push({ k: t.k, tag: t.tag, r, name: t.name, text, fx });
  }
  return cards;
}

// fold every chosen card into the modifier table
export function addUpgradeMods(m) {
  for (const id in (S.spellUps || {})) for (const c of S.spellUps[id]) for (const k in c.fx) m[k] = (m[k] || 0) + c.fx[k];
}
export const legendNames = id => ((S.spellUps || {})[id] || []).filter(c => c.r === 2).map(c => c.name);
