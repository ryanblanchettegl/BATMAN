/* Style C, the human paper doll (Bill, 29 October: "it should look exactly like the concept art and nothing like
   the old art"). This is the drawing code of the concept page (Research/tools/concepts/characters.html?v=human),
   moved into the game: the same proportions, the same head and face parts, the same cuts, pads, fists and boots.
   The concept drew one standing figure as SVG; here every part is cut in the frame of the doll's own joint, so the
   doll still poses for every scene, and every shape becomes an ordinary piece of card (a polygon), so the rim, the
   shadow, picking and the 3D stage all work on it as before. The concept's sizes are in its own pixels: a head is
   `HU` of them, a whole figure `T`. It only reads the game. */
import { Pt, Piece, shade, ell } from './paper';
import { Swatch, layerSwatch, letters, shape } from './caw';
import type { Recipe, Place, Rig, Marks } from './puppet';
import { STAND, legs, LEGS0, beltPieces } from './puppet';

/* ---------- the concept's numbers ---------- */
const HU = 48.5, T = 330;   // a head and a whole figure, in the concept's pixels (6.8 heads)
/** Game units per head: a figure is about 6.8 heads tall on the game's legs and trunk. */
export const GH = 0.9;
const hashS = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const rngOf = (s: string) => { let x = hashS(s) || 1; return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507), x = Math.imul(x ^ (x >>> 13), 3266489909), (x ^= x >>> 16) >>> 0) / 4294967296); };
type R = () => number;
/** Rounds every corner into two cuts. */
function more(pts: Pt[], k = 0.035): Pt[] {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length, o: Pt[] = [];
  pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], m: Pt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; o.push(p, [m[0] + (m[0] - cx) * k, m[1] + (m[1] - cy) * k]); });
  return o;
}
/** A scissor cut: each corner a little off, and now and then a small notch in the longest side (never on a face). */
function cut(pts: Pt[], r: R, notch = true): Pt[] {
  const o: Pt[] = pts.map(([x, y]) => [x + (r() - 0.5) * 0.6, y + (r() - 0.5) * 0.6]);
  if (r() < 0.34 && o.length > 3 && notch) {
    let bi = 0, bl = 0; o.forEach((p, i) => { const q = o[(i + 1) % o.length], l = Math.hypot(q[0] - p[0], q[1] - p[1]); if (l > bl) { bl = l; bi = i; } });
    if (bl > 18) { const p = o[bi], q = o[(bi + 1) % o.length], t = 0.3 + r() * 0.4, nx = -(q[1] - p[1]) / bl, ny = (q[0] - p[0]) / bl, d = 2 + r() * 2, w = 0.03 * bl;
      o.splice(bi + 1, 0, [p[0] + (q[0] - p[0]) * (t - w / bl), p[1] + (q[1] - p[1]) * (t - w / bl)], [p[0] + (q[0] - p[0]) * t + nx * d, p[1] + (q[1] - p[1]) * t + ny * d], [p[0] + (q[0] - p[0]) * (t + w / bl), p[1] + (q[1] - p[1]) * (t + w / bl)]); }
  }
  return o;
}
function seg(a: Pt, b: Pt, wa: number, wb: number): Pt[] {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ux = dx / L, uy = dy / L;
  return [[a[0] + nx * wa - ux * wa * 0.3, a[1] + ny * wa - uy * wa * 0.3], [a[0] - nx * wa - ux * wa * 0.3, a[1] - ny * wa - uy * wa * 0.3], [b[0] - nx * wb, b[1] - ny * wb], [b[0] + ux * wb * 0.4, b[1] + uy * wb * 0.4], [b[0] + nx * wb, b[1] + ny * wb]];
}
/** A shin with a calf and a notch at the knee. */
function shin(k: Pt, f: Pt, w: number, sd: number): Pt[] {
  const dx = f[0] - k[0], dy = f[1] - k[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * sd, ny = dx / L * sd, at = (t: number, s: number): Pt => [k[0] + dx * t + nx * w * s, k[1] + dy * t + ny * w * s];
  return [at(-0.04, -0.95), at(0, 0.95), [k[0] + dx * 0.06 + nx * w * 0.75, k[1] + dy * 0.06 + ny * w * 0.75], at(0.12, 0.92), at(0.35, 1.2), at(0.6, 0.95), at(1, 0.68), at(1, -0.68), at(0.6, -0.9), at(0.35, -1.1), at(0.06, -0.9)];
}
const UA = [[0, 1, 1], [0.28, 1.12, 1.04], [0.5, 1.18, 1.0], [0.78, 0.98, 0.93], [1, 0.86, 0.84]], FA = [[0, 1, 1], [0.22, 1.16, 1.04], [0.5, 0.97, 0.9], [0.82, 0.76, 0.76], [1, 0.7, 0.7]], TH = [[0, 1, 1], [0.2, 1.16, 1.0], [0.45, 1.2, 1.04], [0.7, 1.0, 0.97], [0.9, 0.86, 0.86], [1, 0.82, 0.82]];
function limb(a: Pt, b: Pt, w0: number, w1: number, f: number[][]): Pt[] {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, ux = dx / L, uy = dy / L, W = (t: number) => w0 + (w1 - w0) * t, P = (t: number, k: number): Pt => [a[0] + dx * t + nx * W(t) * k, a[1] + dy * t + ny * W(t) * k];
  return ([[a[0] - ux * w0 * 0.3, a[1] - uy * w0 * 0.3]] as Pt[]).concat(f.map(([t, k]) => P(t, k)), [[b[0] + ux * w1 * 0.35, b[1] + uy * w1 * 0.35]] as Pt[], f.slice().reverse().map(([t, , k]) => P(t, -k)));
}

/* ---------- a pen: the concept's shapes, cut as pieces of card in a joint's frame ---------- */
type F = { x: number; y: number; a: number };
const rot = (p: Pt, a: number): Pt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
/** Points along an SVG path (M L Q Z and their small letters, all the concept uses), one list for each line drawn. */
function pathPts(d: string): { pts: Pt[]; closed: boolean }[] {
  const tk = d.match(/[MmLlQqZz]|-?\d*\.?\d+(?:e-?\d+)?/g) || [], out: { pts: Pt[]; closed: boolean }[] = [];
  let i = 0, cmd = 'M', cx = 0, cy = 0, cur: { pts: Pt[]; closed: boolean } | null = null;
  const num = () => parseFloat(tk[i++]);
  while (i < tk.length) {
    if (/[A-Za-z]/.test(tk[i])) cmd = tk[i++];
    if (cmd === 'Z' || cmd === 'z') { if (cur) cur.closed = true; cmd = 'M'; continue; }
    if (cmd === 'M' || cmd === 'm') { const x = num(), y = num(); cx = cmd === 'm' ? cx + x : x; cy = cmd === 'm' ? cy + y : y; cur = { pts: [[cx, cy]], closed: false }; out.push(cur); cmd = cmd === 'm' ? 'l' : 'L'; continue; }
    if (cmd === 'L' || cmd === 'l') { const x = num(), y = num(); cx = cmd === 'l' ? cx + x : x; cy = cmd === 'l' ? cy + y : y; cur!.pts.push([cx, cy]); continue; }
    if (cmd === 'Q' || cmd === 'q') {
      let qx = num(), qy = num(), x = num(), y = num(); if (cmd === 'q') { qx += cx; qy += cy; x += cx; y += cy; }
      for (let s = 1; s <= 8; s++) { const t = s / 8, u = 1 - t; cur!.pts.push([u * u * cx + 2 * u * t * qx + t * t * x, u * u * cy + 2 * u * t * qy + t * t * y]); }
      cx = x; cy = y; continue;
    }
    i++;
  }
  return out;
}
/** A line of this width along points, as a strip of card. */
function strokePts(p: Pt[], w: number): Pt[] {
  if (p.length < 2) return [];
  const L: Pt[] = [], Rr: Pt[] = [], h = w / 2;
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * h, ny = dx / l * h;
    L.push([p[i][0] + nx, p[i][1] + ny]); Rr.push([p[i][0] - nx, p[i][1] - ny]);
  }
  return L.concat(Rr.reverse());
}
class Pen {
  n = 0; m: number[] = [1, 0, 0, 1, 0, 0];   // the group's own turn and shift, in the concept's pixels
  constructor(public f: F, public k: number, public fx: (x: number) => number, public z: number, public out: Piece[], public own: string, public joint: string) {}
  /** From the concept's pixels in this frame to the scene. */
  w([x, y]: Pt): Pt { const m = this.m, X = m[0] * x + m[2] * y + m[4], Y = m[1] * x + m[3] * y + m[5], d = rot([X * this.k, -Y * this.k], this.f.a); return [this.fx(this.f.x + d[0]), this.f.y + d[1]]; }
  /** Draw inside a group shifted to (tx, ty) and turned by deg (the concept's translate and rotate). */
  group(tx: number, ty: number, deg: number, fn: () => void) { const m0 = this.m, c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180);
    this.m = [m0[0] * c + m0[2] * s, m0[1] * c + m0[3] * s, -m0[0] * s + m0[2] * c, -m0[1] * s + m0[3] * c, m0[0] * tx + m0[2] * ty + m0[4], m0[1] * tx + m0[3] * ty + m0[5]]; fn(); this.m = m0; }
  /** Turn by deg round (cx, cy), the concept's rotate(deg cx cy). */
  turn(deg: number, cx: number, cy: number, fn: () => void) { this.group(cx, cy, deg, () => this.group(-cx, -cy, 0, fn)); }
  poly(pts: Pt[], col: string, edge?: string) { if (pts.length < 3) return; this.out.push({ pts: pts.map(p => this.w(p)), col, z: this.z + (this.n++) * 1e-5, lift: 0.02, own: this.own, joint: this.joint, ln: edge }); }
  path(d: string, col: string) { for (const s of pathPts(d)) this.poly(s.pts, col); }
  stroke(d: string, w: number, col: string) { for (const s of pathPts(d)) this.poly(strokePts(s.closed ? s.pts.concat([s.pts[0]]) : s.pts, w), col); }
  ell(cx: number, cy: number, rx: number, ry: number, col: string) { this.poly(ell(cx, cy, rx, ry, 18), col); }
}

/* ---------- the concept's parameters for a wrestler in the game ---------- */
interface Hd { es2?: number; eg?: number; nose?: string; nw?: number; nl?: number; mw?: number; bt?: number; cr: string; crw: number; jaw: string; jw: number; len: number; eye: string; ey: number; et: number; brow: string; mouth: string; ear: number; es?: number; bu?: number; cheek?: number; lip?: string; shadow?: string; freck?: number; bags?: number; scar?: number; jowl?: number; adam?: number }
export interface Look { skin: string; hc: string; hair: string; beard: string; gear: string; g2: string; boots: string; pad: string; iris: string; fem: boolean; mask?: string[]; band?: string;
  sw: number; cw: number; ww: number; hw: number; bel: number; au: number; af: number; th: number; sh: number; traps: number; abs: number; neck: number; tape: boolean; chestHair: boolean; veins: boolean; quad: boolean;
  mus?: number; braid?: boolean; build: string; hs: number; legC?: string; jeans?: boolean; top?: string; topC?: string; sleeve?: string; coat?: string; cape?: string; stripes?: boolean; tie?: string; tat?: { st: string; arm: number[]; chest: number }; hd: Hd; key: string }
