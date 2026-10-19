/* Create a Scene: the scene file and how it plays (docs/plans/papercraft-engine.md, sections 4 and 5).
   A scene is plain data, saved as a .scene.json file: a set (the ring, backstage, a plain card), slots for the
   people in it (A, B, the referee), and keyframes. Each keyframe says where every figure stands, how it is turned
   and posed, and which props are in the picture (a belt, a chair, a burst of words). Playing a scene slides every
   figure from one keyframe to the next. The game's own scenes are made in Create a Scene like anybody else's
   (`SCENES` below is what it saved), so a player can open them, change them and share them. Nothing here touches
   the game state. */
import { Piece, PAL, ell, rect, star, strip, drawScene, View, snip, shade } from './paper';
import { Recipe, puppet, prop, Rig, blank, REF, Marks, commentator, dress } from './puppet';
import { AttireKey, ATTIRE_OF, wear } from './caw';

/** A person at a keyframe: where the waist is, the turn, which way they face, how far forward, the pose, the face,
    their size (1 as cut) and the marks on them. */
export interface Fig { x: number; y: number; r: number; f: number; z: number; p: Record<string, number>; e?: string; s?: number; m?: Marks;
  /** Held by somebody: "A:hands", "A:shoulders", "A:chest", "A:waist" or "A:head". Then x and y are from that point
      and z is in front of (or behind) the one holding, so the two move and turn together. */
  on?: string;
  /** A limb brought in front of everything else (3) or sent behind (-3): an arm round a neck, a leg hooked behind. */
  lz?: Record<string, number> }
/** Where one person can hold another. */
export const HOLDS: [string, string][] = [['hands', 'hands'], ['shoulders', 'shoulders'], ['chest', 'chest'], ['waist', 'waist'], ['head', 'head']];
/** The limbs that can come in front or go behind, and the parts of each. */
export const LIMBS: Record<string, string> = { sh_n: 'arm_n', el_n: 'arm_n', wr_n: 'arm_n', sh_f: 'arm_f', el_f: 'arm_f', wr_f: 'arm_f', hip_n: 'leg_n', kn_n: 'leg_n', an_n: 'leg_n', hip_f: 'leg_f', kn_f: 'leg_f', an_f: 'leg_f' };
export interface Prop { id: string; k: string; x: number; y: number; r: number; z: number; s?: number; txt?: string; col?: string; at?: string }
/** The camera at a keyframe: where it looks (x, y in scene units), how close (z: 1 is the whole set, 3 is a close-up)
    and a tilt in degrees. Left out, it shows the whole set. */
export interface Cam { x: number; y: number; z: number; r?: number }
export const CAM0: Cam = { x: 0, y: 0, z: 1, r: 0 };
export interface Key { t: number; figs: Record<string, Fig>; props: Prop[]; cam?: Cam }
/** A part in a scene. `dress` puts whoever plays it in a suit and a headset (the desk); `at` is where they go when
    brought in, for a slot that starts empty (the third chair at the desk). */
export interface Slot { id: string; n: string; role: 'a' | 'b' | 'ref' | 'c'; dress?: 'suit'; at?: Fig; hook?: string }
/** The parts a slot can stand for, filled by the game from the moment (E.sceneHooks). A slot with no hook is filled by
    its role: a is whoever does it (the winner, the one covering, the one talking), b the other. A slot whose part
    nobody in the moment can play is left out of the picture. */
export const HOOKS: [string, string][] = [['', 'By the match (A or B)'], ['hero', 'The hero'], ['villain', 'The villain'], ['heel1', 'Heel group member 1'], ['heel2', 'Heel group member 2'], ['heel3', 'Heel group member 3'],
  ['ally', "The hero's partner"], ['manager', 'The manager'], ['champ', 'The champion'], ['challenger', 'The challenger'], ['winner', 'The winner'], ['loser', 'The loser'], ['talker', 'On the microphone'],
  ['attacker', 'The attacker'], ['victim', 'Who gets attacked'], ['face', 'The face of the company']];
/** `frame` is the shape of the picture: wide (16 by 9, the broadcast) for now; tall for posters and covers and square
    for portraits are next. */
export interface Scene { v: 1; id: string; name: string; when: string; set: string; slots: Slot[]; keys: Key[]; by?: string; frame?: 'wide' | 'tall' | 'square'; loop?: boolean;
  /** A still picture: one keyframe and nothing plays. Stills go beside the moments the booker answers (a matter on
      the desk, a call from the gorilla position); moving scenes go on the broadcast. Both are made in Create a Scene. */
  still?: boolean;
  /** Which outfit Create a Player wrestlers wear in it; left out, the set decides (ring gear in the ring, street clothes backstage). */
  attire?: AttireKey }

/** When the broadcast plays a scene. A scene made by a player can take any of these. */
/** What a scene is for. The match moments play on the broadcast now; the rest are where scenes go next
    (Ryan, 18 October: breaking news, talk show highlights, posters, magazine covers, portraits, everything). */
export const WHEN: [string, string][] = [['start', 'The opening bell'], ['mid', 'Back and forth'], ['nearfall', 'A near fall'], ['finish', 'The finish'], ['champion', 'A new champion'], ['promo', 'A promo'], ['attack', 'An attack'], ['entrance', 'The entrance'], ['taunt', 'A taunt'],
  ['desk1', 'The desk: play-by-play talking'], ['desk2', 'The desk: colour talking'], ['news', 'Breaking news'], ['talk', 'A talk show'], ['poster', 'A poster'], ['cover', 'A magazine cover'], ['portrait', 'A portrait'], ['any', 'Only by hand']];
/** What a still picture is for: the moments the booker has to answer (Ryan, 18 October: "one static diorama image of
    the wrestler getting hurt, backstage fight"). The desk and the broadcast pick one by what the matter is about. */
export const STILL_WHEN: [string, string][] = [['hurt', 'Somebody hurt'], ['brawl', 'A fight'], ['argue', 'Face to face'], ['meeting', 'Across your desk'],
  ['walkout', 'Walking out'], ['cheer', 'The crowd is with them'], ['title', 'Over a title'], ['press', 'The press'], ['phone', 'A call to the office (nobody in it)'], ['any', 'Only by hand']];
/** The sets, each drawn from its own angle: pick the one that suits the moment. Every set keeps feet on the same line
    (FOOT), so a pose works on all of them. */
export const SETS: [string, string][] = [['ring', 'The ring: the hard camera'], ['ringlow', 'The ring: low at ringside'], ['ringcorner', 'The ring: from the corner'],
  ['desk', 'The commentary desk'], ['ramp', 'The entrance ramp'], ['hall', 'Backstage: the hallway'], ['locker', 'Backstage: the locker room'], ['office', 'The office'], ['backstage', 'Backstage: the wall'], ['talk', 'A talk show'], ['cage', 'A steel cage'], ['lot', 'The parking lot'], ['news', 'A news desk'], ['plain', 'Plain card']];
export const W16 = 16, H9 = 9;   // a scene is 16 units wide and 9 high; x = 0 is the middle, y = 0 the middle
export const FOOT = -2.9;          // where feet stand on the mat
export const WAIST = FOOT + 2.52 + 0.7;   // the waist of a doll of standard height standing on the mat
/** Where the three chairs at the commentary desk are. */
export const DESK_SEATS = [-2.4, 0.6, 3.6];

