/* The diorama in 3D (Ryan, 18 October: "build a 3d diorama engine if you have to, with a 3d arena, fans"). The same
   scene file as the 2D stage, built as a real paper-craft model and photographed:
   - every piece of a doll or a prop is a slab of card with real thickness, standing in space, so the light, the
     shadows and the camera all behave like a model on a table;
   - the ring is built from card and steel (mat, apron, posts, pads, ropes), inside a barricade, with tiered stands
     of cardboard fans that face it;
   - a key light throws soft shadows, spotlights pool on the ring, the far stands fade into the dark, and the lens
     has a shallow depth of field, as in a photograph of something small.
   Sets that are not a ring stand as a painted backdrop and floor behind the people, like a theatre flat.
   Units are feet: a wrestler is about six tall, the ring twenty across, the mat at height 0. The scene's x is the
   world's x, its height is y, and its layer order (a figure's z) is how far forward it stands.
   It only reads the scene, and it is the graphics engine's 3D side (CLAUDE.md, rule 0). */
import { setKey } from './backdrop';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Scene, Key, Cam3, build, FOOT, DESK_SEATS } from './scene';
import { Piece, PAL, shade, drawScene, View } from './paper';
import { paintBelt } from './belt';
import { Recipe, Rig } from './puppet';

const RINGS = ['ring', 'ringlow', 'ringcorner', 'ringside', 'cage', 'cell', 'inferno', 'ladder', 'ballroom', 'gym', 'bigstadium'];
/** Where a ring set's show is held, and what stands round the ring (Ryan, 20 October). */
const VENUE: Record<string, string> = { ballroom: 'ballroom', gym: 'gym', bigstadium: 'stadium' };
const RIG: Record<string, string> = { cage: 'cage', cell: 'cell', inferno: 'inferno', ladder: 'ladder' };
export const DEPTH = 0.9;      // a layer step, in feet of depth
const CARD = 0.035;     // how thick a piece of card is

/* ---------- card: a matte colour with the grain of construction paper ---------- */
let grainTex: THREE.Texture | null = null;
function grain(): THREE.Texture {
  if (grainTex) return grainTex;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d')!, d = x.createImageData(256, 256);
  let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 256 * 256; i++) { const g = 232 + Math.floor(r() * 23); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = g; d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0);
  for (let f = 0; f < 260; f++) { x.strokeStyle = 'rgba(0,0,0,' + (0.04 + r() * 0.06) + ')'; x.lineWidth = 1; x.beginPath(); const px = r() * 256, py = r() * 256, a = r() * Math.PI; x.moveTo(px, py); x.lineTo(px + Math.cos(a) * 9, py + Math.sin(a) * 9); x.stroke(); }
  grainTex = new THREE.CanvasTexture(c); grainTex.wrapS = grainTex.wrapT = THREE.RepeatWrapping; grainTex.repeat.set(0.35, 0.35); grainTex.colorSpace = THREE.SRGBColorSpace;
  return grainTex;
}
const mats = new Map<string, THREE.Material[]>();
/** The face of the card and its paler cut edge. Foil shines, neon paper glows, leather has a little sheen. */
function card(col: string, fin?: string): THREE.Material[] {
  const key = col + (fin || ''); let m = mats.get(key);
  if (!m) {
    const face = new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.95, metalness: 0, map: grain() });
    if (fin === 'foil') { face.metalness = 0.55; face.roughness = 0.3; face.emissive = new THREE.Color(col); face.emissiveIntensity = 0.22; }   // no room to reflect, so foil carries a little of its own shine
    else if (fin === 'leather') { face.roughness = 0.68; }
    else if (fin === 'neon') { face.emissive = new THREE.Color(col); face.emissiveIntensity = 0.55; }
    else if (fin === 'corr' || fin === 'denim') face.roughness = 1;
    m = [face, new THREE.MeshStandardMaterial({ color: new THREE.Color(shade(col, 1.25)), roughness: 1 })]; mats.set(key, m);
  }
  return m;
}
const lits = new Map<string, THREE.Material[]>();
/** A picked piece: the same card, glowing a little yellow. */
function lit(col: string): THREE.Material[] {
  let m = lits.get(col); if (!m) { m = card(col).map(x => { const c = (x as THREE.MeshStandardMaterial).clone(); c.emissive = new THREE.Color(0xffd23a); c.emissiveIntensity = 0.35; return c; }); lits.set(col, m); }
  return m;
}
const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc8, roughness: 0.35, metalness: 0.7 });

/** A wrestler's card: flat colour that the lights do not shade, so they keep a clean look (Ryan, 19 October). Foil and
    neon keep a little of their own glow. */
const flats = new Map<string, THREE.Material[]>();
function flatCard(col: string, fin?: string): THREE.Material[] {
  const key = col + (fin || ''); let m = flats.get(key);
  if (!m) { const c = new THREE.Color(fin === 'foil' || fin === 'neon' ? shade(col, 1.12) : col); m = [new THREE.MeshBasicMaterial({ color: c, map: grain() }), new THREE.MeshBasicMaterial({ color: new THREE.Color(shade(col, 1.25)) })]; flats.set(key, m); }
  return m;
}
/** A cut piece as a slab of card standing at depth `d`. A wrestler's (`clean`) casts its shadow on the set but takes none. */
function slab(p: Piece, d: number, clean = false): THREE.Mesh | null {
  if (p.pts.length < 3) return null;
  const sh = new THREE.Shape(p.pts.map(q => new THREE.Vector2(q[0], q[1] - FOOT)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: CARD, bevelEnabled: false, steps: 1 });
  const m = new THREE.Mesh(g, clean ? flatCard(p.col, p.fin) : card(p.col, p.fin)); m.position.z = d; m.castShadow = true; m.receiveShadow = !clean; return m;
}
/** The white margin a paper doll is cut out with: the piece grown a little all round, in cream card, just behind it.
    All a figure's margins together make the cut-out's border, so a person reads as cut card standing in the set. */
const MARGIN = 0.07;
function margin(p: Piece, d: number): THREE.Mesh | null {
  if (p.pts.length < 3) return null;
  let cx = 0, cy = 0; for (const q of p.pts) { cx += q[0]; cy += q[1]; } cx /= p.pts.length; cy /= p.pts.length;
  const sh = new THREE.Shape(p.pts.map(q => { const dx = q[0] - cx, dy = q[1] - cy, l = Math.hypot(dx, dy) || 1; return new THREE.Vector2(q[0] + dx / l * MARGIN, q[1] + dy / l * MARGIN - FOOT); }));
  const g = new THREE.ExtrudeGeometry(sh, { depth: CARD, bevelEnabled: false, steps: 1 });
  const m = new THREE.Mesh(g, flatCard('#efe5cc')); m.position.z = d - 0.03; m.castShadow = false; m.receiveShadow = false; return m;
}
/** Words (a burst, a sign) as a flat card with the lettering printed on it. */
function words(p: Piece, d: number): THREE.Mesh | null {
  const t = p.txt; if (!t) return null;
  const c = document.createElement('canvas'), px = 64, w = Math.max(1, Math.ceil(t.s.length * 0.8 * t.size * px)), h = Math.ceil(t.size * px * 1.3);
  c.width = w; c.height = h; const x = c.getContext('2d')!; x.fillStyle = t.col; x.font = Math.round(t.size * px * 0.8) + "px 'Craft Marker', 'EWF Sans', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; if (t.edge) { x.lineWidth = Math.max(3, t.size * px * 0.09); x.lineJoin = 'round'; x.strokeStyle = t.edge; x.strokeText(t.s, w / 2, h / 2); } x.fillText(t.s, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w / px, h / px), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.position.set(t.x, t.y - FOOT, d + CARD + 0.01); return m;
}

/* ---------- the arena: a ring of card and steel, a barricade, tiered stands of cardboard fans ---------- */
function arena(root: THREE.Group, near = true, set = 'ring') {
  const venue = VENUE[set] || 'arena';
  const box = (w: number, h: number, d: number, col: string | THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === 'string' ? card(col)[0] : col); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = shadow; root.add(m); return m;
  };
  const H = 10, APRON = 3;
  box(200, 0.2, 200, '#141728', 0, -APRON - 0.1, 0, false);                              // the floor
  box(H * 2 + 0.6, 0.3, H * 2 + 0.6, PAL.mat, 0, -0.15, 0, false);                      // the mat
  const logo = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.04, 48), card(shade(PAL.blue, 1.05))[0]); logo.position.y = 0.02; logo.receiveShadow = true; root.add(logo);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.05, 48), card(PAL.mat)[0]); inner.position.y = 0.03; inner.receiveShadow = true; root.add(inner);
  for (const [w, d, x, z] of [[H * 2 + 0.6, 0.1, 0, H + 0.3], [H * 2 + 0.6, 0.1, 0, -H - 0.3], [0.1, H * 2 + 0.6, H + 0.3, 0], [0.1, H * 2 + 0.6, -H - 0.3, 0]] as number[][]) {
    box(w, APRON, d, PAL.red, x, -APRON / 2 - 0.15, z, false);                           // the apron skirt
    box(w + 0.02, 0.35, d + 0.02, PAL.white, x, -0.5, z, false);
  }
  const corners = [[-H, -H], [H, -H], [H, H], [-H, H]];
  for (const [x, z] of corners) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5.4, 16), steel); post.position.set(x * 1.02, 2.4, z * 1.02); post.castShadow = true; root.add(post);
    for (const y of [1.5, 3, 4.5]) box(0.6, 0.75, 0.6, PAL.red, x, y, z);
  }
  const rope = card(PAL.white)[0];
  for (let k = 0; k < 4; k++) { const [x0, z0] = corners[k], [x1, z1] = corners[(k + 1) % 4], L = Math.hypot(x1 - x0, z1 - z0);
    for (const y of [1.5, 3, 4.5]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, L, 8), rope); r.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.z = Math.PI / 2; r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); r.castShadow = true; root.add(r); } }
  // the barricade, and the stands behind it on three sides
  const B = 14;
  // the far barricade has a gap where the ramp comes down to the ring
  for (const [w, d, x, z] of ([[B - 3.4, 0.3, -(B + 3.4) / 2, -B], [B - 3.4, 0.3, (B + 3.4) / 2, -B], [0.3, B * 2, B, 0], [0.3, B * 2, -B, 0]] as number[][]).concat(near ? [[B * 2, 0.3, 0, B]] : [])) { box(w, 2.2, d, '#1b1d28', x, -APRON + 1.1, z); box(w + 0.1, 0.25, d + 0.1, '#2a3a8a', x, -APRON + 2.3, z, false); }   // the near side is left out where the camera sits inside it
  if (venue === 'arena') { fans(root); entrance(root, box); }
  else if (venue === 'ballroom') ballroom(root, box);
  else if (venue === 'gym') gym(root, box);
  else stadium(root, box);
  deskSide(root, box);
  if (RIG[set]) rig(root, box, RIG[set]);
  for (const [x, z] of [[-8, -8], [8, -8], [8, 8], [-8, 8]]) { const s = new THREE.SpotLight(0xffe2b0, 140, 70, 0.5, 0.7, 1.6); s.position.set(x, 30, z); s.target.position.set(0, 0, 0); root.add(s, s.target); }   // the lights over the ring
}
/** The entrance (Ryan, 20 October: "the 3d arena is missing an entrance ramp, a commentary desk, a titantron"): a stage
    across the far end with a big screen over it, light trusses, and a ramp down to the ring. */
