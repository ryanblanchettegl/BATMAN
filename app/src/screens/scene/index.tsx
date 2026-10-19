/* Create a Scene (Ryan, 18 October): the studio where every picture of a moment is made, the game's own included.
   A scene is a set, people in slots and keyframes (src/kit/scene.ts). On the stage, press a person to pick them:
   drag a part of the body to turn it round its pin, drag the trunks to move the whole person, drag a prop to move
   it. Everything the pointer does has a button and a key too (rule 5): the Pose window turns the picked part a few
   degrees at a time, moves and tilts the person, and the arrow keys work on the stage. Keyframes run along the
   bottom; Play slides from one to the next. A scene is saved in this browser and written out as a .scene.json file
   to share. The cast is only for seeing it: a scene keeps slots, and the show fills them from the card.
   Nothing here touches the game. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { W } from '../../engine';
import { Btn, TextBox, Desktop, Win, Group, Tabs } from '../../kit';
import { Scene, Key, Fig, Prop, SCENES, STILLS, WHEN, STILL_WHEN, SETS, SETUPS, setupScene, WAIST, CAM0, POSES, HOLDS, LIMBS, HOOKS, at, build, viewFor, tilt, paint, lastT, allScenes, ok, copy, SHOW_WHEN, SHOW_SCENES, SCENE_FX, fxClass, FRAMES, EASES, aspectOf, cropOf, fitIn } from '../../kit/scene';
import { FxVeil } from '../../kit/sceneplayer';
import { Backdrop, BG_PARTS, BG_COLS, newBackdrop, newPart, useBackdropSource, isBg, setKey } from '../../kit/backdrop';
import { drawPaper, drawScene, fromPx, toPx, pick, Piece, PAL } from '../../kit/paper';
import { Diorama3D } from '../../kit/diorama3d';
import { Recipe, recipeOf, JOINTS, PROPS, STAND, Rig, REF, blank, puppet, EXPR, Marks } from '../../kit/puppet';

type Sel = { who: string; part: string } | null;   // part is 'body', a joint name, or 'prop'
const deg = (r: number) => r * 180 / Math.PI;
const norm = (a: number) => { while (a > 180) a -= 360; while (a < -180) a += 360; return Math.round(a); };

function blankScene(): Scene {
  return { v: 1, id: 'scene-' + Date.now().toString(36), name: 'My scene', when: 'any', set: 'ring', slots: [{ id: 'A', n: 'Wrestler A', role: 'a' }, { id: 'B', n: 'Wrestler B', role: 'b' }, { id: 'R', n: 'The referee', role: 'ref' }],
    keys: [{ t: 0, figs: { A: { x: -2.2, y: WAIST, r: 0, f: 1, z: 0, p: {} }, B: { x: 2.2, y: WAIST, r: 0, f: -1, z: 1.2, p: {} }, R: { x: -5.4, y: WAIST, r: 0, f: 1, z: -0.3, p: {} } }, props: [] }] };
}

/** The stage: the scene drawn at the keyframe (or at the moment, while it plays), the picked thing outlined. */
/** The stage is also the camera: a drag on an empty part of it pans, the wheel zooms. */
function Stage(p: { sc: Scene; ki: number; time: number | null; cast: Record<string, Recipe>; sel: Sel; onSel: (s: Sel) => void; onDrag: (s: Sel, wx: number, wy: number, dx: number, dy: number, rig: Rig | null) => void; onCam: (dx: number, dy: number, zoom: number) => void; onKey: (e: KeyboardEvent) => void }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), last = useRef<{ pieces: Piece[]; rigs: Record<string, Rig>; v: any } | null>(null);
  const drag = useRef<{ sel: Sel; x: number; y: number; cam?: boolean } | null>(null);
  const [size, setSize] = useState([960, 540]);
  useEffect(() => {
    const b = box.current; if (!b) return;
    const fit = () => { const r = b.getBoundingClientRect(); setSize(fitIn(r.width, r.height, aspectOf(p.sc), 160)); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b); return () => ro.disconnect();
  }, [p.sc.frame]);
  useEffect(() => {
    const c = cv.current; if (!c) return; const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size[0] * dpr); c.height = Math.round(size[1] * dpr);
    const t = p.time == null ? p.sc.keys[p.ki].t : p.time, k = p.time == null ? p.sc.keys[p.ki] : at(p.sc, t), ctx = c.getContext('2d')!, v = viewFor(c.width, c.height, k.cam, cropOf(p.sc)), b = build(p.sc, k, p.cast, t);
    ctx.fillStyle = PAL.navy; ctx.fillRect(0, 0, c.width, c.height); tilt(ctx, k.cam); drawScene(ctx, b.pieces, v, setKey(p.sc.set)); ctx.restore();
    last.current = { ...b, v };
    if (p.sel && p.time == null) {   // outline what is picked, and mark its pin
      ctx.save(); ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = Math.max(2, v.s * 0.035); ctx.setLineDash([v.s * 0.12, v.s * 0.08]);
      b.pieces.filter(x => p.sel!.part === 'prop' ? x.prop === p.sel!.who : x.own === p.sel!.who && (p.sel!.part === 'body' || x.joint === p.sel!.part)).forEach(x => {
        ctx.beginPath(); x.pts.forEach((q, i) => { const X = v.ox + q[0] * v.s, Y = v.oy - q[1] * v.s; if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.stroke();
      });
      const rg = b.rigs[p.sel.who], j = rg && rg.joints[p.sel.part];
      if (j) { const X = v.ox + (rg.f < 0 ? 2 * rg.rootx - j.x : j.x) * v.s, Y = v.oy - j.y * v.s; ctx.setLineDash([]); ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(X, Y, v.s * 0.12, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
  });
  const xy = (e: PointerEvent): [number, number] => { const c = cv.current!, r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  const down = (e: PointerEvent) => {
    const L = last.current; if (!L || p.time != null) return; const [x, y] = xy(e);
    const hit = pick(L.pieces, L.v, x, y, q => !!(q.own || q.prop));
    const s: Sel = !hit ? null : hit.prop ? { who: hit.prop, part: 'prop' } : { who: hit.own!, part: hit.joint && hit.joint !== 'body' ? hit.joint : 'body' };
    p.onSel(s); drag.current = s ? { sel: s, x, y } : { sel: null, x, y, cam: true };   // on nothing, a drag pans the camera
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const d = drag.current, L = last.current; if (!d || !L) return; const [x, y] = xy(e), w = fromPx(L.v, x, y);
    if (d.cam) { p.onCam(-(x - d.x) / L.v.s, (y - d.y) / L.v.s, 1); d.x = x; d.y = y; return; }
    p.onDrag(d.sel, w[0], w[1], (x - d.x) / L.v.s, -(y - d.y) / L.v.s, d.sel ? L.rigs[d.sel.who] || null : null); d.x = x; d.y = y;
  };
  const up = () => { drag.current = null; };
  return <div ref={box} class={'sc-stage' + fxClass(p.sc)}>
    <canvas ref={cv} tabIndex={0} data-t="scene-stage" data-v={p.sc.id} data-k={p.ki} data-sel={p.sel ? p.sel.who + ':' + p.sel.part : ''} data-cam={JSON.stringify(p.sc.keys[p.ki].cam || null)} role="img"
      aria-label={'The stage: ' + p.sc.name + '. Press a person or a prop to pick it, then drag it, or use the arrow keys.'}
      style={{ width: size[0] + 'px', height: size[1] + 'px' }} onPointerDown={down as any} onPointerMove={move as any} onPointerUp={up} onPointerCancel={up} onKeyDown={p.onKey as any}
      onWheel={(e: WheelEvent) => { if (p.time != null) return; e.preventDefault(); p.onCam(0, 0, e.deltaY < 0 ? 1.1 : 1 / 1.1); }} />
    {fxClass(p.sc) && <FxVeil w={size[0]} h={size[1]} />}
  </div>;
}

/** The stage in 3D: the same scene built as a real model and photographed (src/kit/diorama3d.ts). Press a person
    or a prop to pick it and drag a part to turn it round its pin, or the body to move them; a drag on nothing walks
    the camera round the model, the wheel comes closer. The keys work as on the flat stage. */
function Stage3D(p: { sc: Scene; ki: number; time: number | null; cast: Record<string, Recipe>; sel: Sel; onSel: (s: Sel) => void; onDrag: (s: Sel, wx: number, wy: number, dx: number, dy: number, rig: Rig | null) => void; onKey: (e: KeyboardEvent) => void }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), eng = useRef<Diorama3D | null>(null), [size, setSize] = useState([0, 0]);
  const drag = useRef<{ sel: Sel; at: [number, number] } | null>(null), props = useRef(p); props.current = p;
  useEffect(() => {
    const b = box.current, c = cv.current; if (!b || !c) return;
    try { eng.current = new Diorama3D(c); } catch (e) { eng.current = null; }
    const dbg = (window as any).EWF_DEBUG; if (dbg) dbg.three = () => eng.current;
    const fit = () => { const r = b.getBoundingClientRect(), [w, h] = fitIn(r.width, r.height, aspectOf(props.current.sc), 160); setSize([w, h]); if (eng.current) eng.current.size(w, h); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b);
    // the pointer: in the capture phase, so a press on a person stops the camera before it starts to turn
    const down = (e: PointerEvent) => {
      const E3 = eng.current; if (!E3 || props.current.time != null || e.target !== c) return;
      const hit = E3.pick(e.clientX, e.clientY); if (!hit) return;   // nothing there: the camera walks round
      E3.ctl.enabled = false; props.current.onSel(hit);
      const at0 = E3.toScene(hit.who, e.clientX, e.clientY); drag.current = at0 ? { sel: hit, at: at0 } : null;
      c.setPointerCapture(e.pointerId); e.stopPropagation();
    };
    const move = (e: PointerEvent) => {
      const d = drag.current, E3 = eng.current; if (!d || !E3 || !d.sel) return;
      const q = E3.toScene(d.sel.who, e.clientX, e.clientY); if (!q) return;
      props.current.onDrag(d.sel, q[0], q[1], q[0] - d.at[0], q[1] - d.at[1], E3.rigs[d.sel.who] || null); d.at = q;
    };
    const up = () => { drag.current = null; if (eng.current) eng.current.ctl.enabled = true; };
    b.addEventListener('pointerdown', down, true); b.addEventListener('pointermove', move, true); b.addEventListener('pointerup', up, true); b.addEventListener('pointercancel', up, true);
    return () => { ro.disconnect(); b.removeEventListener('pointerdown', down, true); b.removeEventListener('pointermove', move, true); b.removeEventListener('pointerup', up, true); b.removeEventListener('pointercancel', up, true); if (eng.current) eng.current.dispose(); eng.current = null; };
  }, []);
  useEffect(() => { const b = box.current; if (!b) return; const r = b.getBoundingClientRect(), [w, h] = fitIn(r.width, r.height, aspectOf(p.sc), 160); setSize([w, h]); if (eng.current) eng.current.size(w, h); }, [p.sc.frame]);
  useEffect(() => { const e = eng.current; if (!e) return; const t = p.time == null ? p.sc.keys[p.ki].t : p.time; e.show(p.sc, p.time == null ? p.sc.keys[p.ki] : at(p.sc, t), p.cast, t, p.time == null ? p.sel : null); });
  return <div ref={box} class={'sc-stage sc-3d' + fxClass(p.sc)}>{fxClass(p.sc) && <FxVeil w={size[0]} h={size[1]} />}<canvas ref={cv} tabIndex={0} data-t="scene-stage3d" data-sel={p.sel ? p.sel.who + ':' + p.sel.part : ''} style={{ width: size[0] + 'px', height: size[1] + 'px' }} onKeyDown={p.onKey as any}
    aria-label={'The scene in 3D: ' + p.sc.name + '. Press a person or a prop to pick it and drag it; drag anywhere else to walk round the model.'} /></div>;
}

/** The picked person as a small paper doll with a brass pin at every joint: press a pin to pick that part, press
    the body tag to move and lean the whole person. The pins are real buttons (rule 5). */
const PINS: [string, string][] = [['body', 'The whole body: move and lean'], ...JOINTS];
function DollMap(p: { r: Recipe; part: string; onPart: (j: string) => void }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), [size, setSize] = useState([0, 0]);
  useEffect(() => {
    const b = box.current; if (!b) return;
    const fit = () => { const r = b.getBoundingClientRect(); setSize([Math.floor(r.width), Math.floor(r.height)]); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b); return () => ro.disconnect();
  }, []);
  const pieces: Piece[] = [], rig = puppet(p.r, { x: 0, y: WAIST, r: 0, f: 1, z: 0 }, { sh_n: 28, el_n: 12, sh_f: -28, el_f: -12, hip_n: 9, an_n: 0, hip_f: -9, an_f: 0 }, '', 'map', pieces);
  const s = Math.min(size[0] / 4.6, size[1] / 7.4), v = { s, ox: size[0] / 2, oy: size[1] / 2 + 0.3 * s };
  useEffect(() => {
    const c = cv.current; if (!c || !size[0]) return; const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size[0] * dpr); c.height = Math.round(size[1] * dpr); const ctx = c.getContext('2d')!; ctx.clearRect(0, 0, c.width, c.height);
    drawPaper(ctx, pieces, { s: v.s * dpr, ox: v.ox * dpr, oy: v.oy * dpr }, false);
  });
  const at = (j: string): [number, number] => { const q = j === 'body' ? rig.anchors.chest : [rig.joints[j].x, rig.joints[j].y] as [number, number]; return toPx(v, q); };
  return <div ref={box} class="sc-map" data-t="scene-map">
    <canvas ref={cv} style={{ width: size[0] + 'px', height: size[1] + 'px' }} aria-hidden="true" />
    {size[0] > 0 && PINS.filter(([j]) => j !== 'body').map(([j, n]) => { const [x, y] = at(j); return <button type="button" key={j} class={'pin' + (j === 'body' ? ' body' : '') + (p.part === j ? ' on' : '')} style={{ left: x + 'px', top: y + 'px' }}
      aria-label={n} aria-pressed={p.part === j} title={n} data-t="scene-pin" data-v={j} onClick={() => p.onPart(j)}>{j === 'body' ? 'Body' : ''}</button>; })}
  </div>;
}

/** Wrestlers from a world file, in the shape the dolls are cut from (Create a Player will replace this). */
const STY: Record<string, string> = { brawler: 'B', technician: 'T', flyer: 'H', powerhouse: 'P', all_rounder: 'A', striker: 'S', entertainer: 'E' };
export function fromWorld(pkg: any): W[] {
  return (pkg && pkg.workers || []).filter((w: any) => !w.roles || w.roles.indexOf('wrestler') >= 0).map((w: any, i: number) => ({ id: i, name: w.ring_name || w.id, g: w.gender === 'F' ? 'F' : 'M',
    align: w.disposition === 'heel' ? 'H' : 'F', twn: w.disposition === 'tweener', style: STY[w.style] || 'A', face: w.face, age: w.age || 28, gim: (w.gimmick_category || '') + ' ' + (w.gimmick || ''), look: w.look || null }));
}
export interface StudioProps { world: string; roster: W[]; saved: Scene[]; start?: Scene; blank?: boolean; castA?: number; onSave: (sc: Scene) => boolean;
  /** The world's backdrops, and how to keep one (the Backdrop tab). */ backdrops?: Backdrop[]; onSaveBg?: (b: Backdrop) => boolean; onForget: (id: string) => void; onDone: () => void }

/** Create a Scene, full screen, opened from the World Editor. The scene is kept in the world being edited. */
export function SceneStudio(pp: StudioProps) {
  const roster = pp.roster, [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const say = (t: string, o?: { err?: boolean }) => setMsg({ t, err: !!(o && o.err) }), redraw = () => { /* the studio redraws itself */ };
  const [sc, setSc] = useState<Scene>(() => pp.blank ? blankScene() : copy(pp.start || SCENES[0])), [ki, setKi] = useState(0), [sel, setSel] = useState<Sel>({ who: 'A', part: 'body' });
  const [time, setTime] = useState<number | null>(null), [castIds, setCast] = useState<Record<string, number>>(() => ({ A: pp.castA != null ? pp.castA : roster[0] ? roster[0].id : -1, B: (roster.find(w => w.id !== pp.castA) || { id: -1 }).id }));
  const [addK, setAddK] = useState('belt'), [words, setWords] = useState('WOW!'), file = useRef<HTMLInputElement>(null);
  const cast: Record<string, Recipe> = {}; for (const id in castIds) { const w = roster.find(x => x.id === castIds[id]); if (w) cast[id] = recipeOf(w); }
  const key = sc.keys[Math.min(ki, sc.keys.length - 1)];
  const edit = (fn: (k: Key, s: Scene) => void) => { const n = copy(sc); fn(n.keys[ki], n); setSc(n); };
  const fig = (k: Key, who: string): Fig | null => k.figs[who] || null;
  const propOf = (k: Key, id: string): Prop | null => k.props.find(x => x.id === id) || null;
  const turn = (d: number) => edit(k => { if (!sel) return; const f = fig(k, sel.who); if (f && sel.part !== 'body' && sel.part !== 'prop') f.p[sel.part] = norm((f.p[sel.part] ?? STAND[sel.part] ?? 0) + d); else if (f) f.r = norm(f.r + d); else { const q = propOf(k, sel.who); if (q) q.r = norm(q.r + d); } });
  const nudge = (dx: number, dy: number) => edit(k => { if (!sel) return; const f = fig(k, sel.who); const q = f ? null : propOf(k, sel.who); const o: any = f || q; if (o) { o.x = Math.round((o.x + dx) * 100) / 100; o.y = Math.round((o.y + dy) * 100) / 100; } });
  const onDrag = (s: Sel, wx: number, wy: number, dx: number, dy: number, rig: Rig | null) => edit(k => {
    if (!s) return; const f = fig(k, s.who);
    if (s.part === 'prop') { const q = propOf(k, s.who); if (q) { q.x += dx; q.y += dy; } return; }
    if (!f) return;
    if (s.part === 'body') { f.x += dx; f.y += dy; return; }
    const j = rig && rig.joints[s.part]; if (!j) return;
    const px = rig!.f < 0 ? 2 * rig!.rootx - wx : wx, a = Math.atan2(wy - j.y, px - j.x);
    f.p[s.part] = norm(deg(a - j.pa) + (j.up ? -90 : 90));
  });
  const onKey = (e: KeyboardEvent) => {
    const m: Record<string, () => void> = { ArrowLeft: () => sel && sel.part !== 'body' && sel.part !== 'prop' ? turn(5) : nudge(-0.1, 0), ArrowRight: () => sel && sel.part !== 'body' && sel.part !== 'prop' ? turn(-5) : nudge(0.1, 0), ArrowUp: () => nudge(0, 0.1), ArrowDown: () => nudge(0, -0.1),
      '[': () => cyclePart(-1), ']': () => cyclePart(1), '+': () => onCam(0, 0, 1.15), '=': () => onCam(0, 0, 1.15), '-': () => onCam(0, 0, 1 / 1.15) };
    if (!sel) { m.ArrowLeft = () => onCam(-0.25, 0, 1); m.ArrowRight = () => onCam(0.25, 0, 1); m.ArrowUp = () => onCam(0, 0.25, 1); m.ArrowDown = () => onCam(0, -0.25, 1); }   // nothing picked: the arrows move the camera
    if (m[e.key]) { e.preventDefault(); e.stopPropagation(); m[e.key](); }
  };
  /** Pick somebody up, or put them down, without moving them: where they are now becomes a place on the one holding. */
  const holdBy = (who: string, on: string) => edit((k, n) => {
    const f = fig(k, who); if (!f) return; const b = build(n, k, cast);
    const abs = { x: f.x, y: f.y, z: f.z };
    if (f.on) { const [hw, an] = f.on.split(':'), q = b.rigs[hw] && b.rigs[hw].anchors[an], hf = k.figs[hw]; if (q) { abs.x = q[0] + f.x; abs.y = q[1] + f.y; } abs.z = (hf ? hf.z : 0) + f.z; }
    delete f.on; f.x = abs.x; f.y = abs.y; f.z = abs.z;
    if (!on) { f.x = Math.round(f.x * 100) / 100; f.y = Math.round(f.y * 100) / 100; return; }
    const [hw, a] = on.split(':'), hr = b.rigs[hw], q = hr && hr.anchors[a], hf = k.figs[hw]; if (!q || !hf) return;
    f.on = on; f.x = Math.round((abs.x - q[0]) * 100) / 100; f.y = Math.round((abs.y - q[1]) * 100) / 100; f.z = 0.6;
  });
  const parts = ['body', ...JOINTS.map(j => j[0])];
  const cyclePart = (d: number) => { if (!sel || sel.part === 'prop') return; const i = parts.indexOf(sel.part); setSel({ who: sel.who, part: parts[(i + d + parts.length) % parts.length] }); };
  // play: slide through the keyframes once, then come back to the one being edited
  useEffect(() => {
    if (time == null) return; let raf = 0, t0 = performance.now() - time * 1000;
    const step = (now: number) => { let t = (now - t0) / 1000; if (sc.loop && lastT(sc) > 0) t = t % (lastT(sc) + 0.32); else if (t > lastT(sc) + 0.6) { setTime(null); return; } setTime(t); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [time == null]);
  const open = (s: Scene) => { setSc(copy(s)); setKi(0); setSel(null); setTime(null); };
  const save = () => { if (pp.onSave(copy(sc))) say('"' + sc.name + '" is kept in ' + pp.world + '. ' + (sc.still ? 'It shows in games of this world' : 'It plays in games of this world') + ' (' + ((sc.still ? STILL_WHEN : WHEN.concat(SHOW_WHEN)).find(w => w[0] === sc.when) || ['', 'by hand'])[1].toLowerCase() + ').'); else say('That scene could not be kept.', { err: true }); redraw(); };
  const exportIt = () => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(sc, null, 1)], { type: 'application/json' }));
    a.download = (sc.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'scene') + '.scene.json'; document.body.appendChild(a); a.click(); a.remove();
    say('Written out as ' + a.download + '. Anybody can open it in Create a Scene.');
  };
  const importIt = (f: File) => f.text().then(txt => { let x: any = null; try { x = JSON.parse(txt); } catch (e) { /* not JSON */ } if (ok(x)) { open(x); say('Opened "' + x.name + '".'); } else say('That file is not a scene.', { err: true }); redraw(); });
  const addProp = () => edit(k => { const id = addK + '-' + Date.now().toString(36); k.props.push({ id, k: addK, x: 0, y: addK === 'masthead' ? 3.6 : ['burst', 'sign', 'headline'].includes(addK) ? 3 : addK === 'confetti' ? 0 : -1.6, r: 0, z: 2.6, s: 1, txt: ['burst', 'sign', 'headline', 'masthead'].includes(addK) ? words : undefined }); setSel({ who: id, part: 'prop' }); });
  const selFig = sel && fig(key, sel.who), selProp = sel && sel.part === 'prop' ? propOf(key, sel.who) : null;
  const who = (id: string) => { const sl = sc.slots.find(s => s.id === id); return sl ? sl.n : id; };
  const mine = pp.saved;
  const [tab, setTab] = useState(pp.blank ? 'new' : 'pose'), [three, setThree] = useState(false);
  // layers: everything in the keyframe, front first; a hidden layer is left off the stage while editing, a locked one cannot be picked there
  const [hidden, setHidden] = useState<string[]>([]), [locked, setLocked] = useState<string[]>([]);
  // the backdrop being made: the world's own, with the one being edited in place of its saved copy
  const savedBgs = pp.backdrops || [], [bg, setBg] = useState<Backdrop | null>(() => { const s0 = pp.start; return s0 && isBg(s0.set) ? copy((savedBgs.find(b => 'bg_' + b.id === s0.set) || null) as any) : null; });
  const [bgi, setBgi] = useState(-1), [bgAdd, setBgAdd] = useState('banner'), [bgWords, setBgWords] = useState('EWF'), bgRef = useRef(bg); bgRef.current = bg;
  useEffect(() => useBackdropSource(() => { const d = bgRef.current; return savedBgs.filter(b => !d || b.id !== d.id).concat(d ? [d] : []); }), []);
  const allBgs = savedBgs.filter(b => !bg || b.id !== bg.id).concat(bg ? [bg] : []);
  const editBg = (fn: (b: Backdrop) => void) => { if (!bg) return; const n = copy(bg) as Backdrop; fn(n); setBg(n); };
  const bgPart = bg && bg.parts[bgi];
  const vsc: Scene = hidden.length ? { ...sc, keys: sc.keys.map(k => ({ ...k, figs: Object.fromEntries(Object.entries(k.figs).filter(([id]) => hidden.indexOf(id) < 0)), props: k.props.filter(q => hidden.indexOf(q.id) < 0) })) } : sc;
  const pickSel = (s2: Sel) => { if (s2 && locked.indexOf(s2.who) >= 0) return; setSel(s2); };
  const zOf = (k: Key, id: string): number | null => k.figs[id] ? k.figs[id].z : (k.props.find(q => q.id === id) || { z: null } as any).z;
  const setZ = (k: Key, id: string, z: number) => { if (k.figs[id]) k.figs[id].z = z; else { const q = k.props.find(x => x.id === id); if (q) q.z = z; } };
  const layers = Object.keys(key.figs).map(id => ({ id, n: who(id), fig: true, z: key.figs[id].z })).concat(key.props.map(q => ({ id: q.id, n: (PROPS.find(x => x[0] === q.k) || ['', q.k])[1] + (q.txt ? ': ' + q.txt : ''), fig: false, z: q.z }))).sort((a, b) => b.z - a.z);
  /** Bring one layer in front of the one ahead of it (or behind the one after), in every keyframe both are in. */
  const restack = (i: number, d: -1 | 1) => { const a = layers[i], b = layers[i + d]; if (!a || !b) return; const n = copy(sc);
    n.keys.forEach(k => { const za = zOf(k, a.id), zb = zOf(k, b.id); if (za == null || zb == null) return; setZ(k, a.id, za === zb ? zb - d * 0.05 : zb); setZ(k, b.id, za === zb ? za : za); }); setSc(n); };
  const flip = (l: string[], set: (v: string[]) => void, id: string) => set(l.indexOf(id) >= 0 ? l.filter(x => x !== id) : l.concat([id]));
  // the camera of the keyframe being edited: pan, zoom (1 is the whole set, up to 4), tilt
  const cam = key.cam || CAM0;
  const onCam = (dx: number, dy: number, zoom: number) => edit(k => { const c = { ...CAM0, ...(k.cam || {}) }; c.z = Math.max(0.8, Math.min(4, Math.round(c.z * zoom * 100) / 100)); c.x = Math.round((c.x + dx) * 100) / 100; c.y = Math.round((c.y + dy) * 100) / 100;
    const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v)); c.x = lim(c.x, Math.max(0, 8 - 8 / c.z)); c.y = lim(c.y, Math.max(0.6, 4.5 - 4.5 / c.z)); k.cam = c.z === 1 && !c.r ? undefined : c; });
  const tiltBy = (d: number) => edit(k => { const c = { ...CAM0, ...(k.cam || {}) }; c.r = Math.max(-20, Math.min(20, (c.r || 0) + d)); k.cam = c; });
  /** Take a picture: the keyframe through its camera, drawn large, saved as a PNG. */
  const snap = () => {
    const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const ctx = c.getContext('2d'); if (!ctx) return;
    const one: Scene = { ...sc, keys: [key] }; paint(ctx, one, 0, cast);
    c.toBlob(b => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = (sc.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'scene') + '-' + (ki + 1) + '.png'; document.body.appendChild(a); a.click(); a.remove(); say('Picture taken: ' + a.download); }, 'image/png');
  };
  const slotRole = (id: string) => (sc.slots.find(x => x.id === id) || { role: 'a' }).role;
  const figR = sel && key.figs[sel.who] ? (cast[sel.who] || (slotRole(sel.who) === 'ref' ? REF : blank(Math.max(0, sc.slots.findIndex(x => x.id === sel.who))))) : null;
  const partName = sel ? (sel.part === 'body' ? 'The whole body' : sel.part === 'prop' ? 'The prop' : (JOINTS.find(j => j[0] === sel.part) || ['', sel.part])[1]) : '';
  const angle = selFig && sel ? (sel.part === 'body' ? selFig.r : Math.round(selFig.p[sel.part] ?? STAND[sel.part] ?? 0)) : selProp ? selProp.r : 0;
  return <div class="scfull paper" data-t="scene">
    <div class="sc-menubar" role="group" aria-label="Create a Scene">
      <b class="on">Create a Scene</b><span>{pp.world}</span><span class="sp" />
      <span class={'sc-hint' + (msg ? (msg.err ? ' bad' : ' good') : '')} role="status" data-t="scene-msg">{msg ? msg.t : 'Press a person or a pin, then drag, use the buttons, or the arrow keys'}</span>
      <Btn kind="go" t="scene-done" onClick={pp.onDone}>Done</Btn>
    </div>
    <Desktop cls="scpage">
    <Win title={'Create a Scene: ' + sc.name} right={sc.keys.length + (sc.keys.length === 1 ? ' keyframe' : ' keyframes')} area="stage" t="scene-win">
      {three ? <Stage3D sc={vsc} ki={Math.min(ki, sc.keys.length - 1)} time={time} cast={cast} sel={sel} onSel={pickSel} onDrag={onDrag} onKey={onKey} /> : <Stage sc={vsc} ki={Math.min(ki, sc.keys.length - 1)} time={time} cast={cast} sel={sel} onSel={pickSel} onDrag={onDrag} onCam={onCam} onKey={onKey} />}
      {sc.still ? <div class="sc-keys" role="group" aria-label="Keyframes" data-t="scene-stillnote"><span class="sc-gap">A still picture: one picture, nothing plays. It goes beside a moment the booker answers.</span></div>
      : <div class="sc-keys" role="group" aria-label="Keyframes">
        {sc.keys.map((k, i) => <Btn key={'k' + i} kind="sm" t="scene-key" d={{ v: i }} on={i === ki && time == null} onClick={() => { setKi(i); setTime(null); }}>{'Key ' + (i + 1)}</Btn>)}
        <Btn kind="sm" t="scene-addkey" onClick={() => { const n = copy(sc), k = copy(n.keys[ki]); k.t = Math.round((lastT(n) + 0.8) * 10) / 10; n.keys.push(k); setSc(n); setKi(n.keys.length - 1); }}>+ Key</Btn>
        <Btn kind="danger" t="scene-dropkey" disabled={sc.keys.length < 2} onClick={() => { const n = copy(sc); n.keys.splice(ki, 1); n.keys.forEach((k, i) => { if (i === 0) k.t = 0; }); setSc(n); setKi(Math.max(0, ki - 1)); }}>Delete key</Btn>
        <span class="sc-gap">{ki > 0 ? <>Arrives after <Btn kind="less" t="scene-faster" onClick={() => edit((k, s) => { const gap = k.t - s.keys[ki - 1].t; if (gap <= 0.2) return; for (let i = ki; i < s.keys.length; i++) s.keys[i].t = Math.round((s.keys[i].t - 0.1) * 10) / 10; })}>-</Btn><b>{(key.t - sc.keys[ki - 1].t).toFixed(1)}s</b><Btn kind="less" t="scene-slower" onClick={() => edit((k, s) => { for (let i = ki; i < s.keys.length; i++) s.keys[i].t = Math.round((s.keys[i].t + 0.1) * 10) / 10; })}>+</Btn></> : 'The first picture'}</span>
        {ki > 0 && <select aria-label="How it moves into this key" data-t="scene-ease" value={key.ease || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value as any; edit(k => { if (v) k.ease = v; else delete k.ease; }); }}>{EASES.map(x => <option value={x[0]}>{x[1]}</option>)}</select>}
        <Btn kind="go" t="scene-play" onClick={() => setTime(time == null ? 0 : null)}>{time == null ? 'Play' : 'Stop'}</Btn>
      </div>}
      <div class="sc-keys sc-cam" role="group" aria-label="The camera">
        <span class="sc-lbl">Camera</span>
        <Btn kind="less" t="scene-zoom" d={{ v: 'out' }} disabled={cam.z <= 0.8} onClick={() => onCam(0, 0, 1 / 1.25)}>Zoom out</Btn>
        <b data-t="scene-zoomv">{Math.round(cam.z * 100) + '%'}</b>
        <Btn kind="less" t="scene-zoom" d={{ v: 'in' }} disabled={cam.z >= 4} onClick={() => onCam(0, 0, 1.25)}>Zoom in</Btn>
        <Btn kind="less" t="scene-pan" d={{ v: 'l' }} onClick={() => onCam(-0.5, 0, 1)}>Pan left</Btn><Btn kind="less" t="scene-pan" d={{ v: 'r' }} onClick={() => onCam(0.5, 0, 1)}>Right</Btn>
          <Btn kind="less" t="scene-pan" d={{ v: 'u' }} onClick={() => onCam(0, 0.5, 1)}>Up</Btn><Btn kind="less" t="scene-pan" d={{ v: 'd' }} onClick={() => onCam(0, -0.5, 1)}>Down</Btn>
          <Btn kind="less" t="scene-tilt" d={{ v: 5 }} onClick={() => tiltBy(5)}>Tilt +5</Btn><Btn kind="less" t="scene-tilt" d={{ v: -5 }} onClick={() => tiltBy(-5)}>Tilt -5</Btn>
        <Btn kind="less" t="scene-camreset" disabled={!key.cam} onClick={() => edit(k => { k.cam = undefined; })}>Whole set</Btn>
        <span class="sp" />
        <Btn kind={three ? 'go' : 'sm'} t="scene-3d" on={three} onClick={() => setThree(!three)}>{three ? '3D: on' : '3D'}</Btn>
        <Btn kind="sm" t="scene-snap" onClick={snap}>Take picture</Btn>
      </div>
    </Win>
    <Win title={tab === 'pose' ? 'Pose' : tab === 'face' ? 'Face and marks' : tab === 'cast' ? 'Cast and props' : tab === 'new' ? 'A new scene' : tab === 'layers' ? 'Layers' : tab === 'bg' ? 'Backdrop' : 'The scene'} right={sel && (tab === 'pose' || tab === 'face') ? (sel.part === 'prop' ? 'a prop' : who(sel.who)) : ''} area="side" t="scene-side">
      <Tabs label="What to change" value={tab} onPick={setTab} items={[{ id: 'pose', label: 'Pose', t: 'scene-tab' }, { id: 'face', label: 'Face and marks', t: 'scene-tab' }, { id: 'cast', label: 'Cast and props', t: 'scene-tab' }, { id: 'layers', label: 'Layers', t: 'scene-tab' }, { id: 'bg', label: 'Backdrop', t: 'scene-tab' }, { id: 'file', label: 'The scene', t: 'scene-tab' }, { id: 'new', label: 'New', t: 'scene-tab' }]} />
      {tab === 'bg' && <>
        {!(bg && isBg(sc.set)) ? <Group title="A backdrop of your own">
          <p class="sc-gap">Build the wall behind this scene: a colour for the wall and the floor, then banners, signs, windows, curtains, a skyline.</p>
          <div class="sc-row"><Btn kind="go" t="scene-bgnew" onClick={() => { const b = newBackdrop(); setBg(b); setBgi(-1); setSc({ ...sc, set: 'bg_' + b.id }); say('A new backdrop. Add parts to it, then Keep the backdrop.'); }}>A new backdrop</Btn>
            {savedBgs.map(b => <Btn kind="less" t="scene-bguse" d={{ v: b.id }} onClick={() => { setBg(copy(b) as any); setBgi(-1); setSc({ ...sc, set: 'bg_' + b.id }); }}>{b.name}</Btn>)}</div>
        </Group> : <>
          <Group title="The backdrop">
            <div class="sc-row"><TextBox value={bg.name} max={40} label="Name of the backdrop" t="scene-bgname" onInput={v => editBg(b => { b.name = v; })} width="16ch" /></div>
            <div class="sc-row"><span class="sc-slot">Wall</span><select aria-label="Wall colour" data-t="scene-bgwall" value={bg.wall} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; editBg(b => { b.wall = v; }); }}>{BG_COLS.map(c => <option value={c[0]}>{c[1]}</option>)}</select>
              <span class="sc-slot">Floor</span><select aria-label="Floor colour" data-t="scene-bgfloor" value={bg.floor} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; editBg(b => { b.floor = v; }); }}>{BG_COLS.map(c => <option value={c[0]}>{c[1]}</option>)}</select></div>
            <div class="sc-row"><select aria-label="Part to add" data-t="scene-bgkind" value={bgAdd} onChange={e => setBgAdd((e.currentTarget as HTMLSelectElement).value)}>{BG_PARTS.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
              {(BG_PARTS.find(x => x[0] === bgAdd) || [])[4] && <TextBox value={bgWords} max={24} label="Words on it" t="scene-bgwords" onInput={v => setBgWords(v.toUpperCase())} width="9ch" />}
              <Btn t="scene-bgadd" disabled={bg.parts.length >= 40} onClick={() => { editBg(b => { b.parts.push(newPart(bgAdd, bgWords)); }); setBgi(bg.parts.length); }}>Add</Btn></div>
            <div class="sc-row">{bg.parts.map((q, i) => <Btn kind="less" t="scene-bgpart" d={{ v: i }} on={i === bgi} onClick={() => setBgi(i)}>{(BG_PARTS.find(x => x[0] === q.k) || ['', q.k])[1] + (q.txt ? ': ' + q.txt : '')}</Btn>)}</div>
          </Group>
          {bgPart && <Group title="The part picked">
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
      {tab === 'layers' && <Group title="Front to back">
        <div class="sc-layers" data-t="scene-layers">
          {layers.map((l, i) => { const hid = hidden.indexOf(l.id) >= 0, lk = locked.indexOf(l.id) >= 0; return <div class={'sc-lrow' + (sel && sel.who === l.id ? ' on' : '')} key={l.id}>
            <Btn kind="less" cls="sc-lname" t="scene-lpick" d={{ v: l.id }} on={!!sel && sel.who === l.id} disabled={hid || lk} label={'Pick ' + l.n} onClick={() => setSel({ who: l.id, part: l.fig ? 'body' : 'prop' })}>{(l.fig ? '' : 'Prop: ') + l.n}</Btn>
            <Btn kind="sm" t="scene-lfwd" d={{ v: l.id }} disabled={i === 0} label={'Bring ' + l.n + ' forward'} onClick={() => restack(i, -1)}>Forward</Btn>
            <Btn kind="sm" t="scene-lback" d={{ v: l.id }} disabled={i === layers.length - 1} label={'Send ' + l.n + ' back'} onClick={() => restack(i, 1)}>Back</Btn>
            <Btn kind="less" t="scene-lhide" d={{ v: l.id }} on={hid} onClick={() => { flip(hidden, setHidden, l.id); if (sel && sel.who === l.id) setSel(null); }}>{hid ? 'Show' : 'Hide'}</Btn>
            <Btn kind="less" t="scene-llock" d={{ v: l.id }} on={lk} onClick={() => { flip(locked, setLocked, l.id); if (sel && sel.who === l.id) setSel(null); }}>{lk ? 'Unlock' : 'Lock'}</Btn>
          </div>; })}
          <div class="sc-lrow sc-lset"><span>{'The set: ' + ((SETS.find(x => x[0] === sc.set) || ['', sc.set])[1])}</span><span class="sp" /><span class="sc-gap">always at the back</span></div>
        </div>
        <p class="sc-gap">Hidden and locked layers are only for editing: the scene still plays with everything in it.</p>
      </Group>}
      {tab === 'new' && <Group title="Start a new scene from">
        <div class="sc-setups">{SETUPS.map(([id, n]) => <Btn kind="less" t="scene-setup" d={{ v: id }} onClick={() => { open(setupScene(id)); setTab('pose'); say('A new scene: ' + n.toLowerCase() + '. Pose them, add props and keyframes.'); }}>{n}</Btn>)}</div>
        <p class="muted">Each puts the people where that set wants them. Anything can be moved after.</p>
      </Group>}
      {tab === 'pose' && <>
        <div class="sc-row">
          <select aria-label="Who or what" data-t="scene-who" value={sel ? sel.who : ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setSel(v ? { who: v, part: key.figs[v] ? 'body' : 'prop' } : null); }}>
            <option value="">Pick somebody</option>
            {sc.slots.filter(x => key.figs[x.id]).map(x => <option value={x.id}>{x.n + (cast[x.id] ? ': ' + cast[x.id].name : '')}</option>)}
            {key.props.map(q => <option value={q.id}>{(PROPS.find(x => x[0] === q.k) || ['', q.k])[1] + (q.txt ? ': ' + q.txt : '')}</option>)}
          </select>
        </div>
        {figR && sel && selFig && <div class="sc-row">
          <select aria-label="Start from a pose" data-t="scene-poselib" value="" onChange={e => { const d = POSES.find(x => x[0] === (e.currentTarget as HTMLSelectElement).value); if (d) edit(k => { const f = fig(k, sel.who); if (f) { f.p = { ...d[1].p }; f.r = d[1].r || 0; f.y = d[1].y ?? WAIST; if (d[1].e != null) f.e = d[1].e; } }); }}>
            <option value="">Start from a pose...</option>{POSES.map(x => <option value={x[0]}>{x[1].n}</option>)}
          </select>
          <span class="sc-lbl">Size</span>
          <Btn kind="less" t="scene-size" d={{ v: '-' }} disabled={(selFig.s || 1) <= 0.75} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) f.s = Math.round(((f.s || 1) - 0.05) * 100) / 100; })}>-</Btn>
          <b data-t="scene-sizev">{Math.round((selFig.s || 1) * 100) + '%'}</b>
          <Btn kind="less" t="scene-size" d={{ v: '+' }} disabled={(selFig.s || 1) >= 1.25} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) f.s = Math.round(((f.s || 1) + 0.05) * 100) / 100; })}>+</Btn>
        </div>}
        {figR && sel && <div class="sc-row"><Btn kind="less" t="scene-pin" d={{ v: 'body' }} on={sel.part === 'body'} onClick={() => setSel({ who: sel.who, part: 'body' })}>The whole body</Btn><span class="muted">or a pin to pick a part</span></div>}
        {figR && sel && <DollMap r={figR} part={sel.part} onPart={j => setSel({ who: sel.who, part: j })} />}
        {selProp && <div class="sc-row">
          {(['burst', 'sign', 'headline', 'masthead'].includes(selProp.k)) && <TextBox value={selProp.txt || ''} max={16} label="Words" t="scene-words" onInput={v => edit(k => { const q = propOf(k, sel!.who); if (q) q.txt = v.toUpperCase(); })} width="12ch" />}
          <Btn kind="sm" t="scene-bigger" onClick={() => edit(k => { const q = propOf(k, sel!.who); if (q) q.s = Math.min(3, Math.round(((q.s || 1) + 0.1) * 10) / 10); })}>Bigger</Btn>
          <Btn kind="sm" t="scene-smaller" onClick={() => edit(k => { const q = propOf(k, sel!.who); if (q) q.s = Math.max(0.3, Math.round(((q.s || 1) - 0.1) * 10) / 10); })}>Smaller</Btn>
          <Btn kind="danger" t="scene-dropprop" onClick={() => { edit(k => { k.props = k.props.filter(x => x.id !== sel!.who); }); setSel(null); }}>Remove</Btn>
        </div>}
        {sel && <p class="sc-ang"><b>{partName}</b>{sel.part === 'body' ? ' leans ' : ' at '}<b data-t="scene-angle">{angle}</b> degrees</p>}
        <div class="sc-row" role="group" aria-label={sel && sel.part === 'body' ? 'Lean' : 'Turn'}>
          <Btn kind="sm" t="scene-turn" d={{ v: 15 }} disabled={!sel} onClick={() => turn(15)}>{'+15'}</Btn><Btn kind="sm" t="scene-turn" d={{ v: 5 }} disabled={!sel} onClick={() => turn(5)}>{'+5'}</Btn>
          <Btn kind="sm" t="scene-turn" d={{ v: -5 }} disabled={!sel} onClick={() => turn(-5)}>{'-5'}</Btn><Btn kind="sm" t="scene-turn" d={{ v: -15 }} disabled={!sel} onClick={() => turn(-15)}>{'-15'}</Btn>
        </div>
        <div class="sc-row" role="group" aria-label="Move">
          <Btn kind="less" t="scene-move" d={{ v: 'l' }} disabled={!sel} onClick={() => nudge(-0.25, 0)}>Left</Btn><Btn kind="less" t="scene-move" d={{ v: 'r' }} disabled={!sel} onClick={() => nudge(0.25, 0)}>Right</Btn>
          <Btn kind="less" t="scene-move" d={{ v: 'u' }} disabled={!sel} onClick={() => nudge(0, 0.25)}>Up</Btn><Btn kind="less" t="scene-move" d={{ v: 'd' }} disabled={!sel} onClick={() => nudge(0, -0.25)}>Down</Btn>
        </div>
        {selFig && <div class="sc-row">
          <Btn kind="less" t="scene-face" onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) f.f = -f.f; })}>Face the other way</Btn>
          <Btn kind="less" t="scene-back" on={!!(fig(sc.keys[ki], sel!.who) || {} as any).b} onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) { if (f.b) delete f.b; else f.b = true; } })}>Show their back</Btn>
          <Btn kind="less" t="scene-front" onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) f.z = Math.round((f.z + 0.6) * 10) / 10; })}>Front</Btn>
          <Btn kind="less" t="scene-back" onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) f.z = Math.round((f.z - 0.6) * 10) / 10; })}>Back</Btn>
          <Btn kind="less" t="scene-stand" onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) { f.p = {}; f.r = 0; f.y = WAIST; } })}>Stand</Btn>
          <Btn kind="less" t="scene-lie" onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) { f.r = 90; f.y = f.on ? 0 : -2.15; } })}>Lie down</Btn>
        </div>}
        {selFig && sel && <div class="sc-row">
          <span class="sc-lbl">Held by</span>
          <select aria-label="Held by" data-t="scene-heldby" value={selFig.on || ''} onChange={e => holdBy(sel.who, (e.currentTarget as HTMLSelectElement).value)}>
            <option value="">Nobody: on their own feet</option>
            {sc.slots.filter(x => x.id !== sel.who && key.figs[x.id] && !(key.figs[x.id].on || '').startsWith(sel.who + ':')).map(x => HOLDS.map(([a, n]) => <option value={x.id + ':' + a}>{x.n + "'s " + n}</option>))}
          </select>
        </div>}
        {selFig && sel && LIMBS[sel.part] && <div class="sc-row" role="group" aria-label="This limb">
          <span class="sc-lbl">This {LIMBS[sel.part].startsWith('arm') ? 'arm' : 'leg'}</span>
          {([[3, 'In front of everyone'], [0, 'Where it was cut'], [-3, 'Behind']] as [number, string][]).map(([v, n]) =>
            <Btn kind="less" t="scene-limb" d={{ v }} on={((selFig.lz || {})[LIMBS[sel.part]] || 0) === v} onClick={() => edit(k => { const f = fig(k, sel.who); if (f) { const lz = { ...(f.lz || {}) }; if (v) lz[LIMBS[sel.part]] = v; else delete lz[LIMBS[sel.part]]; f.lz = lz; } })}>{n}</Btn>)}
        </div>}
      </>}
      {tab === 'face' && (selFig ? <>
        <span hidden data-t="scene-fig" data-v={JSON.stringify(selFig)} />
        <Group title="The face">
          <div class="sc-row">{EXPR.map(x => <Btn kind="less" t="scene-expr" d={{ v: x[0] || 'calm' }} on={(selFig.e || '') === x[0]} onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) f.e = x[0]; })}>{x[1]}</Btn>)}</div>
        </Group>
        <Group title="Marks">
          <div class="sc-row"><span class="sc-lbl">Blood</span>{[[0, 'None'], [1, 'A cut'], [2, 'A trickle'], [3, 'The face covered']].map(([v, n]) =>
            <Btn kind="less" t="scene-blood" d={{ v: v as number }} on={((selFig.m && selFig.m.blood) || 0) === v} onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) f.m = { ...(f.m || {}), blood: v as number }; })}>{n as string}</Btn>)}</div>
          <div class="sc-row">{([['sweat', 'Sweat'], ['tears', 'Tears'], ['bruise', 'A bruise']] as [keyof Marks, string][]).map(([m, n]) =>
            <Btn kind="less" t="scene-mark" d={{ v: m }} on={!!(selFig.m && selFig.m[m])} onClick={() => edit(k => { const f = fig(k, sel!.who); if (f) f.m = { ...(f.m || {}), [m]: !(f.m && f.m[m]) }; })}>{n}</Btn>)}</div>
        </Group>
        <p class="muted">Faces and marks belong to this keyframe, so a scene can show the blood come or the tears start.</p>
      </> : <p class="empty">Pick a person on the stage, or from the list on the Pose tab.</p>)}
      {tab === 'cast' && <>
        <Group title="Who plays it: the part in the story, and who stands in for it here">
          {sc.slots.filter(x => x.role !== 'ref').map(x => <div class="sc-row"><span class="sc-slot">{x.n}</span>
            {key.figs[x.id] ? (x.at && <Btn kind="less" t="scene-sendaway" d={{ v: x.id }} onClick={() => { const n = copy(sc); n.keys.forEach(k => { delete k.figs[x.id]; }); setSc(n); if (sel && sel.who === x.id) setSel(null); }}>Send away</Btn>)
              : <Btn kind="sm" t="scene-bringin" d={{ v: x.id }} onClick={() => { const n = copy(sc); n.keys.forEach(k => { k.figs[x.id] = copy(x.at || { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} }); }); setSc(n); setSel({ who: x.id, part: 'body' }); }}>Bring in</Btn>}
            <select aria-label={'The part ' + x.n + ' plays in the story'} data-t="scene-hook" data-v={x.id} value={x.hook || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value, n = copy(sc), sl = n.slots.find(y => y.id === x.id)!; if (v) { sl.hook = v; sl.n = (HOOKS.find(h => h[0] === v) || ['', sl.n])[1]; } else delete sl.hook; setSc(n); }}>
              {HOOKS.map(h => <option value={h[0]}>{h[1]}</option>)}
            </select>
            <select aria-label={'Who plays ' + x.n} data-t="scene-cast" data-v={x.id} value={String(castIds[x.id] ?? -1)} onChange={e => setCast({ ...castIds, [x.id]: +(e.currentTarget as HTMLSelectElement).value })}>
              <option value="-1">A plain card figure</option>{roster.map(w => <option value={String(w.id)}>{w.name}</option>)}
            </select></div>)}
          <Btn kind="sm" t="scene-addperson" disabled={sc.slots.length >= 6} onClick={() => { const n = copy(sc), id = 'P' + n.slots.length; n.slots.push({ id, n: 'Wrestler ' + String.fromCharCode(65 + n.slots.filter(x => x.role !== 'ref').length), role: 'c' }); n.keys.forEach(k => { k.figs[id] = { x: 0, y: WAIST, r: 0, f: 1, z: 0.6, p: {} }; }); setSc(n); setSel({ who: id, part: 'body' }); setTab('pose'); }}>Add a person</Btn>
        </Group>
        <Group title="Add a prop">
          <div class="sc-row"><select aria-label="Prop" data-t="scene-propkind" value={addK} onChange={e => setAddK((e.currentTarget as HTMLSelectElement).value)}>{PROPS.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
            {(['burst', 'sign', 'headline', 'masthead'].includes(addK)) && <TextBox value={words} max={16} label="Words on it" t="scene-newwords" onInput={v => setWords(v.toUpperCase())} width="10ch" />}
            <Btn t="scene-addprop" onClick={() => { addProp(); setTab('pose'); }}>Add</Btn></div>
        </Group>
      </>}
      {tab === 'file' && <>
        <Group title="The scene">
          <div class="sc-row"><TextBox value={sc.name} max={32} label="Name of the scene" t="scene-name" onInput={v => setSc({ ...sc, name: v })} width="18ch" /></div>
          <div class="sc-row"><span class="sc-slot">Kind</span><select aria-label="Kind of scene" data-t="scene-kind" value={sc.still ? 'still' : 'moving'} onChange={e => { const still = (e.currentTarget as HTMLSelectElement).value === 'still'; const n = copy(sc); if (still) { n.still = true; n.keys = [n.keys[Math.min(ki, n.keys.length - 1)]]; n.keys[0].t = 0; n.loop = false; if (!STILL_WHEN.some(w => w[0] === n.when)) n.when = 'any'; } else { delete n.still; if (!WHEN.concat(SHOW_WHEN).some(w => w[0] === n.when)) n.when = 'any'; } setSc(n); setKi(0); setTime(null); }}><option value="moving">Moving: keyframes that play</option><option value="still">A still picture</option></select></div>
          <div class="sc-row"><span class="sc-slot">{sc.still ? 'Shown at' : 'Plays at'}</span><select aria-label="When it plays" data-t="scene-when" value={sc.when} onChange={e => setSc({ ...sc, when: (e.currentTarget as HTMLSelectElement).value })}>{(sc.still ? STILL_WHEN : WHEN.concat(SHOW_WHEN)).map(w => <option value={w[0]}>{w[1]}</option>)}</select></div>
          <div class="sc-row"><span class="sc-slot">Shape</span><select aria-label="Shape of the picture" data-t="scene-frame" value={sc.frame || 'wide'} onChange={e => { const f = (e.currentTarget as HTMLSelectElement).value as any; const n = { ...sc }; if (f === 'wide') delete n.frame; else n.frame = f; setSc(n); }}>{FRAMES.map(x => <option value={x[0]}>{x[1]}</option>)}</select></div>
          <div class="sc-row"><span class="sc-slot">Look</span><span class="sc-fx">{SCENE_FX.map(([k, n]) => { const on = !!(sc.fx && sc.fx[k]); return <Btn key={k} t="scene-fx" d={{ v: k }} kind={on ? 'go' : 'less'} on={on} onClick={() => { const f = { ...(sc.fx || {}) }; if (on) delete f[k]; else f[k] = true; const n2 = { ...sc }; if (Object.keys(f).length) n2.fx = f; else delete n2.fx; setSc(n2); }}>{n}</Btn>; })}</span></div>
          <div class="sc-row"><span class="sc-slot">The set</span><select aria-label="The set" data-t="scene-set" value={sc.set} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; if (isBg(v)) { const b = allBgs.find(x => 'bg_' + x.id === v); if (b) { setBg(copy(b) as any); setBgi(-1); } } setSc({ ...sc, set: v }); }}>{SETS.map(x => <option value={x[0]}>{x[1]}</option>)}{allBgs.map(b => <option value={'bg_' + b.id}>{'Backdrop: ' + b.name}</option>)}</select></div>
        </Group>
        <Group title="Files">
          <div class="sc-row">
            <select aria-label="Open a scene" data-t="scene-open" value="" onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; if (v === '__new') { setTab('new'); return; } else { const x = allScenes(mine).find(y => y.id === v); if (x) open(x); } }}>
              <option value="">Open...</option><option value="__new">A new, empty scene</option>
              {mine.map(x => <option value={x.id}>{'This world: ' + x.name}</option>)}{SCENES.filter(x => !mine.some(m => m.id === x.id)).map(x => <option value={x.id}>{'The game: ' + x.name}</option>)}{STILLS.filter(x => !mine.some(m => m.id === x.id)).map(x => <option value={x.id}>{'A still: ' + x.name}</option>)}{SHOW_SCENES.filter(x => !mine.some(m => m.id === x.id)).map(x => <option value={x.id}>{'The show: ' + x.name}</option>)}
            </select>
          </div>
          <div class="sc-row">
            <Btn t="scene-save" onClick={save}>Save</Btn>
            <Btn kind="sm" t="scene-export" onClick={exportIt}>Write a file</Btn>
            <Btn kind="sm" t="scene-import" onClick={() => file.current && file.current.click()}>Open a file</Btn>
            {mine.some(x => x.id === sc.id) && <Btn kind="danger" t="scene-delete" onClick={() => { pp.onForget(sc.id); say('"' + sc.name + '" is no longer in ' + pp.world + '.'); redraw(); }}>Take it out</Btn>}
            <input ref={file} type="file" accept=".json,application/json" hidden data-t="scene-file" onChange={e => { const f = (e.currentTarget as HTMLInputElement).files; if (f && f[0]) importIt(f[0]); (e.currentTarget as HTMLInputElement).value = ''; }} />
          </div>
        </Group>
      </>}
    </Win>
  </Desktop></div>;
}