/* ---------- the sets ---------- */
type Add = (pts: [number, number][], col: string, z: number, lift?: number, rough?: number) => void;
const SHIRTS = () => [PAL.red, PAL.black, PAL.white, PAL.blue, PAL.grey, PAL.maroon, PAL.yellow, PAL.teal];
const SKINS = ['#f3dccb', '#e8c09e', '#d5a07a', '#b07a52', '#7f5236', '#5a3a26'];
/** Rows of fans, the back rows small and dim, the front rows bigger and lit, between x0 and x1. */
function crowd(add: Add, rows: number, yTop: number, dy: number, sz0: number, dsz: number, x0: number, x1: number, seed: number, z0 = -0.9) {
  let s = seed; const r01 = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }, sh = SHIRTS();
  for (let row = 0; row < rows; row++) {
    const y = yTop - row * dy, sz = sz0 + row * dsz, n = Math.max(3, Math.round((x1 - x0) / (sz * 2.6))), k = 0.5 + row * (0.5 / rows);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.3 + r01() * 0.4) * (x1 - x0) / n;
      add(ell(x, y - sz * 1.4, sz * 1.6, sz * 1.2, 10), shade(sh[Math.floor(r01() * sh.length)], k), z0 + row * 0.04, 0.03, 0.01);
      add(ell(x, y, sz * 0.75, sz * 0.9, 10), shade(SKINS[Math.floor(r01() * SKINS.length)], k), z0 + 0.02 + row * 0.04, 0.03, 0.01);
      if (r01() < 0.07) add(ell(x + sz * 0.8, y + sz, 0.05, 0.07, 6), '#fffff2', z0 + 0.05 + row * 0.04, 0.01, 0.002);
    }
  }
}
function setPieces(set: string): Piece[] {
  const o: Piece[] = []; let n = 0; const add = (pts: [number, number][], col: string, z: number, lift = 0.04, rough = 0.012) => o.push({ pts: snip(pts, 9000 + (n++) * 131, rough, 0.1), col, z, lift, layer: 'back' });
  if (set === 'ring' || set === 'cage') {
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
  } else if (set === 'backstage') {
    add(rect(-11, -7, 22, 14), '#4a4f5c', -1, 0, 0);
    for (let i = 0; i < 6; i++) { add(rect(-7.8 + i * 1.5, -2.5, 1.3, 5.6), '#6f7a8a', -0.9, 0.05); add(rect(-7.6 + i * 1.5, 1.8, 0.9, 0.12), '#2b2f38', -0.85, 0.02); }
    add(rect(2.2, -2.6, 5.6, 4.8), '#c9b48a', -0.9, 0.06); add(rect(2.5, 1.2, 5.0, 0.7), PAL.red, -0.85, 0.03);
    add(rect(-11, -7, 22, 4.2), '#2d2f36', -0.5, 0.04);
  } else if (set === 'ringlow') {
    // Low at ringside: the camera at the apron, the crowd towering behind, the far ropes small, the near ropes and
    // posts big in front of everybody
    add(rect(-11, -7, 22, 14), PAL.navy, -1, 0, 0);
    crowd(add, 5, 4.3, 1.0, 0.3, 0.07, -11, 11, 11);
    add(rect(-11, -1.2, 22, 0.55), '#1a1a1f', -0.7, 0.03);
    for (let k = 1; k <= 3; k++) add(rect(-11, -2.75 + 0.42 * k, 22, 0.06), PAL.white, -0.5, 0.02, 0.003);   // the far ropes
    add(rect(-11, -3.3, 22, 0.55), PAL.mat, -0.45, 0.02, 0.01);                                                // the mat, edge on
  } else if (set === 'ringcorner') {
    // From the corner: the ring a diamond, the far corner post in the middle, the ropes running back to it
    const FY = -0.5, SX = 9.6, SY = -2.6;
    add(rect(-11, -7, 22, 14), PAL.navy, -1, 0, 0);
    crowd(add, 5, 3.9, 0.8, 0.2, 0.035, -11, 11, 5);
    add(rect(-11, -0.4, 22, 0.42), '#1a1a1f', -0.7, 0.03);
    add([[0, FY], [SX, SY], [0, -6.4], [-SX, SY]], PAL.mat, -0.45, 0.02, 0.012);
    add(ell(0, -2.9, 2.2, 0.75, 28), shade(PAL.blue, 1.05), -0.43, 0.01, 0.01); add(ell(0, -2.9, 1.7, 0.53, 24), PAL.mat, -0.42, 0.01, 0.008);
    add(rect(-0.13, FY, 0.26, 2.1), PAL.steel, -0.6, 0.03, 0.006);
    for (let k = 1; k <= 3; k++) add(ell(0, FY + 0.6 * k, 0.22, 0.17, 12), PAL.red, -0.55, 0.03, 0.006);
    for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) add(strip([0, FY + 0.6 * k], [sd * SX, SY + 0.72 * k], 0.07, 0.12), PAL.white, -0.5, 0.03, 0.004);
  } else if (set === 'ramp') {
    // The entrance: a ramp running back to the stage under a giant screen, fans behind barricades either side
    add(rect(-11, -7, 22, 14), '#0b0d1c', -1, 0, 0);
    crowd(add, 4, 1.6, 0.75, 0.2, 0.05, -11, -3.6, 21); crowd(add, 4, 1.6, 0.75, 0.2, 0.05, 3.6, 11, 23);
    add(rect(-5.2, 1.0, 10.4, 3.5), '#1a1f3d', -0.8, 0.05);                                       // the screen
    add(rect(-4.9, 1.25, 9.8, 3.0), PAL.blue, -0.78, 0.02, 0.006);
    add(star(0, 2.75, 1.1, 5, 0.45), PAL.yellow, -0.76, 0.02, 0.004);
    for (const sx of [-5.5, 5.5]) add(rect(sx - 0.15, -0.2, 0.3, 4.9), PAL.steel, -0.75, 0.04, 0.006);   // the trusses
    add(rect(-5.5, 4.55, 11, 0.25), PAL.steel, -0.75, 0.04, 0.006);
    add(rect(-6.2, -0.3, 12.4, 1.3), '#20223a', -0.72, 0.04);                                      // the stage
    add([[-2.4, -0.3], [2.4, -0.3], [6.2, -7], [-6.2, -7]], '#2c2e40', -0.6, 0.03, 0.01);          // the ramp
    for (let i = 0; i < 9; i++) for (const sd of [-1, 1]) { const t = i / 8, x = sd * (2.4 + 3.8 * t), y = -0.3 - 6.7 * t; add(ell(x, y, 0.05 + t * 0.08, 0.04 + t * 0.06, 8), PAL.yellow, -0.58, 0.01, 0.002); }
    for (const sd of [-1, 1]) add([[sd * 3.4, -0.4], [sd * 3.7, -0.4], [sd * 8.6, -7], [sd * 7.6, -7]], '#15161f', -0.55, 0.04, 0.008);   // the barricades
  } else if (set === 'hall') {
    // The hallway: block walls running away to a door at the far end, road cases along one side
    const vx = 0, vy = 0.6, L = -2.7, R = 2.7, T = 2.4, B = -1.1;
    add(rect(-11, -7, 22, 14), '#3c4250', -1, 0, 0);
    add([[-11, 6], [L, T], [L, B], [-11, -5.4]], '#56607a', -0.95, 0.03, 0.01);                   // the left wall
    add([[11, 6], [R, T], [R, B], [11, -5.4]], '#4d566e', -0.95, 0.03, 0.01);                     // the right wall
    add([[-11, 6], [11, 6], [R, T], [L, T]], '#2b2f3c', -0.94, 0.03, 0.01);                        // the ceiling
    add([[L, B], [R, B], [11, -5.4], [-11, -5.4]], '#7d7a72', -0.93, 0.03, 0.01);                  // the floor
    add(rect(L, B, R - L, T - B), '#6a7290', -0.92, 0.03, 0.01);                                     // the far wall
    add(rect(-0.8, B, 1.6, 2.5), '#3a2a1c', -0.9, 0.04, 0.006); add(ell(0.5, B + 1.2, 0.06, 0.06, 8), PAL.gold, -0.88, 0.01, 0.002);
    for (const t of [0.25, 0.5, 0.75]) for (const sd of [-1, 1]) {                                  // lines of blocks, running to the far end
      const x0 = sd * 11, y0 = -5.4 + 11.4 * t, x1 = sd * 2.7, y1 = B + (T - B) * t; add(strip([x0, y0], [x1, y1], 0.06, 0.02), shade('#56607a', 0.8), -0.91, 0.005, 0.003);
    }
    for (let i = 0; i < 3; i++) { const t = 0.35 + i * 0.2; add(strip([-1.8 * (1 - t) - 0.3, T + (6 - T) * t], [1.8 * (1 - t) + 0.3, T + (6 - T) * t], 0.18 * t + 0.05, 0.18 * t + 0.05), '#fff6c8', -0.9, 0.01, 0.004); }   // ceiling lights
    add([[6.0, 4.2], [9.4, 5.6], [9.4, -3.6], [6.0, -2.4]], '#2a3a2a', -0.89, 0.04, 0.006);        // a door on the right wall
    for (const [x, y, w, h] of [[-9.6, -4.4, 2.6, 2.0], [-9.2, -2.4, 1.9, 1.3], [-6.6, -3.6, 1.6, 1.4]] as [number, number, number, number][]) {   // road cases
      add(rect(x, y, w, h), '#18181c', -0.7, 0.06, 0.006); for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) add(rect(cx - 0.12, cy - 0.12, 0.24, 0.24), PAL.steel, -0.68, 0.01, 0.003);
    }
  } else if (set === 'locker') {
    // The locker room: a wall of lockers, a bench, a tiled floor
    add(rect(-11, -7, 22, 14), '#40463a', -1, 0, 0);
    for (let i = 0; i < 12; i++) { const x = -10.5 + i * 1.8;
      add(rect(x, -1.6, 1.7, 5.6), i % 2 ? '#5d6f86' : '#566a82', -0.9, 0.05, 0.006);
      for (let v = 0; v < 3; v++) add(rect(x + 0.4, 3.0 - v * 0.18, 0.9, 0.07), '#2b3442', -0.88, 0.01, 0.002);
      add(rect(x + 1.35, 1.0, 0.1, 0.45), PAL.steel, -0.88, 0.01, 0.002);
    }
    add(rect(-11, -7, 22, 5.4), '#b9b4a8', -0.8, 0.02, 0.01);
    for (let i = 0; i < 12; i++) add(rect(-11 + i * 1.9, -7, 0.05, 5.4), '#9a958a', -0.79, 0.005, 0.002);
    add(rect(-6.5, -2.2, 6.4, 0.35), PAL.wood, -0.6, 0.06, 0.006);                                  // the bench, behind whoever stands
    for (const lx of [-6.1, -0.6]) add(rect(lx, -3.0, 0.22, 0.8), shade(PAL.wood, 0.6), -0.62, 0.03, 0.004);
    add(rect(4.2, 1.2, 0.8, 1.4), PAL.white, -0.86, 0.03, 0.006); add(rect(6.0, 1.0, 0.8, 1.6), PAL.red, -0.86, 0.03, 0.006);   // towels
  } else if (set === 'desk') {
    // The commentary desk at ringside: the crowd and the ring behind, three high-backed chairs; the desk is in front
    add(rect(-11, -7, 22, 14), PAL.navy, -1, 0, 0);
    crowd(add, 4, 4.2, 0.8, 0.2, 0.035, -11, 11, 31);
    add(rect(-11, 0.5, 22, 0.35), '#1a1a1f', -0.72, 0.03);
    add(rect(-11, -0.5, 22, 1.2), PAL.red, -0.7, 0.04, 0.01); add(rect(-11, 0.55, 22, 0.15), PAL.white, -0.69, 0.02, 0.004);   // the ring apron behind them
    for (let k = 1; k <= 3; k++) add(rect(-11, 0.7 + 0.5 * k, 22, 0.07), PAL.white, -0.68, 0.02, 0.003);
    add(rect(-11, -7, 22, 6.5), '#1b1d2a', -0.6, 0.02, 0);                                            // the floor
    for (const cx of DESK_SEATS) { add(rect(cx - 0.9, -0.8, 1.8, 2.7), '#16161b', -0.4, 0.08, 0.008); add(rect(cx - 0.75, 1.6, 1.5, 0.25), '#2a2a32', -0.38, 0.02, 0.004); }
  } else if (set === 'lot') {
    // The parking lot at night: the back of the building, a lamp, a car, lines painted on the tarmac
    add(rect(-11, -7, 22, 14), '#0a0c1a', -1, 0, 0);
    add(rect(-11, -1.2, 22, 7), '#3a3036', -0.95, 0.03, 0.01); for (let i = 0; i < 6; i++) add(rect(-10 + i * 3.6, 1.6, 1.4, 1.0), i % 2 ? '#f0d878' : '#2a2a30', -0.93, 0.02, 0.004);   // the wall and its windows
    add(rect(-11, -7, 22, 5.8), '#2a2c34', -0.85, 0.02, 0.01); for (let i = 0; i < 6; i++) add([[-9 + i * 3.6, -1.3], [-8.85 + i * 3.6, -1.3], [-9.6 + i * 3.6, -7], [-9.9 + i * 3.6, -7]], '#d8d4c0', -0.84, 0.01, 0.004);   // the tarmac and its lines
    add(rect(6.8, -1.2, 0.2, 6.2), PAL.steel, -0.8, 0.04, 0.004); add([[6.0, 5.0], [7.8, 5.0], [7.4, 4.6], [6.4, 4.6]], '#1a1a1e', -0.79, 0.04, 0.004); add([[6.4, 4.6], [7.4, 4.6], [8.6, -2.0], [5.2, -2.0]], '#5a5640', -0.86, 0.01, 0.01);   // the lamp and its light
    add([[-8.6, -2.6], [-3.4, -2.6], [-3.2, -1.4], [-4.4, -1.2], [-5.4, -0.2], [-7.6, -0.2], [-8.4, -1.2], [-8.8, -1.4]], '#7a1820', -0.7, 0.06, 0.008);   // a car
    add([[-7.4, -0.4], [-5.6, -0.4], [-4.8, -1.2], [-8.0, -1.2]], '#9ab8d0', -0.68, 0.02, 0.004); for (const wx of [-7.6, -4.6]) add(ell(wx, -2.6, 0.55, 0.55, 14), '#111114', -0.66, 0.04, 0.004);
  } else if (set === 'news') {
    // A news desk: a blue backdrop with a globe, the desk in front (FRONT)
    add(rect(-11, -7, 22, 14), '#0e1a40', -1, 0, 0); add(ell(2.5, 1.8, 3.4, 3.4, 40), '#1e3a7a', -0.95, 0.03, 0.01);
    for (const r of [1, 2, 3]) add(strip([2.5 - 3.4, 1.8 + (r - 2) * 1.3], [2.5 + 3.4, 1.8 + (r - 2) * 1.3], 0.06, 0.06), '#3a5aa8', -0.94, 0.01, 0.004);
    add(rect(-11, -7, 22, 5.6), '#121426', -0.8, 0.02, 0.01);
  } else if (set === 'talk') {
    // A talk show: a curtain in folds, the show's sign over it, a low stage, two chairs either side of a little table
    add(rect(-11, -7, 22, 14), '#3a0e14', -1, 0, 0);
    for (let i = 0; i < 12; i++) add(rect(-11 + i * 1.85, -1.6, 1.0, 8.6), i % 2 ? '#7a1420' : '#8e1a28', -0.95, 0.03, 0.01);   // the curtain's folds
    add(rect(-3.6, 3.2, 7.2, 1.3), '#16182a', -0.9, 0.05, 0.006); add(rect(-3.4, 3.35, 6.8, 1.0), PAL.gold, -0.88, 0.02, 0.004);   // the sign
    o.push({ pts: [], col: '', z: -0.87, txt: { s: 'TONIGHT', x: 0, y: 3.85, size: 0.8, col: PAL.red }, layer: 'back' });
    add(rect(-11, -7, 22, 5.6), '#2a2234', -0.8, 0.02, 0.01); add(rect(-8, -2.0, 16, 0.4), '#4a3a54', -0.78, 0.03, 0.006);       // the stage
    for (const cx of [-2.6, 2.6]) { add(rect(cx - 0.9, -1.65, 1.8, 2.4), '#5a3020', -0.7, 0.06, 0.008); add(rect(cx - 1.1, -1.9, 2.2, 0.5), '#6e3a26', -0.68, 0.05, 0.006); }   // the armchairs
    add(rect(-0.45, -2.6, 0.9, 1.0), PAL.wood, -0.5, 0.05, 0.006); add(ell(0, -1.6, 0.7, 0.12, 14), shade(PAL.wood, 1.2), -0.49, 0.03, 0.004);   // the table
  } else if (set === 'office') {
    // The office: panelled walls, blinds, a belt framed on the wall, the big desk to one side
    add(rect(-11, -7, 22, 14), '#5a3d28', -1, 0, 0);
    for (let i = 0; i < 9; i++) add(rect(-11 + i * 2.5, -1.6, 0.06, 7), '#4a3020', -0.95, 0.005, 0.002);
    add(rect(-8.4, 0.6, 5.0, 3.4), '#cfe3f0', -0.9, 0.04, 0.006);                                   // the window and its blinds
    for (let i = 0; i < 9; i++) add(rect(-8.4, 0.75 + i * 0.36, 5.0, 0.16), '#e9e2cf', -0.88, 0.01, 0.003);
    add(rect(0.6, 1.2, 3.6, 2.2), '#2b1b10', -0.9, 0.05, 0.006); add(rect(0.8, 1.4, 3.2, 1.8), '#7a1418', -0.88, 0.02, 0.004);   // the frame
    add(rect(1.0, 2.15, 2.8, 0.3), PAL.black, -0.86, 0.02, 0.003); add(ell(2.4, 2.3, 0.5, 0.38, 16), PAL.gold, -0.85, 0.02, 0.003);
    add(rect(-11, -7, 22, 5.4), '#3a3f5a', -0.8, 0.02, 0.01);                                       // the carpet
    add(rect(5.0, -0.6, 2.4, 3.0), '#1a1a1f', -0.7, 0.05, 0.006);                                   // the big chair, behind the desk
  } else {
    add(rect(-11, -7, 22, 14), PAL.cream, -1, 0, 0);
    add(rect(-11, -7, 22, 4.1), shade(PAL.cream, 0.82), -0.5, 0.04);
  }
  return o;
}
const FRONT: Record<string, (o: Piece[]) => void> = {
  cage: o => {   // the ring's front, then the steel mesh of the cage in front of everybody
    FRONT.ring(o);
    for (let i = -10; i <= 10; i++) o.push({ pts: snip(rect(i * 0.95 - 0.03, -3.8, 0.06, 9.5), 900 + i, 0.004, 0.1), col: '#8a8e9a', z: 2.6, lift: 0.02 });
    for (let j = 0; j < 8; j++) o.push({ pts: snip(rect(-11, -3.6 + j * 1.15, 22, 0.06), 940 + j, 0.004, 0.1), col: '#8a8e9a', z: 2.61, lift: 0.02 });
    o.push({ pts: snip(rect(-11, 5.4, 22, 0.25), 960, 0.006, 0.1), col: PAL.steel, z: 2.62, lift: 0.04 });
  },
  news: o => {   // the news desk, its front in the show's colours
    let n = 0; const P = (pts: [number, number][], col: string, z: number) => o.push({ pts: snip(pts, 870 + (n++) * 7, 0.008, 0.1), col, z, lift: 0.06 });
    P(rect(-6, -4.8, 12, 3.4), '#1c2a5a', 2.3); P(rect(-6.2, -1.5, 12.4, 0.35), '#d8dce8', 2.35); P(rect(-6, -2.4, 12, 0.18), PAL.red, 2.36);
    o.push({ pts: [], col: '', z: 2.4, txt: { s: 'NEWS', x: 0, y: -2.95, size: 0.8, col: PAL.white } });
  },
  desk: o => {   // the announce desk: its top, a front panel in the company's colours, monitors, notes and coffee
    let n = 0; const P = (pts: [number, number][], col: string, z: number, lift = 0.06) => o.push({ pts: snip(pts, 850 + (n++) * 7, 0.008, 0.1), col, z, lift });
    P(rect(-7.2, -4.8, 14.4, 3.65), '#1f2a52', 2.3, 0.1);
    P(rect(-7.2, -2.3, 14.4, 0.35), PAL.gold, 2.35, 0.03); P(rect(-7.2, -3.9, 14.4, 0.12), PAL.red, 2.35, 0.02);
    P(rect(-7.5, -1.25, 15, 0.3), '#2b2d36', 2.4, 0.06);
    o.push({ pts: [], col: '', z: 2.42, txt: { s: 'LIVE', x: -5.2, y: -3.1, size: 0.75, col: PAL.yellow } });
    for (const mx of [-4.2, -0.9, 2.1]) { P([[mx - 0.5, -0.95], [mx + 0.5, -0.95], [mx + 0.4, -0.55], [mx - 0.4, -0.55]], '#111116', 2.45, 0.05); P(rect(mx - 0.08, -1.0, 0.16, 0.08), '#2a2a30', 2.44, 0.02); }
    P(rect(-2.9, -1.0, 0.9, 0.06), PAL.white, 2.46, 0.01); P(rect(4.6, -1.0, 0.9, 0.06), PAL.white, 2.46, 0.01);
    for (const cx of [-1.6, 1.4]) { P(rect(cx, -1.0, 0.32, 0.38), PAL.white, 2.47, 0.03); P(rect(cx + 0.06, -0.66, 0.2, 0.04), '#5a3a26', 2.48, 0.01); }
  },
  ringlow: o => {   // the near ropes and posts, big, in front of everybody; the apron below
    for (const sd of [-1, 1]) o.push({ pts: snip(rect(sd * 7.4 - 0.32, -5, 0.64, 7.6), 760 + sd, 0.01, 0.1), col: PAL.steel, z: 2.4, lift: 0.08 });
    for (let k = 0; k < 3; k++) o.push({ pts: snip(rect(-11, -2.9 + 1.25 * k, 22, 0.16), 765 + k, 0.006, 0.1), col: PAL.white, z: 2.45, lift: 0.06 });
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) o.push({ pts: snip(ell(sd * 7.4, -2.82 + 1.25 * k, 0.5, 0.4, 14), 790 + k * 3 + sd, 0.006, 0.1), col: PAL.red, z: 2.5, lift: 0.06 });
    o.push({ pts: snip(rect(-11, -7, 22, 3.75), 777, 0.015, 0.1), col: PAL.red, z: 2.55, lift: 0.08 });
    o.push({ pts: snip(rect(-11, -3.5, 22, 0.25), 778, 0.008, 0.1), col: PAL.white, z: 2.6, lift: 0.03 });
  },
  ringcorner: o => {   // the apron below the two near edges of the diamond
    o.push({ pts: snip([[-11, -2.6], [-9.6, -2.6], [0, -6.4], [9.6, -2.6], [11, -2.6], [11, -7], [-11, -7]], 777, 0.015, 0.1), col: PAL.red, z: 2.5, lift: 0.08 });
    for (const sd of [-1, 1]) for (let k = 1; k <= 3; k++) o.push({ pts: snip(strip([sd * 9.6, -2.6 + 0.72 * k], [sd * 2.5, -5.4 + 0.9 * k], 0.13, 0.18), 800 + k * 2 + sd, 0.006, 0.1), col: PAL.white, z: 2.45, lift: 0.05 });
  },
  office: o => {   // the big desk, in front of whoever stands behind it
    o.push({ pts: snip(rect(2.8, -3.9, 7.6, 2.5), 830, 0.01, 0.1), col: '#4a2c18', z: 2.3, lift: 0.08 });
    o.push({ pts: snip(rect(2.6, -1.5, 8.0, 0.3), 831, 0.008, 0.1), col: '#6b4228', z: 2.35, lift: 0.05 });
    o.push({ pts: snip(rect(5.4, -1.2, 1.6, 0.25), 832, 0.006, 0.1), col: PAL.white, z: 2.4, lift: 0.03 });
  },
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
        const h = t < 0.5 ? fa : fb, same = (fa.on || '') === (fb.on || '');   // picked up or put down: the hold changes half way
        figs[id] = { x: same ? mix(fa.x, fb.x, t) : h.x, y: same ? mix(fa.y, fb.y, t) : h.y, r: mix(fa.r, fb.r, t), f: h.f, z: same ? mix(fa.z, fb.z, t) : h.z, p, e: h.e, s: mix(fa.s || 1, fb.s || 1, t), m: h.m, on: h.on, lz: h.lz };
      }
      const props = a.props.map(pa => { const pb = b.props.find(x => x.id === pa.id); return pb ? { ...pa, x: mix(pa.x, pb.x, t), y: mix(pa.y, pb.y, t), r: mix(pa.r, pb.r, t) } : pa; });
      const ca = a.cam || CAM0, cb = b.cam || CAM0, cam = { x: mix(ca.x, cb.x, t), y: mix(ca.y, cb.y, t), z: mix(ca.z, cb.z, t), r: mix(ca.r || 0, cb.r || 0, t) };
      return { t: time, figs, props, cam };
    }
  }
  return ks[ks.length - 1];
}