type BoxFn = (w: number, h: number, d: number, col: string | THREE.Material, x: number, y: number, z: number, shadow?: boolean) => THREE.Mesh;
function entrance(root: THREE.Group, box: BoxFn) {
  const FL = -3, SZ = -27, SH = 2.4;   // the floor, where the stage front stands, how high the stage is
  box(30, SH, 9, '#1c1f2e', 0, FL + SH / 2, SZ - 4.5);                                  // the stage
  box(30.2, 0.18, 9.2, '#2a2f45', 0, FL + SH + 0.09, SZ - 4.5, false);                  // its top
  box(30.2, 0.3, 0.12, '#c8322a', 0, FL + SH - 0.15, SZ + 0.02, false);                 // a red edge along the front
  // the ramp: from the stage down to the ring, a slope of card on posts, with a red skirt and a white edge
  const len = Math.hypot(SZ - -11, SH), ang = Math.atan2(SH, -11 - SZ), cz = (SZ + -11) / 2;
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, len), card('#59607e')[0]); ramp.position.set(0, FL + SH / 2 + 0.12, cz); ramp.rotation.x = ang; ramp.receiveShadow = true; ramp.castShadow = true; root.add(ramp);
  for (const sx of [-1, 1]) { const sk = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, len), card(PAL.red)[0]); sk.position.set(sx * 3.05, FL + SH / 2 - 0.1, cz); sk.rotation.x = ang; root.add(sk);
    const lt = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, len), glow(0x9fd0ff, 1.4)); lt.position.set(sx * 2.85, FL + SH / 2 + 0.28, cz); lt.rotation.x = ang; root.add(lt); }   // light strips along the edges
  const wash = new THREE.SpotLight(0xd8e4ff, 70, 34, 0.5, 0.7, 1.3); wash.position.set(0, FL + SH + 12, -16); wash.target.position.set(0, FL, -19); root.add(wash, wash.target);
  // the screen: a big glowing board in a black frame, the show's lettering on it
  box(19, 11.4, 0.6, '#0d0e14', 0, FL + SH + 7.6, SZ - 8.6);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(18, 10.4), tron()); scr.position.set(0, FL + SH + 7.6, SZ - 8.25); scr.name = 'tron'; root.add(scr);   // the camera's live feed is put on it (Diorama3D.feed)
  const glowL = new THREE.PointLight(0x7f6bff, 60, 30, 1.4); glowL.position.set(0, FL + SH + 6, SZ - 4); root.add(glowL);
  // two side screens and the trusses of lights over the stage
  for (const sx of [-1, 1]) { box(5.2, 7, 0.4, '#0d0e14', sx * 13.2, FL + SH + 5.6, SZ - 8); const ss = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6.4), glow(sx < 0 ? 0xc8322a : 0x2f6bd8, 0.9)); ss.position.set(sx * 13.2, FL + SH + 5.6, SZ - 7.78); root.add(ss); }
  box(32, 0.5, 0.5, steel, 0, FL + SH + 14.2, SZ - 2.5, false); box(32, 0.5, 0.5, steel, 0, FL + SH + 14.2, SZ - 7, false);
  for (const sx of [-15.5, 15.5]) box(0.5, 14.2, 0.5, steel, sx, FL + SH + 7.1, SZ - 2.5, false);
  for (let i = 0; i < 7; i++) { const x = -12 + i * 4; box(0.7, 0.7, 0.9, '#15161c', x, FL + SH + 13.6, SZ - 2.5, false); const sp = new THREE.SpotLight(i % 2 ? 0xffd8a0 : 0x9fb8ff, 40, 40, 0.32, 0.6, 1.4); sp.position.set(x, FL + SH + 13.3, SZ - 2.3); sp.target.position.set(x * 0.3, FL + SH, SZ + 4); root.add(sp, sp.target); }
}
let tronTex: THREE.Texture | null = null;
/** What the big screen shows: the company's lettering, stars and a burst of colour, as if lit from behind. */
function tron(): THREE.Material {
  if (!tronTex) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 592; const x = c.getContext('2d')!;
    const g = x.createRadialGradient(512, 296, 40, 512, 296, 620); g.addColorStop(0, '#5a3cc0'); g.addColorStop(0.55, '#1e1a5a'); g.addColorStop(1, '#07071a'); x.fillStyle = g; x.fillRect(0, 0, 1024, 592);
    for (let i = 0; i < 18; i++) { x.save(); x.translate(512, 296); x.rotate(i * Math.PI / 9); x.fillStyle = i % 2 ? 'rgba(255,214,90,.10)' : 'rgba(255,255,255,.05)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(700, -60); x.lineTo(700, 60); x.fill(); x.restore(); }
    x.fillStyle = '#ffd84a'; x.font = "bold 150px 'Craft Marker', 'EWF Sans', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = '#000'; x.shadowBlur = 18; x.fillText('LIVE!', 512, 270);
    x.fillStyle = '#fff'; x.font = "64px 'Craft Marker', 'EWF Sans', sans-serif"; x.fillText('★  TONIGHT  ★', 512, 410);
    tronTex = new THREE.CanvasTexture(c); tronTex.colorSpace = THREE.SRGBColorSpace;
  }
  return new THREE.MeshBasicMaterial({ map: tronTex });
}
/** Ringside (Ryan, 20 October: "the blank dark area should be filled out and have the commentators desk"): padded mats
    round the ring, steps at two corners, the commentary desk on the near side facing the ring with its chairs and
    monitors, and rows of floor seats full of fans behind it. */
