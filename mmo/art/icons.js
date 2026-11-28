// Single-Player MMO: one pictograph per ability, by the ability's name. An ability not listed here
// falls back to the pictograph for its emoji (artkit/iconmap.js), so new abilities still get a symbol.
export const ABILITY = {
  // shared
  'Auto Attack': 'crossed-swords', 'Attack': 'crossed-swords', 'Lampfall': 'falling-star', 'Light Everlasting': 'candlebright', "Hearth's Resolve": 'fireplace', 'Lamplit Bulwark': 'lantern-flame',
  'Bloodhowl': 'werewolf', 'Stoneform': 'stone-bust', 'Borrowed Breath': 'soul',
  // Bulwark
  'Heavy Strike': 'hammer-drop', 'Taunt': 'shouting', 'Shield Slam': 'shield-bash', 'Thunderclap': 'thunder-struck', 'Shield Wall': 'defensive-wall', 'Second Wind': 'heart-wings', 'Shield Bash': 'shield-impact',
  'Rallying Cry': 'rally-the-troops', 'Battle Shout': 'sonic-shout', 'Iron Resolve': 'mailed-fist', 'Unbreakable': 'diamond-hard', 'Unbroken Bastion': 'guarded-tower', 'Shieldbreaker': 'broken-shield',
  'Judgement': 'banging-gavel', 'Consecration': 'holy-symbol',
  // High Cleric
  'Smite': 'sun-spear', 'Mending Light': 'healing', 'Resurrect': 'heaven-gate', 'Swift Light': 'energise', 'Hide in Light': 'invisible', 'Complete Heal': 'health-increase', 'Sanctuary': 'church',
  'Prayer of Healing': 'prayer', 'Guardian Spirit': 'ghost-ally', 'Fortitude': 'strong', 'Inner Light': 'inner-self', 'Miracle': 'hand-of-god', 'Holy Fire': 'celebration-fire', 'Sentence': 'gavel',
  'Radiance': 'beams-aura', "Lightbringer's Sanctuary": 'slumbering-sanctuary',
  // Longwatch
  'Quick Shot': 'pocket-bow', 'Aimed Shot': 'arrow-scope', 'Pinning Shot': 'barbed-arrow', 'Fall Back': 'jump-across', 'Volley': 'arrow-cluster', 'Deadeye': 'dead-eye', 'Multi-Shot': 'striking-arrows',
  'Rapid Fire': 'arrow-flights', 'Eagle Eye': 'eagle-head', 'Trueshot Aura': 'on-target', "Hunter's Moon": 'falcon-moon', 'Volley of Thorns': 'thorned-arrow', "Hunter's Mark": 'convergence-target',
  'Perfect Shot': 'bullseye', 'Steady Aim': 'crosshair-arrow',
  // Elementalist
  'Fire Bolt': 'fireball', 'Frost Shard': 'ice-spear', 'Lightning Lash': 'lightning-arc', 'Stone Spike': 'stone-spear', 'Frost Nova': 'icicles-aura', 'Chain Lightning': 'chain-lightning', 'Meteor': 'burning-meteor',
  'Prismatic Bolt': 'prism', 'Kindled Mind': 'enlightenment', 'Elemental Ward': 'magic-shield', 'Cataclysm': 'meteor-impact', 'Inferno': 'fire-wave', 'Skyfall': 'fragmented-meteor', 'Skyfork': 'lightning-branches',
  'Storm Ward': 'lightning-shield',
  // Wardancer
  'Flicker Strike': 'quick-slash', 'Challenge': 'confrontation', 'Counter': 'shield-bounces', 'Whirling Blades': 'spinning-blades', 'Blur': 'dodging', 'Second Step': 'ballerina-shoes', 'Blade Flurry': 'sword-array',
  'Taunting Flourish': 'sword-brandish', 'Keen Edge': 'relic-blade', 'Light Feet': 'wingfoot', 'Untouchable': 'evasion', 'Whirling Steel': 'sword-spin', 'Mirage Step': 'two-shadows', 'Tempest Strike': 'thunder-blade',
  'Gale Guard': 'whirlwind',
  // Bladewarden
  'Hew': 'sword-slice', 'Call Out': 'megaphone', 'Riposte': 'riposte', 'Sweeping Arc': 'saber-slash', 'Guard Stance': 'slashed-shield', 'Rally': 'knight-banner', 'Disarm': 'drop-weapon', 'Execution': 'decapitation',
  'Steel Discipline': 'anvil-impact', 'Blade Ward': 'winged-sword', 'Thousand Cuts': 'crossed-slashes', "Warlord's Call": 'warlord-helmet', 'Sundering Blow': 'hammer-break', 'Crimson Cleave': 'bloody-sword',
  'Crimson Pact': 'vampire-dracula',
  // Monk
  'Palm Strike': 'open-palm', 'Feign Death': 'dead-head', 'Provoke': 'punch', 'Tiger Claw': 'claw-slashes', 'Stunning Palm': 'knocked-out-stars', 'Whirlwind Kick': 'high-kick', 'Inner Calm': 'meditation',
  'Flying Kick': 'boot-kick', 'Iron Body': 'muscular-torso', 'Way of the Wind': 'windy-stripes', 'Focused Mind': 'third-eye', 'Hundred Fists': 'punch-blast', 'Mending Palm': 'magic-palm', 'Still Water': 'droplets',
  'Thunder Palm': 'fulguro-punch', 'Storm of Fists': 'mighty-force',
  // Aegis
  'Judgment': 'law-star', 'Aegis Ward': 'healing-shield', 'Mending Word': 'book-aura', 'Ward of Echoes': 'shield-echoes', 'Rune of Shelter': 'rune-stone', 'Bastion': 'stone-tower', 'Purging Light': 'aura',
  'Reflective Ward': 'shield-reflect', 'Barrier': 'barrier', 'Aegis of Faith': 'templar-shield', 'Serenity': 'lotus', 'Divine Bulwark': 'winged-shield', 'Aegis Wall': 'shieldcomb', "Maiden's Rebuke": 'spiked-halo',
  'Foresight': 'warlock-eye', 'Prophecy': 'all-seeing-eye',
  // Lifebinder
  'Thornlash': 'vine-whip', 'Renew': 'sprout', 'Mending Bloom': 'lotus-flower', 'Rejuvenate': 'leaf-swirl', 'Wild Growth': 'tree-growth', 'Swiftmend': 'heart-drop', 'Lifebloom': 'spiral-bloom', 'Tranquility': 'peace-dove',
  'Verdant Vigor': 'wheat', 'Rooted Mind': 'tree-roots', 'Tree of Life': 'holy-oak', 'Thornbind': 'thorny-vine', 'Living Ward': 'ground-sprout', 'Transfusion': 'transfuse', 'Sanguine Burst': 'bleeding-heart',
  // Druid
  'Moonfire': 'eclipse-flare', 'Healing Touch': 'glowing-hands', 'Entangle': 'curling-vines', 'Regrowth': 'stump-regrowth', 'Bear Form': 'bear-head', 'Cat Form': 'lynx-head', 'Hurricane': 'tornado', 'Grove Gate': 'magic-portal',
  'Starfall': 'stars-stack', 'Spirit of the Wolf': 'wolf-howl', 'Thorns': 'thorn-helix', 'Mark of the Wild': 'paw-print', 'Force of Nature': 'tree-face', 'Stampede': 'bison', 'Pack Bond': 'direwolf', 'Bloom': 'twirly-flower',
  'Barkskin Grove': 'oak',
  // Knifeshade
  'Stab': 'knife-thrust', 'Backstab': 'backstab', 'Gouge': 'bleeding-eye', 'Evade': 'dodge', 'Vanish': 'smoke-bomb', 'Ambush': 'hooded-assassin', 'Shadowstep': 'shadow-follower', 'Fan of Knives': 'thrown-daggers',
  'Deadly Focus': 'eye-target', 'Shadow Pact': 'shadow-grasp', 'Death Mark': 'death-zone', 'Deathmark': 'skull-signet', 'Shadowstep Strike': 'diving-dagger', 'Fan of Shadows': 'daggers', 'Into the Night': 'cloak-dagger',
  // Blightblade
  'Envenom': 'poison-bottle', 'Gash': 'ragged-wound', 'Rupture': 'bleeding-wound', 'Crippling Poison': 'slow-blob', 'Plague Spread': 'biohazard', 'Toxic Burst': 'goo-explosion', 'Noxious Cloud': 'poison-cloud',
  'Lethal Doses': 'skull-with-syringe', 'Poisoned Blades': 'dripping-blade', 'Antivenom': 'miracle-medecine', 'Pandemic': 'virus', 'Pestilence': 'plague-doctor-profile', 'Contagion': 'infested-mass', 'Hex Strike': 'cursed-star',
  'Blight Ward': 'acid-shield',
  // Bard
  'Dissonant Chord': 'guitar', 'Lullaby': 'night-sleep', "Siren's Call": 'mermaid', 'Song of the Sea': 'wave-crest', 'Discordant Shriek': 'sonic-screech', 'Song of Valor': 'music-spell', "Traveler's Tune": 'pan-flute',
  'Song of Rest': 'harp', 'Song of Haste': 'drum', 'Crescendo': 'trumpet', 'War Saga': 'scroll-unfurled', 'Thundering Verse': 'sonic-lightning', 'Ballad of Mending': 'violin', "Minstrel's Lullaby": 'lyre',
  // Warlock
  'Shadow Bolt': 'skull-bolt', 'Corruption': 'dripping-goo', 'Curse of Agony': 'despair', 'Drain Life': 'life-tap', 'Curse of Weakness': 'armor-downgrade', 'Terror': 'terror', 'Rain of Fire': 'three-burning-balls',
  'Dark Bargain': 'evil-hand', 'Dark Pact': 'pentacle', 'Blood Pact': 'sacrificial-dagger', 'Soul Harvest': 'reaper-scythe', 'Reap the Soul': 'grim-reaper', 'Doom': 'sands-of-time', 'Curse of Ruin': 'evil-moon',
  'Pact of Shadow': 'bottled-shadow',
  // Binder
  'Elemental Lash': 'electric-whip', 'Bind Fire Spirit': 'ifrit', 'Bind Stone Guardian': 'rock-golem', 'Empower Bond': 'embrassed-energy', 'Bind Water Spirit': 'water-bolt', 'Bind Storm Sprite': 'spark-spirit',
  'Mend Bond': 'relationship-bounds', 'Primal Strike': 'blast', 'Fourfold Ward': 'rosa-shield', 'Fourfold Seal': 'wax-seal', 'Elemental Kinship': 'triorb', 'Unbound': 'breaking-chain', 'Earthen Avatar': 'golem-head',
  'Quake': 'earth-crack', 'Spirit Link': 'andromeda-chain', 'Wisp Storm': 'circle-sparks',
  // Illusionist
  'Mind Spike': 'psychic-waves', 'Mesmerize': 'star-pupil', 'Mirror Image': 'mirror-mirror', 'Fade from Mind': 'invisible-face', 'Charm': 'charm', 'Mass Mesmerize': 'hive-mind', 'Slow': 'snail', 'Phantasmal Killer': 'spectre',
  'Clarity': 'cut-diamond', 'Haste': 'sprint', 'Gift of Insight': 'gift-of-knowledge', 'Grand Illusion': 'duality-mask', 'Mind Shatter': 'brainstorm', 'Haste Weave': 'clockwork', 'Phantasm Blades': 'flying-dagger',
  'Mirror Veil': 'double-face-mask',
};
