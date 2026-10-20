/* Backdrops: the wall behind a scene, made in Create a Scene's Backdrop tab (Ryan, 19 October: "there will also be a
   background creator"). A backdrop is plain data kept in the world like a scene: a wall colour, a floor colour and up
   to 40 parts (banners, signs, windows, a door, curtains, a skyline, a stripe, a row of lights, a big screen, a plant).
   A scene stands in front of one when its set is "bg_" and the backdrop's id. It is drawn as the set's own pieces, so
   the flat renderer and the 3D one (a painted flat) both show it. */
import { Pt, Piece, PAL, shade, ell, star, snip } from './paper';

export interface BgPart { k: string; x: number; y: number; w: number; h: number; col: string; col2?: string; txt?: string }
export interface Backdrop { v: 1; id: string; name: string; wall: string; floor: string; parts: BgPart[] }

/** The parts a backdrop can have, with the size each starts at and whether it takes words. */
export const BG_PARTS: [string, string, number, number, boolean][] = [['banner', 'A banner', 6, 1.2, true], ['sign', 'A sign', 2.4, 1, true], ['screen', 'A big screen', 5, 2.8, true], ['poster', 'A poster', 1.4, 2, false],
  ['window', 'A window', 2.2, 2, false], ['door', 'A door', 1.6, 3.2, false], ['curtain', 'Curtains', 4, 4.5, false], ['skyline', 'A city skyline', 16, 3, false], ['stripe', 'A stripe along the wall', 22, 0.5, false],
  ['lights', 'A row of lights', 10, 0.3, false], ['plant', 'A potted plant', 1, 1.6, false]];
/** Colours a backdrop is cut from. */
export const BG_COLS: [string, string][] = [['#2d3166', 'Navy'], ['#3b3f6b', 'Slate blue'], ['#5c2430', 'Maroon'], ['#c2342b', 'Red'], ['#d9a338', 'Gold'], ['#2f6b46', 'Green'], ['#2b6f8a', 'Teal'],
  ['#6a4a2e', 'Wood'], ['#8c8f99', 'Concrete'], ['#e8dcc0', 'Cream'], ['#f3f1ea', 'White'], ['#18181c', 'Black'], ['#6b3a7a', 'Purple'], ['#e07a2e', 'Orange']];
export const WALL_TOP = FOOT_LINE() + 0.3;   // where the wall meets the floor, just behind where feet stand
function FOOT_LINE() { return -2.9; }

/** A new backdrop with a plain wall and floor. */
export function newBackdrop(): Backdrop { return { v: 1, id: 'bg' + Date.now().toString(36), name: 'My backdrop', wall: '#3b3f6b', floor: '#6a4a2e', parts: [] }; }
/** A part as it starts when added. */
export function newPart(k: string, txt?: string): BgPart {
  const d = BG_PARTS.find(x => x[0] === k) || BG_PARTS[0];
  const y = k === 'stripe' ? 0.5 : k === 'lights' ? 3.6 : k === 'skyline' ? WALL_TOP + d[3] / 2 : k === 'door' || k === 'plant' ? WALL_TOP + d[3] / 2 : 1.4;
  return { k, x: 0, y, w: d[2], h: d[3], col: k === 'sign' ? '#f3f1ea' : k === 'screen' ? '#18181c' : k === 'skyline' ? '#18181c' : k === 'lights' ? '#d9a338' : k === 'plant' ? '#2f6b46' : '#c2342b', txt: d[4] ? (txt || (k === 'screen' ? 'LIVE' : 'EWF')) : undefined };
}

/* where the backdrops come from: the world being edited, or the game's world */
let source: () => Backdrop[] = () => [];
/** Say where backdrops are found; returns a function that puts the old source back. */
export function useBackdropSource(fn: () => Backdrop[]): () => void { const old = source; source = fn; return () => { source = old; }; }
export function backdropOf(id: string): Backdrop | undefined { try { return source().find(b => b.id === id); } catch (e) { return undefined; } }
export const isBg = (set: string) => set.indexOf('bg_') === 0;
/** A key for caches of a set: a backdrop's key changes whenever the backdrop does. */
export function setKey(set: string): string {
  if (!isBg(set)) return set; const b = backdropOf(set.slice(3)); if (!b) return set;
  const j = JSON.stringify(b); let h = 0; for (let i = 0; i < j.length; i++) h = (h * 31 + j.charCodeAt(i)) | 0; return set + ':' + h;
}

