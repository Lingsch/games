# artkit: the art layer for the MMO and Stars Beneath

Everything visual that is not game rules lives here, so the games can keep changing without the art getting in the way.

## How it plugs in
- Each game has an `art/` folder: `art.js` (hands the game's engine modules to this kit), `theme.js` (the look: colour
  grade per land, what drifts in the air, the interface skin) and `icons.js` (one pictograph per ability name).
- Each game's `index.html` has one line after `main.js`: `await import("./art/art.js")`. **Keep that line when
  index.html is rebuilt.** As a safety net `sync.js` loads the layer too if that line goes missing.
- Nothing in a game's `js/` folder is changed. The kit wraps `renderer.render`, watches game state each frame, and
  restyles the page. Settings → Graphics → New art turns all of it off and back on.

## What is in it
- `light.js`: sun shadows that follow the camera, sky (sun, moon, stars, clouds, nebula in space), tone mapping, glow,
  colour grade. Quality follows Settings → Graphics and steps down by itself if the frame rate stays low.
- `fx.js`: hit sparks, swing arcs, casting sigils, death and level-up effects, the target ring, weather in the air.
- `ui.js` + `ui.css`: the interface skin (`fantasy` and `scifi`), and the swap from emoji to pictographs.
- `iconmap.js`: emoji → pictograph and colour. `icons/`: the pictograph files.

## Working alongside game development
- A new ability with an emoji gets that emoji's pictograph automatically. To give it its own, add its name to the
  game's `art/icons.js` and copy the file into `artkit/icons/`.
- A new zone gets the default grade. To give it its own, add its zone key to the game's `art/theme.js`.
- New models, zones and effects need nothing: shadows and lighting pick them up as they are built.

The pictographs are our own. They are drawn in code: `draw/glyphs.mjs` holds the base shapes, `draw/specs.mjs` says which shapes and marks each name gets, and `node artkit/draw/build.mjs` writes `icons/`. Nothing in this folder comes from an icon library or asset pack.

## Models (art steps 3 and 4)

The Single-Player MMO's people and creatures are designed from scratch in the approved style ("chunky carved", simple
dark eyes). Nothing in the game's own model files changes. Every model is made in code here; nothing is borrowed.

- `models/people.js`: the sixteen classes (`CLASSES`, three themed looks each in `LOOKS`) and the townsfolk and
  human-shaped enemies (`FOLK`). `classes.js` puts them in the game by kind name.
- `models/beasts.js`: every wild creature and beast boss, keyed by its **name** in the game (`BEASTS`, 167 entries).
  One builder per body plan: `quad` (wolves, hounds, bears, boars, rats, stags), `bug` (wasps, moths, bats, sprites),
  `spider`, `grub`, `crab`, `shark`, `bird` (gulls, hawks, griffons), `serpent` (wyrms, dragons), `treant`, `scarecrow`,
  `golem`. Area versions and bosses add their own pieces. `beastFor(name, kind)` gives a creature that is not listed
  its family's ordinary model, so a creature added to the game later is not left on the old one.
  `beastkit.js` gives each listed creature a kind of its own (`art:<name>`).
- Area versions of people (`<kind>~ashen`, `~spectral`, `~gilded`, `~verdant`): `rig.js` rebuilds them from the plain
  kind in the area's colours, and `classes.js` adds a halo and gold caps, wisps, embers, or moss and flowers.
- Sample pages: `samples/style-takes/` (people) and `samples/beasts/` (every beast, six to a row; `?from=N&to=M`,
  `&tall=1` for the big ones).
- Still on the older pass (`rig.js` `person`, `creatures.js` `quad` and `soft`, which round off the game's own models):
  the fire, water and storm elementals, the Binder's and Druid's pets, horses, and all of Stars Beneath.
- Static props (furniture, ore, signs) are left alone until art step 6.
- Graphics: Low, or New art switched off, shows the game's own models.
