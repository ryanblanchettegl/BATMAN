/* A wrestler as a construction paper doll (docs/plans/papercraft-engine.md, sections 1 and 2). Every part of the
   body is its own piece of card, held to the next by a brass split pin, so it can be posed: the trunk turns at the
   waist, the head at the neck, and each arm and leg at three pins. The doll is cut from a recipe; `recipeOf()`
   makes one from what the game already knows about a wrestler (the face numbers, gender, style, side and gimmick),
   so everybody in both worlds has a body with nothing added to the save. It only reads the game. */
import { METAL, GEM, BeltData } from './beltcols';
import { W, E } from '../engine';
import { G } from '../store';
import { faceOf } from './portrait';
import { skinOf, hairOf } from '../lib/portrait';
import { Pt, Piece, PAL, shade, ell, star, almond, strip, headPoly, Head, snip } from './paper';
import { Kit, Swatch, AttireKey, layerSwatch, letters, shape, fromLook, Look } from './caw';

export interface Recipe {
  key: string; name: string; skin: string; h: number; w: number; belly: number; fem: boolean;
  head: { rx: number; ryt: number; ryb: number; sq: number; chin: number };
  /** The colour of the eyes (a dark brown when not set). */
  eyeCol?: string;
  hair: string; hairCol: string; beard: number; mus: number; brow: number; browAng: number; browCol: string; noseW: number; noseL: number;
  mask?: { base: string; trim: string; kind?: 'open' | 'full' | 'half' | 'hood' }; gear: string; gear2: string; straps: boolean; tape: boolean;
  shirt?: string; pants?: string; stripes?: boolean;
  /** A suit: the jacket and trousers, the tie and the pocket square. */
  suit?: { jacket: string; tie: string; square?: string }; headset?: boolean;
  /** Title belts worn for the entrance, up to 3 (over the shoulder, round the waist, over the other shoulder): each
      title's own belt (Create a Belt), or a count for the plain gold one. */
  belts?: number; beltL?: BeltData[];
  /** From a Create a Player file (src/kit/caw.ts): torso width and height, limb length and muscle (1 is as cut), the
      three outfits, and the one being worn. */
  tw?: number; th?: number; ll?: number; mm?: number; kits?: Record<AttireKey, Kit>; kit?: Kit;
  /** Face paint (a design and its colour), tattoos (where), and a braid in a long beard. */
  paint?: { k: string; c: string }; /** More designs painted over the first, in order. */ paint2?: { k: string; c: string }[]; tats?: string[]; braid?: boolean;
  /** Face sliders from a file: eye size, gap and height, mouth width, ear size (1 or 0 is as cut). */
  fs?: { eyeS?: number; eyeG?: number; eyeY?: number; mouthW?: number; earS?: number };
  /** Which eyes, nose, mouth and ears (FEATURES in kit/caw.ts); left out, the first of each. */
  feat?: { eyes?: string; nose?: string; mouth?: string; ears?: string };
  /** A second hair colour and how it goes in (HAIR_MIX in kit/caw.ts), body hair (1 the chest, 2 chest and belly),
      scars (SCARS), freckles, and the design cut into a mask (MASK_DESIGNS; left out, flames round the eyes). */
  hairCol2?: string; hairMix?: string; bodyHair?: number; scars?: string[]; freckles?: boolean; maskDesign?: string;
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
/** Dress a person cast as the referee in the striped shirt and black trousers, their own face and hair kept. */
export function refDress(r: Recipe): Recipe { return { ...r, kit: undefined, kits: undefined, shirt: REF.shirt, pants: REF.pants, stripes: true, gear: REF.gear, gear2: REF.gear2, straps: false, tape: false, suit: undefined, mask: undefined }; }
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
export interface Place { x: number; y: number; r: number; f: number; z: number; s?: number; lz?: Record<string, number>;
  /** Seen from behind: the back of the head and of the gear, and lettering made for the back. */ b?: boolean }
/** Marks on a person: blood (1 a cut, 2 a trickle, 3 a face covered), sweat, tears, a bruise. */
export interface Marks { blood?: number; sweat?: boolean; tears?: boolean; bruise?: boolean }
/** The faces a doll can pull. */
export const EXPR: [string, string][] = [['', 'Calm'], ['talk', 'Talking'], ['shout', 'Shouting'], ['roar', 'Roaring'], ['snarl', 'Snarling'], ['smirk', 'Smirking'], ['hurt', 'Hurt'], ['pain', 'In pain'], ['cry', 'Crying'], ['shut', 'Eyes shut']];
const BLOOD = '#9e1414', BLOOD2 = '#c42a22', WET = '#bfe6ff';
/** Where each joint ended up: for dragging a part round its pin, and for anchoring props to a hand. */
export interface Rig { joints: Record<string, { x: number; y: number; pa: number; up: boolean }>; anchors: Record<string, Pt>; rootx: number; f: number }

/** Cut and pin a doll. `pl` places its waist and turns it; `pose` is angles in degrees; `expr` is calm, shout or hurt. */
export function puppet(r: Recipe, pl: Place, pose: Record<string, number>, expr: string, own: string, out: Piece[], mk: Marks = {}): Rig {
  const n0 = out.length, bk = !!pl.b;
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
  const OVER = ['shirt_tshirt_base', 'hoodie_01', 'jacket_leather_biker', 'jacket_satin', 'coat_long', 'robe_long', 'suit_jacket', 'jacket_denim', 'coat_fur', 'jacket_fringe'];   // tops with sleeves to the wrist (the T-shirt only to the elbow)
  const to = child(root, [0, 0], P.torso);
  note('torso', to, root, true);
  if (has('cape') && bk) cut(to, [[-0.92 * bw, 1.98 * H], [0.92 * bw, 1.98 * H], [1.75 * bw, -2.15 * h * ll], [-1.95 * bw, -2.15 * h * ll]], K!.pal.s, 1.06, 'torso', 0.06);   // from behind, the cape hangs over everything
  else if (has('cape')) {   // a cape hung from the shoulders, behind everything, its lining in the trim
    cut(to, [[-0.9 * bw, 1.97 * H], [0.9 * bw, 1.97 * H], [1.75 * bw, -2.15 * h * ll], [-1.95 * bw, -2.15 * h * ll]], K!.pal.t, -0.42, 'torso', 0.04);
    cut(to, [[-0.86 * bw, 1.95 * H], [0.86 * bw, 1.95 * H], [1.62 * bw, -2.1 * h * ll], [-1.85 * bw, -2.1 * h * ll]], K!.pal.s, -0.4, 'torso', 0.06);
    for (const sd of [-1, 1]) cut(to, [[sd * 0.3 * bw, 1.98 * H], [sd * 0.95 * bw, 2.08 * H], [sd * 0.9 * bw, 1.88 * H], [sd * 0.4 * bw, 1.86 * H]], K!.pal.t, 0.49, 'torso', 0.02, 0.004);   // the collar over the shoulders
  }
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
    if (K && K.top === 'jacket_fringe') for (let q = 0; q < 6; q++) { const t = 0.15 + q * 0.14; cut(sh, strip([-0.3 * aw, -t * L.up], [-0.42 * aw, -t * L.up - 0.22], 0.03, 0.02), K.pal.t, z + 0.023, 'sh_' + s, 0.005, 0.004); cut(el, strip([-0.26 * aw, -t * L.fore], [-0.38 * aw, -t * L.fore - 0.2], 0.03, 0.02), K.pal.t, z + 0.046, 'el_' + s, 0.005, 0.004); }   // fringe hanging under each sleeve
    if (has('arm_tassels')) { cut(sh, [[-0.27 * aw, -0.42 * L.up], [0.27 * aw, -0.42 * L.up], [0.26 * aw, -0.55 * L.up], [-0.26 * aw, -0.55 * L.up]], K!.pal.t, z + 0.026, 'sh_' + s, 0.02, 0.004); for (let q = -2; q <= 2; q++) cut(sh, strip([q * 0.09 * aw, -0.52 * L.up], [q * 0.12 * aw - 0.04, -0.52 * L.up - 0.42], 0.035, 0.02), q % 2 ? K!.pal.s : K!.pal.t, z + 0.027 + q * 0.0001, 'sh_' + s, 0.01, 0.008); }   // tassels tied round the biceps
    if (has('shoulder_pads_spiked')) { cut(sh, ell(0, 0.02, 0.42 * aw, 0.3 * aw, 14), { c: PAL.black, f: 'leather' }, z + 0.03, 'sh_' + s, 0.05, 0.004); for (let q = -2; q <= 2; q++) { const a0 = Math.PI * (0.5 + q * 0.22), x0 = Math.cos(a0) * 0.36 * aw, y0 = 0.02 + Math.sin(a0) * 0.26 * aw; cut(sh, [[x0 - 0.05, y0 - 0.02], [x0 + 0.05, y0 - 0.02], [x0 + Math.cos(a0) * 0.2, y0 + Math.sin(a0) * 0.2]], { c: '#d8dde4', f: 'foil' }, z + 0.031, 'sh_' + s, 0.01, 0.001); } }   // a spiked shoulder pad
    if (has('elbow_pads')) cut(el, ell(0, -0.02, 0.22 * aw, 0.2 * aw, 12), K!.pal.s, z + 0.065, 'el_' + s, 0.04);
    if (r.suit) cut(el, [[-0.16 * aw, -L.fore + 0.16], [0.16 * aw, -L.fore + 0.16], [0.15 * aw, -L.fore + 0.02], [-0.15 * aw, -L.fore + 0.02]], PAL.white, z + 0.06, 'el_' + s, 0.02, 0.004);   // the shirt cuff
    else if (K && OVER.indexOf(K.top) >= 0 && K.top !== 'shirt_tshirt_base') cut(el, [[-0.17 * aw * rw, -L.fore + 0.18], [0.17 * aw * rw * (robe ? 1.3 : 1), -L.fore + 0.18], [0.16 * aw * rw * (robe ? 1.3 : 1), -L.fore + 0.02], [-0.16 * aw * rw, -L.fore + 0.02]], K.pal.t, z + 0.06, 'el_' + s, 0.02, 0.004);   // a cuff in the trim
    if (has('wrist_wraps')) cut(el, [[-0.18 * aw, -L.fore + 0.34], [0.18 * aw, -L.fore + 0.3], [0.17 * aw, -L.fore + 0.02], [-0.17 * aw, -L.fore + 0.02]], K!.pal.s, z + 0.061, 'el_' + s, 0.02, 0.006);
    if (r.tape || has('wrist_tape_white')) cut(el, [[-0.17 * aw, -L.fore + 0.25], [0.17 * aw, -L.fore + 0.25], [0.16 * aw, -L.fore + 0.02], [-0.16 * aw, -L.fore + 0.02]], PAL.white, z + 0.06, 'el_' + s, 0.02, 0.006);
    const wr = child(el, [0, -L.fore], P['wr_' + s]); note('wr_' + s, wr, el);
    cut(wr, ell(0.02, -0.17, 0.17 * aw, 0.22, 12), sk, z + 0.08, 'wr_' + s);
    if (has('gloves_fingerless')) { cut(wr, ell(0.02, -0.12, 0.17 * aw, 0.15, 12), K!.pal.s, z + 0.09, 'wr_' + s, 0.02); cut(wr, [[-0.16 * aw, 0.02], [0.16 * aw, 0.02], [0.16 * aw, -0.06], [-0.16 * aw, -0.06]], K!.pal.t, z + 0.095, 'wr_' + s, 0.02, 0.004); }
    if (s === 'n' && has('bat')) { cut(wr, [[-0.05, -0.08], [0.05, -0.08], [0.11, -1.55], [0.0, -1.62], [-0.11, -1.55]], '#1c1b1f', z + 0.085, 'wr_' + s, 0.05, 0.004); cut(wr, ell(0, -0.06, 0.07, 0.04, 8), '#1c1b1f', z + 0.086, 'wr_' + s, 0.02, 0.002); }   // a black baseball bat held by the handle
    if (s === 'n' && has('kendo_stick')) { cut(wr, [[-0.035, -0.04], [0.035, -0.04], [0.04, -1.75], [-0.04, -1.75]], '#d8b46a', z + 0.085, 'wr_' + s, 0.04, 0.003); for (const t of [0.0, 0.55, 1.1, 1.62]) cut(wr, [[-0.045, -0.06 - t], [0.045, -0.06 - t], [0.045, -0.13 - t], [-0.045, -0.13 - t]], '#1c1b1f', z + 0.086, 'wr_' + s, 0.01, 0.002); }   // a bamboo kendo stick, taped
    if (s === 'n' && has('sword')) {   // a long sword held by the grip: a leather grip, a cross guard and a blade with a point
      cut(wr, ell(0, -0.02, 0.07, 0.06, 8), { c: '#c9a54a', f: 'foil' }, z + 0.084, 'wr_' + s, 0.02, 0.002);
      cut(wr, [[-0.045, -0.04], [0.045, -0.04], [0.045, -0.3], [-0.045, -0.3]], { c: '#3a2414', f: 'leather' }, z + 0.085, 'wr_' + s, 0.03, 0.003);
      cut(wr, [[-0.24, -0.3], [0.24, -0.3], [0.24, -0.37], [-0.24, -0.37]], { c: '#c9a54a', f: 'foil' }, z + 0.086, 'wr_' + s, 0.03, 0.003);
      cut(wr, [[-0.07, -0.37], [0.07, -0.37], [0.065, -1.95], [0, -2.1], [-0.065, -1.95]], { c: '#d8dde4', f: 'foil' }, z + 0.085, 'wr_' + s, 0.04, 0.002);
      cut(wr, strip([0, -0.4], [0, -1.9], 0.015, 0.01), '#9aa2ad', z + 0.0855, 'wr_' + s, 0.005, 0.001);   // the line down the blade
    }
    if (s === 'n' && has('sledgehammer')) {   // a sledgehammer by the end of its handle: a long wooden handle and a heavy steel head
      cut(wr, [[-0.05, -0.04], [0.05, -0.04], [0.06, -1.5], [-0.06, -1.5]], '#8a5a2b', z + 0.085, 'wr_' + s, 0.04, 0.003);
      cut(wr, [[-0.3, -1.42], [0.3, -1.42], [0.3, -1.75], [-0.3, -1.75]], { c: '#5c626b', f: 'foil' }, z + 0.087, 'wr_' + s, 0.06, 0.004);
      for (const sd of [-1, 1]) cut(wr, [[sd * 0.3, -1.44], [sd * 0.34, -1.47], [sd * 0.34, -1.7], [sd * 0.3, -1.73]], '#3c4048', z + 0.088, 'wr_' + s, 0.02, 0.002);
    }
    if (s === 'n' && r.beltL && r.beltL.length && !has('bat') && !has('sword') && !has('sledgehammer') && !has('belt_waist') && !has('belt_shoulder')) {   // a champion carries their belt, the title's own design, hanging from the hand
      const k = 0.75; beltPieces(r.beltL[0], (pts, col, dz, rough) => cut(wr, pts.map(([u, v]) => [v * k, -0.06 - (u + 1) * k] as Pt), col, z + 0.084 + dz * 0.02, 'wr_' + s, 0.03, rough == null ? 0.004 : rough));
    }
    const hand = W_(wr, [[0.02, -0.17]])[0]; rig.anchors['hand_' + s] = hand;
  };
  const LONG = ['tights_long_01', 'pants_flared', 'jeans_distressed', 'trousers_suit'];
  const leg = (s: 'n' | 'f', z: number) => {
    const hp = child(root, [(s === 'n' ? 0.32 : -0.32) * w, -0.42], P['hip_' + s]); note('hip_' + s, hp, root);
    const thighC: string | Swatch = K ? (LONG.indexOf(K.bottom) >= 0 || K.bottom === 'shorts_fight' || K.bottom === 'shorts_jean' ? K.col.bottom : sk) : r.pants || sk;
    const shinC: string | Swatch = K ? (LONG.indexOf(K.bottom) >= 0 ? K.col.bottom : sk) : r.pants || sk;
    cut(hp, taper(0.66 * aw, 0.46 * aw, L.thigh), thighC, z, 'hip_' + s); pins.push([hp, z + 0.03]);
    if (K) {
      if (K.bottom === 'trunks_long' || K.top === 'singlet_full') { cut(hp, [[-0.34 * aw, 0.1], [0.34 * aw, 0.1], [0.3 * aw, -0.45 * L.thigh], [-0.3 * aw, -0.45 * L.thigh]], K.top === 'singlet_full' ? K.col.top : K.col.bottom, z + 0.015, 'hip_' + s); cut(hp, [[-0.3 * aw, -0.4 * L.thigh], [0.3 * aw, -0.4 * L.thigh], [0.3 * aw, -0.47 * L.thigh], [-0.3 * aw, -0.47 * L.thigh]], K.pal.t, z + 0.017, 'hip_' + s, 0.02, 0.004); }
      if (K.bottom === 'shorts_fight') { cut(hp, [[0.05, 0], [0.22 * aw, 0], [0.18 * aw, -0.9 * L.thigh], [0.02, -0.9 * L.thigh]], K.pal.s, z + 0.015, 'hip_' + s, 0.02); cut(hp, [[-0.25 * aw, -0.86 * L.thigh], [0.25 * aw, -0.86 * L.thigh], [0.24 * aw, -0.95 * L.thigh], [-0.24 * aw, -0.95 * L.thigh]], K.pal.t, z + 0.017, 'hip_' + s, 0.02, 0.004); }
      if (K.bottom === 'shorts_jean') { cut(hp, [[-0.34 * aw, -0.82 * L.thigh], [0.34 * aw, -0.82 * L.thigh], [0.33 * aw, -0.9 * L.thigh], [-0.33 * aw, -0.9 * L.thigh]], shade(K.col.bottom.c, 1.3), z + 0.016, 'hip_' + s, 0.01, 0.006); for (let q = -2; q <= 2; q++) cut(hp, strip([q * 0.1 * aw, -0.88 * L.thigh], [q * 0.11 * aw, -0.97 * L.thigh], 0.025, 0.01), shade(K.col.bottom.c, 1.45), z + 0.017, 'hip_' + s, 0.005, 0.004); if (s === 'n') cut(hp, strip([0.05, -0.12], [0.05, -0.62 * L.thigh], 0.012, 0.012), K.pal.t, z + 0.016, 'hip_' + s, 0.003, 0.002); }   // the frayed hem and the side seam
      if (K.bottom === 'tights_long_01' || K.bottom === 'pants_flared') cut(hp, strip([0, 0.05], [0, -L.thigh + 0.05], 0.08, 0.06), K.pal.t, z + 0.015, 'hip_' + s, 0.02, 0.004);
      if (K.bottom === 'trousers_suit') cut(hp, strip([0.05, -0.1], [0.04, -L.thigh + 0.05], 0.025, 0.02), shade(K.col.bottom.c, 0.7), z + 0.015, 'hip_' + s, 0.01, 0.003);
      if (K.bottom === 'jeans_distressed' && s === 'n') cut(hp, [[-0.1, -0.55 * L.thigh], [0.12, -0.5 * L.thigh], [0.18, -0.6 * L.thigh], [0.05, -0.66 * L.thigh], [-0.12, -0.62 * L.thigh]], sk, z + 0.015, 'hip_' + s, 0.01, 0.02);   // a rip
    }
    const net = (f: F, len: number, wd: number, z1: number, J: string) => { for (let i = -1; i < 7; i++) { const t0 = (i / 7) * len, t1 = t0 + len * 0.18; cut(f, strip([-wd, -t0], [wd, -t1], 0.012, 0.012), '#17161b', z1, J, 0.003, 0.002); cut(f, strip([wd, -t0], [-wd, -t1], 0.012, 0.012), '#17161b', z1 + 0.0005, J, 0.003, 0.002); } };   // fishnet tights: a diamond mesh over bare skin
    if (has('fishnets') && thighC === sk) net(hp, L.thigh, 0.3 * aw, z + 0.012, 'hip_' + s);
    const kn = child(hp, [0, -L.thigh], P['kn_' + s]); note('kn_' + s, kn, hp);
    cut(kn, taper(0.47 * aw, 0.36 * aw, L.shin), shinC, z + 0.03, 'kn_' + s); pins.push([kn, z + 0.06]);
    if (K && (K.bottom === 'tights_long_01' || K.bottom === 'pants_flared')) cut(kn, strip([0, 0.02], [0, -L.shin + 0.1], 0.06, 0.05), K.pal.t, z + 0.035, 'kn_' + s, 0.02, 0.004);
    if (has('fishnets') && shinC === sk) net(kn, L.shin * 0.9, 0.22 * aw, z + 0.032, 'kn_' + s);
    if (K && K.bottom === 'pants_flared') { cut(kn, [[-0.24 * aw, -L.shin * 0.45], [0.24 * aw, -L.shin * 0.45], [0.42 * aw, -L.shin - 0.08], [-0.4 * aw, -L.shin - 0.08]], K.col.bottom, z + 0.075, 'kn_' + s, 0.04); cut(kn, [[-0.41 * aw, -L.shin], [0.42 * aw, -L.shin], [0.42 * aw, -L.shin - 0.08], [-0.4 * aw, -L.shin - 0.08]], K.pal.t, z + 0.077, 'kn_' + s, 0.01, 0.003); }
    if (K && K.bottom === 'jeans_distressed' && s === 'n') cut(kn, [[-0.12, 0.05], [0.12, 0.08], [0.16, -0.06], [0.0, -0.1], [-0.14, -0.05]], sk, z + 0.035, 'kn_' + s, 0.01, 0.02);
    const kneeCap = (col: Swatch | string, z1: number) => cut(kn, bk ? [[-0.22 * aw, 0.03], [0.22 * aw, 0.03], [0.21 * aw, -0.09], [-0.21 * aw, -0.09]] : ell(0, -0.05, 0.21 * aw, 0.24 * aw, 14), col, z1, 'kn_' + s, 0.03);   // a knee pad; from behind, only its strap
    const shinGear = (top: number, col: Swatch | string) => cut(kn, [[-0.2 * aw, -L.shin * top], [0.2 * aw, -L.shin * top], [0.19 * aw, -L.shin + 0.05], [-0.19 * aw, -L.shin + 0.05]], col, z + 0.05, 'kn_' + s, 0.03);
    if (!K) {
      if (!r.pants) { kneeCap(r.gear2, z + 0.05); shinGear(0.42, r.gear); }
    } else {
      if (K.feet === 'boots_knee') { kneeCap(K.pal.t, z + 0.055); shinGear(0.42, K.col.feet); }
      else if (K.feet === 'kick_pads') { cut(kn, [[-0.22 * aw, -0.02], [0.3 * aw, -0.06], [0.32 * aw, -L.shin * 0.5], [0.26 * aw, -L.shin + 0.02], [-0.2 * aw, -L.shin + 0.02]], K.col.feet, z + 0.05, 'kn_' + s, 0.05); for (const t of [0.3, 0.62]) cut(kn, [[0.0, -L.shin * t], [0.31 * aw, -L.shin * t - 0.02], [0.31 * aw, -L.shin * t - 0.08], [0.0, -L.shin * t - 0.06]], K.pal.t, z + 0.052, 'kn_' + s, 0.01, 0.003); }
      else if (K.feet === 'boots_laced_heavy') { shinGear(0.4, K.col.feet); for (let i = 0; i < 4; i++) { const yy = -L.shin * (0.48 + i * 0.12); cut(kn, [[0.08 * aw, yy], [0.21 * aw, yy - 0.02], [0.21 * aw, yy - 0.06], [0.08 * aw, yy - 0.04]], K.pal.t, z + 0.06, 'kn_' + s, 0.01, 0.003); } }
      else if (K.feet === 'boots_short') shinGear(0.78, K.col.feet);
      if (has('knee_sleeves') && K.feet !== 'boots_knee') cut(kn, [[-0.25 * aw, 0.25], [0.25 * aw, 0.25], [0.22 * aw, -0.3], [-0.22 * aw, -0.3]], K.pal.s, z + 0.054, 'kn_' + s, 0.02);
      if (has('knee_pads') && K.feet !== 'boots_knee') kneeCap(K.pal.s, z + 0.056);
    }
    const an = child(kn, [0, -L.shin], P['an_' + s]); note('an_' + s, an, kn);
    const ft = K ? K.feet : '', bare = ft === 'barefoot' || ft === 'kick_pads' || ft === 'ankle_wraps', small = bare || ft === 'shoes_dress';
    const foot: Pt[] = small ? [[-0.2 * aw, 0.1], [0.18 * aw, 0.1], [0.22 * aw, -0.12], [0.5 * aw, -0.16], [0.52 * aw, -0.3], [-0.22 * aw, -0.3]] : [[-0.22 * aw, 0.12], [0.2 * aw, 0.12], [0.24 * aw, -0.12], [0.55 * aw, -0.14], [0.58 * aw, -0.3], [-0.24 * aw, -0.3]];
    const footC: string | Swatch = !K ? (r.pants ? PAL.black : r.gear) : bare ? sk : ft === 'shoes_dress' ? { c: PAL.black, f: 'leather' } : K.col.feet;
    cut(an, foot, footC, z + 0.07, 'an_' + s);
    if (ft === 'ankle_wraps') { cut(an, [[-0.21 * aw, 0.12], [0.2 * aw, 0.12], [0.22 * aw, -0.06], [-0.21 * aw, -0.06]], PAL.white, z + 0.075, 'an_' + s, 0.02, 0.006); cut(an, [[0.0, -0.04], [0.26 * aw, -0.08], [0.3 * aw, -0.22], [0.04 * aw, -0.2]], PAL.white, z + 0.076, 'an_' + s, 0.02, 0.006); cut(kn, [[-0.2 * aw, -L.shin + 0.22], [0.2 * aw, -L.shin + 0.22], [0.19 * aw, -L.shin + 0.02], [-0.19 * aw, -L.shin + 0.02]], PAL.white, z + 0.05, 'kn_' + s, 0.02, 0.006); }
    if (ft === 'kick_pads') cut(an, [[-0.05 * aw, 0.1], [0.2 * aw, 0.1], [0.3 * aw, -0.14], [0.05 * aw, -0.14]], K!.col.feet, z + 0.075, 'an_' + s, 0.02, 0.004);   // the strap over the instep
    if (ft === 'sneakers_retro' || ft === 'boots_laced_heavy') cut(an, [[-0.25 * aw, -0.22], [0.6 * aw, -0.22], [0.6 * aw, -0.32], [-0.25 * aw, -0.32]], ft === 'sneakers_retro' ? K!.pal.t : PAL.black, z + 0.075, 'an_' + s, 0.02, 0.004);   // the sole
    if (ft === 'sneakers_retro') cut(an, strip([-0.1 * aw, 0.0], [0.35 * aw, -0.12], 0.06, 0.04), K!.pal.t, z + 0.078, 'an_' + s, 0.02, 0.003);
    rig.anchors['foot_' + s] = W_(an, [[0.15 * aw, -0.3]])[0];
  };
  arm('f', 0 + ((pl.lz || {}).arm_f || 0)); leg('f', 0.12 + ((pl.lz || {}).leg_f || 0)); leg('n', 0.24 + ((pl.lz || {}).leg_n || 0));
  // the trunks, or the bottom of whatever is worn on the legs
  const trunks: [number, number][] = [[-0.62 * w, 0.06], [0.62 * w, 0.06], [0.66 * w, -0.5], [0.1 * w, -0.62], [-0.1 * w, -0.62], [-0.66 * w, -0.5]];
  cut(root, trunks, K ? (K.top === 'singlet_full' || K.top === 'top_bodysuit' ? K.col.top : K.col.bottom) : r.pants || r.gear, 0.36, 'body');
  if (K) {
    if (K.bottom === 'trunks_brief_01' || K.bottom === 'trunks_long' || K.bottom === 'shorts_fight') cut(root, [[-0.62 * w, 0.06], [0.62 * w, 0.06], [0.63 * w, -0.06], [-0.63 * w, -0.06]], K.pal.t, 0.37, 'body', 0.02, 0.004);
    if (K.bottom === 'jeans_distressed' || K.bottom === 'trousers_suit') { cut(root, [[-0.63 * w, 0.06], [0.63 * w, 0.06], [0.64 * w, -0.08], [-0.64 * w, -0.08]], K.bottom === 'trousers_suit' ? { c: PAL.black, f: 'leather' } : { c: '#3a2414', f: 'leather' }, 0.37, 'body', 0.02, 0.004); cut(root, [[0.1, 0.07], [0.32, 0.07], [0.32, -0.09], [0.1, -0.09]], K.pal.h, 0.375, 'body', 0.02, 0.003); }
    if (K.top === 'singlet_straps_down') for (const sd of [-1, 1]) cut(root, strip([sd * 0.42 * w, 0.02], [sd * 0.5 * w, -0.85], 0.16, 0.14, sd * 0.05), K.col.top, 0.38, 'body', 0.03);
    if (K.bottom === 'skirt_short') { cut(root, [[-0.66 * w, 0.08], [0.66 * w, 0.08], [0.95 * w, -0.85], [-0.9 * w, -0.85]], K.col.bottom, 0.385, 'body', 0.05); cut(root, [[-0.9 * w, -0.76], [0.94 * w, -0.76], [0.95 * w, -0.85], [-0.9 * w, -0.85]], K.pal.t, 0.39, 'body', 0.02, 0.004); }
    if (K.bottom === 'kilt') {   // a kilt to the knee: pleats, a tartan of two colours over the main one, a leather belt and, at the front, a sporran
      const kl = -1.5 * h * ll, kp: Pt[] = [[-0.68 * w, 0.08], [0.68 * w, 0.08], [0.9 * w, kl], [-0.86 * w, kl]];
      cut(root, kp, K.col.bottom, 0.385, 'body', 0.05);
      for (let i = 0; i < 6; i++) { const x0 = -0.62 * w + i * 0.25 * w; cut(root, strip([x0, 0.0], [x0 * 1.3, kl + 0.04], 0.05, 0.07), K.pal.s, 0.386, 'body', 0.005, 0.003); }
      for (const yy of [-0.3, -0.75, -1.2]) cut(root, strip([-0.8 * w, yy * h * ll], [0.82 * w, yy * h * ll], 0.06, 0.06), K.pal.s, 0.3865, 'body', 0.005, 0.003);
      for (const yy of [-0.52, -0.98]) cut(root, strip([-0.84 * w, yy * h * ll], [0.86 * w, yy * h * ll], 0.018, 0.018), K.pal.t, 0.387, 'body', 0.003, 0.002);
      for (let i = 0; i < 9; i++) { const x0 = -0.6 * w + i * 0.15 * w; cut(root, strip([x0 * 1.1, -0.15], [x0 * 1.35, kl + 0.05], 0.012, 0.012), shade(K.col.bottom.c, 0.72), 0.3868, 'body', 0.002, 0.002); }   // the pleats
      cut(root, [[-0.69 * w, 0.1], [0.69 * w, 0.1], [0.7 * w, -0.06], [-0.7 * w, -0.06]], { c: '#2a1a10', f: 'leather' }, 0.388, 'body', 0.02, 0.004);
      if (!bk) { cut(root, [[-0.2, -0.08], [0.2, -0.08], [0.24, -0.58], [0, -0.66], [-0.24, -0.58]], { c: '#3a2414', f: 'leather' }, 0.389, 'body', 0.04, 0.006); for (let q = 0; q < 3; q++) cut(root, strip([-0.1 + q * 0.1, -0.3], [-0.1 + q * 0.1, -0.6], 0.04, 0.03), PAL.white, 0.39, 'body', 0.01, 0.006); cut(root, ell(0, -0.16, 0.1, 0.06, 10), K.pal.h, 0.3905, 'body', 0.01, 0.002); }
    }
    if (K.bottom === 'mawashi') {   // a sumo belt: a thick twisted band round the waist and a strap down between the legs
      cut(root, [[-0.68 * w, 0.14], [0.68 * w, 0.14], [0.7 * w, -0.2], [-0.7 * w, -0.2]], K.col.bottom, 0.39, 'body', 0.04, 0.005);
      for (let q = 0; q < 6; q++) cut(root, strip([-0.66 * w + q * 0.26 * w, 0.12], [-0.56 * w + q * 0.26 * w, -0.18], 0.03, 0.03), shade(K.col.bottom.c, 0.75), 0.391, 'body', 0.005, 0.003);   // the twists
      cut(root, [[-0.14, -0.15], [0.14, -0.15], [0.1, -0.62], [-0.1, -0.62]], K.col.bottom, 0.392, 'body', 0.03, 0.004);
      if (!bk) for (let q = -2; q <= 2; q++) cut(root, strip([q * 0.08, -0.2], [q * 0.08, -0.72], 0.025, 0.02), K.pal.t, 0.393, 'body', 0.005, 0.004);   // the hanging strings at the front
    }
    if (K.bottom === 'shorts_jean') { cut(root, [[-0.63 * w, 0.06], [0.63 * w, 0.06], [0.64 * w, -0.08], [-0.64 * w, -0.08]], { c: '#3a2414', f: 'leather' }, 0.37, 'body', 0.02, 0.004); cut(root, [[0.1, 0.07], [0.32, 0.07], [0.32, -0.09], [0.1, -0.09]], K.pal.h, 0.375, 'body', 0.02, 0.003); }
    if ((K.top === 'coat_long' || K.top === 'coat_fur') && bk) cut(root, [[-0.74 * bw, 0.1], [0.74 * bw, 0.1], [0.98 * bw, -1.55 * h * ll], [-0.98 * bw, -1.55 * h * ll]], K.col.top, 0.385, 'body', 0.05);   // the back of the coat in one piece
    else if (K.top === 'coat_long' || K.top === 'coat_fur') for (const sd of [-1, 1]) { cut(root, [[sd * 0.08 * bw, 0.1], [sd * 0.74 * bw, 0.1], [sd * 0.98 * bw, -1.55 * h * ll], [sd * 0.18 * bw, -1.55 * h * ll]], K.col.top, 0.385, 'body', 0.05); cut(root, [[sd * 0.08 * bw, 0.1], [sd * 0.2 * bw, 0.1], [sd * 0.3 * bw, -1.55 * h * ll], [sd * 0.18 * bw, -1.55 * h * ll]], shade(K.col.top.c, 0.72), 0.387, 'body', 0.01, 0.004); }
    if (K.top === 'robe_long') { cut(root, [[-0.72 * bw, 0.1], [0.72 * bw, 0.1], [1.05 * bw, -2.0 * h * ll], [-1.0 * bw, -2.0 * h * ll]], K.col.top, 0.385, 'body', 0.06); cut(root, [[-1.0 * bw, -1.86 * h * ll], [1.04 * bw, -1.86 * h * ll], [1.05 * bw, -2.0 * h * ll], [-1.0 * bw, -2.0 * h * ll]], K.pal.t, 0.39, 'body', 0.02, 0.005); }
  }
  const b = r.belly;
  const torsoPoly: Pt[] = [[-0.58 * bw - b, 0], [0.58 * bw + b, 0], [0.68 * bw + b * 0.8, 0.55], [0.86 * bw, 1.45 * H], [0.74 * bw, 1.86 * H], [0.28, 1.98 * H], [-0.28, 1.98 * H], [-0.74 * bw, 1.86 * H], [-0.86 * bw, 1.45 * H], [-0.68 * bw - b * 0.8, 0.55]];
  const covered = K ? ['shirt_tshirt_base', 'shirt_tank', 'jacket_leather_biker', 'jacket_satin', 'coat_long', 'top_bodysuit', 'robe_long', 'hoodie_01', 'suit_jacket', 'jacket_denim', 'vest_tactical', 'coat_fur', 'jacket_fringe'].indexOf(K.top) >= 0 : !!r.shirt;
  cut(to, torsoPoly, K ? (covered ? K.col.top : sk) : r.shirt || sk, 0.42, 'torso');
  pins.push([to, 0.55]);
  const muscles = () => {
    cut(to, [[0.05, 1.2 * H], [0.75 * bw, 1.25 * H], [0.6 * bw, 1.05 * H], [0.1, 1.08 * H]], dk, 0.45, 'torso', 0.02);
    cut(to, [[-0.75 * bw, 1.25 * H], [-0.05, 1.2 * H], [-0.1, 1.08 * H], [-0.6 * bw, 1.05 * H]], dk, 0.45, 'torso', 0.02);
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
  const backMuscles = () => {   // the shoulder blades and the line of the spine
    for (const sd of [-1, 1]) cut(to, [[sd * 0.12, 1.75 * H], [sd * 0.6 * bw, 1.72 * H], [sd * 0.5 * bw, 1.15 * H], [sd * 0.16, 1.3 * H]], dk, 0.45, 'torso', 0.02);
    cut(to, strip([0, 1.85 * H], [0, 0.15], 0.035, 0.025), dk, 0.451, 'torso', 0.01, 0.004);
  };
  const neckBand = (col: string | Swatch, wd = 0.08) => cut(to, strip([-0.3 * bw, 1.96 * H], [0.3 * bw, 1.96 * H], wd, wd, -0.06 * H), col, 0.47, 'torso', 0.01, 0.003);
  const waistBand = (col: string | Swatch) => cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.62 * bw + b, 0.18], [-0.62 * bw - b, 0.18]], col, 0.475, 'torso', 0.02, 0.004);
  if (bk) {   // the back of whatever is worn on the top half
    if (!K) {
      if (!r.shirt) { backMuscles(); if (r.straps) for (const s of [-1, 1]) cut(to, [[s * 0.3 * bw, 1.95 * H], [s * 0.52 * bw, 1.9 * H], [s * 0.5 * bw, 0], [s * 0.22 * bw, 0]], r.gear, 0.47, 'torso', 0.03); if (r.fem) cut(to, [[-0.66 * bw, 1.5 * H], [0.66 * bw, 1.5 * H], [0.64 * bw, 1.38 * H], [-0.64 * bw, 1.38 * H]], r.gear, 0.48, 'torso', 0.02); }
      else if (r.suit) { neckBand(shade(r.suit.jacket, 0.72), 0.1); cut(to, strip([0, 1.9 * H], [0, 0.1], 0.02, 0.02), shade(r.suit.jacket, 0.75), 0.46, 'torso', 0.01, 0.003); }
      else if (r.stripes) for (let i = -2; i <= 2; i++) { const sx = i * 0.3 * bw; cut(to, [[sx - 0.07, 0.05], [sx + 0.07, 0.05], [sx * 1.25 + 0.07, 1.85 * H], [sx * 1.25 - 0.07, 1.85 * H]], PAL.black, 0.45, 'torso', 0.02, 0.004); }
    } else {
      const t = K.top, S = K.col.top, T = K.pal.t;
      if (!covered) backMuscles();
      if (t === 'singlet_straps_up' || t === 'singlet_full') { cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.7 * bw + b * 0.8, 0.55], [0.84 * bw, 1.2 * H], [-0.84 * bw, 1.2 * H], [-0.7 * bw - b * 0.8, 0.55]], S, 0.46, 'torso', 0.03); for (const s of [-1, 1]) cut(to, [[s * 0.3 * bw, 1.95 * H], [s * 0.52 * bw, 1.9 * H], [s * 0.4 * bw, 1.2 * H], [s * 0.2 * bw, 1.2 * H]], S, 0.47, 'torso', 0.03); }
      else if (t === 'singlet_straps_down') cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.66 * bw + b * 0.9, 0.38], [-0.66 * bw - b * 0.9, 0.38]], S, 0.46, 'torso', 0.03);
      else if (t === 'top_sports') { cut(to, [[-0.66 * bw, 1.62 * H], [0.66 * bw, 1.62 * H], [0.6 * bw, 1.25 * H], [-0.6 * bw, 1.25 * H]], S, 0.46, 'torso', 0.03); for (const s of [-1, 1]) cut(to, [[s * 0.3 * bw, 1.95 * H], [s * 0.45 * bw, 1.92 * H], [s * 0.2 * bw, 1.6 * H], [s * 0.05 * bw, 1.6 * H]], S, 0.47, 'torso', 0.03); }
      else if (t === 'top_crop') { cut(to, [[-0.72 * bw, 1.0 * H], [0.72 * bw, 1.0 * H], [0.86 * bw, 1.45 * H], [0.74 * bw, 1.86 * H], [0.28, 1.98 * H], [-0.28, 1.98 * H], [-0.74 * bw, 1.86 * H], [-0.86 * bw, 1.45 * H]], S, 0.46, 'torso', 0.03); cut(to, [[-0.72 * bw, 1.06 * H], [0.72 * bw, 1.06 * H], [0.72 * bw, 0.98 * H], [-0.72 * bw, 0.98 * H]], T, 0.47, 'torso', 0.01, 0.003); }
      else if (t === 'vest_open') { cut(to, torsoPoly, S, 0.46, 'torso', 0.03); neckBand(T, 0.05); }
      else if (t === 'shirt_tshirt_base') neckBand(T);
      else if (t === 'hoodie_01') { neckBand(shade(S.c, 0.75)); cut(to, ell(0, 1.62 * H, 0.42 * bw, 0.36 * H, 16), shade(S.c, 0.82), 0.47, 'torso', 0.04); }   // the hood down the back
      else if (t === 'shirt_tank') { cut(to, [[-0.86 * bw, 1.45 * H], [-0.48 * bw, 1.98 * H], [-0.36 * bw, 1.98 * H], [-0.3 * bw, 1.75 * H], [0.3 * bw, 1.75 * H], [0.36 * bw, 1.98 * H], [0.48 * bw, 1.98 * H], [0.86 * bw, 1.45 * H], [0.9 * bw, 1.5 * H], [0.86 * bw, 2.02 * H], [-0.86 * bw, 2.02 * H], [-0.9 * bw, 1.5 * H]], sk, 0.43, 'torso', 0.01); }
      else if (t === 'jacket_leather_biker') { neckBand(shade(S.c, 0.7), 0.1); waistBand(T); }
      else if (t === 'jacket_fringe') { cut(to, [[-0.86 * bw, 1.9 * H], [0.86 * bw, 1.9 * H], [0.8 * bw, 1.45 * H], [-0.8 * bw, 1.45 * H]], T, 0.465, 'torso', 0.02, 0.004); for (let q = 0; q < 14; q++) { const x0 = (-0.78 + q * 0.12) * bw; cut(to, strip([x0, 1.48 * H], [x0, 1.12 * H], 0.025, 0.018), T, 0.466 + q * 0.0001, 'torso', 0.005, 0.006); } }
      else if (t === 'jacket_denim') { neckBand(shade(S.c, 0.82), 0.1); waistBand(shade(S.c, 0.85)); cut(to, [[-0.7 * bw, 1.5 * H], [0.7 * bw, 1.5 * H], [0.6 * bw, 1.1 * H], [0, 1.0 * H], [-0.6 * bw, 1.1 * H]], shade(S.c, 0.9), 0.465, 'torso', 0.01, 0.004); }   // the yoke across the back
      else if (t === 'jacket_satin') { neckBand(T, 0.1); waistBand(T); for (const yy of [0.62, 1.15]) cut(to, [[-0.62 * bw, yy * H], [-0.2 * bw, yy * H + 0.02], [-0.2 * bw, yy * H - 0.06], [-0.62 * bw, yy * H - 0.08]], shade(S.c, 1.25), 0.465, 'torso', 0.005, 0.003); }
      else if (t === 'vest_tactical') { cut(to, [[-0.66 * bw, 1.7 * H], [0.66 * bw, 1.7 * H], [0.62 * bw, 0.3], [-0.62 * bw, 0.3]], shade(S.c, 0.86), 0.46, 'torso', 0.03, 0.006); neckBand(shade(S.c, 0.7), 0.16); for (const sd of [-1, 1]) cut(to, strip([sd * 0.42 * bw, 1.98 * H], [sd * 0.5 * bw, 0.1], 0.13, 0.13), shade(S.c, 0.7), 0.465, 'torso', 0.02, 0.004); cut(to, strip([-0.66 * bw, 0.75 * H], [0.66 * bw, 0.75 * H], 0.1, 0.1), shade(S.c, 0.7), 0.466, 'torso', 0.02, 0.004); }
      else if (t === 'coat_fur') { for (let i = 0; i <= 9; i++) { const a = Math.PI * i / 9; cut(to, ell(0.5 * bw * Math.cos(a), 1.95 * H + 0.12 * Math.sin(a), 0.14, 0.12, 9), i % 2 ? K.pal.s : shade(K.pal.s.c, 1.12), 0.47 + i * 0.0002, 'torso', 0.04, 0.03); } cut(to, strip([0, 1.85 * H], [0, 0.1], 0.02, 0.02), shade(S.c, 0.75), 0.46, 'torso', 0.01, 0.003); }
      else if (t === 'coat_long' || t === 'suit_jacket') { neckBand(shade(S.c, 0.72), 0.1); cut(to, strip([0, 1.9 * H], [0, 0.1], 0.02, 0.02), shade(S.c, 0.75), 0.46, 'torso', 0.01, 0.003); }
      else if (t === 'top_bodysuit') { neckBand(T, 0.07); for (const sd of [-1, 1]) cut(to, strip([sd * 0.7 * bw, 1.6 * H], [sd * 0.6 * bw, 0.05], 0.07, 0.06), T, 0.465, 'torso', 0.01, 0.003); }
      else if (t === 'robe_long') { neckBand(T, 0.12); cut(to, [[-0.66 * bw - b, 0.5], [0.66 * bw + b, 0.5], [0.66 * bw + b, 0.66], [-0.66 * bw - b, 0.66]], T, 0.48, 'torso', 0.02, 0.004); }
    }
    if ((r.tats || []).indexOf('back') >= 0 && (K ? !covered : !r.shirt)) {   // a back piece: wings across the shoulder blades
      const ink = inkOf(sk); for (const sd of [-1, 1]) for (const [y0, y1, wd] of [[1.7, 1.85, 0.08], [1.55, 1.6, 0.06], [1.42, 1.38, 0.05]] as [number, number, number][]) cut(to, strip([sd * 0.05, y0 * H], [sd * 0.72 * bw, y1 * H], wd, 0.02, sd * 0.05), ink, 0.455, 'torso', 0.005, 0.003);
      cut(to, strip([0, 1.8 * H], [0, 0.6 * H], 0.06, 0.03), ink, 0.456, 'torso', 0.005, 0.003);
    }
  } else if (!K) {
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
    } else if (t === 'jacket_fringe') {   // a fringed jacket worn open: a yoke across the chest in the trim with fringe hanging from it
      cut(to, [[-0.32 * bw, 1.98 * H], [0.32 * bw, 1.98 * H], [0.12, 0.2], [-0.12, 0.2]], sk, 0.45, 'torso', 0.02, 0.004);
      for (const sd of [-1, 1]) { cut(to, [[sd * 0.32 * bw, 1.98 * H], [sd * 0.86 * bw, 1.86 * H], [sd * 0.86 * bw, 1.5 * H], [sd * 0.25 * bw, 1.42 * H]], K.pal.t, 0.47, 'torso', 0.02, 0.004);
        for (let q = 0; q < 7; q++) { const x0 = sd * (0.3 + q * 0.08) * bw; cut(to, strip([x0, 1.46 * H], [x0 + sd * 0.02, 1.12 * H], 0.025, 0.018), K.pal.t, 0.471 + q * 0.0001, 'torso', 0.005, 0.006); } }
    } else if (t === 'jacket_denim') {   // a denim jacket worn open: a pointed shirt collar, two chest pockets with flaps, buttons down each side
      cut(to, [[-0.3 * bw, 1.98 * H], [0.3 * bw, 1.98 * H], [0.16, 0.2], [-0.16, 0.2]], sk, 0.45, 'torso', 0.02, 0.004);
      for (const sd of [-1, 1]) {
        cut(to, [[sd * 0.3 * bw, 1.98 * H], [sd * 0.66 * bw, 1.94 * H], [sd * 0.46 * bw, 1.62 * H], [sd * 0.22 * bw, 1.72 * H]], shade(S.c, 0.82), 0.47, 'torso', 0.03, 0.004);   // the collar points
        cut(to, [[sd * 0.3 * bw, 1.42 * H], [sd * 0.66 * bw, 1.42 * H], [sd * 0.64 * bw, 1.12 * H], [sd * 0.32 * bw, 1.12 * H]], shade(S.c, 0.9), 0.465, 'torso', 0.01, 0.004);   // a pocket
        cut(to, [[sd * 0.28 * bw, 1.46 * H], [sd * 0.68 * bw, 1.46 * H], [sd * 0.62 * bw, 1.34 * H], [sd * 0.48 * bw, 1.3 * H], [sd * 0.34 * bw, 1.34 * H]], shade(S.c, 0.78), 0.468, 'torso', 0.01, 0.003);   // its flap
        for (const yy of [1.2, 0.85, 0.5, 0.18]) cut(to, ell(sd * 0.2 * bw, yy * H, 0.035, 0.035, 8), K.pal.h, 0.475, 'torso', 0.01, 0.002);
        for (const yy of [1.6, 0.9]) cut(to, strip([sd * 0.18 * bw, yy * H], [sd * 0.82 * bw, yy * H - 0.02], 0.012, 0.012), K.pal.t, 0.466, 'torso', 0.003, 0.002);   // the orange stitching
      }
      cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.62 * bw + b, 0.18], [-0.62 * bw - b, 0.18]], shade(S.c, 0.85), 0.475, 'torso', 0.02, 0.004);   // the waistband
    } else if (t === 'jacket_satin') {   // a ring jacket: a ribbed collar, cuffs and waistband in the trim, a zip
      cut(to, strip([-0.3 * bw, 1.97 * H], [0.3 * bw, 1.97 * H], 0.1, 0.1, -0.1 * H), T, 0.47, 'torso', 0.02, 0.003);
      cut(to, [[-0.6 * bw - b, 0], [0.6 * bw + b, 0], [0.62 * bw + b, 0.2], [-0.62 * bw - b, 0.2]], T, 0.475, 'torso', 0.02, 0.004);
      cut(to, strip([0.04, 0.2], [0.06, 1.9 * H], 0.03, 0.03), K.pal.h, 0.48, 'torso', 0.01, 0.002);
      for (const yy of [0.62, 1.15]) cut(to, [[-0.62 * bw, yy * H], [-0.2 * bw, yy * H + 0.02], [-0.2 * bw, yy * H - 0.06], [-0.62 * bw, yy * H - 0.08]], shade(S.c, 1.25), 0.465, 'torso', 0.005, 0.003);   // the sheen
    } else if (t === 'coat_long') {   // a long coat, open: the chest shows, wide lapels in a darker shade
      cut(to, [[-0.3 * bw, 1.98 * H], [0.3 * bw, 1.98 * H], [0.1, 0.1], [-0.1, 0.1]], sk, 0.45, 'torso', 0.02, 0.004);
      for (const sd of [-1, 1]) cut(to, [[sd * 0.3 * bw, 1.98 * H], [sd * 0.7 * bw, 1.88 * H], [sd * 0.46 * bw, 1.2 * H], [sd * 0.1, 0.1]], shade(S.c, 0.72), 0.47, 'torso', 0.03, 0.004);
    } else if (t === 'coat_fur') {   // a long coat worn open with a thick fur collar down both lapels
      cut(to, [[-0.3 * bw, 1.98 * H], [0.3 * bw, 1.98 * H], [0.1, 0.1], [-0.1, 0.1]], sk, 0.45, 'torso', 0.02, 0.004);
      for (const sd of [-1, 1]) for (let i = 0; i <= 8; i++) { const u = i / 8, x = sd * (0.5 * bw - 0.36 * bw * u), y = (1.96 - 0.95 * u) * H; cut(to, ell(x, y, 0.15 - 0.04 * u, 0.13, 9), i % 2 ? K.pal.s : shade(K.pal.s.c, 1.12), 0.47 + i * 0.0002, 'torso', 0.04, 0.03); }
    } else if (t === 'vest_tactical') {   // an armoured vest with no sleeves: a high collar, straps over the shoulders, pouches across the belly, a strap and buckles
      cut(to, strip([-0.36 * bw, 1.98 * H], [0.36 * bw, 1.98 * H], 0.18, 0.18, -0.06 * H), shade(S.c, 0.7), 0.47, 'torso', 0.03, 0.004);
      for (const sd of [-1, 1]) cut(to, strip([sd * 0.42 * bw, 1.98 * H], [sd * 0.38 * bw, 1.0 * H], 0.13, 0.12), shade(S.c, 0.72), 0.462, 'torso', 0.02, 0.004);
      cut(to, [[-0.66 * bw, 1.42 * H], [0.66 * bw, 1.42 * H], [0.64 * bw, 1.0 * H], [-0.64 * bw, 1.0 * H]], shade(S.c, 0.88), 0.461, 'torso', 0.02, 0.006);   // the chest plate
      for (const xx of [-0.42, 0, 0.42]) { cut(to, [[xx * bw - 0.17 * bw, 0.75 * H], [xx * bw + 0.17 * bw, 0.75 * H], [xx * bw + 0.16 * bw, 0.3 * H], [xx * bw - 0.16 * bw, 0.3 * H]], shade(S.c, 0.8), 0.465, 'torso', 0.03, 0.006); cut(to, [[xx * bw - 0.18 * bw, 0.78 * H], [xx * bw + 0.18 * bw, 0.78 * H], [xx * bw + 0.17 * bw, 0.62 * H], [xx * bw - 0.17 * bw, 0.62 * H]], shade(S.c, 0.68), 0.467, 'torso', 0.01, 0.004); cut(to, ell(xx * bw, 0.66 * H, 0.03, 0.03, 8), K.pal.h, 0.468, 'torso', 0.005, 0.002); }   // three pouches, each with its flap and snap
      cut(to, strip([-0.66 * bw, 0.9 * H], [0.66 * bw, 0.9 * H], 0.07, 0.07), shade(S.c, 0.62), 0.469, 'torso', 0.01, 0.004);
      for (const sd of [-1, 1]) cut(to, [[sd * 0.32 * bw, 0.94 * H], [sd * 0.44 * bw, 0.94 * H], [sd * 0.44 * bw, 0.86 * H], [sd * 0.32 * bw, 0.86 * H]], K.pal.h, 0.47, 'torso', 0.01, 0.002);   // the buckles
    } else if (t === 'top_bodysuit') {   // one piece from the neck to the hips, the trim at the neck and a stripe down each side
      cut(to, strip([-0.26 * bw, 1.95 * H], [0.26 * bw, 1.95 * H], 0.07, 0.07, -0.08 * H), T, 0.47, 'torso', 0.01, 0.003);
      for (const sd of [-1, 1]) cut(to, strip([sd * 0.7 * bw, 1.6 * H], [sd * 0.6 * bw, 0.05], 0.07, 0.06), T, 0.465, 'torso', 0.01, 0.003);
    } else if (t === 'robe_long') {
      for (const sd of [-1, 1]) cut(to, strip([sd * 0.32 * bw, 1.98 * H], [sd * 0.05, 0.15], 0.14, 0.12), T, 0.47, 'torso', 0.02, 0.004);   // the lapels
      cut(to, [[-0.66 * bw - b, 0.5], [0.66 * bw + b, 0.5], [0.66 * bw + b, 0.66], [-0.66 * bw - b, 0.66]], T, 0.48, 'torso', 0.02, 0.004);   // the sash
    } else if (t === 'suit_jacket') suitBits(S.c, T.c, K.pal.h.c);
    if (has('chain_gold')) for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.15 + 0.7 * i / 10); cut(to, ell(0.36 * bw * Math.cos(a), 1.9 * H + 0.55 * H * Math.sin(a), 0.05, 0.05, 8), K.pal.h, 0.495, 'torso', 0.02, 0.002); }
  }
  if (K) {   // pieces worn at the neck and across the body, front and back (20 October)
    if (has('pearls') && !bk) for (const [rr, n0] of [[0.34, 12], [0.44, 14]] as [number, number][]) for (let i = 0; i <= n0; i++) { const a = Math.PI * (1.15 + 0.7 * i / n0); cut(to, ell(rr * bw * Math.cos(a), 1.92 * H + rr * 1.5 * H * Math.sin(a), 0.042, 0.042, 8), { c: '#f6f1e4', f: 'foil' }, 0.496, 'torso', 0.02, 0.002); }
    if (has('scarf')) {   // a long scarf round the neck, its ends hanging down the front, fringed in the second colour
      cut(to, strip([-0.4 * bw, 1.95 * H], [0.4 * bw, 1.95 * H], 0.22, 0.22, -0.08 * H), K.pal.t, 0.497, 'torso', 0.03, 0.004);
      if (!bk) for (const [x0, x1, y1] of [[0.08, 0.14, 0.7], [0.3, 0.46, 0.95]] as [number, number, number][]) { cut(to, strip([x0 * bw, 1.9 * H], [x1 * bw, y1 * H], 0.22, 0.2, 0.02), K.pal.t, 0.498, 'torso', 0.03, 0.004); for (let q = -2; q <= 2; q++) cut(to, strip([x1 * bw + q * 0.04, y1 * H - 0.02], [x1 * bw + q * 0.045, y1 * H - 0.14], 0.02, 0.015), K.pal.s, 0.499, 'torso', 0.005, 0.004); }
      else cut(to, strip([0.1 * bw, 1.9 * H], [0.18 * bw, 1.25 * H], 0.13, 0.12), K.pal.t, 0.498, 'torso', 0.03, 0.004);
    }
    if (has('feather_boa')) { const puff = (x: number, y: number, k: number) => cut(to, ell(x, y, 0.1 + 0.03 * (k % 2), 0.09, 9), k % 3 ? K.pal.s : shade(K.pal.s.c, 1.15), 0.5 + k * 0.0002, 'torso', 0.04, 0.03);   // a feather boa: soft puffs round the neck and down both sides
      let k = 0; for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.0 + i / 6); puff(0.42 * bw * Math.cos(a), 1.92 * H + 0.1 * Math.sin(a), k++); }
      for (const sd of [-1, 1]) for (let i = 1; i <= (bk ? 3 : 6); i++) puff(sd * (0.44 - 0.02 * i) * bw, (1.92 - 0.16 * i) * H, k++); }
    if (has('snake')) {   // a python draped round the neck and over both shoulders, its head resting on the chest
      const P0: Pt[] = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = Math.PI * (1.05 + 0.9 * u); P0.push([0.62 * bw * Math.cos(a) * (bk ? -1 : 1), 1.78 * H + 0.28 * H * Math.sin(a) - (u > 0.75 ? (u - 0.75) * 2.4 * H : 0)]); }
      P0.forEach(([x, y], i) => { cut(to, ell(x, y, 0.13, 0.11, 10), i % 2 ? '#6b8f2a' : '#c9a23a', 0.5 + i * 0.0003, 'torso', 0.04, 0.004); });
      if (!bk) { const [hx, hy] = P0[P0.length - 1]; cut(to, ell(hx, hy - 0.1, 0.12, 0.16, 12), '#6b8f2a', 0.506, 'torso', 0.04, 0.004); for (const d of [-1, 1]) cut(to, ell(hx + d * 0.05, hy - 0.05, 0.02, 0.02, 6), '#1c1b1f', 0.507, 'torso', 0.005, 0.001); }
    }
    if (has('whistle')) {   // a whistle on a cord round the neck
      if (bk) cut(to, strip([-0.3 * bw, 1.95 * H], [0.3 * bw, 1.95 * H], 0.03, 0.03, -0.08 * H), K.pal.t, 0.497, 'torso', 0.005, 0.002);
      else { for (const sd of [-1, 1]) cut(to, strip([sd * 0.3 * bw, 1.97 * H], [0.02, 1.42 * H], 0.025, 0.025), K.pal.t, 0.497, 'torso', 0.005, 0.002); cut(to, [[-0.06, 1.44 * H], [0.16, 1.44 * H], [0.16, 1.32 * H], [-0.06, 1.32 * H]], { c: '#d8dde4', f: 'foil' }, 0.498, 'torso', 0.02, 0.002); cut(to, ell(0.0, 1.38 * H, 0.06, 0.06, 10), { c: '#d8dde4', f: 'foil' }, 0.4985, 'torso', 0.02, 0.002); }
    }
    if (has('trombone')) {   // a brass trombone held across the body: two long slide tubes, the bend at the bottom, the bell up by the far shoulder
      const gx = bk ? -1 : 1, brass = { c: '#d9a93a', f: 'foil' as const };
      for (const dy of [0, 0.12]) cut(to, strip([gx * 0.7 * bw, 0.1 + dy], [-gx * 0.62 * bw, 1.75 * H + dy], 0.035, 0.035), brass, 0.505, 'torso', 0.03, 0.002);
      cut(to, ell(gx * 0.72 * bw, 0.16, 0.09, 0.09, 10), brass, 0.506, 'torso', 0.02, 0.002);
      cut(to, [[-gx * 0.5 * bw, 1.62 * H], [-gx * 0.62 * bw, 1.88 * H], [-gx * 1.05 * bw, 2.1 * H], [-gx * 0.82 * bw, 1.5 * H]], brass, 0.507, 'torso', 0.04, 0.003);   // the bell
      if (!bk) cut(to, ell(-gx * 0.94 * bw, 1.8 * H, 0.08, 0.2, 12), shade('#d9a93a', 0.55), 0.508, 'torso', 0.005, 0.002);
    }
    if (has('guitar')) {   // a guitar slung across the body on its strap: the neck up over the far shoulder
      const gx = bk ? -1 : 1;
      cut(to, strip([gx * 0.66 * bw, 1.85 * H], [-gx * 0.5 * bw, 0.2], 0.05, 0.05), PAL.black, 0.49, 'torso', 0.02, 0.003);   // the strap
      cut(to, strip([-gx * 0.72 * bw, 2.3 * H], [gx * 0.2 * bw, 0.7 * H], 0.09, 0.11), '#6a3d1c', 0.5, 'torso', 0.03, 0.003);   // the neck
      cut(to, [[-gx * 0.7 * bw, 2.25 * H], [-gx * 0.52 * bw, 2.32 * H], [-gx * 0.45 * bw, 2.18 * H], [-gx * 0.62 * bw, 2.12 * H]], '#2a1a10', 0.502, 'torso', 0.02, 0.003);   // the head
      cut(to, ell(gx * 0.3 * bw, 0.55 * H, 0.6 * bw, 0.42 * H, 20), K.pal.s, 0.505, 'torso', 0.04);   // the body
      cut(to, ell(gx * 0.5 * bw, 0.25 * H, 0.48 * bw, 0.34 * H, 18), K.pal.s, 0.506, 'torso', 0.04);
      if (!bk) { cut(to, ell(gx * 0.3 * bw, 0.6 * H, 0.15, 0.15, 12), PAL.black, 0.508, 'torso', 0.01, 0.002); cut(to, strip([gx * 0.38 * bw, 0.28 * H], [gx * 0.66 * bw, 0.18 * H], 0.07, 0.07), K.pal.h, 0.509, 'torso', 0.01, 0.002); }   // the sound hole and bridge
    }
  }
  if (!bk && (r.bodyHair || 0) > 0 && (K ? !covered : !r.shirt)) {   // body hair: a patch on the chest, and a line down the belly
    const bh = shade(r.hairCol, 0.95), tuft = (x: number, y: number, k: number) => cut(to, strip([x, y], [x + k * 0.035, y - 0.075], 0.028, 0.006), bh, 0.452, 'torso', 0.003, 0.003);
    for (let i = 0; i < 18; i++) { const u = ((i * 7) % 18) / 17, v = ((i * 11) % 5) / 4, x = (u - 0.5) * 0.62 * bw, y = (1.38 + 0.26 * v - 0.12 * Math.abs(u - 0.5)) * H; tuft(x, y, x < 0 ? -1 : 1); }
    if (r.bodyHair! > 1) for (let k = 0; k < 9; k++) tuft((k % 2 ? 0.025 : -0.025), (1.3 - 0.11 * k) * H, k % 2 ? 1 : -1);
  }
  if (!bk && (r.scars || []).indexOf('chest') >= 0 && (K ? !covered : !r.shirt)) { cut(to, strip([-0.45 * bw, 1.7 * H], [0.4 * bw, 1.2 * H], 0.05, 0.04, 0.02), shade(sk, 0.62), 0.457, 'torso', 0.004, 0.004); cut(to, strip([-0.45 * bw, 1.7 * H], [0.4 * bw, 1.2 * H], 0.028, 0.02, 0.02), shade(sk, 1.45), 0.458, 'torso', 0.004, 0.003); }
  if (!bk && (r.tats || []).indexOf('chest') >= 0 && (K ? !covered : !r.shirt)) {   // a chest piece: wings spread from the breastbone
    const ink = inkOf(sk); for (const sd of [-1, 1]) { cut(to, strip([sd * 0.06, 1.47 * H], [sd * 0.55 * bw, 1.62 * H], 0.07, 0.025, sd * 0.04), ink, 0.455, 'torso', 0.005, 0.003); cut(to, strip([sd * 0.08, 1.42 * H], [sd * 0.45 * bw, 1.46 * H], 0.05, 0.02, sd * 0.03), ink, 0.455, 'torso', 0.005, 0.003); }
    cut(to, [[0, 1.55 * H], [0.05, 1.45 * H], [0, 1.34 * H], [-0.05, 1.45 * H]], ink, 0.456, 'torso', 0.005, 0.003);
  }
  const plate = (f: F, cx: number, cy: number, sc: number, z0: number, J: string, b?: BeltData) => {   // the plate of a title belt: its own metal and gem, or gold on black with a red stone
    const m = b ? (METAL[b.mt] || METAL.gold) : null, rim = m ? m[0] : PAL.gold, face = m ? m[1] : PAL.yellow, gem = b ? (b.gm && b.gm !== 'none' ? GEM[b.gm] || PAL.red : null) : PAL.red;
    cut(f, ell(cx, cy, 0.42 * sc, 0.32 * sc, 20), { c: rim, f: 'foil' }, z0, J, 0.04); cut(f, ell(cx, cy, 0.28 * sc, 0.2 * sc, 16), { c: face, f: 'foil' }, z0 + 0.004, J, 0.02);
    if (gem) cut(f, star(cx, cy, 0.12 * sc, 5, 0.45), gem, z0 + 0.008, J, 0.01, 0.003);
  };
  // title belts are no longer worn across the body (Ryan, 21 October: "get rid of those belts on their chests"): a
  // champion carries their belt in the hand (in arm() above). A Create a Player outfit can still put one on.
  const BL = (r.beltL || []).slice(0, 3), nb = 0, strapOf = (i: number) => ({ c: BL[i] && BL[i].st ? BL[i].st : PAL.black, f: 'leather' as const });
  if (nb >= 3) { cut(to, strip([-0.62 * bw, 1.88 * H], [0.66 * bw, 0.25], 0.14, 0.14), strapOf(2), 0.525, 'torso', 0.03, 0.004); if (!bk) plate(to, 0.28 * bw, 0.66 * H, 0.85, 0.528, 'torso', BL[2]); }
  if (has('belt_waist') || nb >= 2) { cut(root, [[-0.66 * w, 0.14], [0.66 * w, 0.14], [0.67 * w, -0.12], [-0.67 * w, -0.12]], nb >= 2 ? strapOf(1) : { c: PAL.black, f: 'leather' }, 0.395, 'body', 0.03, 0.004); if (!bk) plate(root, 0.04, 0.01, 1.05, 0.4, 'body', nb >= 2 ? BL[1] : undefined); }
  if (has('belt_shoulder') || nb >= 1) { cut(to, strip([0.62 * bw, 1.88 * H], [-0.66 * bw, 0.25], 0.14, 0.14), nb >= 1 ? strapOf(0) : { c: PAL.black, f: 'leather' }, 0.53, 'torso', 0.03, 0.004); if (!bk) plate(to, 0.02, 1.08 * H, 1, 0.535, 'torso', nb >= 1 ? BL[0] : undefined); }
  rig.anchors.waist = W_(root, [[0, 0.2]])[0]; rig.anchors.chest = W_(to, [[0, 1.4 * H]])[0];
  const nk = child(to, [0, 1.95 * H], P.head); note('head', nk, to, true);
  cut(nk, [[-0.26 * w, -0.1], [0.26 * w, -0.1], [0.22 * w, 0.45], [-0.22 * w, 0.45]], sk, 0.5, 'head');   // the neck in the skin's own colour: no shadow on it (Ryan, 20 October: "it will look cleaner")
  if (K && has('collar_spiked')) { cut(nk, [[-0.25 * w, 0.1], [0.25 * w, 0.1], [0.24 * w, 0.26], [-0.24 * w, 0.26]], { c: PAL.black, f: 'leather' }, 0.508, 'head', 0.02, 0.003); for (let i = 0; i < 5; i++) { const x = -0.2 * w + i * 0.1 * w; cut(nk, [[x - 0.035, 0.12], [x + 0.035, 0.12], [x, bk ? 0.2 : 0.02]], { c: '#d8dde4', f: 'foil' }, 0.509, 'head', 0.01, 0.001); } }   // a black leather collar with steel spikes
  if ((r.tats || []).indexOf('neck') >= 0 && !(K && K.top === 'suit_jacket')) for (const yy of [0.05, 0.17, 0.29]) cut(nk, [[-0.2 * w, yy], [0.2 * w, yy + 0.03], [0.19 * w, yy + 0.07], [-0.19 * w, yy + 0.04]], inkOf(sk), 0.505, 'head', 0.005, 0.004);
  if (K && K.top === 'hoodie_01' && !bk) cut(nk, ell(-0.12, 0.85, 0.72, 0.8, 18), shade(K.pal.s.c, 0.8), 0.52, 'head', 0.04);   // the hood down behind the head
  if (bk) headBack(nk, r, 0.56, cut); else head(nk, r, 0.56, expr, cut, mk);
  if (!bk && (mk.blood || 0) >= 3) for (const [x0, len] of [[-0.3, 0.9], [0.1, 0.6], [0.45, 1.1]] as [number, number][]) cut(to, strip([x0 * w, 1.9 * H], [x0 * w + 0.04, 1.9 * H - len], 0.1, 0.03), BLOOD, 0.5, 'torso', 0.01, 0.01);   // blood run down the chest
  rig.anchors.head = W_(nk, [[0, 1.0]])[0];
  rig.anchors.shoulders = W_(to, [[0, 1.85 * H]])[0];
  arm('n', 0.95 + ((pl.lz || {}).arm_n || 0));
  // lettering and shapes stuck on the gear: on the chest, or down the near thigh
  if (K && K.layers.length) {
    const hpN = child(root, [0.32 * w, -0.42], P.hip_n);
    K.layers.forEach((ly, li) => {
      const onBack = ly.on === 'back'; if (onBack !== bk) return;   // lettering on the back shows from behind, the rest from the front
      const leg_ = ly.on === 'lower_body', fr = leg_ ? hpN : to, ox = 0, oy = leg_ ? -0.5 * L.thigh : onBack ? 1.25 * H : 1.0 * H, u = leg_ ? 0.04 * aw : 0.06 * bw;
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
/** The back of the head: the hair, the back of a mask, the ears at the sides, a hat; no face. */
/** The head's outline from the recipe. The jaw tapers to a defined chin, as in the construction-paper portrait
    (Ryan, 21 October), a little more for women. The front and the back are cut from the same shape. */
function headOf(r: Recipe): Head {
  const s = 0.47;
  return { cx: 0, cy: 0.98, rx: r.head.rx * s, ryt: r.head.ryt * s, ryb: r.head.ryb * s * 1.04, sq: r.fem ? Math.min(r.head.sq, 2.4) : r.head.sq, chin: Math.min(0.55, r.head.chin + (r.fem ? 0.16 : 0.08)) };
}
function headBack(fr: F, r: Recipe, z: number, cut: (f: F, poly: Pt[], col: string | Swatch, z: number, joint?: string, lift?: number, rough?: number) => void) {
  const hd = headOf(r), J = 'head', sk = r.skin;
  const put = (poly: Pt[], col: string | Swatch, dz: number, rough = 0.008) => cut(fr, poly, col, z + dz, J, 0.03, rough);
  const K = r.kit, acc = (a: string) => !!K && K.acc.indexOf(a) >= 0, HC = r.hairCol, HB = r.hairMix === 'under' && r.hairCol2 ? r.hairCol2 : HC;
  for (const sd of [-1, 1]) put(ell(sd * hd.rx * 0.97, hd.cy - 0.04, 0.07, 0.12, 10), shade(sk, 0.92), 0.015);   // the ears, just showing at the sides
  put(headPoly(hd), sk, 0.02);
  const nape = hd.cy - hd.ryb * 0.45, cap = (k: number, low = nape): Pt[] => headPoly(hd, k, -0.3, Math.PI + 0.3, 20).concat([[-hd.rx * 0.92 * k, low], [hd.rx * 0.92 * k, low]] as Pt[]);
  if (r.mask) {
    const kind = r.mask.kind || 'open', T = r.mask.trim;
    if (kind === 'half') put(headPoly(hd, 1.04, -0.12, Math.PI + 0.12, 22).concat([[-hd.rx * 1.02, hd.cy - 0.12], [hd.rx * 1.02, hd.cy - 0.12]] as Pt[]), r.mask.base, 0.04);
    else put(headPoly(hd, 1.04), r.mask.base, 0.04);
    if ((r.maskDesign || '') === 'split') put(headPoly(hd, 1.045, Math.PI * 0.5, Math.PI * 1.5, 18), T, 0.05);
    if (kind === 'hood') put([[-hd.rx * 0.55, hd.cy + hd.ryt * 0.8], [hd.rx * 0.55, hd.cy + hd.ryt * 0.8], [0, hd.cy + hd.ryt * 1.5]], r.mask.base, 0.041, 0.012);
    else if (kind !== 'half') {   // the laces up the back of the mask
      put(strip([0, hd.cy + hd.ryt * 0.3], [0, hd.cy - hd.ryb * 0.95], 0.09, 0.07), T, 0.06, 0.004);
      for (let i = 0; i < 4; i++) { const yy = hd.cy + hd.ryt * 0.2 - i * 0.16; put(strip([-0.07, yy], [0.07, yy - 0.08], 0.02, 0.02), shade(T, 0.6), 0.065, 0.002); }
    }
  } else if (r.hair !== 'bald') {
    const h = r.hair;
    if (h === 'afro') put(ell(0, hd.cy + hd.ryt * 0.25, hd.rx * 1.55, hd.ryt * 1.45, 26), HC, 0.19, 0.05);
    else if (h === 'mohawk') put(strip([0, hd.cy + hd.ryt + 0.25], [0, nape], 0.17, 0.1), HC, 0.19, 0.01);
    else {
      put(cap(h === 'buzz' ? 1.02 : h === 'spiky' ? 1.15 : h === 'curls' ? 1.1 : 1.06), h === 'undercut' ? shade(HC, 0.78) : HC, 0.19, h === 'spiky' || h === 'curls' ? 0.04 : 0.012);
      if (h === 'undercut') put(headPoly(hd, 1.18, 0.4, Math.PI - 0.4, 14).concat([[-hd.rx * 0.6, hd.cy + hd.ryt * 0.55], [hd.rx * 0.6, hd.cy + hd.ryt * 0.55]] as Pt[]), HC, 0.195, 0.012);
      if (h === 'long' || h === 'wild' || h === 'bob' || h === 'mullet') {   // hair down the back
        const wd = h === 'wild' ? 1.35 : h === 'mullet' ? 0.75 : 1.1, low = h === 'bob' ? 0.85 : h === 'mullet' ? 1.5 : h === 'wild' ? 1.5 : 1.75;
        put([[-hd.rx * 1.05, hd.cy + 0.1], [hd.rx * 1.05, hd.cy + 0.1], [hd.rx * wd, hd.cy - hd.ryb * low], [-hd.rx * wd, hd.cy - hd.ryb * low]], HB, 0.2, h === 'wild' ? 0.07 : 0.025);
      }
      if (h === 'ponytail') { put(strip([0, hd.cy + hd.ryt * 0.35], [0.04, hd.cy - hd.ryb * 1.5], 0.2, 0.09, 0.05), HB, 0.2, 0.02); put(ell(0, hd.cy + hd.ryt * 0.3, 0.06, 0.06, 8), shade(HB, 0.5), 0.205, 0.003); }
      if (h === 'pigtails') for (const sd of [-1, 1]) { put(strip([sd * hd.rx * 0.8, hd.cy + 0.1], [sd * hd.rx * 1.25, hd.cy - hd.ryb * 1.2], 0.17, 0.07, sd * 0.06), HB, 0.2, 0.02); put(ell(sd * hd.rx * 0.82, hd.cy + 0.06, 0.055, 0.055, 8), shade(HB, 0.5), 0.205, 0.003); }
      if (h === 'dreads') for (let i = 0; i < 7; i++) { const x0 = (i - 3) * hd.rx * 0.3; put(strip([x0, hd.cy + 0.2], [x0 * 1.2, hd.cy - hd.ryb * (1.1 + (i % 3) * 0.25)], 0.09, 0.07, 0.03), shade(HB, i % 2 ? 0.85 : 1), 0.2 + i * 0.0005, 0.015); }
      if (h === 'braids') { for (let i = 0; i < 4; i++) { const x = hd.rx * (-0.66 + i * 0.44); put(strip([x, hd.cy + hd.ryt * 0.9], [x * 0.8, nape], 0.03, 0.03), shade(HC, 0.55), 0.195, 0.003); } for (const sd of [-1, 1]) put(strip([sd * 0.12, nape], [sd * 0.15, hd.cy - hd.ryb * 1.2], 0.07, 0.05), HB, 0.2, 0.01); }
      if (h === 'bun') put(ell(0, hd.cy + hd.ryt * 1.1, 0.17, 0.14, 14), HC, 0.2, 0.015);
      if (h === 'tower') put([[-hd.rx * 0.8, hd.cy + hd.ryt * 0.7], [hd.rx * 0.8, hd.cy + hd.ryt * 0.7], [hd.rx * 0.7, hd.cy + hd.ryt * 3.2], [hd.rx * 0.3, hd.cy + hd.ryt * 3.5], [-hd.rx * 0.3, hd.cy + hd.ryt * 3.5], [-hd.rx * 0.7, hd.cy + hd.ryt * 3.2]], HC, 0.2, 0.03);
      if (h === 'braid') { for (let i = 0; i < 12; i++) { const t = i / 11; put(ell(i % 2 ? 0.035 : -0.035, hd.cy - t * 3.0, 0.14 - 0.05 * t, 0.16, 10), shade(HB, i % 2 ? 0.8 : 1), 0.2 + i * 0.0005, 0.01); } put(ell(0, hd.cy - 3.1, 0.05, 0.05, 8), shade(HB, 0.5), 0.207, 0.003); }
      if (h === 'curls') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.05 + 0.9 * i / 6); put(ell(hd.rx * 1.05 * Math.cos(a), hd.cy + hd.ryt * 1.05 * Math.sin(a), 0.11, 0.11, 10), HC, 0.2, 0.02); }
    }
    if (r.hairCol2 && r.hairMix === 'tips') for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.06 + 0.88 * i / 8); put(ell(hd.rx * 1.06 * Math.cos(a), hd.cy + hd.ryt * 1.06 * Math.sin(a), 0.075, 0.055, 8), r.hairCol2, 0.205, 0.012); }
  } else if ((r.scars || []).indexOf('head') >= 0) put(strip([hd.rx * 0.35, hd.cy + hd.ryt * 0.9], [-hd.rx * 0.45, hd.cy + hd.ryt * 0.6], 0.045, 0.036, 0.01), shade(sk, 0.62), 0.21, 0.004);
  if (acc('bandana')) { put(strip([-hd.rx * 1.02, hd.cy + 0.38], [hd.rx * 1.02, hd.cy + 0.42], 0.15, 0.15, 0.04), K!.pal.s, 0.215, 0.006); for (const sd of [-1, 1]) put([[0, hd.cy + 0.38], [sd * 0.12, hd.cy + 0.1], [sd * 0.2, hd.cy + 0.14], [sd * 0.05, hd.cy + 0.42]], K!.pal.s, 0.216, 0.01); }   // the knot and its tails
  if (acc('hat_cap')) { put(headPoly(hd, 1.08, 0.05, Math.PI - 0.05, 18).concat([[-hd.rx * 1.04, hd.cy + hd.ryt * 0.5], [hd.rx * 1.04, hd.cy + hd.ryt * 0.5]] as Pt[]), K!.pal.s, 0.3, 0.006); put(ell(0, hd.cy + hd.ryt * 0.58, 0.12, 0.06, 10), shade(K!.pal.s.c, 0.7), 0.305, 0.002); }   // the strap gap at the back
  if (acc('hat_beanie')) { put(headPoly(hd, 1.1, -0.02, Math.PI + 0.02, 18, 0.04).concat([[-hd.rx * 1.06, hd.cy + hd.ryt * 0.45], [hd.rx * 1.06, hd.cy + hd.ryt * 0.45]] as Pt[]), K!.pal.s, 0.3, 0.012); put(strip([-hd.rx * 1.08, hd.cy + hd.ryt * 0.52], [hd.rx * 1.08, hd.cy + hd.ryt * 0.52], 0.16, 0.16), K!.pal.t, 0.31, 0.01); }
  if (acc('crown')) { const cr: Pt[] = [[-hd.rx * 0.78, hd.cy + hd.ryt * 0.82]]; for (let i = 0; i <= 8; i++) cr.push([-hd.rx * 0.78 + 1.56 * hd.rx * i / 8, hd.cy + hd.ryt * (i % 2 ? 1.12 : 1.42)]); cr.push([hd.rx * 0.78, hd.cy + hd.ryt * 0.82]); put(cr, { c: PAL.gold, f: 'foil' }, 0.32, 0.006); }
  if (acc('hat_campaign')) {   // a drill sergeant's hat: a wide flat brim and a crown pinched into four dents
    put(strip([-hd.rx * 1.8, hd.cy + hd.ryt * 0.66], [hd.rx * 1.8, hd.cy + hd.ryt * 0.66], 0.08, 0.08), K!.pal.s, 0.3, 0.004);
    put([[-hd.rx * 0.9, hd.cy + hd.ryt * 0.66], [hd.rx * 0.9, hd.cy + hd.ryt * 0.66], [hd.rx * 0.55, hd.cy + hd.ryt * 1.4], [0, hd.cy + hd.ryt * 1.62], [-hd.rx * 0.55, hd.cy + hd.ryt * 1.4]], K!.pal.s, 0.31, 0.006);
    put([[-hd.rx * 0.88, hd.cy + hd.ryt * 0.7], [hd.rx * 0.88, hd.cy + hd.ryt * 0.7], [hd.rx * 0.86, hd.cy + hd.ryt * 0.82], [-hd.rx * 0.86, hd.cy + hd.ryt * 0.82]], shade(K!.pal.s.c, 0.6), 0.315, 0.004);
    for (const d of [-0.3, 0.3]) put(strip([d * hd.rx, hd.cy + hd.ryt * 1.45], [d * hd.rx * 1.3, hd.cy + hd.ryt * 0.95], 0.03, 0.02), shade(K!.pal.s.c, 0.75), 0.316, 0.003);
  }
  if (acc('hat_cowboy')) {
    put(strip([-hd.rx * 1.75, hd.cy + hd.ryt * 0.62], [hd.rx * 1.75, hd.cy + hd.ryt * 0.62], 0.1, 0.1, 0.12), K!.pal.s, 0.3, 0.006);
    put([[-hd.rx * 0.95, hd.cy + hd.ryt * 0.6], [hd.rx * 0.95, hd.cy + hd.ryt * 0.6], [hd.rx * 0.8, hd.cy + hd.ryt * 1.45], [0.1, hd.cy + hd.ryt * 1.3], [-0.1, hd.cy + hd.ryt * 1.3], [-hd.rx * 0.8, hd.cy + hd.ryt * 1.45]], K!.pal.s, 0.31, 0.008);
    put([[-hd.rx * 0.92, hd.cy + hd.ryt * 0.66], [hd.rx * 0.92, hd.cy + hd.ryt * 0.66], [hd.rx * 0.9, hd.cy + hd.ryt * 0.82], [-hd.rx * 0.9, hd.cy + hd.ryt * 0.82]], K!.pal.t, 0.315, 0.004);
  }
  if (acc('headband')) put(strip([-hd.rx * 1.06, hd.cy + hd.ryt * 0.62], [hd.rx * 1.06, hd.cy + hd.ryt * 0.66], 0.15, 0.15, 0.03), K!.pal.t, 0.3, 0.006);
  if (acc('antennae')) for (const sd of [-1, 1]) { put(strip([sd * 0.14, hd.cy + hd.ryt * 0.92], [sd * 0.34, hd.cy + hd.ryt * 1.9], 0.025, 0.02, sd * 0.04), K!.pal.h, 0.33, 0.002); put(ell(sd * 0.35, hd.cy + hd.ryt * 1.95, 0.075, 0.075, 12), K!.pal.t, 0.335, 0.003); }
  if (r.headset || acc('headset')) { const band: Pt[] = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.02 + 0.96 * i / 12); band.push([hd.rx * 1.1 * Math.cos(a), hd.cy + hd.ryt * 1.1 * Math.sin(a)]); } for (let i = 12; i >= 0; i--) { const a = Math.PI * (0.02 + 0.96 * i / 12); band.push([hd.rx * 1.02 * Math.cos(a), hd.cy + hd.ryt * 1.02 * Math.sin(a)]); } put(band, '#18181c', 0.24, 0.004); }
}
/** A lighter sheet for a lock of hair: lighter in its own colour, or for very dark hair a warm brown, so it never reads as grey. */
function hiLock(c: string): string { const n = parseInt(c.slice(1), 16), l = ((n >> 16) + ((n >> 8) & 255) + (n & 255)) / 3; return l < 60 ? mixc(c, '#6a4b3c', 0.32) : shade(c, 1.14); }
/** Two colours mixed, `t` of the way from a to b. */
function mixc(a: string, b: string, t: number): string {
  const p = (h: string) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }, A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function head(fr: F, r: Recipe, z: number, expr: string, cut: (f: F, poly: Pt[], col: string | Swatch, z: number, joint?: string, lift?: number, rough?: number) => void, mk: Marks = {}) {
  const hd = headOf(r), tq = 0.09;
  const sk = r.skin, dk = shade(sk, 0.74), deep = shade(sk, 0.5), J = 'head';
  const put = (poly: Pt[], col: string | Swatch, dz: number, rough = 0.008) => cut(fr, poly, col, z + dz, J, 0.03, rough);
  const K = r.kit, acc = (a: string) => !!K && K.acc.indexOf(a) >= 0;
  const HC = r.hairCol, bx = -hd.rx;   // the back of the head is to the left of the face
  const HB = r.hairMix === 'under' && r.hairCol2 ? r.hairCol2 : HC;   // the hair at the back and hanging down, in a second colour when it goes underneath
  if (r.hair === 'bob' && !r.mask) put(headPoly(hd, 1.12, -0.3, Math.PI + 0.3, 20, 0.01).concat([[-hd.rx * 1.18, hd.cy - hd.ryb * 0.85], [hd.rx * 0.95, hd.cy - hd.ryb * 0.7]]), HB, -0.03, 0.02);
  if ((r.hair === 'long' || r.hair === 'wild') && !r.mask) put(headPoly(hd, r.hair === 'wild' ? 1.22 : 1.12, -0.35, Math.PI + 0.35, 20, 0.02).concat([[-hd.rx * (r.hair === 'wild' ? 1.55 : 1.3), hd.cy - hd.ryb * (r.hair === 'wild' ? 1.4 : 1.6)], [hd.rx * 1.2, hd.cy - hd.ryb * 1.5]]), HB, -0.03, r.hair === 'wild' ? 0.07 : 0.03);
  if (!r.mask) {
    if (r.hair === 'ponytail') { put(strip([bx * 0.85, hd.cy + hd.ryt * 0.55], [bx * 1.45, hd.cy - hd.ryb * 1.3], 0.2, 0.08, 0.12), HB, -0.03, 0.02); put(ell(bx * 0.92, hd.cy + hd.ryt * 0.45, 0.06, 0.06, 8), shade(HB, 0.5), -0.02, 0.003); }
    if (r.hair === 'pigtails') for (const [dy, len] of [[0.35, 0.9], [-0.05, 1.25]] as [number, number][]) { put(strip([bx * 0.85, hd.cy + hd.ryt * dy], [bx * 1.55, hd.cy - hd.ryb * len], 0.17, 0.07, 0.1), HB, -0.03, 0.02); put(ell(bx * 0.95, hd.cy + hd.ryt * dy - 0.04, 0.055, 0.055, 8), shade(HB, 0.5), -0.02, 0.003); }
    if (r.hair === 'mullet') put([[bx * 0.5, hd.cy + hd.ryt * 0.5], [bx * 1.12, hd.cy + hd.ryt * 0.1], [bx * 1.3, hd.cy - hd.ryb * 1.2], [bx * 1.05, hd.cy - hd.ryb * 1.55], [bx * 0.85, hd.cy - hd.ryb * 1.3], [bx * 0.45, hd.cy - hd.ryb * 0.6]], HB, -0.03, 0.05);
    if (r.hair === 'afro') put(ell(-0.06, hd.cy + hd.ryt * 0.25, hd.rx * 1.55, hd.ryt * 1.45, 26), HB, -0.03, 0.05);
    if (r.hair === 'dreads') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.55 + 0.45 * i / 6), x0 = hd.rx * 1.02 * Math.cos(a), y0 = hd.cy + hd.ryt * 1.02 * Math.sin(a); put(strip([x0, y0], [x0 - 0.12 - i * 0.03, hd.cy - hd.ryb * (1.1 + (i % 3) * 0.25)], 0.09, 0.07, 0.05), shade(HB, i % 2 ? 0.85 : 1), -0.03 - i * 0.001, 0.015); }
    if (r.hair === 'braids') for (const dy of [0.1, -0.12]) put(strip([bx * 0.95, hd.cy + dy], [bx * 1.2, hd.cy - hd.ryb * 1.2 + dy], 0.07, 0.05, 0.05), HB, -0.03, 0.01);
    if (r.hair === 'braid') { put(ell(bx * 0.9, hd.cy + hd.ryt * 0.2, 0.14, 0.16, 10), HB, -0.03, 0.01); for (let i = 0; i < 12; i++) { const t = i / 11; put(ell(bx * (1.0 + 0.25 * t) + (i % 2 ? 0.035 : -0.035), hd.cy - t * 3.0, 0.14 - 0.05 * t, 0.16, 10), shade(HB, i % 2 ? 0.8 : 1), -0.17 - i * 0.0005, 0.01); } put(ell(bx * 1.25, hd.cy - 3.1, 0.05, 0.05, 8), shade(HB, 0.5), -0.165, 0.003); }   // one long braid down the back, tied off at the end
  }
  if ((r.hair === 'long' || r.hair === 'wild' || r.hair === 'bob') && !r.mask) {
    const end = r.hair === 'bob' ? 0.8 : r.hair === 'wild' ? 1.35 : 1.5;
    // locks that fall past the cheeks and frame the face, each its own sheet, a shade lighter or darker
    for (const [sd, t, w0] of [[-1, 1.1, 0.17], [1, 0.88, 0.15]] as [number, number, number][]) {
      put(strip([sd * hd.rx * 0.78, hd.cy + hd.ryt * 0.62], [sd * hd.rx * 1.02, hd.cy - hd.ryb * (end - 0.1)], w0, 0.05, sd * 0.07), t > 1 ? hiLock(HB) : shade(HB, t), 0.196, 0.01);
    }
  }
  const FS = r.fs || {}, eS = FS.eyeS || 1, eG = FS.eyeG || 1, earS = FS.earS || 1, mW = FS.mouthW || 1;
  const FT = r.feat || {}, ex = -hd.rx * 0.74 + tq * 0.4, eyy = hd.cy - 0.04;
  // the ear, on the side of the head toward the back, over the skin and under the hair
  const ear = (dz: number) => {
    const es = earS * (FT.ears === 'small' ? 0.72 : FT.ears === 'big' ? 1.35 : 1), ew = (FT.ears === 'flat' ? 0.055 : 0.085) * es, eh = 0.13 * es;
    if (FT.ears === 'pointed') put([[ex + 0.05 * es, eyy - 0.12 * es], [ex - 0.07 * es, eyy - 0.08 * es], [ex - 0.1 * es, eyy + 0.22 * es], [ex + 0.06 * es, eyy + 0.1 * es]], shade(sk, 0.92), dz);
    else if (FT.ears === 'cauliflower') { put(ell(ex - 0.01, eyy, 0.115 * es, 0.135 * es, 12), shade(sk, 0.92), dz, 0.035); for (const [ax, ay] of [[-0.03, 0.05], [0.01, -0.05], [-0.05, -0.01]] as [number, number][]) put(ell(ex + ax * es, eyy + ay * es, 0.035 * es, 0.03 * es, 8), dk, dz + 0.004, 0.01); }
    else put(ell(ex, eyy, ew, eh, 12), shade(sk, 0.92), dz);
    if (FT.ears !== 'cauliflower') put(ell(ex + 0.01, eyy - 0.01, ew * 0.4, eh * 0.5, 10), shade(sk, 0.82), dz + 0.003, 0.004);   // the hollow of the ear, a sheet a little darker
  };
  put(headPoly(hd), sk, 0.02);
  if (!r.mask || r.mask.kind === 'half') ear(0.035);
  const mkind = r.mask ? r.mask.kind || 'open' : '', fullMask = !!r.mask && mkind !== 'half';
  if (r.mask) {
    if (mkind === 'half') put(headPoly(hd, 1.04, -0.12, Math.PI + 0.12, 22).concat([[-hd.rx * 1.02, hd.cy - 0.12], [hd.rx * 1.02, hd.cy - 0.12]] as Pt[]), r.mask.base, 0.04);   // over the head and eyes, the mouth and jaw bare
    else put(headPoly(hd, 1.04), r.mask.base, 0.04);
    if (mkind === 'open') put(headPoly(hd, 0.97, Math.PI + 0.4, 2 * Math.PI - 0.4, 18, -0.01).map(([x, y]) => [x + tq * 0.5, y] as Pt), sk, 0.06);
    const md = r.maskDesign || (mkind === 'hood' ? 'plain' : 'flames'), T = r.mask.trim, eyY = hd.cy + 0.1 + (FS.eyeY || 0);
    if (mkind === 'hood') {   // a cloth hood: a point at the crown, the eye holes cut dark
      put([[-hd.rx * 0.55, hd.cy + hd.ryt * 0.8], [hd.rx * 0.5, hd.cy + hd.ryt * 0.82], [bx * 0.15, hd.cy + hd.ryt * 1.5]], r.mask.base, 0.041, 0.012);
      for (const sd of [-1, 1]) put(ell(sd * 0.16 * eG + tq, eyY, 0.13, 0.1, 14), shade(r.mask.base, 0.35), 0.075, 0.006);
    }
    if (md === 'split') put(headPoly(hd, 1.045, Math.PI * 0.5, Math.PI * 1.5, 18), T, 0.05);   // the back half in the second colour
    if (md === 'flames') {
      for (const sd of [-1, 1]) {
        let fl: Pt[] = [[sd * 0.03, 0.34], [sd * 0.34, 0.36], [sd * 0.42, 0.52], [sd * 0.3, 0.45], [sd * 0.36, 0.62], [sd * 0.2, 0.46], [sd * 0.1, 0.4]];
        fl = fl.map(([x, y]) => [x + tq, y + hd.cy - 0.27] as Pt); put(sd > 0 ? fl : fl.reverse(), T, 0.08);
      }
      put(strip([tq * 0.6, hd.cy + hd.ryt * 0.98], [tq, hd.cy], 0.07, 0.03), T, 0.08);
    } else if (mkind !== 'hood') for (const sd of [-1, 1]) put(ell(sd * 0.16 * eG + tq, eyY, 0.145, 0.12, 14), T, 0.075, 0.006);   // rims round the eyes
    if (md === 'star') put(star(tq * 0.4, hd.cy + hd.ryt * 0.62, 0.17, 5, 0.45), T, 0.08, 0.004);
    if (md === 'stripes') for (const o of [-0.17, 0, 0.17]) put(strip([tq + o + 0.05, hd.cy + 0.26], [tq * 0.4 + o - 0.22, hd.cy + hd.ryt * 1.0], 0.05, 0.04, 0.03), T, 0.08, 0.004);
    if (md === 'teeth' && mkind !== 'open' && mkind !== 'half') {   // a grin of teeth cut over the mouth
      put(ell(tq + 0.04, hd.cy - 0.24, 0.2, 0.08, 16), PAL.black, 0.078, 0.004);
      for (let k = 0; k < 6; k++) { const x = tq - 0.12 + k * 0.065; put([[x, hd.cy - 0.2], [x + 0.05, hd.cy - 0.2], [x + 0.025, hd.cy - 0.26]], PAL.white, 0.079, 0.002); put([[x, hd.cy - 0.29], [x + 0.05, hd.cy - 0.29], [x + 0.025, hd.cy - 0.23]], PAL.white, 0.079, 0.002); }
    }
  } else {
    // no shadow down the side of the face (Ryan, 20 October)
    if (r.beard === 1 || r.beard === 9) put(headPoly(hd, 1.0, Math.PI + 0.25, 2 * Math.PI - 0.25, 18), shade(sk, 0.82), 0.05);
  }
  const ey = hd.cy + 0.1 + (FS.eyeY || 0), shut = ['hurt', 'pain', 'cry', 'shut'].includes(expr), mad = ['shout', 'roar', 'snarl', 'pain', 'hurt'].includes(expr);
  // blood under the eyes and brows: a cut on the brow, a trickle down the face, or the face covered
  const bl = mk.blood || 0;
  if (bl >= 3) put(headPoly(hd, 0.97, 0.15, Math.PI - 0.15, 16).concat([[-hd.rx * 0.8, hd.cy - 0.12], [-0.1, hd.cy - 0.24], [tq, hd.cy - 0.1], [0.12, hd.cy - 0.3], [hd.rx * 0.8, hd.cy - 0.14]]).reverse(), BLOOD, 0.09, 0.02);
  if (bl >= 1) put(strip([tq - 0.14, hd.cy + 0.36], [tq + 0.1, hd.cy + 0.4], 0.035, 0.025, 0.02), BLOOD2, 0.095, 0.004);
  if (bl >= 2) for (const [x0, len] of [[tq - 0.06, 0.62], [tq + 0.24, 0.5]] as [number, number][]) put(strip([x0, hd.cy + 0.36], [x0 + 0.02, hd.cy + 0.36 - len], 0.04, 0.02), BLOOD, 0.095, 0.006);
  if (mk.bruise) put(ell(tq + 0.17, ey - 0.07, 0.09, 0.06, 10), '#5b3a6e', 0.095, 0.006);
  const pt = r.paint && !fullMask ? r.paint : (acc('face_paint') && !r.mask ? { k: 'stripes', c: K!.pal.s.c } : null);
  // face paint, under the eyes, brows and mouth: the first design, then each layer painted over it
  const paintOne = (pk: string, C: string, z0: number) => {
    if (pk === 'stripes') for (const sd of [-1, 1]) put(strip([sd * 0.16 + tq - 0.1, ey - 0.08], [sd * 0.16 + tq + 0.08, ey - 0.3], 0.07, 0.03), C, z0, 0.004);
    else if (pk === 'half') put(headPoly(hd, 0.985, -0.08, Math.PI + 0.08, 22).concat([[-hd.rx * 0.99, ey - 0.13], [tq, ey - 0.2], [hd.rx * 0.99, ey - 0.13]] as Pt[]), C, z0, 0.006);
    else if (pk === 'full' || pk === 'skull') {
      put(headPoly(hd, 0.985), pk === 'skull' ? PAL.white : C, z0, 0.006);
      if (pk === 'skull') {
        for (const sd of [-1, 1]) { put(ell(sd * 0.16 + tq, ey, 0.12, 0.1, 14), PAL.black, 0.125, 0.006); put(ell(sd * 0.16 + tq + 0.02, ey, 0.025, 0.025, 8), PAL.white, 0.126, 0.002); }
        put([[tq - 0.06, ey - 0.14], [tq + 0.06, ey - 0.14], [tq, ey - 0.26]], PAL.black, 0.135, 0.004);
      }
    } else if (pk === 'war') {
      put(strip([-hd.rx * 0.8, hd.cy + hd.ryt * 0.45], [hd.rx * 0.85, hd.cy + hd.ryt * 0.5], 0.06, 0.06), C, z0, 0.004);
      for (const sd of [-1, 1]) for (const k2 of [0, 0.07]) put(strip([sd * 0.16 + tq - 0.06 + k2, ey - 0.08], [sd * 0.16 + tq - 0.1 + k2, ey - 0.36], 0.035, 0.025), C, z0, 0.003);
    } else if (pk === 'eyes') for (const sd of [-1, 1]) put(ell(sd * 0.16 * eG + tq, ey + 0.01, 0.15, 0.12, 16), C, z0, 0.006);   // a patch round each eye
    else if (pk === 'tear') put([[tq + 0.15, ey - 0.12], [tq + 0.19, ey - 0.25], [tq + 0.15, ey - 0.31], [tq + 0.11, ey - 0.25]], C, z0, 0.003);   // one tear under the eye
    else if (pk === 'grin') { const my = ey - r.noseL * 0.4 - 0.14; put(strip([tq - 0.34, my + 0.1], [tq, my - 0.06], 0.035, 0.03), C, z0, 0.003); put(strip([tq, my - 0.06], [tq + 0.34, my + 0.1], 0.03, 0.035), C, z0, 0.003); }   // a grin cut to the ears
    else if (pk === 'cross') { put(strip([tq, hd.cy + hd.ryt * 0.7], [tq, hd.cy - hd.ryb * 0.75], 0.07, 0.07), C, z0, 0.004); put(strip([-hd.rx * 0.8, ey + 0.02], [hd.rx * 0.8, ey + 0.02], 0.06, 0.06), C, z0 + 0.0002, 0.004); }
  };
  if (pt) paintOne(pt.k, pt.c, 0.096);
  if (r.paint2 && !fullMask && !r.mask) r.paint2.forEach((l, i) => paintOne(l.k, l.c, 0.0962 + i * 0.0006));
  if (r.freckles && !fullMask) for (const sd of [-1, 1]) for (const [dx, dy] of [[-0.05, -0.08], [0.02, -0.11], [0.07, -0.07], [-0.01, -0.15], [0.05, -0.17], [0.1, -0.13]] as [number, number][]) put(ell(sd * 0.16 * eG + tq + dx, ey + dy, 0.018, 0.018, 6), shade(sk, 0.58), 0.097, 0.001);
  // scars: a pale line with a darker edge, on whatever skin shows
  const scar = (a: Pt, b: Pt, dz: number) => { put(strip(a, b, 0.045, 0.036, 0.01), shade(sk, 0.62), dz, 0.004); put(strip(a, b, 0.024, 0.018, 0.01), shade(sk, 1.45), dz + 0.001, 0.003); };
  const SC = r.scars || [];
  if (!fullMask && SC.indexOf('cheek') >= 0) scar([tq + 0.32, ey - 0.07], [tq + 0.13, ey - 0.3], 0.099);
  if (!fullMask && SC.indexOf('lip') >= 0) scar([tq + 0.13, hd.cy - 0.12], [tq + 0.09, hd.cy - 0.32], 0.185);
  for (const sd of [-1, 1]) {
    const cx = sd * 0.16 * eG + tq;
    if (shut) put(strip([cx - 0.08, ey + 0.01], [cx + 0.08, ey - 0.02], 0.035, 0.03, expr === 'pain' ? -0.04 : expr === 'shut' ? 0.02 : -0.03), PAL.black, 0.1);
    else {
      const ek = FT.eyes || 'almond', W0 = (ek === 'narrow' ? 0.21 : 0.2) * eS, H0 = (ek === 'narrow' ? 0.045 : ek === 'round' ? 0.1 : 0.094) * eS;
      if (ek === 'deep') put(ell(cx, ey - 0.005, 0.12 * eS, 0.07 * eS, 12), dk, 0.098, 0.004);   // the shadow of a deep socket
      put(ek === 'round' ? ell(cx, ey, 0.1 * eS, 0.09 * eS, 12) : almond(cx, ey, W0, H0), PAL.white, 0.1, 0.003);
      // the iris, the pupil and a light in it, looking the way the face turns
      const ir = (ek === 'narrow' ? 0.038 : 0.052) * eS, ix = cx + 0.022 * eS, iy = ey + (ek === 'narrow' ? 0.004 : 0.012) * eS;
      put(ell(ix, iy, ir, ek === 'narrow' ? ir * 0.8 : ir, 12), r.eyeCol || '#4a2c1c', 0.112, 0.002);
      put(ell(ix + 0.004, iy, ir * 0.5, ir * 0.5, 10), '#120c0e', 0.118, 0.001);
      put(ell(ix + ir * 0.4, iy + ir * 0.42, ir * 0.24, ir * 0.24, 6), PAL.white, 0.121, 0.001);
      // the upper lid: a dark strip along the top of the eye, heavier at the outer corner, where it flicks out
      const ox = cx + sd * W0 * 0.52, lw = r.fem ? 0.03 : 0.022;
      put(strip([cx - sd * W0 * 0.5, ey + 0.004], [ox, ey + 0.012], lw * 0.5 * eS, lw * eS, sd * H0 * 0.95), '#1d1418', 0.124, 0.002);
      if (r.fem || ek === 'lashes') { put(strip([ox - sd * 0.012, ey + 0.016], [ox + sd * 0.05 * eS, ey + 0.05 * eS], 0.022 * eS, 0.004), '#1d1418', 0.125, 0.002); if (ek === 'lashes') put(strip([ox - sd * 0.03, ey + 0.03], [ox + sd * 0.02 * eS, ey + 0.07 * eS], 0.018 * eS, 0.004), '#1d1418', 0.125, 0.002); }
      if (ek === 'hooded') put(strip([cx - 0.1 * eS, ey + 0.012], [cx + 0.1 * eS, ey + 0.022], 0.07 * eS, 0.06 * eS, 0.01), shade(sk, 0.86), 0.126, 0.003);   // a heavy lid
    }
    if (mk.tears || expr === 'cry') put(strip([cx + 0.02, ey - 0.04], [cx + 0.03, ey - 0.3], 0.035, 0.05), WET, 0.135, 0.004);
    if (!r.mask && r.brow > 0 && !(r.paint && r.paint.k === 'skull')) { const a = mad ? -0.07 : expr === 'cry' ? 0.06 : expr === 'smirk' && sd > 0 ? 0.06 : r.browAng; put(strip([cx - 0.1 * sd, ey + 0.1 + a * sd], [cx + 0.12 * sd, ey + 0.095 - a * sd], r.brow * 0.62, r.brow * 0.16, 0.024 * sd), r.browCol, 0.14); }
  }
  if (acc('face_paint') && !r.mask) for (const sd of [-1, 1]) put(strip([sd * 0.16 + tq - 0.1, ey - 0.08], [sd * 0.16 + tq + 0.08, ey - 0.3], 0.07, 0.03), K!.pal.s, 0.105, 0.004);
  if (acc('sunglasses_aviator')) {
    for (const sd of [-1, 1]) { put(almond(sd * 0.16 + tq, ey - 0.01, 0.24, 0.13), K!.pal.h, 0.145, 0.003); put(almond(sd * 0.16 + tq, ey - 0.005, 0.2, 0.1), { c: '#141820', f: 'foil' }, 0.15, 0.003); }
    put(strip([tq - 0.05, ey + 0.03], [tq + 0.05, ey + 0.03], 0.025, 0.025, 0.02), K!.pal.h, 0.152, 0.002); put(strip([tq + 0.27, ey + 0.02], [hd.rx * 0.98, ey + 0.05], 0.025, 0.025), K!.pal.h, 0.152, 0.002);
  }
  if (acc('sunglasses_round')) {   // small round shades
    for (const sd of [-1, 1]) { put(ell(sd * 0.16 + tq, ey - 0.01, 0.13, 0.12, 14), K!.pal.h, 0.145, 0.003); put(ell(sd * 0.16 + tq, ey - 0.01, 0.105, 0.095, 14), { c: '#141820', f: 'foil' }, 0.15, 0.003); }
    put(strip([tq - 0.05, ey + 0.02], [tq + 0.05, ey + 0.02], 0.02, 0.02, 0.02), K!.pal.h, 0.152, 0.002); put(strip([tq + 0.28, ey + 0.01], [hd.rx * 0.98, ey + 0.04], 0.02, 0.02), K!.pal.h, 0.152, 0.002);
  }
  if (acc('glasses_plain')) {   // everyday glasses: dark frames, the eyes showing through
    for (const sd of [-1, 1]) { const cx = sd * 0.16 + tq; for (const [a0, a1] of [[[-0.12, 0.08], [0.12, 0.08]], [[-0.12, -0.09], [0.12, -0.09]], [[-0.12, 0.08], [-0.12, -0.09]], [[0.12, 0.08], [0.12, -0.09]]] as [Pt, Pt][]) put(strip([cx + a0[0], ey + a0[1]], [cx + a1[0], ey + a1[1]], 0.022, 0.022), '#1c1b20', 0.151, 0.002); }
    put(strip([tq - 0.04, ey + 0.04], [tq + 0.04, ey + 0.04], 0.02, 0.02), '#1c1b20', 0.152, 0.002); put(strip([tq + 0.28, ey + 0.05], [hd.rx * 0.98, ey + 0.06], 0.02, 0.02), '#1c1b20', 0.152, 0.002);
  }
  const nw = r.noseW * 0.25, nl = r.noseL * 0.4;
  const nk = FT.nose || 'straight';
  { const dk = shade(sk, 0.84);   // the side of the nose in shadow: one sheet a shade darker than the face
  if (nk === 'button') { put(ell(tq + 0.02, ey - nl * 0.8, nw * 0.95, nw * 0.75, 12), dk, 0.13); put(ell(tq + 0.04, ey - nl * 0.86, 0.02, 0.015, 6), shade(sk, 0.5), 0.131, 0.002); }
  else if (nk === 'broad') put([[tq - 0.03, ey - 0.02], [tq + 0.03, ey - 0.02], [tq + nw * 1.5, ey - nl], [tq + 0.02, ey - nl - 0.06], [tq - nw * 1.3, ey - nl]], dk, 0.13);
  else if (nk === 'hooked') put([[tq - 0.02, ey - 0.02], [tq + 0.07, ey - nl * 0.4], [tq + nw * 1.25, ey - nl * 0.88], [tq + 0.03, ey - nl - 0.05], [tq - nw * 0.6, ey - nl]], dk, 0.13);
  else if (nk === 'flat') put([[tq - 0.04, ey - 0.06], [tq + 0.05, ey - 0.04], [tq + nw * 1.45 + 0.02, ey - nl * 0.8], [tq + 0.03, ey - nl * 0.8 - 0.05], [tq - nw * 1.2, ey - nl * 0.78]], dk, 0.13);   // broken and flattened
  else if (nk === 'pointed') put([[tq - 0.02, ey - 0.02], [tq + 0.02, ey - 0.02], [tq + nw * 0.8 + 0.06, ey - nl * 1.12], [tq - nw * 0.4, ey - nl * 1.05]], dk, 0.13);
  else put([[tq - 0.012, ey + 0.07], [tq + 0.018, ey + 0.05], [tq + nw * 0.95, ey - nl * 0.9], [tq + nw * 0.35, ey - nl - 0.035], [tq - nw * 0.8, ey - nl], [tq - nw * 0.25, ey - nl * 0.55]], dk, 0.13);   // a long bridge from between the brows
  if (nk !== 'button' && nk !== 'straight') put([[tq - 0.012, ey + 0.07], [tq + 0.016, ey + 0.05], [tq + nw * 0.5, ey - nl * 0.5], [tq - nw * 0.2, ey - nl * 0.45]], dk, 0.1295, 0.003);   // the bridge, from between the brows
  if (nk !== 'button') put(ell(tq - nw * 0.15, ey - nl - 0.005, nw * 0.4, 0.016, 8), shade(sk, 0.6), 0.131, 0.002); }   // the nostril
  if (!r.mask && SC.indexOf('brow') >= 0) scar([tq + 0.24, ey + 0.24], [tq + 0.12, ey + 0.0], 0.145);
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
  const mw = mW * (expr === 'roar' ? 0.22 : expr === 'pain' || expr === 'snarl' ? 0.24 : expr === 'cry' ? 0.13 : expr === 'talk' ? 0.15 : 0.17), mh = expr === 'roar' ? 0.17 : expr === 'pain' || expr === 'snarl' ? 0.08 : expr === 'cry' ? 0.07 : expr === 'talk' ? 0.065 : 0.11;
  if (expr === 'smirk') put(strip([tq - 0.1, my - 0.01], [tq + 0.11, my + 0.04], 0.035, 0.03, 0.02), deep, 0.17, 0.004);
  else if (open) put(almond(tq, my, mw, mh), PAL.black, 0.17, 0.004);
  else {   // a closed mouth, in its own shape
    const mk2 = FT.mouth || 'plain', lip = r.beard >= 4 && r.beard <= 5 ? shade(sk, 0.55) : mixc(deep, '#a8384c', r.fem ? 0.55 : 0.2);
    const lipLo = mixc(sk, '#d4687a', r.fem ? 0.5 : 0.14), lipW = (mk2 === 'wide' ? 0.17 : mk2 === 'thin' ? 0.11 : 0.135) * mW, lipH = mk2 === 'full' ? 1.45 : mk2 === 'thin' ? 0.65 : r.fem ? 1.3 : 0.9;
    const lips = () => {
      put([[tq - lipW, my], [tq - lipW * 0.45, my + 0.034 * lipH], [tq, my + 0.02 * lipH], [tq + lipW * 0.45, my + 0.034 * lipH], [tq + lipW, my], [tq + lipW * 0.4, my - 0.006], [tq - lipW * 0.4, my - 0.006]], lip, 0.17, 0.003);
      put(ell(tq, my - 0.004, lipW * 0.82, 0.042 * lipH, 14, Math.PI, 2 * Math.PI), lipLo, 0.169, 0.003);
    };
    if (mk2 === 'thin' || mk2 === 'full') lips();
    else if (mk2 === 'frown') put(strip([tq - 0.1 * mW, my - 0.03], [tq + 0.1 * mW, my - 0.03], 0.03, 0.03, 0.035), lip, 0.17, 0.003);
    else if (mk2 === 'smile') put(strip([tq - 0.1 * mW, my + 0.02], [tq + 0.1 * mW, my + 0.02], 0.03, 0.03, -0.04), lip, 0.17, 0.003);
    else lips();
  }
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
    } else if (r.hair === 'undercut') {   // the sides shaved short, a tall top swept forward
      const sides = headPoly(hd, 1.02, -0.1, Math.PI + 0.1, 20), fr: Pt[] = []; for (let i = 0; i <= 8; i++) fr.push([hd.rx * 0.98 - 2 * hd.rx * 0.98 * i / 8, hd.cy + hd.ryt * 0.62]);
      put(sides.concat(fr.reverse()), shade(r.hairCol, 0.78), 0.19, 0.006);
      put(headPoly(hd, 1.2, 0.12, Math.PI - 0.5, 16).concat([[bx * 0.55, hd.cy + hd.ryt * 0.74], [hd.rx * 0.95, hd.cy + hd.ryt * 0.58]] as Pt[]), r.hairCol, 0.195, 0.012);
    } else if (r.hair === 'braids') {
      put(headPoly(hd, 1.02, -0.1, Math.PI + 0.1, 20).concat([[bx * 0.98, hd.cy + hd.ryt * 0.62], [hd.rx * 0.98, hd.cy + hd.ryt * 0.62]] as Pt[]), r.hairCol, 0.19, 0.006);
      for (let i = 0; i < 4; i++) { const x = hd.rx * (0.7 - i * 0.45); put(strip([x, hd.cy + hd.ryt * 0.62], [x - 0.12, hd.cy + hd.ryt * 1.0], 0.03, 0.03, 0.04), shade(r.hairCol, 0.55), 0.195, 0.003); }   // the rows
    } else {
      const k = r.hair === 'buzz' ? 1.02 : r.hair === 'flat' ? 1.06 : 1.07, top = headPoly(hd, k, -0.1, Math.PI + 0.1, 20, r.hair === 'flat' ? 0.06 : 0);
      const fr: Pt[] = []; for (let i = 0; i <= 8; i++) fr.push([hd.rx * 0.98 - 2 * hd.rx * 0.98 * i / 8, hd.cy + hd.ryt * ((r.hair === 'buzz' ? 0.62 : 0.5) + 0.15 * Math.sin(Math.PI * i / 8))]);
      put(top.concat(fr.reverse()), r.hairCol, 0.19, r.hair === 'curls' ? 0.03 : 0.012);
      if (r.hair === 'curls') for (let i = 0; i < 7; i++) { const a = Math.PI * (0.1 + 0.8 * i / 6); put(ell(hd.rx * 1.02 * Math.cos(a), hd.cy + hd.ryt * 1.02 * Math.sin(a), 0.11, 0.11, 10), r.hairCol, 0.2, 0.02); }
      if (r.hair === 'tower') { put([[-hd.rx * 0.8, hd.cy + hd.ryt * 0.7], [hd.rx * 0.8, hd.cy + hd.ryt * 0.7], [hd.rx * 0.7, hd.cy + hd.ryt * 3.2], [hd.rx * 0.3, hd.cy + hd.ryt * 3.5], [-hd.rx * 0.3, hd.cy + hd.ryt * 3.5], [-hd.rx * 0.7, hd.cy + hd.ryt * 3.2]], r.hairCol, 0.185, 0.03); for (let q = 1; q < 5; q++) put(strip([-hd.rx * 0.6, hd.cy + hd.ryt * (0.7 + q * 0.6)], [hd.rx * 0.6, hd.cy + hd.ryt * (0.75 + q * 0.6)], 0.03, 0.02), shade(r.hairCol, 0.75), 0.186, 0.005); }   // hair piled up like a tower
      if (r.hair === 'bun') { put(ell(bx * 0.45, hd.cy + hd.ryt * 1.13, 0.17, 0.14, 14), r.hairCol, 0.2, 0.015); put(strip([bx * 0.62, hd.cy + hd.ryt * 1.05], [bx * 0.3, hd.cy + hd.ryt * 1.08], 0.03, 0.03), shade(r.hairCol, 0.5), 0.205, 0.003); }
    }
    const C2 = r.hairCol2;
    if (C2 && r.hairMix === 'tips') for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.06 + 0.88 * i / 8), k = r.hair === 'spiky' ? 1.3 : r.hair === 'afro' ? 1.12 : 1.06; put(ell(hd.rx * k * Math.cos(a), hd.cy + hd.ryt * k * Math.sin(a), 0.075, 0.055, 8), C2, 0.205, 0.012); }
    if (C2 && r.hairMix === 'streak') put(strip([hd.rx * 0.6, hd.cy + hd.ryt * 0.92], [bx * 0.75, hd.cy + hd.ryt * 0.82], 0.08, 0.05, 0.14), C2, 0.205, 0.006);
    if (['long', 'wild', 'bob'].includes(r.hair)) put(strip([hd.rx * 0.5, hd.cy + hd.ryt * 1.02], [bx * 0.75, hd.cy + hd.ryt * 0.62], 0.05, 0.13, 0.09), hiLock(r.hairCol), 0.197, 0.008);   // a lighter lock swept across the top
    if (C2 && r.hairMix === 'fringe') put(headPoly(hd, 1.08, 0.08, 0.95, 8).concat([[hd.rx * 0.45, hd.cy + hd.ryt * 0.55], [hd.rx * 0.98, hd.cy + hd.ryt * 0.45]] as Pt[]), C2, 0.205, 0.01);
  }
  if (SC.indexOf('head') >= 0 && !r.mask && ['bald', 'buzz', 'crew', 'undercut'].indexOf(r.hair) >= 0) scar([hd.rx * 0.35, hd.cy + hd.ryt * 0.98], [bx * 0.45, hd.cy + hd.ryt * 0.7], 0.21);
  if (acc('bandana')) { put(strip([-hd.rx * 1.02, hd.cy + 0.38], [hd.rx * 1.02, hd.cy + 0.42], 0.15, 0.15, 0.04), K!.pal.s, 0.215, 0.006); put([[-hd.rx * 0.95, hd.cy + 0.4], [-hd.rx * 1.4, hd.cy + 0.18], [-hd.rx * 1.3, hd.cy + 0.1], [-hd.rx * 0.9, hd.cy + 0.3]], K!.pal.s, 0.214, 0.01); }
  if (acc('hat_cap')) {   // a baseball cap, the peak to the front
    put(headPoly(hd, 1.08, 0.05, Math.PI - 0.05, 18).concat([[bx * 1.04, hd.cy + hd.ryt * 0.5], [hd.rx * 1.04, hd.cy + hd.ryt * 0.5]] as Pt[]), K!.pal.s, 0.3, 0.006);
    put(strip([hd.rx * 0.7, hd.cy + hd.ryt * 0.52], [hd.rx * 1.75, hd.cy + hd.ryt * 0.42], 0.11, 0.07, -0.03), shade(K!.pal.s.c, 0.8), 0.31, 0.004);
    put(ell(0, hd.cy + hd.ryt * 1.08, 0.05, 0.035, 8), K!.pal.t, 0.305, 0.002);
  }
  if (acc('hat_beanie')) {   // a wool hat with its band turned up
    put(headPoly(hd, 1.1, -0.02, Math.PI + 0.02, 18, 0.04).concat([[bx * 1.06, hd.cy + hd.ryt * 0.45], [hd.rx * 1.06, hd.cy + hd.ryt * 0.45]] as Pt[]), K!.pal.s, 0.3, 0.012);
    put(strip([bx * 1.08, hd.cy + hd.ryt * 0.52], [hd.rx * 1.08, hd.cy + hd.ryt * 0.52], 0.16, 0.16), K!.pal.t, 0.31, 0.01);
  }
  if (acc('crown')) {   // a crown: a band with five points, a stone in the middle
    const cr: Pt[] = [[-hd.rx * 0.78, hd.cy + hd.ryt * 0.82]]; for (let i = 0; i <= 8; i++) cr.push([-hd.rx * 0.78 + 1.56 * hd.rx * i / 8, hd.cy + hd.ryt * (i % 2 ? 1.12 : 1.42)]); cr.push([hd.rx * 0.78, hd.cy + hd.ryt * 0.82]);
    put(cr, { c: PAL.gold, f: 'foil' }, 0.32, 0.006); put(ell(0, hd.cy + hd.ryt * 0.98, 0.06, 0.06, 10), PAL.red, 0.325, 0.002);
  }
  if (acc('hat_campaign')) {   // a drill sergeant's hat: a wide flat brim and a crown pinched into four dents
    put(strip([-hd.rx * 1.8, hd.cy + hd.ryt * 0.66], [hd.rx * 1.8, hd.cy + hd.ryt * 0.66], 0.08, 0.08), K!.pal.s, 0.3, 0.004);
    put([[-hd.rx * 0.9, hd.cy + hd.ryt * 0.66], [hd.rx * 0.9, hd.cy + hd.ryt * 0.66], [hd.rx * 0.55, hd.cy + hd.ryt * 1.4], [0, hd.cy + hd.ryt * 1.62], [-hd.rx * 0.55, hd.cy + hd.ryt * 1.4]], K!.pal.s, 0.31, 0.006);
    put([[-hd.rx * 0.88, hd.cy + hd.ryt * 0.7], [hd.rx * 0.88, hd.cy + hd.ryt * 0.7], [hd.rx * 0.86, hd.cy + hd.ryt * 0.82], [-hd.rx * 0.86, hd.cy + hd.ryt * 0.82]], shade(K!.pal.s.c, 0.6), 0.315, 0.004);
    for (const d of [-0.3, 0.3]) put(strip([d * hd.rx, hd.cy + hd.ryt * 1.45], [d * hd.rx * 1.3, hd.cy + hd.ryt * 0.95], 0.03, 0.02), shade(K!.pal.s.c, 0.75), 0.316, 0.003);
  }
  if (acc('hat_cowboy')) {
    put(strip([-hd.rx * 1.75, hd.cy + hd.ryt * 0.62], [hd.rx * 1.75, hd.cy + hd.ryt * 0.62], 0.1, 0.1, 0.12), K!.pal.s, 0.3, 0.006);   // the brim
    put([[-hd.rx * 0.95, hd.cy + hd.ryt * 0.6], [hd.rx * 0.95, hd.cy + hd.ryt * 0.6], [hd.rx * 0.8, hd.cy + hd.ryt * 1.45], [0.1, hd.cy + hd.ryt * 1.3], [-0.1, hd.cy + hd.ryt * 1.3], [-hd.rx * 0.8, hd.cy + hd.ryt * 1.45]], K!.pal.s, 0.31, 0.008);   // the crown
    put([[-hd.rx * 0.92, hd.cy + hd.ryt * 0.66], [hd.rx * 0.92, hd.cy + hd.ryt * 0.66], [hd.rx * 0.9, hd.cy + hd.ryt * 0.82], [-hd.rx * 0.9, hd.cy + hd.ryt * 0.82]], K!.pal.t, 0.315, 0.004);   // the band
  }
  if (acc('headband')) put(strip([-hd.rx * 1.06, hd.cy + hd.ryt * 0.62], [hd.rx * 1.06, hd.cy + hd.ryt * 0.66], 0.15, 0.15, 0.03), K!.pal.t, 0.3, 0.006);   // a sweatband across the brow
  if (acc('antennae')) for (const sd of [-1, 1]) { put(strip([sd * 0.14, hd.cy + hd.ryt * 0.92], [sd * 0.34, hd.cy + hd.ryt * 1.9], 0.025, 0.02, sd * 0.04), K!.pal.h, 0.33, 0.002); put(ell(sd * 0.35, hd.cy + hd.ryt * 1.95, 0.075, 0.075, 12), K!.pal.t, 0.335, 0.003); }   // a headband with two antennae
  if (r.headset || acc('headset')) {   // the band over the head, the cup on the near ear, the boom round to the mouth
    const band: Pt[] = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * (0.02 + 0.96 * i / 12); band.push([hd.rx * 1.1 * Math.cos(a), hd.cy + hd.ryt * 1.1 * Math.sin(a)]); }
    for (let i = 12; i >= 0; i--) { const a = Math.PI * (0.02 + 0.96 * i / 12); band.push([hd.rx * 1.02 * Math.cos(a), hd.cy + hd.ryt * 1.02 * Math.sin(a)]); }
    put(band, '#18181c', 0.24, 0.004);
    put(ell(hd.rx * 0.98, hd.cy - 0.02, 0.1, 0.14, 12), '#18181c', 0.25, 0.004); put(ell(hd.rx * 0.98, hd.cy - 0.02, 0.06, 0.09, 10), '#3a3a44', 0.26, 0.003);
    put(strip([hd.rx * 0.95, hd.cy - 0.1], [tq + 0.14, my - 0.02], 0.025, 0.02, -0.06), '#18181c', 0.27, 0.003);
    put(ell(tq + 0.13, my - 0.02, 0.045, 0.035, 8), '#2a2a30', 0.28, 0.002);
  }
}

