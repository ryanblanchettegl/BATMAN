/* A company's logo: its own icon, built from its initials (docs/plans/art-direction.md, sections 3 and 3a).
   The engine holds the logo as data (src/89-logos.js, E.logoOf); this file draws it. Three sizes:
   a chip (the letters on the company's colour, for lists and the menu bar), a badge (the logo painted as cut card on
   black card, a drawing 40 by 32) and a board (the same, larger). Nothing here is an image file, and nothing copies a real company's logo. */
import { E } from '../engine';
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { onBoardResize } from './lights';
import { dataAttrs } from './index';

export interface LogoData { l: string; st: string; lay: string; sh: string; fin: string; c1: string; c2: string; c3: string; ex: string; tag: string; fo?: string }
const GW = 40, GH = 32;
const dark = (h: string, k?: number) => { const n = parseInt(h.slice(1), 16); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * (k || .42)).toString(16).padStart(2, '0')).join(''); };

/* No dot matrix (Ryan, 19 October): a logo in badge or board size is painted smoothly from the same drawing, as cut card
   on black card, its letters in marker. The canvas keeps data-w, data-h and data-dot (the size of one unit of the 40 by
   32 drawing), so a test can still read it unit by unit. */
let logoPaints = 0;
export function logoDraws(): number { return logoPaints; }
/** The face and weight each lettering choice draws in. */
const FACES: Record<string, [string, string, number]> = { marker: ['400', 'Craft Marker', 1], block: ['800', 'EWF Sans', 0.92], typed: ['400', 'Craft Typed', 0.95], brush: ['400', 'Craft Gochi', 1.1], neat: ['400', 'Craft Hand', 1.1], scrawl: ['700', 'Craft Kalam', 1] };
function paintLogo(x: CanvasRenderingContext2D, m: LogoData, font: string) {
  const c1 = m.c1, c2 = m.c2, c3 = m.c3, s = m.sh, band = dark(c1);
  const poly = (pts: number[][], col: string) => { x.fillStyle = col; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1])); x.closePath(); x.fill(); };
  const R = (a: number, b: number, w: number, h: number, col: string) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const C = (a: number, b: number, r: number, col: string) => { x.fillStyle = col; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); };
  const EL = (a: number, b: number, rx: number, ry: number, col: string) => { x.fillStyle = col; x.beginPath(); x.ellipse(a, b, rx, ry, 0, 0, 7); x.fill(); };
  let cy = 16;
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowOffsetX = .5; x.shadowOffsetY = .7; x.shadowBlur = .8;
  if (s === 'shield') { poly([[5, 2], [35, 2], [35, 17], [20, 31], [5, 17]], c2); poly([[7, 4], [33, 4], [33, 16], [20, 28], [7, 16]], c1); cy = 12; }
  if (s === 'ring') { R(3, 4, 34, 24, c2); R(5, 6, 30, 20, c1); [8, 23].forEach(yy => R(5, yy, 30, 1, c2)); }
  if (s === 'laurel') { C(20, 16, 15, c1); C(20, 16, 13, '#000'); for (let k = 0; k < 14; k++) { const an = Math.PI * (0.62 + k * 0.136); C(20 + Math.cos(an) * 14, 16 + Math.sin(an) * 14, 1.5, k % 2 ? c2 : c1); } R(8, 10, 24, 13, band); }
  if (s === 'slash') { poly([[2, 8], [38, 3], [38, 24], [2, 29]], c1); poly([[2, 8], [38, 3], [38, 5], [2, 10]], c2); poly([[2, 27], [38, 22], [38, 24], [2, 29]], c2); }
  if (s === 'star') { const P: number[][] = []; for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 9 : 19; P.push([20 + Math.cos(an) * r * 1.05, 17 + Math.sin(an) * r * 0.86]); } poly(P, c2); R(6, 10, 28, 13, c1); R(6, 10, 28, 1, c2); R(6, 22, 28, 1, c2); }
  if (s === 'diamond') { poly([[20, 1], [39, 16], [20, 31], [1, 16]], c2); poly([[20, 4], [36, 16], [20, 28], [4, 16]], c1); R(9, 11, 22, 11, band); }
  if (s === 'sun') { for (let k = 0; k < 16; k++) { const an = k * Math.PI / 8; poly([[20 + Math.cos(an - 0.1) * 10, 16 + Math.sin(an - 0.1) * 9], [20 + Math.cos(an) * 20, 16 + Math.sin(an) * 16], [20 + Math.cos(an + 0.1) * 10, 16 + Math.sin(an + 0.1) * 9]], k % 2 ? c2 : c1); } EL(20, 16, 13, 10, c1); EL(20, 16, 11.5, 8.5, band); }
  if (s === 'steps') { [[14, 2, 12], [10, 6, 20], [6, 10, 28], [2, 14, 36]].forEach((q, i) => R(q[0], q[1], q[2], 4, i % 2 ? c2 : c1)); R(2, 18, 36, 11, c1); R(2, 18, 36, 1, c2); R(2, 28, 36, 1, c2); cy = 23.5; }
  if (s === 'moon') { C(20, 16, 15, c1); C(26, 12, 12.5, '#000'); R(6, 12, 28, 11, band); cy = 17.5; }
  if (s === 'circle') { C(20, 16, 15.5, c2); C(20, 16, 13.5, c1); C(20, 16, 12, band); }
  if (s === 'hex') { poly([[9, 3], [31, 3], [39, 16], [31, 29], [9, 29], [1, 16]], c2); poly([[10, 5], [30, 5], [36.5, 16], [30, 27], [10, 27], [3.5, 16]], c1); }
  if (s === 'crown') { poly([[4, 12], [10, 3], [15, 10], [20, 2], [25, 10], [30, 3], [36, 12], [36, 14], [4, 14]], c2); [[10, 3], [20, 2], [30, 3]].forEach(q => C(q[0], q[1] + 1, 1.4, '#ff5555')); R(4, 14, 32, 15, c1); R(4, 14, 32, 1, c2); R(4, 28, 32, 1, c2); cy = 21.5; }
  if (s === 'oval') { EL(20, 16, 19, 13, c2); EL(20, 16, 17, 11, c1); }
  if (s === 'globe') { C(20, 16, 15, c1); x.strokeStyle = c2; x.lineWidth = 1; [5, 10].forEach(rx => { x.beginPath(); x.ellipse(20, 16, rx, 15, 0, 0, 7); x.stroke(); }); [-7, 7].forEach(dy => R(20 - Math.sqrt(225 - dy * dy), 16 + dy, 2 * Math.sqrt(225 - dy * dy), 1, c2)); x.beginPath(); x.arc(20, 16, 15, 0, 7); x.stroke(); R(3, 11, 34, 11, band); R(3, 11, 34, 1, c2); R(3, 21, 34, 1, c2); }
  if (s === 'bolt') { poly([[26, 0], [8, 17], [17, 17], [11, 32], [32, 13], [22, 13], [30, 0]], c2); R(4, 11, 32, 11, c1); R(4, 11, 32, 1, c2); R(4, 21, 32, 1, c2); }
  if (s === 'wings') { for (let k = 0; k < 5; k++) { poly([[13, 12 + k * 3], [0, 4 + k * 5], [1, 8 + k * 5], [13, 15 + k * 3]], k % 2 ? c1 : c2); poly([[27, 12 + k * 3], [40, 4 + k * 5], [39, 8 + k * 5], [27, 15 + k * 3]], k % 2 ? c1 : c2); } R(10, 9, 20, 15, c1); R(10, 9, 20, 1, c2); R(10, 23, 20, 1, c2); }
  if (s === 'flame') { poly([[20, 0], [27, 9], [31, 5], [35, 19], [30, 30], [10, 30], [5, 19], [9, 8], [14, 13]], c1); poly([[20, 9], [26, 18], [28, 26], [12, 26], [14, 18]], c2); R(7, 16, 26, 11, band); cy = 21.5; }
  if (s === 'pennant') { poly([[2, 3], [38, 16], [2, 29]], c2); poly([[4, 6], [33, 16], [4, 26]], c1); R(1, 1, 2, 30, '#aaaaaa'); }
  x.restore();
  // the finish: a darker lower half, or darker stripes, laid over the shape only
  if (m.fin === 'split' || m.fin === 'stripe') { x.save(); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(0,0,0,.32)';
    if (m.fin === 'split') x.fillRect(0, cy, 40, 32 - cy); else for (let yy = 0; yy < 32; yy += 3) x.fillRect(0, yy, 40, 1);
    x.restore(); }
  // the letters, in marker
  const str = m.l.slice(0, 3), st = m.st, lay = m.lay, F = FACES[m.fo || ''] || FACES.marker, face = (sz: number) => F[0] + ' ' + sz * F[2] + "px '" + F[1] + "', " + font;
  const put = (ch: string, cx: number, by: number, sz: number, sx: number, sy: number) => {
    x.save(); x.translate(cx, by); if (s === 'slash') x.rotate(-0.12); x.scale(sx, sy); if (st === 'slant') x.transform(1, 0, -0.25, 1, 0, 0);
    x.font = face(sz); x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    if (st === 'outline') { x.lineWidth = 1.6; x.strokeStyle = '#000'; x.lineJoin = 'round'; x.strokeText(ch, 0, 0); }
    if (st === 'shadow') { x.fillStyle = '#000'; x.fillText(ch, .9, .9); }
    x.fillStyle = c3; x.fillText(ch, 0, 0); x.restore(); };
  // the letters' size: as big as fits about two thirds of the logo's width
  let sz0 = 0; if (str) { const n0 = str.length; sz0 = n0 === 1 ? 15 : (n0 === 2 ? 11 : 9); x.font = face(sz0); const mw = x.measureText(str).width * (st === 'wide' ? 1.5 : 1); if (mw > 24) sz0 = sz0 * 24 / mw; }
  if (str) { const sx = st === 'wide' ? 1.5 : 1, sy = st === 'tall' ? 1.5 : 1, n = str.length, sz = sz0, adv = (24 / Math.max(1, n)) * Math.min(1, sz / 8) * (n === 1 ? 0 : 1);
    if (lay === 'stack') { for (let i = 0; i < n; i++) put(str[i], 20, 16 - (n * 8) / 2 + i * 8 + 7.2, 8.5, 1, 1); }
    else if (lay === 'big' && n === 3) { put(str[0], 11, cy + 4.5, 8, 1, 1); put(str[1], 20, cy + 6.5, 15, 1, 1); put(str[2], 29, cy + 4.5, 8, 1, 1); }
    else { const w = adv * (n - 1); for (let i = 0; i < n; i++) put(str[i], 20 - w / 2 + i * adv, cy + sz * 0.36 * sy + (lay === 'stair' ? (i - 1) * 3 : 0), sz, sx, sy); } }
  const below = cy + (st === 'tall' ? 8 : 5);
  const star = (a: number, b: number, r: number) => { const P: number[][] = []; for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; P.push([a + Math.cos(an) * rr, b + Math.sin(an) * rr]); } poly(P, '#ffd84a'); };
  if (m.ex === 'stars') [14, 20, 26].forEach(sx2 => star(sx2 + .5, below + 1.5, 1.8));
  if (m.ex === 'bar') R(11, below, 18, 1.1, '#ffd84a');
  if (m.ex === 'tag' && m.tag) { x.font = '700 5px ' + font; const w = x.measureText(m.tag).width; R(20 - w / 2 - 2, below - 1, w + 4, 7, '#000'); x.fillStyle = '#ffd84a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(m.tag, 20, below + 2.6); }
  if (m.ex === 'edge') { x.save(); x.setLineDash([1.5, 1.5]); x.strokeStyle = '#ffd84a'; x.lineWidth = .9; x.strokeRect(.6, .6, 38.8, 30.8); x.restore(); }
}
const BASE = 16.589;
/** A logo painted as cut card: `dot` is the size of one unit of the 40 by 32 drawing at a 1280 wide desk. */
function LogoCanvas(p: { m: LogoData; dot: number; label: string; t?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const check = () => {
    const cv = ref.current; if (!cv) return;
    const fs = parseFloat(getComputedStyle(cv).fontSize) || BASE, dpr = window.devicePixelRatio || 1, k = Math.max(1, Math.round(p.dot * fs / BASE * dpr)), sig = 'm:' + JSON.stringify(p.m) + '@' + k;
    if (cv.getAttribute('data-sig') === sig) return;
    cv.width = GW * k; cv.height = GH * k; cv.style.width = (GW * k / dpr) + 'px'; cv.style.height = (GH * k / dpr) + 'px';
    const x = cv.getContext('2d'); if (!x) return;
    x.clearRect(0, 0, cv.width, cv.height); x.save(); x.scale(k, k);
    try { paintLogo(x, p.m, getComputedStyle(cv).fontFamily || 'sans-serif'); } catch (e) { /* a logo that cannot be painted is not worth a crash */ }
    x.restore(); cv.setAttribute('data-sig', sig); cv.setAttribute('data-w', String(GW)); cv.setAttribute('data-h', String(GH)); cv.setAttribute('data-dot', String(k)); logoPaints++;
  };
  const latest = useRef(check); latest.current = check;
  useLayoutEffect(() => { check(); });
  useEffect(() => { const off = onBoardResize(() => latest.current()); const f = (document as any).fonts; if (f && f.ready) f.ready.then(() => { const cv = ref.current; if (cv) cv.removeAttribute('data-sig'); latest.current(); }); return off; }, []);
  return <span class="ledb logo hand"><canvas ref={ref} width={1} height={1} role="img" aria-label={p.label} {...dataAttrs(p.t)} /></span>;
}

/** A company's logo. `of` is a company (in a game or in a world package) or a logo itself.
    size: 'chip' is the letters on the company's colour; 'badge' is the logo in lights; 'board' is the same, larger. `dot` sets the size of a light yourself. */
export function Logo(p: { of: any; size?: 'chip' | 'badge' | 'board'; dot?: number; label?: string; t?: string }) {
  const m: LogoData = p.of && p.of.l && p.of.sh && p.of.c1 ? p.of : E.logoOf(p.of), size = p.size || 'badge';
  const say = p.label || ((p.of && (p.of.full || p.of.full_name || p.of.name)) ? 'The logo of ' + (p.of.full || p.of.full_name || p.of.name) : 'The logo ' + m.l);
  if (size === 'chip') return <span class="mkchip" role="img" aria-label={say} style={{ background: m.sh === 'none' ? '#000000' : m.c1, color: m.c3, borderColor: m.c2 }} {...dataAttrs(p.t)}>{m.l}</span>;
  return <LogoCanvas m={m} dot={p.dot || (size === 'board' ? 4 : 2)} label={say} t={p.t} />;
}
