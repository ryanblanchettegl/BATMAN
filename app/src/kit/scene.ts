/* Create a Scene: the scene file and how it plays (docs/plans/papercraft-engine.md, sections 4 and 5).
   A scene is plain data, saved as a .scene.json file: a set (the ring, backstage, a plain card), slots for the
   people in it (A, B, the referee), and keyframes. Each keyframe says where every figure stands, how it is turned
   and posed, and which props are in the picture (a belt, a chair, a burst of words). Playing a scene slides every
   figure from one keyframe to the next. The game's own scenes are made in Create a Scene like anybody else's
   (`SCENES` below is what it saved), so a player can open them, change them and share them. Nothing here touches
   the game state. */
import { Piece, PAL, ell, rect, star, strip, drawPaper, View, snip, shade } from './paper';
import { Recipe, puppet, prop, Rig, blank, REF, Marks } from './puppet';

/** A person at a keyframe: where the waist is, the turn, which way they face, how far forward, the pose, the face,
    their size (1 as cut) and the marks on them. */
export interface Fig { x: number; y: number; r: number; f: number; z: number; p: Record<string, number>; e?: string; s?: number; m?: Marks }
export interface Prop { id: string; k: string; x: number; y: number; r: number; z: number; s?: number; txt?: string; col?: string; at?: string }
/** The camera at a keyframe: where it looks (x, y in scene units), how close (z: 1 is the whole set, 3 is a close-up)
    and a tilt in degrees. Left out, it shows the whole set. */
export interface Cam { x: number; y: number; z: number; r?: number }
export const CAM0: Cam = { x: 0, y: 0, z: 1, r: 0 };
export interface Key { t: number; figs: Record<string, Fig>; props: Prop[]; cam?: Cam }
export interface Slot { id: string; n: string; role: 'a' | 'b' | 'ref' | 'c' }
/** `frame` is the shape of the picture: wide (16 by 9, the broadcast) for now; tall for posters and covers and square
    for portraits are next. */
export interface Scene { v: 1; id: string; name: string; when: string; set: string; slots: Slot[]; keys: Key[]; by?: string; frame?: 'wide' | 'tall' | 'square' }

/** When the broadcast plays a scene. A scene made by a player can take any of these. */
/** What a scene is for. The match moments play on the broadcast now; the rest are where scenes go next
    (Ryan, 18 October: breaking news, talk show highlights, posters, magazine covers, portraits, everything). */
export const WHEN: [string, string][] = [['start', 'The opening bell'], ['mid', 'Back and forth'], ['nearfall', 'A near fall'], ['finish', 'The finish'], ['champion', 'A new champion'], ['promo', 'A promo'], ['attack', 'An attack'],
  ['news', 'Breaking news'], ['talk', 'A talk show'], ['poster', 'A poster'], ['cover', 'A magazine cover'], ['portrait', 'A portrait'], ['any', 'Only by hand']];
export const SETS: [string, string][] = [['ring', 'The ring'], ['backstage', 'Backstage'], ['plain', 'Plain card']];
export const W16 = 16, H9 = 9;   // a scene is 16 units wide and 9 high; x = 0 is the middle, y = 0 the middle
export const FOOT = -2.9;          // where feet stand on the mat
export const WAIST = FOOT + 2.52 + 0.7;   // the waist of a doll of standard height standing on the mat

