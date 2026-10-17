/* The arena in 3D: the building on the night of a show, drawn with three.js (a trial of better graphics, 17 October).
   It only reads the game. What it shows comes from the show as the engine has it:
   - the seats fill to the night's real attendance (`att` of `cap`), ringside first;
   - the crowd moves and the lights brighten with how loud the building is (`heat`, 0 to 100, from `crowdAt()`);
   - a big moment (a near fall, a finish) fires the camera flashes; a new champion turns the lights gold;
   - the people in the segment stand in the ring in their side's colours, with their own skin tone.
   A model made in Blender can replace the drawn ring or add a set: export it as .glb into app/models/ and build.js
   embeds it (window.EWF_MODELS). See app/models/README.md. With no WebGL the arena is simply not drawn. */
import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { skinOf } from '../lib/portrait';

export interface ArenaFig { id: number; side: number; align: string; skin: number; g: string; win?: boolean }
export interface ArenaProps { att: number; cap: number; heat: number; hot: number; gold: boolean; show: string; figs: ArenaFig[]; still?: boolean }

let draws = 0;
/** How many arenas have been set up since the page loaded (EWF_DEBUG.arena). */
export function arenaDraws(): number { return draws; }

const RING = 6.2, MAT = 1.25, SIDE_COL = [0x2a6cff, 0xd42a2a, 0x2fbf4f, 0xe0b020, 0xa040d0, 0x20c0c0];
const ALIGN_COL: Record<string, number> = { F: 0x2a6cff, H: 0xd42a2a, N: 0x8a8a8a };
const SHIRTS = [0x1d1d22, 0x2b2f3a, 0x7a1212, 0x15357a, 0x5a5a5a, 0xc8c8c8, 0x2a5a2a, 0x6a4a1a, 0x8a1a5a, 0xd0a020];
const h01 = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function webgl(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
function embedded(name: string): ArrayBuffer | null {
  const m = (window as any).EWF_MODELS, b64 = m && m[name]; if (!b64) return null;
  try { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; } catch (e) { return null; }
}

/* ---------- the parts of the building ---------- */
function std(color: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...o }); }

function buildRing(): THREE.Group {
  const g = new THREE.Group(), half = RING / 2;
  const apron = new THREE.Mesh(new THREE.BoxGeometry(RING + 0.3, MAT, RING + 0.3), std(0x111111));
  apron.position.y = MAT / 2; g.add(apron);
  const skirt = std(0x9a1010, { roughness: 0.6 });
  for (let k = 0; k < 4; k++) {   // the skirt on each side, a little proud of the frame
    const s = new THREE.Mesh(new THREE.PlaneGeometry(RING + 0.3, MAT - 0.05), skirt);
    s.position.y = MAT / 2; const a = k * Math.PI / 2; s.position.x = Math.sin(a) * (half + 0.16); s.position.z = Math.cos(a) * (half + 0.16); s.rotation.y = a; g.add(s);
  }
  const mat = new THREE.Mesh(new THREE.BoxGeometry(RING + 0.3, 0.06, RING + 0.3), std(0xe8e8e2, { roughness: 0.95 }));
  mat.position.y = MAT; mat.receiveShadow = true; g.add(mat);
  const logo = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), std(0x1a3a9a, { roughness: 0.9 }));
  logo.rotation.x = -Math.PI / 2; logo.position.y = MAT + 0.035; logo.receiveShadow = true; g.add(logo);
  const post = std(0xb0b0b8, { metalness: 0.7, roughness: 0.35 }), pad = std(0xc81818, { roughness: 0.5 });
  const corners: [number, number][] = [[-half, -half], [half, -half], [half, half], [-half, half]];
  corners.forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.75, 10), post); p.position.set(x, MAT + 0.85, z); p.castShadow = true; g.add(p);
    [0.5, 0.95, 1.4].forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.22), pad); b.position.set(x * 0.985, MAT + y, z * 0.985); g.add(b); });
  });
  const rope = std(0xf2f2f2, { roughness: 0.4 });
  for (let k = 0; k < 4; k++) {
    const a = corners[k], b = corners[(k + 1) % 4], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    [0.5, 0.95, 1.4].forEach(y => {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len, 6), rope);
      r.position.set((a[0] + b[0]) / 2, MAT + y, (a[1] + b[1]) / 2); r.rotation.z = Math.PI / 2; r.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); r.castShadow = true; g.add(r);
    });
  }
  const steps = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.7), std(0x333338, { metalness: 0.5 })); steps.position.set(half + 0.7, 0.45, half - 0.2); g.add(steps);
  return g;
}

