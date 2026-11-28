// Sample sheet: every class model built so far, drawn outside the game. The models live in artkit/models/people.js.
import { THREE, CLASSES, wolf, setStyle } from '../../models/people.js';
setStyle({ ink: true, hue: 0 });
const W = 1100, H = 470, r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setPixelRatio(1.5); r.outputColorSpace = THREE.SRGBColorSpace;
const names = Object.keys(CLASSES);
for (let row = 0; row * 4 < names.length; row++) {
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#aeb9c6'); sc.add(new THREE.HemisphereLight('#ffffff', '#8a7a6a', 1.5)); const d = new THREE.DirectionalLight('#fff4e0', 2.6); d.position.set(-3, 5, 6); sc.add(d);
  const gr = new THREE.Mesh(new THREE.CircleGeometry(12, 40), new THREE.MeshBasicMaterial({ color: '#8fa07a' })); gr.rotation.x = -Math.PI / 2; sc.add(gr);
  const set = names.slice(row * 4, row * 4 + 4).map(n => CLASSES[n]); if (row === 0) set.push(wolf);
  set.forEach((f, i) => { const m = f(); m.position.x = (i - (set.length - 1) / 2) * 1.7; m.rotation.y = .3 - i * .15; sc.add(m); });
  r.setSize(W, H); const cam = new THREE.PerspectiveCamera(21, W / H, .1, 50); cam.position.set(.05, 1.35, 10.6); cam.lookAt(.05, .95, 0); r.render(sc, cam);
  const im = new Image(); im.src = r.domElement.toDataURL(); im.style.cssText = 'display:block;width:' + W + 'px;margin-bottom:6px'; document.body.append(im);
}
window.__done = 1;
