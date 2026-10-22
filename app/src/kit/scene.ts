/* Create a Scene: the scene file and how it plays (docs/plans/papercraft-engine.md, sections 4 and 5).
   A scene is plain data, saved as a .scene.json file: a set (the ring, backstage, a plain card), slots for the
   people in it (A, B, the referee), and keyframes. Each keyframe says where every figure stands, how it is turned
   and posed, and which props are in the picture (a belt, a chair, a burst of words). Playing a scene slides every
   figure from one keyframe to the next. The game's own scenes are made in Create a Scene like anybody else's
   (`SCENES` below is what it saved), so a player can open them, change them and share them. Nothing here touches
   the game state. */
import type { BeltData } from './beltcols';
import { bgPieces, isBg, backdropOf, setKey } from './backdrop';
import { Piece, PAL, ell, rect, star, strip, drawScene, View, snip, shade } from './paper';
import { Recipe, puppet, prop, Rig, blank, REF, Marks, commentator, dress, refDress } from './puppet';
import { AttireKey, ATTIRE_OF, wear } from './caw';

/** A person at a keyframe: where the waist is, the turn, which way they face, how far forward, the pose, the face,
    their size (1 as cut) and the marks on them. */
export interface Fig { x: number; y: number; r: number; f: number; z: number; p: Record<string, number>; e?: string; s?: number; m?: Marks;
  /** Seen from behind: the back of the head and the gear, and lettering made for the back. */
  b?: boolean;
  /** Held by somebody: "A:hands", "A:shoulders", "A:chest", "A:waist" or "A:head". Then x and y are from that point
      and z is in front of (or behind) the one holding, so the two move and turn together. */
  on?: string;
  /** A limb brought in front of everything else (3) or sent behind (-3): an arm round a neck, a leg hooked behind. */
  lz?: Record<string, number>;
  /** Parts of the body left out of the picture (Ryan, 19 October), by joint: head, torso, sh_n (the near upper arm),
      el_n (forearm), wr_n (hand), hip_n (thigh), kn_n (shin), an_n (foot), and the same for the far side. */
  hide?: string[];
  /** The height of what they stand on, in feet above the mat (Ryan, 19 October: top rope moves, turnbuckles, dives
      to the outside): 0 the mat or the apron, -3 the floor outside, 3.4 the second rope, 4.9 the top turnbuckle. The
      pose's own height is added to it, so a person kneels the same way on the mat or on the top rope. */
  lv?: number }
/** Places in and around the ring a person can be put on (x, depth in layer units, the height of the surface, which way
    they face). Depth: the model's feet divided by 0.9; near is toward the hard camera. */
export const SPOTS: [string, string, number, number, number, number][] = [
  ['mat', 'The middle of the ring', 0, 0, 0, 1], ['apron', 'On the apron', 10.9, 0, 0, -1], ['outside', 'The floor outside', 12.6, 0, -3, -1],
  ['tb_fr', 'Top turnbuckle, far right', 9.5, -10.6, 4.9, -1], ['tb_fl', 'Top turnbuckle, far left', -9.5, -10.6, 4.9, 1],
  ['tb_nr', 'Top turnbuckle, near right', 9.5, 10.6, 4.9, -1], ['tb_nl', 'Top turnbuckle, near left', -9.5, 10.6, 4.9, 1],
  ['second', 'Second rope, far right', 9.0, -10.0, 3.2, -1], ['corner', 'In the far right corner', 8.9, -9.9, 0, -1], ['air', 'In the air over the ring', 0, 0, 5, 1]];
/** The parts of a body that can be hidden, grouped as Create a Scene shows them. */
export const BODY_PARTS: [string, [string, string][]][] = [
  ['Head and body', [['head', 'Head'], ['torso', 'Body']]],
  ['Near arm', [['sh_n', 'Upper arm'], ['el_n', 'Forearm'], ['wr_n', 'Hand']]], ['Far arm', [['sh_f', 'Upper arm'], ['el_f', 'Forearm'], ['wr_f', 'Hand']]],
  ['Near leg', [['hip_n', 'Thigh'], ['kn_n', 'Shin'], ['an_n', 'Foot']]], ['Far leg', [['hip_f', 'Thigh'], ['kn_f', 'Shin'], ['an_f', 'Foot']]]];
/** Where one person can hold another. */
export const HOLDS: [string, string][] = [['hands', 'hands'], ['shoulders', 'shoulders'], ['chest', 'chest'], ['waist', 'waist'], ['head', 'head']];
/** The limbs that can come in front or go behind, and the parts of each. */
export const LIMBS: Record<string, string> = { sh_n: 'arm_n', el_n: 'arm_n', wr_n: 'arm_n', sh_f: 'arm_f', el_f: 'arm_f', wr_f: 'arm_f', hip_n: 'leg_n', kn_n: 'leg_n', an_n: 'leg_n', hip_f: 'leg_f', kn_f: 'leg_f', an_f: 'leg_f' };
/** bl: the design of the belt a belt prop shows (a title's own, src/89-belts.js), filled in when a scene is cast. */
export interface Prop { id: string; k: string; x: number; y: number; r: number; z: number; s?: number; txt?: string; col?: string; at?: string; bl?: BeltData }
/** The camera at a keyframe: where it looks (x, y in scene units), how close (z: 1 is the whole set, 3 is a close-up)
    and a tilt in degrees. Left out, it shows the whole set. */
export interface Cam { x: number; y: number; z: number; r?: number }
export const CAM0: Cam = { x: 0, y: 0, z: 1, r: 0 };
/** A camera in the 3D model (Ryan, 19 October: "move the camera in scenes"): where it stands and what it looks at,
    in the model's feet (the mat at height 0), and the lens (degrees of view: 18 a long lens, 30 normal, 45 wide).
    A keyframe with one is shot from there; between two keyframes the camera glides from one to the other. */
export interface Cam3 { p: [number, number, number]; t: [number, number, number]; fov?: number }
/** Words on the picture for a keyframe (Ryan, 19 October): a subtitle, a lower third that names somebody, a title
    card, or a line somebody says. It shows from its keyframe until the next. */
export interface Caption { t: string; s?: 'sub' | 'third' | 'title' | 'quote'; who?: string }
export const CAP_STYLES: [string, string][] = [['sub', 'Subtitle at the bottom'], ['third', 'Lower third: a name and a line'], ['title', 'Title card in the middle'], ['quote', 'A line somebody says']];
export interface Key { t: number; figs: Record<string, Fig>; props: Prop[]; cam?: Cam; cam3?: Cam3; cap?: Caption;
  /** How the camera reaches this keyframe (Ryan, 19 October: "lock them in per key and camera can float to the next
      angle or reset"): left out it glides from the last shot to this one; 'cut' jumps to it; and for a keyframe with no
      shot of its own, 'home' goes back to the set's camera, otherwise the last shot is held. */
  cm?: 'cut' | 'home';
  /** How the scene moves into this keyframe from the one before: smoothly (left out), evenly, speeding up, slowing down, or a cut. */
  ease?: 'even' | 'in' | 'out' | 'cut' }
/** The ways into a keyframe, as Create a Scene lists them. */
export const EASES: [string, string][] = [['', 'Smoothly'], ['even', 'Evenly'], ['in', 'Speeding up'], ['out', 'Slowing down'], ['cut', 'In a cut']];
/** A part in a scene. `dress` puts whoever plays it in a suit and a headset (the desk); `at` is where they go when
    brought in, for a slot that starts empty (the third chair at the desk). */
export interface Slot { id: string; n: string; role: 'a' | 'b' | 'ref' | 'c'; dress?: 'suit'; at?: Fig; hook?: string }
/** The parts a slot can stand for, filled by the game from the moment (E.sceneHooks). A slot with no hook is filled by
    its role: a is whoever does it (the winner, the one covering, the one talking), b the other. A slot whose part
    nobody in the moment can play is left out of the picture. */
export const HOOKS: [string, string][] = [['', 'By the match (A or B)'], ['hero', 'The hero'], ['villain', 'The villain'], ['heel1', 'Heel group member 1'], ['heel2', 'Heel group member 2'], ['heel3', 'Heel group member 3'],
  ['ally', "The hero's partner"], ['manager', 'The manager'], ['champ', 'The champion'], ['challenger', 'The challenger'], ['winner', 'The winner'], ['loser', 'The loser'], ['talker', 'On the microphone'],
  ['attacker', 'The attacker'], ['victim', 'Who gets attacked'], ['face', 'The face of the company'],
  ['authority', 'The authority figure'], ['interviewer', 'The interviewer'], ['referee', 'The referee (a person)']];
/** `frame` is the shape of the picture: wide (16 by 9, the broadcast) for now; tall for posters and covers and square
    for portraits are next. */
export interface Scene { v: 1; id: string; name: string; when: string; set: string; slots: Slot[]; keys: Key[]; by?: string; frame?: 'wide' | 'tall' | 'square'; loop?: boolean;
  /** A still picture: one keyframe and nothing plays. Stills go beside the moments the booker answers (a matter on
      the desk, a call from the gorilla position); moving scenes go on the broadcast. Both are made in Create a Scene. */
  still?: boolean;
  /** Which outfit Create a Player wrestlers wear in it; left out, the set decides (ring gear in the ring, street clothes backstage). */
  attire?: AttireKey;
  /** How the picture is presented (Ryan, 19 October): scan lines, an old television tube and black and white, all off
      unless a scene asks. For artistic promos and old-school companies; the game's own scenes use none. */
  fx?: { scan?: boolean; crt?: boolean; mono?: boolean } }
/** The shapes a picture can take (Ryan, 18 October): wide for the broadcast, tall for posters and covers, square for portraits. */
export const FRAMES: ['wide' | 'tall' | 'square', string][] = [['wide', 'Wide (the broadcast)'], ['tall', 'Tall (a poster or a cover)'], ['square', 'Square (a portrait)']];
/** Width over height of a scene's picture. */
export function aspectOf(sc: Scene): number { return sc.frame === 'tall' ? 3 / 4 : sc.frame === 'square' ? 1 : 16 / 9; }
/** A tall or square picture fills its height and cuts the sides of the set. */
export function cropOf(sc: Scene): boolean { return sc.frame === 'tall' || sc.frame === 'square'; }
/** The biggest picture of this shape that fits a box, in whole pixels. */
export function fitIn(bw: number, bh: number, a: number, min = 0): [number, number] { const w = Math.max(min, Math.floor(Math.min(bw, bh * a))); return [w, Math.round(w / a)]; }
/** The presentation filters a scene can pick, in the order Create a Scene lists them. */
export const SCENE_FX: ['scan' | 'crt' | 'mono', string][] = [['scan', 'Scan lines'], ['crt', 'Old TV tube'], ['mono', 'Black and white']];
/** The classes that draw a scene's filters (app/styles/scene.css), or '' when it has none. */
export function fxClass(sc: Scene): string { const f = sc.fx || {}; return SCENE_FX.filter(([k]) => f[k]).map(([k]) => ' fx-' + k).join(''); }

/** When the broadcast plays a scene. A scene made by a player can take any of these. */
/** What a scene is for. The match moments play on the broadcast now; the rest are where scenes go next
    (Ryan, 18 October: breaking news, talk show highlights, posters, magazine covers, portraits, everything). */
export const WHEN: [string, string][] = [['start', 'The opening bell'], ['mid', 'Back and forth'], ['nearfall', 'A near fall'], ['finish', 'The finish'], ['champion', 'A new champion'], ['promo', 'A promo'], ['attack', 'An attack'], ['entrance', 'The entrance'], ['taunt', 'A taunt'], ['tag', 'A tag team match'], ['finish_sub', 'The finish: a tap-out'], ['finish_flash', 'The finish: a roll-up'], ['finish_cheap', 'The finish: a cheap win'], ['finish_dq', 'The finish: a disqualification'],
  ['desk1', 'The desk: play-by-play talking'], ['desk2', 'The desk: colour talking'], ['news', 'Breaking news'], ['talk', 'A talk show'], ['poster', 'A poster'], ['cover', 'A magazine cover'], ['portrait', 'A portrait'], ['any', 'Only by hand']];
/** What a still picture is for: the moments the booker has to answer (Ryan, 18 October: "one static diorama image of
    the wrestler getting hurt, backstage fight"). The desk and the broadcast pick one by what the matter is about. */
export const STILL_WHEN: [string, string][] = [['hurt', 'Somebody hurt'], ['brawl', 'A fight'], ['argue', 'Face to face'], ['meeting', 'Across your desk'],
  ['walkout', 'Walking out'], ['cheer', 'The crowd is with them'], ['title', 'Over a title'], ['press', 'The press'], ['phone', 'A call to the office (nobody in it)'], ['any', 'Only by hand']];
/** The sets, each drawn from its own angle: pick the one that suits the moment. Every set keeps feet on the same line
    (FOOT), so a pose works on all of them. */
export const SETS: [string, string][] = [['ring', 'The ring: the hard camera'], ['ringlow', 'The ring: low at ringside'], ['ringcorner', 'The ring: from the corner'],
  ['desk', 'The commentary desk'], ['ramp', 'The entrance ramp'], ['hall', 'Backstage: the hallway'], ['locker', 'Backstage: the locker room'], ['office', 'The office'], ['backstage', 'Backstage: the wall'], ['talk', 'A talk show'], ['cage', 'A steel cage'], ['ladder', 'A ladder match: the belt hung over the ring'], ['cell', 'The cell: a roof of steel over ring and floor'], ['inferno', 'An inferno: flames round the ring'], ['ringside', 'Ringside: down on the floor'], ['ballroom', 'A ballroom show'], ['gym', 'A gym show'], ['bigstadium', 'A stadium show'], ['catering', 'Backstage: catering'], ['trainer', 'Backstage: the trainer\'s room'], ['weights', 'Backstage: the weight room'], ['lot', 'The parking lot'], ['news', 'A news desk'], ['stadium', 'A packed stadium'], ['rafters', 'Up in the rafters'],  ['plain', 'Plain card']];
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
  if (isBg(set)) return bgPieces(backdropOf(set.slice(3)));   // a backdrop made in the Backdrop tab
  const o: Piece[] = []; let n = 0; const add = (pts: [number, number][], col: string, z: number, lift = 0.04, rough = 0.012) => o.push({ pts: snip(pts, 9000 + (n++) * 131, rough, 0.1), col, z, lift, layer: 'back' });
  if (['ringside', 'cell', 'inferno', 'ladder', 'ballroom', 'gym', 'bigstadium'].includes(set)) set = 'ring';
  if (['catering', 'trainer', 'weights'].includes(set)) set = 'locker';   // drawn flat, these are a room backstage   // drawn flat, these are the ring
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
  } else if (set === 'stadium') {
    // A packed stadium at night: the sky, floodlight towers, a bowl of fans rising far away, the ring under the lights
    add(rect(-11, -7, 22, 14), '#070a22', -1, 0, 0);
    for (let i = 0; i < 40; i++) add(ell(-10.5 + ((i * 7919) % 2100) / 100, 3.4 + ((i * 104729) % 300) / 100, 0.03, 0.03, 6), '#f2f2e0', -0.99, 0, 0.001);   // stars
    for (const sx of [-1, 1]) { add(rect(sx * 9.4 - 0.12, 0.5, 0.24, 4.4), PAL.steel, -0.97, 0.02, 0.004); add(rect(sx * 9.4 - 0.9, 4.6, 1.8, 0.7), '#2a2a30', -0.965, 0.02, 0.004);
      for (let j = 0; j < 4; j++) add(ell(sx * 9.4 - 0.6 + j * 0.4, 4.95, 0.15, 0.2, 8), '#fff6d0', -0.96, 0.01, 0.002);
      add([[sx * 9.4 - 0.9, 4.6], [sx * 9.4 + 0.9, 4.6], [sx * 2, -0.4], [sx * 5, -0.4]], '#1b1f3e', -0.955, 0, 0.004); }   // a floodlight tower each side and its beam
    crowd(add, 9, 2.6, 0.38, 0.09, 0.012, -10.8, 10.8, 31, -0.94);   // the bowl, row on row, small with distance
    add(rect(-11, -1.0, 22, 0.5), '#1a1d2e', -0.86, 0.02, 0.006);   // the barricade around the floor
    add(rect(-11, -7, 22, 6.0), '#2a3a2a', -0.88, 0.01, 0.01);   // the field
    add([[-6.6, -1.3], [6.6, -1.3], [8.6, -5.4], [-8.6, -5.4]], '#e9e6dc', -0.8, 0.03, 0.01); add([[-8.6, -5.4], [8.6, -5.4], [8.6, -6.2], [-8.6, -6.2]], '#2d3166', -0.79, 0.03, 0.006);   // the mat and the apron
    for (const [k, c] of [[0.9, '#c2342b'], [1.6, '#f3f1ea'], [2.3, '#2d3166']] as [number, string][]) add(rect(-6.6, -1.3 + k, 13.2, 0.12), c, -0.74, 0.02, 0.003);   // the far ropes
    for (const sx of [-6.6, 6.6]) add(rect(sx - 0.15, -1.3, 0.3, 2.8), PAL.steel, -0.73, 0.03, 0.004);
  } else if (set === 'rafters') {
    // Up in the rafters: steel trusses in the dark, hanging lights, a catwalk to stand on, the arena glowing far below
    add(rect(-11, -7, 22, 14), '#06070f', -1, 0, 0);
    add(ell(0, -1.6, 9, 1.3, 30), '#3a2c1a', -0.98, 0, 0.01); crowd(add, 3, -1.0, 0.25, 0.05, 0.006, -8, 8, 77, -0.975);   // the lit arena far below
    for (let i = -5; i <= 5; i++) { add(strip([i * 2.2, 5], [i * 2.2 + 2.2, 2.2], 0.08, 0.08), '#3a3d4a', -0.95, 0.01, 0.004); add(strip([i * 2.2, 2.2], [i * 2.2 + 2.2, 5], 0.08, 0.08), '#3a3d4a', -0.95, 0.01, 0.004); }   // the truss, crossed
    for (const y of [5, 2.2]) add(rect(-11, y - 0.12, 22, 0.24), '#4a4e5c', -0.94, 0.02, 0.004);
    for (const x of [-6, -1.5, 3, 7.5]) { add(rect(x - 0.03, 0.9, 0.06, 1.3), '#2a2a30', -0.93, 0.01, 0.002); add([[x - 0.35, 0.9], [x + 0.35, 0.9], [x + 0.25, 0.4], [x - 0.25, 0.4]], '#1a1a1e', -0.92, 0.02, 0.003); add(ell(x, 0.4, 0.22, 0.08, 10), '#fff6d0', -0.915, 0.01, 0.002); }   // hanging lights
    add(rect(-11, -7, 22, 4.4), '#2a2c34', -0.85, 0.02, 0.006); for (let i = 0; i < 22; i++) add(rect(-11 + i, -7, 0.04, 4.4), '#1a1c22', -0.84, 0.005, 0.002);   // the catwalk grating
    add(rect(-11, -0.9, 22, 0.1), PAL.steel, -0.83, 0.02, 0.003); add(rect(-11, -1.9, 22, 0.08), PAL.steel, -0.83, 0.02, 0.003); for (let i = 0; i < 12; i++) add(rect(-10.5 + i * 1.9, -2.6, 0.08, 1.8), PAL.steel, -0.83, 0.02, 0.003);   // the rail
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
const ease = (t: number, k?: string) => k === 'even' ? t : k === 'in' ? t * t : k === 'out' ? 1 - (1 - t) * (1 - t) : k === 'cut' ? 0 : t * t * (3 - 2 * t);   // a cut holds the last picture, then jumps
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export function lastT(sc: Scene) { return sc.keys.length ? sc.keys[sc.keys.length - 1].t : 0; }
/** The ways the camera reaches a keyframe, as Create a Scene lists them. */
export const CAM_MOVES: [string, string][] = [['', 'Glides from the last shot'], ['cut', 'Cuts straight to it'], ['home', 'Goes back to the set camera']];
/** The shot a keyframe is seen from: its own, or the last one held, or none (the set's own camera). */
export function camAt(sc: Scene, i: number): Cam3 | undefined {
  let c: Cam3 | undefined; for (let j = 0; j <= i && j < sc.keys.length; j++) { const k = sc.keys[j]; if (k.cam3) c = k.cam3; else if (k.cm === 'home' || (!j && !k.cam3)) c = undefined; } return c;
}
/** The caption on the picture at `time` seconds: the one on the last keyframe reached. */
export function captionAt(sc: Scene, time: number): Caption | null {
  let c: Caption | null = null; for (const k of sc.keys) { if (k.t <= time + 0.0001) c = k.cap && k.cap.t ? k.cap : null; else break; } return c;
}
/** The figures and props at `time` seconds: between two keyframes everything slides; props appear with their keyframe. */
export function at(sc: Scene, time: number): Key {
  const ks = sc.keys; if (!ks.length) return { t: 0, figs: {}, props: [] };
  if (time <= ks[0].t) return ks[0];

  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i], b = ks[i + 1];
    if (time < b.t) {
      const u = (time - a.t) / Math.max(0.001, b.t - a.t), t = ease(u, b.ease), figs: Record<string, Fig> = {};
      // fluid motion (Ryan, 20 October): with no ease of its own a move flows through its keyframes on a curve instead of
      // stopping at each one; a joint that turns back at a keyframe still settles there (its tangent is flat)
      const k0 = ks[i - 1], k3 = ks[i + 2], flow = !b.ease, dt = b.t - a.t;
      const herm = (va: number, vb: number, v0: number | undefined, v3: number | undefined) => {
        if (!flow) return mix(va, vb, t);
        const tan = (prev: number | undefined, here: number, next: number, span: number) => { if (prev == null) return 0; const d1 = here - prev, d2 = next - here; return d1 * d2 <= 0 ? 0 : (next - prev) / span * dt; };
        const m1 = k0 ? tan(v0, va, vb, b.t - k0.t) : 0, m2 = k3 ? tan(va, vb, v3 == null ? vb : v3, k3.t - a.t) : 0;
        const u2 = u * u, u3 = u2 * u;
        return (2 * u3 - 3 * u2 + 1) * va + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * vb + (u3 - u2) * m2;
      };
      for (const id in a.figs) {
        const fa = a.figs[id], fb = b.figs[id]; if (!fb) { figs[id] = fa; continue; }
        const f0 = k0 && k0.figs[id] && (k0.figs[id].on || '') === (fa.on || '') ? k0.figs[id] : undefined, f3 = k3 && k3.figs[id] && (k3.figs[id].on || '') === (fb.on || '') ? k3.figs[id] : undefined;
        const p: Record<string, number> = {}; for (const k of new Set([...Object.keys(fa.p), ...Object.keys(fb.p)])) p[k] = herm(fa.p[k] || 0, fb.p[k] || 0, f0 ? f0.p[k] || 0 : undefined, f3 ? f3.p[k] || 0 : undefined);
        const h = t < 0.5 ? fa : fb, same = (fa.on || '') === (fb.on || '');   // picked up or put down: the hold changes half way
        const ch = (k: 'x' | 'y' | 'z' | 'r') => herm(fa[k], fb[k], f0 ? f0[k] : undefined, f3 ? f3[k] : undefined);
        figs[id] = { x: same ? ch('x') : h.x, y: same ? ch('y') : h.y, r: ch('r'), f: h.f, z: same ? ch('z') : h.z, p, e: h.e, s: mix(fa.s || 1, fb.s || 1, t), m: h.m, on: h.on, lz: h.lz, b: h.b, hide: h.hide, lv: same ? mix(fa.lv || 0, fb.lv || 0, t) : h.lv };
      }
      const props = a.props.map(pa => { const pb = b.props.find(x => x.id === pa.id); return pb ? { ...pa, x: mix(pa.x, pb.x, t), y: mix(pa.y, pb.y, t), r: mix(pa.r, pb.r, t) } : pa; });
      const ca = a.cam || CAM0, cb = b.cam || CAM0, cam = { x: mix(ca.x, cb.x, t), y: mix(ca.y, cb.y, t), z: mix(ca.z, cb.z, t), r: mix(ca.r || 0, cb.r || 0, t) };
      // the camera: each keyframe's shot (its own, the one held, or the set's), gliding unless it cuts or goes home
      const ca3 = camAt(sc, i), cb3 = camAt(sc, i + 1), raw = (time - a.t) / Math.max(0.001, b.t - a.t), tc = ease(raw, b.ease === 'cut' ? 'even' : b.ease);
      const c3 = ca3 && cb3 && b.cm !== 'cut' ? { p: [0, 1, 2].map(n => mix(ca3.p[n], cb3.p[n], tc)) as [number, number, number], t: [0, 1, 2].map(n => mix(ca3.t[n], cb3.t[n], tc)) as [number, number, number], fov: mix(ca3.fov || 30, cb3.fov || 30, tc) } : ca3;
      return { t: time, figs, props, cam, cam3: c3, cap: a.cap };
    }
  }
  const L = ks[ks.length - 1]; return L.cam3 ? L : { ...L, cam3: camAt(sc, ks.length - 1) };
}

