/* The overall rating as a small card badge (src/99-overall.js): one number, its colour by tier, so a list can be
   read and sorted at a glance. The words say it in full for a screen reader. */
import { E, W } from '../engine';

export function ovrTier(n: number): string { return n >= 90 ? 'o-gold' : n >= 80 ? 'o-top' : n >= 70 ? 'o-good' : n >= 60 ? 'o-mid' : 'o-low'; }
export function Ovr(p: { w: W; big?: boolean }) {
  const n = E.overallOf(p.w);
  return <b class={'ovrb ' + ovrTier(n) + (p.big ? ' big' : '')} aria-label={'Overall ' + n} title="Overall rating: ring work, crowd, microphone, stamina, how steady and how safe">{n}</b>;
}
