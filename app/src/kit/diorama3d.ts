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
import { Recipe, Rig } from './puppet';

const RINGS = ['ring', 'ringlow', 'ringcorner'];
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
  const c = document.createElement('canvas'), px = 64, w = Math.max(1, Math.ceil(t.s.length * 0.62 * t.size * px)), h = Math.ceil(t.size * px * 1.3);
  c.width = w; c.height = h; const x = c.getContext('2d')!; x.fillStyle = t.col; x.font = Math.round(t.size * px) + "px 'VT323', monospace"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t.s, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w / px, h / px), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  m.position.set(t.x, t.y - FOOT, d + CARD + 0.01); return m;
}

/* ---------- the arena: a ring of card and steel, a barricade, tiered stands of cardboard fans ---------- */
function arena(root: THREE.Group, near = true) {
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
  fans(root);
  entrance(root, box);
  deskSide(root, box);
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
/* ---------- rooms: the desk, the hallway, the office, the locker room, built as models with their own light ---------- */
function bx(root: THREE.Object3D, w: number, h: number, d: number, col: string | THREE.Material, x: number, y: number, z: number, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === 'string' ? card(col)[0] : col); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; root.add(m); return m;
}
function glow(col: number, i = 1): THREE.MeshStandardMaterial { return new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: i, roughness: 1 }); }
function plate(text: string, w: number, h: number, bg: string, fg: string): THREE.MeshStandardMaterial {
  const c = document.createElement('canvas'); c.width = Math.round(w * 64); c.height = Math.round(h * 64); const x = c.getContext('2d')!;
  x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height); x.fillStyle = fg; x.font = Math.round(h * 44) + "px 'VT323', monospace"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, c.width / 2, c.height / 2);
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
  desk: [[0, 4.3, 13.5], [0, 2.6, 0]], hall: [[0, 5.2, 13], [0, 3.8, -6]], office: [[0, 5, 14], [0, 3.6, 0]], locker: [[0, 5, 14], [0, 3.6, -1]] };
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
  ask() { if (this.raf) return; this.raf = requestAnimationFrame(() => { this.raf = 0; this.face(); this.feed(); (this.bokeh.uniforms as any).focus.value = this.cam.position.distanceTo(this.ctl.target); this.comp.render(); this.drawn++; }); }
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
    if (this.set !== setKey(sc.set)) { this.clear(this.world); const room = ROOMS[sc.set]; if (RINGS.includes(sc.set)) arena(this.world); else if (room) room(this.world); else flat(this.world, sc); this.mood(sc.set); this.set = setKey(sc.set); this.framed = '';
      this.tronScr = (this.world.getObjectByName('tron') as THREE.Mesh) || null; }
    const fk = sc.set + JSON.stringify(k.cam || null) + JSON.stringify(k.cam3 || null); if (this.framed !== fk) { frame(sc.set, this.cam, this.ctl, k); this.framed = fk; }
    this.clear(this.people); this.groups = []; this.sel = sel;
    const b = build(sc, k, cast, time); this.rigs = b.rigs; this.hold = b.hold;
    const byWho = new Map<string, Piece[]>();
    for (const p of b.pieces) { if (p.layer || p.soft) continue; const w = p.own != null ? 'f:' + (b.hold[p.own] || p.own) : p.prop != null ? 'p:' + p.prop : 'x:' + byWho.size; (byWho.get(w) || byWho.set(w, []).get(w)!).push(p); }
    byWho.forEach((ps, w) => {
      const kind = w[0], id = w.slice(2), f = kind === 'f' ? k.figs[id] : null;
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
    const inside = ['hall', 'office', 'locker'].includes(set), c = inside ? '#14161e' : '#0a0c1c';
    this.scene.background = new THREE.Color(c); this.scene.fog = new THREE.Fog(c, inside ? 26 : 38, inside ? 70 : 95);
  }
  /** Turn every figure and prop toward the camera, round its own upright. */
  face() { for (const g of this.groups) g.rotation.y = Math.atan2(this.cam.position.x - g.position.x, this.cam.position.z - g.position.z); }
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
