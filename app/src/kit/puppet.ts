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
import { puppetC } from './stylec';

export interface Recipe {
  key: string; name: string; skin: string; h: number; w: number; belly: number; fem: boolean;
  head: { rx: number; ryt: number; ryb: number; sq: number; chin: number };
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
  /** Concept options (Create a Player): cheeks (none unless picked), eye colour (left out: one from the name), the hair's shine (on unless turned off). */ cheeks?: 'rosy' | 'flush' | 'tan'; eyeCol?: string; shine?: boolean;
  /** Concept: who they are, for the face they wear at rest: the side, sharpened by the gimmick, or picked by hand. */ mood?: 'face' | 'heel' | 'sad' | 'happy' | 'cocky' | 'fierce';
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
    mood: moodOf(gim, face), gear, gear2, straps: !fem && (st === 'P' || st === 'B') && h('s', 2) === 0, tape: h('t', 3) > 0,
  };
  if (fem) { r.straps = true; }
  if (masked) r.mask = { base: pick(['gold', 'red', 'blue', 'white', 'black', 'green', 'purple', 'silver' in PAL ? 'silver' : 'steel'], 'mb'), trim: pick(['red', 'gold', 'black', 'white', 'sky'], 'mt') };
  return r;
}
/** The face a character wears at rest, read from their gimmick: worried, beaming, smug or fierce, else their side. */
export function moodOf(gim: string, face: boolean): Recipe['mood'] {
  const g = gim.toLowerCase();
  if (/\b(sad|anxious|apolog|regret|weep|lonely|gloom|depress|malcontent|worried|nervous)/.test(g)) return 'sad';
  if (/\b(beam|smil|laugh|cheer|sing|danc|party|joy|bubbl|pop star|happy|goofy)/.test(g)) return 'happy';
  if (/\b(smug|smirk|rich|arrogan|better than|snob|vain|flamboy|peacock|prince|princess|dandy|hollywood|diva|pretty|narciss)/.test(g)) return 'cocky';
  if (/\b(giant|monster|never says|silent|beast|savage|destroy|brute|killer|feral|psycho|demon|menace|enforcer|monolith)/.test(g)) return 'fierce';
  return face ? 'face' : 'heel';
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
/** Cut and pin a doll: style C, the human paper doll (kit/stylec.ts). */
export function puppet(r: Recipe, pl: Place, pose: Record<string, number>, expr: string, own: string, out: Piece[], mk: Marks = {}): Rig { return puppetC(r, pl, pose, expr, own, out, mk); }


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
