/* The road map, cut from paper (rule 2a: "a mosaic of paper squares cut from the map board, with paper pins and a red
   thread for the route"). Each square of land is a little tile of green card, a touch off the grid, a shade lighter
   or darker than its neighbours, with a lit edge and a short shadow on the blue sea card. Other countries are khaki
   card. This week's land is yellow, the next stop's pink, the places the company tours a brighter green. The road is a
   red thread pinned from city to city, and each city carries a white paper label.

   The board itself is data in the engine (E.MAPS, built by tools/build-maps.js). Nothing here is an image file
   (rule 2). The map takes whatever room its box gives it: a square is always a whole number of screen pixels. */
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { E } from '../engine';
import { dataAttrs } from './index';
import { onBoardResize } from './lights';

const SEA = '#3a5a9a', SEA2 = '#33508c', OTHER = ['#c9b98f', '#c1b086', '#cfc099'], LAND = ['#5fa44f', '#55994a', '#68ad56', '#4f9246'], MINE = ['#9fd060', '#a8d668'], NOW = '#ffd449', NEXT = '#e58ad0';
let mapDraws = 0;
/** How many times a road map has been drawn. A test watches it: the map is drawn once and kept. */
export function roadMapDraws(): number { return mapDraws; }
/** A steady number from 0 to 1 for a square, so the paper looks the same every time it is drawn. */
const hh = (a: number, b: number, c = 0) => { let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); return ((h ^ (h >>> 15)) >>> 0) / 4294967296; };
const shade = (hex: string, k: number) => { const n = parseInt(hex.slice(1), 16), f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };

