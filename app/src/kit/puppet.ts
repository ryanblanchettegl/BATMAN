/* A wrestler as a construction paper doll (docs/plans/papercraft-engine.md, sections 1 and 2). Every part of the
   body is its own piece of card, held to the next by a brass split pin, so it can be posed: the trunk turns at the
   waist, the head at the neck, and each arm and leg at three pins. The doll is cut from a recipe; `recipeOf()`
   makes one from what the game already knows about a wrestler (the face numbers, gender, style, side and gimmick),
   so everybody in both worlds has a body with nothing added to the save. It only reads the game. */
import { W, E } from '../engine';
import { G } from '../store';
import { faceOf } from './portrait';
import { skinOf, hairOf } from '../lib/portrait';
import { Pt, Piece, PAL, shade, ell, star, almond, strip, headPoly, Head, snip } from './paper';
import { Kit, Swatch, AttireKey, layerSwatch, letters, shape, fromLook, Look } from './caw';

export interface Recipe {
  key: string; name: string; skin: string; h: number; w: number; belly: number; fem: boolean;
  head: { rx: number; ryt: number; ryb: number; sq: number; chin: number };
  hair: string; hairCol: string; beard: number; mus: number; brow: number; browAng: number; browCol: string; noseW: number; noseL: number;
  mask?: { base: string; trim: string; kind?: 'open' | 'full' | 'half' }; gear: string; gear2: string; straps: boolean; tape: boolean;
  shirt?: string; pants?: string; stripes?: boolean;
  /** A suit: the jacket and trousers, the tie and the pocket square. */
  suit?: { jacket: string; tie: string; square?: string }; headset?: boolean;
  /** From a Create a Player file (src/kit/caw.ts): torso width and height, limb length and muscle (1 is as cut), the
      three outfits, and the one being worn. */
  tw?: number; th?: number; ll?: number; mm?: number; kits?: Record<AttireKey, Kit>; kit?: Kit;
  /** Face paint (a design and its colour), tattoos (where), and a braid in a long beard. */
  paint?: { k: string; c: string }; tats?: string[]; braid?: boolean;
}
/** The joints a pose turns, in the order the studio lists them. Angles are degrees; 0 is the part hanging straight. */
export const JOINTS: [string, string][] = [
  ['torso', 'Body'], ['head', 'Head'], ['sh_n', 'Near shoulder'], ['el_n', 'Near elbow'], ['wr_n', 'Near wrist'], ['sh_f', 'Far shoulder'], ['el_f', 'Far elbow'], ['wr_f', 'Far wrist'],
  ['hip_n', 'Near hip'], ['kn_n', 'Near knee'], ['an_n', 'Near ankle'], ['hip_f', 'Far hip'], ['kn_f', 'Far knee'], ['an_f', 'Far ankle'],
];
export const STAND: Record<string, number> = { torso: 0, head: 0, sh_n: 10, el_n: 5, wr_n: 0, sh_f: -10, el_f: -5, wr_f: 0, hip_n: -4, kn_n: 0, an_n: 4, hip_f: 4, kn_f: 0, an_f: -4 };

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rgb = (c: number[]) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const HEADS: [number, number, number, number, number][] = [   // rx, ryb, sq, chin, ryt: Oval, Square, Long, Round, Heart, Lantern, Narrow, Wide, Diamond, Block
  [1.16, 1.62, 2.4, 0.25, 1.42], [1.22, 1.58, 4.0, 0.05, 1.4], [1.1, 1.78, 2.4, 0.28, 1.5], [1.26, 1.5, 2.0, 0.15, 1.42], [1.18, 1.6, 2.2, 0.42, 1.45],
  [1.2, 1.66, 4.2, 0.0, 1.38], [1.04, 1.66, 2.4, 0.3, 1.45], [1.32, 1.55, 3.0, 0.1, 1.38], [1.14, 1.64, 2.0, 0.45, 1.4], [1.28, 1.6, 4.5, 0.02, 1.36]];
const HAIRS = ['bald', 'buzz', 'crew', 'cap', 'cap', 'flat', 'mohawk', 'curls', 'long', 'long'];

/** A recipe from a wrestler in the game (or from a world file's worker, put in the same shape, with its gimmick as
    `gim`). The same wrestler always gives the same doll. Create a Player will make these by hand; until then this
    is a stand-in made from what the game already knows. */
export function recipeOf(w: W): Recipe {
  const lk: Look | null = w.look && typeof w.look === 'object' ? w.look : null;
  if (lk) { const ap = lk.appearance || {}; return fromLook(lk, plainRecipe(ap.face ? { ...w, face: { ...(w.face || {}), ...ap.face }, look: null } : { ...w, look: null })); }
  return plainRecipe(w);
}
function plainRecipe(w: W): Recipe {
  const f = faceOf(w), h = (k: string, n: number) => hash(w.name + '|' + k) % n, fem = w.g === 'F', hd = HEADS[f.h] || HEADS[0];
  const S = G.S, per = w.gim == null && S && E.persona ? E.persona(S, w.id) : null, gim = w.gim != null ? String(w.gim) : per ? ((per.cat || '') + ' ' + (per.d || '')) : '';
  const masked = /mask|lucha/i.test(gim) || /^(El|La) /.test(w.name) && h('m', 3) === 0;
  const face = w.align !== 'H';
  const pick = (a: string[], k: string) => PAL[a[h(k, a.length)]];
  const st = w.style, big = st === 'P' ? 1.28 : st === 'B' ? 1.18 : st === 'H' ? 0.88 : st === 'T' ? 0.98 : 1.05;
  const gear = face ? pick(['blue', 'red', 'white', 'green', 'gold', 'sky', 'teal', 'orange'], 'g') : pick(['black', 'maroon', 'purple', 'red', 'grey', 'navy'], 'g');
  let gear2 = pick(['gold', 'white', 'black', 'red', 'yellow', 'blue'], 'g2'); if (gear2 === gear) gear2 = PAL.white;
  const r: Recipe = {
    key: 'w' + w.id, name: w.name, skin: rgb(skinOf(f.sk)), fem,
    h: (fem ? 0.93 : 1.0) * (st === 'P' ? 1.06 : st === 'H' ? 0.94 : 1) * (0.97 + h('h', 7) * 0.01),
    w: (fem ? 0.84 : 1) * big * (0.96 + h('w', 9) * 0.01), belly: st === 'B' || st === 'P' ? 0.06 + h('b', 4) * 0.04 : 0,
    head: { rx: hd[0], ryt: hd[4], ryb: hd[1], sq: hd[2], chin: hd[3] },
    hair: HAIRS[f.hr] || 'cap', hairCol: rgb(hairOf(f.hc)), beard: f.fh, mus: f.ms, brow: f.ey === 3 ? 0.18 : f.ey === 9 ? 0.07 : 0.12, browAng: f.ey === 5 ? -0.08 : f.ey === 4 ? 0.06 : 0,
    browCol: rgb(hairOf(f.hc).map(v => v * 0.8)), noseW: [0.4, 0.55, 0.32, 0.4, 0.36, 0.42, 0.46, 0.34, 0.42, 0.5][f.ns], noseL: [0.55, 0.55, 0.55, 0.68, 0.45, 0.62, 0.58, 0.44, 0.62, 0.48][f.ns],
    gear, gear2, straps: !fem && (st === 'P' || st === 'B') && h('s', 2) === 0, tape: h('t', 3) > 0,
  };
  if (fem) { r.straps = true; }
  if (masked) r.mask = { base: pick(['gold', 'red', 'blue', 'white', 'black', 'green', 'purple', 'silver' in PAL ? 'silver' : 'steel'], 'mb'), trim: pick(['red', 'gold', 'black', 'white', 'sky'], 'mt') };
  return r;
}
export const REF: Recipe = {
  key: 'ref', name: 'Referee', skin: rgb(skinOf(22)), fem: false, h: 0.98, w: 0.95, belly: 0.05, head: { rx: 1.16, ryt: 1.42, ryb: 1.6, sq: 2.6, chin: 0.25 },
  hair: 'crew', hairCol: rgb(hairOf(64)), beard: 0, mus: 0, brow: 0.08, browAng: 0, browCol: rgb(hairOf(64)), noseW: 0.4, noseL: 0.55,
  gear: PAL.black, gear2: PAL.black, straps: false, tape: false, shirt: PAL.white, pants: PAL.black, stripes: true,
};
/** A stand-in for a slot nobody has been cast in: a plain card figure. */
/** A commentator in a suit and a headset, for a slot dressed for the desk that nobody has been cast in. */
export function commentator(i: number): Recipe {
  const J = [PAL.navy, '#2c2c34', '#4a1c22', '#24324a'][i % 4], T = [PAL.red, PAL.gold, PAL.sky, PAL.green][i % 4];
  return { ...REF, key: 'desk' + i, name: ['Play-by-play', 'Colour', 'A guest'][i] || 'Commentator', skin: rgb(skinOf([18, 34, 60, 46][i % 4])), hair: ['cap', 'buzz', 'crew', 'cap'][i % 4], hairCol: rgb(hairOf([30, 64, 48, 8][i % 4])),
    browCol: rgb(hairOf([30, 64, 48, 8][i % 4]).map(v => v * 0.8)), mus: i === 1 ? 2 : 0, beard: 0, w: 0.98, h: 0.98, belly: i === 1 ? 0.08 : 0.02,
    shirt: J, pants: J, stripes: false, suit: { jacket: J, tie: T, square: i === 0 ? PAL.white : T }, headset: true };
}
/** Dress whoever plays a slot for the desk: a suit (theirs, if they have one) and a headset. */
export function dress(r: Recipe, i: number): Recipe { if (r.kits && r.kits.street_clothes.top === 'suit_jacket') { const s = r.kits.street_clothes; return { ...r, kit: s, suit: { jacket: s.col.top.c, tie: s.pal.t.c, square: s.pal.h.c }, headset: true }; } if (r.suit && !r.kit) return { ...r, headset: true }; const c = commentator(i); return { ...r, kit: undefined, shirt: c.shirt, pants: c.pants, stripes: false, suit: c.suit, headset: true, straps: false, tape: false, mask: r.mask }; }
export function blank(i: number): Recipe {
  return { ...REF, key: 'blank' + i, name: ['Wrestler A', 'Wrestler B', 'Wrestler C', 'Wrestler D'][i] || 'Wrestler', skin: '#c9a184', hair: 'bald', shirt: undefined, pants: undefined, stripes: false, gear: [PAL.blue, PAL.red, PAL.green, PAL.gold][i % 4], gear2: PAL.white, tape: true, w: 1.05, h: 1 };
}