/** A Create a Player swatch's colour. */
const C = (s: Swatch | string | undefined, d: string) => !s ? d : typeof s === 'string' ? s : s.c;
/** The concept's numbers for a wrestler: their build from the doll's width, belly and style; their face from the
    recipe's head shape, mood and features; their gear from what they wear. The same wrestler always gets the same. */
export function lookOf(r: Recipe, expr: string): Look {
  const h = (k: string, n: number) => hashS(r.key + '|' + k) % n, fem = r.fem, K = r.kit;
  const m = Math.max(0.75, Math.min(1.5, r.w / (fem ? 0.84 : 1))), mm = r.mm || 1, up = Math.pow(m, 2.3) * (1 + (mm - 1) * 0.5), fat = r.belly || 0;
  const base = fem ? { sw: 0.122, cw: 0.11, ww: 0.083, hw: 0.115, au: 0.028, af: 0.024, th: 0.045, sh: 0.033 } : { sw: 0.15, cw: 0.132, ww: 0.11, hw: 0.112, au: 0.038, af: 0.033, th: 0.046, sh: 0.037 };
  const tw = r.tw || 1;
  // a neck shows on everybody (Bill, 29 October)
  const tone = (c: string) => { const n = parseInt(c.slice(1), 16), v = [(n >> 16) & 255, (n >> 8) & 255, n & 255], lum = (v[0] + v[1] + v[2]) / 765, d = (h('tone', 5) - 2) * 0.035 * (lum > 0.55 ? 1 : 0.4), warm = (h('warm', 3) - 1) * 6; return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * (1 + d) + (i === 0 ? warm : i === 2 ? -warm : 0))))).map(x => x.toString(16).padStart(2, '0')).join(''); };   // light skins spread over more steps
  const L: any = { skin: tone(r.skin), hc: r.hairCol, fem, key: r.key,
    sw: base.sw * up * tw, cw: base.cw * up * tw, ww: base.ww * Math.pow(m, 1.6) + fat * 0.2, hw: base.hw * Math.pow(m, 1.1), bel: fat > 0.04 ? fat * 0.6 : 0,
    au: base.au * up, af: base.af * up, th: base.th * Math.pow(m, 1.35), sh: base.sh * Math.pow(m, 1.3), traps: fem ? 0.1 : Math.max(0, (m - 1) * 3 + 0.2),
    build: fat > 0.05 ? 'belly' : m > 1.2 ? 'heavy' : m < 0.98 ? 'skinny' : 'lean', hs: fem ? 1 : Math.max(0.9, Math.min(1.12, 0.94 + (m - 0.95) * 0.35 + fat * 0.4)),
    abs: fem || fat > 0.05 ? 0 : m < 1.05 ? 4 : m > 1.2 ? 6 : 4, neck: fem ? 0.14 : m < 1.05 ? 0.14 : m > 1.25 ? 0.08 : 0.11, tape: !!r.tape || (!!K && K.acc.indexOf('wrist_tape_white') >= 0), chestHair: (r.bodyHair || 0) > 0, veins: m > 1.2, quad: fem };
  // the face
  const hd = r.head, wide = (hd.rx - 1.04) / 0.28, sq = hd.sq >= 4, pointy = hd.chin >= 0.35;
  const crw = 0.46 + 0.12 * Math.max(0, Math.min(1, wide)) + (m > 1.2 || fat > 0.05 ? 0.05 : 0);
  const md = r.mood || 'face', sh = ['shout', 'roar', 'snarl'].indexOf(expr) >= 0, hurt = ['hurt', 'pain', 'cry', 'shut'].indexOf(expr) >= 0;
  L.hd = { cr: hd.ryt > 1.46 ? 'long' : sq && r.hair !== 'bald' ? 'bullet' : sq ? 'round' : pointy ? 'egg' : ['round', 'round', 'long', 'egg'][h('cr', 4)], crw, jaw: fat > 0.05 ? 'jowl' : sq ? (m > 1.15 ? 'anvil' : 'block') : pointy || m < 0.98 ? 'v' : hd.chin > 0.2 ? 'square' : 'round',
    jw: sq ? crw * (m > 1.15 ? 1.4 : 1.2) : pointy || m < 0.98 ? crw * 0.62 : crw * (hd.chin > 0.2 ? 0.82 : 0.78), len: Math.max(0.95, Math.min(1.3, hd.ryb / 1.6 * 1.06 * (m > 1.2 ? 1.08 : 1))),
    eye: hurt ? 'slit' : fem ? (h('ey', 2) ? 'lid' : 'lash') : md === 'fierce' ? 'slit' : md === 'cocky' ? 'lid' : ['almond', 'almond', 'almond', 'almond', 'slit', 'round'][h('ey', 6)], shadow: fem && h('ey', 2) ? ['#7a3fa0', '#2c62ad', '#a8326a', '#3a7a5a', '#8a5a2a'][h('sh', 5)] : undefined, ey: -0.03, et: md === 'fierce' || md === 'heel' ? -5 : md === 'sad' ? 6 : 2,
    brow: md === 'fierce' ? 'slab' : md === 'heel' ? 'thick' : md === 'cocky' || md === 'happy' ? (fem ? 'arch' : 'raised') : fem ? ['arch', 'thin', 'arch'][h('br', 3)] : r.brow > 0.15 ? 'thick' : ['flat', 'thick', 'thin', 'raised', 'flat'][h('br', 5)],
    mouth: sh ? 'grit' : expr === 'talk' ? 'grin' : hurt ? 'grim' : expr === 'smirk' ? 'smirk' : md === 'happy' ? 'grin' : md === 'cocky' || md === 'heel' ? 'smirk' : md === 'fierce' ? 'grim' : md === 'sad' ? 'flat' : ['grin', 'grin', 'grin', 'flat', 'flat', 'smirk', 'smirk', 'grim', 'smirk', 'wide'][h('mo', 10)],
    ear: m > 1.2 ? 1.1 : 1 + (h('ear', 5) - 2) * 0.08, cheek: fem ? 1 : 0,
    es2: 0.86 + h('es', 7) * 0.05 + ((r.fs || {}).eyeS ? (r.fs!.eyeS! - 1) : 0), eg: 0.92 + h('eg', 5) * 0.04 + ((r.fs || {}).eyeG ? (r.fs!.eyeG! - 1) * 0.5 : 0), mw: 0.84 + h('mw', 5) * 0.08 * (r.fs && r.fs.mouthW ? r.fs.mouthW : 1), bt: 1.35 + Math.min(0.2, r.brow) * 3,
    nose: (r.feat && r.feat.nose) || (r.noseW > 0.48 ? 'broad' : r.noseL > 0.6 ? 'long' : r.noseL < 0.47 ? 'button' : ['straight', 'straight', 'hook', 'small'][h('nose', 4)]), nw: 0.75 + r.noseW * 0.6, nl: 0.7 + r.noseL * 0.55, lip: fem ? ['#b8285a', '#b84a4a', '#8a2a3a', '#a03a50'][h('lip', 4)] : undefined, freck: r.freckles ? 1 : 0, scar: (r.scars || []).length ? 1 : 0, jowl: fat > 0.1 ? 1 : 0, adam: !fem && m < 1.05 ? 1 : 0 } as Hd;
  L.iris = r.eyeCol || ['#5a3a22', '#3d2a1c', '#4f6a3a', '#3f6c94', '#6b5530'][h('eye', 5)];
  L.hair = r.mask ? 'bald' : r.hair || 'cap';   // every hair style of the game, each cut in the concept's manner (headC)
  L.beard = r.mask ? 'none' : r.beard === 1 || r.beard === 9 ? 'stubble' : r.beard === 2 || r.beard === 7 ? 'goatee' : r.beard === 8 ? 'chin' : r.beard === 3 ? 'vandyke' : r.beard === 4 ? 'short' : r.beard === 5 ? 'full' : r.beard === 6 ? 'sideburns' : r.beard === 10 ? 'chinstrap' : 'none';
  if ((L.beard === 'full' || L.beard === 'short') && (L.hd.mouth === 'grin' || L.hd.mouth === 'wide')) L.hd.mouth = 'flat';   // a grin would show through the beard
  L.mus = r.mask ? 0 : r.mus || 0; L.braid = !!r.braid;
  if (L.build === 'belly') { L.bel = Math.max(L.bel, 0.03 + fat * 0.5); L.ww = Math.max(L.ww, L.cw * 1.05); L.abs = 0; }
  if (L.build === 'heavy' || L.build === 'belly') { L.ww = Math.max(L.ww, L.cw * 1.02); L.sh *= 1.25; L.abs = 0; L.bel = Math.max(L.bel, 0.02); }
  if (L.build === 'lean') L.abs = 4;
  if (fem) { L.hw *= 1.18; L.th *= 1.12; }
  if (L.build === 'skinny') { L.abs = 2; L.sw *= 0.86; L.cw *= 0.86; L.au *= 0.85; L.af *= 0.88; L.th *= 0.9; L.traps = 0; }
  if (r.mask) L.mask = [r.mask.base, r.mask.trim, r.mask.trim];
  // the gear: trunks, a top, boots and pads, in the colours of what they wear
  if (K) {
    const LONG = ['tights_long_01', 'pants_flared', 'jeans_distressed', 'trousers_suit'];
    L.gear = C(K.col.bottom, r.gear); L.g2 = C(K.pal.t, r.gear2); L.boots = K.feet === 'barefoot' || K.feet === 'kick_pads' || K.feet === 'ankle_wraps' ? r.skin : C(K.col.feet, r.gear); L.pad = C(K.pal.s, L.g2);
    if (LONG.indexOf(K.bottom) >= 0) { L.legC = C(K.col.bottom, r.gear); L.jeans = K.bottom === 'jeans_distressed' || K.bottom === 'trousers_suit'; }
    const t = K.top, top = C(K.col.top, L.gear);
    if (t === 'singlet_straps_up' || t === 'singlet_full' || t === 'top_bodysuit' || t === 'shirt_tank' || t === 'vest_tactical') { L.top = 'singlet'; L.topC = top; }
    else if (t === 'top_sports' || t === 'top_crop') { L.top = 'crop'; L.topC = top; }
    else if (t === 'coat_long' || t === 'coat_fur' || t === 'robe_long') { L.coat = top; }
    else if (t !== 'bare' && t !== 'singlet_straps_down' && t !== 'vest_open') { L.top = 'shirt'; L.topC = top; L.sleeve = t === 'shirt_tshirt_base' ? undefined : top; if (t === 'suit_jacket') L.tie = C(K.pal.t, '#c23b2a'); }
    if (K.acc.indexOf('cape') >= 0) L.cape = C(K.pal.s, L.g2);
  } else {
    L.gear = r.pants || r.gear; L.g2 = r.gear2; L.boots = r.pants ? '#1b1b1d' : r.gear; L.pad = r.gear2;
    if (r.pants) { L.legC = r.pants; L.jeans = true; }
    if (r.suit) { L.top = 'shirt'; L.topC = r.suit.jacket; L.sleeve = r.suit.jacket; L.tie = r.suit.tie; L.legC = r.suit.jacket; }
    else if (r.shirt) { L.top = 'shirt'; L.topC = r.shirt; L.sleeve = r.shirt; L.stripes = !!r.stripes; }
    else if (fem) { L.top = r.straps ? 'singlet' : 'crop'; L.topC = r.gear; }
    else if (r.straps) { L.top = 'singlet'; L.topC = r.gear; }
  }
  const tats = r.tats || [];
  if (tats.length) L.tat = { st: tats.some(t => t.indexOf('sleeve') === 0) ? 'sleeve' : 'tribal', arm: [tats.indexOf('sleeve_far') >= 0 || tats.indexOf('shoulder') >= 0 ? -1 : 0, tats.indexOf('sleeve_near') >= 0 ? 1 : 0].filter(Boolean), chest: tats.indexOf('chest') >= 0 ? 1 : 0 };
  return L as Look;
}

