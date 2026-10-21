/* Create a Player: the parts library, the paper swatches, and how a wrestler's file becomes a paper doll
   (docs/plans/create-a-player.md). The file is the record Ryan set out on 18 October (`wrestler.json`): who they
   are, their body, three outfits and their finishing moves. Nothing is a picture: every part is cut by the puppet
   (src/kit/puppet.ts) from the body it is worn on, so gear fits a giant and a flyer alike, and every colour is a
   swatch of card with a finish (matte, foil, corrugated, neon, denim, leather). The engine checks and keeps the file
   (src/86-looks.js); this only reads it. */
import { Pt, PAL, rect, star, ell } from './paper';
import { FACE } from './lights';
import type { Recipe } from './puppet';

/* ---------- the file ---------- */
export interface Placement { x: number; y: number; z?: number }
export interface Layer { type: 'text_decal' | 'shape_combiner'; string?: string; font?: string; shape_id?: string; placement: Placement; palette_slot?: string; on?: 'lower_body' | 'back'; arch?: number; scale?: number; rot?: number }
export interface Attire { description?: string; equipped_assets: { head?: string; upper_body?: string; lower_body?: string; footwear?: string; accessories?: string[] }; palette_slots: { primary?: string; secondary?: string; trim?: string; hardware?: string }; custom_layers?: Layer[];
  /** Not in Ryan's first draft: a colour of its own for one part, over the palette slot it would take. */
  part_colours?: { upper_body?: string; lower_body?: string; footwear?: string } }
export interface Finisher { name: string; impact_damage?: number; kickout_difficulty?: string; position?: string; category?: string; preview_pose_id?: string;
  /** Not in Ryan's first draft: when a signature move comes out in a match (STAGES); the finisher has none. */
  stage?: string }
/** Signature moves a wrestler has before anybody edits them, by style (the codes in FINISH in src/00-core.js): a name and the picture it plays as. */
const SIGS: Record<string, [string, string][]> = {
  B: [['Running Clothesline', 'strike'], ['Big Boot', 'strike'], ['Back Body Drop', 'slam'], ['Headlock Punches', 'sleeper']],
  T: [['Belly to Back Suplex', 'slam'], ['Sleeper Hold', 'sleeper'], ['Knee Bar', 'sleeper'], ['Snap Suplex', 'slam']],
  H: [['Springboard Dropkick', 'strike'], ['Flying Crossbody', 'strike'], ['Hurricane Spin', 'carry'], ['Top Rope Moonsault', 'strike']],
  P: [['Powerslam', 'slam'], ['Spinebuster', 'slam'], ['Gorilla Press', 'carry'], ['Bear Hug', 'sleeper']],
  A: [['Swinging Neckbreaker', 'slam'], ['Spinning Back Kick', 'strike'], ['Fireman\'s Carry', 'carry'], ['Figure Four', 'sleeper']],
  S: [['Spinning Heel Kick', 'strike'], ['Knee Strike', 'strike'], ['Rear Choke', 'sleeper'], ['Leg Sweep', 'slam']],
  E: [['Showboat Elbow', 'strike'], ['Flying Shoulder Block', 'strike'], ['Bulldog', 'slam'], ['Abdominal Stretch', 'sleeper']],
};
const hsh = (t: string) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
/** Every wrestler has one finisher and two signature moves (Ryan, 19 October). The moves they have, with any that are
    missing filled in: the finisher from the game's name for it, the signatures by style, one early and one late. */
export function threeMoves(w: { name: string; style?: string; fin?: string }, have?: Finisher[]): Finisher[] {
  const h = have || [], L = SIGS[w.style || 'A'] || SIGS.A, k = hsh(w.name || 'x'), a = k % L.length, b = (a + 1 + (k >> 4) % (L.length - 1)) % L.length;
  const fin: Finisher = h[0] || { name: w.fin || 'The finisher', impact_damage: 85, kickout_difficulty: 'Protected', position: 'Standing', category: w.style === 'T' ? 'Submission' : 'Pinfall Impact', preview_pose_id: w.style === 'T' ? 'sleeper' : 'slam' };
  const sig = (i: number, j: number, stage: string): Finisher => h[i] || { name: L[j][0], impact_damage: 50, kickout_difficulty: 'Easy', position: 'Standing', category: L[j][1] === 'sleeper' ? 'Submission' : 'Pinfall Impact', preview_pose_id: L[j][1], stage };
  return [fin, sig(1, a, 'early'), sig(2, b, 'late')];
}
/** A quick random wrestler (Surprise me in Create a Wrestler): a new body, head and three outfits, the name, sex,
    moves, taunts and entrance kept. `r` gives numbers from 0 to 1 (Math.random on the screen; it never touches a game). */