function deskSide(root: THREE.Group, box: BoxFn) {
  const FL = -3;
  // the padded mats on the floor round the ring, out to the barricade
  for (const [w, d, x, z] of [[28, 3.4, 0, 12.2], [28, 3.4, 0, -12.2], [3.4, 21, 12.2, 0], [3.4, 21, -12.2, 0]] as number[][]) box(w, 0.12, d, '#2b3a7a', x, FL + 0.06, z, false);
  // steel steps at two corners
  for (const [x, z, ry] of [[-11.4, 11.4, Math.PI / 4], [11.4, -11.4, -3 * Math.PI / 4]] as number[][]) for (let i = 0; i < 3; i++) { const st = box(2.4, 1, 1.1 - i * 0.3, steel, 0, 0, 0); st.position.set(x - Math.sin(ry) * i * 0.35, FL + 0.5 + i * 1, z - Math.cos(ry) * i * 0.35); st.rotation.y = ry; }
  // the commentary desk: near side, its front to the ring
  const X = -5, Z = 12.6;
  box(7.2, 2.5, 1.6, '#1f2a52', X, FL + 1.25, Z);
  box(7.4, 0.14, 1.75, '#34405f', X, FL + 2.57, Z, false);
  box(7.2, 0.3, 0.06, PAL.gold, X, FL + 2.1, Z - 0.84, false); box(7.2, 0.12, 0.06, PAL.red, X, FL + 0.6, Z - 0.84, false);
  const live = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.8), plate('LIVE', 2.4, 0.8, '#1f2a52', PAL.yellow)); live.position.set(X, FL + 1.3, Z - 0.86); live.rotation.y = Math.PI; root.add(live);
  for (const dx of [-2.2, 0, 2.2]) { const sc = box(0.8, 0.45, 0.06, '#111116', X + dx, FL + 2.88, Z - 0.2); sc.rotation.x = 0.2; box(0.9, 2.6, 0.9, '#16161b', X + dx, FL + 1.3, Z + 1.4); }
  const lamp = new THREE.PointLight(0xffe2b8, 25, 10, 1.4); lamp.position.set(X, FL + 4.5, Z - 2); root.add(lamp);
  // the timekeeper's table and the bell on the other side of the near mats
  box(3, 2.3, 1.3, '#1b1d28', 5.5, FL + 1.15, 12.6); const bell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), card(PAL.gold, 'foil')[0]); bell.position.set(5.5, FL + 2.3, 12.4); root.add(bell);
  floorFans(root);
}
/** Rows of folding chairs on the floor behind the near barricade, a fan in each, facing the ring. */
function floorFans(root: THREE.Group) {
  const spots: number[][] = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 18; i++) spots.push([-13.6 + i * 1.6 + (r % 2) * 0.4, -3, 15.6 + r * 1.5]);
  const chairG = new THREE.BoxGeometry(1.1, 1.2, 0.9), bodyS = new THREE.Shape(); bodyS.ellipse(0, 0, 0.8, 0.7, 0, Math.PI, false, 0); bodyS.lineTo(-0.8, 0);
  const bodyG = new THREE.ExtrudeGeometry(bodyS, { depth: 0.05, bevelEnabled: false }), headG = new THREE.CylinderGeometry(0.36, 0.36, 0.05, 14); headG.rotateX(Math.PI / 2);
  const mc = new THREE.InstancedMesh(chairG, card('#3a3d4a')[0], spots.length), mb = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 1, map: grain() }), spots.length), mh = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ roughness: 1 }), spots.length);
  const shirts = [PAL.red, PAL.black, PAL.white, PAL.blue, PAL.grey, PAL.maroon, PAL.yellow, PAL.teal, PAL.green, PAL.orange], skins = ['#f3dccb', '#e8c09e', '#d5a07a', '#b07a52', '#7f5236', '#5a3a26'];
  const o = new THREE.Object3D(), c = new THREE.Color(); let sd = 23; const r01 = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  spots.forEach((p, i) => {
    o.position.set(p[0], p[1] + 0.6, p[2] + 0.3); o.rotation.set(0, 0, 0); o.updateMatrix(); mc.setMatrixAt(i, o.matrix);
    o.position.set(p[0] + (r01() - 0.5) * 0.2, p[1] + 1.25, p[2]); o.rotation.set(0, Math.PI + (r01() - 0.5) * 0.3, (r01() - 0.5) * 0.1); o.updateMatrix(); mb.setMatrixAt(i, o.matrix);
    o.position.y = p[1] + 2.25 + r01() * 0.15; o.updateMatrix(); mh.setMatrixAt(i, o.matrix);
    c.set(shirts[Math.floor(r01() * shirts.length)]); mb.setColorAt(i, c); c.set(skins[Math.floor(r01() * skins.length)]); mh.setColorAt(i, c);
  });
  root.add(mc, mb, mh);
}
function fans(root: THREE.Group) {
  // a fan is two cut cards: the shirt and the head, facing the ring
  const body = new THREE.Shape(); body.ellipse(0, 0, 0.95, 0.8, 0, Math.PI, false, 0); body.lineTo(-0.95, 0);
  const bodyG = new THREE.ExtrudeGeometry(body, { depth: 0.05, bevelEnabled: false }), headG = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14); headG.rotateX(Math.PI / 2);
  const spots: { x: number; y: number; z: number; ry: number; k: number }[] = [];
  const sides: [number, number][] = [[0, -1], [1, 0], [-1, 0]];
  for (const [sx, sz] of sides) for (let r = 0; r < 16; r++) {
    const dist = 16.5 + r * 1.75, y = -1.9 + r * 1.15, half = dist + 4, n = Math.floor(half * 2 / 1.55);
    for (let i = 0; i < n; i++) {
      const t = -half + (i + 0.5) * half * 2 / n + (r % 2) * 0.4, x = sx ? sx * dist : t, z = sx ? t : sz * dist;
      if (!sx && Math.abs(x) < 16.5) continue;   // the stage and the screen stand where the middle of the far stand was
      spots.push({ x, y, z, ry: Math.atan2(-x, -z), k: r });
      // the step under the row
    }
    for (const half2 of sx ? [0] : [-1, 1]) {   // the far stand in two halves, either side of the stage
      const w = sx ? half * 2 : half - 16.5, cx = sx ? 0 : half2 * (16.5 + w / 2);
      const step = new THREE.Mesh(new THREE.BoxGeometry(sx ? 1.75 : w, 1.15, sx ? half * 2 : 1.75), card('#262a3e')[0]);
      step.position.set(sx ? sx * (dist + 0.4) : cx, y - 1.0, sx ? 0 : sz * (dist + 0.4)); step.receiveShadow = true; root.add(step);
    }
  }
  const shirts = [PAL.red, PAL.black, PAL.white, PAL.blue, PAL.grey, PAL.maroon, PAL.yellow, PAL.teal, PAL.green, PAL.orange];
  const skins = ['#f3dccb', '#e8c09e', '#d5a07a', '#b07a52', '#7f5236', '#5a3a26'];
  const mb = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 1, map: grain() }), spots.length), mh = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ roughness: 1 }), spots.length);
  const o = new THREE.Object3D(), c = new THREE.Color(); let s = 11; const r01 = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  spots.forEach((p, i) => {
    o.position.set(p.x + (r01() - 0.5) * 0.3, p.y, p.z); o.rotation.set(0, p.ry + (r01() - 0.5) * 0.3, (r01() - 0.5) * 0.12); o.updateMatrix(); mb.setMatrixAt(i, o.matrix);
    o.position.y = p.y + 1.15 + r01() * 0.15; o.updateMatrix(); mh.setMatrixAt(i, o.matrix);
    c.set(shirts[Math.floor(r01() * shirts.length)]); mb.setColorAt(i, c); c.set(skins[Math.floor(r01() * skins.length)]); mh.setColorAt(i, c);
  });
  root.add(mb, mh);
}
/* ---------- what stands round the ring for a match of its own kind, and where else a show is held ---------- */
let meshTex: THREE.Texture | null = null;
/** Chain-link fence: a diamond mesh of steel wire, see-through between the wires. */
function chain(w: number, h: number): THREE.Material {
  if (!meshTex) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d')!;
    x.strokeStyle = 'rgba(205,210,220,.95)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 32); x.lineTo(32, 0); x.lineTo(64, 32); x.lineTo(32, 64); x.closePath(); x.stroke();
    x.strokeStyle = 'rgba(90,95,105,.9)'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, 33.5); x.lineTo(32, 1.5); x.lineTo(64, 33.5); x.lineTo(32, 65.5); x.closePath(); x.stroke();
    meshTex = new THREE.CanvasTexture(c); meshTex.wrapS = meshTex.wrapT = THREE.RepeatWrapping; meshTex.colorSpace = THREE.SRGBColorSpace;
  }
  const t = meshTex.clone(); t.needsUpdate = true; t.repeat.set(w / 1.1, h / 1.1);
  return new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6 });
}
/** A wall of fence between two corners, from the floor `y0` up `h`, with a steel frame round it. */
function fence(root: THREE.Group, box: BoxFn, x0: number, z0: number, x1: number, z1: number, y0: number, h: number) {
  const L = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.PlaneGeometry(L, h), chain(L, h));
  m.position.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); root.add(m);
  for (const yy of [y0 + 0.1, y0 + h / 2, y0 + h]) { const r = box(L, 0.18, 0.18, steel, (x0 + x1) / 2, yy, (z0 + z1) / 2, false); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0); }
}
/** The steel cage on the ring, the cell over ring and floor with a roof, or the flames of an inferno round the apron. */
function rig(root: THREE.Group, box: BoxFn, kind: string) {
  const FL = -3;
  if (kind === 'cage') {   // on the edge of the ring, as high as three men, a door in the near side
    const E = 10.9, Hh = 13; const c = [[-E, -E], [E, -E], [E, E], [-E, E]];
    for (let k = 0; k < 4; k++) fence(root, box, c[k][0], c[k][1], c[(k + 1) % 4][0], c[(k + 1) % 4][1], 0, Hh);
    for (const [x, z] of c) box(0.45, Hh + 0.4, 0.45, steel, x, Hh / 2, z);
    box(2.6, 4.4, 0.2, '#6c707c', 6, 2.2, E + 0.15, false);   // the door, shut
  } else if (kind === 'cell') {   // round the ring and the floor out to the barricade, with a roof of the same fence
    const E = 14.6, Hh = 20; const c = [[-E, -E], [E, -E], [E, E], [-E, E]];
    for (let k = 0; k < 4; k++) fence(root, box, c[k][0], c[k][1], c[(k + 1) % 4][0], c[(k + 1) % 4][1], FL, Hh);
    for (const [x, z] of c) box(0.6, Hh, 0.6, '#2a2c33', x, FL + Hh / 2, z);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(E * 2, E * 2), chain(E * 2, E * 2)); roof.rotation.x = -Math.PI / 2; roof.position.set(0, FL + Hh, 0); root.add(roof);
    for (let i = -2; i <= 2; i++) { box(E * 2, 0.3, 0.3, '#2a2c33', 0, FL + Hh, i * E / 2.5, false); box(0.3, 0.3, E * 2, '#2a2c33', i * E / 2.5, FL + Hh, 0, false); }
    const red = new THREE.PointLight(0xff3a2a, 120, 60, 1.3); red.position.set(0, FL + Hh - 2, 0); root.add(red);
  } else if (kind === 'ladder') {   // the belt hung on a cable high over the middle of the ring, and a ladder standing under it
    const H = 12.5; box(0.06, 30 - H, 0.06, steel, 0, H + (30 - H) / 2, 0, false);
    const bp = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2), new THREE.MeshBasicMaterial({ map: beltTex(), transparent: true, side: THREE.DoubleSide })); bp.position.set(0, H - 1, 0); root.add(bp);
    const spot = new THREE.SpotLight(0xfff2c0, 160, 30, 0.25, 0.5, 1.2); spot.position.set(0, 28, 6); spot.target.position.set(0, H - 1, 0); root.add(spot, spot.target);
    const lad = MODELS3.ladder(); lad.scale.setScalar(3.3); lad.position.set(-1.2, 5.4, -1); lad.rotation.z = 0.08; lad.traverse(o => { o.castShadow = true; }); root.add(lad);
    const lad2 = MODELS3.ladder(); lad2.scale.setScalar(3.3); lad2.position.set(12.4, 2.6, -8); lad2.rotation.set(0, 0.6, 1.2); root.add(lad2);   // a spare against the barricade
  } else if (kind === 'inferno') {   // columns of flame along all four sides, outside the apron
    const flame = (x: number, z: number, k: number) => {
      const o = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3.6 + k * 1.4, 7), glow(0xff5a12, 1.6)); o.position.set(x, FL + (3.6 + k * 1.4) / 2, z); root.add(o);
      const i = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2 + k, 7), glow(0xffd23a, 2.2)); i.position.set(x, FL + (2.2 + k) / 2, z); root.add(i);
    };
    let n = 0; for (let t = -10.5; t <= 10.5; t += 1.5) { const k = ((n++ * 7) % 5) / 4; flame(t, 11.6, k); flame(t, -11.6, 1 - k); flame(11.6, t, k); flame(-11.6, t, 1 - k); }
    for (const [x, z] of [[0, 12], [0, -12], [12, 0], [-12, 0]]) { const l = new THREE.PointLight(0xff7a20, 90, 30, 1.4); l.position.set(x, FL + 4, z); root.add(l); }
    for (const [x, z] of [[-11.6, -11.6], [11.6, -11.6], [11.6, 11.6], [-11.6, 11.6]]) box(1.4, 1.2, 1.4, '#2a2c33', x, FL + 0.6, z);   // the burners at the corners
  }
}
/** Rows of fans on steps, in a straight stand: from (x0, z) to (x1, z) facing the ring, `rows` deep, going back by `dz`. */
function stand(root: THREE.Group, x0: number, x1: number, z0: number, dz: number, rows: number, y0: number, dy: number, rot: number, seed: number, step = '#262a3e') {
  const g = new THREE.Group(), body = new THREE.Shape(); body.ellipse(0, 0, 0.95, 0.8, 0, Math.PI, false, 0); body.lineTo(-0.95, 0);
  const bodyG = new THREE.ExtrudeGeometry(body, { depth: 0.05, bevelEnabled: false }), headG = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14); headG.rotateX(Math.PI / 2);
  const spots: number[][] = []; for (let r = 0; r < rows; r++) { const n = Math.floor((x1 - x0) / 1.55); for (let i = 0; i < n; i++) spots.push([x0 + (i + 0.5) * (x1 - x0) / n + (r % 2) * 0.4, y0 + r * dy, z0 + r * dz]);
    const st = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 + 1, dy, Math.abs(dz)), card(step)[0]); st.position.set((x0 + x1) / 2, y0 + r * dy - dy * 0.9, z0 + r * dz + dz * 0.25); st.receiveShadow = true; g.add(st); }
  const shirts = [PAL.red, PAL.black, PAL.white, PAL.blue, PAL.grey, PAL.maroon, PAL.yellow, PAL.teal, PAL.green, PAL.orange], skins = ['#f3dccb', '#e8c09e', '#d5a07a', '#b07a52', '#7f5236', '#5a3a26'];
  const mb = new THREE.InstancedMesh(bodyG, new THREE.MeshStandardMaterial({ roughness: 1, map: grain() }), spots.length), mh = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ roughness: 1 }), spots.length);
  const o = new THREE.Object3D(), c = new THREE.Color(); let s = seed; const r01 = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  spots.forEach((p, i) => { o.position.set(p[0] + (r01() - 0.5) * 0.3, p[1], p[2]); o.rotation.set(0, (dz > 0 ? 0 : Math.PI) + (r01() - 0.5) * 0.3, (r01() - 0.5) * 0.12); o.updateMatrix(); mb.setMatrixAt(i, o.matrix);
    o.position.y = p[1] + 1.15 + r01() * 0.15; o.updateMatrix(); mh.setMatrixAt(i, o.matrix); c.set(shirts[Math.floor(r01() * shirts.length)]); mb.setColorAt(i, c); c.set(skins[Math.floor(r01() * skins.length)]); mh.setColorAt(i, c); });
  g.add(mb, mh); g.rotation.y = rot; root.add(g);
}
/** A hotel ballroom: a patterned carpet, panelled walls close in, chandeliers, fans on folding chairs all round, a balcony. */
function ballroom(root: THREE.Group, box: BoxFn) {
  const FL = -3;
  box(80, 0.1, 80, '#5a1a22', 0, FL + 0.02, 0, false);
  for (let i = -6; i <= 6; i++) box(80, 0.02, 0.4, '#7a2a30', 0, FL + 0.08, i * 6, false);
  for (const [w, d, x, z] of [[60, 1, 0, -30], [1, 60, 30, 0], [1, 60, -30, 0]] as number[][]) { box(w, 22, d, '#6b4a2e', x, FL + 11, z); box(w + 0.1, 1.2, d + 0.1, '#c9a24a', x, FL + 4, z, false); box(w + 0.1, 0.6, d + 0.1, '#c9a24a', x, FL + 16, z, false); }
  for (const [x, z] of [[-10, -10], [10, -10], [-10, 10], [10, 10], [0, -20], [0, 0]]) { box(0.08, 4, 0.08, '#c9a24a', x, FL + 22, z, false);
    const ch = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 10, 1, true), card('#e8d29a', 'foil')[0]); ch.position.set(x, FL + 19.4, z); ch.rotation.x = Math.PI; root.add(ch);
    for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), glow(0xfff0c0, 2)); b.position.set(x + Math.cos(k) * 1.4, FL + 19, z + Math.sin(k) * 1.4); root.add(b); }
    const l = new THREE.PointLight(0xffd9a0, 60, 30, 1.4); l.position.set(x, FL + 18, z); root.add(l); }
  stand(root, -24, 24, -17, -1.6, 3, FL + 0.6, 0.15, 0, 31, '#3a2a22');            // floor seats, the far side
  stand(root, -24, 24, -17, -1.6, 3, FL + 0.6, 0.15, Math.PI / 2, 37, '#3a2a22');   // and the sides
  stand(root, -24, 24, -17, -1.6, 3, FL + 0.6, 0.15, -Math.PI / 2, 41, '#3a2a22');
  box(60, 1.2, 6, '#4a3020', 0, FL + 10, -26.5); box(60, 1.4, 0.3, '#c9a24a', 0, FL + 11.2, -23.6, false);   // the balcony
  stand(root, -26, 26, -24.5, -1.4, 3, FL + 11.4, 0.9, 0, 43, '#4a3020');
}
/** A school gym: a wooden floor with court lines, block walls, bleachers on two sides, hoops at the ends, strip lights. */
function gym(root: THREE.Group, box: BoxFn) {
  const FL = -3;
  box(70, 0.1, 50, '#c8955a', 0, FL + 0.02, 0, false);
  for (const z of [-22, 22]) box(68, 0.02, 0.25, '#f2f2f2', 0, FL + 0.08, z, false);
  for (const x of [-33, 33]) box(0.25, 0.02, 44, '#f2f2f2', x, FL + 0.08, 0, false);
  const ctr = new THREE.Mesh(new THREE.RingGeometry(5.6, 5.9, 40), card('#f2f2f2')[0]); ctr.rotation.x = -Math.PI / 2; ctr.position.y = FL + 0.09; root.add(ctr);
  for (const [w, d, x, z] of [[72, 1, 0, -25], [72, 1, 0, 25], [1, 50, 35, 0], [1, 50, -35, 0]] as number[][]) { box(w, 20, d, '#bfc3c8', x, FL + 10, z); box(w + 0.1, 3, d + 0.1, '#2f5fa8', x, FL + 1.5, z, false); }
  for (const sx of [-1, 1]) { box(0.3, 9, 0.3, '#3a3d4a', sx * 33.5, FL + 4.5, 0); box(4, 2.6, 0.2, '#f2f2f2', sx * 33, FL + 10, 0); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 6, 16), card('#e05a1a')[0]); rim.rotation.x = Math.PI / 2; rim.position.set(sx * 32.2, FL + 9, 0); root.add(rim); }
  stand(root, -26, 26, -16, -1.6, 7, FL + 0.6, 0.95, 0, 51, '#8a6a42');
  stand(root, -26, 26, -16, -1.6, 7, FL + 0.6, 0.95, Math.PI, 53, '#8a6a42');
  for (let i = -3; i <= 3; i++) for (const z of [-8, 8]) { box(6, 0.2, 0.6, glow(0xeef4ff, 1.4) as any, i * 9, FL + 19, z, false); }
  const fill = new THREE.HemisphereLight(0xeef2ff, 0x6a5030, 0.8); root.add(fill);
}
/** A stadium: grass under the floor, tiers of seats rising far away on every side, light towers, the night sky. */
function stadium(root: THREE.Group, box: BoxFn) {
  const FL = -3;
  box(240, 0.1, 240, '#2f6a32', 0, FL - 0.05, 0, false);
  for (let i = -5; i <= 5; i++) box(240, 0.02, 4, '#357a38', 0, FL + 0.01, i * 16, false);
  box(30, 0.08, 34, '#2a2d38', 0, FL + 0.03, 0, false);   // the floor round the ring
  stand(root, -60, 60, -44, -2.4, 18, FL + 0.5, 1.6, 0, 61);
  stand(root, -60, 60, -44, -2.4, 18, FL + 0.5, 1.6, Math.PI / 2, 63);
  stand(root, -60, 60, -44, -2.4, 18, FL + 0.5, 1.6, -Math.PI / 2, 67);
  stand(root, -60, 60, -54, -2.4, 14, FL + 0.5, 1.6, Math.PI, 71);
  for (const [x, z] of [[-48, -48], [48, -48], [48, 48], [-48, 48]]) { box(1.2, 46, 1.2, steel, x, FL + 23, z); box(8, 4, 1, '#15161c', x, FL + 47, z); const l = new THREE.SpotLight(0xffffff, 300, 140, 0.45, 0.6, 1.2); l.position.set(x, FL + 46, z); l.target.position.set(0, 0, 0); root.add(l, l.target); }
  entrance(root, box);
}
/** A plain chain-link fence on posts (the parking lot). */
function fenceFlat(root: THREE.Group, x0: number, z0: number, x1: number, z1: number, y0: number, h: number) {
  const L = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.PlaneGeometry(L, h), chain(L, h)); m.position.set((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); root.add(m);
  for (let x = x0; x <= x1; x += 6) bx(root, 0.18, h, 0.18, steel, x, y0 + h / 2, z0, false);
}
let skyTex: THREE.Texture | null = null;
/** A city at night behind the talk show: towers of lit windows on a purple sky. */
function skyline(): THREE.Material {
  if (!skyTex) { const c = document.createElement('canvas'); c.width = 1024; c.height = 440; const x = c.getContext('2d')!, g = x.createLinearGradient(0, 0, 0, 440); g.addColorStop(0, '#1a1040'); g.addColorStop(1, '#6a3a7a'); x.fillStyle = g; x.fillRect(0, 0, 1024, 440);
    let s = 5; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 26; i++) { const w = 30 + r() * 50, h = 120 + r() * 260, bx0 = i * 40 - 10; x.fillStyle = '#120c26'; x.fillRect(bx0, 440 - h, w, h); x.fillStyle = 'rgba(255,214,120,.8)'; for (let yy = 440 - h + 10; yy < 430; yy += 14) for (let xx = bx0 + 5; xx < bx0 + w - 5; xx += 10) if (r() < 0.45) x.fillRect(xx, yy, 4, 6); }
    skyTex = new THREE.CanvasTexture(c); skyTex.colorSpace = THREE.SRGBColorSpace; }
  return new THREE.MeshBasicMaterial({ map: skyTex });
}
let beltT: THREE.Texture | null = null;
/** The belt that hangs over a ladder match, painted the way Create a Belt paints one. */
function beltTex(): THREE.Texture {
  if (!beltT) { const c = document.createElement('canvas'); c.width = 96 * 6; c.height = 40 * 6; const x = c.getContext('2d')!; x.scale(6, 6);
    paintBelt(x, { pl: 'crest', mt: 'gold', st: '#1c1b1f', gm: 'red', sd: 3, ss: 'round', tr: 'etched', w: 'WORLD', top: '' });
    beltT = new THREE.CanvasTexture(c); beltT.colorSpace = THREE.SRGBColorSpace; }
  return beltT;
}
/* ---------- props as models: in a prop's own units (a scene unit is about a foot), its middle at the origin, up is +y ---------- */
function part(g: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0): THREE.Mesh { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; m.rotation.z = rz; g.add(m); return m; }
const B3 = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d), C3 = (r0: number, r1: number, h: number, n = 14) => new THREE.CylinderGeometry(r0, r1, h, n);
const MODELS3: Record<string, () => THREE.Group> = {
  chair: () => { const g = new THREE.Group(), m = steel;   // a folding chair: seat, back, two frames of legs
    part(g, B3(0.9, 0.07, 0.85), m, 0, 0, 0); part(g, B3(0.9, 0.95, 0.06), m, 0, 0.55, -0.42);
    for (const sx of [-0.42, 0.42]) { part(g, C3(0.035, 0.035, 1.2, 8), m, sx, -0.5, 0.25, 0.25); part(g, C3(0.035, 0.035, 1.25, 8), m, sx, -0.2, -0.3, -0.2); }
    return g; },
  table: () => { const g = new THREE.Group(), top = card(PAL.wood)[0], leg = card(shade(PAL.wood, 0.6))[0];
    part(g, B3(3.2, 0.12, 1.4), top, 0, 0.06, 0); for (const sx of [-1.35, 1.35]) for (const sz of [-0.5, 0.5]) part(g, B3(0.08, 1.2, 0.08), leg, sx, -0.6, sz);
    return g; },
  table_broken: () => { const g = new THREE.Group(), top = card(PAL.wood)[0], leg = card(shade(PAL.wood, 0.6))[0];
    part(g, B3(1.55, 0.12, 1.4), top, -0.8, 0.0, 0, 0, 0.32); part(g, B3(1.55, 0.12, 1.4), top, 0.8, 0.02, 0, 0, -0.3);
    for (let i = 0; i < 5; i++) part(g, B3(0.05, 0.3, 0.05), card(shade(PAL.wood, 1.25))[0], -0.1 + i * 0.05, 0.35 + (i % 2) * 0.08, -0.4 + i * 0.2, 0, (i - 2) * 0.3);
    for (const sx of [-1.35, 1.35]) part(g, B3(0.08, 1.0, 0.08), leg, sx, -0.5, 0.5); return g; },
  ladder: () => { const g = new THREE.Group();   // two rails and six rungs, deep enough to read as steel
    for (const sx of [-0.45, 0.45]) part(g, B3(0.12, 3.3, 0.22), steel, sx, 0, 0);
    for (let i = 0; i < 6; i++) part(g, C3(0.045, 0.045, 0.84, 8), steel, 0, -1.35 + i * 0.54, 0, 0, Math.PI / 2);
    return g; },
  steps: () => { const g = new THREE.Group();
    for (let i = 0; i < 3; i++) part(g, B3(1.8 - i * 0.3, 0.45, 1.2), steel, 0.15 * i, -0.675 + i * 0.45, 0);
    return g; },
  bin: () => { const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color: 0x8a8e98, roughness: 0.45, metalness: 0.6 });
    part(g, C3(0.52, 0.45, 1.25, 18), m, 0, -0.07, 0); part(g, C3(0.6, 0.6, 0.06, 18), m, 0, 0.6, 0); part(g, C3(0.05, 0.05, 0.25, 8), m, 0, 0.7, 0, 0, Math.PI / 2);
    return g; },
  bat: () => { const g = new THREE.Group(); part(g, C3(0.1, 0.05, 1.55, 12), card(PAL.wood)[0], 0, 0, 0); part(g, C3(0.08, 0.08, 0.04, 12), card(shade(PAL.wood, 0.7))[0], 0, -0.78, 0); return g; },
};
/* ---------- rooms: the desk, the hallway, the office, the locker room, built as models with their own light ---------- */
function bx(root: THREE.Object3D, w: number, h: number, d: number, col: string | THREE.Material, x: number, y: number, z: number, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === 'string' ? card(col)[0] : col); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; root.add(m); return m;
}
function glow(col: number, i = 1): THREE.MeshStandardMaterial { return new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: i, roughness: 1 }); }
function plate(text: string, w: number, h: number, bg: string, fg: string): THREE.MeshStandardMaterial {
  const c = document.createElement('canvas'); c.width = Math.round(w * 64); c.height = Math.round(h * 64); const x = c.getContext('2d')!;
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.fillStyle = fg; x.font = Math.round(h * 36) + "px 'Craft Marker', 'EWF Sans', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9 });
}
const ROOMS: Record<string, (root: THREE.Group) => void> = {
  desk: root => {
    // the ring behind, raised on its apron, with the arena round it
    const ring = new THREE.Group(); arena(ring, false); ring.position.set(0, 4, -13.2); root.add(ring);
    // the three high-backed chairs
    for (const cx of DESK_SEATS) { bx(root, 1.8, 3.0, 0.28, '#16161b', cx, 3.4, -0.62); bx(root, 1.7, 0.35, 1.3, '#1c1c22', cx, 1.75, -0.1); bx(root, 0.14, 1.7, 0.14, steel, cx, 0.85, -0.1, false); }
    // the desk: its top, a front panel in the company's colours, the lettering, monitors, notes and coffee
    bx(root, 15.4, 0.16, 1.5, '#34405f', 0, 2.62, 1.45); bx(root, 15.42, 0.07, 0.1, PAL.gold, 0, 2.7, 2.2, false);
    bx(root, 15, 2.5, 0.14, '#1f2a52', 0, 1.25, 2.2); bx(root, 15.02, 0.32, 0.16, PAL.gold, 0, 2.15, 2.21); bx(root, 15.02, 0.12, 0.16, PAL.red, 0, 0.6, 2.21);
    const live = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.9), plate('LIVE', 2.6, 0.9, '#1f2a52', PAL.yellow)); live.position.set(-5.2, 1.3, 2.29); root.add(live);
    for (const mx of [-4.2, -0.9]) { const sc = bx(root, 0.9, 0.5, 0.06, '#111116', mx, 2.98, 1.15); sc.rotation.x = -0.25; bx(root, 0.12, 0.18, 0.12, '#2a2a30', mx, 2.78, 1.22, false); }
    for (const [nx, nz] of [[-2.5, 1.0], [4.9, 1.1]]) bx(root, 0.9, 0.03, 0.65, PAL.white, nx, 2.72, nz, false);
    for (const cx of [-1.45, 1.55]) { const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.38, 14), card(PAL.white)[0]); mug.position.set(cx, 2.89, 0.95); mug.castShadow = true; root.add(mug);
      const cof = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.02, 14), card('#5a3a26')[0]); cof.position.set(cx, 3.07, 0.95); root.add(cof); }
    // a cool light behind the two, picking out their edges, and a warm one in front
    const rim = new THREE.SpotLight(0x9fc0ff, 110, 34, 0.7, 0.6, 1.2); rim.position.set(0, 10, -5); rim.target.position.set(-0.9, 3.4, 0); root.add(rim, rim.target);
    const fill = new THREE.PointLight(0xffe0b8, 90, 40, 1.2); fill.position.set(-3, 8, 10); root.add(fill);
    const front = new THREE.SpotLight(0xfff0d8, 70, 30, 0.6, 0.7, 1.2); front.position.set(2, 6, 14); front.target.position.set(0, 1.6, 2.2); root.add(front, front.target);   // the front of the desk
  },
  hall: root => {
    const W = 4.6, L = 44;
    bx(root, W * 2, 0.2, L, '#7d7a72', 0, -0.1, 6 - L / 2, false);
    for (const sd of [-1, 1]) {
      bx(root, 0.3, 10, L, sd < 0 ? '#56607a' : '#4d566e', sd * W, 5, 6 - L / 2, false);
      for (let i = 1; i < 10; i++) bx(root, 0.32, 0.05, L, '#45506a', sd * W, i, 6 - L / 2, false);   // the lines of the blocks
    }
    bx(root, W * 2, 0.3, L, '#2b2f3c', 0, 10, 6 - L / 2, false);
    for (let i = 0; i < 6; i++) { const z = 2 - i * 7; bx(root, 2.4, 0.1, 1.2, glow(0xfff2c8, 1.6), 0, 9.8, z, false); const l = new THREE.PointLight(0xfff0cc, 40, 22, 1.4); l.position.set(0, 9, z); root.add(l); }
    bx(root, 3.2, 7, 0.3, '#3a2a1c', 0, 3.5, 6 - L); bx(root, 0.25, 0.25, 0.1, PAL.gold, 1.1, 3.4, 6 - L + 0.2);   // the far door
    for (const z of [-6, -20, -32]) bx(root, 0.2, 7.2, 3.2, '#2a3a2a', W - 0.12, 3.6, z);                               // doors on the right
    for (const [z, w, h] of [[-3, 2.6, 2.2], [-6.5, 2.2, 1.6], [-10, 2.6, 2.4]] as number[][]) {                       // road cases on the left
      bx(root, 2.0, h, w, '#18181c', -W + 1.2, h / 2, z); for (const yy of [0.15, h - 0.15]) bx(root, 2.05, 0.12, w + 0.05, steel, -W + 1.2, yy, z, false);
    }
  },
  ramp: root => {   // the top of the entrance: a wide stage, the ramp running toward the camera, the big screen and trusses behind
    bx(root, 26, 2.4, 9, '#1c1f2e', 0, -1.2, -1.5); bx(root, 26.2, 0.16, 9.2, '#2a2f45', 0, 0.02, -1.5, false); bx(root, 26.2, 0.28, 0.12, '#c8322a', 0, -0.16, 3.02, false);
    const len = 22, ang = Math.atan2(2.4, len), ramp = bx(root, 6, 0.25, len, '#59607e', 0, -1.2, 3 + len / 2); ramp.rotation.x = ang;
    for (const sx of [-1, 1]) { const lt = bx(root, 0.16, 0.08, len, glow(0x9fd0ff, 1.4) as any, sx * 2.85, -1.0, 3 + len / 2, false); lt.rotation.x = ang; }
    bx(root, 19, 11.4, 0.6, '#0d0e14', 0, 7.6, -7.4);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(18, 10.4), tron()); scr.position.set(0, 7.6, -7.05); scr.name = 'tron'; root.add(scr);
    for (const sx of [-1, 1]) { bx(root, 5.2, 7, 0.4, '#0d0e14', sx * 12.6, 5.4, -6.8); const ss = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 6.4), glow(sx < 0 ? 0xc8322a : 0x2f6bd8, 0.9)); ss.position.set(sx * 12.6, 5.4, -6.58); root.add(ss); }
    bx(root, 30, 0.5, 0.5, steel, 0, 14, -2, false); for (const sx of [-14.5, 14.5]) bx(root, 0.5, 15.2, 0.5, steel, sx, 6.2, -2, false);
    for (let i = 0; i < 6; i++) { const x = -10 + i * 4, sp = new THREE.SpotLight(i % 2 ? 0xffd8a0 : 0x9fb8ff, 45, 30, 0.35, 0.6, 1.4); sp.position.set(x, 13.6, -1.8); sp.target.position.set(x * 0.4, 0, 1); root.add(sp, sp.target); }
    stand(root, -40, -9, 14, 1.6, 6, -2.4, 0.9, 0, 81); stand(root, 9, 40, 14, 1.6, 6, -2.4, 0.9, 0, 83);   // the fans down either side of the ramp
    bx(root, 120, 0.1, 120, '#141728', 0, -2.5, 0, false);
  },
  backstage: root => {   // the wall behind the curtain: black drapes, road cases, a monitor, a door, cables on the floor
    bx(root, 40, 0.2, 18, '#3a3a40', 0, -0.1, 0, false); bx(root, 40, 12, 0.3, '#121216', 0, 6, -4);
    for (let i = 0; i < 20; i++) bx(root, 1.4, 11.6, 0.2, i % 2 ? '#16161b' : '#1d1d24', -19 + i * 2, 6, -3.7, false);   // folds of the drape
    for (const [x, w, h] of [[-8, 2.6, 2.2], [-5.4, 2.0, 3.2], [7, 2.8, 1.8], [9.6, 2.2, 2.6]] as number[][]) { bx(root, w, h, 1.8, '#18181c', x, h / 2, -2.4); for (const yy of [0.15, h - 0.15]) bx(root, w + 0.05, 0.12, 1.85, steel, x, yy, -2.4, false); }
    bx(root, 0.15, 6, 0.15, '#2a2a30', 4.2, 3, -2.6); const mon = bx(root, 2.2, 1.4, 0.2, '#111116', 4.2, 6.4, -2.6); const scr = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), tron()); scr.position.set(4.2, 6.4, -2.48); root.add(scr); mon.castShadow = true;
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.TorusGeometry(0.6 + i * 0.15, 0.04, 6, 24), card('#0e0e10')[0]); c.rotation.x = Math.PI / 2; c.position.set(-2 + i * 0.3, 0.05, 1 - i * 0.2); root.add(c); }
    bx(root, 3.4, 7.4, 0.3, '#2b2f3c', 13.5, 3.7, -3.6); bx(root, 2.8, 0.7, 0.1, glow(0x3ad06a, 1.3) as any, 13.5, 8, -3.4, false);   // a door with a lit sign over it
    const l = new THREE.SpotLight(0xffe8c8, 120, 34, 0.7, 0.6, 1.3); l.position.set(0, 14, 8); l.target.position.set(0, 2, -2); root.add(l, l.target);
  },
  lot: root => {   // the parking lot at night: tarmac with lines, two cars, a light pole, a chain-link fence and the building
    bx(root, 70, 0.2, 40, '#2c2d31', 0, -0.1, -6, false);
    for (let i = -4; i <= 4; i++) bx(root, 0.2, 0.03, 6, '#e8e4d6', i * 4.2, 0.02, -7, false);
    const car = (x: number, z: number, col: string) => { bx(root, 7, 1.6, 3.2, col, x, 1.3, z); bx(root, 4, 1.2, 2.9, shade(col, 0.85), x - 0.4, 2.6, z); bx(root, 3.8, 1.0, 2.95, '#1a2230', x - 0.4, 2.6, z, false);
      for (const wx of [-2.3, 2.3]) for (const wz of [-1.5, 1.5]) { const w = new THREE.Mesh(C3(0.7, 0.7, 0.4, 16), card('#111')[0]); w.rotation.x = Math.PI / 2; w.position.set(x + wx, 0.7, z + wz); root.add(w); } };
    car(-9, -7, '#7a1f1f'); car(8.5, -7.4, '#2f4f7a');
    bx(root, 0.35, 16, 0.35, steel, -15, 8, -2); bx(root, 3, 0.4, 1, '#222', -14, 16, -2); const pl = new THREE.SpotLight(0xffe2a8, 220, 40, 0.8, 0.6, 1.3); pl.position.set(-13.5, 15.6, -2); pl.target.position.set(-4, 0, -3); root.add(pl, pl.target);
    for (const [x0, x1] of [[-30, 30]]) fenceFlat(root, x0, -14, x1, -14, 0, 7);
    bx(root, 70, 20, 1, '#3b3f4a', 0, 10, -24); bx(root, 6, 7, 0.4, '#555a66', 16, 3.5, -23.4); bx(root, 6.4, 1.2, 0.3, glow(0xff5a3a, 1.2) as any, 16, 8, -23.3, false);   // the building, its stage door, a sign
  },
  talk: root => {   // a talk show: a desk on the left, two chairs, a skyline backdrop, a band stand of lights
    bx(root, 30, 0.2, 16, '#3a2a40', 0, -0.1, 0, false); bx(root, 30, 0.1, 10, '#6a3a5a', 0, 0.02, 0, false);
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(30, 13), skyline()); sky.position.set(0, 6.5, -5); root.add(sky);
    bx(root, 4.8, 2.6, 1.8, '#5a2a1e', -4.6, 1.3, -0.5); bx(root, 5, 0.14, 2, '#7a3a28', -4.6, 2.66, -0.5, false);
    for (const x of [1.4, 4.2]) { bx(root, 1.8, 1.0, 1.6, '#c8322a', x, 1.4, -0.8); bx(root, 1.8, 2.0, 0.4, '#c8322a', x, 2.4, -1.5); bx(root, 0.25, 0.9, 0.25, '#2a2a30', x, 0.45, -0.8, false); }
    for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), glow(i % 2 ? 0xffd84a : 0xff5aa0, 1.6)); b.position.set(-13 + i * 3.7, 12.4, -4.6); root.add(b); }
    const l = new THREE.SpotLight(0xffe8d0, 150, 34, 0.75, 0.6, 1.3); l.position.set(0, 13, 10); l.target.position.set(0, 2, -1); root.add(l, l.target);
  },
  news: root => {   // a news desk: a curved desk, a wall of screens, blue light
    bx(root, 30, 0.2, 16, '#20283a', 0, -0.1, 0, false);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const sc = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6), (i + j) % 2 ? tron() : glow(0x2f6bd8, 0.8)); sc.position.set(-6.9 + i * 4.6, 4.2 + j * 2.8, -5); root.add(sc); }
    bx(root, 19, 6, 0.3, '#0d0e14', 0, 5.6, -5.2);
    const desk = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 2.6, 32, 1, true, -0.7, 1.4), card('#c8ccd6')[0]); desk.position.set(0, 1.3, -6.4); (desk.material as any).side = THREE.DoubleSide; root.add(desk);
    bx(root, 9, 0.14, 1.6, '#e8ecf4', 0, 2.66, -0.4, false); bx(root, 8.6, 0.3, 0.1, '#c8322a', 0, 2.2, 0.39, false);
    const l = new THREE.SpotLight(0xdde8ff, 150, 34, 0.75, 0.6, 1.3); l.position.set(0, 13, 10); l.target.position.set(0, 2, -1); root.add(l, l.target);
  },
  rafters: root => {   // up in the rafters: a catwalk of steel grating over a dark drop, lights and the ring far below
    bx(root, 40, 0.2, 3, '#4a4e58', 0, -0.1, 0, false); for (let i = -20; i <= 20; i++) bx(root, 0.06, 0.24, 3, '#2a2c33', i, 0, 0, false);
    for (const sz of [-1.5, 1.5]) { bx(root, 40, 0.1, 0.1, steel, 0, 3.4, sz, false); for (let i = -20; i <= 20; i += 4) bx(root, 0.1, 3.4, 0.1, steel, i, 1.7, sz, false); }
    for (let i = -18; i <= 18; i += 6) { bx(root, 0.3, 0.3, 30, '#2a2c33', i, 9, -8, false); const sp = new THREE.SpotLight(0xffe2b0, 60, 60, 0.4, 0.6, 1.4); sp.position.set(i, 8, 0); sp.target.position.set(i * 0.2, -40, -20); root.add(sp, sp.target); }
    const ring = new THREE.Group(); arena(ring, true); ring.scale.setScalar(0.6); ring.position.set(0, -38, -24); root.add(ring);
  },
  catering: root => {   // catering: long tables with cloths and trays of food, a coffee urn, folding chairs, a menu board
    bx(root, 40, 0.2, 20, '#8a7a62', 0, -0.1, -2, false); bx(root, 40, 12, 0.3, '#c9b48a', 0, 6, -8); bx(root, 40, 1.2, 0.35, '#7a5a3a', 0, 1.2, -7.8, false);
    for (const z of [-5.6, -2.8]) { bx(root, 12, 0.12, 2.2, PAL.white, 0, 2.5, z); bx(root, 12.1, 0.9, 2.3, '#e8e4d6', 0, 2.05, z, false);
      for (let i = -2; i <= 2; i++) { bx(root, 1.6, 0.25, 1.1, steel, i * 2.4, 2.7, z); bx(root, 1.3, 0.2, 0.8, i % 2 ? '#c8622a' : '#5a8a3a', i * 2.4, 2.88, z, false); } }
    const urn = new THREE.Mesh(C3(0.5, 0.55, 1.6, 16), steel); urn.position.set(9, 3.4, -5.6); root.add(urn);
    for (let i = 0; i < 6; i++) { const ch = MODELS3.chair(); ch.scale.setScalar(1.2); ch.position.set(i < 3 ? -13 + i * 1.6 : 11 + (i - 3) * 1.6, 1.4, 0.4); ch.rotation.y = Math.PI; root.add(ch); }
    bx(root, 6, 3.6, 0.2, '#1c1d22', -11, 7, -7.6); const mn = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 3), plate("TONIGHT'S MENU", 5.4, 3, '#1c1d22', '#ffe48a')); mn.position.set(-11, 7, -7.48); root.add(mn);
    const l = new THREE.PointLight(0xffe8c8, 120, 40, 1.2); l.position.set(0, 10, 4); root.add(l);
  },
  trainer: root => {   // the trainer's room: a padded table, shelves of tape and bottles, an ice tub, a curtain, a bright lamp
    bx(root, 30, 0.2, 18, '#d8dcd4', 0, -0.1, -2, false); bx(root, 30, 12, 0.3, '#e8eef0', 0, 6, -7); bx(root, 0.3, 12, 18, '#dfe6e8', -12, 6, -2, false);
    bx(root, 6.4, 0.6, 2.4, '#2f5f8a', 2.5, 2.6, -2.5); for (const sx of [-2.8, 2.8]) for (const sz of [-1, 1]) bx(root, 0.15, 2.4, 0.15, steel, 2.5 + sx, 1.2, -2.5 + sz, false);
    for (let r = 0; r < 3; r++) { bx(root, 5, 0.12, 1, '#b8bcc4', -8, 2.6 + r * 2.2, -6.2); for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(C3(0.18, 0.18, 0.6, 10), card(i % 3 ? '#e8e4d6' : '#c8322a')[0]); b.position.set(-10 + i * 0.8, 3 + r * 2.2, -6.1); root.add(b); } }
    const tub = new THREE.Mesh(C3(1.2, 1.0, 1.6, 20), card('#7a8a9a')[0]); tub.position.set(-6, 0.8, 1); root.add(tub); const ice = new THREE.Mesh(C3(1.12, 1.12, 0.05, 20), card('#dff4ff')[0]); ice.position.set(-6, 1.58, 1); root.add(ice);
    for (let i = 0; i < 6; i++) bx(root, 1.2, 9, 0.1, i % 2 ? '#6aa0b0' : '#7ab0c0', 9 + i * 0.9, 5, -3 + i * 0.25, false);   // the curtain
    const lamp = new THREE.SpotLight(0xffffff, 80, 30, 0.6, 0.5, 1.2); lamp.position.set(2.5, 11, 2); lamp.target.position.set(2.5, 2.5, -2.5); root.add(lamp, lamp.target);
  },
  weights: root => {   // the weight room: a rubber floor, a bench and bar, a rack of dumbbells, a mirror wall
    bx(root, 34, 0.2, 18, '#2a2b30', 0, -0.1, -2, false); bx(root, 34, 12, 0.3, '#5a5e66', 0, 6, -7);
    const mir = new THREE.Mesh(new THREE.PlaneGeometry(20, 7), new THREE.MeshStandardMaterial({ color: 0x9aa8b6, roughness: 0.25, metalness: 0.2 })); mir.position.set(0, 5, -6.8); root.add(mir);
    bx(root, 4.4, 0.4, 1.2, '#1a1a1e', -5, 1.6, -1); bx(root, 0.2, 1.4, 1.2, steel, -5, 0.7, -1, false);
    for (const sx of [-1, 1]) bx(root, 0.15, 3.6, 0.15, steel, -3.6 * sx * 0 - 5 + sx * 1.6, 1.8, -2, false);
    const bar = new THREE.Mesh(C3(0.06, 0.06, 7, 8), steel); bar.rotation.z = Math.PI / 2; bar.position.set(-5, 3.4, -2); root.add(bar);
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const pl = new THREE.Mesh(C3(0.9 - k * 0.2, 0.9 - k * 0.2, 0.18, 20), card('#111')[0]); pl.rotation.z = Math.PI / 2; pl.position.set(-5 + sx * (2.6 + k * 0.2), 3.4, -2); root.add(pl); }
    bx(root, 8, 0.2, 1.4, steel, 7, 1.6, -4.8); bx(root, 8, 0.2, 1.4, steel, 7, 3, -4.8);
    for (let i = 0; i < 6; i++) for (const yy of [1.95, 3.35]) { const db = new THREE.Mesh(C3(0.28, 0.28, 0.9, 10), card('#2a2a30')[0]); db.rotation.z = Math.PI / 2; db.position.set(4 + i * 1.2, yy, -4.8); root.add(db); }
    for (let i = -2; i <= 2; i++) bx(root, 5, 0.15, 0.5, glow(0xeef4ff, 1.3) as any, i * 7, 11.6, -2, false);
    const wl = new THREE.PointLight(0xeef4ff, 140, 40, 1.2); wl.position.set(0, 10, 5); root.add(wl);
  },
  office: root => {
    bx(root, 30, 0.2, 30, '#3a3f5a', 0, -0.1, 0, false);                                                               // the carpet
    bx(root, 26, 12, 0.3, '#5a3d28', 0, 6, -4.6, false); for (let i = 0; i < 9; i++) bx(root, 0.08, 12, 0.32, '#4a3020', -11 + i * 2.75, 6, -4.55, false);
    bx(root, 0.3, 12, 20, '#4f3624', -12, 6, 5, false);
    bx(root, 5.2, 3.6, 0.1, glow(0xd8ecf8, 0.9), -6, 5.6, -4.4, false); for (let i = 0; i < 10; i++) bx(root, 5.2, 0.16, 0.12, '#e9e2cf', -6, 3.95 + i * 0.36, -4.3);   // the window and blinds
    bx(root, 3.8, 2.4, 0.2, '#2b1b10', 2.6, 6.2, -4.4); bx(root, 3.4, 2.0, 0.22, '#7a1418', 2.6, 6.2, -4.36, false);    // the frame
    bx(root, 3.0, 0.32, 0.25, PAL.black, 2.6, 6.2, -4.3, false); const plateB = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), card(PAL.gold)[0]); plateB.rotation.x = Math.PI / 2; plateB.position.set(2.6, 6.2, -4.18); root.add(plateB);
    bx(root, 6.4, 0.25, 2.8, '#6b4228', 4.6, 2.6, 1.6); bx(root, 6.2, 2.5, 0.12, '#4a2c18', 4.6, 1.25, 2.95); bx(root, 0.12, 2.5, 2.6, '#4a2c18', 1.5, 1.25, 1.6);   // the big desk
    bx(root, 2.0, 3.6, 0.35, '#1a1a1f', 4.6, 3.6, -1.2); bx(root, 1.9, 0.4, 1.6, '#1a1a1f', 4.6, 1.6, -0.5);              // its chair
    bx(root, 1.2, 0.05, 0.8, PAL.white, 3.4, 2.75, 1.6, false);
    const sun = new THREE.PointLight(0xdcecff, 55, 30, 1.2); sun.position.set(-6, 6, -2); root.add(sun);
    const lamp = new THREE.PointLight(0xffdca8, 35, 20, 1.3); lamp.position.set(5, 6.5, 3); root.add(lamp);
  },
  locker: root => {
    bx(root, 30, 0.2, 20, '#b9b4a8', 0, -0.1, 4, false); for (let i = 0; i < 14; i++) bx(root, 0.05, 0.21, 20, '#9a958a', -13 + i * 2, -0.08, 4, false);
    bx(root, 30, 12, 0.3, '#40463a', 0, 6, -3.6, false);
    for (let i = 0; i < 13; i++) { const x = -11 + i * 1.82;
      bx(root, 1.75, 6.4, 0.7, i % 2 ? '#5d6f86' : '#566a82', x, 3.2, -3.0);
      for (let v = 0; v < 3; v++) bx(root, 1.0, 0.08, 0.72, '#2b3442', x, 5.6 - v * 0.2, -2.98, false);
      bx(root, 0.1, 0.5, 0.74, steel, x + 0.6, 3.2, -2.96, false);
    }
    bx(root, 6.6, 0.3, 1.1, PAL.wood, -3.3, 1.3, -1.4); for (const lx of [-6.2, -0.4]) bx(root, 0.25, 1.2, 0.8, shade(PAL.wood, 0.6), lx, 0.6, -1.4);   // the bench
    bx(root, 0.9, 1.5, 0.08, PAL.white, 4.4, 4.3, -2.6); bx(root, 0.9, 1.7, 0.08, PAL.red, 6.2, 4.2, -2.6);              // towels
    for (const x of [-6, 2]) { bx(root, 3, 0.1, 1, glow(0xf4f8ff, 1.4), x, 11.8, 1, false); const l = new THREE.PointLight(0xf4f8ff, 45, 26, 1.3); l.position.set(x, 10.5, 2); root.add(l); }
  },
};
/** A set that is not a ring: its 2D painting as a backdrop flat, and a floor in front of it. */
function flat(root: THREE.Group, sc: Scene) {
  const c = document.createElement('canvas'); c.width = 2200; c.height = 1400; const x = c.getContext('2d')!;
  const v: View = { s: 100, ox: 1100, oy: 700 }, set = build({ ...sc, slots: [], keys: [{ t: 0, figs: {}, props: [] }] }, { t: 0, figs: {}, props: [] }, {}).pieces;
  drawScene(x, set, v, 'flat-' + setKey(sc.set));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  back.position.set(0, -FOOT, -2.5); back.receiveShadow = true; root.add(back);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 10), card('#3a3d4a')[0]); fl.position.set(0, -0.1, 2.4); fl.receiveShadow = true; root.add(fl);
}