/* ---------- the sets ---------- */
function setPieces(set: string): Piece[] {
  const o: Piece[] = []; let n = 0; const add = (pts: [number, number][], col: string, z: number, lift = 0.04, rough = 0.012) => o.push({ pts: snip(pts, 9000 + (n++) * 131, rough, 0.1), col, z, lift });
  if (set === 'ring') {
    // The ring as the hard camera sees it: the mat a floor that widens toward us, the far ropes and posts behind the
    // wrestlers at about their waist, the side ropes running back to them, the crowd rising past the barricade.
    const FAR = -0.9, NEAR = -3.75, FX = 6.2, NX = 9.2;
    add(rect(-11, -7, 22, 14), PAL.navy, -1, 0, 0);
    let s = 3;
    const r01 = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const shirts = [PAL.red, PAL.black, PAL.white, PAL.blue, PAL.grey, PAL.maroon, PAL.yellow, PAL.teal];
    const skins = ['#f3dccb', '#e8c09e', '#d5a07a', '#b07a52', '#7f5236', '#5a3a26'];
    for (let row = 0; row < 5; row++) {   // the back rows small and dim, the front rows bigger and lit
      const y = 3.7 - row * 0.8, n2 = 34 - row * 2, k = 0.5 + row * 0.11, sz = 0.2 + row * 0.035;
      for (let i = 0; i < n2; i++) {
        const x = -10.6 + (i + r01() * 0.4) * 21.2 / n2 + (row % 2) * 0.25;
        add(ell(x, y - sz * 1.4, sz * 1.6, sz * 1.2, 10), shade(shirts[Math.floor(r01() * shirts.length)], k), -0.9 + row * 0.04, 0.03, 0.01);
        add(ell(x, y, sz * 0.75, sz * 0.9, 10), shade(skins[Math.floor(r01() * skins.length)], k), -0.88 + row * 0.04, 0.03, 0.01);
        if (r01() < 0.07) add(ell(x + 0.2, y + 0.25, 0.05, 0.07, 6), '#fffff2', -0.85 + row * 0.04, 0.01, 0.002);
      }
    }
    for (let i = 0; i < 8; i++) add(ell(-8.4 + i * 2.4, 4.6, 0.2, 0.2, 12), PAL.yellow, -0.65, 0.02, 0.01);
    add(rect(-11, -0.78, 22, 0.42), '#1a1a1f', -0.7, 0.03);                  // the barricade
    add(rect(-11, NEAR, 22, FAR - NEAR + 0.12), '#1e2033', -0.68, 0.01, 0);   // the floor round the ring
    for (const sx of [-FX, FX]) {                                           // the far posts and their pads
      add(rect(sx - 0.11, FAR, 0.22, 1.95), PAL.steel, -0.6, 0.03, 0.006);
      for (let k = 1; k <= 3; k++) add(ell(sx, FAR + 0.55 * k, 0.19, 0.15, 12), PAL.red, -0.55, 0.03, 0.006);
    }
    for (let k = 1; k <= 3; k++) add(rect(-FX, FAR + 0.55 * k - 0.04, FX * 2, 0.08), PAL.white, -0.5, 0.03, 0.004);   // the far ropes
    add([[-FX, FAR], [FX, FAR], [NX, NEAR], [-NX, NEAR]], PAL.mat, -0.45, 0.02, 0.012);                            // the mat
    add([[-FX, FAR], [FX, FAR], [FX + 0.15, FAR - 0.25], [-FX - 0.15, FAR - 0.25]], shade(PAL.mat, 0.86), -0.44, 0.01, 0.006);   // its far edge
    add(ell(0, -2.35, 2.0, 0.52, 28), shade(PAL.blue, 1.05), -0.43, 0.01, 0.01); add(ell(0, -2.35, 1.55, 0.36, 24), PAL.mat, -0.42, 0.01, 0.008);   // the logo
    for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) {                   // the side ropes, back to the far posts
      const a: [number, number] = [sd * FX, FAR + 0.55 * k], b: [number, number] = [sd * NX, NEAR + 0.75 * k];
      add(strip(a, b, 0.07, 0.13), PAL.white, -0.4, 0.03, 0.004);
    }
  } else if (set === 'backstage') {  } else if (set === 'backstage') {
    add(rect(-11, -7, 22, 14), '#4a4f5c', -1, 0, 0);
    for (let i = 0; i < 6; i++) { add(rect(-7.8 + i * 1.5, -2.5, 1.3, 5.6), '#6f7a8a', -0.9, 0.05); add(rect(-7.6 + i * 1.5, 1.8, 0.9, 0.12), '#2b2f38', -0.85, 0.02); }
    add(rect(2.2, -2.6, 5.6, 4.8), '#c9b48a', -0.9, 0.06); add(rect(2.5, 1.2, 5.0, 0.7), PAL.red, -0.85, 0.03);
    add(rect(-11, -7, 22, 4.2), '#2d2f36', -0.5, 0.04);
  } else {
    add(rect(-11, -7, 22, 14), PAL.cream, -1, 0, 0);
    add(rect(-11, -7, 22, 4.1), shade(PAL.cream, 0.82), -0.5, 0.04);
  }
  return o;
}
const FRONT: Record<string, (o: Piece[]) => void> = {
  ring: o => {   // the near posts at the edges, and the apron skirt along the bottom
    for (const sd of [-1, 1]) { o.push({ pts: snip(rect(sd * 9.2 - 0.18, -3.75, 0.36, 2.55), 770 + sd, 0.008, 0.1), col: PAL.steel, z: 2.4, lift: 0.06 });
      for (let k = 1; k <= 3; k++) o.push({ pts: snip(ell(sd * 9.2, -3.75 + 0.75 * k, 0.3, 0.24, 12), 780 + k * 3 + sd, 0.006, 0.1), col: PAL.red, z: 2.45, lift: 0.05 }); }
    o.push({ pts: snip(rect(-11, -7, 22, 3.25), 777, 0.015, 0.1), col: PAL.red, z: 2.5, lift: 0.08 });
    o.push({ pts: snip(rect(-11, -4.0, 22, 0.25), 778, 0.008, 0.1), col: PAL.white, z: 2.55, lift: 0.03 });
  },
};

