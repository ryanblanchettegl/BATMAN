/* Lights: pictures and lettering in round lit dots on a black board, set inside a grey window
   (docs/plans/art-direction.md, section 4; Ryan picked this look on 6 October).

   Rules for using them:
   - Lights are for moments and headlines: a show's name, NEW CHAMPION, a countdown. Never for text the player has to
     read to play. Whatever is in lights is also in plain text nearby, or in the board's label.
   - A picture is a function that paints a small 64 by 48 grid. Lettering is a five by seven face held as data. One
     routine turns either into lights. Nothing here is an image file (rule 2).
   - A board is drawn once and kept. It is drawn again only when what it shows changes, or when the type size changes
     the size of a light. */
import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { dataAttrs } from './index';

type Cell = [number, number, number] | null;            // the colour of a lit light, or null for one that is off
interface Board { w: number; h: number; cells: Cell[] }

/* ---------- pictures: 64 by 48, painted by code ---------- */
const GW = 64, GH = 48;
interface Brush {
  x: CanvasRenderingContext2D;
  R: (a: number, b: number, w: number, h: number, col: string) => void;                       // a rectangle
  L: (a: number, b: number, c: number, d: number, col: string, w?: number) => void;           // a line
  C: (a: number, b: number, r: number, col: string) => void;                                   // a circle
  E: (a: number, b: number, rx: number, ry: number, col: string) => void;                      // an ellipse
  P: (pts: number[][], col: string) => void;                                                   // a filled shape
}
const PICS: Record<string, { n: string; paint: (b: Brush) => void }> = {
  ring: { n: 'The ring', paint: ({ R, L, C, E, P }) => {
    for (let i = 0; i < 8; i++) C(5 + i * 7.7, 2, 1.1, i % 2 ? '#55ffff' : '#ffff55');                                     // the lights over the ring
    P([[10, 24], [54, 24], [61, 35], [3, 35]], '#b8c4d0'); E(32, 29.5, 7, 3, '#55ffff'); E(32, 29.5, 4, 1.6, '#0000aa');   // the canvas and its mark
    P([[3, 35], [61, 35], [61, 43], [3, 43]], '#aa0000'); R(3, 35, 59, 1, '#ffffff'); R(22, 38, 20, 2, '#ffff55'); R(6, 44, 53, 1, '#555555');   // the apron
    R(9, 9, 2, 15, '#aaaaaa'); R(53, 9, 2, 15, '#aaaaaa'); [12, 16, 20].forEach(y => R(11, y, 42, 1, '#ffffff'));            // the far posts and ropes
    [[12, 17], [16, 22], [20, 27]].forEach(p => { L(10, p[0], 3, p[1], '#dddddd', 1); L(54, p[0], 61, p[1], '#dddddd', 1); });
    R(2, 14, 3, 22, '#cccccc'); R(59, 14, 3, 22, '#cccccc'); [17, 22, 27].forEach(y => R(5, y, 54, 1, '#ff5555'));           // the near posts and ropes
    R(2, 12, 3, 3, '#ffff55'); R(59, 12, 3, 3, '#ffff55'); R(9, 7, 2, 2, '#ffff55'); R(53, 7, 2, 2, '#ffff55');
  } },
  bell: { n: 'The bell', paint: ({ x, R, L, C, P }) => {
    R(18, 3, 28, 2, '#aaaaaa'); R(30, 5, 4, 6, '#aaaaaa');
    x.fillStyle = '#c9a400'; x.beginPath(); x.arc(32.5, 22.5, 11, Math.PI, 0); x.fill();
    R(21, 22, 23, 9, '#c9a400'); P([[21, 31], [43, 31], [47, 36], [17, 36]], '#c9a400'); R(17, 35, 31, 2, '#fff36b'); R(25, 15, 2, 15, '#fff36b');
    C(32, 39.5, 2.6, '#aaaaaa'); L(44, 45, 56, 31, '#aa5500', 2); R(52, 24, 10, 6, '#cccccc'); R(52, 24, 10, 1, '#ffffff');   // the clapper and the hammer
    [[50, 13, 54, 10], [52, 19, 58, 18], [13, 13, 9, 10], [11, 19, 5, 18]].forEach(p => L(p[0], p[1], p[2], p[3], '#ffff55', 1));   // it is ringing
  } },
  belt: { n: 'The belt', paint: ({ R, C, E, P }) => {
    R(2, 20, 60, 9, '#7a4a12'); R(2, 20, 60, 1, '#aa6a22'); R(2, 28, 60, 1, '#553008');
    [4, 7].forEach(a => { C(a, 24, .9, '#cccccc'); C(62 - a, 24, .9, '#cccccc'); });
    [11, 43].forEach(a => { R(a, 16, 10, 17, '#c9a400'); R(a + 1, 17, 8, 15, '#fff36b'); R(a + 2, 18, 6, 13, '#c9a400'); C(a + 4.5, 24, 1.6, '#55ffff'); });
    P([[26, 11], [28, 6], [32, 10], [36, 6], [38, 11]], '#fff36b'); E(32, 24.5, 12, 14, '#fff36b'); E(32, 24.5, 10.5, 12.5, '#c9a400'); E(32, 24.5, 7, 8.5, '#806000');
    C(32, 24.5, 3.4, '#ff5555'); C(31, 23.5, 1, '#ffffff');
  } }
};
export type LightPicName = 'ring' | 'bell' | 'belt';
/** The pictures there are, with a plain name for each. */
export const LIGHT_PICS: { id: LightPicName; n: string }[] = (Object.keys(PICS) as LightPicName[]).map(id => ({ id, n: PICS[id].n }));

