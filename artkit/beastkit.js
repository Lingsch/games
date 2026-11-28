// Gives each beast in the MMO its own model. The game draws every creature of one kind with one shared model
// (a mastiff and a stag were both "wolf"), so this registers a kind per creature in artkit/models/beasts.js and
// points each matching creature at it, by its name. Nothing else in the game reads a creature's kind.
// Switching the art off, or Graphics: Low, puts every creature back on its original kind.
import { BEASTS } from './models/beasts.js';
import { setStyle, bake } from './models/people.js';
export function initBeasts(G) {
  if (G.game !== 'mmo' || !G.MOBS || !G.rigAdopt) return { setOn() { } };
  const { R, S, MOBS } = G, AMP = { wolf: [[.75, 0, 0, .55], .07, .035], bear: [[.55, 0, 0, .5], .08, .04], boar: [[.8, 0, 0, .4], .06, .035], boarbig: [[.8, 0, 0, .4], .06, .04] };
  const key = n => 'art:' + n;
  function make(name) {
    const b = BEASTS[name], k = key(name); if (R.kinds[k]) return k;
    setStyle({ hue: 0, pal: null, ghost: 0, ink: false, det: .4 });
    const a = AMP[b[1]] || AMP.wolf; R.addKinds({ [k]: [bake(b[0](), 1), a[0], a[1], a[2]] }); G.rigAdopt(R.kinds[k]); return k;
  }
  const back = e => { e.kind = e.artK0; e.artK = undefined; };
  let on = false, raf = 0;
  function tick() {
    raf = requestAnimationFrame(tick); const live = G.quality() !== 'low'; let budget = 2;
    for (const e of S.ents) {
      if (!e.mob) continue;
      if (!live) { if (e.artK) back(e); continue; }
      if (e.artK !== undefined) continue;
      const m = MOBS[e.mob], name = BEASTS[e.name] ? e.name : (m && BEASTS[m.name] ? m.name : null);
      if (!name) { e.artK = 0; continue; }
      if (!R.kinds[key(name)] && budget-- <= 0) continue;          // build at most two new models a frame
      try { e.artK0 = e.kind; e.kind = make(name); e.artK = 1; } catch (err) { console.warn('art: beast', name, err); e.kind = e.artK0; e.artK = 0; }
    }
  }
  function setOn(v) { v = !!v; if (v === on) return; on = v; cancelAnimationFrame(raf); if (v) tick(); else for (const e of S.ents) if (e.artK) back(e); }
  return { setOn };
}
