import { useEffect, useRef } from 'preact/hooks';
import { W } from '../engine';
import { draw, derive, norm, Face } from '../lib/portrait';

export function faceOf(w: W): Face { return w.face ? norm(w.face) : derive(w.name, w.g, w.age); }
/** A generated pixel face on a canvas. Redraws only when the face changes. */
export function FaceCanvas(p: { face: Partial<Face>; g?: string; bg?: string; label?: string; id?: string; cls?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), key = JSON.stringify([p.face, p.g, p.bg]);
  useEffect(() => { if (ref.current) { try { draw(ref.current, p.face, { g: p.g, bg: p.bg }); } catch (e) { /* a canvas that cannot draw is not worth a crash */ } } }, [key]);
  return <canvas ref={ref} id={p.id} class={p.cls} width={96} height={96} role="img" aria-label={p.label || 'Portrait'} />;
}
/** A wrestler's portrait. Background colour follows their alignment. */
export function Portrait(p: { w: W; cls?: string }) { const w = p.w; return <FaceCanvas cls={'pt' + (p.cls ? ' ' + p.cls : '')} face={faceOf(w)} g={w.g} bg={w.twn ? 'N' : w.align} label={'Portrait of ' + w.name} />; }
