/* A scene playing on the broadcast (Create a Scene; docs/plans/papercraft-engine.md, section 5). It fills its box
   at 16 by 9, plays the scene once from its first keyframe, and stays on the last. `play` restarts it when the moment
   changes. With Reduce motion it shows the last keyframe straight away. */
import { useEffect, useRef, useState } from 'preact/hooks';
import { Scene, paint, lastT } from './scene';
import { Recipe } from './puppet';

let plays = 0;
/** How many scenes have started on the broadcast since the page loaded (EWF_DEBUG.scenes). */
export function scenePlays() { return plays; }

export function ScenePlayer(p: { sc: Scene; cast: Record<string, Recipe>; play: string; still?: boolean; t?: string; label: string }) {
  const box = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null), [size, setSize] = useState([0, 0]);
  const props = useRef(p); props.current = p;
  useEffect(() => {
    const b = box.current; if (!b) return;
    const fit = () => { const r = b.getBoundingClientRect(), w = Math.max(0, Math.floor(Math.min(r.width, r.height * 16 / 9))); setSize([w, Math.round(w * 9 / 16)]); };
    fit(); const ro = new ResizeObserver(fit); ro.observe(b); return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const c = cv.current; if (!c || !size[0]) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1); c.width = Math.round(size[0] * dpr); c.height = Math.round(size[1] * dpr);
    const ctx = c.getContext('2d'); if (!ctx) return;
    const sc = props.current.sc, end = lastT(sc);
    plays++;
    if (props.current.still || end <= 0) { paint(ctx, sc, end, props.current.cast); return; }
    let raf = 0; const t0 = performance.now(), keepFor = end + 4;   // confetti keeps falling a while after the last keyframe
    const step = (now: number) => { const t = (now - t0) / 1000; try { paint(ctx, sc, t, props.current.cast); } catch (e) { return; } if (t < keepFor) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [p.play, size[0], size[1]]);
  return <div ref={box} class="lv-scene" data-t={p.t || 'live-scene'} data-v={p.sc.id} role="img" aria-label={p.label}>
    <canvas ref={cv} style={{ width: size[0] + 'px', height: size[1] + 'px' }} />
  </div>;
}