export function randomLook(lk: Look, r: () => number): Look {
  const pick = <T,>(l: T[]): T => l[Math.floor(r() * l.length) % l.length], ids = (l: [string, string][]) => l.map(x => x[0]);
  const fem = (lk.physical_attributes || {}).sex === 'F', A = pick(fem ? ARCHETYPES.filter(a => ['Cruiserweight', 'Technical', 'Heavyweight'].indexOf(a[0]) >= 0) : ARCHETYPES), j = () => 0.94 + r() * 0.12;
  const bold = SWATCHES.filter(sw => sw[3] !== 'denim' && sw[3] !== 'corr' && !/^hair_/.test(sw[0])).map(sw => sw[0]), metal = SWATCHES.filter(sw => sw[3] === 'foil').map(sw => sw[0]);
  const hairs = ['#1a1410', '#3a2414', '#6a4422', '#a8742a', '#d8b860', '#8a8a8a', '#e8e4dc', '#7a1a10'];
  const pal = () => ({ primary: pick(bold), secondary: pick(bold), trim: pick(bold), hardware: pick(metal) });
  const head = r() < 0.15 ? pick(ids(PARTS.head).filter(h => /^mask/.test(h))) : pick(ids(PARTS.head).filter(h => /^hair/.test(h) && h !== 'hair_face'));
  const ringTop = fem ? pick(['top_sports', 'top_crop', 'top_bodysuit', 'singlet_full']) : pick(['bare', 'bare', 'singlet_straps_up', 'singlet_straps_down', 'singlet_full', 'shirt_tank']);
  const ringBottom = fem ? pick(['trunks_brief_01', 'tights_long_01', 'pants_flared', 'skirt_short', 'shorts_fight']) : pick(['trunks_brief_01', 'trunks_long', 'tights_long_01', 'shorts_fight', 'pants_flared']);
  const extras = ids(PARTS.accessories).filter(a => ['belt_waist', 'belt_shoulder', 'crown', 'cape'].indexOf(a) < 0), some = (n: number) => { const o: string[] = []; for (let i = 0; i < n; i++) { const a = pick(extras); if (o.indexOf(a) < 0) o.push(a); } return o; };
  const att = (top: string, bottom: string, feet: string, acc: string[]): Attire => ({ equipped_assets: { head, upper_body: top, lower_body: bottom, footwear: feet, accessories: acc }, palette_slots: pal(), custom_layers: [] });
  const ap0 = lk.appearance || {}, F = FEATURES;
  return { ...lk, archetype: A[0],
    physical_attributes: { sex: fem ? 'F' : 'M', height_inches: Math.round(A[2].h * j()), weight_lbs: Math.round(A[2].w * j() / 5) * 5, body_archetype: A[0], proportional_scalers: { torso_width: A[2].s[0] * j(), torso_height: A[2].s[1], limb_length: A[2].s[2], muscle_mass: A[2].s[3] * j() } },
    appearance: { face: ap0.face, skin_tone: ap0.skin_tone, hair_colour: pick(hairs), facial_hair: fem ? undefined : pick(ids(FACIAL)), features: { eyes: pick(ids(F.eyes)), nose: pick(ids(F.nose)), mouth: pick(ids(F.mouth)), ears: pick(ids(F.ears)) },
      face_paint: r() < 0.12 ? pick(ids(PAINT).filter(x => x)) : undefined, paint_colour: pick(bold), tattoos: r() < 0.4 ? [pick(ids(TATTOOS))] : undefined, scars: r() < 0.2 ? [pick(ids(SCARS))] : undefined, freckles: r() < 0.15 ? true : undefined },
    attires: {
      primary_ring: att(ringTop, ringBottom, pick(['boots_knee', 'boots_laced_heavy', 'boots_short', 'kick_pads', 'ankle_wraps']), some(Math.floor(r() * 3))),
      entrance_gear: att(pick(['robe_long', 'jacket_leather_biker', 'jacket_satin', 'coat_long', 'hoodie_01', 'vest_open']), ringBottom, pick(['boots_knee', 'boots_laced_heavy', 'boots_short']), r() < 0.3 ? ['sunglasses_aviator'] : []),
      street_clothes: att(pick(['shirt_tshirt_base', 'hoodie_01', 'jacket_leather_biker', 'suit_jacket', 'shirt_tank']), pick(['jeans_distressed', 'trousers_suit']), pick(['sneakers_retro', 'boots_short', 'shoes_dress']), r() < 0.25 ? [pick(['hat_cap', 'hat_beanie', 'sunglasses_aviator'])] : []),
    } };
}
/** When in a match a signature move comes out. */
export const STAGES: [string, string][] = [['early', 'Early, to take control'], ['mid', 'In the middle'], ['late', 'Late, to set up the finish']];
export type AttireKey = 'primary_ring' | 'entrance_gear' | 'street_clothes';
export interface Look {
  id?: string; name?: string; moniker?: string; hometown?: string; archetype?: string;
  /** Not in Ryan's first draft: up to three taunts, each a scene of the kind 'taunt' (the game's or a world's). */
  taunts?: string[];
  /** Not in Ryan's first draft: their entrance built from parts: pyro and lights (PYRO, LIGHTS in kit/scene.ts) and the name of their music. */
  entrance_fx?: { pyro?: string; lights?: string; music?: string };
  physical_attributes?: { /** Not in Ryan's first draft: the body the doll is cut as, M or F. */ sex?: 'M' | 'F'; height_inches?: number; weight_lbs?: number; body_archetype?: string; proportional_scalers?: { torso_width?: number; torso_height?: number; limb_length?: number; muscle_mass?: number } };
  /** Not in Ryan's first draft: the head under the gear (the face numbers the game already keeps), so a file carries the whole person. */
  appearance?: { face?: Record<string, number>; /** Not in Ryan's first draft: face sliders, each -1 to 1 (0 is as the face shape cuts it). */ shape?: Record<string, number>; /** Not in Ryan's first draft: which eyes, nose, mouth and ears (FEATURES). */ features?: { eyes?: string; nose?: string; mouth?: string; ears?: string }; skin_tone?: number; hair_colour?: string; facial_hair?: string; face_paint?: string; paint_colour?: string; /** Not in Ryan's first draft: up to three more designs painted over the first, each in its own colour. */ paint_layers?: { k: string; c?: string }[]; tattoos?: string[];
    /** Not in Ryan's first draft: a second hair colour and how it goes in (HAIR_MIX), body hair (0 none, 1 the chest, 2 chest and belly), scars (SCARS), freckles, and the design on a mask (MASK_DESIGNS). */
    hair_colour2?: string; hair_mix?: string; body_hair?: number; scars?: string[]; freckles?: boolean; mask_design?: string };
  attires?: Partial<Record<AttireKey, Attire>>;
  finishing_moves?: Finisher[];
  /** Not in Ryan's first draft: which of the canned entrances they come out on (a scene id). Their own pictures are
      their moves': each finishing or signature move picks the canned scene it plays as. */
  entrance?: string;
  /** Not in Ryan's first draft: their portrait, used wherever the game shows one (outfit, face, pose, card, framing). */
  portrait?: { attire?: AttireKey; expr?: string; pose?: string; bg?: string; frame?: 'head' | 'chest' };
}
export const ATTIRES: [AttireKey, string, string][] = [['primary_ring', 'Ring gear', 'In-ring gear'], ['entrance_gear', 'Entrance', 'Ring walk and entrance'], ['street_clothes', 'Street clothes', 'Backstage and promos']];
/** Which outfit a set calls for: ring gear in the ring, entrance gear on the ramp, street clothes backstage. */
export const ATTIRE_OF: Record<string, AttireKey> = { ring: 'primary_ring', ringlow: 'primary_ring', ringcorner: 'primary_ring', plain: 'primary_ring', ramp: 'entrance_gear', hall: 'street_clothes', office: 'street_clothes', locker: 'street_clothes', backstage: 'street_clothes', desk: 'street_clothes', stadium: 'primary_ring', rafters: 'entrance_gear', lot: 'street_clothes', cage: 'primary_ring', cell: 'primary_ring', inferno: 'primary_ring', ringside: 'primary_ring', ballroom: 'primary_ring', gym: 'primary_ring', bigstadium: 'primary_ring', talk: 'street_clothes', news: 'street_clothes', ladder: 'primary_ring', catering: 'street_clothes', trainer: 'primary_ring', weights: 'street_clothes' };

