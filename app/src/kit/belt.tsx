/* A title belt, painted as cut card: the strap, the side plates, the centre plate in its metal, a gem, the company's
   letters and the word on the plate in marker. The engine holds the belt as data (src/89-belts.js, E.beltOf); this
   file draws it on a drawing 96 by 40. Nothing here is an image file, and nothing copies a real company's belt. */
import { E } from '../engine';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { onBoardResize } from './lights';
import { dataAttrs } from './index';

import type { BeltData } from './beltcols';
export type { BeltData };
const GW = 96, GH = 40;
import { METAL, GEM } from './beltcols';
export { METAL, GEM };
const shade = (h: string, k: number) => { const n = parseInt(h.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')).join(''); };
let beltPaints = 0;
export function beltDraws(): number { return beltPaints; }

/** Paint belt b on x, in units of the 96 by 40 drawing. Also used by scenes for a belt held up close. */
export function paintBelt(x: CanvasRenderingContext2D, b: BeltData, font = 'sans-serif') {
  const [rim, face, shine] = METAL[b.mt] || METAL.gold, strap = b.st || '#1c1b1f', edge = shade(strap, 0.55);
  const poly = (pts: number[][], col: string) => { x.fillStyle = col; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
  const C = (a: number, c: number, r: number, col: string) => { x.fillStyle = col; x.beginPath(); x.arc(a, c, r, 0, 7); x.fill(); };
  const EL = (a: number, c: number, rx: number, ry: number, col: string) => { x.fillStyle = col; x.beginPath(); x.ellipse(a, c, rx, ry, 0, 0, 7); x.fill(); };
  const RR = (a: number, c: number, w: number, h: number, r: number, col: string) => { x.fillStyle = col; x.beginPath(); x.moveTo(a + r, c); x.arcTo(a + w, c, a + w, c + h, r); x.arcTo(a + w, c + h, a, c + h, r); x.arcTo(a, c + h, a, c, r); x.arcTo(a, c, a + w, c, r); x.closePath(); x.fill(); };
  const cut = (f: () => void) => { x.save(); x.shadowColor = 'rgba(0,0,0,.55)'; x.shadowOffsetX = .5; x.shadowOffsetY = .8; x.shadowBlur = 1; f(); x.restore(); };
  // the strap: a band with a gentle sag, a tip at the left with holes, a keeper at the right
  const top = (u: number) => 13 + Math.sin(u * Math.PI) * 1.2, bot = (u: number) => 29 + Math.sin(u * Math.PI) * 1.2;
  const band = (inset: number, col: string) => { x.fillStyle = col; x.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, px = 3 + u * 90; const y = top(u) + inset; i ? x.lineTo(px, y) : x.moveTo(px, y); }
    for (let i = 24; i >= 0; i--) { const u = i / 24; x.lineTo(3 + u * 90, bot(u) - inset); } x.closePath(); x.fill(); };
  cut(() => band(0, edge)); band(0.9, strap);
  for (let i = 0; i < 3; i++) C(7 + i * 3.2, 21, 0.75, shade(strap, 0.3));
  if (b.tr === 'stitch') { x.save(); x.setLineDash([1.4, 1.1]); const n = parseInt(strap.slice(1), 16), lum = 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); x.strokeStyle = lum > 150 ? '#6a5a40' : '#e8dcc0'; x.lineWidth = 0.45;
    [2.2, -2.2].forEach(d => { x.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, y = (d > 0 ? top(u) : bot(u)) + d; i ? x.lineTo(3 + u * 90, y) : x.moveTo(3 + u * 90, y); } x.stroke(); }); x.restore(); }
  if (b.tr === 'studs') for (let i = 1; i < 30; i++) { const u = i / 30; C(3 + u * 90, top(u) + 2.2, 0.75, face); C(3 + u * 90, bot(u) - 2.2, 0.75, face); }
  if (b.tr === 'rope' || b.tr === 'etched') { x.save(); x.strokeStyle = face; x.lineWidth = b.tr === 'rope' ? 1.1 : 0.4; if (b.tr === 'rope') x.setLineDash([1.2, 0.6]);
    [1.6, -1.6].forEach(d => { x.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, y = (d > 0 ? top(u) : bot(u)) + d; i ? x.lineTo(3 + u * 90, y) : x.moveTo(3 + u * 90, y); } x.stroke(); }); x.restore(); }
  // side plates
  const side = (cx: number, k: number) => { const cy = 21 + Math.sin((cx - 3) / 90 * Math.PI) * 1.2; x.save(); x.translate(cx, cy); x.scale(k, k); x.translate(-cx, -cy);
    cut(() => { if (b.ss === 'square') RR(cx - 4.4, cy - 5, 8.8, 10, 1.4, rim); else if (b.ss === 'shield') poly([[cx - 4.4, cy - 5.2], [cx + 4.4, cy - 5.2], [cx + 4.4, cy + 1], [cx, cy + 5.6], [cx - 4.4, cy + 1]], rim); else C(cx, cy, 5, rim); });
    if (b.ss === 'square') RR(cx - 3.5, cy - 4.1, 7, 8.2, 1, face); else if (b.ss === 'shield') poly([[cx - 3.5, cy - 4.3], [cx + 3.5, cy - 4.3], [cx + 3.5, cy + 0.6], [cx, cy + 4.4], [cx - 3.5, cy + 0.6]], face); else C(cx, cy, 4.1, face);
    const P: number[][] = []; for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.9 : 2.1; P.push([cx + Math.cos(an) * r, cy - 0.3 + Math.sin(an) * r]); } poly(P, shine); x.restore(); };
  // they start clear of the centre plate and fit before the strap's ends, smaller when they are crowded
  const n = b.sd | 0, s0 = ({ crest: 35, bar: 29, oval: 26, diamond: 26, star: 25 } as Record<string, number>)[b.pl] || 23.5, gap = n > 1 ? Math.min(10.5, (41 - s0) / (n - 1)) : 0, sc = n > 1 ? Math.min(1, gap / 10.5 + 0.12) : 1;
  for (let i = 0; i < n; i++) { const off = s0 + i * gap; side(48 - off, sc); side(48 + off, sc); }
  // the centre plate: a rim, a face, a shine
  const cx = 48, cy = 21; let tY = 14, wY = 26, wW = 30;
  const plate = (s: number, col: string) => {
    if (b.pl === 'round') C(cx, cy, 15 * s, col);
    else if (b.pl === 'oval') EL(cx, cy, 20 * s, 14.5 * s, col);
    else if (b.pl === 'globe') C(cx, cy, 16 * s, col);
    else if (b.pl === 'shield') poly([[cx - 16 * s, cy - 15 * s], [cx + 16 * s, cy - 15 * s], [cx + 16 * s, cy + 3 * s], [cx, cy + 17 * s], [cx - 16 * s, cy + 3 * s]], col);
    else if (b.pl === 'diamond') poly([[cx, cy - 17 * s], [cx + 21 * s, cy], [cx, cy + 17 * s], [cx - 21 * s, cy]], col);
    else if (b.pl === 'square') RR(cx - 16 * s, cy - 13 * s, 32 * s, 26 * s, 3 * s, col);
    else if (b.pl === 'bar') RR(cx - 23 * s, cy - 9 * s, 46 * s, 18 * s, 3 * s, col);
    else if (b.pl === 'star') { const P: number[][] = []; for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, r = (k % 2 ? 9 : 18.5) * s; P.push([cx + Math.cos(an) * r * 1.15, cy + 1 + Math.sin(an) * r]); } poly(P, col); }
    else if (b.pl === 'crown') { poly([[cx - 15 * s, cy - 5 * s], [cx - 15 * s, cy - 17 * s], [cx - 8 * s, cy - 10 * s], [cx, cy - 19 * s], [cx + 8 * s, cy - 10 * s], [cx + 15 * s, cy - 17 * s], [cx + 15 * s, cy - 5 * s]], col); RR(cx - 16 * s, cy - 6 * s, 32 * s, 21 * s, 3 * s, col); }
    else if (b.pl === 'crest') { for (const d of [-1, 1]) for (let k = 0; k < 4; k++) poly([[cx + d * 10 * s, cy - 8 * s + k * 4 * s], [cx + d * (31 - k * 3) * s, cy - 13 * s + k * 5.5 * s], [cx + d * (30 - k * 3) * s, cy - 9.5 * s + k * 5.5 * s], [cx + d * 10 * s, cy - 3 * s + k * 4 * s]], col);
      C(cx, cy, 13.5 * s, col); }
    else C(cx, cy, 15 * s, col);
  };
  cut(() => plate(1, rim)); plate(0.86, face);
  if (b.pl === 'globe') { x.save(); x.strokeStyle = rim; x.lineWidth = 0.5; [6, 11].forEach(rx => { x.beginPath(); x.ellipse(cx, cy, rx, 13.6, 0, 0, 7); x.stroke(); }); [-6, 0, 6].forEach(dy => { const w = Math.sqrt(13.6 * 13.6 - dy * dy); x.beginPath(); x.moveTo(cx - w, cy + dy); x.lineTo(cx + w, cy + dy); x.stroke(); }); x.restore(); }
  if (b.pl === 'crest') { x.save(); x.strokeStyle = rim; x.lineWidth = 0.4; for (const d of [-1, 1]) for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(cx + d * 12, cy - 6 + k * 4.4); x.lineTo(cx + d * (27 - k * 3), cy - 10 + k * 5.2); x.stroke(); } x.restore(); }
  // a shine across the upper left of the face
  x.save(); x.globalAlpha = 0.45; x.beginPath(); plate(0.86, 'rgba(0,0,0,0)'); x.clip(); x.fillStyle = shine; poly([[cx - 30, cy - 20], [cx - 4, cy - 20], [cx - 22, cy + 4], [cx - 30, cy + 4]], shine); x.restore();
  if (b.pl === 'bar') { tY = 15.5; wY = 25; wW = 40; } else if (b.pl === 'crown') { tY = 18; wY = 28; wW = 26; } else if (b.pl === 'diamond') { wW = 26; } else if (b.pl === 'star') { wW = 24; tY = 15.5; }
  // the gem
  if (b.gm && b.gm !== 'none') { const g = GEM[b.gm] || GEM.red, gy = b.pl === 'crown' ? cy - 12 : (b.pl === 'bar' ? cy - 2.5 : cy - 3);
    cut(() => C(cx, gy, 3.2, rim)); C(cx, gy, 2.5, g); poly([[cx - 1.6, gy - 0.6], [cx - 0.2, gy - 1.9], [cx + 0.4, gy - 0.9]], 'rgba(255,255,255,.75)'); }
  // the company's letters above, the word on a banner below, in marker
  const fit = (s: string, size: number, max: number, w: string) => { x.font = w + ' ' + size + "px 'Craft Marker', " + font; const m = x.measureText(s).width; if (m > max) { x.font = w + ' ' + (size * max / m) + "px 'Craft Marker', " + font; } };
  x.textAlign = 'center'; x.textBaseline = 'middle';
  if (b.top) { fit(b.top, 4.2, 18, '400'); x.fillStyle = rim; x.fillText(b.top, cx, b.gm && b.gm !== 'none' && b.pl !== 'crown' && b.pl !== 'bar' ? tY - 3 : tY); }
  if (b.w) { const bw = Math.min(wW + 6, Math.max(18, b.w.length * 3.6 + 6));
    cut(() => { poly([[cx - bw / 2 - 2.5, wY - 3.6], [cx + bw / 2 + 2.5, wY - 3.6], [cx + bw / 2, wY], [cx + bw / 2 + 2.5, wY + 3.6], [cx - bw / 2 - 2.5, wY + 3.6], [cx - bw / 2, wY]], rim); });
    fit(b.w, 5, bw - 1, '400'); x.fillStyle = shine; x.fillText(b.w, cx, wY + 0.3); }
}