/** How long the legs are: a figure stands on the mat whatever its height. */
export const legs = (r: Recipe) => (1.3 + 1.22) * r.h * (r.ll || 1);
export const LEGS0 = 1.3 + 1.22;

/* ---------- the joints ---------- */
type F = { x: number; y: number; a: number };
const rot = (p: Pt, a: number): Pt => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const child = (f: F, off: Pt, ang: number): F => { const d = rot(off, f.a); return { x: f.x + d[0], y: f.y + d[1], a: f.a + ang * Math.PI / 180 }; };
function taper(w0: number, w1: number, L: number): Pt[] {
  const o: Pt[] = [];
  for (let i = 0; i <= 8; i++) { const a = -Math.PI * i / 8; o.push([w1 / 2 * Math.cos(a), -L + w1 / 2 * Math.sin(a)]); }
  for (let i = 0; i <= 8; i++) { const a = Math.PI * i / 8; o.push([-w0 / 2 * Math.cos(a), w0 / 2 * Math.sin(a)]); }
  return o;
}

/** Where a doll stands: its waist, its turn, which way it faces, how far forward, and its size (1 is as cut; a giant
    is 1.3, a small one 0.8). A doll grows and shrinks from its feet, so it stays standing where it stood. */
export interface Place { x: number; y: number; r: number; f: number; z: number; s?: number; lz?: Record<string, number> }
/** Marks on a person: blood (1 a cut, 2 a trickle, 3 a face covered), sweat, tears, a bruise. */
export interface Marks { blood?: number; sweat?: boolean; tears?: boolean; bruise?: boolean }
/** The faces a doll can pull. */
export const EXPR: [string, string][] = [['', 'Calm'], ['talk', 'Talking'], ['shout', 'Shouting'], ['roar', 'Roaring'], ['snarl', 'Snarling'], ['smirk', 'Smirking'], ['hurt', 'Hurt'], ['pain', 'In pain'], ['cry', 'Crying'], ['shut', 'Eyes shut']];
const BLOOD = '#9e1414', BLOOD2 = '#c42a22', WET = '#bfe6ff';
/** Where each joint ended up: for dragging a part round its pin, and for anchoring props to a hand. */
export interface Rig { joints: Record<string, { x: number; y: number; pa: number; up: boolean }>; anchors: Record<string, Pt>; rootx: number; f: number }