const picCache: Record<string, Board> = {};
/** Paint a picture on its small grid and read it back as lights. A cell that is mostly covered and not near black is lit. */
function picBoard(name: string): Board | null {
  if (picCache[name]) return picCache[name];
  const pic = PICS[name]; if (!pic) return null;
  const c = document.createElement('canvas'); c.width = GW; c.height = GH;
  const x = c.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null; if (!x) return null;
  const B: Brush = { x,
    R: (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); },
    L: (a, b, c2, d, col, w) => { x.strokeStyle = col; x.lineWidth = w || 1; x.lineCap = 'round'; x.beginPath(); x.moveTo(a + .5, b + .5); x.lineTo(c2 + .5, d + .5); x.stroke(); },
    C: (a, b, r, col) => { x.fillStyle = col; x.beginPath(); x.arc(a + .5, b + .5, r, 0, 7); x.fill(); },
    E: (a, b, rx, ry, col) => { x.fillStyle = col; x.beginPath(); x.ellipse(a + .5, b + .5, rx, ry, 0, 0, 7); x.fill(); },
    P: (pts, col) => { x.fillStyle = col; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0] + .5, p[1] + .5) : x.moveTo(p[0] + .5, p[1] + .5)); x.closePath(); x.fill(); } };
  pic.paint(B);
  const d = x.getImageData(0, 0, GW, GH).data, cells: Cell[] = [];
  for (let i = 0; i < GW * GH; i++) {
    const a = d[i * 4 + 3] / 255, k = Math.min(1, a * 1.05), r = Math.round(d[i * 4] * k), g = Math.round(d[i * 4 + 1] * k), b = Math.round(d[i * 4 + 2] * k);
    cells.push(a > .28 && d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2] > 60 ? [r, g, b] : null);
  }
  return (picCache[name] = { w: GW, h: GH, cells });
}

/* ---------- lettering: a five by seven face, one light a pixel ---------- */
/* Each letter is seven rows of five lights, a row as two hex digits. The game's own typeface does not survive being
   turned into dots at this size, so the board has a face of its own. */
