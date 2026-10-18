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
  txt?: { s: string; x: number; y: number; size: number; col: string; align?: CanvasTextAlign };
  glow?: boolean;           // lit lettering: no grain over it
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
export interface Head { cx: number; cy: number; rx: number; ryt: number; ryb: number; sq: number; chin: number }
/** A head's outline: a round top, and a jaw from round (sq 2) to square (sq 4) that narrows to the chin. */
export function headPoly(h: Head, k = 1, t0 = 0, t1 = Math.PI * 2, n = 36, dy = 0): Pt[] {
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
      ctx.font = Math.round(p.txt.size * v.s) + "px 'VT323', monospace"; ctx.fillText(p.txt.s, q[0], q[1]);
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