/** The stage at the far end: a ramp, a wall of lights with the show's name on it, and trusses. */
function buildStage(show: string): { g: THREE.Group; screen: THREE.MeshBasicMaterial } {
  const g = new THREE.Group();
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 9), std(0x18181c, { roughness: 0.5 })); ramp.position.set(0, 0.25, -RING / 2 - 5.2); g.add(ramp);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 3), std(0x101014)); deck.position.set(0, 0.5, -RING / 2 - 11); g.add(deck);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const x = cv.getContext('2d')!;
  x.fillStyle = '#000'; x.fillRect(0, 0, 1024, 256); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = "bold 128px 'VT323', monospace"; x.shadowColor = '#ffd23a'; x.shadowBlur = 28; x.fillStyle = '#ffe680'; x.fillText(show.toUpperCase(), 512, 132, 980);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = '#000'; for (let y = 0; y < 256; y += 4) x.fillRect(0, y, 1024, 1);   // the rows of lights
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.75), screen); wall.position.set(0, 3.6, -RING / 2 - 12.4); g.add(wall);
  const truss = std(0x55555c, { metalness: 0.8, roughness: 0.3 });
  [-5.8, 5.8].forEach(px => { const t = new THREE.Mesh(new THREE.BoxGeometry(0.3, 6, 0.3), truss); t.position.set(px, 3, -RING / 2 - 12.2); g.add(t); });
  const top = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 0.3), truss); top.position.set(0, 6, -RING / 2 - 12.2); g.add(top);
  return { g, screen };
}

/** Seats round the ring in rising rows, in the order they sell: ringside first, a little shuffled so a half house looks real. */
function seatPlan(): THREE.Vector3[] {
  const out: { p: THREE.Vector3; k: number }[] = [];
  for (let side = 0; side < 4; side++) {
    for (let row = 0; row < 16; row++) {
      const d = RING / 2 + 3 + row * 0.95, y = row < 3 ? 0 : 0.6 + (row - 3) * 0.5, w = d * 2 + 1;
      for (let i = 0; i < Math.floor(w / 0.62); i++) {
        const along = -w / 2 + 0.31 + i * 0.62;
        let x = 0, z = 0;
        if (side === 0) { x = along; z = d; } else if (side === 1) { x = d; z = along; } else if (side === 2) { x = along; z = -d; } else { x = -d; z = along; }
        if (side === 2 && Math.abs(x) < 6.5) continue;   // the stage and the ramp
        if (side !== 2 && side !== 0 && z < -d + 0.5) continue;   // corners belong to one side only
        if ((side === 1 || side === 3) && z > d - 0.5) continue;
        const n = out.length; out.push({ p: new THREE.Vector3(x, y, z), k: row + h01(n) * 4 + (side === 2 ? 2 : 0) });
      }
    }
  }
  return out.sort((a, b) => a.k - b.k).map(o => o.p);
}

function buildFigure(f: ArenaFig): THREE.Group {
  const g = new THREE.Group(), sk = skinOf(f.skin), skin = std(new THREE.Color(sk[0] / 255, sk[1] / 255, sk[2] / 255).getHex(), { roughness: 0.55 });
  const gear = std(f.align && ALIGN_COL[f.align] != null && f.side < 2 ? (f.side === 0 ? ALIGN_COL[f.align] : (ALIGN_COL[f.align] === 0x2a6cff ? 0x1840c0 : 0xb01818)) : SIDE_COL[f.side % SIDE_COL.length], { roughness: 0.45 });
  const boot = std(0x141414, { roughness: 0.4 }), wide = f.g === 'F' ? 0.85 : 1;
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
  add(new THREE.CapsuleGeometry(0.2 * wide, 0.42, 4, 10), skin, 0, 1.12);                        // the body
  add(new THREE.CylinderGeometry(0.22 * wide, 0.2 * wide, 0.2, 10), gear, 0, 0.82);               // the trunks
  add(new THREE.SphereGeometry(0.14, 14, 12), skin, 0, 1.62);                                       // the head
  [-1, 1].forEach(s => {
    add(new THREE.CapsuleGeometry(0.075, 0.42, 4, 8), skin, s * 0.11, 0.48);                      // legs
    add(new THREE.CylinderGeometry(0.085, 0.09, 0.18, 8), boot, s * 0.11, 0.14);                   // boots
    const arm = add(new THREE.CapsuleGeometry(0.065, 0.42, 4, 8), skin, s * 0.3 * wide, 1.18); arm.name = s < 0 ? 'armL' : 'armR';
  });
  g.scale.setScalar(1.05);
  return g;
}