/** Everything in the picture at a moment, as pieces, with each figure's joints (for dragging) and anchors (for props). */
export function build(sc: Scene, k: Key, cast: Record<string, Recipe>, time = 0): { pieces: Piece[]; rigs: Record<string, Rig>; hold: Record<string, string> } {
  const pieces = setPieces(sc.set), rigs: Record<string, Rig> = {}, hold: Record<string, string> = {};
  // whoever is held is cut after whoever holds them, at the point they are held by
  const order = sc.slots.map((sl, i) => ({ sl, i })), deep = (id: string, n = 0): number => { const f = k.figs[id], h = f && f.on ? f.on.split(':')[0] : ''; return h && n < 4 && k.figs[h] ? 1 + deep(h, n + 1) : 0; };
  order.sort((a, b) => deep(a.sl.id) - deep(b.sl.id));
  order.forEach(({ sl, i }) => {
    let f = k.figs[sl.id]; if (!f) return;
    if (f.lv && !f.on) f = { ...f, y: f.y + f.lv };
    if (f.on) {
      const [hw, anc] = f.on.split(':'), hr = rigs[hw], q = hr && (hr.anchors[anc] || hr.anchors.hands), hf = k.figs[hw];
      if (q && hf) { f = { ...f, x: q[0] + f.x, y: q[1] + f.y, z: hf.z + f.z }; hold[sl.id] = hold[hw] || hw; }
    }
    const di = sc.slots.filter(x => x.dress === 'suit').indexOf(sl), c = cast[sl.id];
    const c0 = c && c.kits ? wear(c, sc.attire || ATTIRE_OF[sc.set] || 'primary_ring') : c;   // a Create a Player wrestler dresses for the set
    const r = c0 ? (sl.dress === 'suit' ? dress(c0, di) : sl.role === 'ref' ? refDress(c0) : c0) : sl.role === 'ref' ? REF : sl.dress === 'suit' ? commentator(di) : blank(i);
    const n0 = pieces.length;
    rigs[sl.id] = puppet(r, { x: f.x, y: f.y, r: f.r, f: f.f, z: f.z, s: f.s, lz: f.lz, b: f.b }, f.p, f.e || '', sl.id, pieces, f.m || {});
    if (f.hide && f.hide.length) { const hid = f.hide, keep = pieces.slice(n0).filter(q => !(q.joint && hid.indexOf(q.joint) >= 0)); pieces.length = n0; pieces.push(...keep); }
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
export function viewFor(w: number, h: number, cam?: Cam, crop = false): View {
  const c = cam || CAM0, s = (crop ? Math.max : Math.min)(w / W16, h / H9) * Math.max(0.8, c.z);   // a tall or square picture is cut from the middle of the set
  return { s, ox: w / 2 - c.x * s, oy: h / 2 + c.y * s };
}
/** Tilt the canvas round its middle for the camera's tilt; call before drawing, and ctx.restore() after. */
export function tilt(ctx: CanvasRenderingContext2D, cam?: Cam) {
  ctx.save(); const r = cam && cam.r ? cam.r * Math.PI / 180 : 0; if (!r) return;
  const w = ctx.canvas.width, h = ctx.canvas.height; ctx.translate(w / 2, h / 2); ctx.rotate(-r); ctx.scale(1 + Math.abs(Math.sin(r)) * 0.9, 1 + Math.abs(Math.sin(r)) * 0.9); ctx.translate(-w / 2, -h / 2);
}
export function paint(ctx: CanvasRenderingContext2D, sc: Scene, time: number, cast: Record<string, Recipe>) {
  const c = ctx.canvas, k = at(sc, time), v = viewFor(c.width, c.height, k.cam, cropOf(sc));
  ctx.fillStyle = PAL.navy; ctx.fillRect(0, 0, c.width, c.height);
  const b = build(sc, k, cast, time); tilt(ctx, k.cam); drawScene(ctx, b.pieces, v, setKey(sc.set)); ctx.restore(); return { ...b, v };
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
  ['crouch', { n: 'Crouched on the top rope', p: { torso: 35, head: -15, hip_n: 75, kn_n: -120, an_n: 45, hip_f: 65, kn_f: -115, an_f: 45, sh_n: 35, el_n: 45, sh_f: 25, el_f: 45 }, y: -1.75, e: 'roar' }],
  ['leap', { n: 'Leaping, arms spread', p: { sh_n: 125, el_n: 5, sh_f: -125, el_f: -5, head: 12, hip_n: -15, kn_n: -35, hip_f: 12, kn_f: -45 }, e: 'shout' }],
  ['dive', { n: 'Diving head first', p: { sh_n: 175, el_n: 0, sh_f: -175, el_f: 0, head: -12, hip_n: -6, hip_f: 6 }, r: -80, e: 'shout' }],
  ['splash', { n: 'A splash, flat in the air', p: { sh_n: 100, el_n: 0, sh_f: -100, el_f: 0, hip_n: 12, hip_f: -12 }, r: -90, e: 'shout' }],
  ['moonsault', { n: 'A backflip (moonsault)', p: { sh_n: 160, el_n: 10, sh_f: 150, el_f: 10, hip_n: 60, kn_n: -70, hip_f: 50, kn_f: -70, head: -20 }, r: 150, e: 'shout' }],
  ['elbow', { n: 'An elbow drop', p: { sh_n: 100, el_n: 140, sh_f: -30, el_f: -20, hip_n: 40, kn_n: -60, hip_f: 10 }, r: -60, e: 'roar' }],
  ['corner', { n: 'Slumped in the corner', p: { torso: -15, head: -25, sh_n: 115, el_n: 10, sh_f: -115, el_f: -10, hip_n: 20, kn_n: -30, hip_f: -10, kn_f: -30 }, e: 'hurt' }],
  ['charge', { n: 'Charging', p: { torso: 25, head: -10, sh_n: 60, el_n: 70, sh_f: -40, el_f: 60, hip_n: 45, kn_n: -40, hip_f: -30, kn_f: -50 }, r: -15, e: 'roar' }],
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
function ent(id: string, name: string, ks: ([number, Record<string, number>, string, number] | [number, Record<string, number>, string, number, number])[]): Scene {
  return { v: 1, id, name, when: 'entrance', set: 'ramp', slots: [{ id: 'A', n: 'Who comes out', role: 'a' }], keys: ks.map(([t, p, e, x, y]) => ({ t, figs: { A: { ...STD(x, 1, p, e, 0.6), ...(y != null ? { y: WAIST + y } : {}) } }, props: [] })) };
}
/** The commentary desk: two in suits and headsets, the one with the line talking (the mouth moving, a hand going),
    the other listening and turning to them, and the third chair open for a guest. It loops while the line is on. */
function deskScene(id: string, name: string, when: string, talker: string): Scene {
  const SEAT = { hip_n: 90, kn_n: -90, hip_f: 85, kn_f: -90 }, Y = -0.75;
  const seat = (x: number, f: number, p: Record<string, number>, e = ''): Fig => ({ x, y: Y, r: 0, f, z: 0, p: { ...SEAT, ...p }, e });
  const talk = (t: number, open: boolean, arm: number, head: number): Key => {
    const tk = (who: string) => who === talker, side = (who: string) => who === 'C1' ? 1 : -1, x = (who: string) => who === 'C1' ? DESK_SEATS[0] : DESK_SEATS[1];
    const fig = (who: string): Fig => tk(who) ? seat(x(who), side(who), { sh_n: arm, el_n: 75, wr_n: 10, sh_f: 30, el_f: 75, head }, open ? 'talk' : '') : seat(x(who), side(who), { sh_n: 30, el_n: 80, sh_f: 30, el_f: 75, head: 8 }, '');
    const figs: Record<string, Fig> = { C1: fig('C1'), C2: fig('C2') };
    if (talker === 'C3') figs.C3 = seat(DESK_SEATS[2], -1, { sh_n: arm, el_n: 75, wr_n: 10, sh_f: 30, el_f: 75, head }, open ? 'talk' : '');   // a guest in the third chair, talking
    return { t, figs, props: [], cam: talker === 'C3' ? { x: 0.6, y: 0.7, z: 1.15 } : { x: -0.9, y: 0.7, z: 1.15 } };
  };
  return { v: 1, id, name, when, set: 'desk', loop: true,
    slots: [{ id: 'C1', n: 'Play-by-play', role: 'c', dress: 'suit' }, { id: 'C2', n: 'Colour', role: 'c', dress: 'suit' }, { id: 'C3', n: 'A guest', role: 'c', dress: 'suit', at: { x: DESK_SEATS[2], y: Y, r: 0, f: -1, z: 0, p: { ...SEAT, sh_n: 30, el_n: 80, sh_f: 30, el_f: 75 } } }],
    keys: [talk(0, true, 100, 4), talk(0.3, false, 112, -2), talk(0.6, true, 92, 6), talk(0.9, false, 118, 0), talk(1.2, true, 104, 3)] };
}

/** Every stock scene moves in at least four keyframes (Ryan, 20 October): one with two or three is given the old
    animators' flourishes, worked out from its own keys. A wind-up against the first move, and at the end a beat that
    goes a touch too far and settles back. Positions are kept where they were, so nobody slides through the ropes;
    a person held by somebody else is left as they are. Stills and loops are left alone. */
export function flourish(sc: Scene): Scene {
  const ks = sc.keys; if (sc.still || sc.loop || ks.length < 2 || ks.length >= 4) return sc;
  const past = (from: Key, to: Key, k: number): Record<string, Fig> => {
    const out: Record<string, Fig> = {};
    for (const id in to.figs) {
      const fb = to.figs[id], fa = from.figs[id]; if (!fa || fb.on || fa.on) { out[id] = fb; continue; }
      const p: Record<string, number> = {}; for (const j of new Set([...Object.keys(fa.p), ...Object.keys(fb.p)])) p[j] = Math.round(((fb.p[j] || 0) + k * ((fb.p[j] || 0) - (fa.p[j] || 0))) * 10) / 10;
      out[id] = { ...fb, p, r: Math.round((fb.r + k * (fb.r - fa.r)) * 10) / 10 };
    }
    return out;
  };
  const WIND = 0.3, SETTLE = 0.35, a = ks[0], L = ks[ks.length - 1], P = ks[ks.length - 2];
  const wind: Key = { t: a.t + WIND, figs: past(ks[1], a, 0.25), props: a.props, cam: a.cam, ease: 'out' };
  const mid = ks.slice(1, -1).map(k => ({ ...k, t: k.t + WIND }));
  const over: Key = { ...L, t: L.t + WIND, figs: past(P, L, 0.15) };
  const settle: Key = { ...L, t: L.t + WIND + SETTLE, ease: 'out' }; delete settle.cm;
  return { ...sc, keys: [a, wind, ...mid, over, settle] };
}

/** The stock scenes, each with its flourishes. */
function flourishAll(list: Scene[]): Scene[] { return list.map(flourish); }

export const SCENES: Scene[] = flourishAll([
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
    { t: 2.4, figs: { B: LAY(-0.8, -1, 90, { ...COVER_B, sh_n: 170 }, 'hurt'), A: STD(-1.2, 1, { sh_n: 160, el_n: 10, sh_f: -150, el_f: -10, hip_n: 6, hip_f: -6 }, 'shout', 1), R: STD(0.6, -1, { sh_n: 150, el_n: 10, sh_f: 10 }, 'shout', 0.3) }, props: [] },
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
  ent('ent_run', 'Sprints out', [
    [0, { torso: 20, sh_n: 60, el_n: 80, sh_f: -40, el_f: 70, hip_n: 45, kn_n: -50, hip_f: -30, kn_f: -60 }, 'roar', -1.5],
    [0.5, { torso: 20, sh_n: -40, el_n: 70, sh_f: 60, el_f: 80, hip_n: -30, kn_n: -60, hip_f: 45, kn_f: -50 }, 'roar', -0.5],
    [1.0, { torso: 20, sh_n: 60, el_n: 80, sh_f: -40, el_f: 70, hip_n: 45, kn_n: -50, hip_f: -30, kn_f: -60 }, 'roar', 0.5],
    [1.6, { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 10 }, 'shout', 1.0]]),
  ent('ent_kneel', 'Kneels in the lights', [
    [0, { head: -20, sh_n: 10, sh_f: -10 }, '', 0],
    [0.9, { ...KN, head: -25, sh_n: 20, el_n: 90, sh_f: -20, el_f: -90 }, '', 0, -1.33],
    [1.8, { ...KN, head: 15, sh_n: 160, el_n: 10, sh_f: -160, el_f: -10 }, 'roar', 0, -1.33],
    [2.6, { sh_n: 160, el_n: 10, sh_f: -160, el_f: -10, head: 12 }, 'shout', 0.2]]),
  ent('ent_salute', 'Salutes the crowd', [
    [0, { sh_n: 10, sh_f: -10 }, '', -0.6],
    [0.8, { sh_n: 150, el_n: 130, head: 4 }, 'smirk', -0.2],
    [1.5, { sh_n: 150, el_n: 130, head: 4, sh_f: -40 }, 'smirk', 0.2],
    [2.2, { sh_n: 100, el_n: 10, sh_f: -100, el_f: -10, head: 6 }, 'shout', 0.4]]),
  ent('ent_highfive', 'Slaps hands with the fans', [
    [0, { sh_n: 80, el_n: 10, sh_f: -20 }, 'shout', -1.4],
    [0.6, { sh_n: 20, sh_f: -80, el_f: -10 }, 'shout', -0.6],
    [1.2, { sh_n: 80, el_n: 10, sh_f: -20 }, 'shout', 0.2],
    [1.8, { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 8 }, 'roar', 0.8]]),
  ent('ent_dance', 'Dances to the music', [
    [0, { hip_n: 20, kn_n: -30, sh_n: 120, el_n: 60, sh_f: -40, el_f: -60, torso: 8 }, 'smirk', -0.4],
    [0.5, { hip_f: -20, kn_f: -30, sh_n: 40, el_n: 60, sh_f: -120, el_f: -60, torso: -8 }, 'smirk', 0],
    [1.0, { hip_n: 20, kn_n: -30, sh_n: 120, el_n: 60, sh_f: -40, el_f: -60, torso: 8 }, 'shout', 0.4],
    [1.5, { hip_f: -20, kn_f: -30, sh_n: 40, el_n: 60, sh_f: -120, el_f: -60, torso: -8 }, 'smirk', 0.6]]),
  ent('ent_slow', 'Head down, slow and cold', [
    [0, { head: -25, sh_n: 5, sh_f: -5, torso: 5 }, '', 0],
    [1.2, { head: -20, sh_n: 5, sh_f: -5, torso: 5, hip_n: 10, hip_f: -10 }, '', 0.2],
    [2.4, { head: 10, sh_n: 5, sh_f: -5 }, 'snarl', 0.4],
    [3.0, { head: 10, sh_n: 90, el_n: 120, sh_f: -5 }, 'snarl', 0.5]]),
  ent('ent_wings', 'Spreads the arms wide', [
    [0, { head: -10, sh_n: 10, sh_f: -10 }, '', -0.3],
    [0.9, { sh_n: 90, el_n: 0, sh_f: -90, el_f: 0, head: 4, torso: -4 }, '', 0],
    [1.8, { sh_n: 100, el_n: 10, sh_f: -100, el_f: -10, head: 16, torso: -10 }, 'roar', 0.2],
    [2.6, { sh_n: 95, el_n: 5, sh_f: -95, el_f: -5, head: 8 }, 'smirk', 0.4]]),
  ent('ent_guns', 'Finger guns at the crowd', [
    [0, { hip_n: 16, kn_n: -10, hip_f: -14, kn_f: -10, sh_n: -15, sh_f: 15 }, 'smirk', -0.6],
    [0.7, { sh_n: 95, el_n: 10, sh_f: -95, el_f: -10, head: 4 }, 'smirk', -0.2],
    [1.2, { sh_n: 110, el_n: 30, sh_f: -110, el_f: -30, head: 6 }, 'shout', 0],
    [1.9, { sh_n: 95, el_n: 10, sh_f: -95, el_f: -10, head: 4, torso: 6 }, 'smirk', 0.4]]),
  ent('ent_bow', 'A deep bow', [
    [0, { sh_n: 10, sh_f: -10 }, '', -0.2],
    [0.8, { torso: 45, head: 20, sh_n: -10, el_n: 90, sh_f: 40, el_f: 10, hip_n: 10, hip_f: -10 }, '', 0.1],
    [1.6, { torso: 45, head: 20, sh_n: -10, el_n: 90, sh_f: 40, el_f: 10, hip_n: 10, hip_f: -10 }, 'smirk', 0.1],
    [2.3, { sh_n: 140, el_n: 20, sh_f: -20, head: 8 }, 'smirk', 0.3]]),
  ent('ent_wave', 'Waves to the people', [
    [0, { sh_n: 140, el_n: 30, sh_f: -10 }, 'shout', -0.8],
    [0.5, { sh_n: 140, el_n: -20, sh_f: -10 }, 'shout', -0.4],
    [1.0, { sh_n: 140, el_n: 30, sh_f: -10 }, 'shout', 0],
    [1.5, { sh_n: 10, sh_f: -140, el_f: -30 }, 'shout', 0.4],
    [2.0, { sh_n: 10, sh_f: -140, el_f: 20 }, 'shout', 0.6]]),
  ent('ent_beat', 'Beats the chest', [
    [0, { torso: 6, sh_n: 50, el_n: 120, sh_f: -10 }, 'roar', -0.4],
    [0.4, { torso: 6, sh_f: -50, el_f: -120, sh_n: 10 }, 'roar', -0.2],
    [0.8, { torso: 6, sh_n: 50, el_n: 120, sh_f: -10 }, 'roar', 0],
    [1.2, { torso: 6, sh_f: -50, el_f: -120, sh_n: 10 }, 'roar', 0.2],
    [1.9, { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 14, torso: -6 }, 'roar', 0.4]]),
  ...[  // taunts: whoever is on top plays to the building, the other down on the mat. Wrestlers pick up to three in Create a Wrestler.
    ['taunt_crowd', 'Plays to the crowd', [[0, { sh_n: 100, el_n: 20, sh_f: -100, el_f: -20, head: 6 }, 'smirk'], [0.8, { sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 12 }, 'roar']]],
    ['taunt_point', 'Points down at them', [[0, { sh_n: 40, el_n: 30, sh_f: -10, head: -4 }, 'snarl'], [0.7, { torso: 10, sh_n: 75, el_n: 0, sh_f: -20, el_f: -20, head: -10 }, 'shout']]],
    ['taunt_flex', 'Flexes over them', [[0, { sh_n: 60, el_n: 90, sh_f: -60, el_f: -90 }, ''], [0.8, { sh_n: 90, el_n: 120, sh_f: -90, el_f: -120, hip_n: 10, hip_f: -10 }, 'roar']]],
    ['taunt_call', 'Calls for the finish', [[0, { sh_n: 160, el_n: 30, sh_f: -10, head: 8 }, 'shout'], [0.5, { sh_n: 150, el_n: -25, sh_f: -10, head: 10 }, 'shout'], [1.0, { sh_n: 165, el_n: 30, sh_f: -10, head: 8 }, 'roar']]],
    ['taunt_mock', 'A foot on their chest', [[0, { sh_n: 40, el_n: 125, wr_n: 10, sh_f: 45, el_f: 120, hip_n: 20, kn_n: -20 }, 'smirk'], [0.8, { sh_n: 40, el_n: 125, wr_n: 10, sh_f: 45, el_f: 120, hip_n: 55, kn_n: -70, an_n: 20, head: -12 }, 'smirk']]],
  ].map(([id, name, ks]) => ({ v: 1 as const, id: id as string, name: name as string, when: 'taunt', set: 'ring', slots: [{ id: 'A', n: 'Who taunts', role: 'a' as const }, { id: 'B', n: 'Who is down', role: 'b' as const }, { id: 'R', n: 'The referee', role: 'ref' as const }],
    keys: (ks as [number, Record<string, number>, string][]).map(([t, p, e]) => ({ t, figs: { A: STD(id === 'taunt_mock' ? 0.2 : -2.2, 1, p, e, 0.6), B: LAY(id === 'taunt_mock' ? 1.9 : 3.2, -1, 90, { sh_n: 150, sh_f: 130, hip_n: 20, kn_n: -40 }, 'hurt', 0.2), R: STD(-4.6, 1, { sh_n: 20, el_n: 40 }, '', -0.3) }, props: [] })) } as Scene)),
  deskScene('desk1', 'At the desk: the call', 'desk1', 'C1'),
  deskScene('desk2', 'At the desk: the colour', 'desk2', 'C2'),
  deskScene('desk3', 'At the desk: a guest on commentary', 'desk3', 'C3'),
  { v: 1, id: 'promo', name: 'On the microphone', when: 'promo', set: 'ring', slots: [{ id: 'A', n: 'The talker', role: 'a' }], keys: [
    { t: 0, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -20, el_f: -30, head: 4 }, '') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.35, r: -20, z: 2.2, s: 1.2, at: 'A:hand_n' }] },
    { t: 0.8, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -100, el_f: -20, head: 10 }, 'shout') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.35, r: -20, z: 2.2, s: 1.2, at: 'A:hand_n' }] },
    { t: 1.6, figs: { A: STD(-0.6, 1, { sh_n: 150, el_n: 120, sh_f: -40, el_f: -70, head: 0 }, '') }, props: [{ id: 'mic', k: 'mic', x: 0.1, y: 0.35, r: -20, z: 2.2, s: 1.2, at: 'A:hand_n' }] },
  ] },
]);

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
  still('st_hurt_back', 'In the trainer’s room', 'hurt', 'trainer', S1, {
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
  still('st_walkaway', 'Walking away down the hall', 'walkout', 'hall', S1, {
    A: { ...STD(0.3, 1, { torso: 2, head: 4, hip_n: -16, kn_n: -12, hip_f: 16, kn_f: -18, sh_n: -18, el_n: 10, sh_f: 20, el_f: 15 }, '', -0.4), b: true } }, [], { x: 0.3, y: 0.5, z: 1.25 }),
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
  still('st_interview', 'An interview backstage', 'press', 'hall', [{ id: 'A', n: 'Who it is about', role: 'a' }, { id: 'I', n: 'The interviewer', role: 'c', dress: 'suit', hook: 'interviewer' }], {
    A: STD(-1.5, 1, { sh_n: 35, el_n: 100, sh_f: -12, el_f: 10, head: 4 }, 'shout', 0.4),
    I: STD(1.9, -1, { sh_n: 100, el_n: 30, sh_f: 8, el_f: 15, head: -4 }, '', 0.6) },
    [{ id: 'mic', k: 'mic', x: 0.05, y: 0.15, r: 70, z: 1.4, at: 'I:hand_n' }], { x: 0.2, y: 0.6, z: 1.3 }),
  still('st_boss', 'Called out by the boss', 'any', 'ring', [{ id: 'A', n: 'Who it is about', role: 'a' }, { id: 'B', n: 'The authority figure', role: 'b', dress: 'suit', hook: 'authority' }], {
    A: STD(-1.4, 1, { ...CROSS, head: 4 }, 'snarl', 0.5),
    B: STD(1.4, -1, { sh_n: 150, el_n: 120, sh_f: 95, el_f: 5, head: -2 }, 'shout', 0.5) },
    [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'B:hand_n' }], { x: 0, y: 0.4, z: 1.4 }),
  still('st_phone', 'The office phone', 'phone', 'office', [], {}, [cap('THE OFFICE')]),
];

