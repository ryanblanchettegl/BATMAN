/* Construction paper, drawn by the game (rule 2a; docs/plans/papercraft-engine.md, section 4).
   A picture is a list of pieces of card. Each piece is an outline, a colour and a height. The renderer lays them
   from the lowest up; each throws a short shadow down and to the right, shows the paler core of the card along its
   cut edge, and the whole picture takes a fine paper grain. Outlines are cut "by hand": short straight snips, each
   a little off the line, from a seed, so the same piece is always cut the same way. Nothing here is an image file
   and nothing reads or writes the game. The look matches the Blender pictures in docs/mockups/paper/. */

export type Pt = [number, number];
export interface Piece {
  pts: Pt[]; col: string; z: number;
  lift?: number;            // how far it stands off what is under it (scene units): the length of its shadow
  own?: string; joint?: string; prop?: string;   // who it belongs to, for picking it with a pointer
  txt?: { s: string; x: number; y: number; size: number; col: string; align?: CanvasTextAlign; edge?: string };   // edge: a thin outline round the letters, for words with nothing behind them
  glow?: boolean;           // lit lettering: no grain over it
  layer?: 'back' | 'front'; // part of the set: drawn once and kept (back behind everybody, front before them)
  soft?: boolean;           // a soft shadow on the floor, not a piece of card
  fin?: 'foil' | 'corr' | 'neon' | 'denim' | 'leather';   // a card that is not plain matte (Create a Player swatches)
}
export interface View { s: number; ox: number; oy: number }   // pixels per unit; the pixel position of x = 0, y = 0 (y up)

/* ---------- colours: the Blender pictures' card, as the screen shows it ---------- */
const lin = (r: number, g: number, b: number) => '#' + [r, g, b].map(v => Math.round(Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2) * 255).toString(16).padStart(2, '0')).join('');
export const PAL: Record<string, string> = {
  blue: lin(0.06, 0.22, 0.55), sky: lin(0.25, 0.55, 0.85), maroon: lin(0.42, 0.04, 0.06), red: lin(0.78, 0.08, 0.06), grey: lin(0.38, 0.38, 0.4),
  black: lin(0.025, 0.025, 0.03), white: lin(0.92, 0.9, 0.84), gold: lin(0.95, 0.66, 0.08), yellow: lin(0.98, 0.84, 0.18), green: lin(0.1, 0.45, 0.18),
  purple: lin(0.32, 0.1, 0.45), orange: lin(0.95, 0.38, 0.06), pink: lin(0.95, 0.45, 0.55), teal: lin(0.05, 0.45, 0.45), brown: lin(0.28, 0.14, 0.06),
  cream: lin(0.9, 0.84, 0.7), navy: lin(0.03, 0.04, 0.12), mat: lin(0.86, 0.86, 0.84), steel: lin(0.7, 0.7, 0.74), wood: lin(0.45, 0.26, 0.1),
};
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k));
  return '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}