const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
/** The backdrop as pieces of the set, behind everything. */
export function bgPieces(b: Backdrop | undefined): Piece[] {
  const o: Piece[] = []; let n = 0;
  const add = (pts: Pt[], col: string, z: number, lift = 0.04, rough = 0.012) => o.push({ pts: snip(pts, 7000 + (n++) * 131, rough, 0.1), col, z, lift, layer: 'back' });
  const text = (s: string, x: number, y: number, size: number, col: string, z: number) => o.push({ pts: [], col: '', z, txt: { s, x, y, size, col }, layer: 'back' } as Piece);
  const wall = b ? b.wall : '#3b3f6b', floor = b ? b.floor : '#6a4a2e';
  add(rect(-12, WALL_TOP, 24, 12), wall, -0.95, 0, 0.004);
  add(rect(-12, -8, 24, 8 + WALL_TOP), floor, -0.94, 0, 0.004);
  add(rect(-12, WALL_TOP - 0.05, 24, 0.22), shade(wall, 0.6), -0.93, 0.01, 0.004);   // the skirting
  if (!b) return o;
  b.parts.forEach((q, i) => {
    const z = -0.74 + i * 0.004, x0 = q.x - q.w / 2, y0 = q.y - q.h / 2, c = q.col, c2 = q.col2 || shade(c, 0.6);
    if (q.k === 'banner') { add(rect(x0, y0, q.w, q.h), c, z); add(rect(x0, y0, q.w, 0.12), c2, z + 0.001, 0.01, 0.004); add(rect(x0, y0 + q.h - 0.12, q.w, 0.12), c2, z + 0.001, 0.01, 0.004);
      if (q.txt) text(q.txt, q.x, q.y, Math.min(q.h * 0.6, q.w / Math.max(2, q.txt.length * 0.62)), PAL.white, z + 0.002); }
    else if (q.k === 'sign') { add(rect(x0, y0, q.w, q.h), c, z); add(rect(x0 + 0.08, y0 + 0.08, q.w - 0.16, q.h - 0.16), shade(c, 0.94), z + 0.001, 0.01, 0.004);
      if (q.txt) text(q.txt, q.x, q.y, Math.min(q.h * 0.55, q.w / Math.max(2, q.txt.length * 0.62)), PAL.red, z + 0.002); }
    else if (q.k === 'screen') { add(rect(x0 - 0.15, y0 - 0.15, q.w + 0.3, q.h + 0.3), '#2a2a30', z); add(rect(x0, y0, q.w, q.h), c, z + 0.001, 0.01);
      add(rect(x0 + 0.1, y0 + 0.1, q.w - 0.2, q.h - 0.2), shade('#2b6f8a', 0.55), z + 0.002, 0.01, 0.004);
      if (q.txt) text(q.txt, q.x, q.y, Math.min(q.h * 0.4, q.w / Math.max(2, q.txt.length * 0.62)), PAL.yellow, z + 0.003); }
    else if (q.k === 'poster') { add(rect(x0, y0, q.w, q.h), c, z); add(rect(x0 + 0.12, y0 + q.h * 0.35, q.w - 0.24, q.h * 0.55), shade(c, 1.4), z + 0.001, 0.01, 0.004); add(star(q.x, y0 + q.h * 0.62, Math.min(q.w, q.h) * 0.18, 5, 0.45), PAL.yellow, z + 0.002, 0.01, 0.003); }
    else if (q.k === 'window') { add(rect(x0, y0, q.w, q.h), c2, z); add(rect(x0 + 0.12, y0 + 0.12, q.w - 0.24, q.h - 0.24), '#9fc4dc', z + 0.001, 0.01, 0.004);
      add(rect(q.x - 0.05, y0 + 0.12, 0.1, q.h - 0.24), c2, z + 0.002, 0.01, 0.003); add(rect(x0 + 0.12, q.y - 0.05, q.w - 0.24, 0.1), c2, z + 0.002, 0.01, 0.003); }
    else if (q.k === 'door') { add(rect(x0, y0, q.w, q.h), c, z); add(rect(x0 + 0.15, y0 + q.h * 0.55, q.w - 0.3, q.h * 0.35), shade(c, 0.82), z + 0.001, 0.01, 0.004); add(ell(x0 + q.w - 0.25, q.y, 0.07, 0.07, 8), PAL.gold, z + 0.002, 0.01, 0.002); }
    else if (q.k === 'curtain') { const k = Math.max(3, Math.round(q.w / 0.5)); for (let j = 0; j < k; j++) add(rect(x0 + j * q.w / k, y0, q.w / k + 0.02, q.h), j % 2 ? c : shade(c, 0.78), z + j * 0.0001, 0.02, 0.01); add(rect(x0 - 0.1, y0 + q.h - 0.25, q.w + 0.2, 0.25), c2, z + 0.002, 0.02, 0.004); }
    else if (q.k === 'skyline') { let s = 11 + i * 7; const r01 = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; let x = x0;
      while (x < x0 + q.w) { const bw = 0.6 + r01() * 1.2, bh = q.h * (0.35 + r01() * 0.65); add(rect(x, y0, bw, bh), shade(c, 0.85 + r01() * 0.3), z, 0.01, 0.004);
        for (let wy = y0 + 0.3; wy < y0 + bh - 0.3; wy += 0.4) for (let wx = x + 0.15; wx < x + bw - 0.2; wx += 0.3) if (r01() < 0.45) add(rect(wx, wy, 0.12, 0.16), '#f2d36b', z + 0.001, 0.005, 0.002);
        x += bw + 0.05; } }
    else if (q.k === 'stripe') add(rect(x0, y0, q.w, q.h), c, z, 0.01, 0.006);
    else if (q.k === 'lights') { add(rect(x0, q.y - 0.02, q.w, 0.04), '#2a2a30', z, 0.005, 0.002); const k = Math.max(2, Math.round(q.w / 0.6)); for (let j = 0; j <= k; j++) add(ell(x0 + j * q.w / k, q.y - 0.12, q.h * 0.5, q.h * 0.6, 10), c, z + 0.001, 0.01, 0.003); }
    else if (q.k === 'plant') { add([[q.x - q.w * 0.3, y0], [q.x + q.w * 0.3, y0], [q.x + q.w * 0.38, y0 + q.h * 0.35], [q.x - q.w * 0.38, y0 + q.h * 0.35]], '#8a4a2a', z + 0.002, 0.02, 0.006);
      for (let j = 0; j < 7; j++) { const a = Math.PI * (0.15 + 0.7 * j / 6); add(ell(q.x + Math.cos(a) * q.w * 0.35, y0 + q.h * 0.55 + Math.sin(a) * q.h * 0.3, q.w * 0.22, q.h * 0.18, 10), j % 2 ? c : shade(c, 0.8), z + 0.001, 0.02, 0.01); } }
  });
  return o;
}
