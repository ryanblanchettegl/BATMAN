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
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { Scene, Key, build, FOOT } from './scene';
import { Piece, PAL, shade, drawScene, View } from './paper';
import { Recipe, Rig } from './puppet';

const RINGS = ['ring', 'ringlow', 'ringcorner'];
const DEPTH = 0.9;      // a layer step, in feet of depth
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
/** The face of the card and its paler cut edge. */
function card(col: string): THREE.Material[] {
  let m = mats.get(col);
  if (!m) { m = [new THREE.MeshStandardMaterial({ color: new THREE.Color(col), roughness: 0.95, metalness: 0, map: grain() }), new THREE.MeshStandardMaterial({ color: new THREE.Color(shade(col, 1.25)), roughness: 1 })]; mats.set(col, m); }
  return m;
}
const lits = new Map<string, THREE.Material[]>();
/** A picked piece: the same card, glowing a little yellow. */
function lit(col: string): THREE.Material[] {
  let m = lits.get(col); if (!m) { m = card(col).map(x => { const c = (x as THREE.MeshStandardMaterial).clone(); c.emissive = new THREE.Color(0xffd23a); c.emissiveIntensity = 0.35; return c; }); lits.set(col, m); }
  return m;
}
const steel = new THREE.MeshStandardMaterial({ color: 0xb8bcc8, roughness: 0.35, metalness: 0.7 });

/** A cut piece as a slab of card standing at depth `d`. */
function slab(p: Piece, d: number): THREE.Mesh | null {
  if (p.pts.length < 3) return null;
  const sh = new THREE.Shape(p.pts.map(q => new THREE.Vector2(q[0], q[1] - FOOT)));
  const g = new THREE.ExtrudeGeometry(sh, { depth: CARD, bevelEnabled: false, steps: 1 });
  const m = new THREE.Mesh(g, card(p.col)); m.position.z = d; m.castShadow = true; m.receiveShadow = true; return m;
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
function arena(root: THREE.Group) {
  const box = (w: number, h: number, d: number, col: string | THREE.Material, x: number, y: number, z: number, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof col === 'string' ? card(col)[0] : col); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = shadow; root.add(m); return m;
  };
  const H = 10, APRON = 4;
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
  const B = 16;
  for (const [w, d, x, z] of [[B * 2, 0.3, 0, -B], [0.3, B * 2, B, 0], [0.3, B * 2, -B, 0], [B * 2, 0.3, 0, B]] as number[][]) box(w, 3.4, d, '#1b1d28', x, -APRON + 1.7, z);
  fans(root);
}
function fans(root: THREE.Group) {
  // a fan is two cut cards: the shirt and the head, facing the ring
  const body = new THREE.Shape(); body.ellipse(0, 0, 0.95, 0.8, 0, Math.PI, false, 0); body.lineTo(-0.95, 0);
  const bodyG = new THREE.ExtrudeGeometry(body, { depth: 0.05, bevelEnabled: false }), headG = new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14); headG.rotateX(Math.PI / 2);
  const spots: { x: number; y: number; z: number; ry: number; k: number }[] = [];
  const sides: [number, number][] = [[0, -1], [1, 0], [-1, 0]];
  for (const [sx, sz] of sides) for (let r = 0; r < 16; r++) {
    const dist = 19 + r * 1.75, y = -2.6 + r * 1.15, half = dist + 4, n = Math.floor(half * 2 / 1.55);
    for (let i = 0; i < n; i++) {
      const t = -half + (i + 0.5) * half * 2 / n + (r % 2) * 0.4, x = sx ? sx * dist : t, z = sx ? t : sz * dist;
      spots.push({ x, y, z, ry: Math.atan2(-x, -z), k: r });
      // the step under the row
    }
    const step = new THREE.Mesh(new THREE.BoxGeometry(sx ? 1.75 : half * 2, 1.15, sx ? half * 2 : 1.75), card('#262a3e')[0]);
    step.position.set(sx ? sx * (dist + 0.4) : 0, y - 1.0, sx ? 0 : sz * (dist + 0.4)); step.receiveShadow = true; root.add(step);
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
/** A set that is not a ring: its 2D painting as a backdrop flat, and a floor in front of it. */
function flat(root: THREE.Group, sc: Scene) {
  const c = document.createElement('canvas'); c.width = 2200; c.height = 1400; const x = c.getContext('2d')!;
  const v: View = { s: 100, ox: 1100, oy: 700 }, set = build({ ...sc, slots: [], keys: [{ t: 0, figs: {}, props: [] }] }, { t: 0, figs: {}, props: [] }, {}).pieces;
  drawScene(x, set, v, 'flat-' + sc.set);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
  back.position.set(0, -FOOT, -2.5); back.receiveShadow = true; root.add(back);
  const fl = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 10), card('#3a3d4a')[0]); fl.position.set(0, -0.1, 2.4); fl.receiveShadow = true; root.add(fl);
}