function disposeAll(o: THREE.Object3D) {
  o.traverse((c: any) => { if (c.geometry) c.geometry.dispose(); const m = c.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x: any) => { if (x.map) x.map.dispose(); x.dispose(); }); });
}

/* ---------- the arena itself ---------- */
interface Rig {
  r: THREE.WebGLRenderer; scene: THREE.Scene; cam: THREE.PerspectiveCamera; seats: THREE.Vector3[];
  bodies: THREE.InstancedMesh; heads: THREE.InstancedMesh; flash: THREE.Points; spots: THREE.SpotLight[]; wash: THREE.HemisphereLight;
  figs: THREE.Group; figKey: string; ring: THREE.Group; stage: THREE.Group; raf: number; t0: number; flashT: number; lastHot: number; show: string;
}

function setup(cv: HTMLCanvasElement, p: ArenaProps): Rig | null {
  let r: THREE.WebGLRenderer;
  try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  draws++;
  r.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05060c); scene.fog = new THREE.Fog(0x05060c, 22, 46);
  const cam = new THREE.PerspectiveCamera(42, 2, 0.1, 120);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), std(0x0c0c10, { roughness: 1 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const barrier = std(0x202028);
  [[0, RING / 2 + 2.3, RING + 4.6, 0], [RING / 2 + 2.3, 0, RING + 4.6, 1], [0, -RING / 2 - 2.3, RING + 4.6, 0], [-RING / 2 - 2.3, 0, RING + 4.6, 1]].forEach(([x, z, w, rot], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(i === 2 ? 1.8 : w, 0.8, 0.12), barrier); b.position.set(i === 2 ? -2.8 : x, 0.4, z); b.rotation.y = rot ? Math.PI / 2 : 0; scene.add(b);
    if (i === 2) { const b2 = b.clone(); b2.position.x = 2.8; scene.add(b2); }
  });
  const ring = buildRing(); scene.add(ring);
  const st = buildStage(p.show); scene.add(st.g);
  // the crowd: a body and a head for every seat, drawn in one go each; only the first `count` (the seats sold) are drawn
  const seats = seatPlan(), n = seats.length;
  const bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.18, 0.32, 2, 6), std(0xffffff, { roughness: 0.9 }), n);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 8, 6), std(0xffffff, { roughness: 0.7 }), n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    c.setHex(SHIRTS[Math.floor(h01(i + 7) * SHIRTS.length)]); bodies.setColorAt(i, c);
    const sk = skinOf(h01(i + 3) * 100); c.setRGB(sk[0] / 255, sk[1] / 255, sk[2] / 255, THREE.SRGBColorSpace); heads.setColorAt(i, c);
  }
  bodies.frustumCulled = false; heads.frustumCulled = false; scene.add(bodies, heads);
  // seat rows (the empty ones show as rows of dark seats)
  const seatMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.35, 0.45), std(0x2a2c36, { roughness: 0.9 }), n), m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { const s = seats[i]; m4.makeTranslation(s.x, s.y + 0.18, s.z); seatMesh.setMatrixAt(i, m4); }
  scene.add(seatMesh);
  // camera flashes in the stands
  const fg = new THREE.BufferGeometry(), fpos = new Float32Array(240 * 3), fcol = new Float32Array(240 * 3);
  for (let i = 0; i < 240; i++) { const s = seats[Math.floor(h01(i + 91) * n)]; fpos[i * 3] = s.x; fpos[i * 3 + 1] = s.y + 1.1; fpos[i * 3 + 2] = s.z; }
  fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fg.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
  const flash = new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.35, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); scene.add(flash);
  // lights: a wash over the building, four spots on the ring, coloured lights on the stage
  const wash = new THREE.HemisphereLight(0x8090c0, 0x101018, 0.35); scene.add(wash);
  const spots: THREE.SpotLight[] = [];
  [[-6, 11, -6], [6, 11, -6], [6, 11, 6], [-6, 11, 6]].forEach(([x, y, z], i) => {
    const s = new THREE.SpotLight(0xfff4e0, 160, 40, 0.42, 0.5, 1.6); s.position.set(x, y, z); s.target.position.set(0, MAT, 0);
    if (i === 0) { s.castShadow = true; s.shadow.mapSize.set(1024, 1024); s.shadow.bias = -0.0004; }
    scene.add(s, s.target); spots.push(s);
  });
  [[-4, 0x3060ff], [4, 0xff3050]].forEach(([x, col]) => { const l = new THREE.PointLight(col, 30, 18); l.position.set(x, 4, -RING / 2 - 10); scene.add(l); });
  const figs = new THREE.Group(); scene.add(figs);
  const rig: Rig = { r, scene, cam, seats, bodies, heads, flash, spots, wash, figs, figKey: '', ring, stage: st.g, raf: 0, t0: performance.now(), flashT: 0, lastHot: 0, show: p.show };
  loadModels(rig);
  return rig;
}

