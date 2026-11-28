// Drawing kit for the pictographs. Every symbol in artkit/icons/ is drawn here, in code, on a 100 x 100 grid.
// Nothing is traced or taken from an icon library.
export const p = d => `<path d="${d}"/>`;
export const pl = s => p('M' + s.trim().split(/\s+/).map(q => q.replace(',', ' ')).join('L') + 'Z');
export const ln = (a, b, c, d, w = 6) => `<path d="M${a} ${b}L${c} ${d}" fill="none" stroke-width="${w}" stroke-linecap="round"/>`;
export const st = (d, w = 6) => `<path d="${d}" fill="none" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const ci = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
export const el = (x, y, rx, ry) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`;
export const ri = (x, y, r, w = 6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke-width="${w}"/>`;
export const eri = (x, y, rx, ry, w = 6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke-width="${w}"/>`;
export const rr = (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
export const rot = (s, a, cx = 50, cy = 50) => `<g transform="rotate(${a} ${cx} ${cy})">${s}</g>`;
export const flip = s => `<g transform="translate(100 0) scale(-1 1)">${s}</g>`;
export const mir = s => s + flip(s);
export const tf = (s, x, y, k, a = 0) => `<g transform="translate(${x} ${y}) scale(${k})${a ? ` rotate(${a} 50 50)` : ''}">${s}</g>`;
export const sc = (s, k, dx = 0, dy = 0) => tf(s, +(50 - 50 * k + dx).toFixed(2), +(50 - 50 * k + dy).toFixed(2), k);
const N = v => +v.toFixed(1), rad = a => a * Math.PI / 180;
export const ngon = (cx, cy, r, n, a0 = -90) => [...Array(n)].map((_, i) => N(cx + r * Math.cos(rad(a0 + i * 360 / n))) + ',' + N(cy + r * Math.sin(rad(a0 + i * 360 / n)))).join(' ');
export const poly = (pts, extra = '') => `<polygon points="${pts}"${extra}/>`;
export const star = (cx, cy, R, r, n, a0 = -90) => poly([...Array(n * 2)].map((_, i) => { const q = i % 2 ? r : R, a = rad(a0 + i * 180 / n); return N(cx + q * Math.cos(a)) + ',' + N(cy + q * Math.sin(a)); }).join(' '));
export const gram = (cx, cy, r, n, step, w = 4) => poly([...Array(n)].map((_, i) => { const a = rad(-90 + i * step * 360 / n); return N(cx + r * Math.cos(a)) + ',' + N(cy + r * Math.sin(a)); }).join(' '), ` fill="none" stroke-width="${w}" stroke-linejoin="round"`);
export const rays = (cx, cy, r1, r2, n, w = 5, a0 = 0) => [...Array(n)].map((_, i) => { const a = rad(a0 + i * 360 / n), c = Math.cos(a), s = Math.sin(a); return ln(N(cx + r1 * c), N(cy + r1 * s), N(cx + r2 * c), N(cy + r2 * s), w); }).join('');
export const spiral = (cx, cy, r0, r1, turns) => { let d = ''; const n = Math.ceil(turns * 24); for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2, r = r0 + (r1 - r0) * t; d += (i ? 'L' : 'M') + N(cx + r * Math.cos(a)) + ' ' + N(cy + r * Math.sin(a)); } return d; };
export const gear = (cx, cy, R, r, n) => poly([...Array(n * 4)].map((_, i) => { const q = (i % 4 < 2) ? R : r, a = rad((i - .5) * 90 / n); return N(cx + q * Math.cos(a)) + ',' + N(cy + q * Math.sin(a)); }).join(' '));
export const dr = (x, y, s) => p(`M${x} ${N(y - s)}Q${N(x + s * .8)} ${y} ${N(x + s * .8)} ${N(y + s * .4)}A${N(s * .8)} ${N(s * .8)} 0 0 1 ${N(x - s * .8)} ${N(y + s * .4)}Q${N(x - s * .8)} ${y} ${x} ${N(y - s)}Z`);