/* ---------- the camera for each set ---------- */
const P: Record<string, [number[], number[]]> = { ring: [[0, 9, 21], [0, 3.2, 0]], ringlow: [[0, 2.2, 15], [0, 4.2, 0]], ringcorner: [[15, 9, 15], [0, 3.2, 0]],
  ringside: [[9, -1.2, 14.5], [0, 2.4, 2]], ladder: [[0, 10, 27], [0, 6.5, 0]], catering: [[0, 5, 14], [0, 3.4, -1]], trainer: [[0, 5, 14], [0, 3.4, -1]], weights: [[0, 5, 14], [0, 3.4, -1]], cage: [[0, 10, 23], [0, 3.6, 0]], cell: [[0, 13, 30], [0, 4, 0]], inferno: [[0, 10, 24], [0, 3.2, 0]], ballroom: [[0, 9, 21], [0, 3.2, 0]], gym: [[0, 9, 21], [0, 3.2, 0]], bigstadium: [[0, 11, 26], [0, 3.2, 0]],
  desk: [[0, 4.3, 13.5], [0, 2.6, 0]], ramp: [[0, 4.5, 18], [0, 3.4, 0]], backstage: [[0, 5, 14], [0, 3.6, 0]], lot: [[0, 5, 15], [0, 3.4, -2]], talk: [[0, 4.8, 14], [0, 3.4, 0]], news: [[0, 4.8, 13], [0, 3.4, 0]], rafters: [[0, 8, 16], [0, 1.5, -4]], hall: [[0, 5.2, 13], [0, 3.8, -6]], office: [[0, 5, 14], [0, 3.6, 0]], locker: [[0, 5, 14], [0, 3.6, -1]] };