/* ---------- where things are at a moment ---------- */
const ease = (t: number) => t * t * (3 - 2 * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function lastT(sc: Scene) { return sc.keys.length ? sc.keys[sc.keys.length - 1].t : 0; }
/** The figures and props at `time` seconds: between two keyframes everything slides; props appear with their keyframe. */
export function at(sc: Scene, time: number): Key {
  const ks = sc.keys; if (!ks.length) return { t: 0, figs: {}, props: [] };
  if (time <= ks[0].t) return ks[0];
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (time < b.t) {
      const t = ease((time - a.t) / Math.max(0.001, b.t - a.t)), figs: Record<string, Fig> = {};
      for (const id in a.figs) {
        const fa = a.figs[id], fb = b.figs[id]; if (!fb) { figs[id] = fa; continue; }
        const p: Record<string, number> = {}; for (const k of new Set([...Object.keys(fa.p), ...Object.keys(fb.p)])) p[k] = mix(fa.p[k] || 0, fb.p[k] || 0, t);
        figs[id] = { x: mix(fa.x, fb.x, t), y: mix(fa.y, fb.y, t), r: mix(fa.r, fb.r, t), f: t < 0.5 ? fa.f : fb.f, z: t < 0.5 ? fa.z : fb.z, p, e: t < 0.5 ? fa.e : fb.e, s: mix(fa.s || 1, fb.s || 1, t), m: t < 0.5 ? fa.m : fb.m };
      }
      const props = a.props.map(pa => { const pb = b.props.find(x => x.id === pa.id); return pb ? { ...pa, x: mix(pa.x, pb.x, t), y: mix(pa.y, pb.y, t), r: mix(pa.r, pb.r, t) } : pa; });
      const ca = a.cam || CAM0, cb = b.cam || CAM0, cam = { x: mix(ca.x, cb.x, t), y: mix(ca.y, cb.y, t), z: mix(ca.z, cb.z, t), r: mix(ca.r || 0, cb.r || 0, t) };
      return { t: time, figs, props, cam };
    }
  }
  return ks[ks.length - 1];
}

/** Everything in the picture at a moment, as pieces, with each figure's joints (for dragging) and anchors (for props). */
export function build(sc: Scene, k: Key, cast: Record<string, Recipe>, time = 0): { pieces: Piece[]; rigs: Record<string, Rig> } {
  const pieces = setPieces(sc.set), rigs: Record<string, Rig> = {};
  sc.slots.forEach((sl, i) => {
    const f = k.figs[sl.id]; if (!f) return;
    const r = cast[sl.id] || (sl.role === 'ref' ? REF : blank(i));
    rigs[sl.id] = puppet(r, { x: f.x, y: f.y, r: f.r, f: f.f, z: f.z, s: f.s }, f.p, f.e || '', sl.id, pieces, f.m || {});
  });
  for (const p of k.props) {
    let x = p.x, y = p.y;
    if (p.at) { const [who, anc] = p.at.split(':'), rg = rigs[who], q = rg && rg.anchors[anc]; if (q) { x = q[0] + p.x; y = q[1] + p.y; } }
    prop({ ...p, x, y }, pieces, time);
  }
  if (FRONT[sc.set]) FRONT[sc.set](pieces);
  return { pieces, rigs };
}