/* ---------- swatches: card, foil, corrugated board, neon paper ---------- */
export type Fin = 'matte' | 'foil' | 'corr' | 'neon' | 'denim' | 'leather';
export interface Swatch { c: string; f?: Fin }
export const SWATCHES: [string, string, string, Fin][] = [
  ['swatch_black_matte', 'Black card', PAL.black, 'matte'], ['swatch_charcoal_paper', 'Charcoal paper', '#3a3a40', 'matte'], ['swatch_grey_paper', 'Grey paper', PAL.grey, 'matte'],
  ['swatch_white_paper', 'White paper', PAL.white, 'matte'], ['swatch_cream_card', 'Cream card', PAL.cream, 'matte'],
  ['swatch_crimson_paper', 'Crimson paper', '#a3121c', 'matte'], ['swatch_red_paper', 'Red paper', PAL.red, 'matte'], ['swatch_maroon_paper', 'Maroon paper', PAL.maroon, 'matte'],
  ['swatch_pink_paper', 'Pink paper', PAL.pink, 'matte'], ['swatch_orange_paper', 'Orange paper', PAL.orange, 'matte'], ['swatch_yellow_paper', 'Yellow paper', PAL.yellow, 'matte'],
  ['swatch_green_paper', 'Green paper', PAL.green, 'matte'], ['swatch_teal_paper', 'Teal paper', PAL.teal, 'matte'], ['swatch_sky_paper', 'Sky paper', PAL.sky, 'matte'],
  ['swatch_royal_blue', 'Royal blue card', PAL.blue, 'matte'], ['swatch_navy_paper', 'Navy paper', '#1b2550', 'matte'], ['swatch_purple_paper', 'Purple paper', PAL.purple, 'matte'],
  ['swatch_gold_foil', 'Gold foil', PAL.gold, 'foil'], ['swatch_silver_foil', 'Silver foil', '#b9bcc6', 'foil'], ['swatch_bronze_foil', 'Bronze foil', '#a8642a', 'foil'],
  ['swatch_red_foil', 'Red foil', '#c0142a', 'foil'], ['swatch_blue_foil', 'Blue foil', '#2850c8', 'foil'], ['swatch_green_foil', 'Green foil', '#1d8a3a', 'foil'],
  ['swatch_kraft_corrugated', 'Brown corrugated board', '#a87a48', 'corr'], ['swatch_grey_corrugated', 'Grey corrugated board', '#8a8a8a', 'corr'],
  ['swatch_neon_green', 'Neon green paper', '#5cff3a', 'neon'], ['swatch_neon_pink', 'Neon pink paper', '#ff3aa8', 'neon'], ['swatch_neon_orange', 'Neon orange paper', '#ff7a1a', 'neon'], ['swatch_neon_yellow', 'Neon yellow paper', '#f4ff3a', 'neon'],
  ['swatch_blue_denim', 'Blue denim', '#3d5a8a', 'denim'], ['swatch_black_denim', 'Black denim', '#2a2c33', 'denim'],
  ['swatch_leather_brown', 'Brown leather', '#5a3218', 'leather'], ['swatch_leather_black', 'Black leather', '#1a1a1e', 'leather'], ['swatch_leather_red', 'Red leather', '#6e1414', 'leather'],
  // more shades (20 October), so every family has light to dark, and gear can match a real wrestler's colours
  ['swatch_blush_paper', 'Blush paper', '#f2b8c6', 'matte'], ['swatch_hot_pink', 'Hot pink paper', '#e8337f', 'matte'], ['swatch_magenta_paper', 'Magenta paper', '#b0157a', 'matte'],
  ['swatch_coral_paper', 'Coral paper', '#ee7660', 'matte'], ['swatch_burnt_orange', 'Burnt orange paper', '#c2561a', 'matte'], ['swatch_peach_paper', 'Peach paper', '#f6c49a', 'matte'],
  ['swatch_lemon_paper', 'Lemon paper', '#f7ea6a', 'matte'], ['swatch_mustard_paper', 'Mustard paper', '#c99a1e', 'matte'],
  ['swatch_mint_paper', 'Mint paper', '#a8e6c4', 'matte'], ['swatch_lime_paper', 'Lime paper', '#8ccf2e', 'matte'], ['swatch_emerald_paper', 'Emerald paper', '#13875a', 'matte'], ['swatch_forest_paper', 'Forest green paper', '#1e4d2b', 'matte'], ['swatch_olive_paper', 'Olive paper', '#6b6b2a', 'matte'],
  ['swatch_turquoise_paper', 'Turquoise paper', '#2ec4c0', 'matte'],
  ['swatch_baby_blue', 'Baby blue paper', '#a9d4f5', 'matte'], ['swatch_cobalt_paper', 'Cobalt paper', '#1f47b8', 'matte'], ['swatch_midnight_paper', 'Midnight blue paper', '#121a33', 'matte'],
  ['swatch_lavender_paper', 'Lavender paper', '#c3a6e8', 'matte'], ['swatch_violet_paper', 'Violet paper', '#7b3fd0', 'matte'], ['swatch_plum_paper', 'Plum paper', '#4e1f4e', 'matte'],
  ['swatch_tan_paper', 'Tan paper', '#c9a16e', 'matte'], ['swatch_chocolate_paper', 'Chocolate paper', '#4a2a16', 'matte'],
  ['swatch_purple_foil', 'Purple foil', '#7a2fc0', 'foil'], ['swatch_pink_foil', 'Pink foil', '#e04a9a', 'foil'], ['swatch_black_foil', 'Black foil', '#24242a', 'foil'], ['swatch_rose_gold_foil', 'Rose gold foil', '#d89a86', 'foil'],
  ['swatch_neon_blue', 'Neon blue paper', '#3ad8ff', 'neon'], ['swatch_neon_purple', 'Neon purple paper', '#b63aff', 'neon'],
  ['swatch_white_denim', 'White denim', '#d8dde6', 'denim'], ['swatch_leather_white', 'White leather', '#ecebe6', 'leather'],
  // natural hair, so hair can be any real shade
  ['hair_jet_black', 'Jet black hair', '#14110f', 'matte'], ['hair_dark_brown', 'Dark brown hair', '#3a2414', 'matte'], ['hair_chestnut', 'Chestnut hair', '#6a3a1c', 'matte'], ['hair_auburn', 'Auburn hair', '#8a3418', 'matte'],
  ['hair_ginger', 'Ginger hair', '#c0602a', 'matte'], ['hair_dirty_blonde', 'Dirty blonde hair', '#a8874e', 'matte'], ['hair_honey_blonde', 'Honey blonde hair', '#d4a85a', 'matte'], ['hair_platinum', 'Platinum blonde hair', '#ece2c4', 'matte'],
  ['hair_silver', 'Silver hair', '#b8b8b4', 'matte'], ['hair_salt_pepper', 'Salt and pepper hair', '#6e6a66', 'matte'],
];
/* ---------- swatches by family: every colour dropdown groups its swatches by colour and orders each group light to dark ---------- */
const FIN_N: Record<Fin, string> = { matte: 'paper', foil: 'foil', corr: 'board', neon: 'neon', denim: 'denim', leather: 'leather' };
function hsl(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s2 = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360;
  return [h, s2, l];
}
/** The colour family a swatch belongs to, by its hue (a dull or very dark or light colour is a neutral; brown is a dark orange). */
export function swatchFamily(c: string): string {
  const [h, s2, l] = hsl(c);
  if (s2 < 0.16 || l < 0.1 || l > 0.95 || (l > 0.88 && s2 < 0.7)) return 'Black, grey and white';
  if (h >= 15 && h < 40 && (l < 0.42 || s2 < 0.5)) return 'Browns and tans';
  if (h >= 40 && h < 70 && l < 0.34) return 'Greens';   // olive
  if (h >= 305 && h < 335) return 'Pinks';
  if ((h >= 335 || h < 5) && l > 0.62) return 'Pinks';   // pale reds read as pink
  if (h >= 5 && h < 15 && l > 0.6) return 'Oranges';   // coral and salmon
  if (h < 12 || h >= 335) return 'Reds';
  if (h < 40) return 'Oranges';
  if (h < 70) return 'Yellows and golds';
  if (h < 165) return 'Greens';
  if (h < 190) return 'Teals';
  if (h < 250) return 'Blues';
  return 'Purples';
}
export const SWATCH_FAMILIES = ['Reds', 'Pinks', 'Oranges', 'Yellows and golds', 'Greens', 'Teals', 'Blues', 'Purples', 'Browns and tans', 'Black, grey and white'];
/** The swatches grouped by family, each group lightest first, with the kind of material in the name. */
export function swatchGroups(only?: (s: [string, string, string, Fin]) => boolean): [string, [string, string, string, Fin][]][] {
  const by: Record<string, [string, string, string, Fin][]> = {};
  SWATCHES.filter(sw => !only || only(sw)).forEach(sw => { const f = swatchFamily(sw[2]); (by[f] = by[f] || []).push(sw); });
  return SWATCH_FAMILIES.filter(f => by[f]).map(f => [f, by[f].sort((a, b) => hsl(b[2])[2] - hsl(a[2])[2])] as [string, [string, string, string, Fin][]]);
}
/** Ink that reads on a swatch: dark on light card, light on dark. */
export function swatchInk(c: string): string { return hsl(c)[2] > 0.58 ? '#1d1a24' : '#ffffff'; }
export { FIN_N };
const SWM = new Map(SWATCHES.map(s => [s[0], { c: s[2], f: s[3] } as Swatch]));
/** A swatch by id (or a colour written as #rrggbb), else the fallback. */
export function swatch(id: string | undefined, fb: Swatch): Swatch { if (!id) return fb; if (/^#[0-9a-f]{6}$/i.test(id)) return { c: id, f: 'matte' }; return SWM.get(id) || fb; }

/* ---------- the parts library: everything a slot can wear ---------- */
export const PARTS: Record<'head' | 'upper_body' | 'lower_body' | 'footwear' | 'accessories', [string, string][]> = {
  head: [['hair_face', 'From the face'], ['hair_bald', 'Bald'], ['hair_buzz_01', 'Buzz cut'], ['hair_crew_01', 'Crew cut'], ['hair_short_01', 'Short'], ['hair_flat_top', 'Flat top'], ['hair_slick_01', 'Slicked back'],
    ['hair_spiky_01', 'Spiky'], ['hair_mohawk_01', 'Mohawk'], ['hair_curls_01', 'Curls'], ['hair_afro_01', 'Afro'], ['hair_cornrows_01', 'Cornrows'], ['hair_dreads_01', 'Dreadlocks'],
    ['hair_ponytail_01', 'Ponytail'], ['hair_mullet_01', 'Mullet'], ['hair_long_01', 'Long'], ['hair_wild_01', 'Long and wild'],
    ['hair_bun_01', 'Top knot'], ['hair_undercut_01', 'Undercut'], ['hair_pigtails_01', 'Pigtails'], ['hair_bob_01', 'Bob'], ['hair_braid_long', 'One long braid'], ['hair_tower', 'Piled up high'],
    ['mask_full_01', 'Mask, mouth open'], ['mask_closed_01', 'Full mask'], ['mask_half_01', 'Half mask'], ['mask_hood_01', 'Hood']],
  upper_body: [['bare', 'Bare chest'], ['singlet_straps_up', 'Singlet, straps up'], ['singlet_straps_down', 'Singlet, straps down'], ['singlet_full', 'Full singlet, to the thigh'], ['shirt_tshirt_base', 'T-shirt'], ['shirt_tank', 'Tank top'],
    ['top_sports', 'Sports top'], ['top_crop', 'Crop top'], ['top_bodysuit', 'Ring bodysuit'], ['vest_open', 'Open vest'], ['jacket_leather_biker', 'Biker jacket'], ['jacket_satin', 'Satin ring jacket'], ['coat_long', 'Long coat'],
    ['robe_long', 'Entrance robe'], ['hoodie_01', 'Hooded top'], ['suit_jacket', 'Suit and tie'], ['jacket_denim', 'Denim jacket'], ['vest_tactical', 'Tactical vest'], ['coat_fur', 'Coat with a fur collar'], ['jacket_fringe', 'Fringed jacket']],
  lower_body: [['trunks_brief_01', 'Trunks'], ['trunks_long', 'Long trunks'], ['tights_long_01', 'Long tights'], ['pants_flared', 'Flared ring pants'], ['shorts_fight', 'Fight shorts'], ['skirt_short', 'Short ring skirt'], ['jeans_distressed', 'Torn jeans'], ['trousers_suit', 'Suit trousers'], ['kilt', 'Kilt'], ['shorts_jean', 'Jean shorts'], ['mawashi', 'Sumo belt']],
  footwear: [['boots_knee', 'Boots and knee pads'], ['boots_laced_heavy', 'Heavy laced boots'], ['boots_short', 'Short boots'], ['kick_pads', 'Kick pads'], ['ankle_wraps', 'Bare feet, taped'], ['sneakers_retro', 'Retro sneakers'], ['shoes_dress', 'Dress shoes'], ['barefoot', 'Bare feet']],
  accessories: [['wrist_tape_white', 'Wrist tape'], ['wrist_wraps', 'Wrist wraps'], ['knee_pads', 'Knee pads'], ['knee_sleeves', 'Knee sleeves'], ['elbow_pads', 'Elbow pads'], ['gloves_fingerless', 'Fingerless gloves'], ['armband', 'Arm band'],
    ['sunglasses_aviator', 'Aviator sunglasses'], ['hat_cowboy', 'Cowboy hat'], ['hat_cap', 'Baseball cap'], ['hat_beanie', 'Wool hat'], ['bandana', 'Bandana'], ['crown', 'Crown'], ['chain_gold', 'Chain'], ['cape', 'Cape'],
    ['belt_waist', 'Title belt, round the waist'], ['belt_shoulder', 'Title belt, over the shoulder'],
    // 20 October: pieces the real-life gear of the parody roster called for
    ['sunglasses_round', 'Round sunglasses'], ['glasses_plain', 'Glasses'], ['headband', 'Sweatband'], ['antennae', 'Antennae'], ['scarf', 'Scarf'], ['pearls', 'Pearl necklace'], ['feather_boa', 'Feather boa'],
    ['fishnets', 'Fishnet tights'], ['guitar', 'Guitar, slung across'], ['bat', 'Baseball bat, in hand'],
    // 21 October: more for the WWC roster
    ['collar_spiked', 'Spiked collar'], ['whistle', 'Whistle on a cord'], ['headset', 'Headset'], ['trombone', 'Trombone'], ['sword', 'Sword, in hand'], ['sledgehammer', 'Sledgehammer, in hand'],
    // 21 October: more for the legends
    ['arm_tassels', 'Arm tassels'], ['snake', 'A snake round the neck'], ['shoulder_pads_spiked', 'Spiked shoulder pads'], ['hat_campaign', 'Drill sergeant hat'], ['kendo_stick', 'Kendo stick, in hand']],
};
export const FACIAL: [string, string][] = [['', 'From the face'], ['none', 'Clean shaven'], ['stubble', 'Stubble'], ['goatee', 'Goatee'], ['chin_strap', 'Chin strap'], ['sideburns', 'Sideburns'], ['beard_short', 'Short beard'],
  ['beard_full', 'Full beard'], ['beard_braided', 'Braided beard'], ['mustache', 'Moustache'], ['handlebar', 'Handlebar moustache'], ['horseshoe', 'Horseshoe moustache']];
const FACIAL_N: Record<string, [number, number]> = { none: [0, 0], stubble: [1, 0], goatee: [7, 0], chin_strap: [10, 0], sideburns: [6, 0], beard_short: [4, 0], beard_full: [5, 0], beard_braided: [5, 0], mustache: [0, 2], handlebar: [0, 3], horseshoe: [0, 4] };
export const PAINT: [string, string][] = [['', 'None'], ['stripes', 'Stripes under the eyes'], ['war', 'War paint'], ['half', 'The upper half'], ['full', 'The whole face'], ['skull', 'A skull']];
/** Designs that can be painted over the first: the first list's designs, and some that only make sense on top. */
export const PAINT_LAYERS: [string, string][] = [['eyes', 'Round the eyes'], ['tear', 'A tear'], ['grin', 'A painted grin'], ['cross', 'A cross'], ['stripes', 'Stripes under the eyes'], ['war', 'War paint'], ['half', 'The upper half']];
/** Eyes, noses, mouths and ears to choose from (drawn in head() in kit/puppet.ts). */
export const FEATURES: Record<'eyes' | 'nose' | 'mouth' | 'ears', [string, string][]> = {
  eyes: [['almond', 'Almond'], ['round', 'Round'], ['narrow', 'Narrow'], ['hooded', 'Hooded'], ['deep', 'Deep set'], ['lashes', 'With lashes']],
  nose: [['straight', 'Straight'], ['button', 'Button'], ['broad', 'Broad'], ['hooked', 'Hooked'], ['flat', 'Flat and broken'], ['pointed', 'Long and pointed']],
  mouth: [['plain', 'Plain'], ['thin', 'Thin'], ['full', 'Full lips'], ['wide', 'Wide'], ['frown', 'A frown'], ['smile', 'A smile']],
  ears: [['round', 'Round'], ['pointed', 'Pointed'], ['cauliflower', 'Cauliflower'], ['small', 'Small'], ['big', 'Big'], ['flat', 'Flat to the head']],
};
/** The face sliders: key, name, the low end and the high end. */
export const FACE_SLIDERS: [string, string, string, string][] = [['head_w', 'Head width', 'narrow', 'wide'], ['head_h', 'Head height', 'short', 'long'], ['jaw', 'Jaw', 'round', 'square'], ['chin', 'Chin', 'broad', 'pointed'],
  ['eye_size', 'Eye size', 'small', 'big'], ['eye_gap', 'Eyes apart', 'close', 'wide'], ['eye_height', 'Eyes', 'low', 'high'], ['brow_thick', 'Brows', 'thin', 'thick'], ['brow_angle', 'Brow angle', 'stern', 'worried'],
  ['nose_w', 'Nose width', 'narrow', 'wide'], ['nose_l', 'Nose length', 'short', 'long'], ['mouth_w', 'Mouth', 'small', 'wide'], ['ears', 'Ears', 'small', 'big']];
export const TATTOOS: [string, string][] = [['sleeve_near', 'Sleeve, near arm'], ['sleeve_far', 'Sleeve, far arm'], ['shoulder', 'Shoulder piece'], ['chest', 'Chest piece'], ['back', 'Back piece'], ['neck', 'Neck']];   // facial hair, moustache in the face numbers
const HAIR_OF: Record<string, string> = { hair_bald: 'bald', hair_buzz_01: 'buzz', hair_crew_01: 'crew', hair_short_01: 'cap', hair_flat_top: 'flat', hair_mohawk_01: 'mohawk', hair_curls_01: 'curls', hair_long_01: 'long',
  hair_slick_01: 'slick', hair_spiky_01: 'spiky', hair_afro_01: 'afro', hair_cornrows_01: 'braids', hair_dreads_01: 'dreads', hair_ponytail_01: 'ponytail', hair_mullet_01: 'mullet', hair_wild_01: 'wild',
  hair_bun_01: 'bun', hair_undercut_01: 'undercut', hair_pigtails_01: 'pigtails', hair_bob_01: 'bob', hair_braid_long: 'braid', hair_tower: 'tower' };
const MASK_OF: Record<string, 'open' | 'full' | 'half' | 'hood'> = { mask_full_01: 'open', mask_closed_01: 'full', mask_half_01: 'half', mask_hood_01: 'hood' };
/** How a second hair colour goes in. */
export const HAIR_MIX: [string, string][] = [['', 'One colour'], ['tips', 'Frosted tips'], ['streak', 'A streak'], ['fringe', 'The front'], ['under', 'Underneath and the back']];
/** Where a scar can be. */
export const SCARS: [string, string][] = [['brow', 'Through the eyebrow'], ['cheek', 'Across the cheek'], ['lip', 'The lip'], ['head', 'Over the scalp'], ['chest', 'Across the chest']];
/** What is cut into a mask, in its trim colour. */
export const MASK_DESIGNS: [string, string][] = [['flames', 'Flames round the eyes'], ['plain', 'Plain, rims round the eyes'], ['star', 'A star on the brow'], ['stripes', 'Stripes over the top'], ['split', 'Split down the middle'], ['teeth', 'A mouth of teeth']];

/* ---------- lettering and shapes for the gear studio ---------- */
export const FONTS: [string, string][] = [['block', 'Block capitals'], ['stencil_block', 'Stencil'], ['tall', 'Tall and narrow']];
export const SHAPES: [string, string][] = [['tactical_vest_straps', 'Vest straps'], ['bandolier', 'Bandolier'], ['stripe', 'Stripe across'], ['stripe_v', 'Stripe down'], ['rect', 'Patch'],
  ['circle', 'Disc'], ['star', 'Star'], ['diamond', 'Diamond'], ['triangle', 'Triangle'], ['bolt', 'Lightning bolt'], ['flame', 'Flames'], ['heart', 'Heart'], ['buckle', 'Buckle'], ['grunge_spray', 'Spray paint']];
export const SLOTS: [string, string][] = [['primary', 'Main colour'], ['secondary', 'Second colour'], ['trim', 'Trim'], ['hardware', 'Buckles and metal']];

/** A word as cut card letters (the game's five by seven face, merged into bars). Points are in letter units: a
    letter is 5 wide and 7 high, with the word centred on 0, 0. `stencil` leaves gaps between rows. */
export function letters(s: string, font = 'block'): Pt[][] {
  const out: Pt[][] = [], ch = Array.from(s.toUpperCase()), w = ch.length * 6 - 1, tall = font === 'tall' ? 1.45 : 1, gap = font === 'stencil_block' ? 0.22 : 0;
  ch.forEach((c, i) => {
    const code = FACE[c] || FACE[' ']; const x0 = i * 6 - w / 2;
    const rows: number[] = []; for (let y = 0; y < 7; y++) rows.push(parseInt(code.substr(y * 2, 2), 16));
    // runs in each row, then runs in the rows below that match are merged into one bar
    const used = rows.map(() => 0);
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 5; x++) {
        const bit = 1 << (4 - x); if (!(rows[y] & bit) || (used[y] & bit)) continue;
        let x1 = x; while (x1 + 1 < 5 && (rows[y] & (1 << (4 - (x1 + 1)))) && !(used[y] & (1 << (4 - (x1 + 1))))) x1++;
        let mask = 0; for (let k = x; k <= x1; k++) mask |= 1 << (4 - k);
        let y1 = y; if (!gap) while (y1 + 1 < 7 && (rows[y1 + 1] & mask) === mask && !(used[y1 + 1] & mask) && runOf(rows[y1 + 1], x) === x1) y1++;
        for (let k = y; k <= y1; k++) used[k] |= mask;
        const top = (3.5 - y) * tall - gap / 2, bot = (3.5 - y1 - 1) * tall + gap / 2;
        out.push([[x0 + x, bot], [x0 + x1 + 1, bot], [x0 + x1 + 1, top], [x0 + x, top]]);
      }
    }
  });
  return out;
}
function runOf(row: number, x: number) { let x1 = x; while (x1 + 1 < 5 && (row & (1 << (4 - (x1 + 1))))) x1++; return x1; }
/** A shape for the gear studio, about one unit across, centred on 0, 0. Some shapes are more than one piece. */
export function shape(id: string, seed = 1): Pt[][] {
  const r = (i: number) => ((Math.sin(seed * 97.1 + i * 13.7) * 43758.5453) % 1 + 1) % 1;
  switch (id) {
    case 'tactical_vest_straps': return [rect(-0.62, -0.9, 0.24, 1.8), rect(0.38, -0.9, 0.24, 1.8), rect(-0.7, -0.15, 1.4, 0.26)];
    case 'bandolier': { const o: Pt[][] = [[[-0.7, 0.85], [-0.45, 0.95], [0.75, -0.85], [0.5, -0.95]]]; for (let i = 0; i < 4; i++) { const t = 0.2 + i * 0.2, cx = -0.58 + 1.2 * t, cy = 0.9 - 1.8 * t; o.push(rect(cx - 0.09, cy - 0.14, 0.18, 0.28)); } return o; }
    case 'stripe': return [rect(-0.8, -0.12, 1.6, 0.24)];
    case 'stripe_v': return [rect(-0.12, -0.9, 0.24, 1.8)];
    case 'rect': return [rect(-0.45, -0.35, 0.9, 0.7)];
    case 'circle': return [ell(0, 0, 0.45, 0.45, 24)];
    case 'star': return [star(0, 0, 0.55, 5, 0.45)];
    case 'diamond': return [[[0, 0.55], [0.4, 0], [0, -0.55], [-0.4, 0]]];
    case 'triangle': return [[[0, 0.5], [0.5, -0.4], [-0.5, -0.4]]];
    case 'bolt': return [[[0.1, 0.65], [-0.35, -0.05], [-0.02, -0.05], [-0.2, -0.65], [0.35, 0.1], [0.02, 0.1]]];
    case 'flame': return [[[-0.5, -0.5], [0.5, -0.5], [0.42, 0.05], [0.25, -0.1], [0.3, 0.45], [0.1, 0.15], [0.02, 0.65], [-0.15, 0.2], [-0.28, 0.4], [-0.32, -0.05], [-0.45, 0.15]]];
    case 'heart': { const o: Pt[] = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2; o.push([0.032 * 16 * Math.pow(Math.sin(t), 3), 0.032 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); } return [o]; }
    case 'buckle': return [rect(-0.4, -0.3, 0.8, 0.6), rect(-0.08, -0.3, 0.16, 0.6)];
    case 'grunge_spray': { const o: Pt[][] = []; for (let i = 0; i < 7; i++) { const cx = (r(i) - 0.5) * 1.2, cy = (r(i + 9) - 0.5) * 1.0, rr = 0.08 + r(i + 20) * 0.22, n = 9, p: Pt[] = []; for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, q = rr * (0.7 + 0.5 * r(i * 11 + k)); p.push([cx + q * Math.cos(a), cy + q * Math.sin(a)]); } o.push(p); } return o; }
  }
  return [rect(-0.4, -0.4, 0.8, 0.8)];
}

