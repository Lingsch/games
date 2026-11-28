// Puts the from-scratch people (artkit/models/people.js) into the MMO: the sixteen classes (a class kind is named
// <class><0-2>; the number picks a colourway) and the townsfolk and human-shaped enemies listed in FOLK.
import { CLASSES, FOLK, LOOKS, setStyle, bake } from './models/people.js';
export function initClasses(G) {
  if (G.game !== 'mmo') return { setOn() { } };      // Stars Beneath gets its own sci-fi set later
  const HUE = [0, .1, -.16];
  G.rigPlans.unshift((old, name) => {
    const f = FOLK[name]; if (f) { setStyle({ hue: 0, pal: null, ghost: f[2] && f[2].ghost ? 1 : 0, ink: false, det: .34 }); return bake(f[0](), 1.1 * (f[1] || 1)); }
    const m = /^([a-z]+)(\d)$/.exec(name); if (!m || !CLASSES[m[1]]) return null;
    const look = LOOKS[m[1]], i = +m[2] % 3;
    setStyle({ hue: look ? 0 : HUE[i], pal: look ? look[i] : null, ghost: 0, ink: false, det: .34 }); return bake(CLASSES[m[1]]());
  });
  return { setOn() { } };
}