const BASE = 16.589;
function BeltCanvas(p: { b: BeltData; dot: number; label: string; t?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const check = () => {
    const cv = ref.current; if (!cv) return;
    const fs = parseFloat(getComputedStyle(cv).fontSize) || BASE, dpr = window.devicePixelRatio || 1, k = Math.max(1, Math.round(p.dot * fs / BASE * dpr)), sig = 'b:' + JSON.stringify(p.b) + '@' + k;
    if (cv.getAttribute('data-sig') === sig) return;
    cv.width = GW * k; cv.height = GH * k; cv.style.width = (GW * k / dpr) + 'px'; cv.style.height = (GH * k / dpr) + 'px';
    const x = cv.getContext('2d'); if (!x) return;
    x.clearRect(0, 0, cv.width, cv.height); x.save(); x.scale(k, k);
    try { paintBelt(x, p.b, getComputedStyle(cv).fontFamily || 'sans-serif'); } catch (e) { /* a belt that cannot be painted is not worth a crash */ }
    x.restore(); cv.setAttribute('data-sig', sig); cv.setAttribute('data-w', String(GW)); cv.setAttribute('data-h', String(GH)); cv.setAttribute('data-dot', String(k)); beltPaints++;
  };
  const latest = useRef(check); latest.current = check;
  useLayoutEffect(() => { check(); });
  useEffect(() => { const off = onBoardResize(() => latest.current()); const f = (document as any).fonts; if (f && f.ready) f.ready.then(() => { const cv = ref.current; if (cv) cv.removeAttribute('data-sig'); latest.current(); }); return off; }, []);
  return <span class="beltc"><canvas ref={ref} width={1} height={1} role="img" aria-label={p.label} {...dataAttrs(p.t)} /></span>;
}

/** A title's belt. `of` is a title (in a game or a world package, with `co` its company) or a belt itself.
    size: 'badge' for lists, 'board' for a title's page; `dot` sets the size of one unit yourself. */
export function Belt(p: { of: any; co?: any; size?: 'badge' | 'board'; dot?: number; label?: string; t?: string }) {
  const b: BeltData = p.of && p.of.pl && p.of.mt ? p.of : E.beltOf(p.of, p.co);
  const say = p.label || ((p.of && p.of.name) ? 'The belt of the ' + p.of.name : 'A title belt');
  return <BeltCanvas b={b} dot={p.dot || (p.size === 'board' ? 4 : 1.5)} label={say} t={p.t} />;
}