/* ---------- the camera for each set ---------- */
function frame(set: string, cam: THREE.PerspectiveCamera, ctl: OrbitControls, k: Key) {
  const c = k.cam || { x: 0, y: 0, z: 1, r: 0 };
  const P: Record<string, [number[], number[]]> = { ring: [[0, 9, 21], [0, 3.2, 0]], ringlow: [[0, 2.2, 15], [0, 4.2, 0]], ringcorner: [[15, 9, 15], [0, 3.2, 0]] };
  const [pos, look] = P[set] || [[0, 5.5, 17], [0, 3.6, 0]];
  cam.position.set(pos[0] + c.x, pos[1] + c.y, pos[2]); ctl.target.set(look[0] + c.x, look[1] + c.y, look[2]); cam.zoom = c.z; cam.rotation.z = 0; cam.updateProjectionMatrix(); ctl.update();
}

/** A 3D stage on a canvas. `show(sc, key, cast)` puts a moment of a scene on it; the pointer orbits the camera. */
export class Diorama3D {
  r: THREE.WebGLRenderer; scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.5, 400); ctl: OrbitControls; comp: EffectComposer; bokeh: BokehPass;
  world = new THREE.Group(); people = new THREE.Group(); set = ''; raf = 0; framed = '';
  constructor(canvas: HTMLCanvasElement) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); this.r.shadowMap.enabled = true; this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.toneMapping = THREE.ACESFilmicToneMapping; this.r.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color('#0a0c1c'); this.scene.fog = new THREE.Fog('#0a0c1c', 38, 95);
    this.scene.add(new THREE.HemisphereLight(0x9fb0e0, 0x20222e, 0.55));
    const key = new THREE.DirectionalLight(0xfff3dc, 2.2); key.position.set(-14, 34, 22); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -16; key.shadow.camera.right = 16; key.shadow.camera.top = 16; key.shadow.camera.bottom = -16; key.shadow.camera.near = 5; key.shadow.camera.far = 90; key.shadow.radius = 4; key.shadow.bias = -0.0005;
    this.scene.add(key);
    for (const [x, z] of [[-8, -8], [8, -8], [8, 8], [-8, 8]]) { const s = new THREE.SpotLight(0xffe2b0, 140, 70, 0.5, 0.7, 1.6); s.position.set(x, 30, z); s.target.position.set(0, 0, 0); this.scene.add(s, s.target); }
    this.scene.add(this.world, this.people);
    this.ctl = new OrbitControls(this.cam, canvas); this.ctl.enableDamping = false; this.ctl.addEventListener('change', () => this.ask()); this.ctl.maxPolarAngle = Math.PI * 0.49; this.ctl.minDistance = 4; this.ctl.maxDistance = 60;
    this.comp = new EffectComposer(this.r); this.comp.addPass(new RenderPass(this.scene, this.cam));
    this.bokeh = new BokehPass(this.scene, this.cam, { focus: 21, aperture: 0.0006, maxblur: 0.006 }); this.comp.addPass(this.bokeh); this.comp.addPass(new OutputPass());
    this.ask();
  }
  /** Draw on the next frame, once: the picture is only drawn again when something has changed (a Steam Deck on battery
      should not draw a still picture sixty times a second). */
  ask() { if (this.raf) return; this.raf = requestAnimationFrame(() => { this.raf = 0; this.face(); (this.bokeh.uniforms as any).focus.value = this.cam.position.distanceTo(this.ctl.target); this.comp.render(); this.drawn++; }); }
  drawn = 0;
  size(w: number, h: number) { this.r.setSize(w, h, false); this.comp.setSize(w, h); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.ask(); }
  /** The people and props, each a group that turns to face the camera like a paper figure, so it never looks thin
      from the side. `rigs` are the last joints, for dragging a part in 3D. */
  groups: THREE.Group[] = []; rigs: Record<string, Rig> = {}; sel: { who: string; part: string } | null = null;
  show(sc: Scene, k: Key, cast: Record<string, Recipe>, time = 0, sel: { who: string; part: string } | null = null) {
    if (this.set !== sc.set) { this.clear(this.world); if (RINGS.includes(sc.set)) arena(this.world); else flat(this.world, sc); this.set = sc.set; this.framed = ''; }
    const fk = sc.set + JSON.stringify(k.cam || null); if (this.framed !== fk) { frame(sc.set, this.cam, this.ctl, k); this.framed = fk; }
    this.clear(this.people); this.groups = []; this.sel = sel;
    const b = build(sc, k, cast, time); this.rigs = b.rigs;
    const byWho = new Map<string, Piece[]>();
    for (const p of b.pieces) { if (p.layer || p.soft) continue; const w = p.own != null ? 'f:' + p.own : p.prop != null ? 'p:' + p.prop : 'x:' + byWho.size; (byWho.get(w) || byWho.set(w, []).get(w)!).push(p); }
    byWho.forEach((ps, w) => {
      const kind = w[0], id = w.slice(2), f = kind === 'f' ? k.figs[id] : null;
      // the pivot: the figure's waist, or the middle of the prop; it stands at the depth of its layer
      let px = 0, n = 0; if (f) px = f.x; else { for (const p of ps) for (const q of p.pts) { px += q[0]; n++; } px = n ? px / n : (ps[0].txt ? ps[0].txt.x : 0); }
      const base = f ? f.z : Math.min(...ps.map(p => p.z)), g = new THREE.Group(); g.position.set(px, 0, base * DEPTH);
      g.userData = { who: id, prop: kind === 'p' };
      for (const p of ps) {
        const d = (p.z - base) * 0.06, m = p.txt ? words(p, d) : slab(p, d); if (!m) continue;
        m.position.x -= px; m.userData = { who: id, joint: p.joint, prop: kind === 'p' };
        if (sel && sel.who === id && (sel.part === 'body' || sel.part === 'prop' || p.joint === sel.part) && !p.txt) m.material = lit(p.col);
        g.add(m);
      }
      if (f && sel && sel.who === id && this.rigs[id] && this.rigs[id].joints[sel.part]) {   // a bright pin on the picked joint
        const rg = this.rigs[id], j = rg.joints[sel.part], wx = rg.f < 0 ? 2 * rg.rootx - j.x : j.x;
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffe14a })); pin.position.set(wx - px, j.y - FOOT, 1.2); g.add(pin);
      }
      this.people.add(g); this.groups.push(g);
    });
    this.ask();
  }
  /** Where a figure's anchor (chest, hand_n, ...) is on the screen, in client pixels (for tests and for pointing). */
  where(who: string, anchor = 'chest'): [number, number] | null {
    const g = this.groups.find(x => x.userData.who === who), rg = this.rigs[who]; if (!g || !rg || !rg.anchors[anchor]) return null;
    this.face(); g.updateMatrixWorld(true); const a = rg.anchors[anchor], v = g.localToWorld(new THREE.Vector3(a[0] - g.position.x, a[1] - FOOT, 0.3)).project(this.cam);
    const r = this.r.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
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
    const g = this.groups.find(x => x.userData.who === who); if (!g) return null;
    this.face(); g.updateMatrixWorld(true);
    const n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion), plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, g.position), hit = new THREE.Vector3();
    if (!this.ray(cx, cy).ray.intersectPlane(plane, hit)) return null;
    const l = g.worldToLocal(hit); return [l.x + g.position.x, l.y + FOOT];
  }
  clear(g: THREE.Group) { g.children.slice().forEach(c => { g.remove(c); c.traverse((o: any) => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m && !Array.isArray(m) && m.map && m.map.isTexture && m.map !== grainTex) { m.map.dispose(); m.dispose(); } }); }); }
  dispose() { cancelAnimationFrame(this.raf); this.ctl.dispose(); this.clear(this.world); this.clear(this.people); this.r.dispose(); this.r.forceContextLoss(); }
}