/* ---------- classic moves in and around the ring, each with the camera moving (Ryan, 19 October: "how we make top
   rope moves look good, turnbuckle moves, dives to the outside, and other classic scenes with the free camera") ----------
   A move is a few keyframes: the set-up, the moment in the air, the landing; each with its own camera, so the shot
   follows the move the way a director would cut it. Heights are what they stand on (Fig.lv). */
const P_ = (k: string) => (POSES.find(x => x[0] === k) as [string, PoseDef])[1];
const POSED = (k: string, x: number, z: number, f: number, lv = 0, e?: string): Fig => { const d = P_(k); return { x, y: d.y ?? WAIST, r: d.r || 0, f, z, p: { ...d.p }, e: e ?? d.e, lv }; };
const C3 = (p: [number, number, number], t: [number, number, number], fov = 30): Cam3 => ({ p, t, fov });
const MOVE_SLOTS: Slot[] = [{ id: 'A', n: 'Who does the move', role: 'a' }, { id: 'B', n: 'Who takes it', role: 'b' }, { id: 'R', n: 'The referee', role: 'ref' }];
const move = (name: string, keys: Key[]): Scene => ({ v: 1, id: 'scene-' + Date.now().toString(36), name, when: 'any', set: 'ring', slots: MOVE_SLOTS, keys });
const CLASSIC: Record<string, () => Scene> = {
  /* the moves Create a Move starts from (Ryan, 20 October: "any move from a powerbomb to a moonsault"), each in four or five keyframes with a shot of its own */
  clothesline: () => move('A clothesline', [
    { t: 0, figs: { A: POSED('charge', -6, 0, 1), B: POSED('stand', 2, 0, -1), R: POSED('point', -3, -5, 1) }, props: [], cam3: C3([0, 4.5, 22], [-1, 3, 0], 32) },
    { t: 0.6, ease: 'even', figs: { A: { ...POSED('stand', 0.8, 0, 1, 0, 'roar'), p: { torso: 10, sh_n: 90, el_n: 0, sh_f: -30, el_f: -20, hip_n: 30, kn_n: -20, hip_f: -25 } }, B: POSED('stagger', 2.2, 0, -1), R: POSED('point', -3, -5, 1) }, props: [], cam3: C3([4, 3.4, 15], [1.5, 3.6, 0], 30) },
    { t: 0.95, figs: { A: { ...POSED('stand', 1.8, 0, 1, 0, 'roar'), p: { torso: 16, sh_n: 100, el_n: 0, sh_f: -40, hip_n: 34, kn_n: -24, hip_f: -28 } }, B: { ...POSED('back', 2.6, 0, -1, 0, 'pain'), y: WAIST + 0.3, r: 150 }, R: POSED('point', -3, -5, 1) }, props: [burst('b1', 'WHAM!', 4.4, 3)], cam3: C3([6, 1.6, 12], [2.4, 3.2, 0], 34) },
    { t: 1.6, ease: 'in', figs: { A: POSED('onearm', 1.4, 0, 1), B: POSED('back', 3.2, 0, -1, 0, 'pain'), R: POSED('kneel', 0, -4, 1) }, props: [], cam3: C3([-5, 8, 17], [2, 1.5, 0], 32) }]),
  spear: () => move('A spear', [
    { t: 0, figs: { A: POSED('charge', -6.5, 0, 1), B: POSED('stand', 2, 0, -1), R: POSED('point', -3, -5, 1) }, props: [], cam3: C3([-2, 3, 20], [-1, 2.6, 0], 34) },
    { t: 0.6, ease: 'even', figs: { A: { ...POSED('dive', 0.6, 0, 1), y: WAIST - 0.8, r: -70 }, B: POSED('doubled', 2.1, 0, -1), R: POSED('point', -3, -5, 1) }, props: [], cam3: C3([3, 1.4, 13], [1.2, 2, 0], 32) },
    { t: 1.0, ease: 'in', figs: { A: POSED('cover', 2.0, 0, 1), B: POSED('back', 2.8, 0, -1, 0, 'pain'), R: POSED('point', -3, -5, 1) }, props: [burst('b1', 'SPEAR!', 4.6, 2.6)], cam3: C3([6, 2, 11], [2.4, 0.6, 0], 34) },
    { t: 1.7, figs: { A: { ...POSED('kneel', 1.2, 0, 1, 0, 'roar'), p: { ...KN, sh_n: 165, el_n: 10, sh_f: -165, el_f: -10, head: 8 } }, B: POSED('back', 2.8, 0, -1, 0, 'pain'), R: POSED('kneel', 0, -4, 1) }, props: [], cam3: C3([0, 5, 17], [1.6, 2, 0], 30) }]),
  suplex: () => move('A vertical suplex', [
    { t: 0, figs: { A: POSED('carry', -0.6, 0, 1), B: POSED('doubled', 0.7, 0, -1), R: POSED('point', -4, -4, 1) }, props: [], cam3: C3([0, 4, 19], [0, 3.2, 0], 30) },
    { t: 0.8, figs: { A: POSED('lift', -0.6, 0, 1), B: { x: 0, y: 0.7, r: 180, f: -1, z: 0.6, p: { sh_n: 175, sh_f: -175, hip_n: -6, hip_f: 6 }, e: 'shout', on: 'A:hands' }, R: POSED('point', -4, -4, 1) }, props: [], cam3: C3([5, 2, 14], [0, 5, 0], 34) },
    { t: 1.3, figs: { A: { ...POSED('lift', -1.0, 0, 1), r: 40 }, B: { ...POSED('splash', -1.8, 0, -1), y: WAIST + 1.4, r: 230 }, R: POSED('point', -4, -4, 1) }, props: [], cam3: C3([6, 3, 15], [-1, 3.6, 0], 34) },
    { t: 1.8, ease: 'in', figs: { A: POSED('back', -1.2, 0, 1), B: POSED('back', -3.2, 0, -1, 0, 'pain'), R: POSED('kneel', -4, -4, 1) }, props: [burst('b1', 'SLAM!', -5, 2.4)], cam3: C3([-6, 7, 16], [-2, 0.8, 0], 32) }]),
  powerbomb: () => move('A powerbomb', [
    { t: 0, figs: { A: POSED('carry', -0.4, 0, 1), B: POSED('doubled', 0.6, 0, -1), R: POSED('point', 4, -4, -1) }, props: [], cam3: C3([0, 4, 19], [0, 3.2, 0], 30) },
    { t: 0.8, figs: { A: POSED('carry', -0.4, 0, 1, 0, 'roar'), B: { x: 0, y: 0.3, r: 0, f: -1, z: 0.6, p: { hip_n: 90, kn_n: -20, an_n: -20, hip_f: 85, kn_f: -30, sh_n: 60, el_n: 40, sh_f: 50, el_f: 40 }, e: 'hurt', on: 'A:shoulders' }, R: POSED('point', 4, -4, -1) }, props: [], cam3: C3([-5, 3, 15], [0, 5, 0], 32) },
    { t: 1.5, figs: { A: POSED('lift', -0.4, 0, 1), B: { x: 0, y: 0.6, r: -15, f: -1, z: 0.6, p: { hip_n: 90, kn_n: -20, an_n: -20, hip_f: 85, kn_f: -30, sh_n: 120, el_n: 20, sh_f: 110, el_f: 20 }, e: 'shout', on: 'A:hands' }, R: POSED('point', 4, -4, -1) }, props: [], cam3: C3([-6, 1.4, 13], [0, 6, 0], 38) },
    { t: 2.0, ease: 'in', figs: { A: POSED('kneel', -0.2, 0, 1, 0, 'roar'), B: POSED('back', 1.4, 0, -1, 0, 'pain'), R: POSED('point', 4, -4, -1) }, props: [burst('b1', 'BOOM!', 3.4, 2.8, PAL.red)], cam3: C3([5, 2, 12], [0.8, 1, 0], 34) },
    { t: 2.7, figs: { A: POSED('cover', 0.5, 0, 1), B: POSED('back', 1.4, 0, -1, 0, 'pain'), R: POSED('kneel', 3.6, -2, -1) }, props: [], cam3: C3([0, 8, 15], [1, 0.5, 0], 30) }]),
  ddt: () => move('A DDT', [
    { t: 0, figs: { A: POSED('carry', -0.5, 0, 1), B: POSED('doubled', 0.6, 0, -1), R: POSED('point', -4, -4, 1) }, props: [], cam3: C3([0, 4, 18], [0, 3, 0], 30) },
    { t: 0.6, figs: { A: { ...POSED('stand', -0.6, 0, 1, 0, 'roar'), r: 30, p: { sh_n: 60, el_n: 100, sh_f: 40, el_f: 90, hip_n: -10 } }, B: { ...POSED('dive', 0.2, 0, -1), y: WAIST - 0.4, r: -110 }, R: POSED('point', -4, -4, 1) }, props: [], cam3: C3([5, 2.4, 13], [0, 2.6, 0], 32) },
    { t: 1.0, ease: 'in', figs: { A: POSED('back', -1.6, 0, 1), B: { ...POSED('dive', 0.1, 0, -1, 0, 'pain'), y: -1.2, r: -170 }, R: POSED('point', -4, -4, 1) }, props: [burst('b1', 'SPIKED!', 2.6, 2.4)], cam3: C3([4, 1, 10], [0, 0.8, 0], 36) },
    { t: 1.6, figs: { A: POSED('sit', -1.8, 0, 1), B: POSED('front', 0.8, 0, -1, 0, 'pain'), R: POSED('kneel', -3, -3, 1) }, props: [], cam3: C3([-4, 6, 15], [-0.4, 0.8, 0], 32) }]),
  topdive: () => move('A splash off the top', [
    { t: 0, figs: { A: POSED('crouch', 9.5, 10.6, -1, 4.9), B: POSED('back', 3.2, 5.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([19, 4, 22], [8.8, 7, 9.4], 40) },
    { t: 1.0, figs: { A: POSED('leap', 9.3, 10.4, -1, 4.9), B: POSED('back', 3.2, 5.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([17, 5, 21], [8, 7.5, 8.8], 42) },
    { t: 1.8, ease: 'even', figs: { A: POSED('splash', 6.2, 8.2, -1, 5.2), B: POSED('back', 3.2, 5.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([13, 7, 20], [5.5, 5, 7], 40) },
    { t: 2.5, ease: 'in', figs: { A: POSED('splash', 3.4, 5.9, -1, 0.75), B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('kneel', -1, 3, 1) }, props: [], cam3: C3([10, 9, 19], [3.2, 0.8, 5.4], 32) }]),
  moonsault: () => move('A moonsault off the top', [
    { t: 0, figs: { A: { ...POSED('stand', 9.5, -10.6, 1, 4.9), b: true }, B: POSED('back', 4, -6, 1), R: POSED('point', -2, -2, 1) }, props: [], cam3: C3([2, 4, 6], [8.6, 7.5, -9.6], 42) },
    { t: 1.1, figs: { A: { ...POSED('moonsault', 7.5, -9.2, 1, 6.5), b: true }, B: POSED('back', 4, -6, 1), R: POSED('point', -2, -2, 1) }, props: [], cam3: C3([-1, 6, 8], [7, 8, -9], 44) },
    { t: 2.0, ease: 'in', figs: { A: POSED('splash', 4.2, -6.3, -1, 0.75), B: POSED('back', 4, -6, 1, 0, 'pain'), R: POSED('kneel', -2, -2, 1) }, props: [], cam3: C3([-7, 7, 5], [4, 0.8, -6], 32) }]),
  tope: () => move('A dive to the outside', [
    { t: 0, figs: { A: POSED('charge', 3, 0, 1), B: POSED('stagger', 12.6, 0.4, -1, -3), R: POSED('point', -4, 3, 1) }, props: [], cam3: C3([18, 3, 16], [8, 2, 0], 38) },
    { t: 0.8, ease: 'even', figs: { A: POSED('dive', 10.4, 0.2, 1, 2.6), B: POSED('stagger', 12.6, 0.4, -1, -3), R: POSED('point', -4, 3, 1) }, props: [], cam3: C3([17, 2, 14], [11, 2, 0], 34) },
    { t: 1.3, ease: 'in', figs: { A: POSED('dive', 12.2, 0.3, 1, -0.6), B: POSED('stagger', 12.9, 0.4, -1, -3), R: POSED('point', -4, 3, 1) }, props: [], cam3: C3([16, 0.5, 12], [12.4, -1, 0], 36) },
    { t: 2.1, figs: { A: POSED('back', 12.0, 1.2, 1, -3), B: POSED('front', 13.0, -0.6, -1, -3), R: POSED('point', 9, 2, 1) }, props: [], cam3: C3([13, 4, 12.5], [12.5, -2.5, 0], 38) }]),
  cornerhit: () => move('A charge into the corner', [
    { t: 0, figs: { A: POSED('charge', 1, -3.5, 1), B: POSED('corner', 8.9, -9.9, -1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([-6, 5, 8], [5, 3.5, -7], 30) },
    { t: 0.9, ease: 'in', figs: { A: POSED('splash', 7.6, -8.7, 1, 2.6), B: POSED('corner', 8.9, -9.9, -1, 0, 'pain'), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([0, 4, 0], [8, 3.5, -9], 28) },
    { t: 1.6, figs: { A: POSED('flex', 6, -6.5, 1), B: { ...POSED('sit', 8.6, -9.6, -1), e: 'hurt' }, R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([1, 3, -1], [7, 2.5, -8], 32) }]),
  superplex: () => move('A superplex off the top', [
    { t: 0, figs: { A: POSED('lift', 8.7, -9.5, 1, 3.2), B: { ...POSED('sit', 9.4, -10.3, -1, 4.9), e: 'pain' }, R: POSED('point', 2, -3, 1) }, props: [], cam3: C3([0, 3, 2], [8.5, 6.5, -9.5], 32) },
    { t: 1.0, figs: { A: { ...POSED('lift', 8.3, -9.1, 1, 4.6), r: 25 }, B: { ...POSED('back', 8.6, -9.4, -1, 7.5), r: 160 }, R: POSED('point', 2, -3, 1) }, props: [], cam3: C3([-1, 5, 4], [8, 8, -9], 36) },
    { t: 1.9, ease: 'in', figs: { A: POSED('back', 5.6, -6.6, 1), B: POSED('back', 4.4, -5.8, -1, 0, 'pain'), R: POSED('kneel', 2, -3, 1) }, props: [], cam3: C3([-2, 6, 6], [5, 0.5, -6], 34) }]),
};
/* ---------- the rest of the move library (Ryan, 20 October: "there will need to be animations for every move in the game,
   none are just verbal"). Every move a wrestler can have in their moveset is one of these or a move made in Create a
   Move. The names are in E.MOVE_LIB (src/86-looks.js); app/tests/scene.js fails when a name has no scene here. ---------- */
const W_ = WAIST, REF_ = (x = -4.5, z = -4, f = 1) => POSED('point', x, z, f), REFK_ = (x = -4.5, z = -4, f = 1) => POSED('kneel', x, z, f);
/** A figure from a pose, with angles of its own on top and anything else (y, r, e, b) changed. */
const FG = (k: string, x: number, f: number, p: Record<string, number> = {}, o: Partial<Fig> = {}): Fig => { const b = POSED(k, x, 0, f); return { ...b, ...o, p: { ...b.p, ...p } }; };
const CM = { wide: C3([0, 4, 18], [0, 3, 0], 30), close: C3([2, 5.5, 15], [0.2, 3.4, 0], 30), low: C3([1.5, 5.5, 15], [0.8, 3, 0], 32), high: C3([-4, 7, 16], [1, 1.2, 0], 32), side: C3([-5, 3, 14], [0, 3.6, 0], 32) };
/** A strike: square up, wind up, the hit with its word, and the one hit selling it. */
function strike(name: string, word: string, o: { wind: Record<string, number>; hit: Record<string, number>; run?: boolean; hy?: number; hr?: number; ax?: number; bEnd?: string; aEnd?: string; e?: string }): Scene {
  const ax = o.ax ?? -0.3, A0 = o.run ? FG('charge', -5.5, 1) : FG('fists', -1.7, 1);
  return move(name, [
    { t: 0, figs: { A: A0, B: FG('fists', 1.4, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('stand', o.run ? -1.6 : -1.4, 1, o.wind, { e: o.e || 'roar' }), B: FG('fists', 1.4, -1), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.8, ease: 'in', figs: { A: FG('stand', ax, 1, o.hit, { y: W_ + (o.hy || 0), r: o.hr || 0, e: o.e || 'roar' }), B: FG('stagger', 1.8, -1), R: REF_() }, props: [burst('b1', word, 3.4, 3.2)], cam3: CM.low },
    { t: 1.5, figs: { A: FG(o.aEnd || 'fists', ax - 0.2, 1), B: FG(o.bEnd || 'back', 2.9, -1, {}, { e: 'pain' }), R: REF_() }, props: [], cam3: CM.high }]);
}
/** A hold on the mat or standing: going for it, locking it in, cranking it while the one in it reaches for the ropes. */
function hold(name: string, word: string, A1: Fig, B1: Fig, A2: Fig, B2: Fig, cam = C3([0, 7.5, 16], [0.4, 1.8, 0], 34)): Scene {
  return move(name, [
    { t: 0, figs: { A: FG('stand', -1.4, 1), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.7, figs: { A: A1, B: B1, R: REFK_(-3.5, -3) }, props: [], cam3: cam },
    { t: 1.4, figs: { A: A2, B: B2, R: REFK_(-3.5, -3) }, props: [burst('b1', word, 2.8, 2.6)], cam3: C3([4.5, 5, 13], [0.3, 1.8, 0], 36) },
    { t: 2.3, figs: { A: { ...A2, e: 'roar' }, B: { ...B2, p: { ...B2.p, sh_n: 165, el_n: 5 }, e: 'shout' }, R: { ...REFK_(-3.5, -3), e: 'shout' } }, props: [], cam3: C3([-4.5, 6, 14], [0.3, 1.8, 0], 34) }]);
}
/** A hold put on standing up (a bear hug, a guillotine): both on their feet from the start, seen from the side so neither hides the other. */
function standHold(name: string, word: string, A1: Fig, B1: Fig, A2: Fig, B2: Fig): Scene {
  return move(name, [
    { t: 0, figs: { A: FG('fists', -1.6, 1), B: FG('stagger', 1.0, -1, {}, { e: 'hurt' }), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.7, figs: { A: A1, B: B1, R: REF_() }, props: [], cam3: CM.side },
    { t: 1.4, figs: { A: A2, B: B2, R: REF_() }, props: [burst('b1', word, 2.8, 4.2)], cam3: C3([5, 4, 14], [0, 3.6, 0], 34) },
    { t: 2.3, figs: { A: { ...A2, e: 'roar' }, B: { ...B2, p: { ...B2.p, sh_f: 30, el_f: 10 }, e: 'shout' }, R: { ...REF_(), e: 'shout' } }, props: [], cam3: C3([-5, 4, 14], [0, 3.6, 0], 34) }]);
}
const LEGSUP = { hip_n: -95, kn_n: 10, hip_f: -90, kn_f: 10 };
const MORE: Record<string, () => Scene> = {
  // strikes
  chop: () => strike('A knife-edge chop', 'CHOP!', { wind: { sh_n: -50, el_n: 10, torso: -10, sh_f: 30 }, hit: { torso: 12, sh_n: 95, el_n: 5, sh_f: -30, hip_n: 20, kn_n: -15 }, bEnd: 'weep' }),
  forearm: () => strike('A forearm smash', 'SMASH!', { wind: { sh_n: 30, el_n: 125, torso: -12 }, hit: { torso: 16, sh_n: 90, el_n: 70, hip_n: 25, kn_n: -20, hip_f: -15 }, bEnd: 'sit' }),
  superkick: () => strike('A superkick', 'SUPERKICK!', { wind: { hip_n: -35, torso: 12, sh_n: 30, sh_f: -30 }, hit: { torso: -30, hip_n: 125, kn_n: -5, an_n: 0, sh_n: 45, el_n: 60, sh_f: -55, el_f: -40 }, hy: 0.3, hr: -8 }),
  bigboot: () => strike('A big boot', 'BOOT!', { run: true, wind: { torso: 10, hip_n: 30, kn_n: -40 }, hit: { torso: -15, hip_n: 95, kn_n: 0, sh_n: 30, sh_f: -40 } }),
  jumpknee: () => strike('A jumping knee', 'KNEE!', { run: true, wind: { torso: 15, hip_n: 40, kn_n: -60 }, hit: { hip_n: 110, kn_n: -125, hip_f: -15, kn_f: -50, sh_n: 70, el_n: 30, sh_f: -70 }, hy: 1.3 }),
  headbutt: () => strike('A headbutt', 'THUD!', { wind: { torso: -22, head: -28, sh_n: 40, el_n: 80, sh_f: 40, el_f: 80 }, hit: { torso: 32, head: 26, sh_n: 50, el_n: 90, sh_f: 50, el_f: 90 }, ax: 0.3, bEnd: 'sit' }),
  enzuigiri: () => strike('An enzuigiri', 'ENZUIGIRI!', { wind: { torso: 10, hip_n: 30, kn_n: -40 }, hit: { hip_n: 105, kn_n: -10, hip_f: 60, kn_f: -35, sh_n: 120, sh_f: -120 }, hy: 1.4, hr: 80, bEnd: 'front', aEnd: 'sit' }),
  elbowstrike: () => strike('A running elbow', 'WHACK!', { run: true, wind: { torso: 20, sh_n: 60, el_n: 150 }, hit: { torso: 12, sh_n: 85, el_n: 150, sh_f: -30, hip_n: 30, kn_n: -20 } }),
  discus: () => strike('A discus punch', 'POW!', { wind: { torso: -12, sh_n: -70, el_n: 10, sh_f: 60 }, hit: { torso: 18, sh_n: 95, el_n: 0, sh_f: -40, hip_n: 25, kn_n: -15 }, hr: -14 }),
  // grapples
  snapsuplex: () => { const sc = CLASSIC.suplex(); sc.name = 'A snap suplex'; sc.keys = sc.keys.map(k => ({ ...k, t: k.t * 0.65 })); return sc; },
  german: () => move('A German suplex', [
    { t: 0, figs: { A: FG('carry', -0.5, 1, { sh_n: 70, el_n: 70, sh_f: 70, el_f: 70 }), B: FG('stagger', 0.5, 1, {}, { e: 'hurt' }), R: REF_(-4.5, -4, 1) }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('stand', -0.5, 1, { torso: -35, head: -20, sh_n: 90, el_n: 60, sh_f: 90, el_f: 60, hip_n: -10, kn_n: -30, hip_f: 10, kn_f: -30 }, { r: 30 }), B: FG('stand', -0.1, 1, { sh_n: 30, sh_f: -30, hip_n: 20, hip_f: -20 }, { y: W_ + 1.6, r: -70, e: 'shout' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, ease: 'in', figs: { A: FG('stand', -0.6, 1, { torso: -40, head: -30, sh_n: 160, sh_f: 150, hip_n: -40, kn_n: -80, hip_f: -40, kn_f: -80 }, { y: W_ - 1.4, r: 120 }), B: FG('stand', -1.6, 1, { sh_n: 40, sh_f: -40 }, { y: W_ + 0.3, r: -175, e: 'pain' }), R: REF_() }, props: [burst('b1', 'GERMAN!', -4, 2.6)], cam3: CM.low },
    { t: 1.7, figs: { A: FG('back', -0.4, 1), B: FG('back', -2.8, -1, {}, { e: 'pain' }), R: REFK_(-4.5, -3, 1) }, props: [], cam3: CM.high }]),
  northern: () => { const sc = CLASSIC.suplex(); sc.name = 'A northern lights suplex'; const L = sc.keys[sc.keys.length - 1];
    sc.keys[sc.keys.length - 1] = { ...L, figs: { ...L.figs, A: FG('cover', -2.4, -1, { hip_n: -30, kn_n: -60 }), B: FG('back', -3.2, -1, {}, { e: 'pain' }) }, props: [burst('b1', 'BRIDGE!', -5, 2.4)] }; return sc; },
  armdrag: () => move('An arm drag', [
    { t: 0, figs: { A: FG('fists', -0.6, 1), B: FG('charge', 2.4, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.45, figs: { A: FG('stand', -0.5, 1, { sh_n: 80, el_n: 30, sh_f: 60, el_f: 40, torso: -10 }, { b: true }), B: FG('stand', 0, -1, { sh_n: 90, sh_f: -60 }, { y: W_ + 1.3, r: -95, e: 'shout' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.8, ease: 'in', figs: { A: FG('kneel', -0.6, 1, { sh_n: 60, el_n: 20 }), B: FG('stand', -1.4, -1, { sh_n: 120, sh_f: -120 }, { y: W_ + 0.4, r: -200 }), R: REF_() }, props: [burst('b1', 'DRAGGED!', -3.4, 2.8)], cam3: CM.low },
    { t: 1.4, figs: { A: FG('fists', -0.3, -1), B: FG('back', -2.6, 1, {}, { e: 'hurt' }), R: REF_() }, props: [], cam3: CM.high }]),
  hiptoss: () => move('A hip toss', [
    { t: 0, figs: { A: FG('stand', -0.5, 1, { sh_n: 60, el_n: 40 }), B: FG('fists', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('stand', -0.1, 1, { torso: 25, sh_n: 90, el_n: 40, sh_f: 40, hip_n: 25, kn_n: -30 }, { b: true }), B: FG('stand', -0.2, -1, { sh_n: 60, sh_f: -60, hip_n: 30, hip_f: -10 }, { y: W_ + 1.9, r: -110, e: 'shout' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, ease: 'in', figs: { A: FG('stand', -0.2, 1, { torso: 35, sh_n: 70, el_n: 30, hip_n: 30, kn_n: -40 }), B: FG('back', -1.6, 1, {}, { y: W_ - 1, r: 120, e: 'pain' }), R: REF_() }, props: [burst('b1', 'TOSSED!', -3.6, 2.6)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('fists', -0.3, -1), B: FG('back', -2.4, 1, {}, { e: 'hurt' }), R: REF_() }, props: [], cam3: CM.high }]),
  snapmare: () => move('A snapmare', [
    { t: 0, figs: { A: FG('stand', 0.5, 1, { sh_n: 160, el_n: 110, sh_f: -160, el_f: -110 }, { b: true }), B: FG('doubled', -0.5, 1), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('kneel', 0.6, 1, { sh_n: 150, el_n: 120, sh_f: 140, el_f: 120 }), B: FG('stand', 0.2, 1, { sh_n: 160, sh_f: 150, hip_n: 40, kn_n: -60 }, { y: W_ + 1.4, r: 110, e: 'shout' }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.side },
    { t: 1.0, ease: 'in', figs: { A: FG('kneel', 0.6, 1), B: FG('sit', 1.9, 1, {}, { e: 'pain' }), R: REF_(4.5, -4, -1) }, props: [burst('b1', 'SNAP!', 3.6, 2.6)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('fists', 0.4, 1), B: FG('sit', 1.9, 1, { sh_n: 20, el_n: 100 }, { e: 'hurt' }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.high }]),
  neckbreaker: () => move('A neckbreaker', [
    { t: 0, figs: { A: FG('fists', -1, 1), B: FG('stagger', 0.8, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('stand', 0.2, 1, { sh_n: 100, el_n: 120, torso: 10 }), B: FG('doubled', 0.6, -1, { head: 30 }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.9, ease: 'in', figs: { A: FG('sit', 0.2, 1, { sh_n: 100, el_n: 110 }), B: FG('back', 1.1, -1, {}, { y: W_ - 1.5, r: 120, e: 'pain' }), R: REF_() }, props: [burst('b1', 'CRACK!', 3, 2.6)], cam3: CM.low },
    { t: 1.5, figs: { A: FG('kneel', 0, 1), B: FG('back', 1.4, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  backbreaker: () => move('A backbreaker', [
    { t: 0, figs: { A: FG('carry', -0.4, 1), B: FG('doubled', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('lift', -0.4, 1, { sh_n: 110, el_n: 40, sh_f: 100, el_f: 40 }), B: FG('back', 0, -1, {}, { y: W_ + 1.7, e: 'shout' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, ease: 'in', figs: { A: FG('kneel', -0.4, 1, { hip_f: 90, kn_f: -90, sh_n: 90, el_n: 30 }), B: FG('back', 0, -1, { hip_n: 50, kn_n: -40 }, { y: W_ - 0.5, r: 70, e: 'pain' }), R: REF_() }, props: [burst('b1', 'CRUNCH!', 2.6, 2.8)], cam3: CM.low },
    { t: 1.7, figs: { A: FG('fists', -0.6, 1), B: FG('back', 1.3, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  bulldog: () => move('A bulldog', [
    { t: 0, figs: { A: FG('charge', -4, 1), B: FG('doubled', 1, 1), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('leap', 0.4, 1, { sh_n: 100, el_n: 120 }, { y: W_ + 0.9 }), B: FG('doubled', 1, 1, { head: 25 }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.close },
    { t: 0.85, ease: 'in', figs: { A: FG('sit', 1, 1, { sh_n: 90, el_n: 120 }), B: FG('front', 2, 1, {}, { e: 'pain' }), R: REF_(4.5, -4, -1) }, props: [burst('b1', 'FACE FIRST!', 3.8, 2.4)], cam3: CM.low },
    { t: 1.5, figs: { A: FG('fists', 0.6, 1), B: FG('front', 2, 1, {}, { e: 'pain' }), R: REFK_(4.5, -4, -1) }, props: [], cam3: CM.high }]),
  bodyslam: () => move('A body slam', [
    { t: 0, figs: { A: FG('carry', -0.4, 1), B: FG('doubled', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('lift', -0.4, 1, { sh_n: 130, sh_f: 120 }), B: FG('stand', 0, -1, { hip_n: 60, kn_n: -40 }, { y: W_ + 1.6, r: 180, e: 'shout' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, figs: { A: FG('lift', -0.4, 1), B: FG('back', 0, -1, {}, { y: W_ + 2.3, e: 'shout' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 1.35, ease: 'in', figs: { A: FG('carry', 0, 1, { torso: 25 }), B: FG('back', 1, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'SLAM!', 3, 2.4)], cam3: CM.low },
    { t: 2.0, figs: { A: FG('flex', -0.4, 1), B: FG('back', 1, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  // power moves
  chokeslam: () => move('A chokeslam', [
    { t: 0, figs: { A: FG('stand', -0.9, 1), B: FG('fists', 0.7, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('stand', -0.7, 1, { sh_n: 100, el_n: 10 }, { e: 'roar' }), B: FG('stand', 0.6, -1, { sh_n: 60, el_n: 100, sh_f: 60, el_f: 100 }, { e: 'hurt' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.8, figs: { A: FG('stand', -0.9, 1, { sh_n: 100, el_n: 5, sh_f: 25 }, { e: 'roar' }), B: FG('stand', 0.55, -1, { sh_n: 70, el_n: 110, sh_f: 70, el_f: 110, head: -10 }, { z: 0.35, e: 'hurt' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 1.1, figs: { A: FG('stand', -0.9, 1, { sh_n: 150, el_n: 5, sh_f: 30, torso: -6 }, { e: 'roar' }), B: FG('stand', 0.15, -1, { sh_n: 75, el_n: 110, sh_f: 75, el_f: 110, head: -14, hip_n: 18, kn_n: -25, hip_f: 8, kn_f: -35 }, { y: W_ + 2.4, z: 0.35, e: 'shout' }), R: REF_() }, props: [], cam3: C3([3, 7, 18], [-0.2, 5.2, 0], 34) },
    { t: 1.4, ease: 'in', figs: { A: FG('stand', -0.5, 1, { torso: 35, sh_n: 70, el_n: 10, hip_n: 25, kn_n: -30 }), B: FG('back', 0.9, -1, {}, { y: W_ - 1.6, e: 'pain' }), R: REF_() }, props: [burst('b1', 'CHOKESLAM!', 3.2, 2.6, PAL.red)], cam3: CM.low },
    { t: 2.0, figs: { A: FG('point', -0.6, 1, { sh_n: 60 }), B: FG('back', 1.3, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  spinebuster: () => move('A spinebuster', [
    { t: 0, figs: { A: FG('carry', -1, 1), B: FG('charge', 2.4, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('carry', -0.6, 1, {}, { e: 'roar' }), B: FG('doubled', 0.2, -1, {}, { y: W_ + 0.8, r: -40 }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.85, figs: { A: FG('carry', -0.4, 1, {}, { r: 25, e: 'roar' }), B: FG('front', 0.3, -1, {}, { y: W_ + 1, r: -60 }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.15, ease: 'in', figs: { A: FG('cover', 0.4, 1), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'SPINEBUSTER!', 3, 2.4)], cam3: CM.low },
    { t: 1.8, figs: { A: FG('kneel', 0.2, 1, { sh_n: 165 }, { e: 'roar' }), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  powerslam: () => move('A running powerslam', [
    { t: 0, figs: { A: FG('carry', -0.8, 1), B: FG('charge', 2.4, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('carry', -0.5, 1), B: FG('front', 0.1, -1, {}, { y: W_ + 0.7, e: 'shout' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.9, figs: { A: FG('charge', 0.3, 1, { sh_n: 80, el_n: 40, sh_f: 80, el_f: 40 }), B: FG('front', 0.9, -1, {}, { y: W_ + 0.6 }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.2, ease: 'in', figs: { A: FG('cover', 1.2, 1), B: FG('back', 1.9, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'POWERSLAM!', 3.8, 2.4)], cam3: CM.low }]),
  gorillapress: () => move('A gorilla press', [
    { t: 0, figs: { A: FG('carry', -0.4, 1), B: FG('doubled', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.7, figs: { A: FG('lift', -0.4, 1), B: FG('front', -0.3, -1, {}, { y: W_ + 3.5, e: 'shout' }), R: REF_() }, props: [], cam3: C3([4, 2.5, 15], [0, 5.5, 0], 36) },
    { t: 1.4, figs: { A: FG('lift', 0.2, 1, {}, { e: 'roar' }), B: FG('front', 0.3, -1, {}, { y: W_ + 3.5, e: 'shout' }), R: REF_() }, props: [], cam3: C3([-4, 3, 15], [0, 5.5, 0], 36) },
    { t: 1.8, ease: 'in', figs: { A: FG('lift', 0.2, 1, { sh_n: 120, sh_f: 110 }), B: FG('front', 1.3, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'DROPPED!', 3.4, 2.2)], cam3: CM.low },
    { t: 2.4, figs: { A: FG('flex', 0, 1), B: FG('front', 1.3, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  sidewalk: () => move('A sidewalk slam', [
    { t: 0, figs: { A: FG('carry', -0.6, 1), B: FG('stagger', 0.7, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('carry', -0.4, 1, { torso: -10 }), B: FG('back', 0, -1, {}, { y: W_ + 0.9, r: 100, e: 'shout' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, ease: 'in', figs: { A: FG('kneel', -0.5, 1, { sh_n: 70, el_n: 40 }), B: FG('back', 0.7, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'SLAM!', 2.8, 2.4)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('cover', 0.2, 1), B: FG('back', 0.9, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  fallaway: () => move('A fallaway slam', [
    { t: 0, figs: { A: FG('carry', -0.8, 1), B: FG('charge', 2.4, -1), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('carry', -0.4, 1, { torso: -15 }), B: FG('front', 0.1, -1, {}, { y: W_ + 0.9, e: 'shout' }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.close },
    { t: 0.9, figs: { A: FG('stand', -0.6, 1, { torso: -40, sh_n: 160, sh_f: 150, hip_n: 30, kn_n: -40 }, { y: W_ - 0.7, r: 40 }), B: FG('front', -1.3, -1, {}, { y: W_ + 2.4, r: -150, e: 'shout' }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.side },
    { t: 1.3, ease: 'in', figs: { A: FG('back', -0.3, 1), B: FG('back', -3.1, 1, {}, { e: 'pain' }), R: REF_(4.5, -4, -1) }, props: [burst('b1', 'FALLAWAY!', -4.4, 2.4)], cam3: CM.low },
    { t: 2.0, figs: { A: FG('kneel', -0.4, 1, { sh_n: 165 }), B: FG('back', -3.1, 1, {}, { e: 'pain' }), R: REFK_(4.5, -4, -1) }, props: [], cam3: CM.high }]),
  // high flying
  dropkick: () => move('A dropkick', [
    { t: 0, figs: { A: FG('charge', -4, 1), B: FG('fists', 1.4, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.45, figs: { A: FG('leap', -1.4, 1, {}, { y: W_ + 1.1 }), B: FG('fists', 1.4, -1), R: REF_() }, props: [], cam3: CM.side },
    { t: 0.75, ease: 'in', figs: { A: FG('back', -0.1, 1, { hip_n: 90, kn_n: 0, hip_f: 85, kn_f: 0, sh_n: 120, sh_f: 110 }, { y: W_ + 1.6, r: 70, e: 'shout' }), B: FG('stagger', 1.7, -1), R: REF_() }, props: [burst('b1', 'DROPKICK!', 3.4, 3.4)], cam3: CM.low },
    { t: 1.3, figs: { A: FG('back', -0.6, 1), B: FG('back', 2.8, -1, {}, { e: 'pain' }), R: REF_() }, props: [], cam3: CM.high },
    { t: 1.9, figs: { A: FG('fists', -0.4, 1), B: FG('back', 2.8, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.wide }]),
  crossbody: () => move('A crossbody from the top', [
    { t: 0, figs: { A: POSED('crouch', 9.5, 10.6, -1, 4.9), B: POSED('stagger', 4.6, 6.8, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([19, 4, 22], [8.8, 7, 9.4], 40) },
    { t: 0.9, figs: { A: POSED('leap', 9.2, 10.3, -1, 5), B: POSED('fists', 4.6, 6.8, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([17, 5, 21], [8, 7.5, 8.8], 42) },
    { t: 1.5, ease: 'even', figs: { A: POSED('splash', 5.8, 7.6, -1, 3.2), B: POSED('stagger', 4.6, 6.8, 1), R: POSED('point', -3, 2, 1) }, props: [burst('b1', 'CROSSBODY!', 3.4, 4.6)], cam3: C3([13, 6, 20], [5, 5, 7], 40) },
    { t: 2.0, ease: 'in', figs: { A: POSED('cover', 3.9, 6.3, -1), B: POSED('back', 3.4, 5.9, 1, 0, 'pain'), R: POSED('kneel', -1, 3, 1) }, props: [], cam3: C3([10, 9, 19], [3.2, 0.8, 5.4], 32) }]),
  flyingelbow: () => move('A flying elbow', [
    { t: 0, figs: { A: POSED('stand', 9.5, 10.6, -1, 4.9), B: POSED('back', 3.2, 5.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([19, 4, 22], [8.8, 7, 9.4], 40) },
    { t: 1.0, figs: { A: { ...POSED('elbow', 8.6, 9.8, -1, 6.2), r: -30 }, B: POSED('back', 3.2, 5.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([17, 5, 21], [8, 7.5, 8.8], 42) },
    { t: 1.7, ease: 'even', figs: { A: POSED('elbow', 5.6, 7.6, -1, 4.6), B: POSED('back', 3.2, 5.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([13, 7, 20], [5.5, 5, 7], 40) },
    { t: 2.3, ease: 'in', figs: { A: { ...POSED('elbow', 3.4, 5.9, -1, 0.5) }, B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('kneel', -1, 3, 1) }, props: [burst('b1', 'ELBOW!', 5.8, 2.4)], cam3: C3([10, 9, 19], [3.2, 0.8, 5.4], 32) }]),
  hurricanrana: () => move('A hurricanrana', [
    { t: 0, figs: { A: FG('charge', -3, 1), B: FG('fists', 1, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('sit', 0.7, -1, { hip_n: 70, hip_f: 70, kn_n: -60, kn_f: -60, sh_n: 120, sh_f: 110 }, { y: W_ + 2.3, e: 'shout' }), B: FG('stand', 1, -1, { sh_n: 100, el_n: 90, sh_f: 100, el_f: 90 }, { e: 'hurt' }), R: REF_() }, props: [], cam3: C3([4, 3, 14], [0.8, 5, 0], 34) },
    { t: 0.9, figs: { A: FG('back', 1.3, -1, { hip_n: 60, kn_n: -60 }, { y: W_ + 0.6, r: 150 }), B: FG('stand', 1.7, -1, { sh_n: 150, sh_f: 150 }, { y: W_ + 1.5, r: 120, e: 'shout' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.3, ease: 'in', figs: { A: FG('kneel', 1.2, 1), B: FG('back', 3.1, 1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'RANA!', 4.4, 2.6)], cam3: CM.low },
    { t: 1.9, figs: { A: FG('onearm', 1, 1), B: FG('back', 3.1, 1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  missile: () => move('A missile dropkick', [
    { t: 0, figs: { A: POSED('crouch', 9.5, 10.6, -1, 4.9), B: POSED('fists', 4.4, 6.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([19, 4, 22], [8.8, 7, 9.4], 40) },
    { t: 0.9, figs: { A: POSED('leap', 9.1, 10.2, -1, 5.2), B: POSED('fists', 4.4, 6.6, 1), R: POSED('point', -3, 2, 1) }, props: [], cam3: C3([17, 5, 21], [8, 7.5, 8.8], 42) },
    { t: 1.4, ease: 'in', figs: { A: { ...POSED('back', 5.4, 7.4, -1, 3), p: { hip_n: 90, kn_n: 0, hip_f: 85, kn_f: 0, sh_n: 120, sh_f: 110 }, r: -70, e: 'shout' }, B: POSED('stagger', 4.6, 6.8, 1), R: POSED('point', -3, 2, 1) }, props: [burst('b1', 'MISSILE!', 3, 4.6)], cam3: C3([13, 6, 20], [5, 5, 7], 40) },
    { t: 2.0, figs: { A: POSED('back', 6.2, 8, -1), B: POSED('back', 2.8, 5.4, 1, 0, 'pain'), R: POSED('kneel', -1, 3, 1) }, props: [], cam3: C3([7, 4.5, 16], [4, 0.8, 6], 30) }]),
  // holds
  armbar: () => hold('An armbar', 'ARMBAR!', FG('kneel', 0.4, 1, { sh_n: 70, el_n: 40, sh_f: 70, el_f: 40 }), FG('back', 1.2, -1, { sh_n: 90, el_n: 0 }, { e: 'pain' }),
    FG('back', -0.2, 1, { hip_n: 80, kn_n: -10, hip_f: 75, kn_f: -10, sh_n: 80, el_n: 60, sh_f: 80, el_f: 60 }, { e: 'roar' }), FG('back', 1.2, -1, { sh_n: 80, el_n: 0, sh_f: 160 }, { e: 'pain' })),
  figurefour: () => hold('A figure-four', 'FIGURE FOUR!', FG('stand', 0.4, 1, { torso: 20, sh_n: 60, el_n: 40, sh_f: 60, el_f: 40 }), FG('back', 1.4, -1, { hip_n: 30, kn_n: -40 }, { e: 'pain' }),
    FG('back', -0.3, 1, { hip_n: 50, kn_n: -60, hip_f: 70, kn_f: -20, sh_n: 150, sh_f: 140 }, { e: 'roar' }), FG('back', 1.5, -1, { hip_n: 50, kn_n: -60, hip_f: 70, kn_f: -20, sh_n: 120 }, { e: 'pain' })),
  bostoncrab: () => hold('A Boston crab', 'CRAB!', FG('stand', 1.6, -1, { torso: 30, sh_n: 70, el_n: 30, sh_f: 70, el_f: 30 }), FG('front', 0.4, -1, LEGSUP, { e: 'pain' }),
    FG('stand', 1.7, -1, { torso: 40, head: -10, sh_n: 35, el_n: 25, sh_f: 35, el_f: 25, hip_n: 35, kn_n: -55, hip_f: 25, kn_f: -50 }, { y: W_ - 0.5, e: 'roar' }), FG('front', 0.4, -1, { hip_n: -105, kn_n: 15, hip_f: -100, kn_f: 15, torso: -25, head: -25 }, { e: 'pain' })),
  sleeper: () => move('A sleeper hold', [
    { t: 0, figs: { A: FG('fists', -1.2, 1), B: FG('stagger', 0.4, 1), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('stand', -0.2, 1, { sh_n: 95, el_n: 135, sh_f: 95, el_f: 135, torso: 5 }), B: FG('stand', 0.4, 1, { sh_n: 60, el_n: 120, sh_f: 60, el_f: 120, head: -10 }, { e: 'hurt' }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.close },
    { t: 1.3, figs: { A: FG('kneel', -0.1, 1, { sh_n: 95, el_n: 135, sh_f: 95, el_f: 135 }), B: FG('kneel', 0.5, 1, { sh_n: 40, el_n: 90, sh_f: 40, el_f: 90, head: -15 }, { e: 'pain' }), R: REF_(4.5, -4, -1) }, props: [burst('b1', 'SLEEPER!', 2.8, 3.2)], cam3: CM.low },
    { t: 2.2, figs: { A: FG('kneel', -0.1, 1, { sh_n: 95, el_n: 140, sh_f: 95, el_f: 140 }, { e: 'roar' }), B: FG('sit', 0.6, 1, { sh_n: -10, sh_f: -10, head: -25 }, { e: 'pain' }), R: { ...REFK_(3, -2, -1), e: 'shout' } }, props: [], cam3: CM.high }]),
  camelclutch: () => hold('A camel clutch', 'CLUTCH!', FG('stand', 0.6, -1, { torso: 25 }), FG('front', 0.2, -1, {}, { e: 'pain' }),
    FG('sit', 0.6, -1, { sh_n: 80, el_n: 100, sh_f: 80, el_f: 100 }, { y: -1.6, e: 'roar' }), FG('front', 0.2, -1, { torso: -45, head: -35, sh_n: 40, sh_f: 30 }, { e: 'pain' })),
  crossface: () => hold('A crossface', 'CROSSFACE!', FG('kneel', 0.4, 1, { sh_n: 70, el_n: 60 }), FG('front', 1, -1, {}, { e: 'pain' }),
    FG('front', 0.6, 1, { sh_n: 130, el_n: 120, sh_f: 120, el_f: 120, hip_n: 10 }, { y: -1.8, e: 'roar' }), FG('front', 1, -1, { torso: -20, head: -35, sh_n: 100 }, { e: 'pain' })),
  anklelock: () => hold('An ankle lock', 'ANKLE LOCK!', FG('stand', 1.8, -1, { torso: 30, sh_n: 70, el_n: 40 }), FG('front', 0.4, -1, { hip_f: -50, kn_f: 0 }, { e: 'pain' }),
    FG('kneel', 2.0, -1, { torso: -15, sh_n: 70, el_n: 70, sh_f: 70, el_f: 70 }, { e: 'roar' }), FG('front', 0.4, -1, { hip_f: -60, kn_f: 10, torso: -20, head: -25, sh_n: 30 }, { e: 'pain' })),
  abdominal: () => move('An abdominal stretch', [
    { t: 0, figs: { A: FG('fists', -1.3, 1), B: FG('stagger', 0.4, 1), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('stand', -0.3, 1, { sh_n: 90, el_n: 60, hip_n: 25, kn_n: -20 }), B: FG('stand', 0.5, 1, { torso: 10, sh_n: 40, sh_f: -30 }, { e: 'hurt' }), R: REF_(4.5, -4, -1) }, props: [], cam3: CM.close },
    { t: 1.3, figs: { A: FG('stand', -0.2, 1, { sh_n: 150, el_n: 40, sh_f: 60, el_f: 60, hip_n: 35, kn_n: -10, torso: -12 }, { e: 'roar' }), B: FG('stand', 0.5, 1, { torso: -25, head: -20, sh_n: 165, el_n: 10, sh_f: -20, hip_n: -10 }, { r: 12, e: 'pain' }), R: REF_(4.5, -4, -1) }, props: [burst('b1', 'STRETCH!', 2.8, 3.4)], cam3: CM.low },
    { t: 2.2, figs: { A: FG('stand', -0.2, 1, { sh_n: 160, el_n: 30, sh_f: 70, el_f: 60, hip_n: 35, torso: -16 }, { e: 'roar' }), B: FG('stand', 0.5, 1, { torso: -32, head: -25, sh_n: 170, sh_f: -25 }, { r: 16, e: 'shout' }), R: { ...REF_(3, -2, -1), e: 'shout' } }, props: [], cam3: CM.side }]),
};
/* ---------- the moves the parody roster's finishers and signatures are built from (Ryan, 20 October: "building out the
   real life finishers"). Each is a family a classifier in src/86-looks.js (moveSceneOf) maps move names to: a cradle
   tombstone and a spike piledriver are both move_piledriver. ---------- */
const UP = (x: number, f: number, p: Record<string, number> = {}, o: Partial<Fig> = {}) => FG('stand', x, f, { sh_n: 175, sh_f: -175, ...p }, { r: 180, y: W_ - 0.55, ...o });   // upside down, head on the mat
const TOP = (k: string, f = -1, lv = 4.9) => POSED(k, 9.5, 10.6, f, lv);
const TOPCAM = [C3([19, 4, 22], [8.8, 7, 9.4], 40), C3([17, 5, 21], [8.8, 7.5, 9], 42), C3([13, 7, 20], [5.5, 5, 7], 40), C3([10, 9, 19], [3.2, 0.8, 5.4], 32)];
/** Off the top onto somebody flat on the mat: the climb, the leap, the shape in the air, the landing. */
function offTop(name: string, word: string, air: Fig, land: Fig, air2?: Fig): Scene {
  return move(name, [
    { t: 0, figs: { A: TOP('crouch'), B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('point', -3, 2, 1) }, props: [], cam3: TOPCAM[0] },
    { t: 0.9, figs: { A: TOP('leap', -1, 5.1), B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('point', -3, 2, 1) }, props: [], cam3: TOPCAM[1] },
    { t: 1.5, ease: 'even', figs: { A: air, B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('point', -3, 2, 1) }, props: [], cam3: TOPCAM[2] },
    ...(air2 ? [{ t: 1.9, ease: 'even' as const, figs: { A: air2, B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('point', -3, 2, 1) }, props: [], cam3: TOPCAM[2] }] : []),
    { t: air2 ? 2.4 : 2.1, ease: 'in', figs: { A: land, B: POSED('back', 3.2, 5.6, 1, 0, 'pain'), R: POSED('kneel', -1, 3, 1) }, props: [burst('b1', word, 6, 2.4)], cam3: TOPCAM[3] }]);
}
const MORE2: Record<string, () => Scene> = {
  weapon: () => move('A chair shot', [
    { t: 0, figs: { A: FG('stand', -1.8, 1, { sh_n: 60, el_n: 60, sh_f: 50, el_f: 60 }), B: FG('stagger', 1.2, -1), R: REF_(-4.5, -4, 1) }, props: [{ id: 'chair', k: 'chair', x: 0.2, y: 0.2, r: 0, z: 1.1, s: 1, at: 'A:hands' }], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('lift', -1.0, 1, { torso: -10 }, { e: 'roar' }), B: FG('fists', 1.1, -1, { sh_n: 100, el_n: 120, sh_f: 100, el_f: 120 }, { e: 'hurt' }), R: REF_(-4.5, -4, 1) }, props: [{ id: 'chair', k: 'chair', x: 0, y: 0.4, r: 20, z: 1.1, s: 1, at: 'A:hands' }], cam3: CM.close },
    { t: 0.9, ease: 'in', figs: { A: FG('stand', -0.4, 1, { torso: 30, sh_n: 120, el_n: 10, sh_f: 110, el_f: 10, hip_n: 25, kn_n: -20 }, { e: 'roar' }), B: FG('stagger', 1.4, -1, { head: -30 }, { e: 'pain' }), R: REF_(-4.5, -4, 1) }, props: [{ id: 'chair', k: 'chair', x: 0.3, y: 0.3, r: 100, z: 1.1, s: 1, at: 'A:hands' }, burst('b1', 'CLANG!', 3.4, 3.4, PAL.red)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('stand', -0.6, 1, { sh_n: 40, el_n: 30, sh_f: 30 }), B: FG('back', 2.6, -1, {}, { e: 'pain' }), R: { ...REF_(-4.5, -4, 1), e: 'shout' } }, props: [{ id: 'chair', k: 'chair', x: 0.3, y: -0.4, r: 160, z: 1.1, s: 1, at: 'A:hands' }], cam3: CM.high }]),
  cheapshot: () => strike('A cheap shot', 'OW!', { wind: { torso: 20, sh_n: 50, el_n: 120, head: -10 }, hit: { torso: 40, sh_n: 60, el_n: 30, sh_f: -20, hip_n: 30, kn_n: -40 }, ax: 0, bEnd: 'weep', e: 'smirk' }),
  piledriver: () => move('A piledriver', [
    { t: 0, figs: { A: FG('carry', -0.5, 1), B: FG('doubled', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.7, figs: { A: FG('stand', -0.5, 1, { sh_n: 60, el_n: 50, sh_f: 60, el_f: 50, hip_n: 20, kn_n: -30, hip_f: 15, kn_f: -30 }, { e: 'roar' }), B: UP(0.75, -1, { hip_n: 8, hip_f: -8 }, { y: W_ + 1.5, z: 1.3, e: 'shout' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 1.2, figs: { A: FG('stand', -0.5, 1, { sh_n: 45, el_n: 40, sh_f: 45, el_f: 40 }), B: UP(0.75, -1, { hip_n: 8, hip_f: -8 }, { y: W_ + 1.0, z: 1.3 }), R: REF_() }, props: [], cam3: CM.close },
    { t: 1.5, ease: 'in', figs: { A: FG('kneel', -0.5, 1, { sh_n: 45, el_n: 40, sh_f: 45, el_f: 40 }, { e: 'roar' }), B: UP(0.75, -1, { hip_n: 8, hip_f: -8 }, { y: W_ - 0.3, z: 1.3, e: 'pain' }), R: REF_() }, props: [burst('b1', 'SPIKED!', 3, 2.6, PAL.red)], cam3: CM.low },
    { t: 2.2, figs: { A: FG('kneel', -0.8, 1), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  sitout: () => move('A sit-out powerbomb', [
    { t: 0, figs: { A: FG('carry', -0.4, 1), B: FG('doubled', 0.6, -1), R: REF_(4, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.8, figs: { A: FG('carry', -0.4, 1, {}, { e: 'roar' }), B: { x: 0, y: 0.3, r: 0, f: -1, z: 0.6, p: { hip_n: 90, kn_n: -20, hip_f: 85, kn_f: -30, sh_n: 60, el_n: 40, sh_f: 50, el_f: 40 }, e: 'hurt', on: 'A:shoulders' }, R: REF_(4, -4, -1) }, props: [], cam3: CM.side },
    { t: 1.4, figs: { A: FG('lift', -0.4, 1), B: { x: 0, y: 0.6, r: -15, f: -1, z: 0.6, p: { hip_n: 90, kn_n: -20, hip_f: 85, kn_f: -30, sh_n: 120, sh_f: 110 }, e: 'shout', on: 'A:hands' }, R: REF_(4, -4, -1) }, props: [], cam3: C3([-5, 4, 16], [0, 5.5, 0], 36) },
    { t: 1.8, ease: 'in', figs: { A: FG('sit', -0.4, 1, { sh_n: 60, el_n: 40, sh_f: 60, el_f: 40 }, { e: 'roar' }), B: FG('back', 1.3, -1, { hip_n: 80, kn_n: -30 }, { e: 'pain' }), R: REF_(4, -4, -1) }, props: [burst('b1', 'SIT-OUT!', 3.4, 2.6, PAL.red)], cam3: CM.low },
    { t: 2.5, figs: { A: FG('cover', 0.5, 1), B: FG('back', 1.3, -1, {}, { e: 'pain' }), R: POSED('kneel', 3.4, -2, -1) }, props: [], cam3: CM.high }]),
  driver: () => move('A fireman\'s carry driver', [
    { t: 0, figs: { A: FG('carry', -0.4, 1), B: FG('doubled', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.8, figs: { A: FG('carry', -0.3, 1, { sh_n: 100, el_n: 60 }, { e: 'roar' }), B: { x: 0, y: 0.3, r: 90, f: -1, z: 0.6, p: { sh_n: 160, sh_f: 140, hip_n: 10 }, e: 'hurt', on: 'A:shoulders' }, R: REF_() }, props: [], cam3: CM.side },
    { t: 1.3, figs: { A: FG('carry', -0.3, 1, { sh_n: 100, el_n: 60 }), B: { x: 0, y: 0.5, r: 120, f: -1, z: 0.6, p: { sh_n: 160, sh_f: 140, hip_n: 10 }, e: 'shout', on: 'A:shoulders' }, R: REF_() }, props: [], cam3: CM.close },
    { t: 1.7, ease: 'in', figs: { A: FG('sit', -0.5, 1, { sh_n: 80, el_n: 60 }), B: FG('back', 1.2, -1, {}, { y: W_ - 1.4, r: 150, e: 'pain' }), R: REF_() }, props: [burst('b1', 'DRIVEN!', 3.4, 2.4, PAL.red)], cam3: CM.low },
    { t: 2.3, figs: { A: FG('cover', 0.4, 1), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  brainbuster: () => move('A brainbuster', [
    { t: 0, figs: { A: FG('carry', -0.6, 1), B: FG('doubled', 0.5, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.8, figs: { A: FG('lift', -0.5, 1, { sh_n: 150, sh_f: 140 }, { e: 'roar' }), B: UP(-0.3, -1, { hip_n: 6, hip_f: -6 }, { y: W_ + 3.1, e: 'shout' }), R: REF_() }, props: [], cam3: C3([5, 3, 15], [0, 5.5, 0], 36) },
    { t: 1.6, figs: { A: FG('lift', -0.5, 1, { sh_n: 160, sh_f: 150 }), B: UP(-0.3, -1, {}, { y: W_ + 3.1 }), R: REF_() }, props: [], cam3: C3([-5, 3, 15], [0, 5.5, 0], 36) },
    { t: 2.0, ease: 'in', figs: { A: FG('back', -0.8, 1, { sh_n: 160, sh_f: 150 }), B: FG('back', -2.2, 1, {}, { y: W_ - 1.2, r: 150, e: 'pain' }), R: REF_() }, props: [burst('b1', 'BRAINBUSTER!', -4, 2.4, PAL.red)], cam3: CM.low },
    { t: 2.6, figs: { A: FG('sit', -0.6, 1), B: FG('back', -2.6, 1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  cutter: () => move('A cutter', [
    { t: 0, figs: { A: FG('fists', -2, 1), B: FG('stagger', 1.2, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.45, figs: { A: FG('leap', -0.3, 1, { sh_n: 100, el_n: 130, sh_f: 30 }, { y: W_ + 1.3, r: -30, e: 'shout' }), B: FG('stagger', 1.0, -1, { head: 20 }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.75, figs: { A: FG('stand', 0.2, 1, { sh_n: 110, el_n: 140, hip_n: 40, kn_n: -40 }, { y: W_ + 0.2, r: -80 }), B: FG('stand', 0.9, -1, { torso: 40, head: 30 }, { y: W_ - 0.4, r: 40, e: 'hurt' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, ease: 'in', figs: { A: FG('back', 0.0, 1, { sh_n: 110, el_n: 140 }), B: FG('front', 1.5, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'CUTTER!', 3.4, 2.4)], cam3: CM.low },
    { t: 1.7, figs: { A: FG('kneel', 0.2, 1, { sh_n: 165 }, { e: 'roar' }), B: FG('back', 1.7, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  stunner: () => move('A stunner', [
    { t: 0, figs: { A: FG('kick', -1.6, 1), B: FG('doubled', 0.5, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('stand', 0.2, -1, { sh_n: 140, el_n: 150, sh_f: 30 }, { b: true }), B: FG('stand', 0.6, -1, { head: 40, sh_n: 30 }, { e: 'hurt' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.8, ease: 'in', figs: { A: FG('sit', 0.2, -1, { sh_n: 140, el_n: 150 }), B: FG('stand', 0.6, -1, { head: 50, torso: -20, sh_n: 70, sh_f: -70 }, { y: W_ + 0.7, r: 20, e: 'pain' }), R: REF_() }, props: [burst('b1', 'STUNNED!', 3, 3)], cam3: CM.low },
    { t: 1.3, figs: { A: FG('sit', 0.1, -1), B: FG('stagger', 1.6, -1, {}, { r: 30, e: 'pain' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.9, figs: { A: FG('fists', -0.4, 1, {}, { e: 'roar' }), B: FG('back', 2.4, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  spinkick: () => move('A spinning heel kick', [
    { t: 0, figs: { A: FG('fists', -1.8, 1), B: FG('fists', 1.4, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.4, figs: { A: FG('stand', -1.4, 1, { torso: 15, sh_n: 40, sh_f: -40, hip_n: 20 }, { b: true }), B: FG('fists', 1.4, -1), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.7, ease: 'in', figs: { A: FG('kick', -0.6, -1, { hip_n: 110, kn_n: -5, torso: -30 }, { b: true, y: W_ + 0.4, r: 15 }), B: FG('stagger', 1.6, -1, { head: -30 }), R: REF_() }, props: [burst('b1', 'THWACK!', 3.4, 3.4)], cam3: CM.low },
    { t: 1.4, figs: { A: FG('fists', -0.8, 1), B: FG('back', 2.8, -1, {}, { e: 'pain' }), R: REF_() }, props: [], cam3: CM.high }]),
  punch: () => strike('A superman punch', 'POW!', { run: true, wind: { torso: 10, sh_n: -40, el_n: 30, hip_n: 60, kn_n: -80 }, hit: { torso: 20, sh_n: 95, el_n: 0, sh_f: -60, hip_n: 70, kn_n: -60, hip_f: -40 }, hy: 1.3, hr: -10 }),
  facebuster: () => move('A facebuster', [
    { t: 0, figs: { A: FG('fists', -1, 1), B: FG('stagger', 0.8, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('leap', -0.2, 1, { sh_n: 100, el_n: 100, sh_f: 100, el_f: 100 }, { y: W_ + 0.9 }), B: FG('doubled', 0.6, -1, { head: 30 }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.85, ease: 'in', figs: { A: FG('kneel', 0, 1, { sh_n: 90, el_n: 90 }), B: FG('front', 0.8, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'FACE FIRST!', 3.2, 2.4)], cam3: CM.low },
    { t: 1.5, figs: { A: FG('fists', -0.3, 1, {}, { e: 'roar' }), B: FG('front', 0.8, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  bearhug: () => standHold('A bear hug', 'SQUEEZE!', FG('carry', -0.3, 1), FG('stagger', 0.5, -1, {}, { e: 'hurt' }),
    FG('stand', -0.2, 1, { sh_n: 90, el_n: 120, sh_f: 90, el_f: 120, torso: -15 }, { e: 'roar' }), FG('stand', 0.35, -1, { torso: -30, head: -30, sh_n: 160, sh_f: -40 }, { y: W_ + 0.6, e: 'pain' })),
  stomp: () => move('A curb stomp', [
    { t: 0, figs: { A: FG('stand', -1.2, 1), B: FG('kneel', 1, -1, { torso: 60, head: 20, sh_n: -20 }, { e: 'hurt' }), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('leap', 0.3, 1, { hip_n: 70, kn_n: -100 }, { y: W_ + 1.4 }), B: FG('kneel', 1, -1, { torso: 70, head: 25 }), R: REF_() }, props: [], cam3: CM.side },
    { t: 0.9, ease: 'in', figs: { A: FG('stand', 0.6, 1, { hip_n: 60, kn_n: -60, sh_n: 60, sh_f: -60 }, { y: W_ + 0.5 }), B: FG('front', 1.2, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'STOMP!', 3.2, 2.2, PAL.red)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('flex', 0, 1), B: FG('front', 1.2, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  hipattack: () => strike('A running hip attack', 'BUMP!', { run: true, wind: { torso: -10, hip_n: 30 }, hit: { torso: -40, hip_n: 70, kn_n: -50, hip_f: 50, kn_f: -60, sh_n: 120, sh_f: -120 }, hy: 0.9, hr: 70, aEnd: 'sit', bEnd: 'sit' }),
  legdrop: () => move('A leg drop', [
    { t: 0, figs: { A: FG('point', -1.6, 1, { sh_n: 165 }), B: FG('back', 0.8, -1, {}, { e: 'pain' }), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('leap', -0.4, 1, { hip_n: 80, kn_n: -10, hip_f: -10 }, { y: W_ + 1.6 }), B: FG('back', 0.8, -1, {}, { e: 'pain' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 0.95, ease: 'in', figs: { A: FG('sit', 0.1, 1, { hip_n: 90, kn_n: 0, hip_f: 85, kn_f: 0 }), B: FG('back', 0.8, -1, {}, { e: 'pain' }), R: REF_() }, props: [burst('b1', 'LEG DROP!', 3.4, 2.4)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('cover', 0.4, 1), B: FG('back', 0.8, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  splash450: () => offTop('A 450 splash', '450!', { ...POSED('moonsault', 7, 8.6, -1, 6.4), r: 240 }, POSED('splash', 3.6, 5.9, -1, 0.75), { ...POSED('splash', 5, 7.2, -1, 4.2), r: 400 }),
  frogsplash: () => offTop('A frog splash', 'FROG SPLASH!', { ...POSED('leap', 6.4, 8.2, -1, 5.6), p: { sh_n: 120, el_n: 60, sh_f: -120, el_f: -60, hip_n: 60, kn_n: -120, hip_f: -60, kn_f: -120 } }, POSED('splash', 3.5, 5.9, -1, 0.75)),
  senton: () => offTop('A senton bomb', 'SENTON!', { ...POSED('back', 6.4, 8.2, -1, 5.6), r: 200, p: { hip_n: 80, kn_n: -100, hip_f: 75, kn_f: -100, sh_n: 160, sh_f: 150 } }, { ...POSED('back', 3.5, 5.9, -1, 0.6), p: { hip_n: 70, kn_n: -60 } }),
  shootingstar: () => offTop('A shooting star press', 'SHOOTING STAR!', { ...POSED('moonsault', 7.6, 9.2, -1, 6.5), r: 120 }, POSED('splash', 3.5, 5.9, -1, 0.75), { ...POSED('splash', 5.2, 7.4, -1, 4), r: 300 }),
  samoandrop: () => move('A Samoan drop', [
    { t: 0, figs: { A: FG('carry', -0.4, 1), B: FG('doubled', 0.6, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.8, figs: { A: FG('carry', -0.3, 1, { sh_n: 100, el_n: 60 }, { e: 'roar' }), B: { x: 0, y: 0.3, r: 90, f: -1, z: 0.6, p: { sh_n: 160, sh_f: 140, hip_n: 10 }, e: 'hurt', on: 'A:shoulders' }, R: REF_() }, props: [], cam3: CM.side },
    { t: 1.3, figs: { A: FG('stand', -0.6, 1, { torso: -25, sh_n: 120, el_n: 60, hip_n: 20, kn_n: -30 }), B: { x: -0.3, y: 0.6, r: 100, f: -1, z: 0.6, p: { sh_n: 160, sh_f: 140, hip_n: 10 }, e: 'shout', on: 'A:shoulders' }, R: REF_() }, props: [], cam3: CM.close },
    { t: 1.7, ease: 'in', figs: { A: FG('back', -0.8, 1, { sh_n: 120, el_n: 60 }), B: FG('back', -0.2, -1, {}, { y: W_ - 0.9, e: 'pain' }), R: REF_() }, props: [burst('b1', 'SAMOAN DROP!', 3.2, 2.6, PAL.red)], cam3: CM.low },
    { t: 2.4, figs: { A: FG('kneel', -1.2, 1, { sh_n: 160 }, { e: 'roar' }), B: FG('back', 0.6, -1, {}, { e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  uranage: () => move('An uranage', [
    { t: 0, figs: { A: FG('fists', -1.2, 1), B: FG('stagger', 0.8, -1), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('lift', -0.3, 1, { torso: 10, sh_n: 80, el_n: 60, sh_f: 100, el_f: 40 }, { z: 0.5 }), B: FG('stand', 0.4, -1, { torso: 15, sh_n: 40 }, { z: -0.3, e: 'hurt' }), R: REF_() }, props: [], cam3: CM.side },
    { t: 1.0, figs: { A: FG('stand', -0.3, 1, { torso: -15, sh_n: 150, el_n: 20, sh_f: 140, el_f: 20, hip_n: 15, kn_n: -20 }, { z: 0.5, e: 'roar' }), B: FG('back', 0.3, -1, { hip_n: 30, kn_n: -20 }, { y: W_ + 2.4, r: 200, z: -0.3, e: 'shout' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 1.35, ease: 'in', figs: { A: FG('kneel', -0.3, 1, { sh_n: 60, el_n: 40, sh_f: 60, el_f: 40 }, { z: 0.5 }), B: FG('back', 1.0, -1, {}, { z: -0.3, e: 'pain' }), R: REF_() }, props: [burst('b1', 'URANAGE!', 3.4, 2.4, PAL.red)], cam3: CM.low },
    { t: 2.0, figs: { A: FG('cover', 0.4, 1, {}, { z: 0.3 }), B: FG('back', 1.0, -1, {}, { z: -0.3, e: 'pain' }), R: REFK_() }, props: [], cam3: CM.high }]),
  guillotine: () => standHold('A guillotine choke', 'CHOKED!', FG('fists', -0.8, 1), FG('doubled', 0.5, -1, {}, { e: 'hurt' }),
    FG('stand', -0.3, 1, { torso: -10, sh_n: 70, el_n: 110, sh_f: 60, el_f: 120, hip_n: 15, kn_n: -20, hip_f: -15, kn_f: -20 }, { e: 'roar' }), FG('doubled', 0.35, -1, { head: 30, sh_n: 120, el_n: 20, sh_f: 100 }, { e: 'pain' })),
  rollup: () => move('A roll-up', [
    { t: 0, figs: { A: FG('stagger', -0.8, 1), B: FG('fists', 1.2, -1, {}, { e: 'snarl' }), R: REF_() }, props: [], cam3: CM.wide },
    { t: 0.4, figs: { A: FG('crouch', 0.2, 1, { sh_n: 100, el_n: 30, sh_f: 100, el_f: 30 }, { e: 'shout' }), B: FG('stand', 1.0, -1, { torso: -20, sh_n: 60, sh_f: -60 }, { e: 'shout' }), R: REF_() }, props: [], cam3: CM.close },
    { t: 0.8, ease: 'in', figs: { A: FG('cover', 0.4, 1, { sh_f: -150 }, { e: 'shout' }), B: FG('back', 1.0, -1, { hip_n: 120, kn_n: -60, hip_f: 115, kn_f: -60 }, { e: 'shout' }), R: REFK_(-2.8, -1.6, 1) }, props: [burst('b1', 'ROLLED UP!', 3.4, 2.4)], cam3: CM.low },
    { t: 1.5, figs: { A: FG('cover', 0.4, 1, { sh_f: -150 }, { e: 'shout' }), B: FG('back', 1.0, -1, { hip_n: 120, kn_n: -60, hip_f: 115, kn_f: -60 }, { e: 'pain' }), R: REFK_(-2.8, -1.6, 1) }, props: [], cam3: CM.close }]),
};
/* ---------- more of the back and forth: on the floor, the referee down, the comeback ---------- */
const FL = (k: string, x: number, z: number, f: number, e?: string) => POSED(k, x, z, f, -3, e);   // standing on the floor outside the ring
const FLCAM = C3([12.6, 4, 21], [12.6, 0, 0], 40), FLCAM2 = C3([16, 3, 18], [12.8, 0, 0], 38);
export const MID_MORE: Scene[] = flourishAll([
  { v: 1, id: 'floor_brawl', name: 'A fight on the floor', when: 'mid', set: 'ring', slots: MOVE_SLOTS, keys: [
    { t: 0, figs: { A: FL('fists', 11.6, 0.6, 1), B: FL('fists', 13.4, 0.2, -1), R: POSED('point', 9, 0, 1) }, props: [], cam3: FLCAM },
    { t: 0.5, figs: { A: FL('punch', 12.2, 0.6, 1, 'roar'), B: FL('stagger', 13.6, 0.2, -1), R: { ...POSED('point', 9, 0, 1), p: { sh_n: 160, el_n: 10, sh_f: 30 }, e: 'shout' } }, props: [burst('b1', 'POW!', 14, -0.6)], cam3: FLCAM2 },
    { t: 1.0, figs: { A: FL('fists', 12.0, 0.6, 1), B: FL('punch', 13.0, 0.2, -1, 'roar'), R: { ...POSED('point', 9, 0, 1), p: { sh_n: 160, el_n: 10, sh_f: 30 }, e: 'shout' } }, props: [burst('b2', 'WHACK!', 11.2, -0.6)], cam3: FLCAM },
    { t: 1.6, figs: { A: FL('charge', 12.8, 0.6, 1, 'roar'), B: { ...FL('stagger', 14.4, 0.2, -1), r: -25 }, R: POSED('point', 9, 0, 1) }, props: [], cam3: FLCAM2 },
    { t: 2.2, figs: { A: FL('point', 13, 0.6, 1), B: { ...FL('corner', 14.8, 0.2, -1), y: -3 + W_ - 0.8 }, R: POSED('point', 9, 0, 1) }, props: [burst('b3', 'INTO THE BARRIER!', 14, 1.4, PAL.red)], cam3: FLCAM }] },
  { v: 1, id: 'ref_bump', name: 'The referee goes down', when: 'mid', set: 'ring', slots: MOVE_SLOTS, keys: [
    { t: 0, figs: { A: FG('charge', -3.4, 1), B: FG('stand', 1.6, -1), R: STD(0.4, -1, { sh_n: 100, el_n: 10 }, 'shout', 0.2) }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('charge', -1.2, 1, {}, { e: 'roar' }), B: FG('doubled', 2.6, -1), R: STD(0.4, -1, { sh_n: 100, el_n: 10 }, 'shout', 0.2) }, props: [], cam3: CM.close },
    { t: 0.8, ease: 'in', figs: { A: FG('stand', -0.2, 1, { torso: 16, sh_n: 100, el_n: 0, hip_n: 34, kn_n: -24 }), B: FG('doubled', 2.6, -1), R: { ...POSED('back', 1.4, 0.2, -1, 0, 'pain'), y: W_ + 0.4, r: 120 } }, props: [burst('b1', 'NO! THE REFEREE!', 3, 3.4, PAL.red)], cam3: CM.low },
    { t: 1.5, figs: { A: FG('stand', -0.4, 1, { sh_n: 60, el_n: 100, sh_f: 60, el_f: 100, head: -10 }, { e: 'shout' }), B: FG('stand', 2.6, -1, { sh_n: 100, el_n: 120 }, { e: 'shout' }), R: POSED('back', 1.8, 0.2, -1, 0, 'pain') }, props: [], cam3: CM.high }] },
  { v: 1, id: 'comeback', name: 'Fired up', when: 'mid', set: 'ring', slots: MOVE_SLOTS, keys: [
    { t: 0, figs: { A: FG('kneel', -0.4, 1, { head: -20, sh_n: 20, el_n: 90, sh_f: 20, el_f: 90 }, { e: 'pain' }), B: FG('fists', 1.6, -1, {}, { e: 'smirk' }), R: REF_(-4.5, -4, 1) }, props: [], cam3: CM.close },
    { t: 0.8, figs: { A: FG('stand', -0.4, 1, { sh_n: 80, el_n: 110, sh_f: 80, el_f: 110, head: 10 }, { e: 'roar' }), B: FG('fists', 1.5, -1, { sh_n: 95, el_n: 5 }), R: REF_(-4.5, -4, 1) }, props: [burst('b1', 'FIRED UP!', -3, 4.4)], cam3: CM.low },
    { t: 1.2, figs: { A: FG('punch', 0.2, 1, {}, { e: 'roar' }), B: FG('stagger', 1.6, -1), R: REF_(-4.5, -4, 1) }, props: [], cam3: CM.close },
    { t: 1.6, figs: { A: { ...FG('punch', 0.6, 1, {}, { e: 'roar' }), p: { torso: 12, sh_f: 95, el_f: 5, sh_n: 30, el_n: 90, hip_n: 30, kn_n: -20 } }, B: FG('stagger', 2.2, -1), R: REF_(-4.5, -4, 1) }, props: [burst('b2', 'POW! POW!', 3.6, 3.6)], cam3: CM.close },
    { t: 2.1, figs: { A: FG('flex', 0.6, 1), B: FG('back', 3, -1, {}, { e: 'pain' }), R: REF_(-4.5, -4, 1) }, props: [], cam3: CM.wide }] },
]);
/* ---------- how a match ends: a tap-out, a roll-up out of nowhere, a handful of tights, a disqualification ---------- */
const finScene2 = (id: string, name: string, when: string, keys: Key[]): Scene => ({ v: 1, id, name, when, set: 'ring', slots: MOVE_SLOTS, keys });
export const FIN_MORE: Scene[] = flourishAll([
  finScene2('fin_tap', 'Tapping out', 'finish_sub', [
    { t: 0, figs: { A: FG('kneel', -0.2, 1, { sh_n: 95, el_n: 135, sh_f: 95, el_f: 135 }, { e: 'roar' }), B: FG('sit', 0.4, 1, { head: -20, sh_n: 40, el_n: 90 }, { e: 'pain' }), R: REFK_(3, -2, -1) }, props: [], cam3: CM.close },
    { t: 0.7, figs: { A: FG('kneel', -0.2, 1, { sh_n: 95, el_n: 140, sh_f: 95, el_f: 140 }, { e: 'roar' }), B: FG('sit', 0.4, 1, { head: -25, sh_n: 90, el_n: 10 }, { e: 'pain' }), R: { ...REFK_(3, -2, -1), e: 'shout' } }, props: [burst('b1', 'TAP!', 2.6, 2.4)], cam3: CM.low },
    { t: 1.1, figs: { A: FG('kneel', -0.2, 1, { sh_n: 95, el_n: 140, sh_f: 95, el_f: 140 }), B: FG('sit', 0.4, 1, { head: -25, sh_n: 70, el_n: 10 }, { e: 'pain' }), R: { ...REFK_(3, -2, -1), e: 'shout' } }, props: [burst('b1', 'TAP! TAP!', 2.6, 2.4)], cam3: CM.low },
    { t: 1.8, figs: { A: FG('stand', -0.6, 1, { sh_n: 160, el_n: 10, sh_f: -150 }, { e: 'shout' }), B: FG('back', 1.4, -1, {}, { e: 'pain' }), R: STD(0.6, -1, { sh_n: 150, el_n: 10, sh_f: 10 }, 'shout', 0.3) }, props: [burst('b2', 'IT\'S OVER!', 3.4, 3.4, PAL.red)], cam3: CM.wide }]),
  finScene2('fin_rollup', 'A roll-up out of nowhere', 'finish_flash', [
    { t: 0, figs: { A: FG('stagger', -0.8, 1), B: FG('charge', 1.6, -1, {}, { e: 'roar' }), R: REF_(4, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('kneel', -0.2, 1, { sh_n: 90, el_n: 60, sh_f: 90, el_f: 60, torso: 30 }), B: FG('doubled', 0.5, -1, {}, { e: 'hurt' }), R: REF_(4, -4, -1) }, props: [], cam3: CM.close },
    { t: 0.9, ease: 'in', figs: { A: FG('cover', 0.1, 1), B: FG('back', 0.6, -1, { hip_n: 70, kn_n: -60, hip_f: 65, kn_f: -60 }, { e: 'shout' }), R: POSED('kneel', 3.2, -1.5, -1) }, props: [burst('b1', 'ONE, TWO...', 3.4, 3)], cam3: CM.low },
    { t: 1.6, figs: { A: FG('cover', 0.1, 1), B: FG('back', 0.6, -1, { hip_n: 70, kn_n: -60, hip_f: 65, kn_f: -60 }, { e: 'shout' }), R: POSED('kneel', 3.2, -1.5, -1) }, props: [burst('b1', 'THREE!', 3.4, 3, PAL.red)], cam3: CM.low },
    { t: 2.3, figs: { A: FG('point', -0.6, 1, { sh_n: 160 }, { e: 'smirk' }), B: FG('sit', 1.0, -1, { sh_n: 100, el_n: 120 }, { e: 'shout' }), R: STD(2.6, -1, { sh_n: 100, el_n: 10 }, 'shout', 0.3) }, props: [], cam3: CM.wide }]),
  finScene2('fin_tights', 'A handful of tights', 'finish_cheap', [
    { t: 0, figs: { A: FG('kneel', -0.3, 1, { sh_n: 60, el_n: 40 }), B: FG('back', 0.8, -1, {}, { e: 'pain' }), R: REF_(4, -5, -1) }, props: [], cam3: CM.close },
    { t: 0.6, figs: { A: FG('cover', 0.2, 1, { sh_f: -150 }, { e: 'smirk' }), B: FG('back', 0.8, -1, {}, { e: 'pain' }), R: POSED('kneel', 3, -1.5, -1) }, props: [burst('b1', 'TIGHTS!', -2.4, 3.2)], cam3: CM.low },
    { t: 1.2, figs: { A: FG('cover', 0.2, 1, { sh_f: -150 }, { e: 'smirk' }), B: FG('back', 0.8, -1, {}, { e: 'shout' }), R: POSED('kneel', 3, -1.5, -1) }, props: [burst('b1', 'THREE!', 3.4, 3, PAL.red)], cam3: CM.low },
    { t: 1.9, figs: { A: FG('stand', -1.2, 1, { sh_n: 160, el_n: 10 }, { e: 'smirk' }), B: FG('sit', 0.8, -1, { sh_n: 95, el_n: 5 }, { e: 'shout' }), R: STD(2.4, -1, { sh_n: 60, el_n: 100, sh_f: 60, el_f: 100 }, '', 0.3) }, props: [], cam3: CM.wide }]),
  finScene2('fin_dq', 'Disqualified', 'finish_dq', [
    { t: 0, figs: { A: FG('lift', -0.6, 1, {}, { e: 'roar' }), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REF_(3.6, -4, -1) }, props: [{ id: 'chair', k: 'chair', x: 0, y: 0.4, r: 20, z: 1.1, s: 1, at: 'A:hands' }], cam3: CM.wide },
    { t: 0.6, ease: 'in', figs: { A: FG('stand', 0, 1, { torso: 40, sh_n: 120, el_n: 10, sh_f: 110, el_f: 10, hip_n: 25, kn_n: -20 }, { e: 'roar' }), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: REF_(3.6, -4, -1) }, props: [{ id: 'chair', k: 'chair', x: 0.3, y: -0.3, r: 120, z: 1.1, s: 1, at: 'A:hands' }, burst('b1', 'CLANG!', 2.4, 2.2, PAL.red)], cam3: CM.low },
    { t: 1.2, figs: { A: FG('stand', -0.4, 1, { sh_n: 40, el_n: 30 }), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: STD(2.2, -1, { sh_n: 165, el_n: 5, sh_f: -165, el_f: -5 }, 'shout', 0.3) }, props: [{ id: 'chair', k: 'chair', x: 0.3, y: -0.6, r: 160, z: 1.1, s: 1, at: 'A:hands' }, burst('b2', 'DISQUALIFIED!', 3.6, 4, PAL.red)], cam3: CM.close },
    { t: 1.9, figs: { A: FG('point', -1, 1, { sh_n: 100 }, { e: 'snarl' }), B: FG('back', 1.2, -1, {}, { e: 'pain' }), R: STD(2.2, -1, { sh_n: 100, el_n: 10, sh_f: -100, el_f: -10 }, 'shout', 0.3) }, props: [{ id: 'chair', k: 'chair', x: 0.3, y: -0.6, r: 160, z: 1.1, s: 1, at: 'A:hands' }], cam3: CM.wide }]),
]);
/* ---------- tag team matches (Ryan, 20 October): the hot tag, a double team, the ring cut in half. Four wrestlers: A and
   their partner C, B and their partner D (hooks pa and pb, filled from the match's sides). A partner stands on the apron
   outside the ropes, by their corner, until they are tagged in. ---------- */
const TAG_SLOTS: Slot[] = [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }, { id: 'C', n: 'Partner of A', role: 'c', hook: 'pa' }, { id: 'D', n: 'Partner of B', role: 'c', hook: 'pb' }, { id: 'R', n: 'The referee', role: 'ref' }];
const APRON = (x: number, f: number, p: Record<string, number> = {}, e?: string): Fig => ({ ...POSED('stand', x, 0.2, f), p: { sh_n: 40, el_n: 20, ...p }, e });
const TAGCAM = C3([-3, 7, 26], [-3, 3, 0], 40), TAGCAM2 = C3([2, 6, 22], [-1, 3, 0], 38);
const tagScene = (id: string, name: string, keys: Key[]): Scene => ({ v: 1, id, name, when: 'tag', set: 'ring', slots: TAG_SLOTS, keys });
export const TAG_SCENES: Scene[] = flourishAll([
  tagScene('tag_hot', 'The hot tag', [
    { t: 0, figs: { A: POSED('front', -4.5, 0, 1, 0, 'pain'), B: FG('doubled', -2.2, -1, { sh_n: 80, el_n: 20 }), C: APRON(-10.8, 1, { sh_n: 100, el_n: 0 }, 'shout'), D: APRON(10.8, -1), R: REF_(0, -4, -1) }, props: [], cam3: TAGCAM },
    { t: 0.8, figs: { A: { ...POSED('dive', -7.4, 0, -1), y: W_ - 1.2, e: 'shout' }, B: FG('stand', -3.4, -1, { sh_n: 90, el_n: 0 }, { e: 'shout' }), C: APRON(-10.8, 1, { sh_n: 110, el_n: 0 }, 'shout'), D: APRON(10.8, -1), R: REF_(0, -4, -1) }, props: [], cam3: TAGCAM },
    { t: 1.2, figs: { A: POSED('front', -8.6, 0, -1, 0, 'pain'), B: FG('fists', -3, -1), C: { ...POSED('leap', -8.4, 0.6, 1), y: W_ + 1.6, e: 'roar' }, D: APRON(10.8, -1), R: { ...REF_(0, -4, -1), p: { sh_n: 100, el_n: 0 } } }, props: [burst('b1', 'TAG!', -8, 5)], cam3: TAGCAM },
    { t: 1.7, figs: { A: APRON(-10.8, 1, {}, 'hurt'), B: FG('fists', -1.6, -1), C: POSED('charge', -4.4, 0.4, 1), D: APRON(10.8, -1), R: REF_(0, -4, -1) }, props: [], cam3: TAGCAM2 },
    { t: 2.1, ease: 'in', figs: { A: APRON(-10.8, 1, { sh_n: 160 }, 'shout'), B: FG('back', 0.2, -1, {}, { e: 'pain' }), C: { ...FG('stand', -1.6, 1, { torso: 16, sh_n: 100, el_n: 0, sh_f: -40, hip_n: 34, kn_n: -24, hip_f: -28 }, { e: 'roar' }), z: 0.4 }, D: APRON(10.8, -1, { sh_n: 60 }, 'shout'), R: REF_(0, -4, -1) }, props: [burst('b2', 'HOT TAG!', 1.6, 3.4, PAL.red)], cam3: TAGCAM2 }]),
  tagScene('tag_double', 'A double team', [
    { t: 0, figs: { A: FG('fists', -2.2, 1), C: { ...FG('fists', -3.8, 1), z: -0.8 }, B: FG('stagger', 0.6, -1), D: APRON(10.8, -1), R: REF_(3.5, -4, -1) }, props: [], cam3: CM.wide },
    { t: 0.6, figs: { A: FG('charge', -1.2, 1), C: { ...FG('charge', -2.8, 1), z: -0.8 }, B: FG('stagger', 0.6, -1), D: APRON(10.8, -1, { sh_n: 100 }, 'shout'), R: { ...REF_(3.5, -4, -1), p: { sh_n: 100, el_n: 0 }, e: 'shout' } }, props: [], cam3: CM.close },
    { t: 1.0, ease: 'in', figs: { A: FG('stand', 0, 1, { torso: 14, sh_n: 95, el_n: 0, hip_n: 30, kn_n: -20 }, { e: 'roar' }), C: { ...FG('stand', -1.4, 1, { torso: 14, sh_n: 95, el_n: 0, hip_n: 30, kn_n: -20 }, { e: 'roar' }), z: -0.8 }, B: FG('back', 1.0, -1, {}, { y: W_ + 0.6, r: 140, e: 'pain' }), D: APRON(10.8, -1), R: REF_(3.5, -4, -1) }, props: [burst('b1', 'DOUBLE TEAM!', 3.6, 3.4, PAL.red)], cam3: CM.low },
    { t: 1.7, figs: { A: FG('point', 0.2, 1, { sh_n: 165 }), C: { ...FG('point', -1.6, 1, { sh_n: 165 }), z: -0.8 }, B: FG('back', 2, -1, {}, { e: 'pain' }), D: APRON(10.8, -1), R: REF_(3.5, -4, -1) }, props: [], cam3: CM.high }]),
  tagScene('tag_cutoff', 'Cutting the ring in half', [
    { t: 0, figs: { B: FG('stand', 6.2, -1, { sh_n: 60, el_n: 40 }, { e: 'snarl' }), A: POSED('sit', 7.6, 0.2, -1, 0, 'pain'), D: APRON(10.8, -1, { sh_n: 60, el_n: 90 }, 'snarl'), C: APRON(-10.8, 1, { sh_n: 110, el_n: 0 }, 'shout'), R: REF_(0, -4, 1) }, props: [], cam3: C3([3, 7, 26], [3, 3, 0], 40) },
    { t: 0.6, figs: { B: FG('kick', 6.4, -1, { hip_n: 50, kn_n: -40 }, { e: 'roar' }), A: POSED('sit', 7.8, 0.2, -1, 0, 'pain'), D: APRON(10.8, -1, { sh_n: 160 }, 'roar'), C: APRON(-10.8, 1, { sh_n: 110, el_n: 0 }, 'shout'), R: { ...REF_(0, -4, 1), p: { sh_n: 100, el_n: 0 }, e: 'shout' } }, props: [burst('b1', 'STOMP!', 8.6, 2.6)], cam3: C3([5, 5, 19], [6, 2.6, 0], 36) },
    { t: 1.2, figs: { B: FG('stand', 6.6, -1, { sh_n: 100, el_n: 0 }, { e: 'shout' }), A: POSED('back', 7.8, 0.2, -1, 0, 'pain'), D: APRON(10.8, -1, { sh_n: 100, el_n: 0 }, 'shout'), C: APRON(-10.8, 1, { sh_n: 165, el_n: 0 }, 'shout'), R: REF_(0, -4, 1) }, props: [], cam3: C3([3, 7, 26], [3, 3, 0], 40) },
    { t: 1.8, figs: { B: FG('stand', 8.6, 1, { sh_n: 100, el_n: 0 }, { b: true }), A: POSED('back', 7.8, 0.2, -1, 0, 'pain'), D: APRON(10.8, -1, { sh_n: 110, el_n: 0 }, 'smirk'), C: APRON(-10.8, 1, { sh_n: 60 }, 'snarl'), R: REF_(0, -4, 1) }, props: [burst('b2', 'TAG!', 9.6, 5)], cam3: C3([3, 7, 26], [3, 3, 0], 40) }]),
  // the save: A covers B, the referee counts, and B's partner comes off the apron to break it up
  tagScene('tag_save', 'The save', [
    { t: 0, figs: { A: FG('cover', -0.4, 1, { sh_f: -150 }), B: FG('back', 0.4, -1, {}, { e: 'pain' }), R: REFK_(-2.6, -1.6, 1), C: APRON(-10.8, 1, { sh_n: 120, el_n: 10 }, 'shout'), D: APRON(10.8, -1, { sh_n: 60 }, 'shout') }, props: [burst('b1', 'ONE!', -3.4, 3)], cam3: TAGCAM2 },
    { t: 0.6, figs: { A: FG('cover', -0.4, 1, { sh_f: -150 }), B: FG('back', 0.4, -1, {}, { e: 'pain' }), R: REFK_(-2.6, -1.6, 1), C: APRON(-10.8, 1, { sh_n: 160, el_n: 0 }, 'shout'), D: POSED('charge', 6.4, 0.6, -1, 0, 'roar') }, props: [burst('b1', 'TWO!', -3.4, 3)], cam3: TAGCAM2 },
    { t: 1.0, ease: 'in', figs: { A: { ...FG('cover', -0.4, 1, { sh_f: -150 }), e: 'pain' }, B: FG('back', 0.4, -1, {}, { e: 'pain' }), R: REFK_(-2.6, -1.6, 1), C: APRON(-10.8, 1, { sh_n: 100 }, 'shout'), D: { ...POSED('elbow', 0, 0.9, -1, 0, 'roar'), y: W_ + 1.4 } }, props: [burst('b2', 'BROKEN UP!', 2.6, 4.2, PAL.red)], cam3: CM.low },
    { t: 1.7, figs: { A: POSED('back', -1.4, 0, 1, 0, 'pain'), B: POSED('sit', 1, 0, -1, 0, 'pain'), R: { ...STD(-3.4, 1, { sh_n: 100, el_n: 0 }, 'shout', -1.6) }, C: APRON(-10.8, 1, { sh_n: 60, el_n: 90 }, 'snarl'), D: FG('point', 3.4, -1, { sh_n: 140 }, { e: 'roar', z: 1 }) }, props: [], cam3: CM.wide }]),
  // the double suplex: both partners lift B together and drop them on their back
  tagScene('tag_dsuplex', 'A double suplex', [
    { t: 0, figs: { A: FG('lift', -0.9, 1, {}, { z: -0.7 }), C: FG('lift', -0.9, 1, {}, { z: 0.7 }), B: FG('doubled', 0.5, -1, { sh_n: 60 }), D: APRON(10.8, -1, { sh_n: 100 }, 'shout'), R: REF_(4, -4, -1) }, props: [], cam3: CM.side },
    { t: 0.7, figs: { A: FG('stand', -0.9, 1, { torso: -10, sh_n: 170, el_n: 10, sh_f: 170, el_f: 10 }, { z: -0.7, e: 'roar' }), C: FG('stand', -0.9, 1, { torso: -10, sh_n: 170, el_n: 10, sh_f: 170, el_f: 10 }, { z: 0.7, e: 'roar' }), B: { ...POSED('stand', -0.6, 0, -1), y: W_ + 3.2, r: 180, e: 'shout' }, D: APRON(10.8, -1, { sh_n: 160 }, 'shout'), R: REF_(4, -4, -1) }, props: [], cam3: CM.side },
    { t: 1.1, ease: 'in', figs: { A: POSED('back', -2, -0.7, 1, 0, 'roar'), C: POSED('back', -2, 0.7, 1, 0, 'roar'), B: { ...POSED('back', -2.6, 0, -1, 0, 'pain'), x: -5 }, D: APRON(10.8, -1, { sh_n: 60, el_n: 90 }, 'snarl'), R: REF_(4, -4, -1) }, props: [burst('b1', 'DOUBLE SUPLEX!', 0.6, 4, PAL.red)], cam3: CM.low },
    { t: 1.8, figs: { A: FG('point', -2.8, 1, { sh_n: 160 }, { z: -1, e: 'roar' }), C: FG('point', -1.2, -1, { sh_n: 160 }, { z: 1, e: 'roar' }), B: POSED('back', -5, 0, -1, 0, 'pain'), D: APRON(10.8, -1, { sh_n: 60, el_n: 90 }, 'snarl'), R: REF_(4, -4, -1) }, props: [], cam3: CM.wide }]),
  // all four at once: the referee has lost control, two fights in the ring
  tagScene('tag_brawl', 'All four in the ring', [
    { t: 0, figs: { A: FG('fists', -3.6, 1, {}, { z: -1.4 }), B: FG('fists', -1.4, -1, {}, { z: -1.4 }), C: FG('fists', 1.4, 1, {}, { z: 1.2 }), D: FG('fists', 3.6, -1, {}, { z: 1.2 }), R: { ...STD(6.6, -1, { sh_n: 100, el_n: 0, sh_f: 100, el_f: 0 }, 'shout', -3) } }, props: [], cam3: CM.wide },
    { t: 0.5, figs: { A: FG('punch', -3.2, 1, {}, { z: -1.4, e: 'roar' }), B: FG('stagger', -1.4, -1, {}, { z: -1.4, e: 'pain' }), C: FG('fists', 1.4, 1, {}, { z: 1.2 }), D: FG('punch', 3.2, -1, {}, { z: 1.2, e: 'roar' }), R: { ...STD(6.6, -1, { sh_n: 165, el_n: 0, sh_f: 165, el_f: 0 }, 'shout', -3) } }, props: [burst('b1', 'BRAWL!', 0, 5)], cam3: CM.wide },
    { t: 1.0, figs: { A: FG('fists', -3.4, 1, {}, { z: -1.4 }), B: FG('punch', -1.8, -1, {}, { z: -1.4, e: 'roar' }), C: FG('punch', 1.8, 1, {}, { z: 1.2, e: 'roar' }), D: FG('stagger', 3.8, -1, {}, { z: 1.2, e: 'pain' }), R: { ...STD(6.6, -1, { sh_n: 100, el_n: 0, sh_f: 100, el_f: 0 }, 'shout', -3) } }, props: [], cam3: CM.close },
    { t: 1.6, ease: 'in', figs: { A: FG('kick', -3, 1, { hip_n: 70, kn_n: -10 }, { z: -1.4, e: 'roar' }), B: { ...FG('back', -0.8, -1, {}, { z: -1.4, e: 'pain' }) }, C: FG('fists', 1.6, 1, {}, { z: 1.2 }), D: POSED('sit', 4.4, 1.2, -1, 0, 'pain'), R: { ...STD(6.6, -1, { sh_n: 165, el_n: 0, sh_f: 165, el_f: 0 }, 'shout', -3) } }, props: [burst('b2', 'CHAOS!', 0.4, 4.2, PAL.red)], cam3: CM.wide }]),
]);
/** The moves as scenes of their own, kind 'move', so a wrestler can take one as a finisher or a signature (Create a Wrestler, Moves). */
export const MOVES: Scene[] = Object.keys(CLASSIC).map(k => flourish({ ...CLASSIC[k](), id: 'move_' + k, when: 'move' })).concat(Object.keys(MORE).map(k => flourish({ ...MORE[k](), id: 'move_' + k, when: 'move' })), Object.keys(MORE2).map(k => flourish({ ...MORE2[k](), id: 'move_' + k, when: 'move' })));
/* ---------- a new scene starts from a setup: the set and the people placed for it ---------- */
export const SETUPS: [string, string][] = [['ring', 'The ring: two wrestlers and the referee'], ['desk', 'The commentary desk, its chairs and a guest seat'], ['ramp', 'The entrance ramp'],
  ['hall', 'Backstage: two in the hallway'], ['locker', 'The locker room'], ['office', 'The office, across the desk'], ['talk', 'A talk show: a host and a guest'], ['cage', 'A steel cage: two wrestlers inside'], ['lot', 'The parking lot'], ['news', 'A news desk: the anchor'], ['stadium', 'A packed stadium: two wrestlers in the ring'], ['rafters', 'Up in the rafters'], ['royal', 'The ring: ten wrestlers (a battle royal)'], ['topdive', 'Classic: a splash off the top rope'], ['moonsault', 'Classic: a moonsault off the top'], ['tope', 'Classic: a dive to the outside'],
  ['cornerhit', 'Classic: a charge into the corner'], ['superplex', 'Classic: a superplex off the top'], ['clothesline', 'A move: a clothesline'], ['spear', 'A move: a spear'], ['suplex', 'A move: a vertical suplex'], ['powerbomb', 'A move: a powerbomb'], ['ddt', 'A move: a DDT'], ['plain', 'Plain card']];
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
  if (id === 'stadium') return base('stadium', [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }], { A: STD(-1.8, 1, {}, '', 0.4), B: STD(1.8, -1, {}, '', 0.6) });
  if (id === 'rafters') return base('rafters', [{ id: 'A', n: 'Wrestler A', role: 'a' }], { A: STD(-0.4, 1, { sh_n: 40, el_n: 30, sh_f: -30 }, '', 0.4) });
  if (id === 'lot') return base('lot', [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }], { A: STD(0.6, 1, {}, '', 0.4), B: STD(3.4, -1, {}, '', 0.6) });
  if (id === 'news') return base('news', [{ id: 'A', n: 'The anchor', role: 'c', dress: 'suit' }], { A: { x: -1.2, y: -0.75, r: 0, f: 1, z: 0, p: SEAT, e: 'talk' } }, { x: -0.4, y: 0.1, z: 1.15 });
  if (CLASSIC[id]) return CLASSIC[id]();
  if (id === 'royal') {   // ten in the ring, two rows of five, facing in toward the middle (Ryan, 19 October: "up to 10 people in the 3d ring")
    const slots: Slot[] = [], figs: Record<string, Fig> = {};
    for (let i = 0; i < 10; i++) { const id2 = String.fromCharCode(65 + i), row = i < 5 ? 0 : 1, col = i % 5, x = -6 + col * 3 + (row ? 1.5 : 0);
      slots.push({ id: id2, n: 'Wrestler ' + id2, role: i === 0 ? 'a' : i === 1 ? 'b' : 'c' }); figs[id2] = STD(x, x < 0 ? 1 : -1, {}, '', row ? -3 : 3); }
    slots.push({ id: 'R', n: 'The referee', role: 'ref' }); figs.R = STD(7.5, -1, {}, '', 0);
    return { ...base('ring', slots, figs), keys: [{ t: 0, figs, props: [], cam3: { p: [0, 12, 26], t: [0, 2.5, 0], fov: 34 } }] };
  }
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
/* ---------- the scenes of the show: one for every promo and angle a player can book (rule 9c) ---------- */
/** Booked segments by kind, as their scenes' "Plays at": a scene with when "seg_" and a kind plays when that kind is on the air. */
export const SEG_WHEN: [string, string][] = [['seg_interview', 'Booked: an interview'], ['seg_callout', 'Booked: a call-out'], ['seg_words', 'Booked: a war of words'], ['seg_challenge', 'Booked: a title challenge'],
  ['seg_faceoff', 'Booked: a face-off'], ['seg_ambush', 'Booked: an ambush'], ['seg_brawl', 'Booked: a brawl'], ['seg_save', 'Booked: a save'], ['seg_turn', 'Booked: a turn'], ['seg_signing', 'Booked: a contract signing'], ['seg_recap', 'Booked: a video recap']];
const SA: Slot[] = [{ id: 'A', n: 'Who it is about', role: 'a' }], SAB: Slot[] = [{ id: 'A', n: 'The first named', role: 'a' }, { id: 'B', n: 'The second named', role: 'b' }];
const MIC_UP = { sh_n: 150, el_n: 120, sh_f: -20, el_f: -30, head: 4 }, MIC_PT = { sh_n: 150, el_n: 120, sh_f: 95, el_f: 5, head: 4 };
const mic = (who: string, id = 'mic' + who): Prop => ({ id, k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: who + ':hand_n' });
const segScene = (kind: string, name: string, set: string, slots: Slot[], keys: Key[], cam?: Cam): Scene => ({ v: 1, id: 'seg_' + kind, name, when: 'seg_' + kind, set, slots, keys: cam ? keys.map(k => ({ ...k, cam })) : keys });
export const SEG_SCENES: Scene[] = flourishAll([
  segScene('interview', 'The interview', 'hall', [SA[0], { id: 'I', n: 'The interviewer', role: 'c', dress: 'suit', hook: 'interviewer' }], [
    { t: 0, figs: { A: STD(-1.5, 1, { sh_n: 35, el_n: 100, sh_f: -12, el_f: 10, head: 4 }, 'talk', 0.4), I: STD(1.9, -1, { sh_n: 100, el_n: 30, sh_f: 8, el_f: 15 }, '', 0.6) }, props: [{ id: 'mic', k: 'mic', x: 0.05, y: 0.15, r: 70, z: 1.4, at: 'I:hand_n' }] },
    { t: 1.2, figs: { A: STD(-1.5, 1, { sh_n: 95, el_n: 5, sh_f: -12, el_f: 10, head: 8 }, 'shout', 0.4), I: STD(1.9, -1, { sh_n: 100, el_n: 30, sh_f: 8, el_f: 15, head: -6 }, '', 0.6) }, props: [{ id: 'mic', k: 'mic', x: 0.05, y: 0.15, r: 70, z: 1.4, at: 'I:hand_n' }] }], { x: 0.2, y: 0.6, z: 1.3 }),
  segScene('callout', 'The call-out', 'ring', SAB, [
    { t: 0, figs: { A: STD(-2.2, 1, MIC_PT, 'shout', 0.5), B: STD(7.5, -1, {}, '', -0.6) }, props: [mic('A')] },
    { t: 1.4, figs: { A: STD(-2.2, 1, MIC_UP, 'talk', 0.5), B: STD(4.6, -1, { sh_n: 20, el_n: 20, sh_f: -20 }, 'snarl', -0.6) }, props: [mic('A')] },
    { t: 2.2, figs: { A: STD(-2.2, 1, MIC_PT, 'shout', 0.5), B: STD(4.0, -1, CROSS, 'snarl', -0.6) }, props: [mic('A')] }]),
  segScene('words', 'A war of words', 'ring', SAB, [
    { t: 0, figs: { A: STD(-1.5, 1, MIC_UP, 'shout', 0.4), B: STD(1.6, -1, { sh_n: 150, el_n: 120, sh_f: 30, el_f: 90 }, 'snarl', 0.6) }, props: [mic('A'), mic('B')] },
    { t: 1.2, figs: { A: STD(-1.5, 1, { sh_n: 150, el_n: 120, sh_f: 30, el_f: 90 }, 'snarl', 0.4), B: STD(1.6, -1, MIC_PT, 'shout', 0.6) }, props: [mic('A'), mic('B')] },
    { t: 2.0, figs: { A: STD(-1.0, 1, MIC_PT, 'roar', 0.4), B: STD(1.1, -1, MIC_UP, 'shout', 0.6) }, props: [mic('A'), mic('B')] }], { x: 0, y: 0.4, z: 1.3 }),
  segScene('challenge', 'Laying claim to the title', 'ring', SAB, [
    { t: 0, figs: { A: STD(-2.0, 1, MIC_UP, 'talk', 0.4), B: STD(1.8, -1, { sh_n: 160, el_n: 10, sh_f: -150, el_f: -10, head: 8 }, 'smirk', 0.6) }, props: [mic('A'), { id: 'belt', k: 'belt', x: 0, y: 0.1, r: 0, z: 2, s: 1, at: 'B:hands' }] },
    { t: 1.4, figs: { A: STD(-1.2, 1, { sh_n: 150, el_n: 120, sh_f: 75, el_f: 5, head: 2 }, 'shout', 0.4), B: STD(1.4, -1, { sh_n: 40, el_n: 100, sh_f: 30, el_f: 100 }, 'snarl', 0.6) }, props: [mic('A'), { id: 'belt', k: 'belt', x: 0, y: 0.1, r: 0, z: 2, s: 1, at: 'B:hands' }] }], { x: 0, y: 0.4, z: 1.3 }),
  segScene('faceoff', 'The face-off', 'ramp', SAB, [
    { t: 0, figs: { A: STD(-2.6, 1, CROSS, '', 0.4), B: STD(2.6, -1, CROSS, '', 0.6) }, props: [] },
    { t: 1.3, figs: { A: STD(-0.85, 1, { ...CROSS, head: 4 }, 'snarl', 0.4), B: STD(0.85, -1, { ...CROSS, head: 4 }, 'snarl', 0.6) }, props: [] }], { x: 0, y: 0.8, z: 1.35 }),
  segScene('ambush', 'The ambush', 'hall', SAB, [
    { t: 0, figs: { B: STD(1.2, 1, { hip_n: -14, kn_n: -10, hip_f: 16, kn_f: -16, sh_n: -18, sh_f: 20 }, '', 0.5), A: STD(-3.4, 1, { sh_n: 160, el_n: 40, sh_f: 150, el_f: 40 }, 'snarl', 0.4) }, props: [{ id: 'chair', k: 'chair', x: 0, y: 0.6, r: 90, z: 0.5, s: 1, at: 'A:hands' }] },
    { t: 0.8, figs: { B: { ...STD(1.6, 1, { torso: 30, head: 30, sh_n: 120, sh_f: 110, hip_n: 20, kn_n: -40 }, 'pain', 0.5), r: -30 }, A: STD(-0.4, 1, { torso: 20, sh_n: 90, el_n: 10, sh_f: 80, el_f: 10 }, 'roar', 0.4) }, props: [{ id: 'chair', k: 'chair', x: 0, y: 0.6, r: 10, z: 0.5, s: 1, at: 'A:hands' }, burst('b1', 'WHAM!', 2.4, 2.6, PAL.red)] },
    { t: 1.6, figs: { B: LAY(1.8, 1, 90, { head: 14, sh_n: 70, el_n: 95, sh_f: 55, el_f: 110, hip_n: 55, kn_n: -110 }, 'pain', 0.5), A: STD(-0.6, 1, { sh_n: 20, el_n: 20, sh_f: -10 }, 'snarl', 0.4) }, props: [] }]),
  segScene('brawl', 'A brawl through the building', 'backstage', SAB, [
    { t: 0, figs: { A: { ...STD(-1.2, 1, { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90, hip_n: 30, kn_n: -20, hip_f: -24, kn_f: -10 }, 'roar', 0.6), r: -10 }, B: { ...STD(1.5, -1, { torso: -22, head: -24, sh_n: 80, el_n: 40, sh_f: -60, el_f: 30 }, 'hurt', 0.8), r: -14 } }, props: [burst('b1', 'POW!', 2.6, 2.4, PAL.red)] },
    { t: 0.9, figs: { B: { ...STD(1.0, -1, { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90, hip_n: 30, kn_n: -20 }, 'roar', 0.8), r: -10 }, A: { ...STD(-1.6, 1, { torso: -22, head: -24, sh_n: 80, el_n: 40, sh_f: -60, el_f: 30 }, 'hurt', 0.6), r: -14 } }, props: [burst('b2', 'BAM!', -2.8, 2.4)] },
    { t: 1.8, figs: { A: { ...STD(-1.0, 1, { torso: 14, head: -6, sh_n: 105, el_n: 25, sh_f: 70, el_f: 50, hip_n: 30, kn_n: -30 }, 'roar', 0.5), r: -14 }, B: { ...STD(0.9, -1, { torso: 12, head: -4, sh_n: 100, el_n: 35, sh_f: 65, el_f: 55, hip_n: 26, kn_n: -26 }, 'snarl', 0.7), r: 12 } }, props: [] }]),
  segScene('save', 'The save', 'ring', [{ id: 'A', n: 'Who gets attacked', role: 'a' }, { id: 'B', n: 'Who makes the save', role: 'b' }, { id: 'C', n: 'The attacker', role: 'c', hook: 'attacker' }], [
    { t: 0, figs: { A: LAY(-0.8, 1, 90, { head: 14, sh_n: 70, el_n: 95, sh_f: 55, el_f: 110, hip_n: 55, kn_n: -110 }, 'pain', 0.4), C: STD(-2.4, 1, { hip_n: 70, kn_n: -40, sh_n: 30, el_n: 40 }, 'roar', 0.6), B: STD(7.4, -1, {}, 'shout', 0.2) }, props: [] },
    { t: 1.0, figs: { A: LAY(-0.8, 1, 90, { head: 14, sh_n: 70, el_n: 95, sh_f: 55, el_f: 110, hip_n: 55, kn_n: -110 }, 'pain', 0.4), C: { ...STD(-2.8, 1, { torso: -20, head: -20, sh_n: 80, el_n: 40, sh_f: -60 }, 'hurt', 0.6), r: 14 }, B: STD(-0.8, -1, { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90 }, 'roar', 0.9) }, props: [burst('b1', 'THE SAVE!', -3.6, 2.6)] },
    { t: 2.0, figs: { A: STD(-1.4, 1, { sh_n: 80, el_n: 10 }, 'talk', 0.4), B: STD(1.2, -1, { sh_n: 80, el_n: 10 }, 'smirk', 0.6), C: STD(-7.4, 1, {}, 'snarl', 0.2) }, props: [] }]),
  segScene('turn', 'The turn', 'ring', SA, [
    { t: 0, figs: { A: { ...STD(0, 1, { sh_n: 165, el_n: 5, sh_f: -20, el_f: -20 }, '', 0.5), b: true } }, props: [] },
    { t: 1.2, figs: { A: STD(0, 1, { ...CROSS, head: 6 }, 'smirk', 0.5) }, props: [] },
    { t: 2.0, figs: { A: STD(0, 1, { sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 8 }, 'roar', 0.5) }, props: [burst('b1', 'BOO!', 3.2, 2.8, PAL.red)] }], { x: 0, y: 0.6, z: 1.3 }),
  segScene('signing', 'The contract signing', 'ring', SAB, [
    { t: 0, figs: { A: STD(-2.4, 1, CROSS, '', 0.2), B: STD(2.4, -1, CROSS, '', 0.2) }, props: [{ id: 'tb', k: 'table', x: 0, y: -1.7, r: 0, z: 0.9, s: 1 }] },
    { t: 1.0, figs: { A: STD(-2.2, 1, { torso: 22, head: 10, sh_n: 60, el_n: 50 }, '', 0.2), B: STD(2.4, -1, CROSS, 'smirk', 0.2) }, props: [{ id: 'tb', k: 'table', x: 0, y: -1.7, r: 0, z: 0.9, s: 1 }] },
    { t: 2.0, figs: { A: STD(-1.6, 1, { sh_n: 95, el_n: 5, sh_f: 30, el_f: 90 }, 'shout', 0.2), B: STD(1.6, -1, { sh_n: 95, el_n: 5, sh_f: 30, el_f: 90 }, 'roar', 0.2) }, props: [{ id: 'tb', k: 'table', x: 0.4, y: -2.1, r: -25, z: 0.9, s: 1 }, burst('b1', 'IT IS SIGNED!', 0, 3)] }], { x: 0, y: 0.3, z: 1.25 }),
  segScene('recap', 'The story so far', 'plain', SAB, [
    { t: 0, figs: { A: STD(-2.6, -1, CROSS, '', 0.4), B: STD(2.6, 1, CROSS, '', 0.4) }, props: [{ id: 'hd', k: 'headline', x: 0, y: 3.3, r: 0, z: 2, s: 1, txt: 'THE STORY SO FAR' }] },
    { t: 1.6, figs: { A: STD(-1.4, 1, CROSS, 'snarl', 0.4), B: STD(1.4, -1, CROSS, 'snarl', 0.4) }, props: [{ id: 'hd', k: 'headline', x: 0, y: 3.3, r: 0, z: 2, s: 1, txt: 'THE STORY SO FAR' }] }]),
]);
/* an arc's chapter plays its own beat (src/99-tale.js); this is the picture when a beat has none: the two face to face */
SEG_SCENES.push({ ...JSON.parse(JSON.stringify(SEG_SCENES.find(x => x.id === 'seg_faceoff'))), id: 'seg_arc', when: 'seg_arc', name: 'A chapter of an arc' });
/* Storyline beats (rule 9c): every beat the story director writes on a show is a scene too, 'beat_<beat>' (BEATS in
   src/20-story.js). A beat that is the same moment as a booked kind (an interview, a call-out ambush, a title
   challenge, a face-off, a save, a turn) plays that kind's scene. */
export const BEAT_WHEN: [string, string][] = [['beat_feud_words', 'Story: words on the microphone'], ['beat_feud_stare', 'Story: mind games'], ['beat_feud_sneak', 'Story: jumped in the parking lot'],
  ['beat_feud_brawl', 'Story: a brawl'], ['beat_feud_partner', 'Story: the partner pays for it'], ['beat_feud_signing', 'Story: the contract signing'], ['beat_feud_video', 'Story: the video package'],
  ['beat_feud_stakes', 'Story: the stakes are raised'], ['beat_feud_betray', 'Story: a betrayal'], ['beat_feud_injury', 'Story: through the table'], ['beat_feud_swerve', 'Story: the handshake swerve'],
  ['beat_feud_made', 'Story: the match is made'], ['beat_feud_final', 'Story: one last face-off'], ['beat_mystery', 'Story: found laid out'], ['beat_mystery_clue', 'Story: a clue'],
  ['beat_mystery_reveal', 'Story: the attacker revealed'], ['beat_return', 'Story: the return'], ['beat_stable', 'Story: a new group'], ['beat_stable_out', 'Story: thrown out of the group'],
  ['beat_debut_vig', 'A debut after the teasers'], ['beat_debut_atk', 'A debut: the surprise attack'], ['beat_debut_match', 'A debut in a match'], ['beat_chapter', 'Story: a chapter closes'], ['beat_payoff', 'Story: the ending']];
const fromSeg = (kind: string, beat: string, name: string, set?: string): Scene => { const b: Scene = JSON.parse(JSON.stringify(SEG_SCENES.find(x => x.id === 'seg_' + kind))); b.id = b.when = 'beat_' + beat; b.name = name; if (set) b.set = set; return b; };
const beatScene = (beat: string, name: string, set: string, slots: Slot[], keys: Key[], cam?: Cam): Scene => ({ ...segScene(beat, name, set, slots, keys, cam), id: 'beat_' + beat, when: 'beat_' + beat });
const DOWN = { head: 14, sh_n: 70, el_n: 95, sh_f: 55, el_f: 110, hip_n: 55, kn_n: -110 }, ARMS_UP = { sh_n: 165, el_n: 10, sh_f: 165, el_f: 10, head: 8 }, POINT = { sh_n: 95, el_n: 5, sh_f: -15, el_f: -10, head: 4 };
const HAND = { sh_n: 70, el_n: 15, sh_f: -10, el_f: 10 }, hd = (txt: string, y = 3.95): Prop => ({ id: 'hd', k: 'headline', x: 0, y, r: 0, z: 2, s: 1, txt });
const ABC: Slot[] = [SAB[0], SAB[1], { id: 'C', n: 'The third named', role: 'c', hook: 'attacker' }];
export const BEAT_SCENES: Scene[] = flourishAll([
  fromSeg('words', 'feud_words', 'Words on the microphone'),
  beatScene('feud_stare', 'Mind games', 'ramp', [{ id: 'A', n: 'Who plays the mind games', role: 'a' }, { id: 'B', n: 'Who is talking', role: 'b' }], [
    { t: 0, figs: { B: STD(-2.4, 1, MIC_UP, 'talk', 0.4), A: STD(8.4, -1, CROSS, '', 0.2) }, props: [mic('B')] },
    { t: 1.2, figs: { B: STD(-2.4, 1, { ...MIC_UP, head: -4 }, 'hurt', 0.4), A: STD(3.2, -1, { ...CROSS, head: 4 }, 'smirk', 0.2) }, props: [mic('B')] },
    { t: 2.4, figs: { B: STD(-2.4, 1, MIC_PT, 'shout', 0.4), A: { ...STD(6.2, 1, CROSS, '', 0.2), b: true } }, props: [mic('B')] }]),
  fromSeg('ambush', 'feud_sneak', 'Jumped in the parking lot', 'lot'),
  fromSeg('brawl', 'feud_brawl', 'Pulled apart backstage'),
  beatScene('feud_partner', 'The partner pays for it', 'ring', [{ id: 'A', n: 'The attacker', role: 'a' }, { id: 'B', n: 'The partner', role: 'b' }, { id: 'C', n: 'Who arrives too late', role: 'c', hook: 'attacker' }], [
    { t: 0, figs: { B: LAY(0.4, 1, 90, DOWN, 'pain', 0.4), A: STD(-1.4, 1, { hip_n: 70, kn_n: -40, sh_n: 30, el_n: 40 }, 'roar', 0.6), C: STD(8.6, -1, {}, 'shout', 0.2) }, props: [burst('b1', 'STOMP!', 2.6, 2.2, PAL.red)] },
    { t: 1.0, figs: { B: LAY(0.4, 1, 90, DOWN, 'pain', 0.4), A: STD(-1.6, 1, ARMS_UP, 'roar', 0.6), C: STD(5.4, -1, {}, 'shout', 0.2) }, props: [] },
    { t: 2.0, figs: { B: LAY(0.4, 1, 90, DOWN, 'pain', 0.4), A: STD(-6.4, 1, POINT, 'smirk', 0.6), C: STD(2.0, -1, { head: 16, sh_n: 30, el_n: 60, sh_f: 30, el_f: 60 }, 'hurt', 0.2) }, props: [burst('b2', 'TOO LATE!', 3.4, 2.8)] }]),
  fromSeg('signing', 'feud_signing', 'The contract signing'),
  fromSeg('recap', 'feud_video', 'The video package'),
  beatScene('feud_stakes', 'The stakes are raised', 'ring', SAB, [
    { t: 0, figs: { A: STD(-1.8, 1, MIC_UP, 'talk', 0.4), B: STD(1.8, -1, CROSS, '', 0.6) }, props: [mic('A'), hd('THE STAKES ARE RAISED', 3.2)] },
    { t: 1.4, figs: { A: STD(-1.6, 1, MIC_PT, 'shout', 0.4), B: STD(1.6, -1, { ...POINT, sh_n: 80 }, 'snarl', 0.6) }, props: [mic('A'), hd('THE STAKES ARE RAISED', 3.2), burst('b1', 'ACCEPTED!', 3.6, 2.2)] }], { x: 0, y: 0.4, z: 1.3 }),
  beatScene('feud_betray', 'The betrayal', 'ring', [{ id: 'A', n: 'Who turns', role: 'a' }, { id: 'B', n: 'Who trusted them', role: 'b' }], [
    { t: 0, figs: { A: STD(-2.0, 1, CROSS, '', 0.4), B: STD(0.8, 1, ARMS_UP, 'shout', 0.6) }, props: [] },
    { t: 1.0, figs: { A: STD(-1.2, 1, { sh_n: 160, el_n: 40, sh_f: 150, el_f: 40 }, 'snarl', 0.4), B: STD(0.8, -1, { sh_n: 40, el_n: 30 }, 'hurt', 0.6) }, props: [] },
    { t: 1.8, figs: { A: STD(-0.8, 1, { sh_n: 20, el_n: 20, sh_f: -10 }, 'smirk', 0.4), B: LAY(1.4, -1, 90, DOWN, 'pain', 0.6) }, props: [burst('b1', 'TRAITOR!', 2.8, 2.6, PAL.red)] }]),
  beatScene('feud_injury', 'Through the announce table', 'ringlow', [{ id: 'A', n: 'The attacker', role: 'a' }, { id: 'B', n: 'Who goes through the table', role: 'b' }], [
    { t: 0, figs: { A: STD(-1.6, 1, { sh_n: 120, el_n: 60, sh_f: 110, el_f: 60 }, 'roar', 0.6), B: { ...STD(0.6, -1, { torso: -20, head: -24, sh_n: 80, el_n: 40, sh_f: -60 }, 'hurt', 0.4), r: -12 } }, props: [{ id: 'tb', k: 'table', x: 1.4, y: -1.7, r: 0, z: 0.2, s: 1 }] },
    { t: 0.9, figs: { A: STD(-1.4, 1, ARMS_UP, 'roar', 0.6), B: LAY(1.4, -1, 90, DOWN, 'pain', 0.4, -1.95) }, props: [{ id: 'tb', k: 'table', x: 1.4, y: -2.2, r: -18, z: 0.2, s: 1 }, burst('b1', 'CRASH!', 3.4, 2.4, PAL.red)] }]),
  beatScene('feud_swerve', 'The handshake', 'ring', [{ id: 'A', n: 'Who swerves', role: 'a' }, { id: 'B', n: 'Who offers the hand', role: 'b' }], [
    { t: 0, figs: { A: STD(-1.4, 1, CROSS, '', 0.4), B: STD(1.2, -1, HAND, 'talk', 0.6) }, props: [] },
    { t: 1.0, figs: { A: STD(-0.9, 1, HAND, 'talk', 0.4), B: STD(0.8, -1, HAND, 'talk', 0.6) }, props: [] },
    { t: 1.8, figs: { A: STD(-0.8, 1, { sh_n: 20, el_n: 20, sh_f: -10 }, 'smirk', 0.4), B: LAY(1.2, -1, 90, DOWN, 'pain', 0.6) }, props: [burst('b1', 'NO!', 3.0, 2.6, PAL.red)] }]),
  beatScene('feud_made', 'The match is made', 'plain', SAB, [
    { t: 0, figs: { A: STD(-2.6, 1, CROSS, '', 0.4), B: STD(2.6, -1, CROSS, '', 0.4) }, props: [hd('IT IS OFFICIAL')] },
    { t: 1.4, figs: { A: STD(-1.5, 1, { ...CROSS, head: 6 }, 'snarl', 0.4), B: STD(1.5, -1, { ...CROSS, head: 6 }, 'snarl', 0.4) }, props: [hd('IT IS OFFICIAL')] }]),
  fromSeg('faceoff', 'feud_final', 'One last face-off', 'ring'),
  beatScene('mystery', 'Found laid out', 'locker', [{ id: 'A', n: 'Who was attacked', role: 'a' }], [
    { t: 0, figs: { A: LAY(0, 1, 90, DOWN, 'pain', 0.4) }, props: [burst('b1', 'WHO DID THIS?', 0, 2.6)] }], { x: 0, y: -0.4, z: 1.4 }),
  beatScene('mystery_clue', 'A clue', 'plain', [{ id: 'A', n: 'Who wants answers', role: 'a' }], [
    { t: 0, figs: { A: STD(-1.8, 1, MIC_UP, 'talk', 0.4) }, props: [mic('A'), hd('WHO DID IT?')] },
    { t: 1.2, figs: { A: STD(-1.8, 1, MIC_PT, 'shout', 0.4) }, props: [mic('A'), hd('WHO DID IT?'), burst('b1', '?', 2.4, 1.4)] }]),
  beatScene('mystery_reveal', 'The attacker revealed', 'ring', [{ id: 'A', n: 'The attacker', role: 'a' }, { id: 'B', n: 'Who was attacked', role: 'b' }], [
    { t: 0, figs: { A: { ...STD(-1.6, 1, CROSS, '', 0.4), b: true }, B: STD(2.2, -1, POINT, 'shout', 0.6) }, props: [] },
    { t: 1.2, figs: { A: STD(-1.6, 1, { ...CROSS, head: 6 }, 'smirk', 0.4), B: STD(1.8, -1, POINT, 'roar', 0.6) }, props: [burst('b1', 'IT WAS YOU!', 4.0, 2.9, PAL.red)] }]),
  beatScene('return', 'The return', 'ramp', [{ id: 'A', n: 'Who comes back', role: 'a' }], [
    { t: 0, figs: { A: { ...STD(0, 1, CROSS, '', 0.4), b: true } }, props: [{ id: 'sp', k: 'spot', x: 0, y: 0, r: 0, z: -0.2, s: 1 }] },
    { t: 1.2, figs: { A: STD(0, 1, ARMS_UP, 'roar', 0.4) }, props: [{ id: 'sp', k: 'spot', x: 0, y: 0, r: 0, z: -0.2, s: 1 }, burst('b1', 'THE RETURN!', 3.4, 2.8)] }]),
  beatScene('stable', 'A new group', 'ring', ABC, [
    { t: 0, figs: { B: STD(-2.6, 1, CROSS, '', 0.3), A: STD(0, 1, CROSS, '', 0.6), C: STD(2.6, -1, CROSS, '', 0.3) }, props: [] },
    { t: 1.3, figs: { B: STD(-2.4, 1, ARMS_UP, 'roar', 0.3), A: STD(0, 1, MIC_UP, 'shout', 0.6), C: STD(2.4, -1, ARMS_UP, 'roar', 0.3) }, props: [mic('A'), burst('b1', 'ONE NAME!', 3.6, 3)] }], { x: 0, y: 0.4, z: 1.25 }),
  beatScene('stable_out', 'Thrown out of the group', 'ring', [{ id: 'A', n: 'The leader', role: 'a' }, { id: 'B', n: 'Who is thrown out', role: 'b' }], [
    { t: 0, figs: { A: STD(-1.6, 1, MIC_PT, 'shout', 0.4), B: STD(1.6, -1, { sh_n: 40, el_n: 30 }, 'hurt', 0.6) }, props: [mic('A')] },
    { t: 1.2, figs: { A: STD(-1.2, 1, { sh_n: 20, el_n: 20, sh_f: -10 }, 'smirk', 0.4), B: LAY(1.4, -1, 90, DOWN, 'pain', 0.6) }, props: [burst('b1', 'OUT!', 2.8, 2.6, PAL.red)] }]),
  // the beats that are matches: a debut (at the newcomer's entrance) and a story's chapter or ending (after the bell)
  beatScene('debut_vig', 'At last: the debut', 'ramp', [{ id: 'A', n: 'The newcomer', role: 'a' }], [
    { t: 0, figs: { A: { ...STD(0, 1, CROSS, '', 0.4), b: true } }, props: [{ id: 'sp', k: 'spot', x: 0, y: 0, r: 0, z: -0.2, s: 1 }, hd('AT LAST')] },
    { t: 1.3, figs: { A: STD(0, 1, { ...CROSS, head: 6 }, 'smirk', 0.4) }, props: [{ id: 'sp', k: 'spot', x: 0, y: 0, r: 0, z: -0.2, s: 1 }, hd('AT LAST')] }]),
  beatScene('debut_atk', 'Out of nowhere', 'ring', [{ id: 'A', n: 'The newcomer', role: 'a' }, { id: 'B', n: 'Who they attack', role: 'b' }], [
    { t: 0, figs: { B: STD(-0.8, 1, ARMS_UP, 'shout', 0.4), A: STD(8.6, -1, {}, 'roar', 0.6) }, props: [] },
    { t: 0.8, figs: { B: { ...STD(-1.2, -1, { torso: -20, head: -24, sh_n: 80, el_n: 40, sh_f: -60 }, 'hurt', 0.4), r: 14 }, A: STD(0.6, -1, { torso: 12, sh_n: 95, el_n: 5, sh_f: 30, el_f: 90 }, 'roar', 0.6) }, props: [burst('b1', 'WHO IS THAT?', 3.4, 2.8)] },
    { t: 1.8, figs: { B: LAY(-1.4, 1, 90, DOWN, 'pain', 0.4), A: STD(0.6, -1, ARMS_UP, 'roar', 0.6) }, props: [] }]),
  beatScene('debut_match', 'The debut', 'ramp', [{ id: 'A', n: 'The newcomer', role: 'a' }], [
    { t: 0, figs: { A: STD(0, 1, CROSS, '', 0.4) }, props: [hd('THE DEBUT')] },
    { t: 1.2, figs: { A: STD(0, 1, POINT, 'shout', 0.4) }, props: [hd('THE DEBUT'), burst('b1', 'NEW!', 3.4, 2.8)] }]),
  beatScene('chapter', 'Not over yet', 'ring', [{ id: 'A', n: 'Who won the round', role: 'a' }, { id: 'B', n: 'Who lost it', role: 'b' }], [
    { t: 0, figs: { A: STD(-1.4, 1, POINT, 'shout', 0.4), B: LAY(1.4, -1, 90, DOWN, 'pain', 0.6) }, props: [hd('NOT OVER YET')] },
    { t: 1.2, figs: { A: STD(-2.4, 1, POINT, 'snarl', 0.4), B: STD(2.2, -1, { head: 10, sh_n: 30, el_n: 40 }, 'hurt', 0.6) }, props: [hd('NOT OVER YET')] }]),
  beatScene('payoff', 'The story ends', 'ring', [{ id: 'A', n: 'Who won it', role: 'a' }, { id: 'B', n: 'Who lost it', role: 'b' }], [
    { t: 0, figs: { A: STD(-0.6, 1, ARMS_UP, 'roar', 0.4), B: LAY(1.6, -1, 90, DOWN, 'pain', 0.6) }, props: [hd('THE STORY ENDS'), { id: 'cf', k: 'confetti', x: 0, y: 2, r: 0, z: 2.5, s: 1 }] },
    { t: 1.4, figs: { A: STD(-0.6, 1, { ...ARMS_UP, head: 12 }, 'shout', 0.4), B: LAY(1.6, -1, 90, DOWN, 'shut', 0.6) }, props: [hd('THE STORY ENDS'), { id: 'cf', k: 'confetti', x: 0, y: 1, r: 0, z: 2.5, s: 1 }] }]),
]);
/** The poster for the next show (the desk): the two who headline it face to face, the show's name across the top (set
    from the game, `E.posterPair`). A world can bring its own scene for 'poster'. */
export const POSTERS: Scene[] = [{ v: 1, id: 'poster_show', name: 'The poster for the next show', when: 'poster', set: 'stadium', still: true, frame: 'square', slots: SAB, keys: [
  { t: 0, figs: { A: STD(-1.45, 1, { ...CROSS, head: 4 }, 'snarl', 0.4), B: STD(1.45, -1, { ...CROSS, head: 4 }, 'snarl', 0.4) }, props: [burst('vs', 'VS', 0, 0.4, PAL.red), hd('TONIGHT', -2.35)], cam: { x: 0, y: 0.55, z: 1.38 } }] }];
/** Every scene of the show: the booked kinds and the storyline beats, and the poster. */
export const SHOW_SCENES: Scene[] = SEG_SCENES.concat(BEAT_SCENES, POSTERS, TAG_SCENES, FIN_MORE, MID_MORE);
export const SHOW_WHEN: [string, string][] = SEG_WHEN.concat(BEAT_WHEN);
export function allScenes(world: Scene[]): Scene[] { const ids = new Set(world.map(s => s.id)); return world.concat(SCENES.concat(STILLS, SEG_SCENES, BEAT_SCENES, POSTERS, MOVES, TAG_SCENES, FIN_MORE, MID_MORE).filter(s => !ids.has(s.id))); }
/** The scenes that can play for a moment of the broadcast. */
export function scenesFor(when: string, world: Scene[]): Scene[] { return allScenes(world).filter(s => s.when === when); }
export const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x));

/* ---------- three studios (Ryan, 20 October): Animation, Create a Move, and Create a Scene for stills ---------- */
/** The three studios the World Editor opens: Animation (anything that moves), Create a Move (a move in the ring, from
    a powerbomb to a moonsault) and Create a Scene (one picture: posters, action shots, covers). They are the same
    editor, set up for their job. */
export type Studio = 'anim' | 'move' | 'still';
export const STUDIOS: [Studio, string, string][] = [
  ['anim', 'Animation', 'Anything that moves: entrances, promos, angles, the desk, backstage.'],
  ['move', 'Create a Move', 'A move in the ring, from a powerbomb to a moonsault, for a wrestler\'s finisher or signatures.'],
  ['still', 'Create a Scene', 'One picture: a poster, an action shot, a magazine cover, a video game cover, a portrait.']];
/** The moments of a match a move is made for. */
export const MOVE_WHEN = ['start', 'mid', 'nearfall', 'finish', 'move'];
if (!WHEN.some(w => w[0] === 'move')) WHEN.splice(WHEN.length - 1, 0, ['move', 'A wrestler\'s move']);
/** Which studio a scene belongs in. */
export function studioOf(sc: Scene): Studio { return sc.still ? 'still' : MOVE_WHEN.indexOf(sc.when) >= 0 ? 'move' : 'anim'; }
/** The setups each studio starts a new scene from. */
export const MOVE_SETUPS = ['ring', 'clothesline', 'spear', 'suplex', 'powerbomb', 'ddt', 'topdive', 'moonsault', 'tope', 'cornerhit', 'superplex', 'royal', 'cage', 'stadium', 'plain'];
export function setupsFor(st: Studio): [string, string][] {
  if (st === 'still') return TEMPLATES.map(t => [t[0], t[1]] as [string, string]);
  return SETUPS.filter(s => (MOVE_SETUPS.indexOf(s[0]) >= 0) === (st === 'move') || (st === 'anim' && ['ring', 'plain', 'cage', 'stadium'].indexOf(s[0]) >= 0));
}
/** Templates for a still: the wrestlers go in, the words are there to change. */
export const TEMPLATES: [string, string][] = [['poster', 'A poster: two face to face, VS'], ['mag', 'A magazine cover'], ['game', 'A video game cover'], ['action', 'An action shot: off the top rope'], ['portrait', 'A portrait'], ['champ', 'The champion with the belt']];
export function templateScene(id: string): Scene {
  const nid = 'scene-' + Date.now().toString(36), one = (sc: Omit<Scene, 'v' | 'id'>): Scene => ({ v: 1, id: nid, ...sc, still: true } as Scene);
  const MAST = (txt: string, col?: string): Prop => ({ id: 'mast', k: 'masthead', x: 0, y: 3.85, r: 0, z: 3, s: 1, txt, col }), line = (pid: string, txt: string, y: number, x = 0): Prop => ({ id: pid, k: 'headline', x, y, r: 0, z: 3, s: 0.8, txt });
  const STRAIGHT: Cam3 = { p: [0, 3.6, 23], t: [0, 3.6, 0], fov: 28 };   // level with the people, so the words on top stay on top in 3D
  const FLEX = { sh_n: 95, el_n: 120, sh_f: 95, el_f: 120, head: 4 };
  if (id === 'mag') return one({ name: 'My magazine cover', when: 'cover', set: 'plain', frame: 'tall', slots: [{ id: 'A', n: 'The cover star', role: 'a' }],
    keys: [{ t: 0, figs: { A: STD(0, 1, FLEX, 'smirk', 0.6) }, props: [MAST('RING NEWS'), line('h1', 'THE NEW KING?', -2.4), burst('ex', 'EXCLUSIVE!', 3.2, 1.6, PAL.yellow)], cam: { x: 0, y: 0.4, z: 1.25 }, cam3: STRAIGHT }] });
  if (id === 'game') return one({ name: 'My video game cover', when: 'cover', set: 'bigstadium', frame: 'tall', slots: SAB,
    keys: [{ t: 0, figs: { A: STD(-1.4, 1, { ...CROSS, head: 6 }, 'snarl', 0.4), B: STD(1.4, -1, { ...CROSS, head: 6 }, 'snarl', 0.6) }, props: [MAST('WRESTLE WAR', PAL.blue), burst('vs', 'VS', 0, 0.6, PAL.red), line('h1', 'EVERY BELT. EVERY RIVAL.', -2.5)], cam: { x: 0, y: 0.5, z: 1.3 }, cam3: STRAIGHT }] });
  if (id === 'action') { const c = setupScene('topdive'), k = c.keys.reduce((a, b) => (Object.values(b.figs).some(f => (f.lv || 0) > 0 || f.y > WAIST + 1) ? b : a), c.keys[Math.floor(c.keys.length / 2)]);
    return { ...c, id: nid, name: 'My action shot', when: 'poster', still: true, frame: 'wide', keys: [{ ...k, t: 0, props: k.props.concat([burst('b1', 'FLYING!', 4.2, 2.6)]) }] }; }
  if (id === 'portrait') return one({ name: 'My portrait', when: 'portrait', set: 'plain', frame: 'tall', slots: [{ id: 'A', n: 'Who it is', role: 'a' }],
    keys: [{ t: 0, figs: { A: STD(0, 1, CROSS, '', 0.6) }, props: [line('h1', 'THE NAME', -2.6)], cam: { x: 0, y: 0.6, z: 1.4 }, cam3: STRAIGHT }] });
  if (id === 'champ') return one({ name: 'The champion', when: 'poster', set: 'ring', frame: 'square', slots: [{ id: 'A', n: 'The champion', role: 'a' }],
    keys: [{ t: 0, figs: { A: STD(0, 1, ARMS_UP, 'shout', 0.6) }, props: [{ id: 'belt', k: 'belt', x: 0, y: 0.1, r: 0, z: 2, s: 1, at: 'A:hands' }, MAST('AND STILL')], cam: { x: 0, y: 0.5, z: 1.3 }, cam3: STRAIGHT }] });
  const p = copy(POSTERS[0]); return { ...p, id: nid, name: 'My poster', when: 'poster' };
}