/** The view that fits a 16 by 9 scene into a canvas of this size, through the camera. */
export function viewFor(w: number, h: number, cam?: Cam): View {
  const c = cam || CAM0, s = Math.min(w / W16, h / H9) * Math.max(0.8, c.z);
  return { s, ox: w / 2 - c.x * s, oy: h / 2 + c.y * s };
}
/** Tilt the canvas round its middle for the camera's tilt; call before drawing, and ctx.restore() after. */
export function tilt(ctx: CanvasRenderingContext2D, cam?: Cam) {
  ctx.save(); const r = cam && cam.r ? cam.r * Math.PI / 180 : 0; if (!r) return;
  const w = ctx.canvas.width, h = ctx.canvas.height; ctx.translate(w / 2, h / 2); ctx.rotate(-r); ctx.scale(1 + Math.abs(Math.sin(r)) * 0.9, 1 + Math.abs(Math.sin(r)) * 0.9); ctx.translate(-w / 2, -h / 2);
}
export function paint(ctx: CanvasRenderingContext2D, sc: Scene, time: number, cast: Record<string, Recipe>) {
  const c = ctx.canvas, k = at(sc, time), v = viewFor(c.width, c.height, k.cam);
  ctx.fillStyle = PAL.navy; ctx.fillRect(0, 0, c.width, c.height);
  const b = build(sc, k, cast, time); tilt(ctx, k.cam); drawPaper(ctx, b.pieces, v); ctx.restore(); return { ...b, v };
}

/* ---------- poses to start from ---------- */
/** A pose to start from: the angles, and where the waist sits for it (standing, kneeling, sitting or on the mat). */
export interface PoseDef { n: string; p: Record<string, number>; r?: number; y?: number; e?: string }
const KN = { torso: -10, hip_n: -5, kn_n: -90, an_n: 60, hip_f: 5, kn_f: -95, an_f: 60 };
export const POSES: [string, PoseDef][] = [
  ['stand', { n: 'Standing', p: {} }],
  ['fists', { n: 'Fists up', p: { sh_n: 25, el_n: 100, sh_f: 20, el_f: 105, hip_n: 12, kn_n: -12, hip_f: -12 } }],
  ['point', { n: 'Pointing', p: { sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 4 } }],
  ['armsup', { n: 'Both arms up', p: { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 8, hip_n: 6, hip_f: -6 }, e: 'shout' }],
  ['onearm', { n: 'One arm up', p: { sh_n: 165, el_n: 5, sh_f: -20, el_f: -20, head: 6 }, e: 'shout' }],
  ['flex', { n: 'Flexing', p: { sh_n: 90, el_n: 115, sh_f: -90, el_f: -115, hip_n: 10, hip_f: -10 }, e: 'roar' }],
  ['mic', { n: 'On the microphone', p: { sh_n: 150, el_n: 120, sh_f: -20, el_f: -30, head: 4 } }],
  ['punch', { n: 'Throwing a punch', p: { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90, hip_n: 30, kn_n: -20, hip_f: -24, kn_f: -10 }, r: -10, e: 'shout' }],
  ['kick', { n: 'A kick', p: { torso: -12, hip_n: 85, kn_n: -10, an_n: 0, hip_f: -10, sh_n: 40, el_n: 60, sh_f: -40, el_f: -60 }, e: 'shout' }],
  ['lift', { n: 'Lifting overhead', p: { sh_n: 165, el_n: 20, sh_f: -160, el_f: -20, hip_n: 25, kn_n: -40, hip_f: -15, kn_f: -30 }, e: 'roar' }],
  ['carry', { n: 'Arms out to carry', p: { sh_n: 80, el_n: 40, sh_f: 70, el_f: 40, hip_n: 10, kn_n: -15 } }],
  ['stagger', { n: 'Staggering back', p: { torso: -22, head: -20, sh_n: 80, el_n: 40, sh_f: -60, el_f: 30, hip_n: -10, kn_n: -20, hip_f: -24, kn_f: -20 }, r: -12, e: 'hurt' }],
  ['doubled', { n: 'Doubled over', p: { torso: 50, head: 20, sh_n: 30, el_n: 80, sh_f: 20, el_f: 90, hip_n: 10, kn_n: -20 }, e: 'pain' }],
  ['kneel', { n: 'Kneeling', p: { ...KN }, y: -1.33 }],
  ['weep', { n: 'On the knees, clutching', p: { ...KN, torso: -12, head: -8, sh_n: 15, el_n: 95, sh_f: 10, el_f: 100 }, y: -1.33, e: 'cry' }],
  ['sit', { n: 'Sitting on the mat', p: { torso: -10, hip_n: 90, kn_n: -20, an_n: -20, hip_f: 85, kn_f: -30, an_f: -20, sh_n: -40, el_n: 10, sh_f: -50, el_f: 10 }, y: -2.2 }],
  ['back', { n: 'Flat on the back', p: { sh_n: 160, el_n: 5, sh_f: 140, el_f: -10, hip_n: 10 }, r: 90, y: -2.15, e: 'hurt' }],
  ['front', { n: 'Face down', p: { sh_n: -10, sh_f: 10, hip_n: 4 }, r: -90, y: -2.15, e: 'hurt' }],
  ['cover', { n: 'Covering', p: { sh_n: -120, el_n: -30, sh_f: -60, el_f: -40, kn_n: -10, kn_f: -20, an_n: -30, an_f: -30, head: 25 }, r: -65, y: -1.75 }],
];