/** Everything in the picture at a moment, as pieces, with each figure's joints (for dragging) and anchors (for props). */
export function build(sc: Scene, k: Key, cast: Record<string, Recipe>, time = 0): { pieces: Piece[]; rigs: Record<string, Rig>; hold: Record<string, string> } {
  const pieces = setPieces(sc.set), rigs: Record<string, Rig> = {}, hold: Record<string, string> = {};
  // whoever is held is cut after whoever holds them, at the point they are held by
  const order = sc.slots.map((sl, i) => ({ sl, i })), deep = (id: string, n = 0): number => { const f = k.figs[id], h = f && f.on ? f.on.split(':')[0] : ''; return h && n < 4 && k.figs[h] ? 1 + deep(h, n + 1) : 0; };
  order.sort((a, b) => deep(a.sl.id) - deep(b.sl.id));
  order.forEach(({ sl, i }) => {
    let f = k.figs[sl.id]; if (!f) return;
    if (f.on) {
      const [hw, anc] = f.on.split(':'), hr = rigs[hw], q = hr && (hr.anchors[anc] || hr.anchors.hands), hf = k.figs[hw];
      if (q && hf) { f = { ...f, x: q[0] + f.x, y: q[1] + f.y, z: hf.z + f.z }; hold[sl.id] = hold[hw] || hw; }
    }
    const di = sc.slots.filter(x => x.dress === 'suit').indexOf(sl), c = cast[sl.id];
    const c0 = c && c.kits ? wear(c, sc.attire || ATTIRE_OF[sc.set] || 'primary_ring') : c;   // a Create a Player wrestler dresses for the set
    const r = c0 ? (sl.dress === 'suit' ? dress(c0, di) : c0) : sl.role === 'ref' ? REF : sl.dress === 'suit' ? commentator(di) : blank(i);
    rigs[sl.id] = puppet(r, { x: f.x, y: f.y, r: f.r, f: f.f, z: f.z, s: f.s, lz: f.lz }, f.p, f.e || '', sl.id, pieces, f.m || {});
    // a soft shadow on the floor where they stand or lie
    const rg = rigs[sl.id], lying = Math.abs(Math.sin(f.r * Math.PI / 180)) > 0.6, sz = f.s || 1;
    if (lying) { const c = rg.anchors.waist; pieces.push({ pts: ell(c[0], FOOT + 0.3, 2.0 * sz, 0.32, 20), col: 'rgba(0,0,0,0.32)', z: f.z - 0.05, soft: true }); }
    else for (const ft of ['foot_n', 'foot_f']) { const c = rg.anchors[ft]; if (c && c[1] < FOOT + 1.2) pieces.push({ pts: ell(c[0] + 0.12, Math.min(c[1], FOOT + 0.1) - 0.08, 0.5 * sz, 0.13, 16), col: 'rgba(0,0,0,0.35)', z: f.z - 0.05, soft: true }); }
  });
  for (const p of k.props) {
    let x = p.x, y = p.y;
    if (p.at) { const [who, anc] = p.at.split(':'), rg = rigs[who], q = rg && rg.anchors[anc]; if (q) { x = q[0] + p.x; y = q[1] + p.y; } }
    prop({ ...p, x, y }, pieces, time);
  }
  if (FRONT[sc.set]) { const f: Piece[] = []; FRONT[sc.set](f); f.forEach(p => { p.layer = 'front'; }); pieces.push(...f); }
  return { pieces, rigs, hold };
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
  const b = build(sc, k, cast, time); tilt(ctx, k.cam); drawScene(ctx, b.pieces, v, sc.set); ctx.restore(); return { ...b, v };
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
  ['seated', { n: 'Seated at a desk', p: { hip_n: 90, kn_n: -90, an_n: 0, hip_f: 85, kn_f: -90, an_f: 0, sh_n: 30, el_n: 80, sh_f: 30, el_f: 75 }, y: -0.75 }],
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
const SLAMCAM: Cam = { x: 0, y: 0.9, z: 0.85 }, SLEEPCAM: Cam = { x: 0.8, y: -0.7, z: 1.2 };
const COVER_A = { sh_n: -120, el_n: -30, sh_f: -60, el_f: -40, kn_n: -10, kn_f: -20, an_n: -30, an_f: -30, head: 25 };

/** A canned entrance on the ramp: who comes out walks toward the camera through a few poses. Wrestlers pick one in
    Create a Player (their `entrance`); the show picks for anybody who has not. */
function ent(id: string, name: string, ks: [number, Record<string, number>, string, number][]): Scene {
  return { v: 1, id, name, when: 'entrance', set: 'ramp', slots: [{ id: 'A', n: 'Who comes out', role: 'a' }], keys: ks.map(([t, p, e, x]) => ({ t, figs: { A: STD(x, 1, p, e, 0.6) }, props: [] })) };
}
/** The commentary desk: two in suits and headsets, the one with the line talking (the mouth moving, a hand going),
    the other listening and turning to them, and the third chair open for a guest. It loops while the line is on. */
function deskScene(id: string, name: string, when: string, talker: string): Scene {
  const SEAT = { hip_n: 90, kn_n: -90, hip_f: 85, kn_f: -90 }, Y = -0.75;
  const seat = (x: number, f: number, p: Record<string, number>, e = ''): Fig => ({ x, y: Y, r: 0, f, z: 0, p: { ...SEAT, ...p }, e });
  const talk = (t: number, open: boolean, arm: number, head: number): Key => {
    const tk = (who: string) => who === talker, side = (who: string) => who === 'C1' ? 1 : -1, x = (who: string) => who === 'C1' ? DESK_SEATS[0] : DESK_SEATS[1];
    const fig = (who: string): Fig => tk(who) ? seat(x(who), side(who), { sh_n: arm, el_n: 75, wr_n: 10, sh_f: 30, el_f: 75, head }, open ? 'talk' : '') : seat(x(who), side(who), { sh_n: 30, el_n: 80, sh_f: 30, el_f: 75, head: 8 }, '');
    return { t, figs: { C1: fig('C1'), C2: fig('C2') }, props: [], cam: { x: -0.9, y: 0.7, z: 1.15 } };
  };
  return { v: 1, id, name, when, set: 'desk', loop: true,
    slots: [{ id: 'C1', n: 'Play-by-play', role: 'c', dress: 'suit' }, { id: 'C2', n: 'Colour', role: 'c', dress: 'suit' }, { id: 'C3', n: 'A guest', role: 'c', dress: 'suit', at: { x: DESK_SEATS[2], y: Y, r: 0, f: -1, z: 0, p: { ...SEAT, sh_n: 30, el_n: 80, sh_f: 30, el_f: 75 } } }],
    keys: [talk(0, true, 100, 4), talk(0.3, false, 112, -2), talk(0.6, true, 92, 6), talk(0.9, false, 118, 0), talk(1.2, true, 104, 3)] };
}

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
  { v: 1, id: 'slam', name: 'Up and down: a slam', when: 'mid', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { A: STD(-1.4, 1, { torso: -12, sh_n: 80, el_n: 40, sh_f: 70, el_f: 40, hip_n: 25, kn_n: -40, hip_f: -15, kn_f: -30 }, 'shout'), B: STD(0.8, -1, { torso: -45, head: -15, sh_n: 30, el_n: 40, sh_f: 20, el_f: 50, hip_n: 10, kn_n: -20 }, 'pain', 0.6), R: STD(-5, 1, { sh_n: 30, el_n: 40 }, '', -0.3) }, props: [], cam: SLAMCAM },
    { t: 0.8, figs: { A: STD(-1.2, 1, { sh_n: 165, el_n: 20, sh_f: -160, el_f: -20, hip_n: 25, kn_n: -40, hip_f: -15, kn_f: -30, head: 10 }, 'roar'), B: { x: 0, y: 0.1, r: 90, f: -1, z: 0.6, p: { head: -10, sh_n: 120, el_n: 30, sh_f: 100, el_f: 40, hip_n: 20, kn_n: -40, hip_f: -10, kn_f: -20 }, e: 'shout', on: 'A:hands' }, R: STD(-5, 1, { sh_n: 60, el_n: 30, sh_f: 30 }, 'shout', -0.3) }, props: [], cam: SLAMCAM },
    { t: 1.5, figs: { A: STD(-1.4, 1, { torso: -30, sh_n: 60, el_n: 20, sh_f: 50, el_f: 20, hip_n: 25, kn_n: -40, hip_f: -15, kn_f: -30 }, 'shout'), B: LAY(1.2, -1, 90, { ...COVER_B, sh_n: 170, sh_f: 150 }, 'pain', 0.6), R: STD(-5, 1, { sh_n: 100, el_n: 0 }, 'shout', -0.3) }, props: [burst('b1', 'SLAM!', 2.2, 2.6)], cam: SLAMCAM },
  ] },
  { v: 1, id: 'sleeper', name: 'The sleeper hold', when: 'mid', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { B: { x: 0.4, y: -2.2, r: 0, f: 1, z: 0.6, p: { torso: 0, head: -4, hip_n: 90, kn_n: -20, an_n: -20, hip_f: 85, kn_f: -30, an_f: -20, sh_n: 70, el_n: 90, sh_f: 60, el_f: 100 }, e: 'pain' },
      A: { x: -1.0, y: -1.33, r: 0, f: 1, z: 0, p: { ...KN, torso: -14, head: -6, sh_n: 42, el_n: 118, wr_n: 30, sh_f: 60, el_f: 70 }, e: 'snarl', lz: { arm_n: 3 } }, R: REFKN(4.4, -1, { sh_n: 60, el_n: 40 }) }, props: [], cam: SLEEPCAM },
    { t: 0.9, figs: { B: { x: 0.4, y: -2.2, r: 0, f: 1, z: 0.6, p: { torso: 6, head: 14, hip_n: 90, kn_n: -20, an_n: -20, hip_f: 85, kn_f: -30, an_f: -20, sh_n: 15, el_n: 20, sh_f: 5, el_f: 15 }, e: 'shut' },
      A: { x: -1.0, y: -1.33, r: 0, f: 1, z: 0, p: { ...KN, torso: -16, head: -10, sh_n: 44, el_n: 122, wr_n: 30, sh_f: 62, el_f: 75 }, e: 'snarl', lz: { arm_n: 3 } }, R: REFKN(3.4, -1, { sh_n: 90, el_n: 10 }) }, props: [burst('b1', 'ASK HIM!', 3.6, 1.8)], cam: SLEEPCAM },
  ] },
  { v: 1, id: 'carry', name: 'Over the shoulders', when: 'mid', set: 'ring', slots: AB, keys: [
    { t: 0, figs: { A: STD(-1.6, 1, { sh_n: 100, el_n: 70, sh_f: -60, el_f: -40, hip_n: 15, kn_n: -20, hip_f: -10, kn_f: -10 }, 'shout'), B: { x: -1.0, y: 0.3, r: -90, f: 1, z: -0.3, p: { head: -20, sh_n: 80, el_n: 10, sh_f: 95, el_f: 10, hip_n: 10, kn_n: 60, hip_f: 15, kn_f: 50 }, e: 'hurt', on: 'A:shoulders' }, R: STD(4.4, -1, { sh_n: 40, el_n: 30 }, '', -0.3) }, props: [] },
    { t: 0.9, figs: { A: STD(0.2, 1, { sh_n: 100, el_n: 70, sh_f: -60, el_f: -40, hip_n: -15, kn_n: -10, hip_f: 15, kn_f: -25 }, 'roar'), B: { x: -1.0, y: 0.3, r: -90, f: 1, z: -0.3, p: { head: -30, sh_n: 95, el_n: 10, sh_f: 105, el_f: 10, hip_n: 10, kn_n: 70, hip_f: 15, kn_f: 60 }, e: 'hurt', on: 'A:shoulders' }, R: STD(4.4, -1, { sh_n: 80, el_n: 10 }, 'shout', -0.3) }, props: [] },
  ] },
  { v: 1, id: 'beatdown', name: 'The beat-down', when: 'attack', set: 'ring', slots: [{ id: 'H', n: 'The hero', role: 'b', hook: 'hero' }, { id: 'V', n: 'The villain', role: 'a', hook: 'villain' }, { id: 'G1', n: 'Heel group member 1', role: 'c', hook: 'heel1' }, { id: 'G2', n: 'Heel group member 2', role: 'c', hook: 'heel2' }], keys: [
    { t: 0, figs: { H: { x: -0.2, y: -1.33, r: 0, f: 1, z: 0.5, p: { ...KN, torso: 20, head: 18, sh_n: 40, el_n: 90, sh_f: 30, el_f: 100 }, e: 'hurt' },
      G1: STD(-3.0, 1, { torso: -8, hip_n: 70, kn_n: -60, an_n: 10, hip_f: -8, sh_n: 50, el_n: 60, sh_f: -40, el_f: -50 }, 'snarl', 0), G2: STD(2.4, -1, { torso: -12, sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 4, hip_n: 10, hip_f: -10 }, 'shout', 0.1),
      V: STD(5.0, -1, { sh_n: 25, el_n: 100, sh_f: 20, el_f: 105, hip_n: 25, kn_n: -10, hip_f: -25 }, 'smirk', 1.1) }, props: [] },
    { t: 0.8, figs: { H: { x: -0.2, y: -1.33, r: 0, f: 1, z: 0.5, p: { ...KN, torso: 28, head: 25, sh_n: 40, el_n: 95, sh_f: 30, el_f: 100 }, e: 'pain' },
      G1: STD(-2.6, 1, { torso: -4, hip_n: 30, kn_n: -10, an_n: 0, hip_f: -8, sh_n: 40, el_n: 60, sh_f: -40, el_f: -50 }, 'roar', 0), G2: STD(2.2, -1, { torso: -12, sh_n: 120, el_n: 10, sh_f: -20, el_f: -10, head: 6, hip_n: 10, hip_f: -10 }, 'roar', 0.1),
      V: STD(2.6, -1, { torso: -10, sh_n: -40, el_n: 100, sh_f: 40, el_f: 90, hip_n: 18, kn_n: -14, hip_f: -14 }, 'snarl', 1.1) }, props: [] },
    { t: 1.4, figs: { H: { x: -0.4, y: -1.33, r: 14, f: 1, z: 0.5, p: { ...KN, torso: 40, head: 35, sh_n: 120, el_n: 30, sh_f: -60, el_f: -20 }, e: 'pain', m: { blood: 1 } },
      G1: STD(-2.6, 1, { torso: -10, sh_n: 160, el_n: 10, sh_f: -150, el_f: -10, hip_n: 6, hip_f: -6 }, 'roar', 0), G2: STD(2.2, -1, { torso: -10, sh_n: 160, el_n: 10, sh_f: -20, el_f: -10, head: 8 }, 'roar', 0.1),
      V: { ...STD(1.5, -1, { torso: -20, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90, hip_n: 30, kn_n: -20, hip_f: -24, kn_f: -10 }, 'shout', 1.1), r: -10 } }, props: [burst('b1', 'POW!', -0.6, 2.4)] },
  ] },
  ent('entrance', 'Arms up at the top of the ramp', [
    [0, { hip_n: 18, kn_n: -10, hip_f: -14, kn_f: -12, sh_n: -20, el_n: 10, sh_f: 20, el_f: 10, head: 4 }, '', 0],
    [0.9, { hip_n: -12, kn_n: -14, hip_f: 16, kn_f: -8, sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 6 }, 'smirk', 0.3],
    [1.8, { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 10, hip_n: 6, hip_f: -6 }, 'roar', 0.5]]),
  ent('ent_point', 'Points out at the crowd', [
    [0, { hip_n: 16, kn_n: -10, hip_f: -14, kn_f: -10, sh_n: -15, sh_f: 15, head: 2 }, '', 0],
    [0.8, { sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 4, hip_n: -10, hip_f: 12 }, 'shout', 0.3],
    [1.6, { sh_n: 110, el_n: 5, sh_f: 60, el_f: 30, head: 8 }, 'shout', 0.4]]),
  ent('ent_flex', 'Stops and flexes', [
    [0, { hip_n: 16, kn_n: -10, hip_f: -14, kn_f: -10, sh_n: -15, sh_f: 15 }, '', 0],
    [0.9, { sh_n: 90, el_n: 115, sh_f: -90, el_f: -115, hip_n: 10, hip_f: -10 }, 'roar', 0.2],
    [1.7, { sh_n: 60, el_n: 130, sh_f: -60, el_f: -130, torso: -6, hip_n: 12, hip_f: -12 }, 'roar', 0.2]]),
  ent('ent_stare', 'A slow, cold walk', [
    [0, { torso: -6, head: -18, hip_n: 10, kn_n: -6, hip_f: -8, sh_n: 5, sh_f: -5 }, 'shut', 0],
    [1.0, { torso: -4, head: -10, hip_n: -8, hip_f: 10, kn_f: -8, sh_n: -5, sh_f: 5 }, '', 0.25],
    [2.0, { head: 6, sh_n: 5, sh_f: -5 }, 'snarl', 0.45]]),
  ent('ent_taunt', 'Taunts the crowd', [
    [0, { hip_n: 14, kn_n: -10, hip_f: -12, sh_n: 30, el_n: 90, sh_f: 20, el_f: 95 }, 'smirk', 0],
    [0.8, { sh_n: 150, el_n: 120, sh_f: -20, el_f: -30, head: 10 }, 'smirk', 0.3],
    [1.6, { torso: 8, sh_n: 80, el_n: 60, sh_f: -80, el_f: -60, head: 12 }, 'snarl', 0.4]]),
  ...[  // taunts: whoever is on top plays to the building, the other down on the mat. Wrestlers pick up to three in Create a Wrestler.
    ['taunt_crowd', 'Plays to the crowd', [[0, { sh_n: 100, el_n: 20, sh_f: -100, el_f: -20, head: 6 }, 'smirk'], [0.8, { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 12 }, 'roar']]],
    ['taunt_point', 'Points down at them', [[0, { sh_n: 40, el_n: 30, sh_f: -10, head: -4 }, 'snarl'], [0.7, { torso: 10, sh_n: 75, el_n: 0, sh_f: -20, el_f: -20, head: -10 }, 'shout']]],
    ['taunt_flex', 'Flexes over them', [[0, { sh_n: 60, el_n: 90, sh_f: -60, el_f: -90 }, ''], [0.8, { sh_n: 90, el_n: 120, sh_f: -90, el_f: -120, hip_n: 10, hip_f: -10 }, 'roar']]],
    ['taunt_call', 'Calls for the finish', [[0, { sh_n: 160, el_n: 30, sh_f: -10, head: 8 }, 'shout'], [0.5, { sh_n: 150, el_n: -25, sh_f: -10, head: 10 }, 'shout'], [1.0, { sh_n: 165, el_n: 30, sh_f: -10, head: 8 }, 'roar']]],
    ['taunt_mock', 'A foot on their chest', [[0, { sh_n: 40, el_n: 125, wr_n: 10, sh_f: 45, el_f: 120, hip_n: 20, kn_n: -20 }, 'smirk'], [0.8, { sh_n: 40, el_n: 125, wr_n: 10, sh_f: 45, el_f: 120, hip_n: 55, kn_n: -70, an_n: 20, head: -12 }, 'smirk']]],
  ].map(([id, name, ks]) => ({ v: 1 as const, id: id as string, name: name as string, when: 'taunt', set: 'ring', slots: [{ id: 'A', n: 'Who taunts', role: 'a' as const }, { id: 'B', n: 'Who is down', role: 'b' as const }, { id: 'R', n: 'The referee', role: 'ref' as const }],
    keys: (ks as [number, Record<string, number>, string][]).map(([t, p, e]) => ({ t, figs: { A: STD(id === 'taunt_mock' ? 0.2 : -0.9, 1, p, e, 0.6), B: LAY(id === 'taunt_mock' ? 1.9 : 1.8, -1, 90, { sh_n: 150, sh_f: 130, hip_n: 20, kn_n: -40 }, 'hurt', 0.2), R: STD(-4.6, 1, { sh_n: 20, el_n: 40 }, '', -0.3) }, props: [] })) } as Scene)),
  deskScene('desk1', 'At the desk: the call', 'desk1', 'C1'),
  deskScene('desk2', 'At the desk: the colour', 'desk2', 'C2'),
  { v: 1, id: 'promo', name: 'On the microphone', when: 'promo', set: 'ring', slots: [{ id: 'A', n: 'The talker', role: 'a' }], keys: [
    { t: 0, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -20, el_f: -30, head: 4 }, '') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] },
    { t: 0.8, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -100, el_f: -20, head: 10 }, 'shout') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] },
    { t: 1.6, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -40, el_f: -70, head: 0 }, '') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] },
  ] },
];

