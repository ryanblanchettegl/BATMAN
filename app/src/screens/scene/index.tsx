/* Create a Scene (Ryan, 18 October; made 3D and deeper on 19 October): the studio where every picture of a moment is
   made, the game's own included. A scene is a set, people in slots and keyframes (src/kit/scene.ts), built as a
   paper model in 3D (src/kit/diorama3d.ts).

   On the stage: press a person or a prop to pick it. Drag them and they walk across the floor of the model at the
   height they stand on (the mat, the apron, the floor outside, a turnbuckle); hold Shift to lift them instead. With a
   part of the body picked, a drag turns that part round its pin. A drag on nothing walks the camera round the model,
   the right button slides it, the wheel comes closer. Each keyframe can keep its own camera (Keep this view, or a
   shot), and between keyframes the camera glides, so a scene can be directed like a broadcast. A keyframe can carry a
   caption. Up to ten people, any part of any body can be hidden.

   The screen (Ryan, 19 October: "every option should be easy to find and make sense"): the picture with the
   keyframes and the camera under it on the left; on the right, Selected (everything about who or what is picked),
   People (who is in it, who plays them, props), Caption, Set and Scene (name, when it plays, files, a new scene).
   Nothing here touches the game. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { W } from '../../engine';
import { Btn, TextBox, Desktop, Win, Group, Sel as Drop, Opt } from '../../kit';
import { MOVES, Scene, Key, Fig, Prop, Studio, STUDIOS, studioOf, setupsFor, TEMPLATES, templateScene, SCENES, STILLS, WHEN, STILL_WHEN, SETS, SETUPS, setupScene, WAIST, POSES, HOLDS, LIMBS, HOOKS, at, build, lastT, allScenes, ok, copy, SHOW_WHEN, SHOW_SCENES, SCENE_FX, fxClass, FRAMES, EASES, aspectOf, fitIn, BODY_PARTS, CAP_STYLES, SPOTS, captionAt, camAt, CAM_MOVES } from '../../kit/scene';
import { FxVeil, CaptionBox, capName } from '../../kit/sceneplayer';
import { Backdrop, BG_PARTS, BG_COLS, newBackdrop, newPart, useBackdropSource, isBg } from '../../kit/backdrop';
import { drawPaper, toPx, Piece } from '../../kit/paper';
import { Diorama3D, SHOTS, DEPTH } from '../../kit/diorama3d';
import { Recipe, recipeOf, JOINTS, PROPS, STAND, Rig, REF, blank, puppet, EXPR, Marks } from '../../kit/puppet';

type Sel = { who: string; part: string } | null;   // part is 'body', a joint name, or 'prop'
const deg = (r: number) => r * 180 / Math.PI;
const norm = (a: number) => { while (a > 180) a -= 360; while (a < -180) a += 360; return Math.round(a); };
const r2 = (v: number) => Math.round(v * 100) / 100;
/** How many people a scene can hold, the referee aside (Ryan, 19 October: "up to 10 people in the 3d ring"). */
export const MAX_PEOPLE = 10;
const LENSES: [number, string][] = [[18, 'Long lens'], [24, 'Close lens'], [30, 'Normal lens'], [38, 'Wide lens'], [48, 'Very wide lens']];
/** The lens on the list nearest to a camera's own. */
const lensOf = (fov: number) => LENSES.reduce((b, l) => Math.abs(l[0] - fov) < Math.abs(b[0] - fov) ? l : b)[0];
const RINGSETS = ['ring', 'ringlow', 'ringcorner', 'cage', 'stadium', 'ringside', 'cell', 'inferno', 'ballroom', 'gym', 'bigstadium', 'ladder'];

/** The props that carry words, and the colours words can be in (Words has no background: Ryan, 20 October). */
const TEXTED = ['burst', 'sign', 'headline', 'masthead', 'words'];
const WORD_COLS: Opt[] = [['', 'Its own colour'], ['#ffffff', 'White'], ['#ffd84a', 'Yellow'], ['#e8402a', 'Red'], ['#2f6bd8', 'Blue'], ['#3ad06a', 'Green'], ['#ff6ec7', 'Pink'], ['#111111', 'Black']];
function blankScene(mode?: Studio): Scene {
  if (mode === 'still') return templateScene('poster');
  if (mode === 'move') return { ...setupScene('ring'), name: 'My move', when: 'move' };
  return { v: 1, id: 'scene-' + Date.now().toString(36), name: 'My scene', when: 'any', set: 'ring', slots: [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }, { id: 'R', n: 'The referee', role: 'ref' }],
    keys: [{ t: 0, figs: { A: { x: -2.2, y: WAIST, r: 0, f: 1, z: 0, p: {} }, B: { x: 2.2, y: WAIST, r: 0, f: -1, z: 1.2, p: {} }, R: { x: -5.4, y: WAIST, r: 0, f: 1, z: -0.3, p: {} } }, props: [] }] };
}

/** The stage: the scene built as a paper model and photographed. */
function Stage3D(p: { sc: Scene; ki: number; time: number | null; cast: Record<string, Recipe>; sel: Sel; onSel: (s: Sel) => void;
  onDrag: (s: Sel, wx: number, wy: number, dx: number, dy: number, rig: Rig | null) => void; onFloor: (s: Sel, x: number, z: number) => void; floorOf: (s: Sel) => { x: number; z: number; h: number } | null;
  onKey: (e: KeyboardEvent) => void; onEngine: (e: Diorama3D | null) => void; reframe: number }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), eng = useRef<Diorama3D | null>(null), [size, setSize] = useState([0, 0]);
  const drag = useRef<{ sel: Sel; at: [number, number]; floor?: { x0: number; z0: number; fx: number; fz: number; h: number } } | null>(null), props = useRef(p); props.current = p;
  useEffect(() => {
    const b = box.current, c = cv.current; if (!b || !c) return;
    try { eng.current = new Diorama3D(c); } catch (e) { eng.current = null; }
    props.current.onEngine(eng.current);
    const dbg = (window as any).EWF_DEBUG; if (dbg) dbg.three = () => eng.current;
    const fit = () => { const r = b.getBoundingClientRect(), [w, h] = fitIn(r.width, r.height, aspectOf(props.current.sc), 160); setSize([w, h]); if (eng.current) eng.current.size(w, h); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b);
    // the pointer: in the capture phase, so a press on a person stops the camera before it starts to turn
    const down = (e: PointerEvent) => {
      const E3 = eng.current; if (!E3 || props.current.time != null || e.target !== c || e.button !== 0) return;
      let hit = E3.pick(e.clientX, e.clientY); if (!hit) return;   // nothing there: the camera walks round
      // the body moves the whole person; an arm, a leg or the head turns that part, or, with a joint already picked
      // on the same limb (the shoulder, say), swings the limb from it
      const cur = props.current.sel;
      if (cur && cur.who === hit.who && cur.part !== 'body' && cur.part !== 'prop' && LIMBS[cur.part] && LIMBS[cur.part] === LIMBS[hit.part]) hit = { who: hit.who, part: cur.part };
      else if (hit.part === 'torso') hit = { who: hit.who, part: 'body' };
      E3.ctl.enabled = false; props.current.onSel(hit);
      const fl = !e.shiftKey && (hit.part === 'body' || hit.part === 'prop') ? props.current.floorOf(hit) : null;
      const q = fl ? E3.toFloor(e.clientX, e.clientY, fl.h) : null;
      if (fl && q) drag.current = { sel: hit, at: [0, 0], floor: { x0: q[0], z0: q[1], fx: fl.x, fz: fl.z, h: fl.h } };
      else { const at0 = E3.toScene(hit.who, e.clientX, e.clientY); drag.current = at0 ? { sel: hit, at: at0 } : null; }
      c.setPointerCapture(e.pointerId); e.stopPropagation();
    };
    const move = (e: PointerEvent) => {
      const d = drag.current, E3 = eng.current; if (!d || !E3 || !d.sel) return;
      if (d.floor) { const q = E3.toFloor(e.clientX, e.clientY, d.floor.h); if (q) props.current.onFloor(d.sel, d.floor.fx + q[0] - d.floor.x0, d.floor.fz + (q[1] - d.floor.z0) / DEPTH); return; }
      const q = E3.toScene(d.sel.who, e.clientX, e.clientY); if (!q) return;
      const lift = d.sel.part === 'body' || d.sel.part === 'prop';   // Shift and drag: up and down only
      props.current.onDrag(d.sel, q[0], q[1], lift ? 0 : q[0] - d.at[0], q[1] - d.at[1], E3.rigs[d.sel.who] || null); d.at = q;
    };
    const up = () => { drag.current = null; if (eng.current) eng.current.ctl.enabled = true; };
    b.addEventListener('pointerdown', down, true); b.addEventListener('pointermove', move, true); b.addEventListener('pointerup', up, true); b.addEventListener('pointercancel', up, true);
    return () => { ro.disconnect(); b.removeEventListener('pointerdown', down, true); b.removeEventListener('pointermove', move, true); b.removeEventListener('pointerup', up, true); b.removeEventListener('pointercancel', up, true); props.current.onEngine(null); if (eng.current) eng.current.dispose(); eng.current = null; };
  }, []);
  useEffect(() => { const b = box.current; if (!b) return; const r = b.getBoundingClientRect(), [w, h] = fitIn(r.width, r.height, aspectOf(p.sc), 160); setSize([w, h]); if (eng.current) eng.current.size(w, h); }, [p.sc.frame]);
  useEffect(() => { if (eng.current) eng.current.framed = ''; }, [p.reframe]);
  useEffect(() => { const e = eng.current; if (!e) return; const t = p.time == null ? p.sc.keys[p.ki].t : p.time, k0 = p.sc.keys[p.ki];
    e.show(p.sc, p.time == null ? (k0.cam3 ? k0 : { ...k0, cam3: camAt(p.sc, p.ki) }) : at(p.sc, t), p.cast, t, p.time == null ? p.sel : null); });
  const t = p.time == null ? p.sc.keys[p.ki].t : p.time, cap = p.time == null ? (p.sc.keys[p.ki].cap && p.sc.keys[p.ki].cap!.t ? p.sc.keys[p.ki].cap! : null) : captionAt(p.sc, t);
  return <div ref={box} class={'sc-stage sc-3d' + fxClass(p.sc)}>
    {fxClass(p.sc) && <FxVeil w={size[0]} h={size[1]} />}
    <canvas ref={cv} tabIndex={0} data-t="scene-stage" data-v={p.sc.id} data-k={p.ki} data-sel={p.sel ? p.sel.who + ':' + p.sel.part : ''} style={{ width: size[0] + 'px', height: size[1] + 'px' }} onKeyDown={p.onKey as any}
      aria-label={'The scene in 3D: ' + p.sc.name + '. Press a person or a prop to pick it and drag it across the floor, or Shift and drag to lift it; drag anywhere else to walk round the model.'} />
    {cap && <CaptionBox cap={cap} w={size[0]} h={size[1]} who={capName(p.sc, p.cast, cap)} />}
  </div>;
}