/** Models made in Blender, embedded by build.js. `ring.glb` replaces the drawn ring, `set.glb` is added to the building as it is. */
function loadModels(rig: Rig) {
  const loader = new GLTFLoader();
  const put = (name: string, use: (o: THREE.Object3D) => void) => {
    const buf = embedded(name); if (!buf) return;
    loader.parse(buf, '', gltf => { gltf.scene.traverse((c: any) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); use(gltf.scene); }, () => { /* a model that will not load leaves the drawn one */ });
  };
  put('ring', o => { rig.scene.remove(rig.ring); disposeAll(rig.ring); rig.ring = o as THREE.Group; rig.scene.add(o); });
  put('set', o => { rig.scene.add(o); });
}

function placeFigures(rig: Rig, figs: ArenaFig[]) {
  const key = figs.map(f => f.id + ':' + f.side).join(',');
  if (key === rig.figKey) return;
  rig.figKey = key; rig.figs.children.slice().forEach(c => { rig.figs.remove(c); disposeAll(c); });
  const sides = Math.max(1, ...figs.map(f => f.side + 1));
  figs.forEach(f => {
    const o = buildFigure(f), mates = figs.filter(x => x.side === f.side), k = mates.indexOf(f);
    const a = (f.side / sides) * Math.PI * 2 + Math.PI / 2, spread = (k - (mates.length - 1) / 2) * 0.8;
    o.userData = { id: f.id, a, spread, base: 1.1 + (mates.length > 1 ? 0.6 : 0), ph: h01(f.id) * 6 };
    o.position.y = MAT + 0.03; rig.figs.add(o);
  });
}

