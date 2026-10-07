/* The road map: a board of square dots on a blue sea (docs/mockups/final/final-1-desk.png). Each dot is a piece of a
   state or a land. This week's lights yellow, the next stop's magenta, the places the company tours a lighter green.
   The road so far is drawn over it as arcs from city to city.

   The board itself is data in the engine (E.MAPS, built by tools/build-maps.js). Nothing here is an image file
   (rule 2). The map takes whatever room its box gives it: a dot is always a whole number of screen pixels. */
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { E } from '../engine';
import { dataAttrs } from './index';
import { onBoardResize } from './lights';

const SEA = '#0000aa', SEADOT = '#0044d0', OTHER = '#0b5c8c', LAND = ['#00aa00', '#008a3a', '#00a04e'], MINE = '#55ff55', NOW = '#ffff55', NEXT = '#ff55ff';
let mapDraws = 0;
/** How many times a road map has been drawn. A test watches it: the map is drawn once and kept. */
export function roadMapDraws(): number { return mapDraws; }

interface Stop { k: string; city: string; x?: number; y?: number }
function draw(cv: HTMLCanvasElement, R: any, p: number, dpr: number, font: string) {
  const M = (E.MAPS as any[]).find(m => m.id === R.map); if (!M) return;
  const W: number = E.MAP_W, H: number = E.MAP_H, ABC: string = E.MAP_ABC;
  cv.width = W * p; cv.height = H * p; cv.style.width = (W * p / dpr) + 'px'; cv.style.height = (H * p / dpr) + 'px';
  const x = cv.getContext('2d'); if (!x) return;
  x.fillStyle = SEA; x.fillRect(0, 0, cv.width, cv.height);
  const s = Math.max(2, Math.round(p * .84)), o = Math.floor((p - s) / 2), sd = Math.max(1, Math.round(p * .26)), so = Math.floor((p - sd) / 2), mine: Record<number, 1> = {};
  (R.lit.mine as number[]).forEach(a => { mine[a] = 1; });
  const hot: [number, number][] = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const ch = M.g[r].charAt(c);
    if (ch === ' ') { x.fillStyle = SEADOT; x.fillRect(c * p + so, r * p + so, sd, sd); continue; }
    if (ch === '-') { x.fillStyle = OTHER; x.fillRect(c * p + o, r * p + o, s, s); continue; }
    const a = ABC.indexOf(ch);
    if (a === R.lit.now) { hot.push([c, r]); continue; }
    x.fillStyle = a === R.lit.next ? NEXT : (mine[a] ? MINE : LAND[(a * 7 + 3) % LAND.length]); x.fillRect(c * p + o, r * p + o, s, s);
  }
  // this week's land last, each dot with a black edge so it stands off its neighbours
  hot.forEach(h => { x.fillStyle = '#000'; x.fillRect(h[0] * p + o - 1, h[1] * p + o - 1, s + 2, s + 2); x.fillStyle = NOW; x.fillRect(h[0] * p + o, h[1] * p + o, s, s); });

  const u = p / 8, at = (st: Stop): [number, number] => [(st.x as number) * p, (st.y as number) * p];
  const seen: Record<string, 1> = {}, on: Stop[] = [];
  let far = 0;
  (R.stops as Stop[]).forEach(st => { if (st.x == null) return; if (st.k === 'far' && far++ > 0) return; on.push(st); });
  // the arcs: red for the road so far, dashed yellow to the next stop, dotted white beyond it
  x.lineCap = 'round';
  for (let i = 0; i < on.length - 1; i++) {
    const a = on[i], b = on[i + 1], A = at(a), B = at(b), d = Math.hypot(B[0] - A[0], B[1] - A[1]); if (d < p) continue;
    const kind = b.k === 'past' || b.k === 'now' ? 'done' : (b.k === 'next' ? 'nx' : 'far');
    const cy = Math.max(-cv.height * .25, Math.min(A[1], B[1]) - d * .36 - 6 * u);
    const path = () => { x.beginPath(); x.moveTo(A[0], A[1]); x.quadraticCurveTo((A[0] + B[0]) / 2, cy, B[0], B[1]); };
    x.setLineDash([]); x.strokeStyle = 'rgba(0,0,0,.55)'; x.lineWidth = Math.max(2, 3.6 * u); path(); x.stroke();
    x.setLineDash(kind === 'nx' ? [5 * u, 4 * u] : (kind === 'far' ? [1.5 * u, 5 * u] : [])); x.strokeStyle = kind === 'done' ? '#ff5555' : (kind === 'nx' ? '#ffff55' : '#ffffff'); x.lineWidth = Math.max(1.5, 2 * u); path(); x.stroke();
  }
  x.setLineDash([]);
  // the cities, and a ring round this week's
  const boxes: number[][] = [];
  on.forEach(st => { const P = at(st), r = (st.k === 'now' ? 4.5 : 3.2) * u;
    x.beginPath(); x.arc(P[0], P[1], r, 0, 7); x.fillStyle = st.k === 'past' ? '#ff5555' : '#ffffff'; x.fill(); x.lineWidth = Math.max(1, (st.k === 'now' ? 1.5 : 1) * u); x.strokeStyle = '#000'; x.stroke();
    if (st.k === 'now') { x.beginPath(); x.arc(P[0], P[1], 11 * u, 0, 7); x.lineWidth = Math.max(1.5, 1.8 * u); x.strokeStyle = '#000'; x.stroke(); x.beginPath(); x.arc(P[0], P[1], 11 * u, 0, 7); x.lineWidth = Math.max(1, 1.2 * u); x.strokeStyle = '#fff'; x.stroke(); }
    boxes.push([P[0] - 5 * u, P[1] - 5 * u, P[0] + 5 * u, P[1] + 5 * u]); });
  // the names: this week's first so it gets the best spot, each where it covers no other name and no city
  const order = on.slice().sort((a, b) => rank(a.k) - rank(b.k));
  x.textBaseline = 'middle'; x.lineJoin = 'round';
  order.forEach(st => {
    if (seen[st.city]) return; seen[st.city] = 1;
    const P = at(st), big = st.k === 'now', px = Math.max(9, Math.round((big ? 18 : 15) * u)), text = st.city.toUpperCase();
    x.font = px + 'px ' + font;
    const w = x.measureText(text).width, h = px * .8, g = (big ? 14 : 7) * u;
    const tries: [number, number][] = [[P[0] + g, P[1] - g - h / 2], [P[0] + g, P[1] + g + h / 2], [P[0] - g - w, P[1] + g + h / 2], [P[0] - g - w, P[1] - g - h / 2], [P[0] + g, P[1]], [P[0] - g - w, P[1]], [P[0] - w / 2, P[1] + g + h], [P[0] - w / 2, P[1] - g - h]];
    let best = tries[0], bs = 1e9;
    tries.forEach((t, i) => { const b = [t[0] - 2, t[1] - h / 2 - 2, t[0] + w + 2, t[1] + h / 2 + 2]; let sc = i * .01;
      if (b[0] < 2 || b[1] < 2 || b[2] > cv.width - 2 || b[3] > cv.height - 2) sc += 50;
      boxes.forEach(q => { if (b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]) sc += 10; });
      if (sc < bs) { bs = sc; best = t; } });
    const tx = Math.max(2, Math.min(cv.width - w - 2, best[0])), ty = Math.max(h / 2 + 2, Math.min(cv.height - h / 2 - 2, best[1]));
    boxes.push([tx - 2, ty - h / 2 - 2, tx + w + 2, ty + h / 2 + 2]);
    x.lineWidth = Math.max(2, 3 * u); x.strokeStyle = '#000'; x.strokeText(text, tx, ty);
    x.fillStyle = big ? '#ffff55' : (st.k === 'next' ? '#ff9cff' : '#ffffff'); x.fillText(text, tx, ty);
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