/* ---------- a title belt, the way Create a Belt paints it ---------- */
/** The belt a scene's belt prop shows when nobody in it holds a title: set by the game to the company's top title. */
let sceneBelt: BeltData = { pl: 'round', mt: 'gold', st: '#1c1b1f', gm: 'red', sd: 2, ss: 'round', tr: 'none', w: 'CHAMPION', top: '' };
export function setSceneBelt(b: BeltData | null) { if (b) sceneBelt = b; }
/** With nobody's own belt to show, the player's top title (its Create a Belt design), else a plain gold belt. */
function topBelt(): BeltData {
  try { const S: any = G.S; const P = S && S.promos && S.promos[S.player]; const t = P && (P.titles || []).slice().sort((x: any, y: any) => y.lvl - x.lvl)[0]; if (t) return E.beltOf(t, P); } catch (e) { /* no game: the plain belt */ }
  return sceneBelt;
}
/** Every piece of a belt as paintBelt() in kit/belt.tsx draws it on its 96 by 42 drawing, turned into scene units: the
    strap two units across, y up. `put` cuts a piece; `say` places lettering (left out when the belt is small). */
export function beltPieces(b: BeltData, put: (pts: Pt[], col: string, dz: number, rough?: number) => void, say?: (s: string, u: number, v: number, size: number, col: string, dz: number) => void) {
  const K = 1 / 45, U = (px: number) => (px - 48) * K, V = (py: number) => -(py - 21) * K;
  const P = (pts: number[][]): Pt[] => pts.map(q => [U(q[0]), V(q[1])] as Pt);
  const C = (cx: number, cy: number, r: number, n = 16): Pt[] => ell(U(cx), V(cy), r * K, r * K, n);
  const EL = (cx: number, cy: number, rx: number, ry: number, n = 18): Pt[] => ell(U(cx), V(cy), rx * K, ry * K, n);
  const R = (x0: number, y0: number, w: number, h: number): Pt[] => P([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]]);
  const [rim, face, shine] = METAL[b.mt] || METAL.gold, strap = b.st || PAL.black, edge = shade(strap, 0.55);
  const top = (u: number) => 13 + Math.sin(u * Math.PI) * 1.2, bot = (u: number) => 29 + Math.sin(u * Math.PI) * 1.2;
  const band = (inset: number): Pt[] => { const q: number[][] = []; for (let i = 0; i <= 24; i++) { const u = i / 24; q.push([3 + u * 90, top(u) + inset]); } for (let i = 24; i >= 0; i--) { const u = i / 24; q.push([3 + u * 90, bot(u) - inset]); } return P(q); };
  put(band(0), edge, 0); put(band(0.9), strap, 0.01);
  for (let i = 0; i < 3; i++) put(C(7 + i * 3.2, 21, 0.75, 8), shade(strap, 0.3), 0.015, 0.002);   // the holes at the tip
  // the trim along both edges
  const lum = (() => { const n = parseInt(strap.slice(1), 16) || 0; return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); })();
  if (b.tr && b.tr !== 'none') for (let i = 1; i < 30; i++) { const u = i / 30, x0 = 3 + u * 90;
    if (b.tr === 'studs') { put(C(x0, top(u) + 2.2, 0.75, 8), face, 0.02, 0.002); put(C(x0, bot(u) - 2.2, 0.75, 8), face, 0.02, 0.002); }
    else { const col = b.tr === 'stitch' ? (lum > 150 ? '#6a5a40' : '#e8dcc0') : face, d = b.tr === 'stitch' ? 2.2 : 1.6, w = b.tr === 'rope' ? 0.55 : 0.25;
      for (const [y, sg] of [[top(u) + d, 1], [bot(u) - d, -1]] as [number, number][]) put(P([[x0 - 1, y - w * sg], [x0 + 0.6, y - w * sg], [x0 + 0.6, y + w * sg], [x0 - 1, y + w * sg]]), col, 0.02, 0.001); } }
  // the side plates, clear of the centre plate and smaller when crowded
  const side = (cx: number, k: number) => { const cy = 21 + Math.sin((cx - 3) / 90 * Math.PI) * 1.2;
    if (b.ss === 'square') { put(R(cx - 4.4 * k, cy - 5 * k, 8.8 * k, 10 * k), rim, 0.03); put(R(cx - 3.5 * k, cy - 4.1 * k, 7 * k, 8.2 * k), face, 0.04); }
    else if (b.ss === 'shield') { put(P([[cx - 4.4 * k, cy - 5.2 * k], [cx + 4.4 * k, cy - 5.2 * k], [cx + 4.4 * k, cy + k], [cx, cy + 5.6 * k], [cx - 4.4 * k, cy + k]]), rim, 0.03); put(P([[cx - 3.5 * k, cy - 4.3 * k], [cx + 3.5 * k, cy - 4.3 * k], [cx + 3.5 * k, cy + 0.6 * k], [cx, cy + 4.4 * k], [cx - 3.5 * k, cy + 0.6 * k]]), face, 0.04); }
    else { put(C(cx, cy, 5 * k, 12), rim, 0.03); put(C(cx, cy, 4.1 * k, 12), face, 0.04); }
    const st: number[][] = []; for (let j = 0; j < 10; j++) { const an = -Math.PI / 2 + j * Math.PI / 5, r = (j % 2 ? 0.9 : 2.1) * k; st.push([cx + Math.cos(an) * r, cy - 0.3 * k + Math.sin(an) * r]); } put(P(st), shine, 0.05, 0.002); };
  const n = b.sd | 0, s0 = ({ crest: 35, bar: 29, oval: 26, diamond: 26, star: 25 } as Record<string, number>)[b.pl] || 23.5, gap = n > 1 ? Math.min(10.5, (41 - s0) / (n - 1)) : 0, sc = n > 1 ? Math.min(1, gap / 10.5 + 0.12) : 1;
  for (let i = 0; i < n; i++) { const off = s0 + i * gap; side(48 - off, sc); side(48 + off, sc); }
  // the centre plate: a rim, then its face
  const cx = 48, cy = 21; let tY = 14, wY = 26, wW = 30;
  const plate = (q: number, col: string, dz: number) => {
    if (b.pl === 'oval') put(EL(cx, cy, 20 * q, 14.5 * q), col, dz);
    else if (b.pl === 'globe') put(C(cx, cy, 16 * q, 22), col, dz);
    else if (b.pl === 'shield') put(P([[cx - 16 * q, cy - 15 * q], [cx + 16 * q, cy - 15 * q], [cx + 16 * q, cy + 3 * q], [cx, cy + 17 * q], [cx - 16 * q, cy + 3 * q]]), col, dz);
    else if (b.pl === 'diamond') put(P([[cx, cy - 17 * q], [cx + 21 * q, cy], [cx, cy + 17 * q], [cx - 21 * q, cy]]), col, dz);
    else if (b.pl === 'square') put(R(cx - 16 * q, cy - 13 * q, 32 * q, 26 * q), col, dz);
    else if (b.pl === 'bar') put(R(cx - 23 * q, cy - 9 * q, 46 * q, 18 * q), col, dz);
    else if (b.pl === 'star') { const st: number[][] = []; for (let j = 0; j < 10; j++) { const an = -Math.PI / 2 + j * Math.PI / 5, r = (j % 2 ? 9 : 18.5) * q; st.push([cx + Math.cos(an) * r * 1.15, cy + 1 + Math.sin(an) * r]); } put(P(st), col, dz); }
    else if (b.pl === 'crown') { put(P([[cx - 15 * q, cy - 5 * q], [cx - 15 * q, cy - 17 * q], [cx - 8 * q, cy - 10 * q], [cx, cy - 19 * q], [cx + 8 * q, cy - 10 * q], [cx + 15 * q, cy - 17 * q], [cx + 15 * q, cy - 5 * q]]), col, dz); put(R(cx - 16 * q, cy - 6 * q, 32 * q, 21 * q), col, dz + 0.001); }
    else if (b.pl === 'crest') { for (const d of [-1, 1]) for (let j = 0; j < 4; j++) put(P([[cx + d * 10 * q, cy - 8 * q + j * 4 * q], [cx + d * (31 - j * 3) * q, cy - 13 * q + j * 5.5 * q], [cx + d * (30 - j * 3) * q, cy - 9.5 * q + j * 5.5 * q], [cx + d * 10 * q, cy - 3 * q + j * 4 * q]]), col, dz);
      put(C(cx, cy, 13.5 * q, 20), col, dz + 0.001); }
    else put(C(cx, cy, 15 * q, 20), col, dz);
  };
  plate(1, rim, 0.06); plate(0.86, face, 0.08);
  if (b.pl === 'globe') for (const rx of [6, 11]) { put(EL(cx, cy, rx, 13.6, 20).concat(EL(cx, cy, rx - 0.5, 13.1, 20).reverse()), rim, 0.085, 0.001); }
  put(EL(cx - 7, cy - 7, 6, 2.6, 12), shine, 0.09, 0.003);   // a shine across the upper left of the face
  if (b.pl === 'bar') { tY = 15.5; wY = 25; wW = 40; } else if (b.pl === 'crown') { tY = 18; wY = 28; wW = 26; } else if (b.pl === 'diamond') { wW = 26; } else if (b.pl === 'star') { wW = 24; tY = 15.5; }
  if (b.gm && b.gm !== 'none') { const g = GEM[b.gm] || GEM.red || PAL.red, gy = b.pl === 'crown' ? cy - 12 : (b.pl === 'bar' ? cy - 2.5 : cy - 3);
    put(C(cx, gy, 3.2, 12), rim, 0.1, 0.002); put(C(cx, gy, 2.5, 12), g, 0.11, 0.002); put(P([[cx - 1.6, gy - 0.6], [cx - 0.2, gy - 1.9], [cx + 0.4, gy - 0.9]]), '#ffffff', 0.12, 0.001); }
  if (b.w) { const bw = Math.min(wW + 6, Math.max(18, b.w.length * 3.6 + 6));
    put(P([[cx - bw / 2 - 2.5, wY - 3.6], [cx + bw / 2 + 2.5, wY - 3.6], [cx + bw / 2, wY], [cx + bw / 2 + 2.5, wY + 3.6], [cx - bw / 2 - 2.5, wY + 3.6], [cx - bw / 2, wY]]), rim, 0.1);
    if (say) say(b.w, U(cx), V(wY + 0.3), Math.min(5, (bw - 1) / Math.max(1, b.w.length * 0.62)) * K, shine, 0.13); }
  if (b.top && say) say(b.top, U(cx), V(b.gm && b.gm !== 'none' && b.pl !== 'crown' && b.pl !== 'bar' ? tY - 3 : tY), Math.min(4.2, 18 / Math.max(1, b.top.length * 0.62)) * K, rim, 0.13);
}