/* ---------- the scenes the game ships with: made in Create a Scene ---------- */
const STD = (x: number, f: number, p: Record<string, number> = {}, e?: string, z = 0): Fig => ({ x, y: WAIST, r: 0, f, z, p, e });
const LAY = (x: number, f: number, r: number, p: Record<string, number>, e?: string, z = 0, y = -2.15): Fig => ({ x, y, r, f, z, p, e });
const KNEEL = { torso: -30, head: 10, hip_n: -5, kn_n: -90, an_n: 60, hip_f: 5, kn_f: -95, an_f: 60, sh_f: -30, el_f: -20 };
const REFKN = (x: number, f: number, arm: Record<string, number>): Fig => ({ x, y: -1.33, r: 0, f, z: -0.4, p: { ...KNEEL, ...arm }, e: 'shout' });
const AB: Slot[] = [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }, { id: 'R', n: 'The referee', role: 'ref' }];
const burst = (id: string, txt: string, x: number, y: number, col = PAL.yellow): Prop => ({ id, k: 'burst', x, y, r: 0, z: 3, s: 1, txt, col });
const COVER_B = { sh_n: 160, el_n: 5, sh_f: 140, el_f: -10, hip_n: 35, kn_n: -60, an_n: 20 };
const COVER_A = { sh_n: -120, el_n: -30, sh_f: -60, el_f: -40, kn_n: -10, kn_f: -20, an_n: -30, an_f: -30, head: 25 };