/** The picked person as a small paper doll with a brass pin at every joint: press a pin to pick that part. A hidden
    part shows faint. The pins are real buttons (rule 5). */
function DollMap(p: { r: Recipe; part: string; hide: string[]; onPart: (j: string) => void }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), [size, setSize] = useState([0, 0]);
  useEffect(() => {
    const b = box.current; if (!b) return;
    const fit = () => { const r = b.getBoundingClientRect(); setSize([Math.floor(r.width), Math.floor(r.height)]); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b); return () => ro.disconnect();
  }, []);
  const pieces: Piece[] = [], rig = puppet(p.r, { x: 0, y: WAIST, r: 0, f: 1, z: 0 }, { sh_n: 28, el_n: 12, sh_f: -28, el_f: -12, hip_n: 9, an_n: 0, hip_f: -9, an_f: 0 }, '', 'map', pieces);
  const shown = pieces.map(q => q.joint && p.hide.indexOf(q.joint) >= 0 ? { ...q, col: 'rgba(120,120,120,0.25)' } : q);
  const s = Math.min(size[0] / 4.6, size[1] / 7.4), v = { s, ox: size[0] / 2, oy: size[1] / 2 + 0.3 * s };
  useEffect(() => {
    const c = cv.current; if (!c || !size[0]) return; const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size[0] * dpr); c.height = Math.round(size[1] * dpr); const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, c.width, c.height);
    drawPaper(ctx, shown, { s: v.s * dpr, ox: v.ox * dpr, oy: v.oy * dpr }, false);
  });
  const atJ = (j: string): [number, number] => toPx(v, [rig.joints[j].x, rig.joints[j].y]);
  return <div ref={box} class="sc-map" data-t="scene-map">
    <canvas ref={cv} style={{ width: size[0] + 'px', height: size[1] + 'px' }} aria-hidden="true" />
    {size[0] > 0 && JOINTS.map(([j, n]) => { const [x, y] = atJ(j); return <button type="button" key={j} class={'pin' + (p.part === j ? ' on' : '')} style={{ left: x + 'px', top: y + 'px' }}
      aria-label={n} aria-pressed={p.part === j} title={n} data-t="scene-pin" data-v={j} onClick={() => p.onPart(j)} />; })}
  </div>;
}

/** Wrestlers from a world file, in the shape the dolls are cut from. */
const STY: Record<string, string> = { brawler: 'B', technician: 'T', flyer: 'H', powerhouse: 'P', all_rounder: 'A', striker: 'S', entertainer: 'E' };
export function fromWorld(pkg: any): W[] {
  return (pkg && pkg.workers || []).filter((w: any) => !w.roles || w.roles.indexOf('wrestler') >= 0).map((w: any, i: number) => ({ id: i, name: w.ring_name || w.id, g: w.gender === 'F' ? 'F' : 'M',
    align: w.disposition === 'heel' ? 'H' : 'F', twn: w.disposition === 'tweener', style: STY[w.style] || 'A', face: w.face, age: w.age || 28, gim: (w.gimmick_category || '') + ' ' + (w.gimmick || ''), look: w.look || null }));
}
export interface StudioProps { world: string; roster: W[]; saved: Scene[]; start?: Scene; blank?: boolean; castA?: number;
  /** Which studio this is (Animation, Create a Move, Create a Scene); left out, it is the one the scene belongs in. */ mode?: Studio; onSave: (sc: Scene) => boolean;
  /** The world's backdrops, and how to keep one (the Set tab). */ backdrops?: Backdrop[]; onSaveBg?: (b: Backdrop) => boolean; onForget: (id: string) => void; onDone: () => void }

