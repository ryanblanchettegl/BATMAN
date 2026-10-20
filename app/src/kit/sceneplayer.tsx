/* A scene playing on the broadcast (Create a Scene; docs/plans/papercraft-engine.md, section 5). It fills its box
   at 16 by 9 and plays the scene once from its first keyframe and stays on the last, or loops (the desk while a line
   is on). `play` restarts it when the moment changes. It is drawn in 3D (src/kit/diorama3d.ts), the game's look on
   Steam; where the machine cannot draw 3D it falls back to the flat paper renderer. With Reduce motion it shows the
   last keyframe straight away. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { Scene, Caption, paint, lastT, at, fxClass, aspectOf, fitIn, captionAt } from './scene';
import { Recipe } from './puppet';
import { Diorama3D } from './diorama3d';

/* Still pictures (a matter on the desk, a call on the air, a line on the run sheet, a poster) share one 3D renderer: each
   is drawn there and copied onto its own canvas, so a page full of pictures never runs out of WebGL and falls back to
   the old flat drawing (Ryan, 20 October: every scene in 3D). A picture you can turn, or one that moves, keeps its own. */
let SHARED: { eng: Diorama3D; cv: HTMLCanvasElement } | null | false = null;
function shared(): { eng: Diorama3D; cv: HTMLCanvasElement } | null {
  if (SHARED === null) { try { const cv = document.createElement('canvas'); SHARED = { eng: new Diorama3D(cv, false), cv }; } catch (e) { SHARED = false; } }
  return SHARED || null;
}
let plays = 0;
/** How many scenes have started on the broadcast since the page loaded (EWF_DEBUG.scenes). */
export function scenePlays() { return plays; }