/* ---------- the stills: one picture each, for the moments the booker answers ---------- */
/** A still: one keyframe. `cap` is a headline the game can write over (a call to the office with nobody in it). */
function still(id: string, name: string, when: string, set: string, slots: Slot[], figs: Record<string, Fig>, props: Prop[] = [], cam?: Cam): Scene {
  return { v: 1, id, name, when, set, slots, still: true, keys: [{ t: 0, figs, props, cam }] };
}
const S1: Slot[] = [{ id: 'A', n: 'Who it is about', role: 'a' }], S2: Slot[] = [{ id: 'A', n: 'Who it is about', role: 'a' }, { id: 'B', n: 'The other one', role: 'b' }];
const CROSS = { sh_n: 40, el_n: 125, wr_n: 10, sh_f: 45, el_f: 120 };   // arms folded
const cap = (txt: string, y = 3.0): Prop => ({ id: 'cap', k: 'headline', x: 0, y, r: 0, z: 3, s: 1, txt, col: PAL.yellow });
export const STILLS: Scene[] = [
  still('st_hurt_ring', 'Down in the ring', 'hurt', 'ring', [...S1, { id: 'R', n: 'The referee', role: 'ref' }], {
    A: LAY(-0.8, 1, 90, { head: 14, sh_n: 70, el_n: 95, sh_f: 55, el_f: 110, hip_n: 55, kn_n: -110, an_n: 30, hip_f: 8, kn_f: -10 }, 'pain', 0.4),
    R: REFKN(1.6, -1, { torso: -10, sh_n: 165, el_n: 20, sh_f: 40, el_f: 60, head: 10 }) }, [], { x: 0.2, y: -1.4, z: 1.6 }),
  still('st_hurt_back', 'In the trainer’s room', 'hurt', 'locker', S1, {
    A: { x: -3.2, y: -1.45, r: 0, f: 1, z: 0.3, p: { torso: 18, head: 22, hip_n: 90, kn_n: -90, hip_f: 85, kn_f: -95, sh_n: -10, el_n: 20, sh_f: 70, el_f: 120, wr_f: 20 }, e: 'pain' } }, [], { x: -2.2, y: -0.5, z: 1.35 }),
  still('st_brawl_hall', 'A fight in the hallway', 'brawl', 'hall', S2, {
    A: { ...STD(-1.2, 1, { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90, hip_n: 30, kn_n: -20, hip_f: -24, kn_f: -10 }, 'roar', 0.6), r: -10 },
    B: { ...STD(1.5, -1, { torso: -22, head: -24, sh_n: 80, el_n: 40, sh_f: -60, el_f: 30, hip_n: -10, kn_n: -20, hip_f: -24, kn_f: -20 }, 'hurt', 0.8), r: -14 } },
    [{ id: 'b1', k: 'burst', x: 2.6, y: 2.4, r: 0, z: 3, s: 1, txt: 'BRAWL!', col: PAL.red }]),
  still('st_brawl_lock', 'Pulled apart in the locker room', 'brawl', 'locker', S2, {
    A: { ...STD(-1.0, 1, { torso: 14, head: -6, sh_n: 105, el_n: 25, sh_f: 70, el_f: 50, hip_n: 30, kn_n: -30, an_n: 4, hip_f: -26, kn_f: -14 }, 'roar', 0.5), r: -14 },
    B: { ...STD(0.9, -1, { torso: 12, head: -4, sh_n: 100, el_n: 35, sh_f: 65, el_f: 55, hip_n: 26, kn_n: -26, hip_f: -24, kn_f: -14 }, 'snarl', 0.7), r: 12 } }),
  still('st_argue', 'Nose to nose', 'argue', 'backstage', S2, {
    A: STD(-1.1, 1, { torso: 6, head: 4, sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, hip_n: 10, hip_f: -8 }, 'shout', 0.4),
    B: STD(1.1, -1, { ...CROSS, head: -4 }, 'snarl', 0.6) }, [], { x: 0, y: 0.6, z: 1.25 }),
  still('st_argue_lock', 'Words in the locker room', 'argue', 'locker', S2, {
    A: STD(-1.3, 1, { sh_n: 30, el_n: 90, sh_f: 25, el_f: 95, head: 2 }, 'talk', 0.4),
    B: STD(1.3, -1, { torso: -6, sh_n: 120, el_n: 30, sh_f: -30, el_f: -40, head: 6 }, 'shout', 0.6) }),
  still('st_alone', 'Alone with it', 'argue', 'locker', S1, {
    A: { x: -2.6, y: -1.45, r: 0, f: 1, z: 0.3, p: { torso: 30, head: 30, hip_n: 90, kn_n: -90, hip_f: 85, kn_f: -95, sh_n: 50, el_n: 100, sh_f: 40, el_f: 110 }, e: 'snarl' } }, [], { x: -2.0, y: -0.4, z: 1.35 }),
  still('st_meet', 'Across your desk', 'meeting', 'office', S1, {
    A: STD(-0.6, 1, { ...CROSS, head: 2 }, 'talk', 0.6) }, [], { x: 0.6, y: 0.2, z: 1.2 }),
  still('st_meet_two', 'Two at your door', 'meeting', 'office', S2, {
    A: STD(-1.8, 1, { sh_n: 95, el_n: 5, sh_f: -15, el_f: -10 }, 'shout', 0.5), B: STD(0.6, 1, CROSS, 'snarl', 0.3) }, [], { x: 0.4, y: 0.2, z: 1.15 }),
  still('st_walkout', 'Out the door', 'walkout', 'hall', S1, {
    A: STD(1.6, 1, { torso: -4, head: -16, hip_n: -14, kn_n: -10, hip_f: 18, kn_f: -16, sh_n: 20, el_n: 10, sh_f: -25, el_f: 15 }, 'snarl', 0.8) }, [], { x: 1.0, y: 0.4, z: 1.2 }),
  still('st_cheer', 'The crowd on its feet', 'cheer', 'ringlow', S1, {
    A: STD(-0.4, 1, { sh_n: 165, el_n: 5, sh_f: -20, el_f: -20, head: 10, hip_n: 6, hip_f: -6 }, 'roar', 0.5) }, [], { x: 0, y: 0.9, z: 1.0 }),
  still('st_title', 'Eyes on the belt', 'title', 'ring', S2, {
    A: STD(-1.4, 1, { sh_n: 60, el_n: 120, sh_f: 30, el_f: 90, head: 4 }, 'smirk', 0.5),
    B: STD(1.4, -1, { sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 4 }, 'shout', 0.7) },
    [{ id: 'belt', k: 'belt', x: 0.2, y: 0.1, r: 70, z: 1, s: 0.8, at: 'A:shoulders' }], { x: 0, y: -0.2, z: 1.7 }),
  still('st_title_one', 'Holding the belt', 'title', 'ring', S1, {
    A: STD(-0.2, 1, { sh_n: 160, el_n: 10, sh_f: -150, el_f: -10, head: 8 }, 'shout', 0.5) },
    [{ id: 'belt', k: 'belt', x: 0, y: 0.1, r: 0, z: 2, s: 1, at: 'A:hands' }], { x: 0, y: 0.2, z: 1.5 }),
  still('st_press', 'In front of the press', 'press', 'backstage', S1, {
    A: STD(-0.4, 1, { sh_n: 150, el_n: 120, sh_f: -40, el_f: -70, head: 4 }, 'talk', 0.5) },
    [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }], { x: 0, y: 0.6, z: 1.25 }),
  still('st_phone', 'The office phone', 'phone', 'office', [], {}, [cap('THE OFFICE')]),
];

