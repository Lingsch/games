// Puts the from-scratch class models (artkit/models/people.js) into the MMO. A class kind is named <class><0-2>;
// the number picks one of three colourways. Classes not built yet keep the rebuilt old model from rig.js.
import { CLASSES, setStyle, bake } from './models/people.js';
export function initClasses(G) {
  if (G.game !== 'mmo') return { setOn() { } };      // Stars Beneath gets its own sci-fi set later
  const HUE = [0, .1, -.16];
  G.rigPlans.unshift((old, name) => {
    const m = /^([a-z]+)(\d)$/.exec(name); if (!m || !CLASSES[m[1]]) return null;
    setStyle({ hue: HUE[+m[2] % 3], ink: false, det: .34 }); return bake(CLASSES[m[1]]());
  });
  return { setOn() { } };
}
