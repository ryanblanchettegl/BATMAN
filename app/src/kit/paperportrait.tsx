/* A wrestler's portrait in paper (rule 2a; Create a Player, docs/plans/create-a-player.md): their own doll, cut head
   and shoulders or to the chest, in the outfit, face and pose the player picks, on a card in the colour of their company or brand. It is
   used wherever the game shows a portrait (`Portrait` in kit/portrait.tsx) for anybody with a Create a Player file;
   everybody else keeps the face drawn from their numbers. Each portrait is painted once and kept, so a list of them
   costs one draw each. */
import { useEffect, useRef } from 'preact/hooks';
import { Scene, build, viewFor, POSES, WAIST } from './scene';
import { Recipe, legs, LEGS0 } from './puppet';
import { AttireKey } from './caw';
import { drawScene, shade } from './paper';

/** The portrait's settings, kept in the file as `portrait`. */
export interface PortraitSet { attire?: AttireKey; expr?: string; pose?: string; bg?: string; frame?: 'head' | 'chest' }
export const PT_POSES: [string, string][] = [['stand', 'Arms down'], ['fists', 'Fists up'], ['flex', 'Flexing'], ['point', 'Pointing'], ['mic', 'On the microphone'], ['onearm', 'One arm up']];
export const PT_FRAMES: [string, string][] = [['head', 'Head and shoulders'], ['chest', 'To the chest']];

const cache = new Map<string, HTMLCanvasElement>();
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
/** The card behind a portrait: the colour of the company they work for, or of their brand (the first brand takes
    the logo's main colour, the next ones its other two). A free agent stands on plain grey card. */
export function companyCard(logo: { c1: string; c2: string; c3: string } | null, brandIndex = -1): string {
  if (!logo) return '#8a8478';
  const c = brandIndex > 0 ? [logo.c1, logo.c2, logo.c3][brandIndex % 3] : logo.c1;
  return shade(c, 0.85);   // a touch deeper, so it reads as card and not as a lamp
}

/** Paint a portrait (or fetch the one already painted) at px by px. */
export function drawPortrait(r: Recipe, ps: PortraitSet = {}, card = '#8a8478', px = 192): HTMLCanvasElement {
  const key = hash(JSON.stringify(r) + JSON.stringify(ps) + card + px);
  const had = cache.get(key); if (had) return had;
  const c = document.createElement('canvas'); c.width = c.height = px;
  const ctx = c.getContext('2d'); if (!ctx) return c;
  const pd = (POSES.find(x => x[0] === (ps.pose || 'stand')) || POSES[0])[1];
  const headY = WAIST + (legs(r) - LEGS0) + 1.95 * r.h * (r.th || 1) + 0.95, chest = ps.frame === 'chest';
  const sc: Scene = { v: 1, id: 'portrait', name: 'Portrait', when: 'portrait', set: 'none', attire: ps.attire || 'primary_ring', slots: [{ id: 'A', n: r.name, role: 'a' }],
    keys: [{ t: 0, figs: { A: { x: 0, y: pd.y ?? WAIST, r: pd.r || 0, f: 1, z: 0.6, p: { ...pd.p }, e: ps.expr != null ? ps.expr : pd.e || '' } },
      props: ps.pose === 'mic' ? [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] : [], cam: chest ? { x: 0.1, y: headY - 1.0, z: 4.4 } : { x: 0.12, y: headY - 0.35, z: 6.6 } }] };
  const bg = card, k = sc.keys[0], v = viewFor(px, px, k.cam);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, px, px);
  // a second card, a shade lighter, cut on the slant behind them
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(0, px * 0.62); ctx.lineTo(px, px * 0.3); ctx.lineTo(px, px); ctx.lineTo(0, px); ctx.closePath(); ctx.fill();
  const b = build(sc, k, { A: r }, 0);
  drawScene(ctx, b.pieces.filter(p => !p.layer), v, 'portrait');
  if (cache.size > 300) cache.clear();
  cache.set(key, c);
  return c;
}

/** A portrait on the page: a canvas that copies the painted portrait. */
export function PaperPortrait(p: { r: Recipe; ps?: PortraitSet; card?: string; cls?: string; label: string; t?: string }) {
  const ref = useRef<HTMLCanvasElement>(null), key = JSON.stringify([p.r, p.ps || null, p.card || '']);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    try { const src = drawPortrait(p.r, p.ps || {}, p.card, 192), x = c.getContext('2d'); if (x) { x.clearRect(0, 0, c.width, c.height); x.drawImage(src, 0, 0, c.width, c.height); } } catch (e) { /* a portrait that cannot draw is not worth a crash */ }
  }, [key]);
  return <canvas ref={ref} class={'pt paperpt' + (p.cls ? ' ' + p.cls : '')} width={192} height={192} role="img" aria-label={p.label} data-t={p.t} />;
}