/** The set's own camera: where it stands and what it looks at. */
export function homeShot(set: string): Cam3 { const [pos, look] = P[set] || [[0, 5.5, 17], [0, 3.6, 0]]; return { p: pos.slice() as any, t: look.slice() as any, fov: 30 }; }
function frame(set: string, cam: THREE.PerspectiveCamera, ctl: OrbitControls, k: Key) {
  if (k.cam3) {   // the keyframe's own camera, placed in the model
    const c3 = k.cam3; cam.position.set(c3.p[0], c3.p[1], c3.p[2]); ctl.target.set(c3.t[0], c3.t[1], c3.t[2]); cam.fov = c3.fov || 30; cam.zoom = 1; cam.updateProjectionMatrix(); ctl.update(); return;
  }
  const c = k.cam || { x: 0, y: 0, z: 1, r: 0 };
  const [pos, look] = P[set] || [[0, 5.5, 17], [0, 3.6, 0]];
  cam.position.set(pos[0] + c.x, pos[1] + c.y, pos[2]); ctl.target.set(look[0] + c.x, look[1] + c.y, look[2]); cam.fov = 30; cam.zoom = c.z; cam.rotation.z = 0; cam.updateProjectionMatrix(); ctl.update();
}
/** The shots Create a Scene offers: each worked out from the set's own camera, or from the person picked. */
export const SHOTS: [string, string][] = [['home', 'The set camera'], ['low', 'Low angle'], ['high', 'High angle'], ['left', 'From the left'], ['right', 'From the right'], ['over', 'Straight down'], ['wide', 'Pull back wide'], ['close', 'Close-up on who is picked'], ['face', 'Face to face with who is picked']];