/* ---------- a new scene starts from a setup: the set and the people placed for it ---------- */
export const SETUPS: [string, string][] = [['ring', 'The ring: two wrestlers and the referee'], ['desk', 'The commentary desk, its chairs and a guest seat'], ['ramp', 'The entrance ramp'],
  ['hall', 'Backstage: two in the hallway'], ['locker', 'The locker room'], ['office', 'The office, across the desk'], ['talk', 'A talk show: a host and a guest'], ['cage', 'A steel cage: two wrestlers inside'], ['lot', 'The parking lot'], ['news', 'A news desk: the anchor'], ['plain', 'Plain card']];
export function setupScene(id: string): Scene {
  const base = (set: string, slots: Slot[], figs: Record<string, Fig>, cam?: Cam): Scene => ({ v: 1, id: 'scene-' + Date.now().toString(36), name: 'My scene', when: 'any', set, slots, keys: [{ t: 0, figs, props: [], cam }] });
  const SEAT = { hip_n: 90, kn_n: -90, hip_f: 85, kn_f: -90, sh_n: 30, el_n: 80, sh_f: 30, el_f: 75 };
  if (id === 'desk') { const d = deskScene('x', 'My scene', 'any', 'C1'); return { ...d, id: 'scene-' + Date.now().toString(36), loop: false, keys: [d.keys[0]] }; }
  if (id === 'ramp') return base('ramp', [{ id: 'A', n: 'Wrestler A', role: 'a' }], { A: STD(0, 1, {}, '', 0.6) });
  if (id === 'hall' || id === 'locker') return base(id, [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }], { A: STD(-1.5, 1, {}, '', 0.4), B: STD(1.5, -1, {}, '', 0.6) });
  if (id === 'office') return base('office', [{ id: 'A', n: 'Wrestler A', role: 'a' }], { A: STD(-0.8, 1, {}, 'talk', 0.6) }, { x: 0.6, y: 0.2, z: 1.2 });
  if (id === 'talk') return base('talk', [{ id: 'A', n: 'The host', role: 'c', dress: 'suit' }, { id: 'B', n: 'The guest', role: 'a' }],
    { A: { x: -2.6, y: -0.85, r: 0, f: 1, z: 0, p: SEAT, e: 'talk' }, B: { x: 2.6, y: -0.85, r: 0, f: -1, z: 0, p: SEAT, e: '' } }, { x: 0, y: 0, z: 1.25 });
  if (id === 'cage') return base('cage', [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }], { A: STD(-2.0, 1, {}, '', 0), B: STD(2.0, -1, {}, '', 1.2) });
  if (id === 'lot') return base('lot', [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }], { A: STD(0.6, 1, {}, '', 0.4), B: STD(3.4, -1, {}, '', 0.6) });
  if (id === 'news') return base('news', [{ id: 'A', n: 'The anchor', role: 'c', dress: 'suit' }], { A: { x: -1.2, y: -0.75, r: 0, f: 1, z: 0, p: SEAT, e: 'talk' } }, { x: -0.4, y: 0.1, z: 1.15 });
  if (id === 'plain') return base('plain', [{ id: 'A', n: 'Wrestler A', role: 'a' }], { A: STD(0, 1, {}, '', 0.6) });
  return base('ring', [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }, { id: 'R', n: 'The referee', role: 'ref' }],
    { A: STD(-2.2, 1, {}, '', 0), B: STD(2.2, -1, {}, '', 1.2), R: STD(-5.4, 1, {}, '', -0.3) });
}