export function ScenePlayer(p: { sc: Scene; cast: Record<string, Recipe>; play: string; still?: boolean; t?: string; label: string; orbit?: boolean; fill?: boolean; /** Change it to draw the picture again (after a pop-up over it closes). */ redraw?: number }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), c3 = useRef<HTMLCanvasElement>(null), eng = useRef<Diorama3D | null>(null);
  const [size, setSize] = useState([0, 0]), [flat, setFlat] = useState(false), [cap, setCap] = useState<Caption | null>(null);
  const props = useRef(p); props.current = p; const solo = !!p.still && !p.orbit;
  useEffect(() => {
    const b = box.current; if (!b) return;
    const fit = () => { const r = b.getBoundingClientRect(); if (props.current.fill) { setSize([Math.floor(r.width), Math.floor(r.height)]); return; } setSize(fitIn(r.width, r.height, aspectOf(props.current.sc))); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b);
    if (solo) { if (!shared()) setFlat(true); }
    else if (c3.current) { try { eng.current = new Diorama3D(c3.current, !!p.orbit); } catch (e) { eng.current = null; setFlat(true); } }
    return () => { ro.disconnect(); if (eng.current) eng.current.dispose(); eng.current = null; };
  }, []);
  useEffect(() => { const b = box.current; if (b && !p.fill) { const r = b.getBoundingClientRect(); setSize(fitIn(r.width, r.height, aspectOf(p.sc))); } }, [p.sc.frame]);
  useEffect(() => {
    if (!size[0]) return;
    const sc = props.current.sc, end = lastT(sc), E3 = eng.current; plays++;
    const SH = solo && !flat ? shared() : null;
    if (SH) {   // a still: drawn by the shared renderer and copied here
      const c = cv.current; if (!c) return; const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = Math.round(size[0] * dpr); c.height = Math.round(size[1] * dpr);
      const ctx = c.getContext('2d'); if (!ctx) return;
      try { SH.eng.size(size[0], size[1]); SH.eng.show(sc, at(sc, end), props.current.cast, end); SH.eng.now(); ctx.drawImage(SH.cv, 0, 0, c.width, c.height); } catch (e) { paint(ctx, sc, end, props.current.cast); }
      const c0 = captionAt(sc, end); setCap(c0); return;
    }
    if (E3) {   // 3D: build the moment, a little over twelve times a second while it moves
      E3.size(size[0], size[1]);
      const show = (t: number) => { const k = at(sc, t); E3.show(sc, k, props.current.cast, t); const c = captionAt(sc, t); setCap(x => (x && c && x.t === c.t && x.s === c.s) || x === c ? x : c); };
      if (props.current.still || end <= 0) { show(end); return; }
      let raf = 0, last = -1; const t0 = performance.now(), keepFor = end + 0.2;
      const step = (now: number) => { let t = (now - t0) / 1000; if (sc.loop) t = t % (end + 0.3); if (now - last > 80) { last = now; try { show(t); } catch (e) { return; } } if (sc.loop || t < keepFor) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
    }
    const c = cv.current; if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = Math.round(size[0] * dpr); c.height = Math.round(size[1] * dpr);
    const ctx = c.getContext('2d'); if (!ctx) return;
    if (props.current.still || end <= 0) { paint(ctx, sc, end, props.current.cast); return; }
    let raf = 0; const t0 = performance.now(), keepFor = end + 4;   // confetti keeps falling a while after the last keyframe
    const step = (now: number) => { let t = (now - t0) / 1000; if (sc.loop) t = t % (end + 0.32); try { paint(ctx, sc, t, props.current.cast); } catch (e) { return; } if (sc.loop || t < keepFor) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [p.play, size[0], size[1], flat, p.redraw]);
  const fx = fxClass(p.sc);
  return <div ref={box} class={'lv-scene' + fx} data-t={p.t || 'live-scene'} data-v={p.sc.id} data-set={p.sc.set} data-3d={eng.current || (solo && !flat && SHARED) ? 1 : 0} role="img" aria-label={p.label}>
    {solo ? null : <canvas ref={c3} style={{ width: size[0] + 'px', height: size[1] + 'px', display: flat ? 'none' : 'block' }} />}
    {(flat || solo) && <canvas ref={cv} style={{ width: size[0] + 'px', height: size[1] + 'px' }} />}
    {fx && <FxVeil w={size[0]} h={size[1]} />}
    {cap && (!flat || solo) && <CaptionBox cap={cap} w={size[0]} h={size[1]} who={capName(p.sc, p.cast, cap)} />}
  </div>;
}
/** Who a caption names: the person playing that part, or the part's own name. */
export function capName(sc: Scene, cast: Record<string, Recipe>, c: Caption): string { if (!c.who) return ''; const r = cast[c.who]; if (r && r.name) return r.name; const sl = sc.slots.find(x => x.id === c.who); return sl ? sl.n : ''; }
/** The caption on a picture (Ryan, 19 October): a subtitle at the bottom, a lower third that names somebody, a title
    card in the middle, or a line somebody says, written by hand on a slip of paper. Sized from the picture. */
export function CaptionBox(p: { cap: Caption; w: number; h: number; who?: string }) {
  const s = p.cap.s || 'sub', fs = Math.max(11, Math.round(p.w / (s === 'title' ? 22 : 42)));
  return <div class={'sccap sccap-' + s} data-t="scene-caption" data-v={s} style={{ width: p.w + 'px', height: p.h + 'px', fontSize: fs + 'px' }}>
    <span class="cb">{s === 'third' && p.who ? <b>{p.who}</b> : null}{s === 'quote' && p.who ? <b>{p.who}:</b> : null}<span class="ct">{s === 'quote' ? '“' + p.cap.t + '”' : p.cap.t}</span></span>
  </div>;
}

/** The veil over a picture that draws its scan lines and tube (the box it sits in has the fx- classes). */
export function FxVeil(p: { w: number; h: number }) {
  return <span class="scfx" data-t="scene-fx" aria-hidden="true" style={{ width: p.w + 'px', height: p.h + 'px' }} />;
}