function frame(rig: Rig, p: ArenaProps, w: number, h: number) {
  const t = (performance.now() - rig.t0) / 1000, heat = Math.max(0, Math.min(100, p.heat)) / 100, still = !!p.still;
  // seats sold
  const n = rig.seats.length, sold = Math.max(0, Math.min(n, Math.round(n * (p.cap > 0 ? Math.min(1, p.att / p.cap) : 0))));
  rig.bodies.count = sold; rig.heads.count = sold;
  const m = new THREE.Matrix4(), jump = still ? 0 : 0.04 + heat * heat * 0.28, sway = still ? 0 : 3 + heat * 5;
  for (let i = 0; i < sold; i++) {
    const s = rig.seats[i], ph = h01(i) * 6.28, up = Math.max(0, Math.sin(t * sway + ph)) * jump * (h01(i + 1) < 0.25 + heat * 0.7 ? 1 : 0.2);
    const stand = heat > 0.82 && h01(i + 5) < heat ? 0.18 : 0;   // on its feet
    m.makeTranslation(s.x, s.y + 0.6 + up + stand, s.z); rig.bodies.setMatrixAt(i, m);
    m.makeTranslation(s.x, s.y + 1.0 + up * 1.1 + stand, s.z); rig.heads.setMatrixAt(i, m);
  }
  rig.bodies.instanceMatrix.needsUpdate = true; rig.heads.instanceMatrix.needsUpdate = true;
  // camera flashes: a few all night, a storm on a big moment
  if (p.hot !== rig.lastHot) { rig.lastHot = p.hot; if (p.hot) rig.flashT = t; }
  const storm = Math.max(0, 1 - (t - rig.flashT) / 2.2) * (p.hot ? 1 : 0), col = rig.flash.geometry.getAttribute('color') as THREE.BufferAttribute;
  for (let i = 0; i < col.count; i++) { const on = !still && h01(i * 13 + Math.floor(t * 9)) < 0.004 + heat * 0.01 + storm * 0.22 && i < sold; col.setXYZ(i, on ? 1 : 0, on ? 1 : 0, on ? 1 : 0); }
  col.needsUpdate = true;
  // lights
  const gold = p.gold, tint = gold ? new THREE.Color(0xffc640) : new THREE.Color(0xfff4e0);
  rig.spots.forEach((s, i) => { s.color.copy(tint); s.intensity = 110 + heat * 120 + storm * 80 + (gold ? 60 : 0); if (!still) s.target.position.x = Math.sin(t * 0.7 + i) * 0.4 * heat; });
  rig.wash.intensity = 0.25 + heat * 0.25;
  // the people in the ring: circling each other, closer when it gets hot; a winner raises both arms
  rig.figs.children.forEach(o => {
    const u = o.userData, a = u.a + (still ? 0 : t * (0.15 + heat * 0.2)), r = Math.max(0.5, u.base - heat * 0.5 - storm * 0.4);
    o.position.x = Math.cos(a) * r - Math.sin(a) * u.spread; o.position.z = Math.sin(a) * r + Math.cos(a) * u.spread;
    o.lookAt(0, o.position.y, 0); o.position.y = MAT + 0.03 + (still ? 0 : Math.abs(Math.sin(t * 2.4 + u.ph)) * 0.04);
    const won = p.figs.find(f => f.id === u.id);
    ['armL', 'armR'].forEach((nm, k) => { const arm = o.getObjectByName(nm); if (!arm) return; arm.rotation.z = won && won.win ? (k ? -2.6 : 2.6) : (k ? -0.25 : 0.25); arm.position.y = won && won.win ? 1.55 : 1.18; });
  });
  // the camera: a slow turn round the ring, a little closer when the place is loud
  // it sweeps across the hard camera side, never from behind the stage; a segment with nobody in the ring shows the stage
  const empty = !p.figs.length, ca = still ? 0.5 : Math.sin(t * 0.045) * 0.95, cr = (empty ? 14 : 10.5) - heat * 2 - storm * 1.2;
  rig.cam.position.set(Math.sin(ca) * cr, (empty ? 5.5 : 4.3) - heat * 0.8, Math.cos(ca) * cr); rig.cam.lookAt(0, empty ? MAT + 1.2 : MAT + 0.9, empty ? -2 : 0);
  if (w > 0 && h > 0) { rig.cam.aspect = w / h; rig.cam.updateProjectionMatrix(); }
  rig.r.render(rig.scene, rig.cam);
}

/** The arena as a window into the building. It keeps one renderer while it is on the screen and lets go of it after. */
export function Arena(p: ArenaProps & { t?: string }) {
  const host = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), rig = useRef<Rig | null>(null), props = useRef(p);
  props.current = p;
  useEffect(() => {
    const c = cv.current, box = host.current; if (!c || !box || !webgl()) { if (box) box.hidden = true; return; }
    const R = setup(c, props.current); if (!R) { box.hidden = true; return; }
    rig.current = R; let w = 0, h = 0;
    const size = () => { const b = box.getBoundingClientRect(); w = Math.round(b.width); h = Math.round(b.height); if (w > 0 && h > 0) R.r.setSize(w, h, false); };
    size(); const ro = new ResizeObserver(size); ro.observe(box);
    let last = -1e9;
    // about 30 frames a second is plenty
    const loop = (now: number) => { R.raf = requestAnimationFrame(loop); if (document.hidden || now - last < 32) return; last = now; placeFigures(R, props.current.figs); try { frame(R, props.current, w, h); } catch (e) { /* a frame that fails is skipped */ } };
    loop(performance.now());
    return () => { cancelAnimationFrame(R.raf); ro.disconnect(); disposeAll(R.scene); R.r.dispose(); R.r.forceContextLoss(); rig.current = null; };
  }, []);
  const sold = p.cap > 0 ? Math.round(Math.min(1, p.att / p.cap) * 100) : 0;
  return <div ref={host} class="arena" data-t={p.t || 'arena'} data-v={sold} data-heat={Math.round(p.heat)} role="img"
    aria-label={'The arena: ' + p.att.toLocaleString('en-US') + ' in a building that holds ' + p.cap.toLocaleString('en-US')}>
    <canvas ref={cv} />
  </div>;
}