/** Cut and pin a doll. `pl` places its waist and turns it; `pose` is angles in degrees; `expr` is calm, shout or hurt. */
export function puppet(r: Recipe, pl: Place, pose: Record<string, number>, expr: string, own: string, out: Piece[], mk: Marks = {}): Rig {
  const n0 = out.length;
  const P = { ...STAND, ...pose }, h = r.h, w = r.w, sk = r.skin, dk = shade(sk, 0.74), seed = hash(r.key);
  const ll = r.ll || 1, H = h * (r.th || 1), mm = r.mm || 1, K = r.kit;
  const aw = w * (0.8 + 0.2 * mm), bw = w * (r.tw || 1) * (1 + (mm - 1) * 0.3);   // limbs thicken with muscle; the chest with the torso and muscle sliders
  const y = pl.y + (legs(r) - LEGS0) * Math.cos(pl.r * Math.PI / 180);   // a taller doll's waist sits higher, so its feet stay on the mat
  const root: F = { x: pl.x, y, a: pl.r * Math.PI / 180 }, fx = pl.f < 0 ? (px: number) => 2 * pl.x - px : (px: number) => px;
  const W_ = (f: F, poly: Pt[]): Pt[] => poly.map(p => { const d = rot(p, f.a); return [fx(f.x + d[0]), f.y + d[1]] as Pt; });
  const rig: Rig = { joints: {}, anchors: {}, rootx: pl.x, f: pl.f };
  let n = 0;
  const cut = (f: F, poly: Pt[], col: string | Swatch, z: number, joint?: string, lift = 0.09, rough = 0.012) => {
    const c = typeof col === 'string' ? col : col.c, fin = typeof col === 'string' ? undefined : col.f;
    out.push({ pts: snip(W_(f, poly), seed + (n++) * 977, rough, 0.08), col: c, z: pl.z + z, lift, own, joint, fin: fin && fin !== 'matte' ? fin : undefined });
  };
  const pins: [F, number][] = [];
  const L = { up: 1.0 * h * ll, fore: 0.92 * h * ll, thigh: 1.3 * h * ll, shin: 1.22 * h * ll, torso: 1.95 * H };
  const note = (name: string, f: F, parent: F, up = false) => { rig.joints[name] = { x: f.x, y: f.y, pa: parent.a, up }; };
  const has = (a: string) => !!K && K.acc.indexOf(a) >= 0;
  const OVER = ['shirt_tshirt_base', 'hoodie_01', 'jacket_leather_biker', 'robe_long', 'suit_jacket'];   // tops with sleeves to the wrist (the T-shirt only to the elbow)
  const to = child(root, [0, 0], P.torso);
  note('torso', to, root, true);
  const arm = (s: 'n' | 'f', z: number) => {
    const sh = child(to, [(s === 'n' ? 0.74 : -0.74) * bw, L.torso - 0.12], P['sh_' + s]); note('sh_' + s, sh, to);
    let up: string | Swatch = r.suit ? r.suit.jacket : r.shirt && r.stripes ? r.shirt : sk, fore: string | Swatch = r.suit ? r.suit.jacket : sk;
    if (K) { up = sk; fore = sk; if (OVER.indexOf(K.top) >= 0) { up = K.col.top; if (K.top !== 'shirt_tshirt_base') fore = K.col.top; } }
    const robe = !!K && K.top === 'robe_long', rw = robe ? 1.25 : 1;
    cut(sh, taper(0.46 * aw * rw, 0.36 * aw * rw, L.up), up, z, 'sh_' + s); cut(sh, ell(0, -0.08, 0.27 * aw * rw, 0.32 * aw * rw, 14), up, z + 0.02, 'sh_' + s); pins.push([sh, z + 0.03]);
    if (K && K.top === 'shirt_tshirt_base') {   // a short sleeve with its hem
      cut(sh, ell(0, -0.08, 0.3 * aw, 0.35 * aw, 14).concat([[0.26 * aw, -0.5 * L.up], [-0.26 * aw, -0.5 * L.up]]), K.col.top, z + 0.021, 'sh_' + s);
      cut(sh, [[-0.26 * aw, -0.44 * L.up], [0.26 * aw, -0.44 * L.up], [0.26 * aw, -0.52 * L.up], [-0.26 * aw, -0.52 * L.up]], K.pal.t, z + 0.022, 'sh_' + s, 0.02, 0.004);
    }
    const tat = r.tats || [], ink = inkOf(sk), sleeve = tat.indexOf(s === 'n' ? 'sleeve_near' : 'sleeve_far') >= 0;
    if (up === sk && sleeve) { for (const t of [0.22, 0.5, 0.78]) cut(sh, [[-0.22 * aw, -t * L.up + 0.04], [0.22 * aw, -t * L.up], [0.21 * aw, -t * L.up - 0.06], [-0.21 * aw, -t * L.up - 0.02]], ink, z + 0.0205, 'sh_' + s, 0.005, 0.004); cut(sh, [[0, -0.3 * L.up], [0.12 * aw, -0.37 * L.up], [0, -0.44 * L.up], [-0.12 * aw, -0.37 * L.up]], ink, z + 0.0206, 'sh_' + s, 0.005, 0.003); }
    if (up === sk && s === 'n' && tat.indexOf('shoulder') >= 0) cut(sh, [[-0.24 * aw, 0.1], [0.24 * aw, 0.12], [0.1 * aw, -0.12], [0.2 * aw, -0.36], [0, -0.2], [-0.12 * aw, -0.42], [-0.08 * aw, -0.14]], ink, z + 0.0207, 'sh_' + s, 0.005, 0.004);   // a tribal piece on the shoulder
    if (has('armband')) cut(sh, [[-0.25 * aw, -0.45 * L.up], [0.25 * aw, -0.45 * L.up], [0.24 * aw, -0.58 * L.up], [-0.24 * aw, -0.58 * L.up]], K!.pal.t, z + 0.025, 'sh_' + s, 0.02, 0.004);
    const el = child(sh, [0, -L.up], P['el_' + s]); note('el_' + s, el, sh);
    cut(el, taper(0.36 * aw * rw, 0.29 * aw * rw * (robe ? 1.3 : 1), L.fore), fore, z + 0.04, 'el_' + s); pins.push([el, z + 0.07]);
    if (fore === sk && sleeve) for (const t of [0.25, 0.55]) cut(el, [[-0.17 * aw, -t * L.fore], [0.17 * aw, -t * L.fore + 0.03], [0.16 * aw, -t * L.fore - 0.05], [-0.16 * aw, -t * L.fore - 0.08]], ink, z + 0.045, 'el_' + s, 0.005, 0.004);
    if (has('elbow_pads')) cut(el, ell(0, -0.02, 0.22 * aw, 0.2 * aw, 12), K!.pal.s, z + 0.065, 'el_' + s, 0.04);
    if (r.suit) cut(el, [[-0.16 * aw, -L.fore + 0.16], [0.16 * aw, -L.fore + 0.16], [0.15 * aw, -L.fore + 0.02], [-0.15 * aw, -L.fore + 0.02]], PAL.white, z + 0.06, 'el_' + s, 0.02, 0.004);   // the shirt cuff
    else if (K && OVER.indexOf(K.top) >= 0 && K.top !== 'shirt_tshirt_base') cut(el, [[-0.17 * aw * rw, -L.fore + 0.18], [0.17 * aw * rw * (robe ? 1.3 : 1), -L.fore + 0.18], [0.16 * aw * rw * (robe ? 1.3 : 1), -L.fore + 0.02], [-0.16 * aw * rw, -L.fore + 0.02]], K.pal.t, z + 0.06, 'el_' + s, 0.02, 0.004);   // a cuff in the trim
    if (has('wrist_wraps')) cut(el, [[-0.18 * aw, -L.fore + 0.34], [0.18 * aw, -L.fore + 0.3], [0.17 * aw, -L.fore + 0.02], [-0.17 * aw, -L.fore + 0.02]], K!.pal.s, z + 0.061, 'el_' + s, 0.02, 0.006);
    if (r.tape || has('wrist_tape_white')) cut(el, [[-0.17 * aw, -L.fore + 0.25], [0.17 * aw, -L.fore + 0.25], [0.16 * aw, -L.fore + 0.02], [-0.16 * aw, -L.fore + 0.02]], PAL.white, z + 0.06, 'el_' + s, 0.02, 0.006);
    const wr = child(el, [0, -L.fore], P['wr_' + s]); note('wr_' + s, wr, el);
    cut(wr, ell(0.02, -0.17, 0.17 * aw, 0.22, 12), sk, z + 0.08, 'wr_' + s);
    if (has('gloves_fingerless')) { cut(wr, ell(0.02, -0.12, 0.17 * aw, 0.15, 12), K!.pal.s, z + 0.09, 'wr_' + s, 0.02); cut(wr, [[-0.16 * aw, 0.02], [0.16 * aw, 0.02], [0.16 * aw, -0.06], [-0.16 * aw, -0.06]], K!.pal.t, z + 0.095, 'wr_' + s, 0.02, 0.004); }
    const hand = W_(wr, [[0.02, -0.17]])[0]; rig.anchors['hand_' + s] = hand;
  };
  const LONG = ['tights_long_01', 'jeans_distressed', 'trousers_suit'];
  const leg = (s: 'n' | 'f', z: number) => {
    const hp = child(root, [(s === 'n' ? 0.32 : -0.32) * w, -0.42], P['hip_' + s]); note('hip_' + s, hp, root);
    const thighC: string | Swatch = K ? (LONG.indexOf(K.bottom) >= 0 || K.bottom === 'shorts_fight' ? K.col.bottom : sk) : r.pants || sk;
    const shinC: string | Swatch = K ? (LONG.indexOf(K.bottom) >= 0 ? K.col.bottom : sk) : r.pants || sk;
    cut(hp, taper(0.66 * aw, 0.46 * aw, L.thigh), thighC, z, 'hip_' + s); pins.push([hp, z + 0.03]);
    if (K) {
      if (K.bottom === 'trunks_long' || K.top === 'singlet_full') { cut(hp, [[-0.34 * aw, 0.1], [0.34 * aw, 0.1], [0.3 * aw, -0.45 * L.thigh], [-0.3 * aw, -0.45 * L.thigh]], K.top === 'singlet_full' ? K.col.top : K.col.bottom, z + 0.015, 'hip_' + s); cut(hp, [[-0.3 * aw, -0.4 * L.thigh], [0.3 * aw, -0.4 * L.thigh], [0.3 * aw, -0.47 * L.thigh], [-0.3 * aw, -0.47 * L.thigh]], K.pal.t, z + 0.017, 'hip_' + s, 0.02, 0.004); }
      if (K.bottom === 'shorts_fight') { cut(hp, [[0.05, 0], [0.22 * aw, 0], [0.18 * aw, -0.9 * L.thigh], [0.02, -0.9 * L.thigh]], K.pal.s, z + 0.015, 'hip_' + s, 0.02); cut(hp, [[-0.25 * aw, -0.86 * L.thigh], [0.25 * aw, -0.86 * L.thigh], [0.24 * aw, -0.95 * L.thigh], [-0.24 * aw, -0.95 * L.thigh]], K.pal.t, z + 0.017, 'hip_' + s, 0.02, 0.004); }
      if (K.bottom === 'tights_long_01') cut(hp, strip([0, 0.05], [0, -L.thigh + 0.05], 0.08, 0.06), K.pal.t, z + 0.015, 'hip_' + s, 0.02, 0.004);
      if (K.bottom === 'trousers_suit') cut(hp, strip([0.05, -0.1], [0.04, -L.thigh + 0.05], 0.025, 0.02), shade(K.col.bottom.c, 0.7), z + 0.015, 'hip_' + s, 0.01, 0.003);
      if (K.bottom === 'jeans_distressed' && s === 'n') cut(hp, [[-0.1, -0.55 * L.thigh], [0.12, -0.5 * L.thigh], [0.18, -0.6 * L.thigh], [0.05, -0.66 * L.thigh], [-0.12, -0.62 * L.thigh]], sk, z + 0.015, 'hip_' + s, 0.01, 0.02);   // a rip
    }
    const kn = child(hp, [0, -L.thigh], P['kn_' + s]); note('kn_' + s, kn, hp);
    cut(kn, taper(0.47 * aw, 0.36 * aw, L.shin), shinC, z + 0.03, 'kn_' + s); pins.push([kn, z + 0.06]);
    if (K && K.bottom === 'tights_long_01') cut(kn, strip([0, 0.02], [0, -L.shin + 0.1], 0.06, 0.05), K.pal.t, z + 0.035, 'kn_' + s, 0.02, 0.004);
    if (K && K.bottom === 'jeans_distressed' && s === 'n') cut(kn, [[-0.12, 0.05], [0.12, 0.08], [0.16, -0.06], [0.0, -0.1], [-0.14, -0.05]], sk, z + 0.035, 'kn_' + s, 0.01, 0.02);
    const shinGear = (top: number, col: Swatch | string) => cut(kn, [[-0.2 * aw, -L.shin * top], [0.2 * aw, -L.shin * top], [0.19 * aw, -L.shin + 0.05], [-0.19 * aw, -L.shin + 0.05]], col, z + 0.05, 'kn_' + s, 0.03);
    if (!K) {
      if (!r.pants) { cut(kn, ell(0, -0.05, 0.21 * aw, 0.24 * aw, 14), r.gear2, z + 0.05, 'kn_' + s, 0.03); shinGear(0.42, r.gear); }
    } else {
      if (K.feet === 'boots_knee') { cut(kn, ell(0, -0.05, 0.21 * aw, 0.24 * aw, 14), K.pal.t, z + 0.055, 'kn_' + s, 0.03); shinGear(0.42, K.col.feet); }
      else if (K.feet === 'kick_pads') { cut(kn, [[-0.22 * aw, -0.02], [0.3 * aw, -0.06], [0.32 * aw, -L.shin * 0.5], [0.26 * aw, -L.shin + 0.02], [-0.2 * aw, -L.shin + 0.02]], K.col.feet, z + 0.05, 'kn_' + s, 0.05); for (const t of [0.3, 0.62]) cut(kn, [[0.0, -L.shin * t], [0.31 * aw, -L.shin * t - 0.02], [0.31 * aw, -L.shin * t - 0.08], [0.0, -L.shin * t - 0.06]], K.pal.t, z + 0.052, 'kn_' + s, 0.01, 0.003); }
      else if (K.feet === 'boots_laced_heavy') { shinGear(0.4, K.col.feet); for (let i = 0; i < 4; i++) { const yy = -L.shin * (0.48 + i * 0.12); cut(kn, [[0.08 * aw, yy], [0.21 * aw, yy - 0.02], [0.21 * aw, yy - 0.06], [0.08 * aw, yy - 0.04]], K.pal.t, z + 0.06, 'kn_' + s, 0.01, 0.003); } }
      else if (K.feet === 'boots_short') shinGear(0.78, K.col.feet);
      if (has('knee_sleeves') && K.feet !== 'boots_knee') cut(kn, [[-0.25 * aw, 0.25], [0.25 * aw, 0.25], [0.22 * aw, -0.3], [-0.22 * aw, -0.3]], K.pal.s, z + 0.054, 'kn_' + s, 0.02);
      if (has('knee_pads') && K.feet !== 'boots_knee') cut(kn, ell(0, -0.05, 0.22 * aw, 0.25 * aw, 14), K.pal.s, z + 0.056, 'kn_' + s, 0.03);
    }
    const an = child(kn, [0, -L.shin], P['an_' + s]); note('an_' + s, an, kn);
    const ft = K ? K.feet : '', bare = ft === 'barefoot' || ft === 'kick_pads', small = bare || ft === 'shoes_dress';
    const foot: Pt[] = small ? [[-0.2 * aw, 0.1], [0.18 * aw, 0.1], [0.22 * aw, -0.12], [0.5 * aw, -0.16], [0.52 * aw, -0.3], [-0.22 * aw, -0.3]] : [[-0.22 * aw, 0.12], [0.2 * aw, 0.12], [0.24 * aw, -0.12], [0.55 * aw, -0.14], [0.58 * aw, -0.3], [-0.24 * aw, -0.3]];
    const footC: string | Swatch = !K ? (r.pants ? PAL.black : r.gear) : bare ? sk : ft === 'shoes_dress' ? { c: PAL.black, f: 'leather' } : K.col.feet;
    cut(an, foot, footC, z + 0.07, 'an_' + s);
    if (ft === 'kick_pads') cut(an, [[-0.05 * aw, 0.1], [0.2 * aw, 0.1], [0.3 * aw, -0.14], [0.05 * aw, -0.14]], K!.col.feet, z + 0.075, 'an_' + s, 0.02, 0.004);   // the strap over the instep
    if (ft === 'sneakers_retro' || ft === 'boots_laced_heavy') cut(an, [[-0.25 * aw, -0.22], [0.6 * aw, -0.22], [0.6 * aw, -0.32], [-0.25 * aw, -0.32]], ft === 'sneakers_retro' ? K!.pal.t : PAL.black, z + 0.075, 'an_' + s, 0.02, 0.004);   // the sole
    if (ft === 'sneakers_retro') cut(an, strip([-0.1 * aw, 0.0], [0.35 * aw, -0.12], 0.06, 0.04), K!.pal.t, z + 0.078, 'an_' + s, 0.02, 0.003);
    rig.anchors['foot_' + s] = W_(an, [[0.15 * aw, -0.3]])[0];
  };
  arm('f', 0 + ((pl.lz || {}).arm_f || 0)); leg('f', 0.12 + ((pl.lz || {}).leg_f || 0)); leg('n', 0.24 + ((pl.lz || {}).leg_n || 0));
  // the trunks, or the bottom of whatever is worn on the legs
  const trunks: [number, number][] = [[-0.62 * w, 0.06], [0.62 * w, 0.06], [0.66 * w, -0.5], [0.1 * w, -0.62], [-0.1 * w, -0.62], [-0.66 * w, -0.5]];
  cut(root, trunks, K ? (K.top === 'singlet_full' ? K.col.top : K.col.bottom) : r.pants || r.gear, 0.36, 'body');
  if (K) {
    if (K.bottom === 'trunks_brief_01' || K.bottom === 'trunks_long' || K.bottom === 'shorts_fight') cut(root, [[-0.62 * w, 0.06], [0.62 * w, 0.06], [0.63 * w, -0.06], [-0.63 * w, -0.06]], K.pal.t, 0.37, 'body', 0.02, 0.004);
    if (K.bottom === 'jeans_distressed' || K.bottom === 'trousers_suit') { cut(root, [[-0.63 * w, 0.06], [0.63 * w, 0.06], [0.64 * w, -0.08], [-0.64 * w, -0.08]], K.bottom === 'trousers_suit' ? { c: PAL.black, f: 'leather' } : { c: '#3a2414', f: 'leather' }, 0.37, 'body', 0.02, 0.004); cut(root, [[0.1, 0.07], [0.32, 0.07], [0.32, -0.09], [0.1, -0.09]], K.pal.h, 0.375, 'body', 0.02, 0.003); }
    if (K.top === 'singlet_straps_down') for (const sd of [-1, 1]) cut(root, strip([sd * 0.42 * w, 0.02], [sd * 0.5 * w, -0.85], 0.16, 0.14, sd * 0.05), K.col.top, 0.38, 'body', 0.03);
    if (K.bottom === 'skirt_short') { cut(root, [[-0.66 * w, 0.08], [0.66 * w, 0.08], [0.95 * w, -0.85], [-0.9 * w, -0.85]], K.col.bottom, 0.385, 'body', 0.05); cut(root, [[-0.9 * w, -0.76], [0.94 * w, -0.76], [0.95 * w, -0.85], [-0.9 * w, -0.85]], K.pal.t, 0.39, 'body', 0.02, 0.004); }
    if (K.top === 'robe_long') { cut(root, [[-0.72 * bw, 0.1], [0.72 * bw, 0.1], [1.05 * bw, -2.0 * h * ll], [-1.0 * bw, -2.0 * h * ll]], K.col.top, 0.385, 'body', 0.06); cut(root, [[-1.0 * bw, -1.86 * h * ll], [1.04 * bw, -1.86 * h * ll], [1.05 * bw, -2.0 * h * ll], [-1.0 * bw, -2.0 * h * ll]], K.pal.t, 0.39, 'body', 0.02, 0.005); }
  }
  const b = r.belly;
  const torsoPoly: Pt[] = [[-0.58 * bw - b, 0], [0.58 * bw + b, 0], [0.68 * bw + b * 0.8, 0.55], [0.86 * bw, 1.45 * H], [0.74 * bw, 1.86 * H], [0.28, 1.98 * H], [-0.28, 1.98 * H], [-0.74 * bw, 1.86 * H], [-0.86 * bw, 1.45 * H], [-0.68 * bw - b * 0.8, 0.55]];
  const covered = K ? ['shirt_tshirt_base', 'shirt_tank', 'jacket_leather_biker', 'robe_long', 'hoodie_01', 'suit_jacket'].indexOf(K.top) >= 0 : !!r.shirt;
  cut(to, torsoPoly, K ? (covered ? K.col.top : sk) : r.shirt || sk, 0.42, 'torso');
  pins.push([to, 0.55]);
  const muscles = () => {
    cut(to, [[0.05, 1.2 * H], [0.75 * bw, 1.25 * H], [0.6 * bw, 1.05 * H], [0.1, 1.08 * H]], dk, 0.45, 'torso', 0.02);
    cut(to, [[-0.75 * bw, 1.25 * H], [-0.05, 1.2 * H], [-0.1, 1.08 * H], [-0.6 * bw, 1.05 * H]], dk, 0.45, 'torso', 0.02);
    cut(to, [[0.5 * bw + b * 0.6, 0.1], [0.62 * bw + b * 0.7, 0.1], [0.8 * bw, 1.4 * H], [0.68 * bw, 1.4 * H]], dk, 0.45, 'torso', 0.02);
  };
  const suitBits = (J: string, tie: string, sq?: string) => {   // the shirt and tie in the opening of the jacket, the lapels either side, a pocket square
    const lap = shade(J, 0.72);
    cut(to, [[-0.3 * bw, 1.98 * H], [0.3 * bw, 1.98 * H], [0.06, 0.95 * H], [-0.06, 0.95 * H]], PAL.white, 0.45, 'torso', 0.02, 0.004);
    cut(to, [[-0.07, 1.9 * H], [0.07, 1.9 * H], [0.11, 1.05 * H], [0, 0.92 * H], [-0.11, 1.05 * H]], tie, 0.46, 'torso', 0.02, 0.004);
    cut(to, [[-0.08, 1.93 * H], [0.08, 1.93 * H], [0.06, 1.8 * H], [-0.06, 1.8 * H]], shade(tie, 0.75), 0.47, 'torso', 0.01, 0.002);   // the knot
    for (const sd of [-1, 1]) cut(to, [[sd * 0.3 * bw, 1.98 * H], [sd * 0.5 * bw, 1.92 * H], [sd * 0.34 * bw, 1.5 * H], [sd * 0.08, 0.95 * H]], lap, 0.48, 'torso', 0.03, 0.004);
    cut(to, [[0.42 * bw, 1.45 * H], [0.62 * bw, 1.45 * H], [0.6 * bw, 1.35 * H], [0.43 * bw, 1.35 * H]], sq || PAL.white, 0.49, 'torso', 0.02, 0.003);
    for (const yy of [0.7, 0.45]) cut(to, ell(0.08 * bw, yy * H, 0.04, 0.04, 8), shade(J, 0.5), 0.49, 'torso', 0.01, 0.002);   // buttons
  };
  if (!K) {
    if (!r.shirt) {
      muscles();
      if (r.straps) for (const s of [-1, 1]) cut(to, [[s * 0.3 * bw, 1.95 * H], [s * 0.52 * bw, 1.9 * H], [s * 0.5 * bw, 0], [s * 0.22 * bw, 0]], r.gear, 0.47, 'torso', 0.03);
      if (r.fem) cut(to, [[-0.66 * bw, 1.62 * H], [0.66 * bw, 1.62 * H], [0.6 * bw, 1.12 * H], [-0.6 * bw, 1.12 * H]], r.gear, 0.48, 'torso', 0.03);
    } else if (r.suit) suitBits(r.suit.jacket, r.suit.tie, r.suit.square);
    else if (r.stripes) {
      for (let i = -2; i <= 2; i++) { const sx = i * 0.3 * bw; cut(to, [[sx - 0.07, 0.05], [sx + 0.07, 0.05], [sx * 1.25 + 0.07, 1.85 * H], [sx * 1.25 - 0.07, 1.85 * H]], PAL.black, 0.45, 'torso', 0.02, 0.004); }
    }
  } else {
    const t = K.top, S = K.col.top, T = K.pal.t;
    if (!covered) muscles();
    if (t === 'singlet_straps_up' || t === 'singlet_full') {
      cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.7 * bw + b * 0.8, 0.55], [0.84 * bw, 1.3 * H], [0.5 * bw, 1.36 * H], [0.22 * bw, 1.2 * H], [-0.22 * bw, 1.2 * H], [-0.5 * bw, 1.36 * H], [-0.84 * bw, 1.3 * H], [-0.7 * bw - b * 0.8, 0.55]], S, 0.46, 'torso', 0.03);
      for (const s of [-1, 1]) cut(to, [[s * 0.3 * bw, 1.95 * H], [s * 0.52 * bw, 1.9 * H], [s * 0.52 * bw, 1.3 * H], [s * 0.3 * bw, 1.22 * H]], S, 0.47, 'torso', 0.03);
      cut(to, strip([-0.84 * bw, 1.3 * H], [0.84 * bw, 1.3 * H], 0.05, 0.05, -0.1 * H), T, 0.475, 'torso', 0.01, 0.003);
    } else if (t === 'singlet_straps_down') cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.66 * bw + b * 0.9, 0.38], [-0.66 * bw - b * 0.9, 0.38]], S, 0.46, 'torso', 0.03);
    else if (t === 'top_sports') { cut(to, [[-0.66 * bw, 1.62 * H], [0.66 * bw, 1.62 * H], [0.6 * bw, 1.12 * H], [-0.6 * bw, 1.12 * H]], S, 0.46, 'torso', 0.03); cut(to, [[-0.6 * bw, 1.18 * H], [0.6 * bw, 1.18 * H], [0.6 * bw, 1.1 * H], [-0.6 * bw, 1.1 * H]], T, 0.47, 'torso', 0.01, 0.003); for (const s of [-1, 1]) cut(to, [[s * 0.3 * bw, 1.95 * H], [s * 0.45 * bw, 1.92 * H], [s * 0.5 * bw, 1.6 * H], [s * 0.34 * bw, 1.6 * H]], S, 0.47, 'torso', 0.03); }
    else if (t === 'top_crop') { cut(to, [[-0.72 * bw, 1.0 * H], [0.72 * bw, 1.0 * H], [0.86 * bw, 1.45 * H], [0.74 * bw, 1.86 * H], [0.28, 1.98 * H], [-0.28, 1.98 * H], [-0.74 * bw, 1.86 * H], [-0.86 * bw, 1.45 * H]], S, 0.46, 'torso', 0.03); cut(to, [[-0.72 * bw, 1.06 * H], [0.72 * bw, 1.06 * H], [0.72 * bw, 0.98 * H], [-0.72 * bw, 0.98 * H]], T, 0.47, 'torso', 0.01, 0.003); }
    else if (t === 'vest_open') for (const s of [-1, 1]) { cut(to, [[s * 0.86 * bw, 1.45 * H], [s * 0.74 * bw, 1.86 * H], [s * 0.4 * bw, 1.96 * H], [s * 0.3 * bw, 0.1], [s * (0.6 * bw + b), 0]], S, 0.46, 'torso', 0.03); cut(to, strip([s * 0.4 * bw, 1.95 * H], [s * 0.3 * bw, 0.1], 0.05, 0.05), T, 0.47, 'torso', 0.01, 0.003); }
    else if (t === 'shirt_tshirt_base' || t === 'hoodie_01') {
      cut(to, strip([-0.3 * bw, 1.96 * H], [0.3 * bw, 1.96 * H], 0.08, 0.08, -0.12 * H), t === 'hoodie_01' ? shade(S.c, 0.75) : T, 0.46, 'torso', 0.01, 0.003);   // the collar
      cut(to, [[-0.5 * bw, 0.3], [0.5 * bw, 0.3], [0.55 * bw, 0.38], [-0.55 * bw, 0.38]], shade(S.c, 0.82), 0.455, 'torso', 0.01, 0.004);   // a fold
      if (t === 'hoodie_01') { cut(to, [[-0.42 * bw, 0.2], [0.42 * bw, 0.2], [0.34 * bw, 0.75 * H], [-0.34 * bw, 0.75 * H]], shade(S.c, 0.86), 0.46, 'torso', 0.02, 0.005); for (const s of [-1, 1]) cut(to, strip([s * 0.1, 1.9 * H], [s * 0.12, 1.45 * H], 0.03, 0.03), T, 0.47, 'torso', 0.01, 0.002); }
    } else if (t === 'shirt_tank') cut(to, [[-0.86 * bw, 1.45 * H], [-0.48 * bw, 1.98 * H], [-0.36 * bw, 1.98 * H], [-0.3 * bw, 1.6 * H], [0.3 * bw, 1.6 * H], [0.36 * bw, 1.98 * H], [0.48 * bw, 1.98 * H], [0.86 * bw, 1.45 * H], [0.9 * bw, 1.5 * H], [0.86 * bw, 2.02 * H], [-0.86 * bw, 2.02 * H], [-0.9 * bw, 1.5 * H]], sk, 0.43, 'torso', 0.01);   // the arm holes show the shoulders
    else if (t === 'jacket_leather_biker') {
      cut(to, [[-0.32 * bw, 1.98 * H], [0.32 * bw, 1.98 * H], [0.12, 0.25], [-0.12, 0.25]], sk, 0.45, 'torso', 0.02, 0.004);   // the open front
      for (const sd of [-1, 1]) cut(to, [[sd * 0.32 * bw, 1.98 * H], [sd * 0.62 * bw, 1.9 * H], [sd * 0.5 * bw, 1.45 * H], [sd * 0.2 * bw, 1.2 * H]], shade(S.c, 0.7), 0.47, 'torso', 0.03, 0.004);   // the collar
      cut(to, strip([0.16 * bw, 0.25], [0.5 * bw, 1.5 * H], 0.04, 0.04), K.pal.h, 0.48, 'torso', 0.01, 0.002);   // the zip
      cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.62 * bw + b, 0.16], [-0.62 * bw - b, 0.16]], T, 0.475, 'torso', 0.02, 0.004);
    } else if (t === 'robe_long') {
      for (const sd of [-1, 1]) cut(to, strip([sd * 0.32 * bw, 1.98 * H], [sd * 0.05, 0.15], 0.14, 0.12), T, 0.47, 'torso', 0.02, 0.004);   // the lapels
      cut(to, [[-0.66 * bw - b, 0.5], [0.66 * bw + b, 0.5], [0.66 * bw + b, 0.66], [-0.66 * bw - b, 0.66]], T, 0.48, 'torso', 0.02, 0.004);   // the sash
    } else if (t === 'suit_jacket') suitBits(S.c, T.c, K.pal.h.c);
    if (has('chain_gold')) for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.15 + 0.7 * i / 10); cut(to, ell(0.36 * bw * Math.cos(a), 1.9 * H + 0.55 * H * Math.sin(a), 0.05, 0.05, 8), K.pal.h, 0.495, 'torso', 0.02, 0.002); }
  }
  if ((r.tats || []).indexOf('chest') >= 0 && (K ? !covered : !r.shirt)) {   // a chest piece: wings spread from the breastbone
    const ink = inkOf(sk); for (const sd of [-1, 1]) { cut(to, strip([sd * 0.06, 1.47 * H], [sd * 0.55 * bw, 1.62 * H], 0.07, 0.025, sd * 0.04), ink, 0.455, 'torso', 0.005, 0.003); cut(to, strip([sd * 0.08, 1.42 * H], [sd * 0.45 * bw, 1.46 * H], 0.05, 0.02, sd * 0.03), ink, 0.455, 'torso', 0.005, 0.003); }
    cut(to, [[0, 1.55 * H], [0.05, 1.45 * H], [0, 1.34 * H], [-0.05, 1.45 * H]], ink, 0.456, 'torso', 0.005, 0.003);
  }
  rig.anchors.waist = W_(root, [[0, 0.2]])[0]; rig.anchors.chest = W_(to, [[0, 1.4 * H]])[0];
  const nk = child(to, [0, 1.95 * H], P.head); note('head', nk, to, true);
  cut(nk, [[-0.26 * w, -0.1], [0.26 * w, -0.1], [0.22 * w, 0.45], [-0.22 * w, 0.45]], dk, 0.5, 'head');
  if ((r.tats || []).indexOf('neck') >= 0 && !(K && K.top === 'suit_jacket')) for (const yy of [0.05, 0.17, 0.29]) cut(nk, [[-0.2 * w, yy], [0.2 * w, yy + 0.03], [0.19 * w, yy + 0.07], [-0.19 * w, yy + 0.04]], inkOf(sk), 0.505, 'head', 0.005, 0.004);
  if (K && K.top === 'hoodie_01') cut(nk, ell(-0.12, 0.85, 0.72, 0.8, 18), shade(K.pal.s.c, 0.8), 0.52, 'head', 0.04);   // the hood down behind the head
  head(nk, r, 0.56, expr, cut, mk);
  if ((mk.blood || 0) >= 3) for (const [x0, len] of [[-0.3, 0.9], [0.1, 0.6], [0.45, 1.1]] as [number, number][]) cut(to, strip([x0 * w, 1.9 * H], [x0 * w + 0.04, 1.9 * H - len], 0.1, 0.03), BLOOD, 0.5, 'torso', 0.01, 0.01);   // blood run down the chest
  rig.anchors.head = W_(nk, [[0, 1.0]])[0];
  rig.anchors.shoulders = W_(to, [[0, 1.85 * H]])[0];
  arm('n', 0.95 + ((pl.lz || {}).arm_n || 0));
  // lettering and shapes stuck on the gear: on the chest, or down the near thigh
  if (K && K.layers.length) {
    const hpN = child(root, [0.32 * w, -0.42], P.hip_n);
    K.layers.forEach((ly, li) => {
      const leg_ = ly.on === 'lower_body', fr = leg_ ? hpN : to, ox = 0, oy = leg_ ? -0.5 * L.thigh : 1.0 * H, u = leg_ ? 0.04 * aw : 0.06 * bw;
      const z0 = (leg_ ? 0.24 + 0.026 : 0.492) + (ly.placement.z || 0) * 0.0003 + li * 0.00001, sw = layerSwatch(K, ly.palette_slot), sc = ly.scale || 1, ra = (ly.rot || 0) * Math.PI / 180;
      const cx = ox + (ly.placement.x || 0) * u, cy = oy + (ly.placement.y || 0) * u;
      const place = (q: Pt[], k: number, ang: number, dx: number, dy: number) => q.map(([x, yy]) => { const c = Math.cos(ang), s2 = Math.sin(ang), X = x * k, Y = yy * k; return [cx + dx + X * c - Y * s2, cy + dy + X * s2 + Y * c] as Pt; });
      if (ly.type === 'text_decal' && ly.string) {
        const word = ly.string.slice(0, 20), nch = Array.from(word).length, span = (leg_ ? 0.5 * aw : 1.25 * bw), cell = Math.min(leg_ ? 0.035 : 0.055, span / Math.max(1, nch * 6)) * sc;
        Array.from(word.toUpperCase()).forEach((ch, i) => {
          const t = nch > 1 ? i / (nch - 1) : 0.5, lx = (i * 6 + 2.5 - (nch * 6 - 1) / 2) * cell, arch = (ly.arch || 0) * 3.2 * cell;
          const ly_ = arch * (1 - Math.pow(2 * t - 1, 2)), ang = Math.atan(-arch * 4 * (2 * t - 1) / Math.max(0.001, (nch * 6 - 1) * cell));   // along the arch, each letter turned to follow it
          for (const bar of letters(ch, ly.font)) {
            const rotd = place(bar.map(([x, yy]) => { const c = Math.cos(ang), s2 = Math.sin(ang); return [x * c - yy * s2, x * s2 + yy * c] as Pt; }), cell, ra, Math.cos(ra) * lx - Math.sin(ra) * ly_, Math.sin(ra) * lx + Math.cos(ra) * ly_);
            cut(fr, rotd, sw, z0, leg_ ? 'hip_n' : 'torso', 0.015, 0.002);
          }
        });
      } else if (ly.type === 'shape_combiner' && ly.shape_id) {
        const size = (leg_ ? 0.5 * aw : 0.95 * bw) * sc;
        shape(ly.shape_id, li + 1).forEach((pc, k) => cut(fr, place(pc, size, ra, 0, 0), ly.shape_id === 'buckle' && k === 1 ? shade(sw.c, 0.6) : sw, z0 + k * 0.00002, leg_ ? 'hip_n' : 'torso', 0.02, 0.004));
      }
    });
  }
  for (const [f, z] of pins) { const c = W_(f, [[0, 0]])[0]; out.push({ pts: ell(c[0], c[1], 0.07, 0.07, 10), col: '#d9a338', z: pl.z + z + 0.04, lift: 0.02, own }); }
  const hn = rig.anchors.hand_n, hf = rig.anchors.hand_f; rig.anchors.hands = [(hn[0] + hf[0]) / 2, (hn[1] + hf[1]) / 2];
  const k = pl.s && Math.abs(pl.s - 1) > 0.001 ? Math.max(0.5, Math.min(1.6, pl.s)) : 1;
  if (k !== 1) {   // grow or shrink from the feet
    const pu = rot([0, -(legs(r) + 0.6)], root.a), fu: Pt = [root.x + pu[0], root.y + pu[1]], fw: Pt = [fx(fu[0]), fu[1]];
    const sc = (q: Pt, c: Pt): Pt => [c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k];
    for (let i = n0; i < out.length; i++) { out[i].pts = out[i].pts.map(q => sc(q, fw)); const t = out[i].txt; if (t) { const q = sc([t.x, t.y], fw); t.x = q[0]; t.y = q[1]; } }
    for (const j in rig.joints) { const q = sc([rig.joints[j].x, rig.joints[j].y], fu); rig.joints[j].x = q[0]; rig.joints[j].y = q[1]; }
    for (const a in rig.anchors) rig.anchors[a] = sc(rig.anchors[a], fw);
  }
  return rig;
}