/* ---------- the head (the concept's headIn, style C) ---------- */
function headC(P: Pen, a: Look, hu: number, r: R, back: boolean, mk: Marks) {
  const h = a.hd, sk = a.skin, dk = shade(sk, 0.72), mkS = (d: string, w = 2.4, col = '#1b1b1d') => P.stroke(d, w, col);
  const piece = (pts: Pt[], col: string, edge?: number) => P.poly(cut(pts, r, false), col, edge === 1 ? shade(col, 0.8) : undefined);
  const nar = 0.93, len = h.len * hu * 1.02, jw = h.jw * hu * nar, crw = h.crw * hu * nar;
  const top = -len * 0.55, bot = len * 0.45, face = Math.max(crw, jw);
  const ey = h.ey * len, eg = face * 0.45 * (h.eg || 1), es = face * 0.2 * Math.pow(h.es || 1, 0.3) * (h.es2 || 1), browY = ey - face * 0.33 - (h.bu || 0) * hu, jt = browY + es * 0.2 + (h.bu || 0) * hu;
  // hair behind the head (and, seen from behind, over it)
  const behind = () => {
    const hr = a.hair;
    if (hr === 'long' && !a.fem && a.beard !== 'none') piece([[crw * 0.55, top + len * 0.1], [crw * 0.95, top + len * 0.25], [crw * 1.15, bot + hu * 0.45], [crw * 0.9, bot + hu * 0.6], [crw * 0.75, bot + hu * 0.1]], shade(a.hc, 0.9));   // with a beard: tied back in a tail, so the face and the beard have skin round them
    else if (hr === 'long' && !a.fem) piece([[-crw * 1.1, top + len * 0.2], [-crw * 0.9, top - hu * 0.05], [crw * 0.9, top - hu * 0.05], [crw * 1.1, top + len * 0.2], [crw * 1.18, bot + hu * 0.55], [crw * 0.95, bot + hu * 0.68], [crw * 0.6, bot + hu * 0.5], [-crw * 0.6, bot + hu * 0.5], [-crw * 0.95, bot + hu * 0.68], [-crw * 1.18, bot + hu * 0.55]], shade(a.hc, 0.9));   // tucked behind the shoulders, so the face and the beard stand out
    if ((hr === 'long' && a.fem) || hr === 'wild') { const wl = hr === 'wild' ? 1.18 : 1; piece([[-crw * 1.5 * wl, -len * 0.05], [-crw * 1.25 * wl, top - hu * 0.1], [0, top - hu * 0.22], [crw * 1.3 * wl, top - hu * 0.08], [crw * 1.55 * wl, 0], [crw * 1.75 * wl, bot + hu * 0.55], [crw * 1.35, bot + hu * 0.45], [crw * 1.5 * wl, bot + hu * 0.8], [crw * 0.9, bot + hu * 0.55], [-crw * 0.9, bot + hu * 0.6], [-crw * 1.55 * wl, bot + hu * 0.85], [-crw * 1.4, bot + hu * 0.5], [-crw * 1.75 * wl, bot + hu * 0.6]], a.hc); }
    if (hr === 'bob') piece([[-crw * 1.18, top + len * 0.15], [-crw * 0.95, top - hu * 0.08], [crw * 0.95, top - hu * 0.08], [crw * 1.18, top + len * 0.15], [crw * 1.22, bot - len * 0.02], [crw * 0.75, bot + len * 0.02], [-crw * 0.75, bot + len * 0.02], [-crw * 1.22, bot - len * 0.02]], a.hc);
    if (hr === 'mullet') piece([[-crw * 0.95, 0], [-crw * 1.15, bot + hu * 0.5], [-crw * 0.4, bot + hu * 0.35], [crw * 0.2, bot + hu * 0.55], [crw * 1.1, bot + hu * 0.45], [crw * 0.95, 0]], a.hc);
    if (hr === 'afro' || hr === 'tower' || hr === 'curls') { const af0: Pt[] = [], big = hr === 'curls' ? 0.78 : 1, cy0 = top - hu * (hr === 'tower' ? 0.45 : 0.25) * big, n = hr === 'curls' ? 13 : 17; for (let q = 0; q <= n; q++) { const t = Math.PI * (1.08 - 1.16 * q / n), fq = (q % 2 ? 0.9 : 1.05) + r() * 0.08; af0.push([Math.cos(t) * crw * 1.42 * big * fq, cy0 - Math.sin(t) * hu * (hr === 'tower' ? 0.95 : 0.66) * big * fq]); }
      P.poly(([[-crw * 1.05, top + len * 0.15]] as Pt[]).concat(af0, [[crw * 1.05, top + len * 0.15]] as Pt[]), a.hc); }
    if (hr === 'dreads') for (let q = 0; q < 8; q++) { const sx = q < 4 ? -1 : 1, x0 = sx * crw * (0.7 + (q % 4) * 0.13), len2 = hu * (0.9 + (q % 3) * 0.18); piece([[x0 - hu * 0.05, top + len * 0.2], [x0 + hu * 0.05, top + len * 0.2], [x0 + sx * hu * 0.12 + hu * 0.04, bot + len2 * 0.5], [x0 + sx * hu * 0.12 - hu * 0.04, bot + len2 * 0.5]], q % 2 ? shade(a.hc, 0.85) : a.hc); }
    if (hr === 'ponytail') piece([[crw * 0.3, top + len * 0.05], [crw * 0.75, top + len * 0.1], [crw * 1.2, bot + hu * 0.3], [crw * 0.95, bot + hu * 0.55], [crw * 0.7, bot + hu * 0.2]], a.hc);
    if (hr === 'pigtails') for (const sd of [-1, 1]) piece([[sd * crw * 0.85, jt - es], [sd * crw * 1.15, jt - es * 1.2], [sd * crw * 1.5, bot + hu * 0.25], [sd * crw * 1.25, bot + hu * 0.4], [sd * crw * 1.05, jt + es]], a.hc);
    if (hr === 'braid') for (let q = 0; q < 9; q++) P.poly(ell((q % 2 ? 0.04 : -0.04) * hu, jt + q * hu * 0.16, hu * (0.16 - q * 0.008), hu * 0.11, 10), q % 2 ? shade(a.hc, 0.82) : a.hc);
  };
  behind();
  // ears
  const ed = r() * 0.05 * len, ek = h.ear * 0.95;
  for (const sd of [-1, 1]) { const ex0 = sd * face * 0.93, ey0 = ey + (sd > 0 ? ed : 0); piece([[ex0, ey0 - len * 0.1], [ex0 + sd * ek * hu * 0.15, ey0 - len * 0.06], [ex0 + sd * ek * hu * 0.13, ey0 + len * 0.1], [ex0, ey0 + len * 0.12]], shade(sk, 0.93)); if (!back) mkS(`M${ex0 + sd * ek * hu * 0.05} ${ey0 - len * 0.03} q${sd * hu * 0.04} ${len * 0.05} 0 ${len * 0.1}`, 1.2, dk); }
  // the skull and the jaw
  const CR: Record<string, Pt[]> = { bullet: [[-crw * 0.75, top + len * 0.1], [-crw * 0.45, top], [crw * 0.45, top], [crw * 0.76, top + len * 0.1], [crw, jt], [-crw, jt]], round: [[-crw * 0.88, top + len * 0.18], [-crw * 0.55, top], [crw * 0.55, top], [crw * 0.9, top + len * 0.18], [crw, jt], [-crw, jt]],
    long: [[-crw * 0.85, top + len * 0.06], [-crw * 0.6, top], [crw * 0.6, top], [crw * 0.86, top + len * 0.06], [crw, jt], [-crw, jt]], egg: [[-crw * 0.92, top + len * 0.22], [-crw * 0.55, top], [crw * 0.55, top], [crw * 0.93, top + len * 0.22], [crw, jt], [-crw, jt]],
    heart: [[-crw * 0.92, top + len * 0.18], [-crw * 0.5, top], [0, top + len * 0.05], [crw * 0.5, top], [crw * 0.93, top + len * 0.18], [crw, jt], [-crw, jt]] };
  const JW: Record<string, Pt[]> = { anvil: [[-crw, jt], [crw, jt], [jw, jt + len * 0.22], [jw * 0.94, bot], [-jw * 0.94, bot], [-jw, jt + len * 0.22]], block: [[-crw, jt], [crw, jt], [jw * 0.98, jt + len * 0.28], [jw * 0.78, bot], [-jw * 0.78, bot], [-jw * 0.98, jt + len * 0.28]],
    jowl: [[-crw, jt], [crw, jt], [jw * 1.06, bot - len * 0.22], [jw * 0.82, bot + len * 0.04], [0, bot + len * 0.08], [-jw * 0.82, bot + len * 0.04], [-jw * 1.06, bot - len * 0.22]], square: [[-crw, jt], [crw, jt], [jw, bot - len * 0.2], [jw * 0.62, bot], [-jw * 0.62, bot], [-jw, bot - len * 0.2]],
    v: [[-crw, jt], [crw, jt], [Math.max(jw * 1.1, crw * 0.95), jt + len * 0.18], [jw * 0.25, bot], [-jw * 0.25, bot], [-Math.max(jw * 1.1, crw * 0.95), jt + len * 0.18]], round: [[-crw, jt], [crw, jt], [jw * 1.06, bot - len * 0.24], [jw * 0.6, bot], [-jw * 0.6, bot], [-jw * 1.06, bot - len * 0.24]] };
  JW.v = [[-crw, jt], [crw, jt], [crw * 1.02, jt + len * 0.2], [jw * 0.9, bot - len * 0.12], [jw * 0.45, bot], [-jw * 0.45, bot], [-jw * 0.9, bot - len * 0.12], [-crw * 1.02, jt + len * 0.2]];   // cheekbones, then a taper to the chin
  const jaw = (JW[h.jowl ? 'jowl' : h.jaw] || JW.round).slice(), cr = more(more(CR[h.cr] || CR.round));
  if (h.jaw !== 'jowl' && h.jaw !== 'v' && !h.jowl) { const i = jaw.findIndex(p => p[1] === bot && p[0] > 0); if (i >= 0) jaw.splice(i + 1, 0, [0, bot + len * 0.04]); }
  if (a.mask) {
    piece(more(jaw), a.mask[0]); piece(cr, a.mask[0]);
    if (!back) piece([[0, top + len * 0.04], [crw * 0.55, ey - es * 0.4], [crw * 0.18, bot - len * 0.3], [0, ey + len * 0.1], [-crw * 0.18, bot - len * 0.3], [-crw * 0.55, ey - es * 0.4]], a.mask[1]);
  } else { piece(more(jaw), sk); piece(cr, sk); if (h.jowl && !back) for (const sd of [-1, 1]) mkS(`M${sd * jw * 0.85} ${bot - len * 0.2} q${-sd * hu * 0.05} ${len * 0.12} ${-sd * hu * 0.2} ${len * 0.16}`, 1.5, dk); }
  // stubble: the concept lays it at half strength, so it goes on the skin under the nose and the mouth
  const my = ey + (bot - ey) * 0.68;
  if (a.beard === 'stubble') P.path(`M${-jw * 1.02} ${jt + len * 0.2} L${-jw * 0.92} ${bot - len * 0.06} Q0 ${bot + len * 0.12} ${jw * 0.92} ${bot - len * 0.06} L${jw * 1.02} ${jt + len * 0.2} L${jw * 0.75} ${my - hu * 0.04} Q0 ${my - hu * 0.13} ${-jw * 0.75} ${my - hu * 0.04}Z`, mixC(a.hc, sk, 0.55));
  if (back) {   // from behind: the back of the hair over the skull, no face
    if (a.hair !== 'bald' && a.hair !== 'mohawk') piece([[-crw * 1.02, jt + len * 0.15], [-crw * 0.95, top - hu * 0.04], [crw * 0.95, top - hu * 0.04], [crw * 1.02, jt + len * 0.15], [crw * 0.6, bot - len * 0.15], [-crw * 0.6, bot - len * 0.15]], a.hc);
    if (a.hair === 'mohawk') piece([[-crw * 0.2, top + len * 0.05], [-crw * 0.15, top - hu * 0.32], [crw * 0.15, top - hu * 0.32], [crw * 0.2, top + len * 0.05], [crw * 0.15, bot - len * 0.2], [-crw * 0.15, bot - len * 0.2]], a.hc);
    behind();
    return;
  }
  // eyes and brows
  const bc = a.mask ? a.mask[2] : a.hair === 'bald' ? '#1b1b1d' : shade(a.hc, a.hc > '#999999' ? 0.45 : 0.6);
  for (const sd of [-1, 1]) {
    const x = sd * eg, y = ey + (sd > 0 ? r() * hu * 0.012 : 0);
    const bw = Math.min(es * 1.6, eg - face * 0.07), bt = hu * (0.07 + (h.brow === 'slab' || h.brow === 'thick' ? 0.04 : 0)) * 0.7 * (h.bt || 1);
    P.turn(h.et * sd, x, y, () => {
      if (a.mask) { P.path(`M${x - es * 1.7} ${y - es * 0.7} L${x + es * 1.4} ${y - es * 1.0} L${x + es * 1.6} ${y + es * 0.7} L${x - es * 1.5} ${y + es * 0.8}Z`, a.mask[2]); P.path(`M${x - es * 1.1} ${y} Q${x} ${y - es * 0.9} ${x + es * 1.1} ${y} Q${x} ${y + es * 0.6} ${x - es * 1.1} ${y}Z`, '#1b1b1d'); return; }
      const mixed = h.eye === 'mixed' && sd < 0, w = es * 1.3, hh = mixed ? es * 0.38 : es * (h.eye === 'slit' ? 0.62 : 0.76), ir = mixed ? hh * 0.75 : hh * 0.56;
      P.path(`M${x - w} ${y} Q${x} ${y - hh * 1.5} ${x + w} ${y} Q${x} ${y + hh} ${x - w} ${y}Z`, '#fbf6e6');
      P.ell(x + sd * w * 0.05, y - hh * 0.08, ir, ir, a.iris); P.ell(x + sd * w * 0.05, y - hh * 0.08, ir * 0.46, ir * 0.46, '#120c0a'); P.ell(x + sd * w * 0.05 - ir * 0.3, y - hh * 0.08 - ir * 0.3, ir * 0.18, ir * 0.18, '#f4efe6');
      mkS(`M${x - w * 1.08} ${y + hh * 0.05} Q${x} ${y - hh * 1.62} ${x + w * 1.08} ${y - hh * 0.05}`, h.eye === 'lash' ? 2.4 : a.fem ? 1.2 : 1.8);
      mkS(`M${x - w * 0.85} ${y - hh * 1.05} Q${x} ${y - hh * 1.95} ${x + w * 0.95} ${y - hh * 1.0}`, 1.1, dk);
      if (h.eye === 'lash') P.path(`M${x + sd * w * 0.95} ${y - hh * 0.4} l${sd * es * 0.75} ${-es * 0.6} l${-sd * es * 0.05} ${es * 0.65}Z`, '#1b1b1d');
      if (h.eye === 'lid') P.path(`M${x - sd * w * 0.95} ${y - hh * 0.55} Q${x} ${y - hh * 2.05} ${x + sd * w * 1.3} ${y - hh * 0.45} Q${x} ${y - hh * 1.2} ${x - sd * w * 0.95} ${y - hh * 0.55}Z`, h.shadow || shade(sk, 0.82));
    });
    if (h.bags) mkS(`M${x - es} ${y + es * 1.15} Q${x} ${y + es * 1.8} ${x + es} ${y + es * 1.15}`, 1.4, dk);
    const BR: Record<string, Pt[]> = { slab: [[-bw, -bt * 0.3], [bw, bt * 0.1], [bw, bt], [-bw, bt * 0.6]], thick: [[-bw, 0], [bw, -bt * 0.3], [bw, bt * 0.7], [-bw, bt * 0.8]],
      raised: [[-bw, bt * 0.4], [bw * 0.2, -bt * 0.6], [bw, -bt * 0.2], [bw, bt * 0.3], [bw * 0.2, 0], [-bw, bt]], thin: [[-bw, bt * 0.3], [0, -bt * 0.4], [bw, bt * 0.1], [bw, bt * 0.6], [0, bt * 0.1], [-bw, bt * 0.8]],
      arch: [[-bw, bt * 0.5], [-bw * 0.1, -bt * 0.5], [bw, bt * 0.2], [bw, bt * 0.6], [-bw * 0.1, 0], [-bw, bt]], flat: [[-bw, 0], [bw, 0], [bw, bt * 0.8], [-bw, bt * 0.8]] };
    const B = BR[h.brow];
    if (B) P.turn((h.brow === 'slab' ? 9 : -2) * sd, x, browY, () => P.poly(B.map(([px, py]) => [x + px, browY - bt + py] as Pt), bc));
  }
  // the nose: a raised piece and two nostrils
  const nz = hu * 0.12, ny = ey + (bot - ey) * 0.42, NW = h.nw || 1, NL = h.nl || 1, nc = shade(sk, 0.9), nh = shade(sk, 0.55);
  const NOSE: Record<string, Pt[]> = {
    straight: [[-nz * 0.15, ny - nz * 1.6 * NL], [nz * 0.2, ny - nz * 1.6 * NL], [nz * 0.55 * NW, ny + nz * 0.1], [-nz * 0.35 * NW, ny + nz * 0.15]],
    broad: [[-nz * 0.2, ny - nz * 1.3 * NL], [nz * 0.25, ny - nz * 1.3 * NL], [nz * 0.75 * NW, ny + nz * 0.05], [nz * 0.6 * NW, ny + nz * 0.3], [-nz * 0.6 * NW, ny + nz * 0.3], [-nz * 0.7 * NW, ny + nz * 0.05]],
    hook: [[-nz * 0.1, ny - nz * 1.7 * NL], [nz * 0.25, ny - nz * 1.6 * NL], [nz * 0.55, ny - nz * 0.7], [nz * 0.6 * NW, ny + nz * 0.25], [nz * 0.1, ny + nz * 0.35], [-nz * 0.35 * NW, ny + nz * 0.15]],
    long: [[-nz * 0.1, ny - nz * 1.9 * NL], [nz * 0.18, ny - nz * 1.9 * NL], [nz * 0.45 * NW, ny + nz * 0.25], [-nz * 0.3 * NW, ny + nz * 0.3]],
    button: [[-nz * 0.12, ny - nz * 0.9 * NL], [nz * 0.18, ny - nz * 0.9 * NL], [nz * 0.45 * NW, ny + nz * 0.12], [0, ny + nz * 0.24], [-nz * 0.4 * NW, ny + nz * 0.12]],
    small: [[-nz * 0.08, ny - nz * 1.1 * NL], [nz * 0.15, ny - nz * 1.1 * NL], [nz * 0.38 * NW, ny + nz * 0.1], [-nz * 0.28 * NW, ny + nz * 0.14]] };
  const nk = NOSE[h.nose || 'straight'] || NOSE.straight, nb = nk.reduce((m2, p) => Math.max(m2, p[1]), -1e9);
  piece(nk, nc);
  const nx = (h.nose === 'broad' ? 0.45 : h.nose === 'button' || h.nose === 'small' ? 0.28 : 0.35) * nz * NW;
  P.ell(-nx, nb - nz * 0.04, nz * 0.17 * NW, nz * 0.09, nh); P.ell(nx + nz * 0.08, nb - nz * 0.04, nz * 0.17 * NW, nz * 0.09, nh);
  if (!a.fem && (h.nose === 'hook' || h.nose === 'long')) mkS(`M${nz * 0.2} ${ny - nz * 1.2 * NL} L${nz * 0.42} ${ny - nz * 0.2}`, 1.1, shade(sk, 0.75));   // the line of the bridge
  if (h.scar) mkS(`M${crw * 0.1} ${top + len * 0.22} l${hu * 0.14} ${hu * 0.17}`, 2, '#a8304a');
  if (h.freck) for (let k = 0; k < 12; k++) P.ell((k % 2 ? 1 : -1) * face * (0.25 + r() * 0.15) * 2, ny - nz * 0.6 + r() * nz * 0.8, hu * 0.012 + r() * hu * 0.008, hu * 0.012 + r() * hu * 0.008, '#c86a3a');
  if ((mk.blood || 0) >= 1) mkS(`M${-crw * 0.4} ${top + len * 0.3} l${hu * 0.2} ${hu * 0.04}`, 3, '#9e1414');
  if ((mk.blood || 0) >= 2) for (const sx of [-0.3, 0.25]) mkS(`M${crw * sx} ${top + len * 0.32} l${hu * 0.02} ${len * 0.5}`, 2.6, '#9e1414');
  if (mk.bruise) P.ell(eg, ey + es * 0.4, es * 1.2, es * 0.8, '#6e4a7e');
  // the mouth
  const mw = face * 0.5 * (h.mouth === 'grin' || h.mouth === 'wide' ? 1.18 : 1) * 0.78 * (h.mw || 1);
  const MO: Record<string, string> = { grim: `M${-mw} ${my + hu * 0.02} L${mw * 0.9} ${my + hu * 0.035}`, grit: `M${-mw} ${my - hu * 0.02} L${mw} ${my - hu * 0.02} L${mw * 0.9} ${my + hu * 0.07} L${-mw * 0.9} ${my + hu * 0.07}Z`, smirk: `M${-mw * 0.9} ${my + hu * 0.02} Q${mw * 0.2} ${my + hu * 0.05} ${mw} ${my - hu * 0.06}`,
    flat: `M${-mw * 0.75} ${my} L${mw * 0.7} ${my + hu * 0.012}`, grin: `M${-mw} ${my - hu * 0.04} Q0 ${my + hu * 0.17} ${mw} ${my - hu * 0.04}Z`, smile: `M${-mw} ${my - hu * 0.02} Q0 ${my + hu * 0.1} ${mw} ${my - hu * 0.025}`, wide: `M${-mw} ${my - hu * 0.03} Q0 ${my + hu * 0.11} ${mw} ${my - hu * 0.03}` };
  const filled = h.mouth === 'grin' || h.mouth === 'grit', lipc = h.lip || shade(sk, 0.62);
  if (filled) { P.path(MO[h.mouth], '#fffdf0'); mkS(MO[h.mouth], 2.4, shade(lipc, 0.8)); }
  else if (!a.fem) { P.path(`M${-mw * 0.8} ${my + hu * 0.01} Q0 ${my + hu * 0.08} ${mw * 0.8} ${my + hu * 0.01}Z`, shade(sk, 0.75)); mkS(MO[h.mouth], 2.2, shade(sk, 0.4)); }
  else { P.path(`M${-mw} ${my} Q${-mw * 0.4} ${my - hu * 0.07} 0 ${my - hu * 0.03} Q${mw * 0.4} ${my - hu * 0.07} ${mw} ${my} Q${mw * 0.4} ${my + hu * 0.03} ${-mw} ${my}Z`, shade(lipc, 0.85)); P.path(`M${-mw * 0.85} ${my + hu * 0.01} Q0 ${my + hu * 0.1} ${mw * 0.85} ${my + hu * 0.01}Z`, lipc); mkS(`M${-mw} ${my} Q0 ${my + hu * 0.02} ${mw} ${my}`, 1.4, shade(lipc, 0.5)); }
  // the beard and the moustache
  const BC = a.hc < '#333333' ? a.hc : shade(a.hc, a.hc > '#999999' ? 0.55 : 0.66), lng = a.beard === 'full' ? len * 0.22 : 0, shortB = a.beard === 'short';
  if (a.beard === 'full' || shortB) piece([[-jw * 0.9, jt + len * 0.2], [-jw * 0.88, bot - len * 0.02], [-jw * 0.35, bot + len * (shortB ? 0.12 : 0.24) + lng], [jw * 0.4, bot + len * (shortB ? 0.1 : 0.2) + lng], [jw * 0.88, bot - len * 0.04], [jw * 0.9, jt + len * 0.2], [jw * 0.55, my + hu * 0.03], [0, my - hu * 0.07], [-jw * 0.55, my + hu * 0.03]], BC);
  if (a.beard === 'full' && a.braid) for (let q = 0; q < 4; q++) P.poly(ell((q % 2 ? 0.03 : -0.03) * hu, bot + lng + len * 0.2 + q * hu * 0.12, hu * 0.08, hu * 0.08, 10), q % 2 ? shade(BC, 0.8) : BC);
  if (a.beard === 'goatee' || a.beard === 'vandyke') piece([[-mw * 0.7, my + hu * 0.06], [-mw * 0.28, bot + len * 0.18], [mw * 0.32, bot + len * 0.17], [mw * 0.7, my + hu * 0.06], [0, my + hu * 0.1]], BC);
  if (a.beard === 'chin') piece([[-jw * 0.75, bot - len * 0.12], [-jw * 0.55, bot + len * 0.12], [jw * 0.55, bot + len * 0.12], [jw * 0.75, bot - len * 0.12], [0, my + hu * 0.1]], BC);
  if (a.beard === 'chinstrap') mkS(`M${-jw * 1.02} ${jt + len * 0.1} L${-jw * 0.88} ${bot - len * 0.06} Q0 ${bot + len * 0.1} ${jw * 0.88} ${bot - len * 0.06} L${jw * 1.02} ${jt + len * 0.1}`, hu * 0.06, BC);
  if (a.beard === 'sideburns') for (const sd of [-1, 1]) piece([[sd * crw * 0.98, jt], [sd * crw * 0.8, jt], [sd * jw * 0.85, jt + len * 0.3], [sd * jw * 1.02, jt + len * 0.32]], BC);
  const mus = a.beard === 'vandyke' ? 2 : a.mus || 0;
  if (mus) piece([[-mw * 0.95, my - hu * 0.035], [-mw * 0.4, my - hu * 0.1], [0, my - hu * 0.085], [mw * 0.4, my - hu * 0.1], [mw * 0.95, my - hu * 0.035], [mw * 0.85, my - hu * 0.005], [0, my - hu * 0.045], [-mw * 0.85, my - hu * 0.005]], BC);
  if (mus === 3) for (const sd of [-1, 1]) piece([[sd * mw * 0.85, my - hu * 0.03], [sd * mw * 1.2, my - hu * 0.07], [sd * mw * 1.35, my - hu * 0.16], [sd * mw * 1.12, my - hu * 0.06]], BC);
  if (a.beard === 'horseshoe' || mus === 4) piece([[-mw * 1.15, my - hu * 0.075], [0, my - hu * 0.11], [mw * 1.15, my - hu * 0.075], [mw * 1.25, bot + len * 0.04], [mw * 0.92, bot + len * 0.03], [mw * 0.84, my + hu * 0.025], [-mw * 0.84, my + hu * 0.025], [-mw * 0.92, bot + len * 0.03], [-mw * 1.25, bot + len * 0.04]], BC);
  // the hair on top: every style of the game, cut as the concept cuts hair
  const pulled = (k2: number): Pt[] => [[-crw * 1.0, jt - es * k2], [-crw * 0.9, top - hu * 0.04], [crw * 0.9, top - hu * 0.04], [crw * 1.0, jt - es * k2], [crw * 0.7, top + len * 0.12], [-crw * 0.7, top + len * 0.12]];   // pulled back off the face
  const HT: Record<string, Pt[]> = {
    buzz: [[-crw * 0.98, jt - es * 0.2], [-crw * 0.8, top + len * 0.06], [-crw * 0.45, top - hu * 0.03], [crw * 0.45, top - hu * 0.03], [crw * 0.8, top + len * 0.06], [crw * 0.98, jt - es * 0.2], [crw * 0.7, top + len * 0.15], [0, top + len * 0.2], [-crw * 0.7, top + len * 0.15]],
    crew: [[-crw * 1.0, jt - es * 0.4], [-crw * 0.86, top - hu * 0.06], [-crw * 0.2, top - hu * 0.1], [crw * 0.86, top - hu * 0.04], [crw * 1.0, jt - es * 0.4], [crw * 0.78, top + len * 0.13], [crw * 0.25, top + len * 0.15], [0, top + len * 0.21], [-crw * 0.25, top + len * 0.15], [-crw * 0.78, top + len * 0.13]],
    cap: [[-crw * 1.03, jt - es * 0.8], [-crw * 0.95, top - hu * 0.05], [crw * 0.9, top - hu * 0.09], [crw * 1.04, jt - es * 0.4], [crw * 0.8, top + len * 0.14], [crw * 0.05, top + len * 0.2], [-crw * 0.3, top + len * 0.12], [-crw * 0.85, top + len * 0.16]],
    flat: [[-crw * 1.0, jt - es * 0.4], [-crw * 0.96, top - hu * 0.24], [crw * 0.96, top - hu * 0.22], [crw * 1.0, jt - es * 0.4], [crw * 0.76, top + len * 0.13], [0, top + len * 0.18], [-crw * 0.76, top + len * 0.13]],
    slick: [[-crw * 1.02, jt - es * 0.5], [-crw * 0.9, top - hu * 0.06], [crw * 0.1, top - hu * 0.12], [crw * 0.95, top - hu * 0.02], [crw * 1.03, jt - es * 0.5], [crw * 0.75, top + len * 0.1], [-crw * 0.2, top + len * 0.08], [-crw * 0.8, top + len * 0.14]],
    mullet: [[-crw * 1.05, jt - es * 0.5], [-crw * 0.95, top - hu * 0.05], [crw * 0.95, top - hu * 0.08], [crw * 1.06, jt - es * 0.5], [crw * 0.55, top + len * 0.16], [-crw * 0.45, top + len * 0.22]],
    puff: [[-crw * 1.04, jt - es * 0.3], [-crw * 0.9, top - hu * 0.03], [crw * 0.9, top - hu * 0.03], [crw * 1.04, jt - es * 0.3], [crw * 0.85, top + len * 0.2], [-crw * 0.85, top + len * 0.2]],
    long: [[-crw * 1.06, jt], [-crw * 1.0, top - hu * 0.06], [0, top - hu * 0.12], [crw * 1.0, top - hu * 0.06], [crw * 1.06, jt], [crw * 0.72, top + len * 0.16], [0, top + len * 0.04], [-crw * 0.72, top + len * 0.16]],
    bob: [[-crw * 1.06, jt + es * 0.4], [-crw * 1.0, top - hu * 0.06], [crw * 1.0, top - hu * 0.06], [crw * 1.06, jt + es * 0.4], [crw * 0.82, top + len * 0.26], [-crw * 0.82, top + len * 0.26]] };
  const TOP: Record<string, string> = { crew: 'crew', cap: 'cap', flat: 'flat', slick: 'slick', undercut: 'slick', mullet: 'mullet', afro: 'puff', tower: 'puff', curls: 'puff', buzz: 'buzz', braids: 'buzz', dreads: 'buzz', long: a.fem ? '' : 'long', bob: 'bob' };
  const hr = a.hair;
  if (hr === 'undercut') piece(HT.buzz, shade(a.hc, 0.72));
  if (hr === 'mohawk') { piece(HT.buzz, mixC(a.hc, sk, 0.62)); const fin: Pt[] = [[-crw * 0.32, top + len * 0.22]]; for (let q = 0; q <= 4; q++) { const yq = top + len * (0.18 - q * 0.05); fin.push([-crw * 0.32 + q * crw * 0.13, yq], [-crw * 0.24 + q * crw * 0.13, yq - hu * (0.24 + 0.06 * (q % 2))]); } fin.push([crw * 0.32, top - hu * 0.05], [crw * 0.32, top + len * 0.22]); piece(fin, a.hc); }
  if (TOP[hr] && HT[TOP[hr]]) piece(HT[TOP[hr]], a.hc);
  if (hr === 'ponytail' || hr === 'pigtails' || hr === 'bun' || hr === 'braid') piece(pulled(0.5), a.hc);
  if (hr === 'bun') P.poly(ell(0, top - hu * 0.14, hu * 0.2, hu * 0.15, 12), a.hc);
  if (hr === 'tower') piece([[-crw * 0.75, top - hu * 0.02], [crw * 0.75, top - hu * 0.04], [crw * 0.7, top + hu * 0.07], [-crw * 0.72, top + hu * 0.08]], a.g2);
  if (hr === 'braids') for (let q = 0; q < 4; q++) { const x = crw * (-0.6 + q * 0.4); mkS(`M${x} ${top + len * 0.13} L${x * 0.8} ${top - hu * 0.02}`, 1.6, shade(a.hc, 0.55)); }
  if (hr === 'slick' || hr === 'undercut') mkS(`M${-crw * 0.5} ${top + len * 0.02} Q${crw * 0.1} ${top - hu * 0.08} ${crw * 0.6} ${top + len * 0.02}`, 1.6, shade(a.hc, 1.4));
  if (hr === 'spiky') { const sp: Pt[] = [[-crw * 1.0, jt - es * 0.3], [-crw * 0.95, top + len * 0.1]], L5 = [0.55, 0.85, 0.65, 1.0, 0.7]; L5.forEach((l, q) => { const x0 = -crw * 0.85 + q * crw * 0.42; sp.push([x0 + crw * 0.05, top + len * 0.05], [x0 + crw * 0.3 + l * hu * 0.25, top - l * hu * 0.36], [x0 + crw * 0.38, top + len * 0.08]); }); sp.push([crw * 1.0, top + len * 0.1], [crw * 1.0, jt - es * 0.3], [0, top + len * 0.22]); piece(sp, a.hc); }
  if ((hr === 'long' && a.fem) || hr === 'wild') {
    piece([[-crw * 1.15, jt], [-crw * 1.1, top - hu * 0.07], [-crw * 0.15, top - hu * 0.2], [-crw * 0.05, top + len * 0.1], [-crw * 0.6, top + len * 0.3], [-crw * 0.95, jt + es]], a.hc);
    piece([[crw * 0.05, top + len * 0.05], [crw * 0.2, top - hu * 0.19], [crw * 1.12, top - hu * 0.06], [crw * 1.2, jt], [crw * 1.0, jt + es * 1.5], [crw * 0.75, top + len * 0.25]], shade(a.hc, 1.08));
    for (const sd of [-1, 1]) for (let q = 0; q < 3; q++) piece(([[-crw * (1.6 - q * 0.1), bot + hu * (0.3 + q * 0.15)], [-crw * (1.3 - q * 0.05), jt + es * (1.4 + q * 0.4)], [-crw * 1.12, jt + es * (1.8 + q * 0.5)], [-crw * (1.4 - q * 0.08), bot + hu * (0.45 + q * 0.15)]] as Pt[]).map(([px, py]) => [px * sd, py + (sd > 0 ? hu * 0.08 : 0)] as Pt), q % 2 ? shade(a.hc, 0.85) : shade(a.hc, 1.1));
  }
}
const mixC = (a: string, b: string, t: number) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t).toString(16).padStart(2, '0')).join(''); };