interface Stop { k: string; city: string; x?: number; y?: number }
function draw(cv: HTMLCanvasElement, R: any, p: number, dpr: number, font: string) {
  const M = (E.MAPS as any[]).find(m => m.id === R.map); if (!M) return;
  const W: number = E.MAP_W, H: number = E.MAP_H, ABC: string = E.MAP_ABC;
  cv.width = W * p; cv.height = H * p; cv.style.width = (W * p / dpr) + 'px'; cv.style.height = (H * p / dpr) + 'px';
  const x = cv.getContext('2d'); if (!x) return;
  // the sea: blue card, mottled in big soft patches
  x.fillStyle = SEA; x.fillRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < H; r += 3) for (let c = 0; c < W; c += 3) { x.fillStyle = hh(c, r, 9) < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'; x.fillRect(c * p, r * p, 3 * p, 3 * p); }
  const s = Math.max(2, Math.round(p * .9)), o = Math.floor((p - s) / 2), sh = Math.max(1, Math.round(p * .14)), mine: Record<number, 1> = {};
  (R.lit.mine as number[]).forEach(a => { mine[a] = 1; });
  const tiles: [number, number, string, boolean][] = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = M.g[r].charAt(c); if (ch === ' ') continue;
    const a = ch === '-' ? -1 : ABC.indexOf(ch), k = 0.92 + hh(c, r) * 0.16;
    const col = a < 0 ? OTHER[Math.floor(hh(c, r, 2) * OTHER.length)] : (a === R.lit.now ? NOW : (a === R.lit.next ? NEXT : (mine[a] ? MINE[Math.floor(hh(c, r, 3) * 2)] : LAND[(a * 7 + 3 + Math.floor(hh(c, r, 4) * 2)) % LAND.length])));
    tiles.push([c, r, a === R.lit.now || a === R.lit.next ? col : shade(col, k), a === R.lit.now]);
  }
  // shadows first, so no tile's shadow falls on its neighbour's face; then the tiles, each a touch off the grid with a lit edge
  const at0 = (t: [number, number, string, boolean]) => [t[0] * p + o + Math.round((hh(t[0], t[1], 5) - .5) * p * .12), t[1] * p + o + Math.round((hh(t[0], t[1], 6) - .5) * p * .12)];
  x.fillStyle = 'rgba(10,16,40,.38)'; tiles.forEach(t => { const q = at0(t); x.fillRect(q[0] + sh, q[1] + sh, s, s); });
  tiles.forEach(t => { const q = at0(t); x.fillStyle = t[2]; x.fillRect(q[0], q[1], s, s);
    if (s >= 4) { x.fillStyle = 'rgba(255,255,255,.22)'; x.fillRect(q[0], q[1], s, 1); x.fillRect(q[0], q[1], 1, s); x.fillStyle = 'rgba(0,0,0,.14)'; x.fillRect(q[0], q[1] + s - 1, s, 1); x.fillRect(q[0] + s - 1, q[1], 1, s); }
    if (t[3]) { x.strokeStyle = 'rgba(23,23,27,.7)'; x.lineWidth = 1; x.strokeRect(q[0] + .5, q[1] + .5, s - 1, s - 1); } });

  const u = Math.max(p / 8, 1.25 * dpr), at = (st: Stop): [number, number] => [(st.x as number) * p, (st.y as number) * p];
  const seen: Record<string, 1> = {}, on: Stop[] = [];
  let far = 0;
  (R.stops as Stop[]).forEach(st => { if (st.x == null) return; if (st.k === 'far' && far++ > 0) return; on.push(st); });
  // the thread: red for the road so far, the next leg in looser red, the one beyond in white; each with its shadow
  x.lineCap = 'round';
  for (let i = 0; i < on.length - 1; i++) {
    const a = on[i], b = on[i + 1], A = at(a), B = at(b), d = Math.hypot(B[0] - A[0], B[1] - A[1]); if (d < p) continue;
    const kind = b.k === 'past' || b.k === 'now' ? 'done' : (b.k === 'next' ? 'nx' : 'far');
    const cy = Math.max(-cv.height * .25, Math.min(A[1], B[1]) - d * .3 - 4 * u);
    const path = (dx: number) => { x.beginPath(); x.moveTo(A[0] + dx, A[1] + dx); x.quadraticCurveTo((A[0] + B[0]) / 2 + dx, cy + dx, B[0] + dx, B[1] + dx); };
    x.setLineDash(kind === 'nx' ? [6 * u, 3 * u] : (kind === 'far' ? [2 * u, 4 * u] : []));
    x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = Math.max(2, 2.6 * u); path(Math.max(1, 1.6 * u)); x.stroke();
    x.strokeStyle = kind === 'far' ? '#f4ecd6' : (kind === 'nx' ? '#e86a5e' : '#c8322a'); x.lineWidth = Math.max(2, 2.6 * u); path(0); x.stroke();
  }
  x.setLineDash([]);
  // the pins: a shadow on the board, a short needle, a round head with a highlight
  const boxes: number[][] = [];
  on.forEach(st => { const P = at(st), big = st.k === 'now', r = (big ? 5.6 : 4.2) * u, hx = P[0] - r * .5, hy = P[1] - r * 1.5;
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(P[0] + r * .9, P[1] + r * .2, r * 1.1, r * .55, 0, 0, 7); x.fill();
    x.strokeStyle = '#3a3a40'; x.lineWidth = Math.max(1, .9 * u); x.beginPath(); x.moveTo(P[0], P[1]); x.lineTo(hx, hy); x.stroke();
    x.beginPath(); x.arc(hx, hy, r, 0, 7); x.fillStyle = st.k === 'past' ? '#c8322a' : (big ? '#ffd449' : (st.k === 'next' ? '#e58ad0' : '#f4ecd6')); x.fill();
    x.lineWidth = Math.max(1, .9 * u); x.strokeStyle = '#17171b'; x.stroke();
    x.beginPath(); x.arc(hx - r * .35, hy - r * .35, r * .32, 0, 7); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill();
    boxes.push([hx - r - 2, hy - r - 2, P[0] + r + 2, P[1] + r + 2]); });
  // the labels: white paper slips, this week's first so it gets the best spot, each where it covers no other label or pin
  const order = on.slice().sort((a, b) => rank(a.k) - rank(b.k));
  x.textBaseline = 'middle'; x.lineJoin = 'round';
  order.forEach(st => {
    if (seen[st.city]) return; seen[st.city] = 1;
    const P = at(st), big = st.k === 'now', px = Math.max(9, Math.round((big ? 13 : 11) * u)), text = st.city.toUpperCase();
    x.font = (big ? '800 ' : '600 ') + px + 'px ' + font;
    const tw = x.measureText(text).width, pad = 4 * u, w = tw + pad * 2, h = px * 1.45, g = (big ? 10 : 7) * u;
    const tries: [number, number][] = [[P[0] + g, P[1] - g - h], [P[0] + g, P[1] + g * .4], [P[0] - g - w, P[1] + g * .4], [P[0] - g - w, P[1] - g - h], [P[0] + g, P[1] - h / 2], [P[0] - g - w, P[1] - h / 2], [P[0] - w / 2, P[1] + g], [P[0] - w / 2, P[1] - g * 2 - h]];
    let best = tries[0], bs = 1e9;
    tries.forEach((t, i) => { const b = [t[0], t[1], t[0] + w, t[1] + h]; let sc = i * .01;
      if (b[0] < 2 || b[1] < 2 || b[2] > cv.width - 2 || b[3] > cv.height - 2) sc += 50;
      boxes.forEach(q => { if (b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]) sc += 10; });
      if (sc < bs) { bs = sc; best = t; } });
    if (bs >= 10 && !big) return;   // no room that covers nothing: the pin stays, the label goes
    const tx = Math.max(2, Math.min(cv.width - w - 2, best[0])), ty = Math.max(2, Math.min(cv.height - h - 2, best[1]));
    boxes.push([tx, ty, tx + w, ty + h]);
    x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(tx + 1.5 * u, ty + 2 * u, w, h);
    x.fillStyle = big ? '#fff6c4' : '#fbf8f0'; x.fillRect(tx, ty, w, h);
    x.strokeStyle = '#17171b'; x.lineWidth = Math.max(1, .8 * u); x.strokeRect(tx + .5, ty + .5, w - 1, h - 1);
    x.fillStyle = st.k === 'past' ? '#8a2a22' : '#17171b'; x.fillText(text, tx + pad, ty + h / 2 + .5);
  });
  mapDraws++;
}
/* ---------- a state cut from paper (Ryan, 19 October: "it can just be a state map ... with a dot on the city"; "I want
   the new maps to look hand crafted, dot matrix is out of the game"). The area this week's city is in is a piece of
   green card cut by hand from its real outline (E.road's `shape`, from src/91-shapes.js), its paler core showing along
   the cut, lying on a sheet of blue paper with a soft shadow under it. Its name is written on a slip of paper, and every
   stop of the road that falls inside it has a pin and a label. ---------- */
