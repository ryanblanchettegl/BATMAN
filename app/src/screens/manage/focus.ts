/* Remote and gamepad: keep the highlight where the player is working.
   Some Company actions remove or switch off the very button that was pressed (a signed offer, a scrapped rule, a rival who
   will not take another call). The foundation then sends the highlight to the top of the page; the old interface moved it
   to the nearest control instead. This does the same for the Company pages. Mouse, touch and plain keyboard are untouched. */
import { useLayoutEffect } from 'preact/hooks';
import { ui } from '../../store';
import { NAV } from '../../input';

let held: { x: number; y: number; page: string } | null = null;
// note where the pressed control sits, before its own handler runs
document.addEventListener('click', () => {
  const el = document.activeElement as HTMLElement | null;
  if (!NAV.on || !el || el === document.body || !el.closest('main')) { held = null; return; }
  const r = el.getBoundingClientRect();
  held = { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY, page: ui.page };
}, true);

/** Call in a page component. After a redraw, if the highlighted control is gone or disabled, highlight the nearest one that is left. */
export function useKeepFocus() {
  useLayoutEffect(() => {
    const h = held; held = null;
    if (!h || !NAV.on || ui.modal || h.page !== ui.page) return;
    const ae = document.activeElement as any;
    if (ae && ae !== document.body && ae.isConnected && !ae.disabled) return;
    const main = document.querySelector('main');
    let best: HTMLElement | null = null, bd = Infinity;
    [].forEach.call(main ? main.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled])') : [], (e: HTMLElement) => {
      const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
      const d = Math.abs(r.left + r.width / 2 - h.x) + Math.abs(r.top + r.height / 2 + window.scrollY - h.y) * 2;
      if (d < bd) { bd = d; best = e; }
    });
    if (best) { try { (best as HTMLElement).focus({ preventScroll: true }); (best as HTMLElement).scrollIntoView({ block: 'nearest' }); } catch (e) { /* ignore */ } }
  });
}
