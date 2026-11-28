// Which pictograph stands in for each emoji the games use, and the colour it is drawn in.
// The games still write emoji; the interface skin swaps each for its pictograph as it appears.
// To change one, change its name here: the names are the files in artkit/icons/ (all drawn in artkit/draw/, see the README).
const W = '#e9dcc0', STEEL = '#b9c7d8', FIRE = '#ff9a4a', ICE = '#9fe6ff', STORM = '#c9b8ff', EARTH = '#d8b27a', HOLY = '#ffe9a0', DARK = '#c08aff',
  LIFE = '#8fe07a', BLOOD = '#ff6a5a', GOLD = '#ffd34d', POISON = '#a8e85a', WATER = '#6fc0ff', PINK = '#ff9ad0';
export const EMOJI = {
  '⚔️': ['crossed-swords', STEEL], '🔥': ['flame', FIRE], '🛡️': ['shield', '#9fc0e8'], '🗡️': ['plain-dagger', '#ffe08a'], '🧪': ['fizzing-flask', LIFE], '✨': ['sparkles', HOLY],
  '📜': ['scroll-unfurled', W], '🎯': ['archery-target', BLOOD], '🔆': ['sunbeams', HOLY], '🔮': ['crystal-ball', '#c9a2ff'], '🩸': ['blood', BLOOD], '🌿': ['three-leaves', LIFE],
  '🌑': ['eclipse', DARK], '🪨': ['rock', EARTH], '🎣': ['fishing-pole', WATER], '💚': ['heart-plus', '#7dff7a'], '🕯️': ['candle-flame', HOLY], '🌳': ['oak', LIFE], '🌀': ['vortex', STORM],
  '💀': ['death-skull', W], '🐎': ['horse-head', EARTH], '👁️': ['eyeball', W], '🐾': ['paw-print', EARTH], '💨': ['wind-slap', STEEL], '🏹': ['bow-arrow', EARTH], '🏰': ['castle', STEEL],
  '⚖️': ['scales', GOLD], '💧': ['water-drop', WATER], '⚡': ['power-lightning', GOLD], '🎺': ['trumpet', GOLD], '🌙': ['moon', '#d8e0ff'], '🐺': ['wolf-head', STEEL], '🎶': ['musical-notes', PINK],
  '🔨': ['thor-hammer', STEEL], '🔪': ['bowie-knife', STEEL], '❤️': ['hearts', BLOOD], '💥': ['explosion-rays', FIRE], '🌟': ['round-star', GOLD], '🍄': ['mushroom', BLOOD], '🍲': ['cooking-pot', EARTH],
  '🌊': ['big-wave', WATER], '🔔': ['ringing-bell', GOLD], '☣️': ['biohazard', POISON], '☣': ['biohazard', POISON], '🍖': ['meat', BLOOD], '⚙️': ['cog', STEEL], '🎖️': ['medal', GOLD], '⏩': ['fast-forward-button', ICE],
  '🌱': ['sprout', LIFE], '🤺': ['fencer', STEEL], '🌪️': ['tornado', STEEL], '🌋': ['volcano', FIRE], '📖': ['open-book', W], '👊': ['fist', EARTH], '👥': ['three-friends', W], '🗿': ['moai', EARTH],
  '🦠': ['virus', POISON], '☄️': ['comet-spark', FIRE], '🌩️': ['lightning-storm', STORM], '🪞': ['mirror-mirror', ICE], '🔵': ['bubble-field', WATER], '❄️': ['snowflake-1', ICE], '💰': ['coins', GOLD],
  '🔰': ['bordered-shield', LIFE], '🎭': ['drama-masks', DARK], '📣': ['megaphone', GOLD], '🌫️': ['fog', STEEL], '🕸️': ['spider-web', W], '🧊': ['ice-cube', ICE], '🏮': ['paper-lantern', FIRE],
  '⚓': ['anchor', STEEL], '🪢': ['knot', EARTH], '🥧': ['pie-slice', EARTH], '💬': ['chat-bubble', W], '🧍': ['character', W], '🪑': ['wooden-chair', EARTH], '🛐': ['prayer', HOLY], '🦅': ['eagle-head', EARTH],
  '🧱': ['brick-wall', EARTH], '⛰️': ['mountaintop', STEEL], '🐌': ['snail', POISON], '📌': ['pin', BLOOD], '🎼': ['musical-score', PINK], '🥁': ['drum', EARTH], '🔯': ['heptagram', HOLY],
  '🍃': ['leaf-swirl', LIFE], '🍀': ['clover', LIFE], '🐻': ['bear-head', EARTH], '🐆': ['lynx-head', GOLD], '💪': ['biceps', EARTH], '🌲': ['pine-tree', LIFE], '👐': ['glowing-hands', HOLY],
  '🎒': ['backpack', EARTH], '🔒': ['padlock', GOLD], '🪄': ['fairy-wand', DARK], '🏆': ['trophy', GOLD], '📥': ['load', W], '🧑': ['character', W], '📯': ['hunting-horn', GOLD],
  '🌬️': ['wind-hole', ICE], '🤲': ['healing', LIFE], '☀️': ['sun', GOLD], '⛪': ['church', HOLY], '🌸': ['twirly-flower', PINK], '🧘': ['meditation', ICE], '☠️': ['skull-crossed-bones', W], '☠': ['skull-crossed-bones', W],
  '😴': ['night-sleep', STORM], '🧠': ['brain', PINK], '🦶': ['barefoot', EARTH], '⚪': ['circle', W], '🌼': ['daisy', GOLD], '🥀': ['shut-rose', DARK], '🧵': ['yarn', PINK], '🦀': ['crab', BLOOD],
  '🔴': ['ball-glow', BLOOD], '💠': ['cut-diamond', ICE], '⛏️': ['mining', STEEL], '⚗️': ['bubbling-flask', POISON], '💫': ['star-swirl', GOLD], '🌾': ['wheat', GOLD], '🪶': ['feather', W],
  '🙏': ['prayer-beads', HOLY], '👼': ['angel-wings', HOLY], '💤': ['sleepy', STORM], '🌠': ['falling-star', HOLY], '☁️': ['fluffy-cloud', STEEL], '👑': ['crown', GOLD], '🦇': ['bat', DARK],
  '🧰': ['toolbox', STEEL], '🥨': ['pretzel', EARTH], '✒️': ['quill-ink', W], '📄': ['papers', W], '🗞️': ['newspaper', W], '🖋️': ['fountain-pen', W], '🫙': ['mason-jar', ICE], '🐟': ['salmon', WATER],
  '🐍': ['snake', POISON], '🐠': ['tropical-fish', FIRE], '🪵': ['log', EARTH], '🥣': ['bubbling-bowl', EARTH], '🪦': ['tombstone', STEEL], '⛓': ['crossed-chains', STEEL], '⛓️': ['crossed-chains', STEEL],
  '💢': ['enrage', BLOOD], '🏳️': ['flying-flag', W], '😡': ['angry-eyes', BLOOD], '🦴': ['broken-bone', W], '🧙': ['wizard-face', DARK], '👘': ['robe', DARK], '🏅': ['ribbon-medal', GOLD],
  '⚒️': ['blacksmith', STEEL], '⏱️': ['stopwatch', W], '💛': ['hearts', GOLD], '🔍': ['magnifying-glass', W], '🚩': ['flag-objective', BLOOD], '🏠': ['house', EARTH], '⭐': ['round-star', GOLD],
  '🏷️': ['price-tag', GOLD], '📋': ['checklist', W], '🦌': ['deer-head', EARTH], '🧛': ['vampire-dracula', BLOOD], '🥊': ['boxing-glove', BLOOD], '💉': ['hypodermic-test', BLOOD], '🦬': ['bison', EARTH],
  '🫥': ['invisible-face', STEEL], '🧿': ['warlock-eye', WATER], '🎻': ['violin', EARTH], '⏳': ['hourglass', GOLD], '🌘': ['evil-moon', DARK], '🖤': ['shattered-heart', DARK], '🔗': ['linked-rings', STEEL],
  '🟠': ['ore', FIRE], '🟫': ['planks', EARTH], '🟤': ['stone-sphere', EARTH], '🐊': ['croc-jaws', POISON], '🧶': ['yarn', PINK], '🪡': ['triple-needle', STEEL], '🫧': ['bubbles', WATER],
  '🧤': ['gloves', EARTH], '💍': ['ring', GOLD], '🪙': ['crown-coin', GOLD], '🐉': ['dragon-head', BLOOD], '🍗': ['chicken-leg', EARTH], '🍷': ['wine-glass', BLOOD], '🎀': ['ribbon', PINK],
  '🍰': ['cake-slice', PINK], '🎲': ['dice-six-faces-five', W], '☯️': ['yin-yang', W], '🐚': ['spiral-shell', PINK], '🔶': ['topaz', FIRE], '🏦': ['bank', GOLD], '⛴️': ['sailboat', WATER],
  '❗': ['hazard-sign', GOLD], '🏘️': ['village', EARTH], '🏴': ['black-flag', STEEL], '🚶': ['walk', W], '🌕': ['moon', HOLY], '🦘': ['kangaroo', EARTH], '🌧️': ['raining', WATER],
  '↩️': ['return-arrow', W], '💃': ['ballerina-shoes', PINK], '✴️': ['barbed-star', GOLD], '🔩': ['hexagonal-nut', STEEL], '⚜️': ['fleur-de-lys', GOLD], '🖐️': ['hand', EARTH], '🐯': ['tiger-head', FIRE],
  '🦵': ['leg', EARTH], '🪴': ['flower-pot', LIFE], '🌒': ['moon', STORM], '🌵': ['cactus', LIFE], '🥷': ['ninja-head', STEEL], '🎸': ['guitar', EARTH], '🧜': ['mermaid', WATER], '🎵': ['double-quaver', PINK],
  '🟣': ['concentration-orb', DARK], '😖': ['despair', DARK], '😱': ['terror', DARK], '💞': ['nested-hearts', PINK], '🔱': ['trident', WATER], '🌐': ['wireframe-globe', ICE], '🔹': ['diamonds', ICE],
  '💜': ['charm', DARK], '💎': ['cut-diamond', ICE], '😇': ['angel-outfit', HOLY], '🎇': ['bright-explosion', GOLD], '🌈': ['rainbow-star', PINK], '🪓': ['wood-axe', STEEL], '🌺': ['lotus-flower', PINK],
  '🕊️': ['dove', W], '👣': ['footsteps', EARTH], '📢': ['shouting', GOLD], '🐢': ['turtle', LIFE], '👻': ['ghost', ICE], '🌤️': ['sun-cloud', GOLD], '⛵': ['sailboat', WATER],
  '❤️‍🔥': ['burning-passion', BLOOD], '🗼': ['stone-tower', STEEL], '🧑‍🚀': ['astronaut-helmet', ICE], '🏍️': ['scooter', STEEL], '🚀': ['rocket', FIRE], '🔧': ['spanner', STEEL], '🔫': ['ray-gun', ICE], '📡': ['radar-dish', ICE], '🧟': ['shambling-zombie', POISON],
  '🩹': ['sticking-plaster', W], '🫀': ['heart-organ', BLOOD], '💓': ['heart-beats', BLOOD], '⚰️': ['coffin', EARTH], '⚱️': ['soul-vessel', STEEL],
};
// where an emoji sits changes what it means: [css selector, emoji] → pictograph
export const PLACED = [
  ['#hpotBtn', '🧪', 'health-potion', '#ff6a5a'], ['#mpotBtn', '💧', 'potion-ball', '#6fc0ff'], ['#cycle', '🎯', 'targeting', '#ffb0a0'], ['#sitBtn', '🪑', 'campfire', '#ffb060'],
];
export const SCHOOL = { fire: FIRE, frost: ICE, storm: STORM, earth: EARTH, holy: HOLY, shadow: DARK, poison: POISON, nature: LIFE, arcane: '#e0b0ff', phys: STEEL };
export const KIND = { attack: '#ffb38a', heal: '#8ff08a', buff: '#9fd4ff', util: '#d9c8ff', ult: GOLD, racial: FIRE };
