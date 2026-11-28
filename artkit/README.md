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

See `CREDITS.md` for the pictographs' licence.