/* ---------- props: things that stand in a scene ---------- */
export interface PropDraw { k: string; x: number; y: number; r: number; z: number; s?: number; txt?: string; col?: string; id: string; bl?: BeltData }
const PR = (pts: Pt[], cx: number, cy: number, a: number, s: number): Pt[] => pts.map(([x, y]) => { const d = rot([x * s, y * s], a); return [cx + d[0], cy + d[1]] as Pt; });
export const PROPS: [string, string][] = [['belt', 'Title belt'], ['chair', 'Chair'], ['table', 'Table'], ['mic', 'Microphone'], ['burst', 'Burst'], ['sign', 'Sign'], ['headline', 'Headline'], ['words', 'Words, no background'], ['confetti', 'Confetti'],
  ['spot', 'Spotlight'], ['beams', 'Coloured lights'], ['strobe', 'Strobes'], ['dim', 'Lights down'], ['sparks', 'Sparks'], ['fountain', 'Pyro fountain'], ['flash', 'A flash'], ['fire', 'A column of fire'],
  ['ladder', 'Ladder'], ['bat', 'Baseball bat'], ['steps', 'Ring steps'], ['bin', 'Rubbish bin'], ['table_broken', 'Broken table'], ['cameras', 'Camera flashes'], ['motion', 'Motion lines'], ['spray', 'A spray of water'], ['smoke', 'Smoke'], ['truck', 'A truck'], ['masthead', 'Masthead (a cover title)']];
