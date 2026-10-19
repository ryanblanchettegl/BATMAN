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
function rank(k: string): number { return k === 'now' ? 0 : (k === 'next' ? 1 : (k === 'past' ? 2 : 3)); }

/** The map for the road window. `road` is what E.road(S) returns. It fills its box, as large as whole dots allow. */
export function RoadMap(p: { road: any; t?: string }) {
  const box = useRef<HTMLDivElement>(null), ref = useRef<HTMLCanvasElement>(null), R = p.road;
  const label = R.map ? 'A map of ' + R.mapName + '. This week: ' + R.now.city + (R.now.land ? ', ' + R.now.land : '') + '.' + R.stops.filter((s: any) => s.k === 'next').map((s: any) => ' Next: ' + s.city + '.').join('') : 'No map for ' + R.now.city + '.';
  const check = () => {
    const cv = ref.current, bx = box.current; if (!cv || !bx || !R.map) return;
    const dpr = window.devicePixelRatio || 1, host = bx.parentElement as HTMLElement, w = (host ? host.clientWidth : bx.clientWidth) * 0.45 - 4, h = bx.clientHeight - 4;   // as tall as the box, and no more than 45% of the window's width; the frame is two pixels a side
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