/* ---------- shapes, in scene units ---------- */
export function ell(cx: number, cy: number, rx: number, ry: number, n = 20, a0 = 0, a1 = Math.PI * 2): Pt[] {
  const o: Pt[] = []; for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } return o;
}
export function rect(x: number, y: number, w: number, h: number): Pt[] { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
export function star(cx: number, cy: number, r: number, n = 5, inner = 0.45, rot = Math.PI / 2): Pt[] {
  const o: Pt[] = []; for (let i = 0; i < 2 * n; i++) { const rr = i % 2 ? r * inner : r, a = rot + i * Math.PI / n; o.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return o;
}
export function almond(cx: number, cy: number, w: number, h: number, tilt = 0, n = 12): Pt[] {
  const p: Pt[] = [];
  for (let i = 0; i <= n; i++) p.push([-w / 2 + w * i / n, h * Math.sin(Math.PI * i / n)]);
  for (let i = 1; i < n; i++) p.push([w / 2 - w * i / n, -0.55 * h * Math.sin(Math.PI * i / n)]);
  const c = Math.cos(tilt), s = Math.sin(tilt); return p.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
}
/** A tapered strip from a to b, bowed by `bow` (a brow, a strap, a rope). */
export function strip(a: Pt, b: Pt, w0: number, w1: number, bow = 0, n = 8): Pt[] {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, top: Pt[] = [], bot: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = (w0 + (w1 - w0) * t) / 2, bw = bow * Math.sin(Math.PI * t), px = a[0] + dx * t + nx * bw, py = a[1] + dy * t + ny * bw;
    top.push([px + nx * w, py + ny * w]); bot.push([px - nx * w, py - ny * w]);
  }
  return top.concat(bot.reverse());
}
export interface Head { cx: number; cy: number; rx: number; ryt: number; ryb: number; sq: number; chin: number;
  /** Cut in straight snips (style C, Bill 29 October): about this many corners round the whole head, so the head, its hair and its mask share the same cuts. */ facet?: number }
/** A head's outline: a round top, and a jaw from round (sq 2) to square (sq 4) that narrows to the chin. */
export function headPoly(h: Head, k = 1, t0 = 0, t1 = Math.PI * 2, n = 36, dy = 0): Pt[] {
  if (h.facet) n = Math.max(2, Math.round(h.facet * Math.abs(t1 - t0) / (Math.PI * 2)));
  const o: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + (t1 - t0) * i / n, c = Math.cos(t), s = Math.sin(t);
    let x: number, y: number;
    if (s >= 0) { x = h.rx * c; y = h.ryt * s; } else { const e = 2 / h.sq; x = h.rx * Math.sign(c) * Math.pow(Math.abs(c), e) * (1 - h.chin * s * s); y = h.ryb * Math.sign(s) * Math.pow(Math.abs(s), e); }
    o.push([h.cx + k * x, h.cy + dy + k * y]);
  }
  return o;
}

/* ---------- the hand cut ---------- */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** Cut an outline by hand: short snips, each a little off the line. Same seed, same cut. */
export function snip(poly: Pt[], seed: number, amt = 0.012, step = 0.09): Pt[] {
  const r = rng(seed), o: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) { const t = k / n; o.push([a[0] + (b[0] - a[0]) * t + (r() - 0.5) * 2 * amt, a[1] + (b[1] - a[1]) * t + (r() - 0.5) * 2 * amt]); }
  }
  return o;
}

/* ---------- the paper grain, made once ---------- */
let grainPat: HTMLCanvasElement | null = null;
function grain(): HTMLCanvasElement {
  if (grainPat) return grainPat;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!, d = x.createImageData(128, 128), r = rng(7);
  // fine fibre plus a few longer fibres, light around the middle grey so 'multiply' only darkens a little
  const v = new Float32Array(128 * 128); for (let i = 0; i < v.length; i++) v[i] = r();
  for (let f = 0; f < 90; f++) { let px = r() * 128, py = r() * 128; const a = r() * Math.PI, L = 4 + r() * 10; for (let s = 0; s < L; s++) { const i = ((Math.floor(py) & 127) * 128 + (Math.floor(px) & 127)); v[i] = Math.min(v[i], 0.15); px += Math.cos(a); py += Math.sin(a); } }
  for (let i = 0; i < v.length; i++) { const g = Math.round(255 - (1 - v[i]) * 22); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = g; d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0); grainPat = c; return c;
}