/* ---------- the doll ---------- */
const child = (f: F, off: Pt, ang: number): F => { const d = rot(off, f.a); return { x: f.x + d[0], y: f.y + d[1], a: f.a + ang * Math.PI / 180 }; };
/** A sports pad over a joint: a rounded card along the limb, a darker lower cap and a stitched seam. */
function pad(P: Pen, r: R, x: number, y: number, deg: number, w: number, l: number, col: string) {
  P.group(x, y, deg, () => {
    const rr = Math.min(w, l) * 0.6;
    P.path(`M${-w} ${-l + rr} Q${-w} ${-l} ${-w + rr} ${-l} L${w - rr} ${-l} Q${w} ${-l} ${w} ${-l + rr} L${w} ${l - rr} Q${w} ${l} ${w - rr} ${l} L${-w + rr} ${l} Q${-w} ${l} ${-w} ${l - rr}Z`, col);
    P.path(`M${-w} ${l * 0.25} L${w} ${l * 0.25} L${w} ${l - rr} Q${w} ${l} ${w - rr} ${l} L${-w + rr} ${l} Q${-w} ${l} ${-w} ${l - rr}Z`, shade(col, 0.78));
    P.stroke(`M${-w * 0.8} ${-l * 0.15} L${w * 0.8} ${-l * 0.15}`, 1, shade(col, 0.6));
  });
}
/** A tattoo cut from dark card, laid along a limb from the top of the bone (the concept's tattoo()). */
function tattoo(P: Pen, st: string, L: number, w: number, sk: string, r: R) {
  const c = shade(sk, 0.4), SLV = ['#2c62ad', '#c23b2a', '#2f8f45', '#ffd43b', '#7a3fa0'];
  if (st === 'tribal') for (const y of [L * 0.16, L * 0.4]) { P.path(`M${-w * 0.8} ${y} L0 ${y + w * 0.55} L${w * 0.8} ${y} L${w * 0.8} ${y + w * 0.32} L0 ${y + w * 0.92} L${-w * 0.8} ${y + w * 0.32}Z`, c); P.path(`M${-w * 0.25} ${y + w * 1.05} L0 ${y + w * 1.4} L${w * 0.25} ${y + w * 1.05}Z`, c); }
  if (st === 'sleeve') for (let k = 0; k < 4; k++) { const y = L * (0.12 + k * 0.2); P.path(`M${-w * 0.8} ${y} Q0 ${y - w * 0.25} ${w * 0.75} ${y + w * 0.05} L${w * 0.7} ${y + L * 0.15} Q0 ${y + L * 0.2} ${-w * 0.78} ${y + L * 0.14}Z`, mixC(SLV[(k + Math.floor(r() * 5)) % 5], sk, 0.22)); }
}

