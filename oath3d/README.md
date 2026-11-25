# Oath of the East 3D, browser build

The same game as the PSP and Windows builds (v0.39), compiled to WebAssembly. It draws the storybook ("classic") look;
the realistic look is Windows only for now.

- `oath3d.wasm` is the game. `oath.js` is everything around it: graphics on WebGL 2, touch / keyboard / mouse / gamepad, sound, saves.
- Saves are kept in the browser's own storage for this site. They do not travel between devices or browsers.
- Needs WebGL 2: Safari on iOS 15 or newer, or any current desktop browser.

Controls
- Touch: left stick moves, drag the right side of the screen to look. A jump / choose, B cast / back, Y talk / take / block,
  X power (hold: sprint), RB attack, LB lock on (hold: the wheel), Start journal, Back sneak.
- Keyboard and mouse: W A S D, mouse to look (click the game first), left button attack, E use, Q cast, Space jump, F power / sprint,
  Tab lock on, C sneak, Esc journal, Z / X journal bookmarks.
- Gamepad: as an Xbox pad on the Windows build.

Built from the game's C source with `web/build_web.sh` (plain clang and the WASI C library).