export const SCENES: Scene[] = [
  { v: 1, id: 'lockup', name: 'The lock-up', when: 'start', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { A: STD(-2.6, 1, { sh_n: 25, el_n: 60, sh_f: 20, el_f: 70, hip_n: 10, kn_n: -12, hip_f: -12, kn_f: -6 }, 'shout'), B: STD(2.6, -1, { sh_n: 15, el_n: 80, sh_f: 10, el_f: 85, hip_n: 6, kn_n: -6, hip_f: -8 }, '', 1.2), R: STD(0, -1, { sh_n: 70, el_n: 10, sh_f: 75, el_f: 10 }, 'shout', -0.3) }, props: [] },
    { t: 0.9, figs: { A: { ...STD(-1.5, 1, { torso: 8, sh_n: 75, el_n: 20, sh_f: 60, el_f: 35, hip_n: 28, kn_n: -30, an_n: 4, hip_f: -20, kn_f: -10 }), r: -8 }, B: { ...STD(1.4, -1, { torso: 6, sh_n: 80, el_n: 15, sh_f: 55, el_f: 40, hip_n: 25, kn_n: -25, hip_f: -18, kn_f: -12 }, '', 1.2), r: 6 }, R: STD(-4.5, 1, { sh_n: 10, el_n: 30 }, '', -0.3) }, props: [] },
    { t: 1.6, figs: { A: { ...STD(-0.95, 1, { torso: 14, head: -6, sh_n: 105, el_n: 25, sh_f: 70, el_f: 50, hip_n: 30, kn_n: -30, an_n: 4, hip_f: -26, kn_f: -14 }, 'shout'), r: -14 }, B: { ...STD(0.85, -1, { torso: 12, head: -4, sh_n: 100, el_n: 35, sh_f: 65, el_f: 55, hip_n: 26, kn_n: -26, hip_f: -24, kn_f: -14 }, 'shout', 1.2), r: 12 }, R: STD(-4.6, 1, { sh_n: 40, el_n: 30, sh_f: 20 }, '', -0.3) }, props: [burst('b1', 'LOCK-UP!', 0, 3.4)] },
  ] },
  { v: 1, id: 'strike', name: 'Trading blows', when: 'mid', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { A: STD(-1.7, 1, { torso: -6, sh_n: -40, el_n: 100, sh_f: 40, el_f: 90, hip_n: 18, kn_n: -14, hip_f: -14 }, 'shout'), B: STD(1.3, -1, { sh_n: 40, el_n: 90, sh_f: 30, el_f: 95, hip_n: 10, kn_n: -10, hip_f: -12 }, '', 1.2), R: STD(-5, 1, {}, '', -0.3) }, props: [] },
    { t: 0.45, figs: { A: { ...STD(-1.3, 1, { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90, hip_n: 30, kn_n: -20, hip_f: -24, kn_f: -10 }, 'shout'), r: -10 }, B: { ...STD(1.4, -1, { torso: -16, head: -25, sh_n: 60, el_n: 30, sh_f: -40, el_f: 20, hip_n: 6, hip_f: -16, kn_f: -10 }, 'hurt', 1.2), r: -12 }, R: STD(-5, 1, { sh_n: 30 }, '', -0.3) }, props: [burst('b1', 'POW!', 1.6, 3.0)] },
    { t: 1.2, figs: { A: STD(-1.5, 1, { torso: 4, sh_n: 50, el_n: 60, sh_f: 30, el_f: 80, hip_n: 18, kn_n: -12, hip_f: -14 }, 'shout'), B: { ...STD(2.4, -1, { torso: -22, head: -20, sh_n: 80, el_n: 40, sh_f: -60, el_f: 30, hip_n: -10, kn_n: -20, hip_f: -24, kn_f: -20 }, 'hurt', 1.2), r: -18 }, R: STD(-5, 1, { sh_n: 20, el_n: 40 }, '', -0.3) }, props: [] },
  ] },
  { v: 1, id: 'nearfall', name: 'Kick out at two', when: 'nearfall', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { B: LAY(-0.8, -1, 90, COVER_B, 'hurt'), A: { x: -0.7, y: -1.75, r: -65, f: 1, z: 1, p: COVER_A }, R: REFKN(4.6, -1, { sh_n: 165, el_n: 5 }) }, props: [burst('b1', 'ONE!', -4.6, 2.9)] },
    { t: 0.8, figs: { B: LAY(-0.8, -1, 90, COVER_B, 'hurt'), A: { x: -0.7, y: -1.75, r: -65, f: 1, z: 1, p: COVER_A }, R: REFKN(4.6, -1, { sh_n: 25, el_n: 5 }) }, props: [burst('b1', 'TWO!', -4.6, 2.9)] },
    { t: 1.4, figs: { B: LAY(-0.8, -1, 72, { sh_n: 120, el_n: 40, sh_f: 60, el_f: 30, hip_n: 60, kn_n: -90, an_n: 20, hip_f: 15, kn_f: -20 }, 'shout', 0, -2.0), A: { x: -2.0, y: -1.0, r: -35, f: 1, z: 1, p: { sh_n: 150, el_n: 40, sh_f: -150, el_f: -40, hip_n: 30, kn_n: -60, hip_f: -20, kn_f: -30, head: 20 }, e: 'shout' }, R: REFKN(4.6, -1, { sh_n: 150, el_n: 40, sh_f: -150, el_f: -40 }) }, props: [burst('b2', 'KICK OUT!', 1.6, 3.1, PAL.red)] },
  ] },
  { v: 1, id: 'finish', name: 'One, two, three', when: 'finish', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { B: LAY(-0.8, -1, 90, COVER_B, 'hurt'), A: { x: -0.7, y: -1.75, r: -65, f: 1, z: 1, p: COVER_A }, R: REFKN(4.6, -1, { sh_n: 165, el_n: 5 }) }, props: [burst('b1', 'ONE!', -4.6, 2.9)] },
    { t: 0.7, figs: { B: LAY(-0.8, -1, 90, COVER_B, 'hurt'), A: { x: -0.7, y: -1.75, r: -65, f: 1, z: 1, p: COVER_A }, R: REFKN(4.6, -1, { sh_n: 25, el_n: 5 }) }, props: [burst('b1', 'TWO!', -4.6, 2.9)] },
    { t: 1.4, figs: { B: LAY(-0.8, -1, 90, COVER_B, 'hurt'), A: { x: -0.7, y: -1.75, r: -65, f: 1, z: 1, p: COVER_A }, R: REFKN(4.6, -1, { sh_n: 20, el_n: 0 }) }, props: [burst('b1', 'THREE!', -4.4, 2.9, PAL.red)] },
    { t: 2.4, figs: { B: LAY(-0.8, -1, 90, { ...COVER_B, sh_n: 170 }, 'hurt'), A: STD(-1.2, 1, { sh_n: 160, el_n: 10, sh_f: -150, el_f: -10, hip_n: 6, hip_f: -6 }, 'shout', 1), R: { ...STD(1.8, -1, { sh_n: 100, el_n: 0, sh_f: 10 }, 'shout', 1.2), x: 0.3 } }, props: [] },
  ] },
  { v: 1, id: 'champion', name: 'New champion', when: 'champion', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { A: STD(0, 1, { sh_n: 60, el_n: 40, sh_f: -60, el_f: -40, hip_n: 4 }, 'shout', 0.6), B: LAY(4.2, -1, 90, { sh_n: 150, sh_f: 130, hip_n: 20, kn_n: -40 }, 'hurt', 0.2), R: STD(-3.4, 1, { sh_n: 110, el_n: 0 }, 'shout', 0.4) }, props: [{ id: 'belt', k: 'belt', x: 0, y: 0, r: 0, z: 2, s: 1, at: 'A:hands' }] },
    { t: 1.0, figs: { A: STD(0, 1, { sh_n: 170, el_n: 10, sh_f: -170, el_f: -10, hip_n: 6, hip_f: -6, head: 8 }, 'shout', 0.6), B: LAY(4.2, -1, 90, { sh_n: 150, sh_f: 130, hip_n: 20, kn_n: -40 }, 'hurt', 0.2), R: STD(-3.4, 1, { sh_n: 160, el_n: 0, sh_f: -20 }, 'shout', 0.4) }, props: [{ id: 'belt', k: 'belt', x: 0, y: 0.1, r: 0, z: 2, s: 1, at: 'A:hands' }, burst('b1', 'NEW CHAMPION!', -4.6, 3.0, PAL.gold), { id: 'cf', k: 'confetti', x: 0, y: 0, r: 0, z: 2.8 }] },
  ] },
  { v: 1, id: 'promo', name: 'On the microphone', when: 'promo', set: 'ring', slots: [{ id: 'A', n: 'The talker', role: 'a' }], keys: [
    { t: 0, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -20, el_f: -30, head: 4 }, '') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] },
    { t: 0.8, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -100, el_f: -20, head: 10 }, 'shout') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] },
    { t: 1.6, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -40, el_f: -70, head: 0 }, '') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] },
  ] },
];

/* ---------- scenes in a world: made in Create a Scene in the World Editor, kept in the world package ---------- */
/** Does this look like a scene file? Anything else is refused. */
export function ok(x: any): x is Scene {
  return !!x && x.v === 1 && typeof x.id === 'string' && typeof x.name === 'string' && Array.isArray(x.slots) && Array.isArray(x.keys) && x.keys.length > 0 &&
    x.keys.every((k: any) => typeof k.t === 'number' && k.figs && typeof k.figs === 'object' && Array.isArray(k.props));
}
/** Every scene the world can play: the world's own (which take the place of a game scene with the same id), then the game's. */
export function allScenes(world: Scene[]): Scene[] { const ids = new Set(world.map(s => s.id)); return world.concat(SCENES.filter(s => !ids.has(s.id))); }
/** The scenes that can play for a moment of the broadcast. */
export function scenesFor(when: string, world: Scene[]): Scene[] { return allScenes(world).filter(s => s.when === when); }
export const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