/** Create a Scene, full screen, opened from the World Editor. The scene is kept in the world being edited. */
export function SceneStudio(pp: StudioProps) {
  const roster = pp.roster, [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const say = (t: string, o?: { err?: boolean }) => setMsg({ t, err: !!(o && o.err) });
  const [mode] = useState<Studio>(() => pp.mode || studioOf(pp.blank ? blankScene() : (pp.start || SCENES[0])));
  const [sc, setSc] = useState<Scene>(() => pp.blank ? blankScene(pp.mode) : copy(pp.start || SCENES[0])), [ki, setKi] = useState(0), [sel, setSel] = useState<Sel>({ who: 'A', part: 'body' });
  const [time, setTime] = useState<number | null>(null);
  // who plays each part here: the first two from the roster, everyone after them the next wrestlers along
  const [castIds, setCast] = useState<Record<string, number>>(() => { const o: Record<string, number> = {}; const ids = roster.map(w => w.id); let i = 0;
    const start = pp.blank ? blankScene(pp.mode) : (pp.start || SCENES[0]); start.slots.forEach(sl => { if (sl.role === 'ref' || sl.dress) return; if (sl.id === 'A' && pp.castA != null) { o.A = pp.castA; return; } while (i < ids.length && ids[i] === pp.castA) i++; if (i < ids.length) o[sl.id] = ids[i++]; }); return o; });
  const [addK, setAddK] = useState('belt'), [words, setWords] = useState('WOW!'), file = useRef<HTMLInputElement>(null);
  const cast: Record<string, Recipe> = {}; for (const id in castIds) { const w = roster.find(x => x.id === castIds[id]); if (w) cast[id] = recipeOf(w); }
  const kk = Math.min(ki, sc.keys.length - 1), key = sc.keys[kk];
  const edit = (fn: (k: Key, s: Scene) => void) => { const n = copy(sc); fn(n.keys[kk], n); setSc(n); };
  const fig = (k: Key, who: string): Fig | null => k.figs[who] || null;
  const propOf = (k: Key, id: string): Prop | null => k.props.find(x => x.id === id) || null;
  const eng = useRef<Diorama3D | null>(null), [reframe, setReframe] = useState(0);
  const turn = (d: number) => edit(k => { if (!sel) return; const f = fig(k, sel.who); if (f && sel.part !== 'body' && sel.part !== 'prop') f.p[sel.part] = norm((f.p[sel.part] ?? STAND[sel.part] ?? 0) + d); else if (f) f.r = norm(f.r + d); else { const q = propOf(k, sel.who); if (q) q.r = norm(q.r + d); } });
  /** Move what is picked: across (x), away or nearer (z, in layer units), up or down (y). */
  const nudge = (dx: number, dy: number, dz = 0) => edit(k => { if (!sel) return; const o: any = fig(k, sel.who) || propOf(k, sel.who); if (o) { o.x = r2(o.x + dx); o.y = r2(o.y + dy); o.z = r2(o.z + dz); } });
  const onDrag = (s: Sel, wx: number, wy: number, dx: number, dy: number, rig: Rig | null) => edit(k => {
    if (!s) return; const f = fig(k, s.who);
    if (s.part === 'prop') { const q = propOf(k, s.who); if (q) { q.x += dx; q.y += dy; } return; }
    if (!f) return;
    if (s.part === 'body') { f.x += dx; f.y += dy; return; }
    const j = rig && rig.joints[s.part]; if (!j) return;
    const px = rig!.f < 0 ? 2 * rig!.rootx - wx : wx, a = Math.atan2(wy - j.y, px - j.x);
    f.p[s.part] = norm(deg(a - j.pa) + (j.up ? -90 : 90));
  });
  const onFloor = (s: Sel, x: number, z: number) => edit(k => { if (!s) return; const o: any = fig(k, s.who) || propOf(k, s.who); if (o) { o.x = r2(x); o.z = r2(z); } });
  const floorOf = (s: Sel) => { if (!s) return null; const f = fig(key, s.who); if (f) return f.on ? null : { x: f.x, z: f.z, h: f.lv || 0 }; const q = propOf(key, s.who); return q && !q.at ? { x: q.x, z: q.z, h: 0 } : null; };
  const onKey = (e: KeyboardEvent) => {
    const joint = sel && sel.part !== 'body' && sel.part !== 'prop';
    const m: Record<string, () => void> = { ArrowLeft: () => joint ? turn(5) : nudge(-0.25, 0), ArrowRight: () => joint ? turn(-5) : nudge(0.25, 0), ArrowUp: () => joint ? turn(5) : nudge(0, 0, -0.3), ArrowDown: () => joint ? turn(-5) : nudge(0, 0, 0.3),
      PageUp: () => nudge(0, 0.25), PageDown: () => nudge(0, -0.25), '[': () => cyclePart(-1), ']': () => cyclePart(1) };
    if (sel && m[e.key]) { e.preventDefault(); e.stopPropagation(); m[e.key](); }
  };
  /** Pick somebody up, or put them down, without moving them: where they are now becomes a place on the one holding. */
  const holdBy = (who: string, on: string) => edit((k, n) => {
    const f = fig(k, who); if (!f) return; const b = build(n, k, cast);
    const abs = { x: f.x, y: f.y + (f.on ? 0 : f.lv || 0), z: f.z };
    if (f.on) { const [hw, an] = f.on.split(':'), q = b.rigs[hw] && b.rigs[hw].anchors[an], hf = k.figs[hw]; if (q) { abs.x = q[0] + f.x; abs.y = q[1] + f.y; } abs.z = (hf ? hf.z : 0) + f.z; }
    delete f.on; delete f.lv; f.x = abs.x; f.y = abs.y; f.z = abs.z;
    if (!on) { f.x = r2(f.x); f.y = r2(f.y); return; }
    const [hw, a] = on.split(':'), hr = b.rigs[hw], q = hr && hr.anchors[a], hf = k.figs[hw]; if (!q || !hf) return;
    f.on = on; f.x = r2(abs.x - q[0]); f.y = r2(abs.y - q[1]); f.z = 0.6;
  });
  const parts = ['body', ...JOINTS.map(j => j[0])];
  const cyclePart = (d: number) => { if (!sel || sel.part === 'prop') return; const i = parts.indexOf(sel.part); setSel({ who: sel.who, part: parts[(i + d + parts.length) % parts.length] }); };
  // play: slide through the keyframes once, then come back to the one being edited
  useEffect(() => {
    if (time == null) return; let raf = 0, last = -1, run = time;   // a slow frame moves it on a tenth of a second at most, so nothing is skipped
    const step = (now: number) => { if (last >= 0) run += Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now; let t = run; if (sc.loop && lastT(sc) > 0) t = t % (lastT(sc) + 0.32); else if (t > lastT(sc) + 0.6) { setTime(null); setReframe(x => x + 1); return; } setTime(t); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [time == null]);
  const open = (s: Scene) => { setSc(copy(s)); setKi(0); setSel(null); setTime(null); setReframe(x => x + 1);
    const o: Record<string, number> = {}; let i = 0; s.slots.forEach(sl => { if (sl.role === 'ref' || sl.dress) return; if (i < roster.length) o[sl.id] = roster[i++].id; }); setCast(o); };
  const save = () => { if (pp.onSave(copy(sc))) say('"' + sc.name + '" is kept in ' + pp.world + '. ' + (sc.still ? 'It shows in games of this world' : 'It plays in games of this world') + ' (' + ((sc.still ? STILL_WHEN : WHEN.concat(SHOW_WHEN)).find(w => w[0] === sc.when) || ['', 'by hand'])[1].toLowerCase() + ').'); else say('That scene could not be kept.', { err: true }); };
  const exportIt = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sc, null, 1)], { type: 'application/json' }));
    a.download = (sc.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'scene') + '.scene.json'; document.body.appendChild(a); a.click(); a.remove();
    say('Written out as ' + a.download + '. Anybody can open it in Create a Scene.');
  };
  const importIt = (f: File) => f.text().then(txt => { let x: any = null; try { x = JSON.parse(txt); } catch (e) { /* not JSON */ } if (ok(x)) { open(x); say('Opened "' + x.name + '".'); } else say('That file is not a scene.', { err: true }); });
  const addProp = () => edit(k => { const id = addK + '-' + Date.now().toString(36); k.props.push({ id, k: addK, x: 0, y: addK === 'masthead' ? 3.6 : ['burst', 'sign', 'headline', 'words'].includes(addK) ? 3 : addK === 'confetti' ? 0 : -1.6, r: 0, z: 2.6, s: 1, txt: TEXTED.includes(addK) ? words : undefined }); setSel({ who: id, part: 'prop' }); });
  const selFig = sel && fig(key, sel.who), selProp = sel && sel.part === 'prop' ? propOf(key, sel.who) : null;
  const who = (id: string) => { const sl = sc.slots.find(s => s.id === id); return sl ? sl.n : id; };
  const mine = pp.saved;
  const [tab, setTab] = useState(pp.blank ? 'file' : 'sel');
  // hidden and locked people or props, only while editing
  const [hidden, setHidden] = useState<string[]>([]), [locked, setLocked] = useState<string[]>([]);
  // the backdrop being made: the world's own, with the one being edited in place of its saved copy
  const savedBgs = pp.backdrops || [], [bg, setBg] = useState<Backdrop | null>(() => { const s0 = pp.start; return s0 && isBg(s0.set) ? copy((savedBgs.find(b => 'bg_' + b.id === s0.set) || null) as any) : null; });
  const [bgi, setBgi] = useState(-1), [bgAdd, setBgAdd] = useState('banner'), [bgWords, setBgWords] = useState('EWF'), bgRef = useRef(bg); bgRef.current = bg;
  useEffect(() => useBackdropSource(() => { const d = bgRef.current; return savedBgs.filter(b => !d || b.id !== d.id).concat(d ? [d] : []); }), []);
  const allBgs = savedBgs.filter(b => !bg || b.id !== bg.id).concat(bg ? [bg] : []);
  const editBg = (fn: (b: Backdrop) => void) => { if (!bg) return; const n = copy(bg) as Backdrop; fn(n); setBg(n); };
  const bgPart = bg && bg.parts[bgi];
  const vsc: Scene = hidden.length ? { ...sc, keys: sc.keys.map(k => ({ ...k, figs: Object.fromEntries(Object.entries(k.figs).filter(([id]) => hidden.indexOf(id) < 0)), props: k.props.filter(q => hidden.indexOf(q.id) < 0) })) } : sc;
  const pickSel = (s2: Sel) => { if (s2 && locked.indexOf(s2.who) >= 0) return; setSel(s2); if (s2) setTab('sel'); };
  const flip = (l: string[], set: (v: string[]) => void, id: string) => set(l.indexOf(id) >= 0 ? l.filter(x => x !== id) : l.concat([id]));
  /* ---------- the camera of the keyframe ---------- */
  const keepView = () => { const e = eng.current; if (!e) return; const v = e.view(); edit(k => { k.cam3 = v; delete k.cam; }); say('Keyframe ' + (kk + 1) + ' is shot from here now. Between keyframes the camera glides from one shot to the next.'); };
  const takeShot = (kind: string) => { const e = eng.current; if (!e) return; const c = e.shot(sc.set, kind, sel && sel.part !== 'prop' && key.figs[sel.who] ? sel.who : undefined); edit(k => { k.cam3 = c; delete k.cam; }); setReframe(x => x + 1); };
  const setLens = (fov: number) => { const e = eng.current; edit(k => { const c = k.cam3 || (e ? e.view() : null); if (c) k.cam3 = { ...c, fov }; }); setReframe(x => x + 1); };
  const homeCam = () => { edit(k => { delete k.cam3; delete k.cam; }); setReframe(x => x + 1); };
  /** Take a picture: the stage as it is, saved as a PNG. */
  const snap = () => { const e = eng.current; if (!e) return; e.picture().then(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (sc.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'scene') + '-' + (kk + 1) + '.png'; document.body.appendChild(a); a.click(); a.remove(); say('Picture taken: ' + a.download); }); };
  /* ---------- people ---------- */
  const people = sc.slots.filter(x => x.role !== 'ref');
  const addPerson = () => {
    if (people.length >= MAX_PEOPLE) return;
    const n = copy(sc); let c = 0; while (n.slots.some(x => x.id === String.fromCharCode(65 + c)) && c < 25) c++;
    const id = String.fromCharCode(65 + c), i = people.length, x = -6 + (i % 5) * 3, z = i < 5 ? 2 : -2;
    n.slots.push({ id, n: 'Wrestler ' + id, role: 'c' }); n.keys.forEach(k => { k.figs[id] = { x, y: WAIST, r: 0, f: x < 0 ? 1 : -1, z, p: {} }; }); setSc(n);
    const used = Object.values(castIds), next = roster.find(w => used.indexOf(w.id) < 0); if (next) setCast({ ...castIds, [id]: next.id });
    setSel({ who: id, part: 'body' }); say('Wrestler ' + id + ' is in. ' + (people.length + 1) + ' of ' + MAX_PEOPLE + ' people.');
  };
  const dropPerson = (id: string) => { const n = copy(sc); n.slots = n.slots.filter(x => x.id !== id); n.keys.forEach(k => { delete k.figs[id]; for (const o in k.figs) if ((k.figs[o].on || '').startsWith(id + ':')) delete k.figs[o].on; k.props = k.props.filter(q => !(q.at || '').startsWith(id + ':')); }); setSc(n); if (sel && sel.who === id) setSel(null); };
  const placeAt = (spot: string) => { const sp = SPOTS.find(x => x[0] === spot); if (!sp) return; edit(k => { if (!sel) return; const f = fig(k, sel.who); if (!f) return; delete f.on; f.x = sp[2]; f.z = sp[3]; f.lv = sp[4]; f.f = sp[5]; }); const who = sel && sel.who; if (who) setTimeout(() => { if (eng.current) eng.current.follow(who); }, 60); };
  const slotRole = (id: string) => (sc.slots.find(x => x.id === id) || { role: 'a' }).role;
  const figR = sel && key.figs[sel.who] ? (cast[sel.who] || (slotRole(sel.who) === 'ref' ? REF : blank(Math.max(0, sc.slots.findIndex(x => x.id === sel.who))))) : null;
  const partName = sel ? (sel.part === 'body' ? 'The whole body' : sel.part === 'prop' ? 'The prop' : (JOINTS.find(j => j[0] === sel.part) || ['', sel.part])[1]) : '';
  const angle = selFig && sel ? (sel.part === 'body' ? selFig.r : Math.round(selFig.p[sel.part] ?? STAND[sel.part] ?? 0)) : selProp ? selProp.r : 0;
  const ring = RINGSETS.indexOf(sc.set) >= 0;
  const hideOf = (selFig && selFig.hide) || [];
  const setHide = (j: string | null) => edit(k => { if (!sel) return; const f = fig(k, sel.who); if (!f) return; if (j == null) { delete f.hide; return; } const h = (f.hide || []).slice(), i = h.indexOf(j); if (i >= 0) h.splice(i, 1); else h.push(j); if (h.length) f.hide = h; else delete f.hide; });
  const capOf = key.cap || { t: '', s: 'sub' as const };
  const setCap = (c: { t?: string; s?: string; who?: string }) => edit(k => { const n: any = { ...(k.cap || { t: '', s: 'sub' }), ...c }; if (!n.who) delete n.who; if (n.t) k.cap = n; else delete k.cap; });
  const shotName = key.cam3 ? 'Its own shot' : key.cm === 'home' || !camAt(sc, kk) ? 'The set camera' : 'Holding the last shot';
  return <div class="scfull paper" data-t="scene">
    <div class="pmenu sc-menubar" role="group" aria-label={STUDIOS.find(x => x[0] === mode)![1]} data-v={mode}>
      <b class="pm-app">{STUDIOS.find(x => x[0] === mode)![1]}</b><span class="pm-world sc-title">{sc.name}</span><span class="sp" />
      <Btn kind="sm" t="scene-save" tip="Keep this scene in the world" onClick={save}>Save</Btn>
      <Btn kind="go" t="scene-done" onClick={pp.onDone}>Done</Btn>
    </div>
    <div class={'pnote sc-hint' + (msg ? (msg.err ? ' bad' : ' good') : '')} role="status" data-t="scene-msg">{msg ? msg.t : 'Press somebody to pick them and drag them round the floor. Shift and drag lifts. Drag on nothing to walk the camera round.'}</div>
    <Desktop cls="scpage">
    <Win title={'The picture: ' + sc.name} right={sc.keys.length + (sc.keys.length === 1 ? ' keyframe' : ' keyframes') + ' · ' + people.length + (people.length === 1 ? ' person' : ' people')} area="stage" t="scene-win">
      <Stage3D sc={vsc} ki={kk} time={time} cast={cast} sel={sel} onSel={pickSel} onDrag={onDrag} onFloor={onFloor} floorOf={floorOf} onKey={onKey} onEngine={e => { eng.current = e; }} reframe={reframe} />
      {sc.still ? <div class="sc-keys" role="group" aria-label="Keyframes" data-t="scene-stillnote"><span class="sc-lbl">Still</span><span class="sc-gap">One picture, nothing plays. It goes beside a moment the booker answers.</span></div>
      : <div class="sc-keys" role="group" aria-label="Keyframes">
        <span class="sc-lbl">Keyframes</span>
        {sc.keys.map((k, i) => <Btn key={'k' + i} kind="sm" t="scene-key" d={{ v: i }} on={i === kk && time == null} tip={k.t.toFixed(1) + 's' + (k.cam3 ? ', its own shot' : '') + (k.cap ? ', a caption' : '')} onClick={() => { setKi(i); setTime(null); setReframe(x => x + 1); }}>{(i + 1) + (k.cam3 ? ' ◉' : '') + (k.cap ? ' ✎' : '')}</Btn>)}
        <Btn kind="sm" t="scene-addkey" tip="A new keyframe after the last, starting as a copy of this one" onClick={() => { const n = copy(sc), k = copy(n.keys[kk]); k.t = Math.round((lastT(n) + 0.8) * 10) / 10; n.keys.push(k); setSc(n); setKi(n.keys.length - 1); }}>+ Keyframe</Btn>
        <Btn kind="danger" t="scene-dropkey" disabled={sc.keys.length < 2} onClick={() => { const n = copy(sc); n.keys.splice(kk, 1); n.keys[0].t = 0; setSc(n); setKi(Math.max(0, kk - 1)); }}>Delete</Btn>
        <span class="sc-gap">{kk > 0 ? <>After <Btn kind="less" t="scene-faster" tip="Sooner" onClick={() => edit((k, s) => { const gap = k.t - s.keys[kk - 1].t; if (gap <= 0.2) return; for (let i = kk; i < s.keys.length; i++) s.keys[i].t = Math.round((s.keys[i].t - 0.1) * 10) / 10; })}>-</Btn><b>{(key.t - sc.keys[kk - 1].t).toFixed(1)}s</b><Btn kind="less" t="scene-slower" tip="Later" onClick={() => edit((k, s) => { for (let i = kk; i < s.keys.length; i++) s.keys[i].t = Math.round((s.keys[i].t + 0.1) * 10) / 10; })}>+</Btn>
          <select aria-label="How it moves into this keyframe" data-t="scene-ease" value={key.ease || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value as any; edit(k => { if (v) k.ease = v; else delete k.ease; }); }}>{EASES.map(x => <option value={x[0]}>{x[1]}</option>)}</select></> : 'The first picture'}</span>
        <Btn kind="go" t="scene-play" onClick={() => { setTime(time == null ? 0 : null); if (time != null) setReframe(x => x + 1); }}>{time == null ? 'Play' : 'Stop'}</Btn>
      </div>}
      <div class="sc-keys sc-cam" role="group" aria-label="The camera">
        <span class="sc-lbl">Camera</span>
        <span class="sc-shot" data-t="scene-shotname">{shotName}</span>
        <Btn kind="go" t="scene-keepview" tip="Shoot this keyframe from where the camera is now" onClick={keepView}>Keep this view</Btn>
        <select aria-label="A shot" data-t="scene-shot" value="" onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; if (v) takeShot(v); }}><option value="">A shot...</option>{SHOTS.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
        <select aria-label="The lens" data-t="scene-lens" value={String(lensOf((key.cam3 && key.cam3.fov) || 30))} onChange={e => setLens(+(e.currentTarget as HTMLSelectElement).value)}>{LENSES.map(([v, n]) => <option value={String(v)}>{n}</option>)}</select>
        <Btn kind="less" t="scene-camreset" disabled={!key.cam3 && !key.cam} tip="This keyframe has no shot of its own" onClick={homeCam}>Clear shot</Btn>
        {kk > 0 && <select aria-label="How the camera gets to this keyframe" data-t="scene-cammove" value={key.cm || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value as any; edit(k => { if (v) k.cm = v; else delete k.cm; }); setReframe(x => x + 1); }}>{CAM_MOVES.map(x => <option value={x[0]}>{x[1]}</option>)}</select>}
        <Btn kind="sm" t="scene-snap" tip="Save the picture as a PNG" onClick={snap}>Picture</Btn>
      </div>
    </Win>
    <Win title={tab === 'sel' ? (sel ? (sel.part === 'prop' ? 'Selected: a prop' : 'Selected: ' + who(sel.who)) : 'Selected') : tab === 'people' ? 'People and props' : tab === 'cap' ? 'Caption' : tab === 'set' ? 'The set' : 'The scene'} right={tab === 'people' ? people.length + ' of ' + MAX_PEOPLE : ''} area="side" t="scene-side">
      <div class="sc-row sc-section"><span class="sc-lbl">Change</span><Drop t="scene-tab" label="What to change" value={tab} options={[['sel', 'The one selected'], ['people', 'The people in it'], ['cap', 'The caption'], ['set', 'The set'], ['file', 'The scene: new, open, save']]} onChange={v => setTab(v as any)} /></div>
      <div class="sc-panel">
      {tab === 'sel' && <>
        <div class="sc-row">
          <select aria-label="Who or what" data-t="scene-who" value={sel ? sel.who : ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setSel(v ? { who: v, part: key.figs[v] ? 'body' : 'prop' } : null); }}>
            <option value="">Pick somebody or something</option>
            {sc.slots.filter(x => key.figs[x.id]).map(x => <option value={x.id}>{x.n + (cast[x.id] ? ': ' + cast[x.id].name : '')}</option>)}
            {key.props.map(q => <option value={q.id}>{(PROPS.find(x => x[0] === q.k) || ['', q.k])[1] + (q.txt ? ': ' + q.txt : '')}</option>)}
          </select>
        </div>
        {!sel && <p class="empty">Press somebody on the picture, or pick them here.</p>}
        {selFig && sel && <>
          <Group title="Position">
            <div class="sc-row" role="group" aria-label="Move">
              <Btn kind="less" t="scene-move" d={{ v: 'l' }} onClick={() => nudge(-0.5, 0)}>Left</Btn><Btn kind="less" t="scene-move" d={{ v: 'r' }} onClick={() => nudge(0.5, 0)}>Right</Btn>
              <Btn kind="less" t="scene-move" d={{ v: 'f' }} tip="Away from the set camera" onClick={() => nudge(0, 0, -0.6)}>Away</Btn><Btn kind="less" t="scene-move" d={{ v: 'n' }} tip="Toward the set camera" onClick={() => nudge(0, 0, 0.6)}>Nearer</Btn>
              <Btn kind="less" t="scene-move" d={{ v: 'u' }} onClick={() => nudge(0, 0.25)}>Up</Btn><Btn kind="less" t="scene-move" d={{ v: 'd' }} onClick={() => nudge(0, -0.25)}>Down</Btn>
            </div>
            {ring && <div class="sc-row"><select aria-label="Put them on" data-t="scene-spot" value="" onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; if (v) placeAt(v); }}>
              <option value="">Put them on...</option>{SPOTS.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
              <span class="muted">Standing on: {selFig.on ? 'held' : (selFig.lv || 0) >= 4.5 ? 'the top rope' : (selFig.lv || 0) >= 3 ? 'the second rope' : (selFig.lv || 0) <= -2.5 ? 'the floor outside' : (selFig.lv || 0) > 0.5 ? 'the air' : 'the mat'}</span></div>}
            <div class="sc-row">
              <Btn kind="less" t="scene-face" onClick={() => edit(k => { const f = fig(k, sel.who); if (f) f.f = -f.f; })}>Face the other way</Btn>
              <Btn kind="less" t="scene-back" on={!!selFig.b} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) { if (f.b) delete f.b; else f.b = true; } })}>Show their back</Btn>
              <span class="sc-lbl">Size</span>
              <Btn kind="less" t="scene-size" d={{ v: '-' }} disabled={(selFig.s || 1) <= 0.75} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) f.s = r2((f.s || 1) - 0.05); })}>-</Btn>
              <b data-t="scene-sizev">{Math.round((selFig.s || 1) * 100) + '%'}</b>
              <Btn kind="less" t="scene-size" d={{ v: '+' }} disabled={(selFig.s || 1) >= 1.25} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) f.s = r2((f.s || 1) + 0.05); })}>+</Btn>
            </div>
            <div class="sc-row"><span class="sc-lbl">Held by</span>
              <select aria-label="Held by" data-t="scene-heldby" value={selFig.on || ''} onChange={e => holdBy(sel.who, (e.currentTarget as HTMLSelectElement).value)}>
                <option value="">Nobody: on their own feet</option>
                {sc.slots.filter(x => x.id !== sel.who && key.figs[x.id] && !(key.figs[x.id].on || '').startsWith(sel.who + ':')).map(x => HOLDS.map(([a, n]) => <option value={x.id + ':' + a}>{x.n + "'s " + n}</option>))}
              </select></div>
          </Group>
          <Group title="Pose">
            <div class="sc-row">
              <select aria-label="Start from a pose" data-t="scene-poselib" value="" onChange={e => { const d = POSES.find(x => x[0] === (e.currentTarget as HTMLSelectElement).value); if (d) edit(k => { const f = fig(k, sel.who); if (f) { f.p = { ...d[1].p }; f.r = d[1].r || 0; f.y = d[1].y ?? WAIST; if (d[1].e != null) f.e = d[1].e; } }); }}>
                <option value="">A pose...</option>{POSES.map(x => <option value={x[0]}>{x[1].n}</option>)}
              </select>
              <Btn kind="less" t="scene-stand" onClick={() => edit(k => { const f = fig(k, sel.who); if (f) { f.p = {}; f.r = 0; f.y = WAIST; } })}>Stand</Btn>
              <Btn kind="less" t="scene-pin" d={{ v: 'body' }} on={sel.part === 'body'} onClick={() => setSel({ who: sel.who, part: 'body' })}>Whole body</Btn>
            </div>
            {figR && <DollMap r={figR} part={sel.part} hide={hideOf} onPart={j => setSel({ who: sel.who, part: j })} />}
            <p class="sc-ang"><b>{partName}</b>{sel.part === 'body' ? ' leans ' : ' at '}<b data-t="scene-angle">{angle}</b> degrees</p>
            <div class="sc-row" role="group" aria-label={sel.part === 'body' ? 'Lean' : 'Turn'}>
              <Btn kind="sm" t="scene-turn" d={{ v: 15 }} onClick={() => turn(15)}>{'+15'}</Btn><Btn kind="sm" t="scene-turn" d={{ v: 5 }} onClick={() => turn(5)}>{'+5'}</Btn>
              <Btn kind="sm" t="scene-turn" d={{ v: -5 }} onClick={() => turn(-5)}>{'-5'}</Btn><Btn kind="sm" t="scene-turn" d={{ v: -15 }} onClick={() => turn(-15)}>{'-15'}</Btn>
            </div>
            {LIMBS[sel.part] && <div class="sc-row" role="group" aria-label="This limb">
              <span class="sc-lbl">{LIMBS[sel.part].startsWith('arm') ? 'Arm' : 'Leg'} depth</span>
              <Drop t="scene-limb" label="Where the limb sits" value={String((selFig.lz || {})[LIMBS[sel.part]] || 0)} options={[['3', 'In front'], ['0', 'As cut'], ['-3', 'Behind']]} onChange={sv => { const v = +sv; edit(k => { const f = fig(k, sel.who); if (f) { const lz = { ...(f.lz || {}) }; if (v) lz[LIMBS[sel.part]] = v; else delete lz[LIMBS[sel.part]]; f.lz = lz; } }); }} />
            </div>}
          </Group>
          <Group title="Face and marks">
            <span hidden data-t="scene-fig" data-v={JSON.stringify(selFig)} />
            <div class="sc-row"><span class="sc-lbl">Face</span><Drop t="scene-expr" label="Their face" value={selFig.e || 'calm'} options={EXPR.map(x => [x[0] || 'calm', x[1]] as Opt)} onChange={v => edit(k => { const f = fig(k, sel.who); if (f) f.e = v === 'calm' ? '' : v; })} /></div>
            <div class="sc-row"><span class="sc-lbl">Blood</span><Drop t="scene-blood" label="Blood" value={String((selFig.m && selFig.m.blood) || 0)} options={[['0', 'None'], ['1', 'A cut'], ['2', 'A trickle'], ['3', 'Covered']]} onChange={v => edit(k => { const f = fig(k, sel.who); if (f) f.m = { ...(f.m || {}), blood: +v }; })} /></div>
            <div class="sc-row">{([['sweat', 'Sweat'], ['tears', 'Tears'], ['bruise', 'A bruise']] as [keyof Marks, string][]).map(([m, n]) =>
              <Btn kind="less" t="scene-mark" d={{ v: m }} on={!!(selFig.m && selFig.m[m])} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) f.m = { ...(f.m || {}), [m]: !(f.m && f.m[m]) }; })}>{n}</Btn>)}</div>
          </Group>
          <Group title="Hidden parts">
            {BODY_PARTS.map(([g, ps]) => <div class="sc-row" key={g}><span class="sc-lbl">{g}</span>{ps.map(([j, n]) => <Btn kind={hideOf.indexOf(j) >= 0 ? 'danger' : 'less'} t="scene-hide" d={{ v: j }} on={hideOf.indexOf(j) >= 0} tip={hideOf.indexOf(j) >= 0 ? 'Hidden: press to show it' : 'Shown: press to hide it'} onClick={() => setHide(j)}>{n}</Btn>)}</div>)}
            <div class="sc-row"><Btn kind="less" t="scene-unhide" disabled={!hideOf.length} onClick={() => setHide(null)}>Show every part</Btn><span class="muted">For a close-up, a shadow on a wall, a hand coming into the picture.</span></div>
          </Group>
        </>}
        {selProp && sel && <Group title="Prop">
          <div class="sc-row">
            {(TEXTED.includes(selProp.k)) && <TextBox value={selProp.txt || ''} max={selProp.k === 'words' ? 32 : 16} label="Words" t="scene-words" onInput={v => edit(k => { const q = propOf(k, sel.who); if (q) q.txt = selProp.k === 'words' ? v : v.toUpperCase(); })} width="12ch" />}
            {TEXTED.includes(selProp.k) && <Drop t="scene-wordcol" label="Colour of the words" value={selProp.col || ''} options={WORD_COLS} onChange={v => edit(k => { const q = propOf(k, sel.who); if (q) { if (v) q.col = v; else delete q.col; } })} />}
            <Btn kind="sm" t="scene-bigger" onClick={() => edit(k => { const q = propOf(k, sel.who); if (q) q.s = Math.min(3, Math.round(((q.s || 1) + 0.1) * 10) / 10); })}>Bigger</Btn>
            <Btn kind="sm" t="scene-smaller" onClick={() => edit(k => { const q = propOf(k, sel.who); if (q) q.s = Math.max(0.3, Math.round(((q.s || 1) - 0.1) * 10) / 10); })}>Smaller</Btn>
          </div>
          <div class="sc-row" role="group" aria-label="Move">
            <Btn kind="less" t="scene-move" d={{ v: 'l' }} onClick={() => nudge(-0.5, 0)}>Left</Btn><Btn kind="less" t="scene-move" d={{ v: 'r' }} onClick={() => nudge(0.5, 0)}>Right</Btn>
            <Btn kind="less" t="scene-move" d={{ v: 'u' }} onClick={() => nudge(0, 0.25)}>Up</Btn><Btn kind="less" t="scene-move" d={{ v: 'd' }} onClick={() => nudge(0, -0.25)}>Down</Btn>
            <Btn kind="less" t="scene-turn" d={{ v: 15 }} onClick={() => turn(15)}>Turn</Btn>
          </div>
          <div class="sc-row"><Btn kind="danger" t="scene-dropprop" onClick={() => { edit(k => { k.props = k.props.filter(x => x.id !== sel.who); }); setSel(null); }}>Remove the prop</Btn></div>
        </Group>}
      </>}
      {tab === 'people' && <>
        <Group title={'Who is in it (' + people.length + ' of ' + MAX_PEOPLE + ')'}>
          <div class="sc-people" data-t="scene-layers">
          {sc.slots.map(x => { const inIt = !!key.figs[x.id], hid = hidden.indexOf(x.id) >= 0, lk = locked.indexOf(x.id) >= 0; return <div class={'sc-prow' + (sel && sel.who === x.id ? ' on' : '')} key={x.id}>
            <Btn kind="less" cls="sc-pname" t="scene-lpick" d={{ v: x.id }} on={!!sel && sel.who === x.id} disabled={!inIt || hid || lk} onClick={() => pickSel({ who: x.id, part: 'body' })}>{x.n}</Btn>
            {x.role !== 'ref' && <select aria-label={'Who plays ' + x.n} data-t="scene-cast" data-v={x.id} value={String(castIds[x.id] ?? -1)} onChange={e => setCast({ ...castIds, [x.id]: +(e.currentTarget as HTMLSelectElement).value })}>
              <option value="-1">A plain card figure</option>{roster.map(w => <option value={String(w.id)}>{w.name}</option>)}
            </select>}
            {x.role !== 'ref' && <select aria-label={'The part ' + x.n + ' plays in the story'} data-t="scene-hook" data-v={x.id} value={x.hook || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value, n = copy(sc), sl = n.slots.find(y => y.id === x.id)!; if (v) { sl.hook = v; sl.n = (HOOKS.find(h => h[0] === v) || ['', sl.n])[1]; } else delete sl.hook; setSc(n); }}>
              {HOOKS.map(h => <option value={h[0]}>{h[1]}</option>)}
            </select>}
            <span class="sc-pbtns">
            {inIt ? <>
              <Btn kind="less" t="scene-lhide" d={{ v: x.id }} on={hid} tip="Only while editing" onClick={() => { flip(hidden, setHidden, x.id); if (sel && sel.who === x.id) setSel(null); }}>{hid ? 'Show' : 'Hide'}</Btn>
              <Btn kind="less" t="scene-llock" d={{ v: x.id }} on={lk} tip="Cannot be picked on the picture" onClick={() => { flip(locked, setLocked, x.id); if (sel && sel.who === x.id) setSel(null); }}>{lk ? 'Unlock' : 'Lock'}</Btn>
              {x.at ? <Btn kind="less" t="scene-sendaway" d={{ v: x.id }} onClick={() => { const n = copy(sc); n.keys.forEach(k => { delete k.figs[x.id]; }); setSc(n); if (sel && sel.who === x.id) setSel(null); }}>Send away</Btn>
                : x.role === 'c' && !x.dress ? <Btn kind="danger" t="scene-dropperson" d={{ v: x.id }} onClick={() => dropPerson(x.id)}>Remove</Btn> : null}
            </> : <Btn kind="sm" t="scene-bringin" d={{ v: x.id }} onClick={() => { const n = copy(sc); n.keys.forEach(k => { k.figs[x.id] = copy(x.at || { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} }); }); setSc(n); setSel({ who: x.id, part: 'body' }); }}>Bring in</Btn>}
            </span>
          </div>; })}
          </div>
          <div class="sc-row"><Btn kind="go" t="scene-addperson" disabled={people.length >= MAX_PEOPLE} onClick={addPerson}>Add a person</Btn><span class="muted">Up to {MAX_PEOPLE}, and the referee. Each is played by the next wrestler on the roster until you pick.</span></div>
        </Group>
        <Group title="New prop">
          <div class="sc-row"><select aria-label="Prop" data-t="scene-propkind" value={addK} onChange={e => setAddK((e.currentTarget as HTMLSelectElement).value)}>{PROPS.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
            {(TEXTED.includes(addK)) && <TextBox value={words} max={addK === 'words' ? 32 : 16} label="Words on it" t="scene-newwords" onInput={v => setWords(addK === 'words' ? v : v.toUpperCase())} width="10ch" />}
            <Btn t="scene-addprop" onClick={() => { addProp(); setTab('sel'); }}>Add</Btn></div>
          {key.props.length ? <div class="sc-row">{key.props.map(q => <Btn kind="less" t="scene-lpick" d={{ v: q.id }} on={!!sel && sel.who === q.id} onClick={() => pickSel({ who: q.id, part: 'prop' })}>{(PROPS.find(x => x[0] === q.k) || ['', q.k])[1] + (q.txt ? ': ' + q.txt : '')}</Btn>)}</div> : null}
        </Group>
      </>}
      {tab === 'cap' && <>
        <Group title={'Caption on keyframe ' + (kk + 1)}>
          <label class="sc-capbox"><span class="sc-lbl">Words</span><textarea data-t="scene-cap" rows={3} maxLength={140} value={capOf.t} placeholder="What the picture says. Leave it empty for no caption." onInput={e => setCap({ t: (e.currentTarget as HTMLTextAreaElement).value })} /></label>
          <div class="sc-row"><span class="sc-lbl">Style</span><select aria-label="Style of the caption" data-t="scene-capstyle" value={capOf.s || 'sub'} onChange={e => setCap({ s: (e.currentTarget as HTMLSelectElement).value })}>{CAP_STYLES.map(x => <option value={x[0]}>{x[1]}</option>)}</select></div>
          {(capOf.s === 'third' || capOf.s === 'quote') && <div class="sc-row"><span class="sc-lbl">{capOf.s === 'third' ? 'Names' : 'Said by'}</span><select aria-label="Who it names" data-t="scene-capwho" value={capOf.who || ''} onChange={e => setCap({ who: (e.currentTarget as HTMLSelectElement).value })}><option value="">Nobody</option>{people.map(x => <option value={x.id}>{x.n + (cast[x.id] ? ': ' + cast[x.id].name : '')}</option>)}</select></div>}
          <div class="sc-row"><Btn kind="less" t="scene-capclear" disabled={!key.cap} onClick={() => edit(k => { delete k.cap; })}>No caption</Btn>
            <Btn kind="less" t="scene-capall" disabled={!key.cap} tip="Put this caption on every keyframe" onClick={() => { const c = key.cap; if (!c) return; const n = copy(sc); n.keys.forEach(k => { k.cap = copy(c); }); setSc(n); }}>On every keyframe</Btn></div>
          <p class="muted">A caption shows from its keyframe until the next one. Lower thirds name somebody under the picture; a line somebody says is in their own words, for a promo told in pictures.</p>
        </Group>
      </>}
      {tab === 'set' && <>
        <Group title="Set">
          <div class="sc-row"><span class="sc-slot">Where</span><select aria-label="The set" data-t="scene-set" value={sc.set} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; if (isBg(v)) { const b = allBgs.find(x => 'bg_' + x.id === v); if (b) { setBg(copy(b) as any); setBgi(-1); } } setSc({ ...sc, set: v }); setReframe(x => x + 1); }}>{SETS.map(x => <option value={x[0]}>{x[1]}</option>)}{allBgs.map(b => <option value={'bg_' + b.id}>{'Backdrop: ' + b.name}</option>)}</select></div>
          <div class="sc-row"><span class="sc-slot">Shape</span><select aria-label="Shape of the picture" data-t="scene-frame" value={sc.frame || 'wide'} onChange={e => { const f = (e.currentTarget as HTMLSelectElement).value as any; const n = { ...sc }; if (f === 'wide') delete n.frame; else n.frame = f; setSc(n); }}>{FRAMES.map(x => <option value={x[0]}>{x[1]}</option>)}</select></div>
          <div class="sc-row"><span class="sc-slot">Look</span><span class="sc-fx">{SCENE_FX.map(([k, n]) => { const on = !!(sc.fx && sc.fx[k]); return <Btn key={k} t="scene-fx" d={{ v: k }} kind={on ? 'go' : 'less'} on={on} onClick={() => { const f = { ...(sc.fx || {}) }; if (on) delete f[k]; else f[k] = true; const n2 = { ...sc }; if (Object.keys(f).length) n2.fx = f; else delete n2.fx; setSc(n2); }}>{n}</Btn>; })}</span></div>
        </Group>
        {!(bg && isBg(sc.set)) ? <Group title="Custom backdrop">
          <p class="sc-gap">Build the wall behind this scene: a colour for the wall and the floor, then banners, signs, windows, curtains, a skyline.</p>
          <div class="sc-row"><Btn kind="go" t="scene-bgnew" onClick={() => { const b = newBackdrop(); setBg(b); setBgi(-1); setSc({ ...sc, set: 'bg_' + b.id }); say('A new backdrop. Add parts to it, then Keep the backdrop.'); }}>A new backdrop</Btn>
            {savedBgs.map(b => <Btn kind="less" t="scene-bguse" d={{ v: b.id }} onClick={() => { setBg(copy(b) as any); setBgi(-1); setSc({ ...sc, set: 'bg_' + b.id }); }}>{b.name}</Btn>)}</div>
        </Group> : <>
          <Group title="Backdrop">
            <div class="sc-row"><TextBox value={bg.name} max={40} label="Name of the backdrop" t="scene-bgname" onInput={v => editBg(b => { b.name = v; })} width="16ch" /></div>
            <div class="sc-row"><span class="sc-slot">Wall</span><select aria-label="Wall colour" data-t="scene-bgwall" value={bg.wall} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; editBg(b => { b.wall = v; }); }}>{BG_COLS.map(c => <option value={c[0]}>{c[1]}</option>)}</select>
              <span class="sc-slot">Floor</span><select aria-label="Floor colour" data-t="scene-bgfloor" value={bg.floor} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; editBg(b => { b.floor = v; }); }}>{BG_COLS.map(c => <option value={c[0]}>{c[1]}</option>)}</select></div>
            <div class="sc-row"><select aria-label="Part to add" data-t="scene-bgkind" value={bgAdd} onChange={e => setBgAdd((e.currentTarget as HTMLSelectElement).value)}>{BG_PARTS.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
              {(BG_PARTS.find(x => x[0] === bgAdd) || [])[4] && <TextBox value={bgWords} max={24} label="Words on it" t="scene-bgwords" onInput={v => setBgWords(v.toUpperCase())} width="9ch" />}
              <Btn t="scene-bgadd" disabled={bg.parts.length >= 40} onClick={() => { editBg(b => { b.parts.push(newPart(bgAdd, bgWords)); }); setBgi(bg.parts.length); }}>Add</Btn></div>
            <div class="sc-row">{bg.parts.length ? <Drop t="scene-bgpart" label="Which part" value={String(bgi)} options={[['-1', 'Pick a part...'] as Opt].concat(bg.parts.map((q, i) => [String(i), (BG_PARTS.find(x => x[0] === q.k) || ['', q.k])[1] + (q.txt ? ': ' + q.txt : '')] as Opt))} onChange={v => setBgi(+v)} /> : null}</div>
          </Group>
          {bgPart && <Group title="Picked part">
            <div class="sc-row" role="group" aria-label="Move it">{([['l', 'Left', -0.5, 0], ['r', 'Right', 0.5, 0], ['u', 'Up', 0, 0.3], ['d', 'Down', 0, -0.3]] as [string, string, number, number][]).map(([v, n, dx, dy]) => <Btn kind="less" t="scene-bgmove" d={{ v }} onClick={() => editBg(b => { const q = b.parts[bgi]; q.x = Math.max(-12, Math.min(12, Math.round((q.x + dx) * 10) / 10)); q.y = Math.max(-6, Math.min(8, Math.round((q.y + dy) * 10) / 10)); })}>{n}</Btn>)}</div>
            <div class="sc-row" role="group" aria-label="Size">{([['w+', 'Wider', 1.15, 1], ['w-', 'Narrower', 1 / 1.15, 1], ['h+', 'Taller', 1, 1.15], ['h-', 'Shorter', 1, 1 / 1.15]] as [string, string, number, number][]).map(([v, n, kw, kh]) => <Btn kind="less" t="scene-bgsize" d={{ v }} onClick={() => editBg(b => { const q = b.parts[bgi]; q.w = Math.max(0.2, Math.min(24, Math.round(q.w * kw * 100) / 100)); q.h = Math.max(0.1, Math.min(12, Math.round(q.h * kh * 100) / 100)); })}>{n}</Btn>)}</div>
            <div class="sc-row"><select aria-label="Colour of the part" data-t="scene-bgcol" value={bgPart.col} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; editBg(b => { b.parts[bgi].col = v; }); }}>{BG_COLS.map(c => <option value={c[0]}>{c[1]}</option>)}</select>
              {bgPart.txt != null && <TextBox value={bgPart.txt} max={24} label="Words" t="scene-bgtext" onInput={v => editBg(b => { b.parts[bgi].txt = v.toUpperCase(); })} width="9ch" />}
              <Btn kind="danger" t="scene-bgdrop" onClick={() => { editBg(b => { b.parts.splice(bgi, 1); }); setBgi(-1); }}>Remove</Btn></div>
          </Group>}
          <div class="sc-row"><Btn kind="go" t="scene-bgsave" disabled={!pp.onSaveBg} onClick={() => { if (pp.onSaveBg && pp.onSaveBg(copy(bg) as any)) say('"' + bg.name + '" is kept in ' + pp.world + '. Any scene can stand in front of it (The set).'); else say('That backdrop could not be kept.', { err: true }); }}>Keep the backdrop</Btn>
            <Btn kind="less" t="scene-bgoff" onClick={() => setSc({ ...sc, set: 'plain' })}>Back to a stock set</Btn></div>
        </>}
      </>}
      {tab === 'file' && <>
        <Group title="Scene">
          <div class="sc-row"><TextBox value={sc.name} max={32} label="Name of the scene" t="scene-name" onInput={v => setSc({ ...sc, name: v })} width="18ch" /></div>
          <div class="sc-row"><span class="sc-slot">Kind</span><select aria-label="Kind of scene" data-t="scene-kind" value={sc.still ? 'still' : 'moving'} onChange={e => { const still = (e.currentTarget as HTMLSelectElement).value === 'still'; const n = copy(sc); if (still) { n.still = true; n.keys = [n.keys[kk]]; n.keys[0].t = 0; n.loop = false; if (!STILL_WHEN.some(w => w[0] === n.when)) n.when = 'any'; } else { delete n.still; if (!WHEN.concat(SHOW_WHEN).some(w => w[0] === n.when)) n.when = 'any'; } setSc(n); setKi(0); setTime(null); }}><option value="moving">Moving: keyframes that play</option><option value="still">A still picture</option></select></div>
          <div class="sc-row"><span class="sc-slot">{sc.still ? 'Used for' : 'Plays at'}</span><select aria-label="When it plays" data-t="scene-when" value={sc.when} onChange={e => setSc({ ...sc, when: (e.currentTarget as HTMLSelectElement).value })}>{(sc.still ? STILL_WHEN : WHEN.concat(SHOW_WHEN)).map(w => <option value={w[0]}>{w[1]}</option>)}</select></div>
          <div class="sc-row"><span class="sc-slot">Plays</span><Btn kind="less" t="scene-loop" on={!!sc.loop} onClick={() => { const n = { ...sc }; if (n.loop) delete n.loop; else n.loop = true; setSc(n); }}>{sc.loop ? 'Round and round' : 'Once'}</Btn></div>
        </Group>
        <Group title="Files">
          <div class="sc-row">
            {(() => { const kind = (x: Scene) => mine.some(m => m.id === x.id) ? 'This world: ' : x.still ? 'Included still: ' : SHOW_SCENES.some(y => y.id === x.id) ? 'Included, the show: ' : 'Included: ';
              const all = mine.concat(SCENES.concat(STILLS, SHOW_SCENES, MOVES).filter(x => !mine.some(m => m.id === x.id))), here = all.filter(x => studioOf(x) === mode), other = all.filter(x => studioOf(x) !== mode);
              return <select aria-label="Open a scene" data-t="scene-open" value="" onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; const x = allScenes(mine).find(y => y.id === v); if (x) open(x); }}>
                <option value="">Open a scene...</option>
                {here.map(x => <option value={x.id}>{kind(x) + x.name}</option>)}
                {other.length ? <optgroup label="From the other studios">{other.map(x => <option value={x.id}>{kind(x) + x.name}</option>)}</optgroup> : null}
              </select>; })()}
          </div>
          <div class="sc-row">
            <Btn kind="sm" t="scene-export" onClick={exportIt}>Write a file</Btn>
            <Btn kind="sm" t="scene-import" onClick={() => file.current && file.current.click()}>Open a file</Btn>
            {mine.some(x => x.id === sc.id) && (() => { const inc = SCENES.concat(STILLS, SHOW_SCENES, MOVES).some(x => x.id === sc.id);   // a changed included scene goes back to the included one
              return <Btn kind="danger" t="scene-delete" onClick={() => { pp.onForget(sc.id); say(inc ? '"' + sc.name + '" is back as included.' : '"' + sc.name + '" is no longer in ' + pp.world + '.'); }}>{inc ? 'Put back as included' : 'Take it out'}</Btn>; })()}
            <input ref={file} type="file" accept=".json,application/json" hidden data-t="scene-file" onChange={e => { const f = (e.currentTarget as HTMLInputElement).files; if (f && f[0]) importIt(f[0]); (e.currentTarget as HTMLInputElement).value = ''; }} />
          </div>
        </Group>
        <Group title={mode === 'still' ? 'Start from a template' : mode === 'move' ? 'Start a new move' : 'Start a new scene'}>
          <div class="sc-row"><span class="sc-lbl">Start from</span><Drop t="scene-setup" label="Start a new scene from" value="" options={[['', mode === 'still' ? 'Pick a template...' : 'Pick a setup...'] as Opt].concat(setupsFor(mode).map(([id, n]) => [id, n] as Opt))}
            groups={[{ label: 'Other setups', options: SETUPS.filter(x => !setupsFor(mode).some(y => y[0] === x[0])).map(([id, n]) => [id, n] as Opt) }]}
            onChange={id => { const tp = mode === 'still' && TEMPLATES.some(x => x[0] === id), n = ((tp ? TEMPLATES : SETUPS).find(x => x[0] === id) || ['', ''])[1]; if (!id) return; const ns = tp ? templateScene(id) : setupScene(id); if (mode === 'move' && ns.when === 'any') { ns.when = 'move'; ns.name = 'My move'; } open(ns); setTab('sel'); say('A new scene: ' + n.toLowerCase() + '. Press somebody to move or pose them; each keyframe can keep its own shot.'); }} /></div>
        </Group>
      </>}
      </div>
    </Win>
  </Desktop></div>;
}
