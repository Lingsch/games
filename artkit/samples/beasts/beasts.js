// Sample sheet for the beasts in artkit/models/beasts.js, drawn outside the game.
import { THREE, setStyle } from '../../models/people.js';
import { BEASTS } from '../../models/beasts.js';
setStyle({ ink: true, hue: 0, pal: null, ghost: 0, det: .45 });
const pick = (new URLSearchParams(location.search).get('show') || Object.keys(BEASTS).join('|')).split('|');
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1.5); r.outputColorSpace = THREE.SRGBColorSpace;
for (const name of pick) {
  const [f, sc] = BEASTS[name], W = 1100, H = 560, scn = new THREE.Scene(); scn.background = new THREE.Color('#aeb9c6'); scn.add(new THREE.HemisphereLight('#ffffff', '#8a7a6a', 1.5)); const d = new THREE.DirectionalLight('#fff4e0', 2.6); d.position.set(-3, 5, 6); scn.add(d);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(14, 40), new THREE.MeshBasicMaterial({ color: '#8fa07a' })); gr.rotation.x = -Math.PI / 2; scn.add(gr);
  for (const [x, ry] of [[-1.5 * sc, -1.0], [1.5 * sc, .55]]) { const m = f(); m.scale.setScalar(sc); m.position.x = x; m.rotation.y = ry; scn.add(m);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(.8 * sc, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .22 })); sh.rotation.x = -Math.PI / 2; sh.position.set(x, .005, 0); scn.add(sh); }
  r.setSize(W, H); const cam = new THREE.PerspectiveCamera(24, W / H, .1, 60); cam.position.set(0, 1.0 * sc + .3, 7.2 * sc); cam.lookAt(0, .6 * sc, 0); r.render(scn, cam);
  const box = document.createElement('div'); box.style.cssText = 'position:relative;width:' + W + 'px;margin:0 0 6px'; const im = new Image(); im.src = r.domElement.toDataURL(); im.style.cssText = 'display:block;width:' + W + 'px';
  const cp = document.createElement('div'); cp.style.cssText = 'position:absolute;left:16px;top:10px;font:700 30px Georgia,serif;color:#1a120c'; cp.textContent = name; box.append(im, cp); document.body.append(box);
}
{ // all of them side by side at their real sizes
  const W = 1100, H = 520, scn = new THREE.Scene(); scn.background = new THREE.Color('#aeb9c6'); scn.add(new THREE.HemisphereLight('#ffffff', '#8a7a6a', 1.5)); const d = new THREE.DirectionalLight('#fff4e0', 2.6); d.position.set(-3, 5, 6); scn.add(d);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(20, 40), new THREE.MeshBasicMaterial({ color: '#8fa07a' })); gr.rotation.x = -Math.PI / 2; scn.add(gr);
  let x = -3.2; for (const name of pick) { const [f, sc] = BEASTS[name], m = f(); m.scale.setScalar(sc); x += sc * 1.0; m.position.x = x; m.rotation.y = -1.0; scn.add(m); x += sc * 1.0 + .2; }
  r.setSize(W, H); const cam = new THREE.PerspectiveCamera(24, W / H, .1, 60); cam.position.set(.4, 1.5, 11.5); cam.lookAt(.4, .95, 0); r.render(scn, cam);
  const box = document.createElement('div'); box.id = 'lineup'; box.style.cssText = 'position:relative;width:' + W + 'px'; const im = new Image(); im.src = r.domElement.toDataURL(); im.style.cssText = 'display:block;width:' + W + 'px';
  const cp = document.createElement('div'); cp.style.cssText = 'position:absolute;left:16px;top:10px;font:700 30px Georgia,serif;color:#1a120c'; cp.textContent = 'Side by side, at their sizes in the game'; box.append(im, cp); document.body.append(box); }
window.__done = 1;