const FACE: Record<string, string> = {
  A: '0E11111F111111', B: '1E11111E11111E', C: '0E11101010110E', D: '1E11111111111E', E: '1F10101E10101F', F: '1F10101E101010', G: '0E11101711110F',
  H: '1111111F111111', I: '0E04040404040E', J: '0702020202120C', K: '11121418141211', L: '1010101010101F', M: '111B1515111111', N: '11111915131111',
  O: '0E11111111110E', P: '1E11111E101010', Q: '0E11111115120D', R: '1E11111E141211', S: '0F10100E01011E', T: '1F040404040404', U: '1111111111110E',
  V: '11111111110A04', W: '1111111515150A', X: '11110A040A1111', Y: '1111110A040404', Z: '1F01020408101F',
  0: '0E11131519110E', 1: '040C040404040E', 2: '0E11010204081F', 3: '1F02040201110E', 4: '02060A121F0202', 5: '1F101E0101110E', 6: '0608101E11110E',
  7: '1F010204080808', 8: '0E11110E11110E', 9: '0E11110F01020C',
  ' ': '00000000000000', '.': '00000000000C0C', ',': '000000000C0408', ':': '000C0C000C0C00', '·': '0000000C0C0000', '-': '0000001F000000', '+': '0004041F040400',
  '!': '04040404040004', '?': '0E110102040004', "'": '0C040800000000', '’': '0C040800000000', '$': '040F140E051E04', '&': '0C12140815120D', '/': '00010204081000',
  '%': '18190204081303', '★': '04041F0E0E1B11', '▲': '0004040E0E1F00', '▼': '001F0E0E040400', '►': '080C0E0F0E0C08', '♥': '000A1F1F0E0400'
};
function rgb(hex: string): [number, number, number] { const n = parseInt(hex.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
/** A line of lettering as lights: a one-light edge all round, and one dark column between letters. `parts` are pieces of text, each in its own colour. */
function textBoard(parts: [string, string][]): Board {
  const chars: [string, [number, number, number]][] = [];
  parts.forEach(p => { const col = rgb(p[1]); Array.from(String(p[0]).toUpperCase()).forEach(ch => chars.push([FACE[ch] ? ch : ' ', col])); });
  const w = chars.length * 6 + 1, h = 9, cells: Cell[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ci = Math.floor((x - 1) / 6), cx = (x - 1) % 6;
    if (x < 1 || cx > 4 || y < 1 || y > 7 || !chars[ci]) { cells.push(null); continue; }
    const row = parseInt(FACE[chars[ci][0]].substr((y - 1) * 2, 2), 16);
    cells.push((row >> (4 - cx)) & 1 ? chars[ci][1] : null);
  }
  return { w, h, cells };
}

/* ---------- one routine turns a board into lights on a canvas ---------- */
const BASE_FS = 20.736;   // the type size the dot sizes are given for (a 1280 wide desk)
let draws = 0;
/** How many times any board has been drawn since the page loaded. A test watches it: a board is drawn once and kept. */
export function lightDraws(): number { return draws; }
function drawBoard(cv: HTMLCanvasElement, B: Board, p: number, dpr: number) {
  cv.width = B.w * p; cv.height = B.h * p; cv.style.width = (B.w * p / dpr) + 'px'; cv.style.height = (B.h * p / dpr) + 'px';
  const x = cv.getContext('2d'); if (!x) return;
  x.fillStyle = '#050505'; x.fillRect(0, 0, cv.width, cv.height);
  // the lights that are off first, all in one go, then each lit one with its own glow
  x.fillStyle = '#161616'; x.beginPath();
  for (let i = 0; i < B.cells.length; i++) if (!B.cells[i]) { const X = (i % B.w) * p + p / 2, Y = Math.floor(i / B.w) * p + p / 2; x.moveTo(X + p * .3, Y); x.arc(X, Y, p * .3, 0, 7); }
  x.fill();
  for (let i = 0; i < B.cells.length; i++) { const c = B.cells[i]; if (!c) continue;
    const X = (i % B.w) * p + p / 2, Y = Math.floor(i / B.w) * p + p / 2, col = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    x.shadowBlur = p * .9; x.shadowColor = col; x.fillStyle = col; x.beginPath(); x.arc(X, Y, p * .42, 0, 7); x.fill(); }
  x.shadowBlur = 0;
  draws++;
}
/* boards on the page check their size again when the window changes size, because the type size sets the size of a light */
const live = new Set<() => void>();
let wired = false;
function wire() { if (wired) return; wired = true; let t: any = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => live.forEach(fn => fn()), 60); }); }

/** A canvas that shows a board. `dot` is the size of one light, in pixels at a 1280 wide desk; it grows with the type size and is always a whole number of screen pixels. */
function BoardCanvas(p: { sig: string; make: () => Board | null; dot: number; label: string; t?: string; cls?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const check = () => {
    const cv = ref.current; if (!cv) return;
    const fs = parseFloat(getComputedStyle(cv).fontSize) || BASE_FS, dpr = window.devicePixelRatio || 1, px = Math.max(1, Math.round(p.dot * fs / BASE_FS * dpr)), sig = p.sig + '@' + px;
    if (cv.getAttribute('data-sig') === sig) return;
    let B: Board | null = null; try { B = p.make(); } catch (e) { B = null; }   // a board that cannot be drawn is not worth a crash
    if (!B) return;
    try { drawBoard(cv, B, px, dpr); cv.setAttribute('data-sig', sig); cv.setAttribute('data-w', String(B.w)); cv.setAttribute('data-h', String(B.h)); cv.setAttribute('data-dot', String(px)); } catch (e) { /* ignore */ }
  };
  const latest = useRef(check); latest.current = check;
  useLayoutEffect(() => { check(); });   // before the page is painted, so a board never shows at the wrong size
  useEffect(() => { wire(); const fn = () => latest.current(); live.add(fn); return () => { live.delete(fn); }; }, []);
  return <span class={'ledb' + (p.cls ? ' ' + p.cls : '')}><canvas ref={ref} width={1} height={1} role="img" aria-label={p.label} {...dataAttrs(p.t)} /></span>;
}

/** Lettering in lights: a headline, a show's name, a count. `text` is a string, or pieces each with its own colour.
    The words are also the board's label, so a screen reader and a test can read them. */
export function LightText(p: { text: string | [string, string][]; color?: string; dot?: number; label?: string; t?: string }) {
  const parts: [string, string][] = typeof p.text === 'string' ? [[p.text, p.color || '#ffff55']] : p.text, words = parts.map(x => x[0]).join('');
  return <BoardCanvas sig={'t:' + JSON.stringify(parts)} make={() => textBoard(parts)} dot={p.dot || 2} label={p.label || words} t={p.t} cls="txt" />;
}
/** A picture in lights: the ring, the bell or the belt. */
export function LightPic(p: { name: LightPicName; dot?: number; label?: string; t?: string }) {
  return <BoardCanvas sig={'p:' + p.name} make={() => picBoard(p.name)} dot={p.dot || 2} label={p.label || (PICS[p.name] ? PICS[p.name].n + ', in lights' : 'A picture in lights')} t={p.t} />;
}