export function toPx(v: View, p: Pt): Pt { return [v.ox + p[0] * v.s, v.oy - p[1] * v.s]; }
export function fromPx(v: View, x: number, y: number): Pt { return [(x - v.ox) / v.s, (v.oy - y) / v.s]; }
function path(ctx: CanvasRenderingContext2D, v: View, pts: Pt[]) {
  ctx.beginPath(); pts.forEach((p, i) => { const q = toPx(v, p); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath();
}

/** Lay the pieces on the canvas, lowest first. `grainOn` lays the paper grain over the finished picture. */
export function drawPaper(ctx: CanvasRenderingContext2D, pieces: Piece[], v: View, grainOn = true) {
  const list = pieces.slice().sort((a, b) => a.z - b.z), edge = Math.max(1, v.s * 0.012);
  ctx.save(); ctx.lineJoin = 'round';
  for (const p of list) {
    if (p.txt) {
      const q = toPx(v, [p.txt.x, p.txt.y]);
      ctx.shadowColor = 'transparent'; ctx.fillStyle = p.txt.col; ctx.textAlign = p.txt.align || 'center'; ctx.textBaseline = 'middle';
      ctx.font = Math.round(p.txt.size * v.s * 0.8) + "px 'Craft Marker', 'EWF Sans', sans-serif"; if (p.txt.edge) { ctx.lineWidth = Math.max(2, p.txt.size * v.s * 0.09); ctx.lineJoin = 'round'; ctx.strokeStyle = p.txt.edge; ctx.strokeText(p.txt.s, q[0], q[1]); } ctx.fillText(p.txt.s, q[0], q[1]);
      continue;
    }
    if (p.pts.length < 3) continue;
    const L = (p.lift == null ? 0.05 : p.lift) * v.s;
    path(ctx, v, p.pts);
    ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowOffsetX = L * 0.55; ctx.shadowOffsetY = L * 0.7; ctx.shadowBlur = L * 0.9;
    ctx.fillStyle = p.col; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = shade(p.col, 1.35); ctx.globalAlpha = 0.7; ctx.lineWidth = edge; ctx.stroke(); ctx.globalAlpha = 1;   // the paler core along the cut
  }
  ctx.restore();
  if (grainOn) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ctx.createPattern(grain(), 'repeat')!; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }
}

/* ---------- the diorama: the graphics engine of the game ----------
   Ryan, 18 October: this is how the whole game looks, on Steam, from a Steam Deck to a 4K screen. A scene is drawn
   like a shoebox diorama photographed close up:
   - every piece of card has a thickness: a sliver of its darker edge shows below and to the right of it;
   - light falls across each piece, brighter at the top left;
   - each piece throws a shadow that grows with how far it stands off what is under it, and people throw a soft
     shadow on the floor where they stand or lie;
   - the far part of the set (the crowd, the back walls) is a little out of focus, and the very front a touch, as in
     a photograph of something small;
   - a pool of light falls on the middle and the edges of the box go dark.
   The set is drawn once and kept (two layers, behind and in front of the people); only the people and props are
   drawn every frame. `quality` 0 (a Steam Deck on battery) leaves out the blur and the light across each piece. */
export let quality = 2;
export function setQuality(q: number) { quality = Math.max(0, Math.min(2, q)); layerCache.clear(); }
const layerCache = new Map<string, HTMLCanvasElement>();

function drawPieces(ctx: CanvasRenderingContext2D, list: Piece[], v: View) {
  const edge = Math.max(1, v.s * 0.012), thick = Math.max(1.2, v.s * 0.032);
  ctx.save(); ctx.lineJoin = 'round';
  for (const p of list) {
    if (p.txt) {
      const q = toPx(v, [p.txt.x, p.txt.y]);
      ctx.shadowColor = 'transparent'; ctx.fillStyle = p.txt.col; ctx.textAlign = p.txt.align || 'center'; ctx.textBaseline = 'middle';
      ctx.font = Math.round(p.txt.size * v.s * 0.8) + "px 'Craft Marker', 'EWF Sans', sans-serif"; if (p.txt.edge) { ctx.lineWidth = Math.max(2, p.txt.size * v.s * 0.09); ctx.lineJoin = 'round'; ctx.strokeStyle = p.txt.edge; ctx.strokeText(p.txt.s, q[0], q[1]); } ctx.fillText(p.txt.s, q[0], q[1]);
      continue;
    }
    if (p.pts.length < 3) continue;
    if (p.soft) {   // a soft shadow on the floor
      ctx.save(); if (quality > 0) ctx.filter = 'blur(' + Math.round(v.s * 0.09) + 'px)'; path(ctx, v, p.pts); ctx.fillStyle = p.col; ctx.fill(); ctx.restore(); continue;
    }
    const L = (p.lift == null ? 0.05 : p.lift) * v.s, clean = p.own != null;   // a wrestler is flat and clean: no shadow on them (Ryan, 19 October)
    // the thickness of the card, with the shadow thrown under it (not on a wrestler: their shadow is thrown once, behind them, in drawScene)
    if (!clean) {
      ctx.save(); ctx.translate(thick * 0.55, thick * 0.75); path(ctx, v, p.pts);
      ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowOffsetX = L * 0.55; ctx.shadowOffsetY = L * 0.7; ctx.shadowBlur = L * 1.1;
      ctx.fillStyle = shade(p.col, 0.55); ctx.fill(); ctx.restore();
    }
    // the face of the card, with the light across it
    path(ctx, v, p.pts); ctx.shadowColor = 'transparent';
    if (clean && p.fin !== 'foil' && p.fin !== 'leather') ctx.fillStyle = p.col;
    else if (quality > 0) {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p.pts) { const r = toPx(v, q); if (r[0] < x0) x0 = r[0]; if (r[0] > x1) x1 = r[0]; if (r[1] < y0) y0 = r[1]; if (r[1] > y1) y1 = r[1]; }
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      if (p.fin === 'foil') { g.addColorStop(0, shade(p.col, 1.3)); g.addColorStop(0.38, shade(p.col, 0.78)); g.addColorStop(0.5, shade(p.col, 1.65)); g.addColorStop(0.62, shade(p.col, 0.8)); g.addColorStop(1, shade(p.col, 1.15)); }
      else if (p.fin === 'leather') { g.addColorStop(0, shade(p.col, 1.16)); g.addColorStop(0.25, shade(p.col, 1.0)); g.addColorStop(1, shade(p.col, 0.72)); }
      else { g.addColorStop(0, shade(p.col, 1.08)); g.addColorStop(1, shade(p.col, 0.88)); }
      ctx.fillStyle = g;
    } else ctx.fillStyle = p.col;
    if (p.fin === 'neon') { ctx.shadowColor = p.col; ctx.shadowBlur = v.s * 0.14; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
    ctx.fill(); ctx.shadowColor = 'transparent';
    if ((p.fin === 'corr' || p.fin === 'denim') && quality > 0) {   // the ridges of corrugated board, the weave of denim
      ctx.save(); ctx.clip(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of p.pts) { const r = toPx(v, q); x0 = Math.min(x0, r[0]); x1 = Math.max(x1, r[0]); y0 = Math.min(y0, r[1]); y1 = Math.max(y1, r[1]); }
      const step = Math.max(2, v.s * (p.fin === 'corr' ? 0.07 : 0.035)); ctx.lineWidth = Math.max(1, step * (p.fin === 'corr' ? 0.35 : 0.3)); ctx.strokeStyle = p.fin === 'corr' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.13)';
      ctx.beginPath(); if (p.fin === 'corr') for (let x = x0; x <= x1; x += step) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); } else for (let x = x0 - (y1 - y0); x <= x1; x += step) { ctx.moveTo(x, y1); ctx.lineTo(x + (y1 - y0), y0); }
      ctx.stroke(); ctx.restore(); path(ctx, v, p.pts);
    }
    ctx.strokeStyle = shade(p.col, 1.35); ctx.globalAlpha = 0.6; ctx.lineWidth = edge; ctx.stroke(); ctx.globalAlpha = 1;   // the paler core along the cut
  }
  ctx.restore();
}
function layer(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let c = layerCache.get(key);
  if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!); if (layerCache.size > 24) layerCache.clear(); layerCache.set(key, c); }
  return c;
}
/** Draw a scene as a diorama. `key` names the set, so its layers are drawn once and kept. */
export function drawScene(ctx: CanvasRenderingContext2D, pieces: Piece[], v: View, key: string, bare = false) {
  const W = ctx.canvas.width, H = ctx.canvas.height, k = key + '|' + W + 'x' + H + '|' + Math.round(v.s * 100) + ',' + Math.round(v.ox) + ',' + Math.round(v.oy) + '|q' + quality;
  const back = pieces.filter(p => p.layer === 'back'), front = pieces.filter(p => p.layer === 'front'), mid = pieces.filter(p => !p.layer).sort((a, b) => a.z - b.z);
  const far = back.filter(p => p.z < -0.75).sort((a, b) => a.z - b.z), near = back.filter(p => p.z >= -0.75).sort((a, b) => a.z - b.z);
  const blur = (n: number) => quality > 0 ? 'blur(' + Math.max(0, n).toFixed(1) + 'px)' : 'none';
  const B = layer(k + 'b', W, H, c => {
    const f = layer(k + 'f', W, H, d => drawPieces(d, far, v));
    c.save(); c.filter = blur(v.s * 0.04); c.drawImage(f, 0, 0); c.restore();   // the far part, a little out of focus
    drawPieces(c, near, v);
  });
  const Fr = layer(k + 'n', W, H, c => drawPieces(c, front.sort((a, b) => a.z - b.z), v));
  ctx.drawImage(B, 0, 0);
  // the paper grain goes on the set only: people are cut from flat colour (style C, Bill 29 October)
  if (!bare) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = ctx.createPattern(grain(), 'repeat')!; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // each wrestler throws one shadow, down and to the right, onto whatever is behind them; they themselves stay clean
  const figs = mid.filter(p => p.own != null && !p.soft && !p.txt && p.pts.length >= 3);
  if (figs.length) {
    const sh = v.s * 0.06; ctx.save(); ctx.translate(sh * 0.55, sh * 0.75); ctx.fillStyle = 'rgba(0,0,0,0.38)'; if (quality > 0) ctx.filter = 'blur(' + Math.max(1, Math.round(v.s * 0.025)) + 'px)';
    ctx.beginPath(); for (const p of figs) { const q = p.pts.map(t => toPx(v, t)); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); }
    ctx.fill('nonzero'); ctx.restore();
  }
  if (figs.length) {   // each person is cut out with a margin of cream card round them, like a paper doll off the sheet
    ctx.save(); ctx.fillStyle = ctx.strokeStyle = '#f2e8cf'; ctx.lineJoin = 'round'; ctx.lineWidth = v.s * 0.1;
    ctx.beginPath(); for (const p of figs) { const q = p.pts.map(t => toPx(v, t)); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); }
    ctx.stroke(); ctx.fill('nonzero'); ctx.restore();
  }
  drawPieces(ctx, mid, v);
  ctx.save(); ctx.filter = blur(v.s * 0.015); ctx.drawImage(Fr, 0, 0); ctx.restore();   // the very front, a touch soft
  // the light: a pool on the middle, the edges of the box dark
  const L = layer('light|' + W + 'x' + H, W, H, c => {
    const g = c.createRadialGradient(W * 0.48, H * 0.38, H * 0.15, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, 'rgba(255,244,214,0.10)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,6,20,0.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  });
  // `bare`: a figure on nothing (a fan in the crowd): the light goes on the figure only, never on empty space
  if (bare) ctx.globalCompositeOperation = 'source-atop';
  ctx.drawImage(L, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
}

/** Which piece is under a point (pixels), from the top down. */
export function pick(pieces: Piece[], v: View, x: number, y: number, ok: (p: Piece) => boolean): Piece | null {
  const [px, py] = fromPx(v, x, y), list = pieces.filter(p => !p.txt && ok(p)).sort((a, b) => b.z - a.z);
  for (const p of list) {
    let inside = false; const q = p.pts;
    for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
      if ((q[i][1] > py) !== (q[j][1] > py) && px < (q[j][0] - q[i][0]) * (py - q[i][1]) / (q[j][1] - q[i][1]) + q[i][0]) inside = !inside;
    }
    if (inside) return p;
  }
  return null;
}