/* ---------- an entrance dressed with its pyro and lights (Create a Wrestler, Entrance tab) ---------- */
export const PYRO: [string, string][] = [['', 'None'], ['sparks', 'A shower of sparks'], ['fountains', 'Fountains either side'], ['flash', 'A flash and a bang'], ['fire', 'Columns of fire']];
export const LIGHTS: [string, string][] = [['', 'The arena lights'], ['spot', 'A spotlight on them'], ['dark', 'Lights down, a spotlight'], ['red', 'Red light'], ['blue', 'Blue light'], ['green', 'Green light'], ['strobe', 'Strobes']];
/** The entrance scene with their pyro and lights added: lights from the first moment, pyro from the second on (the
    moment they hit their mark). Nothing else in the scene changes. */
export function dressEntrance(sc: Scene, fx?: { pyro?: string; lights?: string }): Scene {
  if (!fx || (!fx.pyro && !fx.lights)) return sc;
  const o = copy(sc), L = fx.lights || '', P = fx.pyro || '', A = o.keys[0] && o.keys[0].figs.A;
  const x0 = A ? A.x : 0;
  o.keys.forEach((k, i) => {
    const lx = (k.figs.A || A || { x: x0 }).x, add = (q: Prop) => k.props.push(q);
    if (L === 'dark') add({ id: 'fx_dim', k: 'dim', x: 0, y: 0, r: 0, z: -0.45 });
    if (L === 'spot' || L === 'dark') add({ id: 'fx_spot', k: 'spot', x: lx, y: FOOT, r: 0, z: -0.3 });
    if (L === 'red' || L === 'blue' || L === 'green') add({ id: 'fx_beams', k: 'beams', x: lx, y: FOOT, r: 0, z: -0.3, col: L === 'red' ? PAL.red : L === 'blue' ? '#3a6ad8' : '#3aa84a' });
    if (L === 'strobe') add({ id: 'fx_strobe', k: 'strobe', x: 0, y: 0, r: 0, z: -0.3 });
    if (i === 0 && o.keys.length > 1) return;
    if (P === 'sparks') add({ id: 'fx_sparks', k: 'sparks', x: 0, y: 0, r: 0, z: 2.2 });
    if (P === 'fountains' || P === 'fire') for (const sd of [-1, 1]) add({ id: 'fx_py' + sd, k: P === 'fire' ? 'fire' : 'fountain', x: sd * 3.4, y: -0.3, r: 0, z: -0.25 });
    if (P === 'flash') add({ id: 'fx_flash', k: 'flash', x: lx, y: 0.6, r: 0, z: -0.35 });
  });
  return o;
}

/* ---------- scenes in a world: made in Create a Scene in the World Editor, kept in the world package ---------- */
/** Does this look like a scene file? Anything else is refused. */
export function ok(x: any): x is Scene {
  return !!x && x.v === 1 && typeof x.id === 'string' && typeof x.name === 'string' && Array.isArray(x.slots) && Array.isArray(x.keys) && x.keys.length > 0 &&
    x.keys.every((k: any) => typeof k.t === 'number' && k.figs && typeof k.figs === 'object' && Array.isArray(k.props));
}
/** Every scene the world can play: the world's own (which take the place of a game scene with the same id), then the game's. */
export function allScenes(world: Scene[]): Scene[] { const ids = new Set(world.map(s => s.id)); return world.concat(SCENES.concat(STILLS).filter(s => !ids.has(s.id))); }
/** The scenes that can play for a moment of the broadcast. */
export function scenesFor(when: string, world: Scene[]): Scene[] { return allScenes(world).filter(s => s.when === when); }
export const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));