/* ---------- body types ---------- */
export const ARCHETYPES: [string, string, { h: number; w: number; s: [number, number, number, number] }][] = [
  ['Cruiserweight', 'Cruiserweight or high flyer', { h: 68, w: 190, s: [0.92, 0.98, 1.03, 0.9] }],
  ['Technical', 'Technical or wiry', { h: 72, w: 215, s: [0.97, 1, 1.02, 0.95] }],
  ['Bodybuilder', 'Bodybuilder', { h: 74, w: 255, s: [1.25, 1.0, 1.02, 1.5] }],
  ['Heavyweight', 'Heavyweight', { h: 76, w: 270, s: [1.12, 1.04, 1.06, 1.18] }],
  ['Big_Man', 'Big man, big belly', { h: 75, w: 340, s: [1.18, 1.02, 0.98, 0.9] }],
  ['Super_Heavyweight', 'Super heavyweight or monster', { h: 82, w: 380, s: [1.3, 1.08, 1.0, 1.25] }],
];

/* ---------- the file as a doll ---------- */
/** The outfit as the puppet wears it: every part and every colour worked out. */
export interface Kit { top: string; bottom: string; feet: string; acc: string[]; head: string; pal: { p: Swatch; s: Swatch; t: Swatch; h: Swatch }; layers: Layer[];
  /** The colour each part is cut from: its own, or the slot it takes (ring tops and bottoms the main colour; tops worn over, and footwear, the second). */
  col: { top: Swatch; bottom: Swatch; feet: Swatch } }