/** `fit` is the part of the sheet the outline is fitted into (fractions of it, left, top, right, bottom), so a map that
    fills a board can keep clear of what is pinned on it; `tags` is a word after a stop's name ("last time: B"). */
interface Fit { l: number; t: number; r: number; b: number }
function drawShape(cv: HTMLCanvasElement, R: any, cw: number, ch: number, dpr: number, font: string, fit?: Fit, tags?: Record<string, string>, away?: string) {
  const Z = R.shape, W = Math.round(cw * dpr), H = Math.round(ch * dpr);
  cv.width = W; cv.height = H; cv.style.width = (W / dpr) + 'px'; cv.style.height = (H / dpr) + 'px';
  const x = cv.getContext('2d'); if (!x) return;
  const u = dpr * Math.max(1, Math.min(fit ? 2 : 9, Math.min(W * (fit ? fit.r - fit.l : 1), H * (fit ? fit.b - fit.t : 1)) / dpr / (fit ? 130 : 180)));   // one unit of line and type, grown with the box (on a board, only so far)
  // the sheet: blue construction paper, blotchy, with flecks of fibre. On a board (fit) it is a torn piece from beside the
  // poster to the edge (the night card is pinned over it), pinned on the board with a shadow under it; the rest of the canvas is left clear.
  x.save();
  if (fit) { const sx = W * fit.l + 3 * u, sy = 3 * u, sw2 = W * (1 - fit.l) - 6 * u, sh2 = H - 6 * u, edge: [number, number][] = [], n = 40;
    for (let i = 0; i < n; i++) edge.push([sx + sw2 * i / n, sy + (hh(i, 41) - .5) * 3 * u]);
    for (let i = 0; i < n; i++) edge.push([sx + sw2 + (hh(i, 42) - .5) * 3 * u, sy + sh2 * i / n]);
    for (let i = 0; i < n; i++) edge.push([sx + sw2 * (1 - i / n), sy + sh2 + (hh(i, 43) - .5) * 3 * u]);
    for (let i = 0; i < n; i++) edge.push([sx + (hh(i, 44) - .5) * 3 * u, sy + sh2 * (1 - i / n)]);
    x.beginPath(); edge.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath();
    x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowBlur = 8 * dpr; x.shadowOffsetX = 3 * dpr; x.shadowOffsetY = 4 * dpr; x.fillStyle = '#7fa6cf'; x.fill(); x.restore(); x.clip(); }
  x.fillStyle = '#7fa6cf'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const g = x.createRadialGradient(hh(i, 1) * W, hh(i, 2) * H, 0, hh(i, 1) * W, hh(i, 2) * H, (0.12 + hh(i, 3) * 0.25) * Math.max(W, H)); g.addColorStop(0, hh(i, 4) < .5 ? 'rgba(255,255,255,.07)' : 'rgba(20,40,80,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  for (let i = 0; i < W * H / (900 * dpr); i++) { x.fillStyle = hh(i, 7) < .5 ? 'rgba(255,255,255,.18)' : 'rgba(20,40,80,.16)'; const fx = hh(i, 8) * W, fy = hh(i, 9) * H, a = hh(i, 10) * 6.3, l = (2 + hh(i, 11) * 6) * dpr; x.save(); x.translate(fx, fy); x.rotate(a); x.fillRect(0, 0, l, Math.max(1, dpr * .6)); x.restore(); }
  x.restore();
  // the outline, fitted to the sheet with room for the labels, and cut by hand: each edge in short pieces, a touch off the line
  const F = fit || { l: 0, t: 0, r: 1, b: 1 }, fw = W * (F.r - F.l), fh = H * (F.b - F.t), m = fit ? 0.05 : 0.1, k = Math.min(fw * (1 - 2 * m) / Z.w, fh * (1 - 2 * m) / Z.h), ox = W * F.l + (fw - Z.w * k) / 2, oy = H * F.t + (fh - Z.h * k) / 2;
  const at = (px: number, py: number): [number, number] => [ox + px * k, oy + py * k];
  const loops: [number, number][][] = (Z.p as string[]).map(str => { const pts: [number, number][] = []; for (let i = 0; i + 1 < str.length; i += 2) pts.push(at(str.charCodeAt(i) - 40, str.charCodeAt(i + 1) - 40)); return pts; });
  const cut = (L: [number, number][], seed: number) => { const out: [number, number][] = [], step = 5 * dpr;
    for (let i = 0; i < L.length; i++) { const A = L[i], B = L[(i + 1) % L.length], d = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(d / step)), nx = -(B[1] - A[1]) / (d || 1), ny = (B[0] - A[0]) / (d || 1);
      for (let j = 0; j < n; j++) { const t = j / n, w = (hh(i, j, seed) - .5) * 1.4 * dpr; out.push([A[0] + (B[0] - A[0]) * t + nx * w, A[1] + (B[1] - A[1]) * t + ny * w]); } }
    return out; };
  const pieces = loops.map((L, i) => cut(L, i + 3));
  const trace = (dx = 0, dy = 0) => { x.beginPath(); pieces.forEach(P => { P.forEach((q, i) => i ? x.lineTo(q[0] + dx, q[1] + dy) : x.moveTo(q[0] + dx, q[1] + dy)); x.closePath(); }); };
  // a soft shadow down and to the right, then the paler core of the card along the cut, then the green face
  x.save(); x.shadowColor = 'rgba(10,20,45,.5)'; x.shadowBlur = 7 * dpr; x.shadowOffsetX = 4 * dpr; x.shadowOffsetY = 5 * dpr; trace(); x.fillStyle = '#e9e2c8'; x.fill(); x.restore();
  trace(); x.fillStyle = '#e9e2c8'; x.fill();
  x.save(); trace(); x.clip();
  x.save(); x.translate(-1.2 * dpr, -1.2 * dpr); trace(); x.fillStyle = '#5c9e4c'; x.fill(); x.restore();
  for (let i = 0; i < 18; i++) { const g = x.createRadialGradient(hh(i, 21) * W, hh(i, 22) * H, 0, hh(i, 21) * W, hh(i, 22) * H, (0.1 + hh(i, 23) * .2) * Math.max(W, H)); g.addColorStop(0, hh(i, 24) < .5 ? 'rgba(255,255,230,.09)' : 'rgba(0,40,0,.09)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  for (let i = 0; i < W * H / (1100 * dpr); i++) { x.fillStyle = hh(i, 27) < .5 ? 'rgba(255,255,220,.16)' : 'rgba(0,40,0,.14)'; x.fillRect(hh(i, 28) * W, hh(i, 29) * H, (1 + hh(i, 30) * 4) * dpr, Math.max(1, dpr * .6)); }
  const lg = x.createLinearGradient(0, 0, W, H); lg.addColorStop(0, 'rgba(255,255,255,.14)'); lg.addColorStop(1, 'rgba(0,0,0,.12)'); x.fillStyle = lg; x.fillRect(0, 0, W, H);
  x.restore();
  // the name of the state, on a slip of paper in the top left corner
  const nm = String(Z.n).replace(/^the /, 'The '), px = Math.round(12 * u);
  x.font = '400 ' + px + "px 'Craft Marker', " + font; x.textBaseline = 'middle';
  const tw = x.measureText(nm).width, sw = tw + 12 * u, sh = px * 1.5;
  const pinAt = (Z.pins as any[]).map(q => at(q.x, q.y)), corners: [number, number][] = [[W * F.l + 8 * u, H * F.t + 8 * u], [W * F.l + 8 * u, H * F.b - sh - 11 * u], [W * F.r - sw - 10 * u, H * F.b - sh - 11 * u], [W * F.r - sw - 10 * u, H * F.t + 8 * u]];
  const clear = (c: [number, number]) => !pinAt.some(q => q[0] > c[0] - 40 * u && q[0] < c[0] + sw + 40 * u && q[1] > c[1] - 24 * u && q[1] < c[1] + sh + 24 * u);
  const [nx, ny] = corners.find(clear) || corners[0];
  x.save(); x.translate(nx, ny); x.rotate(-0.04);
  x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(2 * u, 3 * u, sw, sh); x.fillStyle = '#26314f'; x.fillRect(0, 0, sw, sh);
  x.fillStyle = '#ffe48a'; x.fillText(nm, 6 * u, sh / 2 + u * .5); x.restore();
  const boxes: number[][] = [[nx, ny, nx + sw, ny + sh + 3 * u]];
  // the pins and their labels, this week's first
  const pins = (Z.pins as any[]).map(q => ({ k: q.k, city: q.city, P: at(q.x, q.y) })).sort((a, b) => rank(a.k) - rank(b.k));
  pins.slice().reverse().forEach(st => { const P = st.P, big = st.k === 'now', r = (big ? 7 : 5) * u, hx = P[0] - r * .5, hy = P[1] - r * 1.6;
    x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(P[0] + r * .9, P[1] + r * .2, r * 1.1, r * .55, 0, 0, 7); x.fill();
    x.strokeStyle = '#3a3a40'; x.lineWidth = Math.max(1, 1.1 * u); x.beginPath(); x.moveTo(P[0], P[1]); x.lineTo(hx, hy); x.stroke();
    x.beginPath(); x.arc(hx, hy, r, 0, 7); x.fillStyle = big ? '#d9443a' : (st.k === 'next' ? '#e58ad0' : (st.k === 'past' ? '#f4ecd6' : '#ffd449')); x.fill();
    x.lineWidth = Math.max(1, u); x.strokeStyle = '#17171b'; x.stroke();
    x.beginPath(); x.arc(hx - r * .35, hy - r * .35, r * .32, 0, 7); x.fillStyle = 'rgba(255,255,255,.7)'; x.fill();
    boxes.push([hx - r - 2, hy - r - 2, P[0] + r + 2, P[1] + r + 2]); });
  pins.forEach(st => { const P = st.P, big = st.k === 'now', fs = Math.round((big ? 13 : 11) * u), text = st.city + (!big && tags && tags[st.city] ? ', last time: ' + tags[st.city] : '');
    x.font = (big ? '700 ' : '400 ') + fs + "px 'Craft Hand', " + font;
    const tw2 = x.measureText(text).width, pad = 5 * u, w = tw2 + pad * 2, h = fs * 1.4, g = (big ? 11 : 8) * u;
    const tries: [number, number][] = [[P[0] + g, P[1] - g - h], [P[0] + g, P[1] + g * .4], [P[0] - g - w, P[1] + g * .4], [P[0] - g - w, P[1] - g - h], [P[0] - w / 2, P[1] + g], [P[0] - w / 2, P[1] - g * 2 - h]];
    let best = tries[0], bs = 1e9;
    tries.forEach((t, i) => { const b = [t[0], t[1], t[0] + w, t[1] + h]; let sc = i * .01;
      if (b[0] < W * F.l + 2 || b[1] < H * F.t + 2 || b[2] > W * F.r - 2 || b[3] > H * F.b - 2) sc += 50;
      boxes.forEach(q => { if (b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]) sc += 10; });
      if (sc < bs) { bs = sc; best = t; } });
    if (bs >= 10 && !big) return;
    const tx = Math.max(W * F.l + 2, Math.min(W * F.r - w - 2, best[0])), ty = Math.max(H * F.t + 2, Math.min(H * F.b - h - 2, best[1]));
    boxes.push([tx, ty, tx + w, ty + h]);
    x.save(); x.translate(tx + w / 2, ty + h / 2); x.rotate((hh(tx | 0, ty | 0) - .5) * .06);
    x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(-w / 2 + 1.5 * u, -h / 2 + 2 * u, w, h);
    x.fillStyle = big ? '#fff6c4' : '#fbf8ee'; x.fillRect(-w / 2, -h / 2, w, h);
    x.fillStyle = '#17171b'; x.textBaseline = 'middle'; x.fillText(text, -w / 2 + pad, u * .5); x.restore(); });
  // the next stop when it is off this map: a slip at the bottom right of the board, its arrow pointing on
  if (away) { const fs = Math.round(11 * u); x.font = '400 ' + fs + "px 'Craft Hand', " + font; const w = x.measureText(away).width + 10 * u, h = fs * 1.4, tx = W * F.r - w - 8 * u, ty = H * F.b - h - 8 * u;
    x.fillStyle = 'rgba(0,0,0,.32)'; x.fillRect(tx + 1.5 * u, ty + 2 * u, w, h); x.fillStyle = '#fbf8ee'; x.fillRect(tx, ty, w, h); x.fillStyle = '#17171b'; x.textBaseline = 'middle'; x.fillText(away, tx + 5 * u, ty + h / 2 + u * .5); }
  mapDraws++;
}
function rank(k: string): number { return k === 'now' ? 0 : (k === 'next' ? 1 : (k === 'past' ? 2 : 3)); }

/** The map for the road window. `road` is what E.road(S) returns. It fills its box, as large as whole dots allow. */
export function RoadMap(p: { road: any; t?: string; fit?: Fit | ((box: HTMLElement) => Fit); tags?: Record<string, string>; away?: string }) {
  const box = useRef<HTMLDivElement>(null), ref = useRef<HTMLCanvasElement>(null), R = p.road;
  const label = R.shape ? 'A map of ' + R.shape.n + '. This week: ' + R.now.city + '.' : R.map ? 'A map of ' + R.mapName + '. This week: ' + R.now.city + (R.now.land ? ', ' + R.now.land : '') + '.' + R.stops.filter((s: any) => s.k === 'next').map((s: any) => ' Next: ' + s.city + '.').join('') : 'No map for ' + R.now.city + '.';
  const check = () => {
    const cv = ref.current, bx = box.current; if (!cv || !bx || !R.map) return;
    if (R.shape) {   // the state, cut from paper: as tall as the box and no more than 45% of the window wide
      // a map that fills a board (p.fit) takes the whole box; otherwise as tall as the box and no more than 45% of the window wide
      const dpr = window.devicePixelRatio || 1, host = bx.parentElement as HTMLElement, cw = Math.floor(p.fit ? bx.clientWidth : Math.min((host ? host.clientWidth : bx.clientWidth) * 0.45 - 4, (bx.clientHeight - 4) * 1.5)), ch = Math.floor(bx.clientHeight - (p.fit ? 0 : 4));
      if (cw < 40 || ch < 40) return;
      const fit = typeof p.fit === 'function' ? p.fit(bx) : p.fit;
      const sig = JSON.stringify([R.map, R.shape.n, R.shape.pins, fit, p.tags, p.away]) + '@' + cw + 'x' + ch + '@' + dpr;
      if (cv.getAttribute('data-sig') === sig) return;
      try { drawShape(cv, R, cw, ch, dpr, getComputedStyle(cv).fontFamily || 'sans-serif', fit, p.tags, p.away); cv.setAttribute('data-sig', sig); cv.setAttribute('data-map', R.map); cv.setAttribute('data-shape', R.shape.n); } catch (e) { /* a map that cannot be drawn is not worth a crash */ }
      return;
    }
    const dpr = window.devicePixelRatio || 1, host = bx.parentElement as HTMLElement, w = (host ? host.clientWidth : bx.clientWidth) * 0.38 - 4, h = bx.clientHeight - 4;   // as tall as the box, and no more than 38% of the window's width; the frame is two pixels a side
    const px = Math.max(2, Math.floor(Math.min(w * dpr / E.MAP_W, h * dpr / E.MAP_H)));
    const sig = JSON.stringify([R.map, R.lit, R.stops.map((s: any) => [s.k, s.city, s.x, s.y])]) + '@' + px;
    if (cv.getAttribute('data-sig') === sig) return;
    try { draw(cv, R, px, dpr, getComputedStyle(cv).fontFamily || 'monospace'); cv.setAttribute('data-sig', sig); cv.setAttribute('data-dot', String(px)); cv.setAttribute('data-map', R.map); } catch (e) { /* a map that cannot be drawn is not worth a crash */ }
  };
  const latest = useRef(check); latest.current = check;
  useLayoutEffect(() => { check(); });
  useEffect(() => { const off = onBoardResize(() => latest.current()); const f = (document as any).fonts; if (f && f.ready) f.ready.then(() => { const cv = ref.current; if (cv) cv.removeAttribute('data-sig'); latest.current(); }); return off; }, []);
  return <div class="rmap" ref={box}>{R.map ? <canvas ref={ref} width={1} height={1} role="img" aria-label={label} {...dataAttrs(p.t)} /> : <p class="nomap" {...dataAttrs(p.t)}>{R.now.city} is on no map yet.</p>}</div>;
}
