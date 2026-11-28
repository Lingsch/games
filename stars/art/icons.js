// Stars Beneath: one pictograph per ability, by the ability's name. Names it shares with the fantasy game
// keep that game's pictograph; an ability not listed falls back to the pictograph for its emoji (artkit/iconmap.js).
import { ABILITY as SHARED } from '../../mmo/art/icons.js';
export const ABILITY = {
  ...SHARED,
  // Vanguard
  'Maul Strike': 'flat-hammer', 'Shockwave': 'sonic-boom', 'Barrier Wall': 'barricade', 'Rallying Call': 'rally-the-troops', 'Battle Cadence': 'drum-kit',
  // Field Medic
  'Stun Dart': 'dart', 'Toxin Dart': 'chemical-arrow', 'Overcharge Shot': 'supersonic-bullet', 'Medigel': 'first-aid-kit', 'Revive': 'defibrilate', 'Quick Patch': 'sticking-plaster', 'Keep Low': 'kneeling',
  'Full Restore': 'health-increase', 'Triage Field': 'hospital-cross', 'Group Infusion': 'medical-drip', 'Guardian Drone': 'delivery-drone', 'Booster Shot': 'hypodermic-test', 'Steady Hands': 'hand-ok', 'Miracle Worker': 'medical-pack',
  // Hunter
  'Snap Shot': 'gunshot', 'Suppressing Fire': 'bullets', 'Ricochet': 'ricochet', 'Scope In': 'reticule', 'Spotter': 'binoculars',
  // Arc Gunner
  'Incendiary Round': 'ember-shot', 'Cryo Round': 'ice-bolt', 'Arc Round': 'plasma-bolt', 'Breaching Charge': 'dynamite', 'Cryo Grenade': 'ice-bomb', 'Chain Arc': 'chain-lightning', 'Demolition Charge': 'time-bomb',
  'Prism Round': 'laser-burst', 'Hot Loads': 'heavy-bullets', 'Reactive Plating': 'metal-plate', 'Danger Close': 'carpet-bombing',
  // Lamp Knight and Dusk Knight
  'Wheel of Light': 'light-sabers', "Keeper's Flourish": 'lightning-saber', 'Trimmed Wick': 'candle-light',
  // Breaker
  'Hammer Blow': 'warhammer', 'Finisher': 'deadly-strike', 'Drilled Discipline': 'black-belt', 'Kinetic Ward': 'vibrating-shield', 'Thousand Blows': 'mighty-force',
  // Adept
  'Play Dead': 'dead-head', 'Nerve Strike': 'spinal-coil', 'Spinning Kick': 'high-kick',
  // Shield Tech
  'Shock Pulse': 'pulse', 'Arc Tether': 'tesla-coil', 'Barrier Burst': 'bubble-field', 'Nano Patch': 'nano-bot', 'Echo Barrier': 'shield-echoes', 'Shelter Projector': 'light-projector', 'Bastion Field': 'habitat-dome',
  'Purge Pulse': 'radial-balance', 'Mirror Barrier': 'shield-reflect', 'Dome Shield': 'lightning-dome', 'Hardened Emitters': 'power-generator', 'Steady State': 'gyroscope', 'Fortress Protocol': 'locked-fortress',
  // Lifebinder and Bloodbinder
  'Searing Ray': 'laser-blast', 'Lingering Light': 'burning-dot', 'Renewing Light': 'fire-flower', 'Mending Glow': 'glowing-hands', 'Rekindle': 'match-head', 'Spreading Light': 'star-formation', 'Lifeflame': 'fire-silhouette',
  'Stillness': 'meditation', 'Steady Flame': 'candle-holder', 'Quiet Mind': 'inner-self', 'Beacon': 'lighthouse',
  // Xenobiologist
  'Spore Dart': 'pollen-dust', 'Bio-serum': 'test-tubes', 'Creeper Pod': 'carnivorous-plant', 'Regrowth Serum': 'corked-tube', 'Brute Strain': 'gorilla', 'Stalker Strain': 'saber-toothed-cat-head', 'Spore Storm': 'mushroom-cloud',
  'Homing Beacon': 'radar-sweep', 'Acid Rain': 'acid', 'Pack Pheromone': 'fragrance', 'Barbed Hide': 'porcupine', 'Adaptive Graft': 'dna1', 'Call the Brood': 'alien-egg',
  // Sentinel and Shade
  'Dazzle': 'flash-grenade', 'Veil': 'invisible', 'Lightstep': 'wingfoot', 'Fan of Sparks': 'laser-sparks', 'Oath of the Vigil': 'templar-eye', 'Mark of Judgment': 'convergence-target',
  // Smuggler
  'Toxin Round': 'chemical-bolt', 'Quick Draw': 'revolver', 'Bleeder Round': 'bullet-impacts', 'Leg Shot': 'knee-cap', 'Spreader': 'chemical-tank', 'Detonate': 'detonator', 'Gas Grenade': 'poison-gas', 'Double Dose': 'overdose',
  'Coated Rounds': 'shotgun-rounds', 'Antitoxin': 'medicines', 'Outbreak': 'virus',
  // Envoy
  'Cutting Remark': 'sharp-lips', 'Lull': 'night-sleep', 'Silver Tongue': 'tongue', 'Deep Breath': 'lungs', 'Feedback Shriek': 'sonic-screech', 'Anthem of Valor': 'anthem', "Spacer's Shanty": 'accordion', 'Quickstep': 'sprint',
  // Lumenist and Necromancer
  'Radiant Bolt': 'sinusoidal-beam', 'Searing Brand': 'fire-ring', 'Brand of Truth': 'eye-of-horus', 'Draw the Light': 'extraction-orb', 'Dimming': 'eclipse', 'Blinding Glare': 'sun-radiations', 'Rain of Light': 'sunbeams',
  'Kindle': 'kindle', 'Lamp Oath': 'lantern-flame', 'Shared Flame': 'candles', 'Gather the Light': 'concentration-orb',
  // Machinist
  'Arc Lash': 'electric-whip', 'Deploy Burner Drone': 'flamethrower', 'Deploy Bulwark Drone': 'robot-golem', 'Overclock': 'overdrive', 'Deploy Medic Drone': 'medical-pack-alt', 'Deploy Arc Drone': 'tesla-turret',
  'Field Repair': 'auto-repair', 'Focus Fire': 'laser-precision', 'Fourfold Shield': 'rosa-shield', 'Command Link': 'radar-dish', 'Shared Uplink': 'mesh-network', 'Swarm Protocol': 'missile-swarm',
  // Holomancer
  'Light Spike': 'ringed-beam', 'Hard-light Decoy': 'holosphere', 'Cloak': 'cloak', 'Override': 'artificial-intelligence', 'Mass Dazzle': 'bright-explosion', 'Phantom Killer': 'spectre',
};