const RING_TOPS = ['bare', 'singlet_straps_up', 'singlet_straps_down', 'singlet_full', 'top_sports', 'top_crop', 'top_bodysuit'];
const DEF: Record<AttireKey, Attire> = {
  primary_ring: { equipped_assets: { upper_body: 'bare', lower_body: 'trunks_brief_01', footwear: 'boots_knee', accessories: ['wrist_tape_white'] }, palette_slots: {} },
  entrance_gear: { equipped_assets: { upper_body: 'robe_long', lower_body: 'trunks_brief_01', footwear: 'boots_knee', accessories: [] }, palette_slots: {} },
  street_clothes: { equipped_assets: { upper_body: 'shirt_tshirt_base', lower_body: 'jeans_distressed', footwear: 'sneakers_retro', accessories: [] }, palette_slots: {} },
};
function kitOf(a: Attire | undefined, k: AttireKey, r: Recipe): Kit {
  const K0 = kitBase(a, k, r), pc = (a && a.part_colours) || {};
  K0.col = { top: swatch(pc.upper_body, RING_TOPS.indexOf(K0.top) >= 0 ? K0.pal.p : K0.pal.s), bottom: swatch(pc.lower_body, K0.pal.p), feet: swatch(pc.footwear, K0.pal.s) };
  return K0;
}
function kitBase(a: Attire | undefined, k: AttireKey, r: Recipe): Kit {
  const d = DEF[k], e = (a && a.equipped_assets) || d.equipped_assets, p = (a && a.palette_slots) || {};
  const gear: Swatch = { c: r.gear, f: 'matte' }, gear2: Swatch = { c: r.gear2, f: 'matte' };
  return { top: e.upper_body || d.equipped_assets.upper_body!, bottom: e.lower_body || d.equipped_assets.lower_body!, feet: e.footwear || d.equipped_assets.footwear!, acc: (e.accessories || []).slice(), head: e.head || 'hair_face',
    pal: { p: swatch(p.primary, k === 'street_clothes' ? { c: '#3d5a8a', f: 'denim' } : gear), s: swatch(p.secondary, gear2), t: swatch(p.trim, { c: PAL.white, f: 'matte' }), h: swatch(p.hardware, { c: '#b9bcc6', f: 'foil' }) },
    layers: (a && a.custom_layers) || [], col: null as any };
}
/** What a layer's palette_slot names: one of the outfit's slots, or a swatch of its own. */
export function layerSwatch(k: Kit, id?: string): Swatch {
  if (id === 'primary') return k.pal.p; if (id === 'secondary') return k.pal.s; if (id === 'trim') return k.pal.t; if (id === 'hardware') return k.pal.h;
  return swatch(id, k.pal.t);
}
/** A paper doll from a file, over the recipe the game would draw anyway (for the face and anything the file leaves out). */
export function fromLook(lk: Look, base: Recipe): Recipe {
  const pa = lk.physical_attributes || {}, sc = pa.proportional_scalers || {}, ap = lk.appearance || {};
  const fem = pa.sex ? pa.sex === 'F' : base.fem, r: Recipe = { ...base, name: lk.name || base.name, fem };
  if (pa.height_inches) r.h = Math.max(0.8, Math.min(1.26, pa.height_inches / 74)) * (fem ? 1.04 : 1);
  if (pa.weight_lbs) {
    const std = 240 * Math.pow((pa.height_inches || 74) / 74, 2.2), ratio = pa.weight_lbs / std;
    r.w = Math.max(0.72, Math.min(1.5, Math.sqrt(ratio))) * (fem ? 0.88 : 1); r.belly = Math.max(0, Math.min(0.32, (ratio - 1.12) * 0.5));
  }
  r.tw = sc.torso_width || 1; r.th = sc.torso_height || 1; r.ll = sc.limb_length || 1; r.mm = sc.muscle_mass || 1;
  if (ap.hair_colour) { const s = swatch(ap.hair_colour, { c: r.hairCol }); r.hairCol = s.c; r.browCol = s.c; }
  if (ap.facial_hair && FACIAL_N[ap.facial_hair]) { r.beard = FACIAL_N[ap.facial_hair][0]; r.mus = FACIAL_N[ap.facial_hair][1]; r.braid = ap.facial_hair === 'beard_braided'; }
  if (ap.face_paint) r.paint = { k: ap.face_paint, c: swatch(ap.paint_colour, { c: ap.face_paint === 'skull' ? PAL.white : PAL.red }).c };
  if (ap.paint_layers && ap.paint_layers.length) r.paint2 = ap.paint_layers.slice(0, 3).map(l => ({ k: l.k, c: swatch(l.c, { c: PAL.black }).c }));
  if (ap.tattoos && ap.tattoos.length) r.tats = ap.tattoos.slice();
  if (ap.hair_mix && ap.hair_colour2) { r.hairMix = ap.hair_mix; r.hairCol2 = swatch(ap.hair_colour2, { c: PAL.yellow }).c; }
  if (ap.body_hair) r.bodyHair = ap.body_hair;
  if (ap.scars && ap.scars.length) r.scars = ap.scars.slice();
  if (ap.freckles) r.freckles = true;
  if (ap.mask_design) r.maskDesign = ap.mask_design;
  if (ap.features) r.feat = { ...ap.features };
  const sh = ap.shape || {}, v = (k: string) => Math.max(-1, Math.min(1, +sh[k] || 0));
  if (Object.keys(sh).length) {   // the face sliders, over the face shape the numbers gave
    const hd = r.head; r.head = { rx: hd.rx * (1 + 0.18 * v('head_w')), ryt: hd.ryt * (1 + 0.15 * v('head_h')), ryb: hd.ryb * (1 + 0.15 * v('head_h')), sq: Math.max(1.6, Math.min(5, hd.sq + 1.5 * v('jaw'))), chin: Math.max(0, Math.min(0.6, hd.chin + 0.3 * v('chin'))) };
    r.noseW = r.noseW * (1 + 0.5 * v('nose_w')); r.noseL = r.noseL * (1 + 0.4 * v('nose_l'));
    r.brow = Math.max(0.04, Math.min(0.3, r.brow * (1 + 0.8 * v('brow_thick')))); r.browAng = r.browAng + 0.08 * v('brow_angle');
    r.fs = { eyeS: 1 + 0.35 * v('eye_size'), eyeG: 1 + 0.3 * v('eye_gap'), eyeY: 0.06 * v('eye_height'), mouthW: 1 + 0.35 * v('mouth_w'), earS: 1 + 0.5 * v('ears') };
  }
  const at = lk.attires || {};
  r.kits = { primary_ring: kitOf(at.primary_ring, 'primary_ring', r), entrance_gear: kitOf(at.entrance_gear, 'entrance_gear', r), street_clothes: kitOf(at.street_clothes, 'street_clothes', r) };
  return wear(r, 'primary_ring');
}
/** Put a doll in one of their outfits (a doll with no file is left as it is). */
export function wear(r: Recipe, k: AttireKey): Recipe {
  if (!r.kits) return r; const kit = r.kits[k] || r.kits.primary_ring, out: Recipe = { ...r, kit, straps: false, tape: false, shirt: undefined, pants: undefined, stripes: false, suit: undefined };
  const hd = kit.head;
  if (MASK_OF[hd]) out.mask = { base: kit.pal.p.c, trim: kit.pal.t.c, kind: MASK_OF[hd] }; else { out.mask = undefined; if (HAIR_OF[hd]) out.hair = HAIR_OF[hd]; }
  if (kit.top === 'suit_jacket') out.suit = { jacket: kit.col.top.c, tie: kit.pal.t.c, square: kit.pal.h.c };
  return out;
}
/** A new file for a wrestler: their body from what the game knows, and the three outfits in their colours. */
export function blankLook(w: { name: string; g?: string; style?: string; uid?: string; town?: string; height?: string; weight?: string }, r: Recipe): Look {
  const arch = w.style === 'P' ? 'Heavyweight' : w.style === 'H' ? 'Cruiserweight' : w.style === 'B' ? 'Super_Heavyweight' : 'Technical';
  const A = ARCHETYPES.find(a => a[0] === arch)![2], hgt = inches(w.height) || A.h, wgt = pounds(w.weight) || A.w;
  const near = (c: string) => { let best = SWATCHES[0][0], d0 = 1e9; for (const s of SWATCHES) { if (s[3] !== 'matte' && s[3] !== 'foil') continue; const dd = dist(c, s[2]); if (dd < d0) { d0 = dd; best = s[0]; } } return best; };
  const p = near(r.gear), s = near(r.gear2);
  return { id: (w.uid || w.name).toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40), name: w.name, hometown: w.town || undefined, archetype: arch,
    physical_attributes: { sex: w.g === 'F' ? 'F' : 'M', height_inches: hgt, weight_lbs: wgt, body_archetype: arch, proportional_scalers: { torso_width: A.s[0], torso_height: A.s[1], limb_length: A.s[2], muscle_mass: A.s[3] } },
    attires: {
      primary_ring: { description: 'In-ring gear', equipped_assets: { head: 'hair_face', upper_body: r.fem ? 'top_sports' : 'bare', lower_body: 'trunks_brief_01', footwear: 'boots_knee', accessories: ['wrist_tape_white'] }, palette_slots: { primary: p, secondary: p, trim: s, hardware: 'swatch_silver_foil' }, custom_layers: [] },
      entrance_gear: { description: 'Ring walk and entrance', equipped_assets: { head: 'hair_face', upper_body: 'jacket_leather_biker', lower_body: 'trunks_brief_01', footwear: 'boots_knee', accessories: [] }, palette_slots: { primary: p, secondary: 'swatch_leather_black', trim: s, hardware: 'swatch_silver_foil' }, custom_layers: [] },
      street_clothes: { description: 'Backstage and promos', equipped_assets: { head: 'hair_face', upper_body: 'shirt_tshirt_base', lower_body: 'jeans_distressed', footwear: 'sneakers_retro', accessories: [] }, palette_slots: { primary: 'swatch_blue_denim', secondary: p, trim: 'swatch_white_paper', hardware: 'swatch_silver_foil' }, custom_layers: [] },
    },
    finishing_moves: [] };
}
function inches(s?: string) { if (!s) return 0; const m = /(\d)\s*['’ft]+\s*(\d{1,2})?/.exec(s); if (m) return +m[1] * 12 + (+(m[2] || 0)); const c = /(\d{3})\s*cm/.exec(s); return c ? Math.round(+c[1] / 2.54) : 0; }
function pounds(s?: string) { if (!s) return 0; const m = /(\d{2,3})\s*(lb|lbs|pounds)?/i.exec(s); if (!m) return 0; const kg = /kg/i.test(s); return kg ? Math.round(+m[1] * 2.2) : +m[1]; }
function dist(a: string, b: string) { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return Math.abs((x >> 16) - (y >> 16)) + Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)) + Math.abs((x & 255) - (y & 255)); }

