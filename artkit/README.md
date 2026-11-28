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

`rig.js` and `creatures.js` rebuild the games' character models while the game runs. Nothing in the games' own
model files changes, and a model added to a game later is rebuilt the same way with no work here.

- **People** (anything with two arms and a head): rounded, shaped torso; thighs and shins with a knee that bends;
  upper arms and forearms with an elbow that bends; hands, boots and feet; a head with eyes, brows, nose, ears and
  hair when the head is bare. Colours, sizes, hats, weapons, cloaks and trinkets are carried over from the game's
  model. Large armour blocks are rounded off. Cloaks trail when their wearer moves.
- **Four-legged beasts**: shaped body with shoulder and haunch, two-part legs with paws that trot in diagonal pairs,
  a muzzle with a jaw that opens on a bite, a tail that swings.
- **Everything else that moves**: blocks become rounded forms and long blocks become tapered limbs.
- Static props (furniture, ore, signs) are left alone until art step 6.

The pose code is the `CALC` text at the top of `rig.js`. It keeps the games' part numbers 0 to 9 and adds
11 to 14 (shins and forearms), 15 (cloak), 21 to 34 (beast legs), 25 (tail), 27 (jaw) and a few spare ones.
On Graphics: Low the games' own lighter models are used.