/** Cut a prop. `t` (seconds) moves the things that move by themselves (confetti). */
const lum = (h: string) => { const n = parseInt(h.slice(1), 16) || 0; return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };
export function prop(p: PropDraw, out: Piece[], t = 0) {
  const a = p.r * Math.PI / 180, s = p.s || 1, z = p.z, own = p.id, seed = hash(p.id + p.k);
  const add = (pts: Pt[], col: string, dz: number, lift = 0.05, rough = 0.008) => out.push({ pts: snip(PR(pts, p.x, p.y, a, s), seed + out.length * 31, rough, 0.08), col, z: z + dz, lift, prop: own });
  if (p.k === 'belt') {   // a title's own belt, as Create a Belt paints it (Ryan, 21 October)
    beltPieces(p.bl || topBelt(), (pts, col, dz, rough) => add(pts, col, dz, 0.05, rough == null ? 0.006 : rough),
      (str, u, v, size, col, dz) => { const q = PR([[u, v]], p.x, p.y, a, s)[0]; out.push({ pts: [], col: '', z: z + dz, prop: own, txt: { s: str, x: q[0], y: q[1], size: size * s, col } }); });
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
  } else if (p.k === 'words') {   // just the lettering, nothing behind it: words over the picture in any colour
    out.push({ pts: [], col: '', z: z + 0.02, prop: own, txt: { s: p.txt || 'WORDS', x: p.x, y: p.y, size: 0.7 * s, col: p.col || PAL.white, edge: lum(p.col || PAL.white) > 0.5 ? '#111111' : '#ffffff' } });
  } else if (p.k === 'headline') {   // lettering cut from card on a strip: a headline, a masthead, a caption
    const txt = p.txt || 'BREAKING NEWS', w = Math.max(2, txt.length * 0.36);
    add([[-w / 2 - 0.25, -0.42], [w / 2 + 0.25, -0.42], [w / 2 + 0.25, 0.42], [-w / 2 - 0.25, 0.42]], p.col || PAL.red, 0, 0.06);
    out.push({ pts: [], col: '', z: z + 0.08, txt: { s: txt, x: p.x, y: p.y, size: 0.62 * s, col: PAL.white } });
  } else if (p.k === 'spot') {   // a beam of pale card from above, and the pool of light at the feet
    add([[-0.28, 7], [0.28, 7], [1.5, -0.25], [-1.5, -0.25]], p.col || '#fff4c2', 0, 0.02, 0.01);
    add(ell(0, -0.25, 1.6, 0.35, 20), shade(p.col || '#fff4c2', 1.05), 0.01, 0.01, 0.01);
  } else if (p.k === 'beams') {   // two coloured beams from the trusses, crossing over whoever is under them
    for (const sd of [-1, 1]) add([[sd * 5.6, 7], [sd * 4.6, 7], [-sd * 0.6, -0.3], [-sd * 2.8, -0.3]], p.col || PAL.red, 0, 0.02, 0.01);
  } else if (p.k === 'strobe') {   // white flashes, a different few on at each moment
    for (let i = 0; i < 6; i++) if (((Math.floor(t * 8) + i) % 3) === 0) add(star((i - 2.5) * 2.2, 3.4 + (i % 2) * 0.9, 0.55, 8, 0.35), PAL.white, 0.01, 0.02, 0.004);
  } else if (p.k === 'dim') {   // the house lights down: dark card over the back of the set
    add([[-12, -1.2], [12, -1.2], [12, 8], [-12, 8]], '#07081a', 0, 0.01, 0.004);
  } else if (p.k === 'sparks') {   // a shower of sparks falling from above the stage
    for (let i = 0; i < 26; i++) { const hx = ((seed >> (i % 11)) + i * 7919) % 1000 / 1000, hy = ((seed >> (i % 7)) + i * 104729) % 1000 / 1000, fy = 5 - ((t * 3 + hy * 6) % 6);
      add([[-0.03, 0], [0.03, 0], [0.02, 0.32], [-0.02, 0.32]].map(([x, y]) => [x + (hx - 0.5) * 5, y + fy] as Pt), i % 3 ? PAL.yellow : PAL.white, 0.01, 0.01, 0.002); }
  } else if (p.k === 'fountain') {   // a fountain of gold from the floor: flecks in a cone, the cone higher as it goes
    const up = 1.2 + Math.min(1, t) * 2.4;
    add([[-0.18, 0], [0.18, 0], [0.7, up], [-0.7, up]], PAL.gold, 0, 0.02, 0.02);
    for (let i = 0; i < 14; i++) { const h1 = ((seed >> (i % 9)) + i * 7919) % 1000 / 1000, hh = (i / 14) * up; add(star((h1 - 0.5) * (0.3 + hh * 0.35), hh, 0.09, 4, 0.4), i % 2 ? PAL.white : PAL.yellow, 0.02, 0.01, 0.002); }
  } else if (p.k === 'flash') {   // a flash and a bang behind them
    add(star(0, 0, 2.6, 14, 0.55), PAL.white, 0, 0.03, 0.01); add(star(0, 0, 1.8, 14, 0.55), PAL.yellow, 0.01, 0.02, 0.01);
  } else if (p.k === 'fire') {   // a column of fire: red, orange and yellow tongues of card, licking up
    const fl = (w0: number, h0: number, col: string, dz: number) => { const pts: Pt[] = [[-w0, 0]]; for (let i = 0; i <= 6; i++) pts.push([-w0 + 2 * w0 * i / 6, h0 * (0.75 + 0.25 * Math.sin(t * 9 + i * 1.7 + seed % 7)) * (i % 2 ? 0.8 : 1)]); pts.push([w0, 0]); add(pts, col, dz, 0.03, 0.02); };
    fl(0.6, 3.6, PAL.red, 0); fl(0.45, 2.8, PAL.orange, 0.01); fl(0.28, 1.9, PAL.yellow, 0.02);
  } else if (p.k === 'masthead') {   // a magazine's name in big cut letters across the top of a cover, on a band of card
    const txt = p.txt || 'RING NEWS', w = Math.max(4, txt.length * 0.62);
    add([[-w / 2 - 0.3, -0.62], [w / 2 + 0.3, -0.62], [w / 2 + 0.3, 0.62], [-w / 2 - 0.3, 0.62]], p.col || PAL.red, 0, 0.06);
    add([[-w / 2 - 0.3, -0.62], [w / 2 + 0.3, -0.62], [w / 2 + 0.3, -0.5], [-w / 2 - 0.3, -0.5]], PAL.yellow, 0.02, 0.02, 0.004);
    out.push({ pts: [], col: '', z: z + 0.08, txt: { s: txt, x: p.x, y: p.y + 0.04, size: 1.05 * s, col: PAL.white } });
  } else if (p.k === 'truck') {   // a box truck side on: the trailer, the cab, the wheels
    add([[-3.2, -0.6], [1.6, -0.6], [1.6, 2.0], [-3.2, 2.0]], '#e8e4da', 0, 0.06); add([[-3.2, 1.0], [1.6, 1.0], [1.6, 1.25], [-3.2, 1.25]], p.col || PAL.red, 0.01, 0.02, 0.004);
    add([[1.7, -0.6], [3.4, -0.6], [3.4, 0.8], [2.8, 1.4], [1.7, 1.4]], p.col || PAL.red, 0, 0.06); add([[2.2, 0.55], [3.05, 0.55], [2.75, 1.15], [2.2, 1.15]], '#9ab8d0', 0.01, 0.02, 0.004);
    for (const wx of [-2.4, -1.1, 2.7]) { add(ell(wx, -0.65, 0.42, 0.42, 14), '#111114', 0.02, 0.04, 0.004); add(ell(wx, -0.65, 0.16, 0.16, 10), PAL.steel, 0.03, 0.01, 0.002); }
  } else if (p.k === 'smoke') {   // smoke rolling along the floor: pale puffs of tissue that drift and swell
    for (let i = 0; i < 14; i++) { const h1 = Math.abs((seed >> (i % 9)) + i * 7919) % 1000 / 1000, dr = ((t * 0.35 + h1) % 1), x = (i - 6.5) * 0.8 + dr * 0.9 * (i % 2 ? 1 : -1), r0 = 0.65 + h1 * 0.4 + dr * 0.25;
      add(ell(x, -0.3 + (i % 3) * 0.22 + dr * 0.3, r0 * 1.5, r0 * 0.6, 14), i % 3 ? '#d9dbe2' : '#eef0f4', 0.005 * i, 0.01, 0.02); }
  } else if (p.k === 'ladder') {   // a steel ladder: two rails and the rungs between
    for (const sx of [-0.45, 0.45]) add([[sx - 0.07, -1.6], [sx + 0.07, -1.6], [sx + 0.07, 1.6], [sx - 0.07, 1.6]], PAL.steel, 0);
    for (let i = 0; i < 6; i++) { const y = -1.35 + i * 0.54; add([[-0.42, y - 0.04], [0.42, y - 0.04], [0.42, y + 0.04], [-0.42, y + 0.04]], shade(PAL.steel, 0.82), -0.01); }
  } else if (p.k === 'bat') {   // a wooden bat
    add([[-0.05, -0.75], [0.05, -0.75], [0.11, 0.7], [0.08, 0.78], [-0.08, 0.78], [-0.11, 0.7]], PAL.wood, 0); add(ell(0, -0.78, 0.08, 0.05, 10), shade(PAL.wood, 0.7), 0.01);
  } else if (p.k === 'steps') {   // the steel steps at the corner of the ring
    for (let i = 0; i < 3; i++) add([[-0.9 + i * 0.3, -0.9 + i * 0.45], [0.9, -0.9 + i * 0.45], [0.9, -0.45 + i * 0.45], [-0.9 + i * 0.3, -0.45 + i * 0.45]], shade(PAL.steel, 1 - i * 0.08), i * 0.01);
  } else if (p.k === 'bin') {   // a dented rubbish bin with its lid
    add([[-0.45, -0.7], [0.45, -0.7], [0.52, 0.55], [-0.52, 0.55]], PAL.grey, 0); for (const x of [-0.25, 0, 0.25]) add([[x - 0.02, -0.6], [x + 0.02, -0.6], [x + 0.03, 0.45], [x - 0.03, 0.45]], shade(PAL.grey, 0.75), 0.01);
    add(ell(0, 0.62, 0.6, 0.12, 14), shade(PAL.grey, 1.1), 0.02);
  } else if (p.k === 'table_broken') {   // a table snapped in two, the halves folded in
    add([[-1.6, -0.2], [-0.1, 0.25], [-0.05, 0.4], [-1.6, 0.0]], PAL.wood, 0.02); add([[0.1, 0.35], [1.6, -0.1], [1.6, 0.08], [0.15, 0.5]], PAL.wood, 0.02);
    for (const [x, y] of [[-0.05, 0.4], [0.1, 0.42], [0.0, 0.55], [0.18, 0.6]] as Pt[]) add([[x, y], [x + 0.05, y + 0.18], [x - 0.04, y + 0.12]], shade(PAL.wood, 1.25), 0.03, 0.01, 0.002);   // splinters
    for (const sx of [-1.3, 1.3]) add([[sx - 0.07, 0], [sx + 0.07, 0], [sx + 0.07, -1.0], [sx - 0.07, -1.0]], shade(PAL.wood, 0.6), 0);
  } else if (p.k === 'cameras') {   // flashes going off all over the crowd, a different few each moment
    for (let i = 0; i < 18; i++) { const h1 = ((seed >> (i % 11)) + i * 7919) % 1000 / 1000, h2 = ((seed >> (i % 7)) + i * 104729) % 1000 / 1000; if (((Math.floor(t * 6) + i) % 4) !== 0) continue;
      add(star((h1 - 0.5) * 16, 0.5 + h2 * 3.5, 0.18, 6, 0.35), PAL.white, 0, 0.01, 0.002); }
  } else if (p.k === 'motion') {   // speed lines behind something moving fast
    for (let i = 0; i < 6; i++) { const y = -0.8 + i * 0.32, l = 1.2 + (i % 3) * 0.5; add([[-l, y - 0.03], [0, y - 0.02], [0, y + 0.02], [-l, y + 0.03]], p.col || PAL.white, 0, 0.01, 0.002); }
  } else if (p.k === 'spray') {   // a spray of water, a fan of drops
    for (let i = 0; i < 16; i++) { const a2 = -0.5 + i / 15, d = 0.4 + ((seed >> (i % 9)) % 10) / 10 * 1.4 + t * 0.6; add(ell(Math.cos(a2) * d, Math.sin(a2) * d, 0.07, 0.05, 8), p.col || '#bfe6ff', 0, 0.01, 0.002); }
  } else if (p.k === 'confetti') {
    const cols = [PAL.gold, PAL.red, PAL.white, PAL.sky, PAL.yellow];
    for (let i = 0; i < 40; i++) {
      const h1 = ((seed >> (i % 16)) + i * 7919) % 1000 / 1000, h2 = ((seed >> (i % 13)) + i * 104729) % 1000 / 1000;
      const fx = p.x + (h1 - 0.5) * 12, fy = p.y + 4 - ((t * (0.8 + h2) + h2 * 9) % 9), ra = t * 3 + i;
      out.push({ pts: PR([[-0.06, -0.04], [0.06, -0.04], [0.06, 0.04], [-0.06, 0.04]], fx, fy, ra, s), col: cols[i % cols.length], z: z, lift: 0.03, prop: own });
    }
  }
}