/* ---------- finishing moves ---------- */
export const KICKOUT: [string, string][] = [['Easy', 'Easy: kicked out of often'], ['Medium', 'Medium: kicked out of on big nights'], ['Protected', 'Protected: a kick-out is a huge moment'], ['Instant', 'Instant: a kick-out would shock the world']];
export const POSITIONS: [string, string][] = [['Standing', 'Standing'], ['Running', 'Running'], ['Top Rope', 'From the top rope'], ['Counter', 'On the counter']];
export const CATEGORIES: [string, string][] = [['Pinfall Impact', 'A big impact, then the pin'], ['Submission', 'A hold until they give up']];
/** The scene a finisher plays as, by the pose it names (old names from the first draft still work). */
export const FIN_SCENES: [string, string][] = [['slam', 'Lift and slam'], ['carry', 'Over the shoulders'], ['sleeper', 'A hold from behind'], ['strike', 'A big strike'], ['finish', 'Straight into the cover'],
  ['move_clothesline', 'A clothesline'], ['move_spear', 'A spear'], ['move_suplex', 'A vertical suplex'], ['move_powerbomb', 'A powerbomb'], ['move_ddt', 'A DDT'], ['move_topdive', 'A splash off the top'], ['move_moonsault', 'A moonsault'], ['move_tope', 'A dive to the outside'], ['move_cornerhit', 'A charge into the corner'], ['move_superplex', 'A superplex']];
const FIN_ALIAS: Record<string, string> = { pose_slam_impact_01: 'slam', pose_submission_01: 'sleeper', pose_strike_01: 'strike', pose_carry_01: 'carry', pose_cover_01: 'finish' };
/** The first move is the finisher; the rest are signature moves, played during the match. */
export function finScene(f: Finisher): string { const p = f.preview_pose_id || ''; return FIN_SCENES.some(x => x[0] === p) || /^scene-/.test(p) ? p : FIN_ALIAS[p] || (f.category === 'Submission' ? 'sleeper' : 'slam'); }
