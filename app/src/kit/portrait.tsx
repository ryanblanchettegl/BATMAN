import { useEffect, useRef } from 'preact/hooks';
import { W } from '../engine';
import { draw, derive, norm, Face } from '../lib/portrait';
import { PaperPortrait, companyCard } from './paperportrait';
import { E } from '../engine';
import { G } from '../store';
import { recipeOf } from './puppet';

export function faceOf(w: W): Face { return w.face ? norm(w.face) : derive(w.name, w.g, w.age); }
/** A generated pixel face on a canvas. Redraws only when the face changes. */
export function FaceCanvas(p: { face: Partial<Face>; g?: string; bg?: string; label?: string; id?: string; cls?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), key = JSON.stringify([p.face, p.g, p.bg]);
  useEffect(() => { if (ref.current) { try { draw(ref.current, p.face, { g: p.g, bg: p.bg }); } catch (e) { /* a canvas that cannot draw is not worth a crash */ } } }, [key]);
  return <canvas ref={ref} id={p.id} class={p.cls} width={96} height={96} role="img" aria-label={p.label || 'Portrait'} />;
}
/** The card behind a wrestler's portrait in a game: their company's colour, or their brand's. */
export function cardOf(w: W): string {
  const S = G.S, P = S && w.promo && w.promo !== 'FA' ? S.promos[w.promo] : null; if (!P) return companyCard(null);
  const bi = P.brands && w.brand ? P.brands.findIndex((b: any) => b.id === w.brand) : -1;
  return companyCard(E.logoOf(P), bi);
}
/** A wrestler's portrait: their paper portrait (kit/paperportrait.tsx), cut from their own doll, on the colour of
    their company or brand. Somebody with a file is drawn from it, with the portrait settings they picked; everybody
    else from what the game knows of them. */
export function Portrait(p: { w: W; cls?: string }) { const w = p.w, lk = w.look && typeof w.look === 'object' ? w.look : null;
  return <PaperPortrait r={recipeOf(w)} ps={lk ? lk.portrait : undefined} card={cardOf(w)} cls={p.cls} label={'Portrait of ' + w.name} />; }