/** Tattoo ink: a dark blue-black, a little of the skin showing through. */
function inkOf(sk: string) { const a = parseInt(sk.slice(1), 16), b = 0x16203a, m = (sh: number) => Math.round(((a >> sh) & 255) * 0.25 + ((b >> sh) & 255) * 0.75); return '#' + [16, 8, 0].map(sh => m(sh).toString(16).padStart(2, '0')).join(''); }
/** The face at body size, cut from the same recipe as the portrait, turned three quarters toward the way the doll faces. */
function head(fr: F, r: Recipe, z: number, expr: string, cut: (f: F, poly: Pt[], col: string | Swatch, z: number, joint?: string, lift?: number, rough?: number) => void, mk: Marks = {}) {
  const s = 0.47, hd: Head = { cx: 0, cy: 0.98, rx: r.head.rx * s, ryt: r.head.ryt * s, ryb: r.head.ryb * s, sq: r.head.sq, chin: r.head.chin }, tq = 0.09;
  const sk = r.skin, dk = shade(sk, 0.74), deep = shade(sk, 0.5), J = 'head';
  const put = (poly: Pt[], col: string | Swatch, dz: number, rough = 0.008) => cut(fr, poly, col, z + dz, J, 0.03, rough);
  const K = r.kit, acc = (a: string) => !!K && K.acc.indexOf(a) >= 0;
  const HC = r.hairCol, bx = -hd.rx;   // the back of the head is to the left of the face
  if ((r.hair === 'long' || r.hair === 'wild') && !r.mask) put(headPoly(hd, r.hair === 'wild' ? 1.22 : 1.12, -0.35, Math.PI + 0.35, 20, 0.02).concat([[-hd.rx * (r.hair === 'wild' ? 1.55 : 1.3), hd.cy - hd.ryb * (r.hair === 'wild' ? 1.4 : 1.6)], [hd.rx * 1.2, hd.cy - hd.ryb * 1.5]]), HC, -0.03, r.hair === 'wild' ? 0.07 : 0.03);
  if (!r.mask) {
    if (r.hair === 'ponytail') { put(strip([bx * 0.85, hd.cy + hd.ryt * 0.55], [bx * 1.45, hd.cy - hd.ryb * 1.3], 0.2, 0.08, 0.12), HC, -0.03, 0.02); put(ell(bx * 0.92, hd.cy + hd.ryt * 0.45, 0.06, 0.06, 8), shade(HC, 0.5), -0.02, 0.003); }
    if (r.hair === 'mullet') put([[bx * 0.5, hd.cy + hd.ryt * 0.5], [bx * 1.12, hd.cy + hd.ryt * 0.1], [bx * 1.3, hd.cy - hd.ryb * 1.2], [bx * 1.05, hd.cy - hd.ryb * 1.55], [bx * 0.85, hd.cy - hd.ryb * 1.3], [bx * 0.45, hd.cy - hd.ryb * 0.6]], HC, -0.03, 0.05);
    if (r.hair === 'afro') put(ell(-0.06, hd.cy + hd.ryt * 0.25, hd.rx * 1.55, hd.ryt * 1.45, 26), HC, -0.03, 0.05);
    if (r.hair === 'dreads') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.55 + 0.45 * i / 6), x0 = hd.rx * 1.02 * Math.cos(a), y0 = hd.cy + hd.ryt * 1.02 * Math.sin(a); put(strip([x0, y0], [x0 - 0.12 - i * 0.03, hd.cy - hd.ryb * (1.1 + (i % 3) * 0.25)], 0.09, 0.07, 0.05), shade(HC, i % 2 ? 0.85 : 1), -0.03 - i * 0.001, 0.015); }
    if (r.hair === 'braids') for (const dy of [0.1, -0.12]) put(strip([bx * 0.95, hd.cy + dy], [bx * 1.2, hd.cy - hd.ryb * 1.2 + dy], 0.07, 0.05, 0.05), HC, -0.03, 0.01);
  }
  put(ell(-hd.rx * 0.95 + tq * 0.4, hd.cy - 0.02, 0.09, 0.13, 10), sk, 0);
  put(headPoly(hd), sk, 0.02);
  const mkind = r.mask ? r.mask.kind || 'open' : '', fullMask = !!r.mask && mkind !== 'half';
  if (r.mask) {
    if (mkind === 'half') put(headPoly(hd, 1.04, -0.12, Math.PI + 0.12, 22).concat([[-hd.rx * 1.02, hd.cy - 0.12], [hd.rx * 1.02, hd.cy - 0.12]] as Pt[]), r.mask.base, 0.04);   // over the head and eyes, the mouth and jaw bare
    else put(headPoly(hd, 1.04), r.mask.base, 0.04);
    if (mkind === 'open') put(headPoly(hd, 0.97, Math.PI + 0.4, 2 * Math.PI - 0.4, 18, -0.01).map(([x, y]) => [x + tq * 0.5, y] as Pt), sk, 0.06);
    for (const sd of [-1, 1]) {
      let fl: Pt[] = [[sd * 0.03, 0.34], [sd * 0.34, 0.36], [sd * 0.42, 0.52], [sd * 0.3, 0.45], [sd * 0.36, 0.62], [sd * 0.2, 0.46], [sd * 0.1, 0.4]];
      fl = fl.map(([x, y]) => [x + tq, y + hd.cy - 0.27] as Pt); put(sd > 0 ? fl : fl.reverse(), r.mask.trim, 0.08);
    }
    put(strip([tq * 0.6, hd.cy + hd.ryt * 0.98], [tq, hd.cy], 0.07, 0.03), r.mask.trim, 0.08);
  } else {
    put(headPoly(hd, 1, -1.25, 1.1).concat(headPoly(hd, 0.86, 1.1, -1.25, 18, -0.01).map(([x, y]) => [x - 0.04, y] as Pt)), dk, 0.04);
    if (r.beard === 1 || r.beard === 9) put(headPoly(hd, 1.0, Math.PI + 0.25, 2 * Math.PI - 0.25, 18), shade(sk, 0.82), 0.05);
  }
  const ey = hd.cy + 0.1, shut = ['hurt', 'pain', 'cry', 'shut'].includes(expr), mad = ['shout', 'roar', 'snarl', 'pain', 'hurt'].includes(expr);
  // blood under the eyes and brows: a cut on the brow, a trickle down the face, or the face covered
  const bl = mk.blood || 0;
  if (bl >= 3) put(headPoly(hd, 0.97, 0.15, Math.PI - 0.15, 16).concat([[-hd.rx * 0.8, hd.cy - 0.12], [-0.1, hd.cy - 0.24], [tq, hd.cy - 0.1], [0.12, hd.cy - 0.3], [hd.rx * 0.8, hd.cy - 0.14]]).reverse(), BLOOD, 0.09, 0.02);
  if (bl >= 1) put(strip([tq - 0.14, hd.cy + 0.36], [tq + 0.1, hd.cy + 0.4], 0.035, 0.025, 0.02), BLOOD2, 0.095, 0.004);
  if (bl >= 2) for (const [x0, len] of [[tq - 0.06, 0.62], [tq + 0.24, 0.5]] as [number, number][]) put(strip([x0, hd.cy + 0.36], [x0 + 0.02, hd.cy + 0.36 - len], 0.04, 0.02), BLOOD, 0.095, 0.006);
  if (mk.bruise) put(ell(tq + 0.17, ey - 0.07, 0.09, 0.06, 10), '#5b3a6e', 0.095, 0.006);
  const pt = r.paint && !fullMask ? r.paint : (acc('face_paint') && !r.mask ? { k: 'stripes', c: K!.pal.s.c } : null);
  if (pt) {   // face paint, under the eyes, brows and mouth
    const C = pt.c;
    if (pt.k === 'stripes') for (const sd of [-1, 1]) put(strip([sd * 0.16 + tq - 0.1, ey - 0.08], [sd * 0.16 + tq + 0.08, ey - 0.3], 0.07, 0.03), C, 0.096, 0.004);
    else if (pt.k === 'half') put(headPoly(hd, 0.985, -0.08, Math.PI + 0.08, 22).concat([[-hd.rx * 0.99, ey - 0.13], [tq, ey - 0.2], [hd.rx * 0.99, ey - 0.13]] as Pt[]), C, 0.096, 0.006);
    else if (pt.k === 'full' || pt.k === 'skull') {
      put(headPoly(hd, 0.985), pt.k === 'skull' ? PAL.white : C, 0.096, 0.006);
      if (pt.k === 'skull') {
        for (const sd of [-1, 1]) { put(ell(sd * 0.16 + tq, ey, 0.12, 0.1, 14), PAL.black, 0.125, 0.006); put(ell(sd * 0.16 + tq + 0.02, ey, 0.025, 0.025, 8), PAL.white, 0.126, 0.002); }
        put([[tq - 0.06, ey - 0.14], [tq + 0.06, ey - 0.14], [tq, ey - 0.26]], PAL.black, 0.135, 0.004);
      }
    } else if (pt.k === 'war') {
      put(strip([-hd.rx * 0.8, hd.cy + hd.ryt * 0.45], [hd.rx * 0.85, hd.cy + hd.ryt * 0.5], 0.06, 0.06), C, 0.096, 0.004);
      for (const sd of [-1, 1]) for (const k2 of [0, 0.07]) put(strip([sd * 0.16 + tq - 0.06 + k2, ey - 0.08], [sd * 0.16 + tq - 0.1 + k2, ey - 0.36], 0.035, 0.025), C, 0.096, 0.003);
    }
  }
  for (const sd of [-1, 1]) {
    const cx = sd * 0.16 + tq;
    if (shut) put(strip([cx - 0.08, ey + 0.01], [cx + 0.08, ey - 0.02], 0.035, 0.03, expr === 'pain' ? -0.04 : expr === 'shut' ? 0.02 : -0.03), PAL.black, 0.1);
    else { put(almond(cx, ey, 0.17, 0.075), PAL.white, 0.1, 0.003); put(ell(cx + 0.03, ey + 0.005, 0.038, 0.038, 8), PAL.black, 0.12, 0.002); }
    if (mk.tears || expr === 'cry') put(strip([cx + 0.02, ey - 0.04], [cx + 0.03, ey - 0.3], 0.035, 0.05), WET, 0.135, 0.004);
    if (!r.mask && r.brow > 0 && !(r.paint && r.paint.k === 'skull')) { const a = mad ? -0.07 : expr === 'cry' ? 0.06 : expr === 'smirk' && sd > 0 ? 0.06 : r.browAng; put(strip([cx - 0.1 * sd, ey + 0.1 + a * sd], [cx + 0.1 * sd, ey + 0.11 - a * sd], r.brow * 0.5, r.brow * 0.3), r.browCol, 0.14); }
  }
  if (acc('face_paint') && !r.mask) for (const sd of [-1, 1]) put(strip([sd * 0.16 + tq - 0.1, ey - 0.08], [sd * 0.16 + tq + 0.08, ey - 0.3], 0.07, 0.03), K!.pal.s, 0.105, 0.004);
  if (acc('sunglasses_aviator')) {
    for (const sd of [-1, 1]) { put(almond(sd * 0.16 + tq, ey - 0.01, 0.24, 0.13), K!.pal.h, 0.145, 0.003); put(almond(sd * 0.16 + tq, ey - 0.005, 0.2, 0.1), { c: '#141820', f: 'foil' }, 0.15, 0.003); }
    put(strip([tq - 0.05, ey + 0.03], [tq + 0.05, ey + 0.03], 0.025, 0.025, 0.02), K!.pal.h, 0.152, 0.002); put(strip([tq + 0.27, ey + 0.02], [hd.rx * 0.98, ey + 0.05], 0.025, 0.025), K!.pal.h, 0.152, 0.002);
  }
  const nw = r.noseW * 0.25, nl = r.noseL * 0.4;
  put([[tq - 0.03, ey - 0.02], [tq + 0.03, ey - 0.02], [tq + nw, ey - nl], [tq + 0.02, ey - nl - 0.04], [tq - nw * 0.8, ey - nl]], dk, 0.13);
  const my = ey - nl - 0.14, open = ['shout', 'hurt', 'roar', 'snarl', 'pain', 'cry', 'talk'].includes(expr);
  if (!fullMask && [2, 4, 5, 7, 8].includes(r.beard)) {
    if (r.beard === 4 || r.beard === 5) {
      const lng = r.beard === 5 ? 0.22 : 0.08;
      const bo = headPoly(hd, 1.05, Math.PI + 0.05, 2 * Math.PI - 0.05, 18).map(([x, y]) => [x, y - lng * Math.max(0, -(y - hd.cy)) / hd.ryb] as Pt);
      const bi = headPoly(hd, 1.0, 2 * Math.PI - 0.3, Math.PI + 0.3, 14).map(([x, y]) => [x * 0.7 + tq, my + 0.04 + (y - my) * 0.12] as Pt);
      put(bo.concat(bi), r.hairCol, 0.15, 0.02);
    } else put(ell(tq, hd.cy - hd.ryb * 0.82, r.beard === 7 ? 0.04 : 0.11, r.beard === 7 ? 0.05 : 0.11, 12), r.hairCol, 0.15, 0.015);
  }
  if (!fullMask && r.beard === 10) put(headPoly(hd, 1.04, Math.PI + 0.1, 2 * Math.PI - 0.1, 18).concat(headPoly(hd, 0.92, 2 * Math.PI - 0.25, Math.PI + 0.25, 16).map(([x, y]) => [x + tq * 0.3, y] as Pt)), HC, 0.15, 0.012);   // a chin strap
  if (!fullMask && r.braid && r.beard === 5) { const by = hd.cy - hd.ryb * 1.2; put(strip([tq, by], [tq + 0.03, by - 0.55], 0.12, 0.06, 0.03), HC, 0.152, 0.01); for (const t of [0.3, 0.65]) put(ell(tq + 0.015, by - 0.55 * t, 0.07, 0.035, 8), shade(HC, 0.55), 0.153, 0.002); }
  if (!fullMask && r.beard === 6) for (const sd of [-1, 1]) put(ell(sd * hd.rx * 0.78 + tq * 0.5, hd.cy - 0.12, 0.08, 0.18, 10), r.hairCol, 0.15, 0.015);
  const mw = expr === 'roar' ? 0.22 : expr === 'pain' || expr === 'snarl' ? 0.24 : expr === 'cry' ? 0.13 : expr === 'talk' ? 0.15 : 0.17, mh = expr === 'roar' ? 0.17 : expr === 'pain' || expr === 'snarl' ? 0.08 : expr === 'cry' ? 0.07 : expr === 'talk' ? 0.065 : 0.11;
  if (expr === 'smirk') put(strip([tq - 0.1, my - 0.01], [tq + 0.11, my + 0.04], 0.035, 0.03, 0.02), deep, 0.17, 0.004);
  else put(almond(tq, my, open ? mw : 0.2, open ? mh : 0.035), open ? PAL.black : (r.beard >= 4 && r.beard <= 5 ? shade(sk, 0.55) : deep), 0.17, 0.004);
  if (pt && pt.k === 'skull') for (let i = -2; i <= 2; i++) put(strip([tq + i * 0.05, my + 0.07], [tq + i * 0.05, my - 0.07], 0.012, 0.012), PAL.black, 0.172, 0.001);   // the skull's teeth
  if (expr === 'snarl' || expr === 'pain') put([[tq - mw * 0.4, my + 0.02], [tq + mw * 0.4, my + 0.02], [tq + mw * 0.38, my - 0.015], [tq - mw * 0.38, my - 0.015]], PAL.white, 0.175, 0.002);   // gritted teeth
  if (mk.sweat) for (const [x0, y0] of [[-0.18, 0.5], [0.3, 0.42], [-0.3, 0.2]] as [number, number][]) put(ell(tq + x0, hd.cy + y0, 0.025, 0.04, 8), WET, 0.22, 0.002);
  if (!fullMask && r.mus > 0) {
    const wd = r.mus === 1 ? 0.03 : 0.06, dr = r.mus === 3 || r.mus === 4 ? 0.12 : 0.04;
    if (r.mus === 3) for (const sd of [-1, 1]) put(strip([tq + sd * 0.16, my - 0.06], [tq + sd * 0.24, my + 0.06], 0.04, 0.025, sd * 0.03), r.hairCol, 0.181, 0.004);   // a handlebar curls up
    if (r.mus === 4) for (const sd of [-1, 1]) put(strip([tq + sd * 0.15, my], [tq + sd * 0.15, my - 0.3], 0.05, 0.04), r.hairCol, 0.181, 0.004);   // a horseshoe runs down to the jaw
    put([[tq - 0.02, my + 0.08], [tq + 0.02, my + 0.08], [tq + 0.15, my + 0.03], [tq + 0.17, my - dr], [tq + 0.12, my - 0.01], [tq, my + 0.08 - wd], [tq - 0.12, my - 0.01], [tq - 0.17, my - dr], [tq - 0.15, my + 0.03]], r.hairCol, 0.18, 0.006);
  }
  if (!r.mask && r.hair !== 'bald') {
    if (r.hair === 'mohawk') {
      const fin: Pt[] = [[-0.08, hd.cy + 0.3]]; for (let i = 0; i <= 6; i++) fin.push([-0.08 + 0.16 * i / 6, hd.cy + hd.ryt + 0.2 + (i % 2 ? 0 : 0.1)]); fin.push([0.08, hd.cy + 0.3]);
      put(fin, r.hairCol, 0.19);
    } else if (r.hair === 'spiky') {
      const sp: Pt[] = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (-0.05 + 1.1 * i / 14), rr = i % 2 ? 1.05 : 1.35; sp.push([hd.rx * rr * Math.cos(a), hd.cy + hd.ryt * rr * Math.sin(a)]); }
      const fr: Pt[] = []; for (let i = 0; i <= 8; i++) fr.push([hd.rx * 0.98 - 2 * hd.rx * 0.98 * i / 8, hd.cy + hd.ryt * 0.55]);
      put(sp.concat(fr.reverse()), r.hairCol, 0.19, 0.01);
    } else if (r.hair === 'slick') {
      const top = headPoly(hd, 1.05, -0.05, Math.PI + 0.25, 20), fr: Pt[] = [[bx * 1.08, hd.cy + hd.ryt * 0.2], [hd.rx * 0.95, hd.cy + hd.ryt * 0.62]];
      put(top.concat(fr), r.hairCol, 0.19, 0.006); put(strip([hd.rx * 0.5, hd.cy + hd.ryt * 0.98], [bx * 0.6, hd.cy + hd.ryt * 0.9], 0.04, 0.02, 0.05), shade(r.hairCol, 1.45), 0.195, 0.004);   // the shine
    } else if (r.hair === 'afro') {
      const top = headPoly(hd, 1.12, 0.15, Math.PI - 0.15, 18), fr: Pt[] = []; for (let i = 0; i <= 8; i++) fr.push([hd.rx * 0.9 - 1.8 * hd.rx * i / 8, hd.cy + hd.ryt * (0.6 + 0.08 * Math.sin(Math.PI * i / 4))]);
      put(top.concat(fr.reverse()), r.hairCol, 0.19, 0.04);
    } else if (r.hair === 'braids') {
      put(headPoly(hd, 1.02, -0.1, Math.PI + 0.1, 20).concat([[bx * 0.98, hd.cy + hd.ryt * 0.62], [hd.rx * 0.98, hd.cy + hd.ryt * 0.62]] as Pt[]), r.hairCol, 0.19, 0.006);
      for (let i = 0; i < 4; i++) { const x = hd.rx * (0.7 - i * 0.45); put(strip([x, hd.cy + hd.ryt * 0.62], [x - 0.12, hd.cy + hd.ryt * 1.0], 0.03, 0.03, 0.04), shade(r.hairCol, 0.55), 0.195, 0.003); }   // the rows
    } else {
      const k = r.hair === 'buzz' ? 1.02 : r.hair === 'flat' ? 1.06 : 1.07, top = headPoly(hd, k, -0.1, Math.PI + 0.1, 20, r.hair === 'flat' ? 0.06 : 0);
      const fr: Pt[] = []; for (let i = 0; i <= 8; i++) fr.push([hd.rx * 0.98 - 2 * hd.rx * 0.98 * i / 8, hd.cy + hd.ryt * ((r.hair === 'buzz' ? 0.62 : 0.5) + 0.15 * Math.sin(Math.PI * i / 8))]);
      put(top.concat(fr.reverse()), r.hairCol, 0.19, r.hair === 'curls' ? 0.03 : 0.012);
      if (r.hair === 'curls') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + 0.8 * i / 6); put(ell(hd.rx * 1.02 * Math.cos(a), hd.cy + hd.ryt * 1.02 * Math.sin(a), 0.11, 0.11, 10), r.hairCol, 0.2, 0.02); }
    }
  }
  if (acc('bandana')) { put(strip([-hd.rx * 1.02, hd.cy + 0.38], [hd.rx * 1.02, hd.cy + 0.42], 0.15, 0.15, 0.04), K!.pal.s, 0.215, 0.006); put([[-hd.rx * 0.95, hd.cy + 0.4], [-hd.rx * 1.4, hd.cy + 0.18], [-hd.rx * 1.3, hd.cy + 0.1], [-hd.rx * 0.9, hd.cy + 0.3]], K!.pal.s, 0.214, 0.01); }
  if (acc('hat_cowboy')) {
    put(strip([-hd.rx * 1.75, hd.cy + hd.ryt * 0.62], [hd.rx * 1.75, hd.cy + hd.ryt * 0.62], 0.1, 0.1, 0.12), K!.pal.s, 0.3, 0.006);   // the brim
    put([[-hd.rx * 0.95, hd.cy + hd.ryt * 0.6], [hd.rx * 0.95, hd.cy + hd.ryt * 0.6], [hd.rx * 0.8, hd.cy + hd.ryt * 1.45], [0.1, hd.cy + hd.ryt * 1.3], [-0.1, hd.cy + hd.ryt * 1.3], [-hd.rx * 0.8, hd.cy + hd.ryt * 1.45]], K!.pal.s, 0.31, 0.008);   // the crown
    put([[-hd.rx * 0.92, hd.cy + hd.ryt * 0.66], [hd.rx * 0.92, hd.cy + hd.ryt * 0.66], [hd.rx * 0.9, hd.cy + hd.ryt * 0.82], [-hd.rx * 0.9, hd.cy + hd.ryt * 0.82]], K!.pal.t, 0.315, 0.004);   // the band
  }
  if (r.headset) {   // the band over the head, the cup on the near ear, the boom round to the mouth
    const band: Pt[] = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.02 + 0.96 * i / 12); band.push([hd.rx * 1.1 * Math.cos(a), hd.cy + hd.ryt * 1.1 * Math.sin(a)]); }
    for (let i = 12; i >= 0; i--) { const a = Math.PI * (0.02 + 0.96 * i / 12); band.push([hd.rx * 1.02 * Math.cos(a), hd.cy + hd.ryt * 1.02 * Math.sin(a)]); }
    put(band, '#18181c', 0.24, 0.004);
    put(ell(hd.rx * 0.98, hd.cy - 0.02, 0.1, 0.14, 12), '#18181c', 0.25, 0.004); put(ell(hd.rx * 0.98, hd.cy - 0.02, 0.06, 0.09, 10), '#3a3a44', 0.26, 0.003);
    put(strip([hd.rx * 0.95, hd.cy - 0.1], [tq + 0.14, my - 0.02], 0.025, 0.02, -0.06), '#18181c', 0.27, 0.003);
    put(ell(tq + 0.13, my - 0.02, 0.045, 0.035, 8), '#2a2a30', 0.28, 0.002);
  }
}