/** A 3D stage on a canvas. `show(sc, key, cast)` puts a moment of a scene on it; the pointer orbits the camera. */
export class Diorama3D {
  r: THREE.WebGLRenderer; scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.5, 400); ctl: OrbitControls; comp: EffectComposer; bokeh: BokehPass;
  world = new THREE.Group(); people = new THREE.Group(); set = ''; raf = 0; framed = '';
  /** `interactive` false is the broadcast: the camera is the scene's own and cannot be walked round. */
  constructor(canvas: HTMLCanvasElement, interactive = true) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color('#0a0c1c'); this.scene.fog = new THREE.Fog('#0a0c1c', 38, 95);
    this.scene.add(new THREE.HemisphereLight(0x9fb0e0, 0x20222e, 0.55));
    const key = new THREE.DirectionalLight(0xfff3dc, 2.2); key.position.set(-14, 34, 22); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -16; key.shadow.camera.right = 16; key.shadow.camera.top = 16; key.shadow.camera.bottom = -16; key.shadow.camera.near = 5; key.shadow.camera.far = 90; key.shadow.radius = 4; key.shadow.bias = -0.0005;
    this.scene.add(key);
    this.scene.add(this.world, this.people);
    this.ctl = new OrbitControls(this.cam, canvas); this.ctl.enableDamping = false; this.ctl.addEventListener('change', () => this.ask());
    if (!interactive) this.ctl.enabled = false; this.ctl.maxPolarAngle = Math.PI * 0.49; this.ctl.minDistance = 1.5; this.ctl.maxDistance = 70;
    this.comp = new EffectComposer(this.r); this.comp.addPass(new RenderPass(this.scene, this.cam));
    this.bokeh = new BokehPass(this.scene, this.cam, { focus: 21, aperture: 0.0006, maxblur: 0.006 }); this.comp.addPass(this.bokeh); this.comp.addPass(new OutputPass());
    this.ask();
  }
  /** Draw on the next frame, once: the picture is only drawn again when something has changed (a Steam Deck on battery
      should not draw a still picture sixty times a second). */
  ask() { if (this.raf) return; this.raf = requestAnimationFrame(() => { this.raf = 0; this.face(); if (this.drawn % 3 === 0) this.feed(); (this.bokeh.uniforms as any).focus.value = this.cam.position.distanceTo(this.ctl.target); this.comp.render(); this.drawn++; }); }
  /** The big screen in the arena shows what the camera sees, like the live feed in a real building (Ryan, 20 October).
      The picture is taken just before the real one, with the screen itself left out of it. */
  tronRT: THREE.WebGLRenderTarget | null = null; tronScr: THREE.Mesh | null = null;
  feed() {
    const s = this.tronScr; if (!s) return;
    if (!this.tronRT) { this.tronRT = new THREE.WebGLRenderTarget(512, 296); this.tronRT.texture.colorSpace = THREE.SRGBColorSpace; s.material = new THREE.MeshBasicMaterial({ map: this.tronRT.texture, toneMapped: false }); }
    s.visible = false; this.r.setRenderTarget(this.tronRT); this.r.render(this.scene, this.cam); this.r.setRenderTarget(null); s.visible = true;
  }
  drawn = 0;
  size(w: number, h: number) { this.r.setSize(w, h, false); this.comp.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.ask(); }
  /** The people and props, each a group that turns to face the camera like a paper figure, so it never looks thin
      from the side. `rigs` are the last joints, for dragging a part in 3D. */
  groups: THREE.Group[] = []; rigs: Record<string, Rig> = {}; hold: Record<string, string> = {}; sel: { who: string; part: string } | null = null;
  show(sc: Scene, k: Key, cast: Record<string, Recipe>, time = 0, sel: { who: string; part: string } | null = null) {
    if (this.set !== setKey(sc.set)) { this.clear(this.world); const room = ROOMS[sc.set]; if (RINGS.includes(sc.set)) arena(this.world, true, sc.set); else if (room) room(this.world); else flat(this.world, sc); this.mood(sc.set); this.set = setKey(sc.set); this.framed = '';
      this.tronScr = (this.world.getObjectByName('tron') as THREE.Mesh) || null; }
    const fk = sc.set + JSON.stringify(k.cam || null) + JSON.stringify(k.cam3 || null); if (this.framed !== fk) { frame(sc.set, this.cam, this.ctl, k); this.framed = fk; }
    this.clear(this.people); this.groups = []; this.sel = sel;
    const b = build(sc, k, cast, time); this.rigs = b.rigs; this.hold = b.hold;
    const byWho = new Map<string, Piece[]>();
    for (const p of b.pieces) { if (p.layer || p.soft) continue; const w = p.own != null ? 'f:' + (b.hold[p.own] || p.own) : p.prop != null ? 'p:' + p.prop : 'x:' + byWho.size; (byWho.get(w) || byWho.set(w, []).get(w)!).push(p); }
    byWho.forEach((ps, w) => {
      const kind = w[0], id = w.slice(2), f = kind === 'f' ? k.figs[id] : null;
      // a prop standing on its own is a real model (Ryan, 20 October: "better props ... that are 3d"); one in somebody's hands stays card
      const pr = kind === 'p' ? k.props.find(q => q.id === id) : null, mk = pr && !pr.at ? MODELS3[pr.k] : null;
      if (pr && mk) {
        const g = mk(); g.position.set(pr.x, pr.y - FOOT, pr.z * DEPTH); g.rotation.z = (pr.r || 0) * Math.PI / 180; g.scale.setScalar(pr.s || 1);
        g.userData = { who: id, prop: true, solid: true }; g.traverse(o => { if ((o as THREE.Mesh).isMesh) { o.userData = { who: id, prop: true }; o.castShadow = true; o.receiveShadow = true;
          if (sel && sel.who === id) (o as THREE.Mesh).material = lit('#ffe14a')[0]; } });
        this.people.add(g); this.groups.push(g); return;
      }
      // the pivot: the figure's waist, or the middle of the prop; it stands at the depth of its layer
      let px = 0, n = 0; if (f) px = f.x; else { for (const p of ps) for (const q of p.pts) { px += q[0]; n++; } px = n ? px / n : (ps[0].txt ? ps[0].txt.x : 0); }
      const base = f ? f.z : Math.min(...ps.map(p => p.z)), g = new THREE.Group(); g.position.set(px, 0, base * DEPTH);
      g.userData = { who: id, prop: kind === 'p' };
      const minD = Math.min(...ps.map(q => (q.z - base) * 0.06));   // a figure's margins all lie behind it
      for (const p of ps) {
        const d = (p.z - base) * 0.06, m = p.txt ? words(p, d) : slab(p, d, kind === 'f'); if (!m) continue;
        if (kind === 'f' && !p.txt) { const mg = margin(p, minD); if (mg) { mg.position.x -= px; mg.userData = { who: kind === 'f' && p.own != null ? p.own : id, joint: p.joint }; g.add(mg); } }
        const pw = kind === 'f' && p.own != null ? p.own : id;   // a held person is cut on the card of the one holding them
        m.position.x -= px; m.userData = { who: pw, joint: p.joint, prop: kind === 'p' };
        if (sel && sel.who === pw && (sel.part === 'body' || sel.part === 'prop' || p.joint === sel.part) && !p.txt) m.material = lit(p.col);
        g.add(m);
      }
      if (f && sel && (sel.who === id || b.hold[sel.who] === id) && this.rigs[sel.who] && this.rigs[sel.who].joints[sel.part]) {   // a bright pin on the picked joint
        const rg = this.rigs[sel.who], j = rg.joints[sel.part], wx = rg.f < 0 ? 2 * rg.rootx - j.x : j.x;
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe14a })); pin.position.set(wx - px, j.y - FOOT, 1.2); g.add(pin);
      }
      this.people.add(g); this.groups.push(g);
    });
    this.ask();
  }
  /** The camera as it stands now, to keep on a keyframe. */
  view(): Cam3 { const r = (v: number) => Math.round(v * 100) / 100, p = this.cam.position, t = this.ctl.target; return { p: [r(p.x), r(p.y), r(p.z)], t: [r(t.x), r(t.y), r(t.z)], fov: Math.round(this.cam.fov) }; }
  /** Put the camera somewhere without keeping it (looking round, or trying a shot before it is kept). */
  look(c: Cam3) { this.cam.position.set(c.p[0], c.p[1], c.p[2]); this.ctl.target.set(c.t[0], c.t[1], c.t[2]); this.cam.fov = c.fov || 30; this.cam.zoom = 1; this.cam.updateProjectionMatrix(); this.ctl.update(); this.ask(); }
  /** Where a person stands in the model (their waist), for shots that look at them. */
  spot(who: string): [number, number, number] | null { const g = this.groups.find(x => x.userData.who === (this.hold[who] || who)), rg = this.rigs[who]; if (!g || !rg) return null; const c = rg.anchors.chest || rg.anchors.waist; return [g.position.x, c ? c[1] - FOOT : 3, g.position.z]; }
  /** Slide the camera, keeping its angle, until a person is in the middle of the picture (somebody just put on a turnbuckle out of view). */
  follow(who: string) { const at = this.spot(who), g = this.groups.find(x => x.userData.who === (this.hold[who] || who)); if (!at || !g) return; const t = this.ctl.target, d = new THREE.Vector3(at[0] - t.x, at[1] + g.position.y - t.y, at[2] - t.z); this.cam.position.add(d); t.add(d); this.ctl.update(); this.ask(); }
  /** A named shot (SHOTS), worked out from the set's camera or the picked person. */
  shot(set: string, kind: string, who?: string): Cam3 {
    const h = homeShot(set), p = new THREE.Vector3(...h.p), t = new THREE.Vector3(...h.t), at = who ? this.spot(who) : null;
    const turn = (deg: number) => { const d = p.clone().sub(t), a = deg * Math.PI / 180, x = d.x * Math.cos(a) - d.z * Math.sin(a), z = d.x * Math.sin(a) + d.z * Math.cos(a); p.set(t.x + x, p.y, t.z + z); };
    if (kind === 'low') { p.y = Math.max(1.2, t.y * 0.4); t.y += 1.2; }
    else if (kind === 'high') p.y += 12;
    else if (kind === 'left') turn(-40);
    else if (kind === 'right') turn(40);
    else if (kind === 'over') { p.set(t.x, 32, t.z + 0.6); }
    else if (kind === 'wide') { p.sub(t).multiplyScalar(1.7).add(t); return { p: p.toArray() as any, t: t.toArray() as any, fov: 40 }; }
    else if ((kind === 'close' || kind === 'face') && at) {
      const tt = new THREE.Vector3(at[0], at[1] + (kind === 'face' ? 0.8 : 0), at[2]), dir = this.cam.position.clone().sub(tt).setY(0).normalize();
      const np = tt.clone().add(dir.multiplyScalar(kind === 'face' ? 5 : 8)); np.y = tt.y + (kind === 'face' ? 0.2 : 1);
      return { p: np.toArray().map(v => Math.round(v * 100) / 100) as any, t: tt.toArray().map(v => Math.round(v * 100) / 100) as any, fov: kind === 'face' ? 24 : 28 };
    }
    return { p: p.toArray().map(v => Math.round(v * 100) / 100) as any, t: t.toArray().map(v => Math.round(v * 100) / 100) as any, fov: h.fov };
  }
  /** Where the pointer meets the floor at height `h` (feet; the mat is 0): [x, depth], for moving somebody round the model. */
  toFloor(cx: number, cy: number, h = 0): [number, number] | null { const hit = new THREE.Vector3(); return this.ray(cx, cy).ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -h), hit) ? [hit.x, hit.z] : null; }
  /** The picture as it is now, as a PNG. */
  picture(): Promise<Blob | null> { this.face(); this.comp.render(); return new Promise(res => this.r.domElement.toBlob(b => res(b), 'image/png')); }
  /** Where a figure's anchor (chest, hand_n, ...) is on the screen, in client pixels (for tests and for pointing). */
  where(who: string, anchor = 'chest'): [number, number] | null {
    const g = this.groups.find(x => x.userData.who === (this.hold[who] || who)), rg = this.rigs[who]; if (!g || !rg || !rg.anchors[anchor]) return null;
    this.face(); g.updateMatrixWorld(true); const a = rg.anchors[anchor], v = g.localToWorld(new THREE.Vector3(a[0] - g.position.x, a[1] - FOOT, 0.3)).project(this.cam);
    const r = this.r.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
  }
  /** The air of the place: the dark of an arena, or a room lit from inside. */
  mood(set: string) {
    const inside = ['hall', 'office', 'locker', 'ballroom', 'gym', 'backstage', 'talk', 'news', 'catering', 'trainer', 'weights'].includes(set), c = set === 'bigstadium' ? '#0b1838' : set === 'ballroom' ? '#1a110c' : inside ? '#14161e' : '#0a0c1c', far = set === 'bigstadium' ? 2.4 : 1;
    this.scene.background = new THREE.Color(c); this.scene.fog = new THREE.Fog(c, (inside ? 26 : 38) * far, (inside ? 70 : 95) * far);
  }
  /** Turn every figure and prop toward the camera, round its own upright. */
  face() { for (const g of this.groups) if (!g.userData.solid) g.rotation.y = Math.atan2(this.cam.position.x - g.position.x, this.cam.position.z - g.position.z); }
  private ray(cx: number, cy: number): THREE.Raycaster {
    const r = this.r.domElement.getBoundingClientRect(), rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), this.cam); return rc;
  }
  /** What is under the pointer: a part of a person, a prop, or nothing. */
  pick(cx: number, cy: number): { who: string; part: string } | null {
    this.face(); this.people.updateMatrixWorld(true);
    for (const h of this.ray(cx, cy).intersectObjects(this.people.children, true)) { const u = h.object.userData; if (u && u.who != null) return { who: u.who, part: u.prop ? 'prop' : (u.joint && u.joint !== 'body' ? u.joint : 'body') }; }
    return null;
  }
  /** Where the pointer is on the card of a person or prop, in the scene's own units (for dragging a part round its pin). */
  toScene(who: string, cx: number, cy: number): [number, number] | null {
    const g = this.groups.find(x => x.userData.who === (this.hold[who] || who)); if (!g) return null;
    this.face(); g.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion), plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, g.position), hit = new THREE.Vector3();
    if (!this.ray(cx, cy).ray.intersectPlane(plane, hit)) return null;
    const l = g.worldToLocal(hit); return [l.x + g.position.x, l.y + FOOT];
  }
  clear(g: THREE.Group) { g.children.slice().forEach(c => { g.remove(c); c.traverse((o: any) => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m && !Array.isArray(m) && m.map && m.map.isTexture && m.map !== grainTex) { m.map.dispose(); m.dispose(); } }); }); }
  dispose() { cancelAnimationFrame(this.raf); if (this.tronRT) this.tronRT.dispose(); this.ctl.dispose(); this.clear(this.world); this.clear(this.people); this.r.dispose(); this.r.forceContextLoss(); }
}
