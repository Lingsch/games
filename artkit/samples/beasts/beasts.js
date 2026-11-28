// Sample sheet for the beasts in artkit/models/beasts.js, drawn outside the game.
import { THREE, setStyle } from '../../models/people.js';
import { BEASTS } from '../../models/beasts.js';
setStyle({ ink: true, hue: 0, pal: null, ghost: 0, det: .45 });
const qs = new URLSearchParams(location.search), from = +(qs.get('from') || 0), to = +(qs.get('to') || 999), tall = +(qs.get('tall') || 0), names = Object.keys(BEASTS).slice(from, to), per = 6;
const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1.3); r.outputColorSpace = THREE.SRGBColorSpace;
for (let row = 0; row * per < names.length; row++) {
  const set = names.slice(row * per, row * per + per), W = 1320, H = tall ? 430 : 300, scn = new THREE.Scene(); scn.background = new THREE.Color('#aeb9c6'); scn.add(new THREE.HemisphereLight('#ffffff', '#8a7a6a', 1.5)); const d = new THREE.DirectionalLight('#fff4e0', 2.6); d.position.set(-3, 5, 6); scn.add(d);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(20, 40), new THREE.MeshBasicMaterial({ color: '#8fa07a' })); gr.rotation.x = -Math.PI / 2; scn.add(gr);
  set.forEach((n, i) => { const m = BEASTS[n][0](); m.position.x = (i - (per - 1) / 2) * (tall ? 2.85 : 2.62); m.rotation.y = -1.0; scn.add(m); });
  r.setSize(W, H); const cam = new THREE.PerspectiveCamera(tall ? 16 : 12, W / H, .1, 80); cam.position.set(0, tall ? 2.6 : 1.5, tall ? 18.5 : 17); cam.lookAt(0, tall ? 1.75 : .72, 0); r.render(scn, cam);
  const box = document.createElement('div'); box.style.cssText = 'position:relative;width:' + W + 'px;margin:0 0 4px'; const im = new Image(); im.src = r.domElement.toDataURL(); im.style.cssText = 'display:block;width:' + W + 'px'; box.append(im);
  set.forEach((n, i) => { const cp = document.createElement('div'); cp.style.cssText = 'position:absolute;top:6px;width:220px;text-align:center;left:' + (i * 220) + 'px;font:700 17px Georgia,serif;color:#1a120c'; cp.textContent = n; box.append(cp); });
  document.body.append(box);
}
window.__done = 1;