/** Cut and pin a doll in style C. The same arguments and rig as `puppet()`. */
export function puppetC(r: Recipe, pl: Place, pose: Record<string, number>, expr: string, own: string, out: Piece[], mk: Marks = {}): Rig {
  const big0 = r.w > 1.15 || (r.belly || 0) > 0.05 ? 8 : 0, jit = (k2: string, d: number) => ((hashS(r.key + '|st' + k2) % 1000) / 1000 - 0.5) * d;
  const STC: Record<string, number> = { ...STAND, sh_n: 9 + big0 + jit('sn', 6), el_n: 18 + jit('en', 8), sh_f: -8 - big0 + jit('sf', 6), el_f: -18 + jit('ef', 8), hip_n: 6 + jit('hn', 4), hip_f: -6 + jit('hf', 4), kn_n: -3, kn_f: 3, an_n: -4, an_f: 4, head: jit('hd', 6), torso: jit('to', 2) };   // style C stands easy (critic, 29 October)
  const a = lookOf(r, expr), out0 = out.length;
  const n0 = out0, bk = !!pl.b, P0 = { ...STC, ...pose }, h = r.h * a.hs, ll = r.ll || 1, H = h * (r.th || 1), K = r.kit;
  const rr = rngOf(r.key + '|C'), hu = HU, k = GH * h / HU, sk = a.skin, dk = shade(sk, 0.74);
  const rH = { ...r, h }, y = pl.y + (legs(rH) - LEGS0) * Math.cos(pl.r * Math.PI / 180);
  const root: F = { x: pl.x, y, a: pl.r * Math.PI / 180 }, fx = pl.f < 0 ? (px: number) => 2 * pl.x - px : (px: number) => px;
  const rig: Rig = { joints: {}, anchors: {}, rootx: pl.x, f: pl.f };
  const note = (name: string, f: F, parent: F, up = false) => { rig.joints[name] = { x: f.x, y: f.y, pa: parent.a, up }; };
  const pen = (f: F, z: number, joint: string) => new Pen(f, k, fx, pl.z + z, out, own, joint);
  const W_ = (f: F, p: Pt): Pt => { const d = rot(p, f.a); return [fx(f.x + d[0]), f.y + d[1]]; };
  const px = (u: number) => u / k;   // game units to the concept's pixels
  const piece = (Pn: Pen, pts: Pt[], col: string, edge?: boolean) => Pn.poly(cut(pts, rr), col, edge ? shade(col, 0.8) : undefined);
  const sw = a.sw * T, cw = a.cw * T, ww = a.ww * T, hw = a.hw * T, bel = a.bel * T, au = a.au * T, af = a.af * T, th = a.th * T, shn = a.sh * T;
  // the trunk, in its own frame: the concept's levels from the neck down to the crotch, on the game's waist
  const yN = -px(1.95 * H), yC = px(0.42), ySh = yN + hu * 0.22;
  let yCh = ySh + hu * 0.95, yW = yCh + hu * 0.65; if (yW > yC - hu * 0.62) { yW = yC - hu * 0.62; yCh = Math.min(yCh, yW - hu * 0.5); }
  const L = { up: GH * 1.35 * h * ll, fore: GH * 1.22 * h * ll, thigh: 1.3 * h * ll, shin: 1.22 * h * ll };
  const to = child(root, [0, 0], P0.torso); note('torso', to, root, true);
  const legC = a.legC || sk;
  if (a.coat || a.cape) { const T0 = pen(to, -0.4, 'torso'); if (a.coat) piece(T0, [[-sw * 1.02, ySh - hu * 0.05], [sw * 1.02, ySh - hu * 0.05], [sw * 1.3, yC + px(1.6 * h)], [-sw * 1.3, yC + px(1.6 * h)]], shade(a.coat, 0.8)); if (a.cape) piece(T0, [[-sw * 0.9, ySh], [sw * 0.9, ySh], [sw * 1.5, yC + px(2.2 * h)], [sw * 0.4, yC + px(2.3 * h)], [-sw * 0.6, yC + px(2.25 * h)], [-sw * 1.5, yC + px(2.2 * h)]], a.cape); }
  // an arm: the upper arm, the forearm with its pad, a fist; `sd` is the outer side
  const arm = (s: 'n' | 'f', z: number) => {
    const sd = s === 'n' ? 1 : -1, sh = child(to, [sd * sw * 0.9 * k, -(ySh + hu * 0.2) * k], P0['sh_' + s]); note('sh_' + s, sh, to);
    const ul = px(L.up), fl = px(L.fore), A = pen(sh, z, 'sh_' + s), col = a.sleeve || sk;
    piece(A, limb([0, 0], [0, ul], au, au * 0.8, UA), col, true);
    if (a.tat && a.tat.arm.indexOf(sd) >= 0 && !a.sleeve) A.group(0, ul * 0.15, 0, () => tattoo(A, a.tat!.st, ul * 0.85, au * 0.8, sk, rr));
    A.poly(cut(ell(sd * au * 0.25, hu * 0.06, au * 1.25, hu * 0.36, 11), rr), a.sleeve ? col : shade(col, 0.95));   // the shoulder
    const el = child(sh, [0, -L.up], P0['el_' + s]); note('el_' + s, el, sh);
    const E = pen(el, z + 0.04, 'el_' + s), fw = Math.max(af * 1.08, au * 0.78);
    piece(E, limb([0, -fw * 0.5], [0, fl], fw, fw * 0.6, FA), a.sleeve || sk, true);
    if (a.veins && !a.sleeve) E.stroke(`M${-af * 0.2} ${fl * 0.2} Q${af * 0.35} ${fl * 0.42} ${af * 0.1} ${fl * 0.65}`, 1.1, shade(sk, 0.65));
    if (!a.sleeve) pad(E, rr, 0, 0, 0, Math.max(au, fw) * 1.04, hu * 0.17, a.pad);
    if (a.tape && !a.sleeve) piece(E, seg([0, fl * 0.72], [0, fl], af * 0.8, af * 0.76), '#f4f1e8');
    const wr = child(el, [0, -L.fore], P0['wr_' + s]); note('wr_' + s, wr, el);
    const Wp = pen(wr, z + 0.08, 'wr_' + s), fist = hu * 0.27 * Math.max(1, Math.min(1.5, a.sw / 0.15));
    piece(Wp, [[-fist * 0.55, 0], [fist * 0.55, 0], [fist * 0.7, fist * 0.62], [fist * 0.6, fist * 1.02], [fist * 0.42, fist * 0.96], [fist * 0.24, fist * 1.08], [fist * 0.05, fist * 1.0], [-fist * 0.13, fist * 1.08], [-fist * 0.31, fist * 1.0], [-fist * 0.5, fist * 1.04], [-fist * 0.68, fist * 0.72]], sk, true);
    Wp.stroke(`M${-fist * 0.45} ${fist * 0.8} L${fist * 0.45} ${fist * 0.8}`, 1, shade(sk, 0.6));
    piece(Wp, [[-sd * fist * 0.5, fist * 0.15], [sd * fist * 0.15, fist * 0.35], [sd * fist * 0.05, fist * 0.62], [-sd * fist * 0.6, fist * 0.55]], shade(sk, 0.93));
    if (a.tape) Wp.poly([[-fist * 0.65, fist * 0.45], [fist * 0.65, fist * 0.45], [fist * 0.65, fist * 0.67], [-fist * 0.65, fist * 0.67]], '#f4f1e8');
    const hand = W_(wr, [0, -fist * 0.6 * k]); rig.anchors['hand_' + s] = hand;
    if (s === 'n' && r.beltL && r.beltL.length && !(K && (K.acc.indexOf('belt_waist') >= 0 || K.acc.indexOf('belt_shoulder') >= 0))) {   // a champion carries their belt, hanging from the hand
      const kb = 0.75; let bn = 0; beltPieces(r.beltL[0], (pts, col, dz) => { out.push({ pts: pts.map(([u, v]) => W_(wr, [v * kb, -0.06 - (u + 1) * kb])), col, z: pl.z + z + 0.084 + dz * 0.02 + (bn++) * 1e-5, lift: 0.03, own, joint: 'wr_' + s }); });
    }
  };
  // a leg: the thigh, the shin with a calf and a knee pad, a boot turned out with a toe
  const leg = (s: 'n' | 'f', z: number) => {
    const sd = s === 'n' ? 1 : -1, hp = child(root, [sd * hw * 0.5 * k, -0.42], P0['hip_' + s]); note('hip_' + s, hp, root);
    const tl = px(L.thigh), sl = px(L.shin), Th = pen(hp, z, 'hip_' + s);
    piece(Th, a.jeans ? seg([0, 0], [0, tl], th, th * 0.82) : limb([0, 0], [0, tl], th, th * 0.8, TH), legC);
    if (a.quad && !a.legC) Th.stroke(`M${sd * th * 0.3} ${hu * 0.3} Q${sd * th * 0.5} ${tl / 2} ${sd * th * 0.2} ${tl - hu * 0.2}`, 1.3, dk);
    const kn = child(hp, [0, -L.thigh], P0['kn_' + s]); note('kn_' + s, kn, hp);
    const Sh = pen(kn, z + 0.03, 'kn_' + s);
    piece(Sh, a.jeans ? seg([0, 0], [0, sl], th * 0.8, shn * 0.75) : shin([0, 0], [0, sl], shn, sd), legC);
    if (!a.jeans) { pad(Sh, rr, 0, hu * 0.02, 0, th * 0.98, hu * 0.24, a.pad); if (!a.legC) Sh.stroke(`M${-th * 0.3} ${hu * 0.22} q${th * 0.3} ${hu * 0.08} ${th * 0.6} 0`, 1.2, dk); }
    const an = child(kn, [0, -L.shin], P0['an_' + s]); note('an_' + s, an, kn);
    const Ft = pen(an, z + 0.07, 'an_' + s), out_ = hu * 0.2, fy = hu * 0.32, f0: Pt = [0, 0], bx = 0.95;
    piece(Ft, [[f0[0] - shn * 0.85, f0[1] - hu * 0.55], [f0[0] + shn * 0.85, f0[1] - hu * 0.55], [f0[0] + (shn * 0.9 + out_) * bx * 0.3, fy - hu * 0.12], [f0[0] + (shn * 0.9 + out_) * bx, fy - hu * 0.04], [f0[0] + (shn * 1.1 + out_) * bx * 1.15, fy], [f0[0] - shn * 1.0 + out_ * 0.2, fy], [f0[0] - shn * 0.9, fy - hu * 0.1]], a.boots);
    if (a.boots !== sk) { piece(Ft, [[-shn * 0.92, -hu * 0.6], [shn * 0.92, -hu * 0.6], [shn * 0.92, -hu * 0.48], [-shn * 0.92, -hu * 0.48]], a.g2);
      for (let q = 0; q < 3; q++) Ft.stroke(`M${-shn * 0.32} ${-hu * (0.4 - q * 0.1)} L${shn * 0.32} ${-hu * (0.36 - q * 0.1)}`, 1, a.boots === '#111' || a.boots === '#1b1b1d' || a.boots === '#111111' ? '#9a9a9a' : shade(a.boots, 0.55)); }
    if (a.boots !== sk) Ft.poly([[-shn * 1.0, fy - hu * 0.06], [(shn * 1.1 + out_ * 1.15) * bx, fy - hu * 0.06], [(shn * 1.1 + out_ * 1.15) * bx, fy], [-shn * 1.0, fy]], '#1b1b1d');   // the sole
    rig.anchors['foot_' + s] = W_(an, [(out_ * 0.5) * k, -fy * k]);
  };
  arm('f', 0); leg('f', 0.12); leg('n', 0.24);
  // the trunk: shoulders to hips, the traps, a belly, the chest, then the gear over it
  const Tp = pen(to, 0.42, 'torso'), side = (sd: number): Pt[] => [[sd * shn * 1.05, yN + hu * 0.05], [sd * sw * 0.62, ySh - hu * 0.04], [sd * sw, ySh + hu * 0.14], [sd * cw * 1.02, ySh + hu * 0.6], [sd * cw * (a.fem ? 0.93 : 1), yCh], [sd * (ww + bel), yW + (bel ? hu * 0.18 : 0)], [sd * hw, yC - hu * 0.02]];
  const bodyC = a.topC && a.top === 'shirt' ? a.topC : sk;
  piece(Tp, more(side(-1).concat([[0, yC + hu * 0.08]], side(1).reverse()), 0.012), bodyC);
  const trp = Math.max(0.5, a.traps) * (a.fem ? 0.45 : 1); if (a.traps > 0.3 || !a.fem) piece(Tp, [[-sw * 0.62, ySh + hu * 0.02], [-shn * 1.2 * trp - hu * 0.15, yN - hu * (a.fem ? 0.15 : 0.35)], [shn * 1.2 * trp + hu * 0.15, yN - hu * (a.fem ? 0.12 : 0.32)], [sw * 0.62, ySh + hu * 0.02]], shade(bodyC, 0.97));
  const bare = bodyC === sk && !bk;
  if (bel > 0) { const bc = a.top === 'singlet' || a.top === 'shirt' ? a.topC! : sk, bwd = Math.max(ww + bel, cw * 1.2); piece(Tp, [[-bwd * 0.85, yW - hu * 0.55], [0, yW - hu * 0.75], [bwd * 0.87, yW - hu * 0.54], [bwd * 1.0, yW + hu * 0.1], [bwd * 0.8, yW + hu * 0.5], [0, yW + hu * 0.66], [-bwd * 0.8, yW + hu * 0.5], [-bwd * 0.98, yW + hu * 0.1]], bc); Tp.stroke(`M${-bwd * 0.75} ${yW + hu * 0.46} Q0 ${yW + hu * 0.72} ${bwd * 0.75} ${yW + hu * 0.46}`, 1.6, shade(bc, 0.72)); }
  if (bel > 0 && bare) { if (0) for (const sd of [-1, 1]) Tp.stroke(`M${sd * (ww + bel) * 0.9} ${yW + hu * 0.12} q${-sd * hu * 0.06} ${hu * 0.03} ${-sd * hu * 0.1} 0`, 1.3, dk); }
  if (bare) {
    if (!a.fem && !bel && a.build !== 'skinny') for (const sd of [-1, 1]) piece(Tp, [[sd * cw * 0.06, ySh + hu * 0.52], [sd * cw * 0.5, ySh + hu * 0.44], [sd * cw * 0.92, ySh + hu * 0.5], [sd * cw * 0.86, ySh + hu * 0.66], [sd * cw * 0.55, ySh + hu * 0.86], [sd * cw * 0.12, ySh + hu * 0.88]], shade(sk, 0.9));   // a pec, firm only at its lower edge
    Tp.stroke(`M${-sw * 0.62} ${ySh + hu * 0.06} Q${-shn * 1.4} ${ySh + hu * 0.18} ${-shn * 0.4} ${ySh + hu * 0.2} M${sw * 0.62} ${ySh + hu * 0.06} Q${shn * 1.4} ${ySh + hu * 0.18} ${shn * 0.4} ${ySh + hu * 0.2}`, 1.4, dk);
    Tp.stroke(`M${-hu * 0.04} ${ySh + hu * 0.24} l${hu * 0.04} ${hu * 0.06} l${hu * 0.04} ${-hu * 0.06}`, 1.2, dk);
    if (!a.fem) Tp.stroke(`M${-cw * 0.8} ${ySh + hu * 0.82} Q${-cw * 0.3} ${ySh + hu * 1.0} 0 ${ySh + hu * 0.74} M${cw * 0.12} ${ySh + hu * 0.82} Q${cw * 0.5} ${ySh + hu * 0.98} ${cw * 0.82} ${ySh + hu * 0.78}`, 1.5, dk);
    if (a.abs) for (let q = 0; q < a.abs / 2; q++) for (const sd of [-1, 1]) { const y0 = yCh + hu * (0.22 + q * 0.26) + (sd > 0 ? hu * 0.03 : 0); Tp.stroke(`M${sd * ww * 0.1} ${y0} Q${sd * ww * 0.27} ${y0 + hu * 0.04} ${sd * ww * 0.42} ${y0 - hu * 0.01}`, a.build === 'skinny' ? 0.9 : 1.3, a.build === 'skinny' ? shade(sk, 0.86) : dk); }
    Tp.ell(0, yW + hu * 0.12, hu * 0.02, hu * 0.03, dk);
    if (a.chestHair) for (const [tx, ty, ts] of [[-0.48, 0.56, 1.0], [-0.2, 0.5, 1.35], [0.12, 0.53, 0.8], [0.4, 0.58, 1.15], [-0.05, 0.72, 0.6], [0.6, 0.66, 0.55]]) { const cx = tx * cw, cy = ySh + hu * ty, s = hu * 0.12 * ts, n = 6 + Math.floor(rr() * 3), pts: Pt[] = []; for (let q = 0; q < n; q++) { const t = q / n * Math.PI * 2, f = 0.65 + rr() * 0.45; pts.push([cx + Math.cos(t) * s * 1.5 * f, cy + Math.sin(t) * s * 0.75 * f]); } piece(Tp, pts, shade(a.hc, 0.95 + rr() * 0.2)); }
    if (a.tat && a.tat.chest) { const x = -cw * 0.55, y0 = ySh + hu * 0.18; Tp.path(`M${x + cw * 0.35} ${y0} Q${x} ${y0 - hu * 0.12} ${x - cw * 0.42} ${y0 + hu * 0.05} L${x - cw * 0.2} ${y0 + hu * 0.22} L${x} ${y0 + hu * 0.12} L${x + cw * 0.15} ${y0 + hu * 0.32} L${x + cw * 0.25} ${y0 + hu * 0.14}Z`, shade(sk, 0.4)); }
  }
  if (a.stripes) for (let i = -2; i <= 2; i++) { const sx = i * cw * 0.4; Tp.poly([[sx - hu * 0.06, ySh + hu * 0.1], [sx + hu * 0.06, ySh + hu * 0.1], [sx * 0.8 + hu * 0.06, yC], [sx * 0.8 - hu * 0.06, yC]], '#1b1b1d'); }
  if (a.tie && !bk) { Tp.poly([[-hu * 0.18, yN + hu * 0.1], [hu * 0.18, yN + hu * 0.1], [0, ySh + hu * 0.7]], '#f4f1e8'); Tp.poly([[-hu * 0.05, yN + hu * 0.12], [hu * 0.05, yN + hu * 0.12], [hu * 0.08, ySh + hu * 0.75], [0, ySh + hu * 0.85], [-hu * 0.08, ySh + hu * 0.75]], a.tie); }
  // the trunks (or the top of the trousers), then a top
  const G = pen(to, 0.47, 'torso');
  if (a.jeans) { piece(G, [[-hw * 1.04, yW + hu * 0.35], [hw * 1.05, yW + hu * 0.34], [hw * 1.08, yC + hu * 0.3], [-hw * 1.07, yC + hu * 0.3]], legC); piece(G, [[-hw * 1.06, yW + hu * 0.3], [hw * 1.06, yW + hu * 0.28], [hw * 1.06, yW + hu * 0.46], [-hw * 1.06, yW + hu * 0.48]], '#2a1a10'); G.poly([[-hu * 0.15, yW + hu * 0.29], [hu * 0.15, yW + hu * 0.29], [hu * 0.15, yW + hu * 0.49], [-hu * 0.15, yW + hu * 0.49]], '#c9a24a'); }
  else { const tw = Math.max(ww + bel * 0.6, hw) * 1.05, bw2 = Math.max(hw, ww) * 1.08, LK = 1; piece(G, [[-tw, yW + hu * 0.3], [tw, yW + hu * 0.28], [bw2, yC + hu * 0.05], [bw2 * 0.35, yC + hu * 0.42 * LK], [-bw2 * 0.35, yC + hu * 0.44 * LK], [-bw2, yC + hu * 0.06]], a.gear); piece(G, [[-tw * 1.01, yW + hu * 0.27], [tw * 1.01, yW + hu * 0.25], [tw * 1.01, yW + hu * 0.4], [-tw * 1.01, yW + hu * 0.42]], a.g2); }
  if (a.top === 'halter' || (a.top === 'crop' && a.fem && !K)) { piece(G, [[-cw * 0.98, ySh + hu * 0.42], [0, ySh + hu * 0.2], [cw * 0.98, ySh + hu * 0.42], [cw * 0.9, yCh - hu * 0.05], [0, yCh + hu * 0.05], [-cw * 0.9, yCh - hu * 0.05]], a.topC!); G.stroke(`M${-cw * 0.3} ${ySh + hu * 0.3} L0 ${yN + hu * 0.15} L${cw * 0.3} ${ySh + hu * 0.3}`, 2.6, a.topC!); }
  else if (a.top === 'singlet') piece(G, [[-sw * 0.55, ySh], [-cw * 0.3, ySh + hu * 0.22], [cw * 0.3, ySh + hu * 0.22], [sw * 0.55, ySh], [cw * 0.98, ySh + hu * 0.5], [ww * 1.02, yW + hu * 0.3], [-ww * 1.02, yW + hu * 0.3], [-cw * 0.98, ySh + hu * 0.5]], a.topC!);
  else if (a.top === 'crop') piece(G, [[-cw * 0.97, ySh + hu * 0.35], [-cw * 0.3, ySh + hu * 0.15], [cw * 0.3, ySh + hu * 0.15], [cw * 0.97, ySh + hu * 0.35], [cw * 0.92, yCh - hu * 0.1], [cw * 0.2, yCh - hu * 0.15], [0, yCh - hu * 0.05], [-cw * 0.92, yCh - hu * 0.1]], a.topC!);
  if (a.coat) for (const sd of [-1, 1]) { piece(G, [[sd * sw * 1.0, ySh - hu * 0.02], [sd * cw * 0.42, ySh + hu * 0.1], [sd * cw * 0.5, yCh], [sd * hw * 0.75, yC + hu * 0.1], [sd * hw * 0.9, yC + px(1.6 * h)], [sd * sw * 1.32, yC + px(1.6 * h)], [sd * sw * 1.1, yW]], a.coat, true); G.stroke(`M${sd * cw * 0.42} ${ySh + hu * 0.1} L${sd * cw * 0.75} ${ySh + hu * 0.7} L${sd * cw * 0.5} ${yCh}`, 1.4, shade(a.coat, 1.8)); }
  // lettering and shapes stuck on the gear (Create a Player): on the chest, the back or the trunks
  if (K && K.layers.length) K.layers.forEach((ly, li) => {
    const onBack = ly.on === 'back'; if (onBack !== bk) return;
    const onLeg = ly.on === 'lower_body', u = onLeg ? 0.03 : 0.05, sw0 = layerSwatch(K, ly.palette_slot), sc = ly.scale || 1, ra = (ly.rot || 0) * Math.PI / 180;
    const oy = onLeg ? -(yW + hu * 0.6) * k : onBack ? 1.25 * H : 1.0 * H, cx = (ly.placement.x || 0) * u, cy = oy + (ly.placement.y || 0) * u, z0 = 0.49 + li * 0.00001;
    const place = (q: Pt[], s0: number, ang: number, dx: number, dy: number) => q.map(([x, yy]) => { const c = Math.cos(ang), s2 = Math.sin(ang), X = x * s0, Y = yy * s0; return W_(to, [cx + dx + X * c - Y * s2, cy + dy + X * s2 + Y * c]); });
    if (ly.type === 'text_decal' && ly.string) {
      const word = ly.string.slice(0, 20), nch = Array.from(word).length, span = onLeg ? hw * 1.6 * k : cw * 1.6 * k, cell = Math.min(onLeg ? 0.03 : 0.05, span / Math.max(1, nch * 6)) * sc;
      Array.from(word.toUpperCase()).forEach((ch, i) => { const lx = (i * 6 + 2.5 - (nch * 6 - 1) / 2) * cell; for (const bar of letters(ch, ly.font)) out.push({ pts: place(bar, cell, ra, Math.cos(ra) * lx, Math.sin(ra) * lx), col: sw0.c, z: pl.z + z0, lift: 0.015, own, joint: 'torso' }); });
    } else if (ly.type === 'shape_combiner' && ly.shape_id) { const size = (onLeg ? hw * 1.2 : cw * 1.4) * k * sc; shape(ly.shape_id, li + 1).forEach((pc, q) => out.push({ pts: place(pc, size, ra, 0, 0), col: q === 1 && ly.shape_id === 'buckle' ? shade(sw0.c, 0.6) : sw0.c, z: pl.z + z0 + q * 0.00002, lift: 0.02, own, joint: 'torso' })); }
  });
  rig.anchors.waist = W_(root, [0, 0.2]); rig.anchors.chest = W_(to, [0, 1.4 * H]);
  // the neck and the head
  const nk = child(to, [0, 1.95 * H], P0.head); note('head', nk, to, true);
  const Nk = pen(nk, 0.5, 'head'), neckL = a.neck * hu;
  piece(Nk, [[-shn * 1.05, hu * 0.25], [-shn * 0.82, -hu * 0.36 - neckL], [shn * 0.82, -hu * 0.36 - neckL], [shn * 1.05, hu * 0.25]], sk);
  if (!a.fem && !bk) Nk.stroke(`M${-shn * 0.6} ${-hu * 0.15 - neckL} L${-hu * 0.04} ${hu * 0.2} M${shn * 0.6} ${-hu * 0.15 - neckL} L${hu * 0.04} ${hu * 0.2}`, 1.1, dk);
  if (a.hd.adam && !bk) Nk.stroke(`M${-hu * 0.035} ${-hu * 0.05} l${hu * 0.035} ${hu * 0.06} l${hu * 0.035} ${-hu * 0.06}`, 1.4, dk);
  const Hd = pen(nk, 0.56, 'head');
  const HK = 1.16, hh = hu * HK;   // the head a touch bigger than the concept's unit, so the figure stands about 6.8 heads (critic, 29 October)
  Hd.group(0, -hh * 0.5 - neckL, (rr() - 0.5) * 4, () => headC(Hd, a, hh, rngOf(r.key + '|Ch'), bk, mk));
  rig.anchors.head = W_(nk, [0, (hh * 0.5 + neckL) * k]);
  rig.anchors.shoulders = W_(to, [0, -(ySh + hu * 0.1) * k]);
  arm('n', 0.95);
  const hn = rig.anchors.hand_n, hf = rig.anchors.hand_f; rig.anchors.hands = [(hn[0] + hf[0]) / 2, (hn[1] + hf[1]) / 2];
  const s = pl.s && Math.abs(pl.s - 1) > 0.001 ? Math.max(0.5, Math.min(1.6, pl.s)) : 1;
  if (s !== 1) {   // grow or shrink from the feet
    const pu = rot([0, -(legs(r) + 0.6)], root.a), fu: Pt = [root.x + pu[0], root.y + pu[1]], fw: Pt = [fx(fu[0]), fu[1]];
    const sc = (q: Pt, c: Pt): Pt => [c[0] + (q[0] - c[0]) * s, c[1] + (q[1] - c[1]) * s];
    for (let i = n0; i < out.length; i++) out[i].pts = out[i].pts.map(q => sc(q, fw));
    for (const j in rig.joints) { const q = sc([rig.joints[j].x, rig.joints[j].y], fu); rig.joints[j].x = q[0]; rig.joints[j].y = q[1]; }
    for (const an in rig.anchors) rig.anchors[an] = sc(rig.anchors[an], fw);
  }
  return rig;
}

/** Where the middle of a doll's head is above the waist of a standard doll, and how big its head is against the
    standard one (1): the portrait camera aims and zooms by these. */
export function headAim(r: Recipe): { y: number; s: number } {
  const a = lookOf(r, ''), h = r.h * a.hs, k = GH * h / HU;
  return { y: legs({ ...r, h }) - LEGS0 + 1.95 * h * (r.th || 1) + (HU * 1.16 * 0.5 + a.neck * HU) * k, s: h };
}