/* ---------- props: things that stand in a scene ---------- */
export interface PropDraw { k: string; x: number; y: number; r: number; z: number; s?: number; txt?: string; col?: string; id: string }
const PR = (pts: Pt[], cx: number, cy: number, a: number, s: number): Pt[] => pts.map(([x, y]) => { const d = rot([x * s, y * s], a); return [cx + d[0], cy + d[1]] as Pt; });
export const PROPS: [string, string][] = [['belt', 'Title belt'], ['chair', 'Chair'], ['table', 'Table'], ['mic', 'Microphone'], ['burst', 'Burst'], ['sign', 'Sign'], ['headline', 'Headline'], ['confetti', 'Confetti']];
/** Cut a prop. `t` (seconds) moves the things that move by themselves (confetti). */
export function prop(p: PropDraw, out: Piece[], t = 0) {
  const a = p.r * Math.PI / 180, s = p.s || 1, z = p.z, own = p.id, seed = hash(p.id + p.k);
  const add = (pts: Pt[], col: string, dz: number, lift = 0.05, rough = 0.008) => out.push({ pts: snip(PR(pts, p.x, p.y, a, s), seed + out.length * 31, rough, 0.08), col, z: z + dz, lift, prop: own });
  if (p.k === 'belt') {
    add([[-1.0, -0.14], [1.0, -0.14], [1.0, 0.14], [-1.0, 0.14]], PAL.black, 0);
    add(ell(0, 0, 0.48, 0.36, 20), PAL.gold, 0.04); add(ell(0, 0, 0.3, 0.22, 16), PAL.yellow, 0.08); add(star(0, 0, 0.14, 5, 0.45), PAL.red, 0.12, 0.02, 0.004);
    for (const sx of [-0.7, 0.7]) add(ell(sx, 0, 0.16, 0.13, 12), PAL.gold, 0.04);
  } else if (p.k === 'chair') {
    add([[-0.45, 0.0], [0.45, 0.0], [0.4, 1.1], [-0.4, 1.1]], PAL.steel, 0); add([[-0.5, -0.08], [0.5, -0.08], [0.5, 0.06], [-0.5, 0.06]], shade(PAL.steel, 0.8), 0.04);
    add([[-0.42, -0.08], [-0.32, -0.08], [-0.5, -1.1], [-0.6, -1.1]], shade(PAL.steel, 0.7), -0.02); add([[0.32, -0.08], [0.42, -0.08], [0.6, -1.1], [0.5, -1.1]], shade(PAL.steel, 0.7), -0.02);
  } else if (p.k === 'table') {
    add([[-1.6, 0], [1.6, 0], [1.6, 0.18], [-1.6, 0.18]], PAL.wood, 0.04);
    for (const sx of [-1.3, 1.3]) add([[sx - 0.07, 0], [sx + 0.07, 0], [sx + 0.07, -1.2], [sx - 0.07, -1.2]], shade(PAL.wood, 0.6), 0);
  } else if (p.k === 'mic') {
    add([[-0.05, -0.45], [0.05, -0.45], [0.06, 0], [-0.06, 0]], PAL.black, 0); add(ell(0, 0.08, 0.11, 0.13, 12), PAL.grey, 0.03);
  } else if (p.k === 'burst') {
    add(star(0, 0, 1.0, 12, 0.7), PAL.black, 0, 0.08); add(star(0, 0, 0.9, 12, 0.7), p.col || PAL.yellow, 0.04);
    const txt = p.txt || 'WOW!';
    out.push({ pts: [], col: '', z: z + 0.1, txt: { s: txt, x: p.x, y: p.y, size: Math.min(0.62, 2.1 / Math.max(3, txt.length * 0.62)) * s, col: PAL.black } });
  } else if (p.k === 'sign') {
    add([[-0.9, -0.5], [0.9, -0.5], [0.9, 0.5], [-0.9, 0.5]], PAL.white, 0); add([[-0.04, -0.5], [0.04, -0.5], [0.04, -1.4], [-0.04, -1.4]], PAL.wood, -0.03);
    out.push({ pts: [], col: '', z: z + 0.06, txt: { s: p.txt || 'GO!', x: p.x, y: p.y, size: Math.min(0.45, 2.6 / Math.max(3, (p.txt || 'GO!').length * 0.62)) * s, col: p.col || PAL.red } });
  } else if (p.k === 'headline') {   // lettering cut from card on a strip: a headline, a masthead, a caption
    const txt = p.txt || 'BREAKING NEWS', w = Math.max(2, txt.length * 0.36);
    add([[-w / 2 - 0.25, -0.42], [w / 2 + 0.25, -0.42], [w / 2 + 0.25, 0.42], [-w / 2 - 0.25, 0.42]], p.col || PAL.red, 0, 0.06);
    out.push({ pts: [], col: '', z: z + 0.08, txt: { s: txt, x: p.x, y: p.y, size: 0.62 * s, col: PAL.white } });
  } else if (p.k === 'confetti') {
    const cols = [PAL.gold, PAL.red, PAL.white, PAL.sky, PAL.yellow];
    for (let i = 0; i < 40; i++) {
      const h1 = ((seed >> (i % 16)) + i * 7919) % 1000 / 1000, h2 = ((seed >> (i % 13)) + i * 104729) % 1000 / 1000;
      const fx = p.x + (h1 - 0.5) * 12, fy = p.y + 4 - ((t * (0.8 + h2) + h2 * 9) % 9), ra = t * 3 + i;
      out.push({ pts: PR([[-0.06, -0.04], [0.06, -0.04], [0.06, 0.04], [-0.06, 0.04]], fx, fy, ra, s), col: cols[i % cols.length], z: z, lift: 0.03, prop: own });
    }
  }
}
